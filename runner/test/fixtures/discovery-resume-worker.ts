import { readFileSync } from "node:fs";
import { runResumableDiscoveryRow } from "../../src/post-phase10-discovery-resume.ts";
import type { DiscoveryRow } from "../../src/post-phase10-discovery.ts";
const [rowPath, directory, pauseAt] = process.argv.slice(2);
if (!rowPath || !directory) throw new Error("fixture needs row file and output directory");
const row = JSON.parse(readFileSync(rowPath, "utf8")) as DiscoveryRow;
const outcome = await runResumableDiscoveryRow(row, directory, {
  ...(pauseAt === undefined ? {} : { pauseRequested: (cycle: number) => cycle >= Number(pauseAt) }),
});
process.stdout.write(`${JSON.stringify(outcome)}\n`);
