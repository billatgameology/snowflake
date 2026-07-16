// Main thread: rendering, controls, overlays, slice, picking, HUD, and status. The solver
// runs in the worker — nothing here ever constructs or steps a GGSolver (charter §3.1).
// Every view refresh reads the LATEST snapshot object, so pausing the solver freezes a fully
// inspectable state: slice, overlays, picking, and HUD keep working on it (freeze-and-inspect).

import { Pane } from "tweakpane";
import {
  latticeBBox,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGPresetName,
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
  clampSliceIndex,
  extractSlice,
  sliceTextureSize,
  sliceWorldMatrix,
  type SliceOrientation,
} from "./slice.ts";
import { polylinePoints, pushSample, referenceLineY, type RatioSample } from "./hud.ts";
import { buildPickInfo, formatReadout } from "./readout.ts";

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
  setChrome: () => undefined,
  setCrystalVisible: () => undefined,
  applyConfig: () => undefined,
  renderedSliceIndex: () => 0,
  sliceLegendText: () => "",
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
        return [0, presetRho(appliedPreset)];
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
  let wall: Uint8Array | null = null;
  let activeDims: Dims = DEFAULT_INIT.dims;
  let latest: SnapshotMessage | null = null;
  /** The exact surface list last handed to the renderer — instanceId indexes into it. */
  let currentSurface: Uint32Array = new Uint32Array(0);
  let uiHint: string | null = null;

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
    rateEma = null;
    ratePrevTime = null;
    worker.postMessage({ kind: "init", config });
  }

  function renderStatus(): void {
    statusElement.hidden = !chrome.status;
    const s = latest;
    const lines: string[] = [];
    lines.push(`backend: ${view.backend} — GGThreshold oracle in a Web Worker`);
    if (s === null) {
      lines.push("waiting for first snapshot…");
    } else {
      const rate = rateEma === null ? "—" : rateEma.toFixed(1);
      const state = s.running ? "running" : s.stopReason === null ? "paused" : `stopped: ${s.stopReason}`;
      lines.push(`tick ${s.tick} · attached ${s.attachedCount} · boundary ${s.boundarySize} · ${rate} ticks/s · ${state}`);
      lines.push(`far-field vapor d ${s.farFieldMean.toFixed(4)} (model units) · domain contact: ${s.domainContact}`);
      lines.push(`aspect ratio ${s.metrics.aspectRatio.toFixed(3)} · symmetry error ${s.metrics.symmetryError} (derived metrics)`);
    }
    if (uiHint !== null) lines.push(uiHint);
    lines.push("all readouts: computed state, model units, unvalidated (§1.5)");
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
      ggThreshBeta: GG_PRESETS[appliedPreset].ggThreshBeta,
      recencyWindowTicks: overlayState.recencyWindow,
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
    return clampSliceIndex(sliceState.orientation, requested, activeDims);
  }

  function updateLegends(): void {
    const o = overlayState;
    const label = OVERLAY_LABELS[o.name];
    updateLegend(
      "legend-overlay",
      o.name !== "none",
      `surface overlay: ${label.title}\n${label.definition}\nundefined (NaN) renders as gray, outside the ramp`,
      o.min,
      o.max,
    );
    const sl = sliceState;
    const shownIndex = renderedSliceIndex();
    const orientationText =
      sl.orientation === "vertical"
        ? `vertical, j = ${shownIndex} (Berg view)`
        : `horizontal, k = ${shownIndex}`;
    updateLegend(
      "legend-slice",
      sl.enabled,
      `slice: vapor d, ${orientationText}\n(computed state, model units, unvalidated; crystal/wall cells read d = 0)`,
      sl.min,
      sl.max,
    );
  }

  // ── HUD (A3-4): numbers straight from the worker's @vcc/core Metrics bundle ───────────────
  const hudElement = byId<HTMLDivElement>("hud");
  const hudText = byId<HTMLDivElement>("hud-text");
  const hudCanvas = byId<HTMLCanvasElement>("hud-canvas");

  function updateHud(s: SnapshotMessage): void {
    hudElement.hidden = !chrome.hud;
    const m = s.metrics;
    const fmt = (v: number): string => (Number.isFinite(v) ? v.toFixed(4) : "undefined (NaN)");
    hudText.textContent =
      "depletion — vapor d above facet center vs rim\n" +
      "(@vcc/core centerRimDepletion; computed state, model units, unvalidated)\n" +
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

  // ── The one refresh path: everything below reads `latest` (freeze-and-inspect) ──────────
  function refreshView(): void {
    renderStatus();
    updateLegends();
    const s = latest;
    if (s === null) return;

    // Instance colors: overlay values through the colormap, or the uniform base color.
    const colors = new Float32Array(currentSurface.length * 3);
    if (overlayState.name === "none") {
      for (let n = 0; n < currentSurface.length; n++) {
        colors[n * 3] = BASE_LINEAR[0];
        colors[n * 3 + 1] = BASE_LINEAR[1];
        colors[n * 3 + 2] = BASE_LINEAR[2];
      }
    } else {
      const values = overlayValuesFor(overlayState.name, overlayContext(s), currentSurface);
      for (let n = 0; n < values.length; n++) {
        const [r, g, b] = viridis(normalizeToUnit(values[n], overlayState.min, overlayState.max));
        colors[n * 3] = srgbToLinear(r);
        colors[n * 3 + 1] = srgbToLinear(g);
        colors[n * 3 + 2] = srgbToLinear(b);
      }
    }
    view.updateCrystal(currentSurface, activeDims, colors);

    // Slice plane. The index is the SAME clamped value the legend prints (renderedSliceIndex
    // → clampSliceIndex): legend and texture cannot diverge (R3 finding 1).
    if (sliceState.enabled) {
      const orientation = sliceState.orientation;
      const index = renderedSliceIndex();
      const { width, height } = sliceTextureSize(orientation, activeDims);
      const field = extractSlice(orientation, s.d, activeDims, index);
      const rgba = new Uint8Array(width * height * 4);
      for (let n = 0; n < field.length; n++) {
        const [r, g, b] = viridis(normalizeToUnit(field[n], sliceState.min, sliceState.max));
        rgba[n * 4] = Math.round(r * 255);
        rgba[n * 4 + 1] = Math.round(g * 255);
        rgba[n * 4 + 2] = Math.round(b * 255);
        rgba[n * 4 + 3] = 255;
      }
      view.setSlice(rgba, width, height, sliceWorldMatrix(orientation, index, activeDims, view.offset));
    } else {
      view.hideSlice();
    }

    updateHud(s);
  }

  // ── Picking (A3-3) ───────────────────────────────────────────────────────────────────────
  const readoutElement = byId<HTMLDivElement>("readout");

  function showReadout(i: number, j: number, k: number): boolean {
    const s = latest;
    if (s === null) return false;
    const info = buildPickInfo(overlayContext(s), i, j, k, overlayState.name);
    readoutElement.textContent = formatReadout(info).join("\n");
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
    const x = currentSurface[instanceId];
    const plane = activeDims.nx * activeDims.ny;
    const k = Math.floor(x / plane);
    const r = x - k * plane;
    const j = Math.floor(r / activeDims.nx);
    const i = r - j * activeDims.nx;
    showReadout(i, j, k);
  });
  view.renderer.domElement.addEventListener("pointerleave", hideReadout);

  // ── Worker messages ──────────────────────────────────────────────────────────────────────
  worker.addEventListener("message", (event: MessageEvent) => {
    const msg = event.data as WorkerToMain;
    switch (msg.kind) {
      case "ready": {
        appliedPreset = msg.config.preset;
        activeDims = msg.config.dims;
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

        currentSurface = surfaceCellIndices(msg.a, wall, activeDims);
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
        refreshView();
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
    if (latest !== null && latest.stopReason !== null) {
      uiHint = `run is stopped (${latest.stopReason}) — start/step are ignored; reset to grow again`;
      renderStatus();
      return;
    }
    worker.postMessage({ kind: "run" });
  };
  const pause = (): void => worker.postMessage({ kind: "pause" });
  const step = (): void => {
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
  overlayFolder
    .addBinding(overlayState, "min", { label: "range min (model units)", format: rangeFormat })
    .on("change", refreshView);
  overlayFolder
    .addBinding(overlayState, "max", { label: "range max (model units)", format: rangeFormat })
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
    const jApi = sliceFolder.addBinding(sliceState, "jIndex", {
      label: "j index (drag along normal)",
      min: 0,
      max: activeDims.ny - 1,
      step: 1,
      index: 2,
    });
    jApi.on("change", refreshView);
    const kApi = sliceFolder.addBinding(sliceState, "kIndex", {
      label: "k index (drag along normal)",
      min: 0,
      max: activeDims.nz - 1,
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

  // ── Debug hooks (screenshot harness; same code paths as the UI) ──────────────────────────
  debugHook.start = start;
  debugHook.pause = pause;
  debugHook.step = step;
  debugHook.reset = reset;
  debugHook.orbit = (deg: number) => view.orbitBy(deg);
  debugHook.setOverlay = (name: string): boolean => {
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
    overlayState.min = min;
    overlayState.max = max;
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
    const s = latest;
    if (s === null) return null;
    const bbox = latticeBBox(s.a, activeDims);
    if (bbox === null) return null;
    // Deterministic rim cell: in the crystal's top layer, the attached cell with max i
    // (then max j as a tiebreak) — on the facet edge by construction.
    const plane = activeDims.nx * activeDims.ny;
    const base = bbox.kMax * plane;
    let best: { i: number; j: number; k: number } | null = null;
    for (let p = 0; p < plane; p++) {
      if (s.a[base + p] !== 1) continue;
      const i = p % activeDims.nx;
      const j = (p - i) / activeDims.nx;
      if (best === null || i > best.i || (i === best.i && j > best.j)) {
        best = { i, j, k: bbox.kMax };
      }
    }
    if (best === null) return null;
    return showReadout(best.i, best.j, best.k) ? best : null;
  };
  debugHook.ratioSeriesTail = (n = 12): RatioSample[] => ratioSeries.slice(-n);
  debugHook.setCamera = (pose: CameraPose): void => view.setCameraPose(pose);
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

  renderStatus();
  sendInit();
}

boot().catch((err: unknown) => {
  fail(`boot failed: ${err instanceof Error ? err.message : String(err)}`);
});
