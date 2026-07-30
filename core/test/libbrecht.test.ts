// Parameter-module validation against the sources' own numbers (libbrecht-parameters.md).
// The closed forms are Arrhenius fits the monograph calls approximate; tolerances below are
// therefore validation bands, not float tolerances, and each test names its anchor's source.

import { describe, expect, it } from "vitest";
import {
  alphaHK,
  cSat,
  classifyFacet,
  type FacetClass,
  isLKSurfacePolicy,
  kineticLength,
  mIce,
  nucleationAPrism,
  pSatIce,
  pecletUpperBound,
  sigma0Basal,
  M1_DOMAIN_MAGNITUDE_C,
  sigma0BasalFor,
  sigma0BasalM1,
  sigma0BasalM2Broad,
  sigma0Prism,
  sigma0PrismFor,
  sigma0PrismM1,
  sigma0PrismM2Broad,
  sigmaWater,
  vKin,
} from "@vcc/core";

// Monograph Table 2.1 anchors (printed p. 57 / pdf 58), transcribed in
// docs/libbrecht-parameters.md §5. [T C, P_ice mbar, c_sat #/m^3, sigma_water, v_kin um/s, X0 um]
const TABLE_2_1: Array<[number, number, number, number, number, number]> = [
  [0, 6.11, 1.62e23, 0.0, 747.4, 0.141],
  [-1, 5.62, 1.5e23, 0.01, 689.4, 0.141],
  [-2, 5.17, 1.38e23, 0.02, 635.5, 0.141],
  [-5, 4.01, 1.08e23, 0.05, 495.9, 0.142],
  [-10, 2.6, 7.15e22, 0.102, 323.8, 0.144],
  [-15, 1.65, 4.63e22, 0.157, 207.9, 0.145],
  [-20, 1.03, 2.95e22, 0.215, 131.2, 0.146],
  [-30, 0.38, 1.13e22, 0.34, 49.3, 0.149],
  [-40, 0.13, 3.99e21, 0.474, 17.0, 0.153],
];

function relErr(computed: number, anchor: number): number {
  return Math.abs(computed - anchor) / Math.abs(anchor);
}

describe("closed forms vs monograph Table 2.1 anchors", () => {
  it("p_ice within 3% (Arrhenius fit accuracy)", () => {
    for (const [tC, pIceMbar] of TABLE_2_1) {
      expect(relErr(pSatIce(tC) / 100, pIceMbar), `T=${tC}`).toBeLessThan(0.03);
    }
  });

  it("c_sat within 3%", () => {
    for (const [tC, , cSatAnchor] of TABLE_2_1) {
      expect(relErr(cSat(tC), cSatAnchor), `T=${tC}`).toBeLessThan(0.03);
    }
  });

  it("v_kin within 3% (1.2% observed at -15 C — the table's cross-check)", () => {
    for (const [tC, , , , vKinUmS] of TABLE_2_1) {
      expect(relErr(vKin(tC), vKinUmS * 1e-6), `T=${tC}`).toBeLessThan(0.03);
    }
  });

  it("X_0 at 1 atm within 3% (0.145 um at -15 C)", () => {
    for (const [tC, , , , , x0Um] of TABLE_2_1) {
      expect(relErr(kineticLength(tC, 101325), x0Um * 1e-6), `T=${tC}`).toBeLessThan(0.03);
    }
  });

  it("sigma_water: the fit-difference form works only away from melting — the RECORDED limit", () => {
    // libbrecht-parameters.md §5: sigma_water comes from the DIFFERENCE of two approximate
    // Arrhenius fits, which amplifies their individual ~1% errors without bound as the
    // difference shrinks toward 0 C — at -1 C the form even goes NEGATIVE (-0.009146
    // computed, vs the table's +0.010). Pinned here so the limitation cannot silently
    // un-happen; sigma_water is a source-side plausibility reference, not an enforced runtime
    // ceiling or a dynamical input.
    expect(sigmaWater(-1)).toBeCloseTo(-0.009146, 5); // the near-melting breakdown, pinned
    expect(relErr(sigmaWater(-10), 0.102)).toBeGreaterThan(0.15); // ~20% off at -10, pinned
    // Measured deviations of the difference form: -15: 12.8%, -20: 8.8%, -30: 4.6%, -40: 2.0%
    for (const [tC, , , sigmaW] of TABLE_2_1) {
      if (tC > -15) continue; // region where the difference form is merely poor, not broken
      expect(relErr(sigmaWater(tC), sigmaW), `T=${tC}`).toBeLessThan(0.14);
    }
    expect(relErr(sigmaWater(-15), 0.157)).toBeGreaterThan(0.05); // the known ~13% case
  });

  it("M_ice ~ 6.7e5 at -15 C (attachment-kinetics §4.4 component 4)", () => {
    expect(mIce(-15)).toBeGreaterThan(6.4e5);
    expect(mIce(-15)).toBeLessThan(7.1e5);
  });
});

describe("digitized sigma_0 / A anchors (monograph Fig. 4.5; P2, ±25%)", () => {
  it("reproduces the anchor values exactly at anchor abscissae", () => {
    expect(sigma0Basal(-15)).toBeCloseTo(0.024, 10);
    expect(sigma0Prism(-15)).toBeCloseTo(0.032, 10);
    expect(sigma0Basal(-5)).toBeCloseTo(0.007, 10);
    expect(sigma0Prism(-5)).toBeCloseTo(0.0027, 10);
    expect(nucleationAPrism(-5, "CAK")).toBeCloseTo(0.18, 10);
    expect(nucleationAPrism(-5, "CAK_A1")).toBe(1);
  });

  it("text anchor: sigma_0_prism(-15) = 3 percent (monograph pdf 145) within digitization band", () => {
    expect(relErr(sigma0Prism(-15), 0.03)).toBeLessThan(0.25);
  });

  it("the sigma_0 crossing sits between -5 and -15 (CAK curves cross at (Tm-T) ≈ 9-10)", () => {
    expect(sigma0Basal(-5)).toBeGreaterThan(sigma0Prism(-5)); // warm side: basal reluctant
    expect(sigma0Basal(-15)).toBeLessThan(sigma0Prism(-15)); // cold side: prism reluctant
  });

  it("throws outside the digitized domain instead of extrapolating", () => {
    expect(() => sigma0Basal(-0.5)).toThrow(/outside the digitized domain/);
    expect(() => sigma0Basal(-55)).toThrow(/outside the digitized domain/);
  });
});

describe("alphaHK and versioned surface classification (ADR 0009)", () => {
  it("recognizes exactly the four coupled LK surface policies", () => {
    expect(isLKSurfacePolicy("legacy-v3")).toBe(true);
    expect(isLKSurfacePolicy("aggregate-hv-g1h1-v4")).toBe(true);
    expect(isLKSurfacePolicy("aggregate-hv-g1h1-v5")).toBe(true);
    // ADR 0023: v5 with the Eq. 5.35 opposing-vapor operands summed in ascending value order,
    // which is what makes the boundary operator D6h-equivariant in float64.
    expect(isLKSurfacePolicy("aggregate-hv-g1h1-v6")).toBe(true);
    for (const value of [undefined, null, "", "v4", "aggregate-hv-g1h1-v7", 1, {}]) {
      expect(isLKSurfacePolicy(value), String(value)).toBe(false);
    }
  });

  it("classifies v6 exactly as v4/v5 do: ADR 0023 changed summation order, not the table", () => {
    for (let rawNT = 0; rawNT <= 6; rawNT++) {
      for (let rawNZ = 0; rawNZ <= 2; rawNZ++) {
        if (rawNT === 0 && rawNZ === 0) continue;
        expect(classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v6")).toBe(
          classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v5"),
        );
      }
    }
  });

  it("classifies all 21 raw count slots under aggregate-hv-g1h1-v4", () => {
    const expected: ReadonlyArray<ReadonlyArray<FacetClass | null>> = [
      [null, "basal", "basal"],
      ["inhibited", "rough", "rough"],
      ["prism", "rough", "rough"],
      ["rough", "rough", "rough"],
      ["rough", "rough", "rough"],
      ["rough", "rough", "rough"],
      ["rough", "rough", "rough"],
    ];

    for (let rawNT = 0; rawNT <= 6; rawNT++) {
      for (let rawNZ = 0; rawNZ <= 2; rawNZ++) {
        const label = `[${rawNT}${rawNZ}]`;
        const wanted = expected[rawNT]?.[rawNZ];
        if (wanted === null) {
          expect(
            () => classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v4"),
            label,
          ).toThrow(/not a boundary/);
        } else {
          expect(
            classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v4"),
            label,
          ).toBe(wanted);
        }
      }
    }
  });

  it("keeps aggregate-v5 facet classification identical to aggregate-v4", () => {
    for (let rawNT = 0; rawNT <= 6; rawNT++) {
      for (let rawNZ = 0; rawNZ <= 2; rawNZ++) {
        if (rawNT === 0 && rawNZ === 0) continue;
        expect(classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v5")).toBe(
          classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v4"),
        );
      }
    }
  });

  it("preserves the executed legacy-v3 cases behind its explicit policy", () => {
    expect(classifyFacet(0, 1, "legacy-v3")).toBe("basal");
    expect(classifyFacet(0, 2, "legacy-v3")).toBe("basal");
    expect(classifyFacet(1, 0, "legacy-v3")).toBe("prism");
    expect(classifyFacet(2, 0, "legacy-v3")).toBe("rough");
    expect(classifyFacet(1, 1, "legacy-v3")).toBe("rough");
    expect(classifyFacet(3, 1, "legacy-v3")).toBe("rough");
    expect(() => classifyFacet(0, 0, "legacy-v3")).toThrow(/not a boundary/);
  });

  it("rejects invalid raw counts and unknown runtime policies", () => {
    for (const [rawNT, rawNZ] of [
      [-1, 0],
      [7, 0],
      [1.5, 0],
      [Number.NaN, 1],
      [1, -1],
      [1, 3],
      [1, 0.5],
      [1, Number.POSITIVE_INFINITY],
    ]) {
      expect(
        () => classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v4"),
        `[${String(rawNT)}${String(rawNZ)}]`,
      ).toThrow(/raw n[tz]/i);
    }
    expect(() => classifyFacet(1, 0, "unknown" as "legacy-v3")).toThrow(
      /unknown LK surface policy/,
    );
  });

  it("inhibited sites stay zero; rough sites are barrier-free; facets are suppressed", () => {
    expect(alphaHK("inhibited", -15, 0.001, "CAK_A1")).toBe(0);
    expect(alphaHK("inhibited", -5, 0.01, "CAK")).toBe(0);
    expect(alphaHK("inhibited", -15, 0, "CAK_A1")).toBe(0);
    expect(alphaHK("rough", -15, 0.001, "CAK_A1")).toBe(1);
    // relative comparison: the log/exp interpolation round-trip costs a few ulp on sigma_0,
    // amplified by the 1/sigma_surf inside the exponent
    expect(alphaHK("basal", -15, 0.001, "CAK_A1") / Math.exp(-24)).toBeCloseTo(1, 10);
    expect(alphaHK("basal", -15, 0, "CAK_A1")).toBe(0);
    expect(alphaHK("prism", -15, -0.01, "CAK_A1")).toBe(0);
  });

  it("the broad-facet coefficient ordering inverts with temperature (necessary, not sufficient for habit)", () => {
    // At any positive sigma_surf: -5 C has prism faster and -15 C has basal faster. This checks only
    // the named broad-facet coefficients; protocol v3 showed that it is not a habit test when
    // the lattice classifier routes primary [20] prism sites through the rough-site path.
    for (const s of [0.002, 0.005, 0.01]) {
      expect(alphaHK("prism", -5, s, "CAK_A1")).toBeGreaterThan(alphaHK("basal", -5, s, "CAK_A1"));
      expect(alphaHK("basal", -15, s, "CAK_A1")).toBeGreaterThan(alphaHK("prism", -15, s, "CAK_A1"));
    }
  });

  it("CAK A_prism dip makes the warm side sigma-sensitive — the recorded finding", () => {
    // At -5 C with CAK: prism wins only at low sigma_surf; basal wins at higher sigma_surf.
    expect(alphaHK("prism", -5, 0.001, "CAK")).toBeGreaterThan(alphaHK("basal", -5, 0.001, "CAK"));
    expect(alphaHK("basal", -5, 0.005, "CAK")).toBeGreaterThan(alphaHK("prism", -5, 0.005, "CAK"));
  });
});

describe("quasi-static validity (Péclet; §4.4 test 6)", () => {
  it("the 2b gate configurations sit deep in the quasi-static regime", () => {
    // Gate domain: 96 cells * 0.35 um = 33.6 um across; sigma_infinity = 0.002; 1 atm.
    // Two-sided bands (round-3 review: a broken helper returning 0 must not pass) — the
    // expected values are hand-computed from the cited forms: Pe = vKin*sigma*L/D.
    const lengthM = 96 * 0.35e-6;
    const warm = pecletUpperBound(-5, 0.002, lengthM, 101325);
    expect(warm).toBeGreaterThan(1e-6); // vKin(-5)*0.002*33.6e-6/2e-5 ~ 1.7e-6
    expect(warm).toBeLessThan(1e-2);
    const cold = pecletUpperBound(-15, 0.002, lengthM, 101325);
    expect(cold).toBeGreaterThan(5e-7); // vKin(-15)*0.002*33.6e-6/2e-5 ~ 7e-7
    expect(cold).toBeLessThan(1e-2);
    // And the source-side water-saturation reference at -15 C, L = 1 mm (not runtime-enforced):
    const worst = pecletUpperBound(-15, 0.157, 1e-3, 101325);
    expect(worst).toBeGreaterThan(1e-3);
    expect(worst).toBeLessThan(2e-3);
  });
});

describe("the M1 parameter set (ADR 0036 — Phase 6 arm 2)", () => {
  // M1 is the SDAK-dipped closed forms from arXiv:2306.13087v1 p6-7, added as a third
  // NucleationParamSet. These tests exist for one reason above all: adding it must move NOTHING.

  it("moves no existing number — CAK and CAK_A1 are bit-identical through the new dispatch", () => {
    // The whole design rests on this. Phase 2b/4/5 evidence replays byte for byte and the Phase 6
    // libm fingerprint hashes sigma0Basal/sigma0Prism, so a single changed ULP here would silently
    // invalidate three phases of published evidence. Object.is, not toBeCloseTo: bit equality.
    for (let tempC = -1; tempC >= -50; tempC -= 0.5) {
      for (const set of ["CAK", "CAK_A1"] as const) {
        expect(Object.is(sigma0BasalFor(tempC, set), sigma0Basal(tempC))).toBe(true);
        expect(Object.is(sigma0PrismFor(tempC, set), sigma0Prism(tempC))).toBe(true);
      }
      for (const sigmaSurf of [1e-3, 1e-2, 0.1]) {
        for (const set of ["CAK", "CAK_A1"] as const) {
          for (const facet of ["basal", "prism"] as const) {
            const viaDispatch = alphaHK(facet, tempC, sigmaSurf, set);
            const direct =
              (facet === "basal" ? 1 : set === "CAK_A1" ? 1 : nucleationAPrism(tempC, set)) *
              Math.exp(-(facet === "basal" ? sigma0Basal(tempC) : sigma0Prism(tempC)) / sigmaSurf);
            expect(Object.is(viaDispatch, direct), `${facet} ${set} at ${tempC} C`).toBe(true);
          }
        }
      }
    }
  });

  it("sets A = 1 on BOTH facets, which is what makes M1's habit ordering sigma-independent", () => {
    for (let tempC = -1; tempC >= -35; tempC -= 1) {
      expect(nucleationAPrism(tempC, "M1")).toBe(1);
    }
  });

  it("reproduces the printed percentages, and returns them as FRACTIONS like every other sigma_0", () => {
    // Spot values recomputed by hand from the printed forms. The unit is the trap here: the paper
    // prints percent, alphaHK divides by a fractional sigma_surf, and a factor of 100 in the
    // exponent is the difference between a crystal and a stationary seed.
    expect(sigma0BasalM1(-2) * 100).toBeCloseTo(0.3129, 4);
    expect(sigma0PrismM1(-2) * 100).toBeCloseTo(0.0903, 4);
    expect(sigma0BasalM1(-14) * 100).toBeCloseTo(2.2636, 4);
    expect(sigma0PrismM1(-14) * 100).toBeCloseTo(0.1591, 4);
    // Signed or unsigned temperature must not matter; only the magnitude is used.
    expect(sigma0BasalM1(-14)).toBe(sigma0BasalM1(14));
    expect(sigma0PrismM1(-14)).toBe(sigma0PrismM1(14));
  });

  it("dips BELOW the undipped branch everywhere, and only at the dips", () => {
    for (let t = 1; t <= 50; t += 0.5) {
      expect(sigma0BasalM1(-t)).toBeLessThanOrEqual(sigma0BasalM2Broad(-t));
      expect(sigma0PrismM1(-t)).toBeLessThanOrEqual(sigma0PrismM2Broad(-t));
    }
    // Far from either centre the dip has essentially closed; at the centres it is deep.
    expect(sigma0BasalM1(-4.5) / sigma0BasalM2Broad(-4.5)).toBeCloseTo(0.13, 2);
    expect(sigma0PrismM1(-14.4) / sigma0PrismM2Broad(-14.4)).toBeCloseTo(0.05, 2);
  });

  it("gives M1 a genuinely different anisotropy from CAK at the prism dip", () => {
    // If M1 and CAK were close, arm 2 would be a re-run rather than a test. At -14 C the dipped
    // prism barrier is an order of magnitude below the basal one; under CAK the two are comparable.
    const m1 = sigma0BasalFor(-14, "M1") / sigma0PrismFor(-14, "M1");
    const cak = sigma0BasalFor(-14, "CAK") / sigma0PrismFor(-14, "CAK");
    expect(m1).toBeGreaterThan(10);
    expect(cak).toBeLessThan(2);
  });
});

describe("M1 inherits the digitized set's extrapolation ban", () => {
  it("THROWS outside the registered domain, exactly where the digitized set does", () => {
    // A closed form returns a number for any input, so adopting M1 without this guard would have
    // silently dropped a safety property CAK has — and dropped it in the worst direction, since the
    // M1 forms are ad-hoc fits whose behaviour outside Libbrecht's data range is unconstrained
    // rather than merely uncertain. Found by a test failing at -0.5 C, not by reasoning ahead.
    for (const outside of [-0.5, -0.999, -50.001, -80]) {
      expect(() => sigma0BasalM1(outside), `${outside} C should be banned`).toThrow(/extrapolation is banned/);
      expect(() => sigma0PrismM1(outside)).toThrow(/extrapolation is banned/);
      expect(() => sigma0Basal(outside)).toThrow(/extrapolation is banned/);
    }
    // Both endpoints are inside, for both sets.
    for (const inside of [-1, -50]) {
      expect(() => sigma0BasalM1(inside)).not.toThrow();
      expect(() => sigma0Basal(inside)).not.toThrow();
    }
  });

  it("bounds M1 to the SAME domain as the anchors, introducing no new registered number", () => {
    expect(M1_DOMAIN_MAGNITUDE_C).toEqual({ min: 1, max: 50 });
  });

  it("leaves the whole Phase 6 grid comfortably inside the domain", () => {
    for (let tempC = -2; tempC >= -35; tempC -= 1) {
      expect(() => alphaHK("basal", tempC, 0.01, "M1")).not.toThrow();
      expect(() => alphaHK("prism", tempC, 0.01, "M1")).not.toThrow();
    }
  });
});
