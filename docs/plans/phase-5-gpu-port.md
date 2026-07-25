# Plan — Phase 5: WebGPU solver port and Windows D3D12 conformance

- **Phase:** Phase 5 — GPU port
- **Status:** WP1-WP4 are independently accepted; WP5's first candidate was rejected and its
  review repair is in progress. WP6 and WP7 remain blocked.
- **Started:** 2026-07-23
- **Last touched:** 2026-07-24 by Codex

## Goal

Build the production float32 WebGPU solver downstream of the permanent float64 CPU oracle,
without changing either CPU `SurfaceOperator`. The result runs the shared lattice, diffusion,
`GGThreshold`, and `LibbrechtKinetics` update contracts through bounded WGSL dispatches, exposes
GPU-resident state to the existing instrument, and produces authenticated CPU-vs-GPU comparison
evidence on the observed Windows D3D12 lane. Metal conformance is deferred to a later machine
and separately frozen extension.

This is a numerical-portability and interactive-performance phase. It does not validate the
physical model, beautify the Phase 4 diagnostic renderer, or replace the CPU oracle.

## Done when

Done when GPU and CPU runs agree within pre-registered tolerance on the observed Windows D3D12
backend and the preview budget (≈8M cells) is interactively editable. Exact
host/runtime/adapter/backend provenance, bounded dispatch, GPU residency, and fail-closed
evidence remain required. This is a Windows/Chromium/D3D12 claim, not Metal or general WebGPU
portability. (Amended v1.2: cell-budget phrasing per ADR 0001; hardware/tolerance freeze
clarified v1.14 by ADR 0016; Windows-only scope directed v1.16 by ADR 0018.)

## Authority and starting state

- Governing documents: charter §3.1 and Phase 5; decisions
  [0001](../decisions/0001-non-cubic-grid-dimensions.md),
  [0002](../decisions/0002-dev-hardware-split.md), and
  [0016](../decisions/0016-phase5-hardware-backend-lanes.md), headless-runtime decision
  [0017](../decisions/0017-phase5-headless-runtime.md), and Windows-only scope decision
  [0018](../decisions/0018-phase5-windows-only-gate.md). Decision
  [0019](../decisions/0019-phase5-gg-dirichlet-ledger-conformance.md) defines the G-G
  Dirichlet gate, and decision
  [0020](../decisions/0020-floor-phase5-float32-smoother-drift.md) defines the binary32
  minimum-subnormal floor. Accepted decision
  [0021](../decisions/0021-bound-phase5-float32-two-cycles.md) defines the only bounded f32
  two-cycle convergence classification permitted by the port.
- Solver truth: [gg-machinery.md](../gg-machinery.md) and
  [attachment-kinetics.md](../attachment-kinetics.md), including the aggregate-v5
  convergence identity and `aggregate-hv-g1h1-v5` surface policy.
- Permanent controls: `GGSolver`, `LKSolver`, strict checkpoints, counter-based PRNG, morphology
  metrics, and accepted Phase 2–4 evidence. None may be deleted, weakened, or reinterpreted.
- `solver-gpu/` exists with its reviewed-design WP1 transport candidate. It contains no
  production diffusion or surface operator at the v2 freeze boundary.
- Gate lane: Ryzen 7 5700G / 64 GB / RTX 3080 10 GB Windows host, with the actual observed
  D3D12 backend recorded. Metal is deferred by decision 0018 and carries no current claim.
- Current local verification baseline: `npm test` passed 43 files / 793 tests at repository
  reconciliation; Phase 3 acceptance after that was documentation-only and Rule 7-clean.

## Approach

### 1. Freeze comparison meaning before writing WGSL physics

WP0 adds a reviewed conformance protocol to this plan before the first production shader lands.
It must name:

- exact small, dev-budget, and preview-budget `(nx, ny, nz)` fixtures, including non-cubic plate
  and column shapes, hexPrism masks, reflecting and fixed-σ far fields, seeds, noise streams,
  schedules, and stop rules;
- separate diffusion-only, full `GGThreshold`, and full `LibbrechtKinetics` comparisons;
- every compared raw field, ledger, convergence diagnostic, event record, and morphology metric;
- max-absolute, RMS, relative, occupancy, and derived-metric tolerances, with zero-denominator and
  near-threshold policies;
- the CPU float64 reference commit and the method used to derive float32 tolerances;
- exact adapter/backend/runtime provenance and artifact formats;
- adversarial negative controls that prove every gate criterion can fail independently.

Tolerance values come from an operation-count error analysis plus a CPU-side float32 shadow probe,
not from relaxing thresholds until a WGSL result passes. The probe and threshold rationale are
committed before implementation results are inspected. Any later tolerance relaxation requires
an ADR, invalidates comparison evidence, and reruns the Windows lane.

Fixtures that make an attachment decision numerically ambiguous are labeled stress diagnostics,
not used to excuse disagreement. Blocking fixtures keep CPU decisions a registered distance from
their threshold while separate near-threshold cases measure sensitivity honestly.

### 2. Port contracts in dependency order

The GPU package owns WebGPU resources and WGSL; `core/` remains the environment-neutral source of
lattice, state, parameter, PRNG, metric, and checkpoint contracts. Buffer layouts have one
host-side schema with checked byte sizes and generated or mechanically verified WGSL offsets.
The port order is:

1. adapter/limit negotiation, buffer ownership, masks, indexing, counter-based PRNG, readback for
   tests only, and no-op/copy negative controls;
2. one diffusion pass for each registered far-field condition;
3. complete `GGThreshold` cycles, including mass and noise witnesses;
4. complete `LibbrechtKinetics` relaxation/interface cycles, aggregate-v5 dual convergence,
   boundary-pixel fill, CFL, ledger, policy, and timeline semantics;
5. runner evidence and then app integration.

Each stage must pass CPU-oracle comparisons and independent review before the next stage starts.
An f32 result is compared by frozen tolerance, never described as bitwise-equivalent to float64.

### 3. Keep execution bounded and state GPU-resident

Large domains are divided into explicit bounded submissions. On the Windows preview protocol,
30 consecutive edit/step samples must have no device loss or uncaptured GPU errors, no measured
submission segment above 500 ms, and a p99 no higher than 250 ms. The UI must acknowledge an edit
within 100 ms and render the first valid post-edit state within 2 seconds on the Windows lane.
WP0 may tighten these numbers but may not weaken them without an ADR.

At ≈8M cells, simulation fields remain GPU-resident. The app may read back named probes, compact
metrics, evidence snapshots, and explicit checkpoint exports; it may not copy a full field to
JavaScript every display frame. Overlays and slices consume GPU buffers directly. Simulation
stepping is decoupled from display cadence.

Dev ≈1M and preview ≈8M are required. Detailed ≈30M and bake ≈130M are adapter-dependent targets,
not gate criteria. Unsupported requested modes fail with the observed limits and estimated memory
need rather than allocating partially or silently lowering resolution.

### 4. Keep one authenticated Windows evidence protocol

One frozen manifest drives the Windows lane. It publishes a canonical report, manifest, artifact
index, logs, error stream, and exit status. The aggregate gate accepts only the exact frozen
protocol and fixture hashes, authenticated commit, complete criterion set, and observed D3D12
result. The aggregate still independently reopens the lane bundle; a lane exit 0 is not the
Phase 5 claim.

Independent CPU fixture generation and comparisons run in parallel processes on the Windows host
when memory permits. Canonical GPU latency/watchdog measurements use one process per physical
adapter. Parallel GPU experimentation is non-gate work unless separately pre-registered.

The headless runtime choice is made in WP0 by a bounded capability spike. The browser and headless
paths must use the same solver package and WGSL; the GUI is not the solver's owner.

## Superseded WP0 two-lane freeze

The original machine-readable protocol id was `phase5-gpu-conformance-v1`; its canonical-JSON
SHA-256 was
`b62ec34cf118ebffbfd493203b68ff1028cf057f1b1736b5fc5028a87091ff09`. The separate fixture
and tolerance SHA-256 values are
`29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512` and
`96bf73b6e3a4f1937c86972f7cadf00766afdacc8f13c5efb5ab416184ce4053`. Decision 0018 supersedes
its two-lane acceptance meaning without rewriting that history. No canonical v1 lane bundle was
published.

## Accepted Windows-only v5 protocol repair

This section and `runner/src/phase5-protocol.ts` are the current Phase 5 pre-registration.
Decision 0019 superseded Windows v2 with v3 before canonical WP3 evidence. V2 remains immutable
history at id `phase5-gpu-conformance-windows-v2` and canonical-JSON SHA-256
`223428d864189130f675e5595e44325c0adccad90bb4484ed051910878984c5e`. V3 remains immutable WP3
development evidence at id `phase5-gpu-conformance-windows-v3`, canonical-JSON SHA-256
`ce1821df86461cbd7660cbb34c697071bd5d3822a4ca4def042245f569d61e98`, and tolerance-manifest
SHA-256 `1e77ed673e77aba6598c2bdd56e6b80f0f59343067bd7cb2c677d220d2fc05ba`.

Before production LK WGSL existed, decision 0020 superseded v3 for final evidence because the
relative-only binary32 smoother-drift bound did not cover legal subnormal input. The v4
machine-readable id is `phase5-gpu-conformance-windows-v4`; its canonical-JSON SHA-256 is
`62f6f940a38a477dd34b6fd53687808708f7ccf89d6f59eccc8cb7960ccc8688`. The fixture manifest
is `29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512`. Its
tolerance-manifest SHA-256 is
`c0062a8b9c2d01ed8fba7d43ad64f3da7a6dc931f50265257b545de665281866`; the only new value is
the binary32 minimum subnormal `2^-149` used by the smoother-drift bound. Every fixture,
CPU-vs-GPU field/scalar tolerance, decision margin, performance threshold, and non-LK criterion
is unchanged. V4 retains decision 0019's `corrected-mass-invariant-v1` G-G Dirichlet ledger
policy and blocking-only `NC-TOLERANCE-BYPASS`.

Production D3D12 execution then disproved v4's history-local feasibility premise before final
WP4 evidence: cold fixture step 3 enters an exact two-cell, one-ULP, period-two orbit while
divergence is zero and every other numerical guard passes. Decision 0021 therefore adopts
`phase5-gpu-conformance-windows-v5`. V5 keeps every fixture and configured tolerance unchanged,
adds exact period-two / maximum-one-ULP evidence, raises the LK allocation from 60 to the
already-frozen 64 bytes/cell ceiling, and changes no CPU or aggregate-v5 physics meaning. The
accepted canonical-JSON aggregate SHA-256 is
`bdc61bfe5cb48e9e29f5b79337036d7b23ec11e1677f1657595d00f5e7de91ec`; its tolerance-manifest
SHA-256 is `d38ec0f7a0096dc297d651cd1b89fb80275edb4098c16545c44274e585c2a09b`;
the fixture SHA-256 remains
`29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512`. Same-reviewer acceptance
of exact repair `79ec3222bb9f74329968728072fdca9d9d4e6138` returned zero blockers and zero should-fixes.

Any later change to a blocking fixture, tolerance, decision margin, performance threshold,
criterion, negative control, runtime revision, or evidence meaning requires an ADR and
invalidates the Windows bundle. WP1–WP3 closures remain valid, but their canonical probes must
replay under exact final v5 identity before WP7 publication.

The superseded v2 freeze candidate passed exact root `npm test` in 371.8 seconds: Rule 7 clean over 178
files, both TypeScript projects green, and 46 files / 816 tests passed. The app production build
transformed 33 modules and exited 0. The protocol test independently recomputes all three
canonical hashes, requires exactly one Windows lane, requires exactly 16 criteria, rejects the
removed Metal/cross-backend criteria, and preserves one uniquely owned negative control per
criterion.

The historical v3 authority/protocol freeze is commit
`70f85e15babc9eae8e13b93c2442babe14b63a23`; the superseded v2 freeze is
`60be8c0f14b44c1f5bf1b2753c409baad3da0833`. From the v2 tracked-clean commit, the canonical
capability and WP1 probes independently recorded the same commit and clean tree, observed D3D12,
exited 0, and reported zero uncaptured errors. WP1 retained 0 coordinate/copy/PRNG mismatches,
3,366 detected axis-swap mismatches, and zero blocking-allocation failures.

### Baseline and host capability record

The tracked-clean pre-WP0 baseline was commit `4c093fea9fb86a8f905c3a754cd79c6687816514`.
Exact `npm test` on the Windows host exited 0 in 356.59 seconds: Rule 7 clean over 161 files,
both TypeScript projects clean, and 43 files / 793 tests passed. A first wrapper invocation hit
its 120-second caller timeout; it left no child process and is not a test outcome. The successful
uncontended rerun is the baseline.

Decision [0017](../decisions/0017-phase5-headless-runtime.md) freezes Playwright `1.61.1` and
its lockfile-pinned Chromium revision `1228` as the headless runtime. The canonical capability
probe is:

```text
node app/scripts/phase5-capability.mjs
```

On Windows it measured:

| Item | Observed value |
|---|---|
| OS | Windows 11 Home, `10.0.26200`, x64 |
| CPU / memory | AMD Ryzen 7 5700G, 8 cores / 16 logical processors, 68,502,585,344 bytes |
| GPU | NVIDIA GeForce RTX 3080, Ampere, device `0x2206`, discrete |
| Driver | NVIDIA `32.0.15.9186` (`591.86`), D3D12 shader model 6.6 |
| Dedicated heap | 10,541,334,528 bytes reported by Chromium; `nvidia-smi` reports 10,240 MiB |
| Runtime | Playwright 1.61.1, Chromium revision 1228, Chrome/149.0.7827.55 |
| Backend | **D3D12 observed** through the development-only adapter provenance field |
| Features | `timestamp-query` present; one timestamped compute dispatch completed |
| Error capture | an intentionally oversized buffer produced a scoped `GPUValidationError`; zero uncaptured errors |
| Adapter maxima | buffer 2,147,483,648; storage binding 2,147,483,644; 16 storage buffers/stage; workgroup storage 32,768; 1,024 invocations |
| Requested device limits | buffer 268,435,456; storage binding 134,217,728; 8 storage buffers/stage; workgroup storage 16,384; 256 invocations; workgroup X 256; 65,535 workgroups/dimension |

The same probe also passed under auto-updating system Chrome 150.0.7871.182, but that candidate is
not canonical because its revision is not lockfile-bound. Node v24.13.1 exposes no WebGPU and
Deno is absent.

Final exact root `npm test` on the WP0 source state exited 0 in 377.6 seconds: Rule 7 was clean
over 166 files, both TypeScript projects passed, and 44 files / 802 tests passed. This is a
regression result, not Phase 5 gate evidence. The WP0 freeze is commit
`f2373bea9294947aa501805e4299ea08d829878f`; the canonical capability probe rerun from that
tracked-clean commit passed with bundled Chrome/149.0.7827.55, observed D3D12, completed
timestamp dispatch, captured validation error, and zero uncaptured errors.

**Deferred Metal history:** at WP0 the M4 was unreachable and every Metal capability remained
unobserved rather than guessed. Decision 0018 now defers that work to another machine and removes
it from this gate. The old absence is not a failure of the Windows v2 protocol, and the Windows
bundle is never relabeled as Metal.

### Resolution and memory budgets

Every budget is a morphology-shaped triple. Dev and preview are blocking on Windows; detailed
and bake are capability-reported only.

| Budget | Plate `(nx,ny,nz)` / cells | Column `(nx,ny,nz)` / cells | Disposition |
|---|---|---|---|
| dev | `128×128×64` / 1,048,576 | `80×80×160` / 1,024,000 | blocking |
| preview | `400×400×50` / 8,000,000 | `160×160×320` / 8,192,000 | blocking |
| detailed | `800×800×48` / 30,720,000 | `320×320×300` / 30,720,000 | capability-reported |
| bake | `1600×1600×52` / 133,120,000 | `640×640×320` / 131,072,000 | capability-reported |

WP0 reserves a conservative planning ceiling of 64 GPU bytes per cell plus 256 MiB of
non-cell/transient storage. It is an allocation guard, not a promised WP1 layout. Under it,
preview needs at most 780,435,456 bytes (plate) / 792,723,456 bytes (column). WP1 must publish
its exact per-buffer schema and remain under this ceiling. The Windows requested device limit
admits a 32,768,000-byte preview field and a 122,880,000-byte detailed field, but not a
532,480,000-byte bake field; bake is therefore currently reported unsupported under the
canonical device request even though the aggregate dedicated heap is larger. The runner must
state the failed limit and estimated bytes rather than silently lower dimensions or request a
different gate device.

### Exact conformance fixtures

All `hexPrism` fixtures use the canonical radius-2, thickness-1, 19-site seed. Stop rules are
caps for conformance, never habit claims. The complete JSON-safe records, including every seed
and scalar, live in `PHASE5_FIXTURES`; this table is the readable index.

| Id | Contract | Frozen controls |
|---|---|---|
| `layout-noncubic-box-17x19x11` | layout/round trip | box, seedless, counter-hash u32/f32 pattern, seed `0x13579bdf`, one round trip |
| `diff-small-reflecting-hex-29x31x17` | diffusion | plate controls, reflecting, noise 0, drift 0, seed `0x13579bdf`, compare passes 1 and 64 |
| `diff-small-dirichlet-noise-drift-31x29x21` | diffusion | dendrite controls, Dirichlet, noise `1e-5`, drift `0.01`, seed `0x2468ace0`, compare passes 1 and 64 |
| `diff-dev-plate-reflecting-128x128x64` | dev diffusion | plate, reflecting, noise/drift 0, seed 1, one pass |
| `diff-dev-column-dirichlet-80x80x160` | dev diffusion | needle, Dirichlet, noise/drift 0, seed 1, one pass |
| `gg-plate-reflecting-48x48x24` | full `GGThreshold` | plate, reflecting, noise/drift 0, seed 1, 256 completed cycles |
| `gg-column-dirichlet-noise-timeline-32x32x64` | full `GGThreshold` | needle, Dirichlet, noise `1e-5`, seed `0xdecafbad`; at completed cycle 64 atomically switch to plate controls; stop 128 |
| `lk-warm-dirichlet-24x24x18` | full `LibbrechtKinetics` | aggregate v5, −5 °C, fixed `0.002`, `dx=0.35 µm`, 1 atm, `CAK_A1`, fill-CFL `0.1`, `1e-9` residual, `1e-7` divergence, 200,000 sweep cap, seed 1, noise 0, four interface steps |
| `lk-cold-dirichlet-noise-timeline-18x18x30` | full `LibbrechtKinetics` | same controls at −15 °C, noise `0.001`, seed `0x10203040`; after step 2 atomically change to −5 °C at fixed `0.002`; stop 4 |
| `lk-reflecting-diagnostic-17x19x15` | LK diagnostic | aggregate v5, −15 °C, reflecting, `1e-7` residual, 50,000 sweep cap, seed 1, noise 0, one interface step; no physical claim |

Four non-blocking stress fixtures deliberately approach G-G attachment, LK fill, nonlinear Robin,
and signed-subsaturation seams: G-G slot 2 uses threshold `0.02` with post-freeze mass
`0.019975/0.020025`; LK uses fill `0.99996` with increments `0.00003/0.00005`; the nonlinear
prism probe uses −15 °C and opposing values `1e-8/1e-6/1e-4/0.002`; and its signed companion
uses `−0.002/−1e-8/0`. They report sensitivity and may disagree; they cannot excuse a
blocking-fixture mismatch.

Blocking attachment decisions must be exact. Before comparison the CPU harness proves every
G-G boundary-mass decision is at least `4e-4` from its threshold and every LK fill decision is
at least `4e-4` from saturation. If a blocking fixture violates its margin, the fixture is
invalid and the gate fails by configuration; the tolerance is never used to vote an occupancy
bit. Noise streams, timeline event indices, event records, stop reasons, and attachment deltas
are exact discrete comparisons. The committed shadow audit observed minimum margins
`0.002877725076560811` for G-G and `0.6` for LK across the blocking fixtures.

### CPU state, report, and ledger inventory

The comparison harness owns this complete inventory; a field omitted from a convenient
checkpoint is not omitted from conformance:

- `GGSolver`: dimensions, tick, complete parameter bundle, seed/noise/far-field/domain/center;
  `a`, `b`, `d`, wall/active mask, far-field set, boundary membership/order, uncapped `nT/nZ`,
  attached count, last attachment delta, maintained bounds, active-cell/domain extents,
  Dirichlet meter, cycle state, `RelaxationReport`, `SurfaceReport`, `LedgerReport`, stop reason,
  event log, all morphology metrics, and generated noise witnesses. Scratch/ping-pong ownership
  is compared by stage hashes and the stale-buffer negative control rather than checkpointed.
- `LKSolver`: all shared identity fields plus surface policy; temperature, far-field target,
  spacing, pressure, parameter set, fill-CFL, residual/divergence controls, sweep cap, physical
  time, temperature-derived scales, `a`, `f`, `sigma`, wall/active mask, Dirichlet set, boundary
  membership/order, uncapped `nT/nZ`, cached `(sigmaOpp,sigmaB,alphaHK)` boundary tuple, attached
  count/delta/bounds, maximum fill velocity, fill ledger in ice-cell and step-local vapor units,
  saturation clipping, hole-fill count/deficit, last accepted relaxation, cycle state,
  temperature-segment ledger state, event/density-transform/reservoir records, stop reason, and
  all morphology metrics.
- Every relaxation comparison includes sweeps, convergence classification, residual, divergence
  residual, shell clamp, signed surface exchange, aggregate-v5 smoother drift, its independent
  bound, and minimum local exchange. Every surface comparison includes attachment count/delta,
  maximum kinetic fill, hole fills, physical time increment, stalled state, and unconverged
  skip. Claims remain operator-specific exactly as `SurfaceOperator` defines them.

The GPU may derive compact boundary/topology records, but the gate independently reconstructs
them from raw occupancy, masks, and fields. A report agreeing with itself is not evidence.

### Binary32 shadow and tolerance derivation

`node runner/src/phase5-shadow.ts` is the committed pre-GPU probe. It has three deliberately
separate parts:

1. an independent G-G diffusion kernel with `Math.fround` after each WGSL-shaped operation,
   including noise, drift, both far fields, canonical pair summation, and 64-pass accumulation;
2. full CPU-oracle G-G/LK pairs with binary32 storage quantization at each public
   `SurfaceOperator` stage; this measures persistent-state accumulation without pretending the
   CPU implementation is a shader;
3. 516 scalar basal/prism kinetics samples over −5/−15 °C and surface supersaturation
   `1e-8…≈0.025`, with binary32-rounded nonlinear inputs and outputs.

On Node v24.13.1 / V8 13.6.233.17-node.40 all blocking measurements passed the frozen envelope.
Worst measured values were:

| Probe | max abs | RMS | max relative | Discrete result |
|---|---:|---:|---:|---|
| 64-pass noisy/drifting diffusion | `2.2564835e-7` | `9.6978718e-8` | `2.2592954e-6` | n/a |
| full G-G `b` | `8.5486990e-7` | `1.8520768e-8` | `5.2199421e-7` | 0 occupancy mismatches |
| full G-G `d` | `7.5324793e-9` | `2.3051921e-9` | `3.9147933e-7` | same attached counts |
| full LK `sigma` | `1.1636765e-10` | `5.8357387e-11` | `5.8939124e-8` | 0 convergence/occupancy mismatches |
| full LK `f` | `1.6549412e-8` | `4.9562783e-10` | `7.0281913e-8` | same attached counts |
| LK ledgers | abs `0.10206988` at large vapor-unit scale | n/a | `3.2100125e-8` | mixed scalar bound passed |
| scalar kinetics | `4.5284334e-8` | n/a | `4.2309360e-6` | 516/516 finite |

Frozen field tolerances intentionally sit above the measured shadow because WGSL adds
per-operation contraction, reductions, and backend compiler variation:

| Compared field | max abs | RMS | max relative | Relative denominator floor |
|---|---:|---:|---:|---:|
| diffusion `d` | `2e-6` | `2e-7` | `2e-4` | `1e-5` |
| G-G `b` | `5e-5` | `5e-6` | `1e-3` | `1e-5` |
| G-G `d` | `5e-5` | `5e-6` | `1e-3` | `1e-5` |
| LK `sigma` | `2e-6` | `2e-7` | `2e-3` | `1e-6` |
| LK `f` | `5e-5` | `5e-6` | `1e-3` | `1e-5` |

All three field statistics must pass. Relative error is evaluated only where the CPU magnitude
meets the listed floor; smaller/zero values remain subject to absolute and RMS bounds. Any
non-finite value fails before statistics. Scalars use the mixed bound
`|gpu-cpu| <= 1e-4 + 2e-4*|cpu|` with denominator floor `1e-8`; this avoids both zero division
and the erroneous requirement that a million-scale vapor-unit ledger differ by less than
`1e-4`. Field-derived metrics have max absolute `1e-4`. Occupancy-derived integer/boolean
metrics, exact symmetry, decisions, event records, and stop reasons require equality.

The Windows lane must independently pass the CPU oracle using the unchanged field and scalar
tolerances above. There is no cross-backend multiplier or triangle comparison in v4.

Aggregate-v5 keeps dual convergence with the fixture's unchanged `relaxTol` and `divTol`. The GPU
meters binary32 smoother drift directly and uses a deterministic pairwise/tree reduction—no
unordered floating atomic. Under decision 0020, its independent nonzero-field bound is
`64 * activeCellCount * max(2^-23 * maxAbsSweepInput, 2^-149)`; an exact zero field has bound
zero. The host computes this bound in binary64 from the independently reduced binary32 maximum,
so the floor cannot underflow in a shader. The factor covers the 12 rounded split-smoother
operations plus a bounded tree depth. Changing the reduction shape invalidates the factor. This
is a GPU conformance diagnostic; it does not alter the CPU oracle's decision-0014 binary64 bound.

### Checkpoint conversion contract

There is no GPU-only checkpoint meaning and no change to accepted GG v1 or LK v2 wire semantics.

- CPU→GPU imports strictly decode through `core`, validate all metadata and field lengths, then
  round each f64 field value once to nearest-even f32. Occupancy and metadata remain exact.
- GPU→CPU exports happen only on an explicit checkpoint/evidence request. They read back the
  complete state once, widen every f32 value exactly to f64, and encode through the existing
  GG v1 or LK v2 codec. The enclosing Phase 5 manifest records the f32 producer, runtime, and
  backend; frozen legacy headers are not extended or counterfeited.
- Decoding that export into the CPU oracle must preserve every original f32 bit on a
  widen→encode→decode→round-to-f32 loop, preserve occupancy and controls exactly, and reproduce
  the exported raw state within the field tolerances. Normal display frames never use this path.

If later resumable GPU state needs additional mutable caches beyond existing checkpoint meaning,
that is a new checkpoint version and ADR, not a hidden Phase 5 extension.

### Performance and residency protocol

Both preview shapes run separately on the Windows adapter. Each case has 5 untimed warmups
followed by 30 consecutive edit/step samples, one process on the physical adapter:

- every bounded submission segment is timestamped and must be ≤500 ms; p99 over the 30 measured
  samples is the nearest-rank 30th value and must be ≤250 ms;
- edit acknowledgement is monotonic wall time from a registered UI edit event to acceptance of
  its new generation id by the solver command queue, ≤100 ms every sample;
- first valid post-edit frame is wall time from that edit to a rendered frame whose generation
  id matches and whose GPU work has completed, ≤2,000 ms every sample;
- device loss, uncaptured errors, hidden retries, dropped edits, stale-generation frames, and
  submission-bound violations are all zero-tolerance failures;
- the readback audit records every buffer-copy purpose and byte count. Per display frame the
  allowed full-field readback count is exactly zero. Named probes, compact metrics/timestamps,
  explicit evidence snapshots, and explicit checkpoint export are the only allowed readbacks.

The two preview morphologies use the same edit script: change one valid operator control, apply
one valid abrupt environment event at a completed boundary, step, move the slice, and request
named probes. Timing begins before the edit dispatch. CPU oracle generation and independent
fixture preparation may use parallel processes; canonical GPU timing never shares an adapter
with another GPU workload launched by the gate.

### Evidence schema and commands

The future per-host flagless lane command is:

```text
node runner/src/main.ts gate5-lane
```

It detects and verifies the observed D3D12 backend, writes only the
`out/phase5/windows-d3d12/` bundle, and exits 0 only for a complete valid lane. A lane exit 0 is
not the Phase 5 claim. The one aggregate flagless gate is:

```text
node runner/src/main.ts gate5
```

Only aggregate exit 0 is the Phase 5 claim. The aggregate command requires the Windows bundle's
exact repository commit, protocol hash, fixture hash, tolerance hash, solver-source hashes, and
runtime revision; independently reopens every artifact; re-derives all criteria; and publishes
`out/phase5/gate5-report.json` plus
`out/phase5/gate5-artifact-index.json`.

Each lane is a canonical UTF-8/no-BOM JSON and binary graph, atomically staged and indexed by
SHA-256 using the hardened Phase 4 publication discipline. `PHASE5_EVIDENCE_SCHEMA` freezes the
lane-manifest, lane-report, artifact-index, comparison, and aggregate-report discriminants at
their `*-v1` names, requires little-endian binary payloads, and names atomic staging/rename:

```text
lane-manifest.json
lane-report.json
artifact-index.json
stdout.log
stderr.log
exit-status.txt
fixtures/<fixture-id>/config.json
fixtures/<fixture-id>/cpu-reference.ckpt
fixtures/<fixture-id>/gpu-export.ckpt
fixtures/<fixture-id>/comparison.json
fixtures/<fixture-id>/events.json
fixtures/<fixture-id>/timing.json
fixtures/<fixture-id>/readback.json
```

The manifest owns exact host/runtime/adapter provenance; hashes of the protocol, fixtures,
tolerances, `core`, both CPU solvers, future GPU source/WGSL, and all configs; start/end times;
and every expected artifact name/hash/size. The report contains the exact criterion set and raw
measurements, never only a claimed verdict. Missing, extra, noncanonical, aliased, hard-linked,
mutated, stale, or mixed-commit artifacts fail closed and publish no aggregate.

The exact aggregate criterion names are:

```text
P5-WINDOWS-PROVENANCE     P5-PROTOCOL-MATCH          P5-ADAPTER-LIMITS
P5-LAYOUT-INDEXING        P5-DIFFUSION               P5-GG-THRESHOLD
P5-LIBBRECHT-KINETICS     P5-SYMMETRY                P5-DOMAIN-SAFETY
P5-DISPATCH-SAFETY        P5-EDIT-ACK                P5-FIRST-VALID-FRAME
P5-RESIDENCY              P5-CHECKPOINTS             P5-NEGATIVE-CONTROLS
P5-PUBLICATION
```

`PHASE5_NEGATIVE_CONTROLS` registers one uniquely owned mutation per criterion: Windows backend
relabeling, protocol-hash shift, required-limit downgrade, axis swap, wrong boundary clamp,
stale ping-pong state, residual-only LK convergence, symmetry-bit flip, accepted domain contact,
excessive dispatch, late acknowledgement, late valid frame, full-field frame readback,
checkpoint dtype/length/endianness shift, tolerance bypass, and post-publication artifact
mutation. Per ADR 0022 (protocol v6), WP5 must execute each mutation at its named boundary and
require the OBSERVED failing set to contain its registered owner — real evidence is
cross-linked, so more than one criterion may legitimately notice (the v5 sole-criterion rule
was satisfiable only by asserting a singleton, which is how the hardcoding the reviewer
rejected arose). The runner re-derives every control's outcome from the published payloads.

## Gate contract

WP0 supplies exact subcriterion names and numerical tolerances, but it may not remove any row:

| Area | Blocking claim |
|---|---|
| Provenance | The Windows bundle authenticates commit, protocol, fixtures, adapter, observed backend, OS, runtime, and exposed driver |
| Adapter limits | Required limits are requested explicitly; supported budgets allocate exactly; unsupported budgets fail clearly |
| Layout/indexing | Non-cubic D6h indexing, active masks, field offsets, and ping-pong ownership match `core` |
| Diffusion | One-pass and repeated-pass fields agree with the CPU oracle under both far-field conditions |
| `GGThreshold` | Full cycles agree on fields, attachment decisions, mass ledger, noise witness, metrics, and stop reason |
| `LibbrechtKinetics` | Full cycles agree on field/surface state, convergence classification, fill-CFL, ledger, policy, events, metrics, and stop reason |
| Symmetry/domain | Registered noise-off fixtures retain exact occupancy symmetry and no evidence run contacts its domain |
| Dispatch safety | Preview submissions meet the frozen bound with no device loss, uncaptured error, or hidden retry |
| Interactivity | ≈8M cells meet the edit acknowledgement and first-valid-render thresholds on Windows |
| Residency | Preview rendering performs no per-frame full-field readback; probes and metrics remain explicit |
| Checkpoints | Exported state uses strict `core` codecs and round-trips into the CPU oracle within the frozen conversion contract |
| Negative controls | Axis swaps, stale ping-pong state, wrong boundary clamps, shader perturbations, skipped passes, forged provenance, tolerance bypass, excessive dispatch, and full-field readback each fail by name |

The gate is a flagless runner command to be named and frozen in WP0. Exit 0 is the aggregate
claim; printed metrics from exploratory runs are not gate evidence. The canonical gate is not run
until all preconditions and regression controls pass on tracked-clean commits.

## WP1 package/transport design

This is an implementation design downstream of the immutable WP0 manifest; it changes no
fixture, tolerance, criterion, lane, or evidence meaning.

- `solver-gpu/` is an environment-neutral browser package depending only on `@vcc/core`.
  It owns WebGPU resources, WGSL, checked layouts, and command submission. It has no Node I/O,
  no Three.js dependency, and no CPU-solver dependency.
- Grid uniforms are one 48-byte, 16-byte-aligned record: `dims: vec3<u32>`, `cellCount`,
  `plane`, `baseCell`, `generation`, `rngSeed`, `tick`, `streamId`, and two reserved words.
  Host offsets and the WGSL declaration are asserted together.
- Every per-cell buffer is a structure-of-arrays element of exactly four bytes. Shared buffers
  are occupancy, wall, packed topology, boundary indices, two scalar scratch buffers, noise,
  reduction, and render flags (36 bytes/cell). G-G adds separately named boundary-mass and two
  vapor ping-pong buffers (48 bytes/cell total). LK adds separately named fill, two
  supersaturation ping-pong buffers, boundary attachment coefficient, boundary supersaturation,
  opposing supersaturation, and decision 0021's f32 two-sweep reference (64 bytes/cell total).
  The separate names preserve the operator-specific field meanings and meet WP0's 64-byte
  ceiling exactly.
- A shader pass binds at most eight storage buffers. Allocation validation checks safe integer
  products, 4-byte alignment, per-buffer limits, aggregate bytes, operator tag, and exact
  dimensions before creating anything. Failed construction destroys every buffer already
  created. Explicit destruction is idempotent and generation-scoped.
- One dispatch range covers at most 16,384 workgroups of 256 cells, or 4,194,304 cells. Larger
  domains become ordered ranges with explicit `baseCell`; the last range is bounds-checked.
  This stays below the frozen adapter limit and gives later physics passes a fixed bounded
  submission seam without claiming that cell count alone proves the timing gate.
- The WP1 shaders are transport-only: coordinate-hash, exact u32 copy, and counter-PRNG parity.
  The PRNG is a direct u32 WGSL transcription of `core/hashCounter`; no sequential state exists.
  Production diffusion remains forbidden until WP2.
- Readback requires a named purpose, byte range, and generation. The audit rejects full-field
  display-frame reads, records every requested/copied byte, and permits only test, named-probe,
  compact-metric, evidence-snapshot, or explicit-checkpoint purposes.
- WP1 closes when pure tests cover layout/overflow/budget/resource/submission/readback failures
  and the pinned Chromium probe on the RTX 3080 runs the non-cubic coordinate fixture, exact
  copy, counter-PRNG parity, dev/preview allocations, bounded ranges, and the axis-swap plus
  required-limit negative controls with zero uncaptured errors, followed by clean review.

### WP1 Windows implementation result

The environment-neutral `@vcc/solver-gpu` implementation at
`1a2c2a4900a7952f92130f4cefc075627043fdca` now exists downstream of its committed design
freeze. It provides the frozen structure-of-arrays plans, checked non-cubic index ABI,
uniform encoder/WGSL declaration, exact counter-PRNG transcription, word-copy transport,
capability and allocation rejection, generation-scoped resource/submission ownership, bounded
dispatch ranges, and audited readback. No diffusion or surface-operator shader exists.

On the registered Windows host, `node app/scripts/phase5-wp1.mjs` used the pinned Playwright
Chromium and observed D3D12. Coordinate mapping had 0/3,553 mismatches; the injected j/k mutation
had 3,366 mismatches and exactly matched the independently computed mutated output; mixed u32/f32
bit-copy had 0/4,096 mismatches; and counter-PRNG output had 0/3,553 mismatches. All eight
dev/preview GG/LK allocation cases succeeded sequentially, both preview dispatch plans were
contiguous with at most 16,384 workgroups/range, the required-limit and full-field-display-frame
negative controls failed closed, and uncaptured GPU errors were zero. Detailed and bake support
was capability-reported from observed limits only; it is not acceptance evidence.

After provenance binding, both canonical probes reran at tracked-clean
`27f69994696ac486a689b5aeada8f7b83f0214ef`. The capability report and WP1 report independently
recorded that exact commit and a clean tree, passed with the same observed D3D12 backend, and
reported zero uncaptured errors; the WP1 report retained the exact counts above.

Exact root `npm test` then exited 0 in 357.4 seconds: Rule 7 was clean over 177 files, both
TypeScript projects passed, and 46 files / 816 tests passed. `npm run build -w app` transformed
33 modules and exited 0. Decision 0018 removes the former Metal replay precondition without
changing any WP1 implementation or numerical check. Review remains required before the WP1
checkbox closes and WP2 starts.

### WP1 independent review round 1 and remediation

Independent review of clean handoff `5707708f686652f3f35f3f989d8a46f0d8ee8c43` rejected WP1
with five blockers and three should-fixes. The blockers were: readback trusted caller-declared
full-field state and accepted arbitrary runtime purposes; the dispatch override exceeded the
frozen 16,384-workgroup ceiling; an edit could make a submission stale while it was in flight
without preventing a success record; forged operator/layout/schema plans could reach allocation
and duplicate names could orphan a buffer; and the browser probe classified allocation support
from adapter maxima rather than the negotiated device limits. The should-fixes were that the
real D3D12 path never executed a nonzero `baseCell`/multi-range dispatch, the probe bypassed the
production device/arena/submission/readback APIs, and `PROGRESS.md` retained a stale charter
version line.

The remediation candidate derives full-field status from the actual source buffer, validates
the runtime purpose allowlist, caps every planner entry point at 16,384 workgroups, rechecks
generation after GPU completion, validates the exact canonical buffer schema before any
allocation, and preflights the negotiated device limits. Its Vite-served browser probe imports
and exercises `requestCheckedGpuDevice`, `GpuBufferArena`, `GpuSubmissionController`, and
`readGpuBuffer` from the production package. On the real D3D12 device, the provisional dirty-tree
run retained zero coordinate/copy/PRNG mismatches, executed 14 coordinate ranges including 13
nonzero bases, recorded 17 production submissions and four audited readbacks, rejected both
forbidden readback attempts, passed all eight blocking arenas, rejected all four bake/operator
combinations from the negotiated 256 MiB/128 MiB limits, and reported zero uncaptured errors.
Exact root `npm test` then exited 0 in 369.5 seconds: Rule 7 was clean over 178 files, both
TypeScript projects passed, and 46 files / 819 tests passed. The app production build transformed
33 modules and exited 0. This is repair evidence only: the session's read-only Git metadata
prevented creation of the repair commit, so canonical clean probes and a same-reviewer
zero-finding recheck are still required before WP1 closes.

Same-reviewer round 2 closed six of the original eight findings but rejected the candidate with
two blockers. First, two display-frame reads could cover separate halves of one source because
the audit had no frame/source identity or cumulative coverage. Second,
`NC-REQUIRED-LIMIT-DOWNGRADE` still mutated an advertised adapter limit only; it did not prove
that the production request boundary rejects an omitted or lowered required limit.

The round-2 repair replaces the caller boolean with an audit-issued active-frame token, derives
stable source identity from the actual `GPUBuffer`, merges per-frame byte intervals per source,
and rejects any request whose cumulative coverage reaches the full source. The production device
request now compares its exact requested feature/limit set with the frozen policy before
capability validation or `requestDevice`. Unit negatives prove two half-source reads reject and
that omitted/downgraded limits never call the adapter. Both typechecks and focused tests 19/19
pass. The provisional real-D3D12 probe records five successful production readbacks (the four
tests plus the allowed first half), rejects the second half and the direct full-field attempt,
rejects both exact request mutations, retains 17 bounded submissions and zero numerical
mismatches, passes all eight blocking arenas, rejects all four bake/operator cases from the
negotiated limits, and reports zero uncaptured errors. Full root verification and same-reviewer
round 3 remain pending; Git metadata is still read-only. Exact root `npm test` then exited 0 in
366.9 seconds: Rule 7 was clean over 178 files, both TypeScript projects passed, and 46 files /
821 tests passed. The app production build transformed 33 modules and exited 0.

Same-reviewer round 3 rejected one surviving caller-classification seam: after beginning an
active audit frame, a caller could omit the token and receive a full-field readback classified
as non-display. The round-3 repair makes audit state authoritative: while a display frame is
active, every readback must carry that exact token; a token is also invalid outside its active
scope. The pure omission attack, both typechecks, and focused tests 19/19 pass. The provisional
real-D3D12 probe now rejects direct full-field, cumulative two-chunk, and active-token-omission
attacks, as well as both frozen request mutations, while retaining five successful audited
readbacks, every exact numerical/allocation result, and zero uncaptured errors. Exact root
`npm test` then exited 0 in
367.7 seconds: Rule 7 was clean over 178 files, both TypeScript projects passed, and 46 files /
821 tests passed. The app production build transformed 33 modules and exited 0.

Same-reviewer round 4 is **ACCEPTED with zero blockers and zero should-fixes**. The reviewer
independently replayed focused tests 19/19 and the real RTX 3080 D3D12 probe, confirmed every
original and follow-up finding closed, and observed zero numerical mismatches, 17 bounded
submissions, five accepted readbacks, every residency/request mutation rejected, all eight
blocking arenas passing, bake rejected from negotiated limits, and zero uncaptured errors.
`git diff --check` also passes. This acceptance covers the code diff only. Ten tracked files
remained modified at base `5707708f686652f3f35f3f989d8a46f0d8ee8c43` because the primary
workspace could not write `.git/index.lock`. At the operator's direction, an isolated clone under
the ignored `out/worktrees/` boundary committed the exact reviewed diff as
`afd94078e515236124bace82ff263390d80609f9`.

Both canonical probes then ran serially from that tracked-clean commit and exited 0. The
capability probe recorded clean provenance, observed D3D12, completed the timestamped dispatch,
captured the scoped validation error, and reported zero uncaptured errors. The WP1 probe recorded
the same clean commit and backend; coordinate/copy/counter-PRNG mismatches were 0, the axis-swap
negative produced 3,366 mismatches, all 14 real coordinate ranges including 13 nonzero bases
passed, 17 production submissions and five accepted readbacks were audited, every
residency/purpose/request mutation rejected, all eight blocking arenas passed, all four
bake/operator cases rejected from negotiated limits, and uncaptured errors were zero. The same
reviewer's final provenance audit accepted the commit/tree/blob identity, object integrity, and
both complete probe predicates with zero blockers and zero should-fixes. No WP2 code began before
that clean closure.

## WP2 diffusion design

WP2 ports only the G-G masked-average diffusion contract used by the four frozen diffusion
fixtures. It does not port freezing, attachment, melting, an LK Robin boundary, convergence
classification, metrics, checkpoints, or app ownership. The unchanged float64 `GGSolver` remains
the oracle, and `runner/src/phase5-shadow.ts` remains the independently written binary32
operation-order witness. Neither implementation is shared with the production WGSL.

The production pass owns these exact stages:

1. when `noiseEpsilon > 0`, generate the counter-hash bit for
   `(rngSeed, cellIndex, tick, STREAM_NOISE_XI)` and write `(1 - xi) * source` plus the refusal
   coefficient to GPU-resident buffers;
2. compute the canonical in-plane seven-point average into `scratchScalarA`, including the
   sorted three opposite-direction pair sums and centre-value reflection at attached cells,
   inactive walls, and domain faces;
3. compute the vertical `4/7` plus `3/14` split into `scratchScalarB`, with the same reflecting
   rule;
4. when `phi > 0`, apply the specified downward drift from `scratchScalarB` into
   `scratchScalarA`;
5. commit into the opposite G-G vapor buffer, restore `xi * source` when noise is active, and
   zero every blocked cell; then, and only then, clamp the active fixed-σ shell to `rho` for a
   Dirichlet fixture.

Each published pass ends in the opposite `ggVaporA`/`ggVaporB` buffer, and repeated passes use
that completed destination as the next source. The active-buffer identity is explicit host state;
there is no in-place update or implicit parity guess. Occupancy, wall, and shell masks are
uploaded separately and validated for exact length, binary values, disjoint attached/wall
membership, and active-only shell membership. Options are snapshotted and validated before any
GPU allocation or upload. A pre-upload failure destroys every WP2-owned resource and leaves the
caller arena reusable. Once arena upload begins, any queue/device failure destroys that arena
rather than exposing partially initialized buffers for silent reuse.

WP2 reuses WP1’s bounded dispatch ranges and generation-scoped submission controller. Every
range receives immutable uniform bytes, so a later `queue.writeBuffer` cannot silently retarget
an already encoded range. The same production pipelines and buffer graph serve all four frozen
fixtures; the D3D12 probe may compile a separately labeled mutated clamp shader only for
`NC-WRONG-BOUNDARY-CLAMP`. No runtime flag, public option, or fallback permits production code to
skip or move the clamp.

WP2 closes only when:

- pure tests independently exercise mask/input rejection, non-cubic neighbors, attached/wall/face
  reflection, canonical pair ordering, counter-noise, drift, clamp order, ping-pong ownership,
  repeated passes, bounded ranges, generation mismatch, and teardown;
- the pinned Chromium probe on the RTX 3080 observes D3D12 and compares the complete vapor array
  after every registered pass count for all four frozen fixtures against the unchanged float64
  oracle using `PHASE5_FIELD_TOLERANCES.diffusionD`;
- the real-device wrong-clamp mutation exceeds at least one frozen field tolerance while the
  production path passes the same Dirichlet case;
- zero device losses, uncaptured errors, hidden retries, or full-field display-frame readbacks
  occur; test-purpose readback is audited; exact root tests and the app build pass; and an
  independent reviewer reports zero blockers and zero should-fixes.

### WP2 implementation candidate

The implementation candidate adds a strict input/uniform ABI, production G-G diffusion
pipelines, explicit active-vapor ownership, exclusive generation-scoped submission, audited
full-field test readback, and a pinned Chromium probe. It keeps every field GPU-resident between
registered observations and executes noise, in-plane diffusion, vertical diffusion, optional
drift, commit, and post-commit Dirichlet clamp as ordered dispatches. Explicit WGSL `fma`
expressions reduce binary32 rounding relative to the float64 oracle without changing a frozen
tolerance or CPU implementation.

The provisional dirty-tree D3D12 run exercised all four fixtures. Reflecting pass 1/64 and both
dev one-pass cases had maximum absolute error `1.4901161415892261e-9`. The noisy/drifting
Dirichlet case had pass-1 maximum absolute/RMS error
`1.7707778396380824e-8` / `6.236895619658439e-9`; at pass 64 those were
`4.623779701201647e-7` / `1.8798277887340792e-7`, inside the frozen
`2e-6` / `2e-7` limits, with maximum relative error `4.42435275103415e-6`.
Skipping the post-pass clamp produced maximum absolute/RMS error
`0.018228875100612635` / `0.006723246872232541` and was rejected. The run used seven
generation-scoped submissions and seven audited test reads, performed zero display-frame
full-field reads, and observed zero uncaptured GPU errors. Its report correctly exited 1 only
because the implementation was not yet committed and the probe requires a tracked-clean tree.

Focused GPU verification passes 26/26 tests, both TypeScript projects pass, and the app build
transforms 33 modules. Exact root `npm test` then exited 0 in 384.1 seconds: Rule 7 was clean
over 182 files, both TypeScript projects passed, and 47 files / 828 tests passed. Candidate
commit `c546c2b27755efdd20255f6010fccf59c6223fe5` then reproduced the same complete
D3D12 predicate from a tracked-clean tree.

Independent review round 1 authenticated the exact commit and independently replayed 16/16
focused tests plus the complete D3D12 probe, but rejected four lifecycle/evidence blockers:
cross-device arena/controller composition was not rejected synchronously; a rejected submitted
work completion left stale host ping-pong ownership reusable; the required pure independent
branch calculation was absent; and the probe did not witness or predicate `device.lost`.

The round-1 repair binds each arena and submission controller to the exact creating device,
poisons the diffuser and destroys its arena after any encoded/submitted-work uncertainty, adds a
standalone non-cubic binary32 calculation whose reflection, canonical-pair order, counter-noise,
drift, and post-commit-clamp mutations must all disagree, and records unexpected device loss
separately from intentional teardown. Cross-device operations are rejected before shader
creation, upload, or submission. Focused diffusion/transport tests pass 20/20 and both TypeScript
projects pass. A provisional D3D12 replay retained every registered numerical value, rejected the
wrong-clamp mutation, reported zero uncaptured errors and `unexpectedDeviceLoss: null`, and
exited 1 only because its repair tree was intentionally dirty. Exact root `npm test` then exited
0 in 368.8 seconds: Rule 7 was clean over 182 files, both TypeScript projects passed, and 47
files / 832 tests passed. The app production build transformed 33 modules and exited 0.
Repair commit `7d2bfa6da0c2e0b62c694615b079e92509fd452d` then passed the complete
tracked-clean D3D12 predicate with the same numerical values, the wrong-clamp mutation rejected,
zero uncaptured errors, and no unexpected device loss.

Same-reviewer round 2 independently authenticated and replayed that commit but rejected two
narrower blockers and two should-fixes. Exact device identity was enforced, but controller
destroy/loss state did not fail `currentGeneration` or compatibility checks before pipeline work
and later active-buffer access. The pure reflection mutation combined domain faces, attached
neighbors, and walls, so a face-only effect could mask vacuous attached/wall coverage. In
addition, delayed non-destroy loss after teardown was misclassified as intentional, and the
committed handoff still described the now-clean repair as uncommitted.

The round-2 repair makes device compatibility and every generation read assert controller
liveness, including before and after asynchronous pipeline construction and during active-buffer
access. Adversarial tests prove destroyed/lost controllers perform zero shader or upload work and
that later loss refuses both active-buffer accessors. The pure test now mutates face, attached,
and wall reflection separately and requires each category to change output. Only an actual
`destroyed` loss reason following intentional teardown is ignored; a delayed `unknown` reason is
recorded. Focused diffusion/transport tests pass 21/21, both TypeScript projects pass, and the
provisional D3D12 replay preserves every accepted result with both error channels empty. Exact
root `npm test` exited 0 in 374.5 seconds: Rule 7 was clean over 182 files, both TypeScript
projects passed, and 47 files / 833 tests passed. The app production build transformed 33
modules and exited 0. Repair commit `9f7a7b476a17e9f47849cc323d49e928fc177b65`
then passed the complete tracked-clean D3D12 predicate with every accepted numerical value
unchanged, the wrong-clamp negative rejected, seven audited submissions/readbacks, zero
uncaptured errors, and no unexpected device loss.

Same-reviewer round 3 independently authenticated the five-file repair, replayed focused tests
21/21 and the complete RTX 3080 D3D12 probe, and accepted every code, test, and evidence item
with zero remaining code findings. The only reported should-fix was that this plan and
`PROGRESS.md` still described the now-complete commit/probe/review actions as pending. This
docs-only closure corrects that handoff. WP2 is complete at reviewed implementation
`9f7a7b476a17e9f47849cc323d49e928fc177b65`; no WP3 code existed at closure.

## WP3 complete `GGThreshold` cycle design

WP3 ports the remaining three G-G surface stages and complete-cycle orchestration without
changing the reviewed WP2 shader equations, the CPU oracle, the frozen fixtures, or any
tolerance. The production seam has two low-level GPU components plus one fail-closed wrapper:

- `GpuGgDiffusion` remains the sole implementation of noise, in-plane/vertical diffusion,
  optional drift, commit, and post-commit Dirichlet clamp. WP3 adds an idle-only control update
  for the next completed-cycle tick, `rho`, and `phi`; it rewrites every immutable range-uniform
  payload only after the prior submission has completed.
- `GpuGgSurface` owns freezing, threshold/hole-fill decisions, melting, attachment, exact
  boundary-order maintenance, the compact cycle report, and the Dirichlet meter reduction. It
  accepts an explicit vapor-buffer identity so the high-level wrapper can authenticate the
  active ping-pong side and the registered stale-source negative can deliberately supply the
  inactive side without adding a production fallback.
- `GpuGgSolver` snapshots the complete caller state once, constructs both low-level components
  over one generation/device-authenticated arena, and is the only production complete-cycle
  path. One cycle is two ordered bounded submissions—reviewed diffusion first, surface second.
  It advances host tick/parameter ownership only after both complete. Any encode, queue,
  submitted-work, loss, or partial-control-write uncertainty poisons the wrapper, destroys the
  arena, and refuses every later state accessor or retry.

The input owns exact `a`, `b`, and active `d`; wall and far-field masks; the CPU oracle's current
boundary index list and order; dimensions/domain/far field/center; tick, seed, noise; and the
complete eight-slot G-G parameter vectors. Validation independently reconstructs boundary
membership and uncapped neighbor counts from occupancy, rejects duplicate/missing/blocked
boundary entries, rejects invalid masks and non-finite/negative state, and uses the existing
parameter validator before any upload. No persistent full-field host copy remains after
creation.

### Surface stage order and storage

Each surface cycle uses the diffusion output named by `GpuGgDiffusion.activeVaporName()` and
executes these dispatches in order:

1. reset only per-cycle report fields; under Dirichlet, deterministically reduce the signed
   per-cell clamp deltas left by the reviewed clamp shader and add the final binary32 sum to the
   persistent Dirichlet meter;
2. on every current boundary cell, derive raw `nT`/`nZ` from the unchanged start-of-cycle
   occupancy, pack the uncapped counts into `renderFlags`, and apply freezing to `b` and the
   active vapor buffer;
3. decide every threshold or raw-`nT >= 4 && nZ >= 1` hole-fill attachment into per-cell flags,
   without changing occupancy;
4. melt only boundary cells not selected for attachment, using the same start-of-cycle count
   slot; freshly selected cells never melt;
5. apply every selected attachment in parallel (`a=1`, `b+=d`, `d=0`) and atomically count the
   cycle's attachments and hole fills;
6. rebuild the boundary list with the CPU oracle's exact observable order, then publish it.

The order in step 6 is not silently replaced with a sorted set. It is the CPU contract:
surviving old entries retain their order, then newly exposed neighbors append in selected-cell
order and the canonical eight-neighbor direction order, with first encounter winning. A
single-invocation stable rebuild over the compact boundary list reproduces that ordering; its
work is explicitly bounded by the validated boundary count plus eight times the attachment
count, and its wall time remains subject to the frozen submission limit. A following bounded
copy publishes the rebuilt list. Physics kernels remain one invocation per cell/range and never
depend on the serial list mutation.

Existing 48-byte-per-cell allocation remains unchanged. `topology` bit 0 stays the fixed-sigma
shell and bit 1 becomes current boundary membership; `boundaryIndices` is the compact ordered
list; `renderFlags` carries start-of-cycle counts and decision/result bits; `scratchScalarA/B`
and `reduction` are stage-local scratch, with `reduction` ending each cycle as the exact ordered
last-attachment list. A small non-cell report buffer carries current boundary count, cumulative
attached count, last attachment/hole-fill counts, last clamp delta, and cumulative Dirichlet
meter. Reduction levels use deterministic 256-lane trees and explicit bounded range uniforms;
no float atomic addition or host full-field sum defines the meter.

### Cycle, event, ledger, and comparison contract

`GpuGgSolver.step()` is legal only at a completed-cycle boundary and cannot overlap itself,
destruction, or an event. Noise uses the pre-surface tick exactly; tick increments only after
surface completion. An abrupt event snapshots and validates the entire parameter bundle,
updates diffusion and surface controls as one fail-closed operation, leaves `a`, `b`, active
`d`, boundary state, counters, and tick bit-unchanged, and returns the same completed-boundary
before/after record as the CPU oracle. `rngSeed`, `noiseEpsilon`, domain, far-field condition,
and center are immutable.

The reflecting ledger is independently reconstructed as the binary32 state's `Sigma(b+d)` and
compared to the float64 oracle with the frozen mixed scalar bound. Under Dirichlet the compact
GPU reduction reports each clamp delta and the accumulated meter. Decision 0019 supersedes the
unmeasured v2 assumption that this cancellation-heavy signed sum must itself meet the generic
mixed-scalar bound across already-different binary64/binary32 fields. V3 instead requires an
exact real-device witness for clamp-delta generation on the selected shell, the production
deterministic reduction, and its accumulator. Both signs are exercised; wrong-sign, wrong-mask,
omitted-delta, and scaled-delta mutations reject. CPU and GPU each compare
`Sigma(b+d)_final - dirichletMeter` with their own independently reconstructed initial mass,
then compare that corrected-mass invariant across lanes, all with the unchanged mixed-scalar
bound on the extensive invariant. Final `b`, `d`, and total mass remain independently blocking.
Every direct per-cycle/final meter comparison is still printed, but is explicitly diagnostic
and may not be reported as equal when it is not. Surface reports require
exact attachment indices/order, counts, hole fills, null physical-time/CFL fields, and false
stall/unconverged flags. The gate reconstructs wall/active masks, far-field set, boundary
membership/order, uncapped counts, attached total/delta, bounds, domain contact, far-field mean,
and every morphology metric from raw GPU buffers. Occupancy-derived values, event records,
noise bits, symmetry, and the cap stop reason are exact; `b`, `d`, field-derived metrics, total
mass, and the corrected-mass invariant use only the already frozen field/scalar tolerances.

This v3 criterion was registered before any canonical WP3 run. The provisional D3D12
measurement that forced the decision had exact occupancy/order/events/noise and passing fields,
but direct accumulated-meter difference `0.024480659606307853` exceeded its generic
`0.004255350462365598` bound. A production-tree witness already matched two independent
binary32 reductions and their accumulated value exactly. Decision 0019 therefore changes the
criterion and protocol identity rather than hiding the failed diagnostic or widening a
tolerance. The v2 WP1/WP2 records become historical development evidence and must be replayed
under v3 before final publication.

WP3 does not add checkpoint wire meanings, a host-resident simulation mirror, a physical-time
interpretation, an alternate boundary order, early event application, or a runtime option to
select stale ping-pong state. Checkpoint conversion/publication remains WP5; render integration
remains WP6.

### WP3 close predicate

WP3 closes only when all of the following hold:

- pure tests independently calculate non-cubic freezing, post-freeze threshold decisions,
  uncapped hole fill, simultaneous attachment, fresh-attachment melting exclusion, exact
  boundary-order evolution, deterministic reduction planning, parameter-event atomicity,
  ping-pong/tick ownership, poisoning, and teardown; targeted mutations make every branch fail;
- a pinned Chromium/RTX 3080/D3D12 probe runs both frozen G-G fixtures through all 256/128
  completed cycles, applies the cycle-64 event at the exact boundary, compares every exact
  attachment delta/structural report/noise witness, exactly authenticates clamp selection/sign,
  the production meter tree, and accumulation on synthetic inputs with all four registered
  mutations rejected, and compares final plus event-boundary raw state, boundary order,
  within-lane and cross-lane corrected-mass ledgers, metrics, domain safety, and cap stop reason;
- the CPU precheck retains at least the frozen `4e-4` decision margin; the non-blocking
  `stress-gg-attachment-margin` reports both sides honestly and cannot excuse a blocking result;
- `NC-STALE-PING-PONG` uses the production low-level components with the inactive vapor side and
  is rejected by the frozen comparison, while the high-level production wrapper has no stale
  selection control;
- all submissions are bounded and generation/device/loss authenticated, every readback is
  test-purpose audited, display-frame full-field readbacks remain zero, uncaptured errors and
  unexpected losses are zero, exact root tests and the app build pass, and an independent
  reviewer reports zero blockers and zero should-fixes.

## WP4 `LibbrechtKinetics` design

WP4 implements only the forward `aggregate-hv-g1h1-v5` policy. It does not port `legacy-v3` or
aggregate v4, change either CPU solver, reinterpret the accepted LK v2 checkpoint, or publish the
flagless Phase 5 lane. The CPU `LKSolver` remains the semantic oracle. WP4 owns the production
GPU operator, exact small-fixture comparison probe, and pure checkpoint conversion primitives;
WP5 owns authenticated checkpoint artifacts, the lane runner, and aggregate publication.

The advancing public seam is `GpuLkSolver`, backed by a claimed `lk` `GpuBufferArena` and the
existing generation-bound `GpuSubmissionController`. Fresh-run construction snapshots and
validates every input before the first upload: f32 `sigma` and `f`; exact occupancy, wall,
topology, and boundary order; complete aggregate-v5 controls; tick, time, cumulative ledgers,
and temperature-segment state. Active unattached `sigma` may be signed but must be finite and at
least `-1`; attached and wall cells retain the strict zero-field meanings of LK v2. Checkpoint
conversion is a separate non-advancing evidence seam below; LK v2 cannot supply the ledger,
schedule-cursor, cache, or historical-order state required by this constructor. Any
validation-only rejection leaves a live solver usable. A failed or partially submitted state
mutation poisons the instance, because host metadata may no longer describe resident buffers.

### Relaxation pipelines and deterministic reductions

One aggregate-v5 sweep has this immutable order:

1. an in-plane reflecting pass with the oracle's canonical three-pair sort/sum;
2. a vertical reflecting pass into the other sigma buffer, directly writing the signed
   candidate-minus-input drift term and maximum absolute sweep input;
3. a full-grid nonlinear boundary solve from that one immutable post-smoother candidate,
   caching `sigmaOpp`, `sigmaB`, and `alphaHK` per boundary pixel without modifying the
   candidate;
4. deterministic reduction of signed boundary replacement and minimum local exchange, followed
   by a separate boundary publication pass;
5. Dirichlet-shell clamp and signed shell-injection reduction, or no clamp in reflecting mode;
6. residual reduction over active unattached cells and a one-invocation convergence decision.

The shader derives the raw `nT/nZ` counts from exact occupancy. Aggregate classification is
`[01]/[02]` basal, `[10]` inhibited, `[20]` prism, and every other valid nonzero configuration
rough. Host uniforms carry the source-defined temperature interpolation results and derived
`dx/X0`, `vKin/dx`, and saturation-density ratio; WGSL evaluates the same nucleation law and
counter-based noise bit. The damped self-consistent solve always performs 60 binary32
iterations, with every shaped operation rounded once, then requires
`abs(solved - iterate) <= 8 * 2^-23 * max(abs(sigmaOpp), 2^-126)`. Nonpositive opposing
supersaturation is preserved exactly with zero kinetic coefficient and zero demand. A
non-finite coefficient, boundary value, raw reduction result, or non-sentinel corrected
diagnostic poisons the solver. The explicit zero-exchange/nonzero-numerator divergence status is
positive infinity by contract: it means unconverged and continues sweeping, not poisoned.

Every sum/max/min uses the frozen 256-lane pairwise/tree shape and the existing bounded dispatch
planner. No float atomic participates in a numerical result. The signed smoother drift is
metered before boundary replacement and clamping, never inferred, and must satisfy
`64 * activeCellCount * max(2^-23 * maxAbsSweepInput, 2^-149)` (zero for an exact zero field).
The host computes the limit in binary64 from the independently reduced binary32 maximum.
Fixed-sigma residual is `f32(maxAbsChange / f32(sigmaInfinity))`. The three signed global terms
are reduced separately and the decision invocation computes
`corrected = f32(f32(shellInjection + smootherDrift) - surfaceExchange)`. When
`surfaceExchange != 0`, divergence is
`f32(abs(corrected) / abs(surfaceExchange))`; when exchange is zero, exactly zero corrected
numerator passes and any nonzero numerator produces the positive-infinity unconverged sentinel.
This is the binary32-operational equivalent of the CPU's unrepresentable `1e-300` floor.
Overflow or non-finite arithmetic in the nonzero-exchange branch remains a solver failure.
The ordinary fixed-point branch remains `residual < relaxTol`, plus `divergence < divTol` for
fixed-sigma runs. Decision 0021 adds one alternative f32 classification: after two genuine
sweeps under unchanged state and controls, every active destination value must bit-equal its
value two sweeps earlier, every current-to-destination ordered-f32 distance must be at most one
ULP, and both orbit phases must pass the unchanged applicable fixed-sigma Dirichlet divergence
and drift requirements. The
report names `fixed-point`, `bounded-two-cycle`, or `incomplete` and preserves the actual
residual plus both maximum ULP distances. It never rewrites a cycle residual to zero.
Reflecting mode keeps no divergence claim, but a bounded cycle still requires both phases'
drift checks.

The committed pre-shader probe `runner/src/phase5-lk-reduction-shadow.ts` freezes those operations
before WGSL exists: 256-lane recursive reduction, f32 composition order, 60 fixed-point
iterations, the fixed-point bound, zero-exchange branch, and per-operation `Math.fround`
arithmetic. It also pins decision 0020's minimum-subnormal floor and an integrated legal first
sweep with positive shell injection, zero surface exchange, and an unconverged sentinel. It
samples each accepted CPU topology for all three blocking LK fixtures. Nine
samples pass: f32 settling takes 22–141 sweeps, final residual and divergence are exactly zero,
minimum positive shell injection/exchange are `1.7043203115463257e-7` /
`3.7532299757003784e-7`, maximum absolute drift is `3.8230791687965393e-7`, and the smallest
independent drift limit is `0.00004966732028321985`. This proves local representability for the
frozen fixtures from fresh CPU-converged seeds without relaxing `divTol`; it is not a
persistent-f32 trajectory proof. Production D3D12 execution found that missing case at cold
step 3: indices 4419 and 4743 alternate by one ULP with exact period two, residual
`5.82076573607537e-8`, and divergence zero. A v5 evolving-f32 regression must carry state across
the timeline/interface history, require the bounded-cycle classification there, and reject
monotonic one-ULP drift, period three, a two-ULP transition, one mismatching active cell, stale
history after any mutation, non-finite values, and failed divergence/drift.

Relaxation is encoded in bounded multi-sweep segments. A GPU-resident convergence flag makes all
passes after the first accepted sweep in a segment no-ops while preserving the exact first
accepted sweep count and ping-pong owner. Only the compact segment report is read back; complete
fields stay resident. The two-sweep reference, previous-phase applicable Dirichlet divergence
status, and previous-phase smoother-drift-bound status survive segment boundaries, but are reset
after construction/import, every interface, topology change, timeline event, or other field
mutation; cycle acceptance is disabled until two genuine new sweeps complete. Segment size is
selected below the registered 500 ms submission ceiling and
is not allowed to change numerical order. An unconverged sweep cap returns an explicit
incomplete state; it never authorizes the interface update.

### Interface, topology, ledgers, and timeline

`GpuLkSurface` consumes only the cached tuple from the accepted final relaxation sweep. It
computes one rate per boundary pixel, `alphaHK * vKin * sigmaB / dx`, reduces the maximum
deterministically. If `maxRate > 0`, it sets `dt = cflFill / maxRate` and applies the same `dt`
to every boundary pixel. If `maxRate <= 0`, it sets `dt=0`, performs no kinetic fill or time
advance, reports maximum kinetic increment zero and `stalled=true`, but still evaluates hole
fill. A separate flag pass records saturation decisions and unapplied excess before topology
changes. Hole fill uses raw start-of-interface `nT >= 4 && nZ >= 1`, remains outside the kinetic
CFL, and records its full deficit.

For every pixel the same invocation computes raw demand, placed fill, and
`clipped = f32(raw - placed)`, then records the non-tautological partition error
`f32(f32(placed + clipped) - raw)`. It requires finite nonnegative components, valid post-fill
state, and
`abs(partitionError) <= 4 * 2^-23 * max(abs(raw), 2^-126)`. Separate deterministic trees reduce
demand, placed fill, clipped fill, and partition error. Global closure must satisfy
`abs(f32(f32(placedTotal + clippedTotal) - demandTotal)) <=
64 * boundaryCount * 2^-23 * maxRawDemand`; cross-lane totals still pass the unchanged frozen
mixed-scalar tolerance. The `stress-lk-fill-margin` additionally requires exact decisions on
both sides, observes the nonzero `1e-5` clipping branch directly, and rejects an omitted-clipping
mutation even though that value is below the generic scalar absolute tolerance. Thus the
real-arithmetic claim remains:

```text
placed fill + saturation-clipped fill = computed kinetic demand
```

and the GPU evidence reports its independently bounded binary32 closure rather than falsely
requiring independently rounded global trees to be bit-equal.

Kinetic attachments are emitted in current boundary order before hole-fill attachments. For
each attachment, occupancy becomes one, `f=1`, and `sigma=0`; topology clears its boundary bit.
The serial publisher updates uncapped `nT/nZ`, bounds, attached count, attachment order, and
render flags, visits the eight directions in the CPU order, retains surviving boundary entries,
and appends each newly eligible active unattached neighbor once. Fresh neighbors cannot
participate until the next relaxation. A parallel publication pass then updates the canonical
boundary buffer.

Placed fill, clipping, hole deficit/count, maximum increment, maximum fill velocity, attachment
delta/order, physical-time increment, and complete `SurfaceReport` fields are returned in a
compact report. The high-level solver accumulates the compact f32-produced placed/clipped/demand
deltas in host binary64 in fixed boundary-step order, including each placed-fill delta at that
step's current `M_ice`. This is permitted compact state, not a full-field readback. It preserves
temperature-segment bookkeeping while `sigma`, `f`, occupancy, caches, topology, and render
flags stay on the device.

The pre-interface tick drives every relaxation retry and the matching accepted fill, including
both uses of the noise bit. Failed or unconverged relaxation and failed interface calls do not
advance it. Every successful interface increments exactly once, including stalled and hole-only
updates.

`applyTimelineEnvironment` is accepted only at a completed interface boundary. It validates and
derives the whole target environment first. If temperature changes, one GPU pass applies
`sigmaNew = (1 + sigmaOld) * cSat(oldT) / cSat(newT) - 1` to every active unattached cell,
including the active Dirichlet shell, without clamping negative values. If only
`sigmaInfinity` changes, no field write is encoded and every f32 sigma bit is preserved.
Deterministic reductions produce before/after absolute number-density sums, transformed
interior/shell counts, and maximum cell absolute/relative error. Only after successful completion
does the host commit temperature, far-field target, derived kinetics, and event record; the next
relaxation performs the explicit shell reclamp. A real temperature change also closes the current
ledger segment and starts the next one. A same-temperature event,
including a far-field-only event, preserves `closedPlacedFillVaporUnits` and the segment start
bit-for-bit and does not create a ledger boundary. Caches/readiness are invalidated atomically and
the event consumes no tick or physical time.

### Conversion, comparison, and failure controls

WP4 adds strict pure helpers at the CPU/GPU boundary:

- LK v2 CPU-to-GPU conversion consumes only a successfully decoded `core` state, explicitly
  rejects `legacy-v3` and aggregate-v4, validates metadata and lengths, preserves discrete
  controls exactly, and rounds each f64 field value once to nearest-even f32.
- Explicit GPU-to-CPU export reads the complete state only under a checkpoint/evidence readback
  purpose, widens each f32 exactly to f64, and returns data accepted by the unchanged LK v2
  encoder. The widen/encode/decode/round loop must preserve every original f32 bit.
- No display path may call either helper, and no mutable cache absent from LK v2 is smuggled into
  the wire meaning. Conversion snapshots are non-advancing comparison artifacts only. They do
  not create a resumable GPU solver or restore cumulative ledgers, schedule position, boundary
  order, readiness, or caches; that requires a new checkpoint version and ADR.

The WP4 D3D12 probe runs all three frozen blocking LK fixtures plus the fill-margin, nonlinear
boundary, and signed-subsaturation stress diagnostics. For every blocking fixture it compares
the complete WP0 LK inventory: raw `sigma`/`f`, exact occupancy/walls/topology/boundary order,
cached boundary tuple, attachment delta, reports, convergence diagnostics, ledgers, time,
derived scales, event records, density/reservoir diagnostics, stop reason, metrics, and noise
witnesses. The harness reconstructs boundary membership, raw counts, cached opposing means,
fill demand, drift identity/bound, and decision margins independently from read-back raw state.
The blocking fill margin must remain at least `4e-4`; tolerances remain the WP0 v4 values.
Positive-supersaturation fixed-sigma fixture acceptance also requires independently recomputed
strictly positive global shell injection and global surface exchange. Reflecting diagnostics
make no source-sign claim.

Targeted mutations must fail independently: residual-only acceptance; inferred, omitted, or
over-bound smoother drift; unordered/changed reduction shape; in-place boundary replacement;
wrong aggregate facet mapping; cache/growth mismatch; noise on only one side; per-contact fill;
silent saturation loss and the `1e-5` clipping witness; hole fill counted as kinetic CFL;
advance after unconverged or stale relaxation; one-tick noise shift; signed-value clamp;
sigmaInfinity-only field rewrite; skipped shell transform/reclamp; zero/negative source or
exchange accepted on a positive Dirichlet fixture; final-temperature ledger rescaling;
same-temperature ledger-segment split; kinetic/hole attachment reordering; wrong neighbor
direction or premature fresh-neighbor use;
stale generation; full-field display readback; legacy-policy import; checkpoint f32-bit loss;
and any checkpoint-resume claim.

WP4 closes only when focused tests, both TypeScript projects, the app build, exact root
`npm test`, and a clean-tree canonical Windows/Chromium/D3D12 probe all pass with zero GPU
errors/loss and bounded submissions; the implementation/evidence commit is then independently
reviewed to zero blockers and zero should-fixes. WP5 may begin only after that exact closure.

## Steps

- [x] Record decision 0016, synchronize charter v1.14, and create this cold-start handoff.
      Exact root `npm test` passes Rule 7 over 161 files, both TypeScript checks, and 43 files /
      793 tests on the Windows host.
- [x] **WP0 — criteria and backend freeze.** Read both solver specs completely; inventory every
      CPU state/ledger field; probe the actual adapters and candidate headless runtimes on both
      hosts; build the CPU float32 shadow; add exact fixtures, tolerances, latency protocol,
      artifact schema, flagless command, and negative controls to this plan. Commit and review
      this freeze before `solver-gpu/` exists. Completed as immutable two-lane v1 history;
      decision 0018 now supersedes only its lane/evidence scope through the Windows-only v2
      re-freeze above.
- [x] **WP1 — package and transport.** Review round 1 rejected the clean candidate with five
      blockers and three should-fixes; round 2 closed six but found cumulative chunked readback
      and exact request-boundary blockers; round 3 closed those but found active-frame token
      omission. The third remediation passes both typechecks, focused and exact root tests, the
      app build, and a provisional real-D3D12 run; round 4 accepted the code with zero blockers
      and zero should-fixes. Exact reviewed commit `afd94078e515236124bace82ff263390d80609f9`
      then passed both canonical clean D3D12 probes with zero uncaptured errors.
- [x] **WP2 — diffusion.** Reviewed implementation `9f7a7b4` passes one and repeated
      masked-average diffusion for reflecting and fixed-σ boundaries on Windows D3D12. Exact
      root verification is 47 files / 833 tests; the app build passes; the canonical clean probe
      passes every registered field tolerance and rejects wrong clamp with both GPU error
      channels empty. Round 3 accepted code/evidence with zero findings; its sole docs should-fix
      is closed by the immediately following handoff-only commit.
- [x] **WP3 — `GGThreshold`.** Port complete cycles with parameter events, noise, melting,
      attachment, hole filling, mass ledger, metrics, and stop-rule parity. Keep CPU state
      untouched and compare through the frozen harness.
      Candidate `12f7af4` passed provisional v3 D3D12 execution, but independent review round 1
      rejected it with six blockers and four should-fixes: the decision margin was sampled before
      relaxation; per-cycle direct-meter diagnostics were discarded; the reflecting meter was
      omitted from the fixture predicate; walls, packed raw-count/decision flags, complete
      event-boundary state/order/report semantics, and full `SurfaceReport` semantics were not
      independently authenticated; negative vapor was accepted; canonical protocol/runtime/
      host/adapter identity was recorded but not fully enforced; validation-only events poisoned
      the solver; a surface accessor omitted its liveness guard; targeted branch mutations were
      incomplete; and the handoff remained stale.
      The repair moves margin measurement to the actual post-relaxation decision seam, prints all
      128 Dirichlet cycle comparisons, makes every blocking meter condition explicit, reads and
      compares GPU walls and packed flags, authenticates full state/order/report/tick across the
      cycle-64 event, enforces every null/false G-G report field, rejects negative vapor before
      low-level or wrapper GPU work, and binds canonical pass to v3 SHA-256, Playwright 1.61.1 /
      Chromium 1228, launch flags, the registered host, RTX 3080, and observed D3D12.
      Invalid/no-op events remain usable while an attempted partial control write poisons;
      focused mutants pin post-freeze decisions, simultaneous attachment, fresh-attachment
      melting exclusion, append direction, event atomicity, and report predicates.
      Focused GPU verification passes 46/46, both TypeScript projects pass, the 33-module app
      build passes, and exact root `npm test` passes 49 files / 849 tests.
      A dirty-tree v3 D3D12 verification fails only the deliberate clean-tree predicate and passes
      both 256/128-cycle fixtures with exact
      occupancy/topology/boundary order/events/noise/stop reason and no GPU error/loss. Worst
      plate `b`/`d` max-absolute errors are `2.5812467e-5` / `1.6563363e-6`; worst Dirichlet
      values are `1.0507191e-5` / `8.1515096e-7`. The two complete clamp-path sign witnesses
      have zero delta-field and clamped-vapor mismatches and reject wrong sign, wrong mask,
      omitted delta, and scaling. The separate two-input production reduction/accumulator
      witness is exact. The Dirichlet within-GPU/cross-lane corrected-mass differences are
      `0.04080885148141533` / `0.040876508731344074`, below unchanged mixed-scalar limits
      `0.9119800135314465` / `0.9119799999999965`. The direct meter difference remains honestly
      failed and diagnostic at `0.024480659606307853 > 0.004255350462365598`.
      The correctly sampled minimum margins are `0.002879962029400218` and
      `0.002877725076560811`, both above `4e-4`; wall, packed-flag, and surface-report mismatch
      counts are zero. Repair commit `0ff70b65403655d3e5084717dafa2f1656fd66be` passed the exact
      clean canonical D3D12 replay in `out/wp3-canonical-0ff70b6.log` (SHA-256
      `a0578ffecdcf15688343b8a50e8d96d1032bd6cc51e2256a4bf5036fd6a51827`), with 778 bounded
      submissions, 946 audited test readbacks, zero display-frame full-field reads, and zero GPU
      errors/loss. Same-reviewer round 2 reports zero blockers and accepts all code/evidence; its
      sole should-fix was this stale post-run handoff. Docs closure
      `39d8b435ef638608b98480cb7f052adb845e9ad1` received zero-finding re-review; WP3 is closed.
- [x] **WP4 — `LibbrechtKinetics`.** Port the coupled aggregate-v5 relaxation/interface operator,
      including dual Dirichlet convergence, reflecting diagnostics, signed smoother drift,
      boundary-pixel fill, CFL, ledgers, schedules, and checkpoint conversion. Design commit
      `5ca5c36` received seven blockers and three should-fixes before production WGSL: unproven
      f32 divergence-floor feasibility, an unrepresentable denominator, false bit-exact global
      ledger wording, missing stalled behavior, a field-rewriting far-field-only event,
      unsupported LK v2 resume semantics, missing positive source/exchange guards, and incomplete
      tick/topology/handoff details. The current design repair closes each item and adds the
      nine-sample operation-rounded pre-shader probe; same-reviewer re-review is required before
      implementation. Focused probe tests pass 3/3, both TypeScript projects and Rule 7 pass,
      the 33-module app build passes, and exact root `npm test` passes 50 files / 852 tests in
      391.00 seconds.
      Same-reviewer round 2 on `98a8083` closed the original findings but rejected four remaining
      numerical/state seams plus one handoff should-fix: the relative-only drift bound omitted a
      binary32 subnormal floor; a legal zero-exchange first sweep was poisoned instead of remaining
      unconverged; same-temperature events could split a ledger segment; and the probe test trusted
      producer booleans instead of independently pinning the sample matrix and predicates. Decision
      0020 creates protocol v4 with the host-computed `2^-149` floor. The repair adds the integrated
      zero-exchange state, nonzero-exchange overflow rejection, bit-preserving same-temperature
      ledger rule/mutation, and independent fixture/predicate/extrema recomputation. Exact
      root `npm test` passes 50 files / 852 tests in 368.3 seconds; both TypeScript projects,
      Rule 7 over 192 files, focused v4 tests 13/13, and the 33-module app build also pass.
      Same-reviewer round 3 authenticated exact clean commit
      `87150eb8d0835d7bf5fd595d075dd9a6f92ef4dd`, independently reran those checks and the direct
      shadow, and returned zero blockers and zero should-fixes. Production LK WGSL may proceed
      under this exact accepted design; the implementation/evidence commit still requires its own
      zero-finding review before WP5.
      Production execution subsequently disproved one premise of that design before final
      evidence. After exact shaped-operation rounding was enforced, cold step 3 still entered a
      deterministic two-cell period-two orbit with one ULP per cell, residual
      `5.82076573607537e-8`, divergence zero, positive shell/exchange, bounded drift, and exact
      agreement with an independent f32 replay. Same-reviewer diagnosis returned one blocker and
      zero should-fixes: v4 cannot classify that reachable f32 history. Accepted decision 0021
      and protocol v5 retain the normal fixed-point branch and add only exact period two with
      maximum one-ULP motion, both phases' unchanged divergence/drift guards, explicit reporting,
      resettable history, evolving-f32 regression, and adversarial near misses. Exact repair
      `79ec322` received same-reviewer acceptance with zero blockers and zero should-fixes; WP4
      implementation resumes under that identity.
      The first uncommitted implementation then passed a provisional real D3D12 run and exact
      root verification, but independent pre-commit review rejected closure with nine blockers:
      missing exact far-field topology validation; timeline getter re-entry; attachment evidence
      aliasing reduction scratch; non-atomic evidence reads; producer-trusting and incomplete WP0
      comparison; vacuous production clipping/topology/noise coverage; absent registered
      production mutations; and unenforced D3D12/runtime/artifact provenance. No canonical claim
      or implementation commit was made. Repair every finding and obtain zero-finding re-review
      before checking WP4 or beginning WP5.
      The review repair now validates the exact domain/topology contract, locks every
      caller-controlled lifecycle seam, preserves attachment and bounded-cycle report evidence,
      reconstructs the complete registered state/ledger inventory independently, and exercises
      every frozen production mutation. Provisional v19 passes 3/3 blocking fixtures, 3/3 stress
      diagnostics, and the exact 48/48 control roster on the registered RTX 3080 / D3D12 lane.
      Its 133 submissions are bounded at 21 ms maximum and 20.5 ms p99; 481 audited readbacks
      include zero full-field display reads, and GPU errors/loss are zero. Focused GPU tests pass
      56/56, both TypeScript projects and the 33-module app build pass, and exact root `npm test`
      passes 53 files / 863 tests in 437.48 seconds. Independent implementation/evidence
      re-review reports zero blockers and zero should-fixes. The sole provisional failure is the
      intentional dirty-tree predicate; commit this exact state and run the clean canonical
      D3D12 probe before checking WP4.
      Exact implementation `2788cc060116ce8021911248771aa3c148b8fe63` passes post-commit
      root `npm test` (53 files / 863 tests in 436.80 seconds). Its clean canonical artifact is
      `out/wp4-canonical-2788cc0.json`, SHA-256
      `541c73d6f940e4f5676f3f38a469a0cf3b92e0067a3e60b8c6ed29c463a35d00`:
      strict UTF-8 without BOM, internal `pass: true`, 3/3 fixtures, 3/3 stresses, exact 48/48
      controls, 133 bounded submissions (22.2 ms maximum / 20.4 ms p99), 481 audited readbacks
      with zero full-field display reads, and zero GPU errors/loss. Final same-reviewer closure
      on that exact commit/artifact reports zero blockers and zero should-fixes. WP4 is closed.
- [x] **WP5 — headless runner and evidence boundary.** Land the selected runtime, flagless gate,
      strict manifest/report/index publication, complete exit semantics, and every adversarial
      bypass test. Re-run permanent Phase 2a, Phase 2b, gate3, and gate4 regression controls where
      the frozen WP0 protocol requires them; do not rewrite accepted artifacts.
      Candidate `eb5c5fbd6dff7025bf59e562d9925a45b19b5051` passed the registered Windows D3D12
      `gate5-lane` and `gate5` commands, but the resulting bundle is rejected provisional evidence.
      Independent review found five blockers: self-attested/null science comparisons; missing full
      G-G clamp/meter chronology and independent corrected-mass safeguards; a performance probe
      that does not measure registered UI edits or rendered frames and discards runtime error/loss
      state; ten unexecuted named negative controls plus substitute aggregate mutations; and
      change-and-restore-vulnerable source authentication. It also requested preserving both
      operators' observed allocation graphs and closing the capture-cleanup replacement race.
      Repair these findings, rerun all verification and hardware evidence at the new exact clean
      commit, and obtain same-reviewer zero blockers / zero should-fixes before checking WP5.
      The 2026-07-24 repair audit confirmed every finding against local `main` at `e04d250`.
      Blocker (2) is repaired at `758c06d`. The WP3 probe emits a complete `ggDirichletLedger`
      (per-cycle CPU/GPU clamp deltas, cumulative meters, tick and boundary/attachment
      bookkeeping, relaxation/surface reports, raw clamp-path delta and vapor bytes, both
      meter-reduction reports, corrected-mass operands); `phase5-gate.mjs` publishes it into the
      Dirichlet fixture's `comparison.json`; and `runner/src/gate5-evidence.ts` reconstructs
      every part of it — 128 contiguous cycles, both meter recurrences, cross-lane per-cycle
      bookkeeping, bit-exact clamp-path fields, its own reduction and dispatch inventory, all
      four policy mutations, persistent accumulation, and the three corrected-mass safeguards —
      on publication and on independent reopening, cross-linked to the fixture's published
      science scalars. The shared witness construction
      `PHASE5_GG_DIRICHLET_LEDGER_WITNESS` stays outside the protocol manifest, so
      `PHASE5_PROTOCOL_SHA256` is unchanged. Twenty-two tamper tests each reject one forged
      ledger; exact root `npm test` passes 56 files / 946 tests in 420.90 s and the app build
      passes 33 modules. The WP3 probe then ran at clean `7bbacfb` on the RTX 3080 / D3D12 lane
      and exited 0 with `pass: true`; the runner validator accepted its real ledger, with both
      meter recurrences exact, 123 positive / 5 negative clamp cycles, the planned 2 reduction
      dispatches, and all three corrected-mass safeguards inside the unchanged mixed-scalar
      bound while the direct meter difference stays at ADR 0019's recorded
      `0.024480659606307853`.
      All five blockers and both should-fixes are now repaired. The review-candidate v6 bundle
      exists at exact clean commit `2e746f5` (all five probes measure re-acquisition; the
      runner re-executes all sixteen negative-control mutations against the published payloads
      on publication and reopening and refuses any roster differing from its own observations).
      `gate5-lane` and `gate5` both exited 0 at `2e746f5` on the RTX 3080 / D3D12 lane, the
      latter 16/16, under protocol `phase5-gpu-conformance-windows-v6` (`5ef6d11b…`, ADR 0022).
      Independent review of that bundle (2026-07-25) verified all five original blockers and
      both original should-fixes REPAIRED — including the reviewer's own replay of the ledger
      recurrences and the negative-control roster — and returned **zero blockers, four
      should-fixes**: superseded performance figures quoted in PROGRESS, this plan's stale
      pre-ADR-0022 wording, eight blocking scalar pairs published from a single source
      (GG `relaxation.sweeps` hardcoded `[1,1]`; LK ULP scalars copied host-to-both-sides),
      and the drift-guarded comparison-logic duplication in `gate5-negative-controls.ts`.
      All four were repaired (`87e8f4b`, `82e8c29`, `0a611e7`); round two verified them against
      the regenerated `0a611e7` bundle and returned one prose should-fix (a blanket "0/0" claim
      the bundle contradicted), repaired at docs-only `bb97e26`. **Round three (2026-07-25):
      the same reviewer returned zero blockers and zero should-fixes. WP5 is closed.** Canonical
      evidence: the `0a611e7` bundle at `out/phase5/` (hashes in PROGRESS), protocol
      `phase5-gpu-conformance-windows-v6`, docs state `bb97e26`. Scope remains
      Windows/Chromium/D3D12 only; Metal is deferred.
- [ ] **WP6 — app integration.** Move live simulation to the GPU package, wire GPU-resident
      overlays/slices and resolution budgets, preserve view-only evidence inspection, and prove
      the CPU worker remains an available oracle/debug path. Do not perform Phase 7 visual polish.
- [ ] **WP7 — canonical Windows evidence.** Run all preconditions, execute the frozen Windows
      commands, authenticate and aggregate the bundle, inspect the interactive preview evidence,
      obtain clean review, and update `PROGRESS.md` with every metric, value, host, command,
      commit, and artifact hash. State the Windows/Chromium/D3D12 scope prominently.

## Out of scope

- Phase 6 parameter sweeps, Nakaya comparison, calibration, or physical-validation claims.
- Phase 7 smooth surfaces, ice materials, post-processing, timeline-product UI, gallery, or export.
- Treating the ≈30M detailed or ≈130M bake target as a Phase 5 acceptance requirement.
- CUDA, native binaries, a GPU-only checkpoint meaning, or deleting the web implementation.
- Deleting or editing away `GGSolver`, `LKSolver`, `GGThreshold`, strict CPU checkpoints, or
  accepted Phase 2–4 evidence.
- Changing `aggregate-hv-g1h1-v4`, the CPU aggregate-v5 equations or configured convergence
  controls, attachment kinetics, G-G machinery, timeline semantics, or morphology thresholds
  to make float32 comparisons easier. Decision 0021's explicitly reported exact/one-ULP
  GPU-periodic classification is a port representability rule, not a CPU solver change.
- Mid-history resumability beyond existing checkpoint semantics; a new meaning requires an ADR.
- Running the final gate while exact tolerances, Windows provenance, or headless runtime remain
  open.

## Tried and rejected

- **Call Windows-only evidence cross-backend portability.** Rejected by decision 0018. The
  earlier v1 plan required Metal; the operator later deferred Metal to another machine and
  narrowed this gate instead of preserving the broader claim without evidence.
- **Assume the former RTX 4080 memory budget.** Rejected because the current primary GPU has
  10 GB. Preview remains blocking; detailed and bake remain capability-reported targets.
- **Port directly from prose into WGSL and compare afterward.** Rejected because thresholds can
  then be tuned to implementation output. The oracle fixtures and tolerance rationale freeze
  first.
- **Replace the CPU solvers once GPU output looks close.** Rejected permanently. The float64
  implementations are the debugging oracle and differential control.
- **Use bitwise cross-backend equality.** Rejected by charter §3.1: f32/f64, FMA contraction,
  driver compilers, and math implementations legitimately differ. Frozen tolerances carry the
  claim.
- **Read full fields back every frame for easy Three.js integration.** Rejected because it defeats
  the production architecture and makes preview interactivity a PCIe/readback benchmark.
- **Make an 8M cube.** Rejected by ADR 0001. Budgets map to morphology-appropriate independent
  dimensions.
- **Saturate one GPU with parallel canonical cases.** Rejected because contention corrupts the
  latency/watchdog claim. Parallelize CPU reference work and independent host lanes instead.
- **Improve the Phase 4 visuals during the port.** Rejected as Phase 7 work. Phase 5 may change
  how buffers feed the renderer, but diagnostic presentation remains intentionally plain.
- **Treat a short caller timeout as a test verdict.** Rejected. The final root suite takes over
  six minutes on this host. A 10-second wrapper timeout left its Vitest child running and
  produced no trustworthy status; that child was allowed to finish, then a fresh uncontended
  `npm test` with a 10-minute command bound produced the recorded exit-0 result.
- **Rely on WGSL operator precedence for the coordinate hash.** Rejected by the pinned Chromium
  compiler, which fails mixed multiplication/XOR expressions without explicit parentheses.
  The hash terms are now individually parenthesized; the corrected real-device run is exact.
- **Treat a probe that reimplements transport as evidence for the production transport.**
  Rejected by WP1 independent review. A browser script can pass while the exported device,
  allocation, submission, or readback path remains broken. The probe now imports those exact
  production APIs through Vite and reports their records and negotiated limits.
- **Treat independently legal display-frame chunks as residency-safe without cumulative
  accounting.** Rejected by WP1 review round 2. Per-request full-field derivation alone still
  allowed two half-source transfers. Display reads now require an audit-issued frame token and
  are union-accounted against the actual source identity.
- **Substitute a weak-adapter simulation for the registered required-request mutation.** Rejected
  by WP1 review round 2. An adapter below the minimum tests capability reporting but does not pin
  omission from `requestDevice`. The production boundary now compares the exact request with the
  frozen policy, and both omission and downgrade attacks prove the adapter is never called.
- **Let callers opt out of an already-active display-frame scope by omitting its token.** Rejected
  by WP1 review round 3. Active audit state, not an optional request field, now determines display
  classification; every read during that scope requires the exact audit-issued token.
- **Force every WGSL intermediate through the operation-rounded shadow sequence.** Rejected after
  the real D3D12 64-pass noisy/drifting fixture produced RMS error `2.0899141975678157e-7`,
  narrowly above the independently frozen `2e-7` bound. The tolerance was not relaxed. Explicit
  WGSL fused multiply-adds instead reduced error against the unchanged float64 oracle to
  `1.8798277887340792e-7`; the separate binary32 shadow remains a diagnostic witness rather than
  the implementation target.
- **Apply the generic scalar bound directly to the G-G Dirichlet meter.** Rejected by decision
  0019 before canonical WP3 evidence. The signed shell sum is cancellation-heavy across
  independently accepted binary64/binary32 fields: the provisional direct difference was
  `0.024480659606307853` against a `0.004255350462365598` bound, while raw fields, total mass,
  exact topology, and decisions passed. V3 keeps the failed direct comparison visible, pins the
  production tree exactly, and applies the unchanged scalar bound to the corrected-mass
  invariant.
- **Change G-G transfer equations to improve that meter.** Rejected after a local-conservation
  experiment did not materially change the discrepancy. It was reverted because it also changed
  the specified freezing/melting arithmetic merely to improve evidence.
- **Keep a relative-only binary32 smoother-drift bound.** Rejected by decision 0020 because legal
  subnormal input can make that expression smaller than one binary32 ULP. The exact-zero special
  case remains, while every nonzero field uses the `2^-149` floor.
- **Poison a legal zero-exchange/nonzero-source relaxation sweep.** Rejected because early
  Dirichlet sweeps can inject at the shell before surface exchange becomes representable. The
  positive-infinity divergence status remains unconverged and continues; non-sentinel non-finite
  arithmetic still fails closed.
- **Treat the nine fresh-seed f32 samples as a persistent-trajectory proof.** Rejected after the
  real GPU-resident cold history reached a deterministic one-ULP period-two orbit. The old probe
  reconverged the CPU float64 field and rounded it afresh at every step, so it never exercised
  that basin.
- **Keep sweeping the exact f32 two-cycle or reshape more arithmetic.** Rejected because both
  phases and every shaped intermediate now match the independent operation-rounded calculation;
  an unchanged deterministic operator cannot leave the orbit.
- **Accept any residual below a generic f32 floor.** Rejected by decision 0021 because monotonic
  drift or longer/multi-ULP cycles could pass. The accepted v5 exception requires exact period
  two, at most one ordered-f32 ULP locally, and both phases' existing divergence/drift guards.

## Deferred Metal extension

Metal work resumes later on another machine under a new ADR and separately frozen conformance
protocol. That extension must record exact host/runtime/adapter/backend provenance and compare
against the CPU oracle before extending the portability claim. It does not block this Windows
Phase 5, and this Windows evidence must never be relabeled as Metal evidence.
