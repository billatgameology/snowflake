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

const roots={
 // Optional paths are campaign roots containing rows/, suitable for a NAS fresh restore.
 oct11:resolve(process.argv[3]??'C:/Users/biao3/.codex/worktrees/hil-large-batch-oct11/snowflake/out/hil-large-batch-oct11','rows'),
 oct12:resolve(process.argv[4]??'C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake/out/hil-two-day-oct12','rows'),
 oct19:resolve(process.argv[5]??'C:/Users/biao3/.codex/worktrees/hil-facet-pressure-oct19/snowflake/out/hil-facet-pressure-oct19','rows')
};
const producers={oct11:'5a00e901874ae5fdf2ae24a2d889b692734e75da',oct12:'0161a5126ea47d565db7d6534ed7b56c743c0ffc',oct19:'73eb358c7c720a7f1608df5b26f0a8438ae6be92'};
const paths=['core/src','solver-cpu/src','runner/src/post-phase10-discovery.ts','runner/src/discovery-resume-io.ts','runner/src/post-phase10-cavity-analysis.ts','runner/src/post-phase10-cavity-geometry.ts','runner/src/hil-bld-batch-summary.ts'];
const parityCommand=['diff','--name-only',producers.oct11,producers.oct19,'--',...paths];
assert.equal(execFileSync('git',parityCommand,{encoding:'utf8'}).trim(),'');
const pressures=[50662.5,101325,202650],cfls=[.05,.025],switches=[7,15],rows=[];
function add(generation,id){const r=read(roots[generation],id);assert.equal(r.result.gitHead,producers[generation]);r.spec=JSON.parse(readFileSync(resolve(roots[generation],id,'spec.json')));r.generation=generation;rows.push(r);return r;}
for(const p of pressures)for(const cfl of cfls){
 if(p===101325){
  const gen=cfl===.05?'oct11':'oct12';
  for(const e of switches)add(gen,cfl===.05?`oct11-hil-history-t14p4-to-t6-f0p2-e${e}-m1`:`oct12-hil-history-step-t14p4-to-t6-f0p2-e${e}-cfl0p025-m1`);
  for(const t of ['14p4','6'])add(gen,cfl===.05?`oct11-hil-static-t${t}-f0p2-m1`:`oct12-hil-static-step-t${t}-f0p2-cfl0p025-m1`);
 }else{
  const tag=String(p).replace('.','p'),gen=cfl===.05?'oct12':'oct19',transform=id=>cfl===.05?id:id.replace('oct12-hil-pressure-','oct19-hil-pressure-step-')+'-cfl0p025';
  for(const e of switches)add(gen,transform(`oct12-hil-pressure-history-t14p4-to-t6-f0p2-e${e}-p${tag}-m1`));
  for(const t of ['14p4','6'])add(gen,transform(`oct12-hil-pressure-static-t${t}-f0p2-p${tag}-m1`));
 }
}
const histories=rows.filter(r=>r.row.timelineEvent),statics=rows.filter(r=>!r.row.timelineEvent);
assert.equal(histories.length,12);assert.equal(statics.length,12);
for(const r of rows){assert.equal(r.row.dimsN,64);assert.equal(r.row.dxUm,.35);assert.equal(r.row.seedRadius,2);assert.equal(r.row.seedThickness,1);assert.equal(r.row.fraction,.2);assert.equal(r.row.paramSet,'M1');assert.equal(r.row.experimentalFacetDips,undefined);assert.equal(r.row.targetExtent,29);assert.deepEqual(r.spec.fixed,rows[0].spec.fixed);}
const specPairs=[];
for(const r of rows.filter(r=>r.row.cflFill===.025)){
 const previous=rows.find(s=>s.row.cflFill===.05&&s.row.pressurePa===r.row.pressurePa&&s.row.tempC===r.row.tempC&&s.row.timelineEvent?.triggerLargestExtent===r.row.timelineEvent?.triggerLargestExtent);assert(previous);
 const a={...previous.row},b={...r.row};for(const k of ['id','cflFill']){delete a[k];delete b[k];}assert.deepEqual(a,b,r.row.id+' CFL operands');
 specPairs.push({old:previous.row.id,new:r.row.id,changedOperands:['id','cflFill']});
}
// Pressure and event/static comparisons must agree on every other scientific operand.
for(const r of rows){
 const expected={...rows.find(s=>s.row.pressurePa===101325&&s.row.cflFill===r.row.cflFill&&s.row.tempC===r.row.tempC&&s.row.timelineEvent?.triggerLargestExtent===r.row.timelineEvent?.triggerLargestExtent).row},actual={...r.row};
 for(const k of ['id','pressurePa']){delete expected[k];delete actual[k];}assert.deepEqual(actual,expected,r.row.id+' pressure operands');
}
const sourceChecks=[];
const scientific=e=>({relaxation:e.relaxation,boundary:e.boundary,surface:e.surface,attached:e.attached,ledgers:e.ledgers,simTimeSeconds:e.simTimeSeconds});
for(const h of histories){
 const cs=statics.filter(s=>s.row.tempC===h.row.tempC&&s.row.fraction===h.row.fraction&&s.row.pressurePa===h.row.pressurePa&&s.row.cflFill===h.row.cflFill&&s.row.paramSet===h.row.paramSet);assert.equal(cs.length,1);const s=cs[0],cycle=h.result.timeline.eventCycle;
 assert.deepEqual(h.states.slice(0,cycle+1),s.states.slice(0,cycle+1),h.row.id+' state prefix');
 assert.deepEqual(h.events.slice(0,cycle).map(scientific),s.events.slice(0,cycle).map(scientific),h.row.id+' scientific prefix');
 sourceChecks.push({historyId:h.row.id,sourceStaticId:s.row.id,prefixEqualThroughCycle:cycle,eventAgeSeconds:h.states[cycle].simTimeSeconds});
}
const D=Math.min(...histories.map(r=>r.result.simTimeSeconds-r.states[r.result.timeline.eventCycle].simTimeSeconds));assert(D>0);
const windows={full:[0,1],early:[0,.5],later:[.5,1],q1:[0,.25],q2:[.25,.5],q3:[.5,.75],q4:[.75,1]};
function coveredWindow(r,start,end){const terminal=r.states.at(-1).simTimeSeconds;if(start<0||end>terminal)return {available:false,startSeconds:start,endSeconds:end,terminalSeconds:terminal,reason:'saved trajectory does not cover requested window'};return {available:true,...window(r,start,end)};}
function allWindows(r,origin){return Object.fromEntries(Object.entries(windows).map(([name,[a,b]])=>[name,coveredWindow(r,origin+a*D,origin+b*D)]));}
const historyReadouts=histories.map(r=>{const event=r.states[r.result.timeline.eventCycle],w=allWindows(r,event.simTimeSeconds);assert(Object.values(w).every(x=>x.available));return {id:r.row.id,producer:r.result.gitHead,pressurePa:r.row.pressurePa,cflFill:r.row.cflFill,switchExtent:r.row.timelineEvent.triggerLargestExtent,dxUm:r.row.dxUm,event,terminal:r.states.at(-1),availablePostEventSeconds:r.result.simTimeSeconds-event.simTimeSeconds,windows:w};});
const staticReferences=histories.map(h=>{const match=s=>s.row.pressurePa===h.row.pressurePa&&s.row.cflFill===h.row.cflFill,source=statics.find(s=>match(s)&&s.row.tempC===h.row.tempC),dest=statics.find(s=>match(s)&&s.row.tempC===h.row.timelineEvent.tempC),age=h.states[h.result.timeline.eventCycle].simTimeSeconds;assert(source&&dest);return {historyId:h.row.id,sourceStaticId:source.row.id,destinationStaticId:dest.row.id,sourceStaticTerminalSeconds:source.result.simTimeSeconds,destinationStaticTerminalSeconds:dest.result.simTimeSeconds,continuedSourceWindows:allWindows(source,age),freshSeedDestinationWindows:allWindows(dest,0),destinationLimit:'Fresh seed at destination temperature; no inherited source geometry. Context, not a matched counterfactual.'};});
const keys=['axialCells','lateralCartesianCells','attachedCount'];
function contrast(a,b){return Object.fromEntries(Object.keys(windows).map(w=>[w,Object.fromEntries(keys.map(k=>{const aa=a.windows[w],bb=b.windows[w];return [k,{a:aa.atOrBefore[k],b:bb.atOrBefore[k],aMinusB:aa.atOrBefore[k]-bb.atOrBefore[k],min:aa.endpointSensitivity[k].min-bb.endpointSensitivity[k].max,max:aa.endpointSensitivity[k].max-bb.endpointSensitivity[k].min}];}))]));}
const lookup=(p,c,e)=>historyReadouts.find(r=>r.pressurePa===p&&r.cflFill===c&&r.switchExtent===e);
const earlyMinusLate=pressures.flatMap(p=>cfls.map(c=>{const a=lookup(p,c,7),b=lookup(p,c,15);return {pressurePa:p,cflFill:c,aId:a.id,bId:b.id,windows:contrast(a,b)};}));
const cflSmallMinusLarge=pressures.flatMap(p=>switches.map(e=>{const a=lookup(p,.025,e),b=lookup(p,.05,e);return {pressurePa:p,switchExtent:e,aId:a.id,bId:b.id,windows:contrast(a,b)};}));
const pressureMinusNormal=pressures.filter(p=>p!==101325).flatMap(p=>cfls.flatMap(c=>switches.map(e=>{const a=lookup(p,c,e),b=lookup(101325,c,e);return {pressurePa:p,referencePressurePa:101325,cflFill:c,switchExtent:e,aId:a.id,bId:b.id,windows:contrast(a,b)};})));
const oldRecipe='evidence/hil-results-review-2026-10-18/history-pressure/readout.mjs';
const output=resolve(process.argv[2]??'out/analysis-2026-10-21/history-pressure/readout.json');
const report={createdAt:new Date().toISOString(),scope:'Registered internal saved-data analysis of twelve warming histories and twelve statics. No simulation, physical causality, validation, grid convergence, mass, pressure universality or memory-erasure claim.',script:{path:fileURLToPath(import.meta.url),sha256:sha256(readFileSync(fileURLToPath(import.meta.url)))},reusedDefinitions:{path:oldRecipe,sha256:sha256(readFileSync(oldRecipe)),functions:['read','profile','choices','delta','window','scientific'],changes:'Row selection and joint D; full/half/quarter windows; explicit coverage before unchanged window function; packaging and the same independent bracket difference arithmetic used by October18 summarize.mjs.'},sourceParity:{command:['git',...parityCommand],changedPaths:[]},definitions:{geometry:'Inclusive axial/lateral center spans from recorded lattice coordinates. Subtracting inclusive spans cancels the one-cell offset. Multiply span increments by dxUm=.35 for micrometres. Occupied-site count is not deposited mass.',event:'Completed trigger-cycle attachment precedes the event; the event state is inherited and is subtracted from post-event increments.',bracket:'Existing bracketCavityTime; at-or-before estimates plus adjacent-event alternatives without interpolation. Exact event times use only their exact state. Bounds are observation sensitivities, not statistical uncertainty.',contrast:'a minus b; minimum a bracket increment minus maximum b, and maximum a minus minimum b. Conservative independent endpoint alternatives.',window:'One minimum post-event duration across all twelve histories. Same D for all references; unavailable source-static windows are explicit and never clamped.'},commonPostEventSeconds:D,census:{rows:rows.length,histories:histories.length,statics:statics.length,reconstructedUpdates:rows.reduce((n,r)=>n+r.events.length,0),sourceStaticPrefixesEqual:sourceChecks.length},specPairs,sourceChecks,checks:rows.map(r=>r.checked),rows:rows.map(r=>({id:r.row.id,producer:r.result.gitHead,node:r.result.node,spec:r.spec,terminal:r.states.at(-1)})),historyReadouts,staticReferences,earlyMinusLate,cflSmallMinusLarge,pressureMinusNormal,sources};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,bytes:readFileSync(output).length,sha256:sha256(readFileSync(output)),census:report.census,D,earlyMinusLate:earlyMinusLate.map(r=>({p:r.pressurePa,cfl:r.cflFill,full:r.windows.full.axialCells,later:r.windows.later.axialCells,quarters:['q1','q2','q3','q4'].map(w=>r.windows[w].axialCells)})),staticFullCoverage:staticReferences.map(r=>({history:r.historyId,source:r.continuedSourceWindows.full.available,destination:r.freshSeedDestinationWindows.full.available}))},null,2));


