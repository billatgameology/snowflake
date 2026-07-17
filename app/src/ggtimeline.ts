// Worker-side G-G schedule runtime (V4-2): thin, unit-testable wiring around the SHARED
// @vcc/core schedule evaluator (evaluateTimelineBoundary). This module contains NO trigger
// logic of its own — eligibility, first-crossing proof, ambiguity rejection, and cursor
// provenance all come from @vcc/core, exactly as in the runner (plan, "Timeline API and
// replay integrity": the app worker and runner consume the same schedule evaluator).
//
// The runtime's only jobs: keep the retained cursor (a no-event boundary still advances it —
// discarding it discards first-crossing provenance), call the caller's atomic applier when an
// event fires (the worker passes GGSolver.applyTimelineEnvironment, the same solver API the
// runner uses; decision 0011 — events replace parameter vectors and leave a/b/d untouched),
// and summarize progress for snapshots.

import {
  createTimelineCursor,
  evaluateTimelineBoundary,
  type GGTimelineEnvironment,
  type GGTimelineEvent,
  type GGTimelineSchedule,
  type LatticeExtents,
  type TimelineBoundary,
  type TimelineCursor,
  type TimelineEventLogEntry,
} from "@vcc/core";
import type { TimelineSummary } from "./protocol.ts";

export interface GGScheduleRuntime {
  readonly schedule: GGTimelineSchedule;
  cursor: TimelineCursor;
}

export function createScheduleRuntime(schedule: GGTimelineSchedule): GGScheduleRuntime {
  return { schedule, cursor: createTimelineCursor(schedule) };
}

export interface AppliedTimelineEvent {
  readonly event: GGTimelineEvent;
  readonly logEntry: TimelineEventLogEntry;
}

/** The tick-0 boundary, evaluated once before the first solver cycle. */
export function initialBoundary(): TimelineBoundary {
  return { phase: "initial", completedCycles: 0 };
}

/** The boundary after one complete interface step, before the next relaxation. */
export function completedCycleBoundary(
  completedCycles: number,
  extents: LatticeExtents,
): TimelineBoundary {
  return { phase: "afterInterfaceStep", completedCycles, extents };
}

/**
 * Evaluate one legal boundary. When an event is eligible, `apply` runs FIRST (the solver
 * rejects illegal states before mutating); only after it returns is the advanced cursor
 * committed, so a failed application never records the event as fired. When no event is
 * eligible the evaluated cursor is still retained.
 */
export function evaluateScheduleBoundary(
  runtime: GGScheduleRuntime,
  boundary: TimelineBoundary,
  apply: (environment: GGTimelineEnvironment) => void,
): AppliedTimelineEvent | null {
  const decision = evaluateTimelineBoundary(runtime.schedule, runtime.cursor, boundary);
  if (decision.event === null) {
    runtime.cursor = decision.cursor;
    return null;
  }
  const event = decision.event as GGTimelineEvent;
  apply(event.environment);
  runtime.cursor = decision.cursor;
  return { event, logEntry: decision.logEntry as TimelineEventLogEntry };
}

/** Snapshot-ready progress summary (pure data; safe to postMessage). */
export function timelineSummaryOf(runtime: GGScheduleRuntime | null): TimelineSummary | null {
  if (runtime === null) return null;
  const log = runtime.cursor.eventLog;
  const last = log.length > 0 ? log[log.length - 1] : null;
  return {
    appliedEvents: runtime.cursor.nextEventIndex,
    totalEvents: runtime.schedule.events.length,
    lastEventCycle: last === null ? null : last.crossingBoundary.completedCycles,
  };
}
