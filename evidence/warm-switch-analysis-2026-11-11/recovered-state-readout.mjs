import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {decodeDiscoveryResumeCheckpoint,idx} from '../../core/src/index.ts';
import {LKSolver} from '../../solver-cpu/src/index.ts';
const root=resolve(process.argv[2]??'out/warm-switch-replay-2026-11-11'),out=resolve(process.argv[3]??'out/warm-switch-state-readout-2026-11-11');
const rowsRoot=resolve(process.argv[4]??'out/restores/bld-growth-dynamics-hil-20261024T2048/extracted/bld-growth-dynamics-oct21/rows');
const ids=['4p5','5'].flatMap(t=>[`gd21-bld-w1-t${t}-c025-early1-w3`,`gd21-bld-w1-t${t}-c025-early5-w3`,`gd21-bld-w2-t${t}-w4-early5`]);
assert(ids.every(id=>existsSync(resolve(root,id,'recovery-verification.json'))),'All six replay verification records must exist before complete-cohort readout');
const inputs=[],hash=b=>createHash('sha256').update(b).digest('hex');
const load=(p,json=false)=>{const b=readFileSync(p);inputs.push({path:p,bytes:b.length,sha256:hash(b)});return json?JSON.parse(b):b;};
const radius=(x,y)=>Math.max(Math.abs(x),Math.abs(y),Math.abs(x+y));
const summarize=cells=>({cells:cells.length,attached:cells.filter(c=>c.attached).length,unattached:cells.filter(c=>!c.attached).length,unattachedFill:range(cells.filter(c=>!c.attached).map(c=>c.fill)),unattachedLatticeSigma:range(cells.filter(c=>!c.attached).map(c=>c.latticeCellSigma))});
const range=xs=>xs.length?{min:Math.min(...xs),max:Math.max(...xs),mean:xs.reduce((a,b)=>a+b,0)/xs.length}:null;
const rows=ids.map(id=>{
 const receiptPath=resolve(root,id,'recovery-verification.json'),receipt=load(receiptPath,true);assert.equal(receipt.rowId,id);assert.equal(receipt.states.length,2);
 const states=receipt.states.map(s=>{
  const tail=s.solverFile.replaceAll('\\','/').split('/').slice(-2);const solverPath=resolve(root,id,'resume',...tail);const bytes=load(solverPath);assert.equal(hash(bytes),s.solverSha256);const solver=LKSolver.restoreDiscovery(decodeDiscoveryResumeCheckpoint(bytes));assert.equal(solver.tick,s.tick);assert.equal(solver.simTimeSeconds,s.simTimeSeconds);
  const cell=(x,y,z)=>{const index=idx(solver.dims,solver.center[0]+x,solver.center[1]+y,solver.center[2]+z),attached=solver.a[index]===1;return{offset:[x,y,z],index,attached,fill:solver.f[index],latticeCellSigma:attached?null:solver.sigma[index],attachedSigmaOmitted:attached};};
  const patch=[],rim1=[],rim2=[];
  for(const z of [-1,1])for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++){const r=radius(x,y);if(r<=1)patch.push(cell(x,y,z));else if(r===2)rim1.push(cell(x,y,z));}
  for(const z of [-2,2])for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++)if(radius(x,y)===2)rim2.push(cell(x,y,z));
  const axis=[-3,-2,-1,0,1,2,3].map(z=>cell(0,0,z));
  return{phase:s.phase,tick:s.tick,simTimeSeconds:s.simTimeSeconds,attachedCount:solver.a.reduce((n,a)=>n+a,0),patch,patchSummary:summarize(patch),axis,rimAtAdjacentPlanes:summarize(rim1),rimAtOuterPlanes:summarize(rim2),solverSource:{path:solverPath,bytes:bytes.length,sha256:hash(bytes)}};
 });
 const result=load(resolve(rowsRoot,id,'result.json'),true),later=result.spatialSnapshots.filter(x=>x.completedCycles>states[0].tick).slice(0,2).map(record=>{
  const s=load(resolve(rowsRoot,id,record.path),true);return{record,axisBasal:s.cells.filter(c=>c.coords[0]===s.center[0]&&c.coords[1]===s.center[1]&&c.facet==='basal').map(c=>({offset:c.coords[2]-s.center[2],fill:c.fill,solvedBoundarySigma:c.sigmaBoundary,alphaHKBoundary:c.alphaHKBoundary}))};
 });
 const comparisons=states.map(s=>({phase:s.phase,axis:s.axis.filter(c=>Math.abs(c.offset[2])===1&&!c.attached).map(c=>({offset:c.offset[2],fill:c.fill,laterComparisons:later.map(l=>{const x=l.axisBasal.find(x=>x.offset===c.offset[2]);return{record:l.record,available:!!x,...(x?{laterFill:x.fill,equalBinary64:Object.is(c.fill,x.fill),laterMinusCurrentFill:x.fill-c.fill}:{})};})}))}));
 const patchFillAdvance=states[0].patch.map(c=>{const next=states[1].patch.find(n=>n.index===c.index);return{offset:c.offset,attachedBefore:c.attached,attachedAfter:next.attached,fillBefore:c.fill,fillAfter:next.fill,deltaFill:next.fill-c.fill};});
 return{id,patchFillAdvance,receipt:{path:receiptPath,eventsMatched:receipt.eventsMatched,scope:receipt.scope,producer:receipt.producer,node:receipt.node},states,laterBoundarySnapshots:later,axisFloorFillComparisons:comparisons};
});
mkdirSync(out,{recursive:true});
const report={scope:'Read-only restored cycle-boundary state analysis; solver restore/array reads only, no relaxation or growth.',recipe:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},definitions:{phase:'C is the completed active crossing update at the actual cutoff boundary; C+1 is after one inactive relaxation and growth update.',sigma:'Checkpoint sigma is a lattice-cell supersaturation field from cycle-boundary state, not solved boundary sigma_b or a newly converged solution for the post-update geometry. Attached-cell field values are omitted as nonphysical.',fill:'f is the preserved per-cell fill fraction. Attached cells have f=1; comparisons concern explicitly unattached cells.',patch:'Fourteen sites: radius<=1 in z=-1,+1 relative to the seed center. Rim summaries are fixed-coordinate rings radius2 in z=-1,+1 or -2,+2, not inferred facet classes.',recovery:'Replay matched original scientific event prefixes; original complete switch states were absent, so there is no independent full-state comparison to an original checkpoint.',causality:'Comparing states from different histories does not isolate geometry, fill or vapor causality. No state was transplanted or changed.'},rows};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(report,null,2)+'\n');writeFileSync(resolve(out,'inputs.json'),JSON.stringify({inputs},null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({id:r.id,states:r.states.map(s=>({phase:s.phase,tick:s.tick,patch:s.patchSummary,axis:s.axis.filter(c=>Math.abs(c.offset[2])===1)})),floor:r.axisFloorFillComparisons})),null,2));
