import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexSeedSites, domainCenter, coordsOf, neighborIndices } from '../../../core/src/index.ts';

// Bounded post-hoc saved-observation analysis; no solver construction or launch.
const input = resolve(process.env.BLD_REVIEW_INPUT ?? 'C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable');
const output = resolve(process.env.COLD_FOLLOWUP_OUTPUT ?? dirname(fileURLToPath(import.meta.url)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = [];
const arms = ['neither', 'basal-only', 'prism-only', 'both'];
function read(relative, lines = false) {
  const bytes = readFileSync(resolve(input, relative));
  inputs.push({ path: relative.replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) });
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
  const compact=s=>s?Object.fromEntries(Object.entries(s).filter(([k])=>k!=='centralPlaneRingCounts')):null;
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
const rows=[];
for(const tag of ['14p4','18'])for(const arm of arms){
  const id=`batch1-bld-cold-t${tag}-f0p1-${arm}`,dir=`rows/${id}`;
  const spec=read(`${dir}/spec.json`),result=read(`${dir}/result.json`),events=read(`${dir}/events.jsonl`,true),row=spec.row;
  requireThat(row.id===id&&row.experimentalFacetDips===arm,'row identity');
  const dims={nx:row.dimsN,ny:row.dimsN,nz:row.dimsN},center=domainCenter(dims),occupied=new Set(hexSeedSites(dims,row.seedRadius,row.seedThickness));
  const snapshots=result.spatialSnapshots.map(record=>({record,snapshot:read(`${dir}/${record.path}`)}));
  let state=stateMeasure(occupied,dims,center,{cycle:0,simTimeSeconds:0,extent:5});
  const states=[state],profiles=[],preUpdatePrismCounts=[];
  function capture(){for(const {record,snapshot} of snapshots.filter(x=>x.record.completedCycles===state.cycle)){
    requireThat(snapshot.rowId===id&&snapshot.experimentalFacetDips===arm,'snapshot identity');
    requireThat(JSON.stringify(snapshot.record)===JSON.stringify(record),'snapshot result binding');
    profiles.push(spatial(snapshot,occupied,dims,center,state));
  }}
  capture();
  for(const event of events){
    requireThat(event.cycle===state.cycle+1&&event.simTimeSeconds>state.simTimeSeconds,'event sequence');
    const boundary=new Set();
    for(const index of occupied)for(const n of neighborIndices(dims,...coordsOf(dims,index)))if(n>=0&&!occupied.has(n))boundary.add(n);
    let prismCount=0;
    for(const index of boundary){
      const ns=[...neighborIndices(dims,...coordsOf(dims,index))];
      if(ns.slice(0,6).filter(n=>occupied.has(n)).length===2&&!ns.slice(6).some(n=>occupied.has(n)))prismCount++;
    }
    requireThat(boundary.size===event.boundary.count&&prismCount===event.boundary.facets.prism.count,'event pre-update boundary/prism census');
    preUpdatePrismCounts.push({cycle:event.cycle,startTimeSeconds:state.simTimeSeconds,endTimeSeconds:event.simTimeSeconds,count:prismCount});
    for(const cell of event.attached){requireThat(!occupied.has(cell.index),'duplicate attachment');occupied.add(cell.index);}
    requireThat(occupied.size===event.attachedCount,'event count');
    state=stateMeasure(occupied,dims,center,{cycle:event.cycle,simTimeSeconds:event.simTimeSeconds,extent:event.extent}); states.push(state); capture();
  }
  requireThat(state.attachedCount===result.attachedCount&&state.cycle===result.cycles&&state.simTimeSeconds===result.simTimeSeconds,'terminal binding');
  requireThat(profiles.length===snapshots.length,'snapshot coverage');
  rows.push({id,arm,tempC:row.tempC,fraction:row.fraction,dxUm:row.dxUm,producer:result.gitHead,node:result.node,states,snapshots:profiles,preUpdatePrismCensus:{updates:preUpdatePrismCounts.length,updatesWithPrism:preUpdatePrismCounts.filter(x=>x.count>0).length,maxPrismCount:Math.max(...preUpdatePrismCounts.map(x=>x.count)),secondsWithPrism:preUpdatePrismCounts.filter(x=>x.count>0).reduce((sum,x)=>sum+x.endTimeSeconds-x.startTimeSeconds,0),records:preUpdatePrismCounts}});
}
const groups=[-14.4,-18].map(tempC=>{
  const group=rows.filter(x=>x.tempC===tempC),commonTimeSeconds=Math.min(...group.map(x=>x.states.at(-1).simTimeSeconds));
  const maximumCommonTip=Math.min(...group.map(x=>x.states.at(-1).tip));
  const stages=[];
  for(let tip=3;tip<=maximumCommonTip;tip++){
    const plateaus=group.map(row=>{const entry=row.states.find(x=>x.tip===tip),exit=row.states.find(x=>x.tip>tip)??row.states.at(-1);return{rowId:row.id,arm:row.arm,entry,exit,durationSeconds:entry?exit.simTimeSeconds-entry.simTimeSeconds:0};});
    const duration=Math.min(...plateaus.map(x=>x.durationSeconds)); if(duration<=0)continue;
    stages.push({tip,shortestPlateauSeconds:duration,plateaus:plateaus.map(({entry,exit,...p})=>({...p,entry:bracket(group.find(x=>x.id===p.rowId).states,entry.simTimeSeconds).atOrBefore,exit:bracket(group.find(x=>x.id===p.rowId).states,exit.simTimeSeconds).atOrBefore})),selections:[0,.25,.5,.75].map(f=>({fractionOfShortestPlateau:f,elapsedSeconds:f*duration,rows:group.map(row=>({arm:row.arm,...bracket(row.states,plateaus.find(x=>x.rowId===row.id).entry.simTimeSeconds+f*duration)}))}))});
  }
  const timeEdges=[...new Set([0,commonTimeSeconds,...group.flatMap(x=>x.states.filter(s=>s.simTimeSeconds<commonTimeSeconds).map(s=>s.simTimeSeconds))])].sort((a,b)=>a-b);
  const gapPatterns=new Map();
  for(let i=0;i<timeEdges.length-1;i++){
    const gaps=group.map(row=>bracket(row.states,timeEdges[i]).atOrBefore.gap),key=gaps.join('/'),duration=timeEdges[i+1]-timeEdges[i];
    const p=gapPatterns.get(key)??{gaps,seconds:0,firstStartSeconds:timeEdges[i],lastEndSeconds:timeEdges[i+1]};p.seconds+=duration;p.lastEndSeconds=timeEdges[i+1];gapPatterns.set(key,p);
  }
  const compactPatterns=[...gapPatterns.values()].map(x=>({...x,fractionOfCommonAge:x.seconds/commonTimeSeconds}));
  requireThat(Math.abs(compactPatterns.reduce((sum,x)=>sum+x.seconds,0)-commonTimeSeconds)<1e-10,'time interval coverage');
  const initialPrismComparisons=[['prism-only','neither'],['both','basal-only']].map(([treated,control])=>{
    const a=group.find(x=>x.arm===treated).snapshots[0],b=group.find(x=>x.arm===control).snapshots[0];
    requireThat(a.record.completedCycles===0&&b.record.completedCycles===0&&a.state.attachedCount===19&&b.state.attachedCount===19,'initial comparison seed');
    return{treated,control,treatedMeanSigmaBoundary:a.prism.sigmaBoundary.mean,controlMeanSigmaBoundary:b.prism.sigmaBoundary.mean,treatedMeanAlphaHKSigmaBoundary:a.prism.alphaHKSigmaBoundary.mean,controlMeanAlphaHKSigmaBoundary:b.prism.alphaHKSigmaBoundary.mean,demandFactorRatio:a.prism.alphaHKSigmaBoundary.mean/b.prism.alphaHKSigmaBoundary.mean};
  });
  return {tempC,fraction:.1,armOrder:arms,commonTimeSeconds,stages,initialPrismComparisons,commonAbsoluteAgeSelections:[.25,.5,.75,1].map(f=>({fractionOfCommonAge:f,rows:group.map(row=>({arm:row.arm,...bracket(row.states,f*commonTimeSeconds)}))})),commonAbsoluteAgeGapDurations:compactPatterns};
});
const report={scope:'Post-hoc exploratory discrete-model readout of eight saved BLD rows; no simulation, physical validation, grid-independence, or new kinetic-law claim.',inputRoot:input,node:process.version,script:{path:'evidence/hil-bld-joint-review-2026-10-08/followup/cold.mjs',sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},inputs,definitions:{core:'Largest completely occupied integer hex ball on the central plane, checked both by ring counts and explicit site membership. Tip is maximum occupied central-plane hex radius; gap=tip-core, all in cells, not exact Euclidean radii.',plateau:'Every common exact-tip stage after seeded radius2 with positive retained duration. Sample seconds since each row first reached that exact tip, using fractions of the shortest retained plateau; retain at-or-before and next-event bracket. Different absolute ages.',absoluteAge:'At-or-before piecewise-constant saved occupancy at common physical times. Duration census sums all intervals in [0,shortest terminal age). It does not interpolate attachment events or establish continuum-time kinetics.',spatial:'Snapshots after converged relaxation before the next surface update, matched to occupancy after completedCycles. Extent-triggered snapshots across rows usually have different physical ages and geometry. Prism is saved [20] class independently checked from neighbors. Means of cellwise alphaHKBoundary*sigmaBoundary are dimensionless demand factors, not deposited growth/mass. Central-plane radial bins are hex-coordinate rings, not connected facets or width.',checks:'Every event count/uniqueness, pre-update boundary/prism census, and final count/time checked. Central-plane ring counts independently checked by explicit hex-ball membership. Every snapshot boundary index and neighbor count reconstructed; every prism membership checked; radial and temporal censuses reconcile. No simulation rerun or physical-mechanism identification.'},groups,rows:rows.map(({states,...row})=>({...row,states:states.map(({centralPlaneRingCounts,...state})=>state)}))};
mkdirSync(output,{recursive:true});writeFileSync(resolve(output,'cold.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,snapshots:rows.reduce((n,x)=>n+x.snapshots.length,0),groups:groups.map(g=>({tempC:g.tempC,commonTimeSeconds:g.commonTimeSeconds,stages:g.stages.map(s=>({tip:s.tip,halfGaps:s.selections[2].rows.map(x=>x.atOrBefore.gap)}))})),output:resolve(output,'cold.json')},null,2));
