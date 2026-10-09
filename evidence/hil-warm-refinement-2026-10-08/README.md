# HIL warm-refinement launch qualification

The [registered six-case protocol](../../docs/plans/hil-warm-refinement.md) tests warm early-growth
memory across coarse and fine seed representations. This bundle contains operational qualification,
not morphology results or physical-validation evidence. Production has not launched at this
record's snapshot: the HIL resource ladder is running and its automatic dispatcher is waiting.

Producer: `838c294757c65c0d3b96d017cb7fec3541e4db42`, Node v24.13.1 / V8
13.6.233.17-node.40, HIL. Plan commit `66c5799` precedes the implementation.

- Exact `npm.cmd test`: **236 files / 3050 tests passed, 23 skipped**, Vitest 1068.18 seconds.
  `full-test-result.json` and invocation/raw stdout/stderr bind the real exit and source.
- Actual N126 fine-thick early-width interruption: killed the owned process after committed
  tick one, resumed the identical three-update prefix in a fresh process and compared it with
  an uninterrupted run. Both final **34009537-byte** checkpoints are exactly equal, SHA-256
  `ee2c27cf7a0d613bcd4d275445f127e09422e64458e73b114d25c48215c704dd`.
  All three scientific event records, scientific result fields and the one saved field snapshot
  match. `n126-witness-receipt.json` identifies the omitted operational time/RSS fields.
- `review.json` records one shared-context non-author Codex/GPT-6 engagement, including 25 focused
  tests, independent geometry/capacity calculations, fresh decoding and comparison of the actual
  witness bytes. No actionable finding remains. It did not run a mature configuration or complete
  the capacity ladder, and supplies no grid/domain-independence or physical-validation claim.

`n126-witness.tar.gz` preserves all **43 files / 170300021 uncompressed bytes**, in a
**17773204-byte** archive. Every decompressed member was compared by path/length/SHA-256 with
the original source tree; `n126-witness-inventory.json` carries the complete inventory and archive
digest. These are project-owned tracked evidence, permanently retained and not served through NAS.
The original task staging remains intact. No output deletion or NAS publication is authorized.

To inspect the preserved comparison in a fresh checkout, restore into the absent path expected by
the retained independent review calculation:

```powershell
if (Test-Path out/warm-refinement-control/n126-witness) { throw 'Use a fresh checkout or retain the existing output' }
New-Item -ItemType Directory out/warm-refinement-control/n126-witness -Force
tar -xzf evidence/hil-warm-refinement-2026-10-08/n126-witness.tar.gz -C out/warm-refinement-control/n126-witness
node evidence/hil-warm-refinement-2026-10-08/review-witness.mjs
```

Re-executing the scientific interruption test is separate: at the frozen clean producer use
`node evidence/hil-warm-refinement-2026-10-08/n126-witness.mjs <new-output-directory> 838c294757c65c0d3b96d017cb7fec3541e4db42`.
Its operational watchdog does not define a production scientific stopping criterion. This prefix
tests actual larger-grid continuation before the twenty-second cutoff; existing smaller tests
cover cutoff transitions. Mature geometry and campaign capacity remain outside the witness.

The first capacity attempt (`failed-probe.json`) stopped before any worker because Windows
PowerShell selected incompatible inherited PowerShell 7 modules. The live retry sets the process
module path to Windows system modules; numerical code, sampler and memory thresholds are unchanged.
`probe-v2-invocation.json` states the overlap with the restart test and single-worker full suite,
so these wall times are not isolated speed measurements. Live retry: task
`out/warm-refinement-probe-v2/`; actual rung results are pending and are not represented as passed here.

The copied launch/stop/dispatch helpers and invocation/state files are operational provenance.
`dispatch-state.json` is a frozen snapshot of `waiting-for-resource-probe`, not the live state.
Read the execution checkout's `out/warm-refinement-control/dispatch-state.json` and the plan before
starting or stopping anything. Dispatcher PID 18744 waits for the existing probe's successful exit;
the unchanged scientific launcher then validates source/runtime/host/roster/capacity and starts
six cases at the qualified worker count. Checkpoints are saved every complete update, with two
generations retained and no production wall deadline. No BLD workload is assigned.
