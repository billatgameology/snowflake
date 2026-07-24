# Plan — Phase 5: WebGPU solver port and two-backend conformance

- **Phase:** Phase 5 — GPU port
- **Status:** not started — cold-start handoff complete; WP0 criteria/backend freeze is next
- **Started:** 2026-07-23
- **Last touched:** 2026-07-23 by Codex

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
  [0016](../decisions/0016-phase5-hardware-backend-lanes.md).
- Solver truth: [gg-machinery.md](../gg-machinery.md) and
  [attachment-kinetics.md](../attachment-kinetics.md), including the aggregate-v5
  convergence identity and `aggregate-hv-g1h1-v4` surface policy.
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

## Steps

- [x] Record decision 0016, synchronize charter v1.14, and create this cold-start handoff.
      Exact root `npm test` passes Rule 7 over 161 files, both TypeScript checks, and 43 files /
      793 tests on the Windows host.
- [ ] **WP0 — criteria and backend freeze.** Read both solver specs completely; inventory every
      CPU state/ledger field; probe the actual adapters and candidate headless runtimes on both
      hosts; build the CPU float32 shadow; add exact fixtures, tolerances, latency protocol,
      artifact schema, flagless command, and negative controls to this plan. Commit and review
      this freeze before `solver-gpu/` exists.
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

## Open questions

These are WP0 blockers, not permission to start production shaders:

- Confirm the M4 Mac is reachable and record its exact model, memory, macOS, browser/runtime, and
  observed Metal adapter before the first cross-backend milestone.
- Choose the headless WebGPU runtime after testing actual required-limit reporting, backend
  identity, error capture, timestamp support, and CI ergonomics on both hosts. Record a new ADR if
  the choice creates a lasting dependency or checkpoint/evidence boundary.
- Freeze the exact numerical tolerance table from the CPU float32 shadow and operation-count
  analysis. No GPU comparison result may be used to select those values.
