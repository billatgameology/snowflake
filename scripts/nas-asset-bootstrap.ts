// Bounded bootstrap for an already-populated physical snowcrystal share.
//
// This command deliberately inspects only the two known identity roots, the canonical marker,
// the fixed control directories, and (before first marker creation) one catalog-bound private
// manifest witness. It never enumerates a share root or opens collection payload bytes.

import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  NAS_SHARE_MARKER_FORMAT,
  NAS_SHARE_PROJECT_ID,
  openContainedRegularFile,
  parseNasAssetCatalogV1,
  type NasOwnerManifestV1,
  type NasAssetCatalogV1,
} from "./nas-asset-lib.ts";
import { NAS_SHARE_MARKER, NAS_SHARE_MARKER_PATH } from "./nas-root.ts";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_CATALOG_PATH = resolve(PROJECT_ROOT, "docs/nas-assets.json");
const REPORT_FORMAT = "snowflake-nas-asset-bootstrap-report-v1" as const;
const IDENTITY_ROOTS = ["out", "research-cache"] as const;
const CONTROL_CHILDREN = ["staging", "locks", "receipts", "quarantine", "trash"] as const;
const EXACT_MARKER_BYTES = Buffer.from(`${JSON.stringify(NAS_SHARE_MARKER)}\n`, "utf8");
const IDENTITY_WITNESS_ASSET_ID = "research-private-freeze" as const;
const IDENTITY_WITNESS_PREFIX = "research-cache" as const;
const IDENTITY_WITNESS_PATH = "research-cache/RESEARCH-CACHE-MANIFEST.jsonl" as const;
const IDENTITY_WITNESS_FORMAT = "vcc-research-cache-jsonl-v1" as const;
const MAX_IDENTITY_WITNESS_BYTES = 64 * 1024 * 1024;

type BootstrapMode = "dry-run" | "apply";
type BootstrapState = "would-bootstrap" | "bootstrapped" | "already-bootstrapped";

class BootstrapRefusal extends Error {
  override readonly name = "BootstrapRefusal";
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const refuse = (code: string): never => {
  throw new BootstrapRefusal(code);
};

const errno = (error: unknown): string | undefined =>
  error !== null && typeof error === "object" && "code" in error
    ? String((error as { readonly code?: unknown }).code)
    : undefined;

const sameObject = (left: Stats, right: Stats): boolean =>
  left.dev === right.dev && left.ino === right.ino;

interface DirectoryIdentity {
  readonly path: string;
  readonly dev: number;
  readonly ino: number;
}

const inspectRoot = (nasRoot: string): DirectoryIdentity => {
  let initial: Stats;
  try {
    initial = lstatSync(nasRoot);
  } catch {
    return refuse("nas-root-not-ordinary-directory");
  }
  if (!initial.isDirectory() || initial.isSymbolicLink()) {
    return refuse("nas-root-not-ordinary-directory");
  }
  let realRoot: string;
  let final: Stats;
  try {
    realRoot = realpathSync.native(nasRoot);
    final = lstatSync(nasRoot);
  } catch {
    return refuse("nas-root-identity-unstable");
  }
  if (!final.isDirectory() || final.isSymbolicLink() || !sameObject(initial, final)) {
    return refuse("nas-root-identity-unstable");
  }
  return { path: realRoot, dev: final.dev, ino: final.ino };
};

const assertRootIdentity = (lexicalRoot: string, identity: DirectoryIdentity): void => {
  let status: Stats;
  let real: string;
  try {
    status = lstatSync(lexicalRoot);
    real = realpathSync.native(lexicalRoot);
  } catch {
    return refuse("nas-root-identity-unstable");
  }
  if (
    !status.isDirectory() ||
    status.isSymbolicLink() ||
    status.dev !== identity.dev ||
    status.ino !== identity.ino ||
    real !== identity.path
  ) {
    refuse("nas-root-identity-unstable");
  }
};

const assertDirectoryIdentity = (
  lexicalPath: string,
  identity: DirectoryIdentity,
  invalidCode: string,
): void => {
  let status: Stats;
  let real: string;
  try {
    status = lstatSync(lexicalPath);
    real = realpathSync.native(lexicalPath);
  } catch {
    return refuse(invalidCode);
  }
  if (
    !status.isDirectory() ||
    status.isSymbolicLink() ||
    status.dev !== identity.dev ||
    status.ino !== identity.ino ||
    real !== identity.path
  ) {
    refuse(invalidCode);
  }
};

const inspectOrdinaryDirectory = (
  path: string,
  expectedRealPath: string,
  invalidCode: string,
): DirectoryIdentity => {
  let initial: Stats;
  let real: string;
  let final: Stats;
  try {
    initial = lstatSync(path);
    real = realpathSync.native(path);
    final = lstatSync(path);
  } catch {
    return refuse(invalidCode);
  }
  if (
    !initial.isDirectory() ||
    initial.isSymbolicLink() ||
    !final.isDirectory() ||
    final.isSymbolicLink() ||
    !sameObject(initial, final) ||
    real !== expectedRealPath
  ) {
    return refuse(invalidCode);
  }
  return { path: expectedRealPath, dev: final.dev, ino: final.ino };
};

const pathState = (path: string): "missing" | "present" => {
  try {
    lstatSync(path);
    return "present";
  } catch (error) {
    if (errno(error) === "ENOENT") return "missing";
    return refuse("filesystem-inspection-failed");
  }
};

const identityWitness = (catalogue: NasAssetCatalogV1): NasOwnerManifestV1 => {
  const matches = catalogue.collections.filter(
    (collection) => collection.assetId === IDENTITY_WITNESS_ASSET_ID,
  );
  if (matches.length !== 1) return refuse("catalogue-bootstrap-contract-invalid");
  const collection = matches[0];
  const manifest = collection?.ownerManifest;
  if (
    collection?.state !== "active" ||
    collection.privacy !== "private" ||
    collection.storageClass !== "private-source" ||
    manifest === null ||
    manifest === undefined ||
    manifest.storage !== "nas-private" ||
    manifest.path !== IDENTITY_WITNESS_PATH ||
    manifest.format !== IDENTITY_WITNESS_FORMAT ||
    manifest.selector.kind !== "jsonl-field-equals" ||
    manifest.selector.recordType !== "file" ||
    manifest.selector.field !== "storageClass" ||
    manifest.selector.equals !== "ignored-research-cache" ||
    !Number.isSafeInteger(manifest.bytes) ||
    manifest.bytes <= 0 ||
    manifest.bytes > MAX_IDENTITY_WITNESS_BYTES ||
    !/^[0-9a-f]{64}$/u.test(manifest.sha256)
  ) {
    return refuse("catalogue-bootstrap-contract-invalid");
  }
  return manifest;
};

/**
 * Full-hash the one private manifest that already identifies the populated share. The descriptor
 * and final path are both revalidated so a decoy with only the two expected directory names does
 * not become trusted merely by receiving our marker.
 */
const verifyIdentityWitness = (
  realRoot: string,
  manifest: NasOwnerManifestV1,
): void => {
  const opened = openContainedRegularFile(
    realRoot,
    manifest.path,
    IDENTITY_WITNESS_PREFIX,
  );
  if (opened.kind !== "ok") return refuse("share-identity-witness-invalid");

  try {
    if (opened.byteLength !== manifest.bytes) refuse("share-identity-witness-invalid");
    const digest = createHash("sha256");
    const buffer = Buffer.alloc(Math.min(1024 * 1024, manifest.bytes));
    let total = 0;
    while (total < manifest.bytes) {
      const requested = Math.min(buffer.byteLength, manifest.bytes - total);
      const count = readSync(opened.fd, buffer, 0, requested, total);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      total += count;
    }
    const extra = Buffer.alloc(1);
    const extraCount = readSync(opened.fd, extra, 0, 1, total);
    const after = fstatSync(opened.fd);
    const current = lstatSync(opened.path);
    const currentReal = realpathSync.native(opened.path);
    if (
      total !== manifest.bytes ||
      extraCount !== 0 ||
      digest.digest("hex") !== manifest.sha256 ||
      !after.isFile() ||
      after.nlink !== 1 ||
      after.dev !== opened.dev ||
      after.ino !== opened.ino ||
      after.size !== manifest.bytes ||
      !current.isFile() ||
      current.isSymbolicLink() ||
      current.nlink !== 1 ||
      current.dev !== opened.dev ||
      current.ino !== opened.ino ||
      current.size !== manifest.bytes ||
      currentReal !== opened.path
    ) {
      refuse("share-identity-witness-invalid");
    }
  } catch (error) {
    if (error instanceof BootstrapRefusal) throw error;
    return refuse("share-identity-witness-invalid");
  } finally {
    closeSync(opened.fd);
  }
};

const inspectMarker = (realRoot: string): "missing" | "valid" => {
  const markerPath = resolve(realRoot, NAS_SHARE_MARKER_PATH);
  if (pathState(markerPath) === "missing") return "missing";

  let initial: Stats;
  try {
    initial = lstatSync(markerPath);
  } catch {
    return refuse("share-marker-invalid");
  }
  if (
    !initial.isFile() ||
    initial.isSymbolicLink() ||
    initial.nlink !== 1 ||
    initial.size !== EXACT_MARKER_BYTES.byteLength
  ) {
    return refuse("share-marker-invalid");
  }

  let fd: number;
  try {
    fd = openSync(
      markerPath,
      constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
    );
  } catch {
    return refuse("share-marker-invalid");
  }
  try {
    const opened = fstatSync(fd);
    const buffer = Buffer.alloc(EXACT_MARKER_BYTES.byteLength + 1);
    let total = 0;
    while (total < buffer.byteLength) {
      const count = readSync(fd, buffer, total, buffer.byteLength - total, total);
      if (count === 0) break;
      total += count;
    }
    const after = fstatSync(fd);
    const current = lstatSync(markerPath);
    const realMarker = realpathSync.native(markerPath);
    if (
      !opened.isFile() ||
      opened.nlink !== 1 ||
      !sameObject(initial, opened) ||
      !sameObject(opened, after) ||
      !sameObject(after, current) ||
      current.isSymbolicLink() ||
      current.nlink !== 1 ||
      opened.size !== EXACT_MARKER_BYTES.byteLength ||
      after.size !== EXACT_MARKER_BYTES.byteLength ||
      current.size !== EXACT_MARKER_BYTES.byteLength ||
      total !== EXACT_MARKER_BYTES.byteLength ||
      !buffer.subarray(0, total).equals(EXACT_MARKER_BYTES) ||
      realMarker !== markerPath
    ) {
      return refuse("share-marker-invalid");
    }
    return "valid";
  } catch (error) {
    if (error instanceof BootstrapRefusal) throw error;
    return refuse("share-marker-invalid");
  } finally {
    closeSync(fd);
  }
};

interface ControlInspection {
  readonly requiredPaths: readonly string[];
  readonly missingPaths: readonly string[];
  readonly present: number;
}

const inspectControlDirectories = (
  catalogue: NasAssetCatalogV1,
  realRoot: string,
): ControlInspection => {
  const controlPath = resolve(realRoot, catalogue.controlRoot);
  const requiredPaths = [
    controlPath,
    ...CONTROL_CHILDREN.map((child) => resolve(controlPath, child)),
  ];
  const missingPaths: string[] = [];
  for (const path of requiredPaths) {
    if (pathState(path) === "missing") {
      missingPaths.push(path);
      continue;
    }
    inspectOrdinaryDirectory(path, path, "control-directory-invalid");
  }
  return {
    requiredPaths,
    missingPaths,
    present: requiredPaths.length - missingPaths.length,
  };
};

const assertCanonicalCatalogue = (catalogue: NasAssetCatalogV1): void => {
  if (
    catalogue.projectId !== NAS_SHARE_PROJECT_ID ||
    catalogue.shareMarker.path !== NAS_SHARE_MARKER_PATH ||
    catalogue.shareMarker.format !== NAS_SHARE_MARKER_FORMAT ||
    catalogue.shareMarker.projectId !== NAS_SHARE_PROJECT_ID ||
    catalogue.controlRoot !== "_control"
  ) {
    refuse("catalogue-bootstrap-contract-invalid");
  }
};

const unsupportedDirectorySync = (error: unknown): boolean =>
  ["EINVAL", "ENOSYS", "ENOTSUP"].includes(errno(error) ?? "");

const fsyncDirectoryWhereSupported = (path: string): void => {
  if (process.platform === "win32") return;
  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY);
  } catch (error) {
    if (unsupportedDirectorySync(error)) return;
    return refuse("directory-sync-failed");
  }
  try {
    fsyncSync(fd);
  } catch (error) {
    if (!unsupportedDirectorySync(error)) refuse("directory-sync-failed");
  } finally {
    closeSync(fd);
  }
};

const createKnownDirectoryExclusively = (path: string): DirectoryIdentity => {
  try {
    mkdirSync(path, { mode: 0o700 });
  } catch (error) {
    if (error instanceof BootstrapRefusal) throw error;
    if (errno(error) === "EEXIST") return refuse("control-directory-create-collision");
    return refuse("control-directory-create-failed");
  }
  const identity = inspectOrdinaryDirectory(path, path, "control-directory-create-failed");
  fsyncDirectoryWhereSupported(resolve(path, ".."));
  return identity;
};

const cleanupCreatedDirectories = (created: readonly DirectoryIdentity[]): void => {
  for (const identity of [...created].reverse()) {
    try {
      const current = lstatSync(identity.path);
      if (
        !current.isDirectory() ||
        current.isSymbolicLink() ||
        current.dev !== identity.dev ||
        current.ino !== identity.ino
      ) {
        continue;
      }
      rmdirSync(identity.path);
      try {
        fsyncDirectoryWhereSupported(resolve(identity.path, ".."));
      } catch {
        // Cleanup is best effort and never widens to a path whose inode was not created here.
      }
    } catch {
      // A non-empty, replaced, or no-longer-addressable directory is intentionally preserved.
    }
  }
};

interface MarkerIdentity {
  readonly dev: number;
  readonly ino: number;
}

const cleanupCreatedMarker = (path: string, identity: MarkerIdentity | null, realRoot: string): void => {
  if (identity === null) return;
  try {
    const current = lstatSync(path);
    if (
      current.isFile() &&
      !current.isSymbolicLink() &&
      current.nlink === 1 &&
      current.dev === identity.dev &&
      current.ino === identity.ino
    ) {
      unlinkSync(path);
      try {
        fsyncDirectoryWhereSupported(realRoot);
      } catch {
        // Preserve the original refusal. A subsequent bootstrap still validates the marker path.
      }
    }
  } catch {
    // Never delete a path whose identity cannot be re-established.
  }
};

const createMarkerExclusively = (realRoot: string, validateCommittedState: () => void): void => {
  const markerPath = resolve(realRoot, NAS_SHARE_MARKER_PATH);
  let fd: number;
  try {
    fd = openSync(
      markerPath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
      0o600,
    );
  } catch (error) {
    if (errno(error) === "EEXIST") return refuse("share-marker-create-collision");
    return refuse("share-marker-create-failed");
  }

  let identity: MarkerIdentity | null = null;
  let closed = false;
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1) refuse("share-marker-create-failed");
    identity = { dev: opened.dev, ino: opened.ino };
    writeFileSync(fd, EXACT_MARKER_BYTES);
    const written = fstatSync(fd);
    if (
      !written.isFile() ||
      written.nlink !== 1 ||
      written.dev !== opened.dev ||
      written.ino !== opened.ino ||
      written.size !== EXACT_MARKER_BYTES.byteLength
    ) {
      refuse("share-marker-write-failed");
    }
    fsyncSync(fd);
    closeSync(fd);
    closed = true;
    fsyncDirectoryWhereSupported(realRoot);
    if (inspectMarker(realRoot) !== "valid") refuse("share-marker-write-failed");
    // Keep the final directory/root validation inside the marker cleanup boundary. If a known
    // component changed during publication, remove only the marker inode created above and leave
    // the already-created empty control directories for an explicit retry.
    validateCommittedState();
  } catch (error) {
    if (!closed) {
      try {
        closeSync(fd);
      } catch {
        // Marker cleanup below is identity-bound and does not rely on close succeeding.
      }
    }
    cleanupCreatedMarker(markerPath, identity, realRoot);
    if (error instanceof BootstrapRefusal) throw error;
    return refuse("share-marker-write-failed");
  }
};

export interface NasAssetBootstrapHooks {
  /** Fixture-only race hook, called before each child after the control-root identity is captured. */
  readonly beforeControlChildCreate?: (
    controlPath: string,
    childPath: string,
    childIndex: number,
  ) => void;
  /** Fixture-only race hook. Production callers leave this unset. */
  readonly beforeMarkerCreate?: (markerPath: string) => void;
}

export interface NasAssetBootstrapReport {
  readonly format: typeof REPORT_FORMAT;
  readonly command: "bootstrap";
  readonly ok: true;
  readonly mode: BootstrapMode;
  readonly state: BootstrapState;
  readonly identityRootsValidated: 2;
  readonly controlDirectories: {
    readonly required: 6;
    readonly presentBefore: number;
    readonly planned: number;
    readonly created: number;
  };
  readonly marker: "would-create" | "created" | "validated";
  readonly limits: readonly string[];
}

const successReport = (
  mode: BootstrapMode,
  state: BootstrapState,
  presentBefore: number,
  planned: number,
  created: number,
  marker: NasAssetBootstrapReport["marker"],
): NasAssetBootstrapReport => ({
  format: REPORT_FORMAT,
  command: "bootstrap",
  ok: true,
  mode,
  state,
  identityRootsValidated: 2,
  controlDirectories: {
    required: 6,
    presentBefore,
    planned,
    created,
  },
  marker,
  limits: [
    "Only the canonical marker, two identity roots, six fixed control directories, and the catalog-bound identity witness required before first marker creation were eligible for inspection.",
    "Unknown root entries were not enumerated or emitted.",
    "No collection payload was opened; the identity witness was the only eligible non-control file. No payload was moved, modified, or deleted.",
    "Directory identity checks bound the deterministic swap fixtures; Node does not provide descriptor-relative mkdir on every supported host.",
  ],
});

/** Bootstrap one explicitly selected share root without enumerating or touching payloads. */
export function bootstrapNasAssetRoot(
  nasRoot: string,
  catalogue: NasAssetCatalogV1,
  apply: boolean,
  hooks: NasAssetBootstrapHooks = {},
): NasAssetBootstrapReport {
  if (!isAbsolute(nasRoot)) refuse("nas-root-must-be-absolute");
  assertCanonicalCatalogue(catalogue);
  const witness = identityWitness(catalogue);

  const lexicalRoot = resolve(nasRoot);
  const rootIdentity = inspectRoot(lexicalRoot);
  for (const name of IDENTITY_ROOTS) {
    const path = resolve(rootIdentity.path, name);
    inspectOrdinaryDirectory(path, path, "identity-root-invalid");
  }
  const markerState = inspectMarker(rootIdentity.path);

  if (markerState === "valid") {
    const control = inspectControlDirectories(catalogue, rootIdentity.path);
    if (control.missingPaths.length !== 0) refuse("partial-bootstrap-state");
    assertRootIdentity(lexicalRoot, rootIdentity);
    return successReport(
      apply ? "apply" : "dry-run",
      "already-bootstrapped",
      control.present,
      0,
      0,
      "validated",
    );
  }

  const controlPath = resolve(rootIdentity.path, catalogue.controlRoot);
  if (pathState(controlPath) !== "missing") refuse("control-root-present-before-marker");
  verifyIdentityWitness(rootIdentity.path, witness);
  assertRootIdentity(lexicalRoot, rootIdentity);

  if (!apply) {
    return successReport(
      "dry-run",
      "would-bootstrap",
      0,
      6,
      0,
      "would-create",
    );
  }

  const createdDirectories: DirectoryIdentity[] = [];
  let finalControl: ControlInspection;
  try {
    assertRootIdentity(lexicalRoot, rootIdentity);
    const controlIdentity = createKnownDirectoryExclusively(controlPath);
    createdDirectories.push(controlIdentity);
    assertRootIdentity(lexicalRoot, rootIdentity);
    assertDirectoryIdentity(controlPath, controlIdentity, "control-directory-identity-unstable");

    for (const [index, child] of CONTROL_CHILDREN.entries()) {
      const childPath = resolve(controlPath, child);
      hooks.beforeControlChildCreate?.(controlPath, childPath, index);
      assertRootIdentity(lexicalRoot, rootIdentity);
      assertDirectoryIdentity(controlPath, controlIdentity, "control-directory-identity-unstable");
      const childIdentity = createKnownDirectoryExclusively(childPath);
      createdDirectories.push(childIdentity);
      assertRootIdentity(lexicalRoot, rootIdentity);
      assertDirectoryIdentity(controlPath, controlIdentity, "control-directory-identity-unstable");
      assertDirectoryIdentity(childPath, childIdentity, "control-directory-identity-unstable");
    }
    assertRootIdentity(lexicalRoot, rootIdentity);
    for (const name of IDENTITY_ROOTS) {
      const path = resolve(rootIdentity.path, name);
      inspectOrdinaryDirectory(path, path, "identity-root-invalid");
    }
    finalControl = inspectControlDirectories(catalogue, rootIdentity.path);
    if (finalControl.missingPaths.length !== 0) refuse("control-directory-create-failed");
    if (inspectMarker(rootIdentity.path) !== "missing") refuse("share-marker-create-collision");
  } catch (error) {
    if (!(error instanceof BootstrapRefusal && error.code === "share-marker-create-collision")) {
      cleanupCreatedDirectories(createdDirectories);
    }
    throw error;
  }

  hooks.beforeMarkerCreate?.(resolve(rootIdentity.path, NAS_SHARE_MARKER_PATH));
  assertRootIdentity(lexicalRoot, rootIdentity);
  try {
    createMarkerExclusively(rootIdentity.path, () => {
      assertRootIdentity(lexicalRoot, rootIdentity);
      for (const name of IDENTITY_ROOTS) {
        const path = resolve(rootIdentity.path, name);
        inspectOrdinaryDirectory(path, path, "identity-root-invalid");
      }
      for (const path of finalControl.requiredPaths) {
        inspectOrdinaryDirectory(path, path, "control-directory-invalid");
      }
      verifyIdentityWitness(rootIdentity.path, witness);
      assertRootIdentity(lexicalRoot, rootIdentity);
      if (inspectMarker(rootIdentity.path) !== "valid") refuse("share-marker-write-failed");
    });
  } catch (error) {
    if (!(error instanceof BootstrapRefusal && error.code === "share-marker-create-collision")) {
      cleanupCreatedDirectories(createdDirectories);
    }
    throw error;
  }
  return successReport(
    "apply",
    "bootstrapped",
    0,
    6,
    createdDirectories.length,
    "created",
  );
}

interface BootstrapArguments {
  readonly nasRoot: string;
  readonly apply: boolean;
}

const parseArguments = (argv: readonly string[]): BootstrapArguments => {
  let nasRoot: string | null = null;
  let apply = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    if (argument === "--apply") {
      if (apply) refuse("invalid-arguments");
      apply = true;
      continue;
    }
    if (argument !== "--nas-root" || nasRoot !== null) refuse("invalid-arguments");
    const value = argv[index + 1];
    if (value === undefined || value === "" || value.startsWith("--")) refuse("invalid-arguments");
    nasRoot = value;
    index += 1;
  }
  if (nasRoot === null) throw new BootstrapRefusal("nas-root-must-be-absolute");
  if (!isAbsolute(nasRoot)) refuse("nas-root-must-be-absolute");
  return { nasRoot, apply };
};

const loadCanonicalCatalogue = (): NasAssetCatalogV1 => {
  try {
    return parseNasAssetCatalogV1(readFileSync(DEFAULT_CATALOG_PATH, "utf8"));
  } catch {
    return refuse("catalogue-load-failed");
  }
};

export interface NasAssetBootstrapCliIo {
  readonly catalogue?: NasAssetCatalogV1;
  /** Fixture-only race hook. Production callers leave this unset. */
  readonly hooks?: NasAssetBootstrapHooks;
  readonly write?: (line: string) => void;
}

/** Run the bootstrap and emit exactly one deterministic machine-readable JSON document. */
export function runNasAssetBootstrapCli(
  argv: readonly string[],
  io: NasAssetBootstrapCliIo = {},
): number {
  const write = io.write ?? ((line: string) => console.log(line));
  try {
    const options = parseArguments(argv);
    const report = bootstrapNasAssetRoot(
      options.nasRoot,
      io.catalogue ?? loadCanonicalCatalogue(),
      options.apply,
      io.hooks,
    );
    write(JSON.stringify(report));
    return 0;
  } catch (error) {
    write(JSON.stringify({
      format: REPORT_FORMAT,
      command: "bootstrap",
      ok: false,
      defects: [{
        code: error instanceof BootstrapRefusal ? error.code : "bootstrap-internal-error",
        count: 1,
      }],
    }));
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  process.exitCode = runNasAssetBootstrapCli(process.argv.slice(2));
}
