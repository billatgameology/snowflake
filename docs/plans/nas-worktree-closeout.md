# Plan — NAS preservation before worktree closeout

- **Phase:** repository storage and operating policy; no scientific phase change.
- **Status:** preservation and checks complete; integration/checkout retirement pending.
- **Started / last touched:** 2026-10-09 by Codex/GPT-6.
- **Branch / checkout:** `codex/nas-worktree-closeout`, `C:/Users/biao3/.codex/worktrees/nas-worktree-closeout/snowflake`, from `6071640`.

## Goal

Apply the maker's direction to back up useful worktree output to NAS before closure and keep
bulk run payloads out of GitHub. Deliver the policy and a verified NAS recovery copy of the
three retired HIL run archives, using existing publication/restore machinery. Solo scientific
research; hostile actors excluded. Leave the active HIL execution checkout and processes intact.

## Done when

No charter milestone applies. Rules, local-assets guidance and accepted ADR/charter authority
agree on NAS-before-closeout and Git metadata versus bulk payloads. Collection
`hil-completed-runs@2026-10-09` has source/stage/final byte verification, a bound owner manifest,
publication receipt and successful fresh-stage restore. All three restored archives reproduce
their complete named member inventories. Exact `npm test`, focused catalogue/evidence/progress
metadata checks, Rule 7 and diff checks pass; committed records name exact restore commands and remaining limitations.

## Approach

Adopt ADR 0061 for prospective bulk external evidence; retain small claim artifacts and existing
historical evidence obligations. Update AGENTS canonically, preserving CLAUDE.md's symlink.
No numerical threshold or new registry: classify by role. Compression does not make a full-run
archive suitable for ordinary Git. Worktrees with no useful ignored output record that fact;
rebuildable dependencies/builds do not require a NAS copy. Existing verified collections can be reused.

The bounded catch-up collection consists of the existing three `*-output.tar.gz` archives and
their three `*-archive.json` member inventories from `evidence/hil-bld-joint-review-2026-10-08/`.
They cover the retired `hil-first-batch`, `discovery-resume` and `hil-exploration-batch2` output
trees. BLD's separate NAS collection remains unchanged; integration controls and all local originals
remain retained. Use external-evidence, project-owned/public metadata, not served, permanent
retention, and no automatic GC. Retain the workstation copies independently of NAS; no local
prune or Git history rewrite is authorized. Existing Git archives remain historical bytes.

Register intent before durable placement. Prepare a six-file stable local staging tree, then
call unchanged `publishCollectionFixture` and `restoreCollectionFixture`, resolving the marked
share through `detectNasMount`. Bind catalogue updates with the existing lock/re-read/atomic-write
pattern. Use the standard immutable `collections/hil-completed-runs/2026-10-09/payload/` path,
owner manifest, and `_control/receipts/` records. Fresh restore must match all payload bytes;
reopen restored gzip members and compare path/type/length/hash against each retained inventory.

Lessons A1/A2: hashes alone do not preserve bytes and pinned Git metadata must retain its bytes.
Rule 14A admitted failure is accidental omission/partial copy or unverified retirement, already
covered by the existing stable inventory, no-replace publication and exact-set restore seams.
No new verifier/transport framework or assurance layer. The actual copy/restore and focused metadata checks cover this collection. Rule 6 also requires exact `npm test` at the stable checkpoint because this task adds executable preservation and archive-verification recipes; no scientific campaign or gate is required.

## Steps

- [x] Commit this plan before changes; adopt and propagate the storage decision.
- [x] Register, publish and freshly restore the bounded retired HIL collection.
- [x] Verify restored archive members and update provenance/recovery records.
- [ ] Run focused metadata/prose checks, integrate and publish the policy/records.
- [ ] Account for this task's outputs under the new rule before retiring its checkout.

## Out of scope

Git history rewriting, removal of existing tracked evidence, local/NAS pruning, unrelated legacy
migrations, changing scientific producers, new simulations, active worktree closure, BLD dispatch,
public serving, or a new generic backup command.

## Open questions

Already-pushed large blobs remain in Git history. Removing them requires a separately scoped,
explicit history rewrite and coordination with other checkouts; this policy does not perform it.

## Executed preservation and recovery

Plan `8a630e8` preceded policy/recipe `9cfe3f7`. The first publish invocation was refused before
NAS mutation because the provisional entry contained measured totals; `f66d3ee` set its aggregate
to zero as required by the existing forward-intent contract. No storage guard was changed.
The prepared inventory remains the measurement authority for the six source files.

The standard transaction published at `2026-10-09T15:50:14.467Z` and freshly restored at
`2026-10-09T15:50:22.243Z`. Source, staged, final and restored payload inventories all contain
6 files / 135501385 bytes with tree SHA-256
`287265e35d64cdea177d9793a18a3602928030912f2252aec556cf20ff056a9f`.
The [owner manifest](../nas-assets/manifests/hil-completed-runs/2026-10-09.json) is bound in the
catalogue. [Publication](../nas-assets/manifests/hil-completed-runs/2026-10-09-publication.json),
[restore](../nas-assets/manifests/hil-completed-runs/2026-10-09-restore.json) and
[verification](../nas-assets/manifests/hil-completed-runs/2026-10-09-verification.json) retain
the exact receipts, independent command results and primary C-drive byte matches. Every restored
tar member matched its retained path/type/length/hash inventory: 3745 files / 1587912611 bytes.
This is preservation/recovery evidence; no scientific result was regenerated or reinterpreted.

Recovery from any checkout with the marked share attached (use a fresh destination):

```powershell
npm.cmd run assets:restore -- --collection hil-completed-runs@2026-10-09 --to out/restores/hil-completed-runs-2026-10-09
npm.cmd run assets:verify-restored -- --collection hil-completed-runs@2026-10-09 --from out/restores/hil-completed-runs-2026-10-09
python docs/nas-assets/manifests/hil-completed-runs/2026-10-09-verify-archives.py out/restores/hil-completed-runs-2026-10-09
```

The payload contains each `<label>-output.tar.gz` and `<label>-archive.json`; extract a verified
archive into a separate empty directory to recover that original output tree. Share-relative
locator: `collections/hil-completed-runs/2026-10-09/payload/`, resolving to the current HIL Z: mount.
The one-time transport invocation is `docs/nas-assets/manifests/hil-completed-runs/2026-10-09-preserve.mjs`
with `prepare`, `publish`, `restore`, `register`, in that executed order. Its immutable publication
must not be repeated into the existing version. The commands above are the ordinary recovery path.

Task outputs: prepared/restored payload copies are already-covered recovery staging, never new
scientific output. Publication/restore receipts also exist on NAS; compact verification is tracked.
This task's complete `out/` tree was retained under primary
`out/nas-worktree-closeout-2026-10-09/`; compact authoritative verification records are tracked,
and publication/restore receipts also remain on NAS. No original result or operational log was pruned.
The four live HIL workers, executing source, checkpoints and outputs remain outside this task.

## Verification and closeout

Exact `npm.cmd test` passed with exit 0 at `2026-10-09T16:16:16.6697585Z`: 236 test files, 3050 passed tests and 23 skipped. Both typechecks and Rule 7 ran as part of that command. Tested tree: `d6afc38cbffb533a0b8d88e89f294d121984bf07`. The preceding focused catalogue/evidence/progress command passed 3 files / 27 tests with exit zero. The verification record binds the exact command, times and retained full-log hash; subsequent edits only record closeout. No scientific gate or campaign was executed.

A Codex/GPT-6 shared-context policy review checked exact charter quotations, local links, Rule 7 and the canonical symlink; a separate shared-context read-only inventory rehashed both six-file payload copies against the owner manifest. Neither was an independent scientific interpretation review.

The exact same-volume move retained 31 files / 271121135 bytes with identical before/after tree SHA-256 `087cb0e0ce47bbbad07b7b2b072283789856e8734a4d452d1d2b1f90a573890e`. Primary `out/nas-worktree-closeout-2026-10-09-relocation.json` retains the file inventories. Prepared/restored payload copies are covered by the NAS collection already verified above; the other files are compact operational captures retained locally, with authoritative results in Git/NAS receipts. The checkout has no remaining unique output payload. Its remaining ignored `node_modules/` is reinstallable and `app/dist/` is rebuildable test/build output.

Reconciliation before integration: primary `main` at `6071640` and active `codex/hil-warm-refinement` at `838c294` were clean; this branch owns the listed storage-policy/metadata delta. The active execution checkout, ignored scientific output and source remain independently owned and untouched. Direct fast-forward to primary and main publication are intended; no PR is used.

## Tried and rejected

- Local relocation plus compressed Git archives was treated as sufficient closeout; it preserved
  HIL bytes but provided no NAS recovery copy and added bulk payloads to repository history.
- A digest or same-NAS duplicate is not an independent recovery copy.
- Rebuilding publication/validation machinery would duplicate the existing transaction seam.
- The first provisional publication supplied nonzero totals and was refused before NAS mutation. The existing intent contract requires zero aggregate until registration; corrected in `f66d3ee` without weakening a guard.
