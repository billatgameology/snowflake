from pathlib import Path
import json,hashlib,sys
out=Path(sys.argv[1] if len(sys.argv)>1 else 'out/warm-switch-analysis-2026-11-11');b=(out/'readout.json').read_bytes();r=json.loads(b)
geom=lambda g:{k:g[k] for k in ['cycle','simTimeSeconds','attachedCount','axisOffsets','axialSpanUm','lateralSpanUm','waist','layers','maxOpeningDepthUm']}
rows=[]
for x in r['rows']:
 y={k:x[k] for k in ['id','row','producer','node','switchCycle','actualSwitchSeconds','firstAttachment','selectedDemandBeforeSwitchFill','selectedDemandAfterSwitchFill']}
 y['switchGeometry']=geom(x['switchStates'][1]);y['sharedAgeObservation']={'requestedSeconds':5.05,**{k:geom(x['sharedAgeObservation'][k]) for k in ['atOrBefore','nextEvent']}}
 y['lastActiveFirstInactive']=[{k:e[k] for k in ['cycle','startsAt','endsAt','basalWidthObservation','attachmentFacets','surface']}|{'basalFacet':e['boundary']['facets']['basal']} for e in x['switchEvents'][1:3]]
 y['firstTwoLaterSnapshots']=[{k:s[k] for k in ['path','record','timing','axisBoundary']}|{'geometry':geom(s['geometry'])} for s in x['snapshots'][1:3]];rows.append(y)
s={'scope':r['scope'],'definitions':r['definitions'],'recipe':r['recipe'],'readout':{'path':str(out/'readout.json'),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()},'rows':rows,'pairs':r['pairs']}
(out/'summary.json').write_bytes((json.dumps(s,indent=2)+'\n').encode())
print((out/'summary.json').stat().st_size)
