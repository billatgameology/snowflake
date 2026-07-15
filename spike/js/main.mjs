// spike/js/main.mjs — UI wiring for the Phase 1 cloud-journey spike.
// Browser-only. The simulation core (sim.mjs, history.mjs, presets.mjs) is
// DOM-free and verified by spike/check.mjs under plain node.
//
// Rule 7: the three Reiter parameters are reiterAlpha (mixing), reiterBeta
// (vapor supply), reiterGamma (growth boost) — never bare single-word forms.

import { createSim } from './sim.mjs';
import {
  paramsAtTick, totalTicks, cloneHistory,
  segmentStartTick, splitSegment, prepareSegmentEditAt,
  PARAM_BOUNDS, GRID_BOUNDS, MAX_SEGMENT_TICKS,
} from './history.mjs';
import { PRESETS } from './presets.mjs';
import { createRenderer } from './render.mjs';
import { listSaved, saveHistory, deleteHistory, exportHistory, importHistoryFile } from './storage.mjs';

const EDGE_GUARD_MARGIN = 3;
const SEGMENT_COLORS = [
  '#2f5f8f', '#7a4b8f', '#3e7a54', '#96632e',
  '#5a5f9e', '#8f4b5e', '#4b788f', '#6d7a3e',
];

const $ = (id) => document.getElementById(id);

// --- DOM handles -----------------------------------------------------------
const els = {
  notice: $('notice'),
  btnPlay: $('btnPlay'), btnStep: $('btnStep'), btnReset: $('btnReset'),
  speed: $('speed'), tickReadout: $('tickReadout'),
  sliderVapor: $('sliderVapor'), sliderBoost: $('sliderBoost'), sliderMixing: $('sliderMixing'),
  valVapor: $('valVapor'), valBoost: $('valBoost'), valMixing: $('valMixing'),
  timelineBar: $('timelineBar'), timelineCursor: $('timelineCursor'),
  segReadout: $('segReadout'), segTicks: $('segTicks'),
  btnAddSeg: $('btnAddSeg'), btnSplitSeg: $('btnSplitSeg'), btnDeleteSeg: $('btnDeleteSeg'),
  journeyName: $('journeyName'), gridSizeInput: $('gridSizeInput'),
  btnSave: $('btnSave'), btnExport: $('btnExport'), btnImport: $('btnImport'),
  importFile: $('importFile'), journeyStatus: $('journeyStatus'),
  savedList: $('savedList'), presetList: $('presetList'),
  compareToggle: $('compareToggle'), compareSelects: $('compareSelects'),
  selectA: $('selectA'), selectB: $('selectB'),
  miniTimelineA: $('miniTimelineA'), miniTimelineB: $('miniTimelineB'),
  conditionsBox: $('conditionsBox'), timelineBox: $('timelineBox'), journeyBox: $('journeyBox'),
  canvasA: $('canvasA'), canvasB: $('canvasB'),
  canvasWrapB: $('canvasWrapB'),
  canvasTitleA: $('canvasTitleA'), canvasTitleB: $('canvasTitleB'),
  statsA: $('statsA'), statsB: $('statsB'),
};

// --- app state --------------------------------------------------------------
let working = cloneHistory(PRESETS[0]);
working.name = 'untitled journey';

let mode = 'single'; // 'single' | 'compare'
let runners = [];    // [{ history, sim, renderer, statsEl, titleEl, simMs, drawMs }]
let playing = false;
let selectedSeg = 0;
let needsDraw = true;

function makeRunner(history, canvas, statsEl, titleEl, cssSize) {
  return {
    history,
    sim: createSim(history.gridSize, history.segments[0].reiterBeta),
    renderer: createRenderer(canvas, history.gridSize, cssSize),
    statsEl, titleEl,
    simMs: 0, drawMs: 0,
  };
}

/** Advance one runner by one tick. Returns 'ok' | 'edge'. Callers guard the
 *  end of the schedule via sharedLimit(), so no atEnd check here. */
function stepRunner(runner) {
  const params = paramsAtTick(runner.history.segments, runner.sim.tickCount);
  const t0 = performance.now();
  runner.sim.tick(params);
  runner.simMs = runner.simMs * 0.9 + (performance.now() - t0) * 0.1;
  if (runner.sim.iceEdgeMargin() <= EDGE_GUARD_MARGIN) return 'edge';
  return 'ok';
}

/** The one clock every runner obeys. In compare mode the run stops at the
 *  SHORTER journey's end: nobody ever steps alone, so the displayed tick is
 *  the true shared tick (maker-found defect: one side used to run on past the
 *  other's end while the UI still claimed lockstep). */
function sharedLimit() {
  return Math.min(...runners.map((r) => totalTicks(r.history.segments)));
}

function endNotice() {
  return mode === 'compare'
    ? 'End of comparison — it stops at the shorter journey\'s end so the two sides stay in '
      + 'lockstep. Reset to replay, or compare equal-length journeys to see both finish.'
    : 'End of journey — extend the last segment or add one to continue, or Reset.';
}

// --- notices ----------------------------------------------------------------
function notice(text) {
  els.notice.textContent = text;
  els.notice.classList.toggle('hidden', !text);
}

function status(text) {
  els.journeyStatus.textContent = text;
  if (text) setTimeout(() => { if (els.journeyStatus.textContent === text) status(''); }, 5000);
}

// --- run controls -----------------------------------------------------------
function setPlaying(next) {
  playing = next;
  els.btnPlay.textContent = playing ? 'Pause' : 'Play';
  const structureLocked = playing || mode === 'compare';
  els.btnAddSeg.disabled = structureLocked;
  els.btnSplitSeg.disabled = structureLocked;
  els.btnDeleteSeg.disabled = structureLocked || working.segments.length < 2;
  els.segTicks.disabled = structureLocked;
}

function resetRunners() {
  if (mode === 'single') {
    runners = [makeRunner(working, els.canvasA, els.statsA, els.canvasTitleA, 640)];
    els.canvasTitleA.textContent = '';
    els.miniTimelineA.classList.add('hidden');
    els.miniTimelineB.classList.add('hidden');
  } else {
    const histA = resolveOption(els.selectA.value);
    const histB = resolveOption(els.selectB.value);
    let gridNote = '';
    if (histB.gridSize !== histA.gridSize) {
      histB.gridSize = histA.gridSize; // same seed = same world; A's grid wins
      gridNote = ' · grid forced to A’s';
    }
    // "Same seed and grid" is all that is shared: each side's initial vapor
    // field comes from its own first segment, so flag it when they differ
    // rather than claiming identical starts.
    let vaporNote = '';
    const vaporA = histA.segments[0].reiterBeta;
    const vaporB = histB.segments[0].reiterBeta;
    if (vaporB !== vaporA) {
      vaporNote = ` · starts at different vapor (reiterBeta ${vaporB} vs A’s ${vaporA})`;
    }
    runners = [
      makeRunner(histA, els.canvasA, els.statsA, els.canvasTitleA, 380),
      makeRunner(histB, els.canvasB, els.statsB, els.canvasTitleB, 380),
    ];
    els.canvasTitleA.textContent = `A — ${histA.name}`;
    els.canvasTitleB.textContent = `B — ${histB.name}${gridNote}${vaporNote}`;
    renderMiniTimeline(els.miniTimelineA, runners[0]);
    renderMiniTimeline(els.miniTimelineB, runners[1]);
  }
  setPlaying(false);
  notice('');
  needsDraw = true;
}

/** Compact read-only timeline (segment bar + cursor) shown under each compare
 *  title, so "explain why they differ" has the evidence on screen. */
function renderMiniTimeline(container, runner) {
  container.textContent = '';
  container.classList.remove('hidden');
  const bar = document.createElement('div');
  bar.className = 'mini-bar';
  runner.history.segments.forEach((seg, i) => {
    const div = document.createElement('div');
    div.className = 'mini-seg';
    div.style.flexGrow = String(seg.ticks);
    div.style.flexBasis = '0';
    div.style.background = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    div.title = segTitle(seg, i);
    bar.appendChild(div);
  });
  const cursor = document.createElement('div');
  cursor.className = 'mini-cursor';
  container.appendChild(bar);
  container.appendChild(cursor);
  runner.miniCursor = cursor;
}

function updateMiniCursors() {
  for (const runner of runners) {
    if (!runner.miniCursor) continue;
    const total = totalTicks(runner.history.segments);
    const tick = Math.min(runner.sim.tickCount, total);
    runner.miniCursor.style.left = `calc(${((tick / total) * 100).toFixed(3)}% - 1px)`;
  }
}

els.btnPlay.addEventListener('click', () => {
  if (!playing && runners[0].sim.tickCount >= sharedLimit()) {
    notice(endNotice());
    return;
  }
  setPlaying(!playing);
});

els.btnStep.addEventListener('click', () => {
  setPlaying(false);
  advance(1);
  needsDraw = true;
});

els.btnReset.addEventListener('click', resetRunners);

/** Advance all runners `count` lockstep ticks; handles end + edge pauses.
 *  One shared clock: nobody steps unless everybody can. */
function advance(count) {
  for (let k = 0; k < count; k++) {
    if (runners[0].sim.tickCount >= sharedLimit()) {
      setPlaying(false);
      notice(endNotice());
      break;
    }
    let edge = false;
    for (const runner of runners) {
      if (stepRunner(runner) === 'edge') edge = true;
    }
    if (edge) {
      setPlaying(false);
      notice('A crystal reached the edge of its world — growth into the clamped rim is not '
        + 'meaningful, so the run paused. Reset to replay, or design a shorter journey.');
      break;
    }
  }
  if (mode === 'single') {
    // Selection follows the cursor while running.
    const current = paramsAtTick(working.segments, runners[0].sim.tickCount);
    if (current.segIndex !== selectedSeg) selectSegment(current.segIndex);
  }
}

// --- frame loop ---------------------------------------------------------------
function frame() {
  if (playing) {
    advance(parseInt(els.speed.value, 10));
    needsDraw = true;
  }
  if (needsDraw) {
    for (const runner of runners) {
      runner.drawMs = runner.renderer.draw(runner.sim);
      const total = totalTicks(runner.history.segments);
      runner.statsEl.textContent =
        `tick ${runner.sim.tickCount}/${total} · ice ${runner.sim.iceCount()} cells · `
        + `sim ${runner.simMs.toFixed(2)} ms/tick · draw ${runner.drawMs.toFixed(1)} ms`;
    }
    updateTimelineCursor();
    updateMiniCursors();
    // The displayed tick is the true shared tick; in compare mode the total
    // is the comparison's end (the shorter journey), not either side's own.
    els.tickReadout.textContent = `tick ${runners[0].sim.tickCount} / ${sharedLimit()}`;
    needsDraw = false;
  }
  requestAnimationFrame(frame);
}

// --- conditions sliders -------------------------------------------------------
const SLIDES = [
  { el: els.sliderVapor, out: els.valVapor, key: 'reiterBeta', digits: 2 },
  { el: els.sliderBoost, out: els.valBoost, key: 'reiterGamma', digits: 4 },
  { el: els.sliderMixing, out: els.valMixing, key: 'reiterAlpha', digits: 2 },
];

function refreshSliders() {
  const seg = working.segments[selectedSeg];
  for (const slide of SLIDES) {
    slide.el.value = String(seg[slide.key]);
    slide.out.textContent = `${slide.key} = ${seg[slide.key].toFixed(slide.digits)}`;
  }
}

for (const slide of SLIDES) {
  slide.el.addEventListener('input', () => {
    if (mode === 'compare') return;
    // Replay-faithful live editing: never rewrite ticks the run has already
    // consumed. A mid-segment edit first splits at the cursor — the consumed
    // prefix keeps the values that actually ran — and the edit lands on the
    // suffix, which becomes the selection. (Maker-found defect: in-place
    // edits were retroactive, so a journey saved after a live tweak did not
    // reproduce the crystal on screen.) While playing, each tick-advancing
    // drag event splits again: the resulting staircase of small segments IS
    // the faithful record of a knob turned over time.
    const target = prepareSegmentEditAt(working.segments, selectedSeg, runners[0].sim.tickCount);
    if (target !== selectedSeg) selectedSeg = target;
    const seg = working.segments[target];
    seg[slide.key] = parseFloat(slide.el.value);
    slide.out.textContent = `${slide.key} = ${seg[slide.key].toFixed(slide.digits)}`;
    warnIfPastEdited(target);
    renderTimeline();
  });
}

// --- timeline -----------------------------------------------------------------
function segmentStart(index) {
  return segmentStartTick(working.segments, index);
}

// Warn when a *fully passed* segment is edited: the crystal on screen then no
// longer matches the timeline. Mid-segment slider edits never reach here as
// divergent — prepareSegmentEditAt splits first, so the consumed ticks are
// untouched and replay stays faithful.
function warnIfPastEdited(index) {
  if (mode !== 'single') return;
  const tick = runners[0].sim.tickCount;
  if (tick >= segmentStart(index) + working.segments[index].ticks) {
    notice('You edited a part of the journey the run has already passed — the crystal on '
      + 'screen no longer matches this timeline. Reset to replay it faithfully.');
  }
}

function segTitle(seg, i) {
  return `segment ${i + 1}: ${seg.ticks} ticks — vapor supply ${seg.reiterBeta}, `
    + `growth boost ${seg.reiterGamma}, mixing ${seg.reiterAlpha}`;
}

function selectSegment(index) {
  selectedSeg = Math.max(0, Math.min(index, working.segments.length - 1));
  refreshSliders();
  renderTimeline();
}

function renderTimeline() {
  const bar = els.timelineBar;
  bar.textContent = '';
  working.segments.forEach((seg, i) => {
    const div = document.createElement('div');
    div.className = 'segment' + (i === selectedSeg ? ' selected' : '');
    div.style.flexGrow = String(seg.ticks);
    div.style.flexBasis = '0';
    div.style.background = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    div.title = segTitle(seg, i);
    div.textContent = String(seg.ticks);
    div.addEventListener('click', () => { if (mode === 'single') selectSegment(i); });
    bar.appendChild(div);
  });
  const seg = working.segments[selectedSeg];
  els.segReadout.textContent = `segment ${selectedSeg + 1} of ${working.segments.length}`;
  els.segTicks.value = String(seg.ticks);
  els.btnDeleteSeg.disabled = playing || mode === 'compare' || working.segments.length < 2;
  updateTimelineCursor();
}

function updateTimelineCursor() {
  if (mode !== 'single' || runners.length === 0) { els.timelineCursor.style.display = 'none'; return; }
  els.timelineCursor.style.display = '';
  const total = totalTicks(working.segments);
  const tick = Math.min(runners[0].sim.tickCount, total);
  els.timelineCursor.style.left = `calc(${((tick / total) * 100).toFixed(3)}% - 1px)`;
}

els.segTicks.addEventListener('change', () => {
  const seg = working.segments[selectedSeg];
  const value = parseInt(els.segTicks.value, 10);
  if (Number.isInteger(value) && value >= 1 && value <= MAX_SEGMENT_TICKS) {
    // Never shrink the in-progress segment below what the run has consumed —
    // that would rewrite ticks that already happened.
    const start = segmentStart(selectedSeg);
    const tick = runners[0].sim.tickCount;
    let next = value;
    if (tick > start && tick < start + seg.ticks && next < tick - start) {
      next = tick - start;
      status(`Clamped to ${next} ticks — the run has already consumed that much of this segment.`);
    }
    seg.ticks = next;
    warnIfPastEdited(selectedSeg);
  }
  renderTimeline();
});

els.btnAddSeg.addEventListener('click', () => {
  const seg = working.segments[selectedSeg];
  const insertionStart = segmentStart(selectedSeg) + seg.ticks;
  working.segments.splice(selectedSeg + 1, 0, { ...seg, ticks: 200 });
  selectSegment(selectedSeg + 1);
  // Inserting behind the cursor rewrites ticks the run already consumed.
  if (runners[0].sim.tickCount > insertionStart) {
    notice('You inserted into a part of the journey the run has already passed — the crystal '
      + 'on screen no longer matches this timeline. Reset to replay it faithfully.');
  }
});

els.btnSplitSeg.addEventListener('click', () => {
  const seg = working.segments[selectedSeg];
  if (seg.ticks < 2) return;
  const start = segmentStart(selectedSeg);
  const cursor = runners[0].sim.tickCount;
  let leftTicks = Math.floor(seg.ticks / 2); // fallback: split in half
  if (cursor > start && cursor < start + seg.ticks) leftTicks = cursor - start;
  const rightIndex = splitSegment(working.segments, selectedSeg, leftTicks);
  // Select the right half: the natural next edit shapes the future, not the
  // consumed past (maker-found defect: the stale selection meant the very
  // next slider move edited history and drew a mismatch warning).
  selectSegment(rightIndex);
});

els.btnDeleteSeg.addEventListener('click', () => {
  if (working.segments.length < 2) return;
  const start = segmentStart(selectedSeg);
  working.segments.splice(selectedSeg, 1);
  selectSegment(Math.min(selectedSeg, working.segments.length - 1));
  if (runners[0].sim.tickCount > start) {
    notice('You deleted a part of the journey the run has already passed — the crystal on '
      + 'screen no longer matches this timeline. Reset to replay it faithfully.');
  }
});

// --- journey: name / grid / save / load / export / import ----------------------
function refreshJourneyInputs() {
  els.journeyName.value = working.name;
  els.gridSizeInput.value = String(working.gridSize);
}

els.journeyName.addEventListener('change', () => {
  const name = els.journeyName.value.trim();
  if (name) working.name = name;
  refreshJourneyInputs();
});

els.gridSizeInput.addEventListener('change', () => {
  const value = parseInt(els.gridSizeInput.value, 10);
  if (Number.isInteger(value) && value >= GRID_BOUNDS.min && value <= GRID_BOUNDS.max) {
    working.gridSize = value;
    resetRunners();
    status(`Grid set to ${value} — world reset.`);
  }
  refreshJourneyInputs();
});

function loadHistory(history, sourceLabel) {
  working = cloneHistory(history);
  selectedSeg = 0;
  if (mode === 'compare') setCompare(false);
  refreshJourneyInputs();
  refreshSliders();
  renderTimeline();
  resetRunners();
  status(`Loaded ${sourceLabel} "${working.name}".`);
}

els.btnSave.addEventListener('click', () => {
  const name = els.journeyName.value.trim();
  if (!name) { status('Give the journey a name first.'); return; }
  working.name = name;
  try {
    saveHistory(working);
    renderSavedList();
    rebuildCompareOptions();
    status(`Saved "${name}".`);
  } catch (err) {
    status(`Not saved: ${err.message}`);
  }
});

els.btnExport.addEventListener('click', () => {
  try {
    exportHistory(working);
  } catch (err) {
    status(`Not exported: ${err.message}`);
  }
});

els.btnImport.addEventListener('click', () => els.importFile.click());
els.importFile.addEventListener('change', () => {
  const file = els.importFile.files[0];
  els.importFile.value = '';
  if (!file) return;
  importHistoryFile(file)
    .then((history) => {
      saveHistory(history);
      renderSavedList();
      rebuildCompareOptions();
      loadHistory(history, 'imported journey');
    })
    .catch((err) => status(`Import failed: ${err.message}`));
});

function renderHistoryList(listEl, items, actions) {
  listEl.textContent = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.textContent = '(none yet)';
    listEl.appendChild(li);
    return;
  }
  for (const history of items) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'name';
    span.textContent = `${history.name} — ${history.segments.length} seg, `
      + `${totalTicks(history.segments)} ticks, grid ${history.gridSize}`;
    li.appendChild(span);
    for (const action of actions) {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.addEventListener('click', () => action.run(history));
      li.appendChild(btn);
    }
    listEl.appendChild(li);
  }
}

function renderSavedList() {
  renderHistoryList(els.savedList, listSaved(), [
    { label: 'Load', run: (h) => loadHistory(h, 'saved journey') },
    {
      label: 'Delete',
      run: (h) => {
        deleteHistory(h.name);
        renderSavedList();
        rebuildCompareOptions();
        status(`Deleted "${h.name}".`);
      },
    },
  ]);
}

function renderPresetList() {
  renderHistoryList(els.presetList, PRESETS, [
    { label: 'Load', run: (h) => loadHistory(h, 'preset') },
  ]);
}

// --- compare mode ---------------------------------------------------------------
function rebuildCompareOptions() {
  const options = [{ value: 'current', label: `current — ${working.name}` }];
  PRESETS.forEach((preset, i) => options.push({ value: `preset:${i}`, label: preset.name }));
  for (const saved of listSaved()) {
    options.push({ value: `saved:${saved.name}`, label: `saved — ${saved.name}` });
  }
  for (const select of [els.selectA, els.selectB]) {
    const prev = select.value;
    select.textContent = '';
    for (const opt of options) {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      select.appendChild(el);
    }
    if ([...select.options].some((o) => o.value === prev)) select.value = prev;
  }
  if (els.selectA.value === els.selectB.value && els.selectB.options.length > 2) {
    // Default B to the *second* preset: the boot working journey is a clone of
    // the first, and comparing a journey with itself shows two identical twins.
    els.selectB.selectedIndex = 2;
  }
}

function resolveOption(value) {
  if (value.startsWith('preset:')) {
    return cloneHistory(PRESETS[parseInt(value.slice(7), 10)] || PRESETS[0]);
  }
  if (value.startsWith('saved:')) {
    const found = listSaved().find((h) => h.name === value.slice(6));
    if (found) return cloneHistory(found);
  }
  return cloneHistory(working);
}

function setCompare(on) {
  mode = on ? 'compare' : 'single';
  els.compareToggle.checked = on;
  els.compareSelects.classList.toggle('hidden', !on);
  els.canvasWrapB.classList.toggle('hidden', !on);
  els.conditionsBox.classList.toggle('hidden', on);
  els.timelineBox.classList.toggle('hidden', on);
  els.journeyBox.classList.toggle('hidden', on);
  if (on) rebuildCompareOptions();
  resetRunners();
}

els.compareToggle.addEventListener('change', () => setCompare(els.compareToggle.checked));
els.selectA.addEventListener('change', resetRunners);
els.selectB.addEventListener('change', resetRunners);

// --- boot -------------------------------------------------------------------------
// Control bounds and steps come from the SAME definition validateHistory
// enforces (history.mjs PARAM_BOUNDS / GRID_BOUNDS / MAX_SEGMENT_TICKS) —
// maker-found defect: hardcoded HTML attributes had drifted from the schema,
// so schema-valid values were unrepresentable on the sliders.
for (const slide of SLIDES) {
  const bounds = PARAM_BOUNDS[slide.key];
  slide.el.min = String(bounds.min);
  slide.el.max = String(bounds.max);
  slide.el.step = String(bounds.step);
}
els.gridSizeInput.min = String(GRID_BOUNDS.min);
els.gridSizeInput.max = String(GRID_BOUNDS.max);
els.segTicks.min = '1';
els.segTicks.max = String(MAX_SEGMENT_TICKS);

refreshJourneyInputs();
refreshSliders();
resetRunners(); // before renderTimeline: the cursor reads the lead runner
renderTimeline();
renderSavedList();
renderPresetList();
rebuildCompareOptions();
// Test hooks (used by the headless screenshot check; harmless otherwise):
// ?compare=1 opens compare mode, ?autoplay=1 starts the run immediately.
const bootQuery = new URLSearchParams(location.search);
if (bootQuery.get('compare')) setCompare(true);
if (bootQuery.get('autoplay')) setPlaying(true);
requestAnimationFrame(frame);
