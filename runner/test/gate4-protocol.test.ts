import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  cellCount,
  domainCenter,
  hexDistance,
  hexSeedSites,
  idx,
  type CappedColumnProfile,
  type Dims,
} from "@vcc/core";
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
    expect(() =>
      createPhase4CriterionRecord("A-EXEC-NUMERIC", false, "negative zero", {
        value: -0,
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
    targetLargestExtent: 14,
    stepCap: 12_000,
    stopReason: "size-target",
    previousCycle: 99 + index,
    crossingCycle: 100 + index,
    previousLargestExtent: 13,
    crossingLargestExtent: index === 2 ? 16 : 14,
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

    const infiniteEndpoint = passingAHabit();
    infiniteEndpoint[4] = { ...infiniteEndpoint[4], aspectRatio: Number.POSITIVE_INFINITY };
    expect(resultMap(evaluateAHabit(infiniteEndpoint)).get("A-HABIT-ENDPOINTS")).toBe(false);

    const hollowEndpoint = passingAHabit();
    hollowEndpoint[4] = { ...hollowEndpoint[4], crossSectionHollowness: 0.01 };
    expect(resultMap(evaluateAHabit(hollowEndpoint)).get("A-HABIT-SOLID")).toBe(false);

    const changedCommon = passingAHabit();
    changedCommon[3] = { ...changedCommon[3], commonConfigHash: "d".repeat(64) };
    expect(resultMap(evaluateAHabit(changedCommon)).get("A-HABIT-GROWTH")).toBe(false);

    expect(resultMap(evaluateAHabit(passingAHabit().slice(0, 4))).get("A-HABIT-GROWTH")).toBe(false);

    const negativeZeroControl = passingAHabit();
    negativeZeroControl[0] = { ...negativeZeroControl[0], u: -0 };
    expect(resultMap(evaluateAHabit(negativeZeroControl)).get("A-HABIT-GROWTH")).toBe(false);
    const negativeZeroSolid = passingAHabit();
    negativeZeroSolid[4] = { ...negativeZeroSolid[4], crossSectionHollowness: -0 };
    expect(resultMap(evaluateAHabit(negativeZeroSolid)).get("A-HABIT-SOLID")).toBe(false);

    for (const override of [
      { previousLargestExtent: 14 },
      { crossingLargestExtent: 13 },
      { crossingCycle: 103 },
      { targetLargestExtent: 15 },
      { stepCap: 12_001 },
      { stopReason: "step-cap" },
      { previousCycle: 11_999, crossingCycle: 12_000 },
    ]) {
      const late = passingAHabit();
      late[2] = { ...late[2], ...override };
      expect(resultMap(evaluateAHabit(late)).get("A-HABIT-GROWTH")).toBe(false);
    }
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

    const hollowCold = [...passing];
    hollowCold[4] = { ...hollowCold[4], crossSectionHollowness: 0.01 };
    const hollowColdVerdict = resultMap(evaluateBHabit(hollowCold));
    expect(hollowColdVerdict.get("B-HABIT-ENDPOINTS")).toBe(true);
    expect(hollowColdVerdict.get("B-HABIT-SOLID")).toBe(false);
    expect(hollowColdVerdict.get("B-HABIT-MONOTONE")).toBe(true);

    const infiniteCold = [...passing];
    infiniteCold[4] = { ...infiniteCold[4], aspectRatio: Number.POSITIVE_INFINITY };
    expect(resultMap(evaluateBHabit(infiniteCold)).get("B-HABIT-ENDPOINTS")).toBe(false);
  });
});

describe("Phase 4 depletion validators", () => {
  it("pins registered sample order, finite ratios, robust signal, and integer widening", () => {
    const targets = [12, 16, 20, 24, 28, 32, 36];
    const crossings = [12, 16, 20, 26, 28, 32, 36];
    const samples = targets.map((targetExtent, index) => ({
      targetExtent,
      tExtent: 7 + index,
      depletionRatio: 0.7 + index * 0.01,
      previousCycle: 99 + index,
      crossingCycle: 100 + index,
      previousLargestExtent: index === 0 ? targetExtent - 1 : crossings[index - 1],
      crossingLargestExtent: crossings[index],
    }));
    const final = {
      targetExtent: 36,
      stopReason: "size-target",
      completedCycles: 106,
      largestExtent: 36,
      aspectRatio: 2,
    };
    expect([...resultMap(evaluateADepletion(samples, final)).values()]).toEqual([true, true, true, true]);

    const sharedBoundary = samples.map((sample) => ({ ...sample }));
    sharedBoundary[0] = {
      ...sharedBoundary[0],
      previousLargestExtent: 11,
      crossingLargestExtent: 18,
      tExtent: 7,
      depletionRatio: 0.7,
    };
    sharedBoundary[1] = {
      ...sharedBoundary[1],
      previousCycle: sharedBoundary[0].previousCycle,
      crossingCycle: sharedBoundary[0].crossingCycle,
      previousLargestExtent: sharedBoundary[0].previousLargestExtent,
      crossingLargestExtent: sharedBoundary[0].crossingLargestExtent,
      tExtent: sharedBoundary[0].tExtent,
      depletionRatio: sharedBoundary[0].depletionRatio,
    };
    sharedBoundary[2] = { ...sharedBoundary[2], previousLargestExtent: 18 };
    expect([...resultMap(evaluateADepletion(sharedBoundary, final)).values()]).toEqual([
      true, true, true, true,
    ]);

    for (const mismatch of [
      { tExtent: sharedBoundary[1].tExtent + 1 },
      { depletionRatio: sharedBoundary[1].depletionRatio + 0.01 },
    ]) {
      const inconsistentSharedBoundary = sharedBoundary.map((sample) => ({ ...sample }));
      inconsistentSharedBoundary[1] = {
        ...inconsistentSharedBoundary[1],
        ...mismatch,
      };
      expect(
        resultMap(evaluateADepletion(inconsistentSharedBoundary, final)).get(
          "A-DEPLETION-DEFINED",
        ),
      ).toBe(false);
    }

    const flat = samples.map((sample) => ({ ...sample, tExtent: 7 }));
    expect(resultMap(evaluateADepletion(flat, final)).get("A-DEPLETION-WIDENING")).toBe(false);
    const poisoned = samples.map((sample, index) =>
      index === 2 ? { ...sample, depletionRatio: Number.NaN } : sample,
    );
    expect(resultMap(evaluateADepletion(poisoned, final)).get("A-DEPLETION-DEFINED")).toBe(false);
    const shuffled = [...samples].reverse();
    expect(resultMap(evaluateADepletion(shuffled, final)).get("A-DEPLETION-DEFINED")).toBe(false);

    expect(
      resultMap(evaluateADepletion(samples, { ...final, aspectRatio: 1.4 })).get(
        "A-DEPLETION-COLUMN",
      ),
    ).toBe(false);
    const noSignal = samples.map((sample) => ({ ...sample, depletionRatio: 1.1 }));
    expect(resultMap(evaluateADepletion(noSignal, final)).get("A-DEPLETION-SIGNAL")).toBe(false);
    const late = samples.map((sample, index) =>
      index === 2 ? { ...sample, previousLargestExtent: sample.targetExtent } : sample,
    );
    expect(resultMap(evaluateADepletion(late, final)).get("A-DEPLETION-DEFINED")).toBe(false);
    const backdated = samples.map((sample, index) =>
      index === 3 ? { ...sample, previousCycle: 50, crossingCycle: 51 } : sample,
    );
    expect(resultMap(evaluateADepletion(backdated, final)).get("A-DEPLETION-DEFINED")).toBe(false);
    expect(
      resultMap(evaluateADepletion(samples, { ...final, stopReason: "step-cap" })).get(
        "A-DEPLETION-COLUMN",
      ),
    ).toBe(false);
  });

  it("uses Pass B diagnostic thresholds without changing criterion disposition", () => {
    const targets = [10, 12, 14, 16, 18, 20, 22, 24];
    const crossings = [10, 12, 14, 16, 19, 20, 22, 24];
    const samples = targets.map((targetExtent, index) => ({
      targetExtent,
      tExtent: 6 + index,
      depletionRatio: index === 7 ? 1.1 : 0.8,
      previousCycle: 199 + index,
      crossingCycle: 200 + index,
      previousLargestExtent: index === 0 ? targetExtent - 1 : crossings[index - 1],
      crossingLargestExtent: crossings[index],
    }));
    const final = {
      targetExtent: 24,
      stopReason: "size-target",
      completedCycles: 207,
      largestExtent: 24,
      aspectRatio: 1.6,
      stepCap: 50_000,
    };
    const records = evaluateBDepletion(samples, final);
    expect([...resultMap(records).values()]).toEqual([true, true]);
    expect(records.every((item) => criterionDisposition(item.criterion) === "diagnostic")).toBe(true);

    expect(evaluateBDepletion(samples, { ...final, aspectRatio: Number.NaN })[0].passed).toBe(false);
    expect(evaluateBDepletion(samples, { ...final, aspectRatio: -1 })[0].passed).toBe(false);
    expect(
      evaluateBDepletion(
        samples.map((sample) => ({ ...sample, depletionRatio: 1.1 })),
        final,
      )[0].passed,
    ).toBe(false);
    expect(
      evaluateBDepletion(samples.map((sample) => ({ ...sample, tExtent: 6 })), final)[1].passed,
    ).toBe(false);
    expect(evaluateBDepletion(samples, { ...final, stopReason: "step-cap" })[0].passed).toBe(false);
    const late = samples.map((sample, index) =>
      index === 4 ? { ...sample, previousLargestExtent: sample.targetExtent } : sample,
    );
    expect(evaluateBDepletion(late, final)[0].passed).toBe(false);
  });
});

function independentOccupancyHash(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

type HollowFixtureKind = "hollow" | "solid" | "sealed" | "prehollowed";

function addCanonicalSeed(occupancy: Uint8Array, dims: Dims): void {
  for (const site of hexSeedSites(dims, 2, 1)) occupancy[site] = 1;
}

function addColumnLayers(
  occupancy: Uint8Array,
  dims: Dims,
  start: number,
  layers: number,
  kind: HollowFixtureKind,
  finalLayerCount: number,
): void {
  const [ic, jc] = domainCenter(dims);
  for (let rank = 0; rank < layers; rank++) {
    const k = start + rank;
    const solidLayer =
      kind === "solid" ||
      (kind === "sealed" &&
        (rank === 0 || (layers === finalLayerCount && rank === layers - 1)));
    for (let dj = -4; dj <= 4; dj++) {
      for (let di = -4; di <= 4; di++) {
        const distance = hexDistance(di, dj);
        if (distance > 4 || (!solidLayer && distance <= 2)) continue;
        occupancy[idx(dims, ic + di, jc + dj, k)] = 1;
      }
    }
  }
}

function hollowRun(
  seed: number,
  pass: "A" | "B" = "A",
  kind: HollowFixtureKind = "hollow",
  distinctMarker = seed,
): HollowRun {
  const dims: Dims = pass === "A"
    ? { nx: 64, ny: 64, nz: 128 }
    : { nx: 48, ny: 48, nz: 48 };
  const target = pass === "A" ? 36 : 24;
  const start = Math.floor(dims.nz / 2) - Math.floor(target / 2);
  const length = cellCount(dims);
  const initialOccupancy = new Uint8Array(length);
  addCanonicalSeed(initialOccupancy, dims);
  if (kind === "prehollowed") {
    addColumnLayers(initialOccupancy, dims, Math.floor(dims.nz / 2) + 1, 1, "hollow", target);
  }

  const previousOccupancy = new Uint8Array(length);
  addColumnLayers(previousOccupancy, dims, start, target - 1, kind, target);
  for (let index = 0; index < length; index++) {
    if (initialOccupancy[index] === 1) previousOccupancy[index] = 1;
  }

  const occupancy = previousOccupancy.slice();
  addColumnLayers(occupancy, dims, start, target, kind, target);
  const [ic, jc, kc] = domainCenter(dims);
  if (distinctMarker > 1) {
    occupancy[idx(dims, ic + 4 + distinctMarker, jc, kc)] = 1;
  }
  const surfaceField = new Float64Array(length);
  surfaceField.fill(seed / 10);
  const vaporField = new Float64Array(length);
  vaporField.fill(0.5 + seed / 100);
  return {
    executionId: seed.toString(16).padStart(64, "0"),
    seed,
    dims,
    targetLargestExtent: target,
    stopReason: "size-target",
    previousCycle: 100 + seed,
    crossingCycle: 101 + seed,
    previousLargestExtent: target - 1,
    crossingLargestExtent: target,
    executionValid: true,
    initialOccupancy,
    previousOccupancy,
    state: { occupancy, surfaceField, vaporField },
  };
}

function replayOf(run: HollowRun): HollowRun {
  return {
    ...run,
    executionId: (10_000 + run.seed).toString(16).padStart(64, "0"),
    dims: { ...run.dims },
    initialOccupancy: run.initialOccupancy.slice(),
    previousOccupancy: run.previousOccupancy.slice(),
    state: {
      occupancy: run.state.occupancy.slice(),
      surfaceField: run.state.surfaceField.slice(),
      vaporField: run.state.vaporField.slice(),
    },
  };
}

describe("Phase 4 hollow ensemble validators", () => {
  it("recomputes real open-tube geometry and passes distinct streams plus a full-state replay", () => {
    const runs = [hollowRun(1), hollowRun(2), hollowRun(3)];
    const records = resultMap(evaluateAHollow(runs, replayOf(runs[0]), true));
    expect([...records.values()]).toEqual([true, true, true]);
    expect(occupancyHash(runs[1].state.occupancy)).toBe(
      independentOccupancyHash(runs[1].state.occupancy),
    );
  });

  it("rejects raw solid, sealed, pre-hollowed, and domain-contact geometry by A-HOLLOW-EACH", () => {
    for (const replacement of [
      hollowRun(2, "A", "solid"),
      hollowRun(2, "A", "sealed"),
      hollowRun(2, "A", "prehollowed"),
      (() => {
        const run = hollowRun(2);
        const [ic, jc] = domainCenter(run.dims);
        run.state.occupancy[idx(run.dims, ic, jc, 0)] = 1;
        run.state.occupancy[idx(run.dims, ic, jc, run.dims.nz - 1)] = 1;
        return { ...run, crossingLargestExtent: run.dims.nz };
      })(),
    ]) {
      const runs = [hollowRun(1), replacement, hollowRun(3)];
      expect(resultMap(evaluateAHollow(runs, replayOf(runs[0]), true)).get("A-HOLLOW-EACH"))
        .toBe(false);
    }
  });

  it("ignores fabricated metric claims and independently derives a solid failure", () => {
    const fabricated = {
      ...hollowRun(2, "A", "solid"),
      aspectRatio: 99,
      initialHollowness: 0,
      finalHollowness: 0.9,
      sealedVoidFraction: 0,
      domainContact: false,
    } as HollowRun;
    const runs = [hollowRun(1), fabricated, hollowRun(3)];
    expect(resultMap(evaluateAHollow(runs, replayOf(runs[0]), true)).get("A-HOLLOW-EACH"))
      .toBe(false);
  });

  it("rejects seed-vacuous occupancy, replay divergence, identity reuse, and overlapping buffers", () => {
    const identical = [
      hollowRun(1, "A", "hollow", 1),
      hollowRun(2, "A", "hollow", 1),
      hollowRun(3, "A", "hollow", 1),
    ];
    expect(
      resultMap(evaluateAHollow(identical, replayOf(identical[0]), true)).get("A-HOLLOW-NONVACUOUS"),
    ).toBe(false);

    const runs = [hollowRun(1), hollowRun(2), hollowRun(3)];
    const divergent = replayOf(runs[0]);
    divergent.state.vaporField[0] += 1;
    expect(resultMap(evaluateAHollow(runs, divergent, true)).get("A-HOLLOW-NONVACUOUS"))
      .toBe(false);
    expect(resultMap(evaluateAHollow(runs, runs[0], true)).get("A-HOLLOW-NONVACUOUS"))
      .toBe(false);
    const reusedExecutionId = { ...replayOf(runs[0]), executionId: runs[1].executionId };
    expect(
      resultMap(evaluateAHollow(runs, reusedExecutionId, true)).get("A-HOLLOW-NONVACUOUS"),
    ).toBe(false);

    const overlapping = { ...replayOf(runs[0]), state: runs[0].state };
    expect(resultMap(evaluateAHollow(runs, overlapping, true)).get("A-HOLLOW-NONVACUOUS"))
      .toBe(false);
  });

  it("keeps structural inspection independent from raw morphology checks", () => {
    const runs = [hollowRun(1), hollowRun(2), hollowRun(3)];
    const records = resultMap(evaluateAHollow(runs, replayOf(runs[0]), false));
    expect(records.get("A-HOLLOW-EACH")).toBe(true);
    expect(records.get("A-HOLLOW-NONVACUOUS")).toBe(true);
    expect(records.get("A-HOLLOW-STRUCTURAL")).toBe(false);
  });

  it("keeps B hollowing diagnostic while recomputing the registered B-domain geometry", () => {
    const runs = [hollowRun(1, "B"), hollowRun(2, "B"), hollowRun(3, "B")];
    expect(evaluateBHollow(runs, replayOf(runs[0])).passed).toBe(true);
    const solid = [runs[0], hollowRun(2, "B", "solid"), runs[2]];
    expect(evaluateBHollow(solid, replayOf(solid[0])).passed).toBe(false);
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

  it("trips stage-1 and execution-valid timeline criteria independently", () => {
    const weakStage = resultMap(
      evaluateATimeline({ ...passingATimeline(), eventAspectRatio: 1.9 }),
    );
    expect(weakStage.get("A-TIMELINE-STAGE1")).toBe(false);
    expect(weakStage.get("A-TIMELINE-STATE")).toBe(true);
    expect(weakStage.get("A-TIMELINE-CAPS")).toBe(true);
    expect(weakStage.get("A-TIMELINE-VALID")).toBe(true);

    const invalidTermination = resultMap(
      evaluateATimeline({ ...passingATimeline(), stopReason: "step-cap" }),
    );
    expect(invalidTermination.get("A-TIMELINE-STAGE1")).toBe(true);
    expect(invalidTermination.get("A-TIMELINE-STATE")).toBe(true);
    expect(invalidTermination.get("A-TIMELINE-CAPS")).toBe(true);
    expect(invalidTermination.get("A-TIMELINE-VALID")).toBe(false);
    expect(
      resultMap(
        evaluateATimeline({ ...passingATimeline(), maxRelativeMassDrift: -0 }),
      ).get("A-TIMELINE-VALID"),
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
