import { describe, expect, it } from "vitest";
import {
  cellCount,
  coordsOf,
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

  it("conserves total mass to < 1e-10 relative over 2000 ticks, noise OFF, reflecting", () => {
    const solver = new GGSolver({ dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 });
    const m0 = totalMass(solver.b, solver.d);
    for (let t = 0; t < 2000; t++) solver.step();
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
  it("plate preset, noise off: symmetry error is exactly 0 at every checked tick", () => {
    const solver = new GGSolver({ dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 });
    for (let t = 0; t < 1000; t++) {
      solver.step();
      if (t % 50 === 0) {
        expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
      }
    }
    expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
    expect(solver.attachedCount).toBeGreaterThan(19);
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
