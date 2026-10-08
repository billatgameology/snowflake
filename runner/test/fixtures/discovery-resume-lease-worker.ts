import { acquireDiscoveryRowLease } from "../../src/discovery-resume-io.ts";

const release = acquireDiscoveryRowLease(process.argv[2]);
console.log("acquired");
setTimeout(() => { release(); }, 500);
