# 0055 — Bounded post-Phase-10 facet isolation

- Date: 2026-09-09
- Status: accepted under the maker's 2026-09-08 autonomous, bounded science direction
- Charter impact: add a separately named development experiment; preserve ordinary operators,
  historical evidence, closed Phase 10 and all validation boundaries.

## Context and decision

The completed coarse cavity comparison in the active discovery plan distinguishes enclosure
persisting through the M1 stops from transient enclosure followed by closure in matched no-dip
runs. Fine-grid qualification remains in flight. A four-corner intervention on the implemented
basal/prism dip choices can identify their effects in this discrete model without waiting for a
claim of physical/grid independence. This changes the plan's earlier serial order explicitly.

Add a finite `experimentalFacetDips` opt-in to the CPU LK operator: `both`, `neither`,
`basal-only`, `prism-only`. Prepare constants from existing M1/no-dip functions at construction;
do not change coefficient evaluation, the shared Robin/fill pair, lattice closure, smoother,
monopole lag, timestep, noise or ledger. The opt-in requires aggregate-v6 and M1 as its base
parameter metadata. Its separate identity is essential: that base tag alone does not describe
mixed or neither-dip kinetics. This first experiment is constant-environment only. Existing
checkpoint formats do not identify these experiments: reject resume export and timeline events;
the dedicated runner retains explicitly identified events/results, not ordinary LK checkpoints.
Ordinary construction and existing checkpoint meanings remain unchanged.

Run only four new baseline-sized hybrid rows at the two warm cavity anchors. Reuse the four
completed ordinary controls after nontrivial both/neither numerical equivalence checks. The
active plan freezes the roster, observations and stopping rules before implementation. Fine
results still govern any grid-robust interpretation. This is neither width-dependent SDAK nor
validation against nature.

## Governing clauses retained verbatim

Charter §2.5:

> The consequence to hold onto: temperature is an input to the physics, not a label applied afterward. α_basal(T, σ_surf) and α_prism(T, σ_surf) are computed each step from the local supersaturation the diffusion field delivers, and the plate↔column habit is an output of their competition rather than a knob. This is what allows the model to be wrong — and therefore worth testing (§3.2, Phase 6).

Phase 10:

> Every source or result inspected in Phase 10 is Phase 10 development evidence while retaining its underlying historical role. Phase 8 artifacts remain byte-identical and their roles and splits are not rewritten; the Phase 8B successor remains zero-held-out. Phase 7 retains product, GPU-parity, and the four held-out-validation families, and only its separately gated, value-blind held-out comparison may grant a new validation label. Phase 9 outputs retain development-only labels. Phase 6 evidence is read-only. `GGThreshold` and `LibbrechtKinetics` remain unchanged; C0V may verify but not amend their scientific contracts.

The new paragraph beside §2.5 authorizes this post-phase experiment; it does not amend those
historical Phase 10 obligations or reopen C0V. No physical mapping is silently replaced.

## Alternatives and limits

- Waiting for all fine terminals: unnecessary for the narrower current-model intervention;
  retained as a prerequisite for grid-robust physical interpretation, not for starting this test.
- Copying the whole solver or repairing old source pins: adds maintenance without an independent
  physical mechanism. Use the small explicit preparation seam and preserve old producer commits.
- Arbitrary callbacks or a new checkpoint framework: outside this finite experiment.
- Rerunning equivalent full-length controls: unnecessary if shared-path equivalence passes;
  otherwise stop and resolve the numerical mismatch before launch.

No new source acquisition, Phase 7 work, hostile-actor assurance or automatic broad sweep follows.
