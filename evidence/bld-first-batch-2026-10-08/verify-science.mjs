import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {summarizeFirstBatchRow} from '../../runner/src/hil-bld-batch-summary.ts';
const root=resolve(import.meta.dirname,'../..');
const original=JSON.parse(readFileSync(resolve(root,'evidence/bld-first-batch-2026-10-08/summary.json'),'utf8'));
const restored=resolve(root,'out/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable');
const withoutDirectory=({directory,...value})=>value;
const observed=original.rows.map(row=>summarizeFirstBatchRow(resolve(restored,'rows',row.rowId)));
for(let i=0;i<observed.length;i++){
 if(JSON.stringify(withoutDirectory(original.rows[i]))!==JSON.stringify(withoutDirectory(observed[i])))throw Error('Restored summary differs: '+observed[i].rowId);
}
if(observed.length!==42||observed.some(r=>r.disposition!=='size-endpoint'||r.errors.length))throw Error('Unexpected scientific coverage');
const record={checkedUtc:new Date().toISOString(),command:process.argv,verifier:'runner/src/hil-bld-batch-summary.ts summarizeFirstBatchRow',rows:observed.length,sizeEndpoints:observed.filter(r=>r.disposition==='size-endpoint').length,errors:observed.flatMap(r=>r.errors),allScientificSummaryFieldsMatch:true,comparisonExcludes:['directory (restore location)'],restoredPayloadChanged:false,limits:'Existing evidence checks and equality to retained source summary; no numerical rerun or track interpretation.'};
mkdirSync(resolve(root,'out/nas-save-bld-2026-10-08'),{recursive:true});
writeFileSync(resolve(root,'out/nas-save-bld-2026-10-08/restored-science-verification.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record));
