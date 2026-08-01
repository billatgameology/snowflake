# Phase 6 — conclusion

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
the SDAK effect"* — reproduced independently in 3-D for the first time. **Qualified:** at f = 0.90
the no-SDAK arm is also climbing toward the floor with size (1.46429 at extent 41, crossing near
extent 44), so the effect is specific to low supersaturation rather than general.

**2.4 The bistable band failed the only way its rule allowed.** ADR 0036 registered −4/−5/−6 °C as
accepting *either* pure class, so the single failure mode was producing neither. **All 18 points did:
0 agree, 18 neutral.**

**2.5 At high supersaturation SDAK is inert.** At f = 0.90 not one class differs between the arms
across all 34 temperatures — `alphaHK = A·exp(−σ₀/σ_surf)` saturates toward `A`, so a σ₀ dip stops
separating the facets. The reference diagram is most structured exactly where SDAK does nothing.

**2.6 Habit classes cross architectures; digits do not.** The cross-platform control, registered at
WP0c and outstanding for the whole phase, ran on Apple silicon under the same Node/V8 build. Tier 1
**differs** (`2a9f64b3` vs `3662b9e2`) — two conforming libm implementations disagree in the last ULP
on the physics inputs. Tier 2 **reproduced exactly at all four points**, including one whose AR is
exactly 1.5000 by an integer tie that could have broken either way. No bitwise reproducibility claim
in this project extends off a single architecture; class conclusions do.

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
