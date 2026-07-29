// Node-side tests for the pure WP6 S3 GPU-engine logic: the frozen-budget→dims mapping,
// the fail-closed allocation check's message content against the FROZEN Phase 5 limits,
// the transient-CPU-oracle initial-state factory (identical seed/masks/boundary order),
// host bbox/contact maintenance against the @vcc/core full-scan truth, the exact compact
// D6 snapshot shape, boundary-only environment-edit queueing, and the worker-equivalent
// control-state machine. The device-bearing paths (arena allocation, stepping, readbacks)
// need real hardware and are exercised on the registered host, not here.

import { describe, expect, it } from "vitest";
import {
  GG_PRESETS,
  domainContact,
  ggTimelineEnvironmentFromParams,
  latticeBBox,
  latticeExtents,
  type Dims,
  type GGTimelineSchedule,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { GPU_TOPOLOGY_FAR_FIELD } from "@vcc/solver-gpu";
import {
  PHASE5_BUDGETS,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";
import {
  GPU_DEBUG_READBACK_FIELDS,
  GPU_ENGINE_PROVENANCE,
  GpuEnvironmentEditQueue,
  bboxDomainContact,
  bboxWithAttachments,
  buildGpuSnapshot,
  checkGpuBudgetAllocation,
  extentsFromBBox,
  gpuBudgetById,
  gpuBudgetIds,
  gpuDebugFieldReadbackPlan,
  gpuEngineControlDecision,
  gpuInputFromConfig,
  validatedEnvironmentEdit,
  type GpuEngineState,
} from "../src/gpuengine.ts";
import { DEFAULT_DIMS, ggParamsForInit, validateInitConfig } from "../src/protocol.ts";
import {
  completedCycleBoundary,
  createScheduleRuntime,
  evaluateScheduleBoundary,
  initialBoundary,
} from "../src/ggtimeline.ts";

const FROZEN_LIMITS = {
  maxBufferSize: PHASE5_REQUIRED_LIMITS.maxBufferSize,
  maxStorageBufferBindingSize: PHASE5_REQUIRED_LIMITS.maxStorageBufferBindingSize,
};

function smallConfig(overrides: Record<string, unknown> = {}) {
  return validateInitConfig({
    preset: "plate",
    dims: { nx: 24, ny: 24, nz: 16 },
    seed: 7,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    rhoOverride: null,
    ggThreshBeta01Override: null,
    schedule: null,
    ...overrides,
  });
}

describe("budget → dims mapping (frozen PHASE5_BUDGETS)", () => {
  it("exposes exactly the eight frozen budget ids, in protocol order", () => {
    expect(gpuBudgetIds()).toEqual(PHASE5_BUDGETS.map((budget) => budget.id));
    expect(gpuBudgetIds()).toHaveLength(8);
  });

  it("maps every id to its exact frozen dims and disposition", () => {
    for (const frozen of PHASE5_BUDGETS) {
      const budget = gpuBudgetById(frozen.id);
      expect(budget.dims).toEqual(frozen.dims);
      expect(budget.disposition).toBe(frozen.disposition);
    }
  });

  it("maps the D4 default dev-plate budget onto the app's default dims", () => {
    expect(gpuBudgetById("dev-plate").dims).toEqual(DEFAULT_DIMS);
  });

  it("rejects an unknown id by name instead of allocating anything", () => {
    expect(() => gpuBudgetById("mega-plate")).toThrow(/unknown GPU budget: mega-plate/);
  });
});

describe("fail-closed allocation check against the frozen Phase 5 limits", () => {
  it("supports all four blocking budgets (dev + preview) under the frozen limits", () => {
    for (const id of ["dev-plate", "dev-column", "preview-plate", "preview-column"] as const) {
      const budget = gpuBudgetById(id);
      const check = checkGpuBudgetAllocation(id, budget.dims, FROZEN_LIMITS);
      expect(check.supported).toBe(true);
      expect(check.message).toBeNull();
      // Independent recomputation: one f32/u32 cell buffer is 4 bytes per cell.
      const cells = budget.dims.nx * budget.dims.ny * budget.dims.nz;
      expect(check.largestBufferBytes).toBe(cells * 4);
    }
  });

  it("refuses detailed-plate naming ONLY the violated binding limit, with exact bytes", () => {
    const budget = gpuBudgetById("detailed-plate");
    const check = checkGpuBudgetAllocation("detailed-plate", budget.dims, FROZEN_LIMITS);
    expect(check.supported).toBe(false);
    const cells = 800 * 800 * 48;
    expect(check.largestBufferBytes).toBe(cells * 4); // 122_880_000
    expect(check.totalCellBytes).toBe(cells * 48);
    const message = check.message ?? "";
    expect(message).toContain("GPU budget detailed-plate (800x800x48) cannot allocate");
    expect(message).toContain(
      `largest cell buffer requires ${cells * 4} bytes, above maxStorageBufferBindingSize ` +
        `${FROZEN_LIMITS.maxStorageBufferBindingSize}`,
    );
    // 122.88 MB fits under maxBufferSize (256 MiB), so that limit must NOT be blamed.
    expect(message).not.toContain("maxBufferSize");
    expect(message).toContain(`${cells * 48} bytes total`);
    expect(message).toContain("Nothing was allocated; the prior state stays live.");
  });

  it("refuses bake-plate naming BOTH violated limits, with exact bytes", () => {
    const budget = gpuBudgetById("bake-plate");
    const check = checkGpuBudgetAllocation("bake-plate", budget.dims, FROZEN_LIMITS);
    expect(check.supported).toBe(false);
    const cells = 1600 * 1600 * 52;
    expect(check.largestBufferBytes).toBe(cells * 4); // 532_480_000
    const message = check.message ?? "";
    expect(message).toContain("GPU budget bake-plate (1600x1600x52) cannot allocate");
    expect(message).toContain(`above maxBufferSize ${FROZEN_LIMITS.maxBufferSize}`);
    expect(message).toContain(
      `above maxStorageBufferBindingSize ${FROZEN_LIMITS.maxStorageBufferBindingSize}`,
    );
    expect(message).toContain(`${cells * 48} bytes total`);
    expect(message).toContain("(48 bytes/cell");
  });

  it("also refuses bake-column and detailed-column (capability-reported on this host)", () => {
    for (const id of ["detailed-column", "bake-column"] as const) {
      const budget = gpuBudgetById(id);
      const check = checkGpuBudgetAllocation(id, budget.dims, FROZEN_LIMITS);
      expect(check.supported).toBe(false);
      expect(check.message).toContain(id);
    }
  });
});

describe("initial-state factory (transient CPU GGSolver → proven GPU input projection)", () => {
  const config = smallConfig();
  const seedState = gpuInputFromConfig(config);
  // An independent second oracle at the identical config: GGSolver construction is
  // deterministic, so every projected array must match this reconstruction exactly.
  const oracle = new GGSolver({
    dims: config.dims,
    params: ggParamsForInit(config),
    rngSeed: config.seed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    farField: config.farField,
  });

  it("projects occupancy, wall, and the canonical 19-site seed exactly", () => {
    expect(seedState.input.occupancy).toEqual(Uint32Array.from(oracle.a));
    expect(seedState.input.wall).toEqual(Uint32Array.from(oracle.wall));
    expect(seedState.wall).toEqual(oracle.wall);
    // The canonical radius-2, thickness-1 seed has 19 sites (the paper's "20" is an erratum).
    expect(seedState.attachedCount).toBe(19);
    expect(seedState.input.tick).toBe(0);
  });

  it("preserves the oracle's boundary ORDER verbatim", () => {
    expect(seedState.input.initialBoundaryIndices).toEqual(
      Uint32Array.from(oracle.boundaryCells()),
    );
    expect(seedState.boundarySize).toBe(oracle.boundaryCells().length);
  });

  it("sets the far-field topology bit on exactly the oracle's farFieldCells", () => {
    const { topology } = seedState.input;
    let flagged = 0;
    for (let index = 0; index < topology.length; index++) {
      if (topology[index] === 0) continue;
      expect(topology[index]).toBe(GPU_TOPOLOGY_FAR_FIELD); // no other bits, ever
      flagged++;
    }
    expect(flagged).toBe(oracle.farFieldCells.length);
    for (const index of oracle.farFieldCells) {
      expect(topology[index] & GPU_TOPOLOGY_FAR_FIELD).toBe(GPU_TOPOLOGY_FAR_FIELD);
    }
  });

  it("rounds both float fields to f32 via Math.fround, cell for cell", () => {
    let vaporMismatches = 0;
    let massMismatches = 0;
    for (let index = 0; index < oracle.d.length; index++) {
      if (seedState.input.initialVapor[index] !== Math.fround(oracle.d[index])) vaporMismatches++;
      if (seedState.input.initialBoundaryMass[index] !== Math.fround(oracle.b[index])) {
        massMismatches++;
      }
    }
    expect(vaporMismatches).toBe(0);
    expect(massMismatches).toBe(0);
  });

  it("carries the oracle's center, domain, far field, seed identity, and environment", () => {
    expect(seedState.center).toEqual([...oracle.center]);
    expect(seedState.input.domain).toBe("hexPrism");
    expect(seedState.input.farField).toBe("reflecting");
    expect(seedState.input.rngSeed).toBe(7);
    expect(seedState.environment).toEqual(ggTimelineEnvironmentFromParams(oracle.params));
  });

  it("computes the initial host bbox identical to the core full scan", () => {
    expect(seedState.bbox).toEqual(latticeBBox(oracle.a, config.dims));
  });
});

describe("host bbox maintenance from compact attachment reads", () => {
  const dims: Dims = { nx: 20, ny: 18, nz: 12 };

  function occupancyOf(indices: readonly number[]): Uint8Array {
    const a = new Uint8Array(dims.nx * dims.ny * dims.nz);
    for (const index of indices) a[index] = 1;
    return a;
  }

  function cell(i: number, j: number, k: number): number {
    return k * dims.nx * dims.ny + j * dims.nx + i;
  }

  it("matches the @vcc/core full scan when folded incrementally in chunks", () => {
    const first = [cell(9, 9, 6), cell(10, 9, 6)];
    const second = [cell(3, 12, 2), cell(15, 4, 9)];
    const incremental = bboxWithAttachments(
      bboxWithAttachments(null, Uint32Array.from(first), dims),
      Uint32Array.from(second),
      dims,
    );
    expect(incremental).toEqual(latticeBBox(occupancyOf([...first, ...second]), dims));
  });

  it("returns the prior bbox unchanged for an empty attachment read", () => {
    const bbox = bboxWithAttachments(null, Uint32Array.from([cell(4, 5, 6)]), dims);
    expect(bboxWithAttachments(bbox, new Uint32Array(0), dims)).toBe(bbox);
  });

  it("rejects an out-of-range attachment index by value", () => {
    expect(() =>
      bboxWithAttachments(null, Uint32Array.of(dims.nx * dims.ny * dims.nz), dims),
    ).toThrow(/out of range/);
  });

  it("applies the exact 65% contact rule the core guard applies", () => {
    // nx = 20: an i-span of 13 is NOT contact (13 > 13 is false); a span of 14 is.
    const at = [cell(0, 9, 6), cell(12, 9, 6)];
    const over = [cell(0, 9, 6), cell(13, 9, 6)];
    const bboxAt = bboxWithAttachments(null, Uint32Array.from(at), dims);
    const bboxOver = bboxWithAttachments(null, Uint32Array.from(over), dims);
    expect(bboxDomainContact(bboxAt, dims)).toBe(false);
    expect(bboxDomainContact(bboxOver, dims)).toBe(true);
    // Same verdicts as the @vcc/core occupancy-scan guard.
    expect(bboxDomainContact(bboxAt, dims)).toBe(domainContact(occupancyOf(at), dims));
    expect(bboxDomainContact(bboxOver, dims)).toBe(domainContact(occupancyOf(over), dims));
    expect(bboxDomainContact(null, dims)).toBe(false);
  });

  it("derives LatticeExtents identical to the core computation", () => {
    const indices = [cell(2, 3, 1), cell(11, 14, 8), cell(7, 7, 4)];
    const bbox = bboxWithAttachments(null, Uint32Array.from(indices), dims);
    expect(extentsFromBBox(bbox)).toEqual(latticeExtents(occupancyOf(indices), dims));
    expect(extentsFromBBox(null)).toBeNull();
  });
});

describe("compact D6 snapshot shape", () => {
  const environment = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);
  const source = {
    tick: 42,
    attachedCount: 137,
    boundarySize: 250,
    farFieldMean: 0.4321,
    bbox: { iMin: 10, iMax: 20, jMin: 11, jMax: 19, kMin: 6, kMax: 9, attachedCount: 137 },
    domainContact: false,
    running: true,
    stopReason: null,
    environment,
  } as const;

  it("carries exactly the frozen compact field list — no full-field arrays, no metrics", () => {
    const snapshot = buildGpuSnapshot(source);
    expect(Object.keys(snapshot).sort()).toEqual(
      [
        "kind",
        "operator",
        "engine",
        "tick",
        "attachedCount",
        "boundarySize",
        "farFieldMean",
        "bbox",
        "domainContact",
        "running",
        "stopReason",
        "environment",
        "provenance",
      ].sort(),
    );
    expect(snapshot.kind).toBe("snapshot");
    expect(snapshot.operator).toBe("GGThreshold");
    expect(snapshot.engine).toBe("gpu");
    expect(snapshot.tick).toBe(42);
    expect(snapshot.bbox).toEqual(source.bbox);
  });

  it("pins the exact frozen provenance line", () => {
    expect(buildGpuSnapshot(source).provenance).toBe(
      "float32 GPU, D3D12 observed — computed state, unvalidated; float64 CPU oracle selectable",
    );
    expect(GPU_ENGINE_PROVENANCE).toBe(buildGpuSnapshot(source).provenance);
  });

  it("copies bbox and environment so later mutation cannot rewrite a posted snapshot", () => {
    const mutableEnvironment = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);
    const mutableBBox = {
      iMin: 10,
      iMax: 20,
      jMin: 11,
      jMax: 19,
      kMin: 6,
      kMax: 9,
      attachedCount: 137,
    };
    const snapshot = buildGpuSnapshot({
      ...source,
      environment: mutableEnvironment,
      bbox: mutableBBox,
    });
    (mutableEnvironment as { rho: number }).rho = 99;
    (mutableEnvironment.kappa as unknown as number[])[0] = 99;
    mutableBBox.iMax = 999;
    expect(snapshot.environment.rho).toBe(environment.rho);
    expect(snapshot.environment.kappa[0]).toBe(environment.kappa[0]);
    expect(snapshot.bbox?.iMax).toBe(20);
  });

  it("reports NaN far-field mean honestly instead of fabricating a number", () => {
    expect(buildGpuSnapshot({ ...source, farFieldMean: Number.NaN }).farFieldMean).toBeNaN();
  });

  it("rejects invalid counters and stop reasons by name", () => {
    expect(() => buildGpuSnapshot({ ...source, tick: -1 })).toThrow(/tick/);
    expect(() => buildGpuSnapshot({ ...source, attachedCount: 1.5 })).toThrow(/attachedCount/);
    expect(() =>
      buildGpuSnapshot({ ...source, stopReason: "melted" as unknown as null }),
    ).toThrow(/stopReason/);
    expect(() =>
      buildGpuSnapshot({ ...source, farFieldMean: "0.4" as unknown as number }),
    ).toThrow(/farFieldMean/);
  });
});

describe("boundary-only environment-edit queueing (D6, decision 0011)", () => {
  const env = (preset: "plate" | "dendrite") =>
    ggTimelineEnvironmentFromParams(GG_PRESETS[preset]);

  it("queues without applying: only an explicit drain releases edits, in FIFO order", () => {
    const queue = new GpuEnvironmentEditQueue();
    queue.queueEdit({ editGeneration: 1, environment: env("plate"), queuedAtMs: 0 });
    queue.queueEdit({ editGeneration: 2, environment: env("dendrite"), queuedAtMs: 1 });
    expect(queue.pending()).toBe(2);
    const drained = queue.drain();
    expect(drained.map((edit) => edit.editGeneration)).toEqual([1, 2]);
    expect(drained[0].environment.rho).toBe(GG_PRESETS.plate.rho);
    expect(drained[1].environment.rho).toBe(GG_PRESETS.dendrite.rho);
    expect(queue.pending()).toBe(0);
    expect(queue.drain()).toEqual([]);
  });

  it("enforces monotone edit generations (the edit-controller invariant)", () => {
    const queue = new GpuEnvironmentEditQueue();
    queue.queueEdit({ editGeneration: 3, environment: env("plate"), queuedAtMs: 0 });
    expect(() =>
      queue.queueEdit({ editGeneration: 3, environment: env("plate"), queuedAtMs: 1 }),
    ).toThrow(/monotonically/);
  });

  it("clear() discards pending edits (a fresh init must not inherit stale edits)", () => {
    const queue = new GpuEnvironmentEditQueue();
    queue.queueEdit({ editGeneration: 1, environment: env("plate"), queuedAtMs: 0 });
    queue.clear();
    expect(queue.pending()).toBe(0);
  });

  it("a tick-triggered schedule event fires at its exact completed-cycle boundary only", () => {
    // The pump feeds completedCycleBoundary(tick, extentsFromBBox(bbox)) to the SAME
    // shared evaluator the worker and runner use; this pins that boundary shape.
    const schedule: GGTimelineSchedule = {
      version: 1,
      mode: "abrupt",
      operator: "GGThreshold",
      initialEnvironment: env("plate"),
      events: [
        {
          index: 0,
          operator: "GGThreshold",
          trigger: { kind: "tick", value: 2 },
          environment: env("dendrite"),
        },
      ],
    };
    const runtime = createScheduleRuntime(schedule);
    const bbox = bboxWithAttachments(null, Uint32Array.of(0, 1, 2), { nx: 8, ny: 8, nz: 4 });
    const extents = extentsFromBBox(bbox);
    if (extents === null) throw new Error("extents must exist for an attached crystal");
    const applied: number[] = [];
    // The shared evaluator requires the tick-0 initial boundary first — exactly what the
    // engine's construct step evaluates before any cycle runs (decision 0011).
    const initial = evaluateScheduleBoundary(runtime, initialBoundary(), () => {
      applied.push(0);
    });
    expect(initial).toBeNull();
    const first = evaluateScheduleBoundary(runtime, completedCycleBoundary(1, extents), () => {
      applied.push(1);
    });
    expect(first).toBeNull();
    expect(applied).toEqual([]);
    const second = evaluateScheduleBoundary(runtime, completedCycleBoundary(2, extents), () => {
      applied.push(2);
    });
    expect(second?.event.trigger).toEqual({ kind: "tick", value: 2 });
    expect(applied).toEqual([2]);
  });
});

describe("seam validation of debug-supplied environment edits (WP6 S6)", () => {
  const validEnv = () => ggTimelineEnvironmentFromParams(GG_PRESETS.dendrite);

  it("normalizes a valid environment to an equal value with FRESH arrays", () => {
    const input = validEnv();
    const normalized = validatedEnvironmentEdit(input);
    expect(normalized).toEqual(validEnv());
    expect(normalized).not.toBe(input);
    expect(normalized.kappa).not.toBe(input.kappa);
    expect(normalized.mu).not.toBe(input.mu);
    expect(normalized.ggThreshBeta).not.toBe(input.ggThreshBeta);
    // Mutating the caller's object after validation cannot rewrite what was normalized.
    (input.kappa as unknown as number[])[0] = 999;
    expect(normalized.kappa[0]).toBe(validEnv().kappa[0]);
    // The normalized shape carries exactly the five environment keys, nothing extra.
    expect(Object.keys(normalized).sort()).toEqual([
      "ggThreshBeta",
      "kappa",
      "mu",
      "phi",
      "rho",
    ]);
  });

  it("rejects a non-object by name before anything reaches the queue", () => {
    for (const bad of [null, undefined, 7, "plate", [1, 2, 3]]) {
      expect(() =>
        validatedEnvironmentEdit(bad as unknown as ReturnType<typeof validEnv>),
      ).toThrow(/environment edit/);
    }
  });

  it("rejects a non-finite rho through the tested core validation", () => {
    const input = { ...validEnv(), rho: Number.NaN };
    expect(() => validatedEnvironmentEdit(input)).toThrow(/environment edit rejected/);
  });

  it("rejects a short threshold vector (missing slots become NaN and fail validation)", () => {
    const base = validEnv();
    const input = {
      ...base,
      ggThreshBeta: base.ggThreshBeta.slice(0, 3) as unknown as typeof base.ggThreshBeta,
    };
    expect(() => validatedEnvironmentEdit(input)).toThrow(/environment edit rejected/);
  });
});

describe("control-state machine (worker-equivalent message semantics)", () => {
  const states: readonly GpuEngineState[] = ["empty", "idle", "running", "stopped", "faulted"];

  it("init always constructs", () => {
    for (const state of states) {
      expect(gpuEngineControlDecision(state, "init")).toEqual({ action: "construct" });
    }
  });

  it("run: faults by name before init, starts the pump from idle, else is ignored", () => {
    expect(gpuEngineControlDecision("empty", "run")).toEqual({
      action: "fault",
      message: "run before init",
    });
    expect(gpuEngineControlDecision("idle", "run")).toEqual({ action: "start-pump" });
    for (const state of ["running", "stopped", "faulted"] as const) {
      expect(gpuEngineControlDecision(state, "run")).toEqual({ action: "ignore" });
    }
  });

  it("step: faults by name before init, steps once from idle, else is ignored", () => {
    expect(gpuEngineControlDecision("empty", "step")).toEqual({
      action: "fault",
      message: "step before init",
    });
    expect(gpuEngineControlDecision("idle", "step")).toEqual({ action: "single-step" });
    for (const state of ["running", "stopped", "faulted"] as const) {
      expect(gpuEngineControlDecision(state, "step")).toEqual({ action: "ignore" });
    }
  });

  it("pause is always safe; reset faults before init and reconstructs otherwise", () => {
    for (const state of states) {
      expect(gpuEngineControlDecision(state, "pause")).toEqual({ action: "pause" });
    }
    expect(gpuEngineControlDecision("empty", "reset")).toEqual({
      action: "fault",
      message: "reset before init",
    });
    for (const state of ["idle", "running", "stopped", "faulted"] as const) {
      expect(gpuEngineControlDecision(state, "reset")).toEqual({ action: "reconstruct" });
    }
  });
});

describe("TEST-purpose debug readback plan (WP6 S5 differential-probe seam)", () => {
  it("covers exactly the frozen six-field roster, complete buffers, purpose test", () => {
    const cells = 48 * 48 * 24;
    const plan = gpuDebugFieldReadbackPlan(cells, 3, 256);
    // The roster and its order are frozen: the engine method zips readbacks by name, and
    // the S5 probe's comparison inventory depends on every one of these being present.
    expect(plan.map((entry) => entry.name)).toEqual([
      "occupancy",
      "wall",
      "boundaryMass",
      "vapor",
      "attachTick",
      "topology",
    ]);
    expect(plan.map((entry) => entry.name)).toEqual([...GPU_DEBUG_READBACK_FIELDS]);
    for (const entry of plan) {
      // Purpose "test" and NO display-frame token: the production audit records these
      // outside any display frame, so fullFieldDisplayFrameReadCount stays zero (D6).
      expect(entry.purpose).toBe("test");
      expect(Object.keys(entry)).not.toContain("displayFrame");
      // Complete per-cell buffer: offset 0, cellCount 4-byte words, 4-byte aligned.
      expect(entry.byteOffset).toBe(0);
      expect(entry.byteLength).toBe(cells * 4);
      expect(entry.byteLength % 4).toBe(0);
      expect(entry.generation).toBe(3);
      expect(entry.label).toBe(`app:debug:tick-256:${entry.name}`);
    }
    // Labels are distinct (one auditable record per field).
    expect(new Set(plan.map((entry) => entry.label)).size).toBe(plan.length);
  });

  it("rejects invalid cell counts, generations, and ticks by name", () => {
    for (const bad of [0, -1, 1.5, Number.NaN, 0x1_0000_0000]) {
      expect(() => gpuDebugFieldReadbackPlan(bad, 1, 1)).toThrow(/cellCount/);
    }
    for (const bad of [-1, 1.5, Number.NaN, 0x1_0000_0000]) {
      expect(() => gpuDebugFieldReadbackPlan(64, bad, 1)).toThrow(/generation/);
      expect(() => gpuDebugFieldReadbackPlan(64, 1, bad)).toThrow(/tick/);
    }
  });
});
