// The ENFORCED Phase 3 depletion gate (plan phase-3-dev-visualization, "Gate protocol";
// thresholds REGISTERED 2026-07-15 from the calibration probe, commit d80b426, out/
// phase3-probe.log — the probe is observational and never citable as the gate result).
//
// gate3 is flagless like gate2b: the protocol is pinned here and in the plan. The run is the
// exact 2a canonical plate — GGThreshold, so the sampled field is G-G vapor mass d (model
// units, unvalidated; the depletion metric is a unitless center/rim ratio of that field).
//
// WHY WINDOWED STATISTICS, not a final sample (plan, Tried and rejected): the probe measured
// new basal layers nucleating as RINGS that exclude the starved facet center; during a ring
// episode the center sample at (ic, jc, kTop + 1) floats one layer above the local center
// surface and reads geometrically richer vapor, so a single sample measures layer-cycle
// phase, not starvation (probe finale: ratio 0.58 at tick 4400, then 13.5 -> 4.04 over
// 4500-4800). The registered criteria are therefore a median and a fraction-below-1 over the
// 41 samples at ticks 400..4400; the CSV still records every sample through the natural stop
// so the post-window behavior is on the record, not hidden.
//
// This module exists separately from main.ts so tests can import the pure criteria logic
// (evaluateGate3) without executing main.ts's top-level CLI dispatch — the same pattern as
// runner/src/pgm.ts. Nothing here runs at import time.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  aspectRatio,
  boundingRadius,
  centerRimDepletion,
  computeMetrics,
  decodeCheckpoint,
  domainCenter,
  encodeCheckpoint,
  isD6hInvariantSet,
  symmetryError,
  GG_PRESETS,
  type Dims,
} from "@vcc/core";
import { GGSolver, FAR_FIELD_STOP_FRACTION } from "@vcc/solver-cpu";

// ── The registered protocol (plan, "Gate protocol") — change only via re-registration ──────

export const GATE3_DIMS: Dims = { nx: 128, ny: 128, nz: 64 };
export const GATE3_SEED = 1;
export const GATE3_MAX_TICKS = 10_000;
export const GATE3_STOP_CHECK_EVERY = 25; // same far-field cadence as the probe's grow run
export const GATE3_SAMPLE_EVERY = 100;
export const GATE3_WINDOW_START_TICK = 400;
export const GATE3_WINDOW_END_TICK = 4400;
export const GATE3_WINDOW_SAMPLE_COUNT = 41; // (4400 - 400) / 100 + 1
export const GATE3_REGISTERED_MIN_RADIUS = 30; // probe final boundingRadius 38
export const GATE3_REGISTERED_MAX_MEDIAN = 0.75; // probe window median 0.5315
export const GATE3_REGISTERED_MIN_FRACTION_BELOW_1 = 0.8; // probe 37/41 = 0.902
export const GATE3_MAX_ASPECT_RATIO = 0.3; // probe final AR 0.168831

export const GATE3_CKPT_PATH = "out/gate3-plate.ckpt";
export const GATE3_CSV_PATH = "out/gate3-depletion.csv";

/** One row of the evidence series (and of out/gate3-depletion.csv). */
export interface Gate3Sample {
  readonly tick: number;
  readonly attachedCount: number;
  readonly boundingRadius: number;
  readonly aspectRatio: number;
  readonly depletionCenter: number;
  readonly depletionRim: number;
  readonly depletionRatio: number;
}

/** End-of-run facts the criteria need beyond the sample series. */
export interface Gate3FinalState {
  readonly aspectRatio: number;
  readonly boundingRadius: number;
  readonly domainContact: boolean;
  readonly stopReason: string;
  readonly deltaSymmetricAllTicks: boolean;
  readonly finalSymmetryError: number;
}

export interface Gate3Verdict {
  /** Empty iff the gate passes. Every entry names its criterion and the measured value. */
  readonly failures: readonly string[];
  /** The 21st of the 41 sorted window ratios; NaN when the window is incomplete. */
  readonly windowMedianRatio: number;
  /** Fraction of window samples with depletionRatio < 1; NaN when incomplete. */
  readonly windowFractionBelowOne: number;
  readonly windowComplete: boolean;
}

/**
 * Pure, run-free evaluation of the registered criteria, so tests can trip every named
 * failure on synthetic series (plan: "a criteria unit test proving each named G3 criterion
 * individually trips"). Samples may include pre/post-window rows; the window is extracted by
 * tick arithmetic, never by array position.
 *
 * Windowed statistics are only defined on the complete registered window (the median is BY
 * DEFINITION the 21st of 41 sorted values); an incomplete window is the named G3-WINDOW
 * failure with NaN statistics, never a silently rescaled computation.
 */
export function evaluateGate3(
  samples: readonly Gate3Sample[],
  final: Gate3FinalState,
): Gate3Verdict {
  const failures: string[] = [];

  const window = samples
    .filter(
      (s) =>
        s.tick % GATE3_SAMPLE_EVERY === 0 &&
        s.tick >= GATE3_WINDOW_START_TICK &&
        s.tick <= GATE3_WINDOW_END_TICK,
    )
    .sort((left, right) => left.tick - right.tick);
  const windowComplete =
    window.length === GATE3_WINDOW_SAMPLE_COUNT &&
    window.every((s, n) => s.tick === GATE3_WINDOW_START_TICK + n * GATE3_SAMPLE_EVERY);

  let windowMedianRatio = Number.NaN;
  let windowFractionBelowOne = Number.NaN;
  if (!windowComplete) {
    failures.push(
      `G3-WINDOW: registered window incomplete — expected ${GATE3_WINDOW_SAMPLE_COUNT} samples at ` +
        `ticks ${GATE3_WINDOW_START_TICK}..${GATE3_WINDOW_END_TICK} step ${GATE3_SAMPLE_EVERY}, ` +
        `got ${window.length} (the run must reach tick ${GATE3_WINDOW_END_TICK}); ` +
        `windowed criteria are undefined and the gate cannot pass`,
    );
  } else {
    // G3-GROWTH (window half): strict increase across every consecutive sample pair.
    for (let n = 1; n < window.length; n++) {
      if (!(window[n].attachedCount > window[n - 1].attachedCount)) {
        failures.push(
          `G3-GROWTH: attachedCount did not strictly increase between window samples ` +
            `tick=${window[n - 1].tick} (${window[n - 1].attachedCount}) and ` +
            `tick=${window[n].tick} (${window[n].attachedCount})`,
        );
        break; // first offending pair names the failure; one is enough
      }
    }

    // G3-DEFINED: every window ratio finite. Report the first offender and the total count.
    const nonFinite = window.filter((s) => !Number.isFinite(s.depletionRatio));
    if (nonFinite.length > 0) {
      failures.push(
        `G3-DEFINED: depletionRatio not finite at ${nonFinite.length} window sample(s), ` +
          `first at tick=${nonFinite[0].tick} (value ${nonFinite[0].depletionRatio})`,
      );
    }

    // G3-DEPLETION: registered median + fraction-below-1 over the window. NaN sorts last
    // (deterministically), so a NaN-poisoned series cannot shift finite values past the
    // median index; G3-DEFINED above already names any NaN by itself.
    const sorted = window
      .map((s) => s.depletionRatio)
      .sort((x, y) =>
        Number.isNaN(x) ? (Number.isNaN(y) ? 0 : 1) : Number.isNaN(y) ? -1 : x - y,
      );
    windowMedianRatio = sorted[(GATE3_WINDOW_SAMPLE_COUNT - 1) / 2]; // the 21st of 41
    const below = window.filter((s) => s.depletionRatio < 1).length;
    windowFractionBelowOne = below / GATE3_WINDOW_SAMPLE_COUNT;
    if (!(windowMedianRatio <= GATE3_REGISTERED_MAX_MEDIAN)) {
      failures.push(
        `G3-DEPLETION: window median depletionRatio ${windowMedianRatio} not <= ` +
          `REGISTERED_MAX_MEDIAN ${GATE3_REGISTERED_MAX_MEDIAN}`,
      );
    }
    if (!(windowFractionBelowOne >= GATE3_REGISTERED_MIN_FRACTION_BELOW_1)) {
      failures.push(
        `G3-DEPLETION: fraction of window samples with depletionRatio < 1 is ` +
          `${windowFractionBelowOne} (${below}/${GATE3_WINDOW_SAMPLE_COUNT}), below ` +
          `REGISTERED_MIN_FRACTION_BELOW_1 ${GATE3_REGISTERED_MIN_FRACTION_BELOW_1}`,
      );
    }
  }

  // G3-GROWTH (radius half): the crystal reached gate scale.
  if (!(final.boundingRadius >= GATE3_REGISTERED_MIN_RADIUS)) {
    failures.push(
      `G3-GROWTH: final boundingRadius ${final.boundingRadius} below ` +
        `REGISTERED_MIN_RADIUS ${GATE3_REGISTERED_MIN_RADIUS}`,
    );
  }

  // G3-PLATE: it is a plate.
  if (!(final.aspectRatio < GATE3_MAX_ASPECT_RATIO)) {
    failures.push(
      `G3-PLATE: final aspectRatio ${final.aspectRatio} not < ${GATE3_MAX_ASPECT_RATIO} — ` +
        `not a plate`,
    );
  }

  // G3-VALID: the run is admissible evidence at all.
  if (final.domainContact) {
    failures.push(
      "G3-VALID: domain-contact guard tripped on the final state — not valid evidence " +
        "(charter §3.1)",
    );
  }
  if (final.stopReason !== "far-field" && final.stopReason !== "tick-cap") {
    failures.push(
      `G3-VALID: run ended by ${final.stopReason}, not the far-field stopping rule or the ` +
        `tick budget`,
    );
  }
  if (!final.deltaSymmetricAllTicks) {
    failures.push("G3-VALID: per-tick D6h symmetry delta check broke during the run");
  }
  if (final.finalSymmetryError !== 0) {
    failures.push(
      `G3-VALID: final full symmetry error ${final.finalSymmetryError} (gate requires exactly 0)`,
    );
  }

  return { failures, windowMedianRatio, windowFractionBelowOne, windowComplete };
}

/** CSV serialization: String() keeps full round-trip float precision; NaN prints as NaN. */
export function gate3Csv(samples: readonly Gate3Sample[]): string {
  const rows = samples.map(
    (s) =>
      `${s.tick},${s.attachedCount},${String(s.boundingRadius)},${String(s.aspectRatio)},` +
      `${String(s.depletionCenter)},${String(s.depletionRim)},${String(s.depletionRatio)}`,
  );
  return (
    "tick,attachedCount,boundingRadius,aspectRatio,depletionCenter,depletionRim,depletionRatio\n" +
    rows.join("\n") +
    "\n"
  );
}

// ── The evidence run ────────────────────────────────────────────────────────────────────────

function fmtNum(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toPrecision(6);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

/** Runs the registered protocol, writes the evidence artifacts, exits 1 on any named failure. */
export function gate3(): void {
  const params = GG_PRESETS.plate;
  const dims = GATE3_DIMS;
  const center = domainCenter(dims); // explicit — no mutable constructor defaults in gate paths
  const solver = new GGSolver({
    dims,
    params,
    rngSeed: GATE3_SEED,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    seedRadius: 2,
    center,
  });
  const seedSites = solver.attachedCount;
  if (seedSites !== 19) {
    // Pinned-protocol precondition (gg-machinery §5 erratum: 19, not the paper's 20).
    throw new Error(`gate3: seed initialized as ${seedSites} sites, not the canonical 19`);
  }
  const seedSymErr = symmetryError(solver.a, dims, center);
  if (seedSymErr !== 0) throw new Error("gate3: seed is not D6h-symmetric; aborting");

  console.log(
    `gate3 preset=plate dims=${dims.nx},${dims.ny},${dims.nz} domain=hexPrism ` +
      `(hexRadius=${solver.hexRadius}, zHalfExtent=${solver.zHalfExtent}, ` +
      `activeCells=${solver.activeCellCount}) farField=reflecting seed=${GATE3_SEED} noise=0 ` +
      `seedRadius=2 seedSites=${seedSites} ticks<=${GATE3_MAX_TICKS} ` +
      `window=${GATE3_WINDOW_START_TICK}..${GATE3_WINDOW_END_TICK}x${GATE3_SAMPLE_EVERY} ` +
      `registered: minRadius=${GATE3_REGISTERED_MIN_RADIUS} ` +
      `maxMedian=${GATE3_REGISTERED_MAX_MEDIAN} ` +
      `minFracBelow1=${GATE3_REGISTERED_MIN_FRACTION_BELOW_1} maxAR=${GATE3_MAX_ASPECT_RATIO}`,
  );

  const takeSample = (): Gate3Sample => {
    const depletion = centerRimDepletion(solver.a, solver.d, dims, center, solver.wall);
    return {
      tick: solver.tick,
      attachedCount: solver.attachedCount,
      boundingRadius: boundingRadius(solver.a, dims, center),
      aspectRatio: aspectRatio(solver.a, dims),
      depletionCenter: depletion.depletionCenter,
      depletionRim: depletion.depletionRim,
      depletionRatio: depletion.depletionRatio,
    };
  };

  let deltaSymmetricAllTicks = true;
  let firstAsymmetricTick = -1;
  let stopReason = "tick-cap";
  const samples: Gate3Sample[] = [];
  const started = Date.now();
  // Same loop shape as grow (sample, then contact check, then far-field on the same cadence
  // as the probe run) so the trajectory is tick-for-tick the probe's — sampling reads state,
  // never mutates it.
  for (let t = 1; t <= GATE3_MAX_TICKS; t++) {
    solver.step();
    if (solver.lastAttached.length > 0 && !isD6hInvariantSet(solver.lastAttached, dims, center)) {
      if (deltaSymmetricAllTicks) firstAsymmetricTick = solver.tick;
      deltaSymmetricAllTicks = false;
    }
    if (t % GATE3_SAMPLE_EVERY === 0) {
      const s = takeSample();
      samples.push(s);
      console.log(
        `gate3 sample tick=${s.tick} attached=${s.attachedCount} radius=${fmtNum(s.boundingRadius)} ` +
          `AR=${fmtNum(s.aspectRatio)} depCenter=${fmtNum(s.depletionCenter)} ` +
          `depRim=${fmtNum(s.depletionRim)} depRatio=${fmtNum(s.depletionRatio)} ` +
          `deltaSym=${deltaSymmetricAllTicks} elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`,
      );
    }
    if (solver.domainContact()) {
      stopReason = "domain-contact";
      break;
    }
    if (t % GATE3_STOP_CHECK_EVERY === 0) {
      if (solver.farFieldMean() < FAR_FIELD_STOP_FRACTION * params.rho) {
        stopReason = "far-field";
        break;
      }
    }
  }
  // Record the true end of the series: if the stop tick is off-cadence, append a final row so
  // the CSV runs to the actual end (window extraction keys on tick % 100, so this row can
  // never enter the registered window by accident).
  if (solver.tick % GATE3_SAMPLE_EVERY !== 0) samples.push(takeSample());

  const final = computeMetrics(
    solver.a, solver.b, solver.d, dims, center, solver.tick, solver.farFieldMean(),
    solver.wall,
  );
  const finalState: Gate3FinalState = {
    aspectRatio: final.aspectRatio,
    boundingRadius: final.boundingRadius,
    domainContact: final.domainContact,
    stopReason,
    deltaSymmetricAllTicks,
    finalSymmetryError: final.symmetryError,
  };
  console.log(
    `gate3 stop reason=${stopReason} tick=${solver.tick} attached=${final.attachedCount} ` +
      `radius=${fmtNum(final.boundingRadius)} AR=${fmtNum(final.aspectRatio)} ` +
      `symErr=${fmtNum(final.symmetryError)} deltaSymClean=${deltaSymmetricAllTicks}` +
      (firstAsymmetricTick >= 0 ? ` firstAsymmetricTick=${firstAsymmetricTick}` : "") +
      ` domainContact=${final.domainContact}`,
  );

  // Evidence artifacts. The CSV is the full series (tick 100 to the end, window and beyond);
  // the checkpoint is the final state, round-trip verified exactly like grow --out.
  mkdirSync(dirname(GATE3_CSV_PATH) || ".", { recursive: true });
  writeFileSync(GATE3_CSV_PATH, gate3Csv(samples));
  console.log(`gate3 series written: ${GATE3_CSV_PATH} (${samples.length} samples)`);
  const encoded = encodeCheckpoint(solver.state(), final);
  writeFileSync(GATE3_CKPT_PATH, encoded);
  const written = new Uint8Array(readFileSync(GATE3_CKPT_PATH));
  const back = decodeCheckpoint(written);
  const reencoded = encodeCheckpoint(back.state, back.header.metrics);
  const identical = bytesEqual(encoded, written) && bytesEqual(written, reencoded);
  console.log(
    `checkpoint written: ${GATE3_CKPT_PATH} (${encoded.length} bytes) roundTripIdentical=${identical}`,
  );
  if (!identical) throw new Error("gate3 checkpoint round trip changed header controls or field bits");

  const verdict = evaluateGate3(samples, finalState);
  if (verdict.failures.length > 0) {
    console.error(`GATE3 FAILED (${verdict.failures.length} criteria):`);
    for (const f of verdict.failures) console.error(`  - ${f}`);
    console.error("GATE3 EXIT STATUS: 1");
    process.exit(1);
  }
  console.log(
    `GATE3 PASSED: windowMedianRatio=${fmtNum(verdict.windowMedianRatio)} ` +
      `fractionBelow1=${fmtNum(verdict.windowFractionBelowOne)} ` +
      `finalRadius=${fmtNum(finalState.boundingRadius)} finalAR=${fmtNum(finalState.aspectRatio)} ` +
      `stop=${stopReason} — every registered Phase 3 criterion enforced; exit 0 is the evidence.`,
  );
  console.log("GATE3 EXIT STATUS: 0");
}
