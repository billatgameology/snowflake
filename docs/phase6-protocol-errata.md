# Phase 6 frozen-protocol errata

Errors found **inside the hashed protocol manifest** after the sweep ran, recorded here rather than
edited in place.

## Status: the mechanism that made these unfixable is gone

These were originally carried here because `phase6ProtocolManifest()` hashed prose and registered
values together, so correcting a wrong sentence moved `PHASE6_PROTOCOL_SHA256` and — under the
unamended charter §3.2 Phase 6 item 1 — invalidated the sweep. **ADR 0033 split the manifest** into a
values hash and a justification hash, and the amended clause binds only the values hash. **ADR 0034
then used it to fix E1 at zero cost.**

So this file is no longer a parking place. It is for findings inside the frozen manifest that cannot
*yet* be fixed, and it currently holds none: E1 is closed, E2 was always an unhashed comment and was
corrected in place.

### Determinism, measured on three points

The original argument for not re-sweeping rested on the solver being deterministic, so that a
corrected justification could not change any executed result. Maker-directed after the 2026-07-29
audit — no universal claim rides on a single sample — that was measured on **three** points spanning
different classes, run lengths and hole-fill counts rather than one case repeated:

| point | class | steps | recorded AR | re-run AR |
|---|---|---|---|---|
| −14 °C, f = 0.90 — fastest, 11 min | neutral | 131 | 0.818755 | **0.818755** |
| −2 °C, f = 0.25 — plate branch, 19 min | plate | 158 | 0.600420 | **0.600420** |
| −12 °C, f = 0.10 — slow cold, 46 min, 146 hole fills | neutral | 310 | 0.950000 | **0.950000** |

`steps`, `attached`, `extent` and `symErr` matched exactly on all three as well. The solver is
deterministic at the registered settings (`noiseEpsilon = 0`, `rngSeed = 1`).

**Cost of a re-sweep, had one been owed**, from the sweep's own per-point timings: **89.4
core-hours** — 14.9 h at concurrency 6, ~7.5 h ideal at 12 on this 16-thread host, so roughly 10 h
wall-clock. Maker decision: NO. It would have reproduced identical numbers.

Found by the adversarial audit of 2026-07-29
(`docs/phase6-soundness-audit-2026-07-29.raw.txt`).

---

## E1 — CLOSED by ADR 0034 (2026-07-29)

**Fixed, not carried.** Once ADR 0033's two-hash split landed, correcting this string cost nothing:
`PHASE6_VALUES_SHA256` is unchanged at `879e069f…`, only the justification hash moved
(`8b73b5f8…` → `040b1a44…`), and no sweep was invalidated. See ADR 0034 for the old → new text.
The record below is retained as the finding's history.

## E1 (historical) — the `t-sigma-grid` row's contrast-collapse justification is wrong, and inverted

**Where:** `runner/src/phase6-protocol.ts`, freeze row `t-sigma-grid`, `source` string.

**What it says:**

> "…and toward f = 0.90 the basal/prism contrast compresses from 0.34–3.76 to 0.84–1.25."

**What is true.** Those are `CAK_A1` figures, and `CAK_A1` is not the registered parameter set —
ADR 0031 registered `CAK`. Computed over the registered T axis (−2…−35 °C) with
`alphaHK(basal)/alphaHK(prism)` at σ∞ = f · `phase6SigmaWaterFromTable(T)`:

| parameter set | f = 0.15 | f = 0.90 |
|---|---|---|
| `CAK_A1` | 0.34 (−2 °C) – 3.75 (−35 °C) | 0.84 (−2 °C) – 1.25 (−35 °C) |
| **`CAK`** (registered) | **1.20 (−10 °C) – 3.75 (−35 °C)** | **1.06 (−15 °C) – 5.05 (−5 °C)** |

**The justification does not merely lose precision — it reverses.** Under `CAK` the contrast at
f = 0.90 spans 1.06–5.05, which is *wider* than f = 0.15's 1.20–3.75. There is no contrast collapse
at the top of the σ axis for the registered set. Note also that under `CAK` the ratio never falls
below 1 at either fraction, so the basal facet is never the slower one at these σ∞ values — which is
the same fact that refuted the σ₀-crossing argument.

**What this does and does not affect.** The registered grid — 34 temperatures × 6 fractions, f ∈
{0.10, 0.15, 0.25, 0.40, 0.60, 0.90} — is a set of *values*, registered pre-sweep and unchanged. The
sweep executed exactly that grid. What is wrong is the stated *reason* the axis is bounded where it
is. The upper bound remains defensible on the other ground the same row gives ("the top row is kept
deliberately: weak facet contrast is not weak habit variation"), which does not depend on the
compression figure. The lower bound's dead-facet argument (2.3e-4 at f = 0.05, −35 °C) was not
checked by the audit and is not covered by this erratum.

**Consequence for reporting:** do not cite the 0.34–3.76 / 0.84–1.25 figures as a property of the
registered model. `research/phase6-sweep-report.md` Finding 5 quoted them and is annotated.

---

## E2 — an unhashed protocol comment states something false about the reference figure

**Where:** `runner/src/phase6-protocol.ts`, the comment above the supersaturation-axis section (and
the similar wording above the Table 2.1 ladder). **These are comments, not manifest strings, so
they are corrected in place** — E2 is recorded only so the audit finding has a home.

**What it said:** "the diagram's upper region is bounded by water saturation".

**What is true.** That is a statement about *cloud physics*, not about the digitized figure. The
reference figure's plotted region is not bounded by the water-saturation line; the line is drawn
*on* it, with structure above it. The premise as stated does not by itself justify capping the σ
ladder at 1× water saturation.

The cap is still defensible, on a ground the comment did not give: sustained supersaturation above
σ_water nucleates water droplets, which changes the boundary condition around the crystal —
`2109.00098v1` p9 states this directly ("rapid nucleation of water droplets whenever the
near-surface supersaturation exceeds σ_water … making it quite difficult to examine ice growth
behaviors on substrates with σ > σ_water"). That is why Libbrecht's own high-σ observations use
free-standing needles rather than substrates, and it is a real reason a cloud-conditions grid stops
there. The comment now says that instead.

---

## What is NOT covered here

- Errata in **unhashed** locations are fixed in place and not listed, except E2.
- The audit's remaining findings against research documents and ADRs are corrected directly in
  those files; this file is only for the frozen manifest.
- No claim is made that the audit found every error in the hashed strings. It checked the σ-axis
  justification because a related claim failed; the other 24 rows' justifications were not
  systematically re-derived.
