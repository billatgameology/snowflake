import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {fileURLToPath} from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { hexSeedSites, coordsOf, cartesian } from '../../../core/src/index.ts';
import { firstBatchRows } from '../../../runner/src/hil-bld-batch-roster.ts';
import { HIL_BATCH2_ROWS } from '../../../runner/src/hil-batch2-roster.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';

// Requested offline triage of retained observations. No solver execution or input mutation.
assert.equal(process.argv.length,6,'usage: node readout.mjs OCT11_ROOT DOMAIN_SEED_ROOT FACET_PRESSURE_ROOT ABSENT_OUTPUT.json');
const [oldRoot,bothRoot,hybridRoot,destination]=process.argv.slice(2).map(p=>resolve(p));
const sources = [];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function load(path, json = true) {
  const bytes = readFileSync(path);
  sources.push({path, bytes: bytes.length, sha256: sha256(bytes)});
  return json ? JSON.parse(bytes) : bytes.toString('utf8');
}
function readRow(entry, root) {
  const directory = resolve(root, 'rows', entry.row.id);
  const {row} = load(resolve(directory, 'spec.json'));
  const result = load(resolve(directory, 'result.json'));
  const events = load(resolve(directory, 'events.jsonl'), false).trim().split('\n').map(JSON.parse);
  assert.equal(row.id, entry.row.id);
  assert.equal(result.rowId, row.id);
  assert.equal(result.stopReason, 'size-target');
  assert.equal(result.admissible, true);
  assert.deepEqual(result.integrityErrors, []);
  const dims = {nx: row.dimsN, ny: row.dimsN, nz: row.dimsN};
  const center = Math.floor(row.dimsN / 2);
  const occupied = new Set(hexSeedSites(dims, row.seedRadius, row.seedThickness));
  const lo = Array(5).fill(Infinity), hi = Array(5).fill(-Infinity);
  let hexRadius = 0;
  function include(coords) {
    const [i, j] = coords;
    hexRadius = Math.max(hexRadius, Math.abs(i-center), Math.abs(j-center), Math.abs(i+j-2*center));
    const v = [...coords, ...cartesian(...coords).slice(0,2)];
    for (let axis=0; axis<5; axis++) {lo[axis]=Math.min(lo[axis],v[axis]); hi[axis]=Math.max(hi[axis],v[axis]);}
  }
  for (const index of occupied) include(coordsOf(dims, index));
  function state(cycle, simTimeSeconds) {
    const iCells=hi[0]-lo[0]+1, jCells=hi[1]-lo[1]+1, axialCells=hi[2]-lo[2]+1;
    const lateralCartesianCells=Math.max(hi[3]-lo[3],hi[4]-lo[4])+1;
    return {cycle,simTimeSeconds,dxUm:row.dxUm,attachedCount:occupied.size,extent:Math.max(iCells,jCells,axialCells),
      iCells,jCells,axialCells,lateralCartesianCells,hexRadius,
      axialCenterSpanUm:(axialCells-1)*row.dxUm,lateralCartesianCenterSpanUm:(lateralCartesianCells-1)*row.dxUm,
      aspectRatio:axialCells/lateralCartesianCells,kMin:lo[2],kMax:hi[2]};
  }
  const states=[state(0,0)];
  for (const [index,event] of events.entries()) {
    assert.equal(event.cycle,index+1,`${row.id}: missing or repeated cycle`);
    assert(event.simTimeSeconds > states.at(-1).simTimeSeconds);
    for (const site of event.attached) {
      assert.deepEqual(site.coords,coordsOf(dims,site.index));
      assert(!occupied.has(site.index),`${row.id}: duplicate site`);
      occupied.add(site.index); include(site.coords);
    }
    const s=state(event.cycle,event.simTimeSeconds);
    for(const key of ['attachedCount','extent','aspectRatio']) assert.equal(s[key],event[key],`${row.id}: ${key} cycle ${event.cycle}`);
    states.push(s);
  }
  assert.equal(events.length,result.cycles);
  for(const key of ['attachedCount','extent','aspectRatio','simTimeSeconds']) assert.equal(states.at(-1)[key],result[key]);
  assert.equal(states[0].attachedCount+events.reduce((sum,e)=>sum+e.attached.length,0),result.attachedCount);
  const transitions=events.filter(e=>e.timelineEvent);
  assert.equal(transitions.length,row.timelineEvent?1:0);
  if(row.timelineEvent) {
    assert.equal(transitions[0].cycle,result.timeline.eventCycle);
    assert.equal(transitions[0].timelineEvent.logEntry.crossingBoundary.completedCycles,result.timeline.eventCycle);
    assert.equal(states.find(s=>s.extent>=row.timelineEvent.triggerLargestExtent).cycle,result.timeline.eventCycle);
  }
  return {row,result,events,states,center,eventState:transitions.length?states[transitions[0].cycle]:null};
}
const valueKeys=['attachedCount','axialCells','axialCenterSpanUm','lateralCartesianCenterSpanUm','aspectRatio'];
const delta=(a,b)=>({...Object.fromEntries(valueKeys.map(key=>[key,b[key]-a[key]])),
  axialCenterSpanUm:(b.axialCells-a.axialCells)*a.dxUm,
  lateralCartesianCenterSpanUm:(b.lateralCartesianCells-a.lateralCartesianCells)*a.dxUm});
const choices=b=>b.exactEventTime||b.nextEvent===null?[b.atOrBefore]:[b.atOrBefore,b.nextEvent];
function increments(r,start,end) {
  assert(start.cycle<=end.cycle);
  const added=r.events.slice(start.cycle,end.cycle).flatMap(e=>e.attached);
  const classes={insideOldEnvelope:0,axialOnly:0,lateralOnly:0,axialAndLateral:0};
  for(const {coords:[i,j,k]} of added){
    const ax=k<start.kMin||k>start.kMax;
    const lateral=Math.max(Math.abs(i-r.center),Math.abs(j-r.center),Math.abs(i+j-2*r.center))>start.hexRadius;
    classes[ax?(lateral?'axialAndLateral':'axialOnly'):(lateral?'lateralOnly':'insideOldEnvelope')]++;
  }
  assert.equal(added.length,end.attachedCount-start.attachedCount);
  assert.equal(Object.values(classes).reduce((a,b)=>a+b,0),added.length);
  return {...delta(start,end),durationSeconds:end.simTimeSeconds-start.simTimeSeconds,
    completedUpdates:end.cycle-start.cycle,newAttachmentEnvelopeClasses:classes};
}
function window(r,startTime,endTime) {
  const start=bracketCavityTime(r.states,startTime),end=bracketCavityTime(r.states,endTime);
  const candidates=choices(start).flatMap(a=>choices(end).filter(b=>b.cycle>=a.cycle).map(b=>delta(a,b)));
  return {start,end,atOrBeforeIncrements:increments(r,start.atOrBefore,end.atOrBefore),
    recordedEndpointSensitivity:Object.fromEntries(valueKeys.map(key=>[key,{min:Math.min(...candidates.map(v=>v[key])),max:Math.max(...candidates.map(v=>v[key]))}]))};
}
function windows(r,startTime,duration) {
  return {full:window(r,startTime,startTime+duration),firstHalf:window(r,startTime,startTime+duration/2),secondHalf:window(r,startTime+duration/2,startTime+duration)};
}
function contrast(a,b) {
  return Object.fromEntries(valueKeys.map(key=>[key,{atOrBefore:a.atOrBeforeIncrements[key]-b.atOrBeforeIncrements[key],
    min:a.recordedEndpointSensitivity[key].min-b.recordedEndpointSensitivity[key].max,
    max:a.recordedEndpointSensitivity[key].max-b.recordedEndpointSensitivity[key].min}]));
}

const {HIL_LARGE_BATCH_OCT11_ROWS}=await import('../../../runner/src/hil-large-batch-oct11-roster.ts');
const {HIL_DOMAIN_SEED_OCT19_ROWS}=await import('../../../runner/src/hil-domain-seed-oct19-roster.ts');
const {HIL_FACET_PRESSURE_OCT19_ROWS}=await import('../../../runner/src/hil-facet-pressure-oct19-roster.ts');
const {summarizeFirstBatchRow}=await import('../../../runner/src/hil-bld-batch-summary.ts');
const definitions=[
 {producer:'5a00e901874ae5fdf2ae24a2d889b692734e75da',path:oldRoot,entries:HIL_LARGE_BATCH_OCT11_ROWS.filter(e=>e.row.id.includes('-seed-')&&e.row.seedRadius===3)},
 {producer:'ff7b1a88bc62335216b9edb23d487eec82868e3a',path:bothRoot,entries:HIL_DOMAIN_SEED_OCT19_ROWS.filter(e=>e.row.id.includes('-seed-')&&e.row.seedRadius===3)},
 {producer:'73eb358c7c720a7f1608df5b26f0a8438ae6be92',path:hybridRoot,entries:HIL_FACET_PRESSURE_OCT19_ROWS.filter(e=>e.row.id.includes('-facet-'))},
];
assert.deepEqual(definitions.map(d=>d.entries.length),[8,4,4]);
const rows=definitions.flatMap(d=>d.entries.map(e=>{
 const r=readRow(e,d.path);assert.deepEqual(r.row,e.row);assert.equal(r.result.gitHead,d.producer);
 r.exit=load(resolve(d.path,'rows',e.row.id,'exit.json'));
 r.coverage=summarizeFirstBatchRow(resolve(d.path,'rows',e.row.id));
 assert.equal(r.coverage.disposition,'size-endpoint');assert.deepEqual(r.coverage.errors,[]);
 return r;
}));
const arms=['neither','basal-only','prism-only','both'];
const pairs=[['basal-only','neither'],['prism-only','neither'],['both','neither'],['both','basal-only'],['both','prism-only']];
const normalize=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['id','cflFill'].includes(k)));
const compatibility=[];
for(const tempC of [-6.5,-9.5])for(const arm of arms){
 const matched=rows.filter(r=>r.row.tempC===tempC&&r.row.experimentalFacetDips===arm);
 assert.equal(matched.length,2);assert.deepEqual(normalize(matched[0].row),normalize(matched[1].row));
 compatibility.push({tempC,arm,rowIds:matched.map(r=>r.row.id),onlyDifferences:['id','cflFill']});
}
const commonAge=Math.min(...rows.map(r=>r.result.simTimeSeconds));
const quarterAges=[.25,.5,.75,1].map(f=>f*commonAge),anchor=16.6289686258;
function selectedWindow(startSeconds,endSeconds){
 assert(startSeconds>=0&&endSeconds<=commonAge);
 const selected=rows.map(r=>({rowId:r.row.id,tempC:r.row.tempC,cflFill:r.row.cflFill,arm:r.row.experimentalFacetDips,growth:window(r,startSeconds,endSeconds)}));
 const facetContrasts=[],timestepContrasts=[];
 for(const tempC of [-6.5,-9.5])for(const cflFill of [.05,.025]){
  const group=selected.filter(r=>r.tempC===tempC&&r.cflFill===cflFill);assert.equal(group.length,4);
  facetContrasts.push({tempC,cflFill,contrasts:pairs.map(([a,b])=>{
   const ar=group.find(r=>r.arm===a),br=group.find(r=>r.arm===b);
   return {armMinusArm:[a,b],rowIds:[ar.rowId,br.rowId],difference:contrast(ar.growth,br.growth)};
  })});
 }
 for(const tempC of [-6.5,-9.5])for(const arm of arms){
  const ar=selected.find(r=>r.tempC===tempC&&r.arm===arm&&r.cflFill===.025),br=selected.find(r=>r.tempC===tempC&&r.arm===arm&&r.cflFill===.05);
  timestepContrasts.push({tempC,arm,rowIds:[ar.rowId,br.rowId],halfCflMinusOriginal:contrast(ar.growth,br.growth)});
 }
 return {startSeconds,endSeconds,rows:selected,facetContrasts,timestepContrasts};
}
const cumulative=quarterAges.map(t=>selectedWindow(0,t));
const consecutive=quarterAges.map((t,i)=>selectedWindow(i===0?0:quarterAges[i-1],t));
const anchorReadout=anchor<=commonAge?{available:true,readout:selectedWindow(0,anchor)}:{available:false,requestedSeconds:anchor,commonAgeSeconds:commonAge};
const report={schema:'registered-facet-attribution-readout-oct21-v1',createdAt:new Date().toISOString(),
 scope:'Registered sixteen-row completed-data facet attribution at two temperatures, four preparations and two timesteps. Wide seed only; internal implemented-model evidence, no physical or validation claim.',
 definitions:{geometry:'Exact seed plus attachment-coordinate reconstruction; subtract own initial occupied count and axial/maximum Cartesian lateral center spans. Occupied cells are not mass.',time:'Existing window/contrast and bracketCavityTime definitions unchanged. At-or-before state plus next recorded event; exact time uses exact state only. No interpolation or confidence interval.',comparisons:'Common age uses the minimum terminal physical age across all sixteen rows. Cumulative and consecutive quarter windows are distinct. Five registered contrasts do not assume preparation effects add linearly.',limits:'No grid/domain qualification, physical causal mechanism or interpolation between temperatures. Axial stability does not imply occupied-count stability.'},
 methodSource:{path:'evidence/hil-results-review-2026-10-18/seed/analyze.mjs',sha256:sha256(readFileSync('evidence/hil-results-review-2026-10-18/seed/analyze.mjs'))},
 script:{path:fileURLToPath(import.meta.url),sha256:sha256(readFileSync(fileURLToPath(import.meta.url)))},exactCommand:[process.execPath,...process.argv.slice(1)],
 producers:definitions.map(d=>({gitHead:d.producer,campaignRoot:d.path,rows:d.entries.map(e=>e.row.id)})),
 census:{rows:rows.length,controls:12,newHybrids:4,cycles:rows.reduce((s,r)=>s+r.events.length,0),newAttachedSites:rows.reduce((s,r)=>s+r.result.attachedCount-r.states[0].attachedCount,0),allEventGeometryReconstructed:true,allEndpointsChecked:true},
 compatibility,commonAgeSeconds:commonAge,commonAgeWitness:rows.filter(r=>r.result.simTimeSeconds===commonAge).map(r=>r.row.id),quarterAges,cumulative,consecutive,anchorReadout,
 endpoints:rows.map(r=>({rowId:r.row.id,tempC:r.row.tempC,cflFill:r.row.cflFill,arm:r.row.experimentalFacetDips,producer:r.result.gitHead,node:r.result.node,wallSeconds:r.result.wallSeconds,initial:r.states[0],terminal:r.states.at(-1),coverage:r.coverage})),sources};
writeFileSync(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,bytes:readFileSync(destination).length,sha256:sha256(readFileSync(destination)),census:report.census,commonAgeSeconds:commonAge,anchorReadout:anchorReadout.available},null,2));
