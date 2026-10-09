# Saved pressure structure, 2026-10-08

Internal post-hoc model-development analysis by Codex/GPT-6 with shared context. No simulations,
parameter changes, physical-validation claim or grid/domain qualification. `pressure.json` is the
reproducible result of `pressure.mjs`; input hashes match the previously pinned HIL report.

Scope: six **both-dip** rows, -6 C, fractions .10/.20, pressures 50,662.5 / 101,325 / 202,650 Pa,
N64, dx 0.35 um, the same radius-two/thickness-one 19-site seed. “Both” names the kinetic arm;
this analysis does not add or reanalyze the neither/basal-only/prism-only controls. Those remain
in the earlier HIL report. Occupancy includes seed sites and excludes partial fill; it is not mass.

## Fraction .20: outer-span equality hides taper and a deeper narrow opening

At extent-21 stops, the increasing-pressure occupancies are **3,607 / 3,317 / 2,787**. All have
i/j/axial spans 21/21/19 and the central plane has exactly **277 occupied sites**. Coordinate-set
comparison shows the high-pressure endpoint is a subset of the middle endpoint, which is a subset
of the low endpoint. This is an exact statement about these three recorded discrete endpoints,
not continuous-time containment or a general pressure law.

The following counts are for one signed axial plane at each absolute offset from the seed plane;
negative offsets have the same counts. Multiply nonzero-offset rows by two for the whole crystal.

| Absolute axial offset (cells) | 0.5 atm | 1 atm | 2 atm |
|---:|---:|---:|---:|
| 0 | 277 | 277 | 277 |
| 1 | 271 | 271 | 265 |
| 2 | 265 | 265 | 246 |
| 3 | 253 | 234 | 216 |
| 4 | 216 | 216 | 174 |
| 5 | 192 | 174 | 132 |
| 6 | 162 | 138 | 84 |
| 7 | 132 | 114 | 72 |
| 8 | 102 | 72 | 36 |
| 9 | 72 | 36 | 30 |

Of the **820** low-minus-high occupied sites, **792** are in hex-coordinate radial shells 4–9,
and **28** in shells 0–1; shells 2–3 and 10 have zero difference. Thus the difference is mainly
outside the narrow central opening. Axially, 696 of those 820 sites lie at absolute offsets 4–9.
The largest per-plane difference is 78 sites at each of offsets -6 and +6. These exact partitions
come from `groups[1].pairwise[2].endpoint`; no geometric region was used to select new runs.

The existing cavity helper finds seven-site empty-center components enclosed in the plane and
connected to the exterior by a straight empty-axis route. They start at absolute offsets
**4 / 3 / 2** and continue through offset 9: **12 / 14 / 16 signed planes**. These are layers of
open structure, not counts of independent cavities. The fully occupied central-axis intervals
therefore contain 7 / 5 / 3 layers. The pattern is both reduced off-equator occupancy and a
deeper narrow center opening. The outer envelope alone hid these distinctions.

This is still a size-endpoint comparison at different ages. At the common physical age
**5.783881122200879 s**, counts are **3,607 / 1,259 / 411**, with maximum extents **21 / 15 / 11**.
The middle-pressure time bracket is 5.774610582708710 / 5.803111851866906 s; the high-pressure
bracket is 5.749689428007412 / 5.795754364011458 s. Both bracketing records have the same
occupancy in each of those two rows. This does not turn the size comparison into matched-age
growth or isolate transport at fixed geometry.

Between first reaching extent 17 and the terminal event, new attached-site counts are
**1,986 / 1,818 / 1,518**, added to starting counts 1,621 / 1,499 / 1,269. The low-minus-high
count gap grows from 352 to 820 over these independently size-aligned intervals. Their durations
are approximately 2.122 / 3.789 / 6.767 s and their starting axial spans differ, so these increments
must not be described as a common-time deposition-rate comparison.

## Fraction .10: more occupancy does not imply a shallower opening

Endpoint counts rise with pressure: **3,759 / 3,883 / 4,229**, while the center-air structure
extends deeper. The signed enclosed-center layer counts are **4 / 12 / 14**. Their first absolute
offsets are 8 / 4 / 3, continuing through 9; offset 10 is laterally open in all three cases.
All enclosed layers have a straight outward axial-opening witness. The low-pressure enclosed
components contain seven sites; the middle/high rows also have 19-site components at offsets ±9.

The center-plane counts are 217 / 217 / 265. The first two rows end with i/j/axial spans 17/17/21,
but the high-pressure row has 19/19/21. Relative to the low endpoint, the high endpoint gains
576 occupied coordinates and lacks 106, for the net increase of 470; these shapes are not nested.
Increased lateral occupancy can coexist with a deeper central opening. This rules out interpreting
the total count alone as a compactness or hollowness measure in these comparisons.

At common physical age **13.566573307401567 s**, counts are **3,759 / 1,417 / 509**, with extents
21 / 13 / 11. Middle-pressure bracket: 13.515231696523017 / 13.569289171310817 s; high-pressure
bracket: 13.501093758842972 / 13.588791467392307 s. The before/next counts agree in each.
The JSON preserves complete plane and radial profiles at both brackets, all terminal profiles,
and the distinct extent-17-to-terminal increments.

## Interpretation and reproducibility

The pressure lead is now a specific spatial question: how do the growth of off-equator layers
and the central opening change with transport and forcing? It should no longer be framed only
as a terminal aspect-ratio response. A future selected comparison could track these same profiles
over a longer window or changed grid spacing. This analysis neither chooses nor launches it.

Hex-coordinate radius is `max(abs(di), abs(dj), abs(di + dj))`, not a Euclidean radius. A full core
is the largest complete centered integer hex ball in one plane; -1 denotes a missing center.
The cavity helper examines the empty-center component only. A center-occupied plane does not
rule out off-axis voids, and this is not a complete 3D cavity census. New-growth subset profiles
describe where sites attached; their apparent voids are not whole-crystal cavity classifications.
The narrow openings are lattice-scale and their physical widths are not qualified by these data.

The script reconstructs every event from seed plus unique attached indices, checks recorded
coordinates/counts/extents/aspect ratios, checks each plane and radial sum against total occupancy,
and checks all 24 raw spec/result/exit/event files against the prior report's hashes. A separate
direct coordinate-set calculation, without the shared seed/geometry helpers, rederived the .20
820-site difference and its 28/792 central/outer split. That is an author cross-check, not an
independent-model review or physical validation. An initial invocation used a nonexistent
`termination` result field and stopped before producing output; corrected to the actual
`stopReason` field and reran successfully. Full repository verification is recorded by the parent
follow-up report, separately from this calculation.

Rerun from the repository root with the two preserved campaign roots and an absent output file:

```powershell
node evidence/hil-bld-joint-review-2026-10-08/followup/pressure.mjs C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/discovery-resume/batch1-hil-resumable C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-exploration-batch2/batch2-hil out/pressure-followup-rerun.json
```

The script refuses to overwrite an existing output. Relocated input paths and generation time may
differ on rerun; scientific fields should agree. Raw inputs are read-only throughout.
