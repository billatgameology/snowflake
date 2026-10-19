# Plan — HIL facet attribution and pressure/history timestep comparison

- **Phase:** active Phase 10 exploration; charter sections 2.5 and 3.2, accepted ADRs 0011, 0055, 0060 and 0062.
- **Status:** twelve workers launched and checkpointing; four earlier workers continue.
- **Started / last touched:** 2026-10-19 by Codex/GPT-6.
- **Authority:** maker: "ok, proceed with all 12 runs on HIL. Keep them resumable with no time limit, and let the current runs continue."
- **Branch / checkout:** `codex/hil-facet-pressure-oct19`, `C:/Users/biao3/.codex/worktrees/hil-facet-pressure-oct19/snowflake`, from `12219f5`.

## Goal

Launch twelve finite, resumable cases on HIL: four missing facet preparations to explain the
seed comparison's surviving net axial contrast, and eight pressure/history cases to test the
selected warming contrast at smaller updates. Keep the two cold and two warm workers running.
Solo scientific research; hostile actors excluded. The vertical deliverable is twelve workers
with completed-cycle restart state, using the existing numerical worker and coordinator.
The [preceding readout](hil-domain-seed-oct19.md#registered-seed-readout-and-follow-up-options--2026-10-19)
and `evidence/hil-facet-pressure-2026-10-19/design/` retain the selection and cost basis.

## Done when

The charter's broader Phase 10 criterion remains:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

This dispatch is complete when the committed twelve-row roster passes focused operand/routing,
queue/resume checks and both typechecks, one bounded review has no claim-changing blocker,
all twelve workers save a nonzero completed-cycle checkpoint, and the four existing workers
continue advancing or independently finish. Scientific completion later needs terminal
dispositions, the matched readouts below and NAS preservation/fresh recovery before closure.
Launch is not scientific completion or a phase gate.

## Frozen finite roster and controls

| Block | Count | Conditions | Seed radius/thickness | Preparation |
|---|---:|---|---|---|
| Facet attribution | 4 | -6.5/-9.5 C, fraction .15, pressure 101325 Pa | 3/1 | basal-only/prism-only explicit facet opt-in |
| Warming histories | 4 | -14.4 to -6 C, fraction .20, pressures 50662.5/202650 Pa, switch extents 7/15 | 2/1 | ordinary M1 |
| Matching statics | 4 | -14.4/-6 C, fraction .20, pressures 50662.5/202650 Pa | 2/1 | ordinary M1 |

All cases: N64, dx .35 um, fill CFL .025, target largest extent29 (9.8 um center span),
maximum 20000 completed updates, aggregate-hv-g1h1-v6, monopole-matched hexPrism, zero noise,
PRNG seed1, residual tolerance 1e-9, divergence tolerance 1e-7, maximum 200000 relaxation sweeps.
Use `phase6SigmaWaterFromTable(tempC) * fraction` for initial and destination forcing, without
rounded substitutes. Pressure is fixed throughout each history. Histories have exactly one
abrupt extent-triggered event; never combine them with experimental facet identity. Preserve
complete-cycle events and spatial pre-update crossings at odd extents5 through27.

Copy each exact retained control row, changing only ID and CFL from .05 to .025. Facet IDs are
`oct19-hil-facet-step-t<6p5|9p5>-f0p15-r3-h1-cfl0p025-<basal-only|prism-only>`;
controls are `oct11-hil-seed-t<6p5|9p5>-f0p15-r3-h1-<arm>` (producer `5a00e901`).
Pressure IDs replace `oct12-hil-pressure-` in their controls with `oct19-hil-pressure-step-`
and append `-cfl0p025`. Exact control patterns (producer `0161a512`):

- `oct12-hil-pressure-history-t14p4-to-t6-f0p2-e<7|15>-p<50662p5|202650>-m1`.
- `oct12-hil-pressure-static-t<14p4|6>-f0p2-p<50662p5|202650>-m1`.

Order: facet temperatures -6.5/-9.5, basal-only/prism-only; then pressure50662.5/202650,
within each pressure histories switch7/15 followed by statics -14.4/-6. All twelve start in
one twelve-slot wave; no conditional additions. Finite size/step, contact and convergence
rules remain. A resource pause/failure is unfinished work, not an absent-effect finding.
There is no elapsed-time scientific stop, production timeout or target extension.

## Registered readout

Use existing `summarizeFirstBatchRow`/`checkFirstBatchRow` for endpoint convergence, ledger,
fill-CFL, symmetry and terminal agreement; read complete published trajectories only.
Reuse `seed/analyze.mjs` and `history-pressure/readout.mjs` from the October 18 review for
coordinate reconstruction, seed subtraction, physical-age brackets, window increments and
contrasts. No interpolation of occupancy or new metric library is required.

Facet: compare sixteen rows (two temperatures, four preparations, two CFL settings), reusing
the four completed wide-seed both/neither .025 rows from producer `ff7b1a88` and eight .05
October 11 rows. At .25/.5/.75/1 of the minimum terminal physical age across all sixteen,
compute cumulative and consecutive-window new axial/lateral spans and occupied-site additions.
Also reproduce 16.6289686258 s if covered by all rows; otherwise explicitly mark unavailable.
At each temperature/CFL compare basal-only minus neither, prism-only minus neither,
both minus neither, both minus basal-only and both minus prism-only. Retain adjacent-event
alternatives and actual endpoint ages. Do not assume contributions add linearly. Persistence
of opposing axial contributions strengthens this implementation-level explanation; a reversal,
bracket ambiguity or window dependence limits it. The previously sensitive occupied-count
quantity must not inherit axial timestep qualification. This block qualifies only the wide seed.

History: compare twelve ordinary M1 warming histories, three pressures (including existing
101325 Pa controls) by two CFL settings by switch extents7/15, at fraction .20. Set D to the
minimum available post-event physical duration across those twelve histories, recomputed from
terminal and fired-event records. Compare full, first/second half and successive quarter-window
increments, retaining the same adjacent-event alternatives. Within each pressure/CFL compute
early minus late; compare pressures within switch/CFL and CFL within pressure/switch. Do not
inherit the old 7.5696 s window or .70 um conclusion; window dependence is part of the result.
Normal-pressure controls are `oct11-hil-history-t14p4-to-t6-f0p2-e<7|15>-m1`,
`oct11-hil-static-t<14p4|6>-f0p2-m1`,
`oct12-hil-history-step-t14p4-to-t6-f0p2-e<7|15>-cfl0p025-m1` and
`oct12-hil-static-step-t<14p4|6>-f0p2-cfl0p025-m1`. Verify exact spec/source compatibility.

For every history, compare its scientific prefix through the trigger cycle with the matching
source static under the same pressure/CFL; trigger-cycle attachment occurs before the event.
Use destination-static growth over age0..D as a labeled reference with a different inherited
geometry. Continuing source-static windows at eventAge..eventAge+D require actual coverage;
report unavailable windows instead of extrapolating or changing D to conceal them. Check
coverage before calling the existing `window()`, which otherwise clamps to the terminal state.
Source-prefix equality is within the same pressure/CFL, not across different CFL settings. These are
history comparisons, not physical memory erasure, pressure universality or validation.
Endpoint/checker failures remain explicit missing comparisons. Proportionate internal skeptical
interpretation is required under Rules13/14; no new scientific gate is created.

## Resources, cost and recovery

Historical four facet controls total8.9921602778 worker-hours, longest2.8511152778 hours;
eight pressure controls total11.7071125, longest1.9105494444 hours. Assuming twice the cost
for CFL halving plus25% gives respective longest-case scenarios7.1277881944/4.7763736111 hours.
These are assumptions, not bounds or deadlines; changed convergence and contention can overrun
them. Do not divide summed hours by slots to manufacture an ETA. At the first substantive
review compare completed costs with these named scenarios and report a possible overrun plainly.

The 16:35:55 PDT read-only preflight found47.8139 GiB available RAM,50.2911 GiB commit headroom,
3.102 TiB local free space and marked NAS at z:/. All four existing workers advance CPU with
converged checkpoints and empty error arrays/stderr. New budget: twelve N64 workers plus two
N96 cold and two N126 warm workers, sixteen science workers total. Existing12 GiB available
RAM/8 GiB commit-headroom guards stay. This uses existing capacity evidence and a current
resource observation; no new capacity ladder, BLD dispatch or mature-cost guarantee.

ADR0060 initialization and every-complete-cycle checkpoints retain current and previous
generations. An interrupted elliptic solve repeats from its preceding completed boundary.
Reuse the actual N64 constant-environment basal-only interruption/resume witness and existing
timeline/cutoff equality tests (including event splits in both temperature directions);
verify unchanged worker/core/solver/checkpoint semantics. Do not repeat the restart experiment
merely because the roster is new. Keep the producer checkout clean/fixed and runtime/host bound.
The existing cold producer `ff7b1a8` and warm producer `838c294` and their processes are untouched.

## Implementation, checks and commands

Commit this protocol before adding `hil-facet-pressure-oct19-{roster,main}.ts` and its focused
test. Reuse `runHilOperationalBatch`, existing leases, logging, guards and recovery. Rule14A:
accidental wrong operands, duplicate writers and mismatched restart can corrupt this comparison;
existing boundaries cover these. Add only the roster operand/routing check; no new framework.
Lessons A3/E4 govern exclusive writers/restart; C2/C3/C6/E5 govern matched controls, measured
scope and executable readouts. Known warm cost underestimation governs honest planning.

At the stable orchestration checkpoint run the new/prior roster, batch-execution and
batch-resume tests, both typechecks, Rule7, list-only CLI and metadata/diff checks. One bounded
non-author review checks retained control operands and launch/recovery paths. No numerical,
readout or codec changes are planned; a full solver suite is not required for this isolated
orchestration surface. Existing full-suite receipts retain their historical limits.

From the fixed checkout, with the process-only Windows module path set:

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-facet-pressure-oct19-main.ts list HIL
node runner/src/hil-facet-pressure-oct19-main.ts launch HIL out/hil-facet-pressure-oct19
node runner/src/hil-facet-pressure-oct19-main.ts resume HIL out/hil-facet-pressure-oct19
node runner/src/hil-facet-pressure-oct19-main.ts summarize out/hil-facet-pressure-oct19
```

Reuse the existing hidden PowerShell wrappers under `out/hil-facet-pressure-oct19-control/`:
`start-hil.ps1 -Mode launch`, `stop-hil.ps1`, `start-hil.ps1 -Mode resume`. The stop helper may
select only this exact entry/output pair; never the old coordinators. Before restart confirm
no existing writer. Coordinator logs use unique `campaign-<mode>-<timestamp>.{stdout,stderr}.log`
and actual-exit receipts; workers use `rows/<id>/attempts/<attempt>/{stdout,stderr}.log` and
their existing exit records. Observe actual completed-cycle checkpoints after launch.

## Source currency and retention

The October 19 pre-freeze refresh reopened [TAX2](https://arxiv.org/abs/2306.13087) v1,
[CM9](https://arxiv.org/abs/2011.02353) v1, [CM4](https://arxiv.org/abs/1512.03389) v2 and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm). No superseding
growth source was identified relative to the morning check; later listed2025 items concern
teaching laboratories. No adopted mapping, physical law or source value changes.
Git keeps concise design/readout/verification records. Bulk events, fields and checkpoints
remain local during execution, then publish as external evidence under ADRs0051/0061 with
catalogue bindings and fresh restore before this seventh output-owning checkout closes.
No useful source/output pruning or worktree closure is authorized by this dispatch.

## Steps

- [x] Maker approved all twelve cases, uncertainty, HIL and uninterrupted existing work.
- [x] Commit protocol, implement the small roster/entry and complete scoped verification/review.
- [x] Freeze producer, launch twelve workers and observe completed-cycle checkpoints.
- [ ] Reconcile terminal results, execute matched readouts and preserve bulk output on NAS.

## Out of scope

New physical laws/readouts, tall-seed hybrids, midpoint temperatures, .0125 repeats, changed
targets, cold/warm expansion, known failed cooling rerun, source acquisition, GPU/Phase7,
BLD allocation and automatic queue expansion.

## Tried and rejected

- Repeating completed both/neither controls: reuse exact compatible bytes and add missing arms.
- Treating stable axial ordering as all-quantity convergence: the later occupancy sign changes.
- Claiming accumulated seed differences imply ongoing differential growth: later windows tie.
- Transferring normal-pressure timestep qualification to other pressures without measurement.
- Arbitrary wall cutoff or a non-resumable long run: maker requires saved scientific continuation.
- Another capacity/restart ladder with unchanged mechanics: use existing witnesses and live guards.
- Unchanged retry of the known cooling failure: the requested retry already reproduced it.

## Open questions

No maker approval remains pending. Scientific outcomes and actual runtimes remain to be measured.

## Implementation verification — 2026-10-19

Protocol `73de7d1` preceded the three roster/entry/test additions. Four focused files /29 tests,
both typechecks, Rule7, literal twelve-row CLI listing and source parity passed. The bounded
non-author inherited-context review independently compared every new row with the actual
retained control spec and found no unresolved claim-changing blocker. It checked wrapper
syntax/exclusion of existing processes; no extra simulation or physical review was performed.
The [verification receipt](../../evidence/hil-facet-pressure-2026-10-19/verification.json) and
[review](../../evidence/hil-facet-pressure-2026-10-19/review.json) retain checks and limits.
The first metadata check found only index length251 versus250; compacting the unchanged host
paragraph corrects it. Exact rerun receipt is task `out/hil-facet-pressure-oct19-checks/metadata-final-result.json`.
No numerical worker, shared coordinator or checkpoint behavior changed. Keep this checkout
clean and fixed at the ensuing producer commit; write actual launch/status records in primary.

## Actual launch and continuation — 2026-10-19

Producer `73eb358c7c720a7f1608df5b26f0a8438ae6be92` is clean and fixed in the task checkout.
Primary fast-forwarded the tested source before dispatch. The hidden wrapper started at
16:42:14 PDT /23:42:14Z, wrapper PID21628 and coordinator PID24224. Twelve new workers launched
beside the four existing workers; no old process was stopped, paused, restarted or changed.
[Campaign](../../evidence/hil-facet-pressure-2026-10-19/campaign.json),
[invocation](../../evidence/hil-facet-pressure-2026-10-19/invocation.json),
[launch](../../evidence/hil-facet-pressure-2026-10-19/launch.json) and wrapper invocation retain exact commands and identities.
An initial shell cleanliness check encountered null output from clean `git status` before any
launch; the invocation guard was corrected to count output lines, then the absent-output/no-writer
checks passed. No duplicate campaign or scientific attempt was created.

The [16:43:53 PDT observation](../../evidence/hil-facet-pressure-2026-10-19/launch-observation.json)
confirms all twelve new workers live with completed-cycle checkpoints at updates40–41 and
extents5–9, targeting29. Current/previous manifest hashes and solver lengths agree; convergence
metadata is true, error arrays/stderr empty. Solver payload digests were not rehashed in this
live observation; this is not a new restart differential or scientific endpoint check.
Available RAM46.2525 GiB and commit headroom48.6096 GiB exceed unchanged guards.
Actual concurrency is sixteen science workers: twelve new, two cold and two warm.
All four old PIDs remain unchanged and advance CPU. Warm thin/thick are updates2524/2501,
extent53/57; cold neither/basal-only are updates492/496, extent19/29.

Coordinator logs: task `out/hil-facet-pressure-oct19-control/campaign-launch-20261019T164214030.{stdout,stderr}.log`;
per-row logs: `out/hil-facet-pressure-oct19/rows/<id>/attempts/initial/{stdout,stderr}.log`.
Actual-exit receipts appear on termination. Exact recovery uses the earlier `resume HIL` command
or `start-hil.ps1 -Mode resume` from this unchanged producer after confirming no live writer.
No wall deadline, target extension, capacity probe or automatic queue expansion is present.

Next: let all targets continue, inspect existing summaries and checkpoint metadata at the next
status request, compare completed costs with the registered assumptions, then execute the named
matched readouts. Keep seven output-owning checkouts until governed NAS publication/fresh recovery.
Final implementation metadata checks passed2 files/18 tests; source checks passed as above.
Launch-record checks in primary passed the same2 files/18 tests and Rule7. Exact commands,
real exits and unique logs are `out/hil-facet-pressure-oct19-records/{metadata,rule7}{.log,-result.json}`.
The scoped staged diff check passed with raw verification logs excluded to preserve their bytes.
The fixed producer was not changed.
