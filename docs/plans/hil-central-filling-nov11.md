# Plan — HIL central-filling and growth-memory wave

- **Phase:** active Phase 10, charter sections 2.5/3.2; accepted ADRs 0058–0060/0062.
- **Status:** PAUSED by maker request for gaming, November11 at17:52Pacific. No active workers; keep producer aa20f96 fixed and wait for explicit resume direction.
- **Started / last touched:** 2026-11-11 by Codex.
- **Authority:** maker requests the next wave entirely on HIL, using its 20-worker allocation,
  with a finite queue as large as scientifically useful. Existing resumability/no wall-limit direction remains.
- **Checkout:** reuse `codex/hil-oct31-resume-record` at
  `C:/Users/biao3/.codex/worktrees/hil-oct31-resume-record/snowflake`; keep its final execution producer fixed.

## Goal

Test whether ending width-selected enhancement before central filling changes subsequent open
growth, and whether that contrast survives timestep and representation changes. The
[recovered states](../../evidence/warm-switch-analysis-2026-11-11/README.md) locate fourteen
coarse central sites that fill in width4 around 2.3–2.5 simulated seconds but remain open in
width3. This is a within-model mechanism question, not an identification of physical causality.
Solo scientific research; hostile actors excluded. One deliverable now: a tested 40-row queue
running on HIL with permanent mechanism observations and complete-cycle restart.

## Done when

The broader charter endpoint remains verbatim, and this wave alone does not satisfy it:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

Launch slice: all 40 operands and observation settings are committed; capture/restart witnesses
and required checks pass; 20 actual workers are observed with checkpoints and a recorded resume
command. Scientific completion later requires checked terminal dispositions for all dispatched
rows, matched readouts, honest missing coverage, and NAS publication/fresh recovery. No deadline
or automatic extra wave replaces the finite scientific targets.

## Approach and exact roster

Reuse the existing early-only local-width experiment, original solver and discovery queue.
No state transplant, new attachment law, checkpoint format or scheduler. All new rows use M1
base with explicit width/history options, no-dip prism kinetics, noise0/seed1, hexPrism,
aggregate-hv-g1h1-v6, monopole-matched far field, pressure101325Pa, fraction.075 and exact
`phase6SigmaWaterFromTable(tempC) * .075`. Residual1e-9/divergence1e-7, max200000 relaxation
sweeps and max100000 complete updates remain unchanged. Contact, nonconvergence and step cap
are unresolved/failure classifications, not negative scientific results.

| Block | Exact operands | New rows | Target |
|---|---|---:|---|
| A duration | T{-4.5,-5} × width{3,4} × early cutoff{2,2.25,2.5,2.75,3,4}s; N64/.35um, seed2/1, CFL.025 | 24 | extent29 =9.8um center span |
| B timestep | same T/width × cutoff{2.25,2.5,2.75}s; N64/.35um, seed2/1, CFL.0125 | 12 | extent29 =9.8um center span |
| C representation | T-4.5 × width{6,8} × seed thickness{1,3}; radius4, N126/.175um, cutoff5s, CFL.025 | 4 | extent57 =9.8um center span |

IDs are `cf11-hil-{a|b}-t{4p5|5}-w{3|4}-s{2|2p25|2p5|2p75|3|4}` and
`cf11-hil-c-h{1|3}-w{6|8}-s5`. Only block A includes2/3/4; B uses its three printed cutoffs.
Fine widths double the inclusive chord threshold; that does not match seed volume or prove a
physical width law. Fine seed thicknesses bracket the coarse thickness without bounding nonlinear
outcomes. N126/.175 and N64/.35 share the shell half-length10.85um; this is not domain independence.

Queue: all four C rows first, then A with cutoff order{2.25,2.5,2.75,3,2,4}, temperatures in
printed order and widths3/4 together, then B with cutoff order{2.25,2.5,2.75}, temperatures and
widths in printed order. Thus initial20 are four C plus sixteen A; twenty rows wait and refill
automatically. All work belongs to HIL; nothing is dispatched to BLD. Older22 reserves remain
unselected; this separately registered wave replaces no historical rows.

## Predictions and comparisons

Primary prediction: some width4 preparation cutoffs before central filling will leave an opening
that advances after enhancement ends, whereas later cutoffs allow the center to fill. This may
fail: early termination can also prevent rim establishment, and nonmonotone responses are allowed.
Width3 is the matched selection control. A width4 opening would strengthen the timing account;
its absence despite an unfilled center would show central occupancy alone is insufficient.
This still does not isolate geometry from partial fill/vapor/lag, which evolve together.

Use existing event reconstruction and cavity/core/waist definitions. For each temperature A's
12-member cohort, compute the minimum terminal age across every member, sample at quarters
of that common age, and preserve at-or-before plus adjacent-event alternatives. Also compare
each cutoff's width3/4 pair on its own labeled shared window, post-switch added axial/lateral
span, opening depth, waist, and occupancy count (not mass). Compare exact9.8um center span
when attained, otherwise actual bracketing/overshoot. Never silently exclude an invalid member.

B: per temperature/width six-member cohort of the three matching cutoffs at both CFLs; report
the three pairwise comparisons separately. Prediction is qualitative agreement of establishment
versus suppression; displacement by one update is measured with actual switch brackets, not
called an exact-time boundary. Disagreement directs the next numerical investigation.

C: six early5 operands at-4.5: old coarse widths3/4 plus new fine thin/thick widths6/8.
Use common physical age and size, and local fill in physical coordinates. Prediction is the
same direction of central-filling/opening contrast; failure narrows it to representation/seed.
Existing broad/full/early1/early5 observations are contextual controls, not new runs. Bind reused
coarse operands `gd21-bld-w1-t4p5-c025-early5-w3` and `gd21-bld-w2-t4p5-w4-early5` through the
hash-pinned prior analysis/recovery records. Fine broad controls are the completed W4 rows in
the [HIL report](../../evidence/hil-results-review-2026-11-11/README.md), with a separately
reported shared-age baseline cohort. No original BLD checkpoint is resumed on HIL.

## Required retained observations and their producers

Existing events retain every completed update; existing accepted-boundary extent maps remain
at coarse{5,9,13,17,21,25}, fine{9,17,25,33,41,49}. New optional observation settings are bound
in spec.json and checked on resume. Their absence leaves all historical artifact shapes intact.

At the synchronous checkpoint publication boundary, copy exact existing solver/manifest bytes
outside rotating current/previous storage, deduplicating by generation. Manifest already carries
runner state and source/runtime/event/snapshot bindings. Keep complete states bracketing:

- Named ages{1,2,2.25,2.5,2.75,3,4,5,10}s, using adjacent completed updates and actual times.
- The first inactive update: C is the cutoff-crossing completed active cycle; C+1 is the
  first complete inactive cycle. Preserve both. Initialization and terminal state are retained too.
- Every attachment batch intersecting the initially empty central patches: coarse hex radius<=1
  on z offsets+/-1; fine radius<=2 on z offsets+/-(floor(seedThickness/2)+1), relative to seed
  center. These contain14/38sites respectively, so only a finite number of attachment batches
  can trigger. These are observation regions, never modified state or decision inputs to growth.

Also preserve the last-active and first-inactive converged spatial boundary maps before fill,
including solved boundary supersaturation, attachment coefficient, local fill and width. This
avoids confusing completed-cycle lattice supersaturation with newly solved boundary values.
Retain the initial full state and terminal full state. Missing transitions/ages due to earlier
termination are explicitly unavailable; no fabricated snapshot or changed stop target.

Copy synchronously before another update can rotate the required generation away. On resume,
reconcile pending copies from current/previous committed state before advancing, covering a crash
between checkpoint commit and capture completion. Reuse existing byte hashes/codecs; no new
scientific restart format. Captures are observation copies, not an authorized state-transplant API.
The observation reader decodes retained states, verifies recorded bindings, and reports actual
ticks/times/arrays plus central occupancy/fill; accepted boundary maps keep their own timing.

## Checks, known failures and execution

Lessons A1/B1/B2 require actually produced observation bytes, not promises in a plan. E5 and C3
require scoped matched interpretation. Under Rule14A the plausible failure is accidental rolling
checkpoint rotation or interruption losing mechanism state; endpoint checks cannot detect missing
past observations. Bounded synchronous copies and one recovery differential cost less than reruns.
No hostile-owner defense, new registry, dashboard or review-of-review is added.

Shortest meaningful witness: a short real early-only row crosses a cutoff, retains both complete
states and accepted boundary maps, resumes beyond rotation, and compares science with its
uninterrupted counterpart. Include interrupted copy/reconciliation and changed-observation-spec
refusal at that nearest boundary. Existing numerical pause/resume witnesses remain applicable to
unchanged solver/codec; exercise the new retention behavior. Test exact40-row roster, queue order,
HIL-only routing, no production wall budget and readout on the witness. Run exact `npm test`
once at stable executable/evidence code; focused checks guide implementation. One bounded
shared-context review after stabilization checks claim-changing mistakes and omitted capture.

Use existing20-worker allocation and memory guards (12GiB available RAM,8GiB commit headroom).
Direct host observation on November11 found no science workers and roughly49GiB free physical
RAM; retain exact prelaunch receipt. No new capacity ladder. Keep at least100GiB local free disk;
observed C free space exceeded3TB. Fine predecessors took6–10active days and later .025 rows
ran longer: new fine rows may take days or weeks, with no promised completion date. Coarse cost
is also not guaranteed by old measurements. Resource stops preserve checkpoints; slow growth
alone never terminates a row. No maxWallSeconds or queue hardWallSeconds.

Intended entry `runner/src/hil-central-filling-nov11-main.ts` and wrapper
`scripts/start-hil-central-filling-nov11.ps1` reuse the existing operational coordinator.
Launch/resume: wrapper `-Mode launch|resume -Workers 20`, output
`out/hil-central-filling-nov11`, labeled controls `out/hil-central-filling-nov11-controls`.
These become executable only after implementation/checks and producer commit below. Every update
checkpoints; interruption during relaxation repeats only the unfinished cycle. Record exact launch,
actual processes and source/runtime, then leave the execution checkout fixed for resume.

## Preservation and source currency

Bulk captures/events/checkpoints stay in local out during execution, then governed external-evidence
NAS collection `hil-central-filling@2026-11-11` after completion, with immutable inventory,
copy-first publication and fresh restore under ADR0051/0061. Register the owner before durable
placement. Git holds code, concise results, manifests and receipts. Keep all original outputs;
the separate completed October21 HIL preservation remains outstanding and its checkout stays open.

November11 bounded source-currency check reopened [M1 v2](https://arxiv.org/abs/1910.09067),
[TAX2 v1](https://arxiv.org/abs/2306.13087) and the
[author list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm). Listed versions remain
2019-11-13 and2023-06-22; no replacement was identified in this bounded check. This is no
novelty assessment or change to frozen parameter mappings. All scientific constants are reused.

## Executed readiness � November 11

Implementation `203e55d` passed exact `npm test`: 250 files / 3114 tests, 23 skipped, 993.24s.
The [verification bundle](../../evidence/hil-central-filling-2026-11-11/README.md) retains logs,
review and the real N64 witness: 96 scientific updates, 17 full states and two solved boundary
maps match across separate processes paused at cycles57/58 then resumed to96. New capture
fault/configuration checks passed. The readout reopened all17 states without advancing them.

The latest W4 artifacts report13.063/14.115 active days for broad and19.105/19.121 for early20;
[bound inputs](../../evidence/hil-central-filling-2026-11-11/comparison-inputs.json) preserve exact
seconds/hashes. These observations do not forecast the new cases; a multi-week fine tail remains plausible.
This checkout will remain fixed at its final production commit. Main's PROGRESS and the campaign
receipts carry live status; do not move this execution checkout merely to update prose. Retain
out/hil-central-filling-nov11-witness and verification output alongside campaign bytes for NAS.

## Maker-requested gaming pause � November 11

At17:52Pacific the maker requested a pause to play games. The
[pause receipt](../../evidence/hil-central-filling-2026-11-11/gaming-pause-2026-11-11.json)
records the verified coordinator/worker process identities, stopping the coordinator first to
prevent queue refill, then all20 workers. No campaign process remained. [Read-only checkpoint verification](../../evidence/hil-central-filling-2026-11-11/gaming-pause-checkpoints-2026-11-11.json) loaded all20 started rows with no integrity errors or uncommitted event tails;20queued rows remain unstarted. This is an operational
pause, not scientific completion or failure. Preserve every checkpoint, event prefix, capture
and existing attempt record. Do not rewrite historical exits or launch a replacement batch.
Keep the queue paused until explicit maker resume direction. The exact resume command below
continues from committed complete updates; an unfinished relaxation/update may repeat.

## Actual dispatch � November 11

The [launch receipt](../../evidence/hil-central-filling-2026-11-11/launch.json) records producer
`aa20f969f8b25ad98cf7a25f1015a4f373080657`, Node24.13.1/V8 13.6.233.17-node.40,
wrapper PID25920/coordinator PID12540, start15:02Pacific, actual20workers and20queued.
All20 current checkpoint payloads/manifest hashes passed; all20 permanent initial captures exist.
Sixteen coarse workers had advanced at the observation; all four fine workers were consuming CPU
in their first relaxation. The linked resource sample records every worker and available memory;
all startup stderr files were empty. A running worker is not a scientific endpoint.

Execution checkout: `C:/Users/biao3/.codex/worktrees/hil-oct31-resume-record/snowflake`.
Exact command there: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-central-filling-nov11.ps1 -Mode launch -Workers 20`.
After interruption, first check existing workers, then use the same command with `-Mode resume`.
Do not move this producer to main's later record commits. The coordinator logs are under
`out/hil-central-filling-nov11-controls/campaign-launch-20261111T150253660.{stdout,stderr}.log`,
with separate invocation and eventual exit files. Row logs are
`out/hil-central-filling-nov11/rows/<id>/attempts/initial/{stdout,stderr}.log`.
The existing coordinator refills free slots; no wall deadline or extra BLD work.

Read status with `node runner/src/hil-central-filling-nov11-main.ts summarize out/hil-central-filling-nov11`
in the execution checkout. Read immutable captures with
`node runner/src/hil-central-filling-nov11-readout.ts campaign out/hil-central-filling-nov11 <new-report.json>`.
Keep cohort conclusions pending until their complete operands are available.

## Steps

- [x] Register finite roster, predictions, permanent capture timing and scope before implementation.
- [x] Implement smallest observation seam, roster/entry and retained readout.
- [x] Execute short capture/restart witness, required checks and bounded review.
- [x] Commit/publish producer and launch20workers; record actual restart and log paths.
- [ ] Analyze complete matched groups; preserve full output on NAS and verify recovery.

## Out of scope

No new physical law, environment event, state transplant, arbitrary field reset, source acquisition,
Phase11/GPU/S6 work, changes to old runs, failed-case unchanged retry, worktree closure or pruning.
No claim of continuum convergence, geometry-only causality or new ice physics.

## Tried and rejected

- Rolling restart generations alone: the completed campaign lost exact old switch states; this
  wave retains named permanent states and exercised boundary maps before production.
- Whole old-campaign reruns: six short replays already recovered the needed lead; reuse that evidence.
- Half-CFL checks only at2/3s: may miss the2.3–2.5s boundary; use2.25/2.5/2.75 instead.
- Eight fine runs at coarse2/3s: assumes the same attachment time across voxelizations; four
  early5 fine cases directly test the observed coarse width3/4 contrast at lower redundant cost.
- Arbitrary geometry/field swapping: requires a new scientific intervention contract; not this wave.
- Capacity ladders or fixed wall-time kills: existing budget/direct observations and restart suffice.

## Open questions

Will timing precede persistent opening across widths, and will the comparison survive smaller
timesteps and the two finer seed representations? Those are outcomes, not launch prerequisites.
