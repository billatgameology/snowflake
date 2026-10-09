"""Bounded independent raw-coordinate recomputation for the saved-data review."""
import collections
import hashlib
import itertools
import json
import pathlib

WORKTREE = pathlib.Path(__file__).resolve().parents[1]
RAW = pathlib.Path('C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08')
BUNDLE = WORKTREE / 'evidence/hil-bld-joint-review-2026-10-08/followup'
SOURCE_HASHES = []

def read(path, lines=False):
    raw = path.read_bytes()
    SOURCE_HASHES.append({'path': str(path), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
    return [json.loads(line) for line in raw.splitlines()] if lines else json.loads(raw)

def location(row_id):
    if row_id.startswith('batch1-bld'):
        return RAW / 'hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable/rows' / row_id
    return RAW / ('hil-exploration-batch2/batch2-hil/rows' if row_id.startswith('batch2') else 'discovery-resume/batch1-hil-resumable/rows') / row_id

def radius(i,j): return max(abs(i),abs(j),abs(i+j))

def load(row_id):
    path=location(row_id); row=read(path/'spec.json')['row']; events=read(path/'events.jsonl',True)
    center=row['dimsN']//2; r=row['seedRadius']; half=(row['seedThickness']-1)//2
    seed={(center+i,center+j,center+k) for i in range(-r,r+1) for j in range(-r,r+1) if radius(i,j)<=r for k in range(-half,half+1)}
    occupied=set(seed); states=[]
    for event in events:
        sites={tuple(a['coords']) for a in event['attached']}
        assert len(sites)==len(event['attached']) and not (sites & occupied)
        occupied.update(sites)
        assert len(occupied)==event['attachedCount']
        states.append({'event':event,'occupied':occupied.copy()})
    return {'row':row,'events':events,'states':states,'center':center}

def bracket(states,t):
    low=max((s for s in states if s['event']['simTimeSeconds']<=t),key=lambda s:s['event']['simTimeSeconds'])
    high=next((s for s in states if s['event']['simTimeSeconds']>t),None)
    return [low] if low['event']['simTimeSeconds']==t or high is None else [low,high]

def axial(state):
    ks=[c[2] for c in state['occupied']]
    return max(ks)-min(ks)+1

results={}
pressure_ids=['batch1-hil-pressure-t6-f0p2-p50662p5-both','batch2-hil-pressure-t6-f0p2-p101325-both','batch1-hil-pressure-t6-f0p2-p202650-both']
pressure=[load(i) for i in pressure_ids]
low,mid,high=[r['states'][-1]['occupied'] for r in pressure]
assert high < mid < low
diff=low-high;c=pressure[0]['center'];rings=collections.Counter(radius(i-c,j-c) for i,j,k in diff)
planes=collections.Counter(k-c for i,j,k in diff)
assert len(diff)==820 and sum(n for r,n in rings.items() if r<=1)==28 and sum(n for r,n in rings.items() if 4<=r<=9)==792
assert sum(n for k,n in planes.items() if 4<=abs(k)<=9)==696
assert planes[-6]==planes[6]==78 and max(planes.values())==78
results['pressure']={'endpointCounts':[len(low),len(mid),len(high)],'strictNesting':True,'lowMinusHigh':len(diff),'byHexRadius':dict(sorted(rings.items())),'bySignedAxialPlane':dict(sorted(planes.items()))}

history=read(BUNDLE/'history.json');history_results=[]
for group in history['history']:
    if group['paramSet']!='M1':continue
    rows=[load(r['rowId']) for r in group['rows']]
    events=[next(e for e in r['events'] if 'timelineEvent' in e) for r in rows]
    duration=min(r['events'][-1]['simTimeSeconds']-e['simTimeSeconds'] for r,e in zip(rows,events))
    assert duration==group['commonPostEventSeconds']
    increments=[];initial=[];ranges=[];added=[]
    for r,event,published in zip(rows,events,group['rows']):
        start=next(s for s in r['states'] if s['event']['cycle']==event['cycle'])
        ends=bracket(r['states'],event['simTimeSeconds']+duration)
        initial.append(axial(start));increments.append(axial(ends[0])-axial(start))
        ranges.append(sorted({axial(s)-axial(start) for s in ends}))
        new=ends[0]['occupied']-start['occupied'];added.append(len(new))
        counted=sum(len(e['attached']) for e in r['events'] if event['cycle']<e['cycle']<=ends[0]['event']['cycle'])
        assert counted==len(new)
        assert (axial(ends[0])-axial(start))*r['row']['dxUm']==published['windows']['full']['atOrBeforeIncrements']['axialCenterSpanUm']
    expected=[2,2,2] if group['fromTempC']==-6 else [10,6,6]
    assert increments==expected and ranges==[[x] for x in expected]
    history_results.append({'fromTempC':group['fromTempC'],'toTempC':group['toTempC'],'commonSecondsAfterEvent':duration,'initialAxialLayers':initial,'addedAxialLayers':increments,'recordedBracketChoices':ranges,'newAttachedSitesExcludingSwitchRecord':added})
results['history']=history_results

def core_tip(state,center):
    plane={(i-center,j-center) for i,j,k in state['occupied'] if k==center}
    tip=max(radius(i,j) for i,j in plane);core=-1
    for r in range(tip+1):
        if all((i,j) in plane for i in range(-r,r+1) for j in range(-r,r+1) if radius(i,j)<=r):core=r
        else:break
    return core,tip

cold=read(BUNDLE/'cold.json');cold_results=[]
for tag,temp,selected in [('18',-18,[4,6,7]),('14p4',-14.4,[8])]:
    row_ids=[f'batch1-bld-cold-t{tag}-f0p1-{a}' for a in ['neither','basal-only','prism-only','both']]
    rows=[load(r) for r in row_ids]
    for r in rows:
        for state in r['states']:state['core'],state['tip']=core_tip(state,r['center'])
    for tip in selected:
        entries=[next(s for s in r['states'] if s['tip']==tip) for r in rows]
        exits=[next((s for s in r['states'] if s['tip']>tip),r['states'][-1]) for r in rows]
        elapsed=min(b['event']['simTimeSeconds']-a['event']['simTimeSeconds'] for a,b in zip(entries,exits))/2
        gaps=[];details=[]
        for r,start in zip(rows,entries):
            t=start['event']['simTimeSeconds']+elapsed;s=bracket(r['states'],t)[0]
            gaps.append(s['tip']-s['core']);details.append({'rowId':r['row']['id'],'requestedSeconds':t,'cycle':s['event']['cycle'],'actualSeconds':s['event']['simTimeSeconds']})
        published_group=next(g for g in cold['groups'] if g['tempC']==temp)
        published=next(s for s in published_group['stages'] if s['tip']==tip)['selections'][2]
        assert gaps==[r['atOrBefore']['gap'] for r in published['rows']]
        assert gaps==({4:[0,0,1,1],6:[0,0,1,1],7:[1,1,1,1]}[tip] if temp==-18 else [0,0,2,2])
        cold_results.append({'tempC':temp,'tipHexRadius':tip,'halfShortestPlateauSeconds':elapsed,'armOrder':['neither','basal-only','prism-only','both'],'selectedGaps':gaps,'selections':details})
results['cold']=cold_results

saved_field_census=[]
for arm in ['prism-only','both']:
    row_id='batch1-bld-cold-t14p4-f0p1-'+arm
    row=load(row_id); path=location(row_id); result=read(path/'result.json')
    snapshots=[]
    for reference in result['spatialSnapshots']:
        snapshot=read(path/reference['path'])
        snapshots.append({'completedCycles':reference['completedCycles'],'savedPrismCells':sum(c['facet']=='prism' for c in snapshot['cells'])})
    count=sum(e['boundary']['facets']['prism']['count']>0 for e in row['events'])
    assert count==177 and len(row['events'])==229 and [s['savedPrismCells'] for s in snapshots]==[12,0,0,0]
    saved_field_census.append({'rowId':row_id,'updates':229,'rawRecordedUpdatesWithPrism':177,'snapshotCensus':snapshots})
results['coldSavedFieldCensus']=saved_field_census

warm_rows=[load('batch1-bld-warm-t5-'+arm) for arm in ['broad','early','full']]
inactive=next(e for e in warm_rows[1]['events'] if e['basalWidthObservation']['historyActive'] is False)
start=inactive['basalWidthObservation']['simTimeSecondsBeforeUpdate'];end=min(r['events'][-1]['simTimeSeconds'] for r in warm_rows)
warm_result=[]
for arm,r in zip(['broad','early','full'],warm_rows):
    starts=bracket(r['states'],start);ends=bracket(r['states'],end)
    inc=(axial(ends[0])-axial(starts[0]))*r['row']['dxUm']
    variants=sorted({(axial(b)-axial(a))*r['row']['dxUm'] for a,b in itertools.product(starts,ends)})
    warm_result.append({'arm':arm,'axialSpanIncrementUm':inc,'bracketAlternativesUm':variants,'addedSites':len(ends[0]['occupied']-starts[0]['occupied'])})
assert warm_result[1]['axialSpanIncrementUm']==0 and warm_result[2]['axialSpanIncrementUm']==1.4
assert warm_result[1]['bracketAlternativesUm']==[0] and warm_result[2]['bracketAlternativesUm']==[1.4]
results['warm']={'tempC':-5,'startSeconds':start,'endSeconds':end,'durationSeconds':end-start,'rows':warm_result,'quantity':'total axial-span increment, not one-tip displacement'}
results['sources']=SOURCE_HASHES
out=WORKTREE/'out/followup-review-calculations.json'
out.write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in results.items() if k!='sources'},indent=2))
