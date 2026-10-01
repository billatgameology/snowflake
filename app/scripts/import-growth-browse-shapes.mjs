// Navigation metadata from the existing visual audit; no morphology measurement or claim change.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { growthStudyShape } from "../src/growth-study-library.ts";

const root = resolve(import.meta.dirname, "../..");
const path = resolve(process.argv[2] ?? resolve(root, "../snowflake-named-catalog/docs/named-snow-crystal-current-assets.json"));
const bytes = readFileSync(path), audit = JSON.parse(bytes);
const file = resolve(root, "app/data/growth-library.json"), library = JSON.parse(readFileSync(file));
for (const entry of library.entries) {
  if (entry.id === "run-b") { entry.browseShape = "dendrites"; continue; }
  const asset = audit.assets.find(row => row.id === entry.id && row.webSha256 === entry.sourceSha256);
  if (!asset) throw new Error(`No identity-matched visual audit for ${entry.id}`);
  entry.browseShape = growthStudyShape({ label: asset.classification.typeId, habit: "" });
}
library.browseShapeSource = { document: "docs/named-snow-crystal-current-assets.json", sha256: createHash("sha256").update(bytes).digest("hex"), scope: "Navigation buckets only; near matches remain near matches in the source audit. Original Run B is the existing dendrite replay." };
writeFileSync(file, JSON.stringify(library, null, 2) + "\n");
console.log(JSON.stringify({ entries: library.entries.length, source: library.browseShapeSource }));
