# Snow Crystals monograph review — findings vs. the plan, and exploration candidates

**Status: living review/discussion note (started 2026-07-16, Claude Fable 5 session with the
maker).** Type: analysis; Evidence: cited source findings plus clearly-flagged own analysis.
This file is **not** a plan and **not** an ADR — nothing in it changes project state by itself.
Every item that survives discussion lands through the normal authority chain (ADR → charter →
plan → code). Items are tagged with where they should land.

**Source:** K. Libbrecht, *Snow Crystals* (arXiv:1910.06389v2, 523 pdf pages),
`research/1910.06389v2.pdf`, read via the `research/1910.06389v2-llm` page-text bundle.
Citations are given as printed page / pdf page (pdf = printed + 1). Chapters reviewed in depth:
3 (diffusion-limited growth), 4 (attachment kinetics), 5 (computational snow crystals);
targeted reads of chapters 7 (precision measurements) and 8 (electric ice needles).

Baseline compared against: charter v1.6 (main worktree; v1.9 in the phase-4 worktree),
`docs/attachment-kinetics.md` §4.4, `docs/libbrecht-parameters.md`, ADRs 0003–0011, the Phase 4
plan (`snowflake-phase4` worktree), and the accepted `aggregate-hv-g1h1-v4` surface policy.

---

## 1. What the source confirms the project already got right

Recorded so later sessions do not relitigate:

- **CA over phase-field / front-tracking for v1.** The monograph's own method comparison
  (printed pp. 183–185) concludes cellular automata are best suited to facet-dominated growth;
  published phase-field snow crystals used unphysically weak kinetic anisotropy and Péclet
  numbers orders of magnitude too high (printed p. 179); front-tracking has never demonstrated
  the deep kinetic-anisotropy cusps ice needs (printed pp. 183–184).
- **The Robin-coupled surface operator answers the published critique of G-G.** Kelly & Boyer's
  two objections — no mass continuity at attachment, and an imposed zero surface
  supersaturation (printed pp. 181–182) — are exactly what `LibbrechtKinetics` replaces.
  `GGThreshold` remains the machinery control, which is its charter role, not a physics claim.
- **The v4 boundary policy is the monograph's own 3D prescription.** ADR 0009's
  `aggregate-hv-g1h1-v4` implements the aggregate opposing-pixel condition of Eqs. 5.34–5.35
  with the geometry factors set to 1 (printed pp. 208–209), the `[01]`-basal / `[20]`-prism
  classification of Figure 5.26, zero attachment at isolated `[10]` tips, and unit attachment at
  kink-dominated sites — and it correctly identified the source's internal `[10]`/`[01]`
  typographical errors.
- **Lattice spacing is well chosen.** The source recommends a grid of a few times the kinetic
  length `X_0` with nothing gained below `X_0` (printed pp. 191, 199–200); the registered
  `dx = 0.35 µm ≈ 2.4·X_0` at 1 atm sits inside that guidance.
- **SDAK-last sequencing and P3 labeling match the source's own uncertainty language**
  (dips drawn dotted "to signify their substantial uncertainties," printed p. 152).
- **Pass A / pass B separation** matches the source's insistence that models be judged on
  growth *rates* under known conditions, not on morphology resemblance alone (printed
  pp. 174–175, 211–212).

## 2. Findings — overlooked, incorrect, or unrecorded items

Ordered by priority. Each carries: the finding, the citation, and where it lands.

### 2.1 Two factual errors in `libbrecht-parameters.md` §4 (SDAK branch)

- **SDAK-2 is an `A`-modification, not a `sigma_0` modification.** The table currently states
  "the sources modify only sigma_0; A handling on narrow facets is not separately specified
  (gap)." Figure 4.14 (printed p. 154) shows the SDAK-2 hypothesis as a dotted curve raising
  `A_prism → 1` on small prism facets above ≈ −10 °C, supersaturation-dependent, aimed at
  sharp-tipped dendrites. SDAK-1 (the `sigma_0` dips) and SDAK-2 (the `A_prism` recovery) are
  two distinct hypotheses; the table records only the first.
- **A printed functional form for the width dependence exists.** The table says "No functional
  form is printed for the dips — figure-only." True for the *temperature* dips, but the
  monograph prints the width parameterization used in [2015Lib2]:
  `sigma_0(w) = sigma_0,broad · [1 − exp(−w/w_0)]`, with `w_0` an adjustable model parameter,
  and notes the details matter less than having `sigma_0 → 0` as `w → 0` (printed p. 157).
  This is a substantial head start for the eventual SDAK work package.
- **Lands in:** `libbrecht-parameters.md` §4 correction (file is not frozen; no ADR needed).
  **LANDED 2026-07-26**, before the Phase 6 freeze: SDAK-2 is now `libbrecht-parameters.md`
  §4.2 (Figure 4.14's caption quoted verbatim) and the printed width form is §4.3. Both were
  re-verified against the page renders rather than taken from this note.

### 2.2 The in-air pressure systematic the table records as settled

The table cites the CAK pressure-independence assumption (printed p. 145) as "answered at the
model level." The monograph itself is internally split on this:

- Ch. 4.8 (printed pp. 169–170) partially retracts earlier air-dependence claims for the
  restricted low-coefficient regime (newer measurements show no significant pressure
  dependence there).
- Ch. 7.3's **"Well-Behaved-Basal" (WBB) model** (printed p. 272) states the author's own
  reading of the in-air free-fall data: attachment kinetics *does* depend on air pressure, and
  `sigma_0,prism(T)` in air differs "rather substantially" from the low-pressure value
  (Figure 7.24).

The digitized CAK curves come mostly from low-pressure VIG measurements; the solver grows
crystals at 1 atm. **Lands in:** a stated Phase 6 systematic ("CAK-in-air vs CAK-in-vacuum")
recorded in `libbrecht-parameters.md` alongside the existing crossing discrepancy; see also
exploration item 4.6 (a pressure sweep that *tests* this rather than merely stating it).
**LANDED 2026-07-26**: the pressure-dependence entry in `libbrecht-parameters.md`'s Open
questions no longer reads "answered at the model level" unqualified — it now carries the
monograph's own "somewhat sketchy assumption" and the WBB finding that substantial
`sigma_0,prism(T)` pressure changes are required in any future model. The pressure sweep
remains an exploration candidate, not a Phase 6 deliverable.

### 2.3 Latent heating has a cited magnitude and a one-line correction

The current honest-limits list says latent heat is ignored, "known, acceptable." The source
quantifies it (printed pp. 96–98 / pdf 97–99): in the diffusion-limited regime,
`v_n ∝ sigma_inf / (1 + chi_0)` with `chi_0 ≈ 0.8` at −1 °C, `≈ 0.4` at −10 °C, falling with
temperature, and roughly `chi_0 ∝ 1/P`. Ignoring heating therefore overestimates
diffusion-limited growth by 40–80 % on the warm side — and the source provides the first-order
fix *inside the existing model*: rescale `sigma_inf → sigma_inf/(1 + chi_0)`. Kinetics-limited
runs (the current low-supersaturation gates) are essentially unaffected.
**Lands in:** `chi_0(T)` anchors in `libbrecht-parameters.md`; a labeled-correction decision on
the Phase 6 protocol-freeze list; a sentence upgrade in attachment-kinetics §5.
**LANDED 2026-07-26**: anchors, the `sigma_inf/(1 + chi_0)` correction and the `chi_0 ~ P^-1`
scaling are `libbrecht-parameters.md` §7; the honest-limits entry in `attachment-kinetics.md`
§5 now carries the magnitude instead of only the omission. The labelled-correction decision
remains open and belongs to the Phase 6 WP0 freeze.

### 2.4 Far field: monopole matching, and an exact formula for the finite-shell bias

Every canonical Libbrecht CA extends the outer boundary to infinity by **monopole matching**:
the shell value is set each growth step to
`sigma_inf − (dV/dt) / (4π · rho_far · X_0 · v_kin)`, with `dV/dt` from the growth ledger
(1D printed pp. 189–190; 2D Eq. 5.27, printed p. 196; 3D Eqs. 5.30–5.31, printed p. 207). Our
fixed-σ Dirichlet shell holds `sigma_inf` at finite radius, which over-supplies vapor
increasingly as the crystal grows — a bias the 65 % domain-contact guard does not address.
The finite-outer-boundary spherical solution (Eqs. 3.33–3.36, printed p. 100) gives this bias
in closed form, so it can be *quantified*, not just guarded against.
**Lands in:** a candidate third far-field condition (`monopole-matched`, recorded in checkpoint
metadata like the other two) via ADR when Phase 6 prep starts; an analytic bias estimate in the
Phase 6 domain-convergence work. Not currently mentioned anywhere in the repo.

### 2.5 Registered `sigma_infinity = 0.002` leaves the cold half of the sweep in a dead-facet regime

**Flag: own analysis, derived from the project's own digitized table — not a source claim.**
At −15 °C, `sigma_0_basal/sigma_inf = 12` and `sigma_0_prism/sigma_inf = 16`, giving facet
attachment coefficients of order `6e−6` and `1e−7` against rough-site coefficients of 1. Both
facet families are effectively dead there; habit will be decided by rough-site geometry, step
flow, and hole-filling rather than by the CAK crossing the sweep is designed to probe. At
−5 °C the same `sigma_inf` is well placed (`sigma_0/sigma_inf ≈ 1.4–3.5`, coefficients
0.03–0.05). The monograph's −15 °C measurements (Fig. 4.4, printed p. 144) span
`sigma_surf ≈ 0.3–3 %`. A "no column at −15 °C" diagnostic outcome is therefore partially
predictable from regime placement alone. The registered protocols are pre-registered and are
not to be touched mid-flight; this item informs *interpretation* now and *protocol design*
later (per-temperature `sigma_inf` scaled to `sigma_0(T)`, or a second registered point near
0.01–0.02, in any future v5). **Lands in:** Phase 4 pass B reading notes; future protocol ADR.

### 2.6 Two interpretation caveats for the hollowing gate (pass B), both measured by the source

- **The bare facet-kink model overpredicts basal hollowing.** Figure 5.25 (printed pp. 202–203)
  and [2015Lib1]: the model could not reproduce a solid blocky prism at −10 °C without adding
  fast surface diffusion; the real crystal had essentially no basal hollowing. A pass B
  hollowing positive can therefore be a low-surface-diffusion numerics artifact.
- **Extreme, thin-walled hollowness is ESI territory.** The robust sheath-like hollow columns
  near −5 °C are attributed to the edge-sharpening instability (printed pp. 154–156), which
  no-SDAK LK cannot express. Mild hollowing without it is plausible (Berg effect + the
  exponential); dramatic hollowing is not expected.

Both directions belong in the Phase 4 plan's pass B reading notes *before* the run. Related:
the no-SDAK CAK inputs cannot produce Nakaya's plates-at-−15 °C by construction — the SDAK
prism dip is what produces them (Figs. 4.12–4.13, printed pp. 152–153). The charter's "does the
large-facet crossing alone produce any reversal?" framing already accepts this; stated here
with the mechanism so nobody reads a cold-side pass B miss as a solver defect.

### 2.7 Cheap Gibbs–Thomson guard against one-pixel-plate artifacts

The source's recipe (printed pp. 198–199): apply `v_n = alphaHK · v_kin · (sigma_b − d_sv·κ)`
in the growth step only — never in the field solve, where the effect is negligible — with the
curvature `κ` crudely estimated from outermost-terrace widths. It exists specifically to
suppress unphysical one-pixel-thick plates in low-σ/high-coefficient corners (Figure 5.22).
Phase 4 correctly keeps this out of scope; reviewers of pass B captures should treat any
one-pixel-thick structure as a red flag with this named cause. **Lands in:** pass B reading
notes now; a labeled GT dial via ADR when SDAK-era work starts.

### 2.8 When SDAK lands, build the ±L_i machinery once

Chapter 5.4 (printed pp. 205–206, 210–211) attaches six signed terrace lengths `±L_i` to each
boundary pixel and derives **four** physics capabilities from that one structure: facet width
(SDAK/ESI), curvature estimate (Gibbs–Thomson), upper-terrace identification, and kink
proximity (fast-surface-diffusion). ADR 0009 already names nonlocal signed terrace distances as
the known limitation of nearest-neighbor classification. Recommendation: the SDAK plan should
adopt `±L_i` as its design backbone rather than a bespoke width query.

### 2.9 Phase 6 held-out targets: the e-needle morphology diagram

Chapter 8.4's "robust features" (printed pp. 301–302) is effectively a published acceptance
suite — distinctive morphologies at characterized (T, σ) with the author's statement that
models failing them are "clearly incomplete or incorrect": complexity ordering with σ, simple
stars at (−14 °C, 32 %), fishbones near −5 °C, conical plate growth. Chapter 8.6 adds a fully
quantitative thin-plate-on-needle case study. **Lands in:** name these datasets explicitly in
the Phase 6 protocol-freeze held-out list.

### 2.10 Smaller items

- **Ventilation** (printed p. 110): falling crystals get a diffusion enhancement
  `f_v ≈ 1 + 0.1·Re` (Re < 1). Not modeled; belongs in attachment-kinetics §5's honest-limits
  list because the product narrative is a *falling* crystal.
- **Event-limited stepping is the source's canonical growth step** (one pixel per step via the
  minimum fill time; Eqs. 5.18–5.21 printed p. 194, Eq. 5.36 printed p. 209). Strengthens the
  already-documented v5 candidate's citation when its ADR is written.
- **Intrinsic vicinal anisotropy** (printed pp. 194–195): facet-kink CA growth rates on vicinal
  surfaces carry ~10 % anisotropic error (up to ~40 % without geometry factors), uncorrectable
  by resolution. Facet rates are exact; hollow-wall and branch shapes inherit the error. Belongs
  in the known-limitations register.
- **Convergence-tolerance bias is calibratable** (printed p. 188): iterating to a residual
  tolerance systematically overestimates growth, measured in [2013Lib1] as a function of the
  tolerance. Current dual-criterion convergence proves self-consistency, not absolute accuracy —
  see exploration item 4.1.

## 3. Third-method assessment

**No third production path.** Phase-field and front-tracking are unproven for ice's kinetic
anisotropy per the source's own comparison; phase-field stays where the charter has it (the
post-v1 offline "bake" candidate, §1.6/§2.6). Front-tracking's one genuine advantage — shallow
concave growth (Figure 5.21, printed pp. 197–198) — does not justify a third operator.

**Yes to a third validation-tier solver:** a 1D spherical `LibbrechtKinetics` reference solver
(a few hundred lines, reusing `core`'s alphaHK / `v_kin` / `X_0`), validated against the exact
analytic solutions: kinetics+diffusion (Eq. 3.19), finite outer boundary (Eqs. 3.33–3.36),
optionally heating (Eq. 3.26). This gives the project its only *absolute* accuracy anchor —
measuring Robin-discretization error, convergence-tolerance bias, and finite-shell bias against
truth rather than against self-consistency. Slots into Phase 6's numerical-verification
controls. An optional 2D cylindrically-symmetric variant is the geometry Libbrecht used for all
his quantitative model-vs-experiment comparisons (printed pp. 190–203) and would be the natural
harness for e-needle case-study replication.

## 4. Beyond the book — exploration candidates

Added 2026-07-16 at the maker's request: ideas that are *not* in the monograph (or only
gestured at), assessed for scientific value, cost, and fit. The book is a source, not an
oracle — §2.2 above is an example of the book disagreeing with itself; where that happens the
project's move is to carry both readings as systematics or, better, to design a run that
discriminates them.

### Tier A — high value, near-term, fits existing phases

**4.1 Simulate the experiments, not just the diagram ("instrument-level validation").**
Reproduce Fig. 4.4-class data in-silico: put a broad facet in a VIG-like low-pressure geometry,
sweep `sigma_surf`, and check the solver's `v_n(sigma_surf)` against the measured exponential
knee (P1 data). Then replicate one e-needle case study (Ch. 8.6) with the 2D/1D reference
solver. Why: this validates the *operator* against instrument data years before Phase 6's
Nakaya comparison, on the source's strongest evidence class — and a failure localizes to the
operator, not to the parameter table. Cost: low once the 1D/2D oracle exists (§3). Risk: low.
Slot: Phase 6 prep; could start any time after Phase 4.

**4.2 The morphology diagram with error bars (ensemble uncertainty propagation).**
The table's ±25 % digitization bands are currently a caveat sentence. Make them a computation:
Latin-hypercube (or even simple corner) draws over the σ₀/A bands per sweep point, run the
dev-resolution solver, and report *morphology probability* per (T, σ) cell instead of a point
verdict — plus the explicit identification of which Nakaya regions are robust to input
uncertainty and which are undetermined at current measurement precision. Nobody has published a
snow-crystal morphology diagram with propagated input uncertainty, including Libbrecht. This is
the single most on-brand idea available: it converts epistemic honesty from prose into a
figure. Cost: moderate (ensemble runner + seeds discipline; dev-res runs are cheap). Risk: low.
Slot: Phase 6, as a first-class deliverable next to the point-estimate diagram.

**4.3 A regime atlas (dimensionless-group precomputation).**
For any (T, `sigma_inf`, P, crystal size R), four cheap numbers determine the physics regime
before any run: `sigma_0/sigma_inf` (facet aliveness), `X_0/R` vs the facet coefficient
(kinetics- vs diffusion-limited, the monograph's Eq. 3.18 comparison), the Péclet bound
(already computed), and `alphaHK·dx/X_0` (Robin stiffness). Precompute and publish the atlas as
a chart + a `core` function. Uses: (a) principled protocol design — the §2.5 dead-facet finding
would have been visible in one glance; (b) run metadata («this run was kinetics-limited»);
(c) later, a UI overlay showing the user where their journey sits in regime space, which is
exactly the explanatory-instrument identity. Cost: days, no solver changes. Risk: none.
Slot: immediately useful; formalize during Phase 6 protocol design.

**4.4 Ingredient-attribution ablation matrix.**
The LK operator contains labeled phenomenological ingredients (hole-filling, the inhibited
`[10]` class, rough-site unit coefficient) alongside the parameterized physics. Run registered
diagnostic sweeps with each ingredient toggled and measure the morphology deltas — i.e.,
*attribute* each emergent feature to an ingredient. Directly serves §2.5/§2.6 interpretation
(is cold-side habit coming from hole-filling rather than kinetics?), and produces the honest
sentence the UI will eventually need: "this hollow came from the field, not from a rule."
Cost: low (flags already mostly exist as options; runs at dev res). Risk: none — diagnostic
only, never gate evidence. Slot: Phase 4 aftermath / Phase 6 prep.

**4.5 Growth-rate trajectories as first-class evidence.**
Current gates are morphology-heavy; the source's strongest discriminator is rates. Record
R(t)/thickness(t) against physical time as standard run outputs and compare against the
analytic spherical/cylindrical envelopes (and later, lab data). A solver that grows the right
shape at wildly wrong rates is wrong; today nothing would notice. Cost: metrics + CSV only.
Risk: none. Slot: could join Phase 4 pass B outputs as diagnostics; gate-grade in Phase 6.

**4.6 The pressure axis as the cheapest independent validation — and a designed discriminator
for §2.2.** The model's pressure dependence is parameter-free (`D ∝ 1/P`, giving the printed
scaling relation, pp. 200–201): halving pressure should double sizes at halved times *if*
attachment kinetics are pressure-independent (CAK). The WBB reading (§2.2) predicts specific
departures on the prism facet. A registered pressure sweep at fixed (T, σ) therefore
discriminates CAK vs WBB with data the model already contains — an actual experiment the
simulator can run, rather than a systematic it must carry. Compare qualitatively against Gonda
1976 morphology-vs-pressure observations (cited printed p. 156, 200). Cost: low (P is already
an input). Risk: interpretation only. Slot: Phase 6 held-out block.

### Tier B — medium-term, real scientific upside

**4.7 GG↔LK bridge calibration: give G-G's knobs physical meaning.**
For each (T, σ) point, search for the `ggThresh*` parameter vector whose morphology best
matches the LK output (metrics-space distance). If the mapping is smooth, two things follow:
(a) the interactive GPU path could run cheap G-G dynamics with LK-calibrated knobs while the
LK oracle validates — relevant to Phase 5 budget choices; (b) scientifically, it answers the
question the charter says G-G leaves "unaskable": what do the thresholds *mean* in (T, σ)
space? A negative result (no consistent mapping exists) is equally load-bearing: it would show
the two operators occupy different universality classes, which bounds what the G-G control can
ever tell us. Cost: moderate (an optimizer over the sweep harness). Risk: medium — the mapping
may be ill-posed; pre-register the metric distance to avoid tuning-to-taste. Slot: post-Phase 5
(needs cheap sweeps), before or during Phase 6.

**4.8 History identifiability — is the crystal actually a readable diary?**
The product's core claim is that morphology records history. Make it falsifiable: generate N
distinct environmental histories, grow ensembles, and test whether a classifier over the
morphology metrics (or over shape descriptors, see 4.9) can recover which history produced
which crystal — and where it *cannot* (degenerate histories producing indistinguishable
crystals). Quantify hysteresis: same endpoint conditions via different paths → measurably
different crystals? The timeline plumbing Phase 4 builds is exactly the needed instrument.
Why it matters: if large history-classes are degenerate, the Explore-mode narrative needs
honest wording; if they are separable, that is a genuinely novel quantitative result about
snow-crystal path dependence. Cost: moderate. Risk: low. Slot: after Phase 4 timeline lands.

**4.9 Continuous morphology-space embedding.**
Categorical plate/column/hollowness metrics under-resolve the menagerie (ridges, sectored
plates, sheaths, tridents — printed pp. 111–133). Compute rotation-invariant shape descriptors
(e.g., cylindrical-harmonic or per-slice Fourier spectra of the occupancy field) and embed runs
in a continuous morphology space; the Nakaya comparison then becomes trajectory geometry
rather than category counting, and "how far apart are these two crystals" becomes a number the
comparison tooling and the identifiability study (4.8) can share. Keep the categorical gates —
this augments, never replaces. Cost: moderate, pure post-processing. Risk: interpretability.
Slot: Phase 6 tooling.

**4.10 Multipole far-field matching (the source explicitly declines to elaborate).**
Monopole matching (§2.4) is the book's stopping point ("one can imagine extending this to
higher-order multipole matching, but I will not elaborate," printed p. 197). A growing plate or
column has a strong quadrupole moment; matching one or two more multipole terms at the shell
could shrink sweep domains substantially at fixed accuracy — directly multiplying Phase 6
throughput on the 4080. Validate against the 1D/2D oracles and a big-domain reference run.
Cost: moderate numerics work. Risk: medium (stability of the moment estimates). Slot: Phase 5/6
performance work.

### Tier C — long-horizon / research-grade, gated and labeled

**4.11 Physically stochastic terrace nucleation (a labeled alternative to the noise dial).**
At the gate's low supersaturations, facet growth is *physically* a sequence of discrete,
Poisson-distributed nucleation events, not a smooth velocity — the deterministic fill model
averages over exactly the fluctuations that break real sixfold symmetry. A gated LK mode could
sample nucleation events from the same `sigma_0/A` parameters (rates are calculable from
terrace-nucleation theory) using the counter PRNG, staying replayable. Predicts asymmetry
statistics and growth-rate fluctuation spectra — quantities interferometry can measure — rather
than injecting phenomenological noise. This is the one idea here that would constitute new
*physics modeling* beyond the book's CA program. Cost/risk: high; it touches the seam, so it
needs its own ADR, protocol, and control comparisons. Slot: v2-era research, never a rescue for
a failing gate.

**4.12 Sublimation as a timeline event class.**
Journeys through sub-saturated air round and erode crystals (printed pp. 133–134); the model's
attachment permanence forbids this, so a whole class of natural histories (and the "negative
crystal" phenomenology) is unreachable. Breaking permanence is a deep invariant change —
mass bookkeeping, gate contracts, checkpoint semantics — so this is a v2/Phase 7+ decision at
the earliest, recorded here so the limitation is deliberate rather than forgotten.

**4.13 Opportunistic lab-video growth rates.**
The archived snowcrystals.com movies (SHA-pinned, indexed) have known frame timing and stated
conditions for some sequences; extracting coarse R(t) slopes would give free, semi-independent
rate anchors for 4.5. Strictly opportunistic: unknown chamber corrections mean Evidence stays
qualitative; never gate material.

## 5. Suggested sequencing

1. Now (documentation-only): §2.1 table corrections; §2.2/§2.3 systematics entries; pass B
   reading notes (§2.5–§2.7) into the Phase 4 plan via its coordinator.
2. Phase 6 prep: the 1D spherical oracle (§3), regime atlas (4.3), instrument-level validation
   (4.1) — targets now cataloged in
   [research/lab-validation-dataset.md](../research/lab-validation-dataset.md) — and the
   monopole far-field ADR (§2.4).
3. Phase 6 proper: ensemble error-bar diagram (4.2), pressure-axis discriminator (4.6),
   rate trajectories as gate-grade evidence (4.5), e-needle held-out targets (§2.9).
4. Post-v1 research menu: 4.7–4.13 as separately gated efforts.

## 6. Second-order findings from the lab-data extraction (added 2026-07-16)

Transcribing the Figure 8.16 grid tile-by-tile and curating the case studies changed some of the
weightings above. Dataset: [research/lab-validation-dataset.md](../research/lab-validation-dataset.md).

### 6.1 Compare boundary curves, not tiles

The grid's information is not really 97 shapes — it is the **onset boundaries** between shapes:
at each temperature, σ-thresholds for facet→hollowing (e.g. −5 °C: between 4 % and 8 %, Fig.
4.20), hollowing→branching, branching→sidebranching, and the habit-flip temperatures at fixed σ
(in the 8 % row as transcribed: plates at −0.5/−1, columns −2…−12, plates −13…−15, columns
−16…−21). Extracting `sigma_onset(T)` curves and comparing the **model's** onset curves against
them is robust to exactly the things the tiles cannot give us (per-tile scale, growth time) and
degrades gracefully: the σ ladder is ×2-spaced, so onsets carry half-octave resolution — right
for order/trend tests, never percent-level claims. Two bonuses: (a) the e-needle diagram is
measured in the same geometry class our comparisons would run in, unlike the classical Nakaya
diagram's free-fall/natural crystals — its boundaries sit at visibly different (T, σ) than the
textbook version, and comparing against the wrong diagram would manufacture false disagreement;
(b) boundary extraction is exactly the sweep-classification machinery Phase 6 needs anyway.
**Proposal: make onset-curve comparison the primary consumption mode of the grid**, with
tile-by-tile morphology as illustration only.

### 6.2 Induced sidebranching reframes the noise dial — and elevates the timeline

The grid's high-σ tiles show ferns with dense, largely six-fold-coordinated sidebranches. The
source's stated mechanism (Fig. 3.57, printed p. 128): **coordinated sidebranching is driven by
environmental transients — induced sidebranching — not by independent per-arm stochastic
noise**, in the lab and in nature; PoP crystals under genuinely constant conditions do *not*
spontaneously sidebranch (Fig. 9.22 caption). Consequences: our per-cell noise dial models the
*asymmetric* component of sidebranching, while the *symmetric* component that makes natural
stellar crystals look like snowflakes is, per the source, a **timeline phenomenon** — small
σ(t)/T(t) wiggles hitting all six arms simultaneously. That is a scientific reframing of the
product's core feature: the timeline is not UX sugar on top of the physics — it is the
sidebranching mechanism. **Testable with Phase 4 plumbing:** drive a registered σ-wiggle
history and check that sidebranches sprout simultaneously on all six arms (D6h-symmetric
deltas, noise off), compare against Fig. 3.57/9.28. This slots into Part 4 as a tier-A
addition and gives exploration item 4.8 (history identifiability) a sharper first experiment.

### 6.3 The 2D cylindrical oracle is promoted from "optional variant" to "dataset unlock"

100+ of the 122 entries are e-needle geometry. In 3D at `dx = 0.35 µm`, a 30 µm-diameter,
mm-scale needle is domain-infeasible on CPU — but the source's own quantitative comparisons
(Fig. 5.24, the §8.6 series) were done with the **2D cylindrically symmetric** model, which the
book argues is a tolerably good representation for exactly these forms (plates, columns, hollow
columns, plates-on-needles; printed pp. 190–191). §3's reference-solver recommendation should
therefore be read as: 1D spherical for analytic anchoring, **2D cylindrical for consuming the
e-needle dataset** — with the 3D solver reserved for the genuinely 3D targets (stars,
branching, ridges). This is a materially stronger case for the 2D tier than §3 originally made.

### 6.4 Prefer scale-free anisotropy observables; absolute rates only from time series

Per-tile scale and time are unrecoverable in the grid (stated crop/zoom per tile), so the
robust per-tile observables are **scale-free**: habit class, aspect ratio at matched size, cone
angle, openness/skeletal character. This is also the witness-surface logic the source itself
uses when σ is uncertain (printed pp. 163, 271–272): growth *ratios* cancel chamber-σ
systematics to first order. Absolute-rate comparisons belong exclusively to the grade-A time
series (Figs. 8.21/8.24/8.26, 8.29, 8.17, 7.21, 3.20), whose early frames (tens of µm) are
also the only states inside realistic domain budgets — the tile endpoint states (0.5–1.5 mm)
exceed even the bake budget. Corollary: whether habit class stabilizes early enough for
matched-small-size comparison is itself a checkable model claim (size-dependent habit is
already a charter held-out observable).

### 6.5 A column-seed option is the single highest-leverage solver unlock for validation

Nearly the whole dataset needs an elongated seed. The canonical 19-site seed is pinned and
gate-protected; an *exploratory* seed class (radius/height-parameterized column) unlocks the
grid and the §8.6 series for diagnostic comparison, with ADR + registration required only when
a comparison is to be accepted. Priority-wise this now looks like the cheapest big win in the
whole validation program.

### 6.6 CAK_A1's warm side is expected to miss the lab — record it before pass B

The warm-plate evidence (Fig. 4.8's blocky plate at −0.5 °C with `sigma_surf ≈ 0.1 % ≫
sigma_0`; the grid's −0.5/−1 °C plate caps at 8 %) is attributed by the source to
`A_prism < 1` (frustrated QLL kinetics), **not** to the nucleation barrier. Registered Phase 4
pass B runs `CAK_A1` (A ≡ 1 on both facets), which cannot express that mechanism at all — so
warm-side disagreement with these lab entries is *expected by construction* and should be
pre-recorded as such, exactly like the no-SDAK cold-side expectation (§2.6). Longer-term, any
sweep that wants the warm boundary right needs the full `CAK` set (digitized `A(T)` included).

### 6.7 The model needs a validity boundary, and the grid shows where

The three absent tiles are data: −0.5 °C at 128 % is absent because the crystals **melted**.
The model has no melting and would happily grow a fiction there. The regime atlas (4.3) gains a
melting-proximity flag (warm T + σ far above water saturation), and the case for eventually
adopting a cited `sigma_water(T)` ceiling for *product* timelines sharpens: the grid's 32–128 %
rows are diffusion-chamber conditions, mostly far above water saturation, i.e. outside the
natural-cloud envelope the product narrates. (The known fit-difference defect near −1 °C in
`libbrecht-parameters.md` stands; a ceiling needs a cited interpolation first.)

## 7. Discussion log

- **2026-07-16 — file created.** Part 2–3 findings from the monograph review session; Part 4
  added at the maker's request for beyond-the-book exploration candidates. Open for discussion;
  items graduate to ADRs/plans individually.
- **2026-07-16 — lab validation dataset extracted** (maker directive: the source library is the
  only lab data available for validating the models). 122 entries — the full Figure 8.16
  e-needle morphology grid (~97 condition-labeled tiles, −0.5…−21 °C × 8…128 %, labels visually
  transcribed) plus 21 curated case studies (9 grade-A quantitative rate/series targets,
  incl. the free-fall flagship Fig. 7.21 and both v_n(sigma_surf) kinetics curves). Index:
  [research/lab-validation-dataset.md](../research/lab-validation-dataset.md); machine-readable
  [research/lab-validation-dataset.jsonl](../research/lab-validation-dataset.jsonl). Directly
  serves §4.1 (instrument-level validation), §4.5 (rate trajectories), §4.6 (pressure axis),
  and §2.9 (e-needle held-out targets). Feasibility classes flag what needs a column seed,
  what is substrate-bound, and what no-SDAK runs are expected to miss.
- **2026-07-16 — Part 6 added** after the maker asked what the lab extraction itself changed:
  onset-curve comparison as the grid's primary consumption mode; induced sidebranching
  reframing the noise dial and elevating the timeline to a physics mechanism; the 2D
  cylindrical oracle promoted to dataset-unlock status; scale-free anisotropy observables
  first; the column-seed option as the highest-leverage validation unlock; the CAK_A1
  warm-side expected miss; and a melting-proximity validity flag.
