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
| `node_modules/` | ~300 MB | no | `npm ci` |
| `research/` | 3.9 GB · 21,245 files · **2,477 media (2.01 GB)** | **no** — indexes only | **Main worktree only:** `G:/Code Files/snowflake/research`. Verify the media with `research/media-inventory.json`; the remaining ~18,800 files are text derived from those sources and regenerate from them. |
| `out/gutcheck-gg-realism/large/` | ~446 GB | no | Loose NAS mirror since 2026-08-12 (`docs/nas-ledger.json`, per-file SHA-256); the dev server streams it, so restore locally only when a workflow needs local bytes (e.g. the static bundle). End-to-end streaming was measured on macOS; the current Windows `S:/` path remains unexecuted. Older archive zips remain on the share. |
| `out/gutcheck-gg-realism/` workspace layer | ~800 MB | no | Loose NAS mirror since 2026-08-12 (extras pack unpacked; zip retained). **The macOS-measured index needs no local restore** — `scripts/gutcheck-build-index.ts` scans local + share merged. Restore locally only for authoring workflows (photo matching, archive packing). |
| `out/gutcheck-gg-realism/site/` | ~6 GB | no | Regenerate: `node scripts/gutcheck-build-site.ts` (~5 s). |
| `out/gutcheck-gg-realism/large/anim-B-v2q/` | ~6.6 GB | no | Regenerate: `gutcheck-mesh-quantize.ts --manifest .../anim-B/manifest.json` (~25 s). |
| `out/gutcheck-gg-realism/large/gen/`, `large/anim/` | grows | no | Regenerate from the **tracked** specs: `node scripts/gutcheck-grow-batch.mjs`. |
| `out/gutcheck-gg-realism/photos/` | ~25 MB | no | Public-domain plates re-downloadable; monograph crops come from the `research/` cache. |

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

## The research/ media is in the main worktree, not here

`research/*` is gitignored except the `.md` indexes, `lab-validation-dataset.jsonl` and the
inventory. **The image bytes exist only in `G:/Code Files/snowflake/research`.** Sibling
worktrees — this one included — carry the indexes and nothing else.

Consequences worth knowing before you go looking:

- `lab-validation-dataset.jsonl` records `assets.local_render` paths relative to the repo root.
  They resolve only in the main worktree, and the specific
  `1910.06389v2-llm/page-images-extra/` path is **stale even there** — that directory holds 5
  files, not the page renders the dataset expects. The usable catalogue is
  `1910.06389v2-llm/figures.jsonl` (376 figures, 139 of them photographs) with crops under
  `figures/fig-<n>/visual.png`.
- Scripts that read this media take a `--root` so they can be pointed at whichever checkout has
  the bytes — see `gutcheck-photo-match.mjs` and `gutcheck-research-inventory.mjs`.

## Rights

`research/` media is third-party and mostly copyrighted (Libbrecht holds the monograph and
snowcrystals.com material; the videos exclude internet publication without permission). Bentley
plates are public domain. **Regardless of status, media and any composite built from it stays in
gitignored `out/` and is never published** — that rule predates this file and still holds.

## Verifying and refreshing

```bash
# What research/ media should be present, and whether it is
node scripts/gutcheck-research-inventory.mjs --root <path/to/research> --out /tmp/check.json
# ...then diff /tmp/check.json against research/media-inventory.json

# Restore the large out/ binaries from archives
node scripts/gutcheck-archive-restore.ts <archives>/gutcheck-large-<group>-<date>-<archive-sha256>.zip

# Re-verify the large-artifact inventory after any restore
node scripts/gutcheck-archive-pack.ts        # inventory only, no --pack
```

New packs use immutable content-addressed names; restore also accepts the 11 legacy
date-only names already pinned in the archive ledger.

Regenerate `research/media-inventory.json` whenever the cache changes; it is cheap and it is
the only thing that makes the cache's absence detectable.
