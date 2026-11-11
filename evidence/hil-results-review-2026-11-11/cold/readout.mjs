import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hexSeedSites,domainCenter,coordsOf} from '../../../core/src/index.ts';
import {summarizeFirstBatchRow} from '../../../runner/src/hil-bld-batch-summary.ts';

// Requested saved-data C1 analysis. No simulation or solver mutation.
// Same definitions as October21/24 cold recipes, with incremental ring accumulation
// and an explicit central-plane membership cross-check at every completed event.
const directory=dirname(fileURLToPath(import.meta.url)),inputs=[],rows=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=(p,lines=false)=>{const b=readFileSync(p);inputs.push({path:resolve(p),bytes:b.length,sha256:hash(b)});return lines?b.toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse):JSON.parse(b);};
const arms=['neither','basal-only','prism-only','both'];
const sources=[
 {representation:'coarse',root:process.argv[3]??'out/hil-retired-2026-10-21/hil-large-batch-oct11/out/hil-large-batch-oct11',prefix:'oct11-hil-cold-step-t14p4-f0p1-cfl0p025-',producer:'5a00e901874ae5fdf2ae24a2d889b692734e75da',dimsN:64,dxUm:.35,seedRadius:2,seedThickness:1,targetExtent:29,maxSteps:20000},
 ...[1,3].map(h=>({representation:h===1?'fine-thin':'fine-thick',root:process.argv[4]??'C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake/out/hil-growth-dynamics-oct21',prefix:`gd21-hil-c1-h${h}-`,producer:'2f2d605f0ed8fdb8d78cdea02a58102a7001cb53',dimsN:126,dxUm:.175,seedRadius:4,seedThickness:h,targetExtent:57,maxSteps:100000}))
];
const radius=(x,y)=>Math.max(Math.abs(x),Math.abs(y),Math.abs(x+y));
for(const source of sources)for(const arm of arms){
 const id=source.prefix+arm,base=resolve(source.root,'rows',id),spec=read(resolve(base,'spec.json')),r=spec.row,result=read(resolve(base,'result.json'));
 const events=read(resolve(base,'events.jsonl'),true);read(resolve(base,'exit.json'));
 assert.equal(r.id,id);assert.equal(result.gitHead,source.producer);assert.equal(result.node,'v24.13.1');
 for(const [k,v] of Object.entries({tempC:-14.4,fraction:.1,cflFill:.025,pressurePa:101325,paramSet:'M1',experimentalFacetDips:arm,...Object.fromEntries(['dimsN','dxUm','seedRadius','seedThickness','targetExtent','maxSteps'].map(k=>[k,source[k]]))}))assert.equal(r[k],v,`${id} ${k}`);
 assert.equal(r.timelineEvent,undefined);if(rows.length)assert.deepEqual(spec.fixed,rows[0].spec.fixed);
 const checked=summarizeFirstBatchRow(base);assert.equal(checked.disposition,'size-endpoint');assert.deepEqual(checked.errors,[]);
 const dims={nx:r.dimsN,ny:r.dimsN,nz:r.dimsN},center=domainCenter(dims),occupied=new Set(),plane=new Set(),rings=new Map();
 const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];let tip=0;
 function add(index){assert(!occupied.has(index));occupied.add(index);const c=coordsOf(dims,index);c.forEach((v,a)=>{low[a]=Math.min(low[a],v);high[a]=Math.max(high[a],v);});if(c[2]===center[2]){const x=c[0]-center[0],y=c[1]-center[1],d=radius(x,y);plane.add(`${x},${y}`);rings.set(d,(rings.get(d)??0)+1);tip=Math.max(tip,d);}}
 function state(cycle,time){
  let core=-1;for(let d=0;d<=tip;d++){if((rings.get(d)??0)!==(d===0?1:6*d))break;core=d;}
  let missing=Infinity;for(let x=-tip;x<=tip;x++)for(let y=-tip;y<=tip;y++){const d=radius(x,y);if(d<=tip&&!plane.has(`${x},${y}`))missing=Math.min(missing,d);}
  assert.equal(core,missing===Infinity?tip:missing-1,`${id} membership check`);
  const counts=Array.from({length:tip+1},(_,d)=>({radius:d,radiusUm:d*r.dxUm,occupied:rings.get(d)??0,possible:d===0?1:6*d}));assert.equal(counts.reduce((n,x)=>n+x.occupied,0),plane.size);
  return {cycle,simTimeSeconds:time,extent:Math.max(...high.map((v,a)=>v-low[a]+1)),attachedCount:occupied.size,centralPlaneAttached:plane.size,core,tip,gap:tip-core,coreUm:core*r.dxUm,tipUm:tip*r.dxUm,gapUm:(tip-core)*r.dxUm,centralPlaneRingCounts:counts};
 }
 hexSeedSites(dims,r.seedRadius,r.seedThickness).forEach(add);assert.equal(occupied.size,result.seedSites);const states=[state(0,0)];
 for(const event of events){assert.equal(event.rowId,id);assert.equal(event.cycle,states.length);assert(event.simTimeSeconds>states.at(-1).simTimeSeconds);assert.equal(event.experimentalFacetDips,arm);for(const c of event.attached){assert.deepEqual(coordsOf(dims,c.index),c.coords);add(c.index);}const s=state(event.cycle,event.simTimeSeconds);assert.equal(s.extent,event.extent);assert.equal(s.attachedCount,event.attachedCount);states.push(s);}
 for(const k of ['attachedCount','extent','simTimeSeconds'])assert.equal(states.at(-1)[k],result[k]);assert.equal(events.length,result.cycles);
 rows.push({id,representation:source.representation,arm,spec,producer:result.gitHead,node:result.node,checked,states});console.log(`reconstructed ${id} ${events.length}`);
}
assert.equal(rows.length,12);
const fields=['core','tip','gap','coreUm','tipUm','gapUm','attachedCount','centralPlaneAttached'];
function bracket(row,time){const states=row.states;assert(time>=0&&time<=states.at(-1).simTimeSeconds,`${row.id} uncovered age`);let index=0;while(index+1<states.length&&states[index+1].simTimeSeconds<=time)index++;return{requestedTimeSeconds:time,exactEventTime:states[index].simTimeSeconds===time,atOrBefore:states[index],next:states[index+1]??null};}
const choices=b=>b.next===null?[b.atOrBefore]:[b.atOrBefore,b.next];
function sample(row,time){const b=bracket(row,time),s=choices(b);return{id:row.id,representation:row.representation,arm:row.arm,...b,adjacentEventRange:Object.fromEntries(fields.map(k=>[k,{min:Math.min(...s.map(x=>x[k])),max:Math.max(...s.map(x=>x[k]))}]))};}
function window(row,start,end){const a=bracket(row,start),b=bracket(row,end),delta=(x,y)=>Object.fromEntries(fields.map(k=>[k,y[k]-x[k]])),ds=choices(a).flatMap(x=>choices(b).filter(y=>y.cycle>=x.cycle).map(y=>delta(x,y)));return{id:row.id,representation:row.representation,arm:row.arm,start:a,end:b,atOrBeforeDelta:delta(a.atOrBefore,b.atOrBefore),adjacentEventDeltaRange:Object.fromEntries(fields.map(k=>[k,{min:Math.min(...ds.map(d=>d[k])),max:Math.max(...ds.map(d=>d[k]))}]))};}
const contrast=(a,b)=>Object.fromEntries(fields.map(k=>[k,{aMinusB:a.atOrBefore[k]-b.atOrBefore[k],min:a.adjacentEventRange[k].min-b.adjacentEventRange[k].max,max:a.adjacentEventRange[k].max-b.adjacentEventRange[k].min}]));
function contrasts(selection){return [...new Set(selection.rows.map(r=>r.representation))].map(representation=>{const find=arm=>selection.rows.find(r=>r.representation===representation&&r.arm===arm);return{representation,prismOnlyMinusNeither:contrast(find('prism-only'),find('neither')),bothMinusBasalOnly:contrast(find('both'),find('basal-only')),basalOnlyMinusNeither:contrast(find('basal-only'),find('neither'))};});}
function cohort(name,selected){
 const stages=[8,9].map(coarseTip=>{
  const plateaus=selected.map(row=>{const tip=coarseTip*(row.representation==='coarse'?1:2),index=row.states.findIndex(s=>s.tip===tip),entry=index<0?null:row.states[index],exit=entry===null?null:row.states.slice(index+1).find(s=>s.tip>tip)??null,durationSeconds=entry!==null&&exit!==null?exit.simTimeSeconds-entry.simTimeSeconds:null;return{id:row.id,representation:row.representation,arm:row.arm,tip,entry,exit,durationSeconds,available:entry!==null&&exit!==null&&durationSeconds>0};});
  if(!plateaus.every(p=>p.available))return{coarseTip,available:false,plateaus,reason:'Full cohort lacks observed entry/exit of at least one first exact-tip plateau. No reduced cohort or terminal-time substitute.'};
  const Dtip=Math.min(...plateaus.map(p=>p.durationSeconds));return{coarseTip,tipRadiusUm:coarseTip*.35,available:true,DtipSeconds:Dtip,plateaus,shortestWitnessRowIds:plateaus.filter(p=>p.durationSeconds===Dtip).map(p=>p.id),selections:[0,.25,.5,.75].map(fraction=>{const s={fractionOfDtip:fraction,elapsedSeconds:fraction*Dtip,rows:selected.map(row=>sample(row,plateaus.find(p=>p.id===row.id).entry.simTimeSeconds+fraction*Dtip))};return{...s,contrasts:contrasts(s)};})};
 });
 const Tcommon=Math.min(...selected.map(r=>r.states.at(-1).simTimeSeconds));
 const absoluteAgeSelections=[0,.25,.5,.75,1].map(fraction=>{const s={fractionOfTcommon:fraction,requestedTimeSeconds:fraction*Tcommon,rows:selected.map(r=>sample(r,fraction*Tcommon))};return{...s,contrasts:contrasts(s)};});
 const definitions={full:[0,1],firstHalf:[0,.5],secondHalf:[.5,1],quarter1:[0,.25],quarter2:[.25,.5],quarter3:[.5,.75],quarter4:[.75,1]};
 const absoluteAgeWindows=Object.fromEntries(Object.entries(definitions).map(([name,[a,b]])=>[name,{startSeconds:a*Tcommon,endSeconds:b*Tcommon,rows:selected.map(r=>window(r,a*Tcommon,b*Tcommon))}]));
 return{name,rowIds:selected.map(r=>r.id),TcommonSeconds:Tcommon,commonAgeWitnessRowIds:selected.filter(r=>r.states.at(-1).simTimeSeconds===Tcommon).map(r=>r.id),stages,absoluteAgeSelections,absoluteAgeWindows};
}
const cohorts=[cohort('coarse-plus-fine-thin',rows.filter(r=>r.representation!=='fine-thick')),cohort('coarse-plus-fine-thick',rows.filter(r=>r.representation!=='fine-thin')),cohort('cross-thickness-union',rows)];
const report={createdAt:new Date().toISOString(),scope:'Frozen C1 representation comparisons, internal model development only.',command:process.argv,script:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},reusedDefinitions:{path:'out/bld-results-review-2026-10-24/cold/readout.mjs',sha256:'45a87e7c5f830f9ff412407c5163d42f43543cb1dba6d40b9a199c36e98dba47',changes:'C1 exact selectors; separate 8/8 and 12-member cohorts; physical tip scaling; same ring/membership definitions maintained incrementally. No numerical law changes.'},definitions:{core:'Largest fully occupied central-plane hex ball; independently checked by explicit missing-site membership at every event. tip largest occupied radius, gap=tip-core.',distance:'Lattice-radius cell count times each row dxUm; ring counts are occupancy, not physical mass.',plateau:'First exact-tip plateau with observed exit. Minimum positive duration over complete named cohort, sampled from each own entry at 0,.25,.5,.75 Dtip. Different absolute ages and radial increments.',brackets:'At-or-before and next event including exact-event-time alternatives; sensitivity bounds not statistical uncertainty. No interpolation.',commonAge:'Minimum terminal physical age over named cohort; quarter/half increments use that shared clock.'},inputs,census:{rows:rows.length,checkedSizeEndpoints:rows.length,reconstructedUpdates:rows.reduce((n,r)=>n+r.states.length-1,0)},rows:rows.map(({states,...r})=>({...r,initial:states[0],terminal:states.at(-1)})),cohorts};
const output=resolve(process.argv[2]??'out/hil-results-review-2026-11-11/cold/readout-reproduced.json');mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report)+'\n',{flag:'wx'});
console.log(JSON.stringify({census:report.census,cohorts:cohorts.map(c=>({name:c.name,Tcommon:c.TcommonSeconds,stages:c.stages.map(s=>({tip:s.coarseTip,available:s.available,Dtip:s.DtipSeconds,gaps:s.selections?.map(a=>({fraction:a.fractionOfDtip,gapUm:a.rows.map(r=>r.atOrBefore.gapUm),nextGapUm:a.rows.map(r=>r.next?.gapUm)}))}))}))},null,2));
