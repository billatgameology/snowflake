import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pid } from "node:process";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  PHASE10_C0V_S6_PREDECESSOR_LOCK_ROOT,
  PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_IDS,
  PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V2_FINAL_PATHS,
  PHASE10_C0V_S6_RECOVERY_V2_LOCK_ROOT,
  PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_PATH,
  PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_RULE,
  PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_ID,
  PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH,
  PHASE10_C0V_S6_RECOVERY_V2_PACKET_LOCK_PATHS,
  PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS,
  PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS,
  PHASE10_C0V_S6_RECOVERY_V2_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_V2_STAGE_PATHS,
  PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_ID,
  PHASE10_C0V_S6_RECOVERY_V3_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_ID,
  PHASE10_C0V_S6_RECOVERY_V4_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_ID,
  PHASE10_C0V_S6_RECOVERY_V5_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID,
  PHASE10_C0V_S6_RECOVERY_V6_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS,
  PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_FINAL_PATHS,
  PHASE10_C0V_S6_RECOVERY_V7_LOCK_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH,
  PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_RULE,
  PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID,
  PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH,
  PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS,
  PHASE10_C0V_S6_RECOVERY_V7_RUNTIME_ROOT,
  PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_ID,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RecoveryAuthority,
  parsePhase10C0VS6RecoveryV2Authority,
  parsePhase10C0VS6RecoveryV3Authority,
  parsePhase10C0VS6RecoveryV4Authority,
  parsePhase10C0VS6RecoveryV5Authority,
  parsePhase10C0VS6RecoveryV6Authority,
  parsePhase10C0VS6RecoveryV7Authority,
  type Phase10C0VS6PacketCatalogue,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RecoveryAuthority,
  type Phase10C0VS6RecoveryV2Authority,
  type Phase10C0VS6RecoveryV3Authority,
  type Phase10C0VS6RecoveryV4Authority,
  type Phase10C0VS6RecoveryV5Authority,
  type Phase10C0VS6RecoveryV6Authority,
  type Phase10C0VS6RecoveryV7Authority,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6AssertActiveParentWatchdog,
  phase10C0VS6WithOuterInfrastructureWatchdog,
  type Phase10C0VS6ParentWatchdogContext,
} from "./phase10-c0v-s6-watchdog.ts";

export interface Phase10C0VS6PhysicalRoot {
  readonly path: string;
}

export interface Phase10C0VS6ExclusiveWriteResult {
  readonly disposition: "created" | "reopened-exact";
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6CrashSafePublicationResult {
  readonly disposition: "created" | "reopened-exact";
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6ClosedExclusiveAppendFile {
  readonly bytes: Uint8Array;
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

/**
 * Parent-owned append handle for raw event streams.  The path is created exactly once and every
 * append is synchronously flushed before control returns.  Closing is terminal: the handle then
 * reopens the unique physical file and proves that its complete bytes equal the appended prefix.
 */
export interface Phase10C0VS6ExclusiveAppendFile {
  readonly path: string;
  append(bytes: Uint8Array): void;
  closeAndReopen(): Phase10C0VS6ClosedExclusiveAppendFile;
}

export interface Phase10C0VS6LockContext {
  readonly schema: "phase10-c0v-s6-lock-v1";
  readonly packetId: string;
  readonly attemptId: string;
  readonly processId: number;
  readonly acquiredAt: string;
}

export interface Phase10C0VS6PackageAndPacketLockContext {
  readonly packageLock: Phase10C0VS6LockContext;
  readonly packetLock: Phase10C0VS6LockContext;
}

export interface Phase10C0VS6LockedPacketAuthority {
  readonly catalogue: Phase10C0VS6PacketCatalogue;
  readonly catalogueBytes: Uint8Array;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly packetProtocolBytes: Uint8Array;
  readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
}

export type Phase10C0VS6RecoveryPredecessorAuditMode = "initial-successor" | "post-successor";

export interface Phase10C0VS6RecoveryPredecessorState {
  readonly authority: Phase10C0VS6RecoveryV7Authority;
  readonly authorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly authorityBytes: Uint8Array;
  readonly predecessorRecoveryAuthority: Phase10C0VS6RecoveryV6Authority;
  readonly predecessorRecoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly earlierRecoveryAuthority: Phase10C0VS6RecoveryV5Authority;
  readonly earlierRecoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly secondEarlierRecoveryAuthority: Phase10C0VS6RecoveryV4Authority;
  readonly secondEarlierRecoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly thirdEarlierRecoveryAuthority: Phase10C0VS6RecoveryV3Authority;
  readonly thirdEarlierRecoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly fourthEarlierRecoveryAuthority: Phase10C0VS6RecoveryV2Authority;
  readonly fourthEarlierRecoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly originalRecoveryAuthority: Phase10C0VS6RecoveryAuthority;
  readonly originalRecoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockIdentities: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorAttemptIdentities: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedIdentities: readonly Phase10C0VS6ArtifactIdentity[];
  readonly checkedAbsentPaths: readonly string[];
}

export type Phase10C0VS6LockedPacketMode = "run" | "verify-existing";

const PACKAGE_CATALOGUE_PATH = PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH;
const PACKAGE_LOCK_PATH = PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH;
const PACKAGE_LOCK_ROOT = PHASE10_C0V_S6_RECOVERY_V7_LOCK_ROOT;
const PACKAGE_LOCK_RULE = PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_RULE;
const ACTIVE_LOCK_CONTEXTS = new WeakSet<Phase10C0VS6PackageAndPacketLockContext>();
const ACTIVE_LOCK_AUTHORITIES = new WeakMap<
  Phase10C0VS6PackageAndPacketLockContext,
  Phase10C0VS6LockedPacketAuthority
>();
const ACTIVE_LOCK_MODES = new WeakMap<
  Phase10C0VS6PackageAndPacketLockContext,
  Phase10C0VS6LockedPacketMode
>();
const ACTIVE_LOCK_WATCHDOGS = new WeakMap<
  Phase10C0VS6PackageAndPacketLockContext,
  Phase10C0VS6ParentWatchdogContext
>();
const PACKAGE_PACKET_LOCK_AUTHORITY = Object.freeze({
  "a-p-c0v-s6": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["a-p-c0v-s6"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["a-p-c0v-s6"],
    outerInfrastructureSafetyTimeoutSeconds: 61200,
  }),
  "c0v-moving-produce": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-moving-produce"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-moving-produce"],
    outerInfrastructureSafetyTimeoutSeconds: 18000,
  }),
  "c0v-moving-publish": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-moving-publish"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-moving-publish/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-moving-publish"],
    outerInfrastructureSafetyTimeoutSeconds: 32400,
  }),
  "c0v-radial-produce": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-radial-produce"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-radial-produce/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-radial-produce"],
    outerInfrastructureSafetyTimeoutSeconds: 61500,
  }),
  "c0v-radial-publish": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-radial-publish"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-radial-publish/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-radial-publish"],
    outerInfrastructureSafetyTimeoutSeconds: 32400,
  }),
  "c0v-static-produce": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-static-produce"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-static-produce/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-static-produce"],
    outerInfrastructureSafetyTimeoutSeconds: 18000,
  }),
  "c0v-static-publish": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-static-publish"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-static-publish/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-static-publish"],
    outerInfrastructureSafetyTimeoutSeconds: 32400,
  }),
  "c0v-aggregate": Object.freeze({
    attemptId: PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS["c0v-aggregate"],
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-aggregate/protocol.json`,
    lockPath: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-aggregate"],
    outerInfrastructureSafetyTimeoutSeconds: 46800,
  }),
} satisfies Readonly<Record<Phase10C0VS6PacketProtocol["packetId"], Readonly<{
  attemptId: string;
  protocolPath: string;
  lockPath: string;
  outerInfrastructureSafetyTimeoutSeconds: number;
}>>>);

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 filesystem refused: ${message}`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function codePointCompare(left: string, right: string): number {
  const leftPoints = Array.from(left, (entry) => entry.codePointAt(0) as number);
  const rightPoints = Array.from(right, (entry) => entry.codePointAt(0) as number);
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!;
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

export function phase10C0VS6PhysicalRepositoryRoot(value: string): Phase10C0VS6PhysicalRoot {
  const requested = resolve(value);
  const stat = lstatSync(requested);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail("repository root must be a physical unaliased directory");
  }
  const physical = realpathSync.native(requested);
  if (
    relative(requested, physical) !== "" || relative(physical, requested) !== "") {
    fail("repository root must be a physical unaliased directory");
  }
  return Object.freeze({ path: physical });
}

function containedAbsolute(root: Phase10C0VS6PhysicalRoot, pathValue: string, label: string): string {
  const safe = phase10C0VS6SafeRelativePath(pathValue, label);
  const absolute = resolve(root.path, safe);
  const displacement = relative(root.path, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} escapes the repository root`);
  return absolute;
}

function assertPhysicalDirectory(root: Phase10C0VS6PhysicalRoot, absolute: string, label: string): void {
  const stat = lstatSync(absolute);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail(`${label} is not a physical contained directory`);
  }
  const physical = realpathSync.native(absolute);
  const displacement = relative(root.path, physical);
  if (relative(absolute, physical) !== "" || relative(physical, absolute) !== "" ||
    displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} is not a physical contained directory`);
}

function assertExistingPhysicalDirectoryChain(
  root: Phase10C0VS6PhysicalRoot,
  directory: string,
  label: string,
): void {
  const displacement = relative(root.path, directory);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} is outside the repository root`);
  let current = root.path;
  for (const part of displacement.split(sep).filter((entry) => entry.length > 0)) {
    current = resolve(current, part);
    if (!existsSync(current)) fail(`${label} parent disappeared during operation`);
    assertPhysicalDirectory(root, current, label);
  }
}

function registeredPathObjectExists(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
  label: string,
): boolean {
  const safe = phase10C0VS6SafeRelativePath(pathValue, label);
  const parts = safe.split("/");
  let current = root.path;
  for (let index = 0; index < parts.length; index += 1) {
    current = resolve(current, parts[index]!);
    let stat: ReturnType<typeof lstatSync>;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
    if (index === parts.length - 1) return true;
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      fail(`${label} parent is not a physical directory`);
    }
    const physical = realpathSync.native(current);
    if (relative(current, physical) !== "" || relative(physical, current) !== "" ||
      relative(root.path, physical).startsWith(`..${sep}`) || isAbsolute(relative(root.path, physical))) {
      fail(`${label} parent resolves through an alias or outside the repository`);
    }
  }
  return false;
}

function assertFreshRegisteredRun(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
): void {
  const governedPaths = [
    packet.paths.attemptRoot,
    ...packet.paths.allowedPublicationPaths,
    ...packet.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
  ];
  const duplicate = governedPaths.find((pathValue, index) =>
    governedPaths.indexOf(pathValue) !== index);
  if (duplicate !== undefined) {
    fail(`fresh-run authority repeats governed path ${duplicate}`);
  }
  for (const pathValue of governedPaths) {
    if (registeredPathObjectExists(root, pathValue, `fresh-run path ${pathValue}`)) {
      fail(`registered run already has materialized state at ${pathValue}; same-attempt execution is forbidden`);
    }
  }
}

export function phase10C0VS6EnsurePhysicalDirectory(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
): string {
  const safe = phase10C0VS6SafeRelativePath(pathValue, "directory path");
  const parts = safe.split("/");
  let current = root.path;
  for (const part of parts) {
    current = resolve(current, part);
    if (!existsSync(current)) {
      try {
        mkdirSync(current, { recursive: false, mode: 0o700 });
      } catch (error) {
        if (!existsSync(current)) throw error;
      }
    }
    assertPhysicalDirectory(root, current, `directory ${relative(root.path, current).replaceAll("\\", "/")}`);
  }
  return current;
}

export function phase10C0VS6ReadUniquePhysicalFile(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
): Uint8Array {
  const absolute = containedAbsolute(root, pathValue, "file path");
  const parent = dirname(absolute);
  assertPhysicalDirectory(root, parent, `parent of ${pathValue}`);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${pathValue} is not a unique regular file`);
  }
  const physical = realpathSync.native(absolute);
  if (relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${pathValue} resolves through an alias or junction`);
  }
  return new Uint8Array(readFileSync(physical));
}

/** Recursively hashes every unique physical file beneath one exact repository-relative root. */
export function phase10C0VS6CensusUniquePhysicalDirectory(
  root: Phase10C0VS6PhysicalRoot,
  directoryPathValue: string,
): readonly Phase10C0VS6ArtifactIdentity[] {
  const directoryPath = phase10C0VS6SafeRelativePath(directoryPathValue, "physical census root");
  const absoluteRoot = containedAbsolute(root, directoryPath, "physical census root");
  assertExistingPhysicalDirectoryChain(root, absoluteRoot, `physical census root ${directoryPath}`);
  const identities: Phase10C0VS6ArtifactIdentity[] = [];
  const visit = (absoluteDirectory: string): void => {
    assertPhysicalDirectory(
      root,
      absoluteDirectory,
      `physical census directory ${relative(root.path, absoluteDirectory).replaceAll("\\", "/")}`,
    );
    const entries = readdirSync(absoluteDirectory, { withFileTypes: true })
      .sort((left, right) => codePointCompare(left.name, right.name));
    for (const entry of entries) {
      const absolute = resolve(absoluteDirectory, entry.name);
      const displacement = relative(root.path, absolute);
      if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
        isAbsolute(displacement)) fail("physical census entry escapes the repository root");
      const path = phase10C0VS6SafeRelativePath(
        displacement.replaceAll("\\", "/"),
        "physical census entry path",
      );
      const stat = lstatSync(absolute);
      if (entry.isDirectory()) {
        if (!stat.isDirectory() || stat.isSymbolicLink()) {
          fail(`${path} is not a physical census directory`);
        }
        visit(absolute);
      } else if (entry.isFile()) {
        if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
          fail(`${path} is not a unique physical census file`);
        }
        const bytes = phase10C0VS6ReadUniquePhysicalFile(root, path);
        identities.push(phase10C0VS6ArtifactIdentity(path, bytes));
      } else {
        fail(`${path} is not a regular physical census object`);
      }
    }
  };
  visit(absoluteRoot);
  identities.sort((left, right) => codePointCompare(left.path, right.path));
  return Object.freeze(identities);
}

/**
 * Enforces a closed-world exact identity union below non-overlapping physical roots. An absent root
 * is permitted only when no expected identity belongs to it; any unknown file, omitted file,
 * alias, hard link, or duplicate/overlapping root refuses.
 */
export function phase10C0VS6AssertExactPhysicalRootCensus(
  root: Phase10C0VS6PhysicalRoot,
  directoryPathValues: readonly string[],
  expectedArtifacts: readonly Phase10C0VS6ArtifactIdentity[],
): readonly Phase10C0VS6ArtifactIdentity[] {
  const roots = directoryPathValues
    .map((entry) => phase10C0VS6SafeRelativePath(entry, "physical census root"))
    .sort(codePointCompare);
  if (roots.length === 0 || new Set(roots).size !== roots.length || roots.some((entry, index) =>
    roots.some((other, otherIndex) => index !== otherIndex &&
      (entry.startsWith(`${other}/`) || other.startsWith(`${entry}/`))))) {
    fail("physical census roots are empty, repeated, or overlapping");
  }
  const expected = [...expectedArtifacts].sort((left, right) => codePointCompare(left.path, right.path));
  if (new Set(expected.map((entry) => entry.path)).size !== expected.length) {
    fail("expected physical census repeats a path");
  }
  for (const identity of expected) {
    const owners = roots.filter((entry) => identity.path.startsWith(`${entry}/`));
    if (owners.length !== 1) fail(`${identity.path} does not belong to one physical census root`);
  }
  const actual = roots.flatMap((directoryPath) => {
    if (!registeredPathObjectExists(root, directoryPath, `physical census root ${directoryPath}`)) return [];
    const absolute = containedAbsolute(root, directoryPath, "physical census root");
    const stat = lstatSync(absolute);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      fail(`${directoryPath} physical census root is not a directory`);
    }
    return phase10C0VS6CensusUniquePhysicalDirectory(root, directoryPath);
  }).sort((left, right) => codePointCompare(left.path, right.path));
  if (actual.length !== expected.length) fail("physical census identity roster cardinality differs");
  for (let index = 0; index < actual.length; index += 1) {
    phase10C0VS6SameIdentity(actual[index]!, expected[index]!, `physical census identity[${index}]`);
  }
  return Object.freeze(actual);
}

/** Reopens all seven consumed generations and the separately registered recovery-v7 authority. */
export function phase10C0VS6AssertRecoveryPredecessorState(
  root: Phase10C0VS6PhysicalRoot,
  mode: Phase10C0VS6RecoveryPredecessorAuditMode = "initial-successor",
): Phase10C0VS6RecoveryPredecessorState {
  if (mode !== "initial-successor" && mode !== "post-successor") {
    fail("unknown recovery predecessor audit mode");
  }
  const authorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH,
  );
  const authorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH,
    authorityBytes,
  );
  const authority = parsePhase10C0VS6RecoveryV7Authority(
    parsePhase10C0VS6PrettyJsonBytes(authorityBytes, "recovery-v7 authority"),
  );
  const predecessorRecoveryAuthorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH,
  );
  const predecessorRecoveryAuthorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH,
    predecessorRecoveryAuthorityBytes,
  );
  phase10C0VS6SameIdentity(
    predecessorRecoveryAuthorityIdentity,
    authority.predecessorRecoveryAuthority,
    "recovery-v6 authority predecessor",
  );
  const predecessorRecoveryAuthority = parsePhase10C0VS6RecoveryV6Authority(
    parsePhase10C0VS6PrettyJsonBytes(predecessorRecoveryAuthorityBytes, "recovery-v6 authority"),
  );
  const earlierRecoveryAuthorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
  );
  const earlierRecoveryAuthorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
    earlierRecoveryAuthorityBytes,
  );
  phase10C0VS6SameIdentity(
    earlierRecoveryAuthorityIdentity,
    predecessorRecoveryAuthority.predecessorRecoveryAuthority,
    "recovery-v5 authority predecessor",
  );
  const earlierRecoveryAuthority = parsePhase10C0VS6RecoveryV5Authority(
    parsePhase10C0VS6PrettyJsonBytes(earlierRecoveryAuthorityBytes, "recovery-v5 authority"),
  );
  const secondEarlierRecoveryAuthorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH,
  );
  const secondEarlierRecoveryAuthorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH,
    secondEarlierRecoveryAuthorityBytes,
  );
  phase10C0VS6SameIdentity(
    secondEarlierRecoveryAuthorityIdentity,
    earlierRecoveryAuthority.predecessorRecoveryAuthority,
    "recovery-v4 authority predecessor",
  );
  const secondEarlierRecoveryAuthority = parsePhase10C0VS6RecoveryV4Authority(
    parsePhase10C0VS6PrettyJsonBytes(secondEarlierRecoveryAuthorityBytes, "recovery-v4 authority"),
  );
  const thirdEarlierRecoveryAuthorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH,
  );
  const thirdEarlierRecoveryAuthorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH,
    thirdEarlierRecoveryAuthorityBytes,
  );
  phase10C0VS6SameIdentity(
    thirdEarlierRecoveryAuthorityIdentity,
    secondEarlierRecoveryAuthority.predecessorRecoveryAuthority,
    "recovery-v3 authority predecessor",
  );
  const thirdEarlierRecoveryAuthority = parsePhase10C0VS6RecoveryV3Authority(
    parsePhase10C0VS6PrettyJsonBytes(thirdEarlierRecoveryAuthorityBytes, "recovery-v3 authority"),
  );
  const fourthEarlierRecoveryAuthorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH,
  );
  const fourthEarlierRecoveryAuthorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH,
    fourthEarlierRecoveryAuthorityBytes,
  );
  phase10C0VS6SameIdentity(
    fourthEarlierRecoveryAuthorityIdentity,
    thirdEarlierRecoveryAuthority.predecessorRecoveryAuthority,
    "recovery-v2 authority predecessor",
  );
  const fourthEarlierRecoveryAuthority = parsePhase10C0VS6RecoveryV2Authority(
    parsePhase10C0VS6PrettyJsonBytes(fourthEarlierRecoveryAuthorityBytes, "recovery-v2 authority"),
  );
  const originalRecoveryAuthorityBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH,
  );
  const originalRecoveryAuthorityIdentity = phase10C0VS6ArtifactIdentity(
    PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH,
    originalRecoveryAuthorityBytes,
  );
  phase10C0VS6SameIdentity(
    originalRecoveryAuthorityIdentity,
    fourthEarlierRecoveryAuthority.predecessorRecoveryAuthority,
    "recovery-v1 authority predecessor",
  );
  const originalRecoveryAuthority = parsePhase10C0VS6RecoveryAuthority(
    parsePhase10C0VS6PrettyJsonBytes(originalRecoveryAuthorityBytes, "recovery-v1 authority"),
  );
  const predecessorCatalogueBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    authority.predecessorPacketCatalogue.path,
  );
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(authority.predecessorPacketCatalogue.path, predecessorCatalogueBytes),
    authority.predecessorPacketCatalogue,
    "recovery-v6 catalogue predecessor",
  );
  const predecessorCatalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(predecessorCatalogueBytes, "recovery-v6 catalogue"),
  );
  if (predecessorCatalogue.catalogueId !== PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID ||
    predecessorCatalogue.recoveryAuthority === undefined) {
    fail("recovery-v6 catalogue predecessor mapping differs");
  }
  phase10C0VS6SameIdentity(
    predecessorCatalogue.recoveryAuthority,
    predecessorRecoveryAuthorityIdentity,
    "recovery-v6 catalogue authority binding",
  );
  const predecessorApProtocolBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    authority.predecessorApProtocol.path,
  );
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(authority.predecessorApProtocol.path, predecessorApProtocolBytes),
    authority.predecessorApProtocol,
    "recovery-v5 A-P protocol predecessor",
  );
  const predecessorApProtocol = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(predecessorApProtocolBytes, "recovery-v5 A-P protocol"),
  );
  if (predecessorApProtocol.packetId !== "a-p-c0v-s6" ||
    predecessorApProtocol.registeredAttemptId !== "a-p-c0v-s6-20260822-v6" ||
    predecessorApProtocol.bindings.recoveryAuthority === undefined) {
    fail("recovery-v5 A-P protocol identity or attempt mapping differs");
  }
  phase10C0VS6SameIdentity(
    predecessorApProtocol.bindings.recoveryAuthority,
    earlierRecoveryAuthorityIdentity,
    "recovery-v5 A-P authority binding",
  );
  const predecessorAuthorizedPacketProtocolBytes = phase10C0VS6ReadUniquePhysicalFile(
    root,
    authority.predecessorAuthorizedPacketProtocol.path,
  );
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(
      authority.predecessorAuthorizedPacketProtocol.path,
      predecessorAuthorizedPacketProtocolBytes,
    ),
    authority.predecessorAuthorizedPacketProtocol,
    "recovery-v6 authorized moving protocol predecessor",
  );
  const predecessorAuthorizedPacketProtocol = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(
      predecessorAuthorizedPacketProtocolBytes,
      "recovery-v6 authorized moving protocol",
    ),
  );
  if (predecessorAuthorizedPacketProtocol.packetId !== "c0v-moving-produce" ||
    predecessorAuthorizedPacketProtocol.registeredAttemptId !== "c0v-moving-produce-20260822-v2" ||
    predecessorAuthorizedPacketProtocol.bindings.recoveryAuthority === undefined) {
    fail("recovery-v6 authorized moving protocol identity or attempt mapping differs");
  }
  phase10C0VS6SameIdentity(
    predecessorAuthorizedPacketProtocol.bindings.recoveryAuthority,
    predecessorRecoveryAuthorityIdentity,
    "recovery-v6 authorized moving protocol authority binding",
  );
  const predecessorLockIdentities = authority.predecessorLockArtifacts.map((expected) => {
    const bytes = phase10C0VS6ReadUniquePhysicalFile(root, expected.path);
    const identity = phase10C0VS6ArtifactIdentity(expected.path, bytes);
    phase10C0VS6SameIdentity(identity, expected, `${expected.path} predecessor lock`);
    const expectedBytes = phase10C0VS6PrettyJsonBytes(expected.parsedContent);
    if (!sameBytes(bytes, expectedBytes)) fail(`${expected.path} predecessor lock content differs`);
    parsePhase10C0VS6PrettyJsonBytes(bytes, `${expected.path} predecessor lock`);
    return identity;
  });
  const predecessorAttemptIdentities = authority.predecessorAttemptArtifacts.map((expected) => {
    const bytes = phase10C0VS6ReadUniquePhysicalFile(root, expected.path);
    const identity = phase10C0VS6ArtifactIdentity(expected.path, bytes);
    phase10C0VS6SameIdentity(identity, expected, `${expected.path} predecessor attempt`);
    return identity;
  });
  phase10C0VS6AssertExactPhysicalRootCensus(
    root,
    [
      PHASE10_C0V_S6_PREDECESSOR_LOCK_ROOT,
      PHASE10_C0V_S6_RECOVERY_RUNTIME_ROOT,
      PHASE10_C0V_S6_RECOVERY_V2_RUNTIME_ROOT,
      PHASE10_C0V_S6_RECOVERY_V3_RUNTIME_ROOT,
      PHASE10_C0V_S6_RECOVERY_V4_RUNTIME_ROOT,
      PHASE10_C0V_S6_RECOVERY_V5_RUNTIME_ROOT,
      PHASE10_C0V_S6_RECOVERY_V6_RUNTIME_ROOT,
    ],
    [...predecessorLockIdentities, ...predecessorAttemptIdentities],
  );
  const predecessorPublishedIdentities = authority.predecessorPublishedArtifacts.map((expected) => {
    const bytes = phase10C0VS6ReadUniquePhysicalFile(root, expected.path);
    const identity = phase10C0VS6ArtifactIdentity(expected.path, bytes);
    phase10C0VS6SameIdentity(identity, expected, `${expected.path} predecessor published artifact`);
    return identity;
  });
  const manifestBytes = phase10C0VS6ReadUniquePhysicalFile(root, "evidence/MANIFEST.json");
  let manifest: unknown;
  try {
    manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  } catch {
    fail("evidence manifest is not valid JSON while proving the pinned predecessor preflight");
  }
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest) ||
    !("files" in manifest) || manifest.files === null || typeof manifest.files !== "object" ||
    Array.isArray(manifest.files)) {
    fail("evidence manifest lacks its files map while proving the pinned predecessor preflight");
  }
  for (const identity of predecessorPublishedIdentities) {
    const key = identity.path.startsWith("evidence/") ? identity.path.slice("evidence/".length) : "";
    const entry = key === "" ? undefined : (manifest.files as Record<string, unknown>)[key];
    if (entry === null || typeof entry !== "object" || Array.isArray(entry) ||
      (entry as Record<string, unknown>).bytes !== identity.byteLength ||
      (entry as Record<string, unknown>).sha256 !== identity.sha256) {
      fail(`${identity.path} is not pinned exactly in evidence/MANIFEST.json`);
    }
  }
  const postSuccessorAllowedPaths = new Set<string>([
    PHASE10_C0V_S6_RECOVERY_V7_RUNTIME_ROOT,
    ...PHASE10_C0V_S6_RECOVERY_V7_FINAL_PATHS,
  ]);
  const checkedAbsentPaths = mode === "initial-successor"
    ? authority.predecessorGovernedAbsentPaths
    : authority.predecessorGovernedAbsentPaths.filter((path) =>
      !postSuccessorAllowedPaths.has(path));
  for (const path of checkedAbsentPaths) {
    if (registeredPathObjectExists(root, path, `predecessor absent path ${path}`)) {
      fail(`predecessor state unexpectedly materialized ${path}`);
    }
  }
  return Object.freeze({
    authority,
    authorityIdentity,
    authorityBytes: new Uint8Array(authorityBytes),
    predecessorRecoveryAuthority,
    predecessorRecoveryAuthorityIdentity,
    earlierRecoveryAuthority,
    earlierRecoveryAuthorityIdentity,
    secondEarlierRecoveryAuthority,
    secondEarlierRecoveryAuthorityIdentity,
    thirdEarlierRecoveryAuthority,
    thirdEarlierRecoveryAuthorityIdentity,
    fourthEarlierRecoveryAuthority,
    fourthEarlierRecoveryAuthorityIdentity,
    originalRecoveryAuthority,
    originalRecoveryAuthorityIdentity,
    predecessorLockIdentities: Object.freeze(predecessorLockIdentities),
    predecessorAttemptIdentities: Object.freeze(predecessorAttemptIdentities),
    predecessorPublishedIdentities: Object.freeze(predecessorPublishedIdentities),
    checkedAbsentPaths: Object.freeze([...checkedAbsentPaths]),
  });
}

/**
 * Reopens the exact package and packet lock bytes and proves that no third lock exists below the
 * governed lock root.  This structural primitive is useful for mutation tests; claim-bearing
 * code must additionally call `phase10C0VS6AssertActiveLockedPacketAuthority` so copied JSON
 * objects cannot impersonate the live wrapper-issued context.
 */
export function phase10C0VS6AssertPackageAndPacketLockBytes(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  locks: Phase10C0VS6PackageAndPacketLockContext,
): void {
  if (locks.packageLock.schema !== "phase10-c0v-s6-lock-v1" ||
    locks.packageLock.packetId !== PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID ||
    locks.packageLock.attemptId !== `${packet.packetId}:${packet.registeredAttemptId}` ||
    locks.packageLock.processId !== pid ||
    locks.packetLock.schema !== "phase10-c0v-s6-lock-v1" ||
    locks.packetLock.packetId !== packet.packetId ||
    locks.packetLock.attemptId !== packet.registeredAttemptId ||
    locks.packetLock.processId !== pid ||
    !Number.isFinite(Date.parse(locks.packageLock.acquiredAt)) ||
    !Number.isFinite(Date.parse(locks.packetLock.acquiredAt)) ||
    packet.paths.packageLockPath !== PACKAGE_LOCK_PATH) {
    fail("caller lock contexts differ from the active packet/process authority");
  }
  const lockIdentities: Phase10C0VS6ArtifactIdentity[] = [];
  for (const [pathValue, lock, label] of [
    [packet.paths.packageLockPath, locks.packageLock, "package lock"],
    [packet.paths.lockPath, locks.packetLock, "packet lock"],
  ] as const) {
    const expectedBytes = phase10C0VS6PrettyJsonBytes(lock);
    const liveBytes = phase10C0VS6ReadUniquePhysicalFile(root, pathValue);
    if (!sameBytes(liveBytes, expectedBytes)) fail(`${label} bytes changed after acquisition`);
    lockIdentities.push(phase10C0VS6ArtifactIdentity(pathValue, liveBytes));
  }
  phase10C0VS6AssertExactPhysicalRootCensus(root, [PACKAGE_LOCK_ROOT], lockIdentities);
}

/**
 * Requires the exact object identities issued to the currently running package-lock callback,
 * then repeats the physical lock-byte/census proof.  Neither a caller-built lock object nor a
 * caller-built locked authority object can cross this boundary, even if its JSON is coherent.
 */
export function phase10C0VS6AssertActiveLockedPacketAuthority(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  requiredMode: Phase10C0VS6LockedPacketMode,
): void {
  if (!ACTIVE_LOCK_CONTEXTS.has(locks) || ACTIVE_LOCK_AUTHORITIES.get(locks) !== authority ||
    ACTIVE_LOCK_MODES.get(locks) !== requiredMode) {
    fail("lock context/authority/mode was not issued by the active package-lock callback");
  }
  phase10C0VS6AssertPackageAndPacketLockBytes(root, authority.packet, locks);
}

/**
 * Binds a claim-bearing operation to the exact parent watchdog issued alongside its active
 * package/packet locks and locked authority. The watchdog assertion reads the live monotonic
 * clock synchronously, so an event-loop-stalled caller cannot cross a publication boundary by
 * presenting a coherent but expired or caller-built context.
 */
export function phase10C0VS6AssertActiveLockedPacketWatchdog(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
  requiredMode: Phase10C0VS6LockedPacketMode,
): void {
  phase10C0VS6AssertActiveLockedPacketAuthority(root, locks, authority, requiredMode);
  if (ACTIVE_LOCK_WATCHDOGS.get(locks) !== watchdog) {
    fail("watchdog context was not issued with the active package-lock callback");
  }
  phase10C0VS6AssertActiveParentWatchdog(watchdog);
}

/**
 * Append-only write primitive. It creates a file directly with O_EXCL and never renames,
 * truncates, deletes, or overwrites an attempt byte. An existing byte-exact file is an
 * idempotent reopen; any difference is a terminal infrastructure refusal.
 */
export function phase10C0VS6WriteExclusiveOrExact(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
  bytes: Uint8Array,
): Phase10C0VS6ExclusiveWriteResult {
  const safe = phase10C0VS6SafeRelativePath(pathValue, "exclusive write path");
  phase10C0VS6EnsurePhysicalDirectory(root, dirname(safe).replaceAll("\\", "/"));
  const absolute = containedAbsolute(root, safe, "exclusive write path");
  if (existsSync(absolute)) {
    const observed = phase10C0VS6ReadUniquePhysicalFile(root, safe);
    if (!sameBytes(observed, bytes)) fail(`${safe} already exists with different bytes`);
    return Object.freeze({
      disposition: "reopened-exact",
      identity: phase10C0VS6ArtifactIdentity(safe, observed),
    });
  }
  let descriptor: number | null = null;
  try {
    descriptor = openSync(absolute, "wx", 0o600);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const written = writeSync(descriptor, bytes, offset, bytes.byteLength - offset, offset);
      if (written <= 0) fail(`${safe} write made no progress`);
      offset += written;
    }
    fsyncSync(descriptor);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
  const observed = phase10C0VS6ReadUniquePhysicalFile(root, safe);
  if (!sameBytes(observed, bytes)) fail(`${safe} differs immediately after exclusive write`);
  return Object.freeze({
    disposition: "created",
    identity: phase10C0VS6ArtifactIdentity(safe, observed),
  });
}

/**
 * Creates an absent raw stream and retains one descriptor for fsynced append-only growth.  This
 * primitive deliberately has no reopen-existing mode: a current-v1 `run` may never resume or
 * append to bytes left by an earlier process.  Callers layer their record grammar over `append`.
 */
export function phase10C0VS6CreateExclusiveAppendFile(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
  initialBytes: Uint8Array,
): Phase10C0VS6ExclusiveAppendFile {
  const safe = phase10C0VS6SafeRelativePath(pathValue, "exclusive append path");
  if (initialBytes.byteLength === 0) fail("exclusive append initial bytes must not be empty");
  phase10C0VS6EnsurePhysicalDirectory(root, dirname(safe).replaceAll("\\", "/"));
  const absolute = containedAbsolute(root, safe, "exclusive append path");
  if (existsSync(absolute)) fail(`${safe} already exists; current-v1 append resume is forbidden`);

  let descriptor: number | null = null;
  let closed = false;
  let expectedBytes = new Uint8Array(initialBytes);

  const writeAll = (bytes: Uint8Array, position: number): void => {
    if (descriptor === null || closed) fail(`${safe} append handle is closed`);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const written = writeSync(descriptor, bytes, offset, bytes.byteLength - offset, position + offset);
      if (written <= 0) fail(`${safe} append made no progress`);
      offset += written;
    }
    fsyncSync(descriptor);
    const stat = fstatSync(descriptor);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size !== position + bytes.byteLength) {
      fail(`${safe} append descriptor changed identity, link count, or length`);
    }
  };

  try {
    descriptor = openSync(absolute, "wx", 0o600);
    writeAll(expectedBytes, 0);
  } catch (error) {
    if (descriptor !== null) {
      try {
        fsyncSync(descriptor);
      } finally {
        closeSync(descriptor);
        descriptor = null;
        closed = true;
      }
    }
    throw error;
  }

  const append = (suppliedBytes: Uint8Array): void => {
    if (closed || descriptor === null) fail(`${safe} append handle is closed`);
    if (suppliedBytes.byteLength === 0) fail(`${safe} append bytes must not be empty`);
    const appended = new Uint8Array(suppliedBytes);
    const previousLength = expectedBytes.byteLength;
    writeAll(appended, previousLength);
    const combined = new Uint8Array(previousLength + appended.byteLength);
    combined.set(expectedBytes, 0);
    combined.set(appended, previousLength);
    expectedBytes = combined;
  };

  const closeAndReopen = (): Phase10C0VS6ClosedExclusiveAppendFile => {
    if (closed || descriptor === null) fail(`${safe} append handle is already closed`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    closed = true;
    const observed = phase10C0VS6ReadUniquePhysicalFile(root, safe);
    if (!sameBytes(observed, expectedBytes)) {
      fail(`${safe} differs from its exact appended prefix after close`);
    }
    return Object.freeze({
      bytes: new Uint8Array(observed),
      identity: phase10C0VS6ArtifactIdentity(safe, observed),
    });
  };

  return Object.freeze({ path: safe, append, closeAndReopen });
}

/**
 * Crash-safe publication uses a protocol-registered sibling stage. The target is installed
 * atomically to an absent path with a temporary hard-link transition, then the stage is removed
 * only after both names are proven to be the same exact inode/bytes. Any pre-existing stage,
 * including an exact stranded transition, is retained and fail-stops execution; only a separately
 * governed successor/recovery protocol may inspect or remove it.
 */
export function phase10C0VS6PublishCrashSafeExclusive(
  root: Phase10C0VS6PhysicalRoot,
  finalPathValue: string,
  stagingPathValue: string,
  bytes: Uint8Array,
): Phase10C0VS6CrashSafePublicationResult {
  const finalPath = phase10C0VS6SafeRelativePath(finalPathValue, "final publication path");
  const stagingPath = phase10C0VS6SafeRelativePath(stagingPathValue, "staging publication path");
  if (finalPath === stagingPath || dirname(finalPath) !== dirname(stagingPath)) {
    fail("publication stage must be a distinct registered sibling of the final path");
  }
  phase10C0VS6EnsurePhysicalDirectory(root, dirname(finalPath).replaceAll("\\", "/"));
  const finalAbsolute = containedAbsolute(root, finalPath, "final publication path");
  const stagingAbsolute = containedAbsolute(root, stagingPath, "staging publication path");
  if (existsSync(finalAbsolute)) {
    const finalStat = lstatSync(finalAbsolute);
    if (!finalStat.isFile() || finalStat.isSymbolicLink() || finalStat.nlink !== 1) {
      fail(`${finalPath} already exists with a different or aliased artifact`);
    }
    if (existsSync(stagingAbsolute)) {
      fail("stranded publication stage requires a separately governed recovery protocol");
    }
    const finalPhysical = realpathSync.native(finalAbsolute);
    if (relative(finalAbsolute, finalPhysical) !== "" || relative(finalPhysical, finalAbsolute) !== "") {
      fail(`${finalPath} already exists with a different or aliased artifact`);
    }
    const finalBytes = new Uint8Array(readFileSync(finalPhysical));
    if (!sameBytes(finalBytes, bytes)) {
      fail(`${finalPath} already exists with a different or aliased artifact`);
    }
    const finalUnique = phase10C0VS6ReadUniquePhysicalFile(root, finalPath);
    return Object.freeze({
      disposition: "reopened-exact",
      identity: phase10C0VS6ArtifactIdentity(finalPath, finalUnique),
    });
  }

  if (existsSync(stagingAbsolute)) {
    fail("pre-existing publication stage requires a separately governed recovery protocol");
  }
  phase10C0VS6WriteExclusiveOrExact(root, stagingPath, bytes);
  try {
    linkSync(stagingAbsolute, finalAbsolute);
  } catch (error) {
    if (!existsSync(finalAbsolute)) throw error;
  }
  const stageStat = lstatSync(stagingAbsolute);
  const finalStat = lstatSync(finalAbsolute);
  if (!stageStat.isFile() || !finalStat.isFile() || stageStat.isSymbolicLink() || finalStat.isSymbolicLink() ||
    stageStat.dev !== finalStat.dev || stageStat.ino !== finalStat.ino ||
    stageStat.nlink !== 2 || finalStat.nlink !== 2) {
    fail("publication atomic-install transition is not two regular physical files");
  }
  const stagePhysical = realpathSync.native(stagingAbsolute);
  const finalPhysical = realpathSync.native(finalAbsolute);
  if (relative(stagingAbsolute, stagePhysical) !== "" || relative(stagePhysical, stagingAbsolute) !== "" ||
    relative(finalAbsolute, finalPhysical) !== "" || relative(finalPhysical, finalAbsolute) !== "") {
    fail("publication atomic-install transition differs from the exact staged artifact");
  }
  const stageBytes = new Uint8Array(readFileSync(stagePhysical));
  const finalBytes = new Uint8Array(readFileSync(finalPhysical));
  if (!sameBytes(stageBytes, bytes) || !sameBytes(finalBytes, bytes)) {
    fail("publication atomic-install transition differs from the exact staged artifact");
  }
  const finalDescriptor = openSync(finalAbsolute, "r+");
  try {
    fsyncSync(finalDescriptor);
  } finally {
    closeSync(finalDescriptor);
  }
  unlinkSync(stagingAbsolute);
  const finalUnique = phase10C0VS6ReadUniquePhysicalFile(root, finalPath);
  return Object.freeze({
    disposition: "created",
    identity: phase10C0VS6ArtifactIdentity(finalPath, finalUnique),
  });
}

/**
 * Lock bytes are outside attempt roots. A crashed stale lock is deliberately retained. When a
 * cleanup-eligibility assertion is supplied, it is called before physical validation and again
 * immediately before unlink; either rejection retains the exact lock for review.
 */
export async function phase10C0VS6WithExclusiveLock<T>(
  root: Phase10C0VS6PhysicalRoot,
  lockPath: string,
  packetId: string,
  attemptId: string,
  action: (lock: Phase10C0VS6LockContext) => T | Promise<T>,
  assertCleanupEligible?: () => void,
): Promise<T> {
  const safe = phase10C0VS6SafeRelativePath(lockPath, "lock path");
  phase10C0VS6EnsurePhysicalDirectory(root, dirname(safe).replaceAll("\\", "/"));
  const absolute = containedAbsolute(root, safe, "lock path");
  const lock = Object.freeze({
    schema: "phase10-c0v-s6-lock-v1" as const,
    packetId,
    attemptId,
    processId: pid,
    acquiredAt: new Date().toISOString(),
  });
  let descriptor: number;
  try {
    descriptor = openSync(absolute, "wx", 0o600);
  } catch {
    fail(`${safe} already exists; concurrent or stale execution requires operator review`);
  }
  let completed = false;
  const lockBytes = phase10C0VS6PrettyJsonBytes(lock);
  let originalDevice: number | bigint | null = null;
  let originalInode: number | bigint | null = null;
  try {
    let offset = 0;
    while (offset < lockBytes.byteLength) {
      const written = writeSync(descriptor, lockBytes, offset, lockBytes.byteLength - offset, offset);
      if (written <= 0) fail("lock write made no progress");
      offset += written;
    }
    fsyncSync(descriptor);
    const original = fstatSync(descriptor, { bigint: true });
    if (!original.isFile() || original.nlink !== 1n) fail("new lock descriptor is not a unique regular file");
    originalDevice = original.dev;
    originalInode = original.ino;
    const result = await action(lock);
    completed = true;
    return result;
  } finally {
    let mayUnlinkExactLock = false;
    try {
      if (completed) {
        assertCleanupEligible?.();
        assertExistingPhysicalDirectoryChain(root, dirname(absolute), "lock cleanup parent");
        const stat = lstatSync(absolute, { bigint: true });
        if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1n) {
          fail("lock changed type or link count during execution");
        }
        const physical = realpathSync.native(absolute);
        const descriptorStat = fstatSync(descriptor, { bigint: true });
        if (relative(absolute, physical) !== "" || relative(physical, absolute) !== "" ||
          descriptorStat.dev !== originalDevice || descriptorStat.ino !== originalInode ||
          stat.dev !== descriptorStat.dev || stat.ino !== descriptorStat.ino) {
          fail("lock changed type or link count during execution");
        }
        const onDiskBytes = new Uint8Array(readFileSync(physical));
        if (!sameBytes(onDiskBytes, lockBytes)) {
          fail("lock changed type or link count during execution");
        }
        mayUnlinkExactLock = true;
      }
    } finally {
      closeSync(descriptor);
    }
    if (mayUnlinkExactLock) {
      assertCleanupEligible?.();
      assertExistingPhysicalDirectoryChain(root, dirname(absolute), "lock unlink parent");
      const finalStat = lstatSync(absolute, { bigint: true });
      if (!finalStat.isFile() || finalStat.isSymbolicLink() || finalStat.nlink !== 1n) {
        fail("lock or parent changed immediately before unlink; retained for operator review");
      }
      const finalPhysical = realpathSync.native(absolute);
      if (relative(absolute, finalPhysical) !== "" || relative(finalPhysical, absolute) !== "" ||
        finalStat.dev !== originalDevice || finalStat.ino !== originalInode) {
        fail("lock or parent changed immediately before unlink; retained for operator review");
      }
      const finalBytes = new Uint8Array(readFileSync(finalPhysical));
      if (!sameBytes(finalBytes, lockBytes)) {
        fail("lock or parent changed immediately before unlink; retained for operator review");
      }
      unlinkSync(absolute);
    }
  }
}

/**
 * Serializes the whole S6 package before the narrower packet lock is acquired.  Callers must
 * enter this wrapper before repository, dependency, preflight, or resource observation.  Any
 * rejected action deliberately leaves both locks stale, halting every packet until governed
 * operator recovery.
 */
export async function phase10C0VS6WithPackageAndPacketLocks<T>(
  root: Phase10C0VS6PhysicalRoot,
  packetId: Phase10C0VS6PacketProtocol["packetId"],
  mode: Phase10C0VS6LockedPacketMode,
  action: (
    locks: Phase10C0VS6PackageAndPacketLockContext,
    authority: Phase10C0VS6LockedPacketAuthority,
    watchdog: Phase10C0VS6ParentWatchdogContext,
  ) => T | Promise<T>,
  beforeAuthorityRead?: (locks: Phase10C0VS6PackageAndPacketLockContext) => void,
): Promise<T> {
  const registered = PACKAGE_PACKET_LOCK_AUTHORITY[packetId];
  if (registered === undefined) fail("CLI packet ID is not registered by execution-v2 recovery-v7");
  const predecessorAuditMode: Phase10C0VS6RecoveryPredecessorAuditMode =
    packetId === "c0v-moving-produce" && mode === "run"
      ? "initial-successor"
      : "post-successor";
  const predecessor = phase10C0VS6AssertRecoveryPredecessorState(root, predecessorAuditMode);
  let packageCleanupWatchdog: Phase10C0VS6ParentWatchdogContext | null = null;
  return phase10C0VS6WithExclusiveLock(
    root,
    PACKAGE_LOCK_PATH,
    PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID,
    `${packetId}:${registered.attemptId}`,
    async (packageLock) => {
      let packetCleanupWatchdog: Phase10C0VS6ParentWatchdogContext | null = null;
      const result = await phase10C0VS6WithExclusiveLock(
        root,
        registered.lockPath,
        packetId,
        registered.attemptId,
        async (packetLock) => phase10C0VS6WithOuterInfrastructureWatchdog(
          registered.outerInfrastructureSafetyTimeoutSeconds * 1_000_000_000,
          async (watchdog) => {
            packageCleanupWatchdog = watchdog;
            packetCleanupWatchdog = watchdog;
            const locks = Object.freeze({ packageLock, packetLock });
            ACTIVE_LOCK_CONTEXTS.add(locks);
            try {
              beforeAuthorityRead?.(locks);
              const catalogueBytes = phase10C0VS6ReadUniquePhysicalFile(root, PACKAGE_CATALOGUE_PATH);
              const catalogue = parsePhase10C0VS6PacketCatalogue(
                parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "locked packet catalogue"),
              );
              if (catalogue.packageLockPath !== PACKAGE_LOCK_PATH ||
                catalogue.packageLockRule !== PACKAGE_LOCK_RULE ||
                catalogue.catalogueId !== PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID ||
                catalogue.recoveryAuthority === undefined) {
                fail("locked catalogue differs from the hard-coded package serialization authority");
              }
              phase10C0VS6SameIdentity(
                catalogue.recoveryAuthority,
                predecessor.authorityIdentity,
                "locked catalogue recovery authority",
              );
              const entries = catalogue.packets.filter((entry) => entry.packetId === packetId);
              if (entries.length !== 1 || entries[0]!.protocolPath !== registered.protocolPath ||
                entries[0]!.lockPath !== registered.lockPath) {
                fail("locked catalogue packet mapping differs from the hard-coded pre-observation authority");
              }
              const packetProtocolBytes = phase10C0VS6ReadUniquePhysicalFile(root, registered.protocolPath);
              const packetProtocolIdentity = phase10C0VS6ArtifactIdentity(
                registered.protocolPath,
                packetProtocolBytes,
              );
              const packet = parsePhase10C0VS6PacketProtocol(
                parsePhase10C0VS6PrettyJsonBytes(packetProtocolBytes, "locked packet protocol"),
              );
              const entry = entries[0]!;
              const verificationPath = packet.paths.allowedPublicationPaths.filter((path) =>
                path.endsWith(`/${packet.verification.filename}`));
              if (packet.packetId !== packetId || packet.registeredAttemptId !== registered.attemptId ||
                packet.paths.packageLockPath !== PACKAGE_LOCK_PATH || packet.paths.lockPath !== registered.lockPath ||
                packet.bindings.packetCatalogue.path !== PACKAGE_CATALOGUE_PATH ||
                packet.bindings.recoveryAuthority === undefined ||
                entry.callableRegistryPath !== packet.bindings.callableRegistry.path ||
                entry.attemptRoot !== packet.paths.attemptRoot ||
                entry.preflightReceiptPath !== packet.paths.preflightReceiptPath ||
                entry.terminalReceiptPath !== packet.paths.terminalReceiptPath ||
                entry.verificationFilename !== packet.verification.filename ||
                entry.verificationSchemaId !== packet.verification.schemaId ||
                verificationPath.length !== 1 || entry.verificationPath !== verificationPath[0]) {
                fail("locked packet protocol differs from its exact catalogue and pre-observation lock mapping");
              }
              phase10C0VS6SameIdentity(
                packet.bindings.recoveryAuthority,
                predecessor.authorityIdentity,
                "locked packet recovery authority",
              );
              if (packet.resources.outerInfrastructureSafetyTimeoutSeconds !==
                registered.outerInfrastructureSafetyTimeoutSeconds ||
                packet.resources.outerInfrastructureTimingRule !==
                  "parent-monotonic-nanoseconds-limit-plus-one-millisecond-fail-stop-stale-lock-invalidates-claims" ||
                packet.resources.outerInfrastructureSafetyTimeoutSeconds !==
                  packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum / 1_000_000_000 + 3600) {
                fail("locked packet outer infrastructure timeout differs from exact parent-monotonic authority");
              }
              const catalogueIdentity = phase10C0VS6ArtifactIdentity(PACKAGE_CATALOGUE_PATH, catalogueBytes);
              if (packet.bindings.packetCatalogue.byteLength !== catalogueIdentity.byteLength ||
                packet.bindings.packetCatalogue.sha256 !== catalogueIdentity.sha256) {
                fail("locked packet protocol does not bind the live locked catalogue bytes");
              }
              if (mode === "run") assertFreshRegisteredRun(root, packet);
              const authority = Object.freeze({
                catalogue,
                catalogueBytes: new Uint8Array(catalogueBytes),
                packet,
                packetProtocolBytes: new Uint8Array(packetProtocolBytes),
                packetProtocolIdentity,
              });
              ACTIVE_LOCK_AUTHORITIES.set(locks, authority);
              ACTIVE_LOCK_MODES.set(locks, mode);
              ACTIVE_LOCK_WATCHDOGS.set(locks, watchdog);
              return await action(locks, authority, watchdog);
            } finally {
              ACTIVE_LOCK_WATCHDOGS.delete(locks);
              ACTIVE_LOCK_MODES.delete(locks);
              ACTIVE_LOCK_AUTHORITIES.delete(locks);
              ACTIVE_LOCK_CONTEXTS.delete(locks);
            }
          },
          `${packetId} locked packet action`,
        ),
        () => {
          if (packetCleanupWatchdog === null) {
            fail("successful packet lock cleanup lacks its parent watchdog");
          }
          phase10C0VS6AssertActiveParentWatchdog(packetCleanupWatchdog);
        },
      );
      if (packetCleanupWatchdog === null) {
        fail("successful packet action lacks its parent watchdog");
      }
      // The packet unlink is non-claim cleanup. Rechecking immediately afterward keeps the
      // package lock stale if that physical unlink crossed the monotonic deadline.
      phase10C0VS6AssertActiveParentWatchdog(packetCleanupWatchdog);
      return result;
    },
    () => {
      if (packageCleanupWatchdog === null) {
        fail("successful package lock cleanup lacks its parent watchdog");
      }
      phase10C0VS6AssertActiveParentWatchdog(packageCleanupWatchdog);
    },
  );
}
