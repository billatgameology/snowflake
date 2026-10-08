import json, pathlib, tarfile, hashlib, shutil, datetime
root=pathlib.Path.cwd()
op=root/'out/nas-save-bld-2026-10-08'
evidence=root/'evidence/bld-first-batch-2026-10-08'
evidence.mkdir(exist_ok=False)
inventory=json.loads((op/'payload-inventory.json').read_text())
rows=inventory['files']
records=[]
for name in ['batch1-bld-resumable','batch1-bld-resumable-probe','batch1-bld-resumable-control']:
    selected=[r for r in rows if r['path'].startswith(name+'/')]
    expected={'out/'+r['path']:r for r in selected}
    target=evidence/(name+'.tar.gz')
    print('packing '+name,flush=True)
    with tarfile.open(target,'w:gz',compresslevel=6) as archive:
        for row in selected:
            archive.add(op/'payload'/row['path'],arcname='out/'+row['path'],recursive=False)
    seen=set()
    with tarfile.open(target,'r:gz') as archive:
        for member in archive:
            assert member.isfile() and member.name in expected and member.name not in seen
            seen.add(member.name)
            row=expected[member.name]
            assert member.size==row['byteLength']
            h=hashlib.sha256()
            with archive.extractfile(member) as data:
                while True:
                    chunk=data.read(1024*1024)
                    if not chunk: break
                    h.update(chunk)
            assert h.hexdigest()==row['sha256'], member.name
    assert seen==set(expected)
    compressed=target.stat().st_size
    assert compressed<100_000_000, 'Archive needs splitting for Git'
    record={'archive':target.name,'files':len(selected),'rawBytes':sum(r['byteLength'] for r in selected),'archiveBytes':compressed,'archiveSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'allDecompressedMembersMatch':True}
    records.append(record)
    print(json.dumps(record),flush=True)
shutil.copyfile(op/'payload-inventory.json',evidence/'payload-members.json')
shutil.copyfile(op/'run.mjs',evidence/'preservation-invocation.mjs')
shutil.copyfile(op/'prepared.json',evidence/'prepared.json')
for src,dst in [('batch1-bld-resumable/summary.json','summary.json'),('batch1-bld-resumable/campaign.json','campaign.json'),('batch1-bld-resumable/attempt-0001-complete.json','launch-complete.json'),('batch1-bld-resumable-probe/probe.json','probe.json'),('batch1-bld-resumable-control/launch-direct-20261008-071154.exit.json','launch-exit.json')]:
    shutil.copyfile(op/'payload'/src,evidence/dst)
receipt={'checkedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'archives':records,'files':sum(r['files'] for r in records),'rawBytes':sum(r['rawBytes'] for r in records),'archiveBytes':sum(r['archiveBytes'] for r in records),'originalsRetained':True}
(evidence/'archive-verification.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt),flush=True)
