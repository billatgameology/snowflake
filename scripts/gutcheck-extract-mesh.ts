// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): GG checkpoint -> smooth
// level-set mesh. Thin CLI over scripts/gutcheck-mesh-lib.ts (shared with the growth
// replay animator). Disposable exploration tooling; reads solver output strictly
// read-only.
//
//   node scripts/gutcheck-extract-mesh.ts <in.ckpt> <out-mesh.bin> [--spacing H]
//        [--sigma S] [--iso V] [--margin M] [--normal-delta F] [--obj path.obj]

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { decodeCheckpoint } from "@vcc/core";
import { extractMesh } from "./gutcheck-mesh-lib.ts";

interface Cli {
  ckptPath: string;
  outPath: string;
  spacing: number;
  sigma: number;
  iso: number;
  margin: number;
  normalDelta: number;
  objPath: string | null;
}

function parseCli(argv: string[]): Cli {
  const positional: string[] = [];
  const cli: Cli = {
    ckptPath: "",
    outPath: "",
    spacing: 0.5,
    sigma: 0.6,
    iso: 0.5,
    margin: 4,
    normalDelta: 1,
    objPath: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} wants a value`);
      return v;
    };
    switch (arg) {
      case "--spacing":
        cli.spacing = Number(next());
        break;
      case "--sigma":
        cli.sigma = Number(next());
        break;
      case "--iso":
        cli.iso = Number(next());
        break;
      case "--margin":
        cli.margin = Number(next());
        break;
      case "--normal-delta":
        cli.normalDelta = Number(next());
        break;
      case "--obj":
        cli.objPath = next();
        break;
      default:
        positional.push(arg);
    }
  }
  if (positional.length !== 2) {
    throw new Error("usage: gutcheck-extract-mesh.ts <in.ckpt> <out-mesh.bin> [options]");
  }
  cli.ckptPath = positional[0]!;
  cli.outPath = positional[1]!;
  for (const [name, v] of [
    ["--spacing", cli.spacing],
    ["--sigma", cli.sigma],
    ["--iso", cli.iso],
    ["--margin", cli.margin],
    ["--normal-delta", cli.normalDelta],
  ] as const) {
    if (!Number.isFinite(v) || v <= 0) throw new Error(`${name} wants a positive number`);
  }
  return cli;
}

function main(): void {
  const cli = parseCli(process.argv.slice(2));
  const t0 = Date.now();

  const bytes = new Uint8Array(readFileSync(cli.ckptPath));
  const ckptSha256 = createHash("sha256").update(bytes).digest("hex");
  const { state } = decodeCheckpoint(bytes);
  console.log(
    `checkpoint ${cli.ckptPath} sha256=${ckptSha256} tick=${state.tick} ` +
      `dims=${state.dims.nx},${state.dims.ny},${state.dims.nz} domain=${state.domain} ` +
      `farField=${state.farField} seed=${state.rngSeed} noise=${state.noiseEpsilon}`,
  );

  const mesh = extractMesh(state, {
    spacing: cli.spacing,
    sigma: cli.sigma,
    iso: cli.iso,
    margin: cli.margin,
    normalDelta: cli.normalDelta,
    source: {
      checkpoint: cli.ckptPath,
      checkpointSha256: ckptSha256,
      tick: state.tick,
      dims: state.dims,
      domain: state.domain,
      seed: state.rngSeed,
      noiseEpsilon: state.noiseEpsilon,
    },
    log: (line) => console.log(line),
  });
  writeFileSync(cli.outPath, mesh.bytes);
  console.log(
    `wrote ${cli.outPath} (${mesh.bytes.length} bytes) vertices=${mesh.vertexCount} ` +
      `triangles=${mesh.triangleCount}`,
  );

  if (cli.objPath !== null) {
    const parts: string[] = [];
    for (let vi = 0; vi < mesh.vertexCount; vi++) {
      parts.push(
        `v ${mesh.positions[vi * 3]} ${mesh.positions[vi * 3 + 1]} ${mesh.positions[vi * 3 + 2]}`,
        `vn ${mesh.normals[vi * 3]} ${mesh.normals[vi * 3 + 1]} ${mesh.normals[vi * 3 + 2]}`,
      );
    }
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const i1 = mesh.indices[t]! + 1;
      const i2 = mesh.indices[t + 1]! + 1;
      const i3 = mesh.indices[t + 2]! + 1;
      parts.push(`f ${i1}//${i1} ${i2}//${i2} ${i3}//${i3}`);
    }
    writeFileSync(cli.objPath, parts.join("\n") + "\n");
    console.log(`wrote ${cli.objPath}`);
  }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main();
