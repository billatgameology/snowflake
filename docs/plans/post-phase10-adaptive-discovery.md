# Post-Phase-10 adaptive discovery follow-up

**Status:** confirmation wave 1 complete; follow-up wave 2 implemented and ready to launch
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
- At matched central-plane tip radius, M1 retains a positive sixfold arm-depth contrast against a
  filled no-dip hexagon: `0.230769...` versus `0` at -12 C, `0.272727...` versus `0` at -14.4 C,
  and `0.1` versus `0` at -18 C. The -18 C magnitude weakens from the full-timestep result but does
  not disappear. Branch-count bins are not used for this conclusion.
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
