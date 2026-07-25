// Node-side tests for the pure WP6 S2 device-acquisition logic (frozen design D4): the
// boot decision and its precedence, the fallback taxonomy, the exact honest status-line
// wordings, the by-value status report, and the pre-device failure paths of the real
// acquisition function against fake WebGPU objects. The acquired-device path needs real
// hardware and is exercised on the registered host, not here.

import { describe, expect, it } from "vitest";
import {
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";
import {
  APP_GPU_DEVICE_LABEL,
  acquireProductionGpuDevice,
  decideGpuBoot,
  gpuDeviceStatusReport,
  gpuStatusLine,
  type AcquiredGpuDevice,
  type GpuFallback,
} from "../src/gpudevice.ts";

/** A fabricated acquired-outcome view (the pure formatters never touch the GPUDevice). */
function acquiredView(): Omit<AcquiredGpuDevice, "device"> {
  return {
    state: "acquired",
    label: APP_GPU_DEVICE_LABEL,
    observedFeatures: ["timestamp-query", "core-features-and-limits"],
    observedLimits: { maxBufferSize: 2_147_483_644, maxStorageBufferBindingSize: 2_147_483_644 },
    uncapturedErrors: [],
    deviceLossRecords: [],
  };
}

describe("decideGpuBoot", () => {
  it("attempts the checked acquisition by default", () => {
    expect(decideGpuBoot(new URLSearchParams(""), true)).toEqual({
      attempt: true,
      skipReason: null,
    });
  });

  it("skips for ?webgl2=1 (forced WebGL2 rendering fallback)", () => {
    expect(decideGpuBoot(new URLSearchParams("webgl2=1"), true)).toEqual({
      attempt: false,
      skipReason: "forced-webgl2",
    });
  });

  it("skips for ?engine=cpu (legacy pin to today's byte-comparable path)", () => {
    expect(decideGpuBoot(new URLSearchParams("engine=cpu"), true)).toEqual({
      attempt: false,
      skipReason: "forced-cpu-engine",
    });
  });

  it("gives ?webgl2=1 precedence over ?engine=cpu", () => {
    expect(decideGpuBoot(new URLSearchParams("webgl2=1&engine=cpu"), true).skipReason).toBe(
      "forced-webgl2",
    );
  });

  it("skips when navigator.gpu is missing", () => {
    expect(decideGpuBoot(new URLSearchParams(""), false)).toEqual({
      attempt: false,
      skipReason: "webgpu-unavailable",
    });
  });

  it("reports the URL pin, not API absence, when both hold", () => {
    expect(decideGpuBoot(new URLSearchParams("engine=cpu"), false).skipReason).toBe(
      "forced-cpu-engine",
    );
  });

  it("recognizes only the exact pin values (webgl2=1, engine=cpu)", () => {
    for (const search of ["webgl2=0", "webgl2=true", "engine=gpu", "engine=CPU", "engine="]) {
      expect(decideGpuBoot(new URLSearchParams(search), true).attempt).toBe(true);
    }
  });
});

describe("gpuStatusLine", () => {
  it("states the acquired outcome and that the solver stays in the CPU worker", () => {
    expect(gpuStatusLine(acquiredView())).toBe(
      "gpu: production device acquired (checked against frozen Phase 5 features/limits) — " +
        "shared with the renderer; solver: CPU worker (GPU engine not landed)",
    );
  });

  it("names every fallback reason exactly", () => {
    const line = (reason: GpuFallback["reason"], detail: string | null): string =>
      gpuStatusLine({ state: "fallback", reason, detail });
    expect(line("forced-webgl2", null)).toBe(
      "gpu: not requested (?webgl2=1 forces the WebGL2 rendering fallback) — solver: CPU worker",
    );
    expect(line("forced-cpu-engine", null)).toBe(
      "gpu: not requested (?engine=cpu pins the CPU engine) — solver: CPU worker",
    );
    expect(line("webgpu-unavailable", null)).toBe(
      "gpu: unavailable (this browser exposes no navigator.gpu) — solver: CPU worker",
    );
    expect(line("no-adapter", null)).toBe(
      "gpu: unavailable (no adapter answered the high-performance request) — solver: CPU worker",
    );
    expect(line("no-adapter", "adapter exploded")).toBe(
      "gpu: unavailable (adapter request failed: adapter exploded) — solver: CPU worker",
    );
    expect(line("device-request-failed", "limit too small")).toBe(
      "gpu: checked device request failed (limit too small) — solver: CPU worker",
    );
    expect(line("device-request-failed", null)).toBe(
      "gpu: checked device request failed (no error detail) — solver: CPU worker",
    );
  });
});

describe("gpuDeviceStatusReport", () => {
  it("reports a fallback with the frozen requirements and no fabricated observations", () => {
    const report = gpuDeviceStatusReport({
      state: "fallback",
      reason: "device-request-failed",
      detail: "GPU requirements are not supported: missingFeatures=timestamp-query",
    });
    expect(report.state).toBe("fallback");
    expect(report.reason).toBe("device-request-failed");
    expect(report.detail).toContain("timestamp-query");
    expect(report.statusLine).toContain("checked device request failed");
    expect(report.label).toBeNull();
    expect(report.observedFeatures).toBeNull();
    expect(report.observedLimits).toBeNull();
    expect(report.uncapturedErrors).toEqual([]);
    expect(report.deviceLossRecords).toEqual([]);
    // The frozen requirement set rides every report as owned copies, equal by value.
    expect(report.requiredFeatures).toEqual([...PHASE5_REQUIRED_FEATURES]);
    expect(report.requiredLimits).toEqual({ ...PHASE5_REQUIRED_LIMITS });
    expect(report.requiredLimits).not.toBe(PHASE5_REQUIRED_LIMITS);
  });

  it("reports an acquired outcome with label and observed capability", () => {
    const report = gpuDeviceStatusReport(acquiredView());
    expect(report.state).toBe("acquired");
    expect(report.reason).toBeNull();
    expect(report.detail).toBeNull();
    expect(report.label).toBe(APP_GPU_DEVICE_LABEL);
    expect(report.observedFeatures).toEqual(["timestamp-query", "core-features-and-limits"]);
    expect(report.observedLimits).toEqual({
      maxBufferSize: 2_147_483_644,
      maxStorageBufferBindingSize: 2_147_483_644,
    });
    expect(report.statusLine).toBe(gpuStatusLine(acquiredView()));
  });

  it("copies the live observation lists by value at call time", () => {
    const view = acquiredView();
    const uncaptured = view.uncapturedErrors as string[];
    const losses = view.deviceLossRecords as { reason: string; message: string }[];
    const before = gpuDeviceStatusReport(view);
    uncaptured.push("validation error: late");
    losses.push({ reason: "destroyed", message: "gone" });
    // The earlier report is a frozen copy; a fresh call observes the growth.
    expect(before.uncapturedErrors).toEqual([]);
    expect(before.deviceLossRecords).toEqual([]);
    const after = gpuDeviceStatusReport(view);
    expect(after.uncapturedErrors).toEqual(["validation error: late"]);
    expect(after.deviceLossRecords).toEqual([{ reason: "destroyed", message: "gone" }]);
    // And the copies do not alias the live lists.
    (after.uncapturedErrors as string[]).push("tampered");
    expect(uncaptured).toEqual(["validation error: late"]);
  });
});

describe("acquireProductionGpuDevice (pre-device failure paths, fake WebGPU objects)", () => {
  it("requests the high-performance adapter and maps a null answer to no-adapter", async () => {
    const requestedOptions: GPURequestAdapterOptions[] = [];
    const gpu = {
      requestAdapter: (options?: GPURequestAdapterOptions) => {
        if (options !== undefined) requestedOptions.push(options);
        return Promise.resolve(null);
      },
    } as unknown as GPU;
    const outcome = await acquireProductionGpuDevice(gpu);
    expect(outcome).toEqual({ state: "fallback", reason: "no-adapter", detail: null });
    expect(requestedOptions).toEqual([{ powerPreference: "high-performance" }]);
  });

  it("maps a thrown adapter request to no-adapter with the thrown detail", async () => {
    const gpu = {
      requestAdapter: () => Promise.reject(new Error("adapter enumeration failed")),
    } as unknown as GPU;
    const outcome = await acquireProductionGpuDevice(gpu);
    expect(outcome).toEqual({
      state: "fallback",
      reason: "no-adapter",
      detail: "adapter enumeration failed",
    });
  });

  it("runs the real checked request: an insufficient adapter fails by name, before requestDevice", async () => {
    let requestDeviceCalls = 0;
    const adapter = {
      features: new Set<string>(),
      limits: {},
      requestDevice: () => {
        requestDeviceCalls++;
        return Promise.reject(new Error("must not be reached"));
      },
    } as unknown as GPUAdapter;
    const gpu = {
      requestAdapter: () => Promise.resolve(adapter),
    } as unknown as GPU;
    const outcome = await acquireProductionGpuDevice(gpu);
    expect(outcome.state).toBe("fallback");
    if (outcome.state !== "fallback") throw new Error("unreachable");
    expect(outcome.reason).toBe("device-request-failed");
    // The production requestCheckedGpuDevice names the missing feature and every
    // insufficient frozen limit — and refuses before any requestDevice call.
    expect(outcome.detail).toContain("timestamp-query");
    for (const name of Object.keys(PHASE5_REQUIRED_LIMITS)) {
      expect(outcome.detail).toContain(name);
    }
    expect(requestDeviceCalls).toBe(0);
  });
});
