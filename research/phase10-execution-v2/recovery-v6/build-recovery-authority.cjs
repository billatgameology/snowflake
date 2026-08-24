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
const SOURCE_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v5";
const RECOVERY_AUTHORITY_ROOT = "research/phase10-execution-v2/recovery-v6";
const V1_RUNTIME_ROOT = "out/phase10-execution-v2";
const RECOVERY_V1_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v1`;
const RECOVERY_V2_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v2`;
const RECOVERY_V3_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v3`;
const RECOVERY_V4_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v4`;
const SOURCE_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v5`;
const RECOVERY_RUNTIME_ROOT = `${V1_RUNTIME_ROOT}/recovery-v6`;

const RECOVERY_AUTHORITY_PATH = `${RECOVERY_AUTHORITY_ROOT}/recovery-authority.json`;
const RECOVERY_AUTHORITY_ID = "phase10-c0v-s6-execution-v2-recovery-v6";
const RECOVERY_CATALOGUE_PATH = `${RECOVERY_AUTHORITY_ROOT}/packet-catalogue.json`;
const RECOVERY_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v6-packet-paths-v1";
const RECOVERY_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v6-packet-catalogue-v1";
const RECOVERY_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v6-packet-protocol-v1";
const PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "d47b80373b1fec5ecc79d349046cfbf2a28fa58e";
const PREDECESSOR_ACCEPTED_PACKET_COMMIT =
  "e092259b8d4c3099b569febc08944bf99bfef31a";

const SOURCE_RECOVERY_AUTHORITY_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/recovery-authority.json`,
  byteLength: 19190,
  sha256: "5bd192d2a1a316008f682499e43c7c8d3cc2140bc02ab0e38773707c7365dd9b",
});
const SOURCE_CATALOGUE_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packet-catalogue.json`,
  byteLength: 16104,
  sha256: "d0a393c92c169bea3acd0e51abfb38bafd122a87fc180ea928204e1cc63416d6",
});
const SOURCE_AP_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 83281,
  sha256: "ea15bf75ef406b81c92e8d178f440985334edbc6a0f8994880cca50982fe0565",
});
const SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY = Object.freeze({
  path: `${SOURCE_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
  byteLength: 85606,
  sha256: "9514a8a3a03fe0de79d8de875c8034069952ff693dbe5ed86eac59cae10c2cec",
});

const SOURCE_LOCK_COUNT = 10;
const SOURCE_ATTEMPT_COUNT = 29;
const SOURCE_PUBLISHED_COUNT = 4;
const SOURCE_ABSENCE_COUNT = 57;
const SOURCE_RETAINED_BYTES = 1364810;
const SOURCE_BASELINE_COUNT = 55;
const SOURCE_BASELINE_BYTES = 2994387;
const STATIC_BASELINE_ADDITION_BYTES = 440;
const RECOVERY_BASELINE_COUNT = 57;
const RECOVERY_BASELINE_BYTES = 2994827;
const ACCEPTED_AP_PREFIX_COUNT = 15;
const ACCEPTED_AP_PREFIX_BYTES = 637675;
const RECOVERY_PREATTEMPT_COUNT = 72;
const RECOVERY_PREATTEMPT_BYTES = 3632502;
const CUMULATIVE_RETAINED_BYTES = 2002925;
const PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS = 391158252000;
const ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS = 141142452500;
const RECOVERY_PREATTEMPT_ELAPSED_NANOSECONDS = 532300704500;
const RECOVERY_PREATTEMPT_PROCESS_HOURS = 0.14786130680555556;
const MOVING_REGISTERED_ELAPSED_NANOSECONDS_MAXIMUM = 14400000000000;
const MOVING_REGISTERED_PROCESS_HOURS_MAXIMUM = 4;
const RECOVERY_PROJECTED_ELAPSED_NANOSECONDS = 14932300704500;
const RECOVERY_PROJECTED_PROCESS_HOURS = 4.147861306805556;
const RECOVERY_PROJECTED_STORAGE_BYTES = 79129974;
const RECOVERY_PROJECTED_SCRATCH_BYTES = 67108864;
const RECOVERY_PROJECTED_PUBLICATION_BYTES = 8388608;

const ACCEPTED_AP_ATTEMPT_ID = "a-p-c0v-s6-20260822-v6";
const SOURCE_AUTHORIZED_ATTEMPT_ID = "c0v-moving-produce-20260822-v1";
const RECOVERY_AUTHORIZED_ATTEMPT_ID = "c0v-moving-produce-20260822-v2";

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
    sha256: "6d049c5b60f38dedefea22b1ae32cdddbda6852680d346693533a3a8082182b4",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "phase10-c0v-s6-execution-v2-recovery-v5-packet-paths-v1",
      attemptId: "c0v-moving-produce:c0v-moving-produce-20260822-v1",
      processId: 52792,
      acquiredAt: "2026-08-24T20:00:30.299Z",
    }),
  }),
  Object.freeze({
    path: `${SOURCE_RUNTIME_ROOT}/locks/c0v-moving-produce.lock`,
    byteLength: 192,
    sha256: "009ae20742a764e0eec701574207046c317c2eba52324fe8b231572ba2b44cf7",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1",
      packetId: "c0v-moving-produce",
      attemptId: SOURCE_AUTHORIZED_ATTEMPT_ID,
      processId: 52792,
      acquiredAt: "2026-08-24T20:00:30.303Z",
    }),
  }),
]);

const ACCEPTED_AP_ATTEMPT_ROOT =
  `${SOURCE_RUNTIME_ROOT}/attempts/a-p-c0v-s6/${ACCEPTED_AP_ATTEMPT_ID}`;
const EXPECTED_ACCEPTED_AP_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/candidate/artifact-index.json`,
    byteLength: 13211,
    sha256: "7fd3d46e9edc33b60142c2fdf04f1eb6f468482941898137b521d496d61cfd31",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "3266dc73696ec749a60eb83e18be922ef46ff93e4b4779208597768080f145e7",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "a6ecba80cc9289666a364da94b95d26599a823adbf6cfe2c9292c6654f511050",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/exit-status.json`,
    byteLength: 243,
    sha256: "87fa0b6182650fe60895c9127a89153eb0ccfb29b5cd9aba129b63d8b0c26d8d",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/freeze-evaluation.json`,
    byteLength: 30078,
    sha256: "f9a5605e2e58be906bf7025f6a049f6aecd0e3c8d449774c03f6d0ddafde5550",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/stdout.log`,
    byteLength: 283305,
    sha256: "0767db5f0d91edfe9ff9d72361762002fb9ccb857518bdc808e063e93c301ff5",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/terminal-success-candidate.json`,
    byteLength: 9519,
    sha256: "19d7d23e6ec16af894e8f0e8ab164bea4f7e14f5bf6a984ad4b5cc3f7381bc3a",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_ATTEMPT_ROOT}/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "89bcb35abc4fa3b124c28735e0593e07c7e9537a78a281d3925df0ec19f12e12",
  }),
]);

const ACCEPTED_AP_EVIDENCE_ROOT = "evidence/phase10-obligation-preflight-v6";
const EXPECTED_ACCEPTED_AP_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${ACCEPTED_AP_EVIDENCE_ROOT}/artifact-index.json`,
    byteLength: 13211,
    sha256: "7fd3d46e9edc33b60142c2fdf04f1eb6f468482941898137b521d496d61cfd31",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_EVIDENCE_ROOT}/missing-producer.json`,
    byteLength: 30741,
    sha256: "3266dc73696ec749a60eb83e18be922ef46ff93e4b4779208597768080f145e7",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/preflight.json`,
    byteLength: 49270,
    sha256: "03ff669a927700f39714db87524e9946636be8afc3e455051332764f93a3fd14",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_EVIDENCE_ROOT}/packets/a-p-c0v-s6/terminal-receipt.json`,
    byteLength: 10127,
    sha256: "11bf3112732fdcb8673a30644c0a2290a462e3452d01d07e8f6b174b156bffc2",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_EVIDENCE_ROOT}/uncalled-check.json`,
    byteLength: 31382,
    sha256: "a6ecba80cc9289666a364da94b95d26599a823adbf6cfe2c9292c6654f511050",
  }),
  Object.freeze({
    path: `${ACCEPTED_AP_EVIDENCE_ROOT}/verification.json`,
    byteLength: 100562,
    sha256: "c4e32051bbd754c9263dc408df58e6f3d7d3e2fa1033f408b0beba4745dc6210",
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
    runtimeRoot: RECOVERY_V4_RUNTIME_ROOT,
    attemptId: "a-p-c0v-s6-20260822-v5",
  }),
  Object.freeze({
    runtimeRoot: SOURCE_RUNTIME_ROOT,
    attemptId: ACCEPTED_AP_ATTEMPT_ID,
  }),
]);

function fail(message) {
  throw new Error(`phase10 recovery-v6 authority build: ${message}`);
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
  assert(expectedByRoot.size === 6, "predecessor locks do not cover exactly six generations");

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
  assert(
    manifest.fileCount === 396 && manifest.totalBytes === 6242500 &&
      Object.keys(manifest.files).length === 396 &&
      Object.values(manifest.files).reduce((sum, entry) => sum + entry.bytes, 0) === 6242500,
    "evidence manifest totals differ from the accepted A-P publication commit",
  );
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

function movingStagePaths(protocol, attemptId) {
  return protocol.paths.allowedPublicationPaths.map((path) => `${path}.stage-${attemptId}`);
}

function predecessorAbsenceRoster(sourceRecoveryAuthority, sourceApProtocol, sourceMovingProtocol) {
  assert(
    sourceRecoveryAuthority.predecessorGovernedAbsentPaths.length === SOURCE_ABSENCE_COUNT,
    "recovery-v5 authority absence roster differs",
  );
  const priorAbsences = sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(0, 44);
  const sourceApFinalPaths = sourceApProtocol.paths.allowedPublicationPaths;
  const sourceApStagePaths = sourceApProtocol.paths.publicationStagingPaths
    .map((entry) => entry.stagingPath);
  assert(
    sourceApFinalPaths.length === 6 && sourceApStagePaths.length === 6 &&
      sourceRecoveryAuthority.predecessorGovernedAbsentPaths[44] === SOURCE_RUNTIME_ROOT &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(45, 51), sourceApFinalPaths) &&
      sameJson(sourceRecoveryAuthority.predecessorGovernedAbsentPaths.slice(51), sourceApStagePaths),
    "recovery-v5 authority does not bind its exact pre-A-P-v6 state",
  );
  assert(
    sameJson(
      sourceApFinalPaths,
      EXPECTED_ACCEPTED_AP_PUBLISHED_ARTIFACTS.map((entry) => entry.path),
    ),
    "accepted A-P final roster differs from its frozen protocol",
  );
  assert(pathObjectExists(SOURCE_RUNTIME_ROOT), "accepted recovery-v5 runtime root is absent");
  for (const path of sourceApFinalPaths) assert(pathObjectExists(path), `${path} is absent`);

  const sourceMovingAttemptRoot =
    `${sourceMovingProtocol.paths.attemptRoot}/${SOURCE_AUTHORIZED_ATTEMPT_ID}`;
  const sourceMovingFinalPaths = sourceMovingProtocol.paths.allowedPublicationPaths;
  const sourceMovingStagePaths = sourceMovingProtocol.paths.publicationStagingPaths
    .map((entry) => entry.stagingPath);
  const expectedSourceMovingStagePaths = movingStagePaths(
    sourceMovingProtocol,
    SOURCE_AUTHORIZED_ATTEMPT_ID,
  );
  const recoveryMovingStagePaths = movingStagePaths(
    sourceMovingProtocol,
    RECOVERY_AUTHORIZED_ATTEMPT_ID,
  );
  assert(
    sourceMovingFinalPaths.length === 4 &&
      sameJson(sourceMovingStagePaths, expectedSourceMovingStagePaths) &&
      recoveryMovingStagePaths.length === 4,
    "moving v1 final or stage roster differs",
  );

  const roster = [
    ...priorAbsences,
    ...sourceApStagePaths,
    sourceMovingAttemptRoot,
    ...sourceMovingStagePaths,
    RECOVERY_RUNTIME_ROOT,
    ...sourceMovingFinalPaths,
    ...recoveryMovingStagePaths,
  ];
  assert(roster.length === 64 && new Set(roster).size === 64, "combined absence roster is not 64 unique paths");
  for (const path of roster) assert(!pathObjectExists(path), `${path} is not absent`);
  return roster;
}

function recoveryProtocolId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v6`;
}

function recoveryRegistryId(packetId) {
  return `phase10-${packetId}-execution-v2-recovery-v6-callables-v1`;
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
      "phase10-c0v-s6-execution-v2-recovery-v5-packet-paths-v1",
      RECOVERY_CATALOGUE_ID,
    ],
  ];
  if (packetId === "c0v-moving-produce") {
    replacements.push([SOURCE_AUTHORIZED_ATTEMPT_ID, RECOVERY_AUTHORIZED_ATTEMPT_ID]);
  }
  return replacements;
}

function main() {
  const sourceRecoveryAuthorityBytes = readBytes(SOURCE_RECOVERY_AUTHORITY_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_RECOVERY_AUTHORITY_IDENTITY.path, sourceRecoveryAuthorityBytes),
    SOURCE_RECOVERY_AUTHORITY_IDENTITY,
    "recovery-v5 authority",
  );
  const sourceRecoveryAuthority = JSON.parse(sourceRecoveryAuthorityBytes.toString("utf8"));
  assert(
    sourceRecoveryAuthority.schema === "phase10-c0v-s6-recovery-authority-v5" &&
      sourceRecoveryAuthority.recoveryAuthorityId === "phase10-c0v-s6-execution-v2-recovery-v5" &&
      sourceRecoveryAuthority.predecessorImplementationFreezeCommit ===
        "7ff83eaf9312ebc3bf23d6f5ef5a56d6f65a912a" &&
      sourceRecoveryAuthority.predecessorLockArtifacts.length === SOURCE_LOCK_COUNT &&
      sourceRecoveryAuthority.predecessorAttemptArtifacts.length === SOURCE_ATTEMPT_COUNT &&
      sourceRecoveryAuthority.predecessorPublishedArtifacts.length === SOURCE_PUBLISHED_COUNT &&
      sourceRecoveryAuthority.predecessorGovernedAbsentPaths.length === SOURCE_ABSENCE_COUNT &&
      sourceRecoveryAuthority.retainedBytes === SOURCE_RETAINED_BYTES &&
      sourceRecoveryAuthority.automaticRetry === false,
    "recovery-v5 authority summary differs",
  );

  const sourceCatalogueBytes = readBytes(SOURCE_CATALOGUE_IDENTITY.path);
  assertIdentity(
    identityFromBytes(SOURCE_CATALOGUE_IDENTITY.path, sourceCatalogueBytes),
    SOURCE_CATALOGUE_IDENTITY,
    "recovery-v5 packet catalogue",
  );
  const sourceCatalogue = JSON.parse(sourceCatalogueBytes.toString("utf8"));
  assert(
    sameJson(sourceCatalogue.packets.map((entry) => entry.packetId), PACKET_IDS) &&
      sameJson(sourceCatalogue.runtimeLoaderContract.exactWorkerEnvironment, EXPECTED_WORKER_ENVIRONMENT),
    "recovery-v5 packet order or worker environment differs",
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
    "recovery-v5 accepted A-P protocol",
  );
  const sourceAuthorizedProtocolBytes = readBytes(SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY.path);
  assertIdentity(
    identityFromBytes(
      SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY.path,
      sourceAuthorizedProtocolBytes,
    ),
    SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY,
    "recovery-v5 authorized moving protocol",
  );
  const sourceApProtocol = sourceProtocols.get("a-p-c0v-s6");
  const sourceMovingProtocol = sourceProtocols.get("c0v-moving-produce");
  assert(
    sourceApProtocol.registeredAttemptId === ACCEPTED_AP_ATTEMPT_ID &&
      sourceMovingProtocol.registeredAttemptId === SOURCE_AUTHORIZED_ATTEMPT_ID,
    "recovery-v5 A-P or moving attempt differs",
  );

  // Reprove every predecessor byte and absence before the first successor write.
  const expectedLocks = [
    ...sourceRecoveryAuthority.predecessorLockArtifacts,
    ...EXPECTED_MOVING_LOCKS,
  ];
  const expectedAttemptArtifacts = [
    ...sourceRecoveryAuthority.predecessorAttemptArtifacts,
    ...EXPECTED_ACCEPTED_AP_ATTEMPT_ARTIFACTS,
  ];
  const expectedPublishedArtifacts = [
    ...sourceRecoveryAuthority.predecessorPublishedArtifacts,
    ...EXPECTED_ACCEPTED_AP_PUBLISHED_ARTIFACTS,
  ];
  const predecessorLockArtifacts = reopenPredecessorLocks(expectedLocks);
  const predecessorAttemptArtifacts = reopenPredecessorAttemptArtifacts(expectedAttemptArtifacts);
  const predecessorPublishedArtifacts = reopenPredecessorPublishedArtifacts(expectedPublishedArtifacts);
  const predecessorGovernedAbsentPaths = predecessorAbsenceRoster(
    sourceRecoveryAuthority,
    sourceApProtocol,
    sourceMovingProtocol,
  );
  assert(
    predecessorLockArtifacts.length === 12 &&
      predecessorAttemptArtifacts.length === 38 &&
      predecessorPublishedArtifacts.length === 10 &&
      predecessorGovernedAbsentPaths.length === 64,
    "recovery-v6 predecessor cardinality differs",
  );
  assert(
    predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
      predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
      predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) ===
      CUMULATIVE_RETAINED_BYTES,
    "cumulative retained byte total differs",
  );

  const staticBaselineAdditions = predecessorLockArtifacts.slice(SOURCE_LOCK_COUNT)
    .map(({ parsedContent: _parsedContent, ...identity }) => identity)
    .sort((left, right) => codePointCompare(left.path, right.path));
  const acceptedApPrefix = [
    ...predecessorAttemptArtifacts.slice(SOURCE_ATTEMPT_COUNT),
    ...predecessorPublishedArtifacts.slice(SOURCE_PUBLISHED_COUNT),
  ];
  assert(
    staticBaselineAdditions.length === 2 &&
      staticBaselineAdditions.reduce((sum, entry) => sum + entry.byteLength, 0) ===
        STATIC_BASELINE_ADDITION_BYTES,
    "moving stop static-baseline addition differs",
  );
  assert(
    acceptedApPrefix.length === ACCEPTED_AP_PREFIX_COUNT &&
      acceptedApPrefix.reduce((sum, entry) => sum + entry.byteLength, 0) ===
        ACCEPTED_AP_PREFIX_BYTES,
    "accepted A-P prior-packet prefix differs",
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
    "recovery-v6 storage or time projection arithmetic differs",
  );

  const callableCount = [...sourceRegistries.values()]
    .reduce((sum, registry) => sum + registry.callables.length, 0);
  assert(callableCount === 101, "source callable registration count is not 101");
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
    schema: "phase10-c0v-s6-recovery-authority-v6",
    recoveryAuthorityId: RECOVERY_AUTHORITY_ID,
    automaticRetry: false,
    predecessorImplementationFreezeCommit: PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
    predecessorAcceptedPacketCommit: PREDECESSOR_ACCEPTED_PACKET_COMMIT,
    predecessorRecoveryAuthority: SOURCE_RECOVERY_AUTHORITY_IDENTITY,
    predecessorPacketCatalogue: SOURCE_CATALOGUE_IDENTITY,
    predecessorApProtocol: SOURCE_AP_PROTOCOL_IDENTITY,
    predecessorAuthorizedPacketProtocol: SOURCE_AUTHORIZED_PACKET_PROTOCOL_IDENTITY,
    predecessorLockArtifacts,
    predecessorAttemptArtifacts,
    predecessorPublishedArtifacts,
    predecessorGovernedAbsentPaths,
    retainedBytes: CUMULATIVE_RETAINED_BYTES,
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

  let catalogue = replaceStrings(sourceCatalogue, [
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

  const expectedSourceBaseline = sourceApProtocol.resources.packageStorageBaselineArtifacts;
  assert(
    expectedSourceBaseline.length === SOURCE_BASELINE_COUNT &&
      expectedSourceBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === SOURCE_BASELINE_BYTES,
    "recovery-v5 static package baseline differs",
  );
  const recoveryBaseline = [
    ...expectedSourceBaseline,
    ...staticBaselineAdditions,
  ].sort((left, right) => codePointCompare(left.path, right.path));
  assert(
    recoveryBaseline.length === RECOVERY_BASELINE_COUNT &&
      new Set(recoveryBaseline.map((entry) => entry.path)).size === RECOVERY_BASELINE_COUNT &&
      recoveryBaseline.reduce((sum, entry) => sum + entry.byteLength, 0) === RECOVERY_BASELINE_BYTES &&
      recoveryBaseline.every((entry, index) =>
        index === 0 || codePointCompare(recoveryBaseline[index - 1].path, entry.path) < 0),
    "recovery-v6 static package baseline differs",
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
      sourceProtocol.schema === "phase10-c0v-s6-recovery-v5-packet-protocol-v1" &&
        sourceProtocol.resources.packageStorageBaselineBytes === SOURCE_BASELINE_BYTES &&
        sameJson(sourceProtocol.resources.packageStorageBaselineArtifacts, expectedSourceBaseline) &&
        sourceProtocol.resources.automaticRetry === false,
      `${packetId} recovery-v5 protocol or static baseline differs`,
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
      "first-introduction-commit-of-recovery-v6-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure";
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
            MOVING_REGISTERED_PROCESS_HOURS_MAXIMUM &&
          protocol.resources.projectedScratchBytes === RECOVERY_PROJECTED_SCRATCH_BYTES &&
          protocol.resources.projectedPublicationBytes === RECOVERY_PROJECTED_PUBLICATION_BYTES,
        "moving v2 attempt, evidence paths, or registered caps differ",
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
    "recovery-v6 catalogue is not homogeneous across all packets",
  );

  process.stdout.write(
    `wrote recovery-v6 authority, catalogue, and ${PACKET_IDS.length} protocol/registry pairs\n`,
  );
}

main();
