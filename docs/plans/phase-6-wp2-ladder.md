# Plan — Phase 6 WP2 numerical-control ladder (decision-0045 bounded)

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** FROZEN 2026-08-08 pending its pre-execution non-author review; no rung runs first
- **Started:** 2026-08-07
- **Last touched:** 2026-08-08 by Claude Fable 5

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
- Arms: M1 and CAK at every rung (the two historical arms); the ablation arm inherits M1's
  rung verdict as an UNTESTED TRANSFER ASSUMPTION (Rule 11), not a measurement — the ladder
  runs M1 and CAK separately precisely because `paramSet` may matter, so the inheritance is
  recorded as an assumption the verdict carries, never as evidence.
- Check points, frozen by stated rule: **the four points the registered `domain-budgets` row
  already designated for its spot-check, unchanged** — `(−31 °C, f = 0.60)`,
  `(−13 °C, f = 0.15)`, `(−6 °C, f = 0.15)`, `(−27 °C, f = 0.15)`. The rule grants zero
  selection freedom, spans both habit axes and both fraction extremes among historically
  designated points, and makes every ladder comparison continuous with ADR 0037's measured
  history. Both arms (M1 and CAK) run at all four points at every rung.

## Budget and rungs (frozen 2026-08-08 from the closed Stage A data)

- **Size configuration:** seed 17 cells growing to extent 54 at `dxUm = 0.35` (the S1-floor
  seed with the S2-floor measurement span), and its coarse replicate seed 8 → extent 27 at
  `dxUm = 0.7`. The S1-ceiling seed (35 cells) pairs coherently only with ceiling-scale
  extents, which the Stage A closure records as measured-scaling-infeasible; the fine spacing
  0.2333 µm at these sizes (seed 25 → extent 81, N ≥ 128) projects past the per-rung cap by
  the same measured scaling. Both exclusions are cost facts recorded here, and the verdict's
  scope statement names them: **the ladder verdict covers the floor sizes at spacings
  0.7/0.35 µm only.**
- **Domain rungs:** at 0.35 µm — `N = 96, 112, 128` (guard floor 54/0.65 = 83.1; increments
  of 16, the historical convention); at 0.7 µm — `N = 48, 64, 80` (the historical rungs).
  Enumeration order: coarse spacing fully first (cheapest, catches driver defects), then
  0.35 µm rungs ascending. Pass at a spacing requires the registered criterion at BOTH
  successive increments (96→112 and 112→128; 48→64 and 64→80).
- **Auxiliary controls at the base rung** (0.35 µm, N = 96, all four points, both arms):
  `cflFill` halved to 0.05; `relaxTol` tightened to 1e-10; seed radius ±1 cell (16 and 18).
  Same 0.5%/class comparison against the base run.
- **Row count and budget:** 24 domain rows per spacing × 2 spacings = 48, plus 32 auxiliary
  rows = **80 rows total**. Measured anchor: 2.9 h at N = 96 (one point, M1) — a Stage A Dirichlet run, NON-TRANSFERABLE
  (Rule 11): it sizes budgets and caps only and can never enter a verdict; budget ≤ 3
  wall-clock days at recorded concurrency ≤ 12, per-row wall cap **10 h** (one host
  up-window). Rows are scientifically independent and may run concurrently; concurrency is
  recorded execution provenance and no scheduling choice changes a case's PHYSICS — but
  contention can push a row into its wall cap, so a capped row under concurrency is an
  infrastructure fact, and the published report separates every no-pass into criterion,
  infrastructure, or mixed classes so a scheduling exhaustion is never read as a numerics
  failure.
- **Caps and drops:** a wall-capped row is recorded `wall-cap-infrastructure` and treated as
  not-comparable — it can only produce no-pass, never a silent exclusion. If the enumeration
  threatens the 3-day budget, rows drop in pre-declared reverse priority: auxiliary seed-±1
  first, then relaxTol, then cfl (the 0.7 µm N = 80 rung executes third of ten enumeration
  blocks and is unreachable by budget truncation — recorded, review H8). A dropped row is a
  missing row: the evaluator's missing-row list is the drop log, and any drop that removes a
  criterion's data forces no-pass for that criterion.
- **Fixed run configuration, frozen:** every row uses the registered sweep configuration
  except where a rung or control varies it by name — `aggregate-hv-g1h1-v6`,
  `farField = monopole-matched` (the registered §2.4 condition the sweeps executed; the
  Stage A probe's Dirichlet runs were non-transferable and are not comparable),
  `pressurePa = 101325`, `noiseEpsilon = 0`, `rngSeed = 1`, `domain = hexPrism`,
  `divTol = 1e-7`, `relaxMaxSweeps = 200000`, seed thickness `2·seedRadius + 1` (the
  isometric mapping the strata freeze records), step cap `100000` cycles (equal to the
  registered fixture's `steps`), and the `0.65` domain-contact guard.
- **Stop mapping, frozen:** rows stop on the existing `size-target` machinery at the mapped
  extent span (54 or 27). Recorded reason: S2 centrals are floors on half the true maximum
  dimension, and an extent-span stop measures habit at that observable scale with tested
  machinery; the ladder driver is itself a new in-process evidence path, and within it the extent-span
  stop reuses the tested `size-target` semantics, while an attached-count stop would add a
  second new, untested stopping rule. Stage A recorded both quantities; the choice
  was fixed here before any rung ran.
- **The deterministic selection function:** a spacing PASSES iff, at all four points and both
  arms, both successive domain increments satisfy the registered criterion (identical class
  AND attached counts within 0.5%) AND every auxiliary control at the base rung satisfies the
  same comparison. The auxiliary conjunct gates BOTH spacings (the strict reading, fixed here so it cannot be
  re-argued after results). Anything else — any failed comparison, capped row, dropped row,
  or unconverged run — is **no-pass for that spacing**. The published verdict is the per-spacing
  pass/no-pass table plus the scope statement; nothing selects among passing rungs, and a
  pass authorizes no production campaign (decision 0045, stated in advance).

## Out of scope

- Any production-configuration selection or campaign authorization (decision 0045).
- The R15 extrapolation operator, conservative intersection, and WP4 path (closed by 0045).
- Any change to the frozen strata, the recon plan, or historical evidence.

## Tried and rejected

(Inherited: N = 48/64/80 all fail the registered criterion at extent 21 — ADR 0037; the
extent ladder is non-monotone; probes transfer only from the registered configuration,
Rule 11. Append new entries as they occur.)

## Open questions

(Both prior open questions were fixed in the 2026-08-08 freeze above: the stop mapping is the
extent-span `size-target` machinery with its recorded reason, and the four check points are
the registered `domain-budgets` spot-check points, unchanged, by the zero-freedom rule.)
