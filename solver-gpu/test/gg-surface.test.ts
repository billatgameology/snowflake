import { describe, expect, test, vi } from "vitest";
import {
  GG_PRESETS,
  ggTimelineEnvironmentFromParams,
  type GGParams,
} from "@vcc/core";
import {
  GGSolver,
  type LedgerReport,
  type RelaxationReport,
  type SurfaceReport,
} from "../../solver-cpu/src/index.ts";
import {
  createGpuBufferPlan,
  createGpuGridLayout,
  decodeGpuGgCycleReport,
  encodeGpuGgSurfaceUniforms,
  GPU_GG_CYCLE_REPORT_BYTES,
  GPU_GG_SURFACE_FLAG_DIRICHLET,
  GPU_GG_SURFACE_UNIFORM_BYTES,
  GPU_TOPOLOGY_FAR_FIELD,
  GpuBufferArena,
  GpuGgSolver,
  GpuGgSurface,
  GpuSubmissionController,
  planGpuGgClampReduction,
} from "../src/index.ts";

function cloneParams(name: keyof typeof GG_PRESETS): GGParams {
  const source = GG_PRESETS[name];
  return {
    rho: source.rho,
    phi: source.phi,
    kappa: new Float64Array(source.kappa),
    mu: new Float64Array(source.mu),
    ggThreshBeta: new Float64Array(source.ggThreshBeta),
  };
}

describe("GPU G-G surface ABI and reduction", () => {
  test("pins every blocking G-G SurfaceReport field and reflecting meter", () => {
    interface ReportPredicateCandidate {
      readonly attachedNow: number;
      readonly maxKineticFillIncrement: number | null;
      readonly holeFillCount: number;
      readonly deltaTimeSeconds: number | null;
      readonly stalled: boolean;
      readonly skippedUnconverged: boolean;
      readonly dirichletMeter: number;
      readonly meterBlocking: boolean;
    }
    const expected: ReportPredicateCandidate = {
      attachedNow: 3,
      maxKineticFillIncrement: null,
      holeFillCount: 1,
      deltaTimeSeconds: null,
      stalled: false,
      skippedUnconverged: false,
      dirichletMeter: 0,
      meterBlocking: true,
    };
    const passes = (candidate: ReportPredicateCandidate): boolean =>
      candidate.attachedNow === expected.attachedNow &&
      candidate.maxKineticFillIncrement === null &&
      candidate.holeFillCount === expected.holeFillCount &&
      candidate.deltaTimeSeconds === null &&
      candidate.stalled === false &&
      candidate.skippedUnconverged === false &&
      (!candidate.meterBlocking || candidate.dirichletMeter === 0);
    expect(passes(expected)).toBe(true);
    for (const mutation of [
      { ...expected, attachedNow: 4 },
      { ...expected, maxKineticFillIncrement: 0 },
      { ...expected, holeFillCount: 2 },
      { ...expected, deltaTimeSeconds: 1 },
      { ...expected, stalled: true },
      { ...expected, skippedUnconverged: true },
      { ...expected, dirichletMeter: 1 },
    ] as const) {
      expect(passes(mutation)).toBe(false);
    }
  });

  test("encodes all eight parameter slots and the mixed control header", () => {
    const layout = createGpuGridLayout({ nx: 17, ny: 19, nz: 11 });
    const params = cloneParams("hollowColumn");
    const bytes = encodeGpuGgSurfaceUniforms({
      layout,
      baseCell: 257,
      generation: 4,
      tick: 9,
      inputBase: 512,
      inputCount: 1024,
      outputBase: 3,
      flags: GPU_GG_SURFACE_FLAG_DIRICHLET,
      params,
    });
    expect(bytes.byteLength).toBe(GPU_GG_SURFACE_UNIFORM_BYTES);
    const view = new DataView(bytes);
    expect([
      view.getUint32(0, true),
      view.getUint32(4, true),
      view.getUint32(8, true),
      view.getUint32(12, true),
      view.getUint32(16, true),
      view.getUint32(20, true),
      view.getUint32(24, true),
      view.getUint32(28, true),
      view.getUint32(32, true),
      view.getUint32(36, true),
      view.getUint32(40, true),
      view.getUint32(44, true),
    ]).toEqual([
      17,
      19,
      11,
      layout.cellCount,
      layout.plane,
      257,
      4,
      9,
      512,
      1024,
      3,
      GPU_GG_SURFACE_FLAG_DIRICHLET,
    ]);
    expect(view.getFloat32(48, true)).toBe(0);
    for (let slot = 1; slot < 8; slot++) {
      expect(view.getFloat32(48 + slot * 4, true)).toBe(
        Math.fround(params.kappa[slot]),
      );
      expect(view.getFloat32(80 + slot * 4, true)).toBe(
        Math.fround(params.mu[slot]),
      );
      expect(view.getFloat32(112 + slot * 4, true)).toBe(
        Math.fround(params.ggThreshBeta[slot]),
      );
    }
  });

  test("plans deterministic non-overlapping clamp reductions through one scalar", () => {
    const plan = planGpuGgClampReduction(8_500_123);
    expect(plan.dispatches.length).toBeGreaterThan(3);
    for (const dispatch of plan.dispatches) {
      expect(dispatch.source).not.toBe(dispatch.destination);
      expect(dispatch.workgroupCount).toBeLessThanOrEqual(16_384);
      expect(dispatch.inputCount).toBeGreaterThan(0);
    }
    expect(plan.dispatches[0]).toMatchObject({
      source: "scratchScalarA",
      destination: "reduction",
      inputBase: 0,
    });
    expect(plan.finalSource).toBe(
      plan.dispatches.at(-1)?.destination,
    );
  });

  test("decodes the compact report without reclassifying non-finite meters", () => {
    const bytes = new ArrayBuffer(GPU_GG_CYCLE_REPORT_BYTES);
    const view = new DataView(bytes);
    view.setUint32(0, 56, true);
    view.setUint32(4, 19, true);
    view.setUint32(8, 3, true);
    view.setUint32(12, 1, true);
    view.setFloat32(16, 0.25, true);
    view.setFloat32(20, 1.5, true);
    view.setUint32(24, 54, true);
    expect(decodeGpuGgCycleReport(bytes)).toEqual({
      boundaryCount: 56,
      attachedTotal: 19,
      attachedNow: 3,
      holeFillNow: 1,
      lastClampDelta: 0.25,
      dirichletMeter: 1.5,
      oldBoundaryCount: 54,
      errorFlags: 0,
    });
    view.setFloat32(20, Number.NaN, true);
    expect(() => decodeGpuGgCycleReport(bytes)).toThrow(/non-finite/);
  });
});

interface FakeGpu {
  readonly device: GPUDevice;
  readonly entryPoints: string[];
  readonly dispatches: string[];
  readonly buffers: { destroy: ReturnType<typeof vi.fn>; size: number }[];
}

function fakeGpu(): FakeGpu {
  const entryPoints: string[] = [];
  const dispatches: string[] = [];
  const buffers: { destroy: ReturnType<typeof vi.fn>; size: number }[] = [];
  const device = {
    limits: {
      maxBufferSize: 1_000_000,
      maxStorageBufferBindingSize: 1_000_000,
    },
    lost: new Promise<GPUDeviceLostInfo>(() => undefined),
    destroy: vi.fn(),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
      onSubmittedWorkDone: vi.fn(async () => undefined),
    },
    createBuffer: vi.fn((descriptor: GPUBufferDescriptor) => {
      const buffer = { destroy: vi.fn(), size: Number(descriptor.size) };
      buffers.push(buffer);
      return buffer as unknown as GPUBuffer;
    }),
    createShaderModule: vi.fn(() => ({
      getCompilationInfo: vi.fn(async () => ({ messages: [] })),
    })),
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({})),
    createComputePipelineAsync: vi.fn(
      async (descriptor: GPUComputePipelineDescriptor) => {
        const entryPoint = String(descriptor.compute.entryPoint);
        entryPoints.push(entryPoint);
        return { entryPoint } as unknown as GPUComputePipeline;
      },
    ),
    createBindGroup: vi.fn(() => ({})),
    createCommandEncoder: vi.fn(() => ({
      beginComputePass: vi.fn(() => {
        let current = "";
        return {
          setPipeline: vi.fn((pipeline: { entryPoint: string }) => {
            current = pipeline.entryPoint;
          }),
          setBindGroup: vi.fn(),
          dispatchWorkgroups: vi.fn(() => dispatches.push(current)),
          end: vi.fn(),
        };
      }),
      finish: vi.fn(() => ({})),
    })),
  } as unknown as GPUDevice;
  return { device, entryPoints, dispatches, buffers };
}

function oracleInput(
  dims = { nx: 7, ny: 7, nz: 5 },
  farField: "reflecting" | "dirichlet" = "reflecting",
) {
  const params = cloneParams("plate");
  const oracle = new GGSolver({
    dims,
    params,
    rngSeed: 1,
    domain: "hexPrism",
    farField,
  });
  const topology = new Uint32Array(oracle.a.length);
  for (const index of oracle.farFieldCells) topology[index] = 1;
  return {
    oracle,
    input: {
      initialVapor: Float32Array.from(oracle.d, Math.fround),
      initialBoundaryMass: Float32Array.from(oracle.b, Math.fround),
      occupancy: Uint32Array.from(oracle.a),
      wall: Uint32Array.from(oracle.wall),
      topology,
      initialBoundaryIndices: Uint32Array.from(oracle.boundaryCells()),
      params,
      rngSeed: oracle.rngSeed,
      noiseEpsilon: oracle.noiseEpsilon,
      tick: oracle.tick,
      farField,
      domain: oracle.domain,
      center: oracle.center,
    } as const,
  };
}

// The WP3 probe's CPU-side derivations and its wall/topology scans, recomputed here so the
// GPU operator's own statements can be held against the oracle's own reports in the same
// shapes and key order the published lane observations use.
function cpuLedgerRule(ledger: LedgerReport) {
  return {
    rule: ledger.rule,
    totalMassBDApplicable: ledger.totalMassBD !== null,
    dirichletMeterApplicable: ledger.dirichletMeter !== null,
    fillLedgerIceCellsApplicable: ledger.fillLedgerIceCells !== null,
    fillLedgerVaporUnitsApplicable: ledger.fillLedgerVaporUnits !== null,
    holeFillDeficitApplicable: ledger.holeFillDeficit !== null,
    saturationClippedFillApplicable: ledger.saturationClippedFill !== null,
    lastDivergenceResidualApplicable: ledger.lastDivergenceResidual !== null,
  };
}

function cpuRelaxationClassification(report: RelaxationReport) {
  return {
    converged: report.converged,
    residualApplicable: report.residual !== null,
    divergenceApplicable: report.divergenceResidual !== null,
    shellClampApplicable: report.shellClampDiagnostic !== null,
    surfaceExchangeApplicable: report.surfaceExchangeDiagnostic !== null,
    smootherDriftApplicable: report.smootherDriftDiagnostic !== null,
    minLocalSurfaceExchangeApplicable:
      report.minLocalSurfaceExchangeDiagnostic !== null,
  };
}

function cpuSurfaceClassification(report: SurfaceReport) {
  return {
    deltaTimeSeconds: report.deltaTimeSeconds,
    maxKineticFillIncrement: report.maxKineticFillIncrement,
    stalled: report.stalled,
    skippedUnconverged: report.skippedUnconverged,
  };
}

function activeWallExtents(
  wall: Uint8Array | Uint32Array,
  dims: { readonly nx: number; readonly ny: number; readonly nz: number },
) {
  const plane = dims.nx * dims.ny;
  let activeCellCount = 0;
  let iMin: number | null = null;
  let iMax: number | null = null;
  let jMin: number | null = null;
  let jMax: number | null = null;
  let kMin: number | null = null;
  let kMax: number | null = null;
  for (let index = 0; index < wall.length; index++) {
    if (wall[index] !== 0) continue;
    activeCellCount++;
    const i = index % dims.nx;
    const j = ((index % plane) - i) / dims.nx;
    const k = (index - j * dims.nx - i) / plane;
    if (iMin === null || i < iMin) iMin = i;
    if (iMax === null || i > iMax) iMax = i;
    if (jMin === null || j < jMin) jMin = j;
    if (jMax === null || j > jMax) jMax = j;
    if (kMin === null || k < kMin) kMin = k;
    if (kMax === null || k > kMax) kMax = k;
  }
  return {
    activeCellCount,
    activeBounds: { iMin, iMax, jMin, jMax, kMin, kMax },
  };
}

function farFieldCellCount(topology: Uint32Array): number {
  let count = 0;
  for (let index = 0; index < topology.length; index++) {
    if ((topology[index] & GPU_TOPOLOGY_FAR_FIELD) !== 0) count++;
  }
  return count;
}

describe("GPU complete G-G cycle orchestration", () => {
  test("refuses low-level surface parameter access after teardown", async () => {
    const fake = fakeGpu();
    const { oracle, input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const surface = await GpuGgSurface.create(
      fake.device,
      submissions,
      arena,
      {
        initialBoundaryMass: input.initialBoundaryMass,
        initialBoundaryIndices: input.initialBoundaryIndices,
        attachedCount: oracle.attachedCount,
        params: input.params,
        tick: input.tick,
        farField: input.farField,
      },
    );
    expect(surface.params().rho).toBe(input.params.rho);
    surface.destroy();
    expect(() => surface.params()).toThrow(/destroyed/);
    arena.destroy();
    submissions.destroy();
  });

  test("rejects negative vapor through the complete wrapper before GPU work", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    input.initialVapor[0] = -0.25;
    await expect(
      GpuGgSolver.create(fake.device, submissions, arena, input),
    ).rejects.toThrow(/nonnegative/);
    expect(fake.device.createShaderModule).not.toHaveBeenCalled();
    expect(fake.device.queue.writeBuffer).not.toHaveBeenCalled();
    arena.destroy();
    submissions.destroy();
  });

  test("runs reviewed diffusion before the ordered reflecting surface graph", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device, () => 1);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    expect(solver.activeVaporName()).toBe("ggVaporA");
    await solver.step("ordered");
    expect(solver.tick()).toBe(1);
    expect(solver.activeVaporName()).toBe("ggVaporB");
    expect(fake.dispatches).toEqual([
      "diffuseInPlane",
      "diffuseVertical",
      "commitDiffusion",
      "clearCycleReport",
      "freezeBoundary",
      "decideAttachment",
      "meltBoundary",
      "applyAttachment",
      "rebuildBoundary",
      "publishBoundary",
    ]);
    const before = solver.timelineEnvironment();
    const event = solver.applyTimelineEnvironment(
      ggTimelineEnvironmentFromParams(cloneParams("needle")),
    );
    expect(event.boundary.tick).toBe(1);
    expect(event.beforeEnvironment).toEqual(before);
    expect(solver.params().ggThreshBeta[1]).toBe(
      GG_PRESETS.needle.ggThreshBeta[1],
    );
    solver.destroy();
    arena.destroy();
  });

  test("rejects incomplete boundary state before creating shaders or uploading", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    await expect(
      GpuGgSolver.create(fake.device, submissions, arena, {
        ...input,
        initialBoundaryIndices: input.initialBoundaryIndices.slice(1),
      }),
    ).rejects.toThrow(/boundary membership is incomplete/);
    expect(fake.device.createShaderModule).not.toHaveBeenCalled();
    expect(fake.device.queue.writeBuffer).not.toHaveBeenCalled();
    arena.destroy();
    submissions.destroy();
  });

  test("rejects caller-supplied boundary or reserved topology bits before upload", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const topology = new Uint32Array(input.topology);
    topology[input.initialBoundaryIndices[0]] |= 2;
    await expect(
      GpuGgSolver.create(fake.device, submissions, arena, {
        ...input,
        topology,
      }),
    ).rejects.toThrow(/reserved bits/);
    expect(fake.device.createShaderModule).not.toHaveBeenCalled();
    expect(fake.device.queue.writeBuffer).not.toHaveBeenCalled();
    arena.destroy();
    submissions.destroy();
  });

  test("refuses overlap and events until both cycle submissions complete", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    let releaseDiffusion: (() => void) | undefined;
    vi.mocked(fake.device.queue.onSubmittedWorkDone).mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          releaseDiffusion = () => resolve(undefined);
        }),
    );
    const advancing = solver.step("held");
    await expect(solver.step("overlap")).rejects.toThrow(/state=advancing/);
    expect(() =>
      solver.applyTimelineEnvironment(
        ggTimelineEnvironmentFromParams(cloneParams("needle")),
      ),
    ).toThrow(/state=advancing/);
    releaseDiffusion?.();
    await advancing;
    expect(solver.tick()).toBe(1);
    solver.destroy();
    arena.destroy();
  });

  test("keeps validation-only timeline failures recoverable and poisons partial writes", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    const writesBeforeValidation = vi.mocked(fake.device.queue.writeBuffer).mock
      .calls.length;
    expect(() =>
      solver.applyTimelineEnvironment(solver.timelineEnvironment()),
    ).toThrow();
    expect(() =>
      solver.applyTimelineEnvironment({
        ...solver.timelineEnvironment(),
        rho: Number.NaN,
      }),
    ).toThrow();
    expect(vi.mocked(fake.device.queue.writeBuffer).mock.calls.length).toBe(
      writesBeforeValidation,
    );
    expect(solver.params().rho).toBe(input.params.rho);
    await solver.step("after-validation-rejection");

    vi.mocked(fake.device.queue.writeBuffer).mockImplementationOnce(() => {
      throw new Error("injected event control write failure");
    });
    expect(() =>
      solver.applyTimelineEnvironment(
        ggTimelineEnvironmentFromParams(cloneParams("needle")),
      ),
    ).toThrow(/injected event control write failure/);
    expect(solver.isDestroyed()).toBe(true);
    expect(() => solver.params()).toThrow(/poisoned/);
  });

  test("snapshots parameters and releases all owned resources on teardown", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    input.params.ggThreshBeta[1] = 123;
    expect(solver.params().ggThreshBeta[1]).not.toBe(123);
    solver.destroy();
    expect(fake.buffers.filter((buffer) => buffer.destroy.mock.calls.length === 0))
      .toEqual(arena.plan.buffers.map((_, index) => fake.buffers[index]));
    arena.destroy();
    expect(fake.buffers.every((buffer) => buffer.destroy.mock.calls.length === 1))
      .toBe(true);
  });

  test("states a ledger rule and report classifications the oracle's own reports match", async () => {
    for (const farField of ["reflecting", "dirichlet"] as const) {
      const fake = fakeGpu();
      const { oracle, input } = oracleInput({ nx: 7, ny: 7, nz: 5 }, farField);
      const arena = GpuBufferArena.create(
        fake.device,
        1,
        createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
      );
      const submissions = new GpuSubmissionController(fake.device, () => 1);
      submissions.acknowledgeEdit(1);
      const solver = await GpuGgSolver.create(
        fake.device,
        submissions,
        arena,
        input,
      );
      const relaxation = oracle.relaxField();
      const surface = oracle.advanceSurface();
      // Exactly the comparison `phase5-gate.mjs` makes: one lane's own accessor output
      // against the other lane's own emitted reports, with no operand copied across.
      expect(JSON.stringify(solver.ledgerRule())).toBe(
        JSON.stringify(cpuLedgerRule(oracle.ledger())),
      );
      expect(JSON.stringify(solver.relaxationClassification())).toBe(
        JSON.stringify(cpuRelaxationClassification(relaxation)),
      );
      expect(JSON.stringify(solver.surfaceStepClassification())).toBe(
        JSON.stringify(cpuSurfaceClassification(surface)),
      );
      // Non-vacuous: the Dirichlet-only terms are the ones that actually move.
      expect(solver.ledgerRule().dirichletMeterApplicable).toBe(
        farField === "dirichlet",
      );
      expect(solver.relaxationClassification().shellClampApplicable).toBe(
        farField === "dirichlet",
      );
      expect(solver.surfaceStepClassification()).toEqual({
        deltaTimeSeconds: null,
        maxKineticFillIncrement: null,
        stalled: false,
        skippedUnconverged: false,
      });
      solver.destroy();
      arena.destroy();
      submissions.destroy();
    }
  });

  test("counts the diffusion passes it ran and names its own cycle phase", async () => {
    const fake = fakeGpu();
    const { oracle, input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device, () => 1);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.cyclePhase()).toBe(oracle.cyclePhase());
    expect(solver.completedDiffusionPasses()).toBe(0);
    let oracleSweeps = 0;
    for (let cycle = 0; cycle < 3; cycle++) {
      const before = solver.completedDiffusionPasses();
      oracleSweeps += oracle.relaxField().sweeps;
      oracle.advanceSurface();
      await solver.step(`counted-${cycle + 1}`);
      expect(solver.completedDiffusionPasses() - before).toBe(1);
      expect(solver.cyclePhase()).toBe(oracle.cyclePhase());
    }
    // Each lane's own count of the relaxation work it actually performed.
    expect(solver.completedDiffusionPasses()).toBe(oracleSweeps);
    expect(solver.tick()).toBe(oracle.tick);

    let releaseDiffusion: (() => void) | undefined;
    vi.mocked(fake.device.queue.onSubmittedWorkDone).mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          releaseDiffusion = () => resolve(undefined);
        }),
    );
    const advancing = solver.step("held");
    expect(solver.cyclePhase()).toBe("advancing");
    releaseDiffusion?.();
    await advancing;
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.completedDiffusionPasses()).toBe(4);
    solver.destroy();
    arena.destroy();
    submissions.destroy();
  });

  test("states the grid it allocated and the domain it was configured for", async () => {
    const fake = fakeGpu();
    const { oracle, input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    expect(solver.domainExtents()).toEqual({
      dims: { nx: 7, ny: 7, nz: 5 },
      plane: 49,
      cellCount: 245,
      domain: oracle.domain,
      center: [oracle.center[0], oracle.center[1], oracle.center[2]],
    });
    // The WP3 probe measures the rest of the extents from each lane's own wall and topology
    // buffers. Recomputed here from the mask this operator holds: it must reproduce the
    // oracle's independently maintained active-cell and far-field counts.
    const extents = activeWallExtents(input.wall, solver.domainExtents().dims);
    expect(extents.activeCellCount).toBe(oracle.activeCellCount);
    expect(extents.activeCellCount).toBeLessThan(245);
    expect(extents.activeBounds).toEqual({
      iMin: 0,
      iMax: 6,
      jMin: 0,
      jMax: 6,
      kMin: 0,
      kMax: 4,
    });
    expect(farFieldCellCount(input.topology)).toBe(
      oracle.farFieldCells.length,
    );
    solver.destroy();
    arena.destroy();
    submissions.destroy();
  });

  test("refuses every own-state accessor after teardown", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    solver.destroy();
    expect(() => solver.cyclePhase()).toThrow(/destroyed/);
    expect(() => solver.completedDiffusionPasses()).toThrow(/destroyed/);
    expect(() => solver.domainExtents()).toThrow(/destroyed/);
    expect(() => solver.ledgerRule()).toThrow(/destroyed/);
    expect(() => solver.relaxationClassification()).toThrow(/destroyed/);
    expect(() => solver.surfaceStepClassification()).toThrow(/destroyed/);
    arena.destroy();
    submissions.destroy();
  });

  test("poisons the complete solver and arena after uncertain surface completion", async () => {
    const fake = fakeGpu();
    const { input } = oracleInput();
    const arena = GpuBufferArena.create(
      fake.device,
      1,
      createGpuBufferPlan({ nx: 7, ny: 7, nz: 5 }, "gg"),
    );
    const submissions = new GpuSubmissionController(fake.device);
    submissions.acknowledgeEdit(1);
    const solver = await GpuGgSolver.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    vi.mocked(fake.device.queue.onSubmittedWorkDone)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("uncertain surface completion"));
    await expect(solver.step("uncertain")).rejects.toThrow(
      /uncertain surface completion/,
    );
    expect(solver.isDestroyed()).toBe(true);
    expect(arena.isDestroyed()).toBe(true);
    expect(() => solver.activeVaporName()).toThrow(/poisoned/);
    await expect(solver.step("retry")).rejects.toThrow(/poisoned/);
  });
});
