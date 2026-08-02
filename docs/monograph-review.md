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
  (printed pp. 183–185) concludes cellular automata are best suited to facet-dominated growth. It
  reports that the phase-field snow-crystal work it reviewed used weak kinetic anisotropy and
  Péclet numbers above the ice-growth regime (printed p. 179), and that the front-tracking work in
  its reviewed set had not demonstrated the deep kinetic-anisotropy cusps ice needs (printed
  pp. 183–184). Those are source-scoped assessments, not current universal literature claims.
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
- **Lattice spacing is consistent with the source's heuristic, not thereby converged.** The source
  recommends a grid of a few times the kinetic length `X_0` and reports no gain below `X_0` for its
  scheme (printed pp. 191, 199–200); under the project's P2 exact-one-atmosphere closure, the
  registered `dx = 0.35 µm ≈ 2.4·X_0` sits inside that guidance. The source describes air under
  typical atmospheric conditions rather than pinning this row to exactly 101325 Pa. This
  dimensional comparison does not establish grid convergence for this solver.
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
  recorded in `libbrecht-parameters.md` alongside the existing crossing discrepancy. Exploration
  item 4.6 now distinguishes a current-model transport diagnostic from a future matched test of
  pressure-dependent attachment kinetics.
**LANDED 2026-07-26**: the pressure-dependence entry in `libbrecht-parameters.md`'s Open
questions no longer reads "answered at the model level" unqualified — it now carries the
monograph's own "somewhat sketchy assumption" and the WBB finding that substantial
`sigma_0,prism(T)` pressure changes are required in any future model. The pressure sweep
is a charter-required Phase 6 held-out obligation, not an optional exploration. No matched
pressure target has yet passed source/geometry audit, so a simulator-only pressure sweep is a
diagnostic prediction and cannot close that obligation by itself.

### 2.3 Latent heating has a cited magnitude and a one-line correction

The then-current honest-limits list said latent heat was ignored, "known, acceptable." The source
quantifies it (printed pp. 96–98 / pdf 97–99): in the diffusion-limited regime,
`v_n ∝ sigma_inf / (1 + chi_0)` with `chi_0 ≈ 0.8` at −1 °C, `≈ 0.4` at −10 °C, falling with
temperature, and roughly `chi_0 ∝ 1/P`. Within the source's diffusion-limited approximation,
omitting heating changes the rate by the reported `1/(1 + chi_0)` factor, and the source supplies
the corresponding first-order correction: rescale `sigma_inf → sigma_inf/(1 + chi_0)`. Whether an
executed project run is sufficiently kinetics-limited for the correction to be negligible requires
a recorded dimensionless or forward comparison; that has not been established by this review note.
**Lands in:** `chi_0(T)` anchors in `libbrecht-parameters.md`; a labeled-correction decision on
the Phase 6 protocol-freeze list; a sentence upgrade in attachment-kinetics §5.
**LANDED 2026-07-26**: anchors, the `sigma_inf/(1 + chi_0)` correction and the `chi_0 ~ P^-1`
scaling are `libbrecht-parameters.md` §7; the honest-limits entry in `attachment-kinetics.md`
§5 now carries the magnitude instead of only the omission. The labelled-correction decision
remains open and belongs to the Phase 6 WP0 freeze.

### 2.4 Far field: monopole matching, and an exact formula for the finite-shell bias

The canonical CAs presented in this monograph extend the outer boundary by **monopole matching**:
the shell value is set each growth step to
`sigma_inf − (dV/dt) / (4π · rho_far · X_0 · v_kin)`, with `dV/dt` from the growth ledger
(1D printed pp. 189–190; 2D Eq. 5.27, printed p. 196; 3D Eqs. 5.30–5.31, printed p. 207). Our
fixed-σ Dirichlet shell holds `sigma_inf` at finite radius, which over-supplies vapor
increasingly as the crystal grows — a bias the 65 % domain-contact guard does not address.
The finite-outer-boundary spherical solution (Eqs. 3.33–3.36, printed p. 100) gives this bias
in closed form, so it can be *quantified*, not just guarded against.
**Historical proposal, now landed:** `monopole-matched` is implemented, checkpoint-recorded and
registered for Phase 6 by decisions 0024/0027; the analytic bias estimate informs the current
domain-convergence work. This paragraph records why that change was needed, not a future candidate.

### 2.5 Registered `sigma_infinity = 0.002` gives weak-facet values in a far-field proxy

**Flag: own analysis, derived from the project's own digitized table — not a source claim.**
At −15 °C, `sigma_0_basal/sigma_inf = 12` and `sigma_0_prism/sigma_inf = 16`, giving facet
attachment coefficients of order `6e−6` and `1e−7` against rough-site coefficients of 1. In this
far-field proxy both broad facets are weakly attaching, so rough-site geometry, step flow and
hole-filling may dominate the executed outcome; the proxy does not determine the coupled habit. At
−5 °C the same `sigma_inf` is well placed (`sigma_0/sigma_inf ≈ 1.4–3.5`, coefficients
0.03–0.05). The monograph's −15 °C Figure 4.4 plots source-model-reconstructed/corrected
`sigma_surf ≈ 0.3–3 %` against measured growth velocities; the surface-field axis is not a
direct measurement. A "no column at −15 °C" outcome is therefore compatible with the proxy,
not predicted from it alone. The registered protocols are pre-registered and are
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
the monograph's M1/M2 account attributes the extreme thin-plate branch near −15 °C to the SDAK
prism dip (Figs. 4.12–4.13, printed pp. 152–153), so a no-SDAK miss there is consistent with that
source model's expectation. It is **not** impossible “by construction” in this coupled solver:
habit depends on the complete attachment coefficient, diffusion-determined surface field, size,
  and evolving geometry, and the former `sigma_0`-crossing bound is retracted. The charter's current
  question—whether the full implemented broad-facet attachment parameterization with recorded P1/P2
  provenance produces any habit reversal—remains a forward experiment whose answer comes from the
  registered run, not from this interpretation note.

### 2.7 Cheap Gibbs–Thomson guard against one-pixel-plate artifacts

The source's recipe (printed pp. 198–199) applies
`v_n = alphaHK · v_kin · (sigma_b − d_sv·κ)` in the growth step only and omits the correction
from its field solve under the source's stated negligible-effect approximation; this project has
not quantified that approximation for its lattice. The source crudely estimates curvature `κ` from
outermost-terrace widths and uses the correction to suppress unphysical one-pixel-thick plates in
low-σ/high-coefficient corners (Figure 5.22). Phase 4 kept this outside its scope. A one-pixel-thick
structure is a red flag consistent with missing Gibbs–Thomson suppression, but discretization or
implementation defects can produce the same symptom, so it is an investigation trigger rather than
a unique causal diagnosis. **Lands in:** pass B reading notes now; a labeled GT dial via ADR when
SDAK-era work starts.

### 2.8 When SDAK lands, build the ±L_i machinery once

Chapter 5.4 (printed pp. 205–206, 210–211) attaches six signed terrace lengths `±L_i` to each
boundary pixel and derives **four** physics capabilities from that one structure: facet width
(SDAK/ESI), curvature estimate (Gibbs–Thomson), upper-terrace identification, and kink
proximity (fast-surface-diffusion). ADR 0009 already names nonlocal signed terrace distances as
the known limitation of nearest-neighbor classification. Recommendation: the SDAK plan should
adopt `±L_i` as its design backbone rather than a bespoke width query.

### 2.9 In-sample source reference: the e-needle morphology diagram

Chapter 8.4's "robust features" (printed pp. 301–302) supplies distinctive source morphologies at
characterized (T, σ): complexity ordering with σ, simple stars at (−14 °C, 32 %), fishbones near
−5 °C, and conical plate growth. Chapter 8.6 adds a quantitative thin-plate-on-needle case study.
These panels informed the M1/P3 parameterization and use an electric-needle geometry the current
solver does not model, so they are **in-sample, geometry-mismatched references**, not held-out gate
targets. They remain useful for blind morphology reconnaissance. The eventual held-out arm must come
from a source lock whose selected entry is explicitly `passEligible=true`; the current audit has none.

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
  tolerance. Current dual-criterion convergence checks discrete self-consistency, not absolute accuracy —
  see exploration item 4.1.

## 3. Third-method assessment

**No third production path from this review.** The phase-field and front-tracking work assessed by
the monograph did not establish ice's required kinetic anisotropy; phase-field stays where the charter has it (the
post-v1 offline "bake" candidate, §1.6/§2.6). Front-tracking's one genuine advantage — shallow
concave growth (Figure 5.21, printed pp. 197–198) — does not justify a third operator.

**The proposed third numerical-verification solver has landed:** `solver-cpu/src/spherical-reference.ts`
implements the 1D spherical `LibbrechtKinetics` reference and is tested against analytic solutions
of the same idealized boundary-value problem for kinetics+diffusion (Eq. 3.19) and finite outer
boundary behavior (Eqs. 3.33–3.36). It measures implementation and discretization error for that
BVP; agreement is not physical absolute accuracy or independent validation of the parameterization.
Heating and an optional 2D cylindrically-symmetric variant remain future work. The latter is the geometry Libbrecht used for all
his quantitative model-vs-experiment comparisons (printed pp. 190–203) and would be the natural
harness for e-needle case-study replication.

## 4. Beyond the book — exploration candidates

Added 2026-07-16 at the maker's request: ideas that are *not* in the monograph (or only
gestured at), assessed for scientific value, cost, and fit. The book is a source, not an
oracle — §2.2 above is an example of the book disagreeing with itself; where that happens the
project's move is to carry both readings as systematics or, better, to design a run that
discriminates them.

### Tier A — high value, near-term, fits existing phases

**4.1 Simulate the experiments, not just the diagram (in-sample instrument check).**
Reproduce Fig. 4.4-class data in-silico: put a broad facet in a VIG-like low-pressure geometry,
sweep `sigma_surf`, and check the solver's `v_n(sigma_surf)` against measured velocities plotted
on the source-model-reconstructed/corrected surface-field axis. The knee/barrier is a source fit
(P2), not direct P1 parameter data. Then replicate one e-needle case study (Ch. 8.6) with the 2D/1D reference
solver. Why: this verifies the transcription and implementation against the same instrument data
from which the P2 source-fit parameter was inferred. It is an in-sample operator check, not independent
validation; a failure can localize an implementation/transcription problem, while agreement cannot
validate the parameterization that consumed the data. Cost: low once the 1D/2D oracle exists (§3).
Risk: low.
Slot: Phase 6 prep; could start any time after Phase 4.

**4.2 The morphology diagram with error bars (ensemble uncertainty propagation).**
The table's ±25 % digitization bands are currently a caveat sentence. Make them a computation:
Latin-hypercube (or even simple corner) samples over the σ₀/A bounds per sweep point, run the
dev-resolution solver, and report response frequency under the named sampling measure—not a
physical morphology probability unless a probability distribution is independently justified—plus
the explicit identification of which Nakaya regions are robust over the sampled uncertainty set
and which are undetermined at current measurement precision. The reviewed source set did
not contain a snow-crystal morphology diagram with this propagated input uncertainty; that is a
scoped, non-exhaustive literature observation, not a universal priority claim. The idea converts
epistemic honesty from prose into a figure. Cost: moderate (ensemble runner + seeds discipline;
dev-resolution runs are cheap). Risk: low.
Slot: Phase 6, as a first-class deliverable next to the point-estimate diagram.

**4.3 A regime atlas (dimensionless-group precomputation).**
For any (T, `sigma_inf`, P, crystal size R), four cheap numbers summarize an approximate regime
before any run: `sigma_0/sigma_inf` (a far-field facet-activity proxy), `X_0/R` vs the facet coefficient
(kinetics- vs diffusion-limited, the monograph's Eq. 3.18 comparison), the Péclet bound
(already computed), and `alphaHK·dx/X_0` (Robin stiffness). Precompute and publish the atlas as
a chart + a `core` function. Uses: (a) principled protocol design — the §2.5 far-field weak-facet proxy
  would have been visible in one glance; (b) run metadata labeled as a regime proxy rather than a
  measured local-field classification;
(c) later, a UI overlay showing the user where their journey sits in regime space, which is
exactly the explanatory-instrument identity. Cost: days, no solver changes. Risk: none.
Slot: immediately useful; formalize during Phase 6 protocol design.

**4.4 Ingredient-attribution ablation matrix.**
The LK operator contains labeled phenomenological ingredients (hole-filling, the inhibited
`[10]` class, rough-site unit coefficient) alongside the parameterized physics. Run registered
diagnostic sweeps with each ingredient toggled and measure the morphology deltas — i.e.,
estimate each feature's sensitivity to an ingredient within the registered ablation. Directly
serves §2.5/§2.6 interpretation
(is cold-side habit sensitive to hole-filling or kinetics?), and supports scoped UI wording such as
"removing this rule changed the registered hollowing metric by X." Interacting ablations do not
assign a unique cause.
Cost: low (flags already mostly exist as options; runs at dev res). Risk: none — diagnostic
only, never gate evidence. Slot: Phase 4 aftermath / Phase 6 prep.

**4.5 Growth-rate trajectories as first-class evidence.**
Current gates are morphology-heavy; the source's strongest discriminator is rates. Record
R(t)/thickness(t) against physical time as standard run outputs and compare against same-BVP
analytic spherical/cylindrical envelopes (and later, qualified lab data). This separates numerical
rate errors from morphology-only agreement; the analytic envelopes alone are not physical
validation. Cost: metrics + CSV only.
Risk: none. Slot: could join Phase 4 pass B outputs as diagnostics; gate-grade in Phase 6.

**4.6 The pressure axis as a transport diagnostic pending a matched validation target.** The
implemented pressure dependence is `D ∝ 1/P` (the printed transport scaling, pp. 200–201), so a
registered sweep can test the solver's diffusion/transport response under the explicit assumption
that attachment kinetics are pressure-independent. The current model cannot discriminate that
assumption from the WBB reading in §2.2, because it does not implement the WBB pressure dependence
of prism attachment kinetics; nor can pressure-dependent morphology establish an edge-sharpening
mechanism. Simulation output alone is not independent validation. Gonda's
morphology-vs-pressure observations (cited printed p. 156, 200) require exact primary-source,
geometry, temperature, supersaturation and uncertainty audit before any quantitative comparison.
Cost: low (P is already an input). Risk: interpretation only until that target qualifies. Slot:
Phase 6 held-out block.

### Tier B — medium-term, real scientific upside

**4.7 GG↔LK bridge calibration: fit a domain-scoped empirical relation.**
For each (T, σ) point, search for the `ggThresh*` parameter vector whose morphology best
matches the LK output (metrics-space distance). If the mapping is smooth over a registered domain,
the interactive GPU path could run cheap G-G dynamics with LK-referenced knobs while the LK oracle
remains the comparison path; the fitted map would give those thresholds an empirical meaning over
that domain. If no stable mapping is found, the supported conclusion is only that the sampled
operators could not be related under the registered metric and search, not that they belong to
different universality classes. Cost: moderate (an optimizer over the sweep harness). Risk: medium — the mapping
may be ill-posed; pre-register the metric distance to avoid tuning-to-taste. Slot: post-Phase 5
(needs cheap sweeps), before or during Phase 6.

**4.8 History identifiability — is the crystal actually a readable diary?**
The product's core claim is that morphology records history. Make it falsifiable: generate N
distinct environmental histories, grow ensembles, and test whether a classifier over the
morphology metrics (or over shape descriptors, see 4.9) can recover which history produced
which crystal — and where it *cannot* (degenerate histories producing indistinguishable
crystals). Quantify hysteresis: same endpoint conditions via different paths → measurably
different crystals? The timeline plumbing Phase 4 builds is exactly the needed instrument.
Why it matters: if large history classes are degenerate, the Explore-mode narrative needs
honest wording; if they are separable, that is a quantitative repository result about the executed
model's path dependence. Any scientific novelty claim would require a current systematic review and
external comparison. Cost: moderate. Risk: low. Slot: after Phase 4 timeline lands.

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
column can have non-spherical far-field moments; matching one or two more multipole terms at the shell
could shrink sweep domains if a registered comparison holds accuracy fixed — potentially increasing Phase 6
throughput on the 4080. Verify numerically against the 1D/2D references and a big-domain run.
Cost: moderate numerics work. Risk: medium (stability of the moment estimates). Slot: Phase 5/6
performance work.

### Tier C — long-horizon / research-grade, gated and labeled

**4.11 Physically stochastic terrace nucleation (a labeled alternative to the noise dial).**
The source's terrace-nucleation account motivates discrete stochastic nucleation at low
supersaturation rather than a purely smooth velocity. The deterministic fill model averages over
such events; this review has not established which fluctuations dominate real symmetry breaking. A gated LK mode could
sample nucleation events from the same `sigma_0/A` parameters (rates are calculable from
terrace-nucleation theory) using the counter PRNG, staying replayable. Predicts asymmetry
statistics and growth-rate fluctuation spectra — quantities interferometry can measure — rather
than injecting phenomenological noise. Among this note's candidates, this would extend the model's
physics beyond the book's deterministic CA program. Cost/risk: high; it touches the seam, so it
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
conditions for some sequences; extracting coarse R(t) slopes would give contextual same-source rate
references for 4.5. Strictly opportunistic: unknown chamber corrections and parameter-lineage overlap
keep the evidence qualitative and in-sample; never gate material.

## 5. Suggested sequencing

1. Now (documentation-only): §2.1 table corrections; §2.2/§2.3 systematics entries; pass B
   reading notes (§2.5–§2.7) into the Phase 4 plan via its coordinator.
2. Phase 6 prep: the 1D spherical reference (§3), regime atlas (4.3), in-sample instrument check
   (4.1) — targets now cataloged in
   [research/lab-validation-dataset.md](../research/lab-validation-dataset.md) — and the
   monopole far-field ADR (§2.4).
3. Phase 6 proper: ensemble error-bar diagram (4.2), pressure-axis discriminator (4.6), and rate
   trajectories only after a pass-eligible source lock. Use the e-needle material (§2.9) as
   in-sample, geometry-mismatched reconnaissance, never as the held-out arm.
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
them is less sensitive to the things the tiles do not give per crystal (scale and growth time) and
degrades gracefully: the σ ladder is ×2-spaced, so onsets carry half-octave resolution — right
for order/trend tests, never percent-level claims. Two bonuses: (a) the e-needle diagram provides
internally consistent source geometry, unlike the classical Nakaya diagram's free-fall/natural
crystals, but the current solver still does not model the electric needle. Any comparison remains
geometry-mismatched until a compatible seed/boundary protocol is implemented; its boundaries sit
at visibly different (T, σ) than the textbook version, and silently substituting one diagram for
the other would manufacture disagreement;
(b) boundary extraction is exactly the sweep-classification machinery Phase 6 needs anyway.
**Proposal: make onset-curve comparison the primary consumption mode of the grid**, with
tile-by-tile morphology as illustration only.

### 6.2 Induced sidebranching reframes the noise dial — and elevates the timeline

The grid's high-σ tiles show ferns with dense, largely six-fold-coordinated sidebranches. The
source attributes coordinated sidebranching to environmental transients (induced sidebranching)
rather than independent per-arm stochastic noise (Fig. 3.57, printed p. 128), and reports that its
PoP crystals under constant conditions do not spontaneously sidebranch (Fig. 9.22 caption). This
motivates, but does not establish for the project, a division in which per-cell noise probes
asymmetric variation while shared σ(t)/T(t) perturbations probe symmetric sidebranch timing.
**Testable with Phase 4 plumbing:** drive a registered σ-wiggle history and measure whether
sidebranch events are synchronized across the six arms (D6h-symmetric deltas, noise off), then
compare the registered observable against Fig. 3.57/9.28. This slots into Part 4 as a tier-A
addition and gives exploration item 4.8 (history identifiability) a sharper first experiment.

### 6.3 The 2D cylindrical oracle is promoted from optional variant to diagnostic bridge

100+ of the 122 entries are e-needle geometry. In 3D at `dx = 0.35 µm`, a 30 µm-diameter,
mm-scale needle exceeds the recorded CPU campaign budget — but the source's own quantitative comparisons
(Fig. 5.24, the §8.6 series) were done with the **2D cylindrically symmetric** model, which the
book argues is a tolerably good representation for exactly these forms (plates, columns, hollow
columns, plates-on-needles; printed pp. 190–191). §3's reference-solver recommendation should
therefore be read as: 1D spherical for numerical BVP checks, **2D cylindrical for in-sample,
geometry-closer e-needle diagnostics** — with the 3D solver reserved for genuinely 3D targets
(stars, branching, ridges). Neither tier turns the M1-informed source set into held-out evidence.

### 6.4 Prefer scale-free anisotropy observables; absolute rates only from time series

The source prints field-of-view widths and elapsed times for the Figure 8.16 panels, so scale and time
are not categorically unrecoverable. The varying crop/zoom, lack of a common per-crystal dimension,
electric-needle geometry, and ambiguous individual outlines still prevent a frozen matched-size or
absolute-rate target without a blind extraction protocol. The least assumption-heavy reconnaissance
observables are therefore **scale-free**: habit class, aspect ratio at a separately defined matched
size, cone angle, openness/skeletal character. This is also the witness-surface logic the source itself
uses when σ is uncertain (printed pp. 163, 271–272): growth *ratios* cancel chamber-σ
systematics to first order. Absolute-rate comparisons belong exclusively to the grade-A time
series (Figs. 8.21/8.24/8.26, 8.29, 8.17, 7.21, 3.20), whose early frames (tens of µm) are
also the identified states most plausibly inside current domain budgets. The printed tile widths
are fields of view, not established per-crystal endpoint dimensions, so they do not support the
former 0.5–1.5 mm endpoint-size or bake-budget inference. Corollary: whether habit class stabilizes early enough for
matched-small-size comparison is itself a checkable model claim (size-dependent habit is
already a charter held-out observable).

### 6.5 A column-seed option is a possible diagnostic unlock

Nearly the whole dataset needs an elongated seed. The canonical 19-site seed is pinned and
gate-protected; an *exploratory* seed class (radius/height-parameterized column) could make the grid
and §8.6 series less geometry-mismatched for diagnostic comparison. It still would not turn the
M1-informed e-needle corpus into held-out evidence, and any accepted comparison requires an ADR,
registration, and a pass-eligible source lock.

### 6.6 CAK_A1 omits the source's named warm-plate mechanism — record it before pass B

The warm-plate evidence (Fig. 4.8's blocky plate at −0.5 °C with `sigma_surf ≈ 0.1 % ≫
sigma_0`; the grid's −0.5/−1 °C plate caps at 8 %) is attributed by the source to
`A_prism < 1` (frustrated QLL kinetics), **not** to the nucleation barrier. Registered Phase 4
pass B runs `CAK_A1` (A ≡ 1 on both facets), so that named source mechanism is absent. This makes
warm-side disagreement unsurprising but does not make a particular morphology inevitable: the
coupled solver has other geometry and transport pathways. Record the missing mechanism before
interpreting the comparison. A later matched warm-boundary test should include the full `CAK` set
(digitized `A(T)` included); agreement would still be in-sample unless the target is independent.

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
- **2026-07-16 — lab validation dataset extracted** (historical maker directive then treated this
  source library as the available lab-data index; the later source audit found additional candidates
  and no current pass-eligible held-out target). The JSONL contains 122 ID-bearing entries:
  100 Figure 8.16 e-needle grid records (97 present condition-labeled tiles plus 3 explicit absent
  cells, −0.5…−21 °C × 8…128 %, labels visually transcribed), 21 curated case studies
  (9 grade-A quantitative rate/series targets, including the free-fall flagship Fig. 7.21 and both
  v_n(sigma_surf) kinetics curves), and 1 video index. One separate `dataset-status` line records
  `entry_count=122` and `passEligible=false`. Index:
  [research/lab-validation-dataset.md](../research/lab-validation-dataset.md); machine-readable
  [research/lab-validation-dataset.jsonl](../research/lab-validation-dataset.jsonl). It indexes
  possible in-sample transcription checks, rate/pressure reconnaissance, and the §2.9 e-needle
  references; it does not itself supply a held-out gate target. Feasibility classes flag what needs a column seed,
  what is substrate-bound, and what no-SDAK runs are expected to miss.
- **2026-07-16 — Part 6 added** after the maker asked what the lab extraction itself changed:
  onset-curve comparison as the grid's primary consumption mode; the source's induced-sidebranching
  account as a registered timeline probe rather than an established project mechanism; the 2D
  cylindrical reference as an in-sample diagnostic bridge; scale-free anisotropy observables
  first; the column-seed option as a comparison-geometry improvement; CAK_A1's omission of the
  source's named warm-plate mechanism; and a melting-proximity validity flag.
