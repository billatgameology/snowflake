# Stretch goals — sharing the science, and investigations beyond the current phases

**Maker-directed (2026-07-27).** This file exists at the operator's request and is a
stretch-goal register, not a phase document: nothing in it is a gate, nothing in it authorizes
an evidence claim, and the charter, accepted ADRs, and the frozen Phase 6 protocol outrank it
everywhere. All external contact (email, preprint, submission) is maker-gated — no agent sends
anything on the project's behalf.

**Basis and verification status.** A seven-agent internal review (2026-07-27) checked the four
candidate contributions against the primary sources then on disk; a six-agent web search sampled
related literature through July 2026. This was a reviewed-source scan, not a systematic or
exhaustive priority review. The citations below come from that scan. Per the project's own evidence
discipline (charter §1.5, AGENTS.md Rule 6), anything that feeds a gate, priority statement or frozen
artifact must be independently verified against the named source and a current search protocol.

**Historical Rule 10 limit.** The surviving record does not identify the reviewing models, say
whether they shared developer context, or enumerate which source claims each agent independently
re-executed. Those provenance details cannot be reconstructed from the current repository. The
paragraph above therefore records only the reported historical workflow, not a Rule 10-complete
independent review. No part of that review was re-executed for this record correction, and its
unchecked set includes any source/claim pairing not explicitly cited below as having been checked.

**Current scoped conclusion:** S4 is a potential paper candidate only after R15 numerical adequacy,
the matched ablation, GPU obligation, held-out comparisons and a current systematic priority review.
S1–S3 remain possible courtesy/verification/methods notes. The scan also surfaced three then-uncited
Libbrecht papers that bear directly on the Phase 6 parameter table (§2.1 below); their practical
value was source currency, not proof of novelty.

**Running ledger (added 2026-07-28):** [findings-ledger.md](findings-ledger.md) accumulates
candidate share-worthy findings, corrections, their evidence and limits. This file remains the
strategy-and-gates register; the ledger is the growing inventory it gates.

---

## 1. The four candidate sharing items, after the scoped literature scan

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

**Reviewed-source scan verdict: published method; this exact measurement was not found in the
reviewed set.** The monopole-matched shell is
Libbrecht's own published proposal (monograph Ch. 5, "Monopole Matching," Eqs. 5.26–5.27 and
5.30–5.31 — the equations ADR 0024 already cites), and it is the l = 0 truncation of the
classical exterior Dirichlet-to-Neumann artificial boundary (Keller & Givoli, J. Comput. Phys.
82, 1989), with a direct analogue in Poisson–Boltzmann solvers. The reviewed source set did not
contain a full-3D lattice implementation or this exact bias measurement. Libbrecht left the check as
future work; Kelly & Boyer and Gravner–Griffeath use distance heuristics with no number attached.

**Candidate scoped claim, after the underlying cases and comparison are re-verified:**
*quantitative measurement and reduction of far-field domain-size bias in the tested 3-D
snow-crystal lattice cases* — the 4.1% attached-count swing between
28³ and 40³ under the fixed-value shell, eliminated by monopole matching (ADR 0024), plus the
first-order finite-shell amplification the corrected Eq. 3.35 predicts. A methods section or
short note, framed as verifying Libbrecht's proposal; presenting the boundary condition itself
as novel would be badly received and rightly so.

### S3 — Exact D6h on the full lattice: an appendix paragraph, correctly attributed

**Scoped-scan verdict: known technique family, correctly applied; the reviewed sources did not show
this exact application setting.** Float non-associativity breaking exact simulation symmetry was named in this very
literature by Gravner & Griffeath (Physica D 2008), and the diagnose-and-fix pattern is
published in CFD (Fleischmann, Adami & Adams, Comput. Fluids 189, 2019; Wakimura, Takagi &
Xiao, Comput. Fluids 233, 2022), with the reduction-as-multiset idea being the reproducible-
summation programme (Demmel–Nguyen; Ahrens–Demmel–Nguyen, ACM TOMS 2020) and integer-invariant
geometry being the exact-geometric-computation paradigm (Shewchuk 1997). G-G obtained exact
sixfold symmetry by simulating only the order-24 fundamental domain.

**Defensible claim, exactly:** symmetry-by-construction on the *full* stacked-triangular
lattice via order-canonical (not order-invariant — state the distinction) reductions and the
integer form `di² + di·dj + dj² + dk²`, preserving what the fundamental-domain trick
sacrifices: the ability of noise and asymmetric states to break symmetry *physically*. Exact
noise-off arithmetic symmetry is scoped to the CPU paths that canonicalize every load-bearing
reduction and use integer-invariant shell geometry (not legacy aggregate v4/v5 or the current GPU
v5 path, which are explicitly not D6h-equivariant). One well-cited appendix in the S4 paper; not a
standalone publication.

### S4 — The pre-registered no-SDAK 3D test: the paper

**Corrected status: potentially publishable negative result, with priority and causal claims
withdrawn.** The load-bearing facts:

- Libbrecht already asserts in print that his measurement-derived broad-facet parameterization alone gives plates at
  −5 °C and presents SDAK as its explanation for the diagram (arXiv:2011.02353; monograph §4.5;
  arXiv:1910.09067 Fig. 10). The project's historical 204-row CAK sweep measured zero
  threshold-classified columns among the 36 rows in its registered `columns` regime; the artifact
  contains 30 column rows elsewhere and must not be described as a zero-column arm. The former
  inverted-sense/necessity argument from `sigma_0` crossings is
  retracted. CAK→M1 is also confounded; only a pre-registered M1/no-dip matched pair can isolate
  the implemented dip factors' effect on this solver under a frozen configuration, and the
  replacement protocol has not frozen that pair yet. Even that intervention cannot establish
  physical SDAK causality or necessity in nature.
- The literature note is not an exhaustive priority review and makes no “first” or “nobody has”
  claim. Libbrecht's own kinetics-bearing CA ran in cylindrical 2-D (JCMP 2013); Kelly & Boyer
  (Cryst. Growth Des. 2014) held temperature fixed and left prism
  sigma_0 a free parameter; Demange et al. (npj Comput. Mater. 3, 2017) tune one habit
  parameter per target morphology and back-label with temperature — their "consistent with the
  Nakaya diagram" cannot fail and must be pre-empted explicitly in related work; Tan et al.
  (Phys. Fluids 2022) is 2D, isothermal, plate-regime only. The Chen–Lamb/Harrington
  inherent-growth-ratio lineage *inputs* the observed habit sequence, so its agreement with
  Nakaya is circular. These are comparison points for a future systematic review, not proof of
  novelty or priority.
- The defensible contribution is methodological and measured: frozen protocol, ambiguity bands,
  separate in-sample/held-out labels, and an artifact-backed negative comparison. Any publication
  must wait for R15 numerical adequacy, the matched ablation, GPU obligation and held-out targets.

**Comparison-target guidance from the sweep (feed into WP2 framing, not into the frozen
protocol without an ADR):**

- Bailey & Hallett (J. Atmos. Sci. 66, 2009) report atmospheric polycrystalline plates below about
  −20 °C rather than the classic diagram's columns. Scope any falsification claim to roughly
  −2…−20 °C, where the named reviewed references agree, and report the colder Bailey–Hallett
  regime separately rather than declaring the classic diagram universally wrong.
- The scoped, non-exhaustive review found no observational habit boundary carrying a numeric
  uncertainty. The project's ±0.5 °C boundary reads are constructed, and the paper must defend
  them as such; this is not a universal literature claim.
- The only uncertainty-stated photographic matrix found in the reviewed set is Libbrecht's 206-panel
  e-needle matrix (arXiv:2109.00098 + 2306.13087; stated T ±0.2 °C, sigma ×0.8–1.2). It is in-sample
  for M1 and uses load-bearing electric-needle geometry, so it is a blind reconstruction candidate,
  not independent validation for the current seed.
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
  digitized anchors: `A_prism` differs by at most 0.0325 absolute (at −15 °C) and 8.36% relative
  (at −5 °C), including the round-2 0.95→0.83 correction. `sigma_0_basal` is within 19%.
  `sigma_0_prism` is within 34% only after excluding the explicitly approximate −1 °C plot-floor
  anchor: there the project has 0.006% and Eq. (3) gives 0.0025%, a 58.3% difference relative to
  the project anchor. These are same-lineage transcription comparisons, not validation.
- **arXiv:2306.13087** (2023, "Quantifying the Nakaya Diagram"): closed forms for the SDAK
  dips. The source leaves `log` unspecified; the project's P4 base-10 transcription matches the
  plotted Figure 1 widths, while dip centres are
  base-invariant and therefore are not an independent base check. The paper also contains the
  206-panel quantified diagram.
- **arXiv:2306.04042** (2023, "A Comprehensive Model of Snow Crystal Faceting"): a printed
  SDAK-2 anchor table — a two-branch (A, sigma_0) form, refining the table's §4.2 note.

**Current disposition:** the later printed forms are now recorded in the corrected current parameter
table accepted under decision 0040. The historical CAK artifacts retain their old hash; the
replacement protocol requires its own frozen table/protocol identity and a full rerun. The nominal
sigma0 crossings near 8–11 °C are input-
function diagnostics only and do not assign plate/column habit.

Also from the same papers, two implementation checks worth one session each:

- Libbrecht's technical correction to Kelly & Boyer in arXiv:2306.13087 — do not invert the
  attachment coefficient as a function of surface supersaturation; relax the external field
  and surface boundary values simultaneously. Verify our solver's self-consistent relaxation
  already conforms (it should — record the check).
- The Phase 6 discriminating condition (f = 0.15 at −5 °C) reportedly coincides with a
  bistability point Libbrecht identifies near sigma = 0.15% — check the source and, if real,
  note it in the WP2 report as a deliberately hard test point.

### 2.2 Candidate independent cross-checks and their limits

- The reviewed July 2026 set did not establish an independent end-to-end 3-D test of the exact M1
  prescription. This is a scoped search result, not a universal priority claim.
- The reviewed Harrington-group levitation datasets (Harrison et al. 2016; Pokrifka et al. 2020,
  2023) supply mass-growth observations from a group independent of Libbrecht. They may constrain
  attachment kinetics only through a source-matched transport/shape model; missing crystallography
  and latent-heat transport currently prevent an independent broad-facet parameter check.

---

## 3. Own-investigation agenda (post-sweep, ordered by scientific value)

These are the "step beyond sharing" items — original measurements this project can make with
machinery it already owns. Each needs its own plan file (Rule 2) when picked up; none may
touch the frozen protocol without an ADR.

1. **I1 — Held-out target search.** The current source-lock has `passEligible=false`: no reviewed
   free-fall candidate supplies the crystallography, geometry, transport physics, uncertainty, and
   observable definition needed for an apples-to-apples gate. Continue the Yamashita/pressure
   lineage without manufacturing a target from model output.
2. **I2 — Facet-rate curves.** Compare a facet-rate harness with the published `v_n(sigma_surf)`
   curves as a same-lineage fit diagnostic. Their local `sigma_surf` axes are source-model
   reconstructions/corrections rather than direct measurements, so this is neither transport-free
   nor an independent separator of kinetic and transport error.
3. **I3 — Size-dependent habit.** The AR-vs-extent trajectories are already computed every run
   and currently discarded at a single measurement size; publishing them against the
   monograph's size-dependence claims is nearly free.
4. **I4 — Pressure ladder.** A simulator-only D ∝ 1/P ladder is a diagnostic sensitivity, not
   held-out validation. A gate needs a matched experimental target with covariates controlled.
5. **I5 — SDAK-active sweep** (in-sample, labeled as such per ADR 0005), now feasible with the
   printed closed forms of §2.1 rather than fresh digitization.
6. **I6 — The ADR 0024 validity-limit mystery.** WP3 disproved the recorded explanation for
   where monopole matching breaks (20³) and did not identify the governing quantity. This is a
   small, self-contained internal investigation; any publication relevance depends on its result
   and a current literature review.
7. **I7 — Blind reconstruction against the 206-panel e-needle matrix.** Useful only with the
   source-matched seed and a preregistered segmentation operator; in-sample for M1, never promoted
   to independent validation.

---

## 4. Process requirements before anything leaves this repository

1. Complete the active R15 science-first plan: accept and freeze the corrected authority/protocol,
   implement and independently review resumable checkpoints, execute the three-arm numerical-
   adequacy campaign, satisfy the charter's preview-resolution GPU cohort, and either obtain
   pass-eligible held-out targets or state that independent validation remains unavailable. The S4
   paper does not exist on the historical measured-only sweeps alone.
2. Every sweep-reported claim above re-verified against the named source in-repo before it is
   cited (Rule 6 applies to manuscripts exactly as to gates).
3. At least one human domain scientist reads any manuscript before submission. Repository records
   presently contain no human domain-expert review. Every recorded non-maker reviewer-agent round
   is an LLM review; maker audits are recorded separately, and the maker is not identified as a
   domain scientist. For publication that is a disclosed limitation, not a substitute.
4. The charter's Type × Evidence discipline (§1.5) governs manuscript prose: "the model was
   given real physics" and "the model reproduces reality" stay distinct claims in every
   sentence that could conflate them.
5. Maker approves every external artifact: the S1 email, any preprint, any submission.
