import json,pathlib,hashlib
r=pathlib.Path('out/analysis-2026-10-18/seed');p=json.loads((r/'seed-summary.json').read_text())
keys=['axialCells','lateralCartesianCenterSpanUm','attachedCount']
def metric(x):return{k:x[k]for k in keys}
def facet(x):return {k:x[k]for k in ['tempC','fraction','seedRadius']}|{'contrasts':[{'armMinusArm':c['armMinusArm'],'growth':metric(c['growth']),'laterGrowth':metric(c['laterGrowth'])}for c in x['contrasts']]}
def seed(x):return{k:x[k]for k in ['tempC','fraction','arm']}|{'wideMinusTallNewGrowth':metric(x['wideMinusTallNewGrowth']),'wideMinusTallLaterGrowth':metric(x['wideMinusTallLaterGrowth'])}
def end(x):return {k:x[k]for k in ['cycle','simTimeSeconds','attachedCount','axialCells','lateralCartesianCenterSpanUm']}
def row(x):return{k:x[k]for k in ['rowId','tempC','fraction','arm','seedRadius','seedThickness']}|{'atOrBefore':end(x['end']['atOrBefore']),'nextEvent':end(x['end']['nextEvent'])if x['end']['nextEvent']else None,'exactEventTime':x['end']['exactEventTime'],'newGrowth':metric(x['growth']),'recordedEndpointSensitivity':metric(x['sensitivity'])}
def pair(x):return{k:x[k]for k in ['tempC','fraction','arm','eightRowAgeSeconds','pairAgeSeconds']}|{'rowIds':[a['rowId']for a in x['rows']],'wideMinusTallTotal':metric(x['wideMinusTallTotal']),'wideMinusTallLater':metric(x['wideMinusTallLater'])}
q={k:p[k]for k in ['createdAt','scope','definitions','census','producers','seeds','eightRowBaselineCost','fullAnalysis','script','rerun','assurance']}
q['schema']='seed-decision-summary-oct18-v1'
q['conditions']=[{'label':g['label'],'commonAgeSeconds':g['commonAgeSeconds'],'shortestWitness':g['shortestWitness'],'newSeedGrowth':[seed(x)for x in g['seedContrasts']]}for g in p['conditionReadouts']]
q['seedAxialCensus']={k:v for k,v in p['seedNewAxialCensus'].items()if k!='witnesses'}
q['laterSeedAxialCensus']={k:v for k,v in p['laterSeedAxialCensus'].items()if k!='witnesses'}
q['laterSeedPairs']=[pair(x)for x in p['laterSeedPairs']]
q['temperatureCommonAge']={k:p['temperatureCommonAge'][k]for k in ['denominator','ageSeconds']}|{'facetContrasts':[facet(x)for x in p['temperatureCommonAge']['facetContrasts']],'rows':[row(x)for x in p['temperatureCommonAge']['rows']]}
q['forcingCommonAge']=[{k:g[k]for k in ['label','denominator','ageSeconds']}|{'facetContrasts':[facet(x)for x in g['facetContrasts']]}for g in p['forcingCommonAge']]
(r/'decision-summary.json').write_text(json.dumps(q,indent=2)+'\n')
(r/'inputs.json').write_text(json.dumps({'schema':'seed-analysis-input-bindings-v1','sources':p['sources']},indent=2)+'\n')
for f in ['decision-summary.json','inputs.json']:
 b=(r/f).read_bytes(); print(f,len(b),hashlib.sha256(b).hexdigest())
