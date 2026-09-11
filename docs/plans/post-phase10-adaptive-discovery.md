# Post-Phase-10 adaptive discovery follow-up

**Status:** wave 2 complete; maker resumed 2026-09-08; cavity mechanism/resolution wave selected
**Worktree:** `G:\Code Files\snowflake-science-exploration`
**Branch:** `explore/post-phase10-discovery`
**Base:** `ba99d81`
**Claim level:** exploratory model-development evidence only

## Goal

Spend the available 32-logical-processor host budget on a broad but finite search for new model
behavior, then use the observed structure to choose a small mechanistic follow-up. Phase 7 is not
part of this workstream.

The starting evidence is
`evidence/post-phase10-discovery-campaign-v1/analysis.json` (77,960 bytes, SHA-256
`5c267a01dcdfa04bd0611415812f0a4cd0424a902536c6eb226def815ec04806`). It found:

- opposite M1/no-dip gross-aspect-ratio signs in the warm and cold neighborhoods;
- smooth forcing trends in gross aspect ratio but sign changes/nonmonotonicity in cumulative
  attachment orientation at -24 C/-19 C; and
- material seed memory plus a measurable fill-CFL effect.

## Fixed machinery

Use the existing float64 CPU `LKSolver`, `aggregate-hv-g1h1-v6`, monopole-matched far field,
noise off, RNG seed 1, `hexPrism`, explicit `domainCenter`, `relaxTol = 1e-9`, `divTol = 1e-7`,
`relaxMaxSweeps = 200000`, N48, `dxUm = 0.35`, `cflFill = 0.1`, and target extent 21. Every
supersaturation is `phase6SigmaWaterFromTable(tempC) * fraction`. Each row records the same
per-cycle trajectory and terminal diagnostics as the completed campaign.

No solver equation changes in the first tranche. The only initial runner extension is to make
pressure a row value and add one finite roster to the existing independent-process launcher.

## First tranche: 432 rows

### Temperature/forcing map — 288 rows

Run both `M1` and `M1_NO_DIP_ABLATION` at:

- temperatures `[-2, -3, -4, -4.5, -5, -6, -7, -8, -10, -12, -13, -14, -14.4, -15,
  -16, -17, -18, -19, -20, -22, -24, -26, -28, -30]` C; and
- water-relative fractions `[0.075, 0.1, 0.125, 0.15, 0.2, 0.25]`.

This resolves both printed M1 dip centers (4.5 C basal, 14.4 C prism), the unsampled warm-to-cold
sign transition, and the colder attachment-orientation behavior without repeating the 204-row
Phase 6 endpoint grid.

### Pressure contrasts — 72 rows

At temperatures `[-4.5, -6, -10, -14.4, -19, -24]` C, fractions `[0.1, 0.15, 0.2]`, and both
kinetic arms, run 50,662.5 Pa and 202,650 Pa. The 101,325 Pa comparator is supplied by the map.
Pressure changes the existing physical diffusivity `D(T,P)`; it is not a fitted morphology knob.

### Seed-shape contrasts — 72 rows

At those same six temperatures, three fractions, and two kinetic arms, run:

- plate-like seed radius 3 / thickness 1: 37 sites; and
- column-like seed radius 1 / thickness 5: 35 sites.

Their site counts are close enough to make the signed shape contrast more informative than the
earlier unequal-volume radius ladder. The radius 2 / thickness 1 comparator is supplied by the
map. This remains a measured initialization experiment, not proof of seed independence.

## Execution and first-tranche analysis

- Launch the 432 rows as independent Node processes at recorded concurrency 16. Do not silently
  retry failed rows with changed values.
- Retain raw specs, event JSONL, results, process records, and stderr under one ignored
  `out/post-phase10-adaptive/<campaign-id>/` tree.
- Report terminal and trajectory contrasts, locate M1/no-dip sign transitions, map pressure by
  kinetic-arm interactions, and compare the two near-volume-matched seed shapes both directly and
  against the canonical seed.
- Treat all localization/ranking as exploratory selection. Do not turn the search into a gate or
  quote a selected maximum as a population estimate.

## Longer evaluation loop — maker-expanded 2026-08-28

The completed pilot exposed plausible structure in every lane, and the maker explicitly directed
that even small-chance leads receive longer evaluation. That direction supersedes the earlier
12-condition / 48-row cap; it does not authorize Phase 7 or an unbounded parameter search.

The first long wave repeats all 432 pilot conditions at `N = 64`, target extent 29,
`cflFill = 0.1`, and otherwise identical machinery. Repeating the complete roster avoids selecting
only the most dramatic post-hoc extrema and directly asks whether the temperature/forcing map,
pressure response, and near-volume-matched seed memory persist over a larger domain and more
growth. This is exploratory development evidence, not a domain-independence or convergence claim.

After that wave, continue in finite result-selected waves while any plausible lead remains:

1. `cflFill = 0.05` confirmations at the same N64/extent-29 conditions for sustained, reversed,
   nonmonotonic, or trajectory-only signals;
2. basal-dip-only and prism-dip-only arms at the resolved warm/crossover/cold neighborhoods;
3. longer seed-memory and pressure-by-arm checks wherever the N64 trajectories remain separated;
4. abrupt warm/cold history reversals at a common extent using the existing deterministic
   temperature-conversion path; and
5. a larger domain/extent rung only where N64 remains scientifically ambiguous.

A lead is exhausted when matched longer runs either preserve it with facet/trajectory support,
show that it collapses under the numerical/extent controls, or identify it as initialization or
endpoint-quantization sensitivity. Do not require a large endpoint effect to promote a coherent
trajectory signal, and do not spend a forced allocation after a question has been answered.

## Confirmation wave 1 — pre-registered 2026-09-02

The complete N64/extent-29 wave leaves four distinct questions: a warm-to-cold reversal in the
seed-shape-by-kinetic-arm interaction, a forcing-dependent pressure interaction, an M1-only
sixfold core/tip separation around the prism-dip neighborhood, and open cross-sectional cavities
in the warm M1 columns. Before any confirmation row was launched, the full scientific check showed
that the proposed facet-isolation implementation would change the Phase 9-frozen permanent-control
solver identity. The first confirmation wave was therefore narrowed to the following finite
58-row roster; no
condition may be added after its result is seen:

1. **Seed-transition localization (12 rows):** temperatures `[-7, -8, -9]` C at fraction `0.15`,
   both M1/no-dip arms, and both radius-3/thickness-1 and radius-1/thickness-5 seeds, with
   `cflFill = 0.1`.
2. **Seed timestep control (12 rows):** temperatures `[-4.5, -6, -10]` C at fraction `0.15`, the
   same two arms and two seeds, with `cflFill = 0.05`.
3. **Pressure reversal timestep control (12 rows):** temperature `-6` C at fractions
   `[0.1, 0.15, 0.2]`, both arms, and pressures 50,662.5 Pa / 202,650 Pa, with
   `cflFill = 0.05`.
4. **Pressure persistence controls (12 rows):** temperatures `[-14.4, -19, -24]` C at fraction
   `0.15`, both arms, and the same low/high pressures, with `cflFill = 0.05`. The `-19` C cases
   are the weak/trajectory-sensitive comparator, not a presumed positive result.
5. **Sixfold-topology timestep control (6 rows):** temperatures `[-12, -14.4, -18]` C at fraction
   `0.15`, both arms, canonical seed and pressure, with `cflFill = 0.05`.
6. **Warm open-cavity timestep control (4 rows):** temperatures `[-4.5, -5]` C at fraction
   `0.075`, both arms, canonical seed and pressure, with `cflFill = 0.05`.
Every row remains N64 / target extent 29 with the fixed machinery above except for the one named
factor. Run independent rows at actual process concurrency 32.

Analyze exact first extent crossings and equal plateau age. For morphology, reconstruct occupancy
from the seed plus recorded attachment events and report both the existing metrics and exact
integer-lattice spans/core-to-tip depth. The adaptive angular-bin branch count is supporting
diagnostic evidence only; a transient count of five in an exactly D6h-invariant crystal is metric
quantization, not broken symmetry. A direct terminal comparison is also insufficient when one arm
reaches extent 29 in-plane and the other reaches it vertically.

After this wave, use its results to select only the remaining discriminating work: larger
domain/extent checks for persistent cavity, core/tip, and seed-memory signals; half-timestep checks
for any still-uncontrolled mixed endpoint trajectories; and deterministic warm/cold history
reversals. This ordering does not weaken the maker's instruction to evaluate every plausible lead.

## Confirmation wave 1 result — complete 2026-09-03

All 58 registered rows exited zero from producer head `cb33534e8b50199f394cfc4be028c92ffbd6972a`
at actual maximum concurrency 32. The ignored completion record is
`out/post-phase10-confirmation/campaign-2026-09-02-wave1/confirmation-wave-1-complete.json`
(14,537 bytes / SHA-256
`26a0b5e8ac5b47e310abf9f123120a68574922584638f03adab15bc8e85a1f09`). A direct roster census
found 58/58 exact row directories and exit identities, zero missing, unexpected, duplicate, or
nonzero exits, zero stderr bytes, and 58 admissible size-target results with extent 29, exact D6h
symmetry, converged relaxation, zero integrity errors, the expected Git head, and Node v24.13.1.

The matched conclusions that determine the next wave are:

- The seed-shape-by-arm interaction crosses between -8 and -9 C. Exact first-crossing attached-count
  interactions at extents 21/23/25/27/29 are `42/-114/-76/-532/-1334` at -8 C and
  `2188/2674/4304/6008/6900` at -9 C; equal-plateau comparisons keep the same negative/positive
  separation. At half timestep the warm/cold anchors remain negative at -4.5 C (`-7020` at extent
  29) and -6 C (`-13964`) and positive at -10 C (`7368`). Rough attachments dominate each terminal
  interaction. The sign reversal is persistent; its forcing dependence and sub-degree location
  remain unresolved.
- The -6 C pressure-by-arm interaction retains three forcing regimes at half timestep. Extent-29
  values are `-1484` at fraction 0.10, `-968` after a positive-to-negative trajectory crossover at
  0.15, and `1994` at 0.20. The timestep changes magnitude and crossover age without erasing the
  forcing dependence.
- At fraction 0.15 the half-timestep pressure interaction ends at `1894` at -14.4 C, `658` at
  -19 C, and `1554` at -24 C. The -14.4 and -24 C endpoints nearly reproduce the full-timestep
  `1848` and `1458`; -19 C remains plateau/trajectory sensitive rather than a settled law. Rough
  attachments dominate the terminal interactions.
- At matched central-plane tip radius **and equal exact-tip plateau age**, M1 retains a positive
  sixfold arm-depth contrast: `0.230769...` versus `0.076923...` at -12 C,
  `0.272727...` versus `0.090909...` at -14.4 C, and `0.1` versus `0` at -18 C, giving contrasts
  `0.153846...`, `0.181818...`, and `0.1`. This corrects the earlier zero-depth wording for the
  first two no-dip rows, which did not enforce the registered equal-plateau-age comparison.
  Branch-count bins are not used for this conclusion.
- At both -4.5 and -5 C, fraction 0.075, half-timestep M1 has a 29-layer crystal whose central
  radius-1 seven-cell section is empty in the 24 layers outside a five-layer solid waist. The
  matched no-dip crystal is centrally filled in every occupied layer. This is an open axial-cavity
  occupancy result, not a hole-fill-counter claim.

## Follow-up wave 2 — pre-registered 2026-09-03

Wave 2 is one finite 134-row roster. It spends compute on the surviving leads and the already
identified mixed trajectories; it does not add a generic search or change a solver equation:

1. **Seed-transition timestep (12 rows):** -7/-8/-9 C, fraction 0.15, both arms and both near-volume
   seeds, N64/extent 29, `cflFill = 0.05`.
2. **Seed-transition forcing (16 rows):** -8/-9 C, fractions 0.10 and 0.20, both arms and both seeds,
   N64/extent 29, `cflFill = 0.1`. The existing fraction-0.15 rows are the midpoint comparators.
3. **Seed-transition localization (12 rows):** -8.25/-8.5/-8.75 C, fraction 0.15, both arms and both
   seeds, N64/extent 29, `cflFill = 0.1`.
4. **Mixed-map timestep controls (40 rows):** both arms at the 20 N64/extent-29 conditions whose
   full-timestep M1-minus-no-dip attached-count contrast changes sign between first entry at extent
   21 and first entry at extent 29: `(-4; .15/.20/.25)`,
   `(-4.5; .10/.125/.15/.20/.25)`, `(-5; .10/.125/.20/.25)`, `(-6; .075/.10)`,
   `(-8; .10)`, `(-20; .075)`, `(-22; .15/.20)`, and `(-24; .20/.25)`. Use
   `cflFill = 0.05`; these rows test trajectory persistence, not a generic endpoint score.
5. **Larger domain/extent (46 rows):** N80/extent 37 checks with only domain/extent changed from the
   corresponding confirmed setting: 12 seed rows at -7/-8/-9 C and fraction 0.15 with
   `cflFill = 0.1`; 24 pressure rows at the three -6 C forcings and at -14.4/-19/-24 C, fraction
   0.15, with `cflFill = 0.05`; six topology rows at -12/-14.4/-18 C with `cflFill = 0.05`; and
   four cavity rows at -4.5/-5 C, fraction 0.075, with `cflFill = 0.05`.
6. **Abrupt history reversals (8 rows):** -4.5 C to/from -24 C and -6 C to/from -14.4 C, both arms,
   fraction 0.15, N64/extent 29, `cflFill = 0.1`, with the existing deterministic LK temperature
   conversion applied once after first reaching largest extent 11. Existing static long-wave rows
   are endpoint comparators. Record the exact event boundary and transition report; do not add a
   same-temperature ceremony or duplicate the already tested timeline machinery.

Launch the independent rows at recorded concurrency 32. Exact first crossings, equal plateau age,
matched in-plane topology, and path-versus-static contrasts remain the analysis rules. A later
larger rung is selected only from wave-2 survivors; the 134 rows are not an optimization grid and
their extrema are not population estimates.

## Follow-up-wave implementation record

`runner/src/post-phase10-followup.ts` holds the exact 134-row roster, and the existing independent-
process launcher gained only `list-followup` and `launch-followup`. The eight history rows use the
existing Phase 4 LK timeline evaluator and `LKSolver.applyTimelineEnvironment` once at the first
post-interface-step crossing of largest extent 11; each result records the exact event log and
transition report. Static rows preserve their prior result shape. No `core/` or `solver-cpu/` byte
changed.

Pre-launch checks:

- focused follow-up, confirmation, long-wave, adaptive-roster, and discovery-runner Vitest: five
  files / 20 tests passed in 2.53 seconds;
- `npm run typecheck`: both TypeScript projects passed;
- exact `npm test`: Rule 7 and both typechecks passed; 162/170 test files and 2,516 tests passed,
  with 72 skipped, in 1,230.88 seconds. All 14 failures are the previously recorded Phase 10
  missing ignored recovery-byte and stale frozen-identity failures; the follow-up and other science
  tests passed. This work does not repair or rerun that retired infrastructure; and
- `git diff --check`: passed.

The clean producer commit is `055458abe151ee9324da42f4752ca08ebc314d0f`. The exact campaign
launched once at requested concurrency 32 under
`out/post-phase10-followup/campaign-2026-09-03-wave2`; its campaign manifest records all 134 rows
and the six pre-registered block counts. Do not duplicate or restart this healthy run. Keep the
producer source frozen until every worker is terminal.

## Wave 2 terminal state and numerical repair pre-registration — 2026-09-08

The original launch is terminal. Its ignored completion record is
`out/post-phase10-followup/campaign-2026-09-03-wave2/followup-wave-2-complete.json`
(32,684 bytes / SHA-256
`745bd401e331434ed3bb582f7ac81d80a145a402694851db62254f228f06f92d`). Its exact exit roster
contains 133 zero exits and one nonzero exit at actual maximum concurrency 32. The sole invalid
row is `followup-history-t4p5-to-t24-m1`; its retained 5,873-byte `result.json` has SHA-256
`ca0cc8f90eeabf32e400824c0daf7fc0b8c512a00372657fa20aa9720be81533` and records a solver error
after cycle 137, not a scientific endpoint.

The error compares aggregate-boundary values `1.75599e-317` and `1.7559903e-317`. Their displayed
difference is exactly `Number.MIN_VALUE`, while both the `1e-13` iteration threshold and `1e-9`
postcondition threshold underflow to zero at the row's positive subnormal scale. Requiring exact
equality there is an accidental binary64 condition, not the registered relative convergence rule.

Repair only this observed numerical seam:

1. In the positive aggregate-boundary fixed-point solve, floor each scaled convergence tolerance
   at one positive binary64 ULP, `Number.MIN_VALUE`. Do not alter the equation, damping, iteration
   cap, nonpositive branch, legacy-v3 path, surface policy, or any campaign parameter.
2. Add one focused regression that reaches a positive subnormal aggregate boundary value and
   independently checks the one-ULP residual. Keep the existing nonconvergence refusal intact for
   residuals above the tolerance.
3. Because this changes `solver-cpu/` numerical behavior, run the exact required `npm test` once.
   The already recorded Phase 10 missing-recovery and stale-identity failures are outside this
   repair; do not repair or repeatedly rerun them.
4. Commit the tested solver checkpoint, then rerun only
   `followup-history-t4p5-to-t24-m1` into a new retained directory. Preserve the failed original
   row unchanged. If the rerun is admissible, use it for the matched history analysis; otherwise
   classify the remaining failure by its actual cause.

This repair completes the already launched wave. It does not authorize a new discovery wave; the
maker directed a pause after final Wave 2 analysis and documentation.

## Wave 2 final result — complete 2026-09-08

The repair is commit `60487f597061d7d6f9e452d01c40625ca79db401`. It changes only the two
positive aggregate-boundary scaled tolerances and adds the focused positive-subnormal regression.
The ignored check record is
`out/post-phase10-followup/campaign-2026-09-03-wave2-repair-v1/wave2-repair-checks.json`
(1,013 bytes / SHA-256
`7c6ab050f98a002e38e674c72fa7e5dbf131df20315225c09efcc927ada51b3a`). The focused solver file
passes 41/41 tests. Exact `npm test` passed Rule 7, both typechecks, 161/170 test files and 2,515
tests, with 72 skipped. Its 16 failed tests plus one collection-time suite remain confined to the
recorded Phase 10 unavailable-recovery/stale-identity surfaces and the two expected Phase 9
permanent-control byte refusals for this intentional solver edit; the solver suite passed, and
those historical identities were neither repaired nor rerun.

The selective rerun used only `followup-history-t4p5-to-t24-m1` at concurrency one. Its retained
4,658-byte `result.json` has SHA-256
`a4936f86f2b11d8d4080936aa915430f91b1160b479541e4e08a61e8d457eb98`; it exited zero after
7,287.732 seconds, reached the exact size target at cycle 488 with extent 29, 13,403 attached
cells, aspect ratio `0.9259259259259259`, exact D6h symmetry, converged relaxation, and zero
integrity errors. The original failed row remains unchanged. Combining the 133 original valid
rows with this replacement gives 134/134 admissible endpoints.

The deterministic analysis command is
`node out/post-phase10-followup/campaign-2026-09-03-wave2-repair-v1/analyze-wave2.mjs`. The script
is 25,223 bytes / SHA-256
`bcf1032d3e70b2ea9784997565bd0fae6e5f41fd8491b3742a565b077fc13c84`; two consecutive
executions produced byte-identical output. Its 393,699-byte
`out/post-phase10-followup/campaign-2026-09-03-wave2-repair-v1/wave2-analysis.json` has SHA-256
`83dc597ad20dd58b913f1cbbc6cfd4eac0d63691057b16eae8d883776034f50a` and binds the result and
event-log identities of all 134 Wave 2 endpoints plus the 88 comparison rows it reads.

The artifact-derived scientific classifications are:

- **Seed memory is strengthened as an initialization-by-kinetics interaction.** At N64 and half
  timestep, the terminal seed interaction is `-8756`, `+214`, and `+6768` at -7/-8/-9 C. At full
  timestep the localized sequence is `-1334`, `+2174`, `+4420`, `+7294`, and `+6900` from -8 to
  -9 C in 0.25 C increments. The N80 exact-crossing sequences from extents 29 through 37 end at
  `-20700`, `-2318`, and `+14908` at -7/-8/-9 C. The large signs persist with scale, while the
  neighborhood near -8 C moves with timestep, forcing, and domain: it is a real model memory
  effect with a sensitive crossover, not endpoint quantization or a fitted physical transition.
- **The 20 mixed trajectories resolve chiefly as growth-stage sensitivity.** Every warm half-step
  row from -4 through -6 C is negative by extent 29; the -8 C control is weakly positive; and the
  -20/-22/-24 C rows retain late negative-to-positive reversals. Half timestep preserves those
  families but changes their magnitude and crossing age, so a single terminal map is not a stable
  law.
- **Pressure remains a trajectory lead, not a monotone pressure law.** At -6 C, the N80
  low-minus-high pressure interaction ends at `-2826`, `+1430`, and `+3260` for forcing fractions
  0.10/0.15/0.20; the midpoint changes from `-920` at extent 29 to `+1430` at extent 37. At
  -19 and -24 C the sign stays positive across all five N80 crossings but ends at only `+454` and
  `+84`; -14.4 C oscillates and ends at `+52`. The response is forcing- and growth-stage-dependent.
- **The core/tip morphology survives the larger rung.** At N80, equal-age comparisons at common
  central-plane tips 16/14/12 give M1 versus no-dip depths `0.25/0.0625`,
  `0.214285.../0`, and `0.083333.../0` at -12/-14.4/-18 C. The corresponding contrasts
  `0.1875`, `0.214285...`, and `0.083333...` remain positive. The corrected N64 equal-age
  contrasts are `0.153846...`, `0.181818...`, and `0.1`; therefore the lead is not an angular-bin
  artifact, although its lattice-scale magnitude is not a continuum estimate.
- **The warm axial cavity is the strongest scale-persistent occupancy lead.** At both -4.5 and
  -5 C, each N80 M1 crystal has 37 occupied axial layers: 32 have an empty central radius-1
  seven-cell section and only offsets -2 through +2 are full. The no-dip crystals have 15 and 17
  occupied layers respectively, all centrally full. This reproduces the N64 five-layer M1 waist
  at greater extent and is not inferred from the hole-fill counter.
- **Abrupt histories establish deterministic path dependence.** For the repaired -4.5 to -24 C
  direction, the no-dip-minus-M1 history-uplift interaction across exact extents 21/23/25/27/29 is
  `146/926/832/1170/1136`; equal-age values are `772/1262/1182/1634/1136`. The other three
  directions also differ from their static destination controls, with sign and magnitude depending
  on direction and growth stage. This is path dependence in the implemented model, not physical
  validation.

Wave 2 therefore produced several real experimental-model leads rather than a null result. It
strengthens the axial cavity, core/tip, seed-memory, pressure-trajectory, and history effects while
also explaining why endpoint-only pressure and mixed-map summaries are unstable. A mechanistic
facet decomposition would require a deliberately separate future model-change experiment; it is
not smuggled through the test-only override or the Phase 9-frozen permanent-control identity.

Per maker direction, stop here. No worker remains active and no further campaign is authorized.
When the maker resumes, review this result and choose the next bounded mechanistic question before
launching any long run. Do not touch Phase 7 or revive Phase 10 recovery.

## Scientific review and resumed cavity experiment — 2026-09-08

The maker explicitly resumed discovery and requested a scientific reassessment. This supersedes
the pause above, not Phase 10's closure or Phase 7's independence. This is solo scientific
research: deliberate hostile actors are outside scope, and this block must deliver a cavity
mechanism/resolution experiment rather than another assurance framework.

**Course correction.** Phase 10 established source/mapping and numerical-verification limits;
its complete-negative result did not test or exhaust candidate growth mechanisms. Post-Phase-10
trajectories supply useful implementation-level leads, but repeated M1/no-dip sweeps cannot
establish the width feedback that M1 does not implement (`docs/attachment-kinetics.md` §3).
The abandoned facet factorial remains scientifically useful: the old permanent-control source
pin rejected its implementation route, not its hypothesis. A future separately named experimental
arm must preserve the controls and the coupled boundary/fill law; the test-only override is not
that route. Do not reopen S6 or modify historical Phase 9 identities to make this review green.

**Interpretation corrections.** Larger N and growth extent at unchanged spacing are not mesh
refinement. The Wave 2 analyzer's equal plateau age means equal interface-cycle offset, not
equal physical time. Its topology sentence saying magnitude weakens with scale conflicts with
its own positive contrast increases at the first two temperatures. Its blanket cold mixed-map
reversal summary also has an exception: the -24 C / fraction 0.20 half-step sequence is positive
at every recorded crossing. Preserve the existing analysis bytes as the original working
analysis; these qualifications supersede those interpretation strings. Central empty pixels
alone do not prove a hollow tube: check lateral enclosure as well as axial opening.

The named source hypothesis is diffusion-induced center/rim supersaturation contrast amplified
by nonlinear attachment (`docs/attachment-kinetics.md` §2). Initial seed geometry and the P4
nearest-neighbor closure are competing explanations. Current per-facet summary telemetry loses
spatial association, so add sparse raw boundary snapshots, not a new solver or metric framework.

### One finite 20-row cavity wave

Cross temperatures -4.5/-5 C and M1/no-dip with these five configurations, all at water-relative
fraction 0.075, pressure 101325 Pa, fill-CFL 0.05, and the unchanged fixed machinery:

| Configuration | N | dx (micrometers) | Seed radius/thickness | Target extent |
|---|---:|---:|---:|---:|
| Spatially observed baseline | 64 | 0.35 | 2 / 1 | 29 |
| Thickness-only perturbation | 64 | 0.35 | 2 / 5 | 29 |
| Radius-only perturbation | 64 | 0.35 | 3 / 1 | 29 |
| Fine grid, thin seed bracket | 126 | 0.175 | 4 / 1 | 57 |
| Fine grid, thick seed bracket | 126 | 0.175 | 4 / 3 | 57 |

N126 is intentional: the even-N hexPrism shell radius is N/2-1, giving the same shell-coordinate
radius, `31*0.35 = 62*0.175` micrometers. Target center spans match through
`(29-1)*0.35 = (57-1)*0.175`; inclusive cell-envelope spans do not. Fine seed center-support
radius matches the baseline, but the voxelized seed geometry/volume is not identical. The two
fine axial thicknesses bracket the baseline's physical thickness; nonlinear outputs are NOT
mathematically bounded by those two runs. This is a spacing/initialization discrimination, not
a convergence-order estimate or continuum-validation gate.

The baseline repeats are specifically for new spatial observations and comparison under the
current subnormal repair, not replacement of historical rows. Reuse existing N64/N80 cavity
trajectories at common extent 29 for a same-dx domain-sensitivity comparison. Do not add a new
pressure sweep yet: the retained seed observations already make initialization the more immediate
competing explanation.

Record raw boundary coordinates, neighbor counts, facet class, sigmaBoundary, sigmaOpp,
alphaHKBoundary and fill once after converged relaxation and before surface advance at the first
pre-update extent reaching each of 5/9/13/17/21/25 (fine: 9/17/25/33/41/49). Include actual cycle,
physical time, extent, spacing and seed; these snapshots are not terminal post-growth fields.
Keep snapshotting optional so all old rows and numerical trajectories stay unchanged.

Compare axial and lateral center spans, occupied-cell volume (not total ice mass), per-layer
central occupancy, lateral enclosure, axial opening, solid-waist thickness and cavity/rim profiles
in physical units. A central-radius probe uses the same physical radius (coarse r1, fine r2).
Compare both common physical size and common physical time; bracket discrete events rather than
invent interpolated occupancy. Inspect basal center/rim field and kinetic contrast before cavity
onset. If no registered snapshot brackets onset, report that temporal limit rather than infer
the missing precursor. Strong seed dependence or a waist fixed in cell units weakens a
size-selected physical interpretation; persistence in physical units across both seed brackets
strengthens the lead but does not identify physical SDAK. Missing curvature, latent heat and
width feedback remain explicit model limitations.

**Execution/checks.** Commit this amendment before implementation. Reuse the existing finite
launcher at requested concurrency 28 (actual maximum 20 independent rows; do not pad the roster).
Maker direction on 2026-09-08 caps combined experiment/test workers at 28 and authorizes autonomous
finite follow-ups while the maker is away; routine experiment decisions do not wait for approval.
Implement only the roster/CLI route and optional raw snapshots. Focused tests must check physical
matching arithmetic, snapshot timing/content, and identical numerical output with snapshots on/off.
Run both typechecks and Rule 7, then exact `npm test` once at the stable scientific-telemetry
checkpoint; report the already known historical failures without repairing or looping them.
Commit the tested producer before background launch; retain per-row stdout/stderr/exit records.
The original next decision was the cavity/seed/grid result and then a separate facet-factorial
design. The bounded overlap amendment below now separates model-level intervention from pending
grid qualification; neither is an automatic broad sweep. Compact report/source preservation remains due before publication;
the older adaptive raw `out/` collections are retained working data, not a durable archive.

Review provenance: root and three non-author Astra agents shared conversation context. The bounded
reviews covered charter/source scope, actual analysis semantics and selected raw trajectories,
and the dimensionless/grid design. No reviewer reran the historical campaigns, established
continuum accuracy, acquired external sources, or validated the model against nature.

### Cavity implementation checkpoint

The finite roster and `list-cavity`/`launch-cavity` route are implemented. The launcher now rejects
requests above 28; all previously 32-worker live defaults are 28. Historical launch records remain
unchanged. Optional `spatialSampleExtents` records accepted pre-update boundary values without
changing the solver or the existing event calculations. The exhaustive long-wave lane map has only
the new non-long lane exclusion added.

`npx vitest run runner/test/post-phase10-spatial.test.ts runner/test/post-phase10-cavity.test.ts
runner/test/post-phase10-discovery.test.ts runner/test/post-phase10-followup.test.ts` passed four
files / 17 tests. The spatial test independently reconstructs the pre-update occupancy and neighbor
counts, recomputes the kinetic coefficient within the nonlinear solve tolerance, and checks exact
numerical event equality with snapshots off/on. `npm run typecheck` and `git diff --check` pass.
One bounded non-author Astra review independently listed the old/new rosters and checked spatial
timing, physical matching arithmetic and concurrency; it found no blocker. It did not run the full
suite or a campaign.

The single exact `npm test` finished with exit 1: Rule 7 is clean across 1,529 files, both
typechecks passed, and Vitest reports 163 passed / 9 failed files, with 2,521 passed / 16 failed /
72 skipped tests in 1,242.03 seconds. All six new cavity/spatial tests pass. The failure roster
matches the already recorded Phase 10 unavailable recovery bytes/stale identities plus Phase 9's
two historical source-pin refusals from the earlier subnormal repair; the Phase 10 scope overlay
also has its existing collection-time failure. No new failure was found. The suite is not green.
Command, timing and exit are recorded by
`out/post-phase10-cavity/checkpoint-2026-09-08/run-check.ps1` in that directory's
`npm-test-exit.json`; full stdout/stderr are in `npm-test.log`. Do not repeat this check or repair
the retired infrastructure.

The tested producer is `eb7b5c4f932939e3b40d686a996796fdaceb1894`. From that clean head, the exact
command `node runner/src/post-phase10-discovery-main.ts launch-cavity out/post-phase10-cavity/campaign-2026-09-08 28`
launched once through a hidden background Node process. Its parent PID is 13768. The launch log
records all 20 workers active, and a direct process census confirms 20 live worker children; all
20 row specs and host records exist and name the same producer head. Requested concurrency is 28,
actual startup concurrency is 20. This is launch evidence, not completed scientific output.

Campaign metadata and the exact per-row commands are under
`out/post-phase10-cavity/campaign-2026-09-08/`; parent stdout is
`out/post-phase10-cavity/campaign-2026-09-08.launcher.log` and parent stderr is the corresponding
`.launcher.stderr.log`. Each row owns `stdout.log`, `stderr.log`, `status.json`, and terminal
`exit.json`/`result.json`; the launcher will write `cavity-wave-1-complete.json` after all exits.
Do not duplicate the launch, rerun a live row, or change the running producer. Next build the
bounded offline occupancy/spatial analysis described above while these workers run, then analyze
completed configurations without promoting partial results into an all-row conclusion. Keep new
analysis code separate from the running worker's imports, and keep total experiment/test workers
at or below 28. The finer rows determine the long tail; no unmeasured ETA is asserted.

The offline analyzer is now implemented in `runner/src/post-phase10-cavity-analysis.ts`, with
pure geometry and spatial helpers beside it. It is not imported by the experiment producer.
The focused command `npx vitest run runner/test/post-phase10-cavity-analysis.test.ts
runner/test/post-phase10-cavity-geometry.test.ts runner/test/post-phase10-cavity-spatial.test.ts
--maxWorkers=1 --minWorkers=1` passes. Manufactured fixtures independently exercise enclosure
versus separated arms, transient disappearance and reopening, physical-time event brackets,
center-span overshoot, fixed-physical probes, snapshot timing, and mean cellwise kinetic demand.
The first implementation typecheck and `npm run lint:rule7` pass; the single exact `npm test`
at this new scientific-readout checkpoint is recorded below. Do not repeat the producer checkpoint.

One bounded read-only non-author review found no scientific-correctness blocker in these modules,
including enclosure-episode tracking. The basal rim is the outermost basal-class ring in one
plane/orientation group, not necessarily the entire physical growth rim or one connected facet.
An enclosure episode means at least one laterally enclosed center-air layer remains present;
it does not assert that the same cavity component survives. An open terminal episode is observed
only through the stop. These distinctions are needed because the retained trajectories contain
transient pockets as well as persistent-through-stop hollowing; quantified retrospective findings
will cite the generated report rather than this working observation.

Analysis source checkpoint `8c537638534ec79fa90ce8e2b3bf3899f3097783` is committed. The single
required exact `npm test` for this new readout code has finished, exit 1. Its wrapper
`out/post-phase10-cavity/analysis-checkpoint-2026-09-08/run-check.ps1` records source head,
command, timing, exit and worker counts in `npm-test-exit.json` (413 bytes, SHA-256
`b58e9d35e60600bc23590f8a4cc01d5d57663111f1da3d3e02fd97b651eb355d`). The log is `npm-test.log`
beside it (271,676 bytes, SHA-256 `b865298792b59af0fc6d95d64334e0774e1450be82fac7a7b9dc4012c6dd3cd7`).
It ran from 2026-09-08T14:55:46.1654491Z to 15:55:03.3827727Z; Vitest reports 3,503.23 seconds.
Actual launch census was 20 experiment workers plus one configured Vitest worker, below the
maker's 28-worker cap. The supervisor and test worker have exited; the experiment workers remain live.

The log reports 163 passed / 12 failed files and 2,535 passed / 20 failed / 72 skipped tests,
with one unhandled worker-RPC timeout. Rule 7 is clean across 1,535 files and both typechecks pass.
All 18 new offline-analysis tests pass (7 trajectory, 6 geometry, 5 spatial), as they did in the
separate focused run. The prior producer cavity/snapshot tests also pass.

The previous historical failure roster is still present. The additional failures are three
`app/test/phase4-verify.test.ts` visual IPC waits at 15 seconds, one
`runner/test/phase10-c0v-s6-authority.test.ts` test at 300 seconds, and the
`runner/test/phase10-intake.test.ts` cleanup hook at 10 seconds; the last adds a failed file,
not a failed test. Vitest also reports `Timeout calling "onTaskUpdate"`. These are observed
timeout failures outside the new analysis modules, not demonstrated analysis regressions.
Concurrent execution load is a plausible contributor, not a proven sole cause. The full suite
is not green and the RPC error limits global assurance. No timeout was widened, no historical
identity was repaired, and no full-suite retry is warranted for this bounded exploratory analysis.
Do not duplicate this suite or use these failures to reopen retired infrastructure.

The retained retrospective report is
`out/post-phase10-cavity/retrospective-cavity-2026-09-08.json` (714,050 bytes,
SHA-256 `b11e432a88e90f54a79cd119b5678fe6c347b2107534f2b016e24d59bcc39738`). Its provenance
records the exact `rows` CLI command, clean analysis head above and Node v24.13.1; its source
identities name each old N80 cavity row's spec, events, result and exit. This is retained working
analysis, not a durable evidence publication or validation gate. Reproduce with
`node runner/src/post-phase10-cavity-analysis.ts rows <new-output.json> <the four row directories named in report.provenance.command>`.

The report gives the following scoped development observations (all numbers below copied from it):

- Both M1 rows have an early transient enclosed pocket, followed by an enclosure interval beginning
  at cycle 46 (3.9033450867704653 seconds at -4.5 C; 3.733385643838883 seconds at -5 C) that remains
  present through the retained stop. Each terminal has 30 laterally enclosed center-air planes and
  a five-plane probe-full waist, with 1.75-micrometer inclusive thickness. This does not establish
  persistence of one cavity component or future permanence.
- No-dip has seven and eight separate transient enclosure intervals respectively, but none at
  either terminal. Therefore first cavity onset alone is not the discriminating observable.
  The terminal probe-full waists are 15 and 17 planes respectively.
- At the common 9.8-micrometer center span (extent 29), M1 has 22 enclosed planes in both rows;
  no-dip has none. At common physical times 67.94889167720417 and 63.125546530422454 seconds,
  M1 has 30 enclosed planes while the respective no-dip sampled states have zero and two.
  The latter is a transient pocket, not an exception to its no-cavity terminal. The no-dip samples
  are cycle 613 at 67.81834481805937 seconds and cycle 604 at 63.07718325451535 seconds, with their
  next-event brackets retained; no occupancy interpolation is used.

This sharpens the lead to persistent-through-stop hollowing versus repeated transient layer
closure, rather than cavity appearance versus no cavity ever. It does not distinguish physical
feedback from seed/grid/P4 closure effects. Those are the purpose of the running finite wave;
the old rows have no raw spatial snapshots and cannot supply the missing field precursor.

### Consolidated coarse-grid result

All 12 coarse-grid rows completed with admissible size-target stops, reported symmetry error zero,
converged relaxations and no recorded integrity errors. Their consolidated analysis is
`out/post-phase10-cavity/coarse-cavity-comparison-2026-09-08.json` (2,411,492 bytes, SHA-256
`d2626add2e42f203a797872147b22645a0574fef0f5ea63b606ea5c253dbf6e0`). It was generated from clean
`4876e42` using `node runner/src/post-phase10-cavity-analysis.ts rows` with that output and the
sorted 12 non-fine row directories under `out/post-phase10-cavity/campaign-2026-09-08/rows/`.
The exact expanded argv, source and input identities are inside. The fine-grid rows are excluded,
not treated as failures or completed evidence. Earlier scoped reports below retain their own
supplied-row common-age grids; this complete coarse comparison uses one shared age per temperature.
These files remain local working evidence under `out/`, not a claimed durable archive or publication.

At extent 29, the shared maximum lattice-coordinate center span is 9.8 micrometers. It is axial
for M1 and in-plane for no-dip, not matched axial length, age or full shape. The terminal findings
are as follows; every paired entry is **M1 / no-dip** and waists use the fixed physical hex probe.

| Temperature / seed | Attached sites | Full-probe waist planes | Enclosed center-air planes |
|---|---:|---:|---:|
| -4.5 C / baseline | 5369 / 6041 | 5 / 11 | 22 / 0 |
| -5 C / baseline | 5417 / 7135 | 5 / 13 | 22 / 0 |
| -4.5 C / thick | 4161 / 8637 | 9 / 15 | 18 / 0 |
| -5 C / thick | 4173 / 9323 | 9 / 17 | 18 / 0 |
| -4.5 C / wide | 5987 / 6041 | 5 / 11 | 22 / 0 |
| -5 C / wide | 6017 / 6041 | 5 / 11 | 22 / 0 |

Each M1 history has an early transient enclosure interval followed by an interval continuing
through its stop; each no-dip history has five or six transient intervals and none continuing
through stop. The coarse seed perturbations preserve this arm-associated persistence contrast,
not seed-independent cavity dimensions. All six M1 waists add four full-probe planes beyond their
seeds. No-dip baseline/thick pairs also retain the seed-thickness difference: both add ten planes
at -4.5 C and twelve at -5 C; the wide -5 C seed adds ten. These are measured finite-run patterns,
not universal layer laws or evidence that initial geometry has been forgotten.

Shared terminal ages for the coarse groups are 37.6854893744537 seconds at -4.5 C and
36.120990698827114 seconds at -5 C. Every M1 row has enclosed sections at the four positive
sampled fractions of its group's shared age. No-dip is not uniformly cavity-free at those times:
wide -4.5 C has two enclosed planes at the three-quarter sample, and thick -5 C has two at the
final common-age sample. The latter is cycle 361 at 36.07881206207073 seconds, bracketed by
cycle 362 at 36.1571215680336 seconds with unchanged occupancy; its transient ends at cycle 364 /
36.31374116317927 seconds. It does not survive to terminal. A shared-context Astra agent independently
reconstructed the four new baseline/thick no-dip endpoints and their common-age samples from
seed plus events. The distinction remains persistence/closure, not absence of any cavity.

The spatial data do not isolate initiation. Initial same-plane basal rim demand exceeds center
demand in both arms; most post-initial M1 same-plane comparisons are unavailable because geometry
has separated the exposed regions. No-dip also shows geometry-dependent reversals: the baseline
-5 C cycle-60 and thick -4.5 C cycle-62 snapshots have negative paired rim-minus-center demand on
their new upper basal planes. These are comparisons within sampled planes, not interventions or
integrated deposited growth. Missing pairs are not zero center demand.

**Grid-qualification decision:** let the eight existing fine-grid cases finish, then compare
persistence and added waist thickness beyond the seed in micrometers, with the registered seed
brackets. The coarse four-layer addition is 1.4 micrometers; at the fine spacing four layers would
be 0.7 micrometers and eight would be 1.4. These illustrate distinguishable cell-scale versus
physical-scale outcomes, not predictions or nonlinear bounds. The factorial below asks which
basal/prism dip intervention changes transient closure into persistence in the current discrete
model. It localizes global kinetic preparation, not width feedback. A strongly cell-locked fine
result prioritizes understanding the discrete closure before physical interpretation.

### Bounded overlapping facet-isolation experiment — 2026-09-09

This prospectively supersedes the earlier wait-for-fine/no-coarse-only-launch instruction.
The completed coarse report named above supplies a model-level contrast worth isolating now;
fine qualification remains necessary before a grid-robust interpretation. The maker delegated
finite follow-ups and a maximum of 28 combined experiment/test workers. Root and a bounded
shared-context Astra design review agree that these two questions need not execute serially.

**Goal:** identify the effects of the basal and prism dip interventions on persistence/closure
within the present discrete operator. No new physical law, width feedback or validation claim.

**Finite protocol:** four new rows, basal-only and prism-only at each of -4.5 and -5 C.
Use exactly the corresponding cavity-baseline settings: N64, dx 0.35 micrometers, seed radius 2 /
thickness 1, fraction 0.075, pressure 101325 Pa, fill-CFL 0.05, target extent 29; retain all
convergence tolerances, maximum steps/sweeps, noise/seed, aggregate-v6, monopole-matched shell and
spatial snapshot extents. Reuse only the four completed `cavity-baseline-*` M1/no-dip controls,
not the seed/grid variants. Those numerical inputs are the existing `spec.json` records under
`out/post-phase10-cavity/campaign-2026-09-08/rows/`; the new roster derives from that baseline
constructor, not a new sweep. Four corners per temperature share physical-size and common-age
analysis with event brackets. Extent 29 is not equal axial length or equal age across arms.

**Implementation/checks:** decision 0055 and the solver spec define a finite constant preparation
opt-in. Commit this protocol before implementation. No arbitrary callback, numerical kernel
refactor, new checkpoint format or copied solver. Require nontrivial ordinary/both and
ordinary/neither bit equivalence for field, fill, occupancy, physical time and ledger, including
attachment. Independently check hybrid facet preparation and its shared Robin/fill use. Add only
needed runner identity/roster and analyzer labels; existing geometry analysis stays unchanged.
Use focused checks, then exact `npm test` once for this new scientific-code checkpoint, reporting
known historical failures separately. Commit tested source before launch. Existing fine workers
continue with producer `eb7b5c4`; their code/protocol identity is not relabeled to the new producer.

**Observations and done when:** all four new rows have a terminal disposition and the eight-row
four-corner report records enclosed-plane counts, straight-axis opening witnesses, enclosure
episodes and duration through stop, waist addition beyond the seed, and matched size/time
trajectories. Use the existing size-target, domain-contact, nonconvergence, solver-error, stall
and step-cap stops; do not extend inconvenient results. Basal-only resembling M1 with prism-only
resembling no-dip supports a basal intervention explanation here; the reverse supports prism.
If both persist, either isolated intervention can produce persistence under these conditions;
if neither persists, the combination is required among these four configurations only. Keep
intermediate/transient effects rather than force a binary verdict. Examine this result before
adding temperatures, seeds or longer hybrids. Control reuse is conditional on equivalence;
resolve any mismatch before launch, not by silently accepting altered controls.

**Deliberately not done:** no Phase 7, C0V recovery, physical necessity claim, new grid sweep,
hybrid long-run expansion or infrastructure framework. Eight fine plus four new experiment
workers use 12 of the allowed 28; do not pad the roster to occupy cores.

**Implementation checkpoint:** the finite preparation option, four-row roster/CLI, and explicit
artifact/effective-arm labels are implemented. The ordinary preparation call and all numerical
update loops remain unchanged. The cavity analyzer now distinguishes configuration-matched
four-corner groups while retaining its existing geometry/time calculations. A bounded non-author
solver review found no blocker; it checked this diff, not old gates or physical validation.

`out/post-phase10-facet-factorial/checkpoint-2026-09-09/focused-tests.log` records five files /
30 tests passed with:

```text
npx vitest run solver-cpu/test/lk-facet-dips.test.ts runner/test/post-phase10-cavity-analysis.test.ts runner/test/post-phase10-facet-factorial.test.ts runner/test/post-phase10-spatial.test.ts runner/test/post-phase10-discovery.test.ts
```

Those include ordinary/both and ordinary/neither byte equality through attachment at both warm
anchors, independent hybrid kinetic-law/Robin/fill checks, ordinary snapshot invariance, and
eight-row/two-quartet identity/time matching. An initial hybrid test incorrectly demanded bit
equality after the operator's final nonlinear Robin evaluation; only that assertion was corrected
to a tolerance check, with no numerical-code change. Both typechecks passed before the final
runner fixture landed; exact `npm test` below covers the final stable source. Rule 7 and
`git diff --check` passed. Do not describe these focused results as a full-suite pass.

The one exact `npm test` is complete, not green. It ran from 02:53:27 to 03:22:52 UTC with
numerical implementation `1298912253971e9aaf1c14d3ddff3a1e22878d11`, one test worker and eight
experiment workers. The exit record reports exit 1. The log reports 167 passed / 10 failed files,
2,554 passed / 17 failed / 72 skipped tests, and 1,738.41 seconds for Vitest. Rule 7 and both
typechecks pass, as do all 30 tests in the five focused files. No unhandled error or timeout is
reported in this check.

The failures are the nine already recorded historical Phase 9/10 files plus the Phase 9 M-GT
frozen-specification identity test. The added failure rejects the intentionally extended LK spec;
it is not a numerical failure. The other failures retain their source/registry/line-ending pins
and missing retired S6 local files. Do not repair those histories or repeat this completed check.
Documentation-only findings/decision 0056 landed while it ran: numerical source stayed unchanged,
but the old fingerprint tests observed two doc revisions. The start head is not a claim that
the entire documentation tree stayed frozen. Those prose changes received separate Rule 7 checks.

All check records are under `out/post-phase10-facet-factorial/checkpoint-2026-09-09/`:
`npm-test.log` is 235,152 bytes, SHA-256
`3eca3834148e32ce19cd4a9f54326c036b85173e3e6a60dddfe7b01653578386`;
`npm-test-exit.json` is 412 bytes, SHA-256
`a41cb649145f7e73405321da3db6952394865c75796d484bcbef1cfb9f0d1413`.
Supervisor 34632 has exited. The check is accounted for; launch once:

```text
node runner/src/post-phase10-discovery-main.ts launch-facet-factorial out/post-phase10-facet-factorial/campaign-2026-09-09 4
```

The command launched once under clean producer `a69240b329874ee8c39412d78a9320574418d2f7`.
Parent PID 4416 and its four worker children were confirmed live; host records name that producer
and specs identify each explicit facet arm. Requested and actual startup concurrency are
four; combined with eight fine workers, actual experiment concurrency is twelve. Read
`out/post-phase10-facet-factorial/campaign-2026-09-09.launcher.log`, its `.launcher.stderr.log`,
and per-row status/exit/results. Do not duplicate this launch. Keep the eight fine workers
running; the maker reiterated autonomous run/task management within the 28-worker ceiling.
Analyze the four facet row directories together with the four `cavity-baseline-*` controls
using the existing cavity analyzer's `rows` command; do not use the old two-arm discovery report.

### Geometric closure hypothesis — retained-event finding, 2026-09-09

The maker explicitly encouraged additional reasonable hypothesis-driven experiments, with no
guaranteed outcome or deadline. A distinct candidate is the geometric hole-fill rule, which every
existing run and the dip factorial retains. This is a model-closure question, not another scalar
timestep rung; warm cavity controls already compared fill-CFL 0.1 and 0.05.

Root independently reconstructed the four N64 baseline histories and four retained N80 cavity
histories after a bounded Astra agent identified the N80 attribution. The report
`out/post-phase10-cavity/axis-holefill-attribution-2026-09-09.json` is 27,697 bytes, SHA-256
`f30e3acc6eb3794620262a03df5407be5a72f80b31a076edf4ffc4e0b53c135d`.
Its source identities include the exact spec/result/events and the standalone analysis script;
reproduce with `node out/post-phase10-cavity/inspect-axis-holefill.mjs <new-output.json>`.

At both temperatures and both sizes, each M1 history adds four center-axis sites, all by
geometric hole filling. N64 no-dip adds eight geometric plus two kinetic axis sites at -4.5 C,
and ten geometric plus two kinetic at -5 C. N80 no-dip adds twelve geometric plus two/four
kinetic at -4.5/-5 C. Every reconstructed event count and summed hole-fill count matches its
retained result; no axial attribution remains underdetermined in these rows.

This is not inferred from the rough-facet label: reconstruct the pre-update predicate on all
attached sites. When the eligible attached count equals the recorded hole-fill count, all those
eligible attachments are geometric; zero recorded hole filling identifies kinetic completion.
Other eligible cases would remain underdetermined. Attribution concerns the final attachment
step, not all earlier partial fill, and does not establish the counterfactual morphology.

**Selected next hypothesis:** forced geometric completion materially controls no-dip resealing
and/or M1 waist growth. After the current facet verification/launch, implement a separately named
hole-fill-off diagnostic under its own small contract amendment. Run four new rows: ordinary M1
and no-dip at each warm anchor, matching the N64 cavity-baseline settings and reusing those four
controls. Preserve rough-site kinetics, Robin/fill coupling, kinetic saturation, monopole lag and
timestep; disable only geometric completion. Compare enclosure episodes, straight-axis opening
witnesses, waist addition and matched physical size/time. Distinguish open multi-plane cavities
from isolated sealed vacancies. Off is a diagnostic counterfactual, not an improved physical
model: a result consisting only of artificial trapped lattice voids does not support the open
cavity mechanism. A preserved contrast, delayed resealing, loss of contrast or broader outline
change each informs the next hypothesis. Do not combine this intervention with the dip hybrids
in its first wave.

**Implementation protocol (decision 0056):** commit this amendment before building. Use the finite
`experimentalHoleFilling` enabled/disabled opt-in and a separate experiment identity; old formats,
ordinary behavior and all running numerical processes remain unchanged. Enabled-versus-ordinary
equivalence must include a genuine geometric completion, not only an initial fixed point. In a
matched enabled/disabled witness, independently show identical pre-event field, kinetic demand
and timestep, with only the enabled side performing geometric completion; disabled keeps kinetic
growth active and its geometric count/deficit zero. Preserve symmetry with a nontrivial growth
test. Extend only the finite roster/launcher and necessary analysis identity; no generic plugin
system, checkpoint format or solver copy. Run focused checks and one exact `npm test` at the new
scientific-code checkpoint, recording old failures without repairing them. Do not change the
numerical source under the currently running facet check; its check/launch comes first.

**Finite execution and done when:** four new disabled rows use the exact `cavity-baseline-*`
configuration for their temperature and parameter set, including extent 29, fill-CFL 0.05 and
the existing spatial samples, convergence controls and stopping rules. Reuse the four enabled
ordinary controls after equivalence. Completion requires terminal dispositions plus matched
eight-row cavity/waist/time analysis with hole mode explicit. Record local vacancy versus open
cavity limitations rather than silently promoting all empty-center sections. Analyze this first
comparison before adding a seed, temperature or long-extent extension. With eight fine plus four
dip plus four closure workers, planned experimental concurrency is sixteen, below the combined
28-worker cap; actual running counts still govern launches.

**Implementation checkpoint:** the finite switch now skips only the existing geometric-completion
loop; ordinary/enabled evolution, kinetic growth and all other update calculations are retained.
The runner derives the four disabled rows directly from the baseline configurations and propagates
their separate identity. The analyzer matches enabled/disabled quartets and reports straight-axis
opening witnesses without equating absence of that witness with general three-dimensional sealing.
A bounded non-author review found no additional blocker.

Focused command outputs are transcribed in
`out/post-phase10-holefill/checkpoint-2026-09-09/focused-observations.json`: the initial solver check
passed six tests and failed two no-dip fixtures because their assumed forty-cycle horizon preceded
geometric completion. Extending only those fixture horizons to eighty cycles made both pass,
including byte equality and positive geometric count/deficit; no solver change followed the test
failure. Runner and analyzer focused checks passed six and fourteen tests respectively. These
are focused results, not a full-suite pass. Commit this checkpoint and run one exact `npm test`
with the existing single-test-worker configuration, recording its log and exit under the same
directory. Keep source and documentation frozen during that check. After accounting for its
results, launch once with:

```text
node runner/src/post-phase10-discovery-main.ts launch-holefill out/post-phase10-holefill/campaign-2026-09-09 4
```

No hole-fill campaign has launched at this checkpoint. The existing fine/facet numerical processes
remain running and are not restarted or relabeled by this source change.

**Completed scientific check:** exact `npm test` ran at frozen source and documentation
`b0144b649382b4ea96c13b7a089e0662b695f579` from 03:33:35 to 04:10:57 UTC. Its start/exit records
name one test worker, twelve experiment workers at launch and the combined ceiling of twenty-eight.
The exit is 1: 167 passed / 12 failed files; 2,571 passed / 18 failed / 72 skipped tests,
plus one unhandled worker `onTaskUpdate` timeout. Vitest reports 2,208.00 seconds. Rule 7 and both
typechecks pass. The changed solver, runner and analyzer files report all eight, six and fourteen
tests passing respectively, consistent with the independent focused invocations above. The full
suite's reporting error prevents a blanket clean-suite claim.

Compared directly with the completed facet check, the failed-file roster retains its ten files
and adds `phase10-c0v-s6-authority.test.ts` (the old supplemental graph check's 300-second timeout)
and `phase10-intake.test.ts` (the temporary-directory cleanup hook's ten-second timeout).
Historical byte/registry pins and missing retired S6 files remain. The permanent-control test now
first rejects the intentionally corrected G-G machinery prose identity, while M-GT rejects the
extended attachment spec. Those are not numerical mismatches. Do not repair retired infrastructure,
widen timeouts or repeat this completed check. Supervisor 36404 has exited; the check is accounted
for and the registered four-row launch is next.

Records: `out/post-phase10-holefill/checkpoint-2026-09-09/npm-test.log` is 252,006 bytes, SHA-256
`95a747cc3616a4c65e7761e9b56a169d51fa9b70652ec0eff6e958af6e45070d`;
`npm-test-exit.json` in that directory is 406 bytes, SHA-256
`c29dda103ab69308bf932a391fd65fa8b234e062ce18a90a96cb69c236f67af6`.

**First-closure qualification from retained data:**
`out/post-phase10-cavity/first-axis-fill-remainders-2026-09-09.json` is 4,507 bytes, SHA-256
`63b824a7e84520706870e5d38258a57ede03c6c7aad0d99bbd9c2cb21693217f`.
It identifies each source event file by bytes/hash and gives the extraction method. At the first
added axial layer in each N64 baseline, exactly the symmetric axis pair attaches and the geometric
count is two. The event deficit increment agrees with the independently differenced cumulative
ledger. Dividing by the pair count gives mean bypassed fill of 0.01818018325467874 / 0.045538292995731755
for M1/no-dip at -4.5 C, and 0.016296820244502297 / 0.04291355838356359 at -5 C: small remaining
fractions, not most of a voxel. These are measured pair means; per-site equality would additionally
use noise-free reflection symmetry. Dividing by the event's maximum kinetic increment gives
0.326–0.911 event-duration equivalents at that observed maximum rate. This is not actual closure
time: local rates, timestep and geometry can change. Small bypassed volume does not establish a
small topological effect, and the first events do not characterize later closure. Keep the selected
counterfactual, with delayed closure versus persistent topology change as the key distinction.

**Launch executed once:** the registered `launch-holefill ... 4` command started under clean
producer `21da8313c3833e03fac6b9532c7ec52ebcaf7dff`. Parent PID 42212 and worker children 14384,
46844, 47568 and 45868 were confirmed live. All four host records name that producer; the specs
carry `post-phase10-holefill-isolation-v1` and disabled mode with their ordinary M1/no-dip settings.
`out/post-phase10-holefill/campaign-2026-09-09.launcher.log` records actual startup concurrency
four, with separate `.launcher.stderr.log` initially empty; the campaign's `holefill-wave-1-launch.json`
and `campaign.json` record the exact command, controls and requested concurrency. The 04:13 UTC
process census counted sixteen experiment workers: eight fine, four facet, four closure. No test
worker remains. Per-row status/exit/results are the next observations; a parent wave status file
is not a prerequisite for a live launch. Do not duplicate it or restart the older campaigns.

Next use `runner/src/post-phase10-cavity-analysis.ts rows <new-report.json> <row-directory>...`
on the four terminal disabled rows and the four retained ordinary baselines. Analyze the separate
facet quartet comparison as it completes too. Retain incomplete or inadmissible dispositions;
select any longer follow-up from the actual matched results, while the fine-grid rows continue.

Maker correction, 2026-09-09: stop minute-by-minute process/file polling and repetitive unchanged
updates. Use roughly hourly observations or reported completion events, with an interruptible wait
between them. A goal continuation is not a reason to repeat checks or create another status record.
The frequent monitor was stopped without stopping any experiment; retain this instruction across
context compaction.

### First completed facet quartet — -4.5 C, 2026-09-09

The hourly 08:33 UTC observation found both -4.5 C hybrids and the -5 C basal-only row complete,
all at admissible extent-29 stops; -5 C prism-only and all fine/closure rows remained running.
The complete -4.5 C quartet is retained at
`out/post-phase10-facet-factorial/t4p5-comparison-2026-09-09.json` (784,594 bytes, SHA-256
`b22e50dc17c1f0d83b1b3aee5637170a5b7f8b5846d8ee55e42ee456db104d1d`). It was generated from clean
`d03038e` with the existing analyzer's `rows` command on the two new `facet-isolation-t4p5-*`
directories and the two ordinary `cavity-baseline-t4p5-*` controls; its provenance contains the
exact argv, Node engine and source hashes. All four arms are admissible and matched, with no
nonkinetic configuration difference. These are local working artifacts, not a published gate.

| Dip preparation | Terminal sites | Open enclosed center-air layers | Full waist planes |
|---|---:|---:|---:|
| Both / M1 | 5,369 | 22 | 5 |
| Basal-only | 5,345 | 22 | 5 |
| Prism-only | 6,041 | 0 | 11 |
| Neither / no-dip | 6,041 | 0 | 11 |

Both and basal-only each have two enclosure episodes: an early transient, then an interval from
cycle 46 through the stop. Neither and prism-only each have five transient episodes and none at
stop. The common terminal age is 47.11633895038739 seconds. At its positive quarter-age samples,
both and basal-only have 6/12/18/22 enclosed layers; neither and prism-only have none at those
samples. This is not a claim that transient no-dip/prism-only pockets never occur between samples.
Every terminal enclosed layer in the two basal-dip arms has a straight outward axial opening
witness. Their waist adds four full probe planes beyond the seed, versus ten in the other arms.

An independent read-only reconstruction from seed and events, without the production cavity
analyzer, corroborated the terminal counts, cavity/opening profiles and waist. Spatial samples
retain the previous limitation: both and basal-only have same-plane basal center/rim comparisons
at initialization but not at later recorded snapshots. Their absence is not zero demand or an
identified initiation mechanism.

**Interpretation and next action:** at this anchor, basal-only reproduces the terminal open-cavity
outcome and prism-only does not. The combined dip intervention is not required for that outcome
among these tested configurations; no physical necessity, implemented width feedback or grid
independence is established. Complete the second temperature and the orthogonal hole-fill test
before choosing the finite longer extension. To honor the maker's request to avoid repeated work,
retain one final four-arm report per temperature, using the unchanged pre-registered per-temperature
size/time grouping. Those two reports collectively cover the eight registered rows; do not regenerate
a third combined copy of the same comparisons. No numerical code or scientific test was rerun for
this analysis.

### Completed mechanism comparisons and selected longer evaluation — 2026-09-09

Both finite mechanism campaigns have finished. The remaining three final per-temperature reports
are listed below; their provenance records contain exact analysis argv and input identities.
All requested rows are admissible, and each report's appropriate four-arm/four-corner matched
flag is true. These supplement, rather than replace, the completed -4.5 C facet report above.

| Report under `out/` | Bytes | SHA-256 |
|---|---:|---|
| `post-phase10-facet-factorial/t5-comparison-2026-09-09.json` | 806,187 | `882d745edca57e59bdb7727799562ee03cdbb2479fa1388b9cf897867df86aa0` |
| `post-phase10-holefill/t4p5-comparison-2026-09-09.json` | 796,976 | `4132a1202263019b1cd75a93af97d4fc87af61eb56bf45deba6d69f8b7142f17` |
| `post-phase10-holefill/t5-comparison-2026-09-09.json` | 792,375 | `8ee95fff2994f8ca2771ce0cb96ee73a8960177420c1ca92e9ac8d3f8f0e69b1` |

The -5 C facet comparison repeats the basal-side grouping: both / basal-only finish with
5,417 / 5,225 sites, five full waist planes and 22 straight-open enclosed center-air layers;
neither / prism-only finish with 7,135 / 7,135 sites, thirteen waist planes and no terminal
enclosure. Their physical stopping times are respectively 45.040965064598836 /
44.100134553806704 and 70.68545053636288 / 68.74897793898809 seconds. Both basal-dip arms have
two enclosure episodes, including one persisting to stop; the other arms have six transient
episodes. Equal endpoint counts do not imply an unchanged growth history or no prism effect.
The model-level basal-side isolation now replicates at both registered temperatures; it does
not establish a physical mechanism or supply the absent actual facet-width feedback.

The orthogonal geometric-completion intervention gives the following terminal measurements
directly from the two hole-fill reports. All four disabled results record zero geometric
attachments and zero geometric deficit.

| Temperature / kinetics | Completion enabled: sites / waist / open enclosed layers | Disabled: sites / waist / open enclosed layers |
|---|---|---|
| -4.5 C / M1 | 5,369 / 5 / 22 | 5,415 / 3 / 24 |
| -4.5 C / no-dip | 6,041 / 11 / 0 | 6,041 / 11 / 0 |
| -5 C / M1 | 5,417 / 5 / 22 | 5,381 / 5 / 22 |
| -5 C / no-dip | 7,135 / 13 / 0 | 7,135 / 13 / 0 |

Disabling completion preserves persistent M1 enclosure versus eventual no-dip closure at these
stops. At -4.5 C it reduces the M1 waist and leaves extra narrow, axially open throats; these
center-axis sections have outward-opening witnesses, not isolated sealed vacancies. At -5 C
the M1 waist recovers the enabled thickness through kinetic attachment. Consequently the earlier
attribution of the enabled trajectory's waist attachments to geometric completion is **not**
evidence that the same final waist requires that route. No-dip still reseals without it.

Independent seed/event reconstruction corroborated terminal counts, waist and opening profiles.
A bounded inspection of the disabled M1 rows' `boundary-e*.json` and `events.jsonl` under
`out/post-phase10-holefill/campaign-2026-09-09/rows/` found the distinguishing throat sites are
rough, with unit cached attachment coefficient at recorded boundary samples. At the warmer
anchor their sampled fill approaches a plateau while local boundary supersaturation declines;
at the colder anchor they complete kinetically early. This suggests early completion versus
later supply starvation, not a locally inhibited coefficient. There is no final fill snapshot,
no proof of permanent arrest, and no local relative-error guarantee for the deeply depleted
field. The connectivity measurement remains center-axis enclosure with straight-opening
witnesses, not an exhaustive three-dimensional vacancy census.

**Selected finite next experiment (registered before implementation):** extend these two
comparisons to the existing larger-domain control conditions. This is a longer endpoint test
of the surviving leads, not another temperature sweep or a new constitutive law.

- Add four `facet-isolation-long-t{4p5,5}-{basal-only,prism-only}` rows, taking the corresponding
  existing larger M1 row and changing only its identity and explicit facet arm.
- Add four `holefill-off-long-t{4p5,5}-{m1,nodip}` rows, taking each corresponding larger ordinary
  row and changing only its identity and explicit disabled-completion option. Do not combine
  the two experimental options.
- Reuse, without rerunning or modifying, the four ordinary controls
  `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/followup-larger-cavity-t{4p5,5}-f0p075-{m1,nodip}`.
  Their `host.json` producer is `dd4ef5245e6b48fff164b888e3b287665ab6c457`; all four `exit.json`
  records have exit code zero. Their `spec.json` records prescribe N80, spacing 0.35 micrometers,
  fill CFL 0.05, radius-two/thickness-one seed, maximum extent 37 and maximum 100,000 steps.
  Temperature, supersaturation, pressure, noise, convergence controls, policy and far-field
  condition stay exactly as those specs record. They have no spatial-sampling schedule; the
  new variants also omit it so the existing analyzer can match configurations unchanged.
- The larger endpoint's maximum center span is 12.6 micrometers, calculated as
  `(37 - 1) * 0.35` from those specs. Compare interventions **within N80** at common physical
  sizes and ages with the existing cavity analyzer. N64-to-N80 also changes the shell, so it is
  neither pure elapsed-time extension nor mesh refinement. Do not infer convergence from it.
- Main questions: does basal-only retain the persistent open-cavity outcome at larger size;
  does the warmer disabled M1 waist remain thinner or recover; do no-dip/prism-side trajectories
  still reseal or acquire a later persistent cavity? Report transient episodes as well as stops.
  Retain one final matched quartet report per temperature per experiment, with ordinary controls
  shared as inputs. Missing or inadmissible corners remain gaps, not negative evidence.
- Reuse the existing finite roster/launcher functions, logging and analysis. No numerical solver
  changes, new experiment identity, checkpoint format, diagnostics framework or scheduler are
  needed. Add explicit `list-facet-factorial-long`, `launch-facet-factorial-long`,
  `list-holefill-long` and `launch-holefill-long` routes without changing old rosters or commands.
  Use existing ADR 0055/0056 options; no further charter exception is being introduced.
- Check the roster/CLI boundary once and perform one exact `npm test` at the stable combined
  evidence-generation checkpoint, as Rule 6 requires. Do not repeat the solver fixture campaign,
  repair historical failures, or rerun for confidence. Routine monitoring stays hourly or on
  reported completion; changing nothing does not create a new check obligation.

Launch each new four-row campaign once from the committed producer:

```text
node runner/src/post-phase10-discovery-main.ts launch-facet-factorial-long out/post-phase10-facet-factorial/campaign-long-2026-09-09 4
node runner/src/post-phase10-discovery-main.ts launch-holefill-long out/post-phase10-holefill/campaign-long-2026-09-09 4
```

Account for actual live workers at launch; the combined experiment/test ceiling remains 28.
Leave the original fine-grid campaign untouched. This extension is done when the finite matched
comparisons answer these questions over their measured window or name a specific remaining gap;
select any further mechanism from those results rather than preloading a broad sweep.

**Implementation checkpoint:** `d743e68` adds the separate longer rosters and CLI routes in the
three existing runner files, with roster/CLI assertions in the two existing test files. There
is no solver or analyzer change. One focused invocation passed both files and all 16 tests:
`npx vitest run runner/test/post-phase10-facet-factorial.test.ts runner/test/post-phase10-holefill.test.ts --maxWorkers=2 --minWorkers=1`.
The original output was retained only in the implementing agent's tool transcript; the explicit
transcription is `out/post-phase10-mechanism-long/checkpoint-2026-09-09/focused-observations.json`,
not a fabricated full log. The single combined exact `npm test` has now finished at frozen source
and docs `6e6f514c9233fd2d5f3d27553216305b9acf4c09`. Its `npm-test-exit.json` records
09:43:04–10:12:14 UTC, exit 1, one test worker and eight existing experiment workers at launch.
The adjacent `npm-test.log` records 169 passed / 10 failed files and 2,576 passed / 17 failed /
72 skipped tests, with a Vitest duration of 1,711.06 seconds. Rule 7, both typechecks and all
16 tests in the two changed files pass. The same ten historical failed files remain: the
Phase 10 scope-overlay, B acquisition/branches, S6 executor/historical-A-P/lifecycle/preflight
observer, final-package, and Phase 9 M-GT/permanent-control bindings. Their reported failures
are the recorded missing retired files and frozen registry/spec identities, not new long-roster
failures. No worker-RPC error or timeout is reported in this check. It is not a green full suite;
do not repair those retired surfaces or rerun it. Supervisor 49000 has exited. The log is
235,412 bytes / SHA-256 `7090aa8541fb7d580441bef00a51619053074e390798626827fc263e1866de6f`;
the exit record is 411 bytes / SHA-256
`86947dd9af2b1e3fd208f1cf0b0d06753396537ce1bf31e5042f7d2f90a8383b`.

**Long runs launched once:** both registered commands above executed under producer
`4c35764965a3726ec0a405817343f5dec21aa76f`. At 10:40:20 UTC, facet parent 21736 had four live
workers and hole-fill parent 43860 had four; original fine parent 13768 retained eight. Actual
combined experiment concurrency is sixteen. Each new campaign's `campaign.json`, all row
`host.json` records and startup launcher log confirm the producer/roster; each launcher logged
four simultaneously active workers and has empty startup stderr. Logs are the campaign paths
above plus `.launcher.log` / `.launcher.stderr.log`; per-row logs and terminal exit/results live
inside their `rows/` subdirectories. Do not duplicate a launch or treat an absent terminal result
as a failure. Next inspect these existing processes at the hourly/completion cadence and analyze
finished matched quartets. No additional test or status commit is needed for unchanged work.

### Completed warmer longer comparisons — 2026-09-10

The -4.5 C longer facet and hole-fill quartets are complete. The unchanged analyzer generated
one final report for each from clean `dcaab102decc75c91e716b511d36196edc9b0aaf`; exact argv and
input identities are inside each report. All endpoints are admissible and both appropriate
four-arm/four-corner matched flags are true, with no other configuration differences.

| Report under `out/` | Bytes | SHA-256 |
|---|---:|---|
| `post-phase10-facet-factorial/t4p5-long-comparison-2026-09-10.json` | 772,866 | `ceeb6202961de81176d123189ada9f5f5ee87ffb44ed2fed1da1635e5868d25b` |
| `post-phase10-holefill/t4p5-long-comparison-2026-09-10.json` | 775,882 | `0cc1fc3adfe32a69f5906bb87d1debab1dc9e0ecc87bf19e24a37201025a5898` |

Their shared ordinary controls appear only once in this table of terminal measurements:

| Preparation / geometric completion | Attached sites | Full waist planes | Straight-open enclosed center-air layers |
|---|---:|---:|---:|
| M1 / enabled | 10,163 | 5 | 30 |
| Basal-only / enabled | 9,605 | 5 | 30 |
| Prism-only / enabled | 13,797 | 15 | 0 |
| No-dip / enabled | 13,809 | 15 | 0 |
| M1 / disabled | 10,053 | 3 | 32 |
| No-dip / disabled | 13,797 | 15 | 0 |

The basal-side grouping survives the larger measured endpoint: both and basal-only retain
open cavities; prism-only and no-dip reseal. Both basal-dip arms have an early transient episode
followed by enclosure from cycle 46 through stop. Neither/prism-only have seven transient
episodes and none at stop. The prism-only/no-dip terminal counts now differ slightly, unlike
the shorter endpoints; the shared coarse classification is not a claim of identical geometry
or growth history. At the facet quartet's common terminal age, 66.46577194636605 seconds,
and its positive quarter-age selections, both basal-dip arms retain enclosed/open layers and
the other arms have none at those selected ages. Transient pockets between samples remain in
the report; selected states are recorded events at or before the requested age, not interpolated
states or equal sizes.

The warmer disabled-M1 waist **does not recover** over this longer recorded N80 history. At
the 9.8-micrometer size selection it has three waist planes and 24 open enclosed layers at
48.13313296472922 seconds; at the 12.6-micrometer terminal endpoint it still has three waist
planes, now with 32 open enclosed layers, at 67.58093962988065 seconds. Thus additional growth
within this N80 run did not close the narrow throats. This is not proof of permanent arrest.
Both no-dip histories still reseal after seven transient episodes, with unchanged terminal waist
classification despite their slightly different cell counts. Both disabled rows report zero
geometric attachments and zero geometric deficit. The closure quartet's common terminal age
is 67.58093962988065 seconds; its positive quarter-age samples retain the same M1-versus-no-dip
enclosure distinction. Every terminal enclosed center-air section has a straight axial opening
witness; this is lattice connectivity, not a measured physical subcell aperture.

The reports retain the existing default size-selection grid through 9.8 micrometers and report
12.6 micrometers separately as the terminal endpoint. There are no registered spatial snapshots
in these longer runs, so terminal partial fill and local field accuracy remain unmeasured.
N64-to-N80 also changes the shell; only within-N80 interventions and history are compared as
matched here. Neither grid independence nor physical validation follows. No code changed and
no numerical test or simulation was repeated to obtain these comparisons.

The colder companions subsequently completed; the full longer comparison and selected interaction
follow-up are below. Do not generate duplicate partial/combined reports or expand into a broad sweep.

### Completed colder longer comparisons and selected interaction — 2026-09-10

All eight new longer rows now have admissible extent-37, exit-zero results. The unchanged analyzer
generated the two final colder reports from clean `39f8938510cfb5ffcdb2711cbb9f96372f8fcc73`;
exact argv and input identities are inside them. Both quartets are fully matched and admissible.

| Report under `out/` | Bytes | SHA-256 |
|---|---:|---|
| `post-phase10-facet-factorial/t5-long-comparison-2026-09-10.json` | 802,141 | `58a704c73a9ebb1b7e04ce63fc6b22eb01ced930db943d7cec8881814566cf3e` |
| `post-phase10-holefill/t5-long-comparison-2026-09-10.json` | 772,175 | `3889f417a2e6bc116716c5f416e0a9ab45a062ad440a89ed1402e4880f676148` |

Terminal measurements copied from those reports, with shared ordinary controls listed once:

| Preparation / completion | Attached sites | Full waist planes | Straight-open enclosed layers |
|---|---:|---:|---:|
| M1 / enabled | 8,759 | 5 | 30 |
| Basal-only / enabled | 8,699 | 5 | 30 |
| Prism-only / enabled | 15,645 | 15 | 2 |
| No-dip / enabled | 15,635 | 17 | 0 |
| M1 / disabled | 8,723 | 5 | 30 |
| No-dip / disabled | 15,635 | 17 | 0 |

The basal-side persistent cavity result survives the colder longer endpoint as well. Disabled
M1 reaches the same five-plane waist here, unlike the warmer three-plane outcome. Both disabled
rows have zero geometric attachment count and deficit. Both no-dip histories contain eight
transient episodes, all closed by stop; equal terminal counts do not establish identical occupancy.
At the hole-fill quartet's common age, 63.125546530422454 seconds, both no-dip arms temporarily
have two open layers, so the selected common-age samples are not uniformly cavity-free.

The colder prism-only terminal is **not** fully closed: its eighth episode remains right-censored
at stop, with two single-cell openings on the outermost planes, offsets +/-8. Its longest
consecutive open-layer run is one, compared with fifteen for M1/basal-only. The retained final
event at cycle 1029 in
`out/post-phase10-facet-factorial/campaign-long-2026-09-09/rows/facet-isolation-long-t5-prism-only/events.jsonl`
attaches all six lateral neighbors of each center. The centers become raw [6,1] after that event;
they were basal [0,1] before it. Recorded pre-update basal maximum fill is 0.6806731079673398
and the fill-CFL increment is 0.05. Thus their fill remains below 0.781 even after another
admissible kinetic increment. Under the unchanged `lk-solver.ts` start-of-step predicate
`f < 1 && nTAtt >= 4 && nZAtt >= 1`, both would therefore complete geometrically on the next
successful positive-time update. This is a conditional code/geometry derivation, independently
checked by the shared-context mechanism agent, **not an observed continuation**; it says nothing
about later new pits. Do not spend another full trajectory merely to confirm these two closures.

**Selected finite interaction, registered before implementation (decision 0057):** test prism
dip absent/present by geometric completion enabled/disabled, keeping the basal dip absent.
Only the missing two combined rows are new:

- `prism-holefill-off-t4p5` and `prism-holefill-off-t5`, derived from the corresponding
  `facet-isolation-long-t{4p5,5}-prism-only` rows, changing only the row identity and adding
  `experimentalHoleFilling: "disabled"`. Both flags are recorded under the new explicit identity
  `post-phase10-prism-holefill-interaction-v1`; no ordinary checkpoint or timeline route is added.
- Preserve the existing N80, spacing 0.35 micrometers, fill CFL 0.05, radius-two/thickness-one
  seed, extent-37 target, maximum 100,000 steps and snapshot-free configuration. Temperature,
  forcing, pressure, v6 policy, monopole boundary and convergence settings are inherited exactly
  from the matched longer row specs, not retuned. No new physical mapping/source is adopted.
- Reuse three completed controls per temperature: ordinary no-dip/enabled at
  `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/followup-larger-cavity-t{4p5,5}-f0p075-nodip`
  (producer `dd4ef5245e6b48fff164b888e3b287665ab6c457`); no-dip/disabled at
  `out/post-phase10-holefill/campaign-long-2026-09-09/rows/holefill-off-long-t{4p5,5}-nodip`;
  and prism-only/enabled at
  `out/post-phase10-facet-factorial/campaign-long-2026-09-09/rows/facet-isolation-long-t{4p5,5}-prism-only`
  (both latter producers `4c35764965a3726ec0a405817343f5dec21aa76f`). No control is relaunched.
- Hypothesis: kinetic preparation and geometric completion interact through evolving geometry
  and vapor supply, possibly yielding persistent open cavities despite the single-intervention
  resealing. Compare the prism effect with completion off against the prism effect with it on:
  `(prism/off - neither/off) - (prism/on - neither/on)` for each named measured observable.
- Use the existing size selections through 9.8 micrometers, terminal 12.6-micrometer maximum
  center span, and within-quartet physical-age brackets. Report open-layer counts, longest
  consecutive open run, its center depth `max(0, layers - 1) * dxUm`, per-plane void areas and
  waist addition. Preserve unequal age/axes and event-bracketing caveats.
- Distinguish growth of a cavity from repeated new pits: compare the same plane indices and
  outward opening direction across successive selected frames while the corresponding occupied
  axial tip advances. At least two consecutive open planes persisting behind an advancing tip
  constitute a candidate for longer evaluation, not a physical gate. Report exact plane sets,
  depth and tip advance; one-plane pits, one-cell remnants, closed vacancies and shifted layer
  phase alone are delayed-closure results. Existing geometry and monotone attachment histories
  supply the observations; no new solver diagnostics or snapshots are needed. The existing
  attachment-event replay will retain compact per-plane/per-opening-side intervals, including
  start, end-exclusive, axial tip at start, maximum tip advance while open and maximum depth
  below that occupied axial envelope. This distinguishes recurrent pits at different planes
  without storing dense geometry frames; envelope depth is not local mouth shape or aperture.
- Reuse the finite roster/launcher and cavity analyzer. Add the two explicit list/launch routes
  and a distinct matched interaction grouping, leaving old rosters and report files unchanged.
  Focused checks cover the combined numerical options, artifact labels, exact roster inheritance
  and non-vacuous multi-plane persistence readout. Run one exact `npm test` at the stable combined
  checkpoint because numerical-option and scientific-readout behavior change. Do not repair
  historical failures or repeat it for confidence. No registry/scheduler/assurance framework.

Launch once from the verified committed producer, with two actual workers and the eight existing
fine-grid jobs left untouched (combined experiment/test ceiling remains 28):

```text
node runner/src/post-phase10-discovery-main.ts launch-prism-holefill out/post-phase10-prism-holefill/campaign-2026-09-10 2
```

Retain one final matched quartet report per temperature. This finite interaction is done when
its measured histories either identify a multi-plane persistence lead for a targeted longer test,
show delayed closure/resealing, or name a specific missing observation. It does not complete the
original fine-grid question or authorize a broad combination sweep. Monitoring stays hourly or
on completion; untouched live processes need no new confidence checks.

**Interaction implementation checkpoint:** the combined-option guard, explicit artifact/log
identity, two-row roster/CLI and matched interaction readout are implemented in existing files.
No numerical equation, existing roster, ordinary checkpoint meaning or simulation changed. The
focused commands ran once on this working implementation:

- `npx vitest run solver-cpu/test/lk-hole-filling.test.ts solver-cpu/test/lk-facet-dips.test.ts --maxWorkers=1 --minWorkers=1`:
  two files / 17 tests pass, exit zero; original `solver-focused.log` below.
- `npx vitest run runner/test/post-phase10-holefill.test.ts runner/test/post-phase10-facet-factorial.test.ts --maxWorkers=1 --minWorkers=1`:
  two files / 19 tests pass, exit zero; original `runner-focused.log` below.
- `node node_modules/vitest/vitest.mjs run runner/test/post-phase10-cavity-analysis.test.ts --maxWorkers=1 --minWorkers=1`:
  one file / 18 tests pass, exit zero; original `analysis-focused.log` and exact absolute argv,
  times and exit in `analysis-focused-exit.json` below.

These logs live under `out/post-phase10-prism-holefill/checkpoint-2026-09-10/`. Manufactured
fixtures independently exercise a nonzero difference-of-effects, deepening openings on both
axial sides and migrating pits that must not count as same-plane persistence. A compact existing-
data demonstration, `readout-demonstration.json` in that directory, uses the completed colder
M1/enabled and prism-only/enabled controls without rerunning either simulation or replacing their
reports. It measures a fifteen-layer open run (4.8999999999999995-micrometer center span) and
maximum 5.25-micrometer axial tip advance while a plane stays open in M1; the prism-only terminal
has a one-layer run, zero center span and zero corresponding tip advance. These are scoped
geometry/history observations, not a physical aperture or automatic promotion verdict.

`npm run typecheck` also passed (root and app checks; original exit-zero tool transcript).
Implementation and this record were committed together at
`29eebb389d9f903ba4b6f595828fb8ceffaf4174`. Its one exact `npm test` ran from 16:50:57 to
17:19:56 UTC, with one test worker and eight existing experiment workers at launch. Supervisor
26212 has exited. The check reports 169 passed / 10 failed files, 2,585 passed / 17 failed /
72 skipped tests, exit one and 1,711.15 seconds Vitest duration. Rule 7, both typechecks and all
54 tests in the five focused files pass. The same historical missing-file/frozen-identity failures
remain in Phase 10 scope, B acquisition/branches, S6 executor/historical-A-P/lifecycle/observer,
final-package and Phase 9 M-GT/permanent-control. No timeout or worker-RPC error is reported.
This is not a green full suite; no new interaction failure was found and no historical repair or
confidence replay follows. The original log is `npm-test.log` in the checkpoint directory above,
236,334 bytes / SHA-256 `937b9f1c364d54f1d983af98f7540ed175caaba5f30dbd85fb5b7a9a94f3ad88`;
`npm-test-exit.json` is 411 bytes / SHA-256
`8dc420ea08556edc3f7185342e19cee8f0f12755b5469e2939cf9db7b6a751f4`.
**Interaction launched once:** the registered command executed under producer
`9ab31acbe8ab11f46ffee0fce0b3fb9d335ce135`. At 17:27 UTC launcher 44648 had two live children,
13340 and 31780, alongside the eight original fine-grid workers (ten experiments total; no test
worker). The campaign's `campaign.json`, both `host.json`/`spec.json` records and startup log
confirm the producer, explicit combined identity and both flags. The launcher logged two active
workers, with empty startup launcher/row stderr. Read
`out/post-phase10-prism-holefill/campaign-2026-09-10.launcher.log`, its `.launcher.stderr.log`,
and the campaign's per-row status, stderr, exit and result records. The six named controls were
not relaunched. Next observe the existing processes roughly hourly or on completion, then use
the cavity analyzer's `rows` command for one final matched quartet per temperature, including
the three registered reused controls. Preserve the original fine-grid campaign and all earlier
reports. Do not duplicate either new row, rerun verification, or add an unchanged-status commit.

### Completed warmer interaction — 2026-09-11

`prism-holefill-off-t4p5` completed at 12:46 UTC with an admissible extent-37 stop, exit zero,
all relaxations converged, zero symmetry error and no recorded integrity errors. Its
`result.json` / `exit.json` remain under the registered interaction campaign. The one final
quartet report is `out/post-phase10-prism-holefill/t4p5-comparison-2026-09-11.json`, 653,705 bytes /
SHA-256 `b45744a3f54efc78c6cc3b4330c2a941f9a8e67ede26b32e8b29257dbaedde96`, generated from clean
`da9890b8cce6df3b573f5e37d0bca8a8c3aa4f7d`. Exact argv and all four input identities are inside.
Its distinct interaction group is fully admissible and matched, with no other configuration
differences.

The combination stops at cycle 987 / 103.90282043064693 physical seconds with 13,797 attached
sites, fifteen full waist planes and no terminal center-air enclosure. All three controls also
finish with fifteen waist planes and no enclosure. Neither/enabled has 13,809 sites; both
neither/disabled and prism-only/enabled have 13,797. Equal counts do not imply equal occupancy
or history.

Each of the four histories has seven transient enclosure episodes and fourteen signed-plane /
opening-side intervals, all closed by stop. Every tracked interval has zero axial tip advance
while open and zero depth below its outward occupied axial envelope. Thus the registered
multi-plane persistence-behind-growing-tips lead is absent in this warmer comparison: these are
recurrent surface pits, not observed deepening center-axis cavities. The combination's last
episode closes at 98.59120430481292 seconds, versus 97.94947577948896 for prism-only/enabled;
delayed closure is a measured effect, not a reason by itself to launch a longer cavity chase.

At the quartet's common age, 103.53059836006673 seconds, all four selected states have no
enclosure; the first positive quarter-age selection instead has two open layers in each arm.
The terminal-size difference-of-effects is twelve attached sites and zero for the waist/opening
observables; at 9.8 micrometers it is zero for all reported observables, while the common-age
attached-count contrast is minus thirty-six. This shows why neither a common endpoint count nor
one timing comparison implies an inert intervention. Ages are event-bracketed, not interpolated;
equal maximum center spans are not equal axial sizes. These remain N80 model-development
observations with straight-axis witnesses, not exhaustive three-dimensional connectivity or
physical/grid validation.

The shared-context `phase10_science_review` agent (parent-inherited model, maker-selected Astra)
independently inspected the retained intervals/frames and recomputed pit durations. It likewise
found recurrent single-plane pits rather than a multi-plane persistence lead, and noted that
nonzero cell-count/timing contrasts preclude a blanket no-interaction claim. It did not rerun
the solver, analyzer or tests, inspect the live colder morphology, or establish physical/full-3D
validity. No separate review artifact or assurance layer was created.

No further warmer extension is selected for this shallow delayed-closure result. Next complete
the independently running colder quartet and continue the original fine-grid experiment; the
colder outcome is not inferred from this one. No code, test, simulation or earlier report was
repeated to obtain this result.

### Earlier completed-row observations

`cavity-seed-thick-t4p5-m1` completed with exit 0 and an admissible size-target stop. Its raw
`result.json` under `out/post-phase10-cavity/campaign-2026-09-08/rows/` records 454 cycles,
37.6854893744537 physical seconds, 4,161 attached sites and extent 29; all relaxations converged,
the reported symmetry error is zero, and no integrity error is recorded. The standalone analysis
from clean `297b86f9dbaf445cfd966b3ac33b800a40343169` is
`out/post-phase10-cavity/cavity-seed-thick-t4p5-m1-analysis-2026-09-08.json` (246,266 bytes, SHA-256
`dcbbf3e8e7193229da42c916d5879a2e4b0df73d024230443a3e077a82c57aef`). Reproduce with:

```text
node runner/src/post-phase10-cavity-analysis.ts rows out/post-phase10-cavity/cavity-seed-thick-t4p5-m1-analysis-2026-09-08.json out/post-phase10-cavity/campaign-2026-09-08/rows/cavity-seed-thick-t4p5-m1
```

The writer refuses an existing output; use a fresh path for an intentional reproduction. This
report covers one supplied row, not a completed wave or matched comparison. Its terminal geometry
has 18 laterally enclosed center-air planes at offsets +/-5 through +/-13, with a straight axial
opening toward each outer end. The extreme planes at +/-14 remain laterally open. The central
0.35-micrometer-radius hex probe is full across nine waist planes, versus five in the seed:
four newly full planes, not nine newly grown planes. Inclusive waist thickness grows from
1.75 to 3.15 micrometers. A shared-context Astra agent independently reconstructed the final
occupancy and six-neighbor planar enclosure from the seed and events; no solver rerun was needed.

After an early transient interval, at least one enclosed center-air layer exists continuously
from cycle 45 (4.038825909708185 seconds) through the terminal. This does not track a single
unchanging cavity component. Spatial snapshots bracket that interval's onset at cycles 40 and
103, but neither supplies a same-plane basal center/rim comparison: the exposed center and rim
are on different axial planes. In fact only the initial snapshot has such paired planes.
Do not substitute a cross-plane ratio for the registered comparison or infer causation from it.

At the same positive cavity-bottom center site (offset +5), reported boundary supersaturation
falls from 0.0003993956528544739 at cycle 103 to 0.00001313521858375417 at cycle 177 and
1.3857684183533194e-7 at cycle 263. This is a post-onset depletion observation consistent with
suppressed interior growth, not a demonstrated initiation mechanism. The final sampled value,
1.6102738446221455e-9 at cycle 357, remains a recorded solver diagnostic, not a local accuracy
claim: the iterate tolerance limits last-sweep change normalized by far-field supersaturation,
not local relative error. Neither it nor the global divergence check supplies a local
solution-error bound. Reported
zero attachment coefficients at the last two snapshots are numerical exponential underflow,
not proof of an exactly zero physical rate. Keep the one-step monopole qualification in
**Initial-field and cost qualification** below.
Next obtain the matched no-dip and baseline/seed/grid results before deciding the mechanism
follow-up; thicker-seed hollowing in this single case does not settle those contrasts.

The second completed row, `cavity-seed-thick-t5-m1`, also exits 0 at an admissible size target.
Its separate analysis is `out/post-phase10-cavity/cavity-seed-thick-t5-m1-analysis-2026-09-08.json`
(246,177 bytes, SHA-256 `7e1b36b46f8d25981778d5757d10d42a0e751aeec475f556a63f9da1cb0ea46a`;
exact analysis argv and source identities inside). It reaches extent 29 with 4,173 attached sites
at cycle 472 / 36.120990698827114 seconds. It too has 18 enclosed planes and a nine-plane
probe-full waist; the void sections at offsets +/-13 contain 19 sites rather than the seven
sites in the other enclosed planes, so the two terminal shapes are not identical. Its
terminal enclosure interval begins at cycle 44 / 3.8218623666161813 seconds. Later snapshots
again have no same-plane basal center/rim pairs. This extends the thick-seed hollowing observation
to the second selected temperature, without yet supplying a matched no-dip or grid contrast.

The first no-dip terminal is a different seed configuration: `cavity-seed-wide-t5-nodip`.
Its admissible extent-29 stop has 6,041 attached sites at cycle 611 / 64.60553627047588 seconds,
an eleven-plane full-probe waist, and no enclosed center-air plane. The history contains five
transient enclosure episodes; every recorded snapshot has positive same-plane basal rim-minus-center
mean kinetic demand. Thus such a contrast is observed without hollowing persisting to this stop.
Do not compare it as a matched arm against the thick-seed M1 rows. Source:
`out/post-phase10-cavity/cavity-seed-wide-t5-nodip-analysis-2026-09-08.json` (127,113 bytes,
SHA-256 `5b23d0bb085a24435f44168b08544453c67ba9769cf92b8857469511ccc8b34f`;
exact input identities and analysis command inside).

The matching wide-seed no-dip temperature row, `cavity-seed-wide-t4p5-nodip`, also finishes
admissibly with extent 29, 6,041 attached sites, eleven probe-full waist planes and no terminal
enclosed plane. It records five transient enclosure episodes and positive paired basal demand
contrasts in all snapshots, at different event times from the -5 C row; its terminal is cycle
585 / 63.02418339749179 seconds. Source:
`out/post-phase10-cavity/cavity-seed-wide-t4p5-nodip-analysis-2026-09-08.json` (127,200 bytes,
SHA-256 `bdd2728c11c0b5be0d2be6442786233740003836f409d8970c64591d55512dd5`;
exact input identities and analysis command inside).

### Seed-matched wide-seed arm comparisons

The wide-seed pair at -4.5 C is complete. Its joint report is
`out/post-phase10-cavity/wide-seed-t4p5-pair-analysis-2026-09-08.json` (363,964 bytes, SHA-256
`824a7dcc11b29bf7d0020f14a788e3a0bacff90bba4c2ef2c2e2d50498c0fc9d`), generated by the standalone
`rows` command with `cavity-seed-wide-t4p5-m1` and `cavity-seed-wide-t4p5-nodip` directories;
exact argv and identities are in the report. Both terminals are admissible. At the shared
9.8-micrometer **maximum lattice-coordinate center span**, M1 has 22 enclosed center-air planes
and a five-plane probe-full waist; no-dip has none and an eleven-plane waist. The maximum is axial
for M1 and in-plane for no-dip: this is not equal axial length or equal physical age. Their
attached counts are 5,987 and 6,041, and occupied-cell volumes 222.30233421411245 and
224.30739953022436 cubic micrometers respectively; those volumes exclude partial fill.

The separate physical-time comparison gives the same qualitative cavity contrast. At requested
time 48.61143296853939 seconds, M1 is terminal with 22 enclosed planes; no-dip is sampled at
cycle 462 / 48.568730445302016 seconds with none, extent 25 and a nine-plane waist. Its next
event at 48.65486329080131 seconds brackets the request; no occupancy interpolation is used.
Across all four positive common-time samples, M1 has 6, 12, 16 and 22 enclosed planes versus
zero at each no-dip sample. A shared-context Astra agent independently checked the matching
specifications and reconstructed these occupancy comparisons from the seed and events.
M1's terminal enclosure interval starts at cycle 48 / 4.57803247302154 seconds after an earlier
transient. Thus increasing seed radius has not removed the arm contrast at this temperature and
spacing. This is scoped seed-perturbation evidence, not grid independence or physical validation.

Unlike the thick-seed cases, the wide-seed M1 cycle-40 snapshot does contain a positive same-plane
basal center/rim demand contrast before that terminal interval begins. It follows an earlier
transient cavity and already differs geometrically from the no-dip snapshot, so it is not a
controlled initiation intervention. After onset the interior and leading exposed basal regions
occupy different planes; the observed interior depletion still does not identify which coupled
mechanism initiated it. Complete the other seed-matched pairs and fine-grid comparisons before
promoting the observation to a seed/grid-robust lead.

The second wide-seed pair, at -5 C, repeats the qualitative contrast. Its joint report is
`out/post-phase10-cavity/wide-seed-t5-pair-analysis-2026-09-08.json` (363,912 bytes, SHA-256
`e8b9de69385617e92e20fc334297e6513daea09b4e0b6060225957d2e6809583`; exact argv and inputs inside).
At extent 29, M1 has 6,017 attached sites, 22 enclosed planes and a five-plane full-probe waist;
no-dip has 6,041 sites, no enclosed planes and an eleven-plane waist. At their four positive
common-time samples the enclosed counts are 6, 10, 16, 22 versus zero throughout. The last requested
time is 46.78898713498752 seconds (M1 terminal); no-dip is cycle 475 at 46.55763457114072 seconds,
bracketed by its next event at 46.82956205013383 seconds, with extent 23 and a nine-plane waist.
M1's enclosure interval persisting through stop begins at cycle 47 / 4.330048479988489 seconds.
Its cycle-40 same-plane contrast and later spatial limitations are qualitatively like the -4.5 C
case. At that checkpoint this pair did not settle baseline/thickness/grid sensitivity and no
new mechanism run started. The later bounded overlap amendment supersedes that serial order.

### First within-arm seed comparison

The -4.5 C M1 baseline also completed admissibly, making all three coarse seed geometries available.
`out/post-phase10-cavity/m1-seed-t4p5-comparison-2026-09-08.json` (752,406 bytes, SHA-256
`6271d4b2f2cea36f62eb04c1da247f55077fa8052b552e2a234706df6171926b`) records the joint `rows`
command, inputs and common-age selection. At the common extent 29 / 9.8-micrometer maximum center
span, the baseline, thick and wide seeds have respectively 22, 18 and 22 enclosed planes.
Their probe-full waists grow from 1, 5 and 1 seed planes to 5, 9 and 5 planes: each adds four full
probe planes in these measured runs. The final waist therefore retains the imposed seed thickness;
this is not evidence of a seed-independent selected waist, nor a general four-layer law.

At common requested age 37.6854893744537 seconds, the corresponding reconstructed states have
18, 18 and 16 enclosed planes and the same final waist counts; baseline and wide are at extent 23,
while thick is at its extent-29 stop. Cavity existence survives both seed changes under these
comparisons, but detailed geometry does not. For example, at terminal axial offset +5, baseline
and thick have enclosed area 0.742616783745156 square micrometers, while wide has
2.0156741273082805. The baseline terminal has 5,369 attached sites at cycle 566 /
47.173290784590904 seconds. Its post-initial snapshots lack a same-plane basal center/rim pair.
Keep the binary persistence observation distinct from seed-dependent waist/void dimensions; the
pending fine-grid experiment addresses whether the new-growth length scales track cells or
physical distances, subject to its explicitly bracketed seed representation.

### Reused domain control and initial spatial observation

The planned same-spacing domain comparison is now measured from the existing data, without new
solver runs. `out/post-phase10-cavity/cavity-domain-comparison-2026-09-08.json` contains all eight
named inputs, their identities and the exact analysis command (1,315,486 bytes, SHA-256
`dbad12883daefd73abe36ace650ede689d3071141879514d7c3b740814d2cd5d`). The N64 rows are
`out/post-phase10-confirmation/campaign-2026-09-02-wave1/rows/confirm-cavity-cfl-t{4p5,5}-f0p075-{m1,nodip}`;
their N80 counterparts are the retained `followup-larger-cavity` rows above. The report confirms
admissible terminals. A bounded read-only comparison found matching recorded forcing, seed,
spacing, CFL and fixed machinery; the recorded producer heads also resolve to the same LK solver
and Libbrecht mapping blobs. All use Node v24.13.1. The following measurements are at the common
9.8-micrometer center span, not at unequal final sizes:

| Temperature / arm | Attached sites N64 / N80 | Probe-full waist planes, both | Enclosed planes, both |
|---|---:|---:|---:|
| -4.5 C / M1 | 5369 / 5381 | 5 | 22 |
| -4.5 C / no-dip | 6041 / 6041 | 11 | 0 |
| -5 C / M1 | 5417 / 5393 | 5 | 22 |
| -5 C / no-dip | 7135 / 7135 | 13 | 0 |

This supports small domain sensitivity for these specific observables at this size. It does not
establish general boundary independence or grid convergence. The live fine-grid experiment remains
necessary, and no replacement domain sweep is needed.

A separate bounded read of the new coarse baseline initial snapshots is recorded by
`out/post-phase10-cavity/analyze-initial-boundaries.mjs` in
`out/post-phase10-cavity/initial-boundary-contrast-2026-09-08.json` (18,038 bytes, SHA-256
`915ced3ce102c0c88bf46d73a2b13e5b45debd5f2282be6fea6b4a7bd42d602b`). It uses the committed
spatial profiler and records its own source and each raw snapshot identity. A complete first
interface event confirms the initial snapshot writer has returned before those files are read;
the snapshots themselves have completedCycles=0 and physical time zero. This is explicitly not
a terminal-row or completed-wave analysis. At -4.5 C the basal rim/center mean cellwise kinetic
demand-factor ratio is 1.192326911123919 for M1 versus 1.093267830208458 for no-dip; at -5 C the
ratios are 1.1896125972240679 versus 1.0964802916661462. Upward and downward profiles agree.
Both arms therefore already have center/rim contrast on the same initial seed, with greater
relative contrast in M1. This supplies an initial spatial observation consistent with the proposed
diffusion/kinetics explanation, not proof that it causes persistent hollowing. Ratios describe
computed demand factors, not measured deposited growth; subsequent geometry and the seed/grid
perturbations are still needed.

**Initial-field and cost qualification.** ADR 0024 registers a one-interface-step lag in the
monopole correction. The first relaxation uses zero lagged kinetic demand and therefore a flat
`sigmaInfinity` shell; the initial spatial observations above are not measurements after the
outer-boundary feedback has settled. Later spatial observations remain necessary. In
`solver-cpu/src/lk-solver.ts`, `advanceSurfaceUpdate()` updates `volumeRateM3PerS` from boundary
kinetic demand even when no cell attaches; the next relaxation uses that revised shell target.
The vapor field is warm-started, not reset, and partial fill does not enter the relaxation
operator directly. This is the documented approximation, not a newly demonstrated reset defect
or physical diffusion time.

The completed first 21 event records in
`out/post-phase10-cavity/campaign-2026-09-08/rows/cavity-fine-thin-t4p5-m1/events.jsonl`
show the changing cost: cycle 1 uses 29,035 sweeps, cycle 7 uses 14, and cycles 8–20 use one each.
Cycle 20 adds 12 sites to the 61-site seed; cycle 21 then uses 17,569 sweeps. These are a bounded
in-flight event prefix, not a completed row or a whole-wave timing estimate. Root read that prefix,
the operator/spec and ADR; a shared-context Astra agent independently traced the field/cache and
monopole update paths. No new simulation, test or benchmark ran for this diagnosis. Do not
extrapolate the first solve's cost to every remaining step or change the running producer to
remove the registered lag.

Next mechanism implementation direction (design only): a bounded read-only review located the
shared coefficient-preparation seam in `LKSolver`. Prefer a finite, explicitly labeled factorial
preparation selecting basal/prism constants from the existing M1 and no-dip preparations over
copying the complete solver merely to satisfy an old source hash. A production opt-in would need
an ADR/spec clarification preserving ordinary behavior and existing checkpoint meanings; a copied
experimental operator is an alternative, not a scientific necessity. Do not implement either
through the test-only callback. Require nontrivial ordinary-versus-experimental equivalence for
the both-dips and neither-dip controls, and retain the same coefficient in Robin relaxation and
fill. This earlier design identified the code seam; the bounded overlap amendment now authorizes
its finite implementation, not a broad framework. The existing cavity producer changes no solver behavior.

A bounded scalar feasibility check found distinct mixed preparations at the cavity temperatures
and the prism-dip center: the implemented log-temperature dip tails overlap, so the proposed
factorial does not merely duplicate its control coefficients there. The prefactors match, and
the rough/inhibited coefficient rules have no direct preparation dependence; their populations
and local fields can still respond indirectly. A shared-context Astra agent evaluated the
preparations and sampled attachment coefficients; root independently evaluated the documented
dip factors and read the closure. No hybrid growth experiment was run at that checkpoint. The
bounded overlap amendment now selects the warm factorial; judge any weak cross-facet response using absolute kinetic
demand at recorded facet-local supersaturation, not coefficient ratios alone. Distinct inputs
do not establish distinguishable morphologies. Reproduce the preparation comparison from the
science worktree (inputs from the cavity roster and `core/src/libbrecht.ts`):

```text
node --input-type=module -e "import { prepareAlphaHK } from './core/src/libbrecht.ts'; for (const tempC of [-4.5, -5, -14.4]) console.log(tempC, prepareAlphaHK(tempC, 'M1'), prepareAlphaHK(tempC, 'M1_NO_DIP_ABLATION'));"
```

A direct retained-event check during verification reconstructed the axial attachment sequence in
`out/post-phase10-followup/campaign-2026-09-03-wave2/rows/` for
`followup-larger-cavity-t4p5-f0p075-{m1,nodip}` and `followup-larger-cavity-t5-f0p075-{m1,nodip}`
(each row's `spec.json`, `events.jsonl` and `result.json`). M1 adds center-axis sites only at
offsets +/-1 and +/-2 in both retained histories; the matched no-dip axes continue to +/-7 and
+/-8 respectively. Every recorded center-axis attachment is classified rough immediately before
its attachment step. This is not a claim that its earlier accumulated fill was all rough-site
growth: the facet class can change while a pixel fills. The new spatial snapshots are needed to
test the proposed basal-center field precursor rather than infer it from the final event label.

## Superseded bounded second-tranche design

The original design would have selected no more than 12 conditions that cover distinct observed
phenomena rather than twelve versions of one optimum:

1. an adjacent-grid gross-aspect-ratio sign transition;
2. attachment-orientation sign disagreement with a smooth gross endpoint;
3. the strongest pressure-by-arm interaction; and
4. the strongest near-volume-matched seed-shape-by-arm interaction.

At the selected conditions, it would have used no more than 48 total rows for:

- two named mixed arms, basal-dip-only and prism-dip-only (maximum 24 rows), implemented as the
  exact M1/broad-branch facet combinations with focused core/solver/checkpoint tests;
- selected N64 and/or `cflFill = 0.05` confirmations (maximum 16 rows); and
- up to eight abrupt warm/cold history reversals using the existing deterministic temperature
  conversion path, with the event placed at common extent 11 and static endpoint comparators from
  the first tranche.

The maker's later direction replaces this cap because the full pilot exposed multiple plausible
signals and compute is available. Its mechanistic categories remain useful, but not its arbitrary
row ceiling.

## Implementation steps

1. Commit/push this plan before code changes.
2. Add the finite first-tranche roster, row-level pressure, CLI launch mode, and focused roster
   tests. Run focused tests, TypeScript, Rule 7, and a tiny two-row smoke.
3. Commit/push the clean producer checkpoint, then launch all first-tranche rows at concurrency 16.
4. Analyze the retained trajectories, implement the finite N64/extent-29 roster, and run all 432
   matched long-wave rows at recorded concurrency 16.
5. Analyze each completed wave, launch the next finite discriminating wave while a plausible lead
   remains, then promote compact claim-bearing reports, update `docs/PROGRESS.md`, and commit/push.

## Done when

- all 432 first-tranche rows have terminal classifications, with failures retained by cause;
- the temperature/forcing, pressure, and seed-shape analyses are reproducible from retained rows;
- every pilot signal with a plausible scientific interpretation receives a longer matched
  evaluation and is classified as persistent, numerically sensitive, initialization-sensitive,
  endpoint-quantized, or unresolved; and
- the report distinguishes numerical sensitivity, implementation-level kinetic contrasts,
  initialization/history effects, and unresolved physical interpretation.

## Deliberately not done

- no Phase 7, Phase 10 recovery, validation claim, source search, UI, GPU, generic scheduler,
  dashboard, hostile-user defense, automated unbounded fan-out, or protocol-version succession;
- no exact `npm test` loop after small product-sized runner edits; checks follow repository Rule 6;
  and
- no fitted dip location, pressure law, or parameter optimization against a target habit.

## Tried and rejected

- Extending the warmer prism-only/disabled row on its longer transient pit durations alone:
  the completed matched interaction has zero axial tip advance during every tracked opening,
  all of which reseal. This closes that warmer deepening-cavity lead over the registered window;
  the independently running colder interaction and original fine-grid comparison remain open.

- Extending the enabled colder prism trajectory solely to confirm its two terminal single-cell
  closures: the recorded neighborhood and next successful update rule already settle that
  conditional consequence. Test the missing prism/disabled interaction throughout growth instead.

- Repeating the Phase 6 grid was rejected because it omits the matched no-dip arm and trajectory
  diagnostics that produced the new questions.
- A single giant Cartesian grid over temperature, forcing, pressure, seed, timestep, and domain
  was rejected because interactions would be expensive and hard to interpret. Pressure and seed
  are restricted to six temperatures; timestep/domain work is promoted adaptively.
- Adding facet-specific parameter sets before locating informative conditions was rejected because
  it expands core/checkpoint surfaces before the existing two-arm model has identified where that
  decomposition is worth running.
- Adding the now-informative basal-dip-only and prism-dip-only hybrids directly to `LKSolver` was
  rejected before launch because the exact full check correctly showed that it changes the
  Phase 9-frozen permanent-control source identity. Routing a scientific run through the existing
  test-only coefficient override was also rejected because that seam explicitly marks the result
  as a test of different machinery. The 12 proposed hybrid rows were removed, leaving 58 rows;
  facet contributions remain descriptive from the retained per-facet trajectories unless a later
  deliberately separate experimental operator is justified.
- Treating terminal `branchCount` as the topology result was rejected because the angular-bin
  diagnostic changes at lattice-sized radius increments even when occupancy stays exactly D6h.
- Comparing every arm only at terminal `largestExtent = 29` was rejected because plate-like rows
  can stop on in-plane extent while column-like rows stop on vertical extent. Equal in-plane size
  and equal exact-extent plateau age are required where that distinction bears on interpretation.

## First-tranche implementation record

The implementation adds `runner/src/post-phase10-adaptive.ts` as the finite 432-row roster and
reuses the completed campaign's worker and independent-process launcher. `DiscoveryRow.pressurePa`
is optional so every historical row retains the existing 101,325 Pa default; every adaptive row
states its pressure explicitly. No `core/` or `solver-cpu/` byte changed.

Pre-launch checks:

- `npx vitest run runner/test/post-phase10-adaptive.test.ts
  runner/test/post-phase10-discovery.test.ts`: 2 files / 10 tests passed;
- `npx tsc --noEmit`: passed; and
- two-process smoke `out/post-phase10-adaptive/smoke-7cbcbc0-v1`: both workers exit 0 at actual
  concurrency 2. The 50,662.5 Pa and 202,650 Pa specs each reached `size-target` in one converged
  cycle with zero integrity errors;
- `npm run lint:rule7`: clean across 1,520 files; and
- `git diff --check`: passed.

Exact `npm test` was not run for this bounded roster/configuration change: no numerical
implementation, scientific readout calculation, gate, or evidence publication path changed.

## Long-wave implementation record

`runner/src/post-phase10-long.ts` maps the exact 432 pilot conditions to N64 / target extent 29
and preserves every other row value. The existing independent-process launcher gained only the
finite `list-long` and `launch-long` routes; no solver, checkpoint, core parameter, readout, retry,
or scheduler behavior changed.

Pre-launch checks:

- `npx vitest run runner/test/post-phase10-long.test.ts
  runner/test/post-phase10-adaptive.test.ts runner/test/post-phase10-discovery.test.ts`: three files
  / 12 tests passed;
- `npx tsc --noEmit`: passed;
- `npm run lint:rule7`: clean across 1,522 files; and
- `git diff --check`: passed.

Exact `npm test` was not run: this is another bounded finite-roster/launcher extension and does not
change numerical behavior, scientific readout calculation, a gate, or evidence publication.

## Confirmation-wave implementation record

`runner/src/post-phase10-confirm.ts` holds the exact 58-row roster, and the existing launcher gained
only `list-confirmation`, `launch-confirmation`, and a concurrency ceiling matching the host's 32
logical processors. No solver, core parameter, checkpoint, or readout calculation changed.

Final pre-launch checks:

- `npm run typecheck`: passed;
- focused roster, runner, long-wave, and Phase 9 freeze tests: six files / 35 tests passed;
- `npm run lint:rule7`: clean across 1,524 files; and
- `git diff --check`: passed.

Exact `npm test` ran on the rejected 70-row design and passed 161/170 files and 2,511 tests. Its two
new Phase 9 permanent-control readiness failures identified the proposed `LKSolver` source change;
removing that change and its 12 facet-hybrid rows restores the frozen solver byte identity, which
the focused Phase 9 tests confirm. The other failures are the already recorded Phase 10 missing
ignored recovery bytes and stale frozen identities; this science work neither repairs nor copies
them.
