# 0030 — Phase 6 SDAK arm: the in-sample reproduction sweep, from printed closed forms

- **Date:** 2026-07-28
- **Status:** superseded before acceptance; do not implement (decision 0036; accepted decision
  0040 records further interpretation corrections)
- **Charter impact:** none — quoted per the amended Rule 5. §3.2 Phase 2b already schedules
  this work ("SDAK last, and gated. It is the least certain piece — Libbrecht's attachment
  coefficient depending on facet width requires a local geometric query over surface cells,
  attackable but unpublished at this resolution"); §3.2 Phase 6 already requires its reporting
  shape ("no-SDAK and SDAK runs are reported separately; wherever P3 inputs are active,
  matching Nakaya is in-sample reproduction, not independent validation"); §2.5 already
  assigns the provenance ("the SDAK narrow-facet dips are not [measured] — their locations
  were chosen to impose agreement with the Nakaya diagram"). This ADR schedules and scopes
  work the charter anticipates; it changes no clause.

## Context

> **Supersession note (2026-08-01).** This proposal was never accepted. Its premise converts
> sigma0/equal-field coefficient order into habit “sense,” makes unsupported priority claims, and
> treats CAK→M1 as a causal SDAK test. Those interpretations are withdrawn in the current correction;
> accepted decision 0040 makes them future-gate-inadmissible. The active science-first plan uses the existing M1 approximation plus a matched
> M1/no-dip forward ablation; full facet-width M2 remains unimplemented. Historical text below is
> retained only to explain the abandoned proposal.

The historical no-SDAK arm measured a failed Nakaya comparison. Its analytic crossing proxy does
not specify a coupled plate/column result, and the partial uncertainty-band calculation does not
close alternative broad-facet 3-D behavior. Published source models motivate narrow-facet kinetics,
but the 2026-07 search was not an exhaustive priority review and this project makes no “first” claim.

What changed to make this feasible then: arXiv:2306.13087 was obtained and verified in-repo
(`21bff19`) and prints the algebraic forms for the SDAK dips. Its `log` base is unstated; the project
uses base 10 as a separate, Figure-1-width-supported P4 transcription choice. At the time,
arXiv:2306.04042 was only sweep-reported as printing the SDAK-2 two-branch (A, sigma_0) table; the
later source audit verified Table 1 directly. M1 therefore uses the source-printed algebra for the
project's P3-classified Nakaya-informed prescription, plus that P4 base resolution, rather than arm
1's figure-digitized CAK anchors. The source prints the algebra; P3 is this project's provenance
classification, not a label printed by the source.

At this ADR's writing, the 204-point no-SDAK validation sweep had been launched (2026-07-27 22:47).
Its historical measured-only bytes remain immutable; neither this superseded ADR nor accepted
decision 0040 upgrades them into gate evidence.

## Decision

1. **A new coupled surface policy.** SDAK is implemented as a new versioned policy (working
   name `aggregate-hv-sdak-v1`) on the float64 CPU oracle only. Existing policies v3–v6 stay
   bit-unchanged; the GPU LK entry points continue refusing every policy but v5.
2. **A separate frozen SDAK annex, not an edit to the frozen table.**
   `docs/libbrecht-parameters.md` is not touched. SDAK inputs live in a new annex file with
   its own content hash, every entry provenance class P3, every entry cited to the printed
   closed form with page/equation, and the Rule 12 source-currency check recorded as part of
   the annex freeze. Step zero is verifying arXiv:2306.04042 in-repo; no sweep-reported
   number enters the annex unverified.
3. **The facet-width query inherits the D6h rule.** The local geometric query behind
   width-dependent kinetics is keyed to integer lattice invariants (ADRs 0023/0024), never to
   evaluated cartesian floats or enumeration order, and its symmetry regression runs at the
   largest admissible fill-CFL — the regime that exposed both prior breaks.
4. **The expected result is registered before the 3D run.** A 0D/1D analysis from the annex
   forms (Fig.-10-style: which facet family wins at each registered temperature) is derived
   and committed — restricted to an equal-field coefficient-order diagnostic at −5/−15 °C — before any 3D SDAK
   sweep executes. The arm registers its probable outcome exactly as the no-SDAK arm did.
5. **Its own frozen protocol, after the running sweep.** The SDAK sweep runs under a new
   protocol id through the same freeze machinery, and only after the running no-SDAK sweep
   terminates and its evidence is published and recorded. Until then, SDAK work is additive:
   no edits to `runner/src/phase6-protocol.ts`, the frozen table, or `evidence/phase6-sweep/`.
6. **Reporting is bound by standing rules.** SDAK-active and no-SDAK results are never merged
   (charter §3.3); SDAK-vs-Nakaya agreement is labeled in-sample everywhere it appears
   (ADR 0005); scoring uses ADR 0025's registered matrix; grid handling uses ADR 0026's
   operator.
7. **The differential-diagnosis ladder is registered now, not after a disappointment.** If
   the forward morphology remains discrepant: next suspect is the latent-heating correction `chi_0(T,P)`
   (already tabulated; cheap; registered expectation: an isotropic supply correction with
   smooth temperature dependence is expected to shift supply; no theorem about habit inversion follows —
   an expectation that is itself testable); after that, the nonlocal terrace-context
   classifier the source uses and the aggregate policy simplifies away. Surface diffusion
   stays outside v1 (charter §2.6).

## Consequences

Historical intended benefit: a full-3D M1 run. It was not a causal SDAK test because CAK→M1 changes
multiple kinetic inputs, and the literature search did not support a priority claim. The matched
M1/no-dip forward pair in the active plan is the required design to isolate the implemented dip
factors' effect on this solver under a frozen configuration; it cannot establish physical SDAK
causality or necessity in nature.

Costs: a new policy version, a new frozen annex, a new protocol, and the facet-width query —
the genuinely hard part, and a fresh D6h hazard surface. The width query's definition at this
resolution is unpublished; whatever is chosen becomes a P4 modeling decision that must be
stated, versioned, and owned.

Forecloses (deliberately): editing the frozen broad-facet table under cover of this work —
the closed-form adoption question for the *broad-facet* curves remains the separate,
still-open maker decision and does not ride along.

## Alternatives considered

- **Apply `chi_0` first.** Rejected as first move: it corrects supply magnitude identically
  for both facet families, with smooth temperature dependence — no mechanism to create or
  invert a crossing. Ordered second in the registered ladder, where its cheapness is a
  virtue.
- **Terrace-context classifier first.** Rejected: the largest lift, no printed
  parameterization exists, and the measured failure signature (sense inversion at the
  broad-facet level, robust across the band) points at facet-family competition, not at
  step-flow misclassification.
- **Tune broad-facet inputs until the result flips.** Forbidden: the versioned table makes authorized
  edits auditable and invalidates the sweep, and such tuning is calibration
  wearing validation's clothes — charter §3.2 Phase 6).
- **Fold the broad-facet closed-form adoption into this ADR.** Rejected: it couples an open
  maker decision (re-freeze cost against the running sweep) to an arm that does not need it;
  the SDAK annex stands alone.
