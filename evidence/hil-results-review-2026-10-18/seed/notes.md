# Seed response: current evidence and next discriminating options

Requested saved-data analysis, October 18, 2026. No simulations, live producer writes, source
changes or new campaign were made. `decision-summary.json` is the compact decision record;
`inputs.json` binds every selected spec, event stream, terminal result and exit. The full readout
is `seed-analysis-v2.json` (6,694,908 bytes, SHA-256
`69b05a689791b5003f8e2fa177e11940c9304e12f50b9e150857da81fd2987be`).

All 64 seed cases are covered: 16 October 11 and 48 October 12, eight temperature/forcing
conditions, two seeds and four facet preparations. Existing endpoint checks pass; reconstruction
of 44,986 recorded updates reconciles every event's coordinates, occupancy, extent and aspect
ratio, and all 646,656 new attached sites. Attached occupancy is not deposited mass.

The tall seed begins with 35 sites, five axial layers and three lateral cells; the wide seed
has 37 sites, one axial layer and seven lateral cells. Reported new spans subtract each seed's
own initial dimensions. Shape, volume, surface and diffusion environment still vary together.

## Findings that affect the next decision

1. The starting seed affects subsequent axial additions, not just the inherited outline. At each
   condition's common eight-row age, the tall seed adds 2–6 more axial layers than the wide seed
   in all 32 condition/arm pairs, unchanged in sign under recorded adjacent-event alternatives.
   Those ages differ between conditions; the report retains every age and witness. Each layer
   difference corresponds to 0.35 um in total axial center span.
2. This is not uniformly continuing faster axial growth. Of 24 pairs with saved time beyond the
   eight-row age, the subsequent pair-specific windows give 14 exact ties in axial additions,
   seven tall-seed advantages, one wide-seed catch-up and two bracket-sensitive results. Eight
   zero-duration pairs are excluded. The clear catch-up is -8.5 C, fraction .15, both dips:
   between 19.8691303454 and 21.735 s (exact endpoint in JSON), the wide seed adds two more
   axial layers, reducing its accumulated new-growth deficit from four layers to two.
3. The implemented facet competition changes with temperature. At the same 16.6289686258 s
   physical age across all 32 fraction-.15 cases, both-minus-neither **new axial layers** are:

   | Temperature C | Wide seed | Tall seed |
   |---|---:|---:|
   | -6.5 | +4 | +6, alternative up to +8 |
   | -7.5 | +2 | +4 |
   | -8.5 | -2, alternative up to 0 | 0 |
   | -9.5 | -2 | -2 |

   At this same age basal-only minus neither is positive for all eight temperature/seed pairs;
   prism-only minus neither is negative for all eight. Both-minus-neither occupied-site additions
   remain positive for all eight, including where axial additions are lower. At -9.5 C, the wide
   seed both arm adds 1,510 more sites (recorded alternatives 1,498–1,534), extends laterally
   2.10 um more and axially 0.70 um less. This identifies anisotropic effects of the software
   intervention, not a material transition or physical SDAK mechanism.
4. Forcing and stage matter. At the identical 10.9643617704 s age across all 24 -9.5 C cases,
   wide-seed both-minus-neither axial contrasts are 0/-2/0 layers at fractions .10/.15/.20,
   respectively, with the signs unchanged by the adjacent-event choices. The independently
   longer condition windows give different magnitudes. A monotone forcing law inferred from
   those differently timed observations would be unsupported.

## Recommended next step, for discussion

The seed lead is now specific enough to qualify instead of filling another temperature grid.
The smallest direct numerical option is **eight CFL-0.025 cases**: temperatures -6.5/-9.5 C,
fraction .15, the two existing seeds, and both/neither preparations, retaining N64, dx .35 um
and extent 29. Compare to the eight exact CFL-.05 cases already completed, at common ages,
with accumulated and later-window increments kept separate. This checks the net positive/negative
contrast at the two anchors. It does not independently qualify every four-arm decomposition.

Those eight existing CFL-.05 cases took 17.3198655556 summed worker wall-hours under their original
contention. Changed-timestep cost is unmeasured: this is a baseline, not a promised duration or a
transferable worker qualification. No selected roster, freeze or launch is created by this note.

An alternative is a small longer-growth comparison near -8.5 C to separate continuing divergence
from repeated catch-up, but that requires an explicit new endpoint and domain/representation
discussion; the old saved targets cannot be silently extended. Fine-grid qualification is useful
eventually, but mature fine-run cost must be made explicit before choosing it. The current results
do not justify another uncosted multi-day sweep.

## Definition, reproduction and assurance limits

`analyze.mjs` reuses the exact `readRow`, `increments`, `window`, `windows` and `contrast`
function bodies from the previously checked
`evidence/hil-bld-joint-review-2026-10-08/followup/history.mjs`. It imports the unchanged existing
`bracketCavityTime` and `summarizeFirstBatchRow`. New scratch code selects complete seed blocks
and common-age sets, and packages/counts the resulting contrasts; no scientific metric module
or numerical method was added. At-or-before measurements retain the next recorded state.
Exact times use only the exact state. These sensitivity ranges are not confidence intervals.

From primary root, with this script restored to its recorded `out/` location, rerun into an absent
path: `node out/analysis-2026-10-18/seed/analyze.mjs out/analysis-2026-10-18/seed/seed-analysis-new.json`.
The executed command used `seed-analysis-v2.json` and exited zero. `summarize.py` and `compact.py`
only extract/repackage that readout, source bindings and scoped counts; they also exited zero.
The initial `seed-analysis.json` omitted later-pair selections and is superseded, not deleted.

The analysis author is a Codex/GPT-6 subagent with inherited context. Its skeptical pass checked
the common-time requirement, initial-seed subtraction, zero-duration exclusion, finite-window
limits and the distinction between occupied sites and mass. No independent complete review,
full field inspection, solver re-execution, grid/domain test or physical comparison was performed.
Scientific source parity between fixed producers was checked by an empty diff for `core`,
`solver-cpu`, the discovery worker and the time-bracket helper. All inputs use CFL .05; old
CFL .1 seed cases are excluded. This internal readout does not grant validation or gate credit.
