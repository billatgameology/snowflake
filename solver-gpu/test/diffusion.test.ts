import { describe, expect, test, vi } from "vitest";
import { randomBit, STREAM_NOISE_XI } from "@vcc/core";
import {
  createGpuBufferPlan,
  createGpuGridLayout,
  encodeGpuGgDiffusionUniforms,
  GPU_GG_DIFFUSION_FLAG_DIRICHLET,
  GPU_GG_DIFFUSION_FLAG_DRIFT,
  GPU_GG_DIFFUSION_FLAG_NOISE,
  GPU_GG_DIFFUSION_UNIFORM_BYTES,
  GPU_GG_DIFFUSION_WGSL,
  GpuBufferArena,
  GpuGgDiffusion,
  GpuSubmissionController,
  snapshotGpuGgDiffusionInput,
} from "../src/index.ts";

function validInput(cellCount: number, farField: "reflecting" | "dirichlet") {
  const initialVapor = new Float32Array(cellCount).fill(Math.fround(0.1));
  const occupancy = new Uint32Array(cellCount);
  const wall = new Uint32Array(cellCount);
  const topology = new Uint32Array(cellCount);
  occupancy[Math.floor(cellCount / 2)] = 1;
  initialVapor[Math.floor(cellCount / 2)] = 0;
  topology[1] = 1;
  return {
    initialVapor,
    occupancy,
    wall,
    topology,
    phi: 0,
    rho: 0.1,
    noiseEpsilon: 0,
    rngSeed: 1,
    tick: 0,
    farField,
  } as const;
}

describe("GPU G-G diffusion input and ABI", () => {
  test("snapshots owned masks and derives exact stage flags", () => {
    const layout = createGpuGridLayout({ nx: 3, ny: 4, nz: 5 });
    const input = {
      ...validInput(layout.cellCount, "dirichlet"),
      phi: 0.01,
      noiseEpsilon: 1e-5,
      rngSeed: 0x2468_ace0,
    };
    const snapshot = snapshotGpuGgDiffusionInput(layout, input);
    expect(snapshot.flags).toBe(
      GPU_GG_DIFFUSION_FLAG_NOISE |
        GPU_GG_DIFFUSION_FLAG_DRIFT |
        GPU_GG_DIFFUSION_FLAG_DIRICHLET,
    );
    input.initialVapor[0] = 9;
    input.occupancy[0] = 1;
    input.wall[0] = 1;
    input.topology[0] = 1;
    expect(snapshot.initialVapor[0]).toBeCloseTo(0.1);
    expect(snapshot.occupancy[0]).toBe(0);
    expect(snapshot.wall[0]).toBe(0);
    expect(snapshot.topology[0]).toBe(0);
  });

  test("rejects malformed masks, blocked vapor, and invalid controls", () => {
    const layout = createGpuGridLayout({ nx: 3, ny: 3, nz: 3 });
    const baseline = validInput(layout.cellCount, "dirichlet");
    expect(() =>
      snapshotGpuGgDiffusionInput(layout, {
        ...baseline,
        initialVapor: new Float32Array(1),
      }),
    ).toThrow(/length/);

    const overlap = validInput(layout.cellCount, "dirichlet");
    overlap.occupancy[0] = 1;
    overlap.wall[0] = 1;
    overlap.initialVapor[0] = 0;
    expect(() => snapshotGpuGgDiffusionInput(layout, overlap)).toThrow(
      /overlap/,
    );

    const blockedVapor = validInput(layout.cellCount, "dirichlet");
    blockedVapor.wall[0] = 1;
    expect(() => snapshotGpuGgDiffusionInput(layout, blockedVapor)).toThrow(
      /blocked vapor/,
    );

    const badShell = validInput(layout.cellCount, "dirichlet");
    badShell.topology.fill(0);
    expect(() => snapshotGpuGgDiffusionInput(layout, badShell)).toThrow(
      /nonempty/,
    );
    expect(() =>
      snapshotGpuGgDiffusionInput(layout, { ...baseline, phi: 1 }),
    ).toThrow(/phi/);
    expect(() =>
      snapshotGpuGgDiffusionInput(layout, {
        ...baseline,
        noiseEpsilon: -1,
      }),
    ).toThrow(/noiseEpsilon/);
    expect(() =>
      snapshotGpuGgDiffusionInput(layout, {
        ...baseline,
        farField: "forged",
      } as never),
    ).toThrow(/farField/);
  });

  test("encodes the mixed u32/f32 uniform layout exactly", () => {
    const layout = createGpuGridLayout({ nx: 17, ny: 19, nz: 11 });
    const buffer = encodeGpuGgDiffusionUniforms({
      layout,
      baseCell: 257,
      generation: 4,
      rngSeed: 0x2468_ace0,
      tick: 9,
      flags:
        GPU_GG_DIFFUSION_FLAG_NOISE | GPU_GG_DIFFUSION_FLAG_DIRICHLET,
      phi: 0.01,
      rho: 0.1,
      noiseEpsilon: 1e-5,
    });
    expect(buffer.byteLength).toBe(GPU_GG_DIFFUSION_UNIFORM_BYTES);
    const view = new DataView(buffer);
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
    ]).toEqual([
      17,
      19,
      11,
      layout.cellCount,
      layout.plane,
      257,
      4,
      0x2468_ace0,
      9,
      1,
      GPU_GG_DIFFUSION_FLAG_NOISE | GPU_GG_DIFFUSION_FLAG_DIRICHLET,
    ]);
    expect(view.getFloat32(48, true)).toBe(Math.fround(0.01));
    expect(view.getFloat32(52, true)).toBe(Math.fround(0.1));
    expect(view.getFloat32(56, true)).toBe(Math.fround(1e-5));
    expect(view.getUint32(44, true)).toBe(0);
    expect(view.getUint32(60, true)).toBe(0);
  });

  test("pins reflection, canonical pair sorting, noise, drift, and clamp order in WGSL", () => {
    expect(GPU_GG_DIFFUSION_WGSL).toContain(
      "let own = source[index];",
    );
    expect(GPU_GG_DIFFUSION_WGSL).toContain("if (pair1 <= pair2)");
    expect(GPU_GG_DIFFUSION_WGSL).toContain(
      "auxiliaryA[index] = (((own + low) + middle) + high) / 7.0;",
    );
    expect(GPU_GG_DIFFUSION_WGSL).toContain(
      "hashCounter(uniforms.rngSeed, index, uniforms.tick, uniforms.streamId) & 1u",
    );
    expect(GPU_GG_DIFFUSION_WGSL).toContain(
      "auxiliaryA[index] = fma(uniforms.phi * freeAbove, above, retained);",
    );
    expect(
      GPU_GG_DIFFUSION_WGSL.indexOf("fn commitDiffusion"),
    ).toBeLessThan(GPU_GG_DIFFUSION_WGSL.indexOf("fn clampDirichlet"));
    expect(GPU_GG_DIFFUSION_WGSL).toContain(
      "destination[index] = uniforms.rho;",
    );
  });
});

type PureDiffusionMutation =
  | "none"
  | "zero-face-reflection"
  | "zero-attached-reflection"
  | "zero-wall-reflection"
  | "unsorted-pairs"
  | "wrong-noise-stream"
  | "skip-drift"
  | "skip-clamp";

interface PureDiffusionCase {
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly source: Float32Array;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly topology: Uint32Array;
  readonly phi: number;
  readonly rho: number;
  readonly noiseEpsilon: number;
  readonly rngSeed: number;
  readonly tick: number;
}

function independentDiffusionPass(
  fixture: PureDiffusionCase,
  mutation: PureDiffusionMutation,
): Float32Array {
  const { nx, ny, nz } = fixture.dims;
  const plane = nx * ny;
  const count = plane * nz;
  const noised = new Float32Array(count);
  const noise = new Float32Array(count);
  const inPlane = new Float32Array(count);
  const vertical = new Float32Array(count);
  const drifted = new Float32Array(count);
  const result = new Float32Array(count);
  const fAdd = (left: number, right: number) =>
    Math.fround(Math.fround(left) + Math.fround(right));
  const fMul = (left: number, right: number) =>
    Math.fround(Math.fround(left) * Math.fround(right));
  const blocked = (index: number) =>
    fixture.occupancy[index] !== 0 || fixture.wall[index] !== 0;
  const sample = (
    field: Float32Array,
    own: number,
    i: number,
    j: number,
    k: number,
  ) => {
    if (i < 0 || i >= nx || j < 0 || j >= ny || k < 0 || k >= nz) {
      return mutation === "zero-face-reflection" ? 0 : own;
    }
    const neighbor = k * plane + j * nx + i;
    if (fixture.occupancy[neighbor] !== 0) {
      return mutation === "zero-attached-reflection" ? 0 : own;
    }
    if (fixture.wall[neighbor] !== 0) {
      return mutation === "zero-wall-reflection" ? 0 : own;
    }
    return field[neighbor];
  };

  const stream =
    mutation === "wrong-noise-stream"
      ? STREAM_NOISE_XI + 1
      : STREAM_NOISE_XI;
  for (let index = 0; index < count; index++) {
    const xi = Math.fround(
      fixture.noiseEpsilon *
        randomBit(fixture.rngSeed, index, fixture.tick, stream),
    );
    noise[index] = xi;
    noised[index] = Math.fround(
      fixture.source[index] - fMul(xi, fixture.source[index]),
    );
  }

  for (let index = 0; index < count; index++) {
    if (blocked(index)) continue;
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / nx);
    const i = remainder - j * nx;
    const own = noised[index];
    const pairs = [
      fAdd(
        sample(noised, own, i + 1, j, k),
        sample(noised, own, i - 1, j, k),
      ),
      fAdd(
        sample(noised, own, i, j + 1, k),
        sample(noised, own, i, j - 1, k),
      ),
      fAdd(
        sample(noised, own, i + 1, j - 1, k),
        sample(noised, own, i - 1, j + 1, k),
      ),
    ];
    if (mutation !== "unsorted-pairs") pairs.sort((left, right) => left - right);
    inPlane[index] = Math.fround(
      fAdd(fAdd(fAdd(own, pairs[0]), pairs[1]), pairs[2]) / 7,
    );
  }

  for (let index = 0; index < count; index++) {
    if (blocked(index)) continue;
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / nx);
    const i = remainder - j * nx;
    const own = inPlane[index];
    const pair = fAdd(
      sample(inPlane, own, i, j, k + 1),
      sample(inPlane, own, i, j, k - 1),
    );
    vertical[index] = fAdd(fMul(4 / 7, own), fMul(3 / 14, pair));
  }

  for (let index = 0; index < count; index++) {
    if (blocked(index)) continue;
    if (mutation === "skip-drift") {
      drifted[index] = vertical[index];
      continue;
    }
    const k = Math.floor(index / plane);
    const own = vertical[index];
    const below = index - plane;
    const above = index + plane;
    const freeBelow = k > 0 && !blocked(below);
    const freeAbove = k + 1 < nz && !blocked(above);
    const retained = freeBelow
      ? Math.fround(own - fMul(fixture.phi, own))
      : own;
    drifted[index] = freeAbove
      ? fAdd(retained, fMul(fixture.phi, vertical[above]))
      : retained;
  }

  for (let index = 0; index < count; index++) {
    if (blocked(index)) continue;
    result[index] = fAdd(
      drifted[index],
      fMul(noise[index], fixture.source[index]),
    );
    if (mutation !== "skip-clamp" && fixture.topology[index] !== 0) {
      result[index] = Math.fround(fixture.rho);
    }
  }
  return result;
}

function numericalDifference(
  reference: Float32Array,
  candidate: Float32Array,
): { readonly changed: number; readonly maxAbs: number } {
  let changed = 0;
  let maxAbs = 0;
  for (let index = 0; index < reference.length; index++) {
    const difference = Math.abs(reference[index] - candidate[index]);
    if (difference !== 0) changed++;
    maxAbs = Math.max(maxAbs, difference);
  }
  return { changed, maxAbs };
}

describe("independent GPU G-G diffusion numerical contract", () => {
  test("rejects reflection, pair-order, noise, drift, and post-commit clamp mutations", () => {
    const dims = { nx: 5, ny: 4, nz: 3 } as const;
    const count = dims.nx * dims.ny * dims.nz;
    const source = new Float32Array(count);
    const magnitudes = [1e-7, 0.00031, 0.047, 0.3, 0.91, 12_345];
    for (let index = 0; index < count; index++) {
      source[index] = Math.fround(
        magnitudes[index % magnitudes.length] *
          (1 + (index % 7) / 32),
      );
    }
    const occupancy = new Uint32Array(count);
    const wall = new Uint32Array(count);
    const topology = new Uint32Array(count);
    occupancy[1 * 20 + 2 * 5 + 2] = 1;
    wall[1 * 20 + 1 * 5 + 3] = 1;
    source[32] = 0;
    source[28] = 0;
    topology[0] = 1;
    topology[count - 1] = 1;
    const fixture: PureDiffusionCase = {
      dims,
      source,
      occupancy,
      wall,
      topology,
      phi: Math.fround(0.17),
      rho: Math.fround(0.123),
      noiseEpsilon: Math.fround(0.125),
      rngSeed: 0x2468_ace0,
      tick: 19,
    };
    const reference = independentDiffusionPass(fixture, "none");
    expect(reference).toHaveLength(60);
    expect(reference[32]).toBe(0);
    expect(reference[28]).toBe(0);
    expect(reference[0]).toBe(Math.fround(0.123));
    expect(reference[59]).toBe(Math.fround(0.123));

    for (const mutation of [
      "zero-face-reflection",
      "zero-attached-reflection",
      "zero-wall-reflection",
      "unsorted-pairs",
      "wrong-noise-stream",
      "skip-drift",
      "skip-clamp",
    ] as const) {
      const difference = numericalDifference(
        reference,
        independentDiffusionPass(fixture, mutation),
      );
      expect(difference.changed, mutation).toBeGreaterThan(0);
      expect(difference.maxAbs, mutation).toBeGreaterThan(0);
    }
  });
});

interface FakeGpu {
  readonly device: GPUDevice;
  readonly entryPoints: string[];
  readonly dispatches: string[];
  readonly buffers: { destroy: ReturnType<typeof vi.fn>; size: number }[];
}

function fakeGpu(
  lost = new Promise<GPUDeviceLostInfo>(() => undefined),
): FakeGpu {
  const entryPoints: string[] = [];
  const dispatches: string[] = [];
  const buffers: { destroy: ReturnType<typeof vi.fn>; size: number }[] = [];
  const queue = {
    writeBuffer: vi.fn(),
    submit: vi.fn(),
    onSubmittedWorkDone: vi.fn(async () => undefined),
  };
  const device = {
    limits: {
      maxBufferSize: 1_000_000,
      maxStorageBufferBindingSize: 1_000_000,
    },
    lost,
    destroy: vi.fn(),
    queue,
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

describe("GPU G-G diffusion orchestration", () => {
  test("rejects every cross-device arena/controller composition before GPU work", async () => {
    const first = fakeGpu();
    const second = fakeGpu();
    const plan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const firstArena = GpuBufferArena.create(first.device, 1, plan);
    const firstSubmissions = new GpuSubmissionController(first.device);
    firstSubmissions.acknowledgeEdit(1);
    await expect(
      GpuGgDiffusion.create(
        second.device,
        firstSubmissions,
        firstArena,
        validInput(plan.layout.cellCount, "reflecting"),
      ),
    ).rejects.toThrow(/arena belongs to a different device/);
    expect(second.device.createShaderModule).not.toHaveBeenCalled();
    expect(second.device.queue.writeBuffer).not.toHaveBeenCalled();

    const secondSubmissions = new GpuSubmissionController(second.device);
    secondSubmissions.acknowledgeEdit(1);
    await expect(
      GpuGgDiffusion.create(
        first.device,
        secondSubmissions,
        firstArena,
        validInput(plan.layout.cellCount, "reflecting"),
      ),
    ).rejects.toThrow(/controller belongs to a different device/);
    expect(first.device.createShaderModule).not.toHaveBeenCalled();
    expect(first.device.queue.writeBuffer).not.toHaveBeenCalled();
    firstArena.destroy();
    firstSubmissions.destroy();
    secondSubmissions.destroy();
  });

  test("rejects destroyed or lost controllers before creation and refuses access after later loss", async () => {
    const plan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const destroyedFake = fakeGpu();
    const destroyedArena = GpuBufferArena.create(
      destroyedFake.device,
      1,
      plan,
    );
    const destroyedSubmissions = new GpuSubmissionController(
      destroyedFake.device,
    );
    destroyedSubmissions.acknowledgeEdit(1);
    destroyedSubmissions.destroy();
    await expect(
      GpuGgDiffusion.create(
        destroyedFake.device,
        destroyedSubmissions,
        destroyedArena,
        validInput(plan.layout.cellCount, "reflecting"),
      ),
    ).rejects.toThrow(/controller is destroyed/);
    expect(destroyedFake.device.createShaderModule).not.toHaveBeenCalled();
    expect(destroyedFake.device.queue.writeBuffer).not.toHaveBeenCalled();
    destroyedArena.destroy();

    let resolvePreCreateLoss:
      | ((info: GPUDeviceLostInfo) => void)
      | undefined;
    const preCreateLost = new Promise<GPUDeviceLostInfo>((resolve) => {
      resolvePreCreateLoss = resolve;
    });
    const lostFake = fakeGpu(preCreateLost);
    const lostArena = GpuBufferArena.create(lostFake.device, 1, plan);
    const lostSubmissions = new GpuSubmissionController(lostFake.device);
    lostSubmissions.acknowledgeEdit(1);
    resolvePreCreateLoss?.({
      reason: "unknown",
      message: "lost before diffusion creation",
    } as GPUDeviceLostInfo);
    await Promise.resolve();
    await Promise.resolve();
    await expect(
      GpuGgDiffusion.create(
        lostFake.device,
        lostSubmissions,
        lostArena,
        validInput(plan.layout.cellCount, "reflecting"),
      ),
    ).rejects.toThrow(/device was lost/);
    expect(lostFake.device.createShaderModule).not.toHaveBeenCalled();
    expect(lostFake.device.queue.writeBuffer).not.toHaveBeenCalled();
    lostArena.destroy();
    lostSubmissions.destroy();

    let resolveLaterLoss:
      | ((info: GPUDeviceLostInfo) => void)
      | undefined;
    const laterLost = new Promise<GPUDeviceLostInfo>((resolve) => {
      resolveLaterLoss = resolve;
    });
    const activeFake = fakeGpu(laterLost);
    const activeArena = GpuBufferArena.create(activeFake.device, 1, plan);
    const activeSubmissions = new GpuSubmissionController(activeFake.device);
    activeSubmissions.acknowledgeEdit(1);
    const diffusion = await GpuGgDiffusion.create(
      activeFake.device,
      activeSubmissions,
      activeArena,
      validInput(plan.layout.cellCount, "reflecting"),
    );
    resolveLaterLoss?.({
      reason: "unknown",
      message: "lost after diffusion creation",
    } as GPUDeviceLostInfo);
    await Promise.resolve();
    await Promise.resolve();
    expect(() => diffusion.activeVaporName()).toThrow(/device was lost/);
    expect(() => diffusion.activeVaporBuffer()).toThrow(/device was lost/);
    diffusion.destroy();
    activeArena.destroy();
    activeSubmissions.destroy();
  });

  test("uses explicit ping-pong ownership and the minimal reflecting pass graph", async () => {
    const fake = fakeGpu();
    const plan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const arena = GpuBufferArena.create(fake.device, 1, plan);
    const submissions = new GpuSubmissionController(fake.device, () => 1);
    submissions.acknowledgeEdit(1);
    const diffusion = await GpuGgDiffusion.create(
      fake.device,
      submissions,
      arena,
      validInput(plan.layout.cellCount, "reflecting"),
    );
    await expect(
      GpuGgDiffusion.create(
        fake.device,
        submissions,
        arena,
        validInput(plan.layout.cellCount, "reflecting"),
      ),
    ).rejects.toThrow(/already claimed/);
    expect(fake.entryPoints.sort()).toEqual([
      "applyDrift",
      "applyNoise",
      "clampDirichlet",
      "commitDiffusion",
      "diffuseInPlane",
      "diffuseVertical",
      "prepareNoise",
    ]);
    expect(diffusion.activeVaporName()).toBe("ggVaporA");
    await diffusion.runPasses(1);
    expect(diffusion.activeVaporName()).toBe("ggVaporB");
    expect(fake.dispatches).toEqual([
      "diffuseInPlane",
      "diffuseVertical",
      "commitDiffusion",
    ]);
    fake.dispatches.length = 0;
    await diffusion.runPasses(2);
    expect(diffusion.activeVaporName()).toBe("ggVaporB");
    expect(diffusion.completedPasses()).toBe(3);
    expect(fake.dispatches).toHaveLength(6);
    const pending = diffusion.runPasses(1, "exclusive");
    const overlap = diffusion.runPasses(1, "overlap");
    expect(() => diffusion.destroy()).toThrow(/in flight/);
    await expect(overlap).rejects.toThrow(/already in flight/);
    await pending;
    diffusion.destroy();
    diffusion.destroy();
    expect(diffusion.isDestroyed()).toBe(true);
    expect(() => diffusion.activeVaporName()).toThrow(/destroyed/);
    const replacement = await GpuGgDiffusion.create(
      fake.device,
      submissions,
      arena,
      validInput(plan.layout.cellCount, "reflecting"),
    );
    replacement.destroy();
    arena.destroy();
  });

  test("orders noise, averages, drift, commit, and Dirichlet clamp", async () => {
    const fake = fakeGpu();
    const plan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const arena = GpuBufferArena.create(fake.device, 7, plan);
    const submissions = new GpuSubmissionController(fake.device, () => 1);
    submissions.acknowledgeEdit(7);
    const input = {
      ...validInput(plan.layout.cellCount, "dirichlet"),
      phi: 0.01,
      noiseEpsilon: 1e-5,
    };
    const diffusion = await GpuGgDiffusion.create(
      fake.device,
      submissions,
      arena,
      input,
    );
    await diffusion.runPasses(1, "ordered");
    expect(fake.dispatches).toEqual([
      "prepareNoise",
      "applyNoise",
      "diffuseInPlane",
      "diffuseVertical",
      "applyDrift",
      "commitDiffusion",
      "clampDirichlet",
    ]);
    submissions.acknowledgeEdit(8);
    expect(() => diffusion.activeVaporName()).toThrow(/stale/);
    await expect(diffusion.runPasses(1)).rejects.toThrow(/stale/);
    diffusion.destroy();
    arena.destroy();
  });

  test("fails closed on pass caps and destroys partial uniform allocation", async () => {
    const fake = fakeGpu();
    const plan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const arena = GpuBufferArena.create(fake.device, 1, plan);
    const submissions = new GpuSubmissionController(fake.device, () => 1);
    submissions.acknowledgeEdit(1);
    const diffusion = await GpuGgDiffusion.create(
      fake.device,
      submissions,
      arena,
      validInput(plan.layout.cellCount, "reflecting"),
    );
    await expect(diffusion.runPasses(65)).rejects.toThrow(/passCount/);
    diffusion.destroy();
    arena.destroy();

    const failing = fakeGpu();
    const failingPlan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const failingArena = GpuBufferArena.create(
      failing.device,
      1,
      failingPlan,
    );
    const failingSubmissions = new GpuSubmissionController(
      failing.device,
      () => 1,
    );
    failingSubmissions.acknowledgeEdit(1);
    let writes = 0;
    vi.mocked(failing.device.queue.writeBuffer).mockImplementation(() => {
      writes++;
      if (writes === 2) throw new Error("injected upload failure");
    });
    await expect(
      GpuGgDiffusion.create(
        failing.device,
        failingSubmissions,
        failingArena,
        validInput(failingPlan.layout.cellCount, "reflecting"),
      ),
    ).rejects.toThrow(/injected upload failure/);
    expect(failing.buffers.at(-1)?.destroy).toHaveBeenCalledOnce();
    expect(failingArena.isDestroyed()).toBe(true);
  });

  test("poisons host ownership and destroys the arena after uncertain submitted work", async () => {
    const fake = fakeGpu();
    const plan = createGpuBufferPlan({ nx: 3, ny: 3, nz: 3 }, "gg");
    const arena = GpuBufferArena.create(fake.device, 1, plan);
    const submissions = new GpuSubmissionController(fake.device, () => 1);
    submissions.acknowledgeEdit(1);
    const diffusion = await GpuGgDiffusion.create(
      fake.device,
      submissions,
      arena,
      validInput(plan.layout.cellCount, "reflecting"),
    );
    vi.mocked(fake.device.queue.onSubmittedWorkDone).mockRejectedValueOnce(
      new Error("injected completion uncertainty"),
    );
    await expect(diffusion.runPasses(1, "uncertain")).rejects.toThrow(
      /injected completion uncertainty/,
    );
    expect(diffusion.isDestroyed()).toBe(true);
    expect(arena.isDestroyed()).toBe(true);
    expect(diffusion.completedPasses()).toBe(0);
    expect(() => diffusion.activeVaporName()).toThrow(
      /poisoned: injected completion uncertainty/,
    );
    expect(() => diffusion.activeVaporBuffer()).toThrow(/poisoned/);
    await expect(diffusion.runPasses(1, "retry")).rejects.toThrow(/poisoned/);
    for (const buffer of fake.buffers) {
      expect(buffer.destroy).toHaveBeenCalledOnce();
    }
  });
});
