# 0047 — Expand Phase 8 from target-book v1 to registered measurement-corpus closure

- **Date:** 2026-08-11
- **Status:** accepted
- **Charter impact:** document marker/current-revision record, §3.2 sequencing, and Phase 8 updated in this session

## Context

Decision 0046 chartered a deliberately bounded first Phase 8 milestone. It reconciled selected
laboratory claims into an 18-entry target book, froze that book, and closed its registered review.
That milestone answered which already-selected observations could become later targets. It did not
claim that every measurement-bearing page, table, plot series, archive member, or prose result in
the local research cache had been inventoried or extracted, and its own gap records deferred
governing sources and plotted-only values.

The maker clarified the intended foundation on 2026-08-11: collect the research and the measured
data so Phase 9 can build experiments against it; Phase 9 may change as Phase 8 exposes the actual
evidence. The maker then directed this recommendation to proceed. Treating target-book v1 as the
whole foundation would make Phase 9 design depend on an undocumented selection boundary. Editing
that accepted freeze in place would destroy the evidence that the first milestone actually passed.

“All research” cannot be proved as an unbounded universal. It can be made testable as closure over
a frozen local manifest plus a named external-search universe, exact queries, citation screens,
cutoff, acquisition rules, and deterministic stopping rule. Likewise, a paper count cannot prove
measurement completeness: the denominator must be the measurement-bearing units inside each
source, with every unit extracted or explicitly dispositioned.

This is a scope extension rather than implementation detail, so it changes the charter before any
new inventory, search, extraction, or digitization is treated as Phase 8B evidence.

## Decision

Phase 8 has two milestones:

- **8A, target-book v1, remains complete.** Its canonical book, split, report, supporting records,
  operators, verifier, freeze, and hashes remain byte-unchanged.
- **8B, measurement-corpus closure, is active and incomplete.** It builds a target-neutral source
  and measurement inventory upstream of any revised target book or Phase 9 design.

The unit of completeness is not a paper, container, archive member, or panel set. A measurement unit
is one homogeneous reported series or table/data block, one logical native-data series within an
archive member, one prose numerical result, or one individually condition-labeled panel/matrix cell;
when a source reports only an aggregate, that aggregate is the unit. Each locally held source page
and archive member receives two independent complete classifications, at least one visual, followed
by a reconciliation artifact with zero unresolved disagreement. Both passes independently assign or
review every measurement unit's observable, source/canonical units and quantity schema,
protocol/ensemble semantics, uncertainty presence/meaning, provenance/lineage, role, split/leakage,
extraction status/data reference, and disposition; those fields are reconciled individually rather
than inherited from the inventory producer.

The external search is registered before it executes. It names the bibliographic, publisher, data,
repository, and citation routes; exact queries and seeds; inclusion/exclusion rules; 2026-08-11
cutoff; version-of-record, correction, supplement, and data checks; acquisition disposition; and a
cumulative-set zero-addition stopping rule. Reconnaissance performed before this decision informs
the registry but is not closure evidence. A round freezes the complete cumulative set of included
sources at its start and re-executes every registered backward/forward citation and currency screen
over that nonempty set with fresh captured responses. Newly included sources enter the next set;
any eligible new source, lineage, dataset, governing version, correction, or supplement resets the
consecutive-zero counter. Closure requires two consecutive complete nonempty cumulative-source
rounds with zero additions. An unresolved route/lead, registry invalidation, or exhausted pre-frozen
resource cap produces a bounded-open result and requires a separately frozen successor registry.

Source bytes remain on the NAS and read-only. Git tracks identities, hashes, provenance, registered
extraction operators, and verification artifacts. It stores normalized numeric bytes only when
recorded rights permit redistribution; otherwise it stores the identity, hash, schema, locator, and
NAS-local data reference, and the verifier checks those local bytes without publishing them. The
same rule covers source tables and public datasets. Native data is preferred; tables and prose values
use exact transcription with an independent check; plot/image data uses a versioned operator with
calibration and repeated-read uncertainty; images without a defensible scale remain qualitative
rather than becoming invented measurements. Source-reported and extraction uncertainty stay
separate, and unreadable source units keep the corpus open.

Any measurement that informs a Phase 9 module, expected effect, probe, threshold, or campaign
design is model-development evidence and cannot be held out. Phase 8B does not run or alter a
solver, change model parameters, score model output, implement Phase 9, borrow Phase 6 credit, or
grant a validation label. Phase 7 remains standalone and Phases 9 and 10 remain uncharted.

## Exact charter changes

The document marker changed from:

> Project Document — v1.23, August 2026

to:

> Project Document — v1.24, August 2026

The former current-revision clause was:

> Current revision. v1.23 (2026-08-10) — decision 0046 charters Phase 8, the reconciled laboratory target book, and authorizes its source-curation work to proceed in an isolated worktree while Phase 6 remains active. It also makes Phase 7 completely standalone from the completion of Phases 6 and 8: Phase 7 may begin only under its own committed plan and isolated worktree, but it need not wait for either phase. Decisions 0029, 0043, and 0044 retain their Phase 7 product, held-out-validation, and GPU-parity scope while their post-Phase-6 scheduling is superseded. A separately gated Phase 7 held-out comparison may grant quantitative-validation status only over its executed, pre-registered named domain; Phase 8 source reconciliation cannot. No concurrent phase borrows an incomplete claim, mutates another phase's artifacts, earns another phase's credit, or consumes the live Phase 6 evidence host during a timing-sensitive row. Phase 9 and Phase 10 remain proposed and uncharted.

It is retained byte-substantively as this prior-revision clause:

> Prior revision. v1.23 (2026-08-10) — decision 0046 charters Phase 8, the reconciled laboratory target book, and authorizes its source-curation work to proceed in an isolated worktree while Phase 6 remains active. It also makes Phase 7 completely standalone from the completion of Phases 6 and 8: Phase 7 may begin only under its own committed plan and isolated worktree, but it need not wait for either phase. Decisions 0029, 0043, and 0044 retain their Phase 7 product, held-out-validation, and GPU-parity scope while their post-Phase-6 scheduling is superseded. A separately gated Phase 7 held-out comparison may grant quantitative-validation status only over its executed, pre-registered named domain; Phase 8 source reconciliation cannot. No concurrent phase borrows an incomplete claim, mutates another phase's artifacts, earns another phase's credit, or consumes the live Phase 6 evidence host during a timing-sensitive row. Phase 9 and Phase 10 remain proposed and uncharted.

It is preceded by this new clause:

> Current revision. v1.24 (2026-08-11) — decision 0047 preserves the accepted Phase 8 target-book v1 freeze and opens a second Phase 8 milestone: registered measurement-corpus closure. The continuation inventories every measurement-bearing artifact in the frozen local source manifest, runs a bounded external source-and-dataset search through a recorded cutoff under declared inclusion and stopping rules, extracts or explicitly dispositions every eligible measurement unit, and freezes a versioned corpus plus revised target book for later Phase 9 design. Phase 8 remains non-validating and performs no solver run, model or parameter change, or model-output scoring; Phase 7 remains standalone; Phases 9 and 10 remain uncharted.

The former §3.2 sequencing clause was:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation while Phase 6 remains active. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Relevant upstream source/provenance corrections are integrated and rechecked before the Phase 8 freeze. The exception starts neither Phase 7 nor Phases 9–10: Phase 7 still needs its own plan, and Phases 9–10 remain uncharted. Each milestone has a done when.

It is replaced in full by:

> Phases 1 and 2 can run in parallel; everything else is sequential except where an accepted, maker-directed ADR records narrower independence. Decisions 0007 and 0008 allowed Phase 3's development visualization to complete independently of Phase 2b. Decision 0010 allows Phase 4 to proceed while Phase 3 awaits external assertion and Phase 2b's v4 evidence run finishes: external processes and artifacts are immutable, no claim is borrowed, relevant upstream corrections must be integrated and rerun before Phase 4 evidence, and the exception ends with Phase 4. Phase 4 began in an isolated worktree; after maker-directed consolidation removed it, decision 0012 permits v2 only on `main` in the current Windows repository while preserving every isolation constraint on the separate Phase 2b process and evidence. Decision 0046 makes Phase 7 standalone from the completion of Phases 6 and 8 and allows Phase 8 source reconciliation, including decision 0047's measurement-corpus continuation, while Phase 6 remains active. Each active phase uses its own committed plan and isolated worktree; another phase's processes and artifacts are immutable, no incomplete claim or gate credit crosses a boundary, and no concurrent phase consumes the Phase 6 evidence host during a timing-sensitive row. Relevant upstream source/provenance corrections are integrated and rechecked before every Phase 8 freeze. The exception starts neither Phase 7 nor Phases 9–10: Phase 7 still needs its own plan, and Phases 9–10 remain uncharted. Each milestone has a done when.

The former Phase 8 clause was:

> Phase 8 — What is real: the reconciled laboratory target book (added v1.23, decision 0046).
>
> Reconcile the multi-laboratory record into one graded, protocol-tagged, machine-readable target book: what was observed, by whom, under which seed, pressure, geometry, supersaturation semantics, growth history, and ensemble semantics, with what uncertainty, and where laboratories disagree. The book covers the relevant Libbrecht corpus plus Takahashi/Fukuta free-fall, Nelson sublimation, Bacon–Baker–Swanson levitation, Bailey–Hallett cold-end, and Harrison/Pokrifka/Harrington levitation-mass lineages. It extends rather than rewrites the historical Libbrecht-scoped `research/lab-validation-dataset.md` and `.jsonl` records.
>
> Every number intended for the book has a page-cited extraction line. Plotted-only quantities are identified as digitizations with a recorded read uncertainty; no curve value is invented from inspection. Each target classifies its supersaturation semantics and carries complete protocol tags. Inputs used to fit model kinetics are separated from validation targets, and Nakaya-informed or otherwise in-sample evidence retains that label. Disagreements are preserved as separate positions with a testable reconciliation hypothesis, never averaged into false consensus.
>
> Robustness classes carry explicit witness lists. Class A requires at least two independent witnesses from different laboratories and methods; Class B is single-laboratory or protocol-bound; Class C records a standing disagreement. Deterministic derived-observable operators — including mass-law exponent, P exponent, scaled-trajectory comparison, and boundary-temperature extraction — are specified and fixture-tested before any later model output is scored with them. A held-out split is pre-registered for the later Phase 9 research line; it has no Phase 7 gate effect.
>
> Phase 8 may execute concurrently with Phase 6 only under decision 0046's isolation boundary. It performs no solver run, model or parameter change, or model-output scoring. Already-published Phase 6 records may be read only with their existing labels and limits; Phase 7 artifacts and claims are outside the Phase 8 evidence chain. Phase 7 and Phase 8 have no mutual completion dependency. Phase 9 and Phase 10 remain outside this charter until separately adopted.
>
> Done when every target in the book carries (a) a page-cited extraction line in a tracked research index, (b) protocol tags (seed, pressure, geometry, supersaturation semantics and uncertainty, growth history, ensemble semantics), (c) a robustness class where Class A requires at least two independent witnesses, (d) an inputs-vs-targets flag, and (e) membership in a pre-registered held-out split — and the frozen, hashed book passes one proportionate non-author review with zero unresolved blockers.

It is replaced in full by:

> Phase 8 — What is real: the reconciled laboratory measurement corpus and target book (added v1.23, expanded v1.24; decisions 0046–0047).
>
> Milestone 8A — target-book v1 (complete 2026-08-10).
>
> Reconcile the multi-laboratory record into one graded, protocol-tagged, machine-readable target book: what was observed, by whom, under which seed, pressure, geometry, supersaturation semantics, growth history, and ensemble semantics, with what uncertainty, and where laboratories disagree. The book covers the relevant Libbrecht corpus plus Takahashi/Fukuta free-fall, Nelson sublimation, Bacon–Baker–Swanson levitation, Bailey–Hallett cold-end, and Harrison/Pokrifka/Harrington levitation-mass lineages. It extends rather than rewrites the historical Libbrecht-scoped `research/lab-validation-dataset.md` and `.jsonl` records.
>
> Every number intended for the book has a page-cited extraction line. Plotted-only quantities are identified as digitizations with a recorded read uncertainty; no curve value is invented from inspection. Each target classifies its supersaturation semantics and carries complete protocol tags. Inputs used to fit model kinetics are separated from validation targets, and Nakaya-informed or otherwise in-sample evidence retains that label. Disagreements are preserved as separate positions with a testable reconciliation hypothesis, never averaged into false consensus.
>
> Robustness classes carry explicit witness lists. Class A requires at least two independent witnesses from different laboratories and methods; Class B is single-laboratory or protocol-bound; Class C records a standing disagreement. Deterministic derived-observable operators — including mass-law exponent, P exponent, scaled-trajectory comparison, and boundary-temperature extraction — are specified and fixture-tested before any later model output is scored with them. A held-out split is pre-registered for the later Phase 9 research line; it has no Phase 7 gate effect.
>
> Phase 8 may execute concurrently with Phase 6 only under decision 0046's isolation boundary. It performs no solver run, model or parameter change, or model-output scoring. Already-published Phase 6 records may be read only with their existing labels and limits; Phase 7 artifacts and claims are outside the Phase 8 evidence chain. Phase 7 and Phase 8 have no mutual completion dependency. Phase 9 and Phase 10 remain outside this charter until separately adopted.
>
> Done when every target in the book carries (a) a page-cited extraction line in a tracked research index, (b) protocol tags (seed, pressure, geometry, supersaturation semantics and uncertainty, growth history, ensemble semantics), (c) a robustness class where Class A requires at least two independent witnesses, (d) an inputs-vs-targets flag, and (e) membership in a pre-registered held-out split — and the frozen, hashed book passes one proportionate non-author review with zero unresolved blockers.
>
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

## Consequences

The research foundation is independent of the current Phase 9 draft: a later redesign can select
different experiments without losing measurements that were already found. Completeness becomes
recomputable at both source-unit and measurement-unit levels. Version, correction, dataset,
lineage, uncertainty, rights, and leakage information travel with the evidence instead of being
reconstructed when a target is selected.

The cost is substantial. Every page and archive member needs an explicit disposition, plotted data
needs pre-registered extraction and independent checking, and a bounded search can end open rather
than yield the desired closure. The new milestone reopens Phase 8 without retracting its accepted
first freeze, so progress must report “8A complete; 8B active and incomplete” until the stronger
gate passes.

## Alternatives considered

- **Treat the 18-entry book as the whole Phase 9 foundation.** Rejected because it is a curated
  selection, not a measurement-level census, and known omitted or deferred measurements could
  change Phase 9 design.
- **Edit target-book v1 in place.** Rejected because it would invalidate an accepted freeze and
  erase the evidence boundary between what passed in 8A and what is learned in 8B.
- **Search indefinitely until no paper can be imagined.** Rejected because universal literature
  completeness is not falsifiable. Registered routes, a cutoff, and an explicit stopping rule make
  the strongest honest claim available.
- **Count papers rather than measurements.** Rejected because one paper can contain many tables,
  series, panels, archive members, and prose results; a paper-level check can silently omit most of
  its usable data.
- **Digitize only the curves Phase 9 already asks for.** Rejected because it bakes the current draft
  into the evidence denominator and makes later Phase 9 revisions lose unseen measurements.
- **Delay external search until after local extraction.** Rejected as a universal rule because
  version-of-record, correction, supplement, and raw-data discovery can replace unnecessary
  digitization. The plan freezes both denominators first, then interleaves acquisition and
  extraction by evidence priority without changing either registry.
