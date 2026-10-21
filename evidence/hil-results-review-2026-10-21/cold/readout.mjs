import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexSeedSites, domainCenter, coordsOf, neighborIndices } from '../../../core/src/index.ts';

// Bounded post-hoc saved-observation analysis; no solver construction or launch.
let input;
const output = resolve(process.argv[2] ?? 'out/analysis-2026-10-21/cold/readout.json');
// Optional paths are campaign roots containing rows/, suitable for a NAS fresh restore.
const campaignRoots = {
 'hil-exploration-oct10': resolve(process.argv[3] ?? 'C:/Users/biao3/.codex/worktrees/hil-exploration-oct10/snowflake/out/hil-exploration-oct10'),
 'hil-domain-seed-oct19': resolve(process.argv[4] ?? 'C:/Users/biao3/.codex/worktrees/hil-domain-seed-oct19/snowflake/out/hil-domain-seed-oct19')
};
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

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { summarizeFirstBatchRow } from '../../../runner/src/hil-bld-batch-summary.ts';
const sourcePaths=['core/src','solver-cpu/src','runner/src/post-phase10-discovery.ts','runner/src/discovery-resume-io.ts','runner/src/hil-bld-batch-summary.ts'];
const sourceCommand=['diff','--name-only','33832e2','ff7b1a8','--',...sourcePaths];
const changedPaths=execFileSync('git',sourceCommand,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);assert.deepEqual(changedPaths,[]);
const rows=[],checks=[];
for(const [N,name,prefix,producer] of [[64,'hil-exploration-oct10','oct10-hil-cold-t14p4-f0p1','33832e20a386c52d830e2dd338a1f8671a25db8f'],[96,'hil-domain-seed-oct19','oct19-hil-cold-domain-t14p4-f0p1-n96','ff7b1a88bc62335216b9edb23d487eec82868e3a']]){
 input=campaignRoots[name];
 for(const arm of arms){
  const id=`${prefix}-${arm}`,dir='rows/'+id,spec=read(dir+'/spec.json'),row=spec.row,result=read(dir+'/result.json'),events=read(dir+'/events.jsonl',true);read(dir+'/exit.json');
  assert.equal(result.gitHead,producer);assert.equal(row.dimsN,N);assert.equal(row.experimentalFacetDips,arm);assert.equal(row.id,id);
  if(N===96){const prior=rows.find(r=>r.N===64&&r.arm===arm);const a={...prior.spec.row},b={...row};delete a.id;delete b.id;delete a.dimsN;delete b.dimsN;assert.deepEqual(a,b);assert.deepEqual(prior.spec.fixed,spec.fixed);}
  const checked=summarizeFirstBatchRow(resolve(input,dir));assert.equal(checked.disposition,'size-endpoint');checks.push(checked);
  const dims={nx:N,ny:N,nz:N},center=domainCenter(dims),occupied=new Set(hexSeedSites(dims,row.seedRadius,row.seedThickness));
  const snapshots=result.spatialSnapshots.map(record=>({record,snapshot:read(`${dir}/${record.path}`)}));const profiles=[];
  let state=stateMeasure(occupied,dims,center,{cycle:0,simTimeSeconds:0,extent:5});const states=[state];
  function capture(){for(const {record,snapshot} of snapshots.filter(s=>s.record.completedCycles===state.cycle)){assert.equal(snapshot.rowId,id);assert.equal(snapshot.experimentalFacetDips,arm);assert.deepEqual(snapshot.record,record);profiles.push(spatial(snapshot,occupied,dims,center,state));}}
  capture();
  for(const event of events){
   requireThat(event.cycle===state.cycle+1&&event.simTimeSeconds>state.simTimeSeconds,'event sequence');
   for(const cell of event.attached){requireThat(!occupied.has(cell.index),'duplicate attachment');assert.deepEqual(coordsOf(dims,cell.index),cell.coords);occupied.add(cell.index);}
   assert.equal(occupied.size,event.attachedCount);state=stateMeasure(occupied,dims,center,{cycle:event.cycle,simTimeSeconds:event.simTimeSeconds,extent:event.extent});states.push(state);capture();
  }
  assert.equal(state.attachedCount,result.attachedCount);assert.equal(state.cycle,result.cycles);assert.equal(state.simTimeSeconds,result.simTimeSeconds);assert.equal(profiles.length,snapshots.length);
  rows.push({id,N,arm,spec,producer:result.gitHead,node:result.node,states,profiles});
 }
}
const select=(row,t)=>({id:row.id,N:row.N,arm:row.arm,...bracket(row.states,t)});
const stages=[8,9].map(tip=>{
 const plateaus=rows.map(row=>{const entry=row.states.find(x=>x.tip===tip),exit=row.states.find(x=>x.tip>tip)??row.states.at(-1);return {rowId:row.id,entry,exit,durationSeconds:entry?exit.simTimeSeconds-entry.simTimeSeconds:0};});
 const duration=Math.min(...plateaus.map(p=>p.durationSeconds));if(duration<=0)return {tip,available:false,plateaus};
 return {tip,available:true,shortestPlateauSeconds:duration,plateauBoundaries:plateaus.map(p=>({id:p.rowId,entrySeconds:p.entry.simTimeSeconds,exitSeconds:p.exit.simTimeSeconds,durationSeconds:p.durationSeconds})),selections:[0,.25,.5,.75].map(f=>({fractionOfShortestPlateau:f,elapsedSeconds:f*duration,rows:rows.map(row=>select(row,plateaus.find(p=>p.rowId===row.id).entry.simTimeSeconds+f*duration))}))};
});
const commonTimeSeconds=Math.min(...rows.map(r=>r.states.at(-1).simTimeSeconds));
const commonCrossings=rows[0].profiles.map(p=>p.record.triggerExtent).filter(e=>rows.every(r=>r.profiles.some(p=>p.record.triggerExtent===e)));
const crossingComparisons=commonCrossings.map(e=>({triggerExtent:e,rows:rows.map(r=>({id:r.id,N:r.N,arm:r.arm,...r.profiles.find(p=>p.record.triggerExtent===e)}))}));
const oldRecipe='evidence/hil-results-review-2026-10-18/cold/read-cold.mjs';
const report={createdAt:new Date().toISOString(),scope:'Registered eight-row N64/N96 cold domain readout. Internal model development; same spacing does not test grid refinement or establish domain/far-field independence.',script:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},reusedDefinitions:{path:oldRecipe,sha256:hash(readFileSync(oldRecipe)),functions:['stateMeasure','bracket','spatial','stats'],changes:'Only row selection, registered tip8/9 stages, joint windows, explicit unavailable records and packaging. No reconstruction or numerical law changed.'},sourceParity:{command:['git',...sourceCommand],changedPaths},inputs,checks,definitions:{core:'Largest fully occupied central-plane integer hex ball checked by ring census and explicit membership; tip is maximum occupied hex radius; gap=tip-core. Lattice-radius units; occupancy not mass.',plateau:'Same elapsed physical time since each row entered exact tip; .0/.25/.5/.75 of shortest positive plateau across all8 rows. Different absolute ages. Retain adjacent event, including at plateau entry.',absoluteAge:'Quarter fractions of shortest terminal physical age across all8. Geometry differs; no occupancy interpolation.',spatial:'Saved after-converged-relaxation-before-surface-advance fields at common registered extent crossings only. Independently reconstructed boundary membership and neighbor/facet classification. Common extent is not common age or identical geometry.'},armOrder:arms,domainOrder:[64,96],rows:rows.map(({states,profiles,...r})=>({...r,terminal:states.at(-1),snapshotCount:profiles.length})),stages,commonTimeSeconds,absoluteAgeSelections:[.25,.5,.75,1].map(f=>({fractionOfCommonAge:f,requestedTimeSeconds:f*commonTimeSeconds,rows:rows.map(r=>select(r,f*commonTimeSeconds))})),commonCrossings,crossingComparisons};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,rows:rows.length,updates:checks.reduce((n,c)=>n+c.completedUpdates,0),snapshots:rows.reduce((n,r)=>n+r.profiles.length,0),commonTimeSeconds,tipMidpoints:stages.map(s=>({tip:s.tip,available:s.available,gaps:s.available?s.selections[2].rows.map(r=>r.atOrBefore.gap):null}))},null,2));
