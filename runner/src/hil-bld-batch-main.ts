import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { batchGitHead, batchHostIdentity, batchMemoryFailure, launchDiscoveryRows,
  sampleBatchHost, writeBatchJson, type DiscoveryRowExit } from "./hil-bld-batch-execution.ts";
import { FIRST_BATCH_ID, FIRST_BATCH_KILL_GRACE_SECONDS, FIRST_BATCH_PROBE_STEPS,
  FIRST_BATCH_PROBE_WALL_SECONDS, FIRST_BATCH_ROWS, FIRST_BATCH_WALL_SECONDS,
  FIRST_BATCH_WORKER_CEILINGS, firstBatchRepresentativeRows, firstBatchRows,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import { runPostPhase10DiscoveryRow, type DiscoveryRow, type DiscoveryTerminalResult } from "./post-phase10-discovery.ts";
import { summarizeFirstBatch } from "./hil-bld-batch-summary.ts";
import { readResumableDiscoveryStatus, runResumableDiscoveryRow } from "./post-phase10-discovery-resume.ts";

const ENTRY = fileURLToPath(import.meta.url);
const sha256 = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

export function parseFirstBatchHost(value: string): FirstBatchHost {
  if (value !== "HIL" && value !== "BLD") throw new Error("host must be HIL or BLD");
  return value;
}

export function firstBatchRosterSha256(host: FirstBatchHost): string {
  return sha256(JSON.stringify(firstBatchRows(host)));
}

function requireCleanCheckpoint(): void {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() !== "") {
    throw new Error("Commit the tested implementation before host qualification or campaign launch");
  }
}

function newDirectory(path: string): string {
  const directory = resolve(path);
  if (existsSync(directory)) throw new Error(`output directory already exists: ${directory}`);
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function firstBatchProbeRows(host: FirstBatchHost, concurrency: number): readonly DiscoveryRow[] {
  const representatives = firstBatchRepresentativeRows(host);
  return Array.from({ length: Math.max(concurrency, representatives.length) }, (_, index) => ({
    ...representatives[index % representatives.length].row,
    id: `${representatives[index % representatives.length].row.id}--probe-${index}`,
    maxSteps: FIRST_BATCH_PROBE_STEPS,
  }));
}

interface ProbeRung {
  readonly concurrency: number;
  readonly qualified: boolean;
  readonly directory: string;
  readonly actualMaximumConcurrency: number;
  readonly wallSeconds: number;
  readonly rowsPerSecond: number | null;
  readonly abortReason: string | null;
  readonly minimumAvailablePhysicalBytes: number | null;
  readonly minimumCommitHeadroomBytes: number | null;
  readonly maxSampledChildRssBytes: number;
  readonly rowIds: readonly string[];
}

export interface FirstBatchProbeReceipt {
  readonly schema: "hil-bld-first-batch-probe-v1";
  readonly batchId: typeof FIRST_BATCH_ID;
  readonly host: FirstBatchHost;
  readonly gitHead: string;
  readonly node: string;
  readonly v8: string;
  readonly hostIdentity: ReturnType<typeof batchHostIdentity>;
  readonly rosterSha256: string;
  readonly recommendedConcurrency: number | null;
  readonly rungs: readonly ProbeRung[];
  readonly limit: string;
}

export function validateFirstBatchProbeReceipt(receipt: FirstBatchProbeReceipt, host: FirstBatchHost): number {
  if (receipt.schema !== "hil-bld-first-batch-probe-v1" || receipt.batchId !== FIRST_BATCH_ID || receipt.host !== host) {
    throw new Error("probe receipt belongs to a different batch or named host");
  }
  if (receipt.gitHead !== batchGitHead() || receipt.node !== process.version || receipt.v8 !== process.versions.v8 ||
    receipt.rosterSha256 !== firstBatchRosterSha256(host) ||
    JSON.stringify(receipt.hostIdentity) !== JSON.stringify(batchHostIdentity())) {
    throw new Error("probe source, runtime, host or workload does not match this launch; run this host's probe again");
  }
  const concurrency = receipt.recommendedConcurrency;
  if (concurrency === null || !Number.isSafeInteger(concurrency) || concurrency < 1 ||
    concurrency > FIRST_BATCH_WORKER_CEILINGS[host] || !Array.isArray(receipt.rungs) ||
    !receipt.rungs.some((rung) => rung.qualified && rung.concurrency === concurrency &&
      rung.actualMaximumConcurrency === concurrency && rung.abortReason === null &&
      rung.minimumAvailablePhysicalBytes !== null && rung.minimumCommitHeadroomBytes !== null &&
      batchMemoryFailure({ capturedUtc: "receipt", availablePhysicalBytes: rung.minimumAvailablePhysicalBytes,
        commitHeadroomBytes: rung.minimumCommitHeadroomBytes, children: [] }) === null)) {
    throw new Error("probe receipt has no completed safe worker count");
  }
  return concurrency;
}

/** Operational prefixes must contain the registered number of real completed updates. */
export function completedProbePrefix(directory: string, exit: DiscoveryRowExit): boolean {
  if (exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined) return false;
  try {
    const result = existsSync(resolve(directory, "result.json")) ? readJson<DiscoveryTerminalResult>(resolve(directory, "result.json")) : null;
    const resumeStatus = result === null ? readResumableDiscoveryStatus(directory) : null;
    const events = readFileSync(resolve(directory, "events.jsonl"), "utf8").trim().split(/\r?\n/)
      .map((line) => JSON.parse(line) as { cycle: number; relaxation?: { converged?: boolean }; surface?: { stalled?: boolean }; attachmentEventD6h?: boolean; symmetryError?: number });
    return ((result !== null && result.rowId === exit.rowId && result.stopReason === "step-cap" && result.cycles === FIRST_BATCH_PROBE_STEPS &&
      result.integrityErrors.length === 0 && result.allRelaxationsConverged && result.allAttachmentEventsD6h &&
      result.symmetryError === 0 && Number.isFinite(result.peakRssBytes) && result.peakRssBytes > 0) ||
      (resumeStatus?.state === "paused" && resumeStatus.reason === "step-review" && resumeStatus.cycle === FIRST_BATCH_PROBE_STEPS)) &&
      events.length === FIRST_BATCH_PROBE_STEPS && events.every((event, index) => event.cycle === index + 1 &&
        event.relaxation?.converged === true && event.surface !== null && event.surface !== undefined &&
        event.surface.stalled === false && event.attachmentEventD6h === true && event.symmetryError === 0);
  } catch { return false; }
}

async function probe(host: FirstBatchHost, output: string): Promise<void> {
  requireCleanCheckpoint();
  const directory = newDirectory(output);
  const base = { schema: "hil-bld-first-batch-probe-v1" as const, batchId: FIRST_BATCH_ID, host,
    gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
    hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256(host),
    limit: "Three-update exact-family prefixes only; not mature-geometry capacity, checkpoint continuation or scientific endpoints. Live memory monitoring remains required; BLD writes every-update restart state and HIL uses four-hour terminal stages." };
  const ladder = host === "HIL" ? [1, 4, 8, 16] : [1, 4, 8, 16, 28];
  writeBatchJson(resolve(directory, "invocation.json"), { ...base, exactCommand: process.argv, ladder,
    representatives: firstBatchRepresentativeRows(host), probeSteps: FIRST_BATCH_PROBE_STEPS,
    childWallSeconds: FIRST_BATCH_PROBE_WALL_SECONDS, startedAt: new Date().toISOString() });
  const rungs: ProbeRung[] = [];
  for (const concurrency of ladder) {
    const rungDirectory = newDirectory(resolve(directory, `concurrency-${concurrency}`));
    const rows = firstBatchProbeRows(host, concurrency);
    const exits = await launchDiscoveryRows({ campaignDirectory: rungDirectory, launchName: "probe", rows, concurrency,
      entryPath: ENTRY, workerArguments: (row, rowDirectory) => ["run-probe-row", row.id, rowDirectory],
      hardWallSeconds: FIRST_BATCH_PROBE_WALL_SECONDS, stopOnWorkerFailure: true,
      monitor: { sample: sampleBatchHost } });
    const completion = readJson<{ actualMaximumConcurrency: number; abortReason: string | null;
      minimumAvailablePhysicalBytes: number | null; minimumCommitHeadroomBytes: number | null;
      maxSampledChildRssBytes: number; launchedAt: string }>(resolve(rungDirectory, "probe-complete.json"));
    const qualified = completion.abortReason === null && completion.actualMaximumConcurrency === concurrency &&
      exits.length === rows.length && exits.every((exit) => completedProbePrefix(resolve(rungDirectory, "rows", exit.rowId), exit));
    const wallSeconds = exits.length === 0 ? 0 :
      (Math.max(...exits.map((exit) => Date.parse(exit.finishedAt))) - Date.parse(completion.launchedAt)) / 1000;
    rungs.push({ concurrency, qualified, directory: rungDirectory, ...completion,
      wallSeconds, rowsPerSecond: qualified && wallSeconds > 0 ? exits.length / wallSeconds : null,
      rowIds: rows.map((row) => row.id) });
    writeBatchJson(resolve(directory, "probe.json"), { ...base, rungs,
      recommendedConcurrency: rungs.filter((rung) => rung.qualified).at(-1)?.concurrency ?? null });
    console.log(JSON.stringify({ host, concurrency, qualified, receipt: resolve(directory, "probe.json") }));
    if (!qualified) break;
  }
  if (!rungs.some((rung) => rung.qualified)) process.exitCode = 2;
}

async function launch(host: FirstBatchHost, output: string, probeReceiptPath: string): Promise<void> {
  requireCleanCheckpoint();
  const receiptPath = resolve(probeReceiptPath);
  const receiptBytes = readFileSync(receiptPath);
  const concurrency = validateFirstBatchProbeReceipt(JSON.parse(receiptBytes.toString("utf8")) as FirstBatchProbeReceipt, host);
  const directory = newDirectory(output);
  const entries = firstBatchRows(host);
  writeBatchJson(resolve(directory, "campaign.json"), { schema: host === "BLD" ? "hil-bld-first-batch-campaign-v2" : "hil-bld-first-batch-campaign-v1",
    batchId: FIRST_BATCH_ID, host, gitHead: batchGitHead(), node: process.version,
    rosterSha256: firstBatchRosterSha256(host), probeReceiptPath: receiptPath,
    probeReceiptSha256: sha256(receiptBytes), requestedConcurrency: concurrency,
    rows: entries.map((entry) => entry.row), entries, exactLaunchCommand: process.argv,
    createdAt: new Date().toISOString(), hostIdentity: batchHostIdentity(),
    ...(host === "BLD" ? { executionMode: "bld-experimental-resume-v1", v8: process.versions.v8,
      maxWallSeconds: null, checkpointCadence: "initial-and-every-completed-update", stepBudgetMeaning: "resumable-review-pause" }
      : { maxWallSeconds: FIRST_BATCH_WALL_SECONDS }) });
  if (host === "BLD") return continueBldCampaign(directory, false);
  const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: `first-batch-${host}`,
    rows: entries.map((entry) => entry.row), concurrency, entryPath: ENTRY,
    hardWallSeconds: FIRST_BATCH_WALL_SECONDS + FIRST_BATCH_KILL_GRACE_SECONDS,
    stopOnWorkerFailure: false, monitor: { sample: sampleBatchHost } });
  const completion = readJson<{ abortReason: string | null }>(resolve(directory, `first-batch-${host}-complete.json`));
  if (completion.abortReason !== null || exits.length !== entries.length ||
    exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) {
    process.exitCode = 2;
  }
  console.log(JSON.stringify({ campaign: directory, summaryCommand: [process.execPath, ENTRY, "summarize", directory] }));
}


/** Local accidental-double-launch guard; it is not an authentication boundary. */
export function batchProcessAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error("invalid recorded process ID");
  try { process.kill(pid, 0); return true; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
    throw error;
  }
}

export function acquireBldCampaignLock(directory: string): () => void {
  const lockPath = resolve(directory, "active-launch.json");
  if (existsSync(lockPath)) {
    const previous = readJson<{ pid: number }>(lockPath);
    if (batchProcessAlive(previous.pid)) throw new Error("BLD campaign is already running; pause it before resume");
  }
  // A parent can die while a child is finishing its current coupled update.
  const rowsPath = resolve(directory, "rows");
  if (existsSync(rowsPath)) for (const row of readdirSync(rowsPath, { withFileTypes: true })) {
    if (!row.isDirectory()) continue;
    const processPath = resolve(rowsPath, row.name, "process.json");
    if (!existsSync(processPath)) continue;
    const worker = readJson<{ pid?: number; logDirectory?: string }>(processPath);
    if (worker.pid !== undefined && worker.pid !== null && worker.logDirectory !== undefined &&
        !existsSync(resolve(worker.logDirectory, "exit.json")) && batchProcessAlive(worker.pid)) {
      throw new Error("BLD worker still running: " + row.name + "; request pause and wait for its checkpoint");
    }
  }
  if (existsSync(lockPath)) renameSync(lockPath, resolve(directory, "stale-launch-" + Date.now() + ".json"));
  const fd = openSync(lockPath, "wx");
  try {
    writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), command: process.argv }) + "\n");
    fsyncSync(fd);
  } finally { closeSync(fd); }
  return () => { unlinkSync(lockPath); };
}

interface ResumableBldCampaign {
  schema: "hil-bld-first-batch-campaign-v2";
  executionMode: "bld-experimental-resume-v1";
  host: "BLD";
  batchId: string;
  gitHead: string;
  node: string;
  v8: string;
  rosterSha256: string;
  requestedConcurrency: number;
  hostIdentity: ReturnType<typeof batchHostIdentity>;
  rows: DiscoveryRow[];
}

export function validateResumableBldCampaign(campaign: ResumableBldCampaign): void {
  if (campaign.schema !== "hil-bld-first-batch-campaign-v2" ||
      campaign.executionMode !== "bld-experimental-resume-v1" || campaign.host !== "BLD" ||
      campaign.batchId !== FIRST_BATCH_ID) throw new Error("not a resumable BLD campaign; legacy prefixes have no restart state");
  if (campaign.gitHead !== batchGitHead() || campaign.node !== process.version ||
      campaign.v8 !== process.versions.v8 || campaign.rosterSha256 !== firstBatchRosterSha256("BLD") ||
      JSON.stringify(campaign.hostIdentity) !== JSON.stringify(batchHostIdentity()) ||
      JSON.stringify(campaign.rows) !== JSON.stringify(firstBatchRows("BLD").map((entry) => entry.row))) {
    throw new Error("resumable campaign source, runtime, host or registered rows changed");
  }
  if (!Number.isSafeInteger(campaign.requestedConcurrency) || campaign.requestedConcurrency < 1 ||
      campaign.requestedConcurrency > FIRST_BATCH_WORKER_CEILINGS.BLD) throw new Error("invalid BLD concurrency");
}

export function requestBldPause(output: string): void {
  const directory = resolve(output);
  const campaign = readJson<ResumableBldCampaign>(resolve(directory, "campaign.json"));
  if (campaign.schema !== "hil-bld-first-batch-campaign-v2" || campaign.host !== "BLD" ||
      campaign.executionMode !== "bld-experimental-resume-v1") throw new Error("not a resumable BLD campaign");
  writeBatchJson(resolve(directory, "pause-request.json"), {
    requestedAt: new Date().toISOString(), reason: "operator-pause", command: process.argv,
  });
  console.log("Pause requested: no new rows; active rows save after their current coupled update.");
}

async function continueBldCampaign(directory: string, resuming: boolean): Promise<void> {
  requireCleanCheckpoint();
  const campaign = readJson<ResumableBldCampaign>(resolve(directory, "campaign.json"));
  validateResumableBldCampaign(campaign);
  const release = acquireBldCampaignLock(directory);
  try {
    const pauseFile = resolve(directory, "pause-request.json");
    if (resuming && existsSync(pauseFile)) {
      renameSync(pauseFile, resolve(directory, "pause-request-consumed-" + Date.now() + ".json"));
    }
    const previousAttempts = readdirSync(directory).filter((name) => /^attempt-\d+-launch\.json$/.test(name));
    const attemptNumber = previousAttempts.reduce((max, name) => Math.max(max, Number(name.split("-")[1])), 0) + 1;
    const launchName = "attempt-" + String(attemptNumber).padStart(4, "0");
    const rows = campaign.rows.filter((row) =>
      readResumableDiscoveryStatus(resolve(directory, "rows", row.id))?.state !== "terminal");
    const exits = await launchDiscoveryRows({
      campaignDirectory: directory, launchName, rows, concurrency: campaign.requestedConcurrency,
      entryPath: ENTRY, resumeRows: true,
      workerArguments: (row, rowDirectory) => ["run-resumable-row", row.id, rowDirectory, pauseFile],
      pauseRequested: () => existsSync(pauseFile), stopOnWorkerFailure: false,
      monitor: { sample: sampleBatchHost },
    });
    const completion = readJson<{ abortReason: string | null }>(resolve(directory, launchName + "-complete.json"));
    const states = campaign.rows.map((row) => ({
      rowId: row.id, status: readResumableDiscoveryStatus(resolve(directory, "rows", row.id)),
    }));
    writeBatchJson(resolve(directory, "campaign-status.json"), {
      schema: "hil-bld-resumable-campaign-status-v1", launchName, updatedAt: new Date().toISOString(),
      state: states.every((row) => row.status?.state === "terminal") ? "terminal" : "paused",
      abortReason: completion.abortReason, rows: states,
    });
    if ((completion.abortReason !== null && completion.abortReason !== "operator-pause") ||
        exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) process.exitCode = 2;
    console.log(JSON.stringify({ campaign: directory, launchName, resumeCommand: [process.execPath, ENTRY, "resume", directory] }));
  } finally { release(); }
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "list" && args.length === 1) {
    const host = parseFirstBatchHost(args[0]);
    console.log(JSON.stringify({ batchId: FIRST_BATCH_ID, host, workerCeiling: FIRST_BATCH_WORKER_CEILINGS[host],
      rosterSha256: firstBatchRosterSha256(host), entries: firstBatchRows(host) }, null, 2));
    return;
  }
  if (command === "probe" && args.length === 2) return probe(parseFirstBatchHost(args[0]), args[1]);
  if (command === "launch" && args.length === 3) return launch(parseFirstBatchHost(args[0]), args[1], args[2]);
  if (command === "pause" && args.length === 1) return requestBldPause(args[0]);
  if (command === "resume" && args.length === 1) return continueBldCampaign(resolve(args[0]), true);
  if (command === "run-resumable-row" && args.length === 3) {
    const entry = firstBatchRows("BLD").find((entry) => entry.row.id === args[0]);
    if (entry === undefined) throw new Error("unknown resumable BLD row");
    const outcome = await runResumableDiscoveryRow(entry.row, args[1], { pauseFile: args[2],
      heartbeat: (message) => console.log(new Date().toISOString() + " " + message) });
    if (outcome.state === "terminal" && (outcome.result.stopReason === "solver-error" ||
        outcome.result.stopReason === "unconverged" || outcome.result.integrityErrors.length !== 0)) process.exitCode = 1;
    return;
  }
  if (command === "summarize" && args.length === 1) {
    console.log(JSON.stringify(summarizeFirstBatch(resolve(args[0])), null, 2));
    return;
  }
  if ((command === "run-row" || command === "run-probe-row") && args.length === 2) {
    const probing = command === "run-probe-row";
    const sourceId = probing ? args[0].replace(/--probe-\d+$/, "") : args[0];
    if (probing && sourceId === args[0]) throw new Error("probe worker requires its indexed probe row ID");
    const entry = FIRST_BATCH_ROWS.find((candidate) => candidate.row.id === sourceId);
    if (entry === undefined) throw new Error(`unknown first-batch row: ${sourceId}`);
    const row = probing ? { ...entry.row, id: args[0], maxSteps: FIRST_BATCH_PROBE_STEPS } : entry.row;
    if (entry.host === "BLD") {
      const outcome = await runResumableDiscoveryRow(row, args[1], {
        heartbeat: (message) => console.log(new Date().toISOString() + " " + message) });
      if (outcome.state === "terminal" && (outcome.result.stopReason === "solver-error" ||
          outcome.result.stopReason === "unconverged" || outcome.result.integrityErrors.length !== 0)) process.exitCode = 1;
      return;
    }
    const result = runPostPhase10DiscoveryRow(row, args[1], {
      maxWallSeconds: probing ? FIRST_BATCH_PROBE_WALL_SECONDS : FIRST_BATCH_WALL_SECONDS,
      heartbeat: (message) => console.log(`${new Date().toISOString()} ${message}`),
    });
    if (result.stopReason === "solver-error" || result.stopReason === "unconverged" ||
      result.integrityErrors.length !== 0) process.exitCode = 1;
    return;
  }
  throw new Error("Usage: node runner/src/hil-bld-batch-main.ts list HIL|BLD | probe HIL|BLD <new-directory> | launch HIL|BLD <new-directory> <probe.json> | pause <BLD-campaign> | resume <BLD-campaign> | summarize <campaign-directory>");
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
