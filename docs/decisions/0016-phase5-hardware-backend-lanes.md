# 0016 — Phase 5 uses the RTX 3080 primary host and the M4 Metal lane

- **Date:** 2026-07-23
- **Status:** accepted; Metal/two-lane gate clauses superseded by 0018
- **Charter impact:** §3.1 and Phases 5–6 updated in this session

## Context

Decision 0002 described the then-current split between an Apple M4 development Mac and a
Windows RTX 4080/16 GB GPU host. Work has moved to a Windows desktop with an AMD Ryzen 7 5700G
(8 cores / 16 logical processors), 64 GB RAM, an NVIDIA GeForce RTX 3080 with 10 GB dedicated
VRAM, and NVMe storage. The RTX 4080 is not the available execution baseline, so the charter's
hardware and bake-memory claims are no longer true.

The scientific portability requirement remains true. WebGPU's WGSL must agree with the float64
CPU oracle on Metal and on a Windows D3D12/Vulkan backend before Phase 5 closes. The previously
documented M4 Mac supplies the Metal lane; the Windows desktop supplies the D3D12/Vulkan lane.
Adapter limits, driver compilers, floating-point contraction, and watchdog behavior can differ,
so one lane cannot stand in for the other.

The CPU oracle is effectively single-threaded per process. The Windows host can recover elapsed
time by running scientifically independent CPU cases in parallel, but concurrently saturating
one GPU can distort latency and watchdog evidence.

## Decision

- The Windows Ryzen 7 5700G / 64 GB / RTX 3080 10 GB desktop is the primary Phase 5 development
  host, the D3D12/Vulkan conformance lane, and the Phase 6 sweep host.
- The Apple M4 Mac documented by decision 0002 is retained as the Metal conformance lane. Phase 5
  implementation may proceed while that lane is idle, but the Phase 5 gate cannot close until
  the same frozen comparison protocol passes there. If that Mac becomes unavailable, the gate is
  blocked until another named Metal-capable host is recorded by an ADR amendment.
- Every gate bundle records the actual adapter, backend, operating system, driver where exposed,
  browser or headless runtime, runtime version, and repository commit. "Windows" or "Mac" alone
  is not sufficient provenance.
- The Windows evidence lane uses whichever WebGPU backend the selected runtime actually reports
  from the D3D12/Vulkan family; it is never inferred from the operating system. The Metal lane
  likewise records the observed backend.
- The ≈8M-cell preview budget and two-backend CPU-oracle comparison remain unchanged. The
  ≈130M-cell bake budget is an optional adapter-dependent target, not a Phase 5 gate criterion,
  and is not presumed to fit the RTX 3080's 10 GB VRAM or its browser buffer limits.
- Independent CPU fixtures, cases, and comparison preparation should run as separate parallel
  processes when memory permits. Canonical GPU performance and watchdog measurements run one
  process per physical adapter unless a pre-registered protocol explicitly proves a different
  concurrency arrangement.
- Bounded dispatches remain mandatory. The Windows lane supplies the watchdog-sensitive evidence;
  success on Metal cannot waive it.

## Consequences

**Buys.** The charter again names the hardware that actually exists. Most Phase 5 work happens on
the current Windows machine, the user's available CPU cores can be used for independent oracle
cases, and the dual-backend gate remains a real portability test instead of a paper promise.

**Costs.** The gate still requires a cross-machine handoff. Identical manifests and fixtures must
move to the M4, evidence must be authenticated on both hosts, and backend-specific failures may
require a second development loop. The 10 GB GPU also removes the former assumption that the
largest illustrative bake budget fits the primary card.

**Forecloses.** A one-machine Phase 5 acceptance, a Windows-only portability claim, treating the
RTX 3080 as though it were the former 16 GB card, and using concurrent loads on one GPU to support
an interactive-performance claim.

## Alternatives considered

**Keep the RTX 4080 wording as an aspirational target.** Rejected because the charter would name
hardware that is not the execution baseline and would make memory and throughput claims that the
evidence cannot support.

**Drop Metal now that development is on Windows.** Rejected because the product is a desktop-web
artifact, not a Windows application, and backend-specific WGSL and limit-negotiation defects are
part of the Phase 5 risk being gated.

**Require all Phase 5 development on both machines from the first commit.** Rejected because most
buffer-layout, oracle-comparison, and bounded-dispatch work is backend-neutral. Cross-backend
checks occur at every frozen conformance milestone and at the gate; duplicating every edit-run
cycle would add transfer overhead without strengthening the contract.

**Run all GPU cases concurrently to maximize utilization.** Rejected for canonical evidence:
contention on one physical adapter changes latency and watchdog behavior. Parallel CPU oracle
generation remains preferred, and non-canonical GPU concurrency may be explored separately.
