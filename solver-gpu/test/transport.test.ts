import { describe, expect, test, vi } from "vitest";
import {
  createGpuBufferPlan,
  GpuBufferArena,
  GpuReadbackAudit,
  GpuSubmissionController,
  requestCheckedGpuDevice,
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

  test("rejects omitted or downgraded limits before the production device request", async () => {
    const requirements = {
      requiredFeatures: ["timestamp-query"] as const,
      requiredLimits: {
        maxBufferSize: 1_024,
        maxStorageBuffersPerShaderStage: 8,
      },
    };
    const returnedDevice = {} as GPUDevice;
    const requestDevice = vi.fn(async () => returnedDevice);
    const adapter = {
      features: new Set(["timestamp-query"]),
      limits: {
        maxBufferSize: 2_048,
        maxStorageBuffersPerShaderStage: 16,
      },
      requestDevice,
    } as unknown as GPUAdapter;

    await expect(
      requestCheckedGpuDevice(adapter, requirements, requirements, "exact"),
    ).resolves.toBe(returnedDevice);
    expect(requestDevice).toHaveBeenCalledOnce();
    expect(requestDevice).toHaveBeenCalledWith({
      label: "exact",
      requiredFeatures: ["timestamp-query"],
      requiredLimits: requirements.requiredLimits,
    });

    const omitted = {
      ...requirements,
      requiredLimits: { maxStorageBuffersPerShaderStage: 8 },
    };
    await expect(
      requestCheckedGpuDevice(adapter, omitted, requirements, "omitted"),
    ).rejects.toThrow(/limit request does not match the frozen policy/);
    const downgraded = {
      ...requirements,
      requiredLimits: {
        ...requirements.requiredLimits,
        maxBufferSize: 1_023,
      },
    };
    await expect(
      requestCheckedGpuDevice(adapter, downgraded, requirements, "downgraded"),
    ).rejects.toThrow(/limit request does not match the frozen policy/);
    expect(requestDevice).toHaveBeenCalledOnce();
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
      limits: {
        maxBufferSize: 1_000_000,
        maxStorageBufferBindingSize: 1_000_000,
      },
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
      limits: {
        maxBufferSize: 1_000_000,
        maxStorageBufferBindingSize: 1_000_000,
      },
    } as unknown as GPUDevice;
    const plan = createGpuBufferPlan({ nx: 2, ny: 2, nz: 2 }, "lk");
    expect(() => GpuBufferArena.create(device, 0, plan)).toThrow(
      /injected allocation failure/,
    );
    expect(first.destroy).toHaveBeenCalledOnce();
  });

  test("rejects a forged plan before creating any GPU resource", () => {
    const createBuffer = vi.fn(() => fakeBuffer());
    const device = {
      createBuffer,
      limits: {
        maxBufferSize: 1_000_000,
        maxStorageBufferBindingSize: 1_000_000,
      },
    } as unknown as GPUDevice;
    const canonical = createGpuBufferPlan({ nx: 2, ny: 2, nz: 2 }, "gg");
    const forged = {
      ...canonical,
      buffers: canonical.buffers.map((buffer, index) =>
        index === 1 ? { ...buffer, name: "occupancy" } : buffer,
      ),
    };
    expect(() => GpuBufferArena.create(device, 0, forged)).toThrow(
      /schema mismatch/,
    );
    expect(createBuffer).not.toHaveBeenCalled();
  });
});

describe("GPU readback residency audit", () => {
  test("allows named evidence and rejects a full-field display-frame transfer", () => {
    const audit = new GpuReadbackAudit();
    const source = { size: 4_096 };
    const pickedFrame = audit.beginDisplayFrame("picked-frame");
    audit.authorize({
      purpose: "named-probe",
      label: "picked-cell",
      generation: 4,
      byteOffset: 16,
      byteLength: 4,
      displayFrame: pickedFrame,
    }, source);
    audit.endDisplayFrame(pickedFrame);
    audit.authorize({
      purpose: "evidence-snapshot",
      label: "final-field",
      generation: 4,
      byteOffset: 0,
      byteLength: 4_096,
    }, source);
    const forbiddenFrame = audit.beginDisplayFrame("forbidden-frame");
    expect(() =>
      audit.authorize({
        purpose: "test",
        label: "forbidden-frame-transfer",
        generation: 4,
        byteOffset: 0,
        byteLength: 4_096,
        displayFrame: forbiddenFrame,
        fullField: false,
      } as never, source),
    ).toThrow(/forbidden/);
    audit.endDisplayFrame(forbiddenFrame);
    expect(() =>
      audit.authorize({
        purpose: "forged-purpose",
        label: "invalid-purpose",
        generation: 4,
        byteOffset: 0,
        byteLength: 4,
      } as never, source),
    ).toThrow(/unsupported GPU readback purpose/);
    expect(() =>
      audit.authorize({
        purpose: "test",
        label: "overrun",
        generation: 4,
        byteOffset: 4_092,
        byteLength: 8,
      }, source),
    ).toThrow(/exceeds the actual source/);
    expect(audit.records()).toHaveLength(2);
    expect(audit.records().map((record) => record.fullField)).toEqual([
      false,
      true,
    ]);
    expect(audit.fullFieldDisplayFrameCount()).toBe(0);
    expect(audit.totalBytes()).toBe(4_100);
  });

  test("rejects two display-frame chunks that cumulatively cover one source", () => {
    const audit = new GpuReadbackAudit();
    const source = { size: 4_096 };
    const frame = audit.beginDisplayFrame("chunked-frame");
    expect(() =>
      audit.authorize({
        purpose: "named-probe",
        label: "omitted-active-frame-token",
        generation: 7,
        byteOffset: 0,
        byteLength: 4_096,
      }, source),
    ).toThrow(/active display frame requires its token/);
    audit.authorize({
      purpose: "named-probe",
      label: "first-half",
      generation: 7,
      byteOffset: 0,
      byteLength: 2_048,
      displayFrame: frame,
    }, source);
    expect(() =>
      audit.authorize({
        purpose: "named-probe",
        label: "second-half",
        generation: 7,
        byteOffset: 2_048,
        byteLength: 2_048,
        displayFrame: frame,
      }, source),
    ).toThrow(/cumulative full-field display-frame readback is forbidden/);
    audit.endDisplayFrame(frame);
    expect(audit.records()).toHaveLength(1);
    expect(audit.records()[0]).toMatchObject({
      sourceId: 0,
      displayFrame: true,
      displayFrameSequence: 0,
      displayFrameLabel: "chunked-frame",
    });
    expect(audit.totalBytes()).toBe(2_048);
    expect(audit.fullFieldDisplayFrameCount()).toBe(0);
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

  test("rejects work that becomes stale while the GPU submission is in flight", async () => {
    let completeWork: (() => void) | undefined;
    const workDone = new Promise<void>((resolve) => {
      completeWork = resolve;
    });
    const device = {
      queue: {
        submit: vi.fn(),
        onSubmittedWorkDone: vi.fn(() => workDone),
      },
      destroy: vi.fn(),
      lost: new Promise<GPUDeviceLostInfo>(() => undefined),
    } as unknown as GPUDevice;
    const controller = new GpuSubmissionController(device, () => 1);
    controller.acknowledgeEdit(1);
    const pending = controller.submit(
      "generation-one",
      1,
      [{} as GPUCommandBuffer],
    );
    await Promise.resolve();
    controller.acknowledgeEdit(2);
    completeWork?.();
    await expect(pending).rejects.toThrow(/became stale while in flight/);
    expect(controller.records()).toHaveLength(0);
    controller.destroy();
  });
});
