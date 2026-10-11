import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_LARGE_BATCH_OCT11 } from "./hil-large-batch-oct11-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_LARGE_BATCH_OCT11, entryPath: fileURLToPath(import.meta.url), concurrency: 12,
  campaignSchema: "hil-large-batch-oct11-campaign-v1", label: "HIL October 11 queued exploration",
  plan: "docs/plans/hil-large-batch-oct11.md",
  budgetBasis: "Twelve additional workers beside four warm workers; existing N64 operation and live headroom. Not a new throughput qualification.",
});

export function hilLargeBatchOct11CampaignBinding() {
  return hilOperationalCampaignBinding(CONFIG);
}

export function validateHilLargeBatchOct11Campaign(value: unknown): void {
  validateHilOperationalCampaign(value, CONFIG);
}

export async function runHilLargeBatchOct11(): Promise<void> {
  return runHilOperationalBatch(CONFIG);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilLargeBatchOct11().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
