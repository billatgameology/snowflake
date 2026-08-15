# 0046 — Run Phase 8 alongside Phase 6 and make Phase 7 completely standalone

- **Date:** 2026-08-10
- **Status:** accepted (maker direction in an interactive session)
- **Charter impact:** document marker, current-revision record, §1.5 evidence-label authority,
  §2.7 provenance/validation timing, §3.2 milestones, and §3.3 UI label authority updated in this
  session (charter v1.22 → v1.23)

## Context

The charter made every phase after Phase 2 sequential unless a maker-directed ADR registered a
narrower exception. The proposed Phase 8 plan therefore prohibited work until Phase 6 WP8, even
though its first six steps are source extraction, semantics normalization, protocol tagging,
classification, partitioning, and a target-book freeze — no solver run, parameter change, model
scoring, or Phase 6 evidence mutation.

Phase 6 is still active: its registered numerical-control ladder is executing in a pinned Windows
worktree. Waiting for that compute to finish does not protect any scientific dependency in the
Phase 8 source-curation path. It only idles an independent documentation and provenance task.
Earlier decisions 0007 and 0010 established the useful pattern for such an overlap: isolate the
worktree and file territory, borrow no incomplete claim, treat the other process and its artifacts
as immutable, and reconcile relevant upstream corrections before freezing evidence.

The maker directed on 2026-08-10:

> I want to do phase 8 in parallel of phase 6, phase 7 is completely standalone.

“Completely standalone” is applied literally to phase-completion ordering: Phase 7 does not wait
for Phase 6 or Phase 8 and neither waits for it. That does not require discarding its existing
responsibilities. Decisions 0029, 0043, and 0044 still define Phase 7's product, held-out-validation,
and GPU-parity work; this decision supersedes only their post-Phase-6 timing and replaces future
Phase 6-result dependencies with explicitly versioned, already-published inputs.

## Decision

1. **Phase 8 is chartered and active.** Its governed scope is the reconciled laboratory target
   book in `docs/plans/phase-8-what-is-real.md`. Phase 9 and Phase 10 remain proposed and
   uncharted.
2. **Phase 8 may run concurrently with Phase 6.** The exception is limited to Phase 8's source
   reconciliation, target-book construction, and registered derived-observable operators. It
   neither weakens nor satisfies a Phase 6 obligation.
3. **Phase 7 is completely standalone.** It may start before Phase 6 or Phase 8 completes, but only
   after its own plan is committed and in its own isolated worktree. The scopes assigned by
   decisions 0029, 0043, and 0044 remain; their post-Phase-6 scheduling is superseded. Phase 7
   consumes only explicitly versioned, already-published inputs and never waits for a future
   artifact from another phase. Its held-out work may grant quantitative-validation status only
   through its own executed, pre-registered gate and only over that gate's named domain; this does
   not alter the Phase 6 verdict, and Phase 8 has no validation-granting authority.
4. **The workstreams are isolated.** Phase 8 uses branch `phase/8-what-is-real` and worktree
   `/Users/clipper/github/snowflake-phase8`. Phase 6 worktrees, processes, frozen protocol,
   `evidence/phase6-*`, plans, reports, and gate machinery are read-only to Phase 8. Phase 8
   launches no solver job and consumes no material CPU capacity on the live Phase 6 evidence host.
   Any future Phase 7 work uses the same isolation rule and cannot contend with a timing-sensitive
   Phase 6 row on that host. The only Phase 6-plan edit in this adoption unit is the one-time
   authority reconciliation that removes its superseded Phase 7 scheduling prohibition and
   replaces its pre-decision-0045 Goal/Done-when summary with the controlling closure; after
   adoption, the plan is read-only to Phase 8.
5. **Claims do not cross the boundary.** Phase 8 may cite published Phase 6 records only with
   their existing evidence labels and limits. An incomplete Phase 6 result cannot become a Phase 8
   premise, and no Phase 8 output earns Phase 6 gate credit. Phase 7 neither gates nor supplies
   Phase 8; no Phase 7 output earns Phase 6 or Phase 8 credit. A Phase 7 use of an existing Phase 6
   artifact retains that artifact's version, labels, and limits without creating a completion edge.
6. **Parallel does not mean stale.** Before the Phase 8 target book freezes, upstream changes that
   affect a cited source, provenance classification, or shared research record are reconciled and
   the affected extraction, protocol tag, or class assignment is rechecked. A merge conflict is
   resolved from the governing records, never by choosing whichever branch is newer in bulk.
7. **There is one live progress index.** Phase 8 does not create a branch-local progress log.
   Before every Phase 8 state-record commit, reconcile the current `origin/main` version of
   `docs/PROGRESS.md`, preserve the Phase 6 lane, and apply only the Phase 8 state delta. Once the
   adoption lands on `main`, both workstreams preserve both lanes; neither may overwrite the file
   wholesale from an older branch snapshot.
8. **No verification exemption is created.** Phase 8 follows the standing repository checks,
   including exact `npm test` for every non-exempt change. Tests run outside the live Phase 6
   evidence host while its timing-sensitive rows execute.
9. **Authorization is not activation.** This decision charters and activates Phase 8. It makes
   Phase 7 eligible to start independently but does not start it; Phase 7 still needs its own plan
   and worktree. Phase 9 and Phase 10 remain uncharted.

## Charter impact (v1.22 → v1.23), clauses quoted

The actual document marker was stale and is corrected as part of the new revision:

> Project Document — v1.21, August 2026

The replacement marker and current-revision clause are:

> Project Document — v1.23, August 2026

> Current revision. v1.23 (2026-08-10) — decision 0046 charters Phase 8, the reconciled laboratory target book, and authorizes its source-curation work to proceed in an isolated worktree while Phase 6 remains active. It also makes Phase 7 completely standalone from the completion of Phases 6 and 8: Phase 7 may begin only under its own committed plan and isolated worktree, but it need not wait for either phase. Decisions 0029, 0043, and 0044 retain their Phase 7 product, held-out-validation, and GPU-parity scope while their post-Phase-6 scheduling is superseded. A separately gated Phase 7 held-out comparison may grant quantitative-validation status only over its executed, pre-registered named domain; Phase 8 source reconciliation cannot. No concurrent phase borrows an incomplete claim, mutates another phase's artifacts, earns another phase's credit, or consumes the live Phase 6 evidence host during a timing-sensitive row. Phase 9 and Phase 10 remain proposed and uncharted.

The v1.22 current-revision paragraph becomes the prior-revision paragraph with its substantive
text unchanged:

> Current revision. v1.22 (2026-08-06) — decision 0045 records the maker's bounded-closure direction: all remaining Phase 6 computation fits a seven-wall-clock-day envelope on the recorded host. The WP1 source-derived physical-size strata are frozen (S1 observed initial radius `[5.8999999999999995, 12.1]` µm; S2 grown mass-equivalent radius at 300 s `[9.472732790460505, 20.459585775743665]` µm; `evidence/phase6-size-strata/strata.json`). The numerical-control ladder executes budget-capped with its no-pass branch first-class, and a pass authorizes no production campaign. ADR 0026's conservative-intersection headline, R15's production evidence path, and the full three-arm campaign close at measured-only grade — every report states the registered headline as not computed by decision 0045, never as satisfied. One addition executes inside the envelope: a 204-point measured-only `M1_NO_DIP_ABLATION` sweep identical to the executed arm-2 configuration except `paramSet`, giving the three arms same-protocol comparability. No Phase 6 evidence label is upgraded to quantitatively validated; decisions 0042–0044, historical evidence, and all claim-label limits remain unchanged.

The resulting prior-revision clause is:

> Prior revision. v1.22 (2026-08-06) — decision 0045 records the maker's bounded-closure direction: all remaining Phase 6 computation fits a seven-wall-clock-day envelope on the recorded host. The WP1 source-derived physical-size strata are frozen (S1 observed initial radius `[5.8999999999999995, 12.1]` µm; S2 grown mass-equivalent radius at 300 s `[9.472732790460505, 20.459585775743665]` µm; `evidence/phase6-size-strata/strata.json`). The numerical-control ladder executes budget-capped with its no-pass branch first-class, and a pass authorizes no production campaign. ADR 0026's conservative-intersection headline, R15's production evidence path, and the full three-arm campaign close at measured-only grade — every report states the registered headline as not computed by decision 0045, never as satisfied. One addition executes inside the envelope: a 204-point measured-only `M1_NO_DIP_ABLATION` sweep identical to the executed arm-2 configuration except `paramSet`, giving the three arms same-protocol comparability. No Phase 6 evidence label is upgraded to quantitatively validated; decisions 0042–0044, historical evidence, and all claim-label limits remain unchanged.

The three §1.5 clauses that previously reserved validation authority to Phase 6 read:

> Evidence — what it has earned: unvalidated; qualitatively supported; or quantitatively validated over a named domain. Only Phase 6 can grant the third, and only where the comparison actually holds.

> Amended 2026-07-14 (decision 0003). Temperature is now a genuine input to the solver's physics, not a label applied to a knob afterward — so a real temperature slider is honest: Type = input, Evidence = unvalidated until Phase 6 reports. What is not yet earned is the next claim: that the crystal which emerges at −15 °C is what nature actually grows at −15 °C. That is "quantitatively validated" and only Phase 6 can grant it, by testing it and possibly refuting it.

> Hold the distinction precisely, because it is the one this project exists to be honest about: giving a model real physics is not the same as showing the model reproduces reality. Until Phase 6 reports, the UI says "−15 °C (model input; morphology not yet validated against measurement)." A hover readout says "high relative attachment tendency," not "attachment rate: 91%." A designer tool can be honest about being a model; a fake physics readout is worse than none — and a real-looking number resting on an untested model is the most convincing fake of all.

They are replaced with gate-scoped authority. Phase 6 retains its Nakaya domain, Phase 7 may earn
only its independently executed held-out domain, and Phase 8 earns none:

> Evidence — what it has earned: unvalidated; qualitatively supported; or quantitatively validated over a named domain. Only an executed, pre-registered chartered validation gate can grant the third, and only where its comparison actually holds. Phase 6 owns the Nakaya comparison; a Phase 7 held-out-validation work package may grant the label only over its separately gated, executed named domain. Phase 8 source reconciliation cannot grant it.

> Amended 2026-07-14 (decision 0003; validation authority generalized 2026-08-10 by decision 0046). Temperature is now a genuine input to the solver's physics, not a label applied to a knob afterward — so a real temperature slider is honest: Type = input, Evidence = unvalidated until the applicable named validation gate reports. What is not yet earned is the next claim: that the crystal which emerges at −15 °C is what nature actually grows at −15 °C. That is "quantitatively validated" and only an executed, pre-registered chartered validation gate can grant it, by testing it and possibly refuting it over its named domain.

> Hold the distinction precisely, because it is the one this project exists to be honest about: giving a model real physics is not the same as showing the model reproduces reality. Until the applicable named validation gate reports, the UI says "−15 °C (model input; morphology not yet validated against measurement)." A hover readout says "high relative attachment tendency," not "attachment rate: 91%." A designer tool can be honest about being a model; a fake physics readout is worse than none — and a real-looking number resting on an untested model is the most convincing fake of all.

The §2.7 provenance/validation-timing clause previously read:

> Amended again 2026-07-14 (decision 0005; provenance split and taxonomy corrected 2026-08-02 by decision 0040; held-out schedule amended 2026-08-03 by decision 0043): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 directly adopted authoritative source quantities, including measured or source-tabulated empirical inputs and exact metrological definitions (empirical entries state uncertainty or precision; defined entries state their defining authority and exact status); P2 fitted, model-inferred, project-derived, or figure-digitized quantities (with a stated domain of validity); P3 Nakaya-informed prescriptions, including the exact M1 dip functional forms/placement chosen using the diagram; P4 numerical/discretization choices, including this project's base-10 resolution of the M1 source's unstated logarithm base from its plotted dip widths and the binary representation of exact decimal definitions. A source fit or inversion does not become P1 merely because its paper is authoritative. Published model-dependent inversions of narrow-facet growth observations can support the existence and approximate temperature regions of barrier reductions without promoting the exact M1 prescription out of P3. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Post-Phase-6 independent validation remains required against observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses. Decision 0043 defers all four families because the Phase 6 source audit found no current apples-to-apples target; the deferral earns no validation credit.

It is amended only in the timing and assignment sentences; provenance classes and claim limits stay
unchanged:

> Amended again 2026-07-14 (decision 0005; provenance split and taxonomy corrected 2026-08-02 by decision 0040; held-out schedule amended 2026-08-03 by decision 0043; phase timing amended 2026-08-10 by decision 0046): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 directly adopted authoritative source quantities, including measured or source-tabulated empirical inputs and exact metrological definitions (empirical entries state uncertainty or precision; defined entries state their defining authority and exact status); P2 fitted, model-inferred, project-derived, or figure-digitized quantities (with a stated domain of validity); P3 Nakaya-informed prescriptions, including the exact M1 dip functional forms/placement chosen using the diagram; P4 numerical/discretization choices, including this project's base-10 resolution of the M1 source's unstated logarithm base from its plotted dip widths and the binary representation of exact decimal definitions. A source fit or inversion does not become P1 merely because its paper is authoritative. Published model-dependent inversions of narrow-facet growth observations can support the existence and approximate temperature regions of barrier reductions without promoting the exact M1 prescription out of P3. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Independent validation remains required outside the Phase 6 gate against observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses. Decision 0043 assigns all four families to Phase 7 because the Phase 6 source audit found no current apples-to-apples target; decision 0046 removes the phase-completion dependency without granting either phase validation credit.

The following §2.7 paragraph previously made Phase 6 the only possible validation gate:

> This converts Phase 6 from calibration into validation, and the difference is the whole point: the model can now fail. Set −5 °C — does a column grow? Set −15 °C — does the habit flip back to plates? A model that cannot be wrong is not attempting this problem. The two-axis Type × Evidence labels in §1.5 exist so that the gap between "the model was given real physics" and "the model was shown to reproduce reality" is stated rather than hidden — those are different claims, and Phase 6 is the only thing that can promote the first to the second.

It now distinguishes the two independently gated domains:

> This converts Phase 6 from calibration into validation, and the difference is the whole point: the model can now fail. Set −5 °C — does a column grow? Set −15 °C — does the habit flip back to plates? A model that cannot be wrong is not attempting this problem. The two-axis Type × Evidence labels in §1.5 exist so that the gap between "the model was given real physics" and "the model was shown to reproduce reality" is stated rather than hidden — those are different claims, and only an executed chartered validation gate can promote the first to the second over its named domain. Phase 6 is the first such gate; Phase 7's separately gated held-out work may establish a different named domain.

The §3.2 sequencing clause is amended:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Each milestone has a done when.

The amendment adds Phase 7's full phase-completion independence and Phase 8's bounded overlap while
keeping the earlier exceptions unchanged.

The amended sequencing clause is:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation while Phase 6 remains active. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Relevant upstream source/provenance corrections are integrated and rechecked before the Phase 8 freeze. The exception starts neither Phase 7 nor Phases 9–10: Phase 7 still needs its own plan, and Phases 9–10 remain uncharted. Each milestone has a done when.

Phase 6's completion contract is unchanged and remains load-bearing:

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the versioned protocol freeze (item 1) makes every authorized change auditable and invalidates prior sweep evidence for the replacement gate after a post-freeze edit.

The Phase 7 heading is retained:

> Phase 7 — Product layer (amended v1.18, decision 0029: four view profiles replace the earlier Explore / Lab / Sculpt sketch).

The four existing Phase 7 clauses whose timing or future-input dependency changes were:

> Held-out validation carried from Phase 6 (decision 0043). Owner: project maker `billatgameology`, through a named Phase 7 held-out-validation work package. Keep growth-rate, size-dependent-habit, pressure-dependence, and growth-history families separate. Before freezing any one, make its geometry, conditions, transport physics, observable, uncertainty, and scoring apples-to-apples or record that it remains non-comparable; required new physics receives its own ADR, specification, tests, and numerical controls. The Phase 6 `passEligible=false` candidate lock is the audited incompatibility finding, not a pass.

> GPU parity carried from Phase 6 (decision 0044). Owner: project maker `billatgameology`, through a named Phase 7 GPU-parity work package. Port the v6 canonical opposing-operand order to WGSL, derive and validate a binary32 convergence/error envelope against the float64 oracle, then freeze and execute at least 200 automated preview-budget runs; the intended coverage is all 204 points for CAK, M1, and `M1_NO_DIP_ABLATION` (612 runs) unless a pre-run ADR registers a scientifically stronger design. GPU outcomes stay separate from the Phase 6 float64 headline and retain bounded dispatch, GPU residency, fail-closed evaluation, and exact host/runtime/adapter/backend provenance.

> Realistic profile: the named visual target is the snowcrystals.com growth footage under research/snowcrystals.com-videos (canonical example J0521r2p). Smooth surface extraction (exposed prism faces → optional resampled shell; the LK fill fraction serves as the level set, so the surface advances continuously between interface steps) and the ice look: transparent refractive material over a designed backdrop gradient, dark facet-edge lines with bright ridge highlights, preserved interior relief, near-orthographic face-on default camera, restrained post-processing. A few curated pre-baked histories with a minimal control surface; preset labels obey §1.5 and Phase 6's outcome, with exact wording an open maker decision.

> Designer profile: the user composes growth intents over time — uniform/faceted vs pointy/branchy, widen vs lengthen, sprout sidebranches, seal back to a facet. The intent compiler maps intents through the model's own Phase 6-produced morphology diagram to an environment schedule and grows it forward with the real solver; the output is the crystal plus its generated journey, and the mapping is labeled as the model's diagram, not nature's. Full inverse design (recover a history from an arbitrary drawn target) is out of v1 scope (decision 0029).

The new standalone and replacement clauses are:

> Phase 7 is completely standalone from the completion of Phases 6 and 8 (decision 0046). It may begin only after its own plan is committed and in its own isolated worktree, but neither phase gates its start or completion. Phase 7 consumes only explicitly versioned, already-published inputs; it never waits for a future Phase 6 or Phase 8 artifact, and later upstream results do not silently replace its inputs. Decisions 0029, 0043, and 0044 retain their product, held-out-validation, and GPU-parity scope, while their post-Phase-6 scheduling is superseded. No Phase 7 result earns Phase 6 or Phase 8 credit.

> Held-out validation assigned from Phase 6 (decision 0043; timing superseded by decision 0046). Owner: project maker `billatgameology`, through a named Phase 7 held-out-validation work package that may begin independently of Phase 6 completion. Keep growth-rate, size-dependent-habit, pressure-dependence, and growth-history families separate. Before freezing any one, make its geometry, conditions, transport physics, observable, uncertainty, and scoring apples-to-apples or record that it remains non-comparable; required new physics receives its own ADR, specification, tests, and numerical controls. A passing Phase 7 held-out gate may upgrade the Evidence label only over its own executed, pre-registered named domain. The Phase 6 `passEligible=false` candidate lock is the audited incompatibility finding, not a pass, and no Phase 7 execution changes the Phase 6 verdict.

> GPU parity assigned from Phase 6 (decision 0044; timing superseded by decision 0046). Owner: project maker `billatgameology`, through a named Phase 7 GPU-parity work package that may begin independently of Phase 6 completion. Port the v6 canonical opposing-operand order to WGSL, derive and validate a binary32 convergence/error envelope against the float64 oracle, then freeze and execute at least 200 automated preview-budget runs; the intended coverage is all 204 points for CAK, M1, and `M1_NO_DIP_ABLATION` (612 runs) unless a pre-run ADR registers a scientifically stronger design. GPU outcomes stay separate from the Phase 6 float64 headline and retain bounded dispatch, GPU residency, fail-closed evaluation, and exact host/runtime/adapter/backend provenance.

> Realistic profile: the named visual target is the snowcrystals.com growth footage under research/snowcrystals.com-videos (canonical example J0521r2p). Smooth surface extraction (exposed prism faces → optional resampled shell; the LK fill fraction serves as the level set, so the surface advances continuously between interface steps) and the ice look: transparent refractive material over a designed backdrop gradient, dark facet-edge lines with bright ridge highlights, preserved interior relief, near-orthographic face-on default camera, restrained post-processing. A few curated pre-baked histories with a minimal control surface; preset labels obey §1.5 and the evidence labels attached to their explicitly versioned inputs, never the completion status of another phase. Exact wording remains an open maker decision.

> Designer profile: the user composes growth intents over time — uniform/faceted vs pointy/branchy, widen vs lengthen, sprout sidebranches, seal back to a facet. The intent compiler maps intents through an explicitly versioned model morphology diagram selected in the Phase 7 plan, emits an environment schedule, and grows it forward with the real solver. An existing Phase 6 measured diagram may be selected with its limits, but Phase 7 never waits for a future Phase 6 artifact and never relabels the diagram as nature's. The output is the crystal plus its generated journey. Full inverse design (recover a history from an arbitrary drawn target) is out of v1 scope (decision 0029).

Phase 8 has no prior charter clause. Version 1.23 adds its goal, isolation boundary, work items, and
Done-when milestone from the committed adoption plan. The complete new clause is:

> Phase 8 — What is real: the reconciled laboratory target book (added v1.23, decision 0046).

> Reconcile the multi-laboratory record into one graded, protocol-tagged, machine-readable target book: what was observed, by whom, under which seed, pressure, geometry, supersaturation semantics, growth history, and ensemble semantics, with what uncertainty, and where laboratories disagree. The book covers the relevant Libbrecht corpus plus Takahashi/Fukuta free-fall, Nelson sublimation, Bacon–Baker–Swanson levitation, Bailey–Hallett cold-end, and Harrison/Pokrifka/Harrington levitation-mass lineages. It extends rather than rewrites the historical Libbrecht-scoped `research/lab-validation-dataset.md` and `.jsonl` records.

> Every number intended for the book has a page-cited extraction line. Plotted-only quantities are identified as digitizations with a recorded read uncertainty; no curve value is invented from inspection. Each target classifies its supersaturation semantics and carries complete protocol tags. Inputs used to fit model kinetics are separated from validation targets, and Nakaya-informed or otherwise in-sample evidence retains that label. Disagreements are preserved as separate positions with a testable reconciliation hypothesis, never averaged into false consensus.

> Robustness classes carry explicit witness lists. Class A requires at least two independent witnesses from different laboratories and methods; Class B is single-laboratory or protocol-bound; Class C records a standing disagreement. Deterministic derived-observable operators — including mass-law exponent, P exponent, scaled-trajectory comparison, and boundary-temperature extraction — are specified and fixture-tested before any later model output is scored with them. A held-out split is pre-registered for the later Phase 9 research line; it has no Phase 7 gate effect.

> Phase 8 may execute concurrently with Phase 6 only under decision 0046's isolation boundary. It performs no solver run, model or parameter change, or model-output scoring. Already-published Phase 6 records may be read only with their existing labels and limits; Phase 7 artifacts and claims are outside the Phase 8 evidence chain. Phase 7 and Phase 8 have no mutual completion dependency. Phase 9 and Phase 10 remain outside this charter until separately adopted.

> Done when every target in the book carries (a) a page-cited extraction line in a tracked research index, (b) protocol tags (seed, pressure, geometry, supersaturation semantics and uncertainty, growth history, ensemble semantics), (c) a robustness class where Class A requires at least two independent witnesses, (d) an inputs-vs-targets flag, and (e) membership in a pre-registered held-out split — and the frozen, hashed book passes one proportionate non-author review with zero unresolved blockers.

Finally, the §3.3 UI-label clause previously read:

> No UI label ever claims more physical confidence than Phase 6 has earned. "The model was given real physics" and "the model was shown to reproduce reality" are different claims; only Phase 6 can promote the first to the second.

It now follows the same named-domain authority and excludes Phase 8:

> No UI label ever claims more physical confidence than the applicable executed validation gate has earned over its named domain. "The model was given real physics" and "the model was shown to reproduce reality" are different claims; only a pre-registered chartered validation gate — Phase 6 for Nakaya or a separately gated Phase 7 held-out comparison for its own domain — can promote the first to the second. Phase 8 cannot.

## Adversarial adoption review

This interpretive scheduling change received four read-only review passes before landing. All
reviewers were OpenAI Codex subagents from the same model family as the author and received shared
task context through forked threads; none qualifies as a different-model review.

- **Authority review.** Independently compared the charter and decision, re-executed exact
  changed-line quote coverage, and attacked Phase 7 independence, validation authority, the Phase 8
  isolation boundary, and the charter Done-when transfer. It did not inspect solver behavior,
  execute scientific evidence, or review the frozen education tree.
- **State review.** Independently cross-read `docs/PROGRESS.md`, both active plans, the charter,
  README, and AGENTS; it found the stale decision-0045 Phase 6 summaries and verified their repair.
  It also reproduced the documented macOS temporary-path failure mode. It did not audit historical
  evidence bundles or the running Windows ladder.
- **Verification review.** Re-executed Rule 7, `git diff --check`, the focused progress test, local
  link resolution, progress size limits, charter quote coverage, and exact Phase 8 Done-when text.
  It did not run the complete test suite or inspect solver/scientific correctness.
- **Final adversarial audit.** Tested whether the required positive Phase 7 sentence could coexist
  with the exact superseded progress wording, found that the first negative control was too narrow,
  and required this review record. It did not re-run earlier scientific gates or inspect education
  content beyond recording the standing freeze.

The author-side acceptance check is the final-byte exact `TMPDIR=/private/tmp npm test`, using the
repository's documented unsymlinked macOS temp-root convention. It is not credited as an
independent review. The combined review establishes internal scheduling/authority consistency only;
it makes no scientific, validation, solver, GPU, or Phase 6 execution claim.

## Consequences

- Phase 8 source reconciliation can advance while Phase 6 spends wall time on independent
  numerical evidence. Neither track can upgrade, mutate, or claim completion from the other.
- Phase 7 is eligible to begin without waiting for Phase 6 or Phase 8, but it is not activated by
  this decision. Its existing work stays in Phase 7; only the phase-completion timing is removed.
- The separate worktree prevents ordinary file and process collisions. It adds a reconciliation
  obligation before the target-book freeze and makes stale-source drift an explicit failure.
- Phase 8 becomes the second active plan. Cold-start documentation and `docs/PROGRESS.md` must route
  agents to the plan relevant to their work rather than assuming one global active plan.
- The first Phase 8 work is S0 source extraction. No target book, robustness class, or held-out
  split is claimed complete merely because the phase is now chartered.

## Alternatives considered

- **Wait for Phase 6 WP8.** Rejected by maker direction and by the absence of a scientific or
  resource dependency between source curation and the remote ladder execution.
- **Fold the target book into Phase 7.** Rejected. Phase 7 is the product/held-out/GPU track;
  coupling it to the Phase 8→10 research line would recreate the dependency the maker removed.
- **Make all future phases parallel by default.** Rejected. The overlap is safe because the Phase 8
  boundary is unusually narrow and read-only toward Phase 6; future phases require their own
  dependency audit.
- **Move Phase 7's carried work elsewhere to make it standalone.** Rejected. Independence requires
  removing the completion edge, not discarding ownership; versioned published inputs replace
  future-result dependencies without relocating the held-out or GPU work.
- **Edit the stale education branch in place.** Rejected. It was behind `origin/main` by 16 commits
  and carried unrelated Journey/video work. The Phase 8 branch was created from fetched
  `origin/main` so the live Phase 6 index remains authoritative and the education work stays
  untouched.
