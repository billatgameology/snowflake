// Fixed W4 recipe: unchanged cavity helpers, frozen cohorts, no evolution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analyzeCavityRows, bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';
import { measureCavityGeometry } from '../../../runner/src/post-phase10-cavity-geometry.ts';
import { summarizeFirstBatchRow } from '../../../runner/src/hil-bld-batch-summary.ts';
import { hexSeedSites } from '../../../core/src/index.ts';

const out=path.resolve(process.env.W4_ANALYSIS_OUT??path.dirname(fileURLToPath(import.meta.url))); fs.mkdirSync(out,{recursive:true});
const bld=path.resolve(process.env.W4_BLD_ROWS??'out/restores/bld-growth-dynamics-hil-20261024T2048/extracted/bld-growth-dynamics-oct21/rows');
const old=path.resolve(process.env.W4_OLD_ROWS??'out/hil-retired-2026-10-21/hil-warm-refinement/out/warm-refinement-hil/rows');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const inputs=new Map();
function bind(p){const b=fs.readFileSync(p);inputs.set(p,{path:p,bytes:b.length,sha256:hash(b)});return b;}
const json=p=>JSON.parse(bind(p));
const write=(leaf,value)=>fs.writeFileSync(path.join(out,leaf),JSON.stringify(value,null,2)+'\n');
const hil=path.resolve(process.env.W4_HIL_ROWS??'C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake/out/hil-growth-dynamics-oct21/rows');
const representations=['coarse','fine-thin','fine-thick'];
function w4(rep,c,arm){if(c==='05')return `warm-refine-${rep}-t4p5-${arm}`;if(rep==='coarse')return `gd21-bld-w1-t4p5-c025-${arm==='early'?'early20-w3':'broad'}`;return `gd21-hil-w4-${rep==='fine-thin'?'h1':'h3'}-${arm==='early'?'early20-w6':'broad'}`;}
const allIds=representations.flatMap(rep=>['05','025'].flatMap(c=>['broad','early'].map(a=>w4(rep,c,a))));
const cohorts=[{id:'W4-primary-12',expected:12,ids:allIds},...representations.map(rep=>({id:`W4-secondary-${rep}`,expected:4,ids:['05','025'].flatMap(c=>['broad','early'].map(a=>w4(rep,c,a)))})),...['05','025'].map(c=>({id:`W4-secondary-CFL-${c}`,expected:6,ids:representations.flatMap(rep=>['broad','early'].map(a=>w4(rep,c,a)))}))];
const cache=new Map();
for(const id of new Set(cohorts.flatMap(c=>c.ids))){
  console.log('Reconstructing',id);
  const dir=path.join(id.startsWith('warm-refine-')?old:id.startsWith('gd21-hil-')?hil:bld,id);
  const spec=json(path.join(dir,'spec.json')),result=json(path.join(dir,'result.json')),exit=json(path.join(dir,'exit.json')),host=json(path.join(dir,'host.json'));
  const checked=summarizeFirstBatchRow(dir);
  const events=bind(path.join(dir,'events.jsonl')).toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const x={id,dir,row:spec.row,spec,result,exit,host,checked,events,analysis:null};cache.set(id,x);
  if(checked.disposition!=='size-endpoint')continue;
  const a=analyzeCavityRows([dir],{centerSpansUm:[9.8]}).rows[0].analysis;assert(a);x.analysis=a;
  for(const source of a.sources)inputs.set(source.path,source);
  x.dims={nx:x.row.dimsN,ny:x.row.dimsN,nz:x.row.dimsN};
  x.seed=new Set(hexSeedSites(x.dims,x.row.seedRadius,x.row.seedThickness));
  x.states=[{cycle:0,simTimeSeconds:0,extent:Math.max(2*x.row.seedRadius+1,x.row.seedThickness),attachedCount:x.seed.size},...events.map(e=>({cycle:e.cycle,simTimeSeconds:e.simTimeSeconds,extent:e.extent,attachedCount:e.attachedCount}))];
  x.frames=new Map(a.frames.map(f=>[f.cycle,f]));
}
const metricKeys=['attachedCount','axialCenterSpanUm','lateralCenterSpanUm','occupiedCellVolumeUm3','addedProbeFullWaistThicknessUm','straightAxiallyOpenLayers','maxStraightOpenDepthBelowAxialEnvelopeUm'];
function frame(x,cycle){
  if(x.frames.has(cycle))return x.frames.get(cycle);
  const occupied=new Set(x.seed);for(const e of x.events){if(e.cycle>cycle)break;for(const s of e.attached)occupied.add(s.index);}
  const g=measureCavityGeometry(occupied,x.dims,x.row.dxUm);assert.equal(g.attachedCount,x.states[cycle].attachedCount);
  let open=0,depth=0;for(const l of g.layers){if(l.lateralVoid!=='enclosed')continue;if(l.directAxialOpening.lower||l.directAxialOpening.upper)open++;if(l.directAxialOpening.lower)depth=Math.max(depth,(l.k-g.spans.k.min)*x.row.dxUm);if(l.directAxialOpening.upper)depth=Math.max(depth,(g.spans.k.max-l.k)*x.row.dxUm);}
  const f={...x.states[cycle],geometry:g,enclosureWitnesses:{straightAxiallyOpenLayers:open,maxStraightOpenDepthBelowAxialEnvelopeUm:depth}};x.frames.set(cycle,f);return f;
}
function values(x,f){const g=f.geometry,s=x.analysis.frames[0].geometry;return{cycle:f.cycle,simTimeSeconds:f.simTimeSeconds,extent:f.extent,largestCenterSpanUm:(f.extent-1)*x.row.dxUm,attachedCount:g.attachedCount,axialCenterSpanUm:g.spans.k.centerSpanUm,lateralCenterSpanUm:Math.max(g.spans.i.centerSpanUm,g.spans.j.centerSpanUm),addedAxialCenterSpanUm:g.spans.k.centerSpanUm-s.spans.k.centerSpanUm,addedLateralCenterSpanUm:Math.max(g.spans.i.centerSpanUm,g.spans.j.centerSpanUm)-Math.max(s.spans.i.centerSpanUm,s.spans.j.centerSpanUm),occupiedCellVolumeUm3:g.occupiedCellVolumeUm3,probeFullWaistThicknessUm:g.waist.inclusiveThicknessUm,addedProbeFullWaistThicknessUm:g.waist.inclusiveThicknessUm-s.waist.inclusiveThicknessUm,straightAxiallyOpenLayers:f.enclosureWitnesses.straightAxiallyOpenLayers,maxStraightOpenDepthBelowAxialEnvelopeUm:f.enclosureWitnesses.maxStraightOpenDepthBelowAxialEnvelopeUm};}
function sample(x,t){const b=bracketCavityTime(x.states,t);return{...b,atOrBeforeValues:values(x,frame(x,b.atOrBefore.cycle)),nextEventValues:b.nextEvent?values(x,frame(x,b.nextEvent.cycle)):null};}
const alternatives=s=>[s.atOrBeforeValues,s.nextEventValues].filter(Boolean);
const delta=(a,b)=>Object.fromEntries(metricKeys.map(k=>[k,a[k]-b[k]]));
function range(xs){return Object.fromEntries(metricKeys.map(k=>[k,[Math.min(...xs.map(x=>x[k])),Math.max(...xs.map(x=>x[k]))]]));}
function increment(a,b){return{atOrBefore:delta(b.atOrBeforeValues,a.atOrBeforeValues),adjacentEventAlternatives:range(alternatives(b).flatMap(bv=>alternatives(a).map(av=>delta(bv,av))))};}
function intervalSummary(intervals){return{count:intervals.length,survivingAtStop:intervals.filter(i=>i.endExclusive===null).length,maxPostCutoffTipAdvanceUm:Math.max(0,...intervals.map(i=>i.postCutoff?.maxTipAdvanceWhileOpenUm??0)),maxTipAdvanceWhileOpenUm:Math.max(0,...intervals.map(i=>i.maxTipAdvanceWhileOpenUm)),maxDepthUm:Math.max(0,...intervals.map(i=>i.maxDepthBelowAxialEnvelopeUm))};}
function rowSummary(x){if(!x.analysis)return{rowId:x.id,status:x.checked.disposition,checked:x.checked,row:x.row,producer:x.result.gitHead};const a=x.analysis,h=a.basalWidthHistory;return{rowId:x.id,status:'size-endpoint',row:x.row,producer:x.result.gitHead,node:x.result.node,seed:values(x,a.frames[0]),terminal:values(x,a.frames.at(-1)),exactSize:a.sizeSelections.map(s=>({...s,values:s.selectedCycle===null?null:values(x,frame(x,s.selectedCycle))})),firstLaterallyEnclosedCenter:a.firstLaterallyEnclosedCenter,straightOpenIntervals:intervalSummary(a.straightOpenPlaneIntervals),...(h?{history:{actualSwitchTimeSeconds:h.actualSwitchTimeSeconds,cutoffBoundary:h.cutoffBoundary,original:intervalSummary(h.originalOpeningIntervals),newPostCutoff:intervalSummary(h.newPostCutoffOpeningIntervals),exposure:a.basalWidthObservation.cutoffExposure,postSwitchToEndpoint:h.actualSwitchTimeSeconds===null?null:{durationSeconds:x.result.simTimeSeconds-h.actualSwitchTimeSeconds,...increment(sample(x,h.actualSwitchTimeSeconds),sample(x,x.result.simTimeSeconds))}}}:{}),widthExposure:a.basalWidthObservation??null};}
const cohortReports=cohorts.map(c=>{
  assert.equal(c.ids.length,c.expected);const members=c.ids.map(id=>cache.get(id)),unavailable=members.filter(x=>!x.analysis).map(x=>({rowId:x.id,checked:x.checked}));
  if(unavailable.length)return{...c,available:false,unavailable,reason:'Frozen full cohort unavailable; failed row retained and no primary common age computed.'};
  const T=Math.min(...members.map(x=>x.result.simTimeSeconds));
  return{...c,available:true,commonTimeSeconds:T,rows:members.map(x=>{const times=[0,.25,.5,.75,1].map(f=>({fraction:f,...sample(x,f*T)}));return{rowId:x.id,times,quarters:times.slice(1).map((b,i)=>({fromFraction:i/4,toFraction:(i+1)/4,...increment(times[i],b)})),halves:[[0,2],[2,4]].map(([i,j])=>({fromFraction:i/4,toFraction:j/4,...increment(times[i],times[j])}))};})};
});
const postSwitchPairs=[];
for(const rep of representations)for(const c of ['05','025']){
  const e=cache.get(w4(rep,c,'early')),b=cache.get(w4(rep,c,'broad'));const start=e.analysis?.basalWidthHistory?.actualSwitchTimeSeconds,end=Math.min(e.result.simTimeSeconds,b.result.simTimeSeconds);
  if(start===null||start===undefined||start>=end){postSwitchPairs.push({early:e.id,broad:b.id,available:false,start,end});continue;}
  const es=sample(e,start),ee=sample(e,end),bs=sample(b,start),be=sample(b,end),ei=increment(es,ee),bi=increment(bs,be);
  postSwitchPairs.push({early:e.id,broad:b.id,available:true,start,end,durationSeconds:end-start,earlyStart:es,earlyEnd:ee,broadStart:bs,broadEnd:be,earlyIncrement:ei,broadIncrement:bi,earlyMinusBroadGrowth:delta(ei.atOrBefore,bi.atOrBefore)});
}
const sourceFiles=['runner/src/post-phase10-cavity-analysis.ts','runner/src/post-phase10-cavity-geometry.ts','runner/src/post-phase10-cavity-spatial.ts','runner/src/hil-bld-batch-summary.ts'];
for(const f of sourceFiles)bind(path.resolve(f));bind(fileURLToPath(import.meta.url));
const report={scope:'Frozen W4 twelve-member saved-data comparisons, implementation only; no new simulation or physical validation.',command:process.argv,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,generatedAt:new Date().toISOString(),definitions:{time:'Full frozen-cohort minimum terminal age; at-or-before and next-event alternatives, never interpolation or confidence bounds.',geometry:'Existing cavity geometry/readout definitions; signed axial layers are not independent cavities; occupied volume excludes partial fill.',unavailable:'Invalid or missing member makes full primary cohort unavailable; no silent shrink.',history:'Whole coupled crossing update keeps old phase; use next-update actual switch and measured selected demand.',size:'Exact largest lattice-coordinate center span9.8um, retaining actual crossing and equality flag.'},rows:[...cache.values()].map(rowSummary),cohorts:cohortReports,postSwitchPairs};
write('warm-comparisons.json',report);write('inputs.json',{inputs:[...inputs.values()],roots:{bld,old,hil},recipe:fileURLToPath(import.meta.url),historicalHashBinding:'Compare the six reused specs/results/events/snapshots against evidence/hil-results-review-2026-10-21/warm/inputs.json; original source/runtime remains separately recorded.'});
console.log(JSON.stringify({rows:report.rows.length,availableCohorts:cohortReports.filter(c=>c.available).map(c=>({id:c.id,time:c.commonTimeSeconds})),unavailable:cohortReports.filter(c=>!c.available).map(c=>c.id),postSwitchPairs:postSwitchPairs.length}));
