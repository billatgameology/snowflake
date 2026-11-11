import json, hashlib, sys
from pathlib import Path
from bisect import bisect_right
root=Path(sys.argv[1])
out=Path(sys.argv[2])
rows={}; inputs=[]
for pressure in ['50662p5','101325','202650']:
 for trigger in [7,15]:
  rid=f'gd21-hil-h1-p{pressure}-switch{trigger}'
  p=root/'rows'/rid/'events.jsonl'; raw=p.read_bytes()
  inputs.append(dict(path=str(p),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest()))
  low=high=48; count=19; states=[dict(t=0,axial=0,count=count)]
  event_time=None
  for line in raw.splitlines():
   e=json.loads(line)
   for a in e['attached']:
    low=min(low,a['coords'][2]); high=max(high,a['coords'][2]); count+=1
   assert count==e['attachedCount']
   states.append(dict(t=e['simTimeSeconds'],axial=high-low,count=count))
   if 'timelineEvent' in e: event_time=e['simTimeSeconds']
  assert event_time is not None
  rows[(pressure,trigger)]=dict(states=states,event=event_time)
D=min(r['states'][-1]['t']-r['event'] for r in rows.values())
windows=dict(full=(0,D),later=(D/2,D),q3=(D/2,3*D/4),q4=(3*D/4,D))
result=[]
for pressure in ['50662p5','101325','202650']:
 contrasts={}
 for label,(a,b) in windows.items():
  adds=[]
  for trigger in [7,15]:
   r=rows[(pressure,trigger)]; ss=r['states']; ts=[s['t'] for s in ss]
   start=ss[bisect_right(ts,r['event']+a)-1]; end=ss[bisect_right(ts,r['event']+b)-1]
   adds.append(dict(axialCells=end['axial']-start['axial'],occupiedSites=end['count']-start['count']))
  contrasts[label]=dict(early=adds[0],late=adds[1],earlyMinusLateAxialCells=adds[0]['axialCells']-adds[1]['axialCells'],earlyMinusLateOccupiedSites=adds[0]['occupiedSites']-adds[1]['occupiedSites'])
 result.append(dict(pressureTag=pressure,contrasts=contrasts))
out.write_text(json.dumps(dict(scope='Independent raw attachment-coordinate calculation of H1 at-or-before axial and occupancy increments; no analysis/window helpers. Does not verify other metrics or next-event bounds.',DnewSeconds=D,results=result,inputs=inputs),indent=2)+'\n')
print(json.dumps(dict(Dnew=D,results=result)))
