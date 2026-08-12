# Plan — Phase 6 WP1 (narrowed): freeze Nakaya-comparison physical-size strata

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** done — strata frozen 2026-08-06 after the three-round review below
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
traces, echoed row by row, with the union taken over the **15 traces whose stated radii are
uncontested**. Trace `716d` is echoed but excluded from the union: the lock pins its stated
radius in an *unresolved* mismatch with its absolute initial mass, and an unresolved radius
cannot enter an assumption-free stratum (review round 1, blocker 1; a named operand guard fails
loudly if a future lock revision drops that pin). The union is of each trace's own stated
marginal range of a single quantity — not a combination across quantities, which the lock
forbids (`combineByQuadrature=false`, `scoreableEnvelope=false`). The published value is
`[5.8999999999999995, 12.1]` µm radius, quoted from the candidate artifact. Condition domain,
computed over the 15 contributing traces and carried on the stratum: −30.9…−35.7 °C, σ_ice
4.0–28.6 %, 96,715–97,999 Pa. S1 maps to physical seed size **directly**: it is an observed
initial-particle radius interval.

**Stratum S2 — grown mass-equivalent size at 300 s (declared closure).** Per trace, the central
equivalent radius `initialRadiusUm · (massRatio@300s)^(1/3)`, and the union of the **15
uncontested** central values (`716d` echoed, flagged, and excluded for the same reason as in
S1; its central is interior, so the published endpoints `[9.472732790460505,
20.459585775743665]` µm are unchanged by the exclusion). The 300 s column is forced, not
chosen: it is the last entry of the locked `timesSeconds` common window, and the operator
validates both the value and the last-entry position. The only physical assumption is
**uniform effective density preserved from the initial state** (density cancels in the ratio;
no density constant enters). The closure label is mandatory on the stratum, including its bias
direction: *mass-equivalent radius under a compact-uniform-density closure; per-particle shape
and crystallography were never observed; this is not an observed linear dimension, and the
central value is a floor on half the true maximum dimension, not an estimate of it.* Uncertainties are attached **uncombined**: the
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
7. `heticegrowth_625.dat` remains excluded (homogeneous family); `805l` uses the corrected
   8.9 ± 0.7 µm radius; `712k`'s median coalescer stands behind the locked mass ratios; and
   `716d`'s "only direct m/m0 is eligible" pin records an *unresolved* stated-radius versus
   absolute-initial-mass mismatch, so the operator refuses `716d`'s radius as a stratum-union
   operand (echoed, flagged, excluded) — all inherited from the lock's pins.

**Declared extrapolation, recorded in the freeze:** S1/S2 are sourced at −30.9…−35.7 °C and W1
at −5.3 °C only, while the Nakaya grid spans the whole diagram; applying the strata across all
204 sweep points is a declared extrapolation. And **no pinned source states the physical size
of the natural crystals underlying Nakaya's diagram** — the tracked record notes the figure
prints no crystal size, growth time, or scale bar — so the registered comparison at these
strata is a statement about **early growth at the recorded levitation-derived sizes** and
licenses no claim about larger natural crystals. Stating this in the freeze, without inventing
a size for Nakaya's crystals, is what keeps the comparison honest; discovering it later would
invalidate it. (Review round 1, blocker 2: an earlier draft of this paragraph cited an
unsourced "~0.1–3 mm" range with a wrong order-of-magnitude claim; that number is banned from
the freeze.)

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

- [x] Commit this plan (with the PROGRESS.md baseline update) before implementation (`d338265`).
- [x] Implement the operator and tests; run the focused suite and exact `npm test`
      (candidate `afebde3`; post-repair exact `npm.cmd test` exit 0 — Rule 7 clean over 436
      files, both TypeScript projects, Vitest 82 files / 1,454 tests in 628.68 s).
- [x] Generate `evidence/phase6-size-strata/strata.json`, register it in
      `evidence/MANIFEST.json`, and quote its byte length + SHA-256 in PROGRESS.md
      (frozen revision: 18,867 bytes, SHA-256 `aba93698…d0288b6`).
- [x] One proportionate non-author review (decision 0042 cap) of the operator, operands, and
      artifact — provenance recorded per Rule 10 in the Review record (different-model status
      not established; recorded conservatively). Three rounds, ending CONFIRMED with 0 open
      blockers.
- [x] Mark the WP1 items complete in the active plan; record the exact operands WP2 consumes.

## Out of scope

- Any solver run, model morphology output, or use of morphology to shape a stratum.
- Any new source, literature search, digitization, TAX2 measurement, or archive re-extraction.
- Lattice mapping (physical radius → seed cells per spacing), stopping rules, and sensitivity
  runs — WP2 registers those over the frozen strata.
- The gated values-manifest row and R15 protocol hash (WP3).
- Any change to the candidate lock, the Nakaya record, education, or historical manifests.

## Review record

**Round 1 — 2026-08-06, verdict: 2 blockers, both repaired in the same session.** Provenance,
with each statement attributed to its observer. The reviewer's own affirmative statement,
verbatim: *"Claude Opus 5, model ID `claude-opus-5[1m]`, presented in this harness as Claude
Fable 5 — the same model family as the author … this engagement satisfies non-author but not
different-model."* The author separately records that the reviewer subagent was launched with
an explicit `claude-opus-5` model parameter — an author-side launch detail the reviewer did
not observe and does not confirm. The record adopts the conservative reading: this is a
**non-author review with fresh context and no shared authorship, whose different-model status
is NOT established**; Rule 10's different-model preference is recorded as not demonstrably
met. No cross-vendor reviewer was available to this session, unlike the OpenAI Codex reviews
in this repository's earlier rounds.

The reviewer independently re-executed: 266 value comparisons from its own fresh parse of the
candidate lock (sort-based min/max ordering, plus a 6-step Newton-iteration cross-check of every
`Math.cbrt`) — **all bit-exact, zero mismatches**; artifact and manifest byte/hash verification;
both focused suites (then 14 tests, all passing); a Rule 9 audit of all negative controls; and
the scientific-constraint audit (locked-operands-only, no density constant anywhere, refusals
against the lock's pins, Nakaya usage rules, Done-when quoted verbatim). Stated limits: no full
`npm test`, no `emit` execution, no source-byte verification, no clean-clone checkout, no
non-V8 engine test, no review of prior reviews or alternatives.

- **Blocker 1:** trace `716d`'s stated radius set the published S1 union floor while the lock
  pins that radius in an *unresolved* mismatch ("only direct m/m0 is eligible") and the
  artifact's own refusal 7 recited the pin — a self-contradiction on operand admissibility.
  **Repair:** 716d's radius is excluded from both stratum unions (its rows stay echoed and
  flagged `radiusUnderUnresolvedMismatch`, with computed membership prose); refusal 7 now
  states the scoping accurately; a named operand guard fails loudly if a future lock revision
  drops the 716d pin, with a matching negative control. The S1 floor moved
  `5.3999999999999995` → `5.8999999999999995` µm; S2's endpoints are unchanged (716d's
  central is interior). The condition-domain envelope is computed over the 15 contributing
  traces (numerically unchanged).
- **Blocker 2:** the declared size-scale extrapolation cited "~0.1–3 mm" Nakaya crystals — a
  number appearing in no pinned source — and the order-of-magnitude claim built on it was
  wrong at both strata's upper ends. **Repair:** the fabricated number is removed; the
  extrapolation now states that no pinned source sizes the natural crystals underlying the
  diagram and that the comparison licenses no claim about larger natural crystals.

**Hardening suggestions (9 recorded).** Adopted in the same repair: (1) the S2 closure now
states its bias direction (the central value is a floor on half the true maximum dimension);
(2) `lockProvenance` carries the lock's LF-normalized `textSha256`/`textBytes`; (3) both pinned
inputs gained `.gitattributes` `-text` protection; (4) a `Math.cbrt` engine-portability note is
published in the artifact; (5) the inverted-warm-range control now asserts its mutation
executed; (6) the plan-promised radius-mutation output-dependence control exists; (7) the
operator validates that the 300 s index is the *last* common-window entry; (8) `emit` validates
the manifest's format before writing the artifact; plus the `quantityConvention` wording fix
from (9). Declined, recorded: tightening the artifact's TypeScript index signature (the
byte-identical regeneration test already catches drift) and restructuring refusal 7 out of the
refusals list (kept, reworded). The reviewer's process note that `strata.json` carries no
review-pending marker becomes moot when this unit freezes.

The repaired artifact is 18,867 bytes, SHA-256
`aba93698ad6dcd72237a9c7ffa48588143533db315c059a29f6cd98c8d0288b6`.

**Round 2 — same engagement, bounded repair verification. Verdict: both original blockers
CLOSED; one new blocker; one required Rule 10 correction — both fixed in this session.** The
reviewer independently re-derived the contested-trace id from the lock's own pin text; proved
by its own out-of-repo mutation experiment (716d radius 5.8 → 5.9) that the contested operand
changes only the echoed row and neither published union; confirmed the S1 floor is `731b`'s
`6.3 − 0.4` bit-exact and S2's endpoints genuinely unchanged (716d's central is interior);
confirmed the 15-trace condition domain is numerically identical to the 16-trace envelope, so
the relabel is honest; walked every string value in the artifact and found no unsourced
quantitative claim remaining; re-ran all named guard mutations itself from outside the
repository, adding two cases of its own (a "RESOLVED" rewording of the 716d pin still trips
the prefix guard; CRLF-converted pinned inputs still build, so the `.gitattributes` rule is
defence-in-depth, not load-bearing); and re-ran both focused suites (15 tests passing; 156
recomputed values bit-exact; manifest `totalBytes` 996,545 re-verified). **New blocker:** this
plan's Approach section still mandated the pre-repair behaviour in four passages (16-trace
unions, the `[5.4, 12.1]` expectation, the old refusal-7 wording, and the fabricated
"~0.1–3 mm" passage), which would have reintroduced both defects on any re-emit from the plan;
repaired by the Approach edits now standing above. **Required correction:** the round-1
provenance paragraph had softened the reviewer's affirmative same-family statement; rewritten
above with each statement attributed to its observer. Round-2 stated limits: no full
`npm test`, no `emit` execution, no source-byte verification (the underlying 716d
radius-versus-mass mismatch remains unresolved at the source), no clean-clone checkout, no
non-V8 engine test, no re-audit outside the five changed files.

**Round 3 — same engagement, final confirmation. Verdict: CONFIRMED, 0 open blockers;
engagement closed.** The reviewer re-checked all four repaired Approach passages against its
own recomputed values (bit-exact), verified the retired strings survive only as quoted history
inside this Review record, accepted the provenance paragraph as faithful ("exactly my
position, not a softening of it"), verified the Round 2 record claim by claim, and found no
remaining plan-artifact contradiction. It also answered this plan's first open question: S2's
closure is admissible as a labeled stratum, with its adopted bias-direction condition. Its
standing limits are unchanged from rounds 1–2. After the confirmation, the author's exact
`npm.cmd test` on the frozen tree exited 0: Rule 7 clean over 436 files, both TypeScript
projects, and Vitest 82 files / 1,454 tests in 628.68 s.

## Tried and rejected

Inherited bounds from the active plan and source-currency record that this operator must not
re-tread (each is recorded there in full): promoting the cleanest levitation data by assigning
the current seed (shape/crystallography unobserved — S2's closure label and W1's refusal exist
because of this); using the Takahashi 860/1010 mb ratio as a tolerance (refusal 3); choosing
targets after seeing agreement (everything here freezes before any model output); borrowing
field-of-view widths (refusal 5); promoting the 100–300 µm planning probes (refusal 1).

**Keep 716d's stated radius in the S1 union with only a caveat flag.** Rejected during the
blocker-1 repair: the lock records the radius-versus-absolute-mass mismatch as *unresolved*, so
the radius cannot back an assumption-free published floor; exclusion is the conservative
reading, and the echoed, flagged row preserves the information for any future resolution.

(Append new dead ends here as they occur.)

## Open questions

- ~~Is S2's uniform-density closure admissible to the non-author reviewer as a *labeled*
  stratum?~~ **Answered in review round 2/3:** admissible as a labeled stratum, conditional on
  the bias-direction sentence (the central value is a floor on half the true maximum
  dimension), which was adopted into the operator, the artifact, and this plan.
- Whether WP2 treats S1 and S2 as two strata (Z = 2) or S1-only (Z = 1) is a WP2/WP3 protocol
  decision made before any production row; nothing here presumes it.
