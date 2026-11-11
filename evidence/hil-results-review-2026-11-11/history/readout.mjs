import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { hexSeedSites, coordsOf, cartesian, domainCenter } from '../../../core/src/index.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';
import { measureCavityGeometry } from '../../../runner/src/post-phase10-cavity-geometry.ts';
import { summarizeFirstBatchRow } from '../../../runner/src/hil-bld-batch-summary.ts';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Registered saved-data selection. read/profile/choices/delta/window below are copied
// unchanged from the October 18 recipe. Coverage is checked before window() is used.
import { HIL_GROWTH_DYNAMICS_OCT21_ROWS } from '../../../runner/src/hil-growth-dynamics-oct21-roster.ts';
const sources=[];
const sha256=b=>createHash('sha256').update(b).digest('hex');
function load(path,json=true){const b=readFileSync(path);sources.push({path,bytes:b.length,sha256:sha256(b)});return json?JSON.parse(b):b.toString();}
function read(root,id){
 const dir=resolve(root,id),row=load(resolve(dir,'spec.json')).row,result=load(resolve(dir,'result.json'));
 const exit=load(resolve(dir,'exit.json')); assert.equal(exit.exitCode,0);
 const events=load(resolve(dir,'events.jsonl'),false).trim().split('\n').map(JSON.parse);
 const checked=summarizeFirstBatchRow(dir);assert.equal(checked.disposition,'size-endpoint');assert.deepEqual(checked.errors,[]);
 const dims={nx:row.dimsN,ny:row.dimsN,nz:row.dimsN},seed=hexSeedSites(dims,row.seedRadius,row.seedThickness),cells=new Set(seed);
 const lo=Array(5).fill(Infinity),hi=Array(5).fill(-Infinity);
 const include=i=>{const c=coordsOf(dims,i),v=[...c,...cartesian(...c).slice(0,2)];v.forEach((x,j)=>{lo[j]=Math.min(lo[j],x);hi[j]=Math.max(hi[j],x);});};
 function state(cycle,simTimeSeconds){const iCells=hi[0]-lo[0]+1,jCells=hi[1]-lo[1]+1,axialCells=hi[2]-lo[2]+1,lateralCartesianCells=Math.max(hi[3]-lo[3],hi[4]-lo[4])+1;return {cycle,simTimeSeconds,attachedCount:cells.size,extent:Math.max(iCells,jCells,axialCells),iCells,jCells,axialCells,lateralCartesianCells,aspectRatio:axialCells/lateralCartesianCells};}
 seed.forEach(include);const states=[state(0,0)];
 for(const e of events){assert.equal(e.cycle,states.length);for(const a of e.attached){assert.deepEqual(coordsOf(dims,a.index),a.coords);assert(!cells.has(a.index));cells.add(a.index);include(a.index);}const s=state(e.cycle,e.simTimeSeconds);for(const k of ['attachedCount','extent','aspectRatio'])assert.equal(s[k],e[k]);states.push(s);}
 for(const k of ['attachedCount','extent','aspectRatio','simTimeSeconds'])assert.equal(states.at(-1)[k],result[k]);
 const occupancyAt=cycle=>{const s=new Set(seed);for(const e of events){if(e.cycle>cycle)break;for(const a of e.attached)s.add(a.index);}return s;};
 return {row,result,events,states,dims,occupancyAt,checked};
}
function profile(r,s){
 const cells=r.occupancyAt(s.cycle),g=measureCavityGeometry(cells,r.dims,r.row.dxUm),center=domainCenter(r.dims),shells=new Map();
 for(const i of cells){const [a,b]=coordsOf(r.dims,i),di=a-center[0],dj=b-center[1],rad=Math.max(Math.abs(di),Math.abs(dj),Math.abs(di+dj));shells.set(rad,(shells.get(rad)??0)+1);}
 assert.equal(g.layers.reduce((n,l)=>n+l.attachedCount,0),s.attachedCount);
 assert.equal([...shells.values()].reduce((a,b)=>a+b,0),s.attachedCount);
 return {state:s,enclosedPlanes:g.layers.filter(l=>l.lateralVoid==='enclosed').map(l=>l.offset),straightOpenPlanes:g.layers.filter(l=>l.lateralVoid==='enclosed'&&(l.directAxialOpening.lower||l.directAxialOpening.upper)).map(l=>l.offset),waist:g.waist,centerPlaneCount:g.layers.find(l=>l.offset===0)?.attachedCount??0,planeCounts:g.layers.map(l=>[l.offset,l.attachedCount]),shellCounts:[...shells].sort((a,b)=>a[0]-b[0])};
}
const choices=b=>b.exactEventTime||b.nextEvent===null?[b.atOrBefore]:[b.atOrBefore,b.nextEvent];
const delta=(a,b)=>({attachedCount:b.attachedCount-a.attachedCount,axialCells:b.axialCells-a.axialCells,iCells:b.iCells-a.iCells,jCells:b.jCells-a.jCells,lateralCartesianCells:b.lateralCartesianCells-a.lateralCartesianCells});
function window(r,start,end){const a=bracketCavityTime(r.states,start),b=bracketCavityTime(r.states,Math.min(end,r.states.at(-1).simTimeSeconds)),ds=choices(a).flatMap(x=>choices(b).filter(y=>y.cycle>=x.cycle).map(y=>delta(x,y)));return {start:a,end:b,atOrBefore:delta(a.atOrBefore,b.atOrBefore),endpointSensitivity:Object.fromEntries(Object.keys(ds[0]).map(k=>[k,{min:Math.min(...ds.map(d=>d[k])),max:Math.max(...ds.map(d=>d[k]))}]))};}


const root=resolve(process.argv[2]??'C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake/out/hil-growth-dynamics-oct21','rows');
const output=resolve(process.argv[3]??'out/hil-results-review-2026-11-11/history/readout.json');
const rows=HIL_GROWTH_DYNAMICS_OCT21_ROWS.filter(e=>e.row.id.startsWith('gd21-hil-h1-')).map(({row})=>{const r=read(root,row.id);assert.deepEqual(r.row,row);assert.equal(r.result.gitHead,'2f2d605f0ed8fdb8d78cdea02a58102a7001cb53');return r;});
assert.equal(rows.length,12);
const histories=rows.filter(r=>r.row.timelineEvent),statics=rows.filter(r=>!r.row.timelineEvent),pressures=[50662.5,101325,202650];
assert.equal(histories.length,6);assert.equal(statics.length,6);
const scientific=e=>({relaxation:e.relaxation,boundary:e.boundary,surface:e.surface,attached:e.attached,ledgers:e.ledgers,simTimeSeconds:e.simTimeSeconds});
const sourceChecks=histories.map(h=>{const s=statics.find(s=>s.row.pressurePa===h.row.pressurePa&&s.row.tempC===h.row.tempC),cycle=h.result.timeline.eventCycle;
 assert(s);assert.deepEqual(h.states.slice(0,cycle+1),s.states.slice(0,cycle+1));assert.deepEqual(h.events.slice(0,cycle).map(scientific),s.events.slice(0,cycle).map(scientific));
 return {historyId:h.row.id,sourceId:s.row.id,prefixEqualThroughCycle:cycle,actualEventAgeSeconds:h.states[cycle].simTimeSeconds};});
const Dnew=Math.min(...histories.map(h=>h.result.simTimeSeconds-h.states[h.result.timeline.eventCycle].simTimeSeconds)),D0=7.547248938077988;
const windows={full:[0,Dnew],early:[0,.5*Dnew],later:[.5*Dnew,Dnew],q1:[0,.25*Dnew],q2:[.25*Dnew,.5*Dnew],q3:[.5*Dnew,.75*Dnew],q4:[.75*Dnew,Dnew],D0:[0,D0],D0to2D0:[D0,2*D0]};
function coveredWindow(r,start,end){const terminal=r.states.at(-1).simTimeSeconds;if(start<0||end>terminal)return {available:false,startSeconds:start,endSeconds:end,terminalSeconds:terminal,reason:'saved trajectory does not cover requested window'};return {available:true,...window(r,start,end)};}
const allWindows=(r,origin)=>Object.fromEntries(Object.entries(windows).map(([name,[a,b]])=>[name,coveredWindow(r,origin+a,origin+b)]));
const historyReadouts=histories.map(r=>{const event=r.states[r.result.timeline.eventCycle];return {id:r.row.id,pressurePa:r.row.pressurePa,switchExtent:r.row.timelineEvent.triggerLargestExtent,dxUm:r.row.dxUm,event,terminal:r.states.at(-1),availablePostEventSeconds:r.result.simTimeSeconds-event.simTimeSeconds,windows:allWindows(r,event.simTimeSeconds)};});
const staticReferences=histories.map(h=>{const source=statics.find(s=>s.row.pressurePa===h.row.pressurePa&&s.row.tempC===h.row.tempC),destination=statics.find(s=>s.row.pressurePa===h.row.pressurePa&&s.row.tempC===h.row.timelineEvent.tempC),origin=h.states[h.result.timeline.eventCycle].simTimeSeconds;return {historyId:h.row.id,sourceStaticId:source.row.id,destinationStaticId:destination.row.id,sourceStaticTerminalSeconds:source.result.simTimeSeconds,destinationStaticTerminalSeconds:destination.result.simTimeSeconds,continuedSourceWindows:allWindows(source,origin),freshSeedDestinationWindows:allWindows(destination,0)};});
const keys=['axialCells','lateralCartesianCells','attachedCount'];
function contrast(a,b){return Object.fromEntries(Object.keys(windows).map(w=>[w,!a[w].available||!b[w].available?{available:false}: {available:true,...Object.fromEntries(keys.map(k=>{const aa=a[w],bb=b[w];return [k,{a:aa.atOrBefore[k],b:bb.atOrBefore[k],aMinusB:aa.atOrBefore[k]-bb.atOrBefore[k],min:aa.endpointSensitivity[k].min-bb.endpointSensitivity[k].max,max:aa.endpointSensitivity[k].max-bb.endpointSensitivity[k].min}];}))}]));}
const earlyMinusLate=pressures.map(p=>{const a=historyReadouts.find(h=>h.pressurePa===p&&h.switchExtent===7),b=historyReadouts.find(h=>h.pressurePa===p&&h.switchExtent===15);return {pressurePa:p,aId:a.id,bId:b.id,windows:contrast(a.windows,b.windows)};});
const historyMinusContinuedSource=historyReadouts.map(h=>({id:h.id,windows:contrast(h.windows,staticReferences.find(s=>s.historyId===h.id).continuedSourceWindows)}));
const original='evidence/hil-results-review-2026-10-21/history-pressure/readout.mjs';
const report={createdAt:new Date().toISOString(),scope:'Registered internal H1 saved-data comparison; no simulation, physical identification, grid convergence or validation.',script:{path:fileURLToPath(import.meta.url),sha256:sha256(readFileSync(fileURLToPath(import.meta.url)))},reusedDefinitions:{path:original,sha256:sha256(readFileSync(original)),functions:['read','profile','choices','delta','window','scientific'],changes:'Exact HIL roster selection; frozen Dnew, D0 and D0..2D0 requests; coverage checked before old window helper; same independent endpoint-difference arithmetic.'},definitions:{increments:'Subtract inherited event state for each history. Spans in cells; multiply by dxUm=.35 for micrometres. Occupied sites are not total accreted mass.',windows:'One Dnew over all six histories. Fixed D0 evaluated separately; no overlong window is clamped. Static controls do not set Dnew.',brackets:'At-or-before plus next-event alternatives; exact event times use only exact state. Bounds are stage sensitivity, not statistical error.',controls:'Source static origin is actual history event age; destination starts fresh at age0 and is context, not a matched state counterfactual.'},census:{rows:rows.length,histories:histories.length,statics:statics.length,reconstructedUpdates:rows.reduce((n,r)=>n+r.events.length,0),sourcePrefixesEqual:sourceChecks.length},Dnew,D0,sourceChecks,rows:rows.map(r=>({id:r.row.id,row:r.row,producer:r.result.gitHead,node:r.result.node,terminal:r.states.at(-1)})),historyReadouts,staticReferences,earlyMinusLate,historyMinusContinuedSource,sources};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report)+'\n',{flag:'wx'});console.log(JSON.stringify({output,Dnew,D0,census:report.census,earlyMinusLate,coverage:staticReferences.map(s=>({id:s.historyId,source:Object.fromEntries(Object.entries(s.continuedSourceWindows).map(([k,v])=>[k,v.available])),destination:Object.fromEntries(Object.entries(s.freshSeedDestinationWindows).map(([k,v])=>[k,v.available]))}))},null,2));
