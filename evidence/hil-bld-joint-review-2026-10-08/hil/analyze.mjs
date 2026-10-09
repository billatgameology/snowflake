import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { hexSeedSites, coordsOf, cartesian } from '../../../core/src/index.ts';
import { firstBatchRows } from '../../../runner/src/hil-bld-batch-roster.ts';
import { HIL_BATCH2_ROWS } from '../../../runner/src/hil-batch2-roster.ts';
import { summarizeFirstBatchRow } from '../../../runner/src/hil-bld-batch-summary.ts';
import { bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';

const destination = resolve(process.argv[4] ?? 'out/hil-bld-joint-review-20261008/hil/analysis-v2.json');
const roots = [resolve(process.argv[2] ?? '.tmp-discovery-resume/out/batch1-hil-resumable'), resolve(process.argv[3] ?? 'C:/Users/biao3/.codex/worktrees/hil-exploration-batch2/snowflake/out/batch2-hil')];
const sources = [];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function load(path, json = true) { const bytes = readFileSync(path); sources.push({ path, bytes: bytes.length, sha256: hash(bytes) }); return json ? JSON.parse(bytes) : bytes.toString(); }
function readRow(entry, root) {
  const dir = resolve(root, 'rows', entry.row.id), spec = load(resolve(dir, 'spec.json'));
  const result = load(resolve(dir, 'result.json')), exit = load(resolve(dir, 'exit.json'));
  const events = load(resolve(dir, 'events.jsonl'), false).trim().split('\n').map(JSON.parse);
  const coverage = summarizeFirstBatchRow(dir);
  if (coverage.disposition !== 'size-endpoint' || coverage.errors.length) throw Error(`${entry.row.id}: failed coverage`);
  const row = spec.row, dims = {nx:row.dimsN, ny:row.dimsN, nz:row.dimsN};
  const occupied = new Set(hexSeedSites(dims, row.seedRadius, row.seedThickness));
  const lo = [Infinity,Infinity,Infinity,Infinity,Infinity], hi=lo.map(()=>-Infinity);
  function include(coords) { const [x,y]=cartesian(...coords), v=[...coords,x,y]; for(let j=0;j<5;j++){lo[j]=Math.min(lo[j],v[j]);hi[j]=Math.max(hi[j],v[j]);} }
  for(const index of occupied) include(coordsOf(dims,index));
  function geometry(){const cells=lo.slice(0,3).map((v,j)=>hi[j]-v+1);return {iCells:cells[0],jCells:cells[1],axialCells:cells[2],axialCenterSpanUm:(cells[2]-1)*row.dxUm,lateralLatticeCenterSpanUm:(Math.max(cells[0],cells[1])-1)*row.dxUm,cartesianLateralInclusiveUm:(Math.max(hi[3]-lo[3],hi[4]-lo[4])+1)*row.dxUm,aspectRatio:cells[2]/(Math.max(hi[3]-lo[3],hi[4]-lo[4])+1)};}
  const initialGeometry=geometry();
  const states=[{cycle:0,simTimeSeconds:0,extent:Math.max(initialGeometry.iCells,initialGeometry.jCells,initialGeometry.axialCells),attachedCount:occupied.size,...initialGeometry}];
  for(const e of events){
    for(const a of e.attached){if(occupied.has(a.index))throw Error('duplicate attachment');occupied.add(a.index);include(a.coords);}
    const g=geometry();
    if(occupied.size!==e.attachedCount || Math.max(g.iCells,g.jCells,g.axialCells)!==e.extent || g.aspectRatio!==e.aspectRatio)throw Error(`${row.id} geometry mismatch ${e.cycle}`);
    states.push({cycle:e.cycle,simTimeSeconds:e.simTimeSeconds,extent:e.extent,attachedCount:e.attachedCount,...g});
  }
  if(states.at(-1).cycle!==result.cycles || states.at(-1).aspectRatio!==result.aspectRatio)throw Error('terminal mismatch');
  const snapshots=(result.spatialSnapshots??[]).map(ref=>{
    const s=load(resolve(dir,ref.path));
    const facets={};for(const name of ['basal','prism','rough','inhibited']){const cells=s.cells.filter(c=>c.facet===name);const mean=(fn)=>cells.length?cells.map(fn).sort((a,b)=>a-b).reduce((a,b)=>a+b,0)/cells.length:null;facets[name]={count:cells.length,meanSigmaBoundary:mean(c=>c.sigmaBoundary),meanSigmaOpp:mean(c=>c.sigmaOpp),meanAlphaHKBoundary:mean(c=>c.alphaHKBoundary),meanAlphaHKSigmaBoundary:mean(c=>c.alphaHKBoundary*c.sigmaBoundary)};}
    return {...ref,facets};
  });
  return {row,track:entry.track,result,exit,coverage,states,snapshots,event:events.find(e=>e.timelineEvent)?.simTimeSeconds??null};
}
const rows=[...firstBatchRows('HIL').map(e=>readRow(e,roots[0])),...HIL_BATCH2_ROWS.map(e=>readRow(e,roots[1]))];
function age(group, time=Math.min(...group.map(r=>r.result.simTimeSeconds))){return {requestedTimeSeconds:time,rows:group.map(r=>({rowId:r.row.id,...bracketCavityTime(r.states,time)}))};}
const arms=['both','neither','basal-only','prism-only'];
function effects(v){const [b,n,a,p]=v;return {bothMinusNeither:b-n,basalOnlyMinusNeither:a-n,prismOnlyMinusNeither:p-n,interaction:b-a-p+n};}
function contrasts(group){if(group.length!==4)throw Error('quartet missing');const t=age(group);return {rowIds:group.map(r=>r.row.id),endpoint:group.map(r=>r.states.at(-1)),endpointAREffects:effects(group.map(r=>r.result.aspectRatio)),commonAge:t,commonAgeAREffects:effects(t.rows.map(r=>r.atOrBefore.aspectRatio)),bothNeitherPairAge:age(group.slice(0,2)),sizeCrossings:[9,13,17,21].map(extent=>({extent,rows:group.map(r=>({rowId:r.row.id,state:r.states.find(s=>s.extent>=extent)}))}))};}
const seeds=[];for(const tempC of [-7,-8,-9])for(const [radius,thickness]of[[3,1],[1,5]]){const group=arms.map(a=>rows.find(r=>r.track==='seed'&&r.row.tempC===tempC&&r.row.seedRadius===radius&&r.row.seedThickness===thickness&&r.row.experimentalFacetDips===a));seeds.push({tempC,radius,thickness,...contrasts(group)});}
const pressure=[];for(const fraction of [.1,.15,.2])for(const arm of arms){const group=rows.filter(r=>r.track==='pressure'&&r.row.fraction===fraction&&r.row.experimentalFacetDips===arm).sort((a,b)=>a.row.pressurePa-b.row.pressurePa);pressure.push({fraction,arm,pressurePa:group.map(r=>r.row.pressurePa),rowIds:group.map(r=>r.row.id),endpoint:group.map(r=>r.states.at(-1)),commonAge:age(group),sizeCrossings:[9,13,17,21].map(extent=>({extent,rows:group.map(r=>({rowId:r.row.id,state:r.states.find(s=>s.extent>=extent)}))}))});}
const pressureQuartets=[];for(const fraction of [.1,.15,.2])for(const pressurePa of [50662.5,101325,202650]){const group=arms.map(a=>rows.find(r=>r.track==='pressure'&&r.row.fraction===fraction&&r.row.pressurePa===pressurePa&&r.row.experimentalFacetDips===a));if(group.every(Boolean))pressureQuartets.push({fraction,pressurePa,...contrasts(group)});}
const history=[];for(const fromTempC of [-6,-14.4])for(const paramSet of ['M1','M1_NO_DIP_ABLATION']){const group=rows.filter(r=>r.row.timelineEvent&&r.row.tempC===fromTempC&&r.row.paramSet===paramSet).sort((a,b)=>a.row.timelineEvent.triggerLargestExtent-b.row.timelineEvent.triggerLargestExtent);const elapsed=Math.min(...group.map(r=>r.result.simTimeSeconds-r.event));const toTempC=group[0].row.timelineEvent.tempC;const controls=rows.filter(r=>r.track==='environment-history'&&!r.row.timelineEvent&&r.row.paramSet===paramSet);history.push({fromTempC,toTempC,paramSet,commonElapsedAfterEventSeconds:elapsed,rows:group.map(r=>({rowId:r.row.id,trigger:r.row.timelineEvent.triggerLargestExtent,eventTimeSeconds:r.event,eventState:r.states.find(s=>s.simTimeSeconds===r.event),terminal:r.states.at(-1),postEventSeconds:r.result.simTimeSeconds-r.event,postEventBracket:bracketCavityTime(r.states,r.event+elapsed)})),staticControls:controls.map(r=>({rowId:r.row.id,tempC:r.row.tempC,terminal:r.states.at(-1)})),commonAbsoluteAgeWithStatic:age([...group,...controls])});}
const commits=[...new Set(rows.map(r=>r.result.gitHead))];
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const report={schema:'hil-joint-internal-triage-v1',createdAt:new Date().toISOString(),claimLevel:'Internal exploratory model-development review, no physical or grid/domain validation',method:{geometry:'Reconstruct occupancy cumulatively from exact seed plus recorded attached-site coordinates; check all event counts, largest extents and Cartesian aspect ratios exactly. Inclusive axial and Cartesian lateral spans differ from center spans.',time:'Reuse bracketCavityTime: at-or-before discrete state plus next event, never interpolation or cycle-index matching.',quartets:'Order both, neither, basal-only, prism-only. Interaction = both - basal-only - prism-only + neither. Common quartet age uses shortest terminal; pair age additionally retained.',histories:'Each comparison retains actual event time; post-event alignment uses shortest elapsed-after-event in the three switch-stage rows. Static comparisons are common absolute age and unequal initial history, not matched geometry.',spatial:'All saved pre-update snapshots, means over actual facet cells. Mean cellwise coefficient*boundary supersaturation is a kinetic demand factor, not mass or deposited fill.'},sourceCompatibility:{commits,changedSourceFiles:git('diff','--name-only',commits[0],commits[1],'--','core','solver-cpu','runner/src').split('\n'),sameNumericalAndDiscoverySource:git('diff','--name-only',commits[0],commits[1],'--','core','solver-cpu','runner/src/post-phase10-discovery.ts')==='',scope:'Inspected diff contains publication-only retry and finite batch dispatch; numerical core/solver and discovery evolution producer unchanged; same Node runtime.'},census:{expected:72,checkedSizeEndpoints:rows.length,node:[...new Set(rows.map(r=>r.result.node))],allD6h:rows.every(r=>r.result.symmetryError===0&&r.result.allAttachmentEventsD6h),allConverged:rows.every(r=>r.result.allRelaxationsConverged),allGeometryReconstructed:true},inventory:rows.map(r=>({row:r.row,producer:r.result.gitHead,coverage:r.coverage,endpoint:r.states.at(-1),seed:r.states[0],snapshots:r.snapshots})),seeds,pressure,pressureQuartets,history,sources};
writeFileSync(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,bytes:readFileSync(destination).length,sha256:hash(readFileSync(destination)),census:report.census,seeds:seeds.map(r=>({tempC:r.tempC,seed:`${r.radius}/${r.thickness}`,endpoint:r.endpoint.map(s=>s.aspectRatio),commonAge:r.commonAge.requestedTimeSeconds,common:r.commonAge.rows.map(s=>s.atOrBefore.aspectRatio),effects:r.commonAgeAREffects})),pressure:pressure.map(r=>({fraction:r.fraction,arm:r.arm,pressures:r.pressurePa,AR:r.endpoint.map(s=>s.aspectRatio),count:r.endpoint.map(s=>s.attachedCount),times:r.endpoint.map(s=>s.simTimeSeconds),commonAR:r.commonAge.rows.map(s=>s.atOrBefore.aspectRatio)})),history},null,2));
