# W4 warm representation and timestep comparison — November 11

The warm preparation-history lead survives the new fine-grid timestep challenge. All 12 registered inputs are checked size endpoints; their complete cohort has common age 55.9289191088165 s. The existing cavity reconstruction and geometry helpers reconstruct events, check counts/extents, preserve actual switch boundaries, and calculate discrete at-or-before/next-event alternatives. The recipe computes all primary quarters/halves, same-representation and same-CFL secondary cohorts, exact 9.8 um selections and six matched post-switch pairs.

| Representation | Early depth at exact 9.8 um span, CFL .05 / .025 (um) | Early depth at common age, CFL .05 / .025 (um) | Broad depth at both CFLs and both selections (um) |
|---|---:|---:|---:|
| Coarse .35 um | 3.50 / 3.50 | 3.15 / 3.15 | 0 |
| Fine thin .175 um | 4.025 / 4.025 | 3.675 / 3.675 | 0 |
| Fine thick .175 um | 4.025 / 4.025 | 3.675 / 3.675 | 0 |

Depth is the maximum witnessed straight axial opening below the axial envelope, not a reconstructed count of independent cavities. All 12 size selections are exact within the existing arithmetic allowance; the displayed decimal 9.8 can serialize as 9.799999999999999. Adjacent-event alternatives retain each common-age depth in the table.

For the two new fine early histories, the actual switches occur at 20.00030205464298 and 20.00123231741368 s. Selected basal demand is zero afterward. Original open intervals persist through their endpoints, while their witnessed tips advance another 1.225 um. Both also form new post-switch open intervals; the initial full-probe waist does not thicken further after the switch. This is continued development of the prepared state after the intervention ends, rather than a frozen shape merely carried to a later output time. The same pattern appears at CFL .05.

A useful caution: in each same-representation matched post-switch window ending at the earlier pair endpoint, early and broad axial span increments are equal to arithmetic roundoff: 2.1 um coarse and 1.75 um fine. The distinguishing outcome is where material is added and whether an open profile is maintained; this comparison does not show generally faster post-switch axial advance. Early-only depth increases by 1.05 um in the coarse pair windows and .875 um in the fine pair windows, while the broad full-probe waist grows and the early waist does not. Pair window lengths differ and are not a common cross-representation time.

The result strengthens qualitative robustness for this particular preparation history, but does not establish general numerical convergence. Fine thin broad added full-probe waist at the size target changes from 3.50 um at .05 to 3.15 um at .025, despite identical zero deep-opening conclusion. Fine thin broad time to size changes 56.70347153158861 to 55.9289191088165 s; fine thick broad 59.23322494643029 to 58.6420455064971 s. Thus matching depth and overall spans does not mean all geometry or timing agrees. Fine/coarse endpoint early depths remain 4.025 versus 3.50 um. The fine seed thicknesses bracket coarse thickness but do not match voxel shape/volume, and two spacings cannot establish continuum convergence.

This also does not demonstrate rim-only kinetics: the new fine preparation selects approximately 99.84% of recorded basal kinetic demand before cutoff. Demand accounting is a model diagnostic, not measured physical uptake. Initial geometry, vapor, partial fill and other evolving state remain coupled.

Recommended next scientific question: use the already saved BLD width-3 versus width-4 early-5 and early-1 versus early-5 cases to identify the switch-near differences associated with later persistence. W4 removes one important numerical objection to pursuing that mechanism question. It does not alone select a new reserve, establish a physical snow-crystal mechanism, or explain the Nakaya diagram. R4's expensive fine-width follow-up may become useful after a discriminating prediction; it is not an automatic next launch.

## Provenance and limits

Exact commands from primary repository root:

```powershell
node out/hil-results-review-2026-11-11/warm/analyze.mjs
python out/hil-results-review-2026-11-11/warm/summarize.py
```

The recipe supports W4_HIL_ROWS, W4_BLD_ROWS, W4_OLD_ROWS and W4_ANALYSIS_OUT environment overrides. Inputs are six historical warm .05 rows (producer 838c294), two BLD coarse .025 rows (d7f76cb), and four HIL fine .025 rows (2f2d605). All 60 previously bound historical scientific input files were rehashed successfully against evidence/hil-results-review-2026-10-21/warm/inputs.json; reused-control-hashes.json records them. inputs.json binds row bytes, helper sources and recipe; summary.json is the compact report and warm-comparisons.json retains all requested comparisons. No production solver code, checkpoint or simulation was modified.

This is a shared-context Codex/GPT-6-family analysis lane. It executed saved-data calculations and endpoint checks, not a fresh simulation, physical validation, literature novelty assessment or independent model review. The parent can independently reconstruct headline geometry from events. Full detailed analysis remains local pending NAS publication; this lane does not claim backup completion.
