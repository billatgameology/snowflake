// Main thread: rendering, controls, overlays, slice, picking, HUD, and status. The solver
// runs behind the Engine seam (engine.ts, WP6 D1) — in S1 always the CPU worker — and
// nothing here ever constructs or steps a GGSolver (charter §3.1).
// Every view refresh reads the LATEST snapshot object, so pausing the solver freezes a fully
// inspectable state: slice, overlays, picking, and HUD keep working on it (freeze-and-inspect).

import { Pane } from "tweakpane";
import {
  ggParamsFromTimelineEnvironment,
  ggTimelineEnvironmentFromParams,
  latticeBBox,
  paramSlot,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGPresetName,
  type GGTimelineEnvironment,
  GG_PRESETS,
} from "@vcc/core";
import {
  DEFAULT_INIT,
  presetRho,
  validateInitConfig,
  type EngineSnapshot,
  type GpuSnapshot,
  type InitConfig,
  type SnapshotMessage,
  type StopReason,
} from "./protocol.ts";
import { WorkerEngine, type Engine, type EngineMessage } from "./engine.ts";
import {
  GPU_ENGINE_PROVENANCE,
  GpuEngine,
  gpuBudgetById,
  gpuBudgetIds,
  type GpuAuditSummary,
  type GpuControllerReport,
  type GpuDebugFieldReadback,
} from "./gpuengine.ts";
import {
  acquireProductionGpuDevice,
  decideGpuBoot,
  gpuDeviceStatusReport,
  gpuStatusLine,
  type GpuAcquisition,
  type GpuDeviceStatusReport,
} from "./gpudevice.ts";
import { GpuView, type GpuViewControls } from "./gpuview.ts";
import { surfaceCellIndices } from "./surface.ts";
import { CrystalView, type CameraPose } from "./render.ts";
import { normalizeToUnit, srgbToLinear, viridis } from "./colormap.ts";
import {
  OVERLAY_LABELS,
  OVERLAY_NAMES,
  overlayValuesFor,
  type OverlayContext,
  type OverlayName,
} from "./overlays.ts";
import {
  LK_OVERLAY_LABELS,
  assertOverlayHonest,
  lkOverlayValuesFor,
  type LKOverlayContext,
  type LKOverlayName,
} from "./lkoverlays.ts";
import {
  clampSliceIndex,
  extractSlice,
  sliceTextureSize,
  sliceWorldMatrix,
  type SliceOrientation,
} from "./slice.ts";
import { polylinePoints, pushSample, referenceLineY, type RatioSample } from "./hud.ts";
import { buildPickInfo, formatReadout } from "./readout.ts";
import { buildLKPickInfo, formatLKReadout } from "./lkreadout.ts";
import {
  inspectCheckpointBytes,
  type ArtifactEvidenceContext,
  type InspectedArtifact,
} from "./inspect.ts";
import { PHASE4_SCENARIOS, phase4ScenarioById } from "./scenarios.ts";

interface DepletionReadout {
  readonly center: number;
  readonly rim: number;
  readonly ratio: number;
}

interface VccDebug {
  tick: number;
  attached: number;
  backend: string | null;
  ticksPerSec: number | null;
  running: boolean;
  stopReason: StopReason;
  snapshotCount: number;
  errors: string[];
  depletion: DepletionReadout | null;
  lastPick: { i: number; j: number; k: number } | null;
  start: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  orbit: (azimuthDegrees: number) => void;
  setOverlay: (name: string) => boolean;
  setOverlayRange: (min: number, max: number) => void;
  setSlice: (opts: {
    enabled?: boolean;
    orientation?: SliceOrientation;
    index?: number;
    min?: number;
    max?: number;
  }) => void;
  pickCell: (i: number, j: number, k: number) => boolean;
  pickRimCell: () => { i: number; j: number; k: number } | null;
  ratioSeriesTail: (n?: number) => RatioSample[];
  /** Reproducible camera pose for captures; {} restores the canonical framing. */
  setCamera: (pose: CameraPose) => void;
  /** Raw-occupancy projected bounds used by Phase 4 clipping assertions. */
  framingInfo: () => ReturnType<CrystalView["framingInfo"]>;
  /** Show/hide UI chrome per capture so panels never occlude the region under review. */
  setChrome: (opts: {
    hud?: boolean;
    legends?: boolean;
    status?: boolean;
    readout?: boolean;
    pane?: boolean;
  }) => void;
  /** Debug hook: hide the crystal mesh for slice-only captures (labeled, capture-time only). */
  setCrystalVisible: (visible: boolean) => void;
  /** Merge run-config fields and re-init — the same path as editing the pane + Reset. */
  applyConfig: (partial: {
    preset?: GGPresetName;
    seed?: number;
    noiseEpsilon?: number;
    nx?: number;
    ny?: number;
    nz?: number;
    domain?: DomainShape;
    farField?: FarFieldCondition;
  }) => void;
  /** The slice index actually rendered (== the legend's printed index by construction). */
  renderedSliceIndex: () => number;
  /** Current slice-legend text (screenshot-free assertions in the harness/smoke tests). */
  sliceLegendText: () => string;
  // ── Phase 4 (V4-2): evidence-artifact inspection and scenario selection ────────────────
  /**
   * Strictly decode checkpoint bytes (base64) into VIEW-ONLY inspect mode. `context` is the
   * verified-bundle provenance (runId/operator/backend/evidenceStatus/checkpointSha256);
   * omitted = loose, honestly labeled unverified. Failures are explicit, never silent.
   */
  loadArtifactBase64: (
    b64: string,
    context?: unknown,
  ) => { ok: boolean; error: string | null };
  /** Leave inspect mode; the live worker view resumes untouched. */
  clearArtifact: () => void;
  /** Serializable summary of the inspected artifact (null when not inspecting). */
  inspectedInfo: () => Record<string, unknown> | null;
  /** Select an inspect-mode overlay; cross-operator quantities are refused by name. */
  setInspectOverlay: (name: string) => boolean;
  /** Last explicit inspection fault (decode/honesty refusal), for the harness and tests. */
  lastInspectError: string | null;
  /** Apply a registered Phase 4 live-GG scenario config (same path as pane + reset). */
  applyScenario: (id: string) => boolean;
  scenarioIds: () => string[];
  // ── Phase 5 (WP6 S2): production GPU device state — engine-neutral addition only ───────
  /**
   * Observed production GPU device state (D4): the acquisition outcome and fallback
   * reason, the frozen Phase 5 requirements the request was checked against, the observed
   * device capability, and by-value copies of the live uncaptured-error / device-loss
   * observation lists at call time. Null until boot decides. Reports device state only,
   * never engine identity (that is `engine()` below).
   */
  gpuDeviceStatus: () => GpuDeviceStatusReport | null;
  // ── Phase 5 (WP6 S3): engine-neutral engine/budget controls. Existing fields above keep
  // identical semantics; tick/attached/running/stopReason/snapshotCount reflect whichever
  // engine is ACTIVE. ─────────────────────────────────────────────────────────────────────
  /** The active solver engine ("cpu" = float64 oracle worker; "gpu" = float32 GPU port). */
  engine: () => "cpu" | "gpu";
  /** Switch engines live (same path as the pane row); false when refused, with the reason
   * shown in the status panel — never a silent downgrade. */
  setEngine: (kind: string) => boolean;
  /** The selected frozen Phase 5 GPU budget id. */
  gpuBudget: () => string;
  /** Select a frozen budget by id (re-inits when the GPU engine is active); false on an
   * unknown id or when no GPU engine exists. */
  setBudget: (id: string) => boolean;
  /** Production readback-audit summary of the GPU engine (null when it does not exist). */
  gpuAuditSummary: () => GpuAuditSummary | null;
  /** Both submission controllers' records and generations (null when no GPU engine). */
  gpuSubmissionRecords: () => GpuControllerReport | null;
  // ── Phase 5 (WP6 S4): the GPU-resident second-canvas view ──────────────────────────────
  /** Display-state summary of the S4 GPU view (null when it has no generation yet). */
  gpuViewInfo: () => Record<string, unknown> | null;
  /**
   * Compact audited sample of the GPU view's extracted surface list + overlay colors
   * (first N entries; parity checks on the registered host). Never a full-field read.
   */
  gpuViewSample: (maxEntries?: number) => Promise<Record<string, unknown> | null>;
  // ── Phase 5 (WP6 S5): differential-probe TEST seams — read-only observation ────────────
  /**
   * The latest CPU-worker snapshot exactly as posted (full fields) plus the live run's
   * wall mask. The worker already posts this state to the page; the hook only exposes what
   * the page holds — no new solver work, no readback. IN-PAGE consumption only: the typed
   * arrays are megabytes and must never be serialized across an automation boundary.
   */
  cpuSnapshotFields: () => {
    snapshot: SnapshotMessage;
    wall: Uint8Array | null;
  } | null;
  /**
   * TEST-purpose audited full-state readback of the live GPU solver (occupancy, wall,
   * boundary mass b, active vapor d, display attach ticks, topology) through the
   * production GpuReadbackAudit under purpose "test" — never a display frame, so
   * gpuAuditSummary().fullFieldDisplayFrameReadCount stays zero. Null when no usable GPU
   * solver exists. IN-PAGE consumption only (same serialization caution as above).
   */
  gpuFieldReadback: () => Promise<GpuDebugFieldReadback | null>;
}

const debugHook: VccDebug = {
  tick: 0,
  attached: 0,
  backend: null,
  ticksPerSec: null,
  running: false,
  stopReason: null,
  snapshotCount: 0,
  errors: [],
  depletion: null,
  lastPick: null,
  start: () => undefined,
  pause: () => undefined,
  step: () => undefined,
  reset: () => undefined,
  orbit: () => undefined,
  setOverlay: () => false,
  setOverlayRange: () => undefined,
  setSlice: () => undefined,
  pickCell: () => false,
  pickRimCell: () => null,
  ratioSeriesTail: () => [],
  setCamera: () => undefined,
  framingInfo: () => null,
  setChrome: () => undefined,
  setCrystalVisible: () => undefined,
  applyConfig: () => undefined,
  renderedSliceIndex: () => 0,
  sliceLegendText: () => "",
  loadArtifactBase64: () => ({ ok: false, error: "app not booted" }),
  clearArtifact: () => undefined,
  inspectedInfo: () => null,
  setInspectOverlay: () => false,
  lastInspectError: null,
  applyScenario: () => false,
  scenarioIds: () => [],
  gpuDeviceStatus: () => null,
  engine: () => "cpu",
  setEngine: () => false,
  gpuBudget: () => "dev-plate",
  setBudget: () => false,
  gpuAuditSummary: () => null,
  gpuSubmissionRecords: () => null,
  gpuViewInfo: () => null,
  gpuViewSample: () => Promise.resolve(null),
  cpuSnapshotFields: () => null,
  gpuFieldReadback: () => Promise.resolve(null),
};
(window as unknown as { __vccDebug: VccDebug }).__vccDebug = debugHook;

window.addEventListener("error", (event) => {
  debugHook.errors.push(String(event.message));
});
window.addEventListener("unhandledrejection", (event) => {
  debugHook.errors.push(String(event.reason));
});

const statusElement = document.getElementById("status") as HTMLDivElement;

function fail(message: string): void {
  debugHook.errors.push(message);
  statusElement.textContent = `FAULT: ${message}`;
  console.error(message);
}

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

async function boot(): Promise<void> {
  const container = byId<HTMLDivElement>("scene");
  const params = new URLSearchParams(window.location.search);
  // WP6 S2 boot order (frozen design D4): attempt the checked production device acquisition
  // BEFORE the renderer exists. On success the device is handed to CrystalView (D2: one
  // device, first-class three parameter) and its capability recorded; on any skip or
  // failure (?webgl2=1, ?engine=cpu, missing navigator.gpu, a thrown feature/limit request)
  // the app boots today's path unchanged and the status panel names the reason — an honest
  // fallback, never a silent downgrade (charter §1.5).
  const decision = decideGpuBoot(params, navigator.gpu !== undefined);
  const acquisition: GpuAcquisition = decision.attempt
    ? await acquireProductionGpuDevice(navigator.gpu)
    : { state: "fallback", reason: decision.skipReason, detail: null };
  debugHook.gpuDeviceStatus = () => gpuDeviceStatusReport(acquisition);
  const gpuLine = gpuStatusLine(acquisition);
  const view = await CrystalView.create(container, {
    forceWebGL: params.get("webgl2") === "1",
    ...(acquisition.state === "acquired" ? { device: acquisition.device } : {}),
  });
  debugHook.backend = view.backend;

  // The engine seam (WP6 S1/S3): main drives ONE active Engine at a time. The CPU worker
  // engine always exists (the float64 oracle/debug path is permanent, charter §3.1); the
  // GPU engine exists exactly when the checked production device was acquired. D4 default:
  // GPU at dev budget when acquisition succeeded, otherwise the honestly-labeled CPU path
  // (the ?engine=cpu and ?webgl2=1 pins already forced acquisition into fallback; a
  // ?engine=gpu request without a device falls back to CPU with the reason on screen).
  const workerEngine = new WorkerEngine();
  const gpuEngine: GpuEngine | null =
    acquisition.state === "acquired" ? new GpuEngine(acquisition.device) : null;
  let activeEngineKind: "cpu" | "gpu" = gpuEngine !== null ? "gpu" : "cpu";
  function activeEngine(): Engine<EngineSnapshot> {
    return activeEngineKind === "gpu" && gpuEngine !== null ? gpuEngine : workerEngine;
  }

  // WP6 S4 (D2): the GPU-resident crystal/overlay/slice view on a second full-size
  // pointer-events:none canvas appended AFTER Three's canvas, sharing the ONE device. It
  // exists exactly when the GPU engine does; CPU mode and inspect mode hide it and keep
  // today's Three path byte-identical.
  const gpuView: GpuView | null =
    acquisition.state === "acquired" && gpuEngine !== null
      ? GpuView.create(acquisition.device, container)
      : null;
  gpuView?.onError((message) => {
    debugHook.errors.push(`gpu view: ${message}`);
    console.error(`gpu view: ${message}`);
    uiHint = `GPU VIEW FAULT: ${message}`;
    renderStatus();
  });
  // Camera sharing (D2): every Three frame, the second canvas redraws with the SAME
  // OrbitControls camera matrices — orbiting moves both canvases in lockstep.
  view.onFrame(() => {
    gpuView?.renderFrame(view.camera);
  });

  /**
   * The status panel's device line. Fallbacks keep the exact S2 wording (gpuStatusLine);
   * the acquired case is composed HERE because the honest solver clause now depends on
   * which engine is active — S2's static "(GPU engine not landed)" stopped being true the
   * moment S3 landed the engine.
   */
  function deviceStatusLine(): string {
    if (acquisition.state !== "acquired") return gpuLine;
    const solverText =
      activeEngineKind === "gpu"
        ? "solver: float32 GPU engine (CPU oracle worker selectable)"
        : "solver: CPU worker (float32 GPU engine selectable)";
    return (
      "gpu: production device acquired (checked against frozen Phase 5 features/limits) — " +
      `shared with the renderer; ${solverText}`
    );
  }

  // ── Mutable UI state (Tweakpane binds to these objects) ──────────────────────────────────
  const ui = {
    preset: DEFAULT_INIT.preset as GGPresetName,
    seed: DEFAULT_INIT.seed,
    noiseEpsilon: DEFAULT_INIT.noiseEpsilon,
    nx: DEFAULT_INIT.dims.nx,
    ny: DEFAULT_INIT.dims.ny,
    nz: DEFAULT_INIT.dims.nz,
    domain: DEFAULT_INIT.domain as DomainShape,
    farField: DEFAULT_INIT.farField as FarFieldCondition,
  };

  /** Phase 4 scenario extras riding beside the pane fields; applied by every (re)init and
   * shown truthfully in the status panel whenever active. */
  const scenarioExtras: {
    rhoOverride: number | null;
    ggThreshBeta01Override: number | null;
    schedule: InitConfig["schedule"];
  } = { rhoOverride: null, ggThreshBeta01Override: null, schedule: null };

  const overlayState = {
    name: "none" as OverlayName,
    min: 0,
    max: 1,
    recencyWindow: 600,
  };

  const sliceState = {
    enabled: false,
    orientation: "vertical" as SliceOrientation,
    jIndex: DEFAULT_INIT.dims.ny >> 1,
    kIndex: DEFAULT_INIT.dims.nz >> 1,
    min: 0,
    max: 0.1,
  };

  /** Range defaults applied when the overlay quantity changes (still user-adjustable). */
  function overlayDefaultRange(name: OverlayName): [number, number] {
    switch (name) {
      case "vaporAvailability":
        return [0, activeRho()];
      case "growthPropensity":
        return [0, 1];
      case "boundaryMass":
        return [0, 2.5];
      case "growthRecency":
        return [0, 1];
      case "none":
        return [0, 1];
    }
  }

  let appliedPreset: GGPresetName = DEFAULT_INIT.preset;
  let appliedConfig: InitConfig = DEFAULT_INIT;
  let wall: Uint8Array | null = null;
  let activeDims: Dims = DEFAULT_INIT.dims;
  let latest: SnapshotMessage | null = null;
  /** Latest compact GPU snapshot (S3): counters/probes only, never full fields. */
  let latestGpu: GpuSnapshot | null = null;
  /** Engine/budget selector state (NEW pane rows; no existing control is touched). */
  const engineUi = { engine: activeEngineKind as string, budget: "dev-plate" };
  /** The exact surface list last handed to the renderer — instanceId indexes into it. */
  let currentSurface: Uint32Array = new Uint32Array(0);
  let uiHint: string | null = null;
  /** Signature of the overlay/slice controls last pushed to the GPU view (S4): a change
   * is a registered display edit (D3 edit controller) followed by a bounded repaint. */
  let lastGpuViewControlsKey: string | null = null;

  // ── Phase 4 inspect mode (V4-2): a loaded artifact replaces the LIVE view (view-only);
  // the worker keeps its own state untouched and resumes when the artifact is cleared. ──────
  let inspected: InspectedArtifact | null = null;
  const inspectOverlayState = { name: "none", min: 0, max: 1 };
  let currentScenario: string | null = null;
  /** Domain center of the LIVE run (from the last ready message) — restored on clear. */
  let liveCenter: readonly [number, number, number] = [
    DEFAULT_INIT.dims.nx >> 1,
    DEFAULT_INIT.dims.ny >> 1,
    DEFAULT_INIT.dims.nz >> 1,
  ];

  /** Dims of whatever the views are currently showing (live snapshot or inspected artifact). */
  function viewDims(): Dims {
    return inspected !== null ? inspected.dims : activeDims;
  }

  /** The ACTIVE G-G environment of the live run (from the snapshot, never the preset table). */
  function activeEnvironment(): GGTimelineEnvironment | null {
    if (activeEngineKind === "gpu") return latestGpu !== null ? latestGpu.environment : null;
    return latest !== null ? latest.environment : null;
  }

  /** Stop reason of the ACTIVE engine's latest snapshot (start/step guard input). */
  function activeStopReason(): StopReason {
    return activeEngineKind === "gpu" ? (latestGpu?.stopReason ?? null) : (latest?.stopReason ?? null);
  }

  function activeRho(): number {
    return activeEnvironment()?.rho ?? presetRho(appliedPreset);
  }

  function activeGGThreshBeta(): Float64Array {
    const environment = activeEnvironment();
    return environment !== null
      ? ggParamsFromTimelineEnvironment(environment).ggThreshBeta
      : GG_PRESETS[appliedPreset].ggThreshBeta;
  }

  const ratioSeries: RatioSample[] = [];
  const RATIO_SERIES_MAX = 600;
  const SPARK_Y_MAX = 1.5;

  /** UI chrome visibility (capture control): panels never permanently disappear — the
   * harness restores everything after each shot. */
  const chrome = { hud: true, legends: true, status: true, readout: true, pane: true };

  // Base (no-overlay) color 0x9fc4e8 as linear floats.
  const BASE_LINEAR: readonly [number, number, number] = [
    srgbToLinear(0x9f / 255),
    srgbToLinear(0xc4 / 255),
    srgbToLinear(0xe8 / 255),
  ];

  // ticks/s: EMA over snapshot-to-snapshot deltas, measured on the receiving side.
  let rateEma: number | null = null;
  let ratePrevTick = 0;
  let ratePrevTime: number | null = null;

  function configFromUI(): InitConfig {
    // GPU mode takes its dims from the SELECTED FROZEN BUDGET (WP6 S3), never the nx/ny/nz
    // rows — those keep governing the CPU worker exactly as before.
    const dims =
      activeEngineKind === "gpu"
        ? { ...gpuBudgetById(engineUi.budget).dims }
        : { nx: ui.nx, ny: ui.ny, nz: ui.nz };
    return validateInitConfig({
      preset: ui.preset,
      dims,
      seed: ui.seed,
      noiseEpsilon: ui.noiseEpsilon,
      domain: ui.domain,
      farField: ui.farField,
      rhoOverride: scenarioExtras.rhoOverride,
      ggThreshBeta01Override: scenarioExtras.ggThreshBeta01Override,
      schedule: scenarioExtras.schedule,
    });
  }

  function sendInit(): void {
    let config: InitConfig;
    try {
      config = configFromUI();
    } catch (err) {
      statusElement.textContent = `config rejected: ${err instanceof Error ? err.message : String(err)}`;
      return;
    }
    // A (re)init returns the views to the live run; inspect mode ends here.
    inspected = null;
    rateEma = null;
    ratePrevTime = null;
    activeEngine().init(config);
  }

  function renderStatus(): void {
    statusElement.hidden = !chrome.status;
    const lines: string[] = [];
    if (inspected !== null) {
      // V4-2: the loaded artifact's operator, policy, control, seed, tick/physical time,
      // evidence status, and recorded backend — plus the live rendering backend.
      lines.push(`rendering backend: ${view.backend} (this page; not the evidence backend)`);
      lines.push(...inspected.statusLines);
      lines.push(
        `attached ${inspected.attachedCount} · aspect ratio ${inspected.aspectRatio.toFixed(3)} ` +
          `(derived metric, unitless)`,
      );
      if (uiHint !== null) lines.push(uiHint);
      lines.push("all model quantities: Evidence = unvalidated (§1.5)");
      statusElement.textContent = lines.join("\n");
      return;
    }
    if (activeEngineKind === "gpu") {
      // WP6 S3, D6 status honesty: compact GPU counters/probes with their provenance line;
      // full-field-only metrics say so instead of showing fake values.
      const g = latestGpu;
      lines.push(
        `backend: ${view.backend} — GGThreshold float32 GPU engine (solver work on the GPU; ` +
          `JS encodes bounded submissions)`,
      );
      lines.push(deviceStatusLine());
      const budget = gpuBudgetById(engineUi.budget);
      lines.push(
        `gpu budget: ${budget.id} (${budget.dims.nx}x${budget.dims.ny}x${budget.dims.nz}, ` +
          `${budget.disposition})`,
      );
      if (g === null) {
        lines.push("waiting for first snapshot…");
      } else {
        const rate = rateEma === null ? "—" : rateEma.toFixed(1);
        const state = g.running ? "running" : g.stopReason === null ? "paused" : `stopped: ${g.stopReason}`;
        lines.push(
          `tick ${g.tick} · attached ${g.attachedCount} · boundary ${g.boundarySize} (computed state) · ${state}`,
        );
        lines.push(`${rate} ticks/s (instrument performance, not a model quantity)`);
        lines.push(
          `far-field vapor d ${g.farFieldMean.toFixed(4)} (instrument shell-mean reduction, ` +
            `computed state, model units) · domain contact: ${g.domainContact} (computed state)`,
        );
        lines.push(
          "aspect ratio: not computed in GPU mode (full-field metric) · " +
            "symmetry error: not computed in GPU mode (full-field metric)",
        );
        if (currentScenario !== null) lines.push(`phase-4 scenario: ${currentScenario}`);
        if (appliedConfig.ggThreshBeta01Override !== null) {
          lines.push(
            `override: ggThreshBeta(0,1) = ${appliedConfig.ggThreshBeta01Override} ` +
              `(abstract columnarity control, model units, unvalidated)`,
          );
        }
        if (appliedConfig.rhoOverride !== null) {
          lines.push(`override: rho = ${appliedConfig.rhoOverride} (model units, unvalidated)`);
        }
        if (appliedConfig.schedule !== null) {
          lines.push(
            "timeline: abrupt G-G schedule active — events apply at completed-cycle " +
              "boundaries (decision 0011)",
          );
        }
        const pendingEdits = gpuEngine?.pendingEnvironmentEdits() ?? 0;
        if (pendingEdits > 0) {
          lines.push(
            `queued environment edits: ${pendingEdits} (apply at the next completed-cycle boundary)`,
          );
        }
      }
      lines.push(g !== null ? g.provenance : GPU_ENGINE_PROVENANCE);
      if (uiHint !== null) lines.push(uiHint);
      lines.push("all model quantities: Evidence = unvalidated (§1.5)");
      statusElement.textContent = lines.join("\n");
      return;
    }
    const s = latest;
    lines.push(`backend: ${view.backend} — GGThreshold oracle in a Web Worker`);
    // S2 device honesty (D4): the acquisition outcome — or the named fallback reason — is
    // always visible, on success and on failure alike.
    lines.push(deviceStatusLine());
    if (s === null) {
      lines.push("waiting for first snapshot…");
    } else {
      const rate = rateEma === null ? "—" : rateEma.toFixed(1);
      const state = s.running ? "running" : s.stopReason === null ? "paused" : `stopped: ${s.stopReason}`;
      lines.push(
        `tick ${s.tick} · attached ${s.attachedCount} · boundary ${s.boundarySize} (computed state) · ${state}`,
      );
      lines.push(`${rate} ticks/s (instrument performance, not a model quantity)`);
      lines.push(
        `far-field vapor d ${s.farFieldMean.toFixed(4)} (computed state, model units) · domain contact: ${s.domainContact} (computed state)`,
      );
      lines.push(
        `aspect ratio ${s.metrics.aspectRatio.toFixed(3)} · symmetry error ${s.metrics.symmetryError} (derived metrics, unitless)`,
      );
      if (currentScenario !== null) lines.push(`phase-4 scenario: ${currentScenario}`);
      if (appliedConfig.ggThreshBeta01Override !== null) {
        lines.push(
          `override: ggThreshBeta(0,1) = ${appliedConfig.ggThreshBeta01Override} ` +
            `(abstract columnarity control, model units, unvalidated)`,
        );
      }
      if (appliedConfig.rhoOverride !== null) {
        lines.push(`override: rho = ${appliedConfig.rhoOverride} (model units, unvalidated)`);
      }
      if (s.timeline !== null) {
        lines.push(
          `timeline: ${s.timeline.appliedEvents}/${s.timeline.totalEvents} event(s) applied` +
            (s.timeline.lastEventCycle === null
              ? ""
              : ` (last at completed cycle ${s.timeline.lastEventCycle})`) +
            ` — abrupt G-G schedule, decision 0011`,
        );
      }
    }
    if (uiHint !== null) lines.push(uiHint);
    lines.push("all model quantities: Evidence = unvalidated (§1.5)");
    statusElement.textContent = lines.join("\n");
  }

  function overlayContext(s: SnapshotMessage): OverlayContext {
    return {
      dims: activeDims,
      a: s.a,
      wall: wall,
      b: s.b,
      d: s.d,
      attachTick: s.attachTick,
      tick: s.tick,
      // The ACTIVE thresholds (snapshot environment), never the preset table: Phase 4
      // overrides and applied timeline events change ggThreshBeta mid-run (V4-3 honesty).
      ggThreshBeta: activeGGThreshBeta(),
      recencyWindowTicks: overlayState.recencyWindow,
    };
  }

  /** Overlay context over the inspected GG artifact (attach recency has no artifact data). */
  function inspectGGContext(art: InspectedArtifact & { operator: "GGThreshold" }): OverlayContext {
    return {
      dims: art.dims,
      a: art.a,
      wall: art.wall,
      b: art.surface32,
      d: art.field32,
      attachTick: new Uint32Array(art.a.length),
      tick: art.tick,
      ggThreshBeta: art.params.ggThreshBeta,
      recencyWindowTicks: overlayState.recencyWindow,
    };
  }

  function inspectLKContext(
    art: InspectedArtifact & { operator: "LibbrechtKinetics" },
  ): LKOverlayContext {
    return {
      dims: art.dims,
      a: art.a,
      wall: art.wall,
      f: art.surface32,
      sigma: art.field32,
      surfacePolicy: art.surfacePolicy,
    };
  }

  // ── Legends ────────────────────────────────────────────────────────────────────────────
  function updateLegend(
    elementId: string,
    visible: boolean,
    title: string,
    min: number,
    max: number,
  ): void {
    const el = byId<HTMLDivElement>(elementId);
    el.hidden = !(visible && chrome.legends);
    if (el.hidden) return;
    (el.querySelector(".title") as HTMLDivElement).textContent = title;
    (el.querySelector(".lo") as HTMLSpanElement).textContent = min.toPrecision(3);
    (el.querySelector(".hi") as HTMLSpanElement).textContent = max.toPrecision(3);
    const canvas = el.querySelector("canvas") as HTMLCanvasElement;
    const ctx2d = canvas.getContext("2d") as CanvasRenderingContext2D;
    for (let x = 0; x < canvas.width; x++) {
      const [r, g, b] = viridis(x / (canvas.width - 1));
      ctx2d.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      ctx2d.fillRect(x, 0, 1, canvas.height);
    }
  }

  /** The slice index the renderer actually shows — legend and texture share this value. */
  function renderedSliceIndex(): number {
    const requested = sliceState.orientation === "vertical" ? sliceState.jIndex : sliceState.kIndex;
    return clampSliceIndex(sliceState.orientation, requested, viewDims());
  }

  function activeOverlayLegend(): { name: string; title: string; definition: string; min: number; max: number } {
    if (inspected === null) {
      const label = OVERLAY_LABELS[overlayState.name];
      return { name: overlayState.name, ...label, min: overlayState.min, max: overlayState.max };
    }
    const name = inspectOverlayState.name;
    const label =
      inspected.operator === "GGThreshold"
        ? OVERLAY_LABELS[name as OverlayName]
        : LK_OVERLAY_LABELS[name as LKOverlayName];
    return { name, ...label, min: inspectOverlayState.min, max: inspectOverlayState.max };
  }

  function updateLegends(): void {
    // S4 honesty: with the GPU engine live, overlays and the slice ARE computed — by
    // GPU-resident display passes over the solver's float32 buffers — and the legend says
    // exactly that instead of S3's "not computed". Inspect and CPU modes keep their exact
    // captions.
    const gpuLive = inspected === null && activeEngineKind === "gpu";
    const gpuNote = "\nGPU-resident display pass over float32 solver state (computed state, unvalidated)";
    const o = activeOverlayLegend();
    updateLegend(
      "legend-overlay",
      o.name !== "none",
      `surface overlay: ${o.title}\n${o.definition}\nundefined (NaN) renders as gray, outside the ramp` +
        (gpuLive ? gpuNote : ""),
      o.min,
      o.max,
    );
    const sl = sliceState;
    const shownIndex = renderedSliceIndex();
    const orientationText =
      sl.orientation === "vertical"
        ? `vertical, j = ${shownIndex} (Berg view)`
        : `horizontal, k = ${shownIndex}`;
    // Operator-honest slice caption (V4-4): GG shows vapor mass d in model units; an
    // inspected LK artifact shows dimensionless supersaturation sigma — never relabeled.
    const sliceCaption =
      inspected === null
        ? `slice: vapor d, ${orientationText}\n(computed state, model units, unvalidated; crystal/wall cells read d = 0)` +
          (gpuLive ? gpuNote : "")
        : `slice: ${inspected.semantics.fieldTitle}, ${orientationText}\n(${inspected.semantics.fieldUnits}; crystal/wall cells read 0)`;
    updateLegend("legend-slice", sl.enabled, sliceCaption, sl.min, sl.max);
  }

  // ── HUD (A3-4): numbers straight from the worker's @vcc/core Metrics bundle ───────────────
  const hudElement = byId<HTMLDivElement>("hud");
  const hudText = byId<HTMLDivElement>("hud-text");
  const hudCanvas = byId<HTMLCanvasElement>("hud-canvas");

  function updateHud(s: SnapshotMessage | null): void {
    hudElement.hidden = !chrome.hud;
    const fmt = (v: number): string => (Number.isFinite(v) ? v.toFixed(4) : "undefined (NaN)");
    if (inspected !== null) {
      // V4-4: the SAME @vcc/core centerRimDepletion, over the operator's own field; only the
      // unitless center/rim ratio is comparable across operators.
      const d = inspected.depletion;
      hudText.textContent =
        `depletion — ${inspected.semantics.fieldTitle} above facet center vs rim ` +
        `(@vcc/core centerRimDepletion)\n` +
        `(center/rim: computed-state samples, ${inspected.semantics.fieldUnits};\n` +
        `ratio: derived metric, unitless quotient; all unvalidated)\n` +
        `center ${fmt(d.depletionCenter)} · rim ${fmt(d.depletionRim)} · ratio ${fmt(d.depletionRatio)}` +
        (Number.isFinite(d.depletionRatio) && d.depletionRatio < 1 ? "  (< 1: center starved)" : "");
      const inkCtx = hudCanvas.getContext("2d") as CanvasRenderingContext2D;
      inkCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
      inkCtx.fillStyle = "#0c0f14";
      inkCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
      inkCtx.fillStyle = "#5a6376";
      inkCtx.font = "10px ui-monospace, monospace";
      inkCtx.fillText("single-state artifact — no time series", 8, hudCanvas.height / 2);
      return;
    }
    if (activeEngineKind === "gpu") {
      // D6 status honesty: the depletion HUD needs the full vapor field, and GPU snapshots
      // carry compact counters/probes only — the panel says so instead of faking values.
      hudText.textContent =
        "depletion — vapor d above facet center vs rim (@vcc/core centerRimDepletion)\n" +
        "not computed in GPU mode (full-field metric)";
      const gpuCtx = hudCanvas.getContext("2d") as CanvasRenderingContext2D;
      gpuCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
      gpuCtx.fillStyle = "#0c0f14";
      gpuCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
      gpuCtx.fillStyle = "#5a6376";
      gpuCtx.font = "10px ui-monospace, monospace";
      gpuCtx.fillText("not computed in GPU mode (full-field metric)", 8, hudCanvas.height / 2);
      return;
    }
    if (s === null) return;
    const m = s.metrics;
    hudText.textContent =
      "depletion — vapor d above facet center vs rim (@vcc/core centerRimDepletion)\n" +
      "(center/rim: computed-state samples, model units; ratio: derived metric,\n" +
      "unitless quotient; all unvalidated)\n" +
      `center ${fmt(m.depletionCenter)} · rim ${fmt(m.depletionRim)} · ratio ${fmt(m.depletionRatio)}` +
      (Number.isFinite(m.depletionRatio) && m.depletionRatio < 1 ? "  (< 1: center starved)" : "");

    const ctx2d = hudCanvas.getContext("2d") as CanvasRenderingContext2D;
    const w = hudCanvas.width;
    const h = hudCanvas.height;
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.fillStyle = "#0c0f14";
    ctx2d.fillRect(0, 0, w, h);
    // Reference line at ratio = 1 (center == rim).
    const refY = referenceLineY(h, SPARK_Y_MAX, 1);
    ctx2d.strokeStyle = "#5a6376";
    ctx2d.setLineDash([3, 3]);
    ctx2d.beginPath();
    ctx2d.moveTo(0, refY);
    ctx2d.lineTo(w, refY);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
    // Ratio series (y clamped to [0, 1.5] — layer-nucleation spikes read as pegged-high).
    ctx2d.strokeStyle = "#8fd4a8";
    ctx2d.beginPath();
    let penDown = false;
    for (const p of polylinePoints(ratioSeries, w, h, SPARK_Y_MAX)) {
      if (p === null) {
        penDown = false;
        continue;
      }
      if (penDown) ctx2d.lineTo(p[0], p[1]);
      else ctx2d.moveTo(p[0], p[1]);
      penDown = true;
    }
    ctx2d.stroke();
  }

  // ── WP6 S4: the GPU view's control push (display edits + bounded repaints) ───────────────
  /** The overlay/slice control state the GPU view renders — the SAME values the legends
   * print (renderedSliceIndex is the clamped legend index; ggThreshBeta is the ACTIVE
   * environment's thresholds, never the preset table). */
  function currentGpuViewControls(): GpuViewControls {
    const dims = activeDims;
    const index = renderedSliceIndex();
    return {
      overlayName: overlayState.name,
      overlayMin: overlayState.min,
      overlayMax: overlayState.max,
      recencyWindowTicks: overlayState.recencyWindow,
      sliceEnabled: sliceState.enabled,
      sliceOrientation: sliceState.orientation,
      sliceIndex: index,
      sliceMin: sliceState.min,
      sliceMax: sliceState.max,
      // The EXISTING slice.ts world-placement math, reused verbatim (S4).
      sliceModelRowMajor: sliceWorldMatrix(sliceState.orientation, index, dims, view.offset),
      ggThreshBeta: activeGGThreshBeta(),
    };
  }

  /**
   * Push state/controls into the GPU view. afterState=true reruns the full bounded
   * pipeline (extraction + overlay + slice) after a completed step/reset/env change;
   * afterState=false is the control path — an ACTUAL control change registers one display
   * edit on the D3 edit controller and repaints overlay/slice over the current surface
   * list, an unchanged control state is a no-op.
   */
  function syncGpuView(afterState: boolean): void {
    if (gpuView === null || gpuEngine === null) return;
    if (inspected !== null || activeEngineKind !== "gpu") return;
    const source = gpuEngine.viewSource();
    if (source === null) return;
    const controls = currentGpuViewControls();
    const key = JSON.stringify([
      controls.overlayName,
      controls.overlayMin,
      controls.overlayMax,
      controls.recencyWindowTicks,
      controls.sliceEnabled,
      controls.sliceOrientation,
      controls.sliceIndex,
      controls.sliceMin,
      controls.sliceMax,
    ]);
    if (afterState) {
      lastGpuViewControlsKey = key;
      gpuView.syncState(source, controls);
      return;
    }
    if (key === lastGpuViewControlsKey) return;
    lastGpuViewControlsKey = key;
    gpuEngine.registerViewEdit();
    gpuView.repaintControls(source, controls);
  }

  // ── The one refresh path: everything below reads `latest` OR the inspected artifact
  // (freeze-and-inspect; V4-2 inspect mode is a frozen state by construction) ──────────────
  function refreshView(): void {
    renderStatus();
    updateLegends();
    const dims = viewDims();
    // S4: the second canvas shows exactly when the LIVE GPU engine is displayed; CPU mode
    // and inspect mode fall back to the Three path with the GPU canvas hidden.
    gpuView?.setVisible(inspected === null && activeEngineKind === "gpu");

    if (inspected === null && activeEngineKind === "gpu") {
      // S4: the crystal/overlay/slice render GPU-resident on the second canvas; Three's
      // own crystal instances stay cleared and its slice plane hidden (they would show
      // stale CPU state). The HUD's depletion metric still needs the full field and
      // honestly says so.
      view.hideSlice();
      updateHud(null);
      syncGpuView(false);
      return;
    }

    // The volumetric field and overlay values of whatever is displayed, operator-honest.
    let sliceField: Float32Array | null = null;
    let overlayValues: Float32Array | null = null;
    if (inspected !== null) {
      sliceField = inspected.field32;
      if (inspectOverlayState.name !== "none") {
        overlayValues =
          inspected.operator === "GGThreshold"
            ? overlayValuesFor(
                inspectOverlayState.name as OverlayName,
                inspectGGContext(inspected),
                currentSurface,
              )
            : lkOverlayValuesFor(
                inspectOverlayState.name as LKOverlayName,
                inspectLKContext(inspected),
                currentSurface,
              );
      }
    } else {
      const s = latest;
      if (s === null) return;
      sliceField = s.d;
      if (overlayState.name !== "none") {
        overlayValues = overlayValuesFor(overlayState.name, overlayContext(s), currentSurface);
      }
    }

    // Instance colors: overlay values through the colormap, or the uniform base color.
    const range = inspected !== null ? inspectOverlayState : overlayState;
    const colors = new Float32Array(currentSurface.length * 3);
    if (overlayValues === null) {
      for (let n = 0; n < currentSurface.length; n++) {
        colors[n * 3] = BASE_LINEAR[0];
        colors[n * 3 + 1] = BASE_LINEAR[1];
        colors[n * 3 + 2] = BASE_LINEAR[2];
      }
    } else {
      for (let n = 0; n < overlayValues.length; n++) {
        const [r, g, b] = viridis(normalizeToUnit(overlayValues[n], range.min, range.max));
        colors[n * 3] = srgbToLinear(r);
        colors[n * 3 + 1] = srgbToLinear(g);
        colors[n * 3 + 2] = srgbToLinear(b);
      }
    }
    view.updateCrystal(currentSurface, dims, colors);

    // Slice plane. The index is the SAME clamped value the legend prints (renderedSliceIndex
    // → clampSliceIndex): legend and texture cannot diverge (R3 finding 1).
    if (sliceState.enabled) {
      const orientation = sliceState.orientation;
      const index = renderedSliceIndex();
      const { width, height } = sliceTextureSize(orientation, dims);
      const field = extractSlice(orientation, sliceField, dims, index);
      const rgba = new Uint8Array(width * height * 4);
      for (let n = 0; n < field.length; n++) {
        const [r, g, b] = viridis(normalizeToUnit(field[n], sliceState.min, sliceState.max));
        rgba[n * 4] = Math.round(r * 255);
        rgba[n * 4 + 1] = Math.round(g * 255);
        rgba[n * 4 + 2] = Math.round(b * 255);
        rgba[n * 4 + 3] = 255;
      }
      view.setSlice(rgba, width, height, sliceWorldMatrix(orientation, index, dims, view.offset));
    } else {
      view.hideSlice();
    }

    updateHud(latest);
  }

  // ── Picking (A3-3) ───────────────────────────────────────────────────────────────────────
  const readoutElement = byId<HTMLDivElement>("readout");

  function showReadout(i: number, j: number, k: number): boolean {
    // V4-3: picking reads the ACTUAL displayed field and surface state, with the displayed
    // operator's own labels — live GG snapshot, inspected GG artifact, or inspected LK
    // artifact (f/sigma, never b/d).
    let lines: string[];
    if (inspected !== null) {
      if (inspected.operator === "GGThreshold") {
        const info = buildPickInfo(
          inspectGGContext(inspected),
          i,
          j,
          k,
          inspectOverlayState.name as OverlayName,
        );
        lines = formatReadout(info);
      } else {
        const info = buildLKPickInfo(
          inspectLKContext(inspected),
          i,
          j,
          k,
          inspectOverlayState.name as LKOverlayName,
        );
        lines = formatLKReadout(info);
      }
    } else {
      const s = latest;
      if (s === null) return false;
      const info = buildPickInfo(overlayContext(s), i, j, k, overlayState.name);
      lines = formatReadout(info);
    }
    readoutElement.textContent = lines.join("\n");
    readoutElement.hidden = !chrome.readout;
    debugHook.lastPick = { i, j, k };
    return true;
  }

  function hideReadout(): void {
    readoutElement.hidden = true;
    debugHook.lastPick = null;
  }

  /**
   * WP6 S4 picking floor: in live GPU mode, pickCell reads EXACTLY the probed cells via
   * small audited named-probe readbacks (never a full field) and fills the readout when
   * they land. Free-running is refused (pause first) so the probe reads one frozen state,
   * not a torn mid-cycle mix; mouse raycast picking over the GPU surface is explicitly
   * deferred. Returns true when the probe was accepted.
   */
  function gpuPickCell(i: number, j: number, k: number): boolean {
    if (gpuView === null || gpuEngine === null) return false;
    const dims = activeDims;
    if (
      !Number.isSafeInteger(i) || i < 0 || i >= dims.nx ||
      !Number.isSafeInteger(j) || j < 0 || j >= dims.ny ||
      !Number.isSafeInteger(k) || k < 0 || k >= dims.nz
    ) {
      return false;
    }
    if (debugHook.running) {
      uiHint = "pause to pick in GPU mode (the named probe reads one frozen state)";
      renderStatus();
      return false;
    }
    const source = gpuEngine.viewSource();
    if (source === null) return false;
    debugHook.lastPick = { i, j, k };
    readoutElement.textContent =
      `cell (${i}, ${j}, ${k}) — reading GPU-resident state (audited named probe)…`;
    readoutElement.hidden = !chrome.readout;
    void gpuView
      .pickCell(source, wall, overlayState.name, overlayState.recencyWindow, i, j, k)
      .then((lines) => {
        const pick = debugHook.lastPick;
        if (pick === null || pick.i !== i || pick.j !== j || pick.k !== k) return;
        readoutElement.textContent = lines.join("\n");
        readoutElement.hidden = !chrome.readout;
      })
      .catch((err: unknown) => {
        uiHint = `GPU pick failed: ${err instanceof Error ? err.message : String(err)}`;
        renderStatus();
      });
    return true;
  }

  let lastRaycastAt = 0;
  view.renderer.domElement.addEventListener("pointermove", (event: PointerEvent) => {
    const now = performance.now();
    if (now - lastRaycastAt < 40) return; // raycasting 20k+ instances is not free
    lastRaycastAt = now;
    const instanceId = view.pickInstance(event.clientX, event.clientY);
    if (instanceId === null || instanceId >= currentSurface.length) {
      hideReadout();
      return;
    }
    const dims = viewDims();
    const x = currentSurface[instanceId];
    const plane = dims.nx * dims.ny;
    const k = Math.floor(x / plane);
    const r = x - k * plane;
    const j = Math.floor(r / dims.nx);
    const i = r - j * dims.nx;
    showReadout(i, j, k);
  });
  view.renderer.domElement.addEventListener("pointerleave", hideReadout);

  // ── Engine messages (ready/snapshot/fault — the worker protocol behind the seam). Both
  // engines are wired at boot with a source tag; messages from the INACTIVE engine are
  // dropped so a paused engine's final forced snapshot can never clobber the active view. ──
  function handleEngineMessage(source: "cpu" | "gpu", msg: EngineMessage<EngineSnapshot>): void {
    if (source !== activeEngineKind) return;
    switch (msg.kind) {
      case "ready": {
        appliedPreset = msg.config.preset;
        appliedConfig = msg.config;
        activeDims = msg.config.dims;
        liveCenter = [msg.center[0], msg.center[1], msg.center[2]];
        wall = msg.wall;
        latest = null;
        latestGpu = null;
        currentSurface = new Uint32Array(0);
        ratioSeries.length = 0;
        uiHint = null;
        debugHook.depletion = null;
        hideReadout();
        // Re-center the slice within the NEW domain and rebuild the sliders so their
        // bounds always match the active dims (R3 finding 1).
        sliceState.jIndex = msg.center[1];
        sliceState.kIndex = msg.center[2];
        rebuildSliceIndexBindings();
        pane.refresh();
        view.frameDomain(activeDims, msg.center);
        if (source === "gpu") {
          // S4: the crystal renders GPU-resident on the second canvas — Three's instances
          // stay cleared (stale CPU state must never pose as live GPU state) and the GPU
          // view allocates fresh display buffers for the new solver generation.
          view.updateCrystal(new Uint32Array(0), activeDims, new Float32Array(0));
          view.hideSlice();
          lastGpuViewControlsKey = null;
          if (gpuView !== null && gpuEngine !== null) {
            const viewSource = gpuEngine.viewSource();
            if (viewSource !== null) {
              try {
                gpuView.beginGeneration(viewSource, view.offset);
                syncGpuView(true);
              } catch (err) {
                // Fail-closed display allocation: the fault names the violated limit; the
                // solver keeps running (status shows the crystal cannot be displayed).
                uiHint = `GPU VIEW FAULT: ${err instanceof Error ? err.message : String(err)}`;
                debugHook.errors.push(`gpu view: ${String(uiHint)}`);
              }
            }
          }
        }
        renderStatus();
        updateLegends();
        break;
      }
      case "snapshot": {
        if (msg.engine === "gpu") {
          // Compact D6 snapshot: counters/probes only. The engine-neutral debug fields
          // reflect the ACTIVE engine; depletion is a full-field metric and stays null.
          latestGpu = msg;
          const nowGpu = performance.now();
          if (ratePrevTime !== null && msg.tick > ratePrevTick) {
            const instantaneous = ((msg.tick - ratePrevTick) * 1000) / (nowGpu - ratePrevTime);
            rateEma = rateEma === null ? instantaneous : 0.35 * instantaneous + 0.65 * rateEma;
          }
          ratePrevTick = msg.tick;
          ratePrevTime = nowGpu;
          if (msg.running) uiHint = null;
          debugHook.tick = msg.tick;
          debugHook.attached = msg.attachedCount;
          debugHook.ticksPerSec = rateEma;
          debugHook.running = msg.running;
          debugHook.stopReason = msg.stopReason;
          debugHook.depletion = null;
          debugHook.snapshotCount++;
          if (inspected === null) {
            refreshView();
            // S4: a posted GPU snapshot marks advanced/changed resident state (step, reset,
            // pause boundary, applied environment edit) — rerun the bounded extraction +
            // overlay + slice pipeline. Snapshot cadence bounds this at the worker's own
            // 100 ms throttle while free-running.
            syncGpuView(true);
          }
          break;
        }
        latest = msg;
        const now = performance.now();
        if (ratePrevTime !== null && msg.tick > ratePrevTick) {
          const instantaneous = ((msg.tick - ratePrevTick) * 1000) / (now - ratePrevTime);
          rateEma = rateEma === null ? instantaneous : 0.35 * instantaneous + 0.65 * rateEma;
        }
        ratePrevTick = msg.tick;
        ratePrevTime = now;
        if (msg.running) uiHint = null;

        pushSample(ratioSeries, msg.tick, msg.metrics.depletionRatio, RATIO_SERIES_MAX);

        debugHook.tick = msg.tick;
        debugHook.attached = msg.attachedCount;
        debugHook.ticksPerSec = rateEma;
        debugHook.running = msg.running;
        debugHook.stopReason = msg.stopReason;
        debugHook.depletion = {
          center: msg.metrics.depletionCenter,
          rim: msg.metrics.depletionRim,
          ratio: msg.metrics.depletionRatio,
        };
        debugHook.snapshotCount++;
        // In inspect mode the views stay pinned to the artifact; the live snapshot is
        // retained and takes over again when the artifact is cleared.
        if (inspected === null) {
          currentSurface = surfaceCellIndices(msg.a, wall, activeDims);
          refreshView();
        }
        break;
      }
      case "fault": {
        if (source === "gpu") {
          // A GPU fault (refused budget, poisoned cycle, device failure) is recorded AND
          // kept visible as a status hint, because later snapshots redraw the panel — a
          // one-shot FAULT line would vanish while the prior state keeps running.
          debugHook.errors.push(`gpu engine: ${msg.message}`);
          debugHook.running = false;
          console.error(`gpu engine: ${msg.message}`);
          uiHint = `GPU ENGINE FAULT: ${msg.message}`;
          renderStatus();
          break;
        }
        fail(`solver worker: ${msg.message}`);
        break;
      }
    }
  }
  workerEngine.onMessage((msg) => handleEngineMessage("cpu", msg));
  gpuEngine?.onMessage((msg) => handleEngineMessage("gpu", msg));

  // Transport-level failures (the engine labels them; WorkerEngine keeps the exact
  // "worker error: …" string the old inline listener produced).
  workerEngine.onError((message) => {
    fail(message);
  });
  gpuEngine?.onError((message) => {
    fail(message);
  });

  // ── Controls (Tweakpane). Labels carry §1.5 Type; values are model units, unvalidated. ───
  const pane = new Pane({ title: "GGThreshold dev instrument (model, unvalidated)" });

  const config = pane.addFolder({ title: "run config (applies via reset)", expanded: false });
  config
    .addBinding(ui, "preset", {
      label: "preset (phenomenological params, unvalidated)",
      options: { plate: "plate", dendrite: "dendrite", needle: "needle", hollowColumn: "hollowColumn" },
    })
    .on("change", () => {
      // WP6 S3 (D6, decision 0011): with the GPU engine active, a preset edit ALSO routes
      // live as a queued environment event applying at the next completed-cycle boundary —
      // the same preset→environment translation the accepted performance probe registers.
      // CPU mode is untouched: there the preset still applies only via reset.
      if (activeEngineKind !== "gpu" || gpuEngine === null) return;
      const environment = ggTimelineEnvironmentFromParams(GG_PRESETS[ui.preset]);
      const generation = gpuEngine.queueEnvironmentEdit(environment);
      uiHint =
        `environment edit ${generation} queued: preset ${ui.preset} applies at the next ` +
        `completed-cycle boundary (decision 0011); reset still applies the full config`;
      renderStatus();
    });
  config.addBinding(ui, "seed", { label: "PRNG seed (input)", min: 0, max: 0xffff_ffff, step: 1 });
  config.addBinding(ui, "noiseEpsilon", {
    label: "noise epsilon (phenomenological parameter, unvalidated)",
    min: 0,
    max: 0.001,
    step: 0.00001,
  });
  config.addBinding(ui, "nx", { label: "nx (input, lattice cells)", min: 16, max: 256, step: 1 });
  config.addBinding(ui, "ny", { label: "ny (input, lattice cells)", min: 16, max: 256, step: 1 });
  config.addBinding(ui, "nz", { label: "nz (input, lattice cells)", min: 16, max: 256, step: 1 });
  config.addBinding(ui, "domain", {
    label: "domain shape (input; hexPrism = D6h-capable)",
    options: { hexPrism: "hexPrism", box: "box" },
  });
  config.addBinding(ui, "farField", {
    label: "far field (input; reflecting = mass-conserving)",
    options: { reflecting: "reflecting", dirichlet: "dirichlet" },
  });

  const runFolder = pane.addFolder({ title: "run control" });
  const start = (): void => {
    if (inspected !== null) {
      uiHint = "inspecting an artifact (view-only) — clear it to control the live run";
      renderStatus();
      return;
    }
    const stopped = activeStopReason();
    if (stopped !== null) {
      uiHint = `run is stopped (${stopped}) — start/step are ignored; reset to grow again`;
      renderStatus();
      return;
    }
    activeEngine().run();
  };
  const pause = (): void => activeEngine().pause();
  const step = (): void => {
    if (inspected !== null) {
      uiHint = "inspecting an artifact (view-only) — clear it to control the live run";
      renderStatus();
      return;
    }
    const stopped = activeStopReason();
    if (stopped !== null) {
      uiHint = `run is stopped (${stopped}) — start/step are ignored; reset to grow again`;
      renderStatus();
      return;
    }
    activeEngine().step();
  };
  const reset = (): void => sendInit();
  runFolder.addButton({ title: "start" }).on("click", start);
  runFolder.addButton({ title: "pause" }).on("click", pause);
  runFolder.addButton({ title: "step (one tick)" }).on("click", step);
  runFolder.addButton({ title: "reset (applies config)" }).on("click", reset);

  const overlayFolder = pane.addFolder({ title: "surface overlay (computed state, unvalidated)" });
  overlayFolder
    .addBinding(overlayState, "name", {
      label: "quantity (§1.5 label in legend)",
      options: {
        "none (uniform)": "none",
        "vapor availability": "vaporAvailability",
        "growth propensity (phenomenological)": "growthPropensity",
        "boundary mass b": "boundaryMass",
        "recent growth (attach recency)": "growthRecency",
      },
    })
    .on("change", () => {
      const [lo, hi] = overlayDefaultRange(overlayState.name);
      overlayState.min = lo;
      overlayState.max = hi;
      pane.refresh();
      refreshView();
    });
  const rangeFormat = (v: number): string => v.toPrecision(3);
  // The overlay range's unit depends on the quantity (d is in model units; propensity is a
  // unitless threshold fraction; recency is unitless over a model-tick window) — the legend
  // states the active one, so the static labels defer to it rather than claim a wrong unit.
  overlayFolder
    .addBinding(overlayState, "min", { label: "range min (units per legend)", format: rangeFormat })
    .on("change", refreshView);
  overlayFolder
    .addBinding(overlayState, "max", { label: "range max (units per legend)", format: rangeFormat })
    .on("change", refreshView);
  overlayFolder
    .addBinding(overlayState, "recencyWindow", {
      label: "recency window W (model ticks)",
      min: 10,
      max: 5000,
      step: 10,
    })
    .on("change", refreshView);

  const sliceFolder = pane.addFolder({ title: "slice plane — vapor d (model units, unvalidated)" });
  sliceFolder.addBinding(sliceState, "enabled", { label: "show slice" }).on("change", refreshView);
  sliceFolder
    .addBinding(sliceState, "orientation", {
      label: "orientation",
      options: {
        "vertical (constant j — Berg view)": "vertical",
        "horizontal (constant k)": "horizontal",
      },
    })
    .on("change", () => {
      syncSliceBindingVisibility();
      refreshView();
    });
  // The index sliders' bounds depend on the ACTIVE dims, so they are rebuilt on every
  // init/reset (R3 finding 1: bounds pinned to the defaults let a stale slider request
  // indices the render clamps away).
  interface SliceIndexBinding {
    hidden: boolean;
    dispose: () => void;
  }
  let jBinding: SliceIndexBinding | null = null;
  let kBinding: SliceIndexBinding | null = null;
  function syncSliceBindingVisibility(): void {
    if (jBinding !== null) jBinding.hidden = sliceState.orientation !== "vertical";
    if (kBinding !== null) kBinding.hidden = sliceState.orientation !== "horizontal";
  }
  function rebuildSliceIndexBindings(): void {
    jBinding?.dispose();
    kBinding?.dispose();
    const dims = viewDims();
    const jApi = sliceFolder.addBinding(sliceState, "jIndex", {
      label: "j index (drag along normal)",
      min: 0,
      max: dims.ny - 1,
      step: 1,
      index: 2,
    });
    jApi.on("change", refreshView);
    const kApi = sliceFolder.addBinding(sliceState, "kIndex", {
      label: "k index (drag along normal)",
      min: 0,
      max: dims.nz - 1,
      step: 1,
      index: 3,
    });
    kApi.on("change", refreshView);
    jBinding = jApi;
    kBinding = kApi;
    syncSliceBindingVisibility();
  }
  rebuildSliceIndexBindings();
  sliceFolder
    .addBinding(sliceState, "min", { label: "range min (model units)", format: rangeFormat })
    .on("change", refreshView);
  sliceFolder
    .addBinding(sliceState, "max", { label: "range max (model units)", format: rangeFormat })
    .on("change", refreshView);

  // ── Phase 4 (V4-2): scenario selection + view-only artifact inspection ───────────────────
  function clearScenarioExtras(): void {
    scenarioExtras.rhoOverride = null;
    scenarioExtras.ggThreshBeta01Override = null;
    scenarioExtras.schedule = null;
    currentScenario = null;
  }

  function applyScenarioById(id: string): boolean {
    const scenario = phase4ScenarioById(id);
    if (scenario === null) return false;
    const c = scenario.config;
    ui.preset = c.preset;
    ui.seed = c.seed;
    ui.noiseEpsilon = c.noiseEpsilon;
    ui.nx = c.dims.nx;
    ui.ny = c.dims.ny;
    ui.nz = c.dims.nz;
    ui.domain = c.domain;
    ui.farField = c.farField;
    scenarioExtras.rhoOverride = c.rhoOverride;
    scenarioExtras.ggThreshBeta01Override = c.ggThreshBeta01Override;
    scenarioExtras.schedule = c.schedule;
    currentScenario = scenario.id;
    pane.refresh();
    sendInit();
    return true;
  }

  function inspectOverlayDefaultRange(name: string): [number, number] {
    if (inspected === null) return [0, 1];
    if (name === "vaporAvailability" && inspected.operator === "GGThreshold") {
      return [0, inspected.params.rho];
    }
    if (name === "boundaryMass") return [0, 2.5];
    if (name === "lkSigmaAvailability" && inspected.operator === "LibbrechtKinetics") {
      return [0, inspected.sigmaInfinity];
    }
    return [0, 1];
  }

  /** Select an inspect-mode overlay; refuses cross-operator quantities by name (V4-3). */
  function setInspectOverlayByName(name: string): boolean {
    if (inspected === null) {
      debugHook.lastInspectError = "no artifact loaded — inspect overlays need one";
      return false;
    }
    try {
      assertOverlayHonest(inspected.operator, name);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      debugHook.lastInspectError = message;
      uiHint = `OVERLAY REFUSED: ${message}`;
      renderStatus();
      return false;
    }
    inspectOverlayState.name = name;
    const [lo, hi] = inspectOverlayDefaultRange(name);
    inspectOverlayState.min = lo;
    inspectOverlayState.max = hi;
    uiHint = null;
    refreshView();
    return true;
  }

  function enterInspectMode(artifact: InspectedArtifact): void {
    inspected = artifact;
    activeEngine().pause();
    inspectOverlayState.name = "none";
    inspectOverlayState.min = 0;
    inspectOverlayState.max = 1;
    uiHint = null;
    sliceState.jIndex = artifact.center[1];
    sliceState.kIndex = artifact.center[2];
    rebuildSliceIndexBindings();
    currentSurface = surfaceCellIndices(artifact.a, artifact.wall, artifact.dims);
    hideReadout();
    view.frameOccupancy(artifact.a, artifact.dims, artifact.center);
    pane.refresh();
    refreshView();
  }

  function parseEvidenceContext(raw: unknown): ArtifactEvidenceContext | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "object") throw new Error("evidence context must be an object");
    const c = raw as Record<string, unknown>;
    const stringKeys = [
      "runId",
      "pass",
      "operator",
      "backend",
      "evidenceClass",
      "protocol",
      "reportPath",
      "manifestSha256",
      "checkpointSha256",
    ] as const;
    for (const key of stringKeys) {
      if (typeof c[key] !== "string" || (c[key] as string).length === 0) {
        throw new Error(`evidence context ${key} must be a nonempty string`);
      }
    }
    const allowed = new Set<string>([...stringKeys, "viewVerdict", "syntheticNotice"]);
    for (const key of Object.keys(c)) {
      if (!allowed.has(key)) throw new Error(`evidence context contains unknown key ${key}`);
    }
    if (c.operator !== "GGThreshold" && c.operator !== "LibbrechtKinetics") {
      throw new Error(`evidence context operator is unknown: ${String(c.operator)}`);
    }
    if (c.pass !== "A" && c.pass !== "B") throw new Error("evidence context pass is invalid");
    if (c.backend !== "float64-cpu-oracle") {
      throw new Error("evidence context backend must be float64-cpu-oracle");
    }
    if (typeof c.viewVerdict !== "object" || c.viewVerdict === null) {
      throw new Error("evidence context viewVerdict must be an object");
    }
    const verdict = c.viewVerdict as Record<string, unknown>;
    if (
      typeof verdict.criterion !== "string" ||
      typeof verdict.passed !== "boolean" ||
      typeof verdict.summary !== "string"
    ) {
      throw new Error("evidence context viewVerdict fields are invalid");
    }
    return {
      runId: c.runId as string,
      pass: c.pass,
      operator: c.operator,
      backend: c.backend,
      evidenceClass: c.evidenceClass as ArtifactEvidenceContext["evidenceClass"],
      protocol: c.protocol as ArtifactEvidenceContext["protocol"],
      reportPath: c.reportPath as ArtifactEvidenceContext["reportPath"],
      manifestSha256: c.manifestSha256 as string,
      syntheticNotice: c.syntheticNotice as ArtifactEvidenceContext["syntheticNotice"],
      viewVerdict: {
        criterion: verdict.criterion,
        passed: verdict.passed,
        summary: verdict.summary,
      },
      checkpointSha256: c.checkpointSha256 as string,
    };
  }

  /** Strict decode → inspect mode. Failures are explicit, surfaced, and recorded — never a
   * silent fallback to the live view (V4-2). */
  function loadArtifactBytes(
    bytes: Uint8Array,
    rawContext: unknown,
  ): { ok: boolean; error: string | null } {
    try {
      const context = parseEvidenceContext(rawContext);
      const artifact = inspectCheckpointBytes(bytes, context);
      debugHook.lastInspectError = null;
      enterInspectMode(artifact);
      return { ok: true, error: null };
    } catch (err) {
      const message = `artifact inspection fault: ${err instanceof Error ? err.message : String(err)}`;
      debugHook.lastInspectError = message;
      uiHint = `ARTIFACT FAULT (explicit; nothing was loaded): ${message}`;
      renderStatus();
      return { ok: false, error: message };
    }
  }

  function clearArtifactView(): void {
    if (inspected === null) return;
    inspected = null;
    inspectOverlayState.name = "none";
    uiHint = null;
    sliceState.jIndex = liveCenter[1];
    sliceState.kIndex = liveCenter[2];
    rebuildSliceIndexBindings();
    currentSurface =
      latest === null ? new Uint32Array(0) : surfaceCellIndices(latest.a, wall, activeDims);
    hideReadout();
    view.frameDomain(activeDims, liveCenter);
    pane.refresh();
    refreshView();
  }

  const phase4Folder = pane.addFolder({
    title: "phase 4 — scenarios + evidence inspection",
    expanded: false,
  });
  const phase4Ui = { scenario: PHASE4_SCENARIOS[0].id, overlay: "none" };
  phase4Folder.addBinding(phase4Ui, "scenario", {
    label: "scenario (live GG at dev pace — exploration, not evidence)",
    options: Object.fromEntries(PHASE4_SCENARIOS.map((s) => [s.label, s.id])),
  });
  phase4Folder
    .addButton({ title: "load scenario (applies via reset)" })
    .on("click", () => applyScenarioById(phase4Ui.scenario));
  phase4Folder.addButton({ title: "clear scenario overrides" }).on("click", () => {
    clearScenarioExtras();
    pane.refresh();
    renderStatus();
  });
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (file === undefined) return;
    file
      .arrayBuffer()
      .then((buffer) => loadArtifactBytes(new Uint8Array(buffer), null))
      .catch((err: unknown) => {
        fail(`artifact read failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  });
  phase4Folder
    .addButton({ title: "inspect artifact file (view-only)…" })
    .on("click", () => fileInput.click());
  phase4Folder
    .addButton({ title: "clear inspected artifact" })
    .on("click", () => clearArtifactView());
  phase4Folder
    .addBinding(phase4Ui, "overlay", {
      label: "inspect overlay (per-operator honesty enforced)",
      options: {
        "none (uniform)": "none",
        "GG: vapor availability": "vaporAvailability",
        "GG: growth propensity": "growthPropensity",
        "GG: boundary mass b": "boundaryMass",
        "LK: sigma availability": "lkSigmaAvailability",
        "LK: boundary fill f": "lkBoundaryFill",
        "LK: growth propensity": "lkGrowthPropensity",
      },
    })
    .on("change", () => {
      if (!setInspectOverlayByName(phase4Ui.overlay)) {
        phase4Ui.overlay = inspectOverlayState.name;
        pane.refresh();
      }
    });

  // ── Phase 5 (WP6 S3): engine + budget selection — NEW pane rows only; every
  // pre-existing control keeps its exact label/folder/DOM position (frozen probes match
  // by text), and the CPU worker remains permanently selectable (charter §3.1). ────────────
  function setEngineKind(kind: "cpu" | "gpu"): boolean {
    if (kind === activeEngineKind) return true;
    if (kind === "gpu" && gpuEngine === null) {
      uiHint =
        "gpu engine unavailable — the gpu: status line names the reason; CPU worker stays active";
      engineUi.engine = activeEngineKind;
      pane.refresh();
      renderStatus();
      return false;
    }
    // The outgoing engine is paused, never destroyed: the CPU worker keeps its state as
    // the oracle/debug path, and the GPU engine re-inits fresh on the next activation.
    activeEngine().pause();
    activeEngineKind = kind;
    engineUi.engine = kind;
    latest = null;
    latestGpu = null;
    currentSurface = new Uint32Array(0);
    rateEma = null;
    ratePrevTime = null;
    uiHint = null;
    // S4: the second canvas belongs to the LIVE GPU engine only — hide it immediately on a
    // switch to CPU rather than waiting for the first CPU snapshot's refresh.
    lastGpuViewControlsKey = null;
    gpuView?.setVisible(kind === "gpu");
    pane.refresh();
    sendInit();
    return true;
  }

  // Reentrancy guard: setBudgetById updates engineUi.budget and refreshes the pane, and the
  // pane's own change handler calls back into setBudgetById with the same id. Without the
  // guard one selection re-inits twice, and a refused budget posts its fault twice.
  let settingBudget = false;

  function setBudgetById(id: string): boolean {
    if (settingBudget) return true;
    if (gpuEngine === null) {
      uiHint =
        "gpu budget selection needs the GPU engine (device unavailable — see the gpu: status line)";
      renderStatus();
      return false;
    }
    settingBudget = true;
    try {
      try {
        gpuEngine.setBudget(id);
      } catch (err) {
        uiHint = err instanceof Error ? err.message : String(err);
        engineUi.budget = gpuEngine.budget();
        pane.refresh();
        renderStatus();
        return false;
      }
      engineUi.budget = id;
      pane.refresh();
      // A budget takes effect through (re)construction: re-init now when the GPU engine is
      // active. A refused allocation faults BY NAME and leaves the prior state live.
      if (activeEngineKind === "gpu") sendInit();
      else renderStatus();
      return true;
    } finally {
      settingBudget = false;
    }
  }

  const engineFolder = pane.addFolder({
    title: "phase 5 — engine (float32 GPU port, unvalidated)",
  });
  engineFolder
    .addBinding(engineUi, "engine", {
      label: "solver engine (float64 CPU / float32 GPU)",
      options: {
        "cpu worker (float64 oracle)": "cpu",
        "gpu (float32, unvalidated)": "gpu",
      },
    })
    .on("change", () => {
      setEngineKind(engineUi.engine === "gpu" ? "gpu" : "cpu");
    });
  engineFolder
    .addBinding(engineUi, "budget", {
      label: "gpu budget (frozen Phase 5 dims)",
      options: Object.fromEntries(
        gpuBudgetIds().map((id) => {
          const b = gpuBudgetById(id);
          return [`${id} (${b.dims.nx}x${b.dims.ny}x${b.dims.nz})`, id];
        }),
      ),
    })
    .on("change", () => {
      setBudgetById(engineUi.budget);
    });

  // ── Debug hooks (screenshot harness; same code paths as the UI) ──────────────────────────
  debugHook.start = start;
  debugHook.pause = pause;
  debugHook.step = step;
  debugHook.reset = reset;
  debugHook.orbit = (deg: number) => view.orbitBy(deg);
  debugHook.setOverlay = (name: string): boolean => {
    // In inspect mode overlay selection routes through the honesty gate (V4-3); the live
    // path stays GG-only exactly as in Phase 3.
    if (inspected !== null) return setInspectOverlayByName(name);
    if (!(OVERLAY_NAMES as readonly string[]).includes(name)) return false;
    overlayState.name = name as OverlayName;
    const [lo, hi] = overlayDefaultRange(overlayState.name);
    overlayState.min = lo;
    overlayState.max = hi;
    pane.refresh();
    refreshView();
    return true;
  };
  debugHook.setOverlayRange = (min: number, max: number): void => {
    const target = inspected !== null ? inspectOverlayState : overlayState;
    target.min = min;
    target.max = max;
    pane.refresh();
    refreshView();
  };
  debugHook.setSlice = (opts): void => {
    if (opts.enabled !== undefined) sliceState.enabled = opts.enabled;
    if (opts.orientation !== undefined) sliceState.orientation = opts.orientation;
    if (opts.index !== undefined) {
      if (sliceState.orientation === "vertical") sliceState.jIndex = opts.index;
      else sliceState.kIndex = opts.index;
    }
    if (opts.min !== undefined) sliceState.min = opts.min;
    if (opts.max !== undefined) sliceState.max = opts.max;
    syncSliceBindingVisibility();
    pane.refresh();
    refreshView();
  };
  debugHook.pickCell = (i: number, j: number, k: number): boolean =>
    inspected === null && activeEngineKind === "gpu"
      ? gpuPickCell(i, j, k)
      : showReadout(i, j, k);
  debugHook.pickRimCell = (): { i: number; j: number; k: number } | null => {
    // Reads whatever is DISPLAYED: the inspected artifact's occupancy, else the live one.
    const a = inspected !== null ? inspected.a : latest?.a;
    if (a === undefined) return null;
    const dims = viewDims();
    const bbox = latticeBBox(a, dims);
    if (bbox === null) return null;
    // Deterministic rim cell: in the crystal's top layer, the attached cell with max i
    // (then max j as a tiebreak) — on the facet edge by construction.
    const plane = dims.nx * dims.ny;
    const base = bbox.kMax * plane;
    let best: { i: number; j: number; k: number } | null = null;
    for (let p = 0; p < plane; p++) {
      if (a[base + p] !== 1) continue;
      const i = p % dims.nx;
      const j = (p - i) / dims.nx;
      if (best === null || i > best.i || (i === best.i && j > best.j)) {
        best = { i, j, k: bbox.kMax };
      }
    }
    if (best === null) return null;
    return showReadout(best.i, best.j, best.k) ? best : null;
  };
  debugHook.ratioSeriesTail = (n = 12): RatioSample[] => ratioSeries.slice(-n);
  debugHook.setCamera = (pose: CameraPose): void => view.setCameraPose(pose);
  debugHook.framingInfo = () => view.framingInfo();
  debugHook.setChrome = (opts): void => {
    if (opts.hud !== undefined) chrome.hud = opts.hud;
    if (opts.legends !== undefined) chrome.legends = opts.legends;
    if (opts.status !== undefined) chrome.status = opts.status;
    if (opts.readout !== undefined) chrome.readout = opts.readout;
    if (opts.pane !== undefined) chrome.pane = opts.pane;
    pane.element.style.display = chrome.pane ? "" : "none";
    if (!chrome.readout) hideReadout();
    refreshView();
  };
  debugHook.setCrystalVisible = (visible: boolean): void => {
    view.setCrystalVisible(visible);
    gpuView?.setCrystalVisible(visible);
  };
  debugHook.applyConfig = (partial): void => {
    Object.assign(ui, partial);
    pane.refresh();
    sendInit();
  };
  debugHook.renderedSliceIndex = renderedSliceIndex;
  debugHook.sliceLegendText = (): string =>
    (byId<HTMLDivElement>("legend-slice").querySelector(".title") as HTMLDivElement).textContent ?? "";
  // ── Phase 4 hooks (V4-2): artifact inspection + scenario selection ─────────────────────
  debugHook.loadArtifactBase64 = (b64: string, context?: unknown) => {
    let bytes: Uint8Array;
    try {
      const binary = atob(b64);
      bytes = new Uint8Array(binary.length);
      for (let n = 0; n < binary.length; n++) bytes[n] = binary.charCodeAt(n);
    } catch {
      const message = "artifact inspection fault: payload is not valid base64";
      debugHook.lastInspectError = message;
      return { ok: false, error: message };
    }
    return loadArtifactBytes(bytes, context);
  };
  debugHook.clearArtifact = clearArtifactView;
  debugHook.setInspectOverlay = setInspectOverlayByName;
  debugHook.inspectedInfo = (): Record<string, unknown> | null => {
    const art = inspected;
    if (art === null) return null;
    return {
      operator: art.operator,
      fieldName: art.semantics.fieldName,
      fieldTitle: art.semantics.fieldTitle,
      surfaceName: art.semantics.surfaceName,
      surfaceTitle: art.semantics.surfaceTitle,
      surfacePolicy: art.operator === "LibbrechtKinetics" ? art.surfacePolicy : null,
      tempC: art.operator === "LibbrechtKinetics" ? art.tempC : null,
      sigmaInfinity: art.operator === "LibbrechtKinetics" ? art.sigmaInfinity : null,
      simTimeSeconds: art.operator === "LibbrechtKinetics" ? art.simTimeSeconds : null,
      ggControl:
        art.operator === "GGThreshold"
          ? {
              rho: art.params.rho,
              phi: art.params.phi,
              ggThreshBeta01: art.params.ggThreshBeta[paramSlot(0, 1)],
            }
          : null,
      runId: art.evidence.runId,
      evidenceStatus: art.evidence.status,
      evidenceClass: art.evidence.evidenceClass,
      evidencePass: art.evidence.pass,
      manifestSha256: art.evidence.manifestSha256,
      viewVerdict: art.evidence.viewVerdict,
      recordedBackend: art.evidence.backend,
      sha256: art.evidence.sha256,
      seed: art.rngSeed,
      noiseEpsilon: art.noiseEpsilon,
      tick: art.tick,
      dims: { nx: art.dims.nx, ny: art.dims.ny, nz: art.dims.nz },
      bbox: art.bbox,
      extents: art.extents,
      domain: art.domain,
      farField: art.farField,
      attachedCount: art.attachedCount,
      aspectRatio: art.aspectRatio,
      crossSectionHollowness: art.morphology.crossSectionHollowness,
      sealedVoidFraction: art.morphology.sealedVoidFraction,
      capProfile: art.morphology.cappedColumnProfile,
      branchCount: art.morphology.branchCount,
      depletion: {
        center: art.depletion.depletionCenter,
        rim: art.depletion.depletionRim,
        ratio: art.depletion.depletionRatio,
      },
      overlay: inspectOverlayState.name,
      statusLines: [...art.statusLines],
    };
  };
  debugHook.applyScenario = applyScenarioById;
  debugHook.scenarioIds = (): string[] => PHASE4_SCENARIOS.map((s) => s.id);
  // ── Phase 5 hooks (WP6 S3): engine-neutral engine/budget controls + GPU observability ──
  debugHook.engine = (): "cpu" | "gpu" => activeEngineKind;
  debugHook.setEngine = (kind: string): boolean =>
    kind === "cpu" || kind === "gpu" ? setEngineKind(kind) : false;
  debugHook.gpuBudget = (): string => engineUi.budget;
  debugHook.setBudget = setBudgetById;
  debugHook.gpuAuditSummary = (): GpuAuditSummary | null => gpuEngine?.auditSummary() ?? null;
  debugHook.gpuSubmissionRecords = (): GpuControllerReport | null =>
    gpuEngine?.controllerReport() ?? null;
  // ── Phase 5 hooks (WP6 S4): GPU view state + compact parity sampling ───────────────────
  debugHook.gpuViewInfo = (): Record<string, unknown> | null => gpuView?.info() ?? null;
  debugHook.gpuViewSample = async (maxEntries = 256): Promise<Record<string, unknown> | null> => {
    if (gpuView === null || gpuEngine === null) return null;
    const source = gpuEngine.viewSource();
    if (source === null) return null;
    const sample = await gpuView.sampleInstances(source, maxEntries);
    return { tick: source.tick, ...sample };
  };
  // ── Phase 5 hooks (WP6 S5): differential-probe TEST seams (read-only observation) ─────
  debugHook.cpuSnapshotFields = () => (latest === null ? null : { snapshot: latest, wall });
  debugHook.gpuFieldReadback = () =>
    gpuEngine !== null ? gpuEngine.debugFieldReadback() : Promise.resolve(null);

  renderStatus();
  sendInit();
}

boot().catch((err: unknown) => {
  fail(`boot failed: ${err instanceof Error ? err.message : String(err)}`);
});
