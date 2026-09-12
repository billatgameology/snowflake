# 0059 — Test early and late basal-width feedback

- Date: 2026-09-12
- Status: accepted under the maker's autonomous, bounded scientific-experimentation direction
- Charter impact: append a named early/late counterfactual to section 2.5; preserve ordinary
  operators, historical experiments and validation boundaries.

## Context and decision

The completed local-width comparisons retain the three-cell cavity lead at both temperatures,
but its seed-active and early everywhere-selected growth leaves initiation and continued
feedback entangled. Larger seeds would also change volume and diffusion. Test early versus
late exposure directly, with the same seed and a fixed physical-time cutoff, while extending
the matched growth window. These are discrete-model causal interventions, not a physical
material law, environmental history or validated SDAK model.

Add `experimentalBasalWidthHistory: { mode: "early-only" | "late-only", cutoffSeconds: number }`
only to the existing constant-environment local-width CPU experiment. Width selection is active
before the cutoff for early-only and from the cutoff onward for late-only; inactive basal
sites use the existing broad preparation. The active plan fixes threshold three and cutoff
twenty seconds, with broad, global-basal, full-width, early-only and late-only arms at both
temperatures in one larger matched domain. Temporal rows have their own
`post-phase10-basal-width-history-v1` identity. Existing row identities and meanings stay intact.

Select the phase from physical time at the beginning of a coupled update and keep it through
relaxation and fill. A step crossing the cutoff completes unchanged; switch at the next
relaxation and record the actual time. Preserve all accumulated state. This does not add an
arbitrary timeline, environment event, state reset or checkpoint format. The attachment spec
and active plan define the transition and finite readouts before implementation.

## Governing charter clause retained verbatim

Section 2.5:

> Local basal-width experiment (decision 0058, 2026-09-11): a separately identified constant-environment aggregate-v6 CPU experiment may select the existing M1 or no-dip basal kinetics using an integer exposed-terrace chord threshold, while retaining no-dip prism kinetics and geometric completion. This is an explicitly P4 mesoscopic width rule, not a measured molecular law, full M2 implementation or physical validation. The attachment spec defines its symmetric geometry and coupled Robin/fill evaluation; the active discovery plan registers the finite comparisons, observables and reused controls before implementation. Ordinary operators, historical evidence, checkpoint meanings and the separate Phase 7 path remain unchanged.

Retain this clause and append the temporal-experiment permission. Do not silently change the
full-history meaning of decision 0058 or call early-growth exposure seed-only.

## Consequences and alternatives

- Longer growth and a larger domain are not grid refinement; the existing fine-grid runs
  remain necessary for their own unresolved question.
- Early-only retains inherited geometry and partial fill. Track advancing post-switch openings,
  not merely cavity survival. A weak late-only intervention may reflect negligible selected
  demand on its grown surface; record that limit.
- Defer a seed-radius matrix and another threshold scan. They do not isolate the current
  history question as directly, and are not needed merely to fill idle cores.
- Reuse the runner and readout, with one stable scientific checkpoint. No historical source-pin
  repairs, C0V/S6 recovery or additional assurance framework follows.
