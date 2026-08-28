import { spawn, execFileSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { cpus, totalmem } from "node:os";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  POST_PHASE10_DISCOVERY_ROWS,
  POST_PHASE10_INITIAL_ROWS,
  POST_PHASE10_SMOKE_ROWS,
  discoveryA112Eligibility,
  postPhase10DiscoveryRow,
  readDiscoveryResult,
  runPostPhase10DiscoveryRow,
  type DiscoveryRow,
} from "./post-phase10-discovery.ts";
import { analyzePostPhase10Discovery } from "./post-phase10-discovery-analysis.ts";

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function git(args: readonly string[]): string {
  return execFileSync("git", [...args], { encoding: "utf8" }).trim();
}

function requireCleanTree(): void {
  const status = git(["status", "--short"]);
  if (status !== "") {
    throw new Error(
      "the discovery campaign must launch from a clean implementation checkpoint; " +
        "commit the runner and verification record first",
    );
  }
}

function parseConcurrency(raw: string | undefined, fallback: number): number {
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > 16) {
    throw new Error(`concurrency must be an integer in [1, 16], got ${String(raw)}`);
  }
  return value;
}

interface RowExit {
  readonly rowId: string;
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly wallSeconds: number;
}

async function launchRows(options: {
  readonly campaignDirectory: string;
  readonly launchName: string;
  readonly rows: readonly DiscoveryRow[];
  readonly concurrency: number;
}): Promise<readonly RowExit[]> {
  const entryPath = fileURLToPath(import.meta.url);
  const rowsRoot = resolve(options.campaignDirectory, "rows");
  mkdirSync(rowsRoot, { recursive: true });
  const launchPath = resolve(options.campaignDirectory, `${options.launchName}-launch.json`);
  if (existsSync(launchPath)) throw new Error(`launch record already exists: ${launchPath}`);

  const launchedAt = new Date();
  const head = git(["rev-parse", "HEAD"]);
  writeJson(launchPath, {
    schema: "post-phase10-discovery-launch-v1",
    launchName: options.launchName,
    gitHead: head,
    node: process.version,
    requestedConcurrency: options.concurrency,
    rowIds: options.rows.map((row) => row.id),
    exactWorkerCommandTemplate: [
      process.execPath,
      entryPath,
      "run-row",
      "<row-id>",
      "<absolute-row-directory>",
    ],
    launchedAt: launchedAt.toISOString(),
  });

  const exits: RowExit[] = [];
  let next = 0;
  let active = 0;
  let maxActive = 0;
  const runOne = async (row: DiscoveryRow): Promise<void> => {
    const rowDirectory = resolve(rowsRoot, row.id);
    if (existsSync(rowDirectory)) throw new Error(`row directory already exists: ${rowDirectory}`);
    mkdirSync(rowDirectory, { recursive: false });
    const args = [entryPath, "run-row", row.id, rowDirectory];
    const command = [process.execPath, ...args];
    writeJson(resolve(rowDirectory, "process.json"), {
      schema: "post-phase10-discovery-process-v1",
      rowId: row.id,
      gitHead: head,
      command,
    });
    const stdout = createWriteStream(resolve(rowDirectory, "stdout.log"), {
      flags: "wx",
      encoding: "utf8",
    });
    const stderr = createWriteStream(resolve(rowDirectory, "stderr.log"), {
      flags: "wx",
      encoding: "utf8",
    });
    const startedAt = new Date();
    active++;
    maxActive = Math.max(maxActive, active);
    console.log(
      `launch row=${row.id} active=${active} remaining=${options.rows.length - next}`,
    );
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.pipe(stdout);
    child.stderr.pipe(stderr);
    const completion = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
      (resolveCompletion) => {
        child.once("close", (code, signal) => resolveCompletion({ code, signal }));
      },
    );
    active--;
    const finishedAt = new Date();
    const exit: RowExit = {
      rowId: row.id,
      exitCode: completion.code,
      signal: completion.signal,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      wallSeconds: (finishedAt.getTime() - startedAt.getTime()) / 1000,
    };
    exits.push(exit);
    writeJson(resolve(rowDirectory, "exit.json"), {
      schema: "post-phase10-discovery-exit-v1",
      ...exit,
    });
    writeJson(resolve(options.campaignDirectory, `${options.launchName}-status.json`), {
      schema: "post-phase10-discovery-launch-status-v1",
      launchName: options.launchName,
      total: options.rows.length,
      completed: exits.length,
      active,
      maxActive,
      exits: [...exits].sort((a, b) => a.rowId.localeCompare(b.rowId)),
      updatedAt: new Date().toISOString(),
    });
    console.log(
      `finish row=${row.id} code=${String(completion.code)} signal=${String(completion.signal)} ` +
        `active=${active} completed=${exits.length}/${options.rows.length}`,
    );
  };

  const workers = Array.from(
    { length: Math.min(options.concurrency, options.rows.length) },
    async () => {
      while (true) {
        const index = next++;
        if (index >= options.rows.length) return;
        await runOne(options.rows[index]);
      }
    },
  );
  await Promise.all(workers);
  writeJson(resolve(options.campaignDirectory, `${options.launchName}-complete.json`), {
    schema: "post-phase10-discovery-launch-complete-v1",
    launchName: options.launchName,
    gitHead: head,
    node: process.version,
    requestedConcurrency: options.concurrency,
    actualMaximumConcurrency: maxActive,
    launchedAt: launchedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    exits: [...exits].sort((a, b) => a.rowId.localeCompare(b.rowId)),
  });
  return exits;
}

async function launchInitial(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-discovery-campaign-v1",
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    initialRowIds: POST_PHASE10_INITIAL_ROWS.map((row) => row.id),
    conditionalRowId: "a112",
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "initial",
    rows: POST_PHASE10_INITIAL_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) {
    process.exitCode = 1;
  }
}

async function launchA112(campaignDirectory: string): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  const a80 = readDiscoveryResult(resolve(output, "rows", "a80", "result.json"));
  const a96 = readDiscoveryResult(resolve(output, "rows", "a96", "result.json"));
  const currentHead = git(["rev-parse", "HEAD"]);
  const sameExecutionIdentity =
    a80.gitHead === a96.gitHead &&
    a80.gitHead === currentHead &&
    a80.node === a96.node &&
    a80.node === process.version;
  const scientific = discoveryA112Eligibility(a80, a96);
  const eligibility = sameExecutionIdentity
    ? scientific
    : {
        eligible: false,
        reason: "A80, A96, and the conditional launch do not share one Git head and Node runtime",
        attachedCountRelativeDifference: null,
      };
  const eligibilityPath = resolve(output, "a112-eligibility.json");
  if (existsSync(eligibilityPath)) {
    throw new Error(`A112 eligibility record already exists: ${eligibilityPath}`);
  }
  writeJson(eligibilityPath, {
    schema: "post-phase10-discovery-a112-eligibility-v1",
    sameExecutionIdentity,
    ...eligibility,
    evaluatedAt: new Date().toISOString(),
  });
  console.log(`A112 eligible=${eligibility.eligible} reason=${eligibility.reason}`);
  if (!eligibility.eligible) return;
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "a112",
    rows: [postPhase10DiscoveryRow("a112")],
    concurrency: 1,
  });
  if (exits[0]?.exitCode !== 0 || exits[0]?.signal !== null) process.exitCode = 1;
}

async function smoke(outputDirectory: string): Promise<void> {
  const output = resolve(outputDirectory);
  if (existsSync(output)) throw new Error(`smoke directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "smoke",
    rows: POST_PHASE10_SMOKE_ROWS,
    concurrency: 2,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "list":
      console.log(JSON.stringify(POST_PHASE10_DISCOVERY_ROWS, null, 2));
      return;
    case "run-row": {
      if (args.length !== 2) throw new Error("run-row wants <row-id> <output-directory>");
      const smokeRow = POST_PHASE10_SMOKE_ROWS.find((row) => row.id === args[0]);
      const selectedRow = smokeRow ?? postPhase10DiscoveryRow(args[0]);
      const result = runPostPhase10DiscoveryRow(selectedRow, args[1], {
        heartbeat: (message) => console.log(`${new Date().toISOString()} ${message}`),
      });
      if (result.stopReason === "solver-error") process.exitCode = 1;
      return;
    }
    case "launch-initial":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-initial wants <campaign-directory> [concurrency]");
      }
      await launchInitial(args[0], parseConcurrency(args[1], 12));
      return;
    case "launch-a112":
      if (args.length !== 1) throw new Error("launch-a112 wants <campaign-directory>");
      await launchA112(args[0]);
      return;
    case "smoke":
      if (args.length !== 1) throw new Error("smoke wants <output-directory>");
      await smoke(args[0]);
      return;
    case "analyze":
      if (args.length !== 2) {
        throw new Error("analyze wants <campaign-directory> <output-directory>");
      }
      analyzePostPhase10Discovery(args[0], args[1]);
      return;
    default:
      throw new Error(
        "usage: node runner/src/post-phase10-discovery-main.ts " +
          "list|run-row <row-id> <out>|launch-initial <campaign-dir> [concurrency]|" +
          "launch-a112 <campaign-dir>|smoke <out>|analyze <campaign-dir> <output-dir>",
      );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
