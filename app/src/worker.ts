// The solver worker: GGSolver lives here and ONLY here (charter §3.1 — the solver runs in a
// Web Worker; the main thread renders snapshots and never steps the model).
//
// Loop shape: while running, step a small batch of ticks, then yield back to the event loop
// via setTimeout(0) so pause/reset messages are honored between batches. Snapshots post at a
// bounded rate (not every batch) with fresh transferable copies, so the render side always
// holds a coherent frame and the solver's own fields are never detached.

import { GG_PRESETS, cellCount, computeMetrics } from "@vcc/core";
import { FAR_FIELD_STOP_FRACTION, GGSolver } from "@vcc/solver-cpu";
import {
  buildSnapshot,
  validateInitConfig,
  type InitConfig,
  type MainToWorker,
  type StopReason,
  type WorkerToMain,
} from "./protocol.ts";

// DedicatedWorkerGlobalScope is absent from the DOM lib; a minimal structural type keeps this
// file compiling in the same tsconfig as the rest of the app.
interface WorkerScope {
  postMessage(message: WorkerToMain, transfer?: ArrayBuffer[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}
const scope = globalThis as unknown as WorkerScope;

/** Ticks per batch between event-loop yields: small enough to keep pause latency low. */
const BATCH_TICKS = 16;
/** Minimum milliseconds between snapshot posts while free-running. */
const SNAPSHOT_INTERVAL_MS = 100;

let solver: GGSolver | null = null;
let config: InitConfig | null = null;
let attachTick: Uint32Array = new Uint32Array(0);
let running = false;
let stopReason: StopReason = null;
let lastSnapshotAt = -Infinity;
let pumpScheduled = false;

function construct(cfg: InitConfig): void {
  running = false;
  stopReason = null;
  solver = new GGSolver({
    dims: cfg.dims,
    params: GG_PRESETS[cfg.preset],
    rngSeed: cfg.seed,
    noiseEpsilon: cfg.noiseEpsilon,
    domain: cfg.domain,
    farField: cfg.farField,
  });
  config = cfg;
  attachTick = new Uint32Array(cellCount(cfg.dims));
  const wall = solver.wall.slice();
  scope.postMessage(
    {
      kind: "ready",
      config: cfg,
      center: [solver.center[0], solver.center[1], solver.center[2]],
      hexRadius: solver.hexRadius,
      wall: wall,
    },
    [wall.buffer],
  );
  postSnapshot(true);
}

function postSnapshot(force: boolean): void {
  if (solver === null) return;
  const now = performance.now();
  if (!force && now - lastSnapshotAt < SNAPSHOT_INTERVAL_MS) return;
  lastSnapshotAt = now;
  // The full core bundle rides every POSTED snapshot (bounded rate), not every tick: at
  // 128x128x64 it costs about as much as a whole tick batch.
  const metrics = computeMetrics(
    solver.a,
    solver.b,
    solver.d,
    solver.dims,
    solver.center,
    solver.tick,
    solver.farFieldMean(), // hexPrism walls make the box-face far-field mean meaningless
    solver.wall,
  );
  const { message, transfers } = buildSnapshot({
    tick: solver.tick,
    attachedCount: solver.attachedCount,
    boundarySize: solver.boundarySize(),
    farFieldMean: solver.farFieldMean(),
    domainContact: solver.domainContact(),
    metrics: metrics,
    running: running,
    stopReason: stopReason,
    a: solver.a,
    b: solver.b,
    d: solver.d,
    attachTick: attachTick,
  });
  scope.postMessage(message, transfers);
}

/** One solver tick plus attach-tick bookkeeping (0 stays "seed or never"). */
function stepOnce(s: GGSolver): void {
  s.step();
  for (const x of s.lastAttached) attachTick[x] = s.tick;
}

/**
 * Autonomous stopping rules, mirroring the runner's semantics (computed state, model units,
 * unvalidated — informational in this dev instrument, evidence only in the runner):
 * far-field vapor below (2/3) * rho (§7 stopping rule) or the 65% domain-contact guard.
 */
function checkStop(s: GGSolver, cfg: InitConfig): StopReason {
  if (s.domainContact()) return "domain-contact";
  if (s.farFieldMean() < FAR_FIELD_STOP_FRACTION * GG_PRESETS[cfg.preset].rho) {
    return "far-field-stop";
  }
  return null;
}

function pump(): void {
  pumpScheduled = false;
  if (!running || solver === null || config === null) return;
  for (let n = 0; n < BATCH_TICKS; n++) stepOnce(solver);
  stopReason = checkStop(solver, config);
  if (stopReason !== null) {
    running = false;
    postSnapshot(true);
    return;
  }
  postSnapshot(false);
  schedulePump();
}

function schedulePump(): void {
  if (pumpScheduled) return;
  pumpScheduled = true;
  setTimeout(pump, 0);
}

scope.addEventListener("message", (event: MessageEvent) => {
  const msg = event.data as MainToWorker;
  try {
    switch (msg.kind) {
      case "init": {
        construct(validateInitConfig(msg.config));
        break;
      }
      case "run": {
        if (solver === null) throw new Error("run before init");
        if (!running && stopReason === null) {
          running = true;
          schedulePump();
        }
        break;
      }
      case "pause": {
        running = false;
        postSnapshot(true);
        break;
      }
      case "step": {
        if (solver === null) throw new Error("step before init");
        if (!running && stopReason === null) {
          stepOnce(solver);
          stopReason = checkStop(solver, config as InitConfig);
          postSnapshot(true);
        }
        break;
      }
      case "reset": {
        if (config === null) throw new Error("reset before init");
        construct(config);
        break;
      }
    }
  } catch (err) {
    running = false;
    scope.postMessage({ kind: "fault", message: err instanceof Error ? err.message : String(err) });
  }
});
