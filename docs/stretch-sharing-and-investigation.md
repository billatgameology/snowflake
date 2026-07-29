# Stretch goals — sharing the science, and investigations beyond the current phases

**Maker-directed (2026-07-27).** This file exists at the operator's request and is a
stretch-goal register, not a phase document: nothing in it is a gate, nothing in it authorizes
an evidence claim, and the charter, accepted ADRs, and the frozen Phase 6 protocol outrank it
everywhere. All external contact (email, preprint, submission) is maker-gated — no agent sends
anything on the project's behalf.

**Basis and verification status.** A seven-agent internal review (2026-07-27) verified the four
candidate contributions against the primary sources on disk; a six-agent literature novelty
sweep (same date, web literature through July 2026) then tested each against prior work. The
citations below come from that sweep. Per the project's own evidence discipline (charter §1.5,
AGENTS.md Rule 6): every claim in this file is **sweep-reported, not yet independently
reproduced in-repo** — anything that feeds a gate or a frozen artifact must first be verified
against the named source by the session that uses it.

**One-line conclusion of the sweep:** the publishable core is S4 (the pre-registered 3D test);
S1–S3 survive as a courtesy erratum and two verification/methods notes — real, citable, but not
discoveries. The sweep also surfaced three uncited Libbrecht papers that bear directly on the
Phase 6 parameter table (§2.1 below) — that finding outranks everything else in this file in
practical value.

**Running ledger (added 2026-07-28):** [findings-ledger.md](findings-ledger.md) accumulates
the share-worthy findings and their evidence as they land — reproductions of measured
reality, firsts with supporting evidence, and queued items. This file remains the
strategy-and-gates register; the ledger is the growing inventory it gates.

---

## 1. The four candidate sharing items, after the novelty sweep

### S1 — Monograph Eq. 3.35 misprint: a courtesy erratum, not research

**Sweep verdict: physics preempted; the misprint report itself appears unreported.**
The corrected bracket is already in print — twice, by Libbrecht himself: J. Comput. Methods
Phys. 2013, 174806, Eq. (29) gives it verbatim, and that paper is the very reference the
monograph cites for Eqs. 3.33–3.36; arXiv:0911.4733 (2009) §3.1 gives the algebraically
identical form with the correct limits stated in words. The book's Eq. 3.35 is therefore a
single-symbol transcription slip against its own cited source: Eqs. 3.33, 3.34, and 3.36 are
all consistent with the corrected form and 3.35 alone is inverted. No arXiv v3 exists, no
published erratum was found, and the author's own stated sanity check (far boundary to
infinity) passes for both forms, which explains how it survived proofreading.

**Right action:** a short, friendly email to Libbrecht — framed as "the book's Eq. 3.35
contradicts its own cited source (JCMP 2013 Eq. 29)," never as a new result — including the
observation that the printed form errs in opposite directions on either side of the
kinetics/diffusion balance point. **Before sending:** pull the one place a published correction
could hide, the book review in Crystallography Reviews 28(4), 298 (2022). Maker sends or
approves; the derivation to attach already exists in
`solver-cpu/src/spherical-reference.ts` and `research/phase6-convergence.md`.

### S2 — Far-field domain bias, measured and removed: a verification note, not a method

**Sweep verdict: method preempted, measurement novel.** The monopole-matched shell is
Libbrecht's own published proposal (monograph Ch. 5, "Monopole Matching," Eqs. 5.26–5.27 and
5.30–5.31 — the equations ADR 0024 already cites), and it is the l = 0 truncation of the
classical exterior Dirichlet-to-Neumann artificial boundary (Keller & Givoli, J. Comput. Phys.
82, 1989), with a direct analogue in Poisson–Boltzmann solvers. What nobody has published:
an implementation on a full 3D lattice, or a number for the bias the common fixed-value shell
hides. Libbrecht explicitly left the check as future work; Kelly & Boyer and Gravner–Griffeath
use distance heuristics with no number attached.

**Defensible claim, exactly:** *first quantitative measurement and removal of far-field
domain-size bias in a 3D snow-crystal lattice model* — the 4.1% attached-count swing between
28³ and 40³ under the fixed-value shell, eliminated by monopole matching (ADR 0024), plus the
first-order finite-shell amplification the corrected Eq. 3.35 predicts. A methods section or
short note, framed as verifying Libbrecht's proposal; presenting the boundary condition itself
as novel would be badly received and rightly so.

### S3 — Exact D6h on the full lattice: an appendix paragraph, correctly attributed

**Sweep verdict: known technique family, correctly applied; the specific setting is the only
delta.** Float non-associativity breaking exact simulation symmetry was named in this very
literature by Gravner & Griffeath (Physica D 2008), and the diagnose-and-fix pattern is
published in CFD (Fleischmann, Adami & Adams, Comput. Fluids 189, 2019; Wakimura, Takagi &
Xiao, Comput. Fluids 233, 2022), with the reduction-as-multiset idea being the reproducible-
summation programme (Demmel–Nguyen; Ahrens–Demmel–Nguyen, ACM TOMS 2020) and integer-invariant
geometry being the exact-geometric-computation paradigm (Shewchuk 1997). G-G obtained exact
sixfold symmetry by simulating only the order-24 fundamental domain.

**Defensible claim, exactly:** symmetry-by-construction on the *full* stacked-triangular
lattice via order-canonical (not order-invariant — state the distinction) reductions and the
integer form `di² + di·dj + dj² + dk²`, preserving what the fundamental-domain trick
sacrifices: the ability of noise and asymmetric states to break symmetry *physically* while
the arithmetic never breaks it *numerically*. One well-cited appendix in the S4 paper; not a
standalone publication.

### S4 — The pre-registered no-SDAK 3D test: the paper

**Sweep verdict: execution novel with high confidence; the conclusion is Libbrecht's stated
expectation and must be framed as its first test, not a discovery.** The load-bearing facts:

- Libbrecht already asserts in print that measured broad-facet kinetics alone give plates at
  −5 °C and that the SDAK hypothesis is load-bearing for the diagram (arXiv:2011.02353;
  monograph §4.5; arXiv:1910.09067 Fig. 10). The project's preliminary inverted-sense flip
  **confirms a stated premise**. The honest title claim is: *first quantitative,
  pre-registered, full-3D falsification test of a claim that existed only in prose.*
- Nobody has run the test. Libbrecht's own kinetics-bearing CA ran only in cylindrical 2D
  (JCMP 2013); Kelly & Boyer (Cryst. Growth Des. 2014) held temperature fixed and left prism
  sigma_0 a free parameter; Demange et al. (npj Comput. Mater. 3, 2017) tune one habit
  parameter per target morphology and back-label with temperature — their "consistent with the
  Nakaya diagram" cannot fail and must be pre-empted explicitly in related work; Tan et al.
  (Phys. Fluids 2022) is 2D, isothermal, plate-regime only. The Chen–Lamb/Harrington
  inherent-growth-ratio lineage *inputs* the observed habit sequence, so its agreement with
  Nakaya is circular — the sharpest contrast sentence available. Libbrecht's June 2023 papers
  state no existing 3D model reproduces even one of his 206 benchmark structures; his
  snow-crystal output stops there, and arXiv:2306.13087 has zero citations as of mid-2026.
- The pre-registration apparatus (frozen protocol, ambiguity bands, in-sample/held-out SDAK
  split, pre-published evidence budget) has no precedent anywhere in this literature.

**Comparison-target guidance from the sweep (feed into WP2 framing, not into the frozen
protocol without an ADR):**

- The classic Nakaya/Kobayashi diagram is **known-wrong below about −20 °C** in the
  atmospheric sense (Bailey & Hallett, J. Atmos. Sci. 66, 2009: polycrystalline plates, not
  columns). Word any falsification claim for roughly −2…−20 °C, where Nakaya, Bailey–Hallett,
  Hueholt et al. (BAMS 2022), and Libbrecht's matrix agree; report the cold end separately.
- No observational habit boundary anywhere carries a numeric uncertainty — the project's
  ±0.5 °C boundary reads are constructed, and the paper must defend them as such.
- The only uncertainty-stated reference in existence is Libbrecht's 206-panel e-needle matrix
  (arXiv:2109.00098 + 2306.13087; stated T ±0.2 °C, sigma ×0.8–1.2). It is the natural
  *quantitative* target — already deferred in-plan behind the column-seed ADR.
- Takahashi (J. Atmos. Sci. 2014) offers sub-degree habit boundaries exactly in the −15 °C
  band where the model currently misses — the sharpest available "how badly" reference.
- Adopt Libbrecht's growth-behavior taxonomy as the morphology label set (designed for
  constant-condition, model-comparable growth); register the choice before results are read.
- Venue shape: Physical Review E (where Gravner–Griffeath published). Before submission:
  read Eto/Garcke/Nürnberg arXiv:2602.18226 in full (newest live work on the sharp-interface
  axis; abstract-only assessed), and address Llombart et al. (Sci. Adv. 2020) as the competing
  molecular explanation for the basal/prism crossover.

---

## 2. Sweep findings that feed back into Phase 6 — surface to maker, ADR-gated

### 2.1 Three uncited Libbrecht papers print what the frozen table digitized

The frozen `docs/libbrecht-parameters.md` records sigma_0/A curves as "figure-only" with
digitized anchors at ±25%. The sweep found printed closed forms and tables the project has
never cited:

- **arXiv:2009.08404** (2020, "…8. Characterizing SDAK near −14 C"): closed-form printed
  parameterizations of the Figure 4.5 broad-facet curves. Sweep-checked against our nine
  digitized anchors: A_prism matches to ≤0.015 absolute at every point (including the round-2
  0.95→0.83 correction); sigma_0 basal within ≤19%, sigma_0 prism within ≤34% — worst on the
  warm side, the same one-sided warm-prism low bias the internal audit found independently.
- **arXiv:2306.13087** (2023, "Quantifying the Nakaya Diagram"): closed forms for the SDAK
  dips (log base 10, pinned by two independent checks), plus the 206-panel quantified diagram.
- **arXiv:2306.04042** (2023, "A Comprehensive Model of Snow Crystal Faceting"): a printed
  SDAK-2 anchor table — a two-branch (A, sigma_0) form, refining the table's §4.2 note.

**The maker decision this forces, before the first sweep:** adopt the printed closed forms in
place of digitized anchors (an ADR — the table is hash-frozen, and a post-freeze edit
invalidates prior sweep results by design; *now*, pre-sweep, is the only cheap moment), or
keep the digitized table and register the closed forms as WP4 sensitivity runs. Robustness
note either way: the broad-facet sigma_0 crossing sits at T* ≈ 10.9 (2009.08404 forms),
≈ 8.4 (2306.13087 forms), and ≈ 9–10 (our digitization) — all three put −5 °C on the plate
side and −15 °C on the column side, so the preliminary result does not hinge on the choice.

Also from the same papers, two implementation checks worth one session each:

- Libbrecht's technical correction to Kelly & Boyer in arXiv:2306.13087 — do not invert the
  attachment coefficient as a function of surface supersaturation; relax the external field
  and surface boundary values simultaneously. Verify our solver's self-consistent relaxation
  already conforms (it should — record the check).
- The Phase 6 discriminating condition (f = 0.15 at −5 °C) reportedly coincides with a
  bistability point Libbrecht identifies near sigma = 0.15% — check the source and, if real,
  note it in the WP2 report as a deliberately hard test point.

### 2.2 Independent cross-checks nobody has used

- **SDAK has never been independently tested by anyone** (through July 2026) — a fact worth
  stating in the S4 paper, and the reason the no-SDAK probe matters.
- The Harrington-group levitation datasets (Harrison et al. 2016; Pokrifka et al. 2020, 2023)
  are the only attachment-coefficient constraints from a group independent of Libbrecht.
  Checking our broad-facet inputs against them in the overlapping range would materially
  strengthen the paper's inputs section.

---

## 3. Own-investigation agenda (post-sweep, ordered by scientific value)

These are the "step beyond sharing" items — original measurements this project can make with
machinery it already owns. Each needs its own plan file (Rule 2) when picked up; none may
touch the frozen protocol without an ADR.

1. **I1 — Held-out free-fall test.** The monograph's free-falling-crystal growth data at
   −5/−10 °C: grade A, needs no column seed, tests growth rate and habit, and its reported
   sense opposes the model's expectation — the single strongest falsification target
   available. (Charter §2.7's held-out class; practically reachable held-out set today is
   ~5 entries, not 122 — most sit behind the column-seed ADR.)
2. **I2 — Facet-rate curves.** Model v_n(sigma_surf) against the measured facet-rate data via
   the 1D spherical reference harness — nearly transport-free, the only test that separates a
   kinetics-law error from a transport/discretization one.
3. **I3 — Size-dependent habit.** The AR-vs-extent trajectories are already computed every run
   and currently discarded at a single measurement size; publishing them against the
   monograph's size-dependence claims is nearly free.
4. **I4 — Pressure ladder.** D ∝ 1/P is exact at reference pressure and nothing was tuned to
   it — a cheap, genuinely held-out axis.
5. **I5 — SDAK-active sweep** (in-sample, labeled as such per ADR 0005), now feasible with the
   printed closed forms of §2.1 rather than fresh digitization.
6. **I6 — The ADR 0024 validity-limit mystery.** WP3 disproved the recorded explanation for
   where monopole matching breaks (20³) and did not identify the governing quantity. Small,
   self-contained, and publishable inside S2 if solved.
7. **I7 — Quantitative comparison against the 206-panel e-needle matrix** — the real
   validation prize; gated behind the column-seed ADR, which is exactly why that ADR deserves
   priority after the qualitative sweep ships.

---

## 4. Process requirements before anything leaves this repository

1. Phase 6 pre-sweep gaps closed (scoring rule, extrapolation operator, charter far-field
   amendment) and the registered sweep run — the S4 paper does not exist without its result.
2. Every sweep-reported claim above re-verified against the named source in-repo before it is
   cited (Rule 6 applies to manuscripts exactly as to gates).
3. At least one human domain scientist reads any manuscript before submission. All reviews to
   date, internal and external-facing, are LLM reviews; for publication that is a disclosed
   limitation, not a substitute.
4. The charter's Type × Evidence discipline (§1.5) governs manuscript prose: "the model was
   given real physics" and "the model reproduces reality" stay distinct claims in every
   sentence that could conflate them.
5. Maker approves every external artifact: the S1 email, any preprint, any submission.
