# Plan — publish the gut-check scientific growth bundles to governed NAS storage

- **Phase:** Pre-Phase 7 product data retention; no charter phase or gate is reopened
- **Status:** active — first attempt preserved in quarantine and SMB close-time repair committed;
  second publication attempt is next
- **Started:** 2026-08-29
- **Last touched:** 2026-08-29 by OpenAI Codex (GPT-5)

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
  catalogue entry is activated with the final receipt identities and truthful Windows SMB limits.
- A fresh-process `assets:verify --full` succeeds for the one exact collection.
- A transaction-certified fresh restore and the catalogue-facing restore plus
  `assets:verify-restored` both reproduce the exact manifest tree. No local source or restored byte
  is deleted by this work.
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
based: close and reopen the final paths, perform a complete final re-hash, end the write process,
then run a separate fresh-process full verification. This is stated as a limit, not promoted to a
hardware crash-durability claim.

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
- [ ] Publish, activate, fresh-process verify, fresh-stage restore, and verify the restored tree.
- [ ] Run required repository checks and record completion in this plan and `docs/PROGRESS.md`.

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

## Out of scope

- Deleting, pruning, moving, or modifying `out/growth-scientific/`, a restored copy, or any
  existing NAS collection.
- Publishing the scientific bundles through `/nas` or the website; the 51 slim website assets
  remain a separate product copy.
- Reclassifying these generated outputs as tracked or external evidence, changing a scientific
  claim, rerunning a solver, or resolving the known `fig6` cross-architecture divergence.
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
