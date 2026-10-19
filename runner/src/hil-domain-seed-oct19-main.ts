import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_DOMAIN_SEED_OCT19 } from "./hil-domain-seed-oct19-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_DOMAIN_SEED_OCT19, entryPath: fileURLToPath(import.meta.url), concurrency: 12,
  campaignSchema: "hil-domain-seed-oct19-campaign-v1", label: "HIL October 19 domain and seed comparison",
  plan: "docs/plans/hil-domain-seed-oct19.md",
  budgetBasis: "Twelve new workers beside two unchanged warm workers: four N96 cold domain cases and eight N64 seed timestep cases, target29. Changed configurations are unmeasured; registered runtime scenarios are not bounds or wall deadlines. Existing live 12 GiB RAM / 8 GiB commit-headroom guards.",
});

export function hilDomainSeedOct19CampaignBinding() {
  return hilOperationalCampaignBinding(CONFIG);
}

export function validateHilDomainSeedOct19Campaign(value: unknown): void {
  validateHilOperationalCampaign(value, CONFIG);
}

export async function runHilDomainSeedOct19(): Promise<void> {
  return runHilOperationalBatch(CONFIG);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilDomainSeedOct19().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
