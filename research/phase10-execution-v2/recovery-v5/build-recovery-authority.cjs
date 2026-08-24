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
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v4";
const RECOVERY_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v5";
const V1_RUNTIME_ROOT = "out/phase10-execution-v2";
const RECOVERY_V1_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v1`;
const RECOVERY_V2_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v2`;
const RECOVERY_V3_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v3`;
const SOURCE_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v4`;
const RECOVERY_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v5`;

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v5";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v5-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v5-packet-catalogue-v1";
const RECOVERY_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v5-packet-protocol-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "7ff83eaf9312ebc3bf23d6f5ef5a56d6f65a912a";

const SOURCE_RECOVERY_AUTHORITY_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/recovery-authority.json`,
  byteLength: 15144,
  sha256: "d4589800fa2f49a25e75012498397f377d3fa69ca5f7127985ed97eb7513a1f7",
});
const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 16104,
  sha256: "35ca2463f2f6fc0668c32144a59081d2243f783d1d3b1b55d34baff720b9ed30",
});
const SOURCE_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 80632,
  sha256: "d332a7b113d56fa5f9a1f278ab4491837efba2b55ead7929d78c4d20399ff94c",
});

const SOURCE_BASELINE_BYTES = 2556578;
const LATEST_RETAINED_BYTES = 437809;
const CUMULATIVE_RETAINED_BYTES = 1364810;
const RECOVERY_BASELINE_BYTES = SOURCE_BASELINE_BYTES + LATEST_RETAINED_BYTES;
const SOURCE_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v5";
const RECOVERY_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v6";
const SOURCE_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v5";
const RECOVERY_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v6";

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
    sha256: "f13f46397b7e47dae02777d9d4acc9495a7db57dd520c856366d9f12dd9c44f6",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-recovery-v4-packet-paths-v1",
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v5",
      processId: 41460,
      acquiredAt: "2026-08-24T15:41:09.953Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/a-p-c0v-s6.lock`,
    byteLength: 176,
    sha256: "42ef915d09fabfffc810a2852f4db1d63847b60a942f5fe690a3e304b7c26d20",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "a-p-c0v-s6",
      attemptId: SOURCE_AP_ATTEMPT_ID,
      processId: 41460,
      acquiredAt: "2026-08-24T15:41:09.957Z",
    }),
  }),
]);

const SOURCE_AP_ATTEMPT_ROOT =
  `${SOURCE_RUNTIME_ROOT}/attempts/a-p-c0v-s6/${SOURCE_AP_ATTEMPT_ID}`;
const EXPECTED_LATEST_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/artifact-index.json`,
    byteLength: 13211,
    sha256: "910b3f92f0e35b2a82735a03e41771327ae6e97b44557a7e0d1271e4c5624e0a",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "8e4b2936dfd8ffd6b2c262f388f962b8b81045d788b43db6b12fbe4903e8f31c",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "28e9546598da3cec5dfc09a0c5de207fea2f0e513d57df5f6a23f2814a7fd6f2",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/exit-status.json`,
    byteLength: 243,
    sha256: "a63e702621d100b4b7a87586b98474743f01b4d7926881c98fb2552adcf38ae5",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/freeze-evaluation.json`,
    byteLength: 28982,
    sha256: "56a2c2b7f18c4dd04a842681d405ece360d21f1060f6795ea1a17b67bd6e9cfd",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stdout.log`,
    byteLength: 283305,
    sha256: "c604aeee1c187577a0637583831345df9f2f83aca5f358baa19fb4a02e2e7915",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "8e0aae815890654b6e71320d6a95fd5f065e419952994c5a72eee58fb39070e4",
  }),
]);

const EXPECTED_LATEST_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/preflight.json`,
    byteLength: 45634,
    sha256: "5810af1e49041134ae8de171c4219b3fc0293b91922be63aa7249a23f6090f0a",
  }),
]);

const PREDECESSOR_ATTEMPT_TREES = Object.freeze([
  Object.freeze({
    runtimeRoot: RECOVERY_V1_RUNTIME_ROOT,
    attemptId: "a-p-c0v-s6-20260822-v2",
  }),
  Object.freeze({
    runtimeRoot: RECOVERY_V2_RUNTIME_ROOT,
    attemptId: "a-p-c0v-s6-20260822-v3",
  }),
  Object.freeze({
    runtimeRoot: RECOVERY_V3_RUNTIME_ROOT,
    attemptId: "a-p-c0v-s6-20260822-v4",
  }),
  Object.freeze({
    runtimeRoot: SOURCE_RUNTIME_ROOT,
    attemptId: SOURCE_AP_ATTEMPT_ID,
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery-v5 authority build: ${message}`);
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
  assert(expectedByRoot.size === 5, "predecessor locks do not cover exactly five generations");

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

function assertAttemptTree(tree, expectedArtifacts) {
  assertOnlyDirectory(`${tree.runtimeRoot}/attempts`, "a-p-c0v-s6", `${tree.runtimeRoot} attempts root`);
  assertOnlyDirectory(
    `${tree.runtimeRoot}/attempts/a-p-c0v-s6`,
    tree.attemptId,
    `${tree.runtimeRoot} A-P root`,
  );
  const attemptRoot = `${tree.runtimeRoot}/attempts/a-p-c0v-s6/${tree.attemptId}`;
  const relativePaths = expectedArtifacts
    .filter((entry) => entry.path.startsWith(`${attemptRoot}/`))
    .map((entry) => entry.path.slice(attemptRoot.length + 1));
  assert(relativePaths.length > 0, `${attemptRoot} has no registered artifacts`);

  const expectedTopNames = [...new Set(relativePaths.map((path) => path.split("/")[0]))]
    .sort(codePointCompare);
  const topEntries = readdirSync(repositoryPath(attemptRoot), { withFileTypes: true })
    .sort((left, right) => codePointCompare(left.name, right.name));
  assert(
    sameJson(topEntries.map((entry) => entry.name), expectedTopNames),
    `${attemptRoot} top-level census differs`,
  );
  for (const entry of topEntries) {
    const nested = relativePaths
      .filter((path) => path.startsWith(`${entry.name}/`))
      .map((path) => path.slice(entry.name.length + 1));
    if (nested.length === 0) {
      assert(entry.isFile(), `${attemptRoot}/${entry.name} is not a file`);
      continue;
    }
    assert(entry.isDirectory(), `${attemptRoot}/${entry.name} is not a directory`);
    assert(nested.every((path) => !path.includes("/")), `${attemptRoot}/${entry.name} nests too deeply`);
    const childEntries = readdirSync(repositoryPath(`${attemptRoot}/${entry.name}`), {
      withFileTypes: true,
    }).sort((left, right) => codePointCompare(left.name, right.name));
    assert(
      sameJson(childEntries.map((child) => child.name), [...nested].sort(codePointCompare)) &&
        childEntries.every((child) => child.isFile()),
      `${attemptRoot}/${entry.name} census differs`,
    );
  }
}

function reopenPredecessorAttemptArtifacts(expectedArtifacts) {
  for (const tree of PREDECESSOR_ATTEMPT_TREES) assertAttemptTree(tree, expectedArtifacts);
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
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths.length === 46,
    "recovery-v4 authority absence roster differs",
  );
  const priorAbsences = sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(0, 33);
  const sourceFinalPaths = sourceApProtocol.paths.allowedPublicationPaths;
  const sourceStagePaths = sourceApProtocol.paths.publicationStagingPaths
    .map((entry) => entry.stagingPath);
  assert(
    sourceFinalPaths.length === 6 && sourceStagePaths.length === 6,
    "recovery-v4 A-P output roster is not 6 + 6",
  );
  assert(
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths[33] === SOURCE_RUNTIME_ROOT &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(34, 40), sourceFinalPaths) &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(40), sourceStagePaths),
    "recovery-v4 authority does not bind its exact pre-attempt state",
  );
  const publishedPath = EXPECTED_LATEST_PUBLISHED_ARTIFACTS[0].path;
  assert(sourceFinalPaths.includes(publishedPath), "pinned recovery-v4 preflight is not registered");
  const remainingSourcePaths = [
    ...sourceFinalPaths.filter((path) => path !== publishedPath),
    ...sourceStagePaths,
  ];
  assert(
    priorAbsences.length === 33 && new Set(priorAbsences).size === 33 &&
      remainingSourcePaths.length === 11 && new Set(remainingSourcePaths).size === 11,
    "predecessor absence generations differ",
  );

  const roster = [
    ...priorAbsences,
    ...remainingSourcePaths,
    RECOVERY_RUNTIME_ROOT,
    ...recoveryApFinalPaths(),
    ...recoveryApStagePaths(),
  ];
  assert(roster.length === 57 && new Set(roster).size === 57, "combined absence roster is not 57 unique paths");
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v5`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v5-callables-v1`;
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
      "phase10-c0v-s6-execution-v2-recovery-v4-packet-paths-v1",
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
    "recovery-v4 authority",
  );
  const sourceRecoveryAuthority = JSON.parse(sourceRecoveryAuthorityBytes.toString("utf8"));
  assert(
    sourceRecoveryAuthority.schema === "phase10-c0v-s6-recovery-authority-v4" &&
      sourceRecoveryAuthority.recoveryAuthorityId ===
        "phase10-c0v-s6-execution-v2-recovery-v4" &&
      sourceRecoveryAuthority.predecessorImplementationFreezeCommit ===
        "4286c613df99f3d4c83652a008db5cde2f8a22e8" &&
      sourceRecoveryAuthority.predecessorLockArtifacts.length === 8 &&
      sourceRecoveryAuthority.predecessorAttemptArtifacts.length === 21 &&
      sourceRecoveryAuthority.predecessorPublishedArtifacts.length === 3 &&
      sourceRecoveryAuthority.retainedBytes === 927001 &&
      sourceRecoveryAuthority.automaticRetry === false,
    "recovery-v4 authority summary differs",
  );

  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "recovery-v4 packet catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS) &&
      sameJson(sourceCatalogue.runtimeLoaderContract.exactWorkerEnvironment, EXPECTED_WORKER_ENVIRONMENT),
    "recovery-v4 packet order or worker environment differs",
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
    "recovery-v4 A-P protocol",
  );
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  assert(sourceApProtocol.registeredAttemptId === SOURCE_AP_ATTEMPT_ID, "recovery-v4 A-P attempt differs");

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
    ...predecessorLockArtifacts.slice(8).map(({ parsedContent: _parsedContent, ...identity }) => identity),
    ...predecessorAttemptArtifacts.slice(21),
    ...predecessorPublishedArtifacts.slice(3),
  ].sort((left, right) => codePointCompare(left.path, right.path));
  assert(
    latestRetainedIdentities.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      LATEST_RETAINED_BYTES,
    "recovery-v4 retained byte total differs",
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
    schema: "phase10-c0v-s6-recovery-authority-v5",
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
    observedWorkerLifetimeNanoseconds: 134346732400,
    creditedGovernedInvocationCount: 4,
    creditedGovernedElapsedNanoseconds: 133870512700,
    creditedGovernedProcessHours: 0.037186253527777775,
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
    "recovery-v4 package baseline artifact sum differs",
  );

  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    assert(
      sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, expectedSourceBaseline),
      `${packetId} recovery-v4 package baseline differs`,
    );
    assert(sourceProtocol.resources.automaticRetry === false, `${packetId} recovery-v4 retry policy differs`);

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
      "first-introduction-commit-of-recovery-v5-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure";
    protocol.resources.packageStorageBaselineArtifacts = [
      ...sourceProtocol.resources.packageStorageBaselineArtifacts,
      ...latestRetainedIdentities,
    ].sort((left, right) => codePointCompare(left.path, right.path));
    protocol.resources.packageStorageBaselineBytes = RECOVERY_BASELINE_BYTES;

    if (packetId === "a-p-c0v-s6") {
      assert(protocol.registeredAttemptId === RECOVERY_AP_ATTEMPT_ID, "A-P v6 attempt differs");
      assert(
        protocol.paths.preflightReceiptPath === recoveryApFinalPaths()[2] &&
          protocol.paths.terminalReceiptPath === recoveryApFinalPaths()[3] &&
          sameJson(protocol.paths.allowedPublicationPaths, recoveryApFinalPaths()) &&
          sameJson(
            protocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
            recoveryApStagePaths(),
          ),
        "A-P v6 final or stage paths differ",
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
    `wrote recovery-v5 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
