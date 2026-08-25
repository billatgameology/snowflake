#!/usr/bin/env node

"use strict";

const { createHash } = require("node:crypto");
const {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} = require("node:fs");
const { dirname, resolve } = require("node:path");

const REPOSITORY_ROOT = resolve(__dirname, "../../..");
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v7";
const RECOVERY_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v8";
const SOURCE_RUNTIME_ROOT = "out/phase10-execution-v2/recovery-v7";
const RECOVERY_RUNTIME_ROOT = "out/phase10-execution-v2/recovery-v8";

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v8";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v8-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v8-packet-catalogue-v1";
const RECOVERY_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v8-packet-protocol-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "af72b00814ee3d0a28499296b144a35585157dba";
const PREDECESSOR_ACCEPTED_PACKET_COMMIT =
  "e092259b8d4c3099b569febc08944bf99bfef31a";

const SOURCE_RECOVERY_AUTHORITY_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/recovery-authority.json`,
  byteLength: 26481,
  sha256: "3ffde7e830de8f3c1a660a3e2a81f89defddbae0ca1c24bf0c3010f8d84ede2c",
});
const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 16104,
  sha256: "783d8ba945857ff60609f924bc213e1d7e5f3abbe037d67577c77b36255cd98e",
});
const HISTORICAL_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: "research/phase10-execution-v2/recovery-v5/packets/a-p-c0v-s6/protocol.json",
  byteLength: 83281,
  sha256: "ea15bf75ef406b81c92e8d178f440985334edbc6a0f8994880cca50982fe0565",
});
const SOURCE_CURRENT_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 84119,
  sha256: "8da5df514b64d4971e083ebb344410c21b64d6d73d9ca29567b4bcfcd83431bd",
});
const SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
  byteLength: 86444,
  sha256: "74938e872e4ee087c584c3f599e7b410247b96265b24ae9256d9601bbae67155",
});

const SOURCE_LOCK_COUNT = 14;
const SOURCE_ATTEMPT_COUNT = 38;
const SOURCE_PUBLISHED_COUNT = 10;
const SOURCE_ABSENCE_COUNT = 69;
const SOURCE_RETAINED_BYTES = 2003365;
const SOURCE_BASELINE_COUNT = 59;
const SOURCE_BASELINE_BYTES = 2995267;
const RECOVERY_LOCK_COUNT = 16;
const RECOVERY_ATTEMPT_COUNT = 38;
const RECOVERY_PUBLISHED_COUNT = 10;
const RECOVERY_ABSENCE_COUNT = 74;
const RECOVERY_RETAINED_COUNT = 64;
const RECOVERY_RETAINED_BYTES = 2003805;
const RECOVERY_BASELINE_COUNT = 61;
const RECOVERY_BASELINE_BYTES = 2995707;
const ACCEPTED_AP_PREFIX_COUNT = 15;
const ACCEPTED_AP_PREFIX_BYTES = 637675;
const RECOVERY_PREATTEMPT_COUNT = 76;
const RECOVERY_PREATTEMPT_BYTES = 3633382;
const PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS = 391158252000;
const ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS = 141142452500;
const RECOVERY_PREATTEMPT_ELAPSED_NANOSECONDS = 532300704500;
const RECOVERY_PREATTEMPT_PROCESS_HOURS = 0.14786130680555556;
const MOVING_REGISTERED_ELAPSED_NANOSECONDS_MAXIMUM = 14400000000000;
const MOVING_REGISTERED_PROCESS_HOURS_MAXIMUM = 4;
const RECOVERY_PROJECTED_ELAPSED_NANOSECONDS = 14932300704500;
const RECOVERY_PROJECTED_PROCESS_HOURS = 4.147861306805556;
const RECOVERY_PROJECTED_STORAGE_BYTES = 79130854;
const RECOVERY_PROJECTED_SCRATCH_BYTES = 67108864;
const RECOVERY_PROJECTED_PUBLICATION_BYTES = 8388608;

const ACCEPTED_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v6";
const SOURCE_AUTHORIZED_ATTEMPT_ID = "c0v-moving-produce-20260822-v3";
const RECOVERY_AUTHORIZED_ATTEMPT_ID = "c0v-moving-produce-20260822-v4";

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

const EXPECTED_WORKER_ENVIRONMENT = Object.freeze([
  Object.freeze({ key: "GIT_CONFIG_GLOBAL", value: "NUL" }),
  Object.freeze({ key: "GIT_CONFIG_NOSYSTEM", value: "1" }),
  Object.freeze({ key: "GIT_OPTIONAL_LOCKS", value: "0" }),
  Object.freeze({ key: "GIT_TERMINAL_PROMPT", value: "0" }),
  Object.freeze({ key: "HOMEDRIVE", value: "" }),
  Object.freeze({ key: "HOMEPATH", value: "" }),
  Object.freeze({ key: "LC_ALL", value: "C" }),
  Object.freeze({ key: "LOGONSERVER", value: "" }),
  Object.freeze({ key: "PATH", value: "C:\\Program Files\\Git\\cmd" }),
  Object.freeze({ key: "PATHEXT", value: ".COM;.EXE" }),
  Object.freeze({ key: "SYSTEMDRIVE", value: "" }),
  Object.freeze({ key: "SYSTEMROOT", value: "C:\\WINDOWS" }),
  Object.freeze({ key: "TEMP", value: "" }),
  Object.freeze({ key: "USERDOMAIN", value: "" }),
  Object.freeze({ key: "USERNAME", value: "" }),
  Object.freeze({ key: "USERPROFILE", value: "" }),
  Object.freeze({ key: "WINDIR", value: "" }),
]);

const EXPECTED_MOVING_LOCKS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/package.lock`,
    byteLength: 248,
    sha256: "624606cab0c1ddc64d6e856d97544ae4a1891bb26c8e98ff9157aa5f3dc725aa",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-recovery-v7-packet-paths-v1",
      attemptId: "c0v-moving-produce:c0v-moving-produce-20260822-v3",
      processId: 54488,
      acquiredAt: "2026-08-24T23:59:39.002Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/c0v-moving-produce.lock`,
    byteLength: 192,
    sha256: "11496f1dd8d7c196159f67dec85993e59a507a3490eec2394002cf45db39f9f5",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "c0v-moving-produce",
      attemptId: SOURCE_AUTHORIZED_ATTEMPT_ID,
      processId: 54488,
      acquiredAt: "2026-08-24T23:59:39.007Z",
    }),
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery-v8 authority build: ${message}`);
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

function codePointCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
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

function pathObjectExists(path) {
  try {
    lstatSync(repositoryPath(path));
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

function reopenIdentity(expected) {
  const stat = lstatSync(repositoryPath(expected.path));
  assert(stat.isFile() && stat.nlink === 1, `${expected.path} is not one unique regular file`);
  const actual = identityFromBytes(expected.path, readBytes(expected.path));
  assertIdentity(actual, expected, expected.path);
  return actual;
}

function reopenLocks(expectedLocks) {
  const expectedByRoot = new Map();
  for (const entry of expectedLocks) {
    const root = entry.path.slice(0, entry.path.lastIndexOf("/"));
    const group = expectedByRoot.get(root) ?? [];
    group.push(entry);
    expectedByRoot.set(root, group);
  }
  assert(expectedByRoot.size === 8, "predecessor locks do not cover exactly eight generations");
  for (const [root, expected] of expectedByRoot) {
    const expectedNames = expected
      .map((entry) => entry.path.slice(entry.path.lastIndexOf("/") + 1))
      .sort(codePointCompare);
    const entries = readdirSync(repositoryPath(root), { withFileTypes: true })
      .sort((left, right) => codePointCompare(left.name, right.name));
    assert(
      sameJson(entries.map((entry) => entry.name), expectedNames) &&
        entries.every((entry) => entry.isFile()),
      `${root} does not contain exactly the two registered locks`,
    );
  }
  return expectedLocks.map((expected) => {
    const actual = reopenIdentity({
      path: expected.path,
      byteLength: expected.byteLength,
      sha256: expected.sha256,
    });
    const parsedContent = readJson(expected.path);
    assert(sameJson(parsedContent, expected.parsedContent), `${expected.path} content differs`);
    return { ...actual, parsedContent };
  });
}

function reopenPublished(expectedArtifacts) {
  const manifest = readJson("evidence/MANIFEST.json");
  assert(
    manifest.fileCount === 396 && manifest.totalBytes === 6242500 &&
      Object.keys(manifest.files).length === 396,
    "evidence manifest totals differ from the accepted A-P checkpoint",
  );
  return expectedArtifacts.map((expected) => {
    const actual = reopenIdentity(expected);
    const key = expected.path.slice("evidence/".length);
    assert(
      sameJson(manifest.files[key], { bytes: expected.byteLength, sha256: expected.sha256 }),
      `${expected.path} is not pinned exactly in evidence/MANIFEST.json`,
    );
    return actual;
  });
}

function movingStagePaths(protocol, attemptId) {
  return protocol.paths.allowedPublicationPaths.map((path) => `${path}.stage-${attemptId}`);
}

function predecessorAbsenceRoster(sourceAuthority, sourceMovingProtocol) {
  const sourceAbsences = sourceAuthority.predecessorGovernedAbsentPaths;
  assert(sourceAbsences.length === SOURCE_ABSENCE_COUNT, "recovery-v7 absence roster differs");
  assert(
    sourceAbsences.filter((path) => path === SOURCE_RUNTIME_ROOT).length === 1,
    "recovery-v7 runtime root is not one exact predecessor absence",
  );
  const remainingSourceAbsences = sourceAbsences.filter((path) => path !== SOURCE_RUNTIME_ROOT);
  const sourceMovingAttemptRoot =
    `${sourceMovingProtocol.paths.attemptRoot}/${SOURCE_AUTHORIZED_ATTEMPT_ID}`;
  const recoveryMovingStagePaths = movingStagePaths(
    sourceMovingProtocol,
    RECOVERY_AUTHORIZED_ATTEMPT_ID,
  );
  assert(
    sourceMovingProtocol.paths.allowedPublicationPaths.length === 4 &&
      sameJson(
        sourceMovingProtocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
        movingStagePaths(sourceMovingProtocol, SOURCE_AUTHORIZED_ATTEMPT_ID),
      ) && recoveryMovingStagePaths.length === 4,
    "moving v3 final or stage roster differs",
  );
  assert(pathObjectExists(SOURCE_RUNTIME_ROOT), "recovery-v7 runtime root is absent");
  const roster = [
    ...remainingSourceAbsences,
    sourceMovingAttemptRoot,
    RECOVERY_RUNTIME_ROOT,
    ...recoveryMovingStagePaths,
  ];
  assert(
    roster.length === RECOVERY_ABSENCE_COUNT &&
      new Set(roster).size === RECOVERY_ABSENCE_COUNT,
    "combined absence roster is not 74 unique paths",
  );
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v8`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v8-callables-v1`;
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
  const replacements = [
    [`${SOURCE_AUTHORITY_ROOT}/`, `${RECOVERY_AUTHORITY_ROOT}/`],
    [`${SOURCE_RUNTIME_ROOT}/`, `${RECOVERY_RUNTIME_ROOT}/`],
    [sourceProtocol.protocolId, recoveryProtocolId(packetId)],
    [sourceRegistry.registryId, recoveryRegistryId(packetId)],
    [
      "phase10-c0v-s6-execution-v2-recovery-v7-packet-paths-v1",
      RECOVERY_CATALOGUE_ID,
    ],
  ];
  if (packetId === "c0v-moving-produce") {
    replacements.push([SOURCE_AUTHORIZED_ATTEMPT_ID, RECOVERY_AUTHORIZED_ATTEMPT_ID]);
  }
  return replacements;
}

function main() {
  const sourceAuthorityBytes = readBytes(SOURCE_RECOVERY_AUTHORITY_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_RECOVERY_AUTHORITY_IDENTITY.path, sourceAuthorityBytes),
    SOURCE_RECOVERY_AUTHORITY_IDENTITY,
    "recovery-v7 authority",
  );
  const sourceAuthority = JSON.parse(sourceAuthorityBytes.toString("utf8"));
  assert(
    sourceAuthority.schema === "phase10-c0v-s6-recovery-authority-v7" &&
      sourceAuthority.recoveryAuthorityId === "phase10-c0v-s6-execution-v2-recovery-v7" &&
      sourceAuthority.predecessorImplementationFreezeCommit ===
        "e65ca441b45795e3793daff0191b5d86b30802bd" &&
      sourceAuthority.predecessorAcceptedPacketCommit === PREDECESSOR_ACCEPTED_PACKET_COMMIT &&
      sameJson(sourceAuthority.predecessorApProtocol, HISTORICAL_AP_PROTOCOL_IDENTITY) &&
      sourceAuthority.predecessorLockArtifacts.length === SOURCE_LOCK_COUNT &&
      sourceAuthority.predecessorAttemptArtifacts.length === SOURCE_ATTEMPT_COUNT &&
      sourceAuthority.predecessorPublishedArtifacts.length === SOURCE_PUBLISHED_COUNT &&
      sourceAuthority.predecessorGovernedAbsentPaths.length === SOURCE_ABSENCE_COUNT &&
      sourceAuthority.retainedBytes === SOURCE_RETAINED_BYTES &&
      sourceAuthority.automaticRetry === false,
    "recovery-v7 authority summary differs",
  );

  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "recovery-v7 catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS) &&
      sameJson(sourceCatalogue.runtimeLoaderContract.exactWorkerEnvironment, EXPECTED_WORKER_ENVIRONMENT),
    "recovery-v7 packet order or worker environment differs",
  );

  const sourceProtocols = new Map();
  const sourceRegistries = new Map();
  for (const packetId of PACKET_IDS) {
    sourceProtocols.set(packetId, readJson(sourceProtocolPath(packetId)));
    sourceRegistries.set(packetId, readJson(sourceRegistryPath(packetId)));
  }
  reopenIdentity(SOURCE_CURRENT_AP_PROTOCOL_IDENTITY);
  reopenIdentity(SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY);
  reopenIdentity(HISTORICAL_AP_PROTOCOL_IDENTITY);
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  const sourceMovingProtocol = sourceProtocols.get("c0v-moving-produce");
  assert(
    sourceApProtocol.registeredAttemptId === ACCEPTED_AP_ATTEMPT_ID &&
      sourceMovingProtocol.registeredAttemptId === SOURCE_AUTHORIZED_ATTEMPT_ID,
    "recovery-v7 A-P or moving attempt differs",
  );

  // Reprove every bound predecessor byte and absence before the first successor write.
  const predecessorLockArtifacts = reopenLocks([
    ...sourceAuthority.predecessorLockArtifacts,
    ...EXPECTED_MOVING_LOCKS,
  ]);
  const predecessorAttemptArtifacts = sourceAuthority.predecessorAttemptArtifacts.map(reopenIdentity);
  const predecessorPublishedArtifacts = reopenPublished(sourceAuthority.predecessorPublishedArtifacts);
  const predecessorGovernedAbsentPaths = predecessorAbsenceRoster(sourceAuthority, sourceMovingProtocol);
  assert(
    predecessorLockArtifacts.length === RECOVERY_LOCK_COUNT &&
      predecessorAttemptArtifacts.length === RECOVERY_ATTEMPT_COUNT &&
      predecessorPublishedArtifacts.length === RECOVERY_PUBLISHED_COUNT &&
      predecessorGovernedAbsentPaths.length === RECOVERY_ABSENCE_COUNT &&
      RECOVERY_LOCK_COUNT + RECOVERY_ATTEMPT_COUNT + RECOVERY_PUBLISHED_COUNT ===
        RECOVERY_RETAINED_COUNT,
    "recovery-v8 predecessor cardinality differs",
  );
  assert(
    predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) === 3348 &&
      predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) === 1602566 &&
      predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) === 397891 &&
      [...predecessorLockArtifacts, ...predecessorAttemptArtifacts, ...predecessorPublishedArtifacts]
        .reduce((sum, entry) => sum + entry.byteLength, 0) === RECOVERY_RETAINED_BYTES,
    "recovery-v8 retained byte accounting differs",
  );

  const staticBaselineAdditions = predecessorLockArtifacts.slice(SOURCE_LOCK_COUNT)
    .map(({ parsedContent: _parsedContent, ...identity }) => identity)
    .sort((left, right) => codePointCompare(left.path, right.path));
  const acceptedApPrefix = [
    ...predecessorAttemptArtifacts.slice(29),
    ...predecessorPublishedArtifacts.slice(4),
  ];
  assert(
    staticBaselineAdditions.length === 2 &&
      staticBaselineAdditions.reduce((sum, entry) => sum + entry.byteLength, 0) === 440 &&
      acceptedApPrefix.length === ACCEPTED_AP_PREFIX_COUNT &&
      acceptedApPrefix.reduce((sum, entry) => sum + entry.byteLength, 0) === ACCEPTED_AP_PREFIX_BYTES,
    "recovery-v8 static addition or accepted A-P prefix differs",
  );
  assert(
    RECOVERY_BASELINE_COUNT + ACCEPTED_AP_PREFIX_COUNT === RECOVERY_PREATTEMPT_COUNT &&
      RECOVERY_BASELINE_BYTES + ACCEPTED_AP_PREFIX_BYTES === RECOVERY_PREATTEMPT_BYTES &&
      PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS + ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS ===
        RECOVERY_PREATTEMPT_ELAPSED_NANOSECONDS &&
      RECOVERY_PREATTEMPT_ELAPSED_NANOSECONDS / 3.6e12 === RECOVERY_PREATTEMPT_PROCESS_HOURS &&
      RECOVERY_PREATTEMPT_ELAPSED_NANOSECONDS + MOVING_REGISTERED_ELAPSED_NANOSECONDS_MAXIMUM ===
        RECOVERY_PROJECTED_ELAPSED_NANOSECONDS &&
      RECOVERY_PREATTEMPT_PROCESS_HOURS + MOVING_REGISTERED_PROCESS_HOURS_MAXIMUM ===
        RECOVERY_PROJECTED_PROCESS_HOURS &&
      RECOVERY_PREATTEMPT_BYTES + RECOVERY_PROJECTED_SCRATCH_BYTES +
        RECOVERY_PROJECTED_PUBLICATION_BYTES === RECOVERY_PROJECTED_STORAGE_BYTES,
    "recovery-v8 storage or time projection arithmetic differs",
  );

  const callableCount = [...sourceRegistries.values()]
    .reduce((sum, registry) => sum + registry.callables.length, 0);
  assert(callableCount === 101, "source callable registration count is not 101");
  const modulePaths = [...new Set(
    [...sourceRegistries.values()].flatMap((registry) =>
      registry.callables.map((callable) => callable.modulePath)),
  )].sort(codePointCompare);
  const moduleIdentities = new Map(modulePaths.map((path) => {
    const bytes = readBytes(path);
    return [path, { byteLength: bytes.byteLength, sha256: sha256(bytes) }];
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
      identity: moduleIdentities.get(callable.modulePath),
    }));
    registryIdentities.set(packetId, writeJson(targetRegistryPath(packetId), registry));
  }

  const recoveryAuthority = {
    schema: "phase10-c0v-s6-recovery-authority-v8",
    recoveryAuthorityId: RECOVERY_AUTHORITY_ID,
    automaticRetry: false,
    predecessorImplementationFreezeCommit: PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
    predecessorAcceptedPacketCommit: PREDECESSOR_ACCEPTED_PACKET_COMMIT,
    predecessorRecoveryAuthority: SOURCE_RECOVERY_AUTHORITY_IDENTITY,
    predecessorPacketCatalogue: SOURCE_CATALOGUE_IDENTITY,
    predecessorApProtocol: HISTORICAL_AP_PROTOCOL_IDENTITY,
    predecessorAuthorizedPacketProtocol: SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY,
    predecessorLockArtifacts,
    predecessorAttemptArtifacts,
    predecessorPublishedArtifacts,
    predecessorGovernedAbsentPaths,
    retainedBytes: RECOVERY_RETAINED_BYTES,
    observedWorkerProcessCount: 0,
    observedWorkerLifetimeNanoseconds: 0,
    creditedGovernedInvocationCount: 0,
    creditedGovernedElapsedNanoseconds: 0,
    creditedGovernedProcessHours: 0,
    successor: {
      packetCatalogueId: RECOVERY_CATALOGUE_ID,
      packetCataloguePath: RECOVERY_CATALOGUE_PATH,
      maximumAuthorizedNewAttempts: 1,
      authorizedAttempts: [{
        packetId: "c0v-moving-produce",
        predecessorAttemptId: SOURCE_AUTHORIZED_ATTEMPT_ID,
        successorAttemptId: RECOVERY_AUTHORIZED_ATTEMPT_ID,
      }],
    },
  };
  const recoveryAuthorityIdentity = writeJson(RECOVERY_AUTHORITY_PATH, recoveryAuthority);

  const catalogue = replaceStrings(sourceCatalogue, [
    [`${SOURCE_AUTHORITY_ROOT}/`, `${RECOVERY_AUTHORITY_ROOT}/`],
    [`${SOURCE_RUNTIME_ROOT}/`, `${RECOVERY_RUNTIME_ROOT}/`],
    [sourceCatalogue.catalogueId, RECOVERY_CATALOGUE_ID],
  ]);
  catalogue.schema = RECOVERY_CATALOGUE_SCHEMA;
  catalogue.catalogueId = RECOVERY_CATALOGUE_ID;
  catalogue.packageLockRule =
    "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation";
  catalogue.recoveryAuthority = recoveryAuthorityIdentity;
  const recoveryCatalogueIdentity = writeJson(RECOVERY_CATALOGUE_PATH, catalogue);

  const sourceBaseline = sourceApProtocol.resources.packageStorageBaselineArtifacts;
  assert(
    sourceBaseline.length === SOURCE_BASELINE_COUNT &&
      sourceBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === SOURCE_BASELINE_BYTES,
    "recovery-v7 static package baseline differs",
  );
  const recoveryBaseline = [...sourceBaseline, ...staticBaselineAdditions]
    .sort((left, right) => codePointCompare(left.path, right.path));
  assert(
    recoveryBaseline.length === RECOVERY_BASELINE_COUNT &&
      new Set(recoveryBaseline.map((entry) => entry.path)).size === RECOVERY_BASELINE_COUNT &&
      recoveryBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === RECOVERY_BASELINE_BYTES &&
      recoveryBaseline.every((entry, index) =>
        index === 0 || codePointCompare(recoveryBaseline[index - 1].path, entry.path) < 0),
    "recovery-v8 static package baseline differs",
  );
  const acceptedApPaths = new Set(acceptedApPrefix.map((entry) => entry.path));
  assert(
    recoveryBaseline.every((entry) => !acceptedApPaths.has(entry.path)),
    "accepted A-P prior-packet prefix was folded into the static baseline",
  );

  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    assert(
      sourceProtocol.schema === "phase10-c0v-s6-recovery-v7-packet-protocol-v1" &&
        sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, sourceBaseline) &&
        sourceProtocol.resources.automaticRetry === false,
      `${packetId} recovery-v7 protocol or static baseline differs`,
    );
    const protocol = replaceStrings(
      sourceProtocol,
      packetReplacements(packetId, sourceProtocol, sourceRegistry),
    );
    protocol.schema = RECOVERY_PROTOCOL_SCHEMA;
    protocol.protocolId = recoveryProtocolId(packetId);
    protocol.registryId = recoveryRegistryId(packetId);
    protocol.bindings.packetCatalogue = recoveryCatalogueIdentity;
    protocol.bindings.callableRegistry = registryIdentities.get(packetId);
    protocol.bindings.recoveryAuthority = recoveryAuthorityIdentity;
    protocol.ancestryAuthority.implementationFreezeRule =
      "first-introduction-commit-of-recovery-v8-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure";
    protocol.resources.packageStorageBaselineArtifacts = recoveryBaseline;
    protocol.resources.packageStorageBaselineBytes = RECOVERY_BASELINE_BYTES;

    if (packetId === "c0v-moving-produce") {
      assert(
        protocol.registeredAttemptId === RECOVERY_AUTHORIZED_ATTEMPT_ID &&
          sameJson(protocol.paths.allowedPublicationPaths, sourceProtocol.paths.allowedPublicationPaths) &&
          sameJson(
            protocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
            movingStagePaths(sourceProtocol, RECOVERY_AUTHORIZED_ATTEMPT_ID),
          ) &&
          protocol.resources.currentPacketRegisteredElapsedNanosecondsMaximum ===
            MOVING_REGISTERED_ELAPSED_NANOSECONDS_MAXIMUM &&
          protocol.resources.currentPacketRegisteredProcessHoursMaximum ===
            MOVING_REGISTERED_PROCESS_HOURS_MAXIMUM,
        "moving v4 attempt, evidence paths, or registered caps differ",
      );
    } else {
      assert(
        protocol.registeredAttemptId === sourceProtocol.registeredAttemptId &&
          protocol.paths.preflightReceiptPath === sourceProtocol.paths.preflightReceiptPath &&
          protocol.paths.terminalReceiptPath === sourceProtocol.paths.terminalReceiptPath &&
          sameJson(protocol.paths.allowedPublicationPaths, sourceProtocol.paths.allowedPublicationPaths) &&
          sameJson(protocol.paths.publicationStagingPaths, sourceProtocol.paths.publicationStagingPaths),
        `${packetId} accepted or unused attempt/evidence paths changed`,
      );
    }
    assert(
      protocol.selectedRouteId === sourceProtocol.selectedRouteId &&
        sameJson(protocol.bindings.scienceProtocol, sourceProtocol.bindings.scienceProtocol) &&
        sameJson(protocol.bindings.referenceOrRefusal, sourceProtocol.bindings.referenceOrRefusal) &&
        protocol.resources.packageProcessHoursMaximum === sourceProtocol.resources.packageProcessHoursMaximum &&
        protocol.resources.retainedStorageBytesMaximum === sourceProtocol.resources.retainedStorageBytesMaximum,
      `${packetId} science route or registered package cap changed`,
    );
    writeJson(targetProtocolPath(packetId), protocol);
  }

  assert(
    catalogue.packets.length === PACKET_IDS.length &&
      catalogue.packets.every((entry) =>
        entry.protocolPath === targetProtocolPath(entry.packetId) &&
        entry.callableRegistryPath === targetRegistryPath(entry.packetId)),
    "recovery-v8 catalogue is not homogeneous across all packets",
  );
  process.stdout.write(
    `wrote recovery-v8 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
