import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import {
  phase10C0VS6ObserveRadialArtifactFailures,
  phase10C0VS6ValidatePreflightArtifactFailure,
  type Phase10C0VS6ValidatedArtifactFailure,
} from "./phase10-c0v-s6-artifact-observation.ts";
import {
  PHASE10_C0V_S6_PACKET_IDS,
  assertPhase10C0VS6Commit,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RetainedPreflight,
  validatePhase10C0VS6RetainedPreflightRegistryContext,
  type Phase10C0VS6CallableRegistry,
  type Phase10C0VS6PacketCatalogue,
  type Phase10C0VS6PacketId,
  type Phase10C0VS6PacketProtocol,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6AssertBuiltinAllowlistRegistryCoverage,
  phase10C0VS6AssertCallableRegistration,
  phase10C0VS6AssertRawClosureEolAuthority,
  phase10C0VS6AssertRuntimeEntrypointRegistration,
  phase10C0VS6AssertScientificClosureSeparation,
  phase10C0VS6GitCanonicalWorktreeIdentity,
  PHASE10_C0V_S6_TYPESCRIPT_RUNTIME_ARTIFACTS,
  type Phase10C0VS6ImportAuditReceipt,
} from "./phase10-c0v-s6-import-audit.ts";
import {
  parsePhase10C0VS6FreezeEvaluationBytes,
  type Phase10C0VS6FreezeEvaluationReceipt,
} from "./phase10-c0v-s6-receipts.ts";

const CATALOGUE_PATH = "research/phase10-execution-v2/packet-catalogue.json";
const README_PATH = "research/phase10-execution-v2/README.md";
const RULE_PATHS = Object.freeze([
  ".gitattributes", ".gitignore", "app/.gitattributes", "core/.gitattributes",
  "core/src/.gitattributes", "research/.gitattributes", "runner/.gitattributes",
  "runner/src/.gitattributes", "solver-cpu/.gitattributes", "solver-cpu/src/.gitattributes",
  "solver-gpu/.gitattributes",
] as const);
const GOVERNANCE_COMMIT = "fdb829b7a31e9e2573d8217d317ad7f5ffbc54fc" as const;
const S5_SCIENCE_FREEZE_COMMIT = "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9" as const;
const TYPESCRIPT_AUTHORIZED_CALLABLE_IDS: ReadonlySet<string> = new Set([
  "phase10-a-p-c0v-s6-check-caller",
  "phase10-a-p-c0v-s6-evaluator",
  "phase10-a-p-c0v-s6-producer",
  "phase10-c0v-aggregate-check-caller",
  "phase10-c0v-aggregate-evaluator",
  "phase10-c0v-moving-publication-verifier",
  "phase10-c0v-moving-publish-check-caller",
  "phase10-c0v-radial-publication-verifier",
  "phase10-c0v-radial-publish-check-caller",
  "phase10-c0v-s6-freeze-check-caller",
  "phase10-c0v-s6-freeze-evaluator",
  "phase10-c0v-s6-attempt-census-check-caller",
  "phase10-c0v-s6-attempt-census-evaluator",
  "phase10-c0v-static-publication-verifier",
  "phase10-c0v-static-publish-check-caller",
]);

export type Phase10C0VS6FreezeCheckId =
  | "chk-c0v-radial-freeze-ancestry"
  | "chk-c0v-moving-freeze-ancestry"
  | "chk-c0v-static-freeze-ancestry";

export interface Phase10C0VS6FreezeEvaluationInput {
  readonly repositoryRoot: string;
  readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly preflightBytes: Uint8Array;
}

export interface Phase10C0VS6ImplementationFreezeDerivation {
  readonly implementationFreezeCommit: string;
  readonly launchHead: string;
  readonly launchBranch: "phase10/evidence-verification";
  readonly anchorPaths: readonly string[];
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly parserRuntimeArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly artifactFailure: Phase10C0VS6ValidatedArtifactFailure | null;
}

export interface Phase10C0VS6RetainedFreezeEvaluation
  extends Phase10C0VS6ImplementationFreezeDerivation {
  readonly packetId: Phase10C0VS6PacketId;
  readonly verdict: "pass";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6FreezeAncestryEvaluation
  extends Phase10C0VS6ImplementationFreezeDerivation {
  readonly checkId: Phase10C0VS6FreezeCheckId;
  readonly packetId: "c0v-radial-produce" | "c0v-moving-produce" | "c0v-static-produce";
  readonly verdict: "pass";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6FreezeAncestryCheckCallerResult {
  readonly evaluation: Phase10C0VS6FreezeAncestryEvaluation;
  readonly executedCheckIds: readonly [Phase10C0VS6FreezeCheckId];
  readonly evaluatedCheckIds: readonly [Phase10C0VS6FreezeCheckId];
  readonly executedNegativeControlIds: readonly string[];
}

/**
 * Read-only historical projection used only after a packet has been committed and a later packet
 * has advanced HEAD.  The retained receipt is still checked against independently reconstructed
 * implementation/launch Git authority; it is never accepted as its own authority.
 */
export interface Phase10C0VS6HistoricalFreezeProjection {
  readonly retained: Phase10C0VS6RetainedFreezeEvaluation;
  readonly receipt: Phase10C0VS6FreezeEvaluationReceipt;
  readonly receiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly ancestryCallerResult: Phase10C0VS6FreezeAncestryCheckCallerResult | null;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 freeze evaluator refused: ${message}`);
}

function codePointCompare(left: string, right: string): number {
  const leftPoints = Array.from(left, (entry) => entry.codePointAt(0) as number);
  const rightPoints = Array.from(right, (entry) => entry.codePointAt(0) as number);
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    const difference = (leftPoints[index] as number) - (rightPoints[index] as number);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function safeRoot(value: string): string {
  const requested = resolve(value);
  const physical = realpathSync(requested);
  const stat = lstatSync(physical);
  if (!stat.isDirectory() || stat.isSymbolicLink() ||
    relative(requested, physical) !== "" || relative(physical, requested) !== "") {
    fail("repository root must be a physical directory without an alias or junction");
  }
  return physical;
}

function safeAbsolute(root: string, pathValue: string, label: string): string {
  const path = phase10C0VS6SafeRelativePath(pathValue, label);
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} escapes repository root`);
  return absolute;
}

function readPhysical(root: string, pathValue: string): Uint8Array {
  const absolute = safeAbsolute(root, pathValue, "freeze artifact path");
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${pathValue} is not a unique regular physical file`);
  }
  const physical = realpathSync(absolute);
  if (relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${pathValue} resolves through an alias or junction`);
  }
  return new Uint8Array(readFileSync(physical));
}

function gitBytes(root: string, args: readonly string[], label: string): Uint8Array {
  try {
    return new Uint8Array(execFileSync("git", [...args], {
      cwd: root,
      encoding: "buffer",
      maxBuffer: 128 * 1024 * 1024,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    }));
  } catch (error) {
    fail(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function gitText(root: string, args: readonly string[], label: string): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(gitBytes(root, args, label)).trim();
}

function nulRecords(bytes: Uint8Array, label: string): readonly string[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.length === 0) return Object.freeze([]);
  if (!text.endsWith("\0")) fail(`${label} lacks its terminal NUL`);
  return Object.freeze(text.slice(0, -1).split("\0"));
}

function exactSortedUniquePaths(paths: readonly string[], label: string): readonly string[] {
  const parsed = paths.map((path) => phase10C0VS6SafeRelativePath(path, label));
  const expected = [...new Set(parsed)].sort(codePointCompare);
  if (parsed.length !== expected.length || parsed.some((path, index) => path !== expected[index])) {
    fail(`${label} is not exact path-sorted unique authority`);
  }
  return Object.freeze(parsed);
}

function samePathRoster(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((path, index) => path === right[index]);
}

function publicationPathForBasename(
  packet: Phase10C0VS6PacketProtocol,
  filename: string,
): string {
  const matches = packet.paths.allowedPublicationPaths.filter((path) => basename(path) === filename);
  if (matches.length !== 1) fail(`${packet.packetId} publication filename ${filename} does not resolve exactly once`);
  return matches[0]!;
}

function allowedGeneratedDirtyRosters(packet: Phase10C0VS6PacketProtocol): readonly (readonly string[])[] {
  const rosters: Array<readonly string[]> = [Object.freeze([]), Object.freeze([
    packet.paths.preflightReceiptPath,
  ])];
  const verificationPaths = packet.paths.allowedPublicationPaths.filter(
    (path) => basename(path) === packet.verification.filename,
  );
  if (verificationPaths.length !== 1) fail(`${packet.packetId} verification path does not resolve exactly once`);
  for (const subroute of packet.terminalSubroutes) {
    const candidates = packet.candidateFilenameRosters[subroute.subrouteId];
    if (candidates === undefined) fail(`${subroute.subrouteId} lacks a candidate publication roster`);
    const beforeVerification = exactSortedUniquePaths([
      packet.paths.preflightReceiptPath,
      ...candidates.map((filename) => publicationPathForBasename(packet, filename)),
    ].sort(codePointCompare), `${subroute.subrouteId} pre-verification generated paths`);
    rosters.push(beforeVerification);
    const final = exactSortedUniquePaths([
      ...beforeVerification,
      ...(subroute.requiredOutputIds.some((outputId) => outputId.endsWith("-verification"))
        ? verificationPaths
        : []),
      packet.paths.terminalReceiptPath,
    ].sort(codePointCompare), `${subroute.subrouteId} final generated paths`);
    rosters.push(final);
  }
  const unique = new Map<string, readonly string[]>();
  for (const roster of rosters) unique.set(roster.join("\0"), roster);
  return Object.freeze([...unique.values()]);
}

function assertNormalTrackedIndex(root: string, launchHead: string): void {
  const tagged = nulRecords(
    gitBytes(root, ["ls-files", "-t", "-v", "-z"], "tracked index tags"),
    "tracked index tags",
  );
  const paths = tagged.map((entry, index) => {
    if (!entry.startsWith("H ")) fail(`tracked index tag[${index}] is not the exact normal uppercase H state`);
    return phase10C0VS6SafeRelativePath(entry.slice(2), `tracked index path[${index}]`);
  });
  const headPaths = nulRecords(
    gitBytes(root, ["ls-tree", "-r", "--name-only", "-z", launchHead], "launch-HEAD tracked roster"),
    "launch-HEAD tracked roster",
  ).map((path, index) => phase10C0VS6SafeRelativePath(path, `launch-HEAD path[${index}]`));
  if (!samePathRoster(paths, headPaths)) {
    fail("tracked index roster/tags differ from the exact launch-HEAD uppercase-H roster");
  }
}

function assertWorktreeStage(
  root: string,
  packet: Phase10C0VS6PacketProtocol,
  launchHead: string,
): readonly string[] {
  assertNormalTrackedIndex(root, launchHead);
  const status = nulRecords(
    gitBytes(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], "worktree status"),
    "worktree status",
  );
  const paths = status.map((entry, index) => {
    if (!entry.startsWith("?? ")) {
      fail(`worktree status[${index}] is not an exact untracked generated path`);
    }
    return phase10C0VS6SafeRelativePath(entry.slice(3), `worktree status path[${index}]`);
  }).sort(codePointCompare);
  const exactPaths = exactSortedUniquePaths(paths, "worktree generated paths");
  if (!allowedGeneratedDirtyRosters(packet).some((roster) => samePathRoster(roster, exactPaths))) {
    fail("worktree dirt differs from every exact clean/preflight/selected-publication lifecycle stage");
  }
  return exactPaths;
}

/** Strict stage recheck used by the retained lifecycle and adversarial filesystem tests. */
export function phase10C0VS6AssertFreezeWorktreeStage(
  repositoryRoot: string,
  packet: Phase10C0VS6PacketProtocol,
  launchHead: string,
): readonly string[] {
  return assertWorktreeStage(
    safeRoot(repositoryRoot),
    packet,
    assertPhase10C0VS6Commit(launchHead, "freeze worktree-stage launch HEAD"),
  );
}

export function phase10C0VS6ReopenFreezeRetainedPreflight(
  repositoryRoot: string,
  packet: Pick<Phase10C0VS6PacketProtocol, "paths">,
  suppliedBytes: Uint8Array,
): Phase10C0VS6ArtifactIdentity {
  const root = safeRoot(repositoryRoot);
  const liveBytes = readPhysical(root, packet.paths.preflightReceiptPath);
  if (!sameBytes(liveBytes, suppliedBytes)) {
    fail("supplied retained preflight differs from the exact live registered receipt");
  }
  return phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, liveBytes);
}

function gitPathExistsAtCommit(root: string, commit: string, path: string): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}:${path}`], {
      cwd: root,
      windowsHide: true,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

/**
 * Anti-tuning boundary for the radial producer. Every imported source that already existed at
 * the S5 science freeze must remain byte-identical there, at the S6 implementation freeze, and
 * in the launch worktree. New S6 adapter files are governed by the common-first-add rule instead.
 */
export function phase10C0VS6AssertPreexistingScienceClosureUnchanged(
  repositoryRoot: string,
  scienceFreezeCommitValue: string,
  implementationFreezeCommitValue: string,
  producerClosurePaths: readonly string[],
): readonly string[] {
  const root = safeRoot(repositoryRoot);
  const scienceFreezeCommit = assertPhase10C0VS6Commit(
    scienceFreezeCommitValue,
    "science freeze commit",
  );
  const implementationFreezeCommit = assertPhase10C0VS6Commit(
    implementationFreezeCommitValue,
    "implementation freeze commit",
  );
  const paths = [...new Set(producerClosurePaths.map((path) =>
    phase10C0VS6SafeRelativePath(path, "radial producer closure path")))]
    .sort(codePointCompare);
  if (paths.length !== producerClosurePaths.length) {
    fail("radial producer closure path roster is not exact sorted unique authority");
  }
  const preexisting = paths.filter((path) => gitPathExistsAtCommit(root, scienceFreezeCommit, path));
  if (preexisting.length === 0) {
    fail("radial producer has no S5-preexisting science closure to bind against tuning");
  }
  for (const path of preexisting) {
    const current = readPhysical(root, path);
    const launchIdentity = phase10C0VS6GitCanonicalWorktreeIdentity(root, path, current);
    const atScienceFreeze = gitBytes(
      root,
      ["show", `${scienceFreezeCommit}:${path}`],
      `${path} S5 science-freeze blob`,
    );
    const atImplementationFreeze = gitBytes(
      root,
      ["show", `${implementationFreezeCommit}:${path}`],
      `${path} implementation-freeze blob`,
    );
    const scienceIdentity = phase10C0VS6ArtifactIdentity(path, atScienceFreeze);
    const implementationIdentity = phase10C0VS6ArtifactIdentity(path, atImplementationFreeze);
    if (launchIdentity.byteLength !== scienceIdentity.byteLength ||
      launchIdentity.sha256 !== scienceIdentity.sha256 ||
      implementationIdentity.byteLength !== scienceIdentity.byteLength ||
      implementationIdentity.sha256 !== scienceIdentity.sha256) {
      fail(`${path} radial producer dependency differs from the S5 science freeze`);
    }
  }
  return Object.freeze(preexisting);
}

function addIdentity(
  roster: Map<string, Phase10C0VS6ArtifactIdentity>,
  identity: Phase10C0VS6ArtifactIdentity,
): void {
  const prior = roster.get(identity.path);
  if (prior !== undefined) phase10C0VS6SameIdentity(identity, prior, `${identity.path} freeze roster`);
  else roster.set(identity.path, identity);
}

function liveIdentity(root: string, expected: Phase10C0VS6ArtifactIdentity): Phase10C0VS6ArtifactIdentity {
  const actual = phase10C0VS6ArtifactIdentity(expected.path, readPhysical(root, expected.path));
  phase10C0VS6SameIdentity(actual, expected, `${expected.path} current bytes`);
  return actual;
}

function parseProtocolBytes(bytes: Uint8Array, label: string): Phase10C0VS6PacketProtocol {
  return parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(bytes, label));
}

function readCatalogue(root: string): Readonly<{
  identity: Phase10C0VS6ArtifactIdentity;
  catalogue: Phase10C0VS6PacketCatalogue;
}> {
  const bytes = readPhysical(root, CATALOGUE_PATH);
  return Object.freeze({
    identity: phase10C0VS6ArtifactIdentity(CATALOGUE_PATH, bytes),
    catalogue: parsePhase10C0VS6PacketCatalogue(
      parsePhase10C0VS6PrettyJsonBytes(bytes, "execution-v2 packet catalogue"),
    ),
  });
}

interface ParsedPackagePacket {
  readonly protocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly protocol: Phase10C0VS6PacketProtocol;
  readonly registryIdentity: Phase10C0VS6ArtifactIdentity;
  readonly registry: Phase10C0VS6CallableRegistry;
}

function loadPackagePackets(
  root: string,
  catalogue: Phase10C0VS6PacketCatalogue,
): readonly ParsedPackagePacket[] {
  return Object.freeze(catalogue.packets.map((entry, index) => {
    if (entry.packetId !== PHASE10_C0V_S6_PACKET_IDS[index]) fail("packet catalogue order drifted");
    const protocolBytes = readPhysical(root, entry.protocolPath);
    const protocolIdentity = phase10C0VS6ArtifactIdentity(entry.protocolPath, protocolBytes);
    const protocol = parseProtocolBytes(protocolBytes, `${entry.packetId} packet protocol`);
    const registryBytes = readPhysical(root, entry.callableRegistryPath);
    const registryIdentity = phase10C0VS6ArtifactIdentity(entry.callableRegistryPath, registryBytes);
    const registry = parsePhase10C0VS6CallableRegistry(
      parsePhase10C0VS6PrettyJsonBytes(registryBytes, `${entry.packetId} callable registry`),
    );
    if (protocol.packetId !== entry.packetId || registry.packetId !== entry.packetId ||
      registry.protocolId !== protocol.protocolId || registry.registryId !== protocol.registryId) {
      fail(`${entry.packetId} catalogue/protocol/registry scope disagrees`);
    }
    phase10C0VS6SameIdentity(protocol.bindings.callableRegistry, registryIdentity, `${entry.packetId} registry bytes`);
    return Object.freeze({ protocolIdentity, protocol, registryIdentity, registry });
  }));
}

function checkId(packetId: Phase10C0VS6PacketId): Phase10C0VS6FreezeCheckId {
  switch (packetId) {
    case "c0v-radial-produce": return "chk-c0v-radial-freeze-ancestry";
    case "c0v-moving-produce": return "chk-c0v-moving-freeze-ancestry";
    case "c0v-static-produce": return "chk-c0v-static-freeze-ancestry";
    default: fail(`${packetId} does not own a layer freeze/ancestry check`);
  }
}

function derivePhase10C0VS6ImplementationFreezeAtLaunch(
  input: Phase10C0VS6FreezeEvaluationInput,
  historicalLaunchHead: string | null,
): Phase10C0VS6ImplementationFreezeDerivation {
  const root = safeRoot(input.repositoryRoot);
  const suppliedPacketIdentity = phase10C0VS6ArtifactIdentity(
    input.packetProtocolIdentity.path,
    input.packetProtocolBytes,
  );
  phase10C0VS6SameIdentity(suppliedPacketIdentity, input.packetProtocolIdentity, "supplied packet protocol bytes");
  const suppliedProtocol = parseProtocolBytes(input.packetProtocolBytes, "supplied packet protocol");
  const observedArtifactFailures = phase10C0VS6ObserveRadialArtifactFailures(root, suppliedProtocol);
  if (observedArtifactFailures.length > 1) {
    fail("more than one radial science/reference binding failed; no registered refusal route applies");
  }
  const failedArtifact = observedArtifactFailures[0] ?? null;
  const catalogueAuthority = readCatalogue(root);
  phase10C0VS6SameIdentity(
    catalogueAuthority.identity,
    suppliedProtocol.bindings.packetCatalogue,
    "supplied protocol packet catalogue",
  );
  const packets = loadPackagePackets(root, catalogueAuthority.catalogue);
  const selected = packets.filter((entry) => entry.protocol.packetId === suppliedProtocol.packetId);
  if (selected.length !== 1) fail("supplied packet does not resolve exactly one package protocol");
  phase10C0VS6SameIdentity(
    (selected[0] as ParsedPackagePacket).protocolIdentity,
    input.packetProtocolIdentity,
    "supplied packet protocol versus package bytes",
  );

  const frozen = new Map<string, Phase10C0VS6ArtifactIdentity>();
  const callableAudits = new Map<string, Array<Readonly<{
    packetId: Phase10C0VS6PacketId;
    role: Phase10C0VS6CallableRegistry["callables"][number]["role"];
    modulePath: string;
    exportName: string;
    audit: Phase10C0VS6ImportAuditReceipt;
  }>>>();
  const registeredCallableIds: string[] = [];
  const anchors = new Set<string>([CATALOGUE_PATH, README_PATH]);
  const gitCanonicalMetadataPaths = new Set<string>(RULE_PATHS);
  const rawClosurePaths = new Set<string>();
  addIdentity(frozen, catalogueAuthority.identity);
  for (const path of RULE_PATHS) {
    addIdentity(frozen, phase10C0VS6GitCanonicalWorktreeIdentity(root, path));
  }
  addIdentity(frozen, phase10C0VS6ArtifactIdentity(README_PATH, readPhysical(root, README_PATH)));
  for (const entrypoint of catalogueAuthority.catalogue.runtimeEntrypoints) {
    const moduleIdentity = phase10C0VS6ArtifactIdentity(
      entrypoint.modulePath,
      readPhysical(root, entrypoint.modulePath),
    );
    const audit = phase10C0VS6AssertRuntimeEntrypointRegistration(root, {
      role: entrypoint.role,
      modulePath: entrypoint.modulePath,
      exportName: entrypoint.exportName,
      identity: moduleIdentity,
    });
    if (JSON.stringify(audit.parserRuntimeArtifacts) !==
      JSON.stringify(PHASE10_C0V_S6_TYPESCRIPT_RUNTIME_ARTIFACTS)) {
      fail(`${entrypoint.role} parser runtime trust receipt differs from the pre-loaded exact artifacts`);
    }
    anchors.add(entrypoint.modulePath);
    for (const identity of audit.closure) {
      rawClosurePaths.add(identity.path);
      addIdentity(frozen, identity);
    }
    for (const identity of audit.resolutionArtifacts) {
      gitCanonicalMetadataPaths.add(identity.path);
      addIdentity(frozen, identity);
    }
  }
  for (const packet of packets) {
    addIdentity(frozen, packet.protocolIdentity);
    addIdentity(frozen, packet.registryIdentity);
    anchors.add(packet.protocolIdentity.path);
    anchors.add(packet.registryIdentity.path);
    for (const identity of [
      packet.protocol.bindings.matrix,
      packet.protocol.bindings.packetCatalogue,
      packet.protocol.bindings.callableRegistry,
      packet.protocol.bindings.predecessorSchemaRegistry,
      packet.protocol.bindings.predecessorSchemaContracts,
      packet.protocol.bindings.successorSchemaRegistry,
      packet.protocol.bindings.successorSchemaContracts,
      packet.protocol.bindings.scienceProtocol,
      packet.protocol.bindings.referenceOrRefusal,
      ...packet.protocol.bindings.originalApEvidence,
    ]) {
      if (identity !== null && identity.path !== failedArtifact?.expected.path) {
        addIdentity(frozen, liveIdentity(root, identity));
      }
    }
    anchors.add(packet.protocol.bindings.matrix.path);
    anchors.add(packet.protocol.bindings.successorSchemaRegistry.path);
    anchors.add(packet.protocol.bindings.successorSchemaContracts.path);
    for (const callable of packet.registry.callables) {
      registeredCallableIds.push(callable.callableId);
      if (callable.resolution !== "resolved" || callable.identity === null) {
        fail(`${callable.callableId} is not resolved at implementation freeze`);
      }
      const moduleIdentity = Object.freeze({ path: callable.modulePath, ...callable.identity });
      const audit = phase10C0VS6AssertCallableRegistration(root, {
        callableId: callable.callableId,
        modulePath: callable.modulePath,
        exportName: callable.exportName,
        identity: moduleIdentity,
      });
      const expectedExternalPackages = TYPESCRIPT_AUTHORIZED_CALLABLE_IDS.has(callable.callableId)
        ? ["typescript"]
        : [];
      if (audit.externalPackages.length !== expectedExternalPackages.length ||
        audit.externalPackages.some((entry, index) => entry !== expectedExternalPackages[index]) ||
        (expectedExternalPackages.length === 1 &&
          !audit.closure.some((entry) => entry.path === "runner/src/phase10-c0v-s6-import-audit.ts"))) {
        fail(`${callable.callableId} external-package closure differs from its exact allowlist`);
      }
      const priorAudits = callableAudits.get(callable.callableId) ?? [];
      priorAudits.push(Object.freeze({
        packetId: packet.protocol.packetId,
        role: callable.role,
        modulePath: callable.modulePath,
        exportName: callable.exportName,
        audit,
      }));
      callableAudits.set(callable.callableId, priorAudits);
      if (JSON.stringify(audit.parserRuntimeArtifacts) !==
        JSON.stringify(PHASE10_C0V_S6_TYPESCRIPT_RUNTIME_ARTIFACTS)) {
        fail(`${callable.callableId} parser runtime trust receipt differs from the pre-loaded exact artifacts`);
      }
      anchors.add(callable.modulePath);
      for (const identity of audit.closure) {
        rawClosurePaths.add(identity.path);
        addIdentity(frozen, identity);
      }
      for (const identity of audit.resolutionArtifacts) {
        gitCanonicalMetadataPaths.add(identity.path);
        addIdentity(frozen, identity);
      }
    }
  }
  phase10C0VS6AssertBuiltinAllowlistRegistryCoverage(registeredCallableIds);
  phase10C0VS6AssertRawClosureEolAuthority(root, [...rawClosurePaths]);
  for (const [callableId, registrations] of callableAudits) {
    const baseline = registrations[0];
    if (baseline === undefined || registrations.some((entry) =>
      entry.role !== baseline.role || entry.modulePath !== baseline.modulePath ||
      entry.exportName !== baseline.exportName || JSON.stringify(entry.audit) !== JSON.stringify(baseline.audit))) {
      fail(`${callableId} repeated registration differs in role/module/export/identity/import closure`);
    }
  }
  const radialPackets = packets.filter((entry) => entry.protocol.packetId === "c0v-radial-produce");
  if (radialPackets.length !== 1 || radialPackets[0]!.protocol.radialBinaryLayout === null) {
    fail("package lacks exactly one radial binary-layout authority");
  }
  const radialProducer = (callableAudits.get("phase10-c0v-radial-production-producer") ?? [])
    .filter((entry) => entry.packetId === "c0v-radial-produce");
  const radialEvaluator = (callableAudits.get("phase10-c0v-radial-evaluator") ?? [])
    .filter((entry) => entry.packetId === "c0v-radial-produce");
  if (radialProducer.length !== 1 || radialProducer[0]!.role !== "producer" ||
    radialEvaluator.length !== 1 || radialEvaluator[0]!.role !== "independent-evaluator") {
    fail("radial production/evaluator callable role or packet scope drifted");
  }
  phase10C0VS6AssertScientificClosureSeparation(
    radialProducer[0]!.audit,
    radialEvaluator[0]!.audit,
    radialPackets[0]!.protocol.radialBinaryLayout.producerEvaluatorSharedRuntimeClosurePaths,
  );
  const radialPreObservationAuthority = radialPackets[0]!.protocol.preObservationProductionClosure;
  if (radialPreObservationAuthority === null) {
    fail("radial packet lacks its exact pre-observation production closure authority");
  }
  const radialProducerPreexisting = new Map<string, Phase10C0VS6ArtifactIdentity>();
  for (const identity of [
    ...radialProducer[0]!.audit.closure,
    ...radialProducer[0]!.audit.resolutionArtifacts,
  ]) {
    if (gitPathExistsAtCommit(root, S5_SCIENCE_FREEZE_COMMIT, identity.path)) {
      addIdentity(radialProducerPreexisting, identity);
    }
  }
  const radialProducerPreexistingArtifacts = Object.freeze(
    [...radialProducerPreexisting.values()]
      .sort((left, right) => codePointCompare(left.path, right.path)),
  );
  if (radialProducerPreexistingArtifacts.length !== radialPreObservationAuthority.artifacts.length) {
    fail("live radial producer S5-preexisting closure membership differs from packet authority");
  }
  for (let index = 0; index < radialProducerPreexistingArtifacts.length; index += 1) {
    phase10C0VS6SameIdentity(
      radialProducerPreexistingArtifacts[index]!,
      radialPreObservationAuthority.artifacts[index]!,
      `radial producer S5-preexisting closure[${index}]`,
    );
  }
  for (const path of frozen.keys()) {
    if (!gitPathExistsAtCommit(root, GOVERNANCE_COMMIT, path)) anchors.add(path);
  }
  const anchorPaths = Object.freeze([...anchors].sort(codePointCompare));
  const firstAdds = new Set<string>();
  for (const path of anchorPaths) {
    const commits = gitText(root, ["log", "--diff-filter=A", "--format=%H", "HEAD", "--", path], `${path} first-add history`)
      .split(/\r?\n/u).filter((entry) => entry.length !== 0);
    if (commits.length !== 1) fail(`${path} does not have exactly one first-add commit`);
    firstAdds.add(assertPhase10C0VS6Commit(commits[0], `${path} first-add commit`));
  }
  if (firstAdds.size !== 1) fail("execution-v2 authority/callable anchors do not share one first-introduction commit");
  const implementationFreezeCommit = [...firstAdds][0] as string;
  const currentHead = assertPhase10C0VS6Commit(
    gitText(root, ["rev-parse", "HEAD"], historicalLaunchHead === null ? "launch HEAD" : "current HEAD"),
    historicalLaunchHead === null ? "launch HEAD" : "current HEAD",
  );
  const launchHead = historicalLaunchHead === null
    ? currentHead
    : assertPhase10C0VS6Commit(historicalLaunchHead, "historical launch HEAD");
  const launchBranch = gitText(root, ["branch", "--show-current"], "launch branch");
  if (launchBranch !== "phase10/evidence-verification") fail("launch branch differs from frozen authority");
  if (historicalLaunchHead === null) {
    const generatedDirtyPaths = assertWorktreeStage(root, suppliedProtocol, launchHead);
    const preflightIsMaterialized = generatedDirtyPaths.includes(suppliedProtocol.paths.preflightReceiptPath);
    if (preflightIsMaterialized) {
      phase10C0VS6ReopenFreezeRetainedPreflight(root, suppliedProtocol, input.preflightBytes);
    }
  } else {
    assertNormalTrackedIndex(root, currentHead);
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", launchHead, currentHead], {
        cwd: root, windowsHide: true, stdio: "ignore",
      });
    } catch {
      fail("historical launch HEAD is not an ancestor of current HEAD");
    }
  }
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", implementationFreezeCommit, launchHead], {
      cwd: root, windowsHide: true, stdio: "ignore",
    });
  } catch {
    fail("implementation freeze is not an ancestor of launch HEAD");
  }
  const artifacts = Object.freeze([...frozen.values()].sort((left, right) => codePointCompare(left.path, right.path)));
  for (const artifact of artifacts) {
    const current = readPhysical(root, artifact.path);
    const currentIdentity = gitCanonicalMetadataPaths.has(artifact.path)
      ? phase10C0VS6GitCanonicalWorktreeIdentity(root, artifact.path, current)
      : phase10C0VS6ArtifactIdentity(artifact.path, current);
    phase10C0VS6SameIdentity(currentIdentity, artifact, `${artifact.path} current freeze identity`);
    const atFreeze = gitBytes(
      root,
      ["show", `${implementationFreezeCommit}:${artifact.path}`],
      `${artifact.path} implementation-freeze blob`,
    );
    if (artifact.byteLength !== atFreeze.byteLength ||
      artifact.sha256 !== phase10C0VS6ArtifactIdentity(artifact.path, atFreeze).sha256) {
      fail(`${artifact.path} differs between implementation freeze and launch`);
    }
    if (historicalLaunchHead !== null) {
      const atLaunch = gitBytes(
        root,
        ["show", `${launchHead}:${artifact.path}`],
        `${artifact.path} historical launch blob`,
      );
      if (artifact.byteLength !== atLaunch.byteLength ||
        artifact.sha256 !== phase10C0VS6ArtifactIdentity(artifact.path, atLaunch).sha256) {
        fail(`${artifact.path} differs between implementation freeze and historical launch`);
      }
    }
  }
  phase10C0VS6AssertPreexistingScienceClosureUnchanged(
    root,
    radialPreObservationAuthority.commit,
    implementationFreezeCommit,
    radialProducerPreexistingArtifacts.map((entry) => entry.path),
  );
  return Object.freeze({
    implementationFreezeCommit,
    launchHead,
    launchBranch: "phase10/evidence-verification",
    anchorPaths,
    artifacts,
    parserRuntimeArtifacts: PHASE10_C0V_S6_TYPESCRIPT_RUNTIME_ARTIFACTS,
    artifactFailure: failedArtifact,
  });
}

export function derivePhase10C0VS6ImplementationFreeze(
  input: Phase10C0VS6FreezeEvaluationInput,
): Phase10C0VS6ImplementationFreezeDerivation {
  return derivePhase10C0VS6ImplementationFreezeAtLaunch(input, null);
}

/**
 * Fresh post-preflight freeze authority shared by every execution-v2 packet.  Unlike the
 * clean-launch derivation primitive, this public retained evaluator requires the exact live
 * registered preflight and rechecks every still-observable Git/registry/runtime fact after the
 * protocol-authorized generated-dirt transition.
 */
export function independentlyEvaluatePhase10C0VS6RetainedFreeze(
  input: Phase10C0VS6FreezeEvaluationInput,
): Phase10C0VS6RetainedFreezeEvaluation {
  const protocol = parseProtocolBytes(input.packetProtocolBytes, "freeze packet protocol");
  phase10C0VS6ReopenFreezeRetainedPreflight(input.repositoryRoot, protocol, input.preflightBytes);
  const derivation = derivePhase10C0VS6ImplementationFreeze(input);
  const registryBytes = readPhysical(safeRoot(input.repositoryRoot), protocol.bindings.callableRegistry.path);
  const registryIdentity = phase10C0VS6ArtifactIdentity(protocol.bindings.callableRegistry.path, registryBytes);
  phase10C0VS6SameIdentity(registryIdentity, protocol.bindings.callableRegistry, "freeze callable registry");
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryBytes, "freeze callable registry"),
  );
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, "freeze retained preflight"),
    protocol,
    input.packetProtocolIdentity,
  );
  const retainedFailure = phase10C0VS6ValidatePreflightArtifactFailure(
    input.repositoryRoot,
    protocol,
    preflight,
  );
  if (JSON.stringify(retainedFailure) !== JSON.stringify(derivation.artifactFailure)) {
    fail("retained preflight artifact-failure branch differs from fresh Git/live derivation");
  }
  if (preflight.observed.head !== derivation.launchHead) fail("retained preflight launch HEAD differs from Git");
  validatePhase10C0VS6RetainedPreflightRegistryContext(
    preflight,
    registry,
    registryIdentity,
    derivation.implementationFreezeCommit,
    true,
    derivation.artifacts,
  );
  return Object.freeze({
    ...derivation,
    packetId: protocol.packetId,
    verdict: "pass",
    errors: Object.freeze([]),
  });
}

/**
 * Reopens a prior packet's retained freeze after later evidence-only commits have advanced HEAD.
 * The historical launch commit comes from the strict retained preflight, is required to be an
 * ancestor of current HEAD, and every frozen artifact is independently matched to both the common
 * implementation-freeze blob and that historical launch blob.  Current worktree cleanliness is
 * deliberately not substituted for the contemporaneous clean-launch observation.
 */
export function independentlyReopenPhase10C0VS6HistoricalFreeze(
  input: Phase10C0VS6FreezeEvaluationInput,
): Phase10C0VS6HistoricalFreezeProjection {
  const root = safeRoot(input.repositoryRoot);
  const protocol = parseProtocolBytes(input.packetProtocolBytes, "historical freeze packet protocol");
  phase10C0VS6ReopenFreezeRetainedPreflight(root, protocol, input.preflightBytes);
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, "historical freeze retained preflight"),
    protocol,
    input.packetProtocolIdentity,
  );
  // Reject an observable frozen TypeScript-source drift before performing the much more
  // expensive full transitive import audit.  This is only an early fail-closed check: the
  // derivation below still reopens every artifact, Git blob, registry, and closure and remains
  // the sole source of positive authority.
  for (const artifact of preflight.observed.codeFreeze.artifacts) {
    if (!artifact.path.endsWith(".ts")) continue;
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(artifact.path, readPhysical(root, artifact.path)),
      artifact,
      `${artifact.path} retained historical TypeScript freeze identity`,
    );
  }
  const derivation = derivePhase10C0VS6ImplementationFreezeAtLaunch(input, preflight.observed.head);
  const registryBytes = readPhysical(root, protocol.bindings.callableRegistry.path);
  const registryIdentity = phase10C0VS6ArtifactIdentity(protocol.bindings.callableRegistry.path, registryBytes);
  phase10C0VS6SameIdentity(registryIdentity, protocol.bindings.callableRegistry, "historical freeze callable registry");
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryBytes, "historical freeze callable registry"),
  );
  const retainedFailure = phase10C0VS6ValidatePreflightArtifactFailure(root, protocol, preflight);
  if (JSON.stringify(retainedFailure) !== JSON.stringify(derivation.artifactFailure)) {
    fail("historical retained artifact-failure branch differs from current exact-byte derivation");
  }
  validatePhase10C0VS6RetainedPreflightRegistryContext(
    preflight,
    registry,
    registryIdentity,
    derivation.implementationFreezeCommit,
    true,
    derivation.artifacts,
  );
  const preflightIdentity = phase10C0VS6ArtifactIdentity(protocol.paths.preflightReceiptPath, input.preflightBytes);
  const receiptPath = `${preflight.observed.attemptDirectory}/${protocol.freezeEvaluationContract.filename}`;
  const receiptBytes = readPhysical(root, receiptPath);
  const receiptIdentity = phase10C0VS6ArtifactIdentity(receiptPath, receiptBytes);
  const receipt = parsePhase10C0VS6FreezeEvaluationBytes(receiptBytes, protocol, {
    protocol: input.packetProtocolIdentity,
    preflight: preflightIdentity,
    implementationFreezeCommit: derivation.implementationFreezeCommit,
    launchHead: derivation.launchHead,
    launchBranch: derivation.launchBranch,
    anchorPaths: derivation.anchorPaths,
    artifacts: derivation.artifacts,
    parserRuntimeArtifacts: derivation.parserRuntimeArtifacts,
    artifactFailure: derivation.artifactFailure,
  });
  const retained: Phase10C0VS6RetainedFreezeEvaluation = Object.freeze({
    ...derivation,
    packetId: protocol.packetId,
    verdict: "pass",
    errors: Object.freeze([]),
  });
  const producePacket = protocol.packetId === "c0v-moving-produce" ||
    protocol.packetId === "c0v-radial-produce" || protocol.packetId === "c0v-static-produce";
  const ancestryCallerResult = producePacket
    ? (() => {
      const selectedCheckId = checkId(protocol.packetId);
      if (!protocol.registeredCheckIds.includes(selectedCheckId)) {
        fail(`${selectedCheckId} is absent from the historical packet's registered check roster`);
      }
      const evaluation: Phase10C0VS6FreezeAncestryEvaluation = Object.freeze({
        ...derivation,
        checkId: selectedCheckId,
        packetId: protocol.packetId,
        verdict: "pass",
        errors: Object.freeze([]),
      });
      return Object.freeze({
        evaluation,
        executedCheckIds: Object.freeze([selectedCheckId] as const),
        evaluatedCheckIds: Object.freeze([selectedCheckId] as const),
        executedNegativeControlIds: Object.freeze([]),
      });
    })()
    : null;
  return Object.freeze({ retained, receipt, receiptIdentity, ancestryCallerResult });
}

export function independentlyEvaluatePhase10C0VS6FreezeAncestry(
  input: Phase10C0VS6FreezeEvaluationInput,
): Phase10C0VS6FreezeAncestryEvaluation {
  const retained = independentlyEvaluatePhase10C0VS6RetainedFreeze(input);
  const selectedCheckId = checkId(retained.packetId);
  const protocol = parseProtocolBytes(input.packetProtocolBytes, "freeze packet protocol check scope");
  if (!protocol.registeredCheckIds.includes(selectedCheckId)) {
    fail(`${selectedCheckId} is absent from the packet's registered check roster`);
  }
  return Object.freeze({
    ...retained,
    checkId: selectedCheckId,
    packetId: retained.packetId as Phase10C0VS6FreezeAncestryEvaluation["packetId"],
  });
}

export function phase10C0VS6FreezeAncestryCheckCaller(
  input: Phase10C0VS6FreezeEvaluationInput,
): Phase10C0VS6FreezeAncestryCheckCallerResult {
  const evaluation = independentlyEvaluatePhase10C0VS6FreezeAncestry(input);
  return Object.freeze({
    evaluation,
    executedCheckIds: Object.freeze([evaluation.checkId] as const),
    evaluatedCheckIds: Object.freeze([evaluation.checkId] as const),
    executedNegativeControlIds: Object.freeze([]),
  });
}
