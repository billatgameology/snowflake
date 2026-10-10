import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_SUPPLEMENT } from "./hil-supplement-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_SUPPLEMENT, entryPath: fileURLToPath(import.meta.url), concurrency: 8,
  campaignSchema: "hil-supplement-campaign-v1", label: "HIL supplement",
  plan: "docs/plans/hil-supplement.md",
  budgetBasis: "Eight additional workers beside four warm workers; existing N64 operation and live headroom. Not a new throughput qualification.",
});

export function hilSupplementCampaignBinding() {
  return hilOperationalCampaignBinding(CONFIG);
}

export function validateHilSupplementCampaign(value: unknown): void {
  validateHilOperationalCampaign(value, CONFIG);
}

export async function runHilSupplement(): Promise<void> {
  return runHilOperationalBatch(CONFIG);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilSupplement().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
