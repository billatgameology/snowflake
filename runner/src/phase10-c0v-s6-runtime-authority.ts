import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  phase10C0VS6ValidatePreflightArtifactFailure,
} from "./phase10-c0v-s6-artifact-observation.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RetainedPreflight,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";

export interface Phase10C0VS6RawRuntimeAuthorityInput {
  readonly repositoryRoot: string;
  readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly preflightBytes: Uint8Array;
}

export interface Phase10C0VS6RetainedRuntimeAuthority {
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly preflight: Phase10C0VS6RetainedPreflight;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 runtime authority refused: ${message}`);
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

function readPhysical(root: string, pathValue: string): Uint8Array {
  if (pathValue.length === 0 || pathValue.includes("\\") || pathValue.startsWith("/") ||
    /^[A-Za-z]:/u.test(pathValue) || pathValue.split("/").some((entry) => entry === "" || entry === "." || entry === "..")) {
    fail("authority path is not a safe repository-relative path");
  }
  const absolute = resolve(root, pathValue);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail("authority path escapes repository root");
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

function requireLiveIdentity(root: string, identity: Phase10C0VS6ArtifactIdentity, label: string): void {
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(identity.path, readPhysical(root, identity.path)),
    identity,
    label,
  );
}

export function derivePhase10C0VS6RetainedRuntimeAuthority(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6RetainedRuntimeAuthority {
  const root = safeRoot(input.repositoryRoot);
  const actualIdentity = phase10C0VS6ArtifactIdentity(
    input.packetProtocolIdentity.path,
    input.packetProtocolBytes,
  );
  phase10C0VS6SameIdentity(actualIdentity, input.packetProtocolIdentity, "packet protocol raw bytes");
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(input.packetProtocolBytes, "packet protocol"),
  );
  const expectedPath =
    `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets/${packet.packetId}/protocol.json`;
  if (input.packetProtocolIdentity.path !== expectedPath) {
    fail("packet protocol identity path differs from exact packet authority path");
  }
  const livePacketBytes = readPhysical(root, expectedPath);
  const livePacketIdentity = phase10C0VS6ArtifactIdentity(expectedPath, livePacketBytes);
  phase10C0VS6SameIdentity(livePacketIdentity, input.packetProtocolIdentity, "live catalogue-selected packet protocol");
  if (livePacketBytes.byteLength !== input.packetProtocolBytes.byteLength ||
    livePacketBytes.some((value, index) => value !== input.packetProtocolBytes[index])) {
    fail("caller packet protocol bytes differ from live tracked bytes");
  }
  const catalogueBytes = readPhysical(root, packet.bindings.packetCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.packetCatalogue.path, catalogueBytes),
    packet.bindings.packetCatalogue,
    "live packet catalogue",
  );
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "live packet catalogue"),
  );
  const entries = catalogue.packets.filter((entry) => entry.packetId === packet.packetId);
  if (entries.length !== 1 || entries[0]!.protocolPath !== expectedPath ||
    entries[0]!.preflightReceiptPath !== packet.paths.preflightReceiptPath ||
    entries[0]!.callableRegistryPath !== packet.bindings.callableRegistry.path) {
    fail("live packet catalogue disagrees with packet protocol paths");
  }
  const livePreflightBytes = readPhysical(root, packet.paths.preflightReceiptPath);
  if (livePreflightBytes.byteLength !== input.preflightBytes.byteLength ||
    livePreflightBytes.some((value, index) => value !== input.preflightBytes[index])) {
    fail("caller retained preflight bytes differ from live tracked receipt");
  }
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, "retained preflight"),
    packet,
    input.packetProtocolIdentity,
  );
  const failedArtifact = phase10C0VS6ValidatePreflightArtifactFailure(root, packet, preflight);
  for (const [identity, label, role] of [
    [packet.bindings.matrix, "live S6 matrix", "matrix"],
    [packet.bindings.callableRegistry, "live callable registry", "callable-registry"],
    [packet.bindings.successorSchemaRegistry, "live successor schema registry", "successor-schema-registry"],
    [packet.bindings.successorSchemaContracts, "live successor schema contracts", "successor-schema-contracts"],
    [packet.bindings.scienceProtocol, "live science protocol", "science-protocol"],
    [packet.bindings.referenceOrRefusal, "live reference/refusal", "reference-or-refusal"],
  ] as const) {
    if (identity !== null && failedArtifact?.artifactRole !== role) requireLiveIdentity(root, identity, label);
  }
  return Object.freeze({ packet, preflight });
}
