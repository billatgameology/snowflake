"""Bounded archive preparation for the sources in the sibling source record; no deletion."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import tarfile
import unicodedata

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SOURCES = json.loads((HERE / '2026-10-21-sources.json').read_text(encoding='utf-8'))['sources']
PAYLOAD = ROOT / 'out/nas-save-hil-exploration-2026-10-21/payload'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def selected(source):
    base = Path(source['root']).resolve()
    found = {}
    for relative in source['include']:
        top = base / relative
        if not top.exists():
            raise RuntimeError(f'Missing registered source: {top}')
        entries = [top, *top.rglob('*')] if top.is_dir() else [top]
        for path in entries:
            if path == base:
                continue
            name = path.relative_to(base).as_posix()
            found[name] = path
    folded = set()
    for name, path in sorted(found.items()):
        alias = unicodedata.normalize('NFC', name).casefold()
        assert alias not in folded, f'Portable path alias: {name}'
        folded.add(alias)
        assert not path.is_symlink() and not path.is_junction(), f'Link refused: {name}'
        status = path.lstat()
        assert stat.S_ISDIR(status.st_mode) or stat.S_ISREG(status.st_mode), f'Special file: {name}'
        assert not stat.S_ISREG(status.st_mode) or status.st_nlink == 1, f'Hard link: {name}'
        yield name, path, status


def pack(source):
    label = source['label']
    archive = PAYLOAD / f'{label}-output.tar.gz'
    record = PAYLOAD / f'{label}-archive.json'
    assert not archive.exists() and not record.exists(), f'Existing output refused: {label}'
    entries = list(selected(source))
    inventory = []
    # Source hashes are taken before packing and checked again after packing. Retained producers
    # are quiescent; this detects ordinary changes without changing source bytes or their location.
    for name, path, status in entries:
        row = {'path': name, 'kind': 'directory' if path.is_dir() else 'file'}
        if row['kind'] == 'file':
            row.update(bytes=status.st_size, sha256=digest(path))
        inventory.append(row)
    with tarfile.open(archive, 'x:gz', compresslevel=1, dereference=False) as packed:
        for name, path, _ in entries:
            packed.add(path, arcname=name, recursive=False)
    after = list(selected(source))
    assert [n for n, _, _ in after] == [n for n, _, _ in entries], label
    for row, (_, path, status) in zip(inventory, after):
        if row['kind'] == 'file':
            assert status.st_size == row['bytes'] and digest(path) == row['sha256'], path
    files = [r for r in inventory if r['kind'] == 'file']
    result = {'label': label, 'source': source, 'archive': archive.name,
              'archiveBytes': archive.stat().st_size, 'archiveSha256': digest(archive),
              'inventory': {'files': len(files), 'bytes': sum(r['bytes'] for r in files),
                            'entries': inventory}, 'originalsRetained': True}
    record.write_bytes((json.dumps(result, indent=2) + '\n').encode('utf-8'))
    return {k: result[k] for k in ('label', 'archiveBytes', 'archiveSha256')} | {
        'files': len(files), 'bytes': result['inventory']['bytes']}


if __name__ == '__main__':
    wanted = set(sys.argv[1:])
    assert wanted and wanted <= {s['label'] for s in SOURCES}, 'Pass exact registered source labels'
    PAYLOAD.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(pack, s) for s in SOURCES if s['label'] in wanted]
        for future in concurrent.futures.as_completed(futures):
            print(json.dumps(future.result()), flush=True)
