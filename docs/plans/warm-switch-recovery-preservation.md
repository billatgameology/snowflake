# Plan — Preserve recovered warm switch states

- **Status:** registered intent; publication and fresh recovery pending.
- **Started:** 2026-11-11, Codex/GPT-6 shared-context preservation lane.
- **Authority:** maker requested the next analysis and correction of missing useful state retention; standing NAS preservation direction. Scientific replay scope is in [growth-dynamics plan](hil-bld-growth-dynamics-oct21.md#switch-state-analysis-and-bounded-recovery--november-11).

## Goal and scope

Preserve six short replay prefixes, their twelve complete switch-boundary/first-inactive-update states, logs and exact worker recipe, and the stable saved-data mechanism analysis. This is external evidence under ADR 0051/0061: project-owned, public metadata, non-served, immutable, permanent retention, no automatic garbage collection. Solo scientific research; hostile actors excluded. No new simulation, scientific claim or interpretation is made by preservation.

Sources are primary `C:/Users/biao3/Documents/GitHub/snowflake/out/warm-switch-replay-2026-11-11/`, `out/warm-switch-analysis-2026-11-11/`, and `out/warm-switch-replay-worker-2026-11-11.mjs`. Wait for all six recovery verification records and all replay workers to exit before inventorying. The complete replay tree and stable analysis files are retained; live `analysis/checks/` regression logs are excluded and will be retained separately in the parent evidence bundle. No cherry-picking successful replay payloads. Use stable inventories, copy-first staging, final full hashes, a single owner manifest, existing transaction receipts and a fresh restore. Since the collection is small, preserve loose files without introducing an archive layer.

Collection: `warm-switch-recovery@2026-11-11`; destination `collections/warm-switch-recovery/2026-11-11/payload/`. Source directory contents map to `replays/` and `analysis/`; the worker recipe maps to `recipes/warm-switch-replay-worker-2026-11-11.mjs`. Local staging and operation records use primary `out/nas-save-warm-switch-recovery-2026-11-11/`; fresh recovery uses primary `out/restores/warm-switch-recovery-2026-11-11/`.

Existing `inventoryStableTree`, `publishCollectionFixture`, `restoreCollectionFixture`, `assets:verify --full` and `assets:verify-restored` supply the lifecycle. Lessons A1/A2 apply: hashes alone are not preservation, and Git bindings must retain exact bytes. No new registry/verifier is required. Accidental partial copy or omitted generation could lose mechanism-bearing state; the existing inventory and transaction functions cover it at the storage boundary.

## Done when

The complete stable source selection has a copy-first immutable NAS publication, verified final bytes, one tracked owner manifest/catalogue binding, and successful fresh-stage restore of every payload file. The plan records exact commands/counts/receipts. Local originals remain the independent workstation domain. Parent performs the required repository checks at its stable scientific-analysis checkpoint. No output-owning worktree is closed and no local or NAS bytes are pruned.

## Steps

- [ ] Commit this plan and provisional catalogue intent before publication.
- [ ] Wait for six verified stopped replay workers; inventory and stage exact source files.
- [ ] Publish, fresh-restore, bind the owner manifest and verify through existing CLIs.
- [ ] Commit receipts and communicate recovery location/limits to the parent.

## Out of scope

The original long HIL campaign, historical BLD inputs, solver changes, serving, pruning, worktree closure, and independent off-site recovery. This collection preserves newly replayed states; it does not turn them into original BLD snapshots.

## Tried and rejected

- Keeping only rolling current/previous generations after continuing a row loses earlier states. These six paused replay directories remain frozen.
- Raw NAS presence or a hash alone is not recovery. Use the existing publication/fresh-restore lifecycle.
