# Completed HIL comparisons — October 21, 2026

The completed runs strengthen several model-development leads. The warm history experiment is
the most compelling next focus: the deep open structure survives halving the grid spacing and
both fine seed thicknesses, and it keeps extending after the early width intervention ends.
Cold structure and pressure/history also survive their named follow-up checks. Facet isolation
explains the opposing axial responses, while revealing a clear timestep limitation in occupancy.
These are results inside the implemented model, not quantitative validation of natural ice or
automatic acceptance of the broader Phase 10 portfolio.

## What the completed comparisons show

| Question | Result | Decision-relevant limit |
| --- | --- | --- |
| Warm early-growth history | At the common largest center span 9.8 um, early-only open-envelope depths are 3.5 um coarse and 4.025 um for both fine seeds; all three broad controls have zero terminal depth. | Equal terminal size is not equal age. Both are reported; two spacings do not establish continuum convergence. The local-width rule remains P4. |
| Cold domain sensitivity | At the registered tip-radius8/9 plateau samples, the prism-enabled tip-to-full-core gap remains2 lattice-radius units at N64 and N96, while the controls are0–1. | The sampled plateau contrast persists; absolute-age observations differ near the common terminal-age ceiling. Same spacing/larger domain is not grid convergence or general domain independence. |
| Facet attribution and timestep | At common age16.4991908722 s, basal-only/prism-only/both versus neither add +6/-2/+4 axial layers at -6.5 C and +2/-4/-2 at -9.5 C, identically at CFL.05/.025. | Axial agreement does not extend to all timing or occupancy. A late -9.5 C basal-minus-neither occupancy contrast changes sign under timestep halving. |
| Pressure and warming history | Later-half early-minus-late axial growth is0.70 um at all three pressures and both timesteps in the joint7.5472489381 s post-event window. | The third quarter ties and the fourth supplies this advantage. It is stage-dependent, not continuously faster growth or pressure universality. |

[Actual central slices](warm/terminal-slices.png) show the six terminal structures at their named, unequal ages.

Each track's linked report contains exact inputs, definitions, numerical quantities, adjacent-event
alternatives, matched-spec/source checks and reproduction commands:

- [Warm refinement and post-switch growth](warm/notes.md).
- [Cold N64/N96 core/tip comparison](cold/README.md).
- [Sixteen-row facet attribution](facet/README.md).
- [Pressure/history timestep comparison](history-pressure/README.md).

The facet comparison uses a shorter common age than the preceding seed readout because the new
prism-only row ends first. Its older16.6289686258 s anchor is unavailable for the full sixteen-row
set. Results under different common windows must not be spliced into one claimed comparison.
At -9.5 C, late basal-minus-neither occupancy changes from -202[-214,-142] to +122[122,128]
sites under CFL.05 to.025. These are occupied-site counts, not deposited mass, and the brackets
are recorded-event alternatives rather than confidence intervals.

## What I would prioritize next

First discuss a focused warm-history follow-up that distinguishes a stable history effect from
sensitivity to the chosen width threshold and cutoff. Start with bounded coarse comparisons and
use their measured costs/results before selecting another expensive fine-grid run. The fine seeds
now support the same qualitative lead, so repeating the same refinement is not the next question.

Keep the cold lead as a separate direction: the larger-domain check supports its selected spatial
contrast, but the age dependence makes geometry/stage and transport diagnostics more useful than
another broad temperature sweep. For pressure/history, examine when the later axial bursts occur;
the completed quarter windows already disprove a simple continuously faster-growth account.

The smallest facet numerical follow-up is the proposed basal-only/neither pair at -9.5 C and
CFL.0125. It is worthwhile if occupancy or catch-up timing will carry the next decision; it is not
required merely to repeat the already scoped axial contrast. New cost is unmeasured. These are
discussion options, not a frozen batch, launch authorization, new target or time commitment.

## Evidence and preservation

The [task plan](../../docs/plans/hil-results-preservation-oct21.md) binds the registered readouts
and `hil-exploration-results@2026-10-21`. Bulk events, fields, checkpoints, failed attempts,
operational controls and detailed analysis outputs follow ADR0061 onto NAS; concise claims,
recipes, input identities and recovery records stay in Git. Local originals remain retained.
The final preservation/verification receipt will state the executed inventory and recovery result;
a prepared archive by itself is not a completed NAS publication.

This review was authored by Codex/GPT-6 with three inherited-context analysis subagents. Each
track re-executed its named existing reconstruction/analysis functions on complete inputs and
performed a skeptical interpretation pass. The primary separately recomputed headline facet and
pressure axial contrasts directly from attachment coordinates and physical times, without the
analysis window functions; [that receipt](author-axial-recomputation.json) states its limits.
It did not independently rebuild every cavity/topology/field calculation or every adjacent bracket.
No new simulation, source acquisition, physical identification or validation gate was executed.
