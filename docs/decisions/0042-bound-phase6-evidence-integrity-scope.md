# 0042 — Bound Phase 6 evidence integrity to accidental failure

- **Date:** 2026-08-03
- **Status:** accepted; reviewed as one direction-amendment unit with decisions 0043–0044
- **Charter impact:** amends the document revision marker and current-revision paragraph, and adds
  a threat-model and review-depth paragraph to §3.3 after the quoted pre-registration guardrail.

## Context

Phase 6 accumulated an evidence-hardening program whose remaining findings divide into two different
classes. One class can occur during ordinary research: a process can crash, a write can stop halfway,
an environment can drift, a command can be wrong, or a producer and evaluator can disagree. The
other class requires a person with control of the maker's own machine to deliberately replace Git
references, manipulate index or attribute state, redirect paths through reparse mechanisms, or
substitute the committed worker or launcher while arranging a self-consistent false record.

The project needs the first class controlled. The maker explicitly does not require Phase 6 to resist
the second. Treating both as one unbounded threat model consumed review effort without improving the
scientific comparison. It also conflicted with the repository's integrity-budget rule: new evidence
machinery is justified by a new in-scope attack surface, not by another way a hostile repository owner
could defeat their own controls.

The review process developed the same scope problem. Repeated reviews of prior reviews turned
hardening suggestions into blockers even when they could not change a published number or claim and
could not silently corrupt evidence. Phase 6 still needs non-author review, but it needs a stopping
rule and a definition of materiality.

### Charter document marker being amended

> Project Document — v1.20, August 2026

### Charter current-revision paragraph being amended

> Current revision. v1.20 (2026-08-02) — decision 0041 records the Phase 6 continuation-host CPU upgrade from the historical Ryzen 7 5700G to the Ryzen 9 5900XT with 16 physical / 32 logical processors. The RTX 3080 10 GB, Windows lane, and approximately 64 GiB of RAM remain. Phase 5 and the pre-upgrade Phase 6 sweeps keep the old-host provenance that produced them; the historical Phase 6 artifacts' lack of artifact-level host binding remains an explicit evidence limit. New Phase 6 continuation and replacement-gate evidence records the new CPU, runtime and actual concurrency/launch fields; GPU bundles independently observe the required adapter and backend fields and the driver where exposed. The extra cores change only scheduling of scientifically independent cases. They do not alter a case, scientific criterion, numerical-control obligation, GPU cohort, held-out obligation, or the Windows-only scope.

### §3.3 pre-registration guardrail after which the new paragraph is added

> Phase 6 runs pre-registered (added v1.2). The parameter table and validation protocol freeze before the sweep; post-freeze edits are ADR-logged and force a full re-sweep. This does not make misconduct impossible; it makes authorized changes explicit and supplies reviewers with versioned artifacts against which undisclosed drift can be detected.

The adjacent automated-evidence rule remains unchanged:

> Every scientific milestone is an automated metric, not a screenshot.

## Decision

1. Phase 6 evidence controls defend against accidental mistakes, process crashes or partial writes,
   stale or drifting environments, wrong or incomplete invocations, missing/duplicated/misaligned
   records, ordinary source or artifact drift, producer/verifier disagreement, and incorrect metric,
   reduction, or claim logic.
2. A finding is outside the Phase 6 threat model when exploiting it requires deliberate hostile
   action by a person controlling the maker's own research machine or repository. This closes, as
   one class, replacement-reference attacks; attribute, clean-filter, or stat-cache laundering;
   junction/reparse/path-redirection attacks; index-hidden tampering; and hostile substitution of
   committed worker, launcher, verifier, or source code. A self-consistent reseal after intentional
   owner tampering is not a Phase 6 acceptance case.
3. Preserve the rejected finding ledgers and isolated recovery trees as historical records. They do
   not authorize dispatch, schema migration, individual adjudication, or new controls. Reopening one
   requires identifying a new in-scope accidental-failure surface, not merely another attacker-only
   construction.
4. Each implementation, evidence, freeze, or interpretation unit receives one proportionate
   non-author review engagement with Rule 10 provenance and explicit limits. A blocker is only a
   defect that could change a published number or scientific claim, or silently corrupt evidence.
   Other hardening ideas are recorded as non-blocking suggestions.
5. The author may repair blockers and return the same unit for a bounded follow-up within that one
   review engagement. If the unit receives two blocker-bearing verdicts, work stops and the maker is
   given options; there is no third rebuild. A review is not itself sent through another review.
6. This scope limit does not waive independent derivation of gate verdicts, executable controls for
   in-scope accidental failures, exact environment and command provenance, pre-registration,
   numerical controls, or the rule that claims be computed from published artifact bytes.

## Consequences

**Buys.** Phase 6 review effort returns to errors that can occur during honest execution and can
alter the science. Units have a defined landing condition, while non-author review and fail-closed
artifact evaluation remain mandatory.

**Costs.** The resulting evidence is not tamper-resistant against a malicious local administrator,
repository owner, or substituted committed program. The reports must not imply that stronger
security property. Some historically recorded hardening suggestions will remain deliberately
unimplemented.

**Forecloses.** Dispatching the rejected finding universe one item at a time, creating a schema or
verifier solely to catch attacker-only local manipulation, treating every robustness suggestion as a
gate blocker, or recursively reviewing reviews.

## Alternatives considered

**Continue until every imagined repository attack is mechanically excluded.** Rejected because the
maker does not require resistance to malicious action on their own host, and a sufficiently
privileged attacker can substitute both producer and verifier. That work has no bounded completion
condition.

**Remove independent review and integrity controls entirely.** Rejected because accidental errors,
crashes, drift, and mistaken reductions remain credible threats to the Phase 6 result.

**Use an unbounded sequence of fresh reviewers.** Rejected because it creates review recursion and
turns differing hardening preferences into endless rebuilds. Two blocker-bearing verdicts instead
trigger maker escalation.
