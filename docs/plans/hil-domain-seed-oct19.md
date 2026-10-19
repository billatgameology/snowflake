# Plan — HIL cold domain comparison and seed timestep companion

- **Phase:** Phase 10 exploration, charter section 2.5 and accepted ADRs 0055, 0060 and 0062.
- **Status:** running; all twelve new workers have completed-cycle checkpoints; two warm workers continue unchanged.
- **Started / last touched:** 2026-10-19 by Codex/GPT-6.
- **Authority:** maker: "let the two remaining finish, do the new recommended experiment and plus small alternative companion."
- **Branch / checkout:** `codex/hil-domain-seed-oct19`, `C:/Users/biao3/.codex/worktrees/hil-domain-seed-oct19/snowflake`, from `d2360e2`.

## Goal

Test the strongest cold structural contrast against domain size, and the seed-dependent net
facet contrast against a smaller timestep. The direct deliverable is twelve finite resumable
cases running on HIL beside the two unchanged warm workers. Solo scientific research; hostile
actors excluded. Use the existing numerical worker, observations, restart and queue; no new
infrastructure is needed. The [completed-results review](../../evidence/hil-results-review-2026-10-18/README.md)
owns the motivating findings, exact control bindings and interpretation limits.

## Done when

The charter's broader Phase 10 endpoint remains:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

This dispatch is complete when the committed twelve-row roster passes focused routing/operand
checks and both typechecks, one bounded review has no unresolved claim-changing issue, all
twelve rows have actual completed-cycle checkpoints, and both existing warm workers remain
advancing (or have independently completed). Scientific completion later requires twelve named
terminal dispositions, matched readouts with invalid/missing cases explicit, and governed NAS
preservation before checkout closure. Launch is not a finding or a phase gate.

## Frozen operands and reused controls

| Block | New cases | Temperature / forcing fraction | Domain / spacing | Seeds radius/thickness | Preparations | Fill CFL |
|---|---:|---|---|---|---|---:|
| Cold domain | 4 | -14.4 C / .10 | N96 / .35 um | 2/1 | both, neither, basal-only, prism-only | .05 |
| Seed timestep | 8 | -6.5 and -9.5 C / .15 | N64 / .35 um | 3/1 and 1/5 | both, neither | .025 |

All rows: target largest extent 29 (9.8 um center span), maximum 20000 updates, pressure 101325 Pa,
M1 base metadata with explicit `experimentalFacetDips`, aggregate-hv-g1h1-v6, monopole-matched
hexPrism, noise zero, random seed one, residual tolerance 1e-9, divergence tolerance 1e-7 and
maximum 200000 relaxation sweeps. Derive `sigmaInfinity` exactly with
`phase6SigmaWaterFromTable(tempC) * fraction`; no rounded replacement. Constant environments only.
Keep events every completed cycle and pre-update spatial crossings at odd extents 5 through 27.
Scientific success requires the existing endpoint checker; step-cap, contact, convergence failure
or resource interruption is not an absent-effect result. No wall deadline or target extension.

IDs: `oct19-hil-cold-domain-t14p4-f0p1-n96-<arm>` and
`oct19-hil-seed-step-t<6p5|9p5>-f0p15-r<3|1>-h<1|5>-cfl0p025-<both|neither>`.
Queue the cold quartet first, then temperature -6.5/-9.5, seed 3/1 then 1/5, both then neither.
All twelve start in the one registered twelve-slot wave; no adaptive additions.

Cold controls are the four `oct10-hil-cold-t14p4-f0p1-*` rows, fixed producer `33832e2`.
Seed controls are the eight `oct11-hil-seed-t<6p5|9p5>-f0p15-r<3|1>-h<1|5>-<both|neither>`
rows, producer `5a00e90`. Their exact bytes and costs are bound in
[candidate-baselines.json](../../evidence/hil-results-review-2026-10-18/candidate-baselines.json)
and the review's cold/seed inputs. Verify source and row compatibility before comparing.
The selected controls share the twelve odd-extent snapshot crossings; compare actual compatible
crossings, and use complete attachment events for intervening geometry. No redundant full-length controls are added.

## Readout and decisions

Reuse the review's cold reconstruction (`cold/read-cold.mjs`, `cold/read-spatial.mjs`) and seed
reconstruction (`seed/analyze.mjs`) definitions. The existing `checkFirstBatchRow` rederives
endpoint convergence, ledger, fill-CFL, symmetry and terminal agreement. Scientific analysis
reads completed artifact bytes, never a live partial event file or producer pass flag alone.

Cold: reconstruct central-plane occupied rings, tip radius, full central hex-ball core radius
and their gap. At exact tip radii 8 and 9, compare 0, .25, .5 and .75 of the shortest positive
plateau duration shared across all eight old/new rows; report unavailable plateaus explicitly.
Use at-or-before and next-event brackets. Also compare .25, .5, .75 and 1 of the minimum terminal
physical age across those eight rows, with each bracket retained. Compare raw ring census and
spatial fields only at common registered crossings; missing sparse field precursors stay missing.
Persistence of the prism-bearing contrast supports this lead over these two domains; disappearance,
reversal or bracket sensitivity redirects toward boundary/stage effects. Same spacing with larger
N tests domain sensitivity, not grid convergence or far-field independence.

Seed: subtract each initial seed's actual axial/lateral span and occupied count. Compare all
sixteen old/new rows at .25, .5, .75 and 1 of their minimum terminal physical age, and consecutive
increments between those times. Retain each adjacent-event bracket; no interpolation of occupancy.
Also reproduce the earlier shared-age anchor 16.6289686258 seconds if all rows cover it; otherwise
report it unavailable, without extrapolation. Within each temperature/seed compare both minus
neither, then tall minus wide within each preparation, separately for both CFL values. Persistence
of the net positive/negative axial ordering strengthens the lead; reversal or window dependence
limits it. Two preparations cannot qualify the four-arm decomposition. Occupancy is not mass;
retained size differences do not imply continuing differential growth.

These are internal implemented-model comparisons, not measured snow physics or validation.
Interpretation needs the proportionate skeptical pass under Rules 13–14; no new gate is created.

## Runtime, resource and restart budget

Historical exact controls total 6.5407325 worker-hours for cold (longest 2.5144422222 h) and
17.3198655556 worker-hours for seed (longest 2.5983533333 h). Changed configurations are unmeasured.
Illustrative assumptions: cold cost times 3.375 (cell count) or 7.59375 (also allowing 2.25 times
the sweeps), and seed cost times 2. These yield 56.7147033 or 84.3084185 worker-hours, with the
single-wave longest-case scenarios 8.4862425 or 19.0940456 hours. An additional 25% slowdown gives
10.6078031 or 23.8675570 hours. These are not fitted laws, bounds or promises; a larger-domain
convergence tail may exceed a day. Do not divide total worker-hours by twelve to report an ETA.
At the first substantive status review compare actual completed block costs to these assumptions.

Use twelve new workers beside two warm workers, fourteen science processes total. The read-only
[2026-10-19T13:27:12Z HIL sample](../../evidence/hil-domain-seed-2026-10-19/prelaunch.json) found 52646559744 available RAM bytes and 55283941376 commit-headroom
bytes; warm PIDs 14528/24776 used about .52 GiB each. Keep live 12 GiB available-RAM / 8 GiB
commit-headroom guards. This registers an explicit budget, not a new N96 capacity qualification.
No new capacity ladder or BLD dispatch. Save the fresh launch observation with real concurrency.

ADR 0060 recovery remains initialization plus every complete cycle, retaining current/previous
generations. An interrupted relaxation repeats from the preceding complete state. Existing real
N64 restart evidence and the [N126 witness](../../evidence/hil-warm-refinement-2026-10-08/n126-witness-receipt.json)
apply to unchanged worker/codec/state semantics; N96 is below the existing N126 bound. Verify
source parity, do not repeat that experiment merely for a new roster. Runtime/host/source remain
bound; never resume from another checkout's producer or change the executing commit.

## Implementation, commands and checks

Commit this protocol first. Add only `hil-domain-seed-oct19-{roster,main}.ts` and its focused test,
using `runHilOperationalBatch`. Existing leases, logging, endpoint checks and memory guards stay.
Rule 14A: accidental wrong operands, duplicate writers or mismatched restart could corrupt the
comparison; existing boundaries already protect these. Add only the roster operand/routing check.
Lessons A3/E4 govern exclusive writers/restart; C2/C3/C6 and E5 govern matched domains, timing
transfer and bracketed interpretation. Tests cannot eliminate interpretation judgment.

Run focused new-roster, prior-roster, batch-execution and batch-resume tests, both typechecks,
Rule 7, a list-only CLI dry run and source parity. No numerical/readout implementation changes
are planned; Rule 6 does not require another full solver suite for this orchestration surface.
The October 18 analysis full-suite failure retains its historical limits; do not call it green.
One bounded non-author review after these interfaces stabilize; no review of review.

From the fixed checkout with process-only Windows module path set:

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-domain-seed-oct19-main.ts list HIL
node runner/src/hil-domain-seed-oct19-main.ts launch HIL out/hil-domain-seed-oct19
node runner/src/hil-domain-seed-oct19-main.ts resume HIL out/hil-domain-seed-oct19
node runner/src/hil-domain-seed-oct19-main.ts summarize out/hil-domain-seed-oct19
```

Reuse the existing hidden PowerShell start/stop wrapper pattern in `out/hil-domain-seed-oct19-control/`.
`start-hil.ps1 -Mode launch` starts once; `stop-hil.ps1` pauses only this coordinator/its children;
`start-hil.ps1 -Mode resume` recovers pending rows. Check processes first. Keep unique coordinator
stdout/stderr/invocation/actual-exit files there and per-row `attempts/initial/` logs plus `resume/`
state under `out/hil-domain-seed-oct19/rows/<id>/`. No warm process belongs to those wrappers.

The October 19 bounded source-currency refresh reopened official histories for
[TAX2](https://arxiv.org/abs/2306.13087) v1, [CM9](https://arxiv.org/abs/2011.02353) v1,
[CM4](https://arxiv.org/abs/1512.03389) v2 and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No superseding growth source was identified relative to the October 12 check; later listed 2025
items concern teaching laboratories. No mapping, physical law or adopted source value changes.

## Steps and retention

- [x] Maker selected the four-case recommendation and eight-case companion; cost scenarios stated.
- [x] Commit protocol, implement finite roster and complete focused checks/review.
- [x] Freeze producer and launch twelve rows; observe real checkpoints and untouched warm progress.
- [ ] Reconcile endpoints, perform matched readouts and preserve bulk bytes on NAS before closure.

Git holds small recipes, provenance and receipts; new events/fields/checkpoints remain local
during execution and follow Rule 15 / ADRs 0051 and 0061 for NAS publication and fresh restore.
No useful output is pruned or worktree closed by this task; existing five owners stay open.

## Out of scope

Extra temperatures/pressures/history rows, failed-row reruns, solver fixes, grid refinement,
warm modifications, new physical claims, Phase 7, BLD allocation and automatic queue expansion.

## Tried and rejected

- Another broad sweep: follow the surviving cold and seed contrasts with twelve discriminators.
- Transfer N64 wall time directly to N96 or promise completion from extent: convergence and
  mature geometry change cost; preserve explicit scenarios and overrun uncertainty.
- A wall cutoff: maker rejects losing findings to arbitrary elapsed time; use finite targets
  and tested completed-cycle restart instead.
- Repeat capacity/restart ladders with unchanged mechanics: existing witnesses and live memory
  guards cover this operational decision; no new codec or worker behavior is introduced.
- Retry the known subnormal cooling failure unchanged: original plus explicit retry already
  reproduced it; separate diagnosis is required and unrelated to these constant-environment rows.

## Open questions

No launch approval is pending. Duration and scientific outcome remain to be measured. Preserve
the two warm trajectories and report their own completion independently of this new wave.

## Implementation checks — 2026-10-19

Protocol `3d4181f` preceded the three roster/entry/test additions. The [verification record](../../evidence/hil-domain-seed-2026-10-19/verification.json) retains exact commands, timestamps, exits and logs: four focused files / 28 tests, both TypeScript checks, Rule 7 and two metadata files / 18 tests passed. CLI list returned the exact twelve rows. A bounded non-author shared-context review checked actual retained specs, source parity and wrapper scope/syntax with no unresolved blocker; its execution limits are recorded in `review.json`. No numerical worker, codec, readout or queue changed. Locked dependencies installed locally without lockfile changes.

The [prelaunch observation](../../evidence/hil-domain-seed-2026-10-19/prelaunch.json) verified the marked NAS at `z:/`, about 3.41 TB local free space, ample live memory and both warm workers active. Warm status at that observation: thin extent51/update2421 and thick extent51/update2396; these are live progress, not completed scientific comparisons. Source is frozen at the ensuing implementation commit before production; later live records belong in primary.

## Launch — 2026-10-19

Fixed producer `ff7b1a88bc62335216b9edb23d487eec82868e3a`, branch/checkout as above. The hidden wrapper launched at 2026-10-19T13:31:10Z (06:31 PDT), wrapper PID14424 and coordinator PID24168. Actual concurrency is twelve new workers beside the two unchanged warm workers. [Campaign](../../evidence/hil-domain-seed-2026-10-19/campaign.json), [launch](../../evidence/hil-domain-seed-2026-10-19/launch.json), [invocation](../../evidence/hil-domain-seed-2026-10-19/invocation.json) and wrapper receipt bind exact source, runtime, commands and row inventory. Coordinator logs are task `out/hil-domain-seed-oct19-control/campaign-launch-20261019T063110024.{stdout,stderr}.log`; per-row logs are `out/hil-domain-seed-oct19/rows/<id>/attempts/initial/{stdout,stderr}.log`, with each actual exit written on termination. No exit receipt is expected while a process is running.

Primary now includes this code/protocol. Keep the output-owning execution checkout clean at its fixed producer; write subsequent status/readouts here. The start/stop helper recipes are retained with the evidence, and their exact scoped paths are recorded above.

The [13:35:33Z observation](../../evidence/hil-domain-seed-2026-10-19/launch-observation.json) confirms all twelve new workers alive with nonzero completed-cycle checkpoints: cold quartet update1/extent5, seed rows updates51–83/extents7–9. Current manifest and solver bytes match their published hashes; stored cumulative convergence is true, integrity-error arrays empty and per-attempt stderr empty. These are launch observations, not terminal scientific verdicts. Both warm workers remained on the original PIDs and advanced CPU since prelaunch: thin update2422/extent51, thick update2398/extent51, target57. Available RAM was 47.0095 GiB and commit headroom 49.2693 GiB, above unchanged guards. No new capacity probe or pause/restart occurred.

Next: let all finite targets continue; at the next substantive review run the existing summarize command from this fixed checkout, inspect live checkpoints/attempts, and compare completed block costs with the registered scenarios. Once the required members finish, perform the matched domain/timestep analysis above. Do not replace a live writer, expand targets or treat partial progress as absent effect. Bulk output remains local in this sixth output-owning checkout until governed NAS publication/fresh recovery.
