/// <reference types="@webgpu/types" />
// The GPU engine (WP6 frozen design, slice S3): GpuGgSolver behind the D1 Engine seam.
// The GPU does the work; this module only encodes bounded submissions and compact reads on
// the main thread — it never steps a model in JS. The permanent CPU worker stays available
// beside it (charter §3.1; the float64 oracle is never replaced).
//
// Frozen decisions implemented here:
//   D3 — two production submission controllers on the ONE shared device: a solver
//        controller whose generation is bumped per init/reset (GpuGgSolver.assertUsable
//        requires it to equal the arena generation) and a separate edit controller advanced
//        per registered UI edit (environment events, budget selection). A production
//        GpuReadbackAudit owns EVERY readback; S3 never opens a display frame, so the
//        full-field display-frame read count is structurally zero.
//   D6 — snapshots carry counters and compact probes ONLY (tick, attachedCount,
//        boundarySize, instrument far-field mean, host bbox/contact, active environment,
//        stop reason, provenance line). Environment edits apply through
//        applyTimelineEnvironment at completed-cycle boundaries, queued when mid-step.
//
// Initial state factory: a transient CPU GGSolver at the selected dims — identical seed,
// masks, and boundary order to the worker path — whose float32/uint32 projections are
// uploaded exactly as the accepted WP3/performance probes proved, then the solver is
// discarded. The engine keeps only compact host state (wall mask for the ready message,
// center, incremental bbox, counters).
//
// Pump: an async op queue serializes construction, stepping, edits, and control messages
// (the same role the worker's message queue plays), fully decoupled from rAF. Free-running
// is one long op that advances a tick at a time, evaluates the stop rules after EVERY tick
// (stoprule.ts semantics: stepped and free-running stop at the identical tick), and yields
// to the event loop between ticks so UI events interleave.
//
// Budgets: selection maps to the frozen PHASE5_BUDGETS dims. Allocation is fail-closed —
// the plan is validated against the live device limits BEFORE any prior state is touched,
// and a budget that cannot allocate faults with a message naming the violated limit(s) and
// the estimated bytes while the previously constructed state stays live.

import {
  DOMAIN_CONTACT_FRACTION,
  cellCount,
  type Dims,
  type GGTimelineEnvironment,
  type LatticeBBox,
  type LatticeExtents,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import {
  GPU_GG_CYCLE_REPORT_BYTES,
  GPU_TOPOLOGY_FAR_FIELD,
  GpuBufferArena,
  GpuGgSolver,
  GpuReadbackAudit,
  GpuSubmissionController,
  createGpuBufferPlan,
  decodeGpuGgCycleReport,
  readGpuBuffer,
  validateGpuAllocation,
  type GpuGgSolverInput,
  type GpuSubmissionRecord,
} from "@vcc/solver-gpu";
import {
  PHASE5_BUDGETS,
  type Phase5Budget,
  type Phase5BudgetName,
} from "../../runner/src/phase5-protocol.ts";
import type { Engine, EngineMessage } from "./engine.ts";
import {
  ggParamsForInit,
  validateInitConfig,
  type GpuSnapshot,
  type InitConfig,
  type StopReason,
} from "./protocol.ts";
import {
  completedCycleBoundary,
  createScheduleRuntime,
  evaluateScheduleBoundary,
  initialBoundary,
  type GGScheduleRuntime,
} from "./ggtimeline.ts";
import { evaluateStopRules } from "./stoprule.ts";
import { GpuAttachTickInstrument, GpuShellMeanInstrument } from "./gpu-instrument.ts";
import type { GpuViewSource } from "./gpuview.ts";

export type { Phase5Budget, Phase5BudgetName };
export type { GpuSubmissionRecord };

/**
 * The D6 provenance line every GPU snapshot carries (frozen wording). "D3D12 observed"
 * states the Phase 5 evidence scope — the registered Windows/Chromium/D3D12 lane — not a
 * per-boot backend probe; the claim never widens beyond what the gate observed.
 */
export const GPU_ENGINE_PROVENANCE =
  "float32 GPU, D3D12 observed — computed state, unvalidated; float64 CPU oracle selectable";

/** Bounded snapshot cadence while free-running (same bound as the CPU worker). */
export const GPU_SNAPSHOT_INTERVAL_MS = 100;

// ── Budget mapping ─────────────────────────────────────────────────────────────────────────

export function gpuBudgetIds(): readonly Phase5BudgetName[] {
  return PHASE5_BUDGETS.map((budget) => budget.id);
}

/** The frozen budget row for an id; throws naming the id so a typo cannot allocate. */
export function gpuBudgetById(id: string): Phase5Budget {
  const budget = PHASE5_BUDGETS.find((entry) => entry.id === id);
  if (budget === undefined) {
    throw new Error(`unknown GPU budget: ${id} (frozen ids: ${gpuBudgetIds().join(", ")})`);
  }
  return budget;
}

// ── Fail-closed allocation check ───────────────────────────────────────────────────────────

export interface GpuAllocationLimitsView {
  readonly maxBufferSize: number;
  readonly maxStorageBufferBindingSize: number;
}

export interface GpuBudgetCheck {
  readonly supported: boolean;
  /** Fault text naming the violated limit(s) and estimated bytes; null when supported. */
  readonly message: string | null;
  readonly largestBufferBytes: number;
  readonly totalCellBytes: number;
}

/**
 * Validate a budget's cell-buffer plan against device limits WITHOUT allocating anything.
 * The verdict comes from the production validateGpuAllocation (the same machinery
 * GpuBufferArena.create enforces); the message names every violated limit with its value,
 * the largest single cell buffer, and the estimated total bytes.
 */
export function checkGpuBudgetAllocation(
  id: Phase5BudgetName,
  dims: Dims,
  limits: GpuAllocationLimitsView,
): GpuBudgetCheck {
  const plan = createGpuBufferPlan(dims, "gg");
  const support = validateGpuAllocation(plan, {
    maxBufferSize: limits.maxBufferSize,
    maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
  });
  if (support.supported) {
    return {
      supported: true,
      message: null,
      largestBufferBytes: support.largestBufferBytes,
      totalCellBytes: plan.totalCellBytes,
    };
  }
  const violated: string[] = [];
  if (support.largestBufferBytes > limits.maxBufferSize) {
    violated.push(`maxBufferSize ${limits.maxBufferSize}`);
  }
  if (support.largestBufferBytes > limits.maxStorageBufferBindingSize) {
    violated.push(`maxStorageBufferBindingSize ${limits.maxStorageBufferBindingSize}`);
  }
  const limitText =
    violated.length > 0
      ? `largest cell buffer requires ${support.largestBufferBytes} bytes, above ` +
        violated.join(" and above ")
      : support.reasons.join("; ");
  const message =
    `GPU budget ${id} (${dims.nx}x${dims.ny}x${dims.nz}) cannot allocate: ${limitText}; ` +
    `all ${plan.buffers.length} cell buffers require ${plan.totalCellBytes} bytes total ` +
    `(${plan.bytesPerCell} bytes/cell x ${plan.layout.cellCount} cells). ` +
    `Nothing was allocated; the prior state stays live.`;
  return {
    supported: false,
    message,
    largestBufferBytes: support.largestBufferBytes,
    totalCellBytes: plan.totalCellBytes,
  };
}

// ── Initial-state factory (transient CPU GGSolver, discarded after upload) ─────────────────

export interface GpuOracleSeedState {
  readonly input: GpuGgSolverInput;
  /** Wall mask copy for the ready message (static for the life of a solver). */
  readonly wall: Uint8Array;
  readonly center: readonly [number, number, number];
  readonly bbox: LatticeBBox | null;
  readonly attachedCount: number;
  readonly boundarySize: number;
  readonly environment: GGTimelineEnvironment;
}

/**
 * Construct the transient CPU GGSolver exactly as the worker does (same params path, same
 * default radius-2/thickness-1 seed, same masks and boundary order) and project its state
 * into the proven GpuGgSolverInput shape: f32 fields via Math.fround, u32 masks, the
 * far-field topology bits from the solver's own farFieldCells, and the solver's boundary
 * list verbatim. The oracle is discarded by the caller; only compact host state survives.
 */
export function gpuInputFromConfig(config: InitConfig): GpuOracleSeedState {
  const params = ggParamsForInit(config);
  const oracle = new GGSolver({
    dims: config.dims,
    params,
    rngSeed: config.seed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    farField: config.farField,
  });
  const topology = new Uint32Array(oracle.a.length);
  for (const index of oracle.farFieldCells) topology[index] |= GPU_TOPOLOGY_FAR_FIELD;
  const input: GpuGgSolverInput = {
    initialVapor: Float32Array.from(oracle.d, Math.fround),
    initialBoundaryMass: Float32Array.from(oracle.b, Math.fround),
    occupancy: Uint32Array.from(oracle.a),
    wall: Uint32Array.from(oracle.wall),
    topology,
    initialBoundaryIndices: Uint32Array.from(oracle.boundaryCells()),
    params: oracle.params,
    rngSeed: oracle.rngSeed,
    noiseEpsilon: oracle.noiseEpsilon,
    tick: oracle.tick,
    farField: oracle.farField,
    domain: oracle.domain,
    center: oracle.center,
  };
  return {
    input,
    wall: oracle.wall.slice(),
    center: [oracle.center[0], oracle.center[1], oracle.center[2]],
    bbox: hostBBoxOfOccupancy(oracle.a, config.dims),
    attachedCount: oracle.attachedCount,
    boundarySize: oracle.boundarySize(),
    environment: oracle.timelineEnvironment(),
  };
}

// ── Host-side bbox maintenance (compact attachment reads, never a full-field read) ─────────

function hostBBoxOfOccupancy(a: Uint8Array, dims: Dims): LatticeBBox | null {
  // Local scan of the TRANSIENT CPU oracle's occupancy at init time only; thereafter the
  // bbox advances exclusively through the per-cycle compact attachment reads.
  let iMin = Infinity;
  let iMax = -Infinity;
  let jMin = Infinity;
  let jMax = -Infinity;
  let kMin = Infinity;
  let kMax = -Infinity;
  let attachedCount = 0;
  const plane = dims.nx * dims.ny;
  for (let index = 0; index < a.length; index++) {
    if (a[index] === 0) continue;
    attachedCount++;
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / dims.nx);
    const i = remainder - j * dims.nx;
    if (i < iMin) iMin = i;
    if (i > iMax) iMax = i;
    if (j < jMin) jMin = j;
    if (j > jMax) jMax = j;
    if (k < kMin) kMin = k;
    if (k > kMax) kMax = k;
  }
  if (attachedCount === 0) return null;
  return { iMin, iMax, jMin, jMax, kMin, kMax, attachedCount };
}

/** Fold one cycle's attachment indices into the running bbox (pure; fresh object out). */
export function bboxWithAttachments(
  bbox: LatticeBBox | null,
  attachments: Uint32Array,
  dims: Dims,
): LatticeBBox | null {
  if (attachments.length === 0) return bbox;
  const plane = dims.nx * dims.ny;
  const total = cellCount(dims);
  let iMin = bbox === null ? Infinity : bbox.iMin;
  let iMax = bbox === null ? -Infinity : bbox.iMax;
  let jMin = bbox === null ? Infinity : bbox.jMin;
  let jMax = bbox === null ? -Infinity : bbox.jMax;
  let kMin = bbox === null ? Infinity : bbox.kMin;
  let kMax = bbox === null ? -Infinity : bbox.kMax;
  for (const index of attachments) {
    if (index >= total) throw new Error(`attachment index is out of range: ${index}`);
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / dims.nx);
    const i = remainder - j * dims.nx;
    if (i < iMin) iMin = i;
    if (i > iMax) iMax = i;
    if (j < jMin) jMin = j;
    if (j > jMax) jMax = j;
    if (k < kMin) kMin = k;
    if (k > kMax) kMax = k;
  }
  const attachedCount = (bbox === null ? 0 : bbox.attachedCount) + attachments.length;
  return { iMin, iMax, jMin, jMax, kMin, kMax, attachedCount };
}

/** The charter §3.1 65% guard over the host bbox — the same rule GGSolver.domainContact applies. */
export function bboxDomainContact(bbox: LatticeBBox | null, dims: Dims): boolean {
  if (bbox === null) return false;
  return (
    bbox.iMax - bbox.iMin + 1 > DOMAIN_CONTACT_FRACTION * dims.nx ||
    bbox.jMax - bbox.jMin + 1 > DOMAIN_CONTACT_FRACTION * dims.ny ||
    bbox.kMax - bbox.kMin + 1 > DOMAIN_CONTACT_FRACTION * dims.nz
  );
}

/** LatticeExtents from the host bbox — identical spans to @vcc/core latticeExtents. */
export function extentsFromBBox(bbox: LatticeBBox | null): LatticeExtents | null {
  if (bbox === null) return null;
  const iExtent = bbox.iMax - bbox.iMin + 1;
  const jExtent = bbox.jMax - bbox.jMin + 1;
  const zExtent = bbox.kMax - bbox.kMin + 1;
  const tExtent = Math.max(iExtent, jExtent);
  return {
    iExtent,
    jExtent,
    zExtent,
    tExtent,
    largestExtent: Math.max(tExtent, zExtent),
    attachedCount: bbox.attachedCount,
  };
}

// ── Snapshot assembly (exactly the D6 compact list; never a full-field array) ──────────────

export interface GpuSnapshotSource {
  readonly tick: number;
  readonly attachedCount: number;
  readonly boundarySize: number;
  readonly farFieldMean: number;
  readonly bbox: LatticeBBox | null;
  readonly domainContact: boolean;
  readonly running: boolean;
  readonly stopReason: StopReason;
  readonly environment: GGTimelineEnvironment;
}

function requireCounter(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`GPU snapshot ${label} must be a nonnegative integer`);
  }
  return value;
}

/**
 * Build one GpuSnapshot. Counters are validated, the bbox and environment are copied so a
 * later mutation cannot rewrite an already-posted snapshot, and the provenance line is the
 * frozen constant. farFieldMean may be NaN (empty shell) — NaN is reported, never faked.
 */
export function buildGpuSnapshot(src: GpuSnapshotSource): GpuSnapshot {
  requireCounter(src.tick, "tick");
  requireCounter(src.attachedCount, "attachedCount");
  requireCounter(src.boundarySize, "boundarySize");
  if (typeof src.farFieldMean !== "number") {
    throw new Error("GPU snapshot farFieldMean must be a number (NaN allowed)");
  }
  if (src.stopReason !== null && src.stopReason !== "far-field-stop" && src.stopReason !== "domain-contact") {
    throw new Error(`GPU snapshot stopReason is invalid: ${String(src.stopReason)}`);
  }
  let bbox: LatticeBBox | null = null;
  if (src.bbox !== null) {
    for (const key of ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax", "attachedCount"] as const) {
      requireCounter(src.bbox[key], `bbox.${key}`);
    }
    bbox = { ...src.bbox };
  }
  const env = src.environment;
  const environment: GGTimelineEnvironment = {
    rho: env.rho,
    phi: env.phi,
    kappa: [...env.kappa] as GGTimelineEnvironment["kappa"],
    mu: [...env.mu] as GGTimelineEnvironment["mu"],
    ggThreshBeta: [...env.ggThreshBeta] as GGTimelineEnvironment["ggThreshBeta"],
  };
  return {
    kind: "snapshot",
    operator: "GGThreshold",
    engine: "gpu",
    tick: src.tick,
    attachedCount: src.attachedCount,
    boundarySize: src.boundarySize,
    farFieldMean: src.farFieldMean,
    bbox,
    domainContact: src.domainContact,
    running: src.running,
    stopReason: src.stopReason,
    environment,
    provenance: GPU_ENGINE_PROVENANCE,
  };
}

// ── Boundary-queued environment edits (D6 / decision 0011) ─────────────────────────────────

export interface QueuedEnvironmentEdit {
  /** Monotone id acknowledged by the EDIT submission controller when the edit registered. */
  readonly editGeneration: number;
  readonly environment: GGTimelineEnvironment;
  readonly queuedAtMs: number;
}

/**
 * FIFO queue of environment edits awaiting a completed-cycle boundary. Queueing never
 * applies anything; only drain() releases entries, and the engine calls drain() exclusively
 * at completed-cycle boundaries (or immediately when idle AT such a boundary).
 */
export class GpuEnvironmentEditQueue {
  private entries: QueuedEnvironmentEdit[] = [];

  queueEdit(edit: QueuedEnvironmentEdit): void {
    const last = this.entries.at(-1);
    if (last !== undefined && edit.editGeneration <= last.editGeneration) {
      throw new Error("environment edit generations must increase monotonically");
    }
    this.entries.push(edit);
  }

  pending(): number {
    return this.entries.length;
  }

  /** Release all queued edits in FIFO order and clear the queue. */
  drain(): QueuedEnvironmentEdit[] {
    const drained = this.entries;
    this.entries = [];
    return drained;
  }

  clear(): void {
    this.entries = [];
  }
}

// ── Control-state machine (worker-equivalent message semantics) ────────────────────────────

export type GpuEngineState = "empty" | "idle" | "running" | "stopped" | "faulted";

export type GpuControlAction =
  | { readonly action: "construct" }
  | { readonly action: "start-pump" }
  | { readonly action: "pause" }
  | { readonly action: "single-step" }
  | { readonly action: "reconstruct" }
  | { readonly action: "ignore" }
  | { readonly action: "fault"; readonly message: string };

/**
 * The worker's exact control semantics as a pure decision table: init always constructs;
 * run/step before init fault by name; run/step are ignored while running, after a stop
 * rule tripped, and after a fault (a faulted GPU solver is poisoned — only a fresh init or
 * reset reconstructs); pause is always safe; reset before init faults by name.
 */
export function gpuEngineControlDecision(
  state: GpuEngineState,
  control: "init" | "run" | "pause" | "step" | "reset",
): GpuControlAction {
  switch (control) {
    case "init":
      return { action: "construct" };
    case "run":
      if (state === "empty") return { action: "fault", message: "run before init" };
      return state === "idle" ? { action: "start-pump" } : { action: "ignore" };
    case "pause":
      return { action: "pause" };
    case "step":
      if (state === "empty") return { action: "fault", message: "step before init" };
      return state === "idle" ? { action: "single-step" } : { action: "ignore" };
    case "reset":
      if (state === "empty") return { action: "fault", message: "reset before init" };
      return { action: "reconstruct" };
  }
}

// ── Audit summary (serializable, by-value) ─────────────────────────────────────────────────

export interface GpuAuditSummary {
  readonly readbackCount: number;
  readonly totalBytes: number;
  /** MUST be zero in S3: no display frame is ever opened, no full field is ever read for display. */
  readonly fullFieldDisplayFrameReadCount: number;
  readonly byPurpose: Readonly<Record<string, number>>;
}

export interface GpuControllerReport {
  readonly solver: readonly GpuSubmissionRecord[];
  readonly edit: readonly GpuSubmissionRecord[];
  readonly solverGeneration: number;
  readonly editGeneration: number;
  readonly pendingEnvironmentEdits: number;
}

// ── The engine ─────────────────────────────────────────────────────────────────────────────

export class GpuEngine implements Engine<GpuSnapshot> {
  private readonly device: GPUDevice;
  private readonly solverSubmissions: GpuSubmissionController;
  private readonly editSubmissions: GpuSubmissionController;
  private readonly audit = new GpuReadbackAudit();
  private readonly editQueue = new GpuEnvironmentEditQueue();
  private readonly messageHandlers: ((msg: EngineMessage<GpuSnapshot>) => void)[] = [];
  private readonly errorHandlers: ((message: string) => void)[] = [];

  private ops: Promise<void> = Promise.resolve();
  private state: GpuEngineState = "empty";
  private runRequested = false;
  private budgetId: Phase5BudgetName = "dev-plate";
  private lastConfig: InitConfig | null = null;

  private solver: GpuGgSolver | null = null;
  private arena: GpuBufferArena | null = null;
  private instrument: GpuShellMeanInstrument | null = null;
  /** S4 attach-tick maintenance (D5): display-owned per-cell attach ticks for overlays. */
  private attachTicks: GpuAttachTickInstrument | null = null;
  private scheduleRuntime: GGScheduleRuntime | null = null;
  private solverGeneration = 0;
  private editGeneration = 0;

  private dims: Dims = { nx: 0, ny: 0, nz: 0 };
  private center: readonly [number, number, number] = [0, 0, 0];
  private bbox: LatticeBBox | null = null;
  private attachedCount = 0;
  private boundarySize = 0;
  private farFieldMeanValue = Number.NaN;
  private environment: GGTimelineEnvironment | null = null;
  private stopReason: StopReason = null;
  private lastSnapshotAt = -Infinity;

  constructor(device: GPUDevice) {
    this.device = device;
    // D3: the two controllers. NEVER call destroy() on either — GpuSubmissionController
    // destroys its device, and this device is shared with the renderer for the page's life.
    this.solverSubmissions = new GpuSubmissionController(device);
    this.editSubmissions = new GpuSubmissionController(device);
  }

  // ── Engine seam (D1) ─────────────────────────────────────────────────────────────────────

  onMessage(handler: (msg: EngineMessage<GpuSnapshot>) => void): void {
    this.messageHandlers.push(handler);
  }

  onError(handler: (message: string) => void): void {
    this.errorHandlers.push(handler);
  }

  init(config: InitConfig): void {
    this.runRequested = false;
    let validated: InitConfig;
    try {
      validated = validateInitConfig(config);
    } catch (err) {
      this.postFault(err instanceof Error ? err.message : String(err));
      return;
    }
    this.enqueue(() => this.constructOp(validated));
  }

  run(): void {
    // Synchronous redundancy guard = the worker's `if (!running…)`: run while free-running
    // is ignored at arrival, not queued behind the pump.
    if (this.runRequested) return;
    this.runRequested = true;
    this.enqueue(async () => {
      const decision = gpuEngineControlDecision(this.state, "run");
      if (decision.action === "fault") {
        this.runRequested = false;
        this.postFault(decision.message);
        return;
      }
      if (decision.action !== "start-pump") {
        this.runRequested = false;
        return;
      }
      await this.pumpOp();
    });
  }

  pause(): void {
    this.runRequested = false;
    this.enqueue(() => {
      // Runs after the pump op exits its loop; the worker answers pause with a forced
      // snapshot of the frozen state (nothing when no solver exists yet).
      if (this.solver !== null && this.state !== "faulted") this.postSnapshot(true);
    });
  }

  step(): void {
    // Worker semantics at arrival time: ignored while running or stopped.
    if (this.runRequested || this.stopReason !== null) return;
    this.enqueue(async () => {
      const decision = gpuEngineControlDecision(this.state, "step");
      if (decision.action === "fault") {
        this.postFault(decision.message);
        return;
      }
      if (decision.action !== "single-step") return;
      await this.advanceOneTick();
      if (this.stopReason !== null) this.state = "stopped";
      this.postSnapshot(true);
    });
  }

  reset(): void {
    this.runRequested = false;
    this.enqueue(async () => {
      const decision = gpuEngineControlDecision(this.state, "reset");
      if (decision.action === "fault") {
        this.postFault(decision.message);
        return;
      }
      if (this.lastConfig === null) {
        this.postFault("reset before init");
        return;
      }
      await this.constructOp(this.lastConfig);
    });
  }

  // ── GPU-specific surface (main.ts holds the concrete type for these) ─────────────────────

  budget(): Phase5BudgetName {
    return this.budgetId;
  }

  /** Select a frozen budget (registered edit; takes effect at the next init/reset). */
  setBudget(id: string): Phase5Budget {
    const budget = gpuBudgetById(id);
    this.editSubmissions.acknowledgeEdit(++this.editGeneration);
    this.budgetId = budget.id;
    return budget;
  }

  /**
   * Queue an environment edit (decision 0011): acknowledged by the edit controller NOW,
   * applied via applyTimelineEnvironment at the next completed-cycle boundary — immediately
   * when the engine is idle at one, at the end of the in-flight cycle when mid-step. A
   * stopped or faulted engine only keeps the edit queued: a stopped run is frozen evidence
   * and is never silently mutated, and a fresh init clears the queue.
   */
  queueEnvironmentEdit(environment: GGTimelineEnvironment): number {
    const generation = ++this.editGeneration;
    this.editSubmissions.acknowledgeEdit(generation);
    this.editQueue.queueEdit({
      editGeneration: generation,
      environment,
      queuedAtMs: performance.now(),
    });
    if (!this.runRequested) {
      this.enqueue(() => {
        if (this.solver === null || this.state !== "idle") return;
        this.applyCompletedCycleBoundary(this.solver, /*includeSchedule*/ false);
        this.postSnapshot(true);
      });
    }
    return generation;
  }

  pendingEnvironmentEdits(): number {
    return this.editQueue.pending();
  }

  /**
   * Register an overlay/slice display-control edit on the EDIT submission controller (D3:
   * the edit controller advances per registered UI edit; the display repaint itself reads
   * solver buffers and therefore submits through the SOLVER controller).
   */
  registerViewEdit(): number {
    const generation = ++this.editGeneration;
    this.editSubmissions.acknowledgeEdit(generation);
    return generation;
  }

  /**
   * Everything the S4 GPU view reads for its display passes (D5: solver buffers via the
   * solver's exported accessors, the display-owned attach-tick buffer, and the SOLVER
   * submission controller + production audit the passes/probes must go through). Fresh per
   * call because the solver's vapor buffer ping-pongs per cycle. Null whenever no usable
   * solver exists (empty/faulted/stale) — the view skips the frame instead of faulting.
   */
  viewSource(): GpuViewSource | null {
    const solver = this.solver;
    const attachTicks = this.attachTicks;
    const environment = this.environment;
    if (solver === null || attachTicks === null || environment === null) return null;
    if (this.state === "empty" || this.state === "faulted") return null;
    try {
      return {
        dims: { ...this.dims },
        center: [this.center[0], this.center[1], this.center[2]],
        generation: this.solverGeneration,
        tick: solver.tick(),
        environment,
        buffers: {
          vapor: solver.activeVaporBuffer(),
          occupancy: solver.occupancyBuffer(),
          wall: solver.wallBuffer(),
          boundaryMass: solver.boundaryMassBuffer(),
          attachTick: attachTicks.buffer(),
        },
        submissions: this.solverSubmissions,
        audit: this.audit,
      };
    } catch {
      // A poisoned/stale solver refuses its accessors; the view treats that as "no state".
      return null;
    }
  }

  engineState(): GpuEngineState {
    return this.state;
  }

  auditSummary(): GpuAuditSummary {
    const records = this.audit.records();
    const byPurpose: Record<string, number> = {};
    for (const record of records) {
      byPurpose[record.purpose] = (byPurpose[record.purpose] ?? 0) + 1;
    }
    return {
      readbackCount: records.length,
      totalBytes: this.audit.totalBytes(),
      fullFieldDisplayFrameReadCount: this.audit.fullFieldDisplayFrameCount(),
      byPurpose,
    };
  }

  controllerReport(): GpuControllerReport {
    return {
      solver: this.solverSubmissions.records(),
      edit: this.editSubmissions.records(),
      solverGeneration: this.solverGeneration,
      editGeneration: this.editGeneration,
      pendingEnvironmentEdits: this.editQueue.pending(),
    };
  }

  // ── Op queue ─────────────────────────────────────────────────────────────────────────────

  private enqueue(op: () => Promise<void> | void): void {
    this.ops = this.ops.then(async () => {
      try {
        await op();
      } catch (err) {
        // A failed cycle poisons and destroys the GPU solver (its own fail-closed rule);
        // the engine reports the fault and requires a fresh init/reset.
        this.runRequested = false;
        this.state = this.solver === null ? "empty" : "faulted";
        this.postFault(err instanceof Error ? err.message : String(err));
      }
    });
  }

  // ── Construction (fail-closed budgets; prior state survives a refused budget) ────────────

  private async constructOp(config: InitConfig): Promise<void> {
    const budget = gpuBudgetById(this.budgetId);
    const { dims } = config;
    if (
      dims.nx !== budget.dims.nx ||
      dims.ny !== budget.dims.ny ||
      dims.nz !== budget.dims.nz
    ) {
      this.postFault(
        `GPU init dims ${dims.nx}x${dims.ny}x${dims.nz} do not match the selected budget ` +
          `${budget.id} (${budget.dims.nx}x${budget.dims.ny}x${budget.dims.nz}); ` +
          `the prior state stays live`,
      );
      return;
    }
    // Fail-closed budget check BEFORE anything is touched: a refused budget faults by name
    // with nothing allocated and the previously constructed state fully usable.
    const check = checkGpuBudgetAllocation(budget.id, dims, {
      maxBufferSize: Number(this.device.limits.maxBufferSize),
      maxStorageBufferBindingSize: Number(this.device.limits.maxStorageBufferBindingSize),
    });
    if (!check.supported) {
      this.postFault(check.message ?? "GPU budget allocation is unsupported");
      return;
    }

    // Transient CPU oracle → proven GPU input projection (identical seed/masks/boundary
    // order); the oracle itself is discarded when this scope ends.
    const seed = gpuInputFromConfig(config);

    // Tear down the prior generation and bump the solver controller so the new arena's
    // generation is the controller's current one (GpuGgSolver.assertUsable requires it).
    this.destroySolverState();
    const generation = this.solverGeneration + 1;
    this.solverSubmissions.acknowledgeEdit(generation);
    this.solverGeneration = generation;
    const arena = GpuBufferArena.create(
      this.device,
      generation,
      createGpuBufferPlan(dims, "gg"),
    );
    let solver: GpuGgSolver;
    try {
      solver = await GpuGgSolver.create(this.device, this.solverSubmissions, arena, seed.input);
    } catch (err) {
      // GpuGgSolver.create destroys the arena on failure; nothing stays half-allocated.
      this.state = "faulted";
      this.postFault(
        `GPU solver construction failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }
    this.solver = solver;
    this.arena = arena;
    this.instrument = GpuShellMeanInstrument.create(this.device, cellCount(dims));
    this.attachTicks = GpuAttachTickInstrument.create(this.device, cellCount(dims));
    this.dims = dims;
    this.center = seed.center;
    this.bbox = seed.bbox;
    this.attachedCount = seed.attachedCount;
    this.boundarySize = seed.boundarySize;
    this.stopReason = null;
    this.lastConfig = config;
    this.editQueue.clear();
    this.scheduleRuntime =
      config.schedule === null ? null : createScheduleRuntime(config.schedule);
    if (this.scheduleRuntime !== null) {
      // Decision 0011: a tick-0 event fires before the first cycle, exactly as the worker.
      evaluateScheduleBoundary(this.scheduleRuntime, initialBoundary(), (env) => {
        solver.applyTimelineEnvironment(env);
      });
    }
    this.environment = solver.timelineEnvironment();
    this.state = "idle";
    this.postMessage({
      kind: "ready",
      config,
      center: [seed.center[0], seed.center[1], seed.center[2]],
      wall: seed.wall,
    });
    // Honest tick-0 far-field mean: measured by the instrument over the uploaded state,
    // never copied from the discarded CPU oracle.
    this.farFieldMeanValue = (await this.measureFarField("init")).mean;
    this.postSnapshot(true);
  }

  private destroySolverState(): void {
    if (this.solver !== null && !this.solver.isDestroyed()) this.solver.destroy();
    this.solver = null;
    this.instrument?.destroy();
    this.instrument = null;
    this.attachTicks?.destroy();
    this.attachTicks = null;
    if (this.arena !== null && !this.arena.isDestroyed()) this.arena.destroy();
    this.arena = null;
    this.scheduleRuntime = null;
  }

  // ── Pump ─────────────────────────────────────────────────────────────────────────────────

  private async pumpOp(): Promise<void> {
    this.state = "running";
    try {
      while (this.runRequested && this.solver !== null && this.stopReason === null) {
        await this.advanceOneTick();
        this.postSnapshot(false);
        // Yield so queued UI events and control flags interleave between ticks even when
        // the GPU round trips are fast; the loop never rides rAF.
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      }
    } finally {
      if (this.state === "running") {
        this.state = this.stopReason !== null ? "stopped" : "idle";
      }
      this.runRequested = false;
    }
    if (this.state === "stopped") this.postSnapshot(true);
  }

  /**
   * One complete G-G cycle plus its compact instrumentation: step; read the 32-byte cycle
   * report; read this cycle's attachment indices (compact, attachedNow entries) into the
   * host bbox; evaluate the completed-cycle boundary (schedule events, then queued UI
   * edits — decision 0011 order, matching the worker's afterTick placement); measure the
   * instrument shell mean; evaluate the stop rules with the ACTIVE rho. No full-field read
   * exists on this path.
   */
  private async advanceOneTick(): Promise<void> {
    const solver = this.solver;
    const instrument = this.instrument;
    if (solver === null || instrument === null) throw new Error("step before init");
    const label = `app:gg:tick-${solver.tick() + 1}`;
    await solver.step(label);
    // S4 attach-tick maintenance (D5): stamp this cycle's ATTACHED_NOW render flags with
    // the post-step tick BEFORE the next cycle clears them — the CPU worker's exact
    // `attachTick[x] = s.tick` rule, kept on the GPU as display/instrument state.
    if (this.attachTicks !== null) {
      await this.attachTicks.record(
        solver.renderFlagsBuffer(),
        solver.tick(),
        this.solverGeneration,
        this.solverSubmissions,
        `${label}:attach-ticks`,
      );
    }
    const reportBytes = await readGpuBuffer(
      this.device,
      solver.reportBuffer(),
      {
        purpose: "compact-metric",
        label: `${label}:report`,
        generation: this.solverGeneration,
        byteOffset: 0,
        byteLength: GPU_GG_CYCLE_REPORT_BYTES,
      },
      this.audit,
    );
    const report = decodeGpuGgCycleReport(reportBytes);
    if (report.errorFlags !== 0) {
      throw new Error(`GPU G-G cycle ${solver.tick()} reported error flags ${report.errorFlags}`);
    }
    this.attachedCount = report.attachedTotal;
    this.boundarySize = report.boundaryCount;
    if (report.attachedNow > 0) {
      const attachmentBytes = await readGpuBuffer(
        this.device,
        solver.attachmentIndicesBuffer(),
        {
          purpose: "compact-metric",
          label: `${label}:attachments`,
          generation: this.solverGeneration,
          byteOffset: 0,
          byteLength: report.attachedNow * 4,
        },
        this.audit,
      );
      this.bbox = bboxWithAttachments(this.bbox, new Uint32Array(attachmentBytes), this.dims);
    }
    this.applyCompletedCycleBoundary(solver, /*includeSchedule*/ true);
    this.farFieldMeanValue = (await this.measureFarField(label)).mean;
    this.stopReason = evaluateStopRules({
      domainContact: bboxDomainContact(this.bbox, this.dims),
      farFieldMean: this.farFieldMeanValue,
      rho: this.environment?.rho ?? Number.NaN,
    });
  }

  private applyCompletedCycleBoundary(solver: GpuGgSolver, includeSchedule: boolean): void {
    if (includeSchedule && this.scheduleRuntime !== null) {
      const extents = extentsFromBBox(this.bbox);
      if (extents === null) throw new Error("timeline boundary requires an attached crystal");
      evaluateScheduleBoundary(
        this.scheduleRuntime,
        completedCycleBoundary(solver.tick(), extents),
        (env) => {
          solver.applyTimelineEnvironment(env);
        },
      );
    }
    for (const edit of this.editQueue.drain()) {
      solver.applyTimelineEnvironment(edit.environment);
    }
    this.environment = solver.timelineEnvironment();
  }

  private async measureFarField(label: string): Promise<{ mean: number }> {
    const solver = this.solver;
    const instrument = this.instrument;
    if (solver === null || instrument === null) throw new Error("instrument before init");
    return instrument.measure(
      {
        vapor: solver.activeVaporBuffer(),
        occupancy: solver.occupancyBuffer(),
        topology: solver.topologyBuffer(),
      },
      this.solverGeneration,
      this.solverSubmissions,
      this.audit,
      `${label}:far-field-mean`,
    );
  }

  // ── Outbound messages ────────────────────────────────────────────────────────────────────

  private postMessage(msg: EngineMessage<GpuSnapshot>): void {
    for (const handler of this.messageHandlers) handler(msg);
  }

  private postFault(message: string): void {
    this.postMessage({ kind: "fault", message });
  }

  private postSnapshot(force: boolean): void {
    if (this.solver === null || this.environment === null) return;
    const now = performance.now();
    if (!force && now - this.lastSnapshotAt < GPU_SNAPSHOT_INTERVAL_MS) return;
    this.lastSnapshotAt = now;
    this.postMessage(
      buildGpuSnapshot({
        tick: this.solver.tick(),
        attachedCount: this.attachedCount,
        boundarySize: this.boundarySize,
        farFieldMean: this.farFieldMeanValue,
        bbox: this.bbox,
        domainContact: bboxDomainContact(this.bbox, this.dims),
        running: this.state === "running" && this.stopReason === null,
        stopReason: this.stopReason,
        environment: this.environment,
      }),
    );
  }
}
