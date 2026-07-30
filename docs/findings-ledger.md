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

## C. Queued — share-worthy when it lands

**C1 — The SDAK arm** (ADR 0030): first 3D run of the hypothesis, decisive either way; now
known to require a stated sub-grid closure (terrace scale ~50 nm vs Δx = 350 nm) and a
bistability-aware score at −5 °C — and, after B2's retraction, an outcome that is genuinely
open rather than foregone. **C2 — The re-sweep under ADR 0031**: LANDED 2026-07-29 — actual
3/90 against the registered ≈2/90, scored honestly including the note that the
throttle-to-rise model behind the prediction was wrong (`264a9e2`); the
prediction-then-measurement pair is on the record. **C3 —
Held-out tests** (stretch register §3): free-fall growth data, facet-rate curves via the 1D
reference, size-dependent habit, pressure ladder. **C4 — The Eq. 3.35 erratum email** once
the maker sends it. **C5 — The ADR 0024 validity-limit mystery** if the governing quantity is
ever identified.
