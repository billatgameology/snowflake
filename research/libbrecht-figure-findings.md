# What the figures say — reading the ten Libbrecht papers as images

> # ⚠ RETRACTION — §1's structural claim is WRONG (2026-07-29)
>
> An adversarial audit refuted the central claim of §1, and I have reproduced the refutation
> independently. **Do not cite §1's "structural bound" or the phrase "no broad-facet
> parameterization can express three habit boundaries."** Two separate errors:
>
> **1. The bound was computed on the wrong quantity.** Habit depends on the ordering of
> `alphaHK = A·exp(−σ₀/σ_surf)`, which carries `A_prism`. §1 counted crossings of **σ₀ alone**, and
> `app/scripts/phase6-libbrecht-closed-forms.mjs` fed its crossing finder only the σ₀ pair, silently
> discarding `A_prism`. Recomputed with `A_prism` included, the printed `2009.08404v2` broad-facet
> set has **THREE** αHK crossings for σ_surf ≈ 0.199–0.399 %, alternating plate/column/plate/column.
> The registered `CAK` set likewise has three for σ_surf ∈ [0.00247, 0.00366] — **and 2 of the 204
> sweep points sit inside that band.** So there is no bound of one, and it is not "independent of
> diffusion": the count is a function of σ_surf, which diffusion sets.
>
> **2. `log` in the M1 dip formulas is base-10, not natural.** Using `Math.log` gave five crossings
> at 3.70/6.25/8.46/9.93/18.62. With `log10` as printed there are **three**, at
> **3.08 / 8.07 / 24.73** — much closer to the reference boundaries 3.3 / 9.9 / 21.5 than the number
> I published.
>
> **What still stands.** The sweep's measured numbers are unaffected. Along the sweep's own
> constant-`f` ladders the αHK reversal count is 1 at f = 0.10 and 0 at every larger `f` — never 3 —
> so the model *as actually run* still produces at most one transition, and "this parameterization
> does not reproduce the Nakaya diagram" survives. What is refuted is the **necessity** argument:
> that no broad-facet model *could*. That was the strongest thing I claimed and it is not true.
>
> §9's probes and §10's source quotes are separately qualified below; see also the audit's finding
> that §10.1's ρ_aspect comparison is cherry-picked (the sweep's −5 °C row has 3 of 6 points above
> ρ > 1 and none a plate, while §10.1 shows only the isometric point).

`research/libbrecht-later-papers.md` obtained ten papers and stated plainly that their "contents
are unread except where noted". This document is the reading. It is separate from that index
because the index records *what was obtained* and this records *what it says*.

**Why images and not text extraction.** This project's entire σ₀ anchor set was digitized from a
figure. Text extraction returns axis labels and loses the data, so the pages below were read as
300 dpi renders (`research/<id>/page-NNNN.png`), not as extracted text.

**Discipline.** Every number is either (a) quoted verbatim from a printed sentence or equation
with its page, or (b) computed from such a printed equation by
[`app/scripts/phase6-libbrecht-closed-forms.mjs`](../app/scripts/phase6-libbrecht-closed-forms.mjs),
which transcribes each constant beside its page citation and can be re-run. **No value here was
read off a plotted curve.** Where a quantity exists only as plotted data, it is recorded as
requiring digitization and no number is given.

**Nothing here has been read into a frozen artifact.** The Phase 6 parameter table and protocol
are frozen and a 204-point sweep has run against them. Charter §3.2 Phase 6 item 1: *"Any
post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior sweep
results — the full sweep re-runs."* Acting on any of this is an ADR-level decision.

---

## 1. The headline: a broad-facet model cannot express the Nakaya diagram, and this is structural

A habit boundary requires the basal and prism attachment coefficients to swap order — that is, a
σ₀ crossing. So **the number of σ₀ crossings is a hard upper bound on the number of habit
transitions a model can produce**, independent of diffusion, grid spacing, seed shape, far-field
condition, or domain size.

Computed from the printed closed forms:

| model | crossings | at (Tm−T) °C |
|---|---|---|
| this project's digitized anchors | **1** | 10.00 |
| `2306.13087v1` M2, broad facets (p7) | **1** | 8.39 |
| `2009.08404v2` Eq. (2)/(3), broad facets (p3) | **1** | 10.92 |
| `2306.13087v1` M1, **with both SDAK dips** (p6) | **5** | 3.70, 6.25, 8.46, 9.93, 18.62 |

The digitized Nakaya diagram has **three** boundaries (3.3, 9.9, 21.5). Every broad-facet
parameterization ever printed for this model yields **one** crossing, all three landing between
−8.4 and −10.9 °C. The two SDAK dips are what supply the rest.

**This explains the WP2 sweep result at the level of mechanism.** The sweep scored 5/90, with
`columns` 0/24 and `plates-cold` 0/60, and each failing band contains exactly one SDAK dip:

| Nakaya band | sweep | SDAK dip centre, printed |
|---|---|---|
| `plates-warm` T > −3.3 | 5/6 | — (no dip; the one band we reproduce) |
| `columns` −3.3…−9.9 | **0/24** | basal dip at log(4.5) → **−4.5 °C** |
| `plates-cold` −9.9…−21.5 | **0/60** | prism dip at log(14.4) → **−14.4 °C** |

ADR 0025 registered the structural argument pre-sweep — *"the reference has three, and a single
monotone σ₀ crossing can produce at most one"* — so this is a confirmation of a registered
expectation, not a post-hoc rationalisation. What the figures add is **which** transitions are
missing and **why**, by name and temperature.

Libbrecht states the anisotropy requirement directly (`2306.13087v1` p4):

> "thin snow-crystal plates only form when 𝛼_basal ≪ 𝛼_prism, while slender columns only appear
> when 𝛼_prism ≪ 𝛼_basal. **Neither diffusion-limited growth nor surface-energy effects produce
> growing snow crystals with high overall aspect ratios.**"

Note **≪**, not <. This is the printed source of a lesson Phase 6 learned by measurement twice:
an α ratio above 1 marks where one habit stops, not where the other starts.

**Figure 1 of `2306.13087v1` (p6) draws the Nakaya habit bands directly onto the σ₀(T) plot** —
`plates | columns | thin plates | columns`, separated at (Tm−T) ≈ 3, 8, 25 — with the band edges
at the curve crossings. The claim that the crossing structure *is* the morphology mechanism is
the source's own, not an inference drawn here.

---

## 2. A printed closed form for `A_prism`, and an independent check on our digitization

`2009.08404v2` p3 prints the broad-facet model in full — the first printed closed form for
`A_prism` this project has had:

```
σ₀,basal(T*) = 0.02·T*^1.75 + 0.3                            (2)
σ₀,prism(T*) = 0.02·T*^1.9 − 0.025(T* − 0.3)                 (3)
A_basal      = 1                                             (4)
A_prism      = (0.4 + 0.04·|T*−4|³) / (2.2 + 0.04·|T*−4|³)   (5)
```

`T*` is the magnitude of (Tm − T) in °C; σ₀ in percent. Evaluating Eq. (5) at the anchor
temperatures of `A_PRISM_CAK` in `core/src/libbrecht.ts`:

| (Tm−T) | 1 | 2 | 3 | 5 | 10 | 15 | 20 | 30 | 50 |
|---|---|---|---|---|---|---|---|---|---|
| ours (digitized) | 0.45 | 0.28 | 0.21 | 0.18 | 0.83 | 1 | 1 | 1 | 1 |
| Eq. (5) | 0.4512 | 0.2857 | 0.1964 | 0.1964 | 0.8339 | 0.9675 | 0.9892 | 0.9974 | 0.9995 |
| deviation | −0.27% | −2.00% | +6.91% | **−8.36%** | −0.47% | +3.36% | +1.10% | +0.26% | +0.05% |

Worst 8.4%, typically under 2%. **The digitization reproduces the printed closed form.** This is
an independent check on the digitization method that the project never had, and it raises
`A_prism`'s provenance above "read off a figure".

### It also bounds the `paramSet` mismatch

Caption to Figure 2, `2009.08404v2` p3:

> "The present paper focuses on temperatures between -10 C and -30 C, **where 𝐴_basal ≈ 𝐴_prism
> ≈ 1**."

So in the `plates-cold` band (−9.9…−21.5 °C), `CAK` and `CAK_A1` are the *same model* — Eq. (5)
gives 0.968 at (Tm−T)=15. **The registered-vs-executed `A_prism` mismatch cannot explain 0/60
there.** It can only bite between roughly −2 and −9 °C, which is where the −8 °C spot-check moved
plate → neutral (AR 0.5789 → 0.7895).

And the executed `CAK_A1` choice matches M1's own documented simplification (`2306.13087v1` p6):

> "To keep M1 relatively simple, we chose to set 𝐴 = 1 in Equation 3 for all growth conditions,
> even though our data suggest that this is not entirely accurate for broad prism facets at high
> temperatures. In air, however, narrow prism facets do exhibit 𝛼 → 1 at high growth rates.
> Setting 𝐴 = 1 for all prism facets should not yield horribly inaccurate results, therefore, and
> it substantially reduces the overall complexity of this starter model."

This does not excuse `paramSet` being absent from the 24 freeze rows — that is a real governance
defect and still needs its ADR. But it changes the finding from "the sweep ran the wrong model"
to "the sweep ran a defensible model for an unregistered reason."

---

## 3. Two different printed σ₀,prism closed forms by the same author — and which one measurement supports

`2009.08404v2` Eq. (3) and `2306.13087v1` M2 (p7) are both printed, both by Libbrecht, and they
disagree — by 14× at (Tm−T) = 1, converging to ≈0.88 above 8:

| (Tm−T) | 1 | 2 | 3 | 5 | 10 | 20 | 40 |
|---|---|---|---|---|---|---|---|
| `2009.08404v2` Eq. (3) | 0.0025 | 0.0321 | 0.0938 | 0.3082 | 1.3462 | 5.4366 | 21.1356 |
| `2306.13087v1` M2 | 0.0350 | 0.0903 | 0.1737 | 0.4275 | 1.5796 | 6.1207 | 24.1829 |

Against the dedicated measurement papers, the full `2009.08404v2` Eq. (2)–(5) set is
self-consistently the closer one:

| quantity | T | measured | source | Eq. (2)/(3)/(5) | M2 |
|---|---|---|---|---|---|
| σ₀,prism | −2 °C | 0.03% | `2004.06212v1` | 0.0321% (**×1.07**) | 0.0903% (×3.01) |
| σ₀,prism | −5 °C | ≈0.2% | `1912.03230v1` | 0.3082% (×1.54) | 0.4275% (×2.14) |
| A_prism | −2 °C | 0.25 | `2004.06212v1` | 0.2857 (×1.14) | — (M1/M2 set A ≡ 1) |
| A_prism | −5 °C | ≈0.2 | `1912.03230v1` | 0.1964 (**×0.98**) | — |
| σ₀,basal | −2 °C | 0.4% | `2004.06212v1` | 0.3673% (×0.92) | same Eq. (2) |
| σ₀,basal | −5 °C | 0.7% | `1912.03230v1` | 0.6344% (×0.91) | same Eq. (2) |

**This corroborates the earlier finding that M2 is the outlier at the warm end**, and identifies
which printed form to prefer if the project ever replaces its digitized table:
`2009.08404v2` Eqs. (2)–(5), as a set.

Libbrecht's own hedge on the warm prism regime (`2306.13087v1` p7):

> "The physical nature of the attachment kinetics on prism facets above -3 C remains somewhat
> puzzling, so it seemed prudent not to overthink M1 too much in this growth regime."

---

## 4. Correction to `research/2306.13087v1.md`

That file records:

> "**M2 — broad facets, the SAME curves WITHOUT the dips.** This is exactly our no-SDAK case."

**The second sentence is wrong and the error is consequential.** M2 is the *width-dependent*
model, not a no-SDAK model. From p7:

> "As the next step after M1, an improved model (call it M2) could incorporate an attachment
> kinetics that depend on the widths of the respective faceted surfaces."

In M2 the undipped curves are the **broad-facet branch only**; narrow facets keep the dipped
kinetics, because M1's dipped curves *are* the narrow-facet kinetics (p7):

> "it is a reasonable first approximation to assume that all faceted surfaces are described by the
> attachment kinetics on narrow facets."

And the broad branch barely applies in air (p7):

> "the Edge-Sharpening Instability (ESI) [2021Lib, 2017Lib] is quite efficient in air, quickly
> turning broad facets into narrow facets during growth. In the observations presented below, we
> see that many fast-growing snow crystal morphologies do not contain any broad faceted surfaces."

**Consequence.** The conclusion recorded as "M2 closed forms cannot improve the headline —
re-sweep not warranted" was measured against M2's broad-facet branch, i.e. the branch the ESI
removes. The conclusion may still hold, but its stated basis does not support it, and the
sensitivity should be re-registered against the M1 (dipped) curves instead.

---

## 5. The SDAK branch is measured, not merely hypothesised

Two dedicated papers measure the narrow-facet σ₀ directly. Both plot data points with error bars;
**the values exist only as plotted data and are not transcribed here** — extracting them is a
digitization task.

| dip | paper | figure | span | condition |
|---|---|---|---|---|
| basal, centred ≈ −4 °C | `2011.02353v1` | Fig. 5, p7 | −1…−10 °C | σ∞ ≈ 8% |
| prism, centred ≈ −13/−14 °C | `2009.08404v2` | Fig. 18, p15 | −5…−40 °C | σ_far = 32% |

`2011.02353v1` Fig. 5 caption:

> "Measurements of the basal SDAK parameter 𝜎₀,basal,SDAK as a function of temperature, revealing
> a substantial 'SDAK dip' centered near -4 C."

`2009.08404v2` Fig. 18 caption:

> "Measured values of 𝜎₀,prism,SDAK(𝑇) (data points) obtained from growth measurements taken at
> 𝜎_far = 32%. The dotted line was drawn to guide the eye"

### Limits these papers state about their own SDAK numbers

- **The prism curve was measured at one supersaturation.** σ_far = 32% only; any σ-dependence of
  the SDAK branch is unmeasured by that data set.
- **The functional form fails at the peak** (`2009.08404v2` p15): *"The measurements near the peak
  at -14 C do not fit the simple exponential functional form, but the fit is reasonable on either
  side of the peak."*
- **And the reduction to a single parameter is stated as inadequate there** (p15): *"The full data
  set indicates, however, that this simple picture of 𝜎₀,prism,SDAK(𝑇) is not adequate to fully
  describe the growth behavior near -14 C … when the SDAK effect is especially strong."*
- **SDAK has two sub-effects, and the basal measurement deliberately isolates one** (`2011.02353v1`
  p7): *"I found that the SDAK-2 effect could be avoided by observing the growth of ice needles in
  air under conditions with 𝜎∞ ≈ 8 percent"*. So Fig. 5 characterises SDAK-1 with SDAK-2
  suppressed by construction.
- **The dotted lines in both figures are eye guides**, not fits — so there is no printed closed
  form for either SDAK branch in these two papers. M1's dip factors (`2306.13087v1` p6) are the
  printed forms, and they are described as *"completely ad hoc"* in shape.

`2306.13087v1` p5 also states SDAK's epistemic status plainly:

> "We still treat the SDAK phenomenon as a working hypothesis … the SDAK phenomenon provides the
> only viable option currently available that can adequately explain the Nakaya diagram together
> with a plethora of other ice-growth data."

---

## 6. Two systematics this project defers, addressed by the source

**Latent heating** (`2306.13087v1` p5) — the project currently does not apply it and records it as
an unapplied systematic. Libbrecht makes the same choice and says why:

> "For snow crystal growth in air, thermal effects are generally negligible below -10 C, becoming
> progressively more important as one approaches the melting point. Moreover, a rescaling of the
> far-away supersaturation 𝜎∞ can be used to approximate the thermal effects to a reasonable
> approximation. For this reason, I will ignore latent heating and thermal diffusion for the
> remainder of this paper."

This supports the project's deferral below −10 °C and confirms the warm end is where it bites —
consistent with ADR 0025's refusal to extend the grid to −1 °C.

**Surface energy / Gibbs–Thomson** (`2306.13087v1` p5, p7) — not currently modelled:

> "the Gibbs-Thomson effect plays a important role in preventing the growth of unphysically thin
> plates at especially low supersaturations"

> "This is necessary to prevent the growth of one-pixel-wide plates and other unphysical
> structures … It is not necessary, however, to calculate the local surface curvature to great
> accuracy in the model. Even a rough estimate of curvature is likely sufficient to suppress most
> unphysical structures."

Relevant to the low-σ end of the grid (f = 0.10, 0.15) where the sweep's only columns appeared.

---

## 7. Figure 2 of `2306.13087v1` — the 206-observation data set, seen

Pages 11–14 are the photographic matrix, in a grid of temperature (columns) × supersaturation
(rows: 7, 10, 15, 20, 30, 45, 70, 100, 150 %), each panel labelled with growth time in seconds and
a size in µm. What the images show, as morphology:

- **p11, −0.5…−4.5 °C** — dendritic stars and plates at high σ; by −3…−4.5 °C at low σ the
  crystals are columnar/needle-like.
- **p12, −5…−10 °C** — at −5/−6/−7 °C the crystals are unmistakable needle clusters; by −8/−9/−10
  they are plates. The column regime and its cold edge, directly visible.
- **p13, −11…−16 °C** — **every panel is a plate**: stellar dendrites at high σ, sectored plates
  mid-range, solid hexagonal plates at 7–15 %. Not one column. This is the band where the sweep
  scores 0/60.
- **p14, −17…−24 °C** — plates and rosettes at high σ; at 7–15 % the crystals remain essentially
  bare needles, the columnar cold end.

**Why it is still not a scoring target**, beyond the reasons already recorded in
`research/2306.13087v1.md` (needle seed; 206 panels to digitize):

- **The σ normalisation convention is not established here.** Panels run to 150%, while the
  registered grid uses fractions 0.1–0.9. Nothing read so far fixes what these percentages are
  relative to. **This must be pinned from the source before any comparison is contemplated** — an
  unresolved factor here would silently misalign every point.
- **Panels are selected, not sampled** (p8): *"Each composite photo … shows a representative
  example selected from several growing crystals … Some subjective preference was given to
  well-formed crystals exhibiting good symmetry."*
- **Stated uncertainties** (p7–8): *"temperature uncertainties … typically ±0.2 C"*, and
  supersaturations *"between 0.8 and 1.2 times the stated values"* — a ±20% band on the second
  axis.

Libbrecht's own statement of the bar (p8):

> "At present, it is not clear that any existing 3D computational models of snow crystal growth can
> adequately reproduce any of the structures seen in Figure 2 under prescribed growth conditions,
> let alone reproducing the entire set with even modest fidelity."

---

## 8. The SDAK-2 two-branch table exists, and it is a TABLE

`research/libbrecht-later-papers.md` recorded that `2306.04042v1` "reportedly carries the SDAK-2
two-branch (A, σ₀) table — sweep-reported, unverified." **It is verified: Table 1, page 9.** It
needs no digitization.

> "Table 1. The parameters used to describe the prism attachment kinetics at different temperature
> using Equation 32."

| T (°C) | v_kin (µm/sec) | A1 | σ₀,1 | A2 | σ₀,2 |
|---|---|---|---|---|---|
| −1 | 690 | 0.3 | 3e−5 | 0.7 | 1e−3 |
| −2 | 635 | 0.25 | 3e−4 | 0.75 | 1.5e−3 |
| −3 | 585 | 0.2 | 1e−3 | 0.8 | 3e−3 |
| −5 | 496 | 0.2 | 2e−3 | 0.8 | 5.5e−3 |
| −7 | 419 | 0.5 | 8e−3 | 0.5 | 1e−2 |
| −15 | 208 | 1 | 3e−2 | — | — |

The parameterization, and what the second branch is for (p9):

> "Using the sum of two nucleation processes is a convenient parameterization to include what we
> have called the '**SDAK-2**' phenomenon at the higher temperatures."

So `α_prism = A1·exp(−σ₀,1/σ_surf) + A2·exp(−σ₀,2/σ_surf)` (their Eq. 32).

**σ₀ in this table is a FRACTION, not a percent**, and branch 1 is the broad-facet kinetics. Both
follow from the table reproducing the dedicated measurement papers exactly:

| T | Table 1 branch 1 | dedicated measurement | source |
|---|---|---|---|
| −2 °C | A1 = 0.25, σ₀,1 = 3e−4 = **0.03%** | A_prism = 0.25, σ₀,prism = **0.03%** | `2004.06212v1` |
| −5 °C | A1 = 0.2, σ₀,1 = 2e−3 = **0.2%** | A_prism ≈ 0.2, σ₀,prism ≈ **0.2%** | `1912.03230v1` |

Not approximately — identically, on all four numbers. And at −15 °C the table gives σ₀,1 = 3e−2 =
3.0%, against Eq. (3)'s 3.0649% and M2's 3.4766%, so Eq. (3) tracks it and M2 again runs high.

**The second branch is absent by −15 °C**, which is consistent with SDAK-2 being a warm-end
phenomenon and with `2009.08404v2`'s caption that A ≈ 1 for both facets between −10 and −30 °C.

**This is the most directly usable artifact found in this reading.** ADR 0030's SDAK arm proposed
building its annex from printed closed forms; this is a printed, measurement-anchored, tabulated
two-branch kinetics covering −1 to −15 °C with no read uncertainty. It also supplies `v_kin(T)`,
which the project currently obtains elsewhere.

### The caveats the same page attaches to it

- > "We believe that these parameters are fairly accurate at the lowest temperatures but become
  > **more uncertain at the temperature increases**."
- > "This phenomenon is **speculative at present**, and more work is needed to sort out the prism
  > attachment kinetics at high temperatures."
- > "The overall trend in 𝜎₀,prism is well supported by experiments at temperatures **below -2 C**,
  > while measurements at higher temperatures are more uncertain."
- The table stops at −15 °C and is spaced −1, −2, −3, −5, −7, −15 — so it says nothing about the
  −9.9…−21.5 °C `plates-cold` band except at its one −15 °C row, and nothing at all below −15 °C.

### Latent heating, quantified (Figures 2 and 3, p10)

These two figures plot `R/r_corner` against prism growth velocity with latent heating on (red) and
off (black), at −1, −2, −3, −5, −7, −15 °C, for R = 20 µm (Fig. 2) and R = 500 µm (Fig. 3). They
are the clearest statement found of when the project's unapplied latent-heating systematic bites:

> "latent heating is essentially negligible at the lowest growth rates … becoming important as the
> growth rate increases (for the assumed near-vacuum growth conditions). Latent heating is also
> generally more important at higher temperatures"

> "the effects of latent heating are much more pronounced with larger crystals … because 𝛼_therm
> decreases at 1/𝑅"

The curves are plotted data and **no values are transcribed here**. Note the stated condition
"near-vacuum growth conditions", which is not the project's 1 atm case — this figure is not
directly transferable, and is recorded as a locator, not as evidence.

---

## 9. The structural bound, confirmed by direct measurement

**These are CALIBRATION PROBES and are never citable as gate evidence.** They are recorded here
because they test §1's structural claim by running the solver rather than by counting crossings.

Two solver runs at the registered conditions (48³, Δx 0.35 µm, extent 21, `cflFill` 0.1,
`aggregate-hv-g1h1-v6`, `monopole-matched`), differing from the swept points only in `--param-set`:

| T, f = 0.15 | `CAK_A1` (as swept) | full `CAK` | move | reaches column? |
|---|---|---|---|---|
| −8 °C | AR 0.5789 plate | AR 0.7895 **neutral** | +36% | no |
| −5 °C | AR 0.3821 plate | AR **1.0000 neutral** | **+162%** | **no** |

Both `CAK` runs are clean: `symErr = 0`, `deltaSymClean = true`, `allConverged = true`,
`domainContact` false, stop reason `size-target` at extent 21. The `CAK_A1` values are the sweep's
own `out/phase6-sweep/points.json` entries for the same grid points.

**−5 °C is the strongest test the grid admits.** `A_PRISM_CAK` reaches its minimum of **0.18 at
(Tm−T) = 5**, so −5 °C is where the correction throttles α_prism hardest — a 5.6× reduction in the
prefactor against `CAK_A1`'s A ≡ 1. Nowhere else on the grid does the correction have more room to
work.

It produces an exactly equant crystal — both the transverse and z extents reach 21 together — and
goes no further. **The broad-facet correction moves the model from one habit to *no* habit, not to
the other habit.** That is §1's crossing bound showing up in a solver run, and it is the same
lesson the σ₀ crossing already taught: the α ratio marks where a habit stops, not where the
opposite habit starts. Libbrecht's own statement of the requirement is `α_prism ≪ α_basal`, and
these ratios are nowhere near ≪.

### Consequence for the `paramSet` ADR: the corrected parameterization probably scores WORSE

All five of the sweep's headline agreements sit at −2 °C, and `A_prism` there is **0.28** — a 3.6×
throttle against `CAK_A1`. Their measured aspect ratios and the rise each would need to cross the
0.6667 plate ceiling into `neutral` (which ADR 0025 scores DISAGREE):

| f | σ∞ | AR (`CAK_A1`, as swept) | rise needed to lose the agreement |
|---|---|---|---|
| 0.10 | 0.002 | 0.1638 | 4.07× |
| 0.15 | 0.003 | 0.2729 | 2.44× |
| 0.25 | 0.005 | 0.3821 | **1.74×** |
| 0.40 | 0.008 | 0.4913 | **1.36×** |
| 0.60 | 0.012 | 0.6004 | **1.11×** |

The two measured probes bracket what a throttle does to AR: 1.75× → 1.36× rise (−8 °C), and
5.6× → 2.62× rise (−5 °C). **Interpolating, a 3.6× throttle at −2 °C lands somewhere near a
1.9–2.2× rise.** That is an ESTIMATE from two points, not a measurement — only a re-sweep settles
it — but it would put the bottom three rows of that table over the ceiling and take the headline
from **5/90 to roughly 2/90**.

**So correcting the mismatch makes the reported result worse, and that must not become an argument
for keeping the unregistered one.** The ADR should register `paramSet` as a freeze row and decide
the parameterization on **provenance** — noting that `CAK`'s anchors now have a printed closed form
behind them (§2) while `CAK_A1` has M1's documented simplification behind it (§2) — and should
record the expected score change *in advance*, precisely so that no later reader can select the
parameterization by its score.

### 9.2 The seed probe: a knob that moves AR a great deal and still cannot help

**Also a calibration probe, not gate evidence.** Five seed geometries at the two registered
discriminating conditions — warm −5 °C σ∞ 0.0075 (Nakaya `columns`, needs AR ≥ 1.5) and cold −15 °C
σ∞ 0.02355 (Nakaya `plates-cold`, needs AR ≤ 0.6667) — all `CAK_A1`, N = 48, extent 21, Δx 0.35,
v6, monopole-matched. Every run clean: `symErr = 0`, `deltaSymClean = true`.

| seed r/t | seed AR | −5 °C AR (needs ≥ 1.5) | −15 °C AR (needs ≤ 0.6667) |
|---|---|---|---|
| 4 / 1 wide plate | 0.111 | 0.2729 plate | **0.7895** neutral ← closest to agreeing |
| 2 / 1 **registered** | 0.500 | 0.3821 plate | 1.1053 neutral |
| 1 / 1 small plate | 0.333 | 0.4913 plate | 1.2353 neutral |
| 2 / 5 thick | 1.000 | 0.6842 neutral | 1.4000 neutral |
| 1 / 5 needle-like | 1.667 | **0.7895** neutral ← closest | 1.6154 **column** |

**The needle-like seed does produce a genuine column — at −15 °C, where a plate is required.**
That is worth stating plainly because it refutes the loose form of the structural claim: seed
geometry is not a small knob. It moves AR by **+0.41 at −5 °C and +0.51 at −15 °C** between the
registered seed and the needle.

**But it moves both ends the same way, and the two bands demand opposite moves.** −5 °C needs AR
raised past 1.5; −15 °C needs it lowered below 0.667. A seed is temperature-independent, so it
slides every point together. The consequence is visible in the table: the seed that comes closest
at −15 °C (wide plate, 0.7895) is the **worst** at −5 °C (0.2729), and the seed that comes closest
at −5 °C manufactures the **wrong habit** at −15 °C. **Not one of the five agrees at either
temperature.**

**So the structural bound of §1 is about SENSE, not magnitude, and should always be stated that
way.** Diffusion, grid, seed, far field and domain can all move the aspect ratio, some of them a
lot. What none of them can do is **reverse the plate/column ordering as a function of
temperature** — and the diagram requires that three times. Only a temperature-dependent change in
the *relative* basal/prism kinetics can, which is what the SDAK dips are.

This also sharpens the seed systematic already recorded in `phase6-convergence.md` §5: it is the
largest single systematic measured in Phase 6, and it is now measured to be **incapable of
producing agreement at either discriminating condition, in either direction**.

---

## 10. What the full text sweep added — three findings that change the framing

The figure reading above was followed by an exhaustive ten-paper text extraction, recorded in
[`libbrecht-papers-extracts.md`](libbrecht-papers-extracts.md). Three of its findings bear directly
on Phase 6, and the quotes below were **verified personally against the source PDFs**, not taken
from the extraction pass.

### 10.1 A plate at −5 °C is the CORRECT output of a broad-facet model — the source says so

`1912.03230v1` (the dedicated −5 °C measurement paper), p10, verified verbatim:

> "the new data directly confirm the growth of plate-like simple prisms at -5 C when 𝜎_surf is low,
> as this morphological behavior is unambiguously observed in the imaging data. This direct
> observation of plate-like prismatic crystals at -5 C provides an important confirmation of our
> attachment-kinetics model. **Producing columnar crystals at -5 C then requires the SDAK effect**
> to increase 𝛼_basal compared to its value on broad basal facets. **Thick plates were found to be
> the norm** when 𝜎_surf ≈ 0.15%, with prism aspect ratios of roughly **𝜌_aspect = 𝐻/𝑅 ≈ 0.5**,
> where 𝐻 is the half-thickness and 𝑅 is the effective radius of the hexagonal prism."

And p13, verified verbatim:

> "producing a diversity of prismatic crystals with aspect ratios throughout the range **0.1 <
> 𝜌_aspect < 1. Columnar crystals (with 𝜌_aspect > 1) were absent** … many blockier, nearly
> isometric"

He also states the conflict explicitly (p11): the broad-facet model's plate prediction at −5 °C
"contradicts a well-established rule from the morphology diagram, suggesting that only columnar
crystals are produced at -5 C."

**𝜌_aspect = H/R is thickness/width — the same quantity as our AR.** So his measurements are
directly comparable to the probes in §9:

| | ρ_aspect / AR |
|---|---|
| Libbrecht, −5 °C substrate, low σ_surf | 0.1–1.0; ρ ≈ 0.5 typical; **columns absent**; "blockier, nearly isometric" common |
| our `CAK_A1` at −5 °C | 0.3821 |
| our `CAK` at −5 °C | **1.0000** — isometric |

**The sweep is not failing to reproduce reality. It is reproducing Libbrecht's own broad-facet
measurements while disagreeing with the Nakaya diagram — which is exactly what he says a
broad-facet model does.** Note also that his columnar threshold is ρ > 1 where the registered
criterion is AR ≥ 1.5; under *his* threshold our `CAK` −5 °C result sits exactly on the boundary.

### 10.2 Producing columns needs three things, and two are hard for this architecture

From §7C of the extraction (these quotes are from the extraction pass, not personally verified):

1. **A width-dependent nucleation barrier** — "a full theory of the SDAK phenomenon would provide a
   reduction of the nucleation barrier that depends on T, sigma_surf, and the mesoscopic structure
   of the crystal, especially the width of the uppermost terrace surfaces" (CM9 p4). **The width
   scale is ~50 nm**: "For a typical thin-plate snow crystal growing near -14 C, we might have
   R_edge ~ 1 um and w ~ 50 nm" (CM8 p6). The registered grid is **Δx = 0.35 µm = 350 nm**, so the
   controlling width is 7× *below one cell*. SDAK cannot be resolved on this lattice and must enter
   as a sub-grid closure keyed to something the grid does represent.
2. **A fast-growth transient — i.e. history dependence.** "a brief interval of fast growth followed
   by a longer period of slower growth is the usual recipe for growing slender columnar snow
   crystals in air" (CM6 Fig. 12 caption). Worse for a (T, σ) scoring design: "both platelike and
   needlelike crystals can grow under essentially identical conditions at this temperature" (TAX1
   p8). **At −5 °C the habit is not single-valued in (T, σ)**, so no deterministic per-point score
   can be right there in principle.
3. **A background gas** — "it only operates when the growth is substantially limited by particle
   diffusion through an inert background gas. The ESI does not occur at low pressures, so thin
   plates do not appear in near-vacuum conditions" (CM10 p11). The project runs at 1 atm, so this
   one is satisfied.

### 10.3 The 206-observation grid does not overlap ours where it matters

The supersaturation convention is now settled. `1211.5555v1` p2, a source this project already
cites, verified verbatim:

> "as a function of temperature and water vapour supersaturation **relative to ice**. The water
> saturation line gives the supersaturation of supercooled water"

and the monograph p59 defines σ_water = [c_water(T) − c_sat(T)]/c_sat(T) on that same axis. So
Libbrecht's percentages are ice-relative and σ_water is a *level* on the axis, not the normaliser —
directly comparable to the sweep's `sigmaInf`.

Comparing the sweep's **executed** σ∞ values from `out/phase6-sweep/points.json` against the
206-observation rows (7, 10, 15, 20, 30, 45, 70, 100, 150 %):

| T (°C) | our executed span | Libbrecht rows inside it |
|---|---|---|
| −2 | 0.20 – 1.80 % | **none** |
| −5 | 0.50 – 4.50 % | **none** |
| −7 | 0.71 – 6.37 % | **none** |
| −8 | 0.81 – 7.31 % | 7% |
| −14 | 1.46 – 13.14 % | 7, 10% |
| −24 | 2.65 – 23.85 % | 7, 10, 15, 20% |

**There is no overlap at all warmer than −8 °C.** The whole `plates-warm` regime and most of the
`columns` regime — the bands the sweep fails — have zero σ overlap with that data set, and even at
−8/−9 only its single lowest row is in range. Whole-sweep span is 0.20–36.63 %; the observation
grid is 7–150 %.

This is a hard blocker on adopting the 206 observations as a scoring target, independent of the
needle-seed and digitization problems already recorded in §7. It also has a physical reading:
`2109.00098v1` p9 notes that above σ_water "rapid nucleation of water droplets" makes substrate
growth impractical, which is why the needle method exists — Libbrecht's grid deliberately explores
far above water saturation, while the registered grid deliberately caps at 0.9 σ_water.

**A caution on `sigmaWater()`.** `core/src/libbrecht.ts` carries a function of that name whose own
docstring records that it "crosses zero at T = −1.969 C" and is "NOT an enforced runtime ceiling";
Phase 6 uses the printed Table 2.1 anchors instead. Using it to reconstruct the σ axis gives wrong
answers at the warm end. The table above is built from executed `sigmaInf` values, not from it.

---

## 11. What this reading did NOT cover

- **Only figures and the pages carrying them were read by image** — `2306.13087v1` pp. 4–9 and the
  Figure 2 plates pp. 11–14, `2009.08404v2` pp. 3 and 15, `2011.02353v1` pp. 2 and 7, and
  `2306.04042v1` pp. 9–10. **The other pages of those papers, and all of `2012.12916v1`,
  `2106.09809v1`, `1912.09440v1`, `2109.00098v1`, `2004.06212v1` and `1912.03230v1`, were not read
  as images here.** A parallel exhaustive text-and-parameter sweep of all ten covers the remainder;
  its findings are recorded separately.
- **Figure locations were obtained mechanically**, by extracting caption lines with PyMuPDF, so a
  figure whose caption does not match `(Figure|Table) N[:.]` would not have been listed and could
  have been missed.
- **`2109.00098v1`, the c-axis needle seed methods paper, was not read.** Seed geometry and chamber
  conditions remain uncharacterised, and they gate any use of the 206 observations. Its caption
  list shows Figures 15–20 covering the dual diffusion chamber, the vertical temperature profile,
  the water-vapor model, and the e-needle growth procedure — that is where the σ normalisation
  convention (§7) is most likely to be pinned down.
- **`1912.09440v1`, the apparatus paper, was not read here** — so the measurement uncertainties
  quoted in §3 are the values the measurement papers state, not an independent assessment of what
  the instrument supports.
- **No SDAK data points were digitized.** §5 gives the figures' locations and stated conditions
  only. Turning either dip into model input is a digitization task with its own read uncertainty,
  and the eye-guide dotted lines are not fits.
- **No journal versions or non-arXiv errata were checked** — same limit as
  `research/phase6-source-currency.md`.
