// Typed message protocol between the UI thread and the solver worker.
//
// This module is deliberately pure and environment-neutral (no DOM, no Worker APIs) so its
// helpers run under node in Vitest. The worker and the UI import the same types, so a message
// shape change breaks the compile on both sides at once.
//
// Provenance note (charter §1.5): every numeric field crossing this boundary is COMPUTED
// STATE of the GGThreshold model in model units, Evidence = unvalidated. The protocol carries
// no physical units because the model has none to offer.

import {
  GG_PRESETS,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGPresetName,
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
  /** hexPrism: inscribed hexagon radius; box: -1. */
  readonly hexRadius: number;
  /** 1 = inert wall cell. All zeros on a box domain. */
  readonly wall: Uint8Array;
}

/** Why the worker stopped stepping on its own (null = it did not). */
export type StopReason = "far-field-stop" | "domain-contact" | null;

export interface SnapshotMessage {
  readonly kind: "snapshot";
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
}

export interface FaultMessage {
  readonly kind: "fault";
  readonly message: string;
}

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

  return {
    preset: preset as GGPresetName,
    dims: { nx: d.nx as number, ny: d.ny as number, nz: d.nz as number },
    seed: seed,
    noiseEpsilon: noiseEpsilon,
    domain: domain,
    farField: farField,
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
  };
  return { message, transfers: [a.buffer, b.buffer, d.buffer, attachTick.buffer] };
}
