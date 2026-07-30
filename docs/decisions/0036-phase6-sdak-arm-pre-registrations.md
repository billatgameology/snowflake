# 0036 — SDAK arm pre-registrations: the closure, the bistable band, the cold end, and the expected result

- **Date:** 2026-07-30
- **Status:** accepted

## Charter impact

None. §3.2 Phase 6 already requires the reporting shape this ADR works within:

> "no-SDAK and SDAK runs are reported separately; wherever P3 inputs are active, matching Nakaya is
> in-sample reproduction, not independent validation"

and §2.5 already assigns the provenance that makes the expected result below evidence of nothing on
its own:

> "the SDAK narrow-facet dips are not [measured] — their locations were chosen to impose agreement
> with the Nakaya diagram"

ADR 0030 item 4 requires exactly this document: *"The expected result is registered before the 3D
run … including the explicit sense prediction at −5/−15 °C — before any 3D SDAK sweep executes."*

**Arm 1 is not re-scored by anything here.** Its protocol, its 204 rows and its headline of **3 of
90** stand exactly as published. Arm 2 runs under a new protocol id with its own freeze; §3.2's
re-sweep clause is not engaged because no arm-1 registered value is edited.

## The papers this ADR cites, resolved

Written out because I got five of them wrong in the first draft and caught it only by auditing my
own citations against `research/libbrecht-papers-extracts.md`'s code table. The specific confusion
was **CM8 with CM9** — consecutive papers in the same series, whose titles differ by one number and
whose subjects differ by 10 °C — and attributing CM6 and TAX1 quotes to the M1 paper because that is
where I had been reading.

| code | arXiv | what it is |
|---|---|---|
| TAX2 | `2306.13087v1` | Taxonomy 2: quantifying the Nakaya diagram. **M1 and M2 live here.** |
| TAX1 | `2109.00098v1` | Taxonomy 1: c-axis ice needles as seeds. The −5 °C bistability observation. |
| CM6 | `1912.03230v1` | Comprehensive Model 6: attachment kinetics **near −5 °C**. Growth-history dependence. |
| CM8 | `2009.08404v2` | Comprehensive Model 8: characterizing SDAK **near −14 °C**. The ~50 nm width and both prism-dip anchors. |
| CM9 | `2011.02353v1` | Comprehensive Model 9: characterizing SDAK **near −4 °C**. The basal dip. |
| FACET | `2306.04042v1` | Comprehensive faceting model. The SDAK-2 two-branch table. |

A pre-registration whose citations are wrong is worse than one with none, because it invites a
reader to check the wrong page and conclude the claim is unsupported. Pin-register recommendation 17
proposes a lint that resolves `file:line` and `§N` citations; this is the case for extending it to
paper codes.

## Why these three, and why before the freeze

The maker named three open questions when scheduling this arm. Each is a place where the arm could
produce a number that looks like a result and is not one, and each has to be settled before the
first point runs, because each of them could otherwise be settled after seeing results.

---

## Pre-registration 1 — the ~50 nm closure on 350 nm cells

**The problem.** SDAK's controlling variable is facet width. The source gives the scale: *"For a
typical thin-plate snow crystal growing near −14 C, we might have R_edge ~ 1 um and w ~ 50 nm"*
(`2009.08404v2` p6, CM8 — "…near −14 C"). The registered grid is **Δx = 0.35 µm = 350 nm**. The width that decides the
kinetics is **7× below a single cell**. No refinement within reach closes that: resolving w = 50 nm
at even two cells per width needs Δx = 25 nm, a 14× refinement in each of three dimensions.

**The decision: arm 2 implements M1, not M2, and builds no sub-grid closure.**

`2306.13087v1` defines two models. M2 is width-dependent — *"an attachment kinetics that depend on
the widths of the respective faceted surfaces"* (p7) — and needs the closure. M1 does not, because it
assumes **every facet is narrow** and applies the dipped kinetics everywhere. The paper states the
assumption and its ground:

> "the Edge-Sharpening Instability (ESI) … is quite efficient in air, quickly turning broad facets
> into narrow facets during growth. In these cases, therefore, it is a reasonable first
> approximation to assume that all faceted surfaces are described by the attachment kinetics on
> narrow facets." (p7)

and M1 additionally sets `A = 1` for every facet, by the same paper's choice:

> "To keep M1 relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions"

So M1 is a closed form in temperature alone, with **no free parameter and no unresolvable length
scale**. The ~50 nm problem is *avoided*, not solved.

**Why avoiding it is the right call rather than the convenient one.** A sub-grid closure would need a
width proxy keyed to something the lattice represents — some integer count of surface cells — and a
strength parameter mapping that proxy onto the dip depth. Neither appears in any source. Agreement
obtained by tuning that parameter would be uninterpretable: the arm would be measuring the closure,
not the hypothesis. Removing the free parameter is what makes arm 2 falsifiable at all.

**The limitation this buys, registered now.** M1's all-facets-narrow assumption is scoped by its own
author to fast-growing morphologies — *"In these cases, therefore…"* refers to the ESI-dominated
regime. The registered grid includes f = 0.10 rows, which are the slowest-growing points on it, and
those are where the assumption is least justified. **If arm 2 fails preferentially at low f, that is
the assumption failing, not the SDAK hypothesis failing.** Registered before the run so it cannot
become a post-hoc excuse.

**M2 is deferred, not abandoned.** If arm 2 succeeds, the width-dependent model is the natural next
question and the closure has to be faced honestly. If arm 2 fails, ADR 0030's differential-diagnosis
ladder applies and M2 is one rung on it.

---

## Pre-registration 2 — bistability at −4 to −6 °C

**The problem.** The source states that the habit is not single-valued in (T, σ) here:

> "both platelike and needlelike crystals can grow under essentially identical conditions at this
> temperature" (`2109.00098v1` p8, TAX1)

and that which one you get depends on growth *history*:

> "the model predicts that we should be able to observe columnar growth on a substrate in air at −5 C,
> provided we just start the experiment with a sufficiently high sigma_inf" (`1912.03230v1` p16, CM6)

> "a brief interval of fast growth followed by a longer period of slower growth is the usual recipe
> for growing slender columnar snow crystals in air" (`1912.03230v1` Fig. 12 caption, p16)

ADR 0025 scores each (T, σ) point to one class and accepts `{column}` in the `columns` regime. At
−5 °C that scores against a claim the source does not make. **No deterministic per-point score can be
right there in principle** — not because the model is uncertain, but because the reference is
two-valued.

**The decision.** At **−4, −5 and −6 °C** the accepted set is `{plate, column}` and the points are
**EXCLUDED from the headline and reported separately** — the identical treatment
`columns-and-plates` already receives below −21.5 °C. This is an extension of a registered
mechanism to a second place the source documents two habits, not a new escape hatch.

**The cost, stated as a number rather than a reassurance.** −4 °C is already inside the ±1.0 °C
ambiguity band around −3.3. −5 and −6 leave the headline: **12 points**, and the `columns` regime's
headline scope drops from 24 to 12 — half of the one regime arm 1 failed hardest on.

**Why not the weaker rule.** "Score agreement if either class matches" was considered and rejected as
unfalsifiable: in a two-class criterion with a neutral band, accepting both classes means the only
way to disagree is to measure neutral. That is not a test.

**A capability limit, registered rather than discovered.** Arm 2's runs are single-trajectory, from a
fixed seed, at constant σ∞, with `noiseEpsilon = 0` and `rngSeed = 1`. **The arm cannot exhibit
bistability even if the model has it** — there is no growth-history variation anywhere in the design.
So arm 2 cannot confirm or refute the two-valuedness; it can only avoid scoring against it. Testing
it needs a history-varying design, which is not this arm.

---

## Pre-registration 3 — the cold-end input gap below −15 °C

**The problem, stated precisely, because the obvious version of it is wrong.** The SDAK-2 two-branch
table (`2306.04042` Table 1) stops at −15 °C, and −15 has no second branch. That table is **not an
arm-2 input** — M1 sets `A = 1` everywhere and uses neither branch. So the gap that matters is not
the two-branch table's; it is the **prism dip's**.

The prism dip is doing enormous work across the cold end, and it is doing it on almost no anchors.
Dip strength (1 = no dip), computed from the registered closed form:

| T (°C) | −15 | −16 | −20 | −25 | −30 | −35 |
|---|---|---|---|---|---|---|
| basal dip | 0.983 | 0.989 | 0.998 | 1.000 | 1.000 | 1.000 |
| **prism dip** | **0.055** | **0.083** | **0.323** | **0.635** | **0.825** | **0.920** |

At −15 °C the prism dip cuts σ₀,prism to **5.5%** of its broad-facet value, and it is still a 36%
reduction at −25 °C and an 8% reduction at −35 °C. It is the single most consequential input in the
arm, across the entire cold half of the grid.

**The anchors — CORRECTED 2026-07-30, and the correction changes the conclusion.**

This section originally counted **two** anchors, both prism, and drew a tier boundary at −15 °C on
the claim that prose-stated numbers existed for both dips down to there. The arm-2 freeze review
challenged it; re-deriving from `research/libbrecht-papers-extracts.md` showed the review and I were
each half wrong. There are **four** prose-stated narrow-facet anchors, not two — the basal dip has
its own at −5 and −14 °C — and the warmest anchor of any kind is −5 °C, so −2…−4 is warmer than all
of them.

| T (°C) | facet | measured | M1 closed form | ratio | source |
|---|---|---|---|---|---|
| −5 | basal | 0.1% | 0.0987% | **0.987** | `1912.03230v1` (CM6) |
| −10 | prism | 0.85% | 0.5916% | **0.696** | `2009.08404v2` p14 (CM8) |
| −14 | basal | 2.33% | 2.2636% | **0.972** | `2009.08404v2` (CM8) |
| −25 | prism | 6.6% | 6.0409% | **0.915** | `2009.08404v2` p13 (CM8) |

**The asymmetry is the real finding, and it is worse for arm 2 than the two-anchor version was.**
The basal dip is *well* anchored — 2.8% worst error across both its anchors. The prism dip is not:
30% low at −10 °C and low at both. And arm 2's predicted gain is almost entirely **cold plates**,
which the **prism** dip drives. So the arm's strongest predicted effect rides on its
weaker-anchored input. That is registered here, before the run, rather than surfacing in the
discussion afterwards.

The closed form running low is not a transcription error — it is the ad-hoc fit's own residual, and
the paper says as much: *"While these functional forms are completely ad hoc, the values of σ₀(T)
derive mainly from experimental data."*

**The decision.** Arm 2's report carries a **sourcing tier per temperature**, published with the
headline rather than beneath it:

- **−2 to −15 °C** — inside the range where prose-stated numbers exist for both dips.
- **−16 to −25 °C** — inside Figure 18's plotted span, with one numeric anchor (−25 °C).
- **−26 to −35 °C** — **below every numeric anchor and below the plotted curve's cold end.** Ten of
  34 registered temperatures. Arm 2 adds no independent information here; whatever it produces is
  the closed form's extrapolation, evaluated in 3D.

**A correction to my own first draft of this section, in the model's favour.** I wrote that M1's
third transition "sits inside the thinnest-anchored tier", i.e. beyond every anchor. It does not.
The transition is at **−24/−25 °C** and the single cold anchor is at **−25 °C** — they coincide. The
test that pins this is what caught it. So the third transition is anchored at exactly one measured
point, where the closed form runs 8.5% low; what is genuinely beyond every anchor is everything
colder than −25 °C, which is ten of the 34 registered temperatures and none of the headline.

That makes the third transition **better supported than I first claimed, and still the weakest of
the three** — one anchor against the first two transitions' prose-stated values. It is registered as
such now so that a hit there is not over-read and a miss is not treated as a refutation of SDAK.

---

## The registered expected result

### Part 1 — the 0D sense prediction, which is evidence of nothing

`app/scripts/phase6-sdak-m1-prediction.mjs`, committed with this ADR.

With `A_basal = A_prism = 1`, the habit ordering is **provably independent of σ_surf**:

```
alphaHK_basal > alphaHK_prism  ⟺  exp(−σ₀b/σs) > exp(−σ₀p/σs)  ⟺  σ₀b < σ₀p    for every σs > 0
```

This is the case where the σ₀ crossing and the αHK swap coincide, and coincide *by construction*
rather than by luck. It is worth stating in exactly those terms, because this project previously
counted σ₀ crossings as habit transitions for the **CAK** set, where `A_prism ≠ 1` and the swap is a
zero of `ln A_prism(T) − (σ₀,prism − σ₀,basal)/σ_surf` — σ-dependent, and the source of a refuted
claim. M1 earns the shortcut the CAK set did not.

M1's transitions on the registered grid, and the broad-facet branch for contrast:

| | transitions | where |
|---|---|---|
| **M1 (dipped)** | **3** | plate→column at −3/−4, column→plate at −8/−9, plate→column at −24/−25 |
| broad-facet | 1 | plate→column at −8/−9 — the **opposite sense** to Nakaya at that boundary |
| Nakaya (ADR 0025) | 3 | −3.3, −9.9, −21.5 |

Scored at the temperature level against ADR 0025's regimes, ambiguity band excluded: **15 of 15
headline temperatures agree, zero disagree.**

**This number is not evidence and must never be reported as though it were.** The dip centres 4.5
and 14.4 were chosen to impose agreement with the Nakaya diagram (charter §2.5). A closed form tuned
to reproduce three transitions reproduces three transitions. The 15/15 is a **transcription check** —
it confirms the forms were read correctly, including that `log` is base 10 — and nothing more.

### Part 2 — the 3D prediction, which is the actual registration

The open question is entirely whether 3D diffusion-limited growth on this grid *preserves* the
ordering and produces aspect ratios that clear 0.6667 / 1.5 rather than measuring neutral. **Arm 1's
dominant outcome was not disagreement — it was 168 of 204 points measuring `neutral`.** A sense
prediction says nothing about that, so registering "SDAK will fix it" would be a hope, not a
prediction.

Arm 1 supplies the missing map. `app/scripts/phase6-sdak-arm2-expectation.mjs` fits its 204 measured
aspect ratios against the attachment anisotropy `r = α_basal/α_prism` its own kinetics imply, then
applies that transfer function to M1's anisotropy at the same 204 points.

```
ln AR = −0.2659 + 0.5119 · ln r          R² = 0.511
back-check on arm 1: 173/204 = 84.8% per-point class agreement
```

Log-log rather than linear because both sides are ratios, and because the linear form
`AR = 0.7151 + 0.6585 ln r` returns **AR = −0.27** at M1's coldest anisotropy. A negative aspect
ratio is not a conservative prediction, it is an invalid model — and the plates-cold regime that
drives the entire forecast sits in exactly that extrapolated range.

**THE REGISTERED PREDICTION**, apples to apples, arm 2 scored under arm 1's **unmodified** 90-point
rules:

| | arm 1, measured | arm 2, predicted |
|---|---|---|
| headline agreement | **3 / 90** | **42 / 90** |
| neutral | 168 / 204 | 48 / 90 headline |

Under pre-registration 2's scoring the same forecast is **42 of 78** — the numerator is *unchanged*,
because all 12 excluded points were predicted neutral anyway. The bistability rule moves the
denominator, not the result, which is the strongest available answer to the charge that it was
introduced to flatter the arm. Both numbers will be published.

**Per-regime, which is where the falsifiable content is:**

| regime | headline n | predicted agree | predicted neutral | arm 1 measured |
|---|---|---|---|---|
| plates-warm | 6 | 4 | 2 | 3 |
| **columns** | **12** | **0** | **12** | **0** |
| plates-cold | 60 | 38 | 22 | **0** |

Three sharp claims, each refutable on its own:

1. **The entire gain is in plates-cold.** 0 → 38 of 60. If arm 2 does not produce cold plates, the
   prism dip does not do in 3D what it does in 0D, and the arm has failed at its central purpose.
2. **SDAK as M1 still does NOT rescue the column regime.** 0 of 12, all neutral, at −7 and −8 °C.
   M1's own facet contrast there is 0.673 and 0.976 — essentially isotropic. **If arm 2 produces
   columns at −7/−8, this pre-registration is wrong and the model is better than predicted.** That
   is the outcome I would most like to be wrong about, and it is registered as a prediction rather
   than left as an unstated hope.
3. **The fit's own upper bound is 66 of 78** under the linear form. The registered range is
   **42–66**, and the spread between two defensible fit forms is the honest uncertainty. Registering
   only the log-log number would be choosing the fit whose answer I preferred after seeing both.

### Part 3 — a measurement systematic, registered before it surprises anyone

At `ln r = 0` — perfectly isotropic attachment — the fitted transfer function gives **AR = 0.766**,
not 1.0. Arm 1's own data says an isotropically-growing crystal on this lattice measures 0.766,
which is **0.100 from the plate ceiling and 0.734 from the column floor**. In anisotropy terms it
takes `ln r = −0.273` to be classified a plate and `ln r = +1.311` to be classified a column — a
**4.8× asymmetry**.

The habit criterion is not symmetric about isotropy on this lattice. That follows from `tExtent`
being the corner-to-corner diameter of a hexagon while `zExtent` is a plain thickness, and it biases
every regime the same way: **columns are structurally harder to score than plates here.** It is
registered now because it partly explains arm 1's column-side failure and will otherwise look like a
discovery when arm 2's column band comes back neutral again.

### Part 4 — a float64 floor, found by writing the test rather than by hitting it

`α = exp(−σ₀/σ_surf)` is exactly zero in float64 once `σ₀/σ_surf` exceeds 709. M1's σ₀ grows steeply
with |T| — 0.09% at −2 °C against **17.07% at −35 °C** — so the floor is temperature-dependent, and
at the cold end it is not far below the grid.

Measured per temperature, against each temperature's own smallest swept σ∞:

| T (°C) | −2 | −15 | −25 | −30 | −35 |
|---|---|---|---|---|---|
| margin to facet arrest | 453× | 438× | 326× | 214× | **169×** |

**169× at −35 °C is comfortable but not enormous**, and σ_surf is *below* σ∞ because diffusion
depletes it — so the margin that actually applies at the growing surface is smaller than the table
says by whatever the depletion factor is. Registered so that a cold, low-σ point returning no growth
at all is recognised as arithmetic underflow rather than reported as physics, and so that any future
proposal to extend the grid colder than −35 °C or below f = 0.10 prices this in first.

I found this by writing the assertion, not by hitting the bug — and the first version of the
assertion was itself wrong, comparing the −35 °C floor against the whole grid's smallest σ∞, which
lives at −2 °C. It reported a margin of 8× that corresponds to no real point. The test now compares
per temperature and cannot make that mistake.

## Caveats, all of which weaken the prediction above

**The strongest part of the forecast is the least supported.** 44 of 204 points ask the transfer
function about anisotropies arm 1 never measured — `ln r` down to −1.50 against arm 1's observed
minimum of −0.34 — and they are concentrated at −10 to −23 °C, which is precisely the plates-cold
regime supplying the entire predicted gain. The 38-of-60 rests on extrapolation.

**R² = 0.511.** The transfer function explains half the variance. It under-predicts plates on arm 1
itself (1 predicted against 6 measured), so it is conservative in the direction the prediction
depends on — which cuts in favour of the forecast, and is stated because it could equally have cut
the other way.

**σ_surf ≈ σ∞ is a proxy.** Diffusion depletes the near-surface supersaturation, so this is an upper
bound and the anisotropies on both sides are systematically compressed. The same bias applies to the
fit and the prediction, which is why the proxy is usable at all, but it is a bias.

**None of this is a validation claim.** Every input is provenance class P3, tuned to the diagram the
arm is scored against. A hit is in-sample reproduction (ADR 0005), reported as such everywhere it
appears. The only genuinely new information is whether a form tuned in 0D survives 3D — which is a
question about the model, not about snow.

## Implementation, and one guard that had to be restored

M1 is added to `core/src/libbrecht.ts` as a third `NucleationParamSet`, alongside `CAK_A1` and
`CAK`. Two properties were required of the change and are asserted rather than asserted-to:

**It moves nothing.** `sigma0Basal`/`sigma0Prism` keep their existing signatures and values; a pair
of dispatchers routes by set and returns bit-identical results for `CAK` and `CAK_A1`. Phase 2b/4/5
evidence replays unchanged, the Phase 6 libm digest is still `2a9f64b3`, and all three manifest
hashes are unmoved — recomputed after the edit, not assumed. `core/test/libbrecht.test.ts` checks
bit equality with `Object.is` over the whole domain at half-degree steps.

**It keeps the extrapolation ban.** The digitized CAK anchors *throw* outside (Tm − T) ∈ [1, 50];
a closed form does not — it returns a number for any input. Adopting M1 as written would have
silently dropped that safety property, and dropped it in the worst direction, since the M1 forms are
ad-hoc fits whose behaviour outside Libbrecht's data range is unconstrained rather than merely
uncertain. M1 is therefore bounded to **the same domain as the anchors**, which introduces no new
registered number and puts both sets' refusal in the same place. Found by a test failing at −0.5 °C,
not by reasoning ahead of it.

The Phase 6 grid (−2 … −35 °C) sits comfortably inside that domain, so the guard does not bite
today. It bites the moment anyone proposes extending the grid, which is when it should.

## The arm-2 freeze review, and the six defects it caught

Rule 13 requires an interpretive document's adversarial audit *before* publication, scaled to claim
strength. A 15-hour sweep about to be scored against a registered prediction is as load-bearing as
this project gets, so the freeze was reviewed by five independent adversarial lenses with a
refutation pass over their findings before a single point ran. Six survived, and all six were real:

| # | defect | what it would have produced |
|---|---|---|
| 1 | `phase6Aggregate` scoped `perRegime` by arm 1's rule | arm 2's `columns` row publishing **24 points and 12 agreements** — precisely the free bistable agreements the exclusion exists to remove — against ADR 0036's registered n = 12, agree 0. It also broke the `sum(perRegime) = headline` identity. |
| 2 | `report.json` and `diagram.svg` carried no arm identity | the SDAK arm's figure captioned **"no-SDAK"**, stamped with a protocol hash whose manifest registers `CAK`, and a report indistinguishable from arm 1's except by directory name |
| 3 | no arm-2 freeze commit existed | "registered before it ran" enforced by nothing. Worse: `freezeCommit` belongs in the *gated* manifest, so adding it after the sweep would have invalidated the sweep |
| 4 | the sourcing tiers were factually wrong | see the corrected table above — and being inside the gated manifest, fixing it later would also have cost the run |
| 5 | nothing refused to write into a non-empty `out/` | `out/` is gitignored and arm 1's 204 rows exist in **no commit**; one mistyped suffix would have destroyed 89 core-hours irrecoverably |
| 6 | the bistable band had no field to be reported in | a *registered* obligation — "reported with its own count" — that the artifact could not express, which is how a pre-registration gets settled after the run |

Three of the six (1, 3, 4) would have cost the sweep itself; one (5) would have cost arm 1. None
would have failed a test, and the freeze passed typecheck and 23 unit tests before the review ran.

**Two further things this cost me, worth recording rather than smoothing over.** The review's own
claim that −11…−15 °C was anchor-free was *also* wrong — I checked the corpus rather than accepting
either account, and found the basal anchor at −14 °C. And a separate end-to-end check found the CPU
solver rejecting `paramSet: "M1"` outright: the allow-list was hand-written in four places, I had
updated one, typecheck and every unit test passed, and the first real child died on its first line.
There is now a single `NUCLEATION_PARAM_SETS` in `core`, with the GPU path deliberately staying
narrower and saying why.

## Consequences

**Buys.** A pre-registered, per-point, quantitative expectation with a stated failure mode, derived
from the arm's own prior data rather than from optimism — the thing the no-SDAK arm's registered
expectation (~2/90 against a measured 3/90) got right and which is worth repeating properly. And a
scope decision that removes the arm's only free parameter before anyone can tune it.

**Costs.** 18 points leave the headline. M2 and the width-dependent hypothesis are deferred, so a
success here is a success for the all-facets-narrow approximation, not for SDAK in general — a
narrower claim than ADR 0030 anticipated, and it will be worded that way.

**Forecloses.** Deciding how to score the bistable band after seeing what it produced. Building a
sub-grid closure with a tunable parameter and reporting the agreement it buys. Reporting the 0D 15/15
as a result. Treating a miss at the third transition as informative. Reporting arm 2's headline under
a denominator arm 1 was not scored against, without also reporting the common one.

## Alternatives considered

**Run M2 with a facet-width proxy keyed to integer surface-cell counts.** Rejected for arm 2 as the
primary. It is the physically richer model and it is what a full test of SDAK eventually requires,
but its closure has a free strength parameter with no printed value, and an arm whose result depends
on a number nobody published cannot distinguish the hypothesis from the tuning. Deferred to a
successor arm with the closure itself pre-registered.

**Score the bistable band by the branch a registered selection rule picks** (facet width, or growth
velocity, per `2306.04042`'s two-branch table). Rejected: the selection rule needs the width query
this arm deliberately does not build, and the two-branch table is not an M1 input at all.

**Extend the grid warmer than −2 °C to catch the first transition more tightly.** Rejected as a
change to a registered axis, which would break comparability with arm 1 for no gain — M1's first
transition at −3/−4 is already bracketed by grid points.

**Register only the sense prediction and leave the magnitude open.** Rejected. Arm 1's failure mode
was neutral, not wrong-class, so a sense-only registration would have been unfalsifiable against
exactly the outcome that actually occurred once already.
