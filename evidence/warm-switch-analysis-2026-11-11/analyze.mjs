import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hexSeedSites,coordsOf,domainCenter} from '../../core/src/index.ts';
import {measureCavityGeometry} from '../../runner/src/post-phase10-cavity-geometry.ts';
import {summarizeFirstBatchRow} from '../../runner/src/hil-bld-batch-summary.ts';
const root=resolve(process.argv[2]??'out/restores/bld-growth-dynamics-hil-20261024T2048/extracted/bld-growth-dynamics-oct21/rows');
const out=resolve(process.argv[3]??'out/warm-switch-analysis-2026-11-11');mkdirSync(out,{recursive:true});
const inputs=[];const hash=b=>createHash('sha256').update(b).digest('hex');
const read=(p,lines=false)=>{const b=readFileSync(p);inputs.push({path:p,bytes:b.length,sha256:hash(b)});return lines?b.toString().trim().split(/\r?\n/).map(JSON.parse):JSON.parse(b);};
const ids=['4p5','5'].flatMap(t=>[`gd21-bld-w1-t${t}-c025-early1-w3`,`gd21-bld-w1-t${t}-c025-early5-w3`,`gd21-bld-w2-t${t}-w4-early5`]);
const raw=new Map();
const rows=ids.map(id=>{
 const dir=resolve(root,id),spec=read(resolve(dir,'spec.json')),result=read(resolve(dir,'result.json')),events=read(resolve(dir,'events.jsonl'),true),row=spec.row;
 assert.equal(summarizeFirstBatchRow(dir).disposition,'size-endpoint');assert.equal(result.gitHead,'d7f76cb84fdd6ba7ea0cf8f0d53708e74b09c365');
 assert.equal(events.length,result.cycles);assert.equal(row.cflFill,.025);assert.equal(row.experimentalBasalWidthHistory.mode,'early-only');
 const dims={nx:row.dimsN,ny:row.dimsN,nz:row.dimsN},center=domainCenter(dims),seed=hexSeedSites(dims,row.seedRadius,row.seedThickness),occupied=new Set(seed);
 const firstInactive=events.findIndex(e=>!e.basalWidthObservation.historyActive);assert(firstInactive>0);const switchCycle=events[firstInactive].basalWidthObservation.completedCyclesBeforeUpdate;assert.equal(switchCycle,firstInactive);
 const firstAttached=events.find(e=>e.attached.length>0);
 const keep=new Map();
 function geometry(cycle){const g=measureCavityGeometry(occupied,dims,row.dxUm);const axis=[...occupied].map(i=>coordsOf(dims,i)).filter(c=>c[0]===center[0]&&c[1]===center[1]).map(c=>c[2]-center[2]).sort((a,b)=>a-b);let depth=0;const openings=[];for(const l of g.layers){if(l.lateralVoid!=='enclosed')continue;if(l.directAxialOpening.lower){depth=Math.max(depth,(l.k-g.spans.k.min)*row.dxUm);openings.push({offset:l.offset,side:'lower'});}if(l.directAxialOpening.upper){depth=Math.max(depth,(g.spans.k.max-l.k)*row.dxUm);openings.push({offset:l.offset,side:'upper'});}}
 return{cycle,simTimeSeconds:cycle===0?0:events[cycle-1].simTimeSeconds,attachedCount:g.attachedCount,axisOffsets:axis,axialSpanUm:g.spans.k.centerSpanUm,lateralSpanUm:Math.max(g.spans.i.centerSpanUm,g.spans.j.centerSpanUm),waist:g.waist,layers:g.layers.map(l=>({offset:l.offset,count:l.attachedCount,lateralVoid:l.lateralVoid,directAxialOpening:l.directAxialOpening})),maxOpeningDepthUm:depth,openingLayers:openings};}
 const commonAge=5.05,commonBefore=events.filter(e=>e.simTimeSeconds<=commonAge).at(-1).cycle,commonNext=commonBefore+1;
 const capture=new Set([commonBefore,commonNext,0,switchCycle-1,switchCycle,switchCycle+1,...result.spatialSnapshots.map(s=>s.completedCycles)]);keep.set(0,geometry(0));let switchOccupied;
 for(const e of events){for(const a of e.attached){assert.deepEqual(coordsOf(dims,a.index),a.coords);assert(!occupied.has(a.index));occupied.add(a.index);}assert.equal(occupied.size,e.attachedCount);if(capture.has(e.cycle))keep.set(e.cycle,geometry(e.cycle));if(e.cycle===switchCycle)switchOccupied=new Set(occupied);}
 const pickedEvents=[firstInactive-2,firstInactive-1,firstInactive,firstInactive+1].map(i=>events[i]).map(e=>({cycle:e.cycle,startsAt:e.basalWidthObservation.simTimeSecondsBeforeUpdate,endsAt:e.simTimeSeconds,boundary:e.boundary,basalWidthObservation:e.basalWidthObservation,surface:e.surface,attached:e.attached,attachmentFacets:e.attachmentFacets,ledgers:e.ledgers}));
 const snapshots=result.spatialSnapshots.map(rec=>{
  const s=read(resolve(dir,rec.path));assert.equal(s.record.completedCycles,rec.completedCycles);const basal=s.cells.filter(c=>c.facet==='basal');const axis=s.cells.filter(c=>c.coords[0]===center[0]&&c.coords[1]===center[1]);
  const values=(cs,k)=>cs.length?{count:cs.length,min:Math.min(...cs.map(c=>c[k])),max:Math.max(...cs.map(c=>c[k])),mean:cs.reduce((n,c)=>n+c[k],0)/cs.length}:null;
  const groups=Object.fromEntries(['basal','prism','rough','inhibited'].map(f=>{const cs=s.cells.filter(c=>c.facet===f);return[f,Object.fromEntries(['fill','sigmaOpp','sigmaBoundary','alphaHKBoundary'].map(k=>[k,values(cs,k)]))];}));
  return{path:resolve(dir,rec.path),record:rec,timing:s.timing,geometry:keep.get(rec.completedCycles),axisBoundary:axis.map(c=>({...c,offset:c.coords[2]-center[2]})),basalLayers:[...new Set(basal.map(c=>c.coords[2]-center[2]))].sort((a,b)=>a-b).map(z=>({offset:z,...Object.fromEntries(['fill','sigmaOpp','sigmaBoundary','alphaHKBoundary'].map(k=>[k,values(basal.filter(c=>c.coords[2]-center[2]===z),k)]))})),groups};
 });
 const sum=(es,key)=>es.reduce((n,e)=>n+e.basalWidthObservation[key],0);
 raw.set(id,{events,switchOccupied,center});
 return{id,row,producer:result.gitHead,node:result.node,switchCycle,actualSwitchSeconds:events[firstInactive].basalWidthObservation.simTimeSecondsBeforeUpdate,firstAttachment:firstAttached?{cycle:firstAttached.cycle,time:firstAttached.simTimeSeconds,count:firstAttached.attached.length}:null,selectedDemandBeforeSwitchFill:sum(events.slice(0,firstInactive),'selectedKineticDemandFill'),selectedDemandAfterSwitchFill:sum(events.slice(firstInactive),'selectedKineticDemandFill'),switchStates:[switchCycle-1,switchCycle,switchCycle+1].map(c=>keep.get(c)),sharedAgeObservation:{requestedSeconds:commonAge,atOrBefore:keep.get(commonBefore),nextEvent:keep.get(commonNext)},switchEvents:pickedEvents,snapshots};
});
const pairs=['4p5','5'].map(t=>{
 const aId=`gd21-bld-w1-t${t}-c025-early5-w3`,bId=`gd21-bld-w2-t${t}-w4-early5`,a=raw.get(aId),b=raw.get(bId),coords=index=>coordsOf({nx:64,ny:64,nz:64},index).map((v,i)=>v-a.center[i]);
 return{temperatureTag:t,width3:aId,width4:bId,scope:'Each own actual switch, not identical absolute times or fields.',width3OnlyCoordinates:[...a.switchOccupied].filter(i=>!b.switchOccupied.has(i)).map(coords),width4OnlyCoordinates:[...b.switchOccupied].filter(i=>!a.switchOccupied.has(i)).map(coords),width4CentralPatchAttachmentEvents:b.events.map(e=>({cycle:e.cycle,simTimeSeconds:e.simTimeSeconds,coordinates:e.attached.map(c=>coords(c.index)).filter(c=>Math.abs(c[2])===1&&Math.max(Math.abs(c[0]),Math.abs(c[1]),Math.abs(c[0]+c[1]))<=1)})).filter(e=>e.coordinates.length>0)};
});
const report={scope:'Post-hoc saved-data mechanism triage, not a new causal intervention or matched-field comparison.',recipe:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},definitions:{switch:'Completed boundary before first update starting at/after cutoff. Whole crossing update retains the earlier mode.',eventDiagnostics:'Boundary/facet/width diagnostics are after relaxation before surface advance; event attached list and geometry are after surface advance. Do not conflate these times.',snapshot:'Boundary-only spatial samples at recorded ages, not full fields; different row snapshot times are not a shared-age comparison.',selectedDemand:'Recorded kinetic fill demand, not deposited mass or physical uptake.',comparison:'Own-switch geometry and diagnostic associations; no attribution to geometry alone. Different actual switch times and states are explicit.'},rows,pairs,inputs};
writeFileSync(resolve(out,'readout.json'),JSON.stringify(report,null,2)+'\n');writeFileSync(resolve(out,'inputs.json'),JSON.stringify({inputs},null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({id:r.id,time:r.actualSwitchSeconds,switchCycle:r.switchCycle,firstAttachment:r.firstAttachment,demand:r.selectedDemandBeforeSwitchFill,geometry:r.switchStates[1]})),null,2));
console.log(JSON.stringify(pairs,null,2));
