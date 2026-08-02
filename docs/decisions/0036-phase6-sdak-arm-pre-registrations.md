# 0036 — SDAK arm pre-registrations: the closure, the bistable band, the cold end, and the expected result

- **Date:** 2026-07-30
- **Status:** accepted historical registration; scientific interpretation corrected by accepted decision 0040

> **Evidence correction 2026-08-01.** Dip centres do not establish the logarithm base. For the
> printed factor, both `log10` and `ln` put the minima at 4.5 °C and 14.4 °C; changing base changes
> width. The formerly cited approximately 3.08/8.07 °C values are restricted equal-shared-positive-field alphaHK
> equality locations under the log10 reading, not centres or habit transitions. Only agreement with
> Figure 1's plotted widths supports retaining log10; the in-sample equality count is not an
> independent source proof.
> The registered forms and historical proxy bytes/counts are unchanged; their habit-prediction
> interpretation is withdrawn. The current justification hashes and revision history are recorded
> by erratum E7.
>
> **Scientific interpretation correction accepted 2026-08-02 (decision 0040).** The analytic calculation compares
> alphaHKBasal and alphaHKPrism at the same positive surface supersaturation in exact arithmetic.
> It is a coefficient-order diagnostic, not a plate/column prediction or a Nakaya score; the
> historical 15/15 label is retracted and future-gate-inadmissible. The 3-D forecast below transfers
> a sigmaInfinity proxy fit from CAK to M1 even though changing kinetics changes local depletion and
> geometry, so it is a confounded historical forecast, not evidence. Part 3 mistakes a regression
> intercept for an isotropic forward run. Part 4 mistakes the normal/subnormal boundary for exact
> underflow and does not bound local sigmaSurf from sigmaInfinity. All four interpretations are
> withdrawn; only published forward-run artifact bytes evaluated by the frozen evaluator supply
> habit labels. A matched M1/no-dip forward arm is required to isolate the implemented dip factors'
> effect on this solver under a frozen configuration; it cannot establish physical SDAK causality or
> necessity in nature.

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
| CM8 | `2009.08404v2` | Comprehensive Model 8: characterizing SDAK **near −14 °C**. The ~50 nm example width and both prism-dip same-lineage numeric references. |
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

So M1 is a closed form in temperature alone with no explicit width input. **Accepted interpretation
correction under ADR 0040:** that does not avoid or resolve the source's example ~50 nm
terrace scale. M1 substitutes an everywhere-narrow starter approximation for the unimplemented
width-dependent closure.

**Why the historical arm selected M1.** A sub-grid closure would need a
width proxy keyed to something the lattice represents — some integer count of surface cells — and a
strength parameter mapping that proxy onto the dip depth. Neither appears in any source. Agreement
obtained by tuning that parameter would be uninterpretable without a separate freeze: the arm would
be measuring the closure as well as the prescribed kinetics. M1 is executable without inventing
that new parameter, but its in-sample forward result neither validates the everywhere-narrow
assumption nor isolates the dip factors.

**The limitation this buys, registered now.** M1's all-facets-narrow assumption is scoped by its own
author to fast-growing morphologies — *"In these cases, therefore…"* refers to the ESI-dominated
regime. The registered grid includes f = 0.10 rows, which are the slowest-growing points on it, and
those are where the assumption is least justified. A failure concentrated at low f is
**nondiagnostic**: it cannot by itself identify the everywhere-narrow assumption, the dip forms,
broad-facet changes, diffusion/local-field coupling, geometry, size, or another model limitation.
The former one-cause reading is withdrawn.

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

The prism dip changes the prescribed barrier strongly across the cold end, with only sparse
same-lineage numeric references.
Dip strength (1 = no dip), computed from the registered closed form:

| T (°C) | −15 | −16 | −20 | −25 | −30 | −35 |
|---|---|---|---|---|---|---|
| basal dip | 0.983 | 0.989 | 0.998 | 1.000 | 1.000 | 1.000 |
| **prism dip** | **0.055** | **0.083** | **0.323** | **0.635** | **0.825** | **0.920** |

At −15 °C the prism dip cuts σ₀,prism to **5.5%** of its broad-facet value, and it is still a 36%
reduction at −25 °C and an 8% reduction at −35 °C. This is the largest individual dip multiplier
change in the cold half of the grid. The earlier claim that it was the arm's “single most
consequential input” is retracted: CAK→M1 changes broad-facet σ₀, the prism prefactor and the dips
together, and no matched ablation has isolated their causal contributions.

**The same-lineage numeric references — corrected under accepted ADR 0040.**

This section originally counted **two** values, both prism, and later called four same-lineage
source/model-inferred values measured anchors. The latter provenance is also wrong. The four values
are useful transcription/model-consistency references, but they are not an independent direct-
measurement lineage. Their temperature bracket is −5…−25 °C; M1 itself remains displayed in TAX2
Figure 1 over `(Tm−T) ∈ [1, 50] °C`.

| T (°C) | facet | source-inferred reference | M1 closed form | ratio | source |
|---|---|---|---|---|---|
| −5 | basal | 0.1% | 0.0987% | **0.987** | `1912.03230v1` (CM6) |
| −10 | prism | 0.85% | 0.5916% | **0.696** | `2009.08404v2` p14 (CM8) |
| −14 | basal | 2.33% | 2.2636% | **0.972** | `2009.08404v2` (CM8) |
| −25 | prism | 6.6% | 6.0409% | **0.915** | `2009.08404v2` p13 (CM8) |

The basal pair differs from M1 by at most 2.8%; the prism pair differs by 30% at −10 °C and 8.5% at
−25 °C. These are same-lineage model-consistency residuals, not independent evidence that one dip is
well anchored or that another is experimentally weaker-anchored. The paper describes the functions
as ad hoc and its values as deriving mainly from experimental data; that statement does not turn
these source/model inversions into direct surface-supersaturation measurements.

**The historical tier values and current interpretation.** The values-hashed legacy identifiers
remain frozen for artifact verification, but current reporting uses source-reference-bracket names:

- **−2 to −4 °C** — outside the four-reference bracket on the warm side, while inside the
  source-displayed M1 domain.
- **−5 to −25 °C** — within the temperature bracket spanned by the four same-lineage references.
- **−26 to −35 °C** — outside that numeric-reference bracket on the cold side, while still inside
  TAX2 Figure 1's M1 domain through −50 °C. These ten temperatures are not closed-form
  extrapolation beyond the displayed model.

The historical restricted coefficient-order swap near **−24/−25 °C** coincides with the −25 °C
same-lineage prism reference. That coincidence supplies a model-consistency check, not one measured
habit-transition anchor or independent support. A hit or miss in the 3-D forward result cannot be
assigned to that reference or to the dip factors without the matched no-dip ablation.

---

## The registered expected result

### Part 1 — the equal-field coefficient-order diagnostic

`app/scripts/phase6-sdak-m1-prediction.mjs`, committed with this ADR.

With `A_basal = A_prism = 1`, the exact-arithmetic coefficient order at one shared positive
`σ_surf` is independent of which positive shared value is selected:

```
alphaHK_basal > alphaHK_prism  ⟺  exp(−σ₀b/σs) > exp(−σ₀p/σs)  ⟺  σ₀b < σ₀p    for every σs > 0
```

This is the restricted case where the σ₀ crossing and equal-field alphaHK swap coincide
rather than by luck. It is worth stating in exactly those terms, because this project previously
counted σ₀ crossings as habit transitions for the **CAK** set, where `A_prism ≠ 1` and the swap is a
zero of `ln A_prism(T) − (σ₀,prism − σ₀,basal)/σ_surf` — σ-dependent, invalidating the
old counting proof. Neither calculation determines coupled morphology.

M1's equal-field coefficient-order swaps on the grid, and the broad branch for contrast:

| diagnostic/reference | counted separators | locations or brackets |
|---|---:|---|
| **M1 equal-field coefficient-order swaps** | **3** | prism-higher→basal-higher at −3/−4; basal-higher→prism-higher at −8/−9; prism-higher→basal-higher at −24/−25 |
| broad-branch equal-field coefficient-order swap | 1 | prism-higher→basal-higher at −8/−9 |
| Nakaya reference habit boundaries (ADR 0025) | 3 | −3.3, −9.9, −21.5 |

The historical code converted those swaps to plate/column labels and reported **15 of 15**. That
score is retracted: the conversion is not supplied by the analytic equality.

**This number is not evidence and must never be reported as though it were.** The dip centres 4.5
and 14.4 were chosen to impose agreement with the Nakaya diagram (charter §2.5). A closed form tuned
so its restricted coefficient-order swaps align with three source habit separators unsurprisingly
produces three such swaps. The 15/15 only confirms that the historical code's own swap-to-label
conversion agrees with its analytic swap table; it does not
independently validate the forms or logarithm base. Base 10 is supported separately by agreement with
the source's printed Figure 1 widths, not by this circular score.

### Part 2 — the historical confounded 3-D proxy forecast

Arm 1 measured 168 neutral classes. The historical forecast attempted to map a far-field
coefficient-ratio proxy to aspect ratio; this section preserves what was preregistered, not a valid
physical transfer.

`app/scripts/phase6-sdak-arm2-expectation.mjs` fits arm 1's 204 measured
aspect ratios against the attachment anisotropy `r = α_basal/α_prism` its own kinetics imply, then
applies that regression to M1's far-field proxy at the same 204 points. Because neither facet
generally sees sigmaInfinity and CAK→M1 changes the coupled field/geometry, transfer is unearned.

```
ln AR = −0.2659 + 0.5119 · ln r          R² = 0.511
back-check on arm 1: 173/204 = 84.8% per-point class agreement
```

Log-log rather than linear because both sides are ratios, and because the linear form
`AR = 0.7151 + 0.6585 ln r` returns **AR = −0.27** at M1's coldest anisotropy. A negative aspect
ratio is not a conservative prediction, it is an invalid model — and the plates-cold regime that
drives the entire forecast sits in exactly that extrapolated range.

**HISTORICAL REGISTERED PROXY FORECAST—inadmissible as habit evidence**, scored under arm 1's
unmodified 90-point rules:

| | arm 1, measured | arm 2, withdrawn confounded proxy |
|---|---|---|
| headline agreement | **3 / 90** | **42 / 90** |
| neutral | 168 / 204 | 48 / 90 headline |

Under pre-registration 2's scoring the same withdrawn, confounded historical proxy forecast is
**42 of 78** — the numerator is unchanged because all 12 excluded points were assigned neutral by
the proxy. The 42/90 and 42/78 counts are preserved only as historical record: they are
inadmissible as habit evidence and were not valid pre-run habit predictions.

**Historical proxy breakdown (no habit-evidence standing):**

| regime | headline n | proxy-assigned agree | proxy-assigned neutral | arm 1 measured |
|---|---|---|---|---|
| plates-warm | 6 | 4 | 2 | 3 |
| **columns** | **12** | **0** | **12** | **0** |
| plates-cold | 60 | 38 | 22 | **0** |

The following three claims are preserved solely as withdrawn, confounded historical proxy content;
none is habit evidence or a valid pre-run habit prediction:

1. **The entire gain is in plates-cold.** 0 → 38 of 60. If arm 2 does not produce cold plates, the
   prism dip does not do in 3D what it does in 0D, and the arm has failed at its central purpose.
2. **SDAK as M1 still does NOT rescue the column regime.** 0 of 12, all neutral, at −7 and −8 °C.
   M1's own facet contrast there is 0.673 and 0.976 — essentially isotropic. **If arm 2 produces
   columns at −7/−8, this pre-registration is wrong and the model is better than predicted.** That
   is the outcome I would most like to be wrong about, and it was historically registered as a
   prediction rather than left as an unstated hope. ADR 0040 withdraws that interpretation.
3. **WITHDRAWN AS NUMERICALLY INVALID.** The linear form produced nonpositive aspect ratios in the
   M1 query set, yet those impossible values were classified as plates. Its 66/78 score is not an
   upper bound, the 42–66 range is not an uncertainty interval, and the linear branch is refused.
   The positive log-log branch's 42/78 remains a reproducible confounded historical proxy forecast,
   not habit evidence.

### Part 3 — regression-intercept interpretation, withdrawn

At `ln r_proxy = 0` the fitted regression gives **AR = 0.766**, not 1.0. No isotropic
forward run was executed, so this is a fit intercept rather than evidence that an
isotropically-growing crystal measures 0.766. The fitted value is **0.100 from the plate ceiling
and 0.734 from the column floor**. Under that historical proxy fit, reaching the classification
thresholds requires `ln r = −0.273` for plate and `ln r = +1.311` for column. This **4.8×
threshold-distance asymmetry** is a property of the proxy and metric, not a forward-run control.

No lattice-wide or regime-independent bias follows from this intercept. The geometry of `tExtent`
remains a valid metric-design consideration, but it requires its own direct control.

### Part 4 — historical float64-floor calculation, withdrawn

`exp(−σ₀/σ_surf)` enters the binary64 subnormal range near 708.396 and is not zero at 709. M1's σ₀ grows steeply
with |T| — 0.09% at −2 °C against **17.07% at −35 °C** — so the floor is temperature-dependent, and
at the cold end it is not far below the grid.

Measured per temperature, against each temperature's own smallest swept σ∞:

| T (°C) | −2 | −15 | −25 | −30 | −35 |
|---|---|---|---|---|---|
| margin to facet arrest | 453× | 438× | 326× | 214× | **169×** |

The table uses sigmaInfinity, not facet-local sigmaSurf, so it cannot bound evaluated coefficients
at the growing surface or diagnose a no-growth row as arithmetic underflow. It is retained only as
a historical far-field calculation; a valid underflow control must use or bound local fields.

I found this by writing the assertion, not by hitting the bug — and the first version of the
assertion was itself wrong, comparing the −35 °C floor against the whole grid's smallest σ∞, which
lives at −2 °C. It reported a margin of 8× that corresponds to no real point. The test now compares
per temperature and cannot make that mistake.

## Caveats, all of which weaken the prediction above

**Historical regression limitation; no current forecast standing.** 44 of 204 points ask the transfer
function about anisotropies arm 1 never measured — `ln r` down to −1.50 against arm 1's observed
minimum of −0.34 — and they are concentrated at −10 to −23 °C, which is precisely the plates-cold
regime supplying the entire predicted gain. The historical 38-of-60 rests on extrapolation of an
already inadmissible transfer fit and has no habit-evidence standing.

**Historical fit diagnostic: R² = 0.511.** The transfer function explains about half the sampled
variance and under-predicts plates on arm 1 itself (1 predicted against 6 measured). That residual
does not make its cross-parameter-set forecast conservative or admissible.

**σ_surf ≈ σ∞ is a proxy.** Diffusion generally depletes near-surface supersaturation, but the two
facets need not share one local field and geometry changes between CAK and M1. No common-bias
cancellation or direction of error for the coefficient ratio follows.

**None of this is a validation claim.** Every input is provenance class P3, tuned to the diagram the
arm is scored against. A hit is in-sample reproduction (ADR 0005), reported as such everywhere it
appears. The measured information is the bundled M1 forward outcome at the executed configuration;
whether the dip factors themselves survive 3-D requires the matched no-dip arm.

## Implementation, and one guard that had to be restored

M1 is added to `core/src/libbrecht.ts` as a third `NucleationParamSet`, alongside `CAK_A1` and
`CAK`. Two properties were required of the change and are asserted rather than asserted-to:

**It moves nothing.** `sigma0Basal`/`sigma0Prism` keep their existing signatures and values; a pair
of dispatchers routes by set and returns bit-identical results for `CAK` and `CAK_A1`. Phase 2b/4/5
evidence replays unchanged, the Phase 6 libm digest is still `2a9f64b3`, and all three manifest
hashes are unmoved — recomputed after the edit, not assumed. `core/test/libbrecht.test.ts` checks
bit equality with `Object.is` over the whole domain at half-degree steps.

**It keeps an explicit evaluation-domain guard.** A closed form returns a number outside any source
domain unless the code refuses it. TAX2 Figure 1 (2306.13087v1 printed p.6) displays the exact M1
curves over (Tm − T) ∈ [1, 50] °C and says the text defines them, so M1 is bounded to that **source
model display domain**. This does not claim direct measurements anchor every temperature; cold rows
remain P3/model-prescription territory. Found by a test failing at −0.5 °C, then corrected against
the primary figure rather than by inheriting CAK's unrelated anchor range.

The Phase 6 grid (−2 … −35 °C) lies inside that displayed domain. The guard rejects proposals outside
it unless a later decision freezes a new source-supported or explicitly extrapolated policy.

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

**Costs.** The named bistable set contains 18 raw rows, but −4 °C was already ambiguity-excluded;
the net headline denominator change is 90→78, or 12 rows. M2 and the width-dependent hypothesis are
deferred. A forward agreement under M1 would be an in-sample result for that prescribed model, not
validation of the all-facets-narrow assumption or SDAK causality.

**Forecloses.** Deciding how to score the bistable band after seeing what it produced. Building a
sub-grid closure with a tunable parameter and reporting the agreement it buys. Reporting the 0D 15/15
as a result. Treating a miss at the third transition as informative. Reporting arm 2's headline under
a denominator arm 1 was not scored against, without also reporting the common one.

## Alternatives considered

**Run M2 with a facet-width proxy keyed to integer surface-cell counts.** Rejected for arm 2 as the
primary. It is the physically richer model and it is what a full test of SDAK eventually requires,
but its closure has a free strength parameter for which the reviewed source set supplied no
transferable value, and an arm whose result depends on an unconstrained closure cannot distinguish
the hypothesis from the tuning. Deferred to a
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
