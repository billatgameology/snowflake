# Phase 6 — the historical two-arm measured comparison

> **Gate status corrected 2026-08-01.** The 3/90 and 54/90 values in this report are measured-only
> counts, not ADR 0026's registered conservative-intersection headline. R15 and the charter's GPU
> and held-out obligations remain open under the science-first completion plan.

**Both historical arms, reported together.** Arm 1 is the `CAK` broad-facet parameterization; arm 2
is the dipped `M1` parameterization. This is **not an SDAK-only ablation**: M1 also changes the broad
`sigma_0` forms and sets `A_prism = 1`. The comparison measures a bundled parameter-set difference.
A matched M1-without-dips arm is required before any difference can be assigned causally to the
implemented dip factors within the frozen solver configuration. Even that intervention cannot
establish physical SDAK causality or necessity in nature.

Arm 1's own report is [phase6-sweep-report.md](phase6-sweep-report.md), including its retraction.
This document does not restate it; it reads the two arms against each other.

**The common measured-only number is the least informative thing here, and it is not the lead.** M1
scores 54/90 against CAK's 3/90. The bundled parameterization change is a **trade**; at the registered
measurement size neither arm scores a single point in the regime that the source's SDAK model was
constructed to explain; and arm 2 produced neutral classes throughout its pre-registered bistable
band. Neither observation is a causal SDAK test.

> **READ §4's CORRECTION FIRST.** The predeclared diagnostic has since shown that
> arm 2 **does** produce a column in that regime at −5 °C when the crystal is measured at extent 29
> instead of the registered 21 — AR 1.40000 → **1.52632**. Its final registered outcome is
> non-monotone, and the diagnostic is not admissible as gate evidence. The scored tallies above are
> unaffected. An earlier version of this paragraph attributed the difference to SDAK alone, which
> the two confounded parameter sets cannot establish.

---

## 1. What was measured

| | arm 1 | arm 2 |
|---|---|---|
| parameter set | `CAK` | `M1` |
| parameterization label | broad-facet CAK | dipped M1 (two dip factors) |
| arm id | `arm1-cak` | `arm2-sdak-m1` |
| freeze commit | `e2f1bfca…` | `483f7ee56cbbcd5017658aa4879a3a9b87c56809` |
| execution commit | `390fe35a…` | `8c781b166db2c72d2fa86cef001e2e8c48ac96c3` |
| values hash (GATED) | `879e069f…` | `13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76` |
| points | 204 | 204 |
| excluded | 0 | 0 |
| artifact | `evidence/phase6-sweep/` | `evidence/phase6-sweep-arm2/` |

Both ran the same 34 × 6 grid, the same solver, the same seed, the same far field, the same
measurement size, and the same registered scoring rule (ADR 0025). **The parameter set is the only
intended difference**, and each of arm 2's 204 rows carries its own echoed `paramSet=M1` header, so
that claim is checkable from the artifact rather than asserted.

Arm 2's artifact was **regenerated, not written by its own sweep** — the completion-time provenance
check refused to publish because five commits landed on `main` during the 11.5-hour run. The
source-graph digest did not move, and the published rows were regenerated under the recorded source
rather than accepted from the failed provenance check. That supports the regenerated artifact; it
does not retroactively authenticate every state of the original long-running processes. The whole
irregular history is in erratum E4 and in the artifact's own `regeneration.json` sidecar.

### Verification

| check | arm 1 | arm 2 |
|---|---|---|
| separate re-derivation of published row/report fields | PASS (historical-plan WP5 verifier) | **PASS (historical-plan verifier)** |
| negative controls executed | 7 (5 CAUGHT, 2 GAP) | **16 (15 CAUGHT, 1 GAP)** |
| per-row parameter set recorded | 0 of 204 (erratum E3) | **204 of 204** |
| run-end condition recorded | 0 of 204 (erratum E3) | **204 of 204** |
| figure re-renders from the data | **data byte-identical** | **data byte-identical** |
| whole SVG re-renders byte-identically | no — caption drift | **yes** |

The active science-first plan's WP5 is the still-open preview-budget GPU cohort; it is unrelated to
the completed historical-plan verifier in this table.

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

**Review provenance and limits (2026-08-01).** The adversarial claim reviewer was OpenAI
`gpt-5.6-sol` at ultra reasoning, with the current request/handoff context and no Phase 6 authorship.
It independently re-executed both artifact verifiers, diagram reconciliation, flip census, ladder
reader, direct JSON class/fragility/f = 0.90 checks, and the live fingerprint. It did not re-run the
408 long solver jobs, execute GPU or held-out campaigns, establish numerical convergence, audit
`docs/education/**`, or run complete `npm test`. Those omissions limit the reviewed evidence.

---

## 2. The result

> ### Common denominator: arm 1 **3 of 90**, arm 2 **54 of 90**.

The common denominator is arm 1's historical measured-only scoring scope applied to both arms, so
the two numbers are comparable. Arm 2's own measured-only scope — which additionally withholds the
three pre-registered bistable temperatures — is **54 of 78**. Neither value is ADR 0026's registered
conservative-intersection headline.

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

The historical one-directional `extentFragile` rule flags 16 arm-1 rows and 33 arm-2 rows below a
threshold. Applying the same 0.135 distance to rows strictly above a threshold finds 42 and 51
additional rows, for totals of 58 and 84. The closed symmetric audit also includes a row exactly on
a threshold in each arm, giving 43 and 52 additional (59 and 85 total). The two count pairs differ
only by threshold-equality convention; neither is a convergence result. The registered P1 ladder
also falls from AR 1.52632 to 1.52174 on one interval, directly refuting the old one-directional
rationale.

Point-by-point, 115 of 204 points did not change class. The 89 that did:

| move | n |
|---|---|
| neutral → plate | 66 |
| column → neutral | 14 |
| column → plate | 6 |
| plate → neutral | 3 |

---

## 3. M1 versus CAK is a trade, not an SDAK ablation

**Twenty of CAK's thirty columns stop being columns under M1.** The bundled parameter-set change
converts 66 neutral points into plates and loses two thirds of CAK's columns.

| | arm 1 | arm 2 |
|---|---|---|
| columns, all 204 points | 30 | **10** |
| warmest column | −19 °C | **−30 °C** |
| column onset at f = 0.10 | −19 °C (17 points) | −30 °C (6 points) |
| column onset at f = 0.15 | −23 °C (13 points) | −32 °C (4 points) |
| `columns-and-plates` agreement | **26 / 78** | 14 / 78 |

The class trade is visible in the measured diagram: at f = 0.10 M1's plate region runs unbroken from
−9 °C to **−24 °C** — 2.5 °C past the −21.5 °C boundary and into the regime where the reference wants
columns available. These runs do not identify which of M1's changed inputs causes that region.

`columns-and-plates` accepts **both** pure classes, so it is the easiest regime on the board to
agree with — and it is the one regime where arm 2 is **worse than the control**, 26/78 → 14/78.

**A gain that should be reported against arm 1 too.** Arm 1 produced three columns *inside*
`plates-cold`, where the reference demands plates — two of them in headline scope. Those are active
wrong-habit points, not merely neutral ones. Arm 2 has none. That is a real improvement in kind and
not only in count.

### At the highest sampled supersaturation, CAK and M1 have identical classes

**At f = 0.90 the two arms are identical in class at all 34 temperatures** — every point neutral in
both, not one class changed. Their raw aspect ratios nevertheless differ in 28/34 pairs, with
maximum sampled `|ΔAR| = 0.218335`. At f = 0.60, 11 of 34 classes changed. Because M1 also changes
`A_prism` and the broad `sigma_0` forms, neither the class equality nor the raw differences isolate
the dip factors. The matched no-dip arm must make that within-solver comparison; it cannot by itself
establish physical SDAK causality or necessity in nature.

**And the dominant class is still "no habit".** Arm 2 reduced neutral from 168 to 119 of 204. The
M1 artifact has no definite habit at **58% of the grid**.

---

## 4. Neither arm produces a column in the `columns` regime — AT THE REGISTERED MEASUREMENT SIZE

> ### ⚠ FINAL INTERPRETIVE CORRECTION (2026-08-01) — diagnostic outcome 4, not gate evidence
>
> At the sampled −5 °C, f = 0.10 diagnostic point, arm 2 measures a column at larger sizes.
>
> The pre-registered size ladder returned rung B, and at **T = −5 °C, f = 0.10 under `M1`** the
> aspect ratio went **1.40000 at extent 21 → 1.52632 at extent 29**, crossing the registered 1.5
> floor. That is a `column`, at a temperature where the reference demands one, from a clean run:
> `stop reason=size-target`, `symErr = 0`, `allConverged`, `deltaSymClean`, 298 steps, 6779 cells,
> and the geometry self-reports `hexRadius 31`, `seedSites 19`. Nothing excludes it.
>
> `1.52632` is the five-decimal rendering of the exact extent ratio `29/19`.
>
> **What is withdrawn:** "neither arm produces a single column in the Nakaya `columns` regime" as a
> statement about the **model**. **What stands:** the same sentence as a statement about the model
> **at the registered measurement size**, which is what was measured and what the 3/90 and 54/90
> headlines score. No published tally moves.
>
> The complete sequence is **registered outcome 4, non-monotone**: 1.40000 (extent 21) → 1.52632
> (29) → 1.52174 (35) → 1.64000 (41). Outcome 1 required a monotone rise. Selecting the extent-29
> crossing and ignoring the following fall was exactly what outcome 4 prohibited.
>
> ### The correction SURVIVED both of its tests (2026-07-31, later)
>
> **One same-target domain comparison passed; the adequacy inference is withdrawn.** P1 requested
> `--until-extent 28` in N = 80 instead of 64; the whole interface update reached reported extent 29
> in both domains. It was judged by
> the registered `PHASE6_DOMAIN_SPOT_CHECK` criterion:
>
> | P1 at extent 29 | AR | class | attached | symErr | converged | D6h |
> |---|---|---|---|---|---|---|
> | N = 64 | **1.52632** | `column` | 6779 | 0 | true | true |
> | N = 80 | **1.52632** | `column` | 6755 | 0 | true | true |
>
> Identical class, identical AR to six figures, attached counts **0.354% apart against the
> registered 0.5%**. This local comparison passes, but it does not establish N = 64 adequate or
> prove that the crossing is solely a physical-size effect; the extent-35 pair later fails the
> same criterion and the A/B/C ladder changes domain and crystal size together.
>
> **The parameter-set split is large at this point.** P5 — `CAK` at the *same* −5 °C and
> σ∞ = 0.005, added after the M1 crossing was observed — goes **0.789474 → 0.851852** from extent 21
> to 29. At identical conditions and measurement size the two parameterizations sit 0.675 apart.
> Because CAK→M1 changes more than the dips, this is not an SDAK-only causal result.
>
> **P1 does not show size convergence over the sampled rungs.** 1.40000 (ext 21) → 1.52632
> (29) → 1.52174 (35) → 1.64000
> (41) is non-monotone. The class is `column` at the three larger sampled extents, which is a narrower
> measured statement than convergence.
>
> *(Historical note superseded: P5's first row was destroyed by a concurrent-writer race. The
> current `ladder.json` contains the completed P5-B record with its validity fields; the ladder
> reader keeps it separate from the registered 12-row A/B/C cohort.)*
>
> **A pattern worth keeping.** At extent 21 the domain check FAILS (N = 48 vs 64, 1.7–2.5%); at
> extent 29 it PASSES (N = 64 vs 80, 0.354%). Absolute clearance grew 13.5 → 17.5 → 25.5 cells while
> the extent/N ratio barely moved. Over these two sampled extents, agreement coincides with increased
> absolute clearance rather than the nearly fixed ratio. Two comparisons do not establish absolute
> clearance as the governing variable; they do refute using the ratio alone as a transferable rule.
>
> ### FINAL (2026-08-01) — the correction stands in CLASS terms; the registered convergence
> ### criterion does NOT pass, and both are reported
>
> Every item named in this diagnostic block has now been measured. The pre-registered convergence study
> ([prereg](../docs/phase6-convergence-study-prereg.md)) returns **outcome 3, NOT CONVERGED.**
>
> | P1, arm 2 `M1`, −5 °C, f = 0.10 | AR | class | domain check N=64 vs N=80 |
> |---|---|---|---|
> | extent 21 (registered) | 1.40000 | `neutral` | — |
> | extent 29 | **1.52632** at *both* domains | **COLUMN** | 0.354% **PASS** |
> | extent 35 | **1.52174** at *both* domains | **COLUMN** | 1.071% **FAIL** |
> | extent 41 | **1.64000** at *both* domains | **COLUMN** | 0.444% **PASS** |
>
> **What the diagnostic measures.** The habit is `COLUMN` in all six runs at extents 29/35/41, and the aspect
> ratio is **identical to six figures at both domains at every extent**. The class does not depend on
> the domain anywhere it was tested at extent ≥ 29. At this one sampled condition, arm 2 is neutral
> at extent 21 and columnar at all three larger sampled extents.
>
> **What is NOT established.** The registered domain criterion requires identical class **and**
> attached counts within 0.5%. At extent 35 the attached counts differ by **1.071%** — 11 201 against
> 11 081, a 120-cell difference despite the same reported extents and six-decimal aspect ratio. The
> ladder artifact contains no occupancy-level witness, so it does not establish an identical envelope. **The multi-rung diagnostic
> therefore returns its registered not-converged outcome; the two passing rungs do not establish a
> composed converged configuration.** The historical ADR 0037 §5 no-re-sweep resource
> decision has been superseded by the maker's science-first direction; the active completion plan
> requires a new frozen campaign. The criterion is not rewritten to the one that passes.
>
> So: the failure is in **attached-cell count**, and the quantity the Nakaya comparison consumes —
> the class — is invariant across every domain tested. Both facts travel together.
>
> **The execution-matched comparison separates the parameter sets at this diagnostic point.** Arm 1 (`CAK`) at the
> *same* −5 °C, the *same* σ∞ = 0.005 and the
> *same* extent 29 reads **0.851852** against arm 2's **1.52632** — 0.675 apart, on opposite sides of
> the class boundary. This is a controlled M1-versus-CAK diagnostic at one condition; the control was
> added after the crossing was observed, and the owning pre-registration explicitly makes the
> diagnostic inadmissible as gate evidence. It is not a matched dip ablation because the parameter
> sets change broad functions and facet prefactors too.
>
> **With one honest qualification.** P4 (CAK at f = 0.90) reads 1.31250 → 1.31818 → 1.40000 →
> **1.46429** and is still `neutral`. No crossing was measured; the former post-hoc extent-44
> extrapolation is retracted. The measured M1-versus-CAK class split is present at the sampled
> f = 0.10 point; f = 0.90 remains neutral through the largest sampled extent. This
> two-fraction diagnostic does not establish a general supersaturation boundary.
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
> ### The broader diagnostic: AR changes across jointly larger crystal/domain rungs
>
> Rung C for the controlled pair — same −5 °C, same σ∞ = 0.045, differing only in parameter set:
>
> | point | set | ext 21 | ext 29 | ext 35 | rate 21→29 | rate 29→35 |
> |---|---|---|---|---|---|---|
> | **P3** | `M1` | 1.26594 | 1.33122 | **1.48831** | 0.00816/cell | **0.02618/cell** |
> | **P4** | `CAK` | 1.31250 | 1.31818 | **1.40000** | 0.00071/cell | **0.01364/cell** |
>
> **Both sampled sequences rise, and their second interval is steeper** — the per-cell increment is
> 3.2× larger for `M1` and 19× larger for `CAK` than in the first interval. Three points over extents
> 21–35 show no sampled aspect-ratio plateau. Because A/B/C also change domain N, P3/P4 do not by
> themselves establish physical-size dependence. P1's matched-domain rows show the same AR at both
> sampled boxes for each larger extent, so they support a one-condition size association; none of
> this establishes a size-independent or size-dependent habit for a full regime or arm.
>
> At extent 35 the two arms sit **0.088 apart**, close to an extent-21 empirical AR gap of 0.0875 near
> 1.4. That scale is imported from a different size. M1 sits above CAK by roughly that sampled gap;
> the confounded comparison cannot assign the offset or the divergence to the dip factors.
>
> **A claim of mine that this withdraws.** On seeing rung B alone I wrote that P4 was flat at
> 0.00071/cell, "11× slower — a genuine mechanism difference: SDAK driving a self-reinforcing
> columnar habit, which is what the hypothesis predicts." That was two rungs. The third shows arm 1
> doing the same thing, and the reading is withdrawn.
>
> **The domain controls separate class/AR from attached-count convergence.** Matched N = 64/N = 80 rows at
> extents 29, 35 and 41 reproduce P1 class and AR exactly, so P1's cross-extent AR pattern is not changed
> by the tested box sizes. The registered criterion also consumes attached count, however, and that
> quantity fails at extent 35. The ladder therefore supports a P1 one-condition size-associated
> class/AR diagnostic, not a general size-effect claim or a numerically converged gate result.
>
> **This also sharpens erratum E5 rather than resolving it.** E5's original statement that no
> warm-side convergence evidence existed was too broad: the later ladder and matched-domain rows are
> sparse warm-side numerical checks. They do not compose a grid-spacing, timestep, domain,
> measurement-extent and seed convergence study under either executed parameter set. At one selected
> warm point, changing measurement extent changed class; at another rung, the registered attached-count
> domain criterion failed. Those are diagnostics of the open numerical problem, not convergence.

The section below is preserved as published, and every number in it remains correct **as a
measurement at extent 21**.

This is a measured-size limitation that a single aggregate score does not show.

The Nakaya `columns` regime, −3.3 to −9.9 °C, is the regime the SDAK hypothesis exists to explain.
At the registered extent, changing from CAK to the bundled M1 parameterization moved **zero** of
those points to `column`. That is not a matched test of the source's causal SDAK claim.

| | arm 1 (36 pts) | arm 2 (36 pts) |
|---|---|---|
| column | **0** | **0** |
| plate | 1 | 3 |
| neutral | 35 | 33 |
| headline-scope points | 24, all neutral | 12, all neutral |

Across almost the whole regime, both arms remain in the registered `neutral` AR interval rather than
reaching either pure-class threshold. That is distinct from producing the wrong pure habit; it does
not by itself identify a kinetic tie or its cause.

### The gap spans one observed step in the extent-21 corpus

`AR = zExtent / tExtent`, where `zExtent` is an integer layer count. AR is therefore **discrete**.
The executed extent-21 rows sample it as follows near the class thresholds:

- **408 measurements across both arms produced 36 distinct AR values.**
- Near the column floor the realized ladder is `1.3125, 1.4000, 1.5000, 1.6154` — steps of 0.0875
  and 0.1000.
- **No measurement in either arm lands strictly between 1.4 and 1.5.**
- Arm 2's best columns-regime point (−5 °C, f = 0.10) sits at `zExtent 21 / tExtent 15`. Qualifying
  as a column requires `tExtent 14`. **One lattice cell.**
- The registered `extentFragile` rule (±0.135 AR, ADR 0025) already flags that point. The
  protocol's own fragility test was pointing here before this was connected to the columns claim.

So "1.4000 against a floor of 1.5" spans one observed step in these 408 rows, not a physical
distance. This does not define the instrument's resolution at another size or for an unobserved
crystal. The physical-size question was pre-registered as a separate diagnostic in
`docs/phase6-columns-refinement-prereg.md`; P1's deciding A/B/C reading is outcome 4.

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

Raw rows are tracked at `evidence/phase6-columns-ladder/ladder.json`; every number above is
transcribed from it and the full file is hash-registered in `evidence/MANIFEST.json`. The historical
rung-A-only snapshot was **11,128 bytes, sha256
`248ae0af3196c35da258a2b69a3aec5e3d133191a769867172670253e6ade855`** (this hash covers the four rung-A
rows only and moves as later rungs append).

**All four registered outputs are identical, and rung A passes its reproduction check.** The sample
spans both parameter sets, a third commit and a different worktree, and reproduces step count as well
as measured shape. Equal final metrics and step count do not prove every intermediate state was the
same, and the inherited process environment was not sealed; the result is scoped to these four
executions on the registered host/engine family.

It also independently corroborates erratum E4's central claim. E4 argues that arm 2's provenance
failure was not a physics failure, on the ground that no file under the hashed source roots differed
across the commit range. P4 tests that from the other side: an **arm 1** row, published from a
commit five days and dozens of commits earlier, reproduces exactly at the arm-2 regeneration commit.

### Rungs B and C

Rung B (N = 64, target extent 28) and rung C (N = 80, target extent 35) were intended to answer the
diagnostic question. Their final P1 reading is outcome 4 (non-monotone), not convergence.
**The historical outcome definitions were fixed in the pre-registration:**
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

> **ARCHIVAL STATUS ONLY — superseded 2026-08-01.** The launch log above is preserved to document the
> resume bug, not to describe current state. All 12 registered A/B/C rows now exist and validate;
> later B80/C64/D/D80/P5 diagnostics are stored separately. The fail-closed reader reports P1 as
> outcome 4 and rejects missing, duplicate, shifted, or B→C-fall-removed mutations.

---

## 4b. The flip census — a registered output produced from the historical artifacts

ADR 0025 registers the count of habit flips as "**itself a first-class result**", and
`phase6DetectFlips` exists to produce it. Before the census below it had never been called outside
`runner/test`, and neither arm's artifact carried a flip count (pin register R55). It costs no
compute — flips are a function of the published `points.json` — so it is produced here.

A flip is a change between **pure** classes scanning warm to cold along a constant-f ladder, and it
is **bracketed rather than pinpointed**: reported as the interval between the last temperature of
one class and the first of the other. Neutral points do not terminate a scan, they widen the
bracket, because a wide neutral span means the flip is poorly located and a midpoint would
manufacture precision.

| | arm 1 (`CAK`) | arm 2 (`M1`, dipped) |
|---|---|---|
| f = 0.10 | `plate→column`, bracketed −4 … −19 °C (width **15**) | `plate→column`, bracketed −24 … −30 °C (width **6**) |
| f = 0.15 | `plate→column`, bracketed −3 … −23 °C (width **20**) | `plate→column`, bracketed −22 … −32 °C (width **10**) |
| f = 0.25 – 0.90 | none | none |
| **total** | **2** | **2** |
| `plate→column` | 2 | 2 |
| **`column→plate`** | **0** | **0** |

The reference changes habit **three** times scanning warm to cold: `plate→column` at −3.3,
**`column→plate` at −9.9**, and `plate→column` at −21.5.

**Neither arm produces a `column→plate` flip under the registered pure-class operator on these
twelve sampled ladders.** The operator skips neutral rows: each arm has one `plate→column` flip on 2
of 6 ladders and zero flips on the other 4. This does not classify neutral-mediated changes or
unsampled temperatures.

**Two bundled CAK→M1 differences are visible here.** The two observed brackets narrow — 15 → 6 and
20 → 10 — and move colder. Because broad functions and facet prefactors change too, the comparison
does not identify the dip factors as the cause.

**This is a measured contrast, not a restored structural theorem.** `M1` has three exact `sigma_0`
equalities; because both M1 prefactors are one, those are also three
equal-shared-positive-field attachment-coefficient equalities. They are analytic properties of the
source model, not habit transitions. M1's sampled corpus has one registered pure-class flip on 2 of
6 ladders and none on the other 4. The two quantities are different observables; no bound for every
field, supersaturation, or parameterization follows.

Reproduce with `node app/scripts/phase6-flip-census.mjs`. It runs the registered operator **and** an
independent re-derivation from the registered definition, and requires them to agree on every
ladder, so a silent change to the operator cannot pass as a change in the result. They agree on all
twelve.

---

## 5. The bistable band failed in the only way it could

ADR 0036 pre-registered −4, −5 and −6 °C as a **bistable band**: at those temperatures the source
reports that "both platelike and needlelike crystals can grow under essentially identical
conditions". One deterministic run does not represent that reported population mixture under the
chosen regime-level comparison, so the registered rule accepts **either** pure class. This does not
prove that no deterministic score could be valid for a more specifically controlled experiment.

That rule has exactly one failure mode: produce neither habit.

**All 18 points did. 0 agree, 18 neutral.**

This was registered in advance as "not an amnesty", and it was not one. It is also the cleanest
statement of §4's finding: given a rule that would have accepted any definite answer, the model
declined to give one.

---

## 6. Four registered reasons to discount the measured-only score

Written before the sweep, not assembled afterwards.

1. **It is in-sample.** M1's dip centres were chosen by their author to reproduce the Nakaya
   diagram; the prism dip is centred at −14.4 °C and the `plates-cold` regime that supplies 49 of
   the 54 agreements is centred at −15.7 °C. ADR 0005 registered that a SDAK model reproducing this
   diagram is not independent evidence. **Arm 2 is a consistency check, not a test.**
2. **The 42/90 common-scope and 42/78 arm-scope values are a withdrawn, confounded historical
   proxy forecast, inadmissible as habit evidence and not a valid pre-run habit prediction.** The
   measured 54/90 and 54/78 counts therefore do not validate it. It came from a confounded transfer
   fit (`ln AR = −0.2659 + 0.5119 ln r`,
   R² = 0.511) from CAK outputs to M1's far-field coefficient-ratio proxy. Forty-four of 204
   predictions extrapolated beyond the CAK proxy range, concentrated in `plates-cold`, and changing
   parameterization also changes the facet-local fields and geometry. The alternative linear-AR fit
   produced nonpositive aspect ratios; its historical 66/78 score and the 42–66 range are withdrawn,
   not retained as an uncertainty interval.
3. **The historical regression-intercept interpretation is withdrawn.** At `ln r_proxy = 0`, the
   empirical fit returns AR 0.7665. That is an intercept of a CAK correlation evaluated on a
   far-field proxy, not a forward run with isotropic local attachment kinetics. Its distances from
   the plate and column thresholds therefore do not measure an instrument or lattice preference.
   The directly measured statement is narrower: in the executed M1 arm, 75 of 85 non-neutral rows
   are plates.
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
  without amending it. One row out of 204 is corroboration, not closure.
- **THE COMPOSED WARM-SIDE CONVERGENCE CAMPAIGN REMAINS OPEN** (erratum E5, corrected
  2026-08-01). The historical WP3 campaign ran `paramSet CAK_A1`, which ADR 0031 superseded. Its
  cold condition is bit-identical under `CAK`, so the cold derivations remain available; its warm
  condition is a different crystal entirely: −5 °C, f = 0.15 is 1513 cells / AR 0.3821 `plate`
  under `CAK_A1` and 4883 cells / AR 1.0000 `neutral` under `CAK`. Later CAK/M1 size ladders and
  matched-domain pairs provide sparse warm-side checks, so the earlier claim that no study of any
  kind existed was false. What remains open is a pre-registered, composed grid-spacing, timestep,
  domain, measurement-extent and seed campaign under the parameterization being scored. The sparse
  checks do not close it: one selected point changed class with measurement extent, and one domain
  rung failed the registered attached-count criterion.
- **The registered headline rule is not the rule that produced either headline** (pin register R15).
  The `uncertainty-reporting` freeze row registers the headline as the **conservative intersection**
  of measured and grid-extrapolated class, with a `classSurvivesGridExtrapolation` flag and a
  not-extrapolatable tally per point. `phase6FitGridExtrapolation` has no caller outside
  `runner/test`; neither arm's rows carry any of those fields. Discharging it needs three grid
  spacings **per point** — 612 runs per arm — which the registered budget never contained, so this
  is a defect in the registration found late, not a shortcut in the implementation. Not being fixed
  by amending the registration to describe what the code does: ADR 0031 rejected exactly that move
  by name.
- **The registered domain spot-check was omitted, then run and failed** (erratum E6) — N = 48 versus
  N = 64 fails 3/4 sampled checks, and N = 64 versus N = 80 also fails 3/4. The historical automatic
  N = 64 remedy therefore did not establish adequacy. The active science-first plan requires a new
  pre-registered whole-grid numerical campaign rather than de-registering the criterion.
- **Cross-platform Tier 1 bytes preserved from 2026-07-31 (arm64), and they split.** Tier-1 libm digest DIFFERS
  (x64 `2a9f64b3`, arm64 `3662b9e2`), so digit-level results stay scoped to the registered x64
  host. A historical Tier-2 table reports four exact arm-1 fixture matches, but its raw arm64 logs
  and exit records were never tracked and are unavailable here, so no end-to-end portability result
  is independently rederivable. **The arm-2 M1 results were not themselves re-run on arm64**;
  nothing here establishes that an arm-2 point is architecture-independent.
- **No valid `dxUm` convergence study under either published parameter set.** The historical probe
  estimated roughly 60× more work per point when halving cell size, but resource cost does not
  establish numerical adequacy. The old spacing tuple also changes physical seed and achieved size.
  A repaired fixed-physics R15 campaign is planned but not yet frozen or running; the existing
  study does not substitute for it.
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used.

## 8. What this establishes

**Stated at the strength the measurements support, per Rule 6.**

- Changing from CAK to M1, at the registered grid and measurement size, raises measured-only
  agreement from 3/90 to 54/90 — and that change is in-sample by construction. It is not the
  registered conservative-intersection headline and not an SDAK-only ablation.
- The bundled parameterization change is a **trade**: it costs two thirds of CAK's columns (30 → 10) and **12 points of
  agreement** (26/78 → 14/78) in the one regime that accepts both habits.
- **Neither parameterization produces a single column in the Nakaya `columns` regime at the
  registered measurement size**, 36 points each. Across almost the whole regime both arms produce no
  definite habit at all. **The unqualified version of this claim is withdrawn — see §4.** Measured
  at extent 29, arm 2 produces a `column` at −5 °C, f = 0.10 (AR 1.52632). So this is a statement
  about the model *as measured at extent 21*, not about the model. **Carry corrected E5 with it
  wherever it goes:** sparse warm-side size/domain checks now exist, and one selected point changed
  class with measurement extent, but no complete composed numerical-convergence campaign under
  either executed parameter set supports a regime-wide conclusion.
- The executed extent-21 corpus has observed AR gaps of 0.0875–0.100 near the column threshold. That
  is an empirical sample property, not a universal resolution of the lattice or instrument.
- **Neither sampled artifact produces a `column→plate` flip under the registered pure-class operator.**
  Each arm produces one `plate→column` flip on 2 of 6 constant-f ladders and none on the other 4;
  the reference needs three transitions, including `column→plate` at −9.9 °C. M1's two observed
  brackets are narrower and colder than CAK's, but the confounded comparison does not assign that
  difference to the dip factors.
- **`M1` has three exact `sigma_0` equalities (and, with unit prefactors, three
  equal-shared-positive-field attachment-coefficient equalities), while only 2 of 6 sampled ladders
  contain one registered pure-class flip.** The analytic equality count and the artifact-derived
  habit-flip count are distinct observables.
- Four selected points spanning both parameter sets reproduce AR, step count, extent and stop reason
  exactly at a later commit/worktree. This scoped reproduction does not prove every intermediate
  state, untested point, architecture, or inherited environment identical.

**What it does not establish:** that no SDAK parameterization can produce columns there; that the
failure is or is not a resolution artifact beyond the range the diagnostic covers; or anything at
all about a model other than the two that were run.
