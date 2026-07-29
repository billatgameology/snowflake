/// <reference types="@webgpu/types" />
// Production GPU device acquisition (WP6 frozen design D2/D4, slice S2). The app acquires
// ONE checked device — the high-performance adapter through the production
// requestCheckedGpuDevice path, against the FROZEN Phase 5 features/limits — and hands it
// to Three.js through the first-class `device` constructor parameter, so the renderer and
// the (S3) GPU engine share a single device. Acquisition failure is a first-class,
// honestly-reported outcome, never a silent downgrade (charter §1.5): every skip or
// failure carries a named reason and an exact status line, and the fallback is today's
// CPU-worker instrument path unchanged.
//
// Both observation channels (uncapturederror, device.lost) attach the moment the device
// exists — the same pattern the accepted performance probe installs at interception time —
// so no early error or loss can escape the record. The observed lists are exposed live on
// the acquisition outcome and reported by value through __vccDebug.gpuDeviceStatus().

import { requestCheckedGpuDevice, type GpuRequirementSet } from "@vcc/solver-gpu";
import {
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

/** The label the app's one production device is created under (visible in GPU tooling). */
export const APP_GPU_DEVICE_LABEL = "vcc-app-shared-device";

/** Why the checked acquisition was skipped or failed — D4's fallback taxonomy. */
export type GpuFallbackReason =
  /** `?webgl2=1`: the operator forced the WebGL2 rendering fallback. */
  | "forced-webgl2"
  /** `?engine=cpu`: the legacy-harness pin to today's byte-comparable CPU path. */
  | "forced-cpu-engine"
  /** This browser exposes no `navigator.gpu`. */
  | "webgpu-unavailable"
  /** The high-performance adapter request answered null (or itself threw). */
  | "no-adapter"
  /** The checked feature/limit device request threw. */
  | "device-request-failed";

/** One observed device-loss record (reason and message exactly as the browser reported). */
export interface GpuDeviceLossRecord {
  readonly reason: string;
  readonly message: string;
}

/** Checked acquisition succeeded: the live device plus everything observed about it. */
export interface AcquiredGpuDevice {
  readonly state: "acquired";
  readonly device: GPUDevice;
  readonly label: string;
  /** The device's actual feature set, read after creation (observed, never assumed). */
  readonly observedFeatures: readonly string[];
  /** The device's actual values for exactly the frozen limit names. */
  readonly observedLimits: Readonly<Record<string, number>>;
  /** LIVE list: uncaptured error messages, observed from first device existence. */
  readonly uncapturedErrors: readonly string[];
  /** LIVE list: device-loss records, observed from first device existence. */
  readonly deviceLossRecords: readonly GpuDeviceLossRecord[];
}

/** Checked acquisition skipped or failed; the app boots today's path and says so. */
export interface GpuFallback {
  readonly state: "fallback";
  readonly reason: GpuFallbackReason;
  /** The thrown message when one exists (request failures); null otherwise. */
  readonly detail: string | null;
}

export type GpuAcquisition = AcquiredGpuDevice | GpuFallback;

/**
 * The acquisition outcome minus the live GPUDevice — everything the pure status/report
 * formatters need, so they (and their node tests) never touch a WebGPU object. Every
 * GpuAcquisition is assignable to this view.
 */
export type GpuAcquisitionView = Omit<AcquiredGpuDevice, "device"> | GpuFallback;

/** The skip reasons decidable BEFORE any WebGPU call (URL pins and API presence). */
export type GpuBootSkipReason = Extract<
  GpuFallbackReason,
  "forced-webgl2" | "forced-cpu-engine" | "webgpu-unavailable"
>;

export type GpuBootDecision =
  | { readonly attempt: true; readonly skipReason: null }
  | { readonly attempt: false; readonly skipReason: GpuBootSkipReason };

/**
 * Boot decision (D4): whether to attempt the checked acquisition at all. Precedence:
 * `?webgl2=1` first (it forces the WebGL2 renderer, so a shared WebGPU device would be
 * unusable), then `?engine=cpu` (the legacy pin to today's byte-comparable path — in S2
 * the solver is the CPU worker on every branch, so the pin only skips device injection),
 * then WebGPU presence. Values are matched exactly: `webgl2=1` and `engine=cpu` are the
 * two recognized pins, anything else falls through to the default attempt.
 */
export function decideGpuBoot(params: URLSearchParams, webGpuAvailable: boolean): GpuBootDecision {
  if (params.get("webgl2") === "1") return { attempt: false, skipReason: "forced-webgl2" };
  if (params.get("engine") === "cpu") return { attempt: false, skipReason: "forced-cpu-engine" };
  if (!webGpuAvailable) return { attempt: false, skipReason: "webgpu-unavailable" };
  return { attempt: true, skipReason: null };
}

/**
 * The exact status-panel line for an acquisition outcome. Honest by construction (charter
 * §1.5): in S2 the solver runs in the CPU worker on EVERY branch (the GPU engine is S3),
 * and each fallback names its reason instead of downgrading silently.
 */
export function gpuStatusLine(view: GpuAcquisitionView): string {
  if (view.state === "acquired") {
    // Device-level line only: which solver engine is active is main.ts's dynamic status,
    // composed beside this one, so this wording must stay engine-neutral.
    return (
      "gpu: production device acquired (checked against frozen Phase 5 features/limits) — " +
      "shared with the renderer; solver engine per the engine selector"
    );
  }
  switch (view.reason) {
    case "forced-webgl2":
      return "gpu: not requested (?webgl2=1 forces the WebGL2 rendering fallback) — solver: CPU worker";
    case "forced-cpu-engine":
      return "gpu: not requested (?engine=cpu pins the CPU engine) — solver: CPU worker";
    case "webgpu-unavailable":
      return "gpu: unavailable (this browser exposes no navigator.gpu) — solver: CPU worker";
    case "no-adapter":
      return view.detail === null
        ? "gpu: unavailable (no adapter answered the high-performance request) — solver: CPU worker"
        : `gpu: unavailable (adapter request failed: ${view.detail}) — solver: CPU worker`;
    case "device-request-failed":
      return `gpu: checked device request failed (${view.detail ?? "no error detail"}) — solver: CPU worker`;
  }
}

/**
 * Serializable status report for __vccDebug.gpuDeviceStatus(): the outcome, the frozen
 * requirement set the request was checked against, the observed capability, and BY-VALUE
 * copies of the live observation lists at call time.
 */
export interface GpuDeviceStatusReport {
  readonly state: "acquired" | "fallback";
  /** Fallback taxonomy id (null when acquired). */
  readonly reason: GpuFallbackReason | null;
  /** Thrown acquisition error message when one exists; null otherwise. */
  readonly detail: string | null;
  /** The exact honest line the status panel renders for this outcome. */
  readonly statusLine: string;
  /** Device label of the acquired production device (null in fallback). */
  readonly label: string | null;
  /** The frozen Phase 5 requirement set (owned copies, never the live tables). */
  readonly requiredFeatures: readonly string[];
  readonly requiredLimits: Readonly<Record<string, number>>;
  /** Observed device capability (null in fallback — nothing was observed, so nothing is claimed). */
  readonly observedFeatures: readonly string[] | null;
  readonly observedLimits: Readonly<Record<string, number>> | null;
  /** Copies of the live observation lists at call time (empty in fallback: no device ever existed). */
  readonly uncapturedErrors: readonly string[];
  readonly deviceLossRecords: readonly GpuDeviceLossRecord[];
}

export function gpuDeviceStatusReport(view: GpuAcquisitionView): GpuDeviceStatusReport {
  const requiredFeatures: readonly string[] = [...PHASE5_REQUIRED_FEATURES];
  const requiredLimits: Readonly<Record<string, number>> = { ...PHASE5_REQUIRED_LIMITS };
  if (view.state === "acquired") {
    return {
      state: "acquired",
      reason: null,
      detail: null,
      statusLine: gpuStatusLine(view),
      label: view.label,
      requiredFeatures,
      requiredLimits,
      observedFeatures: [...view.observedFeatures],
      observedLimits: { ...view.observedLimits },
      uncapturedErrors: [...view.uncapturedErrors],
      deviceLossRecords: view.deviceLossRecords.map((record) => ({ ...record })),
    };
  }
  return {
    state: "fallback",
    reason: view.reason,
    detail: view.detail,
    statusLine: gpuStatusLine(view),
    label: null,
    requiredFeatures,
    requiredLimits,
    observedFeatures: null,
    observedLimits: null,
    uncapturedErrors: [],
    deviceLossRecords: [],
  };
}

/**
 * D4 acquisition: the high-performance adapter, then the production checked device request
 * with the frozen Phase 5 requirement set — the exact call shape the accepted performance
 * probe uses (one requirement object passed as both the request and the frozen policy,
 * plus the app's device label). Never throws: every failure mode maps to a named fallback
 * outcome for the honest status line.
 */
export async function acquireProductionGpuDevice(gpu: GPU): Promise<GpuAcquisition> {
  let adapter: GPUAdapter | null;
  try {
    adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
  } catch (err) {
    return {
      state: "fallback",
      reason: "no-adapter",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
  if (adapter === null) return { state: "fallback", reason: "no-adapter", detail: null };

  const requirements: GpuRequirementSet = {
    requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
    requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
  };
  let device: GPUDevice;
  try {
    device = await requestCheckedGpuDevice(
      adapter,
      requirements,
      requirements,
      APP_GPU_DEVICE_LABEL,
    );
  } catch (err) {
    return {
      state: "fallback",
      reason: "device-request-failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  // Both observers from FIRST existence (the probe's accepted pattern): they attach before
  // the device is handed to anything else. Three's own `onuncapturederror` property
  // assignment rides a separate channel and cannot displace these listeners.
  const uncapturedErrors: string[] = [];
  const deviceLossRecords: GpuDeviceLossRecord[] = [];
  device.addEventListener("uncapturederror", (event) => {
    uncapturedErrors.push(String(event.error.message));
  });
  void device.lost.then((info) => {
    deviceLossRecords.push({ reason: String(info.reason), message: String(info.message) });
  });

  // Observed capability (recorded, never assumed): the device's actual feature set and its
  // actual values for exactly the frozen limit names.
  const observedLimits: Record<string, number> = {};
  for (const name of Object.keys(PHASE5_REQUIRED_LIMITS)) {
    const value = device.limits[name as keyof GPUSupportedLimits];
    if (typeof value === "number") observedLimits[name] = value;
  }
  return {
    state: "acquired",
    device,
    label: APP_GPU_DEVICE_LABEL,
    observedFeatures: [...device.features],
    observedLimits,
    uncapturedErrors,
    deviceLossRecords,
  };
}
