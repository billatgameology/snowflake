# Plan - HIL onset intervals and pressure transfer

- **Phase:** active Phase10; charter2.4/2.5/3.2, accepted ADR0058/0059/0060/0062.
- **Status:** all16 endpoints complete November16 at14:57Pacific; analyzed November17. NAS preservation pending.
- **Checkout:** primary main, C:/Users/biao3/Documents/GitHub/snowflake, by explicit maker direction; no new worktree.
- **Started / last touched:** 2026-11-16 by Codex.

## Goal

Narrow preparation intervals and test transport sensitivity of successful histories. The
[24-row analysis](../../evidence/hil-supply-onset-2026-11-13/analysis-nov16.json) finds low6.5/high2.5
lose original openings, low8/high3 preserve them at both temperatures. One timestep halving
preserves this ordering, but one depth changes a layer. This is model development, not physical cause.
Solo scientific research; hostile actors excluded. Deliverable:16 finite N64 cases running
with restart/permanent captures while the four existing fine trajectories continue.

## Done when

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

Launch slice: committed protocol, exact16 operands/control hashes, focused orchestration checks,
both typechecks, metadata/Rule7 and16 actual workers with saved initial states/advancing checkpoints.
Later completion: all terminal dispositions, complete matched readouts and NAS fresh recovery.

## Frozen operands and order

Reuse unchanged November13 solver/recorder: N64, dx.35um, seed2/1 (19 sites), M1 base,
early-only width3 basal intervention, no-dip prism, aggregate-v6/monopole-matched/hexPrism,
noise0/RNGseed1, CFL.0125, residual1e-9/divergence1e-7/max200000 relax sweeps/max100000 updates,
target extent29 (9.8um largest coordinate center span). SigmaInfinity=unchanged table(T)*fraction.
Constant pressure only; no wall limit or environment event. All rows unconditional HIL work.

| Block | Exact operands | Count |
|---|---|---:|
| A interval | T{-4.5,-5} x {(.05,7s),(.05,7.5s),(.10,2.625s),(.10,2.75s)}; pressure101325Pa |8|
| B pressure | T{-4.5,-5} x {(.05,8s),(.10,3s)} x pressure{50662.5,202650}Pa |8|

A then B, loops in printed order. IDs `op16-hil-a-t{4p5|5}-f{0p05|0p1}-s{7|7p5|2p625|2p75}`
and `op16-hil-b-t{4p5|5}-f{0p05|0p1}-s{8|3}-p{half|double}`. All width3.
[Controls](../../evidence/hil-onset-pressure-2026-11-16/comparison-inputs.json) bind12 existing
rows/48 files: low6.5/8 and high2.5/3 width3 at bothT, plus low8/high3 width4 context.
Primary onset uses the8 width3 anchors; pressure uses4 successful width3 normal-pressure
anchors. The4 width4 rows are context only. No redundant reruns.

## Readouts and predictions

A: four complete four-member cohorts (eachT/fraction): earlier failed anchor, two new cutoffs,
successful anchor. B: four complete pressure triplets (eachT/fraction/cutoff) with normal anchor.
For every cohort, minimum terminal physical age, quarter fractions, at-or-before plus next-event
bounds; exact-size endpoints separately. Measure original opening survival/post-switch advance
on shared windows, central fill/attachment, selected demand and solved boundary vapor at actual
switch. Reuse executed `analyzeCavityRows`, `bracketCavityTime`, `measureCavityGeometry` and
retained readers in `out/hil-supply-analysis-20261116/warm/` with cohort selectors only.
Failed/unavailable members make complete cohorts unavailable; never silently omit them.
Zero-depth surface-open layers are not surviving original cavities; occupancy is not mass.
Nonmonotonicity/no transition are allowed. No exact universal threshold, equal dose or single
state-variable mechanism. Pressure changes model diffusion only; physical attachment-pressure
independence is unvalidated. No width4 pressure controls, so no width-specific pressure interaction.
Grid/seed qualification remains unresolved in current fine runs.

## Capture, restart and execution

Reuse unchanged recorder: initial/terminal full state, exact last-active/first-inactive full state
and pre-fill solved boundary maps; central radius1 patches z+/-1; extent maps{5,9,13,17,21,25};
age brackets{1,2,2.5,2.625,2.75,3,4,5,6.5,7,7.5,8,10,20}s. Every completed update checkpoints,
current/previous plus permanent observations. Existing November11 real capture/restart witness
and family tests cover unchanged contract. No capacity ladder or repeated witness.
16 new workers plus4 fine=20. Observe processes/RAM/commit/disk before launch; retain12GiB RAM,
8GiB commit and100GiB disk guards. Prior16 measured5.4057-6.4118active hours; changed pressure/
contention is non-transferable. Expect hours-scale, no finish guarantee or wall deadline.

```
node runner/src/hil-onset-pressure-nov16-main.ts list HIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-onset-pressure-nov16.ps1 -Mode launch -Workers 16
node runner/src/hil-onset-pressure-nov16-main.ts summarize out/hil-onset-pressure-nov16
```

After interruption inspect writers; same wrapper -Mode resume -Workers16 at exact producer.
Node24.13.1/V813.6.233.17-node.40 and main HEAD stay fixed while running. Commit all records
before launch; actual receipt is `out/hil-onset-pressure-nov16-controls/launch-verification.json`,
record to Git after completion without disrupting producer. Separate controls/per-row attempt
logs and errors/exits. Fine recovery receipt: `out/hil-status-20261116/fine-recovery-launch.json`, same frozen producer.
Fine native crash gets one same-state recovery through a separate existing
single-row launcher; don't stop three live workers or resume the entire live fine queue.

Bulk output/detailed analysis stay local pending external-evidence NAS collection
hil-onset-pressure@2026-11-16 publication/fresh restore under ADR0051/0061. Keep all old owners.

## Checks and source currency

Thin roster/entry/wrapper only. Independent literal16 operands, distinct batchID/refusal,
create/resume capture routing, HIL and worker-limit refusals; prior roster, batch execution/resume,
recorder tests and both typechecks. Metadata/Rule7/diff checks; one bounded review after stability.
No shared solver/codec/readout edits or full-suite claim. Rule14A failure: accidental operands,
copied identity or omitted observations; existing boundaries plus literal tests cheaply cover seam.
Lessons A1/B1/B2/C3/C6/E5 govern actually saved states, executable complete comparisons and scoped
claims. No framework, new defense or physical claim. Green checks cover named cases only.
November16 reopened M1v2 https://arxiv.org/abs/1910.09067, TAX2v1 https://arxiv.org/abs/2306.13087
and https://www.its.caltech.edu/~atomic/publist/kglpub.htm. Listed versions2019-11-13/2023-06-22
unchanged; no superseding mapping identified in bounded list check, not novelty assessment.
Pressure provenance caveat retained: D varies inversely with pressure, attachment laws do not.

## Executed preparation

Protocol committed at6bcc3b4 before code. [Verification](../../evidence/hil-onset-pressure-2026-11-16/verification.json)
binds34 focused tests, both typechecks, exact16-row list and one bounded shared-context review
by an agent distinct from the implementation author. All48 control files rehash correctly;
review independently matched new rows to controls allowing only registered cutoff/pressure changes.
Control-description mismatch corrected. No full-suite or independent physical-validation claim.
Fine native-error diagnosis and recent progress rates are retained in this evidence directory;
actual recovery receipt remains indexed below until its next complete checkpoint.

## Completed execution - November17

The [launch receipt](../../evidence/hil-onset-pressure-2026-11-16/launch.json) records16 workers
from bbf1cf1 on main, all retained initial states hash-checked/decoded and checkpoints advancing.
All16 are now extent29/exit0 with empty operational error lists; wrapper exited0 at
2026-11-16T22:57:56.9238027Z. Main may advance for the maker-authorized successor because this
entire batch is terminal; do not resume completed rows. Old output remains local pending NAS.
The [fine recovery](../../evidence/hil-onset-pressure-2026-11-16/fine-recovery-launch.json)
advanced tick1235 to1236 with strict checkpoint verification; its separate producer remains fixed.

## Matched analysis - November17

The [24-row/789-state readout](../../evidence/hil-onset-pressure-2026-11-16/analysis-nov17.json)
provides all4 onset and4 pressure cohorts. All4 half-pressure histories retain/deepen original
openings; all4 double-pressure histories lose them. Common-age comparisons and adjacent-event
bounds preserve depth ordering. Low-supply7.5s survives only at-5C, not-4.5C; no exact universal
threshold is implied. No numerical convergence or physical-pressure law is established.
The [successor](hil-pressure-check-nov17.md) qualifies pressure at smaller CFL and completes
width4 controls. Full local readouts/recipes/switch fields are hash-bound in the concise report.

## Steps

- [x] Commit protocol and control bindings before implementation.
- [x] Check thin orchestration:34 focused tests and both typechecks pass; bounded review corrected control description. Commit this clean main producer before launch.
- [x] Launch16 at bbf1cf1 on main; all initial states verified and checkpoints advanced; all16 now terminal.
- [ ] Complete matched analysis and governed NAS recovery.

## Out of scope

New physics/state swaps, fine grids, BLD/GPU/S6/Phase7, wall deadline, cleanup/pruning,
unchanged scientific-failure retries or automatic extra waves.

## Tried and rejected

- More fine jobs or repeated controls: current fine tail/retained anchors already serve these questions.
- Universal onset or equal-dose claim: geometry/fill/vapor/lag evolve together.
- New worktree: explicitly declined; main is the producer and stays fixed during execution.
- Double pressure assumed safe: old BLD T-4.5/f.075/early20/CFL.025 failed subnormal boundary
  convergence. New operands differ; retain tolerances, failure classification and no automatic retry.
- Rolling restart alone: permanent exact switch observations remain mandatory.

## Open questions

Do pressure changes alter persistence, and do intermediate cutoffs narrow the interval?
These are registered outcomes, not launch prerequisites.
