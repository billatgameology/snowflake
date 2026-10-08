import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { batchGitHead, batchHostIdentity, batchMemoryFailure, launchDiscoveryRows,
  sampleBatchHost, writeBatchJson, type DiscoveryRowExit } from "./hil-bld-batch-execution.ts";
import { FIRST_BATCH_ID, FIRST_BATCH_PROBE_STEPS,
  FIRST_BATCH_PROBE_WALL_SECONDS, FIRST_BATCH_ROWS,
  FIRST_BATCH_WORKER_CEILINGS, firstBatchRepresentativeRows, firstBatchRows,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import { runPostPhase10DiscoveryRow, type DiscoveryRow, type DiscoveryTerminalResult } from "./post-phase10-discovery.ts";
import { summarizeFirstBatch, summarizeFirstBatchRow } from "./hil-bld-batch-summary.ts";
import { withDiscoveryLeaseUpdate } from "./discovery-resume-io.ts";

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
  if (!existsSync(resolve(directory, "resume", "latest.json"))) return false;
  try {
    const result = readJson<DiscoveryTerminalResult>(resolve(directory, "result.json"));
    const events = readFileSync(resolve(directory, "events.jsonl"), "utf8").trim().split(/\r?\n/)
      .map((line) => JSON.parse(line) as { cycle: number; relaxation?: { converged?: boolean }; surface?: { stalled?: boolean }; attachmentEventD6h?: boolean; symmetryError?: number });
    return result.rowId === exit.rowId && result.stopReason === "step-cap" && result.cycles === FIRST_BATCH_PROBE_STEPS &&
      result.integrityErrors.length === 0 && result.allRelaxationsConverged && result.allAttachmentEventsD6h &&
      result.symmetryError === 0 && Number.isFinite(result.peakRssBytes) && result.peakRssBytes > 0 &&
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
    limit: "Three-update exact-family prefixes only; not mature-geometry capacity, checkpoint continuation or scientific endpoints. Live memory monitoring remains required; scientific rows use checkpoints without a wall deadline." };
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

export interface FirstBatchCampaignReceipt {
  readonly schema: "hil-bld-first-batch-campaign-v2";
  readonly batchId: typeof FIRST_BATCH_ID;
  readonly checkpointFormat: "discovery-resume-v1";
  readonly host: FirstBatchHost;
  readonly gitHead: string;
  readonly node: string;
  readonly v8: string;
  readonly hostIdentity: ReturnType<typeof batchHostIdentity>;
  readonly rosterSha256: string;
  readonly probeReceiptSha256: string;
  readonly requestedConcurrency: number;
  readonly rows: readonly DiscoveryRow[];
}

/** Old non-resumable campaigns cannot silently acquire the new execution contract. */
export function validateFirstBatchCampaignReceipt(
  campaign: FirstBatchCampaignReceipt, host: FirstBatchHost, probeReceiptBytes: Buffer,
): number {
  const concurrency = validateFirstBatchProbeReceipt(
    JSON.parse(probeReceiptBytes.toString("utf8")) as FirstBatchProbeReceipt, host);
  if (campaign.schema !== "hil-bld-first-batch-campaign-v2" || campaign.batchId !== FIRST_BATCH_ID ||
    campaign.checkpointFormat !== "discovery-resume-v1" || campaign.host !== host) {
    throw new Error("campaign does not belong to this resumable batch and named host");
  }
  if (campaign.gitHead !== batchGitHead() || campaign.node !== process.version || campaign.v8 !== process.versions.v8 ||
    JSON.stringify(campaign.hostIdentity) !== JSON.stringify(batchHostIdentity()) ||
    campaign.rosterSha256 !== firstBatchRosterSha256(host) ||
    JSON.stringify(campaign.rows) !== JSON.stringify(firstBatchRows(host).map((entry) => entry.row)) ||
    campaign.probeReceiptSha256 !== sha256(probeReceiptBytes) || campaign.requestedConcurrency !== concurrency) {
    throw new Error("campaign source, runtime, host, rows or probe binding does not match this resume");
  }
  return concurrency;
}

function processIsAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error("invalid recorded process ID");
  try { process.kill(pid, 0); return true; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
    throw error; // An inaccessible process is not evidence that it has exited.
  }
}

/** One local coordinator per campaign. A dead owner can be replaced; live children still refuse below. */
export function acquireFirstBatchLease(directory: string): () => void {
  const path = resolve(directory, "campaign-owner.json");
  return withDiscoveryLeaseUpdate(path, () => {
    let recoveredOwner: unknown;
    if (existsSync(path)) {
      const previous = readJson<{ pid: number }>(path);
      if (processIsAlive(previous.pid)) throw new Error(`campaign coordinator is still running: ${previous.pid}`);
      recoveredOwner = previous;
      unlinkSync(path);
    }
    const token = randomUUID();
    const fd = openSync(path, "wx");
    try {
      writeFileSync(fd, JSON.stringify({ schema: "hil-bld-campaign-owner-v1", token, pid: process.pid,
        hostIdentity: batchHostIdentity(), createdAt: new Date().toISOString(),
        ...(recoveredOwner === undefined ? {} : { recoveredOwner }) }));
    } finally { closeSync(fd); }
    return () => withDiscoveryLeaseUpdate(path, () => {
      if (existsSync(path) && readJson<{ token: string }>(path).token === token) unlinkSync(path);
    });
  });
}

export interface FirstBatchResumeRow {
  readonly row: DiscoveryRow;
  readonly command: "run-row" | "resume-row";
}

/** Re-derive completed endpoints from persisted observations instead of trusting an exit alone. */
export function firstBatchRowIsComplete(directory: string, row: DiscoveryRow): boolean {
  if (!existsSync(resolve(directory, "result.json"))) return false;
  let result: DiscoveryTerminalResult;
  try {
    result = readJson<DiscoveryTerminalResult>(resolve(directory, "result.json"));
    if (result === null || typeof result !== "object" || result.schema !== "post-phase10-discovery-result-v1" ||
      typeof result.rowId !== "string" || typeof result.stopReason !== "string" ||
      !Number.isSafeInteger(result.cycles) || !Array.isArray(result.integrityErrors)) {
      throw new Error(`row ${row.id} has an incomplete terminal result`);
    }
  } catch (error) {
    // result.json is an observation written after the committed checkpoint. A killed write
    // must reach the checkpoint verifier, which preserves/rebuilds the uncommitted tail.
    if (existsSync(resolve(directory, "resume", "latest.json"))) return false;
    throw error;
  }
  if (result.stopReason === "solver-error" || result.stopReason === "unconverged") {
    throw new Error(`row ${row.id} has a scientific/solver failure requiring review before another attempt`);
  }
  if (!["size-target", "step-cap", "stalled"].includes(result.stopReason)) return false;
  let exit: DiscoveryRowExit | null = null;
  try {
    if (existsSync(resolve(directory, "exit.json"))) {
      exit = readJson<DiscoveryRowExit>(resolve(directory, "exit.json"));
      if (exit === null || typeof exit !== "object" ||
        (exit.exitCode !== null && !Number.isInteger(exit.exitCode)) ||
        (exit.signal !== null && typeof exit.signal !== "string")) {
        throw new Error(`row ${row.id} has an incomplete exit receipt`);
      }
    }
  } catch (error) {
    if (existsSync(resolve(directory, "resume", "latest.json"))) return false;
    throw error;
  }
  if (exit?.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined) return false;
  const summary = summarizeFirstBatchRow(directory);
  if (summary.errors.length > 0) throw new Error(`row ${row.id} has invalid completed evidence: ${summary.errors.join("; ")}`);
  if (result.gitHead !== batchGitHead() || result.node !== process.version || result.rowId !== row.id) {
    throw new Error(`row ${row.id} completed result source/runtime/identity mismatch`);
  }
  if (result.stopReason === "size-target") return summary.disposition === "size-endpoint";
  if (result.stopReason === "step-cap") return summary.completedUpdates === row.maxSteps;
  const lastLine = readFileSync(resolve(directory, "events.jsonl"), "utf8").trim().split(/\r?\n/).at(-1);
  return lastLine !== undefined && (JSON.parse(lastLine) as { surface?: { stalled?: boolean } }).surface?.stalled === true;
}

export function planFirstBatchResume(directory: string, rows: readonly DiscoveryRow[]): {
  readonly pending: readonly FirstBatchResumeRow[]; readonly skippedRowIds: readonly string[];
} {
  const pending: FirstBatchResumeRow[] = [];
  const skippedRowIds: string[] = [];
  for (const row of rows) {
    const rowDirectory = resolve(directory, "rows", row.id);
    if (!existsSync(rowDirectory)) { pending.push({ row, command: "run-row" }); continue; }
    const processPath = resolve(rowDirectory, "process.json");
    if (existsSync(processPath)) {
      const record = readJson<{ pid?: number | null }>(processPath);
      if (record.pid !== undefined && record.pid !== null && processIsAlive(record.pid)) {
        throw new Error(`row ${row.id} still has a live worker: ${record.pid}`);
      }
    }
    const specPath = resolve(rowDirectory, "spec.json");
    if (existsSync(specPath) && JSON.stringify(readJson<{ row: DiscoveryRow }>(specPath).row) !== JSON.stringify(row)) {
      throw new Error(`row ${row.id} persisted spec does not match the registered row`);
    }
    if (firstBatchRowIsComplete(rowDirectory, row)) { skippedRowIds.push(row.id); continue; }
    const checkpointPath = resolve(rowDirectory, "resume", "latest.json");
    const eventsPath = resolve(rowDirectory, "events.jsonl");
    if (!existsSync(checkpointPath) && (existsSync(resolve(rowDirectory, "result.json")) ||
      (existsSync(eventsPath) && readFileSync(eventsPath, "utf8").trim() !== ""))) {
      throw new Error(`row ${row.id} has scientific output but no committed resume checkpoint`);
    }
    // A bootstrap-only directory is handled by the row producer without inventing scientific state.
    pending.push({ row, command: "resume-row" });
  }
  return { pending, skippedRowIds };
}

async function launch(host: FirstBatchHost, output: string, probeReceiptPath: string, resuming = false): Promise<void> {
  requireCleanCheckpoint();
  const receiptPath = resolve(probeReceiptPath);
  const receiptBytes = readFileSync(receiptPath);
  const concurrency = validateFirstBatchProbeReceipt(JSON.parse(receiptBytes.toString("utf8")) as FirstBatchProbeReceipt, host);
  const directory = resuming ? resolve(output) : newDirectory(output);
  const entries = firstBatchRows(host);
  if (resuming) validateFirstBatchCampaignReceipt(
    readJson<FirstBatchCampaignReceipt>(resolve(directory, "campaign.json")), host, receiptBytes);
  const release = acquireFirstBatchLease(directory);
  try {
    if (!resuming) writeBatchJson(resolve(directory, "campaign.json"), { schema: "hil-bld-first-batch-campaign-v2",
      batchId: FIRST_BATCH_ID, checkpointFormat: "discovery-resume-v1", host, gitHead: batchGitHead(),
      node: process.version, v8: process.versions.v8,
      rosterSha256: firstBatchRosterSha256(host), probeReceiptPath: receiptPath,
      probeReceiptSha256: sha256(receiptBytes), requestedConcurrency: concurrency,
      rows: entries.map((entry) => entry.row), entries, exactLaunchCommand: process.argv,
      createdAt: new Date().toISOString(), hostIdentity: batchHostIdentity() });
    const selected = resuming ? planFirstBatchResume(directory, entries.map((entry) => entry.row))
      : { pending: entries.map(({ row }) => ({ row, command: "run-row" as const })), skippedRowIds: [] };
    const commands = new Map(selected.pending.map(({ row, command }) => [row.id, command]));
    const attemptName = resuming ? `resume-${Date.now()}-${randomUUID()}` : "initial";
    const launchName = `first-batch-${host}${resuming ? `-${attemptName}` : ""}`;
    writeBatchJson(resolve(directory, `${launchName}-invocation.json`), { host, attemptName,
      command: process.argv, skippedRowIds: selected.skippedRowIds,
      pending: selected.pending.map(({ row, command }) => ({ rowId: row.id, command })) });
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName,
      rows: selected.pending.map(({ row }) => row), concurrency, entryPath: ENTRY, attemptName,
      resumeExistingRows: resuming,
      workerArguments: (row, rowDirectory) => [commands.get(row.id)!, row.id, rowDirectory],
      stopOnWorkerFailure: false, monitor: { sample: sampleBatchHost } });
    const completionPath = resolve(directory, `${launchName}-complete.json`);
    const completion = readJson<{ abortReason: string | null }>(completionPath);
    if (completion.abortReason !== null || exits.length !== selected.pending.length ||
      exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) {
      process.exitCode = 2;
    }
    console.log(JSON.stringify({ campaign: directory, attemptName, completionPath,
      skippedRowIds: selected.skippedRowIds,
      summaryCommand: [process.execPath, ENTRY, "summarize", directory] }));
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
  if (command === "resume" && args.length === 3) return launch(parseFirstBatchHost(args[0]), args[1], args[2], true);
  if (command === "summarize" && args.length === 1) {
    console.log(JSON.stringify(summarizeFirstBatch(resolve(args[0])), null, 2));
    return;
  }
  if ((command === "run-row" || command === "resume-row" || command === "run-probe-row") && args.length === 2) {
    const probing = command === "run-probe-row";
    const sourceId = probing ? args[0].replace(/--probe-\d+$/, "") : args[0];
    if (probing && sourceId === args[0]) throw new Error("probe worker requires its indexed probe row ID");
    const entry = FIRST_BATCH_ROWS.find((candidate) => candidate.row.id === sourceId);
    if (entry === undefined) throw new Error(`unknown first-batch row: ${sourceId}`);
    const row = probing ? { ...entry.row, id: args[0], maxSteps: FIRST_BATCH_PROBE_STEPS } : entry.row;
    const result = runPostPhase10DiscoveryRow(row, args[1], {
      checkpoint: command === "resume-row" ? "resume" : "create",
      heartbeat: (message) => console.log(`${new Date().toISOString()} ${message}`),
    });
    if (result.stopReason === "solver-error" || result.stopReason === "unconverged" ||
      result.integrityErrors.length !== 0) process.exitCode = 1;
    return;
  }
  throw new Error("Usage: node runner/src/hil-bld-batch-main.ts list HIL|BLD | probe HIL|BLD <new-directory> | launch HIL|BLD <new-directory> <probe.json> | resume HIL|BLD <campaign-directory> <probe.json> | summarize <campaign-directory>");
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
