// Retrospective attachment increments; no solver construction or checkpoint adoption.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { hexSeedSites, coordsOf, domainCenter, cartesian } from '../../../core/src/index.ts';
import { measureCavityGeometry } from '../../../runner/src/post-phase10-cavity-geometry.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';

const inputRoot = resolve(process.argv[2] ?? 'C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable');
const output = resolve(process.argv[3] ?? fileURLToPath(new URL('./warm.json', import.meta.url)));
const sources = [];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function read(rowId, name, lines = false) {
  const path = resolve(inputRoot, 'rows', rowId, name), bytes = readFileSync(path);
  sources.push({ rowId, name, bytes: bytes.length, sha256: digest(bytes) });
  return lines ? bytes.toString().trim().split('\n').map(JSON.parse) : JSON.parse(bytes);
}
function load(rowId) {
  const spec = read(rowId, 'spec.json'), result = read(rowId, 'result.json');
  const events = read(rowId, 'events.jsonl', true), row = spec.row;
  const dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN };
  const seed = new Set(hexSeedSites(dims, row.seedRadius, row.seedThickness));
  const occupied = new Set(seed), lo = Array(5).fill(Infinity), hi = Array(5).fill(-Infinity);
  function add(index) {
    const c = coordsOf(dims, index), xy = cartesian(...c), values = [...c, ...xy];
    for (let k = 0; k < 5; k++) { lo[k] = Math.min(lo[k], values[k]); hi[k] = Math.max(hi[k], values[k]); }
  }
  function state(cycle, simTimeSeconds) {
    const axialCells = hi[2] - lo[2] + 1, lateralCells = Math.max(hi[3] - lo[3], hi[4] - lo[4]) + 1;
    return { cycle, simTimeSeconds, attachedCount: occupied.size, axialCells,
      cartesianLateralInclusiveCells: lateralCells, aspectRatio: axialCells / lateralCells,
      extent: Math.max(...lo.slice(0, 3).map((v, k) => hi[k] - v + 1)),
      minK: lo[2], maxK: hi[2] };
  }
  for (const index of seed) add(index);
  const states = [state(0, 0)];
  for (const e of events) {
    for (const site of e.attached) {
      if (occupied.has(site.index) || coordsOf(dims, site.index).some((v, k) => v !== site.coords[k])) throw Error(`${rowId}: invalid attachment`);
      occupied.add(site.index); add(site.index);
    }
    const s = state(e.cycle, e.simTimeSeconds);
    if (s.attachedCount !== e.attachedCount || s.aspectRatio !== e.aspectRatio || s.extent !== e.extent) throw Error(`${rowId}: geometry mismatch`);
    states.push(s);
  }
  if (states.at(-1).attachedCount !== result.attachedCount || states.at(-1).cycle !== result.cycles) throw Error(`${rowId}: terminal mismatch`);
  const firstInactive = events.find(e => e.basalWidthObservation?.historyActive === false);
  return { rowId, row, result, events, seed, dims, states, firstInactive };
}
function profile(r, cycle) {
  const occupied = new Set(r.seed);
  for (const e of r.events) { if (e.cycle > cycle) break; for (const a of e.attached) occupied.add(a.index); }
  const g = measureCavityGeometry(occupied, r.dims, r.row.dxUm);
  if (g.layers.reduce((s, p) => s + p.attachedCount, 0) !== occupied.size) throw Error('plane census mismatch');
  return { ...r.states.find(s => s.cycle === cycle), waist: g.waist,
    straightOpenLayers: g.layers.filter(p => p.lateralVoid === 'enclosed' && (p.directAxialOpening.lower || p.directAxialOpening.upper)).length,
    planes: g.layers.map(p => ({ offset: p.offset, attachedCount: p.attachedCount, lateralVoid: p.lateralVoid })) };
}
function window(r, start, end) {
  const a = bracketCavityTime(r.states, start), b = bracketCavityTime(r.states, end);
  const first = a.atOrBefore, last = b.atOrBefore, center = domainCenter(r.dims);
  const additions = r.events.filter(e => e.cycle > first.cycle && e.cycle <= last.cycle).flatMap(e => e.attached);
  if (additions.length !== last.attachedCount - first.attachedCount) throw Error('increment census mismatch');
  const byPlane = new Map();
  for (const site of additions) { const k = site.coords[2] - center[2]; byPlane.set(k, (byPlane.get(k) ?? 0) + 1); }
  const outsideStartingAxialEnvelope = additions.filter(a => a.coords[2] < first.minK || a.coords[2] > first.maxK).length;
  const variations = [];
  const endpoints = bracket => bracket.exactEventTime ? [bracket.atOrBefore] : [bracket.atOrBefore, bracket.nextEvent].filter(Boolean);
  for (const s of endpoints(a)) for (const t of endpoints(b)) {
    if (t.simTimeSeconds < s.simTimeSeconds) continue;
    variations.push({ addedSites: t.attachedCount - s.attachedCount,
      axialSpanIncrementUm: (t.axialCells - s.axialCells) * r.row.dxUm,
      lateralSpanIncrementUm: (t.cartesianLateralInclusiveCells - s.cartesianLateralInclusiveCells) * r.row.dxUm });
  }
  const range = key => [Math.min(...variations.map(v => v[key])), Math.max(...variations.map(v => v[key]))];
  return { rowId: r.rowId, startRequestedSeconds: start, endRequestedSeconds: end,
    startBracket: a, endBracket: b, startProfile: profile(r, first.cycle), endProfile: profile(r, last.cycle),
    addedSites: additions.length, outsideStartingAxialEnvelope, withinStartingAxialEnvelope: additions.length - outsideStartingAxialEnvelope,
    axialSpanIncrementUm: (last.axialCells - first.axialCells) * r.row.dxUm,
    lateralSpanIncrementUm: (last.cartesianLateralInclusiveCells - first.cartesianLateralInclusiveCells) * r.row.dxUm,
    addedByPlane: [...byPlane.entries()].sort((a, b) => a[0] - b[0]).map(([offset, count]) => ({ offset, count })),
    recordedBracketRanges: { addedSites: range('addedSites'), axialSpanIncrementUm: range('axialSpanIncrementUm'), lateralSpanIncrementUm: range('lateralSpanIncrementUm') } };
}
const groups = [];
for (const tag of ['t4p5', 't5']) {
  const rows = ['broad', 'early', 'full'].map(arm => load(`batch1-bld-warm-${tag}-${arm}`));
  const early = rows[1], inactive = early.firstInactive;
  if (!inactive) throw Error('early row never switched');
  const start = inactive.basalWidthObservation.simTimeSecondsBeforeUpdate;
  const end = Math.min(...rows.map(r => r.result.simTimeSeconds));
  if (!(end > start) || early.states[inactive.cycle - 1].simTimeSeconds !== start) throw Error('invalid switch boundary');
  const after = early.events.filter(e => e.cycle >= inactive.cycle);
  if (after.some(e => e.basalWidthObservation.historyActive !== false || e.basalWidthObservation.selectedBasalCells !== 0 || e.basalWidthObservation.selectedKineticDemandFill !== 0)) throw Error('nonzero post-switch intervention');
  groups.push({ tempC: early.row.tempC, fraction: early.row.fraction, switchTimeSeconds: start,
    commonWindowEndSeconds: end, commonWindowDurationSeconds: end - start,
    rows: rows.map(r => window(r, start, end)),
    earlyWholeRemainingWindow: window(early, start, early.result.simTimeSeconds),
    postSwitchSelectedCellUpdates: 0, postSwitchSelectedKineticDemandFill: 0 });
}
const report = { claimLevel: 'Retrospective discrete-model analysis; no physical validation or grid independence.',
  method: { time: 'Start is the early row actual switch boundary; all three arms sampled at common absolute times. The broad control has a different starting geometry. Recorded at-or-before states plus next events, no interpolation.',
    increment: 'New attachments after start state through end state. Counts include kinetic and geometric-completion attachments and exclude partial fill; these are occupancy increments, not mass or isolated kinetic uptake.',
    envelope: 'Outside starting axial envelope means k below starting minimum or above starting maximum; its complement includes lateral expansion as well as interior additions.',
    bracketRanges: 'Extrema over recorded start/end bracket combinations, using the exact state alone at an exact event time; not continuous bounds.',
    openings: 'Existing center-component flood fill and straight axial opening helper; signed layers are not separate cavities.' },
  scriptSha256: digest(readFileSync(fileURLToPath(import.meta.url))), inputRoot, sources, groups };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(groups.map(g => ({ tempC: g.tempC, duration: g.commonWindowDurationSeconds,
  rows: g.rows.map(r => ({ rowId: r.rowId, addedSites: r.addedSites, outside: r.outsideStartingAxialEnvelope,
    axialIncrement: r.axialSpanIncrementUm, lateralIncrement: r.lateralSpanIncrementUm,
    openLayers: [r.startProfile.straightOpenLayers, r.endProfile.straightOpenLayers], ranges: r.recordedBracketRanges })) })), null, 2));
