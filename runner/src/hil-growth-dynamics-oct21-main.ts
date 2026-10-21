import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_GROWTH_DYNAMICS_OCT21 } from "./hil-growth-dynamics-oct21-roster.ts";

const CONFIG = Object.freeze({
  batch: HIL_GROWTH_DYNAMICS_OCT21, entryPath: fileURLToPath(import.meta.url), concurrency: 20,
  workerCeiling: 20, campaignSchema: "hil-growth-dynamics-oct21-campaign-v1",
  label: "HIL October 21 growth dynamics", plan: "docs/plans/hil-bld-growth-dynamics-oct21.md",
  budgetBasis: "Maker-assigned ceiling 20; twelve N126 fine rows first, then twelve N96 histories/statics. Direct host observation and existing 12 GiB available RAM / 8 GiB commit-headroom guard. No speed qualification or production wall deadline. Four final pressure rows initially queued.",
});

export const hilGrowthDynamicsOct21CampaignBinding = () => hilOperationalCampaignBinding(CONFIG);
export const validateHilGrowthDynamicsOct21Campaign = (value: unknown): void =>
  validateHilOperationalCampaign(value, CONFIG);

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilOperationalBatch(CONFIG).catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
