import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { BLD_GROWTH_DYNAMICS_OCT21 } from "./bld-growth-dynamics-oct21-roster.ts";

export const BLD_GROWTH_DYNAMICS_OCT21_CONFIG = Object.freeze({
  batch: BLD_GROWTH_DYNAMICS_OCT21, host: "BLD" as const,
  entryPath: fileURLToPath(import.meta.url), concurrency: 32, workerCeiling: 32,
  campaignSchema: "bld-growth-dynamics-oct21-campaign-v1",
  label: "BLD October 21 growth dynamics", plan: "docs/plans/hil-bld-growth-dynamics-oct21.md",
  budgetBasis: "Maker-assigned ceiling 32 for 92 registered N64 warm/facet/sentinel rows. Direct host observation and existing 12 GiB available RAM / 8 GiB commit-headroom guard. No speed qualification or production wall deadline. Sixty rows initially queued; no HIL rows or reserves.",
});

export const bldGrowthDynamicsOct21CampaignBinding = () =>
  hilOperationalCampaignBinding(BLD_GROWTH_DYNAMICS_OCT21_CONFIG);
export const validateBldGrowthDynamicsOct21Campaign = (value: unknown): void =>
  validateHilOperationalCampaign(value, BLD_GROWTH_DYNAMICS_OCT21_CONFIG);

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHilOperationalBatch(BLD_GROWTH_DYNAMICS_OCT21_CONFIG).catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
