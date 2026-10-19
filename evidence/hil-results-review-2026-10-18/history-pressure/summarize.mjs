import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='out/analysis-2026-10-18/history-pressure';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const input=path.resolve(base,'readout.json'),a=JSON.parse(fs.readFileSync(input));
const keys=['axialCells','lateralCartesianCells','attachedCount'];
const cflPairs=[];
for(const g of a.timestep)for(const old of g.rows.filter(r=>r.cflFill===0.05)){
 const next=g.rows.find(r=>r.cflFill===0.025&&r.preparation===old.preparation&&r.switchExtent===old.switchExtent);assert(next);
 cflPairs.push({old:old.id,next:next.id,commonSeconds:g.commonPostEventSeconds,windows:Object.fromEntries(['full','early','later'].map(w=>[w,Object.fromEntries(keys.map(k=>[k,{old:old[w].atOrBefore[k],next:next[w].atOrBefore[k],difference:next[w].atOrBefore[k]-old[w].atOrBefore[k],oldRange:old[w].endpointSensitivity[k],nextRange:next[w].endpointSensitivity[k]}]))]))});
}
const cflCensus=Object.fromEntries(keys.map(k=>[k,Object.fromEntries(['full','early','later'].map(w=>[w,{n:cflPairs.length,same:cflPairs.filter(p=>p.windows[w][k].difference===0).length,maxAbsDifference:cflPairs.reduce((x,p)=>Math.abs(p.windows[w][k].difference)>x.value?{value:Math.abs(p.windows[w][k].difference),old:p.old,next:p.next,oldValue:p.windows[w][k].old,nextValue:p.windows[w][k].next}:x,{value:0})}]))]));
const pressureStage=[];
for(const g of a.pressure)for(const prep of ['M1','M1_NO_DIP_ABLATION'])for(const p of [50662.5,101325,202650]){
 const early=g.rows.find(r=>r.preparation===prep&&r.pressurePa===p&&r.switchExtent===7),late=g.rows.find(r=>r.preparation===prep&&r.pressurePa===p&&r.switchExtent===15);
 if(!early||!late){pressureStage.push({group:g.name,prep,p,status:'missing-failed-row',missing:g.missing});continue;}
 pressureStage.push({group:g.name,prep,p,seconds:g.commonPostEventSeconds,earlyId:early.id,lateId:late.id,windows:Object.fromEntries(['full','early','later'].map(w=>[w,Object.fromEntries(keys.map(k=>[k,{early:early[w].atOrBefore[k],late:late[w].atOrBefore[k],lateMinusEarly:late[w].atOrBefore[k]-early[w].atOrBefore[k],min:late[w].endpointSensitivity[k].min-early[w].endpointSensitivity[k].max,max:late[w].endpointSensitivity[k].max-early[w].endpointSensitivity[k].min}]))]))});
}
const oldReadouts=['out/next-hil-design-2026-10-10/supplement-triage.json','out/hil-large-batch-design-2026-10-11/history-triage.json','out/hil-two-day-design-2026-10-12/history-options.json'];
const reused=oldReadouts.map(p=>{const b=fs.readFileSync(p),r=JSON.parse(b),identities=r.sources.map(s=>{const input=fs.readFileSync(s.path);assert.equal(input.length,s.bytes,s.path);assert.equal(sha(input),s.sha256,s.path);return {path:s.path,sha256:s.sha256};});return {path:path.resolve(p),sha256:sha(b),boundInputsRechecked:identities.length};});
const parityPaths=['core/src','solver-cpu/src','runner/src/post-phase10-discovery.ts','runner/src/discovery-resume-io.ts','runner/src/post-phase10-cavity-analysis.ts','runner/src/post-phase10-cavity-geometry.ts','runner/src/hil-bld-batch-summary.ts'];
const parityCommand=['diff','--name-only','7ea2582','0161a51','--',...parityPaths];const parity=execFileSync('git',parityCommand,{encoding:'utf8'});assert.equal(parity.trim(),'');
const m1Windows=a.timestep.map(g=>({group:g.name,seconds:g.commonPostEventSeconds,rows:g.rows.filter(r=>r.preparation==='M1').map(r=>({id:r.id,cfl:r.cflFill,switch:r.switchExtent,earlyAxialUm:r.early.atOrBefore.axialCells*r.dxUm,laterAxialUm:r.later.atOrBefore.axialCells*r.dxUm,laterLateralUm:r.later.atOrBefore.lateralCartesianCells*r.dxUm,laterOccupancy:r.later.atOrBefore.attachedCount,laterAxialBracketUm:{min:r.later.endpointSensitivity.axialCells.min*r.dxUm,max:r.later.endpointSensitivity.axialCells.max*r.dxUm}}))}));
const r={createdAt:new Date().toISOString(),input:{path:input,sha256:sha(fs.readFileSync(input))},reusedEarlierAnalyses:reused,sourceParity:{command:'git '+parityCommand.join(' '),changedPaths:[]},census:a.census,failed:a.failed,cflCensus,m1Windows,cflPairs,pressureStage,limits:a.method};
const dest=path.resolve(base,'summary.json');fs.writeFileSync(dest,JSON.stringify(r,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({dest,sha256:sha(fs.readFileSync(dest)),cflCensus,pressureStage:pressureStage.map(r=>({group:r.group,prep:r.prep,p:r.p,seconds:r.seconds,full:r.windows?.full.axialCells,later:r.windows?.later.axialCells,status:r.status}))},null,2));
