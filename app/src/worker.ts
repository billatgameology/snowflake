// The solver worker: GGSolver lives here and ONLY here (charter §3.1 — the solver runs in a
// Web Worker; the main thread renders snapshots and never steps the model).
//
// Loop shape: while running, step a small batch of ticks, then yield back to the event loop
// via setTimeout(0) so pause/reset messages are honored between batches. Snapshots post at a
// bounded rate (not every batch) with fresh transferable copies, so the render side always
// holds a coherent frame and the solver's own fields are never detached.
//
// STOP RULES ARE EVALUATED AFTER EVERY TICK — inside the batch loop, not per batch — via
// stoprule.ts, so single-step and free-running stop at the identical tick and zero ticks
// advance past a tripped rule (external review blocker, 2026-07-16: the old per-batch check
// let free-running overshoot single-step by up to 15 ticks and display post-domain-contact
// state — invalid evidence per charter §3.1 — as live growth).

import { GG_PRESETS, cellCount } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { advanceUntilStop } from "./stoprule.ts";
import { snapshotSourceFromSolver } from "./snapshot.ts";
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
  // snapshotSourceFromSolver computes the full core Metrics bundle (with the wall mask —
  // load-bearing for hexPrism depletion) once per POSTED snapshot, not per tick: at
  // 128x128x64 it costs about as much as a whole tick batch.
  const { message, transfers } = buildSnapshot(
    snapshotSourceFromSolver(solver, attachTick, running, stopReason),
  );
  scope.postMessage(message, transfers);
}

/** Attach-tick bookkeeping for the tick just run (0 stays "seed or never"). */
function recordAttachTicks(s: GGSolver): void {
  for (const x of s.lastAttached) attachTick[x] = s.tick;
}

/**
 * Advance up to maxTicks with the stop rules — far-field 2/3*rho and domain contact,
 * mirroring the runner's semantics (informational in this dev instrument, evidence only in
 * the runner) — evaluated after EVERY tick. Single-step (maxTicks 1) and free-running
 * batches share this exact path: the stopping tick is control-mode independent.
 */
function advance(maxTicks: number): void {
  if (solver === null || config === null) return;
  const rho = GG_PRESETS[config.preset].rho;
  const result = advanceUntilStop(solver, rho, maxTicks, recordAttachTicks);
  if (result.stopReason !== null) {
    stopReason = result.stopReason;
    running = false;
  }
}

function pump(): void {
  pumpScheduled = false;
  if (!running || solver === null || config === null) return;
  advance(BATCH_TICKS);
  if (stopReason !== null) {
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
          advance(1);
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
