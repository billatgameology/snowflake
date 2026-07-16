// Phase 3 WP1 (plan phase-3-dev-visualization): the center-vs-rim depletion metric on a REAL
// solver, and the grow CLI printing it. These are machinery sanity checks, NOT the Phase 3
// gate — gate3 is a later work package, blocked on threshold registration in the plan.
//
// Placement note: the live-solver check needs GGSolver (@vcc/solver-cpu) and the core metric
// together; runner is the package that depends on both, and runner/test is WP1 territory.

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { centerRimDepletion, computeMetrics, GG_PRESETS } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const main = join(repoRoot, "runner", "src", "main.ts");

describe("center-vs-rim depletion on a live GGSolver (machinery check, not the gate)", () => {
  it("a growing hexPrism plate has a finite ratio < 1 (facet center more depleted)", () => {
    const solver = new GGSolver({
      dims: { nx: 48, ny: 48, nz: 24 },
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    // 400 ticks: past the seed transient, well before any stopping rule (the 2a canonical
    // plate ran 4800 ticks at 128^2 x 64). Deterministic on the pinned engine (noise off).
    // NOTE for threshold registration: the ratio SAWTOOTHS with top-layer nucleation — it
    // rises toward 1 just after a fresh top layer nucleates (kTop jumps, sampling follows)
    // and falls as the layer spreads; 400 lands mid-spread (ratio ~0.58 observed).
    for (let t = 0; t < 400; t++) solver.step();
    const { dims, center } = solver;
    expect(solver.attachedCount).toBeGreaterThan(19); // it actually grew; not a seed-only run

    const dep = centerRimDepletion(solver.a, solver.d, dims, center, solver.wall);
    expect(Number.isFinite(dep.depletionCenter)).toBe(true);
    expect(Number.isFinite(dep.depletionRim)).toBe(true);
    expect(Number.isFinite(dep.depletionRatio)).toBe(true);
    expect(dep.depletionRatio).toBeGreaterThan(0);
    expect(dep.depletionRatio).toBeLessThan(1);

    // The Metrics bundle carries the same three numbers: same function, same wall array.
    const m = computeMetrics(
      solver.a, solver.b, solver.d, dims, center, solver.tick, solver.farFieldMean(),
      solver.wall,
    );
    expect(m.depletionCenter).toBe(dep.depletionCenter);
    expect(m.depletionRim).toBe(dep.depletionRim);
    expect(m.depletionRatio).toBe(dep.depletionRatio);
  });

  it("without the wall mask a hexPrism run would misreport: walls must not enter the rim mean", () => {
    // Differential, non-vacuous: on a hexPrism domain whose plate has NOT reached the walls,
    // masked and unmasked agree (walls are far away); this pins that passing the wall array
    // is at worst harmless mid-domain. The wall-matters cases are the core unit fixtures.
    const solver = new GGSolver({
      dims: { nx: 24, ny: 24, nz: 12 },
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    for (let t = 0; t < 150; t++) solver.step();
    const withWall = centerRimDepletion(
      solver.a, solver.d, solver.dims, solver.center, solver.wall,
    );
    const withoutWall = centerRimDepletion(solver.a, solver.d, solver.dims, solver.center);
    expect(Number.isFinite(withWall.depletionRatio)).toBe(true);
    expect(withWall.depletionRatio).toBe(withoutWall.depletionRatio);
  });
});

describe("grow CLI prints the depletion fields (additive; existing fields untouched)", () => {
  it("light and full metrics lines carry depCenter/depRim/depRatio", () => {
    const result = spawnSync(
      "node",
      [
        main, "grow", "--preset", "plate", "--dims", "24,24,12", "--ticks", "100",
        "--seed", "1", "--metrics-every", "50", "--full-metrics-every", "100",
      ],
      { encoding: "utf8", cwd: repoRoot },
    );
    const output = result.stdout + result.stderr;
    expect(result.status).toBe(0);

    // Light line (metrics-every cadence): new fields present, existing fields intact.
    const light = output.split("\n").find((line) => line.startsWith("tick=50 "));
    expect(light).toBeDefined();
    expect(light).toMatch(/ depCenter=\S+ depRim=\S+ depRatio=\S+ /);
    expect(light).toMatch(/ boundary=\d+ /);
    expect(light).toMatch(/ farField=\S+ /);
    expect(light).toMatch(/ deltaSym=(true|false) elapsed=/);

    // Full-metrics and final lines (printFullMetrics): new fields appended after the
    // existing ones, which stay in place.
    for (const prefix of ["metrics tick=100 ", "final tick="]) {
      const line = output.split("\n").find((l) => l.startsWith(prefix));
      expect(line, prefix).toBeDefined();
      expect(line, prefix).toMatch(
        /domainContact=(true|false) depCenter=\S+ depRim=\S+ depRatio=\S+$/,
      );
    }

    // The printed ratio is a real number here, not NaN (a crystal is growing mid-domain).
    const finalLine = output.split("\n").find((l) => l.startsWith("final tick=")) as string;
    const ratio = Number(/depRatio=(\S+)$/.exec(finalLine)?.[1]);
    expect(Number.isFinite(ratio)).toBe(true);
  });
});
