import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexSeedSites, domainCenter, coordsOf, neighborIndices } from '../../../core/src/index.ts';

// Bounded post-hoc saved-observation analysis; no solver construction or launch.
let input;
const output = dirname(fileURLToPath(import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = [];
const arms = ['neither', 'basal-only', 'prism-only', 'both'];
function read(relative, lines = false) {
  const bytes = readFileSync(resolve(input, relative));
  inputs.push({ path: resolve(input, relative).replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) });
  return lines ? bytes.toString().trim().split('\n').filter(Boolean).map(JSON.parse) : JSON.parse(bytes);
}
function requireThat(condition, message) { if (!condition) throw Error(message); }
const radius = (i, j) => Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j));
function stats(cells) {
  if (!cells.length) return null;
  const summary = values => ({ min: Math.min(...values), max: Math.max(...values), mean: values.reduce((a,b)=>a+b,0)/values.length });
  return { count: cells.length,
    sigmaBoundary: summary(cells.map(x=>x.sigmaBoundary)),
    sigmaOpp: summary(cells.map(x=>x.sigmaOpp)),
    alphaHKBoundary: summary(cells.map(x=>x.alphaHKBoundary)),
    alphaHKSigmaBoundary: summary(cells.map(x=>x.alphaHKBoundary*x.sigmaBoundary)),
    fill: summary(cells.map(x=>x.fill)) };
}
function stateMeasure(occupied, dims, center, record) {
  const plane = new Set(); const rings = new Map(); let tip = 0;
  for (const index of occupied) {
    const [i,j,k] = coordsOf(dims,index); if(k!==center[2]) continue;
    const x=i-center[0],y=j-center[1],r=radius(x,y);
    plane.add(`${x},${y}`); rings.set(r,(rings.get(r)??0)+1); tip=Math.max(tip,r);
  }
  let core=-1;
  for(let r=0;r<=tip;r++) { if((rings.get(r)??0)!==(r===0?1:6*r))break; core=r; }
  // Independent membership calculation catches an accidental ring-count-only inference.
  let firstMissing=Infinity;
  for(let x=-tip;x<=tip;x++)for(let y=-tip;y<=tip;y++){
    const r=radius(x,y); if(r<=tip&&!plane.has(`${x},${y}`))firstMissing=Math.min(firstMissing,r);
  }
  requireThat(core===(firstMissing===Infinity?tip:firstMissing-1),'core membership mismatch');
  const centralPlaneRingCounts=Array.from({length:tip+1},(_,r)=>({radius:r,occupied:rings.get(r)??0,possible:r===0?1:6*r}));
  requireThat(centralPlaneRingCounts.reduce((sum,x)=>sum+x.occupied,0)===plane.size,'ring census mismatch');
  return {...record, attachedCount:occupied.size, centralPlaneAttached:plane.size,core,tip,gap:tip-core,centralPlaneRingCounts};
}
function bracket(states,time) {
  let index=0; while(index+1<states.length&&states[index+1].simTimeSeconds<=time)index++;
  const compact=s=>s??null;
  return {requestedTimeSeconds:time,atOrBefore:compact(states[index]),next:compact(states[index+1])};
}
function spatial(snapshot,occupied,dims,center,state) {
  requireThat(snapshot.timing==='after-converged-relaxation-before-surface-advance','snapshot timing');
  requireThat(snapshot.attachedCount===occupied.size,'snapshot count');
  requireThat(snapshot.record.simTimeSeconds===state.simTimeSeconds,'snapshot physical time');
  requireThat(snapshot.record.actualExtent===state.extent,'snapshot extent');
  const expected=new Set();
  for(const index of occupied)for(const n of neighborIndices(dims,...coordsOf(dims,index)))if(n>=0&&!occupied.has(n))expected.add(n);
  requireThat(expected.size===snapshot.cells.length,'boundary membership count');
  const seen=new Set();
  for(const cell of snapshot.cells){
    requireThat(expected.has(cell.index)&&!seen.has(cell.index),'boundary membership'); seen.add(cell.index);
    requireThat(JSON.stringify(coordsOf(dims,cell.index))===JSON.stringify(cell.coords),'snapshot coordinates');
    const ns=[...neighborIndices(dims,...cell.coords)],nT=ns.slice(0,6).filter(x=>occupied.has(x)).length,nZ=ns.slice(6).filter(x=>occupied.has(x)).length;
    requireThat(nT===cell.neighborCounts[0]&&nZ===cell.neighborCounts[1],'snapshot neighbor counts');
    requireThat((cell.facet==='prism')===(nT===2&&nZ===0),'prism classification');
  }
  const prism=snapshot.cells.filter(x=>x.facet==='prism');
  const central=snapshot.cells.filter(x=>x.coords[2]===center[2]);
  const centralPrism=central.filter(x=>x.facet==='prism');
  const byRadius=[...new Set(central.map(x=>radius(x.coords[0]-center[0],x.coords[1]-center[1])))].sort((a,b)=>a-b).map(r=>{
    const cells=central.filter(x=>radius(x.coords[0]-center[0],x.coords[1]-center[1])===r);
    return {radius:r,facetCounts:Object.fromEntries(['basal','prism','inhibited','rough'].map(f=>[f,cells.filter(x=>x.facet===f).length])),prism:stats(cells.filter(x=>x.facet==='prism'))};
  });
  const byPlane=[...new Set(prism.map(x=>x.coords[2]-center[2]))].sort((a,b)=>a-b).map(offset=>({offset,prism:stats(prism.filter(x=>x.coords[2]-center[2]===offset))}));
  requireThat(byRadius.reduce((sum,x)=>sum+Object.values(x.facetCounts).reduce((a,b)=>a+b,0),0)===central.length,'central boundary census');
  return {record:snapshot.record,state,attachedCount:occupied.size,boundaryCount:snapshot.cells.length,facetCounts:Object.fromEntries(['basal','prism','inhibited','rough'].map(f=>[f,snapshot.cells.filter(x=>x.facet===f).length])),prism:stats(prism),centralPrism:stats(centralPrism),centralBoundaryByRadius:byRadius,prismByAxialPlane:byPlane};
}

import { summarizeFirstBatchRow } from '../../../runner/src/hil-bld-batch-summary.ts';
const roots=[
 ['hil-exploration-oct10','HIL_EXPLORATION_OCT10_ROWS'],
 ['hil-large-batch-oct11','HIL_LARGE_BATCH_OCT11_ROWS'],
 ['hil-two-day-oct12','HIL_TWO_DAY_OCT12_ROWS']
];
const rows=[];const checks=[];
for(const [name,exportName] of roots){
 input=resolve(`C:/Users/biao3/.codex/worktrees/${name}/snowflake/out/${name}`);
 const roster=(await import(`../../../runner/src/${name}-roster.ts`))[exportName];
 for(const {row:registered} of roster.filter(e=>e.row.id.includes('-cold-'))){
 const id=registered.id,dir='rows/'+id,spec=read(dir+'/spec.json'),result=read(dir+'/result.json'),events=read(dir+'/events.jsonl',true),row=spec.row;
 requireThat(JSON.stringify(row)===JSON.stringify(registered),'registered spec differs '+id);
 read(dir+'/exit.json');
 const checked=summarizeFirstBatchRow(resolve(input,dir)); checks.push(checked);requireThat(checked.disposition==='size-endpoint','row not checked endpoint '+id);
 const dims={nx:row.dimsN,ny:row.dimsN,nz:row.dimsN},center=domainCenter(dims),occupied=new Set(hexSeedSites(dims,row.seedRadius,row.seedThickness));
 let state=stateMeasure(occupied,dims,center,{cycle:0,simTimeSeconds:0,extent:5});const states=[state];
 for(const event of events){
  requireThat(event.cycle===state.cycle+1 && event.simTimeSeconds>state.simTimeSeconds,'event sequence');
  for(const cell of event.attached){requireThat(!occupied.has(cell.index),'duplicate attachment');requireThat(JSON.stringify(coordsOf(dims,cell.index))===JSON.stringify(cell.coords),'coords binding');occupied.add(cell.index);}
  requireThat(occupied.size===event.attachedCount,'event count');
  state=stateMeasure(occupied,dims,center,{cycle:event.cycle,simTimeSeconds:event.simTimeSeconds,extent:event.extent});states.push(state);
 }
 requireThat(state.attachedCount===result.attachedCount&&state.cycle===result.cycles&&state.simTimeSeconds===result.simTimeSeconds,'terminal binding');
 rows.push({id,arm:row.experimentalFacetDips,tempC:row.tempC,fraction:row.fraction,cflFill:row.cflFill,dxUm:row.dxUm,producer:result.gitHead,node:result.node,states});
 }
 console.log('reconstructed '+name+'; cumulative '+rows.length);
}
function compare(group){
 const commonTimeSeconds=Math.min(...group.map(r=>r.states.at(-1).simTimeSeconds)),maximumCommonTip=Math.min(...group.map(r=>r.states.at(-1).tip)),stages=[];
 const select=(row,t)=>({id:row.id,arm:row.arm,cflFill:row.cflFill,...bracket(row.states,t)});
 for(let tip=3;tip<=maximumCommonTip;tip++){
  const plateaus=group.map(row=>{const entry=row.states.find(x=>x.tip===tip),exit=row.states.find(x=>x.tip>tip)??row.states.at(-1);return {rowId:row.id,arm:row.arm,entry,exit,durationSeconds:entry?exit.simTimeSeconds-entry.simTimeSeconds:0};});
  const duration=Math.min(...plateaus.map(x=>x.durationSeconds));if(duration<=0)continue;
  stages.push({tip,shortestPlateauSeconds:duration,plateauBoundaries:plateaus.map(p=>({id:p.rowId,entrySeconds:p.entry.simTimeSeconds,exitSeconds:p.exit.simTimeSeconds,durationSeconds:p.durationSeconds})),selections:[0,.25,.5,.75].map(f=>({fractionOfShortestPlateau:f,elapsedSeconds:f*duration,rows:group.map(row=>select(row,plateaus.find(p=>p.rowId===row.id).entry.simTimeSeconds+f*duration))}))});
 }
 return {commonTimeSeconds,maximumCommonTip,terminal:group.map(r=>select(r,r.states.at(-1).simTimeSeconds)),stages,commonAbsoluteAgeSelections:[.25,.5,.75,1].map(f=>({fractionOfCommonAge:f,requestedTimeSeconds:f*commonTimeSeconds,rows:group.map(r=>select(r,f*commonTimeSeconds))}))};
}
const keys=[...new Set(rows.map(r=>[r.tempC,r.fraction,r.cflFill].join('/')))];
const groups=keys.map(key=>{
 const [tempC,fraction,cflFill]=key.split('/').map(Number),group=arms.map(arm=>rows.find(r=>r.tempC===tempC&&r.fraction===fraction&&r.cflFill===cflFill&&r.arm===arm));requireThat(group.every(Boolean),'complete quartet');
 return {tempC,fraction,cflFill,armOrder:arms,...compare(group)};
});
const stepKeys=[...new Set(rows.map(r=>[r.tempC,r.fraction].join('/')))];
const timestepGroups=stepKeys.map(key=>{const [tempC,fraction]=key.split('/').map(Number),g=rows.filter(r=>r.tempC===tempC&&r.fraction===fraction),steps=[...new Set(g.map(r=>r.cflFill))].sort((a,b)=>b-a);if(steps.length<2)return null;const group=steps.flatMap(cflFill=>arms.map(arm=>g.find(r=>r.cflFill===cflFill&&r.arm===arm)));return {tempC,fraction,stepOrder:steps,armOrder:arms,...compare(group)};}).filter(Boolean);
const report={scope:'Internal saved-data model-development readout, no simulation or scientific-source changes. All 64 Oct12 cold rows and 60 Oct10/11 controls. No physical, grid, domain or far-field independence claim.',createdAt:new Date().toISOString(),node:process.version,script:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},derivation:'Reuses stateMeasure and bracket from out/hil-two-day-design-2026-10-12/cold-triage.mjs. Ring arrays retained in selected states; selection schedule matches prior retained cold.mjs. Timestep groups use the same plateau and absolute-age algorithm across all compared steps, avoiding different windows.',definitions:{core:'Largest completely occupied central-plane integer hex ball, ring census checked against explicit site membership; tip=max occupied central-plane hex radius; gap=tip-core in lattice-radius cells. Occupancy is not mass.',plateau:'Elapsed time since each row enters exact tip, sampled at 0, .25, .5, .75 of shortest positive plateau; row absolute ages differ. Adjacent event state retained without interpolating occupancy.',absoluteAge:'Common absolute physical times at .25, .5, .75 and 1 of shortest run; at-or-before and next completed event states retained.',numerical:'Existing operational row checker rederives convergence, ledger, fill-CFL, symmetry, stopping and terminal agreement. No new solver run. Timestep qualification is configuration/observable specific; no grid/domain/far-field qualification.'},inputs,checks,rows:rows.map(({states,...r})=>({...r,updates:states.length-1,terminal:states.at(-1)})),groups,timestepGroups};
writeFileSync(resolve(output,'cold-readout.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,groups:groups.length,timestepGroups:timestepGroups.length,output:resolve(output,'cold-readout.json')}));
