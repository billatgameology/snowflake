# Plan - HIL pressure contrast qualification

- **Phase:** active Phase10; charter2.4/2.5/3.2 and accepted ADR0058/0059/0060/0062.
- **Status:** all16 extent29 endpoints complete November17 at16:40Pacific; operational verification November18; matched analysis and NAS recovery pending.
- **Checkout:** primary main by explicit maker direction, no new worktree. Prior16 are all terminal.
- **Started / last touched:** 2026-11-17 by Codex.

## Goal

Qualify the new pressure contrast and complete its width comparison. The preceding24-row
saved-state analysis finds all4 half-pressure width3 histories retain original openings and all4
double-pressure histories lose them, with common-age comparisons supporting the contrast.
A smaller timestep tests numerical sensitivity; width4 tests how the preparation selection
interacts with pressure. No additional dense cutoff scan is needed now.
Solo scientific research; hostile actors excluded. Deliverable:16 new resumable N64 runs with
permanent switch captures while the four fine runs remain untouched.

## Done when

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

Launch slice: protocol/control bindings committed; exact roster/capture routing tests, both
typechecks, metadata and Rule7 pass; all16 actual workers save initial full states and advance
checkpoints. Later completion requires terminal classifications, complete matched readouts and
NAS publication/fresh recovery. No physical-validation or automatic phase-completion claim.

## Frozen roster and controls

Reuse the unchanged solver/recorder from November16. N64, dx.35um, seed radius2/thickness1,
M1 base plus early-only local basal-width history, no-dip prism, aggregate-v6/monopole-matched/
hexPrism, noise0/RNGseed1, sigmaInfinity=temperature-table*fraction, residual1e-9/divergence1e-7,
max200000 relax sweeps and100000 complete updates, target extent29=9.8um largest coordinate
center span. Constant pressures, no environment event or wall deadline.

| Block | T | Fraction / cutoff | Pressure Pa | Width | CFL | Count |
|---|---|---|---|---|---|---:|
| A timestep qualification | -4.5,-5 | .05/8s,.10/3s | 50662.5,202650 |3|.00625|8|
| B width comparison | -4.5,-5 | .05/8s,.10/3s | 50662.5,202650 |4|.0125|8|

A then B; nested loops T, fraction/cutoff, pressure in printed order. IDs
`pc17-hil-{a|b}-t{4p5|5}-f{0p05|0p1}-s{8|3}-p{half|double}`. All unconditional HIL work.
[Controls](../../evidence/hil-pressure-check-2026-11-17/comparison-inputs.json):8 op16 width3
half/double-pressure rows;4 so13 width3 normal-pressure and4 so13 width4 normal-pressure rows,
allCFL.0125, exact T/supply/cutoff/seed/grid/target matches. Reuse, never rerun for utilization.

## Readouts and predictions

A:8 complete two-member CFL pairs, old.0125 versus new.00625 at eachT/supply/pressure.
B:4 complete six-member factorial cohorts, oneperT/supply, widths3/4 x half/normal/double
pressure atCFL.0125. Also report all12 matched width pairs. For each complete cohort/pair use
minimum terminal physical age and quarter fractions, at-or-before plus next-event alternatives.
Exact-size endpoints are separate. Track original opening survival, post-switch tip advance,
central attachment/fill, selected demand and solved boundary vapor at actual switch brackets.
Use unchanged existing cavity/event readers and retained-state readout, cohort selectors only;
preceding recipe `out/hil-onset-pressure-analysis-20261117/warm/` exercises these quantities.

Prediction: width3 pressure ordering survives halving. Width4 may remain closed or acquire
persistence at lower pressure; either outcome distinguishes selection/transport interaction.
Failure/contact/cap/missing input makes the complete comparison unavailable, never absent effect.
No monotonic threshold theorem; zero-depth surface-open layers are not surviving original cavities.
Pressure changes model diffusion only, not attachment parameters; no physical pressure law,
continuum/grid convergence or single-state-variable cause. Smaller CFL does not match exact switch
time. Opposite signed layers are not independent crystals, and occupancy is not deposited mass.

## Retention, budget and restart

Reuse unchanged permanent initial/terminal full states, exact last-active/first-inactive full
states and pre-fill solved boundary maps; central radius1 patches at z+/-1; spatial extents
{5,9,13,17,21,25}; age brackets{1,2,2.5,3,4,5,6.5,7,7.5,8,10,20}s. Every completed update
checkpoints, current/previous plus permanent captures. Reuse November11 real restart/capture
witness and existing family tests; no capacity ladder, codec or repeat witness.
16 newworkers+4fine=20 HIL workers. Direct process/RAM/commit/disk observation before launch;
retain12GiB available RAM/8GiB commit headroom/100GiB disk guards. Prior16 took about5.33-7.60h;
halving CFL may roughly double update counts but runtime does not scale exactly. Hours to roughly
a day is a planning expectation, not a stop condition or transferable timing qualification.

```
node runner/src/hil-pressure-check-nov17-main.ts list HIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-pressure-check-nov17.ps1 -Mode launch -Workers 16
node runner/src/hil-pressure-check-nov17-main.ts summarize out/hil-pressure-check-nov17
```

Resume only after writer inspection using same wrapper -Mode resume -Workers16 and pinned
Node24.13.1/V813.6.233.17-node.40/producer. Main stays fixed while running. Commit source and
records before launch; actual receipt lives at `out/hil-pressure-check-nov17-controls/launch-verification.json`
until terminal permits its Git record. Separate coordinator/per-row attempt logs/errors/exits.
Keep prior batch bbf1cf1 provenance and all outputs; no completed-row restart or worktree cleanup.
Fine source aa20f96 and four workers are untouched. Bulk payloads remain local until governed
external-evidence collection hil-pressure-check@2026-11-17 and fresh NAS recovery underADR0051/0061.

## Verification and source currency

Only new thin roster/entry/wrapper/tests; no shared scientific/readout/codec/recorder changes.
Independent literal16 operands/unique batchID, all32 create/resume routes with observations,
HIL/worker/config refusals; prior roster, batch execution/resume and recorder tests; both typechecks.
Metadata/Rule7/diff and one bounded review after source stabilizes. No full-suite claim.
Rule14A accidental failure: wrong copied operand/identity or missing observation routing; existing
boundary checks and literal fixtures address it cheaply. LessonsA1/B1/B2/C3/C6/E5 require actual
saved bytes, complete executable comparisons and limited interpretation. No new framework.
November17 rechecked M1v2 https://arxiv.org/abs/1910.09067, TAX2v1 https://arxiv.org/abs/2306.13087
and https://www.its.caltech.edu/~atomic/publist/kglpub.htm: listed versions2019-11-13/2023-06-22
unchanged; no superseding mapping identified in bounded list check, not novelty assessment.
Parameter provenance preserves its physical pressure-independence caveat. No constants change.

## Executed preparation

Protocol committed14a6eaa before implementation. [Verification](../../evidence/hil-pressure-check-2026-11-17/verification.json)
binds34 tests, both typechecks, literal16-row list, source hashes and one shared-context review
by an agent distinct from the implementation author. All64 control files rehash; new rows differ
only by registered CFL or width and identity. No full-suite/physical-validation claim.
Initial focused execution caught a parenthesis typo before tests loaded; corrected before any
run and passed final checks, with both logs retained. Main stays at producer after launch.
The [prior matched readout](../../evidence/hil-onset-pressure-2026-11-16/analysis-nov17.json)
records24 rows/789 retained states; complete pressure contrasts motivate this batch.

## Completion status - November18

The [launch receipt](../../evidence/hil-pressure-check-2026-11-17/launch.json) binds the actual
November17 dispatch. [Current status](../../evidence/hil-pressure-check-2026-11-17/status-nov18.json)
verifies16/16 size-target29 endpoints, exit0 and no operational errors, with no queued cases.
Final completion2026-11-18T00:40:18.331Z (November17,16:40Pacific); wall durations
5.430929722222222-10.596225555555554h. All32 switch labels and16 terminal labels are present
and hashed; this status does not decode all saved states or establish the pressure interpretation.
The [four fine rows](../../evidence/hil-pressure-check-2026-11-17/fine-status-nov18.json) remain
active at extents33/37/35/35 of57,1895/2269/2275/2306 updates, recent checkpoints, active CPU
and empty stderr. Keep their separate producer fixed. Main may advance because its batch is
entirely terminal. Next execute registered CFL/width-pressure comparisons, then NAS recovery.
No new runs or worktrees were launched for this status request.

## Steps

- [x] Commit protocol and16 bound controls before implementation.
- [x] Thin orchestration passes34 focused tests and both typechecks; bounded review no findings. Commit clean producer before launch.
- [x] Launched16 at8df617e on main; initial states/checkpoint progress verified; all16 now complete.
- [ ] Complete registered comparisons and NAS preservation/fresh recovery.

## Out of scope

New physical laws/state swaps, fine grids, BLD/GPU/S6/Phase7, wall deadline, cleanup, automatic
extra waves or unchanged scientific-failure retries.

## Tried and rejected

- More dense cutoff bisection: pressure contrast is the stronger next discriminating lead.
- Pressure-scaled duration rescue now: defer until timestep/width qualification; nominal pressure
  times duration is not matched local dose/state.
- Calling all new double-pressure cases failures: previous different early20 case failed, but
  the eight November16 pressure cases all reached targets. Preserve both scoped facts.
- New worktree: maker explicitly directs main. Keep source fixed during active batch.
- Rolling checkpoints alone or changing current fine cases: would lose observations/identity.

## Open questions

Does the pressure contrast survive smaller timestep, and does wider preparation change its
response? These are outcomes, not blockers or claims already established.
