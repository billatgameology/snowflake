// Product asset packaging only: copy the existing attachment table, omit workstation metadata.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node app/scripts/prepare-dendrite-study.mjs <sweep-t1-sharp-growth-v1.bin>");
const original = readFileSync(sourcePath);
const headerLength = original.readUInt32LE(0);
const source = JSON.parse(original.subarray(4, 4 + headerLength));
const sourceSha256 = createHash("sha256").update(original).digest("hex");
const expected = "8615928490192af7442b27bb7c2a6731c501a148774e0f95b1ef8c1d8fa15073";
if (sourceSha256 !== expected) throw new Error("Source differs from the selected dendrite. Refusing to replace the study asset.");
const header = Buffer.from(JSON.stringify({
  format: "dendrite-presentation-v1", eventCount: source.eventCount, finalTick: source.finalTick,
  dims: [source.config.dims.nx, source.config.dims.ny, source.config.dims.nz],
  center: source.config.center, sourceSha256,
}));
const prefix = Buffer.alloc(4);
prefix.writeUInt32LE(header.length);
const result = Buffer.concat([prefix, header, original.subarray(4 + headerLength)]);
const output = resolve(import.meta.dirname, "../data/dendrite-study.bin");
mkdirSync(resolve(import.meta.dirname, "../data"), { recursive: true });
writeFileSync(output, result);
console.log(JSON.stringify({ output, bytes: result.length, sourceSha256, eventPayloadUnchanged: result.subarray(4 + header.length).equals(original.subarray(4 + headerLength)) }));
