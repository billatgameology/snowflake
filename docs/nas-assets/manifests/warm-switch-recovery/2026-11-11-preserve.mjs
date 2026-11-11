// Bounded use of the existing NAS lifecycle; no source deletion or archive layer.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {inventoryStableTree,hashStableRegularFile,parseNasAssetCatalogV1,writeJsonAtomic} from '../../../../scripts/nas-asset-lib.ts';
import {publishCollectionFixture,restoreCollectionFixture} from '../../../../scripts/nas-asset-transaction-lib.ts';
import {detectNasMount} from '../../../../scripts/nas-root.ts';
const ROOT=resolve(import.meta.dirname,'../../../..'), PRIMARY='C:/Users/biao3/Documents/GitHub/snowflake';
const ID='warm-switch-recovery',VERSION='2026-11-11',IDENTITY=ID+'@'+VERSION,LOCATOR=`collections/${ID}/${VERSION}/payload`;
const OP=resolve(PRIMARY,'out/nas-save-warm-switch-recovery-2026-11-11'),PAYLOAD=resolve(OP,'payload'),DEST=resolve(PRIMARY,'out/restores/warm-switch-recovery-2026-11-11');
const REPLAY=resolve(PRIMARY,'out/warm-switch-replay-2026-11-11'),ANALYSIS=resolve(PRIMARY,'out/warm-switch-analysis-2026-11-11'),WORKER=resolve(PRIMARY,'out/warm-switch-replay-worker-2026-11-11.mjs');
const recordRoot=resolve(ROOT,`docs/nas-assets/manifests/${ID}`),catalogPath=resolve(ROOT,'docs/nas-assets.json');
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=b=>createHash('sha256').update(b).digest('hex');
const catalog=()=>parseNasAssetCatalogV1(readFileSync(catalogPath,'utf8')),selected=c=>{const x=c.collections.find(x=>x.assetId===ID&&x.version===VERSION);assert(x);return x;};
const mount=()=>{const x=detectNasMount();assert(x,'Marked NAS is detached');return x;};
const brief=x=>({fileCount:x.fileCount,totalBytes:x.totalBytes,treeSha256:x.treeSha256}),equal=(a,b)=>assert.deepEqual(brief(a),brief(b));
const save=(name,value)=>writeJsonAtomic(resolve(OP,name),value);
const sourceFiles=()=>{
 const replay=inventoryStableTree(REPLAY),analysisNames=readdirSync(ANALYSIS).filter(x=>x!=='checks').sort();
 assert(analysisNames.every(n=>lstatSync(resolve(ANALYSIS,n)).isFile()),'Unexpected analysis source directory');
 const analysis=analysisNames.map(path=>({path,...hashStableRegularFile(resolve(ANALYSIS,path))})),worker=hashStableRegularFile(WORKER);
 const files=[...replay.files.map(f=>({...f,path:'replays/'+f.path,source:resolve(REPLAY,f.path)})),...analysis.map(f=>({...f,path:'analysis/'+f.path,source:resolve(ANALYSIS,f.path)})),{...worker,path:'recipes/warm-switch-replay-worker-2026-11-11.mjs',source:WORKER}].sort((a,b)=>a.path.localeCompare(b.path));
 return {replay:brief(replay),analysis,worker,files};
};
mkdirSync(OP,{recursive:true});
const mode=process.argv[2];
if(mode==='prepare'){
 assert(!existsSync(PAYLOAD),'Local prepared payload already exists');
 const launch=read(resolve(REPLAY,'launch.json'));assert.equal(launch.rows.length,6);
 for(const row of launch.rows){const v=read(resolve(REPLAY,row.rowId,'recovery-verification.json')),exit=read(resolve(REPLAY,row.rowId+'.process-exit.json'));assert.equal(v.eventsMatched,row.pauseCycle);assert.equal(v.states.length,2);assert.equal(exit.exitCode,0);}
 const before=sourceFiles();mkdirSync(PAYLOAD,{recursive:true});
 for(const f of before.files){const p=resolve(PAYLOAD,f.path);mkdirSync(dirname(p),{recursive:true});copyFileSync(f.source,p);}
 const after=sourceFiles();assert.deepEqual(before,after,'Source changed during staging');
 const inventory=inventoryStableTree(PAYLOAD);
 const shape=fs=>fs.map(f=>({path:f.path,byteLength:f.byteLength,sha256:f.sha256})).sort((a,b)=>a.path.localeCompare(b.path));
 assert.deepEqual(shape(inventory.files),shape(before.files),'Staged payload differs from selected source');
 save('source-inventory.json',before);save('payload-inventory.json',inventory);save('prepared.json',{identity:IDENTITY,preparedAt:new Date().toISOString(),payload:brief(inventory),originalsRetained:true});console.log(JSON.stringify(brief(inventory)));
}else if(mode==='publish'){
 const c=catalog(),result=publishCollectionFixture({shareRoot:mount(),sourceRoot:PAYLOAD,collection:selected(c),catalogueCollections:c.collections,transactionId:'warm-switch-recovery-20261111-publish'});equal(read(resolve(OP,'payload-inventory.json')),result.receipt.final);save('publication.json',result);console.log(JSON.stringify(result));
}else if(mode==='restore'){
 const publication=read(resolve(OP,'publication.json'));mkdirSync(dirname(DEST),{recursive:true});const result=restoreCollectionFixture({shareRoot:mount(),destinationPath:DEST,collection:selected(catalog()),publicationReceiptPath:publication.publicationReceiptPath,transactionId:'warm-switch-recovery-20261111-restore'});equal(read(resolve(OP,'payload-inventory.json')),result.receipt.restored);save('restore.json',result);console.log(JSON.stringify(result));
}else if(mode==='register'){
 const publication=read(resolve(OP,'publication.json')),restoration=read(resolve(OP,'restore.json')),inventory=read(resolve(OP,'payload-inventory.json'));equal(inventory,publication.receipt.final);equal(inventory,restoration.receipt.restored);
 const manifest={format:'snowflake-nas-ledger-v1',collection:IDENTITY,locator:LOCATOR,treeSha256:inventory.treeSha256,files:inventory.files.map(f=>({path:LOCATOR+'/'+f.path,bytes:f.byteLength,sha256:f.sha256}))};
 const manifestRel=`docs/nas-assets/manifests/${ID}/${VERSION}.json`,manifestPath=resolve(ROOT,manifestRel);assert(!existsSync(manifestPath));writeJsonAtomic(manifestPath,manifest);const bytes=readFileSync(manifestPath);
 const receiptPath=`docs/nas-assets/manifests/${ID}/${VERSION}-verification.json`;
 const c=catalog(),entry=selected(c);assert.equal(entry.state,'provisional');
 const active={...entry,state:'active',aggregate:{files:inventory.fileCount,bytes:inventory.totalBytes},ownerManifest:{storage:'tracked',path:manifestRel,format:manifest.format,bytes:bytes.length,sha256:hash(bytes),selector:{kind:'path-prefixes',include:[LOCATOR],exclude:[]}},backup:{status:'verified',independentDomains:['hil-workstation-c'],receipts:[receiptPath]},restore:{...entry.restore,status:'tested'},verification:{status:'full-hash',at:publication.receipt.verifiedAt.slice(0,10),host:'HIL',receipt:publication.publicationReceiptPath,limits:[`Publication receipt SHA-256 ${publication.publicationReceiptSha256}.`,`Fresh restore receipt ${restoration.restoreReceiptPath} SHA-256 ${restoration.restoreReceiptSha256}.`,`Exact scope and verification: ${receiptPath}.`,'Original workstation copies retained; NAS and workstation are distinct domains, but no off-site recovery or prune authorization.','Six short HIL replay prefixes and stable saved-data analysis only; not the original long HIL campaign.']},unresolved:[]};
 const next={...c,collections:c.collections.map(x=>x===entry?active:x)};parseNasAssetCatalogV1(JSON.stringify(next));writeJsonAtomic(catalogPath,next);
 writeJsonAtomic(resolve(recordRoot,VERSION+'-publication-receipt.json'),publication.receipt);writeJsonAtomic(resolve(recordRoot,VERSION+'-restore-receipt.json'),restoration.receipt);
 const receipt={identity:IDENTITY,verifiedAt:new Date().toISOString(),payload:brief(inventory),sourceRoots:{replay:REPLAY,analysis:ANALYSIS,worker:WORKER},excluded:'analysis/checks live full regression logs; retained separately by parent',publicationReceiptPath:publication.publicationReceiptPath,publicationReceiptSha256:publication.publicationReceiptSha256,restoreReceiptPath:restoration.restoreReceiptPath,restoreReceiptSha256:restoration.restoreReceiptSha256,freshRestore:DEST,manifest:{path:manifestRel,bytes:bytes.length,sha256:hash(bytes)},allPayloadFilesRestored:true,originalsRetained:true,pruningAuthorized:false};
 writeJsonAtomic(resolve(ROOT,receiptPath),receipt);console.log(JSON.stringify(receipt));
}else throw Error('Use prepare, publish, restore or register');
