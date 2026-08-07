// Gut-check spike: GG checkpoint -> cell-true prism mesh (the paper's own display mode).
//   node scripts/gutcheck-extract-cellmesh.ts <in.ckpt> <out-cellmesh.bin>

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { decodeCheckpoint } from "@vcc/core";
import { extractCellMesh } from "./gutcheck-cellmesh-lib.ts";

const [ckptPath, outPath] = process.argv.slice(2);
if (!ckptPath || !outPath) {
  throw new Error("usage: gutcheck-extract-cellmesh.ts <in.ckpt> <out-cellmesh.bin>");
}
const t0 = Date.now();
const bytes = new Uint8Array(readFileSync(ckptPath));
const ckptSha256 = createHash("sha256").update(bytes).digest("hex");
const { state } = decodeCheckpoint(bytes);
console.log(
  `checkpoint ${ckptPath} sha256=${ckptSha256} tick=${state.tick} ` +
    `dims=${state.dims.nx},${state.dims.ny},${state.dims.nz}`,
);
const mesh = extractCellMesh(state, {
  checkpoint: ckptPath,
  checkpointSha256: ckptSha256,
  tick: state.tick,
  dims: state.dims,
  domain: state.domain,
});
writeFileSync(outPath, mesh.bytes);
console.log(
  `wrote ${outPath} (${mesh.bytes.length} bytes) vertices=${mesh.vertexCount} ` +
    `triangles=${mesh.triangleCount} edgeSegments=${mesh.edgeSegmentCount} ` +
    `in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
);
