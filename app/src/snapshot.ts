// Snapshot assembly from a live solver (worker-side, but environment-neutral so it tests in
// node). Exists as its own module to pin one load-bearing wiring fact: computeMetrics MUST
// receive the solver's wall mask — without it, hexPrism depletion sampling counts inert wall
// cells (d = 0) as rim vapor and the HUD numbers are silently wrong (WP1's wall parameter;
// see core/src/metrics.ts).

import { computeMetrics } from "@vcc/core";
import type { GGSolver } from "@vcc/solver-cpu";
import type { SnapshotSource, StopReason } from "./protocol.ts";

export function snapshotSourceFromSolver(
  solver: GGSolver,
  attachTick: Uint32Array,
  running: boolean,
  stopReason: StopReason,
): SnapshotSource {
  const farFieldMean = solver.farFieldMean();
  return {
    tick: solver.tick,
    attachedCount: solver.attachedCount,
    boundarySize: solver.boundarySize(),
    farFieldMean,
    domainContact: solver.domainContact(),
    running,
    stopReason,
    a: solver.a,
    b: solver.b,
    d: solver.d,
    attachTick,
    // hexPrism walls make the box-face far-field mean meaningless, so the solver's own
    // shell mean is passed as the override; the wall mask keeps depletion sampling honest.
    metrics: computeMetrics(
      solver.a,
      solver.b,
      solver.d,
      solver.dims,
      solver.center,
      solver.tick,
      farFieldMean,
      solver.wall,
    ),
  };
}
