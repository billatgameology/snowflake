# 0054 — Close Phase 10 after maker-terminated C0V infrastructure

- **Date:** 2026-08-25
- **Status:** accepted by maker direction to stop the recovery ladder and continue through Phase 10
  completion
- **Charter impact:** document marker/current-revision record and the Phase 10 Done-when updated in
  this session; no solver contract, scientific result, prior-phase label, or validation authority changes

## Context

Phase 10's S5 work produced three immutable, manifest-pinned C0V artifacts before S6 production:
an independently checked radial reference, a moving reference/check discrepancy, and a scoped static
reference-independence refusal. Decision 0053 correctly made the moving and static negative branches
scientifically meaningful without inventing production witnesses.

The subsequent S6 executor did not finish its packet lifecycle. Supplemental A-P v6 completed, but
moving production encountered a sequence of infrastructure-only finalization defects through
recovery-v9. The maker then stopped recovery-v10 and further automatic recovery work because the
process had become disproportionate to the solo research decision. The exact retained recovery-v9
package lock now prevents even the separately eligible radial packet from entering preflight; a
read-only check passes, but the run stops before preflight, worker, or solver work. Removing the lock,
minting recovery-v10, or creating another executor lineage would contradict the maker's stop.

Meanwhile B is scientifically terminal: five source routes refuse, one is non-identifying, all
allowed searches are terminal, and `b-aggregate` independently returns refusal. The charter already
states that a B source refusal can complete the package without becoming a scientific pass. What it
does not currently express is how to close the package honestly after the maker terminates an
unclassified C0V infrastructure lineage. Leaving Phase 10 permanently open would turn failed process
machinery into a stronger completion requirement than the selected negative scientific outcome.

## Decision

1. **Terminate the exact S6 lineage without relabeling it.** Recovery-v9 is the last C0V S6
   authority. Recovery-v10 is not created, the retained locks and attempts are not removed or
   retried, and no unfinished S6 produce, publish, or aggregate packet receives completion credit.
2. **Report the three C0V layers separately.** Radial is `not-executed-infrastructure-stopped` with
   its accepted S5 reference preserved and no numerical verdict. Moving retains its published
   `reference-discrepancy-refusal`. Static retains its published scoped reference-independence
   refusal. The C0V aggregate is `incomplete-no-pass`, never PASS, FAIL, or a fabricated refusal.
3. **Allow one exact package-level exception.** For the selected Phase 10 package only, clause (e)
   may close through the maker-terminated state above when the package report and flagless `gate10`
   bind the exact S5 artifacts and accepted supplemental A-P, state every missing S6 credit, and
   derive package completion independently from the terminal B source refusal. This exception does
   not make an infrastructure stop a scientific disposition.
4. **Preserve the scientific boundary.** The package report must say that radial production was not
   executed, C0V is incomplete/non-PASS, no C1–C5 or E/F/H work occurred, no target score or held-out
   comparison exists, no solver physics changed, and no validation or prior-phase credit was earned.
5. **Keep the exception non-general.** A crash, transport failure, timeout, stale lock, or nonzero
   exit remains retryable infrastructure by default. Only an explicit maker termination recorded at
   charter authority can end a future lineage, and it cannot create scientific PASS/FAIL/refusal
   credit. This decision is not precedent for bypassing a still-authorized experiment.

## Exact charter changes

### Document marker and revision record

The document marker changes from:

> Project Document — v1.29, August 2026

to:

> Project Document — v1.30, August 2026

The former current-revision paragraph is retained verbatim apart from changing its leading label
from `Current revision.` to `Prior revision.`:

> Current revision. v1.29 (2026-08-22) — decision 0053 reconciles Phase 10's frozen C0V obligation graph with the predeclared case in which a separately implemented reference derivation and its independent check disagree before production, and explicitly concretizes the already-authorized artifact/resource-refusal cases for an independently referenced control. A discrepancy closes through a scoped, match-only refusal. A separately classified artifact or prelaunch resource precondition may close before production with no solver work; a separately validated registered-cap event may instead close during production with its exact partial execution recorded. Neither refusal creates a valid production witness or numerical verdict. A crash, transport failure, or otherwise unclassified timeout/nonzero exit remains retryable infrastructure, and exit status alone never classifies a scientific outcome. The original Phase 10 matrix, S5 science protocols, values, tolerances, and evidence remain immutable; a separately frozen S6 overlay and supplemental packet-specific A-P cover only the remaining C0V execution. C0V PASS still requires all three controls to reach independently referenced production and pass.

The new current-revision paragraph is:

> Current revision. v1.30 (2026-08-25) — decision 0054 closes the selected Phase 10 package after the maker terminated the infrastructure-only C0V S6 recovery lineage at recovery-v9. The exact retained S6 state earns no produce, publish, aggregate, solver, witness, numerical-verdict, or scientific-disposition credit. Radial is reported not executed, moving and static retain only their pinned S5 refusal meanings, and C0V is incomplete/non-PASS. Package completion rests independently on the terminal B source refusal plus the other completed selected obligations and requires an exact package report, flagless gate10, full suite, and non-author review. This is a one-package exception, not a rule that crashes become scientific refusals or that authorized experiments may be skipped.

### Phase 10 Done-when

The canonical Done-when was:

> Done when (a) A-S publishes separate versioned overlays covering 18/18 Phase 8A entries and 51/51 Phase 8B records with cited scope reasons, immutable evidence roles and phase ownership, multiple blockers where applicable, and unresolved or mixed counts; (b) A-I gives all 14 post-freeze payloads terminal identity, version, rights, lineage, duplicate, purpose, and eligibility dispositions and closes one currency snapshot for every selected B source lineage; (c) B1a, B1b, and B2–B5 each ends with its source-complete eligible bridge or dataset or an operand-level refusal, every allowed acquisition or search packet is terminal, and no B result has silently executed or authorized E, F, or H; (d) C0 independently re-derives the registered ladder breakdown from committed bytes, analyzes only persisted or independently derivable fields, and records the fields a future target-specific observable would require; (e) each C0V control either (1) has a frozen independent reference, norms, tolerances, finite roster, and required negative control before its production implementation followed by an independent evaluator publishing a terminal pass, fail, or refusal from artifact bytes; (2) when an independently classified artifact or prelaunch resource precondition blocks execution before a valid witness, publishes and binds that pre-production refusal with no solver, witness, numerical evaluator, or numerical negative-control campaign; (3) when a separately validated registered cap prevents completion during production, publishes and binds the exact partial-execution resource refusal with no valid witness, numerical verdict, or numerical negative-control campaign; (4) when a separately implemented reference derivation and its independent check disagree before production, publishes and binds the exact discrepancy and closes as a match-only refusal with no solver, witness, numerical evaluator, or numerical negative-control campaign; or (5) publishes an artifact-derived pre-implementation reference-independence refusal, and C0V is labeled PASS only if all three controls reach independently referenced production and pass; (f) packet-specific A-P rejects at least one missing producer and one uncalled check, covers every registered obligation and proportionate negative control, and passes before every executable packet; and (g) a flagless `gate10` re-derives package completion and the separate scientific dispositions from committed evidence, the package report preserves every prior-phase label and artifact and states that no C1–C5 habit row, target score, held-out comparison, solver-physics change, or quantitative validation occurred, exact `npm test` passes, and one proportionate non-author review closes with zero unresolved blockers. A C0V failure or refusal or a B source refusal completes this package when reported under these rules; it blocks dependent future work but does not become a pass. Phase 10 grants no quantitative-validation label and no Phase 7, Phase 8, or Phase 9 credit.

It becomes:

> Done when (a) A-S publishes separate versioned overlays covering 18/18 Phase 8A entries and 51/51 Phase 8B records with cited scope reasons, immutable evidence roles and phase ownership, multiple blockers where applicable, and unresolved or mixed counts; (b) A-I gives all 14 post-freeze payloads terminal identity, version, rights, lineage, duplicate, purpose, and eligibility dispositions and closes one currency snapshot for every selected B source lineage; (c) B1a, B1b, and B2–B5 each ends with its source-complete eligible bridge or dataset or an operand-level refusal, every allowed acquisition or search packet is terminal, and no B result has silently executed or authorized E, F, or H; (d) C0 independently re-derives the registered ladder breakdown from committed bytes, analyzes only persisted or independently derivable fields, and records the fields a future target-specific observable would require; (e) each C0V control either (1) has a frozen independent reference, norms, tolerances, finite roster, and required negative control before its production implementation followed by an independent evaluator publishing a terminal pass, fail, or refusal from artifact bytes; (2) when an independently classified artifact or prelaunch resource precondition blocks execution before a valid witness, publishes and binds that pre-production refusal with no solver, witness, numerical evaluator, or numerical negative-control campaign; (3) when a separately validated registered cap prevents completion during production, publishes and binds the exact partial-execution resource refusal with no valid witness, numerical verdict, or numerical negative-control campaign; (4) when a separately implemented reference derivation and its independent check disagree before production, publishes and binds the exact discrepancy and closes as a match-only refusal with no solver, witness, numerical evaluator, or numerical negative-control campaign; or (5) publishes an artifact-derived pre-implementation reference-independence refusal, and C0V is labeled PASS only if all three controls reach independently referenced production and pass; for this selected package only, clause (e) is also closed when the maker-terminated recovery-v9 state is preserved, radial is reported not executed with no verdict, moving and static retain only their pinned S5 refusal meanings, C0V is reported incomplete/non-PASS with no S6 packet credit, and package completion rests independently on the terminal B source refusal; (f) packet-specific A-P rejects at least one missing producer and one uncalled check, covers every registered obligation and proportionate negative control, and passes before every executable packet; and (g) a flagless `gate10` re-derives package completion and the separate scientific dispositions from committed evidence, the package report preserves every prior-phase label and artifact and states that no C1–C5 habit row, target score, held-out comparison, solver-physics change, or quantitative validation occurred, exact `npm test` passes, and one proportionate non-author review closes with zero unresolved blockers. A C0V failure or refusal or a B source refusal completes this package when reported under these rules; it blocks dependent future work but does not become a pass. Phase 10 grants no quantitative-validation label and no Phase 7, Phase 8, or Phase 9 credit.

The adjacent Phase 10 scope, evidence-role, isolation, resource, and return clauses remain unchanged.

## Consequences

**Buys.** Phase 10 can finish honestly on its terminal B finding without spending another work block
repairing a stopped evidence executor. The report keeps the useful S5 negative findings and makes the
unexecuted radial control visible instead of converting it into a result.

**Costs.** C0V remains incomplete and provides no radial production comparison or aggregate verdict.
Future work that needs C0V must start under new authority and cannot claim that this phase passed it.

**Forecloses.** Recovery-v10; deleting stale locks to reuse recovery-v9; claiming the radial control
passed, failed, or refused; claiming a completed C0V aggregate; or treating infrastructure failure as
scientific evidence.

## Alternatives considered

**Continue the recovery ladder.** Rejected by explicit maker direction after nine versions of
infrastructure work and no terminal moving packet.

**Delete the retained lock and run radial under recovery-v9.** Rejected because it rewrites retained
failure state and still leaves the stopped moving lifecycle unresolved.

**Leave Phase 10 open indefinitely.** Rejected because the selected package already has its terminal
B source result, and the open state would make optional recovery machinery determine the scientific
phase outcome.

**Call the C0V layers refusals.** Rejected for radial and for the unfinished S6 packets: no allowed
scientific refusal route was executed, so the honest label is incomplete/no-credit.
