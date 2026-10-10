import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_EXPLORATION_OCT10 } from "./hil-exploration-oct10-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_EXPLORATION_OCT10, entryPath: fileURLToPath(import.meta.url), concurrency: 10,
  campaignSchema: "hil-exploration-oct10-campaign-v1", label: "HIL October 10 exploration",
  plan: "docs/plans/hil-exploration-oct10.md",
  budgetBasis: "Ten additional workers beside four warm workers; existing N64 operation and live headroom. Not a new throughput qualification.",
});

export function hilExplorationOct10CampaignBinding() {
  return hilOperationalCampaignBinding(CONFIG);
}

export function validateHilExplorationOct10Campaign(value: unknown): void {
  validateHilOperationalCampaign(value, CONFIG);
}

export async function runHilExplorationOct10(): Promise<void> {
  return runHilOperationalBatch(CONFIG);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilExplorationOct10().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
