# 0017 — Phase 5 uses Playwright's pinned Chromium as the headless WebGPU runtime

- **Date:** 2026-07-23
- **Status:** accepted
- **Charter impact:** §3.1 updated in this session

## Context

Phase 5 requires one headless WebGPU path that runs the same future `solver-gpu` package and WGSL
as the browser instrument, reports the backend actually selected, captures validation and
uncaptured errors, exposes adapter limits, supports timestamp queries, and can be reproduced on
the Windows D3D12 and macOS Metal lanes. The charter named Deno and Node Dawn/wgpu bindings as
examples, not a decision.

The WP0 capability spike measured the available Windows candidates before production WGSL
existed. Node v24.13.1 exposes no `navigator.gpu`, and Deno is not installed. System Chrome
150.0.7871.182 and Playwright 1.61.1's bundled Chromium revision 1228
(Chrome/149.0.7827.55) both selected the NVIDIA RTX 3080 through an observed D3D12 backend,
requested the frozen limits, completed a timestamped compute dispatch, captured an intentional
`GPUValidationError`, and emitted no uncaptured error. The bundled browser is tied to the
lockfile; system Chrome auto-updates independently on each host.

Chrome's standard `GPUAdapterInfo` intentionally omits the graphics backend. The capability
probe therefore enables Chrome's development-only WebGPU adapter fields and records the
non-standard `backend`, adapter type, driver, shader model where exposed, and memory heaps.
Those fields are evidence instrumentation only, not production application dependencies.

The M4 host was not reachable from this Windows session. Its exact identity and Metal result
remain a blocking Phase 5 lane requirement under decision 0016; no Windows runtime result can
stand in for it.

## Decision

- Phase 5's headless runtime family is Playwright-controlled, lockfile-pinned Chromium. WP0 pins
  Playwright `1.61.1`, Chromium revision `1228`, and records the browser product version observed
  by each lane. Changing the pinned browser or Playwright version after this criteria freeze
  requires an ADR and reruns both lane bundles.
- The capability and gate processes launch Chromium headless with
  `--enable-unsafe-webgpu --enable-webgpu-developer-features`. The first flag makes the
  controlled evidence environment explicit; the second exposes development-only provenance.
  The ordinary interactive app must not depend on either flag.
- `timestamp-query` and the exact required-limit table in
  `runner/src/phase5-protocol.ts` are mandatory on both lanes. The probe requests them rather
  than trusting adapter maxima, runs a real timestamped compute dispatch, and proves scoped
  validation capture works.
- Every lane records the browser executable, product, revision, Playwright version, launch
  flags, operating system, adapter, observed backend, driver where exposed, features, adapter
  limits, requested device limits, repository commit, and worktree cleanliness.
- The browser instrument and headless runner must import the same future `solver-gpu` package
  and WGSL. Playwright owns process control and evidence capture; it does not own solver state
  or introduce a second implementation.
- `node runner/src/main.ts gate5` is the future flagless aggregate command. It consumes one
  authenticated Windows D3D12 bundle and one authenticated Metal bundle produced by the same
  frozen protocol. The M4's absent WP0 record keeps the gate blocked, not weakened.

## Consequences

**Buys.** The exact browser engine is reproducible from the existing npm lockfile on both hosts,
the gate can use browser-native WebGPU without a native addon, backend provenance is observed
rather than inferred from the operating system, and the app and evidence runner exercise the
same web platform implementation.

**Costs.** The evidence path depends on Playwright's browser download and Chromium-specific
development provenance fields. A browser revision change is a protocol change. The Metal host
must install the pinned Playwright browser before its capability record can close.

**Forecloses.** Auto-updating system Chrome as the canonical evidence runtime, Node without a
WebGPU implementation, a Windows-only headless gate, and backend claims derived from platform
names.

## Alternatives considered

**System Chrome Stable.** It passed the Windows spike, but auto-update timing can make the two
lane bundles use different compilers without an intentional protocol change. Retained only as a
non-canonical development candidate.

**Deno WebGPU.** Not installed on the primary host, and adding it would create a second runtime
distribution when the repository already carries Playwright for deterministic visual evidence.
It may be reconsidered by ADR if Chromium cannot support a later gate requirement.

**Node with Dawn/wgpu bindings.** Node itself exposes no WebGPU here; a native addon would add
platform-specific installation and ABI work before the solver package exists. It offers no WP0
advantage over the measured browser path.

**Use the interactive browser manually.** Rejected because canonical sweeps, exit semantics,
artifact publication, and overnight operation must not require a visible tab or human timing.
