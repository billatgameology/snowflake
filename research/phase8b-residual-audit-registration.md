# Phase 8B residual-backlog audit registration

**Registered:** 2026-08-12, before audit results were read

**Purpose:** test whether the focused P0/P1/P2 selection missed benchmark material in records
already classed as clear deferrals or exclusions

**Scope:** nine records across three residual strata; this is not a global literature-completeness
sample and does not convert ambiguous backlog leads into clear exclusions

## Fixed inputs

| Input | SHA-256 |
|---|---|
| `evidence/phase8b-benchmark-selection-v1/backlog.json` | `9182633d66345247f6138461441f9a637780fa4a284496da4f2f97ec1658d20a` |
| `evidence/phase8b-local-denominator/source-containers.jsonl` | `3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106` |
| `evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl` | `3590804a3943bbe1594d6ec1feec58c45182d4f79cfc10b3c94d1f7ac068476f` |
| NAS `author-title-triage.jsonl` (280,654 bytes) | `3e7015adc8e94a85262e47caff7283318cf2f3018aa54ff11153a7bf796513df` |
| NAS `citation-title-triage.jsonl` (532,659 bytes) | `dfff67624d720af0baae8c0e4e6c9131b632c92482cf8579c7c03c6f9b9b7d0e` |
| NAS `focused-title-triage.jsonl` (439,828 bytes) | `e08923b4d636c86099eb33682d8d0bb654c461b26a2d09dfc2e1f900c8700e89` |

The three NAS files are under
`research-cache/phase8b-search/offline-title-triage-20260811-v1/`.

## Deterministic selection

For each candidate identifier, compute lowercase SHA-256 over the UTF-8 bytes of:

```text
phase8b-residual-audit-v1\0<stratum>\0<identifier>
```

Sort by that digest ascending and take the first three records in each stratum. The populations are:

1. `local-container` — the 20 local containers absent from the frozen selected-container IDs;
2. `acquired-context-exclude` — the six acquired records whose
   `provisionalScopeBucket` is `provisional-context-or-exclude`; and
3. `captured-clear-exclude` — exact identifiers joined across all three title-triage files using
   the frozen precedence `known-local-or-acquired` > `likely-eligible-primary` >
   `needs-metadata-or-fulltext` > `clearly-out-of-scope`, retaining only the 1,028 identifiers
   whose resulting disposition is `clearly-out-of-scope` and excluding the eight promoted IDs.

## Frozen sample

| Stratum | Identifier and stable locator | Selection digest |
|---|---|---|
| local-container | `P8B-CONT-755B3746D3762F0BD610671A`; `source-containers.jsonl:15`; `bacon-baker-swanson-2003.pdf` | `00fba6e39f31ab6513190965ced9f2f84f9ab0b4846d641a349a820640fbf19a` |
| local-container | `P8B-CONT-40C423673EDA226443DC0337`; `source-containers.jsonl:11`; `2109.00098v1.pdf` | `0ce4ae6d671641b162510d0c43ae8b29ad5be3102f1cef54b1d1fcb20d3b4663` |
| local-container | `P8B-CONT-502C125EDEF7CE1F1BCDA257`; `source-containers.jsonl:21`; `takahashi-fukuta1988.pdf` | `140dfce1ef9ba4e2aa00efebe5fdade3ddf1e91a6069dffbdc7cac06ae62c648` |
| acquired-context-exclude | `P8B-S2R0-13A1514FF5EE6F487C1F4788`; `source-register.jsonl:28`; aircraft ensemble study | `247e6cafe1e4b881dbe97b9e94a78a6b854dbd0cfabd5d1f02340a5ef5794258` |
| acquired-context-exclude | `P8B-S2R0-02E73E6342C44351321AE5BE`; `source-register.jsonl:3`; frozen-drop sublimation study | `4f49588d02e0d893e23ebce4be008dfbba823fd8e1bc2bb61f2f354fcdbf3733` |
| acquired-context-exclude | `P8B-S2R0-5CB68C5C5A066C2EF110C026`; `source-register.jsonl:16`; isotope-fractionation chamber study | `568ee8383de9b6f6c2bf00d4ea703a4ac6df2038c37fe490ff6af6408a678422` |
| captured-clear-exclude | `https://openalex.org/W4406806038`; `focused-title-triage.jsonl:444`; comment record | `002790456c57ce16eda9944518569cce52bb3547a1fd4713ce780a3f8d48f205` |
| captured-clear-exclude | `https://openalex.org/W2093443039`; `focused-title-triage.jsonl:55`; bulk microwave-emission study | `0091f236d66580e1ec307dda3c072813c3c3e6ca420a383fb27609f4a92ca742` |
| captured-clear-exclude | `https://openalex.org/W2741211956`; `citation-title-triage.jsonl:536`; unrelated proceedings item | `00f6fe7dad945cd471af4c2921340d0dfb29c3ab087ad9b738faae248a7d9140` |

## Audit question and fail condition

For local and acquired sources, inspect the complete source or its page-complete reconnaissance
record, not only the title. For captured-title records, verify that the captured metadata itself
supports a clear exclusion; any ambiguity is a failure of the `clear` label.

For each record ask: does it contain, or credibly point to, a direct numeric measurement or unique
interpretive dependency that meets the frozen P0/P1/P2 criteria and would materially alter the
Phase 9 evidence draft? Existing Phase 8A context, a confounded measurement, a qualitative taxonomy,
a duplicate/same-campaign expression, or evidence outside the current individual vapor-growth
protocol is not a miss when its reason is stated.

Any missed benchmark unit, unsupported clear-exclusion label, inaccessible evidence needed to
answer the question, or outcome-based rationale is a blocker. The result artifact records one
disposition and evidence locator per sampled record; zero misses are required.
