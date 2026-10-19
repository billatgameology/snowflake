import json, hashlib, pathlib, datetime
root=pathlib.Path('out/analysis-2026-10-18/seed')
raw=root/'seed-analysis-v2.json'
p=json.loads(raw.read_text())
def binding(path):
    b=pathlib.Path(path).read_bytes()
    return dict(path=str(path),bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
def slimrow(r):
    z=r['growth'];return {k:r[k] for k in ['rowId','tempC','fraction','arm','seedRadius','seedThickness']}|{'start':z['start']['atOrBefore'],'end':z['end'],'growth':z['atOrBeforeIncrements'],'sensitivity':z['recordedEndpointSensitivity'],'laterGrowth':r['laterGrowth']['atOrBeforeIncrements'],'laterSensitivity':r['laterGrowth']['recordedEndpointSensitivity']}
conditions=[dict(label=g['label'],commonAgeSeconds=g['shortestTerminalAgeSeconds'],shortestWitness=g['shortestWitness'],rows=[slimrow(r)for r in g['selections'][-1]['rows']],facetContrasts=g['selections'][-1]['facetContrasts'],seedContrasts=g['selections'][-1]['seedContrasts'])for g in p['conditions']]
seedall=[dict(condition=g['label'],**x)for g in conditions for x in g['seedContrasts']]
later=[x for x in p['laterSeedPairs']if x['pairAgeSeconds']>x['eightRowAgeSeconds']]
def bucket(x):
    d=x['wideMinusTallLater']['axialCells']
    return 'tallGreater' if d['max']<0 else 'wideGreater' if d['min']>0 else 'equal' if d['min']==d['max']==0 else 'bracketSensitive'
lc={key:[{k:x[k]for k in ['tempC','fraction','arm','eightRowAgeSeconds','pairAgeSeconds','wideMinusTallLater']}for x in later if bucket(x)==key]for key in ['tallGreater','wideGreater','equal','bracketSensitive']}
temps=p['temperatureMatched']['selections'][-1]
sources=p['sources']+[binding(pathlib.Path(x['coverage']['directory'])/'exit.json')for x in p['endpoints']]
baseline=[]
for x in p['endpoints']:
    r=x['row']
    if r['tempC']in[-6.5,-9.5]and r['fraction']==.15 and r['experimentalFacetDips']in['both','neither']:
        result=json.load(open(pathlib.Path(x['coverage']['directory'])/'result.json'))
        baseline.append(dict(rowId=r['id'],wallSeconds=result['wallSeconds'],producer=result['gitHead']))
s=dict(schema='seed-readout-summary-oct18-v1',createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope=p['scope'],definitions=p['definitions'],census=p['census'],producers=p['producers'],
    seeds=[p['endpoints'][0]['initial'],next(x['initial']for x in p['endpoints']if x['row']['seedRadius']==1)],
    conditionReadouts=conditions,
    seedNewAxialCensus=dict(denominator=len(seedall),tallStrictlyGreater=sum(x['wideMinusTallNewGrowth']['axialCells']['max']<0 for x in seedall),tallExtraLayersRange=[min(-x['wideMinusTallNewGrowth']['axialCells']['max']for x in seedall),max(-x['wideMinusTallNewGrowth']['axialCells']['min']for x in seedall)],witnesses=seedall),
    laterSeedAxialCensus=dict(denominator=len(later),excludedZeroDuration=8,counts={k:len(v)for k,v in lc.items()},witnesses=lc),
    temperatureCommonAge=dict(denominator=32,ageSeconds=temps['requestedTimeSeconds'],facetContrasts=temps['facetContrasts'],rows=[slimrow(r)for r in temps['rows']]),
    forcingCommonAge=[dict(label=g['label'],denominator=g['denominator'],ageSeconds=g['shortestTerminalAgeSeconds'],facetContrasts=g['selections'][-1]['facetContrasts'],rows=[slimrow(r)for r in g['selections'][-1]['rows']])for g in p['forcingMatched']],
    laterSeedPairs=p['laterSeedPairs'],laterFacetPairs=p['laterFacetPairs'],
    eightRowBaselineCost=dict(rows=baseline,sumWorkerHours=sum(r['wallSeconds']for r in baseline)/3600,limits='Observed CFL .05 rows under original contention. New CFL .025 seed cost is unmeasured; no estimate or transfer claim.'),
    sources=sources,fullAnalysis=binding(raw),script=binding(root/'analyze.mjs'),
    rerun='node out/analysis-2026-10-18/seed/analyze.mjs out/analysis-2026-10-18/seed/seed-analysis-new.json',
    assurance=dict(author='Codex/GPT-6 analysis subagent, inherited context',method='Exact readRow and window/increments/contrast function bodies copied from the previously checked saved-data history.mjs; existing bracketCavityTime and summarizeFirstBatchRow called unchanged. New scratch code selects complete seed blocks and common-age sets, counts scoped contrasts and packages outputs.',executed='All 64 row specs matched current retained roster entries; all cflFill=.05, dx=.35; strict at-every-event coordinate/count/extent/AR reconstruction and all endpoint checks passed. No new numerical calculation module, solver, gate, tests or simulation.',limits='No independent review of this complete report, no full fields, timestep/grid/domain qualification, external physical source or held-out comparison. Bounded source diff between fixed producers is empty for core, solver-cpu, worker and bracket helper.'))
(root/'seed-summary.json').write_text(json.dumps(s,indent=2)+'\n')
print(json.dumps({'summary':binding(root/'seed-summary.json'),'counts':s['laterSeedAxialCensus']['counts'],'baselineHours':s['eightRowBaselineCost']['sumWorkerHours']},indent=2))
