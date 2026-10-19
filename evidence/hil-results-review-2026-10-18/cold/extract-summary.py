import json,hashlib,subprocess,datetime
from pathlib import Path
base=Path('out/analysis-2026-10-18/cold')
def binding(p):
 b=p.read_bytes();return {'path':str(p).replace('\\','/'),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
r=json.loads((base/'cold-readout.json').read_text());s=json.loads((base/'cold-spatial.json').read_text())
def shortstate(x):
 if x is None:return None
 return {k:v for k,v in x.items() if k!='centralPlaneRingCounts'}
def shortrow(x):return {**{k:v for k,v in x.items() if k not in ['atOrBefore','next']},'atOrBefore':shortstate(x['atOrBefore']),'next':shortstate(x['next'])}
def compact(g):
 return {k:v for k,v in g.items() if k not in ['stages','terminal','commonAbsoluteAgeSelections']}|{
 'terminal':[shortrow(x) for x in g['terminal']],
 'stages':[{'tip':p['tip'],'shortestPlateauSeconds':p['shortestPlateauSeconds'],'plateauBoundaries':p['plateauBoundaries'],'selections':[{'fractionOfShortestPlateau':z['fractionOfShortestPlateau'],'elapsedSeconds':z['elapsedSeconds'],'rows':[shortrow(x) for x in z['rows']]} for z in p['selections']]} for p in g['stages']],
 'commonAbsoluteAgeSelections':[{**z,'rows':[shortrow(x) for x in z['rows']]} for z in g['commonAbsoluteAgeSelections']]}
# Preserve full scalar brackets; retain ring arrays only for the named tip-eight midpoint witness.
groups=[{'tempC':g['tempC'],'fraction':g['fraction'],'cflFill':g['cflFill'],'armOrder':g['armOrder'],'commonTimeSeconds':g['commonTimeSeconds'],'stages':[{'tip':p['tip'],'shortestPlateauSeconds':p['shortestPlateauSeconds'],'selections':[{'fractionOfShortestPlateau':z['fractionOfShortestPlateau'],'elapsedSeconds':z['elapsedSeconds'],'gaps':[x['atOrBefore']['gap'] for x in z['rows']],'nextEventGaps':[x['next']['gap'] if x['next'] else None for x in z['rows']]} for z in p['selections']]} for p in g['stages']],'commonAbsoluteAgeSelections':[{**z,'rows':[shortrow(x) for x in z['rows']]} for z in g['commonAbsoluteAgeSelections']]} for g in r['groups']];steps=[compact(g) for g in r['timestepGroups']]
ring_witnesses=[{'tempC':g['tempC'],'fraction':g['fraction'],'stepOrder':g['stepOrder'],'selection':next(p for p in g['stages'] if p['tip']==8)['selections'][2]} for g in r['timestepGroups']]
# A compact matrix is enough for scanning; the bracketed comparisons above remain authoritative.
matrix=[]
for g in r['groups']:
 p=next(p for p in g['stages'] if p['tip']==8)['selections'][2]
 matrix.append({'tempC':g['tempC'],'fraction':g['fraction'],'cflFill':g['cflFill'],'armOrder':g['armOrder'],'tip8HalfGaps':[x['atOrBefore']['gap'] for x in p['rows']],'nextEventGaps':[x['next']['gap'] if x['next'] else None for x in p['rows']],'terminalGaps':[x['atOrBefore']['gap'] for x in g['terminal']]})
spatial=[{k:v for k,v in p.items() if k not in ['snapshots','terminal']}|{'snapshotSummaries':[{'record':x['record'],'tip':x['state']['tip'],'core':x['state']['core'],'prismCount':x['prism']['count'] if x['prism'] else 0,'centralPrismCount':x['centralPrism']['count'] if x['centralPrism'] else 0,'centralPrism':x['centralPrism']} for x in p['snapshots']]} for p in s['profiles']]
cmd=['git','diff','--name-only','33832e2','0161a51','--','core/src','solver-cpu/src','runner/src'];pr=subprocess.run(cmd,capture_output=True,text=True,check=True)
output={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':r['scope'],'definitions':r['definitions'],'derivation':r['derivation'],'fullLocalOutputs':[binding(base/'cold-readout.json'),binding(base/'cold-spatial.json')],'recipes':[binding(base/'read-cold.mjs'),binding(base/'read-spatial.mjs'),binding(base/'extract-summary.py')],'reusedSources':[binding(Path('evidence/hil-bld-joint-review-2026-10-08/followup/cold.mjs')),binding(Path('out/hil-two-day-design-2026-10-12/cold-triage.mjs'))],'producerParity':{'command':' '.join(cmd),'exitCode':pr.returncode,'changedPaths':pr.stdout.splitlines(),'interpretation':'Only the four Oct11/Oct12 roster/entry files changed across the retained producer interval; core, solver, scientific worker, observations and readout definitions are unchanged.'},'inputBindings':list({i['path']:i for i in r['inputs']+s['inputs']}.values()),'operational':{'rows':len(r['checks']),'sizeEndpoints':sum(x['disposition']=='size-endpoint' for x in r['checks']),'errors':[x for x in r['checks'] if x['errors']]},'rows':r['rows'],'tip8Matrix':matrix,'groups':groups,'timestepGroups':steps,'tip8RingWitnesses':ring_witnesses,'spatial':spatial,'limits':['Retrospective internal model-development analysis, not a phase gate or physical mechanism identification.','Representation and domain/far-field sensitivity unresolved; a one-cell contrast is not grid independence.','Only recorded discrete states are used; adjacent events are brackets, not continuous interpolation.','Equal tip/plateau age and equal absolute age are separate comparisons, with different geometry.','Source parity spans these fixed producers; scalar kinetic interventions retain their explicit facet-arm identities.','No new simulation, producer, codec, parameter, or tracked source changes.']}
(base/'cold-summary.json').write_text(json.dumps(output,separators=(',',':'))+'\n')
print(json.dumps({'summaryBytes':(base/'cold-summary.json').stat().st_size,'summary':binding(base/'cold-summary.json'),'operational':output['operational']}))
