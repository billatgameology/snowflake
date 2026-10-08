import { spawn, execFile, execFileSync, type ChildProcess } from "node:child_process";
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { arch, cpus, hostname, platform, totalmem } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { discoveryExperimentIdentity, type DiscoveryExperimentIdentity, type DiscoveryRow } from "./post-phase10-discovery.ts";

export function writeBatchJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function batchGitHead(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

export function batchHostIdentity() {
  return { hostname: hostname(), platform: platform(), arch: arch(),
    cpuModels: [...new Set(cpus().map((cpu) => cpu.model))], logicalProcessors: cpus().length,
    totalMemoryBytes: totalmem() };
}

export interface BatchHostSample {
  readonly capturedUtc: string;
  readonly availablePhysicalBytes: number;
  readonly commitHeadroomBytes: number;
  readonly children: readonly { Id: number; CPU: number | null; WorkingSet64: number; PeakWorkingSet64: number }[];
}

export const BATCH_MEMORY_LIMITS = Object.freeze({ availablePhysicalBytes: 12 * 1024 ** 3,
  commitHeadroomBytes: 8 * 1024 ** 3 });

export function batchMemoryFailure(sample: BatchHostSample): string | null {
  if (!Number.isFinite(sample.availablePhysicalBytes) || !Number.isFinite(sample.commitHeadroomBytes)) {
    return "invalid-host-memory-sample";
  }
  if (sample.availablePhysicalBytes < BATCH_MEMORY_LIMITS.availablePhysicalBytes) return "available-physical-memory-limit";
  if (sample.commitHeadroomBytes < BATCH_MEMORY_LIMITS.commitHeadroomBytes) return "commit-headroom-limit";
  return null;
}

const execFileAsync = promisify(execFile);

/** Same Windows counters used in the retained readiness benchmark; no process discovery or foreign kills. */
export async function sampleBatchHost(pids: readonly number[]): Promise<BatchHostSample> {
  if (platform() !== "win32") throw new Error("HIL/BLD host qualification currently requires Windows memory counters");
  if (pids.some((pid) => !Number.isSafeInteger(pid) || pid <= 0)) throw new Error("invalid owned child PID");
  const command = `
    $taskPids = @(${pids.join(",")});
    $taskProcesses = @();
    if ($taskPids.Count -gt 0) { $taskProcesses = @(Get-Process -Id $taskPids -ErrorAction SilentlyContinue | Select-Object Id,CPU,WorkingSet64,PeakWorkingSet64) };
    $taskCounters = (Get-Counter -Counter '\\Memory\\Available Bytes','\\Memory\\Committed Bytes','\\Memory\\Commit Limit' -ErrorAction Stop).CounterSamples;
    $taskAvailable = ($taskCounters | Where-Object { $_.Path -like '*\\memory\\available bytes' }).CookedValue;
    $taskCommitted = ($taskCounters | Where-Object { $_.Path -like '*\\memory\\committed bytes' }).CookedValue;
    $taskCommitLimit = ($taskCounters | Where-Object { $_.Path -like '*\\memory\\commit limit' }).CookedValue;
    [pscustomobject]@{ capturedUtc=(Get-Date).ToUniversalTime().ToString('o');
      availablePhysicalBytes=[uint64]$taskAvailable;
      commitHeadroomBytes=[uint64]$taskCommitLimit-[uint64]$taskCommitted;
      children=$taskProcesses } | ConvertTo-Json -Depth 4 -Compress;
  `;
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", command],
    { encoding: "utf8", windowsHide: true, timeout: 30_000 });
  const sample = JSON.parse(stdout) as BatchHostSample;
  if (!Array.isArray(sample.children) || batchMemoryFailure(sample) === "invalid-host-memory-sample") {
    throw new Error("Windows host sample is incomplete");
  }
  return sample;
}

export interface DiscoveryRowExit extends DiscoveryExperimentIdentity {
  readonly rowId: string;
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly wallSeconds: number;
  readonly termination?: "hard-wall-budget" | "resource-stop" | "batch-interrupted" | "spawn-error";
  readonly error?: string;
}

export interface DiscoveryLaunchOptions {
  readonly campaignDirectory: string;
  readonly launchName: string;
  readonly rows: readonly DiscoveryRow[];
  readonly concurrency: number;
  readonly experimentId?: DiscoveryExperimentIdentity["experimentId"];
  readonly entryPath?: string;
  readonly workerArguments?: (row: DiscoveryRow, directory: string) => readonly string[];
  /** Reuse row state while keeping each invocation in a distinct attempt log directory. */
  readonly resumeRows?: boolean;
  readonly pauseRequested?: () => boolean;
  readonly hardWallSeconds?: number;
  readonly stopOnWorkerFailure?: boolean;
  readonly monitor?: {
    readonly sample: (pids: readonly number[]) => Promise<BatchHostSample>;
    readonly cadenceMs?: number;
  };
}

/** Existing discovery queue, with optional bounds used only by the HIL/BLD batch. */
export async function launchDiscoveryRows(options: DiscoveryLaunchOptions): Promise<readonly DiscoveryRowExit[]> {
  if (!Number.isSafeInteger(options.concurrency) || options.concurrency < 1) throw new Error("invalid concurrency");
  if (options.hardWallSeconds !== undefined && (!Number.isFinite(options.hardWallSeconds) || options.hardWallSeconds <= 0)) {
    throw new Error("hardWallSeconds must be finite and positive");
  }
  if (new Set(options.rows.map((row) => row.id)).size !== options.rows.length) throw new Error("duplicate launch row IDs");
  const entryPath = options.entryPath ?? fileURLToPath(new URL("./post-phase10-discovery-main.ts", import.meta.url));
  const rowsRoot = resolve(options.campaignDirectory, "rows");
  mkdirSync(rowsRoot, { recursive: true });
  const launchPath = resolve(options.campaignDirectory, `${options.launchName}-launch.json`);
  if (existsSync(launchPath)) throw new Error(`launch record already exists: ${launchPath}`);
  for (const row of options.rows) {
    if (!options.resumeRows && existsSync(resolve(rowsRoot, row.id))) throw new Error(`row directory already exists: ${resolve(rowsRoot, row.id)}`);
  }
  const launchedAt = new Date();
  const head = batchGitHead();
  const experimentalRows = options.rows.filter((row) => row.experimentalFacetDips !== undefined ||
    row.experimentalHoleFilling !== undefined || row.experimentalBasalWidthCells !== undefined);
  const experimentIds = [...new Set(experimentalRows.map((row) => discoveryExperimentIdentity(row).experimentId))];
  const experimentMetadata = experimentalRows.length === 0 ? {} : {
    ...(options.experimentId !== undefined ? { experimentId: options.experimentId } :
      experimentIds.length === 1 ? { experimentId: experimentIds[0] } : {}),
    experimentalRows: experimentalRows.map((row) => ({ rowId: row.id, ...discoveryExperimentIdentity(row) })),
  };
  writeBatchJson(launchPath, { schema: "post-phase10-discovery-launch-v1", ...experimentMetadata,
    launchName: options.launchName, gitHead: head, node: process.version,
    requestedConcurrency: options.concurrency, rowIds: options.rows.map((row) => row.id),
    exactWorkerCommandTemplate: options.workerArguments === undefined
      ? [process.execPath, entryPath, "run-row", "<row-id>", "<absolute-row-directory>"]
      : "Exact row-specific command is recorded in each rows/<row-id>/process.json",
    ...(options.hardWallSeconds === undefined ? {} : { hardWallSeconds: options.hardWallSeconds }),
    launchedAt: launchedAt.toISOString() });

  const exits: DiscoveryRowExit[] = [];
  const children = new Map<ChildProcess, { termination?: DiscoveryRowExit["termination"] }>();
  let next = 0;
  let active = 0;
  let maxActive = 0;
  let abortReason: string | null = null;
  let minimumAvailablePhysicalBytes: number | null = null;
  let minimumCommitHeadroomBytes: number | null = null;
  let maxSampledChildRssBytes = 0;
  let finished = false;
  const stop = (reason: string, termination: DiscoveryRowExit["termination"]): void => {
    if (abortReason === null || abortReason === "operator-pause") abortReason = reason;
    for (const [child, state] of children) { state.termination ??= termination; child.kill(); }
  };
  const writeStatus = (): void => writeBatchJson(resolve(options.campaignDirectory, options.launchName + "-status.json"), {
    schema: "post-phase10-discovery-launch-status-v1", ...experimentMetadata, launchName: options.launchName,
    total: options.rows.length, completed: exits.length, active, maxActive,
    exits: [...exits].sort((a, b) => a.rowId.localeCompare(b.rowId)), updatedAt: new Date().toISOString(), abortReason,
  });
  const onInterrupt = (): void => stop("batch-interrupted", "batch-interrupted");
  const onExit = (): void => { for (const child of children.keys()) child.kill(); };
  // New bounded routes own cleanup. Preserve legacy process lifecycle otherwise.
  const bounded = options.monitor !== undefined || options.hardWallSeconds !== undefined || options.pauseRequested !== undefined;
  const checkPause = (): boolean => {
    if (options.pauseRequested?.()) abortReason ??= "operator-pause";
    return abortReason === "operator-pause";
  };
  if (bounded) { process.on("SIGINT", onInterrupt); process.on("SIGTERM", onInterrupt); process.on("exit", onExit); }
  const recordSample = async (): Promise<void> => {
    if (options.monitor === undefined) return;
    try {
      const sample = await options.monitor.sample([...children.keys()].flatMap((child) => child.pid === undefined ? [] : [child.pid]));
      appendFileSync(resolve(options.campaignDirectory, `${options.launchName}-resources.jsonl`), `${JSON.stringify(sample)}\n`);
      minimumAvailablePhysicalBytes = Math.min(minimumAvailablePhysicalBytes ?? Infinity, sample.availablePhysicalBytes);
      minimumCommitHeadroomBytes = Math.min(minimumCommitHeadroomBytes ?? Infinity, sample.commitHeadroomBytes);
      for (const child of sample.children) maxSampledChildRssBytes = Math.max(maxSampledChildRssBytes, child.PeakWorkingSet64, child.WorkingSet64);
      const failure = batchMemoryFailure(sample);
      if (failure !== null) stop(failure, "resource-stop");
    } catch (error) { stop(`host-monitor-failure: ${error instanceof Error ? error.message : String(error)}`, "resource-stop"); }
  };
  checkPause();
  if (abortReason === null) await recordSample();
  const monitorLoop = options.monitor === undefined && options.pauseRequested === undefined ? Promise.resolve() : (async () => {
    while (!finished && (abortReason === null || abortReason === "operator-pause")) {
      await new Promise<void>((done) => setTimeout(done, options.monitor?.cadenceMs ?? 2000));
      if (!finished) { checkPause(); await recordSample(); }
    }
  })();

  const runOne = async (row: DiscoveryRow): Promise<void> => {
    const identity = discoveryExperimentIdentity(row);
    const directory = resolve(rowsRoot, row.id);
    mkdirSync(directory, { recursive: options.resumeRows ?? false });
    const logDirectory = options.resumeRows ? resolve(directory, "attempts", options.launchName) : directory;
    if (options.resumeRows) mkdirSync(logDirectory, { recursive: true });
    const args = [entryPath, ...(options.workerArguments?.(row, directory) ?? ["run-row", row.id, directory])];
    const processRecord = { schema: "post-phase10-discovery-process-v1", ...identity,
      rowId: row.id, gitHead: head, command: [process.execPath, ...args] };
    writeBatchJson(resolve(logDirectory, "process.json"), processRecord);
    const stdoutFd = openSync(resolve(logDirectory, "stdout.log"), "wx");
    const stderrFd = openSync(resolve(logDirectory, "stderr.log"), "wx");
    const startedAt = new Date();
    active++;
    maxActive = Math.max(maxActive, active);
    console.log(`launch row=${row.id} active=${active} remaining=${Math.max(0, options.rows.length - next)}`);
    const child = spawn(process.execPath, args, { cwd: process.cwd(), windowsHide: true, stdio: ["ignore", stdoutFd, stderrFd] });
    closeSync(stdoutFd); closeSync(stderrFd);
    const liveProcessRecord = { ...processRecord, pid: child.pid ?? null, startedAt: startedAt.toISOString(), logDirectory };
    writeBatchJson(resolve(logDirectory, "process.json"), liveProcessRecord);
    if (options.resumeRows) writeBatchJson(resolve(directory, "process.json"), liveProcessRecord);
    const state: { termination?: DiscoveryRowExit["termination"]; error?: string } = {};
    children.set(child, state);
    writeStatus();
    const timer = options.hardWallSeconds === undefined ? undefined : setTimeout(() => {
      state.termination = "hard-wall-budget";
      child.kill();
    }, options.hardWallSeconds * 1000);
    const completion = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((done) => {
      child.once("error", (error) => { state.termination = "spawn-error"; state.error = error.message; });
      child.once("close", (code, signal) => done({ code, signal }));
    });
    if (timer !== undefined) clearTimeout(timer);
    children.delete(child);
    active--;
    const finishedAt = new Date();
    const exit: DiscoveryRowExit = { ...identity, rowId: row.id, exitCode: completion.code, signal: completion.signal,
      startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(),
      wallSeconds: (finishedAt.getTime() - startedAt.getTime()) / 1000,
      ...(state.termination === undefined ? {} : { termination: state.termination }),
      ...(state.error === undefined ? {} : { error: state.error }) };
    exits.push(exit);
    writeBatchJson(resolve(logDirectory, "exit.json"), { schema: "post-phase10-discovery-exit-v1", ...exit });
    if (options.resumeRows) writeBatchJson(resolve(directory, "exit.json"), { schema: "post-phase10-discovery-exit-v1", ...exit });
    if (options.stopOnWorkerFailure && (exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) {
      stop(`worker-failure:${row.id}`, "batch-interrupted");
    }
    writeBatchJson(resolve(options.campaignDirectory, `${options.launchName}-status.json`), {
      schema: "post-phase10-discovery-launch-status-v1", ...experimentMetadata, launchName: options.launchName,
      total: options.rows.length, completed: exits.length, active, maxActive,
      exits: [...exits].sort((a, b) => a.rowId.localeCompare(b.rowId)), updatedAt: new Date().toISOString(),
      ...(bounded ? { abortReason } : {}) });
    console.log(`finish row=${row.id} code=${String(exit.exitCode)} signal=${String(exit.signal)} active=${active} completed=${exits.length}/${options.rows.length}`);
  };
  try {
    const settlements = await Promise.allSettled(Array.from({ length: Math.min(options.concurrency, options.rows.length) }, async () => {
      while (abortReason === null) {
        if (checkPause()) return;
        const index = next++;
        if (index >= options.rows.length) return;
        try { await runOne(options.rows[index]); }
        catch (error) { stop(`launch-error: ${error instanceof Error ? error.message : String(error)}`, "batch-interrupted"); throw error; }
      }
    }));
    const failure = settlements.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  } finally {
    finished = true;
    await monitorLoop;
    if (bounded) { process.off("SIGINT", onInterrupt); process.off("SIGTERM", onInterrupt); process.off("exit", onExit); }
    writeBatchJson(resolve(options.campaignDirectory, `${options.launchName}-complete.json`), {
      schema: "post-phase10-discovery-launch-complete-v1", ...experimentMetadata,
      launchName: options.launchName, gitHead: head, node: process.version,
      requestedConcurrency: options.concurrency, actualMaximumConcurrency: maxActive,
      launchedAt: launchedAt.toISOString(), finishedAt: new Date().toISOString(),
      exits: [...exits].sort((a, b) => a.rowId.localeCompare(b.rowId)),
      ...(bounded ? { abortReason, unstartedRowIds: options.rows.filter((row) => !exits.some((exit) => exit.rowId === row.id)).map((row) => row.id),
        minimumAvailablePhysicalBytes, minimumCommitHeadroomBytes, maxSampledChildRssBytes } : {}) });
  }
  return exits;
}
