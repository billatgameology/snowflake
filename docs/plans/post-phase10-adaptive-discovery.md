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
The next decision is the cavity/seed/grid result and then a separate facet-factorial design,
not an automatic broad sweep. Compact report/source preservation remains due before publication;
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

### Completed coarse rows

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

### First seed-matched arm comparison

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
fill. This identifies the next code seam without authorizing a premature new run or a broad
framework. The current cavity producer still changes no solver behavior.

A bounded scalar feasibility check found distinct mixed preparations at the cavity temperatures
and the prism-dip center: the implemented log-temperature dip tails overlap, so the proposed
factorial does not merely duplicate its control coefficients there. The prefactors match, and
the rough/inhibited coefficient rules have no direct preparation dependence; their populations
and local fields can still respond indirectly. A shared-context Astra agent evaluated the
preparations and sampled attachment coefficients; root independently evaluated the documented
dip factors and read the closure. No hybrid growth experiment was run. Keep the factorial
conditional on the cavity results, and judge any weak cross-facet response using absolute kinetic
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
