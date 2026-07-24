import { describe, expect, test, vi } from "vitest";
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
    lost: new Promise<GPUDeviceLostInfo>(() => undefined),
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
});
