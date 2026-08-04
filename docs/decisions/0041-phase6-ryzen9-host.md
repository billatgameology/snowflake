# 0041 — Phase 6 continues on the upgraded Ryzen 9 host

- **Date:** 2026-08-02
- **Status:** accepted by the maker; canonical Git landing pending
- **Charter impact:** amends the document revision marker, the current-revision paragraph, and
  §3.1's development-and-gate-hardware paragraph. Historical Phase 5 evidence and pre-upgrade
  Phase 6 sweeps remain on their recorded Ryzen 7 host; neither is relabeled.

## Context

The maker replaced the Phase 6 execution host's CPU. Manifest-covered host observation
`evidence/phase6-host/observation-20260803T033028Z.json` (3,051 bytes, SHA-256
`a21e93a7433666981b1b347f5b88a03e8d4e75658e4e9c25a360aae120a055dd`) records the exact commands
and outputs. Node 24.13.1 reports an `AMD Ryzen 9 5900XT 16-Core Processor`, 32 logical processors,
68,603,244,544 bytes of physical memory, V8 `13.6.233.17-node.40`, Windows release `10.0.26200`, and
x64. `nvidia-smi` reports the existing RTX 3080 with 10,240 MiB and driver 591.86. The 16-physical-
core value is supported by the CPU model designation and maker report; the attempted CIM topology
query returned `Access denied`. NVMe remains maker-reported rather than independently observed.

Decisions 0016 and 0018 accurately describe the host that produced the accepted Phase 5 evidence,
and the registered historical Phase 6 sweeps also ran on that Ryzen 7 5700G. Those Phase 6 artifacts
do not carry artifact-level host fields; their plan-level old-host provenance and this limitation are
preserved. Replacing either history would be false. Only Phase 6 continuation and replacement-gate
work moves to the new CPU. The CPU oracle is effectively single-threaded per process, so the
additional physical cores materially change safe scheduling, but they do not change a registered
case, numerical criterion, or scientific claim.

### Charter document marker being amended

> Project Document — v1.19, August 2026

### Charter current-revision paragraph being amended

> Current revision. v1.19 (2026-08-02) — decision 0040 corrects the Phase 6 coefficient, provenance, taxonomy, model-limit, freeze, and theorem-strength numerical descriptions after the crossing-bound and source-currency audits. It scopes the monopole domain result to its tested configuration instead of claiming general independence. §3.2's no-SDAK probe tests the full implemented broad-facet attachment parameterization with its recorded P1/P2 provenance, not a curve crossing promoted to morphology. §§2.2 and 2.6 stop presuming that all premelting effects are folded into measured inputs or that omitted latent-heat/surface-diffusion dynamics are automatically acceptable for validation. §2.5 and §2.7 distinguish published model-dependent inversions of narrow-facet growth observations from the exact Nakaya-informed M1 dip forms/placement, which remain P3 and in-sample; the source leaves the logarithm base unstated, so this project's base-10 resolution from the plotted dip widths is a P4 implementation choice. The same revision consolidates already accepted decisions 0023, 0024 and 0027 and records proposed decision 0039's reviewed constant-environment resume limit without granting that proposal authority. Historical evidence bytes remain preserved, but correcting the frozen parameter table invalidates the old sweep for the replacement gate and requires a new freeze and full rerun. Decision 0040 records the completed live propagation and non-author review; R15 remains unfrozen and no production campaign may treat this revision alone as its protocol freeze.

### §3.1 development-and-gate-hardware paragraph being amended

> Development and gate hardware (ADRs 0016 and 0018): the available host is a Windows desktop with an AMD Ryzen 7 5700G, 64 GB RAM, and an RTX 3080 with 10 GB dedicated VRAM; it carries Phase 5 development and acceptance plus the Phase 6 sweeps. The pinned Chromium runtime must record the backend it actually observes rather than infer it from Windows; at the Phase 5 freeze that backend is D3D12. Every evidence bundle records the actual adapter, backend, operating system, driver where exposed, runtime, and commit. Bounded dispatch remains mandatory because Windows watchdog resets can kill a tab. This acceptance scope does not establish Metal or general cross-backend WebGPU portability; Metal is deferred to another machine and requires a future ADR plus a separately frozen protocol.

## Decision

- Preserve the Ryzen 7 5700G as historical Phase 5 and pre-upgrade Phase 6 provenance. Nothing
  produced under that host is relabeled or invalidated by the upgrade. Historical Phase 6 sweeps'
  lack of artifact-level host binding remains an explicit evidence limit.
- Use the Ryzen 9 5900XT, 16 physical / 32 logical processors, about 64 GiB RAM, RTX 3080 10 GB
  Windows desktop as the Phase 6 continuation and replacement-gate production host.
- Every new Phase 6 continuation/replacement evidence bundle records the actual CPU, logical-
  processor count, physical memory, operating system, Node/V8 or Chromium runtime, repository
  commit, actual process concurrency, and exact launch command/flags. Where GPU work is involved it
  also records the observed adapter, backend and driver where exposed. The D3D12 backend is observed
  again; it is not inherited from the Phase 5 record.
- Independent CPU cases may run in parallel processes. Concurrency is recorded execution
  provenance, not a science input, and cannot change the registered case set, ordering within a
  case, stopping rule, or acceptance reduction. Start below full saturation and raise concurrency
  only from measured memory and I/O behavior.
- Canonical GPU performance/watchdog work remains one process per physical adapter unless a later
  pre-registration says otherwise. The CPU upgrade does not broaden the Windows-only Phase 5 or
  Phase 6 GPU claim.

## Consequences

**Buys.** The charter names the machine that will actually execute Phase 6. Up to twice as many
independent single-threaded oracle cases can be scheduled before considering memory and I/O limits,
while case semantics stay unchanged.

**Costs.** Production evidence spans two CPU generations within Phase 6 as well as across phases.
Historical sweeps have plan-level rather than artifact-level host provenance, so every comparison
must state that limitation and may not imply one-machine evidence. Throughput must be measured; 32
logical processors do not justify 32 simultaneous memory-heavy jobs by assumption.

**Forecloses.** Rewriting Phase 5 history onto the new CPU, treating a concurrency increase as a
protocol amendment, or using the CPU upgrade to waive numerical controls, GPU cohorts, held-out
work, bounded dispatch, or exact environment provenance.

## Alternatives considered

**Keep the Ryzen 7 wording until Phase 6 ends.** Rejected because it would knowingly misstate the
continuation/production host and make later evidence provenance contradict the charter.

**Rerun Phase 5 solely because the CPU changed.** Rejected. Phase 5's accepted evidence records the
machine that produced it; no solver, GPU, runtime, criterion, or historical byte changed.

**Run 32 oracle processes immediately.** Rejected as an unmeasured scheduling assumption. The
solver is memory- and I/O-intensive at production sizes, so concurrency is increased only after a
representative preflight establishes headroom.
