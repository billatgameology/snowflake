# Phase 6 — conclusion

> ## ⚠ STATUS CORRECTED BY EXTERNAL REVIEW (2026-08-01)
>
> **Phase 6 concluded; measured-only Nakaya reproduction failed. THE REGISTERED SCIENTIFIC GATE
> REMAINS INCOMPLETE.**
>
> An independent review (Codex/GPT-5, no involvement in the authoring sessions) reproduced the
> measured results — arm 1 3/90, arm 2 54/90, classes 6/168/30 and 75/119/10, zero stored-class
> mismatches, two `plate→column` flips per arm and zero `column→plate` — and found no solver defect
> overturning them. **It also found that I had overstated the phase's status, and it is right.**
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
>    preview resolution" on the GPU harness (charter §2.7, line 311). The move to the float64 CPU
>    oracle at ~78 000 active cells was scientifically sound **and needed an ADR**. So does deferring
>    the held-out work.
> 3. **The SDAK claim is stronger than its evidence status** — see §2.3, now corrected.
> 4. **Provenance limits are understated** — see §3.8, now added.
> 5. **The extent-fragility rule rests on a directional assumption my own ladder refuted** — see
>    §3.6, now corrected.
> 6. **Cross-platform scope was overstated** — see §2.6, now corrected.
> 7. State documents contradicted one another (PROGRESS, the Phase 6 plan, ADR 0037's status, the
>    arm-1 report's "WP5 has not run", and an obsolete root `HANDOFF.md` I failed to check for before
>    adding `docs/HANDOFF.md`). Reconciled.
> 8. A mathematically wrong explanation of the M1 logarithm base — corrected in
>    `core/src/libbrecht.ts` and `runner/test/phase6-sdak.test.ts`.
>
> **What the review does not change:** every measured number below. It reproduced them independently.

**What Phase 6 asked:** does a 3-D diffusion-limited solver, given Libbrecht's published attachment
kinetics, reproduce the Nakaya morphology diagram — and is the SDAK mechanism load-bearing for it?

**What Phase 6 answers, in one paragraph.** At the registered measurement size neither
parameterization reproduces the diagram: 3 of 90 without SDAK, 54 of 90 with it, and the 54 is
in-sample by construction. But the registered measurement size is **too small to decide the question
it was asked to decide** — at −5 °C the habit class changes between extent 21 and extent 29, and the
larger measurement is the better-founded one. Where we looked at the larger size, **SDAK produced
the column it was invoked for and the no-SDAK control did not.** The registered numerics are not
converged on the domain axis, and the protocol's own remediation instruction does not remediate.
**Phase 6's most defensible output is therefore a model-discrimination result plus a measured
catalogue of what its own instrument cannot yet resolve.**

---

## 1. What was measured

Two 204-point sweeps over the same 34 × 6 (T, σ) grid, same solver, same seed, same far field, same
measurement size, same registered scoring rule — the parameter set the only intended difference,
and each of arm 2's rows carrying its own echoed `paramSet` so that claim is checkable.

| | arm 1 | arm 2 |
|---|---|---|
| parameter set | `CAK` (no SDAK) | `M1` (SDAK, two dips) |
| common-denominator score | **3 / 90** | **54 / 90** (registered prediction 42) |
| classes (plate / neutral / column) | 6 / 168 / 30 | 75 / 119 / 10 |
| excluded | 0 | 0 |
| independent re-derivation | PASS | PASS |
| negative controls | 7 (5 CAUGHT, 2 GAP) | 16 (15 CAUGHT, 1 GAP) |

Details, per-regime tables and the four registered reasons to discount the headline are in
[phase6-two-arm-report.md](phase6-two-arm-report.md).

## 2. What Phase 6 establishes

**2.1 SDAK is a trade, not an improvement.** It converts 66 neutral points to plates and pays with
**20 of arm 1's 30 columns**; the warmest column moves −19 °C → −30 °C. In `columns-and-plates` — the
one regime accepting *both* pure classes, and therefore the easiest on the board — arm 2 is **worse
than the control, 26/78 → 14/78**. One mechanism seen twice: the prism dip that manufactures cold
plates is the dip that suppresses the colder columns.

**2.2 Neither arm ever returns from column to plate.** Scanning warm to cold, both arms produce
exactly two habit flips and both are `plate→column`. **Zero `column→plate` flips in 408
measurements.** The Nakaya diagram changes habit three times and the middle one — `column→plate` at
−9.9 °C — is precisely the one absent. The model's habit sequence is monotone in temperature.

**2.3 SDAK is load-bearing at −5 °C and low supersaturation — measured, and controlled.** At
−5 °C, f = 0.10, measured at extent 29 (domain-checked at two box sizes):

| | AR | class |
|---|---|---|
| arm 2 `M1` (SDAK) | **1.52632** | **COLUMN** |
| arm 1 `CAK` (no SDAK) | **0.851852** | neutral |

0.675 apart at identical temperature, supersaturation and measurement size, on opposite sides of the
class boundary. This is Libbrecht's own claim — *"Producing columnar crystals at −5 C then requires
the SDAK effect"*. **Qualified:** at f = 0.90 the no-SDAK arm is also climbing toward the floor with
size (1.46429 at extent 41, crossing near extent 44), so the effect is specific to low
supersaturation rather than general.

> **EVIDENCE STATUS CORRECTED after external review (2026-08-01), and this is the correction that
> stings most.** This section previously called the result the "first independent 3-D test" of SDAK's
> necessity and presented it as a Phase 6 finding. **Its own owning pre-registration says the
> opposite:** `docs/phase6-columns-refinement-prereg.md` states *"Nothing registered. No hash gates
> this, and it is not admissible as gate evidence — the same rule that bars calibration probes."*
> I wrote that sentence and then used the result as a headline claim anyway.
>
> **The measurement is real and the comparison is controlled** — 1.52632 against 0.851852 at matched
> conditions, with the control added specifically because it could only weaken the conclusion.
> **What is withdrawn is its standing:** this is a *predeclared, controlled diagnostic*, not a
> Phase 6 validation result and not a literature-priority claim. Elevating it to one would require
> it to be registered, hash-gated and run on the grid rather than on two conditions.

**2.4 The bistable band failed the only way its rule allowed.** ADR 0036 registered −4/−5/−6 °C as
accepting *either* pure class, so the single failure mode was producing neither. **All 18 points did:
0 agree, 18 neutral.**

**2.5 At high supersaturation SDAK is inert.** At f = 0.90 not one class differs between the arms
across all 34 temperatures — `alphaHK = A·exp(−σ₀/σ_surf)` saturates toward `A`, so a σ₀ dip stops
separating the facets. The reference diagram is most structured exactly where SDAK does nothing.

**2.6 Four `CAK` configurations reproduce across architectures; digits do not.** The cross-platform
control, registered at WP0c and outstanding for the whole phase, ran on Apple silicon under the same
Node/V8 build. Tier 1 **differs** (`2a9f64b3` vs `3662b9e2`) — two conforming libm implementations
disagree in the last ULP on the physics inputs. Tier 2 **reproduced exactly at all four points**,
including one whose AR is exactly 1.5000 by an integer tie that could have broken either way.

> **SCOPE CORRECTED after external review (2026-08-01).** This section previously said "habit classes
> cross architectures", generalizing from four runs to both arms and the whole grid. **Only four
> arm-1 / `CAK` configurations were executed on arm64. Nothing here establishes architecture
> independence for arm 2 / `M1`, and nothing establishes it for the other 200 grid points.** The
> two-arm report stated this limit correctly; this document did not. The defensible claim is: *the
> four tested arm-1 configurations reproduced their habit class exactly on a second architecture,
> while the physics inputs differed bitwise.*

## 3. What Phase 6 does NOT establish, and this is the load-bearing half

**3.1 The headline numbers describe the model at extent 21, and extent 21 cannot resolve the
`columns` regime.** At −5 °C the habit class changes between extent 21 (`neutral`) and extent 29
(`COLUMN`), and stays `COLUMN` at 35 and 41 at two box sizes. **The 204-point grid has not been
re-run at a larger measurement size**, so 3/90 and 54/90 are measurements of the model *as measured
at extent 21* — not of the model. Four points at extent ≥ 29 cannot fill that gap and are not
claimed to.

**3.2 The registered domain fails its own registered check, and so does the mandated fix.** The
`domain-budgets` spot-check — mandatory, hash-registered, never executed in the phase's history —
**fails 3 of 4**. Its registered consequence is a full-grid re-sweep at N = 64; **N = 64 fails the
same check 3 of 4** against N = 80. Escalating the domain alone is unaffordable (ratio 0.746 per
doubling). *Habit class is identical at all four points in both comparisons*, so no published tally
is shown wrong — what fails is the criterion. See ADR 0037 and erratum E6.

**3.3 No configuration is demonstrated converged.** The pre-registered convergence study returned
**outcome 3**: the domain check passes at extents 29 and 41 and **fails at 35** (1.071%). The failure
is in *total accreted mass* — 120 cells of interior fill inside a bit-identical envelope — while the
class and even the exact AR are domain-invariant at every extent tested. Both facts are reported and
the criterion was not rewritten to the one that passes. **No re-sweep was run**, because a sweep at
an unconverged configuration buys a different unconverged number.

**3.4 There is no convergence study at all warmer than −15 °C under either executed parameter set.**
WP3's campaign ran `CAK_A1`, which ADR 0031 invalidated; its cold arm is bit-identical under `CAK`
and survives, its warm arm is a different crystal (1513 cells / AR 0.3821 `plate` against 4883 /
1.0000 `neutral`). **The entire Nakaya `columns` regime is warmer than −15 °C.** See erratum E5.

**3.5 The registered headline rule was never implemented.** The `uncertainty-reporting` row registers
the headline as the conservative intersection of measured and grid-extrapolated class;
`phase6FitGridExtrapolation` has no caller outside tests and neither artifact carries the fields.
Discharging it needs three grid spacings per point — 612 runs per arm — which the registered budget
never contained. A defect in the registration, found late (pin-register R15).

**3.6 The instrument's own resolution is coarse near the thresholds.** 408 measurements produce **36
distinct AR values**; near the column floor the realized ladder is 1.3125, 1.4000, 1.5000, 1.6154.
Near-threshold verdicts are one-step statements.

**3.7 The comparison target remains a redrawn 1954 schematic** whose supersaturation axis failed an
independent check, which is why only its three boundary temperatures are used.

**3.8 The published `extentFragile` counts are incomplete, and my own ladder is what shows it.**
The registered rule flags only points sitting *below* a class threshold, justified by
`phase6-protocol.ts`'s statement that measurement-extent drift is one-directional — AR rises with
size and is "never less". **The size ladder measured a fall:** P1 goes 1.52632 at extent 29 →
**1.52174** at extent 35 → 1.64000 at 41. Small, and inside the instrument's own resolution, but the
registered justification is a directional claim and the data contradicts it.

Applied symmetrically, the ±0.135 bound would flag **42 additional arm-1 rows and 51 additional
arm-2 rows** that sit within the bound *above* a threshold. **No score changes** — fragility is a
caveat, not a class — but the published counts of 16 and 33 describe one side of a bound that the
measurements no longer support treating as one-sided. Found by external review, 2026-08-01.

**3.9 The sweep inherits its process environment, and that is a live forgery path.** Each of the
408 child runs is spawned without an explicit `env`, so `NODE_OPTIONS` and the surrounding
environment pass through. The adversarial audit demonstrated that an out-of-repository loader can
modify the executing solver **while `git status` stays clean and every registered hash still
matches** (pin-register R20/R81/R82, recommendation 20). This was recorded in the audit and in the
pin register and was **absent from this document** until external review flagged it. It is not
hypothetical and it is not closed: nothing in the evidence chain would detect it.

## 4. What the phase is worth

The negative result is not the interesting part — Libbrecht predicted a no-SDAK model would fail, and
it did. Three things here are not in the literature:

1. **The first independent 3-D test** of the claim that SDAK is required for columns at −5 °C, with a
   matched no-SDAK control at identical conditions. It holds, at low supersaturation.
2. **The flip census** — that this model never produces a `column→plate` transition at all, which is
   a sharper failure statement than any agreement score.
3. **A measured account of what the instrument cannot resolve**, produced by turning the
   pre-registration apparatus on the protocol itself and finding a registered obligation that was
   both unexecuted and unsatisfiable as written.

## 5. What follows Phase 6

Not scheduled here, and deliberately not started under the phase's own budget:

- **A converged re-measurement** of the `columns` regime at extent ≥ 29 across the full grid. This is
  the single result that would convert §3.1 from a limitation into an answer.
- **A Δx study warmer than −15 °C** under an executed parameter set (E5).
- **A protocol-design question**: the registered domain criterion couples habit class, which is
  robust here, to attached count, which is not. Whether a mass tolerance belongs in the same gate as
  a morphology criterion is a real question — and changing it *now*, because it failed, is the move
  ADR 0031 rejected by name.

---

**Every number in this document is traceable to a published artifact, an independent verifier, or a
named run.** Where a claim of mine was overturned during the phase — the structural bound, the
columns interpretation, the SDAK attribution of size divergence — the retraction is recorded at the
document that carried it rather than quietly edited away.
