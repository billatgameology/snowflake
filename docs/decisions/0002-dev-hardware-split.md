# 0002 — Development hardware is split: Mac for the solver, RTX 4080 for GPU and sweeps

- **Date:** 2026-07-14
- **Status:** accepted
- **Charter impact:** §3.1 updated in this session ("Development machine: RTX 4080, 16 GB")

## Context

Charter §3.1 names a single development machine — an RTX 4080 with 16 GB — and engineers around
its environment, notably the note that "Windows' GPU watchdog resets dispatches that run ≈2 s, so
bake-quality work is chunked across many dispatches by design."

The machine the work is actually being done on is an Apple M4 Mac. The 4080 box exists and is
available, but it is not the daily driver. The charter therefore describes the deployment target
for one part of the project as though it were the environment for all of it.

This is not a problem for most of the project. Phases 0–4 are reading, a throwaway 2D canvas
spike, and a plain-TypeScript float64 CPU solver — none of which care what GPU is present.
It becomes a real problem twice:

- **Phase 5 (GPU port).** WebGPU on the Mac runs on Metal; on the 4080 it runs on D3D12/Vulkan.
  Adapter limits, `requiredLimits` negotiation, and timeout behaviour all differ. Code written and
  tested against only one of them will break on the other, and the charter's stated ambition is an
  artifact "anyone on a desktop can open from a link."
- **Phase 6 (calibration atlas).** The charter is explicit that the sweep harness — "hundreds of
  automated runs at preview resolution" — "is where the 4080 earns its keep, and it matters more
  than maximum grid size." An M4's GPU is a fraction of a 4080's throughput. Running the atlas on
  the Mac would take the sweep from an overnight job to something much worse.

## Decision

- **Phases 0–4 are developed on the Mac.** They are CPU-only and platform-neutral by construction.
- **Phase 5's WGSL is written to be portable and is tested on both machines before its gate
  closes.** Metal and D3D12/Vulkan both, no exceptions — a GPU solver validated on one backend is
  not validated.
- **Phase 6's sweeps run on the 4080.** The headless runner (charter §3.1) is the mechanism, and
  this is a large part of why it exists: parameter sweeps and atlas generation must never require
  a browser tab, and now also must not require a particular machine.
- **The bounded-dispatch discipline stays**, and stays justified by Windows. macOS will not
  reproduce the ≈2 s watchdog reset, so a dispatch that is comfortable on the Mac can still kill
  the tab on the 4080. Bounded dispatches are therefore a *portability* requirement, not merely a
  Windows workaround, and must not be relaxed just because the Mac tolerates long dispatches.

## Consequences

**Buys.** The daily loop stays on the machine actually in front of the maker. The sweep — the
compute that genuinely needs the hardware — goes to the hardware that has it. The portability
requirement is now explicit rather than accidental, which is worth something on its own for a
project whose whole point is a link anyone can open.

**Costs.** Phase 5 gains a real obligation: a second machine in the test loop, and a class of bug
(backend-specific WGSL and limit negotiation) that cannot be found on the development machine.
Checkpoint files have to move between the two, which is an argument for the format being boring,
self-describing and endian-safe. Expect the first cross-machine run to fail on `requiredLimits`.

**Forecloses.** Nothing, but it does raise the cost of ever assuming a single GPU environment.

**Deliberately not decided here.** Whether the headless runner uses Deno's built-in WebGPU or Node
with Dawn bindings. Both are cross-platform, neither is installed yet, and the choice does not
need making until Phase 5. Recording it as open so it is not mistaken for an oversight.

## Alternatives considered

**Retarget everything to the Mac and drop the 4080.** Simplest, and honest about where the work
happens. Rejected because Phase 6 is the phase that converts this project from a toy into the
thing the charter actually promises — a calibration atlas, measured rather than hard-coded — and
it is throughput-bound. Giving up an order of magnitude of sweep throughput to save a machine in
the test matrix is a bad trade for the one phase that most needs the compute.

**Do all development on the 4080.** Matches the charter as written. Rejected as a matter of fact
rather than preference: the Mac is the daily driver. Pretending otherwise would put the charter
and reality back out of sync, which Rule 5 exists to prevent.

**Ignore the discrepancy until Phase 5.** Tempting, since nothing before then is affected. Rejected
because the charter would have gone on saying something false about the project for four phases,
and because the bounded-dispatch rule — which *is* load-bearing and *is* Windows-derived — would
have looked like an arbitrary constraint to whichever model reached Phase 5 on a Mac and found
long dispatches working fine.
