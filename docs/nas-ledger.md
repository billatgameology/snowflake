# NAS ledger — where the big outputs live

This ledger covers generated outputs moved to the NAS share `\\GameStation\snowcrystal`; it is
not an inventory of every untracked local asset (the `research/` cache remains in the main
worktree; see `docs/local-assets.md`). The NAS copy mirrors repo-relative paths under the share
root — e.g.
`out/gutcheck-gg-realism/large/gen/sweep-t1-r0p1-mesh.bin` lives at
`<share>/out/gutcheck-gg-realism/large/gen/sweep-t1-r0p1-mesh.bin`.

## Attaching the share

Only the local mount prefix differs between the two hosts this repo is worked from; everything
below it is identical.

| host | mount | how |
| --- | --- | --- |
| Windows | `S:\` | persistent drive mapping to `\\GameStation\snowcrystal` |
| macOS | `/Volumes/snowcrystal` | SMB — Finder ⌘K `smb://GameStation/snowcrystal`, or `mount_smbfs //<user>@GameStation/snowcrystal /Volumes/snowcrystal` after `mkdir`ing the mount point |

`scripts/nas-root.ts` resolves which of those is attached (probing for
`<mount>/out/gutcheck-gg-realism/large`), and `GUTCHECK_NAS_ROOT` overrides it for any other
mount point. Both the index builder and the dev server ask it, so neither hardcodes a drive.

The machine-readable twin, **`docs/nas-ledger.json`**, lists every moved file with its
byte size and pre-move **SHA-256** — the bytes are a cache, the provenance is the record
(same doctrine as `research/media-inventory.json`). Verify or re-fetch any file against it.

## Moves

| date | what | files | size | verification |
| --- | --- | --- | --- | --- |
| 2026-08-08 | `archives/` zip packs, `large/anim-B-v2q`, `large/checkpoints` (parked on lifework, migrated here 2026-08-12) | 15 | 20.4 GB | robocopy size/timestamp |
| 2026-08-10 | f2 state checkpoint → `large/checkpoints/` | 1 | 0.41 GB | size |
| 2026-08-12 | **all of `large/**`** (final meshes, growth timelines incl. the 13,454-frame f2, paper-figure meshes, anim-B) **+ `gen/renders`** | 21,480 | 446.3 GB | SHA-256 inventory + 35-file spot re-hash from NAS (35 ok, 0 bad) |
| 2026-08-12 | extras pack **unpacked loose** at mirrored paths (zip retained; composites, style heroes, videos, photos, working artifacts) + legacy `gen/*-record.json` copies (the authoritative tracked copies now live under `evidence/gutcheck-gg-realism/gen-records/`) | 931 | 0.83 GB | every loose file re-hashed from the NAS after placement |
| 2026-08-12 | mac `out/` cleanup 1/2: `phase3-visual`, `wp3-review-phase4`, `phase6-arm64` mirrored loose at repo-relative paths (mac-local copies removed after verification) | 86 | 3.6 MB | per-file SHA-256 re-hash from the share; `phase3-visual` also re-verified against `evidence/OUT-TREES-MANIFEST.json` (10/10) |
| 2026-08-12 | mac `out/` cleanup 2/2: superseded phase 2a/2b/3 root scratch + session check dir → `out/archives/out-root-scratch-mac-20260812.zip` (disposable class per ADR 0038) | 1 | 41.7 MB | zip SHA-256 match local vs share + `unzip -t` CRC pass |
| 2026-08-15 | two rejected D-BT independent-verification candidates mirrored loose under `out/debug/` (historical assurance-debug material, **not evidence**) | 10 | 85,153 B | source/staging inventories matched; every final file re-hashed against `docs/nas-ledger.json` |

## Separate post-Phase-9 research intake

Third-party source bytes are outside this generated-output ledger. A closeout audit found fourteen
unique payloads acquired only after Phase 9 froze, including the previously absent Voigtländer S1/S2
supplement. They are privately archived at
`research-cache/post-phase9-intake/20260813-unregistered-v1/` and hash-bound by
[`research/phase9-post-freeze-source-intake-v1.json`](../research/phase9-post-freeze-source-intake-v1.json).
Their status is **unregistered post-Phase-9 intake**: they changed future source availability, not
the historical shelf, scores, evidence, promotions, or validation status.

## How the site uses this

**Measured on macOS (2026-08-12): the full index builds and streams end-to-end.** The
Windows `S:/` path is preserved by construction — the emitted URL rule was byte-compared
against the pre-change implementation — but has not been independently re-run on that host.
Mechanism: `scripts/gutcheck-build-index.ts` auto-detects `<mount>/out/gutcheck-gg-realism`
and links all bulk artifacts there (`GUTCHECK_BULK_ROOT` overrides), writing
`/nas/<share-relative path>` URLs that carry **no** mount prefix; the dev server's `/nas`
route (`app/vite.config.ts`) re-attaches whatever prefix the serving host has. That
construction is mount-agnostic, but only the macOS path has been exercised end-to-end. With
the NAS attached on that measured path, stills, 3D viewers and growth timelines work;
detached, the index falls back to local paths (which are empty for bulk) — rebuild after
re-attaching. Do not upgrade this to a Windows claim until the current `S:/` path is executed.

The static Track A bundle (`scripts/gutcheck-build-site.ts`) is a different consumer: a
shippable bundle must carry real bytes, so it hardlinks from the **local** tree only and is
deliberately not NAS-aware — hardlinks cannot cross volumes, and copying the 6.2 GB timeline
off the share on every build is worse than the restore-once doctrine above. Known gap
(2026-08-12, not yet fixed): with `large/anim-B-v2q` absent locally it emits a bundle with no
growth timeline and no view-profiles section, and that omission does **not** appear in its
skipped-sources report. Restore that directory to its mirrored local path before building a
timeline-bearing bundle.

**A fresh macOS worktree needed no archive restore for the index** (measured 2026-08-12). The builder scans
each artifact directory locally *and* on the share, merged with the local copy winning a
filename collision, so the composites, style heroes, videos and photos (unpacked loose from
the extras pack — see the moves row) stream like everything else, and the recipes/records
come with git (`evidence/gutcheck-gg-realism/`, pinned in `evidence/MANIFEST.json`). On the
measured macOS path with the share attached:

```bash
node scripts/gutcheck-build-index.ts && npm run dev   # then open /gutcheck-index.html
```

Local copies of the extras remain optional — authoring workflows (photo matching, the static
bundle, archive packing) still read the local tree.

## Restoring / adding

Restore any directory by mirroring the path back:

```powershell
robocopy "S:\out\gutcheck-gg-realism\large\anim\dialin-b1p3-800" `
         "G:\Code Files\snowflake-gutcheck-gg-realism\out\gutcheck-gg-realism\large\anim\dialin-b1p3-800" /E
```

```bash
rsync -a "/Volumes/snowcrystal/out/gutcheck-gg-realism/large/anim/dialin-b1p3-800/" \
         "$REPO/out/gutcheck-gg-realism/large/anim/dialin-b1p3-800/"
```

The retained extras zip is a historical private backup; the normal index reads the loose share
mirror and needs no archive restore. When an authoring workflow needs local workspace bytes,
use the verified restore command rather than raw `unzip`, which bypasses the archive ledger and
member checks. The zip also contains legacy recipe/record copies under `out/`; the tracked
copies under `evidence/gutcheck-gg-realism/` remain authoritative and win index collisions.

```bash
node scripts/gutcheck-archive-restore.ts \
  /Volumes/snowcrystal/out/gutcheck-gg-realism/archives/gutcheck-large-extras-20260807.zip \
  && node scripts/gutcheck-build-index.ts
```

New bulk grow outputs land locally under `out/`; `gutcheck-grow-batch.mjs` writes the tracked
record under `evidence/gutcheck-gg-realism/gen-records/` and re-pins that subtree. After
rendering, move the bulk outputs to the share (mirrored path), append them to
`docs/nas-ledger.json` (path/bytes/sha256), and rebuild the index. A direct
`gutcheck-grow-params.ts` invocation needs `npm run evidence:pin` after its record write.

Historical note: the first moves were ledgered in `out/gutcheck-gg-realism/MOVED-TO-NAS.md`
(untracked); this document supersedes it.
