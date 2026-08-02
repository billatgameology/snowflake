// Pure Phase 4 environment-schedule evaluation (ADR 0011).
//
// This module decides whether an abrupt event is eligible at a completed-cycle boundary. It
// never mutates solver state. CPU solvers and app workers consume the emitted operator-tagged
// event atomically, then retain the returned cursor and enrich the report with field hashes.

import {
  PARAM_CONFIGS,
  paramSlot,
  validateParams,
  type GGParams,
} from "./params.ts";
import type { LatticeExtents } from "./metrics.ts";

export type TimelineOperator = "GGThreshold" | "LibbrechtKinetics";

export type TimelineTrigger =
  | { readonly kind: "tick"; readonly value: number }
  | { readonly kind: "largestExtent"; readonly value: number }
  | { readonly kind: "tExtent"; readonly value: number }
  | { readonly kind: "zExtent"; readonly value: number };

/** Seven meaningful G-G slots, in PARAM_CONFIGS order; unlike GGParams, no NaN wire slot. */
export type GGTimelineVector = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** JSON-safe complete G-G environment. */
export interface GGTimelineEnvironment {
  readonly rho: number;
  readonly phi: number;
  readonly kappa: GGTimelineVector;
  readonly mu: GGTimelineVector;
  readonly ggThreshBeta: GGTimelineVector;
}

/** Complete LK controls permitted to change under ADR 0011 v1. */
export interface LKTimelineEnvironment {
  readonly tempC: number;
  readonly sigmaInfinity: number;
}

export interface GGTimelineEvent {
  readonly index: number;
  readonly operator: "GGThreshold";
  readonly trigger: TimelineTrigger;
  readonly environment: GGTimelineEnvironment;
}

export interface LKTimelineEvent {
  readonly index: number;
  readonly operator: "LibbrechtKinetics";
  readonly trigger: TimelineTrigger;
  readonly environment: LKTimelineEnvironment;
}

export interface GGTimelineSchedule {
  readonly version: 1;
  readonly mode: "abrupt";
  readonly operator: "GGThreshold";
  readonly initialEnvironment: GGTimelineEnvironment;
  readonly events: readonly GGTimelineEvent[];
}

export interface LKTimelineSchedule {
  readonly version: 1;
  readonly mode: "abrupt";
  readonly operator: "LibbrechtKinetics";
  readonly initialEnvironment: LKTimelineEnvironment;
  readonly events: readonly LKTimelineEvent[];
}

export type TimelineSchedule = GGTimelineSchedule | LKTimelineSchedule;
export type TimelineEvent = GGTimelineEvent | LKTimelineEvent;
export type TimelineEnvironment = GGTimelineEnvironment | LKTimelineEnvironment;

/** Tick 0 boundary, before any relaxation. Extents are deliberately unobservable here. */
export interface TimelineInitialBoundary {
  readonly phase: "initial";
  readonly completedCycles: 0;
}

/** Boundary after one complete interface step, before the next relaxation. */
export interface TimelineCompletedCycleBoundary {
  readonly phase: "afterInterfaceStep";
  readonly completedCycles: number;
  readonly extents: LatticeExtents;
}

export type TimelineBoundary = TimelineInitialBoundary | TimelineCompletedCycleBoundary;

export interface TimelineEventLogEntry {
  readonly eventIndex: number;
  readonly operator: TimelineOperator;
  readonly trigger: TimelineTrigger;
  /** Immediate evaluated boundary before the crossing; null only for a tick-0 event. */
  readonly previousBoundary: TimelineBoundary | null;
  /** Exact boundary at which this event first became eligible. */
  readonly crossingBoundary: TimelineBoundary;
  readonly beforeEnvironment: TimelineEnvironment;
  readonly afterEnvironment: TimelineEnvironment;
}

export interface TimelineCursor {
  readonly operator: TimelineOperator;
  /** Deterministic guard against changing a schedule underneath an existing cursor. */
  readonly scheduleFingerprint: string;
  /** Every evaluated boundary advances this snapshot, even when no event fires. */
  readonly lastBoundary: TimelineBoundary | null;
  readonly nextEventIndex: number;
  readonly eventLog: readonly TimelineEventLogEntry[];
}

export interface TimelineDecision {
  /** Null when no event is eligible at this boundary. */
  readonly event: TimelineEvent | null;
  /**
   * Fresh cursor whose lastBoundary is this evaluated boundary. Callers must retain it even
   * when event is null; discarding a no-event cursor discards first-crossing provenance.
   */
  readonly cursor: TimelineCursor;
  /** Independent snapshot: mutating it cannot mutate cursor.eventLog. */
  readonly logEntry: TimelineEventLogEntry | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} keys must be exactly [${wanted.join(", ")}]`);
  }
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (isObject(left) && isObject(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every((key, index) => key === rightKeys[index] && deepEqual(left[key], right[key]))
    );
  }
  return false;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  throw new Error("timeline schedule contains a non-serializable value");
}

/** Stable FNV-1a-64 guard for cursor/schedule identity; report artifacts retain the full schedule. */
function scheduleFingerprint(schedule: TimelineSchedule): string {
  let hash = 0xcbf29ce484222325n;
  for (const character of canonicalJson(schedule)) {
    hash ^= BigInt(character.codePointAt(0) as number);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function cloneTrigger(trigger: TimelineTrigger): TimelineTrigger {
  return { kind: trigger.kind, value: trigger.value };
}

function cloneGGVector(vector: GGTimelineVector): GGTimelineVector {
  return [...vector] as unknown as GGTimelineVector;
}

function cloneEnvironment(
  environment: TimelineEnvironment,
  operator: TimelineOperator,
): TimelineEnvironment {
  if (operator === "GGThreshold") {
    const gg = environment as GGTimelineEnvironment;
    return {
      rho: gg.rho,
      phi: gg.phi,
      kappa: cloneGGVector(gg.kappa),
      mu: cloneGGVector(gg.mu),
      ggThreshBeta: cloneGGVector(gg.ggThreshBeta),
    };
  }
  const lk = environment as LKTimelineEnvironment;
  return { tempC: lk.tempC, sigmaInfinity: lk.sigmaInfinity };
}

function cloneExtents(extents: LatticeExtents): LatticeExtents {
  return {
    iExtent: extents.iExtent,
    jExtent: extents.jExtent,
    zExtent: extents.zExtent,
    tExtent: extents.tExtent,
    largestExtent: extents.largestExtent,
    attachedCount: extents.attachedCount,
  };
}

function cloneBoundary(boundary: TimelineBoundary): TimelineBoundary {
  return boundary.phase === "initial"
    ? { phase: "initial", completedCycles: 0 }
    : {
        phase: "afterInterfaceStep",
        completedCycles: boundary.completedCycles,
        extents: cloneExtents(boundary.extents),
      };
}

function cloneLogEntry(entry: TimelineEventLogEntry): TimelineEventLogEntry {
  return {
    eventIndex: entry.eventIndex,
    operator: entry.operator,
    trigger: cloneTrigger(entry.trigger),
    previousBoundary:
      entry.previousBoundary === null ? null : cloneBoundary(entry.previousBoundary),
    crossingBoundary: cloneBoundary(entry.crossingBoundary),
    beforeEnvironment: cloneEnvironment(entry.beforeEnvironment, entry.operator),
    afterEnvironment: cloneEnvironment(entry.afterEnvironment, entry.operator),
  };
}

function cloneEvent(event: TimelineEvent): TimelineEvent {
  if (event.operator === "GGThreshold") {
    return {
      index: event.index,
      operator: event.operator,
      trigger: cloneTrigger(event.trigger),
      environment: cloneEnvironment(event.environment, event.operator) as GGTimelineEnvironment,
    };
  }
  return {
    index: event.index,
    operator: event.operator,
    trigger: cloneTrigger(event.trigger),
    environment: cloneEnvironment(event.environment, event.operator) as LKTimelineEnvironment,
  };
}

function validateGGVector(value: unknown, label: string): asserts value is GGTimelineVector {
  if (
    !Array.isArray(value) ||
    value.length !== PARAM_CONFIGS.length ||
    value.some((entry) => !Number.isFinite(entry) || Object.is(entry, -0))
  ) {
    throw new Error(`${label} must contain seven finite, non-negative-zero values in PARAM_CONFIGS order`);
  }
}

export function ggParamsFromTimelineEnvironment(environment: GGTimelineEnvironment): GGParams {
  const makeVector = (values: GGTimelineVector): Float64Array => {
    const vector = new Float64Array(8).fill(Number.NaN);
    PARAM_CONFIGS.forEach(([nT, nZ], index) => {
      vector[paramSlot(nT, nZ)] = values[index];
    });
    return vector;
  };
  return {
    rho: environment.rho,
    phi: environment.phi,
    kappa: makeVector(environment.kappa),
    mu: makeVector(environment.mu),
    ggThreshBeta: makeVector(environment.ggThreshBeta),
  };
}

/** Convert existing solver parameters into the schedule's JSON-safe seven-slot form. */
export function ggTimelineEnvironmentFromParams(params: GGParams): GGTimelineEnvironment {
  const validation = validateParams(params);
  if (validation.errors.length > 0) {
    throw new Error(`cannot schedule invalid G-G parameters: ${validation.errors.join("; ")}`);
  }
  const vector = (values: Float64Array): GGTimelineVector =>
    PARAM_CONFIGS.map(([nT, nZ]) => values[paramSlot(nT, nZ)]) as unknown as GGTimelineVector;
  return {
    rho: params.rho,
    phi: params.phi,
    kappa: vector(params.kappa),
    mu: vector(params.mu),
    ggThreshBeta: vector(params.ggThreshBeta),
  };
}

function validateGGEnvironment(
  value: unknown,
  label: string,
): asserts value is GGTimelineEnvironment {
  if (!isObject(value)) throw new Error(`${label} must be an object`);
  requireExactKeys(value, ["rho", "phi", "kappa", "mu", "ggThreshBeta"], label);
  validateGGVector(value.kappa, `${label}.kappa`);
  validateGGVector(value.mu, `${label}.mu`);
  validateGGVector(value.ggThreshBeta, `${label}.ggThreshBeta`);
  if (
    !Number.isFinite(value.rho) ||
    Object.is(value.rho, -0) ||
    !Number.isFinite(value.phi) ||
    Object.is(value.phi, -0)
  ) {
    throw new Error(`${label}.rho and .phi must be finite and must not be negative zero`);
  }
  const environment: GGTimelineEnvironment = {
    rho: value.rho as number,
    phi: value.phi as number,
    kappa: value.kappa,
    mu: value.mu,
    ggThreshBeta: value.ggThreshBeta,
  };
  const validation = validateParams(ggParamsFromTimelineEnvironment(environment));
  if (validation.errors.length > 0) {
    throw new Error(`${label} is not a valid G-G environment: ${validation.errors.join("; ")}`);
  }
}

function validateLKEnvironment(
  value: unknown,
  label: string,
): asserts value is LKTimelineEnvironment {
  if (!isObject(value)) throw new Error(`${label} must be an object`);
  requireExactKeys(value, ["tempC", "sigmaInfinity"], label);
  if (
    !Number.isFinite(value.tempC) ||
    Object.is(value.tempC, -0) ||
    (value.tempC as number) < -50 ||
    (value.tempC as number) > -1
  ) {
    throw new Error(`${label}.tempC must stay in the supported temperature domain [-50, -1]`);
  }
  if (
    !Number.isFinite(value.sigmaInfinity) ||
    Object.is(value.sigmaInfinity, -0) ||
    (value.sigmaInfinity as number) <= 0
  ) {
    throw new Error(`${label}.sigmaInfinity must be finite and > 0`);
  }
}

function validateTrigger(value: unknown, label: string): asserts value is TimelineTrigger {
  if (!isObject(value)) throw new Error(`${label} must be an object`);
  requireExactKeys(value, ["kind", "value"], label);
  if (
    value.kind !== "tick" &&
    value.kind !== "largestExtent" &&
    value.kind !== "tExtent" &&
    value.kind !== "zExtent"
  ) {
    throw new Error(`${label}.kind is not a supported Phase 4 trigger`);
  }
  const minimum = value.kind === "tick" ? 0 : 1;
  if (
    !Number.isSafeInteger(value.value) ||
    Object.is(value.value, -0) ||
    (value.value as number) < minimum
  ) {
    throw new Error(`${label}.value must be a safe integer >= ${minimum}`);
  }
}

/** Validate a complete abrupt schedule before a solver starts. */
export function validateTimelineSchedule(schedule: TimelineSchedule): void {
  const raw = schedule as unknown;
  if (!isObject(raw)) throw new Error("timeline schedule must be an object");
  requireExactKeys(
    raw,
    ["version", "mode", "operator", "initialEnvironment", "events"],
    "timeline schedule",
  );
  if (raw.version !== 1) throw new Error("timeline schedule version must be 1");
  if (raw.mode !== "abrupt") throw new Error("Phase 4 supports abrupt timeline events only");
  if (raw.operator !== "GGThreshold" && raw.operator !== "LibbrechtKinetics") {
    throw new Error("timeline schedule has an unsupported operator");
  }
  if (!Array.isArray(raw.events)) throw new Error("timeline schedule events must be an array");

  if (raw.operator === "GGThreshold") {
    validateGGEnvironment(raw.initialEnvironment, "timeline.initialEnvironment");
  } else {
    validateLKEnvironment(raw.initialEnvironment, "timeline.initialEnvironment");
  }

  const triggerKeys = new Set<string>();
  const lastValueByKind = new Map<TimelineTrigger["kind"], number>();
  let previousEnvironment: unknown = raw.initialEnvironment;
  raw.events.forEach((eventValue, position) => {
    if (!isObject(eventValue)) throw new Error(`timeline.events[${position}] must be an object`);
    requireExactKeys(
      eventValue,
      ["index", "operator", "trigger", "environment"],
      `timeline.events[${position}]`,
    );
    if (
      !Number.isSafeInteger(eventValue.index) ||
      Object.is(eventValue.index, -0) ||
      eventValue.index !== position
    ) {
      throw new Error(`timeline event indices must be contiguous from zero; got ${String(eventValue.index)} at position ${position}`);
    }
    if (eventValue.operator !== raw.operator) {
      throw new Error(`timeline.events[${position}] operator does not match schedule operator`);
    }
    validateTrigger(eventValue.trigger, `timeline.events[${position}].trigger`);
    const triggerKey = `${eventValue.trigger.kind}:${eventValue.trigger.value}`;
    if (triggerKeys.has(triggerKey)) {
      throw new Error(`duplicate timeline trigger declaration ${triggerKey}`);
    }
    triggerKeys.add(triggerKey);
    const previousValue = lastValueByKind.get(eventValue.trigger.kind);
    if (previousValue !== undefined && eventValue.trigger.value <= previousValue) {
      throw new Error(
        `timeline ${eventValue.trigger.kind} triggers must increase strictly in event-index order`,
      );
    }
    lastValueByKind.set(eventValue.trigger.kind, eventValue.trigger.value);

    if (raw.operator === "GGThreshold") {
      validateGGEnvironment(eventValue.environment, `timeline.events[${position}].environment`);
    } else {
      validateLKEnvironment(eventValue.environment, `timeline.events[${position}].environment`);
    }
    if (deepEqual(previousEnvironment, eventValue.environment)) {
      throw new Error(`timeline.events[${position}] is a no-op environment event`);
    }
    previousEnvironment = eventValue.environment;
  });
}

function validateExtents(value: unknown): asserts value is LatticeExtents {
  if (!isObject(value)) throw new Error("timeline extents must be an object");
  requireExactKeys(
    value,
    ["iExtent", "jExtent", "zExtent", "tExtent", "largestExtent", "attachedCount"],
    "timeline extents",
  );
  for (const name of ["iExtent", "jExtent", "zExtent", "tExtent", "largestExtent", "attachedCount"] as const) {
    if (!Number.isSafeInteger(value[name]) || (value[name] as number) <= 0) {
      throw new Error(`timeline extents.${name} must be a positive safe integer`);
    }
  }
  if (value.tExtent !== Math.max(value.iExtent as number, value.jExtent as number)) {
    throw new Error("timeline tExtent does not equal max(iExtent,jExtent)");
  }
  if (value.largestExtent !== Math.max(value.tExtent as number, value.zExtent as number)) {
    throw new Error("timeline largestExtent does not equal max(tExtent,zExtent)");
  }
}

function validateBoundary(boundary: TimelineBoundary): void {
  const raw = boundary as unknown;
  if (!isObject(raw)) throw new Error("timeline boundary must be an object");
  if (raw.phase === "initial") {
    requireExactKeys(raw, ["phase", "completedCycles"], "initial timeline boundary");
    if (!Object.is(raw.completedCycles, 0)) {
      throw new Error("the initial timeline boundary must have exactly zero completed cycles");
    }
    if ("extents" in raw) {
      throw new Error("extent observations are unavailable at the initial boundary");
    }
    return;
  }
  if (raw.phase !== "afterInterfaceStep") {
    throw new Error("timeline events may only be evaluated initially or after a complete interface step");
  }
  requireExactKeys(
    raw,
    ["phase", "completedCycles", "extents"],
    "completed-cycle timeline boundary",
  );
  if (
    !Number.isSafeInteger(raw.completedCycles) ||
    Object.is(raw.completedCycles, -0) ||
    (raw.completedCycles as number) < 1
  ) {
    throw new Error("a completed-cycle timeline boundary must have at least one completed cycle");
  }
  validateExtents(raw.extents);
}

function boundariesAreSequential(
  previous: TimelineBoundary,
  crossing: TimelineBoundary,
): boolean {
  if (crossing.phase !== "afterInterfaceStep") return false;
  return previous.phase === "initial"
    ? crossing.completedCycles === 1
    : crossing.completedCycles === previous.completedCycles + 1;
}

function boundaryCycle(boundary: TimelineBoundary): number {
  return boundary.completedCycles;
}

const MONOTONE_EXTENT_FIELDS = [
  "iExtent",
  "jExtent",
  "zExtent",
  "tExtent",
  "largestExtent",
  "attachedCount",
] as const;

function assertBoundaryExtentsDoNotShrink(
  previous: TimelineBoundary,
  current: TimelineBoundary,
  label: string,
): void {
  if (previous.phase !== "afterInterfaceStep" || current.phase !== "afterInterfaceStep") return;
  for (const name of MONOTONE_EXTENT_FIELDS) {
    if (current.extents[name] < previous.extents[name]) {
      throw new Error(`${label}: timeline extent ${name} cannot shrink`);
    }
  }
}

function environmentBefore(schedule: TimelineSchedule, eventIndex: number): TimelineEnvironment {
  return eventIndex === 0
    ? schedule.initialEnvironment
    : schedule.events[eventIndex - 1].environment;
}

function validateCursor(schedule: TimelineSchedule, cursor: TimelineCursor): void {
  const raw = cursor as unknown;
  if (!isObject(raw) || raw.operator !== schedule.operator) {
    throw new Error("timeline cursor operator does not match schedule operator");
  }
  requireExactKeys(
    raw,
    ["operator", "scheduleFingerprint", "lastBoundary", "nextEventIndex", "eventLog"],
    "timeline cursor",
  );
  if (raw.scheduleFingerprint !== scheduleFingerprint(schedule)) {
    throw new Error("timeline cursor schedule fingerprint does not match the current schedule");
  }
  if (
    !Number.isSafeInteger(raw.nextEventIndex) ||
    Object.is(raw.nextEventIndex, -0) ||
    (raw.nextEventIndex as number) < 0 ||
    (raw.nextEventIndex as number) > schedule.events.length
  ) {
    throw new Error("timeline cursor nextEventIndex is invalid");
  }
  if (!Array.isArray(raw.eventLog) || raw.eventLog.length !== raw.nextEventIndex) {
    throw new Error("timeline cursor log length does not match nextEventIndex");
  }
  if (raw.lastBoundary !== null) validateBoundary(raw.lastBoundary as TimelineBoundary);
  const eventLog = raw.eventLog;
  eventLog.forEach((entryValue, index) => {
    if (
      !isObject(entryValue) ||
      !Number.isSafeInteger(entryValue.eventIndex) ||
      Object.is(entryValue.eventIndex, -0) ||
      entryValue.eventIndex !== index
    ) {
      throw new Error(`timeline cursor log entry ${index} has an invalid event index`);
    }
    requireExactKeys(
      entryValue,
      [
        "eventIndex",
        "operator",
        "trigger",
        "previousBoundary",
        "crossingBoundary",
        "beforeEnvironment",
        "afterEnvironment",
      ],
      `timeline cursor log entry ${index}`,
    );
    const event = schedule.events[index];
    validateTrigger(entryValue.trigger, `timeline cursor log entry ${index}.trigger`);
    if (
      entryValue.operator !== schedule.operator ||
      !deepEqual(entryValue.trigger, event.trigger) ||
      !deepEqual(entryValue.beforeEnvironment, environmentBefore(schedule, index)) ||
      !deepEqual(entryValue.afterEnvironment, event.environment)
    ) {
      throw new Error(`timeline cursor log entry ${index} does not replay the schedule`);
    }
    const previousBoundary = entryValue.previousBoundary as TimelineBoundary | null;
    const crossingBoundary = entryValue.crossingBoundary as TimelineBoundary;
    if (previousBoundary !== null) validateBoundary(previousBoundary);
    validateBoundary(crossingBoundary);
    if (previousBoundary !== null) {
      assertBoundaryExtentsDoNotShrink(
        previousBoundary,
        crossingBoundary,
        `timeline cursor log entry ${index}`,
      );
    }

    if (event.trigger.kind === "tick") {
      if (event.trigger.value === 0) {
        if (
          previousBoundary !== null ||
          crossingBoundary.phase !== "initial" ||
          crossingBoundary.completedCycles !== 0
        ) {
          throw new Error("timeline tick-0 log entry must cross the initial boundary");
        }
      } else {
        if (
          previousBoundary === null ||
          !boundariesAreSequential(previousBoundary, crossingBoundary) ||
          crossingBoundary.completedCycles !== event.trigger.value
        ) {
          throw new Error(`timeline cursor log entry ${index} fired at the wrong tick boundary`);
        }
      }
    } else {
      if (
        previousBoundary === null ||
        previousBoundary.phase !== "afterInterfaceStep" ||
        crossingBoundary.phase !== "afterInterfaceStep" ||
        !boundariesAreSequential(previousBoundary, crossingBoundary)
      ) {
        throw new Error(
          `timeline cursor log entry ${index} lacks consecutive raw extent boundaries`,
        );
      }
      if (
        previousBoundary.extents[event.trigger.kind] >= event.trigger.value ||
        crossingBoundary.extents[event.trigger.kind] < event.trigger.value
      ) {
        throw new Error(
          `timeline cursor log entry ${index} does not prove its first extent crossing`,
        );
      }
    }

    if (index > 0) {
      const priorEntry = eventLog[index - 1] as TimelineEventLogEntry;
      const priorCrossing = priorEntry.crossingBoundary;
      if (boundaryCycle(crossingBoundary) <= boundaryCycle(priorCrossing)) {
        throw new Error("timeline cursor event crossing boundaries must increase strictly");
      }
      if (
        previousBoundary === null ||
        boundaryCycle(previousBoundary) < boundaryCycle(priorCrossing) ||
        (boundaryCycle(previousBoundary) === boundaryCycle(priorCrossing) &&
          !deepEqual(previousBoundary, priorCrossing))
      ) {
        throw new Error("timeline cursor event history is chronologically inconsistent");
      }
      assertBoundaryExtentsDoNotShrink(
        priorCrossing,
        previousBoundary,
        `timeline cursor history before event ${index}`,
      );
    }
  });
  const lastLogEntry = eventLog[eventLog.length - 1] as TimelineEventLogEntry | undefined;
  if (lastLogEntry !== undefined) {
    if (raw.lastBoundary === null) {
      throw new Error("timeline cursor with fired events must retain its last boundary");
    }
    const lastCycles = boundaryCycle(lastLogEntry.crossingBoundary);
    const boundaryCycles = boundaryCycle(raw.lastBoundary as TimelineBoundary);
    if (lastCycles > boundaryCycles) {
      throw new Error("timeline cursor event log extends past its last evaluated boundary");
    }
    if (
      lastCycles === boundaryCycles &&
      !deepEqual(lastLogEntry.crossingBoundary, raw.lastBoundary)
    ) {
      throw new Error("timeline cursor last boundary disagrees with its last event crossing");
    }
    assertBoundaryExtentsDoNotShrink(
      lastLogEntry.crossingBoundary,
      raw.lastBoundary as TimelineBoundary,
      "timeline cursor history after its last event",
    );
  }

  if (raw.lastBoundary !== null) {
    const lastBoundary = raw.lastBoundary as TimelineBoundary;
    const alreadyEligible = schedule.events.slice(raw.nextEventIndex as number).find((event) =>
      event.trigger.kind === "tick"
        ? event.trigger.value <= lastBoundary.completedCycles
        : lastBoundary.phase === "afterInterfaceStep" &&
          lastBoundary.extents[event.trigger.kind] >= event.trigger.value,
    );
    if (alreadyEligible !== undefined) {
      throw new Error(
        `timeline cursor retains already-eligible unfired event ${alreadyEligible.index}`,
      );
    }
  }
}

export function createTimelineCursor(schedule: TimelineSchedule): TimelineCursor {
  validateTimelineSchedule(schedule);
  return {
    operator: schedule.operator,
    scheduleFingerprint: scheduleFingerprint(schedule),
    lastBoundary: null,
    nextEventIndex: 0,
    eventLog: [],
  };
}

function eventIsEligible(event: TimelineEvent, boundary: TimelineBoundary): boolean {
  if (event.trigger.kind === "tick") return boundary.completedCycles === event.trigger.value;
  if (boundary.phase !== "afterInterfaceStep") return false;
  return boundary.extents[event.trigger.kind] >= event.trigger.value;
}

/**
 * Evaluate all unfired events at one legal solver boundary. More than one eligible event is
 * rejected before an event is returned, so a caller cannot accidentally choose an order.
 */
export function evaluateTimelineBoundary(
  schedule: TimelineSchedule,
  cursor: TimelineCursor,
  boundary: TimelineBoundary,
): TimelineDecision {
  validateTimelineSchedule(schedule);
  validateCursor(schedule, cursor);
  validateBoundary(boundary);
  const previousBoundary = cursor.lastBoundary;
  if (previousBoundary === null) {
    if (boundary.phase !== "initial") {
      throw new Error("timeline evaluation must begin at the initial tick-0 boundary");
    }
  } else if (previousBoundary.phase === "initial") {
    if (boundary.phase !== "afterInterfaceStep" || boundary.completedCycles !== 1) {
      throw new Error("the next timeline boundary after tick 0 must be completed cycle 1");
    }
  } else {
    if (
      boundary.phase !== "afterInterfaceStep" ||
      boundary.completedCycles !== previousBoundary.completedCycles + 1
    ) {
      throw new Error(
        `timeline completed-cycle boundaries must be sequential after cycle ${previousBoundary.completedCycles}`,
      );
    }
    assertBoundaryExtentsDoNotShrink(
      previousBoundary,
      boundary,
      "timeline completed-cycle history",
    );
  }

  const evaluatedCursor: TimelineCursor = {
    operator: cursor.operator,
    scheduleFingerprint: cursor.scheduleFingerprint,
    lastBoundary: cloneBoundary(boundary),
    nextEventIndex: cursor.nextEventIndex,
    eventLog: cursor.eventLog.map(cloneLogEntry),
  };

  const unfired = schedule.events.slice(cursor.nextEventIndex);
  const missedTick = unfired.find(
    (event) => event.trigger.kind === "tick" && event.trigger.value < boundary.completedCycles,
  );
  if (missedTick !== undefined) {
    throw new Error(
      `timeline missed tick ${missedTick.trigger.value} before completed cycle ${boundary.completedCycles}`,
    );
  }

  const eligible = unfired.filter((event) => eventIsEligible(event, boundary));
  if (eligible.length > 1) {
    throw new Error(
      `ambiguous timeline boundary at completed cycle ${boundary.completedCycles}: events ` +
        eligible.map((event) => event.index).join(", ") +
        " are simultaneously eligible",
    );
  }
  if (eligible.length === 0) return { event: null, cursor: evaluatedCursor, logEntry: null };

  const scheduledEvent = eligible[0];
  if (scheduledEvent.index !== cursor.nextEventIndex) {
    throw new Error(
      `timeline event ${scheduledEvent.index} became eligible before next event ${cursor.nextEventIndex}`,
    );
  }
  const event = cloneEvent(scheduledEvent);
  if (event.trigger.kind !== "tick" && previousBoundary?.phase !== "afterInterfaceStep") {
    throw new Error(
      `timeline extent event ${event.index} cannot prove a first crossing without a prior extent boundary`,
    );
  }
  const baseLogEntry: TimelineEventLogEntry = {
    eventIndex: event.index,
    operator: schedule.operator,
    trigger: cloneTrigger(event.trigger),
    previousBoundary:
      previousBoundary === null ? null : cloneBoundary(previousBoundary),
    crossingBoundary: cloneBoundary(boundary),
    beforeEnvironment: cloneEnvironment(environmentBefore(schedule, event.index), schedule.operator),
    afterEnvironment: cloneEnvironment(event.environment, schedule.operator),
  };
  const cursorLogEntry = cloneLogEntry(baseLogEntry);
  const returnedLogEntry = cloneLogEntry(baseLogEntry);
  const nextCursor: TimelineCursor = {
    operator: cursor.operator,
    scheduleFingerprint: cursor.scheduleFingerprint,
    lastBoundary: evaluatedCursor.lastBoundary,
    nextEventIndex: cursor.nextEventIndex + 1,
    eventLog: [...evaluatedCursor.eventLog, cursorLogEntry],
  };
  return { event, cursor: nextCursor, logEntry: returnedLogEntry };
}
