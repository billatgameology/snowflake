import { describe, expect, test, vi } from "vitest";
import {
  createGpuBufferPlan,
  GpuBufferArena,
  GpuReadbackAudit,
  GpuSubmissionController,
  validateGpuRequirements,
} from "../src/index.ts";

function fakeBuffer() {
  return {
    destroy: vi.fn(),
  } as unknown as GPUBuffer;
}

describe("GPU capability checks", () => {
  test("accepts an exact requirement set and names every missing capability", () => {
    const requirements = {
      requiredFeatures: ["timestamp-query"] as const,
      requiredLimits: {
        maxBufferSize: 1024,
        maxStorageBuffersPerShaderStage: 8,
      },
    };
    expect(
      validateGpuRequirements(
        {
          features: new Set(["timestamp-query"]),
          limits: {
            maxBufferSize: 1024,
            maxStorageBuffersPerShaderStage: 8,
          },
        },
        requirements,
      ),
    ).toEqual({
      supported: true,
      missingFeatures: [],
      insufficientLimits: [],
    });

    const rejected = validateGpuRequirements(
      {
        features: new Set(),
        limits: {
          maxBufferSize: 1_023,
        },
      },
      requirements,
    );
    expect(rejected.supported).toBe(false);
    expect(rejected.missingFeatures).toEqual(["timestamp-query"]);
    expect(rejected.insufficientLimits).toEqual([
      { name: "maxBufferSize", required: 1024, observed: 1_023 },
      {
        name: "maxStorageBuffersPerShaderStage",
        required: 8,
        observed: null,
      },
    ]);
  });
});

describe("GPU buffer ownership", () => {
  test("allocates the plan, validates uploads, and destroys exactly once", () => {
    const created: GPUBuffer[] = [];
    const queue = { writeBuffer: vi.fn() };
    const device = {
      createBuffer: vi.fn(() => {
        const buffer = fakeBuffer();
        created.push(buffer);
        return buffer;
      }),
      queue,
    } as unknown as GPUDevice;
    const plan = createGpuBufferPlan({ nx: 3, ny: 4, nz: 5 }, "gg");
    const arena = GpuBufferArena.create(device, 2, plan);

    expect(arena.names()).toHaveLength(plan.buffers.length);
    expect(arena.byteLength("occupancy")).toBe(240);
    arena.upload(device, "occupancy", new Uint32Array([1, 2, 3]), 4);
    expect(queue.writeBuffer).toHaveBeenCalledOnce();
    expect(() =>
      arena.upload(device, "occupancy", new Uint8Array([1]), 0),
    ).toThrow(/invalid/);

    arena.destroy();
    arena.destroy();
    expect(arena.isDestroyed()).toBe(true);
    for (const buffer of created) {
      expect(buffer.destroy).toHaveBeenCalledOnce();
    }
    expect(() => arena.get("occupancy")).toThrow(/destroyed/);
  });

  test("cleans up already-created buffers if allocation fails", () => {
    const first = fakeBuffer();
    let calls = 0;
    const device = {
      createBuffer: vi.fn(() => {
        calls++;
        if (calls === 2) throw new Error("injected allocation failure");
        return first;
      }),
    } as unknown as GPUDevice;
    const plan = createGpuBufferPlan({ nx: 2, ny: 2, nz: 2 }, "lk");
    expect(() => GpuBufferArena.create(device, 0, plan)).toThrow(
      /injected allocation failure/,
    );
    expect(first.destroy).toHaveBeenCalledOnce();
  });
});

describe("GPU readback residency audit", () => {
  test("allows named evidence and rejects a full-field display-frame transfer", () => {
    const audit = new GpuReadbackAudit();
    audit.authorize({
      purpose: "named-probe",
      label: "picked-cell",
      generation: 4,
      byteOffset: 16,
      byteLength: 4,
      fullField: false,
      displayFrame: true,
    });
    audit.authorize({
      purpose: "evidence-snapshot",
      label: "final-field",
      generation: 4,
      byteOffset: 0,
      byteLength: 4_096,
      fullField: true,
      displayFrame: false,
    });
    expect(() =>
      audit.authorize({
        purpose: "test",
        label: "forbidden-frame-transfer",
        generation: 4,
        byteOffset: 0,
        byteLength: 4_096,
        fullField: true,
        displayFrame: true,
      }),
    ).toThrow(/forbidden/);
    expect(audit.records()).toHaveLength(2);
    expect(audit.fullFieldDisplayFrameCount()).toBe(0);
    expect(audit.totalBytes()).toBe(4_100);
  });
});

describe("GPU submission lifecycle", () => {
  test("rejects stale generations and records completed work", async () => {
    const submit = vi.fn();
    const onSubmittedWorkDone = vi.fn(async () => undefined);
    const destroy = vi.fn();
    const lost = new Promise<GPUDeviceLostInfo>(() => undefined);
    const device = {
      queue: { submit, onSubmittedWorkDone },
      destroy,
      lost,
    } as unknown as GPUDevice;
    const clockValues = [10, 11, 21];
    const controller = new GpuSubmissionController(
      device,
      () => clockValues.shift() ?? 21,
    );

    expect(controller.acknowledgeEdit(1)).toBe(10);
    await expect(
      controller.submit("stale", 0, [{} as GPUCommandBuffer]),
    ).rejects.toThrow(/stale/);
    await expect(
      controller.submit("current", 1, [{} as GPUCommandBuffer]),
    ).resolves.toEqual({
      label: "current",
      generation: 1,
      startedMs: 11,
      completedMs: 21,
      wallMs: 10,
    });
    expect(submit).toHaveBeenCalledOnce();
    expect(onSubmittedWorkDone).toHaveBeenCalledOnce();
    expect(controller.records()).toHaveLength(1);

    controller.destroy();
    controller.destroy();
    expect(destroy).toHaveBeenCalledOnce();
    await expect(
      controller.submit("after-destroy", 1, [{} as GPUCommandBuffer]),
    ).rejects.toThrow(/destroyed/);
  });
});
