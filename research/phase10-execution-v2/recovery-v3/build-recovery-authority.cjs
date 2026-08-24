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
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v2";
const RECOVERY_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v3";
const V1_RUNTIME_ROOT = "out/phase10-execution-v2";
const RECOVERY_V1_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v1`;
const SOURCE_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v2`;
const RECOVERY_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v3`;

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v3";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v3-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v3-packet-catalogue-v1";
const RECOVERY_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v3-packet-protocol-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "d670494b863484f6130d09915ce7ecae64b0d867";

const SOURCE_RECOVERY_AUTHORITY_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/recovery-authority.json`,
  byteLength: 7040,
  sha256: "b950f41ba55e2414948cc4c3cf8af14ec80fcedf816a7fcd9a8fc84a74b2294f",
});
const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 16104,
  sha256: "c746a176dc539dd8202a69851e8845964eb9bd131673ca6b3e46bbabd76c0bc6",
});
const SOURCE_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 75334,
  sha256: "4ce0aa90a7e66e3d45a1e6f3be3fe2caaf55c8434cc61dad68164bedffaf29e4",
});

const SOURCE_BASELINE_BYTES = 1693893;
const RECOVERY_V2_RETAINED_BYTES = 429172;
const CUMULATIVE_RETAINED_BYTES = 493488;
const RECOVERY_BASELINE_BYTES = SOURCE_BASELINE_BYTES + RECOVERY_V2_RETAINED_BYTES;
const SOURCE_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v3";
const RECOVERY_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v4";
const SOURCE_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v3";
const RECOVERY_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v4";

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

const EXPECTED_LATEST_LOCKS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/package.lock`,
    byteLength: 232,
    sha256: "d60b3dc3801d35673f0a3be2cd7816905112348e415cff80eaeda370c9e90424",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-recovery-v2-packet-paths-v1",
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v3",
      processId: 51264,
      acquiredAt: "2026-08-24T12:15:10.034Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/a-p-c0v-s6.lock`,
    byteLength: 176,
    sha256: "b163ff257442dcee2489b619c6f7be61b2f3ceb8e03bfaca89cd0a6eaa34f93d",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "a-p-c0v-s6",
      attemptId: SOURCE_AP_ATTEMPT_ID,
      processId: 51264,
      acquiredAt: "2026-08-24T12:15:10.038Z",
    }),
  }),
]);

const RECOVERY_V1_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v2";
const RECOVERY_V1_AP_ATTEMPT_ROOT =
  `${RECOVERY_V1_RUNTIME_ROOT}/attempts/a-p-c0v-s6/${RECOVERY_V1_AP_ATTEMPT_ID}`;
const SOURCE_AP_ATTEMPT_ROOT =
  `${SOURCE_RUNTIME_ROOT}/attempts/a-p-c0v-s6/${SOURCE_AP_ATTEMPT_ID}`;
const EXPECTED_LATEST_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/artifact-index.json`,
    byteLength: 13210,
    sha256: "ca677825c471a5311062bd160231a5828c05fc17ceac1c3e0f2d20d10f82d0f7",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "0341289d0bd4431847609713f5ffc0a99d063fe6a13a8940d7536b28e864acff",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "b62d26663cf8d7ed95eecbedbd2db2a7491bd3fcb3a3e9c5b4939b9e22059996",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/exit-status.json`,
    byteLength: 243,
    sha256: "547f4797edc9f68964caa68e58375a10bd2c983b8b68dba5f14fed2556006f12",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/freeze-evaluation.json`,
    byteLength: 27280,
    sha256: "8ca2c8806f56c84bdc20718cc3a95cb96e1ab9ec6e7e82db1c814f5bb759057a",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stdout.log`,
    byteLength: 283304,
    sha256: "a2e83c042fc5bfdb6025a8e5b3ba557284a7e95029a472d192a4aa9042b873b2",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "0559ded5fd38f56b9451389b3ea3d65c5fe8bb478b7044cb671eec214c61f244",
  }),
]);

const EXPECTED_LATEST_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/preflight.json`,
    byteLength: 38701,
    sha256: "dd7d897043313fbfd439a264fb8435fe5c3e736e078aa7db8e84a5980826ed36",
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery-v3 authority build: ${message}`);
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

function assertUniqueRegularFile(path) {
  const stat = lstatSync(repositoryPath(path));
  assert(stat.isFile() && stat.nlink === 1, `${path} is not one unique regular file`);
}

function reopenIdentityArtifact(expected) {
  assertUniqueRegularFile(expected.path);
  const identity = identityFromBytes(expected.path, readBytes(expected.path));
  assertIdentity(identity, expected, expected.path);
  return identity;
}

function reopenPredecessorLocks(expectedLocks) {
  const expectedByRoot = new Map();
  for (const entry of expectedLocks) {
    const root = entry.path.slice(0, entry.path.lastIndexOf("/"));
    const group = expectedByRoot.get(root) ?? [];
    group.push(entry);
    expectedByRoot.set(root, group);
  }
  assert(expectedByRoot.size === 3, "predecessor locks do not cover exactly three generations");

  for (const [root, expected] of expectedByRoot) {
    const expectedNames = expected
      .map((entry) => entry.path.slice(entry.path.lastIndexOf("/") + 1))
      .sort(codePointCompare);
    const entries = readdirSync(repositoryPath(root), { withFileTypes: true })
      .sort((left, right) => codePointCompare(left.name, right.name));
    assert(
      sameJson(entries.map((entry) => entry.name), expectedNames),
      `${root} does not contain exactly the two registered locks`,
    );
  }

  return expectedLocks.map((expected) => {
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
    return { ...identity, parsedContent };
  });
}

function assertOnlyDirectory(root, expectedName, label) {
  const entries = readdirSync(repositoryPath(root), { withFileTypes: true });
  assert(
    entries.length === 1 && entries[0].isDirectory() && entries[0].name === expectedName,
    `${label} does not contain exactly ${expectedName}`,
  );
}

function reopenPredecessorAttemptArtifacts(expectedArtifacts) {
  assertOnlyDirectory(
    `${RECOVERY_V1_RUNTIME_ROOT}/attempts`,
    "a-p-c0v-s6",
    "recovery-v1 attempts root",
  );
  assertOnlyDirectory(
    `${RECOVERY_V1_RUNTIME_ROOT}/attempts/a-p-c0v-s6`,
    RECOVERY_V1_AP_ATTEMPT_ID,
    "recovery-v1 A-P root",
  );
  const recoveryV1Names = expectedArtifacts
    .filter((entry) => entry.path.startsWith(`${RECOVERY_V1_AP_ATTEMPT_ROOT}/`))
    .map((entry) => entry.path.slice(entry.path.lastIndexOf("/") + 1))
    .sort(codePointCompare);
  const recoveryV1Entries = readdirSync(repositoryPath(RECOVERY_V1_AP_ATTEMPT_ROOT), {
    withFileTypes: true,
  }).sort((left, right) => codePointCompare(left.name, right.name));
  assert(
    sameJson(recoveryV1Entries.map((entry) => entry.name), recoveryV1Names) &&
      recoveryV1Entries.every((entry) => entry.isFile()),
    "recovery-v1 A-P attempt does not contain exactly five files",
  );

  assertOnlyDirectory(
    `${SOURCE_RUNTIME_ROOT}/attempts`,
    "a-p-c0v-s6",
    "recovery-v2 attempts root",
  );
  assertOnlyDirectory(
    `${SOURCE_RUNTIME_ROOT}/attempts/a-p-c0v-s6`,
    SOURCE_AP_ATTEMPT_ID,
    "recovery-v2 A-P root",
  );
  const sourceAttemptEntries = readdirSync(repositoryPath(SOURCE_AP_ATTEMPT_ROOT), {
    withFileTypes: true,
  }).sort((left, right) => codePointCompare(left.name, right.name));
  assert(
    sameJson(sourceAttemptEntries.map((entry) => entry.name), [
      "candidate",
      "exit-status.json",
      "freeze-evaluation.json",
      "stderr.log",
      "stdout.log",
      "worker-invocations.jsonl",
    ]) && sourceAttemptEntries[0].isDirectory() &&
      sourceAttemptEntries.slice(1).every((entry) => entry.isFile()),
    "recovery-v2 A-P attempt root differs",
  );
  const candidateEntries = readdirSync(repositoryPath(`${SOURCE_AP_ATTEMPT_ROOT}/candidate`), {
    withFileTypes: true,
  }).sort((left, right) => codePointCompare(left.name, right.name));
  assert(
    sameJson(candidateEntries.map((entry) => entry.name), [
      "artifact-index.json",
      "missing-producer.json",
      "uncalled-check.json",
    ]) && candidateEntries.every((entry) => entry.isFile()),
    "recovery-v2 candidate directory differs",
  );

  return expectedArtifacts.map(reopenIdentityArtifact);
}

function reopenPredecessorPublishedArtifacts(expectedArtifacts) {
  const manifest = readJson("evidence/MANIFEST.json");
  return expectedArtifacts.map((expected) => {
    const identity = reopenIdentityArtifact(expected);
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

function predecessorAbsenceRoster(sourceRecoveryAuthority, sourceApProtocol) {
  assert(
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths.length === 25,
    "recovery-v2 authority absence roster differs",
  );
  const priorV2Absences = sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(0, 11);
  const sourceFinalPaths = sourceApProtocol.paths.allowedPublicationPaths;
  const sourceStagePaths = sourceApProtocol.paths.publicationStagingPaths
    .map((entry) => entry.stagingPath);
  assert(
    sourceFinalPaths.length === 6 && sourceStagePaths.length === 6,
    "recovery-v2 A-P output roster is not 6 + 6",
  );
  assert(
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths[11] === SOURCE_RUNTIME_ROOT &&
      sourceRecoveryAuthority.predecessorGovernedAbsentPaths[12] === sourceApProtocol.paths.attemptRoot &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(13, 19), sourceFinalPaths) &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(19), sourceStagePaths),
    "recovery-v2 authority does not bind its exact pre-attempt state",
  );
  const publishedPath = EXPECTED_LATEST_PUBLISHED_ARTIFACTS[0].path;
  assert(sourceFinalPaths.includes(publishedPath), "pinned recovery-v2 preflight is not registered");
  const remainingV3Paths = [
    ...sourceFinalPaths.filter((path) => path !== publishedPath),
    ...sourceStagePaths,
  ];
  assert(
    priorV2Absences.length === 11 && new Set(priorV2Absences).size === 11 &&
      remainingV3Paths.length === 11 && new Set(remainingV3Paths).size === 11,
    "predecessor absence generations are not each 11 unique paths",
  );

  const roster = [
    ...priorV2Absences,
    ...remainingV3Paths,
    RECOVERY_RUNTIME_ROOT,
    ...recoveryApFinalPaths(),
    ...recoveryApStagePaths(),
  ];
  assert(roster.length === 35 && new Set(roster).size === 35, "combined absence roster is not 35 unique paths");
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v3`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v3-callables-v1`;
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
      "phase10-c0v-s6-execution-v2-recovery-v2-packet-paths-v1",
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
    "recovery-v2 authority",
  );
  const sourceRecoveryAuthority = JSON.parse(sourceRecoveryAuthorityBytes.toString("utf8"));
  assert(
    sourceRecoveryAuthority.schema === "phase10-c0v-s6-recovery-authority-v2" &&
      sourceRecoveryAuthority.recoveryAuthorityId ===
        "phase10-c0v-s6-execution-v2-recovery-v2" &&
      sourceRecoveryAuthority.predecessorImplementationFreezeCommit ===
        "df24330f878bda8b73e58875127736ee1a21684d" &&
      sourceRecoveryAuthority.predecessorLockArtifacts.length === 4 &&
      sourceRecoveryAuthority.predecessorAttemptArtifacts.length === 5 &&
      sourceRecoveryAuthority.predecessorPublishedArtifacts.length === 1 &&
      sourceRecoveryAuthority.retainedBytes === 64316 &&
      sourceRecoveryAuthority.automaticRetry === false,
    "recovery-v2 authority summary differs",
  );

  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "recovery-v2 packet catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS) &&
      sameJson(sourceCatalogue.runtimeLoaderContract.exactWorkerEnvironment, EXPECTED_WORKER_ENVIRONMENT),
    "recovery-v2 packet order or worker environment differs",
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
    "recovery-v2 A-P protocol",
  );
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  assert(sourceApProtocol.registeredAttemptId === SOURCE_AP_ATTEMPT_ID, "recovery-v2 A-P attempt differs");

  // Reprove every predecessor byte and absence before the first generated successor write.
  const expectedLocks = [
    ...sourceRecoveryAuthority.predecessorLockArtifacts,
    ...EXPECTED_LATEST_LOCKS,
  ];
  const expectedAttemptArtifacts = [
    ...sourceRecoveryAuthority.predecessorAttemptArtifacts,
    ...EXPECTED_LATEST_ATTEMPT_ARTIFACTS,
  ];
  const expectedPublishedArtifacts = [
    ...sourceRecoveryAuthority.predecessorPublishedArtifacts,
    ...EXPECTED_LATEST_PUBLISHED_ARTIFACTS,
  ];
  const predecessorLockArtifacts = reopenPredecessorLocks(expectedLocks);
  const predecessorAttemptArtifacts = reopenPredecessorAttemptArtifacts(expectedAttemptArtifacts);
  const predecessorPublishedArtifacts = reopenPredecessorPublishedArtifacts(expectedPublishedArtifacts);
  const predecessorGovernedAbsentPaths = predecessorAbsenceRoster(
    sourceRecoveryAuthority,
    sourceApProtocol,
  );
  assert(
    predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
      predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
      predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      CUMULATIVE_RETAINED_BYTES,
    "cumulative retained byte total differs",
  );
  const latestRetainedIdentities = [
    ...predecessorLockArtifacts.slice(4).map(({ parsedContent: _parsedContent, ...identity }) => identity),
    ...predecessorAttemptArtifacts.slice(5),
    ...predecessorPublishedArtifacts.slice(1),
  ].sort((left, right) => codePointCompare(left.path, right.path));
  assert(
    latestRetainedIdentities.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      RECOVERY_V2_RETAINED_BYTES,
    "recovery-v2 retained byte total differs",
  );

  const callableModulePaths = [...new Set(
    [...sourceRegistries.values()].flatMap((registry) =>
      registry.callables.map((callable) => callable.modulePath)),
  )].sort(codePointCompare);
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
    schema: "phase10-c0v-s6-recovery-authority-v3",
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
    observedWorkerLifetimeNanoseconds: 125776629700,
    creditedGovernedInvocationCount: 4,
    creditedGovernedElapsedNanoseconds: 125289842000,
    creditedGovernedProcessHours: 0.0348027338888889,
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
    "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation";
  catalogue.recoveryAuthority = recoveryAuthorityIdentity;
  catalogue.packets = catalogue.packets.map((entry) =>
    entry.packetId === "a-p-c0v-s6"
      ? replaceStrings(entry, [[`${SOURCE_AP_EVIDENCE_ROOT}/`, `${RECOVERY_AP_EVIDENCE_ROOT}/`]])
      : entry);
  const recoveryCatalogueIdentity = writeJson(RECOVERY_CATALOGUE_PATH, catalogue);

  const expectedSourceBaseline = sourceApProtocol.resources.packageStorageBaselineArtifacts;
  assert(
    expectedSourceBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === SOURCE_BASELINE_BYTES,
    "recovery-v2 package baseline artifact sum differs",
  );

  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    assert(
      sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, expectedSourceBaseline),
      `${packetId} recovery-v2 package baseline differs`,
    );
    assert(sourceProtocol.resources.automaticRetry === false, `${packetId} recovery-v2 retry policy differs`);

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
      "first-introduction-commit-of-recovery-v3-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure";
    protocol.resources.packageStorageBaselineArtifacts = [
      ...sourceProtocol.resources.packageStorageBaselineArtifacts,
      ...latestRetainedIdentities,
    ].sort((left, right) => codePointCompare(left.path, right.path));
    protocol.resources.packageStorageBaselineBytes = RECOVERY_BASELINE_BYTES;

    if (packetId === "a-p-c0v-s6") {
      assert(protocol.registeredAttemptId === RECOVERY_AP_ATTEMPT_ID, "A-P v4 attempt differs");
      assert(
        protocol.paths.preflightReceiptPath === recoveryApFinalPaths()[2] &&
          protocol.paths.terminalReceiptPath === recoveryApFinalPaths()[3] &&
          sameJson(protocol.paths.allowedPublicationPaths, recoveryApFinalPaths()) &&
          sameJson(
            protocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
            recoveryApStagePaths(),
          ),
        "A-P v4 final or stage paths differ",
      );
      assert(
        protocol.resources.currentPacketRegisteredElapsedNanosecondsMaximum === 57600000000000 &&
          protocol.resources.currentPacketRegisteredProcessHoursMaximum === 16,
        "A-P registered ceiling changed",
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
    `wrote recovery-v3 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
