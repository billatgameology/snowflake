# Phase 10 C0V S6 execution-v2

This directory freezes the executable S6 lifecycle authorized by decision 0053, charter v1.29,
and the active Phase 10 execution plan. It supplements rather than edits the original obligation
matrix, execution-v1, the S5 science protocols, or the three manifest-pinned S5 reference/refusal
artifacts. The packet catalogue fixes the serialized order:

1. `a-p-c0v-s6`
2. `c0v-moving-produce`
3. `c0v-moving-publish`
4. `c0v-radial-produce`
5. `c0v-radial-publish`
6. `c0v-static-produce`
7. `c0v-static-publish`
8. `c0v-aggregate`

## Maintainer-only authority builder

`build-authority.cjs` is tracked so this pre-freeze authority graph is reproducible across model
and machine handoffs. It is non-runtime maintainer scaffolding, not a registered command, callable,
launcher, preflight input, or source of execution credit. It overwrites the catalogue, matrix,
successor schema registry, and all eight protocol/registry pairs in place; it has no transactional
or dry-run mode. Run it only in a disposable copy after reviewing its inputs, then require a
byte-for-byte diff and the full implementation checks before adopting regenerated authority. It
must never be wired into `npm test`, the executor, or a registered packet command.

Only the protocol for the selected packet is executable. JSON never supplies a command or module
to dispatch: the executor accepts a compiled packet ID, requires the exact protocol path and
registered attempt ID below, and dispatches only compiled callables that exact-match the resolved
registry. The packet catalogue separately freezes the two shared runtime entrypoints: the parent
executor is `runner/src/phase10-c0v-s6-executor.ts` export `phase10C0VS6RunExecutor`, and the worker
dispatcher is `runner/src/phase10-c0v-s6-executor-worker.ts` export
`phase10C0VS6ExecutorWorker`. They are orchestration authority, not claim-producing callable rows.
Both entrypoints require `process.execArgv` to be exactly empty. They reject every environment key
whose ASCII-uppercase form is exactly `NODE` or `TS_NODE`, or begins `NODE_` or `TS_NODE_`; ambient
values are not copied into the preflight. The parent materializes the worker environment solely
from the catalogue's exact eight-row clean-environment authority, and the worker independently
requires full equality to that same block before dispatch. The registered threat boundary is the
state visible when each trusted Node entrypoint begins. Deliberate pre-entry execution that erases
its own trace is hostile-runtime behavior outside the accepted Phase 10 threat model and creates no
native-launcher prerequisite.

## Argument vectors

The sixteen direct-Node lines below are the exact packet/attempt command authorities. `check` is
read-only and acquires no lock or creates no attempt/output. It validates only the exact arguments
and compiled catalogue/protocol/registry/attempt authority; it explicitly does not observe an
authorizing preflight, resources, or mutable dependency state and cannot authorize or resume
`run`. `run` acquires the compiled package lock and then the compiled packet lock before reading
the catalogue, protocol, registry, repository state, dependencies, or resources. Argument order
is exact; extra flags reject. A packet remains fail-closed until its implementation-freeze
readiness flag and all registered callable identities resolve; the command line alone grants no
execution credit.
The parent/worker bridge is separately frozen in the catalogue. It uses blocking fd 0 commands and
fd 1 messages, each as one canonical compact JSON line plus LF and at most 33,554,432 bytes. Parent
commands use schema `phase10-c0v-s6-worker-command-v1` and exact fields
`schema,sequence,packetId,attemptId,kind,invocationId,acknowledgedWorkerSequence`; worker messages
use schema `phase10-c0v-s6-worker-message-v1` and exact fields
`schema,sequence,packetId,attemptId,kind,invocationId,payload`. Each direction has its own
zero-based contiguous sequence. `Uint8Array` values use the sole canonical base64 marker key
`$phase10C0VS6Bytes`. Boundary and artifact callbacks cannot return until the exact scoped parent
acknowledgement arrives. Stderr is diagnostic only. The parent synthesizes every retained
timestamp, duration, and terminal field from its own observations; no stdout value is timing or
route authority. The 33,554,432-byte line limit is only a framing ceiling. Each catalogue packet
instead freezes a 4,194,304-byte aggregate retained-stdout ceiling plus its exact permitted
message-shape budget: lifecycle lines are at most 4,096 bytes, boundary/progress lines 16,384,
artifact lines 262,144, and result lines 917,504. The packet row fixes the maximum count of each
class; their derived worst-case sum is at most the aggregate ceiling. Equality is accepted and one
additional byte fail-stops. Stderr is retained up to exactly 33,554,432 bytes; one byte more also
fail-stops without a terminal claim. `maximumOtherAttemptRootBytes` excludes both diagnostic logs
and bounds the terminal physical census of every other attempt-root file. For every packet the
exact storage equation is `projectedScratchBytes = maximumStdoutBytes + maximumStderrBytes +
maximumOtherAttemptRootBytes`; each maximum is counted once, equality is accepted, and a one-byte
overrun is unclassified infrastructure with no terminal claim.
Radial production's exact message budget is 2 lifecycle, 28 boundary/progress, 3 artifact, and 2
result lines. The 28 includes all eight Robin internal-case start/complete callbacks; its derived
maximum is 3,088,384 bytes.

```text
node runner/src/phase10-c0v-s6-executor.ts check --packet a-p-c0v-s6 --protocol research/phase10-execution-v2/packets/a-p-c0v-s6/protocol.json --attempt a-p-c0v-s6-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet a-p-c0v-s6 --protocol research/phase10-execution-v2/packets/a-p-c0v-s6/protocol.json --attempt a-p-c0v-s6-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-moving-produce --protocol research/phase10-execution-v2/packets/c0v-moving-produce/protocol.json --attempt c0v-moving-produce-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-moving-produce --protocol research/phase10-execution-v2/packets/c0v-moving-produce/protocol.json --attempt c0v-moving-produce-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-moving-publish --protocol research/phase10-execution-v2/packets/c0v-moving-publish/protocol.json --attempt c0v-moving-publish-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-moving-publish --protocol research/phase10-execution-v2/packets/c0v-moving-publish/protocol.json --attempt c0v-moving-publish-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-radial-produce --protocol research/phase10-execution-v2/packets/c0v-radial-produce/protocol.json --attempt c0v-radial-produce-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-radial-produce --protocol research/phase10-execution-v2/packets/c0v-radial-produce/protocol.json --attempt c0v-radial-produce-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-radial-publish --protocol research/phase10-execution-v2/packets/c0v-radial-publish/protocol.json --attempt c0v-radial-publish-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-radial-publish --protocol research/phase10-execution-v2/packets/c0v-radial-publish/protocol.json --attempt c0v-radial-publish-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-static-produce --protocol research/phase10-execution-v2/packets/c0v-static-produce/protocol.json --attempt c0v-static-produce-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-static-produce --protocol research/phase10-execution-v2/packets/c0v-static-produce/protocol.json --attempt c0v-static-produce-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-static-publish --protocol research/phase10-execution-v2/packets/c0v-static-publish/protocol.json --attempt c0v-static-publish-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-static-publish --protocol research/phase10-execution-v2/packets/c0v-static-publish/protocol.json --attempt c0v-static-publish-20260822-v1

node runner/src/phase10-c0v-s6-executor.ts check --packet c0v-aggregate --protocol research/phase10-execution-v2/packets/c0v-aggregate/protocol.json --attempt c0v-aggregate-20260822-v1
node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-aggregate --protocol research/phase10-execution-v2/packets/c0v-aggregate/protocol.json --attempt c0v-aggregate-20260822-v1
```

Each v1 protocol authorizes exactly one attempt ID and, for a produce packet, exactly one ledger
row. It cannot mint a second ID. No automatic retry, resume, deletion, overwrite, refinement, or
fan-out is authorized. A later attempt requires a separately frozen successor protocol, new unique
attempt ID, versioned ledger path, and exact binding/accounting of the earlier retained execution.

## Locks, launch state, and ancestry

Every `run` first acquires the hard-coded common lock
`out/phase10-execution-v2/locks/package.lock`, then the hard-coded packet lock from the catalogue.
The common lock proves package process concurrency one. A stale common lock halts every S6 packet.
The locks remain held through awaited worker execution and all validation/publication stages. A
rejected action retains its fail-closed lock until an explicitly governed later audit; normal
cleanup cannot erase an unexplained execution.

The lock wrapper also binds the exact parent-issued watchdog object to the same active `run`
locks and locked catalogue/protocol authority. Claim-bearing code synchronously rechecks the live
parent-monotonic clock at entry and immediately before and after every publication; a coherent
caller-built watchdog, a genuine watchdog from another action, or an expired watchdog rejects.
The outer deadline includes final claim-bearing revalidation and both locks' cleanup-eligibility
decisions. The physical unlink syscall is non-claim cleanup and is outside that measured decision,
but the parent rechecks immediately after the packet-lock unlink: if it crossed the deadline, the
package lock remains stale and invalidates the installed artifacts. A late preflight or other
installed artifact earns no standalone credit.

The retained preflight records the clean launch before the first generated write. It binds the
actual clean launch `HEAD`, branch, exact runtime `Node v24.13.1`, command, catalogue, matrix,
schemas, manifest at launch `HEAD`, dependencies, packet protocol, registry, and implementation
freeze. The implementation freeze is the common first-introduction commit of the full
execution-v2 authority/registry/callable closure, must be an ancestor of launch `HEAD`, and is not
silently equated with a later evidence commit. Old radial production-side closure members must
also raw-match the pre-observation S5 science freeze recorded in the radial protocol.

Clean means more than empty porcelain output. The `git ls-files -t -v` path roster must equal the
launch-HEAD tracked roster and every entry tag must be uppercase `H`; assume-unchanged,
skip-worktree, and sparse tracked entries reject. Registered filesystem authorities must be regular
files with one link and unaliased parents, except for the bounded publication transition below.

Post-write verification does not demand an impossible empty tree. It reopens the launch-HEAD
authority bytes and permits only this exact selected-stage generated set:

- freeze evaluation: the selected packet preflight path only;
- packet verification: selected-subroute required publication paths, excluding the current
  verification and final terminal-receipt paths;
- final reopen: every selected-subroute required publication path.

Any other dirt, index concealment, modified authority byte, wrong stage, or output from an
alternative subroute rejects. Attempt-root files remain ignored staging and are governed by their
separate exact census.

## Materializable outcomes

The only materializable produce-attempt dispositions are `production-complete`,
`preproduction-artifact-refusal`, `prelaunch-resource-refusal`,
`registered-cap-resource-refusal`, `reference-discrepancy-refusal`, and
`preimplementation-reference-refusal`, limited further by each packet's exact terminal subroutes.
The current selected scientific branches are:

- radial: immutable `reference-frozen`; production-complete PASS/FAIL or an independently
  validated radial artifact/prelaunch/in-run-cap refusal;
- moving: immutable `reference-discrepancy-refusal`; match-only verified refusal, with no solver,
  witness, numerical evaluator, or numerical negative-control campaign;
- static: immutable scoped preimplementation reference refusal; match-only verified refusal, with
  no solver, witness, numerical evaluator, or numerical negative-control campaign.

The radial artifact-refusal route is deliberately narrow. It covers only an exact-byte
`filesystem-object-policy-failure` on the science protocol or reference: the resolved object is
proven inside the physical repository before reading, descriptor hashing has identical fstat
identity/size/link observations before and after, and every non-selected binding and resource
condition passes. Missing, mismatched, noncanonical, unreadable, outside-root, or Git-cleanliness-
indeterminate operands are unclassified failures, not publishable refusals.

A prelaunch resource refusal selects exactly one failed registered free-space, package-storage, or
projected-process-hours condition; all other registered prelaunch conditions must pass. A
registered-cap refusal selects exactly one leaf whose parent-monotonic elapsed duration is strictly
greater than its registered maximum. Equality remains ordinary completion. Exit code or signal
alone never selects a lifecycle route.
For radial worker progress, `invocation-finished` and `worker-stopped` set only `caseId` null and
preserve the started/completed prefixes, `activeCaseId`, and cumulative counts. A production cap
inside a case therefore retains that active case in partial-execution authority; an ordinary
complete production naturally reaches those boundaries with `activeCaseId` null.

Radial artifact, prelaunch, and all five in-pipeline cap refusals are chartered, independently
verified layer-closing outcomes. They receive structural verification and dependency credit but no
accepted witness, numerical verdict, or completed negative-control-campaign credit. Moving/static
route-cause caps and nonproduce prelaunch/cap outcomes are packet resource maker-returns: their
terminal refusal receipts are pinnable, but packet verification and dependency completion are
absent. Normal moving discrepancy and static scoped-refusal outcomes are independently verified
and dependency-valid.

An unclassified spawn/crash/transport failure, outer-safety timeout, worker infrastructure state,
negative-control invalidity, census/resource/receipt failure, or other unexpected non-scientific
failure stops before a terminal candidate, attempt ledger, packet verification, or final terminal
receipt. It retains the immutable ignored root, raw exit/timing files, and stale locks for review,
earns zero credit, and requires a separately frozen successor. Current v1 registers no
claim-bearing retry tuple or infrastructure receipt.

## Timing and process accounting

Worker invocation timing is parent-authored in compact canonical `worker-invocations.jsonl`.
Attempt-v2 worker leaf records and nonproduce terminal invocation records are derived from those
events; caller wrappers are counted but do not add overlapping timing intervals. Radial progress is
parent-authored, embedded into the tracked attempt row, and reserialized exactly; active-case
partials never earn completed-case counts.

Every raw worker event carries a zero-based safe-integer `monotonicOffsetNanoseconds` written by
the parent. Invocation `elapsedNanoseconds` is the finish offset minus the start offset and
`wallSeconds` is exactly that value divided by 1,000,000,000. UTC instants are provenance only;
a wall-clock step cannot change a cap or package-process classification.

The radial solver-production leaf has the tighter 300-second maximum. Every other governed worker
leaf has a 14,400-second maximum. `complete` is allowed at or below the maximum; a validated
registered cap is strictly above it. Every cap cause reads the construction-time raw path
`internal.workerInvocations.<invocationId>.elapsedNanoseconds`, divides it exactly by
1,000,000,000 for the registered seconds comparison, and joins exact protocol/exit and radial
progress where applicable. A cause never reads its later attempt or terminal receipt. The final
verifier exact-joins the raw value one way to
`attempt.executableInvocationRecords.<invocationId>.wallSeconds` for produce packets or
`terminalReceipt.invocationRecords.<invocationId>.wallSeconds` for nonproduce packets.

Package process accounting first sums every governed worker executable leaf's safe-integer
`elapsedNanoseconds` exactly once, including moving or static route-cause work and completed
prefixes on cap outcomes. Seconds and process hours are each derived once by division by
1,000,000,000 and 3,600,000,000,000 respectively; floating seconds are never summed. Parent-side freeze, census, and
resource reopeners are acyclic structural orchestration, not solver/scientific process-hour work;
their invocation counters remain durable. Each packet nevertheless has a finite infrastructure-
only outer timeout equal to its complete registered leaf-maxima sum plus exactly 3,600 seconds.
The parent enforces this with monotonic nanoseconds at the limit plus one millisecond. Crossing it
is unclassified infrastructure, never scientific/resource refusal, and grants no scientific or
process credit. It is not serialized into a cyclic whole-action receipt: firing it retains the
ignored root and stale locks, invalidates any partial claim, and requires a separately frozen
successor.

Preflight reopens every prior selected verification plus every durable unselected/superseded
produce attempt, deduplicates exact packet+attempt, proves catalogue-prefix/attempt-census
completeness, and computes package process-hours before the attempt. It then adds the packet's full
registered maximum. The projection and final cumulative value must be at most 24 hours, exactly
86,400,000,000,000 nanoseconds; equality is allowed and one nanosecond greater refuses.

That accounting is scoped to the successful selected catalogue-prefix history. A moving/static or
nonproduce prelaunch/cap maker-return has no successful verification (and a nonproduce packet has no
attempt row), so it terminates this v1 history before aggregate. Any separately frozen successor
must first reopen and count the maker-return terminal timing and retained raw root exactly once;
current v1 never silently omits it or continues past it.

## Storage and resource accounting

Attempt roots use exclusive-create, append-only, no-delete, no-overwrite semantics. No temporary
copy or rename is permitted inside an attempt root. The final independent recursive census is the
honest terminal high-water mark: because nothing can be removed or replaced, `scratchBytes` equals
terminal retained bytes. A future ledger path may be excluded only because it does not exist until
the row is encoded; no physical candidate ledger is created. `resource-candidate.json` and
`census-candidate.json` are forbidden.

Every physical path copy counts; equal content is never deduplicated. The frozen pre-S6 baseline is
1,629,577 bytes: nine ignored S5 reference-attempt files totaling 1,085,192 bytes plus three pinned
S5 outputs totaling 544,385 bytes. Preflight adds actual retained package bytes, the packet's
registered scratch/publication projections, and exact finalization-stage projections. The result
must be at most 68,719,476,736 bytes and observed free space must satisfy the packet minimum and
projection. Projection is authorization before launch, not a reservation and not an inferred
post-run value.

Verification-v2 records exact packet resource accounting. Produce verification rederives the
attempt-v2 inline resource record. Nonproduce verification records the exact append-only
attempt-root/final-output census plus registered bounded projections for its own not-yet-written
verification and terminal receipt. Aggregate package accounting includes the baseline once, each
of the eight packet accounts once, and no duplicate physical path.

The predecessor `phase10-c0v-resource-ledger-v1` remains narrowly a produce-attempt ledger. In
this successful one-protocol/one-attempt v1 history it contains exactly radial-produce,
static-produce, then moving-produce and derives integer elapsed/process and retained-byte subtotals
from those three durable attempt ledgers. Its `totals`, `capExceeded`, and `disposition` are derived
only from those three rows; `packageProcessHoursMaximum: 24` is policy metadata, not a claim that
the legacy ledger accounts for the whole package. It is not complete package-cap evidence. Only verification-v2
package process/resource accounting covers supplemental A-P, publish, aggregate, and every selected
or unselected retained execution exactly once; it may reject the aggregate candidates after all
governed aggregate leaves finish.

## Acyclic construction and independent classification

All governed JSON is strict ordered-key, canonical pretty-2 plus one LF unless its registered
schema says JSONL or binary. Files and directories are exclusive-create. The claim-bearing chain
is one-way:

1. publish the retained preflight from the clean launch observation;
2. write raw parent timing/exit/progress and route-applicable worker artifacts;
3. independently write freeze and cause evaluations from raw authority and retain the actual
   pre-candidate check-caller results;
4. write immutable `terminal-success-candidate.json`, containing the exact pre-candidate caller
   result subsequence but no later census/resource caller result, ledger, packet-verification, or
   final-terminal identity;
5. take the final append-only attempt-root census, derive the inline resource record, run the
   separate census/resource checks in memory, and encode a produce ledger row once;
6. independently reopen and verify the packet, including exact classification reconstruction,
   all raw-to-final joins, and the complete selected-subroute caller-result roster;
7. write terminal-v2, which binds the terminal candidate, finalized produce ledger when
   applicable, route-applicable packet verification, and an exact copy of the complete caller
   results in that direction only.

No hash placeholder, overwrite, fixed point, self-identity, persisted resource candidate, or
persisted census candidate is allowed. The final verifier reruns every component evaluator and
exact-compares the entire canonical `classificationValidation`. The attempt writer is only its
assembler: it copies independently reopened route-cause, freeze, census, and resource components
and grants no verdict. Cause/classification evidence uses the same five fields; ignored staging is
corroboration only and can never be the sole support for a route-selecting observation.

The prewritten terminal candidate is not evidence until independent packet verification succeeds.
For maker-return subroutes, its valid route classification is distinct from packet/dependency
credit. A candidate exists for every valid planned outcome/refusal and for no unclassified
infrastructure state.

Each caller result names the actual registered caller and evaluator, its pre/post-candidate stage,
the exact executed/evaluated check and negative-control rosters, a canonical evaluator result, and
the exact reopened source identities. A complete row is independently rerun and exact-compared.
A `child-registered-cap` row has a null evaluator result, empty check/control rosters, and exact raw
parent invocation/progress sources; it records that the wrapper was entered without inventing
verdict credit. Candidate, verification, and terminal receipt never infer these rows from protocol
counts alone.

## Dependencies and publication

Dependencies are reopened from the evidence manifest as committed at the dependency packet's
recorded launch `HEAD`, not trusted from mutable live bytes. Every artifact identity includes exact
path, nonnegative byte length, and SHA-256. Radial publish selects an outcome-aware dependency
roster: preflight, attempt ledger, verification, and terminal receipt are common; a
production-complete disposition additionally requires witness and evaluation; a validated radial
refusal forbids witness and evaluation. Cross-route missing or extra artifacts reject.

Every publication has one exact registered sibling staging path outside every attempt root. The
writer exclusive-creates and fsyncs the stage, reopens and hashes it, creates the absent final by a
bounded hard-link transition, verifies both names/inode/bytes, and removes only the registered
stage. The temporary two-link window earns no verification, evidence, or dependency credit. An
accepted final must be a regular single-link file with an unaliased parent. A stranded registered
stage or two-link window fails closed for explicit audit; unrelated hard links and any attempt-root
stage reject. No random temporary name is permitted, and every physical stage copy is included in
the preflight storage projection.

## Verification and claim boundary

`phase10-packet-verification-v2` is the canonical selected-attempt timing/resource surface for all
eight packets. Produce verification binds and rederives attempt-v2. Nonproduce verification records
its exact registered governed leaf roster. Cumulative verification identities follow catalogue
order, contain every prior verification exactly once, omit the current receipt's self-identity,
and count an unselected attempt only when no prior/current verification represents that exact
packet+attempt. Omissions and double counting reject; package process-hours greater than 24 reject.
The verification `execution` field is route-aware rather than fabricated: it is the exact completed
main-evaluator provenance for normal credit-bearing routes, but is null for every structurally
verified radial artifact, prelaunch, or registered-cap refusal. Those routes remain publishable
validated refusals through their exact caller-result, raw invocation/partial-execution, timing,
census, and resource reproof; zero-worker and child-cap states do not acquire an invented completed
numerical-evaluator interval. Moving/static and nonproduce maker-return routes publish no
verification-v2.

The supplemental A-P packet proves every preserved original obligation is either active on the
selected terminal subroute or deterministically inactive, every added obligation has a real
producer/caller/evaluator, every published schema/output binding appears exactly once in the
successor registry, and every route roster resolves concrete definitions. It executes named
missing-producer and uncalled-check mutations, including a split shared structural check. Each
registered leaf runs exactly once in causal order: missing-producer control, uncalled-check
control, index producer, then the registered check-caller wrapper, which invokes the independent
evaluator exactly once. The control leaves retain canonical receipts
whose full before/after registry projections reproduce the raw mutated bytes. The evaluator, not
either mutator, reopens the live baseline, rederives the exact named edit, hashes the canonical
mutated registry, reruns the registered owner check, and exact-compares the refusal. The producer
only assembles the already-produced receipt bytes and artifact index; final packet verification
reruns the same independent reproof. A-P is obligation-completeness evidence, not scientific
correctness.

Each publication packet likewise runs its producer followed by its registered check-caller
wrapper; the wrapper invokes the publication evaluator exactly once. Moving publishes exact
`c0v-moving-result-v1` refusal fields, static publishes exact `c0v-static-result-v1` refusal
fields, and both use null witness/evaluation, `not-run-no-credit` negative-control disposition,
and `within-cap` resource disposition. Radial publishes exact `c0v-radial-result-v2` route-derived
fields. Each layer artifact index has bundle ID `phase10-numerical-verification-v1`, excludes
itself, and is output-ID/path sorted over the exact protocol, reference/refusal, attempt ledger,
and result; radial includes witness and evaluation exactly on production-complete.

Aggregate runs exactly three governed leaves: `nc-c0v-any-layer-nonpass`, aggregate producer, then
the registered aggregate check-caller wrapper. The control retains canonical
`any-layer-nonpass-control.json` under the strict retained preflight's exact
`observed.attemptDirectory`: an exact synthetic all-independent/pass three-row table, a copy
with only radial `scientificDisposition` changed from `pass` to `refusal`, both rederived aggregate
outcomes, and the six-field control result. The producer embeds only that strict result. The
wrapper and final verifier reopen the retained receipt, rederive the named mutation and outcomes,
and exact-compare them; no mutator-authored boolean or message grants control credit.

The radial control is only an idealized constant-coefficient spherical boundary-value-problem
implementation check. Its comparison-side routine is historically an auxiliary one-dimensional
spherical reference, not `LKSolver` or a three-dimensional production solver. The control grants
no three-dimensional solver, spacing-convergence, habit, apparatus, model-validation, target-score,
or prior-phase credit. The phrase "production-side role" in this control never broadens that
boundary. Moving is a tiny first-event numerical control with no habit/physical-realism claim;
static remains a scoped current-contract reference-independence refusal. S6 changes no solver or
scientific protocol and may never regenerate or tune the S5 reference/refusal bytes.
