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
in the ladder pre-registration; **corrected 2026-08-06 — see Tried and rejected**):
`solver.largestExtent()` is the max per-axis index SPAN `(max − min + 1)` in cells
(`solver-cpu/src/lk-solver.ts:2161`), so a physical radius r maps to
`targetExtentCells ≈ round(2·r / dxUm)`; the seed is an isometric compact hex prism with
`seedRadiusCells = round(r_seed / dxUm)` and thickness `2·seedRadiusCells + 1` layers (equal
z-span and in-plane span); domain `N` obeys the 65% contact guard `extent ≤ 0.65·N` with
headroom. The historical "extent 21" rows are 21-cell spans (7.35 µm across at 0.35 µm).

**Stage A — cost probe (runs immediately after this plan commits; ≤ 12 runs).** Arm M1 only.
Points: `(−15 °C, f = 0.25)` and `(−5 °C, f = 0.25)` — 0.25 is the third of the six registered
fractions, the deterministic "middle". Configurations (corrected to span semantics) at
`dxUm = 0.35`: seed 17 cells (S1 floor) growing to extent 54 (S2 floor span) at `N = 96` and
`N = 128`; seed 35 cells (S1 ceiling) growing to extent 117 (S2 ceiling span) at `N = 192` and
`N = 256`. One coarse replicate at `dxUm = 0.7` (seed 8, extent 27, N 48). Per-row wall cap
12 h; a capped row is recorded as infrastructure-terminated and is itself a decisive
feasibility datum. **Pre-declared 2026-08-07, before any ceiling row had run:** if both
−15 °C ceiling rows stop at the wall cap, their −5 °C twins are recorded as
`skipped-predictably-capped` by name — a cap datum does not need a second 12 h confirmation
inside decision 0045's envelope. Measured outputs: wall-clock, sweeps/cycle, peak RSS,
attached count at the stop, stop reason. Purpose: calibrate the ladder's cost model; nothing
else.

**Stage A closure amendment (2026-08-07, recorded before the ladder freeze consumes it).**
Stage A closes with two completed rows plus measured scaling observations, under the maker's
efficiency-with-integrity direction and the host's overnight-shutdown pattern (a 6–12 h serial
row cannot survive the up-window; the in-flight `A2-floor-n128@-15C` row was lost to
interruptions three times — merge, shutdown, shutdown — without ever completing). Measured, all
NON-TRANSFERABLE: `A5-coarse@-15C` 163.2 s (size-target, extent 27, AR 0.8930);
`A1-floor-n96@-15C` 10,472.8 s / 154 cycles / 587,206 sweeps (size-target, extent 55,
AR 0.8367, RSS 0.30 GB); `A2-floor-n128` first-relaxation cost measured three times at
546–561 s versus A1's 119 s (a ×4.6 per-cycle domain ratio at ×2.37 cell count), projecting
6–12 h serial for the full row. The ceiling rows (extent 117 at N = 192/256) are closed
unexecuted as measured-scaling-infeasible: ≥ ×2.2 cycles at ≥ ×3.4–8 per-cycle cost over A1
projects ≥ day-scale per row, unaffordable inside the envelope; the pre-declared −5 °C twin
rule generalizes to them. Consequences for the ladder, recorded here so the freeze cannot
soften them silently: (1) the ladder registers domain rungs at the S1/S2-floor sizes only,
with per-rung wall caps ≤ 10 h so a rung fits one host up-window; (2) the S2-ceiling stratum's
numerics are UNVERIFIED and every report says so — the ladder verdict is scoped to the sizes
it affords; (3) the twin-skip rule and this closure are cost decisions under decision 0045
that never touch a validity criterion.

**Stage B — CLOSED UNEXECUTED by decision 0045 (2026-08-06).** The maker's bounded-closure
direction ends the production campaign this stage was meant to scope; Stage A completes as the
ladder's cost input, and the unit's one non-author review covers sub-unit A, Stage A's results,
and this rescope. The original registration is retained below as history only.

**Stage B (historical registration) — habit-axes and size probe (runs only after this unit's
non-author review; ≤ 36 runs).** All three arms. Points, all from the registered 204-point grid: one column-regime
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

**Assume `largestExtent()` is a center-to-tip cell radius.** Refuted 2026-08-06 by the first
two probe rows and then by the code: the A5 seed (radius 8, 17 layers) reported
`attached = 3689` — exactly the seed's own site count — with `extent = 17`, and
`lk-solver.ts:2161` computes the max per-axis index span. The original Stage A configurations
(extent 27/58 at `dxUm = 0.35`) therefore targeted spans HALF the frozen S2 sizes, and the
driver's contact guard double-counted the span and fired on the seed itself. Both affected
rows executed zero growth cycles; they are preserved unlabeled-invalid at
`out/phase6-wp2-recon/stage-a/rows-invalid-20260806-extent-semantics.jsonl` and excluded from
all use. The span semantics also reconcile the historical records: extent 21 at `N = 48` is
the recorded 0.4375 ratio, and ADR 0026's extent-42 rung sits in a 96³ box.

(Append as they occur. Inherited: the extent-15 domain ladder and grid-spacing ladder
non-transferability incidents (Rule 11) are why every output here is stamped at creation.)

## Open questions

- Whether S2's measurement mapping should stop on extent or on attached-cell mass-equivalent
  count — Stage A records both quantities per run so the ladder pre-registration can choose
  with data; nothing here decides it.
- Whether Z = 1 or Z = 2 strata enter the ladder — a WP2-ladder/WP3 decision.
