#!/usr/bin/env node

"use strict";

const { createHash } = require("node:crypto");
const {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} = require("node:fs");
const { dirname, resolve } = require("node:path");

const REPOSITORY_ROOT = resolve(__dirname, "../../..");
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2";
const RECOVERY_AUTHORITY_ROOT = `${SOURCE_AUTHORITY_ROOT}/recovery-v1`;
const SOURCE_RUNTIME_ROOT = "out/phase10-execution-v2";
const RECOVERY_RUNTIME_ROOT = `${SOURCE_RUNTIME_ROOT}/recovery-v1`;

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v1";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID = "phase10-c0v-s6-execution-v2-recovery-v1-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA = "phase10-c0v-s6-packet-catalogue-recovery-v1";
const RECOVERY_PROTOCOL_SCHEMA = "phase10-c0v-s6-packet-protocol-recovery-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT = "27ca0dea801be026f6b3729d5d898a8856c42722";

const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 14858,
  sha256: "f939389cbaa9e408c63caa40a77f45b8e2ce1c6fe686fc697cc9cc16ad4a31d1",
});
const SOURCE_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 72689,
  sha256: "5885d5f7677e9da56374b56a62babaf29e69f90a29caf7684e51f0b31e995f96",
});

const SOURCE_BASELINE_BYTES = 1629577;
const RETAINED_PREDECESSOR_BYTES = 396;
const RECOVERY_BASELINE_BYTES = SOURCE_BASELINE_BYTES + RETAINED_PREDECESSOR_BYTES;
const SOURCE_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v1";
const RECOVERY_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v2";

const PACKET_IDS = Object.freeze([
  "a-p-c0v-s6",
  "c0v-moving-produce",
  "c0v-moving-publish",
  "c0v-radial-produce",
  "c0v-radial-publish",
  "c0v-static-produce",
  "c0v-static-publish",
  "c0v-aggregate",
]);

const EXPECTED_PREDECESSOR_LOCKS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/package.lock`,
    byteLength: 220,
    sha256: "8275c6d47285db6d671c1f0f75ad0b45c2081164550a5e31f111f03ec1522bfe",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-packet-paths-v1",
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v1",
      processId: 53684,
      acquiredAt: "2026-08-24T09:01:39.426Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/a-p-c0v-s6.lock`,
    byteLength: 176,
    sha256: "b9805c9142115822fa9f36dd89f702b79c5abf9ffb44688ffa9e3584d5981f02",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "a-p-c0v-s6",
      attemptId: "a-p-c0v-s6-20260822-v1",
      processId: 53684,
      acquiredAt: "2026-08-24T09:01:39.430Z",
    }),
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery authority build: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function repositoryPath(relativePath) {
  return resolve(REPOSITORY_ROOT, ...relativePath.split("/"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function identityFromBytes(path, bytes) {
  return { path, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

function readBytes(path) {
  return readFileSync(repositoryPath(path));
}

function readJson(path) {
  return JSON.parse(readBytes(path).toString("utf8"));
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertIdentity(actual, expected, label) {
  assert(sameJson(actual, expected), `${label} identity differs from the frozen predecessor`);
}

function prettyJsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeJson(path, value) {
  const bytes = prettyJsonBytes(value);
  const absolutePath = repositoryPath(path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, bytes);
  return identityFromBytes(path, bytes);
}

function replaceStrings(value, replacements) {
  if (typeof value === "string") {
    return replacements.reduce(
      (result, [from, to]) => result.split(from).join(to),
      value,
    );
  }
  if (Array.isArray(value)) return value.map((entry) => replaceStrings(entry, replacements));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, replaceStrings(entry, replacements)]),
    );
  }
  return value;
}

function insertAfter(object, anchorKey, newKey, value) {
  assert(!Object.prototype.hasOwnProperty.call(object, newKey), `${newKey} already exists`);
  const result = {};
  let inserted = false;
  for (const [key, entry] of Object.entries(object)) {
    result[key] = entry;
    if (key === anchorKey) {
      result[newKey] = value;
      inserted = true;
    }
  }
  assert(inserted, `cannot insert ${newKey}: ${anchorKey} is absent`);
  return result;
}

function pathObjectExists(path) {
  try {
    lstatSync(repositoryPath(path));
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

function reopenPredecessorLocks() {
  const lockRoot = repositoryPath(`${SOURCE_RUNTIME_ROOT}/locks`);
  const expectedNames = EXPECTED_PREDECESSOR_LOCKS
    .map((entry) => entry.path.slice(entry.path.lastIndexOf("/") + 1))
    .sort();
  const entries = readdirSync(lockRoot, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name));
  assert(
    sameJson(entries.map((entry) => entry.name), expectedNames),
    "predecessor lock root does not contain exactly the two registered locks",
  );

  return EXPECTED_PREDECESSOR_LOCKS.map((expected) => {
    const stat = lstatSync(repositoryPath(expected.path));
    assert(stat.isFile() && stat.nlink === 1, `${expected.path} is not one unique regular file`);
    const bytes = readBytes(expected.path);
    const identity = identityFromBytes(expected.path, bytes);
    assertIdentity(identity, {
      path: expected.path,
      byteLength: expected.byteLength,
      sha256: expected.sha256,
    }, expected.path);
    const parsedContent = JSON.parse(bytes.toString("utf8"));
    assert(sameJson(parsedContent, expected.parsedContent), `${expected.path} content differs`);
    return { ...identity, parsedContent };
  });
}

function predecessorAbsenceRoster(sourceApProtocol) {
  const finalPaths = sourceApProtocol.paths.allowedPublicationPaths;
  const stagePaths = sourceApProtocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath);
  assert(finalPaths.length === 6 && stagePaths.length === 6, "predecessor A-P output roster is not 6 + 6");
  const roster = [sourceApProtocol.paths.attemptRoot, ...finalPaths, ...stagePaths];
  assert(new Set(roster).size === 13, "predecessor A-P absence roster is not 13 unique paths");
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v1`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v1-callables-v1`;
}

function targetProtocolPath(packetId) {
  return `${RECOVERY_AUTHORITY_ROOT}/packets/${packetId}/protocol.json`;
}

function targetRegistryPath(packetId) {
  return `${RECOVERY_AUTHORITY_ROOT}/packets/${packetId}/callable-registry.json`;
}

function sourceProtocolPath(packetId) {
  return `${SOURCE_AUTHORITY_ROOT}/packets/${packetId}/protocol.json`;
}

function sourceRegistryPath(packetId) {
  return `${SOURCE_AUTHORITY_ROOT}/packets/${packetId}/callable-registry.json`;
}

function packetReplacements(packetId, sourceProtocol, sourceRegistry) {
  const successorAttemptId = packetId === "a-p-c0v-s6"
    ? RECOVERY_AP_ATTEMPT_ID
    : sourceProtocol.registeredAttemptId;
  return [
    [`${SOURCE_AUTHORITY_ROOT}/`, `${RECOVERY_AUTHORITY_ROOT}/`],
    [`${SOURCE_RUNTIME_ROOT}/`, `${RECOVERY_RUNTIME_ROOT}/`],
    [sourceProtocol.protocolId, recoveryProtocolId(packetId)],
    [sourceRegistry.registryId, recoveryRegistryId(packetId)],
    [sourceProtocol.registeredAttemptId, successorAttemptId],
    ["phase10-c0v-s6-execution-v2-packet-paths-v1", RECOVERY_CATALOGUE_ID],
  ];
}

function main() {
  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "predecessor packet catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS),
    "predecessor packet order differs",
  );

  const sourceProtocols = new Map();
  const sourceRegistries = new Map();
  for (const packetId of PACKET_IDS) {
    sourceProtocols.set(packetId, readJson(sourceProtocolPath(packetId)));
    sourceRegistries.set(packetId, readJson(sourceRegistryPath(packetId)));
  }

  const sourceApProtocolBytes = readBytes(SOURCE_AP_PROTOCOL_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_AP_PROTOCOL_IDENTITY.path, sourceApProtocolBytes),
    SOURCE_AP_PROTOCOL_IDENTITY,
    "predecessor A-P protocol",
  );
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  assert(sourceApProtocol.registeredAttemptId === SOURCE_AP_ATTEMPT_ID, "predecessor A-P attempt differs");

  // All predecessor-state proofs happen before the first generated successor write.
  const predecessorLockArtifacts = reopenPredecessorLocks();
  const predecessorGovernedAbsentPaths = predecessorAbsenceRoster(sourceApProtocol);
  assert(
    predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      RETAINED_PREDECESSOR_BYTES,
    "predecessor retained byte total differs",
  );

  const callableModulePaths = [...new Set(
    [...sourceRegistries.values()].flatMap((registry) =>
      registry.callables.map((callable) => callable.modulePath)),
  )].sort();
  const callableModuleIdentities = new Map(callableModulePaths.map((path) => {
    const bytes = readBytes(path);
    const identity = identityFromBytes(path, bytes);
    return [path, { byteLength: identity.byteLength, sha256: identity.sha256 }];
  }));

  const registryIdentities = new Map();
  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    const registry = replaceStrings(
      sourceRegistry,
      packetReplacements(packetId, sourceProtocol, sourceRegistry),
    );
    registry.registryId = recoveryRegistryId(packetId);
    registry.protocolId = recoveryProtocolId(packetId);
    registry.callables = registry.callables.map((callable) => ({
      ...callable,
      identity: callableModuleIdentities.get(callable.modulePath),
    }));
    registryIdentities.set(packetId, writeJson(targetRegistryPath(packetId), registry));
  }

  const recoveryAuthority = {
    schema: "phase10-c0v-s6-recovery-authority-v1",
    recoveryAuthorityId: RECOVERY_AUTHORITY_ID,
    automaticRetry: false,
    predecessorImplementationFreezeCommit: PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
    predecessorPacketCatalogue: SOURCE_CATALOGUE_IDENTITY,
    predecessorApProtocol: SOURCE_AP_PROTOCOL_IDENTITY,
    predecessorLockArtifacts,
    predecessorGovernedAbsentPaths,
    retainedBytes: RETAINED_PREDECESSOR_BYTES,
    creditedWorkerInvocationCount: 0,
    creditedGovernedProcessHours: 0,
    successor: {
      packetCatalogueId: RECOVERY_CATALOGUE_ID,
      packetCataloguePath: RECOVERY_CATALOGUE_PATH,
      maximumAuthorizedNewAttempts: 1,
      authorizedAttempts: [{
        packetId: "a-p-c0v-s6",
        predecessorAttemptId: SOURCE_AP_ATTEMPT_ID,
        successorAttemptId: RECOVERY_AP_ATTEMPT_ID,
      }],
    },
  };
  const recoveryAuthorityIdentity = writeJson(RECOVERY_AUTHORITY_PATH, recoveryAuthority);

  const catalogueReplacements = [
    [`${SOURCE_AUTHORITY_ROOT}/`, `${RECOVERY_AUTHORITY_ROOT}/`],
    [`${SOURCE_RUNTIME_ROOT}/`, `${RECOVERY_RUNTIME_ROOT}/`],
    [sourceCatalogue.catalogueId, RECOVERY_CATALOGUE_ID],
  ];
  let catalogue = replaceStrings(sourceCatalogue, catalogueReplacements);
  catalogue.schema = RECOVERY_CATALOGUE_SCHEMA;
  catalogue.catalogueId = RECOVERY_CATALOGUE_ID;
  catalogue.packageLockRule =
    "predecessor-audit-before-successor-package-lock-then-packet-lock-before-any-observation";
  catalogue = insertAfter(
    catalogue,
    "packageLockRule",
    "recoveryAuthority",
    recoveryAuthorityIdentity,
  );
  const recoveryCatalogueIdentity = writeJson(RECOVERY_CATALOGUE_PATH, catalogue);

  const baselineLockIdentities = predecessorLockArtifacts
    .map(({ parsedContent: _parsedContent, ...identity }) => identity)
    .sort((left, right) => left.path.localeCompare(right.path));
  const expectedSourceBaseline = sourceApProtocol.resources.packageStorageBaselineArtifacts;
  assert(
    expectedSourceBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === SOURCE_BASELINE_BYTES,
    "predecessor package baseline artifact sum differs",
  );

  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    assert(
      sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, expectedSourceBaseline),
      `${packetId} predecessor package baseline differs`,
    );
    assert(sourceProtocol.resources.automaticRetry === false, `${packetId} predecessor retry policy differs`);

    const protocol = replaceStrings(
      sourceProtocol,
      packetReplacements(packetId, sourceProtocol, sourceRegistry),
    );
    protocol.schema = RECOVERY_PROTOCOL_SCHEMA;
    protocol.protocolId = recoveryProtocolId(packetId);
    protocol.registryId = recoveryRegistryId(packetId);
    protocol.bindings.packetCatalogue = recoveryCatalogueIdentity;
    protocol.bindings.callableRegistry = registryIdentities.get(packetId);
    protocol.bindings = insertAfter(
      protocol.bindings,
      "packetCatalogue",
      "recoveryAuthority",
      recoveryAuthorityIdentity,
    );
    protocol.ancestryAuthority.implementationFreezeRule =
      "first-introduction-commit-of-recovery-v1-authority-and-current-successor-closure";
    protocol.resources.packageStorageBaselineArtifacts = [
      ...sourceProtocol.resources.packageStorageBaselineArtifacts,
      ...baselineLockIdentities,
    ];
    protocol.resources.packageStorageBaselineBytes = RECOVERY_BASELINE_BYTES;

    assert(
      protocol.paths.preflightReceiptPath === sourceProtocol.paths.preflightReceiptPath &&
        protocol.paths.terminalReceiptPath === sourceProtocol.paths.terminalReceiptPath &&
        sameJson(protocol.paths.allowedPublicationPaths, sourceProtocol.paths.allowedPublicationPaths),
      `${packetId} final evidence paths changed`,
    );
    assert(
      sameJson(protocol.selectedRouteId, sourceProtocol.selectedRouteId) &&
        sameJson(protocol.bindings.scienceProtocol, sourceProtocol.bindings.scienceProtocol) &&
        sameJson(protocol.bindings.referenceOrRefusal, sourceProtocol.bindings.referenceOrRefusal),
      `${packetId} science route changed`,
    );
    assert(
      protocol.resources.packageProcessHoursMaximum === sourceProtocol.resources.packageProcessHoursMaximum &&
        protocol.resources.retainedStorageBytesMaximum === sourceProtocol.resources.retainedStorageBytesMaximum &&
        protocol.resources.currentPacketRegisteredProcessHoursMaximum ===
          sourceProtocol.resources.currentPacketRegisteredProcessHoursMaximum,
      `${packetId} registered cap changed`,
    );
    writeJson(targetProtocolPath(packetId), protocol);
  }

  assert(existsSync(repositoryPath(RECOVERY_AUTHORITY_PATH)), "recovery authority was not written");
  process.stdout.write(
    `wrote recovery-v1 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
