# Plan — HIL October 11 queued exploration

- **Phase:** active Phase 10 model development, charter sections 2.5 and 3.2; accepted ADRs 0011, 0055, 0060 and 0062.
- **Status:** running on HIL; 102 registered cases, twelve queue workers alongside four warm workers.
- **Started / last touched:** 2026-10-11 by Codex/GPT-6.
- **Branch / checkout:** `codex/hil-large-batch-oct11`, `C:/Users/biao3/.codex/worktrees/hil-large-batch-oct11/snowflake`, from `74ad14a`.
- **Authority:** maker requests a large batch alongside the four remaining warm runs, with roughly another day of useful work. Run on HIL; no production wall deadline.

## Goal and done when

Solo scientific research; hostile actors excluded. Launch a finite 102-case queue with twelve
workers beside the four existing warm workers. Use the completed comparisons to explore cold
temperature/forcing structure, seed dependence and environment history, while testing timestep
sensitivity at the cold anchor. The deliverable is the running queue with committed operands,
separate logs, completed-cycle recovery and unchanged warm execution.

Launch is done when the focused roster/orchestration checks and both typechecks pass, one bounded
non-author review has no unresolved claim-changing issue, the twelve initial workers have real
completed-cycle checkpoints, remaining rows are queued, and the four warm workers still advance.
Scientific completion later requires all 102 terminal dispositions and the matched readouts below.
This launch does not complete the charter milestone. Its Phase 10 criterion remains verbatim:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

## Registered rows

All new row IDs start `oct11-hil-`. The finite roster is the complete Cartesian product **within
each table row**, not across blocks. Arm order is `both`, `neither`, `basal-only`, `prism-only`;
ordinary preparation order is M1, M1_NO_DIP_ABLATION (ID suffixes `m1`, `nodip`). Decimal operands
use `p` in IDs. Temperatures are negative Celsius; IDs omit the minus sign after `t`.

| Block / ID form after prefix | Operands | Rows |
|---|---|---:|
| `cold-t{T}-f{F}-{arm}` | T = 11, 13, 16, 20; F = 0.1, 0.15, 0.2; all four facet arms | 48 |
| `seed-t{T}-f0p15-r{R}-h{H}-{arm}` | T = 6.5, 9.5; seed radius/thickness R/H = 3/1, 1/5; all four facet arms | 16 |
| `history-t{from}-to-t{to}-f{F}-e{E}-{prep}` | directions 6 to 14.4 and 14.4 to 6; F = 0.1, 0.2; switch E = 7, 11, 15; both ordinary preparations | 24 |
| `static-t{T}-f{F}-{prep}` | T = 6 at F = 0.1, 0.2; T = 14.4 at F = 0.2; both ordinary preparations | 6 |
| `cold-step-t14p4-f0p1-cfl{C}-{arm}` | C = 0.025, 0.0125; all four facet arms | 8 |

Shared: N64, dx 0.35 um, target maximum extent 29 (9.8 um maximum center span), 20000 maximum
completed updates, pressure 101325 Pa, seed radius/thickness 2/1 except the seed block, fill CFL
0.05 except the timestep block. Existing v6 / monopole-matched / hexPrism, counter PRNG seed one,
zero noise, residual/divergence tolerances 1e-9/1e-7 and 200000 maximum relaxation sweeps remain.
Supersaturation is `phase6SigmaWaterFromTable(tempC) * fraction`; no fit or interpolation changes.
Each history has exactly one existing extent-triggered temperature event, keeping the same water
fraction at its new temperature. Histories/statics use ordinary preparations. Facet rows retain
M1 metadata and their explicit `experimentalFacetDips` identity; no experimental facet/history mix.
All rows record dense odd spatial crossings 5/7/9/11/13/15/17/19/21/23/25/27 using the existing
writer. Existing per-update scientific event records remain unchanged.

Queue order interleaves complete matched groups from the five blocks, then continues the remaining
groups; preserve the order within each matched quartet/pair. This exposes several questions
early without changing any row's physics. Twelve slots refill automatically as rows finish.
Size, step-cap, contact, stalled growth, convergence and resource dispositions retain their distinct
meanings. Only independently checked size endpoints complete the scientific targets. Other stops
are unresolved dispositions, not evidence that an effect is absent.

## Selection evidence and registered readout

Bounded internal saved-data triage is primary
`out/hil-large-batch-design-2026-10-11/recommendation.json`, SHA-256
`774bb85dee0ddca7e100878e90eee0e9d72bf9ff923e1b6af6c81d3e9308aa7a`.
Its linked history and cold calculations reuse the existing saved-data follow-up definitions;
the `parentConsolidatedRoster` selects this 102-row design over its earlier 72-row alternative.
This is selection evidence with scoped limitations, not a completed public scientific conclusion.
The unchanged concise record is retained at
`evidence/hil-large-batch-2026-10-11/selection-triage.json`; underlying saved-data reports stay in
the named primary staging directory, with hashes bound by that record.

Cold: the October 10 quartet at -14.4 C / fraction 0.10 captures prism-bearing states missed by
the earlier schedule. At tip eight and half the shortest common plateau duration, central-plane
core/tip gaps are 0/0/2/2 lattice-radius cells for neither/basal-only/prism-only/both. New temperatures
bracket or extend prior -12/-14.4/-18 anchors; each condition has its own complete quartet.
Compare integer core/tip radii and ring occupancy at multiple common tip stages, separately common
absolute ages and physical plateau-age brackets. Fields retain their own geometry and time; an
extent-matched snapshot is not automatically a time- or geometry-matched comparison. The three
timesteps 0.05/0.025/0.0125 qualify this discrete anchor observation only, not the full grid.
Reuse the completed `oct10-hil-cold-t14p4-f0p1-{arm}` quartet for the 0.05 comparison after source
parity verification. No claim of grid, domain or far-field independence follows.

Seed: at -6.5/-9.5 C and fraction 0.15, compare the two seeds within preparation and the four facet
arms within seed, using actual axial/lateral additions and occupied-cell counts at overlapping
physical ages as well as size stages. Seeds are only near-volume matched and differ in surface
and diffusion environment. These are seed-dependent implementation responses, not isolated
shape mechanisms. New complete quartets avoid the incompatible historical-control problem behind
the previous seed deferral; no recovery of old seed controls is needed to interpret within-block
contrasts. Do not label endpoint aspect-ratio changes a physical material transition.

History: completed longer warming rows retain different new axial growth for the two preparations;
cooling is stage-sensitive, including adjacent-event uncertainty in later increments. Test forcing
fractions 0.10/0.20 with switch extents 7/11/15. Use actual event boundaries, exclude the triggering
cycle from post-event increments, and compare axial/lateral/occupied-cell additions at common
elapsed physical times after events with early/later halves and adjacent-event brackets. Use
the existing [follow-up definitions](../../evidence/hil-bld-joint-review-2026-10-08/followup/README.md).
Do not compare static contrasts over different durations as though they share one time window.

The six new statics cover all other history source conditions. At -14.4 C / fraction 0.10, reuse
the October 10 `both` and `neither` static rows as explicitly experimental readout controls. Their
preparation functions directly return ordinary M1/no-dip kinetics (`solver-cpu/src/lk-facet-dips.ts`);
existing nontrivial `lk-facet-dips.test.ts` covers evolution equivalence at its named temperatures.
Before reuse, confirm source parity and compare each new ordinary history's scientific event
prefix through its switch against the corresponding retained static, excluding only identity/RSS.
Refuse a mismatched prefix. Preserve original labels and checkpoint identities; these controls
are never ordinary resume inputs. Inherited geometry, vapor and fill prevent interpreting these
software interventions as physical causality.

Two new static identities deliberately repeat September numerical settings:
`followup-mixed-timestep-t6-f0p1-{m1,nodip}` already registered N64 / target 29 / CFL 0.05.
Their September producer/record compatibility has not been established here. The new pair supplies
same-producer history-prefix controls with this batch's dense observation schedule. These are
controls, not novel numerical conditions; do not describe the whole 102-row roster as new settings.

## Execution and smallest implementation

Add only the finite `hil-large-batch-oct11-roster.ts`, thin `hil-large-batch-oct11-main.ts` and
focused test. Reuse `runHilOperationalBatch` unchanged with a new campaign binding, concurrency 12
and its existing queue, leases, resource guards, checked pending-row selection and resume routing.
Do not change solvers, coefficients, observations, readouts, codecs, scientific worker or scheduler.

Rule 14A: accidental wrong roster/source resume and simultaneous writers affect scientific state;
existing row/batch identity, lease and exact source/runtime/host checks already cover that boundary.
The thin entry and focused binding check suffice; no new launcher framework or assurance layer.
Relevant lessons C2/C3/C6 (diagnostics, matched comparisons, computable readouts), E5 (implementation
effects versus physical cause), and F2 (deliver before expanding process) apply before launch and
readout. These checks do not replace interpretation judgment.

Existing HIL ceiling is sixteen workers: twelve new plus four warm. At 07:37 PDT on October 11,
the existing warm monitor recorded 48795668480 available RAM bytes and 56644243456 commit-headroom
bytes; all four worker CPU clocks advanced over five seconds. The previous ten-row N64 target-29 batch took
0.765–2.953 hours per row (mean 2.061, summed 20.615 worker-hours), under ten new plus four warm
workers. Applied illustratively to 102 rows / 12 slots, that mean gives about 17.5 hours before
uneven tails, additional contention and the slower timestep cases. New conditions are unmeasured;
this is a roughly-day queue, not a transferable timing qualification or completion promise.
Exact per-row timing sources, current resource sample and 3830794481664 free C-drive bytes are
retained in `evidence/hil-large-batch-2026-10-11/operational-basis.json`.
Use existing host-global 12 GiB available RAM / 8 GiB commit guards, inspect live headroom at launch,
and do not repeat a capacity ladder. No wall deadline or scientific truncation to fit a day.

Initial state and every completed update are checkpointed with two generations. The unchanged
ADR 0060 real N64 pause/resume witness applies; repeat only if that state contract changes.
Resume skips checked completed rows, resumes interrupted ones and starts unstarted ones. Keep
this checkout fixed after launch; live updates belong in primary. Warm producer `838c294`,
supplement `7ea2582` and October 10 producer `33832e2` stay fixed and open with their useful outputs.

Exact commands from this new fixed checkout:

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-large-batch-oct11-main.ts launch HIL out/hil-large-batch-oct11
node runner/src/hil-large-batch-oct11-main.ts resume HIL out/hil-large-batch-oct11
node runner/src/hil-large-batch-oct11-main.ts summarize out/hil-large-batch-oct11
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-large-batch-oct11-control/stop-hil.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-large-batch-oct11-control/start-hil.ps1 -Mode resume
```

Copy the existing exact-path hidden start/stop helpers with the new paths; keep process-only
ExecutionPolicy Bypass and Windows PSModulePath fix. Capture unique stdout/stderr, invocation,
dispatcher/coordinator PIDs and real exit receipts. Stop only this exact entry/campaign, preserving
checkpoints and the unrelated warm workers. Initial attempt row logs are
`out/hil-large-batch-oct11/rows/<id>/attempts/initial/{stdout,stderr}.log`; checkpoints are in `resume/`.

## Verification, source currency and retention

Rule 6 scope: isolated finite row registration and thin batch orchestration, without executable
scientific calculation, observation, claim logic, codecs or root test changes. Run the new roster/
CLI/binding test, existing October 10/supplement and queue/resume tests, both typechecks, Rule 7
and applicable metadata/diff checks. One bounded non-author shared-context review after code is
stable. No full numerical suite, phase gate or repeated real pause proof for this unchanged seam.
If implementation changes a scientific surface, stop and apply the required broader tier.

Source currency checked 2026-10-11 before freeze: official histories for
[TAX2](https://arxiv.org/abs/2306.13087), [CM9](https://arxiv.org/abs/2011.02353),
[CM4](https://arxiv.org/abs/1512.03389) and the
[author list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm) show no superseding growth source
in this bounded check. No adopted fit changes. Existing interpolation supports the half-degree
seed anchors. The design audit checked named historical rosters, not every retained artifact.

Git retains the plan, source and concise operational/check records. Bulk checkpoints, snapshots,
event streams and full outputs remain local during execution, then follow Rule 15 / ADRs 0051 and
0061 for NAS publication and fresh recovery before any output-owning checkout closes. No cleanup
or source pruning is part of this launch; NAS presence alone never authorizes deletion.

## Implementation checks — 2026-10-11

Protocol `07c202f` preceded implementation. Only the new roster, thin entry and focused test were
added; shared scientific worker, state codec, observations, queue and numerical modules are
unchanged. `npx.cmd vitest run runner/test/hil-large-batch-oct11.test.ts runner/test/hil-exploration-oct10.test.ts runner/test/hil-supplement.test.ts runner/test/hil-bld-batch-execution.test.ts runner/test/hil-bld-batch-resume.test.ts`
passed five files / 29 tests, exit zero (10.41 s). `npm.cmd run typecheck` passed both TypeScript
checks, exit zero. Exact command/exit/log receipts are retained under
`evidence/hil-large-batch-2026-10-11/` with prefixes
`focused-implementation-20261011T143808465` and `typecheck-implementation-20261011T143808580`.
No full-suite or scientific-gate claim is made.

One non-author Codex/GPT-6 review with shared context independently rederived all 102 row objects,
checked twelve-worker binding/refusal, confirmed unchanged scientific/state source against
`33832e2` and the protocol base, and parsed both PowerShell helpers without syntax errors. No
unresolved implementation blocker remains. The resolved repeated-static qualification is above.
`evidence/hil-large-batch-2026-10-11/bounded-review.json` records scope and limits: no simulations,
production start/stop execution or repeat of the author's tests; future scientific prefix checks
are still required during readout. Helper copies are retained beside that receipt and staged in
`out/hil-large-batch-oct11-control/` for exact-source operational recovery.

Prelaunch metadata checks passed `runner/test/evidence-integrity.test.ts` and
`runner/test/progress-index.test.ts` (two files / 18 tests, exit zero); Rule 7 passed. Exact receipts
remain in task `out/hil-large-batch-oct11-control/metadata-prelaunch{.log,-result.json}` and
`rule7-final{.log,-result.json}`. Scoped staged whitespace check passed with CR-at-EOL recognized,
excluding only the two byte-preserved implementation stdout logs from whitespace lint.

## Launched — 2026-10-11

Producer `5a00e901874ae5fdf2ae24a2d889b692734e75da` is committed and pushed on main. Keep
`codex/hil-large-batch-oct11` and its execution checkout fixed there; these live-state notes are
written in primary. Hidden dispatcher PID 27236 started at `2026-10-11T14:44:39.0064639Z`
(07:44 PDT); coordinator PID 24868 registered all 102 rows and launched twelve workers.
The other ninety rows remain queued and will automatically fill free slots.

Exact wrapper invocation is `powershell.exe -NoProfile -ExecutionPolicy Bypass -File
C:/Users/biao3/.codex/worktrees/hil-large-batch-oct11/snowflake/out/hil-large-batch-oct11-control/start-hil.ps1
-Mode launch`, through hidden Start-Process. The wrapper's exact Node command and source are in
task `out/hil-large-batch-oct11-control/campaign-launch-20261011T074439005-invocation.json`;
coordinator logs are the same prefix with `.stdout.log` and `.stderr.log`, with `-exit.json` on
real completion. The campaign binding and queue invocation are in `out/hil-large-batch-oct11/`.
Separate worker logs and checkpoint locations are given above; resource observations are
`out/hil-large-batch-oct11/hil-large-batch-oct11-HIL-initial-resources.jsonl`.

Startup observation `2026-10-11T14:46:23.6437297Z` is retained in
`evidence/hil-large-batch-2026-10-11/launch-verification.json`: twelve live new workers, each with
completed-cycle checkpoint 20 and previous generation 19, matching current manifest/solver digests
and solver sizes. All twelve report converged completed relaxations and zero integrity errors;
row/coordinator stderr files are empty, with no row exit or terminal result. All sixteen new/warm
worker CPU clocks advanced over the five-second observation. Available physical memory was
47338164224 bytes and commit headroom 55066988544 bytes. This is operational startup evidence,
not completed scientific results, a runtime forecast or a new semantic checkpoint/resume proof.

The four original warm PIDs remain 7944 / 22716 / 27104 / 25200. In that order their extents are
35 / 31 / 33 / 33 and completed updates 765 / 595 / 678 / 600, all targeting 57. Their checkpoint
metadata and current stderr remain clean. No original worker was paused, restarted or moved.
Next: observe actual terminal dispositions, then run the registered matched analyses. Bulk outputs
are local active staging; keep all four output-owning checkouts until governed NAS publication and
fresh recovery cover their useful bytes. Use the exact same-source recovery commands above if
interrupted; keep the recorded source/runtime/host and roster binding.

After adding startup evidence in primary, evidence-integrity and progress-index checks passed
again (two files / 18 tests, exit zero), and Rule 7 passed. Exact commands and real exits remain
in primary `out/hil-large-batch-design-2026-10-11/postlaunch-{metadata,rule7}{.log,-result.json}`.
No production source was changed by these live-state records.

## Steps

- [x] Select finite matched blocks and commit protocol before implementation.
- [x] Add roster/thin entry; focused checks, both typechecks and bounded review.
- [x] Publish fixed producer, launch twelve workers, verify checkpoints and warm progress.
- [ ] Reconcile terminal dispositions, perform registered readouts and preserve useful outputs.

## Tried and rejected

- More pressure cases just to fill slots: the completed supplement already provides the pending
  timestep analysis; no new pressure question justifies another grid yet.
- Repeating old seed controls with differing CFL: use new internally matched quartets at new
  temperatures instead. This explicitly resolves the prior October 10 seed-control deferral.
- Repeating the -14.4 / fraction 0.10 static M1/no-dip pair: retain compatible experimental both/
  neither outputs and require scientific prefix agreement during readout; never relabel state.
- Treating every fresh identity as a new condition: bounded review identified the September
  -6 / fraction 0.10 ordinary static pair. Retain the registered repeat as current-producer dense
  controls, with the compatibility limitation stated above; do not count it as exploration breadth.
- Giant Cartesian product across every axis: separate five question-driven blocks. The seed
  forcing axis is deferred; first establish whether the new flank contrasts justify expanding it.
- Arbitrary day cutoff, another speed ladder or new scheduler: existing finite targets, queue,
  checkpointing and live resource guards meet the maker's request with less delay.

## Open questions

No maker decision blocks launch. New regimes may finish earlier or later than a day. Numerical
representation/domain dependence and the scientific readouts remain unresolved after mere execution.
