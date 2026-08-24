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
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v3";
const RECOVERY_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v4";
const V1_RUNTIME_ROOT = "out/phase10-execution-v2";
const RECOVERY_V1_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v1`;
const RECOVERY_V2_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v2`;
const SOURCE_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v3`;
const RECOVERY_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v4`;

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v4";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v4-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v4-packet-catalogue-v1";
const RECOVERY_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v4-packet-protocol-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "4286c613df99f3d4c83652a008db5cde2f8a22e8";

const SOURCE_RECOVERY_AUTHORITY_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/recovery-authority.json`,
  byteLength: 11096,
  sha256: "1164764dc41712210bac1f9c5d8c1a742343c1e077159d76461332efa54d24b4",
});
const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 16104,
  sha256: "94001263d722fb95cdee6a1332c0718f055a0d5932c54b2cc0fa467e99b25a10",
});
const SOURCE_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 77983,
  sha256: "acb2e94a3aad2e34a6b89e75b565a68ce44def1df89c4a649fd3b5a9bfc70f6c",
});

const SOURCE_BASELINE_BYTES = 2123065;
const RECOVERY_V3_RETAINED_BYTES = 433513;
const CUMULATIVE_RETAINED_BYTES = 927001;
const RECOVERY_BASELINE_BYTES = SOURCE_BASELINE_BYTES + RECOVERY_V3_RETAINED_BYTES;
const SOURCE_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v4";
const RECOVERY_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v5";
const SOURCE_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v4";
const RECOVERY_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v5";

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
    sha256: "e305f40956a4076a8e45c15339fc34026288310fe34c5283f5d19496ef1f6543",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-recovery-v3-packet-paths-v1",
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v4",
      processId: 49520,
      acquiredAt: "2026-08-24T14:08:16.311Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/a-p-c0v-s6.lock`,
    byteLength: 176,
    sha256: "90b1e66219e4ecfde43ebb96101164991444faea1021fa17ec621ef3e964e2ef",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "a-p-c0v-s6",
      attemptId: SOURCE_AP_ATTEMPT_ID,
      processId: 49520,
      acquiredAt: "2026-08-24T14:08:16.315Z",
    }),
  }),
]);

const SOURCE_AP_ATTEMPT_ROOT =
  `${SOURCE_RUNTIME_ROOT}/attempts/a-p-c0v-s6/${SOURCE_AP_ATTEMPT_ID}`;
const EXPECTED_LATEST_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/artifact-index.json`,
    byteLength: 13211,
    sha256: "58f0262ebb5d98af09ed96f336a285458e83f172741a2dce85ead4b9e740514c",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "4f02570b34cb17aeb883bd5f3f384c5dbd577e3b614b6c0c480d3ef655bcc76d",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "8279c4a6dce6fd3eeb2a0a7212e2830b259007460bf216bdcfccb1d6ec6153b7",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/exit-status.json`,
    byteLength: 243,
    sha256: "1e9884cd1632148532bf0f48839bd07671363452edbe8ad90a41f12980d58b3a",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/freeze-evaluation.json`,
    byteLength: 28131,
    sha256: "8fbdf83b3b46c3bf31dd57b45a3b38c96655a7103e2f5b30a74bf36a546a1f5a",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/stdout.log`,
    byteLength: 283305,
    sha256: "f44912834fece99c439629ded32efe4eb793e15564c1724021233f7a25f32e5b",
  }),
  Object.freeze({
    path: `${SOURCE_AP_ATTEMPT_ROOT}/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "7630a2392754401d4e71da36998c9c002e4878e2fe12313b0815ca3714133435",
  }),
]);

const EXPECTED_LATEST_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${SOURCE_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/preflight.json`,
    byteLength: 42189,
    sha256: "131f576278df328896c761de9a204f11967804410efe67b68ed1efc971a4a025",
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
    runtimeRoot: SOURCE_RUNTIME_ROOT,
    attemptId: SOURCE_AP_ATTEMPT_ID,
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery-v4 authority build: ${message}`);
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
  assert(expectedByRoot.size === 4, "predecessor locks do not cover exactly four generations");

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
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths.length === 35,
    "recovery-v3 authority absence roster differs",
  );
  const priorAbsences = sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(0, 22);
  const sourceFinalPaths = sourceApProtocol.paths.allowedPublicationPaths;
  const sourceStagePaths = sourceApProtocol.paths.publicationStagingPaths
    .map((entry) => entry.stagingPath);
  assert(
    sourceFinalPaths.length === 6 && sourceStagePaths.length === 6,
    "recovery-v3 A-P output roster is not 6 + 6",
  );
  assert(
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths[22] === SOURCE_RUNTIME_ROOT &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(23, 29), sourceFinalPaths) &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(29), sourceStagePaths),
    "recovery-v3 authority does not bind its exact pre-attempt state",
  );
  const publishedPath = EXPECTED_LATEST_PUBLISHED_ARTIFACTS[0].path;
  assert(sourceFinalPaths.includes(publishedPath), "pinned recovery-v3 preflight is not registered");
  const remainingSourcePaths = [
    ...sourceFinalPaths.filter((path) => path !== publishedPath),
    ...sourceStagePaths,
  ];
  assert(
    priorAbsences.length === 22 && new Set(priorAbsences).size === 22 &&
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
  assert(roster.length === 46 && new Set(roster).size === 46, "combined absence roster is not 46 unique paths");
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v4`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v4-callables-v1`;
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
      "phase10-c0v-s6-execution-v2-recovery-v3-packet-paths-v1",
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
    "recovery-v3 authority",
  );
  const sourceRecoveryAuthority = JSON.parse(sourceRecoveryAuthorityBytes.toString("utf8"));
  assert(
    sourceRecoveryAuthority.schema === "phase10-c0v-s6-recovery-authority-v3" &&
      sourceRecoveryAuthority.recoveryAuthorityId ===
        "phase10-c0v-s6-execution-v2-recovery-v3" &&
      sourceRecoveryAuthority.predecessorImplementationFreezeCommit ===
        "d670494b863484f6130d09915ce7ecae64b0d867" &&
      sourceRecoveryAuthority.predecessorLockArtifacts.length === 6 &&
      sourceRecoveryAuthority.predecessorAttemptArtifacts.length === 13 &&
      sourceRecoveryAuthority.predecessorPublishedArtifacts.length === 2 &&
      sourceRecoveryAuthority.retainedBytes === 493488 &&
      sourceRecoveryAuthority.automaticRetry === false,
    "recovery-v3 authority summary differs",
  );

  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "recovery-v3 packet catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS) &&
      sameJson(sourceCatalogue.runtimeLoaderContract.exactWorkerEnvironment, EXPECTED_WORKER_ENVIRONMENT),
    "recovery-v3 packet order or worker environment differs",
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
    "recovery-v3 A-P protocol",
  );
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  assert(sourceApProtocol.registeredAttemptId === SOURCE_AP_ATTEMPT_ID, "recovery-v3 A-P attempt differs");

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
    ...predecessorLockArtifacts.slice(6).map(({ parsedContent: _parsedContent, ...identity }) => identity),
    ...predecessorAttemptArtifacts.slice(13),
    ...predecessorPublishedArtifacts.slice(2),
  ].sort((left, right) => codePointCompare(left.path, right.path));
  assert(
    latestRetainedIdentities.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      RECOVERY_V3_RETAINED_BYTES,
    "recovery-v3 retained byte total differs",
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
    schema: "phase10-c0v-s6-recovery-authority-v4",
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
    observedWorkerLifetimeNanoseconds: 132474672300,
    creditedGovernedInvocationCount: 4,
    creditedGovernedElapsedNanoseconds: 131997897300,
    creditedGovernedProcessHours: 0.036666082583333336,
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
    "recovery-v3 package baseline artifact sum differs",
  );

  for (const packetId of PACKET_IDS) {
    const sourceProtocol = sourceProtocols.get(packetId);
    const sourceRegistry = sourceRegistries.get(packetId);
    assert(
      sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, expectedSourceBaseline),
      `${packetId} recovery-v3 package baseline differs`,
    );
    assert(sourceProtocol.resources.automaticRetry === false, `${packetId} recovery-v3 retry policy differs`);

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
      "first-introduction-commit-of-recovery-v4-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure";
    protocol.resources.packageStorageBaselineArtifacts = [
      ...sourceProtocol.resources.packageStorageBaselineArtifacts,
      ...latestRetainedIdentities,
    ].sort((left, right) => codePointCompare(left.path, right.path));
    protocol.resources.packageStorageBaselineBytes = RECOVERY_BASELINE_BYTES;

    if (packetId === "a-p-c0v-s6") {
      assert(protocol.registeredAttemptId === RECOVERY_AP_ATTEMPT_ID, "A-P v5 attempt differs");
      assert(
        protocol.paths.preflightReceiptPath === recoveryApFinalPaths()[2] &&
          protocol.paths.terminalReceiptPath === recoveryApFinalPaths()[3] &&
          sameJson(protocol.paths.allowedPublicationPaths, recoveryApFinalPaths()) &&
          sameJson(
            protocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
            recoveryApStagePaths(),
          ),
        "A-P v5 final or stage paths differ",
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
    `wrote recovery-v4 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
