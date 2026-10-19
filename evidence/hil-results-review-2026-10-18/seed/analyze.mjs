import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { hexSeedSites, coordsOf, cartesian } from '../../../core/src/index.ts';
import { firstBatchRows } from '../../../runner/src/hil-bld-batch-roster.ts';
import { HIL_BATCH2_ROWS } from '../../../runner/src/hil-batch2-roster.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';

// Requested offline triage of retained observations. No solver execution or input mutation.
const destination=resolve(process.argv[2]??'out/analysis-2026-10-18/seed/seed-analysis.json');
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
const {HIL_TWO_DAY_OCT12_ROWS}=await import('../../../runner/src/hil-two-day-oct12-roster.ts');
const {summarizeFirstBatchRow}=await import('../../../runner/src/hil-bld-batch-summary.ts');
const roots=[
  {producer:'5a00e901874ae5fdf2ae24a2d889b692734e75da',path:'C:/Users/biao3/.codex/worktrees/hil-large-batch-oct11/snowflake/out/hil-large-batch-oct11',entries:HIL_LARGE_BATCH_OCT11_ROWS},
  {producer:'0161a5126ea47d565db7d6534ed7b56c743c0ffc',path:'C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake/out/hil-two-day-oct12',entries:HIL_TWO_DAY_OCT12_ROWS},
];
const rows=roots.flatMap(root=>root.entries.filter(e=>e.row.id.includes('-seed-')).map(e=>{
  const row=readRow(e,root.path);
  assert.deepEqual(row.row,e.row);
  assert.equal(row.row.cflFill,0.05);
  assert.equal(row.row.dxUm,0.35);
  const coverage=summarizeFirstBatchRow(resolve(root.path,'rows',e.row.id));
  assert.equal(coverage.disposition,'size-endpoint');assert.deepEqual(coverage.errors,[]);
  row.coverage=coverage;row.producer=root.producer;
  return row;
}));
assert.equal(rows.length,64);
const arms=['neither','basal-only','prism-only','both'];
const contrasts=[['basal-only','neither'],['prism-only','neither'],['both','neither'],['both','basal-only'],['both','prism-only']];
function comparisonSet(group,label,ageFractions=[.25,.5,.75,1]){
  const duration=Math.min(...group.map(r=>r.result.simTimeSeconds));
  const selections=ageFractions.map(fraction=>{
    const time=duration*fraction;
    const selected=group.map(r=>({rowId:r.row.id,tempC:r.row.tempC,fraction:r.row.fraction,arm:r.row.experimentalFacetDips,seedRadius:r.row.seedRadius,seedThickness:r.row.seedThickness,
      growth:window(r,0,time),laterGrowth:window(r,time/2,time)}));
    const facet=[];
    for(const tempC of new Set(group.map(r=>r.row.tempC)))for(const forcing of new Set(group.filter(r=>r.row.tempC===tempC).map(r=>r.row.fraction)))for(const radius of [3,1]){
      const s=selected.filter(r=>r.tempC===tempC&&r.fraction===forcing&&r.seedRadius===radius);
      assert.equal(s.length,4);
      facet.push({tempC,fraction:forcing,seedRadius:radius,contrasts:contrasts.map(([a,b])=>{
        const ar=s.find(r=>r.arm===a),br=s.find(r=>r.arm===b);
        return {armMinusArm:[a,b],growth:contrast(ar.growth,br.growth),laterGrowth:contrast(ar.laterGrowth,br.laterGrowth)};
      })});
    }
    const seeds=[];
    for(const tempC of new Set(group.map(r=>r.row.tempC)))for(const forcing of new Set(group.filter(r=>r.row.tempC===tempC).map(r=>r.row.fraction)))for(const arm of arms){
      const s=selected.filter(r=>r.tempC===tempC&&r.fraction===forcing&&r.arm===arm);
      assert.equal(s.length,2);
      const wide=s.find(r=>r.seedRadius===3),tall=s.find(r=>r.seedRadius===1);
      seeds.push({tempC,fraction:forcing,arm,wideMinusTallNewGrowth:contrast(wide.growth,tall.growth),wideMinusTallLaterGrowth:contrast(wide.laterGrowth,tall.laterGrowth)});
    }
    return {fractionOfShortestTerminalAge:fraction,requestedTimeSeconds:time,rows:selected,facetContrasts:facet,seedContrasts:seeds};
  });
  return {label,denominator:group.length,shortestTerminalAgeSeconds:duration,shortestWitness:group.filter(r=>r.result.simTimeSeconds===duration).map(r=>r.row.id),selections};
}
const conditions=[];
for(const tempC of [-6.5,-7.5,-8.5,-9.5])for(const forcing of [.1,.15,.2]){
  const group=rows.filter(r=>r.row.tempC===tempC&&r.row.fraction===forcing);
  if(group.length){assert.equal(group.length,8);conditions.push(comparisonSet(group,`T${tempC}/f${forcing}`));}
}
const forcingMatched=[-6.5,-9.5].map(t=>comparisonSet(rows.filter(r=>r.row.tempC===t),`forcing-common-age-T${t}`,[.5,1]));
const temperatureMatched=comparisonSet(rows.filter(r=>r.row.fraction===.15),'temperature-common-age-f0.15',[.5,1]);
const sizeStages=rows.map(r=>({rowId:r.row.id,tempC:r.row.tempC,fraction:r.row.fraction,arm:r.row.experimentalFacetDips,seed:[r.row.seedRadius,r.row.seedThickness],initial:r.states[0],
  crossings:[11,17,23,29].map(target=>{const state=r.states.find(s=>s.extent>=target);return{requestedExtent:target,state,growth:increments(r,r.states[0],state)};})}));
const laterSeedPairs=[];
for(const tempC of [-6.5,-7.5,-8.5,-9.5])for(const fraction of [.1,.15,.2]){
  const group=rows.filter(r=>r.row.tempC===tempC&&r.row.fraction===fraction);if(!group.length)continue;
  const earlier=Math.min(...group.map(r=>r.result.simTimeSeconds));
  for(const arm of arms){
    const pair=group.filter(r=>r.row.experimentalFacetDips===arm),end=Math.min(...pair.map(r=>r.result.simTimeSeconds));
    const selected=pair.map(r=>({rowId:r.row.id,seedRadius:r.row.seedRadius,total:window(r,0,end),afterEightRowAge:window(r,earlier,end)}));
    const a=selected.find(r=>r.seedRadius===3),b=selected.find(r=>r.seedRadius===1);
    laterSeedPairs.push({tempC,fraction,arm,eightRowAgeSeconds:earlier,pairAgeSeconds:end,rows:selected,wideMinusTallTotal:contrast(a.total,b.total),wideMinusTallLater:contrast(a.afterEightRowAge,b.afterEightRowAge)});
  }
}
const laterFacetPairs=[];
for(const tempC of [-6.5,-7.5,-8.5,-9.5])for(const fraction of [.1,.15,.2])for(const radius of [3,1]){
  const quartet=rows.filter(r=>r.row.tempC===tempC&&r.row.fraction===fraction&&r.row.seedRadius===radius);if(!quartet.length)continue;
  const earlier=Math.min(...quartet.map(r=>r.result.simTimeSeconds));
  const pair=quartet.filter(r=>['both','neither'].includes(r.row.experimentalFacetDips)),end=Math.min(...pair.map(r=>r.result.simTimeSeconds));
  const selected=pair.map(r=>({rowId:r.row.id,arm:r.row.experimentalFacetDips,total:window(r,0,end),afterQuartetAge:window(r,earlier,end)}));
  const a=selected.find(r=>r.arm==='both'),b=selected.find(r=>r.arm==='neither');
  laterFacetPairs.push({tempC,fraction,seedRadius:radius,quartetAgeSeconds:earlier,pairAgeSeconds:end,rows:selected,bothMinusNeitherTotal:contrast(a.total,b.total),bothMinusNeitherLater:contrast(a.afterQuartetAge,b.afterQuartetAge)});
}
const report={schema:'saved-seed-incremental-readout-oct18-v1',createdAt:new Date().toISOString(),scope:'Post-hoc internal model-development analysis of all 64 completed October 11/12 seed rows; no simulation, physical cause, mass, grid/domain or validation claim.',
  definitionSource:'evidence/hil-bld-joint-review-2026-10-08/followup/history.mjs: exact readRow, increments, window, contrast bodies reused; bracketCavityTime imported unchanged.',
  definitions:{time:'Piecewise-constant at-or-before states and exact next recorded event. Sensitivity uses each adjacent alternative, exact time uses exact state only; no interpolation or confidence interval.',geometry:'Seed plus exact event coordinates; new axial and maximum Cartesian lateral center spans. Occupancy means attached lattice sites, not mass. Seed volume, shape, surface and diffusion environment differ.',comparisons:'Within-condition ages share all eight rows. Forcing matched ages share all 24 at one temperature. Temperature matched ages share all 32 at fraction .15. Do not mix independently chosen times.',sizeStages:'First maximum-lattice-extent crossing, not common time or identical geometry.'},
  producers:roots.map(({producer,path})=>({producer,path})),census:{rows:rows.length,oct11Rows:16,oct12Rows:48,conditions:conditions.length,cycles:rows.reduce((a,r)=>a+r.events.length,0),newAttachedSites:rows.reduce((a,r)=>a+r.result.attachedCount-r.states[0].attachedCount,0),allEventGeometryAndCountsReconstructed:true,allOperationalEndpointsChecked:true},
  conditions,forcingMatched,temperatureMatched,sizeStages,laterSeedPairs,laterFacetPairs,
  endpoints:rows.map(r=>({rowId:r.row.id,producer:r.producer,row:r.row,initial:r.states[0],terminal:r.states.at(-1),coverage:r.coverage})),sources,
  script:{path:'out/analysis-2026-10-18/seed/analyze.mjs',sha256:sha256(readFileSync('out/analysis-2026-10-18/seed/analyze.mjs'))}};
writeFileSync(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,bytes:readFileSync(destination).length,sha256:sha256(readFileSync(destination)),census:report.census,conditions:conditions.map(g=>({label:g.label,seconds:g.shortestTerminalAgeSeconds}))},null,2));
