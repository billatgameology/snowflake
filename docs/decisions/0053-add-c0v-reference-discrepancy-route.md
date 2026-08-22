# 0053 — Add the C0V reference-discrepancy route

- **Date:** 2026-08-22
- **Status:** accepted by maker direction to continue and complete Phase 10
- **Charter impact:** document marker/current-revision record and the Phase 10 milestone updated in
  this session; the selected package, solver boundary, resource caps, and validation authority are
  unchanged

## Context

Decision 0052 selected a bounded Phase 10 package and made negative and refused outcomes
first-class. S5 then froze independent radial and moving reference derivations plus separately
implemented checks before any production-comparison code existed. Radial checked within its frozen
criteria. Moving did not: its exact artifact is a `reference-discrepancy-refusal`, with a failed
comparison and no reference/agreement credit. The moving science protocol had already stated that
this outcome publishes a scoped refusal without changing the protocol.

The S1 obligation matrix nevertheless encoded only two lifecycle branches: a valid independent
reference followed by a production witness/evaluation, or a preimplementation inability to make a
reference independent. Under its selected independent-reference branch, the moving packet still
requires a production witness, numerical evaluation, numerical checks, and both moving negative
controls. Running those obligations after the reference failed its own independent check would
create a comparison with no accepted reference. Relabeling the discrepancy as the separate
preimplementation refusal would also be false: that path and schema describe a different static
source/contract finding.

This is an obligation-graph defect exposed by the predeclared negative outcome. It is not authority
to tune the reference, change a tolerance, alter a solver, or choose a more favorable route.

## Decision

1. **Recognize the missing terminal lifecycle outcomes.** When a separately implemented C0V
   reference derivation and its independent check disagree before production, preserve and bind
   the exact discrepancy artifact and close that layer as a match-only refusal. When an
   independently classified artifact or prelaunch resource precondition blocks an otherwise
   referenced control before a valid witness, bind that pre-production refusal with no solver work.
   A separately validated registered-cap event may instead close during production with its exact
   partial execution recorded and no valid witness, numerical verdict, or numerical negative-
   control campaign. A crash, transport failure, or otherwise unclassified timeout/nonzero exit
   remains retryable infrastructure; exit status alone never classifies a scientific outcome.
2. **Make the route deterministic from frozen bytes.** For radial and moving controls, a pinned
   `reference-frozen` disposition selects the original full production route; a pinned
   `reference-discrepancy-refusal` selects the new match-only route; and a preimplementation
   refusal artifact selects the original reference-refusal route. Both radial and moving S5
   protocols preregistered the discrepancy consequence; only moving selects it on current bytes.
   A separately validated artifact/prelaunch-resource failure or registered in-run cap selects its
   corresponding refusal route; exit status alone never does.
3. **Preserve all old authority and evidence.** Do not edit decision 0052, the original obligation
   matrix, the execution-v1 catalogue or packet supplements, the S5 science protocols or schema
   contracts, the original A-P evidence, the reference candidate/check bytes, or the three pinned
   S5 outputs. Their identities and historical meanings remain exact.
4. **Freeze a scoped S6 successor graph.** Add
   `research/phase10-c0v-s6-obligation-matrix-v1.json`, binding the original matrix, C0V foundation,
   S5 protocols, and three pinned S5 artifacts. It preserves the original C0V definitions, adds the
   deterministic reference-discrepancy route, and concretizes the existing prelaunch and
   registered-cap artifact/resource-refusal outcomes for an otherwise referenced control. A separate
   `research/phase10-execution-v2/` catalogue, README, packet supplements, and resolved registries
   govern the remaining three produce packets, three publish packets, aggregate, and supplemental
   A-P. Conflicting duplicate definitions outside this named C0V override are refused.
5. **Run supplemental packet-specific A-P.** Packet `a-p-c0v-s6` binds the original A-P PASS,
   verifies the entire scoped S6 graph, and executes new missing-producer and uncalled-check
   controls. It publishes only under `evidence/phase10-obligation-preflight-v2/`; the v1 A-P bundle
   remains immutable. The three produce packets, three publish packets, and aggregate depend on
   the committed supplemental PASS; the supplemental packet itself depends on the original A-P
   PASS.
6. **Keep branch-applicable work exact.** When its artifact/resource preconditions pass, radial
   retains protocol/reference match reopeners, production witness, independent evaluation, four
   checks, and three registered controls; an independently classified failed prelaunch condition
   selects its no-solver refusal route instead, while a validated registered-cap event may select
   its partial-execution resource refusal. Moving
   retains only protocol/reference match reopeners, attempt bookkeeping, ancestry/resource checks,
   and an artifact-derived discrepancy-validity evaluator. Static retains only protocol/refusal
   reopeners, attempt bookkeeping, ancestry/resource checks, and its refusal-validity evaluator.
   Moving and static create no solver witness or numerical evaluation.
7. **Publish all layer dispositions and aggregate them.** Each layer publish packet independently
   derives its result from committed produce bytes. The moving result retains science branch
   `independent-reference` but has terminal `refusal`, the exact pinned discrepancy identity, and
   null witness/evaluation. Static likewise publishes its scoped refusal. The aggregate independently
   reopens all three results, must be non-PASS when any layer fails or refuses, and may still record
   package-completion eligibility while blocking dependent C5 work.
8. **Preserve freeze-before-value order.** Commit this governance correction first. Then commit the
   complete S6 graph, implementation, exact commands, tests, and output-absence proof before any S6
   packet runs. Run exact `npm test` and one bounded non-author audit on that clean implementation
   freeze. Publish and commit supplemental A-P before any layer packet, and serialize dependent
   packet publication through clean evidence commits. A-P and match-only packets execute no
   scientific values beyond reopening the already-pinned artifacts.

This decision does not authorize a solver/state/checkpoint contract change, a new control family,
automatic refinement, a target-facing score, C1–C5, D/E/F/G/H execution, a provider contact, a
source/search expansion, or a resource-cap increase.

## Exact charter changes

### Document marker and revision record

The document marker changes from:

> Project Document — v1.28, August 2026

to:

> Project Document — v1.29, August 2026

The former current-revision paragraph is retained verbatim apart from changing its leading label
from `Current revision.` to `Prior revision.`:

> Current revision. v1.28 (2026-08-21) — decision 0052 adopts a bounded Phase 10 scope, evidence-bridge, and absolute-numerical-verification package: A-S, A-I, B, C0, C0V, and packet-specific A-P. It creates two immutable-input scope overlays, terminally dispositions the already-held post-freeze intake, executes finite observation-mapping branches, re-derives persisted numerical diagnostics, and attempts three independently referenced numerical controls behind obligation preflight. The package executes no C1–C5 habit row, target-facing model score, solver-physics change, external provider contact, or unselected D–H package. Its outputs are Phase 10 development evidence; they do not create held-out evidence, grant quantitative-validation status, discharge Phase 7, rewrite Phases 6–9, or authorize a later branch without a new maker decision.

The resulting prior-revision paragraph is:

> Prior revision. v1.28 (2026-08-21) — decision 0052 adopts a bounded Phase 10 scope, evidence-bridge, and absolute-numerical-verification package: A-S, A-I, B, C0, C0V, and packet-specific A-P. It creates two immutable-input scope overlays, terminally dispositions the already-held post-freeze intake, executes finite observation-mapping branches, re-derives persisted numerical diagnostics, and attempts three independently referenced numerical controls behind obligation preflight. The package executes no C1–C5 habit row, target-facing model score, solver-physics change, external provider contact, or unselected D–H package. Its outputs are Phase 10 development evidence; they do not create held-out evidence, grant quantitative-validation status, discharge Phase 7, rewrite Phases 6–9, or authorize a later branch without a new maker decision.

The new current-revision paragraph is:

> Current revision. v1.29 (2026-08-22) — decision 0053 reconciles Phase 10's frozen C0V obligation graph with the predeclared case in which a separately implemented reference derivation and its independent check disagree before production, and explicitly concretizes the already-authorized artifact/resource-refusal cases for an independently referenced control. A discrepancy closes through a scoped, match-only refusal. A separately classified artifact or prelaunch resource precondition may close before production with no solver work; a separately validated registered-cap event may instead close during production with its exact partial execution recorded. Neither refusal creates a valid production witness or numerical verdict. A crash, transport failure, or otherwise unclassified timeout/nonzero exit remains retryable infrastructure, and exit status alone never classifies a scientific outcome. The original Phase 10 matrix, S5 science protocols, values, tolerances, and evidence remain immutable; a separately frozen S6 overlay and supplemental packet-specific A-P cover only the remaining C0V execution. C0V PASS still requires all three controls to reach independently referenced production and pass.

### Phase 10 milestone

The opening Phase 10 milestone paragraph was:

> Execute only the selected A-S + A-I + B + C0 + C0V package with packet-specific A-P. A-S creates versioned overlays over the immutable 18-entry Phase 8A book and 51-record Phase 8B successor; A-I terminally dispositions the already-held 14 payloads / 24 files and freezes one finite source-currency snapshot; B executes the finite B1a, B1b, and B2–B5 observation and apparatus mapping routes; C0 re-derives only quantities present in or independently derivable from committed Phase 6 ladder bytes; and C0V attempts the registered exact radial, static three-dimensional aggregate-v6/monopole-matched, and moving-interface-event controls. A missing source, mapping, independent reference, or required state yields a named refusal or no-decision, not an invented operand.

It becomes:

> Execute only the selected A-S + A-I + B + C0 + C0V package with packet-specific A-P. A-S creates versioned overlays over the immutable 18-entry Phase 8A book and 51-record Phase 8B successor; A-I terminally dispositions the already-held 14 payloads / 24 files and freezes one finite source-currency snapshot; B executes the finite B1a, B1b, and B2–B5 observation and apparatus mapping routes; C0 re-derives only quantities present in or independently derivable from committed Phase 6 ladder bytes; and C0V attempts the registered exact radial, static three-dimensional aggregate-v6/monopole-matched, and moving-interface-event controls. A missing source, mapping, independent reference, or required state yields a named refusal or no-decision, not an invented operand. When a separately implemented C0V reference derivation and its independent check disagree before production, preserve and bind that exact discrepancy and close the layer through a match-only refusal. When an independently classified artifact or prelaunch resource precondition blocks an otherwise referenced control before a valid witness can exist, bind that refusal before production with no solver work. When a separately validated registered cap prevents completion during production, retain the exact partial execution and close as resource refusal without a valid witness, numerical verdict, or numerical negative-control campaign. A crash, transport failure, or otherwise unclassified timeout/nonzero exit is retryable infrastructure, and exit status alone never classifies a scientific outcome.

The canonical Done-when was:

> Done when (a) A-S publishes separate versioned overlays covering 18/18 Phase 8A entries and 51/51 Phase 8B records with cited scope reasons, immutable evidence roles and phase ownership, multiple blockers where applicable, and unresolved or mixed counts; (b) A-I gives all 14 post-freeze payloads terminal identity, version, rights, lineage, duplicate, purpose, and eligibility dispositions and closes one currency snapshot for every selected B source lineage; (c) B1a, B1b, and B2–B5 each ends with its source-complete eligible bridge or dataset or an operand-level refusal, every allowed acquisition or search packet is terminal, and no B result has silently executed or authorized E, F, or H; (d) C0 independently re-derives the registered ladder breakdown from committed bytes, analyzes only persisted or independently derivable fields, and records the fields a future target-specific observable would require; (e) each C0V control either has a frozen independent reference, norms, tolerances, finite roster, and required negative control before its production implementation followed by an independent evaluator publishing a terminal pass, fail, or refusal from artifact bytes, or publishes an artifact-derived pre-implementation reference-independence refusal, and C0V is labeled PASS only if all three controls take the independent-reference branch and pass; (f) packet-specific A-P rejects at least one missing producer and one uncalled check, covers every registered obligation and proportionate negative control, and passes before every executable packet; and (g) a flagless `gate10` re-derives package completion and the separate scientific dispositions from committed evidence, the package report preserves every prior-phase label and artifact and states that no C1–C5 habit row, target score, held-out comparison, solver-physics change, or quantitative validation occurred, exact `npm test` passes, and one proportionate non-author review closes with zero unresolved blockers. A C0V failure or refusal or a B source refusal completes this package when reported under these rules; it blocks dependent future work but does not become a pass. Phase 10 grants no quantitative-validation label and no Phase 7, Phase 8, or Phase 9 credit.

It becomes:

> Done when (a) A-S publishes separate versioned overlays covering 18/18 Phase 8A entries and 51/51 Phase 8B records with cited scope reasons, immutable evidence roles and phase ownership, multiple blockers where applicable, and unresolved or mixed counts; (b) A-I gives all 14 post-freeze payloads terminal identity, version, rights, lineage, duplicate, purpose, and eligibility dispositions and closes one currency snapshot for every selected B source lineage; (c) B1a, B1b, and B2–B5 each ends with its source-complete eligible bridge or dataset or an operand-level refusal, every allowed acquisition or search packet is terminal, and no B result has silently executed or authorized E, F, or H; (d) C0 independently re-derives the registered ladder breakdown from committed bytes, analyzes only persisted or independently derivable fields, and records the fields a future target-specific observable would require; (e) each C0V control either (1) has a frozen independent reference, norms, tolerances, finite roster, and required negative control before its production implementation followed by an independent evaluator publishing a terminal pass, fail, or refusal from artifact bytes; (2) when an independently classified artifact or prelaunch resource precondition blocks execution before a valid witness, publishes and binds that pre-production refusal with no solver, witness, numerical evaluator, or numerical negative-control campaign; (3) when a separately validated registered cap prevents completion during production, publishes and binds the exact partial-execution resource refusal with no valid witness, numerical verdict, or numerical negative-control campaign; (4) when a separately implemented reference derivation and its independent check disagree before production, publishes and binds the exact discrepancy and closes as a match-only refusal with no solver, witness, numerical evaluator, or numerical negative-control campaign; or (5) publishes an artifact-derived pre-implementation reference-independence refusal, and C0V is labeled PASS only if all three controls reach independently referenced production and pass; (f) packet-specific A-P rejects at least one missing producer and one uncalled check, covers every registered obligation and proportionate negative control, and passes before every executable packet; and (g) a flagless `gate10` re-derives package completion and the separate scientific dispositions from committed evidence, the package report preserves every prior-phase label and artifact and states that no C1–C5 habit row, target score, held-out comparison, solver-physics change, or quantitative validation occurred, exact `npm test` passes, and one proportionate non-author review closes with zero unresolved blockers. A C0V failure or refusal or a B source refusal completes this package when reported under these rules; it blocks dependent future work but does not become a pass. Phase 10 grants no quantitative-validation label and no Phase 7, Phase 8, or Phase 9 credit.

The adjacent Phase 10 evidence-role, validation, isolation, resource, and return clauses remain
unchanged.

## Consequences

**Buys.** The machine contract now tells the truth about an outcome the science protocol already
allowed. A failed reference check stops before production instead of generating an impressive but
meaningless solver/reference comparison. Frozen negative results remain useful evidence.

**Costs.** Phase 10 gains one scoped successor graph, one supplemental A-P bundle, and a dedicated
S6 executor lifecycle. The final gate must verify a composite authority: v1 for completed history
and the successor overlay for remaining C0V packets. The moving layer can no longer exercise its
otherwise useful topology/event/ledger production control in this package.

**Forecloses.** Fabricating witness/evaluation files to satisfy the old roster; treating a result
schema's nullable fields as permission to skip matrix obligations; silently switching the moving
artifact to the static-only refusal path; tuning or regenerating the reference; weakening the exact
endpoint criterion after seeing it; or claiming C0V PASS from fewer than three passing controls.

## Alternatives considered

**Run moving production anyway and let the evaluator refuse.** Rejected because the accepted
reference is a prerequisite to a meaningful absolute comparison. It also contradicts the active
plan's explicit no-solver/no-witness handling of the frozen discrepancy.

**Select the old reference-refusal branch.** Rejected because that branch represents a
preimplementation inability, points to a different output, and its v1 concrete refusal contract is
static-only. It would rewrite the meaning of the pinned moving artifact.

**Rewrite matrix v1 or the S5 artifacts in place.** Rejected because it destroys the exact
pre-value and evidence history that makes the discrepancy trustworthy.

**Treat the package as complete while leaving the registered moving packets open.** Rejected
because A-P's purpose is exact obligation closure; an undocumented exception would recreate the
same missing-output/uncalled-check gap it was built to prevent.
