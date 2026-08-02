# Findings ledger — share-worthy results and the evidence behind them

**Maker-directed (2026-07-28).** A running ledger of findings worth sharing outside this
repository, in three classes: **A** — comparisons against empirical sources; **B** —
repository findings with supporting evidence; **C** — queued items that
become share-worthy when they land. This file records claims and their evidence; it grants
nothing. External sharing remains maker-gated through
[stretch-sharing-and-investigation.md](stretch-sharing-and-investigation.md) §4, and every
entry names its verification status per Rule 6. Append new entries with a date and evidence;
never soften or delete an entry — supersede it with a note, the way ADRs do.

**Priority scope.** The historical A/B/C labels are retained for traceability, but “first” means
first recorded in this repository unless an entry names a current systematic literature search and
its coverage. Agreement among a digitization, closed form and table from the same author/source
lineage is a useful transcription check, not independent experimental reproduction.

**2026-07-29 audit pass:** B2 is retracted in its necessity form, A3 superseded in part,
A1's stated limit reversed, B1/C2 updated to the corrected CAK arm (3/90) — each carries its
note in place, per this file's own supersession rule. That audit did not change the published
artifact bytes; its claim was limited to the then-checked interpretation and was not an exhaustive
validation of those artifacts or the gate.

**2026-08-01 adversarial correction:** the Phase 6 gate is active and incomplete; 3/90 and 54/90
are measured-only counts. CAK→M1 is a bundled parameterization change, not a matched dip ablation;
the columns ladder is outcome 4; and priority/theorem wording unsupported by the measured scope is
withdrawn below. Reviewer: OpenAI `gpt-5.6-sol`, ultra reasoning, inheriting the current request and
handoff context but not involved in Phase 6 authoring. It independently re-ran the artifact
verifiers, reconciliation, flip census, ladder reader, JSON count/fragility/f = 0.90 recomputations,
and the live fingerprint. It did not re-run the 408 long solver jobs, GPU or held-out campaigns,
audit `docs/education/**`, or run complete `npm test`; those remain explicit limits.

---

## A. Comparisons against empirical sources

**A1 — Qualitative −5 °C no-column overlap; numerical metric equivalence withdrawn
(corrected 2026-08-01).** Libbrecht's substrate experiments at −5 °C found aspect ratios
`0.1 < rho_aspect < 1`, "Columnar crystals (with rho_aspect > 1) were absent", many "blockier,
nearly isometric" (arXiv:1912.03230v1 pp. 10, 13, verified verbatim). **Metric correction:**
Libbrecht's `rho_aspect = H/R` has not been shown equivalent to the project's
`zExtent/tExtent`; the latter uses a corner-to-corner diameter-like transverse extent, and an
equal-area radius mapping shifts the ratio by about 10%. The earlier numerical range-overlap claim
is therefore withdrawn. What remains is the qualitative observation that the experiment reported
no columns and the run produced no threshold-classified columns at −5 °C. This is contextual
overlap, not validation: the experiment used a
substrate and its inputs informed the parameterization, while the simulated geometry is a free
lattice crystal. It cannot by itself establish either implementation correctness or theory
insufficiency. Evidence: corrected CAK artifact `evidence/phase6-sweep/` (its report records
executed head `390fe35a049e6da391c429c1f446fb2ca2cdb931`), −5 °C probe (`e1c1d09`), ten-paper text sweep (`ad70792`),
[research/libbrecht-figure-findings.md](../research/libbrecht-figure-findings.md).
Status: verified in-repo. Stated limit, REVERSED 2026-07-29 (`264a9e2`): the
"sigma_0_prism 1.6–3.2× higher" concern used M2 as its comparator. Against the dedicated papers'
source-fit parameters, the digitized anchors are 0.028% versus 0.03% at −2 °C (6.7% low) and
0.27% versus approximately 0.20% at −5 °C (35% high; 0.07 percentage point absolute). M2 is
×3.01/×2.14 and `2009.08404v2` Eq. (3) is ×1.07/×1.54 relative to the −2/−5 °C source fits.
This refutes a uniform 1.6–3.2× low bias but does not establish uniform ~7% agreement; it is a
same-lineage transcription/provenance check, not independent physical validation.

**A2 — The digitized `A_prism` anchors have a later-printed same-lineage Eq. (5) route check;
Table 1 separately repeats two source-fit rows (2026-07-28).** The Figure 4.5 digitization was done
before the closed-form papers were found. Against arXiv:2009.08404v2 Eq. (5), its digitized
`A_prism` anchors agree with the printed curve to 8.4% worst and ~2% typically. Separately,
arXiv:2306.04042v1 Table 1 repeats the dedicated −2/−5 °C papers' source-inferred parameters
exactly. The first comparison gives those `A_prism` anchors a second transcription route; it does
not establish agreement for every digitized `sigma_0` input or for the parameter table as a whole.
Because the compared forms and tables share the same author/source lineage, neither check is
independent experimental replication or physical validation. Evidence:
`app/scripts/phase6-libbrecht-closed-forms.mjs` (re-runnable), figure-findings §2.
Status: verified in-repo.

**A3 — Nominal broad-facet `sigma_0` function diagnostic.** Three parameterizations — our
digitized anchors, 2306.13087v1 M2, 2009.08404v2 Eq. (3) — each have one nominal `sigma_0`
crossing, at (Tm−T) = 10.00 / 8.39 / 10.92. These are function-level numbers, not a habit
ordering, transition sense, robustness theorem or independent morphology result. Status: nominal
crossings verified in-repo from the printed forms; interpretation superseded below.

> **SUPERSEDED IN PART, 2026-07-29 (`5463e76`)** — the claimed invariance proof is invalid:
> three sigma_0 crossings are reachable inside the registered ±25% per-anchor band (65,536 of
> 262,144 independent lower/upper corners, or 6,561 of 19,683 unique relative-factor patterns
> after equal-scale pairs are collapsed; the plan had already recorded this at one line while claiming
> invariance at another), and morphology depends on the full local attachment coefficients
> evaluated at each facet's solver-produced surface field plus the coupled evolution—not
> `sigma_0` alone or one equal-field coefficient ordering.
> What stands: the three *nominal* parameterizations each show one sigma_0 crossing near
> (Tm−T) ≈ 8–11, and each executed constant-f pure-class ladder shows at most one reversal over
> the sampled temperatures (see B10). That is a scoped measurement, not a structural bound.

**A4 — Transcription-fidelity floor (2026-07-27).** The historical workflow reported Table 2.1's
transcription cell-perfect against the page image, the sigma axis within 0.5% of Murphy–Koop from
−5 to −35 °C, and the percent-vs-fraction trap closed in docs and code alike. This is not lab-data
reproduction; it is the producer-reported fidelity baseline the A-class entries stand on. Status:
separate historical reviewers performed the recorded checks, but the surviving record does not name
their models, shared-context status, reruns, or limits, so independence under current Rule 10 cannot
be established. The spot-check procedures remain reproducible; this correction did not re-execute a
fresh full-table review.

## B. Repository findings — supporting evidence and explicit priority limits

**B1 — RETRACTED as an independent or causal SDAK test.** The corrected CAK artifact contains 204
valid measured rows, 3/90 measured-only agreement, and classes 6/168/30; it shows that this executed
broad-facet parameterization does not reproduce the diagram at extent 21. It does **not** test that
SDAK is load-bearing. CAK→M1 changes the broad `sigma_0` forms and `A_prism` as well as adding dips,
so the two-arm comparison is confounded, and the registered conservative-intersection headline was
never produced. The larger-size comparison is also explicitly inadmissible as gate evidence. The
2026-07 literature sweep was not preserved as an exhaustive priority review. Isolating the
implemented dip factors' effect on this solver requires a frozen M1-without-dips arm, which still
cannot establish physical SDAK causality or necessity in nature; a priority claim requires a current
systematic literature search.
Evidence status: historical measurements independently re-derived, scientific gate incomplete.

**B2 — RETRACTED counting argument: no broad-facet model can produce the diagram, and the two
missing boundaries are the two SDAK dips (2026-07-28).** A habit boundary requires the
sigma_0 curves to swap order, so the crossing count bounds the transition count — independent
of diffusion, grid, seed, far field, domain. Every broad-facet parameterization has one
crossing; Nakaya needs three; M1-with-dips has five; and the source's own Figure 1 draws the
habit bands at the crossings. Confirmed three ways: counting, the source's figure, and the
solver at its most favorable point (−5 °C, full CAK) moving AR 0.3821 → exactly 1.0000 —
reaching *no* habit, not the other habit. Evidence: `0cd209f`, memory note, closed-forms
script. Status: verified in-repo. This upgrades B1 from "didn't match" to "provably can't
match, and here is why."

> **WITHDRAWN IN ITS NECESSITY FORM, 2026-07-29 (`5463e76`)** — an adversarial
> audit invalidated the claimed proof. Two errors:
> the crossing count was computed on sigma_0 alone, while the restricted equal-field attachment
> coefficient is alphaHK = A·exp(−sigma_0/sigma_surf) — with A_prism included, the printed 2009.08404
> broad-facet set has THREE equal-shared-field alphaHK equality events for sigma_surf
> 0.199–0.399%, and the registered CAK set has three in [0.247%, 0.366%]. Two sigmaInfinity inputs
> lie numerically in
> that interval, but no implication follows for facet-local sigmaSurf. The five-event M1 figure used
> the wrong log base (log10 gives three exact `sigma_0` equalities—and, because M1 has unit
> prefactors, equal-shared-positive-field coefficient equalities—at
> (Tm−T) ≈ 3.08/8.07/24.73 — close to the reference boundaries 3.3/9.9/21.5). "Independent
> of diffusion" was also false. For unequal-prefactor CAK, even the restricted equal-shared-field
> count varies with the selected shared sigmaSurf; for unit-prefactor M1, its three restricted
> equalities are independent of which shared positive sigmaSurf is chosen. Neither shortcut transfers
> to the generally unequal facet-local fields. Actual morphology additionally depends on those
> fields, geometry, size and evolution.
> **What survives:** the far-field proxy diagnostic has one equal-field coefficient-order swap at
> f = 0.10 and none at every larger sampled f. That is analytic proxy output, not a measured solver
> `alphaHK` reversal count, and it does not imply a habit-transition bound. Separately, the
> artifact-derived measured-only habit comparison and pure-class flip census show that this
> executed parameterization does not reproduce the diagram
> under the sampled protocol. Whether any broad-facet model can is open; the audit did not supply a
> 3-D counterexample or establish the withdrawn conclusion's negation. This makes the SDAK
> arm's outcome genuinely uncertain rather than foregone.

**B3 — Two artifact-derived CAK class patterns (2026-07-28, corrected 2026-08-01).** (i) In the
corrected CAK artifact, the two ladders containing both classes have 14 and 19 intervening
integer-temperature neutral rows (15 °C and 20 °C endpoint gaps, respectively). Those are observed
class boundaries, not a nominal
`sigma_0` equality or an `alphaHK` equality at one shared field. (ii) No CAK row at f ≥ 0.25 is a
column, and all f = 0.90 rows are neutral. This is a census of the executed extent-21 artifact, not
a theorem that supersaturation destroys habit or a causal explanation of the pattern. The earlier
priority claim is withdrawn pending a current systematic source review. Evidence:
`research/phase6-sweep-report.md`, corrected CAK artifact `evidence/phase6-sweep/`. Status: measured;
the registered scientific gate and convergence obligations remain incomplete.

**B4 — Five sampled seed geometries moved two temperatures in the same direction (2026-07-28).**
Seed geometry moves AR substantially (+0.41 warm, +0.51 cold; a needle seed produced a
threshold-classified column at −15 °C, where the diagram evaluator wants a plate). Across the five executed seeds, both sampled
temperatures moved in the same direction while the two bands demand opposite moves. This is a
five-seed/two-temperature sensitivity result, not a bound on every temperature-independent knob and
not proof that no such choice could create a flip. Evidence: `64e5b4b`. Status: measured, five seeds.

**B5 — Implementation and quantitative verification of the monopole-matched far field
in this 3-D solver, plus a measured Dirichlet-shell domain bias (2026-07-26).**
The boundary condition is the source's own unimplemented proposal; the verification (291 vs
279 attached under fixed-sigma → 231 at both domains under monopole) and the 4.1% bias number
are the measured part. Evidence: ADR 0024, `c16208e`. The earlier literature-priority claim is
withdrawn until a current systematic search establishes it. Status: verified in-repo implementation
and measurement. The spherical analytic comparison checks the implementation/discretization for an
idealized boundary-value problem; it is not physical absolute accuracy or parameter validation.
Novelty is not established.

**B6 — A one-symbol inconsistency in the printed monograph Eq. 3.35
(2026-07-26).** The corrected form is Libbrecht's own — printed correctly in JCMP 2013
Eq. (29), the very source the book cites — so the physics is his; the misprint report is
ours. The idealized BVP calculation changes the finite-shell bias estimate by up to ~160% at prior
configurations. Evidence: `7d821ee`, `solver-cpu/src/spherical-reference.ts`, separate in-repo
re-derivations 2026-07-27. Status: the cross-source inconsistency and numerical BVP consequence are
verified in-repo;
the earlier “unreported anywhere” priority claim is withdrawn pending a current systematic search.
Courtesy email drafted, maker-gated.

**B7 — The pre-registration apparatus itself (2026-07-27/28).** Frozen hashed protocol,
registered expectations including the model's own probable failure, ambiguity bands fixed by
formula before the grid, and — under ADR 0031 — the first recorded repository amendment that cost something:
a protocol violation caught, the free amend-the-registration alternative rejected by name,
and the corrected headline *predicted to be worse in advance*. That timestamped record makes a
later score-driven change detectable and documents that this choice preceded the score; it cannot
make misconduct impossible (scored 2026-07-29: predicted ≈2/90, measured 3/90 — the prediction's
direction held, its model did not, and both facts are recorded, `264a9e2`). No precedent in
this literature per the 2026-07 sweep. Status: on the record in ADRs 0025–0028, 0031–0032.
The 2026-07-29 retraction pass (`5463e76`) belongs in this entry too: the historical record reports
an 18-agent audit invalidating the phase's central interpretive proof and a separate reproduction
before recording, with retractions at document heads — the apparatus applied to interpretation, one
publication too late. The surviving record does not identify that reproducer's model, shared-context
status, exact reruns, or limits, so it does not establish independence under current Rule 10. The
earlier “no precedent in this literature” claim is not current priority evidence and is withdrawn.

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
neither the trade nor the f = 0.90 equality identifies the implemented dips' causal effect. A
matched M1-without-dips arm is required to isolate their effect on this solver's outputs under the
frozen configuration; even that intervention cannot establish physical SDAK causality or necessity
in nature.
Against this, one measured score-side difference reported in arm 1's favour disappeared: arm 1
produced **three columns inside `plates-cold`** where the reference demands plates, two in headline
scope; arm 2 has none. Evidence: `research/phase6-two-arm-report.md`,
`evidence/phase6-sweep-arm2/` (values hash
`13e678d5…`, freeze `483f7ee5`, execution `8c781b16`), independent verifier PASS on all 204 rows
importing nothing from `runner/src`, **16 negative controls executed — 15 CAUGHT, 1 GAP**.
Status: measured and independently verified. **Four limits were registered before the sweep; a
fifth provenance limit was discovered afterward:**
in-sample by construction (ADR 0005 — the dip centres were chosen against this diagram); the
historical 42/90 common-scope and 42/78 arm-scope log-log values are a withdrawn, confounded proxy
forecast, inadmissible as habit evidence and not a valid pre-run habit prediction. It extrapolated
44/204 rows outside its CAK fit range and cannot validate a CAK→M1 transfer; the alternative
linear-AR fit produced nonpositive aspect ratios,
so its former 66/78 score and the 42–66 range are withdrawn. The fit intercept at
`ln r_proxy = 0` is not an isotropic-kinetics forward run and does not measure an instrument or
lattice preference. All five `plates-warm` agreements sit at −2 °C, the regime's only counting
temperature, which ADR 0025 pre-registered as weightless. Post-run fifth limit: the artifact
was regenerated, not written by its own sweep (erratum E4).

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

**Fragility correction.** The historical one-directional rule flags 16 CAK and 33 M1 rows below a
threshold. Applying the same 0.135 distance strictly above a threshold adds 42 and 51 rows (58 and
84 total); the closed symmetric audit also includes one row exactly on a threshold in each arm,
adding 43 and 52 (59 and 85 total). The paired counts differ only by threshold-equality convention
and are not numerical-convergence evidence. P1's measured AR fall 1.52632 → 1.52174 also invalidates
the old one-directional rationale.

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
factors alone. M1 has three exact `sigma_0` equalities—equivalently, three
equal-shared-positive-field attachment-coefficient equality events because both M1 prefactors are
one—yet only 2 of its 6 sampled ladders contain a registered habit flip. The analytic events are
not habit transitions; in this corpus the two counts are different observables. Evidence:
`app/scripts/phase6-flip-census.mjs`, which runs the registered operator AND an independent
re-derivation from the registered definition and requires them to agree on all twelve ladders; they
do. Status: measured in-repo, both implementations agreeing. Carries B8's registered limits and
corrected erratum E5: sparse warm-side size/domain checks exist, but no complete composed numerical-
convergence campaign under either executed parameter set supports a regime-wide conclusion.

**B11 — Tracked cross-architecture input fingerprints differ; four matching CAK output rows are a
non-rederivable historical report (2026-07-31, quantified and provenance-corrected 2026-08-01).**
The Phase 6 cross-platform control, registered at WP0c and carried as MAC RUN NEEDED through the
entire phase, was reported executed on an
Apple M4 under the SAME Node v24.13.1 / V8 13.6.233.17-node.40 build as the x64 host, so it isolates
architecture and platform libm rather than engine version. Tier 1, the 448-entry libm fingerprint,
**DIFFERS**: x64 `2a9f64b3`, arm64 `3662b9e2`.
IEEE 754 does not specify `exp`/`log`/`pow`, and two conforming implementations are measured
different in **9 of 448 entries**, with ULP distances 1, 1, 2, 3, 4, 5, 7, 11 and 31 (maximum at
`alphaHK.prism|-14.0@0.25`) — so no bitwise reproducibility claim in this
project extends off a single architecture, and Phase 2b's refusal to make a cross-engine bitwise
claim is now measured rather than assumed. A Tier 2 prose table reports four exact matches — same
steps, attached count and aspect ratio, including the `fragile-column-floor` AR = 1.5000 tie. The
underlying arm64 logs and exit records were gitignored, never promoted, and are unavailable here.
The output match is therefore not independently rederivable and does not establish end-to-end
portability. Verified on x64: independently hashing the committed **arm64 Tier 1 entries** with a hand-transcribed
FNV-1a recomputes their recorded `3662b9e2` digest; this does not recompute arm64 libm on x64. All
four prose Tier 2 rows match the x64 values pulled independently from
`evidence/phase6-sweep/points.json`; that checks the table, not its absent arm64 source. Evidence: `docs/phase6-cross-platform-control.md`
§Result, `evidence/phase6-crossplatform/arm64-libm-fingerprint.txt`,
`evidence/phase6-crossplatform/x64-libm-fingerprint.txt`, and
`PHASE6_LIBM_DIGEST_ARM64_BASELINE`. Closes pin-register
R28 — the digest assertion returned early on non-x64, so it was a no-op on precisely the machine the
control needed; now pinned for both tracked self-identified fixtures with a third test asserting they disagree,
which runs everywhere and cannot be vacuous. Status: Tier 1 measured on both architectures and
independently re-verified; Tier 2 historical report only. R15 must publish normalized outputs and
exit records under `evidence/`.

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
extent 35 on attached count (1.071%, 120 attached cells despite the same reported extents and
six-decimal aspect ratio; the artifact contains no occupancy-level witness, so envelope identity is not claimed)
while class and AR are domain-invariant. Some individual same-extent domain-pair rungs pass, but the
multi-rung diagnostic/composed campaign returns `not-converged`; no replacement configuration is
demonstrated adequate across the full registered protocol, and no re-sweep was run (ADR 0037 §5).
Evidence: `docs/phase6-columns-refinement-prereg.md`,
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
priority claim is withdrawn. Its pre-registration named two hazards. The
historical claim that a ~50 nm example terrace scale was “avoided” by running M1 is withdrawn:
M1 is an everywhere-narrow starter approximation, while a full M2 test requires an unimplemented
width-dependent closure or a separately justified finer-resolution alternative. The other hazard materialized:
the bistable band at
−4/−5/−6 °C **failed in the only way its rule
allowed** — that rule accepts *either* pure class, so its single failure mode is producing
neither, and all 18 points did: 0 agree, 18 neutral. Registered in advance as "not an amnesty";
it was not one. **C2 — The re-sweep under ADR 0031**: LANDED 2026-07-29 — actual
3/90 against the registered ≈2/90, scored honestly including the note that the
throttle-to-rise model behind the prediction was wrong (`264a9e2`); the
prediction-then-measurement pair is on the record. **C3 — External-data candidates; none currently
pass-eligible** (stretch register §3): the audited free-fall and facet-rate sources remain
in-sample, geometry-mismatched, or reconstruction-only; size and pressure ladders are diagnostics,
not substitutes for held-out validation. A new source lock and protocol are required before this
entry can become gate evidence. **C4 — The Eq. 3.35 erratum email** once
the maker sends it. **C5 — The ADR 0024 validity-limit mystery** if the governing quantity is
ever identified.
