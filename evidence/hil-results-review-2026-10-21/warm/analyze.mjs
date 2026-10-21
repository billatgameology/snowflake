// Bounded registered six-row selection/packaging recipe; numerical observations use unchanged functions.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { analyzeCavityRows } from '../../../runner/src/post-phase10-cavity-analysis.ts';

const [campaignArgument, bulkArgument, evidenceArgument, existingCampaignReport] = process.argv.slice(2);
if (!campaignArgument || !bulkArgument || !evidenceArgument) throw new Error('Usage: node analyze.mjs <warm-campaign> <bulk-output-directory> <new-evidence-directory> [existing-six-row-readout]');
const campaignDirectory = path.resolve(campaignArgument), bulkDirectory = path.resolve(bulkArgument), evidenceDirectory = path.resolve(evidenceArgument);
const campaign = JSON.parse(fs.readFileSync(path.join(campaignDirectory, 'campaign.json')));
const directories = campaign.rows.map(row => path.join(campaignDirectory, 'rows', row.id));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const identity = file => { const location = file instanceof URL ? fileURLToPath(file) : file; const bytes = fs.readFileSync(location); return { path: path.resolve(location), byteLength: bytes.length, sha256: digest(bytes) }; };
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); };
const report = existingCampaignReport ? JSON.parse(fs.readFileSync(existingCampaignReport)) : analyzeCavityRows(directories);
assert.equal(report.rows.length, 6); assert.equal(report.allRequestedRowsAdmissible, true);
assert.deepEqual(report.rows.map(r => r.rowId), campaign.rows.map(r => r.id));
if (!existingCampaignReport) write(path.join(bulkDirectory, 'cavity-readout.json'), report);

function values(frame, analysis) {
  const geometry = frame.geometry, seed = analysis.frames[0].geometry;
  return {
    cycle: frame.cycle, physicalAgeSeconds: frame.simTimeSeconds,
    largestCenterSpanUm: (frame.extent - 1) * analysis.row.dxUm,
    axialCenterSpanUm: geometry.spans.k.centerSpanUm,
    lateralCenterSpanUm: Math.max(geometry.spans.i.centerSpanUm, geometry.spans.j.centerSpanUm),
    occupiedCellVolumeUm3: geometry.occupiedCellVolumeUm3,
    probeFullWaistThicknessUm: geometry.waist.inclusiveThicknessUm,
    addedProbeFullWaistThicknessUm: geometry.waist.inclusiveThicknessUm - seed.waist.inclusiveThicknessUm,
    ...frame.enclosureWitnesses,
  };
}
function timeSelections(analysis) {
  return analysis.physicalTimeSelections.map(selection => ({ ...selection,
    atOrBeforeValues: values(analysis.frames.find(f => f.cycle === selection.atOrBefore.cycle), analysis),
    nextEventValues: selection.nextEvent === null ? null : values(analysis.frames.find(f => f.cycle === selection.nextEvent.cycle), analysis),
  }));
}
function intervalSummary(intervals) {
  return { count: intervals.length, survivingAtStop: intervals.filter(i => i.endExclusive === null).length,
    maxTipAdvanceWhileOpenUm: Math.max(0, ...intervals.map(i => i.maxTipAdvanceWhileOpenUm)),
    maxDepthBelowAxialEnvelopeUm: Math.max(0, ...intervals.map(i => i.maxDepthBelowAxialEnvelopeUm)),
    maxPostCutoffTipAdvanceWhileOpenUm: Math.max(0, ...intervals.map(i => i.postCutoff?.maxTipAdvanceWhileOpenUm ?? 0)),
    witnesses: intervals.map(i => ({ offset: i.offset, side: i.side, start: i.start, endExclusive: i.endExclusive,
      maxTipAdvanceWhileOpenUm: i.maxTipAdvanceWhileOpenUm, maxDepthBelowAxialEnvelopeUm: i.maxDepthBelowAxialEnvelopeUm,
      ...(i.postCutoff ? { postCutoff: i.postCutoff } : {}) })),
  };
}
const summaryRows = report.rows.map(r => {
  const a = r.analysis, h = a.basalWidthHistory, boundary = h && a.frames.find(f => f.cycle === h.boundaryFrameCycle), terminal = a.frames.at(-1);
  return { rowId: r.rowId, row: a.row, status: r.status, terminal: values(terminal, a),
    seed: values(a.frames[0], a), firstLaterallyEnclosedCenter: a.firstLaterallyEnclosedCenter,
    onsetSnapshotBracket: a.onsetSnapshotBracket,
    sizeSelections: a.sizeSelections.map(s => ({ ...s, values: s.selectedCycle === null ? null : values(a.frames.find(f => f.cycle === s.selectedCycle), a) })),
    allSixCommonAgeSelections: timeSelections(a),
    straightOpenIntervals: intervalSummary(a.straightOpenPlaneIntervals),
    terminalAxialProfile: terminal.geometry.layers,
    spatialCrossings: a.spatial.map(s => ({ record: s.record, facetCounts: s.profile.facetCounts })),
    ...(h ? { cutoff: { actualSwitchTimeSeconds: h.actualSwitchTimeSeconds, cutoffBoundary: h.cutoffBoundary,
      boundaryValues: boundary ? values(boundary, a) : null,
      original: intervalSummary(h.originalOpeningIntervals), newPostCutoff: intervalSummary(h.newPostCutoffOpeningIntervals),
      exposure: a.basalWidthObservation.cutoffExposure,
      postCutoffGrowthToOwnEndpoint: boundary ? { elapsedSeconds: terminal.simTimeSeconds - boundary.simTimeSeconds,
        axialCenterSpanIncrementUm: terminal.geometry.spans.k.centerSpanUm - boundary.geometry.spans.k.centerSpanUm,
        occupiedCellVolumeIncrementUm3: terminal.geometry.occupiedCellVolumeUm3 - boundary.geometry.occupiedCellVolumeUm3 } : null,
    } } : {}),
  };
});
const metricKeys = ['axialCenterSpanUm', 'lateralCenterSpanUm', 'occupiedCellVolumeUm3', 'addedProbeFullWaistThicknessUm', 'maxStraightOpenDepthBelowAxialEnvelopeUm'];
function contrast(left, right) {
  return Object.fromEntries(metricKeys.map(k => [k, left[k] - right[k]]));
}
const pairs = ['coarse', 'fine-thin', 'fine-thick'].map(configuration => {
  const ids = ['broad', 'early'].map(arm => `warm-refine-${configuration}-t4p5-${arm}`);
  const selected = directories.filter(d => ids.includes(path.basename(d)));
  const p = analyzeCavityRows(selected);
  assert.equal(p.allRequestedRowsAdmissible, true);
  write(path.join(bulkDirectory, `pair-${configuration}.json`), p);
  const broad = p.rows.find(r => r.rowId.endsWith('broad')).analysis, early = p.rows.find(r => r.rowId.endsWith('early')).analysis;
  return { configuration, broadId: ids[0], earlyId: ids[1], commonTerminalPhysicalAgeSeconds: p.groups[0].commonTerminalTimeSeconds,
    sameSize: broad.sizeSelections.map((s, n) => {
      const e = early.sizeSelections[n], bValues = values(broad.frames.find(f => f.cycle === s.selectedCycle), broad), eValues = values(early.frames.find(f => f.cycle === e.selectedCycle), early);
      return { targetCenterSpanUm: s.targetCenterSpanUm, broad: bValues, early: eValues, bothExactTargets: s.exactTarget && e.exactTarget,
        earlyMinusBroad: contrast(eValues, bValues) };
    }),
    commonAges: timeSelections(broad).map((b, n) => {
      const e = timeSelections(early)[n];
      const alternatives = [e.atOrBeforeValues, e.nextEventValues].filter(Boolean).flatMap(ev =>
        [b.atOrBeforeValues, b.nextEventValues].filter(Boolean).map(bv => contrast(ev, bv)));
      return { fraction: b.fraction, requestedTimeSeconds: b.requestedTimeSeconds, broad: b, early: e,
        earlyMinusBroadAtOrBefore: contrast(e.atOrBeforeValues, b.atOrBeforeValues),
        adjacentEventAlternativeRanges: Object.fromEntries(metricKeys.map(k => [k, [Math.min(...alternatives.map(v => v[k])), Math.max(...alternatives.map(v => v[k]))]])) };
    }),
  };
});
const sources = new Map();
for (const r of report.rows) for (const source of r.analysis.sources) sources.set(source.path, source);
const inputs = { schema: 'warm-six-row-inputs-v1', campaign: identity(path.join(campaignDirectory, 'campaign.json')),
  scientificInputs: [...sources.values()], analyzerSources: ['post-phase10-cavity-analysis.ts', 'post-phase10-cavity-geometry.ts', 'post-phase10-cavity-spatial.ts'].map(f => identity(new URL('../../../runner/src/' + f, import.meta.url))),
  recipe: identity(new URL(import.meta.url)),
  priorEndpointCheck: 'Primary out/status-2026-10-21/warm.json used summarizeFirstBatchRow/firstBatchRowIsComplete under fixed 838c294; six size endpoints, zero errors.',
};
const summary = { schema: 'warm-representation-summary-v1', generatedAt: new Date().toISOString(),
  scope: report.scope, definitions: report.definitions, options: report.options,
  allRequestedRowsAdmissible: report.allRequestedRowsAdmissible,
  allSixCommonPhysicalAgeSeconds: report.groups[0].commonTerminalTimeSeconds,
  rowCount: summaryRows.length, rows: summaryRows, pairs,
  historicalFiveArmVerdictUsed: false,
  limits: ['All-six and within-pair ages differ and remain separately labeled.', 'Adjacent-event alternatives are deterministic sampling choices, not confidence intervals.',
    'Signed layers/intervals are not independent cavities. An open witness is not a complete 3D closure test.',
    'Terminal comparisons have matched size and unequal ages; no occupancy interpolation.',
    'No full-field/partial-fill equivalence, continuum convergence, domain independence, physical identification or validation claim.',
    'Two voxelized seed thicknesses do not bound nonlinear outcomes. No inference from the inapplicable historical five-arm width-three flag.'],
};
write(path.join(evidenceDirectory, 'inputs.json'), inputs);
write(path.join(evidenceDirectory, 'summary.json'), summary);
console.log(JSON.stringify({ rows: summary.rowCount, pairs: pairs.length, commonAge: summary.allSixCommonPhysicalAgeSeconds,
  summary: path.join(evidenceDirectory, 'summary.json'), inputs: path.join(evidenceDirectory, 'inputs.json'),
  bulkDirectory, allRequestedRowsAdmissible: summary.allRequestedRowsAdmissible }));
