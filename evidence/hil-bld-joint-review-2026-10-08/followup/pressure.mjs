import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { hexSeedSites, coordsOf, domainCenter, cartesian } from '../../../core/src/index.ts';
import { firstBatchRows } from '../../../runner/src/hil-bld-batch-roster.ts';
import { HIL_BATCH2_ROWS } from '../../../runner/src/hil-batch2-roster.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';
import { measureCavityGeometry } from '../../../runner/src/post-phase10-cavity-geometry.ts';

// Offline occupancy analysis only. Arguments: first campaign, second campaign, absent output.
if (process.argv.length !== 5) throw Error('Expected first campaign root, second campaign root, absent output JSON');
const roots = process.argv.slice(2, 4).map(p => resolve(p));
const output = resolve(process.argv[4]);
const priorPath = resolve('evidence/hil-bld-joint-review-2026-10-08/hil/analysis-v2.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const priorBytes = readFileSync(priorPath), prior = JSON.parse(priorBytes);
const sources = [];
function load(root, id, file, json = true) {
  const path = resolve(root, 'rows', id, file), bytes = readFileSync(path), digest = sha256(bytes);
  const previous = prior.sources.filter(s => s.path.replaceAll('\\', '/').endsWith(`/rows/${id}/${file}`));
  assert.equal(previous.length, 1, `prior source binding missing: ${id}/${file}`);
  assert.equal(bytes.length, previous[0].bytes); assert.equal(digest, previous[0].sha256);
  sources.push({ rowId: id, file, path, bytes: bytes.length, sha256: digest, matchesPriorReport: true });
  return json ? JSON.parse(bytes) : bytes.toString();
}
const hexRadius = (i, j) => Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j));
const sum = values => values.reduce((a, b) => a + b, 0);

function profile(occupied, row) {
  const dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN };
  const geometry = measureCavityGeometry(occupied, dims, row.dxUm);
  const [ci, cj, ck] = domainCenter(dims), planes = new Map(), shells = new Map();
  for (const index of occupied) {
    const [i, j, k] = coordsOf(dims, index), di = i - ci, dj = j - cj;
    const z = k - ck, r = hexRadius(di, dj);
    const p = planes.get(z) ?? { cells: new Set(), shells: new Map() };
    p.cells.add(`${di},${dj}`); p.shells.set(r, (p.shells.get(r) ?? 0) + 1); planes.set(z, p);
    shells.set(r, (shells.get(r) ?? 0) + 1);
  }
  const layers = geometry.layers.map(layer => {
    const p = planes.get(layer.offset) ?? { cells: new Set(), shells: new Map() };
    let fullCore = -1;
    for (let r = 0; r <= (layer.integerHexRadius ?? -1); r++) {
      if ((p.shells.get(r) ?? 0) !== (r === 0 ? 1 : 6 * r)) break;
      fullCore = r;
    }
    const radialShells = [...p.shells].sort((a, b) => a[0] - b[0]).map(([radiusCells, attachedCount]) => ({ radiusCells, attachedCount }));
    assert.equal(sum(radialShells.map(s => s.attachedCount)), layer.attachedCount);
    return { ...layer, fullCoreHexRadiusCells: fullCore, fullCoreHexRadiusUm: fullCore < 0 ? null : fullCore * row.dxUm,
      sitesOutsideFullCore: layer.attachedCount - (fullCore < 0 ? 0 : 1 + 3 * fullCore * (fullCore + 1)), radialShells };
  });
  const radialShells = [...shells].sort((a, b) => a[0] - b[0]).map(([radiusCells, attachedCount]) => ({ radiusCells, attachedCount }));
  assert.equal(sum(layers.map(p => p.attachedCount)), occupied.size);
  assert.equal(sum(radialShells.map(s => s.attachedCount)), occupied.size);
  return { attachedCount: occupied.size, spans: geometry.spans, integerHexRadius: geometry.integerHexRadius,
    layers, radialShells, centerAirLayers: layers.filter(p => !p.centerOccupied).map(p => p.offset),
    enclosedCenterAirLayers: layers.filter(p => p.lateralVoid === 'enclosed').map(p => p.offset),
    sumsVerified: true };
}

function readRow(entry, root) {
  const spec = load(root, entry.row.id, 'spec.json'), row = spec.row;
  const result = load(root, row.id, 'result.json'), exit = load(root, row.id, 'exit.json');
  const events = load(root, row.id, 'events.jsonl', false).trim().split('\n').map(JSON.parse);
  assert.equal(exit.exitCode, 0); assert.equal(result.rowId, row.id); assert.equal(result.stopReason, 'size-target');
  assert.equal(row.experimentalFacetDips, 'both'); assert.equal(row.seedRadius, 2); assert.equal(row.seedThickness, 1);
  const dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN }, seed = hexSeedSites(dims, row.seedRadius, row.seedThickness);
  const occupied = new Set(seed), states = [], lo = [Infinity, Infinity, Infinity, Infinity, Infinity], hi = lo.map(() => -Infinity);
  function include(index) { const coords = coordsOf(dims, index), [x, y] = cartesian(...coords), v = [...coords, x, y]; for (let j = 0; j < 5; j++) { lo[j] = Math.min(lo[j], v[j]); hi[j] = Math.max(hi[j], v[j]); } }
  function state(cycle, simTimeSeconds) {
    const spans = lo.slice(0, 3).map((v, j) => hi[j] - v + 1);
    return { cycle, simTimeSeconds, attachedCount: occupied.size, extent: Math.max(...spans),
      iCells: spans[0], jCells: spans[1], axialCells: spans[2], aspectRatio: spans[2] / (Math.max(hi[3] - lo[3], hi[4] - lo[4]) + 1) };
  }
  seed.forEach(include); states.push(state(0, 0));
  for (const e of events) {
    for (const a of e.attached) {
      assert.deepEqual(coordsOf(dims, a.index), a.coords); assert(!occupied.has(a.index)); occupied.add(a.index); include(a.index);
    }
    const s = state(e.cycle, e.simTimeSeconds);
    assert.equal(s.attachedCount, e.attachedCount); assert.equal(s.extent, e.extent); assert.equal(s.aspectRatio, e.aspectRatio);
    states.push(s);
  }
  assert.equal(states.at(-1).attachedCount, result.attachedCount); assert.equal(states.at(-1).cycle, result.cycles);
  assert.equal(states.at(-1).simTimeSeconds, result.simTimeSeconds);
  function occupancyAt(cycle) {
    const cells = new Set(seed);
    for (const e of events) { if (e.cycle > cycle) break; for (const a of e.attached) cells.add(a.index); }
    return cells;
  }
  return { row, result, states, occupancyAt, seedCount: seed.length };
}

const selected = [...firstBatchRows('HIL').map(entry => ({ entry, root: roots[0] })),
  ...HIL_BATCH2_ROWS.map(entry => ({ entry, root: roots[1] }))]
  .filter(({ entry: e }) => e.track === 'pressure' && [.1, .2].includes(e.row.fraction) && e.row.experimentalFacetDips === 'both')
  .map(({ entry, root }) => readRow(entry, root)).sort((a, b) => a.row.fraction - b.row.fraction || a.row.pressurePa - b.row.pressurePa);
assert.equal(selected.length, 6);

function difference(a, b, row) {
  const aOnly = new Set([...a].filter(i => !b.has(i))), bOnly = new Set([...b].filter(i => !a.has(i)));
  const pa = profile(a, row), pb = profile(b, row);
  const offsets = [...new Set([...pa.layers, ...pb.layers].map(p => p.offset))].sort((x, y) => x - y);
  const axialCounts = offsets.map(offset => { const ca = pa.layers.find(p => p.offset === offset)?.attachedCount ?? 0, cb = pb.layers.find(p => p.offset === offset)?.attachedCount ?? 0; return { offset, a: ca, b: cb, aMinusB: ca - cb }; });
  const radii = [...new Set([...pa.radialShells, ...pb.radialShells].map(s => s.radiusCells))].sort((x, y) => x - y);
  const radialCounts = radii.map(radiusCells => { const ca = pa.radialShells.find(s => s.radiusCells === radiusCells)?.attachedCount ?? 0, cb = pb.radialShells.find(s => s.radiusCells === radiusCells)?.attachedCount ?? 0; return { radiusCells, a: ca, b: cb, aMinusB: ca - cb }; });
  assert.equal(sum(axialCounts.map(p => p.aMinusB)), a.size - b.size); assert.equal(sum(radialCounts.map(p => p.aMinusB)), a.size - b.size);
  return { aAttached: a.size, bAttached: b.size, aMinusB: a.size - b.size, intersection: a.size - aOnly.size,
    aOnlyCount: aOnly.size, bOnlyCount: bOnly.size, axialCounts, radialCounts };
}

const groups = [.1, .2].map(fraction => {
  const group = selected.filter(r => r.row.fraction === fraction), commonTime = Math.min(...group.map(r => r.result.simTimeSeconds));
  const rows = group.map(r => {
    const bracket = bracketCavityTime(r.states, commonTime), terminal = r.states.at(-1), first17 = r.states.find(s => s.extent >= 17);
    const endpointCells = r.occupancyAt(terminal.cycle), startCells = r.occupancyAt(first17.cycle);
    const newCells = new Set([...endpointCells].filter(i => !startCells.has(i)));
    assert.equal(newCells.size, terminal.attachedCount - first17.attachedCount);
    return { row: r.row, producer: r.result.gitHead, seedCount: r.seedCount,
      endpoint: { state: terminal, profile: profile(endpointCells, r.row) },
      commonAge: { ...bracket, atOrBeforeProfile: profile(r.occupancyAt(bracket.atOrBefore.cycle), r.row),
        nextEventProfile: bracket.nextEvent ? profile(r.occupancyAt(bracket.nextEvent.cycle), r.row) : null },
      growthFromFirstExtent17: { start: first17, end: terminal, elapsedSeconds: terminal.simTimeSeconds - first17.simTimeSeconds,
        newAttachedCount: newCells.size, axialSpanIncrementCells: terminal.axialCells - first17.axialCells,
        iSpanIncrementCells: terminal.iCells - first17.iCells, jSpanIncrementCells: terminal.jCells - first17.jCells,
        profile: profile(newCells, r.row) } };
  });
  const pairwise = [[0, 1], [1, 2], [0, 2]].map(([a, b]) => ({ pressureAPa: group[a].row.pressurePa, pressureBPa: group[b].row.pressurePa,
    endpoint: difference(group[a].occupancyAt(group[a].states.at(-1).cycle), group[b].occupancyAt(group[b].states.at(-1).cycle), group[a].row),
    commonAgeAtOrBefore: difference(group[a].occupancyAt(rows[a].commonAge.atOrBefore.cycle), group[b].occupancyAt(rows[b].commonAge.atOrBefore.cycle), group[a].row) }));
  return { fraction, commonTimeSeconds: commonTime, rows, pairwise };
});
const report = { schema: 'hil-pressure-structure-followup-v1', createdAt: new Date().toISOString(),
  claimLevel: 'Post-hoc internal model-development occupancy analysis, no new simulation or physical validation',
  method: {
    rows: 'Six both-dip rows at -6 C, fractions .10/.20, pressures 50662.5/101325/202650 Pa; matched N64, dx .35 um, radius-two thickness-one 19-site seed. Neither and isolated-facet controls remain in the prior report, not included here.',
    reconstruction: 'Canonical hex seed plus unique event attachment indices; coordinates, total attached count, lattice extent and Cartesian aspect ratio recomputed at every event. Raw spec/result/exit/event bytes match prior pinned source hashes.',
    plane: 'Each occupied axial bounding layer, signed integer offset from the domain-center plane; count includes seed occupancy.',
    radius: 'Hex-coordinate shell r=max(abs(i-ci),abs(j-cj),abs(i-ci+j-cj)), not a Euclidean radius. Full core is largest complete centered integer hex ball; -1 means center absent. Empty shell counts are zero.',
    cavity: 'Existing measureCavityGeometry classifies only the empty-center planar component. Center-occupied does not rule out off-axis voids; no complete 3D cavity census is claimed.',
    time: 'Endpoint comparisons have equal maximum extent21 but unequal physical ages. Common physical age is shortest terminal time within each pressure triplet; at-or-before and next event are retained without interpolation.',
    newGrowth: 'Difference of occupied-site sets from first event reaching extent>=17 to terminal; these intervals have different ages and durations. New-site geometry describes that subset, not whole-crystal cavities.',
    limits: 'Attached occupancy excludes partial fill and is not total accreted mass. Small lattice-scale morphology, no grid/domain independence, no fixed-geometry transport isolation or physical causality.' },
  priorReport: { path: priorPath, bytes: priorBytes.length, sha256: sha256(priorBytes) },
  groups, sources, checks: { sixRows: true, allRawHashesMatchPrior: true, everyEventGeometryReconstructed: true, allProfilePlaneAndShellSumsMatch: true } };
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, sha256: sha256(readFileSync(output)), groups: groups.map(g => ({ fraction: g.fraction,
  rows: g.rows.map(r => ({ pressurePa: r.row.pressurePa, attachedCount: r.endpoint.state.attachedCount,
    centerPlaneAttachedCount: r.endpoint.profile.layers.find(p => p.offset === 0).attachedCount,
    enclosedCenterAirLayers: r.endpoint.profile.enclosedCenterAirLayers,
    commonAge: [r.commonAge.atOrBefore.simTimeSeconds, r.commonAge.nextEvent?.simTimeSeconds ?? null, r.commonAge.atOrBefore.attachedCount],
    newGrowth: r.growthFromFirstExtent17.newAttachedCount })),
  endpointPairs: g.pairwise.map(p => ({ pressureAPa: p.pressureAPa, pressureBPa: p.pressureBPa,
    aMinusB: p.endpoint.aMinusB, aOnly: p.endpoint.aOnlyCount, bOnly: p.endpoint.bOnlyCount })) })) }, null, 2));
