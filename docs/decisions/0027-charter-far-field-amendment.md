# 0027 — Amend the charter's far-field mandate to match the frozen protocol

- **Date:** 2026-07-27
- **Status:** accepted
- **Charter impact:** **YES — charter amended to v1.17 in this session** (Rule 5). §2.4 and §3.2
  Phase 6 item 1 both change.

> **Scope correction accepted 2026-08-02 (decision 0040).** The historical text below said
> monopole matching removed domain dependence “outright.” Decision 0024's own smaller-domain test
> shows otherwise. The exact result is equality for the tested −5 °C, 60-step, 28³/40³ pair; it is
> not a general domain-independence theorem. The far-field selection and charter authority remain.

## Context

The 2026-07-27 independent review found a contradiction between the charter and the frozen
protocol, and it is not a wording nit — the charter as written forbade what the protocol
registered.

**Charter §2.4 (v1.2), before this ADR:**

> "The solver therefore supports two far-field conditions: reflecting (G–G fidelity; the Phase 2a
> default) and fixed-σ Dirichlet (the domain edge is held at the set supersaturation — vapor is
> replenished; **required for every Phase 6 validation run**)."

**Charter §3.2 Phase 6 item 1, before this ADR:** freeze "the far-field boundary condition
(**fixed-σ Dirichlet, per §2.4**)".

**What the protocol actually registers:** `PHASE6_FAR_FIELD = "monopole-matched"`.

Three further problems compounded it:

1. **ADR 0024 declared "Charter impact: none."** That was wrong. It reasoned that §2.4 "already
   requires every run to name its far-field condition" — which §2.4 does say — while overlooking
   that the same sentence *also* fixes which condition Phase 6 must use.
2. **The freeze-list row cited the clause that forbade it.** `far-field`'s `source` field read
   "charter §2.4 — required for every Phase 6 validation run", i.e. it named the mandate for
   Dirichlet as the authority for registering monopole-matched.
3. The plan's freeze-list table still read "Fixed-σ Dirichlet far field (charter §2.4)".

The scoped measurement stands: the Dirichlet shell holds `σ∞` at a finite radius and over-supplies
vapor by an amount that **grows with the crystal** — ~46% at 48³ and ~160% at Phase 2b's own
extent-61-in-96³ configuration. For the tested −5 °C, 60-step, 28³/40³ pair, monopole matching turns
a measured 4.1% attached-count swing into 0.0%; ADR 0024's 20³ break shows that it does not remove
domain dependence generally. What was
wrong is the paper trail, and a protocol that contradicts its own governing document cannot be
said to be frozen against anything.

## Decision

**Amend the charter to v1.17, in this session, per Rule 5.**

**§2.4** now names three conditions — reflecting, fixed-σ Dirichlet, and monopole-matched — and
changes the Phase 6 requirement from *which* condition to *naming* one:

> "**Every Phase 6 validation run must NAME its far-field condition in the frozen protocol, and
> the registered condition is monopole-matched** (superseding v1.2's requirement of fixed-σ
> Dirichlet; see decision 0027 for why)."

The non-interchangeability clause is retained and extended to three conditions, and the rule that
Phase 2b/4/5 evidence keeps the condition that produced it is made explicit rather than left to
the ADRs.

**§3.2 Phase 6 item 1** now freezes "the far-field boundary condition (named per §2.4;
monopole-matched as of v1.17)", and gains the two freeze rows the pre-registration was missing —
the agreement-scoring rule (ADR 0025) and the extrapolation operator (ADR 0026).

**The freeze-list row's `source` is corrected** to cite this ADR and the measurement, not the
clause it replaces.

**ADR 0024's "Charter impact: none" is corrected in place** with a pointer here, rather than
being silently rewritten — the erroneous assessment is part of the record.

## Consequences

**The v1.2 requirement was written before the evidence that overturns it existed.** It is
superseded on measurement, not on preference, and the superseding measurement is named in the
charter itself so a later reader does not have to reconstruct why the mandate changed.

**Naming beats fixing, as a charter-level rule.** The original clause hard-coded a specific
condition into the governing document, which meant that improving the boundary condition required
a charter amendment. The amended clause fixes the *obligation* — name it, freeze it, never
compare across conditions silently — and leaves *which* condition to the per-sweep protocol,
where it can be justified by measurement. That is the right level for it: §2.4's real content was
always the non-interchangeability rule, not the choice.

**No evidence is invalidated.** Phase 2b, 4 and 5 ran under the conditions they registered and
keep them. Phase 6 has run no sweep. The protocol hash is unchanged by this ADR except through
the corrected `source` string.

**Forecloses.** Registering a far-field condition without naming it in the frozen protocol.
Citing §2.4 as authority for a condition it does not name. Declaring "charter impact: none" on an
ADR that changes what a charter clause mandates — the test is whether the charter as written
would forbid the change, not whether the ADR's author intended to touch it.

## Alternatives considered

**Register fixed-σ Dirichlet after all, to match the charter as written.** Rejected on the
measurement. A shell that over-supplies vapor by ~160% at a configuration this project has
already used would make the domain size a dominant term in a study whose entire purpose is to
separate temperature from everything else.

**Treat it as a documentation fix and edit the charter without an ADR.** Rejected: Rule 5 exists
precisely for changes that contradict the charter, and a charter clause that mandates a specific
boundary condition for a whole phase is not a typo. The amendment and its reasoning belong in the
same session and in the record.

**Leave the charter and add a per-sweep deviation note.** Rejected. A standing deviation from the
governing document, renewed silently at each sweep, is how a charter stops meaning anything.
