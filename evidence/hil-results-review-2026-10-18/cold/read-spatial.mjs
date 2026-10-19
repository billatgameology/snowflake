import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexSeedSites, domainCenter, coordsOf, neighborIndices } from '../../../core/src/index.ts';

// Bounded post-hoc saved-observation analysis; no solver construction or launch.
let input;
const output = dirname(fileURLToPath(import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = [];
const arms = ['neither', 'basal-only', 'prism-only', 'both'];
function read(relative, lines = false) {
  const bytes = readFileSync(resolve(input, relative));
  inputs.push({ path: resolve(input, relative).replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) });
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
  const compact=s=>s??null;
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


const rowList=JSON.parse(readFileSync(resolve(output,'cold-readout.json'))).rows.filter(r=>(r.tempC===-14.4&&r.fraction===.1)||(r.tempC===-20&&r.fraction===.15));
const profiles=[];
for(const selected of rowList){
 const name=selected.id.startsWith('oct10')?'hil-exploration-oct10':selected.id.startsWith('oct11')?'hil-large-batch-oct11':'hil-two-day-oct12';
 input=resolve(`C:/Users/biao3/.codex/worktrees/${name}/snowflake/out/${name}`);
 const id=selected.id,dir='rows/'+id,spec=read(dir+'/spec.json'),result=read(dir+'/result.json'),events=read(dir+'/events.jsonl',true),row=spec.row;
 const dims={nx:row.dimsN,ny:row.dimsN,nz:row.dimsN},center=domainCenter(dims),occupied=new Set(hexSeedSites(dims,row.seedRadius,row.seedThickness));
 const snapshots=result.spatialSnapshots.map(record=>({record,snapshot:read(`${dir}/${record.path}`)}));
 let state=stateMeasure(occupied,dims,center,{cycle:0,simTimeSeconds:0,extent:5});const saved=[];
 const capture=()=>{for(const {record,snapshot} of snapshots.filter(s=>s.record.completedCycles===state.cycle)){
  requireThat(snapshot.rowId===id&&snapshot.experimentalFacetDips===row.experimentalFacetDips,'snapshot identity');
  requireThat(JSON.stringify(snapshot.record)===JSON.stringify(record),'snapshot result binding');
  saved.push(spatial(snapshot,occupied,dims,center,state));
 }};
 capture();
 for(const event of events){for(const cell of event.attached)occupied.add(cell.index);state=stateMeasure(occupied,dims,center,{cycle:event.cycle,simTimeSeconds:event.simTimeSeconds,extent:event.extent});capture();}
 requireThat(saved.length===snapshots.length,'snapshot coverage');
 profiles.push({...selected,snapshots:saved,noninitialPrismSnapshots:saved.filter(p=>p.record.completedCycles>0&&p.prism!==null).length,noninitialSnapshots:saved.filter(p=>p.record.completedCycles>0).length});
}
const report={scope:'Saved spatial readout for 20 cold anchor/timestep rows. Uses the retained spatial() definition with independently reconstructed boundary/neighbor/prism membership; snapshot age/geometry not assumed matched across rows.',createdAt:new Date().toISOString(),script:{path:fileURLToPath(import.meta.url),sha256:hash(readFileSync(fileURLToPath(import.meta.url)))},inputs,profiles};
writeFileSync(resolve(output,'cold-spatial.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rows:profiles.length,snapshots:profiles.reduce((s,p)=>s+p.snapshots.length,0),coverage:profiles.map(p=>({id:p.id,positiveNoninitial:p.noninitialPrismSnapshots,totalNoninitial:p.noninitialSnapshots}))},null,2));
