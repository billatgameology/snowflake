# NAS ledger — where the big outputs live

This ledger owns generated outputs on the NAS share `\\GameStation\snowcrystal`; it is not an
inventory of every untracked asset. Its live rows use canonical
`collections/<asset-id>/<version>/payload/` locators. Private collections and private manifests
are bound separately by `docs/nas-assets.json`; see `docs/local-assets.md`.

## Attaching the share

Both host mount names address the same configured share, and canonical catalogue locators do not
embed either prefix. The governed flow was executed on macOS; Windows `S:/` path, case, Unicode,
ACL, and restore behavior remains unverified.

| host | mount | how |
| --- | --- | --- |
| Windows | `S:\` | persistent drive mapping to `\\GameStation\snowcrystal` |
| macOS | `/Volumes/snowcrystal` | SMB — Finder ⌘K `smb://GameStation/snowcrystal`, or `mount_smbfs //<user>@GameStation/snowcrystal /Volumes/snowcrystal` after `mkdir`ing the mount point |

`scripts/nas-root.ts` accepts a root only when its ordinary, non-linked
`.snowflake-nas.json` marker has the exact project identity. `VCC_NAS_ROOT` is canonical;
`GUTCHECK_NAS_ROOT` is a temporary compatibility alias and is accepted alongside it only when
both resolve to the same validated share. The index builder, read-only asset tools and dev server
use that resolver, so none hardcodes a drive or guesses identity from a familiar directory.

The machine-readable twin, **`docs/nas-ledger.json`**, is the generated-output owner manifest with
each recorded file's byte size and **SHA-256**. Current rows use governed `collections/**`
locators; producer-era `out/**` paths remain only in historical records and catalogue aliases.
Per-collection class, retention, recovery, and serving authority come only from
`docs/nas-assets.json`; a hash detects loss but cannot restore it.

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
| 2026-08-15 | Phase 3 visual collection → `collections/earlier-phase3-visual/2026-08-01/payload/` | 10 | 984,164 B | source, target, quarantine and fresh restored staging matched tree SHA-256 `73a9f672…3faf`; legacy root moved into `_control/quarantine/relocations/` |
| 2026-08-16 | remaining live generated `out/**` payloads → seven versioned `collections/**` payloads | 23,215 | 469,029,676,843 B | exact pre-move census; 710 omitted generated files fully hashed; absent-target same-share renames; exact final path/count/size checks |
| 2026-08-16 | mixed gutcheck remainder corrected: generated diagnostics → active collection; Git mirrors and unresolved material → private quarantine | 931 | 833,991,988 B | every source and final row descriptor-hashed; disjoint 434/128/369 partition; receipt 1,547 B / SHA-256 `7de6caa2…220`; no payload deleted |

The first 2026-08-16 ledger revision registered 710 documented generated rows omitted by earlier
snapshots and rewrote every live row to its canonical collection locator. The row-level correction
then retained 434 generated diagnostic rows and removed 497 quarantined rows from generated-output
ownership. The current exact scope is 22,728 files / 468,862,902,379 bytes; the tracked ledger is
5,165,509 bytes with SHA-256
`aedde64bb1d01632d790fbf0d3a5ca7a3b3a594b90f3714033b48b1cfeccee05`. Provisional collection
state still grants no retention or prune authority. The 710 initially added rows and every one of
the 931 correction-source rows were fully hashed; other already-registered rows retained their
existing digests across absent-target same-share renames and were checked for exact final paths and
byte sizes, not all rehashed again.

The separate 2026-08-16 research pass moved six retained selections into versioned private
collections and placed unresolved or redundant material in private quarantine. It did not add
those third-party bytes to this generated-output ledger. Exact collection manifests, aggregates,
receipts, compatibility changes, and limits are in the
[layout migration record](nas-layout-migration-20260816.md).

## Separate post-Phase-9 research intake

Third-party source bytes are outside this generated-output ledger. A closeout audit found fourteen
unique payloads acquired only after Phase 9 froze, including the previously absent Voigtländer S1/S2
supplement. They are privately archived at
`collections/post-phase9-intake/2026-08-13/payload/` and hash-bound by
[`research/phase9-post-freeze-source-intake-v1.json`](../research/phase9-post-freeze-source-intake-v1.json).
Their status is **unregistered post-Phase-9 intake**: they changed future source availability, not
the historical shelf, scores, evidence, promotions, or validation status.

## How the site uses this

**Executed on macOS with the governed marker (2026-08-15):**
`node scripts/gutcheck-build-index.ts` built 3 sections / 37 items from the validated share. A live
loopback Vite check returned 200 for a 339-byte catalogue-approved file, 206 for a ten-byte range,
and 403 for both a private root and an unknown root. The index emits URLs only under the approved
`collections/gutcheck-generated-public/2026-08-15/payload/large` and
`collections/gutcheck-generated-public/2026-08-15/payload/gen/renders` prefixes; the server then
attaches the host mount and opens without following links. Private/mixed roots, including
`photos/`, `figs/` and workspace-root media, are not indexed or served. `--detached` emits explicit
metadata-only output and never falls back to local `out/` bytes. Windows `S:/` remains unexecuted
and needs a host check before a cross-host durability claim.

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

Do not mirror a NAS path directly into a live worktree with `robocopy`, `rsync --ignore-existing`,
or raw archive extraction. Those operations can merge trees and do not establish an exact-set,
fresh-stage restore. The legacy compatibility command resolves the marked share, selects one exact
active catalogue version, copies only owner-manifest rows into a fresh destination below
`out/restores/`, and verifies the restored set, lengths, and digests:

The marker/control skeleton is installed, and attached owner-manifest verification passed. The
Phase 3 collection below restored before and after its move to the governed `collections/**`
layout, each time as 10 files / 984,164 bytes with tree SHA-256
`73a9f672d9e803854ec8c82a2a0e0192f448989984ce30772e768b20644d3faf`.
Those Phase 3 staging trees were disposable and are no longer present. This remains a bounded
historical compatibility result, not a durable receipt, prune authorization, independent backup,
or large-restore performance result.

```bash
npm run assets:restore -- \
  --collection earlier-phase3-visual@2026-08-01 \
  --to out/restores/earlier-phase3-visual-2026-08-01
npm run assets:verify-restored -- \
  --collection earlier-phase3-visual@2026-08-01 \
  --from out/restores/earlier-phase3-visual-2026-08-01
```

That path does not emit a durable publication/restore receipt and never authorizes pruning. Legacy
manual copying grants no prune or exact-restore claim.

The retained extras zip is a historical same-NAS recovery copy, not an independent backup. It also
contains legacy recipe/record copies under `out/`; the tracked copies under
`evidence/gutcheck-gg-realism/` remain authoritative, and the index ignores the legacy copies.

New bulk outputs land locally under `out/`; ignored `research/` is likewise acquisition staging.
If bytes should be retained, assign one asset ID and immutable version, place the payload at
`collections/<asset-id>/<version>/payload/`, bind it in `docs/nas-assets.json`, and write exactly
one owner manifest: public-safe rows at `docs/nas-assets/manifests/<asset-id>/<version>.json`, or
private-name rows at `collections/<asset-id>/<version>/manifest.private.jsonl`. Verify the final
exact set before removing local staging. Material that cannot yet be assigned to one collection
goes to dated `_control/quarantine/unresolved/` custody, never a new top-level root. A direct
`gutcheck-grow-params.ts` invocation still needs `npm run evidence:pin` after its record write.

Historical note: the first moves were ledgered in `out/gutcheck-gg-realism/MOVED-TO-NAS.md`
(untracked); this document supersedes it.
