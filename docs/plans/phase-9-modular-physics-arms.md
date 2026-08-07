# Plan — Phase 9: Modular physics arms and behavioural scoring

- **Phase:** Phase 9 (proposed) — Recombine the printed physics; score behaviour, not labels
- **Status:** draft for maker review — not chartered; adopting it requires a charter amendment
  and logged ADRs per arm. Depends on the Phase 8 target book being frozen. Must not touch
  Phase 6 frozen artifacts or Phase 7 territory (held-out execution, WGSL/preview-GPU cohort).
- **Started:** 2026-08-04 (drafted)
- **Last touched:** 2026-08-04 by Claude Fable 5 — initial draft at the maker's direction

## Goal

Phase 6 established that the broad-facet CAK arm cannot reproduce the reference diagram (3/90)
and that the original structural explanation for why was wrong. The literature read in August
2026 supplies a shelf of **printed, source-anchored physics the model has never included** —
Gibbs–Thomson, latent-heat rescaling, pressure-dependent transport, seed geometry, growth
history, and the FACET two-branch prism kinetics — plus a better ruler (the Phase 8 book).
This phase factors the solver's physics into switchable modules, runs cheap pre-registered
discriminating probes per module, and promotes only winners to registered campaign arms scored
by behavioural operators. The question changes from "does the model reproduce the diagram" to
"does the model behave like a specific, protocol-matched laboratory experiment."

## Done when

The charter has no Phase 9 milestone; proposed metric: done when every registered module arm
has (a) a logged ADR, (b) a pre-committed expected effect written before any 3-D run, (c) a
discriminating probe result confronted with that expectation, hit or miss, and (d) — for arms
promoted to campaign — a frozen-protocol run scored by the registered Phase 8 operators
against the target book, with agreements and disagreements both stated; and at least one
negative control per campaign arm demonstrates the arm does **not** improve bands it has no
physical business improving.

## Approach

Additive, pre-registered, cheapest-discriminator-first — the standing 2026-07-31 direction
(spend hours on the discriminating check before days on the expensive one) is the ordering
rule. The existing three Phase 6 arms (CAK, M1, `M1_NO_DIP_ABLATION`) are untouched history;
new arms are new frozen protocols. Module switches compose, but campaign promotion is one
module at a time against the ablation baseline, so effects stay attributable.

### Module shelf (ordered by expected discrimination per cost)

| # | Module | Source anchor | Expected effect (to be committed per-ADR before running) | Discriminating probe |
|---|--------|--------------|----------------------------------------------------------|----------------------|
| M-P | Pressure-dependent transport check | D ∝ 1/p; Takahashi 1991 +~30% mass at 860 vs 1010 mb | Transport core reproduces the pressure pair with **no kinetics change** | Two runs, one pressure ratio; hours |
| M-GT | Gibbs–Thomson term | FACET Eq. 32 denominator (d_sv ≈ 1 nm); TAX2 p. 7 "prevents one-pixel-wide plates" | Changes the low-σ cells where Phase 6's only columns appeared; kills lattice-thin-plate pathology | Re-run the f = 0.10–0.15 columns rows with GT on/off |
| M-H | History/schedule protocol (time-varying σ∞ in the runner) | CM6 fast-start recipe for columns; Knight bistability | A fast-start σ schedule at −5 °C yields a column where constant-σ yields a plate; bistability becomes reproducible | One temperature, two schedules; directly attacks the failed columns band **and** the Class A bistability target |
| M-S | Seed-geometry arms (plate / needle-like / droxtal-isometric) | Phase 6 five-seed probe (+0.4–0.5 AR swings); TAX1 needle method; Bacon frozen-droplet seeds | Seed class shifts habit class at the two discriminating rows; needle seed enables TAX1/TAX2-protocol comparisons | Re-run the two registered discriminating conditions per seed |
| M-K2 | FACET two-branch prism kinetics (SDAK-2 annex) | 2306.04042 Table 1 p. 9 (verified in-repo), −1…−15 °C, with v_kin(T); Gibbs–Thomson-corrected exponent — the only printed, tabulated post-monograph parameter artifact | Warm-end behaviour from a printed table instead of digitized curves; branch 1 matches the −2/−5 °C source fits identically | Warm-band rows vs CAK and M1 arms |
| M-LH | Latent-heat, cheap form | TAX2 p. 5: σ∞ rescaling approximates thermal effects; "negligible below −10 °C" | Warm-end AR shifts; nothing changes below −10 °C (that invariance is itself the check) | Warm rows with rescale on/off |
| M-V | Ventilation factor (optional) | Takahashi 1991 habit-selective enhancement | Only needed to score free-fall targets; alternative is restricting those targets to low-Re isometric rows | Decide restrict-vs-model per target during S1 |

### Scoring upgrade (registered once, used by every arm)

Retire the single AR-label gate. Score behaviour with the Phase 8 operators:

- per-facet velocity ratios and R(t)/H(t) trajectories against Class A/B curves;
- mass-law exponents (≈1.5 isometric; >1.9 shape-enhanced — Takahashi);
- P exponents computed from simulated mass series (supersaturation-free on both sides);
- boundary temperatures extracted from model sweeps **as measured quantities with
  uncertainty**, compared to the free-fall boundaries under matched protocol;
- for bistable regimes, **distributions over enumerated seed/history variants** — the model is
  deterministic, so ensembles are enumerated, not sampled — with −5 °C bistability scored as
  present/absent.

The AR thresholds survive only as one legacy operator for continuity with Phase 6 reporting.

### Design discipline (inherited, non-negotiable)

Expected effects committed before running (nothing is ever selected by score — the Phase 6
`paramSet` lesson); small-grid probes (48³) before any registered sweep; convergence gates
honoring the extent-29 columns-regime finding before any columns claim; negative controls per
promoted arm; one proportionate non-author review per unit (2026-08-03 direction); every arm
ADR-logged with its annex separately hashed.

## Steps

- [ ] **S0 — Module interface refactor, physics-neutral.** Switchable modules behind flags with
  the existing three arms reproducing their frozen outputs bit-identically. Check: regression
  suite reproduces the registered hashes for CAK, M1, and the ablation arm.
- [ ] **S1 — Target selection.** From the frozen Phase 8 book: which entries each module's
  probe and campaign may use (tuning vs confrontation per the pre-registered split); the
  restrict-vs-model ventilation decision. Check: selection recorded before any probe runs.
- [ ] **S2 — M-P transport probe.** Check: pressure pair result confronted with the +30%
  target; failure here halts the phase (the transport core is upstream of everything).
- [ ] **S3 — M-GT probe.** Check: low-σ column cells and thin-plate pathology re-measured
  with GT on/off; expected-effect confrontation recorded.
- [ ] **S4 — M-H schedule support + probe.** Runner gains time-varying σ∞ (ADR: this is a
  protocol capability, not a physics edit). Check: fast-start vs constant-σ pair at −5 °C
  confronted with the pre-committed expectation.
- [ ] **S5 — M-S seed arms probe.** Check: seed-class effect table at the two discriminating
  conditions, including the needle-seed/TAX-protocol match question.
- [ ] **S6 — M-K2 annex + probe.** Two-branch annex transcribed from Table 1 with page cites,
  separately hashed (transcription discipline per the corrected Eq.-32 note in
  `libbrecht-figure-findings.md` §8 — the GT term in the exponent must not be silently
  dropped again). Check: annex hash registered; warm-row probe confronted.
- [ ] **S7 — M-LH probe.** Check: warm-end effect present, sub-−10 °C invariance holds.
- [ ] **S8 — Behavioural scoring operators wired.** Check: operators run against the three
  historical arms first, producing the re-scored Phase 6 baseline (a result worth having
  regardless of what follows).
- [ ] **S9 — Promotion + campaign.** Modules whose probes met their committed expectations are
  promoted one at a time to frozen-protocol campaign arms with negative controls. Check: per
  arm, the Done-when clause (a)–(d) is satisfied and reported.

## Out of scope

- Width-dependent closures, ESI switches, and time/state-dependent α — Phase 10 (they require
  inventing sub-grid physics, not recombining printed physics).
- Full thermal diffusion solve (M-LH is the source-endorsed rescaling only).
- Polycrystals, riming, aggregation, nucleation-mode physics.
- Any GPU execution (Phase 7 territory) and any modification of Phase 6 frozen artifacts.
- Resolving Class C disagreements — arms may *illuminate* them (e.g. protocol-matched cold-end
  runs), resolution is a Phase 10 synthesis question.

## Tried and rejected

- **Broad-facet CAK as a sufficient model** — Phase 6, 3/90, retained as the baseline arm.
- **Selecting a parameterization by its score** — the CAK/CAK_A1 history; expected effects are
  committed in advance precisely so this cannot recur.
- **σ₀-crossing counting as mechanism attribution** — retracted; module attribution here is
  by controlled ablation only.
- **Single-point deterministic scoring at bistable conditions** — the sources report
  multiplicity at −5 °C; treating one outcome as "the" answer at such a point is a category
  error (CM6 p. 22, TAX1 p. 8).

## Open questions

- Maker prioritization across the module shelf, and the compute budget per probe vs campaign.
- Does M-H's schedule capability belong in the runner protocol schema or as a module? (It
  changes what a "condition" is — a point becomes a path — which touches the evaluator too.)
- Is the re-scored Phase 6 baseline (S8) publishable as its own note? It reframes 3/90 in
  behavioural terms and may change which bands look worst.
- Whether M-K2 should also carry the FACET basal treatment (the source holds basal static in
  that paper — dR_thick/dt ≈ 0 — which conflicts with our coupled growth; needs an ADR
  decision on scope of the annex).
