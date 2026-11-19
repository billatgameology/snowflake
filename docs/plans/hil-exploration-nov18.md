# Plan - HIL preparation, seed and temperature exploration

- **Phase:** active Phase 10; charter sections 2.4, 2.5 and 3.2; accepted ADRs 0058, 0059, 0060 and 0062.
- **Status:** protocol registration before implementation and launch.
- **Started / last touched:** 2026-11-18 by Codex.
- **Checkout:** primary main, explicitly requested by the maker; no new branch or worktree.

## Goal

Queue 192 finite, resumable short-to-medium experiments alongside the four continuing fine rows.
The maker asks for 80+ cases and approximately four to five days of useful queued work. Test three
questions suggested by the completed pressure qualification: whether preparation duration can
rescue or suppress the pressure contrast, whether starting shape changes preparation memory,
and whether that response transfers away from the two original temperature anchors.
Solo scientific research; hostile actors excluded. One deliverable: the registered queue running
through the existing 16-worker dispatcher with permanent scientific observations and recovery.

## Done when

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

This launch slice is done when the protocol and exact operands are committed, focused checks and
both typechecks pass, the queue is dispatched at 16 workers, all first 16 workers preserve initial
full states and advance complete-cycle checkpoints, and the remaining 176 rows are accounted for
as queued. Later completion requires terminal classifications, complete registered comparisons
and governed NAS publication with fresh recovery. Launch is not campaign or phase completion.

## Evidence and decision

The [November 18 analysis](../../evidence/hil-pressure-check-2026-11-17/analysis-nov18.json)
uses the unchanged existing readers on 32 unique rows and 988 retained states: all 8 timestep
pairs, 4 six-member width/pressure cohorts and 12 width pairs are available. The 8 new width-3
smaller-step rows preserve the previous pressure ordering and terminal depths; all 8 new width-4
half/double-pressure rows lose their original openings, matching the 4 normal-pressure width-4
controls. This supports preparation, seed and transfer questions; a third timestep halving or
another dense threshold bisection is lower priority. Zero attached sites in the 14-site central
patch at the width-3 switch occurs with opposite later survival, so it is not a sufficient state
criterion. Actual switch age, geometry, partial fill and solved vapor remain necessary readouts.
This is model-development evidence, not physical identification or grid convergence.

## Frozen roster

The [literal roster](../../evidence/hil-exploration-2026-11-18/registered-roster.json) is the
pre-implementation operand fixture. All cases are unconditional HIL work. Common controls:
N64, dx 0.35 um, target extent 29 (largest coordinate center span 9.8 um), max 100000 complete
updates, M1 base metadata with early-only local basal-width history and no-dip prism,
aggregate-v6, monopole-matched far field, hexPrism, noise 0 / RNG seed 1, residual tolerance
1e-9, divergence tolerance 1e-7, max 200000 relaxation sweeps. Sigma infinity is the existing
temperature water-table value times the stated fraction. No environment events or new operator.
Default seed is radius 2 / thickness 1; normal pressure is 101325 Pa; default CFL is 0.0125.
The fraction/cutoff pairs are **0.05 / 8 seconds** and **0.10 / 3 seconds**. A multiplier applies
to that baseline cutoff, never to solver time or pressure. Widths are 3 and 4 cells throughout.

| Block | Question and explicit factors | New cases |
|---|---|---:|
| A | T -4.5/-5 C; both fraction/cutoff pairs; pressure 50662.5/202650 Pa; both widths; duration multipliers 0.5/1.5/2; default seed | 48 |
| B | Normal pressure, T -4.5/-5 C, both fractions and widths; seeds radius2/thickness3 and radius3/thickness1 at multipliers 1/1.5/2 (48); default seed at multipliers 1.5/2 (16) | 64 |
| C | Normal pressure, default seed; T -3.5/-4/-5.5/-6 C; both fractions and widths; multipliers 0.5/1/1.5/2 | 64 |
| D | All 16 block-C multiplier-1 conditions at CFL 0.00625 | 16 |

A loop order: temperature, fraction/cutoff, pressure half/double, width, multiplier.
B: temperature, fraction/cutoff, seed 2/3 then 3/1, width, multiplier; then all original-seed
extensions in temperature, fraction/cutoff, width, multiplier order.
C: temperature in printed order, fraction/cutoff, width, multiplier. D: temperature,
fraction/cutoff, width. Dispatch four-row chunks round-robin A/B/C/D, skipping exhausted blocks,
so all questions begin early. IDs encode block, temperature, fraction, pressure, seed, width and
cutoff; D is the explicit smaller-step identity. The fixture supplies the complete exact order.
The pre-implementation duplicate check found no identical scientific operand tuples among 192
new rows or against 722 exported rows from 17 named historical roster modules; that scoped scan
is not a claim about every historical experiment ever executed.

## Controls, readouts and outcomes

[Comparison bindings](../../evidence/hil-exploration-2026-11-18/comparison-inputs.json) preserve
24 existing baseline controls with spec/result/events/exit hashes. Reuse them without reruns.
A reuses 16 baseline-duration rows: 8 width-3 op16 and 8 width-4 pc17 rows, at the two pressures.
B reuses 8 normal-pressure original-seed so13 rows. C/D controls are generated within this queue.

- **A:** four complete 16-member cohorts, one per temperature/fraction, crossing two pressures,
  two widths and four durations (new 0.5/1.5/2 plus reused 1). Also show each matched four-duration
  series and each width/pressure pair. Does longer preparation rescue double-pressure openings,
  or shorter preparation suppress half-pressure openings? No result is assumed monotone.
- **B:** four complete 18-member cohorts, one per temperature/fraction, crossing three seeds,
  two widths and three durations. Compare establishment by switch, original-opening survival,
  new post-switch openings and advance after the switch. A wider seed that has not established
  an opening cannot be described as having erased one. Subtract inherited seed span when
  comparing added growth; seed changes alter volume and diffusion as well as width selection.
- **C:** eight complete eight-member cohorts, one per new temperature/fraction, crossing two
  widths and four durations. At baseline duration also compare the six temperatures using the
  eight reused original-anchor normal-pressure controls. Temperature changes both supply-table
  values and kinetic functions; fixed fraction is not fixed absolute supersaturation.
- **D:** sixteen complete two-member CFL pairs at block C's baseline duration. Qualification is
  specific to those operands; it does not certify all durations, seeds or pressure interactions.

For every complete cohort use minimum terminal physical age and its quarter fractions; report
at-or-before event geometry plus next-event alternatives. Keep endpoint size readouts separate.
Use existing cavity/event reconstruction and retained-state readers, changing cohort selectors
only: `out/hil-pressure-analysis-20261118/warm/` and its executed receipt identify the recipe.
Compare named last-active/first-inactive switch states, actual times, central attachment/fill,
selected kinetic demand, solved boundary vapor, original opening survival and advancing tip depth.
The central patch is radius1 at absolute z offsets floor(seedThickness/2)+1. Record absent labels,
missing transitions (including target reached before cutoff), failures, contact stops and step
caps as unavailable for the dependent contrast, not absent effects. Do not silently shrink a
cohort to survivors. Distinguish late new openings from the original switch-time openings.

Pressure changes diffusion in this model while attachment parameters are pressure independent;
this is not a physical pressure law. Pressure times duration is not matched local dose or state.
Same occupancy or an empty center cannot isolate fill/vapor/lag causality. No fitted threshold,
universal law, grid/domain independence, Nakaya explanation or quantitative validation is claimed.
Opposite signed openings are not independent crystals. Occupied sites are not accreted mass.

## Observation retention and restart

Reuse unchanged permanent initial and terminal full states, width-history last-active and
first-inactive full states plus pre-fill solved boundary maps, and central attachment captures.
Age brackets: 1,1.5,2,2.5,3,4,4.5,5,6,8,10,12,16,20 seconds. Spatial extents: 5,9,13,17,21,25.
These are observation settings only. Rolling current/previous checkpoint generations are written
after every completed update; permanent observations survive those rotations. Reuse the November11
real pause/resume and capture witness, existing codec and recorder tests; the contract is unchanged.
No repeat capacity ladder or artificial timeout. In-relaxation interruption repeats at most the
unfinished cycle. Scientific endpoints and solver failure conditions retain their existing meaning.

```
node runner/src/hil-exploration-nov18-main.ts list HIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-exploration-nov18.ps1 -Mode launch -Workers 16
node runner/src/hil-exploration-nov18-main.ts summarize out/hil-exploration-nov18
```

After confirming there are no current writers, resume with the same wrapper and `-Mode resume
-Workers 16`, same producer, Node24.13.1/V813.6.233.17-node.40 and host. The existing coordinator
refills the 16 slots until the finite queue is exhausted; a failed row retains its attempt and
other queued rows continue. No automatic failure retry or automatic extension beyond 192.

Commit/push all source and records before launch and keep main fixed while this queue runs.
Actual command, source, PIDs, logs and first-state checks go in
`out/hil-exploration-nov18-controls/launch-verification.json`; the committed index points there.
Keep labeled coordinator/per-row attempt stdout, stderr and exits. The four fine workers and
producer aa20f96 in the existing hil-oct31-resume-record checkout remain untouched.

## Budget and custody

Use 16 new workers alongside 4 fine workers, total 20. Check actual writers, RAM/commit and disk
before launch, using existing 12GiB available RAM / 8GiB commit headroom / 100GiB disk guards.
No speed probe is needed. Previous pc17 active durations span 5.430823055555556 to
10.596130555555556 hours (16 rows, median 7.665224861111112), as recorded in the analysis.
Their block means are 6.483861493055556 hours at CFL0.0125 and 8.50484295138889 at CFL0.00625.
Using those means for 176+16 jobs would give about 79.8 elapsed hours / 3.3 days with 16 fully
occupied slots. An 8-10-hour average gives 96-120 hours / 4-5 days. These are planning scenarios,
**non-transferable timing estimates**: new temperature, seed, duration, contention and queue-tail
costs are unmeasured. Expect several days, potentially shorter or longer; there is no wall stop.
The 192 cases are selected for the comparisons above, not to manufacture a fixed runtime.

Raw output remains local staging at `out/hil-exploration-nov18/` pending external-evidence
collection `hil-exploration@2026-11-18` under ADR0051/0061 and local-assets standard publication
and fresh-restore procedure. Preserve original producer checkouts and all older output. Track
only compact results, recipes, inventories, hashes and recovery bindings; no bulk Git payloads.
No worktree closure, output pruning or last-copy deletion is part of this launch.

## Verification and source currency

Only a new thin roster, entry, wrapper and boundary tests; shared solver, scientific readout,
checkpoint and recorder remain unchanged. Rule6 verification: independently prepared literal
192-row operands/order and uniqueness; all384 create/resume routes with permanent observations;
worker/host/identity refusals; existing prior roster, batch execution/resume and retained-observation
tests; both typechecks; evidence metadata, Rule7 and diff checks. One bounded non-author review
at the stable interface records model/shared-context status and limits. No full-suite claim.
Rule14A: the plausible accidental failure is copying a wrong operand, identity or observation
route; tests at the existing boundary and literal fixture address it cheaply. No new scheduler,
registry or verification framework. Lessons A1/B1/B2/C3/C6/E5 apply: preserve useful bytes, ensure
named outputs have real producers/callers, compare matched controls and limit interpretation.
The common-age/switch readout has already executed on existing cases; no speculative outcome metric.

November18 bounded source-currency recheck: M1v2 https://arxiv.org/abs/1910.09067 (2019-11-13),
TAX2v1 https://arxiv.org/abs/2306.13087 (2023-06-22), and the author's publication list
https://www.its.caltech.edu/~atomic/publist/kglpub.htm. No superseding adopted mapping identified;
this is not a novelty assessment. Existing parameter provenance and its pressure caveat remain.

## Steps

- [ ] Commit protocol, literal operands, reused controls and latest saved-data analysis.
- [ ] Implement thin entry/roster/wrapper; pass focused checks, both typechecks and bounded review.
- [ ] Commit/push clean producer; launch16 and verify initial states, checkpoints and176 pending rows.
- [ ] Monitor finite queue; classify every endpoint/failure and execute complete comparisons.
- [ ] Preserve bulk output and detailed readouts on NAS with fresh recovery before closeout.

## Out of scope

No fine-grid additions, state swaps, new physical laws, fit to Nakaya, cold sweep merely for
utilization, BLD/GPU/Phase7/S6 work, wall deadline, cleanup or unchanged scientific-failure retry.

## Tried and rejected

- Only80 jobs: at the recent5-11h per case and16 slots this can finish well before4days. Use192
  meaningful cases; do not increase targets or refinement merely to burn time.
- A single Cartesian product across temperature, seed, pressure and duration: too broad to
  interpret; use three finite question blocks and one targeted numerical qualification block.
- Further cutoff bisection or a third width3 timestep halving: current pressure ordering already
  survives the qualification; preparation rescue and transfer are more informative next tests.
- Initial seed matrix deferral in ADR0059/adaptive plan remains correct for its original question.
  Early/late history has now been separated and seed dependence observed; this bounded follow-up
  tests establishment/rescue, without calling seed changes a clean single-variable mechanism.
- Another broad cold sweep: prior seed/pressure controls retained the cold lead; inspect those
  saved fields before choosing a new cold experiment. No repeat just to fill cores.
- New worktree: maker directs main. Advance now because pc17 is terminal; freeze the new producer.
- Rolling restart files alone: insufficient for mechanism analysis; permanent full-state and
  solved-field capture routes are mandatory and unchanged.

## Open questions

Which duration/seed/temperature contrasts survive matched-age and adjacent-event checks? The
finite queue supplies those observations; it does not assume all cases will produce openings.
