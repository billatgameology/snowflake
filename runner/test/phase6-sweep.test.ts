// WP2 sweep-harness tests. The harness must apply the frozen protocol and never substitute a
// judgement of its own, so most of these assert that a rule came FROM the protocol rather than
// that it produces a nice answer.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  phase6Aggregate,
  phase6ClassifyHabit,
  phase6ConfigFailures,
  phase6CommandFlagFailures,
  phase6DefaultBackedParameters,
  phase6DomainSpotCheckPasses,
  phase6ParseRunConfig,
  phase6PointCommand,
  phase6ScorePoint,
  phase6SweepPlan,
  phase6SweepPreflight,
  phase6UnaccountedDefaults,
  type Phase6PointResult,
} from "../src/phase6-sweep.ts";
import {
  GROW_LK_DEFAULTS,
  PHASE6_DEFAULT_KEY_FLAGS,
  PHASE6_RESULT_IRRELEVANT_DEFAULTS,
} from "../src/grow-lk-defaults.ts";
import {
  PHASE6_FAR_FIELD,
  PHASE6_PARAM_SET,
  PHASE6_PROTOCOL_SHA256,
  PHASE6_SURFACE_POLICY,
  phase6ExpectedRunGeometry,
  phase6SweepGrid,
  type Phase6GridPoint,
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
  config: null,
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

describe("the ADR 0031 defect class is checked, not assumed", () => {
  it("every registered value reaching a run via a CLI default equals the registered value", () => {
    // ADR 0031: paramSet was registered, was not passed, and the default disagreed -- so 204 runs
    // violated a freeze row while every hash and test stayed green. Seven more parameters sit in
    // that same position today and all happen to agree. This test is what makes that a checked
    // invariant instead of luck: change either side and it fails here rather than in the evidence.
    const checked = phase6DefaultBackedParameters();
    for (const p of checked) {
      expect(p.fromDefault, `${p.name} default vs registered`).toBe(p.registered);
    }
    // Coverage guard: four of these have NO CLI flag, so the default is the only path a run can
    // take. If a flag is ever added for one, this count changes and the table must be revisited.
    expect(checked.filter((p) => !p.hasFlag).map((p) => p.name)).toEqual([
      "pressurePa",
      "seedRadius",
      "seedThickness",
      "relaxMaxSweeps",
    ]);
    // Vacuity guard, per row rather than per total. `toBe(8)` used to stand here and went stale the
    // moment ADR 0035 added the ninth row — a magic total tests the count, not the coverage. Each
    // row must name a real `GROW_LK_DEFAULTS` key, and no key may be claimed twice.
    const keys = checked.map((p) => p.defaultsKey as string);
    expect(keys.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(Object.keys(GROW_LK_DEFAULTS), `${key} is not a real default`).toContain(key);
  });

  it("the built child command carries every flag the protocol requires", () => {
    const command = phase6PointCommand(phase6SweepGrid()[0] as Phase6GridPoint);
    expect(phase6CommandFlagFailures(command)).toEqual([]);
    // Checked by value, not just presence -- presence alone is what let CAK_A1 through.
    const at = command.indexOf("--param-set");
    expect(at).toBeGreaterThan(0);
    expect(command[at + 1]).toBe(PHASE6_PARAM_SET);
  });

  it("actually FAILS when a required flag is missing or carries the wrong value", () => {
    // A check that cannot fail is not a check. Both mutations are the real historical defect.
    const good = phase6PointCommand(phase6SweepGrid()[0] as Phase6GridPoint);
    const at = good.indexOf("--param-set");
    const dropped = [...good.slice(0, at), ...good.slice(at + 2)];
    expect(phase6CommandFlagFailures(dropped).length).toBeGreaterThan(0);
    const wrong = [...good];
    wrong[at + 1] = "CAK_A1";
    expect(phase6CommandFlagFailures(wrong).some((f) => f.includes("CAK_A1"))).toBe(true);
  });
});

describe("WP5 GAP 3 — a run's configuration is recorded and checked", () => {
  // The header is a REAL child's, captured verbatim on 2026-07-29 from
  //   node --experimental-strip-types runner/src/main.ts grow-lk --temp-c -2 --sigma-inf 0.002000
  //     --dims 48,48,48 --dx-um 0.35 --cfl 0.1 --target-extent 21
  //     --surface-policy aggregate-hv-g1h1-v6 --far-field monopole-matched --param-set CAK
  //     --metrics-every 100000 --steps 1
  // i.e. the sweep's own command line. It replaced a hand-written one whose `active=1` was a
  // placeholder — a fixture that cannot be produced by the program it stands in for is not evidence
  // that the parser reads real output.
  const POINT = pointAt(-2, 0.1);
  const HEADER =
    "grow-lk T=-2C sigmaInf=0.002 dims=48,48,48 (hexRadius=23, zHalfExtent=23, active=77879) " +
    "dx=0.35um P=101325Pa paramSet=CAK surfacePolicy=aggregate-hv-g1h1-v6 " +
    "farField=monopole-matched cfl=0.1 tol=1e-9 divTol=1e-7 maxSweeps=200000 targetExtent=21 " +
    "seed=1 noise=0 seedRadius=2 seedSites=19 vKin=6.3421e-4m/s X0=0.1419um peclet<=1.07e-6 " +
    "seedSymErr=0  smootherDriftLimit=3.542e-11\n" +
    "stop reason=size-target step=175 attached=1313 extent=21 AR=0.263158 symErr=0 " +
    "deltaSymClean=true allConverged=true\n";

  it("the grid point the header claims exists, and carries the σ∞ the command line rounds to", () => {
    // Guards the fixture itself: if the grid ever stops containing (−2 °C, f = 0.10) the tests below
    // would be comparing the header against a point that isn't swept.
    expect(POINT.tempC).toBe(-2);
    expect(Number(POINT.sigmaInf.toFixed(6))).toBe(0.002);
  });

  it("parses what the CHILD reported, not what the parent intended", () => {
    const config = phase6ParseRunConfig(HEADER);
    expect(config).not.toBeNull();
    expect(config?.paramSet).toBe("CAK");
    expect(config?.farField).toBe("monopole-matched");
    expect(config?.relaxTol).toBe(1e-9);
    expect(config?.divTol).toBe(1e-7);
    expect(config?.targetExtent).toBe(21);
    expect(config?.pressurePa).toBe(101325);
    expect(config?.seedRadius).toBe(2);
    // ADR 0035's additions, including the two from the run's FINAL line rather than its header.
    expect(config?.tempC).toBe(-2);
    expect(config?.sigmaInf).toBe(0.002);
    expect(config?.dimsN).toBe(48);
    expect(config?.activeCells).toBe(77_879);
    expect(config?.seedSites).toBe(19);
    expect(config?.stopReason).toBe("size-target");
    expect(config?.finalExtent).toBe(21);
    expect(phase6ConfigFailures(config, POINT)).toEqual([]);
  });

  it("the closed forms reproduce the real child's geometry, so neither pin is a magic number", () => {
    // 77 879 = (3·23² + 3·23 + 1) · 47 and 19 = 3·2² + 3·2 + 1, both from the registered fixture.
    const geometry = phase6ExpectedRunGeometry(48, 2, 1);
    expect(geometry).toEqual({ hexRadius: 23, zHalfExtent: 23, activeCells: 77_879, seedSites: 19 });
    // And the pin register's independently MEASURED mutation: seedThickness 1 → 3 took the child's
    // seedSites 19 → 57. The closed form agrees, which is why it is trusted to stand in for a run.
    expect(phase6ExpectedRunGeometry(48, 2, 3).seedSites).toBe(57);
    // A box domain at the same N is 110 592 — the difference this check exists to see.
    expect(48 ** 3).not.toBe(geometry.activeCells);
  });

  it("CATCHES the ADR 0031 defect: a run that used CAK_A1 while the protocol registers CAK", () => {
    // The exact historical failure, now detectable from the run's own output.
    const failures = phase6ConfigFailures(
      phase6ParseRunConfig(HEADER.replace("paramSet=CAK ", "paramSet=CAK_A1 ")),
      POINT,
    );
    expect(failures.some((f) => f.startsWith("paramSet:"))).toBe(true);
  });

  it("catches every other registered parameter drifting, one at a time", () => {
    // A check that only covers the parameter that already burned us is not a check.
    for (const [from, to, name] of [
      ["farField=monopole-matched", "farField=dirichlet", "farField"],
      ["surfacePolicy=aggregate-hv-g1h1-v6", "surfacePolicy=aggregate-hv-g1h1-v5", "surfacePolicy"],
      ["tol=1e-9", "tol=1e-7", "relaxTol"],
      ["divTol=1e-7", "divTol=1e-5", "divTol"],
      ["targetExtent=21", "targetExtent=15", "targetExtent"],
      ["noise=0", "noise=0.01", "noiseEpsilon"],
      ["seedRadius=2", "seedRadius=4", "seedRadius"],
      ["P=101325Pa", "P=50000Pa", "pressurePa"],
      ["cfl=0.1", "cfl=0.2", "cfl"],
      ["maxSweeps=200000", "maxSweeps=100", "relaxMaxSweeps"],
      ["seed=1", "seed=7", "rngSeed"],
      ["dx=0.35um", "dx=0.7um", "dxUm"],
      // ADR 0035. Each of these is a mutation the pin register EXECUTED and the harness certified.
      ["T=-2C", "T=-3C", "tempC"],
      ["sigmaInf=0.002", "sigmaInf=0.018", "sigmaInf"],
      ["dims=48,48,48", "dims=64,64,64", "dimsN"],
      ["hexRadius=23", "hexRadius=31", "hexRadius"],
      ["zHalfExtent=23", "zHalfExtent=31", "zHalfExtent"],
      // `domain: "hexPrism"` → `"box"` at main.ts's sweep solver construction. No flag, no hash.
      ["active=77879", "active=110592", "activeCells"],
      // `seedThickness` 1 → 3. No flag at all, and it triples the seed's thickness.
      ["seedSites=19", "seedSites=57", "seedSites"],
    ] as const) {
      const mutated = HEADER.replace(from, to);
      expect(mutated, `${name}: the mutation did not apply`).not.toBe(HEADER);
      const failures = phase6ConfigFailures(phase6ParseRunConfig(mutated), POINT);
      expect(failures.some((f) => f.startsWith(`${name}:`)), `${name} drift undetected`).toBe(true);
    }
  });

  it("reports an unparseable header rather than treating it as agreement", () => {
    expect(phase6ParseRunConfig("no header here\nstop reason=size-target step=1")).toBeNull();
    expect(phase6ConfigFailures(null, POINT).length).toBe(1);
    // A run that printed a header but never reached a stop line is not parseable either — the
    // outcome tokens are the half of this that a header-only parse could not see.
    expect(phase6ParseRunConfig(HEADER.split("stop reason")[0] as string)).toBeNull();
  });
});

describe("ADR 0035 — a step-capped run is EXCLUDED, not scored as a habit", () => {
  // The pin register's highest-harm finding, reproduced on 2026-07-29 at the registered
  // configuration with `--steps 1`:
  //   stop reason=step-cap step=1 attached=19 extent=5 AR=0.200000 symErr=0
  //     deltaSymClean=true allConverged=true
  // AR 0.20 ≤ 0.6667, so the harness scored it plate / AGREE / headline at −2 °C. Run to completion
  // the same point is neutral / disagree. Nothing registered `steps`, so mutating its default moved
  // no hash and failed no test.
  const stepCapped = (): Phase6PointResult => ({
    ...cleanResult(0.2),
    tempC: -2,
    largestExtent: 5,
    steps: 1,
    attached: 19,
    config: {
      ...(phase6ParseRunConfig(
        "grow-lk T=-2C sigmaInf=0.002 dims=48,48,48 (hexRadius=23, zHalfExtent=23, active=77879) " +
          "dx=0.35um P=101325Pa paramSet=CAK surfacePolicy=aggregate-hv-g1h1-v6 " +
          "farField=monopole-matched cfl=0.1 tol=1e-9 divTol=1e-7 maxSweeps=200000 targetExtent=21 " +
          "seed=1 noise=0 seedRadius=2 seedSites=19\n" +
          "stop reason=step-cap step=1 attached=19 extent=5 AR=0.200000 symErr=0 " +
          "deltaSymClean=true allConverged=true\n",
      ) as NonNullable<ReturnType<typeof phase6ParseRunConfig>>),
    },
  });

  it("scores the fabrication as invalid, naming BOTH the short extent and the stop reason", () => {
    const scored = phase6ScorePoint(pointAt(-2, 0.1), stepCapped());
    expect(scored.modelClass).toBe("invalid");
    expect(scored.score).toBe("excluded");
    expect(scored.exclusionReason).toContain("extent 5");
    expect(scored.exclusionReason).toContain("step-cap");
  });

  it("would have scored it plate / AGREE / headline before ADR 0035", () => {
    // Proves the fabrication was genuinely reachable rather than hypothetical: the same AR at the
    // registered measurement size is a headline AGREE, so the extent check is the whole difference.
    const atSize = phase6ScorePoint(pointAt(-2, 0.1), { ...stepCapped(), largestExtent: 21, config: null });
    expect(atSize.modelClass).toBe("plate");
    expect(atSize.score).toBe("agree");
    expect(atSize.inHeadlineScope).toBe(true);
  });

  it("the forged headline would have been 66/90, not 3/90 — the harm is grid-wide", () => {
    // The seed's AR is 1/5 by construction and carries NO temperature dependence: the same command
    // at −2, −6, −15 and −28 °C prints `attached=19 extent=5 AR=0.200000` at all four. So a
    // step-capped sweep reads `plate` at every point, which agrees across plates-warm and
    // plates-cold and disagrees only in columns. Computed, not added up by hand.
    const forged = phase6SweepGrid()
      .map((p) => phase6ScorePoint(p, { ...cleanResult(0.2), tempC: p.tempC, largestExtent: 21 }))
      .filter((s) => s.inHeadlineScope);
    expect(forged.length).toBe(90);
    expect(forged.filter((s) => s.score === "agree").length).toBe(66);
    // And with ADR 0035's extent check applied to the runs that actually produced that AR — extent
    // 5, not 21 — the same grid yields zero, because every point is excluded by name.
    const guarded = phase6SweepGrid()
      .map((p) => phase6ScorePoint(p, { ...cleanResult(0.2), tempC: p.tempC, largestExtent: 5 }))
      .filter((s) => s.inHeadlineScope);
    expect(guarded.filter((s) => s.score === "agree").length).toBe(0);
    expect(guarded.every((s) => s.score === "excluded")).toBe(true);
  });

  it("still accepts a legitimate overshoot past the registered size", () => {
    // Extent can rise by two in a step, so a run can end at 22. The rule is `< target`, not
    // `!== target` — a stricter rule would invalidate correct runs, which is a different defect.
    const over = phase6ScorePoint(pointAt(-2, 0.1), { ...cleanResult(0.2), tempC: -2, largestExtent: 22 });
    expect(over.exclusionReason).toBeNull();
  });

  it("excludes a NaN extent rather than letting the comparison pass it", () => {
    const nan = phase6ScorePoint(pointAt(-2, 0.1), { ...cleanResult(0.2), largestExtent: Number.NaN });
    expect(nan.modelClass).toBe("invalid");
    expect(nan.exclusionReason).toContain("short of the registered measurement size");
  });

  it("leaves arm 1 scoring unchanged: every published row is at the registered size", () => {
    // ADR 0035's stated limitation, asserted rather than promised. Arm 1's rows carry no `config`,
    // so the stop-reason half cannot be applied retroactively; the extent half can, and it passes
    // on all 204. Reaching extent 21 IMPLIES the size-target condition fired, because the loop
    // cannot continue past it — so the stop-reason check is a belt, not the only trousers.
    const rows = JSON.parse(
      readFileSync(new URL("../../evidence/phase6-sweep/points.json", import.meta.url), "utf8"),
    ) as { result: { largestExtent: number }; exclusionReason: string | null }[];
    expect(rows.length).toBe(204);
    expect(rows.filter((r) => r.result.largestExtent < 21)).toEqual([]);
  });
});

describe("pin-register recommendations 7 and 14 — the checks that walk rather than remember", () => {
  it("every GROW_LK_DEFAULTS key is in a named bucket", () => {
    expect(phase6UnaccountedDefaults()).toEqual([]);
  });

  it("FAILS for a default in no bucket — the `steps` hole, generically", () => {
    // The check must be able to fail, and must fail for the reason it claims. Simulated by asking
    // it about a key that is deliberately in none of the three buckets.
    const buckets = new Set([
      ...phase6DefaultBackedParameters().map((p) => p.defaultsKey as string),
      ...Object.keys(PHASE6_DEFAULT_KEY_FLAGS),
      ...Object.keys(PHASE6_RESULT_IRRELEVANT_DEFAULTS),
    ]);
    const uncovered = Object.keys(GROW_LK_DEFAULTS).filter((k) => !buckets.has(k));
    expect(uncovered).toEqual([]);
    // `steps` is covered by being CHECKED against a registered value, not by being called harmless.
    expect(phase6DefaultBackedParameters().some((p) => p.defaultsKey === "steps")).toBe(true);
    expect(Object.keys(PHASE6_RESULT_IRRELEVANT_DEFAULTS)).not.toContain("steps");
  });

  it("rejects a duplicated flag, which the parser and the check read differently", () => {
    // parseLKArgs honours the LAST occurrence; the value check reads the FIRST. So
    // `--param-set CAK --param-set CAK_A1` passed presence AND value while running CAK_A1.
    const good = phase6PointCommand(phase6SweepGrid()[0] as Phase6GridPoint);
    expect(phase6CommandFlagFailures(good)).toEqual([]);
    const doubled = [...good, "--param-set", "CAK_A1"];
    expect(phase6CommandFlagFailures(doubled).some((f) => f.includes("2 times"))).toBe(true);
  });
});
