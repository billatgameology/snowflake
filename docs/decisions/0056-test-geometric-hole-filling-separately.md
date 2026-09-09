# 0056 — Test geometric hole filling separately

- Date: 2026-09-09
- Status: accepted under the maker's autonomous hypothesis-testing direction
- Charter impact: add a separately named post-Phase-10 closure experiment; ordinary operators,
  historical evidence and validation authority remain unchanged.

## Context and decision

The active discovery plan's retained-event attribution shows that geometric completion, rather
than kinetic saturation, attaches the added M1 center-axis sites and many no-dip axis sites in
the selected warm cavity histories. That attribution does not establish what would happen without
the rule. Test that counterfactual while preserving the attachment coefficients and their coupled
Robin/fill use. It is orthogonal to decision 0055's dip intervention.

Add the finite CPU option `experimentalHoleFilling: "enabled" | "disabled"`. Absence retains
ordinary behavior; enabled is the explicitly labeled equivalence control. Disabled skips only
the geometric completion loop after kinetic fill. It does not disable rough-site kinetics,
kinetic saturation, permanent attachment, the monopole demand calculation or the timestep.
Require aggregate-v6, ordinary M1/no-dip preparations and constant environment. Do not combine
this option with experimental dip selection in the first experiment. Existing checkpoint formats
cannot identify the opt-in: reject ordinary resume export and timeline events, and retain the
runner's explicitly identified raw events/results rather than invent a checkpoint format.

The first roster is four disabled rows at the two warm anchors and two ordinary kinetic arms,
using the existing N64 cavity-baseline controls. The active plan freezes configuration, checks,
measurements and stopping rules before implementation. This counterfactual may create artificial
sealed lattice vacancies; distinguish those from open cavities and do not call disabled an
improved physical model. An unchanged contrast is useful evidence too.

## Governing charter clauses retained verbatim

Phase 2b delegates the disposition to the written surface-operator specification:

> Phase 2b — attachment becomes physics. v1.3 (decision 0005) paused this phase until its two opening deliverables existed: the surface-operator specification (D2 in the ADR — normalization of d→σ, surface sampling, facet classification, vapor flux and ice gain coupled as one operator, fill storage, and the explicit kept/replaced/disabled disposition of κ, μ, melting, and hole-filling) and the parameter table below. Both were written before LibbrechtKinetics code on 2026-07-15, so the pause is discharged; the ordering remains mandatory.

The existing post-phase experiment remains separate:

> Post-Phase-10 development experiment (decision 0055, 2026-09-09): under the maker's autonomous bounded-science direction, a separately identified constant-environment CPU experiment may select both, neither, basal-only or prism-only M1 dip preparations. It retains the coupled aggregate-v6 Robin/fill operator and ordinary behavior, and cannot use existing checkpoint formats to imply ordinary kinetics. The active discovery plan registers its finite comparisons and controls. These interventions identify effects within the implemented discrete model, not width-dependent SDAK, physical necessity, grid convergence or quantitative validation. They do not reopen Phase 10 or involve the separate Phase 7 path.

Add a paragraph beside that clause authorizing only the separately identified closure experiment.
The solver specs retain ordinary hole filling and describe this exception. Also correct the old
G-G machinery prose implying that retaining hole filling makes hollowing physically interpretable:
the attachment spec already calls the rule P4 hygiene, not proof that a void or its filling is
physical. That claim correction changes no executed result.

## Alternatives and limits

Keep only descriptive hole counters: cannot answer the counterfactual. Change rough coefficients,
curvature, timestep and hole filling together: would not isolate this rule. Implement curvature or
width feedback first: useful future possibilities, but this intervention has a directly measured
current-model motivation and needs no new unsourced geometric estimator. No Phase 7, C0V recovery,
new physical-validation claim or assurance framework is authorized by this decision.
