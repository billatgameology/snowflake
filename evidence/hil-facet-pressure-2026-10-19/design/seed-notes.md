# Registered seed timestep readout — October 19

The eight half-CFL endpoints strengthen the **net axial-growth contrast** at the two selected
temperature anchors. They do not establish general timestep convergence, qualify the separate
basal/prism contributions or isolate starting shape from other seed properties.

All sixteen registered old/new rows passed the existing endpoint checker. Exact coordinate
reconstruction reconciled 16,757 updates and 171,224 new attached sites; occupancy is not mass.
Matched row specs differ only in ID and CFL. Scientific worker/core/solver/bracket source is
unchanged between fixed producers `5a00e901` and `ff7b1a88`.

The common terminal age is 17.570948037089007 s, set by
`oct19-hil-seed-step-t9p5-f0p15-r3-h1-cfl0p025-both`. Registered quarter ages are
4.392737009272252, 8.785474018544503, 13.178211027816754 and 17.570948037089007 s.
The earlier 16.6289686258 s anchor is covered by every row and reproduced separately. All
increments subtract each seed's actual initial count and axial/Cartesian lateral center spans.
At-or-before and next-event choices remain explicit; no interpolation or confidence interval.

## Three decision-bearing findings

1. **The net axial ordering survives the smaller timestep.** At the common final age,
   both-minus-neither new axial layers are +6/+8 for wide/tall seeds at -6.5 C, and -2/-2
   at -9.5 C. The values and recorded ranges are identical at CFL .05 and .025. At the earlier
   anchor they are +4/+6 at -6.5 C (the coarse tall alternative reaches +8), and -2/-2 at -9.5 C.
   Each axial layer difference means .35 um of total center span. Across all four quarter-age
   observations, the sixteen matched temperature/seed/age contrasts have identical axial
   values at the two CFL settings. This covers those observations, not every intervening event.
2. **The seed advantage is accumulated early in this window.** At the common final age, tall
   minus wide new axial layers are +4 for both dips at -6.5 C and +2 for the other three
   temperature/preparation combinations, identically at both CFL settings. Yet tall-minus-wide
   axial additions are exactly zero in both the third and fourth quarter windows for all eight
   temperature/preparation/CFL combinations. Continuing growth does not mean continuing
   differential axial growth. Wide/tall seeds start at 37/35 occupied sites and 1/5 axial layers;
   subtracting initial extent does not control volume, surface or diffusion environment.
3. **A later occupancy contrast is not timestep-stable.** In the last quarter
   (13.178211027816754–17.570948037089007 s), -6.5 C wide-seed both-minus-neither newly
   attached sites change from +70 (recorded alternatives +22 to +94) at CFL .05 to -50
   (-86 to -26) at .025. Its axial contrast stays +2 layers. Thus the axial result cannot be
   summarized as all growth quantities being converged or unchanged. This is a finite-window
   occupancy difference, not deposited mass or a convergence-failure result.

## Smallest useful follow-up, for discussion

Prefer **four missing hybrid cases** at CFL .025: wide seed radius/thickness 3/1,
temperatures -6.5/-9.5 C, fraction .15, basal-only/prism-only, N64, dx .35 um, extent 29.
Reuse the four newly completed wide-seed both/neither cases and the four exact October 11
hybrid controls. This completes the numerical comparison of the four preparations for one
seed and asks whether the earlier attribution to opposing basal/prism effects survives.
It does not need another broad temperature sweep or repetition of completed controls.

The four historical hybrid controls consumed 8.9921602778 worker-hours at CFL .05. The
eight completed both/neither cases consumed 17.3198655556 hours at .05 and 27.9676727778
at .025 (new individual durations 2.6022880556–4.1294325 h). These are measured baseline
costs; a hybrid timestep cost multiplier is unmeasured and the aggregate ratio is not a law.
No launch or roster freeze is authorized by this recommendation.

Other options are narrower/different questions:

- A two-case .0125 repeat of the -6.5 C wide both/neither pair would discriminate the late
  occupancy sign, if that quantity becomes central to the decision. It is not necessary to
  pretend the presently qualified axial ordering also proves occupancy convergence.
- Four .025 midpoint cases at -8.5 C would address the stage-sensitive net balance. The
  previous midpoint already changed with observation window, so it cannot locate a unique
  physical transition; complete the facet attribution first if explaining the net contrast
  is the objective.
- Equal-volume seed shapes would address a distinct confound. The current simple prisms
  are near-volume matched, not equal; a replacement must specify valid seed geometries,
  surface/extent differences and matched controls. It is not a drop-in relabeling or a reason
  to discard the observed seed-dependent response. Exact volume matching still would not
  isolate all shape/surface/diffusion effects or create physical causality.

## Reproduction and evidence

`decision-summary.json` contains all registered cumulative/consecutive/anchor contrast tables,
input compatibility, endpoint checks and cost witnesses. `inputs.json` hashes all sixteen specs,
results, event streams and exit records. Full adjacent-event row brackets remain in
`seed-analysis.json`, 897,380 bytes, SHA-256
`764fdd8dfe4aa5e9b52cc83ad143abe3530d131bf01430ed329d70789a62766f`.

Executed from primary: `node out/analysis-2026-10-19/seed/analyze.mjs
out/analysis-2026-10-19/seed/seed-analysis.json`, exit zero. Use an absent destination to rerun;
the default output will refuse replacement. `python out/analysis-2026-10-19/seed/compact.py`
extracts the summary and input bindings and also exited zero.

`readRow` and the complete increments/window/contrast functions are exactly unchanged from the
previously checked `evidence/hil-results-review-2026-10-18/seed/analyze.mjs`; a textual comparison
passed. New scratch code only selects the sixteen registered rows and prescribed windows and
packages the existing outputs. No scientific module, solver, live output, gate or test changed.
The author is a Codex/GPT-6 analysis subagent with inherited context. The skeptical pass checked
initial subtraction, shared physical ages, brackets, window dependence and the mixed occupancy
result. No independent full-field, grid/domain, source-to-nature or held-out review was performed.
