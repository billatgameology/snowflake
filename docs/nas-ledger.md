# NAS ledger — where the big outputs live

This ledger covers generated outputs moved to the NAS share `\\GameStation\snowcrystal`; it is
not an inventory of every untracked asset. The separate private research cache is under
share-relative `research-cache/content/`, with its Mac-local snapshot under
`research-cache/local-worktree-archives/`; see `docs/local-assets.md`. This ledger's generated
output copy mirrors repo-relative paths under the share root — e.g.
`out/gutcheck-gg-realism/large/gen/sweep-t1-r0p1-mesh.bin` lives at
`<share>/out/gutcheck-gg-realism/large/gen/sweep-t1-r0p1-mesh.bin`.

## Attaching the share

Only the local mount prefix differs between the two hosts this repo is worked from; everything
below it is identical.

| host | mount | how |
| --- | --- | --- |
| Windows | `S:\` | persistent drive mapping to `\\GameStation\snowcrystal` |
| macOS | `/Volumes/snowcrystal` | SMB — Finder ⌘K `smb://GameStation/snowcrystal`, or `mount_smbfs //<user>@GameStation/snowcrystal /Volumes/snowcrystal` after `mkdir`ing the mount point |

`scripts/nas-root.ts` accepts a root only when its ordinary, non-linked
`.snowflake-nas.json` marker has the exact project identity. `VCC_NAS_ROOT` is canonical;
`GUTCHECK_NAS_ROOT` is a temporary compatibility alias and is accepted alongside it only when
both resolve to the same validated share. The index builder, read-only asset tools and dev server
use that resolver, so none hardcodes a drive or guesses identity from a familiar directory.

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

**Historical measurement on macOS (2026-08-12): the pre-governance full index built and streamed
end-to-end.** The current governed contract is narrower and has fixture coverage but has not yet
been exercised against the physical marker: `scripts/gutcheck-build-index.ts` reads only a
validated share and emits URLs under the catalogue-approved `out/gutcheck-gg-realism/large` and
`out/gutcheck-gg-realism/gen/renders` prefixes. The dev server authorizes that same logical path,
then attaches the host mount and opens the file without following links. Private/mixed roots,
including `photos/`, `figs/` and workspace-root media, are not indexed or served. `--detached`
produces an explicit metadata-only index; it never falls back to local `out/` bytes. Windows
`S:/` remains construction-tested only and needs an executed host check before a cross-host
durability claim.

The static Track A bundle (`scripts/gutcheck-build-site.ts`) is a different consumer: a
shippable bundle must carry real bytes, so it hardlinks from the **local** tree only and is
deliberately not NAS-aware — hardlinks cannot cross volumes, and copying the 6.2 GB timeline
off the share on every build is worse than the restore-once doctrine above. Known gap
(2026-08-12, not yet fixed): with `large/anim-B-v2q` absent locally it emits a bundle with no
growth timeline and no view-profiles section, and that omission does **not** appear in its
skipped-sources report. Restore that directory to its mirrored local path before building a
timeline-bearing bundle.

The tracked recipes/records come with every worktree
(`evidence/gutcheck-gg-realism/`, pinned in `evidence/MANIFEST.json`). A normal index build needs
the validated share for asset rows; a deliberately detached metadata-only build does not:

```bash
node scripts/gutcheck-build-index.ts && npm run dev   # then open /gutcheck-index.html
node scripts/gutcheck-build-index.ts --detached       # metadata only; no /nas asset links
```

Local copies remain explicit authoring inputs only — photo matching, the static bundle and archive
packing may read a restored staging tree, but the served index never merges or prefers it.

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

The retained extras zip is a historical private backup. When an authoring workflow needs local workspace bytes,
use the verified restore command rather than raw `unzip`, which bypasses the archive ledger and
member checks. The zip also contains legacy recipe/record copies under `out/`; the tracked
copies under `evidence/gutcheck-gg-realism/` remain authoritative, and the index ignores the
legacy copies.

```bash
snowflake_nas_root=$(node --input-type=module -e 'import { detectNasMount } from "./scripts/nas-root.ts"; const mount = detectNasMount(); if (mount === null) throw new Error("NAS detached"); process.stdout.write(mount)')
node scripts/gutcheck-archive-restore.ts \
  "${snowflake_nas_root}out/gutcheck-gg-realism/archives/gutcheck-large-extras-20260807.zip"
```

New bulk grow outputs land locally under `out/`; `gutcheck-grow-batch.mjs` writes the tracked
record under `evidence/gutcheck-gg-realism/gen-records/` and re-pins that subtree. While NAS
transaction tooling is being completed, keep new bulk output in local staging rather than
manually copying it and editing the legacy ledger. Publication will require a declared collection,
stable source/stage/final verification and a tracked receipt. A direct `gutcheck-grow-params.ts`
invocation still needs `npm run evidence:pin` after its record write.

Historical note: the first moves were ledgered in `out/gutcheck-gg-realism/MOVED-TO-NAS.md`
(untracked); this document supersedes it.
