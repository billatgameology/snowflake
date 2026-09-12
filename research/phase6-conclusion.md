# Phase 6 — conclusion

> ## PHASE 6 COMPLETED 2026-08-20
>
> The amended gate (decision 0045) was discharged by the flagless `gate6` at exit 0. The
> scientific finding is negative and published at measured-only grade: no arm reproduces
> Nakaya's column regime (0/24, 0/12, 0/12 per arm), the numerical-control ladder published
> **NO-PASS (criterion)**, and no evidence label was upgraded. The authoritative closure
> narrative is `evidence/phase6-three-arm-report/report.md`; the live index is
> `docs/PROGRESS.md`. The 2026-08-01 correction below is preserved as written; its
> "ACTIVE AND INCOMPLETE" status was true on its date and is superseded by this banner.

> ## ⚠ STATUS CORRECTED BY EXTERNAL REVIEW (2026-08-01)
>
> **The historical measured-only Nakaya comparison failed. THE PHASE 6 SCIENTIFIC GATE IS ACTIVE
> AND INCOMPLETE.**
>
> An independent review (Codex/GPT-5, no involvement in the authoring sessions) checked three
> decisive numeric claims and found no solver defect in that reviewed scope. The remaining listed
> historical measurements retain their artifact/in-repo verification but were not all independently
> rerun by that reviewer. **It also found that I had overstated the phase's status, and it is right.**
> Earlier versions of this document and of `docs/HANDOFF.md` said "Phase 6 concluded" without
> qualification. That reads as a cleanly completed gate. It is not one.
>
> **Why it is not a clean gate — accepted findings:**
>
> 1. **BLOCKER. The published headline is not the pre-registered headline.** The frozen protocol
>    requires the conservative intersection of measured and grid-extrapolated class; no artifact
>    carries the extrapolated fields and the operator has no production caller. **3/90 and 54/90 are
>    valid measured-only counts, not registered headline verdicts.** §3.5 already recorded the gap;
>    what was wrong was continuing to call the phase concluded anyway.
> 2. **Charter obligations were omitted without amending the charter** — held-out validation
>    (growth rates, size-dependent habit, pressure, histories) and the "hundreds of automated runs at
>    preview resolution" on the GPU harness (charter §3.2, Phase 6 item 3). The move to the float64 CPU
>    oracle at ~78 000 active cells was scientifically sound **and needed an ADR**. So does deferring
>    the held-out work.
> 3. **The SDAK claim is stronger than its evidence status** — see §2.3, now corrected.
> 4. **Provenance limits are understated** — see §3.10, now added.
> 5. **The extent-fragility rule rests on a directional assumption my own ladder refuted** — see
>    §3.8, now corrected.
> 6. **Cross-platform scope was overstated** — see §2.6, now corrected.
> 7. State documents contradicted one another (PROGRESS, the Phase 6 plan, ADR 0037's status, the
>    arm-1 report's "WP5 has not run", and an obsolete root `HANDOFF.md` I failed to check for before
>    adding `docs/HANDOFF.md`). The active state files are being reconciled under the science-first
>    completion plan; no historical closure statement governs the current gate.
> 8. A mathematically wrong explanation of the M1 logarithm base — corrected in
>    `core/src/libbrecht.ts` and `runner/test/phase6-sdak.test.ts`.
> 9. **The two arms do not isolate SDAK.** `CAK`→`M1` changes the broad `sigma_0` forms and
>    `A_prism` as well as adding the narrow-facet dips. The 66/20 trade and the −5 °C diagnostic are
>    M1-versus-CAK differences, not causal SDAK effects. A matched M1-without-dips arm is required
>    to isolate the implemented dip factors' effect on this solver under a frozen configuration; it
>    cannot establish physical SDAK causality or necessity in nature.
> 10. **R15's old three-spacing ladder does not hold physical geometry fixed.** The seed remains
>    radius 2/thickness 1 in cells while `dxUm` changes, and its 11/21/33 extent tuple measures about
>    7.70/7.35/7.70 µm. The exact tuple is not in the gated values manifest. A repaired, reviewed
>    numerical protocol must freeze seed representation and achieved physical size before R15 runs.
>
> **What the review does not change:** it did not overturn the artifact-backed measurements below.
> This is not a claim that it independently reproduced every one of them.

**What Phase 6 asked:** does a 3-D diffusion-limited solver, given Libbrecht's published attachment
kinetics, reproduce the Nakaya morphology diagram — and is the SDAK mechanism load-bearing for it?
The current corpus answers the first question only at measured-only strength and does not isolate the
second.

**What the completed historical work answers, in one paragraph.** At extent 21 neither executed
parameterization reproduces the diagram at measured-only strength: 3 of 90 for `CAK`, 54 of 90 for
`M1`, with the latter in-sample by construction. Those are not the registered
conservative-intersection headline. The two parameter sets also differ in more than the SDAK dips,
so their contrast cannot identify a causal SDAK effect. A non-gated diagnostic at one −5 °C point
changes class over a non-monotone size ladder and separates M1 from CAK at extent 29; it does not
select a production size or enter the gate. The registered numerics are not demonstrated converged,
and the old R15 spacing tuple changes physical seed and measurement geometry. **The defensible
output is therefore a measured parameterization comparison plus a catalogue of unresolved numerical
and experimental questions. The science-first completion plan is active.**

---

## 1. What was measured

Two 204-point sweeps over the same 34 × 6 (T, σ) grid, same solver, same seed, same far field, same
measurement size, same registered scoring rule — the parameter set the only intended difference,
and each of arm 2's rows carrying its own echoed `paramSet` so that claim is checkable.

| | arm 1 | arm 2 |
|---|---|---|
| parameter set | `CAK` (broad-facet) | `M1` (everywhere-narrow approximation; two Nakaya-informed dips) |
| common-denominator score | **3 / 90** | **54 / 90** (the withdrawn/confounded historical proxy forecast was 42/90; inadmissible as habit evidence, not a valid pre-run habit prediction) |
| classes (plate / neutral / column) | 6 / 168 / 30 | 75 / 119 / 10 |
| excluded | 0 | 0 |
| independent re-derivation | PASS | PASS |
| negative controls | 7 (5 CAUGHT, 2 GAP) | 16 (15 CAUGHT, 1 GAP) |

Details, per-regime tables and the four registered reasons to discount the headline are in
[phase6-two-arm-report.md](phase6-two-arm-report.md).

## 2. What the historical measurements establish

**2.1 M1 versus CAK is a trade, not an SDAK ablation.** The parameter-set change converts 66 neutral
points to plates and loses **20 of CAK's 30 columns**; the warmest column moves −19 °C → −30 °C. In
`columns-and-plates` — the one regime accepting *both* pure classes, and therefore the easiest on the
board — M1 is **worse than CAK, 26/78 → 14/78**. M1 changes the broad `sigma_0` forms and sets
`A_prism = 1` in addition to applying dips, so none of those differences can be assigned to SDAK
alone. A matched M1-without-dips run is the required within-solver control for the implemented dip
factors under a frozen configuration; it cannot establish physical SDAK causality or necessity in
nature.

**2.2 Neither sampled parameterization returns from column to plate under the registered flip
operator on the sampled constant-f ladders.** The operator scans warm to cold, considers pure-class
rows, and skips neutral rows. It finds two `plate→column` flips per arm: one flip on 2 of the 6
constant-f ladders and zero flips on the other 4. It finds **zero `column→plate` flips**. The Nakaya
diagram changes habit three times and the middle one — `column→plate` at −9.9 °C — is absent under
that operator in these twelve sampled ladders. This does not claim that neutral-mediated morphology
changes or unsampled temperatures were tested.

**2.3 A non-gated diagnostic separates M1 from CAK at −5 °C and low supersaturation.** At −5 °C,
f = 0.10, measured at extent 29 and sampled at the same extent in two box sizes. That local pair
agreed within 0.354%; the broader domain ladder did not demonstrate domain adequacy:

| | AR | class |
|---|---|---|
| arm 2 `M1` (dipped parameterization) | **1.52632** | **COLUMN** |
| arm 1 `CAK` (broad-facet parameterization) | **0.851852** | neutral |

0.675 apart at identical temperature, supersaturation and measurement size, on opposite sides of the
class boundary. This changes `CAK` to `M1`, not “SDAK off” to “SDAK on” with everything else held
fixed. It therefore cannot test Libbrecht's causal claim that producing the column requires the SDAK
effect. At f = 0.90 the CAK diagnostic is also climbing toward the floor with size (1.46429 at
extent 41). The defensible scope is only the sampled points: the parameter sets differ strongly at
f = 0.10, while the cited f = 0.90 CAK trajectory alone cannot establish how their difference varies
with supersaturation.

> **EVIDENCE STATUS CORRECTED after external review (2026-08-01), and this is the correction that
> stings most.** This section previously called the result the "first independent 3-D test" of SDAK's
> necessity and presented it as a Phase 6 finding. **Its own owning pre-registration says the
> opposite:** `docs/phase6-columns-refinement-prereg.md` states *"Nothing registered. No hash gates
> this, and it is not admissible as gate evidence — the same rule that bars calibration probes."*
> I wrote that sentence and then used the result as a headline claim anyway.
>
> **The measurement is real and the conditions are matched** — 1.52632 against 0.851852 — but the
> parameter-set change is confounded and the control was added after the crossing was observed.
> **What is withdrawn is its standing:** this is a *predeclared, controlled diagnostic*, not a
> Phase 6 validation result and not a literature-priority claim. Elevating it to one would require
> it to be registered, hash-gated and run on the grid with a matched no-dip parameterization.

**2.4 The bistable band failed the only way its rule allowed.** ADR 0036 registered −4/−5/−6 °C as
accepting *either* pure class, so the single failure mode was producing neither. **All 18 points did:
0 agree, 18 neutral.**

**2.5 At f = 0.90 CAK and M1 give the same class at all 34 sampled temperatures, but not the same
raw morphology metric.** Aspect ratio differs in 28 of those 34 pairs; the maximum sampled
`|ΔAR|` is 0.218335. This is a parameterization comparison, not evidence that SDAK is inert: M1 and
CAK also differ in `A_prism` and their broad `sigma_0` forms. A matched no-dip M1 control is required
before either class agreement or raw-metric differences can be attributed to the dip factors.

**2.6 Tracked input digits differ; four exact `CAK` output matches survive only as a historical
report.** The cross-platform control, registered at WP0c and outstanding for the whole phase, was
reported run on Apple silicon under the same
Node/V8 build. Tier 1 **differs** (`2a9f64b3` vs `3662b9e2`) — two conforming libm implementations
disagree in 9 of 448 fingerprint entries, at distances from 1 to 31 ULP. The Tier 2 table reports
exact reproduction at all four points, including one whose AR is exactly 1.5000 by an integer tie.
The underlying arm64 logs and exit records were never tracked and are unavailable in this
repository, so those output rows are not independently rederivable evidence.

> **SCOPE CORRECTED after external review (2026-08-01).** This section previously said "habit classes
> cross architectures", generalizing from four runs to both arms and the whole grid. **Only four
> arm-1 / `CAK` configurations were executed on arm64. Nothing here establishes architecture
> independence for arm 2 / `M1`, and nothing establishes it for the other 200 grid points.** The
> two-arm report stated this limit correctly; this document did not. The defensible claim is: *the
> tracked Tier 1 fingerprints differ bitwise, while a non-rederivable historical table reports four
> matching arm-1 output rows.*

## 3. What Phase 6 does NOT establish, and this is the load-bearing half

**3.1 The headline numbers describe the parameterizations at extent 21, and size dependence is not
resolved across the `columns` regime.** At one non-gated −5 °C diagnostic point, M1 changes from
`neutral` at extent 21 to `COLUMN` at extents 29, 35 and 41, with a non-monotone AR sequence. **The
204-point grid has not been re-run at other physical sizes**, so 3/90 and 54/90 remain measurements
at extent 21. Four selected diagnostic points cannot establish a regime-wide size response or pick
a replacement production size.

**3.2 The registered domain fails its own registered check, and so does the mandated fix.** The
`domain-budgets` spot-check — mandatory, hash-registered, never executed in the phase's history —
**fails 3 of 4**. Its registered consequence is a full-grid re-sweep at N = 64; **N = 64 fails the
same check 3 of 4** against N = 80. The old resource estimate projected a slow difference ratio of
0.746 and drove ADR 0037's no-re-sweep scheduling decision; it is not proof that convergence is
unreachable. *Habit class is identical at the four selected points in both comparisons*, so those
four classifications are unchanged; they cannot clear or preserve the other 200 rows. What fails is
the registered criterion. The maker's 2026-08-01 science-first direction
requires a new convergence campaign rather than accepting that resource decision.

**3.3 No replacement production configuration is demonstrated adequate across the full protocol.**
Individual rungs and rows pass particular checks, but the pre-registered convergence study returned
**outcome 3**: the domain check passes at extents 29 and 41 and **fails at 35** (1.071%). The failure
is in *attached-cell count* — a 120-attached-cell difference despite the same reported extents and
six-decimal aspect ratio; no occupancy witness establishes envelope identity — while the class and
reported aspect ratio are domain-invariant at every extent tested. Both facts are reported and
the criterion was not rewritten to the one that passes. **No re-sweep was run**, because a sweep at
an unconverged configuration buys a different unconverged number.

**3.4 There is no complete, passing grid/timestep/domain campaign covering the warm columns regime
under the registered production parameterizations.** Sparse warm checks do exist, including the M1
−6 °C domain spot-check and historical CAK_A1 warm rows, but they do not compose a valid numerical
campaign and some fail their criterion. WP3's CAK_A1 cold arm is bit-identical under `CAK`; its warm
arm is a different crystal (1513 cells / AR 0.3821 `plate` against 4883 / 1.0000 `neutral`). **The
entire Nakaya `columns` regime is warmer than −15 °C.** See erratum E5.

**3.5 The registered headline rule was never implemented, and its old spacing tuple is not a clean
fixed-physics grid study.** The `uncertainty-reporting` row registers
the headline as the conservative intersection of measured and grid-extrapolated class;
`phase6FitGridExtrapolation` has no caller outside tests and neither artifact carries the fields.
Discharging it needs three grid spacings per point — 612 runs per arm — which the registered budget
never contained. The prose tuple also keeps a radius-2/thickness-1 seed in *cells* while `dxUm`
changes, and its 11/21/33 target extents correspond to about 7.70/7.35/7.70 µm. Neither exact tuple
nor seed rule is in the gated values manifest. R15 therefore needs a reviewed protocol repair before
execution, not merely a production caller.

**3.6 The executed extent-21 corpus samples aspect ratio coarsely near the thresholds.** Its 408
measurements contain **36 distinct AR values**; the observed values nearest the column floor include
1.3125, 1.4000, 1.5000 and 1.6154. This is an empirical property of these rows and this measurement
size, not a theorem about the lattice, the instrument at every size, or unsampled crystals.

**3.7 The comparison target remains a redrawn 1954 schematic** whose supersaturation axis failed an
independent check, which is why only its three boundary temperatures are used.

**3.8 The published `extentFragile` counts are incomplete, and my own ladder is what shows it.**
The registered rule flags only points sitting *below* a class threshold, justified by
`phase6-protocol.ts`'s statement that measurement-extent drift is one-directional — AR rises with
size and is "never less". **The size ladder measured a fall:** P1 goes 1.52632 at extent 29 →
**1.52174** at extent 35 → 1.64000 at 41. The fall is small, but the registered justification is a
directional claim and the measured sign contradicts it.

Applied as a closed symmetric distance, the ±0.135 bound flags **43 additional CAK rows and 52
additional M1 rows**. The one-row difference from the earlier 42/51 count is deliberate boundary
inclusivity: CAK (−23 °C, f = 0.15) and M1 (−32 °C, f = 0.15) each sit at AR exactly 1.500, distance
zero from the column threshold, and were excluded by the old strict-below rule. Symmetric totals are
59/204 and 85/204 versus the published one-sided 16/204 and 33/204. The independently recomputed
counts and exact boundary rows are executable assertions in `runner/test/phase6-sweep.test.ts`.
**No score changes** — fragility is a caveat, not a class.

**3.9 The sweep inherits its process environment, and that is a live forgery path.** Each of the
408 child runs is spawned without an explicit `env`, so `NODE_OPTIONS` and the surrounding
environment pass through. The adversarial audit demonstrated that an out-of-repository loader can
modify the executing solver **while `git status` stays clean and every registered hash still
matches** (pin-register R20/R81/R82, recommendation 20). This was recorded in the audit and in the
pin register and was **absent from this document** until external review flagged it. It is not
hypothetical and it is not closed: nothing in the evidence chain would detect it.

**3.10 Review provenance and limits.** The 2026-08-01 adversarial claim audit was performed by
OpenAI `gpt-5.6-sol` at ultra reasoning. The reviewer inherited the current user request and repository
handoff context but did not author Phase 6. It independently re-executed both artifact verifiers,
the diagram reconciliation, the flip census, the ladder reader, direct JSON recomputations of class
counts, the closed symmetric fragility census, the f = 0.90 pair comparison, and the live
cross-architecture fingerprint; it also inspected the CAK and M1 kinetic mappings. It did **not**
re-run the 408 long solver jobs, execute a preview-budget GPU campaign or held-out experiment, prove
domain or grid convergence, audit `docs/education/**`, or run the complete `npm test` suite. Those
are limits of the reviewed evidence, not implied passes.

## 4. What the completed historical work is worth

The corpus provides a reproducible 408-row comparison of two named parameterizations, a flip census
over twelve sampled ladders, and direct measurements of several numerical failure modes. It does
**not** provide a first or causal 3-D SDAK test: CAK and M1 are not a matched dip ablation, the larger
size comparison is non-gated, and no exhaustive literature-priority review was preserved. The main
value is diagnostic: it shows exactly which comparisons the next registered campaign must isolate,
and it caught a headline operator, GPU obligation, held-out program, environment boundary, geometry
freeze, and convergence campaign that were missing or scientifically inadequate.

## 5. What follows

The maker selected the science-first branch of O1b on 2026-08-01. The active work is
[`docs/plans/phase-6-science-first-completion.md`](../docs/plans/phase-6-science-first-completion.md):
repair and freeze the numerical geometry; add a matched M1-without-dips arm that isolates the
implemented dip factors' effect within the frozen solver without claiming physical SDAK causality
or necessity in nature; implement the conservative-intersection artifact/gate; execute the float64 campaigns; port the registered physics
  to a preview-budget GPU evidence harness; and execute held-out growth-rate, size-dependent-habit,
  pressure, and history comparisons only after a source lock identifies a pass-eligible target. The
  current lock has none. Criteria are not weakened for cost.

---

**Each number cited here is accompanied by a published artifact, verifier, or named-run reference in
this document or its linked evidence; this is a prose index, not a machine-checked completeness map.**
Where a claim of mine was overturned during the phase — the structural bound, the
columns interpretation, the SDAK attribution of size divergence — the retraction is recorded at the
document that carried it rather than quietly edited away.
