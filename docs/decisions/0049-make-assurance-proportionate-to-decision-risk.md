# 0049 — Make assurance proportionate to decision risk

- **Date:** 2026-08-12
- **Status:** accepted by maker direction
- **Charter impact:** document marker/current-revision record and §3.3 standing guardrails updated
  in this session

## Context

The project needs exact source provenance, correct numbers, reproducible experiments, and
fail-closed scientific gates. It does not benefit when those controls expand into an independent
work product. During Phase 8, controls intended for gate-bearing evidence were repeatedly applied
to routine source discovery and triage. The work drifted from extracting usable measurements toward
proving corpus and process completeness. A later single-paper assessment reached its decision after
the primary read but still dispatched three independent audits; the additional reviews increased
confidence slightly and changed no disposition.

This is epistemic overengineering: gate proliferation, risk flattening, proxy substitution,
completeness chasing, and failure to stop after a decision stabilizes. It is not solved by dropping
data integrity. It is solved by reserving stronger assurance for inputs and claims whose failure
would materially alter the science.

### Charter document marker being amended

> Project Document — v1.25, August 2026

### Charter current-revision paragraph being retained as prior revision

> Current revision. v1.25 (2026-08-12) — decision 0048 accepts the maker's evidence-based Phase 8B scope correction: close a Phase-9-ready priority benchmark corpus rather than an exhaustive measurement corpus. The accepted Phase 8A freeze and all Phase 8B S0-S2 evidence remain immutable. Phase 8B reuses the completed 49-PDF / 1,242-page visual census; extracts and independently verifies the selected native longitudinal, module-discriminating, and interpretation-critical measurements; retains the residual discovery universe as an explicit backlog; and runs one targeted post-extraction gap and source-currency pass. Blanket duplicate classification of every irrelevant page and two global zero-addition search rounds are superseded. Phase 8 remains non-validating and performs no solver run, model or parameter change, model-output scoring, or Phase 9 implementation; Phase 7 remains standalone; Phases 9 and 10 remain uncharted.

### Existing §3.3 evidence-integrity guardrail after which the new rule is added

> Phase 6 evidence-integrity scope (added v1.21, decision 0042). Controls defend against accidental error, process crashes or partial writes, environment drift, wrong or incomplete invocations, record loss/duplication/misalignment, ordinary artifact drift, producer/verifier disagreement, and incorrect metric or claim logic. Attacks that require deliberate hostile action by a person controlling the maker's own machine or repository—replacement references; attribute, clean-filter, or stat-cache laundering; junction/reparse/path redirection; index-hidden tampering; or substitution of committed worker, launcher, verifier, or source code—are outside this phase's threat model and remain preserved history rather than dispatched findings. Each unit gets one proportionate non-author review engagement: only a defect that could change a published number or scientific claim, or silently corrupt evidence, is a blocker; other hardening ideas are non-blocking. Authors may repair blockers for a bounded follow-up, but two blocker-bearing verdicts require maker escalation, not a third rebuild, and reviews are not reviewed. Independent artifact derivation, in-scope negative controls, exact provenance, pre-registration, and scientific criteria remain mandatory; no new evidence machinery is added without a new in-scope accidental-failure surface.

The adjacent scientific-milestone rule remains unchanged:

> Every scientific milestone is an automated metric, not a screenshot.

## Decision

1. Assurance depth follows decision risk:
   - Routine source intake establishes identity/version, preserves and hashes the original when
     applicable, records exact locators, and extracts values with units, conditions, uncertainty,
     and measured/transcribed/derived status. It receives no independent audit by default.
   - A load-bearing quantitative input receives one independent targeted transcription,
     calculation, or semantic check.
   - A phase gate or strong public scientific claim retains the pre-registered evaluator,
     independent derivation, negative controls, and adversarial review required by the charter or
     accepted decision.
2. A new gate, check, review, registry, or verifier is admitted only when it names a plausible
   in-scope failure, explains how that failure could change a scientific decision or silently
   corrupt evidence, shows that existing controls do not already catch it, and is proportionate to
   the likely harm.
3. Reviews do not recurse. A review-of-review or a validator whose main purpose is to validate
   another validator is prohibited unless a later maker-approved charter amendment names a new
   decision-relevant failure that requires it.
4. Checking stops when another pass is unlikely to change inclusion, classification, extracted
   values, the next experiment, or a published claim. Residual uncertainty is stated rather than
   converted into another process layer.
5. Roughly one quarter of a work block spent on process without a direct scientific deliverable,
   or the appearance of a second meta-validation layer, is a stop-and-simplify tripwire. It is a
   judgment aid, not a tracked metric, schema field, gate, or reporting obligation.
6. Existing controls explicitly required by the charter or an accepted decision remain in force
   over their named scope. Changing those controls still requires amendment at the same authority
   level; plan- and implementation-level ceremony may be removed directly.

## Consequences

**Buys.** Source work returns to sources, measurements, calculations, and experiment design. Routine
intake stays traceable without being treated as a phase gate. Expensive assurance remains focused on
the values and claims capable of changing the project's scientific conclusions.

**Costs.** Routine records may retain acknowledged uncertainty that another audit could have
reduced. The project accepts that cost when the uncertainty does not change a decision. Agents must
exercise judgment instead of treating more process as automatically safer.

**Forecloses.** Universal independent review, proof-of-completeness machinery for bounded source
searches, recursive review, validator-of-validator construction, and continuing checks after the
relevant disposition or decision has stabilized.

## Alternatives considered

**Keep Rule 14 as a general exhortation only.** Rejected because an agent can rationalize almost any
new check as protecting scientific correctness. Operational assurance tiers and an admission test
make the stopping rule usable.

**Remove review and integrity controls broadly.** Rejected because source transcription errors,
unit mistakes, producer/evaluator agreement defects, and false gate claims remain material risks.

**Track a precise process-time percentage.** Rejected because instrumentation and reporting would
recreate the bureaucracy this decision removes. The one-quarter threshold is deliberately a rough
intervention cue.
