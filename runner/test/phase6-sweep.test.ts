// WP2 sweep-harness tests. The harness must apply the frozen protocol and never substitute a
// judgement of its own, so most of these assert that a rule came FROM the protocol rather than
// that it produces a nice answer.

import { describe, expect, it } from "vitest";
import {
  phase6Aggregate,
  phase6ClassifyHabit,
  phase6DomainSpotCheckPasses,
  phase6PointCommand,
  phase6ScorePoint,
  phase6SweepPlan,
  phase6SweepPreflight,
  type Phase6PointResult,
} from "../src/phase6-sweep.ts";
import {
  PHASE6_FAR_FIELD,
  PHASE6_PROTOCOL_SHA256,
  PHASE6_SURFACE_POLICY,
  phase6SweepGrid,
} from "../src/phase6-protocol.ts";

const cleanResult = (aspectRatio: number): Phase6PointResult => ({
  tempC: -15,
  fraction: 0.15,
  sigmaInf: 0.02355,
  steps: 316,
  attached: 5161,
  aspectRatio,
  largestExtent: 21,
  symmetryError: 0,
  deltaSymClean: true,
  allConverged: true,
  domainContact: false,
  seconds: 2341,
});
const pointAt = (tempC: number, fraction = 0.15) => {
  const found = phase6SweepGrid().find((p) => p.tempC === tempC && p.fraction === fraction);
  if (found === undefined) throw new Error(`no grid point at ${tempC}/${fraction}`);
  return found;
};

describe("the sweep preflight", () => {
  it("passes only against the registered protocol, and reports the hash it saw", () => {
    const preflight = phase6SweepPreflight();
    // The tree may legitimately be dirty while developing, so that one failure is tolerated
    // here; everything else must hold or the harness would be able to produce evidence under an
    // unknown protocol.
    const structural = preflight.failures.filter((f) => !f.startsWith("tracked tree is dirty"));
    expect(structural).toEqual([]);
    expect(preflight.protocolSha256).toBe(PHASE6_PROTOCOL_SHA256);
    expect(preflight.head).toMatch(/^[0-9a-f]{40}$/);
  });

  it("requires a clean tree, because dirty evidence cannot be reproduced", () => {
    // Asserting the CHECK exists rather than its current value: this is the property that makes
    // "re-run it from this commit" a real offer instead of a hope.
    const source = phase6SweepPreflight.toString();
    expect(source).toContain("treeIsClean");
    expect(source).toContain("freezeIsAncestor");
  });
});

describe("habit classification", () => {
  it("uses the registered thresholds and nothing else", () => {
    expect(phase6ClassifyHabit(1 / 1.5)).toBe("plate"); // inclusive at the ceiling
    expect(phase6ClassifyHabit(0.6666)).toBe("plate");
    // The ceiling is 0.6666..., so 0.6667 is ABOVE it and is neutral. Pinned because the
    // four-decimal AR values these reports print sit either side of a threshold that is not a
    // four-decimal number, and rounding one into the wrong class is a real hazard.
    expect(phase6ClassifyHabit(0.6667)).toBe("neutral");
    expect(phase6ClassifyHabit(0.7)).toBe("neutral");
    expect(phase6ClassifyHabit(1.1053)).toBe("neutral"); // WP3's cold point
    expect(phase6ClassifyHabit(1.5)).toBe("column"); // inclusive at the floor
    expect(phase6ClassifyHabit(12.2)).toBe("column"); // Phase 2b's column
    // A run that produced no crystal is not a plate.
    expect(phase6ClassifyHabit(0)).toBe("invalid");
    expect(phase6ClassifyHabit(Number.NaN)).toBe("invalid");
  });
});

describe("scoring a measured point", () => {
  it("excludes a broken run BY NAME rather than scoring it", () => {
    // Each of these is a run that did not happen properly, not a statement about the model.
    const cases: [Partial<Phase6PointResult>, string][] = [
      [{ allConverged: false }, "did not converge"],
      [{ deltaSymClean: false }, "D6h"],
      [{ symmetryError: 0.02 }, "symmetryError"],
      [{ domainContact: true }, "domain-contact"],
    ];
    for (const [override, fragment] of cases) {
      const scored = phase6ScorePoint(pointAt(-15), { ...cleanResult(0.3), ...override });
      expect(scored.modelClass).toBe("invalid");
      expect(scored.score).toBe("excluded");
      expect(scored.exclusionReason ?? "").toContain(fragment);
      // Excluded points must never silently count toward agreement.
      expect(scored.score).not.toBe("agree");
    }
  });

  it("scores WP3's actual cold measurement as a disagreement", () => {
    // The registered reference calls -15 C a PLATE regime; the model measures neutral there.
    // Under ADR 0025 neutral is a disagreement, and this is the point where that rule bites —
    // so it is asserted on the real number rather than a synthetic one.
    const scored = phase6ScorePoint(pointAt(-15), cleanResult(1.1053));
    expect(scored.regime).toBe("plates-cold");
    expect(scored.modelClass).toBe("neutral");
    expect(scored.score).toBe("disagree");
    expect(scored.inHeadlineScope).toBe(true);
    expect(scored.exclusionReason).toBeNull();
  });

  it("keeps ambiguity-band points out of the headline without excluding them", () => {
    const scored = phase6ScorePoint(pointAt(-10), cleanResult(0.3));
    expect(scored.inAmbiguityBand).toBe(true);
    expect(scored.inHeadlineScope).toBe(false);
    // It is still scored — reported, just not counted.
    expect(scored.score).not.toBe("excluded");
  });

  it("keeps the mixed cold regime out of the headline", () => {
    const scored = phase6ScorePoint(pointAt(-30), cleanResult(1.2));
    expect(scored.regime).toBe("columns-and-plates");
    expect(scored.inHeadlineScope).toBe(false);
  });

  it("flags extent-fragile points below a threshold", () => {
    expect(phase6ScorePoint(pointAt(-15), cleanResult(1.4)).extentFragile).toBe(true);
    expect(phase6ScorePoint(pointAt(-15), cleanResult(1.1053)).extentFragile).toBe(false);
    // An invalid run is not flagged fragile — there is no measurement to be fragile.
    expect(
      phase6ScorePoint(pointAt(-15), { ...cleanResult(1.4), allConverged: false }).extentFragile,
    ).toBe(false);
  });
});

describe("aggregation", () => {
  it("headlines only headline-scope points and publishes what could inflate it", () => {
    const scored = [
      phase6ScorePoint(pointAt(-15), cleanResult(0.3)), // plates-cold, plate -> agree
      phase6ScorePoint(pointAt(-16), cleanResult(1.1)), // plates-cold, neutral -> disagree
      phase6ScorePoint(pointAt(-30), cleanResult(0.3)), // mixed regime -> not headline
      phase6ScorePoint(pointAt(-10), cleanResult(0.3)), // ambiguity band -> not headline
      phase6ScorePoint(pointAt(-17), { ...cleanResult(0.3), allConverged: false }), // excluded
    ];
    const report = phase6Aggregate(scored, PHASE6_PROTOCOL_SHA256, "0".repeat(40));
    expect(report.headlineAgree).toBe(1);
    expect(report.headlineTotal).toBe(2); // the excluded point leaves the denominator
    expect(report.neutralCount).toBe(1);
    expect(report.excludedCount).toBe(1);
    // Exclusions are named, never a silent drop.
    expect(report.excludedPoints).toHaveLength(1);
    expect(report.excludedPoints[0]?.reason).toContain("did not converge");
    // The mixed regime is tallied but flagged out of the headline.
    const mixed = report.perRegime.find((r) => r.regime === "columns-and-plates");
    expect(mixed?.inHeadline).toBe(false);
    expect(mixed?.agree).toBe(1);
  });
});

describe("the executed command", () => {
  it("is built from the frozen protocol, so it cannot drift from it", () => {
    const command = phase6PointCommand(pointAt(-15)).join(" ");
    expect(command).toContain(`--surface-policy ${PHASE6_SURFACE_POLICY}`);
    expect(command).toContain(`--far-field ${PHASE6_FAR_FIELD}`);
    expect(command).toContain("--dims 48,48,48");
    expect(command).toContain("--target-extent 21");
    expect(command).toContain("--dx-um 0.35");
    expect(command).toContain("--sigma-inf 0.023550");
  });

  it("plans exactly the registered grid", () => {
    expect(phase6SweepPlan()).toEqual(phase6SweepGrid());
    expect(phase6SweepPlan().length).toBe(204);
  });
});

describe("the domain spot-check", () => {
  it("fails on a class change, whatever the counts say", () => {
    const verdict = phase6DomainSpotCheckPasses(
      { attached: 5161, modelClass: "neutral" },
      { attached: 5161, modelClass: "column" },
    );
    expect(verdict.passed).toBe(false);
    expect(verdict.reason).toContain("habit class differs");
  });

  it("fails when the attached counts drift past the registered tolerance", () => {
    expect(
      phase6DomainSpotCheckPasses(
        { attached: 5161, modelClass: "neutral" },
        { attached: 5161 * 1.02, modelClass: "neutral" },
      ).passed,
    ).toBe(false);
  });

  it("passes on WP3's own N=48 vs N=64 numbers", () => {
    // 5161 -> 5159 is the measured residual at the registered domain: 0.04%, well inside 0.5%.
    const verdict = phase6DomainSpotCheckPasses(
      { attached: 5161, modelClass: "neutral" },
      { attached: 5159, modelClass: "neutral" },
    );
    expect(verdict.passed).toBe(true);
  });
});
