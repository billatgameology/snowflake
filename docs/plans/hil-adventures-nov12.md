# Plan - HIL short and medium exploration adventures

- **Phase:** active Phase10; charter2.5/3.2 and accepted ADR0055/0058/0059/0060/0062.
- **Status:** registered before implementation; maker requests additional short/medium exploration.
- **Started / last touched:** 2026-11-12 by Codex.
- **Checkout:** `codex/hil-adventures-nov12`, `C:/Users/biao3/.codex/worktrees/hil-adventures-nov12/snowflake`.

## Goal

Use the16 free HIL worker slots for46 new coarse cases across five questions, while the four
long central-filling N126 cases continue unchanged. Solo scientific research; hostile actors
excluded. One deliverable: a finite, resumable queue with permanent observations and matched
controls, using existing physics, recorder and coordinator. No new fine-grid commitments.

The [complete36-row triage](../../evidence/hil-adventures-2026-11-12/central-filling-triage.json)
reopened840 retained states using the existing reader. No observed opening advanced more than
one coarse cell (.35um) in these individual histories; even width4 cutoffs2/2.25, before central
attachment, did not rescue advancing openings. This weakens central occupancy alone as a
selector in this measured set, without isolating geometry/fill/vapor causes. The useful warm
gap is cutoff4 to the historical persistent width3 cutoff5. Common-age A/B analysis remains
pending; this internal triage is enough to choose a bounded next question, not a physical claim.

## Done when

The broader charter endpoint remains verbatim; this wave alone cannot satisfy it:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

Launch slice: committed exact46-row roster and reused-control bindings; focused orchestration
checks and both typechecks pass;16 actual new workers and4 old workers observed, with initial
checkpoints/captures and exact resume command recorded. Later scientific completion requires
terminal dispositions, complete matched readouts, missing-coverage limits and verified NAS recovery.

## Exact roster and finite targets

All new cases: HIL, N64, spacing.35um, hexPrism, aggregate-hv-g1h1-v6, monopole-matched,
noise0/seed1, CFL.025, max100000 complete updates, extent29 (9.8um largest coordinate center
span), residual1e-9/divergence1e-7, max200000 relaxation sweeps. Normal pressure101325Pa,
seed radius/thickness2/1 unless overridden. Supersaturation is exactly the existing
`phase6SigmaWaterFromTable(tempC) * fraction`; constants and operators do not change.
Broad means ordinary `M1_NO_DIP_ABLATION`; early-width and facet arms use explicit M1 base
metadata and their separately accepted experiment identities, not ordinary M1 kinetics.

| Block / IDs begin `adv12-hil-` | New operands | New rows | Question |
|---|---|---:|---|
| onset | T{-4.5,-5}, fraction.075, width{3,4}, early cutoff{4.5,4.25,4.75}s |12| When does sustained opening first appear between the observed4s and5s histories? |
| warm-seed | T{-4.5,-5}, fraction.075, seeds{2/3,3/1}, broad versus width3 early5 |8| Does warm preparation memory survive thicker/wider seeds? |
| cold-seed | T-14.4, fraction.10, seeds{2/3,3/1}, facet arms{both,neither,basal-only,prism-only} |8| Is the prism-associated core/tip contrast robust to starting geometry? |
| cold-pressure | T-14.4, fraction.10, pressure{50662.5,202650}Pa, same four facet arms |8| Does transport change only the growth clock or also stage-matched core/tip structure? |
| forcing | T{-4.5,-5}, fraction{.05,.10}, broad/width3 early5/width4 early5 |10| Does vapor supply shift warm persistence and the width3/4 contrast? |

The forcing design has12 operands: two -4.5C broad controls already exist, so launch only10.
Reuse `gd21-bld-w3-fLow-broad` and `gd21-bld-w3-fHigh-broad` with exact bytes in
[reused inputs](../../evidence/hil-adventures-2026-11-12/reused-inputs.json).
That record also binds original-seed warm `gd21-bld-w1-t{4p5|5}-c025-{broad|early5-w3}`
and the normal-pressure cold `oct11-hil-cold-step-t14p4-f0p1-cfl0p025-{arm}` quartet.
Do not rerun existing controls for utilization. Old reserve identifiers are not dispatched;
the former R3 seed-robustness question is selected here through newly registered operands.

Queue order is the first four onset, warm-seed, cold-seed and cold-pressure rows (16 diverse
initial cases), then the remaining onset, warm-seed, cold-seed, cold-pressure and forcing rows.
Within each block use the printed operand order; warm seeds use radius/thickness2/3 then3/1,
arms broad then early3, forcing uses temperature then fraction then broad/early3/early4,
skipping only the two reused controls. Entry IDs encode block and all varied operands.

## Predictions, readouts and scope

Onset: predict width3 changes between cutoff4 and5, but no monotonicity or exact-time threshold
is assumed. Width4 is the matched control. Compare all12 new cases plus the existing4s/5s
operands at each temperature, using complete cohorts, minimum terminal physical age and its
quarter fractions; report paired width comparisons separately. Use event-adjacent brackets,
original-opening survival and tip advance, post-switch axial/lateral additions, local central
fill and exact-size geometry. A shift in terminal extent alone is insufficient. Existing timestep
sensitivity at cutoff2.5 remains unresolved; a new apparent onset will require a focused numerical
comparison before being called robust. Use `hil-central-filling-nov11-readout.ts` in retained mode
and `hil-growth-dynamics-oct21-readout.ts` event/cavity readers, then the established matched recipe.

Warm seed: compare each broad/prepared pair and each temperature's six-member seed cohort
(two new seeds plus bound original seed). Predict persistence can survive while dimensions
change; subtract initial seed spans and report occupied sites as counts, not mass. Seed changes
alter volume, surface and transport together and do not isolate geometry-only causality.

Cold seed and pressure: reuse the existing cold reconstruction
and matched plateau recipe in `evidence/hil-results-review-2026-11-11/cold/`. At tip radii8/9
cells, compare quarter/half/three-quarter fractions of the full cohort's shortest exited plateau,
plus common-age quarters. Each axis has a12-member cohort (three seed shapes or three pressures,
four arms). Report missing plateau exits explicitly; no target extension or exclusion to force
coverage. Prediction: prism-associated ordering may persist; pressure may change only timing,
but changes in stage-matched gaps would identify a transport interaction in this implementation.

Forcing: each temperature has a nine-member cohort using fractions.05/.075/.10 and the three
arms. Bind existing .075 broad/width3/width4 early5 controls through the growth-dynamics/recovery
records before final comparison; .075 width4 is `gd21-bld-w2-t{4p5|5}-w4-early5`.
Compare common ages and exact span, central filling, switch states, original-opening persistence
and advances. Allow either a changed clock or a changed opening outcome. No source parameter
fit, physical-width-law claim, quantitative validation or Phase11 milestone follows.

## Observation and restart retention

Use existing permanent recorder settings only. Retain initial/terminal and before/after age
brackets{1,2,3,4,4.25,4.5,4.75,5,6,10,20}s for every case, plus each attachment batch in the
central radius1 patches at z offsets +/-(floor(seedThickness/2)+1). All early-only width rows
also retain last-active/first-inactive full states and solved pre-fill boundary maps. Broad/facet
rows have no width switch; use their age states and existing boundary snapshots at extents
{5,9,13,17,21,25}. Do not imply boundary snapshots exist at every age. The existing copy-before-
rotation/reconcile-on-resume path protects named captures outside current/previous restart slots.
Age/region settings are observation configuration, never growth decisions.

Every completed cycle checkpoints; an interrupted unfinished cycle repeats. The already executed
November11 N64 capture/restart witness and existing discovery family witnesses cover the unchanged
contracts; no repeat capacity ladder or pause/resume trial just for new operands. Keep this new
execution producer/runtime fixed after launch, separately from `aa20f96`'s four continuing rows.
Stop dispositions remain size target, step cap, contact or numerical failure. No wall limit.

## Budget and expected scale

16 new workers plus4 current workers use the maker's20-worker allocation. Existing global memory
guards retain12GiB available physical RAM and8GiB commit headroom. Observe current processes,
memory and free disk before launch; keep at least100GiB free. No GPU or BLD work.
The triage records all24 A cases at3.436-4.501 active hours and all12 B cases at4.553-5.635h.
The bound cold quartet spans4131.669-15350.275 seconds (about1.15-4.26h). Changed seed, pressure,
forcing and cutoff costs are **non-transferable**: these anchors suggest hours-scale cases and
roughly a day of queued work, not a deadline or guarantee. The pending fine cases remain the
intended long tail; investigate surprising cost before adding more work, never kill science
at an arbitrary elapsed time. Actual contention may slow the original four.

## Implementation and verification

Commit this plan before code. Add only `hil-adventures-nov12-{roster,main}.ts`, its wrapper and
focused operand/routing tests, copying the existing central-filling entry's recorder route and
delegating to the unchanged operational coordinator. Rule14A: accidental wrong operands,
duplicate runs or forgotten capture routing could waste compute or lose deciding observations;
the existing lease, binding and recorder boundaries handle these, and finite roster/routing
checks cover the new seam. No framework or verifier expansion. Lessons A1/B1/B2/E4 require
real retained bytes and exact resume; C2/C3/C6/E5 require matched operands and scoped claims.

At the stable orchestration checkpoint: new/prior roster, batch-resume/execution and retained
observation tests; both typechecks; Rule7; list-only CLI, evidence metadata and diff checks.
One bounded shared-context review checks actual roster/control/capture/launch routing after
stabilization. No numerical, codec, recorder, scientific calculation/readout or gate changes:
the orchestration tier and October19 precedent apply, not a full solver suite. If that surface
changes, reassess Rule6 before execution. No new tests merely duplicating constants without
independent complete expected cohort/negative routing checks.

Commands in the new fixed checkout:

```powershell
node runner/src/hil-adventures-nov12-main.ts list HIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-adventures-nov12.ps1 -Mode launch -Workers 16
node runner/src/hil-adventures-nov12-main.ts summarize out/hil-adventures-nov12
```

After interruption, check existing writers and replace launch with `-Mode resume -Workers 16`.
Hidden wrapper/coordinator logs live in `out/hil-adventures-nov12-controls`; each row has separate
attempt stdout/stderr/exit receipts. Record actual workers, checkpoints and capture files before
claiming launch success. No automatic unchanged retry of a scientific failure.

## Source currency, custody and worktree disposition

November12 bounded currency check reopened [M1 v2](https://arxiv.org/abs/1910.09067),
[TAX2 v1](https://arxiv.org/abs/2306.13087) and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
The versions remain2019-11-13/2023-06-22; the later list contained no replacement identified
in this bounded check. No parameter change or novelty claim. Existing provenance/classes apply.

Provisional external-evidence NAS collection `hil-adventures@2026-11-12` will own raw outputs,
captures and detailed readouts under ADR0051/0061. Keep local bytes until immutable publication,
committed bindings and fresh restore are verified; bulk data stays out of Git. Small receipts,
reused-input hashes and concise triage are tracked/pinned. Existing original outputs remain in
their current worktrees; this wave does not authorize their closure or pruning.
The app worktree creation request did not return and was stopped; native Git created the one
named isolated worktree. No other worktree/branch is repurposed or removed.

## Steps

- [x] Commit protocol and reused-input/triage bindings before implementation (`0db5b6f`).
- [ ] Add finite roster, existing recorder/coordinator route and hidden wrapper.
- [ ] Complete scoped checks and one bounded review; commit clean producer.
- [ ] Launch16 additional workers, verify total20 and retained state, update main records.
- [ ] Analyze complete cohorts; preserve bulk output on NAS and verify recovery.

## Out of scope

No new physics/solver/codec, state transplant, timeline or late-only capture seam, fine-grid
jobs, arbitrary wall kill, enlarged target, GPU/BLD work, failed unchanged retry, Phase7/S6,
physical-validation claim, worktree closure or local pruning.

## Tried and rejected

- More2-3s cutoff density: the complete36-row triage does not show advancing openings there;
  use the unresolved4-to5s onset interval instead. Do not call central occupancy sufficient.
- Replaying two completed forcing controls to round the batch to48: reuse bound bytes;46 new.
- Adding timeline/late-only histories: current permanent recorder has no exact switch capture
  for those modes. Avoid repeating the lost-state mistake or expanding machinery for this wave.
- Another fine/larger-domain tail: conflicts with the requested short/medium complement.
- Failed double-pressure warm early20 and failed cooling case: no unchanged retries.
- Giant factorial, new capacity ladder, repeated unchanged restart qualification or wall deadline:
  adds cost without the named new discrimination; use finite cohorts and existing controls.

## Open questions

Will the warm onset survive changed forcing/seed, and do cold facet effects depend on starting
geometry or transport at matched stage? These are outcomes, not launch prerequisites.
