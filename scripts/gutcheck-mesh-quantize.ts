// Phase 7 prep spike, Track A (docs/plans/explore-phase7-prep.md): quantize gutcheck-mesh-v1
// binaries into "gutcheck-mesh-v2q" for shippable replay bundles.
//
//   node scripts/gutcheck-mesh-quantize.ts <in.bin> <out.bin>
//   node scripts/gutcheck-mesh-quantize.ts --manifest <anim-dir>/manifest.json --out-dir <dir>
//
// v2q layout (little-endian, sections 4-byte aligned):
//   u32 headerLen, padded JSON header {format:"gutcheck-mesh-v2q", vertexCount, triangleCount,
//     bboxMin:[3], bboxMax:[3], indexType:"u16"|"u32", quantization, source:<v1 header>}
//   u16 positions (3N)  — p = bboxMin + q/65535 * (bboxMax - bboxMin), per axis
//   i8  normals   (2N)  — octahedral encoding, snorm8
//   u16|u32 indices (3T)
// The decoder lives in app/src/spike-gg-realism.ts (parseMesh) — keep the two in sync.
// Cell-true (gutcheck-cellmesh-v1) files are not handled here; their edge-segment payload
// needs its own treatment and the ggview style is not in the v1 shipping set.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

interface V1Mesh {
  header: Record<string, unknown>;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

function parseV1(buffer: Buffer): V1Mesh {
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const headerLen = dv.getUint32(0, true);
  const header = JSON.parse(
    new TextDecoder().decode(buffer.subarray(4, 4 + headerLen)),
  ) as Record<string, unknown>;
  if (header["format"] !== "gutcheck-mesh-v1") {
    throw new Error(`expected gutcheck-mesh-v1, got ${String(header["format"])}`);
  }
  const vertexCount = header["vertexCount"] as number;
  const triangleCount = header["triangleCount"] as number;
  let off = buffer.byteOffset + 4 + headerLen;
  const positions = new Float32Array(buffer.buffer, off, vertexCount * 3);
  off += vertexCount * 3 * 4;
  const normals = new Float32Array(buffer.buffer, off, vertexCount * 3);
  off += vertexCount * 3 * 4;
  const indices = new Uint32Array(buffer.buffer, off, triangleCount * 3);
  return { header, positions, normals, indices };
}

const signNonZero = (x: number): number => (x >= 0 ? 1 : -1);

/** Octahedral-encode a unit normal into two snorm8 ints. */
function octEncode(nx: number, ny: number, nz: number): [number, number] {
  const l1 = Math.abs(nx) + Math.abs(ny) + Math.abs(nz) || 1;
  let x = nx / l1;
  let y = ny / l1;
  if (nz < 0) {
    const ox = (1 - Math.abs(y)) * signNonZero(x);
    const oy = (1 - Math.abs(x)) * signNonZero(y);
    x = ox;
    y = oy;
  }
  return [Math.max(-127, Math.min(127, Math.round(x * 127))), Math.max(-127, Math.min(127, Math.round(y * 127)))];
}

function quantize(input: Buffer): { bytes: Uint8Array; inBytes: number; outBytes: number } {
  const mesh = parseV1(input);
  const vertexCount = mesh.header["vertexCount"] as number;
  const triangleCount = mesh.header["triangleCount"] as number;

  const bboxMin = [Infinity, Infinity, Infinity];
  const bboxMax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vertexCount * 3; i++) {
    const axis = i % 3;
    const v = mesh.positions[i]!;
    if (v < bboxMin[axis]!) bboxMin[axis] = v;
    if (v > bboxMax[axis]!) bboxMax[axis] = v;
  }
  const scale = [0, 1, 2].map((axis) => {
    const span = bboxMax[axis]! - bboxMin[axis]!;
    return span > 0 ? 65535 / span : 0;
  });

  const qPositions = new Uint16Array(vertexCount * 3);
  for (let i = 0; i < vertexCount * 3; i++) {
    const axis = i % 3;
    qPositions[i] = Math.round((mesh.positions[i]! - bboxMin[axis]!) * scale[axis]!);
  }
  const qNormals = new Int8Array(vertexCount * 2);
  for (let v = 0; v < vertexCount; v++) {
    const [u, w] = octEncode(mesh.normals[v * 3]!, mesh.normals[v * 3 + 1]!, mesh.normals[v * 3 + 2]!);
    qNormals[v * 2] = u;
    qNormals[v * 2 + 1] = w;
  }
  const indexType = vertexCount <= 65535 ? "u16" : "u32";
  const qIndices =
    indexType === "u16" ? Uint16Array.from(mesh.indices) : mesh.indices;

  const headerJson = JSON.stringify({
    format: "gutcheck-mesh-v2q",
    vertexCount,
    triangleCount,
    bboxMin,
    bboxMax,
    indexType,
    quantization: { positions: "u16-bbox", normals: "oct-snorm8" },
    source: mesh.header,
  });
  const rawHeader = new TextEncoder().encode(headerJson);
  const headerLen = Math.ceil(rawHeader.length / 4) * 4;
  const headerBytes = new Uint8Array(headerLen).fill(0x20);
  headerBytes.set(rawHeader);

  const align4 = (n: number): number => Math.ceil(n / 4) * 4;
  const posOff = 4 + headerLen;
  const normOff = align4(posOff + qPositions.byteLength);
  const idxOff = align4(normOff + qNormals.byteLength);
  const total = idxOff + qIndices.byteLength;
  const bytes = new Uint8Array(total);
  new DataView(bytes.buffer).setUint32(0, headerLen, true);
  bytes.set(headerBytes, 4);
  bytes.set(new Uint8Array(qPositions.buffer, 0, qPositions.byteLength), posOff);
  bytes.set(new Uint8Array(qNormals.buffer, 0, qNormals.byteLength), normOff);
  bytes.set(new Uint8Array(qIndices.buffer, qIndices.byteOffset, qIndices.byteLength), idxOff);
  return { bytes, inBytes: input.byteLength, outBytes: total };
}

function run(): void {
  const argv = process.argv.slice(2);
  if (argv[0] === "--manifest") {
    const manifestPath = resolve(argv[1] ?? "");
    const outDirArg = argv.indexOf("--out-dir");
    if (outDirArg < 0 || argv[outDirArg + 1] === undefined) throw new Error("--manifest needs --out-dir");
    const outDir = resolve(argv[outDirArg + 1]!);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      format: string;
      frames: Array<{ file: string }>;
    };
    if (manifest.format !== "gutcheck-anim-v1") throw new Error(`unexpected manifest format ${manifest.format}`);
    mkdirSync(outDir, { recursive: true });
    let inTotal = 0;
    let outTotal = 0;
    const srcDir = dirname(manifestPath);
    for (const frame of manifest.frames) {
      const result = quantize(readFileSync(join(srcDir, frame.file)));
      writeFileSync(join(outDir, frame.file), result.bytes);
      inTotal += result.inBytes;
      outTotal += result.outBytes;
    }
    writeFileSync(join(outDir, basename(manifestPath)), readFileSync(manifestPath));
    console.log(
      `${manifest.frames.length} frames: ${(inTotal / 1e9).toFixed(2)} GB -> ${(outTotal / 1e9).toFixed(2)} GB ` +
        `(${((outTotal / inTotal) * 100).toFixed(1)}%)`,
    );
    return;
  }
  const [inPath, outPath] = argv;
  if (inPath === undefined || outPath === undefined) {
    throw new Error(
      "usage: gutcheck-mesh-quantize.ts <in.bin> <out.bin> | --manifest <manifest.json> --out-dir <dir>",
    );
  }
  const result = quantize(readFileSync(resolve(inPath)));
  writeFileSync(resolve(outPath), result.bytes);
  console.log(
    `${inPath}: ${(result.inBytes / 1e6).toFixed(1)} MB -> ${(result.outBytes / 1e6).toFixed(1)} MB ` +
      `(${((result.outBytes / result.inBytes) * 100).toFixed(1)}%)`,
  );
}

run();
