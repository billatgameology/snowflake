"""Replay the retired HIL archive-member check on a freshly restored NAS payload."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import tarfile

payload = Path(sys.argv[1]).resolve()
results = []
for label in ("hil-first-batch", "discovery-resume", "hil-exploration-batch2"):
    record = json.loads((payload / f"{label}-archive.json").read_text())
    archive = payload / record["archive"]
    assert archive.stat().st_size == record["archiveBytes"], label
    with archive.open("rb") as stream:
        assert hashlib.file_digest(stream, "sha256").hexdigest() == record["archiveSha256"], label
    expected = {entry["path"]: entry for entry in record["inventory"]["entries"]}
    assert len(expected) == len(record["inventory"]["entries"]), "duplicate inventory path"
    seen = set()
    count = total = 0
    with tarfile.open(archive, "r:gz") as packed:
        for member in packed:
            name = member.name.rstrip("/")
            assert name not in seen and name in expected, (label, name)
            assert not PurePosixPath(name).is_absolute() and ".." not in PurePosixPath(name).parts
            seen.add(name)
            entry = expected[name]
            if entry["kind"] == "directory":
                assert member.isdir(), name
            else:
                assert entry["kind"] == "file" and member.isfile() and member.size == entry["bytes"], name
                with packed.extractfile(member) as stream:
                    assert hashlib.file_digest(stream, "sha256").hexdigest() == entry["sha256"], name
                count += 1
                total += member.size
    assert seen == set(expected), label
    assert count == record["inventory"]["files"] and total == record["inventory"]["bytes"], label
    results.append({"label": label, "files": count, "bytes": total, "archiveSha256": record["archiveSha256"], "allMembersMatch": True})
print(json.dumps({"restoredPayload": str(payload), "archives": results, "files": sum(r["files"] for r in results), "bytes": sum(r["bytes"] for r in results)}, indent=2))
