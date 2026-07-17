// Pure Phase 4 criterion contracts and morphology evaluators.
//
// Runtime evidence collection belongs to gate4's runner implementation (WP2). This module is
// deliberately side-effect free: it assigns fixed dispositions by criterion name, rejects
// incomplete/ambiguous record sets, and computes morphology verdicts from raw measurements.

import { createHash } from "node:crypto";
import {
  aspectRatio,
  cellCount,
  crossSectionHollowness,
  domainContact,
  latticeExtents,
  sealedVoidFraction,
  type CappedColumnProfile,
  type Dims,
  type LatticeExtents,
} from "@vcc/core";

export const PHASE4_PROTOCOL_VERSION = 1;
export const PHASE4_CRITERIA_FREEZE = "e567767";
export const PHASE4_NODE = "v24.13.1";
export const PHASE4_V8 = "13.6.233.17-node.40";

export const A_EXECUTION_CRITERIA = [
  "A-EXEC-PROVENANCE",
  "A-EXEC-CONFIG",
  "A-EXEC-SYMMETRY",
  "A-EXEC-NOISE",
  "A-EXEC-MASS",
  "A-EXEC-DOMAIN",
  "A-EXEC-TERMINATION",
  "A-EXEC-NUMERIC",
] as const;

export const A_MORPHOLOGY_CRITERIA = [
  "A-HABIT-GROWTH",
  "A-HABIT-ENDPOINTS",
  "A-HABIT-SOLID",
  "A-HABIT-MONOTONE",
  "A-DEPLETION-COLUMN",
  "A-DEPLETION-DEFINED",
  "A-DEPLETION-WIDENING",
  "A-DEPLETION-SIGNAL",
  "A-HOLLOW-EACH",
  "A-HOLLOW-NONVACUOUS",
  "A-HOLLOW-STRUCTURAL",
  "A-TIMELINE-STAGE1",
  "A-TIMELINE-STATE",
  "A-TIMELINE-CAPS",
  "A-TIMELINE-VALID",
  "A-BRANCH",
] as const;

export const B_EXECUTION_CRITERIA = [
  "B-EXEC-PROVENANCE",
  "B-EXEC-CONFIG",
  "B-EXEC-TERMINATION",
  "B-EXEC-SYMMETRY",
  "B-EXEC-NOISE",
  "B-EXEC-CONVERGENCE",
  "B-EXEC-SURFACE",
  "B-EXEC-LEDGER",
  "B-EXEC-PECLET",
  "B-EXEC-CHECKPOINT",
  "B-EXEC-NUMERIC",
  "B-EXEC-COMPLETE",
] as const;

export const B_MORPHOLOGY_CRITERIA = [
  "B-HABIT-ENDPOINTS",
  "B-HABIT-SOLID",
  "B-HABIT-MONOTONE",
  "B-DEPLETION",
  "B-DEPLETION-WIDENING",
  "B-HOLLOW",
  "B-TIMELINE",
  "B-BRANCH",
] as const;

export const PHASE4_VISUAL_CRITERIA = [
  "V4-1",
  "V4-2",
  "V4-3",
  "V4-4",
  "V4-5",
  "V4-6",
  "V4-7",
] as const;

export type AExecutionCriterion = (typeof A_EXECUTION_CRITERIA)[number];
export type AMorphologyCriterion = (typeof A_MORPHOLOGY_CRITERIA)[number];
export type BExecutionCriterion = (typeof B_EXECUTION_CRITERIA)[number];
export type BMorphologyCriterion = (typeof B_MORPHOLOGY_CRITERIA)[number];
export type Phase4VisualCriterion = (typeof PHASE4_VISUAL_CRITERIA)[number];
export type Phase4CriterionName =
  | AExecutionCriterion
  | AMorphologyCriterion
  | BExecutionCriterion
  | BMorphologyCriterion
  | Phase4VisualCriterion;

export type CriterionDisposition = "blocking" | "diagnostic";
export type CriterionMeasurement = string | number | boolean | null;

/** Stable, JSON-safe record written once for each required criterion. */
export interface Phase4CriterionRecord<N extends Phase4CriterionName = Phase4CriterionName> {
  readonly criterion: N;
  readonly passed: boolean;
  readonly summary: string;
  readonly measurements: Readonly<Record<string, CriterionMeasurement>>;
}

const allCriterionNames = new Set<Phase4CriterionName>([
  ...A_EXECUTION_CRITERIA,
  ...A_MORPHOLOGY_CRITERIA,
  ...B_EXECUTION_CRITERIA,
  ...B_MORPHOLOGY_CRITERIA,
  ...PHASE4_VISUAL_CRITERIA,
]);
const bDiagnosticNames = new Set<Phase4CriterionName>(B_MORPHOLOGY_CRITERIA);

export function criterionDisposition(name: Phase4CriterionName): CriterionDisposition {
  return bDiagnosticNames.has(name) ? "diagnostic" : "blocking";
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) && !Object.is(value, -0) ? value : null;
}

function record<N extends Phase4CriterionName>(
  criterion: N,
  passed: boolean,
  summary: string,
  measurements: Readonly<Record<string, CriterionMeasurement>> = {},
): Phase4CriterionRecord<N> {
  const result = { criterion, passed, summary, measurements };
  if (!validateRecord(result)) {
    throw new Error(`cannot create malformed Phase 4 criterion record ${criterion}`);
  }
  return result;
}

/** Checked constructor for WP2 execution records and WP3 visual records. */
export function createPhase4CriterionRecord<N extends Phase4CriterionName>(
  criterion: N,
  passed: boolean,
  summary: string,
  measurements: Readonly<Record<string, CriterionMeasurement>> = {},
): Phase4CriterionRecord<N> {
  return record(criterion, passed, summary, measurements);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function exactEnumerableDataProperties(
  value: Record<string, unknown>,
  expectedKeys?: readonly string[],
): Record<string, PropertyDescriptor> | null {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) return null;
  const stringKeys = ownKeys as string[];
  if (expectedKeys !== undefined) {
    const actual = [...stringKeys].sort();
    const expected = [...expectedKeys].sort();
    if (
      actual.length !== expected.length ||
      actual.some((key, index) => key !== expected[index])
    ) {
      return null;
    }
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (
    stringKeys.some((key) => {
      const descriptor = descriptors[key];
      return descriptor === undefined || !descriptor.enumerable || !("value" in descriptor);
    })
  ) {
    return null;
  }
  return descriptors;
}

function validateRecord(value: unknown): value is Phase4CriterionRecord {
  if (!isPlainRecord(value)) return false;
  const descriptors = exactEnumerableDataProperties(
    value,
    ["criterion", "passed", "summary", "measurements"],
  );
  if (descriptors === null) return false;
  const criterion = descriptors.criterion.value as unknown;
  const passed = descriptors.passed.value as unknown;
  const summary = descriptors.summary.value as unknown;
  const measurements = descriptors.measurements.value as unknown;
  if (typeof criterion !== "string" || !allCriterionNames.has(criterion as Phase4CriterionName)) {
    return false;
  }
  if (typeof passed !== "boolean" || typeof summary !== "string" || summary.trim().length === 0) {
    return false;
  }
  if (!isPlainRecord(measurements)) return false;
  const measurementDescriptors = exactEnumerableDataProperties(measurements);
  if (measurementDescriptors === null) return false;
  return Object.values(measurementDescriptors).every((descriptor) => {
    const measurement = descriptor.value as unknown;
    return (
      measurement === null ||
      typeof measurement === "string" ||
      typeof measurement === "boolean" ||
      (typeof measurement === "number" && Number.isFinite(measurement) && !Object.is(measurement, -0))
    );
  });
}

interface RecordSetValidation<N extends Phase4CriterionName> {
  readonly contractFailures: readonly string[];
  readonly records: readonly Phase4CriterionRecord<N>[];
}

function validateRecordSet<N extends Phase4CriterionName>(
  values: readonly unknown[],
  required: readonly N[],
  label: string,
): RecordSetValidation<N> {
  const requiredSet = new Set<Phase4CriterionName>(required);
  const contractFailures: string[] = [];
  const accepted: Phase4CriterionRecord<N>[] = [];
  const counts = new Map<Phase4CriterionName, number>();

  values.forEach((value, index) => {
    if (!validateRecord(value)) {
      contractFailures.push(`${label}-RECORD: record ${index} is malformed or has an unknown criterion`);
      return;
    }
    if (!requiredSet.has(value.criterion)) {
      contractFailures.push(`${label}-UNEXPECTED: ${value.criterion} is not a ${label} criterion`);
      return;
    }
    const count = (counts.get(value.criterion) ?? 0) + 1;
    counts.set(value.criterion, count);
    if (count === 1) accepted.push(value as Phase4CriterionRecord<N>);
  });

  for (const name of required) {
    const count = counts.get(name) ?? 0;
    if (count === 0) contractFailures.push(`${label}-MISSING: required criterion ${name} is absent`);
    if (count > 1) contractFailures.push(`${label}-DUPLICATE: criterion ${name} appears ${count} times`);
  }
  const acceptedByName = new Map(accepted.map((item) => [item.criterion, item]));
  return {
    contractFailures,
    records: required.flatMap((name) => {
      const item = acceptedByName.get(name);
      return item === undefined ? [] : [item];
    }),
  };
}

export interface Gate4AVerdict {
  readonly pass: "A";
  readonly contractFailures: readonly string[];
  readonly blockingFailures: readonly (AExecutionCriterion | AMorphologyCriterion)[];
  readonly executionValid: boolean;
  readonly morphologyPass: boolean;
  readonly gatePass: boolean;
  readonly exitCode: 0 | 1;
  readonly records: readonly Phase4CriterionRecord<AExecutionCriterion | AMorphologyCriterion>[];
}

export function evaluateGate4A(records: readonly unknown[]): Gate4AVerdict {
  const required = [...A_EXECUTION_CRITERIA, ...A_MORPHOLOGY_CRITERIA] as const;
  const validated = validateRecordSet(records, required, "A");
  const byName = new Map(validated.records.map((item) => [item.criterion, item]));
  const executionValid =
    validated.contractFailures.length === 0 &&
    A_EXECUTION_CRITERIA.every((name) => byName.get(name)?.passed === true);
  const morphologyPass =
    validated.contractFailures.length === 0 &&
    A_MORPHOLOGY_CRITERIA.every((name) => byName.get(name)?.passed === true);
  const blockingFailures = required.filter((name) => byName.get(name)?.passed === false);
  const gatePass = executionValid && morphologyPass;
  return {
    pass: "A",
    contractFailures: validated.contractFailures,
    blockingFailures,
    executionValid,
    morphologyPass,
    gatePass,
    exitCode: gatePass ? 0 : 1,
    records: validated.records,
  };
}

export interface Gate4BVerdict {
  readonly pass: "B";
  readonly contractFailures: readonly string[];
  readonly executionFailures: readonly BExecutionCriterion[];
  readonly diagnosticFailures: readonly BMorphologyCriterion[];
  readonly executionValid: boolean;
  readonly diagnosticPass: boolean;
  /** Pass B gate status means execution-valid and complete, never morphology-positive. */
  readonly gatePass: boolean;
  readonly exitCode: 0 | 1;
  readonly records: readonly Phase4CriterionRecord<BExecutionCriterion | BMorphologyCriterion>[];
}

export function evaluateGate4B(records: readonly unknown[]): Gate4BVerdict {
  const required = [...B_EXECUTION_CRITERIA, ...B_MORPHOLOGY_CRITERIA] as const;
  const validated = validateRecordSet(records, required, "B");
  const byName = new Map(validated.records.map((item) => [item.criterion, item]));
  const executionFailures = B_EXECUTION_CRITERIA.filter(
    (name) => byName.get(name)?.passed === false,
  );
  const diagnosticFailures = B_MORPHOLOGY_CRITERIA.filter(
    (name) => byName.get(name)?.passed === false,
  );
  const executionValid =
    validated.contractFailures.length === 0 && executionFailures.length === 0;
  const diagnosticPass =
    validated.contractFailures.length === 0 && diagnosticFailures.length === 0;
  return {
    pass: "B",
    contractFailures: validated.contractFailures,
    executionFailures,
    diagnosticFailures,
    executionValid,
    diagnosticPass,
    gatePass: executionValid,
    exitCode: executionValid ? 0 : 1,
    records: validated.records,
  };
}

export interface Gate4VisualVerdict {
  readonly contractFailures: readonly string[];
  readonly failures: readonly Phase4VisualCriterion[];
  readonly passed: boolean;
  readonly records: readonly Phase4CriterionRecord<Phase4VisualCriterion>[];
}

export function evaluateGate4Visual(records: readonly unknown[]): Gate4VisualVerdict {
  const validated = validateRecordSet(records, PHASE4_VISUAL_CRITERIA, "V4");
  const failures = validated.records
    .filter((item) => !item.passed)
    .map((item) => item.criterion);
  return {
    contractFailures: validated.contractFailures,
    failures,
    passed: validated.contractFailures.length === 0 && failures.length === 0,
    records: validated.records,
  };
}

export interface Gate4AggregateVerdict {
  readonly passA: Gate4AVerdict;
  readonly passB: Gate4BVerdict;
  readonly gatePass: boolean;
  readonly exitCode: 0 | 1;
  /** Retained even when false and aggregate exit is zero. */
  readonly passBDiagnosticPass: boolean;
  readonly passBDiagnosticFailures: readonly BMorphologyCriterion[];
}

export function evaluateGate4Aggregate(
  recordsA: readonly unknown[],
  recordsB: readonly unknown[],
): Gate4AggregateVerdict {
  const passA = evaluateGate4A(recordsA);
  const passB = evaluateGate4B(recordsB);
  const gatePass = passA.gatePass && passB.executionValid;
  return {
    passA,
    passB,
    gatePass,
    exitCode: gatePass ? 0 : 1,
    passBDiagnosticPass: passB.diagnosticPass,
    passBDiagnosticFailures: passB.diagnosticFailures,
  };
}

// ── Habit sweeps ───────────────────────────────────────────────────────────────────────────

export const A_HABIT_CONTROLS = [0, 0.25, 0.5, 0.75, 1] as const;
export const A_HABIT_BETA_01 = [3, 2.5, 2, 1.5, 1] as const;
export const B_HABIT_TEMPERATURES = [-5, -7.5, -10, -12.5, -15] as const;
export const SIZE_TARGET_STOP_REASON = "size-target";
export const A_HABIT_TARGET_LARGEST_EXTENT = 14;
export const A_HABIT_STEP_CAP = 12_000;

interface RawExtentCrossing {
  readonly previousCycle: number;
  readonly crossingCycle: number;
  readonly previousLargestExtent: number;
  readonly crossingLargestExtent: number;
}

function validRawExtentCrossing(
  value: RawExtentCrossing,
  target: number,
  stepCap?: number,
): boolean {
  return (
    Number.isSafeInteger(value.previousCycle) &&
    !Object.is(value.previousCycle, -0) &&
    value.previousCycle >= 0 &&
    Number.isSafeInteger(value.crossingCycle) &&
    !Object.is(value.crossingCycle, -0) &&
    value.crossingCycle === value.previousCycle + 1 &&
    (stepCap === undefined || value.crossingCycle < stepCap) &&
    Number.isSafeInteger(value.previousLargestExtent) &&
    !Object.is(value.previousLargestExtent, -0) &&
    value.previousLargestExtent > 0 &&
    value.previousLargestExtent < target &&
    Number.isSafeInteger(value.crossingLargestExtent) &&
    !Object.is(value.crossingLargestExtent, -0) &&
    value.crossingLargestExtent >= target
  );
}

export interface AHabitPoint {
  readonly u: number;
  readonly ggThreshBeta01: number;
  readonly targetLargestExtent: number;
  readonly stepCap: number;
  readonly stopReason: string;
  readonly previousCycle: number;
  readonly crossingCycle: number;
  readonly previousLargestExtent: number;
  readonly crossingLargestExtent: number;
  readonly executionValid: boolean;
  readonly commonConfigHash: string;
  readonly aspectRatio: number;
  readonly crossSectionHollowness: number;
  readonly sealedVoidFraction: number;
}

function finitePositiveAspect(value: number): boolean {
  return Number.isFinite(value) && !Object.is(value, -0) && value > 0;
}

export function evaluateAHabit(points: readonly AHabitPoint[]): readonly Phase4CriterionRecord<AMorphologyCriterion>[] {
  const ordered =
    points.length === A_HABIT_CONTROLS.length &&
    points.every(
      (point, index) =>
        !Object.is(point.u, -0) &&
        !Object.is(point.ggThreshBeta01, -0) &&
        point.u === A_HABIT_CONTROLS[index] &&
        point.ggThreshBeta01 === A_HABIT_BETA_01[index],
    );
  const hashes = new Set(points.map((point) => point.commonConfigHash));
  const complete =
    ordered &&
    points.every(
      (point) =>
        point.targetLargestExtent === A_HABIT_TARGET_LARGEST_EXTENT &&
        point.stepCap === A_HABIT_STEP_CAP &&
        point.stopReason === SIZE_TARGET_STOP_REASON &&
        validRawExtentCrossing(
          point,
          A_HABIT_TARGET_LARGEST_EXTENT,
          A_HABIT_STEP_CAP,
        ) &&
        point.executionValid === true &&
        /^[0-9a-f]{64}$/.test(point.commonConfigHash) &&
        Number.isFinite(point.aspectRatio) &&
        point.aspectRatio > 0 &&
        Number.isFinite(point.crossSectionHollowness) &&
        !Object.is(point.crossSectionHollowness, -0) &&
        point.crossSectionHollowness >= 0 &&
        point.crossSectionHollowness <= 1 &&
        Number.isFinite(point.sealedVoidFraction) &&
        !Object.is(point.sealedVoidFraction, -0) &&
        point.sealedVoidFraction >= 0 &&
        point.sealedVoidFraction <= 1,
    ) &&
    hashes.size === 1;
  const first = ordered ? points[0] : undefined;
  const last = ordered ? points[points.length - 1] : undefined;
  const endpoints =
    first !== undefined &&
    last !== undefined &&
    finitePositiveAspect(first.aspectRatio) &&
    finitePositiveAspect(last.aspectRatio) &&
    first.aspectRatio <= 0.3 &&
    last.aspectRatio >= 1.5;
  const solid =
    last !== undefined &&
    !Object.is(last.crossSectionHollowness, -0) &&
    !Object.is(last.sealedVoidFraction, -0) &&
    last.crossSectionHollowness === 0 &&
    last.sealedVoidFraction === 0;
  const monotone =
    ordered &&
    points.every(
      (point, index) =>
        index === 0 ||
        (Number.isFinite(point.aspectRatio) && point.aspectRatio > points[index - 1].aspectRatio),
    ) &&
    (points[0]?.aspectRatio ?? 0) > 0;
  return [
    record("A-HABIT-GROWTH", complete, complete ? "registered sweep complete" : "registered sweep incomplete, reordered, invalid, or changed common configuration", { points: points.length, commonConfigCount: hashes.size }),
    record("A-HABIT-ENDPOINTS", endpoints, endpoints ? "plate and column endpoints pass" : "registered endpoint aspect ratios do not invert", { plateAspectRatio: finiteOrNull(first?.aspectRatio ?? Number.NaN), columnAspectRatio: finiteOrNull(last?.aspectRatio ?? Number.NaN) }),
    record("A-HABIT-SOLID", solid, solid ? "column endpoint is solid" : "column endpoint is hollow or sealed", { crossSectionHollowness: finiteOrNull(last?.crossSectionHollowness ?? Number.NaN), sealedVoidFraction: finiteOrNull(last?.sealedVoidFraction ?? Number.NaN) }),
    record("A-HABIT-MONOTONE", monotone, monotone ? "aspect ratio is strictly increasing" : "aspect ratio is not strictly increasing in registered control order", { points: points.length }),
  ];
}

export interface BHabitPoint {
  readonly tempC: number;
  readonly aspectRatio: number;
  readonly crossSectionHollowness: number;
  readonly sealedVoidFraction: number;
}

function habitClass(aspect: number): "plate" | "neutral" | "column" | "invalid" {
  if (!Number.isFinite(aspect)) return "invalid";
  if (aspect <= 1 / 1.5) return "plate";
  if (aspect >= 1.5) return "column";
  return "neutral";
}

export function evaluateBHabit(points: readonly BHabitPoint[]): readonly Phase4CriterionRecord<BMorphologyCriterion>[] {
  const ordered =
    points.length === B_HABIT_TEMPERATURES.length &&
    points.every((point, index) => point.tempC === B_HABIT_TEMPERATURES[index]);
  const first = ordered ? points[0] : undefined;
  const last = ordered ? points[points.length - 1] : undefined;
  const endpoints =
    first !== undefined &&
    last !== undefined &&
    finitePositiveAspect(first.aspectRatio) &&
    finitePositiveAspect(last.aspectRatio) &&
    first.aspectRatio <= 1 / 1.5 &&
    last.aspectRatio >= 1.5;
  const solid =
    last !== undefined &&
    !Object.is(last.crossSectionHollowness, -0) &&
    !Object.is(last.sealedVoidFraction, -0) &&
    last.crossSectionHollowness === 0 &&
    last.sealedVoidFraction === 0;
  const classes = points.map((point) => habitClass(point.aspectRatio));
  const nonDecreasing =
    ordered &&
    points.every(
      (point, index) =>
        index === 0 ||
        (Number.isFinite(point.aspectRatio) && point.aspectRatio >= points[index - 1].aspectRatio),
    );
  let seenColumn = false;
  let categoricalValid = classes.every((value) => value !== "invalid");
  for (const value of classes) {
    if (value === "column") seenColumn = true;
    if (seenColumn && value === "plate") categoricalValid = false;
  }
  const monotone = nonDecreasing && categoricalValid && (points[0]?.aspectRatio ?? 0) > 0;
  return [
    record("B-HABIT-ENDPOINTS", endpoints, endpoints ? "diagnostic endpoints invert" : "diagnostic endpoints do not invert", { warmAspectRatio: finiteOrNull(first?.aspectRatio ?? Number.NaN), coldAspectRatio: finiteOrNull(last?.aspectRatio ?? Number.NaN) }),
    record("B-HABIT-SOLID", solid, solid ? "cold endpoint is solid" : "cold endpoint is hollow or missing", { crossSectionHollowness: finiteOrNull(last?.crossSectionHollowness ?? Number.NaN), sealedVoidFraction: finiteOrNull(last?.sealedVoidFraction ?? Number.NaN) }),
    record("B-HABIT-MONOTONE", monotone, monotone ? "diagnostic sweep is non-decreasing" : "diagnostic sweep is incomplete, reordered, decreasing, or categorically reversed", { points: points.length }),
  ];
}

// ── Depletion ───────────────────────────────────────────────────────────────────────────────

export interface DepletionSample {
  readonly targetExtent: number;
  readonly tExtent: number;
  readonly depletionRatio: number;
  readonly previousCycle: number;
  readonly crossingCycle: number;
  readonly previousLargestExtent: number;
  readonly crossingLargestExtent: number;
}

export interface DepletionFinalEvidence {
  readonly targetExtent: number;
  readonly stopReason: string;
  readonly completedCycles: number;
  readonly largestExtent: number;
  readonly aspectRatio: number;
}

export interface BDepletionFinalEvidence extends DepletionFinalEvidence {
  readonly stepCap: number;
}

function ordinaryMedian(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function registeredSamples(samples: readonly DepletionSample[], targets: readonly number[]): boolean {
  return (
    samples.length === targets.length &&
    samples.every((sample, index) => {
      const previous = samples[index - 1];
      const sharedCrossing =
        previous !== undefined &&
        sample.previousCycle === previous.previousCycle &&
        sample.crossingCycle === previous.crossingCycle &&
        sample.previousLargestExtent === previous.previousLargestExtent &&
        sample.crossingLargestExtent === previous.crossingLargestExtent &&
        Object.is(sample.tExtent, previous.tExtent) &&
        Object.is(sample.depletionRatio, previous.depletionRatio);
      const chronologicalProgress =
        previous !== undefined &&
        sample.crossingCycle > previous.crossingCycle &&
        sample.previousCycle >= previous.crossingCycle &&
        sample.previousLargestExtent >= previous.crossingLargestExtent &&
        (sample.previousCycle !== previous.crossingCycle ||
          sample.previousLargestExtent === previous.crossingLargestExtent);
      return (
        sample.targetExtent === targets[index] &&
        validRawExtentCrossing(sample, sample.targetExtent) &&
        Number.isSafeInteger(sample.tExtent) &&
        !Object.is(sample.tExtent, -0) &&
        sample.tExtent > 0 &&
        sample.tExtent <= sample.crossingLargestExtent &&
        (previous === undefined || sharedCrossing || chronologicalProgress)
      );
    })
  );
}

function finalDepletionEvidenceMatches(
  final: DepletionFinalEvidence,
  target: number,
  lastSample: DepletionSample | undefined,
): boolean {
  return (
    lastSample !== undefined &&
    final.targetExtent === target &&
    final.stopReason === SIZE_TARGET_STOP_REASON &&
    Number.isSafeInteger(final.completedCycles) &&
    !Object.is(final.completedCycles, -0) &&
    final.completedCycles === lastSample.crossingCycle &&
    Number.isSafeInteger(final.largestExtent) &&
    !Object.is(final.largestExtent, -0) &&
    final.largestExtent === lastSample.crossingLargestExtent &&
    Number.isFinite(final.aspectRatio) &&
    !Object.is(final.aspectRatio, -0) &&
    final.aspectRatio > 0
  );
}

export function evaluateADepletion(
  samples: readonly DepletionSample[],
  final: DepletionFinalEvidence,
): readonly Phase4CriterionRecord<AMorphologyCriterion>[] {
  const targets = [12, 16, 20, 24, 28, 32, 36];
  const registered =
    registeredSamples(samples, targets) &&
    finalDepletionEvidenceMatches(final, 36, samples[samples.length - 1]);
  const ratios = samples.map((sample) => sample.depletionRatio);
  const defined =
    registered && ratios.every((value) => Number.isFinite(value) && !Object.is(value, -0));
  const widening =
    registered &&
    samples.every((sample, index) => index === 0 || sample.tExtent >= samples[index - 1].tExtent) &&
    samples[samples.length - 1].tExtent >= samples[0].tExtent + 4;
  const median = defined ? ordinaryMedian(ratios) : Number.NaN;
  const belowOne = defined ? ratios.filter((value) => value < 1).length : 0;
  const signal = defined && median <= 0.85 && belowOne >= 6;
  return [
    record("A-DEPLETION-COLUMN", registered && final.aspectRatio >= 1.5, "final widening run column and registered stop check", { finalAspectRatio: finiteOrNull(final.aspectRatio), stopReason: final.stopReason, finalLargestExtent: finiteOrNull(final.largestExtent) }),
    record("A-DEPLETION-DEFINED", defined, defined ? "all registered ratios are finite" : "registered depletion series is incomplete or non-finite", { samples: samples.length }),
    record("A-DEPLETION-WIDENING", widening, widening ? "transverse extent widens sufficiently" : "transverse extent did not widen monotonically by four", { firstT: finiteOrNull(samples[0]?.tExtent ?? Number.NaN), lastT: finiteOrNull(samples[samples.length - 1]?.tExtent ?? Number.NaN) }),
    record("A-DEPLETION-SIGNAL", signal, signal ? "registered depletion signal passes" : "registered depletion signal misses median/count thresholds", { median: finiteOrNull(median), belowOne }),
  ];
}

export function evaluateBDepletion(
  samples: readonly DepletionSample[],
  final: BDepletionFinalEvidence,
): readonly Phase4CriterionRecord<BMorphologyCriterion>[] {
  const targets = [10, 12, 14, 16, 18, 20, 22, 24];
  const registered =
    registeredSamples(samples, targets) &&
    final.stepCap === 50_000 &&
    finalDepletionEvidenceMatches(final, 24, samples[samples.length - 1]) &&
    final.completedCycles < final.stepCap;
  const ratios = samples.map((sample) => sample.depletionRatio);
  const finite =
    registered && ratios.every((value) => Number.isFinite(value) && !Object.is(value, -0));
  const median = finite ? ordinaryMedian(ratios) : Number.NaN;
  const belowFraction = finite ? ratios.filter((value) => value < 1).length / ratios.length : 0;
  const signal =
    finite && final.aspectRatio >= 1.5 && median <= 0.9 && belowFraction >= 0.8;
  const widening =
    registered &&
    samples.every((sample, index) => index === 0 || sample.tExtent >= samples[index - 1].tExtent) &&
    samples[samples.length - 1].tExtent >= samples[0].tExtent + 2;
  return [
    record("B-DEPLETION", signal, signal ? "diagnostic depletion signal passes" : "diagnostic depletion signal misses", { finalAspectRatio: finiteOrNull(final.aspectRatio), median: finiteOrNull(median), belowFraction: finiteOrNull(belowFraction), stopReason: final.stopReason }),
    record("B-DEPLETION-WIDENING", widening, widening ? "diagnostic transverse widening passes" : "diagnostic transverse widening misses", { firstT: finiteOrNull(samples[0]?.tExtent ?? Number.NaN), lastT: finiteOrNull(samples[samples.length - 1]?.tExtent ?? Number.NaN) }),
  ];
}

// ── Hollowing ensembles ────────────────────────────────────────────────────────────────────

export interface HollowState {
  readonly occupancy: Uint8Array;
  readonly surfaceField: Float64Array;
  readonly vaporField: Float64Array;
}

export interface HollowRun {
  /** Distinct execution identity; a replay must not reuse the original execution. */
  readonly executionId: string;
  readonly seed: number;
  readonly dims: Dims;
  readonly targetLargestExtent: number;
  readonly stopReason: string;
  readonly previousCycle: number;
  readonly crossingCycle: number;
  readonly previousLargestExtent: number;
  readonly crossingLargestExtent: number;
  readonly executionValid: boolean;
  readonly initialOccupancy: Uint8Array;
  readonly previousOccupancy: Uint8Array;
  readonly state: HollowState;
}

interface DerivedHollowRun {
  readonly initialHollowness: number;
  readonly finalHollowness: number;
  readonly sealedVoidFraction: number;
  readonly aspectRatio: number;
  readonly domainContact: boolean;
  readonly previousExtents: LatticeExtents;
  readonly finalExtents: LatticeExtents;
  readonly finalOccupancyHash: string;
}

const A_HOLLOW_DIMS: Dims = { nx: 64, ny: 64, nz: 128 };
const B_HOLLOW_DIMS: Dims = { nx: 48, ny: 48, nz: 48 };
const A_HOLLOW_TARGET = 36;
const B_HOLLOW_TARGET = 24;

function bytesOf(array: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
}

function bytesEqual(left: Uint8Array | Float64Array, right: Uint8Array | Float64Array): boolean {
  const leftBytes = bytesOf(left);
  const rightBytes = bytesOf(right);
  if (leftBytes.length !== rightBytes.length) return false;
  for (let index = 0; index < leftBytes.length; index++) {
    if (leftBytes[index] !== rightBytes[index]) return false;
  }
  return true;
}

function buffersOverlap(
  left: Uint8Array | Float64Array,
  right: Uint8Array | Float64Array,
): boolean {
  if (left.buffer !== right.buffer) return false;
  const leftEnd = left.byteOffset + left.byteLength;
  const rightEnd = right.byteOffset + right.byteLength;
  return left.byteOffset < rightEnd && right.byteOffset < leftEnd;
}

function allBuffers(run: HollowRun): readonly (Uint8Array | Float64Array)[] {
  return [
    run.initialOccupancy,
    run.previousOccupancy,
    run.state.occupancy,
    run.state.surfaceField,
    run.state.vaporField,
  ];
}

function hasPairwiseNonoverlappingBuffers(
  buffers: readonly (Uint8Array | Float64Array)[],
): boolean {
  return buffers.every((left, index) =>
    buffers.slice(index + 1).every((right) => !buffersOverlap(left, right)),
  );
}

function occupancyIsBinary(occupancy: Uint8Array): boolean {
  for (const value of occupancy) if (value !== 0 && value !== 1) return false;
  return true;
}

function occupancyIsSubset(subset: Uint8Array, superset: Uint8Array): boolean {
  for (let index = 0; index < subset.length; index++) {
    if (subset[index] === 1 && superset[index] !== 1) return false;
  }
  return true;
}

function exactDims(actual: unknown, expected: Dims): actual is Dims {
  if (!isObject(actual)) return false;
  return (
    Number.isSafeInteger(actual.nx) &&
    Number.isSafeInteger(actual.ny) &&
    Number.isSafeInteger(actual.nz) &&
    actual.nx === expected.nx &&
    actual.ny === expected.ny &&
    actual.nz === expected.nz
  );
}

/** SHA-256 of the raw occupancy bytes; evidence code never trusts a reported hash. */
export function occupancyHash(occupancy: Uint8Array): string {
  return createHash("sha256").update(occupancy).digest("hex");
}

function deriveHollowRun(
  run: HollowRun,
  expectedDims: Dims,
  target: number,
): DerivedHollowRun | undefined {
  if (
    !isObject(run) ||
    !isObject(run.state) ||
    !(run.initialOccupancy instanceof Uint8Array) ||
    !(run.previousOccupancy instanceof Uint8Array) ||
    !(run.state.occupancy instanceof Uint8Array) ||
    !(run.state.surfaceField instanceof Float64Array) ||
    !(run.state.vaporField instanceof Float64Array) ||
    !/^[0-9a-f]{64}$/.test(run.executionId) ||
    !Number.isSafeInteger(run.seed) ||
    Object.is(run.seed, -0) ||
    run.seed < 1 ||
    !exactDims(run.dims, expectedDims) ||
    run.targetLargestExtent !== target ||
    run.stopReason !== SIZE_TARGET_STOP_REASON ||
    run.executionValid !== true ||
    !validRawExtentCrossing(run, target) ||
    !hasPairwiseNonoverlappingBuffers(allBuffers(run))
  ) {
    return undefined;
  }
  const length = cellCount(expectedDims);
  if (
    run.initialOccupancy.length !== length ||
    run.previousOccupancy.length !== length ||
    run.state.occupancy.length !== length ||
    run.state.surfaceField.length !== length ||
    run.state.vaporField.length !== length ||
    !occupancyIsBinary(run.initialOccupancy) ||
    !occupancyIsBinary(run.previousOccupancy) ||
    !occupancyIsBinary(run.state.occupancy) ||
    !occupancyIsSubset(run.initialOccupancy, run.previousOccupancy) ||
    !occupancyIsSubset(run.previousOccupancy, run.state.occupancy)
  ) {
    return undefined;
  }
  const initialExtents = latticeExtents(run.initialOccupancy, expectedDims);
  const previousExtents = latticeExtents(run.previousOccupancy, expectedDims);
  const finalExtents = latticeExtents(run.state.occupancy, expectedDims);
  if (
    initialExtents === null ||
    previousExtents === null ||
    finalExtents === null ||
    previousExtents.largestExtent !== run.previousLargestExtent ||
    finalExtents.largestExtent !== run.crossingLargestExtent
  ) {
    return undefined;
  }
  return {
    initialHollowness: crossSectionHollowness(run.initialOccupancy, expectedDims),
    finalHollowness: crossSectionHollowness(run.state.occupancy, expectedDims),
    sealedVoidFraction: sealedVoidFraction(run.state.occupancy, expectedDims),
    aspectRatio: aspectRatio(run.state.occupancy, expectedDims),
    domainContact: domainContact(run.state.occupancy, expectedDims),
    previousExtents,
    finalExtents,
    finalOccupancyHash: occupancyHash(run.state.occupancy),
  };
}

function replayEqual(
  left: HollowRun | undefined,
  right: HollowRun | undefined,
  expectedDims: Dims,
  target: number,
): boolean {
  if (left === undefined || right === undefined || left === right) return false;
  const leftDerived = deriveHollowRun(left, expectedDims, target);
  const rightDerived = deriveHollowRun(right, expectedDims, target);
  if (leftDerived === undefined || rightDerived === undefined) return false;
  const leftBuffers = allBuffers(left);
  const rightBuffers = allBuffers(right);
  return (
    left.executionId !== right.executionId &&
    left.seed === right.seed &&
    deepEqualHollowMetadata(left, right) &&
    leftBuffers.every((leftBuffer) =>
      rightBuffers.every((rightBuffer) => !buffersOverlap(leftBuffer, rightBuffer)),
    ) &&
    bytesEqual(left.initialOccupancy, right.initialOccupancy) &&
    bytesEqual(left.previousOccupancy, right.previousOccupancy) &&
    bytesEqual(left.state.occupancy, right.state.occupancy) &&
    bytesEqual(left.state.surfaceField, right.state.surfaceField) &&
    bytesEqual(left.state.vaporField, right.state.vaporField)
  );
}

function deepEqualHollowMetadata(left: HollowRun, right: HollowRun): boolean {
  return (
    left.seed === right.seed &&
    left.dims.nx === right.dims.nx &&
    left.dims.ny === right.dims.ny &&
    left.dims.nz === right.dims.nz &&
    left.targetLargestExtent === right.targetLargestExtent &&
    left.stopReason === right.stopReason &&
    left.previousCycle === right.previousCycle &&
    left.crossingCycle === right.crossingCycle &&
    left.previousLargestExtent === right.previousLargestExtent &&
    left.crossingLargestExtent === right.crossingLargestExtent &&
    left.executionValid === right.executionValid
  );
}

export function evaluateAHollow(
  runs: readonly HollowRun[],
  seed1Replay: HollowRun | undefined,
  structuralNoDrivenBranches: boolean,
): readonly Phase4CriterionRecord<AMorphologyCriterion>[] {
  const orderedSeeds = runs.length === 3 && runs.every((run, index) => run.seed === index + 1);
  const derived = runs.map((run) => deriveHollowRun(run, A_HOLLOW_DIMS, A_HOLLOW_TARGET));
  const each =
    orderedSeeds &&
    derived.every(
      (result) =>
        result !== undefined &&
        !result.domainContact &&
        Number.isFinite(result.aspectRatio) &&
        result.aspectRatio >= 1.5 &&
        result.initialHollowness === 0 &&
        Number.isFinite(result.finalHollowness) &&
        result.finalHollowness >= 0.08 &&
        result.finalHollowness <= 1 &&
        result.finalHollowness - result.initialHollowness >= 0.08 &&
        result.sealedVoidFraction === 0,
    );
  const hashes = derived.flatMap((result) =>
    result === undefined ? [] : [result.finalOccupancyHash],
  );
  const replayBitwise =
    seed1Replay !== undefined &&
    !runs.some((run) => run.executionId === seed1Replay.executionId) &&
    replayEqual(runs[0], seed1Replay, A_HOLLOW_DIMS, A_HOLLOW_TARGET);
  const nonvacuous =
    orderedSeeds &&
    derived.every((result) => result !== undefined) &&
    new Set(runs.map((run) => run.executionId)).size === runs.length &&
    new Set(hashes).size >= 2 &&
    replayBitwise;
  return [
    record("A-HOLLOW-EACH", each, each ? "every seed grows a valid open hollow column" : "at least one seed misses the registered hollow-column conditions", { seeds: runs.length }),
    record("A-HOLLOW-NONVACUOUS", nonvacuous, nonvacuous ? "cross-seed occupancy differs and an independent seed-1 execution replays all state bits" : "ensemble is seed-vacuous, execution-aliased, or replay-divergent", { distinctOccupancyHashes: new Set(hashes).size, replayBitwise }),
    record("A-HOLLOW-STRUCTURAL", structuralNoDrivenBranches, structuralNoDrivenBranches ? "solver contains no morphology-driven branch" : "solver structure contains a forbidden morphology-driven branch"),
  ];
}

export function evaluateBHollow(
  runs: readonly HollowRun[],
  seed1Replay: HollowRun | undefined,
): Phase4CriterionRecord<"B-HOLLOW"> {
  const orderedSeeds = runs.length === 3 && runs.every((run, index) => run.seed === index + 1);
  const derived = runs.map((run) => deriveHollowRun(run, B_HOLLOW_DIMS, B_HOLLOW_TARGET));
  const hashes = derived.flatMap((result) =>
    result === undefined ? [] : [result.finalOccupancyHash],
  );
  const replayBitwise =
    seed1Replay !== undefined &&
    !runs.some((run) => run.executionId === seed1Replay.executionId) &&
    replayEqual(runs[0], seed1Replay, B_HOLLOW_DIMS, B_HOLLOW_TARGET);
  const passed =
    orderedSeeds &&
    derived.every(
      (result) =>
        result !== undefined &&
        !result.domainContact &&
        Number.isFinite(result.aspectRatio) &&
        result.aspectRatio >= 1.5 &&
        result.initialHollowness >= 0 &&
        result.initialHollowness <= 1 &&
        result.finalHollowness >= 0.03 &&
        result.finalHollowness <= 1 &&
        result.finalHollowness - result.initialHollowness >= 0.03 &&
        result.sealedVoidFraction === 0,
    ) &&
    new Set(runs.map((run) => run.executionId)).size === runs.length &&
    new Set(hashes).size >= 2 &&
    replayBitwise;
  return record("B-HOLLOW", passed, passed ? "diagnostic hollow ensemble passes" : "diagnostic hollow ensemble misses", { distinctOccupancyHashes: new Set(hashes).size, replayBitwise });
}

// ── Timeline and branch morphology ─────────────────────────────────────────────────────────

export interface ATimelineMeasurements {
  readonly eventCount: number;
  readonly eventZExtent: number;
  readonly eventAspectRatio: number;
  readonly beforeFieldHash: string;
  readonly afterFieldHash: string;
  readonly beforeMass: number;
  readonly afterMass: number;
  readonly profile: CappedColumnProfile | undefined;
  readonly finalZExtent: number;
  readonly stopReason: string;
  readonly finalSymmetryError: number;
  readonly domainContact: boolean;
  readonly maxRelativeMassDrift: number;
}

interface CheckedCapProfile {
  readonly occupiedZExtent: number;
  readonly trunkRadius: number;
  readonly bottomCapRadius: number;
  readonly topCapRadius: number;
  readonly capScore: number;
}

/** Recompute every load-bearing profile field instead of trusting a self-reported score. */
function checkedCapProfile(profile: CappedColumnProfile | undefined): CheckedCapProfile | undefined {
  if (profile === undefined) return undefined;
  const m = profile.occupiedLayers.length;
  if (
    m < 5 ||
    profile.layerRadii.length !== m ||
    profile.occupiedLayers.some((layer) => !Number.isSafeInteger(layer)) ||
    profile.layerRadii.some((radius) => !Number.isSafeInteger(radius) || radius < 0) ||
    profile.occupiedLayers.some(
      (layer, index) => index > 0 && layer !== profile.occupiedLayers[index - 1] + 1,
    )
  ) {
    return undefined;
  }
  const occupiedZExtent = profile.occupiedLayers[m - 1] - profile.occupiedLayers[0] + 1;
  const trunkRankStart = Math.ceil(0.25 * (m - 1));
  const trunkRankEnd = Math.floor(0.75 * (m - 1));
  const capWindowSize = Math.ceil(0.2 * m);
  const trunkValues = profile.layerRadii.slice(trunkRankStart, trunkRankEnd + 1);
  const bottomValues = profile.layerRadii.slice(0, capWindowSize);
  const topValues = profile.layerRadii.slice(m - capWindowSize);
  if (trunkValues.length === 0 || bottomValues.length === 0 || topValues.length === 0) {
    return undefined;
  }
  const trunkRadius = ordinaryMedian(trunkValues);
  if (!(trunkRadius > 0)) return undefined;
  const bottomCapRadius = Math.max(...bottomValues);
  const topCapRadius = Math.max(...topValues);
  const capScore = Math.min(bottomCapRadius, topCapRadius) / trunkRadius;
  if (
    profile.trunkRankStart !== trunkRankStart ||
    profile.trunkRankEnd !== trunkRankEnd ||
    profile.capWindowSize !== capWindowSize ||
    !Object.is(profile.trunkRadius, trunkRadius) ||
    profile.bottomCapRadius !== bottomCapRadius ||
    profile.topCapRadius !== topCapRadius ||
    !Object.is(profile.capScore, capScore)
  ) {
    return undefined;
  }
  return { occupiedZExtent, trunkRadius, bottomCapRadius, topCapRadius, capScore };
}

export function evaluateATimeline(
  value: ATimelineMeasurements,
): readonly Phase4CriterionRecord<AMorphologyCriterion>[] {
  const stage1 =
    Number.isSafeInteger(value.eventZExtent) &&
    value.eventZExtent >= 25 &&
    Number.isFinite(value.eventAspectRatio) &&
    value.eventAspectRatio >= 2;
  const state =
    value.eventCount === 1 &&
    /^[0-9a-f]{64}$/.test(value.beforeFieldHash) &&
    value.beforeFieldHash === value.afterFieldHash &&
    Number.isFinite(value.beforeMass) &&
    Number.isFinite(value.afterMass) &&
    Object.is(value.beforeMass, value.afterMass);
  const profile = checkedCapProfile(value.profile);
  const caps =
    profile !== undefined &&
    Number.isFinite(profile.capScore) &&
    profile.capScore >= 1.2 &&
    profile.bottomCapRadius >= profile.trunkRadius + 2 &&
    profile.topCapRadius >= profile.trunkRadius + 2 &&
    Math.abs(profile.bottomCapRadius - profile.topCapRadius) <= 1 &&
    Number.isSafeInteger(value.finalZExtent) &&
    value.finalZExtent === profile.occupiedZExtent &&
    value.finalZExtent >= 24;
  const valid =
    value.stopReason === "far-field" &&
    !Object.is(value.finalSymmetryError, -0) &&
    value.finalSymmetryError === 0 &&
    !value.domainContact &&
    Number.isFinite(value.maxRelativeMassDrift) &&
    !Object.is(value.maxRelativeMassDrift, -0) &&
    value.maxRelativeMassDrift >= 0 &&
    value.maxRelativeMassDrift < 1e-10;
  return [
    record("A-TIMELINE-STAGE1", stage1, stage1 ? "pre-event shaft is column-like" : "pre-event shaft misses extent/aspect thresholds", { eventZExtent: finiteOrNull(value.eventZExtent), eventAspectRatio: finiteOrNull(value.eventAspectRatio) }),
    record("A-TIMELINE-STATE", state, state ? "one event preserves field bytes and mass bits" : "event count or state continuity fails", { eventCount: finiteOrNull(value.eventCount), fieldHashEqual: value.beforeFieldHash === value.afterFieldHash, massBitEqual: Object.is(value.beforeMass, value.afterMass) }),
    record("A-TIMELINE-CAPS", caps, caps ? "two-cap profile passes" : "two-cap profile is undefined, inconsistent, one-sided, asymmetric, or too small", { capScore: profile === undefined ? null : finiteOrNull(profile.capScore), occupiedZExtent: profile?.occupiedZExtent ?? null, reportedZExtent: finiteOrNull(value.finalZExtent), trunkRadius: profile?.trunkRadius ?? null, bottomCapRadius: profile?.bottomCapRadius ?? null, topCapRadius: profile?.topCapRadius ?? null }),
    record("A-TIMELINE-VALID", valid, valid ? "timeline run remains execution-valid" : "timeline termination, symmetry, contact, or mass validity fails", { finalSymmetryError: finiteOrNull(value.finalSymmetryError), maxRelativeMassDrift: finiteOrNull(value.maxRelativeMassDrift), domainContact: value.domainContact }),
  ];
}

export interface BTimelineMeasurements {
  readonly preEventAspectRatio: number;
  readonly profile: CappedColumnProfile | undefined;
}

export function evaluateBTimeline(value: BTimelineMeasurements): Phase4CriterionRecord<"B-TIMELINE"> {
  const profile = checkedCapProfile(value.profile);
  const passed =
    Number.isFinite(value.preEventAspectRatio) &&
    value.preEventAspectRatio >= 1.5 &&
    profile !== undefined &&
    profile.capScore >= 1.15 &&
    profile.bottomCapRadius >= profile.trunkRadius + 1 &&
    profile.topCapRadius >= profile.trunkRadius + 1 &&
    Math.abs(profile.bottomCapRadius - profile.topCapRadius) <= 1;
  return record("B-TIMELINE", passed, passed ? "diagnostic capped history passes" : "diagnostic capped history misses", { preEventAspectRatio: finiteOrNull(value.preEventAspectRatio), capScore: profile === undefined ? null : finiteOrNull(profile.capScore) });
}

export interface ABranchMeasurements {
  readonly branchCount: number;
  readonly aspectRatio: number;
  readonly finalTExtent: number;
  readonly comparatorTargetTExtent: number;
  readonly comparatorPreviousTExtent: number;
  readonly comparatorFinalTExtent: number;
  readonly comparatorStopReason: string;
  readonly comparatorBranchCount: number;
  readonly comparatorExecutionValid: boolean;
  /** Hash of only the registered shared dims/domain/seed/noise/far-field configuration. */
  readonly dendriteSharedConfigHash: string;
  readonly comparatorSharedConfigHash: string;
}

export const A_BRANCH_COMPARATOR_STOP_REASON = "t-extent-target";

export function evaluateABranch(value: ABranchMeasurements): Phase4CriterionRecord<"A-BRANCH"> {
  const sharedConfigMatches =
    /^[0-9a-f]{64}$/.test(value.dendriteSharedConfigHash) &&
    value.dendriteSharedConfigHash === value.comparatorSharedConfigHash;
  const firstCrossing =
    Number.isSafeInteger(value.comparatorTargetTExtent) &&
    value.comparatorTargetTExtent === value.finalTExtent &&
    Number.isSafeInteger(value.comparatorPreviousTExtent) &&
    value.comparatorPreviousTExtent > 0 &&
    value.comparatorPreviousTExtent < value.finalTExtent &&
    Number.isSafeInteger(value.comparatorFinalTExtent) &&
    value.comparatorFinalTExtent >= value.finalTExtent &&
    value.comparatorStopReason === A_BRANCH_COMPARATOR_STOP_REASON;
  const passed =
    Number.isSafeInteger(value.branchCount) &&
    value.branchCount >= 6 &&
    Number.isFinite(value.aspectRatio) &&
    value.aspectRatio > 0 &&
    value.aspectRatio < 0.3 &&
    Number.isSafeInteger(value.finalTExtent) &&
    value.finalTExtent > 0 &&
    firstCrossing &&
    Number.isSafeInteger(value.comparatorBranchCount) &&
    !Object.is(value.comparatorBranchCount, -0) &&
    value.comparatorBranchCount === 0 &&
    value.comparatorExecutionValid === true &&
    sharedConfigMatches;
  return record("A-BRANCH", passed, passed ? "dendrite and live compact comparator pass" : "branch shape or raw same-size first-crossing comparator evidence fails", { branchCount: finiteOrNull(value.branchCount), aspectRatio: finiteOrNull(value.aspectRatio), finalTExtent: finiteOrNull(value.finalTExtent), comparatorTargetTExtent: finiteOrNull(value.comparatorTargetTExtent), comparatorPreviousTExtent: finiteOrNull(value.comparatorPreviousTExtent), comparatorFinalTExtent: finiteOrNull(value.comparatorFinalTExtent), comparatorStopReason: value.comparatorStopReason, comparatorBranchCount: finiteOrNull(value.comparatorBranchCount), firstCrossing, sharedConfigMatches });
}

export function evaluateBBranch(
  branchCount: number,
  aspectRatio: number,
): Phase4CriterionRecord<"B-BRANCH"> {
  const passed = Number.isSafeInteger(branchCount) && branchCount >= 6 && Number.isFinite(aspectRatio) && aspectRatio > 0 && aspectRatio < 0.3;
  return record("B-BRANCH", passed, passed ? "diagnostic high-supersaturation branch result passes" : "diagnostic high-supersaturation branch result misses", { branchCount: finiteOrNull(branchCount), aspectRatio: finiteOrNull(aspectRatio) });
}
