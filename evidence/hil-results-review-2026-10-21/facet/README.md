# Completed facet attribution, 2026-10-21

The registered sixteen-row comparison supports an opposing axial effect of the
basal and prism preparations at the last common age in this implementation. The
temperature ordering survives the fill-CFL reduction from 0.05 to 0.025. Growth
timing and occupied-site additions remain sensitive to that reduction, so the
result does not establish numerical convergence or a physical mechanism.

This is the completed-data readout registered in
[the facet/pressure plan](../../../docs/plans/hil-facet-pressure-oct19.md),
using eight Oct11 controls, four Oct19 wide-seed both/neither controls, and four
new Oct19 hybrids. All sixteen use the same 37-site wide seed, radius 3 and
thickness 1, N=64, spacing 0.35 micrometres, fraction 0.15, pressure 101325 Pa,
and target extent 29. The two fill-CFL members of each temperature/preparation
pair differ only in row ID and fill CFL. The exact identities and source hashes
are in [inputs.json](inputs.json); all endpoints passed the existing operational
summary with disposition `size-endpoint`. The readout reconstructed all 16,697
cycles and 165,484 newly attached sites from saved attachment coordinates.

The common age is **16.499190872203283 s**, set by
`oct19-hil-facet-step-t9p5-f0p15-r3-h1-cfl0p025-prism-only`. The registered
quarter ages are 4.124797718050821, 8.249595436101641,
12.374393154152461, and 16.499190872203283 s. The previous
16.6289686258 s anchor is **unavailable for the full sixteen-row set**; no endpoint
is extrapolated or clamped to manufacture coverage.

At the common end, the five axial-growth contrasts below agree at both fill-CFL
values. Their adjacent-recorded-event alternatives give the same axial values.
Each unit is one additional total occupied axial layer, equivalent to 0.35
micrometres of total axial center span. Each row's initial seed was subtracted.

| Temperature | basal-only minus neither | prism-only minus neither | both minus neither | both minus basal-only | both minus prism-only |
| --- | ---: | ---: | ---: | ---: | ---: |
| -6.5 C | +6 | -2 | +4 | -2 | +6 |
| -9.5 C | +2 | -4 | -2 | -4 | +2 |

The separate interventions therefore help attribute the implemented axial
response: the basal preparation increases the common-end axial growth in these
comparisons, and the prism preparation decreases it. The basal contrast is
larger at -6.5 C, while the prism contrast is more negative at -9.5 C. Together,
the resulting both-minus-neither contrast is positive at -6.5 C and negative at
-9.5 C. This does not show that contributions add linearly over time or identify
a causal mechanism in natural ice.

The common-end lateral growth is also informative. Rounded to 0.01 micrometres,
the basal-only, prism-only, and both contrasts against neither are respectively
**-0.35, +0.70, 0.00** at -6.5 C and **-0.35, +2.10, +2.10** at -9.5 C.
These values agree at both timesteps and the adjacent recorded alternatives.
Lateral growth means the change in maximum Cartesian lateral occupied center
span, rather than a continuum radius or an inferred mass.

The time windows qualify the apparently simple common-end result:

- At -6.5 C, both-minus-neither axial growth over the four consecutive quarters
  is **+2, +2, +2, -2 layers** at both fill-CFL values. A positive cumulative
  contrast therefore does not mean a continuously faster axial growth rate.
- At -9.5 C and age 8.249595436101641 s, basal-only-minus-neither is **+2 layers
  at CFL 0.05, versus 0 at CFL 0.025**; those recorded alternatives are exact.
  The later common-end contrast is +2 in both. The timing of catch-up differs.
- Most decisively for occupied-site counts, during
  **12.374393154152461 to 16.499190872203283 s**, the -9.5 C
  basal-only-minus-neither contrast is **-202 [-214, -142] sites at CFL 0.05**,
  versus **+122 [122, 128] sites at CFL 0.025**. This sign reversal survives the
  recorded endpoint alternatives, while the axial contrast during that quarter
  is zero for both. Axial agreement cannot qualify this occupancy result.

Square brackets give the minimum and maximum over the at-or-before and next
saved event choices at each window endpoint. They are sensitivity to recorded
event timing, not confidence intervals or rigorous bounds at every continuous
time. Occupied-site additions count attachment events; they are not deposited
mass or a vapor ledger. Quantized geometry, two timesteps, one seed shape, one
spacing/domain, and two sampled temperatures limit interpretation. No spatial
or domain independence, physical validation, or temperature interpolation is
claimed. Tall-seed comparisons are outside this readout. The author skeptical
pass checked these restrictions and the distinction between cumulative and
consecutive windows; it is not independent adversarial review.

For discussion, the smallest next facet experiment would be **two -9.5 C wide
seed rows, basal-only and neither, at fill CFL 0.0125**, otherwise matching the
current pair and retaining the target extent 29. This specifically tests the
occupancy sign reversal and axial catch-up timing. A future protocol should
retain the named absolute quarter window above if both rows cover it, report a
coverage miss explicitly, and keep any recomputed common-age window separate.
These rows are a post-readout proposal, not a frozen or launched batch. Their
CFL 0.025 predecessors took 13859.634 and 14809.775 worker-seconds, totaling
7.9637247222 worker-hours; the cost at 0.0125 is unmeasured. There is no promised
wall-clock completion time. If occupancy is not a decision target, the current
bounded axial result can stand while another science direction is prioritized;
a full additional facet grid is not automatically required.

Reproduce from the repository root with Node matching the project runtime and
the locked dependencies. Input roots may be restored elsewhere provided their
relative campaign structure and the 64 input hashes match. Both destinations
must be absent. The small table selects fields from the detailed readout; it
does not introduce another metric implementation.

```powershell
node evidence/hil-results-review-2026-10-21/facet/readout.mjs C:/Users/biao3/.codex/worktrees/hil-large-batch-oct11/snowflake/out/hil-large-batch-oct11 C:/Users/biao3/.codex/worktrees/hil-domain-seed-oct19/snowflake/out/hil-domain-seed-oct19 C:/Users/biao3/.codex/worktrees/hil-facet-pressure-oct19/snowflake/out/hil-facet-pressure-oct19 out/analysis-2026-10-21/facet/reproduced.json
node evidence/hil-results-review-2026-10-21/facet/compact.mjs out/analysis-2026-10-21/facet/reproduced.json out/analysis-2026-10-21/facet/reproduced-summary.json out/analysis-2026-10-21/facet/reproduced-inputs.json
```

[decision-summary.json](decision-summary.json) keeps all registered cumulative
and consecutive contrasts, timestep contrasts, terminal identities, and common-end
growth. [verification.json](verification.json) records executed commands, method
reuse, source parity, historical cost, and review limits. The detailed readout
is `out/analysis-2026-10-21/facet/readout.json`, 862577 bytes,
SHA-256 `8e82be945b74def9cf98c52ea44cdbd7634779333eb7cf663cda216c4da4bdeb`.
It retains the actual bracket states and attachment-envelope counts and is a
bulk analysis asset for the task's NAS preservation. Generation time and local
paths are provenance and may differ on rerun. No new simulations were executed.
