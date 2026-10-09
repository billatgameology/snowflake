# HIL / BLD first exploration batch

- **Scope:** executable first stage of the maker-approved post-Phase-10 portfolio; development evidence only.
- **Status:** first-batch execution complete: HIL has 56 checked endpoints after recovery; BLD has 42, restored and rechecked on HIL. Sources remain distinct. Original stopped HIL is preserved at `f4ca38a`; comparative interpretation is next.
- **Implementation branch / destination:** `codex/discovery-resume` -> `origin/main`; original `science/hil-bld-first-batch` is reconciled.
- **Authority:** [adaptive discovery](post-phase10-adaptive-discovery.md#exploration-portfolio-for-hil-and-bld), accepted ADRs 0055-0059, attachment-kinetics specification. No phase gate changes.

## BLD branch retirement — 2026-10-08

The maker requests retirement of `codex/bld-exploration` without merging its duplicate resume
implementation. HIL's integrated result commit `5c972925326bcbae0597a1c3d0ba86b67fb1ba4a` is now
published on `origin/main`; BLD's primary checkout fast-forwarded to it. The imported BLD evidence
bundles and owner manifests compare byte-identically with branch head
`b3337825182d4d90bb63abad2cd0bedd673db320`.

Permanent annotated tag `run/bld-first-batch-2026-10-08` is pushed. Its tag object is
`35bb7cfa44aa0224f0bc0ddfd2bb54ddde8e5e10`, and the remote peeled target is exactly `b333782`.
It retains the distinct implementation and ancestor run producer `d7ff3e1`. Recover that source
with `git fetch origin tag run/bld-first-batch-2026-10-08`; inspect the tag or create a deliberately
isolated checkout when needed. Main retains HIL's implementation. Completed rows need no resume.

Rule 16 audit found two local worktrees and branches: clean BLD primary on `main`, and clean
`G:/Code Files/snowflake-bld-exploration` on the retiring branch. No staged, unstaged or nonignored
untracked source changes exist. The task's entire `out/` contains 7914 regular files /
3197028093 bytes, including unpublished tuning and operational intermediates. Moved that complete
tree, without merging or deleting outputs, into the previously absent primary staging directory
`G:/Code Files/snowflake/out/bld-exploration-retired-2026-10-08`. Before/after inventories and
operation receipts live in primary `out/bld-branch-retirement-2026-10-08/`.

The completed campaign/probe/control retain their existing tracked archives and governed NAS
collection; the old interrupted run and representative recovery witness retain their tracked
archives. Moving local staging grants no new preservation or pruning claim for uncatalogued
intermediates. Keep them in the destination. Rebuildable task `node_modules/` and `app/dist/`
are disposable at retirement; installed workspace junctions must not be followed into source.
Primary's existing ignored assets, outputs, research custody and the unrelated remote film branch
remain independently owned and untouched. No HIL-local worktree is removed from BLD.

Before/after inventories agree in exact file set, lengths and SHA-256, with tree digest
`b112591d27d8aa2d963b87eeaba873522442a16d9c19d7b2665cd8468aba3f82`.
The task worktree directory and local/remote branch are removed; only BLD primary `main` remains
registered locally. The permanent tag and unrelated remote film branch remain. The pinned
[retirement receipt](../../evidence/bld-first-batch-2026-10-08/branch-retirement.json) records
the exact heads, remote observations, output custody and command outcomes. No PR was used. This is
solo scientific research, with hostile actors excluded; the deliverable is a retired branch
with recoverable producer and retained outputs. Lessons A1/A2 and Rules 15/16 govern custody.
Use the existing stable inventory, Git identity/diff checks, Rule 7 and progress-index check;
no numerical behavior or claim changes and no scientific full-suite rerun is required.

Tried and rejected: deleting the branch before HIL publication would lose the live result landing
spot; deleting its unmerged source without a pushed tag would discard distinct producer history.
Deleting ignored output wholesale would lose unpublished intermediates, so retain all local bytes.
The initial tag push used a PowerShell-interpolated refspec that Git rejected before transmission;
the literal refspec succeeded and the remote tag/peeled target were independently checked.
Non-force `git worktree remove` removed the registration but left part of the directory, including
two broken dependency junctions. The remaining nondependency files belonged to the tagged source
tree. Removed only those junction entries, then the resolved exact retired directory with native
PowerShell; this completed cleanup without following links or removing any output staging.

Closure verification: `npx.cmd vitest run runner/test/evidence-integrity.test.ts runner/test/progress-index.test.ts`
passed 2 files / 18 tests; `npm.cmd run lint:rule7` and scoped staged whitespace checks passed.
Exact command/exit/log receipts remain in primary `out/bld-branch-retirement-2026-10-08/`.
These are custody and metadata checks, not a new scientific full-suite result.

## Goal and done when

### HIL pickup of BLD results — 2026-10-08

Goal: make the published BLD results discoverable and verified on HIL, alongside HIL's completed
56-row first batch and sixteen-row successor, for the next joint scientific review. Use isolated
`codex/hil-bld-results-integration` at
`C:/Users/biao3/.codex/worktrees/hil-bld-results-integration/snowflake`; preserve the three
task-owned primary live documents and all fixed execution checkouts/output. No simulation or
new scientific interpretation is part of this import.

Incoming `origin/codex/bld-exploration` is `b333782`, based on common ancestor `f4ca38a`.
It includes a separate resume implementation and a branch-local decision also numbered 0060.
Import exact BLD result/recovery evidence and pins, its one NAS catalogue entry/manifests,
the existing catalogue census row, and attributed completed-execution/preservation prose.
Keep current HIL solver, codecs, runner, charter and accepted decisions unchanged. The incoming
branch and producer `d7ff3e1` remain the authority for reproducing BLD execution; do not imply
checkpoint compatibility or identical producer behavior. Full code/authority reconciliation
is a separate decision, not a prerequisite for reading completed BLD observations.

Sequence: commit this bounded pickup plan; preserve imported files byte-for-byte; reconcile
current progress without losing either host; resolve the marked NAS via HIL's mount; verify
the complete collection, restore to fresh local staging and independently verify the restored
set. Reuse the existing per-row summary for all 42 terminal rows. Explicitly inspect BLD's
`resumableState`/`checkpointCycle` metadata before comparing the shared scientific fields;
do not silently drop unknown status fields or run its producer-specific verifier unchanged.
Retain originals and verification logs. No new verifier framework or storage implementation.

Done when imported pins/catalogue/progress checks pass, all restored bytes match the committed
owner manifest, existing row checks rederive 42 endpoints, and the next joint-review landing
spot names both sources and remaining interpretation limits. This is not a charter milestone.
Nearest-boundary verification: existing catalogue/evidence-integrity/progress-index suites,
Rule 7 and scoped diff checks, plus the actual NAS/restore and row readout checks. Importing
already produced evidence with unchanged executable machinery does not rerun simulations or
the full scientific suite. A later executable scientific change would require exact `npm test`.

Relevant lessons: A1/A2 require real bytes and digest-safe checkout; C4/E1 forbid turning
completed coverage into an unsupported scientific conclusion; E6 requires preserving each
producer's actual bindings. Rules 14A–14B: solo research, hostile actors excluded, one end-to-end
deliverable is usable BLD observations on HIL. Existing loaders and summaries address accidental
wrong collection, partial restore and status misinterpretation; no added assurance machinery.

Tried and rejected for pickup: a whole-branch merge would collide with independently developed
resume code and duplicate decision numbering. Import completed evidence and preserve source
provenance instead of silently replacing the tested HIL implementation.

Pickup verification: the existing full-hash NAS command, fresh restore and independent restored
set check all passed on HIL for 2061 files / 1050129781 bytes, tree SHA-256
`2c77efcd57f7586c68af44a1da257385f97333aec6487cbdf8c6aeb17e8585b0`. The restored payload is
`out/restores/bld-first-batch-output-2026-10-08/` in this integration worktree. HIL's existing
per-row summary rederived all 42 size endpoints and exactly matched the shared scientific fields;
BLD terminal/status-cycle metadata was checked separately rather than silently omitted.
The restored summary was not rewritten. The [pickup bundle](../../evidence/hil-bld-pickup-2026-10-08/README.md)
retains exact logs/exits, both source identities, original BLD authority/plan records and checked
rows. These establish usable saved observations; no checkpoint migration, trajectory-equivalence
claim, numerical rerun or morphology interpretation occurred.

The first pickup metadata check passed catalogue/evidence integrity but rejected the live progress
index at 258 lines (limit 250). Compact current next steps and retain dated details in their
existing plans; the limit and test remain unchanged. Keep the failed receipt with the final check.

Final pickup metadata verification passed three files / 27 tests (catalogue, evidence integrity
and progress index), Rule 7 and scoped whitespace checks. Exact imported raw logs and the historical
portability patch remain byte-frozen and are excluded only from whitespace normalization checks.
One bounded non-author Codex/GPT-6 shared-context review independently compared imported Git blobs,
all 52 BLD pins, preservation of existing pins/catalogue entries and the staged scope/claims.
It found no blocking issue; it did not rehash NAS, rerun tests or evolve simulations. The operator's
actual NAS/restore/row checks are recorded separately in the pickup bundle.

Rule 16 disposition: the five registered worktrees are primary, the original stopped HIL checkout,
both completed HIL execution checkouts and this one result-integration branch. The three old
execution heads and all ignored output remain fixed/retained. Primary's three task-owned live
documents are included by plan commit `a834d08` and reconciled here; exact pre-integration local
bytes are hash-verified in primary `out/hil-bld-pickup-primary-reconciliation-20261008/`.
The integration checkout retains the verified BLD restore as the next joint-analysis staging area.
No temporary review checkout, redundant recovery ref, PR or deletion is introduced. Preserve the
remote BLD and unrelated film branches; this import does not declare their code merged.

BLD can pull one tested producer, select its named workload, measure its local resource budget,
and launch a finite queue without needing HIL to design another protocol. HIL has the equivalent
commands for its own queue. This milestone has no charter phase done-when; completion requires
all named rows selectable, bounded execution and resource checks exercised, focused negative
controls and exact `npm test` passing, and shared code published. Scientific results follow the
maker's dispatch; this implementation session does not start the full campaign.

## Resumable rerun: maker direction 2026-10-07

Implementation: `codex/discovery-resume` in primary's `.tmp-discovery-resume/` worktree.
The retained original execution checkout is separate and receives no source edits.

The maker explicitly requires: stop the current run, make it resumable without the four-hour
limit, then rerun. This supersedes the non-resumable terminal-stage choice below, not the
registered scientific rows, observations, numerical controls or scientific endpoint/adequacy rules.
There is no charter phase done-when for this operational extension. The concrete deliverable is
HIL executing the same named workload with working fresh-process continuation and no elapsed-time
termination; BLD receives the same tested source and explicit commands.

**Done when:** all registered row families support checkpoint/restore with unchanged scientific
state and continuation; interrupted and uninterrupted witnesses agree in fields, ordered topology,
events, snapshots, timeline transitions and numerical metrics (excluding declared operational time,
RSS and process metadata); corruption and incompatible row/source/runtime are refused; a real N64
worker is interrupted and continued in a fresh process; exact `npm.cmd test` passes at a stable
checkpoint; shared code is published and HIL is rerun from its seeds under the new protocol.

Approach and sequence:

1. Preserve the original execution worktree and observations. HIL was stopped at
   `2026-10-08T04:27:33.5093531Z`; primary
   `out/hil-manual-stop-20261007T212733/stop-receipt.json` and `owned-processes-before.json`
   record the exact owned processes. The post-stop process query found no matching launcher or
   workers. Abruptly stopped observations are not checkpoint state and cannot be upgraded retroactively.
2. Commit this amendment and decision 0060 before implementation in one isolated implementation
   checkout. The new discovery-only format supports ordinary M1/no-dip including the registered
   single environment event, the four facet arms, and full/early width modes. Preserve all historical
   formats/refusals and experiment identities; proposed 0039's Phase 6 production machinery stays deferred.
3. Reuse the existing complete-cycle solver state and row producer. Publish a checkpoint initially
   and after every completed cycle (including any just-fired environment event), using temporary
   files and atomic publication of a complete generation; retain the previous complete generation.
   Bind exact row/source/Node/V8, solver state, runner accumulators, event-prefix bytes and snapshots.
   Resume rolls observations back to that committed boundary, preserving discarded tails separately,
   and repeats only unfinished work. A partial relaxation never becomes a completed event.
4. Add explicit batch/row resume commands using the original campaign directory; retain attempt-specific
   process logs/exits. Completed valid rows are skipped, unfinished rows restore their latest complete
   checkpoint, and an unstarted row begins from its seed. A partial checkpoint never replaces the last
   good generation. No automatic restart loop hides solver or evidence failures.
5. Remove the production four-hour worker/parent timers. Keep the short resource-probe timeout and
   live memory protection. Retain scientific size/contact/convergence/stall and existing update-cap
   meanings; a step cap remains unresolved. Checkpointing makes subsequent continuation possible,
   while extending a registered scientific observation window remains an explicit protocol decision.
6. Use focused differential/negative controls while implementing; then one bounded review after the
   interfaces stabilize, exact `npm.cmd test`, and a real N64 process interruption/continuation witness.
   Requalify the changed producer on HIL and rerun into a new output directory. Record exact launch,
   checkpoint cadence and resume command before dispatch. Publish instructions for BLD to perform its
   own qualification and restart with the same producer.

Rule 14A scope: plausible failures are interruption during checkpoint publication, stale observation
tails, missing experimental/history state, wrong-row continuation and duplicate event application.
These can change scientific trajectories or corrupt their evidence. Existing v3 rejects these rows,
and observations omit evolution fields; nearest-boundary state/row tests and atomic checkpoint I/O
address those gaps directly. Their cost is lower than rerunning long experiments. This is solo
scientific research; hostile repository/runtime control stays excluded. No new transport, dashboard,
registry, gate framework or Phase 6 evidence machinery is needed.

Relevant lessons: A3 (concurrent writers overwrite evidence) requires one row writer and an explicit
committed prefix; E4 (reachable boundary fill exactly one) requires the existing state witness and
history-aware report absence after an environment event; F1/F2 require returning to the usable
pause/continue path before expanding process. Existing core/solver resume and timeline tests are
the starting seams. New tests cover first-batch modes and actual subprocess recovery. Bitwise
continuation is scoped to the pinned Node/V8 oracle; operational time and RSS are not deterministic.

Out of scope: recovering absent state from the stopped original processes; changing physical inputs,
solver equations, scientific targets or held-out/phase status; experimental facet/width plus environment
events; geometric-completion ablations; GPU resume; remote control of BLD; generic scheduling services.

Implementation checkpoint: the separate core codec and solver adoption, row generation publication,
observation-tail recovery and explicit batch resume are implemented. The initial synchronous format
is bounded to 64^3 cells / 64 MiB encoded bytes, covering this entire N64 roster; larger-domain
continuation requires its own measured extension. Old v3 eligibility and numerical evolution remain
unchanged. Resource probes now exercise checkpoint creation too, with only their parent watchdog.

Commands for the replacement campaign (from its clean, fixed execution checkout):

```powershell
node runner/src/hil-bld-batch-main.ts probe HIL out/batch1-hil-resumable-probe
node runner/src/hil-bld-batch-main.ts launch HIL out/batch1-hil-resumable out/batch1-hil-resumable-probe/probe.json
node runner/src/hil-bld-batch-main.ts resume HIL out/batch1-hil-resumable out/batch1-hil-resumable-probe/probe.json
```

BLD substitutes its host and `batch1-bld-resumable` paths after pulling the published producer.
Resume uses the original directory, source/runtime and probe; it does not change a row's scientific
target or update limit. Use Ctrl+C in a visible launch terminal to stop the coordinator and its owned
workers. Detached operation records its exact owned-process stop command with the launch controls;
an OS termination can lose the current unfinished cycle, while completed checkpoint generations remain.
Each checkpoint publishes after a complete cycle, including a just-fired history event. The two
referenced generations are retained; a third superseded generation is reproducible recovery scratch.
Uncommitted observation tails and partial generations are preserved for diagnosis. Resume wallSeconds
sums checkpointed active intervals and the current attempt; lost in-flight time is separately visible
in process-attempt receipts and is not recovered by inventing elapsed time from a dead process.

One bounded non-author Codex/GPT-6 review, with inherited shared context, independently reproduced
partial-result recovery failure using a real checkpoint. It also traced a stale-owner takeover race
between simultaneous resume commands. Repairs route partial result/exit receipts into validated
checkpoint recovery, atomically publish batch receipts and serialize stale-owner replacement with
an exclusive acquisition guard. Real competing worker tests exercise the row boundary. An interrupted
acquisition guard fails closed for explicit owner inspection; no automatic takeover-of-takeover is
introduced. The reviewer did not run the full suite, a campaign, or the N64 interruption witness.
The author verified these repairs with targeted checks and the full suite below.

## Resume verification and publication

Exact `npm.cmd test` at clean `a8790299add706e639b3f7ffc4bcbf29ae0f8b2b`, Node v24.13.1, exited zero: 233 files / 3031 tests passed, 23 skipped; Vitest 886.86 seconds. Rule 7 and both typechecks are included.
The [verification receipt](../../evidence/discovery-resume-2026-10-07/verification.json) binds raw logs, commands, source and exit. No implementation change follows this checkpoint.

The [real N64 witness](../../evidence/discovery-resume-2026-10-07/n64-receipt.json) at `0747ea9` uses the registered HIL basal-only, radius-three/thickness-one, -7 C row with only its maximum updates reduced to three. Worker 24896 was actually terminated after committed tick one; fresh worker 7704 resumed to tick three. Direct worker 21060 and resumed worker both exited zero with three converged updates, step-cap termination and no integrity errors. The complete 4,459,061-byte final solver states match SHA-256 `6f320f5971dc3552f79112dde62345100b7a2558f9c0c9811eb65f23cd3fb047`; scientific results, three event records and the 37,389-byte spatial snapshot match after excluding only declared operational time/RSS fields. This is one short N64 restart witness, not an endpoint or mature-capacity result. Only progress/plan prose changed before the passing full check; the receipt verifies unchanged executable source.

Project-owned verification bytes fit Git and are permanently retained in `evidence/discovery-resume-2026-10-07/`, pinned in the root manifest. `n64-witness.tar.gz` contains the complete raw witness, checkpoint generations, interruption state, observations and process receipts; a fresh extraction was compared with every original file. The bundle also retains the original HIL stop records. All original staging remains.

Rule 16 inventory records exactly the primary main checkout, stopped `codex/hil-first-batch` at `f4ca38a`, and `codex/discovery-resume` implementation checkout. Primary's six task prose copies are preserved by the implementation commits; only those duplicates may be reconciled before fast-forwarding main. The old execution checkout and all outputs remain retained. No unrelated changes or temporary review worktree were found; no PR is used for this maker-authorized main publication. The implementation checkout becomes the fixed-source replacement execution checkout after publication. Keep its HEAD unchanged from capacity qualification through campaign completion; maintain live progress only in primary.

Hidden-run controls are prepared under implementation `out/batch1-hil-resumable-control-20261007/`. Exact pause: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/batch1-hil-resumable-control-20261007/stop-hil.ps1`; it records and stops only the matching wrapper/coordinator/workers and retains all output. Resume uses the command above (or `resume-hil.ps1` in a persistent terminal). Launch remains pending until the changed checkpointing producer passes its fresh HIL resource probe.

Closeout metadata checks passed: two files / 18 tests for evidence integrity and the progress index,
plus Rule 7 lint. `closeout-checks.json` and its two logs in the verification bundle bind the commands
and exits. Raw full-check log EOF whitespace is retained byte-exact and excluded only from the
whitespace check; no implementation changed after the full-check checkpoint.

## HIL resumable execution 2026-10-07

Shared main was pushed and remotely verified at `b9cf7ed72c82e350b93570fafd8e45afa0b95d53`.
Primary main was fast-forwarded after reconciling only its six task-owned prose copies;
`out/hil-resume-reconciliation-b9cf7ed/receipt.json` retains their exact local snapshots and
disposition. Three worktrees remain: primary main, retained original `codex/hil-first-batch` at
`f4ca38a`, and replacement execution `codex/discovery-resume` in `.tmp-discovery-resume/` at `b9cf7ed`.
All were tracked/untracked clean at publication; ignored outputs and dependencies are retained.
No PR or temporary review checkout was created. Do not change the replacement execution HEAD.

Hidden wrapper PID 18404 started at `2026-10-08T05:31:45.1218942Z`, recorded in execution
`out/batch1-hil-resumable-control-20261007/invocation.json`. No scientific or Vitest worker was
present before qualification. It executes the registered probe and then the registered launch
command above only if qualification succeeds. `state.json`, separate probe/campaign stdout and
stderr, and real exit receipts in that control directory record each phase. Live prose is
maintained only in primary; this execution record is intentionally not committed in the running checkout.

The probe exited zero at `2026-10-08T05:39:28.4160867Z` (`probe-exit.json`). Its `probe.json`
qualifies actual maximum concurrency 1/4/8/16 and recommends 16. The 16-worker rung took
61.593 seconds, with minimum available physical memory 51,306,455,040 bytes and minimum commit
headroom 59,790,082,048 bytes. These are short-prefix measurements, not mature-geometry capacity.

Replacement production launched at `2026-10-08T05:39:28.651Z` (22:39 PDT), bound by
`out/batch1-hil-resumable/campaign.json` and `first-batch-HIL-launch.json` to the published source,
56 registered rows and concurrency 16. At `2026-10-08T05:41:12.986Z`, control `startup-check.json`
observed all 16 started rows with committed complete-cycle checkpoints (ticks 20–21); the named
resource sample contains 16 live children, available physical memory 50,624,356,352 bytes and
commit headroom 59,100,864,512 bytes. This establishes operational startup and ongoing checkpoint
publication, not completed scientific outcomes. The entire stopped original run remains retained.

Exact production resume, from the fixed execution checkout after its prior processes are stopped:

```powershell
node runner/src/hil-bld-batch-main.ts resume HIL out/batch1-hil-resumable out/batch1-hil-resumable-probe/probe.json
```

Use the recorded stop/resume control scripts for this hidden launch; a visible resume terminal
supports Ctrl+C. Attempt stdout/stderr live under `rows/<row-id>/attempts/<attempt-name>/`, with
separate real exit receipts. Keep all row/checkpoint generations, probe and control files until
joint HIL/BLD review and governed preservation. On completion inspect `first-batch-HIL-complete.json`
and `campaign-exit.json`, then run the existing `summarize` command for `out/batch1-hil-resumable`.
BLD must stop its old source before updating, pull the shared producer, run its own new probe and
launch into new paths; old observations cannot be retroactively resumed. No BLD process was controlled.

## HIL completion 2026-10-08

The 56-row queue ended at `2026-10-08T09:57:50.191Z` (02:57 PDT), wrapper exit 2; no row
remained unstarted and no coordinator abort occurred. Of those rows, 50 reached extent 21
with exit zero; six stopped on EPERM while renaming a pending checkpoint generation. This is
not an all-success completion. There was no production wall-time cutoff. The full census is
execution `out/batch1-hil-resumable-control-20261007/completion-triage-20261008.json`.
Each failed row has a valid converged checkpoint one cycle before the failed publication; their
source binding remains `b9cf7ed`. Preserve them for explicit recovery without changing that checkout.
The cause of the Windows rename denial is unproven; no numerical convergence failure was recorded.

The maker selected the [next HIL exploration batch](hil-exploration-batch2.md). Its sixteen new
seed/pressure rows use the measured first-batch leads; the six missing endpoints remain unresolved.
The old run and its source/runtime, logs, checkpoints and failed tails remain retained. Do not
silently consume these checkpoints under a newer producer or repeat all fifty completed endpoints.

## Explicit six-row recovery — 2026-10-08

The maker requested recovery of the failed batch. Resume exactly the six checkpoint-publication
failures in the original clean `b9cf7ed` checkout, using their committed states and unchanged
scientific targets. This is operational reuse of accepted decision 0060 and the existing tested
row launcher, not a new scientific implementation. The deliverable is six explicit continuation
attempts with separate logs, real exits, and preserved failed observations. The fifty successful
endpoints are excluded. Solo scientific research; hostile actors remain outside scope.

The campaign selector correctly requires review of `solver-error` results. A bounded non-author
Codex/GPT-6 review with shared context traced the existing explicit `resume-row` route: it validates
source/runtime/spec, checkpoint payload and event-prefix digests, solver controls and history before
archiving failed result/status/exit files and excess events under `resume/recovery-*`. No failed
result is erased or relabeled to satisfy the campaign selector. The reviewer inspected code and
retained triage; it did not rerun the solver or independently reload checkpoints. The launch
preflight freshly loads each checkpoint, with the unchanged worker performing complete row/control
checks before recovery. Existing full-suite and actual N64 interruption receipts remain applicable.

Use existing `launchDiscoveryRows` with six named rows, `resumeExistingRows: true`, a unique
attempt name, explicit `resume-row` worker arguments and `sampleBatchHost` memory monitoring.
No production wall deadline or automatic failed-worker retry is added. HIL batch 2 currently
owns sixteen workers; wait until at least six slots are available under the combined ceiling
of sixteen. The batch-2 finite queue has already started all sixteen rows, so its running count
can only decrease unless separately resumed. Recheck live processes and memory before dispatch.
Leave the active batch and both fixed execution sources unchanged.

The operational command and receipts live in original execution
`out/batch1-hil-recovery-control-20261008/`; the recovery attempts remain inside the original row
directories. Lesson C1 applies: recover intact scientific state after an I/O failure instead of
recomputing fifty successful endpoints. Lesson A3 requires one campaign/row writer and preserved
committed prefixes. The existing coordinator/row leases and checkpoint loader cover these boundaries.
Original source still has one-shot checkpoint publication: a repeated EPERM must remain visible,
and the newer retry implementation cannot be silently substituted into source-bound continuation.
No new numerical tests or full scientific suite are needed for this dispatch-only work.

Fresh preflight at the original source loaded and restored all six saved solver states without
evolving or recovering them. In the command's registered order their checkpoint ticks are
256, 46, 85, 93, 170 and 170; each is one cycle before its failed publication. The full row
identities, original failed results, initial exits and checkpoint manifest hashes are retained in
`out/batch1-hil-recovery-control-20261008/preflight.json`. Node syntax and both PowerShell control
scripts' syntax checks pass. No tracked executable source is changed.

The hidden wrapper started at `2026-10-08T16:04:00.8892844Z` (09:04 PDT), PID 18740;
coordinator PID 22120 owns the original campaign lease. `wrapper.json` and `invocation.json`
record exact commands. Attempt name is `recovery-io-1791475441339`; launch name is
`first-batch-HIL-recovery-io-1791475441339`. At `2026-10-08T16:04:04.075Z`, `state.json` records
`waiting-for-six-worker-slots`: fourteen other scientific workers are active. No recovery worker
has started at that observation. The memory sample has 48392634368 available physical bytes and
56379691008 bytes of commit headroom. The queue starts the six continuations once at most ten
other scientific workers remain and the memory check passes. There is no waiting deadline.

Exact one-time coordinator command, from the fixed original checkout:

```powershell
node out/batch1-hil-recovery-control-20261008/recover-six.mjs
```

This one-time coordinator has finished; do not invoke it again. Its retained pause command:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/batch1-hil-recovery-control-20261008/stop-recovery.ps1
```

Coordinator logs are `recovery.stdout.log` / `recovery.stderr.log`; the wrapper writes
`recovery-exit.json` on actual exit. Each row retains `attempts/recovery-io-1791475441339/`
command/stdout/stderr/exit files. Existing checkpoint cadence remains every complete cycle with
two generations. After dispatch verify advancement beyond the six ticks above. After completion
inspect the recovery-specific completion receipt and run the existing first-batch `summarize`
command against `out/batch1-hil-resumable`. Its original failed queue receipt is historical and
must not be overwritten. If interrupted after dispatch, inspect terminal failures first, then
use the registered campaign resume command for unfinished rows; repeated solver-error requires
explicit review, never erasure. Keep this control directory, all failed tails and row outputs.

## Recovery completion 2026-10-08

The six-row continuation launched at `2026-10-08T16:07:48.188Z` and finished at
`2026-10-08T17:28:03.672Z` (09:07 to 10:28 PDT), with six actual workers, six exit-zero
receipts, no abort and no unstarted row. Source is unchanged `b9cf7ed`. The exact completion
record is `out/batch1-hil-resumable/first-batch-HIL-recovery-io-1791475441339-complete.json`;
the row-level attempt logs remain under `attempts/recovery-io-1791475441339/`.

The existing `node runner/src/hil-bld-batch-main.ts summarize out/batch1-hil-resumable` now
rederives 56 `size-endpoint` rows, all at extent 21, with zero summary errors. The complete
census is campaign `summary.json`, copied to recovery control `completion-summary-20261008.json`.
Primary `out/hil-status-20261008T160558/completion-status.json` retains that census, its source
hash and the actual completion record. The original 50-success/six-failure queue receipt remains
unchanged as the historical initial attempt.

The same bounded shared-context Codex/GPT-6 reviewer independently re-executed the existing
per-row summary and read-only checkpoint load for all six: each final checkpoint agrees with
its terminal result, each attempt has exit zero and empty stderr, and each recovery archive
preserves its original failure and one excess event record. In the registered recovery order,
final cycle counts are 601, 529, 433, 423, 343 and 594. The reviewer did not evolve the solver,
run a test suite or derive a morphology interpretation.

Operational limitation: PowerShell `recovery-exit.json` recorded `exitCode: null`; that is an
unavailable wrapper observation, not an observed zero. Six actual worker-close receipts, checked
row evidence and the coordinator's completion/state records support completion independently.
Do not rewrite the null receipt or treat it as a new scientific failure. At the 16:05 PDT process
inspection no matching HIL worker/coordinator remained. Keep both initial and recovery records.

Next: use all 56 endpoints with the completed sixteen-row successor in the registered comparison
readout; gather BLD's separate results. No further HIL retry or scientific run is pending here.

## Registered original first stage (elapsed-time policy superseded above)

The following are design choices, not measured outcomes. All rows use N64, dx 0.35 um,
fill CFL 0.05, largest extent target 21, spatial samples at pre-update extent crossings
5/9/13/17, maximum 20,000 updates, and a four-hour wall budget per row. The parent terminates
a nonresponsive child after an additional 60 seconds. Existing discovery fixed settings remain:
v6, monopole boundary, hexagonal prism, noise zero, seed one, residual tolerance 1e-9,
divergence tolerance 1e-7, maximum 200,000 relaxation sweeps. Sigma is the named fraction of
`phase6SigmaWaterFromTable(tempC)`, computed without hand-rounded substitution. Pressure is
101325 Pa except where explicitly varied. Canonical seed radius 2 / thickness 1 except seed track.

| Host | Track | Cartesian comparisons | Rows |
|---|---|---|---:|
| HIL | seed | -7/-9 C, fraction .15, radius/thickness 3/1 and 1/5, four facet arms | 16 |
| HIL | pressure | -6 C, fractions .10/.15/.20, 50662.5/202650 Pa, four facet arms | 24 |
| HIL | environment history | -6 to -14.4 C and reverse, fraction .15 at each environment, switches at extent 7/11/15, ordinary M1/no-dip; four matching static controls | 16 |
| BLD | cold core/tip | -12/-14.4/-18 C, fractions .10/.15/.20, four facet arms | 36 |
| BLD | warm history | -4.5/-5 C, fraction .075, broad/no-dip, full local basal width 3, early-only width 3 with cutoff 20 physical seconds | 6 |

Four facet arms mean both, neither, basal-only and prism-only through the existing explicit
experimental facet API with M1 base. Histories use ordinary preparations, never experimental
facet/width plus environment events. Static controls use the same sampling contract as switched
rows. Repeated controls supply newly matched spatial observations; the prior completed matrices
are not reopened. Each host queue interleaves comparison blocks where practical.

This coarse stage asks about early structure, growth memory and facet/transport interactions.
Fine-grid and changed-seed warm-history refinement remains a later selected stage. Target 21 is
a smaller observation window than the old target 29; it does not inherit the old final findings.
Four hours is a bounded loss limit, not a prediction of endpoint completion. A cap, missed event,
or cutoff not reached leaves that comparison unresolved; it cannot establish an absent effect.

## Execution and resource qualification

Historical original protocol: its non-resumable execution and wall budgets are superseded by the resume section above. The finite roster, worker ceilings and memory limits remain.

One finite CLI provides `list HIL|BLD`, `probe HIL|BLD <directory>`,
`launch HIL|BLD <directory> <probe-receipt>`, and `summarize <directory>`.
HIL's process ceiling is 16 and BLD's 28, from the approved declared capacity minus four slots.
Probe actual row families with short three-update prefixes at process counts 1/4/8/16 for HIL
and 1/4/8/16/28 for BLD; bind the receipt to host, runtime, source and workload.
Each probe child has a three-minute budget. A failed rung cannot qualify its worker count.
Record available memory and commit headroom, per-process memory and actual concurrency/timing.
Require at least 12 GiB available RAM and 8 GiB commit headroom. At launch, monitor those same
limits and stop owned children/queue on exhaustion. Short-prefix measurements are explicitly
non-transferable to mature geometry; live monitoring and bounded terminal stages manage that
remaining uncertainty. No experimental checkpoint-resume claim is made.

The finite representatives are six HIL paths (two seed geometries, two pressure extremes, and
ordinary M1/no-dip histories) and seven BLD paths (four cold facet arms and three warm modes).
`firstBatchRepresentativeRows()` names exact rows. At each rung, cycle these representatives
through `max(representative count, requested workers)` jobs. These deliberately limited prefixes
do not qualify every scientific setting or the post-event environment. A failed rung stops the
ladder and leaves the largest earlier safe rung available; no completed rung means no launch.

### Commands after publication

In the clean task checkout on BLD, pull the published main version and install locked dependencies.
Use Node v24.13.1 on both hosts to retain the recorded oracle runtime scope.
List is immediate; probe runs actual bounded numerical work and records its limits. Close other
heavy compute before qualification. Do not pull a changed source commit between probe and launch.

```powershell
git pull --ff-only origin main
npm.cmd ci
node runner/src/hil-bld-batch-main.ts list BLD
node runner/src/hil-bld-batch-main.ts probe BLD out/batch1-bld-probe
node runner/src/hil-bld-batch-main.ts launch BLD out/batch1-bld out/batch1-bld-probe/probe.json
node runner/src/hil-bld-batch-main.ts summarize out/batch1-bld
```

HIL substitutes `HIL` and `batch1-hil`. The launch command uses the measured recommendation;
it does not silently assume the planning ceiling. Run it in a persistent local terminal, or
use PowerShell `Start-Process -WindowStyle Hidden` with separate launcher stdout/stderr paths.
Per-case logs are already separate under `rows/<row-id>/`; `first-batch-BLD-status.json` records
active/completed work and `first-batch-BLD-resources.jsonl` records sampled memory. Keep all output
directories intact for joint review. Existing output paths are refused; repeat probes use new paths.

Every row retains its command, source/runtime, separate stdout/stderr, exit status, spec,
completed events, spatial snapshots and terminal status. Resume means rerunning an explicitly
unfinished row from its seed into a fresh directory; this is fresh computation, not checkpoint
continuation. Never overwrite a row. An interrupted relaxation is not a completed event.
Legacy `admissible` remains restricted to valid size-target endpoints. Summary checks read the
persisted events and result and distinguish reached endpoints, capped prefixes and failures;
they do not inherit an admissibility flag or silently accept a partial relaxation.

## Readout and interpretation

The first deliverable is a launchable producer and an honest inventory of event coverage,
physical-time range, size crossings and termination. Retained events and spatial snapshots
support later track-specific readouts: seed volume/occupancy and facet contributions; pressure
at common physical age and size; cold central-plane core/tip radii and depth; warm surviving/new
openings and demand after cutoff; exact event time and elapsed physical seconds for histories.
Compare common physical-time brackets, never interface-cycle offsets. Full morphology reports
follow completed bundles and joint review; a generic terminal summary is not that analysis.

## Smallest implementation and verification

Plausible accidental failures are selecting the wrong host's rows, unbounded experimental work,
oversubscribing RAM, losing the distinction between a completed update and interrupted solve,
and interpreting a cap as a negative result. They affect scientific prefixes and comparison
membership. Existing launch code records rows but lacks named loads, wall limits and local
qualification; existing analyzers reject incomplete rows but do not inventory this new roster.
Add only those seams. This is solo research; hostile substitution is outside scope.

- Commit this protocol before implementation.
- Reuse the discovery solver/row producer and child-process queue; preserve legacy defaults.
- Test factorial membership, host disjointness, timer interruption before/after complete updates,
  legacy admissibility, actual subprocess logs/exits/overlap, resource failures and capped summary.
- Exercise a bounded actual HIL experimental prefix and terminal stop; publish the local command
  and outcome. BLD's local probe is its first executable task after pulling.
- Run exact `npm.cmd test` once the implementation stabilizes, then integrate and push.

## Source currency and limits

Bounded Rule 12 check on 2026-10-07 inspected submission histories for
[TAX2](https://arxiv.org/abs/2306.13087) (v1),
[CM9](https://arxiv.org/abs/2011.02353) (v1) and
[CM4](https://arxiv.org/abs/1512.03389) (v2), and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No superseding snow-growth entry was found there after TAX2; this is not an exhaustive review.
No new physical parameter extraction, solver-physics change, validation or Phase 7/S6 work occurs.

## HIL execution 2026-10-07

**Stopped at maker direction; the following is its retained original launch record.** Use the replacement paths and resume protocol above for new execution.

The maker requested a new HIL execution worktree after reporting BLD started. Git remote
`refs/heads/main` was verified at `f4ca38a44fefda0de514491bd5ce3044479829ec` on this host.
Managed worktree `C:/Users/biao3/.codex/worktrees/hil-first-batch/snowflake`, branch
`codex/hil-first-batch`, is clean at that source commit with locked dependencies installed and
Node v24.13.1. Keep this execution HEAD and source fixed through campaign completion: the
probe binds the source and each queued row records HEAD when it starts. Maintain live prose
in the primary checkout; this separation avoids changing the running source identity.

The hidden detached wrapper started at `2026-10-08T04:08:07.3893597Z`, PID 8344, recorded in
execution-worktree `out/batch1-hil-control-20261007T210807/invocation.json`. Commands below are
readable equivalents; exact absolute arguments are in probe `invocation.json` and `campaign.json`:

```powershell
node runner/src/hil-bld-batch-main.ts probe HIL out/batch1-hil-probe
node runner/src/hil-bld-batch-main.ts launch HIL out/batch1-hil out/batch1-hil-probe/probe.json
```

The probe exited zero at `2026-10-08T04:15:46.1940360Z` (`probe-exit.json`). All four rungs
qualified with actual concurrency 1/4/8/16, and `out/batch1-hil-probe/probe.json` recommends 16.
The 16-worker rung took 61.395 seconds; its minimum available physical memory was 52,265,893,888
bytes and minimum commit headroom 60,545,335,296 bytes. These figures are from that receipt's
16-worker rung, not a mature-geometry capacity claim.

The campaign launched at `2026-10-08T04:15:46.437Z` (21:15 PDT on October 7), recorded in
`out/batch1-hil/first-batch-HIL-launch.json`; `campaign.json` binds 56 rows and concurrency 16
to frozen `f4ca38a`. The resource sample at `2026-10-08T04:16:45.1080189Z` records 16 live
children. Initial row status/events show completed updates in all 16 launched rows; their
stderr files were empty at this startup inspection. This establishes operational startup only.

Control `state.json`, separate `probe.stdout.log` / `probe.stderr.log`, `probe-exit.json`,
`campaign.stdout.log` / `campaign.stderr.log` and eventual `campaign-exit.json` live under
the control directory above. Per-row logs, commands, exit receipts and resource samples live
under the probe/campaign directories. These are active local staging: retain the worktree and
all outputs until joint review and the applicable evidence/asset preservation step.

This is solo scientific exploration with hostile actors excluded. The immediate deliverable,
the registered HIL queue running at locally qualified concurrency, is established by those
receipts and live workers. No scientific code or protocol changed, so the existing full-check receipt remains
the implementation check. These short prefixes qualify only their measured workload; live
memory limits and four-hour terminal stages still apply. No experimental resume is claimed.

Next: inspect resource samples and `rows/<row-id>/status.json` / logs; the aggregate status file
appears after the first row finishes. Once `first-batch-HIL-complete.json` and the control
`campaign-exit.json` exist, run `node runner/src/hil-bld-batch-main.ts summarize out/batch1-hil`
from the execution worktree. Preserve capped prefixes as unresolved, gather BLD's receipts and
jointly review before selecting follow-up work. Do not pull, edit or commit in the execution
worktree, start a duplicate queue, or remove it while it owns these active output bytes.

## Tried and rejected

- The first resume full check at `0747ea9` exited one solely on two progress-index assertions:
  the required literal `pause/resume before launch` had been changed to `before relaunch`.
  Its receipt in `out/discovery-resume-verification-2026-10-07/full-check-result.json` and raw logs
  record 232 passing files / 3,029 passing tests, 23 skipped and those two failures. Restore the
  required prose, retain the failed receipt and rerun exact `npm.cmd test`; executable code and
  the passing N64 interruption witness are unchanged.

- Four-hour terminal stages without restart (maker rejected 2026-10-07): the time budget was not
  measured to reach every scientific event and could lose informative later behavior. HIL's original
  run is stopped and retained; implement real continuation before rerunning without that cutoff.

- Portfolio-only publication left BLD without executable work. This slice supplies named commands.
- Reusing ordinary three-cycle host capacity as experimental qualification would cross the
  measured configuration; the new probe exercises actual roster families and reports its limits.
- Starting full fine-grid histories without restart repeats the paid-for multi-day loss risk.
  Completed-wave artifact `rows[].analysis.result.wallSeconds` records long fine runs; keep them
  out of this bounded coarse first stage.
- Widening ordinary checkpoint eligibility or treating observations as restart state was rejected.
  Accepted ADR 0060 supplies the separate tested discovery format while preserving ordinary refusals
  and proposed ADR 0039's production boundary.

## Implementation record

Protocol committed at `3948c8f` before code; implementation checkpoint `ad990ac` adds the finite
roster, named CLI, reused queue, optional discovery wall budget and coverage inventory. Ordinary
solver equations and checkpoint refusals remain unchanged. HIL has 56 rows and BLD 42, directly
enumerated by `hil-bld-batch-roster.ts`; the roster tests exercise every factorial block.

Exact `npm.cmd test` at clean `ad990ac`, Node v24.13.1, exited zero: 230 files / 2,981 tests passed,
23 skipped, Vitest duration 819.92 seconds. Source: tracked
[`verification.json`](../../evidence/hil-bld-first-batch-2026-10-07/verification.json),
`full-check-result.json` and raw full-check stdout/stderr in the same bundle. Rule 7 and both
typechecks are included. No implementation changes followed this checkpoint.

The tracked `actual-prefix/receipt.json` records two real N64 three-update cases on HIL: a
basal-only seed row and an early-width warm row, both completed with exit zero. The queue recorded
actual maximum concurrency two, child commands/logs/exits and live Windows memory samples.
These are operational prefix witnesses, not full host budget qualification or scientific endpoints.
Budget tests also execute real tiny experimental updates and compare interrupted prefixes to
uninterrupted events; process tests execute child overlap, timeout, memory stop and independent
row failure continuation. BLD must run its own supplied probe after pulling.

One bounded shared-context Codex/GPT-6 review found missing summary CFL enforcement and weak
validation when terminal results were absent. Both were corrected and pinned by real-artifact
mutation tests before the full check. The review did not execute a complete campaign or qualify BLD.

Retention: project-owned operational records fit Git and are copied byte-for-byte into
`evidence/hil-bld-first-batch-2026-10-07/`, with every file pinned in `evidence/MANIFEST.json`.
The task's original `out/first-batch-verification/` is copied and byte-verified in primary staging
`out/hil-bld-first-batch-verification-2026-10-07/`; the tracked `custody.json` records the inventory
before non-force worktree reconciliation. Dependencies and Vitest cache are reproducible scratch.
No NAS payload or pre-existing output is pruned; the full scientific queues have not launched.

Closeout checks: `npx.cmd vitest run runner/test/evidence-integrity.test.ts runner/test/progress-index.test.ts`
passed 2 files / 18 tests, and `npm.cmd run lint:rule7` passed. Whitespace checking preserves the
two exact raw full-check logs, whose terminal blank lines are intentional recorded bytes:
`git -c core.whitespace=cr-at-eol diff --cached --check -- . ':(exclude)evidence/hil-bld-first-batch-2026-10-07/full-check.stdout.log' ':(exclude)evidence/hil-bld-first-batch-2026-10-07/full-check.stderr.log'`.
The unexcluded first attempt reported only those raw-log EOF blank lines; no artifact was normalized.

Publication closeout: main includes `3948c8f`, `ad990ac`, `60b55e9` and `f4ca38a`. The original implementation worktree/ref were reconciled and removed without force after byte-verified custody. The earlier authentication wait is resolved: `git ls-remote origin refs/heads/main` now returns `f4ca38a44fefda0de514491bd5ce3044479829ec`. Current host execution is recorded above; source tests are complete and are not repeated for dispatch.


## Imported BLD producer records

The following completed-execution and preservation records are imported from `b333782`, whose
producer is `d7ff3e1`. Embedded source-specific commands describe BLD history. HIL keeps its own
runner and decision 0060; BLD used a separately numbered branch-local decision. Do not use HIL
code to resume BLD checkpoints or treat these records as a code/charter merge.

## BLD execution complete — 2026-10-08

Producer d7ff3e1fb122ecbf8994539d3623928cbe5a9c6b ran on BLD with Node v24.13.1. The qualified and actual maximum concurrency was 16. Campaign maxWallSeconds is null; the original four-hour experiment deadline did not apply. The launch wrapper started 2026-10-08T14:11:54.1674111Z and ended 2026-10-08T21:04:12.1478650Z with exit 0. Source records are task out/batch1-bld-resumable/campaign.json, attempt-0001-complete.json and out/batch1-bld-resumable-control/launch-direct-20261008-071154.exit.json.

Executed `node runner/src/hil-bld-batch-main.ts summarize out/batch1-bld-resumable` at the same source checkpoint. The existing checker re-read consecutive update evidence, numerical tolerances/ledger/CFL/symmetry fields, terminal agreement and exit status: 42/42 rows are size-endpoint with 0 errors. Task out/batch1-bld-resumable/summary.json and out/batch1-bld-resumable-control/summary-20261008-160529.exit.json retain the output and exit-zero receipt. All workers are terminal; no row awaits resume. This is operational coverage, not track morphology interpretation or physical validation.

The original automatic wrapper stopped after qualification because its long-running process ExitCode was null. It did not dispatch a campaign. Preserve that receipt; the local out/batch1-bld-resumable-control/run-direct.ps1 uses direct native invocation and LASTEXITCODE, checked with exit 7, and launched the same qualified source. Its launch-controller-20261008-071153.start.json records the recovery. The old run-stages.ps1 auto path is historical, not the next launch instruction. The probe selected 16 because 28 hit its 180-second operational cutoff with ample memory; that does not establish optimal throughput.

Next deliverable: compare the registered cold facet arms and warm histories using their saved snapshots/events and physical-time brackets, then reconcile with HIL results. Preserve the campaign, probe, checkpoints and control logs as active analysis staging; classify/promote retained evidence under Rule 15 before scientific closeout. No NAS publication, cleanup or new run was performed for this status update.
A bounded Codex/GPT-6 shared-context read-only completion review independently checked every registered row result, event sequence, status, exit and checkpoint metadata, finding no completion mismatch. It did not rerun the numerical simulation or interpret morphology.

### Tried and rejected at closeout

- Unconditional symlink fixture construction failed on BLD before its guard assertion. Split mixed controls and skip only known Windows capability failures; retain production checks and the unrelated root/header controls.
- The legacy four-hour campaign remains an interrupted historical prefix. Its output is preserved, but it cannot be retroactively resumed. New rows use separate checkpoint state/output.

Metadata closeout: evidence-integrity/progress-index, Rule 7 and the staged whitespace check passed after evidence promotion. The whitespace check preserves the four exact raw full-check logs and the retained portability patch by excluding only those five artifact paths; no recorded bytes were normalized. Numerical and runner source remains the tested implementation.

## BLD result preservation — 2026-10-08

Maker direction: save, commit and upload the completed results to NAS. Deliver an immutable, verified and freshly restorable BLD collection plus self-contained tracked claim evidence. Solo scientific research; hostile actors excluded. No new simulation, scientific interpretation, local deletion, branch integration or public serving.

Scope: exactly out/batch1-bld-resumable, out/batch1-bld-resumable-probe and out/batch1-bld-resumable-control. Inventory and preserve all regular files. Project-owned claim bytes that fit compressed Git, including events, snapshots and provenance, remain permanent evidence under evidence/bld-first-batch-2026-10-08/. Checkpoint samples compress enough to try complete archives of all three roots, retaining restart bytes too. The complete raw copy is generated-cache collection bld-first-batch-output@2026-10-08, immutable, project-owned/redistribution allowed, public metadata, serve denied, maker-approved deletion only. The NAS copy is operational recovery context and does not externalize tracked evidence. Node v24.13.1, producer d7ff3e1 and retained specs/commands are the regeneration recipe; historical clocks/PIDs are provenance. Keep workstation originals; no off-site or prune claim.

Steps, committed before publication: register provisional intent; inventory stable trees and stage a complete local copy; pack Git evidence with Python tarfile and verify exact decompressed member paths/lengths/hashes; call unchanged publishCollectionFixture via out/nas-save-bld-2026-10-08/run.mjs publish; bind the standard owner manifest and publication receipt; call restoreCollectionFixture into fresh out/restores/bld-first-batch-output-2026-10-08; run the independent collection verifiers and existing scientific summary on the restored campaign; commit catalogue, evidence pins, receipts and recovery instructions. NAS payload keeps the three directory names directly beneath payload/. Resolve the marked share with detectNasMount; immutable final target must be absent. Catalogue writes acquire an exclusive sibling lock, re-read/parse, update this one entry and use existing writeJsonAtomic. No shared library changes.

Commands: npm.cmd run assets:verify -- --collection bld-first-batch-output@2026-10-08 --full; npm.cmd run assets:verify-restored -- --collection bld-first-batch-output@2026-10-08 --from out/restores/bld-first-batch-output-2026-10-08. Recover later with the catalogue assets:restore command into a fresh target. After byte verification run node runner/src/hil-bld-batch-main.ts summarize out/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable; compare scientific fields excluding location/generation time and preserve the original summary before regeneration. Save check logs outside the restored payload. Metadata checks: existing catalogue/evidence-integrity/progress-index suites, Rule 7 and whitespace. This invokes unchanged transport/verifier machinery like the October 1 backup precedent, so actual copy/restore plus metadata checks suffice; no redundant scientific full-suite rerun.

Known failures / Rule 14A: lessons A1/A2 require real preserved bytes and -text for digest-bound Git files. Partial copy or wrong selection can lose results; existing stable inventory, no-replace transaction and exact-set restore cover that boundary. Previous Windows tar skipped inputs as self-archives; use Python tarfile and exact decompressed hashes. Lost catalogue updates are accidental in-scope; the bounded lock/re-read/atomic-write seam suffices. Windows SMB durability remains reopen/hash verified, not hardware crash certified. No new generic publisher, registry or validator.

Done when Git claim inputs are preserved and pinned; source, final NAS and fresh restore sets/hashes agree; restored coverage is still 42 size endpoints; and owner manifest, catalogue, publication/restore receipts and recovery procedure are committed. All originals remain.

### Completed preservation

Git raw evidence is committed at 7e2383a. The [archive verification](../../evidence/bld-first-batch-2026-10-08/archive-verification.json) preserves all 2061 original files / 1050129781 bytes in three archives totaling 66684281 bytes; all decompressed member hashes match. This includes every checkpoint, event, spatial snapshot and operational record in the declared roots.

NAS publication and fresh restore passed with identical tree SHA-256 2c77efcd57f7586c68af44a1da257385f97333aec6487cbdf8c6aeb17e8585b0. The [owner manifest](../nas-assets/manifests/bld-first-batch-output/2026-10-08.json) and [verification record](../nas-assets/manifests/bld-first-batch-output/2026-10-08-verification.json) bind the canonical publication and restore receipts. Both independent assets commands above exited zero. A read-only invocation, node out/nas-save-bld-2026-10-08/verify-science.mjs, reused summarizeFirstBatchRow on the restored rows: all 42 size endpoints and every scientific summary field match, excluding only the directory location. It leaves restored summary.json byte-unchanged; no CLI rewrite was needed.

Final share-relative locator: collections/bld-first-batch-output/2026-10-08/payload/. BLD resolved the marked share as S:/; the catalogue uses no drive-letter locator. Original campaign/probe/control files and all local staging remain. Restore commands are in the catalogue and [evidence README](../../evidence/bld-first-batch-2026-10-08/README.md#recovery). Numerical and storage implementations are unchanged; the existing static catalogue census expectation adds only this measured collection. Track interpretation is still pending.

One bounded Codex/GPT-6 shared-context preservation review found no blocking omission or restore-path mismatch; [review scope](../../evidence/bld-first-batch-2026-10-08/preservation-review.json) states what was independently inspected and excludes large-payload rehash, test reruns and scientific interpretation. Final payload and fresh-restore verifications were executed separately by the operator.
Final metadata verification: the existing catalogue, evidence-integrity and progress-index suites passed 3 files / 27 tests (metadata-final.stdout.log and metadata-final.exit.json in the evidence bundle). Rule 7 and scoped whitespace checks passed; raw log bytes were retained unchanged. No new full-suite or scientific gate claim is made.

### Tried and rejected for preservation

- Summary-only Git retention would omit practical claim-bearing events/snapshots; preserve the raw bytes.
- An unregistered raw NAS copy or hash-only record cannot establish preservation; reuse the existing transaction and restore seams.
- The first metadata check retained a static census for 35 collections and rejected the new entry. Add its exact measured active counts; retain the strict census and all integrity assertions. The original failed logs remain in the evidence bundle.
