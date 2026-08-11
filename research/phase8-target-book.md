# Phase 8 — reconciled laboratory target book

**Status:** frozen Phase 8 S6 artifact after zero-blocker non-author review. This report describes the canonical
machine book in [`phase8-target-book.jsonl`](phase8-target-book.jsonl); the freeze verifier, not
this prose, computes its identity and split.

## Outcome

The book contains **18 entries: 16 targets and 2 calibration/input records**. Among the targets,
1 is Class A and 15 are Class B; no Class-C disagreement is frozen from the currently adequate
source bytes. The pre-registered target partition contains 7 held-out, 5 model-development, and
4 out-of-model entries. Both inputs are Class B, explicitly not-applicable to the target split,
and not scoreable.

This is a graded account of the available laboratory record, not a claim that one diagram or one
laboratory is universal ground truth. It grants no validation label, scores no solver, and changes
no model parameter. A later phase may confront only the targets whose protocol and model-scope
conditions it satisfies.

The canonical book is 59,019 bytes with SHA-256
`47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`. That identity is
re-derived from raw bytes by `node runner/src/phase8-verify.ts`; it is not inherited from this
report.

## What the reconciliation changed

- The exact -4.0 C and -8.1 C Hokkaido free-fall boundaries remain Class B. Libbrecht's near-equal
  basal/prism rates at -8 C are context, not an independently located boundary. Both habit-category
  entries are model-development diagnostics because M1 was selected against the Nakaya habit
  sequence; an external numeric boundary does not make that category held out.
- The reported 860-versus-1010 mb mass difference is Class B context, not Class A. Both sides come
  from the Takahashi/Fukuta cloud-tunnel lineage, and site, apparatus, droplet field, selection,
  and history change with pressure.
- Bailey–Hallett 2002 is an extended-abstract precursor. The current 2004 version of record and
  later 2009/2012 lineage govern quantitative use, so no cold-end machine target or Class-C
  position is frozen. The precursor audit is pinned as a supporting source-gap record until those
  governing bytes are acquired, hashed, visually checked, and page-extracted.
- Bacon's prose says 0%-10% ice supersaturation while its figure evidence extends to 18% and above
  20%. The source index preserves that conflict. The book uses the supersaturation-free time
  scaling and conditional history result without inventing one normalized range.
- Harrison 2016 and Pokrifka 2020 are one laboratory/data witness, not two. The corrected 2020
  chamber conditions govern the sixteen direct heterogeneous mass-ratio traces; the stale 2016
  `Conditions.txt` values are retained only as provenance.
- Harrington–Pokrifka's current article is the July 2026 version of record, while its archive
  metadata still names a 2025 submitted manuscript. Its substrate dimensional records are retained
  as out-of-model history evidence; the archive's supersaturation reference basis is not guessed.
- Libbrecht and Penn State attachment-kinetics inversions are calibration inputs. Their
  source-specific fitted quantities are not directly comparable, so the book does not promote
  their unmatched ranges to a Class-C disagreement. They can constrain a solver but cannot
  validate an arm that adopts them.
- A machine-checked leakage guard preserves the three Penn State mass-trajectory targets as held
  out only for an arm that does not adopt, fit, select, or tune against the Penn fitted coefficient
  values or transition histories. Any such use moves all three to model development before scoring.

## Registered partition

| Split | Entries | Intended use |
|---|---:|---|
| Held out | 7 | Phase 9 may confront these only under their recorded protocol, non-use lock, and conditional-comparison limits. |
| Model development | 5 | Two Nakaya-category boundaries plus Libbrecht low-drive, needle-matrix, and trajectory evidence. |
| Out of model | 4 | Substrate rim history, sublimation, confounded pressure context, and riming/graupel regimes. |
| Input / not applicable | 2 | Adopted Libbrecht kinetics and the cross-laboratory fitted-coefficient inventory. |

The held-out IDs are:

- `P8-T-BACON-DIFFUSION-SCALING`
- `P8-T-BACON-SEED-HISTORY`
- `P8-T-LEVITATION-MASS-RATIO`
- `P8-T-LEVITATION-POWER`
- `P8-T-LEVITATION-SCALED`
- `P8-T-SHAPE-ENHANCED-MASS`
- `P8-T-VENTILATION-ONSET`

“Held out” does not mean immediately scoreable. All seven are `conditional`: their seed, pressure,
transport, supersaturation semantics, history, ensemble, substrate, and measurement mapping must
match a future pre-registered comparison. The machine guard also requires explicit Penn-fit non-use
for the three Penn trace targets. The split is fail-closed against the source-lineage overlap it can
identify; it does not erase model-form mismatch or prove independence at the case level.

## Robustness result

The single Class-A target is narrowly stated:

| Entry | Independent support | Limit |
|---|---|---|
| `P8-T-BACON-DIFFUSION-SCALING` | Hokkaido free-fall mass exponent and Bacon EDB equivalent-radius exponent | Equivalence is conditional on constant density and isometric/spherical-equivalent geometry. |

The Bacon seed/history entry is Class B because it now contains only the Bacon levitation witness.
No Class-C record is frozen. The Bailey current-lineage cold position lacks governing local bytes
and page extraction, while the two attachment-coefficient (`alphaHK`) lineages do not supply a
matched common inversion quantity. Recording those limits is preferable to manufacturing a
disagreement or a testable hypothesis from incompatible evidence.

## Protocol and uncertainty contract

Every entry carries seed, pressure, geometry, supersaturation semantics, growth history, ensemble,
substrate, medium, uncertainty, witness, role, split, and limits. Three rules are deliberately
fail-closed:

1. Nominal water saturation has no invented numeric ice-relative fraction.
2. A mixed-source entry keeps source-specific pressure and supersaturation semantics instead of
   publishing a false aggregate value.
3. “Not reported” is an explicit classification. It is never silently replaced with one
   atmosphere, a far-field value, or a surface value.

The primary TAX1/TAX2 needle matrix and the cited -5 C targeted experiment say normal air but do
not print a numeric pressure in their cited extraction. The book therefore freezes no `100000 Pa`
value for either entry. Bacon's `101325 Pa` tag is explicitly an exact conversion of its nominal
one-atmosphere wording, not a claim of one-pascal measurement precision.

The book extends the byte-unchanged 122-entry historical Libbrecht dataset
[`lab-validation-dataset.jsonl`](lab-validation-dataset.jsonl), whose terminal record remains
`passEligible=false`. Extension does not upgrade that older dataset to a gate.

## Derived observables

Four versioned operators are specified in
[`docs/target-book-observables.md`](../docs/target-book-observables.md) and implemented with
independent fixtures in [`core/src/target-observables.ts`](../core/src/target-observables.ts):

- unweighted log-log mass-law exponent on a caller-registered window;
- Pokrifka's pointwise power exponent `P`;
- Pokrifka's scaled mass-growth trajectory plus reference-grid comparison without extrapolation;
- midpoint and half-spacing for one pre-registered unlike-habit temperature bracket.

They do not select favorable windows, smooth or differentiate data, assign habit, choose a score
threshold, or infer missing plotted values. Those choices remain obligations of a later scoring
protocol.

## Source and rights boundary

The eight newly created non-Libbrecht indexes record exact local cache identities, currency
searches, source-specific reuse limits, and source-specific page/visual checks where page bytes
were available or complete archive-member scans otherwise. Seven are cited by machine-book
entries; the Bailey precursor index is pinned separately as a supporting source-gap record. Source
PDFs, archives, page images, and figure/table bodies remain on the NAS and are not committed. These
new indexes use exact numeric transcription, source-faithful paraphrase, and only brief attributed
quotation; this publication includes no third-party figure or table reproduction.

The historical Libbrecht extraction index is not represented as having the same consolidated
Phase-8 byte-identity or rights audit: it predates this work, contains a larger quotation corpus,
and records that its original pass read arXiv versions rather than every journal version. Its
current source-currency record, operand-level parameter provenance table, and exact index bytes are
all pinned by the freeze. Phase 8 adds anchors but makes no new broad-reuse claim for that legacy
corpus.

Takahashi's raster-only tables and all plotted-only coordinates remain undigitized. Any future use
requires a registered reading operator and explicit read uncertainty. Bailey's current-lineage
quantitative target additionally requires acquisition, hashing, and page extraction of the
governing source bytes before any later book freeze may include it.

## Reproduction

After the evidence freeze is present, run:

```text
node runner/src/phase8-verify.ts
```

The command re-parses canonical JSONL, re-counts roles, verifies every extraction anchor exactly
once, requires a page/archive/data locator for each entry and robustness witness, enforces the
input/held-out leakage guard, rechecks the historical dataset's bytes and fail-closed status,
re-hashes all cited indexes, supporting records, registered data, operators, verifier code, and
this report, and recomputes the split before accepting the freeze. Every pinned working byte must
also equal one unconflicted stage-0 regular-file entry in the Git index.
