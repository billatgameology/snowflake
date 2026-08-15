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
| Full research media cache | 2,477 registered media · 2,013,534,785 bytes | **no** — hashes/indexes only | Private loose NAS tree `research-cache/content/`; all registered paths and sizes were observed there 2026-08-15. |
| 2026-08-15 Mac-local research snapshot | 2,974 files · 1,166,728,510 logical bytes | no | Private NAS tar `research-cache/local-worktree-archives/snowflake-main-ignored-research-20260815.tar`; complete for the former Mac subset, not the full media inventory. |
| `out/gutcheck-gg-realism/large/` | ~446 GB | no | Loose NAS mirror since 2026-08-12 (`docs/nas-ledger.json`, per-file SHA-256); the dev server streams it, so restore locally only when a workflow needs local bytes (e.g. the static bundle). End-to-end streaming was measured on macOS; the current Windows `S:/` path remains unexecuted. Older archive zips remain on the share. |
| `out/gutcheck-gg-realism/` workspace layer | ~800 MB | no | Loose NAS mirror since 2026-08-12 (extras pack unpacked; zip retained). **The macOS-measured index needs no local restore** — `scripts/gutcheck-build-index.ts` scans local + share merged. Restore locally only for authoring workflows (photo matching, archive packing). |
| `out/gutcheck-gg-realism/site/` | ~6 GB | no | Regenerate: `node scripts/gutcheck-build-site.ts` (~5 s). |
| `out/gutcheck-gg-realism/large/anim-B-v2q/` | ~6.6 GB | no | Regenerate: `gutcheck-mesh-quantize.ts --manifest .../anim-B/manifest.json` (~25 s). |
| `out/gutcheck-gg-realism/large/gen/`, `large/anim/` | grows | no | Regenerate from the **tracked** specs: `node scripts/gutcheck-grow-batch.mjs`. |
| `out/gutcheck-gg-realism/photos/` | ~25 MB | no | Public-domain plates re-downloadable; monograph crops come from the `research/` cache. |
| Post-Phase-9 source intake | 165,706,780 recorded bytes · 24 source/raw/provenance files | no media; tracked hashes only | Private NAS: `research-cache/post-phase9-intake/20260813-unregistered-v1/`; verify with `research/phase9-post-freeze-source-intake-v1.json`. Unregistered future material, not Phase 9 evidence. |
| 2026-08-15 macOS session scratch | 348,672-byte tar · 17 members | no | Private NAS archive `out/archives/snowflake-main-local-scratch-20260815.tar`; contains the former `.claude/`, `out/`, and `tmp/` trees. |

Calling `out/` disposable does not promise that every transient byte is backed up. Durable
provenance is tracked under `evidence/`; ledgered bulk and archives are recoverable from the
NAS; session logs and other scratch are regenerated or discarded.

## What *is* tracked, and why

- **`evidence/gutcheck-gg-realism/large-artifact-inventory.json`** — the archive-pack
  ledger: relpath + sha256 + bytes for the binaries and zip packs it has inventoried (1,640
  files at last rebuild; the live census of everything on the share is
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
The loose private tree at share-relative `research-cache/content/` is the restore source for the
full scope registered in `research/media-inventory.json`: 2,477 media paths totaling
2,013,534,785 bytes. A 2026-08-15 read-only audit found all registered paths there at their exact
recorded sizes; it did not rehash all loose NAS bytes, so the tracked SHA-256 values remain the
verification authority rather than a newly claimed hash pass.

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
plates are public domain. **Regardless of status, media and any composite built from it stays in
gitignored `out/` and is never published** — that rule predates this file and still holds.

The post-Phase-9 intake follows the same private-cache rule. In particular, the Voigtländer
supplement became available only after the Phase 9 freeze, and the retained malformed Magee
download is acquisition history rather than a valid ZIP. Neither may be inferred into a completed
Phase 9 result; see the tracked intake record for exact hashes and repair details.

## Verifying and refreshing

```bash
# Resolve this host's attached share; never bake S:/ or /Volumes into consumers
snowflake_nas_root=$(node --input-type=module -e 'import { detectNasMount } from "./scripts/nas-root.ts"; const mount = detectNasMount(); if (mount === null) throw new Error("NAS detached"); process.stdout.write(mount)')

# Restore the full registered loose cache without overwriting tracked worktree files
rsync -a --ignore-existing "${snowflake_nas_root}research-cache/content/" research/
node scripts/gutcheck-research-inventory.mjs --root research --out /tmp/check.json
jq -S '.files' /tmp/check.json >/tmp/check-files.json
jq -S '.files' research/media-inventory.json >/tmp/registered-files.json
diff /tmp/check-files.json /tmp/registered-files.json

# Verify or stage only the historical Mac-local snapshot
research_snapshot="${snowflake_nas_root}research-cache/local-worktree-archives/snowflake-main-ignored-research-20260815.tar"
shasum -a 256 "$research_snapshot"
tar -tf "$research_snapshot" >/dev/null
research_stage=$(mktemp -d /private/tmp/snowflake-research-restore.XXXXXX)
tar -xf "$research_snapshot" -C "$research_stage"
rsync -a --ignore-existing "$research_stage/research/" research/

# Inspect the archived session scratch without writing it over a live checkout
scratch_stage=$(mktemp -d /private/tmp/snowflake-scratch-restore.XXXXXX)
tar -xf "${snowflake_nas_root}out/archives/snowflake-main-local-scratch-20260815.tar" -C "$scratch_stage"

# Restore the large out/ binaries from archives
node scripts/gutcheck-archive-restore.ts <archives>/gutcheck-large-<group>-<date>-<archive-sha256>.zip

# Re-verify the large-artifact inventory after any restore
node scripts/gutcheck-archive-pack.ts        # inventory only, no --pack
```

New packs use immutable content-addressed names; restore also accepts the 11 legacy
date-only names already pinned in the archive ledger.

Regenerate `research/media-inventory.json` whenever the cache changes; it is cheap and it is
the tracked record that makes its named media scope's absence detectable. It does not cover every
derived extraction file; the complete-tree archive preserves those additional private bytes.

The scratch archive is 348,672 bytes with SHA-256
`99dbedbe56138a775ca7c3366974459af96296d852354f98a808145f9ea44130`. Its 17 members were likewise
listed, rehashed after rename, extracted, and byte-compared before local deletion. Restore it to
an empty staging directory and select only the historical log or local setting required. The
deleted dependency trees and `app/dist/` were not archived; regenerate them with `npm ci` and the
normal build commands. Finder metadata was removed from the worktrees; the exact scratch snapshot
retains its former `out/.DS_Store` member.
