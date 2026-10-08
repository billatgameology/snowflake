import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { resolve } from "node:path";
const root=resolve("out/bld-resume-verification/final");
const stdout=fs.openSync(resolve(root,"full-check.stdout.log"),"wx");
const stderr=fs.openSync(resolve(root,"full-check.stderr.log"),"wx");
const start={command:"npm.cmd test",head:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),
  dirty:execFileSync("git",["status","--porcelain"],{encoding:"utf8"}).trim(),
  node:process.version,v8:process.versions.v8,startedAt:new Date().toISOString()};
if(start.dirty!=="")throw Error("stable clean implementation required");
fs.writeFileSync(resolve(root,"full-check-start.json"),JSON.stringify(start,null,2)+"\n");
const child=spawn(process.env.ComSpec??"cmd.exe",["/d","/s","/c","npm.cmd test"],{windowsHide:true,stdio:["ignore",stdout,stderr]});
fs.closeSync(stdout);fs.closeSync(stderr);
child.on("error",e=>fs.writeFileSync(resolve(root,"full-check-spawn-error.txt"),String(e)));
child.on("close",(exitCode,signal)=>{
 fs.writeFileSync(resolve(root,"full-check-result.json"),JSON.stringify({...start,finishedAt:new Date().toISOString(),exitCode,signal},null,2)+"\n");
 process.exitCode=exitCode??1;
});
