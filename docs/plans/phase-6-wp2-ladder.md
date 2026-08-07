# Plan — Phase 6 WP2 numerical-control ladder (decision-0045 bounded)

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** DRAFT — awaiting Stage A cost data; freezes (and is reviewed) before any rung runs
- **Started:** 2026-08-07
- **Last touched:** 2026-08-07 by Claude Fable 5

The budget-capped numerical-control ladder that decision 0045 retains. Its outcome — pass or
no-pass — is the registered numerics verdict attached to every measured-only Phase 6 result.
**A pass authorizes no production campaign** (decision 0045 item 2, stated in advance). No
value in this file may be tuned after any rung's morphology is seen.

## Done when

The ladder either (a) identifies, by the pre-registered criteria and selection function alone,
a configuration at the frozen strata sizes whose registered checks all pass, or (b) exhausts
its registered rungs or its budget and publishes the no-pass with every rung's evidence under
`evidence/`. Both outcomes complete WP2 under decision 0045. The unit has one proportionate
non-author review of this frozen pre-registration BEFORE execution, and the published result
is independently re-derived from the artifact bytes.

## Registered criteria (inherited, not new)

- **Domain adequacy** (the registered `PHASE6_DOMAIN_SPOT_CHECK` criterion): identical habit
  class AND attached-cell counts within 0.5% between successive registered domain rungs; a
  size passes when two successive increments pass.
- **Timestep control:** halve `cflFill` at the registered check points; same 0.5%/class
  comparison against the unhalved run.
- **Relaxation control:** tighten `relaxTol` one decade at the registered check points; same
  comparison.
- **Spacing sensitivity:** the registered spacings 0.7 / 0.35 / 0.2333 µm at the check points,
  reported as measured sensitivity (no extrapolation operator — R15's production application
  is closed by decision 0045; `phase6FitGridExtrapolation` stays uncalled).
- **Seed-mapping sensitivity:** ±1 cell on the mapped seed radius at the check points.

## Frozen inputs

- Sizes: the frozen WP1 strata (`evidence/phase6-size-strata/strata.json`, SHA-256
  `aba93698…d0288b6`): S1 seed radii mapped `round(r_seed/dxUm)` cells; S2 measurement spans
  mapped `round(2·r_meas/dxUm)` cells (span semantics per the recon plan's corrected mapping).
- Arms: M1 and CAK at every rung (the two historical arms); the ablation arm inherits the
  verdict of its identical-but-paramSet configuration and is not separately laddered
  (decision 0045's sweep is arm-2-identical, so M1's rungs govern it; recorded as an explicit
  inheritance claim, not a measurement).
- Check points: four registered grid points spanning both habit axes and both fraction
  extremes — exact list TO BE FROZEN here before review, chosen from the registered 204-point
  grid by a stated rule (not by outcome).

## Budget and rungs (TO BE FILLED from the Stage A artifact before freeze)

- Total ladder budget: ≤ N core-hours / ≤ M wall-clock days at recorded concurrency ≤ C,
  derived from measured Stage A per-row costs and decision 0045's envelope; hard numbers
  frozen here before review.
- Domain rungs per size/spacing: starting N from the 65% guard with headroom; increments of
  registered size; enumeration order and per-row wall caps frozen from Stage A data.
- Deterministic drop order if the enumeration exceeds budget, and the rule that a dropped or
  capped rung is an infrastructure fact, never a scientific exclusion.
- The deterministic selection function: pass requires every retained criterion at two
  successive domain rungs; anything else is no-pass. No author or reviewer choice among
  passing rungs.

## Out of scope

- Any production-configuration selection or campaign authorization (decision 0045).
- The R15 extrapolation operator, conservative intersection, and WP4 path (closed by 0045).
- Any change to the frozen strata, the recon plan, or historical evidence.

## Tried and rejected

(Inherited: N = 48/64/80 all fail the registered criterion at extent 21 — ADR 0037; the
extent ladder is non-monotone; probes transfer only from the registered configuration,
Rule 11. Append new entries as they occur.)

## Open questions

- Whether the S2 measurement mapping stops on extent or attached-count mass-equivalent — to be
  fixed here from Stage A's recorded per-cycle data before freeze.
- The exact four check points and their stated selection rule.
