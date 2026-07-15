# Libbrecht parameters — the mapping layer

**Status: EMPTY. This is the first concrete deliverable of Phase 2b, and it is not yet done.**

This table is the mapping layer from real conditions `(T, σ, P)` into the solver. It is what
replaces curve-fitting with measured physics — the whole substance of decision
[0003](decisions/0003-libbrecht-attachment-kinetics.md). Used by
[attachment-kinetics.md](attachment-kinetics.md).

**Primary source:** K. Libbrecht, "A quantitative physical model of the snow crystal morphology
diagram," arXiv:1910.09067 — `research/1910.09067v2.pdf`. For the **standard kinetic-theory
forms — `v_kin(T)` and `D(T, P)` — the Snow Crystals monograph (arXiv:1910.06389,
`research/1910.06389v2.pdf`) is a valid citation source** (charter §3.2 Phase 2b, amended v1.2;
the previous single-source rule would have blocked textbook constants). The nucleation
parameters `sigma_0(T)` and `A(T)` come from arXiv:1910.09067.

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
> Deliberately left blank rather than filled with plausible values, 2026-07-14.

> **This file freezes before the first Phase 6 validation sweep** (charter Phase 6 protocol
> freeze, added v1.2). Post-freeze, any edit to it requires a logged ADR and **invalidates all
> prior sweep results** — the full sweep re-runs. Until that freeze it is a living extraction
> target; after it, it is part of a pre-registered protocol.

## Provenance classes (decision 0005; charter §2.7) — every entry carries one

- **P1 — measured broad-facet kinetics.** Instrument data; record the stated uncertainty.
- **P2 — fitted or inferred.** Record the functional form and its stated domain of validity —
  extrapolating a fit outside its range silently manufactures a fake result.
- **P3 — Nakaya-informed SDAK hypotheses.** The narrow-facet dip locations/depths were chosen to
  impose agreement with the morphology diagram (monograph; extraction p. 153). Any Nakaya
  comparison using P3 inputs is **in-sample reproduction**, never independent validation.
- **P4 — numerical/discretization choices** (interpolation schemes, resolutions, tolerances).

Consequently this file keeps **two separate branches** — the broad-facet (large-facet)
parameters and a separate SDAK section — never merged, because Phase 6 reports no-SDAK and SDAK
runs separately.

**Canonical units (v1.3):** `sigma_0` and all supersaturations are **dimensionless fractions**
here and in code. Libbrecht's tables often quote **percent** — record the raw cited value and
its raw units alongside the converted one, and show the conversion. A silently mis-read percent
is a **100× error inside `exp(−sigma_0/sigma_surf)`** — the single easiest way to destroy the
model while every individual number "looks right." Pressure: record raw units, canonicalize to
Pa.

## What must be extracted

### Branch 1 — broad-facet `sigma_0(T)` and `A(T)` — nucleation parameters, per facet family

Feeds `alphaHK = A · exp(−sigma_0 / sigma_surf)`. The **basal/prism crossing in `sigma_0(T)` is
the mechanism behind the Nakaya flip** (attachment-kinetics §2) — so the temperature resolution
here directly determines whether Phase 6 can test the flip at all. Extract densely enough around
the reversals (≈ −2, −5, −15, −30 °C) that the crossings are actually resolved.

| T (°C) | `sigma_0_basal` (fraction) | `A_basal` | `sigma_0_prism` (fraction) | `A_prism` | Raw value + units as cited | Uncertainty | Measured or fitted | Class (P1/P2) | Citation |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

### Branch 2 — SDAK narrow-facet hypotheses (P3 — kept separate, never merged into Branch 1)

The width-dependent dips: locations, depths, and functional forms, with citations. These are
**hypotheses whose shapes were informed by the Nakaya diagram itself** — extract them faithfully,
label them P3, and remember what that label means: runs using them are in-sample for Nakaya
purposes (charter Phase 6). Record for each: the facet family, the dip's T-location and depth,
the functional form, the paper's own stated uncertainty or caveats, and the citation.

| Facet | Dip location T (°C) | Depth / form | Raw values + units as cited | Stated uncertainty / caveats | Citation |
|---|---|---|---|---|---|
| | | | | | |

Record also: is `A(T)` treated as constant in Libbrecht's model, or does it vary? Is `sigma_0`
given as a formula or a table of measured points? **If it is a fit, record the fit's functional
form and its stated domain of validity** — extrapolating a fit outside its range is a silent way
to manufacture a fake result.

### `v_kin(T)` — kinetic velocity

| T (°C) | `v_kin` (m/s) | Citation |
|---|---|---|
| | | |

Expect a closed form (from kinetic theory: proportional to the saturated vapor pressure over the
ice density, times the mean thermal speed). **Record the closed form, not just sampled values** —
the solver should compute it, not interpolate a table.

### `D(T, P)` — vapor diffusivity in air

| T (°C) | P | `D` (m²/s) | Citation |
|---|---|---|---|
| | | | |

Sets the diffusion-limited ↔ kinetics-limited balance (charter §2.4), so it is also the knob
behind the "low pressure ⇒ simple compact facets" behavior the slice-plane view is meant to
reveal. Needed with units for the `n_diff` derivation in attachment-kinetics §4.3.

> **Sanity anchor, NOT a value to use:** water vapor in air near 0 °C and 1 atm is *of order*
> `2 × 10⁻⁵ m²/s`. This is written here **only** as a smell test for whatever gets extracted — if
> the cited value lands orders of magnitude away, something is wrong with the units. It is
> unverified, uncited, and **must not be copied into the code.** Delete this note once a real
> cited value is in the table above.

## Extraction protocol

1. Work from `research/1910.09067v2.pdf`; for `v_kin` and `D`, the monograph
   (`research/1910.06389v2.pdf`) is also valid — see the source note above. Cite source,
   section/figure/table, and page for every value.
2. Where the paper gives a formula, record the **formula** and its domain of validity. Where it
   gives measured points, record the points and their stated uncertainty.
3. Record what is *measured* versus what Libbrecht himself *fit or assumed* — that distinction
   propagates directly into charter §1.5 confidence levels, and it is the difference between the
   model's error bars being real and being decorative.
4. Note every gap explicitly. Gaps are expected: §2.7 says nobody has closed this loop, so the
   parameters will not all be sitting there waiting. **A documented gap is a finding.** A gap
   quietly filled with a plausible number is a fabrication, and it would invalidate Phase 6
   without anyone noticing.
5. Sanity-check magnitudes and units before anything is wired into the solver.

## Open questions for the extraction

- Does Libbrecht's model give `sigma_0` and `A` as continuous functions of T, or only at the
  temperatures he measured? If only at measured points, **what interpolation does Phase 6 use, and
  does interpolating between them beg the very question Phase 6 asks?** Decide before sweeping,
  not after seeing the results.
- His numerics largely use reduced (near-cylindrical) geometry (charter §2.7). Do the published
  parameters carry any assumption about that geometry which breaks when they are transplanted onto
  a 3D lattice? **This is the single most likely way the hybrid fails quietly**, and it is worth
  an hour of suspicion before it is worth a week of debugging.
- Is there a pressure dependence in `sigma_0` or `A`, or only in `D`?
