import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { parseNasAssetCatalogV1 } from "../../scripts/nas-asset-lib.ts";
import { detectNasMount } from "../../scripts/nas-root.ts";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import { parsePhase10CallableRegistry, parsePhase10PacketProtocol } from "./phase10-contracts.ts";
import { phase10ObligationRunPreflight } from "./phase10-obligation-preflight.ts";

const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const PACKET_PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/protocol.json";
const REGISTRY_PATH = "research/phase10-execution-v1/packets/b-acquisition/callable-registry.json";
const ACQUISITION_PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/acquisition-protocol.json";
const CATALOGUE_PATH = "docs/nas-assets.json";
const EVALUATOR_PATH = "runner/src/phase10-b-acquisition-verify.ts";
const COLLECTION_ID = "phase10-source-intake@2026-08-21-v1";
const ROUND_ID = "P10-ACQUISITION-ROUND-01";
const EXPECTED_TARGET_HASH = "d8746dfe257e5709d3f37dc352dcecfed69cba177f5adc8e7b9e545c25471945";
const CHECK_IDS = Object.freeze([
  "chk-b-acquisition-nas-receipt-or-na",
  "chk-b-acquisition-six-targets",
]);
const DEPENDENCY_IDS = Object.freeze(["a-i", "a-p", "a-s"]);
const TARGET_DISPOSITIONS = new Set([
  "acquired-and-bound",
  "already-held-and-bound",
  "identity-ambiguous",
  "not-found",
  "resource-refusal",
  "rights-blocked",
  "unavailable",
]);

type JsonObject = { readonly [key: string]: StrictJson };

interface TargetProtocol {
  readonly targetId: string;
  readonly attemptId: string;
  readonly identity: string;
  readonly persistentId: string;
  readonly endpoint: string;
  readonly mediaKind: "pdf" | "mp4";
  readonly fileName: string;
  readonly expectedByteLength: number | null;
  readonly expectedMd5: string | null;
}

interface AcquisitionProtocol {
  readonly protocolId: string;
  readonly targets: readonly TargetProtocol[];
  readonly outputPaths: {
    readonly acquisitionRound: string;
    readonly nasPublication: string;
  };
}

export interface Phase10BAcquisitionVerificationOptions {
  readonly repositoryRoot: string;
  readonly bundleDirectory: string;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn?: string;
  readonly endedOn?: string;
  readonly nasRoot?: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 B acquisition verifier refused: ${message}`);
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as JsonObject;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys differ`);
  }
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) fail(`${label} must be a nonempty string`);
  return value;
}

function strings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return Object.freeze(value.map((entry, index) => string(entry, `${label}[${index}]`)));
}

function exactStrings(actual: unknown, expected: readonly string[], label: string): void {
  const values = strings(actual, label);
  if (values.length !== expected.length || values.some((entry, index) => entry !== expected[index])) fail(`${label} differs`);
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) fail(`${label} must be a nonnegative safe integer`);
  return value;
}

function timestamp(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(result) || Number.isNaN(Date.parse(result))) {
    fail(`${label} must be an ISO timestamp`);
  }
  return result;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function safePath(root: string, relativePath: string, label: string): string {
  if (
    isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.startsWith("/") ||
    relativePath.endsWith("/") || relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} is not a safe relative path`);
  const absolute = resolve(root, relativePath);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) {
    fail(`${label} escapes its root`);
  }
  return absolute;
}

function read(root: string, relativePath: string, label: string): Uint8Array {
  const absolute = safePath(root, relativePath, label);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a non-symlink file`);
  return new Uint8Array(readFileSync(absolute));
}

function json(bytes: Uint8Array, label: string): StrictJson {
  try {
    return strictJsonSnapshot(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown);
  } catch (error) {
    fail(`${label} is not strict UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function tuple(value: unknown, label: string): { readonly path: string; readonly byteLength: number; readonly sha256: string } {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  const digest = string(row.sha256, `${label}.sha256`);
  if (!/^[0-9a-f]{64}$/u.test(digest)) fail(`${label}.sha256 is invalid`);
  return Object.freeze({
    path: string(row.path, `${label}.path`),
    byteLength: integer(row.byteLength, `${label}.byteLength`),
    sha256: digest,
  });
}

function identity(path: string, bytes: Uint8Array): StrictJson {
  return strictJsonSnapshot({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function parseAcquisitionProtocol(repositoryRoot: string): AcquisitionProtocol {
  const root = object(json(read(repositoryRoot, ACQUISITION_PROTOCOL_PATH, "acquisition protocol"), "acquisition protocol"), "acquisition protocol");
  exactKeys(root, ["schema", "protocolId", "createdOn", "round", "network", "targets", "nas", "outputs", "commands", "limits"], "acquisition protocol");
  if (root.schema !== "phase10-b-acquisition-protocol-v1") fail("acquisition protocol schema differs");
  const round = object(root.round, "acquisition protocol round");
  exactKeys(round, ["roundId", "attemptId", "expectedTargetCount", "expectedTargetIdsSha256"], "acquisition protocol round");
  if (round.roundId !== ROUND_ID || round.expectedTargetCount !== 6 || round.expectedTargetIdsSha256 !== EXPECTED_TARGET_HASH) {
    fail("acquisition protocol round differs from the foundation roster");
  }
  if (!Array.isArray(root.targets)) fail("acquisition protocol targets must be an array");
  const targets = root.targets.map((value, index): TargetProtocol => {
    const row = object(value, `acquisition protocol target ${index}`);
    exactKeys(row, ["targetId", "attemptId", "identity", "persistentId", "endpoint", "mediaKind", "fileName", "expectedByteLength", "expectedMd5"], `acquisition protocol target ${index}`);
    const mediaKind = string(row.mediaKind, `target ${index}.mediaKind`);
    if (mediaKind !== "pdf" && mediaKind !== "mp4") fail(`target ${index}.mediaKind differs`);
    const expectedByteLength = row.expectedByteLength === null ? null : integer(row.expectedByteLength, `target ${index}.expectedByteLength`);
    const expectedMd5 = row.expectedMd5 === null ? null : string(row.expectedMd5, `target ${index}.expectedMd5`);
    if (expectedMd5 !== null && !/^[0-9a-f]{32}$/u.test(expectedMd5)) fail(`target ${index}.expectedMd5 is invalid`);
    return Object.freeze({
      targetId: string(row.targetId, `target ${index}.targetId`),
      attemptId: string(row.attemptId, `target ${index}.attemptId`),
      identity: string(row.identity, `target ${index}.identity`),
      persistentId: string(row.persistentId, `target ${index}.persistentId`),
      endpoint: string(row.endpoint, `target ${index}.endpoint`),
      mediaKind,
      fileName: string(row.fileName, `target ${index}.fileName`),
      expectedByteLength,
      expectedMd5,
    });
  });
  const targetIds = targets.map((target) => target.targetId);
  const sortedIds = [...targetIds].sort(lexical);
  if (targetIds.length !== 6 || targetIds.some((value, index) => value !== sortedIds[index]) || new Set(targetIds).size !== 6) {
    fail("acquisition protocol target roster is not the exact sorted six-target set");
  }
  const rosterHash = sha256(new TextEncoder().encode(JSON.stringify(targetIds)));
  if (rosterHash !== EXPECTED_TARGET_HASH) fail("acquisition protocol target roster digest differs");
  const outputs = object(root.outputs, "acquisition protocol outputs");
  return Object.freeze({
    protocolId: string(root.protocolId, "acquisition protocol ID"),
    targets: Object.freeze(targets),
    outputPaths: Object.freeze({
      acquisitionRound: string(outputs.acquisitionRound, "acquisition round output path"),
      nasPublication: string(outputs.nasPublication, "NAS publication output path"),
    }),
  });
}

function readNasTuple(nasRoot: string, value: unknown, label: string): { readonly path: string; readonly byteLength: number; readonly sha256: string; readonly bytes: Uint8Array } {
  const expected = tuple(value, label);
  const bytes = read(nasRoot, expected.path, label);
  if (bytes.byteLength !== expected.byteLength || sha256(bytes) !== expected.sha256) fail(`${label} differs from reopened NAS bytes`);
  return Object.freeze({ ...expected, bytes });
}

function validatePublishedNas(
  repositoryRoot: string,
  nas: JsonObject,
  acquiredBindings: readonly JsonObject[],
  explicitNasRoot: string | undefined,
): void {
  const detected = explicitNasRoot ?? detectNasMount(process.env);
  if (detected === null) fail("governed NAS is detached for a published acquisition disposition");
  const nasRoot = realpathSync.native(resolve(detected));
  const publication = readNasTuple(nasRoot, nas.publicationReceipt, "publication receipt");
  const restoration = readNasTuple(nasRoot, nas.restoreReceipt, "restore receipt");
  const manifest = readNasTuple(nasRoot, nas.ownerManifest, "owner manifest");
  const publicationValue = object(json(publication.bytes, "publication receipt"), "publication receipt");
  const restoreValue = object(json(restoration.bytes, "restore receipt"), "restore receipt");
  if (
    publicationValue.format !== "snowflake-nas-publication-receipt-v1" || publicationValue.identity !== COLLECTION_ID ||
    publicationValue.locator !== "collections/phase10-source-intake/2026-08-21-v1/payload"
  ) fail("publication receipt identity differs");
  if (
    restoreValue.format !== "snowflake-nas-restore-receipt-v1" || restoreValue.identity !== COLLECTION_ID ||
    restoreValue.publicationReceiptPath !== publication.path || restoreValue.publicationReceiptSha256 !== publication.sha256
  ) fail("restore receipt is not bound to the publication receipt");
  const lines = new TextDecoder("utf-8", { fatal: true }).decode(manifest.bytes).trimEnd().split("\n");
  if (lines.length !== acquiredBindings.length + 1) fail("private owner manifest row count differs");
  const header = object(JSON.parse(lines[0]!) as unknown, "owner manifest header");
  exactKeys(header, ["recordType", "format", "identity", "files", "bytes"], "owner manifest header");
  if (header.recordType !== "header" || header.format !== "snowflake-nas-private-owner-jsonl-v1" || header.identity !== COLLECTION_ID || header.files !== acquiredBindings.length) {
    fail("owner manifest header differs");
  }
  const manifestRows = lines.slice(1).map((line, index) => object(JSON.parse(line) as unknown, `owner manifest row ${index}`));
  const byPath = new Map(manifestRows.map((row, index) => {
    exactKeys(row, ["recordType", "collection", "storageClass", "path", "bytes", "sha256"], `owner manifest row ${index}`);
    if (row.recordType !== "file" || row.collection !== COLLECTION_ID || row.storageClass !== "private-source") fail(`owner manifest row ${index} identity differs`);
    return [string(row.path, `owner manifest row ${index}.path`), row] as const;
  }));
  for (const binding of acquiredBindings) {
    const path = string(binding.relativePath, "acquired binding relativePath");
    const manifestRow = byPath.get(path);
    if (manifestRow === undefined || manifestRow.bytes !== binding.byteLength || manifestRow.sha256 !== binding.sha256) {
      fail(`acquired binding ${path} differs from the owner manifest`);
    }
    const owner = tuple(binding.ownerManifest, `acquired binding ${path} ownerManifest`);
    if (owner.path !== manifest.path || owner.byteLength !== manifest.byteLength || owner.sha256 !== manifest.sha256) {
      fail(`acquired binding ${path} owner-manifest tuple differs`);
    }
  }
  const catalogue = parseNasAssetCatalogV1(new TextDecoder("utf-8", { fatal: true }).decode(read(repositoryRoot, CATALOGUE_PATH, "NAS catalogue")));
  const collection = catalogue.collections.find((entry) => `${entry.assetId}@${entry.version}` === COLLECTION_ID);
  if (
    collection === undefined || collection.state !== "active" || collection.aggregate.files !== acquiredBindings.length ||
    collection.ownerManifest?.path !== manifest.path || collection.ownerManifest.bytes !== manifest.byteLength || collection.ownerManifest.sha256 !== manifest.sha256
  ) fail("active NAS catalogue binding differs from the published acquisition");
}

/** Independently reopen the two producer artifacts and derive both registered B-acquisition checks. */
export function phase10BAcquisitionVerify(options: Phase10BAcquisitionVerificationOptions): StrictJson {
  const repositoryRoot = realpathSync.native(resolve(options.repositoryRoot));
  const bundleRoot = realpathSync.native(resolve(repositoryRoot, options.bundleDirectory));
  const matrixValue = json(read(repositoryRoot, MATRIX_PATH, "obligation matrix"), "obligation matrix");
  const packetValue = json(read(repositoryRoot, PACKET_PROTOCOL_PATH, "packet protocol"), "packet protocol");
  const registryValue = json(read(repositoryRoot, REGISTRY_PATH, "callable registry"), "callable registry");
  const packet = parsePhase10PacketProtocol(packetValue);
  const registry = parsePhase10CallableRegistry(registryValue);
  const preflight = phase10ObligationRunPreflight(matrixValue, packetValue, registryValue, repositoryRoot);
  const acquisition = parseAcquisitionProtocol(repositoryRoot);
  if (packet.packetId !== "b-acquisition" || packet.protocolId !== "phase10-b-acquisition-v1" || registry.packetId !== packet.packetId) fail("packet identities differ");

  const roundBytes = read(bundleRoot, "acquisition-round.json", "candidate acquisition round");
  const nasBytes = read(bundleRoot, "acquisition-nas-publication.json", "candidate NAS disposition");
  const round = object(json(roundBytes, "candidate acquisition round"), "candidate acquisition round");
  exactKeys(round, ["schema", "roundId", "freezeCommit", "targetRoster", "targets", "terminalDisposition", "producer"], "acquisition round");
  if (round.schema !== "phase10-acquisition-round-v1" || round.roundId !== ROUND_ID || !/^[0-9a-f]{40}$/u.test(string(round.freezeCommit, "round freezeCommit"))) {
    fail("acquisition round identity differs");
  }
  const expectedIds = acquisition.targets.map((target) => target.targetId);
  exactStrings(round.targetRoster, expectedIds, "acquisition round targetRoster");
  if (!Array.isArray(round.targets) || round.targets.length !== 6) fail("acquisition round must contain six target rows");
  const acquiredBindings: JsonObject[] = [];
  const dispositions: string[] = [];
  for (const [index, value] of round.targets.entries()) {
    const target = acquisition.targets[index]!;
    const row = object(value, `acquisition target row ${index}`);
    exactKeys(row, ["schema", "targetId", "attemptId", "freezeCommit", "startedOn", "endedOn", "endpoints", "identityCandidates", "acquiredBinding", "terminalDisposition", "reason"], `acquisition target row ${index}`);
    if (
      row.schema !== "phase10-acquisition-round-row-v1" || row.targetId !== target.targetId || row.attemptId !== target.attemptId ||
      row.freezeCommit !== round.freezeCommit
    ) fail(`acquisition target row ${index} identity differs`);
    const startedOn = timestamp(row.startedOn, `acquisition target row ${index}.startedOn`);
    const endedOn = timestamp(row.endedOn, `acquisition target row ${index}.endedOn`);
    if (endedOn < startedOn) fail(`acquisition target row ${index} ended before it started`);
    exactStrings(row.endpoints, [target.endpoint], `acquisition target row ${index}.endpoints`);
    exactStrings(row.identityCandidates, [target.identity, target.persistentId].sort(lexical), `acquisition target row ${index}.identityCandidates`);
    const disposition = string(row.terminalDisposition, `acquisition target row ${index}.terminalDisposition`);
    if (!TARGET_DISPOSITIONS.has(disposition)) fail(`acquisition target row ${index} disposition is unknown`);
    dispositions.push(disposition);
    if (disposition === "acquired-and-bound" || disposition === "already-held-and-bound") {
      const binding = object(row.acquiredBinding, `acquisition target row ${index}.acquiredBinding`);
      exactKeys(binding, ["collectionId", "ownerManifest", "relativePath", "byteLength", "sha256"], `acquisition target row ${index}.acquiredBinding`);
      if (binding.collectionId !== COLLECTION_ID || !/^[0-9a-f]{64}$/u.test(string(binding.sha256, `binding ${index}.sha256`))) fail(`acquisition target row ${index} binding differs`);
      integer(binding.byteLength, `binding ${index}.byteLength`);
      acquiredBindings.push(binding);
    } else if (row.acquiredBinding !== null) {
      fail(`acquisition target row ${index} has a binding without acquired disposition`);
    }
    string(row.reason, `acquisition target row ${index}.reason`);
  }
  const expectedRoundDisposition = dispositions.every((value) => value === "acquired-and-bound" || value === "already-held-and-bound") ? "complete" : "refusal";
  if (round.terminalDisposition !== expectedRoundDisposition) fail("acquisition aggregate disposition differs from target rows");
  const producer = object(round.producer, "acquisition producer provenance");
  exactKeys(producer, ["producerId", "commit", "command", "startedOn", "endedOn", "actualConcurrency"], "acquisition producer provenance");
  if (producer.producerId !== "phase10-b-acquisition-producer" || producer.commit !== round.freezeCommit || producer.actualConcurrency !== 1) fail("acquisition producer provenance differs");
  timestamp(producer.startedOn, "producer.startedOn");
  timestamp(producer.endedOn, "producer.endedOn");

  const nas = object(json(nasBytes, "candidate NAS disposition"), "candidate NAS disposition");
  exactKeys(nas, ["schema", "collectionId", "state", "publicationReceipt", "restoreReceipt", "ownerManifest", "sourcePruneAuthorized", "reason"], "NAS disposition");
  if (nas.schema !== "phase10-nas-publication-disposition-v1" || nas.collectionId !== COLLECTION_ID || nas.sourcePruneAuthorized !== false) fail("NAS disposition identity differs");
  string(nas.reason, "NAS disposition reason");
  if (acquiredBindings.length === 0) {
    if (nas.state !== "not-applicable-no-new-bytes" || nas.publicationReceipt !== null || nas.restoreReceipt !== null || nas.ownerManifest !== null) {
      fail("zero-byte round lacks exact NAS not-applicable disposition");
    }
    const catalogue = parseNasAssetCatalogV1(new TextDecoder("utf-8", { fatal: true }).decode(read(repositoryRoot, CATALOGUE_PATH, "NAS catalogue")));
    const collection = catalogue.collections.find((entry) => `${entry.assetId}@${entry.version}` === COLLECTION_ID);
    if (collection === undefined || collection.aggregate.files !== 0 || collection.aggregate.bytes !== 0) fail("not-applicable NAS intent is not the registered zero-byte collection");
  } else {
    if (nas.state !== "published-and-restored") fail("acquired bytes lack published-and-restored NAS disposition");
    validatePublishedNas(repositoryRoot, nas, acquiredBindings, options.nasRoot);
  }

  const startedOn = options.startedOn ?? new Date().toISOString();
  const endedOn = options.endedOn ?? new Date().toISOString();
  timestamp(startedOn, "verification startedOn");
  timestamp(endedOn, "verification endedOn");
  if (endedOn < startedOn) fail("verification ended before it started");
  if (!/^[0-9a-f]{40}$/u.test(options.gitHead)) fail("verification gitHead is invalid");
  const evaluatorBytes = read(repositoryRoot, EVALUATOR_PATH, "B acquisition evaluator module");
  const terminalState = expectedRoundDisposition;
  return strictJsonSnapshot({
    schema: "phase10-packet-verification-v1",
    verificationId: "phase10-b-acquisition-verification-v1",
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: preflight.registryId,
    packetId: "b-acquisition",
    terminalState,
    verifiedArtifacts: [
      { outputId: "out-b-acquisition-nas-publication", ...(identity(acquisition.outputPaths.nasPublication, nasBytes) as JsonObject) },
      { outputId: "out-b-acquisition-round", ...(identity(acquisition.outputPaths.acquisitionRound, roundBytes) as JsonObject) },
    ],
    checkResults: [
      { checkId: CHECK_IDS[0], verdict: "pass", reasons: [], witnessOutputIds: ["out-b-acquisition-nas-publication"] },
      { checkId: CHECK_IDS[1], verdict: "pass", reasons: [], witnessOutputIds: ["out-b-acquisition-round"] },
    ],
    executedNegativeControlIds: [],
    negativeControlResults: [],
    boundDependencyPacketIds: DEPENDENCY_IDS,
    execution: {
      evaluatorCallableId: "phase10-b-acquisition-verifier",
      modulePath: EVALUATOR_PATH,
      exportName: "phase10BAcquisitionVerify",
      byteLength: evaluatorBytes.byteLength,
      sha256: sha256(evaluatorBytes),
      runtime: process.version,
      command: options.command,
      gitHead: options.gitHead,
      startedOn,
      endedOn,
      processConcurrency: 1,
    },
    aggregateVerdict: terminalState === "complete" ? "pass" : "refusal",
    limits: [
      "The verifier establishes the exact six-target terminal acquisition roster and NAS receipt-or-not-applicable branch; it does not claim the unavailable sources do not exist elsewhere.",
      "Every opened source value remains Phase 10 development evidence and grants no validation or prior-phase credit.",
    ],
  });
}
