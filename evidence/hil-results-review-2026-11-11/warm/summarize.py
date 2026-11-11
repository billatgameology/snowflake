import json, hashlib
from pathlib import Path
out=Path(__file__).resolve().parent
r=json.loads((out/'warm-comparisons.json').read_text())
cohort=r['cohorts'][0]
rows=[]
for row in r['rows']:
 common=next(x for x in cohort['rows'] if x['rowId']==row['rowId'])['times'][-1]
 h=row.get('history')
 rows.append({'rowId':row['rowId'],'producer':row['producer'],'node':row['node'],'cflFill':row['row']['cflFill'],'dxUm':row['row']['dxUm'],'seedThickness':row['row']['seedThickness'],'terminalTimeSeconds':row['terminal']['simTimeSeconds'],'terminalCycle':row['terminal']['cycle'],'size':row['exactSize'][0],'commonAge':common,'history':None if h is None else {'actualSwitchTimeSeconds':h['actualSwitchTimeSeconds'],'originalIntervals':h['original'],'newPostCutoffIntervals':h['newPostCutoff'],'selectedDemandAfterSwitchFill':h['exposure']['after']['selectedKineticDemandFill'],'selectedFractionOfDemandBeforeSwitch':h['exposure']['before']['selectedFractionOfBasalDemandFill'],'postSwitchToEndpoint':h['postSwitchToEndpoint']}})
pairs=[{k:x[k] for k in ['early','broad','available','start','end','durationSeconds','earlyIncrement','broadIncrement','earlyMinusBroadGrowth']} for x in r['postSwitchPairs']]
s={'schema':'hil-w4-analysis-summary-v1','scope':r['scope'],'commonTimeSeconds':cohort['commonTimeSeconds'],'reconstructedUpdates':sum(x['terminalCycle'] for x in rows),'census':{'rows':len(rows),'availableCohorts':len([x for x in r['cohorts'] if x['available']]),'postSwitchPairs':len(pairs)},'rows':rows,'postSwitchPairs':pairs,'limitations':['Implementation-level deterministic comparison, not physical validation or discovery claim.','Two mesh spacings and two timesteps do not establish continuum convergence.','Fine thicknesses bracket coarse thickness but initial voxel shapes and volumes differ.','Occupied volume excludes partial fill. Signed plane/side intervals are not independent cavities.','Pair-specific post-switch durations differ; cross-pair contrasts use the primary twelve-member common age.','Preparation selects almost all basal demand, so this is not evidence of rim-only attachment.'],'commands':['node out/hil-results-review-2026-11-11/warm/analyze.mjs','python out/hil-results-review-2026-11-11/warm/summarize.py']}
(out/'summary.json').write_text(json.dumps(s,indent=2)+'\n')
files=['analyze.mjs','summarize.py','inputs.json','warm-comparisons.json','summary.json','reused-control-hashes.json']
(out/'artifact-hashes.json').write_text(json.dumps({'artifacts':[{'path':f,'bytes':len((out/f).read_bytes()),'sha256':hashlib.sha256((out/f).read_bytes()).hexdigest()} for f in files]},indent=2)+'\n')
print(json.dumps(s['census']))
