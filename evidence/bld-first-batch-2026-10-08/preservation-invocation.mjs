import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { inventoryStableTree, parseNasAssetCatalogV1, writeJsonAtomic } from '../../scripts/nas-asset-lib.ts';
import { publishCollectionFixture, restoreCollectionFixture } from '../../scripts/nas-asset-transaction-lib.ts';
import { detectNasMount } from '../../scripts/nas-root.ts';
const ROOT=resolve(import.meta.dirname,'../..');
const OP=resolve(ROOT,'out/nas-save-bld-2026-10-08');
const ID='bld-first-batch-output', VERSION='2026-10-08', IDENTITY=ID+'@'+VERSION;
const LOCATOR=`collections/${ID}/${VERSION}/payload`;
const DEST=resolve(ROOT,`out/restores/${ID}-${VERSION}`);
const NAMES=['batch1-bld-resumable','batch1-bld-resumable-probe','batch1-bld-resumable-control'];
const catalogPath=resolve(ROOT,'docs/nas-assets.json');
const read=(p)=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=(b)=>createHash('sha256').update(b).digest('hex');
const save=(name,v)=>writeJsonAtomic(resolve(OP,name),v);
const brief=(i)=>({fileCount:i.fileCount,totalBytes:i.totalBytes,treeSha256:i.treeSha256});
const equal=(a,b,label)=>{if(JSON.stringify(brief(a))!==JSON.stringify(brief(b)))throw Error(label+' inventory mismatch')};
const catalog=()=>parseNasAssetCatalogV1(readFileSync(catalogPath,'utf8'));
const selected=(c)=>{const x=c.collections.find(x=>x.assetId===ID&&x.version===VERSION);if(!x)throw Error('No registered collection');return x};
const mount=()=>{const p=detectNasMount();if(!p)throw Error('Marked NAS detached');return p};
const hooks={afterPhase(phase,ctx){if(!phase.endsWith('file-copied'))console.log(new Date().toISOString(),phase);}};
const mode=process.argv[2];
if(mode==='prepare'){
 const payload=resolve(OP,'payload');if(existsSync(payload))throw Error('Prepared payload already exists');mkdirSync(payload);
 const inventories={};
 for(const name of NAMES){
  const src=resolve(ROOT,'out',name), dst=resolve(payload,name);
  console.log('inventory',name); const before=inventoryStableTree(src);
  cpSync(src,dst,{recursive:true,errorOnExist:true,force:false});
  equal(before,inventoryStableTree(src),'source after copy '+name);
  equal(before,inventoryStableTree(dst),'local copy '+name);
  inventories[name]=before;console.log(JSON.stringify({name,...brief(before)}));
 }
 save('sources.json',inventories);const inventory=inventoryStableTree(payload);save('payload-inventory.json',inventory);
 save('prepared.json',{preparedAt:new Date().toISOString(),identity:IDENTITY,sources:NAMES.map(name=>({name,...brief(inventories[name])})),payload:brief(inventory),originalsRetained:true});
 console.log(JSON.stringify(brief(inventory)));
}else if(mode==='publish'){
 const c=catalog(), collection=selected(c);const result=publishCollectionFixture({shareRoot:mount(),sourceRoot:resolve(OP,'payload'),collection,catalogueCollections:c.collections,transactionId:'bld-first-batch-20261008-publish',hooks});
 equal(read(resolve(OP,'payload-inventory.json')),result.receipt.final,'published');save('publication.json',result);console.log(JSON.stringify(result));
}else if(mode==='restore'){
 const publication=read(resolve(OP,'publication.json'));mkdirSync(dirname(DEST),{recursive:true});
 const result=restoreCollectionFixture({shareRoot:mount(),destinationPath:DEST,collection:selected(catalog()),publicationReceiptPath:publication.publicationReceiptPath,transactionId:'bld-first-batch-20261008-restore',hooks});
 equal(read(resolve(OP,'payload-inventory.json')),result.receipt.restored,'restored');save('restore.json',result);console.log(JSON.stringify(result));
}else if(mode==='register'){
 const publication=read(resolve(OP,'publication.json')),restoration=read(resolve(OP,'restore.json')),inventory=read(resolve(OP,'payload-inventory.json'));
 equal(inventory,publication.receipt.final,'publication');equal(inventory,restoration.receipt.restored,'restore');
 const manifest={format:'snowflake-nas-ledger-v1',collection:IDENTITY,locator:LOCATOR,treeSha256:inventory.treeSha256,files:inventory.files.map(f=>({path:LOCATOR+'/'+f.path,bytes:f.byteLength,sha256:f.sha256}))};
 const manifestRel=`docs/nas-assets/manifests/${ID}/${VERSION}.json`,manifestPath=resolve(ROOT,manifestRel);mkdirSync(dirname(manifestPath),{recursive:true});
 if(existsSync(manifestPath))throw Error('Owner manifest already exists');writeJsonAtomic(manifestPath,manifest);const bytes=readFileSync(manifestPath);
 const lock=catalogPath+'.bld-publication.lock',fd=openSync(lock,'wx');
 try{
  const c=catalog(),entry=selected(c);if(entry.state!=='provisional')throw Error('Collection no longer provisional');
  const active={...entry,state:'active',aggregate:{files:inventory.fileCount,bytes:inventory.totalBytes},ownerManifest:{storage:'tracked',path:manifestRel,format:manifest.format,bytes:bytes.length,sha256:hash(bytes),selector:{kind:'path-prefixes',include:[LOCATOR],exclude:[]}},restore:{...entry.restore,status:'tested'},verification:{status:'full-hash',at:publication.receipt.verifiedAt.slice(0,10),host:'BLD',receipt:publication.publicationReceiptPath,limits:[`Publication receipt SHA-256 ${publication.publicationReceiptSha256}.`,`Restore receipt ${restoration.restoreReceiptPath} SHA-256 ${restoration.restoreReceiptSha256}.`,`Detailed checks: docs/nas-assets/manifests/${ID}/${VERSION}-verification.json.`,'Windows SMB durability is verification-based. Original workstation files remain; no pruning or off-site recovery claim.','Complete operational recovery copy; tracked claim archives remain Git authority.']},unresolved:[]};
  const next={...c,collections:c.collections.map(x=>x===entry?active:x)};parseNasAssetCatalogV1(JSON.stringify(next));writeJsonAtomic(catalogPath,next);
 }finally{closeSync(fd);unlinkSync(lock)}
 save('registration.json',{identity:IDENTITY,manifest:manifestRel,manifestBytes:bytes.length,manifestSha256:hash(bytes),payload:brief(inventory),publicationReceiptSha256:publication.publicationReceiptSha256,restoreReceiptSha256:restoration.restoreReceiptSha256});
 console.log(JSON.stringify(read(resolve(OP,'registration.json'))));
}else throw Error('Use prepare, publish, restore or register');
