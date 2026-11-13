# Plan — HIL onset and supply-duration follow-up

- **Phase:** active Phase10; charter sections2.5/3.2 and accepted ADR0058/0059/0060/0062.
- **Status:** authorized November13 by the maker's “do it”; protocol registered before implementation.
- **Started / last touched:** 2026-11-13 by Codex.
- **Checkout:** `codex/hil-onset-followup-nov13`, `C:/Users/biao3/.codex/worktrees/hil-onset-followup-nov13/snowflake`.

## Goal

Run the approved16 follow-ups while the four original fine central-filling cases continue.
The [completed adventure analysis](../../evidence/hil-adventures-2026-11-12/analysis-2026-11-13/README.md)
found onset between nominal4.25/4.5s at current CFL, and forcing-dependent persistence under5s
preparation. The two questions are whether that onset contrast survives timestep halving and
whether changing preparation duration alters the low/high-supply contrast. Solo scientific
research; hostile actors excluded. One deliverable now:16 registered rows actually growing
with permanent switch observations and recoverable complete-cycle state.

## Done when

Broader charter endpoint, verbatim; this wave alone does not satisfy it:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

Launch slice: exact16 operands and16 reused controls committed; focused orchestration checks,
both typechecks and bounded routing review pass;16 new workers plus four old workers observed,
with checkpoints/initial captures and source/runtime/resume commands recorded. Later completion
requires terminal dispositions, complete matched comparisons and governed NAS publication/fresh
recovery. No result or physical-validation label is inferred from successful launch.

## Exact roster and targets

All rows: HIL, M1 base with separately identified early-only basal-width experiment; no-dip
prism kinetics; N64, dx.35um, seed radius2/thickness1, noise0/RNGseed1, hexPrism,
aggregate-hv-g1h1-v6, monopole-matched, pressure101325Pa. Imposed supersaturation is exactly
`phase6SigmaWaterFromTable(tempC) * fraction`. Residual1e-9/divergence1e-7, max200000
relaxation sweeps and max100000 complete updates. Extent29 is9.8um largest coordinate center
span, not radius or guaranteed runtime. Size target, step cap, contact and numerical failure
retain existing dispositions. No wall-time limit or target extension.

| Block | New operands | Rows | IDs begin `on13-hil-` |
|---|---|---:|---|
| A onset timestep | T{-4.5,-5} × width{3,4} × cutoff{4.25,4.5}s; fraction.075, CFL.0125 |8| `a-t{4p5|5}-w{3|4}-s{4p25|4p5}` |
| B supply/duration | T{-4.5,-5} × width{3,4} × {(fraction.05,cutoff8s),(fraction.10,cutoff3s)}; CFL.025 |8| `b-t{4p5|5}-f{0p05|0p1}-w{3|4}-s{8|3}` |

Order A then B; A loops temperature,width,cutoff in printed order. B loops temperature,
fraction/cutoff pair,width. All16 dispatch under the same16-worker ceiling, with no reserves.
The [control binding](../../evidence/hil-onset-followup-2026-11-13/comparison-inputs.json)
contains all16 exact completed source rows/spec/result/events/exit hashes. A reuses matching
`adv12-hil-onset-t{4p5|5}-w{3|4}-s{4p25|4p5}` atCFL.025. B reuses matching
`adv12-hil-forcing-t{4p5|5}-f{0p05|0p1}-early{3|4}` atcutoff5s. No controls are rerun.

## Registered readouts and interpretations

A primary cohort per temperature:8 rows, two widths × two cutoffs × both CFLs. Use the minimum
terminal physical age of the complete cohort and its quarter fractions, at-or-before/adjacent-
event brackets; report each matched CFL pair and width contrast separately. Compare original
opening survival and post-switch advance, center/waist geometry, seed-subtracted axial/lateral
span and occupancy count (not mass). Also report exact-size endpoints and actual switch times.
Prediction: the qualitative width3 cutoff contrast persists; failure/shift limits the observed
onset to the tested numerical setting. No exact or universal threshold follows from agreement.

B primary cohort per temperature:8 rows, two widths × four supply/duration combinations
(.05/5s,.05/8s,.10/5s,.10/3s). Apply the same complete-cohort age/bracket/size readouts;
report within-supply matched duration pairs and width controls separately. For labeled pairwise
post-switch comparisons use the existing warm recipe's shared post-switch window and retained
actual switch times; do not confuse elapsed-from-own-switch with equal physical age. The
prior .075 cohort is context only, not silently added to the primary denominator.
Prediction: lower-supply longer preparation may establish persistence and higher-supply shorter
preparation may remove it. Either outcome is informative; no monotonicity is assumed. The8/3s
choices use prior active-preparation growth-stage observations, not equal physical dose or state.
Geometry, partial fill, vapor and lag remain coupled. Do not claim one isolated physical cause.

Existing producers/readers: `post-phase10-discovery.ts` supplies event/snapshot/endpoint bytes;
`hil-growth-dynamics-oct21-readout.ts` reconstructs events/cavity geometry;
`hil-central-filling-nov11-readout.ts retained` strictly decodes permanent observations;
the established warm matched recipe under `evidence/hil-results-review-2026-11-11/warm/`
computes common ages, original-opening intervals, additions and observation brackets. The
November13 analysis already exercises these outputs. No new scientific readout implementation.
Never drop failed/incomplete members to claim complete comparisons. Missing ages/switches due
to earlier termination remain unavailable, with actual limits and no fabricated data.

## Capture and restart contract

Use existing permanent recorder: initial/terminal full states, named age brackets
{1,2,3,4,4.25,4.5,4.75,5,6,8,10,20}s, every attachment batch in central radius1 patches
at z offsets+/-1, last-active/first-inactive complete states and pre-fill solved boundary maps.
Existing extent maps remain{5,9,13,17,21,25}. Age8 is an existing observation setting, not a
codec or numerical change. Keep lattice vapor and solved boundary vapor labeled separately.
The coupled-update cutoff convention remains unchanged; report actual crossing/switch times.

Checkpoint every complete update; preserve current/previous restart generations. The existing
copy-before-rotation/reconcile-on-resume route keeps named analysis captures permanently.
Reuse the November11 real N64 capture/restart witness (96 updates,17 states,two boundary maps)
and existing discovery family equality witnesses: the solver/codec/recorder contract is unchanged.
No repeated capacity ladder or new pause/resume trial merely for these operands. If that code
changes, revisit the required checks before launch. Keep execution HEAD and Node24.13.1/V8
13.6.233.17-node.40 fixed after launch; later main commits own live records.

## Implementation, checks and admitted failure

Add only the new roster/main entry/hidden wrapper and focused routing tests, following the
adventure pattern and unchanged coordinator/recorder. Rule14A: accidental wrong operands,
forgotten capture routing or duplicate dispatch can waste compute/lose useful bytes. Existing
leases, spec/producer binding and recorder protect their boundaries; a complete independent
expected-cohort test and negative HIL/row routing checks protect the new seam. No framework.
Lessons A1/B1/B2 require real retained bytes; C2/C3/C6 require measured scope and controls;
E4/E5 require reachable state and implementation-scoped claims. Review those before launch/
interpretation. Existing checks protect named cases, not every causal judgment.

Shortest meaningful check: list exact16 rows, verify reused controls, execute new/prior roster,
batch-resume/execution and retained-observation suites, both typechecks, Rule7 and metadata/diff
checks. One bounded shared-context review after stabilization checks roster/capture/launch routing.
This is isolated orchestration, not numerical, codec, recorder, gate or readout code; no full
suite is required under Rule6 unless the changed surface expands. Actual initial checkpoints/
captures are verified after dispatch. Do not substitute a list-only dry run for that observation.

## Budget, launch and custody

16 new single-process workers plus four original fine workers use the authorized20-worker
allocation. Record live processes/RSS, available RAM, commit headroom and disk before launch;
retain existing12GiB available-RAM/8GiB commit guards and at least100GiB local free disk.
The completed46 rows took1.053–5.433 active hours (median4.028); previous12 half-CFL coarse
central-filling rows took4.553–5.635h. Changed cutoffs/forcing/contention make these anchors
non-transferable, not a completion promise. No additional long-grid commitments or BLD work.

In this fixed checkout:

```powershell
node runner/src/hil-onset-followup-nov13-main.ts list HIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-onset-followup-nov13.ps1 -Mode launch -Workers 16
node runner/src/hil-onset-followup-nov13-main.ts summarize out/hil-onset-followup-nov13
```

After interruption inspect existing writers, then use the wrapper with `-Mode resume -Workers 16`.
A gaming pause stops both active coordinators before their workers; keep every attempt/checkpoint.
Logs: `out/hil-onset-followup-nov13-controls/campaign-*`; rows keep separate attempts/stdout,
stderr and exit receipts. Actual filenames/PIDs/command will be bound by the launch receipt.

Provisional external-evidence NAS collection `hil-onset-followup@2026-11-13` owns completed
raw output/captures/detailed analysis, under ADR0051/0061. Keep originals until immutable
publication, committed bindings and fresh restore; no worktree closure or local pruning here.
Git retains small records/code/manifests, not bulk outputs. Previous output owners remain fixed.
The app worktree creation request did not return and was stopped; after verifying no new
checkout existed, native Git created this one task checkout from4db922f. No extra refs.

## Source currency

November13 bounded check reopened [M1](https://arxiv.org/abs/1910.09067),
[TAX2](https://arxiv.org/abs/2306.13087) and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
The pages still list M1v2 dated2019-11-13 and TAX2v1 dated2023-06-22. No replacement was
identified in the bounded later-publication listing. This is no novelty assessment or change
to parameter mappings/provenance. All existing scientific constants/operators remain frozen.

## Steps

- [ ] Commit protocol and16 reused-control bindings before implementation.
- [ ] Implement only the thin orchestration seam and complete scoped checks/review.
- [ ] Commit/publish clean producer, launch16 workers and verify retained initial state.
- [ ] Analyze completed cohorts; preserve bulk output/detailed readouts on NAS and verify recovery.

## Out of scope

No solver/parameter/codec/readout changes, state transplant, physical cause/validation claim,
new fine-grid cases, BLD/GPU/S6/Phase7 work, wall deadline, unchanged failed retry, cleanup or pruning.

## Tried and rejected

- Another broad cold sweep: completed seed/pressure contrasts already preserve the named-stage
  ordering; inspect saved fields before spending more runs there.
- Exact threshold claim from the4.25/4.5s result: only one timestep was tested; A qualifies it.
- Central occupancy as sufficient predictor: saved identical occupied shapes diverge later;
  preserve partial fill/vapor/lag observations, without inventing a state-transplant intervention.
- Treating wider-seed null as erased established memory: selection is delayed and no original
  opening existed at switch. That separate reserve is not dispatched in these16 rows.
- Nominal forcing-times-duration matching as equal dose: local solved fields/state differ;
  use stage-informed8/3s candidates without claiming state equivalence.
- Reusing completed/frozen producer checkout for new code: would break exact resume identity.
- Repeated capacity ladders, new restart codec or more capture machinery: existing boundaries
  cover this unchanged contract; implement only the new finite roster and entry routing.

## Open questions

Does the narrow onset survive timestep halving, and can preparation duration change the supply
contrast? These are outcomes of the authorized wave, not launch prerequisites.
