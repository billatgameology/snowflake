import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_TWO_DAY_OCT12 } from "./hil-two-day-oct12-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_TWO_DAY_OCT12, entryPath: fileURLToPath(import.meta.url), concurrency: 12,
  campaignSchema: "hil-two-day-oct12-campaign-v1", label: "HIL October 12 two-day exploration",
  plan: "docs/plans/hil-two-day-exploration-oct12.md",
  budgetBasis: "Twelve new workers beside four warm workers; finite192-case N64 target29 roster. Planning43h; 25% slowdown54h, not bounds or wall deadlines. Existing live memory guards.",
});

export function hilTwoDayOct12CampaignBinding() {
  return hilOperationalCampaignBinding(CONFIG);
}

export function validateHilTwoDayOct12Campaign(value: unknown): void {
  validateHilOperationalCampaign(value, CONFIG);
}

export async function runHilTwoDayOct12(): Promise<void> {
  return runHilOperationalBatch(CONFIG);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilTwoDayOct12().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
