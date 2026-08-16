import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  runNasAssetBootstrapCli,
  type NasAssetBootstrapCliIo,
} from "../../scripts/nas-asset-bootstrap.ts";
import {
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
} from "../../scripts/nas-asset-lib.ts";
import { NAS_SHARE_MARKER, NAS_SHARE_MARKER_PATH } from "../../scripts/nas-root.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const CANONICAL_CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(join(REPOSITORY_ROOT, "docs/nas-assets.json"), "utf8"),
);
const IDENTITY_WITNESS_BYTES = Buffer.from(
  '{"format":"fixture-private-owner-manifest-v1","type":"file"}\n',
  "utf8",
);
const CANONICAL_IDENTITY_COLLECTION = CANONICAL_CATALOGUE.collections.find(
  (collection) => collection.assetId === "research-private-freeze",
);
const CANONICAL_IDENTITY_MANIFEST = CANONICAL_IDENTITY_COLLECTION?.ownerManifest;
if (CANONICAL_IDENTITY_MANIFEST === null || CANONICAL_IDENTITY_MANIFEST === undefined) {
  throw new Error("canonical identity witness collection is absent");
}
const CATALOGUE = parseNasAssetCatalogV1(JSON.stringify({
  ...CANONICAL_CATALOGUE,
  collections: CANONICAL_CATALOGUE.collections.map((collection) =>
    collection.ownerManifest?.path === CANONICAL_IDENTITY_MANIFEST.path &&
    collection.ownerManifest.sha256 === CANONICAL_IDENTITY_MANIFEST.sha256
      ? {
          ...collection,
          ownerManifest: {
            ...collection.ownerManifest,
            bytes: IDENTITY_WITNESS_BYTES.byteLength,
            sha256: createHash("sha256").update(IDENTITY_WITNESS_BYTES).digest("hex"),
          },
        }
      : collection),
}));
const CONTROL_CHILDREN = ["staging", "locks", "receipts", "quarantine", "trash"] as const;
const EXACT_MARKER = `${JSON.stringify(NAS_SHARE_MARKER)}\n`;
const temporaryRoots: string[] = [];

const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `nas-bootstrap-${label}-`));
  temporaryRoots.push(root);
  return root;
};

const makeCandidateShare = (label: string): string => {
  const root = temporaryRoot(label);
  mkdirSync(join(root, "collections"));
  const witness = CATALOGUE.collections.find(
    (collection) => collection.assetId === "research-private-freeze",
  )?.ownerManifest;
  if (witness === null || witness === undefined) throw new Error("fixture witness is absent");
  mkdirSync(resolve(join(root, witness.path), ".."), { recursive: true });
  writeFileSync(join(root, witness.path), IDENTITY_WITNESS_BYTES);
  return root;
};

const CAN_SYMLINK = (() => {
  const root = temporaryRoot("symlink-probe");
  try {
    symlinkSync(join(root, "missing"), join(root, "link"));
    return true;
  } catch {
    return false;
  }
})();

const CAN_HARDLINK = (() => {
  const root = temporaryRoot("hardlink-probe");
  try {
    writeFileSync(join(root, "source"), "probe");
    linkSync(join(root, "source"), join(root, "alias"));
    return true;
  } catch {
    return false;
  }
})();

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

interface CliResult {
  readonly code: number;
  readonly raw: string;
  readonly report: Record<string, unknown>;
}

const run = (
  argv: readonly string[],
  overrides: Omit<NasAssetBootstrapCliIo, "write" | "catalogue"> = {},
  catalogue: NasAssetCatalogV1 = CATALOGUE,
): CliResult => {
  const lines: string[] = [];
  const code = runNasAssetBootstrapCli(argv, {
    catalogue,
    ...overrides,
    write: (line) => lines.push(line),
  });
  expect(lines).toHaveLength(1);
  const raw = lines[0] as string;
  return { code, raw, report: JSON.parse(raw) as Record<string, unknown> };
};

const expectOrdinaryDirectory = (path: string): void => {
  const status = lstatSync(path);
  expect(status.isDirectory()).toBe(true);
  expect(status.isSymbolicLink()).toBe(false);
};

const expectControlTree = (root: string): void => {
  const control = join(root, CATALOGUE.controlRoot);
  expectOrdinaryDirectory(control);
  for (const child of CONTROL_CHILDREN) expectOrdinaryDirectory(join(control, child));
};

describe("bounded NAS share bootstrap argument boundary", () => {
  it.each([
    { argv: [] },
    { argv: ["--apply"] },
    { argv: ["--nas-root", "relative/share"] },
    { argv: ["--nas-root"] },
    { argv: ["--nas-root", "/tmp/one", "--nas-root", "/tmp/two"] },
    { argv: ["--nas-root", "/tmp/one", "--apply", "--apply"] },
    { argv: ["--nas-root", "/tmp/one", "--unknown-private-switch"] },
  ])("refuses malformed arguments with one generic JSON document: $argv", ({ argv }) => {
    const result = run(argv);
    expect(result.code).toBe(1);
    expect(result.report).toMatchObject({
      format: "snowflake-nas-asset-bootstrap-report-v1",
      command: "bootstrap",
      ok: false,
    });
    expect(result.raw).not.toContain("unknown-private-switch");
    expect(result.raw.trim().startsWith("{")).toBe(true);
  });
});

describe("bounded NAS share bootstrap", () => {
  it("refuses a catalogue that redirects the fixed bootstrap control root", () => {
    const root = makeCandidateShare("redirected-control-root");
    const redirected = {
      ...CATALOGUE,
      controlRoot: "payload-control",
    } as unknown as NasAssetCatalogV1;

    const result = run(["--nas-root", root, "--apply"], {}, redirected);

    expect(result.code).toBe(1);
    expect(result.raw).toContain("catalogue-bootstrap-contract-invalid");
    expect(existsSync(join(root, "payload-control"))).toBe(false);
    expect(existsSync(join(root, CATALOGUE.controlRoot))).toBe(false);
    expect(existsSync(join(root, NAS_SHARE_MARKER_PATH))).toBe(false);
  });

  it("refuses an arbitrary collection-root decoy and a corrupted catalog-bound witness", () => {
    const decoy = temporaryRoot("identity-decoy");
    mkdirSync(join(decoy, "collections"));

    const missing = run(["--nas-root", decoy, "--apply"]);
    expect(missing.code).toBe(1);
    expect(missing.raw).toContain("share-identity-witness-invalid");
    expect(existsSync(join(decoy, CATALOGUE.controlRoot))).toBe(false);
    expect(existsSync(join(decoy, NAS_SHARE_MARKER_PATH))).toBe(false);

    const witness = CATALOGUE.collections.find(
      (collection) => collection.assetId === "research-private-freeze",
    )?.ownerManifest;
    if (witness === null || witness === undefined) throw new Error("fixture witness is absent");
    mkdirSync(resolve(join(decoy, witness.path), ".."), { recursive: true });
    writeFileSync(join(decoy, witness.path), Buffer.alloc(IDENTITY_WITNESS_BYTES.byteLength, 0x78));

    const corrupted = run(["--nas-root", decoy]);
    expect(corrupted.code).toBe(1);
    expect(corrupted.raw).toContain("share-identity-witness-invalid");
    expect(corrupted.raw).not.toContain(witness.path);
    expect(corrupted.raw).not.toContain(decoy);
    expect(existsSync(join(decoy, CATALOGUE.controlRoot))).toBe(false);
    expect(existsSync(join(decoy, NAS_SHARE_MARKER_PATH))).toBe(false);
  });

  it("never adopts a preexisting permissive control tree before the marker", () => {
    const root = makeCandidateShare("forged-control");
    const control = join(root, CATALOGUE.controlRoot);
    mkdirSync(control);
    chmodSync(control, 0o777);
    mkdirSync(join(control, "staging"));
    const planted = join(control, "staging", "planted-private-state");
    writeFileSync(planted, "must-remain-untouched");

    const result = run(["--nas-root", root, "--apply"]);

    expect(result.code).toBe(1);
    expect(result.raw).toContain("control-root-present-before-marker");
    expect(readFileSync(planted, "utf8")).toBe("must-remain-untouched");
    expect(readdirSync(control)).toEqual(["staging"]);
    expect(existsSync(join(root, NAS_SHARE_MARKER_PATH))).toBe(false);
  });

  it.skipIf(!CAN_SYMLINK)("revalidates the captured control identity before the first child mkdir", () => {
    const root = makeCandidateShare("control-parent-swap");
    const outside = temporaryRoot("control-parent-swap-outside");
    let hookCalls = 0;

    const result = run(["--nas-root", root, "--apply"], {
      hooks: {
        beforeControlChildCreate: (controlPath, childPath, childIndex) => {
          hookCalls += 1;
          expect(childIndex).toBe(0);
          expect(childPath).toBe(join(controlPath, "staging"));
          rmdirSync(controlPath);
          symlinkSync(outside, controlPath, "dir");
        },
      },
    });

    expect(hookCalls).toBe(1);
    expect(result.code).toBe(1);
    expect(result.raw).toContain("control-directory-identity-unstable");
    expect(result.raw).not.toContain(root);
    expect(result.raw).not.toContain(outside);
    expect(readdirSync(outside)).toEqual([]);
    expect(lstatSync(join(root, CATALOGUE.controlRoot)).isSymbolicLink()).toBe(true);
    expect(existsSync(join(root, NAS_SHARE_MARKER_PATH))).toBe(false);
  });

  it("is a deterministic no-write dry run and never emits unknown root names", () => {
    const root = makeCandidateShare("dry-run");
    const unknownName = "private-customer-name-that-must-not-be-emitted.bin";
    const payload = join(root, "collections", "payload.bin");
    writeFileSync(join(root, unknownName), "unknown-root-byte");
    writeFileSync(payload, "payload-must-remain");
    const before = readdirSync(root).sort();

    const first = run(["--nas-root", root]);
    const second = run(["--nas-root", root]);

    expect(first.code).toBe(0);
    expect(first.raw).toBe(second.raw);
    expect(first.report).toMatchObject({
      ok: true,
      mode: "dry-run",
      state: "would-bootstrap",
      identityRootsValidated: 1,
      controlDirectories: {
        required: 6,
        presentBefore: 0,
        planned: 6,
        created: 0,
      },
      marker: "would-create",
    });
    expect(readdirSync(root).sort()).toEqual(before);
    expect(existsSync(join(root, CATALOGUE.controlRoot))).toBe(false);
    expect(existsSync(join(root, NAS_SHARE_MARKER_PATH))).toBe(false);
    expect(readFileSync(payload, "utf8")).toBe("payload-must-remain");
    expect(first.raw).not.toContain(unknownName);
    expect(first.raw).not.toContain(root);
  });

  it("creates only the fixed control tree and writes the exact marker last", () => {
    const root = makeCandidateShare("apply");
    const payload = join(root, "collections", "private-source.bin");
    writeFileSync(payload, "private-payload-is-untouched");
    let observedPreMarkerState = false;

    const result = run(["--nas-root", root, "--apply"], {
      hooks: {
        beforeMarkerCreate: (markerPath) => {
          expect(markerPath).toBe(join(root, NAS_SHARE_MARKER_PATH));
          expect(existsSync(markerPath)).toBe(false);
          expectControlTree(root);
          expect(readFileSync(payload, "utf8")).toBe("private-payload-is-untouched");
          observedPreMarkerState = true;
        },
      },
    });

    expect(result.code).toBe(0);
    expect(observedPreMarkerState).toBe(true);
    expect(result.report).toMatchObject({
      ok: true,
      mode: "apply",
      state: "bootstrapped",
      controlDirectories: {
        required: 6,
        presentBefore: 0,
        planned: 6,
        created: 6,
      },
      marker: "created",
    });
    expectControlTree(root);
    expect(readFileSync(join(root, NAS_SHARE_MARKER_PATH), "utf8")).toBe(EXACT_MARKER);
    const markerStatus = lstatSync(join(root, NAS_SHARE_MARKER_PATH));
    expect(markerStatus.isFile()).toBe(true);
    expect(markerStatus.isSymbolicLink()).toBe(false);
    expect(markerStatus.nlink).toBe(1);
    expect(readFileSync(payload, "utf8")).toBe("private-payload-is-untouched");
    expect(readdirSync(root).sort()).toEqual([
      CATALOGUE.controlRoot,
      NAS_SHARE_MARKER_PATH,
      "collections",
    ].sort());
  });

  it("is safely idempotent and validates rather than rewriting an initialized share", () => {
    const root = makeCandidateShare("idempotent");
    expect(run(["--nas-root", root, "--apply"]).code).toBe(0);
    const markerPath = join(root, NAS_SHARE_MARKER_PATH);
    const initialMarker = lstatSync(markerPath);
    const existingReceipt = join(root, CATALOGUE.controlRoot, "receipts", "existing.json");
    writeFileSync(existingReceipt, "existing-control-byte");

    const result = run(["--nas-root", root, "--apply"]);
    const finalMarker = lstatSync(markerPath);

    expect(result.code).toBe(0);
    expect(result.report).toMatchObject({
      ok: true,
      mode: "apply",
      state: "already-bootstrapped",
      controlDirectories: {
        required: 6,
        presentBefore: 6,
        planned: 0,
        created: 0,
      },
      marker: "validated",
    });
    expect(finalMarker.dev).toBe(initialMarker.dev);
    expect(finalMarker.ino).toBe(initialMarker.ino);
    expect(finalMarker.size).toBe(initialMarker.size);
    expect(finalMarker.mtimeMs).toBe(initialMarker.mtimeMs);
    expect(readFileSync(markerPath, "utf8")).toBe(EXACT_MARKER);
    expect(readFileSync(existingReceipt, "utf8")).toBe("existing-control-byte");
  });

  it("refuses missing identity roots, non-directory roots, and a partial initialized state", () => {
    const missingIdentity = temporaryRoot("missing-identity");
    mkdirSync(join(missingIdentity, "unrelated"));
    const missing = run(["--nas-root", missingIdentity, "--apply"]);
    expect(missing.code).toBe(1);
    expect(missing.raw).toContain("identity-root-invalid");
    expect(existsSync(join(missingIdentity, CATALOGUE.controlRoot))).toBe(false);

    const parent = temporaryRoot("file-root-parent");
    const fileRoot = join(parent, "not-a-directory");
    writeFileSync(fileRoot, "ordinary-file");
    const nonDirectory = run(["--nas-root", fileRoot, "--apply"]);
    expect(nonDirectory.code).toBe(1);
    expect(nonDirectory.raw).toContain("nas-root-not-ordinary-directory");

    const partial = makeCandidateShare("partial-state");
    writeFileSync(join(partial, NAS_SHARE_MARKER_PATH), EXACT_MARKER);
    const partialResult = run(["--nas-root", partial, "--apply"]);
    expect(partialResult.code).toBe(1);
    expect(partialResult.raw).toContain("partial-bootstrap-state");
    expect(existsSync(join(partial, CATALOGUE.controlRoot))).toBe(false);
    expect(readFileSync(join(partial, NAS_SHARE_MARKER_PATH), "utf8")).toBe(EXACT_MARKER);
  });

  it("refuses wrong, partial, and non-canonical markers without creating control state", () => {
    const markerValues = [
      "{\"format\":",
      `${JSON.stringify({ ...NAS_SHARE_MARKER, projectId: "wrong-project" })}\n`,
      `${JSON.stringify(NAS_SHARE_MARKER, null, 2)}\n`,
    ];
    for (const [index, marker] of markerValues.entries()) {
      const root = makeCandidateShare(`wrong-marker-${index}`);
      const markerPath = join(root, NAS_SHARE_MARKER_PATH);
      writeFileSync(markerPath, marker);
      const result = run(["--nas-root", root, "--apply"]);
      expect(result.code).toBe(1);
      expect(result.raw).toContain("share-marker-invalid");
      expect(readFileSync(markerPath, "utf8")).toBe(marker);
      expect(existsSync(join(root, CATALOGUE.controlRoot))).toBe(false);
    }
  });

  it.skipIf(!CAN_SYMLINK)("refuses linked roots and linked control components before mutation", () => {
    const actual = makeCandidateShare("actual-root");
    const linkParent = temporaryRoot("linked-root-parent");
    const linkedRoot = join(linkParent, "share");
    symlinkSync(actual, linkedRoot, "dir");
    const linkedRootResult = run(["--nas-root", linkedRoot, "--apply"]);
    expect(linkedRootResult.code).toBe(1);
    expect(linkedRootResult.raw).toContain("nas-root-not-ordinary-directory");
    expect(existsSync(join(actual, CATALOGUE.controlRoot))).toBe(false);

    const linkedIdentity = makeCandidateShare("linked-identity");
    const originalCollections = join(linkedIdentity, "collections");
    rmSync(originalCollections, { recursive: true });
    const outsideCollections = temporaryRoot("outside-identity");
    symlinkSync(outsideCollections, originalCollections, "dir");
    const linkedIdentityResult = run(["--nas-root", linkedIdentity, "--apply"]);
    expect(linkedIdentityResult.code).toBe(1);
    expect(linkedIdentityResult.raw).toContain("identity-root-invalid");
    expect(existsSync(join(linkedIdentity, CATALOGUE.controlRoot))).toBe(false);

    const linkedControl = makeCandidateShare("linked-control");
    const control = join(linkedControl, CATALOGUE.controlRoot);
    mkdirSync(control);
    const outsideControl = temporaryRoot("outside-control");
    symlinkSync(outsideControl, join(control, "staging"), "dir");
    const linkedControlResult = run(["--nas-root", linkedControl, "--apply"]);
    expect(linkedControlResult.code).toBe(1);
    expect(linkedControlResult.raw).toContain("control-root-present-before-marker");
    expect(readdirSync(control)).toEqual(["staging"]);
    expect(linkedControlResult.raw).not.toContain(outsideControl);
  });

  it.skipIf(!CAN_HARDLINK)("refuses a hard-linked marker without clobbering it", () => {
    const root = makeCandidateShare("hard-linked-marker");
    const source = join(root, "marker-source.json");
    const markerPath = join(root, NAS_SHARE_MARKER_PATH);
    writeFileSync(source, EXACT_MARKER);
    linkSync(source, markerPath);

    const result = run(["--nas-root", root, "--apply"]);

    expect(result.code).toBe(1);
    expect(result.raw).toContain("share-marker-invalid");
    expect(readFileSync(source, "utf8")).toBe(EXACT_MARKER);
    expect(readFileSync(markerPath, "utf8")).toBe(EXACT_MARKER);
    expect(lstatSync(markerPath).nlink).toBe(2);
    expect(existsSync(join(root, CATALOGUE.controlRoot))).toBe(false);
  });

  it("uses exclusive marker creation and never clobbers a racing marker", () => {
    const root = makeCandidateShare("marker-race");
    const markerPath = join(root, NAS_SHARE_MARKER_PATH);
    const racingBytes = "RACING-MARKER-MUST-NOT-BE-CLOBBERED\n";
    const payload = join(root, "collections", "payload.bin");
    writeFileSync(payload, "payload-before-race");

    const result = run(["--nas-root", root, "--apply"], {
      hooks: {
        beforeMarkerCreate: (path) => {
          expect(path).toBe(markerPath);
          expectControlTree(root);
          writeFileSync(path, racingBytes);
        },
      },
    });

    expect(result.code).toBe(1);
    expect(result.raw).toContain("share-marker-create-collision");
    expect(readFileSync(markerPath, "utf8")).toBe(racingBytes);
    expect(readFileSync(payload, "utf8")).toBe("payload-before-race");
    expectControlTree(root);
    for (const child of CONTROL_CHILDREN) {
      expect(readdirSync(join(root, CATALOGUE.controlRoot, child))).toEqual([]);
    }
  });

  it("recovers idempotently when a competing bootstrap wins with the exact marker", () => {
    const root = makeCandidateShare("exact-marker-race");
    const markerPath = join(root, NAS_SHARE_MARKER_PATH);
    const raced = run(["--nas-root", root, "--apply"], {
      hooks: { beforeMarkerCreate: (path) => writeFileSync(path, EXACT_MARKER) },
    });
    expect(raced.code).toBe(1);
    expect(raced.raw).toContain("share-marker-create-collision");
    expect(readFileSync(markerPath, "utf8")).toBe(EXACT_MARKER);

    const rerun = run(["--nas-root", root, "--apply"]);
    expect(rerun.code).toBe(0);
    expect(rerun.report).toMatchObject({ state: "already-bootstrapped", marker: "validated" });
  });

  it("emits deterministic generic failures without absolute or unknown names", () => {
    const root = temporaryRoot("generic-failure");
    mkdirSync(join(root, "unrelated"));
    const unknownName = "named-private-root-entry";
    writeFileSync(join(root, unknownName), "private");

    const first = run(["--nas-root", root, "--apply"]);
    const second = run(["--nas-root", root, "--apply"]);

    expect(first.code).toBe(1);
    expect(first.raw).toBe(second.raw);
    expect(first.raw).not.toContain(root);
    expect(first.raw).not.toContain(unknownName);
    expect(first.raw).not.toContain("ENOENT");
    expect(first.report).toEqual({
      format: "snowflake-nas-asset-bootstrap-report-v1",
      command: "bootstrap",
      ok: false,
      defects: [{ code: "identity-root-invalid", count: 1 }],
    });
    expect(existsSync(join(root, CATALOGUE.controlRoot))).toBe(false);
    expect(existsSync(join(root, NAS_SHARE_MARKER_PATH))).toBe(false);
  });
});
