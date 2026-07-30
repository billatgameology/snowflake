// ADR 0036 — the SDAK arm's registered expectation, pinned so it cannot drift.
//
// A pre-registration that lives only in a markdown file is a pre-registration that can be edited
// after the result is known. These tests are what make ADR 0036's numbers binding: change the closed
// forms, change the log base, or change the dip centres, and the registered expectation fails here
// rather than quietly becoming whatever arm 2 happens to produce.

import { describe, expect, it } from "vitest";
import { alphaHK } from "@vcc/core";
import {
  PHASE6_M1_BASAL_DIP_CENTRE_C,
  PHASE6_M1_EXPECTED_TRANSITIONS,
  PHASE6_M1_PRISM_DIP_ANCHORS,
  PHASE6_M1_PRISM_DIP_CENTRE_C,
  phase6BroadSigma0BasalPercent,
  phase6BroadSigma0PrismPercent,
  phase6M1Sense,
  phase6M1Sigma0BasalPercent,
  phase6M1Sigma0PrismPercent,
} from "../src/phase6-sdak-m1.ts";
import { phase6SweepGrid } from "../src/phase6-protocol.ts";

/** The registered T axis, coldest-last, deduplicated from the sweep grid rather than re-typed. */
const TEMPERATURES = [...new Set(phase6SweepGrid().map((p) => p.tempC))].sort((a, b) => b - a);

function transitions(sense: (t: number) => string): { warmerC: number; colderC: number; from: string; to: string }[] {
  const out = [];
  for (let i = 1; i < TEMPERATURES.length; i++) {
    const warmerC = TEMPERATURES[i - 1] as number;
    const colderC = TEMPERATURES[i] as number;
    if (sense(warmerC) !== sense(colderC)) {
      out.push({ warmerC, colderC, from: sense(warmerC), to: sense(colderC) });
    }
  }
  return out;
}

describe("M1's habit sense is provably independent of supersaturation", () => {
  it("gives the same ordering at every sigma the sweep actually reaches", () => {
    // The property the whole 0D prediction rests on. Asserted rather than trusted to a comment.
    // The sigma range is the SWEPT one and a decade either side; see the underflow test below for
    // why it is not wider, which is a real limit rather than a convenient choice of range.
    const sweptSigmaInf = phase6SweepGrid().map((p) => p.sigmaInf);
    const probes = [Math.min(...sweptSigmaInf) / 10, ...sweptSigmaInf, Math.max(...sweptSigmaInf) * 10];
    for (const tempC of TEMPERATURES) {
      const T = Math.abs(tempC);
      const b = phase6M1Sigma0BasalPercent(T) / 100;
      const p = phase6M1Sigma0PrismPercent(T) / 100;
      const senses = new Set<string>();
      for (const sigmaSurf of probes) {
        const alphaHKBasal = Math.exp(-b / sigmaSurf);
        const alphaHKPrism = Math.exp(-p / sigmaSurf);
        senses.add(alphaHKBasal > alphaHKPrism ? "column" : alphaHKBasal < alphaHKPrism ? "plate" : "tie");
      }
      expect(senses.size, `sense at ${tempC} C depends on sigma_surf`).toBe(1);
      expect([...senses][0]).toBe(phase6M1Sense(tempC));
    }
  });

  it("the ordering is exact in sigma_0, which is the statement that has no sigma at all", () => {
    // The float64 comparison above can only ever be checked at sampled sigmas. This is the actual
    // claim: the sense is fixed by the sigma_0 ordering alone, for every positive sigma_surf,
    // because the exponential is monotonic. No sampling involved.
    for (const tempC of TEMPERATURES) {
      const T = Math.abs(tempC);
      const expected = phase6M1Sigma0BasalPercent(T) < phase6M1Sigma0PrismPercent(T) ? "column" : "plate";
      expect(phase6M1Sense(tempC)).toBe(expected);
    }
  });

  it("every swept point clears the float64 underflow floor, checked PER TEMPERATURE", () => {
    // Both alphaHK values are exp(-sigma_0/sigma_surf). Below exp(-709) a double is exactly 0, so at small
    // enough sigma_surf the slower facet's alphaHK arrests and, lower still, both do and the ordering
    // degenerates to a numerical tie — not because the physics is ambiguous but because float64 ran
    // out. The sigma-independence claim above is exact in exact arithmetic and holds in float64 only
    // above this floor.
    //
    // The floor is TEMPERATURE-DEPENDENT, because sigma_0 grows steeply with |T|: 0.09% at -2 C
    // against 17.07% at -35 C. My first version of this test compared the coldest temperature's
    // floor against the smallest sigma_infinity anywhere on the grid — which is at -2 C — and
    // reported a margin of 8x that does not correspond to any real point. Per temperature the true
    // worst case is 169x, at -35 C. Comparing a floor from one temperature against a value from
    // another is exactly the mistake this test now cannot make.
    const worstArrest: { tempC: number; margin: number }[] = [];
    for (const tempC of TEMPERATURES) {
      const T = Math.abs(tempC);
      const basal = phase6M1Sigma0BasalPercent(T) / 100;
      const prism = phase6M1Sigma0PrismPercent(T) / 100;
      const sigmaInf = Math.min(
        ...phase6SweepGrid().filter((p) => p.tempC === tempC).map((p) => p.sigmaInf),
      );
      // The slower facet arrests first, so max(sigma_0) sets the binding floor.
      const arrestFloor = Math.max(basal, prism) / 709;
      worstArrest.push({ tempC, margin: sigmaInf / arrestFloor });
      // Both alphaHK values must be strictly positive at this point's smallest driving supersaturation.
      expect(Math.exp(-basal / sigmaInf), `basal alphaHK underflows at ${tempC} C`).toBeGreaterThan(0);
      expect(Math.exp(-prism / sigmaInf), `prism alphaHK underflows at ${tempC} C`).toBeGreaterThan(0);
    }
    // sigma_surf is BELOW sigma_infinity — diffusion depletes it — so a positive margin is not
    // enough on its own; it has to be large. The binding case is the cold end, where sigma_0 is
    // largest. Registered so a cold low-sigma point returning no growth is recognised as underflow
    // rather than reported as physics.
    const tightest = worstArrest.reduce((a, b) => (a.margin < b.margin ? a : b));
    expect(tightest.tempC).toBe(-35);
    expect(tightest.margin).toBeGreaterThan(100);
    expect(tightest.margin).toBeLessThan(200); // it is 169x — comfortable, not enormous
  });

  it("is NOT a property the registered CAK set has — the contrast that refuted the old claim", () => {
    // The negative half. If this passed for CAK too, the sigma-independence above would be a
    // property of the grid rather than of A = 1, and the distinction ADR 0036 draws would be empty.
    // CAK carries A_prism != 1, so its alphaHK ordering moves with sigma_surf at some temperature.
    let foundSigmaDependentSwap = false;
    for (const tempC of TEMPERATURES) {
      const senses = new Set<string>();
      for (const sigmaSurf of [1e-4, 1e-3, 2.5e-3, 1e-2, 0.1]) {
        const b = alphaHK("basal", tempC, sigmaSurf, "CAK");
        const p = alphaHK("prism", tempC, sigmaSurf, "CAK");
        senses.add(b > p ? "column" : b < p ? "plate" : "tie");
      }
      if (senses.size > 1) foundSigmaDependentSwap = true;
    }
    expect(foundSigmaDependentSwap, "CAK's ordering never moved with sigma — check the premise").toBe(true);
  });
});

describe("the registered 0D expectation (ADR 0036 Part 1)", () => {
  it("M1 makes exactly the three transitions the ADR registers, at the registered temperatures", () => {
    expect(transitions(phase6M1Sense)).toEqual([...PHASE6_M1_EXPECTED_TRANSITIONS]);
  });

  it("the broad-facet branch makes ONE transition, in the WRONG sense — arm 1's problem", () => {
    const broadSense = (tempC: number): string => {
      const T = Math.abs(tempC);
      const b = phase6BroadSigma0BasalPercent(T);
      const p = phase6BroadSigma0PrismPercent(T);
      return b < p ? "column" : b > p ? "plate" : "tie";
    };
    const broad = transitions(broadSense);
    expect(broad.length).toBe(1);
    // Nakaya goes column -> plate crossing -9.9 C. The broad branch goes plate -> column there:
    // the opposite sense, which is the whole reason arm 2 exists.
    expect(broad[0]).toEqual({ warmerC: -8, colderC: -9, from: "plate", to: "column" });
  });

  it("agrees with ADR 0025's regimes at every headline temperature — and this is NOT evidence", () => {
    // In-sample by construction: the dip centres were CHOSEN to impose this agreement (charter
    // §2.5). The assertion exists to catch a transcription error in the closed forms, which is the
    // only thing it can detect. ADR 0036 says so at length; this comment exists so a reader of the
    // test does not mistake a green check for a scientific result.
    const accepts = (tempC: number): readonly string[] =>
      tempC > -3.3 ? ["plate"] : tempC > -9.9 ? ["column"] : tempC > -21.5 ? ["plate"] : ["plate", "column"];
    const inBand = (t: number): boolean => [-3.3, -9.9, -21.5].some((b) => Math.abs(t - b) <= 1.0);
    const headline = TEMPERATURES.filter((t) => !inBand(t) && t > -21.5);
    expect(headline.length).toBe(15);
    for (const tempC of headline) {
      expect(accepts(tempC), `M1 says ${phase6M1Sense(tempC)} at ${tempC} C`).toContain(phase6M1Sense(tempC));
    }
  });

  it("log is BASE 10 — natural log gives five transitions, not three", () => {
    // The error this project actually made, kept as a live check rather than a note. With Math.log
    // the dip centres move to 3.08 and 8.07 degrees and the transition count changes.
    const naturalSense = (tempC: number): string => {
      const T = Math.abs(tempC);
      const b = (0.02 * T ** 1.75 + 0.3) * (1 - 0.87 * Math.exp(-((Math.log(T) - Math.log(4.5)) ** 2) / 0.07));
      const p = (0.015 * T ** 2 + 0.02 * T ** 0.6) * (1 - 0.95 * Math.exp(-((Math.log(T) - Math.log(14.4)) ** 2) / 0.06));
      return b < p ? "column" : "plate";
    };
    expect(transitions(naturalSense).length).not.toBe(PHASE6_M1_EXPECTED_TRANSITIONS.length);
  });
});

describe("the cold-end input gap (ADR 0036 pre-registration 3)", () => {
  it("the prism dip runs LOW against both numeric anchors, by the registered amounts", () => {
    const ratios = PHASE6_M1_PRISM_DIP_ANCHORS.map(
      (a) => phase6M1Sigma0PrismPercent(Math.abs(a.tempC)) / a.measuredPercent,
    );
    expect(ratios[0]).toBeCloseTo(0.696, 3); // -10 C: 30% low
    expect(ratios[1]).toBeCloseTo(0.915, 3); // -25 C: 8.5% low
    // Low against BOTH, which is a bias rather than scatter, and is why the ADR states it.
    for (const r of ratios) expect(r).toBeLessThan(1);
  });

  it("the prism dip is doing large work across the unanchored cold end", () => {
    // If the dip had decayed to ~1 below -15 C the sourcing gap would not matter. It has not: the
    // dip is still a 36% reduction at -25 C and 8% at -35 C, on ten temperatures with no anchor.
    const dip = (tempC: number): number =>
      phase6M1Sigma0PrismPercent(Math.abs(tempC)) / phase6BroadSigma0PrismPercent(Math.abs(tempC));
    expect(dip(-15)).toBeCloseTo(0.055, 3);
    expect(dip(-25)).toBeCloseTo(0.635, 3);
    expect(dip(-35)).toBeCloseTo(0.920, 3);
    // The basal dip, by contrast, IS dead at the cold end — so the gap is a prism-side problem only.
    const basalDip = (tempC: number): number =>
      phase6M1Sigma0BasalPercent(Math.abs(tempC)) / phase6BroadSigma0BasalPercent(Math.abs(tempC));
    expect(basalDip(-25)).toBeGreaterThan(0.999);
  });

  it("the third transition lands exactly ON the single cold anchor, not beyond it", () => {
    // Corrected by this test failing. I had written that the third transition "sits inside the
    // thinnest-anchored tier", i.e. beyond every anchor. It does not: it is at -24/-25 and the one
    // cold anchor is at -25. That is better-supported than I claimed, and the ADR was fixed to say
    // so. What IS beyond every anchor is everything colder than -25.
    const third = PHASE6_M1_EXPECTED_TRANSITIONS[2] as { colderC: number };
    const coldestAnchor = Math.min(...PHASE6_M1_PRISM_DIP_ANCHORS.map((a) => a.tempC));
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
