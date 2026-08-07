// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): convert the runner's
// axial-coordinate PGM dumps (nx×ny raster in sheared (i,j), see runner/src/pgm.ts) into
// cartesian-view PGMs for animation. Exact integer unshear: cartesian x = i + j/2, so at
// 2× horizontal supersampling column = 2i + j (both subpixels filled); the caller then
// halves the width and applies the sqrt(3)/2 vertical factor in ffmpeg. Read-only on
// inputs; disposable exploration tooling.
//
//   node scripts/gutcheck-pgm2cart.ts <in-dir> <glob-prefix> <out-dir>
// e.g. node scripts/gutcheck-pgm2cart.ts out/.../pgm-1200-plate occupancy out/.../cart

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function parsePgm(bytes: Buffer): { width: number; height: number; data: Buffer } {
  let off = 0;
  const fields: string[] = [];
  while (fields.length < 4) {
    while (off < bytes.length && [32, 9, 10, 13].includes(bytes[off]!)) off++;
    if (bytes[off] === 0x23) {
      while (off < bytes.length && bytes[off] !== 10) off++;
      continue;
    }
    let s = "";
    while (off < bytes.length && ![32, 9, 10, 13].includes(bytes[off]!)) {
      s += String.fromCharCode(bytes[off]!);
      off++;
    }
    fields.push(s);
  }
  off++;
  if (fields[0] !== "P5") throw new Error(`not a binary PGM: ${fields[0]}`);
  const width = Number(fields[1]);
  const height = Number(fields[2]);
  return { width, height, data: bytes.subarray(off, off + width * height) };
}

const [inDir, prefix, outDir] = process.argv.slice(2);
if (!inDir || !prefix || !outDir) {
  throw new Error("usage: gutcheck-pgm2cart.ts <in-dir> <glob-prefix> <out-dir>");
}
mkdirSync(outDir, { recursive: true });
const files = readdirSync(inDir)
  .filter((f) => f.startsWith(prefix) && f.endsWith(".pgm"))
  .sort();
if (files.length === 0) throw new Error(`no ${prefix}*.pgm in ${inDir}`);
let frame = 0;
for (const f of files) {
  const { width, height, data } = parsePgm(readFileSync(join(inDir, f)));
  const outWidth = 2 * width + height;
  const out = Buffer.alloc(outWidth * height);
  for (let j = 0; j < height; j++) {
    const rowBase = j * outWidth;
    for (let i = 0; i < width; i++) {
      const v = data[j * width + i]!;
      if (v === 0) continue;
      const x = 2 * i + j;
      out[rowBase + x] = v;
      out[rowBase + x + 1] = v;
    }
  }
  const name = join(outDir, `cart-${String(frame).padStart(3, "0")}.pgm`);
  writeFileSync(name, Buffer.concat([Buffer.from(`P5\n${outWidth} ${height}\n255\n`), out]));
  frame++;
}
console.log(`wrote ${frame} cartesian frames to ${outDir}`);
