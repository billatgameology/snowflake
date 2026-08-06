# 0045 — Close Phase 6 within a bounded compute week: measured-only three-arm comparison plus a registered numerics verdict

- **Date:** 2026-08-06
- **Status:** accepted (maker direction in an interactive session, quoted verbatim below)
- **Charter impact:** §3.2 Phase 6 and the v1.21 revision summary updated in this session
  (charter v1.22)

## Context

Three facts collided.

**The headline is already known.** The maker accepts the historical failure to reproduce the
Nakaya diagram; the measured-only results CAK 3/90 and M1 54/90 are tracked, labeled evidence.
No remaining computation changes that answer — the open work would upgrade its *label* from
measured-only to the registered conservative-intersection verdict, and add the matched
ablation arm.

**The registered shape costs months.** The 2026-08-06 author-side forecast (non-binding, from
measured Ryzen 7 anchors: 89.4 and 72.7 core-hours for the two 204-row sweeps at N = 48;
N = 80 ≈ 12× N = 48 per point; one fine-spacing run exceeding the 3-hour budget) puts the
5,508-row three-arm baseline at order 10⁴ core-hours — months of continuous compute on the
recorded host — and the registered ladder at the same order, with a real possibility of an
honest exhaustion: no tested domain rung passes the registered 0.5% criterion (ADR 0037:
N = 48 fails 3 of 4, N = 64 vs N = 80 fails 3 of 4, non-monotone domain response).

**The ruler is being deprecated by the project's own next steps.** The proposed (uncharted)
Phase 8/9 drafts record that the single-diagram, final-aspect-ratio-label comparison is
"contradicted between laboratories, protocol-dependent, and criticized as a habit metric by
its own sources," retire the AR-label gate to "one legacy operator," and pre-suppose a
three-arm measured baseline (CAK, M1, `M1_NO_DIP_ABLATION`) for behavioural re-scoring. Those
drafts are context, not authority — this decision stands on cost versus marginal value and on
the active plan's own no-pass branch.

The maker's direction, verbatim (interactive session, 2026-08-06):

> we already know the phase 6 run will not reproduce the nakaya diagram. are we doing all the
> compute just for record and completeness? I am okay if it's less than a week, but if it's
> more then we need to reevaluate

After a written options review that included reading the Phase 8/9 drafts, the maker selected
the recommended option, presented as: finish Stage A; pre-register a budget-capped ladder
whose expected outcome is a registered no-pass; add the ~1-day measured-only
`M1_NO_DIP_ABLATION` 204-point sweep as the three-arm baseline; close via ADR and the WP8
gate; total ≈ one week.

## Decision

1. **Compute envelope.** All remaining Phase 6 computation fits inside a hard envelope of
   **seven wall-clock days** from this decision on the recorded Ryzen 9 host at recorded
   concurrency, including the already-running WP2 Stage A cost probe. Work that cannot fit is
   closed by this decision, not deferred-by-silence.
2. **The numerical-control ladder executes, budget-capped.** The WP2 ladder is pre-registered
   and executed as a bounded unit inside the envelope, at the frozen WP1 sizes, applying the
   registered criteria. Its **no-pass branch is a first-class publishable outcome** (the
   active plan already provides it). A pass at affordable rungs does **not** authorize a
   production campaign — item 3 governs regardless of the ladder's outcome, and this is
   stated in advance precisely so the ladder's result cannot be outcome-shopped.
3. **The registered production campaign closes at measured-only grade.** The three-arm
   `204 × S × D × Z` float64 campaign, ADR 0026's conservative-intersection headline, and the
   WP4 R15 production evidence path are **closed by direction**. The registered freeze rows
   (`uncertainty-reporting`, `domain-budgets`) remain tracked, unedited history; every report
   states the registered headline as **not computed by decision 0045** — never as satisfied,
   waived-as-if-passed, or replaced by the measured-only counts.
4. **One addition: the third arm at measured-only grade.** A 204-point `M1_NO_DIP_ABLATION`
   sweep executes inside the envelope, identical to the executed arm-2 (M1) configuration in
   every registered respect except `paramSet`, so the three arms are same-protocol
   comparable. The gated values manifest gains the arm-3 registration mirroring arm 2's
   schema; both historical manifests stay byte-identical. Its artifact carries the same
   measured-only labels and numerical-adequacy caveats as the two historical arms, plus the
   ladder's verdict once published. Only the matched M1-versus-ablation pair may support an
   implementation-level statement about the dip factors; it cannot establish physical SDAK
   causality in nature.
5. **The WP8 gate re-derives the amended obligations:** the WP1 strata freeze; the ladder's
   artifact-derived result (pass or no-pass); the three measured-only arm artifacts with
   their labels; the decision 0043/0044 deferral records; and this decision's closure labels.
   The charter's Phase 6 **Done when** is unchanged and is satisfied by the three-arm
   comparison with agreements and disagreements both stated at their honest evidence grade.
6. **Supersessions.** The active plan's standing rejection — "**Narrow O1b wholesale by ADR
   and charter amendment.** Rejected by maker direction on 2026-08-01. … that rejection
   remains in force for the headline and numerics" — is superseded for the headline and
   campaign by the maker's 2026-08-06 direction quoted above. ADR 0037's measurements and
   negative evidence are preserved untouched; with no re-sweep executing, its §5 scheduling
   decision no longer needs a supersession. Decisions 0042–0044 are unaffected.

## Charter impact (v1.21 → v1.22), clauses quoted

The v1.21 revision-summary sentence:

> Phase 6 still executes source-derived physical-size strata, the full grid/timestep/domain
> numerical-control ladder, ADR 0026's conservative-intersection headline, R15, and the
> complete CAK/M1/`M1_NO_DIP_ABLATION` campaign.

is superseded by the v1.22 summary (the strata are frozen; the ladder executes budget-capped
with no-pass first-class; headline/R15/campaign close at measured-only grade with the
third-arm addition).

§3.2 Phase 6, the parameter-sweep clause:

> The source-derived physical-size strata and registered grid/timestep/domain controls
> determine the production configuration; scientifically independent cases may use separate
> recorded processes, but no scheduling choice changes a case.

is amended to record that under this decision no production configuration is selected; the
strata and controls scope the ladder verdict and the measured-only labels instead.

Unchanged and load-bearing, quoted so their retention is explicit:

> Numerical-verification controls (added v1.3). Grid-, timestep-, and domain-convergence
> studies at representative sweep points. The 65% domain-contact guard is a collision
> heuristic; it does not prove the far boundary is irrelevant — only a domain-convergence
> study does.

(The ladder is that study, budget-capped; a no-pass documents that the study did not
establish adequacy.)

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against
> Nakaya's, with the agreements and the disagreements both stated. A negative result is a
> result: if the model does not reproduce the flip, that is a finding about the model, it is
> reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not
> permitted is quietly tuning until the diagram matches and calling it validation — the
> versioned protocol freeze (item 1) makes every authorized change auditable and invalidates
> prior sweep evidence for the replacement gate after a post-freeze edit.

(Satisfied at measured-only grade with the numerics verdict attached; nothing here tunes
anything toward agreement.)

> Upgrade Evidence labels to "quantitatively validated over a named domain" (§1.5) only where
> an executed comparison supports it, and only where it holds.

(No Phase 6 label is upgraded; the phase closes with zero quantitative-validation claims.)

## Consequences

- Phase 6 closes in about a week of compute instead of months, with every label honest: a
  three-arm measured-only comparison, a registered numerics verdict (expected no-pass), and
  the recorded fact that the registered headline was closed by decision, not earned.
- The cost: the conservative-intersection verdict is never computed, so the project
  permanently lacks a registered-grade version of the Nakaya comparison under this protocol.
  If a successor phase wants one, it re-freezes and re-runs under its own protocol; nothing
  here is reusable as production evidence.
- The numerics question is answered at bounded cost either way: a no-pass documents that the
  measured habits carry unproven numerical adequacy (a stated limitation the successor
  phases inherit); a cheap pass would strengthen the measured-only results without upgrading
  their labels.
- The matched ablation baseline exists at the same evidence grade as the two historical
  arms, which is what the proposed successor phases assume — without spending anything at
  registered grade on a ruler under deprecation review.
- The one-week envelope is a maker resource decision recorded here; it does not weaken any
  retained validity criterion, substitute an unregistered configuration, or convert absence
  of evidence into validation.

## Alternatives considered

- **Execute the full registered shape** (ladder → freeze → 5,508-row campaign → conservative
  intersection). Lost on cost (order 10⁴ core-hours; months) against a known headline and a
  ruler the project's own drafts deprecate; also fails the maker's explicit envelope.
- **Close now on existing evidence, no ladder.** Cheapest, but leaves the
  artifact-versus-physics question permanently open, and the measured record already shows
  the registered criterion failing at every tested rung — a few bounded days convert that
  from an anecdote into a registered verdict.
- **Ladder first, campaign only if it passes.** The campaign cannot fit the envelope at any
  ladder outcome, so conditioning on the ladder would be theater; stated in advance instead
  (Decision item 2).
- **Skip the third arm, let Phase 9 build its own baseline.** Loses same-protocol
  comparability with CAK 3/90 and M1 54/90 for ~1 day of compute saved.
