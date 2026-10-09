import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { hexSeedSites, coordsOf, cartesian } from '../../../core/src/index.ts';
import { firstBatchRows } from '../../../runner/src/hil-bld-batch-roster.ts';
import { HIL_BATCH2_ROWS } from '../../../runner/src/hil-batch2-roster.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';

// Requested offline triage of retained observations. No solver execution or input mutation.
const [root1, root2, destination] = process.argv.slice(2).map(p => resolve(p));
assert(root1 && root2 && destination, 'usage: node history.mjs FIRST_BATCH_ROOT SECOND_BATCH_ROOT NEW_OUTPUT.json');
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
const historyRows=firstBatchRows('HIL').filter(e=>e.track==='environment-history').map(e=>readRow(e,root1));
const seedRows=HIL_BATCH2_ROWS.filter(e=>e.track==='seed').map(e=>readRow(e,root2));
assert.equal(historyRows.length,16); assert.equal(seedRows.length,8);
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
const history=[];
for(const fromTempC of [-6,-14.4]) for(const paramSet of ['M1','M1_NO_DIP_ABLATION']) {
  const group=historyRows.filter(r=>r.row.timelineEvent&&r.row.tempC===fromTempC&&r.row.paramSet===paramSet)
    .sort((a,b)=>a.row.timelineEvent.triggerLargestExtent-b.row.timelineEvent.triggerLargestExtent);
  assert.equal(group.length,3);
  const duration=Math.min(...group.map(r=>r.states.at(-1).simTimeSeconds-r.eventState.simTimeSeconds));
  const rows=group.map(r=>({rowId:r.row.id,triggerExtent:r.row.timelineEvent.triggerLargestExtent,eventState:r.eventState,
    postEventDurationSeconds:r.result.simTimeSeconds-r.eventState.simTimeSeconds,terminal:r.states.at(-1),
    windows:windows(r,r.eventState.simTimeSeconds,duration)}));
  const staticSource=historyRows.find(r=>!r.row.timelineEvent&&r.row.tempC===fromTempC&&r.row.paramSet===paramSet);
  const staticDestination=historyRows.find(r=>!r.row.timelineEvent&&r.row.tempC===group[0].row.timelineEvent.tempC&&r.row.paramSet===paramSet);
  const staticComparisons=group.map(r=>{
    const cycle=r.eventState.cycle;
    // The trigger record's attachments belong to the old environment; include them in the common prefix.
    assert.deepEqual(r.states.slice(0,cycle+1),staticSource.states.slice(0,cycle+1));
    const projected=e=>({relaxation:e.relaxation,boundary:e.boundary,surface:e.surface,attached:e.attached,ledgers:e.ledgers,simTimeSeconds:e.simTimeSeconds});
    assert.deepEqual(r.events.slice(0,cycle).map(projected),staticSource.events.slice(0,cycle).map(projected));
    const time=r.eventState.simTimeSeconds;
    const common=Math.min(r.result.simTimeSeconds,staticSource.result.simTimeSeconds)-time;
    assert(common>0);
    const switched=windows(r,time,common),unchanged=windows(staticSource,time,common);
    return {rowId:r.row.id,staticRowId:staticSource.row.id,recordedPrefixEqualThroughCycle:cycle,
      commonPostBoundarySeconds:common,switched,unchanged,
      switchedMinusUnchanged:Object.fromEntries(['full','firstHalf','secondHalf'].map(key=>[key,contrast(switched[key],unchanged[key])]))};
  });
  history.push({fromTempC,toTempC:group[0].row.timelineEvent.tempC,paramSet,commonPostEventSeconds:duration,rows,
    lateSwitchMinusEarlySwitch:Object.fromEntries(['full','firstHalf','secondHalf'].map(key=>[key,contrast(rows[2].windows[key],rows[0].windows[key])])),
    staticControls:[staticSource,staticDestination].map(r=>({rowId:r.row.id,tempC:r.row.tempC,seed:r.states[0],terminal:r.states.at(-1)})),staticComparisons});
}
const seeds=[];
for(const radius of [3,1]) {
  const arms=['both','neither','basal-only','prism-only'];
  const group=arms.map(arm=>seedRows.find(r=>r.row.seedRadius===radius&&r.row.experimentalFacetDips===arm));
  const quartetAge=Math.min(...group.map(r=>r.result.simTimeSeconds));
  const pairAge=Math.min(group[0].result.simTimeSeconds,group[1].result.simTimeSeconds);
  function age(time){
    const rows=group.filter(r=>r.result.simTimeSeconds>=time).map(r=>({arm:r.row.experimentalFacetDips,rowId:r.row.id,bracket:bracketCavityTime(r.states,time)}));
    const b=rows.find(r=>r.arm==='both').bracket,n=rows.find(r=>r.arm==='neither').bracket;
    const diffs=choices(b).flatMap(bs=>choices(n).map(ns=>bs.aspectRatio-ns.aspectRatio));
    return {requestedTimeSeconds:time,rows,bothMinusNeitherAspectRatio:{atOrBefore:b.atOrBefore.aspectRatio-n.atOrBefore.aspectRatio,min:Math.min(...diffs),max:Math.max(...diffs)}};
  }
  seeds.push({tempC:-8,seedRadius:radius,seedThickness:group[0].row.seedThickness,quartetAgeSeconds:quartetAge,pairAgeSeconds:pairAge,
    ages:[0.25,0.5,0.75,1].map(f=>age(quartetAge*f)).concat(age(pairAge)),
    quartetToPair:group.slice(0,2).map(r=>({rowId:r.row.id,arm:r.row.experimentalFacetDips,window:window(r,quartetAge,pairAge)})),
    terminals:group.map(r=>({rowId:r.row.id,arm:r.row.experimentalFacetDips,state:r.states.at(-1)}))});
}
const result={schema:'hil-saved-history-increments-v1',claimLevel:'Post-hoc internal model-development analysis; no physical mechanism, mass, continuum or domain-validation claim.',
  definitions:{eventOrdering:'The producer advances the surface, captures attachments and evaluates geometry, then applies the environment transition at the completed-cycle boundary. The trigger-cycle attachments are inherited; post-switch increments start at the next cycle.',
    geometry:'Seed plus exact recorded attachment coordinates, using existing core hexSeedSites, coordsOf and cartesian. Axial and maximum Cartesian lateral center spans are coordinate ranges times dx; aspect ratio uses inclusive spans. Lateral envelope classes use integer hex radius, not Euclidean radius.',
    increments:'Newly attached sites and changes in spans over physical-time windows; neither occupancy nor attachment count is total accreted mass. Inside the prior hex-prism envelope does not imply a cavity or enclosed void.',
    time:'Existing bracketCavityTime; at-or-before values plus exact next event. No interpolation. Sensitivity combines recorded endpoints only (at an exact time, that exact state only), not a continuous-time confidence bound.',
    history:'Each direction/preparation triplet uses its shortest available post-event duration, split into equal requested-time halves. Starting geometry, partial fill, vapor and prehistory differ across switch extents.',
    static:'Separate pair comparison against the source-temperature static control at the identical recorded prefix and switch boundary. Duration is the shorter remaining window of that pair, so different pair comparisons are not at a common duration. Prefix equality covers every recorded growth observation listed in the script, not unrecorded full fields.',
    seed:'Quartet fractions use the shortest terminal time among all four arms; later pair age uses both/neither only. Terminal size comparison and common physical age are different questions.'},
  census:{historyRows:historyRows.length,switchRows:historyRows.filter(r=>r.eventState).length,seedRows:seedRows.length,
    totalRecordedCycles:[...historyRows,...seedRows].reduce((s,r)=>s+r.events.length,0),
    totalNewAttachments:[...historyRows,...seedRows].reduce((s,r)=>s+r.result.attachedCount-r.states[0].attachedCount,0),
    allEventGeometryReconstructed:true,allEventCountsReconciled:true,allTwelveSourceStaticPrefixesEqual:true},
  history,seeds,sources};
writeFileSync(destination,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,bytes:readFileSync(destination).length,sha256:sha256(readFileSync(destination)),census:result.census},null,2));
