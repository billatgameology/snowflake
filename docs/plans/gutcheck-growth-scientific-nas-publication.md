# Plan — publish the gut-check scientific growth bundles to governed NAS storage

- **Phase:** Pre-Phase 7 product data retention; no charter phase or gate is reopened
- **Status:** complete — durable copy, tracked manifest registration, and required repository
  checks passed
- **Started:** 2026-08-29
- **Last touched:** 2026-08-30 by OpenAI Codex (GPT-5)

## Goal

Preserve the completed `out/growth-scientific/` products as one immutable, verified NAS
collection without deleting or changing the workstation source. The collection contains the 52
model-output bundles produced by the maker-directed scientific growth round: full final solver
state, approximately 120 mesh frames per crystal, growth-event assets, final meshes, specifications,
records, and logs. These are reproducible generated model outputs, not scientific validation
evidence and not authority for any phase claim.

## Collection contract

- Identity: `gutcheck-growth-scientific@2026-08-26`.
- Source: the exact regular-file tree at `out/growth-scientific/` in the registered
  `snowflake-animation` worktree.
- Durable locator: `collections/gutcheck-growth-scientific/2026-08-26/payload/` on the marked
  `snowcrystal` share resolved by `scripts/nas-root.ts`.
- Storage class: `generated-cache`; project-owned, public metadata, payload not served.
- Mutability: immutable; retention is maker-approved deletion only, with plan-only garbage
  collection and no automatic expiry.
- Recovery: exact regeneration by the pinned queue plus `scripts/gutcheck-growth-fleet.ts
  --scientific`; the NAS is one storage domain and no independent backup is required for this
  reproducible class.
- Owner manifest: tracked at
  `docs/nas-assets/manifests/gutcheck-growth-scientific/2026-08-26.json` with one path, byte length,
  and SHA-256 row for every payload file.
- Publication and restore receipts: share-local under the standard `_control/receipts/` namespaces;
  their exact paths and digests are recorded here and in the activated catalogue entry.

The source measurement at plan time found 6,308 files / 84,247,312,054 bytes (78.46 GiB) below
`out/growth-scientific/`. That measurement is an opening inventory, not the publication binding;
the bounded publisher independently hashes the stable source, stage, final placement, and fresh
restore before this plan records completion.

## Done when

- The provisional catalogue entry, this plan, and the bounded publisher are committed before the
  first durable payload write.
- A dry run validates the marked mount, exact source root, collection identity, absent final path,
  available space, regular-file-only source shape, and stable source inventory.
- Copy-first publication uses unique `_control/staging/` custody, compares every source and staged
  file by length and SHA-256, atomically reserves the absent immutable collection envelope, reopens
  and re-hashes every final file, and writes a publication receipt.
- The tracked owner manifest binds the exact final file set, aggregate, and tree digest; the
  catalogue entry is activated with the publication receipt identity and truthful Windows SMB
  limits.
- Maker direction on 2026-08-29 narrows completion to the durable copy plus tracked owner manifest.
  The separate fresh-process full verifier and transaction-certified fresh restore are deferred;
  the catalogue keeps restore status `documented`, and no local source byte is deleted by this work.
- Focused NAS transaction/catalogue/restore tests, both typechecks, Rule 7, `git diff --check`, and
  exact `npm test` pass because this changes the root-wide storage and integrity contract.
- `docs/PROGRESS.md` and this plan name the final file/byte/tree digest, receipt paths and digests,
  exact verification commands, surviving branch, and the fact that pruning was not authorized.

## Approach

Use the existing forward transaction core rather than inventing a parallel copier. A bounded
collection-specific command supplies only the frozen source and provisional catalogue identity,
records observable progress, and refuses any different source, collection, existing final path,
unsafe file, source mutation, or unmarked/conflicting share. It generates the public owner manifest
from the independently verified final inventory and activates only that one provisional catalogue
row after the publication and fresh restore receipts exist.

Windows cannot fsync an SMB directory handle. Therefore publication durability is observation-
based: close and reopen the final paths and perform the transaction core's repeated complete final
re-hashes before its receipt. The maker deferred the separate fresh-process verifier and restore.
This is stated as a limit, not promoted to a hardware crash-durability claim.

## Steps

- [x] Read the governing progress state, animation plan, NAS governance plan, decision 0051, and
      Rules 15–16; inspect both worktrees and preserve the existing task branch.
- [x] Resolve and validate the marked NAS mount; check free space, destination absence, and active
      publication/restore lock namespaces.
- [x] Add this plan and the provisional catalogue identity before a durable write.
- [x] Implement and focus-test the bounded dry-run/publish/register/restore workflow; commit it
      before `--publish`.
- [x] Run the dry inventory and record its exact aggregate/tree digest.
- [x] Retire the exact first-attempt stage and lock intact to non-served quarantine; delete nothing.
- [x] Retire the exact second-attempt full stage and lock intact to a distinct non-served quarantine;
      delete nothing.
- [x] Publish the final tree and activate its exact tracked owner manifest; do not run a separate
      fresh restore or later full verifier under the narrowed maker direction.
- [x] Run required repository checks and record completion in this plan and `docs/PROGRESS.md`.

Implementation checkpoint: the collection-specific TypeScript command delegates copying,
absent-target publication, transaction receipts, and fresh restore to the existing transaction
core; it exports only pure owner-manifest/catalogue activation helpers for focused testing. Before
the implementation commit, `npm run typecheck`, `npm run lint:rule7`, `git diff --check`, and
`npx vitest run runner/test/gutcheck-growth-scientific-nas-publication.test.ts
runner/test/nas-asset-transaction-lib.test.ts runner/test/nas-assets-catalog.test.ts` passed: three
files, 45 tests passed and six transaction fixtures skipped. No NAS payload was written by those
checks.

Dry-run record: `node scripts/nas-publish-gutcheck-growth-scientific.ts --dry-run` exited 0 on the
Windows host. Its ignored report at
`out/nas-publish-gutcheck-growth-scientific-2026-08-26/dry-run.json` records 6,308 files /
84,247,312,054 bytes / tree SHA-256
`4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`, marked-share free space
47,968,330,186,752 bytes, and absent final and restore targets. It changed no NAS payload.

First publication attempt (2026-08-29): transaction
`gutcheck-growth-scientific-20260829-publish` failed closed immediately after the first staged file.
The final collection and publication receipt remained absent. The exact residue is one
`bentley785-frames/manifest.json`, 18,076 bytes, SHA-256
`1f0009e49bd335d512511ef9f2fbc8f3dc06c623cdbcac72f1c88dd356b7b27a` (equal to source), plus
the transaction-owned lock. Root cause: the transaction core returned the staged file's identity
from its still-open write descriptor; Windows SMB committed final mtime/ctime on close, so the next
path observation rejected an unchanged file as an ownership change. The repair still validates the
open descriptor, object identity, type, link count, mode, and size, but binds later ownership checks
to a post-close path observation. Before retrying under the new `publish2` transaction identity,
the bounded retirement command moves the exact old stage and lock intact to
`_control/quarantine/unresolved/gutcheck-growth-scientific-20260829-publish-attempt1/` and writes a
failure record there. Nothing is deleted.

Retirement record: `node scripts/nas-publish-gutcheck-growth-scientific.ts
--retire-failed-publish` exited 0. The quarantined stage remains one file / 18,076 bytes / tree
SHA-256 `37b2dc649ae220b0e7ac84b88f96a7e01b12f43658d75574a9a4f329b8a09b7a`; the exact old lock and
the new `failure.json` are beside it. The old live stage/lock, final collection, and old receipt are
absent. The repair commit is `51b67a2`; focused tests and both typechecks passed before retirement.

Second publication attempt (2026-08-29): transaction
`gutcheck-growth-scientific-20260829-publish2` copied all 6,308 files, emitted
`publish-stage-verified` at `2026-08-29T23:45:39.063Z`, and re-confirmed the final target absent at
`2026-08-30T00:14:56.770Z`. It then failed closed before the final reservation because SMB settled
mutable directory metadata for `sweep-t3-r0p08-frames` after the transaction captured it. The final
collection and receipt remain absent; the exact full stage and lock remain in private transaction
custody. The repair changes only nested-directory binding from mutable
size/mtime/ctime to device/inode/mode object identity. It retains a fresh stable inventory of every
path, byte length, and SHA-256 plus strict file identity binding. A regression alters only a nested
directory timestamp at the publication seam and requires success; the existing byte-identical tree
replacement and final-collision negatives remain green. Focused tests passed 46 with six skipped,
and both typechecks passed. The exact attempt-2 stage must now be re-inventoried against 6,308 files /
84,247,312,054 bytes / tree SHA-256
`4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e` and moved intact with its lock
to `_control/quarantine/unresolved/gutcheck-growth-scientific-20260829-publish-attempt2/` before the
fresh `publish3` transaction starts. Nothing is deleted.

Attempt-2 retirement record: `node scripts/nas-publish-gutcheck-growth-scientific.ts
--retire-failed-publish` exited 0 after a stable full inventory matched 6,308 files /
84,247,312,054 bytes / tree SHA-256
`4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`. The bounded helper then moved
the exact stage envelope and transaction lock intact to
`_control/quarantine/unresolved/gutcheck-growth-scientific-20260829-publish-attempt2/` and wrote its
failure record. The live attempt-2 stage and lock are absent; no byte was deleted.

Scope correction (maker direction, 2026-08-29): finish the basic file copy and register the files in
the tracked manifest so the project knows their NAS location. The already-running bounded publisher
continues through its own source/stage/final hash checks and receipt so it does not leave a stale
lock or ambiguous final tree. After that, `--register` inventories the unchanged local source,
writes the exact 6,308-row owner manifest, and activates the catalogue. The separate 84.2 GB fresh
restore, restored-tree verifier, and later fresh-process NAS verifier are deferred and must not be
claimed as executed.

Publication and registration record: `node scripts/nas-publish-gutcheck-growth-scientific.ts
--publish` exited 0 under transaction `gutcheck-growth-scientific-20260829-publish3`; the immutable
final locator is `collections/gutcheck-growth-scientific/2026-08-26/payload`. Its source, stage, and
final aggregates matched 6,308 files / 84,247,312,054 bytes / tree SHA-256
`4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`. The 1,008-byte publication
receipt is `_control/receipts/publication/gutcheck-growth-scientific/2026-08-26/gutcheck-growth-
scientific-20260829-publish3.json`, SHA-256
`aef89b7894695c3c7e4fe4f53878982d8b50f976a73043dbed609ed171b249f7`. The process released its lock
normally. `node scripts/nas-publish-gutcheck-growth-scientific.ts --register` then exited 0 after a
stable local source inventory matched the same aggregate. It activated the catalogue and wrote the
6,308-row, 1,482,944-byte owner manifest at
`docs/nas-assets/manifests/gutcheck-growth-scientific/2026-08-26.json`, SHA-256
`405beba8dc79ef68282bd8c80abaacc833fda700f5a448674f5dd7a841fa82ae`. The source remains in place,
no destructive action occurred, and no restore was performed.

Verification record: the focused transaction/catalogue command
`npx vitest run runner/test/gutcheck-growth-scientific-nas-publication.test.ts
runner/test/nas-asset-transaction-lib.test.ts runner/test/nas-assets-catalog.test.ts` passed 46 tests
with six skipped. `npm run typecheck`, `npm run lint:rule7`, and `git diff --check` passed. The exact
`npm test` passed 137 test files / 2,226 tests, with 49 skipped, after normalizing this Windows
host's `TEMP`/`TMP` spelling from its 8.3 alias to the same physical temporary directory's long
path; the restore fixtures require their synthetic destination and repository roots to use the
same spelling. These checks read the activated catalogue and tracked manifest but performed no NAS
write, restore, verification, or local-source deletion.

Closeout verification addendum (2026-09-04): a later fresh process ran
`npm run assets:verify -- --collection gutcheck-growth-scientific@2026-08-26 --full` and exited 0.
Its report returned `ok=true`, `manifest=verified`, `aggregate=verified`,
`payload=verified-full`, zero defects, and exact full-payload totals of 6,308 files /
84,247,312,054 bytes. The ignored raw log in the animation worktree is 761 bytes / SHA-256
`72aac9e0e4b176834468b5c3475cd89f1560be61c044bea67fc46f8da02e9479` at
`out/nas-verify-gutcheck-growth-scientific-2026-09-04.log`; the active
[render-worktree closeout plan](render-worktrees-nas-closeout.md) registers that log in the new
closeout collection while retaining the animation worktree. This later verifier performed no NAS
write, restore, movement, quarantine or deletion. A subsequently started restore was stopped under
the maker's narrowed 2026-09-04 direction and remains incomplete local scratch; the maker will test
the documented restore on another computer after merging the closeout pull request.

## Out of scope

- Deleting, pruning, moving, or modifying `out/growth-scientific/`, a restored copy, or any
  existing NAS collection.
- Publishing the scientific bundles through `/nas` or the website; the 51 slim website assets
  remain a separate product copy.
- Reclassifying these generated outputs as tracked or external evidence, changing a scientific
  claim, rerunning a solver, or resolving the known `fig6` cross-architecture divergence.
- Running the independent fresh restore or later fresh-process full NAS verifier after the maker
  narrowed this task to the basic durable copy plus manifest registration.
- Creating a generic public `assets:publish` command or altering another collection's retention,
  ownership, serving, or backup policy.

## Tried and rejected

- **Raw recursive copy into an ad hoc NAS folder.** It would leave no immutable identity, owner
  manifest, receipts, restore proof, or catalogue authority and would violate decision 0051.
- **Publishing directly from `out/` into the final locator.** A partial or interrupted transfer
  could look durable. The adopted path stages and verifies before absent-target placement.
- **Putting the 78.46 GiB tree in the existing public gut-check collection.** That collection has a
  different version, owner selector, serving policy, and retention history; merging would mutate an
  existing collection and mix lifecycle contracts.
- **Calling the scientific round external evidence because of its name.** It is reproducible model
  output and carries no gate claim; `generated-cache` is the accurate class.
- **Deleting the local source after NAS verification.** Publication does not authorize pruning.
- **Retrying against the stale first-attempt lock or deleting its one-file stage.** Rejected: the
  first attempt is a useful executed Windows-SMB failure record. Preserve it in non-served
  quarantine and use a new transaction identity.
- **Weakening file identity or trusting the attempt-2 stage without a fresh inventory.** Rejected:
  the correction is directory-metadata-specific. Files retain strict post-close identity checks,
  and the full failed stage is rehashed before it and its lock move intact to quarantine.
- **Adding a root `.gitattributes` rule for the generated owner manifest.** Rejected after the first
  exact suite run because changing root attribute inheritance altered existing byte-frozen fixture
  inputs. The rule was removed; the catalogue's byte length and SHA-256 bind the tracked manifest
  without changing repository-wide checkout semantics.
