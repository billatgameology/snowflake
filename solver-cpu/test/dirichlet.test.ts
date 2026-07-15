// The Dirichlet far-field gate, STRENGTHENED form (plan, Done when / Stage 2b steps): the
// charter's literal phrasing ("a crystal-free run holds sigma at the set value") is vacuous
// from a uniform start — a uniform field is a fixed point under BOTH boundary conditions.
// The falsifiable version is the depleted-start DIFFERENTIAL test: start crystal-free at
// HALF the set value; under Dirichlet the field must climb back to the set value everywhere;
// under reflecting, the identical run must conserve mass and settle at the depleted mean.
// The differential is what proves the two conditions are different code paths.

import { describe, expect, it } from "vitest";
import { cellCount, totalMass, GG_PRESETS, type Dims } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";

const dims: Dims = { nx: 24, ny: 24, nz: 12 };

function depletedSolver(farField: "reflecting" | "dirichlet"): GGSolver {
  const solver = new GGSolver({
    dims,
    params: GG_PRESETS.plate, // rho = 0.1 is the set value the Dirichlet shell holds
    rngSeed: 1,
    seedRadius: null, // crystal-free
    farField,
  });
  solver.d.fill(GG_PRESETS.plate.rho / 2); // depleted start: half the set value
  return solver;
}

function runToStationary(solver: GGSolver, maxTicks: number): number {
  const n = cellCount(dims);
  const before = new Float64Array(n);
  for (let t = 0; t < maxTicks; t++) {
    before.set(solver.d);
    solver.step();
    let maxChange = 0;
    for (let x = 0; x < n; x++) {
      const c = Math.abs(solver.d[x] - before[x]);
      if (c > maxChange) maxChange = c;
    }
    if (maxChange < 1e-12) return t + 1;
  }
  return maxTicks;
}

describe("far-field boundary conditions — the depleted-start differential (plan gate)", () => {
  const rho = GG_PRESETS.plate.rho;

  it("Dirichlet: the field climbs back to the set value everywhere (max|d - rho| < 1e-6)", () => {
    const solver = depletedSolver("dirichlet");
    const ticks = runToStationary(solver, 20_000);
    expect(ticks).toBeLessThan(20_000); // reached stationarity, not the cap
    const n = cellCount(dims);
    let maxDev = 0;
    for (let x = 0; x < n; x++) {
      const dev = Math.abs(solver.d[x] - rho);
      if (dev > maxDev) maxDev = dev;
    }
    expect(maxDev).toBeLessThan(1e-6);
    // The injected mass is metered, and it equals the field's gain (books balance).
    const gained = totalMass(solver.b, solver.d) - (rho / 2) * n;
    expect(Math.abs(solver.dirichletMeter - gained) / gained).toBeLessThan(1e-9);
  });

  it("reflecting: the IDENTICAL run conserves mass and settles at the depleted mean", () => {
    const solver = depletedSolver("reflecting");
    const n = cellCount(dims);
    const m0 = totalMass(solver.b, solver.d);
    runToStationary(solver, 20_000);
    const drift = Math.abs(totalMass(solver.b, solver.d) - m0) / m0;
    expect(drift).toBeLessThan(1e-12); // conserved — no source snuck in
    expect(solver.dirichletMeter).toBe(0);
    // Settled at the depleted mean, NOT at the set value — the differential.
    let maxDevFromDepleted = 0;
    for (let x = 0; x < n; x++) {
      const dev = Math.abs(solver.d[x] - rho / 2);
      if (dev > maxDevFromDepleted) maxDevFromDepleted = dev;
    }
    expect(maxDevFromDepleted).toBeLessThan(1e-9);
  });

  it("a grown Dirichlet run records its condition in checkpoint metadata (charter §2.4)", () => {
    const solver = new GGSolver({
      dims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      farField: "dirichlet",
    });
    for (let t = 0; t < 50; t++) solver.step();
    expect(solver.state().farField).toBe("dirichlet");
    expect(solver.attachedCount).toBeGreaterThanOrEqual(19);
  });
});
