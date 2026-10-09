import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runNamedDiscoveryBatch } from "./hil-bld-batch-main.ts";
import { HIL_WARM_REFINEMENT } from "./hil-warm-refinement-roster.ts";

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runNamedDiscoveryBatch(HIL_WARM_REFINEMENT, fileURLToPath(import.meta.url)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
