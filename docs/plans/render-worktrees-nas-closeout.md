# Plan — publish completed render worktrees and close their branches

- **Phase:** Pre-Phase 7 product retention and repository closeout; no charter phase or gate is
  reopened
- **Status:** active — registration and read-only audit
- **Started:** 2026-09-04
- **Last touched:** 2026-09-04 by OpenAI Codex (GPT-5)

## Goal

Preserve every useful ignored product from the completed named-crystal catalog and animation/growth
worktrees on the governed `snowcrystal` NAS, make the retained bytes discoverable and restorable
from a fresh checkout through tracked metadata, merge both completed task branches into `main`, push
the resulting `main`, and remove only those two completed worktrees and local branches.

Maker direction on 2026-09-04 explicitly requests saving the work, verifying that the renderings
are on the NAS and logged, merging back to `main`, and closing the branch/worktree. That direction
authorizes removal of the two exact completed worktrees after the copy, manifest, fresh-process
verification, fresh restore, Git merge and push all pass. It does not authorize removal or mutation
of any unrelated worktree, a NAS collection, quarantine custody, or any path outside the two
resolved worktree roots.

## Collection contract

- Existing dependency: `gutcheck-growth-scientific@2026-08-26` remains the immutable owner of
  `snowflake-animation/out/growth-scientific/`. Reopen and full-hash all 6,308 registered files in a
  fresh process before relying on that copy; do not duplicate the tree into the new collection.
- New identity: `render-worktrees-closeout@2026-09-04`.
- New source: the exact regular-file tree at `out/` in the registered
  `snowflake-named-catalog` worktree after copying the animation worktree's residual `out/` bytes,
  except `out/growth-scientific/`, into the dedicated child
  `out/animation-worktree-closeout/` without changing either source.
- Durable locator: `collections/render-worktrees-closeout/2026-09-04/payload/` on the marked share
  resolved by `scripts/nas-root.ts`.
- Storage class: `generated-cache`; all selected bytes are project-generated public solver output,
  web payloads, render/review captures, logs, or task-local generation helpers. No private or mixed
  source media is selected.
- Mutability: immutable; maker-approved deletion only, plan-only garbage collection.
- Recovery: exact tracked generation recipes where available plus restoration of this immutable
  snapshot. The NAS is one storage domain; this generated-cache class requires no independent
  backup.
- Owner manifest: tracked at
  `docs/nas-assets/manifests/render-worktrees-closeout/2026-09-04.json`, with one path, byte length
  and SHA-256 row for every payload file.
- Serving: denied. Another machine obtains the bytes with the catalogue's restore command; a fresh
  checkout with no `out/` directory may restore directly to `out/` to recreate the recorded paths.

## Done when

- This plan is committed before implementation, and the provisional catalogue entry plus bounded
  publisher are committed before the first durable payload write.
- Both registered worktrees and every local branch are inventoried. Tracked/staged/unstaged state
  is clean or committed; ignored task output is classified as the existing scientific collection,
  the new closeout collection, or explicitly reproducible inspection scratch.
- The existing `gutcheck-growth-scientific@2026-08-26` collection passes a fresh-process full-hash
  verification against its tracked 6,308-row owner manifest, and the command/result is recorded in
  its publication plan and `docs/PROGRESS.md`.
- A bounded residual-copy step copies every animation-worktree `out/` regular file outside
  `growth-scientific/` into the named worktree's dedicated closeout child, compares every source and
  copy by path, length and SHA-256, and refuses symlinks, special files, aliases, mutation, unexpected
  roots or an existing destination.
- A dry run validates the marked share, exact source root, fixed collection identity, allowed
  top-level roots, absent final/receipt/restore targets, stable regular-file-only inventory and
  sufficient free space.
- Copy-first publication uses unique `_control/staging/` custody, verifies source/stage/final paths,
  lengths and SHA-256 identities, atomically reserves the absent immutable collection envelope,
  writes a publication receipt and releases its lock normally.
- The tracked owner manifest binds the exact final file set and aggregate. The catalogue activates
  the collection with the publication receipt identity and truthful Windows SMB limits.
- A later fresh process runs `assets:verify --full`; a fresh restore and
  `assets:verify-restored` round-trip pass. The restore is temporary and may be removed only after
  its exact resolved path and successful verification are recorded.
- Focused transaction/catalogue/publication tests, both typechecks, Rule 7, `git diff --check` and
  exact `npm test` pass because the work changes the root-wide storage and integrity contract.
- The completed animation/NAS branch is reconciled into the named-catalog branch; the final branch
  is merged into a clean, fetched `main` without discarding any unique commit. `main` is pushed and
  its remote identity is verified.
- `docs/PROGRESS.md` and this plan record exact file/byte/tree identities, receipt paths/digests,
  verification commands/results, final commit, merge/push result, and the disposition of every
  removed worktree. Only then are
  `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-animation` and
  `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` removed and their completed local
  branches deleted with safe, non-forced branch deletion.

## Approach

Reuse the existing forward transaction core with one collection-specific command. The command has
no CLI option for selecting a different source, asset ID, version, final locator or receipt path.
It validates the four expected named-worktree `out/` roots plus the dedicated animation-closeout
root and refuses any other top-level source. Operator logs live outside `out/`, so observing the
source cannot mutate the publication input.

The animation residual copy is a separate bounded, copy-only preparation step. It excludes only the
already-governed `out/growth-scientific/` tree, inventories both sides independently and writes its
local report outside the selected `out/` source. No source byte is removed by preparation,
publication, registration, verification or restore.

Windows cannot fsync an SMB directory handle. Durability claims therefore remain observation-based:
the transaction closes and reopens final paths, re-hashes the complete final tree, then a separate
process independently verifies the active collection and a fresh restored copy. No hardware
crash-durability theorem is claimed.

## Steps

- [x] Read the governing state, Phase 6 lessons, named catalog/gallery/renderer plans, NAS plan,
      decision 0051 and Rules 15–16; inspect all branches/worktrees and stop before destructive work.
- [ ] Commit this plan and the live progress registration.
- [ ] Finish and record the fresh full verification of the existing scientific collection.
- [ ] Reconcile the completed animation/NAS commits into the named-catalog branch and correct the
      stale progress description without weakening either completed record.
- [ ] Implement and focus-test the bounded residual copy and closeout publisher; add the provisional
      catalogue row; commit before any new NAS write.
- [ ] Copy and independently verify the animation residual, then run the closeout dry inventory.
- [ ] Publish, register, full-verify in a fresh process, restore to a fresh destination and verify
      the restored tree.
- [ ] Run the required repository checks and record exact results.
- [ ] Fetch, reconcile, merge and push `main`; verify the remote commit.
- [ ] Remove the two exact completed worktrees and safely delete their merged local branches; verify
      the remaining worktree/branch inventory.

## Out of scope

- Deleting or changing any NAS collection, publication receipt, quarantine item or source outside
  the two exact completed worktrees.
- Removing the primary worktree or an unrelated branch/worktree.
- Publishing private/mixed reference imagery, credentials, or any file not selected by the bounded
  inventory.
- Changing solver behavior, accepted catalog identities, Compose semantics, renderer output,
  scientific claims, evidence, phase gates, or the known `fig6` cross-architecture interpretation.
- Reclassifying generated products as tracked or external evidence.

## Tried and rejected

- **Remove the worktrees because Git status is clean.** Rejected: both contain large ignored outputs,
  and Git cleanliness says nothing about retention.
- **Rely on the existing scientific collection for all catalog work.** Rejected: it owns only the
  earlier 52-growth tree, not the named catalog's 99 accepted animations, later scientific bundles,
  volume previews or review captures.
- **Copy raw directories to an ad hoc NAS folder.** Rejected: another checkout would have no tracked
  owner manifest, immutable locator, receipt or restore procedure.
- **Duplicate the already-published 84 GB scientific tree.** Rejected: full verification of its
  existing immutable collection is sufficient; only the animation residual enters the closeout
  snapshot.
- **Merge first and sort ignored bytes out later.** Rejected: worktree removal would make the only
  complete local inventory disappear before the governed copy and restore are proven.
