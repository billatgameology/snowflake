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
  DISCOVERY_FACET_EXPERIMENT_ID,
  DISCOVERY_HOLEFILL_EXPERIMENT_ID,
  DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID,
  DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID,
  discoveryExperimentIdentity,
  type DiscoveryExperimentIdentity,
  type DiscoveryRow,
} from "./post-phase10-discovery.ts";
import { analyzePostPhase10Discovery } from "./post-phase10-discovery-analysis.ts";
import {
  ADAPTIVE_FRACTIONS,
  ADAPTIVE_INTERACTION_FRACTIONS,
  ADAPTIVE_INTERACTION_TEMPERATURES_C,
  ADAPTIVE_TEMPERATURES_C,
  POST_PHASE10_ADAPTIVE_ROWS,
  POST_PHASE10_ADAPTIVE_SMOKE_ROWS,
  findPostPhase10AdaptiveRow,
} from "./post-phase10-adaptive.ts";
import {
  POST_PHASE10_LONG_DIMS_N,
  POST_PHASE10_LONG_ROWS,
  POST_PHASE10_LONG_TARGET_EXTENT,
  findPostPhase10LongRow,
} from "./post-phase10-long.ts";
import {
  POST_PHASE10_CONFIRM_ROWS,
  findPostPhase10ConfirmationRow,
} from "./post-phase10-confirm.ts";
import {
  POST_PHASE10_FOLLOWUP_ROWS,
  POST_PHASE10_FOLLOWUP_ROW_COUNT,
  findPostPhase10FollowupRow,
} from "./post-phase10-followup.ts";
import {
  POST_PHASE10_CAVITY_ROWS,
  findPostPhase10CavityRow,
} from "./post-phase10-cavity.ts";
import {
  POST_PHASE10_FACET_FACTORIAL_ROWS,
  POST_PHASE10_FACET_REUSED_CONTROLS,
  findPostPhase10FacetFactorialRow,
  POST_PHASE10_FACET_FACTORIAL_LONG_ROWS,
  POST_PHASE10_FACET_LONG_REUSED_CONTROLS,
  findPostPhase10FacetFactorialLongRow,
} from "./post-phase10-facet-factorial.ts";
import {
  POST_PHASE10_HOLEFILL_ROWS,
  POST_PHASE10_HOLEFILL_REUSED_CONTROLS,
  findPostPhase10HolefillRow,
  POST_PHASE10_HOLEFILL_LONG_ROWS,
  POST_PHASE10_HOLEFILL_LONG_REUSED_CONTROLS,
  findPostPhase10HolefillLongRow,
  POST_PHASE10_PRISM_HOLEFILL_ROWS,
  POST_PHASE10_PRISM_HOLEFILL_REUSED_CONTROLS,
  findPostPhase10PrismHolefillRow,
} from "./post-phase10-holefill.ts";
import {
  POST_PHASE10_BASAL_WIDTH_ROWS,
  POST_PHASE10_BASAL_WIDTH_REUSED_CONTROLS,
  findPostPhase10BasalWidthRow,
} from "./post-phase10-basal-width.ts";

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
  if (!Number.isSafeInteger(value) || value < 1 || value > 28) {
    throw new Error(`concurrency must be an integer in [1, 28], got ${String(raw)}`);
  }
  return value;
}

interface RowExit extends DiscoveryExperimentIdentity {
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
  const experimentalRows = options.rows.filter((row) =>
    row.experimentalFacetDips !== undefined || row.experimentalHoleFilling !== undefined ||
    row.experimentalBasalWidthCells !== undefined);
  const experimentMetadata = experimentalRows.length === 0 ? {} : {
    experimentId: discoveryExperimentIdentity(experimentalRows[0]).experimentId,
    experimentalRows: experimentalRows.map((row) => ({ rowId: row.id, ...discoveryExperimentIdentity(row) })),
  };
  writeJson(launchPath, {
    schema: "post-phase10-discovery-launch-v1",
    ...experimentMetadata,
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
    const experimentIdentity = discoveryExperimentIdentity(row);
    const experimentLabel = experimentIdentity.experimentId === undefined ? "" :
      ` experimentId=${experimentIdentity.experimentId}` +
      (row.experimentalFacetDips === undefined ? "" : ` experimentalFacetDips=${row.experimentalFacetDips}`) +
      (row.experimentalHoleFilling === undefined ? "" : ` experimentalHoleFilling=${row.experimentalHoleFilling}`) +
      (row.experimentalBasalWidthCells === undefined ? "" : ` experimentalBasalWidthCells=${row.experimentalBasalWidthCells}`);
    const rowDirectory = resolve(rowsRoot, row.id);
    if (existsSync(rowDirectory)) throw new Error(`row directory already exists: ${rowDirectory}`);
    mkdirSync(rowDirectory, { recursive: false });
    const args = [entryPath, "run-row", row.id, rowDirectory];
    const command = [process.execPath, ...args];
    writeJson(resolve(rowDirectory, "process.json"), {
      schema: "post-phase10-discovery-process-v1",
      ...experimentIdentity,
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
      `launch row=${row.id}${experimentLabel} active=${active} remaining=${options.rows.length - next}`,
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
      ...experimentIdentity,
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
      ...experimentMetadata,
      launchName: options.launchName,
      total: options.rows.length,
      completed: exits.length,
      active,
      maxActive,
      exits: [...exits].sort((a, b) => a.rowId.localeCompare(b.rowId)),
      updatedAt: new Date().toISOString(),
    });
    console.log(
      `finish row=${row.id}${experimentLabel} code=${String(completion.code)} signal=${String(completion.signal)} ` +
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
    ...experimentMetadata,
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

async function launchAdaptive(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-adaptive-campaign-v1",
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    rowCount: POST_PHASE10_ADAPTIVE_ROWS.length,
    laneCounts: {
      map: POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-map").length,
      pressure: POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-pressure").length,
      seed: POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-seed").length,
    },
    temperaturesC: ADAPTIVE_TEMPERATURES_C,
    fractions: ADAPTIVE_FRACTIONS,
    interactionTemperaturesC: ADAPTIVE_INTERACTION_TEMPERATURES_C,
    interactionFractions: ADAPTIVE_INTERACTION_FRACTIONS,
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "first-tranche",
    rows: POST_PHASE10_ADAPTIVE_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function smokeAdaptive(outputDirectory: string): Promise<void> {
  const output = resolve(outputDirectory);
  if (existsSync(output)) throw new Error(`smoke directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "adaptive-smoke",
    rows: POST_PHASE10_ADAPTIVE_SMOKE_ROWS,
    concurrency: 2,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchLong(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-long-campaign-v1",
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    rowCount: POST_PHASE10_LONG_ROWS.length,
    dimsN: POST_PHASE10_LONG_DIMS_N,
    targetExtent: POST_PHASE10_LONG_TARGET_EXTENT,
    cflFill: 0.1,
    laneCounts: {
      map: POST_PHASE10_LONG_ROWS.filter((row) => row.lane === "long-map").length,
      pressure: POST_PHASE10_LONG_ROWS.filter((row) => row.lane === "long-pressure").length,
      seed: POST_PHASE10_LONG_ROWS.filter((row) => row.lane === "long-seed").length,
    },
    sourcePilotHead: "0e55b7b4b925ac80d05e0d9c60479c7edd920764",
    sourcePilotDirectory: "out/post-phase10-adaptive/campaign-2026-08-28",
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "long-wave-1",
    rows: POST_PHASE10_LONG_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchConfirmation(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-confirmation-campaign-v1",
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    rowCount: POST_PHASE10_CONFIRM_ROWS.length,
    laneCounts: {
      seed: POST_PHASE10_CONFIRM_ROWS.filter((row) => row.lane === "confirm-seed").length,
      pressure: POST_PHASE10_CONFIRM_ROWS.filter((row) => row.lane === "confirm-pressure").length,
      map: POST_PHASE10_CONFIRM_ROWS.filter((row) => row.lane === "confirm-map").length,
    },
    dimsN: 64,
    targetExtent: 29,
    sourceLongWaveHead: "df757992a46569638f253926ee50d62601c28e3e",
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "confirmation-wave-1",
    rows: POST_PHASE10_CONFIRM_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchFollowup(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-followup-campaign-v1",
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    rowCount: POST_PHASE10_FOLLOWUP_ROW_COUNT,
    laneCounts: {
      seedTimestep: POST_PHASE10_FOLLOWUP_ROWS.filter(
        (row) => row.lane === "followup-seed-timestep",
      ).length,
      seedForcing: POST_PHASE10_FOLLOWUP_ROWS.filter(
        (row) => row.lane === "followup-seed-forcing",
      ).length,
      seedLocalization: POST_PHASE10_FOLLOWUP_ROWS.filter(
        (row) => row.lane === "followup-seed-localization",
      ).length,
      mixedTimestep: POST_PHASE10_FOLLOWUP_ROWS.filter(
        (row) => row.lane === "followup-mixed-timestep",
      ).length,
      larger: POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-larger").length,
      history: POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-history").length,
    },
    dimsN: [64, 80],
    targetExtents: [29, 37],
    cflFill: [0.05, 0.1],
    timelineTriggerLargestExtent: 11,
    sourceConfirmationHead: "cb33534e8b50199f394cfc4be028c92ffbd6972a",
    sourceConfirmationDirectory:
      "out/post-phase10-confirmation/campaign-2026-09-02-wave1",
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "followup-wave-2",
    rows: POST_PHASE10_FOLLOWUP_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchCavity(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-cavity-campaign-v1",
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_CAVITY_ROWS.length),
    rowCount: POST_PHASE10_CAVITY_ROWS.length,
    totalLatticeCells: POST_PHASE10_CAVITY_ROWS.reduce((sum, row) => sum + row.dimsN ** 3, 0),
    rows: POST_PHASE10_CAVITY_ROWS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Scientific review and resumed cavity experiment — 2026-09-08",
    sourcePlanCommit: "b439e38338abc90b640a77f469cb969d38408366",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "cavity-wave-1",
    rows: POST_PHASE10_CAVITY_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchFacetFactorial(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-facet-factorial-campaign-v1",
    experimentId: DISCOVERY_FACET_EXPERIMENT_ID,
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_FACET_FACTORIAL_ROWS.length),
    rowCount: POST_PHASE10_FACET_FACTORIAL_ROWS.length,
    rows: POST_PHASE10_FACET_FACTORIAL_ROWS,
    reusedControls: POST_PHASE10_FACET_REUSED_CONTROLS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Bounded overlapping facet-isolation experiment — 2026-09-09",
    sourcePlanCommit: "9caf69079b5dd76f74257c11f9be83fa4733748a",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "facet-factorial-wave-1",
    rows: POST_PHASE10_FACET_FACTORIAL_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchHolefill(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-holefill-campaign-v1",
    experimentId: DISCOVERY_HOLEFILL_EXPERIMENT_ID,
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_HOLEFILL_ROWS.length),
    rowCount: POST_PHASE10_HOLEFILL_ROWS.length,
    rows: POST_PHASE10_HOLEFILL_ROWS,
    reusedControls: POST_PHASE10_HOLEFILL_REUSED_CONTROLS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Geometric closure hypothesis — retained-event finding, 2026-09-09",
    sourcePlanCommit: "9b8939ee765c12fcc629980187ec929aa16d4998",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "holefill-wave-1",
    rows: POST_PHASE10_HOLEFILL_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchFacetFactorialLong(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-facet-factorial-campaign-v1",
    experimentId: DISCOVERY_FACET_EXPERIMENT_ID,
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_FACET_FACTORIAL_LONG_ROWS.length),
    rowCount: POST_PHASE10_FACET_FACTORIAL_LONG_ROWS.length,
    rows: POST_PHASE10_FACET_FACTORIAL_LONG_ROWS,
    reusedControls: POST_PHASE10_FACET_LONG_REUSED_CONTROLS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Completed mechanism comparisons and selected longer evaluation — 2026-09-09",
    sourcePlanCommit: "60e6468b17e0200be2795fa3098697c84a65c3d6",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "facet-factorial-long-wave-1",
    rows: POST_PHASE10_FACET_FACTORIAL_LONG_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchHolefillLong(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-holefill-campaign-v1",
    experimentId: DISCOVERY_HOLEFILL_EXPERIMENT_ID,
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_HOLEFILL_LONG_ROWS.length),
    rowCount: POST_PHASE10_HOLEFILL_LONG_ROWS.length,
    rows: POST_PHASE10_HOLEFILL_LONG_ROWS,
    reusedControls: POST_PHASE10_HOLEFILL_LONG_REUSED_CONTROLS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Completed mechanism comparisons and selected longer evaluation — 2026-09-09",
    sourcePlanCommit: "60e6468b17e0200be2795fa3098697c84a65c3d6",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "holefill-long-wave-1",
    rows: POST_PHASE10_HOLEFILL_LONG_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchPrismHolefill(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-prism-holefill-campaign-v1",
    experimentId: DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID,
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_PRISM_HOLEFILL_ROWS.length),
    rowCount: POST_PHASE10_PRISM_HOLEFILL_ROWS.length,
    rows: POST_PHASE10_PRISM_HOLEFILL_ROWS,
    reusedControls: POST_PHASE10_PRISM_HOLEFILL_REUSED_CONTROLS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Completed colder longer comparisons and selected interaction — 2026-09-10",
    sourcePlanCommit: "9b8a59d46e0572aed30b790f9ed46d47e5be1897",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({
    campaignDirectory: output,
    launchName: "prism-holefill-wave-1",
    rows: POST_PHASE10_PRISM_HOLEFILL_ROWS,
    concurrency,
  });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function launchBasalWidth(campaignDirectory: string, concurrency: number): Promise<void> {
  requireCleanTree();
  const output = resolve(campaignDirectory);
  if (existsSync(output)) throw new Error(`campaign directory already exists: ${output}`);
  mkdirSync(output, { recursive: true });
  const processors = cpus();
  writeJson(resolve(output, "campaign.json"), {
    schema: "post-phase10-basal-width-campaign-v1",
    experimentId: DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID,
    campaignId: basename(output),
    gitHead: git(["rev-parse", "HEAD"]),
    branch: git(["branch", "--show-current"]),
    node: process.version,
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
    requestedConcurrency: concurrency,
    plannedMaximumConcurrency: Math.min(concurrency, POST_PHASE10_BASAL_WIDTH_ROWS.length),
    rowCount: POST_PHASE10_BASAL_WIDTH_ROWS.length,
    rows: POST_PHASE10_BASAL_WIDTH_ROWS,
    reusedControls: POST_PHASE10_BASAL_WIDTH_REUSED_CONTROLS,
    sourcePlan: "docs/plans/post-phase10-adaptive-discovery.md",
    sourcePlanSection: "Selected local basal-width experiment — registered 2026-09-11",
    sourcePlanCommit: "5f90eb0330d138a33dbc79537103c3e2f3b44be7",
    exactLaunchCommand: [process.execPath, ...process.argv.slice(1)],
    createdAt: new Date().toISOString(),
  });
  const exits = await launchRows({ campaignDirectory: output, launchName: "basal-width-wave-1",
    rows: POST_PHASE10_BASAL_WIDTH_ROWS, concurrency });
  if (exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null)) process.exitCode = 1;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "list":
      console.log(JSON.stringify(POST_PHASE10_DISCOVERY_ROWS, null, 2));
      return;
    case "list-adaptive":
      console.log(JSON.stringify(POST_PHASE10_ADAPTIVE_ROWS, null, 2));
      return;
    case "list-long":
      console.log(JSON.stringify(POST_PHASE10_LONG_ROWS, null, 2));
      return;
    case "list-confirmation":
      console.log(JSON.stringify(POST_PHASE10_CONFIRM_ROWS, null, 2));
      return;
    case "list-followup":
      console.log(JSON.stringify(POST_PHASE10_FOLLOWUP_ROWS, null, 2));
      return;
    case "list-cavity":
      console.log(JSON.stringify(POST_PHASE10_CAVITY_ROWS, null, 2));
      return;
    case "list-facet-factorial":
      console.log(JSON.stringify(POST_PHASE10_FACET_FACTORIAL_ROWS, null, 2));
      return;
    case "list-holefill":
      console.log(JSON.stringify(POST_PHASE10_HOLEFILL_ROWS, null, 2));
      return;
    case "list-facet-factorial-long":
      console.log(JSON.stringify(POST_PHASE10_FACET_FACTORIAL_LONG_ROWS, null, 2));
      return;
    case "list-holefill-long":
      console.log(JSON.stringify(POST_PHASE10_HOLEFILL_LONG_ROWS, null, 2));
      return;
    case "list-prism-holefill":
      console.log(JSON.stringify(POST_PHASE10_PRISM_HOLEFILL_ROWS, null, 2));
      return;
    case "list-basal-width":
      console.log(JSON.stringify(POST_PHASE10_BASAL_WIDTH_ROWS, null, 2));
      return;
    case "run-row": {
      if (args.length !== 2) throw new Error("run-row wants <row-id> <output-directory>");
      const smokeRow = POST_PHASE10_SMOKE_ROWS.find((row) => row.id === args[0]);
      const adaptiveSmokeRow = POST_PHASE10_ADAPTIVE_SMOKE_ROWS.find((row) => row.id === args[0]);
      const selectedRow =
        smokeRow ??
        adaptiveSmokeRow ??
        findPostPhase10BasalWidthRow(args[0]) ??
        findPostPhase10PrismHolefillRow(args[0]) ??
        findPostPhase10HolefillLongRow(args[0]) ??
        findPostPhase10FacetFactorialLongRow(args[0]) ??
        findPostPhase10HolefillRow(args[0]) ??
        findPostPhase10FacetFactorialRow(args[0]) ??
        findPostPhase10CavityRow(args[0]) ??
        findPostPhase10FollowupRow(args[0]) ??
        findPostPhase10ConfirmationRow(args[0]) ??
        findPostPhase10LongRow(args[0]) ??
        findPostPhase10AdaptiveRow(args[0]) ??
        postPhase10DiscoveryRow(args[0]);
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
    case "launch-adaptive":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-adaptive wants <campaign-directory> [concurrency]");
      }
      await launchAdaptive(args[0], parseConcurrency(args[1], 16));
      return;
    case "smoke-adaptive":
      if (args.length !== 1) throw new Error("smoke-adaptive wants <output-directory>");
      await smokeAdaptive(args[0]);
      return;
    case "launch-long":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-long wants <campaign-directory> [concurrency]");
      }
      await launchLong(args[0], parseConcurrency(args[1], 16));
      return;
    case "launch-confirmation":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-confirmation wants <campaign-directory> [concurrency]");
      }
      await launchConfirmation(args[0], parseConcurrency(args[1], 28));
      return;
    case "launch-followup":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-followup wants <campaign-directory> [concurrency]");
      }
      await launchFollowup(args[0], parseConcurrency(args[1], 28));
      return;
    case "launch-cavity":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-cavity wants <campaign-directory> [concurrency]");
      }
      await launchCavity(args[0], parseConcurrency(args[1], 28));
      return;
    case "launch-facet-factorial":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-facet-factorial wants <campaign-directory> [concurrency]");
      }
      await launchFacetFactorial(args[0], parseConcurrency(args[1], 4));
      return;
    case "launch-holefill":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-holefill wants <campaign-directory> [concurrency]");
      }
      await launchHolefill(args[0], parseConcurrency(args[1], 4));
      return;
    case "launch-facet-factorial-long":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-facet-factorial-long wants <campaign-directory> [concurrency]");
      }
      await launchFacetFactorialLong(args[0], parseConcurrency(args[1], 4));
      return;
    case "launch-holefill-long":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-holefill-long wants <campaign-directory> [concurrency]");
      }
      await launchHolefillLong(args[0], parseConcurrency(args[1], 4));
      return;
    case "launch-prism-holefill":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-prism-holefill wants <campaign-directory> [concurrency]");
      }
      await launchPrismHolefill(args[0], parseConcurrency(args[1], 2));
      return;
    case "launch-basal-width":
      if (args.length < 1 || args.length > 2) {
        throw new Error("launch-basal-width wants <campaign-directory> [concurrency]");
      }
      await launchBasalWidth(args[0], parseConcurrency(args[1], 4));
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
          "list|list-adaptive|list-long|list-confirmation|list-followup|list-cavity|list-facet-factorial|list-holefill|" +
          "list-facet-factorial-long|list-holefill-long|list-prism-holefill|list-basal-width|" +
          "run-row <row-id> <out>|" +
          "launch-initial <campaign-dir> [concurrency]|launch-a112 <campaign-dir>|" +
          "smoke <out>|launch-adaptive <campaign-dir> [concurrency]|smoke-adaptive <out>|" +
          "launch-long <campaign-dir> [concurrency]|" +
          "launch-confirmation <campaign-dir> [concurrency]|" +
          "launch-followup <campaign-dir> [concurrency]|" +
          "launch-cavity <campaign-dir> [concurrency]|" +
          "launch-facet-factorial <campaign-dir> [concurrency]|" +
          "launch-holefill <campaign-dir> [concurrency]|" +
          "launch-facet-factorial-long <campaign-dir> [concurrency]|" +
          "launch-holefill-long <campaign-dir> [concurrency]|" +
          "launch-prism-holefill <campaign-dir> [concurrency]|" +
          "launch-basal-width <campaign-dir> [concurrency]|" +
          "analyze <campaign-dir> <output-dir>",
      );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
