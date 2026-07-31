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

---

## A. Reproductions of measured reality

**A1 — The sweep reproduces Libbrecht's −5 °C laboratory measurements while disagreeing with
the Nakaya diagram (2026-07-28).** His substrate experiments at −5 °C found aspect ratios
`0.1 < rho_aspect < 1`, "Columnar crystals (with rho_aspect > 1) were absent", many "blockier,
nearly isometric" (arXiv:1912.03230v1 pp. 10, 13, verified verbatim; `rho_aspect = H/R` is
the same quantity as our AR). The sweep's −5 °C points land at AR 0.3821–1.0000 — inside his
measured range, columns absent. The model agrees with the lab data its inputs came from and
disagrees with the diagram exactly where the source says SDAK is required — the signature of
a correct implementation of an insufficient theory, and his own published claim about
broad-facet models, now shown quantitatively. Evidence: sweep report (`6995868`), −5 °C probe
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
> (Tm−T) ≈ 8–11, and the model as run shows at most one reversal (see B2's note).

**A4 — Transcription-fidelity floor (2026-07-27).** Table 2.1 transcription verified
cell-perfect against the page image; the sigma axis verified against Murphy–Koop within 0.5%
from −5 to −35 °C; the percent-vs-fraction trap closed in docs and code alike. Not lab-data
reproduction — recorded here as the fidelity baseline the A-class entries stand on.
Status: verified by independent review agents 2026-07-27; spot-checks reproducible.

## B. Firsts — uncharted territory entered, with supporting evidence

**B1 — First independent 3D test of Libbrecht's claim that SDAK is load-bearing for the
Nakaya diagram — and the claim survives it (2026-07-28).** He published the claim in prose
("the only viable option currently available that can adequately explain the Nakaya
diagram") and never ran the test; the 2026-07 literature sweep found nobody else has either.
The 204-point no-SDAK sweep is that test: 5/90 headline agreement, columns 0/24, cold plates
0/60, with **zero invalid runs** — flawless numerics under an insufficient theory, the
separation Phases 2–5 were built to make possible. Evidence: `6995868`; pre-registered
expectation in ADR 0025 and `baf7749`. Status: measured; re-sweep pending under ADR 0031
(registered prediction: headline falls to ≈2/90; structure unchanged).

> **CORRECTED ARM LANDED, 2026-07-29 (`264a9e2`)** — the ADR 0031 re-sweep under the
> registered CAK set: 204/204, exit 0, zero invalid, headline **3/90** (classes 6/168/30);
> the 5/90 CAK_A1 arm is superseded history, artifacts preserved. The claim strength also
> narrowed per B2's retraction: this is "this parameterization, as run, does not reproduce
> the diagram," not "no broad-facet model could." These numbers are verified-provenance,
> not yet gated evidence — WP5's independent verifier has not run.
>
> **THE OTHER ARM HAS NOW RUN, 2026-07-30 — see B8.** The claim in this entry's title still
> stands, but its shape changed: SDAK did not rescue the regime it exists to explain. **Neither
> arm produces a single column in the Nakaya `columns` regime**, 36 points each, and across
> almost all of it both produce *no definite habit at all* (35/36 and 33/36 neutral). What SDAK
> did instead was trade columns for cold plates. So "SDAK is load-bearing" survives as a claim
> about what a no-SDAK model cannot do; it is **not** corroborated as a claim that adding SDAK
> produces the diagram — this implementation of it does not.

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
> sets. **What survives, at measured strength:** along this sweep's own constant-f ladders
> the alphaHK reversal count is 1 at f = 0.10 and 0 at every larger f, so *this
> parameterization, as run, does not reproduce the diagram* — an existence result, not a
> necessity theorem. Whether any broad-facet model can is OPEN again, which makes the SDAK
> arm's outcome genuinely uncertain rather than foregone.

**B3 — The measured shape of broad-facet failure: two new facts (2026-07-28).** (i) The
crossing marks where plate *stops*, not where column *starts* — a ~10 °C neutral band
separates them, the largest feature of the measured diagram; crossing location and
habit-transition location are different observables. (ii) Rising supersaturation destroys
habit outright — zero columns anywhere at f ≥ 0.25, all-neutral at f = 0.90, precisely where
the reference is most structured. Neither fact appears in the literature. Evidence:
`6995868` findings 3–4. Status: measured (re-sweep pending, cold band bit-identical under
either parameter set per ADR 0031).

**B4 — The temperature-independent-knob bound (2026-07-28).** Seed geometry moves AR
substantially (+0.41 warm, +0.51 cold; a needle seed produced a genuine column — at −15 °C,
where the diagram wants a plate) but always in the same direction at both temperatures, while
the two bands demand opposite moves. A temperature-independent knob slides every point
together and can never create a flip — measured support for rejecting seed/domain/grid tuning
as routes to agreement, on grounds of sense rather than magnitude. Evidence: `64e5b4b`.
Status: measured, five seeds.

**B5 — First implementation and quantitative verification of the monopole-matched far field
in 3D, plus the first measured Dirichlet-shell domain bias in this literature (2026-07-26).**
The boundary condition is the source's own unimplemented proposal; the verification (291 vs
279 attached under fixed-sigma → 231 at both domains under monopole) and the 4.1% bias number
are the novel part. Evidence: ADR 0024, `c16208e`; novelty per the stretch register.
Status: verified in-repo.

**B6 — A one-symbol erratum in the printed monograph Eq. 3.35, unreported anywhere
(2026-07-26).** The corrected form is Libbrecht's own — printed correctly in JCMP 2013
Eq. (29), the very source the book cites — so the physics is his; the misprint report is
ours. Consequence is first-order: finite-shell bias up to ~160% at prior configurations.
Evidence: `7d821ee`, `solver-cpu/src/spherical-reference.ts`, independent re-derivations
2026-07-27. Status: verified in-repo; courtesy email drafted, maker-gated.

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
document heads — the apparatus applied to interpretation, one publication too late.

**B8 — SDAK is a TRADE, measured in 3D for the first time (2026-07-30).** Both arms of the
registered comparison ran: `CAK` (no SDAK) and `M1` (SDAK), same solver, same grid, same seed,
same measurement size, same scoring rule, parameter set the only intended difference — and each
of arm 2's 204 rows carries its own echoed `paramSet=M1`, so that is checkable rather than
asserted. Common denominator **3/90 → 54/90**. The number is the least informative part.
**SDAK buys 66 neutral→plate conversions and pays with 20 of arm 1's 30 columns** (14 → neutral,
6 → plate); warmest column −19 °C → −30 °C; and in `columns-and-plates` — the one regime that
accepts *both* pure classes, therefore the easiest on the board — arm 2 is **worse than the
control, 26/78 → 14/78** (the published tallies, whose denominators already exclude the ±1.0 °C
ambiguity band). The mechanism is one thing seen twice: at f = 0.10 arm 2's plate band
runs unbroken from −9 °C to −24 °C, 2.5 °C past the boundary, so the dip that manufactures cold
plates is the same dip that suppresses the colder columns. Two further measured facts: **at
f = 0.90 SDAK changes the class of not one point in 34** (`alphaHK = A·exp(−σ₀/σ_surf)` saturates
toward `A`, so σ₀ dips stop separating facets — and the reference diagram is most structured
exactly where SDAK is inert); and the dominant class is still *no habit*, 119 of 204 neutral.
Against this, one genuine gain reported in arm 1's favour being removed: arm 1 produced **three
columns inside `plates-cold`** where the reference demands plates, two in headline scope; arm 2
has none. Evidence: `research/phase6-two-arm-report.md`, `out/phase6-sweep-arm2/` (values hash
`13e678d5…`, freeze `483f7ee5`, execution `8c781b16`), independent verifier PASS on all 204 rows
importing nothing from `runner/src`, **16 negative controls executed — 15 CAUGHT, 1 GAP**.
Status: measured and independently verified. **Stated limits, all registered before the sweep:**
in-sample by construction (ADR 0005 — the dip centres were chosen against this diagram); the
42/90 prediction was beaten by 12 entirely in the regime its transfer function had to extrapolate
over and in the direction it was known to under-predict; the instrument favours plates **4.81× in
`ln AR`**; all five `plates-warm` agreements sit at −2 °C, the regime's only counting temperature,
which ADR 0025 pre-registered as weightless. Unregistered fifth limit: the artifact was
regenerated, not written by its own sweep (erratum E4).

**B9 — The measurement's own resolution, measured rather than assumed (2026-07-30).**
`AR = zExtent/tExtent` with `zExtent` an integer layer count, so AR is discrete — and how coarse
it is at the class thresholds had never been quantified. **408 measurements across both arms
produced 36 distinct AR values.** Near the column floor the realized ladder is 1.3125, 1.4000,
1.5000, 1.6154 — steps of 0.0875 and 0.1000 — and **no measurement in either arm lands strictly
between 1.4 and 1.5**. Arm 2's best columns-regime point sits at `tExtent 15` where qualifying
needs 14: **one lattice cell.** This is why "closest approach 1.4000 against a floor of 1.5" could
not be read as a physical distance, and it applies to every near-threshold verdict in both arms,
not only that one. The registered `extentFragile` rule (±0.135 AR, ADR 0025) was already flagging
the point — the protocol's own fragility test pointed here before anyone connected it to the
columns claim, which is the apparatus catching something ahead of its author. Evidence: computed
from the two published `points.json` files; diagnostic pre-registered with all four outcomes fixed
in advance at `docs/phase6-columns-refinement-prereg.md`. Status: measured in-repo.

**B10 — Neither parameterization ever returns from column to plate (2026-07-31).** ADR 0025
registers the habit-flip count as "itself a first-class result"; `phase6DetectFlips` had never
been called outside tests and neither arm's artifact carried one (pin register R55). Produced at
last, from the published rows at zero compute. Scanning warm to cold along each constant-f ladder,
**both arms produce exactly two flips and both are `plate→column`. Neither produces a single
`column→plate` flip anywhere in 408 measurements.** The Nakaya diagram changes habit three times,
and the middle one — `column→plate` at −9.9 °C — is precisely the one absent. This is sharper than
the class census: the model does not merely miss the `columns` regime, its habit sequence is
**monotone in temperature** and never comes back. Two effects visible only in this view: SDAK
**narrowed** both brackets (15 → 6 °C at f = 0.10, 20 → 10 °C at f = 0.15), so its transition is
better localized than the control's, while moving both **colder** — it sharpened the wrong
transition. And `M1`, which has **three** αHK crossings, still produces **one** flip per ladder,
which is the surviving form of the retracted B2 counting argument now measured on the arm that has
the crossings: crossing count and habit-transition count are different observables. Evidence:
`app/scripts/phase6-flip-census.mjs`, which runs the registered operator AND an independent
re-derivation from the registered definition and requires them to agree on all twelve ladders; they
do. Status: measured in-repo, both implementations agreeing. Carries B8's four registered limits
and erratum E5 (no convergence study exists warmer than −15 °C under either executed parameter set).

## C. Queued — share-worthy when it lands

**C1 — The SDAK arm** (ADR 0030): **LANDED 2026-07-30 — see B8.** First 3D run of the
hypothesis. Its two pre-registered hazards both materialized as registered: the ~50 nm terrace
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
