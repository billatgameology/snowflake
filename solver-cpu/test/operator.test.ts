// SurfaceOperator conformance + the cross-rule kernel identity (round-2 maker review,
// blockers 4 and 7). The interface is the §4.4 component-6 contract. The arbitrary-field
// kernel identity is retained specifically for legacy-v3 reproducibility; aggregate v4 has
// its own opposing-pixel zero-coefficient boundary-law tests.

import { describe, expect, it } from "vitest";
import { cellCount, randomUnit, GG_PRESETS, type Dims } from "@vcc/core";
import { GGSolver, LKSolver, type SurfaceOperator } from "@vcc/solver-cpu";

const dims: Dims = { nx: 24, ny: 24, nz: 14 };

describe("SurfaceOperator — both rules behind one contract (§4.4 component 6)", () => {
  it("GGSolver and LKSolver are SurfaceOperators and their ledgers state their claims", () => {
    const gg = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1, domain: "hexPrism" });
    const lk = new LKSolver({
      surfacePolicy: "aggregate-hv-g1h1-v4",
      dims,
      tempC: -5,
      sigmaInfinity: 0.01,
      dxUm: 0.35,
      rngSeed: 1,
    });
    const operators: SurfaceOperator[] = [gg, lk]; // compile-time conformance
    for (const op of operators) {
      const relax = op.relaxField();
      expect(relax.sweeps).toBeGreaterThanOrEqual(1);
      const surface = op.advanceSurface();
      expect(surface.attachedNow).toBeGreaterThanOrEqual(0);
      expect(surface.holeFillCount).toBeGreaterThanOrEqual(0);
    }
    const ggLedger = gg.ledger();
    expect(ggLedger.rule).toBe("GGThreshold");
    expect(ggLedger.totalMassBD).toBeGreaterThan(0);
    expect(ggLedger.fillLedgerIceCells).toBeNull();
    const lkLedger = lk.ledger();
    expect(lkLedger.rule).toBe("LibbrechtKinetics");
    expect(lkLedger.totalMassBD).toBeNull();
    expect(lkLedger.fillLedgerVaporUnits).toBe(
      (lkLedger.fillLedgerIceCells as number) * lk.mIceLedger,
    );
  });

  it("GGThreshold reports its 2a tick semantics: one sweep, no residual, no physical time", () => {
    const gg = new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1 });
    const relax = gg.relaxField();
    expect(relax.sweeps).toBe(1);
    expect(relax.residual).toBeNull();
    const surface = gg.advanceSurface();
    expect(surface.deltaTimeSeconds).toBeNull();
    expect(surface.maxKineticFillIncrement).toBeNull();
  });
});

describe("legacy-v3 cross-rule kernel identity", () => {
  it("one LK sweep with alphaHK ≡ 0 equals GGSolver's diffusion pass bitwise on an arbitrary field", () => {
    // Same hexPrism domain, same 19-site seed => identical blocked geometry. Fill both
    // fields with the same deterministic NONUNIFORM values, run exactly one pass of each
    // kernel with all surfaces reflecting (GG: its published rule; LK: alphaHK ≡ 0 and the
    // reflecting diagnostic mode so no Dirichlet clamp fires), compare every cell bitwise.
    const gg = new GGSolver({
      dims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    const lk = new LKSolver({
      surfacePolicy: "legacy-v3",
      dims,
      tempC: -5,
      sigmaInfinity: 0.01,
      dxUm: 0.35,
      rngSeed: 1,
      farField: "reflecting",
      relaxTol: 1e9, // any first-sweep residual "converges": exactly one sweep runs
      testAlphaOverride: () => 0,
    });
    const n = cellCount(dims);
    for (let x = 0; x < n; x++) {
      if (gg.a[x] === 1 || lk.wall[x] === 1) continue;
      const value = 0.05 + 0.05 * randomUnit(7, x, 0, 99);
      gg.d[x] = value;
      lk.sigma[x] = value;
    }
    gg.relaxField(); // reflecting: the published masked-average pass, nothing else
    const report = lk.relaxField();
    expect(report.sweeps).toBe(1);
    let compared = 0;
    for (let x = 0; x < n; x++) {
      expect(lk.sigma[x], `cell ${x}`).toBe(gg.d[x]);
      compared++;
    }
    expect(compared).toBe(n);
  });
});
