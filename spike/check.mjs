// spike/check.mjs — plain-node verification of the spike's DOM-free CA core.
//
// Run:  node spike/check.mjs
// Zero dependencies; exits non-zero on any failure.
//
// What this proves (and what it does not): these checks cover the simulation
// core — growth, deterministic replay, timeline effect, preset sanity. The
// canvas rendering and the UI need a browser and are checked by eye; the plan
// file records which is which.

import { createSim, fieldsEqual } from './js/sim.mjs';
import {
  paramsAtTick, totalTicks, makeSegment, makeHistory, cloneHistory, validateHistory,
  prepareSegmentEditAt, reseedAtTickZero, applyDurationEdit, normalizeHistory,
  PARAM_BOUNDS, GRID_BOUNDS, MAX_SEGMENTS,
} from './js/history.mjs';
import { PRESETS } from './js/presets.mjs';

let failures = 0;

function check(label, condition, detail = '') {
  const mark = condition ? 'PASS' : 'FAIL';
  if (!condition) failures++;
  console.log(`[${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
}

/** Replay a segment list from a fresh grid, exactly as the UI does. */
function runHistory(gridSize, segments) {
  const sim = createSim(gridSize, segments[0].reiterBeta);
  const total = totalTicks(segments);
  for (let t = 0; t < total; t++) {
    sim.tick(paramsAtTick(segments, t));
  }
  return sim;
}

// ---------------------------------------------------------------------------
// (a) A crystal grows beyond the seed under a sane preset within N ticks.
// ---------------------------------------------------------------------------
{
  const preset = PRESETS[0]; // steady growth
  const sim = runHistory(preset.gridSize, preset.segments);
  const ice = sim.iceCount();
  check(
    `(a) growth: "${preset.name}" grows well beyond the 1-cell seed in ${totalTicks(preset.segments)} ticks`,
    ice > 100,
    `ice cells = ${ice} on a ${preset.gridSize}x${preset.gridSize} grid`,
  );
  check(
    '(a) growth stays inside the grid (edge guard margin > 3)',
    sim.iceEdgeMargin() > 3,
    `edge margin = ${sim.iceEdgeMargin()}`,
  );
}

// ---------------------------------------------------------------------------
// (b) Deterministic replay: same seed + same history => bit-identical grids.
// ---------------------------------------------------------------------------
{
  const segments = [
    makeSegment(150, 1.0, 0.6, 0.0001),
    makeSegment(100, 1.0, 0.6, 0.008),
  ];
  const simA = runHistory(120, segments);
  const simB = runHistory(120, segments);
  check(
    '(b) determinism: two runs of the same history are bit-identical',
    fieldsEqual(simA.s, simB.s),
    `ice cells = ${simA.iceCount()} both runs: ${simA.iceCount()} vs ${simB.iceCount()}`,
  );
}

// ---------------------------------------------------------------------------
// (c) The timeline matters: a two-segment history differs from a one-segment
//     control of the same total length.
// ---------------------------------------------------------------------------
{
  const control = [makeSegment(250, 1.0, 0.6, 0.0001)];
  const twoSeg = [
    makeSegment(125, 1.0, 0.6, 0.0001),
    makeSegment(125, 1.0, 0.6, 0.010),
  ];
  const simControl = runHistory(120, control);
  const simTwoSeg = runHistory(120, twoSeg);
  check(
    '(c) timeline effect: two-segment history differs from one-segment control',
    !fieldsEqual(simControl.s, simTwoSeg.s),
    `ice cells: control = ${simControl.iceCount()}, two-segment = ${simTwoSeg.iceCount()}`,
  );
}

// ---------------------------------------------------------------------------
// Preset sanity: every built-in validates, grows, stays inside the grid, and
// no two presets produce the same crystal. ("Visually distinct" itself is an
// eyeballed check, recorded as such in the plan.)
// ---------------------------------------------------------------------------
{
  const fields = [];
  for (const preset of PRESETS) {
    let valid = true;
    try { validateHistory(preset); } catch (err) { valid = false; }
    check(`preset validates: "${preset.name}"`, valid);
    const sim = runHistory(preset.gridSize, preset.segments);
    check(
      `preset grows and stays inside the grid: "${preset.name}"`,
      sim.iceCount() > 100 && sim.iceEdgeMargin() > 3,
      `ice = ${sim.iceCount()}, edge margin = ${sim.iceEdgeMargin()}, ticks = ${totalTicks(preset.segments)}`,
    );
    fields.push({ name: preset.name, field: sim.s.slice() });
  }
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      check(
        `presets differ: "${fields[i].name}" vs "${fields[j].name}"`,
        !fieldsEqual(fields[i].field, fields[j].field),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Regression (maker review, defect 1): live mid-segment edits must be
// replay-faithful. Reproduction: run 50 ticks at reiterGamma = 0.0001, edit
// the in-progress segment to 0.01 through the model's edit path, run to tick
// 100 — the saved history must replay to the bit-identical grid. (The old
// in-place mutation gave 427 live vs 595 replayed ice cells in the maker's
// browser test.)
// ---------------------------------------------------------------------------
{
  const gridSize = 120;
  const segments = [makeSegment(620, 1.0, 0.6, 0.0001)];
  const live = createSim(gridSize, segments[0].reiterBeta);
  for (let t = 0; t < 50; t++) live.tick(paramsAtTick(segments, t));
  // The mid-run edit, exactly as the slider handler performs it:
  const prep = prepareSegmentEditAt(segments, 0, live.tickCount);
  segments[prep.index].reiterGamma = 0.01;
  for (let t = live.tickCount; t < 100; t++) live.tick(paramsAtTick(segments, t));
  check(
    '(1) live edit splits at the cursor: consumed prefix keeps the values that ran',
    segments.length === 2
      && segments[0].ticks === 50 && segments[0].reiterGamma === 0.0001
      && segments[1].reiterGamma === 0.01
      && prep.index === 1 && prep.split === true && prep.refused === false,
    `segments = ${JSON.stringify(segments.map((s) => [s.ticks, s.reiterGamma]))}`,
  );
  const replay = createSim(gridSize, segments[0].reiterBeta);
  for (let t = 0; t < 100; t++) replay.tick(paramsAtTick(segments, t));
  check(
    '(1) the live-edited run replays bit-identical from its own saved history',
    fieldsEqual(live.s, replay.s),
    `ice cells: live = ${live.iceCount()}, replay = ${replay.iceCount()}`,
  );
  // Edits at a segment boundary or on untouched segments must NOT split.
  const boundary = [makeSegment(50, 1.0, 0.6, 0.0001), makeSegment(50, 1.0, 0.6, 0.001)];
  const atBoundary = prepareSegmentEditAt(boundary, 1, 50);
  const atStart = prepareSegmentEditAt(boundary, 0, 0);
  check(
    '(1) an edit exactly at a segment boundary edits in place (no split)',
    atBoundary.index === 1 && !atBoundary.split && !atBoundary.refused
      && atStart.index === 0 && !atStart.split && boundary.length === 2,
  );
}

// ---------------------------------------------------------------------------
// Regression (maker review round 2, defect A): a tick-0 edit of the first
// segment's reiterBeta must re-seed the field — at tick 0 nothing is
// consumed, so the re-seed is lossless. (Without it: live 271 vs replay 61
// ice cells in the maker's reproduction — the history changed but the
// already-initialized field did not.)
// ---------------------------------------------------------------------------
{
  const gridSize = 120;
  const segments = [makeSegment(300, 1.0, 0.6, 0.0001)];
  const live = createSim(gridSize, segments[0].reiterBeta); // seeded at 0.6
  // The tick-0 edit, exactly as the slider handler performs it:
  const prep = prepareSegmentEditAt(segments, 0, live.tickCount);
  segments[prep.index].reiterBeta = 0.4;
  const reseeded = reseedAtTickZero(live, segments);
  for (let t = 0; t < 100; t++) live.tick(paramsAtTick(segments, t));
  const replay = createSim(gridSize, segments[0].reiterBeta);
  for (let t = 0; t < 100; t++) replay.tick(paramsAtTick(segments, t));
  check(
    '(A) tick-0 initial-vapor edit re-seeds the world and replays bit-identical',
    reseeded === true && !prep.split && fieldsEqual(live.s, replay.s),
    `ice cells: live = ${live.iceCount()}, replay = ${replay.iceCount()}`,
  );
  // Past tick 0 the helper must refuse (a re-seed there would destroy state).
  const running = createSim(gridSize, 0.6);
  running.tick(paramsAtTick(segments, 0));
  check(
    '(A) the re-seed helper does nothing once ticks are consumed',
    reseedAtTickZero(running, segments) === false && running.tickCount === 1,
  );
}

// ---------------------------------------------------------------------------
// Regression (maker review round 2, defect B): duration edits must never
// silently reassign consumed ticks. Chosen policy: the edit is applied but
// flagged divergent, and the caller warns loudly (same as value edits to
// passed segments). Totals must report the updated value.
// ---------------------------------------------------------------------------
{
  // Maker's reproduction: at tick 100, lengthen the completed first segment
  // from 50 to 120 — consumed ticks 50..99 ran under segment 2's values.
  const segments = [makeSegment(50, 1.0, 0.6, 0.0001), makeSegment(520, 1.0, 0.6, 0.01)];
  const result = applyDurationEdit(segments, 0, 100, 120);
  check(
    '(B) lengthening a completed segment past consumed ticks is flagged divergent',
    result.divergent === true && segments[0].ticks === 120,
    `divergent = ${result.divergent}`,
  );
  check(
    '(B) the totals helper reports the updated schedule (no stale totals)',
    totalTicks(segments) === 120 + 520,
    `totalTicks = ${totalTicks(segments)}`,
  );
  // Lengthening a segment whose end sits exactly at the cursor adds only
  // future ticks — NOT divergent, and the live run must equal the replay.
  const gridSize = 120;
  const boundarySegs = [makeSegment(50, 1.0, 0.6, 0.0001), makeSegment(520, 1.0, 0.6, 0.01)];
  const live = createSim(gridSize, boundarySegs[0].reiterBeta);
  for (let t = 0; t < 50; t++) live.tick(paramsAtTick(boundarySegs, t));
  const atEnd = applyDurationEdit(boundarySegs, 0, live.tickCount, 120);
  for (let t = live.tickCount; t < 150; t++) live.tick(paramsAtTick(boundarySegs, t));
  const replay = createSim(gridSize, boundarySegs[0].reiterBeta);
  for (let t = 0; t < 150; t++) replay.tick(paramsAtTick(boundarySegs, t));
  check(
    '(B) lengthening at the exact cursor boundary is not divergent and replays bit-identical',
    atEnd.divergent === false && fieldsEqual(live.s, replay.s),
    `ice cells: live = ${live.iceCount()}, replay = ${replay.iceCount()}`,
  );
  // An in-progress segment never shrinks below its consumed prefix.
  const inProgress = [makeSegment(620, 1.0, 0.6, 0.0001)];
  const clampedEdit = applyDurationEdit(inProgress, 0, 100, 50);
  check(
    '(B) in-progress shrink clamps to the consumed prefix, not divergent',
    clampedEdit.clamped === true && clampedEdit.ticks === 100
      && clampedEdit.divergent === false && inProgress[0].ticks === 100,
  );
}

// ---------------------------------------------------------------------------
// Regression (maker review round 2, defect C): a long live drag (staircase)
// must always yield a journey that saves, loads, and replays bit-identically
// — and at the MAX_SEGMENTS cap, further mid-run splits are refused rather
// than recording an unsaveable journey.
// ---------------------------------------------------------------------------
{
  const gridSize = 120;
  const segments = [makeSegment(2000, 1.0, 0.6, 0.0)];
  const live = createSim(gridSize, segments[0].reiterBeta);
  // 320 drag events, one tick apart, each landing a new reiterGamma value —
  // the staircase a slider drag during play lays down.
  let refusals = 0;
  for (let event = 0; event < 320; event++) {
    live.tick(paramsAtTick(segments, live.tickCount));
    const segIndex = paramsAtTick(segments, live.tickCount).segIndex;
    const prep = prepareSegmentEditAt(segments, segIndex, live.tickCount);
    if (prep.refused) { refusals++; continue; }
    // Runs of 8 identical values: produces adjacent-identical segments, so
    // the save-time merge (normalizeHistory) is genuinely exercised below.
    segments[prep.index].reiterGamma = ((Math.floor(event / 8) % 10) + 1) * 0.0002;
  }
  check(
    '(C) a 320-event staircase drag stays under the segment cap (no refusals)',
    refusals === 0 && segments.length > 300 && segments.length <= MAX_SEGMENTS,
    `segments = ${segments.length}, cap = ${MAX_SEGMENTS}`,
  );
  const draggedName = 'staircase drag';
  const validated = validateHistory(makeHistory(draggedName, gridSize, segments));
  check(
    '(C) the staircase journey validates for saving',
    validated.segments.length === segments.length,
  );
  // Save + load through real storage (node stand-in for localStorage), then
  // replay the loaded journey — must be bit-identical with the live run.
  globalThis.localStorage = {
    data: new Map(),
    getItem(key) { return this.data.has(key) ? this.data.get(key) : null; },
    setItem(key, value) { this.data.set(key, String(value)); },
    removeItem(key) { this.data.delete(key); },
  };
  const storage = await import('./js/storage.mjs');
  storage.saveHistory(makeHistory(draggedName, gridSize, segments));
  const loaded = storage.getSaved(draggedName);
  const replay = createSim(gridSize, loaded.segments[0].reiterBeta);
  for (let t = 0; t < live.tickCount; t++) replay.tick(paramsAtTick(loaded.segments, t));
  check(
    '(C) the saved staircase loads and replays bit-identical to the live run',
    loaded !== null && totalTicks(loaded.segments) === 2000
      && loaded.segments.length < segments.length // the merge actually fired
      && fieldsEqual(live.s, replay.s),
    `stored segments = ${loaded.segments.length} (normalized from ${segments.length}), `
      + `ice cells: live = ${live.iceCount()}, replay = ${replay.iceCount()}`,
  );
  storage.deleteHistory(draggedName);
  delete globalThis.localStorage;
  // At the cap, mid-run splits are refused and the list stays saveable.
  const capped = [];
  for (let i = 0; i < MAX_SEGMENTS; i++) capped.push(makeSegment(2, 1.0, 0.5, 0.001));
  const refusedPrep = prepareSegmentEditAt(capped, 0, 1);
  check(
    '(C) at the segment cap, a mid-segment edit is refused (never silently divergent)',
    refusedPrep.refused === true && capped.length === MAX_SEGMENTS
      && capped[0].ticks === 2,
  );
  // normalizeHistory is lossless on an already-compact journey.
  const compact = normalizeHistory(cloneHistory(PRESETS[1]));
  check(
    '(C) normalizeHistory leaves distinct-parameter segments untouched',
    compact.segments.length === PRESETS[1].segments.length
      && totalTicks(compact.segments) === totalTicks(PRESETS[1].segments),
  );
}

// ---------------------------------------------------------------------------
// Regression (maker review, defect 4): one bounds definition for schema and
// UI. Every preset value must sit on the shared slider step lattice, and the
// shared grid bounds must match what the sim actually accepts.
// ---------------------------------------------------------------------------
{
  const offLattice = [];
  for (const preset of PRESETS) {
    for (const [i, seg] of preset.segments.entries()) {
      for (const key of ['reiterAlpha', 'reiterBeta', 'reiterGamma']) {
        const bounds = PARAM_BOUNDS[key];
        const value = seg[key];
        const steps = (value - bounds.min) / bounds.step;
        const onLattice = Math.abs(steps - Math.round(steps)) < 1e-9;
        if (!onLattice || value < bounds.min || value > bounds.max) {
          offLattice.push(`${preset.name} seg ${i} ${key}=${value}`);
        }
      }
    }
  }
  check(
    '(4) every preset value is representable on the shared slider lattice',
    offLattice.length === 0,
    offLattice.join('; '),
  );
  let acceptsBounds = true;
  try {
    createSim(GRID_BOUNDS.min, 0.4);
    createSim(GRID_BOUNDS.max, 0.4);
  } catch {
    acceptsBounds = false;
  }
  let rejectsOutside = 0;
  for (const bad of [GRID_BOUNDS.min - 1, GRID_BOUNDS.max + 1]) {
    try { createSim(bad, 0.4); } catch { rejectsOutside++; }
  }
  check(
    '(4) GRID_BOUNDS matches the range the sim accepts',
    acceptsBounds && rejectsOutside === 2,
    `bounds = [${GRID_BOUNDS.min}, ${GRID_BOUNDS.max}]`,
  );
}

// ---------------------------------------------------------------------------
// Regression (maker review, defect a): seed is reserved — the only valid
// value is 0 until the model actually uses it.
// ---------------------------------------------------------------------------
{
  const tampered = cloneHistory(PRESETS[0]);
  tampered.seed = 1;
  let rejected = false;
  try { validateHistory(tampered); } catch { rejected = true; }
  check('(a) validateHistory rejects seed !== 0', rejected);
}

// ---------------------------------------------------------------------------
// Regression (maker review, defect b): saved-history names must be honest own
// keys. A history named "__proto__" used to "save" without persisting.
// Storage is exercised under node with a minimal localStorage stand-in.
// ---------------------------------------------------------------------------
{
  globalThis.localStorage = {
    data: new Map(),
    getItem(key) { return this.data.has(key) ? this.data.get(key) : null; },
    setItem(key, value) { this.data.set(key, String(value)); },
    removeItem(key) { this.data.delete(key); },
  };
  const { saveHistory, listSaved, getSaved, deleteHistory } = await import('./js/storage.mjs');
  const proto = makeHistory('__proto__', 200, [makeSegment(10, 1.0, 0.5, 0.001)]);
  saveHistory(proto);
  const listedNames = listSaved().map((h) => h.name);
  check(
    '(b) a history named "__proto__" persists, lists, and loads',
    listedNames.includes('__proto__') && getSaved('__proto__') !== null,
    `listed = ${JSON.stringify(listedNames)}`,
  );
  deleteHistory('__proto__');
  check(
    '(b) a history named "__proto__" deletes cleanly',
    getSaved('__proto__') === null && listSaved().length === 0,
  );
  saveHistory(makeHistory('ordinary journey', 128, [makeSegment(5, 1.0, 0.4, 0)]));
  check(
    '(b) an ordinary save/load round-trips through the same store',
    getSaved('ordinary journey') !== null && listSaved().length === 1,
  );
  delete globalThis.localStorage;
}

// ---------------------------------------------------------------------------
// Informational: sim cost per tick at the default 200x200 (not an assert —
// render cost needs a browser and is eyeballed there).
// ---------------------------------------------------------------------------
{
  const segments = [makeSegment(200, 1.0, 0.6, 0.0001)];
  const sim = createSim(200, 0.6);
  const t0 = performance.now();
  for (let t = 0; t < 200; t++) sim.tick(paramsAtTick(segments, t));
  const msPerTick = (performance.now() - t0) / 200;
  console.log(`[info] sim cost at 200x200: ${msPerTick.toFixed(2)} ms/tick (node)`);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
