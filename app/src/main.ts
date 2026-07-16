// Main thread: rendering, controls, and status only. The solver runs in the worker — nothing
// here ever constructs or steps a GGSolver (charter §3.1).

import { Pane } from "tweakpane";
import type { Dims, DomainShape, FarFieldCondition, GGPresetName } from "@vcc/core";
import {
  DEFAULT_INIT,
  validateInitConfig,
  type InitConfig,
  type SnapshotMessage,
  type StopReason,
  type WorkerToMain,
} from "./protocol.ts";
import { surfaceCellIndices } from "./surface.ts";
import { CrystalView } from "./render.ts";

interface VccDebug {
  tick: number;
  attached: number;
  backend: string | null;
  ticksPerSec: number | null;
  running: boolean;
  stopReason: StopReason;
  snapshotCount: number;
  errors: string[];
  start: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  orbit: (azimuthDegrees: number) => void;
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
  start: () => undefined,
  pause: () => undefined,
  step: () => undefined,
  reset: () => undefined,
  orbit: () => undefined,
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

async function boot(): Promise<void> {
  const container = document.getElementById("scene") as HTMLDivElement;
  const view = await CrystalView.create(container);
  debugHook.backend = view.backend;

  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

  // ── Mutable UI state (Tweakpane binds to this object) ────────────────────────────────────
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

  let wall: Uint8Array | null = null;
  let activeDims: Dims = DEFAULT_INIT.dims;
  let latest: SnapshotMessage | null = null;

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
    lines.push("all readouts: computed state, model units, unvalidated (§1.5)");
    statusElement.textContent = lines.join("\n");
  }

  worker.addEventListener("message", (event: MessageEvent) => {
    const msg = event.data as WorkerToMain;
    switch (msg.kind) {
      case "ready": {
        activeDims = msg.config.dims;
        wall = msg.wall;
        latest = null;
        view.frameDomain(activeDims, msg.center);
        renderStatus();
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

        view.updateCrystal(surfaceCellIndices(msg.a, wall, activeDims), activeDims);

        debugHook.tick = msg.tick;
        debugHook.attached = msg.attachedCount;
        debugHook.ticksPerSec = rateEma;
        debugHook.running = msg.running;
        debugHook.stopReason = msg.stopReason;
        debugHook.snapshotCount++;
        renderStatus();
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

  const config = pane.addFolder({ title: "run config (applies via reset)" });
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
  const start = (): void => worker.postMessage({ kind: "run" });
  const pause = (): void => worker.postMessage({ kind: "pause" });
  const step = (): void => worker.postMessage({ kind: "step" });
  const reset = (): void => sendInit();
  runFolder.addButton({ title: "start" }).on("click", start);
  runFolder.addButton({ title: "pause" }).on("click", pause);
  runFolder.addButton({ title: "step (one tick)" }).on("click", step);
  runFolder.addButton({ title: "reset (applies config)" }).on("click", reset);

  debugHook.start = start;
  debugHook.pause = pause;
  debugHook.step = step;
  debugHook.reset = reset;
  debugHook.orbit = (deg: number) => view.orbitBy(deg);

  renderStatus();
  sendInit();
}

boot().catch((err: unknown) => {
  fail(`boot failed: ${err instanceof Error ? err.message : String(err)}`);
});
