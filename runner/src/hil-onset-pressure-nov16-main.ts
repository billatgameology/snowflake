import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_ONSET_PRESSURE_NOV16, onsetPressureObservations } from "./hil-onset-pressure-nov16-roster.ts";
import { runPostPhase10DiscoveryRow } from "./post-phase10-discovery.ts";

export const ONSET_PRESSURE_CONFIG = Object.freeze({
  batch: HIL_ONSET_PRESSURE_NOV16, entryPath: fileURLToPath(import.meta.url), concurrency: 16,
  workerCeiling: 16, campaignSchema: "hil-onset-pressure-nov16-campaign-v1",
  label: "HIL November16 onset pressure", plan: "docs/plans/hil-onset-pressure-nov16.md",
  budgetBasis: "Sixteen new N64 workers alongside four continuing N126 workers use the maker-assigned20-worker HIL allocation. Existing12GiB RAM/8GiB commit guard; direct observation, no speed ladder or wall deadline. Permanent age/central and exact early-width switch captures.",
});
export const onsetPressureCampaignBinding = () => hilOperationalCampaignBinding(ONSET_PRESSURE_CONFIG);
export const validateOnsetPressureCampaign = (value: unknown) =>
  validateHilOperationalCampaign(value, ONSET_PRESSURE_CONFIG);

export async function runOnsetPressureBatch(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "run-row" || command === "resume-row") {
    if (args.length !== 2) throw new Error("row command requires exactly row ID and output directory");
    const entry = HIL_ONSET_PRESSURE_NOV16.rows.find(({ row }) => row.id === args[0]);
    if (entry === undefined) throw new Error(`unknown onset pressure row: ${args[0]}`);
    const result = runPostPhase10DiscoveryRow(entry.row, args[1], {
      checkpoint: command === "resume-row" ? "resume" : "create",
      retainedObservations: onsetPressureObservations(entry.row),
      heartbeat: (message) => console.log(`${new Date().toISOString()} ${message}`),
    });
    if (result.stopReason === "solver-error" || result.stopReason === "unconverged" ||
      result.integrityErrors.length !== 0) process.exitCode = 1;
    return;
  }
  return runHilOperationalBatch(ONSET_PRESSURE_CONFIG);
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runOnsetPressureBatch().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1;
  });
}
