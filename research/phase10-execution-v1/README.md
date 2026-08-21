# Phase 10 execution commands

## Purpose and claim boundary

This directory freezes the command surface for the maker-selected Phase 10 package. It is a
protocol record, not evidence that a packet has run. Phase 10 uses Node v24.13.1 in the isolated
`phase10/evidence-verification` worktree. No C1–C5 or habit command is authorized.

## Frozen authority and commit

Decision 0052, charter v1.28, and the active execution plan were adopted together at commit
`0c889c3423d87f9062555a058a320c4a5cce2bc5`. The S1 foundation, artifact-schema registry,
obligation matrix, C0 protocol, and C0V foundation become frozen inputs when their checkpoint
commit lands. A worktree file or this README does not authorize a packet before that commit and
its packet-specific supplement exist.

## Runtime and host preflight

Run the focused obligation tests while developing the S1 freeze:

```text
npx vitest run runner/test/phase10-obligation-preflight.test.ts
```

Run the exact repository check before committing an executable or evidence-producing change:

```text
npm test
```

Neither command executes a scientific row or grants packet-launch authority.

Before a deciding launch, the wrapper must observe Node v24.13.1, the allowed clean branch/head,
unique safe paths, sufficient memory and disk, no stale project writer, the packet roster and
resource projection, and governed NAS availability only when the packet needs it.

## Packet commands

Every later deciding B extraction and every C0/C0V producer or publisher must run through one
lock-holding wrapper after its packet-specific supplement is committed:

```text
node runner/src/phase10-executor.ts run --packet <packet-id> --protocol <repo-relative-json> --attempt <unique-id>
```

A-S is a static-contract packet and stays outside that machine executor. Its exact command
sequence is:

```text
npx vitest run runner/test/phase10-scope-overlay.test.ts

node runner/src/phase10-scope-overlay.ts produce --repository-root . --protocol research/phase10-scope-classification-protocol-v1.json --out out/phase10-scope-intake-v1-candidate

node runner/src/phase10-scope-overlay-verify.ts verify --repository-root . --protocol research/phase10-scope-classification-protocol-v1.json --bundle out/phase10-scope-intake-v1-candidate --receipt out/phase10-scope-intake-v1-candidate/scope-verification.json

node runner/src/phase10-scope-overlay.ts publish --repository-root . --candidate out/phase10-scope-intake-v1-candidate --out evidence/phase10-scope-intake-v1

npm test
```

The focused test neither produces nor publishes evidence. `produce` writes only the ignored
candidate bundle. The independent `verify` command reopens the candidate, frozen inputs, committed
classification protocol, and registered evaluator bytes; it derives the check verdict and writes
the verification receipt without trusting producer status. `publish` requires that passing receipt,
rechecks the exact registered candidate bytes, and atomically installs only the registered A-S
artifacts; it neither makes classification decisions nor recomputes the evaluator verdict. The final
exact `npm test` is required after publication and does not substitute for independent verification.

A-I is the other static-contract packet and also stays outside the machine executor. Its bounded
custody/currency command sequence is:

```text
npx vitest run runner/test/phase10-intake.test.ts

node runner/src/phase10-intake.ts produce --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --out out/phase10-scope-intake-v1-a-i-candidate

node runner/src/phase10-intake-verify.ts verify --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --bundle out/phase10-scope-intake-v1-a-i-candidate --receipt out/phase10-scope-intake-v1-a-i-candidate/intake-verification.json

node runner/src/phase10-intake.ts publish --repository-root . --candidate out/phase10-scope-intake-v1-a-i-candidate --out evidence/phase10-scope-intake-v1

npm test
```

The A-I producer reads only the governed post-freeze collection, tracked metadata, and the finite
lineage/currency roster bound by its committed packet supplement. The evaluator reopens those
inputs and the candidate bytes, and the publisher requires its passing artifact-derived receipt
before installing only the registered A-I files alongside the already-published A-S bundle. These
commands do not execute the separate `b-acquisition` packet or authorize source-value synthesis.

## Output and log paths

Each attempt uses one protocol-registered repository-relative evidence destination and one unique
ignored scratch root. The wrapper records the actual stdout, stderr, exit-status, partial-artifact,
resource-ledger, and receipt paths. It never shares a mutable attempt path across packets and never
uses an unregistered path supplied by a producer.

## Restart and single-writer semantics

The wrapper—not a separate preflight command—must hold the exclusive writer lock while it observes
the clean branch/head, runtime, code and protocol hashes, roster, paths, resources, process-hour
ledger, producer, evaluator, and executed-check receipt. It dispatches a hard-coded packet ID and
never executes a command string read from JSON. It retains stdout, stderr, exit status, partial
artifacts, and every superseded attempt before releasing the lock.

A read-only diagnosis may use:

```text
node runner/src/phase10-executor.ts check --packet <packet-id> --protocol <repo-relative-json> --attempt <unique-id>
```

`check` is non-authorizing. A later unguarded producer invocation is not equivalent to `run` and
cannot publish Phase 10 evidence.

The frozen packet IDs are:

```text
b-acquisition
b1a
b1b
b2
b3
b4
b5
b-aggregate
c0-derive
c0-publish
c0v-radial-produce
c0v-radial-publish
c0v-static-produce
c0v-static-publish
c0v-moving-produce
c0v-moving-publish
c0v-aggregate
```

## Evaluator and gate commands

A-S and A-I are static-contract entries with structural verification, not machine launches. A
deciding producer is followed inside the wrapper by its separately registered artifact-derived
evaluator; a producer-reported verdict is never accepted as the evaluator result. Closure remains
the flagless command:

```text
node runner/src/main.ts gate10
```

Unknown packet IDs, extra flags, a missing producer, an uncalled check, an unresolved conditional
reference branch, a dirty/disallowed head, runtime drift, unsafe or reused paths, stale writers,
insufficient free space, or a resource projection beyond the frozen caps must refuse before the
producer starts.

## Packet supplements

The S1 base matrix freezes the selected package's obligation classes. A later packet supplement
must bind every base output/check ID it implements, add exact input/code identities, roster,
reference or pre-implementation refusal, norms, tolerances, paths, and resource projection, and be
committed before deciding values are opened. Supplements may add stricter obligations but cannot
delete or weaken a base obligation.

Every supplement binds the concrete artifact-schema registry by safe repository-relative path,
byte length, and SHA-256. Freeze preflight permits a reserved output schema only when that packet is
named in the reservation's promotion roster. Run and receipt preflight require a concrete local,
alias, or independently hash-bound external contract and refuse a state changed to `defined`
without that contract.

For each C0V layer exactly one conditional route is terminal:

1. an independently checked frozen reference, followed by a production witness and independent
   artifact-derived evaluation; or
2. an artifact-derived pre-implementation reference-independence refusal, with no production
   witness.

A missing file or missing evaluator is an invalid/incomplete packet, not a scientific refusal.
C0V is PASS only if all three layers take route 1 and pass.

## Resource and refusal rules

Packet protocols use repository-relative tracked paths and unique ignored scratch/attempt paths.
They never hardcode an NAS drive letter; `scripts/nas-root.ts` resolves governed collections. The
C0V limit is four hours per executable invocation, 24 process-hours total, process concurrency one,
and 64 GiB across scratch plus retained raw/published attempts. Every packet records actual
concurrency and byte use. Crossing or projecting beyond a cap produces a resource refusal; it does
not delete an attempt, shrink a roster, or become a numerical failure.

Restricted third-party bytes remain in private, non-served NAS collections. Git receives only the
rights-safe identities, hashes, dispositions, protocols, project-derived summaries explicitly
allowed by the rights record, and evidence artifacts registered by the active plan.
