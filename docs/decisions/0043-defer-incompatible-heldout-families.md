# 0043 — Defer incompatible held-out families without relabeling Nakaya reproduction

- **Date:** 2026-08-03
- **Status:** accepted; reviewed as one direction-amendment unit with decisions 0042 and 0044
- **Charter impact:** amends the document revision marker, current-revision paragraph, §2.7's
  independent-validation schedule, the Phase 6 held-out and evidence-label clauses in §3.2, and
  adds a named held-out work package under Phase 7.

## Context

The Phase 6 source-currency audit did not find a currently scoreable held-out comparison for the
implemented free single-crystal prism with its present transport physics. The frozen candidate lock
`research/phase6-heldout-candidate-lock.json` is 15,148 bytes with SHA-256
`f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5`; its recorded status is
`candidate-only-no-validation-target-frozen`, with `passEligible=false` because no audited family is
presently apples-to-apples with the solver. The amended currency record at this decision point,
`research/phase6-source-currency.md`, is 29,714 bytes with SHA-256
`af045438ab2e4bb0de82aea4b289388d7d2c0448322298f7ecfe4ed21e5d2563`.

The incompatibilities are scientific, not administrative. Depending on the family, the sources
require observed or supported/needle seed geometry, vapor-thermal coupling, ventilation,
sublimation, particle crystallography, or joint conditions that the current evidence does not
supply. Selecting a near match, inventing missing geometry from model output, or ignoring a
load-bearing transport difference would make a nominal held-out score less accurate, not more.

The maker therefore directs all four named families—growth rates, size-dependent habit, pressure
dependence, and growth-history responses—past Phase 6. This is a deferral of unfinished independent
validation, not a declaration that the current model passed it and not permission to relabel the
Nakaya-informed M1 comparison as independent.

### Charter document marker being amended

> Project Document — v1.20, August 2026

### Charter current-revision paragraph being amended

> Current revision. v1.20 (2026-08-02) — decision 0041 records the Phase 6 continuation-host CPU upgrade from the historical Ryzen 7 5700G to the Ryzen 9 5900XT with 16 physical / 32 logical processors. The RTX 3080 10 GB, Windows lane, and approximately 64 GiB of RAM remain. Phase 5 and the pre-upgrade Phase 6 sweeps keep the old-host provenance that produced them; the historical Phase 6 artifacts' lack of artifact-level host binding remains an explicit evidence limit. New Phase 6 continuation and replacement-gate evidence records the new CPU, runtime and actual concurrency/launch fields; GPU bundles independently observe the required adapter and backend fields and the driver where exposed. The extra cores change only scheduling of scientifically independent cases. They do not alter a case, scientific criterion, numerical-control obligation, GPU cohort, held-out obligation, or the Windows-only scope.

### §2.7 independent-validation clause being amended

> Amended again 2026-07-14 (decision 0005; provenance split and taxonomy corrected 2026-08-02 by decision 0040): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 directly adopted authoritative source quantities, including measured or source-tabulated empirical inputs and exact metrological definitions (empirical entries state uncertainty or precision; defined entries state their defining authority and exact status); P2 fitted, model-inferred, project-derived, or figure-digitized quantities (with a stated domain of validity); P3 Nakaya-informed prescriptions, including the exact M1 dip functional forms/placement chosen using the diagram; P4 numerical/discretization choices, including this project's base-10 resolution of the M1 source's unstated logarithm base from its plotted dip widths and the binary representation of exact decimal definitions. A source fit or inversion does not become P1 merely because its paper is authoritative. Published model-dependent inversions of narrow-facet growth observations can support the existence and approximate temperature regions of barrier reductions without promoting the exact M1 prescription out of P3. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Independent validation runs against held-out observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses.

### §3.2 Phase 6 held-out clause being amended

> The falsifiable test: does the model reproduce the habit reversals? Plates near −2 °C, columns near −5 °C, plates again near −15 °C, columns below −30 °C. Scoped honestly (v1.3, decision 0005; corrected v1.19, decision 0040): no-SDAK and SDAK runs are reported separately; with Nakaya-informed (P3) SDAK inputs active, matching the diagram is in-sample reproduction — the no-SDAK probe (does the full implemented broad-facet attachment parameterization with recorded P1/P2 provenance produce any reversal?) is a first-class forward-solver result in its own right, and independent validation runs against held-out observables (growth rates, size-dependent habit, pressure dependence, histories; §2.7).

### §3.2 Phase 6 evidence-label clause being amended

> Upgrade Evidence labels to "quantitatively validated over a named domain" (§1.5) only where the comparison supports it, and only where it holds.

### §3.2 Phase 7 heading under which the deferred work is added

> Phase 7 — Product layer (amended v1.18, decision 0029: four view profiles replace the earlier Explore / Lab / Sculpt sketch).

The standing in-sample guardrail remains unchanged:

> Results from Nakaya-informed (P3) inputs are never labeled independent validation, and no-SDAK and SDAK results are never merged in a report (v1.3, decision 0005).

## Decision

1. Phase 6 records the audited non-comparability of all four held-out families as a scientific
   finding. The candidate lock remains a source/extraction freeze with `passEligible=false`; it is
   neither a held-out pass nor a substitute score.
2. Defer execution of growth-rate, size-dependent-habit, pressure-dependence, and growth-history
   validation until after Phase 6. The four families remain separate obligations and cannot be
   averaged together or discharged by the Nakaya morphology comparison.
3. The accountable owner is the project maker, `billatgameology`, through a named Phase 7
   held-out-validation work package. Before any family freezes, that owner must either make its
   geometry, conditions, transport physics, observable, uncertainty, and scoring apples-to-apples,
   or record why it remains non-comparable. Any required solver-physics expansion gets its own ADR,
   specification, tests, and numerical controls.
4. Phase 6 continues to report CAK, M1, and `M1_NO_DIP_ABLATION` separately under the frozen
   production protocol. Nakaya-informed P3 results remain in-sample. The no-SDAK arm remains a
   first-class forward result, but any Evidence-label upgrade is limited to what its executed
   comparison actually supports.
5. No Phase 6 report may describe the deferred families as executed, passed, independently
   validated, or waived. It must name the incompatibility finding and the post-Phase-6 owner.

## Consequences

**Buys.** Phase 6 avoids fabricating an apples-to-apples comparison from mismatched experiments.
The negative source audit becomes a visible scientific result, while the conservative-intersection
Nakaya campaign and numerical controls continue in full.

**Costs.** Phase 6 closes without executing an independent held-out family. The project therefore
cannot use those families to support an independent-validation claim, and Phase 7 inherits
scientific work before it can make corresponding product claims. Adding the missing geometry or
transport physics may be substantial.

**Forecloses.** Choosing a source because its outcome is favorable, scoring a supported or
polycrystalline experiment as a free single prism, inferring missing initial conditions from model
output, calling `passEligible=false` a pass, or treating in-sample Nakaya agreement as independent
validation.

## Alternatives considered

**Force all four comparisons into Phase 6 using the nearest available sources.** Rejected because
the audited mismatches affect the measured observable and transport problem; a number produced that
way would not test the stated model.

**Add every missing physical mechanism before finishing Phase 6.** Rejected for this gate because
the necessary additions differ by family and would create new models and validation protocols after
the current campaign had already been defined. They remain legitimate post-Phase-6 science work.

**Drop held-out validation permanently.** Rejected. The four families remain explicit work with a
named owner, and Phase 6 gains no independent-validation credit from their deferral.
