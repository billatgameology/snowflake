import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { CappedColumnProfile } from "@vcc/core";
import {
  A_EXECUTION_CRITERIA,
  A_HABIT_BETA_01,
  A_HABIT_CONTROLS,
  A_MORPHOLOGY_CRITERIA,
  B_EXECUTION_CRITERIA,
  B_HABIT_TEMPERATURES,
  B_MORPHOLOGY_CRITERIA,
  criterionDisposition,
  createPhase4CriterionRecord,
  evaluateABranch,
  evaluateADepletion,
  evaluateAHabit,
  evaluateAHollow,
  evaluateATimeline,
  evaluateBBranch,
  evaluateBDepletion,
  evaluateBHabit,
  evaluateBHollow,
  evaluateBTimeline,
  evaluateGate4A,
  evaluateGate4Aggregate,
  evaluateGate4B,
  evaluateGate4Visual,
  occupancyHash,
  PHASE4_VISUAL_CRITERIA,
  type AHabitPoint,
  type ATimelineMeasurements,
  type HollowRun,
  type HollowState,
  type Phase4CriterionName,
  type Phase4CriterionRecord,
} from "../src/gate4-protocol.ts";

function criterion<N extends Phase4CriterionName>(
  name: N,
  passed = true,
): Phase4CriterionRecord<N> {
  return { criterion: name, passed, summary: passed ? "passes fixture" : "fails fixture", measurements: {} };
}

function passingARecords(): Phase4CriterionRecord[] {
  return [...A_EXECUTION_CRITERIA, ...A_MORPHOLOGY_CRITERIA].map((name) => criterion(name));
}

function passingBRecords(): Phase4CriterionRecord[] {
  return [...B_EXECUTION_CRITERIA, ...B_MORPHOLOGY_CRITERIA].map((name) => criterion(name));
}

describe("Phase 4 stable criterion record contracts", () => {
  it("contains every frozen A/B execution, morphology, and visual slot exactly once", () => {
    expect(A_EXECUTION_CRITERIA).toEqual([
      "A-EXEC-PROVENANCE", "A-EXEC-CONFIG", "A-EXEC-SYMMETRY", "A-EXEC-NOISE",
      "A-EXEC-MASS", "A-EXEC-DOMAIN", "A-EXEC-TERMINATION", "A-EXEC-NUMERIC",
    ]);
    expect(A_MORPHOLOGY_CRITERIA).toEqual([
      "A-HABIT-GROWTH", "A-HABIT-ENDPOINTS", "A-HABIT-SOLID", "A-HABIT-MONOTONE",
      "A-DEPLETION-COLUMN", "A-DEPLETION-DEFINED", "A-DEPLETION-WIDENING",
      "A-DEPLETION-SIGNAL", "A-HOLLOW-EACH", "A-HOLLOW-NONVACUOUS",
      "A-HOLLOW-STRUCTURAL", "A-TIMELINE-STAGE1", "A-TIMELINE-STATE",
      "A-TIMELINE-CAPS", "A-TIMELINE-VALID", "A-BRANCH",
    ]);
    expect(B_EXECUTION_CRITERIA).toEqual([
      "B-EXEC-PROVENANCE", "B-EXEC-CONFIG", "B-EXEC-TERMINATION", "B-EXEC-SYMMETRY",
      "B-EXEC-NOISE", "B-EXEC-CONVERGENCE", "B-EXEC-SURFACE", "B-EXEC-LEDGER",
      "B-EXEC-PECLET", "B-EXEC-CHECKPOINT", "B-EXEC-NUMERIC", "B-EXEC-COMPLETE",
    ]);
    expect(B_MORPHOLOGY_CRITERIA).toEqual([
      "B-HABIT-ENDPOINTS", "B-HABIT-SOLID", "B-HABIT-MONOTONE", "B-DEPLETION",
      "B-DEPLETION-WIDENING", "B-HOLLOW", "B-TIMELINE", "B-BRANCH",
    ]);
    expect(PHASE4_VISUAL_CRITERIA).toEqual([
      "V4-1", "V4-2", "V4-3", "V4-4", "V4-5", "V4-6", "V4-7",
    ]);
    const all = [
      ...A_EXECUTION_CRITERIA,
      ...A_MORPHOLOGY_CRITERIA,
      ...B_EXECUTION_CRITERIA,
      ...B_MORPHOLOGY_CRITERIA,
      ...PHASE4_VISUAL_CRITERIA,
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it.each([...A_EXECUTION_CRITERIA, ...A_MORPHOLOGY_CRITERIA])(
    "%s is individually blocking in Pass A",
    (name) => {
      const records = passingARecords().map((item) =>
        item.criterion === name ? criterion(name, false) : item,
      );
      const verdict = evaluateGate4A(records);
      expect(verdict.contractFailures).toEqual([]);
      expect(verdict.blockingFailures).toEqual([name]);
      expect(verdict.gatePass).toBe(false);
      expect(verdict.exitCode).toBe(1);
    },
  );

  it.each(B_EXECUTION_CRITERIA)("%s is individually blocking in Pass B", (name) => {
    const records = passingBRecords().map((item) =>
      item.criterion === name ? criterion(name, false) : item,
    );
    const verdict = evaluateGate4B(records);
    expect(verdict.contractFailures).toEqual([]);
    expect(verdict.executionFailures).toEqual([name]);
    expect(verdict.executionValid).toBe(false);
    expect(verdict.exitCode).toBe(1);
  });

  it.each(B_MORPHOLOGY_CRITERIA)(
    "%s is visible but diagnostic/non-blocking in Pass B",
    (name) => {
      const records = passingBRecords().map((item) =>
        item.criterion === name ? criterion(name, false) : item,
      );
      const verdict = evaluateGate4B(records);
      expect(verdict.contractFailures).toEqual([]);
      expect(verdict.executionValid).toBe(true);
      expect(verdict.diagnosticPass).toBe(false);
      expect(verdict.diagnosticFailures).toEqual([name]);
      expect(verdict.gatePass).toBe(true);
      expect(verdict.exitCode).toBe(0);
      expect(criterionDisposition(name)).toBe("diagnostic");
    },
  );

  it("keeps a negative Pass B diagnostic visible in aggregate exit 0", () => {
    const recordsB = passingBRecords().map((item) =>
      item.criterion === "B-HOLLOW" || item.criterion === "B-TIMELINE"
        ? criterion(item.criterion, false)
        : item,
    );
    const aggregate = evaluateGate4Aggregate(passingARecords(), recordsB);
    expect(aggregate.gatePass).toBe(true);
    expect(aggregate.exitCode).toBe(0);
    expect(aggregate.passBDiagnosticPass).toBe(false);
    expect(aggregate.passBDiagnosticFailures).toEqual(["B-HOLLOW", "B-TIMELINE"]);
    expect(JSON.parse(JSON.stringify(aggregate)).passBDiagnosticFailures).toEqual([
      "B-HOLLOW", "B-TIMELINE",
    ]);
  });

  it("normalizes shuffled input records into the frozen criterion order for stable serialization", () => {
    const verdict = evaluateGate4A([...passingARecords()].reverse());
    expect(verdict.contractFailures).toEqual([]);
    expect(verdict.records.map((item) => item.criterion)).toEqual([
      ...A_EXECUTION_CRITERIA,
      ...A_MORPHOLOGY_CRITERIA,
    ]);
  });

  it("fails closed on a missing, duplicate, unexpected, unknown, or non-finite record", () => {
    const missing = evaluateGate4A(
      passingARecords().filter((item) => item.criterion !== "A-BRANCH"),
    );
    expect(missing.contractFailures).toContain("A-MISSING: required criterion A-BRANCH is absent");
    expect(missing.exitCode).toBe(1);

    const duplicate = evaluateGate4A([...passingARecords(), criterion("A-BRANCH")]);
    expect(duplicate.contractFailures).toContain("A-DUPLICATE: criterion A-BRANCH appears 2 times");
    expect(duplicate.exitCode).toBe(1);

    const unexpected = evaluateGate4A([...passingARecords(), criterion("B-BRANCH")]);
    expect(unexpected.contractFailures).toContain("A-UNEXPECTED: B-BRANCH is not a A criterion");
    expect(unexpected.exitCode).toBe(1);

    const unknown = evaluateGate4A([
      ...passingARecords(),
      { criterion: "A-INVENTED", passed: true, summary: "invented", measurements: {} },
    ]);
    expect(unknown.contractFailures.some((failure) => failure.startsWith("A-RECORD:"))).toBe(true);

    const poisoned = passingARecords().map((item) =>
      item.criterion === "A-EXEC-NUMERIC"
        ? { ...item, measurements: { value: Number.NaN } }
        : item,
    );
    const nonFinite = evaluateGate4A(poisoned);
    expect(nonFinite.contractFailures.some((failure) => failure.startsWith("A-RECORD:"))).toBe(true);
    expect(nonFinite.contractFailures).toContain(
      "A-MISSING: required criterion A-EXEC-NUMERIC is absent",
    );
    expect(() =>
      createPhase4CriterionRecord("A-EXEC-NUMERIC", false, "non-finite", {
        value: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(/cannot create malformed/);
  });

  it("a missing diagnostic record invalidates Pass B completeness instead of becoming a silent miss", () => {
    const verdict = evaluateGate4B(
      passingBRecords().filter((item) => item.criterion !== "B-TIMELINE"),
    );
    expect(verdict.contractFailures).toContain("B-MISSING: required criterion B-TIMELINE is absent");
    expect(verdict.executionValid).toBe(false);
    expect(verdict.exitCode).toBe(1);
  });

  it("rejects extra top-level data and non-plain measurement containers", () => {
    const replaceNumeric = (replacement: unknown): unknown[] =>
      passingARecords().map((item) =>
        item.criterion === "A-EXEC-NUMERIC" ? replacement : item,
      );
    const extraProperty = {
      ...criterion("A-EXEC-NUMERIC"),
      callback: () => "not serializable",
    };
    expect(
      evaluateGate4A(replaceNumeric(extraProperty)).contractFailures.some((failure) =>
        failure.startsWith("A-RECORD:"),
      ),
    ).toBe(true);

    const dateContainer = {
      ...criterion("A-EXEC-NUMERIC"),
      measurements: new Date(0),
    };
    expect(
      evaluateGate4A(replaceNumeric(dateContainer)).contractFailures.some((failure) =>
        failure.startsWith("A-RECORD:"),
      ),
    ).toBe(true);

    const inheritedContainer = Object.assign(
      Object.create({ inherited: "hidden" }) as Record<string, unknown>,
      { value: 1 },
    );
    const inheritedRecord = {
      ...criterion("A-EXEC-NUMERIC"),
      measurements: inheritedContainer,
    };
    expect(
      evaluateGate4A(replaceNumeric(inheritedRecord)).contractFailures.some((failure) =>
        failure.startsWith("A-RECORD:"),
      ),
    ).toBe(true);
    expect(() =>
      createPhase4CriterionRecord(
        "A-EXEC-NUMERIC",
        false,
        "date container",
        new Date(0) as unknown as Record<string, never>,
      ),
    ).toThrow(/cannot create malformed/);
  });

  it("validates every visual slot with the same missing/duplicate discipline", () => {
    const passing = PHASE4_VISUAL_CRITERIA.map((name) => criterion(name));
    expect(evaluateGate4Visual(passing).passed).toBe(true);
    const failed = evaluateGate4Visual(
      passing.map((item) => item.criterion === "V4-4" ? criterion("V4-4", false) : item),
    );
    expect(failed.passed).toBe(false);
    expect(failed.failures).toEqual(["V4-4"]);
    expect(evaluateGate4Visual(passing.slice(1)).contractFailures[0]).toMatch(/V4-MISSING/);
  });
});

function passingAHabit(): AHabitPoint[] {
  const ratios = [0.1, 0.4, 0.8, 1.2, 1.6];
  return A_HABIT_CONTROLS.map((u, index) => ({
    u,
    ggThreshBeta01: A_HABIT_BETA_01[index],
    reachedTarget: true,
    executionValid: true,
    commonConfigHash: "c".repeat(64),
    aspectRatio: ratios[index],
    crossSectionHollowness: 0,
    sealedVoidFraction: 0,
  }));
}

function resultMap(records: readonly Phase4CriterionRecord[]): Map<string, boolean> {
  return new Map(records.map((item) => [item.criterion, item.passed]));
}

describe("Phase 4 habit sweep validators", () => {
  it("passes the registered A sweep and rejects shuffled/equal/endpoint/hollow/common-config controls", () => {
    expect([...resultMap(evaluateAHabit(passingAHabit())).values()]).toEqual([true, true, true, true]);

    const shuffled = passingAHabit();
    [shuffled[1], shuffled[2]] = [shuffled[2], shuffled[1]];
    expect(resultMap(evaluateAHabit(shuffled)).get("A-HABIT-GROWTH")).toBe(false);

    const equal = passingAHabit();
    equal[2] = { ...equal[2], aspectRatio: equal[1].aspectRatio };
    expect(resultMap(evaluateAHabit(equal)).get("A-HABIT-MONOTONE")).toBe(false);

    const invertedEndpoint = passingAHabit();
    invertedEndpoint[4] = { ...invertedEndpoint[4], aspectRatio: 1.49 };
    expect(resultMap(evaluateAHabit(invertedEndpoint)).get("A-HABIT-ENDPOINTS")).toBe(false);

    const hollowEndpoint = passingAHabit();
    hollowEndpoint[4] = { ...hollowEndpoint[4], crossSectionHollowness: 0.01 };
    expect(resultMap(evaluateAHabit(hollowEndpoint)).get("A-HABIT-SOLID")).toBe(false);

    const changedCommon = passingAHabit();
    changedCommon[3] = { ...changedCommon[3], commonConfigHash: "d".repeat(64) };
    expect(resultMap(evaluateAHabit(changedCommon)).get("A-HABIT-GROWTH")).toBe(false);

    expect(resultMap(evaluateAHabit(passingAHabit().slice(0, 4))).get("A-HABIT-GROWTH")).toBe(false);
  });

  it("evaluates B morphology without turning a solid all-plate negative into execution failure", () => {
    const passing = B_HABIT_TEMPERATURES.map((tempC, index) => ({
      tempC,
      aspectRatio: [0.5, 0.7, 1, 1.4, 1.6][index],
      crossSectionHollowness: 0,
      sealedVoidFraction: 0,
    }));
    expect([...resultMap(evaluateBHabit(passing)).values()]).toEqual([true, true, true]);

    const allPlate = B_HABIT_TEMPERATURES.map((tempC, index) => ({
      tempC,
      aspectRatio: 0.2 + index * 0.01,
      crossSectionHollowness: 0,
      sealedVoidFraction: 0,
    }));
    const diagnostic = resultMap(evaluateBHabit(allPlate));
    expect(diagnostic.get("B-HABIT-ENDPOINTS")).toBe(false);
    expect(diagnostic.get("B-HABIT-SOLID")).toBe(true);
    expect(diagnostic.get("B-HABIT-MONOTONE")).toBe(true);

    const decreasing = [...passing];
    decreasing[2] = { ...decreasing[2], aspectRatio: 0.6 };
    expect(resultMap(evaluateBHabit(decreasing)).get("B-HABIT-MONOTONE")).toBe(false);
  });
});

describe("Phase 4 depletion validators", () => {
  it("pins registered sample order, finite ratios, robust signal, and integer widening", () => {
    const samples = [12, 16, 20, 24, 28, 32, 36].map((targetExtent, index) => ({
      targetExtent,
      tExtent: 7 + index,
      depletionRatio: 0.7 + index * 0.01,
    }));
    expect([...resultMap(evaluateADepletion(samples, 2)).values()]).toEqual([true, true, true, true]);

    const flat = samples.map((sample) => ({ ...sample, tExtent: 7 }));
    expect(resultMap(evaluateADepletion(flat, 2)).get("A-DEPLETION-WIDENING")).toBe(false);
    const poisoned = samples.map((sample, index) =>
      index === 2 ? { ...sample, depletionRatio: Number.NaN } : sample,
    );
    expect(resultMap(evaluateADepletion(poisoned, 2)).get("A-DEPLETION-DEFINED")).toBe(false);
    const shuffled = [...samples].reverse();
    expect(resultMap(evaluateADepletion(shuffled, 2)).get("A-DEPLETION-DEFINED")).toBe(false);
  });

  it("uses Pass B diagnostic thresholds without changing criterion disposition", () => {
    const samples = [10, 12, 14, 16, 18, 20, 22, 24].map((targetExtent, index) => ({
      targetExtent,
      tExtent: 6 + index,
      depletionRatio: index === 7 ? 1.1 : 0.8,
    }));
    const records = evaluateBDepletion(samples, 1.6);
    expect([...resultMap(records).values()]).toEqual([true, true]);
    expect(records.every((item) => criterionDisposition(item.criterion) === "diagnostic")).toBe(true);
  });
});

function independentOccupancyHash(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function state(marker: number): HollowState {
  const occupancy = new Uint8Array(4);
  occupancy[marker % occupancy.length] = 1;
  return {
    occupancy,
    surfaceField: new Float64Array([marker, 0.25, 0.5, 0.75]),
    vaporField: new Float64Array([0.1, marker, 0.3, 0.4]),
  };
}

function hollowRun(seed: number, marker = seed): HollowRun {
  const rawState = state(marker);
  return {
    seed,
    reachedTarget: true,
    executionValid: true,
    domainContact: false,
    aspectRatio: 2,
    initialHollowness: 0,
    finalHollowness: 0.1,
    sealedVoidFraction: 0,
    reportedOccupancyHash: independentOccupancyHash(rawState.occupancy),
    state: rawState,
  };
}

function replayOf(run: HollowRun): HollowRun {
  return {
    ...run,
    state: {
      occupancy: run.state.occupancy.slice(),
      surfaceField: run.state.surfaceField.slice(),
      vaporField: run.state.vaporField.slice(),
    },
  };
}

describe("Phase 4 hollow ensemble validators", () => {
  it("independently hashes occupancy and passes distinct streams plus a field-bit replay", () => {
    const runs = [hollowRun(1), hollowRun(2), hollowRun(3)];
    const records = resultMap(evaluateAHollow(runs, replayOf(runs[0]), true));
    expect([...records.values()]).toEqual([true, true, true]);
    expect(occupancyHash(runs[1].state.occupancy)).toBe(
      independentOccupancyHash(runs[1].state.occupancy),
    );
  });

  it("rejects solid, sealed, pre-hollowed, and domain-contact members by A-HOLLOW-EACH", () => {
    const base = [hollowRun(1), hollowRun(2), hollowRun(3)];
    for (const override of [
      { finalHollowness: 0 },
      { sealedVoidFraction: 0.1 },
      { initialHollowness: 0.01 },
      { domainContact: true },
    ]) {
      const runs = base.map((run, index) => index === 1 ? { ...run, ...override } : run);
      expect(resultMap(evaluateAHollow(runs, replayOf(runs[0]), true)).get("A-HOLLOW-EACH")).toBe(false);
    }
  });

  it("rejects identical seed occupancies, shifted reported hashes, and divergent seed-1 replay", () => {
    const identical = [hollowRun(1, 1), hollowRun(2, 1), hollowRun(3, 1)];
    expect(
      resultMap(evaluateAHollow(identical, replayOf(identical[0]), true)).get("A-HOLLOW-NONVACUOUS"),
    ).toBe(false);

    const shifted = [hollowRun(1), hollowRun(2), hollowRun(3)];
    shifted[2] = { ...shifted[2], reportedOccupancyHash: "0".repeat(64) };
    const shiftedVerdict = resultMap(evaluateAHollow(shifted, replayOf(shifted[0]), true));
    expect(shiftedVerdict.get("A-HOLLOW-EACH")).toBe(false);
    expect(shiftedVerdict.get("A-HOLLOW-NONVACUOUS")).toBe(false);

    const replay = replayOf(shifted[0]);
    replay.state.vaporField[0] += 1;
    expect(
      resultMap(evaluateAHollow([hollowRun(1), hollowRun(2), hollowRun(3)], replay, true)).get(
        "A-HOLLOW-NONVACUOUS",
      ),
    ).toBe(false);
  });

  it("keeps B hollowing diagnostic while checking the complete raw replay", () => {
    const runs = [hollowRun(1), hollowRun(2), hollowRun(3)];
    expect(evaluateBHollow(runs, replayOf(runs[0])).passed).toBe(true);
    const misses = runs.map((run) => ({ ...run, finalHollowness: 0.02 }));
    expect(evaluateBHollow(misses, replayOf(misses[0])).passed).toBe(false);
    expect(criterionDisposition("B-HOLLOW")).toBe("diagnostic");
  });
});

function capProfile(
  trunkRadius = 10,
  bottomCapRadius = 12,
  topCapRadius = 12,
  layerCount = 24,
): CappedColumnProfile {
  const occupiedLayers = Array.from({ length: layerCount }, (_, index) => index + 1);
  const layerRadii = new Array<number>(layerCount).fill(trunkRadius);
  layerRadii[0] = bottomCapRadius;
  layerRadii[layerCount - 1] = topCapRadius;
  const trunkRankStart = Math.ceil(0.25 * (layerCount - 1));
  const trunkRankEnd = Math.floor(0.75 * (layerCount - 1));
  const capWindowSize = Math.ceil(0.2 * layerCount);
  return {
    occupiedLayers,
    layerRadii,
    trunkRankStart,
    trunkRankEnd,
    capWindowSize,
    trunkRadius,
    bottomCapRadius,
    topCapRadius,
    capScore: Math.min(bottomCapRadius, topCapRadius) / trunkRadius,
  };
}

function passingATimeline(): ATimelineMeasurements {
  return {
    eventCount: 1,
    eventZExtent: 25,
    eventAspectRatio: 2.5,
    beforeFieldHash: "a".repeat(64),
    afterFieldHash: "a".repeat(64),
    beforeMass: 100,
    afterMass: 100,
    profile: capProfile(),
    finalZExtent: 24,
    stopReason: "far-field",
    finalSymmetryError: 0,
    domainContact: false,
    maxRelativeMassDrift: 1e-12,
  };
}

describe("Phase 4 cap/timeline validators", () => {
  it("passes a two-cap profile and rejects undefined, uniform, one-ended, and asymmetric profiles", () => {
    expect([...resultMap(evaluateATimeline(passingATimeline())).values()]).toEqual([
      true, true, true, true,
    ]);
    for (const profile of [
      undefined,
      capProfile(10, 10, 10),
      capProfile(10, 12, 10),
      capProfile(10, 12, 14),
    ]) {
      expect(
        resultMap(evaluateATimeline({ ...passingATimeline(), profile })).get("A-TIMELINE-CAPS"),
      ).toBe(false);
    }
    const selfReported = { ...capProfile(), capScore: 99 };
    expect(
      resultMap(
        evaluateATimeline({ ...passingATimeline(), profile: selfReported }),
      ).get("A-TIMELINE-CAPS"),
    ).toBe(false);
    expect(
      resultMap(
        evaluateATimeline({
          ...passingATimeline(),
          profile: capProfile(10, 12, 12, 5),
          finalZExtent: 24,
        }),
      ).get("A-TIMELINE-CAPS"),
    ).toBe(false);
  });

  it("rejects a shifted event state and negative zero mass as non-bit-identical", () => {
    expect(
      resultMap(
        evaluateATimeline({ ...passingATimeline(), afterFieldHash: "b".repeat(64) }),
      ).get("A-TIMELINE-STATE"),
    ).toBe(false);
    expect(
      resultMap(evaluateATimeline({ ...passingATimeline(), beforeMass: 0, afterMass: -0 })).get(
        "A-TIMELINE-STATE",
      ),
    ).toBe(false);
    expect(
      resultMap(
        evaluateATimeline({ ...passingATimeline(), beforeMass: Number.NaN, afterMass: Number.NaN }),
      ).get("A-TIMELINE-STATE"),
    ).toBe(false);
  });

  it("evaluates B capped history independently as a diagnostic", () => {
    expect(evaluateBTimeline({ preEventAspectRatio: 1.6, profile: capProfile(10, 12, 12) }).passed).toBe(true);
    expect(evaluateBTimeline({ preEventAspectRatio: 1.4, profile: capProfile(10, 12, 12) }).passed).toBe(false);
    expect(evaluateBTimeline({ preEventAspectRatio: 1.6, profile: capProfile(10, 12, 14) }).passed).toBe(false);
  });
});

describe("Phase 4 branch validators", () => {
  it("requires raw first-crossing evidence and permits a simultaneous-batch overshoot", () => {
    const passing = {
      branchCount: 6,
      aspectRatio: 0.2,
      finalTExtent: 40,
      comparatorTargetTExtent: 40,
      comparatorPreviousTExtent: 39,
      comparatorFinalTExtent: 42,
      comparatorStopReason: "t-extent-target",
      comparatorBranchCount: 0,
      comparatorExecutionValid: true,
      dendriteSharedConfigHash: "c".repeat(64),
      comparatorSharedConfigHash: "c".repeat(64),
    };
    expect(evaluateABranch(passing).passed).toBe(true);
    expect(evaluateABranch({ ...passing, comparatorPreviousTExtent: 40 }).passed).toBe(false);
    expect(evaluateABranch({ ...passing, comparatorFinalTExtent: 39 }).passed).toBe(false);
    expect(evaluateABranch({ ...passing, comparatorTargetTExtent: 41 }).passed).toBe(false);
    expect(evaluateABranch({ ...passing, comparatorStopReason: "far-field" }).passed).toBe(false);
    expect(
      evaluateABranch({ ...passing, comparatorSharedConfigHash: "d".repeat(64) }).passed,
    ).toBe(false);
    expect(evaluateABranch({ ...passing, comparatorBranchCount: 1 }).passed).toBe(false);
  });

  it("keeps the B branch miss diagnostic", () => {
    expect(evaluateBBranch(6, 0.2).passed).toBe(true);
    expect(evaluateBBranch(0, 0.2).passed).toBe(false);
    expect(criterionDisposition("B-BRANCH")).toBe("diagnostic");
    const invalidRecord = evaluateBBranch(Number.NaN, Number.NaN);
    const records = passingBRecords().map((item) =>
      item.criterion === "B-BRANCH" ? invalidRecord : item,
    );
    const verdict = evaluateGate4B(records);
    expect(verdict.contractFailures).toEqual([]);
    expect(verdict.diagnosticFailures).toEqual(["B-BRANCH"]);
    expect(JSON.stringify(invalidRecord)).not.toContain("NaN");
  });
});
