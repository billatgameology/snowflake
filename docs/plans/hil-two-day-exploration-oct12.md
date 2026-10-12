# Plan — HIL two-day exploration

- **Phase:** active Phase 10 model development; charter sections 2.5 and 3.2, accepted ADRs 0011, 0055, 0060 and 0062.
- **Status:** maker approved launch; protocol frozen before implementation.
- **Started / last touched:** 2026-10-12 by Codex/GPT-6.
- **Authority:** maker chose to keep the four warm runs active and requested useful parallel exploration for roughly the next two days. After reviewing the 192-case scope and 43/54-hour planning scenarios, the maker directed “proceed with new wave.”

## Goal and done when

Solo scientific research; hostile actors excluded. Select a finite, useful queue beside the four
warm workers using completed October 11 results and actual execution costs. This proposal's
deliverable is 192 explicitly defined comparisons with a reproducible planning estimate and
known limits. The shortest meaningful check is row-count/operand reconciliation against the
completed controls and a calculation from recorded attempt durations; no simulation is needed
to make this selection. It does not complete the Phase 10 milestone, whose criterion remains:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

## Registered finite comparisons

Each table row is its own Cartesian product. Four facet arms means both, neither, basal-only and
prism-only under explicit experimental identity; ordinary preparations means M1 and
M1_NO_DIP_ABLATION. Fraction means the existing water-saturation-table multiplier, not absolute
supersaturation. Every new row gets a new identity and output directory; completed rows stay frozen.

| Block | Exact operands | New rows | Question |
|---|---|---:|---|
| Cold tail | T = -17.5/-18.5/-19.5/-20.5 C; fractions 0.10/0.15/0.20; four facet arms; CFL 0.05 | 48 | Where does the sampled core/tip contrast disappear or return as forcing changes? |
| Cold forcing and timestep | T = -20 C; fraction 0.125 at CFL 0.05; fractions 0.10/0.125/0.15 at CFL 0.025; four arms | 16 | Does the forcing-sensitive one-cell contrast survive a smaller fill step? |
| Seed response | T = -6.5/-9.5 C at fractions 0.10/0.20, plus T = -7.5/-8.5 C at fraction 0.15; seeds radius/thickness 3/1 and 1/5; four arms; CFL 0.05 | 48 | How do forcing and temperature change the dependence of new axial/lateral growth on the starting seed? |
| History timestep | Both directions -6 to -14.4 C; fractions 0.10/0.20; switch extents 7/11/15; both ordinary preparations; CFL 0.025 = 24 histories. Add both temperatures x both fractions x both preparations = 8 statics | 32 | Do later-growth equalization and switch-stage contrasts survive smaller updates? |
| Pressure and history | Both directions -6 to -14.4 C; fractions 0.10/0.20; switch extents 7/15; both ordinary preparations; pressures 50662.5/202650 Pa; CFL 0.05 = 32 histories. Add both temperatures x both fractions x both preparations x both pressures = 16 statics | 48 | Does transport pressure change growth after an environment change? |

Total **192**. Shared N64, dx 0.35 um, maximum extent **29** (9.8 um maximum center span),
maximum 20000 completed updates, seed 2/1 except the seed block, pressure 101325 Pa except the
pressure block, aggregate-v6 / monopole-matched / hexPrism, PRNG seed one and zero noise.
Retain residual/divergence tolerances 1e-9/1e-7, 200000 maximum relaxation sweeps, dense odd
spatial crossings 5 through 27 and existing per-update records. Each ordinary history has exactly
one extent-triggered temperature change with its fraction retained. Never mix facet interventions
with environment events. Reuse existing controls only after source and scientific-prefix checks.

## Selection evidence and readout

Concise records are in `evidence/hil-two-day-design-2026-10-12/`; they bind the detailed calculations
under primary `out/hil-two-day-design-2026-10-12/` and the retained execution worktrees.

Cold: at tip eight and half the shortest common plateau, the -20 C contrast changes from gaps
0/0/0/0 at fraction 0.10 to 0/0/1/1 at 0.15, in neither/basal-only/prism-only/both order. Localize
this feature and test its timestep sensitivity. Compare integer core/tip radii and ring occupancy
at multiple shared tip stages, plateau ages and separately absolute physical ages, retaining
adjacent-event brackets. A one-cell difference is not a grid-independent finding.

Seed: the saved common-age comparisons identify basal-associated axial enhancement near -6.5 C
and prism-associated axial suppression near -9.5 C. Compare actual new axial/lateral spans and
occupied-cell additions, not inherited seed spans or terminal aspect ratio alone. These seeds
also differ in volume, surface and diffusion environment; their response does not isolate shape
as a physical cause. Do not reuse old CFL 0.1 seed rows as CFL 0.05 controls.

History: in the October 11 warming comparisons, later-half M1 axial additions agree across
switches 7/11/15 within each observed forcing window (10/10/10 lattice layers at fraction 0.10;
8/8/8 at 0.20). This does not mean all memory vanished: other quantities and stages differ.
Compare new axial/lateral/occupied-cell increments at common post-switch ages, separate early
and later windows, and retain adjacent-event brackets. Trigger-cycle attachments precede the
environment change. The new pressure block tests a history interaction; the prior static
pressure timestep comparison already preserved its forcing-dependent occupancy ordering.

Selection used existing event reconstruction, operational row checks and bracket definitions.
Codex/GPT-6 agents shared context; no independent physical validation, spatial-field review,
grid/domain qualification or full registered interpretation was completed. Eighteen ordinary
source-static history prefixes were checked equal; the six using experimental October 10
statics still require their registered compatibility checks before a complete readout claim.

## Explicit time and worker budget

The completed 102-row queue used **227.706 worker wall-hours** in **19.914 elapsed hours** with
twelve slots. Its observed occupied-slot fraction was 0.952895; this is not CPU utilization.
The selected budget uses each matching block's measured mean and the recorded CFL 0.025 cold
mean. History timestep cost is budgeted at **twice** the ordinary history/static
means; that factor is an assumption, not a measured history scaling law. Pressure-history costs
use ordinary history/static means and likewise remain uncertain under changed pressure.

The resulting estimate is **494.710 worker-hours / (12 x 0.952895) = 43.264 elapsed hours**.
A separately stated **25% slowdown scenario gives 54.080 hours**. These are planning scenarios,
not confidence bounds; new trajectories or uneven tails can take longer. The proposal targets
roughly two days, and does not promise completion within 48 hours. Exact inputs and formula are
in the selected-budget and operational-summary records. The maker sees this uncertainty before launch.

Use **twelve new workers plus the four continuing warm workers**, on HIL. The October 12 09:08
PDT observation found all four advancing, about 45.60 GiB available memory and 51.58 GiB commit
headroom. Retain existing 12 GiB available-RAM / 8 GiB commit guards; no new capacity ladder.
The old timing already includes four warm workers, but exact contention remains variable.
No BLD dispatch or increase above sixteen total workers is proposed.

At the first substantive progress review, compare completed block costs against these named
assumptions and state any expected overrun plainly. Do not quietly replace the estimate with
repeated "another day" claims. No automatic wall stop: scientific size targets, distinct failure
dispositions and completed-cycle resumability remain. Interleave matched groups so several
questions become reviewable early; do not expand the queue after launch without a new decision.

## Implementation, checks and retention after selection

Before implementation, commit the approved protocol and refresh its bounded source-currency
check. Inspect existing worktrees; preserve fixed producers and useful local output. Use one
new task checkout for this finite roster because the existing execution checkouts own frozen runs.
The only implementation needed is a finite roster, a thin `runHilOperationalBatch` entry and
focused roster/routing tests. Existing queue, leases, guards, numerical worker, observations,
readouts and discovery-resume-v1 state stay unchanged. Register exact launch/pause/resume
commands and separate coordinator/worker stdout/stderr/exit paths before starting workers.

Rule 14A: accidental wrong roster/source or duplicate writers can corrupt results; existing
identity, lease and resume checks already address that boundary. No new infrastructure is needed.
Lessons C2/C3/C6 and E5 govern matched readouts; the October 12 warm planning gap governs cost
communication. Checks do not remove the need for interpretation judgment.

For the isolated roster/orchestration surface, use focused roster/queue/resume tests, both
typechecks, Rule 7 and applicable metadata checks, plus one bounded review. Escalate Rule 6 only
if scientific calculation, readout or state behavior changes. The existing real N64 pause/resume
witness applies while that contract stays unchanged. Preserve current and previous completed
cycle generations; an interrupted relaxation may be replayed. No old checkpoint target extension.

Bulk outputs stay local during execution and then follow Rule 15 / ADRs 0051 and 0061 for governed
NAS publication and fresh recovery before checkout closure. Git stores concise records and code.
No output pruning or closure is part of selecting this batch.

## Steps

Proposal-record verification: `npx.cmd vitest run runner/test/evidence-integrity.test.ts
runner/test/progress-index.test.ts` passed 18 tests, exit zero; `npm.cmd run lint:rule7` passed,
exit zero. Logs are primary `out/hil-two-day-design-2026-10-12/{metadata-check,rule7-check}.log`.
The scoped diff check passed. These are metadata/prose checks, not implementation qualification
or a scientific-gate result; no solver or capacity run was performed.

- [x] Read completed results and recorded cost; select exact finite comparisons and timing scenarios.
- [x] Maker approved the 192-case scope and explicit timing uncertainty.
- [ ] Commit approved protocol, implement the small roster/entry, check and publish fixed producer.
- [ ] Launch twelve new workers, verify actual checkpoints and preserve the four warm workers.
- [ ] Reconcile terminal dispositions, execute registered readouts and preserve results on NAS.

## Out of scope

N126/grid refinement, larger targets, new physical laws, new source acquisition, experimental
facet/history mixing, GPU or Phase 7 work, gate/validation claims, automatic fan-out and BLD dispatch.

## Tried and rejected

- Fill 48 hours by repeating arbitrary settings: select matched questions from completed data instead.
- Another static pressure grid: its timestep question has already been addressed; the selected
  pressure block asks a new interaction with environment history and carries its own controls.
- Larger/finer cases on the N64 cost estimate: the warm run illustrates why that extrapolation fails.
- Arbitrary 48-hour termination: checkpoint recovery preserves finite scientific targets.
- Extra flank-temperature histories (-5/-12 and -8/-16) remain an unselected option. The chosen
  timestep and pressure interactions have clearer immediate discriminatory value.

## Open question

Approve this finite scope with the explicit 43-hour planning estimate and 54-hour slowdown
scenario, or reduce breadth before implementation. The four existing warm workers continue.

## Launch protocol frozen — 2026-10-12

Branch `codex/hil-two-day-oct12`, checkout
`C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake`, starts at `825c9d1`.
The other four execution checkouts retain their fixed producers and useful outputs. Live state
after launch is written in primary, keeping this executing source clean and fixed.

New IDs use `oct12-hil-` and identify block, temperature, fraction, event/seed/pressure and CFL
where applicable. Preserve complete facet quartet order both/neither/basal-only/prism-only and
ordinary pair order m1/nodip. Interleave groups in this order: cold tail, seed, history timestep,
history timestep static, pressure history, pressure static, cold forcing/timestep; repeat until
all groups are queued. No conditions are selected dynamically after results arrive.

The frozen source-currency check on October 12 reopened the official version histories for
[TAX2](https://arxiv.org/abs/2306.13087) (v1),
[CM9](https://arxiv.org/abs/2011.02353) (v1), and
[CM4](https://arxiv.org/abs/1512.03389) (v2), and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No superseding growth source was identified in this bounded refresh relative to the October 11
check; the later listed 2025 items concern teaching-lab experiments. No adopted parameter,
interpolation, physical model or source claim changes.

From the fixed checkout, after setting the process-only Windows module path:

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-two-day-oct12-main.ts launch HIL out/hil-two-day-oct12
node runner/src/hil-two-day-oct12-main.ts resume HIL out/hil-two-day-oct12
node runner/src/hil-two-day-oct12-main.ts summarize out/hil-two-day-oct12
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-two-day-oct12-control/stop-hil.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-two-day-oct12-control/start-hil.ps1 -Mode resume
```

Use the existing exact-path hidden wrapper pattern with fresh coordinator stdout/stderr, invocation
and actual-exit receipts. Per-row attempt logs are `out/hil-two-day-oct12/rows/<id>/attempts/initial/`;
restart state is under each row's `resume/`. Stop targets only this campaign, never warm workers.
Launch is done when focused checks and both typechecks pass, one bounded non-author review has no
unresolved claim-changing issue, twelve workers have completed-cycle checkpoints, and all four
warm CPU clocks still advance. Endpoints and the registered scientific readout come later.
