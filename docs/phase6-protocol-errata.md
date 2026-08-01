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

### Scoped replay on three points; universal determinism claim withdrawn

The original argument for not re-sweeping rested on the solver being deterministic, so that a
corrected justification could not change any executed result. Maker-directed after the 2026-07-29
audit — no universal claim rides on a single sample — that was measured on **three** points spanning
different classes, run lengths and hole-fill counts rather than one case repeated:

| point | class | steps | recorded AR | re-run AR |
|---|---|---|---|---|
| −14 °C, f = 0.90 — fastest, 11 min | neutral | 131 | 0.818755 | **0.818755** |
| −2 °C, f = 0.25 — plate branch, 19 min | plate | 158 | 0.600420 | **0.600420** |
| −12 °C, f = 0.10 — slow cold, 46 min, 146 hole fills | neutral | 310 | 0.950000 | **0.950000** |

`steps`, `attached`, `extent` and `symErr` matched exactly on all three as well. This establishes
exact replay for those three executions on the tested host/engine and inherited environment. It
does not prove universal determinism across every state, source snapshot, process environment, or
architecture.

**Cost of a re-sweep, had one been owed**, from the sweep's own per-point timings: **89.4
core-hours** — 14.9 h at concurrency 6, ~7.5 h ideal at 12 on this 16-thread host, so roughly 10 h
wall-clock. Historical maker decision: NO. The former sentence saying a re-sweep *would* reproduce
identical numbers is retracted; three exact replays do not entail that result for all 204 rows. The
2026-08-01 science-first direction supersedes that resource scheduling decision.

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

## E3 — arm 1's rows cannot show how their runs ENDED (open, and it closes itself at arm 2)

ADR 0035 requires a scored run to have stopped on `stop reason=size-target`, because a step-capped run
reports the shape of the 19-site seed — `AR = 0.200000`, temperature-independent — and the harness
scored that `plate / AGREE / headline`. Applied to the whole grid the fabrication reads **66 of 90**
against arm 1's measured **3 of 90**.

**Arm 1's `points.json` predates per-row `config`, so 0 of 204 rows record a stop reason.** The check
cannot be applied to the published artifact retroactively.

**What carries the claim instead.** All 204 rows are at **exactly** extent 21, the registered
measurement size, and that is sufficient rather than merely reassuring: the growth loop cannot continue
past the size target, so reaching 21 implies the size-target condition fired. The stop reason is
corroboration, not the load-bearing evidence. `app/scripts/phase6-wp5-independent.mjs` now **prints**
both the extent census and the `0/204` config count, with the limitation stated in its output — a
verifier that silently skips a check it cannot run is how the step-cap fabrication survived
certification in the first place.

**Why this is not being fixed by re-running.** Re-deriving it would cost the full 89 core-hours to add
corroboration to a conclusion the extent census already supports. Arm 2 records `config` on every row
from the start, so the gap does not recur and does not need to be paid for twice.

---

## E4 — arm 2's artifact was REGENERATED, not written by its own sweep (closed, and measured)

**What happened.** The arm-2 sweep executed all 204 points and wrote no artifact. The
completion-time provenance re-check (REC 10) refused it:

```
HEAD moved during the sweep: 8c781b1 -> eda1b5e
tracked worktree changed: (clean) -> M docs/education/assets/anim-morphology-matrix.js
```

Five commits landed on `main` during the 11.5-hour run -- education-audit merges and a CI fix. This
is the nine-commit hazard recurring, and the check the maker required before any further evidence
run is exactly what caught it.

**What the check discriminated, which is the whole reason it exists.** `phase6CompletionDrift`
hashes the executed source graph SEPARATELY from HEAD. The source-graph digest did **not** fire.
Only HEAD-moved and dirty-tree did. Verified two ways:

- `git diff --name-only 8c781b1 27eb3430 -- core/src solver-cpu/src runner/src` returns **zero
  files**, across the entire range including the regeneration commit.
- `package.json` changed by exactly one added npm script, so `node_modules` is identical too.

So this was a **provenance** failure, not a physics failure -- and that is a checked fact rather
than an argument, because the two quantities were separated by design.

**What was actually lost.** `report.json` and `diagram.svg`, both pure functions of `points.json`
and the arm, plus the property "this artifact names one commit". The 204 measurements were never in
question.

**MY ERROR, recorded because it nearly cost 11.5 hours.** I read "the gate refused to publish" as
"the run is void" and launched a full re-run. It was stopped at 0/204. A refusal to publish is not
a verdict on the data, and conflating them makes the gate more expensive than it needs to be --
which is how a safety mechanism gets resented and then bypassed.

**The recovery, and why each step is not a convenience.**

1. `app/scripts/phase6-regenerate-report.mjs` re-derives the two files, calling the SAME
   `phase6Aggregate` the sweep calls. It lives in `app/scripts/` and NOT `runner/src` precisely so
   that adding it leaves the hashed source graph byte-identical to the tree that computed the
   points -- putting it in `runner/src` would have falsified the claim the recovery rests on.
2. It refuses to overwrite an existing report, refuses a row set that is not exactly the registered
   grid, refuses rows whose self-reported `paramSet` belongs to the other arm, and refuses a dirty
   tree.
3. `report.json`'s `head` records the EXECUTION commit `8c781b1`, not the regeneration commit.
   Recording the latter would misdate the measurements.
4. A `regeneration.json` sidecar records the whole irregular history -- both commits, the reason,
   the source-graph digest, and all three artifact digests -- so the artifact cannot be mistaken
   for an ordinary sweep output.
5. `app/scripts/phase6-arm2-independent.mjs`, which imports nothing from `runner/src`, re-derives
   all 204 rows and every reported field: **PASS**.

**Scoped four-point replay, not a universal determinism claim.** Four points spanning the grid were
re-run at the clean regeneration commit and compared against the stranded rows. All four reproduce
bit-identically in every recorded field:

| T (deg C) | steps | attached | AR | reproduced |
|---|---|---|---|---|
| -2 | 155 | 1223 | 0.272918 | identical |
| -8 | 198 | 3253 | 0.684211 | identical |
| -15 | 121 | 917 | 0.272918 | identical |
| -35 | 199 | 1195 | 2.33333 | identical |

This checks exact replay for these four executions on the tested host/engine and inherited
environment. It does not establish that every grid row, state trajectory, architecture, or process
environment is deterministic.

**The structural fix, so this cannot recur.** An evidence sweep must not run in a worktree another
session commits to. Future sweeps run in a dedicated detached worktree pinned to a fixed commit,
where HEAD physically cannot move under them. `G:/Code Files/snowflake-phase6-arm2` is that
worktree.

**A gap this exposed and did NOT close.** The source-graph digest is computed and compared by the
completion check but recorded in no artifact, so after the fact it had to be re-derived from git
rather than read. That is REC 10's deferred half -- provenance fields in `report.json` -- and the
sidecar carries the digest in the meantime.

---

## E5 — the freeze rows' WARM-side evidence was measured under the superseded parameter set

**Found by the 2026-07-29 adversarial audit, rated CRITICAL, and never propagated out of
`docs/phase6-soundness-audit-2026-07-29.raw.txt` into any ADR, erratum or report until now
(2026-07-31).** That is the finding's second defect: it was discovered, written down, and left
where nobody reading the evidence would meet it. Recorded here so the next reader meets it.

**What is true.** `research/phase6-convergence.md:9` declares that every run in the WP3 convergence
campaign used `paramSet CAK_A1` — the set ADR 0031 invalidated the first sweep over. WP3's two
conditions behave completely differently under the registered sets:

| WP3 condition | steps / attached / AR | matches |
|---|---|---|
| warm, −5 °C f = 0.15 | 145 / 1513 / 0.3821 **plate** | the SUPERSEDED `CAK_A1` artifact exactly |
| warm, −5 °C f = 0.15, under registered `CAK` | 300 / 4883 / 1.0000 **neutral** | 3.2× the mass, 2.07× the steps, a different class |
| cold, −15 °C f = 0.15 | 316 / 5161 / 1.10526 | **bit-identical in BOTH sweeps** |

The cold arm is bit-identical because `A_prism → 1` at T ≤ −15, so `CAK` and `CAK_A1` coincide
there. The warm arm is not the crystal either published arm produces.

**What this voids, and what it does not.**

- **Survives, on its cold derivation:** N = 48, extent 21, `cflFill` 0.1, and the **+0.135
  extent-fragile bound** — which is why the per-point fragility flag both arms carry is still sound.
  **No published sweep number is shown wrong by this.**
- **Void for the executed parameter sets, warm side:** the `domain-budgets`, `habit-measurement-size`,
  `fill-cfl` and `dx` freeze rows' warm justifications, and
  `PHASE6_EXTRAPOLATION_ORDER_WINDOW`'s refusal of warm — whose `p = 0.207` was fitted on the
  `CAK_A1` crystal.
- **The consequence stated plainly: under `CAK` or `M1` there is no grid-, timestep-, domain-,
  measurement-extent or seed convergence study at ANY temperature warmer than −15 °C.** Charter
  line 309 requires convergence studies at representative sweep points; the warm representative is
  no longer the point that was measured.

**Why the obvious defence fails.** "Numerical convergence transfers across parameter values" is the
exact reasoning this project has twice recorded as wrong (WP3 §4.1/§1.1, and ADR 0026: *a
convergence study measured at a size other than the one being registered does not compose with the
registration, and in this project it has twice produced the wrong answer rather than merely a less
precise one*). The `domain-budgets` row itself says the budget "does NOT generalise across growth
RATE", and the CAK warm crystal carries 3.2× the mass at the same grid point.

**Where this bites hardest, and it is the regime under discussion.** The Nakaya `columns` regime is
−3.3 to −9.9 °C. Every point in it is warmer than −15 °C. So the two-arm report's central negative
result — neither arm produces a column there — rests on numerics with **no convergence study under
the executed parameter set**. The size ladder of
[`phase6-columns-refinement-prereg.md`](phase6-columns-refinement-prereg.md), run at −5 and −4 °C
under `M1` and `CAK`, is therefore the **first** measurement-extent convergence evidence in that
regime under a parameter set an arm actually used. It was designed to test an interpretation; it
also starts paying a debt E5 names.

---

## E6 — the registered domain spot-check has never been run, and was never listed as outstanding

**Also from the 2026-07-29 audit (rated HIGH), also unpropagated until 2026-07-31.**

The `domain-budgets` freeze row makes the sweep's validity at N = 48 **conditional**: the budget
"does NOT generalise across growth RATE … so the sweep's fastest-growing point must be spot-checked
against N = 64 rather than assumed covered." `PHASE6_DOMAIN_SPOT_CHECK` registers the criterion
(`coarseN` 48, `fineN` 64, identical class required, attached counts within 0.5%) **inside the gated
values manifest**, and registers the failure consequence: *raise the registered domain to N = 64 for
the entire grid and re-run it.*

`phase6DomainSpotCheckPasses` has **no caller outside `runner/test`**. No N = 64 row exists in either
artifact. Neither arm's report mentions it, and arm 1's "What this does NOT establish" list does not
list it as outstanding — so a mandatory, falsifiable check with a full-grid re-run as its
consequence was neither executed nor disclosed.

The audit also identified the point it must run at, on both natural readings of "fastest-growing",
from `points.json` rather than by assumption:

| reading | point | value |
|---|---|---|
| most attached | **T = −13 °C, f = 0.15** | 5291 cells |
| fastest per step | **T = −31 °C, f = 0.6** | 19.8 cells/step |

Both sit outside WP3's ladder coverage, and under `CAK` the ladder's own warm condition grows a
4883-cell crystal where WP3 measured 1513 — so the coverage gap is not confined to the cold end.

**Status: DISCHARGED 2026-07-31 — AND IT FAILS.**

Run at last, with the published N = 48 row as the coarse side (it is the measurement whose validity
is conditional, so re-running it would test the wrong thing) against a fresh N = 64 run at the same
registered extent 21, judged by the registered evaluator:

| reading | point | N = 48 | N = 64 | Δ attached | class | registered verdict |
|---|---|---|---|---|---|---|
| arm 1 fastest/step | −31 °C, f = 0.60 | 4551 | 4551 | **0.000%** | neutral = neutral | **PASS** |
| arm 1 most attached | −13 °C, f = 0.15 | 5291 | 5159 | **2.495%** | neutral = neutral | **FAIL** |
| arm 2 fastest/step | −6 °C, f = 0.15 | 4223 | 4295 | **1.705%** | neutral = neutral | **FAIL** |
| arm 2 most attached | −27 °C, f = 0.15 | 5329 | 5197 | **2.477%** | neutral = neutral | **FAIL** |

Registered tolerance: **0.5%**. Three of four readings exceed it by 3–5×.

~~**An internal control that says these failures are real.** The one PASS reproduces the coarse
attached count *exactly* — 4551 against 4551 at a different domain. A systematic error in the fine
runs could not produce that.~~

> **CORRECTION 2026-08-01.** The exact 4551-to-4551 result establishes only that no discrepancy was
> measured at that condition. One exact pass cannot exclude a condition-dependent systematic error
> at the three failing conditions.

**The habit CLASS is identical in all four**, so the four historical measured-only class readings do
not change. The registered conservative-intersection headline was never produced. What fails is the
registered pass criterion, which requires identical
class **and** attached counts within 0.5%.

**The registered consequence, quoted rather than paraphrased:** *"raise the registered domain to
N = 64 for the ENTIRE grid and re-run it"* — and the row explains why it is the whole grid rather
than the failing points: *"a per-point domain would make points incomparable with each other, which
is the one thing a morphology diagram cannot survive."* This is not discretionary and it is not
mine to waive. Cost, measured from these runs rather than estimated: N = 64 at extent 21 ran
4.0–4.7× its N = 48 counterpart, so a full two-arm re-sweep is roughly **780 core-hours**.

**Why this was findable only by running it, and why WP3 did not.** WP3's domain ladder concluded
"value converged at 48 to 0.04%, exact from 64" — but it measured exactly two conditions, −5 °C and
−15 °C, and it measured them under `CAK_A1` (erratum E5). Every point that fails here is a different
condition: −13, −6 and −27 °C. **The registered domain budget was justified on two points and fails
at three of the four others that were checked.** That is precisely the hazard the freeze row named
when it demanded a spot-check at the fastest-growing point — "the budget does NOT generalise across
growth RATE" — and precisely why leaving that check unrun for the whole phase mattered.

Note also that the 0.5% tolerance itself is inherited from WP3's `CAK_A1` domain ladder, so E5
touches the threshold as well as the justification.

**Maker direction 2026-07-31: honor the registered consequence in full.** Best science practice
governs cost/speed/accuracy tradeoffs.

> **SUPERSEDED SCHEDULING DIRECTION 2026-08-01.** The maker subsequently directed the science-first
> O1b path to execute rather than stop for resource reasons; see
> [`plans/phase-6-science-first-completion.md`](plans/phase-6-science-first-completion.md). This note
> does not amend the frozen protocol: the replacement ADR and charter/protocol alignment remain
> prerequisites to new production evidence.

**AND THEN THE REMEDIATION ITSELF FAILED ITS OWN CHECK (2026-07-31, 21:20).** Before committing
~780 core-hours to the mandated N = 64 re-sweep, the same criterion was applied one rung up —
already-measured N = 64 against fresh N = 80, at the same four points:

| point | N=48 → 64 | **N=64 → 80** | N = 64 verdict |
|---|---|---|---|
| arm 1, −13 °C, f = 0.15 | 2.495% | **1.861%** | **FAIL** |
| arm 2, −27 °C, f = 0.15 | 2.477% | **0.693%** | **FAIL** |
| arm 2, −6 °C, f = 0.15 | 1.705% | **0.559%** | **FAIL** |
| arm 1, −31 °C, f = 0.60 | 0.000% | 0.264% | PASS |

**Three of four fail. The registered failure consequence does not discharge the registered
condition.** "Raise the domain to N = 64 and re-run the entire grid" would have produced 408 fresh
points at a domain that fails the very spot-check that ordered the re-run. That is a defect in the
registration, not merely a wrong number, and it is recorded rather than silently widened to N = 80.

~~**Escalating N alone looks unaffordable.** Successive differences at the worst point run
2.495% → 1.861%, a ratio of 0.746; at that rate reaching 0.5% needs roughly four more doublings
beyond N = 80, which already costs ~12× N = 48 per point.~~

> **CORRECTION 2026-08-01.** If the single observed ratio 0.746 continued geometrically, four
> further reductions would leave about 0.576%, and **five** would leave about 0.430%, below 0.5%.
> These are hypothetical factor-0.746 reductions, not demonstrated domain doublings. The measured
> N = 80 cost shows that further study is expensive; two intervals do not establish either a
> convergence law or that every adequate configuration is unaffordable.

**Where the resolution may actually lie.** Every failure above is at the registered **extent 21**.
At **extent 29** the same criterion PASSED for P1 — N = 64 vs N = 80 agreeing to 0.354%. If the
domain sensitivity is a small-crystal effect rather than a box-size effect, a larger measurement
extent fixes both this and the extent non-convergence at once. **Confounded and under test** — the
failing points are different (T, f) conditions from P1 — by the pre-registered convergence study in
[`phase6-convergence-study-prereg.md`](phase6-convergence-study-prereg.md).

> **RESULT-SCOPE CORRECTION 2026-08-01.** That follow-up is diagnostic only and non-transferable to
> a production configuration. The original registered A/B/C ladder is **outcome 4,
> non-monotone**: P1 changes 1.40000 → 1.52632 → 1.52174, so the adjacent B→C fall refutes the
> earlier monotone-growth reading. Later diagnostic rungs do not retroactively change that
> registered outcome and do not close a Phase 6 gate.

---

## What is NOT covered here

- Errata in **unhashed** locations are fixed in place and not listed, except E2.
- The audit's remaining findings against research documents and ADRs are corrected directly in
  those files; this file is only for the frozen manifest.
- No claim is made that the audit found every error in the hashed strings. It checked the σ-axis
  justification because a related claim failed; the other 24 rows' justifications were not
  systematically re-derived.
