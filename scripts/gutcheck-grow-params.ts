// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): grow a crystal from an
// ARBITRARY G-G parameter vector (the paper's case studies cover many vectors the four
// presets don't), for the reproduce-all-paper-figures sweep. Drives GGSolver via the
// public API only; replicates the runner's observational stop rules (far-field 2/3*rho,
// 65% domain contact, tick cap) without touching runner/. Emits a final level-set mesh
// plus a JSON run record. Observational tooling; no gate semantics.
//
//   node scripts/gutcheck-grow-params.ts --spec-file fig21.json \
//        --dims 1200,1200,48 --ticks 60000 --out-mesh out/.../fig21-mesh.bin \
//        --record out/.../fig21-record.json [--seed 1] [--noise 0] [--domain hexPrism]
//        [--spacing 0.6] [--sigma 0.45] [--normal-delta 3] [--metrics-every 1000]
//
// Spec file shape (keys "01".."31" index the G-G attachment thresholds by (nT, nZ); kappa/mu default + overrides):
//   { "label": "Fig. 21", "rho": 0.1, "phi": 0,
//     "ggThreshTable": {"01":2.5,"10":2,"11":2,"20":2,"21":1,"30":1,"31":1},
//     "kappa": {"default":0.1,"overrides":{}}, "mu": {"default":0.001,"overrides":{}} }

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  encodeCheckpoint,
  paramVector,
  validateParams,
  type Dims,
  type DomainShape,
  type GGParams,
  type GGTimelineEnvironment,
} from "@vcc/core";
import { GGSolver, FAR_FIELD_STOP_FRACTION } from "@vcc/solver-cpu";
import { extractMesh } from "./gutcheck-mesh-lib.ts";

const SLOT_KEYS = ["01", "10", "11", "20", "21", "30", "31"] as const;

interface SlotSpec {
  readonly default: number | null;
  readonly overrides: Record<string, number>;
}

interface StageSpec {
  /** Apply the NEXT stage once tick reaches this value; null = final stage. */
  readonly untilTick: number | null;
  readonly rho: number;
  readonly phi: number;
  readonly ggThreshTable: Record<string, number>;
  readonly kappa: SlotSpec;
  readonly mu: SlotSpec;
}

interface FigureSpec {
  readonly label: string;
  readonly rho?: number;
  readonly phi?: number;
  readonly ggThreshTable?: Record<string, number>;
  readonly kappa?: SlotSpec;
  readonly mu?: SlotSpec;
  /**
   * Optional §XII-style environment schedule (Phase 4 G-G events, ADR 0011): stage 1
   * initializes the solver; each later stage is applied atomically at its predecessor's
   * untilTick via the public applyTimelineEnvironment. When present, the top-level
   * single-vector fields are ignored.
   */
  readonly stages?: readonly StageSpec[];
}

function slotRecord(spec: SlotSpec, name: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of SLOT_KEYS) {
    const override = spec.overrides[key];
    const value = override !== undefined ? override : spec.default;
    if (value === undefined || value === null || !Number.isFinite(value)) {
      throw new Error(`${name}: slot ${key} has no value (default missing and no override)`);
    }
    out[`${key[0]},${key[1]}`] = value;
  }
  return out;
}

interface StageVectors {
  readonly rho: number;
  readonly phi: number;
  readonly ggThreshTable: Record<string, number>;
  readonly kappa: SlotSpec;
  readonly mu: SlotSpec;
}

function buildParams(stage: StageVectors): GGParams {
  const ggThreshRecord: Record<string, number> = {};
  for (const key of SLOT_KEYS) {
    const value = stage.ggThreshTable[key];
    if (value === undefined) throw new Error(`ggThreshTable missing slot ${key}`);
    ggThreshRecord[`${key[0]},${key[1]}`] = value;
  }
  return {
    rho: stage.rho,
    phi: stage.phi,
    kappa: paramVector(slotRecord(stage.kappa, "kappa")),
    mu: paramVector(slotRecord(stage.mu, "mu")),
    ggThreshBeta: paramVector(ggThreshRecord),
  };
}

const sevenTuple = (values: Float64Array): GGTimelineEnvironment["kappa"] =>
  [values[1]!, values[2]!, values[3]!, values[4]!, values[5]!, values[6]!, values[7]!] as const;

function environmentFromParams(params: GGParams): GGTimelineEnvironment {
  return {
    rho: params.rho,
    phi: params.phi,
    kappa: sevenTuple(params.kappa),
    mu: sevenTuple(params.mu),
    ggThreshBeta: sevenTuple(params.ggThreshBeta),
  };
}

function resolveStages(spec: FigureSpec): StageSpec[] {
  if (spec.stages !== undefined && spec.stages.length > 0) return [...spec.stages];
  if (
    spec.rho === undefined ||
    spec.phi === undefined ||
    spec.ggThreshTable === undefined ||
    spec.kappa === undefined ||
    spec.mu === undefined
  ) {
    throw new Error("spec needs either stages[] or a complete single vector");
  }
  return [
    {
      untilTick: null,
      rho: spec.rho,
      phi: spec.phi,
      ggThreshTable: spec.ggThreshTable,
      kappa: spec.kappa,
      mu: spec.mu,
    },
  ];
}

interface Cli {
  specFile: string;
  dims: Dims;
  domain: DomainShape;
  ticks: number;
  seed: number;
  noise: number;
  outMesh: string;
  outState: string;
  seedThickness: number;
  record: string;
  spacing: number;
  sigma: number;
  normalDelta: number;
  metricsEvery: number;
}

function parseCli(argv: string[]): Cli {
  const cli: Cli = {
    specFile: "",
    dims: { nx: 1200, ny: 1200, nz: 48 },
    domain: "hexPrism",
    ticks: 60000,
    seed: 1,
    noise: 0,
    outMesh: "",
    outState: "",
    seedThickness: 1,
    record: "",
    spacing: 0.6,
    sigma: 0.45,
    normalDelta: 3,
    metricsEvery: 1000,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} wants a value`);
      return v;
    };
    switch (arg) {
      case "--spec-file":
        cli.specFile = next();
        break;
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
      case "--seed":
        cli.seed = Number(next());
        break;
      case "--noise":
        cli.noise = Number(next());
        break;
      case "--out-mesh":
        cli.outMesh = next();
        break;
      case "--out-state":
        cli.outState = next();
        break;
      case "--seed-thickness":
        cli.seedThickness = Number(next());
        break;
      case "--record":
        cli.record = next();
        break;
      case "--spacing":
        cli.spacing = Number(next());
        break;
      case "--sigma":
        cli.sigma = Number(next());
        break;
      case "--normal-delta":
        cli.normalDelta = Number(next());
        break;
      case "--metrics-every":
        cli.metricsEvery = Number(next());
        break;
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (cli.specFile === "" || cli.outMesh === "" || cli.record === "") {
    throw new Error("--spec-file, --out-mesh and --record are required");
  }
  return cli;
}

function main(): void {
  const cli = parseCli(process.argv.slice(2));
  const t0 = Date.now();
  const spec = JSON.parse(readFileSync(cli.specFile, "utf8")) as FigureSpec;
  const stages = resolveStages(spec);
  const stageParams = stages.map((stage, index) => {
    const params = buildParams(stage);
    const validation = validateParams(params);
    for (const warning of validation.warnings) {
      console.log(`param warning (stage ${index + 1}): ${warning}`);
    }
    if (validation.errors.length > 0) {
      throw new Error(
        `invalid params for ${spec.label} stage ${index + 1}: ${validation.errors.join("; ")}`,
      );
    }
    return params;
  });
  const params = stageParams[0]!;

  const solver = new GGSolver({
    dims: cli.dims,
    params,
    rngSeed: cli.seed,
    noiseEpsilon: cli.noise,
    domain: cli.domain,
    seedThickness: cli.seedThickness,
  });
  console.log(
    `grow-params label="${spec.label}" stages=${stages.length} rho1=${stages[0]!.rho} ` +
      `phi1=${stages[0]!.phi} dims=${cli.dims.nx},${cli.dims.ny},${cli.dims.nz} ` +
      `domain=${cli.domain} ticks<=${cli.ticks} seed=${cli.seed} noise=${cli.noise}`,
  );

  let stopReason = "tick-cap";
  let tick = 0;
  let stageIndex = 0;
  const transitions: Array<{ tick: number; stage: number }> = [];
  let farFieldStop = FAR_FIELD_STOP_FRACTION * stages[0]!.rho;
  for (let t = 1; t <= cli.ticks; t++) {
    solver.step();
    tick = t;
    const boundaryTick = stages[stageIndex]!.untilTick;
    if (boundaryTick !== null && t >= boundaryTick && stageIndex + 1 < stages.length) {
      stageIndex++;
      solver.applyTimelineEnvironment(environmentFromParams(stageParams[stageIndex]!));
      farFieldStop = FAR_FIELD_STOP_FRACTION * stages[stageIndex]!.rho;
      transitions.push({ tick: t, stage: stageIndex + 1 });
      console.log(
        `environment transition at tick=${t}: stage ${stageIndex + 1} ` +
          `(rho=${stages[stageIndex]!.rho})`,
      );
    }
    if (solver.domainContact()) {
      stopReason = "domain-contact";
      break;
    }
    if (t % 25 === 0 && solver.farFieldMean() < farFieldStop) {
      stopReason = "far-field";
      break;
    }
    if (t % cli.metricsEvery === 0) {
      console.log(
        `tick=${t} attached=${solver.attachedCount} ` +
          `farField=${solver.farFieldMean().toPrecision(6)} ` +
          `elapsed=${((Date.now() - t0) / 1000).toFixed(1)}s`,
      );
    }
  }
  console.log(`stop reason=${stopReason} tick=${tick} attached=${solver.attachedCount}`);

  const state = solver.state();
  if (cli.outState !== "") {
    // Full GG checkpoint (public codec) so partial verdicts can re-extract or resume
    // analysis without regrowing. Metrics block omitted (observational tooling).
    mkdirSync(dirname(cli.outState), { recursive: true });
    writeFileSync(cli.outState, encodeCheckpoint(state, null));
    console.log(`wrote state checkpoint ${cli.outState}`);
  }
  const mesh = extractMesh(state, {
    spacing: cli.spacing,
    sigma: cli.sigma,
    iso: 0.5,
    margin: 4,
    normalDelta: cli.normalDelta,
    source: {
      figure: spec.label,
      spec,
      dims: cli.dims,
      domain: cli.domain,
      seed: cli.seed,
      noiseEpsilon: cli.noise,
      tick,
      stopReason,
    },
    log: (line) => console.log(line),
  });
  mkdirSync(dirname(cli.outMesh), { recursive: true });
  writeFileSync(cli.outMesh, mesh.bytes);
  mkdirSync(dirname(cli.record), { recursive: true });
  const record = {
    label: spec.label,
    spec,
    stageTransitions: transitions,
    dims: cli.dims,
    domain: cli.domain,
    seed: cli.seed,
    noise: cli.noise,
    tickCap: cli.ticks,
    stopReason,
    tick,
    attachedCount: solver.attachedCount,
    farFieldMean: solver.farFieldMean(),
    mesh: {
      path: cli.outMesh,
      vertexCount: mesh.vertexCount,
      triangleCount: mesh.triangleCount,
      bboxCartesian: mesh.bboxCartesian,
      extraction: { spacing: cli.spacing, sigma: cli.sigma, normalDelta: cli.normalDelta },
    },
    elapsedSeconds: Math.round((Date.now() - t0) / 1000),
    evidenceStatus: "unvalidated eyeball exploration; no gate semantics",
  };
  writeFileSync(cli.record, JSON.stringify(record, null, 1));
  console.log(
    `wrote ${cli.outMesh} (${mesh.bytes.length} bytes) and ${cli.record} in ` +
      `${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

main();
