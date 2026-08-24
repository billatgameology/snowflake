import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { strictJsonSnapshot } from "./gate4-evidence.ts";
import {
  parsePhase10C0VS6ArtifactIdentity,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6Object,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6DependencyArtifactRosterVariants,
  validatePhase10C0VS6RetainedPreflightEvidenceManifest,
  type Phase10C0VS6DependencyArtifactContract,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  derivePhase10C0VS6RetainedRuntimeAuthority,
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";

export interface Phase10C0VS6ReopenedDependencyArtifact {
  readonly packetId: string;
  readonly schemaId: string;
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly bytes: Uint8Array;
}

export interface Phase10C0VS6ReopenedDependencySet {
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly preflight: Phase10C0VS6RetainedPreflight;
  readonly selectedContracts: readonly Phase10C0VS6DependencyArtifactContract[];
  readonly artifacts: readonly Phase10C0VS6ReopenedDependencyArtifact[];
}

export interface Phase10C0VS6RetainedDependencyAuthorityInput {
  readonly repositoryRoot: string;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly preflight: Phase10C0VS6RetainedPreflight;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 dependency refused: ${message}`);
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

function rootPath(repositoryRoot: string): string {
  const requested = resolve(repositoryRoot);
  const root = realpathSync(requested);
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() ||
    relative(requested, root) !== "" || relative(root, requested) !== "") {
    fail("repository root must be a physical directory without an alias or junction");
  }
  return root;
}

function read(root: string, pathValue: string): Uint8Array {
  const path = phase10C0VS6SafeRelativePath(pathValue, "dependency artifact path");
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) {
    fail(`${path} escapes repository root`);
  }
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${path} is not a unique regular file`);
  }
  const physical = realpathSync(absolute);
  const physicalDisplacement = relative(root, physical);
  if (physicalDisplacement === "" || physicalDisplacement === ".." ||
    physicalDisplacement.startsWith(`..${sep}`) || isAbsolute(physicalDisplacement) ||
    relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${path} resolves through an alias, junction, or outside the repository`);
  }
  return new Uint8Array(readFileSync(physical));
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

export interface Phase10C0VS6HistoricalManifestAuthority {
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly entries: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>;
  readonly bytes: Uint8Array;
}

function parseManifestEntries(bytes: Uint8Array): ReadonlyMap<string, Phase10C0VS6ArtifactIdentity> {
  const value = phase10C0VS6Object(
    (() => {
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return strictJsonSnapshot(JSON.parse(text) as unknown);
      } catch (error) {
        fail(`evidence manifest is not strict UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    })(),
    "evidence manifest",
  );
  phase10C0VS6ExactOrderedKeys(
    value,
    ["schema", "movedFrom", "movedTo", "note", "fileCount", "totalBytes", "files"],
    "evidence manifest",
  );
  if (value.schema !== "phase6-evidence-manifest-v1" ||
    !Number.isSafeInteger(value.fileCount) || !Number.isSafeInteger(value.totalBytes)) {
    fail("evidence manifest identity/count fields are malformed");
  }
  const files = phase10C0VS6Object(value.files, "evidence manifest.files");
  const entries = new Map<string, Phase10C0VS6ArtifactIdentity>();
  for (const [relativePath, raw] of Object.entries(files)) {
    const row = phase10C0VS6Object(raw, `evidence manifest ${relativePath}`);
    phase10C0VS6ExactOrderedKeys(row, ["bytes", "sha256"], `evidence manifest ${relativePath}`);
    entries.set(`evidence/${relativePath}`, parsePhase10C0VS6ArtifactIdentity({
      path: `evidence/${relativePath}`,
      byteLength: row.bytes,
      sha256: row.sha256,
    }, `evidence manifest ${relativePath}`));
  }
  const totalBytes = [...entries.values()].reduce((sum, entry) => sum + entry.byteLength, 0);
  if (value.fileCount !== entries.size || value.totalBytes !== totalBytes) {
    fail("evidence manifest aggregate counts differ from its exact file roster");
  }
  return entries;
}

/**
 * Reopens the evidence manifest exactly as recorded at a historical packet's launch HEAD. Unlike
 * the current-launch helper below, it deliberately does not require today's live manifest to be
 * byte-identical: later selected packets necessarily extend that tracked file. The returned old
 * pins remain load-bearing for every historical dependency byte.
 */
export function phase10C0VS6HistoricalHeadManifest(
  repositoryRoot: string,
  launchHead: string,
): Phase10C0VS6HistoricalManifestAuthority {
  if (!/^[0-9a-f]{40}$/u.test(launchHead)) fail("launch HEAD is not lowercase 40-hex");
  const root = rootPath(repositoryRoot);
  let committedBytes: Uint8Array;
  try {
    committedBytes = new Uint8Array(execFileSync(
      "git",
      ["show", `${launchHead}:evidence/MANIFEST.json`],
      { cwd: root, windowsHide: true },
    ));
  } catch (error) {
    fail(`cannot reopen evidence/MANIFEST.json at launch HEAD: ${error instanceof Error ? error.message : String(error)}`);
  }
  const identity = phase10C0VS6ArtifactIdentity("evidence/MANIFEST.json", committedBytes);
  return Object.freeze({
    identity,
    entries: parseManifestEntries(committedBytes),
    bytes: new Uint8Array(committedBytes),
  });
}

export function phase10C0VS6HeadBoundManifestEntries(
  repositoryRoot: string,
  launchHead: string,
): ReadonlyMap<string, Phase10C0VS6ArtifactIdentity> {
  const root = rootPath(repositoryRoot);
  const liveBytes = read(root, "evidence/MANIFEST.json");
  const historical = phase10C0VS6HistoricalHeadManifest(root, launchHead);
  if (!sameBytes(liveBytes, historical.bytes)) {
    fail("live evidence/MANIFEST.json bytes differ from the retained preflight launch HEAD");
  }
  return historical.entries;
}

export function phase10C0VS6ValidateHeadBoundPreflightManifest(
  repositoryRoot: string,
  preflight: Phase10C0VS6RetainedPreflight,
): ReadonlyMap<string, Phase10C0VS6ArtifactIdentity> {
  const root = rootPath(repositoryRoot);
  const entries = phase10C0VS6HeadBoundManifestEntries(root, preflight.observed.head);
  const liveBytes = read(root, "evidence/MANIFEST.json");
  const liveIdentity = phase10C0VS6ArtifactIdentity("evidence/MANIFEST.json", liveBytes);
  // HeadBoundManifestEntries proved the live bytes raw-equal git-show at this exact launch HEAD,
  // so the same canonical identity is independently both the recorded-HEAD and reopened-live side.
  validatePhase10C0VS6RetainedPreflightEvidenceManifest(
    preflight,
    liveIdentity,
    liveIdentity,
  );
  return entries;
}

function validateIdentity(
  root: string,
  expected: Phase10C0VS6ArtifactIdentity,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
): Uint8Array {
  const bytes = read(root, expected.path);
  const actual = phase10C0VS6ArtifactIdentity(expected.path, bytes);
  phase10C0VS6SameIdentity(actual, expected, `${expected.path} retained preflight identity`);
  const pinned = manifest.get(expected.path);
  if (pinned === undefined) fail(`${expected.path} is absent from evidence/MANIFEST.json`);
  phase10C0VS6SameIdentity(actual, pinned, `${expected.path} manifest pin`);
  return bytes;
}

function exactDependencyContractVariant(
  protocol: Phase10C0VS6PacketProtocol,
  observed: readonly Phase10C0VS6ArtifactIdentity[],
): readonly Phase10C0VS6DependencyArtifactContract[] {
  const observedPaths = observed.map((entry) => entry.path);
  const matches = phase10C0VS6DependencyArtifactRosterVariants(protocol).filter((variant) => {
    const expectedPaths = variant.map((entry) => entry.artifactPath).sort(codePointCompare);
    return expectedPaths.length === observedPaths.length &&
      expectedPaths.every((entry, index) => entry === observedPaths[index]);
  });
  if (matches.length !== 1) {
    fail("retained dependency identities do not select exactly one protocol artifact-roster variant");
  }
  return matches[0]!;
}

/**
 * Reopens the complete dependency roster from the live current packet and its retained preflight.
 * The caller supplies no dependency paths, schemas, verdicts, or disposition semantics. Those are
 * selected only by the strict packet protocol. Every tracked identity is checked against both its
 * live unique physical bytes and the evidence manifest before a schema-specific verifier may use it.
 *
 * This function intentionally grants no dependency credit. The schema-specific v1/v2 verifier must
 * consume its result and independently rederive terminal and verification meaning from these bytes.
 */
export function phase10C0VS6ReopenPublishedDependencies(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6ReopenedDependencySet {
  const authority = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  return phase10C0VS6ReopenPublishedDependenciesFromRetainedAuthority({
    repositoryRoot: input.repositoryRoot,
    packet: authority.packet,
    preflight: authority.preflight,
  });
}

/**
 * No-credit dependency byte reopener for a strict, already-parsed retained preflight. This seam is
 * used while constructing a new preflight, before those canonical bytes have a live final path.
 * It does not accept caller paths or outcome semantics: the packet roster variant and every full
 * identity still come from the parsed receipt and are checked against the launch-HEAD manifest.
 */
export function phase10C0VS6ReopenPublishedDependenciesFromRetainedAuthority(
  input: Phase10C0VS6RetainedDependencyAuthorityInput,
): Phase10C0VS6ReopenedDependencySet {
  const root = rootPath(input.repositoryRoot);
  const manifest = phase10C0VS6ValidateHeadBoundPreflightManifest(root, input.preflight);
  return reopenDependenciesAgainstManifest(root, input, manifest);
}

/**
 * Historical equivalent used only while verifying an already-selected earlier packet after later
 * evidence commits. Its retained preflight must bind the exact manifest blob at its own launch
 * HEAD; today's live manifest is neither substituted nor required to remain the older byte set.
 */
export function phase10C0VS6ReopenHistoricalPublishedDependenciesFromRetainedAuthority(
  input: Phase10C0VS6RetainedDependencyAuthorityInput,
): Phase10C0VS6ReopenedDependencySet {
  const root = rootPath(input.repositoryRoot);
  const historical = phase10C0VS6HistoricalHeadManifest(root, input.preflight.observed.head);
  phase10C0VS6SameIdentity(
    input.preflight.observed.evidenceManifest,
    historical.identity,
    "historical retained-preflight evidence manifest",
  );
  return reopenDependenciesAgainstManifest(root, input, historical.entries);
}

function reopenDependenciesAgainstManifest(
  root: string,
  input: Phase10C0VS6RetainedDependencyAuthorityInput,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
): Phase10C0VS6ReopenedDependencySet {
  const selectedContracts = exactDependencyContractVariant(
    input.packet,
    input.preflight.observed.dependencyArtifacts,
  );
  const artifacts = input.preflight.observed.dependencyArtifacts.map((expected) => {
    const contracts = selectedContracts.filter((contract) => contract.artifactPath === expected.path);
    if (contracts.length !== 1) {
      fail(`${expected.path} does not resolve exactly one outcome-selected dependency contract`);
    }
    const contract = contracts[0]!;
    const bytes = validateIdentity(root, expected, manifest);
    if (contract.schemaId !== "phase10-c0v-radial-witness-v1") {
      const value = phase10C0VS6Object(
        phase10C0VS6ParsePrettyJson(bytes, `${expected.path} dependency bytes`),
        `${expected.path} dependency document`,
      );
      if (value.schema !== contract.schemaId) {
        fail(`${expected.path} schema differs from the outcome-selected dependency contract`);
      }
    }
    return Object.freeze({
      packetId: contract.packetId,
      schemaId: contract.schemaId,
      identity: expected,
      bytes,
    });
  });
  for (const packetId of input.packet.boundDependencyPacketIds) {
    if (!artifacts.some((artifact) => artifact.packetId === packetId)) {
      fail(`${packetId} has no reopened dependency artifact`);
    }
  }
  return Object.freeze({
    packet: input.packet,
    preflight: input.preflight,
    selectedContracts,
    artifacts: Object.freeze(artifacts),
  });
}
