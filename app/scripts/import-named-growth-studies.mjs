// Product manifest intake from accepted catalog/review identities. No source mutation.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const producer = resolve(process.argv[2] ?? resolve(root, "../snowflake-named-catalog"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const sources = [];
const readDocument = name => {
  const bytes = readFileSync(resolve(producer, "docs", name));
  sources.push({ path: `docs/${name}`, sha256: digest(bytes) });
  return JSON.parse(bytes);
};
const catalog = readDocument("named-snow-crystal-catalog.json");
const direct = readDocument("named-snow-crystal-final-direct-review.json");
const compose = readDocument("named-snow-crystal-final-compose-review.json");
if (catalog.format !== "named-snow-crystal-catalog-v1") throw new Error("Unexpected catalogue");
const directById = new Map(direct.families.flatMap(f => f.variants.map(v => [v.entryId, v])));
const composeById = new Map(compose.families.flatMap(f => f.variants.map(v => [v.entryId, v])));
const verified = identity => {
  if (!/^out\/named-crystal-catalog\/[a-z0-9/-]+\.(bin|json)$/u.test(identity.path)) throw new Error("Unexpected input path");
  const bytes = readFileSync(resolve(producer, identity.path));
  if (bytes.length !== identity.byteLength || digest(bytes) !== identity.sha256) throw new Error(`Identity mismatch: ${identity.path}`);
  return bytes;
};
const headers = new Map();
for (const v of directById.values()) {
  const bytes = verified(v.webAsset);
  const h = JSON.parse(bytes.subarray(4, 4 + bytes.readUInt32LE(0)));
  if (h.format !== "gutcheck-growth-v1" || bytes.length !== 4 + bytes.readUInt32LE(0) + h.eventCount * 8) throw new Error("Unexpected event format");
  headers.set(v.webAsset.sha256, h);
}
const entries = [];
for (const family of catalog.entries) {
  if (family.route === "excluded-new-physics") continue;
  for (const slot of catalog.variationSlots) {
    const variant = family.variants[slot];
    const composed = family.route === "compose";
    const review = (composed ? composeById : directById).get(variant.entryId);
    if (!review) throw new Error(`No accepted review for ${variant.entryId}`);
    const identity = composed ? review.scene : review.webAsset;
    if (identity.path !== variant.links.webAsset) throw new Error(`Catalogue/review mismatch: ${variant.entryId}`);
    let eventCount, finalTick, terminationReason;
    if (composed) {
      const scene = JSON.parse(verified(identity));
      if (scene.format !== "growth-scene-v1" || scene.disclosure !== "composed-visualization") throw new Error("Unexpected scene");
      eventCount = scene.components.reduce((sum, component) => {
        const h = headers.get(component.growthAsset.sha256);
        const accepted = [...directById.values()].find(v => v.webAsset.sha256 === component.growthAsset.sha256);
        if (!h || !accepted || accepted.webAsset.byteLength !== component.growthAsset.byteLength) throw new Error("Unaccepted component");
        return sum + h.eventCount;
      }, 0);
      finalTick = 1; terminationReason = "component endpoints";
    } else {
      const h = headers.get(identity.sha256);
      ({ eventCount, finalTick } = h);
      terminationReason = h.terminationReason ?? h.result?.terminationReason ?? "recorded endpoint";
    }
    entries.push({ id: `named-${variant.entryId}`, label: `${family.name} · ${slot[0].toUpperCase()}${slot.slice(1)}`, habit: family.name,
      source: composed ? "named-compose" : "named-direct", sourcePath: identity.path, sourceSha256: identity.sha256, eventCount, finalTick, terminationReason });
  }
}
if (entries.length !== 99 || new Set(entries.map(e => e.id)).size !== entries.length || entries.filter(e => e.source === "named-direct").length !== 66) throw new Error("Incomplete accepted catalogue");
const output = { format: "named-growth-study-sources-v1", sources, entries,
  excluded: catalog.entries.filter(e => e.route === "excluded-new-physics").map(e => ({ id: e.name, reason: e.exclusionReason })) };
writeFileSync(resolve(root, "app/data/named-growth-library.json"), JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ entries: entries.length, direct: entries.filter(e => e.source === "named-direct").length, composed: entries.filter(e => e.source === "named-compose").length, maxDisplayedEvents: Math.max(...entries.map(e => e.eventCount)), sources }, null, 2));
