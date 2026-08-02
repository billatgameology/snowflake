# Libbrecht parameters — the mapping layer

**Status: current authoritative mapping revision accepted 2026-08-02 by decision 0040; not yet
frozen for R15.** Extracted 2026-07-15; corrected 2026-07-26; source-currency correction drafted
2026-08-01 and accepted 2026-08-02. This revision has a separately named current content identity,
but still requires the R15 values/protocol freeze and full rerun before it can govern replacement
evidence (charter §3.2 Phase 6 item 1).

> **Two identities deliberately coexist.** `PHASE6_PARAMETER_TABLE_SHA256` remains the historical
> 2026-07-27 identity consumed by the legacy Arm 1 manifest; those exact table bytes are recoverable
> at commits `390fe35` and `483f7ee`, and that constant is not the hash of this current file.
> `PHASE6_CURRENT_PARAMETER_TABLE_SHA256` pins this corrected current revision for future work.
> Both identities normalize line endings to LF, so checkout conversion cannot change their meaning.
>
> **Any change to this accepted mapping requires a logged ADR and new registered identity.** Once a
> revision has been frozen into an executed protocol, a post-freeze change makes results under the
> old revision inadmissible for a replacement gate governed by the changed input and the sweep must
> rerun in full. Historical measurements and bytes remain reportable at their named superseded-
> protocol scope; they are not silently upgraded. This makes a post-result adjustment explicit and
> prevents adjusted inputs from silently inheriting prior gate evidence.
>
> Nothing here is frozen for other phases. Phase 2b/4/5 evidence keeps the values that produced
> it. The historical freeze bound Phase 6 only; the current identity is a content pin, not the R15
> protocol freeze.
The 2026-07-26 pass landed four source-verified corrections while they were still free to make
(post-freeze, each would cost a full re-sweep by charter rule): SDAK-2 recorded as an
`A_prism` mechanism rather than a missing `A` gap (§4.2); the printed width parameterization
recorded (§4.3); the latent-heating parameter `chi_0(T, P)` given anchors and its first-order
correction (§7); and the CAK pressure-independence assumption qualified with the monograph's
own retraction of it (Open questions). The 2026-07-26 correction record states that the passages
used for those four changes were checked against the page renders rather than copied from a
summary; this sentence does not claim a fresh recheck of every quotation in the current session.
Every adopted solver input below carries its provenance class and either a source citation for a
source value/transcription or named operands and method for a project-derived/P4 value; analytic
verification relations and contextual numbers not adopted as inputs are explicitly marked outside
that taxonomy.
**Correction 2026-08-01:** the
original-source CAK curves remain figure digitizations, but the later source-currency sweep found
printed broad-facet and M1 closed forms in `2009.08404v2` and `2306.13087v1`. The former claim that no
closed form existed was therefore false outside the original source pair. These later alternatives
do not silently replace the CAK anchors; their distinct mappings and provenance are recorded in
§§4.1a–4.1b. `D(T)`'s missing source law remains a separate recorded gap.

This table is the mapping layer from real conditions `(T, σ, P)` into the solver. It replaces
project-side curve fitting with source-cited empirical quantities, authoritative exact definitions,
source fits/models, and explicit project-derived/P4 choices — the substance of decision
[0003](decisions/0003-libbrecht-attachment-kinetics.md). Used by
[attachment-kinetics.md](attachment-kinetics.md), especially its §4.4 surface operator.

**Primary source:** K. Libbrecht, "A quantitative physical model of the snow crystal morphology
diagram," arXiv:1910.09067 — `research/1910.09067v2.pdf` (17 pdf pages; page numbers below are
pdf pages). For the **standard kinetic-theory forms — `v_kin(T)` and `D(T, P)` — the Snow
Crystals monograph (arXiv:1910.06389, `research/1910.06389v2.pdf`) is a valid citation source**
(charter §3.2 Phase 2b, amended v1.2). The monograph is ALSO the authoritative source for the
CAK (Comprehensive Attachment Kinetics) numeric curves: the 1910.09067 paper presents the same
model compactly, with `sigma_0(T)` only as Figures 4/9/10 and a blanket `A ≈ 1` simplification
that the monograph's Chapter 4 refines. Monograph citations below give printed page / pdf page.

---

## The rule for this file

> **No adopted source value or source transcription enters this file without a citation** —
> paper, section or figure or table, and page. Explicit project derivations and P4 choices name
> their operands/rule; verification and contextual numbers not adopted as inputs are marked as such.
> A parameter with no provenance is indistinguishable from a parameter someone tuned until the
> picture looked right, and that is the exact failure this project exists to avoid.
>
> **No adopted source value is guessed or recalled from memory.** If a source value is unavailable,
> the cell stays empty and the gap is stated. Derived values and P4 interpolation rules are admitted
> only when labeled with their operands and method. An unexplained value is a physics bug that may
> survive several phases.
>
> **Figure digitization is the one sanctioned exception**, used only where the source publishes
> a quantity *exclusively* as a plot: the entry records the figure, the digitization method,
> and a per-point uncertainty, and is class P2 at best. The figure remains the authority; the
> digitized number is a reading of it, checkable by anyone with the source open.

> **A revision governing a Phase 6 validation sweep freezes before that sweep** (charter Phase 6
> protocol freeze, added v1.2). Post-freeze, any edit to it requires a logged ADR and makes prior sweep
> results **inadmissible for a replacement gate governed by the changed input** — the full
> replacement sweep re-runs. Historical executed measurements and bytes remain records of their
> named superseded protocol. Until the freeze it is a living extraction target; after it, the file
> is part of a pre-registered protocol.

## Provenance classes (decision 0005; charter §2.7) — every adopted solver input carries one

- **P1 — directly adopted authoritative source quantities.** This includes measured or
  source-tabulated empirical inputs and exact metrological definitions. Empirical entries record
  stated uncertainty or precision; defined entries record their defining authority and exact
  status. A source fit, inversion, derived value, or figure reading is not P1 merely because its
  source is authoritative.
- **P2 — fitted, model-inferred, project-derived, or figure-digitized.** Record the functional form
  and its stated domain of validity —
  extrapolating a fit outside its range silently manufactures a fake result. Figure
  digitizations land here, with the digitization uncertainty recorded.
- **P3 — Nakaya-informed SDAK hypotheses.** The narrow-facet dip locations/depths were chosen to
  impose agreement with the morphology diagram (monograph printed p. 152 / pdf 153: "I have
  chosen different values of T_onset for the basal and prism facets **to impose agreement with
  the known ice-growth behaviors from the Nakaya diagram**"). Any Nakaya comparison using P3
  inputs is **in-sample reproduction**, never independent validation. Published model-dependent
  inversions of narrow-facet growth observations can support the existence and approximate
  temperature regions of barrier reductions without promoting the exact M1 functional forms,
  depths, widths, or placement out of P3 (decision 0040).
- **P4 — numerical/discretization choices** (interpolation schemes, resolutions, tolerances).

Consequently this file keeps **two separate branches** — the broad-facet (large-facet)
parameters and a separate SDAK section — never merged, because Phase 6 reports no-SDAK and SDAK
runs separately.

**Canonical units (v1.3):** `sigma_0` and all supersaturations are **dimensionless fractions**
here and in code. Libbrecht's plots and text quote **percent** — each adopted percent-valued input
records the raw cited value with its raw units and the converted fraction. A silently mis-read percent is a
**100× error inside `exp(−sigma_0/sigma_surf)`** — the single easiest way to destroy the model
while every individual number "looks right." Pressure: raw units recorded, canonical Pa.

---

## 1. The governing equations (all directly printed in the sources)

| Equation | Source |
|---|---|
| `v_n = alphaHK · v_kin · sigma_surf` (Hertz–Knudsen) | 1910.09067 Eq. 1, p. 3; monograph Eq. 3.8, printed p. 93 / pdf 94 |
| `sigma_surf = (c_surf − c_sat(T)) / c_sat(T)` (definition, dimensionless) | 1910.09067 p. 3 |
| `v_kin(T) = (c_sat/c_ice) · sqrt(kT / 2π·m_mol)` | 1910.09067 Eq. 2, p. 3; monograph Appendix A, printed p. 501 / pdf 502 |
| `alphaHK(sigma_surf) = A · exp(−sigma_0 / sigma_surf)` (nucleation-limited facet growth) | 1910.09067 Eq. 3, p. 4 |
| `sigma_0(T) = S·(Libbrecht's β(T))²·a² / (kT)²`, S ≈ 1 (relates sigma_0 to the terrace step energy; informational — the solver consumes `sigma_0` directly) | 1910.09067 Eq. 4, p. 4 |
| `v_n = (c_sat·D/c_ice) · (∂σ/∂n)_surf` (mass conservation at the surface) | monograph Eq. 3.7, printed p. 93 / pdf 94 |
| `X_0 · (∂σ/∂n)_surf = alphaHK · sigma_surf` (the mixed/Robin surface condition) | monograph Eq. 3.9, printed p. 93 / pdf 94 |
| `X_0(T, P) = (c_sat/c_ice) · D / v_kin` (kinetic length) | monograph Eq. 3.10, printed p. 93 / pdf 94 |
| `p_ice(T) ≈ 3.7e10 · exp(−6150/T_K)` **mbar** (Arrhenius fit, "slightly modified to better fit the data") | monograph Eq. 2.8, printed p. 58 / pdf 59 |
| `p_water(T) ≈ (2.8e9 + 1700·T_C³) · exp(−5450/T_K)` **mbar** (same status) | monograph Eq. 2.8, printed p. 58 / pdf 59 |
| `sigma_water(T) = (c_sat,water − c_sat,ice)/c_sat,ice` (source-side physical ceiling concept; not an enforced v1 runtime bound across the full domain — see known limit below) | monograph Eq. 2.9, printed p. 58 / pdf 59 |

**Known limit of the closed forms (found 2026-07-15, pinned in `core/test/libbrecht.test.ts`):
computing `sigma_water` as the DIFFERENCE of the two Eq. 2.8 fits amplifies their individual
~1% errors without bound near the melting point — at −1 °C the difference form goes *negative*
(−0.009146 computed, vs Table 2.1's +0.010; the −0.006 first recorded here was hand-arithmetic
error, corrected round-3), at −10 °C it is ~20% low, at −15 °C it reads 0.137 vs the table's
0.157 (12.8% low), improving with cold: 8.8% at −20, 4.6% at −30, 2.0% at −40.**
No cited continuous interpolation of Table 2.1's positive column has been adopted, so v1 uses
this quantity as a plausibility reference only and does not enforce it as a runtime ceiling
(attachment-kinetics §4.4 component 1).
Use Table 2.1's `sigma_water` column (anchors in §5) wherever the value matters; the fit
difference is implemented because the forms are cited, not because it is good.

Unit check performed on Eq. 2.8 (2026-07-15): `p_ice(273.15 K) = 3.7e10·exp(−22.515) ≈ 6.1` —
matches Table 2.1's `P_ice = 6.11` at 0 °C only if the formula's output unit is **mbar** (=
hPa; 611 Pa is the triple point). The mbar reading is therefore confirmed against the source's
own table. `c_sat = p_ice/(kT)` converts to number density.

### 1.1 The spherical analytic solutions (source-exact verification relations, outside P1–P4)

Added for Phase 6 WP3/WP3b. These are absolute discretization/implementation checks for an idealized
spherical boundary-value problem: unlike self-refinement, they compare the solver with an analytic
answer. They do not establish absolute physical accuracy for faceted 3-D crystals. Transcribed from
the page renders (`research/1910.06389v2/`), not from `monograph-review.md`. P1–P4 classify solver
inputs; an analytic verification relation is not measured kinetics and therefore is not P1.

The monograph writes the attachment coefficient as a bare Greek letter; in this model that
quantity is `alphaHK`. Its diffusive counterpart, Eq. 3.18, is the ratio `X_0/R`, and is written
out here rather than given a name, because a name built on the bare stem is what Rule 7 bans.

**Sphere of radius R against an infinite far field** (printed p. 96 / pdf 97):

| Equation | Form | Number |
|---|---|---|
| radial field | `sigma(r) = sigma_inf − (R/r)·(sigma_inf − sigma_surf)` | 3.16 |
| surface value | `sigma_surf = [(X_0/R) / (alphaHK + X_0/R)] · sigma_inf` | 3.17 |
| diffusive coefficient | `X_0/R` | 3.18 |
| growth velocity | `v_n = [alphaHK·(X_0/R) / (alphaHK + X_0/R)] · v_kin · sigma_inf` | 3.19 |
| kinetics-limited when | `alphaHK << X_0/R`, giving `v_n ≈ alphaHK·v_kin·sigma_inf` and `sigma_surf ≈ sigma_inf` | 3.20–3.22 |
| diffusion-limited when | `X_0/R << alphaHK`, giving `v_n ≈ (c_sat·D)/(c_ice·R)·sigma_inf ≈ (X_0/R)·v_kin·sigma_inf` | 3.23–3.24 |

**Finite outer boundary at R_far** (printed p. 100 / pdf 101, attributed to [2013Lib1]) — the
case that exposed the historical fixed-σ finite-shell bias; Phase 6 now uses the implemented
monopole-matched shell:

| Equation | Form | Number |
|---|---|---|
| radial field | `sigma(r) = sigma_out − (R'/r − R'/R_far)·sigma_out` | 3.33 |
| length scale | `R' = [gamma/R − 1/R_far]^(−1)` | 3.34 |
| ratio (**as printed — see erratum**) | `gamma = (alphaHK + X_0/R) / (X_0/R)` | 3.35 |
| growth velocity | `v_n = [alphaHK·(X_0/R) / (alphaHK + X_0/R)] · v_kin · sigma_inf · [1 − R/(gamma·R_far)]^(−1)` | 3.36 |

The source states 3.36 reduces to 3.19 as `R_far → ∞`, "as it must". That identity is worth
asserting in any implementation, but note it does **not** constrain `gamma`: the bracket tends
to 1 for any value, so the source's own stated check cannot catch the error below.

**Erratum in Eq. 3.35 (found 2026-07-26, Phase 6 WP3b; pinned in
`solver-cpu/test/spherical-reference.test.ts`).** The printed denominator is `X_0/R`. It should
be `alphaHK`:

`gamma = (alphaHK + X_0/R) / alphaHK = 1 + (X_0/R)/alphaHK`

The transcription above was verified at magnification against the page render, so this is a
disagreement with the source, not a misreading of it. Three mutually consistent cross-checks of the
same equation—not three independent evidence lineages—each reject the printed form:

1. **Eq. 3.33 must reduce to Eq. 3.17 as `R_far → ∞`.** Its limit is
   `sigma_surf/sigma_inf = 1 − 1/gamma`. The printed form gives `alphaHK/(alphaHK + X_0/R)` —
   exactly the *complement* of Eq. 3.17. The corrected form reproduces Eq. 3.17 identically
   (0.10797279 against 0.10797279 at the −5 °C test point).
2. **Against an exact solve of the same boundary-value problem** — Eq. 3.9's Robin condition at
   `R`, Dirichlet at `R_far`, `sigma = A + B/r`, which shares no derivation with Eqs. 3.33–3.36 —
   the amplification is 1.18947162. The corrected bracket gives 1.18947162; the printed bracket
   gives 1.01965991.
3. **A crystal that is not growing cannot be biased by the far boundary.** As `alphaHK → 0` the
   corrected bias vanishes **linearly in `alphaHK`** — 3.7539e−6, 3.7539e−7 and 3.7539e−8 at
   `alphaHK` = 1e−6, 1e−7 and 1e−8 respectively (ADR 0028 corrected an exponent mismatch here:
   this line previously read "3.7e−6 at `alphaHK = 1e−8`", pairing the 1e−6 value with the 1e−8
   argument. The linear vanishing, which is the whole argument, was and is unaffected); the
   printed form instead tends to
   `[1 − R/R_far]^(−1) − 1`, about 22% at the test point, for a crystal with no flux at all.

**What 3.36 buys, with the correction applied.** The bracket is the finite-shell bias in closed
form: a Dirichlet shell held at `sigma_inf` at finite radius over-supplies vapor by
`[1 − R/(gamma·R_far)]^(−1)` relative to true infinity. Substituting the corrected 3.35, the
excess is

`R/(gamma·R_far) = alphaHK·R² / ((alphaHK·R + X_0)·R_far)`

which **grows with the crystal**, tending to `R/R_far` — so the bias tends to
`[1 − R/R_far]^(−1)` and diverges as the crystal approaches the shell. This is the opposite of
what the printed form implies, and it is much larger. At Phase 6's discriminating condition
(f = 0.15, basal facet, −5 °C, `dx` = 0.35 µm, `R` = extent/2, `R_far` = N/2):

| measured extent | N = 40 | N = 48 | N = 64 | N = 80 | N = 96 |
|---|---|---|---|---|---|
| 17 | 61% | 46% | 31% | 23% | 19% |
| 31 | 266% | 153% | 83% | 57% | 43% |
| 61 | — | — | 1179% | 281% | 159% |

Phase 2b measured at extent 61 in 96³, so its own configuration sits at roughly a **160%**
finite-shell over-supply on this estimate. The −15 °C numbers are within a point of these.

**Consequences.** The fixed-σ Dirichlet far field at these domain sizes is not a mild
approximation, and the bias falls only as ~1/N, so the WP3 domain ladder is load-bearing rather
than pro forma. It also explains why the now-implemented, Phase-6-registered monopole-matched far
field (`monograph-review.md` §2.4; decisions 0024/0027) is substantive rather than a refinement.
**This supersedes an earlier note here that a
"few-percent" bias could not explain the calibration observation of a needle at 28³ where 96³
gives a plate at identical conditions — that note was computed with the printed `gamma` and was
wrong; a bias of this size is a live candidate for exactly that effect.**

Two limits of the estimate, both of which keep it an order-of-magnitude tool rather than a
correction to apply: it is isotropic, so identifying `R` with extent/2 for a plate or column is
crude; and it assumes an isolated sphere, whereas at these ratios the crystal occupies much of
the domain. A **differential** per-facet bias — prism tips sit far closer to the wall than basal
faces — is not expressible in this form at all, and is the natural next question.

## 2. Physical constants and exact metrological definitions

| Constant | Value (as cited) | Canonical | Class |
|---|---|---|---|
| `k` (`K_BOLTZMANN`) | exactly 1.380649 × 10⁻²³ J K⁻¹ | same | P1 (exact metrological definition) |
| Celsius-to-kelvin offset (`CELSIUS_ZERO_K`) | `T/K = t/°C + 273.15`, exactly | 273.15 K | P1 (exact metrological definition) |
| standard atmosphere (`P_ATM`) | exactly 101325 Pa | same | P1 (exact metrological definition) |
| `c_ice` (ice number density) | ≈ 3.1 × 10²⁸ m⁻³ | same | P1 (textbook; monograph Appendix A, printed p. 500 / pdf 501) |
| `rho_ice` | ≈ 917 kg/m³ | same | P1 (monograph Appendix A, printed p. 501 / pdf 502) |
| `m_mol` (water molecule mass) | ≈ 3.0 × 10⁻²⁶ kg | same | P1 (monograph Appendix A, printed p. 501 / pdf 502) |
| `a` (molecule size, `c_ice^(−1/3)`) | ≈ 0.32 nm | 3.2 × 10⁻¹⁰ m | P2 (derived from the P1 density) |
| `gamma_sv` (ice/vapor surface energy) | ≈ 106 ± 15 mJ/m² | same | P1 (stated uncertainty; monograph Appendix A, printed p. 500 / pdf 501) |
| `d_sv` (Gibbs–Thomson length, `gamma_sv/(c_ice·kT)`) | ≈ 1 nm | 1 × 10⁻⁹ m | P2 (derived) |
| `D_air` (water vapor diffusivity in air) | ≈ 2 × 10⁻⁵ m²/s | same | P1 (monograph Appendix A, printed p. 500 / pdf 501; see §6 caveat) |

The exact definitions come from authoritative metrology rather than empirical measurement:
`k` is a defining constant in the **BIPM SI Brochure, 9th edition, version 4.01 (June 2026),
§2.2, printed pp. 124–125, Table 1** (DOI `10.59161/AUEZ1291`), which states that defining
constants have no uncertainty; the Celsius relation is in **§2.3.1, printed p. 130**; and one
standard atmosphere is defined as exactly 101325 N/m² by the **10th CGPM (1954), Resolution 4,
Proceedings p. 79**, DOI `10.59161/CGPM1954RES4E`. The exact decimal `k` and `273.15` definitions
are represented by their nearest binary64 values in JavaScript, while integer 101325 is exactly
representable. That representation policy is P4; it does not change the quantities' P1 provenance.

## 3. Branch 1 — broad-facet `sigma_0(T)` and `A(T)` (the CAK large-facet model)

**Source of record: monograph Figure 4.5 (printed p. 144 / pdf 145)** — "best-estimate CAK
model functions σ₀(T) and A(T) on large basal and prism facets," explicitly described as
"little more than parameterized fits to experimental data" (printed p. 145 / pdf 146), the
underlying measurements being Libbrecht & Rickerby 2013 (arXiv:1208.5982) and Chapter 7.
**Neither the paper nor the monograph prints the fit formulas or a numeric table — the curves
exist only as plots. Documented gap.** The numbers below are **digitized from Figure 4.5**
(300 dpi render of the embedded plot; log–log axes; gridline-anchored abscissae only).
Digitization uncertainty: **±25% relative on σ₀** (log-scale reading), **±0.03 absolute on A**.
Class **P2**. The figure is the authority; anyone can re-read it from
`research/1910.06389v2.pdf`.

Raw plot units: σ₀ in **percent**, abscissa `(Tm − T)` in °C. Fractions = percent / 100.

| (Tm−T) °C | T °C | σ₀_basal raw (%) | `sigma_0_basal` (fraction) | σ₀_prism raw (%) | `sigma_0_prism` (fraction) | A_basal | A_prism |
|---|---|---|---|---|---|---|---|
| 1 | −1 | 0.30 | 0.0030 | ~0.006 (at plot floor) | ~0.00006 | 1 | 0.45 |
| 2 | −2 | 0.35 | 0.0035 | 0.028 | 0.00028 | 1 | 0.28 |
| 3 | −3 | 0.45 | 0.0045 | 0.07 | 0.0007 | 1 | 0.21 |
| 5 | −5 | 0.70 | 0.0070 | 0.27 | 0.0027 | 1 | 0.18 |
| 10 | −10 | 1.4 | 0.014 | 1.4 | 0.014 | 1 | 0.83 *(corrected 2026-07-15, round-2 review: first digitized as 0.95, outside the ±0.03 band — the rendered figure reads 0.83–0.84)* |
| 15 | −15 | 2.4 | 0.024 | 3.2 | 0.032 | 1 | 1 |
| 20 | −20 | 3.8 | 0.038 | 6 | 0.06 | 1 | 1 |
| 30 | −30 | 7 | 0.07 | 13 | 0.13 | 1 | 1 |
| 50 | −50 | 16 | 0.16 | 32 | 0.32 | 1 | 1 |

Text-cited fit/inference statements (not digitized — **P2**, because the printed kinetic
parameters are inferred from growth observations rather than directly observed quantities):

- source-fit `sigma_0 = 3 percent` (fraction 0.03) for a **prism** facet at **−15 °C**, VIG apparatus,
  20 mbar background air — monograph printed p. 144 / pdf 145 (Figure 4.4 discussion). Agrees
  with the digitized 3.2% ± 25% above.
- source-inferred `A ≈ 1` for basal across **−2 > T > −40 °C**: "unambiguous evidence for nucleation-limited
  growth with A ≈ 1 over the entire temperature range" — 1910.09067 p. 6, citing [2013Lib].
- source-inferred `A_prism < 1` above ≈ −10 °C: "substantial experimental evidence indicating A < 1 for prism
  facets when the growth temperature is above −10 C" — 1910.09067 p. 4 (which then *sets this
  aside* and assumes A ≈ 1 throughout; the monograph's CAK curves *include* it — Figure 4.5
  lower panel, and the "frustrated QLL kinetics" discussion, printed p. 145–147 / pdf 146–148).

**Parameter-set provenance (added round-3; corrected 2026-08-01 — every solver input needs a class,
including composite sets):** the solver's selectable sets include `CAK` — this Branch's digitized σ₀(T)
plus the digitized `A(T)` (both **P2**, figure digitizations of the source's own fits) — and
`CAK_A1` — the same σ₀(T) with `A ≡ 1` on both facets. `CAK_A1` is classified **P2** as a
whole: its σ₀ component is the P2 digitization above, and its `A ≡ 1` component is the
simplification 1910.09067 itself adopts for its analysis ("I will proceed by assuming A ≈ 1
… throughout the remainder of this paper," p. 5 — a cited modeling choice, not a
measurement). `CAK_A1` is NOT 1910.09067's model: that paper's own Fig. 4 σ₀ fits (made
under A ≡ 1) are a separate, un-digitized curve set — a recorded gap.

The Phase 6 code also exposes `M1`: the exact `2306.13087v1` closed forms recorded in §4.1a with
`A_basal = A_prism = 1`. As a composite set it is **P3 for a Nakaya comparison** because its exact
dip prescription was selected using that diagram. The intended replacement arm
`M1_NO_DIP_ABLATION` is not yet a frozen production parameter set: it will match M1 except for
setting both dip factors to one, using the printed M2 broad-branch functions. That matched pair can
test sensitivity to the M1 dip factors; it is not an implementation of M2's width feedback.

**Source discrepancy, recorded rather than smoothed over:** within that paper's `A ≈ 1` model,
1910.09067 Figure 4's caption associates the source-fit/model-inferred σ₀ crossing at
**T ≈ −6 °C** with plates above and columns below. That source-level interpretation does not make
the σ₀ crossing an `alphaHK` crossing under unequal prefactors or facet fields, or a habit theorem;
the monograph's CAK curves (Fig. 4.5, digitized above) cross at **(Tm−T) ≈ 9–10 °C**. The two
sets differ in fit assumptions by the sources' own statements (09067 fits with A ≡ 1; the CAK
model allows A_prism < 1). Whether that fully explains the shift is *our inference, not a
source statement*. **The solver uses the CAK set (the later, fuller synthesis); Phase 6 must
carry this discrepancy as a stated systematic.** A valid comparison runs and evaluates each full
parameterization; it does not use either crossing as a morphology target.

**Interpolation between anchors is a P4 decision, not physics — REGISTERED 2026-07-26**
(`runner/src/phase6-protocol.ts`, `PHASE6_INTERPOLATION`). The scheme is **piecewise log–log
linear between adjacent anchors** for `sigma_0` (both facets), **piecewise linear in `(Tm−T)`**
for `A_prism` (it touches 1 and dips, so a log scheme is wrong for it), `A_basal ≡ 1`, and
**extrapolation is banned** — the solver throws outside `(Tm−T) ∈ [1, 50]`, i.e.
`T ∈ [−50, −1] °C`. This is the interpolation used by every `CAK`/`CAK_A1` run to date.
`M1` instead evaluates the printed closed forms in §4.1a under the same source-displayed domain
guard; it does not use these anchors or this interpolation.

*The justification previously recorded here was wrong and is corrected.* This file used to say
the curves are "near-straight on the log–log plot above (Tm−T) ≈ 3". They are not: the local
log–log slope runs **0.22 → 1.62** (basal) and **2.26 → 1.76** (prism) across the digitized
range, and a single power law fitted over `(Tm−T) ≥ 3` leaves residuals of **21%** (basal) and
**23.8%** (prism). Global straightness is not why the scheme is acceptable.

The numerical leave-one-out reason is that its error is subdominant to the digitization band already carried
on the anchors. Dropping each interior anchor and rebuilding it from its two neighbours by the
same rule — a conservative bound, since it spans two intervals where the solver spans one —
gives a worst relative error of **10.7% (basal)** and **9.0% (prism)** against the **±25%**
band above. `runner/test/phase6-protocol.test.ts` recomputes both numbers from the live solver,
so this justification cannot drift away from the code it describes.

**Consequence for the Phase 6 grid:** the banned extrapolation is a hard constraint on the
frozen T grid. The Nakaya diagram runs to 0 °C; the warmest temperature Phase 6 may sweep is
**−1 °C**, and the coldest is **−50 °C**. Any comparison against the diagram's 0 to −1 °C strip
is outside the digitized domain and is not made.

**What the ±25% band does and does not permit (recorded 2026-07-15, round-2 review):** any
"robustness" arithmetic built on these anchors holds for the **nominal digitized values
only**. Propagating the ±25% bands independently per anchor shrinks the −5 °C
basal/prism separation to a worst-case ratio ≈ 1.5 and lets the −15 °C bands **overlap** —
uncertainty-consistent parameter draws exist in which the cold-side ordering reverses. No
covariance information exists to exclude that (the two curves were digitized from one plot,
so their errors are likely correlated, but "likely" is not a bound). Consequences: a habit
gate certifies the solver's response to its **recorded** inputs — the exact numbers above —
and a gate failure has digitization uncertainty as a live candidate cause, to be reported as
such rather than debugged as code. Phase 6 must treat these bands as a stated systematic.

## 4. Branch 2 — narrow-facet evidence and SDAK prescriptions (kept separate from Branch 1)

**There are two distinct SDAK hypotheses in the sources, and this section records both.**
SDAK-1 modifies `sigma_0` on narrow facets (the dips digitized below); SDAK-2 modifies
`A_prism` on narrow prism facets (§4.2). They are separate mechanisms aimed at different
observations, and neither implies the other. The solver implements neither the full width-dependent
SDAK-1 closure nor SDAK-2. It does implement M1's everywhere-narrow approximation as `M1`;
historical CAK runs are
no-SDAK, historical M1 runs are Nakaya-informed/in-sample, and CAK→M1 changes multiple kinetic
choices rather than isolating SDAK causally.

### 4.1 SDAK-1 — the `sigma_0` dips

Source: monograph Figure 4.12 (printed p. 152 / pdf 153) — dips drawn **dotted** "to signify
their substantial uncertainties"; curves assume edge radius `R_edge ≈ 1–2 µm` ("typical for
snow-crystal growth in air"). 1910.09067 p. 13: "Neither the width nor depth of the dip
structure … is well constrained by measurements"; dip positions set by the premelting onset
temperature per facet, "somewhat constrained by other measurements, but not tightly so."
**No functional form for these monograph/1910 temperature-dip curves is printed in that original
source pair—they are figure-only.** TAX2 later prints the distinct M1 forms recorded in §4.1a. A
functional form for the *width* dependence is printed separately and recorded in §4.3.
Digitized (same method and uncertainty as Branch 1):

| Facet | Dip minimum | At (Tm−T) | Departs / rejoins large-facet curve | Explains (source's claim) |
|---|---|---|---|---|
| narrow **basal** | σ₀ ≈ 0.07–0.08% (fraction ≈ 0.0007–0.0008) | ≈ 4–4.5 °C (T ≈ −4 to −4.5) | ≈ 2 / ≈ 7–8 | rapid basal growth of hollow-column edges near −5 °C |
| narrow **prism** | σ₀ ≈ 0.18–0.20% (fraction ≈ 0.0018–0.0020) | ≈ 14–16 °C (T ≈ −14 to −16) | ≈ 7–8 / ≈ 25–30 | thin-plate edges near −15 °C |

The reduction is relative to the large-facet curve at the same T: roughly **×6–7 lower**
(basal, at the minimum) and **×15 lower** (prism, at the minimum). Those exact digitized curves are
P3 because they were drawn to reproduce the Nakaya diagram, and a run using them is in-sample for
Nakaya purposes. Separately, CM8 (`2009.08404v2`), CM9 (`2011.02353v1`), and CM10
(`2012.12916v1`) report model-dependent inversions of narrow-facet growth-rate observations
supporting reductions in approximate regions near −4 °C and −14 °C; the page-level evidence is
catalogued in [the later-paper extraction, H5–H9](../research/libbrecht-papers-extracts.md).
Surface supersaturation was not directly verified, so those observations do not validate the exact
curve, depth, or placement (charter §2.7; decisions 0005 and 0040).

### 4.1a M1 printed closed forms and implemented mapping

`2306.13087v1` p. 6 prints M1 with σ₀ in percent, `t = |T_C|`, `A_basal = A_prism = 1`,
and an unspecified `log` base:

```text
σ₀,basal(t) = (0.02·t^1.75 + 0.3) · (1 − 0.87·exp(−(log t − log 4.5)² / 0.07))
σ₀,prism(t) = (0.015·t² + 0.02·t^0.6) · (1 − 0.95·exp(−(log t − log 14.4)² / 0.06))
```

These printed expressions return percent values. `core/src/libbrecht.ts` divides each result by
100 before it is used in the Hertz–Knudsen attachment coefficient, so the implemented `sigma_0`
values are fractions.

The source's M1 prescription—functional form, dip placement, and everywhere-narrow assumption—is
P3. The source does not print the logarithm base. This project evaluates `log` as base 10 because
that choice reproduces Figure 1's plotted widths; the unstated-base resolution is therefore a
registered, figure-supported P4 transcription choice, not a source-printed input. The resulting
mapping is implemented by `core/src/libbrecht.ts` under `M1`. The dip centres remain 4.5 °C and
14.4 °C under any logarithm base; the base changes width and σ₀-equality locations, not centres. At
one shared positive surface supersaturation, `A_basal = A_prism = 1` makes attachment-coefficient
order the inverse of σ₀ order because `alphaHK = exp(−sigma_0 / sigma_surf)`. That restricted
analytic fact is not a habit theorem because the coupled facets generally see different fields and
geometry.

`2306.13087v1` p. 7 prints the undipped broad branch
`σ₀,basal = 0.02·t^1.75 + 0.3` and
`σ₀,prism = 0.015·t² + 0.02·t^0.6` percent. These functions belong to M2's
width-dependent model; alone they are only its broad-facet branch. The intended
`M1_NO_DIP_ABLATION` reuses them as a deliberately matched dip-factor removal, not as a claim to
implement M2. Full M2 requires a sourced width-selection/feedback closure and remains unimplemented.

### 4.1b Other later printed mappings — alternatives, not silent replacements

`2009.08404v2` p. 3 Eqs. (2)–(5) prints a distinct broad-facet model, with
`t = |T_C|` and both nucleation barriers expressed in percent:

```text
σ₀,basal(t) = 0.02·t^1.75 + 0.3
σ₀,prism(t) = 0.02·t^1.9 − 0.025·(t − 0.3)
A_basal(t) = 1
A_prism(t) = (0.4 + 0.04·|t − 4|³) / (2.2 + 0.04·|t − 4|³)
```

The paper describes these curves as approximate fits chosen to represent the available data; they
are P2 source fits, not P1 raw measurements. They are independently evaluated by
`app/scripts/phase6-libbrecht-closed-forms.mjs` but are not the implemented historical `CAK`
mapping and do not replace its anchors without an accepted parameter/protocol decision.

`2306.04042v1` p. 9 Table 1 prints a two-branch prism parameterization for its Eq. (32). The
source stores each `σ₀` as a fraction; percent is shown here to make the unit conversion explicit:

| T (°C) | A₁ | σ₀,₁ fraction (percent) | A₂ | σ₀,₂ fraction (percent) |
|---:|---:|---:|---:|---:|
| −1 | 0.30 | 0.00003 (0.003%) | 0.70 | 0.001 (0.10%) |
| −2 | 0.25 | 0.0003 (0.03%) | 0.75 | 0.0015 (0.15%) |
| −3 | 0.20 | 0.001 (0.10%) | 0.80 | 0.003 (0.30%) |
| −5 | 0.20 | 0.002 (0.20%) | 0.80 | 0.0055 (0.55%) |
| −7 | 0.50 | 0.008 (0.80%) | 0.50 | 0.01 (1.00%) |
| −15 | 1.00 | 0.03 (3.00%) | — | — |

At zero curvature the tabulated branches contribute
`A₁·exp(−σ₀,₁/σ_surf) + A₂·exp(−σ₀,₂/σ_surf)` where branch 2 exists. The source calls the second
branch a convenient SDAK-2 parameterization; the complete relation also carries a
Gibbs–Thomson/curvature correction. The broad/source-fit branch is P2, while the added SDAK-2
model prescription is P3. This table records the source mapping but does not implement the full
FACET relation or supply M2's missing width-selection feedback.

### 4.2 SDAK-2 — the `A_prism` recovery on narrow prism facets (**P3**)

*Corrected 2026-07-26 (pre-freeze). This section previously said the sources "modify only
`sigma_0`" and recorded `A` handling on narrow facets as an unspecified gap. That was wrong:
the monograph states the mechanism explicitly.* Monograph Figure 4.14 (printed p. 154 /
pdf 155), caption verbatim:

> The SDAK-2 mechanism increases the value of `A_prism` on small prism facets at temperatures
> above -10 C, as approximated here by the dotted curve. This curve is expected to depend on
> supersaturation, such that `A_prism → 1` at especially high `sigma_surf`. The solid curves
> are reproduced from Figure 4.5. This change in `A_prism` mainly affects the growth of
> sharp-tipped dendritic structures, which are often observed in high-supersaturation
> experiments.

So: a second, `A`-side hypothesis, restricted to **small prism facets above ≈ −10 °C**,
**supersaturation-dependent** (→ 1 at high `sigma_surf`), and aimed at **sharp-tipped
dendrites** — a different target from SDAK-1's hollow-column edges near −5 °C and thin-plate
edges near −15 °C. Like SDAK-1 it is dotted-curve P3, and it is **not digitized here**: no
anchor table is extracted from the monograph curve because nothing in the solver consumes it yet.
The later, distinct `2306.04042v1` two-branch table is transcribed in §4.1b; it is not a
digitization of this dotted curve and does not merge SDAK-2 into Branch 1.

### 4.3 The printed width parameterization (a real head start)

The original monograph temperature-dip curves have no printed form; TAX2's later M1 approximation
is recorded in §4.1a. The monograph's **width** dependence does have a printed form. Monograph
printed p. 157 / pdf 158, verbatim:

> For example, in [2015Lib2] we used the functional form `sigma_0 = sigma_0,∞[1 −
> exp(−w/w_0)]`, where `sigma_0,∞` is the broad-facet value and `w_0` is an adjustable model
> parameter. This allowed us to reproduce the ESI transition to platelike growth at -15 C
> reasonably well, as the behavior that mattered most was having `sigma_0 → 0` as `w → 0`.

Note the source's own framing on the same page: "the precise functional form for the SDAK
effect may not be essential… the details may not matter as much as the attachment coefficients
on the narrow 1-2 µm tips and edges." This records two distinct prospective entries, not one mixed
class:

- **P3 — source Nakaya/ESI prescription:** the printed width-dependent form and its adjustable
  `w_0` model role were used to reproduce the −15 °C ESI transition; they are not measurements.
  No numerical `w_0` value is frozen here. A value chosen or tuned against the target morphology
  remains P3 and makes that comparison in-sample, not held-out validation.
- **P4 — future project closure:** any lattice facet-width estimator, sub-grid mapping from that
  estimator to physical `w`, and numerical evaluation/interpolation policy. Those numerical choices
  must be registered separately and cannot be presented as a measured physical `w_0`.

If a future numerical `w_0` is independently fitted to a different empirical dataset, it is P2 and
must name that fit/domain. In every case the value and closure freeze before evidence production.

## 5. `v_kin(T)` — kinetic velocity

**Closed form** (the solver computes this; the table below is validation anchors, not an
interpolation source): `v_kin = (c_sat/c_ice)·sqrt(kT/2π·m_mol)` — 1910.09067 Eq. 2, p. 3;
with `c_sat(T) = p_ice(T)/(kT)` from monograph Eq. 2.8 (mbar → Pa: ×100). Class P2 (kinetic
theory + Arrhenius fit).

**Tabulated anchors** — monograph **Table 2.1** (printed p. 57 / pdf 58; the table is an
embedded image, transcribed 2026-07-15; full table runs −40…0 °C in 1° steps):

| T (°C) | `P_ice` (mbar, raw) | `c_sat` (#/m³) | `sigma_water` | `v_kin` (µm/s, raw) | `v_kin` (m/s) | `X_0` (µm, air ~1 atm) |
|---|---|---|---|---|---|---|
| 0 | 6.11 | 1.62e23 | 0.000 | 747.4 | 7.474e-4 | 0.141 |
| −1 | 5.62 | 1.50e23 | 0.010 | 689.4 | 6.894e-4 | 0.141 |
| −2 | 5.17 | 1.38e23 | 0.020 | 635.5 | 6.355e-4 | 0.141 |
| −5 | 4.01 | 1.08e23 | 0.050 | 495.9 | 4.959e-4 | 0.142 |
| −10 | 2.60 | 7.15e22 | 0.102 | 323.8 | 3.238e-4 | 0.144 |
| −15 | 1.65 | 4.63e22 | 0.157 | 207.9 | 2.079e-4 | 0.145 |
| −20 | 1.03 | 2.95e22 | 0.215 | 131.2 | 1.312e-4 | 0.146 |
| −30 | 0.38 | 1.13e22 | 0.340 | 49.3 | 4.93e-5 | 0.149 |
| −40 | 0.13 | 3.99e21 | 0.474 | 17.0 | 1.70e-5 | 0.153 |

Cross-check performed (2026-07-15): closed form at −15 °C gives `(4.63e22/3.1e28) ·
sqrt(1.38e-23·258.15/(2π·3.0e-26))` = 2.053e-4 m/s vs the table's 2.079e-4 — agreement to
≈1.2% (rounding of the quoted constants). The solver computes the form and validates against
these anchors in a unit test.

## 6. `D(T, P)` — vapor diffusivity in air

| What the source states | Value | Citation | Class |
|---|---|---|---|
| Diffusivity in air | `D_air ≈ 2 × 10⁻⁵ m²/s` | monograph Appendix A, printed p. 500 / pdf 501 | P1 |
| Same quantity, main text | "`D_air ≈ 10⁻⁵ m²/s`" for "typical atmospheric conditions" | monograph printed p. 91 / pdf 92 | — (the source's own factor-2 looseness; Appendix A value adopted) |
| Pressure dependence | `D ∼ P⁻¹` | monograph printed p. 65 / pdf 66 | P2 (source-stated kinetic-theory relation, not a direct measurement) |
| Reference-pressure association | adopt the Appendix-A `D_air ≈ 2 × 10⁻⁵ m²/s` value as `D_AIR_1ATM` at exact `P_ATM = 101325 Pa` | operands are the cited approximate `D_air`, the exact CGPM atmosphere definition, and the source-stated `P⁻¹` relation | P2 (project-derived/model-inferred closure) |
| Temperature dependence | **NOT GIVEN — GAP.** | — | — |

**Gap, stated:** no `D(T)` law is printed in either source. Back-computation from Table 2.1's
`X_0` column (`D = X_0·v_kin·c_ice/c_sat`) gives `D ≈ 2.02 × 10⁻⁵ m²/s` at **both** −15 °C and
−40 °C. This supports a temperature-independent working value across the table, but neither
Appendix A nor Table 2.1 explicitly binds that approximate value to exactly 101325 Pa. The solver's
`D_AIR_1ATM` name is therefore the P2 project closure recorded above, not a source transcription.
The solver uses constant `D_air·(P_0/P)` until a cited `D(T)` law is
added; anyone tempted to import a `T^1.94`-style law from other literature must cite it and
log the change here. This matters most for Phase 6 temperature sweeps; at fixed T (the 2b
habit gate) it does not bite at all.

## 7. `chi_0(T, P)` — source-stated latent-heating correction (currently unmodelled)

Recorded 2026-07-26 (pre-freeze). The solver ignores latent heat, and the honest-limits list
in `attachment-kinetics.md` says so — but "ignored" was recorded without its magnitude, and the
source both quantifies it and prints a first-order fix that lives entirely inside the existing
model.

`chi_0` is not currently a solver input, so assigning the section P1 would incorrectly label a
source-stated analytic correction as measured broad-facet kinetics. The approximate anchors and
scaling are contextual source statements outside P1–P4 until an implementation decision classifies
the inputs it actually adopts; any project interpolation remains P4.

Monograph printed p. 98 / pdf 99, verbatim:

> The relevant variable `chi_0` equals about **0.8 at -1 C**, drops to about **0.4 at -10 C**,
> and it continues falling with colder temperatures. If the growth is mainly kinetics-limited,
> then neither particle or heat diffusion matters much (in air at normal pressures).

In the diffusion-limited regime the same page prints the normal growth velocity as the
diffusion-limited attachment coefficient times `v_kin · sigma_inf / (1 + chi_0)` — that is, the
whole heating correction enters as a rescaling of the driving supersaturation:
**`sigma_inf → sigma_inf/(1 + chi_0)`**. (The source's symbol for that coefficient is the
diffusion-limited one, not the Hertz-Knudsen `alphaHK` this repository names; it is spelled out
here rather than abbreviated so the two cannot be confused — Rule 7.) Pressure scaling, printed
p. 98 / pdf 99: `D ∝ 1/P` while `kappa_air` is roughly independent of `P`, so **`chi_0 ~ P⁻¹`**
and heating becomes pronounced at low pressure.

| T (°C) | `chi_0` | Growth overestimated by, if heating is ignored and growth is diffusion-limited |
|---|---|---|
| −1 | ≈ 0.8 | ≈ 80% |
| −10 | ≈ 0.4 | ≈ 40% |
| colder | continues falling | less |

Anchors only — the source prints two values and a trend, not a curve, so any interpolation
between them would be P4 and must be registered before implementation, not assumed. Historical gates at `sigma_infinity = 0.002`
were described as kinetics-limited, but that scalar alone does not bound latent heating: the regime
also depends on the attachment coefficient, `X_0/R`, geometry, and the local field. No executed
dimensionless audit here quantifies the omission. It matters especially for diffusion-limited warm
points. Whether Phase 6 applies the correction as a labelled term or carries a quantified systematic
is a protocol-freeze decision, not a silent one.

## 8. Derived quantities the solver uses (forms, not new data)

- `X_0(T, P) = (c_sat/c_ice)·D/v_kin` — kinetic length; Robin condition scale
  (attachment-kinetics §4.4 component 3). Anchors in the Table 2.1 transcription above.
- `M_ice(T) = c_ice/c_sat(T)` — ice-cell mass in vapor-ledger units (§4.4 component 4).
  ≈ 6.7×10⁵ at −15 °C.

`sigma_water(T)` is retained as a **source-side plausibility diagnostic**, not a solver input:
a cloud of supercooled droplets physically pins the far field at or below water saturation,
but the available fit-difference expression cannot enforce that statement honestly over the
full temperature domain for the reason recorded above.

## Extraction protocol (as executed 2026-07-15; kept for reproducibility)

1. 1910.09067 read in full (pypdf text extraction, 17 pages). Monograph accessed via the
   `research/1910.06389v2-llm` page-text bundle plus targeted 300-dpi page renders
   (`pdftoppm`) for Table 2.1 (image-embedded) and Figures 4.5 / 4.12 (plots).
2. Formulas recorded where printed; measured points where printed; figure digitization used
   only where a quantity exists exclusively as a plot, and labeled as such with uncertainty.
3. Measured-vs-fitted distinction: the CAK curves are the source's own fits ("little more than
   parameterized fits," pdf 146) to [2013Lib]-class measurements → P2. Model-dependent narrow-
   facet inversions support approximate reduction regions; exact Nakaya-informed M1 dips remain P3.
4. Gaps found and stated in the original source pair: no printed CAK σ₀/A closed forms or tables;
   no D(T) law; no full facet-width-dependent SDAK closure. The later currency sweep found the M1
   and M2-branch closed forms now recorded in §4.1a, so the former global "no closed form" statement
   is superseded. The monograph "Appendix B" is referenced
   in the text (printed p. 65 / pdf 66, and printed p. 488 / pdf 489) **but does not exist in
   v2 of the monograph** — Appendix A ends at pdf 502 and the bibliography begins at pdf 503.
   *(Corrected 2026-07-15: this note first also cited printed p. 93, whose "doing the math"
   pointer actually says Appendix A — a mis-cite caught by the round-2 review.)*
5. Magnitude/unit sanity checks recorded inline (Eq. 2.8 mbar confirmation; v_kin closed-form
   vs table; X_0 back-computation).

## Open questions for the extraction (updated 2026-07-26)

- **SDAK-2 (`A_prism`) is recorded but not digitized.** §4.2 now carries the mechanism, its
  restriction (small prism facets above ≈ −10 °C), its supersaturation dependence, and its
  target (sharp-tipped dendrites) from Figure 4.14's caption. No anchor table is extracted,
  because nothing consumes it. Digitizing Figure 4.14 is SDAK work-package work, and it stays
  P3 when it happens.
- **`w_0` in the printed width form (§4.3) is an adjustable model parameter, not a
  measurement.** Any project-chosen value must be registered before evidence production. If it is
  fitted against a comparison, that comparison is in-sample and cannot also serve as held-out
  validation.
- **`chi_0` has two printed anchors and a trend, not a curve** (§7). Interpolating between
  −1 °C and −10 °C would be P4 and must be registered rather than assumed.

- ~~Does the original monograph/1910 extraction pair give `sigma_0` and `A` as continuous functions
  of T?~~ **Answered for that pair: as continuous figures, with no printed functional form.** The
  interpolation between those digitized anchors is therefore P4 and must be pre-registered. Later
  2009/2023 primary papers print separate broad-facet and M1/M2 forms; they do not retroactively turn
  the original digitization into a direct transcription of those forms.
- His numerics largely use reduced (near-cylindrical) geometry (charter §2.7). Do the published
  parameters carry any assumption about that geometry which breaks on a 3D lattice? Partial
  answer from the sources: the CAK curves describe source-fitted *surface-local* kinetics inferred
  from growth measurements on real facets (near-vacuum reduces, but does not erase, diffusion
  systematics — 1910.09067 p. 6); geometry enters through the diffusion modeling used in extraction,
  and 1910.09067 pp. 3, 5–6 documents how
  strongly diffusion effects contaminated historical measurements. The suspicion stands where
  it always did: **the transplanted numbers are only as geometry-free as [2013Lib]'s analysis
  made them.** Worth an hour of suspicion before a week of debugging, unchanged.
- Pressure dependence: **answered at the model level, but the source does not stand behind the
  assumption** (qualified 2026-07-26, pre-freeze; previously recorded as simply "answered").
  The CAK model does assume it — "The CAK model includes an implicit assumption that the
  attachment kinetics does not depend on background gas pressure" (mono printed p. 145 /
  pdf 146) — and pressure enters the solver through `D ∼ P⁻¹` only. But the monograph is
  internally split, and Ch. 7.3's "Well-Behaved-Basal" model states the author's own reading of
  the in-air free-fall data: assuming `sigma_0,basal(T)` is pressure-independent is "a somewhat
  sketchy assumption" and "clearly just a first step toward a final, pressure-dependent model
  of the attachment kinetics", because the analysis "already suggests **rather substantial
  changes in `sigma_0,prism(T)` with air pressure** are required in any future model" (printed
  p. 272 / pdf 273). Ch. 4.8 separately finds no significant pressure dependence in the
  restricted low-`alphaHK` regime (printed pp. 169–171). **This matters here because the
  digitized CAK curves come mostly from low-pressure measurements while the solver grows
  crystals at 1 atm.** Recorded as the stated systematic **"CAK-in-air vs CAK-in-vacuum"**,
  carried in the Phase 6 report beside the full parameterization comparison. The σ₀ crossing above
  remains an input-function discrepancy only; it is neither an `alphaHK` crossing under general
  facet fields nor a morphology target. Class P2.
