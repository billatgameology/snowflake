import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeCavityRows, bracketCavityTime } from '../../../runner/src/post-phase10-cavity-analysis.ts';
import { hexSeedSites, domainCenter, coordsOf } from '../../../core/src/index.ts';

const output = dirname(fileURLToPath(import.meta.url));
const input = process.env.BLD_REVIEW_INPUT ?? 'C:/Users/biao3/.codex/worktrees/hil-bld-results-integration/snowflake/out/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = [];
function read(path, lines=false) {
  const bytes=readFileSync(path); inputs.push({path,bytes:bytes.length,sha256:hash(bytes)});
  return lines ? bytes.toString().trim().split('\n').filter(Boolean).map(JSON.parse) : JSON.parse(bytes);
}
const directories=readdirSync(resolve(input,'rows')).sort().map(x=>resolve(input,'rows',x));
const cavity=analyzeCavityRows(directories,{centerSpansUm:[1.4,2.8,4.2,5.6,7]});
writeFileSync(resolve(output,'cavity-readout.json'),JSON.stringify(cavity,null,2)+'\n');
const rows=directories.map(directory=>{
  const spec=read(resolve(directory,'spec.json')), result=read(resolve(directory,'result.json'));
  const events=read(resolve(directory,'events.jsonl'),true), row=spec.row;
  const dims={nx:row.dimsN,ny:row.dimsN,nz:row.dimsN},center=domainCenter(dims);
  const occupancy=new Set(hexSeedSites(dims,row.seedRadius,row.seedThickness));
  const plane=new Set(), ringCounts=new Map(); let tipRadius=0;
  const add=index=>{const [i,j,k]=coordsOf(dims,index); if(k!==center[2])return; const x=i-center[0], y=j-center[1],r=Math.max(Math.abs(x),Math.abs(y),Math.abs(x+y));plane.add(`${x},${y}`);ringCounts.set(r,(ringCounts.get(r)??0)+1);tipRadius=Math.max(tipRadius,r);};
  for(const index of occupancy)add(index);
  function measure(state){let coreRadius=-1;for(let r=0;r<=tipRadius;r++){if((ringCounts.get(r)??0)!==(r===0?1:6*r))break;coreRadius=r;}return {...state,coreRadius,tipRadius,coreRadiusUm:coreRadius*row.dxUm,tipRadiusUm:tipRadius*row.dxUm,radialGapCells:tipRadius-coreRadius,radialGapUm:(tipRadius-coreRadius)*row.dxUm,normalizedDepth:tipRadius===0?0:(tipRadius-coreRadius)/tipRadius,centralPlaneAttached:plane.size};}
  const states=[measure({cycle:0,simTimeSeconds:0,extent:Math.max(2*row.seedRadius+1,row.seedThickness),attachedCount:occupancy.size})];
  for(const event of events){for(const site of event.attached){if(occupancy.has(site.index))throw Error(`duplicate ${row.id}`);occupancy.add(site.index);add(site.index);}if(occupancy.size!==event.attachedCount)throw Error(`count mismatch ${row.id}`);states.push(measure({cycle:event.cycle,simTimeSeconds:event.simTimeSeconds,extent:event.extent,attachedCount:event.attachedCount}));}
  const analyzed=cavity.rows.find(x=>x.rowId===row.id).analysis;
  const last=analyzed.frames.at(-1), history=analyzed.basalWidthHistory;
  return {row,result,states,terminal:states.at(-1),cavityTerminal:{cycle:last.cycle,timeSeconds:last.simTimeSeconds,enclosure:last.enclosureWitnesses,waist:last.geometry.waist,occupiedCellVolumeUm3:last.geometry.occupiedCellVolumeUm3},...(history?{history:{...history,originalSurviving:history.originalOpeningIntervals.filter(x=>x.endExclusive===null).length,newSurviving:history.newPostCutoffOpeningIntervals.filter(x=>x.endExclusive===null).length,maximumPostCutoffAdvanceUm:Math.max(0,...history.originalOpeningIntervals.map(x=>x.postCutoff.maxTipAdvanceWhileOpenUm)),exposure:analyzed.basalWidthObservation.cutoffExposure}}:{}),spatialProfiles:analyzed.spatial};
});
const cold=rows.filter(x=>x.row.id.includes('-cold-'));
const coldGroups=[...new Set(cold.map(x=>`${x.row.tempC}/${x.row.fraction}`))].map(condition=>{
  const group=cold.filter(x=>`${x.row.tempC}/${x.row.fraction}`===condition),commonTimeSeconds=Math.min(...group.map(x=>x.result.simTimeSeconds));
  let commonTipRadius=Math.min(...group.map(x=>x.terminal.tipRadius));
  while(group.some(x=>{const entry=x.states.find(s=>s.tipRadius===commonTipRadius),exit=x.states.find(s=>s.tipRadius>commonTipRadius)??x.terminal;return !entry||exit.simTimeSeconds<=entry.simTimeSeconds;}))commonTipRadius--;
  const plateaus=group.map(x=>{const entry=x.states.find(s=>s.tipRadius===commonTipRadius),exit=x.states.find(s=>s.tipRadius>commonTipRadius);return{rowId:x.row.id,entry,exit:exit??null,durationSeconds:(exit??x.terminal).simTimeSeconds-entry.simTimeSeconds};});
  const commonPlateauAgeSeconds=Math.min(...plateaus.map(p=>p.durationSeconds))/2;
  return {condition,commonTimeSeconds,commonTipRadius,commonPlateauAgeSeconds,plateaus,rows:group.map(x=>({rowId:x.row.id,arm:x.row.experimentalFacetDips,terminal:x.terminal,terminalAspectRatio:x.result.aspectRatio,ageSelections:[.25,.5,.75,1].map(fraction=>({fraction,...bracketCavityTime(x.states,fraction*commonTimeSeconds)})),firstCommonTip:x.states.find(s=>s.tipRadius>=commonTipRadius),matchedTipAndPhysicalPlateauAge:bracketCavityTime(x.states,plateaus.find(p=>p.rowId===x.row.id).entry.simTimeSeconds+commonPlateauAgeSeconds)}))};
});
const warm=rows.filter(x=>x.row.id.includes('-warm-'));
const warmGroups=[...new Set(warm.map(x=>`${x.row.tempC}/${x.row.fraction}`))].map(condition=>{
  const group=warm.filter(x=>`${x.row.tempC}/${x.row.fraction}`===condition);
  const commonTimeSeconds=Math.min(...group.map(x=>x.result.simTimeSeconds));
  return {condition,commonTimeSeconds,rows:group.map(x=>{const analysis=cavity.rows.find(y=>y.rowId===x.row.id).analysis;return {rowId:x.row.id,terminalTimeSeconds:x.result.simTimeSeconds,terminalAttached:x.result.attachedCount,terminalAspectRatio:x.result.aspectRatio,terminal:x.cavityTerminal,physicalTimeSelections:analysis.physicalTimeSelections.map(s=>({...s,geometry:analysis.frames.find(f=>f.cycle===s.atOrBefore.cycle)})),history:x.history??null};})};
});
const prefixChecks=warmGroups.map(group=>{
  const early=warm.find(x=>`${x.row.tempC}/${x.row.fraction}`===group.condition&&x.row.experimentalBasalWidthHistory),full=warm.find(x=>`${x.row.tempC}/${x.row.fraction}`===group.condition&&x.row.experimentalBasalWidthCells&&!x.row.experimentalBasalWidthHistory);
  const loadPrefix=x=>read(resolve(input,'rows',x.row.id,'events.jsonl'),true).filter((event,i,events)=>i===0||events[i-1].simTimeSeconds<20);
  const a=loadPrefix(early),b=loadPrefix(full), fields=['cycle','relaxation','boundary','surface','attached','attachmentFacets','attachmentEventD6h','attachedCount','extent','aspectRatio','symmetryError','simTimeSeconds','ledgers','basalWidthObservation'];
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):value;
  const value=(e,f)=>f==='basalWidthObservation'?Object.fromEntries(Object.entries(e[f]).filter(([k])=>k!=='historyActive')):e[f];
  let firstDifference=null;for(let i=0;i<Math.min(a.length,b.length)&&firstDifference===null;i++)for(const field of fields)if(JSON.stringify(canonical(value(a[i],field)))!==JSON.stringify(canonical(value(b[i],field)))){firstDifference={cycle:i+1,field};break;}
  return {condition:group.condition,earlyId:early.row.id,fullId:full.row.id,earlyCount:a.length,fullCount:b.length,bothReachCutoff:[a,b].every(x=>x.at(-1).simTimeSeconds>=20),recordedPrefixEqual:firstDifference===null&&a.length===b.length,firstDifference,fields,excluded:['identity labels','operational RSS/wall-clock','historyActive (absent in full control)'],scope:'Recorded observation prefix equality only, no unrecorded full-field or partial-fill equivalence claim.'};
});
const producer='d7ff3e1fb122ecbf8994539d3623928cbe5a9c6b';
const files=['runner/src/post-phase10-cavity-analysis.ts','runner/src/post-phase10-cavity-geometry.ts','runner/src/post-phase10-cavity-spatial.ts','core/src/libbrecht.ts','core/src/metrics.ts'];
const blobAudit=files.map(path=>({path,bldBlob:execFileSync('git',['rev-parse',`${producer}:${path}`],{encoding:'utf8'}).trim(),currentBlob:execFileSync('git',['rev-parse',`HEAD:${path}`],{encoding:'utf8'}).trim()}));
const report={scope:'Retrospective finite-model exploration; no new run, checkpoint adoption, physical validation or trajectory-equivalence claim.',inputRoot:input,producer,analysisHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,script:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},inputs,blobAudit,definitions:{coldCore:'Largest complete integer hex ball occupied in the central plane; ring r has 6r sites, ring0 has one. Tip is maximum central-plane hex radius. Gap=tip-core, normalized depth=gap/tip. This is a post-hoc readout of saved occupancy, not a pre-registered new gate; historical core/tip comparability is not presumed.',time:'At-or-before completed state and next-event bracket at common physical time, no interpolation. Terminal-size records have unequal physical ages. Matched-tip physical plateau age is half the shortest retained duration at that exact common tip; it is seconds since each row first reached that tip, not interface cycles.',warm:'Reuses unchanged cavity analyzer. Three-arm warm roster intentionally is not certified as its historical five-arm comparison. Per-row early history is supported; the separate explicit early/full prefix comparison uses the same finite scientific fields.'},coldGroups,warmGroups,prefixChecks,rows:rows.map(({states,spatialProfiles,...x})=>x)};
writeFileSync(resolve(output,'bld-analysis.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,coldGroups:coldGroups.length,warmGroups:warmGroups.length,outputs:['cavity-readout.json','bld-analysis.json']},null,2));
