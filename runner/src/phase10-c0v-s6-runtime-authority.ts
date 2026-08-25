import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  phase10C0VS6ValidatePreflightArtifactFailure,
} from "./phase10-c0v-s6-artifact-observation.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL,
  PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AP_PROTOCOL,
  PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AP_PROTOCOL,
  PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_AP_PROTOCOL,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RecoveryV5Authority,
  parsePhase10C0VS6RecoveryV6Authority,
  parsePhase10C0VS6RecoveryV7Authority,
  parsePhase10C0VS6RecoveryV8Authority,
  parsePhase10C0VS6RecoveryV9Authority,
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

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function requireAuthorityBinding(
  root: string,
  packet: Phase10C0VS6PacketProtocol,
  expectedPath: string,
  label: string,
): Uint8Array {
  const binding = packet.bindings.recoveryAuthority;
  if (binding === undefined || binding.path !== expectedPath) {
    fail(`${label} recovery-authority path differs`);
  }
  const bytes = readPhysical(root, expectedPath);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(expectedPath, bytes),
    binding,
    `${label} live recovery authority`,
  );
  return bytes;
}

function deriveBoundRuntimeAuthority(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  root: string,
  authorityRoot: string,
  authorityPath: string,
  label: string,
): Phase10C0VS6RetainedRuntimeAuthority {
  const actualIdentity = phase10C0VS6ArtifactIdentity(
    input.packetProtocolIdentity.path,
    input.packetProtocolBytes,
  );
  phase10C0VS6SameIdentity(actualIdentity, input.packetProtocolIdentity, `${label} packet protocol raw bytes`);
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(input.packetProtocolBytes, `${label} packet protocol`),
  );
  const expectedPath = `${authorityRoot}/packets/${packet.packetId}/protocol.json`;
  if (input.packetProtocolIdentity.path !== expectedPath) {
    fail(`${label} packet protocol identity path differs from exact packet authority path`);
  }
  const livePacketBytes = readPhysical(root, expectedPath);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(expectedPath, livePacketBytes),
    input.packetProtocolIdentity,
    `${label} live catalogue-selected packet protocol`,
  );
  if (!sameBytes(livePacketBytes, input.packetProtocolBytes)) {
    fail(`${label} caller packet protocol bytes differ from live tracked bytes`);
  }
  requireAuthorityBinding(root, packet, authorityPath, label);
  const catalogueBytes = readPhysical(root, packet.bindings.packetCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.packetCatalogue.path, catalogueBytes),
    packet.bindings.packetCatalogue,
    `${label} live packet catalogue`,
  );
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, `${label} live packet catalogue`),
  );
  const entries = catalogue.packets.filter((entry) => entry.packetId === packet.packetId);
  if (entries.length !== 1 || entries[0]!.protocolPath !== expectedPath ||
    entries[0]!.preflightReceiptPath !== packet.paths.preflightReceiptPath ||
    entries[0]!.callableRegistryPath !== packet.bindings.callableRegistry.path) {
    fail(`${label} live packet catalogue disagrees with packet protocol paths`);
  }
  const livePreflightBytes = readPhysical(root, packet.paths.preflightReceiptPath);
  if (!sameBytes(livePreflightBytes, input.preflightBytes)) {
    fail(`${label} caller retained preflight bytes differ from live tracked receipt`);
  }
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, `${label} retained preflight`),
    packet,
    input.packetProtocolIdentity,
  );
  const failedArtifact = phase10C0VS6ValidatePreflightArtifactFailure(root, packet, preflight);
  for (const [identity, bindingLabel, role] of [
    [packet.bindings.matrix, "live S6 matrix", "matrix"],
    [packet.bindings.callableRegistry, "live callable registry", "callable-registry"],
    [packet.bindings.successorSchemaRegistry, "live successor schema registry", "successor-schema-registry"],
    [packet.bindings.successorSchemaContracts, "live successor schema contracts", "successor-schema-contracts"],
    [packet.bindings.scienceProtocol, "live science protocol", "science-protocol"],
    [packet.bindings.referenceOrRefusal, "live reference/refusal", "reference-or-refusal"],
  ] as const) {
    if (identity !== null && failedArtifact?.artifactRole !== role) requireLiveIdentity(root, identity, bindingLabel);
  }
  return Object.freeze({ packet, preflight });
}

export function derivePhase10C0VS6RetainedRuntimeAuthority(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6RetainedRuntimeAuthority {
  const root = safeRoot(input.repositoryRoot);
  const retained = deriveBoundRuntimeAuthority(
    input,
    root,
    PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT,
    PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH,
    "current recovery-v9",
  );
  const authorityBytes = requireAuthorityBinding(
    root,
    retained.packet,
    PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH,
    "current recovery-v9",
  );
  const authority = parsePhase10C0VS6RecoveryV9Authority(
    parsePhase10C0VS6PrettyJsonBytes(authorityBytes, "current recovery-v9 authority"),
  );
  const catalogue = parsePhase10C0VS6PacketCatalogue(parsePhase10C0VS6PrettyJsonBytes(
    readPhysical(root, retained.packet.bindings.packetCatalogue.path),
    "current recovery-v9 packet catalogue",
  ));
  if (authority.successor.packetCatalogueId !== catalogue.catalogueId ||
    authority.successor.packetCataloguePath !== retained.packet.bindings.packetCatalogue.path) {
    fail("current recovery-v9 authority successor differs from the live packet catalogue");
  }
  return retained;
}

/**
 * Reopens a retained accepted packet under the exact protocol generation recorded by its
 * preflight. The only cross-generation exception is the accepted recovery-v5 A-P packet bound
 * through the live recovery-v9 predecessor chain; current recovery-v9 packets retain the
 * ordinary live proof.
 */
export function derivePhase10C0VS6HistoricalRetainedRuntimeAuthority(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6RetainedRuntimeAuthority {
  if (input.packetProtocolIdentity.path.startsWith(`${PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT}/`)) {
    return derivePhase10C0VS6RetainedRuntimeAuthority(input);
  }
  const root = safeRoot(input.repositoryRoot);
  phase10C0VS6SameIdentity(
    input.packetProtocolIdentity,
    PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_AP_PROTOCOL,
    "accepted historical A-P protocol authority",
  );
  const liveV9AuthorityBytes = readPhysical(root, PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH);
  const liveV9Authority = parsePhase10C0VS6RecoveryV9Authority(
    parsePhase10C0VS6PrettyJsonBytes(liveV9AuthorityBytes, "live recovery-v9 authority"),
  );
  phase10C0VS6SameIdentity(
    liveV9Authority.predecessorApProtocol,
    input.packetProtocolIdentity,
    "recovery-v9 accepted A-P protocol",
  );
  const liveV8AuthorityBytes = readPhysical(root, PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH, liveV8AuthorityBytes),
    liveV9Authority.predecessorRecoveryAuthority,
    "recovery-v9 predecessor recovery-v8 authority",
  );
  const liveV8Authority = parsePhase10C0VS6RecoveryV8Authority(
    parsePhase10C0VS6PrettyJsonBytes(liveV8AuthorityBytes, "live recovery-v8 authority"),
  );
  phase10C0VS6SameIdentity(
    input.packetProtocolIdentity,
    PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AP_PROTOCOL,
    "recovery-v8 accepted A-P protocol authority",
  );
  phase10C0VS6SameIdentity(
    liveV8Authority.predecessorApProtocol,
    input.packetProtocolIdentity,
    "recovery-v8 accepted A-P protocol",
  );
  const liveV7AuthorityBytes = readPhysical(root, PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH, liveV7AuthorityBytes),
    liveV8Authority.predecessorRecoveryAuthority,
    "recovery-v8 predecessor recovery-v7 authority",
  );
  const liveV7Authority = parsePhase10C0VS6RecoveryV7Authority(
    parsePhase10C0VS6PrettyJsonBytes(liveV7AuthorityBytes, "live recovery-v7 authority"),
  );
  phase10C0VS6SameIdentity(
    input.packetProtocolIdentity,
    PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AP_PROTOCOL,
    "recovery-v7 accepted A-P protocol authority",
  );
  phase10C0VS6SameIdentity(
    liveV7Authority.predecessorApProtocol,
    input.packetProtocolIdentity,
    "recovery-v7 accepted A-P protocol",
  );
  const liveV8CatalogueBytes = readPhysical(root, liveV9Authority.predecessorPacketCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(
      liveV9Authority.predecessorPacketCatalogue.path,
      liveV8CatalogueBytes,
    ),
    liveV9Authority.predecessorPacketCatalogue,
    "recovery-v9 predecessor recovery-v8 packet catalogue",
  );
  const liveV6AuthorityBytes = readPhysical(root, PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH, liveV6AuthorityBytes),
    liveV7Authority.predecessorRecoveryAuthority,
    "recovery-v7 predecessor recovery-v6 authority",
  );
  const liveV7CatalogueBytes = readPhysical(root, liveV8Authority.predecessorPacketCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(
      liveV8Authority.predecessorPacketCatalogue.path,
      liveV7CatalogueBytes,
    ),
    liveV8Authority.predecessorPacketCatalogue,
    "recovery-v8 predecessor recovery-v7 packet catalogue",
  );
  const liveV6Authority = parsePhase10C0VS6RecoveryV6Authority(
    parsePhase10C0VS6PrettyJsonBytes(liveV6AuthorityBytes, "live recovery-v6 authority"),
  );
  phase10C0VS6SameIdentity(
    input.packetProtocolIdentity,
    PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL,
    "recovery-v6 accepted A-P protocol authority",
  );
  phase10C0VS6SameIdentity(
    liveV6Authority.predecessorApProtocol,
    input.packetProtocolIdentity,
    "recovery-v6 accepted A-P protocol",
  );
  const liveV6CatalogueBytes = readPhysical(root, liveV7Authority.predecessorPacketCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(
      liveV7Authority.predecessorPacketCatalogue.path,
      liveV6CatalogueBytes,
    ),
    liveV7Authority.predecessorPacketCatalogue,
    "recovery-v7 predecessor recovery-v6 packet catalogue",
  );
  const retained = deriveBoundRuntimeAuthority(
    input,
    root,
    PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT,
    PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
    "historical recovery-v5 A-P",
  );
  if (retained.packet.packetId !== "a-p-c0v-s6") {
    fail("the recovery-v5 historical exception is limited to the accepted A-P packet");
  }
  phase10C0VS6SameIdentity(
    retained.packet.bindings.recoveryAuthority ?? fail("accepted A-P protocol lacks recovery-authority binding"),
    liveV6Authority.predecessorRecoveryAuthority,
    "accepted A-P predecessor recovery authority",
  );
  phase10C0VS6SameIdentity(
    retained.packet.bindings.packetCatalogue,
    liveV6Authority.predecessorPacketCatalogue,
    "accepted A-P predecessor packet catalogue",
  );
  if (retained.preflight.observed.codeFreeze.commit !==
    liveV6Authority.predecessorImplementationFreezeCommit) {
    fail("accepted A-P preflight freeze differs from recovery-v6 predecessor authority");
  }
  const v5AuthorityBytes = readPhysical(root, PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH, v5AuthorityBytes),
    liveV6Authority.predecessorRecoveryAuthority,
    "live accepted A-P recovery-v5 authority",
  );
  const v5Authority = parsePhase10C0VS6RecoveryV5Authority(
    parsePhase10C0VS6PrettyJsonBytes(v5AuthorityBytes, "accepted A-P recovery-v5 authority"),
  );
  const v5Catalogue = parsePhase10C0VS6PacketCatalogue(parsePhase10C0VS6PrettyJsonBytes(
    readPhysical(root, retained.packet.bindings.packetCatalogue.path),
    "accepted A-P recovery-v5 packet catalogue",
  ));
  if (v5Authority.successor.packetCatalogueId !== v5Catalogue.catalogueId ||
    v5Authority.successor.packetCataloguePath !== retained.packet.bindings.packetCatalogue.path) {
    fail("accepted A-P recovery-v5 authority successor differs from its packet catalogue");
  }
  return retained;
}
