// ADR 0036/0040 — M1 equal-field transcription diagnostics, pinned so they cannot drift.
//
// These values verify the closed forms, logarithm-base interpretation, dip centres, and restricted
// equal-shared-field coefficient ordering. They are not a morphology expectation: neither this
// analytic diagnostic nor the CAK→M1 comparison isolates SDAK causally. Accepted ADR 0040 calls for
// a matched M1/no-dip forward ablation to isolate the implemented dip factors' effect within the
// frozen solver. It cannot establish physical SDAK causality or necessity in nature.

import { describe, expect, it } from "vitest";
import { alphaHK } from "@vcc/core";
import {
  PHASE6_M1_BASAL_DIP_CENTRE_C,
  PHASE6_M1_EXPECTED_ORDER_SWAPS,
  PHASE6_M1_PRISM_DIP_SOURCE_INFERRED_ANCHORS,
  PHASE6_M1_PRISM_DIP_CENTRE_C,
  phase6BroadSigma0BasalPercent,
  phase6BroadSigma0PrismPercent,
  phase6M1AnalyticCoefficientOrder,
  phase6M1Sigma0BasalPercent,
  phase6M1Sigma0PrismPercent,
} from "../src/phase6-sdak-m1.ts";
import { phase6SweepGrid } from "../src/phase6-protocol.ts";

/** The registered T axis, coldest-last, deduplicated from the sweep grid rather than re-typed. */
const TEMPERATURES = [...new Set(phase6SweepGrid().map((p) => p.tempC))].sort((a, b) => b - a);

function orderSwaps(order: (t: number) => string): {
  warmerC: number;
  colderC: number;
  from: string;
  to: string;
}[] {
  const out = [];
  for (let i = 1; i < TEMPERATURES.length; i++) {
    const warmerC = TEMPERATURES[i - 1] as number;
    const colderC = TEMPERATURES[i] as number;
    if (order(warmerC) !== order(colderC)) {
      out.push({ warmerC, colderC, from: order(warmerC), to: order(colderC) });
    }
  }
  return out;
}

describe("M1's equal-field attachment-coefficient order", () => {
  it("gives the same ordering at registered far-field inputs and a sensitivity bracket", () => {
    // The property the equal-field diagnostic rests on. Asserted rather than trusted to a comment.
    // These are registered sigmaInfinity inputs and a decade either side. They are not claims about
    // the facet-local sigmaSurf values produced by the coupled solver.
    const sweptSigmaInf = phase6SweepGrid().map((p) => p.sigmaInf);
    const probes = [
      Math.min(...sweptSigmaInf) / 10,
      ...sweptSigmaInf,
      Math.max(...sweptSigmaInf) * 10,
    ];
    for (const tempC of TEMPERATURES) {
      const T = Math.abs(tempC);
      const b = phase6M1Sigma0BasalPercent(T) / 100;
      const p = phase6M1Sigma0PrismPercent(T) / 100;
      const orders = new Set<string>();
      for (const sigmaSurf of probes) {
        const alphaHKBasal = Math.exp(-b / sigmaSurf);
        const alphaHKPrism = Math.exp(-p / sigmaSurf);
        orders.add(
          alphaHKBasal > alphaHKPrism
            ? "basal-higher"
            : alphaHKBasal < alphaHKPrism
              ? "prism-higher"
              : "tie",
        );
      }
      expect(orders.size, `equal-field order at ${tempC} C depends on sigma_surf`).toBe(1);
      expect([...orders][0]).toBe(phase6M1AnalyticCoefficientOrder(tempC));
    }
  });

  it("the ordering is exact in sigma_0, which is the statement that has no sigma at all", () => {
    // The float64 comparison above can only ever be checked at sampled sigmas. This is the actual
    // claim: the equal-field coefficient order is fixed by sigma_0 alone for every positive sigma_surf,
    // because the exponential is monotonic. No sampling involved.
    for (const tempC of TEMPERATURES) {
      const T = Math.abs(tempC);
      const expected =
        phase6M1Sigma0BasalPercent(T) < phase6M1Sigma0PrismPercent(T)
          ? "basal-higher"
          : "prism-higher";
      expect(phase6M1AnalyticCoefficientOrder(tempC)).toBe(expected);
    }
  });

  it("keeps every registered far-field evaluation in float64's normal exponential range", () => {
    // This is deliberately a far-field input diagnostic only. It neither bounds depleted local
    // sigmaSurf nor proves that a forward run cannot enter the subnormal/underflow region.
    for (const tempC of TEMPERATURES) {
      const T = Math.abs(tempC);
      const basal = phase6M1Sigma0BasalPercent(T) / 100;
      const prism = phase6M1Sigma0PrismPercent(T) / 100;
      const sigmaInf = Math.min(
        ...phase6SweepGrid().filter((p) => p.tempC === tempC).map((p) => p.sigmaInf),
      );
      // exp(-x) enters the subnormal range at -ln(2^-1022) ~= 708.396. This asserts only that the
      // registered sigmaInfinity probes are far from that numerical regime.
      const normalToSubnormalExponent = -Math.log(2 ** -1022);
      expect(basal / sigmaInf, `basal far-field exponent at ${tempC} C`).toBeLessThan(
        normalToSubnormalExponent,
      );
      expect(prism / sigmaInf, `prism far-field exponent at ${tempC} C`).toBeLessThan(
        normalToSubnormalExponent,
      );
    }
  });

  it("is NOT a property the registered CAK set has — the contrast that refuted the old claim", () => {
    // The negative half. If this passed for CAK too, the sigma-independence above would be a
    // property of the grid rather than of A = 1, and the distinction ADR 0036 draws would be empty.
    // CAK carries A_prism != 1, so its equal-field alphaHK ordering moves with sigma_surf at some
    // temperature.
    let foundSigmaDependentSwap = false;
    for (const tempC of TEMPERATURES) {
      const orders = new Set<string>();
      for (const sigmaSurf of [1e-4, 1e-3, 2.5e-3, 1e-2, 0.1]) {
        const b = alphaHK("basal", tempC, sigmaSurf, "CAK");
        const p = alphaHK("prism", tempC, sigmaSurf, "CAK");
        orders.add(b > p ? "basal-higher" : b < p ? "prism-higher" : "tie");
      }
      if (orders.size > 1) foundSigmaDependentSwap = true;
    }
    expect(
      foundSigmaDependentSwap,
      "CAK's ordering never moved with sigma — check the premise",
    ).toBe(true);
  });
});

describe("the registered equal-field coefficient diagnostic", () => {
  it("M1 makes exactly the three coefficient-order swaps registered on the temperature grid", () => {
    expect(orderSwaps(phase6M1AnalyticCoefficientOrder)).toEqual([
      ...PHASE6_M1_EXPECTED_ORDER_SWAPS,
    ]);
  });

  it("the broad-facet branch makes one equal-field coefficient-order swap", () => {
    const broadOrder = (tempC: number): string => {
      const T = Math.abs(tempC);
      const b = phase6BroadSigma0BasalPercent(T);
      const p = phase6BroadSigma0PrismPercent(T);
      return b < p ? "basal-higher" : b > p ? "prism-higher" : "tie";
    };
    const broad = orderSwaps(broadOrder);
    expect(broad.length).toBe(1);
    expect(broad[0]).toEqual({
      warmerC: -8,
      colderC: -9,
      from: "prism-higher",
      to: "basal-higher",
    });
  });

  it("log is BASE 10 — natural log changes the coefficient-order swap count", () => {
    // The error this project actually made, kept as a live check rather than a note.
    //
    // CORRECTED 2026-08-01 (external review). This comment previously said natural log "moves the
    // dip centres to 3.08 and 8.07 degrees". Impossible: the dip is exp(-(log T - log c)^2 / w),
    // whose minimum is at T = c in ANY base — verified at 4.500 under both log10 and ln. A base
    // change rescales the dip WIDTH (~2.3x narrower under ln), and it is the width, not a moved
    // centre, that changes the coefficient-order swap count. Approximately 3.08 and 8.07 are equal-shared-field
    // attachment-coefficient equality locations from
    // the 2026-07-29 retraction, misattributed here.
    //
    // The assertion below was always about the coefficient-order swap COUNT and is unaffected by
    // the fix. It is not a habit-transition count.
    const naturalOrder = (tempC: number): string => {
      const T = Math.abs(tempC);
      const b =
        (0.02 * T ** 1.75 + 0.3) *
        (1 - 0.87 * Math.exp(-((Math.log(T) - Math.log(4.5)) ** 2) / 0.07));
      const p =
        (0.015 * T ** 2 + 0.02 * T ** 0.6) *
        (1 - 0.95 * Math.exp(-((Math.log(T) - Math.log(14.4)) ** 2) / 0.06));
      return b < p ? "basal-higher" : "prism-higher";
    };
    expect(orderSwaps(naturalOrder).length).not.toBe(PHASE6_M1_EXPECTED_ORDER_SWAPS.length);
  });

  it("keeps each analytic dip centre fixed under log10 and natural log", () => {
    // This pins the exact mathematical fact the corrected prose relies on. A coefficient-order
    // swap-count test alone cannot catch a future comment that misattributes an equality location
    // as a moved centre.
    const dipFactor = (
      magnitudeC: number,
      centreC: number,
      depth: number,
      width: number,
      logarithm: (value: number) => number,
    ): number =>
      1 -
      depth *
        Math.exp(-((logarithm(magnitudeC) - logarithm(centreC)) ** 2) / width);

    for (const [centreC, depth, width] of [
      [PHASE6_M1_BASAL_DIP_CENTRE_C, 0.87, 0.07],
      [PHASE6_M1_PRISM_DIP_CENTRE_C, 0.95, 0.06],
    ] as const) {
      for (const logarithm of [Math.log10, Math.log]) {
        const atCentre = dipFactor(centreC, centreC, depth, width, logarithm);
        expect(atCentre).toBe(1 - depth);
        expect(dipFactor(centreC * 0.999, centreC, depth, width, logarithm)).toBeGreaterThan(
          atCentre,
        );
        expect(dipFactor(centreC * 1.001, centreC, depth, width, logarithm)).toBeGreaterThan(
          atCentre,
        );
      }
    }
  });
});

describe("the cold-end source-inferred input gap (ADR 0036 pre-registration 3)", () => {
  it("the prism dip is lower than both same-lineage source-inferred references", () => {
    const ratios = PHASE6_M1_PRISM_DIP_SOURCE_INFERRED_ANCHORS.map(
      (a) => phase6M1Sigma0PrismPercent(Math.abs(a.tempC)) / a.sourceInferredPercent,
    );
    expect(ratios[0]).toBeCloseTo(0.696, 3); // -10 C: 30% low
    expect(ratios[1]).toBeCloseTo(0.915, 3); // -25 C: 8.5% low
    // Two same-sign discrepancies at n=2 are recorded values, not evidence of statistical bias.
    for (const r of ratios) expect(r).toBeLessThan(1);
  });

  it("pins prism dip-factor magnitudes beyond the numeric-reference span", () => {
    // These temperatures remain inside TAX2 Figure 1's displayed M1 domain. The ratios quantify the
    // model prescription where no additional same-lineage numeric source-fit reference is available;
    // they do not establish morphology or empirical importance.
    const dip = (tempC: number): number =>
      phase6M1Sigma0PrismPercent(Math.abs(tempC)) / phase6BroadSigma0PrismPercent(Math.abs(tempC));
    expect(dip(-15)).toBeCloseTo(0.055, 3);
    expect(dip(-25)).toBeCloseTo(0.635, 3);
    expect(dip(-35)).toBeCloseTo(0.920, 3);
    // The basal factor is numerically near one at the sampled cold end.
    const basalDip = (tempC: number): number =>
      phase6M1Sigma0BasalPercent(Math.abs(tempC)) / phase6BroadSigma0BasalPercent(Math.abs(tempC));
    expect(basalDip(-25)).toBeGreaterThan(0.999);
  });

  it("the third coefficient-order bracket shares a temperature with one source-fit reference", () => {
    // Corrected by this test failing. I had written that the third coefficient-order swap "sits
    // inside the thinnest-anchored tier", i.e. beyond every anchor. It does not: it is at -24/-25,
    // and the one cold numeric reference is at -25. That coincidence checks the local M1 coefficient
    // value only; it does not independently support the equality bracket or any habit interpretation.
    // Everything colder than -25 lacks these same-lineage numeric reference points but remains inside
    // the source model's Figure 1 display domain.
    const third = PHASE6_M1_EXPECTED_ORDER_SWAPS[2] as { colderC: number };
    const coldestAnchor = Math.min(
      ...PHASE6_M1_PRISM_DIP_SOURCE_INFERRED_ANCHORS.map((a) => a.tempC),
    );
    expect(third.colderC).toBe(coldestAnchor);
    const beyondEveryAnchor = TEMPERATURES.filter((t) => t < coldestAnchor);
    expect(beyondEveryAnchor.length).toBe(10); // -26 .. -35
  });
});

describe("the transcribed constants", () => {
  it("keeps the dip centres the source prints", () => {
    expect(PHASE6_M1_BASAL_DIP_CENTRE_C).toBe(4.5);
    expect(PHASE6_M1_PRISM_DIP_CENTRE_C).toBe(14.4);
  });

  it("puts each dip's minimum at its own centre", () => {
    // A centre that does not minimise its own dip would mean the grouping of the printed expression
    // was read wrongly — the failure mode the missing parenthesis in the source invites.
    for (const [centre, fn] of [
      [PHASE6_M1_BASAL_DIP_CENTRE_C, phase6M1Sigma0BasalPercent],
      [PHASE6_M1_PRISM_DIP_CENTRE_C, phase6M1Sigma0PrismPercent],
    ] as const) {
      const ratio = (T: number): number =>
        fn(T) / (fn === phase6M1Sigma0BasalPercent ? phase6BroadSigma0BasalPercent(T) : phase6BroadSigma0PrismPercent(T));
      expect(ratio(centre)).toBeLessThan(ratio(centre * 0.8));
      expect(ratio(centre)).toBeLessThan(ratio(centre * 1.25));
    }
  });
});
