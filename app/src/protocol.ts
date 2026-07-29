// Typed message protocol between the UI thread and the solver worker.
//
// This module is deliberately pure and environment-neutral (no DOM, no Worker APIs) so its
// helpers run under node in Vitest. The worker and the UI import the same types, so a message
// shape change breaks the compile on both sides at once.
//
// Provenance note (charter §1.5): every numeric field crossing this boundary is COMPUTED
// STATE of the GGThreshold model in model units, Evidence = unvalidated. The protocol carries
// no physical units because the model has none to offer.
//
// WP6 S1 splits the snapshot type into the operator/engine-tagged union EngineSnapshot: the
// worker's wire shape is the frozen CPU variant (byte-for-byte unchanged — the tag is the
// ABSENCE of the engine field), and the compact GpuSnapshot variant exists ahead of the S3
// GPU engine. The Engine seam that carries these messages lives in engine.ts.

import {
  GG_PRESETS,
  ggTimelineEnvironmentFromParams,
  paramSlot,
  validateTimelineSchedule,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGParams,
  type GGPresetName,
  type GGTimelineEnvironment,
  type GGTimelineSchedule,
  type LatticeBBox,
  type Metrics,
} from "@vcc/core";

export type { Dims };

/** Everything the worker needs to construct a GGSolver. */
export interface InitConfig {
  readonly preset: GGPresetName;
  readonly dims: Dims;
  /** PRNG seed (uint32). Consumed only when noiseEpsilon > 0, always recorded. */
  readonly seed: number;
  /** gg-machinery §6 epsilon; 0 = noise off (phenomenological parameter, unvalidated). */
  readonly noiseEpsilon: number;
  readonly domain: DomainShape;
  readonly farField: FarFieldCondition;
  /**
   * Phase 4 scenario overrides over the preset (null = published preset value). The
   * ggThreshBeta(0,1) override is A-HABIT's single abstract columnarity control; the rho
   * override is A-BRANCH's registered fern endpoint. Both are phenomenological model
   * parameters, unvalidated.
   */
  readonly rhoOverride: number | null;
  readonly ggThreshBeta01Override: number | null;
  /**
   * Phase 4 abrupt G-G environment schedule (ADR 0011), evaluated in the worker by the SAME
   * @vcc/core schedule evaluator the runner uses. Its initialEnvironment must equal the
   * preset-plus-overrides initial parameters, so the recorded config cannot mislabel the
   * environment the run actually started in.
   */
  readonly schedule: GGTimelineSchedule | null;
}

export type MainToWorker =
  | { readonly kind: "init"; readonly config: InitConfig }
  | { readonly kind: "run" }
  | { readonly kind: "pause" }
  | { readonly kind: "step" }
  | { readonly kind: "reset" };

/**
 * Sent once per (re)construction. `wall` is static for the life of a solver, so it rides the
 * ready message instead of every snapshot.
 */
export interface ReadyMessage {
  readonly kind: "ready";
  readonly config: InitConfig;
  readonly center: readonly [number, number, number];
  /** 1 = inert wall cell. All zeros on a box domain. */
  readonly wall: Uint8Array;
}

/** Why the worker stopped stepping on its own (null = it did not). */
export type StopReason = "far-field-stop" | "domain-contact" | null;

/** Live progress of a configured G-G schedule (null when the run has no schedule). */
export interface TimelineSummary {
  readonly appliedEvents: number;
  readonly totalEvents: number;
  /** Completed-cycle count at the last applied event's crossing boundary. */
  readonly lastEventCycle: number | null;
}

export interface SnapshotMessage {
  readonly kind: "snapshot";
  /** Operator identity of this snapshot (V4-1). Live worker stepping is GG-only. */
  readonly operator: "GGThreshold";
  /**
   * Engine tag of the EngineSnapshot union — NEVER present on this CPU variant. The
   * worker's wire shape is frozen byte-for-byte (WP6 S1), so the CPU tag is the field's
   * absence rather than a serialized literal; GpuSnapshot carries engine: "gpu".
   */
  readonly engine?: never;
  readonly tick: number;
  readonly attachedCount: number;
  readonly boundarySize: number;
  /** Mean vapor d over the far-field shell (model units, computed state, unvalidated). */
  readonly farFieldMean: number;
  readonly domainContact: boolean;
  readonly running: boolean;
  readonly stopReason: StopReason;
  /** Attachment flag, 0/1 (copy). */
  readonly a: Uint8Array;
  /** Boundary mass b, f32 display copy of the solver's f64 field. */
  readonly b: Float32Array;
  /** Diffusive vapor mass d, f32 display copy of the solver's f64 field. */
  readonly d: Float32Array;
  /** Tick at which each cell attached; 0 = seed or never attached. */
  readonly attachTick: Uint32Array;
  /**
   * The standard core Metrics bundle (computed per posted snapshot, not per tick — it costs
   * ~90 ms at 128x128x64, comparable to a whole tick batch). All values: computed state,
   * model units, unvalidated.
   */
  readonly metrics: Metrics;
  /**
   * The solver's ACTIVE environment at this snapshot (solver.timelineEnvironment()). With
   * overrides or an applied timeline event this differs from the preset; overlays and
   * readouts must use it, never the preset table, or the G-G threshold-progress overlay
   * silently lies about the thresholds in force.
   */
  readonly environment: GGTimelineEnvironment;
  readonly timeline: TimelineSummary | null;
}

/**
 * GPU-engine snapshot variant (WP6 frozen design D6): counters and compact probes ONLY —
 * no full-field arrays and no core Metrics bundle. Quantities that need the full field
 * display "not computed in GPU mode (full-field metric)" rather than fake values. This
 * type exists from S1 so the EngineSnapshot union is real; nothing produces or consumes
 * it until the GPU engine lands (S3).
 */
export interface GpuSnapshot {
  readonly kind: "snapshot";
  /** Same operator honesty tag as the CPU variant — the GPU port is still GGThreshold. */
  readonly operator: "GGThreshold";
  /** Engine tag of the EngineSnapshot union: present, and "gpu", ONLY on GPU snapshots. */
  readonly engine: "gpu";
  readonly tick: number;
  readonly attachedCount: number;
  readonly boundarySize: number;
  /** Instrument shell-mean far-field vapor (GPU reduction; model units, unvalidated). */
  readonly farFieldMean: number;
  /** Host-side occupancy bbox from the compact attachment reads (null before the first). */
  readonly bbox: LatticeBBox | null;
  readonly domainContact: boolean;
  /** Run/stop state, same semantics as the CPU variant (stopReason is D6's stop reason). */
  readonly running: boolean;
  readonly stopReason: StopReason;
  /** The engine's ACTIVE environment — the same honesty contract as the CPU variant. */
  readonly environment: GGTimelineEnvironment;
  /** Honest engine/backend provenance line for the status panel (D6). */
  readonly provenance: string;
}

/**
 * The operator/engine-tagged snapshot union (WP6 S1). Discriminate on `engine`: undefined
 * means the CPU worker's frozen wire shape; "gpu" means the compact GPU variant. Both
 * variants carry their operator tag, so cross-operator honesty checks work unchanged.
 */
export type EngineSnapshot = SnapshotMessage | GpuSnapshot;

export interface FaultMessage {
  readonly kind: "fault";
  readonly message: string;
}

/** The CPU worker's exact wire union — unchanged by the S1 seam; GpuSnapshot never rides it. */
export type WorkerToMain = ReadyMessage | SnapshotMessage | FaultMessage;

export const PRESET_NAMES: readonly GGPresetName[] = [
  "plate",
  "dendrite",
  "needle",
  "hollowColumn",
];

export const DEFAULT_DIMS: Dims = { nx: 128, ny: 128, nz: 64 };

export const DEFAULT_INIT: InitConfig = {
  preset: "plate",
  dims: DEFAULT_DIMS,
  seed: 1,
  noiseEpsilon: 0,
  domain: "hexPrism",
  farField: "reflecting",
  rhoOverride: null,
  ggThreshBeta01Override: null,
  schedule: null,
};

const UINT32_MAX = 0xffff_ffff;

/**
 * Validate an InitConfig-shaped value (e.g. straight out of UI inputs) into a frozen config.
 * Throws with a named field on the first violation. The solver constructor re-validates —
 * this exists so bad UI input fails before a worker round trip.
 */
export function validateInitConfig(raw: unknown): InitConfig {
  if (raw === null || typeof raw !== "object") throw new Error("init config must be an object");
  const c = raw as Record<string, unknown>;

  const preset = c.preset;
  if (typeof preset !== "string" || !(PRESET_NAMES as readonly string[]).includes(preset)) {
    throw new Error(`preset must be one of ${PRESET_NAMES.join(", ")}, got ${String(preset)}`);
  }

  const dims = c.dims;
  if (dims === null || typeof dims !== "object") throw new Error("dims must be an object");
  const d = dims as Record<string, unknown>;
  for (const axis of ["nx", "ny", "nz"] as const) {
    const v = d[axis];
    if (typeof v !== "number" || !Number.isSafeInteger(v) || v <= 0) {
      throw new Error(`dims.${axis} must be a positive integer, got ${String(v)}`);
    }
  }

  const seed = c.seed;
  if (typeof seed !== "number" || !Number.isSafeInteger(seed) || seed < 0 || seed > UINT32_MAX) {
    throw new Error(`seed must be a uint32, got ${String(seed)}`);
  }

  const noiseEpsilon = c.noiseEpsilon;
  if (
    typeof noiseEpsilon !== "number" ||
    !Number.isFinite(noiseEpsilon) ||
    noiseEpsilon < 0 ||
    noiseEpsilon > 1
  ) {
    throw new Error(`noiseEpsilon must be finite in [0, 1], got ${String(noiseEpsilon)}`);
  }

  const domain = c.domain;
  if (domain !== "box" && domain !== "hexPrism") {
    throw new Error(`domain must be box or hexPrism, got ${String(domain)}`);
  }

  const farField = c.farField;
  if (farField !== "reflecting" && farField !== "dirichlet") {
    throw new Error(`farField must be reflecting or dirichlet, got ${String(farField)}`);
  }

  const positiveOrNull = (name: "rhoOverride" | "ggThreshBeta01Override"): number | null => {
    const value = c[name];
    if (value === undefined || value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be finite and > 0, got ${String(value)}`);
    }
    return value;
  };
  const rhoOverride = positiveOrNull("rhoOverride");
  const ggThreshBeta01Override = positiveOrNull("ggThreshBeta01Override");

  let schedule: GGTimelineSchedule | null = null;
  if (c.schedule !== undefined && c.schedule !== null) {
    const raw = c.schedule as GGTimelineSchedule;
    validateTimelineSchedule(raw);
    if (raw.operator !== "GGThreshold") {
      throw new Error("schedule operator must be GGThreshold (live worker stepping is GG-only)");
    }
    schedule = raw;
  }

  const config: InitConfig = {
    preset: preset as GGPresetName,
    dims: { nx: d.nx as number, ny: d.ny as number, nz: d.nz as number },
    seed: seed,
    noiseEpsilon: noiseEpsilon,
    domain: domain,
    farField: farField,
    rhoOverride,
    ggThreshBeta01Override,
    schedule,
  };

  if (schedule !== null) {
    // The recorded initial environment must be the one the run actually starts in.
    const derived = ggTimelineEnvironmentFromParams(ggParamsForInit(config));
    if (JSON.stringify(derived) !== JSON.stringify(schedule.initialEnvironment)) {
      throw new Error(
        "schedule.initialEnvironment must equal the preset-plus-overrides initial parameters",
      );
    }
  }
  return config;
}

/**
 * The exact G-G parameters the worker constructs the solver with: the published preset with
 * the config's Phase 4 overrides applied. Fresh owned vectors every call; the preset table is
 * never mutated. When a schedule is configured its initialEnvironment equals this by
 * validation, so there is exactly one truth about the starting parameters.
 */
export function ggParamsForInit(config: InitConfig): GGParams {
  const preset = GG_PRESETS[config.preset];
  const ggThreshBeta = preset.ggThreshBeta.slice();
  if (config.ggThreshBeta01Override !== null) {
    ggThreshBeta[paramSlot(0, 1)] = config.ggThreshBeta01Override;
  }
  return {
    rho: config.rhoOverride ?? preset.rho,
    phi: preset.phi,
    kappa: preset.kappa.slice(),
    mu: preset.mu.slice(),
    ggThreshBeta,
  };
}

/** rho of the configured preset — the far-field stopping rule threshold needs it. */
export function presetRho(preset: GGPresetName): number {
  return GG_PRESETS[preset].rho;
}

/** What the worker reads off the solver to build one snapshot (all views, never mutated). */
export interface SnapshotSource {
  readonly tick: number;
  readonly attachedCount: number;
  readonly boundarySize: number;
  readonly farFieldMean: number;
  readonly domainContact: boolean;
  readonly running: boolean;
  readonly stopReason: StopReason;
  readonly a: Uint8Array;
  readonly b: Float64Array;
  readonly d: Float64Array;
  readonly attachTick: Uint32Array;
  readonly metrics: Metrics;
  /** The solver's active environment (solver.timelineEnvironment()), JSON-safe. */
  readonly environment: GGTimelineEnvironment;
  readonly timeline: TimelineSummary | null;
}

/**
 * Build a snapshot message plus its transfer list. Every typed array in the message is a
 * fresh copy (b and d down-converted to f32 for display), so the live solver fields are
 * never neutered by the transfer. Pure: does not touch the source arrays.
 */
export function buildSnapshot(src: SnapshotSource): {
  message: SnapshotMessage;
  transfers: ArrayBuffer[];
} {
  const a = src.a.slice();
  const b = new Float32Array(src.b.length);
  b.set(src.b);
  const d = new Float32Array(src.d.length);
  d.set(src.d);
  const attachTick = src.attachTick.slice();
  const message: SnapshotMessage = {
    kind: "snapshot",
    operator: "GGThreshold",
    tick: src.tick,
    attachedCount: src.attachedCount,
    boundarySize: src.boundarySize,
    farFieldMean: src.farFieldMean,
    domainContact: src.domainContact,
    running: src.running,
    stopReason: src.stopReason,
    a: a,
    b: b,
    d: d,
    attachTick: attachTick,
    metrics: src.metrics,
    environment: src.environment,
    timeline: src.timeline,
  };
  return { message, transfers: [a.buffer, b.buffer, d.buffer, attachTick.buffer] };
}
