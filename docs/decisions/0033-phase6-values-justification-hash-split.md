# 0033 — Split the frozen manifest into a values hash and a justification hash

- **Date:** 2026-07-29
- **Status:** accepted
- **Evidence correction (2026-08-01):** the values/justification hash split remains accepted. The
  counterfactual below that a full re-sweep would reproduce identical numbers because the solver is
  deterministic is withdrawn. Three exact point replays establish only those executions on the
  tested host/engine and inherited environment; they do not entail all 204 rows or every state.
- **Charter impact:** **AMENDS §3.2 Phase 6 item 1.** Old → new wording below.

## Charter impact, in Rule 5 form

The clause being amended, quoted verbatim from §3.2 Phase 6 item 1:

> "Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior sweep
> results — the full sweep re-runs. This is what makes 'a negative result is a result' survive
> contact with a disappointing plot."

**Old behaviour.** "Parameters or protocol" is one undivided thing, and `PHASE6_PROTOCOL_SHA256`
hashes it as one. So a changed supersaturation fraction and a typo in a justification sentence are
indistinguishable: both move the hash, both invalidate the sweep, both cost a full re-run.

**New wording** (replacing the first sentence, second sentence unchanged):

> "Any post-freeze edit to a registered **value** requires a logged ADR and invalidates prior sweep
> results — the full sweep re-runs. Any post-freeze edit to a registered **justification** requires
> a logged ADR and invalidates nothing, provided the values hash is unchanged by it — which is
> mechanically checkable, because the values/justification partition is structural rather than a
> judgement about what counts as prose."

**What the amendment does not weaken.** The re-sweep price on values is untouched, and a
justification edit still needs an ADR. What changes is only that correcting a wrong sentence no
longer destroys correct evidence.

## Context

`research/phase6-sweep-report.md` currently ships with erratum E1 outstanding: the `t-sigma-grid`
freeze row's `source` string justifies the σ-axis upper bound with "toward f = 0.90 the basal/prism
contrast compresses from 0.34–3.76 to 0.84–1.25". Those are `CAK_A1` figures, and under the
registered `CAK` the range is 1.20–3.75 at f = 0.15 and 1.06–5.05 at f = 0.90 — **wider at the top,
so the argument reverses.** The registered grid *values* are unaffected; only the stated reason is
wrong.

Under the old clause, fixing that sentence costs a full re-sweep. Measured from the sweep's own
per-point timings that is **89.4 core-hours**, about 10 h wall-clock at concurrency 12 on this host
— but the former claim that it would reproduce identical numbers is not established. Three point
replays matched exactly at the tested host/engine and environment; that scoped measurement is
recorded in `docs/phase6-protocol-errata.md` and is not a universal determinism proof.

So the clause as written prices a prose fix at ten hours of compute and zero new information. The
observed consequence is that the prose does not get fixed: E1 sits in an errata file instead, which
means the frozen artifact a reader consults still contains the wrong sentence. **The clause is
producing the opposite of its intent** — it exists to stop convenient edits to inconvenient
evidence, and it is instead protecting a known error.

This will recur. Twenty-five freeze rows carry `requirement`, `value` and `source` prose; the audit
of 2026-07-29 checked one row's justification because a related claim failed, and found it wrong.
The other twenty-four have not been systematically re-derived.

## Decision

**Split the manifest in two, partitioned structurally.**

### 1. The partition is by DECLARED FIELD, never by judgement

`Phase6FreezeItem` gains a nested `prose` object, and the free-text fields move inside it:

```ts
export interface Phase6FreezeItem {
  readonly id: string;                    // values side — read by phase6PendingFreezeItems
  readonly group: Phase6FreezeGroup;      // values side — typed enum
  readonly status: Phase6FreezeStatus;    // values side — read by phase6FreezeComplete
  readonly prose: {                       // justification side, BY TYPE
    readonly requirement: string;
    readonly value: string | null;
    readonly source: string;
  };
}
```

A field is a value if it is declared outside `prose` and a justification if it is declared inside.
**Nobody decides whether a sentence "is really prose"** — the type does, and moving a field across
the boundary is a visible code change that both hashes react to.

### 2. Two manifests, two pinned hashes, each with revision history

- `phase6ValuesManifest()` — the eighteen typed constants the solver and scorer read
  (`interpolation`, `paramSet`, `latentHeating`, `farField`, `surfacePolicy`, `freezeCommit`,
  `parameterTableSha256`, `temperatureGrid`, `sigmaFractions`, `sigmaWaterAnchors`,
  `nakayaBoundariesC`, `ambiguityHalfWidthC`, `referenceRegimes`, `headlineScopeC`,
  `extrapolationOrderWindow`, `extentDriftBoundAR`, `domainSpotCheck`, `engineControl`) plus each
  freeze row's `{id, group, status}`. Pinned as `PHASE6_VALUES_SHA256`.
- `phase6JustificationManifest()` — every row's `prose`. Pinned as
  `PHASE6_JUSTIFICATION_SHA256`.

Both carry a revisions array, for the same reason the combined hash does: a freeze with a
silently-replaced constant is not a freeze.

### 3. The legacy combined hash is PRESERVED, not retired

`phase6ProtocolManifest()` keeps returning the old flat shape — reconstructing the flat
`requirement`/`value`/`source` fields from `prose` — and **must still hash to
`8aeb2b80a5d85357bca1ddbf7301e63ea7b53e714e4bc5ce290ac22e1b16698e`**, pinned by test.

This is not optional tidiness. `evidence/phase6-sweep/report.json` records that hash as the protocol
that produced it, and `research/phase6-sweep-report.md` publishes it. If the refactor changed it,
the existing evidence would become unverifiable — which is precisely the harm this ADR exists to
prevent, inflicted by the fix rather than by the clause.

### 4. A consumer-walk test proves no EVIDENCE-PRODUCING path reads the justification side

The criterion needs stating precisely, because the obvious phrasing is false. **Tests do read the
prose fields, deliberately** — `runner/test/phase6-protocol.test.ts:100-102` reads `requirement`,
`source` and `value`, and lines 189–213 assert on specific `source` substrings (`"8.7%"`,
`"NOT adequate"`, `"fastest-growing"`) to pin that justifications state particular measured facts.
That is a feature worth keeping, not a leak to close. A first draft of this ADR claimed "no code
path reads the justification side"; the Rule 13 pass before publication found it wrong.

So the binding criterion is narrower and is about evidence, not about reads:

> A field belongs on the values side if any **evidence-producing** code path reads it — the solver,
> the scorer, or the gating verdict of `phase6SweepPreflight`. A test that asserts *about* a
> justification is not evidence-producing, and reading prose there is expected.

The consumer-walk test asserts, concretely: replacing every `prose` object with mutated strings

- **changes** `phase6JustificationManifest()`, and
- leaves `phase6ValuesManifest()`, `phase6FreezeComplete()`, the id list from
  `phase6PendingFreezeItems()`, and `phase6SweepPreflight()`'s value-side verdict
  **bit-identical**.

**That is the derivation behind the claim that a prose edit cannot change what evidence a run
produces.** Rule 6 requires a theorem word to name a derivation about the quantity the claim
governs; the quantity here is "what an evidence-producing path reads", and the mutation test is what
establishes it over that quantity — not over "reads" in general, which would be false.

**A consequence to accept rather than work around:** because tests assert on prose content, an
ADR-logged justification correction will sometimes require updating its guarding assertion in the
same commit. That is correct — a justification and the test pinning it should move together — and it
is not a re-sweep.

### 5. Preflight binds the VALUES hash

`phase6SweepPreflight` checks `PHASE6_VALUES_SHA256` as its gating condition, and reports the
justification hash without gating on it. A sweep may not run against edited values; it may run
against corrected prose.

### 6. It lands before the SDAK-arm protocol freeze

Arm 2 registers under the two-hash scheme from the start, so its justifications are correctable
without invalidating its evidence. Arm 1's evidence stays valid under the preserved legacy hash.

## Consequences

**E1 becomes fixable, and must be fixed under this scheme rather than carried.** Once the split
lands, correcting the `t-sigma-grid` justification moves only the justification hash. E1's entry in
`docs/phase6-protocol-errata.md` is then closed by an ADR that quotes the old and new strings.

**The residual risk, stated rather than left implicit.** A freeze row's `prose.value` is a
human-readable *description* of a registered value, and it now sits on the justification side —
because no code path reads it. So a description could drift from the typed constant it describes
without moving the values hash. That is a real hole and it is narrower than the one being closed:
behaviour cannot change, only documentation can lie. Mitigation, and a limit:

- for rows whose registered value is a machine-comparable constant, a test asserts the description
  agrees with the constant;
- for rows whose value is inherently free text (a rationale, a named scheme), no automated check is
  possible and the erratum mechanism remains the fallback. This is **not** claimed to be fully
  closed.

**A note on how this ADR itself was produced (Rule 13).** It carries a mechanism claim of the
"cannot" class, so it received a skeptical pass before being committed. The pass found a false
statement in the draft — the criterion had been written as "no code path reads the justification
side", which the test suite falsifies on line 100 of `phase6-protocol.test.ts`. Corrected to the
evidence-producing criterion above. Recorded because the point of Rule 13 is that this happens
before publication, and because an ADR that claims a mechanical guarantee should show its own
guarantee was checked.

**Forecloses.** Pricing a prose correction at a re-sweep. Deciding case by case whether an edit is
"substantive enough" to invalidate evidence. Carrying a known-wrong sentence in a frozen artifact
because fixing it is too expensive. Refactoring the manifest in a way that breaks the hash existing
evidence cites.

## Alternatives considered

**Re-sweep to fix E1 and keep one hash.** Rejected on measurement, not preference: 89.4 core-hours
to reproduce identical numbers. It also does not solve the general case — the next wrong sentence
costs another ten hours, so the incentive to leave errors in place persists.

**Keep one hash and let errata accumulate.** Rejected. It is the status quo, and its outcome is that
the authoritative artifact stays wrong while the correction lives somewhere a reader may not find.
Two errata already exist after one audit of one row.

**Judge each edit as "substantive" or "editorial" without a structural partition.** Rejected as the
worst option available: it puts the invalidation decision in the hands of whoever wants the edit,
which is exactly the discretion the freeze exists to remove. The partition must be mechanical or it
is not a partition.

**Hash the prose but exempt it by policy.** Rejected — an exemption that lives in prose about prose
cannot be checked. The two-manifest form makes the exemption a property of the code.
