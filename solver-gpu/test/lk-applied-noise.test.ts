// LK applies noise as a multiplicative factor inside the boundary solve and materializes no
// noise field, so the operator's applied-noise observation is a differential: the same
// reconstructed phase solved at the configured amplitude and at zero amplitude. These tests
// pin the differential's exactness rule and the accessor's cycle/lifetime guards.

import { describe, expect, it, vi } from "vitest";
import { LKSolver } from "../../solver-cpu/src/index.ts";
import {
  createGpuBufferPlan,
  deriveGpuLkAppliedNoiseIndices,
  GPU_LK_TOPOLOGY_BOUNDARY,
  GPU_LK_TOPOLOGY_FAR_FIELD,
  GpuBufferArena,
  GpuLkSolver,
  GpuReadbackAudit,
  GpuSubmissionController,
} from "../src/index.ts";

describe("GPU LK applied-noise differential", () => {
  it("reports exactly the boundary cells whose coefficient the noise changed", () => {
    const boundary = Uint32Array.from([1, 3, 5]);
    const noisy = Float32Array.from([0, 0.5, 0, 0.25, 0, 0.125]);
    const noiseFree = Float32Array.from([0, 0.5, 0, 0.5, 0, 0.125]);
    expect(
      Array.from(deriveGpuLkAppliedNoiseIndices(boundary, noisy, noiseFree)),
    ).toEqual([3]);
  });

  it("ignores changes away from the operator's own boundary set", () => {
    const boundary = Uint32Array.from([2]);
    const noisy = Float32Array.from([9, 9, 0.5, 9]);
    const noiseFree = Float32Array.from([1, 1, 0.5, 1]);
    expect(
      deriveGpuLkAppliedNoiseIndices(boundary, noisy, noiseFree),
    ).toEqual(new Uint32Array(0));
  });

  it("walks the boundary set in the operator's own order", () => {
    const boundary = Uint32Array.from([4, 0, 2]);
    const noisy = Float32Array.from([0.1, 0, 0.2, 0, 0.3]);
    const noiseFree = Float32Array.from([0.9, 0, 0.8, 0, 0.7]);
    expect(
      Array.from(deriveGpuLkAppliedNoiseIndices(boundary, noisy, noiseFree)),
    ).toEqual([4, 0, 2]);
  });

  it("reports a signed-zero difference instead of collapsing it", () => {
    const boundary = Uint32Array.from([0, 1]);
    const noisy = Float32Array.from([-0, 0]);
    const noiseFree = Float32Array.from([0, 0]);
    expect(
      Array.from(deriveGpuLkAppliedNoiseIndices(boundary, noisy, noiseFree)),
    ).toEqual([0]);
  });

  it("finds nothing when the two solves agree bit-for-bit", () => {
    const boundary = Uint32Array.from([0, 1, 2]);
    const values = Float32Array.from([0.25, 0, 1]);
    expect(
      deriveGpuLkAppliedNoiseIndices(
        boundary,
        values,
        Float32Array.from(values),
      ),
    ).toEqual(new Uint32Array(0));
  });

  it("rejects mismatched fields and out-of-range boundary members", () => {
    expect(() =>
      deriveGpuLkAppliedNoiseIndices(
        Uint32Array.from([0]),
        new Float32Array(2),
        new Float32Array(3),
      ),
    ).toThrow(/share a length/);
    expect(() =>
      deriveGpuLkAppliedNoiseIndices(
        Uint32Array.from([4]),
        new Float32Array(2),
        new Float32Array(2),
      ),
    ).toThrow(/out of range/);
  });
});

function fakeDevice(): GPUDevice {
  return {
    limits: {
      maxBufferSize: 4_000_000,
      maxStorageBufferBindingSize: 4_000_000,
    },
    lost: new Promise<GPUDeviceLostInfo>(() => undefined),
    destroy: vi.fn(),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
      onSubmittedWorkDone: vi.fn(async () => undefined),
    },
    createBuffer: vi.fn(
      (descriptor: GPUBufferDescriptor) =>
        ({
          destroy: vi.fn(),
          size: Number(descriptor.size),
        }) as unknown as GPUBuffer,
    ),
    createShaderModule: vi.fn(() => ({
      getCompilationInfo: vi.fn(async () => ({ messages: [] })),
    })),
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({})),
    createComputePipelineAsync: vi.fn(
      async (descriptor: GPUComputePipelineDescriptor) =>
        ({
          entryPoint: String(descriptor.compute.entryPoint),
        }) as unknown as GPUComputePipeline,
    ),
    createBindGroup: vi.fn(() => ({})),
    createCommandEncoder: vi.fn(() => ({
      beginComputePass: vi.fn(() => ({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        dispatchWorkgroups: vi.fn(),
        end: vi.fn(),
      })),
      finish: vi.fn(() => ({})),
    })),
  } as unknown as GPUDevice;
}

const dims = { nx: 11, ny: 11, nz: 9 } as const;

function freshInput() {
  const oracle = new LKSolver({
    surfacePolicy: "aggregate-hv-g1h1-v5",
    dims,
    tempC: -5,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 1_000,
    rngSeed: 1,
    noiseEpsilon: 0.001,
    domain: "hexPrism",
    farField: "dirichlet",
    seedRadius: 2,
    seedThickness: 1,
  });
  const topology = new Uint32Array(oracle.a.length);
  for (const index of oracle.dirichletCells) {
    topology[index] |= GPU_LK_TOPOLOGY_FAR_FIELD;
  }
  for (const index of oracle.boundaryCells()) {
    topology[index] |= GPU_LK_TOPOLOGY_BOUNDARY;
  }
  return {
    surfacePolicy: "aggregate-hv-g1h1-v5",
    initialSigma: Float32Array.from(oracle.sigma, Math.fround),
    initialFill: Float32Array.from(oracle.f, Math.fround),
    occupancy: Uint32Array.from(oracle.a),
    wall: Uint32Array.from(oracle.wall),
    topology,
    initialBoundaryIndices: Uint32Array.from(oracle.boundaryCells()),
    tempC: oracle.tempC,
    sigmaInfinity: oracle.sigmaInfinity,
    dxUm: oracle.dxM * 1e6,
    pressurePa: oracle.pressurePa,
    paramSet: oracle.paramSet,
    cflFill: oracle.cflFill,
    relaxTol: oracle.relaxTol,
    divTol: oracle.divTol,
    relaxMaxSweeps: oracle.relaxMaxSweeps,
    rngSeed: oracle.rngSeed,
    noiseEpsilon: oracle.noiseEpsilon,
    tick: oracle.tick,
    simTimeSeconds: oracle.simTimeSeconds,
    farField: oracle.farField,
    domain: oracle.domain,
    center: oracle.center,
    fillLedgerIceCells: 0,
    closedPlacedFillVaporUnits: 0,
    currentTemperatureSegmentStartFillIceCells: 0,
    kineticDemand: 0,
    saturationClippedFill: 0,
    holeFillDeficit: 0,
    holeFillCountTotal: 0,
    lastMaxFillVelocityMS: 0,
  } as const;
}

async function freshSolver(): Promise<{
  readonly solver: GpuLkSolver;
  readonly arena: GpuBufferArena;
  readonly submissions: GpuSubmissionController;
}> {
  const device = fakeDevice();
  const arena = GpuBufferArena.create(
    device,
    1,
    createGpuBufferPlan(dims, "lk"),
  );
  const submissions = new GpuSubmissionController(device);
  submissions.acknowledgeEdit(1);
  const solver = await GpuLkSolver.create(
    device,
    submissions,
    arena,
    new GpuReadbackAudit(),
    freshInput(),
  );
  return { solver, arena, submissions };
}

describe("GPU LK applied-noise accessor guards", () => {
  it("refuses to observe applied noise outside an accepted relaxation", async () => {
    const { solver, submissions } = await freshSolver();
    expect(solver.cyclePhase()).toBe("boundary");
    await expect(solver.readAppliedNoise()).rejects.toThrow(
      /requires an accepted relaxation \(state=boundary\)/,
    );
    // The refusal costs no GPU work, so the operator stays usable.
    expect(solver.cyclePhase()).toBe("boundary");
    solver.destroy();
    submissions.destroy();
  });

  it("requires a nonempty evidence label before touching the device", async () => {
    const { solver, submissions } = await freshSolver();
    await expect(solver.readAppliedNoise("")).rejects.toThrow(
      /label is required/,
    );
    expect(solver.cyclePhase()).toBe("boundary");
    solver.destroy();
    submissions.destroy();
  });

  it("refuses to observe applied noise after teardown", async () => {
    const { solver, submissions } = await freshSolver();
    solver.destroy();
    await expect(solver.readAppliedNoise()).rejects.toThrow(/destroyed/);
    submissions.destroy();
  });

  it("refuses to observe applied noise on a stale generation", async () => {
    const { solver, arena, submissions } = await freshSolver();
    submissions.acknowledgeEdit(2);
    await expect(solver.readAppliedNoise()).rejects.toThrow(/stale/);
    arena.destroy();
    submissions.destroy();
  });
});
