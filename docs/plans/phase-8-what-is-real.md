# Plan — Phase 8: What is real — the reconciled laboratory target book

- **Phase:** Phase 8 (proposed) — Cross-laboratory evidence reconciliation
- **Status:** draft for maker review — not chartered; adopting it requires a charter amendment
  (charter is at v1.21) and a logged ADR. Must not start before Phase 6 WP8 publishes its gate
  and must not touch any Phase 6/7 frozen territory.
- **Started:** 2026-08-04 (drafted)
- **Last touched:** 2026-08-04 by Claude Fable 5 — initial draft at the maker's direction

## Goal

Phase 6 compared one model class against one ruler and both sides were weaker than assumed: the
model was missing load-bearing physics, and the ruler — a single digitized morphology diagram
scored by final aspect ratio — is contradicted between laboratories, protocol-dependent, and
criticized as a habit metric by its own sources. Before any further modeling, this phase turns
the full multi-laboratory record now in `research/` (Libbrecht corpus **plus** Takahashi/Fukuta
free-fall, Nelson sublimation, Bacon–Baker–Swanson levitation, Bailey–Hallett cold-end,
Harrison/Pokrifka/Harrington levitation-mass lineage) into a graded, protocol-tagged,
machine-readable **target book**: what is established, by whom, under what protocol, with what
uncertainty — and where the laboratories genuinely disagree. Phase 9 scores models against this
book instead of against any single diagram.

## Done when

The charter has no Phase 8 milestone; proposed metric: done when every target in the book
carries (a) a page-cited extraction line in a tracked research index, (b) protocol tags (seed,
pressure, geometry, supersaturation semantics and uncertainty, growth history, ensemble
semantics), (c) a robustness class where Class A requires at least two independent witnesses,
(d) an inputs-vs-targets flag, and (e) membership in a pre-registered held-out split — and the
frozen, hashed book passes one proportionate non-author review with zero unresolved blockers.

## Approach

Curation as registered science, not as a reading list. Everything follows the Phase 6 evidence
discipline that already exists: verbatim quotes with page cites, no value read off a plotted
curve without being flagged as a digitization with read uncertainty, deterministic registered
operators for anything derived, content hashes, and in-sample classification per ADR 0005. The
book extends — never replaces — `research/lab-validation-dataset.md`/`.jsonl` (122 entries,
graded, `passEligible=false`), which stays byte-unchanged as the historical Libbrecht-scoped
index.

Three organizing rules:

1. **Inputs ≠ targets.** Libbrecht's α measurements are what the model's kinetics are fitted
   from; they can calibrate but never validate. The free-fall and levitation datasets are the
   candidate validation targets. TAX2's 206 needle panels stay in-sample for M1 (ADR 0005).
2. **Prefer supersaturation-free observables.** The labs disagree most about σ calibration.
   Observables that cancel it — Pokrifka's power exponent P, mass-law exponents, scaled
   trajectories, boundary temperatures at water saturation — are first-class targets.
3. **Disagreements are recorded, not averaged.** Class C entries carry both sides verbatim plus
   the candidate protocol-based reconciliation as a hypothesis for Phase 9 to test.

### Robustness classes (seed content, to be verified during S0–S3)

- **Class A — multiply witnessed, protocol-robust:** the two warm habit boundaries near −4 and
  −8 °C (Libbrecht digitization; Takahashi et al. 1991 free-fall −4.0/−8.1; TAX1's basal≈prism
  at −8 °C); plate-like prisms at −5 °C at low σ_surf (CM6; Bacon 2003; CM10 statement);
  **bistability at −5 °C** — plates and columns under near-identical conditions decided by
  seed/history (Knight 2012 via CM6/CM9; TAX1; Bacon 2003); diffusion-limited scalings
  (mass ∝ t^1.5 isometric, Takahashi 1991; r ∝ t^1/2, Bacon 2003); the pressure pair
  (+~30% mass at 860 vs 1010 mb, Takahashi 1991).
- **Class B — single-lab or protocol-bound:** Libbrecht R(t)/H(t) trajectory series (substrate,
  witness-surface σ); free-fall ventilation-enhanced dendrites at water saturation; the TAX1/TAX2
  needle matrices (needle-seeded, selected specimens, in-sample for M1); Harrison/Pokrifka mass
  curves (their own σ calibration was revised between 2016 and 2020 — record both).
- **Class C — standing disagreements:** the cold end (Takahashi: columns below −22.4 °C at
  water saturation vs Bailey–Hallett: plates/polycrystals to −40 °C, mostly lower σ,
  filament-nucleated, with the classic cold-end columns attributed to nucleation artifacts);
  α magnitudes across laboratories (~100× spread; Pokrifka's kinetics transition is the
  candidate reconciliation and therefore also a Phase 9/10 test).

## Steps

- [ ] **S0 — Extraction indexes for the non-Libbrecht corpus.** One tracked
  `research/<paper>.md` per source (takahashi-fukuta1988, takahashi1991 + corrigendum,
  nelson-1998, bailey-hallett-2002, bacon-baker-swanson-2003, harrison-2016, pokrifka-2020,
  harrington-pokrifka-2026 archive), in the style of `libbrecht-papers-extracts.md`: every
  number destined for the book quoted verbatim with page cite; plotted-only quantities listed
  as digitizable with axes described and **no value invented**; Takahashi table bodies are
  image-only in our scans — any transcription is a digitization task with recorded read
  uncertainty. Check: every book entry traces to an extraction line; no orphan numbers.
- [ ] **S1 — σ-semantics normalization.** Every target's supersaturation classified
  (ice-relative σ∞ / σ_surf / at-water-saturation / chamber-calibrated) with stated
  uncertainty, under the convention pinned from `1211.5555v1` p. 2. The Harrison→Pokrifka
  calibration revision recorded on both datasets. Check: no entry with unclassified σ.
- [ ] **S2 — Protocol tags.** Seed (frozen droplet / frost seed / e-needle / substrate prism /
  filament), pressure, transport geometry (free-fall + ventilation / static chamber /
  levitated), history (constant, ramp, fast-start), substrate interaction status, ensemble
  semantics (selected specimens vs population statistics). Check: tags complete on 100% of
  entries; comparability requires tag match, not hand-waving.
- [ ] **S3 — Class assignment with witness lists.** Class A demands ≥2 independent witnesses
  (different lab AND different method); Class C entries carry both positions verbatim plus the
  candidate reconciliation phrased as a testable hypothesis. Check: a reviewer can reconstruct
  every class assignment from the witness list alone.
- [ ] **S4 — Inputs-vs-targets partition.** Explicit flag per entry; the Libbrecht α lineage
  marked input; ADR 0005 in-sample markings carried over; candidate held-out entries named.
  Check: no entry both input and target.
- [ ] **S5 — Registered derived-observable operators.** Deterministic specs (with test
  vectors) for: mass-law exponent fit, P exponent, scaled-trajectory comparison, and
  boundary-temperature extraction — the Phase 6 lesson that unregistered operators
  (agreement scoring, grid extrapolation) become disputes is not repeated. Check: each
  operator has a spec, an implementation, and passing fixtures before any model output is
  scored with it.
- [ ] **S6 — Freeze, split, review.** Hash the book; pre-register the held-out split (which
  entries Phase 9 may tune against vs may only confront); one proportionate non-author review
  per the 2026-08-03 direction. Check: review closes with zero unresolved blockers; hash
  recorded in the evidence register.

## Out of scope

- No solver runs, no model or parameter changes, no scoring of any model output.
- No resolution of Class C disagreements by averaging, majority vote, or preference for any
  single laboratory.
- No adoption of TAX2/TAX1 needle matrices as held-out validation (in-sample per ADR 0005;
  needle-seeded protocol besides).
- No re-litigation of Phase 6 WP1's locked Nakaya strata — the book references them.
- Polycrystalline and rimed-crystal targets are recorded (they dominate parts of parameter
  space) but flagged out-of-model-class; the scope statement itself is Phase 10 work.

## Tried and rejected

- **Scoring habit as a single final-aspect-ratio label against one diagram** (Phase 6): the
  sources themselves warn ρ_aspect encodes growth history and can invert the facet-rate
  ratio (CM8 p. 15; CM6 p. 10). Retained only as one operator among several, never the gate.
- **Counting σ₀ crossings as a habit bound** — retracted 2026-07-29/08-01; see the retraction
  notices in `research/libbrecht-figure-findings.md`. Nothing in this book may inherit it.
- **Treating any single lab's diagram as ground truth** — the cold end proves the failure mode.

## Open questions

- Charter amendment wording and phase numbering (maker decision; Phase 7 work packages are
  already named and owned).
- Do the Takahashi image-only tables get digitized in S0 (adds read-uncertainty machinery) or
  deferred until a Phase 9 arm actually needs a number from them?
- Does Bacon's QJRMS licensing constrain how much verbatim extraction the tracked index may
  carry? (Quotes with citation are presumably fine; check before S0 publishes.)
- Should the education site's new "Independent laboratory work" references section be the
  public mirror of this book's source list, or stay independent?
