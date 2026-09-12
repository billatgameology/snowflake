import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadStudyManifest, readStudy } from "../growth-study-assets.ts";
import { readGrowthStudy } from "../src/growth-study-data.ts";
import { visibleEventCount } from "../src/dendrite-data.ts";

const root = resolve(import.meta.dirname, "../..");
const producer = resolve(process.env.GROWTH_STUDY_CATALOG_ROOT ?? resolve(root, "../snowflake-named-catalog"));
const library = loadStudyManifest(root);
const unpack = bytes => {
  const length = bytes.readUInt32LE(0);
  return { header: JSON.parse(bytes.subarray(4, 4 + length)), payload: bytes.subarray(4 + length) };
};
const direct = new Map();
const rows = [];
for (const entry of library.entries) {
  const bytes = readStudy(root, entry, library);
  assert.ok(bytes, `Unavailable: ${entry.id}`);
  const data = readGrowthStudy(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
  assert.equal(data.eventCount, entry.eventCount);
  assert.equal(data.finalTick, entry.finalTick);
  assert.equal(data.sourceSha256, entry.sourceSha256);
  rows.push({ id: entry.id, events: data.eventCount, bytes: bytes.length, sourceSha256: data.sourceSha256 });
  if (entry.source === "named-direct") {
    const original = unpack(readFileSync(resolve(producer, entry.sourcePath)));
    assert.deepEqual(unpack(bytes).payload, original.payload, `Changed event payload: ${entry.id}`);
    direct.set(entry.sourceSha256, original);
  }
}
const sceneRows = [];
for (const entry of library.entries.filter(e => e.source === "named-compose")) {
  const source = JSON.parse(readFileSync(resolve(producer, entry.sourcePath)));
  const bytes = readStudy(root, entry, library);
  const packed = unpack(bytes);
  const data = readGrowthStudy(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
  assert.equal(packed.header.assets.length, new Set(source.components.map(c => c.growthAsset.sha256)).size);
  source.components.forEach((c, i) => {
    assert.deepEqual(packed.header.components[i].transform, c.transform);
    assert.equal(packed.header.components[i].phaseOffset, c.phaseOffset);
  });
  const checks = [];
  for (const progress of [0, 0.23, 0.55, 0.82, 1]) {
    let expected = 0;
    for (const component of source.components) {
      if (progress < component.phaseOffset) continue;
      const asset = direct.get(component.growthAsset.sha256);
      const tick = Math.floor((progress - component.phaseOffset) / (1 - component.phaseOffset) * asset.header.finalTick);
      for (let e = 0; e < asset.header.eventCount; e++) {
        if (asset.payload.readUInt32LE(e * 8 + 4) <= tick) expected++;
      }
    }
    assert.equal(visibleEventCount(data.ticks, progress), expected, `${entry.id} at ${progress}`);
    checks.push({ progress, visible: expected });
  }
  sceneRows.push({ id: entry.id, checks });
}
const output = resolve(root, "out/named-growth-studies");
mkdirSync(output, { recursive: true });
const report = { entries: rows.length, named: rows.filter(r => r.id.startsWith("named-")).length, bytes: rows.reduce((s, r) => s + r.bytes, 0), namedDirectPayloadsUnchanged: true, sceneTransformsUnchanged: true, sceneRows, rows };
writeFileSync(resolve(output, "packaging.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ entries: report.entries, named: report.named, bytes: report.bytes, scenes: sceneRows.length, timelineChecks: sceneRows.length * 5 }));
