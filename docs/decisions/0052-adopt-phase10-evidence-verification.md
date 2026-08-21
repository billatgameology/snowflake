# 0052 — Adopt Phase 10 scope, evidence bridges, and numerical verification

- **Date:** 2026-08-21
- **Status:** accepted by maker direction
- **Charter impact:** document marker/current-revision record, §1.3 model-class boundary, §1.5
  validation authority, §2.7 development-evidence boundary, §3.2 sequencing, the Phase 8 bridge,
  the new Phase 10 milestone, and §3.3 validation-label guardrail updated in this session

## Context

The completed Phase 6, Phase 8, and Phase 9 records leave two different blockers. The available
laboratory evidence is not yet mapped consistently from apparatus conditions to the model's surface
forcing and observable, while the Phase 6 numerical ladder published a criterion no-pass for some
attached-count comparisons. Phase 8B contains 51 model-development records and zero held-out rows;
decision 0043 still assigns the four held-out-validation families to Phase 7. Phase 9 closed with
zero promotions. None of those facts authorizes a closure implementation or a new validation claim.

`docs/plans/phase-10-closures-and-frontier.md` was deliberately decision support. It stated that no
package was selected and required an accepted ADR, matching charter amendment, and committed
execution plan before source consumption, implementation, or a scientific run. Moving to the
Windows evidence host and creating an isolated worktree did not select a package or create that
authority.

On 2026-08-21 the maker explicitly accepted the candidate plan's recommended package: A-S + A-I +
B, alongside C0 and C0V with packet-specific A-P. The maker did not select C1–C2. The adopted
package therefore contains no scientific PC habit row, target-facing three-dimensional score,
closure implementation, or held-out validation. Negative, refused, and no-decision results are
first-class terminal outcomes.

## Decision

1. **Adopt only the selected package.** Phase 10 is governed by
   [`phase-10-evidence-verification-execution.md`](../plans/phase-10-evidence-verification-execution.md).
   Its executable scope is A-S, A-I, B, C0, C0V, and packet-specific A-P. C1–C5 and packages D–H
   remain unselected. A B result may propose exact E/F/H scope and budget for maker return but may
   not execute or authorize it.
2. **Make model class and current representability separate.** A-S creates new versioned overlays
   over the immutable 18-entry Phase 8A book and 51-record Phase 8B successor. Each row carries a
   model-class classification and reason independently from its current mapping, operator,
   transport, observation, or numerical blocker. A current implementation gap never becomes a
   permanent model-class exclusion, and no Phase 10 classification waives Phase 7 work.
3. **Keep source work finite and development-only.** A-I terminally dispositions the already-held
   14-payload / 24-file intake and freezes one currency snapshot for the B lineages actually used.
   B runs B1a, B1b, and B2–B5 from that intake, one six-target acquisition round, and at most one
   bounded targeted-search packet per unresolved named operand. There is no broad discovery,
   recursive citation chase, paid acquisition, provider contact, or experiment execution. A source
   opened by Phase 10 becomes development evidence and cannot later be relabeled unseen.
4. **Separate persisted diagnosis from absolute verification.** C0 independently re-derives only
   fields present in or independently derivable from the committed Phase 6 ladder artifact. C0V
   attempts three independently referenced layers: the existing exact radial control, a static
   three-dimensional aggregate-v6/monopole-matched field-and-flux control, and a symmetric moving-
   interface first-event control. Each freezes its reference, norms, tolerances, finite roster, and
   negative control before production implementation. Self-convergence is not an accuracy
   reference; a reference that cannot be made independent records a refusal.
5. **Close the obligation-production gap per packet.** Before any C0/C0V producer or publication
   packet runs, and before every B protocol that registers outputs or checks runs, A-P maps every
   registered output and check to its producer, artifact path or field,
   independent evaluator where required, and proportionate negative control. It refuses a missing
   producer, an uncalled check, a dirty or disallowed head, the wrong runtime, an invalid roster,
   unsafe shared paths, insufficient disk, or stale writers. Its adversarial fixtures remove one
   producer and make one check uncalled. A-P proves obligation completeness, not scientific
   correctness. A flagless `gate10` independently re-derives package completion and the separate
   scientific dispositions from committed evidence.
6. **Preserve phase and claim ownership.** Phase 6 evidence is read-only. Phase 8 artifacts remain
   byte-identical and retain their roles and splits; the Phase 8B successor remains zero-held-out.
   Phase 9 inputs and outputs retain development-only labels. Phase 7 retains its product,
   GPU-parity, and four held-out-validation families. Phase 10 grants no quantitative-validation
   label and no Phase 7, Phase 8, or Phase 9 credit. `GGThreshold` and `LibbrechtKinetics` remain
   unchanged; verification may expose a defect but does not authorize a scientific-contract repair.
7. **Bind the resource and return rules.** Phase 10 uses branch
   `phase10/evidence-verification` in the isolated worktree
   `G:\Code Files\snowflake-phase10-evidence`. `main` and other worktrees are read-only. New source
   bytes are capped at 10 GiB. C0 executes no solver. C0V is limited to four radial spacings, three
   or four predeclared static grid levels, and one moving-event case, without automatic refinement;
   each executable control invocation is capped at four wall-clock hours and the package at 24
   process-hours including retries and superseded attempts. C0V solver controls run at process
   concurrency one. A cap yields a resource refusal, not a numerical failure or silent roster
   reduction. Any solver/state/checkpoint contract change, provider contact or purchase,
   source/search expansion, target score, C1–C5 row, E/F/H action, or cap increase returns to the
   maker before continuation.
8. **Respect the governed storage boundary.** Restricted source payloads remain in private,
   non-served NAS collections under decision 0051. Git carries only rights-safe identities,
   bindings, aggregates, and dispositions. Any lawful new third-party acquisition uses the bounded
   `phase10-source-intake@2026-08-21-v1` lifecycle in the execution plan. No source prune is
   authorized.
9. **Use proportionate assurance once.** Routine source dispositions receive direct integrity; a
   load-bearing quantitative extraction or reference receives one targeted independent check.
   Executable changes run exact `npm test`. The closing report and C0V aggregate receive one
   proportionate non-author review; reviews do not recurse, and checking stops when another pass
   cannot change a disposition, value, next experiment, or claim.
10. **Adopt one byte-stable Done-when.** The following paragraph is copied byte-identically into
    the charter and execution plan and governs both positive and negative completion:

Done when (a) A-S publishes separate versioned overlays covering 18/18 Phase 8A entries and 51/51 Phase 8B records with cited scope reasons, immutable evidence roles and phase ownership, multiple blockers where applicable, and unresolved or mixed counts; (b) A-I gives all 14 post-freeze payloads terminal identity, version, rights, lineage, duplicate, purpose, and eligibility dispositions and closes one currency snapshot for every selected B source lineage; (c) B1a, B1b, and B2–B5 each ends with its source-complete eligible bridge or dataset or an operand-level refusal, every allowed acquisition or search packet is terminal, and no B result has silently executed or authorized E, F, or H; (d) C0 independently re-derives the registered ladder breakdown from committed bytes, analyzes only persisted or independently derivable fields, and records the fields a future target-specific observable would require; (e) each C0V control either has a frozen independent reference, norms, tolerances, finite roster, and required negative control before its production implementation followed by an independent evaluator publishing a terminal pass, fail, or refusal from artifact bytes, or publishes an artifact-derived pre-implementation reference-independence refusal, and C0V is labeled PASS only if all three controls take the independent-reference branch and pass; (f) packet-specific A-P rejects at least one missing producer and one uncalled check, covers every registered obligation and proportionate negative control, and passes before every executable packet; and (g) a flagless `gate10` re-derives package completion and the separate scientific dispositions from committed evidence, the package report preserves every prior-phase label and artifact and states that no C1–C5 habit row, target score, held-out comparison, solver-physics change, or quantitative validation occurred, exact `npm test` passes, and one proportionate non-author review closes with zero unresolved blockers. A C0V failure or refusal or a B source refusal completes this package when reported under these rules; it blocks dependent future work but does not become a pass. Phase 10 grants no quantitative-validation label and no Phase 7, Phase 8, or Phase 9 credit.

## Exact charter changes

### Document marker and revision record

The document marker changes from:

> Project Document — v1.27, August 2026

to:

> Project Document — v1.28, August 2026

The former current-revision paragraph was:

> Current revision. v1.27 (2026-08-12) — decision 0050 adopts Phase 9 as an isolated model-development program that may execute while Phase 6 remains active. It binds the completed Phase 8B successor corpus and Phase 9 knowledge baseline, requires the frozen bounded Git/NAS source manifest to be reconciled before an arm freezes, runs protocol compatibility before scoring and one-factor probes before combinations, and makes source-blocked, ineligible, no-effect, and no-pass outcomes first-class. All 51 Phase 8B records remain development evidence with zero held-out rows; Phase 9 cannot grant a quantitative-validation label or earn another phase's credit. Its initial Mac tranche is source assimilation, measurement adapters, analytic/planar work, and the bounded scalar bulk-transfer replay. Phase 6's Windows evidence host, processes, artifacts, and unpublished verdict remain isolated and immutable.

It is retained byte-substantively as:

> Prior revision. v1.27 (2026-08-12) — decision 0050 adopts Phase 9 as an isolated model-development program that may execute while Phase 6 remains active. It binds the completed Phase 8B successor corpus and Phase 9 knowledge baseline, requires the frozen bounded Git/NAS source manifest to be reconciled before an arm freezes, runs protocol compatibility before scoring and one-factor probes before combinations, and makes source-blocked, ineligible, no-effect, and no-pass outcomes first-class. All 51 Phase 8B records remain development evidence with zero held-out rows; Phase 9 cannot grant a quantitative-validation label or earn another phase's credit. Its initial Mac tranche is source assimilation, measurement adapters, analytic/planar work, and the bounded scalar bulk-transfer replay. Phase 6's Windows evidence host, processes, artifacts, and unpublished verdict remain isolated and immutable.

The new current-revision paragraph is:

> Current revision. v1.28 (2026-08-21) — decision 0052 adopts a bounded Phase 10 scope, evidence-bridge, and absolute-numerical-verification package: A-S, A-I, B, C0, C0V, and packet-specific A-P. It creates two immutable-input scope overlays, terminally dispositions the already-held post-freeze intake, executes finite observation-mapping branches, re-derives persisted numerical diagnostics, and attempts three independently referenced numerical controls behind obligation preflight. The package executes no C1–C5 habit row, target-facing model score, solver-physics change, external provider contact, or unselected D–H package. Its outputs are Phase 10 development evidence; they do not create held-out evidence, grant quantitative-validation status, discharge Phase 7, rewrite Phases 6–9, or authorize a later branch without a new maker decision.

Historical prior-revision paragraphs that correctly state Phase 10 was uncharted at their own dates
remain unchanged.

### §1.3 model-class boundary

The adjacent existing clauses remain:

> Not a molecular simulation. A real snow crystal contains ~10^18 water molecules. This is a mesoscopic model: each lattice cell stands in for trillions of molecules. That is legitimate because the physics being modeled (vapor diffusion, boundary attachment rates) is already continuum-scale — not because of any hand-wavy "fractal scaling" argument.
>
> Not a validated physical simulator. The solver is a phenomenological model inspired by real physics. The product's identity includes being honest about this (see §1.5).
>
> Not mobile. Target: desktop browser, WebGPU required, discrete GPU expected. Resolution stays a runtime parameter so the sim also runs small and fast (see §3).
>
> Not (initially) a social product. Galleries, sharing, and export come after the science works.

The following clause is added after them:

> Model-class boundary (added 2026-08-21, decision 0052). The v1 solver represents one vapor-grown ice crystal on one fixed hexagonal-prism lattice. Polycrystalline or twinned crystals, aggregation, riming or graupel, nucleation-mode diversity, and impurity- or chemistry-driven habit changes are outside that implemented model class. A source may remain mixed or unresolved, and a single-crystal phenomenon with a missing forcing map, observation operator, apparatus or transport boundary, or numerical qualification remains in-scope but currently unrepresented rather than being declared permanently out of scope. Phase 10 records these distinctions in a versioned overlay and cannot use them to waive a Phase 7 obligation.

### §1.5 validation authority

The Evidence clause was:

> Evidence — what it has earned: unvalidated; qualitatively supported; or quantitatively validated over a named domain. Only an executed, pre-registered chartered validation gate can grant the third, and only where its comparison actually holds. Phase 6 owns the Nakaya comparison; a Phase 7 held-out-validation work package may grant the label only over its separately gated, executed named domain. Phase 8 source reconciliation and Phase 9 model-development comparisons cannot grant it.

It becomes:

> Evidence — what it has earned: unvalidated; qualitatively supported; or quantitatively validated over a named domain. Only an executed, pre-registered chartered validation gate can grant the third, and only where its comparison actually holds. Phase 6 owns the Nakaya comparison; a Phase 7 held-out-validation work package may grant the label only over its separately gated, executed named domain. Phase 8 source reconciliation, Phase 9 model-development comparisons, and the selected Phase 10 scope, evidence-bridge, and numerical-verification package cannot grant it.

The adjacent claim-discipline clauses remain unchanged:

> Amended 2026-07-14 (decision 0003; validation authority generalized 2026-08-10 by decision 0046). Temperature is now a genuine input to the solver's physics, not a label applied to a knob afterward — so a real temperature slider is honest: Type = input, Evidence = unvalidated until the applicable named validation gate reports. What is not yet earned is the next claim: that the crystal which emerges at −15 °C is what nature actually grows at −15 °C. That is "quantitatively validated" and only an executed, pre-registered chartered validation gate can grant it, by testing it and possibly refuting it over its named domain.
>
> Hold the distinction precisely, because it is the one this project exists to be honest about: giving a model real physics is not the same as showing the model reproduces reality. Until the applicable named validation gate reports, the UI says "−15 °C (model input; morphology not yet validated against measurement)." A hover readout says "high relative attachment tendency," not "attachment rate: 91%." A designer tool can be honest about being a model; a fake physics readout is worse than none — and a real-looking number resting on an untested model is the most convincing fake of all.

### §2.7 development-evidence boundary

The provenance and validation paragraph was:

> Amended again 2026-07-14 (decision 0005; provenance split and taxonomy corrected 2026-08-02 by decision 0040; held-out schedule amended 2026-08-03 by decision 0043; phase timing amended 2026-08-10 by decision 0046; Phase 9 development boundary added 2026-08-12 by decision 0050): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 directly adopted authoritative source quantities, including measured or source-tabulated empirical inputs and exact metrological definitions (empirical entries state uncertainty or precision; defined entries state their defining authority and exact status); P2 fitted, model-inferred, project-derived, or figure-digitized quantities (with a stated domain of validity); P3 Nakaya-informed prescriptions, including the exact M1 dip functional forms/placement chosen using the diagram; P4 numerical/discretization choices, including this project's base-10 resolution of the M1 source's unstated logarithm base from its plotted dip widths and the binary representation of exact decimal definitions. A source fit or inversion does not become P1 merely because its paper is authoritative. Published model-dependent inversions of narrow-facet growth observations can support the existence and approximate temperature regions of barrier reductions without promoting the exact M1 prescription out of P3. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Independent validation remains required outside the Phase 6 gate against observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses. Decision 0043 assigns all four families to Phase 7 because the Phase 6 source audit found no current apples-to-apples target; decision 0046 removes the phase-completion dependency without granting either phase validation credit. Phase 9 may use the frozen Phase 8B successor corpus to confront the same observable families only as model-development evidence; it earns no held-out or validation credit and does not satisfy or replace the Phase 7 work package.

It becomes:

> Amended again 2026-07-14 (decision 0005; provenance split and taxonomy corrected 2026-08-02 by decision 0040; held-out schedule amended 2026-08-03 by decision 0043; phase timing amended 2026-08-10 by decision 0046; Phase 9 development boundary added 2026-08-12 by decision 0050; Phase 10 development boundary added 2026-08-21 by decision 0052): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 directly adopted authoritative source quantities, including measured or source-tabulated empirical inputs and exact metrological definitions (empirical entries state uncertainty or precision; defined entries state their defining authority and exact status); P2 fitted, model-inferred, project-derived, or figure-digitized quantities (with a stated domain of validity); P3 Nakaya-informed prescriptions, including the exact M1 dip functional forms/placement chosen using the diagram; P4 numerical/discretization choices, including this project's base-10 resolution of the M1 source's unstated logarithm base from its plotted dip widths and the binary representation of exact decimal definitions. A source fit or inversion does not become P1 merely because its paper is authoritative. Published model-dependent inversions of narrow-facet growth observations can support the existence and approximate temperature regions of barrier reductions without promoting the exact M1 prescription out of P3. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Independent validation remains required outside the Phase 6 gate against observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses. Decision 0043 assigns all four families to Phase 7 because the Phase 6 source audit found no current apples-to-apples target; decision 0046 removes the phase-completion dependency without granting either phase validation credit. Phase 9 may use the frozen Phase 8B successor corpus to confront the same observable families only as model-development evidence; it earns no held-out or validation credit and does not satisfy or replace the Phase 7 work package. The selected Phase 10 package may classify and map those same families, consume inspected sources only as development evidence, and verify numerical machinery, but it performs no held-out comparison and does not satisfy or replace the Phase 7 work package.

### §3.2 sequencing

The sequencing paragraph was:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation, including decision 0048's priority-benchmark continuation, while Phase 6 remains active; decision 0048 supersedes decision 0047's exhaustive Phase 8B closure obligations without changing its accepted historical evidence. Decision 0050 adopts Phase 9 as a model-development program that may execute while Phase 6 remains active, initially through source assimilation, measurement adapters, analytic and planar probes, and the bounded scalar bulk-transfer replay on the Mac worktree. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Phase 9 consumes only explicitly versioned, already-published inputs with their existing labels; later Phase 6 or Phase 7 results never silently replace them. Relevant upstream source/provenance corrections are integrated and rechecked before every Phase 8 freeze and before the affected Phase 9 arm freezes. The exception does not start Phase 7, which still needs its own plan, and Phase 10 remains uncharted. Each milestone has a done when.

It becomes:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation, including decision 0048's priority-benchmark continuation, while Phase 6 remains active; decision 0048 supersedes decision 0047's exhaustive Phase 8B closure obligations without changing its accepted historical evidence. Decision 0050 adopts Phase 9 as a model-development program that may execute while Phase 6 remains active, initially through source assimilation, measurement adapters, analytic and planar probes, and the bounded scalar bulk-transfer replay on the Mac worktree. Decision 0052 adopts only A-S, A-I, B, C0, C0V, and packet-specific A-P as Phase 10 development work in its committed isolated worktree; it does not start C1–C5 or any D–H package. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Phase 9 and Phase 10 consume only explicitly versioned, already-published inputs with their existing labels; later Phase 6 or Phase 7 results never silently replace them. Relevant upstream source/provenance corrections are integrated and rechecked before every Phase 8 freeze, before the affected Phase 9 arm freezes, and before the affected Phase 10 source or reference freezes. The Phase 10 adoption does not start Phase 7, which still needs its own plan. Each milestone has a done when.

### Phase 8 bridge

The Phase 8 bridge was:

> Phase 8 may execute concurrently with Phase 6 only under decision 0046's isolation boundary. It performs no solver run, model or parameter change, or model-output scoring. Already-published Phase 6 records may be read only with their existing labels and limits; Phase 7 artifacts and claims are outside the Phase 8 evidence chain. Phase 7 and Phase 8 have no mutual completion dependency. Phase 9 is governed by its milestone below; Phase 10 remains outside this charter until separately adopted.

It becomes:

> Phase 8 may execute concurrently with Phase 6 only under decision 0046's isolation boundary. It performs no solver run, model or parameter change, or model-output scoring. Already-published Phase 6 records may be read only with their existing labels and limits; Phase 7 artifacts and claims are outside the Phase 8 evidence chain. Phase 7 and Phase 8 have no mutual completion dependency. Phase 9 and Phase 10 are governed by their milestones below.

### New Phase 10 milestone

The following milestone is added after Phase 9:

> Phase 10 — Scope, evidence bridges, and absolute numerical verification (added v1.28, decision 0052).
>
> Execute only the selected A-S + A-I + B + C0 + C0V package with packet-specific A-P. A-S creates versioned overlays over the immutable 18-entry Phase 8A book and 51-record Phase 8B successor; A-I terminally dispositions the already-held 14 payloads / 24 files and freezes one finite source-currency snapshot; B executes the finite B1a, B1b, and B2–B5 observation and apparatus mapping routes; C0 re-derives only quantities present in or independently derivable from committed Phase 6 ladder bytes; and C0V attempts the registered exact radial, static three-dimensional aggregate-v6/monopole-matched, and moving-interface-event controls. A missing source, mapping, independent reference, or required state yields a named refusal or no-decision, not an invented operand.
>
> Every source or result inspected in Phase 10 is Phase 10 development evidence while retaining its underlying historical role. Phase 8 artifacts remain byte-identical and their roles and splits are not rewritten; the Phase 8B successor remains zero-held-out. Phase 7 retains product, GPU-parity, and the four held-out-validation families, and only its separately gated, value-blind held-out comparison may grant a new validation label. Phase 9 outputs retain development-only labels. Phase 6 evidence is read-only. `GGThreshold` and `LibbrechtKinetics` remain unchanged; C0V may verify but not amend their scientific contracts.
>
> Phase 10 uses branch `phase10/evidence-verification` in one isolated worktree. Before every executable C0/C0V packet and every B protocol that registers outputs or checks, A-P freezes every registered output and check, producer, artifact path or field, independent evaluator, and required negative control and refuses a missing producer or uncalled check; it also checks the clean allowed head, exact runtime, unique paths, finite roster, sufficient disk, and stale writers. The resource boundary is the finite 14-payload source tranche, six named acquisition targets, bounded targeted searches, and three C0V control families with the roster, storage, wall-clock, and process-hour caps frozen in the execution plan. No C1–C5 habit row, target score, D/E/F/G/H execution, external provider contact, or automatic fan-out is authorized. B may only return candidate E, F, or H scope and budget to the maker. Any solver change, provider contact, new acquisition or search packet beyond the frozen boundary, target score, or continuation beyond this package requires a new maker-approved plan amendment or ADR as applicable.
>
> Done when (a) A-S publishes separate versioned overlays covering 18/18 Phase 8A entries and 51/51 Phase 8B records with cited scope reasons, immutable evidence roles and phase ownership, multiple blockers where applicable, and unresolved or mixed counts; (b) A-I gives all 14 post-freeze payloads terminal identity, version, rights, lineage, duplicate, purpose, and eligibility dispositions and closes one currency snapshot for every selected B source lineage; (c) B1a, B1b, and B2–B5 each ends with its source-complete eligible bridge or dataset or an operand-level refusal, every allowed acquisition or search packet is terminal, and no B result has silently executed or authorized E, F, or H; (d) C0 independently re-derives the registered ladder breakdown from committed bytes, analyzes only persisted or independently derivable fields, and records the fields a future target-specific observable would require; (e) each C0V control either has a frozen independent reference, norms, tolerances, finite roster, and required negative control before its production implementation followed by an independent evaluator publishing a terminal pass, fail, or refusal from artifact bytes, or publishes an artifact-derived pre-implementation reference-independence refusal, and C0V is labeled PASS only if all three controls take the independent-reference branch and pass; (f) packet-specific A-P rejects at least one missing producer and one uncalled check, covers every registered obligation and proportionate negative control, and passes before every executable packet; and (g) a flagless `gate10` re-derives package completion and the separate scientific dispositions from committed evidence, the package report preserves every prior-phase label and artifact and states that no C1–C5 habit row, target score, held-out comparison, solver-physics change, or quantitative validation occurred, exact `npm test` passes, and one proportionate non-author review closes with zero unresolved blockers. A C0V failure or refusal or a B source refusal completes this package when reported under these rules; it blocks dependent future work but does not become a pass. Phase 10 grants no quantitative-validation label and no Phase 7, Phase 8, or Phase 9 credit.

### §3.3 validation-label guardrail

The UI-label paragraph was:

> No UI label ever claims more physical confidence than the applicable executed validation gate has earned over its named domain. "The model was given real physics" and "the model was shown to reproduce reality" are different claims; only a pre-registered chartered validation gate — Phase 6 for Nakaya or a separately gated Phase 7 held-out comparison for its own domain — can promote the first to the second. Phase 8 and Phase 9 cannot.

It becomes:

> No UI label ever claims more physical confidence than the applicable executed validation gate has earned over its named domain. "The model was given real physics" and "the model was shown to reproduce reality" are different claims; only a pre-registered chartered validation gate — Phase 6 for Nakaya or a separately gated Phase 7 held-out comparison for its own domain — can promote the first to the second. Phase 8, Phase 9, and the selected Phase 10 package cannot.

### Adjacent retained authority and solver guardrails

The following clauses remain unchanged and limit this decision.

The permanent surface-operator boundary remains:

> Put surface exchange behind a SurfaceOperator interface with two implementations, GGThreshold (2a's, unchanged) and LibbrechtKinetics. Both are kept permanently, exactly as the CPU oracle is kept permanently: the threshold rule is the working floor and the differential diagnosis when the physics misbehaves. The interface is wider than a per-cell shouldAttach: it owns per-cell state and mediates the vapor↔ice exchange (v1.3; concrete interface name synchronized after implementation audit).

The far-field evidence boundary remains:

> All three far-field conditions (§2.4) are selectable per run and recorded in checkpoint metadata: reflecting (2a's default, unchanged), fixed-σ Dirichlet, and monopole-matched. Both maintained Dirichlet-shell modes meter shell injection and use the policy-versioned divergence identity; fixed-σ clamps to `sigmaInfinity`, while monopole-matched clamps each shell pixel to its registered radius- and lag-dependent target and is the Phase 6 condition. The historical strengthened fixed-σ/reflecting differential starts both runs depleted: fixed-σ returns everywhere to the set value with injected field change metered and balancing, while the identical reflecting run conserves and settles depleted. Reflecting LK artifacts remain diagnostic-only and cannot support a physics claim. (Added v1.2; evidence scope clarified v1.4; monopole added and registered v1.17.)

Phase 7's independence, held-out ownership, and GPU ownership remain:

> Phase 7 is completely standalone from the completion of Phases 6 and 8 (decision 0046). It may begin only after its own plan is committed and in its own isolated worktree, but neither phase gates its start or completion. Phase 7 consumes only explicitly versioned, already-published inputs; it never waits for a future Phase 6 or Phase 8 artifact, and later upstream results do not silently replace its inputs. Decisions 0029, 0043, and 0044 retain their product, held-out-validation, and GPU-parity scope, while their post-Phase-6 scheduling is superseded. No Phase 7 result earns Phase 6 or Phase 8 credit.
>
> Held-out validation assigned from Phase 6 (decision 0043; timing superseded by decision 0046). Owner: project maker `billatgameology`, through a named Phase 7 held-out-validation work package that may begin independently of Phase 6 completion. Keep growth-rate, size-dependent-habit, pressure-dependence, and growth-history families separate. Before freezing any one, make its geometry, conditions, transport physics, observable, uncertainty, and scoring apples-to-apples or record that it remains non-comparable; required new physics receives its own ADR, specification, tests, and numerical controls. A passing Phase 7 held-out gate may upgrade the Evidence label only over its own executed, pre-registered named domain. The Phase 6 `passEligible=false` candidate lock is the audited incompatibility finding, not a pass, and no Phase 7 execution changes the Phase 6 verdict.
>
> GPU parity assigned from Phase 6 (decision 0044; timing superseded by decision 0046). Owner: project maker `billatgameology`, through a named Phase 7 GPU-parity work package that may begin independently of Phase 6 completion. Port the v6 canonical opposing-operand order to WGSL, derive and validate a binary32 convergence/error envelope against the float64 oracle, then freeze and execute at least 200 automated preview-budget runs; the intended coverage is all 204 points for CAK, M1, and `M1_NO_DIP_ABLATION` (612 runs) unless a pre-run ADR registers a scientifically stronger design. GPU outcomes stay separate from the Phase 6 float64 headline and retain bounded dispatch, GPU residency, fail-closed evaluation, and exact host/runtime/adapter/backend provenance.

Phase 8's split and validation limits remain:

> Robustness classes carry explicit witness lists. Class A requires at least two independent witnesses from different laboratories and methods; Class B is single-laboratory or protocol-bound; Class C records a standing disagreement. Deterministic derived-observable operators — including mass-law exponent, P exponent, scaled-trajectory comparison, and boundary-temperature extraction — are specified and fixture-tested before any later model output is scored with them. Target-book v1's pre-registered split remains frozen historical evidence with no Phase 7 gate effect; decision 0048's 51-record successor governs Phase 9 and contains zero held-out records.
>
> Phase 8B inherits decision 0046's isolation boundary. It performs no solver run, model or parameter change, model-output scoring, or Phase 9 implementation. Its external-search conclusion is bounded to its registered targeted routes and cutoff rather than a universal claim to all research. Phase 7 remains standalone. Phase 8B cannot grant a quantitative-validation label; under §1.5 and §3.3, only Phase 6's Nakaya gate or Phase 7's separately gated held-out comparison may grant that label over its executed, pre-registered named domain unless a future charter amendment explicitly changes that authority.

Phase 9's permanent controls and development labels remain:

> Use the completed Phase 8B priority benchmark, its residual source universe, and the Phase 9 knowledge baseline to determine which candidate mechanisms survive source-matched development confrontations, which reduce a declared discrepancy, and which are rejected or non-identifiable. Before any arm freezes, reconcile every relevant complete paper and archive registered in a frozen bounded Git/NAS manifest and check current versions, corrections, supplements, public native data, and the cited authors' later output; the 51 selected Phase 8B records are the score-ready priority benchmark, not the whole mechanism or protocol literature. Protocol compatibility precedes a score, one-factor probes precede combinations, and the permanent `GGThreshold` and `LibbrechtKinetics` operators remain unchanged controls.
>
> All 51 Phase 8B successor records are model-development evidence and none is held out. Phase 9 outputs remain development evidence even when a source replay agrees. Fitted inputs, same-lineage observations, software ablations, and source-derived rules keep those labels; they do not become independent physical confirmation. Future confirmation of a Phase-9-developed mechanism requires genuinely unseen evidence frozen before its values are inspected. Historical Phase 6, Phase 7, and Phase 8 artifacts are never rewritten or relabeled, and no Phase 9 result earns their gate credit.

The assurance and scientific-milestone guardrails remain:

> Assurance proportionality (added v1.26, decision 0049). Use decision risk, not the availability of another check, to set assurance depth. Routine source intake establishes identity and version, preserves and hashes the original when applicable, records exact locators, and distinguishes measured or transcribed values from project derivation, with units, conditions, uncertainty, and explicit gaps; it does not receive independent audit by default. A quantitative input that will carry a model, experiment, gate, or published conclusion receives one independent targeted transcription, calculation, or semantic check. A phase gate or strong public scientific claim receives the pre-registered evaluator, independent derivation, negative controls, and adversarial review named by this charter or an accepted decision. A new gate, check, review, registry, or verifier is admitted only for a plausible uncovered in-scope failure that could change a scientific decision or silently corrupt evidence, and only when the control is proportionate to the likely harm. Reviews are not reviewed, and checking stops when another pass is unlikely to change classification, values, the next experiment, or the published claim. If process consumes roughly one quarter of a work block without a direct source, measurement, calculation, code, experiment, or requested decision—or creates a second meta-validation layer—stop and simplify; this is a judgment tripwire, never a tracked metric or a new reporting obligation. Existing controls explicitly required by this charter or an accepted decision remain in force over their named scope until amended at the same authority level.
>
> Results are never compared across far-field boundary conditions silently (added v1.2); the checkpoint metadata carries the condition precisely so this is checkable by tooling.
>
> Results from Nakaya-informed (P3) inputs are never labeled independent validation, and no-SDAK and SDAK results are never merged in a report (v1.3, decision 0005).
>
> Every scientific milestone is an automated metric, not a screenshot.

## Adoption review

OpenAI Codex (GPT-5), acting as a non-author reviewer with inherited repository and conversation
context, reviewed this S0 governance change as one engagement and authored none of its bytes. The
review independently enumerated the complete charter diff, matched each changed nonblank charter
line to this decision's exact old/new inventory, checked the selected scope and exclusions against
the candidate-plan authority, re-derived the frozen input identities, compared the canonical
Done-when copies byte for byte, ran `git diff --check`, and ran
`npx vitest run runner/test/progress-index.test.ts`.

The first pass found three blockers: one stale S0/S1 status sentence, a candidate-plan input row
that described checkout bytes instead of the intended base Git blob, and ambiguous Done-when
wording that did not expressly permit a pre-implementation reference-independence refusal. The
author repaired all three. In the bounded follow-up the same reviewer re-derived the raw base blob
as 53,308 bytes with SHA-256
`67d47deb64b111e2bc3f4552e72ec6bb6a37754eb99608d27e74d6a2e141dd99`; confirmed that the plan,
Phase 10 charter milestone, raw decision text, and quoted charter copy carry one identical
2,249-byte canonical Done-when with SHA-256
`d57f6b45b457e92ef9956b03c63ff0e6962be35acbf8560c4c433a41249f111a`; confirmed the other five
frozen inputs report effective `text: unset`; repeated the focused eight-test run and diff check;
and returned zero unresolved blockers.

The review did not inspect source-payload contents, implement or execute a Phase 10 packet, run a
solver control, or substitute for the exact full-suite check performed by the author. Those are
limits of this adoption review, not evidence that the later package has executed.

## Consequences

**Buys.** The project can settle scope, source, apparatus, and numerical-reference questions without
pretending that an expensive habit campaign or new closure is already eligible. The finite package
can complete honestly with eligible bridges, failures, refusals, or a mix. A-P closes the specific
registered-output/uncalled-check gap identified in `docs/phase6-lessons.md` without becoming a
universal meta-validation layer.

**Costs.** Phase 10 may close this package without producing a physical model score. C0V can expose a
solver or reference defect that blocks later work, and B can end with source refusals. The
model-class overlay and apparatus mappings require scientific judgment whose uncertainty cannot be
eliminated by schema checks. Any useful E/F/H consequence requires another maker return.

**Forecloses.** Treating the candidate plan or worktree as authority; inferring C1–C2 from the use of
the Windows PC; relabeling Phase 8 records held out; using a representability gap as permanent scope
exclusion; calling self-convergence accuracy; inferring absent apparatus physics from a source map;
automatically implementing E/H or contacting an F provider; modifying a permanent surface operator;
or upgrading any Phase 10 result to quantitative validation.

## Alternatives considered

**Select the early C1–C2 numerical-risk probe.** Not selected. Its neutral attached-count sentinel
does not qualify a future B-defined consumer, and the maker accepted the evidence-plus-verification
package with no scientific habit row.

**Adopt all A–H packages at once.** Rejected because B outcomes must identify the exact E/F/H need,
C0V may refuse or fail before a target score is meaningful, and D has no promoted Phase 9
foundation.

**Stop immediately at G.** Not selected. The maker chose bounded new scope, source, mapping, and
verification work while preserving G as a future decision rather than silently adding it here.

**Use Phase 8A's historical split as a current held-out denominator.** Rejected by decision 0048:
the governing Phase 8B successor has zero held-out rows, and any evidence Phase 10 inspects becomes
development evidence.

**Treat all current implementation gaps as out of model class.** Rejected because it would make the
scope census flattering by construction and could waive Phase 7 obligations without authority.

**Use self-convergence for C0V.** Rejected because agreement with the production operator does not
establish absolute accuracy; the static layer refuses if it cannot obtain an independent reference.
