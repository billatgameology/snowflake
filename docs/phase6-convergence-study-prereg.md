# Phase 6 — the columns-regime convergence study, pre-registered

**Status:** pre-registration. Written and committed BEFORE any run of this study executed.

**Maker direction 2026-07-31:** best science practice governs cost/speed/accuracy tradeoffs, but
"that doesn't mean we can't do things smartly." This study is the smart half: it decides **whether
an affordable converged configuration exists at all** before any re-sweep is committed to one.

## 1. Why this exists

Three findings force it, and they rank differently by whether they move a habit class:

| axis | status | moves a class? |
|---|---|---|
| **measurement extent** | not converged; increments GROW with size | **yes** — P1 at −5 °C f = 0.10 went `neutral` (AR 1.40000, extent 21) → **`column`** (1.52632, extent 29) |
| **domain N** | registered spot-check FAILS 3 of 4, 1.7–2.5% against 0.5% (erratum E6) | **no** — class identical at all four |
| **Δx** | no study warmer than −15 °C under either executed parameter set (erratum E5) | unknown |

E6's registered consequence is a full re-sweep at N = 64. Honoring that alone would spend ~780
core-hours on **the axis where the answer did not move**, and leave untouched the axis where it did.
So: converge first, sweep once — rather than sweep, discover, sweep again.

## 2. A design error from the previous ladder, not repeated

`docs/phase6-columns-refinement-prereg.md` held `targetExtent / N = 0.4375` and called it comparable
across sizes. The `domain-budgets` row disproves ratio-based extrapolation outright, so that bought
no validity — **and it cost compute**: the registered domain-contact bound is **0.65**, so extent 35
is legal at N = 64 (0.547), not only at N = 80. Rung C was run at N = 80 prices for no registered
reason.

Here the domain is chosen as **the smallest N at which the extent is legal under the 0.65 guard**,
and **domain adequacy is tested at each extent rather than inherited from another one.**

## 3. Design

Conditions — the class-changing point, and the controlled pair that isolates the parameter set:

| id | arm | T | f | σ∞ | why |
|---|---|---|---|---|---|
| P1 | arm 2 `M1` | −5 | 0.10 | 0.005000 | the point whose class changed |
| P4 | arm 1 `CAK` | −5 | 0.90 | 0.045000 | does the control ever cross, or only `M1`? |

Runs added by this study (everything else is already measured):

| rung | N | extent | extent/N | what it answers |
|---|---|---|---|---|
| **C64** | 64 | 35 | 0.547 | domain adequacy at extent 35, against the existing (80, 35) |
| **D** | 64 | 41 | 0.641 | the next extent rung, at the smallest legal domain |
| **D80** | 80 | 41 | 0.513 | domain adequacy at extent 41 |

P1 gets C64, D and D80. P4 gets D. Four runs, ~31 core-hours estimated from measured per-run costs.

Everything else is held at the registered values: `dxUm` 0.35, `cfl` 0.1,
`aggregate-hv-g1h1-v6`, `monopole-matched`, `seedRadius` 2, `rngSeed` 1, `noiseEpsilon` 0.

## 4. The reading, fixed in advance

**Domain adequacy** uses the registered criterion and the registered evaluator
(`PHASE6_DOMAIN_SPOT_CHECK`): identical habit class AND attached counts within **0.5%**.

**Class convergence** is the question that matters, and it is deliberately about the CLASS and not
the ratio — the class is the only quantity the Nakaya comparison consumes, and the AR ladder's
realized resolution near the thresholds is 0.088–0.100, so an AR that keeps drifting inside a class
is not evidence of anything the comparison reads.

1. **CONVERGED-COLUMN** — P1 classifies `column` at extents 29, 35 and 41, and the domain checks
   pass at 35 and 41. Then the model **does** produce a column at −5 °C, the registered extent 21
   was simply too small to see it, and Phase 6's central negative claim about the `columns` regime
   is a measurement-size artifact rather than a property of the model. A re-sweep is then worth
   running at the smallest converged configuration.
2. **CONVERGED-NEUTRAL** — P1 returns below 1.5 and stays there. The extent-29 crossing was the
   transient, and the published claim stands as published.
3. **NOT CONVERGED** — the class is still changing at extent 41, or a domain check fails at 35 or
   41. Then **no affordable configuration is converged**, and the correct Phase 6 output for this
   regime is the measured non-convergence itself, reported as the result. No re-sweep is run,
   because a sweep at an unconverged configuration buys a different unconverged number.
4. **ARM SPLIT** — P4 (`CAK`) also reaches `column` by extent 41. Then **size, not SDAK, makes the
   column**, which is worse for arm 2 than anything currently reported and is reported that way.

Outcome 1 is the one that most rewards the effort already spent, and outcome 3 is the one that ends
Phase 6's columns question without a satisfying number. Both are written here before either is
known.

---

## RESULT (2026-08-01) — **OUTCOME 3: NOT CONVERGED**, by the rule as written

All runs clean: `symErr = 0`, `allConverged`, `deltaSymClean`, `stop reason=size-target` throughout.

### P1 — arm 2 `M1`, −5 °C, f = 0.10

| N | extent | AR | class | attached |
|---|---|---|---|---|
| 48 | 21 | 1.40000 | `neutral` | 2 777 |
| 64 | 29 | **1.52632** | **COLUMN** | 6 779 |
| 80 | 29 | **1.52632** | **COLUMN** | 6 755 |
| 64 | 35 | **1.52174** | **COLUMN** | 11 201 |
| 80 | 35 | **1.52174** | **COLUMN** | 11 081 |
| 64 | 41 | **1.64000** | **COLUMN** | 16 217 |
| 80 | 41 | **1.64000** | **COLUMN** | 16 145 |

### The registered domain checks

| extent | N=64 vs N=80 | class | verdict |
|---|---|---|---|
| 29 | 0.354% | COLUMN = COLUMN | **PASS** |
| 35 | **1.071%** | COLUMN = COLUMN | **FAIL** |
| 41 | 0.444% | COLUMN = COLUMN | **PASS** |

**Outcome 1 required the domain checks to pass at 35 AND 41. The check at extent 35 fails.** By §4
as written — *"NOT CONVERGED — the class is still changing at extent 41, **or a domain check fails
at 35 or 41**"* — this is **outcome 3**, and its registered consequence applies: **no re-sweep is
run**, because a sweep at an unconverged configuration buys a different unconverged number.

That is the verdict. What follows qualifies it; it does not overturn it.

### What IS converged, stated because it is what the comparison consumes

**The habit determination does not depend on the domain anywhere it was tested at extent ≥ 29.** At
all three extents the aspect ratio is **identical to six figures at both domains** — 1.52632,
1.52174, 1.64000 — and the class is `COLUMN` in all six runs. What fails at extent 35 is the
**attached count**: 11 201 against 11 081, a difference of 120 cells inside an envelope whose
bounding shape is bit-identical. The two crystals have the same extent and the same aspect ratio and
differ in interior fill.

So the registered criterion fails on total accreted mass, while the quantity the Nakaya comparison
reads — the class — is invariant across every domain tested. Both facts are reported; neither is
allowed to suppress the other, and **the criterion is not rewritten to the one that passes.**

The failure is also non-monotone in size (0.354% → 1.071% → 0.444%, absolute differences 24 → 120 →
72 cells), which is not the signature of a smooth boundary-proximity effect. In a deterministic
solver that points at discrete attachment decisions — whether a particular layer completes — rather
than at a systematic domain bias.

### P4 — arm 1 `CAK`, −5 °C, f = 0.90: ARM SPLIT REFUTED, but only just

1.31250 (21) → 1.31818 (29) → 1.40000 (35) → **1.46429 (41)**, `neutral` at every rung. It did
**not** reach `column` by extent 41, so the pre-registered ARM SPLIT outcome is refuted.

**But it is 0.036 below the floor and rising ~0.011 per cell, so it would cross around extent 44.**
Reported plainly: at **high** supersaturation the no-SDAK arm is also heading to `column` with size,
and the arm difference there is a matter of when, not whether.

### P5 — arm 1 `CAK`, −5 °C, f = 0.10: the control, record restored

**AR 0.851852**, 12 447 attached, at extent 29 — reproducing the value lost to the driver race,
now with the validity fields that make it admissible. Against arm 2's **1.52632** at the same
temperature, the same σ∞ and the same measurement size: **0.675 apart, and on opposite sides of the
class boundary.**

**This is where SDAK is doing the work.** At f = 0.10 the two arms are not close; at f = 0.90 they
are one representable step apart and both climbing. The column SDAK produces at −5 °C is a
**low-supersaturation** phenomenon.

---

## 5. What this cannot show

- Nothing about Δx. E5's gap stays open; this study varies size and domain only.
- Nothing about the other 34 points in the `columns` regime. Two conditions cannot establish that a
  regime is or is not columnar — they can establish whether the *verdict at the conditions that
  changed* is converged.
- Nothing registered. No hash gates this; it informs whether a gated re-sweep is worth running.
