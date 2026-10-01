# Completed cavity and growth-history wave — 2026-10-01

These are deterministic model-development findings, not a physical validation or a new phase gate.
The original Phase 10 remains complete-negative. Scientific expansion is paused for the requested
three-machine consolidation.

## Findings

**Early growth leaves a persistent morphological effect.** In both early-only rows, the width-three
basal enhancement switched off after about twenty simulated seconds. The original fourteen
straight-open, laterally enclosed planes remained open through termination; eighteen additional
planes at -4.5 C and twenty-two at -5 C opened after the switch and survived to the endpoint.
Both axial tips advanced another 3.5 micrometers after switch-off. All subsequent recorded
updates have zero selected basal cells and zero selected kinetic demand. This is continued
hollow growth under the ordinary broad preparation after the early intervention, not simply a
stored empty pocket. Early exposure includes growth and cavity onset; it is not a seed-only test.

**Continued enhancement changes the outcome, but is not required for that finite persistence.**
At each temperature's common physical age, full-history versus early-only has respectively
48 versus 24, and 30 versus 26 straight-open planes. The corresponding axial spans are
16.8 versus 8.4, and 10.5 versus 9.1 micrometers. These are discrete at-or-before states at
requested ages 106.34616701444007 and 97.92558819520163 seconds; exact event times and next-event
brackets are retained in the reports. Terminal size alone is an inadequate time comparison.

**Starting late did not reproduce deep cavities in these two rows.** Late-only runs terminate
with two/four straight-open planes and maximum depth 0.35 micrometers, versus 32/36 planes
and 5.6/5.95 micrometers in early-only. Maximum tip advance during any new post-cutoff opening
interval is only 0.35 micrometers for late-only. Late exposure was appreciable: selected demand
accounts for 23.1923%/25.8068% of post-cutoff basal kinetic demand. This is a result for the
registered width-three, twenty-second intervention, not a general exclusion of later feedback.

**The original cavity contrast survives the tested grid/seed changes, but its dimensions are
not grid-qualified.** All ten M1 rows in the twenty-row campaign retain deep straight-open
enclosure at their 9.8-micrometer largest center span. Nine no-dip endpoints have no such
enclosed open planes; the fine thick-seed -5 C no-dip endpoint has two surface pits with zero
depth and zero tip advance during those still-open intervals. No-dip can have transient
enclosure earlier, so this is a persistence/depth contrast, not creation versus no creation.
The coarse M1 cases add four waist planes beyond their seeds, as do the fine M1 cases:
1.4 versus 0.7 micrometers of added inclusive thickness. A waist tied to cell count weakens a
selected-physical-length interpretation. Fine seed thicknesses bracket the coarse seed's
physical thickness, but do not bound nonlinear outputs. These fine runs test the original
M1/no-dip preparations, not the later width-conditioned rule.

## Endpoint measurements

Values below are copied from each report's final frame. Plane counts are signed axial layers,
not counts of independent cavities. Depth is measured below the occupied axial envelope.

| Temperature | Arm | Simulated seconds | In-plane / axial center span (um) | Open planes | Depth (um) | Full-probe waist planes |
|---|---|---:|---|---:|---:|---:|
| -4.5 C | Broad | 188.698512 | 18.2 / 7.0 | 0 | 0 | 21 |
| -4.5 C | Global basal dip | 106.346167 | 8.4 / 18.2 | 44 | 8.05 | 5 |
| -4.5 C | Full width-three | 114.780293 | 9.1 / 18.2 | 50 | 8.75 | 1 |
| -4.5 C | Early-only | 225.335402 | 18.2 / 11.9 | 32 | 5.60 | 1 |
| -4.5 C | Late-only | 202.072642 | 18.2 / 9.1 | 2 | 0.35 | 23 |
| -5 C | Broad | 195.437359 | 18.2 / 8.4 | 2 | 0 | 23 |
| -5 C | Global basal dip | 97.925588 | 8.4 / 18.2 | 44 | 8.05 | 5 |
| -5 C | Full width-three | 252.194788 | 18.2 / 16.1 | 46 | 7.70 | 1 |
| -5 C | Early-only | 229.571045 | 18.2 / 12.6 | 36 | 5.95 | 1 |
| -5 C | Late-only | 215.131152 | 18.2 / 10.5 | 4 | 0.35 | 27 |

Sources: [warm history](history-t4p5.json) and [cold history](history-t5.json), fields
`rows[].analysis.frames`, `physicalTimeSelections`, `basalWidthHistory`, and
`basalWidthObservation.cutoffExposure`. Every five-arm group is admissible and matches its
recorded nonkinetic controls. Full/early recorded prefixes agree through 263/282 updates;
broad/late prefixes agree through 223/243 updates. Actual early switch times are
20.07286709255639/20.01372021355368 seconds; late switch times are
20.04711557887508/20.18371972830376 seconds. This checks recorded quantities, not all
unrecorded solver state.

The [grid/seed report](cavity-comparison.json) contains all twenty admissible rows. Coarse
baseline M1 waists are 5 planes / 1.75 um; fine thin-seed waists are 5 / 0.875 um and fine
thick-seed waists are 7 / 1.225 um. At the common group ages, fine thin -4.5 C no-dip still has
two zero-depth open surface planes; retain this rather than claiming that every no-dip
trajectory is empty of enclosure. Sparse pre-update field snapshots bracket onset, but their
coarse temporal sampling and lack of a field intervention do not establish the initiation cause.

## Domain comparison and scientific limits

At common largest center span 12.6 um, N80 and N112 full width-three cases both have 34
straight-open planes, 5.95 um maximum depth, and a one-plane waist. However, at -4.5 C,
simulated arrival time changes from 82.56715479712955 to 69.73515009056237 seconds and
in-plane span changes from 7.7 to 7.0 um; at -5 C, from 128.04413898363663 to
133.84660494661247 seconds and from 11.2 to 11.9 um. The qualitative lead persists; this is
not domain independence. Compare `sizeSelections` and corresponding frames in the new
reports with endpoints in the byte-preserved [prior warm](prior-width-t4p5.json) and
[prior cold](prior-width-t5.json) reports. Broad and global-basal controls also preserve
their waist/open-plane counts at this size; timings and occupied-cell counts differ.

These are one-seed, zero-noise deterministic interventions at two temperatures with a chosen
width threshold and cutoff. Persistence is only through each recorded stop. Largest
i/j/k center spans are lattice-coordinate spans and endpoints have unequal ages and axes.
The straight-axis opening is a sufficient witness, not a general three-dimensional cavity
classifier; absence of that witness does not prove a sealed void. Occupied-cell volume is not
total deposited mass. Thresholds and the cutoff are P4 choices, not measured material
parameters. The finer-grid results do not validate the width-three history intervention.
No conclusion about physical SDAK or laboratory agreement follows.

**Recommended next experiment after consolidation:** test whether the early-history effect
survives physically matched grid/width and initialization perturbations, with demonstrated
pause/resume support before launching. Split independent case groups between the two PCs
from one common producer/runtime; retain the present 28-worker cap on this PC and determine
the second PC's available budget. Broader seed, pressure, core/tip, and abrupt-history leads
remain open; this finite wave does not exhaust the project. No next wave is launched here.

## Preservation and reproduction

The five comparison JSON files are exact copies of the named local reports, not rewrites.
The three new reports were generated with the unchanged analyzer at clean commit
`9658cd37c423c80fe82823c0e934f2072fc39e25` on Node v24.13.1; each records its exact command.
The fine/coarse producer is `eb7b5c4f932939e3b40d686a996796fdaceb1894`; history producer is
`a8fa8b3fe3f6665b77cdcd13adde9035d06b451b`. Prior controls retain their own producer records.

Three archives preserve 487 files / 324451935 uncompressed bytes, including the thirty
current-wave rows, eight prior width-comparison inputs, campaign/launch records and the
recorded history implementation checks. [raw-inventory.json](raw-inventory.json) pins every
member by original relative path, length, and SHA-256. Fresh restoration to
`out/restores/post-phase10-wave-2026-10-01` on this PC matched every member against its source.
Archive bytes and all report files are also pinned in the root evidence manifest.

Restore in a fresh directory, retaining the contained `out/` paths:

```powershell
New-Item -ItemType Directory -Path out/restores/wave-copy
tar -xzf evidence/post-phase10-wave-2026-10-01/cavity-runs.tar.gz -C out/restores/wave-copy
tar -xzf evidence/post-phase10-wave-2026-10-01/history-runs.tar.gz -C out/restores/wave-copy
tar -xzf evidence/post-phase10-wave-2026-10-01/prior-width-runs.tar.gz -C out/restores/wave-copy
node runner/src/post-phase10-cavity-analysis.ts campaign out/restores/wave-copy/out/post-phase10-cavity/campaign-2026-09-08 out/restores/wave-copy/cavity-recomputed.json
```

For each temperature, run the analyzer's `rows` command on the restored history directories
in broad/global-basal/full/early/late order, passing
`--center-spans-um=4.2,5.6,7,8.4,9.8,12.6,18.2` and a new output path. Copy the exact original
argument list from the report provenance and replace only the restored root and output path.
Regenerated source paths, timestamps, and analysis-head metadata will differ; compare the
scientific quantities. No solver rerun is needed.

This publication preserves the inputs backing this report. It is not an archive of every
older adaptive campaign or every ignored worktree file. No local outputs or branches were
deleted, and their remaining retention must be resolved before removing worktrees.

## Review and verification

A bounded non-author GPT-6/Astra review shared conversation context and read the three new
reports, registered protocols, geometry definitions, and retained N80 comparisons. It
independently rebuilt both early-only occupancy histories from the raw attachment events and
seed, measured cutoff/end geometry, and checked zero post-switch selected demand, zero
central-axis attachment additions, and no duplicate additions. It reproduced the fourteen
original surviving planes, eighteen/twenty-two new planes, and 3.5 um tip advance. No scientific
blocker was found in that scope. The reviewer did not rerun simulations, every report
calculation, source extraction, full tests, preservation/restore, or Git publication.

Root generated the three reports, checked matched configurations and limits, copied their exact
bytes, and verified the complete archive restore. Publication-check results are recorded in
the active plan and the check artifacts saved with this bundle.
