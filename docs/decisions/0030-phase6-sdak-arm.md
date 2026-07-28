# 0030 — Phase 6 SDAK arm: the in-sample reproduction sweep, from printed closed forms

- **Date:** 2026-07-28
- **Status:** proposed
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

The no-SDAK arm has produced its registered expectation and hardened it. The broad-facet
sigma_0 crossing gives the habit flip in the opposite sense to Nakaya — plate at −5 °C,
column at −15 °C (Phase 2b v5p; registered expectation `baf7749`) — and WP4's partial band
sweep measured that the crossing's SENSE survives the entire ±25% digitization band; only its
LOCATION moves (`aff4ca7`). No admissible wiggle of the measured broad-facet inputs rescues
the sense. The missing load-bearing element is, on Libbrecht's own published account
(arXiv:2011.02353; monograph §4.5), the structure-dependent attachment kinetics — narrow
facets growing stickier, the feedback that makes thin plates and needles — which he proposed,
tuned to the diagram, and never tested in full 3D. Nobody has (2026-07 literature sweep,
[stretch register §1](../stretch-sharing-and-investigation.md)).

What changed to make this feasible now: arXiv:2306.13087 is obtained and verified in-repo
(`21bff19`) and prints closed forms for the SDAK dips; arXiv:2306.04042 reportedly prints the
SDAK-2 two-branch (A, sigma_0) table (sweep-reported, not yet verified in-repo). SDAK input
extraction is transcription from printed formulas, no longer figure digitization.

The 204-point no-SDAK validation sweep is RUNNING (launched 2026-07-27 22:47). Its evidence
is immutable and this ADR must not disturb it.

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
   and committed — including the explicit sense prediction at −5/−15 °C — before any 3D SDAK
   sweep executes. The arm registers its probable outcome exactly as the no-SDAK arm did.
5. **Its own frozen protocol, after the running sweep.** The SDAK sweep runs under a new
   protocol id through the same freeze machinery, and only after the running no-SDAK sweep
   terminates and its evidence is published and recorded. Until then, SDAK work is additive:
   no edits to `runner/src/phase6-protocol.ts`, the frozen table, or `out/phase6-sweep/`.
6. **Reporting is bound by standing rules.** SDAK-active and no-SDAK results are never merged
   (charter §3.3); SDAK-vs-Nakaya agreement is labeled in-sample everywhere it appears
   (ADR 0005); scoring uses ADR 0025's registered matrix; grid handling uses ADR 0026's
   operator.
7. **The differential-diagnosis ladder is registered now, not after a disappointment.** If
   SDAK fails to right the sense: next suspect is the latent-heating correction `chi_0(T,P)`
   (already tabulated; cheap; registered expectation: an isotropic supply correction with
   smooth temperature dependence shifts boundaries but cannot invert the basal/prism sense —
   an expectation that is itself testable); after that, the nonlocal terrace-context
   classifier the source uses and the aggregate policy simplifies away. Surface diffusion
   stays outside v1 (charter §2.6).

## Consequences

Buys: the first full-3D test of the SDAK hypothesis, decisive in either direction — if the
sense rights itself, the first 3D demonstration that Libbrecht's tuned form is sufficient
in-sample; if it does not, evidence that even the Nakaya-informed form cannot rescue the
diagram in 3D, and the registered ladder says what to try next. Either outcome is reportable;
neither is a validation claim.

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
- **Tune broad-facet inputs until the sense flips.** Forbidden, twice over: structurally
  (the table is hash-frozen; edits invalidate the sweep) and by identity (that is calibration
  wearing validation's clothes — charter §3.2 Phase 6).
- **Fold the broad-facet closed-form adoption into this ADR.** Rejected: it couples an open
  maker decision (re-freeze cost against the running sweep) to an arm that does not need it;
  the SDAK annex stands alone.
