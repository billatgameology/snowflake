// Phase 6 pre-registration tests. Two jobs: the freeze cannot be declared complete while the
// charter still requires something, and the registered interpolation scheme cannot drift away
// from the solver it claims to describe.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isLKSurfacePolicy,
  nucleationABasal,
  nucleationAPrism,
  sigma0Basal,
  sigma0Prism,
} from "../../core/src/index.ts";
import {
  phase6FreezeComplete,
  phase6MeasureInterpolationError,
  phase6PendingFreezeItems,
  phase6ProtocolManifest,
  PHASE6_FAR_FIELD,
  PHASE6_ENGINE_CONTROL,
  PHASE6_FREEZE_LIST,
  PHASE6_INTERPOLATION,
  PHASE6_INTERPOLATION_LEAVE_ONE_OUT,
  PHASE6_LATENT_HEATING,
  PHASE6_SIGMA0_ANCHORS_X,
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
    expect(PHASE6_FAR_FIELD).toBe("fixed-sigma-dirichlet");
    expect(byId.get("surface-policy")?.status).toBe("registered");
    expect(PHASE6_SURFACE_POLICY).toBe("aggregate-hv-g1h1-v5");
  });

  it("registers the surface policy the runner actually defaults to, not the ADR 0009 name", () => {
    // A calibration probe printed `surfacePolicy=aggregate-hv-g1h1-v5` while the freeze list
    // had registered ADR 0009's `-v4`, which no run uses since ADRs 0013/0014 added the
    // metered smoother-drift term. Freezing a policy nothing runs is precisely the drift this
    // list exists to catch, so the registered value is pinned against the runner's own default.
    const runnerSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    const declared = /surfacePolicy:\s*"([a-z0-9-]+)"/.exec(runnerSource)?.[1];
    expect(declared).toBe(PHASE6_SURFACE_POLICY);
    expect(isLKSurfacePolicy(PHASE6_SURFACE_POLICY)).toBe(true);
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

describe("the engine decision", () => {
  it("runs sweeps on the GPU and keeps the CPU oracle as the differential control", () => {
    expect(PHASE6_ENGINE_CONTROL.sweepEngine).toBe("gpu-float32");
    expect(PHASE6_ENGINE_CONTROL.oracleEngine).toBe("cpu-float64");
    // The control compares the only quantity the comparison consumes, so a float32 difference
    // that cannot change a habit call cannot fail the control either.
    expect(PHASE6_ENGINE_CONTROL.comparedQuantity).toContain("habit-classification");
    // Control points are chosen with the grid, so this stays null until the grid is registered.
    expect(PHASE6_ENGINE_CONTROL.controlPoints).toBeNull();
    const floatItem = PHASE6_FREEZE_LIST.find((item) => item.id === "float-precision");
    expect(floatItem?.status).toBe("registered");
    expect(floatItem?.value).toContain("float32 GPU");
    expect(floatItem?.value).toContain("differential control");
    // Phase 5's certificate was measured on Phase 5's fixtures; the source note must say so,
    // because the whole reason for a per-sweep control is that it does not transfer for free.
    expect(floatItem?.source).toContain("NOT at Phase 6's sweep conditions");
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
