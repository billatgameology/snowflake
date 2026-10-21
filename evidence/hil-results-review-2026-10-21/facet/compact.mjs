import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Select existing readout fields; no solver or replacement scientific calculation.
assert.equal(process.argv.length, 5, 'usage: node compact.mjs READOUT.json ABSENT_SUMMARY.json ABSENT_INPUTS.json');
const [input, summaryPath, inputsPath] = process.argv.slice(2).map(p => resolve(p));
const bytes = readFileSync(input), r = JSON.parse(bytes);
const hash = b => createHash('sha256').update(b).digest('hex');
const keys = ['axialCells', 'lateralCartesianCenterSpanUm', 'attachedCount'];
const triplet = x => [x.atOrBefore, x.min, x.max];
const fields = x => Object.fromEntries(keys.map(k => [k, triplet(x[k])]));
const selectedWindow = w => ({startSeconds:w.startSeconds, endSeconds:w.endSeconds,
  facets:w.facetContrasts.map(g => ({tempC:g.tempC, cflFill:g.cflFill,
    contrasts:g.contrasts.map(c => ({armMinusArm:c.armMinusArm, values:fields(c.difference)}))})),
  timestep:w.timestepContrasts.map(g => ({tempC:g.tempC, arm:g.arm,
    halfCflMinusOriginal:fields(g.halfCflMinusOriginal)}))});
const endpoints = r.endpoints.map(e => ({rowId:e.rowId, tempC:e.tempC, cflFill:e.cflFill,
  arm:e.arm, producer:e.producer, wallSeconds:e.wallSeconds,
  terminalSeconds:e.terminal.simTimeSeconds, terminalCycles:e.terminal.cycle,
  initial:e.initial, disposition:e.coverage.disposition}));
const growth = r.cumulative.at(-1).rows.map(e => ({rowId:e.rowId,
  values:Object.fromEntries(keys.map(k => [k, [e.growth.atOrBeforeIncrements[k],
    e.growth.recordedEndpointSensitivity[k].min,e.growth.recordedEndpointSensitivity[k].max]]))}));
const output = {schema:'facet-attribution-compact-oct21-v1', scope:r.scope,
  definitions:{...r.definitions, triplet:'[at-or-before value, minimum, maximum over adjacent recorded endpoint alternatives]; not a confidence interval or a continuous-time bound.',
    axialCells:'Change in total occupied axial layer count after subtracting initial seed; each layer equals 0.35 micrometres of total axial center span.',
    lateralCartesianCenterSpanUm:'Change in maximum Cartesian lateral occupied center span, in micrometres.',
    attachedCount:'New attached lattice sites after subtracting the initial 37 sites; not deposited mass.'},
  fullReadout:{path:relative(process.cwd(),input).replaceAll('\\','/'),bytes:bytes.length,sha256:hash(bytes)},
  methodSource:r.methodSource, readoutScript:r.script, exactReadoutCommand:r.exactCommand,
  producers:r.producers,census:r.census,compatibility:r.compatibility,
  commonAgeSeconds:r.commonAgeSeconds,commonAgeWitness:r.commonAgeWitness,
  quarterAges:r.quarterAges,anchorReadout:r.anchorReadout,endpoints,
  commonEndGrowth:growth,cumulative:r.cumulative.map(selectedWindow),consecutive:r.consecutive.map(selectedWindow)};
writeFileSync(summaryPath, JSON.stringify(output,null,2)+'\n', {flag:'wx'});
writeFileSync(inputsPath, JSON.stringify({schema:'facet-attribution-inputs-oct21-v1',
  fullReadout:output.fullReadout,producers:r.producers,sources:r.sources},null,2)+'\n', {flag:'wx'});
console.log(JSON.stringify({summaryPath,inputsPath,sourceFiles:r.sources.length,
  summaryBytes:readFileSync(summaryPath).length,inputsBytes:readFileSync(inputsPath).length},null,2));
