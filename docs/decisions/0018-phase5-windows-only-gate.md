# 0018 — Phase 5 closes on the current Windows D3D12 host

- **Date:** 2026-07-24
- **Status:** accepted
- **Charter impact:** §3.1 and Phase 5 updated in this session

## Context

Decisions 0002 and 0016 required Phase 5 conformance on the current Windows RTX 3080 host and a
separate Apple M4 Metal host. WP0 froze that two-lane protocol before production WGSL existed,
and WP1 then passed its complete Windows transport probe. The M4 was not reachable from the
Windows session and the operator has now explicitly directed the project to skip Metal for this
PC phase and return to Metal later on another machine.

Keeping an unreachable lane as the current gate would stop all remaining Phase 5 work. Silently
ignoring it would be worse: the charter, protocol hash, criterion set, evidence graph, and plan
would continue to claim cross-backend portability that no execution had established. This
therefore requires an explicit scope decision and a new protocol freeze, not a waiver inside the
runner.

## Decision

- Phase 5 development and its canonical gate use the current Windows Ryzen 7 5700G / RTX 3080
  host through the backend actually observed by the pinned Chromium runtime. At this decision
  point that backend is D3D12.
- The Apple M4/Metal lane is deferred to a later conformance phase on another machine and is
  removed from this Phase 5 acceptance contract. No Metal bundle, Metal provenance criterion,
  cross-backend triangle comparison, or two-host artifact transfer is required for the current
  gate.
- The Phase 5 claim is correspondingly narrower: CPU-oracle agreement, numerical correctness,
  bounded dispatch, GPU residency, and preview interactivity are established only for the
  recorded Windows/Chromium/D3D12 stack. Phase 5 does not claim Metal portability, broad WebGPU
  backend portability, or behavior on an untested browser/driver.
- The old `phase5-gpu-conformance-v1` manifest remains immutable superseded history. A new
  Windows-only v2 manifest is frozen before diffusion WGSL begins. Fixtures, CPU-vs-GPU field
  tolerances, decision margins, memory budgets, runtime revision, and performance thresholds
  remain unchanged. Only the lane set, cross-backend-only tolerance term, criteria, negative
  controls, evidence meaning, and derived hashes change.
- The flagless `gate5-lane` command produces the single authenticated Windows bundle. The
  flagless `gate5` command independently reopens that bundle, derives every Windows-only
  criterion, and publishes the final report/index. A lane exit 0 remains insufficient by itself.
- Bounded dispatch remains mandatory and is still measured on Windows, where watchdog risk is
  the binding concern.
- Adding Metal later requires a new ADR and a separately frozen conformance protocol. That
  result may extend the portability claim but cannot retroactively relabel this Windows-only
  Phase 5 evidence.

## Consequences

**Buys.** The remaining implementation can proceed on hardware the operator actually has. The
gate remains executable, exact adapter/backend provenance stays enforced, and all scientific,
numerical, residency, checkpoint, and interaction requirements remain binding.

**Costs.** Phase 5 no longer establishes WGSL portability across independent driver compilers.
A D3D12 pass says nothing about Metal-specific compilation, floating-point contraction, limits,
or scheduling. The desktop-web artifact may still run elsewhere, but this phase will not have
validated those environments.

**Forecloses.** Any Phase 5 prose that says “both backends,” any substitution of the Windows
bundle for Metal, and any claim that Windows-only evidence proves general WebGPU portability.

## Alternatives considered

**Wait for the other machine before continuing.** Rejected by explicit operator direction; Metal
is deferred, while the current PC phase continues.

**Keep the two-lane protocol but mark Metal non-blocking.** Rejected because this would preserve
a cross-backend claim while removing the evidence that gives the claim meaning.

**Emulate or relabel Metal on Windows.** Rejected because backend provenance is observed from
Chromium and D3D12 is not a proxy for Apple's compiler or GPU stack.

**Remove all portability and watchdog controls.** Rejected. Only the unavailable lane is
deferred; exact Windows provenance, explicit limits, bounded dispatch, CPU-oracle comparison,
negative controls, and fail-closed evidence publication remain requirements.
