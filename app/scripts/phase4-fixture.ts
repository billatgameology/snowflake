// Tiny coherent Phase 4 evidence-bundle FIXTURES for the visual harness and its tests.
//
// These are synthetic, hand-built states at 16^3 — clearly NOT gate evidence and never
// written anywhere near out/phase4/. They exist so the harness's verification and capture
// pipeline can be proven end-to-end (and mutation-tested) without running the hours-scale
// gates. The bundles are internally coherent by construction: canonical JSON with sorted
// keys and a trailing newline, real SHA-256s, real GG v1 / LK v2 checkpoints produced by the
// @vcc/core encoders, report run summaries whose field hashes are computed from the encoded
// states, and an artifact index binding the whole graph.
//
// Usage: node app/scripts/phase4-fixture.ts <targetDir>   (writes <targetDir>/pass-a and
// <targetDir>/pass-b). Tests import the builder functions and write to temp directories.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  GG_PRESETS,
  cellCount,
  computeMetrics,
  encodeCheckpoint,
  encodeLKCheckpoint,
  ggParamsFromTimelineEnvironment,
  ggTimelineEnvironmentFromParams,
  hexDistance,
  paramSlot,
  type Dims,
  type GGTimelineEnvironment,
  type LKRunState,
  type SolverState,
} from "@vcc/core";
import { CAPPED_COLUMN_EVENT_ENVIRONMENT, cappedColumnSchedule } from "../src/scenarios.ts";
import {
  SYNTHETIC_FIXTURE_NOTICE,
  canonicalJsonBytesOf,
  sha256HexNode,
} from "./phase4-verify.ts";

const DIMS: Dims = { nx: 16, ny: 16, nz: 16 };
const CENTER: readonly [number, number, number] = [8, 8, 8];
const RADIUS = 7; // min(8, 7, 8, 7): the inscribed hexPrism active radius at 16^3
const HALF_Z = 7;

type Shape = "plate" | "column" | "ring" | "capped" | "star";

function activeCell(i: number, j: number, k: number): boolean {
  return (
    hexDistance(i - CENTER[0], j - CENTER[1]) <= RADIUS && Math.abs(k - CENTER[2]) <= HALF_Z
  );
}

function attachedByShape(shape: Shape, i: number, j: number, k: number): boolean {
  const dist = hexDistance(i - CENTER[0], j - CENTER[1]);
  const [ic, jc, kc] = CENTER;
  switch (shape) {
    case "plate":
      return k === kc && dist <= 2;
    case "column":
      return i === ic && j === jc && Math.abs(k - kc) <= 3;
    case "ring":
      return k === kc && dist === 2;
    case "capped":
      return (
        (i === ic && j === jc && Math.abs(k - kc) <= 4) ||
        ((k === kc - 4 || k === kc + 4) && dist <= 2)
      );
    case "star": {
      if (k !== kc) return false;
      if (dist === 0) return true;
      // Six arms along the T-neighbor axes.
      const di = i - ic;
      const dj = j - jc;
      const onAxis =
        (dj === 0 && di !== 0) || (di === 0 && dj !== 0) || (di === -dj && di !== 0);
      return onAxis && dist <= 5;
    }
  }
}

interface FixtureOccupancy {
  readonly a: Uint8Array;
  readonly boundary: Uint8Array; // free active cells adjacent to an attached cell
}

function buildOccupancy(shape: Shape): FixtureOccupancy {
  const n = cellCount(DIMS);
  const a = new Uint8Array(n);
  const plane = DIMS.nx * DIMS.ny;
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        if (activeCell(i, j, k) && attachedByShape(shape, i, j, k)) {
          a[k * plane + j * DIMS.nx + i] = 1;
        }
      }
    }
  }
  const boundary = new Uint8Array(n);
  const offsets: ReadonlyArray<readonly [number, number, number]> = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [1, -1, 0], [-1, 1, 0], [0, 0, 1], [0, 0, -1],
  ];
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        const x = k * plane + j * DIMS.nx + i;
        if (a[x] === 1 || !activeCell(i, j, k)) continue;
        for (const [di, dj, dk] of offsets) {
          const ni = i + di;
          const nj = j + dj;
          const nk = k + dk;
          if (ni < 0 || ni >= DIMS.nx || nj < 0 || nj >= DIMS.ny || nk < 0 || nk >= DIMS.nz) {
            continue;
          }
          if (a[nk * plane + nj * DIMS.nx + ni] === 1) {
            boundary[x] = 1;
            break;
          }
        }
      }
    }
  }
  return { a, boundary };
}

// ── Pass A (GG v1) fixture runs ────────────────────────────────────────────────────────────

function ggEnvironmentWithThresholdBasal(base: GGTimelineEnvironment, ggThreshBeta01: number): GGTimelineEnvironment {
  return {
    rho: base.rho,
    phi: base.phi,
    kappa: [...base.kappa] as unknown as GGTimelineEnvironment["kappa"],
    mu: [...base.mu] as unknown as GGTimelineEnvironment["mu"],
    ggThreshBeta: [ggThreshBeta01, ...base.ggThreshBeta.slice(1)] as unknown as GGTimelineEnvironment["ggThreshBeta"],
  };
}

interface GGFixtureRun {
  readonly id: string;
  readonly shape: Shape;
  /** The run's config environment (initial); header params use the FINAL environment. */
  readonly params: GGTimelineEnvironment;
  readonly finalParams: GGTimelineEnvironment;
  readonly schedule: unknown;
  readonly habitControl: { u: number; ggThreshBeta01: number } | null;
  readonly rngSeed?: number;
  readonly noiseEpsilon?: number;
}

function ggFixtureRuns(): GGFixtureRun[] {
  const plate = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);
  const hollow = ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn);
  const dendrite = ggTimelineEnvironmentFromParams({
    ...GG_PRESETS.dendrite,
    rho: 0.105,
  });
  const u0 = ggEnvironmentWithThresholdBasal(plate, 3);
  const habit = [
    ["A-HABIT-U0", 0, 3, "plate"],
    ["A-HABIT-U0P25", 0.25, 2.5, "plate"],
    ["A-HABIT-U0P5", 0.5, 2, "plate"],
    ["A-HABIT-U0P75", 0.75, 1.5, "column"],
    ["A-HABIT-U1", 1, 1, "column"],
  ] as const;
  const schedule = cappedColumnSchedule();
  return [
    ...habit.map(([id, u, threshold, shape]) => {
      const params = ggEnvironmentWithThresholdBasal(plate, threshold);
      return {
        id,
        shape,
        params,
        finalParams: params,
        schedule: null,
        habitControl: { u, ggThreshBeta01: threshold },
      };
    }),
    {
      id: "A-DEPLETION",
      shape: "ring",
      params: hollow,
      finalParams: hollow,
      schedule: null,
      habitControl: null,
    },
    ...[1, 2, 3].map((rngSeed) => ({
      id: `A-HOLLOW-SEED-${rngSeed}`,
      shape: "ring" as const,
      params: hollow,
      finalParams: hollow,
      schedule: null,
      habitControl: null,
      rngSeed,
      noiseEpsilon: 0.001,
    })),
    {
      id: "A-HOLLOW-SEED-1-REPLAY",
      shape: "ring",
      params: hollow,
      finalParams: hollow,
      schedule: null,
      habitControl: null,
      rngSeed: 1,
      noiseEpsilon: 0.001,
    },
    {
      id: "A-TIMELINE",
      shape: "capped",
      params: hollow,
      finalParams: CAPPED_COLUMN_EVENT_ENVIRONMENT,
      schedule,
      habitControl: null,
    },
    {
      id: "A-BRANCH-DENDRITE",
      shape: "star",
      params: dendrite,
      finalParams: dendrite,
      schedule: null,
      habitControl: null,
    },
    {
      id: "A-BRANCH-COMPARATOR",
      shape: "plate",
      params: u0,
      finalParams: u0,
      schedule: null,
      habitControl: null,
    },
  ];
}

function ggFixtureState(run: GGFixtureRun, tick: number): SolverState {
  const { a } = buildOccupancy(run.shape);
  const n = a.length;
  const b = new Float64Array(n);
  const d = new Float64Array(n);
  const plane = DIMS.nx * DIMS.ny;
  const params = ggParamsFromTimelineEnvironment(run.finalParams);
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        const x = k * plane + j * DIMS.nx + i;
        if (!activeCell(i, j, k)) continue; // wall cells stay a=b=d=0
        if (a[x] === 1) {
          b[x] = 1;
          d[x] = 0; // attached cells must carry d=0
        } else {
          // A gentle outward gradient so slices show structure: depleted near the crystal.
          const dist = hexDistance(i - CENTER[0], j - CENTER[1]);
          d[x] = params.rho * (0.3 + (0.7 * Math.min(dist, RADIUS)) / RADIUS);
        }
      }
    }
  }
  return {
    dims: DIMS,
    tick,
    rngSeed: run.rngSeed ?? 1,
    noiseEpsilon: run.noiseEpsilon ?? 0,
    farField: "reflecting",
    domain: "hexPrism",
    params,
    a,
    b,
    d,
    center: CENTER,
  };
}

// ── Pass B (LK v2) fixture runs ────────────────────────────────────────────────────────────

interface LKFixtureRun {
  readonly id: string;
  readonly shape: Shape;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly finalTempC: number;
  readonly schedule: unknown;
  readonly rngSeed?: number;
  readonly noiseEpsilon?: number;
}

const LK_COMMON = {
  surfacePolicy: "aggregate-hv-g1h1-v4",
  dxUm: 0.35,
  pressurePa: 101325,
  paramSet: "CAK_A1",
  cflFill: 0.1,
  relaxTol: 1e-9,
  divTol: 1e-7,
  relaxMaxSweeps: 200000,
} as const;

function lkFixtureRuns(): LKFixtureRun[] {
  const timelineSchedule = {
    version: 1,
    mode: "abrupt",
    operator: "LibbrechtKinetics",
    initialEnvironment: { tempC: -15, sigmaInfinity: 0.002 },
    events: [
      {
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "zExtent", value: 16 },
        environment: { tempC: -5, sigmaInfinity: 0.002 },
      },
    ],
  };
  return [
    { id: "B-HABIT-TM5", shape: "plate", tempC: -5, sigmaInfinity: 0.002, finalTempC: -5, schedule: null },
    { id: "B-HABIT-TM7P5", shape: "plate", tempC: -7.5, sigmaInfinity: 0.002, finalTempC: -7.5, schedule: null },
    { id: "B-HABIT-TM10", shape: "column", tempC: -10, sigmaInfinity: 0.002, finalTempC: -10, schedule: null },
    { id: "B-HABIT-TM12P5", shape: "column", tempC: -12.5, sigmaInfinity: 0.002, finalTempC: -12.5, schedule: null },
    { id: "B-HABIT-TM15", shape: "column", tempC: -15, sigmaInfinity: 0.002, finalTempC: -15, schedule: null },
    ...[1, 2, 3].map((rngSeed) => ({
      id: `B-HOLLOW-SEED-${rngSeed}`,
      shape: "ring" as const,
      tempC: -15,
      sigmaInfinity: 0.002,
      finalTempC: -15,
      schedule: null,
      rngSeed,
      noiseEpsilon: 0.001,
    })),
    { id: "B-HOLLOW-SEED-1-REPLAY", shape: "ring", tempC: -15, sigmaInfinity: 0.002, finalTempC: -15, schedule: null, rngSeed: 1, noiseEpsilon: 0.001 },
    { id: "B-TIMELINE", shape: "capped", tempC: -15, sigmaInfinity: 0.002, finalTempC: -5, schedule: timelineSchedule },
    { id: "B-BRANCH", shape: "star", tempC: -5, sigmaInfinity: 0.01, finalTempC: -5, schedule: null },
  ];
}

function lkFixtureState(run: LKFixtureRun, tick: number): LKRunState {
  const { a, boundary } = buildOccupancy(run.shape);
  const n = a.length;
  const f = new Float64Array(n);
  const sigma = new Float64Array(n);
  const plane = DIMS.nx * DIMS.ny;
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        const x = k * plane + j * DIMS.nx + i;
        if (!activeCell(i, j, k)) continue; // wall cells stay a=f=sigma=0
        if (a[x] === 1) {
          f[x] = 1; // attached cells must carry f=1, sigma=0
        } else {
          const dist = hexDistance(i - CENTER[0], j - CENTER[1]);
          sigma[x] = run.sigmaInfinity * (0.2 + (0.8 * Math.min(dist, RADIUS)) / RADIUS);
          if (boundary[x] === 1) f[x] = 0.3;
        }
      }
    }
  }
  return {
    dims: DIMS,
    tick,
    simTimeSeconds: tick * 0.01,
    rngSeed: run.rngSeed ?? 1,
    noiseEpsilon: run.noiseEpsilon ?? 0,
    domain: "hexPrism",
    center: CENTER,
    tempC: run.finalTempC,
    sigmaInfinity: run.sigmaInfinity,
    dxUm: LK_COMMON.dxUm,
    pressurePa: LK_COMMON.pressurePa,
    paramSet: LK_COMMON.paramSet,
    cflFill: LK_COMMON.cflFill,
    relaxTol: LK_COMMON.relaxTol,
    divTol: LK_COMMON.divTol,
    relaxMaxSweeps: LK_COMMON.relaxMaxSweeps,
    surfacePolicy: LK_COMMON.surfacePolicy,
    farField: "dirichlet",
    a,
    f,
    sigma,
  };
}

// ── Bundle assembly (payloads -> report -> index, exactly the published graph shape) ───────

interface ArtifactFile {
  readonly path: string;
  readonly kind: string;
  readonly bytes: Uint8Array;
}

function descriptorOf(file: ArtifactFile): Record<string, unknown> {
  return {
    path: file.path,
    kind: file.kind,
    byteLength: file.bytes.byteLength,
    sha256: sha256HexNode(file.bytes),
  };
}

function writeBundle(directory: string, reportPath: string, envelope: {
  protocol: string;
  pass: string;
  operator: string;
  payloadWithoutRuns: Record<string, unknown>;
  runs: unknown[];
  payloads: ArtifactFile[];
}): void {
  const sorted = [...envelope.payloads].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  const payloadDescriptors = sorted.map(descriptorOf);
  const report = {
    version: 1,
    protocol: envelope.protocol,
    pass: envelope.pass,
    operator: envelope.operator,
    artifacts: payloadDescriptors,
    payload: { ...envelope.payloadWithoutRuns, runs: envelope.runs },
  };
  const reportBytes = canonicalJsonBytesOf(report);
  const reportDescriptor = {
    path: reportPath,
    kind: "phase4-evidence-report+json",
    byteLength: reportBytes.byteLength,
    sha256: sha256HexNode(reportBytes),
  };
  const index = {
    version: 1,
    publication: "complete",
    report: reportDescriptor,
    artifacts: [reportDescriptor, ...payloadDescriptors],
  };
  for (const file of sorted) {
    const target = join(directory, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.bytes);
  }
  writeFileSync(join(directory, reportPath), reportBytes);
  writeFileSync(join(directory, "artifact-index.json"), canonicalJsonBytesOf(index));
}

function rawSha(view: Uint8Array | Float64Array): string {
  return sha256HexNode(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
}

/** Build the complete frozen Pass-A run set as a tiny synthetic bundle. */
export function buildFixturePassA(directory: string): void {
  const tick = 100;
  const runs = ggFixtureRuns();
  const manifest = {
    version: 1,
    protocol: "phase4-pass-a-v1",
    operator: "GGThreshold",
    backend: "float64-cpu-oracle",
    precision: "float64",
    canonicalSeedSites: 19,
    fixture: SYNTHETIC_FIXTURE_NOTICE,
    runs: runs.map((run) => ({
      id: run.id,
      scenario: run.id,
      operator: "GGThreshold",
      backend: "float64-cpu-oracle",
      dims: DIMS,
      domain: "hexPrism",
      farField: "reflecting",
      rngSeed: run.rngSeed ?? 1,
      noiseEpsilon: run.noiseEpsilon ?? 0,
      params: run.params,
      habitControl: run.habitControl,
      schedule: run.schedule,
    })),
  };
  const manifestBytes = canonicalJsonBytesOf(manifest);
  const payloads: ArtifactFile[] = [
    { path: "manifest.json", kind: "phase4-pass-a-manifest+json", bytes: manifestBytes },
  ];
  const summaries: unknown[] = [];
  for (const run of runs) {
    const state = ggFixtureState(run, tick);
    const metrics = computeMetrics(
      state.a,
      state.b,
      state.d,
      state.dims,
      state.center,
      state.tick,
    );
    const checkpoint = encodeCheckpoint(state, metrics);
    payloads.push({
      path: `runs/${run.id}/final.ckpt`,
      kind: "gg-checkpoint-v1",
      bytes: checkpoint,
    });
    summaries.push({
      runId: run.id,
      executionId: `fixture-${run.id}`,
      completedCycles: tick,
      stopReason: "fixture-final-state",
      final: {
        aSha256: rawSha(state.a),
        bSha256: rawSha(state.b),
        dSha256: rawSha(state.d),
        checkpointSha256: sha256HexNode(checkpoint),
      },
    });
  }
  writeBundle(directory, "gate4a-report.json", {
    protocol: "phase4-pass-a-v1",
    pass: "A",
    operator: "GGThreshold",
    payloadWithoutRuns: {
      version: 1,
      manifestSha256: sha256HexNode(manifestBytes),
      fixture: SYNTHETIC_FIXTURE_NOTICE,
      records: [
        { criterion: "A-HABIT-ENDPOINTS", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "A-HABIT-SOLID", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "A-DEPLETION-SIGNAL", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "A-TIMELINE-CAPS", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "A-BRANCH", passed: true, summary: "synthetic fixture verdict" },
      ],
      verdict: { gatePass: true, blockingFailures: [], contractFailures: [] },
    },
    runs: summaries,
    payloads,
  });
}

/** Build the complete frozen Pass-B run set as a tiny synthetic bundle. */
export function buildFixturePassB(directory: string): void {
  const tick = 50;
  const runs = lkFixtureRuns();
  const manifest = {
    version: 1,
    protocol: "phase4-pass-b-v1",
    operator: "LibbrechtKinetics",
    backend: "float64-cpu-oracle",
    precision: "float64",
    canonicalSeedSites: 19,
    surfacePolicy: LK_COMMON.surfacePolicy,
    fixture: SYNTHETIC_FIXTURE_NOTICE,
    runs: runs.map((run) => ({
      id: run.id,
      scenario: run.id,
      operator: "LibbrechtKinetics",
      backend: "float64-cpu-oracle",
      surfacePolicy: LK_COMMON.surfacePolicy,
      dims: DIMS,
      domain: "hexPrism",
      farField: "dirichlet",
      rngSeed: run.rngSeed ?? 1,
      noiseEpsilon: run.noiseEpsilon ?? 0,
      tempC: run.tempC,
      sigmaInfinity: run.sigmaInfinity,
      dxUm: LK_COMMON.dxUm,
      pressurePa: LK_COMMON.pressurePa,
      paramSet: LK_COMMON.paramSet,
      cflFill: LK_COMMON.cflFill,
      relaxTol: LK_COMMON.relaxTol,
      divTol: LK_COMMON.divTol,
      relaxMaxSweeps: LK_COMMON.relaxMaxSweeps,
      schedule: run.schedule,
    })),
  };
  const manifestBytes = canonicalJsonBytesOf(manifest);
  const payloads: ArtifactFile[] = [
    { path: "manifest.json", kind: "phase4-pass-b-manifest+json", bytes: manifestBytes },
  ];
  const summaries: unknown[] = [];
  for (const run of runs) {
    const state = lkFixtureState(run, tick);
    const checkpoint = encodeLKCheckpoint(state);
    payloads.push({
      path: `runs/${run.id}/final.ckpt`,
      kind: "lk-checkpoint-v2",
      bytes: checkpoint,
    });
    summaries.push({
      runId: run.id,
      executionId: `fixture-${run.id}`,
      completedSteps: tick,
      stopReason: "fixture-final-state",
      simTimeSeconds: state.simTimeSeconds,
      final: {
        aSha256: rawSha(state.a),
        fSha256: rawSha(state.f),
        sigmaSha256: rawSha(state.sigma),
        checkpointSha256: sha256HexNode(checkpoint),
      },
      environment: {
        initial: { tempC: run.tempC, sigmaInfinity: run.sigmaInfinity },
        final: { tempC: run.finalTempC, sigmaInfinity: run.sigmaInfinity },
      },
    });
  }
  writeBundle(directory, "gate4b-report.json", {
    protocol: "phase4-pass-b-v1",
    pass: "B",
    operator: "LibbrechtKinetics",
    payloadWithoutRuns: {
      version: 1,
      manifestSha256: sha256HexNode(manifestBytes),
      fixture: SYNTHETIC_FIXTURE_NOTICE,
      records: [
        { criterion: "B-HABIT-ENDPOINTS", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "B-HABIT-SOLID", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "B-HOLLOW", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "B-TIMELINE", passed: true, summary: "synthetic fixture verdict" },
        { criterion: "B-BRANCH", passed: true, summary: "synthetic fixture verdict" },
      ],
      verdict: { executionValid: true, diagnosticPass: true, diagnosticFailures: [] },
    },
    runs: summaries,
    payloads,
  });
}

export function buildFixtureBundles(rootDirectory: string): { passA: string; passB: string } {
  const passA = join(rootDirectory, "pass-a");
  const passB = join(rootDirectory, "pass-b");
  mkdirSync(passA, { recursive: true });
  mkdirSync(passB, { recursive: true });
  buildFixturePassA(passA);
  buildFixturePassB(passB);
  return { passA, passB };
}

// ── CLI ────────────────────────────────────────────────────────────────────────────────────

if (process.argv[1] !== undefined && process.argv[1].includes("phase4-fixture")) {
  const target = process.argv[2];
  if (target === undefined) {
    console.error("usage: node app/scripts/phase4-fixture.ts <targetDir>");
    process.exit(2);
  }
  const { passA, passB } = buildFixtureBundles(target);
  console.log(`fixture pass-a bundle: ${passA}`);
  console.log(`fixture pass-b bundle: ${passB}`);
}
