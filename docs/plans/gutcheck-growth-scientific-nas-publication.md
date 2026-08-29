# Plan — publish the gut-check scientific growth bundles to governed NAS storage

- **Phase:** Pre-Phase 7 product data retention; no charter phase or gate is reopened
- **Status:** active — plan and provisional catalogue entry recorded; no durable NAS payload written
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
- [ ] Implement and focus-test the bounded dry-run/publish/register/restore workflow; commit it
      before `--apply`.
- [ ] Run the dry inventory and record its exact aggregate/tree digest.
- [ ] Publish, activate, fresh-process verify, fresh-stage restore, and verify the restored tree.
- [ ] Run required repository checks and record completion in this plan and `docs/PROGRESS.md`.

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

