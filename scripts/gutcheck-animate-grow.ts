// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): deterministic growth
// replay for the interactive timeline viewer. Re-runs a registered grow configuration
// through the public GGSolver API (read-only on all packages) and emits a level-set mesh
// snapshot every N ticks plus a manifest the viewer scrubs through. The manifest is
// rewritten after every frame, so a partially complete replay is already viewable.
//
//   node scripts/gutcheck-animate-grow.ts --preset plate --dims 1200,1200,48 \
//        --ticks 70000 --every 500 --out-dir out/gutcheck-gg-realism/large/anim-B \
//        [--spacing 0.8] [--sigma 0.45] [--normal-delta 3] [--iso 0.5] [--margin 4] \
//        [--seed 1] [--noise 0] [--domain hexPrism]

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GG_PRESETS, type Dims, type DomainShape, type GGPresetName } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { extractMesh } from "./gutcheck-mesh-lib.ts";

interface Cli {
  preset: GGPresetName;
  dims: Dims;
  domain: DomainShape;
  ticks: number;
  every: number;
  outDir: string;
  seed: number;
  noise: number;
  spacing: number;
  sigma: number;
  iso: number;
  margin: number;
  normalDelta: number;
}

function parseCli(argv: string[]): Cli {
  const cli: Cli = {
    preset: "plate",
    dims: { nx: 1200, ny: 1200, nz: 48 },
    domain: "hexPrism",
    ticks: 70000,
    every: 500,
    outDir: "",
    seed: 1,
    noise: 0,
    spacing: 0.8,
    sigma: 0.45,
    iso: 0.5,
    margin: 4,
    normalDelta: 3,
  };
  let presetSeen = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} wants a value`);
      return v;
    };
    switch (arg) {
      case "--preset": {
        const name = next();
        if (!(name in GG_PRESETS)) throw new Error(`unknown preset: ${name}`);
        cli.preset = name as GGPresetName;
        presetSeen = true;
        break;
      }
      case "--dims": {
        const parts = next().split(",").map(Number);
        if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p) || p! < 8)) {
          throw new Error("--dims wants nx,ny,nz integers >= 8");
        }
        cli.dims = { nx: parts[0]!, ny: parts[1]!, nz: parts[2]! };
        break;
      }
      case "--domain": {
        const d = next();
        if (d !== "hexPrism" && d !== "box") throw new Error(`unknown domain: ${d}`);
        cli.domain = d;
        break;
      }
      case "--ticks":
        cli.ticks = Number(next());
        break;
      case "--every":
        cli.every = Number(next());
        break;
      case "--out-dir":
        cli.outDir = next();
        break;
      case "--seed":
        cli.seed = Number(next());
        break;
      case "--noise":
        cli.noise = Number(next());
        break;
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
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!presetSeen) throw new Error("--preset is required");
  if (cli.outDir === "") throw new Error("--out-dir is required");
  if (!Number.isInteger(cli.ticks) || cli.ticks < 1) throw new Error("--ticks wants >= 1");
  if (!Number.isInteger(cli.every) || cli.every < 1) throw new Error("--every wants >= 1");
  return cli;
}

interface FrameEntry {
  file: string;
  tick: number;
  vertexCount: number;
  triangleCount: number;
  attachedCount: number;
}

function main(): void {
  const cli = parseCli(process.argv.slice(2));
  const t0 = Date.now();
  mkdirSync(cli.outDir, { recursive: true });

  const solver = new GGSolver({
    dims: cli.dims,
    params: GG_PRESETS[cli.preset],
    rngSeed: cli.seed,
    noiseEpsilon: cli.noise,
    domain: cli.domain,
  });
  console.log(
    `replay preset=${cli.preset} dims=${cli.dims.nx},${cli.dims.ny},${cli.dims.nz} ` +
      `domain=${cli.domain} ticks=${cli.ticks} every=${cli.every} seed=${cli.seed} ` +
      `noise=${cli.noise} -> ${cli.outDir}`,
  );

  const frames: FrameEntry[] = [];
  let finalBBox: Record<string, number> | null = null;

  const writeManifest = (complete: boolean): void => {
    const manifest = {
      format: "gutcheck-anim-v1",
      complete,
      config: {
        preset: cli.preset,
        dims: cli.dims,
        domain: cli.domain,
        ticks: cli.ticks,
        every: cli.every,
        seed: cli.seed,
        noise: cli.noise,
        extraction: {
          spacing: cli.spacing,
          sigma: cli.sigma,
          iso: cli.iso,
          margin: cli.margin,
          normalDelta: cli.normalDelta,
        },
      },
      frames,
      finalBBox,
      elapsedSeconds: Math.round((Date.now() - t0) / 1000),
    };
    writeFileSync(join(cli.outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  };

  const snapshot = (): void => {
    const state = solver.state();
    const tick = state.tick;
    const mesh = extractMesh(state, {
      spacing: cli.spacing,
      sigma: cli.sigma,
      iso: cli.iso,
      margin: cli.margin,
      normalDelta: cli.normalDelta,
      source: {
        replay: `${cli.preset} ${cli.dims.nx},${cli.dims.ny},${cli.dims.nz} ${cli.domain}`,
        tick,
        seed: cli.seed,
        noiseEpsilon: cli.noise,
      },
    });
    const file = `mesh-t${String(tick).padStart(6, "0")}.bin`;
    writeFileSync(join(cli.outDir, file), mesh.bytes);
    frames.push({
      file,
      tick,
      vertexCount: mesh.vertexCount,
      triangleCount: mesh.triangleCount,
      attachedCount: solver.attachedCount,
    });
    finalBBox = mesh.bboxCartesian;
    writeManifest(false);
    console.log(
      `frame tick=${tick} attached=${solver.attachedCount} vertices=${mesh.vertexCount} ` +
        `triangles=${mesh.triangleCount} bytes=${mesh.bytes.length} ` +
        `elapsed=${((Date.now() - t0) / 1000).toFixed(1)}s`,
    );
  };

  // Frame 0 is the seed itself, then every N ticks, then the final tick regardless.
  snapshot();
  for (let t = 1; t <= cli.ticks; t++) {
    solver.step();
    if (t % cli.every === 0 || t === cli.ticks) snapshot();
  }
  writeManifest(true);
  console.log(
    `replay complete: ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

main();
