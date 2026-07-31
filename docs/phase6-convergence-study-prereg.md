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

## 5. What this cannot show

- Nothing about Δx. E5's gap stays open; this study varies size and domain only.
- Nothing about the other 34 points in the `columns` regime. Two conditions cannot establish that a
  regime is or is not columnar — they can establish whether the *verdict at the conditions that
  changed* is converged.
- Nothing registered. No hash gates this; it informs whether a gated re-sweep is worth running.
