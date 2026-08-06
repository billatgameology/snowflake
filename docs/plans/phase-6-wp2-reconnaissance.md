# Plan — Phase 6 WP2 reconnaissance: cost, axes, and the third arm (non-transferable)

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-06
- **Last touched:** 2026-08-06 by Claude Fable 5

Bounded pre-registration for the WP2 reconnaissance stage of the
[active plan](phase-6-science-first-completion.md). **Every output of this unit is
NON-TRANSFERABLE (Rule 11):** it estimates feasibility and freezes candidate ladder axes plus
deterministic escalation rules; it cannot select or certify a production geometry, discharge
any domain/grid/timestep adequacy obligation, or enter a gate result.

## Goal

Give the WP2 ladder pre-registration measured inputs it currently lacks: per-row cost at the
frozen WP1 sizes on the recorded Ryzen 9 host (no Phase 6 timing exists on it), the behavior of
the physical→lattice mapping candidates, and a runnable third arm. The frozen WP1 operands are
S1 observed initial radius `[5.8999999999999995, 12.1]` µm and S2 grown mass-equivalent radius
at 300 s `[9.472732790460505, 20.459585775743665]` µm
(`evidence/phase6-size-strata/strata.json`, 18,867 bytes, SHA-256 `aba93698…d0288b6`).

## Done when

The two reconnaissance items of the active plan, verbatim:

> Pre-register a reconnaissance matrix that spans all three intended arms, both habit axes,
> near-threshold and fast-growth cases, and all physical sizes selected in WP1. Reconnaissance
> outputs are explicitly non-transferable.

> Use reconnaissance only to estimate feasibility and freeze candidate axes plus deterministic
> escalation rules. It cannot select or certify a production geometry, discharge
> domain/grid/time adequacy, or enter the gate result.

## Sub-unit A — make the third arm runnable (intended values; WP3 freezes them)

`M1_NO_DIP_ABLATION` exists today only as a resume-codec name. Implement it as a parameter set
under the values the active plan's Goal already states: `sigma0BasalM2Broad`,
`sigma0PrismM2Broad`, and `A_basal = A_prism = 1`, with **every other implemented kinetic
choice identical to M1**. These are the *intended* values; WP3's freeze later binds them with a
manifest-level proof that the only kinetic difference from M1 is replacement of both registered
dip factors by one. Steps:

- Extend `NucleationParamSet`/`NUCLEATION_PARAM_SETS` in `core/src/libbrecht.ts` and every
  dispatch site (the file's own warning records that adding "M1" once left three sites
  uncovered — find the enforcing seam and extend it, not just the type).
- Wire the CLI (`--param-set`) and any validator allow-lists; the GPU path's existing refusals
  stay untouched.
- Tests: a matched-pair differential against M1 proving the only changed outputs are the
  dip-bearing quantities (broad-facet σ₀ branches and the two prefactors), plus a small
  fixed-configuration growth differential showing the three arms produce distinct, finite,
  converged results at one registered point.

## Sub-unit B — the reconnaissance matrix

All runs use the float64 CPU oracle, `aggregate-hv-g1h1-v6`, fixed-σ Dirichlet, noise off,
from a tracked-clean committed snapshot, with per-run live/error/exit logs and recorded
concurrency and commands. Physical→lattice mapping candidates (named here, registered properly
in the ladder pre-registration): `seedCells = round(r_seed / dxUm)` with an isometric compact
hex-prism seed; `targetExtentCells = round(r_meas / dxUm)` (extent is a center-to-tip cell
radius); domain `N` obeying the 65% contact guard with headroom.

**Stage A — cost probe (runs immediately after this plan commits; ≤ 12 runs).** Arm M1 only.
Points: `(−15 °C, middle registered fraction)` and `(−5 °C, middle registered fraction)`.
Configurations at `dxUm = 0.35`: seed 17 cells (S1 floor) growing to extent 27 (S2 floor) at
`N = 64` and `N = 96`; seed 25 cells growing to extent 58 (S2 ceiling) at `N = 128` (and
`N = 96` only if the 65% guard admits it: 58/96 = 0.604). One coarse replicate at
`dxUm = 0.7` (seed 8, extent 14, N 48). Measured outputs: wall-clock, sweeps/cycle, peak RSS,
stop reason. Purpose: calibrate Stage B and the ladder's cost model; nothing else.

**Stage B — habit-axes and size probe (runs only after this unit's non-author review; ≤ 36
runs).** All three arms. Points, all from the registered 204-point grid: one column-regime
(−5 °C), one plate-regime (−15 °C), two near-boundary (−4 °C, −10 °C), one inside the strata
condition domain (−33 °C), each at the middle fraction; plus near-threshold (lowest registered
fraction) and fast-growth (highest registered fraction) at −5 °C and −15 °C. Sizes: S1
floor/ceiling seed mappings crossed with S2 floor/ceiling measurement extents at `dxUm = 0.35`;
one fine-spacing replicate (`dxUm = 0.2333`, the most expensive candidate) at each habit axis
if Stage A's measured costs permit it inside the stage budget below.

**Deterministic escalation and termination.** Per-run wall cap: 3× the largest comparable
Stage A measurement (never the historical 3-hour budget, which a fine-spacing run already
exceeded); a capped run is recorded as infrastructure-terminated, never scientifically
excluded. Stage B's total budget is 7 wall-clock days at recorded concurrency ≤ 12; if the
deterministic enumeration cannot fit, rows are dropped in pre-declared reverse priority
(fine-spacing replicates first, then the −33 °C point's larger size cell), and every drop is
logged by name. No morphology-based pruning: a row is never added, dropped, or rerun because
of the habit it produced.

**Outputs.** A tracked summary artifact under `evidence/phase6-wp2-recon/` (manifest entry,
stamped NON-TRANSFERABLE at creation, echoing per-run configuration, measured cost, stop
reason, convergence and symmetry witnesses, and the exact commands), with raw logs under
`out/` scratch. The unit ends by proposing — not registering — the candidate ladder axes:
spacing rungs, domain increments, timestep halvings, relaxation controls, and the seed-mapping
sensitivity design, each justified only by measured cost and recorded solver behavior.

## Review

One proportionate non-author review (decision 0042) of this pre-registration plus sub-unit A's
code and tests, after Stage A and before any Stage B run. Blocker definition and escalation as
recorded in the active plan. Rule 10 provenance recorded as in WP1, including the model-identity
limits of this harness.

## Out of scope

- Any numerical-adequacy claim, rung selection, or production configuration choice.
- The registered ladder pre-registration itself (a separate reviewed unit, informed by this one).
- R15/WP4 implementation, WP3 freezes, WP6 rows, held-out or GPU work, education.
- Any change to the frozen WP1 artifact, the candidate lock, or historical manifests.

## Tried and rejected

(Append as they occur. Inherited: the extent-15 domain ladder and grid-spacing ladder
non-transferability incidents (Rule 11) are why every output here is stamped at creation.)

## Open questions

- Whether S2's measurement mapping should stop on extent or on attached-cell mass-equivalent
  count — Stage A records both quantities per run so the ladder pre-registration can choose
  with data; nothing here decides it.
- Whether Z = 1 or Z = 2 strata enter the ladder — a WP2-ladder/WP3 decision.
