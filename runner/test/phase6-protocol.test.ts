// Phase 6 pre-registration tests. Two jobs: the freeze cannot be declared complete while the
// charter still requires something, and the registered interpolation scheme cannot drift away
// from the solver it claims to describe.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isLKSurfacePolicy,
  metersSmootherDrift,
  nucleationABasal,
  nucleationAPrism,
  sigma0Basal,
  sigma0Prism,
  sigmaWater,
  usesCanonicalOpposingOrder,
  type LKSurfacePolicy,
} from "../../core/src/index.ts";
import {
  phase6FreezeComplete,
  phase6MeasureInterpolationError,
  phase6PendingFreezeItems,
  phase6AmbiguityHalfWidthC,
  phase6ProtocolManifest,
  PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C,
  phase6SigmaWaterFromTable,
  PHASE6_FAR_FIELD,
  PHASE6_ENGINE_CONTROL,
  PHASE6_FREEZE_LIST,
  PHASE6_INTERPOLATION,
  PHASE6_INTERPOLATION_LEAVE_ONE_OUT,
  PHASE6_LATENT_HEATING,
  PHASE6_SIGMA0_ANCHORS_X,
  PHASE6_SIGMA_WATER_ANCHORS,
  PHASE6_SIGMA0_DIGITIZATION_BAND,
  PHASE6_SURFACE_POLICY,
} from "../src/phase6-protocol.ts";

describe("the Phase 6 freeze list", () => {
  it("carries every item the charter and its amendments name", () => {
    // Charter §3.2 Phase 6 item 1, expanded by ADR 0005 D4 and amended by 0006 and 0009. If a
    // row is ever dropped from the module, this test names the row that went missing.
    const required = [
      "t-sigma-grid",
      "habit-measurement-size",
      "metric-thresholds",
      "uncertainty-reporting",
      "boundary-ambiguity-band",
      "parameter-table",
      "parameter-interpolation",
      "pressure",
      "physical-seed-size",
      "noise-amplitude",
      "far-field",
      "domain-budgets",
      "dx",
      "surface-policy",
      "fill-cfl",
      "residual-tolerance",
      "div-tol",
      "relax-max-sweeps",
      "float-precision",
      "seed-ensemble-size",
      "code-version",
    ];
    const registered = PHASE6_FREEZE_LIST.map((item) => item.id);
    for (const id of required) expect(registered).toContain(id);
    // No duplicates, and every item states where its value comes from.
    expect(new Set(registered).size).toBe(registered.length);
    for (const item of PHASE6_FREEZE_LIST) {
      expect(item.requirement.length).toBeGreaterThan(0);
      expect(item.source.length).toBeGreaterThan(0);
      expect(item.status === "registered" ? item.value !== null : item.value === null).toBe(true);
    }
  });

  it("refuses to produce a protocol manifest while anything is pending", () => {
    // This is the fail-closed property: a sweep cannot quote a protocol hash the freeze has
    // not earned. WP0 is incomplete by construction today, so this must throw.
    expect(phase6FreezeComplete()).toBe(false);
    expect(phase6PendingFreezeItems().length).toBeGreaterThan(0);
    expect(() => phase6ProtocolManifest()).toThrow(/not frozen/);
    // The error names what is missing, so the failure is actionable rather than opaque.
    expect(() => phase6ProtocolManifest()).toThrow(/t-sigma-grid/);
  });

  it("has the conditions the charter fixes outright already registered", () => {
    const byId = new Map(PHASE6_FREEZE_LIST.map((item) => [item.id, item]));
    expect(byId.get("far-field")?.status).toBe("registered");
    expect(byId.get("far-field")?.value).toBe(PHASE6_FAR_FIELD);
    // ADR 0024 moved this off fixed-σ Dirichlet; the plan and the module must not drift apart.
    expect(PHASE6_FAR_FIELD).toBe("monopole-matched");
    expect(byId.get("surface-policy")?.status).toBe("registered");
    expect(PHASE6_SURFACE_POLICY).toBe("aggregate-hv-g1h1-v6");
  });

  it("registers the D6h-equivariant policy and departs from the runner default deliberately", () => {
    // Two separate hazards, pinned together.
    //
    // The first is the one this test originally caught: a calibration probe printed
    // `surfacePolicy=aggregate-hv-g1h1-v5` while the freeze list had registered ADR 0009's
    // `-v4`, which no run uses since ADRs 0013/0014 added the metered smoother-drift term.
    // Freezing a policy nothing runs is precisely the drift this list exists to catch.
    //
    // The second is WP0b's: v4 and v5 sum the Eq. 5.35 opposing-vapor operands in gather order,
    // which is not D6h-equivariant in float64, so a noise-off `symErr = 0` under them means
    // "did not stop mid-split" rather than "was symmetric". Phase 6 therefore registers ADR
    // 0023's v6 and must NAME it: the runner default stays v5 so Phase 2b replays unchanged.
    // Pinning both values keeps that difference deliberate instead of letting either drift.
    const runnerSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    const runnerDefault = /surfacePolicy:\s*"([a-z0-9-]+)"/.exec(runnerSource)?.[1];
    expect(runnerDefault).toBe("aggregate-hv-g1h1-v5");
    expect(PHASE6_SURFACE_POLICY).not.toBe(runnerDefault);
    expect(isLKSurfacePolicy(PHASE6_SURFACE_POLICY)).toBe(true);
    expect(usesCanonicalOpposingOrder(PHASE6_SURFACE_POLICY)).toBe(true);
    expect(usesCanonicalOpposingOrder(runnerDefault as LKSurfacePolicy)).toBe(false);
    // v6 keeps v5's divergence identity, so the drift evidence Phase 6 collects is the same.
    expect(metersSmootherDrift(PHASE6_SURFACE_POLICY)).toBe(true);
  });
});

describe("the near-boundary ambiguity band", () => {
  it("is still pending, because it cannot be set before the T grid is frozen", () => {
    const byId = new Map(PHASE6_FREEZE_LIST.map((item) => [item.id, item]));
    const band = byId.get("boundary-ambiguity-band");
    expect(band?.status).toBe("pending");
    expect(band?.group).toBe("comparison-design");
    expect(band?.value).toBeNull();
  });

  it("adds WP1's measured reference uncertainty to half the T-grid spacing", () => {
    expect(PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C).toBe(0.5);
    expect(phase6AmbiguityHalfWidthC(1)).toBeCloseTo(1.0, 12);
    expect(phase6AmbiguityHalfWidthC(2)).toBeCloseTo(1.5, 12);
    expect(phase6AmbiguityHalfWidthC(0.5)).toBeCloseTo(0.75, 12);
    // A finer grid can never shrink the band below what the REFERENCE itself cannot resolve.
    expect(phase6AmbiguityHalfWidthC(1e-6)).toBeGreaterThan(
      PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C,
    );
  });

  it("refuses a nonsensical grid spacing rather than returning a plausible band", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => phase6AmbiguityHalfWidthC(bad)).toThrow(/positive T-grid spacing/);
    }
  });
});

describe("the registered interpolation scheme", () => {
  it("is exact at every digitized anchor", () => {
    // Piecewise interpolation reproduces its anchors by construction; if this ever fails, the
    // anchor set in the protocol no longer matches the anchor set in the solver.
    for (const x of PHASE6_SIGMA0_ANCHORS_X) {
      expect(Number.isFinite(sigma0Basal(-x))).toBe(true);
      expect(Number.isFinite(sigma0Prism(-x))).toBe(true);
    }
    // Anchors are strictly increasing in (Tm − T) on both facets.
    for (let i = 1; i < PHASE6_SIGMA0_ANCHORS_X.length; i++) {
      const previous = PHASE6_SIGMA0_ANCHORS_X[i - 1] as number;
      const current = PHASE6_SIGMA0_ANCHORS_X[i] as number;
      expect(sigma0Basal(-current)).toBeGreaterThan(sigma0Basal(-previous));
      expect(sigma0Prism(-current)).toBeGreaterThan(sigma0Prism(-previous));
    }
  });

  it("is log-log linear between anchors, which is what the protocol registers", () => {
    // Sample the geometric midpoint of each interval and compare against the log-log linear
    // prediction. Exact agreement pins the scheme itself, not merely its endpoints.
    for (let i = 0; i < PHASE6_SIGMA0_ANCHORS_X.length - 1; i++) {
      const left = PHASE6_SIGMA0_ANCHORS_X[i] as number;
      const right = PHASE6_SIGMA0_ANCHORS_X[i + 1] as number;
      const middle = Math.sqrt(left * right);
      for (const at of [sigma0Basal, sigma0Prism]) {
        const predicted = Math.sqrt(at(-left) * at(-right));
        expect(at(-middle)).toBeCloseTo(predicted, 12);
      }
    }
    expect(PHASE6_INTERPOLATION.sigma0).toBe("piecewise-log-log-linear");
  });

  it("bans extrapolation at both ends of the digitized domain", () => {
    const { warmest, coldest } = PHASE6_INTERPOLATION.domainTempC;
    expect(warmest).toBe(-1);
    expect(coldest).toBe(-50);
    // Inside the domain: fine. Outside: refuses, rather than inventing physics.
    expect(() => sigma0Basal(warmest)).not.toThrow();
    expect(() => sigma0Basal(coldest)).not.toThrow();
    expect(() => sigma0Basal(-0.9)).toThrow(/outside the digitized domain/);
    expect(() => sigma0Prism(-50.1)).toThrow(/outside the digitized domain/);
    // This is a real constraint on the frozen T grid: the Nakaya diagram runs to 0 °C, and the
    // warmest temperature Phase 6 may sweep is −1 °C.
  });

  it("keeps A on its own registered scheme", () => {
    expect(PHASE6_INTERPOLATION.aBasal).toBe("constant-1");
    expect(nucleationABasal(-5, "CAK")).toBe(1);
    expect(nucleationABasal(-15, "CAK")).toBe(1);
    // A_prism is linear in (Tm − T), not log-log: it touches 1 and dips, so a log scheme is
    // wrong for it. Midpoint of [5, 10] must be the arithmetic mean of the endpoints.
    const predicted = (nucleationAPrism(-5, "CAK") + nucleationAPrism(-10, "CAK")) / 2;
    expect(nucleationAPrism(-7.5, "CAK")).toBeCloseTo(predicted, 12);
    // CAK_A1 is the flat-A set by definition.
    expect(nucleationAPrism(-5, "CAK_A1")).toBe(1);
  });

  it("registers an interpolation error the solver still reproduces", () => {
    // The justification for the scheme is measured, not asserted: leave-one-out error is
    // subdominant to the ±25% digitization band already carried on the anchors. Recomputing it
    // here from the live solver stops the registered number from drifting away from the code.
    const measured = phase6MeasureInterpolationError();
    expect(measured.basal).toBeCloseTo(PHASE6_INTERPOLATION_LEAVE_ONE_OUT.basal, 3);
    expect(measured.prism).toBeCloseTo(PHASE6_INTERPOLATION_LEAVE_ONE_OUT.prism, 3);
    expect(measured.basal).toBeLessThan(PHASE6_SIGMA0_DIGITIZATION_BAND);
    expect(measured.prism).toBeLessThan(PHASE6_SIGMA0_DIGITIZATION_BAND);
  });
});

describe("the water-saturation ladder reference", () => {
  it("uses printed Table 2.1 anchors, which an independent standard confirms", () => {
    // Murphy & Koop (2005) — not used by the solver, here only to referee the printed anchors.
    const mkIce = (T: number) =>
      Math.exp(9.550426 - 5723.265 / T + 3.53068 * Math.log(T) - 0.00728332 * T);
    const mkLiquid = (T: number) =>
      Math.exp(
        54.842763 - 6763.22 / T - 4.21 * Math.log(T) + 0.000367 * T +
          Math.tanh(0.0415 * (T - 218.8)) *
            (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T),
      );
    // Measured worst deviation is 1.78%, at the -1 C anchor; every anchor from -5 C to -40 C
    // agrees to within 0.5%. The two bounds are asserted separately so a regression at the warm
    // end cannot hide inside a single loose tolerance.
    for (const { tempC, sigmaWater } of PHASE6_SIGMA_WATER_ANCHORS) {
      if (tempC === 0) continue; // the anchor is exactly 0 by definition
      const kelvin = tempC + 273.15;
      const reference = (mkLiquid(kelvin) - mkIce(kelvin)) / mkIce(kelvin);
      const deviation = Math.abs(sigmaWater / reference - 1);
      expect(deviation).toBeLessThan(0.02);
      if (tempC <= -5) expect(deviation).toBeLessThan(0.005);
    }
  });

  it("is not the sigmaWater() difference form, which is unusable across the whole range", () => {
    // Two independent reasons the ladder does not call sigmaWater(), pinned so nobody
    // 'simplifies' the ladder back onto it.

    // 1. It goes negative, where water saturation over ice is strictly positive below 0 C. The
    //    crossing is at -1.969 C — NOT "about -3 C", as this file and phase6-protocol.ts both
    //    used to claim; it is positive at both -3 C and -2 C.
    expect(sigmaWater(-1)).toBeLessThan(0);
    expect(sigmaWater(-2)).toBeGreaterThan(0);
    expect(sigmaWater(-3)).toBeGreaterThan(0);
    let lo = -5;
    let hi = -0.001;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (sigmaWater(mid) > 0) lo = mid;
      else hi = mid;
    }
    expect(lo).toBeCloseTo(-1.969, 3);

    // 2. The disqualifying one: its error against the anchors is not an offset but a strong
    //    function of temperature, so a ladder built on it would make a fixed water-relative
    //    fraction mean wildly different physical fractions at different temperatures — the
    //    sweep's temperature axis would be confounded with a systematic spanning ~65x.
    const ratio = (T: number) => sigmaWater(T) / phase6SigmaWaterFromTable(T);
    expect(ratio(-2)).toBeLessThan(0.02);
    expect(ratio(-30)).toBeGreaterThan(0.95);
    expect(ratio(-30) / ratio(-2)).toBeGreaterThan(60);

    expect(phase6SigmaWaterFromTable(-1)).toBeGreaterThan(0);
    expect(phase6SigmaWaterFromTable(-1)).toBeCloseTo(0.01, 6);
  });

  it("interpolates between anchors and refuses to extrapolate", () => {
    // Exact at anchors.
    expect(phase6SigmaWaterFromTable(-15)).toBeCloseTo(0.157, 9);
    expect(phase6SigmaWaterFromTable(-2)).toBeCloseTo(0.02, 9);
    // Linear between them.
    expect(phase6SigmaWaterFromTable(-25)).toBeCloseTo((0.215 + 0.34) / 2, 9);
    // Monotone increasing as it gets colder.
    let previous = 0;
    for (let T = -1; T >= -40; T--) {
      const value = phase6SigmaWaterFromTable(T);
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
    expect(() => phase6SigmaWaterFromTable(0.5)).toThrow(/extrapolation is banned/);
    expect(() => phase6SigmaWaterFromTable(-40.5)).toThrow(/extrapolation is banned/);
  });
});

describe("the engine decision", () => {
  it("runs sweeps on the float64 oracle and demotes the GPU to a labelled diagnostic", () => {
    // Revised on measurement: the GPU is 6x slower at 28^3 and cannot satisfy the frozen
    // absolute divTol in sustained runs at all. It keeps a cross-check role at a relaxed,
    // separately-labelled tolerance, which is why it can never be a gate criterion.
    expect(PHASE6_ENGINE_CONTROL.sweepEngine).toBe("cpu-float64");
    expect(PHASE6_ENGINE_CONTROL.diagnosticEngine).toContain("relaxed");
    expect(PHASE6_ENGINE_CONTROL.comparedQuantity).toContain("habit-classification");
    // Control points are chosen with the grid, so this stays null until the grid is registered.
    expect(PHASE6_ENGINE_CONTROL.controlPoints).toBeNull();
    const floatItem = PHASE6_FREEZE_LIST.find((item) => item.id === "float-precision");
    expect(floatItem?.status).toBe("registered");
    expect(floatItem?.value).toContain("float64 CPU oracle");
    expect(floatItem?.value).toContain("never a gate criterion");
    // The source must carry WHY it was revised, so the retraction cannot quietly become a
    // preference: the measured numbers and the tolerance floor both belong in the record.
    expect(floatItem?.source).toContain("32.9 s");
    expect(floatItem?.source).toContain("below the float32 roundoff floor");
  });

  it("registers a cross-platform reproducibility control", () => {
    // Math.exp/log/pow are not specified to be correctly rounded and this solver depends on
    // them, so a habit class that differs between arm64 and x64 is a fragility finding.
    expect(PHASE6_ENGINE_CONTROL.reproducibilityControl).toContain("arm64");
    expect(PHASE6_ENGINE_CONTROL.reproducibilityControl).toContain("habit class");
  });
});

describe("the latent-heating decision", () => {
  it("is carried as a stated systematic rather than applied", () => {
    expect(PHASE6_LATENT_HEATING.treatment).toBe("stated-systematic");
    expect(PHASE6_LATENT_HEATING.applied).toBe(false);
    // Both printed anchors, and nothing invented between or beyond them.
    expect(PHASE6_LATENT_HEATING.anchors).toEqual([
      { tempC: -1, chi0: 0.8 },
      { tempC: -10, chi0: 0.4 },
    ]);
    expect(PHASE6_LATENT_HEATING.correctionIfApplied).toContain("1 + chi_0");
  });
});
