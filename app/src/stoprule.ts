// Stop-rule evaluation — control-mode independent (external review blocker, 2026-07-16).
//
// The app previously evaluated its stopping rules once per 16-tick batch while single-step
// checked after every tick, so the SAME deterministic trajectory stopped at different ticks
// depending on how it was driven (measured: tick 97 stepped vs 112 free-running on a 16^3
// plate), and batch mode could advance up to 15 ticks past domain contact — post-contact
// state is invalid evidence (charter §3.1) and must never be displayed as live growth.
//
// These helpers make the decision per-tick and mode-independent: stepped and free-running
// stop at the identical tick, and zero ticks advance past the tick where a rule first trips.
// The runner's registered evidence cadence is deliberately NOT this module's business — the
// app's contract is internal consistency, not gate evidence.
//
// Pure and environment-neutral (no DOM, no Worker APIs) so it unit-tests in node.

import { FAR_FIELD_STOP_FRACTION } from "@vcc/solver-cpu";
import type { StopReason } from "./protocol.ts";

export interface StopRuleReadings {
  /** GGSolver.domainContact() — the 65% bounding-box guard (O(1), incremental bbox). */
  readonly domainContact: boolean;
  /** GGSolver.farFieldMean() — mean vapor d over the far-field shell (NaN if no free cells). */
  readonly farFieldMean: number;
  /** rho of the active preset. */
  readonly rho: number;
}

/**
 * The per-tick stop decision (pure). Domain contact is checked first (it invalidates the
 * state outright); then the §7 far-field rule: mean shell vapor strictly below
 * (2/3) * rho. A NaN far-field mean never trips (NaN comparisons are false).
 */
export function evaluateStopRules(r: StopRuleReadings): StopReason {
  if (r.domainContact) return "domain-contact";
  if (r.farFieldMean < FAR_FIELD_STOP_FRACTION * r.rho) return "far-field-stop";
  return null;
}

/** The solver surface this module needs — GGSolver satisfies it structurally. */
export interface SteppableSolver {
  tick: number;
  step(): void;
  domainContact(): boolean;
  farFieldMean(): number;
}

/**
 * Advance up to maxTicks, evaluating the stop rules after EVERY tick and returning
 * immediately when one trips. Both the worker's free-running batches (maxTicks = batch
 * size) and single-step (maxTicks = 1) go through this one loop, which is what makes the
 * stopping tick identical across control modes.
 *
 * `rho` may be a getter: a Phase 4 timeline event can replace the environment (including
 * rho) mid-batch via afterTick, and the very next tick's far-field decision must use the
 * NEW value — a batch-frozen rho would reintroduce a control-mode-dependent stop.
 */
export function advanceUntilStop<S extends SteppableSolver>(
  solver: S,
  rho: number | (() => number),
  maxTicks: number,
  afterTick?: (solver: S) => void,
): { ticksRun: number; stopReason: StopReason } {
  const rhoNow = typeof rho === "number" ? () => rho : rho;
  for (let n = 0; n < maxTicks; n++) {
    solver.step();
    afterTick?.(solver);
    const stopReason = evaluateStopRules({
      domainContact: solver.domainContact(),
      farFieldMean: solver.farFieldMean(),
      rho: rhoNow(),
    });
    if (stopReason !== null) return { ticksRun: n + 1, stopReason };
  }
  return { ticksRun: maxTicks, stopReason: null };
}
