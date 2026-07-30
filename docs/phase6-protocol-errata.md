# Phase 6 frozen-protocol errata

Errors found **inside the hashed protocol manifest** after the sweep ran, recorded here rather than
edited in place.

## Why they are not corrected in the source

`phase6ProtocolManifest()` includes `freezeList: items`, so every freeze row's `requirement`,
`value` and `source` **string** is hashed. Editing any of them moves `PHASE6_PROTOCOL_SHA256`, and
charter §3.2 Phase 6 item 1 says:

> "Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior sweep
> results — the full sweep re-runs."

Every erratum below is in a **justification**, not in a registered value. No number the solver reads
changes, and no executed result changes. Spending a 20-hour re-sweep to correct a rationale would
destroy evidence to fix prose. The same reasoning is already applied in
`research/phase6-source-currency.md`, which records a Rule 12 check outside the frozen artifacts for
exactly this reason.

**These errata are carried here until the protocol hash next moves for a substantive reason**, at
which point the strings are corrected in the same ADR. Anyone quoting a freeze row must read this
file alongside it.

### The re-sweep would produce identical numbers — measured, not assumed

The argument above rests on a claim worth checking: that correcting a justification changes the hash
but not any executed result. Verified by re-running the sweep's fastest point (−14 °C, f = 0.90,
σ∞ = 0.131400) at the same configuration and comparing against its `points.json` row:

| | steps | attached | AR | extent | symErr |
|---|---|---|---|---|---|
| recorded in the sweep | 131 | 1793 | 0.818755 | 21 | 0 |
| independent re-run | **131** | **1793** | **0.818755** | **21** | **0** |

Identical. The solver is deterministic at these settings (`noiseEpsilon = 0`, `rngSeed = 1`), so a
re-sweep under a corrected justification string would reproduce all 204 rows exactly.

**Cost of doing it anyway**, from the sweep's own per-point timings: **89.4 core-hours** — 14.9 h at
concurrency 6, ~7.5 h ideal at 12 on this 16-thread host, so roughly 10 h wall-clock in practice.
That buys a hash matching a corrected sentence and nothing else.

### The underlying clause defect, and the proposed fix

Charter §3.2 Phase 6 item 1 cannot distinguish a changed **parameter** from a typo in a
**rationale** — both move `PHASE6_PROTOCOL_SHA256` and both therefore invalidate the sweep. That is
why E1 sits here rather than being fixed, and it will recur.

**Proposed:** split `phase6ProtocolManifest()` into a **values manifest** (everything the solver
reads) and a **justification manifest** (`requirement` and `source` prose), pinned as two hashes.
The charter's re-sweep clause then binds only the values hash, so a prose correction provably cannot
invalidate evidence — the distinction becomes mechanical instead of a judgement call. This needs its
own ADR and a charter amendment; it is **not** done here and is a maker decision.

Found by the adversarial audit of 2026-07-29
(`docs/phase6-soundness-audit-2026-07-29.raw.txt`).

---

## E1 — the `t-sigma-grid` row's contrast-collapse justification is wrong, and inverted

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
