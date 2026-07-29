// The engine seam (WP6 frozen design D1, slice S1): main.ts drives the simulation through
// ONE Engine interface carrying the solver worker's EXACT message semantics —
// ready/snapshot/fault inbound, init/run/pause/step/reset outbound — so the S3 GPU engine
// can slot in beside the CPU worker without rewiring the UI. S1 is behavior-preserving and
// CPU-only: WorkerEngine below wraps the existing worker.ts UNMODIFIED, and the worker
// construction, message encoding, and event wiring that lived inline in main.ts moved here
// intact.
//
// This module is deliberately thin. It never interprets, batches, or rewrites messages: the
// worker's protocol semantics (stop rules, snapshot cadence, fault text) pass through
// untouched, and the CPU solver still steps ONLY in its worker (charter §3.1).

import type {
  EngineSnapshot,
  FaultMessage,
  InitConfig,
  MainToWorker,
  ReadyMessage,
  SnapshotMessage,
} from "./protocol.ts";

/**
 * Inbound messages from an engine, generic over its snapshot variant of the
 * operator/engine-tagged union: the CPU worker posts full-field SnapshotMessages; the S3
 * GPU engine will post compact GpuSnapshots. For S = SnapshotMessage this is exactly the
 * worker's WorkerToMain wire union.
 */
export type EngineMessage<S extends EngineSnapshot = EngineSnapshot> =
  | ReadyMessage
  | S
  | FaultMessage;

/**
 * The engine seam (D1). Outbound methods mirror the worker protocol one message kind per
 * method; inbound protocol messages (ready/snapshot/fault) arrive on the onMessage handler.
 * onError carries transport-level failures OUTSIDE the protocol (e.g. a worker script
 * error) as a display-ready, engine-labeled string — solver faults arrive as ordinary
 * fault messages via onMessage, exactly as before the seam existed.
 */
export interface Engine<S extends EngineSnapshot = EngineSnapshot> {
  /** Register an inbound protocol handler (ready/snapshot/fault). */
  onMessage(handler: (msg: EngineMessage<S>) => void): void;
  /** Register a transport-failure handler (display-ready message, engine-labeled). */
  onError(handler: (message: string) => void): void;
  /** Construct (or reconstruct) the solver from a validated config; answers with ready. */
  init(config: InitConfig): void;
  /** Free-run until paused or a stop rule trips. */
  run(): void;
  /** Stop stepping; the engine answers with a forced snapshot of the frozen state. */
  pause(): void;
  /** Advance exactly one tick when paused and not stopped. */
  step(): void;
  /** Reconstruct with the LAST applied config (main.ts re-inits with a fresh config instead). */
  reset(): void;
}

/**
 * The CPU engine: the existing solver worker behind the seam. Each method posts the exact
 * message the old inline main.ts wiring sent; both handlers attach to the same Worker
 * events the old inline listeners used.
 */
export class WorkerEngine implements Engine<SnapshotMessage> {
  private readonly worker: Worker;

  constructor() {
    // The URL literal stays inline here so Vite's static worker detection keeps bundling
    // worker.ts as its own module-worker chunk, exactly as it did from main.ts.
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  }

  /** Typed outbound funnel: every posted message compiles against the worker protocol. */
  private post(msg: MainToWorker): void {
    this.worker.postMessage(msg);
  }

  onMessage(handler: (msg: EngineMessage<SnapshotMessage>) => void): void {
    this.worker.addEventListener("message", (event: MessageEvent) => {
      handler(event.data as EngineMessage<SnapshotMessage>);
    });
  }

  onError(handler: (message: string) => void): void {
    // The worker-specific prefix lives HERE, not in main.ts: byte-identical to the string
    // the old inline error listener produced, so S1 stays behavior-preserving.
    this.worker.addEventListener("error", (event: ErrorEvent) => {
      handler(`worker error: ${event.message}`);
    });
  }

  init(config: InitConfig): void {
    this.post({ kind: "init", config });
  }

  run(): void {
    this.post({ kind: "run" });
  }

  pause(): void {
    this.post({ kind: "pause" });
  }

  step(): void {
    this.post({ kind: "step" });
  }

  reset(): void {
    this.post({ kind: "reset" });
  }
}
