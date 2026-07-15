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
  prepareSegmentEditAt, PARAM_BOUNDS, GRID_BOUNDS,
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
  const target = prepareSegmentEditAt(segments, 0, live.tickCount);
  segments[target].reiterGamma = 0.01;
  for (let t = live.tickCount; t < 100; t++) live.tick(paramsAtTick(segments, t));
  check(
    '(1) live edit splits at the cursor: consumed prefix keeps the values that ran',
    segments.length === 2
      && segments[0].ticks === 50 && segments[0].reiterGamma === 0.0001
      && segments[1].reiterGamma === 0.01 && target === 1,
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
  check(
    '(1) an edit exactly at a segment boundary edits in place (no split)',
    prepareSegmentEditAt(boundary, 1, 50) === 1 && boundary.length === 2
      && prepareSegmentEditAt(boundary, 0, 0) === 0 && boundary.length === 2,
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
