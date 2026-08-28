# Post-Phase-10 adaptive discovery follow-up

**Status:** plan checkpoint; implementation not started  
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

## Adaptive second tranche — capped at 48 rows

After the first-tranche report, select no more than 12 conditions that cover distinct observed
phenomena rather than twelve versions of one optimum:

1. an adjacent-grid gross-aspect-ratio sign transition;
2. attachment-orientation sign disagreement with a smooth gross endpoint;
3. the strongest pressure-by-arm interaction; and
4. the strongest near-volume-matched seed-shape-by-arm interaction.

At the selected conditions, use no more than 48 total rows for:

- two named mixed arms, basal-dip-only and prism-dip-only (maximum 24 rows), implemented as the
  exact M1/broad-branch facet combinations with focused core/solver/checkpoint tests;
- selected N64 and/or `cflFill = 0.05` confirmations (maximum 16 rows); and
- up to eight abrupt warm/cold history reversals using the existing deterministic temperature
  conversion path, with the event placed at common extent 11 and static endpoint comparators from
  the first tranche.

If the first tranche does not expose a condition for one category, do not spend its allocation.
Record the selection rule and observed operands in the report before launching the second tranche.

## Implementation steps

1. Commit/push this plan before code changes.
2. Add the finite first-tranche roster, row-level pressure, CLI launch mode, and focused roster
   tests. Run focused tests, TypeScript, Rule 7, and a tiny two-row smoke.
3. Commit/push the clean producer checkpoint, then launch all first-tranche rows at concurrency 16.
4. Analyze the retained trajectories, record the bounded second-tranche selection, implement only
   the selected mixed/history/confirmation support, and run the selected rows.
5. Promote compact claim-bearing reports, update `docs/PROGRESS.md`, and commit/push.

## Done when

- all 432 first-tranche rows have terminal classifications, with failures retained by cause;
- the temperature/forcing, pressure, and seed-shape analyses are reproducible from retained rows;
- the second tranche either completes within its 48-row cap or records why a category had no
  result-driven candidate; and
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
