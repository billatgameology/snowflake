# Phase 6 — the two-arm Nakaya validation

**Both arms of the registered comparison, reported together.** Arm 1 (`CAK`, no SDAK) is the
control; arm 2 (`M1`, SDAK) is the treatment. Neither is publishable alone: an arm-1-only report
tests a model its own author predicts will fail, and an arm-2-only report has no control.

Arm 1's own report is [phase6-sweep-report.md](phase6-sweep-report.md), including its retraction.
This document does not restate it; it reads the two arms against each other.

**The headline number is the least informative thing here, and it is not the lead.** SDAK raises the
common-denominator score from 3/90 to 54/90. What that number hides is that the mechanism is a
**trade**; that the regime SDAK exists to explain is the one regime it does not move at all; and
that the single pre-registration arm 2 was capable of failing, it did fail.

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

## 4. Neither arm produces a column in the `columns` regime

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

> **STATUS: rung B is executing; rung C is not yet launched.** Until they land, §8's statement of the
> columns finding is scoped to the registered measurement size and says so, and nothing in this
> report depends on their outcome.

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
- **No cross-platform control.** Scoped to the registered x64 host. **MAC RUN NEEDED.**
- **No `dxUm` convergence study.** Halving the cell size costs roughly 60× per point. Not run, not
  affordable, not claimed.
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used.

## 8. What this establishes

**Stated at the strength the measurements support, per Rule 6.**

- Adding SDAK to this solver, at the registered grid and measurement size, raises agreement with the
  Nakaya boundary temperatures from 3/90 to 54/90 — and the gain is in-sample by construction.
- The gain is a **trade**: it costs two thirds of the model's columns (30 → 10) and **12 points of
  agreement** (26/78 → 14/78) in the one regime that accepts both habits.
- **Neither parameterization produces a single column in the Nakaya `columns` regime**, 36 points
  each, at the registered measurement size. This is not a marginal miss on a continuum: across
  almost the whole regime both arms produce no definite habit at all.
- The instrument's AR resolution near the class thresholds is 0.088–0.100, which is a property of
  the lattice and the measurement size rather than of either parameter set, and it is large enough
  that near-threshold verdicts must be read as one-step statements.
- The solver is **deterministic across parameter sets, commits and worktrees**, measured on four
  points spanning both arms: AR, step count, extent and stop reason all reproduce exactly when re-run
  at a commit distinct from either arm's execution commit.

**What it does not establish:** that no SDAK parameterization can produce columns there; that the
failure is or is not a resolution artifact beyond the range the diagnostic covers; or anything at
all about a model other than the two that were run.
