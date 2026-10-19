# Completed exploration review — October 18, 2026

The completed batches support several distinct model-development leads. The strongest immediate
experimental candidate is the prism-sensitive cold core/tip contrast at -14.4 C. Seed response
and environmental history also merit focused follow-up. The warm refinement comparison remains
incomplete: leave its two early-intervention cases running before deciding whether to expand it.

This is the maker-requested retrospective analysis and options discussion, not a new campaign
freeze, launch authorization, Phase 10 closure or physical-validation claim. Solo scientific
research; hostile actors excluded. No simulation, producer change or capacity probe was made.

## Execution state

The October 18 observation around 21:09 PDT records **four of six warm rows complete**: both
coarse rows and both fine broad controls. The thin early row is at extent **49/57**, update
**2291**; the thick early row is at **51/57**, update **2267**. Both have live CPU, fresh converged
checkpoint metadata, no recorded integrity errors and empty stderr. These observations do not
support a reliable completion estimate. The coordinator remains live; do not start another writer.

The October 12 wave has **191 successful endpoints and one repeatable solver failure**. The
October 11, October 10 and supplement batches have **102, 10 and 8** completed endpoints.
The failed high-pressure cooling row remains excluded; the single requested unchanged retry
reproduced its subnormal boundary-iteration failure. Do not retry it unchanged again.
Sources: [current status receipts](status/), the active plans and their original completion records.

## What the results say

### Cold structure: a useful anchor, a weaker cold tail

The [cold review](cold/findings.md) covers 124 cold rows, including all 64 new October 12 rows.
At -14.4 C / forcing fraction .10, tip radius eight and half the shared plateau duration, the
tip-minus-full-core gaps are **0 / 0 / 2 / 2 lattice-radius cells** for neither / basal-only /
prism-only / both preparations. This agrees at CFL .05, .025 and .0125, including adjacent-event
choices. The outer two rings independently distinguish full occupancy from the prism-enabled
structure. This is a stronger lead than a lone terminal shape difference.

At -20 C, fraction .15 gives a one-cell prism contrast at tip eight in both tested timesteps,
but tip nine differs between timesteps and the coarse next-event bracket already removes it.
The new temperature/forcing map is stage-dependent, not a sharp or monotonic transition.
Prioritize representation and domain checks of the -14.4 C anchor over another broad cold grid.

### Starting seeds affect new growth, with later catch-up

The [seed review](seed/notes.md) covers all 64 October 11/12 seed rows. After subtracting the
initial geometry, tall seeds accumulated **2–6 extra axial layers** in all **32** condition/arm
pairs at each condition's common age. This is more than simply retaining their taller start.
It does not mean continuing faster growth: of **24** later shared windows, **14** tie, **7**
favor the tall seed, **1** shows wide-seed catch-up and **2** are bracket-sensitive.

At a single **16.6289686258 s** age across all fraction-.15 rows, the combined dip preparation
increases new axial growth at -6.5/-7.5 C, becomes stage-sensitive near -8.5 C and reduces it
at -9.5 C. Basal-only and prism-only interventions pull in opposite axial directions in that
comparison. At -9.5 C, lower axial growth coexists with greater lateral growth and occupancy.
The implemented response is directional, not simply more or less growth. Seed volume, surface
and diffusion environment differ along with shape; this is not isolated physical shape causation.

### Temperature history persists; an earlier equality was too narrow

The [history/pressure review](history-pressure/notes.md) reconstructs 111 successful history/static
rows and confirms all **79** source-static scientific prefixes, including previously deferred
experimental controls. All **24** matched CFL .05/.025 histories agree in axial additions in
the three selected full, early and later common-time windows. Some lateral additions and
occupancy differ, so this is not complete trajectory convergence.

The old warming result of **10/10/10** later axial layers across switch stages becomes
**12/10/10 in both timesteps** when the common window changes from 41.1727 to 40.7738 s.
At the other forcing, **8/8/8** becomes **8/6/8**. The earlier equalities remain true for their
original windows; they do not demonstrate erased growth memory. Integer layer timing makes
the observation window part of the scientific question.

For warming at fraction .20, the selected later window gives the early-switch M1 case **0.70 um
more new axial span** than the late switch at all three pressures. Other forcing/preparation
combinations differ or reverse ordering. Pressure changes coupled growth histories; these
comparisons do not isolate a universal pressure law. Low/high-pressure histories have not yet
earned the normal-pressure timestep qualification. The failed cooling member remains missing.

### Warm refinement: the completed controls supply a useful baseline

The unchanged cavity analyzer read only completed trajectories; its two pending entries do not
read live event streams. At the common **9.8 um largest lattice-coordinate center span**:

| Completed row | Physical age (s) | Axial center span (um) | Open-layer envelope depth (um) | Occupied-cell volume (um3) |
|---|---:|---:|---:|---:|
| Coarse broad | 68.8833 | 3.50 | 0 | 224.3074 |
| Coarse early | 89.3148 | 7.70 | 3.50 | 459.4199 |
| Fine thin broad | 56.7035 | 3.50 | 0 | 219.5407 |
| Fine thick broad | 59.2332 | 3.85 | 0 | 239.8791 |

All witnessed-open intervals in the three broad controls have zero tip advance and zero depth;
their openings reseal within the saved history. The coarse early row retains open planes while
its tips advance, including new post-switch openings. At the common 56.7034715316 s age, it has
3.15 um witnessed-open envelope depth, while the broad controls have zero. The fine thick control
has two temporary open surface layers at that age, illustrating why an opening count alone is
insufficient. Signed layers are not independent cavities; occupied-cell volume is not ice mass.

Source: [warm/cavity-readout.json](warm/cavity-readout.json), per-row `analysis.frames`,
`sizeSelections`, `physicalTimeSelections` and `straightOpenPlaneIntervals`. Ages differ in the
size table. Seed representations differ between grids; agreement of some broad-control measures
does not establish convergence. **The fine early/broad comparisons remain unanswered.**

## Next-step options

| Priority | Next discriminating work | What it would decide | Remaining design work |
|---|---|---|---|
| Continue | Finish the two warm early cases and compare each with its completed broad control at shared size and age. | Whether the inherited opening survives changed grid/seed representation. | Existing frozen targets and restart contract remain in force. |
| Recommended new experiment | Four candidate N96 cases at -14.4 C / fraction .10, four facet preparations, dx .35 um, seed2/1, CFL .05 and extent29, compared with the N64 controls. Use retained prism-bearing fields to choose observations; reserve refinement for a later decision. | Whether the strongest cold structural effect survives representation/domain changes. | Confirm this candidate design and cost it before approval. Existing N64 controls total 6.5407 worker-hours; that does not forecast N96 duration. |
| Smaller alternative or companion | Eight seed cases at CFL .025: -6.5/-9.5 C, fraction .15, two seeds, both/neither preparations, N64, extent29. | Whether the net positive/negative axial response survives smaller updates. | Existing eight controls total 17.3199 worker-hours; this is a baseline, not a forecast for changed CFL. |
| Follow-up after saved-data review | Plot history growth over broad shared windows; if the pressure contrast remains useful, consider four low/high-pressure warming histories plus four statics at CFL .025. | Sustained new-growth differences versus layer-timing effects, then pressure/timestep sensitivity. | Choose windows and exact cases before freezing; derive a workload estimate from their completed controls. |
| Separate maintenance task | Reproduce and diagnose the failed subnormal boundary iteration in isolated development. | Whether a governed numerical correction can recover the missing comparison. | No convergence relaxation, fixed-producer edit or unchanged retry. |

My recommendation is to discuss this twelve-case candidate: four cold domain comparisons plus
eight seed timestep cases, all stopping at extent29 (9.8 um maximum center span). The [historical
cost baseline](candidate-baselines.json) preserves exact controls and its non-transferability limits. Avoid another broad temperature grid or an uncosted fine-grid campaign.
HIL remains the default host; propose BLD only if the selected, estimated work is multiple days.
No exact new roster or runtime promise is established by this review.

## Place in the project

Phase 10 remains exploration under ADR 0062. We now have more specific, distinct leads in cold
structure, seed response and environmental history, with warm memory awaiting its key refinement
comparison. The next stage is to discriminate between competing explanations and qualify their
numerical/representation limits. These results are useful model knowledge; they do not yet show
new science about real snow crystals. Physical claims would need source comparison and the
applicable registered validation work. Phase 7 remains on hold; retired S6 stays closed.

## Reproduction, retention and assurance

The child notes identify exact inputs, hashes, commands, matching rules and limitations. Selection
recipes reuse established reconstruction and bracket functions; new scripts select groups and
package contrasts. The warm command, from fixed warm producer 838c294, was:

```powershell
node runner/src/post-phase10-cavity-analysis.ts campaign out/warm-refinement-hil C:/Users/biao3/Documents/GitHub/snowflake/out/analysis-2026-10-18/warm/cavity-readout.json
```

It exited zero. To replay selection recipes, restore them to their recorded `out/` paths and use
fresh output names; they refuse existing output files. Preserve fixed producer/source bindings.
Detailed derived cold/seed files in primary `out/analysis-2026-10-18/` are reproducible staging,
not a second durable authority. This bundle retains concise claim tables, source bindings and
recipes as project-owned tracked evidence under ADRs 0038/0051. Bulk event streams, checkpoints
and fields remain local in their five output-owning worktrees pending governed NAS publication
and fresh restore under ADR 0061. Nothing was pruned, closed, served or backed up by this review.

Three Codex/GPT-6 subagents with inherited context produced the cold, seed and history readouts;
the root author produced the warm readout and synthesized their limits. This is not independent
physical validation or a phase-gate adversarial review. Verification results are recorded in [verification.json](verification.json). The exact full test
run returned 235 passing and five failing files: a two-line progress-index overrun (corrected),
and four failures involving the unavailable Z: drive. No full-suite-green claim is made. The
result reconstruction and targeted cross-check remain distinct from these repository tests;
a test suite cannot establish the scientific interpretation. NAS access must be restored before
backup or worktree closeout. The host is reachable, but the existing Z: mapping is disconnected
and both mapped/UNC access reject the current Windows credentials (error1326). This review did not remap the share or bypass its identity checks.
