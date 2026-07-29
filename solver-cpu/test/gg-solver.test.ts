import { describe, expect, it } from "vitest";
import {
  cellCount,
  coordsOf,
  isD6hInvariantSet,
  neighborIndices,
  symmetryError,
  totalMass,
  GG_PRESETS,
  type Dims,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";

const devDims: Dims = { nx: 32, ny: 32, nz: 16 };

describe("GGSolver — growth", () => {
  it("a crystal grows at all (charter §3.2 done-when)", () => {
    const solver = new GGSolver({ dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 });
    expect(solver.attachedCount).toBe(19);
    for (let t = 0; t < 400; t++) solver.step();
    expect(solver.attachedCount).toBeGreaterThan(19);
  });

  it("rejects invalid programmatic controls at the public solver boundary", () => {
    const base = { dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 };
    expect(() => new GGSolver({ ...base, rngSeed: Number.NaN })).toThrow(/rngSeed/);
    expect(() => new GGSolver({ ...base, rngSeed: 0x1_0000_0000 })).toThrow(/rngSeed/);
    expect(() => new GGSolver({ ...base, noiseEpsilon: 1.000_001 })).toThrow(/noiseEpsilon/);
    expect(() => new GGSolver({ ...base, noiseEpsilon: Number.NaN })).toThrow(/noiseEpsilon/);
    expect(() => new GGSolver({ ...base, dims: { ...devDims, nx: 1.5 } })).toThrow(/dims\.nx/);
    expect(() => new GGSolver({ ...base, center: [-1, 1, 1] })).toThrow(/center/);
    expect(() => new GGSolver({ ...base, domain: "bogus" as never })).toThrow(/domain/);
  });
});

describe("GGSolver — mass conservation (gate at full size runs via runner; this is the dev-grid version)", () => {
  it("crystal-free control run characterizes the float floor", () => {
    const solver = new GGSolver({
      dims: devDims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      seedRadius: null,
    });
    const m0 = totalMass(solver.b, solver.d);
    for (let t = 0; t < 2000; t++) solver.step();
    const drift = Math.abs(totalMass(solver.b, solver.d) - m0) / m0;
    // The uniform field is a fixed point of the smoother; any drift here is pure float
    // noise in state or measurement. Observed ~0; assert well under the gate tolerance.
    expect(drift).toBeLessThan(1e-13);
  });

  it("conserves total mass to < 1e-10 relative over 10 000 ticks GROWN, noise OFF, reflecting", () => {
    // The plan's check, run at its stated length with a crystal actually growing (maker
    // audit 2026-07-15: a 10k crystal-free control plus a 4800-tick grown run is not the
    // declared 10k grown experiment). Dev grid, no stop rules — conservation is the claim,
    // and it holds regardless of what the crystal does to the walls.
    const solver = new GGSolver({ dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 });
    const m0 = totalMass(solver.b, solver.d);
    for (let t = 0; t < 10_000; t++) solver.step();
    expect(solver.attachedCount).toBeGreaterThan(19); // grown, not a fixed-point run
    const drift = Math.abs(totalMass(solver.b, solver.d) - m0) / m0;
    expect(drift).toBeLessThan(1e-10);
  });

  it("conserves total mass with noise ON (the §6 form conserves by construction)", () => {
    const solver = new GGSolver({
      dims: devDims,
      params: GG_PRESETS.plate,
      rngSeed: 42,
      noiseEpsilon: 1e-5,
    });
    const m0 = totalMass(solver.b, solver.d);
    for (let t = 0; t < 1000; t++) solver.step();
    const drift = Math.abs(totalMass(solver.b, solver.d) - m0) / m0;
    expect(drift).toBeLessThan(1e-10);
  });

  it("conserves total mass with drift (phi > 0) enabled", () => {
    const solver = new GGSolver({
      dims: devDims,
      params: { ...GG_PRESETS.plate, phi: 0.01 },
      rngSeed: 1,
    });
    const m0 = totalMass(solver.b, solver.d);
    for (let t = 0; t < 500; t++) solver.step();
    const drift = Math.abs(totalMass(solver.b, solver.d) - m0) / m0;
    expect(drift).toBeLessThan(1e-10);
  });
});

describe("GGSolver — determinism (charter §3.1, pinned-oracle scope)", () => {
  it("two noise-on runs with the same seed are bit-identical", () => {
    const options = {
      dims: { nx: 24, ny: 24, nz: 12 },
      params: GG_PRESETS.plate,
      rngSeed: 42,
      noiseEpsilon: 1e-5,
    };
    const s1 = new GGSolver(options);
    const s2 = new GGSolver(options);
    for (let t = 0; t < 200; t++) {
      s1.step();
      s2.step();
    }
    expect(Array.from(s1.a)).toEqual(Array.from(s2.a));
    expect(Array.from(s1.b)).toEqual(Array.from(s2.b));
    expect(Array.from(s1.d)).toEqual(Array.from(s2.d));
  });

  it("a different seed produces a different noise realization", () => {
    const base = {
      dims: { nx: 24, ny: 24, nz: 12 },
      params: GG_PRESETS.plate,
      noiseEpsilon: 1e-5,
    };
    const s1 = new GGSolver({ ...base, rngSeed: 1 });
    const s2 = new GGSolver({ ...base, rngSeed: 2 });
    for (let t = 0; t < 50; t++) {
      s1.step();
      s2.step();
    }
    expect(Array.from(s1.d)).not.toEqual(Array.from(s2.d));
  });
});

describe("GGSolver — symmetry (dev-grid version of the 2a gate; the gate itself runs via runner)", () => {
  it("plate preset, hexPrism domain, noise off: symmetry error is exactly 0 at every checked tick", () => {
    // The gate's domain is hexPrism (solver header, decision 1): the active region must
    // itself be D6h-symmetric or the walls break the crystal's symmetry legitimately.
    const solver = new GGSolver({
      dims: devDims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    for (let t = 0; t < 1000; t++) {
      solver.step();
      // Every tick: the exact incremental check (a periodic full metric alone can miss a
      // break that transiently heals — see the negative control below). Seed invariant +
      // every delta invariant => A_t invariant at every tick, not just sampled ones.
      if (solver.lastAttached.length > 0) {
        expect(isD6hInvariantSet(solver.lastAttached, solver.dims, solver.center)).toBe(true);
      }
      if (t % 50 === 0) {
        expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
      }
    }
    expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
    expect(solver.attachedCount).toBeGreaterThan(19);
  });

  it("negative control: the box domain breaks symmetry once the field feels the walls", () => {
    // Root-caused 2026-07-15 (plan, Tried and rejected): a box is not D6h-invariant — the
    // axial-rectangle footprint is a rhombus (no rot60 invariance), and an even nz has no
    // center plane (kc sits 8 layers from one z-wall, 7 from the other at nz=16) — so the
    // reflecting walls imprint their asymmetry on the vapor field and then on the crystal.
    // At 32x32x16 the first asymmetric attachment lands at tick 270 via zmirror, with a
    // boundary-mass split of ~0.03 between mirror partners: mesoscopic wall physics, three
    // orders above ulp scale, NOT index arithmetic. This control documents that the gate's
    // hexPrism domain is load-bearing; if this test ever fails, the box has silently become
    // symmetric and the domain machinery changed underneath the gate.
    const solver = new GGSolver({
      dims: devDims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "box",
    });
    let firstBrokenTick = -1;
    let symErrAtBreak = 0;
    for (let t = 0; t < 400; t++) {
      solver.step();
      if (
        firstBrokenTick < 0 &&
        solver.lastAttached.length > 0 &&
        !isD6hInvariantSet(solver.lastAttached, solver.dims, solver.center)
      ) {
        firstBrokenTick = solver.tick;
        symErrAtBreak = symmetryError(solver.a, solver.dims, solver.center);
      }
    }
    expect(firstBrokenTick).toBe(270);
    // Measured AT the break tick: the set-level error can transiently heal on later ticks
    // when the lagging mirror partners catch up — which is exactly why the gate checks the
    // per-tick delta, not just the periodic full metric.
    expect(symErrAtBreak).toBeGreaterThan(0);
    // And the heal itself, pinned: by tick 400 the set-level metric is back to 0 even though
    // the run demonstrably broke at 270. A periodic full metric alone would report this run
    // as symmetric — the per-tick delta check is load-bearing, not belt-and-braces.
    expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
  });
});

describe("GGSolver — boundary bookkeeping invariants", () => {
  it("the incremental boundary list and neighbor counts match a from-scratch recount", () => {
    const dims: Dims = { nx: 24, ny: 24, nz: 12 };
    const solver = new GGSolver({ dims, params: GG_PRESETS.hollowColumn, rngSeed: 3 });
    for (let t = 0; t < 500; t++) solver.step();

    const expectedBoundary = new Set<number>();
    const n = cellCount(dims);
    for (let x = 0; x < n; x++) {
      if (solver.a[x] === 1) continue;
      const [i, j, k] = coordsOf(dims, x);
      const neighbors = neighborIndices(dims, i, j, k);
      let nT = 0;
      let nZ = 0;
      for (let c = 0; c < 6; c++) if (neighbors[c] >= 0 && solver.a[neighbors[c]] === 1) nT++;
      for (let c = 6; c < 8; c++) if (neighbors[c] >= 0 && solver.a[neighbors[c]] === 1) nZ++;
      if (nT + nZ > 0) expectedBoundary.add(x);
      const [gotT, gotZ] = solver.neighborCounts(x);
      expect(gotT, `nT at ${x}`).toBe(nT);
      expect(gotZ, `nZ at ${x}`).toBe(nZ);
    }
    const actual = new Set(solver.boundaryCells());
    expect(actual).toEqual(expectedBoundary);
  });

  it("attached cells keep d = 0 forever", () => {
    const solver = new GGSolver({ dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 });
    for (let t = 0; t < 500; t++) solver.step();
    const n = cellCount(devDims);
    for (let x = 0; x < n; x++) {
      if (solver.a[x] === 1) expect(solver.d[x]).toBe(0);
    }
  });
});

// The oracle must be able to STATE its own cycle phase, so a cross-lane comparison can put
// each operator's own phase beside the other's instead of a self-attested witness. The
// accessor is observational: reading it neither advances the cycle nor relaxes the guards.
describe("GGSolver — observable cycle phase", () => {
  it("names every phase the two-method cycle actually passes through", () => {
    const dims: Dims = { nx: 12, ny: 12, nz: 8 };
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1 });
    expect(solver.cyclePhase()).toBe("boundary");

    solver.relaxField();
    expect(solver.cyclePhase()).toBe("relaxed");
    solver.advanceSurface();
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.tick).toBe(1);

    solver.step();
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.tick).toBe(2);

    // A second unmatched relaxation is the diagnostic path, and it stays refused as a cycle.
    solver.relaxField();
    solver.relaxField();
    expect(solver.cyclePhase()).toBe("diagnosticRelaxed");
    expect(() => solver.advanceSurface()).toThrow(/diagnosticRelaxed/);
    expect(solver.cyclePhase()).toBe("diagnosticRelaxed");
    expect(() => solver.step()).toThrow(/diagnosticRelaxed/);
  });

  it("reads the phase without advancing the cycle or moving state", () => {
    const dims: Dims = { nx: 12, ny: 12, nz: 8 };
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1 });
    for (let t = 0; t < 6; t++) solver.step();
    const tick = solver.tick;
    const attached = solver.attachedCount;
    const mass = totalMass(solver.b, solver.d);
    for (let read = 0; read < 3; read++) {
      expect(solver.cyclePhase()).toBe("boundary");
    }
    expect(solver.tick).toBe(tick);
    expect(solver.attachedCount).toBe(attached);
    expect(totalMass(solver.b, solver.d)).toBe(mass);
  });

  it("returns to a completed-cycle boundary after a rejected environment event", () => {
    const dims: Dims = { nx: 12, ny: 12, nz: 8 };
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1 });
    solver.step();
    expect(() =>
      solver.applyTimelineEnvironment({
        ...solver.timelineEnvironment(),
        rho: Number.NaN,
      }),
    ).toThrow();
    expect(solver.cyclePhase()).toBe("boundary");
    solver.step();
    expect(solver.tick).toBe(2);
  });
});
