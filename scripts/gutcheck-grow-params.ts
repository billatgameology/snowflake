// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): grow a crystal from an
// ARBITRARY G-G parameter vector (the paper's case studies cover many vectors the four
// presets don't), for the reproduce-all-paper-figures sweep. Drives GGSolver via the
// public API only; replicates the runner's observational stop rules (far-field 2/3*rho,
// 65% domain contact, tick cap) without touching runner/. Emits a final level-set mesh
// plus a JSON run record. Observational tooling; no gate semantics.
//
//   node scripts/gutcheck-grow-params.ts --spec-file fig21.json \
//        --dims 1200,1200,48 --ticks 60000 \
//        --out-mesh out/gutcheck-gg-realism/large/figs/fig21-mesh.bin \
//        --record evidence/gutcheck-gg-realism/fig-records/fig21-record.json \
//        [--seed 1] [--noise 0] [--domain hexPrism]
//        [--spacing 0.6] [--sigma 0.45] [--normal-delta 3] [--metrics-every 1000]
// Direct record writes do not update evidence/MANIFEST.json; run `npm run evidence:pin` after.
//
// Spec file shape (keys "01".."31" index the G-G attachment thresholds by (nT, nZ); kappa/mu default + overrides):
//   { "label": "Fig. 21", "rho": 0.1, "phi": 0,
//     "ggThreshTable": {"01":2.5,"10":2,"11":2,"20":2,"21":1,"30":1,"31":1},
//     "kappa": {"default":0.1,"overrides":{}}, "mu": {"default":0.001,"overrides":{}} }

import { createHash } from "node:crypto";
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  encodeCheckpoint,
  paramVector,
  validateParams,
  type Dims,
  type DomainShape,
  type GGParams,
  type GGTimelineEnvironment,
} from "@vcc/core";
import {
  GGPlusSolver,
  GGSolver,
  FAR_FIELD_STOP_FRACTION,
  type GGSeedGeometryV1,
} from "@vcc/solver-cpu";
import { buildGutcheckRunIdentity } from "./gutcheck-evidence-lib.ts";
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
  /** Optional deterministic GG+ seed; omitted specs retain the canonical legacy seed path. */
  readonly seedGeometry?: GGSeedGeometryV1;
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

interface SeedMetadata {
  readonly geometry: GGSeedGeometryV1;
  readonly siteCount: number;
  readonly sitesSha256: string;
  readonly radiusBound: number;
  readonly thicknessSpan: number;
}

function seedMetadata(
  solver: GGSolver,
  geometry: GGSeedGeometryV1,
): SeedMetadata {
  const sites: number[] = [];
  for (let site = 0; site < solver.a.length; site++) {
    if (solver.a[site] === 1) sites.push(site);
  }
  let radiusBound = 0;
  let kMin = Infinity;
  let kMax = -Infinity;
  const [ic, jc] = solver.center;
  const { nx, ny } = solver.dims;
  for (const site of sites) {
    const i = site % nx;
    const j = Math.floor(site / nx) % ny;
    const k = Math.floor(site / (nx * ny));
    const di = i - ic;
    const dj = j - jc;
    radiusBound = Math.max(radiusBound, Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj)));
    kMin = Math.min(kMin, k);
    kMax = Math.max(kMax, k);
  }
  return {
    geometry,
    siteCount: sites.length,
    sitesSha256: createHash("sha256").update(JSON.stringify(sites)).digest("hex"),
    radiusBound,
    thicknessSpan: sites.length === 0 ? 0 : kMax - kMin + 1,
  };
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

/**
 * Write a payload of any size. `writeFileSync` validates the whole buffer against Node's
 * single-write cap (2147483647 bytes) and throws BEFORE writing anything, leaving a
 * zero-byte file — which is how the Fig. 14 v2 run lost 17 hours of compute at its final
 * step (2.67 GB checkpoint at 1280,1280,96; see docs/plans/explore-gg-realism-gutcheck.md).
 * Anything at or under 1 GiB takes the plain path; larger payloads are written in chunks.
 */
function writeLarge(path: string, bytes: Uint8Array): void {
  const CHUNK = 1 << 30; // 1 GiB, comfortably under the 2 GiB single-write cap
  if (bytes.byteLength <= CHUNK) {
    writeFileSync(path, bytes);
    return;
  }
  const fd = openSync(path, "w");
  try {
    let offset = 0;
    while (offset < bytes.byteLength) {
      const length = Math.min(CHUNK, bytes.byteLength - offset);
      // writeSync may report a short write; advance by what it actually wrote.
      offset += writeSync(fd, bytes, offset, length);
    }
  } finally {
    closeSync(fd);
  }
}

// --growth-out limits, mirrored from the website's strict decoder (growthAsset.ts): a file
// that violates them would be produced successfully here and then refused by the one consumer
// that matters, so refuse it at the writer instead.
const GROWTH_MAX_EVENTS = 8 * 1024 * 1024;
const GROWTH_MAX_HEADER_BYTES = 1024 * 1024;

/**
 * Attachment-event sink for --growth-out. Seeds are tick-0 events; every step() appends the
 * solver's lastAttached at that tick, so events are chronological with seeds first — the
 * order the reference run-B asset uses. Interleaved (flat index, tick) pairs in a doubling
 * Uint32Array; flat index = k*nx*ny + j*nx + i (i fastest), the solver's own layout.
 */
class GrowthEvents {
  private pairs = new Uint32Array(1 << 16);
  private count = 0;
  seedCount = 0;
  private iMin: number;
  private iMax = 0;
  private jMin: number;
  private jMax = 0;
  private kMin: number;
  private kMax = 0;

  private readonly dims: Dims;

  constructor(dims: Dims) {
    this.dims = dims;
    this.iMin = dims.nx - 1;
    this.jMin = dims.ny - 1;
    this.kMin = dims.nz - 1;
  }

  private push(index: number, tick: number): void {
    if (this.count === GROWTH_MAX_EVENTS) {
      throw new Error(`--growth-out refuses more than ${GROWTH_MAX_EVENTS} events (decoder cap)`);
    }
    if (this.count * 2 === this.pairs.length) {
      const grown = new Uint32Array(this.pairs.length * 2);
      grown.set(this.pairs);
      this.pairs = grown;
    }
    this.pairs[this.count * 2] = index;
    this.pairs[this.count * 2 + 1] = tick;
    this.count++;
    const { nx, ny } = this.dims;
    const i = index % nx;
    const j = Math.floor(index / nx) % ny;
    const k = Math.floor(index / (nx * ny));
    if (i < this.iMin) this.iMin = i;
    if (i > this.iMax) this.iMax = i;
    if (j < this.jMin) this.jMin = j;
    if (j > this.jMax) this.jMax = j;
    if (k < this.kMin) this.kMin = k;
    if (k > this.kMax) this.kMax = k;
  }

  recordSeeds(a: Uint8Array): void {
    for (let index = 0; index < a.length; index++) {
      if (a[index] === 1) this.push(index, 0);
    }
    this.seedCount = this.count;
  }

  recordStep(attached: readonly number[], tick: number): void {
    for (const index of attached) this.push(index, tick);
  }

  get eventCount(): number {
    return this.count;
  }

  crop(padding: number): Record<string, number> {
    const { nx, ny, nz } = this.dims;
    return {
      iMin: Math.max(0, this.iMin - padding),
      iMax: Math.min(nx - 1, this.iMax + padding),
      jMin: Math.max(0, this.jMin - padding),
      jMax: Math.min(ny - 1, this.jMax + padding),
      kMin: Math.max(0, this.kMin - padding),
      kMax: Math.min(nz - 1, this.kMax + padding),
      padding,
    };
  }

  /** u32 header length, UTF-8 JSON header, then eventCount x (u32 index, u32 tick), all LE. */
  encode(header: Record<string, unknown>): Uint8Array {
    const headerBytes = new TextEncoder().encode(JSON.stringify(header));
    if (headerBytes.byteLength === 0 || headerBytes.byteLength > GROWTH_MAX_HEADER_BYTES) {
      throw new Error(`--growth-out header is ${headerBytes.byteLength} bytes, outside the decoder's range`);
    }
    const out = new Uint8Array(4 + headerBytes.byteLength + this.count * 8);
    const view = new DataView(out.buffer);
    view.setUint32(0, headerBytes.byteLength, true);
    out.set(headerBytes, 4);
    let offset = 4 + headerBytes.byteLength;
    for (let event = 0; event < this.count; event++) {
      view.setUint32(offset, this.pairs[event * 2]!, true);
      view.setUint32(offset + 4, this.pairs[event * 2 + 1]!, true);
      offset += 8;
    }
    return out;
  }
}

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
  /** When set, also dump a timeline of meshes here (gutcheck-anim-v1) for the viewer. */
  framesDir: string;
  framesEvery: number;
  /**
   * When set, also write the attachment-event history here (gutcheck-growth-v1): for every
   * site that ever froze, the tick it froze on. This is the website's replay input — one
   * u32 header-length prefix, a strict JSON header, then eventCount x (u32 flat index,
   * u32 attach tick) little-endian, flat index = k*nx*ny + j*nx + i. ~8 bytes per attached
   * site, so a whole growth history ships in single-digit MB where the mesh timeline of the
   * same run is GB.
   */
  growthOut: string;
  growthPadding: number;
  /** Pinned endpoint from the original run's record; warn-only (arm64/x64 ULP divergence). */
  expectTick: number | null;
  expectAttached: number | null;
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
    framesDir: "",
    framesEvery: 100,
    growthOut: "",
    growthPadding: 2,
    expectTick: null,
    expectAttached: null,
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
      case "--frames-dir":
        cli.framesDir = next();
        break;
      case "--frames-every":
        cli.framesEvery = Number(next());
        break;
      case "--growth-out":
        cli.growthOut = next();
        break;
      case "--growth-padding":
        cli.growthPadding = Number(next());
        break;
      case "--expect-tick":
        cli.expectTick = Number(next());
        break;
      case "--expect-attached":
        cli.expectAttached = Number(next());
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
  if (spec.seedGeometry !== undefined && cli.seedThickness !== 1) {
    throw new Error("a spec seedGeometry cannot be combined with non-default --seed-thickness");
  }
  const runIdentity = buildGutcheckRunIdentity({
    spec,
    dims: cli.dims,
    domain: cli.domain,
    tickCap: cli.ticks,
    rngSeed: cli.seed,
    noiseEpsilon: cli.noise,
    seedThickness: cli.seedThickness,
    extraction: {
      spacing: cli.spacing,
      sigma: cli.sigma,
      iso: 0.5,
      margin: 4,
      normalDelta: cli.normalDelta,
    },
  });
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

  const solver = spec.seedGeometry === undefined
    ? new GGSolver({
        dims: cli.dims,
        params,
        rngSeed: cli.seed,
        noiseEpsilon: cli.noise,
        domain: cli.domain,
        seedThickness: cli.seedThickness,
      })
    : new GGPlusSolver({
        dims: cli.dims,
        params,
        rngSeed: cli.seed,
        noiseEpsilon: cli.noise,
        domain: cli.domain,
        seedGeometry: spec.seedGeometry,
      });
  const effectiveSeedGeometry: GGSeedGeometryV1 = spec.seedGeometry ?? {
    version: 1,
    kind: "hexPrism",
    radius: 2,
    thickness: cli.seedThickness,
  };
  const seed = seedMetadata(solver, effectiveSeedGeometry);
  console.log(
    `grow-params label="${spec.label}" stages=${stages.length} rho1=${stages[0]!.rho} ` +
      `phi1=${stages[0]!.phi} dims=${cli.dims.nx},${cli.dims.ny},${cli.dims.nz} ` +
      `domain=${cli.domain} ticks<=${cli.ticks} seed=${cli.seed} noise=${cli.noise}`,
  );

  // Optional attachment-event history (--growth-out). The seed is the t=0 attached field;
  // everything after comes from lastAttached, captured immediately after each step() below.
  const growth = cli.growthOut !== "" ? new GrowthEvents(cli.dims) : null;
  if (growth !== null) {
    growth.recordSeeds(solver.state().a);
    console.log(`growth events: ${growth.seedCount} seed site(s)`);
  }

  // Optional growth timeline. Emitting frames from HERE rather than from
  // gutcheck-animate-grow.ts is deliberate: that script only knows the four built-in presets,
  // so it cannot replay an arbitrary parameter vector or a staged schedule. This loop already
  // has the spec, the stage transitions and the stopping rules, so the timeline it produces
  // ends exactly where the plain run would rather than grinding on to the tick cap.
  const frames: Array<{
    file: string;
    tick: number;
    vertexCount: number;
    triangleCount: number;
    attachedCount: number;
  }> = [];
  let finalBBox: Record<string, number> | null = null;
  const framesOn = cli.framesDir !== "";
  if (framesOn) mkdirSync(cli.framesDir, { recursive: true });

  const writeAnimManifest = (complete: boolean): void => {
    writeFileSync(
      join(cli.framesDir, "manifest.json"),
      JSON.stringify(
        {
          format: "gutcheck-anim-v1",
          complete,
          config: {
            // The viewer's science panel reads config.*; keep the preset-run shape and add
            // the spec so a timeline can be traced back to the parameters that made it.
            preset: spec.label,
            spec,
            dims: cli.dims,
            domain: cli.domain,
            ticks: cli.ticks,
            every: cli.framesEvery,
            seed: cli.seed,
            noise: cli.noise,
            seedThickness: cli.seedThickness,
            seedGeometry: seed.geometry,
            seedSiteCount: seed.siteCount,
            seedSitesSha256: seed.sitesSha256,
            runIdentity,
            extraction: {
              spacing: cli.spacing,
              sigma: cli.sigma,
              iso: 0.5,
              margin: 4,
              normalDelta: cli.normalDelta,
            },
          },
          frames,
          finalBBox,
          elapsedSeconds: Math.round((Date.now() - t0) / 1000),
        },
        null,
        1,
      ),
    );
  };

  const snapshot = (): void => {
    const snapState = solver.state();
    const snapTick = snapState.tick;
    const mesh = extractMesh(snapState, {
      spacing: cli.spacing,
      sigma: cli.sigma,
      iso: 0.5,
      margin: 4,
      normalDelta: cli.normalDelta,
      source: { figure: spec.label, tick: snapTick, seed: cli.seed, noiseEpsilon: cli.noise },
    });
    const file = `mesh-t${String(snapTick).padStart(6, "0")}.bin`;
    writeLarge(join(cli.framesDir, file), mesh.bytes);
    frames.push({
      file,
      tick: snapTick,
      vertexCount: mesh.vertexCount,
      triangleCount: mesh.triangleCount,
      attachedCount: solver.attachedCount,
    });
    finalBBox = mesh.bboxCartesian;
    // Rewritten every frame so a partially complete timeline is already viewable.
    writeAnimManifest(false);
  };

  let stopReason = "tick-cap";
  let tick = 0;
  let stageIndex = 0;
  const transitions: Array<{ tick: number; stage: number }> = [];
  if (framesOn) snapshot(); // frame 0 is the seed itself
  let farFieldStop = FAR_FIELD_STOP_FRACTION * stages[0]!.rho;
  for (let t = 1; t <= cli.ticks; t++) {
    solver.step();
    tick = t;
    // Before any break: attachments from a stopping step still belong to the history.
    if (growth !== null) growth.recordStep(solver.lastAttached, t);
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
    if (framesOn && t % cli.framesEvery === 0) snapshot();
    if (t % cli.metricsEvery === 0) {
      console.log(
        `tick=${t} attached=${solver.attachedCount} ` +
          `farField=${solver.farFieldMean().toPrecision(6)} ` +
          `elapsed=${((Date.now() - t0) / 1000).toFixed(1)}s`,
      );
    }
  }
  // The stopping rules break mid-interval, so the last grown state is usually not on a
  // frame boundary; capture it or the timeline ends short of the crystal that was kept.
  if (framesOn && (frames.length === 0 || frames[frames.length - 1]!.tick !== tick)) snapshot();
  // `complete: true` is deliberately NOT written here. Timeline completion is the LAST thing
  // published, after the mesh and the record: a crash between a complete-marked manifest and
  // the record used to leave a crystal that every resume skipped forever, with no provenance
  // (round-2 review, 2026-08-12). The batch predicate requires record AND timeline; ordering
  // completion last means any crash leaves a state the resume regrows.
  console.log(`stop reason=${stopReason} tick=${tick} attached=${solver.attachedCount}`);
  // A schedule that never fires is not a staged crystal, it is a single-stage one wearing a
  // staged label. Two sweep entries (branch1 -> plate3 at 8000 and at 12000) hit domain
  // contact at tick 7438 and produced byte-identical geometry to each other on 2026-08-07;
  // nothing in the output said so. Say it loudly, and record it.
  const unfired = stages.length - 1 - transitions.length;
  if (unfired > 0) {
    console.warn(
      `WARNING: ${unfired} of ${stages.length - 1} stage transition(s) never fired — the run ` +
        `ended at tick ${tick} (${stopReason}) before reaching ` +
        `${stages.slice(transitions.length, stages.length - 1).map((s) => String(s.untilTick)).join(", ")}. ` +
        `This crystal is effectively single-stage; raise the domain or lower the switch tick.`,
    );
  }

  const state = solver.state();
  if (cli.outState !== "") {
    // Full GG checkpoint (public codec) so partial verdicts can re-extract or resume
    // analysis without regrowing. Metrics block omitted (observational tooling).
    mkdirSync(dirname(cli.outState), { recursive: true });
    writeLarge(cli.outState, encodeCheckpoint(state, null));
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
  writeLarge(cli.outMesh, mesh.bytes);

  // Growth asset before the record: the record is the completion marker, so its presence
  // must imply every product it names already exists (same crash-ordering rule as the
  // anim manifest's complete flag).
  let growthSummary: Record<string, unknown> | null = null;
  if (growth !== null) {
    if (growth.eventCount !== solver.attachedCount) {
      throw new Error(
        `growth events (${growth.eventCount}) disagree with attachedCount ` +
          `(${solver.attachedCount}); the history is not a faithful replay — refusing to write`,
      );
    }
    if (cli.expectTick !== null && cli.expectTick !== tick) {
      console.warn(`WARNING: endpoint tick ${tick} differs from expected ${cli.expectTick}`);
    }
    if (cli.expectAttached !== null && cli.expectAttached !== solver.attachedCount) {
      console.warn(
        `WARNING: endpoint attachedCount ${solver.attachedCount} differs from expected ${cli.expectAttached}`,
      );
    }
    const header = {
      format: "gutcheck-growth-v1",
      eventCount: growth.eventCount,
      attachedCount: solver.attachedCount,
      seedCount: growth.seedCount,
      finalTick: tick,
      terminationReason: stopReason,
      crop: growth.crop(cli.growthPadding),
      config: {
        preset: spec.label,
        dims: cli.dims,
        domain: cli.domain,
        tickCap: cli.ticks,
        rngSeed: cli.seed,
        noiseEpsilon: cli.noise,
        // Keep numeric bounds for the existing website decoder, and carry the exact
        // versioned geometry plus a digest of its canonical flat-index set for GG+.
        seedRadius: seed.radiusBound,
        seedThickness: seed.thicknessSpan,
        seedGeometry: seed.geometry,
        seedSiteCount: seed.siteCount,
        seedSitesSha256: seed.sitesSha256,
        center: [...state.center],
        farField: state.farField,
        params: {
          rho: params.rho,
          phi: params.phi,
          kappa: [null, ...sevenTuple(params.kappa)],
          mu: [null, ...sevenTuple(params.mu)],
          ggThreshBeta: [null, ...sevenTuple(params.ggThreshBeta)],
        },
      },
      lattice: {
        embedding: "x=i+j/2;y=sqrt(3)*j/2;z=k",
        indexOrder: "i-fastest-j-next-k-slowest",
      },
      spec,
      stageTransitions: transitions,
      unfiredTransitions: unfired,
      runIdentity,
      source: {
        label: `${spec.label} — G-G attachment events`,
        command: {
          argv: process.argv.slice(2),
          cwd: process.cwd(),
          script: process.argv[1] ?? "",
          executable: process.execPath,
        },
        runtime: {
          platform: process.platform,
          architecture: process.arch,
          node: process.version,
          endianness: "LE",
        },
        endpoint: {
          ...(cli.expectTick !== null ? { expectedTick: cli.expectTick } : {}),
          ...(cli.expectAttached !== null ? { expectedAttachedCount: cli.expectAttached } : {}),
          measuredTick: tick,
          measuredAttachedCount: solver.attachedCount,
        },
      },
    };
    const bytes = growth.encode(header);
    mkdirSync(dirname(cli.growthOut), { recursive: true });
    writeLarge(cli.growthOut, bytes);
    growthSummary = {
      path: cli.growthOut,
      format: "gutcheck-growth-v1",
      eventCount: growth.eventCount,
      seedCount: growth.seedCount,
      bytes: bytes.byteLength,
    };
    console.log(
      `wrote growth events ${cli.growthOut}: ${growth.eventCount} event(s), ` +
        `${(bytes.byteLength / 1e6).toFixed(1)} MB`,
    );
  }

  mkdirSync(dirname(cli.record), { recursive: true });
  const record = {
    label: spec.label,
    spec,
    stageTransitions: transitions,
    /** Scheduled transitions the run ended before reaching; >0 means effectively single-stage. */
    unfiredTransitions: unfired,
    dims: cli.dims,
    domain: cli.domain,
    seed: cli.seed,
    noise: cli.noise,
    seedThickness: seed.thicknessSpan,
    seedGeometry: seed.geometry,
    seedSiteCount: seed.siteCount,
    seedSitesSha256: seed.sitesSha256,
    tickCap: cli.ticks,
    runIdentity,
    stopReason,
    tick,
    attachedCount: solver.attachedCount,
    farFieldMean: solver.farFieldMean(),
    mesh: {
      path: cli.outMesh,
      vertexCount: mesh.vertexCount,
      triangleCount: mesh.triangleCount,
      bboxCartesian: mesh.bboxCartesian,
      extraction: {
        spacing: cli.spacing,
        sigma: cli.sigma,
        iso: 0.5,
        margin: 4,
        normalDelta: cli.normalDelta,
      },
    },
    ...(growthSummary !== null ? { growth: growthSummary } : {}),
    elapsedSeconds: Math.round((Date.now() - t0) / 1000),
    evidenceStatus: "unvalidated eyeball exploration; no gate semantics",
  };
  // Temp + rename: a record either exists complete or not at all. A killed writer used to
  // leave truncated JSON that grow-batch's existence check treated as "grown" forever.
  const recordTmp = `${cli.record}.${String(process.pid)}.tmp`;
  writeFileSync(recordTmp, JSON.stringify(record, null, 1));
  renameSync(recordTmp, cli.record);
  if (framesOn) {
    writeAnimManifest(true); // only now that mesh + record are both published
    console.log(`timeline: ${frames.length} frames -> ${cli.framesDir}`);
  }
  console.log(
    `wrote ${cli.outMesh} (${mesh.bytes.length} bytes) and ${cli.record} in ` +
      `${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

main();
