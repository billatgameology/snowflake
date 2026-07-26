# The Nakaya morphology diagram — derived reference measurements

**Status: digitized 2026-07-26 (Phase 6 WP1). Type: derived measurement from a published
figure. Evidence: measured pixel positions with stated method and uncertainty; the figure is
the authority and anyone can re-read it.** Nothing here is gate evidence by itself. Under
[decision 0004](../docs/decisions/0004-research-media-not-versioned.md) the page renders are not
versioned, so what Phase 6 uses is *this file* — derived, citable numbers — not an image.

**Source.** K. Libbrecht, "Toward a comprehensive model of snow crystal growth dynamics: 1.
Overarching features and physical origins," arXiv:1211.5555v1, **Figure 1, printed page 2 /
pdf page 2**. Local copy `research/1211.5555v1.pdf`, SHA-256
`56a1fe58167674455d776d63c04ddde5203c3776c168f44fd092b7cedf0b6d49` (830,702 bytes); the page
render measured here is `research/1211.5555v1/page-0002.png`, SHA-256
`c432ec04eb158524a6f3f1734f6eb744ff092ef63014b833d4460d068a0f3c90` (1,095,736 bytes). Both are
gitignored; the hashes make them re-verifiable.

Caption, verbatim:

> Figure 1: The Nakaya snow crystal morphology diagram, showing different types of snow crystals
> that grow in air at atmospheric pressure, as a function of temperature and water vapour
> supersaturation relative to ice. The water saturation line gives the supersaturation of
> supercooled water, as might be found within a dense cloud. Note that the morphology switches
> from plates (T ≈ −2 C) to columns (T ≈ −5 C) to plates (T ≈ −15 C) to predominantly columns
> (T < −30 C) as temperature is decreased. Temperature mainly determines whether snow crystals
> will grow into plates or columns, while higher supersaturations generally produce more complex
> structures.

---

## What this figure is, and is not

It is a **redrawn schematic** of natural, free-falling crystals — not a controlled measurement
grid. Two measurements below establish how far that can be trusted, and they point in opposite
directions: its **temperature axis survives an independent check**, while its **supersaturation
axis does not**. Phase 6 therefore uses the boundary temperatures and does not use the printed
σ values as targets.

## Method

300-dpi page render; the plot panel located by its light-blue field; axis lines located as the
longest ink runs; tick marks located as stubs pointing away from each axis (**down** from the
temperature axis, **left** from the supersaturation axis).

**The temperature axis is not uniform, and this is the single most important methodological
finding.** Measured tick spacings, in pixels, between the printed labels 0, −5, −10, −15, −20,
−25, −30, −35:

| interval | 0→−5 | −5→−10 | −10→−15 | −15→−20 | −20→−25 | −25→−30 | −30→−35 |
|---|---|---|---|---|---|---|---|
| pixels | 203.5 | 174.0 | 164.5 | 150.5 | 145.5 | 128.5 | 115.0 |

A 1.77× compression from the warm end to the cold end. No functional model fits it: a linear
axis leaves a 49.5 px residual (≈ 1.6 °C), and power-law and logarithmic models are worse. The
axis is *drawn*, not metric. **Calibration is therefore piecewise linear between the labelled
ticks themselves** — exact at every label, and claiming nothing about the axis between labels
beyond monotone interpolation. Anyone who calibrates this figure with a single linear fit will
misplace every boundary by up to ~1.6 °C.

The supersaturation axis is nearly uniform — spacings 277.0, 276.0, 265.0 px for 0.3→0.2→0.1→0
— and is calibrated the same piecewise way.

The water-saturation curve was traced as the longest connected component of thin ink inside the
plot frame, which assumes nothing about where the curve should lie. It resolves continuously
from **−9.5 °C to −35.0 °C** (723 columns); warmer than −9.5 °C the curve is crossed by crystal
drawings and is not traced.

## Result 1 — the habit-regime boundaries

The three dashed vertical boundaries, located as the columns with both the highest ink density
and near-full vertical spread (0.96–0.98 of the plot height):

| Boundary | Measured T | Regime below it (warmer) | Regime above it (colder) |
|---|---|---|---|
| 1 | **−3.3 °C** | Plates | Columns |
| 2 | **−9.9 °C** | Columns | Plates |
| 3 | **−21.5 °C** | Plates | Columns and Plates |

**Read uncertainty: ±0.5 °C.** That covers the dashed line width (≈ 6 px ≈ 0.15–0.2 °C at the
local scale) and calibration wobble between labelled ticks; it does *not* cover the fact that
the underlying physical transition is not sharp, which is a property of nature and of this
being a schematic, not of the reading.

The figure's own regime labels across the top read **Plates | Columns | Plates | Columns and
Plates**, matching the caption's "plates → columns → plates → predominantly columns" and the
charter's falsifiable test.

## Result 2 — the water-saturation cross-check (the reason to trust the T axis and distrust the σ axis)

The printed water-saturation curve is a known physical function of temperature, so digitizing it
tests our own reading of the axes against the source's own ink. Comparison quantities come from
`core/src/libbrecht.ts` (`sigmaWater`, `cSat`, `M_MOL`), converted to the figure's units by
`excess [g/m³] = σ_water(T) · c_sat(T) · m_molecule · 1000`.

**Peak position — agreement.** The digitized curve peaks at **T = −14.09 °C**; our computed
curve peaks at **T = −14.35 °C**. Agreement to **0.26 °C** on a quantity the calibration never
saw. This is what licenses using the boundary temperatures above.

**Peak amplitude and scale — disagreement, and a constant one.** The digitized curve peaks at
**0.142 g/m³** against our computed **0.192 g/m³**. Across −10 to −30 °C the ratio
figure/ours is **0.724 ± 0.030** — flat within 3% while the quantity itself varies threefold,
which makes it a **scale factor, not scatter or a shape error**:

| T (°C) | −10 | −12 | −14 | −16 | −18 | −20 | −22 | −25 | −28 | −30 |
|---|---|---|---|---|---|---|---|---|---|---|
| figure (g/m³) | 0.1268 | 0.1371 | 0.1419 | 0.1413 | 0.1370 | 0.1301 | 0.1219 | 0.1072 | 0.0915 | 0.0802 |
| ours (g/m³) | 0.1760 | 0.1879 | 0.1922 | 0.1905 | 0.1844 | 0.1752 | 0.1638 | 0.1445 | 0.1244 | 0.1112 |
| ratio | 0.721 | 0.730 | 0.738 | 0.742 | 0.743 | 0.743 | 0.744 | 0.742 | 0.736 | 0.721 |

Refereed against an independent standard the solver does not use — Murphy & Koop (2005) — the
figure runs **30–42% low**:

| T (°C) | ours (g/m³) | Murphy-Koop (g/m³) | figure (g/m³) | figure / Murphy-Koop |
|---|---|---|---|---|
| −10 | 0.1760 | 0.2187 | 0.1268 | 0.580 |
| −15 | 0.1920 | 0.2184 | 0.1419 | 0.650 |
| −20 | 0.1752 | 0.1905 | 0.1301 | 0.683 |
| −25 | 0.1445 | 0.1527 | 0.1072 | 0.702 |
| −30 | 0.1112 | 0.1152 | 0.0802 | 0.696 |

## Result 3 — the σ_water difference form, re-measured (a known limitation, not a new one)

The same referee run checked `core/src/libbrecht.ts` against Murphy & Koop (2005). `pSatIce` is
excellent — within **0.8%** at every temperature checked (262.08 vs 259.89 Pa at −10 °C;
166.67 vs 165.29 at −15; 38.33 vs 38.01 at −30). The **water-minus-ice difference form runs
5–20% low**, worst on the warm side.

**This is already known and pinned**, not a discovery: `core/test/libbrecht.test.ts` records
that the form "even goes NEGATIVE" at −1 °C (−0.009146 computed against Table 2.1's +0.010),
that it is ~20% off at −10 °C, and it asserts those deviations so "the limitation cannot
silently un-happen". The measurements here extend that record with an independent standard and
add the warm-end shape: our value is **−0.0138 at −0.5 °C, −0.0092 at −1, 0.00029 at −2** —
i.e. the form is unusable warmer than about −3 °C, since the supersaturation of supercooled
water over ice is strictly positive for every T < 0 °C.

The consequence is a design constraint, and it lands in the Phase 6 protocol rather than here:
a σ ladder defined as a fraction of water saturation cannot be computed from that difference
form. It is computed from the monograph's **own Table 2.1 σ_water anchors** instead — printed
source values, which Murphy-Koop independently confirms to within about 1% (Table 2.1 gives
0.010, 0.020, 0.050, 0.102, 0.157 at −1, −2, −5, −10, −15; Murphy-Koop gives 0.0098, 0.0197,
0.0498, 0.1022, 0.1574). No accepted evidence is affected either way: `sigmaWater` is a
source-side plausibility diagnostic and no solver or gate consumes it.

## Rules for using these numbers

1. **Ordinal claims only.** The comparison Phase 6 makes against this figure is the *reversal
   sequence* and the *boundary temperatures*, which is precisely what charter §2.3 asks for:
   "the model does not need to reproduce it quantitatively, but it must be able to move across
   it qualitatively."
2. **Do not use the printed σ values as targets.** They carry a measured ~28% scale offset
   against our own functions and 30–42% against Murphy-Koop. Any σ read from this figure is
   quoted with that systematic attached, or not quoted.
3. **Do not calibrate this figure linearly.** The temperature axis is non-uniform by 1.77×
   end-to-end; use the piecewise tick calibration recorded above.
4. **This is a different diagram from Libbrecht's Figure 8.16 e-needle grid**
   (`lab-validation-dataset.md`). The two are never merged: this one is free-falling natural
   crystals and supports the qualitative report card; that one is controlled measurements in our
   own geometry class and is the quantitative target, once its own ADR-level questions are
   settled. `docs/monograph-review.md` warns that comparing against the wrong one "would
   manufacture false disagreement".
5. **The measuring script is not retained** (project precedent for one-off probes). What makes
   this reproducible is recorded above instead: the panel/axis detection rule, the exact tick
   pixel positions, and the piecewise calibration. Recovering the same boundaries from those is
   arithmetic.
6. **Re-verification.** These are pixel measurements made by one session from a 300-dpi render.
   The boundaries and the curve peak were each confirmed by two independent signals (ink density
   plus vertical spread; peak position plus scale ratio). Anyone re-reading the figure should
   reproduce the tick spacings in the method table first — if those differ, the render or the
   panel detection differs and nothing below it holds.
