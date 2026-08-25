import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  statfsSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  inventoryStableTree,
  parseNasAssetCatalogV1,
  type NasAssetCollectionV1,
  type NasTreeInventoryV1,
} from "../../scripts/nas-asset-lib.ts";
import {
  publishCollectionFixture,
  restoreCollectionFixture,
} from "../../scripts/nas-asset-transaction-lib.ts";
import { detectNasMount } from "../../scripts/nas-root.ts";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import { phase10BAcquisitionCheckCaller } from "./phase10-b-acquisition-checks.ts";
import {
  phase10BAcquisitionVerify,
  type Phase10BAcquisitionVerificationOptions,
} from "./phase10-b-acquisition-verify.ts";
import { parsePhase10ExecutionReceipt } from "./phase10-contracts.ts";
import {
  phase10ObligationReceiptPreflight,
  phase10ObligationRunPreflight,
  type Phase10ObligationPreflightPass,
} from "./phase10-obligation-preflight.ts";

const EXPECTED_BRANCH = "phase10/evidence-verification";
const EXPECTED_RUNTIME = "v24.13.1";
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const PACKET_PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/protocol.json";
const REGISTRY_PATH = "research/phase10-execution-v1/packets/b-acquisition/callable-registry.json";
const ACQUISITION_PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/acquisition-protocol.json";
const PACKET_CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json";
const NAS_CATALOGUE_PATH = "docs/nas-assets.json";
const COLLECTION_ID = "phase10-source-intake@2026-08-21-v1";
const PRIVATE_MANIFEST_FORMAT = "snowflake-nas-private-owner-jsonl-v1";
const PRODUCER_ID = "phase10-b-acquisition-producer";
const OUTPUT_IDS = Object.freeze([
  "out-b-acquisition-nas-publication",
  "out-b-acquisition-round",
  "out-b-acquisition-verification",
]);
const CHECK_IDS = Object.freeze([
  "chk-b-acquisition-nas-receipt-or-na",
  "chk-b-acquisition-six-targets",
]);
const DEPENDENCY_IDS = Object.freeze(["a-i", "a-p", "a-s"]);

type Command = "run" | "publish-nas" | "finalize";
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
  readonly roundId: string;
  readonly attemptId: string;
  readonly targets: readonly TargetProtocol[];
  readonly timeoutMs: number;
  readonly maximumResponseBytes: number;
  readonly maximumCombinedBytes: number;
  readonly userAgent: string;
  readonly attemptRoot: string;
  readonly sourceRoot: string;
  readonly restoreRoot: string;
  readonly publicationTransactionId: string;
  readonly restoreTransactionId: string;
  readonly candidateDirectory: string;
  readonly acquisitionRoundPath: string;
  readonly nasPublicationPath: string;
  readonly verificationPath: string;
  readonly preflightPath: string;
  readonly terminalReceiptPath: string;
  readonly commands: Readonly<Record<Command, string>>;
}

interface AttemptTarget {
  readonly targetId: string;
  readonly attemptId: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly endpoint: string;
  readonly httpStatus: number | null;
  readonly responseUrl: string | null;
  readonly contentType: string | null;
  readonly responseByteLength: number | null;
  readonly responseSha256: string | null;
  readonly stagedFile: { readonly relativePath: string; readonly byteLength: number; readonly sha256: string } | null;
  readonly terminalDisposition: "staged-for-private-publication" | "rights-blocked" | "unavailable" | "resource-refusal";
  readonly reason: string;
}

interface AttemptReport {
  readonly schema: "phase10-b-acquisition-attempt-v1";
  readonly roundId: string;
  readonly attemptId: string;
  readonly freezeCommit: string;
  readonly command: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly targets: readonly AttemptTarget[];
  readonly totalStagedBytes: number;
  readonly actualConcurrency: 1;
  readonly retryCount: 0;
}

interface ResponseClassification {
  readonly accepted: boolean;
  readonly disposition: AttemptTarget["terminalDisposition"];
  readonly reason: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 B acquisition producer refused: ${message}`);
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
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) fail(`${label} keys differ`);
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) fail(`${label} must be a nonempty string`);
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) fail(`${label} must be a nonnegative safe integer`);
  return value;
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
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) fail(`${label} escapes its root`);
  return absolute;
}

function read(root: string, relativePath: string, label: string): Uint8Array {
  const absolute = safePath(root, relativePath, label);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a non-symlink file`);
  return new Uint8Array(readFileSync(absolute));
}

function parseJson(bytes: Uint8Array, label: string): StrictJson {
  try {
    return strictJsonSnapshot(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown);
  } catch (error) {
    fail(`${label} is not strict UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function pretty(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function writeExclusive(root: string, relativePath: string, bytes: Uint8Array): void {
  const absolute = safePath(root, relativePath, relativePath);
  mkdirSync(dirname(absolute), { recursive: true });
  let descriptor: number | undefined;
  try {
    descriptor = openSync(absolute, "wx");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    throw error;
  }
  if (!sameBytes(read(root, relativePath, relativePath), bytes)) fail(`${relativePath} readback differs`);
}

function writeOrMatch(root: string, relativePath: string, bytes: Uint8Array): void {
  const absolute = safePath(root, relativePath, relativePath);
  if (existsSync(absolute)) {
    if (!sameBytes(read(root, relativePath, relativePath), bytes)) fail(`existing ${relativePath} differs`);
    return;
  }
  writeExclusive(root, relativePath, bytes);
}

function git(root: string, args: readonly string[]): string {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    fail(`git ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function identity(root: string, relativePath: string): StrictJson {
  const bytes = read(root, relativePath, relativePath);
  return strictJsonSnapshot({ path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function parseTarget(value: unknown, index: number): TargetProtocol {
  const row = object(value, `acquisition target ${index}`);
  exactKeys(row, ["targetId", "attemptId", "identity", "persistentId", "endpoint", "mediaKind", "fileName", "expectedByteLength", "expectedMd5"], `acquisition target ${index}`);
  const mediaKind = string(row.mediaKind, `target ${index}.mediaKind`);
  if (mediaKind !== "pdf" && mediaKind !== "mp4") fail(`target ${index}.mediaKind differs`);
  const expectedByteLength = row.expectedByteLength === null ? null : integer(row.expectedByteLength, `target ${index}.expectedByteLength`);
  const expectedMd5 = row.expectedMd5 === null ? null : string(row.expectedMd5, `target ${index}.expectedMd5`);
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
}

function loadAcquisitionProtocol(repositoryRoot: string): AcquisitionProtocol {
  const root = object(parseJson(read(repositoryRoot, ACQUISITION_PROTOCOL_PATH, "acquisition protocol"), "acquisition protocol"), "acquisition protocol");
  exactKeys(root, ["schema", "protocolId", "createdOn", "round", "network", "targets", "nas", "outputs", "commands", "limits"], "acquisition protocol");
  if (root.schema !== "phase10-b-acquisition-protocol-v1") fail("acquisition protocol schema differs");
  const round = object(root.round, "acquisition round protocol");
  const network = object(root.network, "acquisition network protocol");
  const nas = object(root.nas, "acquisition NAS protocol");
  const outputs = object(root.outputs, "acquisition output protocol");
  const commands = object(root.commands, "acquisition commands");
  if (!Array.isArray(root.targets)) fail("acquisition protocol targets must be an array");
  const targets = root.targets.map(parseTarget);
  if (targets.length !== 6 || new Set(targets.map((target) => target.targetId)).size !== 6) fail("acquisition protocol must contain six unique targets");
  if (network.runtime !== EXPECTED_RUNTIME || network.actualConcurrency !== 1 || network.retryCount !== 0 || network.redirect !== "follow") {
    fail("acquisition network execution contract differs");
  }
  if (nas.collectionId !== COLLECTION_ID || nas.sourcePruneAuthorized !== false) fail("acquisition NAS boundary differs");
  return Object.freeze({
    protocolId: string(root.protocolId, "acquisition protocolId"),
    roundId: string(round.roundId, "roundId"),
    attemptId: string(round.attemptId, "attemptId"),
    targets: Object.freeze(targets),
    timeoutMs: integer(network.timeoutMs, "network.timeoutMs"),
    maximumResponseBytes: integer(network.maximumResponseBytes, "network.maximumResponseBytes"),
    maximumCombinedBytes: integer(network.maximumCombinedStagingAndPublicationBytes, "network.maximumCombinedStagingAndPublicationBytes"),
    userAgent: string(network.userAgent, "network.userAgent"),
    attemptRoot: string(nas.attemptRoot, "nas.attemptRoot"),
    sourceRoot: string(nas.sourceRoot, "nas.sourceRoot"),
    restoreRoot: string(nas.restoreRoot, "nas.restoreRoot"),
    publicationTransactionId: string(nas.publicationTransactionId, "nas.publicationTransactionId"),
    restoreTransactionId: string(nas.restoreTransactionId, "nas.restoreTransactionId"),
    candidateDirectory: string(outputs.candidateDirectory, "outputs.candidateDirectory"),
    acquisitionRoundPath: string(outputs.acquisitionRound, "outputs.acquisitionRound"),
    nasPublicationPath: string(outputs.nasPublication, "outputs.nasPublication"),
    verificationPath: string(outputs.verification, "outputs.verification"),
    preflightPath: string(outputs.preflight, "outputs.preflight"),
    terminalReceiptPath: string(outputs.terminalReceipt, "outputs.terminalReceipt"),
    commands: Object.freeze({
      run: string(commands.run, "commands.run"),
      "publish-nas": string(commands.publishNas, "commands.publishNas"),
      finalize: string(commands.finalize, "commands.finalize"),
    }),
  });
}

function assertRepository(repositoryRoot: string, exactFreezeHead: boolean): { readonly head: string; readonly freezeCommit: string } {
  const branch = git(repositoryRoot, ["branch", "--show-current"]);
  if (branch !== EXPECTED_BRANCH) fail(`branch ${branch} is not ${EXPECTED_BRANCH}`);
  const changes = git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  if (changes !== "") fail(`repository must be clean before a B acquisition action: ${changes.replaceAll("\n", " | ")}`);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} is not ${EXPECTED_RUNTIME}`);
  const head = git(repositoryRoot, ["rev-parse", "HEAD"]);
  const freezeCommit = git(repositoryRoot, ["log", "--diff-filter=A", "--format=%H", "-1", "--", ACQUISITION_PROTOCOL_PATH]);
  if (!/^[0-9a-f]{40}$/u.test(freezeCommit)) fail("acquisition protocol has no committed introduction");
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", freezeCommit, head], { cwd: repositoryRoot, stdio: "ignore" });
  } catch {
    fail("acquisition protocol freeze is not an ancestor of current HEAD");
  }
  const frozenBytes = new Uint8Array(execFileSync("git", ["show", `${freezeCommit}:${ACQUISITION_PROTOCOL_PATH}`], { cwd: repositoryRoot, encoding: "buffer" }));
  const currentBytes = read(repositoryRoot, ACQUISITION_PROTOCOL_PATH, "acquisition protocol");
  if (!sameBytes(frozenBytes, currentBytes)) fail("acquisition protocol changed after its freeze commit");
  if (exactFreezeHead && head !== freezeCommit) fail("the network acquisition must execute at the exact value-free protocol freeze commit");
  return Object.freeze({ head, freezeCommit });
}

function loadObligationPreflight(repositoryRoot: string): {
  readonly pass: Phase10ObligationPreflightPass;
  readonly matrix: StrictJson;
  readonly packet: StrictJson;
  readonly registry: StrictJson;
} {
  const matrix = parseJson(read(repositoryRoot, MATRIX_PATH, "obligation matrix"), "obligation matrix");
  const packet = parseJson(read(repositoryRoot, PACKET_PROTOCOL_PATH, "packet protocol"), "packet protocol");
  const registry = parseJson(read(repositoryRoot, REGISTRY_PATH, "callable registry"), "callable registry");
  const pass = phase10ObligationRunPreflight(matrix, packet, registry, repositoryRoot);
  if (
    pass.packetId !== "b-acquisition" || pass.stage !== "run" ||
    pass.outputIds.length !== OUTPUT_IDS.length || pass.checkIds.length !== CHECK_IDS.length || pass.negativeControlIds.length !== 0
  ) fail("B acquisition obligation preflight differs");
  return Object.freeze({ pass, matrix, packet, registry });
}

function dependencyBindings(repositoryRoot: string): StrictJson {
  const catalogue = object(parseJson(read(repositoryRoot, PACKET_CATALOGUE_PATH, "packet catalogue"), "packet catalogue"), "packet catalogue");
  if (!Array.isArray(catalogue.packets)) fail("packet catalogue packets must be an array");
  const rows = catalogue.packets.map((value, index) => object(value, `packet catalogue row ${index}`));
  return strictJsonSnapshot(DEPENDENCY_IDS.map((packetId) => {
    const row = rows.find((candidate) => candidate.packetId === packetId);
    if (row === undefined) fail(`packet catalogue omits dependency ${packetId}`);
    const terminalPath = string(row.terminalReceiptPath, `${packetId} terminal receipt path`);
    const terminal = parsePhase10ExecutionReceipt(parseJson(read(repositoryRoot, terminalPath, `${packetId} terminal receipt`), `${packetId} terminal receipt`));
    if (terminal.packetId !== packetId || (terminal.terminalState !== "pass" && terminal.terminalState !== "complete")) fail(`${packetId} terminal receipt is not passing/complete`);
    if (!Array.isArray(row.verificationPaths) || row.verificationPaths.length === 0) fail(`${packetId} verification paths differ`);
    const verificationArtifacts = row.verificationPaths.map((pathValue, index) => {
      const path = string(pathValue, `${packetId} verification path ${index}`);
      const value = object(parseJson(read(repositoryRoot, path, `${packetId} verification ${index}`), `${packetId} verification ${index}`), `${packetId} verification ${index}`);
      if (value.aggregateVerdict !== "pass" && value.verdict !== "pass") fail(`${packetId} verification ${index} is not pass`);
      return identity(repositoryRoot, path);
    });
    return {
      packetId,
      protocol: identity(repositoryRoot, string(row.protocolPath, `${packetId} protocol path`)),
      callableRegistry: identity(repositoryRoot, string(row.callableRegistryPath, `${packetId} registry path`)),
      terminalReceipt: identity(repositoryRoot, terminalPath),
      verificationArtifacts,
    };
  }));
}

function buildPreflight(
  repositoryRoot: string,
  protocol: AcquisitionProtocol,
  history: { readonly head: string; readonly freezeCommit: string },
  obligation: Phase10ObligationPreflightPass,
  freeBytes: number,
): StrictJson {
  return strictJsonSnapshot({
    schema: "phase10-preflight-receipt-v1",
    receiptId: `phase10-b-acquisition-${protocol.attemptId}-preflight-v1`,
    matrixId: obligation.matrixId,
    protocolId: obligation.protocolId,
    registryId: obligation.registryId,
    packetId: "b-acquisition",
    attemptId: protocol.attemptId,
    stage: "run",
    observed: {
      launchClass: "deciding-extraction",
      machineLaunchChecks: "branch-clean-runtime-disk-unique-attempt",
      branch: EXPECTED_BRANCH,
      head: history.head,
      freezeCommit: history.freezeCommit,
      runtime: process.version,
      command: protocol.commands.run,
      repositoryBundleRoot: ".",
      attemptDirectory: protocol.attemptRoot,
      candidateDirectory: protocol.candidateDirectory,
      registeredAttemptRoot: "out/phase10-execution-v1/attempts/b-acquisition",
      finalPreflightReceiptPath: protocol.preflightPath,
      finalTerminalReceiptPath: protocol.terminalReceiptPath,
      verificationPaths: [protocol.verificationPath],
      matrix: identity(repositoryRoot, MATRIX_PATH),
      protocol: identity(repositoryRoot, PACKET_PROTOCOL_PATH),
      callableRegistry: identity(repositoryRoot, REGISTRY_PATH),
      acquisitionProtocol: identity(repositoryRoot, ACQUISITION_PROTOCOL_PATH),
      dependencyPacketIds: DEPENDENCY_IDS,
      dependencyArtifacts: dependencyBindings(repositoryRoot),
      resources: {
        observedFreeBytes: freeBytes,
        requiredFreeBytes: protocol.maximumCombinedBytes,
        maximumCombinedStagingAndPublicationBytes: protocol.maximumCombinedBytes,
        writerState: "unique-attempt-directory-created",
      },
    },
    outputIds: obligation.outputIds,
    checkIds: obligation.checkIds,
    negativeControlIds: obligation.negativeControlIds,
    callableIds: obligation.callableIds,
    selectedBranches: obligation.selectedBranches,
    verdict: "pass",
    reasons: [],
  });
}

function startsPdf(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 5 && new TextDecoder("ascii").decode(bytes.subarray(0, 5)) === "%PDF-";
}

function startsMp4(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 12 && new TextDecoder("ascii").decode(bytes.subarray(4, 8)) === "ftyp";
}

/** Pure source-response classification used by the single bounded network round and focused tests. */
export function phase10BClassifyAcquisitionResponse(
  target: Pick<TargetProtocol, "mediaKind" | "expectedByteLength" | "expectedMd5">,
  status: number,
  contentType: string,
  bytes: Uint8Array,
  exceededCap = false,
): ResponseClassification {
  if (exceededCap) return Object.freeze({ accepted: false, disposition: "resource-refusal", reason: "The official response exceeded the frozen per-response byte cap." });
  if (status === 401 || status === 402 || status === 403) return Object.freeze({ accepted: false, disposition: "rights-blocked", reason: `The official endpoint returned access status ${status}; purchase and credentials are not authorized.` });
  if (status !== 200) return Object.freeze({ accepted: false, disposition: "unavailable", reason: `The official endpoint returned HTTP ${status} without the requested complete artifact.` });
  if (target.mediaKind === "pdf") {
    if (startsPdf(bytes)) return Object.freeze({ accepted: true, disposition: "staged-for-private-publication", reason: "The frozen official endpoint returned a PDF artifact." });
    if (contentType.toLowerCase().includes("html") || (bytes[0] === 60 && bytes.byteLength > 0)) {
      return Object.freeze({ accepted: false, disposition: "rights-blocked", reason: "The official endpoint returned an access or product page instead of the complete PDF; purchase and credentials are not authorized." });
    }
    return Object.freeze({ accepted: false, disposition: "unavailable", reason: "The official endpoint did not return a PDF artifact." });
  }
  const md5 = createHash("md5").update(bytes).digest("hex");
  if (startsMp4(bytes) && bytes.byteLength === target.expectedByteLength && md5 === target.expectedMd5) {
    return Object.freeze({ accepted: true, disposition: "staged-for-private-publication", reason: "The frozen official endpoint returned the exact advertised S2 media file." });
  }
  return Object.freeze({ accepted: false, disposition: "unavailable", reason: "The official endpoint response did not match the frozen S2 file length, MD5, and MP4 signature." });
}

async function responseBytes(response: Response, cap: number): Promise<{ readonly bytes: Uint8Array; readonly exceededCap: boolean }> {
  if (response.body === null) return Object.freeze({ bytes: new Uint8Array(), exceededCap: false });
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > cap) {
      await reader.cancel();
      return Object.freeze({ bytes: new Uint8Array(), exceededCap: true });
    }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return Object.freeze({ bytes, exceededCap: false });
}

async function attemptTarget(repositoryRoot: string, protocol: AcquisitionProtocol, target: TargetProtocol): Promise<AttemptTarget> {
  const startedOn = new Date().toISOString();
  try {
    const response = await fetch(target.endpoint, {
      method: "GET",
      redirect: "follow",
      headers: {
        accept: target.mediaKind === "pdf" ? "application/pdf,text/html;q=0.2" : "video/mp4,application/octet-stream;q=0.8",
        "user-agent": protocol.userAgent,
      },
      signal: AbortSignal.timeout(protocol.timeoutMs),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const advertisedLength = response.headers.get("content-length");
    const advertisedBytes = advertisedLength === null ? null : Number(advertisedLength);
    let body: { readonly bytes: Uint8Array; readonly exceededCap: boolean };
    if (advertisedBytes !== null && Number.isFinite(advertisedBytes) && advertisedBytes > protocol.maximumResponseBytes) {
      body = Object.freeze({ bytes: new Uint8Array(), exceededCap: true });
      await response.body?.cancel();
    } else {
      body = await responseBytes(response, protocol.maximumResponseBytes);
    }
    const classification = phase10BClassifyAcquisitionResponse(target, response.status, contentType, body.bytes, body.exceededCap);
    const endedOn = new Date().toISOString();
    let stagedFile: AttemptTarget["stagedFile"] = null;
    if (classification.accepted) {
      const relativePath = target.fileName;
      writeExclusive(repositoryRoot, `${protocol.sourceRoot}/${relativePath}`, body.bytes);
      stagedFile = Object.freeze({ relativePath, byteLength: body.bytes.byteLength, sha256: sha256(body.bytes) });
    }
    return Object.freeze({
      targetId: target.targetId,
      attemptId: target.attemptId,
      startedOn,
      endedOn,
      endpoint: target.endpoint,
      httpStatus: response.status,
      responseUrl: response.url,
      contentType: contentType === "" ? null : contentType,
      responseByteLength: body.exceededCap ? null : body.bytes.byteLength,
      responseSha256: body.exceededCap ? null : sha256(body.bytes),
      stagedFile,
      terminalDisposition: classification.disposition,
      reason: classification.reason,
    });
  } catch (error) {
    return Object.freeze({
      targetId: target.targetId,
      attemptId: target.attemptId,
      startedOn,
      endedOn: new Date().toISOString(),
      endpoint: target.endpoint,
      httpStatus: null,
      responseUrl: null,
      contentType: null,
      responseByteLength: null,
      responseSha256: null,
      stagedFile: null,
      terminalDisposition: "unavailable",
      reason: `The single frozen request ended without an HTTP artifact: ${error instanceof Error ? error.name : "request error"}.`,
    });
  }
}

function attemptPath(protocol: AcquisitionProtocol): string {
  return `${protocol.attemptRoot}/attempt.json`;
}

function preflightScratchPath(protocol: AcquisitionProtocol): string {
  return `${protocol.attemptRoot}/preflight.json`;
}

function nasRunPath(protocol: AcquisitionProtocol): string {
  return `${protocol.attemptRoot}/nas-publication.json`;
}

function parseAttempt(repositoryRoot: string, protocol: AcquisitionProtocol): AttemptReport {
  const row = object(parseJson(read(repositoryRoot, attemptPath(protocol), "acquisition attempt"), "acquisition attempt"), "acquisition attempt");
  exactKeys(row, ["schema", "roundId", "attemptId", "freezeCommit", "command", "startedOn", "endedOn", "targets", "totalStagedBytes", "actualConcurrency", "retryCount"], "acquisition attempt");
  if (row.schema !== "phase10-b-acquisition-attempt-v1" || row.roundId !== protocol.roundId || row.attemptId !== protocol.attemptId || row.command !== protocol.commands.run || row.actualConcurrency !== 1 || row.retryCount !== 0) fail("acquisition attempt identity differs");
  if (!Array.isArray(row.targets) || row.targets.length !== 6) fail("acquisition attempt target roster differs");
  const targets = row.targets.map((value, index): AttemptTarget => {
    const target = object(value, `attempt target ${index}`);
    const frozen = protocol.targets[index]!;
    if (target.targetId !== frozen.targetId || target.attemptId !== frozen.attemptId || target.endpoint !== frozen.endpoint) fail(`attempt target ${index} differs from protocol`);
    return target as unknown as AttemptTarget;
  });
  return Object.freeze({
    schema: "phase10-b-acquisition-attempt-v1",
    roundId: protocol.roundId,
    attemptId: protocol.attemptId,
    freezeCommit: string(row.freezeCommit, "attempt freezeCommit"),
    command: protocol.commands.run,
    startedOn: string(row.startedOn, "attempt startedOn"),
    endedOn: string(row.endedOn, "attempt endedOn"),
    targets: Object.freeze(targets),
    totalStagedBytes: integer(row.totalStagedBytes, "attempt totalStagedBytes"),
    actualConcurrency: 1,
    retryCount: 0,
  });
}

async function runAcquisition(repositoryRoot: string, protocol: AcquisitionProtocol): Promise<StrictJson> {
  const history = assertRepository(repositoryRoot, true);
  const obligation = loadObligationPreflight(repositoryRoot).pass;
  const attemptAbsolute = safePath(repositoryRoot, protocol.attemptRoot, "attempt root");
  if (existsSync(attemptAbsolute)) fail("the single frozen acquisition attempt already exists; automatic retry is not authorized");
  for (const output of [protocol.acquisitionRoundPath, protocol.nasPublicationPath, protocol.verificationPath, protocol.preflightPath, protocol.terminalReceiptPath, protocol.candidateDirectory]) {
    if (existsSync(safePath(repositoryRoot, output, output))) fail(`registered B acquisition output already exists: ${output}`);
  }
  const fs = statfsSync(repositoryRoot);
  const freeBytes = fs.bavail * fs.bsize;
  if (!Number.isSafeInteger(freeBytes) || freeBytes < protocol.maximumCombinedBytes) fail("free disk is below the frozen 10 GiB staging/publication requirement");
  mkdirSync(safePath(repositoryRoot, dirname(protocol.attemptRoot), "attempt parent"), { recursive: true });
  mkdirSync(attemptAbsolute);
  mkdirSync(safePath(repositoryRoot, protocol.sourceRoot, "source root"));
  const preflight = buildPreflight(repositoryRoot, protocol, history, obligation, freeBytes);
  writeExclusive(repositoryRoot, preflightScratchPath(protocol), pretty(preflight));
  const startedOn = new Date().toISOString();
  const targets: AttemptTarget[] = [];
  let totalStagedBytes = 0;
  for (const target of protocol.targets) {
    const result = await attemptTarget(repositoryRoot, protocol, target);
    targets.push(result);
    totalStagedBytes += result.stagedFile?.byteLength ?? 0;
    if (totalStagedBytes > protocol.maximumCombinedBytes) fail("staged source bytes exceeded the frozen 10 GiB cap");
  }
  const report: AttemptReport = Object.freeze({
    schema: "phase10-b-acquisition-attempt-v1",
    roundId: protocol.roundId,
    attemptId: protocol.attemptId,
    freezeCommit: history.freezeCommit,
    command: protocol.commands.run,
    startedOn,
    endedOn: new Date().toISOString(),
    targets: Object.freeze(targets),
    totalStagedBytes,
    actualConcurrency: 1,
    retryCount: 0,
  });
  writeExclusive(repositoryRoot, attemptPath(protocol), pretty(report));
  return strictJsonSnapshot({
    packetId: "b-acquisition",
    attemptId: protocol.attemptId,
    targetCount: targets.length,
    stagedFileCount: targets.filter((target) => target.stagedFile !== null).length,
    totalStagedBytes,
    dispositions: targets.map((target) => ({ targetId: target.targetId, disposition: target.terminalDisposition })),
  });
}

function collectionIntent(repositoryRoot: string): { readonly catalogue: ReturnType<typeof parseNasAssetCatalogV1>; readonly collection: NasAssetCollectionV1 } {
  const catalogue = parseNasAssetCatalogV1(new TextDecoder("utf-8", { fatal: true }).decode(read(repositoryRoot, NAS_CATALOGUE_PATH, "NAS catalogue")));
  const collection = catalogue.collections.find((entry) => `${entry.assetId}@${entry.version}` === COLLECTION_ID);
  if (collection === undefined) fail("NAS catalogue omits the Phase 10 source-intake intent");
  return Object.freeze({ catalogue, collection });
}

function privateManifestBytes(inventory: NasTreeInventoryV1): Uint8Array {
  const rows = [
    { recordType: "header", format: PRIVATE_MANIFEST_FORMAT, identity: COLLECTION_ID, files: inventory.fileCount, bytes: inventory.totalBytes },
    ...inventory.files.map((file) => ({ recordType: "file", collection: COLLECTION_ID, storageClass: "private-source", path: file.path, bytes: file.byteLength, sha256: file.sha256 })),
  ];
  return new TextEncoder().encode(`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

function tupleFromNas(nasRoot: string, relativePath: string): StrictJson {
  const bytes = read(nasRoot, relativePath, relativePath);
  return strictJsonSnapshot({ path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function publishNas(repositoryRoot: string, protocol: AcquisitionProtocol): StrictJson {
  const history = assertRepository(repositoryRoot, false);
  loadObligationPreflight(repositoryRoot);
  const attempt = parseAttempt(repositoryRoot, protocol);
  if (attempt.freezeCommit !== history.freezeCommit) fail("attempt freezeCommit differs from the value-free protocol freeze");
  if (existsSync(safePath(repositoryRoot, nasRunPath(protocol), "NAS publication report"))) fail("NAS publication was already attempted; automatic repetition is not authorized");
  const staged = attempt.targets.filter((target) => target.stagedFile !== null);
  if (staged.length === 0) {
    const report = strictJsonSnapshot({
      schema: "phase10-b-acquisition-nas-run-v1",
      collectionId: COLLECTION_ID,
      state: "not-applicable-no-new-bytes",
      publicationReceipt: null,
      restoreReceipt: null,
      ownerManifest: null,
      inventory: [],
      activeCatalogueProjection: null,
      sourcePruneAuthorized: false,
    });
    writeExclusive(repositoryRoot, nasRunPath(protocol), pretty(report));
    return report;
  }
  const inventory = inventoryStableTree(safePath(repositoryRoot, protocol.sourceRoot, "source root"));
  if (inventory.fileCount !== staged.length || inventory.totalBytes !== attempt.totalStagedBytes) fail("staged payload inventory differs from the acquisition attempt");
  const { catalogue, collection } = collectionIntent(repositoryRoot);
  if (collection.state !== "provisional" || collection.aggregate.files !== 0 || collection.aggregate.bytes !== 0 || collection.ownerManifest !== null) fail("NAS collection is not the frozen zero-byte provisional intent");
  const nasRootDetected = detectNasMount(process.env);
  if (nasRootDetected === null) fail("governed NAS is detached");
  const nasRoot = realpathSync.native(resolve(nasRootDetected));
  const publication = publishCollectionFixture({
    shareRoot: nasRoot,
    sourceRoot: safePath(repositoryRoot, protocol.sourceRoot, "source root"),
    collection,
    catalogueCollections: catalogue.collections,
    transactionId: protocol.publicationTransactionId,
  });
  const ownerManifestRelative = `collections/phase10-source-intake/2026-08-21-v1/manifest.private.jsonl`;
  const ownerManifestAbsolute = safePath(nasRoot, ownerManifestRelative, "private owner manifest");
  const manifestBytes = privateManifestBytes(inventory);
  let descriptor: number | undefined;
  try {
    descriptor = openSync(ownerManifestAbsolute, "wx");
    writeFileSync(descriptor, manifestBytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    throw error;
  }
  mkdirSync(dirname(safePath(repositoryRoot, protocol.restoreRoot, "restore root")), { recursive: true });
  const restoration = restoreCollectionFixture({
    shareRoot: nasRoot,
    destinationPath: safePath(repositoryRoot, protocol.restoreRoot, "restore root"),
    collection,
    publicationReceiptPath: publication.publicationReceiptPath,
    transactionId: protocol.restoreTransactionId,
  });
  const publicationReceipt = tupleFromNas(nasRoot, publication.publicationReceiptPath);
  const restoreReceipt = tupleFromNas(nasRoot, restoration.restoreReceiptPath);
  const ownerManifest = tupleFromNas(nasRoot, ownerManifestRelative);
  const activeCatalogueProjection = strictJsonSnapshot({
    state: "active",
    aggregate: { files: inventory.fileCount, bytes: inventory.totalBytes },
    ownerManifest: {
      storage: "nas-private",
      ...(ownerManifest as JsonObject),
      format: PRIVATE_MANIFEST_FORMAT,
      selector: { kind: "jsonl-field-equals", recordType: "file", field: "collection", equals: COLLECTION_ID },
    },
    provenance: { record: "docs/plans/phase-10-evidence-verification-execution.md", producerCommit: history.freezeCommit, command: protocol.commands.run },
    restore: {
      status: "tested",
      command: `npm run assets:restore -- --collection ${COLLECTION_ID} --to ${protocol.restoreRoot}`,
      verifyCommand: `npm run assets:verify-restored -- --collection ${COLLECTION_ID} --from ${protocol.restoreRoot}`,
      record: restoration.restoreReceiptPath,
    },
    verification: {
      status: "full-hash",
      at: new Date().toISOString().slice(0, 10),
      host: process.platform === "win32" ? "Windows" : process.platform,
      receipt: publication.publicationReceiptPath,
      limits: ["The transaction receipts bind the complete private payload and one fresh restored copy; no local source prune is authorized."],
    },
    unresolved: [],
  });
  const report = strictJsonSnapshot({
    schema: "phase10-b-acquisition-nas-run-v1",
    collectionId: COLLECTION_ID,
    state: "published-and-restored",
    publicationReceipt,
    restoreReceipt,
    ownerManifest,
    inventory: inventory.files.map((file) => ({ relativePath: file.path, byteLength: file.byteLength, sha256: file.sha256 })),
    activeCatalogueProjection,
    sourcePruneAuthorized: false,
  });
  writeExclusive(repositoryRoot, nasRunPath(protocol), pretty(report));
  return report;
}

function parseNasRun(repositoryRoot: string, protocol: AcquisitionProtocol): JsonObject {
  const value = object(parseJson(read(repositoryRoot, nasRunPath(protocol), "NAS publication report"), "NAS publication report"), "NAS publication report");
  exactKeys(value, ["schema", "collectionId", "state", "publicationReceipt", "restoreReceipt", "ownerManifest", "inventory", "activeCatalogueProjection", "sourcePruneAuthorized"], "NAS publication report");
  if (value.schema !== "phase10-b-acquisition-nas-run-v1" || value.collectionId !== COLLECTION_ID || value.sourcePruneAuthorized !== false) fail("NAS publication report identity differs");
  return value;
}

function finalArtifacts(repositoryRoot: string, protocol: AcquisitionProtocol, attempt: AttemptReport, nasRun: JsonObject): { readonly round: StrictJson; readonly nas: StrictJson } {
  const manifest = nasRun.ownerManifest;
  const inventory = Array.isArray(nasRun.inventory) ? nasRun.inventory.map((value, index) => object(value, `NAS inventory row ${index}`)) : fail("NAS inventory is not an array");
  const byPath = new Map(inventory.map((row) => [string(row.relativePath, "NAS inventory relativePath"), row] as const));
  const targets = attempt.targets.map((attemptTarget, index) => {
    const frozen = protocol.targets[index]!;
    const staged = attemptTarget.stagedFile;
    let acquiredBinding: StrictJson = null;
    let terminalDisposition = attemptTarget.terminalDisposition as string;
    let reason = attemptTarget.reason;
    if (staged !== null) {
      if (nasRun.state !== "published-and-restored" || manifest === null) fail(`staged target ${frozen.targetId} lacks completed NAS publication`);
      const published = byPath.get(staged.relativePath);
      if (published === undefined || published.byteLength !== staged.byteLength || published.sha256 !== staged.sha256) fail(`staged target ${frozen.targetId} differs from published inventory`);
      acquiredBinding = strictJsonSnapshot({ collectionId: COLLECTION_ID, ownerManifest: manifest, relativePath: staged.relativePath, byteLength: staged.byteLength, sha256: staged.sha256 });
      terminalDisposition = "acquired-and-bound";
      reason = "The frozen official endpoint returned the complete media candidate, and the bytes were bound in the governed private NAS collection.";
    }
    return {
      schema: "phase10-acquisition-round-row-v1",
      targetId: frozen.targetId,
      attemptId: frozen.attemptId,
      freezeCommit: attempt.freezeCommit,
      startedOn: attemptTarget.startedOn,
      endedOn: attemptTarget.endedOn,
      endpoints: [frozen.endpoint],
      identityCandidates: [frozen.identity, frozen.persistentId].sort(lexical),
      acquiredBinding,
      terminalDisposition,
      reason,
    };
  });
  const terminalDisposition = targets.every((row) => row.terminalDisposition === "acquired-and-bound") ? "complete" : "refusal";
  const round = strictJsonSnapshot({
    schema: "phase10-acquisition-round-v1",
    roundId: protocol.roundId,
    freezeCommit: attempt.freezeCommit,
    targetRoster: protocol.targets.map((target) => target.targetId),
    targets,
    terminalDisposition,
    producer: {
      producerId: PRODUCER_ID,
      commit: attempt.freezeCommit,
      command: attempt.command,
      startedOn: attempt.startedOn,
      endedOn: attempt.endedOn,
      actualConcurrency: 1,
    },
  });
  const nas = nasRun.state === "published-and-restored"
    ? strictJsonSnapshot({
        schema: "phase10-nas-publication-disposition-v1",
        collectionId: COLLECTION_ID,
        state: "published-and-restored",
        publicationReceipt: nasRun.publicationReceipt,
        restoreReceipt: nasRun.restoreReceipt,
        ownerManifest: nasRun.ownerManifest,
        sourcePruneAuthorized: false,
        reason: "New lawful source bytes were published to the governed private collection, fully verified, and restored to a fresh local destination.",
      })
    : strictJsonSnapshot({
        schema: "phase10-nas-publication-disposition-v1",
        collectionId: COLLECTION_ID,
        state: "not-applicable-no-new-bytes",
        publicationReceipt: null,
        restoreReceipt: null,
        ownerManifest: null,
        sourcePruneAuthorized: false,
        reason: "The bounded acquisition round obtained no new lawful source bytes, so an empty NAS collection was not created.",
      });
  return Object.freeze({ round, nas });
}

/** Write the registered artifact-derived verification receipt from the independent evaluator. */
export function writePhase10BAcquisitionVerificationReceipt(options: Phase10BAcquisitionVerificationOptions): StrictJson {
  const startedOn = new Date().toISOString();
  const verification = phase10BAcquisitionVerify({ ...options, startedOn, endedOn: new Date().toISOString() });
  writeExclusive(realpathSync.native(resolve(options.repositoryRoot)), `${options.bundleDirectory}/acquisition-verification.json`, pretty(verification));
  return verification;
}

function finalize(repositoryRoot: string, protocol: AcquisitionProtocol): StrictJson {
  const history = assertRepository(repositoryRoot, false);
  const obligation = loadObligationPreflight(repositoryRoot);
  const attempt = parseAttempt(repositoryRoot, protocol);
  const nasRun = parseNasRun(repositoryRoot, protocol);
  if (attempt.freezeCommit !== history.freezeCommit) fail("attempt does not bind the frozen acquisition protocol");
  if (existsSync(safePath(repositoryRoot, protocol.candidateDirectory, "candidate directory"))) fail("candidate directory already exists; automatic repetition is not authorized");
  if (nasRun.state === "published-and-restored") {
    const { collection } = collectionIntent(repositoryRoot);
    if (collection.state !== "active") fail("published source bytes require the committed active NAS catalogue row before finalization");
  }
  const artifacts = finalArtifacts(repositoryRoot, protocol, attempt, nasRun);
  mkdirSync(safePath(repositoryRoot, protocol.candidateDirectory, "candidate directory"));
  writeExclusive(repositoryRoot, `${protocol.candidateDirectory}/acquisition-round.json`, pretty(artifacts.round));
  writeExclusive(repositoryRoot, `${protocol.candidateDirectory}/acquisition-nas-publication.json`, pretty(artifacts.nas));
  const calledChecks = phase10BAcquisitionCheckCaller();
  if (calledChecks.length !== CHECK_IDS.length || calledChecks.some((value, index) => value !== CHECK_IDS[index])) fail("B acquisition check caller roster differs");
  const verification = writePhase10BAcquisitionVerificationReceipt({
    repositoryRoot,
    bundleDirectory: protocol.candidateDirectory,
    command: protocol.commands.finalize,
    gitHead: history.head,
  });
  const verificationObject = object(verification, "B acquisition verification");
  const terminalState = string(verificationObject.terminalState, "verification terminalState");
  if (terminalState !== "complete" && terminalState !== "refusal") fail("verification terminalState differs");
  const terminal = strictJsonSnapshot({
    schema: "phase10-execution-receipt-v1",
    receiptId: `phase10-b-acquisition-${protocol.attemptId}-terminal-v1`,
    matrixId: obligation.pass.matrixId,
    protocolId: obligation.pass.protocolId,
    registryId: obligation.pass.registryId,
    packetId: "b-acquisition",
    terminalState,
    producedOutputIds: OUTPUT_IDS,
    executedCheckIds: CHECK_IDS,
    evaluatedCheckIds: CHECK_IDS,
    executedNegativeControlIds: [],
    boundDependencyPacketIds: DEPENDENCY_IDS,
  });
  phase10ObligationReceiptPreflight(obligation.matrix, obligation.packet, obligation.registry, terminal, repositoryRoot);
  const publications = [
    [protocol.acquisitionRoundPath, `${protocol.candidateDirectory}/acquisition-round.json`],
    [protocol.nasPublicationPath, `${protocol.candidateDirectory}/acquisition-nas-publication.json`],
    [protocol.verificationPath, `${protocol.candidateDirectory}/acquisition-verification.json`],
    [protocol.preflightPath, preflightScratchPath(protocol)],
  ] as const;
  for (const [destination, source] of publications) writeOrMatch(repositoryRoot, destination, read(repositoryRoot, source, source));
  writeOrMatch(repositoryRoot, protocol.terminalReceiptPath, pretty(terminal));
  return strictJsonSnapshot({
    packetId: "b-acquisition",
    terminalState,
    aggregateVerdict: verificationObject.aggregateVerdict,
    publishedOutputs: [protocol.nasPublicationPath, protocol.acquisitionRoundPath, protocol.verificationPath],
    publishedReceipts: [protocol.preflightPath, protocol.terminalReceiptPath],
  });
}

/** Execute exactly one of the three frozen stages for the finite six-target packet. */
export async function producePhase10BAcquisition(command: Command, repositoryRootInput = "."): Promise<StrictJson> {
  const repositoryRoot = realpathSync.native(resolve(repositoryRootInput));
  const protocol = loadAcquisitionProtocol(repositoryRoot);
  if (command === "run") return runAcquisition(repositoryRoot, protocol);
  if (command === "publish-nas") return publishNas(repositoryRoot, protocol);
  return finalize(repositoryRoot, protocol);
}

function parseArguments(argv: readonly string[]): { readonly command: Command; readonly repositoryRoot: string } {
  if (argv.length !== 3 || !["run", "publish-nas", "finalize"].includes(argv[0] ?? "") || argv[1] !== "--repository-root") {
    fail("usage: node runner/src/phase10-b-acquisition.ts run|publish-nas|finalize --repository-root <path>");
  }
  return Object.freeze({ command: argv[0] as Command, repositoryRoot: argv[2]! });
}

async function main(): Promise<void> {
  try {
    const args = parseArguments(process.argv.slice(2));
    console.log(JSON.stringify(await producePhase10BAcquisition(args.command, args.repositoryRoot)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
