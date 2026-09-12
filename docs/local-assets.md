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
| Full research media cache | 2,477 registered media · 2,013,534,785 bytes | **no** — hashes/indexes only | Private collection `collections/research-private-freeze/2026-08-11/payload/`; all media-inventory rows are within its 3,778-file owner manifest. |
| 2026-08-15 Mac-local research snapshot | 2,974 files · 1,166,728,510 logical bytes | no | Private collection `collections/research-mac-snapshot/2026-08-15/payload/`; complete for the former Mac subset, not the full media inventory. |
| Gut-check generated assets | 22,190 files · 457,429,171,007 bytes | no | Public generated collection `collections/gutcheck-generated-public/2026-08-15/payload/`, owned by `docs/nas-ledger.json`. Only `large/` and `gen/renders/` are served. |
| Gut-check generated diagnostic frames | 434 files · 666,233,360 bytes | no | Active non-served generated-cache collection `collections/gutcheck-generated-diagnostic-frames/2026-08-15/payload/`, owned by `docs/nas-ledger.json`. |
| Gut-check redundant Git-record mirrors | 128 files · 174,537 bytes | no | Catalogue disposition `gutcheck-git-record-mirrors@2026-08-15` is unavailable; bytes are preserved in the dated private gutcheck quarantine batch, while tracked Git records remain authoritative. |
| Gut-check unresolved remainder | 369 files · 167,584,091 bytes | no | Catalogue disposition `gutcheck-workspace-remainder@2026-08-15` is unavailable; mixed/private bytes are preserved in the same dated quarantine batch pending classification or maker-approved disposal. |
| `out/gutcheck-gg-realism/site/` | ~6 GB | no | Regenerate: `node scripts/gutcheck-build-site.ts` (~5 s). |
| `out/gutcheck-gg-realism/large/anim-B-v2q/` | ~6.6 GB | no | Regenerate: `gutcheck-mesh-quantize.ts --manifest .../anim-B/manifest.json` (~25 s). |
| `out/gutcheck-gg-realism/large/gen/`, `large/anim/` | grows | no | Regenerate from the **tracked** specs: `node scripts/gutcheck-grow-batch.mjs`. |
| `out/gutcheck-gg-realism/photos/` | ~25 MB | no | Public-domain plates re-downloadable; monograph crops come from the `research/` cache. |
| Post-Phase-9 source intake | 26 files · 165,722,101 bytes | no media; tracked hashes only | Private provisional collection `collections/post-phase9-intake/2026-08-13/payload/`. Unregistered future material, not Phase 9 evidence. |
| 2026-08-15 macOS session scratch | 348,672-byte tar · 17 members | no | Non-served collection `collections/out-legacy-scratch-archives/2026-08-15/payload/`; contains the former `.claude/`, `out/`, and `tmp/` trees. |

`out/` and ignored `research/` payloads are local staging, not retention classes. Before cleanup,
claim evidence moves to tracked `evidence/`, another useful collection publishes through decision
0051, or scratch is explicitly discarded. A legacy ledger or same-NAS archive detects or supplies
some historical bytes but does not retroactively certify the whole staging tree as preserved.

The NAS layout has one rule for future work: durable bytes go to
`collections/<asset-id>/<version>/payload/`; unresolved bytes awaiting a decision go to a dated
`_control/quarantine/unresolved/<batch-id>/` batch. Public-safe owner manifests go to
`docs/nas-assets/manifests/<asset-id>/<version>.json`; private-name manifests go to
`collections/<asset-id>/<version>/manifest.private.jsonl`. Every collection is registered in
`docs/nas-assets.json`. Do not create another top-level project data root.

## Standard procedure for a new retained collection

1. **Classify before copying.** Inventory the staging tree, decide its single storage class,
   rights/privacy/serve policy, retention, reproducibility, restore requirement, and backup
   requirement. Claim-bearing project-owned bytes that fit Git go to `evidence/`; declared scratch
   is discarded; only the remaining durable large/private bytes use a NAS collection.
2. **Register the intent.** Choose `<asset-id>@<version>` and add a provisional
   `docs/nas-assets.json` entry before durable placement. The version is immutable; changed bytes
   require a new version rather than an in-place refresh.
3. **Use the standard paths.** Payload:
   `collections/<asset-id>/<version>/payload/`. Public manifest:
   `docs/nas-assets/manifests/<asset-id>/<version>.json`. Private manifest:
   `collections/<asset-id>/<version>/manifest.private.jsonl`. Unresolved material:
   `_control/quarantine/unresolved/<batch-id>/`. No other project top-level NAS root is allowed.
4. **Publish copy-first.** Scan stable regular files, copy into unique same-share `_control/`
   staging, compare source and stage by path/length/SHA-256, place into an absent final envelope,
   re-hash the final bytes, and write the publication record. Never merge into an existing target.
5. **Bind and verify.** Bind the exact owner-manifest bytes/digest/aggregate in the catalogue and
   run `npm run assets:verify -- --collection <asset-id>@<version> --full`.
6. **Prove recovery.** Restore into a fresh `out/restores/` target and run
   `npm run assets:verify-restored`. Commit the catalogue, public manifest or private binding,
   provenance/recipe, verification result, and restore procedure as one coherent Git unit.
7. **Prune separately.** Local deletion requires a reviewed exact file list, committed bindings,
   successful restore, and every class-specific independent-backup requirement. Without that, the
   source stays in staging or moves to quarantine.

Generic forward publication/pruning is intentionally not exposed as an npm command. Until a real
use justifies that interface, the collection's bounded plan records the exact copy, hash, receipt,
restore, and verification commands. Raw copy commands can transport bytes, but cannot by themselves
earn a preservation or deletion claim.

### Enforcement

- `AGENTS.md` Rule 15 makes the lifecycle mandatory for every coding agent; Rule 16 prevents task
  worktrees and branches from accumulating without a pre-PR disposition audit.
- `docs/nas-assets.json` is parsed fail-closed. Its tests reject unsafe paths, aliases, ownership
  overlap, missing policy fields, invalid private/public serving, and broken manifest bindings.
- `assets:audit` checks bounded share layout and classification; `assets:verify` binds catalogue and
  owner-manifest aggregates and can explicitly hash one collection's payload.
- The marked-share resolver refuses detached, conflicting, aliased, symlinked, or hard-linked
  paths. The development server serves only catalogue-approved generated prefixes.
- `npm test` runs Rule 7, both typechecks, and the catalogue/resolver/audit/restore/serving tests.
- No generic prune command exists. Existing legacy restore emits no durable receipt and therefore
  cannot authorize deletion; missing records fail closed rather than becoming an informal bypass.

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
`research/media-inventory.json` registers 2,477 media paths / 2,013,534,785 bytes now held within
`collections/research-private-freeze/2026-08-11/payload/`. The 2026-08-15 read-only audit checked an
evenly spaced sample plus its last row: 65/65 were present regular files at the registered size
([audit](nas-inventory-audit-20260815.md)). It did not establish current all-path presence or rehash
payloads, so the tracked SHA-256 values remain expected identities rather than a new physical-tree
verification result.

The 2026-08-16 organization pass separated the historical mixed selector. All 2,477 registered
media paths are now within the active private-source collection; its owner manifest contains 3,778
files / 2,024,519,833 bytes. That scope includes 15 previously unmanifested inputs directly used
by the tracked Phase 9 replay. The remaining 72,870 recovery-or-scratch rows, 20 redundant tracked
records, 179 formerly unmanifested content files, and bounded residue moved to private quarantine.
Quarantine is custody pending classification or maker-approved disposal, not a durable collection.

On the same date, the complete primary-macOS `research/` subset was separately written to
`collections/research-mac-snapshot/2026-08-15/payload/snowflake-main-ignored-research-20260815.tar` before the
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

The reviewed `.snowflake-nas.json` marker and `_control/` skeleton are installed on the physical
share, and attached owner-manifest verification passed. After commit `b9b7b40`, the first physical
compatibility restore and destination verification both passed for the registered Phase 3
collection: 10 files / 984,164 bytes, tree SHA-256
`73a9f672d9e803854ec8c82a2a0e0192f448989984ce30772e768b20644d3faf`
([record](nas-bootstrap-audit-20260815.md#first-physical-compatibility-restore)).

The restore implementation now snapshots and revalidates each sibling namespace a bounded number
of times per directory, independent of the flat-file count.
After the gutcheck remainder correction, a fresh physical macOS restore and independent
destination verification passed for `gutcheck-generated-diagnostic-frames@2026-08-15`: 434 files /
666,233,360 bytes, tree SHA-256
`d223ded77137f5fb2bd0bdb73d40def04d2ec6df8aa3000d87ecd034774e572b`. The diagnostic staging
tree remains at `out/restores/gutcheck-generated-diagnostic-frames-2026-08-15-correction` until
its exact cleanup is separately approved; the historical Phase 3 staging is absent. This
demonstrates the corrected 666 MB collection, not the 457 GB generated-public collection.

```bash
npm run assets:restore -- \
  --collection earlier-phase3-visual@2026-08-01 \
  --to out/restores/earlier-phase3-visual-2026-08-01
npm run assets:verify-restored -- \
  --collection earlier-phase3-visual@2026-08-01 \
  --from out/restores/earlier-phase3-visual-2026-08-01

# Exact path used for the 2026-08-16 diagnostic recovery proof:
npm run assets:restore -- \
  --collection gutcheck-generated-diagnostic-frames@2026-08-15 \
  --to out/restores/gutcheck-generated-diagnostic-frames-2026-08-15-correction
npm run assets:verify-restored -- \
  --collection gutcheck-generated-diagnostic-frames@2026-08-15 \
  --from out/restores/gutcheck-generated-diagnostic-frames-2026-08-15-correction
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

The former structurally quadratic alias scan and its synthetic measurements remain useful history;
the implementation has since been replaced with directory-level namespace scans and adversarial
coverage. The exact reviewer record and its post-correction addendum are in
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
