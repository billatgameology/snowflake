# 0048 — Focus Phase 8B on a Phase-9-ready benchmark corpus

- **Date:** 2026-08-12
- **Status:** accepted
- **Charter impact:** document marker/current-revision record, §3.2 sequencing, and Phase 8 updated in this session

## Context

Decision 0047 deliberately made Phase 8B stronger than the completed 18-entry target book. It
required a bounded external search, two independent classifications of every registered PDF page
and archive member, extraction or terminal disposition of every eligible measurement, and two
complete cumulative zero-addition rounds. That was a defensible contract for an exhaustive
registered measurement-corpus claim.

Execution changed the decision. S0 froze 23 local containers and 914 source units. S2 round 0
captured 1,759 search rows, reduced them to 1,553 exact identifiers, acquired 28 valid PDFs, and
completed offline visual reconnaissance over all 49 local-plus-acquired PDFs and all 1,242 pages.
The 470 retained identifiers are a conservative metadata queue, not a justified download list.
Meanwhile the two local archives already expose 18 usable native longitudinal measurement members,
and the acquired papers identify a small set of direct pressure/thermal, history, and facet-rate
experiments that materially change the proposed Phase 9 consumer. The round-0 bundle extracts zero
new numeric rows. Discovery is no longer the main bottleneck; conversion of known measurements into
verified, protocol-tagged data is.

On 2026-08-12 the maker accepted the recommendation to stop broad discovery and build the smallest
scientifically defensible Phase-9-ready corpus. Continuing 0047 literally would spend the next work
unit classifying irrelevant pages twice, reviewing hundreds of low-precision leads, and proving two
global zero-addition rounds before extracting the native data already in hand. Those controls are
proportionate only to the stronger exhaustive-corpus claim. They are disproportionate to the actual
goal: a reliable experimental foundation for designing and running Phase 9 probes.

This is a charter-level scope change. Decision 0047 and every accepted S0/S1/S1a/S2 artifact remain
immutable evidence of what was registered and executed. Their historical `BOUNDED_OPEN` and
zero-extraction states are not rewritten as passes.

## Decision

Phase 8B now closes a **priority benchmark corpus**, not an exhaustive measurement corpus. The
selection rule is frozen before target-coordinate extraction:

- **P0 — native longitudinal data:** the 18 currently usable native members already identified in
  the two frozen local ZIP containers: 16 reconciled Harrison/Pokrifka mass-ratio histories and two
  Harrington–Pokrifka dimension histories.
- **P1 — direct module discriminators:** direct numeric series, tables, or prose results that
  discriminate a named candidate Phase 9 module or provide a condition-matched comparison. The
  initial families are the controlled pressure/thermal series, direct history/intervention
  trajectories, and empirical facet-rate series identified by the round-0 consumer audit.
- **P2 — interpretation-critical evidence:** one unique independent laboratory/method witness, one
  standing discrepancy, or one missing source-fitted input lineage required to interpret P0/P1.

Selection uses observable, protocol, and lineage criteria. It does not select a favorable numeric
outcome. Because round-0 reconnaissance has already exposed outcomes, every measurement that shapes
a Phase 9 module, expected effect, probe, threshold, or campaign design is model-development
evidence. It cannot later be relabeled held out.

The completed visual census over 49 PDFs / 1,242 pages is reused. Every selected benchmark record
receives complete source, condition, uncertainty, rights, lineage, role, split/leakage, and numeric
verification. Every ambiguous include/defer decision receives a second check, and a stratified
sample of clear deferrals/exclusions is audited for missed benchmark material. A second blind,
field-complete classification of every irrelevant page and archive member is no longer required.

The 1,553-identifier captured universe remains a frozen discovery record and explicit residual
backlog. It is not downloaded or fully classified merely to close Phase 8B. Exact identity,
version/corrigendum/supplement/native-data, lineage, rights, and acquisition checks are completed for
included benchmark sources and priority leads. After extraction exposes the actual gaps, one
registered targeted search/currency pass covers the named unsupported Phase 9 families and the
included-source lineages. A confirmed missing load-bearing priority source keeps the benchmark
open; a recorded non-load-bearing residual lead does not. Phase 8B makes no global search-saturation
claim, and round 0 remains `BOUNDED_OPEN` under decision 0047's stronger historical contract.

Native source bytes and normalized substantial row bodies remain on the NAS unless a recorded
rights determination permits redistribution. Git carries the source/container/member identities,
hashes, schema, locators, normalized-artifact hashes, protocol and uncertainty metadata, lineage,
rights state, split/leakage state, and verifier. Raw observations remain separate from duplicate-time
coalescing, interpolation, differentiation, fitting, or other derived transformations.

Phase 8A remains byte-identical. Phase 8B remains non-validating and performs no solver run, model
or parameter change, model-output score, or Phase 9 implementation. Phase 9 remains uncharted until
a separate maker-approved ADR and matching charter amendment adopt it.

## Exact charter changes

The document marker changes from:

> Project Document — v1.24, August 2026

to:

> Project Document — v1.25, August 2026

The former current-revision clause is retained byte-substantively as a prior-revision clause. It was:

> Current revision. v1.24 (2026-08-11) — decision 0047 preserves the accepted Phase 8 target-book v1 freeze and opens a second Phase 8 milestone: registered measurement-corpus closure. The continuation inventories every measurement-bearing artifact in the frozen local source manifest, runs a bounded external source-and-dataset search through a recorded cutoff under declared inclusion and stopping rules, extracts or explicitly dispositions every eligible measurement unit, and freezes a versioned corpus plus revised target book for later Phase 9 design. Phase 8 remains non-validating and performs no solver run, model or parameter change, or model-output scoring; Phase 7 remains standalone; Phases 9 and 10 remain uncharted.

It is retained as this exact prior-revision clause:

> Prior revision. v1.24 (2026-08-11) — decision 0047 preserves the accepted Phase 8 target-book v1 freeze and opens a second Phase 8 milestone: registered measurement-corpus closure. The continuation inventories every measurement-bearing artifact in the frozen local source manifest, runs a bounded external source-and-dataset search through a recorded cutoff under declared inclusion and stopping rules, extracts or explicitly dispositions every eligible measurement unit, and freezes a versioned corpus plus revised target book for later Phase 9 design. Phase 8 remains non-validating and performs no solver run, model or parameter change, or model-output scoring; Phase 7 remains standalone; Phases 9 and 10 remain uncharted.

It is preceded by this new clause:

> Current revision. v1.25 (2026-08-12) — decision 0048 accepts the maker's evidence-based Phase 8B scope correction: close a Phase-9-ready priority benchmark corpus rather than an exhaustive measurement corpus. The accepted Phase 8A freeze and all Phase 8B S0-S2 evidence remain immutable. Phase 8B reuses the completed 49-PDF / 1,242-page visual census; extracts and independently verifies the selected native longitudinal, module-discriminating, and interpretation-critical measurements; retains the residual discovery universe as an explicit backlog; and runs one targeted post-extraction gap and source-currency pass. Blanket duplicate classification of every irrelevant page and two global zero-addition search rounds are superseded. Phase 8 remains non-validating and performs no solver run, model or parameter change, model-output scoring, or Phase 9 implementation; Phase 7 remains standalone; Phases 9 and 10 remain uncharted.

The former §3.2 sequencing clause was:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation, including decision 0047's measurement-corpus continuation, while Phase 6 remains active. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Relevant upstream source/provenance corrections are integrated and rechecked before every Phase 8 freeze. The exception starts neither Phase 7 nor Phases 9–10: Phase 7 still needs its own plan, and Phases 9–10 remain uncharted. Each milestone has a done when.

It is replaced in full by:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation, including decision 0048's priority-benchmark continuation, while Phase 6 remains active; decision 0048 supersedes decision 0047's exhaustive Phase 8B closure obligations without changing its accepted historical evidence. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Relevant upstream source/provenance corrections are integrated and rechecked before every Phase 8 freeze. The exception starts neither Phase 7 nor Phases 9–10: Phase 7 still needs its own plan, and Phases 9–10 remain uncharted. Each milestone has a done when.

The former Phase 8 heading was:

> Phase 8 — What is real: the reconciled laboratory measurement corpus and target book (added v1.23, expanded v1.24; decisions 0046–0047).

It is replaced by:

> Phase 8 — What is real: the reconciled laboratory target book and Phase-9-ready benchmark corpus (added v1.23, expanded v1.24, focused v1.25; decisions 0046–0048).

The former Phase 8B clauses were:

> Milestone 8B — measurement-corpus closure (added v1.24, decision 0047).
>
> An eligible measurement unit is one homogeneous reported series or table/data block, one logical native-data series inside an archive member, one prose-reported numerical result, or one individually condition-labeled observational panel or matrix cell in an eligible primary source. When a source reports only an aggregate, that aggregate is the unit. Containers, archive members, multi-series tables, and panel sets are grouping records rather than atomic units. The registered scope covers laboratory or controlled natural-cloud observations of vapor-grown or sublimating individual ice crystals that report facet kinetics, mass, size or shape trajectories, habit or transition distributions, pressure or background-gas effects, ventilation or thermal effects, seed or nucleation effects, or growth-history responses, plus source-fitted inputs used by this project's model. Reviews and model papers are discovery routes; only located primary measurements become measurement units.
>
> Before any closure claim or revised split, freeze the local source manifest; named bibliographic, publisher, and data services; query strings and citation-graph seeds; inclusion and exclusion rules; cutoff date; and stopping rule. Every included source records its official identity and current version, corrigenda, supplements and public data, local byte hash or acquisition disposition, laboratory and method lineage, and rights status. Normalized numeric bytes enter Git only when recorded rights permit redistribution; otherwise tracked records bind their identity, hash, schema, locator, and NAS-local data reference, and the verifier checks the local bytes without publishing them. Each citation-expansion round freezes and processes the complete cumulative set of included sources, never only a newly discovered or empty frontier; it re-executes every registered backward/forward citation and source-currency screen over that set with fresh captured responses, and folds any eligible new source, lineage, dataset, governing version, correction, or supplement into the next cumulative set and resets the consecutive-zero counter. Search closure requires every registered query and citation screen to be dispositioned, two consecutive complete nonempty cumulative-source expansion rounds yielding zero such additions, and zero unresolved source or acquisition leads; an unresolved route/lead, registry invalidation, or exhausted pre-frozen resource cap yields a bounded-open result rather than closure.
>
> Every measurement unit records a stable identifier and locator, observable, units, protocol and ensemble semantics, reported uncertainty, extraction uncertainty, extraction status and data reference, provenance, inputs-versus-targets role, split/leakage status, and inclusion disposition. Native and tabulated numeric data are extracted; plot-only numeric series are digitized under a versioned operator with recorded read uncertainty or marked not numerically recoverable with a reason; observational images are condition/protocol indexed and never converted into invented numbers. Two independent complete classification passes cover every PDF page and archive member and independently assign or review every measurement unit's observable, source and canonical units/quantity schema, protocol and ensemble semantics, reported and extraction uncertainty presence and meaning, provenance and lineage, role, split/leakage status, extraction status/data reference, and disposition; at least one pass visually inspects every PDF page, and a field-level reconciliation artifact closes every disagreement before measurement-inventory completeness can pass. A revised target book selects from this inventory without changing target-book v1. Any measurement used to choose a Phase 9 module, expected effect, probe, threshold, or campaign design is model-development evidence, not held out.
>
> Phase 8B inherits decision 0046's isolation boundary. It performs no solver run, model or parameter change, model-output scoring, or Phase 9 implementation. Its external-search conclusion is bounded to its registered routes and cutoff rather than a universal claim to all research. Phase 7 remains standalone. Phase 8B cannot grant a quantitative-validation label; under §1.5 and §3.3, only Phase 6's Nakaya gate or Phase 7's separately gated held-out comparison may grant that label over its executed, pre-registered named domain unless a future charter amendment explicitly changes that authority.
>
> Done when (a) the frozen local source manifest has 100% source-index coverage; (b) the registered external search has 100% query and citation-screen completion, two consecutive complete nonempty cumulative-source expansion rounds with zero additions, and zero unresolved source or acquisition leads; (c) every eligible source has 100% measurement-unit inventory coverage established by two independent complete source-unit and measurement-semantic classifications, at least one visually inspecting every PDF page, reconciled field-by-field with zero unresolved disagreement, and every unit carries its locator, observable, units, protocol and ensemble semantics, reported and extraction uncertainty, extraction status and data reference, provenance, role, split/leakage status, and disposition; (d) every numerical unit is native-imported, table-transcribed, prose-transcribed, plot-digitized with registered read uncertainty, image-measured under a registered calibration with read uncertainty, or explicitly marked not numerically recoverable with a recorded reason, with zero pending, unindexed, blocked-unreadable, or otherwise nonterminal source or measurement units; (e) target-book v1 remains byte-identical; and (f) the frozen, hashed source register, search log, measurement inventory and data, revised target book and split, report, and verifier pass a full non-author adversarial review with zero unresolved blockers.

They are replaced in full by:

> Milestone 8B — Phase-9-ready priority benchmark corpus (focused v1.25, decision 0048; decision 0047's exhaustive closure contract is superseded).
>
> The completed local and acquired source census remains the discovery universe and residual backlog, not an exhaustive completion denominator. Before target-coordinate extraction, freeze the benchmark selection using three outcome-neutral priority classes: P0 is the 18 usable native longitudinal members already identified in the frozen local archives; P1 is direct numeric series, tables, or prose results that discriminate a named candidate Phase 9 module or provide a condition-matched comparison; P2 is a unique independent laboratory/method witness, standing discrepancy, or missing source-fitted input lineage required to interpret P0/P1. Selection uses observable, protocol, and lineage criteria. Qualitative-only, context, duplicate, same-campaign re-expression, out-of-domain, and non-discriminating numeric material may be deferred with a stable locator and reason. Any observed measurement used to choose a module, expected effect, probe, threshold, or campaign design is model-development evidence, not held out.
>
> Preserve decision 0047's frozen local manifest, registered search protocols, captured responses, source acquisitions, and round-0 `BOUNDED_OPEN` result as immutable evidence. Before the benchmark freezes, every included source and load-bearing priority lead records its official identity and current version, corrigenda, supplements and public data, local byte hash or acquisition disposition, laboratory and method lineage, and rights status. Normalized numeric bytes enter Git only when recorded rights permit redistribution; otherwise tracked records bind their identity, hash, schema, locator, NAS-local data reference, and verifier. After extraction exposes actual evidence gaps, run one registered targeted search and source-currency pass over the named unsupported Phase 9 families and included-source lineages. A confirmed missing load-bearing priority source keeps the benchmark open; a terminally recorded non-load-bearing residual lead does not. Phase 8B claims benchmark readiness, not global literature saturation.
>
> Every selected benchmark measurement records a stable identifier and locator, observable, source and canonical units, protocol and ensemble semantics, reported uncertainty, extraction uncertainty, extraction status and data reference, provenance and lineage, inputs-versus-targets role, split/leakage status, rights, and disposition. Native data is preferred; tables and prose use exact transcription; plot-only series use a versioned calibrated operator with repeated-read uncertainty; and images without defensible calibration remain qualitative. Raw observations remain separate from coalescing, interpolation, differentiation, fitting, or other derived transformations. Reuse the completed all-page visual census. Independently verify every included benchmark record's source-to-row semantics, numeric bytes, conditions, uncertainty, lineage, rights, role, and split; second-check every ambiguous include/defer decision; and audit a stratified sample of clear deferrals/exclusions for missed benchmark material. A successor target book selects from the verified benchmark without changing target-book v1.
>
> Phase 8B inherits decision 0046's isolation boundary. It performs no solver run, model or parameter change, model-output scoring, or Phase 9 implementation. Its external-search conclusion is bounded to its registered targeted routes and cutoff rather than a universal claim to all research. Phase 7 remains standalone. Phase 8B cannot grant a quantitative-validation label; under §1.5 and §3.3, only Phase 6's Nakaya gate or Phase 7's separately gated held-out comparison may grant that label over its executed, pre-registered named domain unless a future charter amendment explicitly changes that authority.
>
> Done when (a) target-book v1 and every accepted Phase 8B S0-S2 evidence bundle remain byte-identical; (b) the frozen P0/P1/P2 selection has 100% terminal source and measurement coverage, while every residual source or unit has a stable backlog locator and defer/exclude reason; (c) exact identity, current version, corrections, supplements, native data, lineage, rights, and acquisition are terminal for every included source and load-bearing priority lead, one targeted post-extraction gap/currency pass is complete, and no load-bearing priority lead remains unresolved; (d) every selected recoverable numerical measurement is normalized with source locators, protocol, ensemble, uncertainty, lineage, rights, role, and split metadata, while every selected nonrecoverable or qualitative unit has a terminal reason; (e) every included record and numeric artifact passes independent semantic and numeric verification, every ambiguous inclusion decision receives a second check, and a registered stratified audit reports zero misses in its sample of clear deferrals/exclusions; and (f) the frozen, hashed benchmark manifest and data bindings, residual backlog, search/currency record, successor target book and split, Phase 9 impact report, and artifact-derived verifier pass exact `npm test`, clean-checkout verification, and one proportionate non-author audit with zero unresolved blockers.

## Consequences

Phase 8 now spends its next work on measured data rather than on a universal completeness apparatus.
The first extraction tranche is native, large enough to exercise the existing mass-history operators,
and already bound to exact source bytes. Direct controlled experiments then cover the pressure,
thermal, history, and facet-rate questions most likely to change Phase 9.

The resulting claim is intentionally narrower. Phase 8B will not say it inventoried or extracted
every measurement in every discovered paper, and it will not say the literature search saturated.
Deferred sources may contain future-use measurements. The explicit backlog and promotion rule make
that cost visible and reversible without pretending it is zero.

Controls protecting real scientific value remain: exact source/version identity, current-source
checks, raw-versus-derived separation, numeric and semantic uncertainty, specimen/campaign lineage,
rights, development-versus-held-out leakage, full verification of selected numeric bytes, and one
independent closing audit. The removed work protected only the stronger exhaustive-corpus claim.

## Alternatives considered

- **Continue decision 0047 literally.** Rejected because round 0 showed the bottleneck had moved
  from source discovery to data extraction. Duplicate classification of irrelevant pages and two
  global zero-addition rounds would delay the experiment foundation without improving a selected
  benchmark row.
- **Declare the existing reconnaissance sufficient and start Phase 9 immediately.** Rejected
  because Phase 8B has zero newly normalized numeric rows. Source candidates and figure lists are
  not an experiment-ready corpus.
- **Download or fully screen all 470 retained identifiers.** Rejected because the queue combines
  88 likely primary works with 382 metadata-ambiguous records and is explicitly not a download list.
  Only priority identity/gap follow-up is authorized.
- **Use only the 18 native histories.** Rejected because those histories do not confront the
  pressure/thermal, history-intervention, and facet-rate premises that the acquired sources already
  showed will reshape Phase 9.
- **Drop independent review with the redundant page classifications.** Rejected because one
  source-to-row numeric/semantic audit protects the actual experimental inputs. The correction
  removes duplicate blanket coverage, not verification of data the model will consume.
