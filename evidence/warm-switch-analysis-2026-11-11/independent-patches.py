from pathlib import Path
import json,hashlib
root=Path('C:/Users/biao3/Documents/GitHub/snowflake/out/restores/bld-growth-dynamics-hil-20261024T2048/extracted/bld-growth-dynamics-oct21/rows')
out=Path('C:/Users/biao3/Documents/GitHub/snowflake/out/warm-switch-analysis-2026-11-11/independent-patches.json')
rows={}; inputs=[]
for t in ['4p5','5']:
 for width in [3,4]:
  rid=f'gd21-bld-w1-t{t}-c025-early5-w3' if width==3 else f'gd21-bld-w2-t{t}-w4-early5'
  p=root/rid/'events.jsonl'; raw=p.read_bytes();inputs.append(dict(path=str(p),sha256=hashlib.sha256(raw).hexdigest()))
  cells={(i,j,0) for i in range(-2,3) for j in range(-2,3) if max(abs(i),abs(j),abs(i+j))<=2}
  for line in raw.splitlines():
   e=json.loads(line)
   if e['simTimeSeconds']>5.05:break
   for a in e['attached']: cells.add(tuple(x-32 for x in a['coords']))
  rows[(t,width)]=cells
expected={(i,j,k) for k in [-1,1] for i in range(-1,2) for j in range(-1,2) if max(abs(i),abs(j),abs(i+j))<=1}
result=[]
for t in ['4p5','5']:
 a=rows[(t,3)]; b=rows[(t,4)];assert a<=b;assert b-a==expected;assert (len(a),len(b))==(109,123)
 result.append(dict(temperatureTag=t,width3Sites=len(a),width4Sites=len(b),width4OnlyCoordinates=sorted(b-a),width3OnlyCoordinates=sorted(a-b)))
out.write_text(json.dumps(dict(scope='Independent direct coordinate-set calculation at age5.05s using last event at/before age; no geometry or cavity helper. Does not verify other readouts or physical causality.',results=result,inputs=inputs),indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
