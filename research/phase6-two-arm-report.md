# Phase 6 — the two-arm Nakaya validation

**Both arms of the registered comparison, reported together.** Arm 1 (`CAK`, no SDAK) is the
control; arm 2 (`M1`, SDAK) is the treatment. Neither is publishable alone: an arm-1-only report
tests a model its own author predicts will fail, and an arm-2-only report has no control.

Arm 1's own report is [phase6-sweep-report.md](phase6-sweep-report.md), including its retraction.
This document does not restate it; it reads the two arms against each other.

**The headline number is the least informative thing here, and it is not the lead.** SDAK raises the
common-denominator score from 3/90 to 54/90. What that number hides is that the mechanism is a
**trade**; that at the registered measurement size neither arm scores a single point in the regime
SDAK exists to explain; and that the single pre-registration arm 2 was capable of failing, it did
fail.

> **READ §4's CORRECTION FIRST (2026-07-31).** The pre-registered size ladder has since shown that
> arm 2 **does** produce a column in that regime at −5 °C when the crystal is measured at extent 29
> instead of the registered 21 — AR 1.40000 → **1.52632**. The scored tallies above are unaffected;
> the *interpretation* of the `columns` regime is under correction and is provisional pending two
> runs still executing. An earlier version of this paragraph said SDAK "does not move that regime at
> all", which was wrong even at the registered size — arm 2 turns three of its points to `plate`.

---

## 1. What was measured

| | arm 1 | arm 2 |
|---|---|---|
| parameter set | `CAK` | `M1` |
| SDAK | no | yes (two dips) |
| arm id | `arm1-cak` | `arm2-sdak-m1` |
| freeze commit | `e2f1bfca…` | `483f7ee56cbbcd5017658aa4879a3a9b87c56809` |
| execution commit | `390fe35a…` | `8c781b166db2c72d2fa86cef001e2e8c48ac96c3` |
| values hash (GATED) | `879e069f…` | `13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76` |
| points | 204 | 204 |
| excluded | 0 | 0 |
| artifact | `out/phase6-sweep/` | `out/phase6-sweep-arm2/` |

Both ran the same 34 × 6 grid, the same solver, the same seed, the same far field, the same
measurement size, and the same registered scoring rule (ADR 0025). **The parameter set is the only
intended difference**, and each of arm 2's 204 rows carries its own echoed `paramSet=M1` header, so
that claim is checkable from the artifact rather than asserted.

Arm 2's artifact was **regenerated, not written by its own sweep** — the completion-time provenance
check refused to publish because five commits landed on `main` during the 11.5-hour run. The
measurements were never in question and the source-graph digest did not move. The whole irregular
history is in erratum E4 and in the artifact's own `regeneration.json` sidecar.

### Verification

| check | arm 1 | arm 2 |
|---|---|---|
| independent re-derivation of every field | PASS (WP5) | **PASS** |
| negative controls executed | 7 (5 CAUGHT, 2 GAP) | **16 (15 CAUGHT, 1 GAP)** |
| per-row parameter set recorded | 0 of 204 (erratum E3) | **204 of 204** |
| run-end condition recorded | 0 of 204 (erratum E3) | **204 of 204** |
| figure re-renders from the data | **data byte-identical** | **data byte-identical** |
| whole SVG re-renders byte-identically | no — caption drift | **yes** |

**The figure is the data, checked rather than assumed.** `app/scripts/phase6-diagram-reconcile.mjs`
re-renders each `diagram.svg` from its own `points.json` and compares. Every plotted cell, axis and
legend is byte-identical in **both** arms — so neither published figure has drifted from the rows it
claims to show. This is a different claim from independent verification and needs the renderer, so
it deliberately lives outside the two independent verifiers, which import nothing from `runner/src`.

One real drift found, and it is caption-only: arm 1's figure predates the two-arm refactor, so both
its title constant (`no-SDAK` → `no-SDAK (CAK)`) and its subtitle format changed after it was
written. **Arm 1's recorded SVG byte hash can therefore no longer be re-earned from the current
tree**, though its plotted content can and does. Recorded rather than repaired: editing the
published figure to match today's renderer would be changing evidence to suit code.

The verifier re-derives all 204 rows importing nothing from `runner/src`. Its negative controls
found two real gaps in it — an artifact with the other arm's rows spliced in, and an artifact
stripped of all per-row config, both verified clean because a missing field could not fail a check
that only inspected present ones. Both are closed. One gap remains open by design and is stated in
§7.

---

## 2. The result

> ### Common denominator: arm 1 **3 of 90**, arm 2 **54 of 90**.

The common denominator is arm 1's headline scope scored by arm 1's rule, applied to both arms, so
the two numbers are comparable. Arm 2's own headline — which additionally withholds the three
pre-registered bistable temperatures — is **54 of 78**.

| regime | arm 1 agree | arm 2 agree | arm 2 pre-registered |
|---|---|---|---|
| `plates-warm` (T > −3.3) | 3 / 6 | **5 / 6** | 4 of 6 |
| `columns` (−3.3 … −9.9) | 0 / 24 | **0 / 12** | 0 of 12 |
| `plates-cold` (−9.9 … −21.5) | 0 / 60 | **49 / 60** | 38 of 60 |
| `columns-and-plates` (< −21.5), reported not headline | 26 / 78 | **14 / 78** | — |

These are the published `report.json` tallies, so the ±1.0 °C ambiguity band is already excluded
from every denominator — `columns-and-plates` counts 78 of its 84 points, not 84. The `columns` row
has different denominators in the two arms because arm 2 additionally withholds the pre-registered
bistable temperatures; that is the registered rule, not a convenience, and it is why the
common-denominator figure exists.

Class census over all 204 points:

| | plate | neutral | column | invalid |
|---|---|---|---|---|
| arm 1 | 6 | 168 | 30 | 0 |
| arm 2 | **75** | **119** | **10** | 0 |

Point-by-point, 115 of 204 points did not change class. The 89 that did:

| move | n |
|---|---|
| neutral → plate | 66 |
| column → neutral | 14 |
| column → plate | 6 |
| plate → neutral | 3 |

---

## 3. SDAK is a TRADE, not an improvement

**Twenty of arm 1's thirty columns stopped being columns.** SDAK converted 66 neutral points into
plates, and it paid for them by destroying two thirds of the columns the model already had.

| | arm 1 | arm 2 |
|---|---|---|
| columns, all 204 points | 30 | **10** |
| warmest column | −19 °C | **−30 °C** |
| column onset at f = 0.10 | −19 °C (17 points) | −30 °C (6 points) |
| column onset at f = 0.15 | −23 °C (13 points) | −32 °C (4 points) |
| `columns-and-plates` agreement | **26 / 78** | 14 / 78 |

The mechanism is visible in the measured diagram. The prism dip that manufactures plates near
−14 °C does not stop at the regime boundary: at f = 0.10 arm 2's plate region runs unbroken from
−9 °C to **−24 °C** — 2.5 °C past the −21.5 °C boundary and into the regime where the reference
wants columns available. The plates arm 2 gains in `plates-cold` and the columns it loses below
−21.5 °C are the same mechanism seen twice.

`columns-and-plates` accepts **both** pure classes, so it is the easiest regime on the board to
agree with — and it is the one regime where arm 2 is **worse than the control**, 26/78 → 14/78.

**A gain that should be reported against arm 1 too.** Arm 1 produced three columns *inside*
`plates-cold`, where the reference demands plates — two of them in headline scope. Those are active
wrong-habit points, not merely neutral ones. Arm 2 has none. That is a real improvement in kind and
not only in count.

### At the highest supersaturation, SDAK does nothing whatsoever

**At f = 0.90 the two arms are identical in class at all 34 temperatures** — every point neutral in
both, not one class changed. At f = 0.60 only 11 of 34 changed. The mechanism is not mysterious:
`alphaHK = A·exp(−σ₀/σ_surf)` saturates toward `A` as σ_surf grows, so a σ₀ dip stops being able to
separate the facets. Whatever SDAK is doing, it is doing it only at the bottom of the σ axis — and
the reference diagram is at its most structured exactly where SDAK is inert.

**And the dominant class is still "no habit".** Arm 2 reduced neutral from 168 to 119 of 204. The
model declines to produce a definite habit at **58% of the grid** even with SDAK on.

---

## 4. Neither arm produces a column in the `columns` regime — AT THE REGISTERED MEASUREMENT SIZE

> ### ⚠ CORRECTION IN PROGRESS (2026-07-31) — the unqualified form of this section's claim is WITHDRAWN
>
> **Arm 2 DOES produce a column in the Nakaya `columns` regime when the crystal is measured larger.**
>
> The pre-registered size ladder returned rung B, and at **T = −5 °C, f = 0.10 under `M1`** the
> aspect ratio went **1.40000 at extent 21 → 1.52632 at extent 29**, crossing the registered 1.5
> floor. That is a `column`, at a temperature where the reference demands one, from a clean run:
> `stop reason=size-target`, `symErr = 0`, `allConverged`, `deltaSymClean`, 298 steps, 6779 cells,
> and the geometry self-reports `hexRadius 31`, `seedSites 19`. Nothing excludes it.
>
> `1.52632 = 29/19` exactly.
>
> **What is withdrawn:** "neither arm produces a single column in the Nakaya `columns` regime" as a
> statement about the **model**. **What stands:** the same sentence as a statement about the model
> **at the registered measurement size**, which is what was measured and what the 3/90 and 54/90
> headlines score. No published tally moves.
>
> This is pre-registered outcome 1, and it is the outcome that costs me the section's headline
> finding. It was written into `docs/phase6-columns-refinement-prereg.md` first, listed *first*
> precisely because it was the convenient-to-avoid one, and the ladder was built to be able to
> return it.
>
> **Still open, and the correction is provisional until all three land:**
> 0. **THE LADDER'S OWN DOMAIN JUSTIFICATION WAS WRONG, and I found it after publishing the
>    correction above.** The ladder holds `targetExtent / N = 0.4375` and argued that kept the
>    far-field treatment comparable. The `domain-budgets` freeze row says the opposite in as many
>    words: *"WP3 §1.3 also disproved ADR 0024's ratio-based validity limit … it must be re-measured
>    if Δx, **the measurement extent**, or the far field changes."* The ladder changes the
>    measurement extent at every rung, so **rungs B and C carry no domain-adequacy evidence** and the
>    rise could be a domain effect. Being tested, not argued: **rung B80** re-runs P1 at the same
>    extent 28 in N = 80. Identical class and attached counts within the registered 0.5% → N = 64 was
>    adequate and the crossing is a size effect. Otherwise **this correction is withdrawn outright.**
> 2. **P5** — arm 1 (`CAK`) at the *same* −5 °C and σ∞ = 0.005. The ladder as designed had **no
>    controlled arm-1 run at these conditions** — P4 is arm 1's best regime point but sits at
>    f = 0.90 — so "SDAK is what produced the column" currently rests on extrapolation from arm 1's
>    0.789474 at the registered size, not on measurement. P5 was added *after* seeing P1-B, and it
>    can only weaken that reading: **if P5 also crosses, then size and not SDAK makes the column.**
>
> Rung B in full — every point rose, one crossed:
>
> | point | arm | T | f | extent 21 | extent 29 | Δ |
> |---|---|---|---|---|---|---|
> | **P1** | arm 2 `M1` | −5 | 0.10 | 1.40000 | **1.52632** | **+0.126 → COLUMN** |
> | P2 | arm 2 `M1` | −4 | 0.10 | 1.23529 | 1.31818 | +0.083 |
> | P3 | arm 2 `M1` | −5 | 0.90 | 1.26594 | 1.33122 | +0.065 |
> | P4 | arm 1 `CAK` | −5 | 0.90 | 1.31250 | 1.31818 | +0.006 |
>
> ### The bigger finding, and it is not about SDAK: AR does not converge with size at −5 °C
>
> Rung C for the controlled pair — same −5 °C, same σ∞ = 0.045, differing only in parameter set:
>
> | point | set | ext 21 | ext 29 | ext 35 | rate 21→29 | rate 29→35 |
> |---|---|---|---|---|---|---|
> | **P3** | `M1` | 1.26594 | 1.33122 | **1.48831** | 0.00816/cell | **0.02618/cell** |
> | **P4** | `CAK` | 1.31250 | 1.31818 | **1.40000** | 0.00071/cell | **0.01364/cell** |
>
> **Both arms rise, and both ACCELERATE** — the per-cell increment grows by 3.2× for `M1` and 19× for
> `CAK`. Over extents 21–35 the aspect ratio at −5 °C is not converging in either arm; the increments
> get *larger*, which is the opposite of convergence. **So "the habit class at −5 °C" is not a
> size-independent property of this model in the range measured, and the registered extent 21
> captures a transient.** That is a limitation on how both published headlines treat this regime, and
> it is parameter-set-independent.
>
> At extent 35 the two arms sit **0.088 apart — about one representable step** (0.0875 near 1.4). SDAK
> shifts the curve up by roughly a step; it does not create the divergence.
>
> **A claim of mine that this withdraws.** On seeing rung B alone I wrote that P4 was flat at
> 0.00071/cell, "11× slower — a genuine mechanism difference: SDAK driving a self-reinforcing
> columnar habit, which is what the hypothesis predicts." That was two rungs. The third shows arm 1
> doing the same thing, and the reading is withdrawn.
>
> **A confound this ladder does not separate, stated rather than left implicit.** Every rung changes
> the domain N *and* the measurement extent together, so "size effect" and "domain effect" are not
> distinguished by these runs. Rung B80 separates them at extent 28 only. Nothing here separates them
> at extent 35, and no claim is made that it does.
>
> **This also sharpens erratum E5 rather than resolving it.** E5 records that no convergence study
> exists warmer than −15 °C under either executed parameter set. This is that gap producing a
> class change, at the first temperature it was checked.

The section below is preserved as published, and every number in it remains correct **as a
measurement at extent 21**.

This is the finding the headline is hiding.

The Nakaya `columns` regime, −3.3 to −9.9 °C, is the regime the SDAK hypothesis exists to explain.
Adding the mechanism Libbrecht says is required there — "Producing columnar crystals at −5 C then
requires the SDAK effect" (`1912.03230v1` p10) — moved **zero** of those points to `column`.

| | arm 1 (36 pts) | arm 2 (36 pts) |
|---|---|---|
| column | **0** | **0** |
| plate | 1 | 3 |
| neutral | 35 | 33 |
| headline-scope points | 24, all neutral | 12, all neutral |

Both arms produce *no habit at all* across almost the whole regime. That is a different failure from
producing the wrong habit, and a more specific one: the model is not making a mistake about which
axis wins, it is failing to break the tie.

### The gap is one step of the instrument, and that had to be measured before it could be read

`AR = zExtent / tExtent`, where `zExtent` is an integer layer count. AR is therefore **discrete**,
and near the class thresholds it is coarse:

- **408 measurements across both arms produced 36 distinct AR values.**
- Near the column floor the realized ladder is `1.3125, 1.4000, 1.5000, 1.6154` — steps of 0.0875
  and 0.1000.
- **No measurement in either arm lands strictly between 1.4 and 1.5.**
- Arm 2's best columns-regime point (−5 °C, f = 0.10) sits at `zExtent 21 / tExtent 15`. Qualifying
  as a column requires `tExtent 14`. **One lattice cell.**
- The registered `extentFragile` rule (±0.135 AR, ADR 0025) already flags that point. The
  protocol's own fragility test was pointing here before this was connected to the columns claim.

So "1.4000 against a floor of 1.5" is one representable step, not a physical distance, and the
question of whether the columns failure belongs to the model or to the ruler could not be settled
from the sweep. It was pre-registered as a separate diagnostic in
`docs/phase6-columns-refinement-prereg.md`, with all four outcomes fixed in advance, and run.

### Rung A: the ladder's own validity check, and a determinism result

The design requires the first rung to reproduce a published row bit-for-bit, or the ladder is void.
Four points, re-run at commit `27eb343` in a detached worktree — a **third** commit, distinct from
both arms' execution commits — against values published from `390fe35a` (arm 1) and `8c781b16`
(arm 2):

| point | arm | T | f | published AR | re-run AR | steps (pub → re-run) | extent | stop |
|---|---|---|---|---|---|---|---|---|
| P1 | arm 2 `M1` | −5 | 0.10 | 1.40000 | **1.40000** | 190 → **190** | 21 | `size-target` |
| P2 | arm 2 `M1` | −4 | 0.10 | 1.23529 | **1.23529** | 196 → **196** | 21 | `size-target` |
| P3 | arm 2 `M1` | −5 | 0.90 | 1.26594 | **1.26594** | 119 → **119** | 21 | `size-target` |
| P4 | arm 1 `CAK` | −5 | 0.90 | 1.31250 | **1.31250** | 172 → **172** | 21 | `size-target` |

Raw rows at `out/phase6-columns-ladder/ladder.json` — every number above is transcribed from it, and
the file's hash is recorded here rather than the file tracked, per decision 0004's treatment of
evidence artifacts. **Rung A alone: 11,128 bytes, sha256
`248ae0af3196c35da258a2b69a3aec5e3d133191a769867172670253e6ade855`** (this hash covers the four rung-A
rows only and moves as later rungs append).

**All four identical, and the ladder is valid.** This is a stronger determinism statement than the
checks that preceded it: those were three points within one arm and four points within the other,
each re-run against its own execution. This spans **both parameter sets**, from a **third commit**,
in a **different worktree**, and reproduces the **step count** as well as the measured shape — so it
is not only "the same numbers came out" but "the same trajectory was taken to get there".

It also independently corroborates erratum E4's central claim. E4 argues that arm 2's provenance
failure was not a physics failure, on the ground that no file under the hashed source roots differed
across the commit range. P4 tests that from the other side: an **arm 1** row, published from a
commit five days and dozens of commits earlier, reproduces exactly at the arm-2 regeneration commit.

### Rungs B and C

Rung B (N = 64, target extent 28) and rung C (N = 80, target extent 35) are the rungs that actually
answer the question. **Their reading is fixed in the pre-registration and is not to be chosen now:**
AR rising to ≥ 1.5 means the columns verdict is a measurement-size artifact and the interpretation
is withdrawn; AR flat within one representable step means the habit is size-converged and the
columns failure is a property of the model; AR falling means the published measurement was
optimistic; non-monotone is reported as non-monotone.

> **STATUS (2026-07-30, 22:40): rung B was launched and STOPPED four minutes in for a machine
> shutdown. No rung-B measurement exists.** Resume with
> `node app/scripts/phase6-columns-ladder.mjs --repo "G:/Code Files/snowflake-phase6-arm2" --rung B
> --concurrency 4`; rung A is recorded and will be skipped. Until B and C land, §8's statement of the
> columns finding is scoped to the registered measurement size and says so, and nothing in this
> report depends on their outcome.
>
> **A bug the shutdown exposed, fixed rather than noted.** Killing the driver mid-run recorded two
> rows with `error` set and `aspectRatio: null`, and the resume logic keyed on `pointId-rungId`
> alone — so those two runs would have been **skipped forever** while the summary table printed a
> blank line for them. Resume now requires a row to carry an actual finite measurement; incomplete
> rows are discarded by name and re-run. The two carcasses were purged, leaving the file
> byte-identical to the hash recorded above.

---

## 4b. The flip census — a registered output, produced for the first time

ADR 0025 registers the count of habit flips as "**itself a first-class result**", and
`phase6DetectFlips` exists to produce it. It has never been called outside `runner/test`, and
neither arm's artifact carries a flip count (pin register R55). It costs no compute — flips are a
function of the published `points.json` — so it is produced here.

A flip is a change between **pure** classes scanning warm to cold along a constant-f ladder, and it
is **bracketed rather than pinpointed**: reported as the interval between the last temperature of
one class and the first of the other. Neutral points do not terminate a scan, they widen the
bracket, because a wide neutral span means the flip is poorly located and a midpoint would
manufacture precision.

| | arm 1 (`CAK`) | arm 2 (`M1`, SDAK) |
|---|---|---|
| f = 0.10 | `plate→column`, bracketed −4 … −19 °C (width **15**) | `plate→column`, bracketed −24 … −30 °C (width **6**) |
| f = 0.15 | `plate→column`, bracketed −3 … −23 °C (width **20**) | `plate→column`, bracketed −22 … −32 °C (width **10**) |
| f = 0.25 – 0.90 | none | none |
| **total** | **2** | **2** |
| `plate→column` | 2 | 2 |
| **`column→plate`** | **0** | **0** |

The reference changes habit **three** times scanning warm to cold: `plate→column` at −3.3,
**`column→plate` at −9.9**, and `plate→column` at −21.5.

**Neither arm produces a single `column→plate` flip anywhere in 408 measurements.** That is the
crispest available statement of the failure, and it is sharper than the class census: the model does
not merely miss the `columns` regime, it never returns from columnar to plate-like at all. Its habit
sequence is monotone in temperature.

**Two things SDAK did do, visible only here.** It **narrowed** both brackets — 15 → 6 and 20 → 10 —
so the transition it produces is better localized than the control's. And it moved both **colder**,
out of the regime where a transition is wanted. SDAK sharpened the wrong transition.

**And this is the surviving form of the retracted structural claim, now measured on the SDAK arm.**
`M1` has three αHK crossings, not one. It still produces **exactly one flip per ladder**, on the two
ladders that have any, and none on the other four. Crossing count and habit-transition count are
different observables — the retraction of 2026-07-29 said the counting argument could not be
asserted a priori; this is the measurement that says it directly, from the arm that has the
crossings.

Reproduce with `node app/scripts/phase6-flip-census.mjs`. It runs the registered operator **and** an
independent re-derivation from the registered definition, and requires them to agree on every
ladder, so a silent change to the operator cannot pass as a change in the result. They agree on all
twelve.

---

## 5. The bistable band failed in the only way it could

ADR 0036 pre-registered −4, −5 and −6 °C as a **bistable band**: at those temperatures the source
reports that "both platelike and needlelike crystals can grow under essentially identical
conditions", so habit is not single-valued in (T, σ) and no deterministic per-point score can be
right there even in principle. The registered rule therefore accepts **either** pure class.

That rule has exactly one failure mode: produce neither habit.

**All 18 points did. 0 agree, 18 neutral.**

This was registered in advance as "not an amnesty", and it was not one. It is also the cleanest
statement of §4's finding: given a rule that would have accepted any definite answer, the model
declined to give one.

---

## 6. Four registered reasons to discount the headline

Written before the sweep, not assembled afterwards.

1. **It is in-sample.** M1's dip centres were chosen by their author to reproduce the Nakaya
   diagram; the prism dip is centred at −14.4 °C and the `plates-cold` regime that supplies 49 of
   the 54 agreements is centred at −15.7 °C. ADR 0005 registered that a SDAK model reproducing this
   diagram is not independent evidence. **Arm 2 is a consistency check, not a test.**
2. **I beat my own prediction by 12, in the direction my method was known to be weak.** The forecast
   was 42/90 from a fitted transfer function (`ln AR = −0.2659 + 0.5119 ln r`, R² = 0.511) that
   under-predicted plates on arm 1's own data — and the points it had to extrapolate over sat
   precisely in `plates-cold`, which is where the 12 came from. An estimator beating its target by
   its own known bias is not corroboration.
3. **The instrument favours plates 4.8×.** At `ln r = 0` — isotropic kinetics, no habit preference —
   the fitted AR is 0.7665. In `ln AR`, the space the fit is linear in, that sits **0.1396 from the
   plate ceiling and 0.6714 from the column floor: a factor of 4.81**. (Measured in linear AR the
   same asymmetry reads 7.35×; the log figure is the conservative one and is quoted here for that
   reason.) On this lattice at this measurement size plates are structurally easier to score than
   columns, and 75 of arm 2's 85 non-neutral points are plates.
4. **Every one of arm 2's `plates-warm` agreements is at a single temperature that was
   pre-registered as carrying essentially no statistical weight.** `plates-warm` has exactly one
   counting temperature, −2 °C; −3 °C falls in the ±1.0 °C ambiguity band. So all 5 agreements — and
   all 6 of the regime's headline points — are one temperature. ADR 0025 recorded this before either
   sweep precisely so a warm-end score could not be presented as a result.

A fifth, not registered in advance and therefore weaker, but load-bearing: **the artifact is
irregular.** Arm 2's report was regenerated rather than written by its own sweep (erratum E4).

---

## 7. What is still open

- **`phase6Aggregate` tallies the per-row verdicts it is handed; it does not re-derive them from the
  measurements.** Negative control C9b flips one verdict, leaves the measurement untouched, and the
  published headline moves. The independent verifier catches it — that is Rule 9 working as
  designed, no component supplying both sides of a check — but it means these artifacts are
  trustworthy in company with the verifier, never on their own.
- **Arm 1 records neither a parameter set nor a run-end condition on any of its 204 rows** (erratum
  E3). What carries the claim instead is that all 204 sit at exactly extent 21, which the growth
  loop cannot exceed. Corroboration, not the load-bearing evidence. *Partly narrowed by rung A:* one
  arm-1 row was re-run at a later commit and reproduced exactly, **and its re-run does record
  `paramSet=CAK` and `stop reason=size-target`** — which corroborates the artifact from outside
  without amending it. Four rows out of 204 is corroboration, not closure.
- **THE WARM-SIDE CONVERGENCE EVIDENCE WAS MEASURED UNDER THE SUPERSEDED PARAMETER SET** (erratum
  E5, added 2026-07-31 after this report was first published). The whole WP3 convergence campaign
  ran `paramSet CAK_A1` — the set ADR 0031 invalidated. Its cold condition is bit-identical under
  `CAK`, so N = 48, extent 21, `cflFill` 0.1 and the **+0.135 extent-fragile bound keep their cold
  derivation, and no number in this report is shown wrong by it.** But its warm condition is a
  different crystal entirely: −5 °C, f = 0.15 is 1513 cells / AR 0.3821 **plate** under `CAK_A1` and
  4883 cells / AR 1.0000 **neutral** under `CAK`. **So under either published parameter set there is
  no grid-, timestep-, domain-, measurement-extent or seed convergence study at any temperature
  warmer than −15 °C — and the entire Nakaya `columns` regime is warmer than −15 °C.** §4's central
  negative result rests on numerics with no convergence study under the set that produced it. The
  size ladder in §4 is the first such evidence in that regime, which is a reason to weight it and
  not a reason to relax about the gap.
- **The registered headline rule is not the rule that produced either headline** (pin register R15).
  The `uncertainty-reporting` freeze row registers the headline as the **conservative intersection**
  of measured and grid-extrapolated class, with a `classSurvivesGridExtrapolation` flag and a
  not-extrapolatable tally per point. `phase6FitGridExtrapolation` has no caller outside
  `runner/test`; neither arm's rows carry any of those fields. Discharging it needs three grid
  spacings **per point** — 612 runs per arm — which the registered budget never contained, so this
  is a defect in the registration found late, not a shortcut in the implementation. Not being fixed
  by amending the registration to describe what the code does: ADR 0031 rejected exactly that move
  by name.
- **The registered domain spot-check had never been run** (erratum E6) — a mandatory, hashed
  criterion whose registered failure consequence is raising the whole grid to N = 64 and re-running
  it, undisclosed as outstanding until now. Being discharged by execution rather than de-registered.
- **Cross-platform control RUN 2026-07-31 (arm64), and it splits.** Tier-1 libm digest DIFFERS
  (x64 `2a9f64b3`, arm64 `3662b9e2`), so digit-level results stay scoped to the registered x64
  host. Tier-2 habit class reproduced exactly at all four registered fixture points. **These arm-2
  (SDAK) results were not themselves re-run on arm64** — the control's four points are arm-1
  configurations, so nothing here establishes that an arm-2 point is architecture-independent.
- **No `dxUm` convergence study under either published parameter set.** Halving the cell size costs
  roughly 60× per point. Not run, not affordable, not claimed — and per E5 the existing one does not
  substitute for it at any temperature the `columns` regime occupies.
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used.

## 8. What this establishes

**Stated at the strength the measurements support, per Rule 6.**

- Adding SDAK to this solver, at the registered grid and measurement size, raises agreement with the
  Nakaya boundary temperatures from 3/90 to 54/90 — and the gain is in-sample by construction.
- The gain is a **trade**: it costs two thirds of the model's columns (30 → 10) and **12 points of
  agreement** (26/78 → 14/78) in the one regime that accepts both habits.
- **Neither parameterization produces a single column in the Nakaya `columns` regime at the
  registered measurement size**, 36 points each. Across almost the whole regime both arms produce no
  definite habit at all. **The unqualified version of this claim is withdrawn — see §4.** Measured
  at extent 29, arm 2 produces a `column` at −5 °C, f = 0.10 (AR 1.52632). So this is a statement
  about the model *as measured at extent 21*, not about the model. **Carry E5 with it wherever it
  goes:** every point in that regime is warmer than −15 °C, and warmer than −15 °C there is no
  convergence study of any kind under either executed parameter set — and the first time that gap
  was probed, it produced a class change.
- The instrument's AR resolution near the class thresholds is 0.088–0.100, which is a property of
  the lattice and the measurement size rather than of either parameter set, and it is large enough
  that near-threshold verdicts must be read as one-step statements.
- **Neither arm produces a single `column→plate` habit flip in 408 measurements.** Both produce
  exactly two flips, both `plate→column`; the reference needs three, one of which is `column→plate`
  at −9.9 °C. The model's habit sequence is monotone in temperature — it never returns from columnar
  to plate-like. SDAK narrowed both flip brackets (15 → 6 and 20 → 10 °C) while moving them colder,
  so it sharpened a transition in the wrong place.
- **`M1` has three αHK crossings and still produces one flip per ladder.** Crossing count and
  habit-transition count are different observables, measured on the arm that has the crossings.
- The solver is **deterministic across parameter sets, commits and worktrees**, measured on four
  points spanning both arms: AR, step count, extent and stop reason all reproduce exactly when re-run
  at a commit distinct from either arm's execution commit.

**What it does not establish:** that no SDAK parameterization can produce columns there; that the
failure is or is not a resolution artifact beyond the range the diagnostic covers; or anything at
all about a model other than the two that were run.
