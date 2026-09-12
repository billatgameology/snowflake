# Phase 6 three-arm narrative comparison — measured-only grade

- **Published:** 2026-08-20 (WP8; the arm-3 review's deferred hardening item H10)
- **Grade of every number in this report:** measured-only. Nothing here is the registered
  ADR 0026 conservative-intersection headline, which every report states as **not computed by
  decision 0045** — never as satisfied, waived-as-if-passed, or replaced by these counts.
- **Bound artifacts (SHA-256 as pinned in `evidence/MANIFEST.json`):**
  arm 1 `phase6-sweep/{points.json 0ed613bc…, report.json 71ae094c…, diagram.svg 40458703…}`;
  arm 2 `phase6-sweep-arm2/{points.json b3fb4616…, report.json 8d02741d…, diagram.svg 9de7a43a…}`;
  arm 3 `phase6-sweep-arm3/{points.json 08ec59ee…, report.json 32d18a1d…, diagram.svg bf229f94…}`;
  numerics `phase6-wp2-ladder/{report.json fd20f701…, rows.jsonl c4fa70f7…}`;
  sizes `phase6-size-strata/strata.json aba93698…`.

## What was compared

Three same-protocol 204-point float64 sweeps over the registered temperature ×
supersaturation-fraction grid, each classifying habit by aspect ratio at the registered
measurement extent (plate ≤ 1/1.5, column ≥ 1.5, else neutral) and scoring against the Nakaya
reference regimes (plates-warm / columns / plates-cold, with the columns-and-plates region
outside headline scope and a ±1.0 °C ambiguity band excluded):

- **Arm 1 — CAK (no-SDAK):** broad-facet CAK parameter family. Scope: 90 points.
- **Arm 2 — M1 (SDAK):** the M1 family, whose basal/prism dip factors are Nakaya-informed
  (provenance class P3). Scope: 78 points (the registered bistable band −4/−5/−6 °C is
  additionally excluded; either pure class counts as agreement inside that band, so it is
  scored separately below and never silently mixed in).
- **Arm 3 — `M1_NO_DIP_ABLATION`:** identical to the executed arm-2 configuration in every
  registered respect except `paramSet` — `sigma0BasalM2Broad`, `sigma0PrismM2Broad`,
  `A_basal = A_prism = 1`. Scope: 78 points, arm-2 rules.

The three arms are reported separately throughout; no-SDAK and SDAK results are never merged.
The common-denominator figures re-score each arm's measured classes under arm 1's frozen
90-point rule — a re-scoring, not a second measurement (ADR 0036).

## Results, agreements and disagreements both stated

| Arm | Arm scope | Common denominator | Neutral | Extent-fragile |
|---|---|---|---|---|
| 1 — CAK | **3/90** | 3/90 | 168 of 204 | 16 |
| 2 — M1 | **54/78** | **54/90** | 119 of 204 | 33 |
| 3 — ablation | **5/78** | **5/90** | 155 of 204 | 24 |

Per-regime agreement (each arm's own scope; agree / scored):

| Regime | Arm 1 CAK | Arm 2 M1 | Arm 3 ablation |
|---|---|---|---|
| plates-warm (T > −3.3 °C) | 3/6 | 5/6 | 5/6 |
| columns (−9.9 < T ≤ −3.3 °C) | **0/24** | **0/12** | **0/12** |
| plates-cold (−21.5 < T ≤ −9.9 °C) | 0/60 | **49/60** | 0/60 |

**Agreements.** Arm 2 (M1) agrees at 49 of 60 plates-cold points and 5 of 6 plates-warm
points. Arms 1 and 3 agree only in plates-warm (3/6 and 5/6 respectively). In the excluded
bistable band (18 points), arm 2 agrees at 0 (all 18 neutral) while arm 3 records 11
non-neutral rows, all plates — and in that band the registered rule accepts either pure
class, so any non-neutral row agrees by construction; those 11 are not evidence of selective
skill.

**Disagreements.** No arm produces a single columns-regime agreement: 0/24, 0/12, and 0/12.
The model, under every implemented parameter family, fails to produce the column habit where
Nakaya's diagram requires it. Arm 1 and arm 3 additionally fail the entire plates-cold
regime (0/60 each); most of their grid is neutral (168 and 155 of 204 rows) — crystals that
never leave the neutral aspect-ratio band at the registered measurement extent.

**The matched ablation contrast.** Replacing only the two M1 dip factors by one collapses
agreement 54/90 → 5/90 (common denominator): the plates-cold agreement of M1 is carried by
the implemented dip factors. This is an implementation-level statement about this solver
under the frozen configuration. It **cannot establish physical SDAK causality or necessity
in nature**, and because M1's dip functional forms and placement are Nakaya-informed (P3),
arm 2's agreement with Nakaya is in-sample reproduction, not independent validation.

## The accepted failure, stated as the charter requires

The model's temperature-versus-supersaturation morphology diagram does not reproduce
Nakaya's. The plate → column → plate transition sequence is not reproduced by any arm: the
columns regime records zero agreements under every implemented parameter family, and only
the Nakaya-informed M1 family recovers the cold-plates regime. The maker accepts this
negative result as a finding about the model, reported at measured-only grade — and
`GGThreshold` still ships a beautiful crystal (Phase 2a).

## Numerical limits that bound every number above

- **The registered numerics verdict is NO-PASS** (`phase6-wp2-ladder/report.json`: overall
  no-pass, class criterion, both spacings). Attached-cell counts fail the registered 0.5%
  agreement at 5/16 coarse-domain, 6/16 fine-domain, and 17/32 auxiliary check points, and
  a ±1-cell seed perturbation moves the count observable by up to 9.285%. The sweeps' grid
  resolutions are therefore published as not converged; every tally above carries that
  caveat.
- **Scope of the numerics verdict:** floor sizes only (seed 17 → extent 54 at 0.35 µm;
  seed 8 → extent 27 at 0.7 µm) at the four registered check points; the S1-ceiling seed,
  S2-ceiling extent, and the 0.2333 µm spacing are excluded as measured-scaling-infeasible;
  the S2-ceiling stratum's numerics are UNVERIFIED. A pass would have authorized no
  production campaign (decision 0045). Arm 3 inherits M1's rung verdict as an untested
  transfer assumption (Rule 11), not a measurement.
- **Measurement-extent sensitivity:** the sweeps classify habit at extent 21; the registered
  domain spot-check moved attached counts by ~2.5% between N = 48 and N = 64 at that extent,
  and the extent-fragile tallies (16 / 33 / 24 rows within 0.135 of a class threshold) mark
  rows whose class could plausibly move under resolution changes.
- **Host provenance limit:** the historical arm artifacts lack artifact-level host fields
  and remain measured-only evidence with that stated limit.

## Closure and deferral labels this report carries

- ADR 0026's conservative-intersection headline, the R15 production evidence path, and the
  full three-arm production campaign are **closed as not computed by decision 0045**.
- The held-out validation families (decision 0043) and the preview-GPU cohort (decision
  0044) are deferred to named Phase 7 ownership; they are not executed, not passed, not
  waived, and earn no Phase 6 credit.
- No Phase 6 evidence label is upgraded to quantitatively validated; the phase closes with
  zero quantitative-validation claims.
