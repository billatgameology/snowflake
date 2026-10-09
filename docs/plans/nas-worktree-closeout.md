# Plan — NAS preservation before worktree closeout

- **Phase:** repository storage and operating policy; no scientific phase change.
- **Status:** in progress.
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
their complete named member inventories. Catalogue/evidence/progress metadata checks, Rule 7
and diff checks pass; committed records name exact restore commands and remaining limitations.

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
No new verifier/transport framework or assurance layer. Reusing unchanged transport and modifying
governance/catalogue metadata follows the BLD preservation precedent: actual copy/restore and
focused existing metadata checks, not a redundant scientific suite or simulation.

## Steps

- [ ] Commit this plan before changes; adopt and propagate the storage decision.
- [ ] Register, publish and freshly restore the bounded retired HIL collection.
- [ ] Verify restored archive members and update provenance/recovery records.
- [ ] Run focused metadata/prose checks, integrate and publish the policy/records.
- [ ] Account for this task's outputs under the new rule before retiring its checkout.

## Out of scope

Git history rewriting, removal of existing tracked evidence, local/NAS pruning, unrelated legacy
migrations, changing scientific producers, new simulations, active worktree closure, BLD dispatch,
public serving, or a new generic backup command.

## Tried and rejected

- Local relocation plus compressed Git archives was treated as sufficient closeout; it preserved
  HIL bytes but provided no NAS recovery copy and added bulk payloads to repository history.
- A digest or same-NAS duplicate is not an independent recovery copy.
- Rebuilding publication/validation machinery would duplicate the existing transaction seam.

## Open questions

Already-pushed large blobs remain in Git history. Removing them requires a separately scoped,
explicit history rewrite and coordination with other checkouts; this policy does not perform it.
