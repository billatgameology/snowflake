# Libbrecht parameters — the mapping layer

**Status: EXTRACTED 2026-07-15 (first pass, Phase 2b opening deliverable). Not yet frozen.**
Every numeric entry below carries its citation and provenance class. The two known extraction
limits are stated where they bite: the nucleation-parameter curves are **published only as
figures** (no closed forms, no numeric tables exist in either source), so their numeric anchors
here are figure digitizations with stated method and uncertainty; and `D(T)`'s temperature
dependence is **not given** by the source (gap, recorded below).

This table is the mapping layer from real conditions `(T, σ, P)` into the solver. It is what
replaces curve-fitting with measured physics — the whole substance of decision
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

> **No number enters this file without a citation** — paper, section or figure or table, and page.
> A parameter with no provenance is indistinguishable from a parameter someone tuned until the
> picture looked right, and that is the exact failure this project exists to avoid.
>
> **No number is guessed, interpolated, or recalled from memory.** If a value is not in the
> source, the cell stays empty and the gap is stated. An empty cell is a research task; a wrong
> cell is a physics bug that will be discovered three phases later, if ever.
>
> **Figure digitization is the one sanctioned exception**, used only where the source publishes
> a quantity *exclusively* as a plot: the entry records the figure, the digitization method,
> and a per-point uncertainty, and is class P2 at best. The figure remains the authority; the
> digitized number is a reading of it, checkable by anyone with the source open.

> **This file freezes before the first Phase 6 validation sweep** (charter Phase 6 protocol
> freeze, added v1.2). Post-freeze, any edit to it requires a logged ADR and **invalidates all
> prior sweep results** — the full sweep re-runs. Until that freeze it is a living extraction
> target; after it, it is part of a pre-registered protocol.

## Provenance classes (decision 0005; charter §2.7) — every entry carries one

- **P1 — measured broad-facet kinetics.** Instrument data; record the stated uncertainty.
- **P2 — fitted or inferred.** Record the functional form and its stated domain of validity —
  extrapolating a fit outside its range silently manufactures a fake result. Figure
  digitizations land here, with the digitization uncertainty recorded.
- **P3 — Nakaya-informed SDAK hypotheses.** The narrow-facet dip locations/depths were chosen to
  impose agreement with the morphology diagram (monograph printed p. 152 / pdf 153: "I have
  chosen different values of T_onset for the basal and prism facets **to impose agreement with
  the known ice-growth behaviors from the Nakaya diagram**"). Any Nakaya comparison using P3
  inputs is **in-sample reproduction**, never independent validation.
- **P4 — numerical/discretization choices** (interpolation schemes, resolutions, tolerances).

Consequently this file keeps **two separate branches** — the broad-facet (large-facet)
parameters and a separate SDAK section — never merged, because Phase 6 reports no-SDAK and SDAK
runs separately.

**Canonical units (v1.3):** `sigma_0` and all supersaturations are **dimensionless fractions**
here and in code. Libbrecht's plots and text quote **percent** — every entry below records the
raw cited value with its raw units and the converted fraction. A silently mis-read percent is a
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
| `sigma_water(T) = (c_sat,water − c_sat,ice)/c_sat,ice` (ceiling for physically meaningful `sigma_infinity`) | monograph Eq. 2.9, printed p. 58 / pdf 59 |

Unit check performed on Eq. 2.8 (2026-07-15): `p_ice(273.15 K) = 3.7e10·exp(−22.515) ≈ 6.1` —
matches Table 2.1's `P_ice = 6.11` at 0 °C only if the formula's output unit is **mbar** (=
hPa; 611 Pa is the triple point). The mbar reading is therefore confirmed against the source's
own table. `c_sat = p_ice/(kT)` converts to number density.

## 2. Physical constants (monograph Appendix A, printed pp. 500–501 / pdf 501–502)

| Constant | Value (as cited) | Canonical | Class |
|---|---|---|---|
| `c_ice` (ice number density) | ≈ 3.1 × 10²⁸ m⁻³ | same | P1 (textbook) |
| `rho_ice` | ≈ 917 kg/m³ | same | P1 |
| `m_mol` (water molecule mass) | ≈ 3.0 × 10⁻²⁶ kg | same | P1 |
| `a` (molecule size, `c_ice^(−1/3)`) | ≈ 0.32 nm | 3.2 × 10⁻¹⁰ m | P1 |
| `gamma_sv` (ice/vapor surface energy) | ≈ 106 ± 15 mJ/m² | same | P1 (stated uncertainty) |
| `d_sv` (Gibbs–Thomson length, `gamma_sv/(c_ice·kT)`) | ≈ 1 nm | 1 × 10⁻⁹ m | P2 (derived) |
| `D_air` (water vapor diffusivity in air) | ≈ 2 × 10⁻⁵ m²/s | same | P1 (see §6 caveat) |

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
| 10 | −10 | 1.4 | 0.014 | 1.4 | 0.014 | 1 | 0.95 |
| 15 | −15 | 2.4 | 0.024 | 3.2 | 0.032 | 1 | 1 |
| 20 | −20 | 3.8 | 0.038 | 6 | 0.06 | 1 | 1 |
| 30 | −30 | 7 | 0.07 | 13 | 0.13 | 1 | 1 |
| 50 | −50 | 16 | 0.16 | 32 | 0.32 | 1 | 1 |

Text-cited anchors (not digitized — these are printed numbers, class **P1/P2 per the source's
own framing**):

- `sigma_0 = 3 percent` (fraction 0.03) for a **prism** facet at **−15 °C**, VIG apparatus,
  20 mbar background air — monograph printed p. 144 / pdf 145 (Figure 4.4 discussion). Agrees
  with the digitized 3.2% ± 25% above.
- `A ≈ 1` for basal across **−2 > T > −40 °C**: "unambiguous evidence for nucleation-limited
  growth with A ≈ 1 over the entire temperature range" — 1910.09067 p. 6, citing [2013Lib].
- `A_prism < 1` above ≈ −10 °C: "substantial experimental evidence indicating A < 1 for prism
  facets when the growth temperature is above −10 C" — 1910.09067 p. 4 (which then *sets this
  aside* and assumes A ≈ 1 throughout; the monograph's CAK curves *include* it — Figure 4.5
  lower panel, and the "frustrated QLL kinetics" discussion, printed p. 145–147 / pdf 146–148).

**Source discrepancy, recorded rather than smoothed over:** 1910.09067 Figure 4's caption puts
the raw-measurement σ₀ crossing at **T ≈ −6 °C** (plates above, columns below, at face value);
the monograph's CAK curves (Fig. 4.5, digitized above) cross at **(Tm−T) ≈ 9–10 °C**. The two
sets differ in fit assumptions by the sources' own statements (09067 fits with A ≡ 1; the CAK
model allows A_prism < 1). Whether that fully explains the shift is *our inference, not a
source statement*. **The solver uses the CAK set (the later, fuller synthesis); Phase 6 must
carry this discrepancy as a stated systematic**, and the no-SDAK habit probe should be run
against both crossings before any conclusion about "the model" is drawn.

**Interpolation between anchors is a P4 decision, not physics:** proposed log-linear in
`(Tm−T)` vs `log sigma_0` (the curves are near-straight on the log–log plot above (Tm−T) ≈ 3).
To be pre-registered in the Phase 6 protocol freeze; until then any interpolation used in dev
runs is recorded in the run log.

## 4. Branch 2 — SDAK narrow-facet hypotheses (**P3** — never merged into Branch 1)

Source: monograph Figure 4.12 (printed p. 152 / pdf 153) — dips drawn **dotted** "to signify
their substantial uncertainties"; curves assume edge radius `R_edge ≈ 1–2 µm` ("typical for
snow-crystal growth in air"). 1910.09067 p. 13: "Neither the width nor depth of the dip
structure … is well constrained by measurements"; dip positions set by the premelting onset
temperature per facet, "somewhat constrained by other measurements, but not tightly so." **No
functional form is printed for the dips — figure-only. Documented gap.** Digitized (same
method and uncertainty as Branch 1):

| Facet | Dip minimum | At (Tm−T) | Departs / rejoins large-facet curve | Explains (source's claim) |
|---|---|---|---|---|
| narrow **basal** | σ₀ ≈ 0.07–0.08% (fraction ≈ 0.0007–0.0008) | ≈ 4–4.5 °C (T ≈ −4 to −4.5) | ≈ 2 / ≈ 7–8 | rapid basal growth of hollow-column edges near −5 °C |
| narrow **prism** | σ₀ ≈ 0.18–0.20% (fraction ≈ 0.0018–0.0020) | ≈ 14–16 °C (T ≈ −14 to −16) | ≈ 7–8 / ≈ 25–30 | thin-plate edges near −15 °C |

The reduction is relative to the large-facet curve at the same T: roughly **×6–7 lower**
(basal, at the minimum) and **×15 lower** (prism, at the minimum). All of it is P3: these
curves were drawn to reproduce the Nakaya diagram, and every run using them is in-sample for
Nakaya purposes (charter §2.7; ADR 0005 D1).

`A(T)` under SDAK: the sources modify only `sigma_0`; `A` handling on narrow facets is not
separately specified (gap).

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
| Pressure dependence | `D ∼ P⁻¹` | monograph printed p. 65 / pdf 66 | P1 (kinetic theory) |
| Temperature dependence | **NOT GIVEN — GAP.** | — | — |

**Gap, stated:** no `D(T)` law is printed in either source. Back-computation from Table 2.1's
`X_0` column (`D = X_0·v_kin·c_ice/c_sat`) gives `D ≈ 2.02 × 10⁻⁵ m²/s` at **both** −15 °C and
−40 °C — i.e. **the monograph's own working table treats D as temperature-independent at
1 atm.** The solver does the same (constant `D_air·(P_0/P)`) until a cited `D(T)` law is
added; anyone tempted to import a `T^1.94`-style law from other literature must cite it and
log the change here. This matters most for Phase 6 temperature sweeps; at fixed T (the 2b
habit gate) it does not bite at all.

## 7. Derived quantities the solver uses (forms, not new data)

- `X_0(T, P) = (c_sat/c_ice)·D/v_kin` — kinetic length; Robin condition scale
  (attachment-kinetics §4.4 component 3). Anchors in the Table 2.1 transcription above.
- `M_ice(T) = c_ice/c_sat(T)` — ice-cell mass in vapor-ledger units (§4.4 component 4).
  ≈ 6.7×10⁵ at −15 °C.
- `sigma_water(T)` — the physically meaningful ceiling for `sigma_infinity` (a cloud of
  supercooled droplets pins the far field at or below water saturation): Table 2.1 column.

## Extraction protocol (as executed 2026-07-15; kept for reproducibility)

1. 1910.09067 read in full (pypdf text extraction, 17 pages). Monograph accessed via the
   `research/1910.06389v2-llm` page-text bundle plus targeted 300-dpi page renders
   (`pdftoppm`) for Table 2.1 (image-embedded) and Figures 4.5 / 4.12 (plots).
2. Formulas recorded where printed; measured points where printed; figure digitization used
   only where a quantity exists exclusively as a plot, and labeled as such with uncertainty.
3. Measured-vs-fitted distinction: the CAK curves are the source's own fits ("little more than
   parameterized fits," pdf 146) to [2013Lib]-class measurements → P2; SDAK dips are
   Nakaya-informed hypotheses → P3, per the source's own language.
4. Gaps found and stated: no printed σ₀/A closed forms or tables (figure-only); no D(T) law;
   no SDAK functional form; no narrow-facet A treatment; monograph "Appendix B" is referenced
   in the text (e.g. printed p. 65, p. 93) **but does not exist in v2 of the monograph** —
   Appendix A ends at pdf 502 and the bibliography begins at pdf 503.
5. Magnitude/unit sanity checks recorded inline (Eq. 2.8 mbar confirmation; v_kin closed-form
   vs table; X_0 back-computation).

## Open questions for the extraction (updated 2026-07-15)

- ~~Does Libbrecht's model give `sigma_0` and `A` as continuous functions of T?~~ **Answered:
  as continuous *curves* (figures), with no printed functional form.** The interpolation
  scheme between digitized anchors is therefore P4 and must be pre-registered before Phase 6
  sweeps (proposal: log–log linear; see Branch 1).
- His numerics largely use reduced (near-cylindrical) geometry (charter §2.7). Do the published
  parameters carry any assumption about that geometry which breaks on a 3D lattice? Partial
  answer from the sources: the CAK curves describe *surface-local* kinetics measured on real
  facets (near-vacuum, so diffusion systematics are small — 1910.09067 p. 6); geometry enters
  through the diffusion modeling used in extraction, and 1910.09067 pp. 3, 5–6 documents how
  strongly diffusion effects contaminated historical measurements. The suspicion stands where
  it always did: **the transplanted numbers are only as geometry-free as [2013Lib]'s analysis
  made them.** Worth an hour of suspicion before a week of debugging, unchanged.
- Pressure dependence: **answered at the model level** — "The CAK model includes an implicit
  assumption that the attachment kinetics does not depend on background gas pressure" (mono
  printed p. 145 / pdf 146); pressure lives in `D ∼ P⁻¹` only. Recorded as a model assumption,
  P2.
