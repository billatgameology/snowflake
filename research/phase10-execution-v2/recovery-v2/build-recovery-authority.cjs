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
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v1";
const RECOVERY_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v2";
const V1_RUNTIME_ROOT = "out/phase10-execution-v2";
const SOURCE_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v1`;
const RECOVERY_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v2`;

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v2";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v2-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v2-packet-catalogue-v1";
const RECOVERY_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v2-packet-protocol-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "df24330f878bda8b73e58875127736ee1a21684d";

const SOURCE_RECOVERY_AUTHORITY_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/recovery-authority.json`,
  byteLength: 3275,
  sha256: "99dbc8f12488c65bbdfbff0a441ea4abbbe0157c9e83885437fb4749a41f0f2d",
});
const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 15513,
  sha256: "f7834a1c0b529ab749e1501cd2072e6ecfef736349e6d0356d376cd09579960c",
});
const SOURCE_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 73429,
  sha256: "59b16e35ebd06d0a42a50ca524c5bad7a18aff2eee8a4e6955f93ea4e2c730b1",
});

const SOURCE_BASELINE_BYTES = 1629973;
const RECOVERY_V1_RETAINED_BYTES = 63920;
const CUMULATIVE_RETAINED_BYTES = 64316;
const RECOVERY_BASELINE_BYTES = SOURCE_BASELINE_BYTES + RECOVERY_V1_RETAINED_BYTES;
const SOURCE_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v2";
const RECOVERY_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v3";
const SOURCE_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v2";
const RECOVERY_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v3";

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

const EXPECTED_PREDECESSOR_LOCKS = Object.freeze([
  Object.freeze({
    path: `${V1_RUNTIME_ROOT}/locks/package.lock`,
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
    path: `${V1_RUNTIME_ROOT}/locks/a-p-c0v-s6.lock`,
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
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/package.lock`,
    byteLength: 232,
    sha256: "40a72d4270b6128da9485ca2e25442b6dfeef484b5a9fc1799cc7e58e42cf6de",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-recovery-v1-packet-paths-v1",
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v2",
      processId: 50756,
      acquiredAt: "2026-08-24T10:45:09.585Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/a-p-c0v-s6.lock`,
    byteLength: 176,
    sha256: "da26c79f92fb9be021fa25b2c790ad1f9b23f91123ecc47806e32b6fff1a4399",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "a-p-c0v-s6",
      attemptId: SOURCE_AP_ATTEMPT_ID,
      processId: 50756,
      acquiredAt: "2026-08-24T10:45:09.590Z",
    }),
  }),
]);

const SOURCE_AP_ATTEMPT_ROOT =
  `${SOURCE_RUNTIME_ROOT}/attempts/a-p-c0v-s6/${SOURCE_AP_ATTEMPT_ID}`;
const EXPECTED_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/exit-status.json`,
    byteLength: 257,
    sha256: "cea268a67888283d8d58b5e883f5a8211b9d4c8fbf7b56815f89147ff9c32ca9",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/freeze-evaluation.json`,
    byteLength: 26430,
    sha256: "fa1dfc06212a9098fa534057026077bdfec65f65cd3ca525c9cbec1c45635a48",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stderr.log`,
    byteLength: 114,
    sha256: "35c5268b7e8244549f387d66ca7eff45bd0bf557aa4139468ab9fff127ab4d04",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stdout.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/worker-invocations.jsonl`,
    byteLength: 637,
    sha256: "8eeaab4d250ec6eec364a287d36471755d79c05633b2b55c9cf51678dc02afe8",
  }),
]);

const EXPECTED_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/preflight.json`,
    byteLength: 36074,
    sha256: "06bd4544d42b0719846de4c3f8b3d547469dc895ace9ee3555dd5212deebdac6",
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery-v2 authority build: ${message}`);
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

function assertUniqueRegularFile(path) {
  const stat = lstatSync(repositoryPath(path));
  assert(stat.isFile() && stat.nlink === 1, `${path} is not one unique regular file`);
}

function reopenPredecessorLocks() {
  const groups = [
    {
      root: `${V1_RUNTIME_ROOT}/locks`,
      expected: EXPECTED_PREDECESSOR_LOCKS.slice(0, 2),
    },
    {
      root: `${SOURCE_RUNTIME_ROOT}/locks`,
      expected: EXPECTED_PREDECESSOR_LOCKS.slice(2),
    },
  ];

  const reopened = [];
  for (const group of groups) {
    const expectedNames = group.expected
      .map((entry) => entry.path.slice(entry.path.lastIndexOf("/") + 1))
      .sort();
    const entries = readdirSync(repositoryPath(group.root), { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    assert(
      sameJson(entries.map((entry) => entry.name), expectedNames),
      `${group.root} does not contain exactly the two registered locks`,
    );

    for (const expected of group.expected) {
      assertUniqueRegularFile(expected.path);
      const bytes = readBytes(expected.path);
      const identity = identityFromBytes(expected.path, bytes);
      assertIdentity(identity, {
        path: expected.path,
        byteLength: expected.byteLength,
        sha256: expected.sha256,
      }, expected.path);
      const parsedContent = JSON.parse(bytes.toString("utf8"));
      assert(sameJson(parsedContent, expected.parsedContent), `${expected.path} content differs`);
      reopened.push({ ...identity, parsedContent });
    }
  }
  return reopened;
}

function reopenPredecessorAttemptArtifacts() {
  const attemptsRoot = `${SOURCE_RUNTIME_ROOT}/attempts`;
  const packetAttemptRoot = `${attemptsRoot}/a-p-c0v-s6`;
  const attemptsEntries = readdirSync(repositoryPath(attemptsRoot), { withFileTypes: true });
  assert(
    attemptsEntries.length === 1 && attemptsEntries[0].isDirectory() &&
      attemptsEntries[0].name === "a-p-c0v-s6",
    "recovery-v1 attempts root does not contain exactly the A-P packet directory",
  );
  const packetEntries = readdirSync(repositoryPath(packetAttemptRoot), { withFileTypes: true });
  assert(
    packetEntries.length === 1 && packetEntries[0].isDirectory() &&
      packetEntries[0].name === SOURCE_AP_ATTEMPT_ID,
    "recovery-v1 A-P root does not contain exactly the v2 attempt directory",
  );
  const expectedNames = EXPECTED_PREDECESSOR_ATTEMPT_ARTIFACTS
    .map((entry) => entry.path.slice(entry.path.lastIndexOf("/") + 1))
    .sort();
  const entries = readdirSync(repositoryPath(SOURCE_AP_ATTEMPT_ROOT), { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  assert(
    sameJson(entries.map((entry) => entry.name), expectedNames),
    "recovery-v1 A-P attempt does not contain exactly the five registered files",
  );

  return EXPECTED_PREDECESSOR_ATTEMPT_ARTIFACTS.map((expected) => {
    assertUniqueRegularFile(expected.path);
    const identity = identityFromBytes(expected.path, readBytes(expected.path));
    assertIdentity(identity, expected, expected.path);
    return identity;
  });
}

function reopenPredecessorPublishedArtifacts() {
  const manifest = readJson("evidence/MANIFEST.json");
  return EXPECTED_PREDECESSOR_PUBLISHED_ARTIFACTS.map((expected) => {
    assertUniqueRegularFile(expected.path);
    const identity = identityFromBytes(expected.path, readBytes(expected.path));
    assertIdentity(identity, expected, expected.path);
    const manifestKey = expected.path.slice("evidence/".length);
    assert(
      sameJson(manifest.files[manifestKey], {
        bytes: expected.byteLength,
        sha256: expected.sha256,
      }),
      `${expected.path} is not pinned exactly in evidence/MANIFEST.json`,
    );
    return identity;
  });
}

function recoveryApFinalPaths() {
  return [
    `${RECOVERY_AP_EVIDENCE_ROOT}/artifact-index.json`,
    `${RECOVERY_AP_EVIDENCE_ROOT}/missing-producer.json`,
    `${RECOVERY_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/preflight.json`,
    `${RECOVERY_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/terminal-receipt.json`,
    `${RECOVERY_AP_EVIDENCE_ROOT}/uncalled-check.json`,
    `${RECOVERY_AP_EVIDENCE_ROOT}/verification.json`,
  ];
}

function recoveryApStagePaths() {
  return recoveryApFinalPaths().map((path) => `${path}.stage-${RECOVERY_AP_ATTEMPT_ID}`);
}

function predecessorAbsenceRoster(sourceApProtocol) {
  const sourceFinalPaths = sourceApProtocol.paths.allowedPublicationPaths;
  const sourceStagePaths = sourceApProtocol.paths.publicationStagingPaths
    .map((entry) => entry.stagingPath);
  assert(
    sourceFinalPaths.length === 6 && sourceStagePaths.length === 6,
    "recovery-v1 A-P output roster is not 6 + 6",
  );
  const publishedPath = EXPECTED_PREDECESSOR_PUBLISHED_ARTIFACTS[0].path;
  assert(sourceFinalPaths.includes(publishedPath), "pinned recovery-v1 preflight is not registered");
  const remainingV2Paths = [
    ...sourceFinalPaths.filter((path) => path !== publishedPath),
    ...sourceStagePaths,
  ];
  assert(
    remainingV2Paths.length === 11 && new Set(remainingV2Paths).size === 11,
    "recovery-v1 remaining absence roster is not 11 unique paths",
  );

  const v3Paths = [
    `${RECOVERY_RUNTIME_ROOT}/attempts/a-p-c0v-s6`,
    ...recoveryApFinalPaths(),
    ...recoveryApStagePaths(),
  ];
  assert(v3Paths.length === 13 && new Set(v3Paths).size === 13, "v3 roster is not 13 unique paths");
  const roster = [...remainingV2Paths, RECOVERY_RUNTIME_ROOT, ...v3Paths];
  assert(roster.length === 25 && new Set(roster).size === 25, "combined absence roster is not 25 unique paths");
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v2`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v2-callables-v1`;
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
      "phase10-c0v-s6-execution-v2-recovery-v1-packet-paths-v1",
      RECOVERY_CATALOGUE_ID,
    ],
  ];
  if (packetId === "a-p-c0v-s6") {
    replacements.push(
      [SOURCE_AP_ATTEMPT_ID, RECOVERY_AP_ATTEMPT_ID],
      [`${SOURCE_AP_EVIDENCE_ROOT}/`, `${RECOVERY_AP_EVIDENCE_ROOT}/`],
    );
  }
  return replacements;
}

function migrateApDependencyArtifacts(protocol, sourceApProtocol) {
  const sourceFinalPaths = new Set(sourceApProtocol.paths.allowedPublicationPaths);
  let migratedCount = 0;
  protocol.dependencyArtifactContracts = protocol.dependencyArtifactContracts.map((contract) => {
    if (!sourceFinalPaths.has(contract.artifactPath)) return contract;
    migratedCount += 1;
    return replaceStrings(contract, [
      [`${SOURCE_AP_EVIDENCE_ROOT}/`, `${RECOVERY_AP_EVIDENCE_ROOT}/`],
    ]);
  });
  assert(migratedCount === 6, `${protocol.packetId} does not bind exactly six A-P outputs`);
}

function main() {
  const sourceRecoveryAuthorityBytes = readBytes(SOURCE_RECOVERY_AUTHORITY_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_RECOVERY_AUTHORITY_IDENTITY.path, sourceRecoveryAuthorityBytes),
    SOURCE_RECOVERY_AUTHORITY_IDENTITY,
    "recovery-v1 authority",
  );
  const sourceRecoveryAuthority = JSON.parse(sourceRecoveryAuthorityBytes.toString("utf8"));
  assert(
    sourceRecoveryAuthority.predecessorImplementationFreezeCommit ===
      "27ca0dea801be026f6b3729d5d898a8856c42722",
    "recovery-v1 authority no longer binds the v1 implementation freeze",
  );

  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "recovery-v1 packet catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS),
    "recovery-v1 packet order differs",
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
    "recovery-v1 A-P protocol",
  );
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  assert(sourceApProtocol.registeredAttemptId === SOURCE_AP_ATTEMPT_ID, "recovery-v1 A-P attempt differs");

  // Reprove all predecessor bytes and absences before the first generated successor write.
  const predecessorLockArtifacts = reopenPredecessorLocks();
  const predecessorAttemptArtifacts = reopenPredecessorAttemptArtifacts();
  const predecessorPublishedArtifacts = reopenPredecessorPublishedArtifacts();
  const predecessorGovernedAbsentPaths = predecessorAbsenceRoster(sourceApProtocol);
  assert(
    predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
      predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
      predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      CUMULATIVE_RETAINED_BYTES,
    "cumulative retained byte total differs",
  );
  const recoveryV1RetainedIdentities = [
    ...predecessorLockArtifacts.slice(2).map(({ parsedContent: _parsedContent, ...identity }) => identity),
    ...predecessorAttemptArtifacts,
    ...predecessorPublishedArtifacts,
  ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  assert(
    recoveryV1RetainedIdentities.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      RECOVERY_V1_RETAINED_BYTES,
    "recovery-v1 retained byte total differs",
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
    schema: "phase10-c0v-s6-recovery-authority-v2",
    recoveryAuthorityId: RECOVERY_AUTHORITY_ID,
    automaticRetry: false,
    predecessorImplementationFreezeCommit: PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
    predecessorRecoveryAuthority: SOURCE_RECOVERY_AUTHORITY_IDENTITY,
    predecessorPacketCatalogue: SOURCE_CATALOGUE_IDENTITY,
    predecessorApProtocol: SOURCE_AP_PROTOCOL_IDENTITY,
    predecessorLockArtifacts,
    predecessorAttemptArtifacts,
    predecessorPublishedArtifacts,
    predecessorGovernedAbsentPaths,
    retainedBytes: CUMULATIVE_RETAINED_BYTES,
    observedWorkerProcessCount: 1,
    observedWorkerLifetimeNanoseconds: 384945300,
    creditedGovernedInvocationCount: 0,
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
    "both-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation";
  catalogue.recoveryAuthority = recoveryAuthorityIdentity;
  catalogue.runtimeLoaderContract.exactWorkerEnvironment = EXPECTED_WORKER_ENVIRONMENT;
  assert(
    sameJson(
      catalogue.runtimeLoaderContract.exactWorkerEnvironment.map((entry) => entry.key),
      [...catalogue.runtimeLoaderContract.exactWorkerEnvironment]
        .map((entry) => entry.key)
        .sort(),
    ),
    "worker environment is not ASCII-key-sorted",
  );
  catalogue.packets = catalogue.packets.map((entry) =>
    entry.packetId === "a-p-c0v-s6"
      ? replaceStrings(entry, [[`${SOURCE_AP_EVIDENCE_ROOT}/`, `${RECOVERY_AP_EVIDENCE_ROOT}/`]])
      : entry);
  const recoveryCatalogueIdentity = writeJson(RECOVERY_CATALOGUE_PATH, catalogue);

  const expectedSourceBaseline = sourceApProtocol.resources.packageStorageBaselineArtifacts;
  assert(
    expectedSourceBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === SOURCE_BASELINE_BYTES,
    "recovery-v1 package baseline artifact sum differs",
  );

  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    assert(
      sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, expectedSourceBaseline),
      `${packetId} recovery-v1 package baseline differs`,
    );
    assert(sourceProtocol.resources.automaticRetry === false, `${packetId} recovery-v1 retry policy differs`);

    const protocol = replaceStrings(
      sourceProtocol,
      packetReplacements(packetId, sourceProtocol, sourceRegistry),
    );
    if (packetId !== "a-p-c0v-s6") migrateApDependencyArtifacts(protocol, sourceApProtocol);
    protocol.schema = RECOVERY_PROTOCOL_SCHEMA;
    protocol.protocolId = recoveryProtocolId(packetId);
    protocol.registryId = recoveryRegistryId(packetId);
    protocol.bindings.packetCatalogue = recoveryCatalogueIdentity;
    protocol.bindings.callableRegistry = registryIdentities.get(packetId);
    protocol.bindings.recoveryAuthority = recoveryAuthorityIdentity;
    protocol.ancestryAuthority.implementationFreezeRule =
      "first-introduction-commit-of-recovery-v2-authority-with-both-predecessor-freezes-ancestor-and-current-successor-closure";
    protocol.resources.packageStorageBaselineArtifacts = [
      ...sourceProtocol.resources.packageStorageBaselineArtifacts,
      ...recoveryV1RetainedIdentities,
    ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
    protocol.resources.packageStorageBaselineBytes = RECOVERY_BASELINE_BYTES;

    if (packetId === "a-p-c0v-s6") {
      assert(protocol.registeredAttemptId === RECOVERY_AP_ATTEMPT_ID, "A-P v3 attempt differs");
      assert(
        protocol.paths.preflightReceiptPath === recoveryApFinalPaths()[2] &&
          protocol.paths.terminalReceiptPath === recoveryApFinalPaths()[3] &&
          sameJson(protocol.paths.allowedPublicationPaths, recoveryApFinalPaths()) &&
          sameJson(
            protocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
            recoveryApStagePaths(),
          ),
        "A-P v3 final or stage paths differ",
      );
    } else {
      assert(
        protocol.registeredAttemptId === sourceProtocol.registeredAttemptId &&
          protocol.paths.preflightReceiptPath === sourceProtocol.paths.preflightReceiptPath &&
          protocol.paths.terminalReceiptPath === sourceProtocol.paths.terminalReceiptPath &&
          sameJson(protocol.paths.allowedPublicationPaths, sourceProtocol.paths.allowedPublicationPaths) &&
          sameJson(protocol.paths.publicationStagingPaths, sourceProtocol.paths.publicationStagingPaths),
        `${packetId} unused attempt or evidence paths changed`,
      );
    }
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

  process.stdout.write(
    `wrote recovery-v2 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
