import { closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type {
  Phase10C0VS6PacketProtocol,
  Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";

export interface Phase10C0VS6ValidatedArtifactFailure {
  readonly artifactRole: "science-protocol" | "reference-or-refusal";
  readonly expected: Phase10C0VS6ArtifactIdentity;
  readonly observed: Phase10C0VS6ArtifactIdentity;
  readonly filesystemObservation: {
    readonly path: string;
    readonly lstatObjectType: "regular-file";
    readonly lstatByteLength: number;
    readonly lstatLinkCount: number;
    readonly fileResolvedRelativePath: string;
    readonly lexicalParentRelativePath: string;
    readonly resolvedParentRelativePath: string;
    readonly resolvedInsideRepository: true;
    readonly parentAliased: boolean;
    readonly fstatBefore: {
      readonly deviceIdDecimal: string;
      readonly fileIdDecimal: string;
      readonly byteLength: number;
      readonly linkCount: number;
    };
    readonly fstatAfter: {
      readonly deviceIdDecimal: string;
      readonly fileIdDecimal: string;
      readonly byteLength: number;
      readonly linkCount: number;
    };
    readonly failureReasons: readonly ("link-count-not-one" | "parent-path-aliased")[];
    readonly readMethod: "descriptor-hash-fstat-before-after";
  };
  readonly failureClass: "filesystem-object-policy-failure";
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 artifact observation refused: ${message}`);
}

function physicalRoot(value: string): string {
  const requested = resolve(value);
  const stat = lstatSync(requested);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root is not a physical directory");
  const physical = realpathSync.native(requested);
  if (relative(requested, physical) !== "" || relative(physical, requested) !== "") {
    fail("repository root resolves through an alias or junction");
  }
  return physical;
}

function absolutePath(root: string, pathValue: string): string {
  const path = phase10C0VS6SafeRelativePath(pathValue, "failed artifact path");
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail("failed artifact path escapes repository root");
  return absolute;
}

function insideRoot(root: string, physical: string, label: string): string {
  const displacement = relative(root, physical);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} resolves outside the physical repository root`);
  return displacement.replaceAll("\\", "/");
}

function descriptorObservation(
  root: string,
  identity: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ValidatedArtifactFailure["filesystemObservation"] | null {
  const absolute = absolutePath(root, identity.path);
  const lexicalParent = dirname(absolute);
  const lexicalParentRelativePath = dirname(identity.path).replaceAll("\\", "/");
  const parentStat = lstatSync(lexicalParent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    fail(`${identity.path} lexical parent is not a directory reached without a leaf symlink`);
  }
  const resolvedParent = realpathSync.native(lexicalParent);
  const resolvedParentRelativePath = insideRoot(root, resolvedParent, `${identity.path} parent`);
  const parentAliased = relative(lexicalParent, resolvedParent) !== "" ||
    relative(resolvedParent, lexicalParent) !== "";
  const stat = lstatSync(absolute, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${identity.path} is missing or is not a regular-file artifact`);
  }
  const fileResolved = realpathSync.native(absolute);
  const fileResolvedRelativePath = insideRoot(root, fileResolved, identity.path);
  const expectedResolvedPath = `${resolvedParentRelativePath}/${basename(identity.path)}`;
  if (fileResolvedRelativePath !== expectedResolvedPath) {
    fail(`${identity.path} resolved leaf differs from the safely resolved in-repository parent`);
  }
  let descriptor: number | null = null;
  let before: ReturnType<typeof fstatSync>;
  let after: ReturnType<typeof fstatSync>;
  let bytes: Uint8Array;
  try {
    descriptor = openSync(absolute, "r");
    before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || before.dev !== stat.dev || before.ino !== stat.ino ||
      before.size !== stat.size || before.nlink !== stat.nlink) {
      fail(`${identity.path} changed between lstat and descriptor observation`);
    }
    bytes = new Uint8Array(readFileSync(descriptor));
    after = fstatSync(descriptor, { bigint: true });
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
    before.nlink !== after.nlink) {
    fail(`${identity.path} descriptor changed while exact bytes were hashed`);
  }
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(identity.path, bytes),
    identity,
    `${identity.path} exact packet/HEAD bytes`,
  );
  const safeNumber = (value: bigint, label: string): number => {
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < 0) fail(`${identity.path} ${label} is not a safe integer`);
    return result;
  };
  const fstatRow = (value: typeof before) => Object.freeze({
    deviceIdDecimal: value.dev.toString(10),
    fileIdDecimal: value.ino.toString(10),
    byteLength: safeNumber(value.size, "descriptor byte length"),
    linkCount: safeNumber(value.nlink, "descriptor link count"),
  });
  const lstatLinkCount = safeNumber(stat.nlink, "lstat link count");
  const failureReasons = Object.freeze([
    ...(lstatLinkCount !== 1 ? ["link-count-not-one" as const] : []),
    ...(parentAliased ? ["parent-path-aliased" as const] : []),
  ]);
  if (failureReasons.length === 0) return null;
  return Object.freeze({
    path: identity.path,
    lstatObjectType: "regular-file",
    lstatByteLength: safeNumber(stat.size, "lstat byte length"),
    lstatLinkCount,
    fileResolvedRelativePath,
    lexicalParentRelativePath,
    resolvedParentRelativePath,
    resolvedInsideRepository: true,
    parentAliased,
    fstatBefore: fstatRow(before),
    fstatAfter: fstatRow(after),
    failureReasons,
    readMethod: "descriptor-hash-fstat-before-after",
  });
}

/** Derive, without a receipt claim, every radial science/reference binding that is not live exact. */
export function phase10C0VS6ObserveRadialArtifactFailures(
  repositoryRoot: string,
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6ValidatedArtifactFailure[] {
  if (packet.packetId !== "c0v-radial-produce") return Object.freeze([]);
  const root = physicalRoot(repositoryRoot);
  const bindings = [
    ["science-protocol", packet.bindings.scienceProtocol],
    ["reference-or-refusal", packet.bindings.referenceOrRefusal],
  ] as const;
  const failures: Phase10C0VS6ValidatedArtifactFailure[] = [];
  for (const [artifactRole, expected] of bindings) {
    if (expected === null) fail(`${artifactRole} has no radial packet binding`);
    const filesystemObservation = descriptorObservation(root, expected);
    if (filesystemObservation === null) continue;
    failures.push(Object.freeze({
      artifactRole,
      expected,
      observed: expected,
      filesystemObservation,
      failureClass: "filesystem-object-policy-failure",
    }));
  }
  return Object.freeze(failures);
}

/** Re-observe and validate the one exact radial artifact-precondition failure. */
export function phase10C0VS6ValidatePreflightArtifactFailure(
  repositoryRoot: string,
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
): Phase10C0VS6ValidatedArtifactFailure | null {
  if (preflight.verdict !== "refusal" ||
    preflight.refusalCandidate.dispositionCode !== "preproduction-artifact-refusal") return null;
  if (packet.packetId !== "c0v-radial-produce") fail("artifact refusal is radial-only");
  const failed = preflight.refusalCandidate.failedArtifact;
  if (failed === null ||
    (failed.artifactRole !== "science-protocol" && failed.artifactRole !== "reference-or-refusal")) {
    fail("artifact refusal does not name one permitted science/reference role");
  }
  const expected = failed.artifactRole === "science-protocol"
    ? packet.bindings.scienceProtocol
    : packet.bindings.referenceOrRefusal;
  if (expected === null) fail("failed artifact role has no packet binding");
  phase10C0VS6SameIdentity(failed.expected, expected, "failed artifact expected binding");
  const independentlyObserved = phase10C0VS6ObserveRadialArtifactFailures(repositoryRoot, packet);
  if (independentlyObserved.length !== 1) {
    fail("artifact-refusal receipt does not correspond to exactly one live failed radial binding");
  }
  const actual = independentlyObserved[0]!;
  if (actual.artifactRole !== failed.artifactRole || actual.failureClass !== failed.failureClass) {
    fail("artifact failure changed or differs from the independently observed single failure");
  }
  phase10C0VS6SameIdentity(actual.expected, expected, "independent artifact failure expected identity");
  phase10C0VS6SameIdentity(actual.observed, failed.observed, "independent artifact failure observed identity");
  phase10C0VS6SameJson(
    actual.filesystemObservation,
    failed.filesystemObservation,
    "independent artifact filesystem observation",
  );
  return actual;
}
