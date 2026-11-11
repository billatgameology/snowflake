import fs from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [sourceRoot,originalRoot,outputRoot,id,cycleText]=process.argv.slice(2),C=Number(cycleText);
const hash=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const load=async p=>import(pathToFileURL(resolve(sourceRoot,p)).href);
const {runPostPhase10DiscoveryRow}=await load('runner/src/post-phase10-discovery.ts');
const {decodeDiscoveryResumeCheckpoint}=await load('core/src/index.ts');
const {LKSolver}=await load('solver-cpu/src/index.ts');
assert.equal(process.version,'v24.13.1'); assert.equal(process.versions.v8,'13.6.233.17-node.40');
const parity=['diff','--name-only','d7f76cb','HEAD','--','core/src','solver-cpu/src','runner/src/post-phase10-discovery.ts','runner/src/discovery-resume-io.ts'];
assert.equal(execFileSync('git',parity,{cwd:sourceRoot,encoding:'utf8'}).trim(),'');
const original=resolve(originalRoot,id),out=resolve(outputRoot,id),spec=json(resolve(original,'spec.json'));
const originalBytes=fs.readFileSync(resolve(original,'events.jsonl')),events=originalBytes.toString().trim().split(/\r?\n/).map(JSON.parse);
assert.equal(events[C-1].basalWidthObservation.historyActive,true);assert.equal(events[C].basalWidthObservation.historyActive,false);
const result=runPostPhase10DiscoveryRow(spec.row,out,{checkpoint:'create',pauseAfterCycles:C+1,heartbeat:console.log});
assert.equal(result.stopReason,'checkpoint-pause');assert.deepEqual(result.integrityErrors,[]);assert(result.allRelaxationsConverged&&result.allAttachmentEventsD6h);
const replayBytes=fs.readFileSync(resolve(out,'events.jsonl')),replay=replayBytes.toString().trim().split(/\r?\n/).map(JSON.parse);
const scientific=e=>{const {rssBytes,...s}=e;return s;};assert.equal(replay.length,C+1);assert.deepEqual(replay.map(scientific),events.slice(0,C+1).map(scientific));
const snapshots=[];for(const s of result.spatialSnapshots){const a=fs.readFileSync(resolve(out,s.path)),b=fs.readFileSync(resolve(original,s.path));assert(a.equals(b));snapshots.push({path:s.path,bytes:a.length,sha256:hash(a)});}
const pointer=json(resolve(out,'resume/latest.json')),states=[];
for(const [phase,ref,tick] of [['switch-boundary',pointer.previous,C],['first-inactive-update-complete',pointer.current,C+1]]){
 const dir=resolve(out,'resume',ref.directory),mb=fs.readFileSync(resolve(dir,'manifest.json'));assert.equal(hash(mb),ref.manifestSha256);const m=JSON.parse(mb),sb=fs.readFileSync(resolve(dir,'solver.bin'));assert.equal(hash(sb),m.solver.sha256);assert.equal(sb.length,m.solver.bytes);assert.equal(hash(replayBytes.subarray(0,m.eventPrefix.bytes)),m.eventPrefix.sha256);
 const decoded=decodeDiscoveryResumeCheckpoint(sb);assert.equal(decoded.tick,tick);const solver=LKSolver.restoreDiscovery(decoded);assert.equal(solver.tick,tick);
 const arrays=Object.fromEntries(['a','f','sigma'].map(k=>{const a=solver[k],b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);return[k,{elements:a.length,bytes:b.length,sha256:hash(b)}];}));
 states.push({phase,tick,simTimeSeconds:solver.simTimeSeconds,solverFile:resolve(dir,'solver.bin'),solverBytes:sb.length,solverSha256:hash(sb),manifestSha256:hash(mb),arrays});
}
fs.writeFileSync(resolve(out,'recovery-verification.json'),JSON.stringify({scope:'Fresh HIL replay; exact scientific event prefix matches BLD except operational RSS. Original full switch state absent, so no independent original full-state equality claim.',rowId:id,sourceRoot,producer:result.gitHead,originalProducer:json(resolve(original,'result.json')).gitHead,node:process.version,v8:process.versions.v8,command:process.argv,sourceParityCommand:['git',...parity],eventsMatched:replay.length,originalEvents:{path:resolve(original,'events.jsonl'),bytes:originalBytes.length,sha256:hash(originalBytes)},snapshots,states,stopReason:result.stopReason},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id,eventsMatched:replay.length,states:states.map(s=>({phase:s.phase,tick:s.tick})),stopReason:result.stopReason}));
