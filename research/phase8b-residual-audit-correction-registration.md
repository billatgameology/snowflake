# Phase 8B residual-backlog audit correction registration

**Registered:** 2026-08-12, after the original sample reported one miss and before the replacement
record was inspected. The Bacon priority label below was corrected from P2 to two direct P1
aggregates before successor freeze; the replacement identity, digest, question, and fail condition
did not change.

**Purpose:** preserve the original failed audit, promote its Bacon finding into benchmark
selection v2, and test the corrected local-container residual sample at the same fixed sample size

## Preserved original result

The immutable registration in `research/phase8b-residual-audit-registration.md` sampled Bacon,
`2109.00098v1.pdf`, and `takahashi-fukuta1988.pdf` from the 20 containers residual to selection v1.
The independent audit found Bacon to be a genuine benchmark miss. Source semantics classify the
miss as two direct P1 aggregates rather than a P2 interpretation dependency: Table 1's
initiation/aspect summary and the separately reported mass-growth-factor contrast. That result
remains a failure; this correction does not relabel it.

Selection v2 promotes container `P8B-CONT-755B3746D3762F0BD610671A` and those two Bacon P1
measurement sets into model development. The corrected local-container residual population
therefore has 19 containers. The other two original local-container sample records remain
residual and keep their original reviewed dispositions.

## Frozen replacement rule and record

Apply the original lowercase SHA-256 selection rule unchanged:

```text
phase8b-residual-audit-v1\0local-container\0<identifier>
```

Remove the now-selected Bacon container, retain the two still-residual original sample records,
sort the remaining corrected population by digest, and take the first not-already-reviewed record
to restore a three-record local-container sample.

| Stratum | Identifier and stable locator | Selection digest |
|---|---|---|
| local-container replacement | `P8B-CONT-0F75A9EA97A42AE73A947340`; `evidence/phase8b-local-denominator/source-containers.jsonl:1`; `1211.5555v1.pdf` | `1e4869f7f10ae23b059499e57dfb243eeaa300d0aefdd16d7db576e615b60d81` |

## Audit question and fail condition

Inspect the complete source or its page-complete reconnaissance record, not only the title. Ask
the original registered question unchanged: does it contain, or credibly point to, a direct
numeric measurement or unique interpretive dependency that meets the frozen P0/P1/P2 criteria and
would materially alter the Phase 9 evidence draft?

Any missed benchmark unit, inaccessible evidence needed to answer the question, or outcome-based
rationale is a blocker. The corrected residual audit reaches zero misses only if this replacement
record passes and all eight still-residual records from the original sample retain their reviewed
no-miss dispositions. This is a fixed nine-record sample of the corrected backlog, not a claim of
global literature completeness.
