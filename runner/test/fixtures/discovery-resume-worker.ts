import { readFileSync } from "node:fs";
import { runPostPhase10DiscoveryRow, type DiscoveryRow } from "../../src/post-phase10-discovery.ts";

const [rowPath, output, checkpoint] = process.argv.slice(2);
if (!rowPath || !output || (checkpoint !== "create" && checkpoint !== "resume")) throw new Error("expected row.json output create|resume");
const row = JSON.parse(readFileSync(rowPath, "utf8")) as DiscoveryRow;
const result = runPostPhase10DiscoveryRow(row, output, {
  checkpoint, heartbeat: (message) => console.log(message),
});
console.log(JSON.stringify(result));
if (result.integrityErrors.length !== 0 || !result.allRelaxationsConverged) process.exitCode = 2;
