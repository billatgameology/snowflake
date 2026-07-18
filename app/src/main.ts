// Main thread: rendering, controls, overlays, slice, picking, HUD, and status. The solver
// runs in the worker — nothing here ever constructs or steps a GGSolver (charter §3.1).
// Every view refresh reads the LATEST snapshot object, so pausing the solver freezes a fully
// inspectable state: slice, overlays, picking, and HUD keep working on it (freeze-and-inspect).

import { Pane } from "tweakpane";
import {
  ggParamsFromTimelineEnvironment,
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
  type InitConfig,
  type SnapshotMessage,
  type StopReason,
  type WorkerToMain,
} from "./protocol.ts";
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
  const view = await CrystalView.create(container, { forceWebGL: params.get("webgl2") === "1" });
  debugHook.backend = view.backend;

  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

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
  /** The exact surface list last handed to the renderer — instanceId indexes into it. */
  let currentSurface: Uint32Array = new Uint32Array(0);
  let uiHint: string | null = null;

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
    return latest !== null ? latest.environment : null;
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
    return validateInitConfig({
      preset: ui.preset,
      dims: { nx: ui.nx, ny: ui.ny, nz: ui.nz },
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
    // A (re)init returns the views to the live worker run; inspect mode ends here.
    inspected = null;
    rateEma = null;
    ratePrevTime = null;
    worker.postMessage({ kind: "init", config });
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
    const s = latest;
    lines.push(`backend: ${view.backend} — GGThreshold oracle in a Web Worker`);
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
    const o = activeOverlayLegend();
    updateLegend(
      "legend-overlay",
      o.name !== "none",
      `surface overlay: ${o.title}\n${o.definition}\nundefined (NaN) renders as gray, outside the ramp`,
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
        ? `slice: vapor d, ${orientationText}\n(computed state, model units, unvalidated; crystal/wall cells read d = 0)`
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

  // ── The one refresh path: everything below reads `latest` OR the inspected artifact
  // (freeze-and-inspect; V4-2 inspect mode is a frozen state by construction) ──────────────
  function refreshView(): void {
    renderStatus();
    updateLegends();
    const dims = viewDims();

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

  // ── Worker messages ──────────────────────────────────────────────────────────────────────
  worker.addEventListener("message", (event: MessageEvent) => {
    const msg = event.data as WorkerToMain;
    switch (msg.kind) {
      case "ready": {
        appliedPreset = msg.config.preset;
        appliedConfig = msg.config;
        activeDims = msg.config.dims;
        liveCenter = [msg.center[0], msg.center[1], msg.center[2]];
        wall = msg.wall;
        latest = null;
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
        renderStatus();
        updateLegends();
        break;
      }
      case "snapshot": {
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
        fail(`solver worker: ${msg.message}`);
        break;
      }
    }
  });

  worker.addEventListener("error", (event: ErrorEvent) => {
    fail(`worker error: ${event.message}`);
  });

  // ── Controls (Tweakpane). Labels carry §1.5 Type; values are model units, unvalidated. ───
  const pane = new Pane({ title: "GGThreshold dev instrument (model, unvalidated)" });

  const config = pane.addFolder({ title: "run config (applies via reset)", expanded: false });
  config.addBinding(ui, "preset", {
    label: "preset (phenomenological params, unvalidated)",
    options: { plate: "plate", dendrite: "dendrite", needle: "needle", hollowColumn: "hollowColumn" },
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
    if (latest !== null && latest.stopReason !== null) {
      uiHint = `run is stopped (${latest.stopReason}) — start/step are ignored; reset to grow again`;
      renderStatus();
      return;
    }
    worker.postMessage({ kind: "run" });
  };
  const pause = (): void => worker.postMessage({ kind: "pause" });
  const step = (): void => {
    if (inspected !== null) {
      uiHint = "inspecting an artifact (view-only) — clear it to control the live run";
      renderStatus();
      return;
    }
    if (latest !== null && latest.stopReason !== null) {
      uiHint = `run is stopped (${latest.stopReason}) — start/step are ignored; reset to grow again`;
      renderStatus();
      return;
    }
    worker.postMessage({ kind: "step" });
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
    worker.postMessage({ kind: "pause" });
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
  debugHook.pickCell = (i: number, j: number, k: number): boolean => showReadout(i, j, k);
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
  debugHook.setCrystalVisible = (visible: boolean): void => view.setCrystalVisible(visible);
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

  renderStatus();
  sendInit();
}

boot().catch((err: unknown) => {
  fail(`boot failed: ${err instanceof Error ? err.message : String(err)}`);
});
