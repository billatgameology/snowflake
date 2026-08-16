# Local assets — what a worktree needs that git does not carry

Most of this project's bytes are deliberately untracked: third-party media that must not be
published, and multi-GB run outputs that are reproducible. That is the right call, but it
leaves a gap this file closes — **a fresh worktree has no way to know what it is missing, or
where to get it.** Two sessions were lost to that: once concluding a dataset's images had been
destroyed in a machine transfer when they were simply in a sibling worktree, and once assuming
`research/` was empty because this worktree only carries the indexes.

Read this before concluding that something is lost.

## The trees

| Tree | Size | In git? | Where it comes from |
|---|---|---|---|
| `node_modules/` | grows | no | `npm ci`; the primary macOS copy was removed 2026-08-15. |
| Full research media cache | 2,477 registered media · 2,013,534,785 bytes | **no** — hashes/indexes only | The manifest scopes the private loose NAS tree `research-cache/content/`; a 2026-08-15 attached audit sampled 65 entries and found 65/65 present at the registered size. |
| 2026-08-15 Mac-local research snapshot | 2,974 files · 1,166,728,510 logical bytes | no | Private NAS tar `research-cache/local-worktree-archives/snowflake-main-ignored-research-20260815.tar`; complete for the former Mac subset, not the full media inventory. |
| `out/gutcheck-gg-realism/large/` | ~446 GB | no | Loose NAS mirror since 2026-08-12 (`docs/nas-ledger.json`, per-file SHA-256). Governed marker/index/streaming was executed on macOS 2026-08-15; Windows `S:/` remains unexecuted. Restore locally only for an explicit workflow. Older archive zips remain on the share. |
| `out/gutcheck-gg-realism/` workspace layer | ~800 MB | no | Loose NAS mirror since 2026-08-12 (extras pack unpacked; zip retained). The governed index reads only catalogue-approved `large/` and `gen/renders/` bytes from a validated marked share; `--detached` emits metadata without asset links. Local staging never overrides or impersonates NAS content. Restore locally only for explicit authoring workflows (photo matching, archive packing). |
| `out/gutcheck-gg-realism/site/` | ~6 GB | no | Regenerate: `node scripts/gutcheck-build-site.ts` (~5 s). |
| `out/gutcheck-gg-realism/large/anim-B-v2q/` | ~6.6 GB | no | Regenerate: `gutcheck-mesh-quantize.ts --manifest .../anim-B/manifest.json` (~25 s). |
| `out/gutcheck-gg-realism/large/gen/`, `large/anim/` | grows | no | Regenerate from the **tracked** specs: `node scripts/gutcheck-grow-batch.mjs`. |
| `out/gutcheck-gg-realism/photos/` | ~25 MB | no | Public-domain plates re-downloadable; monograph crops come from the `research/` cache. |
| Post-Phase-9 source intake | 165,706,780 recorded bytes · 24 source/raw/provenance files | no media; tracked hashes only | Private NAS: `research-cache/post-phase9-intake/20260813-unregistered-v1/`; verify with `research/phase9-post-freeze-source-intake-v1.json`. Unregistered future material, not Phase 9 evidence. |
| 2026-08-15 macOS session scratch | 348,672-byte tar · 17 members | no | Private NAS archive `out/archives/snowflake-main-local-scratch-20260815.tar`; contains the former `.claude/`, `out/`, and `tmp/` trees. |

`out/` and ignored `research/` payloads are local staging, not retention classes. Before cleanup,
claim evidence moves to tracked `evidence/`, another useful collection publishes through decision
0051, or scratch is explicitly discarded. A legacy ledger or same-NAS archive detects or supplies
some historical bytes but does not retroactively certify the whole staging tree as preserved.

## What *is* tracked, and why

- **`evidence/gutcheck-gg-realism/large-artifact-inventory.json`** — the archive-pack
  ledger: relpath + sha256 + bytes for the binaries and zip packs it has inventoried (1,640
  files at last rebuild; the live generated-output census is
  `docs/nas-ledger.json`). This is what made the machine transfer verifiable: 1,640 files
  restored, every hash checked.
- **`evidence/gutcheck-gg-realism/{specs,dialin,gen-records,fig-records}/`** — the recipes
  and run records: 226 files / ~222 KiB (measured 2026-08-12) defining ~150 crystals.
  Nothing else can regenerate them — 74 of the 93 sweep specs come from the generator but
  19 are hand-authored, and records capture runtime facts (stop reason, tick, mesh stats)
  no rerun is guaranteed to reproduce bit-for-bit. Every mesh, render and timeline
  regenerates FROM them. They lived in gitignored `out/` (force-added) until 2026-08-12;
  nothing under `out/` is tracked anymore, making ADR 0038's "out/ may be deleted at any
  time" literally true.
- **`research/media-inventory.json`** — per-file manifest of the media cache. Paths, sizes and
  hashes only, no third-party content.
- **`research/*.md`** — the provenance prose: sources, licences, crop rectangles.

## The research/ cache is on the NAS, not in a worktree

`research/*` is gitignored except the tracked indexes, datasets, inventories, and source records.
`research/media-inventory.json` registers 2,477 media paths / 2,013,534,785 bytes under the loose
private share-relative tree `research-cache/content/`. The 2026-08-15 read-only audit checked an
evenly spaced sample plus its last row: 65/65 were present regular files at the registered size
([audit](nas-inventory-audit-20260815.md)). It did not establish current all-path presence or rehash
payloads, so the tracked SHA-256 values remain expected identities rather than a new physical-tree
verification result.

The catalogue does not falsely assign that whole media overlay to one retention class. The
private owner manifest places 2,356 registered media files / 1,585,094,867 bytes in the active
private-source selector and 121 files / 428,439,918 bytes in a provisional mixed recovery selector.
The latter remains unclassified and maker-delete-only until it is split; its directory label does
not make those useful media bytes scratch.

On the same date, the complete primary-macOS `research/` subset was separately written to
`research-cache/local-worktree-archives/snowflake-main-ignored-research-20260815.tar` before the
ignored local copies were removed. The complete-tree archive intentionally includes tracked
metadata as duplicate recovery context; Git remains authoritative for those tracked paths.

The archive is 1,172,661,248 bytes with SHA-256
`535648aa42e6748853f4ac808b837f571a24a1a630f4ce6948100a0c407cde94`. Its 3,363 members are all
under `research/`, and none is an AppleDouble entry. Verification listed the final archive,
rehashed it after the `.partial` rename, extracted it into a fresh `/private/tmp` directory, and
ran `diff -qr` against the live 2,974-file / 1,166,728,510-logical-byte source tree with no
difference before deletion. This is a durable private copy on the project NAS, not an independent
off-site backup. It contains every byte that was local on this Mac, but only 1,626 of the 2,477
registered media paths (1,159,779,039 bytes); 851 registered paths / 853,755,746 bytes were absent
from the Mac before cleanup. Restoring this tar alone therefore must not be reported as a complete
media-inventory restore. It also retains the source `research/.DS_Store` member because the exact
snapshot preceded local metadata cleanup.

Consequences worth knowing before you go looking:

- `lab-validation-dataset.jsonl` records `assets.local_render` paths relative to the repo root.
  They resolve only after restoring the cache, and the specific
  `1910.06389v2-llm/page-images-extra/` path is **stale even there** — that directory holds 5
  files, not the page renders the dataset expects. The usable catalogue is
  `1910.06389v2-llm/figures.jsonl` (376 figures, 139 of them photographs) with crops under
  `figures/fig-<n>/visual.png`.
- Scripts that read this media take a `--root` so they can be pointed at a staged archive
  extraction instead of repopulating a worktree — see `gutcheck-photo-match.mjs` and
  `gutcheck-research-inventory.mjs`.

## Rights

`research/` media is third-party and mostly copyrighted (Libbrecht holds the monograph and
snowcrystals.com material; the videos exclude internet publication without permission). Bentley
plates are public domain. Restricted media and composites never enter Git or public serving.
`research/` and `out/` are only staging: useful durable restricted bytes publish to a non-served,
governed NAS collection, while material without a retention purpose is declared scratch and
discarded.

The post-Phase-9 intake follows the same private-cache rule. In particular, the Voigtländer
supplement became available only after the Phase 9 freeze, and the retained malformed Magee
download is acquisition history rather than a valid ZIP. Neither may be inferred into a completed
Phase 9 result; see the tracked intake record for exact hashes and repair details.

## Verifying, restoring, and updating

The read-only catalogue checks are safe before any restore:

```bash
npm run assets:audit
npm run assets:verify -- --collection research-private-freeze
npm run assets:verify -- --collection research-private-freeze --full
```

The first two commands inspect bounded catalogue and owner-manifest state. `--full` is an explicit
payload hash of one registered NAS collection; it can be expensive and verifies the NAS source,
not a restored destination. Restore one active legacy collection only into a fresh path below
`out/restores/`, then independently verify that destination:

The reviewed `.snowflake-nas.json` marker and empty `_control/` skeleton are installed on the
physical share, and attached owner-manifest verification passed. The first physical compatibility
restore remains pending until this implementation unit is committed; run the small registered
Phase 3 collection first, retain its staging tree, and record the result before attempting a larger
collection.

```bash
npm run assets:restore -- \
  --collection earlier-phase3-visual@2026-08-01 \
  --to out/restores/earlier-phase3-visual-2026-08-01
npm run assets:verify-restored -- \
  --collection earlier-phase3-visual@2026-08-01 \
  --from out/restores/earlier-phase3-visual-2026-08-01
```

Both commands bind the exact catalogue version and owner-manifest selection. Restore refuses an
existing destination, symlinks, hard links, aliases, and any location outside the repository's
ignored `out/restores/` staging root; it verifies the exact restored set, byte lengths, and SHA-256
values before reporting success. Source mutation or replacement observed during each
descriptor-bound copy fails closed; a later source change does not alter the already verified
destination and is outside this local staging result. Reports omit payload names and absolute
paths. This legacy compatibility path writes no durable publication/restore receipt and grants no
prune authority. Raw `rsync --ignore-existing` and raw archive extraction remain ungoverned because
they can merge stale and new trees and skip exact-set validation.

The current alias checks rescan sibling names and are structurally quadratic for a large flat
directory. The small first restore is reviewed, but a large gut-check restore has not been timed on
the NAS and must not be treated as an operationally practical recovery path until that scan is
optimized or measured. Exact reviewer measurements and limits are recorded in
[`docs/reviews/nas-asset-legacy-restore-20260815.md`](reviews/nas-asset-legacy-restore-20260815.md).

New packs use immutable content-addressed names; restore also accepts the 11 legacy
date-only names already pinned in the archive ledger.

Do not mutate an active cache in place and merely refresh `research/media-inventory.json`. Publish
a new immutable collection version, bind its owner manifest and aggregate in the catalogue, verify
the final bytes, and record a fresh restore. The media inventory remains the tracked authority for
its named scope; it does not cover every derived extraction file, and the historical complete-tree
archive is only a same-NAS snapshot of the former Mac-local subset.

The scratch archive is 348,672 bytes with SHA-256
`99dbedbe56138a775ca7c3366974459af96296d852354f98a808145f9ea44130`. Its 17 members were likewise
listed, rehashed after rename, extracted, and byte-compared before local deletion. Restore it to
an empty staging directory and select only the historical log or local setting required. The
deleted dependency trees and `app/dist/` were not archived; regenerate them with `npm ci` and the
normal build commands. Finder metadata was removed from the worktrees; the exact scratch snapshot
retains its former `out/.DS_Store` member.
