// Snapshot assembly test (A3-4 wiring pin): the worker-side snapshot builder MUST hand the
// solver's wall mask to computeMetrics. Without it, hexPrism depletion sampling reads inert
// wall cells (a = 0 but d pinned to 0, or any doctored value) as free vapor, and the HUD is
// silently wrong. The fixture doctors vapor values onto wall cells above the crystal so the
// with-wall and without-wall answers are OBSERVABLY different — a wiring regression flips
// the assertion, it cannot pass vacuously.

import { describe, expect, it } from "vitest";
import { GG_PRESETS, computeMetrics, idx } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { snapshotSourceFromSolver } from "../src/snapshot.ts";

function buildSolverWithWallAdjacentCrystal(): GGSolver {
  // hexPrism domain, center (4,4,2): hexRadius 4, zHalfExtent 2 -> active z in [0,4],
  // wall layers at z = 5, 6. Seed radius 2, thickness 5 fills z 0..4, so the crystal's top
  // layer kTop = 4 sits DIRECTLY under the wall cap and the depletion sampling layer
  // kTop + 1 = 5 is all wall.
  const solver = new GGSolver({
    dims: { nx: 9, ny: 9, nz: 7 },
    params: GG_PRESETS.plate,
    rngSeed: 1,
    domain: "hexPrism",
    center: [4, 4, 2],
    seedRadius: 2,
    seedThickness: 5,
  });
  // Doctor vapor onto the wall layer (physically impossible; this is a wiring probe, not a
  // physics fixture): center column reads 0.5, everything else 0.25. If the wall mask is
  // honored these cells are invisible to the metric (NaN); if it is dropped, the metric
  // reads ratio = 0.5 / 0.25 = 2.
  const dims = solver.dims;
  for (let j = 0; j < dims.ny; j++) {
    for (let i = 0; i < dims.nx; i++) {
      solver.d[idx(dims, i, j, 5)] = 0.25;
    }
  }
  solver.d[idx(dims, 4, 4, 5)] = 0.5;
  return solver;
}

describe("snapshotSourceFromSolver", () => {
  it("passes the solver's wall mask to computeMetrics (hexPrism depletion honesty)", () => {
    const solver = buildSolverWithWallAdjacentCrystal();
    const attachTick = new Uint32Array(solver.a.length);
    const src = snapshotSourceFromSolver(solver, attachTick, false, null);

    // Independent recomputation WITH the wall mask: the sampling layer is wall -> NaN.
    const withWall = computeMetrics(
      solver.a,
      solver.b,
      solver.d,
      solver.dims,
      solver.center,
      solver.tick,
      solver.farFieldMean(),
      solver.wall,
    );
    expect(withWall.depletionRatio).toBeNaN();
    expect(src.metrics.depletionCenter).toBe(withWall.depletionCenter);
    expect(src.metrics.depletionRim).toBe(withWall.depletionRim);
    expect(src.metrics.depletionRatio).toBeNaN();

    // The same call WITHOUT the wall mask gives a finite, WRONG answer (the doctored 2.0) —
    // proving the two wirings are observably different and the builder chose the right one.
    const withoutWall = computeMetrics(
      solver.a,
      solver.b,
      solver.d,
      solver.dims,
      solver.center,
      solver.tick,
      solver.farFieldMean(),
    );
    expect(withoutWall.depletionCenter).toBeCloseTo(0.5, 12);
    expect(withoutWall.depletionRim).toBeCloseTo(0.25, 12);
    expect(withoutWall.depletionRatio).toBeCloseTo(2, 12);
  });

  it("hands over live solver views (buildSnapshot does the copying) and the scalars", () => {
    const solver = buildSolverWithWallAdjacentCrystal();
    const attachTick = new Uint32Array(solver.a.length);
    const src = snapshotSourceFromSolver(solver, attachTick, true, null);
    expect(src.a).toBe(solver.a);
    expect(src.b).toBe(solver.b);
    expect(src.d).toBe(solver.d);
    expect(src.attachTick).toBe(attachTick);
    expect(src.tick).toBe(solver.tick);
    expect(src.attachedCount).toBe(solver.attachedCount);
    expect(src.boundarySize).toBe(solver.boundarySize());
    expect(src.running).toBe(true);
    expect(src.stopReason).toBeNull();
    expect(src.metrics.attachedCount).toBe(solver.attachedCount);
    expect(src.timeline).toBeNull();
  });

  it("carries the solver's ACTIVE environment, not the preset table (V4-3 honesty)", () => {
    const solver = buildSolverWithWallAdjacentCrystal();
    // Apply a timeline event that changes the basal threshold; the next snapshot must show
    // the ACTIVE thresholds, or the app's threshold-progress overlay silently lies.
    const environment = solver.timelineEnvironment();
    const changed = {
      ...environment,
      ggThreshBeta: [9, ...environment.ggThreshBeta.slice(1)] as unknown as
        typeof environment.ggThreshBeta,
    };
    solver.applyTimelineEnvironment(changed);
    const attachTick = new Uint32Array(solver.a.length);
    const src = snapshotSourceFromSolver(solver, attachTick, false, null);
    expect(src.environment).toEqual(changed);
    expect(src.environment.ggThreshBeta[0]).toBe(9);
    // The preset table is untouched (the change lives in the solver's owned params).
    expect(GG_PRESETS.plate.ggThreshBeta[1]).toBe(2.5);
  });
});
