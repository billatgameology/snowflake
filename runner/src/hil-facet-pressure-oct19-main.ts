import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_FACET_PRESSURE_OCT19 } from "./hil-facet-pressure-oct19-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_FACET_PRESSURE_OCT19, entryPath: fileURLToPath(import.meta.url), concurrency: 12,
  campaignSchema: "hil-facet-pressure-oct19-campaign-v1", label: "HIL October 19 facet and pressure comparison",
  plan: "docs/plans/hil-facet-pressure-oct19.md",
  budgetBasis: "Twelve N64 workers beside two continuing N96 cold and two N126 warm workers. Four facet and eight pressure/history timestep cases, target29. Registered longest-case scenarios are assumptions, not bounds or wall deadlines. Existing live 12 GiB RAM / 8 GiB commit-headroom guards.",
});

export function hilFacetPressureOct19CampaignBinding() {
  return hilOperationalCampaignBinding(CONFIG);
}

export function validateHilFacetPressureOct19Campaign(value: unknown): void {
  validateHilOperationalCampaign(value, CONFIG);
}

export async function runHilFacetPressureOct19(): Promise<void> {
  return runHilOperationalBatch(CONFIG);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilFacetPressureOct19().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
