# Plan — Phase 6 WP1 (narrowed): freeze Nakaya-comparison physical-size strata

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-06
- **Last touched:** 2026-08-06 by Claude Fable 5

This is the bounded plan the [active plan](phase-6-science-first-completion.md) WP1 requires
before implementation. It governs only the narrowed WP1 unit; the active plan remains the
schedule of record.

## Goal

Freeze the physical crystal-size strata that make the Phase 6 Nakaya comparison's size question
explicit, honest, and source-anchored — from already-locked observations only — so WP2 can
pre-register its numerical-control ladder over named physical sizes instead of an inherited
lattice extent. The deliverable is a deterministic operator, its tests, and a tracked, reviewed
freeze artifact carrying the exact operands WP2 consumes.

## Done when

The two open WP1 items of the active plan, verbatim:

> Write a new bounded plan for the narrowed task before implementation. It may consume only
> already-locked source observations and uncertainties, never model morphology output, a new
> literature search, or the rejected TAX2 apparatus. Freeze the simplest deterministic operator
> that maps the source record to one or more Nakaya-comparison physical-size strata plus explicit
> uncertainty/refusal outcomes; define how each stratum maps to physical seed size without
> choosing a numerically or morphologically favorable result.

> Obtain one proportionate non-author review of that operator and its source operands before
> freezing any numeric stratum. If the unit fails twice, escalate options to the maker rather
> than rebuilding a third time. Publish only the reviewed freeze and exact operands needed by
> WP2.

## Inputs, pinned

The operator consumes exactly one tracked observation record, and nothing else:

- `research/phase6-heldout-candidate-lock.json` — 15,148 bytes, SHA-256
  `f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5` (computed 2026-08-06 in
  this session). Specifically its frozen trace table (16 Harrison/Pokrifka reconciled
  heterogeneous traces: `initialRadiusUm`, `initialRadiusRangeUm`, `massRatios` at the locked
  common times `[60,120,180,240,300]` s, and per-trace conditions) and the two locked Takahashi
  warm diagnostic mass rows with their `nonprobabilisticDiagnosticRangeGrams`. The operator
  touches **no ZIP member, PDF, or .dat file** — the lock's numbers are the already-extracted,
  already-locked observations.
- `research/nakaya-morphology-diagram.md` — 12,112 bytes, SHA-256
  `f8746a31cc183161c345ec0fe3c139a98d9c955874195576ade9b5cd40fb1769` — defines the comparison
  (ordinal habit reversals across boundaries −3.3 / −9.9 / −21.5 °C, read uncertainty ±0.5 °C)
  and is recorded here for one load-bearing fact: **the figure prints no crystal size, growth
  time, or scale bar.** It contributes no operand to the operator.

## Approach — the operator

One pure function over the parsed lock content. No configuration, no optional parameters, no
tunable thresholds. Implementation in `runner/` (it reads a file; `core/` stays I/O-free), with
the computation itself a pure function of the parsed JSON so tests can drive it directly.

**Stratum S1 — observed initial size (assumption-free).** The per-trace stated intervals
`[initialRadiusUm − initialRadiusRangeUm, initialRadiusUm + initialRadiusRangeUm]` for all 16
traces, and their union. This is a union of each trace's own stated marginal range of a single
quantity — not a combination across quantities, which the lock forbids
(`combineByQuadrature=false`, `scoreableEnvelope=false`). Expected near [5.4, 12.1] µm radius;
the freeze artifact's computed value is the authority, quoted from it at freeze time. Condition
domain, carried on the stratum: −30.9…−35.7 °C, σ_ice 4.0–28.6 %, 96,715–97,999 Pa. S1 maps to
physical seed size **directly**: it is an observed initial-particle radius interval.

**Stratum S2 — grown mass-equivalent size at 300 s (declared closure).** Per trace, the central
equivalent radius `initialRadiusUm · (massRatio@300s)^(1/3)`, and the union of the 16 central
values. The 300 s column is forced, not chosen: it is the last entry of the locked
`timesSeconds` common window. The only physical assumption is **uniform effective density
preserved from the initial state** (density cancels in the ratio; no density constant enters).
The closure label is mandatory on the stratum: *mass-equivalent radius under a
compact-uniform-density closure; per-particle shape and crystallography were never observed;
this is not an observed linear dimension.* Uncertainties are attached **uncombined**: the
per-trace radius marginal range and the lock's `[0.95·y, 1.05·y]` mass-ratio operator are each
quoted beside the central union; no joint envelope is computed, because the lock declines to
authorize one. S2 maps to physical size as a **measurement (grown) size** whose seed is the same
trace's S1 radius.

**W1 — warm early-growth mass anchor at −5.3 °C (not a size stratum).** The two locked rows
(3 min: 7.56e-8 g in [4.720333333e-8, 1.095033333e-7]; 5 min: 2.10e-7 g in
[1.373633333e-7, 2.915033333e-7]) are published as a labeled mass anchor carrying their
`source-locked-non-gating-diagnostic` status, **with an explicit refusal to convert them to any
linear size**: conversion requires an ice-density closure that is not a locked observation, and
the observed habit is a hollow column whose rim width was never observed, so a mass-equivalent
length would understate maximum dimension by an unobserved factor. W1 exists so WP2/WP8 can see
the only locked warm-temperature scale information and see *why* it does not become a stratum.

**Mandatory refusals — first-class outputs of the operator, each with its recorded reason:**

1. No stratum at or above 100 µm. No locked observation supports one; the 100/150/200/300 µm
   reconnaissance probes are non-transferable and their promotion is forbidden by name
   (source-currency §9).
2. No per-crystal aspect-ratio stratum (Takahashi a/c rows are unpaired ensemble data).
3. No pressure stratum (`TAKAHASHI91_PRESSURE_CONTEXT_V1` is context-only; no pass interval).
4. No growth-history stratum (both history candidates are not scoreable; substrate/figure-only).
5. No stratum from figure field-of-view widths (forbidden by source-currency §3).
6. The corrected −31.5 °C / 5 % / 10.69 µm row remains absent; synthesizing it is forbidden.
7. `heticegrowth_625.dat` remains excluded (homogeneous family); `716d` contributes only direct
   m/m0; `805l` uses the corrected 8.9 ± 0.7 µm radius — all inherited from the lock's pins.

**Declared extrapolation, recorded in the freeze:** S1/S2 are sourced at −30.9…−35.7 °C and W1
at −5.3 °C only, while the Nakaya grid spans the whole diagram; applying the strata across all
204 sweep points is a declared extrapolation. And both strata sit one to two orders of magnitude
below the ~0.1–3 mm crystals from which Nakaya's diagram was drawn, so the registered comparison
at these strata is a statement about **early growth at source-anchored sizes**, not about
millimetre-scale natural crystals. Stating this in the freeze is what keeps the comparison
honest; discovering it later would invalidate it.

## Outputs

- `runner/src/phase6-size-strata.ts` — the operator: parse, validate (fail by name on missing
  trace, non-finite or non-positive operand, wrong trace count, wrong times vector, or lock-file
  hash mismatch against the pin above), compute, and emit the freeze artifact deterministically
  (canonical key order, LF, exact binary64 round-trip via JSON number serialization).
- `evidence/phase6-size-strata/strata.json` + entry in `evidence/MANIFEST.json` — the freeze
  artifact: schema id, lock provenance (path, byte length, SHA-256), echoed operands (all 16
  trace rows and the two warm rows), per-trace and union values for S1/S2, W1, the seven
  refusals with reasons, closure and extrapolation declarations, condition-domain labels, and
  the Nakaya-record pin. Byte length and SHA-256 of the artifact are quoted in PROGRESS.md and
  the active plan at freeze time.
- `runner/test/phase6-size-strata.test.ts` — independent recomputation of every published
  number by a differently-ordered expression; negative controls: mutated trace radius changes
  the artifact digest, a synthesized −31.5 °C row is refused by name, a 15- or 17-trace table is
  refused, a non-finite mass ratio is refused, artifact-vs-manifest integrity holds, and the
  artifact contains no numeric stratum reaching 100 µm while refusal 1 is present verbatim.
- The values-manifest row binding the strata into the gated protocol is **WP3's job** (it
  hash-binds the reviewed freeze); WP1 does not touch `phase6ValuesManifest`.

## Steps

- [ ] Commit this plan (with the PROGRESS.md baseline update) before implementation.
- [ ] Implement the operator and tests; run the focused suite and exact `npm test`.
- [ ] Generate `evidence/phase6-size-strata/strata.json`, register it in
      `evidence/MANIFEST.json`, and quote its byte length + SHA-256 in PROGRESS.md.
- [ ] One proportionate non-author review (decision 0042 cap) of the operator, operands, and
      artifact — a different model than the author, provenance recorded per Rule 10, blockers
      resolved or the unit escalates after a second failure.
- [ ] Mark the WP1 items complete in the active plan; record the exact operands WP2 consumes.

## Out of scope

- Any solver run, model morphology output, or use of morphology to shape a stratum.
- Any new source, literature search, digitization, TAX2 measurement, or archive re-extraction.
- Lattice mapping (physical radius → seed cells per spacing), stopping rules, and sensitivity
  runs — WP2 registers those over the frozen strata.
- The gated values-manifest row and R15 protocol hash (WP3).
- Any change to the candidate lock, the Nakaya record, education, or historical manifests.

## Tried and rejected

Inherited bounds from the active plan and source-currency record that this operator must not
re-tread (each is recorded there in full): promoting the cleanest levitation data by assigning
the current seed (shape/crystallography unobserved — S2's closure label and W1's refusal exist
because of this); using the Takahashi 860/1010 mb ratio as a tolerance (refusal 3); choosing
targets after seeing agreement (everything here freezes before any model output); borrowing
field-of-view widths (refusal 5); promoting the 100–300 µm planning probes (refusal 1).

(Append new dead ends here as they occur.)

## Open questions

- Is S2's uniform-density closure admissible to the non-author reviewer as a *labeled* stratum?
  If not, the honest degenerate output is S1 plus refusals — that is a valid WP1 completion,
  and the maker chooses whether to accept it or escalate.
- Whether WP2 treats S1 and S2 as two strata (Z = 2) or S1-only (Z = 1) is a WP2/WP3 protocol
  decision made before any production row; nothing here presumes it.
