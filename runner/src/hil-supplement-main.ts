import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { acquireFirstBatchLease, firstBatchRosterSha256, planFirstBatchResume,
  runNamedDiscoveryBatch } from "./hil-bld-batch-main.ts";
import { batchGitHead, batchHostIdentity, launchDiscoveryRows, sampleBatchHost,
  writeBatchJson } from "./hil-bld-batch-execution.ts";
import { HIL_SUPPLEMENT, HIL_SUPPLEMENT_ROWS } from "./hil-supplement-roster.ts";

const ENTRY = fileURLToPath(import.meta.url);
const CONCURRENCY = 8;
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

export function hilSupplementCampaignBinding() {
  return {
    schema: "hil-supplement-campaign-v1" as const, batchId: HIL_SUPPLEMENT.id,
    checkpointFormat: "discovery-resume-v1" as const, host: "HIL" as const,
    gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
    hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256("HIL", HIL_SUPPLEMENT),
    requestedConcurrency: CONCURRENCY, rows: HIL_SUPPLEMENT_ROWS.map(({ row }) => row),
  };
}

/** This budget is explicitly registered, never presented as a probe qualification receipt. */
export function validateHilSupplementCampaign(value: unknown): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("missing HIL supplement campaign binding");
  }
  const receipt = value as Record<string, unknown>;
  for (const [key, expected] of Object.entries(hilSupplementCampaignBinding())) {
    if (JSON.stringify(receipt[key]) !== JSON.stringify(expected)) {
      throw new Error(`HIL supplement campaign ${key} does not match this resume`);
    }
  }
}

async function launchSupplement(output: string, resuming: boolean): Promise<void> {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() !== "") {
    throw new Error("Commit the tested implementation before HIL supplement launch or resume");
  }
  const directory = resolve(output);
  if (resuming) validateHilSupplementCampaign(readJson(resolve(directory, "campaign.json")));
  else {
    if (existsSync(directory)) throw new Error(`output directory already exists: ${directory}`);
    mkdirSync(dirname(directory), { recursive: true });
    mkdirSync(directory);
  }
  const release = acquireFirstBatchLease(directory);
  try {
    if (!resuming) writeBatchJson(resolve(directory, "campaign.json"), {
      ...hilSupplementCampaignBinding(), createdAt: new Date().toISOString(),
      exactLaunchCommand: process.argv, plan: "docs/plans/hil-supplement.md",
      budgetBasis: "Eight additional workers beside four warm workers; existing N64 operation and live headroom. Not a new throughput qualification.",
    });
    const rows = HIL_SUPPLEMENT_ROWS.map(({ row }) => row);
    const selected = resuming ? planFirstBatchResume(directory, rows)
      : { pending: rows.map((row) => ({ row, command: "run-row" as const })), skippedRowIds: [] };
    const commands = new Map(selected.pending.map(({ row, command }) => [row.id, command]));
    const attemptName = resuming ? `resume-${Date.now()}-${randomUUID()}` : "initial";
    const launchName = `${HIL_SUPPLEMENT.launchPrefix}-HIL-${attemptName}`;
    writeBatchJson(resolve(directory, `${launchName}-invocation.json`), {
      command: process.argv, pid: process.pid, startedAt: new Date().toISOString(),
      requestedConcurrency: CONCURRENCY, attemptName, skippedRowIds: selected.skippedRowIds,
      pending: selected.pending.map(({ row, command }) => ({ rowId: row.id, command })),
    });
    const exits = await launchDiscoveryRows({
      campaignDirectory: directory, launchName, rows: selected.pending.map(({ row }) => row),
      concurrency: CONCURRENCY, entryPath: ENTRY, attemptName, resumeExistingRows: resuming,
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
      summaryCommand: [process.execPath, ENTRY, "summarize", directory] }));
  } finally { release(); }
}

export async function runHilSupplement(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if ((command === "launch" || command === "resume") && args.length === 2) {
    if (args[0] !== "HIL") throw new Error("HIL supplement is assigned only to HIL");
    return launchSupplement(args[1], command === "resume");
  }
  if (command !== undefined && ["list", "summarize", "run-row", "resume-row"].includes(command)) {
    return runNamedDiscoveryBatch(HIL_SUPPLEMENT, ENTRY);
  }
  throw new Error(`Usage: node ${ENTRY} list HIL | launch HIL <new-directory> | resume HIL <campaign-directory> | summarize <campaign-directory>`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilSupplement().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
