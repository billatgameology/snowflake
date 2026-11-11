import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_CENTRAL_FILLING_NOV11, centralFillingObservations } from "./hil-central-filling-nov11-roster.ts";
import { runPostPhase10DiscoveryRow } from "./post-phase10-discovery.ts";

export const CENTRAL_FILLING_CONFIG = Object.freeze({
  batch: HIL_CENTRAL_FILLING_NOV11, entryPath: fileURLToPath(import.meta.url), concurrency: 20,
  workerCeiling: 20, campaignSchema: "hil-central-filling-nov11-campaign-v1",
  label: "HIL November11 central filling", plan: "docs/plans/hil-central-filling-nov11.md",
  budgetBasis: "Maker-assigned20-worker HIL-only allocation: four N126 then36 N64 rows. Existing12GiB RAM/8GiB commit guard; direct host observation, no speed ladder or wall deadline. Permanent age/switch/central-attachment captures.",
});
export const centralFillingCampaignBinding = () => hilOperationalCampaignBinding(CENTRAL_FILLING_CONFIG);
export const validateCentralFillingCampaign = (value: unknown) =>
  validateHilOperationalCampaign(value, CENTRAL_FILLING_CONFIG);

export async function runCentralFillingBatch(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "run-row" || command === "resume-row") {
    if (args.length !== 2) throw new Error("row command requires exactly row ID and output directory");
    const entry = HIL_CENTRAL_FILLING_NOV11.rows.find(({ row }) => row.id === args[0]);
    if (entry === undefined) throw new Error(`unknown central-filling row: ${args[0]}`);
    const result = runPostPhase10DiscoveryRow(entry.row, args[1], {
      checkpoint: command === "resume-row" ? "resume" : "create",
      retainedObservations: centralFillingObservations(entry.row),
      heartbeat: (message) => console.log(`${new Date().toISOString()} ${message}`),
    });
    if (result.stopReason === "solver-error" || result.stopReason === "unconverged" ||
      result.integrityErrors.length !== 0) process.exitCode = 1;
    return;
  }
  return runHilOperationalBatch(CENTRAL_FILLING_CONFIG);
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCentralFillingBatch().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1;
  });
}
