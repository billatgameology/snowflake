import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { acquireFirstBatchLease, firstBatchRosterSha256, planFirstBatchResume,
  runNamedDiscoveryBatch } from "./hil-bld-batch-main.ts";
import { batchGitHead, batchHostIdentity, launchDiscoveryRows, sampleBatchHost,
  writeBatchJson } from "./hil-bld-batch-execution.ts";
import type { DiscoveryBatchDefinition } from "./hil-bld-batch-roster.ts";

/** Named HIL jobs reuse the supplement's existing explicit-budget coordinator. */
export interface HilOperationalBatch {
  readonly batch: DiscoveryBatchDefinition;
  readonly entryPath: string;
  readonly concurrency: number;
  readonly campaignSchema: string;
  readonly label: string;
  readonly plan: string;
  readonly budgetBasis: string;
}
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

export function hilOperationalCampaignBinding(config: HilOperationalBatch) {
  return {
    schema: config.campaignSchema, batchId: config.batch.id,
    checkpointFormat: "discovery-resume-v1" as const, host: "HIL" as const,
    gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
    hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256("HIL", config.batch),
    requestedConcurrency: config.concurrency, rows: config.batch.rows.map(({ row }) => row),
  };
}

/** This budget is explicitly registered, never presented as a probe qualification receipt. */
export function validateHilOperationalCampaign(value: unknown, config: HilOperationalBatch): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`missing ${config.label} campaign binding`);
  }
  const receipt = value as Record<string, unknown>;
  for (const [key, expected] of Object.entries(hilOperationalCampaignBinding(config))) {
    if (JSON.stringify(receipt[key]) !== JSON.stringify(expected)) {
      throw new Error(`${config.label} campaign ${key} does not match this resume`);
    }
  }
}

async function launch(output: string, resuming: boolean, config: HilOperationalBatch): Promise<void> {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() !== "") {
    throw new Error(`Commit the tested implementation before ${config.label} launch or resume`);
  }
  const directory = resolve(output);
  if (resuming) validateHilOperationalCampaign(readJson(resolve(directory, "campaign.json")), config);
  else {
    if (existsSync(directory)) throw new Error(`output directory already exists: ${directory}`);
    mkdirSync(dirname(directory), { recursive: true });
    mkdirSync(directory);
  }
  const release = acquireFirstBatchLease(directory);
  try {
    if (!resuming) writeBatchJson(resolve(directory, "campaign.json"), {
      ...hilOperationalCampaignBinding(config), createdAt: new Date().toISOString(),
      exactLaunchCommand: process.argv, plan: config.plan,
      budgetBasis: config.budgetBasis,
    });
    const rows = config.batch.rows.map(({ row }) => row);
    const selected = resuming ? planFirstBatchResume(directory, rows)
      : { pending: rows.map((row) => ({ row, command: "run-row" as const })), skippedRowIds: [] };
    const commands = new Map(selected.pending.map(({ row, command }) => [row.id, command]));
    const attemptName = resuming ? `resume-${Date.now()}-${randomUUID()}` : "initial";
    const launchName = `${config.batch.launchPrefix}-HIL-${attemptName}`;
    writeBatchJson(resolve(directory, `${launchName}-invocation.json`), {
      command: process.argv, pid: process.pid, startedAt: new Date().toISOString(),
      requestedConcurrency: config.concurrency, attemptName, skippedRowIds: selected.skippedRowIds,
      pending: selected.pending.map(({ row, command }) => ({ rowId: row.id, command })),
    });
    const exits = await launchDiscoveryRows({
      campaignDirectory: directory, launchName, rows: selected.pending.map(({ row }) => row),
      concurrency: config.concurrency, entryPath: config.entryPath, attemptName, resumeExistingRows: resuming,
      workerArguments: (row, rowDirectory) => [commands.get(row.id)!, row.id, rowDirectory],
      stopOnWorkerFailure: false, monitor: { sample: sampleBatchHost },
    });
    const completionPath = resolve(directory, `${launchName}-complete.json`);
    const completion = readJson(completionPath) as { abortReason: string | null };
    if (completion.abortReason !== null || exits.length !== selected.pending.length ||
      exits.some((exit) => exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) {
      process.exitCode = 2;
    }
    console.log(JSON.stringify({ campaign: directory, attemptName, completionPath,
      skippedRowIds: selected.skippedRowIds,
      summaryCommand: [process.execPath, config.entryPath, "summarize", directory] }));
  } finally { release(); }
}

export async function runHilOperationalBatch(config: HilOperationalBatch): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if ((command === "launch" || command === "resume") && args.length === 2) {
    if (args[0] !== "HIL") throw new Error(`${config.label} is assigned only to HIL`);
    return launch(args[1], command === "resume", config);
  }
  if (command !== undefined && ["list", "summarize", "run-row", "resume-row"].includes(command)) {
    return runNamedDiscoveryBatch(config.batch, config.entryPath);
  }
  throw new Error(`Usage: node ${config.entryPath} list HIL | launch HIL <new-directory> | resume HIL <campaign-directory> | summarize <campaign-directory>`);
}
