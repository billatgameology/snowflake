// Diffusion-step verification (plan, Stage 2a; strengthened 2026-07-15).
//
// The diffusion operator is the machinery's heart: (1a) in-plane 7-point average, (1b)
// vertical 4/7 + 3/14 blend, reflecting at blocked (attached/wall) cells and domain faces
// (gg-machinery §4.i). These tests pin it to hand-computed values, not to itself:
//   1. the uniform field is a fixed point (exact in real arithmetic; <= 1 ulp/cell in f64);
//   2. a single-cell impulse spreads with the exact 1/7 and 4/7, 3/14 weights — expected
//      values hand-derived one and two ticks out (derivations inline);
//   3. the reflecting rule conserves total mass exactly at faces, edges, corners, and
//      around attached cells;
//   4. the impulse response is D6h-symmetric, bitwise — with and without a crystal in the
//      field (the canonical pair summation, solver header decision 2).
//
// To exercise diffusion in isolation, these tests call SurfaceOperator.relaxField() directly.
// That is exactly one published G-G diffusion pass and avoids constructing physically invalid
// "inert" surface parameters merely to make step() degenerate to diffusion.

import { describe, expect, it } from "vitest";
import {
  cellCount,
  coordsOf,
  domainCenter,
  idx,
  mirror,
  rot60,
  totalMass,
  zmirror,
  GG_PRESETS,
  type Dims,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";

describe("diffusion — uniform fixed point", () => {
  it("one tick moves no cell by more than 2 ulp (exact in real arithmetic)", () => {
    // Real arithmetic: (1a) at a free interior cell gives (rho + 6*rho)/7 = rho, and (1b)
    // gives (4/7)*rho + (3/14)*(2*rho) = rho; the reflecting substitution replaces neighbor
    // terms with own = rho, so faces/edges/corners are identical. In f64 the pair-sum then
    // divide-by-7 rounding can move a cell by up to 2 ulp of rho (observed: exactly 2 ulp at
    // rho=0.1, where 0.1+0.2 rounds up; bitwise-exact 0 at 0.095 and 0.13).
    for (const rho of [0.1, 0.095, 0.13]) {
      const solver = new GGSolver({
        dims: { nx: 20, ny: 18, nz: 10 },
        params: { ...GG_PRESETS.plate, rho },
        rngSeed: 1,
        seedRadius: null,
      });
      const before = Float64Array.from(solver.d);
      solver.step();
      let maxAbs = 0;
      for (let x = 0; x < before.length; x++) {
        const dd = Math.abs(solver.d[x] - before[x]);
        if (dd > maxAbs) maxAbs = dd;
      }
      const ulpOfRho = 2 ** (Math.floor(Math.log2(rho)) - 52);
      expect(maxAbs).toBeLessThanOrEqual(2 * ulpOfRho);
    }
  });
});

describe("diffusion — single-cell impulse, hand-computed weights", () => {
  // Impulse of mass 1 at the center c of an otherwise-empty field, no crystal, walls far
  // away. Hand derivation, tick 1:
  //   (1a) plane k=0: c and its 6 T-neighbors each hold 1/7. Other planes: 0.
  //   (1b) k=0: (4/7)(1/7) = 4/49 at those 7 cells; k=+-1: (3/14)(1/7) = 3/98 at the 7
  //        cells directly above/below them.  Check: 7*(4/49) + 14*(3/98) = 4/7 + 3/7 = 1.
  // Tick 2 (values needed below; g = (1a) output of tick 2):
  //   g(c, k=0)      = (1/7)(4/49 + 6*4/49)  = 4/49
  //   g(ring1, k=0)  = (1/7)(4*4/49)         = 16/343   (own + center + 2 ring-1 sides)
  //   g(c, k=+-1)    = (1/7)(3/98 + 6*3/98)  = 3/98
  //   g(ring1,k=+-1) = (1/7)(4*3/98)         = 6/343
  //   d2(c)          = (4/7)(4/49)   + (3/14)(3/98 + 3/98)   = 41/686
  //   d2(ring1)      = (4/7)(16/343) + (3/14)(6/343 + 6/343) = 82/2401
  //   d2(ring2 vertex, e.g. (2,0)): g = (1/7)(4/49) = 4/343 (touches ring-1 only at (1,0));
  //     k=+-1: (1/7)(3/98) = 3/686;  d2 = (4/7)(4/343) + (3/14)(2*3/686) = 41/4802
  //   d2(ring2 edge, e.g. (1,1)):   g = (1/7)(2*4/49) = 8/343 (touches (1,0) and (0,1));
  //     k=+-1: (1/7)(2*3/98) = 3/343; d2 = (4/7)(8/343) + (3/14)(2*3/343) = 41/2401
  //   d2(c +- e3):   g = 3/98; below: 4/49, above (k=+-2 plane): 0
  //     d2 = (4/7)(3/98) + (3/14)(4/49) = 12/343
  //   d2(c +- 2e3):  g = 0; (3/14)(3/98) = 9/1372
  const dims: Dims = { nx: 24, ny: 24, nz: 12 };
  const [ic, jc, kc] = domainCenter(dims);

  function impulseSolver(): GGSolver {
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1, seedRadius: null });
    solver.d.fill(0);
    solver.d[idx(dims, ic, jc, kc)] = 1;
    return solver;
  }

  it("tick 1: 4/49 on the in-plane 7-cell support, 3/98 on the planes above and below", () => {
    const solver = impulseSolver();
    solver.relaxField();
    const ring1 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]] as const;
    expect(solver.d[idx(dims, ic, jc, kc)]).toBeCloseTo(4 / 49, 15);
    for (const [di, dj] of ring1) {
      expect(solver.d[idx(dims, ic + di, jc + dj, kc)]).toBeCloseTo(4 / 49, 15);
      expect(solver.d[idx(dims, ic + di, jc + dj, kc + 1)]).toBeCloseTo(3 / 98, 15);
      expect(solver.d[idx(dims, ic + di, jc + dj, kc - 1)]).toBeCloseTo(3 / 98, 15);
    }
    expect(solver.d[idx(dims, ic, jc, kc + 1)]).toBeCloseTo(3 / 98, 15);
    expect(solver.d[idx(dims, ic, jc, kc - 1)]).toBeCloseTo(3 / 98, 15);
    // Outside the one-tick light cone: exactly zero.
    expect(solver.d[idx(dims, ic + 2, jc, kc)]).toBe(0);
    expect(solver.d[idx(dims, ic + 1, jc + 1, kc)]).toBe(0);
    expect(solver.d[idx(dims, ic, jc, kc + 2)]).toBe(0);
    expect(totalMass(solver.b, solver.d)).toBeCloseTo(1, 15);
  });

  it("tick 2: hand-computed values at center, both ring-2 cell types, and the z-column", () => {
    const solver = impulseSolver();
    solver.relaxField();
    solver.relaxField();
    expect(solver.d[idx(dims, ic, jc, kc)]).toBeCloseTo(41 / 686, 15);
    expect(solver.d[idx(dims, ic + 1, jc, kc)]).toBeCloseTo(82 / 2401, 15);
    expect(solver.d[idx(dims, ic + 2, jc, kc)]).toBeCloseTo(41 / 4802, 15); // ring-2 vertex
    expect(solver.d[idx(dims, ic + 1, jc + 1, kc)]).toBeCloseTo(41 / 2401, 15); // ring-2 edge
    expect(solver.d[idx(dims, ic, jc, kc + 1)]).toBeCloseTo(12 / 343, 15);
    expect(solver.d[idx(dims, ic, jc, kc - 1)]).toBeCloseTo(12 / 343, 15);
    expect(solver.d[idx(dims, ic, jc, kc + 2)]).toBeCloseTo(9 / 1372, 15);
    expect(solver.d[idx(dims, ic, jc, kc - 2)]).toBeCloseTo(9 / 1372, 15);
    expect(solver.d[idx(dims, ic + 3, jc, kc)]).toBe(0); // outside the two-tick light cone
    expect(totalMass(solver.b, solver.d)).toBeCloseTo(1, 15);
  });
});

describe("diffusion — reflecting boundary conserves mass exactly", () => {
  const dims: Dims = { nx: 20, ny: 18, nz: 10 };

  it.each([
    ["corner", 0, 0, 0],
    ["edge", 0, 0, 5],
    ["face", 0, 9, 5],
    ["interior control", 10, 9, 5],
  ])("impulse at a domain %s keeps total mass 1 over 8 ticks", (_label, i, j, k) => {
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1, seedRadius: null });
    solver.d.fill(0);
    solver.d[idx(dims, i, j, k)] = 1;
    for (let t = 0; t < 8; t++) {
      solver.relaxField();
      expect(totalMass(solver.b, solver.d)).toBeCloseTo(1, 14);
    }
  });

  it("impulse beside an attached crystal keeps total mass exact; nothing leaks into it", () => {
    const solver = new GGSolver({
      dims: { nx: 24, ny: 24, nz: 12 },
      params: GG_PRESETS.plate,
      rngSeed: 1,
    });
    const [ic, jc, kc] = solver.center;
    const d = solver.d;
    d.fill(0);
    d[idx(solver.dims, ic + 3, jc, kc)] = 1; // touches the seed's boundary ring
    const m0 = totalMass(solver.b, d); // 19 seed cells at b=1, plus the impulse
    expect(m0).toBeCloseTo(20, 14);
    for (let t = 0; t < 10; t++) solver.relaxField();
    expect(totalMass(solver.b, solver.d)).toBeCloseTo(20, 13);
    expect(solver.attachedCount).toBe(19); // relaxField() cannot perform surface attachment
    for (let x = 0; x < cellCount(solver.dims); x++) {
      if (solver.a[x] === 1) expect(solver.d[x]).toBe(0); // reflecting, not absorbing
    }
  });

  it("hexPrism walls conserve mass under the full plate cycle (500 ticks)", () => {
    const solver = new GGSolver({
      dims: { nx: 32, ny: 32, nz: 16 },
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    const m0 = totalMass(solver.b, solver.d);
    for (let t = 0; t < 500; t++) solver.step();
    const drift = Math.abs(totalMass(solver.b, solver.d) - m0) / m0;
    expect(drift).toBeLessThan(1e-11);
  });
});

describe("diffusion — D6h-symmetric impulse response (bitwise)", () => {
  // Bitwise, not approximate: the canonical pair summation (solver header, decision 2)
  // makes symmetric cells round identically, which is what the 2a gate's "exactly 0"
  // stands on. Checked over every cell; an image outside the domain must mean the cell
  // itself is still 0 (the light cone has not reached the walls).
  function expectBitwiseD6h(
    d: Float64Array,
    dims: Dims,
    center: readonly [number, number, number],
  ): void {
    const [ic, jc, kc] = center;
    const n = cellCount(dims);
    for (let x = 0; x < n; x++) {
      const [i, j, k] = coordsOf(dims, x);
      const images: Array<[number, number, number]> = [];
      const [ri, rj] = rot60(i, j, ic, jc);
      images.push([ri, rj, k]);
      const [mi, mj] = mirror(i, j, ic, jc);
      images.push([mi, mj, k]);
      images.push([i, j, zmirror(k, kc)]);
      for (const [pi, pj, pk] of images) {
        if (pi < 0 || pi >= dims.nx || pj < 0 || pj >= dims.ny || pk < 0 || pk >= dims.nz) {
          expect(d[x]).toBe(0);
        } else {
          expect(d[idx(dims, pi, pj, pk)]).toBe(d[x]);
        }
      }
    }
  }

  it("crystal-free: 4 ticks from a centered impulse", () => {
    const dims: Dims = { nx: 24, ny: 24, nz: 12 };
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1, seedRadius: null });
    const center = solver.center;
    solver.d.fill(0);
    solver.d[idx(dims, center[0], center[1], center[2])] = 1;
    for (let t = 0; t < 4; t++) solver.relaxField();
    expectBitwiseD6h(solver.d, dims, center);
  });

  it("with the 19-site seed reflecting: 6 ticks from a D6h-symmetric impulse pair", () => {
    // nz must be ODD here: the light cone reaches the z-walls within 6 ticks, and an even
    // nz has no center plane (kc sits closer to one z-wall) — the same geometry that makes
    // the box domain fail the symmetry gate. With nz = 13 both walls sit 6 layers from kc,
    // so the reflections themselves are zmirror-symmetric.
    const dims: Dims = { nx: 24, ny: 24, nz: 13 };
    const solver = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1 });
    const [ic, jc, kc] = solver.center;
    solver.d.fill(0);
    // The pair (c + 2e3, c - 2e3) is invariant under rot60 and mirror (on the axis) and
    // under zmirror (swapped) — a D6h-symmetric initial field over a D6h-symmetric crystal.
    solver.d[idx(dims, ic, jc, kc + 2)] = 0.5;
    solver.d[idx(dims, ic, jc, kc - 2)] = 0.5;
    for (let t = 0; t < 6; t++) solver.relaxField();
    expect(solver.attachedCount).toBe(19);
    expectBitwiseD6h(solver.d, dims, solver.center);
  });
});
