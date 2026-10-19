import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { hexSeedSites, coordsOf, cartesian, domainCenter } from '../../../core/src/index.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';
import { measureCavityGeometry } from '../../../runner/src/post-phase10-cavity-geometry.ts';
import { summarizeFirstBatchRow } from '../../../runner/src/hil-bld-batch-summary.ts';
import { HIL_SUPPLEMENT_ROWS } from '../../../runner/src/hil-supplement-roster.ts';

// Internal retrospective readout; reconstruction and bracket functions copied unchanged
// from out/hil-two-day-design-2026-10-12/history-options.mjs, except import depth.
const oldRoot=resolve('out/hil-retired-2026-10-08/discovery-resume/batch1-hil-resumable/rows');
const newRoot='C:/Users/biao3/.codex/worktrees/hil-supplement/snowflake/out/hil-supplement/rows';
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


const { HIL_LARGE_BATCH_OCT11_ROWS }=await import('../../../runner/src/hil-large-batch-oct11-roster.ts');
const { HIL_TWO_DAY_OCT12_ROWS }=await import('../../../runner/src/hil-two-day-oct12-roster.ts');
const roots={oct11:'C:/Users/biao3/.codex/worktrees/hil-large-batch-oct11/snowflake/out/hil-large-batch-oct11/rows',oct12:'C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake/out/hil-two-day-oct12/rows',oct10:'C:/Users/biao3/.codex/worktrees/hil-exploration-oct10/snowflake/out/hil-exploration-oct10/rows'};
const failedId='oct12-hil-pressure-history-t6-to-t14p4-f0p1-e15-p202650-m1';
const all11=HIL_LARGE_BATCH_OCT11_ROWS.filter(e=>e.row.timelineEvent||e.row.id.includes('-static-')).map(e=>read(roots.oct11,e.row.id));
const selected12=HIL_TWO_DAY_OCT12_ROWS.filter(e=>e.row.timelineEvent||e.row.id.includes('-static-'));
const failedResult=load(resolve(roots.oct12,failedId,'result.json'));
assert.equal(failedResult.stopReason,'solver-error');
const all12=selected12.filter(e=>e.row.id!==failedId).map(e=>read(roots.oct12,e.row.id));
const borrowed=[read(roots.oct10,'oct10-hil-cold-t14p4-f0p1-both'),read(roots.oct10,'oct10-hil-cold-t14p4-f0p1-neither')];
const histories=[...all11,...all12].filter(r=>r.row.timelineEvent),statics=[...all11,...all12,...borrowed].filter(r=>!r.row.timelineEvent);
const effectivePrep=r=>r.row.experimentalFacetDips==='neither'?'M1_NO_DIP_ABLATION':r.row.paramSet;
const sourceChecks=[];
const scientific=e=>({relaxation:e.relaxation,boundary:e.boundary,surface:e.surface,attached:e.attached,ledgers:e.ledgers,simTimeSeconds:e.simTimeSeconds});
for(const h of histories){
 const cs=statics.filter(s=>s.row.tempC===h.row.tempC&&s.row.fraction===h.row.fraction&&s.row.pressurePa===h.row.pressurePa&&s.row.cflFill===h.row.cflFill&&effectivePrep(s)===h.row.paramSet);
 assert.equal(cs.length,1,h.row.id); const s=cs[0],cycle=h.result.timeline.eventCycle;
 assert.deepEqual(h.states.slice(0,cycle+1),s.states.slice(0,cycle+1),h.row.id+' state prefix');
 assert.deepEqual(h.events.slice(0,cycle).map(scientific),s.events.slice(0,cycle).map(scientific),h.row.id+' scientific prefix');
 sourceChecks.push({historyId:h.row.id,staticId:s.row.id,prefixEqualThroughCycle:cycle,experimentalControl:s.row.experimentalFacetDips??null});
}
function fullRow(r,duration){const e=r.states[r.result.timeline.eventCycle],t=e.simTimeSeconds;return {id:r.row.id,from:r.row.tempC,to:r.row.timelineEvent.tempC,fraction:r.row.fraction,preparation:r.row.paramSet,pressurePa:r.row.pressurePa,cflFill:r.row.cflFill,switchExtent:r.row.timelineEvent.triggerLargestExtent,dxUm:r.row.dxUm,event:e,terminal:r.states.at(-1),availablePostEventSeconds:r.result.simTimeSeconds-t,full:window(r,t,t+duration),early:window(r,t,t+duration/2),later:window(r,t+duration/2,t+duration)};}
const duration=rows=>Math.min(...rows.map(r=>r.result.simTimeSeconds-r.states[r.result.timeline.eventCycle].simTimeSeconds));
function group(name,rows,expected,missing=[]){assert.equal(rows.length,expected);const d=duration(rows);return {name,commonPostEventSeconds:d,missing,rows:rows.map(r=>fullRow(r,d))};}
const timestep=[],pressure=[],withinPressure=[];
for(const from of [-6,-14.4]) for(const f of [0.1,0.2]) {
 const normal=histories.filter(r=>r.row.tempC===from&&r.row.fraction===f&&r.row.pressurePa===101325);
 timestep.push(group(`from${from}-fraction${f}-two-CFL`,normal,12));
 const pressureRows=histories.filter(r=>r.row.tempC===from&&r.row.fraction===f&&r.row.cflFill===0.05&&r.row.timelineEvent.triggerLargestExtent!==11);
 const missing=from===-6&&f===0.1?[failedId]:[];
 pressure.push(group(`from${from}-fraction${f}-three-pressures`,pressureRows,12-missing.length,missing));
 for(const p of [50662.5,101325,202650]){const selected=pressureRows.filter(r=>r.row.pressurePa===p);withinPressure.push(group(`from${from}-fraction${f}-pressure${p}`,selected,p===202650&&missing.length?3:4,p===202650?missing:[]));}
}
const staticComparisons=[];
for(const h of histories){const control=sourceChecks.find(c=>c.historyId===h.row.id),s=statics.find(r=>r.row.id===control.staticId),e=h.states[h.result.timeline.eventCycle];const d=Math.min(h.result.simTimeSeconds,s.result.simTimeSeconds)-e.simTimeSeconds;assert(d>0);staticComparisons.push({historyId:h.row.id,staticId:s.row.id,commonPostBoundarySeconds:d,history:window(h,e.simTimeSeconds,e.simTimeSeconds+d),unchanged:window(s,e.simTimeSeconds,e.simTimeSeconds+d)});}
const report={createdAt:new Date().toISOString(),scope:'Internal saved-data interpretation. No physical causality, validation, grid/domain independence, mass or continuous-time uncertainty claim.',method:{geometry:'Existing seed plus attachment reconstruction checks every recorded count, extent and aspect ratio; terminal fields reconcile. Occupancy is not mass. Axial/lateral cell increments multiply by dxUm=0.35 for total center-span micrometres.',time:'Existing bracketCavityTime and adjacent-event sensitivity, no interpolation. Trigger-cycle attachments are inherited, excluded from new growth. Early/later halves divide one common physical duration across every included group row.',failedRow:'Known solver failure excluded from successful endpoint census and all contrast conclusions requiring that missing row. Other comparisons use named available sets; no absence conclusion.'},census:{oct11:all11.length,oct12Selected:selected12.length,oct12Completed:all12.length,borrowedExperimentalStatics:borrowed.length,histories:histories.length,statics:statics.length,sourceStaticPrefixesEqual:sourceChecks.length,reconstructedCycles:[...all11,...all12,...borrowed].reduce((n,r)=>n+r.events.length,0)},failed:{id:failedId,stopReason:failedResult.stopReason,cycles:failedResult.cycles,extent:failedResult.extent,errors:failedResult.integrityErrors},sourceChecks,timestep,pressure,withinPressure,staticComparisons,sources};
const output=resolve('out/analysis-2026-10-18/history-pressure/readout.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,census:report.census,sha256:sha256(readFileSync(output)),bytes:readFileSync(output).length},null,2));
