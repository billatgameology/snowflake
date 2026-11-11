# Plan — Preserve recovered warm switch states

- **Status:** publication and fresh recovery verified; parent commit of final bindings pending.
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

- [x] Commit this plan and provisional catalogue intent before publication (`1acbc0e`).
- [x] Wait for six verified stopped replay workers; inventory and stage exact source files.
- [x] Publish, fresh-restore, bind the owner manifest and verify through existing CLIs.
- [ ] Commit receipts and communicate recovery location/limits to the parent.

## Out of scope

The original long HIL campaign, historical BLD inputs, solver changes, serving, pruning, worktree closure, and independent off-site recovery. This collection preserves newly replayed states; it does not turn them into original BLD snapshots.

## Exact bounded lifecycle commands

From the task repository containing the current catalogue and recipe, after the six replay
processes have exited and their verification records are complete:

```powershell
node docs/nas-assets/manifests/warm-switch-recovery/2026-11-11-preserve.mjs prepare
node docs/nas-assets/manifests/warm-switch-recovery/2026-11-11-preserve.mjs publish
node docs/nas-assets/manifests/warm-switch-recovery/2026-11-11-preserve.mjs restore
node docs/nas-assets/manifests/warm-switch-recovery/2026-11-11-preserve.mjs register
npm.cmd run assets:verify -- --collection warm-switch-recovery@2026-11-11 --full
npm.cmd run assets:restore -- --collection warm-switch-recovery@2026-11-11 --to out/restores/warm-switch-recovery-2026-11-11-cli
npm.cmd run assets:verify-restored -- --collection warm-switch-recovery@2026-11-11 --from out/restores/warm-switch-recovery-2026-11-11-cli
```

Publication and its first fresh recovery refuse existing targets. Later recovery into a new,
absent local directory uses the ordinary catalogue-backed commands:

```powershell
npm.cmd run assets:restore -- --collection warm-switch-recovery@2026-11-11 --to out/restores/warm-switch-recovery-fresh
npm.cmd run assets:verify-restored -- --collection warm-switch-recovery@2026-11-11 --from out/restores/warm-switch-recovery-fresh
```

The restored `replays/<row-id>/resume/latest.json` points to the preserved two generations;
`analysis/` contains the full offline readout and its recipes, and `recipes/` contains the
exact executed replay worker. Reading restored scientific states does not authorize a
cross-host or changed-source resume. No extraction step is needed for this loose payload.

## Executed preservation record

All six recovery records and six exit-0 process receipts were present before stable staging;
no replay worker remained. Publication finished at `2026-11-11T19:14:28.866Z` and the
transaction fresh restore verified at `2026-11-11T19:15:24.185Z`. The source, staged, final
NAS, transaction-restored and catalogue-CLI-restored trees agree: **103 files,
56,351,044 bytes**, tree SHA-256
`f6262190397b3983355c2342f36f44307577e33bee9e709e15daacd629d9111e`.
The owner inventory contains 91 replay files (55,561,778 bytes), including twelve
`solver.bin` states; eleven analysis files (785,079 bytes); and the exact replay worker
(4,187 bytes). These counts come from the complete published inventory.

- Owner manifest: [2026-11-11.json](../nas-assets/manifests/warm-switch-recovery/2026-11-11.json), 25,789 bytes, SHA-256 `35a94f595a65e1b1f6ef758d5187dc7913f2c7c0f833bb873ebf84035622b1cd`.
- Publication receipt: `_control/receipts/publication/warm-switch-recovery/2026-11-11/warm-switch-recovery-20261111-publish.json`, SHA-256 `182af6a16fd697bfed29ef53370c0b9ab5d93264b1ac9b489b1cf845b4dfecb7`.
- Transaction restore receipt: `_control/receipts/restore/warm-switch-recovery/2026-11-11/warm-switch-recovery-20261111-restore.json`, SHA-256 `52ef9af5e8b6e8867f3dfee78256b697b28c32b4d84f7f17435019357d8ae971`.
- [Verification record](../nas-assets/manifests/warm-switch-recovery/2026-11-11-verification.json) contains both fresh restore locations, exact CLI commands, actual exits, parsed reports and log hashes. Existing NAS full-hash verification, ordinary fresh restore and destination verification each exited 0 and reported success.

Catalogue state is active, owner-manifest-bound, non-served, permanent external evidence.
Original workstation data remain in place; the NAS and workstation are distinct recovery
domains, without an off-site claim. No bytes were pruned and no output-owning worktree was
closed. The original long HIL campaign remains outside this collection. Final Git binding
is the parent's remaining step.

## Tried and rejected

- Keeping only rolling current/previous generations after continuing a row loses earlier states. These six paused replay directories remain frozen.
- Raw NAS presence or a hash alone is not recovery. Use the existing publication/fresh-restore lifecycle.
- The task checkout's ordinary restore verifier rejects a primary-checkout destination with `destination-invalid`: its contract restricts destinations to its own `out/restores/`. The transaction restore already matched all bytes. A second fresh restore through the ordinary CLI into task-local `out/restores/warm-switch-recovery-2026-11-11-cli` then passed verification; no guard was bypassed.

- Final catalogue checks initially found an omitted new collection in the pinned census and a noncanonical example restore destination. Added the exact 103-file/56,351,044-byte expectation and aligned the declared commands with the existing destination convention; no verifier or payload was changed.
