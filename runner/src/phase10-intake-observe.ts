import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseNasAssetCatalogV1 } from "../../scripts/nas-asset-lib.ts";
import { loadBoundCollectionSelection } from "../../scripts/nas-asset-selection-lib.ts";
import { detectNasMount } from "../../scripts/nas-root.ts";
import {
  assertBranchAndClean,
  assertObservationFreezeHead,
  loadIntakeAuthority,
  parseStrictJsonFile,
  readRegularFile,
  safeRepositoryPath,
} from "./phase10-intake-authority.ts";
import {
  PHASE10_AI_INTAKE_PROTOCOL_PATH,
  PHASE10_AI_OBSERVATIONS_PATH,
  PHASE10_AI_OBSERVATION_ATTEMPT,
  PHASE10_AI_PACKET_PROTOCOL_PATH,
  artifactTuple,
  parseIntakeObservations,
  parseTrackedIntakeFiles,
  prettyJsonBytes,
  sha256Bytes,
  type ArtifactTuple,
  type IntakeObservations,
  type QueryExecution,
} from "./phase10-intake-contracts.ts";

const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const AI_INTAKE_PROTOCOL_IDENTITY = Object.freeze({ path: "research/phase10-execution-v1/packets/a-i/intake-protocol.json", byteLength: 26443, sha256: "6adffffdbd02b7e023072f2e096909f43ee557b1fcd45e7a0d7f52107f36fe78" });
const EXPECTED_OBSERVATION_DATE = "2026-08-21";
const COLLECTION_ID = "post-phase9-intake@2026-08-13";

function fail(message: string): never {
  throw new Error(`Phase 10 A-I observation refused: ${message}`);
}

function physicalParent(repositoryRoot: string, target: string, label: string): void {
  let cursor = dirname(target);
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) fail(`${label} has no existing parent`);
    cursor = parent;
  }
  const rootReal = realpathSync.native(resolve(repositoryRoot));
  const cursorReal = realpathSync.native(cursor);
  const displacement = relative(rootReal, cursorReal);
  if (displacement === ".." || displacement.startsWith(`..${sep}`)) fail(`${label} parent resolves outside repository`);
}

function exactOptions(argv: readonly string[], names: readonly string[], label: string): Readonly<Record<string, string>> {
  if (argv.length !== names.length * 2) fail(`${label} has the wrong argument count`);
  const result: Record<string, string> = {};
  const allowed = new Set(names);
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--")) fail(`${label} has malformed arguments`);
    const name = flag.slice(2);
    if (!allowed.has(name) || Object.hasOwn(result, name)) fail(`${label} has unknown or duplicate ${flag}`);
    result[name] = value;
  }
  return Object.freeze(result);
}

function rawTuple(path: string, bytes: Uint8Array): ArtifactTuple {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) fail(`${label} keys differ`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function writeExactOrResume(target: string, bytes: Uint8Array, label: string): void {
  if (existsSync(target)) {
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !sameBytes(new Uint8Array(readFileSync(target)), bytes)) fail(`${label} existing bytes differ`);
    return;
  }
  writeFileSync(target, bytes, { flag: "wx" });
  if (!sameBytes(new Uint8Array(readFileSync(target)), bytes)) fail(`${label} readback differs`);
}

function base64Bytes(value: unknown, label: string): Uint8Array {
  if (typeof value !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) fail(`${label} is not canonical base64`);
  const bytes = new Uint8Array(Buffer.from(value, "base64"));
  if (Buffer.from(bytes).toString("base64") !== value) fail(`${label} is not canonical base64`);
  return bytes;
}

async function boundedResponse(response: Response): Promise<Uint8Array<ArrayBuffer>> {
  if (response.body === null) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      fail(`HTTP response exceeds ${MAX_RESPONSE_BYTES} bytes`);
    }
    chunks.push(next.value);
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function executeQuery(
  repositoryRoot: string,
  rawDirectoryRelative: string,
  checkpointDirectoryRelative: string,
  plan: { readonly queryId: string; readonly serviceId: string; readonly requestMethod: "GET" | "POST"; readonly requestBody: string | null; readonly endpoint: string; readonly query: string },
): Promise<QueryExecution> {
  const rawPath = `${rawDirectoryRelative}/${plan.queryId}.body`;
  const rawTarget = safeRepositoryPath(repositoryRoot, rawPath, `raw query response ${plan.queryId}`);
  const checkpointPath = `${checkpointDirectoryRelative}/${plan.queryId}.json`;
  const checkpointTarget = safeRepositoryPath(repositoryRoot, checkpointPath, `query checkpoint ${plan.queryId}`);
  if (existsSync(checkpointTarget)) {
    const checkpoint = object(parseStrictJsonFile(readRegularFile(repositoryRoot, checkpointPath, `query checkpoint ${plan.queryId}`), `query checkpoint ${plan.queryId}`), `query checkpoint ${plan.queryId}`);
    exactKeys(checkpoint, ["schema", "execution", "rawBodyBase64"], `query checkpoint ${plan.queryId}`);
    if (checkpoint.schema !== "phase10-ai-query-capture-v1") fail(`${plan.queryId} checkpoint schema differs`);
    const execution = object(checkpoint.execution, `${plan.queryId} checkpoint execution`);
    exactKeys(execution, ["queryId", "requestMethod", "requestBody", "endpoint", "query", "startedOn", "endedOn", "terminalState", "httpStatus", "responseUrl", "contentType", "rawResponse", "error"], `${plan.queryId} checkpoint execution`);
    if (execution.queryId !== plan.queryId || execution.requestMethod !== plan.requestMethod || execution.requestBody !== plan.requestBody || execution.endpoint !== plan.endpoint || execution.query !== plan.query) fail(`${plan.queryId} checkpoint request differs from the frozen plan`);
    const body = base64Bytes(checkpoint.rawBodyBase64, `${plan.queryId} checkpoint body`);
    const bound = artifactTuple(execution.rawResponse, `${plan.queryId} checkpoint raw response`);
    const expected = rawTuple(rawPath, body);
    if (bound.path !== expected.path || bound.byteLength !== expected.byteLength || bound.sha256 !== expected.sha256) fail(`${plan.queryId} checkpoint body identity differs`);
    writeExactOrResume(rawTarget, body, `${plan.queryId} raw response`);
    return Object.freeze(execution) as unknown as QueryExecution;
  }
  if (existsSync(rawTarget)) fail(`${plan.queryId} raw response exists without its atomic capture checkpoint`);
  const startedOn = new Date().toISOString();
  let bytes = new Uint8Array();
  try {
    const url = new URL(plan.endpoint);
    if (plan.requestMethod === "GET" && plan.query !== "GET exact DOI work record" && plan.query !== "GET exact DOI dataset record") url.search = plan.query;
    const accept = plan.serviceId === "arxiv-api" ? "application/atom+xml" : "application/json";
    const response = await fetch(url, {
      method: plan.requestMethod,
      body: plan.requestBody,
      headers: Object.freeze({ Accept: accept, ...(plan.requestMethod === "POST" ? { "Content-Type": "application/json" } : {}), "User-Agent": "snowflake-phase10-a-i/1.0 (finite source-currency observation)" }),
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    bytes = await boundedResponse(response);
    const execution = Object.freeze({
      queryId: plan.queryId,
      requestMethod: plan.requestMethod,
      requestBody: plan.requestBody,
      endpoint: plan.endpoint,
      query: plan.query,
      startedOn,
      endedOn: new Date().toISOString(),
      terminalState: "http-response",
      httpStatus: response.status,
      responseUrl: response.url,
      contentType: response.headers.get("content-type"),
      rawResponse: rawTuple(rawPath, bytes),
      error: null,
    });
    writeExactOrResume(checkpointTarget, prettyJsonBytes(Object.freeze({ schema: "phase10-ai-query-capture-v1", execution, rawBodyBase64: Buffer.from(bytes).toString("base64") })), `${plan.queryId} capture checkpoint`);
    writeExactOrResume(rawTarget, bytes, `${plan.queryId} raw response`);
    return execution;
  } catch (error) {
    const execution = Object.freeze({
      queryId: plan.queryId,
      requestMethod: plan.requestMethod,
      requestBody: plan.requestBody,
      endpoint: plan.endpoint,
      query: plan.query,
      startedOn,
      endedOn: new Date().toISOString(),
      terminalState: "network-refusal",
      httpStatus: null,
      responseUrl: null,
      contentType: null,
      rawResponse: rawTuple(rawPath, bytes),
      error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
    });
    writeExactOrResume(checkpointTarget, prettyJsonBytes(Object.freeze({ schema: "phase10-ai-query-capture-v1", execution, rawBodyBase64: Buffer.from(bytes).toString("base64") })), `${plan.queryId} refusal checkpoint`);
    writeExactOrResume(rawTarget, bytes, `${plan.queryId} refusal body`);
    return execution;
  }
}

function lastJsonLine(stdout: Uint8Array): unknown {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(stdout);
  const lines = source.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  const last = lines.at(-1);
  if (last === undefined) fail("NAS verifier emitted no report");
  try { return JSON.parse(last) as unknown; } catch { fail("NAS verifier final line is not JSON"); }
}

function nasObservation(
  repositoryRoot: string,
  rawDirectoryRelative: string,
  checkpointDirectoryRelative: string,
  trackedIntakePath: string,
  ownerManifest: ArtifactTuple,
  observedOn: string,
): IntakeObservations["existingNasVerification"] {
  const reportPath = `${rawDirectoryRelative}/nas-verification.json`;
  const reportTarget = safeRepositoryPath(repositoryRoot, reportPath, "NAS verification report");
  const checkpointPath = `${checkpointDirectoryRelative}/nas-observation.json`;
  const checkpointTarget = safeRepositoryPath(repositoryRoot, checkpointPath, "NAS observation checkpoint");
  if (existsSync(checkpointTarget)) {
    const checkpoint = object(parseStrictJsonFile(readRegularFile(repositoryRoot, checkpointPath, "NAS observation checkpoint"), "NAS observation checkpoint"), "NAS observation checkpoint");
    exactKeys(checkpoint, ["schema", "observation", "rawReportBase64"], "NAS observation checkpoint");
    if (checkpoint.schema !== "phase10-ai-nas-capture-v1") fail("NAS observation checkpoint schema differs");
    const reportBytes = base64Bytes(checkpoint.rawReportBase64, "NAS observation checkpoint report");
    const observation = object(checkpoint.observation, "NAS observation checkpoint observation");
    const attemptReport = artifactTuple(observation.attemptReport, "NAS observation checkpoint attemptReport");
    const expected = rawTuple(reportPath, reportBytes);
    if (attemptReport.path !== expected.path || attemptReport.byteLength !== expected.byteLength || attemptReport.sha256 !== expected.sha256) fail("NAS observation checkpoint report identity differs");
    writeExactOrResume(reportTarget, reportBytes, "NAS verification report");
    return Object.freeze(observation) as unknown as IntakeObservations["existingNasVerification"];
  }
  if (existsSync(reportTarget)) fail("NAS verification report exists without its atomic capture checkpoint");
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const execution = spawnSync(executable, ["run", "assets:verify", "--", "--collection", COLLECTION_ID, "--full"], {
    cwd: repositoryRoot,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  const stdout = execution.stdout instanceof Buffer ? new Uint8Array(execution.stdout) : new Uint8Array();
  let reportValue: unknown;
  try {
    reportValue = lastJsonLine(stdout);
  } catch (error) {
    reportValue = { format: "phase10-ai-nas-execution-refusal-v1", message: error instanceof Error ? error.message : String(error), exitStatus: execution.status };
  }
  const reportBytes = prettyJsonBytes(reportValue);
  const attemptReport = rawTuple(reportPath, reportBytes);
  const report = reportValue !== null && typeof reportValue === "object" && !Array.isArray(reportValue)
    ? reportValue as Record<string, unknown>
    : {};
  let verified = execution.status === 0 && report.ok === true && report.mount === "attached";
  let matchedTrackedTupleCount: 24 | null = null;
  let privateOnlyTupleCount: 2 | null = null;
  if (verified) {
    try {
      const catalogueSource = new TextDecoder("utf-8", { fatal: true }).decode(readRegularFile(repositoryRoot, "docs/nas-assets.json", "NAS catalogue"));
      const catalogue = parseNasAssetCatalogV1(catalogueSource);
      const mount = detectNasMount();
      if (mount === null) fail("NAS detached after full verification");
      const selection = loadBoundCollectionSelection({ catalogue, collection: COLLECTION_ID, repoRoot: repositoryRoot, shareRoot: mount });
      const tracked = parseTrackedIntakeFiles(parseStrictJsonFile(readRegularFile(repositoryRoot, trackedIntakePath, "tracked intake for NAS subset"), "tracked intake for NAS subset"));
      const selected = new Set(selection.files.map((entry) => `${entry.relativePath}\0${entry.bytes}\0${entry.sha256}`));
      if (selection.fileCount !== 26 || selection.totalBytes !== 165722101 || tracked.some((entry) => !selected.has(`${entry.path}\0${entry.byteLength}\0${entry.sha256}`))) fail("tracked 24-file tuple roster is not an exact subset of the 26-file collection selection");
      matchedTrackedTupleCount = 24;
      privateOnlyTupleCount = 2;
    } catch {
      verified = false;
    }
  }
  const observation = Object.freeze({
    state: verified ? "receipt-verified" : "unavailable-refusal",
    checkedOn: observedOn,
    collectionId: COLLECTION_ID,
    aggregateFiles: 26,
    aggregateBytes: 165722101,
    ownerManifest,
    matchedTrackedTupleCount,
    privateOnlyTupleCount,
    attemptReport,
    verificationReceipt: verified ? attemptReport : null,
    refusalReason: verified ? null : "The exact bounded NAS verification or 24-of-26 tuple-subset check did not pass; no storage claim was inherited.",
    restoreStatus: "pending",
    backupStatus: "required-missing",
  });
  writeExactOrResume(checkpointTarget, prettyJsonBytes(Object.freeze({ schema: "phase10-ai-nas-capture-v1", observation, rawReportBase64: Buffer.from(reportBytes).toString("base64") })), "NAS observation checkpoint");
  writeExactOrResume(reportTarget, reportBytes, "NAS verification report");
  return observation;
}

export async function observePhase10Intake(request: {
  readonly repositoryRoot: string;
  readonly packetProtocolPath: string;
  readonly rawAttemptPath: string;
  readonly outputPath: string;
}): Promise<IntakeObservations> {
  const root = resolve(request.repositoryRoot);
  if (request.packetProtocolPath !== PHASE10_AI_PACKET_PROTOCOL_PATH || request.rawAttemptPath !== PHASE10_AI_OBSERVATION_ATTEMPT || request.outputPath !== PHASE10_AI_OBSERVATIONS_PATH) fail("paths differ from the frozen observation command");
  assertBranchAndClean(root, [PHASE10_AI_OBSERVATIONS_PATH]);
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertObservationFreezeHead(authority);
  const attempt = safeRepositoryPath(root, request.rawAttemptPath, "A-I observation attempt");
  physicalParent(root, attempt, "A-I observation attempt");
  const ignored = spawnSync("git", ["check-ignore", "--quiet", request.rawAttemptPath], { cwd: root, windowsHide: true });
  if (ignored.status !== 0) fail("raw observation attempt is not ignored");
  const rawRelative = `${request.rawAttemptPath}/raw`;
  const checkpointRelative = `${request.rawAttemptPath}/checkpoints`;
  mkdirSync(safeRepositoryPath(root, rawRelative, "A-I raw observation directory"), { recursive: true });
  mkdirSync(safeRepositoryPath(root, checkpointRelative, "A-I observation checkpoint directory"), { recursive: true });
  const attemptStat = lstatSync(attempt);
  if (!attemptStat.isDirectory() || attemptStat.isSymbolicLink()) fail("observation attempt is not a non-symlink directory");
  const observedOn = new Date().toISOString().slice(0, 10);
  if (observedOn !== EXPECTED_OBSERVATION_DATE) fail(`observation date ${observedOn} is outside the frozen window`);
  const plans = authority.protocol.lineagePlan.flatMap((entry) => entry.queries).sort((left, right) => left.queryId < right.queryId ? -1 : left.queryId > right.queryId ? 1 : 0);
  const topAllowed = new Set(["raw", "checkpoints", "validation.json", "decision-validation.json"]);
  if (readdirSync(attempt).some((name) => !topAllowed.has(name))) fail("observation attempt contains an unknown entry");
  const rawAllowed = new Set([...plans.map((entry) => `${entry.queryId}.body`), "nas-verification.json"]);
  if (readdirSync(safeRepositoryPath(root, rawRelative, "A-I raw observation directory")).some((name) => !rawAllowed.has(name))) fail("raw observation directory contains an unknown entry");
  const checkpointAllowed = new Set([...plans.map((entry) => `${entry.queryId}.json`), "nas-observation.json"]);
  if (readdirSync(safeRepositoryPath(root, checkpointRelative, "A-I observation checkpoint directory")).some((name) => !checkpointAllowed.has(name))) fail("observation checkpoint directory contains an unknown entry");
  const queryExecutions: QueryExecution[] = [];
  for (const plan of plans) queryExecutions.push(await executeQuery(root, rawRelative, checkpointRelative, plan));
  const observations = parseIntakeObservations(Object.freeze({
    schema: "phase10-intake-observations-v1",
    observationId: "phase10-a-i-observations-20260821-v1",
    observedOn,
    queryExecutions: Object.freeze(queryExecutions),
    existingNasVerification: nasObservation(root, rawRelative, checkpointRelative, authority.protocol.trackedIntake.path, authority.protocol.existingOwnerManifest, observedOn),
    newNasCollection: Object.freeze({ state: "not-applicable-no-new-bytes", collectionId: "phase10-source-intake@2026-08-21-v1", receipt: null, sourcePruneAuthorized: false }),
  }), authority.protocol);
  const target = safeRepositoryPath(root, request.outputPath, "A-I observations output");
  physicalParent(root, target, "A-I observations output");
  writeExactOrResume(target, prettyJsonBytes(observations), "A-I observations output");
  return observations;
}

function main(argv: readonly string[]): Promise<void> {
  if (argv[0] !== "observe") fail("usage: observe --repository-root ROOT --protocol PROTOCOL --raw-out RAW --out OBSERVATIONS");
  const options = exactOptions(argv.slice(1), ["repository-root", "protocol", "raw-out", "out"], "A-I observe command");
  return observePhase10Intake({ repositoryRoot: options["repository-root"]!, packetProtocolPath: options.protocol!, rawAttemptPath: options["raw-out"]!, outputPath: options.out! }).then((result) => {
    process.stdout.write(`${JSON.stringify({ state: "observations-awaiting-independent-validation", queryCount: result.queryExecutions.length, nasState: result.existingNasVerification.state })}\n`);
  });
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
