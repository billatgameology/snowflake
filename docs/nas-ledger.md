# NAS ledger — where the big outputs live

Everything too large for git is on the NAS share `\\GameStation\snowcrystal`, mounted as
**`S:`** (persistent mapping). The NAS copy mirrors repo-relative paths under `S:\` — e.g.
`out/gutcheck-gg-realism/large/gen/sweep-t1-r0p1-mesh.bin` lives at
`S:\out\gutcheck-gg-realism\large\gen\sweep-t1-r0p1-mesh.bin`.

The machine-readable twin, **`docs/nas-ledger.json`**, lists every moved file with its
byte size and pre-move **SHA-256** — the bytes are a cache, the provenance is the record
(same doctrine as `research/media-inventory.json`). Verify or re-fetch any file against it.

## Moves

| date | what | files | size | verification |
| --- | --- | --- | --- | --- |
| 2026-08-08 | `archives/` zip packs, `large/anim-B-v2q`, `large/checkpoints` (parked on lifework, migrated here 2026-08-12) | 15 | 20.4 GB | robocopy size/timestamp |
| 2026-08-10 | f2 state checkpoint → `large/checkpoints/` | 1 | 0.41 GB | size |
| 2026-08-12 | **all of `large/**`** (final meshes, growth timelines incl. the 13,454-frame f2, paper-figure meshes, anim-B) **+ `gen/renders`** | 21,480 | 446.3 GB | SHA-256 inventory + 35-file spot re-hash from NAS (35 ok, 0 bad) |

## How the site uses this

`scripts/gutcheck-build-index.ts` auto-detects `S:\out\gutcheck-gg-realism` and links all
bulk artifacts there (`GUTCHECK_BULK_ROOT` overrides). The Vite dev server allows `S:` in
`server.fs.allow`. With the NAS attached, stills, 3D viewers and growth timelines all work;
detached, the index falls back to local paths (which are empty for bulk) — rebuild after
re-attaching.

## Restoring / adding

Restore any directory by mirroring the path back:

```powershell
robocopy "S:\out\gutcheck-gg-realism\large\anim\dialin-b1p3-800" `
         "G:\Code Files\snowflake-gutcheck-gg-realism\out\gutcheck-gg-realism\large\anim\dialin-b1p3-800" /E
```

New grow outputs land locally; after rendering, move them to `S:` (mirrored path), append
to `docs/nas-ledger.json` (path/bytes/sha256), and rebuild the index.

Historical note: the first moves were ledgered in `out/gutcheck-gg-realism/MOVED-TO-NAS.md`
(untracked); this document supersedes it.
