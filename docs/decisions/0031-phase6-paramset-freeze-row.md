# 0031 — `paramSet` becomes a freeze row, the registered value is `CAK`, and the sweep re-runs

- **Date:** 2026-07-28
- **Status:** accepted

## Charter impact

None, and per Rule 5 here are the clauses that make it none. §3.2 Phase 6 item 1's freeze list
already contains the row this ADR is about:

> "Before the first validation sweep runs, freeze `docs/libbrecht-parameters.md` and a written
> validation protocol: … float precision, **the parameter interpolation scheme**, noise amplitude,
> seed-ensemble size, the model/code version (commit hash), and the uncertainty-reporting scheme."

and the same clause prices the correction:

> "Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior sweep
> results — **the full sweep re-runs**."

This is that logged ADR. **Unlike ADRs 0025, 0026 and 0028, a sweep HAS now run**, so the price is
not zero: the 204-point sweep of `6995868` is invalidated and re-runs. That clause is the mechanism
working exactly as designed, and the cost is the reason it was written.

## Context

### The registered scheme and the executed runs disagree

`runner/src/phase6-protocol.ts` registers the parameter interpolation scheme as:

```ts
export const PHASE6_INTERPOLATION = {
  sigma0: "piecewise-log-log-linear",
  aPrism: "piecewise-linear-in-(Tm-T)",
  aBasal: "constant-1",
  ...
} as const;
```

`aPrism` and `aBasal` are registered **as different things**. `aBasal` is `constant-1`; `aPrism` is
a piecewise-linear interpolation in (Tm − T) through the digitized `A_PRISM_CAK` anchors in
`core/src/libbrecht.ts`. There is no reading of that row on which `A_prism ≡ 1`.

Every one of the 204 runs used `A_prism ≡ 1`.

### The mechanism, named exactly

`runner/src/phase6-sweep.ts` never sets `paramSet` — the string does not appear in the file. The
harness spawns `runner/src/main.ts grow-lk`, and `main.ts:535` defaults:

```ts
paramSet: "CAK_A1",
```

`CAK_A1` is the parameter set in which `nucleationAPrism` returns 1 for every temperature. So an
**unregistered CLI default silently overrode a registered freeze row**, through a path the freeze
did not cover because `paramSet` was not itself a registered row.

**This is therefore not a missing-row omission of the kind ADR 0025 corrected.** The scheme *was*
registered. The runs violated it. That is a materially worse failure than an unregistered degree of
freedom, because the artifact and the evidence disagree while both look complete.

### How large is the discrepancy, and where

`A_PRISM_CAK` = [0.45, 0.28, 0.21, 0.18, 0.83, 1, 1, 1, 1] at (Tm − T) = [1, 2, 3, 5, 10, 15, 20,
30, 50]. Against `CAK_A1`'s A ≡ 1 the throttle is 3.6× at −2 °C, **5.6× at −5 °C** (the table's
minimum), 1.75× at −8 °C, and **1.0× at −15 °C and colder**.

`research/libbrecht-figure-findings.md` §2 records the corroborating source finding: `2009.08404v2`
Figure 2's caption states "The present paper focuses on temperatures between -10 C and -30 C, where
𝐴_basal ≈ 𝐴_prism ≈ 1". ~~**So in the `plates-cold` band the two parameter sets are the same model**,~~
and the violation can only have affected roughly −2 to −9 °C.

> **CORRECTED 2026-07-29 (audit).** "The same model" is false as stated, and measurably so. Of the
> 72 points in −10…−21 °C, **11 differ** between the two `points.json` files, with **max |ΔAR| =
> 0.1092**. `A_prism` reaches 1 only at (Tm−T) = 15: it is **0.830 at −10 °C**, 0.864 at −11, 0.898
> at −12, 0.966 at −14. So the sets coincide only from about −15 °C colder, and the mismatch's reach
> is roughly −2 to −14 °C rather than −2 to −9 °C. It remains true that **no `plates-cold` point
> changed CLASS** — the band is 0/60 under both sets — which is the conclusion that mattered, but
> the stronger "same model" phrasing was wrong.


## Decision

**1. `paramSet` becomes an explicit Phase 6 freeze row**, and the sweep harness passes it to every
child process rather than relying on any default. A freeze row that a CLI default can override is
not frozen.

**2. The registered value is `CAK`** — the full parameter set, with `A_prism` interpolated.

The decision rests on **provenance and on conformance to the existing registration**, in that
order, and deliberately not on score:

- **It is what the protocol already says.** `aPrism: "piecewise-linear-in-(Tm-T)"` is registered.
  Selecting `CAK_A1` now would mean editing the registered scheme to match the runs that were
  actually executed — fitting the pre-registration to the result, which is the single thing the
  freeze exists to prevent.
- **`CAK`'s anchors have a printed closed form behind them.** `2009.08404v2` p3 Eq. (5) prints
  `A_prism = (0.4 + 0.04|T*−4|³)/(2.2 + 0.04|T*−4|³)`; the project's digitized anchors reproduce it
  to 8.4% worst and under 2% typically (`app/scripts/phase6-libbrecht-closed-forms.mjs`). Further,
  `2306.04042v1` Table 1 p9 prints A1 = 0.25 at −2 °C and 0.2 at −5 °C, matching the dedicated
  measurement papers exactly.
- **`CAK_A1`'s justification is a modelling convenience, not a measurement.** It matches M1's
  documented simplification — "To keep M1 relatively simple, we chose to set 𝐴 = 1 … even though
  our data suggest that this is not entirely accurate for broad prism facets at high temperatures"
  (`2306.13087v1` p6). That is a defensible choice for a starter model and an indefensible one for
  a validation run whose protocol registered the opposite.

**3. The full 204-point sweep re-runs** under `CAK`, per the charter clause quoted above. The
artifacts of `6995868` are superseded, not deleted, and keep the parameter set that produced them.

**4. The expected effect on the headline is recorded HERE, in advance of the re-run.**

All five of the sweep's headline agreements sit at −2 °C, where the throttle is 3.6×. Their swept
aspect ratios and the rise each needs to cross the 0.6667 plate ceiling into `neutral` — which ADR
0025 scores DISAGREE:

| f | AR (`CAK_A1`, as swept) | rise needed to lose the agreement |
|---|---|---|
| 0.10 | 0.1638 | 4.07× |
| 0.15 | 0.2729 | 2.44× |
| 0.25 | 0.3821 | **1.74×** |
| 0.40 | 0.4913 | **1.36×** |
| 0.60 | 0.6004 | **1.11×** |

Two measured calibration probes bracket what a throttle does to AR at the registered conditions:
1.75× → 1.36× rise (−8 °C, AR 0.5789 → 0.7895) and 5.6× → 2.62× rise (−5 °C, AR 0.3821 → 1.0000).
Interpolating, a 3.6× throttle at −2 °C lands near a **1.9–2.2× rise**, which would put the bottom
three rows over the ceiling.

> **Registered prediction: the headline falls from 5/90 to approximately 2/90.**

This is an ESTIMATE from two probe points, not a measurement; only the re-sweep settles it. It is
written down now so that **the parameterization cannot later be chosen by its score**. If the
re-sweep returns a worse number, that is the predicted outcome of adopting the better-provenanced
inputs and is not grounds for revisiting this decision.

## Consequences

**The corrected result is expected to be worse, and that is the point.** A validation whose
headline improves when you fix a defect is pleasant; one whose headline degrades is the case that
tests whether the pre-registration is real. Recording the direction in advance is what makes the
re-sweep an experiment rather than a search.

**The WP5 gate waits for the re-run.** Gating `6995868`'s artifacts would certify evidence whose
parameterization contradicts its own registered protocol. The verifier and the six negative
controls are unaffected in design and can be built against the existing `points.json` schema while
the sweep runs.

**~~The structural finding is untouched, and is not what this ADR is about.~~**

> **CORRECTION 2026-07-29 — this paragraph was wrong and is retracted.** It claimed
> `research/libbrecht-figure-findings.md` established "by three independent routes" that no
> broad-facet parameterization can produce three habit boundaries. An adversarial audit refuted
> both the claim and the independence:
>
> - The "three routes" were **not independent**: crossing-counting and Figure 1 are the same σ₀
>   argument over n = 2 printed forms, and the third was two calibration probes that this very
>   document declares are never citable as gate evidence.
> - The claim itself is **false**. Habit depends on the ordering of `alphaHK = A·exp(−σ₀/σ_surf)`,
>   which carries `A_prism`; the crossing count was computed on σ₀ alone. **`CAK` — the set this ADR
>   registers — has three αHK order swaps for σ_surf ∈ [0.00247, 0.00366], and 2 of the re-sweep's
>   204 points lie inside that band.** So "`CAK` is a broad-facet parameterization, therefore the
>   finding is untouched" does not follow: `CAK` is precisely the set whose `A_prism ≠ 1` breaks the
>   σ₀-crossing/αHK-swap identification the argument assumed.
>
> What survives is narrower and is a statement about the runs, not the model class: along the
> sweep's own constant-`f` ladders the swap count is 1 at f = 0.10 and 0 above, never 3, so **this
> parameterization at these σ_surf values does not reproduce the diagram**.
>
> **The decision this ADR takes is unaffected.** `paramSet` belongs in the freeze list, `CAK` is the
> registered value on provenance grounds, and the re-sweep was required — none of that rested on the
> retracted paragraph. What changes is only how the result may be described.

The re-sweep is expected to reproduce the warm plate regime less well, and **must not be presented
as an attempt to fix the columns or cold-plates bands**.

**`PHASE6_PROTOCOL_SHA256` moves** `9aa2e7c1…` → `8aeb2b80…` (24 freeze rows → 25), with the
previous value retained in the revision list so the freeze keeps a history rather than a
silently-replaced constant. **This is the first amendment that is not free**; every prior revision
was registered pre-sweep and cost nothing.

**The cross-platform control is knocked down, in two ways, and this was not anticipated when the
decision was taken.** Both are recorded because they are costs of this ADR, not incidental
maintenance:

1. **The tier-1 libm digest is re-issued**, `560aeaf7` → `2a9f64b3`. The fingerprint sampled
   `nucleationAPrism` and `alphaHK` at a hard-coded `"CAK_A1"`, under which `nucleationAPrism`
   returns a constant 1 at every temperature — so the control was fingerprinting a code path the
   sweep would not ship and exercised nothing of the A_prism interpolation. It now samples
   `PHASE6_PARAM_SET`. Any arm64 digest recorded against `560aeaf7` is not comparable to the new
   one. **MAC RUN NEEDED**; the arm64 run is not attempted here, per standing instruction.
2. **The tier-2 fixture's two points no longer separate two habit classes.** The control exists to
   catch a habit class flipping between architectures, so its two points must classify
   differently. Under `CAK` the warm point measures AR 1.0000 (neutral, measured probe) and the
   cold point stays near 1.1053 (neutral, since A_prism ≈ 0.968 at (Tm−T) = 15) — **both
   neutral**. `PHASE6_FIXTURE_X64_BASELINE` is therefore emptied and marked pending rather than
   filled with stale `CAK_A1` rows that would look valid, and the old rows are retained under
   `PHASE6_FIXTURE_X64_BASELINE_STALE_CAK_A1` so the comparison keeps a history.

   **The fixture needs new points chosen under `CAK`**, and choosing them is deferred rather than
   done here: picking fixture points after seeing which ones separate classes is the same
   after-the-fact freedom this ADR exists to remove, so it wants its own reasoning and its own
   record. The test was updated to accept the explicitly-empty state and to re-impose the
   two-class requirement the moment any row is populated — the requirement itself is unchanged.

**A class of defect is closed, not just an instance.** Any registered row that a downstream default
can set is exposed to the same failure. The harness must pass every frozen parameter explicitly,
and a preflight assertion that the spawned command line carries them is the durable fix — filed as
follow-on work, since it is a harness change rather than a protocol decision.

## Alternatives considered

**Register `CAK_A1` and amend the interpolation row to match what ran.** Rejected, and it is the
alternative worth naming most explicitly because it is free: it costs no compute, keeps a better
headline, and can be argued from Libbrecht's own simplification. It is still wrong. The registered
scheme predates the runs; changing it to match them after seeing the results converts a
pre-registration into a post-registration, and every subsequent claim of pre-registered validation
in this project would be worth less.

**Keep the result and record the mismatch as a stated limitation.** Rejected. The mismatch is not a
limitation of the evidence, it is a contradiction between the evidence and the protocol that
certifies it. A reader who checks the protocol against the runs finds a discrepancy the report
knew about and shipped anyway.

**Skip the re-sweep because the outcome is structurally bounded anyway.** Rejected. The bound says
no broad-facet set reproduces the diagram; it does not say every broad-facet set produces the same
per-point classes, and the probes show it does not — one point measured at −5 °C moved 0.3821 →
1.0000. The published class matrix, the flip brackets and the per-regime counts are all per-point
quantities, and none of them is currently correct.

> **CORRECTION 2026-08-01 — the structural-bound rationale in this alternative is retracted.** A
> crossing count for `sigma0Basal` and `sigma0Prism` does not bound habit transitions, because habit
> is governed by the full attachment coefficient
> `alphaHK = A * exp(-sigma0 / sigmaSurface)`, including the facet-dependent prefactor `A`. The
> re-sweep still could not be skipped: the executed rows violated the registered `CAK` parameter
> set, the charter required the full sweep to re-run after that frozen input changed, and the
> measured per-point classes did change. Those protocol and measurement reasons reject the
> alternative without invoking the withdrawn theorem.

**Re-sweep only the affected band (−2 to −9 °C) and splice.** Rejected. It would produce a
`points.json` whose rows came from two different parameter sets, which is the merged-report failure
mode the WP5 negative controls exist to catch. ~~The cold rows are bit-identical under either set~~
(11 of 72 differ, max |ΔAR| = 0.1092 — see the correction above), so
the compute saved is real, but a spliced artifact cannot be gated.
