// spike/js/history.mjs — the growth-history (timeline) model. DOM-free.
//
// A growth history is an ordered list of segments, each holding a duration in
// ticks and the three Reiter parameter values (reiterAlpha / reiterBeta /
// reiterGamma — Rule 7: never the bare single-word forms). The run consults
// the history every tick via paramsAtTick.
//
// Save format (plan): { name, seed, gridSize, segments[] }. `seed` is
// reserved for honesty about grid initialization; the model has no
// randomness, so it is currently always 0 and unused.

// The ONE definition of parameter bounds and slider steps, consumed by both
// the UI controls and validateHistory (maker-found defect: the slider bounds
// and steps drifted from this schema, so schema-valid values — e.g.
// reiterGamma = 0.0001 against a 0.0002 slider step — were unrepresentable in
// the editor). Every preset value must sit on these step lattices;
// check.mjs asserts it.
export const PARAM_BOUNDS = {
  reiterAlpha: { min: 0, max: 2, step: 0.05 },    // diffusion; > 2 is numerically unstable
  reiterBeta: { min: 0, max: 0.95, step: 0.01 },  // background vapor; must stay below ice (1)
  reiterGamma: { min: 0, max: 0.05, step: 0.0001 }, // per-tick addition on receptive cells
};

// Shared with the UI's grid input; sim.mjs enforces the same range (asserted
// against each other in check.mjs).
export const GRID_BOUNDS = { min: 16, max: 512 };

export const MAX_SEGMENT_TICKS = 100000;
// Raised from 64: replay-faithful live editing (splitSegment below) grows the
// segment list as knobs move mid-run, so the cap needs headroom.
export const MAX_SEGMENTS = 256;

export function makeSegment(ticks, reiterAlpha, reiterBeta, reiterGamma) {
  return { ticks: ticks | 0, reiterAlpha, reiterBeta, reiterGamma };
}

export function makeHistory(name, gridSize, segments) {
  return { name, seed: 0, gridSize: gridSize | 0, segments };
}

export function cloneHistory(history) {
  return {
    name: history.name,
    seed: history.seed,
    gridSize: history.gridSize,
    segments: history.segments.map((seg) => ({ ...seg })),
  };
}

export function totalTicks(segments) {
  let total = 0;
  for (const seg of segments) total += seg.ticks;
  return total;
}

/**
 * The parameters in force at a given tick (0-based). Ticks past the end of
 * the last segment return the last segment's values with atEnd = true — the
 * UI auto-pauses there; a journey has an end.
 */
export function paramsAtTick(segments, tick) {
  let start = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (tick < start + seg.ticks) {
      return {
        segIndex: i,
        reiterAlpha: seg.reiterAlpha,
        reiterBeta: seg.reiterBeta,
        reiterGamma: seg.reiterGamma,
        atEnd: false,
      };
    }
    start += seg.ticks;
  }
  const last = segments[segments.length - 1];
  return {
    segIndex: segments.length - 1,
    reiterAlpha: last.reiterAlpha,
    reiterBeta: last.reiterBeta,
    reiterGamma: last.reiterGamma,
    atEnd: true,
  };
}

/** Tick at which segments[index] begins. */
export function segmentStartTick(segments, index) {
  let start = 0;
  for (let i = 0; i < index; i++) start += segments[i].ticks;
  return start;
}

/**
 * Split segments[index] in place so the left part keeps `leftTicks` of the
 * duration; both halves keep the segment's parameter values (the schedule is
 * unchanged, so replay is unchanged). Returns the index of the right half.
 */
export function splitSegment(segments, index, leftTicks) {
  const seg = segments[index];
  if (!Number.isInteger(leftTicks) || leftTicks < 1 || leftTicks >= seg.ticks) {
    throw new Error(`cannot split a ${seg.ticks}-tick segment at ${leftTicks}`);
  }
  const right = { ...seg, ticks: seg.ticks - leftTicks };
  seg.ticks = leftTicks;
  segments.splice(index + 1, 0, right);
  return index + 1;
}

/**
 * Prepare segments[index] to receive an edit while the run sits at `tick`,
 * without ever rewriting ticks the run has already consumed. If the cursor is
 * strictly inside the segment, split at the cursor — the consumed left half
 * keeps the values that actually ran — and return the index of the suffix,
 * which should receive the edit. Otherwise return `index` unchanged.
 *
 * This is what makes live editing replay-faithful (maker-found defect:
 * in-place edits were retroactive, so a saved history did not describe the
 * crystal that generated it — 427 vs 595 ice cells in the reproduction).
 */
export function prepareSegmentEditAt(segments, index, tick) {
  const start = segmentStartTick(segments, index);
  const seg = segments[index];
  if (tick <= start || tick >= start + seg.ticks) return index;
  return splitSegment(segments, index, tick - start);
}

function checkNumber(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} is not a finite number`);
  }
  if (value < min || value > max) {
    throw new Error(`${name} = ${value} outside [${min}, ${max}]`);
  }
}

/**
 * Validate an untrusted object (file import, localStorage) as a history.
 * Throws with a readable message, or returns a normalized deep copy.
 */
export function validateHistory(obj) {
  if (typeof obj !== 'object' || obj === null) throw new Error('history is not an object');
  if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 120) {
    throw new Error('history.name must be a non-empty string (max 120 chars)');
  }
  if (obj.seed !== 0) {
    // Reserved and unused (the model is deterministic); enforce the only
    // honest value so nothing smuggles meaning into it before it has any.
    throw new Error('history.seed must be 0 (reserved; the model has no randomness yet)');
  }
  if (!Number.isInteger(obj.gridSize)
      || obj.gridSize < GRID_BOUNDS.min || obj.gridSize > GRID_BOUNDS.max) {
    throw new Error(`history.gridSize must be an integer in `
      + `[${GRID_BOUNDS.min}, ${GRID_BOUNDS.max}], got ${obj.gridSize}`);
  }
  if (!Array.isArray(obj.segments) || obj.segments.length === 0) {
    throw new Error('history.segments must be a non-empty array');
  }
  if (obj.segments.length > MAX_SEGMENTS) {
    throw new Error(`history.segments has ${obj.segments.length} segments (max ${MAX_SEGMENTS})`);
  }
  const segments = obj.segments.map((seg, i) => {
    if (typeof seg !== 'object' || seg === null) throw new Error(`segment ${i} is not an object`);
    if (!Number.isInteger(seg.ticks) || seg.ticks < 1 || seg.ticks > MAX_SEGMENT_TICKS) {
      throw new Error(`segment ${i}.ticks must be an integer in [1, ${MAX_SEGMENT_TICKS}]`);
    }
    for (const key of ['reiterAlpha', 'reiterBeta', 'reiterGamma']) {
      checkNumber(seg[key], `segment ${i}.${key}`, PARAM_BOUNDS[key].min, PARAM_BOUNDS[key].max);
    }
    return makeSegment(seg.ticks, seg.reiterAlpha, seg.reiterBeta, seg.reiterGamma);
  });
  return { name: obj.name, seed: obj.seed, gridSize: obj.gridSize, segments };
}
