# Findings ledger — share-worthy results and the evidence behind them

**Maker-directed (2026-07-28).** A running ledger of findings worth sharing outside this
repository, in three classes: **A** — the model reproducing measured reality; **B** —
uncharted territory entered with supporting evidence (firsts); **C** — queued items that
become share-worthy when they land. This file records claims and their evidence; it grants
nothing. External sharing remains maker-gated through
[stretch-sharing-and-investigation.md](stretch-sharing-and-investigation.md) §4, and every
entry names its verification status per Rule 6. Append new entries with a date and evidence;
never soften or delete an entry — supersede it with a note, the way ADRs do.

**2026-07-29 audit pass:** B2 is retracted in its necessity form, A3 superseded in part,
A1's stated limit reversed, B1/C2 updated to the corrected CAK arm (3/90) — each carries its
note in place, per this file's own supersession rule. The measured artifacts were never in
question; every correction is to interpretation.

**2026-08-01 adversarial correction:** the Phase 6 gate is active and incomplete; 3/90 and 54/90
are measured-only counts. CAK→M1 is a bundled parameterization change, not a matched dip ablation;
the columns ladder is outcome 4; and priority/theorem wording unsupported by the measured scope is
withdrawn below. Reviewer: OpenAI `gpt-5.6-sol`, ultra reasoning, inheriting the current request and
handoff context but not involved in Phase 6 authoring. It independently re-ran the artifact
verifiers, reconciliation, flip census, ladder reader, JSON count/fragility/f = 0.90 recomputations,
and the live fingerprint. It did not re-run the 408 long solver jobs, GPU or held-out campaigns,
audit `docs/education/**`, or run complete `npm test`; those remain explicit limits.

---

## A. Reproductions of measured reality

**A1 — Qualitative −5 °C no-column overlap; numerical metric equivalence withdrawn
(corrected 2026-08-01).** Libbrecht's substrate experiments at −5 °C found aspect ratios
`0.1 < rho_aspect < 1`, "Columnar crystals (with rho_aspect > 1) were absent", many "blockier,
nearly isometric" (arXiv:1912.03230v1 pp. 10, 13, verified verbatim). **Metric correction:**
Libbrecht's `rho_aspect = H/R` has not been shown equivalent to the project's
`zExtent/tExtent`; the latter uses a corner-to-corner diameter-like transverse extent, and an
equal-area radius mapping shifts the ratio by about 10%. The earlier numerical range-overlap claim
is therefore withdrawn. What remains is the qualitative observation that neither source produced
columns at −5 °C. This is contextual overlap, not validation: the experiment used a
substrate and its inputs informed the parameterization, while the simulated geometry is a free
lattice crystal. It cannot by itself establish either implementation correctness or theory
insufficiency. Evidence: sweep report (`6995868`), −5 °C probe
(`e1c1d09`), ten-paper text sweep (`ad70792`),
[research/libbrecht-figure-findings.md](../research/libbrecht-figure-findings.md).
Status: verified in-repo. Stated limit, REVERSED 2026-07-29 (`264a9e2`): the
"sigma_0_prism 1.6–3.2× higher" concern was measured against M2, which is the outlier
(×3.01) of the same author's two printed forms — the dedicated measurement papers (0.03% at
−2 °C, ~0.2% at −5 °C) match our digitized curve to ~7%, so the warm end stands on better
inputs than the original entry believed.

**A2 — The digitized parameter extraction reproduces the printed closed forms it never saw
(2026-07-28).** The Figure 4.5 digitization was done before the closed-form papers were
found; against arXiv:2009.08404v2 Eq. (5), the digitized A_prism anchors reproduce the
printed curve to 8.4% worst and ~2% typically, and arXiv:2306.04042v1 Table 1 matches the
dedicated −2/−5 °C measurement papers exactly. An extraction that agrees with sources it had
no access to is independently confirmed, not merely self-consistent. Evidence:
`app/scripts/phase6-libbrecht-closed-forms.mjs` (re-runnable), figure-findings §2.
Status: verified in-repo.

**A3 — The sigma_0 crossing is source-robust in sense and rough location.** Three independent
parameterizations — our digitized anchors, 2306.13087v1 M2, 2009.08404v2 Eq. (3) — each have
exactly one broad-facet crossing, at (Tm−T) = 10.00 / 8.39 / 10.92, all with the same sense.
The location carries no evidential weight (WP4: the ±25% band moves it across a 16 °C span,
`aff4ca7`), but the sense and the count are invariant, and the falsifiable claim was restated
to be exactly those. Status: verified in-repo (computed from printed forms).

> **SUPERSEDED IN PART, 2026-07-29 (`5463e76`)** — the invariance-of-count claim is refuted:
> three sigma_0 crossings are reachable inside the registered ±25% per-anchor band (6,561 of
> 19,683 corner combinations; the plan had already recorded this at one line while claiming
> invariance at another), and the habit-relevant quantity is alphaHK, not sigma_0 alone.
> What stands: the three *nominal* parameterizations each show one sigma_0 crossing near
> (Tm−T) ≈ 8–11, and each executed constant-f pure-class ladder shows at most one reversal over
> the sampled temperatures (see B10). That is a scoped measurement, not a structural bound.

**A4 — Transcription-fidelity floor (2026-07-27).** Table 2.1 transcription verified
cell-perfect against the page image; the sigma axis verified against Murphy–Koop within 0.5%
from −5 to −35 °C; the percent-vs-fraction trap closed in docs and code alike. Not lab-data
reproduction — recorded here as the fidelity baseline the A-class entries stand on.
Status: verified by independent review agents 2026-07-27; spot-checks reproducible.

## B. Firsts — uncharted territory entered, with supporting evidence

**B1 — RETRACTED as an independent or causal SDAK test.** The corrected CAK artifact contains 204
valid measured rows, 3/90 measured-only agreement, and classes 6/168/30; it shows that this executed
broad-facet parameterization does not reproduce the diagram at extent 21. It does **not** test that
SDAK is load-bearing. CAK→M1 changes the broad `sigma_0` forms and `A_prism` as well as adding dips,
so the two-arm comparison is confounded, and the registered conservative-intersection headline was
never produced. The larger-size comparison is also explicitly inadmissible as gate evidence. The
2026-07 literature sweep was not preserved as an exhaustive priority review. A causal test requires
a frozen M1-without-dips arm; a priority claim requires a current systematic literature search.
Evidence status: historical measurements independently re-derived, scientific gate incomplete.

**B2 — The counting argument: no broad-facet model can produce the diagram, and the two
missing boundaries are the two SDAK dips (2026-07-28).** A habit boundary requires the
sigma_0 curves to swap order, so the crossing count bounds the transition count — independent
of diffusion, grid, seed, far field, domain. Every broad-facet parameterization has one
crossing; Nakaya needs three; M1-with-dips has five; and the source's own Figure 1 draws the
habit bands at the crossings. Confirmed three ways: counting, the source's figure, and the
solver at its most favorable point (−5 °C, full CAK) moving AR 0.3821 → exactly 1.0000 —
reaching *no* habit, not the other habit. Evidence: `0cd209f`, memory note, closed-forms
script. Status: verified in-repo. This upgrades B1 from "didn't match" to "provably can't
match, and here is why."

> **RETRACTED IN ITS NECESSITY FORM, 2026-07-29 (`5463e76`)** — an 18-agent adversarial
> audit refuted the bound and the refutation was reproduced before recording. Two errors:
> the crossing count was computed on sigma_0 alone, while habit depends on the ordering of
> alphaHK = A·exp(−sigma_0/sigma_surf) — with A_prism included, the printed 2009.08404
> broad-facet set has THREE alphaHK crossings for sigma_surf 0.199–0.399%, and the
> registered CAK set has three in [0.247%, 0.366%], a band containing 2 of the 204 sweep
> points; and the five-crossing M1 figure used the wrong log base (log10 gives three, at
> (Tm−T) = 3.08/8.07/24.73 — close to the reference boundaries 3.3/9.9/21.5). "Independent
> of diffusion" was also false: the count is a function of sigma_surf, which diffusion
> sets. **What survives, at measured strength:** along this sweep's own sampled constant-f ladders
> the `alphaHK` reversal count is 1 at f = 0.10 and 0 at every larger sampled f. That count does
> not imply a habit-transition bound. Separately, the direct measured-only habit comparison and
> pure-class flip census show that this executed parameterization does not reproduce the diagram
> under the sampled protocol. Whether any broad-facet model can is OPEN again, which makes the SDAK
> arm's outcome genuinely uncertain rather than foregone.

**B3 — The measured shape of broad-facet failure: two corpus findings (2026-07-28).** (i) The
crossing marks where plate *stops*, not where column *starts* — a ~10 °C neutral band
separates them, the largest feature of the measured diagram; crossing location and
habit-transition location are different observables. (ii) Rising supersaturation destroys
habit outright — zero columns anywhere at f ≥ 0.25, all-neutral at f = 0.90, precisely where
the reference is most structured. The earlier claim that neither observation appeared in the
literature is withdrawn pending a current systematic source review. Evidence:
`6995868` findings 3–4. Status: measured (re-sweep pending, cold band bit-identical under
either parameter set per ADR 0031).

**B4 — Five sampled seed geometries moved two temperatures in the same direction (2026-07-28).**
Seed geometry moves AR substantially (+0.41 warm, +0.51 cold; a needle seed produced a genuine
column at −15 °C, where the diagram wants a plate). Across the five executed seeds, both sampled
temperatures moved in the same direction while the two bands demand opposite moves. This is a
five-seed/two-temperature sensitivity result, not a bound on every temperature-independent knob and
not proof that no such choice could create a flip. Evidence: `64e5b4b`. Status: measured, five seeds.

**B5 — Implementation and quantitative verification of the monopole-matched far field
in this 3-D solver, plus a measured Dirichlet-shell domain bias (2026-07-26).**
The boundary condition is the source's own unimplemented proposal; the verification (291 vs
279 attached under fixed-sigma → 231 at both domains under monopole) and the 4.1% bias number
are the measured part. Evidence: ADR 0024, `c16208e`. The earlier literature-priority claim is
withdrawn until a current systematic search establishes it. Status: verified in-repo implementation
and measurement; novelty not established.

**B6 — A one-symbol inconsistency in the printed monograph Eq. 3.35
(2026-07-26).** The corrected form is Libbrecht's own — printed correctly in JCMP 2013
Eq. (29), the very source the book cites — so the physics is his; the misprint report is
ours. Consequence is first-order: finite-shell bias up to ~160% at prior configurations.
Evidence: `7d821ee`, `solver-cpu/src/spherical-reference.ts`, independent re-derivations
2026-07-27. Status: the cross-source inconsistency and numerical consequence are verified in-repo;
the earlier “unreported anywhere” priority claim is withdrawn pending a current systematic search.
Courtesy email drafted, maker-gated.

**B7 — The pre-registration apparatus itself (2026-07-27/28).** Frozen hashed protocol,
registered expectations including the model's own probable failure, ambiguity bands fixed by
formula before the grid, and — under ADR 0031 — the first amendment that cost something:
a protocol violation caught, the free amend-the-registration alternative rejected by name,
and the corrected headline *predicted to be worse in advance* so the parameter set can never
be chosen by score (scored 2026-07-29: predicted ≈2/90, measured 3/90 — the prediction's
direction held, its model did not, and both facts are recorded, `264a9e2`). No precedent in
this literature per the 2026-07 sweep. Status: on the record in ADRs 0025–0028, 0031–0032.
The 2026-07-29 retraction pass (`5463e76`) belongs in this entry too: an 18-agent audit
refuting the phase's central interpretive claim, reproduced before recording, retractions at
document heads — the apparatus applied to interpretation, one publication too late. The earlier
“no precedent in this literature” claim is not current priority evidence and is withdrawn.

**B8 — M1 versus CAK is a trade; causal SDAK attribution withdrawn (2026-07-30, corrected
2026-08-01).** Both historical arms ran: `CAK` (broad-facet) and `M1` (dipped), same solver, same grid, same seed,
same measurement size, same scoring rule, parameter set the only intended difference — and each
of arm 2's 204 rows carries its own echoed `paramSet=M1`, so that is checkable rather than
asserted. Common denominator **3/90 → 54/90**. The number is the least informative part.
**The bundled parameter-set change converts 66 neutral points to plates and loses 20 of CAK's 30
columns** (14 → neutral,
6 → plate); warmest column −19 °C → −30 °C; and in `columns-and-plates` — the one regime that
accepts *both* pure classes, therefore the easiest on the board — arm 2 is **worse than the
control, 26/78 → 14/78** (the published tallies, whose denominators already exclude the ±1.0 °C
ambiguity band). At f = 0.10, arm 2's plate band runs unbroken from −9 °C to −24 °C, 2.5 °C past the
boundary; this is a shape of the bundled M1 result, not a dip-only mechanism assignment. Two further
measured facts: **at f = 0.90 CAK and M1 have identical classes at all 34 temperatures, while raw AR
differs in 28/34 pairs with maximum `|ΔAR| = 0.218335`**, and the dominant M1 class is
still *no habit*, 119 of 204 neutral. Because CAK→M1 also changes the broad forms and `A_prism`,
neither the trade nor the f = 0.90 equality identifies the SDAK dips' causal effect. A matched
M1-without-dips arm is required.
Against this, one genuine gain reported in arm 1's favour being removed: arm 1 produced **three
columns inside `plates-cold`** where the reference demands plates, two in headline scope; arm 2
has none. Evidence: `research/phase6-two-arm-report.md`, `evidence/phase6-sweep-arm2/` (values hash
`13e678d5…`, freeze `483f7ee5`, execution `8c781b16`), independent verifier PASS on all 204 rows
importing nothing from `runner/src`, **16 negative controls executed — 15 CAUGHT, 1 GAP**.
Status: measured and independently verified. **Stated limits, all registered before the sweep:**
in-sample by construction (ADR 0005 — the dip centres were chosen against this diagram); the
42/90 prediction was beaten by 12 entirely in the regime its transfer function had to extrapolate
over and in the direction it was known to under-predict; the instrument favours plates **4.81× in
`ln AR`**; all five `plates-warm` agreements sit at −2 °C, the regime's only counting temperature,
which ADR 0025 pre-registered as weightless. Unregistered fifth limit: the artifact was
regenerated, not written by its own sweep (erratum E4).

**B9 — The executed extent-21 corpus's AR spacing, measured rather than assumed (2026-07-30).**
`AR = zExtent/tExtent` with `zExtent` an integer layer count, so AR is discrete — and how coarse
it is at the class thresholds had never been quantified. **408 measurements across both arms
produced 36 distinct AR values.** Near the column floor the realized ladder is 1.3125, 1.4000,
1.5000, 1.6154 — steps of 0.0875 and 0.1000 — and **no measurement in either arm lands strictly
between 1.4 and 1.5**. Arm 2's best columns-regime point sits at `tExtent 15` where qualifying
needs 14: **one lattice cell.** This is why "closest approach 1.4000 against a floor of 1.5" is not a
physical distance. The 36-value census is empirical for these 408 rows and this size; it is not a
lattice theorem or a resolution guarantee at other sizes. The registered `extentFragile` rule
(±0.135 AR, ADR 0025) was already flagging
the point — the protocol's own fragility test pointed here before anyone connected it to the
columns claim, which is the apparatus catching something ahead of its author. Evidence: computed
from the two published `points.json` files; diagnostic pre-registered with all four outcomes fixed
in advance at `docs/phase6-columns-refinement-prereg.md`. Status: measured in-repo.

**B10 — Neither parameterization returns from column to plate under the registered sampled-ladder
operator (2026-07-31).** ADR 0025
registers the habit-flip count as "itself a first-class result"; `phase6DetectFlips` had never
been called outside tests and neither arm's artifact carried one (pin register R55). Produced at
last, from the published rows at zero compute. Scanning warm to cold along each constant-f ladder,
the pure-class operator skips neutral rows. **Both arms produce exactly two flips total: one
`plate→column` flip on 2 of 6 constant-f ladders and zero flips on the other 4. Neither produces a
`column→plate` flip under this operator.** The Nakaya diagram changes habit three times,
and the middle one — `column→plate` at −9.9 °C — is precisely the one absent. This is sharper than
the class census: the sampled pure-class sequences do not return after their observed transition.
The M1 parameterization narrows the two observed flip brackets (15 → 6 °C at f = 0.10, 20 → 10 °C
at f = 0.15) while moving both colder; CAK→M1 is bundled, so this cannot be assigned to the dip
factors alone. M1 has three `alphaHK` crossings, yet only 2 of its 6 sampled ladders contain a
registered flip. Thus, in this corpus, crossing count and habit-transition count are different
observables. Evidence:
`app/scripts/phase6-flip-census.mjs`, which runs the registered operator AND an independent
re-derivation from the registered definition and requires them to agree on all twelve ladders; they
do. Status: measured in-repo, both implementations agreeing. Carries B8's four registered limits
and erratum E5 (no convergence study exists warmer than −15 °C under either executed parameter set).

**B11 — Four CAK output rows reproduce across two architectures; the input fingerprint differs
(2026-07-31, quantified 2026-08-01).** The Phase 6 cross-platform
control, registered at WP0c and carried as MAC RUN NEEDED through the entire phase, executed on an
Apple M4 under the SAME Node v24.13.1 / V8 13.6.233.17-node.40 build as the x64 host, so it isolates
architecture and platform libm rather than engine version. **It splits, and both halves are the
result.** Tier 1, the 448-entry libm fingerprint, **DIFFERS**: x64 `2a9f64b3`, arm64 `3662b9e2`.
IEEE 754 does not specify `exp`/`log`/`pow`, and two conforming implementations are measured
different in **9 of 448 entries**, with ULP distances 1, 1, 2, 3, 4, 5, 7, 11 and 31 (maximum at
`alphaHK.prism|-14.0@0.25`) — so no bitwise reproducibility claim in this
project extends off a single architecture, and Phase 2b's refusal to make a cross-engine bitwise
claim is now measured rather than assumed. Tier 2, the four registered fixture points, **REPRODUCED
EXACTLY** — same steps, same attached count, same aspect ratio, `symErr = 0` and `deltaSymClean`
throughout — **including `fragile-column-floor` whose AR is exactly 1.5000, sitting on the class
boundary by an integer tie that could have broken either way and did not.** So habit-class
outputs reproduce across the two tested architectures at those four CAK points even though nine
fingerprint inputs differ. Nothing here establishes the other 200 CAK points or any M1 point.
Verified on x64: the committed 448-entry table recomputes to `3662b9e2` under
the project's own FNV-1a transcribed by hand, and all four tier-2 rows match the values pulled
independently from `evidence/phase6-sweep/points.json`. Evidence: `docs/phase6-cross-platform-control.md`
§Result, `evidence/phase6-crossplatform/arm64-libm-fingerprint.txt`,
`evidence/phase6-crossplatform/x64-libm-fingerprint.txt`, and
`PHASE6_LIBM_DIGEST_ARM64_BASELINE`. Closes pin-register
R28 — the digest assertion returned early on non-x64, so it was a no-op on precisely the machine the
control needed; now pinned on both measured architectures with a third test asserting they disagree,
which runs everywhere and cannot be vacuous. Status: measured on both architectures, independently
re-verified. Limit: four CAK points, not either 204-point sweep.

**B12 — A registered protocol whose own remediation instruction does not remediate (2026-07-31).**
The `domain-budgets` freeze row makes the sweep's validity at N = 48 conditional on a spot-check at
the fastest-growing point, registers the criterion inside the **gated** manifest (identical habit
class AND attached counts within 0.5%), and registers the failure consequence: *raise the domain to
N = 64 for the ENTIRE grid and re-run it.* **The check had never been executed in the phase's
history and was never disclosed as outstanding.** Executed against both arms and both natural
readings of "fastest-growing", each re-derived from `points.json`: **3 of 4 FAIL**, by 3–5× the
tolerance. Then, before spending the ~780 core-hours the consequence demands, the same criterion was
applied one rung up — **N = 64 against N = 80 fails 3 of 4 as well** (worst 1.861%). **So the
registered remediation would have produced 408 fresh points at a domain that fails the very
spot-check that ordered the re-run.** That is a defect in the registration rather than a wrong
number. Under the old resource budget, escalating N alone looked expensive: successive differences
run 2.495% → 1.861%, a ratio of 0.746. If that measured ratio persisted, four further reductions
would leave about 0.576%, while **five** would reach about 0.430%; this extrapolation is a cost probe,
not a convergence proof. **Habit class is identical at the four sampled points in both comparisons**,
so those four class readings are unchanged. Matched domain sizes do not prove equal bias across arms,
and the registered conservative-intersection headline was never produced.
Evidence: `app/scripts/phase6-domain-spot-check.mjs`, `phase6-domain-escalation.mjs`, errata E6,
ADR 0037. Status: measured; the maker's 2026-08-01 science-first direction supersedes the old
no-re-sweep scheduling decision and requires a new convergence campaign. The measurements do not
prove that a satisfying configuration is unreachable.

**B13 — M1 and CAK separate at one −5 °C diagnostic point; causal and priority claims withdrawn
(2026-08-01).** At −5 °C, f = 0.10, measured at extent 29 with two domain sizes sampled at the
box sizes: **arm 2 (`M1`, dipped) AR 1.52632, `COLUMN`; arm 1 (`CAK`, broad-facet) AR 0.851852,
`neutral`.** Identical temperature, identical σ∞, identical measurement size, **0.675 apart and on
opposite sides of the class boundary.** The class holds `COLUMN` at extents 29, 35 and 41 at BOTH
N = 64 and N = 80, with the aspect ratio identical to six figures at every tested domain pair — so
the sampled class is invariant over those tested pairs. The control was added
after the crossing was seen, and CAK→M1 changes the broad `sigma_0` forms and `A_prism` as well as
the dips. It is therefore not a matched SDAK ablation. The owning pre-registration also says the
diagnostic is not gate evidence, and no current exhaustive literature search supports priority.
**Two qualifications carried with it:** at f = 0.90 CAK rises to 1.46429 at the largest measured
extent 41; no crossing was measured, and the former post-hoc extent-44 extrapolation is retracted.
Thus the f = 0.10 separation does not establish an f = 0.90 class result. Separately, the registered domain criterion
**fails** at
extent 35 on attached count (1.071%, 120 cells of interior fill inside a bit-identical envelope)
while class and AR are domain-invariant, so no configuration is *demonstrated* converged and no
re-sweep was run (ADR 0037 §5). Evidence: `docs/phase6-columns-refinement-prereg.md`,
`docs/phase6-convergence-study-prereg.md`, `evidence/phase6-columns-ladder/ladder.json`,
`app/scripts/phase6-ladder-read.mjs`. Status: measured diagnostic; same-extent domain comparisons
are recorded and the registered criterion is mixed rather than passed. P1's deciding rule was fixed
before its B/C runs. **Registered diagnostic outcome: 4, non-monotone**
(1.40000 → 1.52632 → 1.52174 → 1.64000), not the previously claimed outcome 1 or convergence.
**This also withdrew the two-arm report's central negative claim.** "Neither arm produces a column in
the Nakaya `columns` regime" is now scoped to *at the registered measurement size* — where it remains
true and is what 3/90 and 54/90 score. The unqualified form is retracted at the head of the report's
§4 rather than edited away.

## C. Queued — share-worthy when it lands

**C1 — The dipped M1 arm** (ADR 0030): **LANDED 2026-07-30 — see B8.** The earlier “first 3-D run”
priority claim is withdrawn. Its two pre-registered hazards both materialized as registered: the
~50 nm terrace
scale was avoided by running M1 rather than M2 (no free strength parameter, which is what keeps
the arm falsifiable), and the bistable band at −4/−5/−6 °C **failed in the only way its rule
allowed** — that rule accepts *either* pure class, so its single failure mode is producing
neither, and all 18 points did: 0 agree, 18 neutral. Registered in advance as "not an amnesty";
it was not one. **C2 — The re-sweep under ADR 0031**: LANDED 2026-07-29 — actual
3/90 against the registered ≈2/90, scored honestly including the note that the
throttle-to-rise model behind the prediction was wrong (`264a9e2`); the
prediction-then-measurement pair is on the record. **C3 —
Held-out tests** (stretch register §3): free-fall growth data, facet-rate curves via the 1D
reference, size-dependent habit, pressure ladder. **C4 — The Eq. 3.35 erratum email** once
the maker sends it. **C5 — The ADR 0024 validity-limit mystery** if the governing quantity is
ever identified.
