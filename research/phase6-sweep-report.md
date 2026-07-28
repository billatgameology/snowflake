# Phase 6 WP2 — the no-SDAK validation sweep

The registered 204-point sweep, run to completion against the frozen protocol. This is the
report the charter's Phase 6 asks for; the printed numbers here are gate evidence, unlike the
coordinator-only calibration probes in `phase6-convergence.md`.

## Provenance

| | |
|---|---|
| protocol | `9aa2e7c148aad117ba9ab7313bb36c55d4de3fccc3fbda4c2e43cc2af4974983` |
| execution commit | `3e3f75ceb1fa7a4afd473f16003c3e467d0a045e` |
| freeze commit | `e2f1bfcab4cf605f5c9c44ad096d8b1bcc0fe967` — **verified an ancestor of the execution commit** |
| engine | Node v24.13.1, V8 13.6.233.17-node.40, float64 CPU oracle |
| command | `node runner/src/main.ts phase6-sweep 6` |
| exit | 0, 204/204 points, ~17 h wall on 6 workers |

Artifacts live in the ignored evidence tree `out/phase6-sweep/`; their hashes are the tracked
record, as for research media under decision 0004.

| artifact | bytes | sha256 |
|---|---|---|
| `points.json` | 129,747 | `330afca8c5990f7cf9225b89f5704f695d5c8d4cce314caa90b1a483e50f807b` |
| `report.json` | 927 | `174f6dd1ab5aa8d79e2ca2a7dd064e72e58022df7308cf7fea82650ddb826a88` |
| `diagram.svg` | 31,599 | `4b37ec727689383d3834d510fed9ae59a47cefe01d92ac0d03b37f1b3a8f3a2b` |

The preflight refused to produce any of it until the freeze was complete, the manifest hashed to
the registered pin, the freeze commit was an ancestor of HEAD, and the tracked tree was clean.

## What this is a test OF

**A no-SDAK model failing to reproduce the Nakaya diagram is Libbrecht's own published
expectation, not a discovery of this project.** He states it directly (arXiv:2306.13087):

> "the SDAK phenomenon provides the only viable option currently available that can adequately
> explain the Nakaya diagram together with a plethora of other ice-growth data."

Phase 6 is the first *independent test* of that claim with a 3-D solver, never its discovery.
Every sentence below is scoped accordingly.

## The measured diagram

`P` plate (`AR ≤ 0.667`) · `.` neutral · `C` column (`AR ≥ 1.5`). Columns are temperature in °C
(sign dropped), rows are σ∞ as a fraction of water saturation.

```
     T:  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35
f=0.10:  P  P  P  P  P  P  P  .  .  .  .  .  .  .  .  .  .  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C
f=0.15:  P  P  P  P  P  P  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  C  C  C  C  C  C  C  C  C  C  C  C  C
f=0.25:  P  P  P  P  P  P  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
f=0.40:  P  P  P  P  P  P  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
f=0.60:  P  P  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
f=0.90:  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
```

Reference regime boundaries sit at −3.3, −9.9 and −21.5 °C.

## Scored result

Scoring is ADR 0025's, registered before the sweep: `neutral` counts as disagreement (the
reference names a habit in every regime; the neutral band is ours, not the reference's), `invalid`
is excluded by name, the ±1.0 °C ambiguity band is excluded from counting, and the mixed cold
regime is reported but kept out of the headline because it accepts both pure classes.

> ### **Headline: 5 of 90 headline-scope points agree.**

| regime | headline | n | agree | disagree | neutral |
|---|---|---|---|---|---|
| `plates-warm` (T > −3.3) | yes | 6 | **5** | 1 | 1 |
| `columns` (−3.3…−9.9) | yes | 24 | **0** | 24 | 8 |
| `plates-cold` (−9.9…−21.5) | yes | 60 | **0** | 60 | 58 |
| `columns-and-plates` (< −21.5) | no | 78 | 26 | 52 | 52 |

Class totals over all 204 points: **31 plate, 143 neutral, 30 column, 0 invalid.**
25 points are flagged extent-fragile.

**Every one of the five agreements is at −2 °C**, the single counting temperature in the warmest
regime — which ADR 0025 registered *pre-sweep* as carrying essentially no statistical weight,
precisely so this could not be presented as a result. The model agrees with the reference nowhere
else inside the headline scope.

## Four findings

**1. One transition, never three.** Wherever habit appears at all, the sequence is
plate → neutral → column, monotone in temperature, with no return. The reference has three
boundaries. This is the structural claim the pre-registration made — one monotone σ₀ crossing
cannot produce three transitions — and it is now measured rather than argued. WP4's band analysis
showed the same conclusion survives the entire ±25% digitization band, because scaling either
curve by a constant cannot reorder a monotone function.

**2. Zero invalid runs in 204.** Every point converged under the dual criterion, held `symErr = 0`
with noise off, kept every per-tick attachment delta D6h-invariant, and cleared the 65%
domain-contact guard. Nothing was excluded, so nothing had to be argued about.

**3. The σ₀ crossing marks where plate STOPS, not where column STARTS.** Plate ends at −8/−9 °C
across f = 0.10–0.40, essentially at the registered −10 °C crossing. Column does not begin until
−19 °C (f = 0.10) or −23 °C (f = 0.15). The ~10 °C neutral band between them is the model
declining to commit to either habit, and it is the single largest feature of the measured diagram.
**Crossing location and habit-transition location are different observables**, and only the second
is what a morphology diagram records.

**4. Rising supersaturation destroys habit outright.** Columns occur only at f = 0.10 and 0.15.
At f = 0.25 and above there is not one column anywhere in the range, and at f = 0.90 the model
produces **nothing but neutral across all 34 temperatures**. This was predicted before the sweep
from the α ratio — `alphaHK = A·exp(−σ₀/σ_surf)` saturates toward `A`, compressing the
basal/prism contrast from 0.34–3.76 at f = 0.15 to 0.84–1.25 at f = 0.90 — but the measured effect
is total rather than a bias. The reference diagram is at its most structured exactly there
(dendrites, sectored plates, needles).

## What this does NOT establish

- **It is not a test of SDAK.** Every run is no-SDAK; `SDAK` appears in no source file. Under ADR
  0005 a SDAK model reproducing this diagram would be an in-sample result anyway, because the dip
  locations were chosen against it. `research/2306.13087v1.md` §3 now measures that directly: the
  broad-facet curves cross once, and adding the published SDAK dips turns one crossing into five,
  landing at −3.70 and −9.93 °C against reference boundaries at −3.3 and −9.9 °C.
- **The warm end rests on a σ₀_prism this project has since found suspect.** Libbrecht's printed
  closed form (M2) puts our digitized prism anchors low by a factor of **1.6–3.2 at −2…−5 °C**,
  far outside their ±25% band — and −2 °C is where all five agreements sit. Re-running under the
  closed forms is the single highest-value next step and requires an ADR plus a parameter-table
  re-freeze.
- **Habit is measured at extent 21, and habit is size-dependent.** 25 points sit within the
  registered ±0.135 extent-drift bound of a class threshold and are flagged extent-fragile.
- **Seed shape is a large systematic, though not a class-changing one at the two conditions
  tested** (`phase6-convergence.md` §5): warm `AR` moves +57% between seed thicknesses while the
  class holds.
- **No cross-platform control has been run.** Scoped to the registered x64 host until the arm64
  fixture runs — see `docs/phase6-cross-platform-control.md`.
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used. A
  quantitative 206-observation alternative exists and is a live maker decision.
