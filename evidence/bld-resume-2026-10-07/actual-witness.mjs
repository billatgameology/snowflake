import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { firstBatchRows } from "../../runner/src/hil-bld-batch-roster.ts";
import { runResumableDiscoveryRow } from "../../runner/src/post-phase10-discovery-resume.ts";
const root=resolve("out/bld-resume-verification/actual-witness");
const row={...firstBatchRows("BLD").find(e=>e.row.id==="batch1-bld-warm-t5-early").row,id:"bld-n64-early-recovery-witness",maxSteps:3};
const sha=b=>createHash("sha256").update(b).digest("hex");
if(process.argv[2]==="worker"){
 const outcome=await runResumableDiscoveryRow(row,process.argv[3],{pauseRequested:cycle=>cycle>=3,heartbeat:m=>console.log(m)});
 console.log(JSON.stringify(outcome));
}else{
 fs.mkdirSync(root,{recursive:true});
 const head=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
 const source={head,node:process.version,v8:process.versions.v8};
 const receipts=[];
 const worker=async(name,dir,interrupt)=>{
  const out=fs.openSync(resolve(root,name+".stdout.log"),"wx");
  const err=fs.openSync(resolve(root,name+".stderr.log"),"wx");
  const args=[fileURLToPath(import.meta.url),"worker",dir];
  const start=new Date().toISOString();
  const child=spawn(process.execPath,args,{windowsHide:true,stdio:["ignore",out,err]});
  fs.closeSync(out);fs.closeSync(err);
  let killed=false;
  const timer=interrupt?setInterval(()=>{
   const p=resolve(dir,"resume-status.json");
   if(!fs.existsSync(p))return;
   try{const status=JSON.parse(fs.readFileSync(p,"utf8"));
    if(status.cycle>=1&&!killed){killed=true;child.kill();}
   }catch{}
  },20):null;
  const end=await new Promise((done,reject)=>{child.once("error",reject);child.once("close",(code,signal)=>done({code,signal}));});
  if(timer)clearInterval(timer);
  receipts.push({name,command:[process.execPath,...args],start,finished:new Date().toISOString(),killed,...end});
  if(interrupt&&!killed)throw Error("interrupt witness never stopped a live process");
  if(!interrupt&&end.code!==0)throw Error(name+" worker failed");
 };
 const direct=resolve(root,"direct"), resumed=resolve(root,"resumed");
 await worker("interrupted",resumed,true);
 const stopPointer=JSON.parse(fs.readFileSync(resolve(resumed,"resume-current.json"),"utf8"));
 await worker("restored",resumed,false);
 await worker("direct",direct,false);
 const bytes=d=>{
  const p=JSON.parse(fs.readFileSync(resolve(d,"resume-current.json"),"utf8"));
  return fs.readFileSync(resolve(d,"resume","slot-"+p.slot+".bin"));
 };
 const events=d=>fs.readFileSync(resolve(d,"events.jsonl"),"utf8").trim().split("\n").map(l=>{const e=JSON.parse(l);delete e.rssBytes;return e;});
 const a=bytes(direct),b=bytes(resumed);
 const exactState=a.equals(b);
 const exactScientificEvents=JSON.stringify(events(direct))===JSON.stringify(events(resumed));
 const result={purpose:"Actual N64 early-width BLD family process interruption and restore. Three-cycle prefix only; not endpoint/cutoff evidence or host capacity.",
  source,row,receipts,interruptedCheckpointGeneration:stopPointer.generation,
  checkpointBytes:a.length,directSha256:sha(a),resumedSha256:sha(b),exactState,exactScientificEvents,
  updates:events(resumed).length};
 fs.writeFileSync(resolve(root,"receipt.json"),JSON.stringify(result,null,2)+"\n");
 if(!exactState||!exactScientificEvents||result.updates!==3)throw Error("real recovery witness mismatch");
 console.log(JSON.stringify(result));
}
