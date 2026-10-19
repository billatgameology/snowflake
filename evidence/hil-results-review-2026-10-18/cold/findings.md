# Cold structure readout — October 18, 2026

Internal saved-data model-development analysis. No new simulation or producer/source change.
The decision-bearing result is that the -14.4 C anchor is more stable under timestep reduction
than the marginal cold tail. The new results do not justify calling the cold tail a sharp
physical transition, nor do they establish grid or domain independence.

## What was checked

`cold-summary.json` covers 124 cold rows: four October 10 controls, 56 October 11 rows and
all 64 October 12 cold rows, forming 31 complete facet quartets and four joint timestep
comparisons. Existing `summarizeFirstBatchRow` rederived all 124 size endpoints with zero
errors. Every saved attachment was reconstructed from the seed; counts, coordinates, final
count/time and central-plane ring census were checked against the established definitions.
`producerParity` records that the only core/solver/runner changes between the producer endpoints
33832e2 and 0161a51 are the four new roster/entry files. Exact input byte hashes are in the summary.

Arm order throughout is neither / basal-only / prism-only / both. Core is the largest fully
occupied central-plane hex ball; tip is maximum occupied hex radius; gap is tip minus core in
lattice-radius cells. Occupancy is not mass. Plateau observations compare elapsed time since
entering a shared tip, with different absolute ages. Common absolute ages are a separate readout.
Every deciding comparison retains at-or-before and next-event brackets; no occupancy interpolation.

## Findings

1. **The -14.4 C / forcing .10 lead survives the three tested timestep settings.** At tip eight,
   half the shortest common plateau across all twelve arm/timestep cases gives gaps 0/0/2/2
   at CFL .05, .025 and .0125. Both adjacent events preserve those gaps. The ring-seven/eight
   counts are 42/48 for neither/basal-only and 36/18 for prism-only/both, out of 42/48 possible
   sites. At the common absolute age 6.510792127185423 seconds, the corresponding gaps are
   also 0/0/2/2 at all three timesteps, although tips are 3/3/8/8, so these are distinct stage
   and time comparisons. The half-plateau comparison at tips seven, nine and ten also agrees
   across these steps (1/1/2/2). Do not generalize this to every time: the common final-age
   comparison straddles a discrete attachment in one timestep arm.

2. **The -20 C forcing feature survives a narrower check, with an explicit counterexample to
   broad robustness.** At tip eight, the joint CFL .05/.025 mid-plateau comparison gives
   0/0/0/0 at forcing .10 and .125, and 0/0/1/1 at .15; both adjacent events agree.
   At .15, the outer ring contains 48 versus 42 of 48 sites for no-prism versus prism arms.
   But tip nine's mid-plateau prism gap is one at .05 and zero at .025; the coarse next-event
   bracket is already zero. At forcing .125, gaps recur at tips six/seven/nine despite the
   tip-eight and terminal nulls. At .15, the joint common absolute-age samples at one-quarter,
   one-half and three-quarters of the common lifetime all give zero gaps. Therefore the
   threshold-like pattern describes selected growth stages, not a permanent morphological class.

3. **The new temperature/forcing map adds context, not a monotonic cutoff.** Tip-eight
   midpoint gaps in the 48 new tail cases are:

   | Temperature C | Forcing .10 | Forcing .15 | Forcing .20 |
   |---|---|---|---|
   | -17.5 | 0/0/1/1 | 1/1/2/2 | 1/1/2/2 |
   | -18.5 | 0/0/1/1 | 0/0/1/1 | 1/1/1/1 |
   | -19.5 | 0/0/0/0 | 0/0/1/1 | 0/0/1/1 |
   | -20.5 | 1/1/1/1 | 0/0/0/0 | 0/0/1/1 |

   At -17.5/.15 and -18.5/.20 the next event changes the first two gaps from one to zero.
   Those uncertainties are retained. Other stages and terminal values are in the summary;
   a selected null is not evidence that the full trajectory has no prism effect.

4. **The newer field sampling captured useful prism states.** All 240 saved boundary snapshots
   in the 20 anchor/timestep rows were checked by independently reconstructing boundary membership,
   coordinates, neighbor classes and prism membership. At -14.4 C, each prism-enabled row has
   prism cells in six of eleven non-initial snapshots, consistently across the three CFLs.
   The earlier three-snapshot schedule missed these states. In the -20/.15 comparison, each
   prism-enabled row has them in ten of eleven non-initial snapshots at both CFLs.
   Fields at equal extents still have different ages and geometry. These samples support a
   focused transport/kinetic-demand follow-up, not a physical mechanism verdict.

## Next options, for discussion only

- **Prioritize the -14.4/.10 anchor for representation qualification.** Its multi-cell effect
  and three-timestep agreement are a stronger basis than the marginal one-cell cold tail.
  First separate same-spacing domain enlargement from a physically matched refinement;
  preserve seed/physical-span definitions and obtain a configuration-specific cost estimate
  before authorizing another potentially multi-day run. A two-resolution comparison alone
  must not be advertised as full grid convergence.
- **Use the already saved fields to examine core catch-up before spending more compute.**
  Focus on the prism-bearing tip-seven/nine states and adjacent sparse-prism stages; keep
  local supersaturation and coupled coefficient-demand factors together. Changing geometry
  prevents treating different snapshots as a fixed-geometry causal test.
- **Keep the -20 forcing boundary as a secondary lead.** If selected, a small third-timestep
  comparison at .15 with the existing quartets would test the tip-nine disagreement.
  It should answer that specific uncertainty, not fill another broad temperature grid.

No exact new campaign, runtime budget, grid mapping, or launch is selected by these options.

## Reproduction and limits

From primary repository root (scripts remain in the shown staging directory):

```powershell
node out/analysis-2026-10-18/cold/read-cold.mjs
node out/analysis-2026-10-18/cold/read-spatial.mjs
python out/analysis-2026-10-18/cold/extract-summary.py
```

All three commands completed with exit zero. First-command final stdout/stderr are
`read-cold-final.stdout.log` / `read-cold-final.stderr.log`; spatial stdout/stderr are
`read-spatial.stdout.log` / `read-spatial.stderr.log`. Script/input hashes, exact fixed roots,
producer identity and detailed-local-output hashes are in `cold-summary.json`. Keep the
~25 MB detailed derived files local; concise decision evidence is the summary, these notes
and the three small recipes. Preserve source outputs under the existing NAS governance.

The recipes reuse the established `stateMeasure`, `bracket` and `spatial` calculations from
retained cold readouts; only row selection, grouping across timestep controls, inclusion of
ring arrays and output compaction changed. The existing tested row checker is called directly.
No production calculation module, numerical law, codec or test was changed. This is execution
of saved-data analysis, not a new full-suite or phase-gate claim. Shared-context Codex/GPT-6
performed this readout and its skeptical interpretation; no independent physical validation,
new grid/domain test or independent full-analysis review was performed.
