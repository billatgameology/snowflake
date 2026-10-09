# HIL / BLD joint results — internal exploratory review

All 114 cases have checked size endpoints: HIL 56 plus 16, BLD 42. The useful result is a set
of more specific questions about growth history, facet response and transport. These are finite
discrete-model observations, not validated ice physics. No successor roster or launch is selected.

| Track | What the completed cases show | Decision value |
|---|---|---|
| Warm cavities | At both temperatures, early enhancement switches off near 20 s; existing openings survive, four new signed open layers survive, and tips advance another 1.05 / 0.70 um with zero selected demand afterward. | Growth memory remains worth testing against grid spacing and seed/width representation. |
| Cold core/tip structure | At matched tip radius and physical plateau age, prism-only and both arms share the larger core-to-tip gap in eight of nine groups. The -18 C / .10 group has no gap contrast. | Inspect the prism-side field around a strong anchor and the exception before inventing a new width law. |
| Seed response | At -8 C, wide-seed both-minus-neither aspect-ratio difference is -0.105263 at size 21 but +0.049536 at the earlier common four-arm age. | Follow the response over growth and numerical refinement; a smaller temperature increment alone would not resolve this ambiguity. |
| Pressure | At fraction .20, both-arm outer spans and aspect ratio tie across 0.5/1/2 atm, but attached occupancy is 3607 / 3317 / 2787 and time to size 21 is 5.784 / 10.215 / 18.170 s. | Extract saved interior/plane structure before adding pressure levels. Occupancy is not accreted mass. |
| Environment history | M1 cooling at switch extents 7/11/15 gives endpoint aspect ratios .382 / .600 / .819; warming gives .895 / .684 / .474. Differences remain at common elapsed time after each event. | A selected longer post-switch window can test decay versus persistence. Return-loop machinery is premature. |

Exact values, comparison sets, formulas, input hashes and physical-time brackets are in the
[HIL report](hil/README.md) and [BLD report](bld/README.md). The cold gap is a post-hoc integer
hex-radius measure, not a newly registered physical observable. Selected gaps differ by only
one or two cells; spatial and numerical qualification matter. Warm signed layers are not separate
cavities. Continued enhancement still changes matched-age growth; the early-only finding does
not make it irrelevant. Equal maximum extent can mean unequal axial/lateral sizes and ages.

## Recommendation for discussion

Maker allocation correction, 2026-10-08: keep all development, testing, analysis and scientific
runs on HIL for now. Split with BLD only when the work is expected to take multiple days, using
representative timing to justify the estimate. This supersedes the earlier two-host recommendation.
The complementary scientific priorities remain seed/facet persistence, existing pressure interior
profiles, warm grid/seed-width qualification and selected cold prism comparisons. These are
proposed priorities, not frozen workloads or permission to start simulations.

The immediate engineering prerequisite for finer grids is concrete: current discovery checkpoint
code limits state to `64 ** 3` cells and 64 MiB (`core/src/discovery-resume-checkpoint.ts`). The
previously discussed N126 refinement exceeds that bound. If the maker selects refinement, extend
and verify that bounded state path, demonstrate a real larger-grid pause/resume, and measure each
host's actual memory/concurrency before registering and dispatching finite loads. Do not silently
increase old terminal targets or reuse a short N64 capacity probe for the new configurations.

No new source/parameter freeze, physical claim, Phase 7 work or S6 execution is included here.
The approved exploration portfolio remains the context; this review narrows choices for discussion.

## Preservation and reproduction

The three `*-output.tar.gz` files and their `*-archive.json` inventories retain every original
HIL execution-worktree output: stopped observations, both completed campaigns, failed tails,
checkpoints, probes and controls. All decompressed members were compared by path/type/length/hash
to their source inventories, including an independent reviewer recheck. All local originals remain
under primary `out/hil-retired-2026-10-08/`, using the worktree labels as children. This relocation
is local staging custody; it does not claim a new NAS collection or independent backup.

BLD's raw inputs remain in the previously pinned `evidence/bld-first-batch-2026-10-08/` archives
and collection `bld-first-batch-output@2026-10-08`. Its HIL restore is retained under
`out/hil-retired-2026-10-08/hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/`.
The whole integration output tree, including pickup controls, is retained rather than pruned.
Use `retirement.json` for final file counts, exact paths, source heads and removal observations.

Analysis is read-only with respect to saved runs. To repeat it from primary, follow each child
report's commands but invoke the preserved scripts under this evidence bundle; write fresh results
to `out/`, never overwrite these published reports. HIL's v2 analysis includes the four static
history controls; its first draft omitted them and remains superseded in local staging.
The recorded BLD generating script is retained separately from its later output-path convenience
change. Neither script adopts or evolves a checkpoint.

HIL's two producers have identical numerical core/solver/discovery evolution bytes. BLD retains
its distinct producer and resume implementation under `run/bld-first-batch-2026-10-08`; the
inspected saved-observation helpers and parameter/metric blobs agree. This supports the stated
within-track comparisons, not cross-producer trajectory equivalence or checkpoint compatibility.
Exact `npm.cmd test` at clean `862ff1f` passed 235 files / 3045 tests, with 23 skipped;
Rule 7 and both typechecks are included. [Verification](verification.json) retains the measured
exit and raw logs. The [bounded review](review.json) independently rederived the load-bearing
findings and states its limits. A passing suite is not a scientific gate or validation result.
