import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hilOperationalCampaignBinding, runHilOperationalBatch,
  validateHilOperationalCampaign } from "./hil-operational-batch-main.ts";
import { HIL_EXPLORATION_NOV18, explorationObservations } from "./hil-exploration-nov18-roster.ts";
import { runPostPhase10DiscoveryRow } from "./post-phase10-discovery.ts";

export const EXPLORATION_CONFIG = Object.freeze({
  batch: HIL_EXPLORATION_NOV18, entryPath: fileURLToPath(import.meta.url), concurrency: 16,
  workerCeiling: 16, campaignSchema: "hil-exploration-nov18-campaign-v1",
  label: "HIL November18 preparation seed and temperature exploration", plan: "docs/plans/hil-exploration-nov18.md",
  budgetBasis: "192 finite N64 cases refill sixteen slots alongside four continuing N126 workers in the maker-assigned20-worker HIL allocation. Existing12GiB RAM/8GiB commit guard; direct observation, no speed ladder or wall deadline. Permanent age/central and exact early-width switch captures.",
});
export const explorationCampaignBinding = () => hilOperationalCampaignBinding(EXPLORATION_CONFIG);
export const validateExplorationCampaign = (value: unknown) =>
  validateHilOperationalCampaign(value, EXPLORATION_CONFIG);

export async function runExplorationBatch(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "run-row" || command === "resume-row") {
    if (args.length !== 2) throw new Error("row command requires exactly row ID and output directory");
    const entry = HIL_EXPLORATION_NOV18.rows.find(({ row }) => row.id === args[0]);
    if (entry === undefined) throw new Error(`unknown November18 exploration row: ${args[0]}`);
    const result = runPostPhase10DiscoveryRow(entry.row, args[1], {
      checkpoint: command === "resume-row" ? "resume" : "create",
      retainedObservations: explorationObservations(entry.row),
      heartbeat: (message) => console.log(`${new Date().toISOString()} ${message}`),
    });
    if (result.stopReason === "solver-error" || result.stopReason === "unconverged" ||
      result.integrityErrors.length !== 0) process.exitCode = 1;
    return;
  }
  return runHilOperationalBatch(EXPLORATION_CONFIG);
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runExplorationBatch().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1;
  });
}
