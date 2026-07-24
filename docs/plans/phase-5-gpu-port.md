# Plan — Phase 5: WebGPU solver port and two-backend conformance

- **Phase:** Phase 5 — GPU port
- **Status:** WP1 package/transport design frozen; implementation in progress on Windows, while
  the mandatory M4 capability record remains an external gate precondition
- **Started:** 2026-07-23
- **Last touched:** 2026-07-24 by Codex

## Goal

Build the production float32 WebGPU solver downstream of the permanent float64 CPU oracle,
without changing either CPU `SurfaceOperator`. The result runs the shared lattice, diffusion,
`GGThreshold`, and `LibbrechtKinetics` update contracts through bounded WGSL dispatches, exposes
GPU-resident state to the existing instrument, and produces authenticated CPU-vs-GPU comparison
evidence on both the Windows D3D12/Vulkan and Apple Metal lanes.

This is a numerical-portability and interactive-performance phase. It does not validate the
physical model, beautify the Phase 4 diagnostic renderer, or replace the CPU oracle.

## Done when

Done when GPU and CPU runs agree within pre-registered tolerance on both backends (Metal and
D3D12/Vulkan — ADRs 0002 and 0016) and the preview budget (≈8M cells) is interactively editable.
(Amended v1.2: cell-budget phrasing per ADR 0001; hardware lanes and tolerance pre-registration
clarified v1.14 by ADR 0016.)

## Authority and starting state

- Governing documents: charter §3.1 and Phase 5; decisions
  [0001](../decisions/0001-non-cubic-grid-dimensions.md),
  [0002](../decisions/0002-dev-hardware-split.md), and
  [0016](../decisions/0016-phase5-hardware-backend-lanes.md), plus headless-runtime decision
  [0017](../decisions/0017-phase5-headless-runtime.md).
- Solver truth: [gg-machinery.md](../gg-machinery.md) and
  [attachment-kinetics.md](../attachment-kinetics.md), including the aggregate-v5
  convergence identity and `aggregate-hv-g1h1-v5` surface policy.
- Permanent controls: `GGSolver`, `LKSolver`, strict checkpoints, counter-based PRNG, morphology
  metrics, and accepted Phase 2–4 evidence. None may be deleted, weakened, or reinterpreted.
- `solver-gpu/` is intentionally absent. Do not scaffold it until WP0 is committed and reviewed.
- Primary lane: Ryzen 7 5700G / 64 GB / RTX 3080 10 GB Windows host, with the actual observed
  D3D12/Vulkan backend recorded. Metal lane: the M4 Mac from decision 0002.
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
an ADR, invalidates comparison evidence, and reruns both backend lanes.

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
within 100 ms and render the first valid post-edit state within 2 seconds on both backend lanes.
WP0 may tighten these numbers but may not weaken them without an ADR.

At ≈8M cells, simulation fields remain GPU-resident. The app may read back named probes, compact
metrics, evidence snapshots, and explicit checkpoint exports; it may not copy a full field to
JavaScript every display frame. Overlays and slices consume GPU buffers directly. Simulation
stepping is decoupled from display cadence.

Dev ≈1M and preview ≈8M are required. Detailed ≈30M and bake ≈130M are adapter-dependent targets,
not gate criteria. Unsupported requested modes fail with the observed limits and estimated memory
need rather than allocating partially or silently lowering resolution.

### 4. Treat the two machines as one evidence protocol

One frozen manifest drives both lanes. Each lane publishes a canonical report, manifest, artifact
index, logs, error stream, and exit status. The aggregate gate accepts only matching protocol and
fixture hashes, authenticated commits, complete criterion sets, and an observed Metal result plus
an observed Windows D3D12/Vulkan-family result.

Independent CPU fixture generation and comparisons run in parallel processes on the Windows host
when memory permits. Canonical GPU latency/watchdog measurements use one process per physical
adapter. Parallel GPU experimentation is non-gate work unless separately pre-registered.

The headless runtime choice is made in WP0 by a bounded capability spike. The browser and headless
paths must use the same solver package and WGSL; the GUI is not the solver's owner.

## WP0 frozen protocol

This section and `runner/src/phase5-protocol.ts` are the Phase 5 pre-registration. The canonical
machine-readable protocol id is `phase5-gpu-conformance-v1`; its canonical-JSON SHA-256 is
`b62ec34cf118ebffbfd493203b68ff1028cf057f1b1736b5fc5028a87091ff09`. The separate fixture
and tolerance SHA-256 values are
`29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512` and
`96bf73b6e3a4f1937c86972f7cadf00766afdacc8f13c5efb5ab416184ce4053`. Any post-freeze change to
a blocking fixture, tolerance, decision margin, performance threshold, criterion, negative
control, runtime revision, or evidence meaning requires an ADR and invalidates both lane bundles.
Production GPU output played no role in selecting any value below: no production WGSL or
`solver-gpu/` package existed at freeze time.

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

**Metal lane status at WP0:** the M4 Mac was not reachable from this Windows session. Its exact
model, memory, macOS, Chromium product, adapter, backend, driver, features, limits, timestamp
dispatch, and error-capture result are therefore **unobserved**, not guessed. Run the same probe
on that host with no options; it defaults to lane `macos-metal` and requires observed backend
`metal`. Decision 0016 permits implementation to proceed while the lane is idle, but no
cross-backend milestone or Phase 5 gate can pass until that record exists. Windows never
substitutes for it.

### Resolution and memory budgets

Every budget is a morphology-shaped triple. Dev and preview are blocking on both lanes; detailed
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

Each lane must independently pass the CPU oracle. After that, corresponding Metal/Windows fields
must compare to each other within twice the applicable field tolerances (triangle bound), while
all discrete results remain exact. This cross-backend check cannot turn two oracle failures into
a pass.

Aggregate-v5 keeps dual convergence with the fixture's unchanged `relaxTol` and `divTol`. The GPU
meters binary32 smoother drift directly and uses a deterministic pairwise/tree reduction—no
unordered floating atomic. Its independent nonzero-field bound is
`64 * activeCellCount * 2^-23 * maxAbsSweepInput`; an exact zero field has bound zero. The factor
covers the 12 rounded split-smoother operations plus a bounded tree depth. Changing the reduction
shape invalidates the factor. This is a GPU conformance diagnostic; it does not alter the CPU
oracle's decision-0014 binary64 bound.

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

Both preview shapes run separately on both physical adapters. Each case has 5 untimed warmups
followed by 30 consecutive edit/step samples, one process per adapter:

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

It detects and verifies the observed backend, writes only its corresponding
`out/phase5/windows-d3d12/` or `out/phase5/macos-metal/` bundle, and exits 0 only for a complete
valid lane. A lane exit 0 is not the Phase 5 claim. After the authenticated Metal bundle is
transferred without rewriting bytes, the one aggregate flagless gate is:

```text
node runner/src/main.ts gate5
```

Only aggregate exit 0 is the Phase 5 claim. The aggregate command requires both bundles from the
same repository commit, protocol hash, fixture hash, tolerance hash, solver-source hashes, and
runtime revision; independently reopens every artifact; re-derives all criteria; performs the
two-lane triangle comparisons; and publishes `out/phase5/gate5-report.json` plus
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
P5-WINDOWS-PROVENANCE     P5-METAL-PROVENANCE       P5-PROTOCOL-MATCH
P5-ADAPTER-LIMITS         P5-LAYOUT-INDEXING         P5-DIFFUSION
P5-GG-THRESHOLD           P5-LIBBRECHT-KINETICS      P5-SYMMETRY
P5-DOMAIN-SAFETY          P5-CROSS-BACKEND           P5-DISPATCH-SAFETY
P5-EDIT-ACK               P5-FIRST-VALID-FRAME       P5-RESIDENCY
P5-CHECKPOINTS            P5-NEGATIVE-CONTROLS       P5-PUBLICATION
```

`PHASE5_NEGATIVE_CONTROLS` registers one uniquely owned mutation per criterion: backend
relabeling on each lane, protocol-hash shift, required-limit downgrade, axis swap, wrong boundary
clamp, stale ping-pong state, residual-only LK convergence, symmetry-bit flip, accepted domain
contact, duplicated Windows-as-Metal bundle, excessive dispatch, late acknowledgement, late
valid frame, full-field frame readback, checkpoint dtype/length/endianness shift, tolerance
bypass, and post-publication artifact mutation. WP5 must make each mutation trip only its named
owner before the final gate runs; the current WP0 tests enforce registration/completeness, not a
GPU gate that does not exist yet.

## Gate contract

WP0 supplies exact subcriterion names and numerical tolerances, but it may not remove any row:

| Area | Blocking claim |
|---|---|
| Provenance | Both bundles authenticate commit, protocol, fixtures, adapter, observed backend, OS, runtime, and exposed driver |
| Adapter limits | Required limits are requested explicitly; supported budgets allocate exactly; unsupported budgets fail clearly |
| Layout/indexing | Non-cubic D6h indexing, active masks, field offsets, and ping-pong ownership match `core` |
| Diffusion | One-pass and repeated-pass fields agree with the CPU oracle under both far-field conditions |
| `GGThreshold` | Full cycles agree on fields, attachment decisions, mass ledger, noise witness, metrics, and stop reason |
| `LibbrechtKinetics` | Full cycles agree on field/surface state, convergence classification, fill-CFL, ledger, policy, events, metrics, and stop reason |
| Symmetry/domain | Registered noise-off fixtures retain exact occupancy symmetry and no evidence run contacts its domain |
| Cross-backend | Metal and Windows bundles pass the same frozen fixtures and tolerances; neither substitutes for the other |
| Dispatch safety | Preview submissions meet the frozen bound with no device loss, uncaptured error, or hidden retry |
| Interactivity | ≈8M cells meet the edit acknowledgement and first-valid-render thresholds on both lanes |
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
  and opposing supersaturation (60 bytes/cell total). The separate names preserve the
  operator-specific field meanings and stay below WP0's 64-byte ceiling.
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
  required-limit negative controls with zero uncaptured errors. The absent M4 record is reported
  honestly and remains required before the first cross-backend milestone.

## Steps

- [x] Record decision 0016, synchronize charter v1.14, and create this cold-start handoff.
      Exact root `npm test` passes Rule 7 over 161 files, both TypeScript checks, and 43 files /
      793 tests on the Windows host.
- [x] **WP0 — criteria and backend freeze.** Read both solver specs completely; inventory every
      CPU state/ledger field; probe the actual adapters and candidate headless runtimes on both
      hosts; build the CPU float32 shadow; add exact fixtures, tolerances, latency protocol,
      artifact schema, flagless command, and negative controls to this plan. Commit and review
      this freeze before `solver-gpu/` exists. Completed on the Windows host with the M4 lane
      explicitly recorded as unreachable/unobserved; that missing record blocks cross-backend
      milestones and the final gate, but does not authorize a Windows substitute.
- [ ] **WP1 — package and transport.** Scaffold `solver-gpu/`; implement adapter/limit reporting,
      checked layout/indexing, buffer lifecycle, PRNG parity, bounded submission plumbing, and
      test-only readback. Pass layout/capability negative controls on Windows and Metal.
- [ ] **WP2 — diffusion.** Implement and independently validate one and repeated masked-average
      diffusion passes for reflecting and fixed-σ boundaries on both backends.
- [ ] **WP3 — `GGThreshold`.** Port complete cycles with parameter events, noise, melting,
      attachment, hole filling, mass ledger, metrics, and stop-rule parity. Keep CPU state
      untouched and compare through the frozen harness.
- [ ] **WP4 — `LibbrechtKinetics`.** Port the coupled aggregate-v5 relaxation/interface operator,
      including dual Dirichlet convergence, reflecting diagnostics, signed smoother drift,
      boundary-pixel fill, CFL, ledgers, schedules, and checkpoint conversion.
- [ ] **WP5 — headless runner and evidence boundary.** Land the selected runtime, flagless gate,
      strict manifest/report/index publication, complete exit semantics, and every adversarial
      bypass test. Re-run permanent Phase 2a, Phase 2b, gate3, and gate4 regression controls where
      the frozen WP0 protocol requires them; do not rewrite accepted artifacts.
- [ ] **WP6 — app integration.** Move live simulation to the GPU package, wire GPU-resident
      overlays/slices and resolution budgets, preserve view-only evidence inspection, and prove
      the CPU worker remains an available oracle/debug path. Do not perform Phase 7 visual polish.
- [ ] **WP7 — canonical two-lane evidence.** Run all preconditions, execute the frozen Windows and
      Metal commands, authenticate and aggregate both bundles, inspect the interactive preview
      evidence, obtain independent clean review, and update `PROGRESS.md` with every metric,
      value, host, command, commit, and artifact hash.

## Out of scope

- Phase 6 parameter sweeps, Nakaya comparison, calibration, or physical-validation claims.
- Phase 7 smooth surfaces, ice materials, post-processing, timeline-product UI, gallery, or export.
- Treating the ≈30M detailed or ≈130M bake target as a Phase 5 acceptance requirement.
- CUDA, native binaries, a GPU-only checkpoint meaning, or deleting the web implementation.
- Deleting or editing away `GGSolver`, `LKSolver`, `GGThreshold`, strict CPU checkpoints, or
  accepted Phase 2–4 evidence.
- Changing `aggregate-hv-g1h1-v4`, aggregate-v5 convergence, attachment kinetics, G-G machinery,
  timeline semantics, or morphology thresholds to make float32 comparisons easier.
- Mid-history resumability beyond existing checkpoint semantics; a new meaning requires an ADR.
- Running the final gate while the Metal lane, exact tolerances, or headless runtime remain open.

## Tried and rejected

- **Validate only on the Windows RTX 3080.** Rejected by decisions 0002/0016 and the charter:
  one WebGPU backend cannot establish WGSL portability.
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

## Remaining external gate precondition

Confirm the M4 Mac is reachable and run `node app/scripts/phase5-capability.mjs` there. Record its
exact model, memory, macOS, pinned Chromium product, adapter/backend, driver where exposed,
features, limits, timestamp dispatch, error capture, repository commit, and worktree cleanliness
before the first cross-backend milestone. Runtime selection and numerical tolerances are frozen;
no GPU result may be used to revise them without an ADR and invalidating prior lane bundles.
