# 0044 — Defer the preview GPU cohort until v6 parity exists

- **Date:** 2026-08-03
- **Status:** accepted; reviewed as one direction-amendment unit with decisions 0042–0043
- **Charter impact:** amends the document revision marker, current-revision paragraph, and the
  Phase 6 preview-sweep clause in §3.2; adds a named GPU-parity work package under Phase 7. It does
  not alter the accepted Phase 5 gate or the permanent CPU-oracle/WebGPU architecture.

## Context

The registered Phase 6 CPU operator is `aggregate-hv-g1h1-v6`, whose opposing-vapor reduction uses
the canonical order required for D6h equivariance. The current GPU path is deliberately restricted
to v5. `solver-gpu/src/lk-conversion.ts` rejects a v6 checkpoint because there is no WGSL
implementation of that ordering, and `solver-gpu/src/lk-solver.ts` rejects any fresh policy other
than v5 because its boundary kernel still reduces those operands in gather order. Executing the
existing GPU path as if it were Phase 6 would therefore compare a different numerical operator.

A scientifically comparable GPU cohort first needs the v6 WGSL port, a derived binary32 error and
convergence envelope, adversarial oracle comparisons, and then the registered preview-budget
cohort. Those are real obligations, but they are not prerequisites to learning what the permanent
float64 oracle predicts. The maker directs that work to Phase 7 and directs the full three-arm
float64 CPU campaign to carry the Phase 6 verdict.

### Charter document marker being amended

> Project Document — v1.20, August 2026

### Charter current-revision paragraph being amended

> Current revision. v1.20 (2026-08-02) — decision 0041 records the Phase 6 continuation-host CPU upgrade from the historical Ryzen 7 5700G to the Ryzen 9 5900XT with 16 physical / 32 logical processors. The RTX 3080 10 GB, Windows lane, and approximately 64 GiB of RAM remain. Phase 5 and the pre-upgrade Phase 6 sweeps keep the old-host provenance that produced them; the historical Phase 6 artifacts' lack of artifact-level host binding remains an explicit evidence limit. New Phase 6 continuation and replacement-gate evidence records the new CPU, runtime and actual concurrency/launch fields; GPU bundles independently observe the required adapter and backend fields and the driver where exposed. The extra cores change only scheduling of scientifically independent cases. They do not alter a case, scientific criterion, numerical-control obligation, GPU cohort, held-out obligation, or the Windows-only scope.

### §3.2 Phase 6 preview-sweep clause being amended

> Parameter-sweep harness on the headless runner: hundreds of automated runs at preview resolution, with no visible browser UI or manual tab — this is where the RTX 3080 earns its keep, and it matters more than maximum grid size. Sweeps cross habit flips by design, so domains cannot be pre-shaped to a morphology that is not yet known — ADR 0001 cuts both ways (added v1.2). Runs use either compromise near-cubic budgets or a two-pass scheme: a cheap probe run classifies the habit, a fitted domain re-runs it. The domain-contact guard (§3.1) invalidates any run that outgrows its box.

### §3.2 Phase 7 heading under which the deferred work is added

> Phase 7 — Product layer (amended v1.18, decision 0029: four view profiles replace the earlier Explore / Lab / Sculpt sketch).

The permanent architecture and accepted Phase 5 gate remain unchanged:

> CPU reference solver: plain TypeScript, float64, at a 128×128×64-class grid, running in a Web Worker. This is the ground truth and the debugging environment. It is never deleted.

> Production solver: WGSL compute passes on WebGPU — diffusion, boundary/semi-liquid update, attachment/freezing, diagnostics — over ping-pong storage buffers or 3D textures, f32. All fields stay GPU-resident; only probe values, metrics, and snapshots come back to JavaScript. Every pass is bounded (Windows' GPU watchdog resets dispatches that run ≈2 s), so bake-quality work is chunked across many dispatches by design.

> The GPU solver is validated against the CPU oracle with tolerance comparisons (f32 vs f64) on identical seeds. Debugging physics in WGSL is miserable; debugging it in inspectable TypeScript is merely hard. Never port ahead of the oracle.

> Done when GPU and CPU runs agree within pre-registered tolerance on the observed Windows D3D12 backend and the preview budget (≈8M cells) is interactively editable. Exact host/runtime/adapter/backend provenance, bounded dispatch, GPU residency, and fail-closed evidence remain required. This is a Windows/Chromium/D3D12 claim, not Metal or general WebGPU portability. (Amended v1.2: cell-budget phrasing per ADR 0001; hardware/tolerance freeze clarified v1.14 by ADR 0016; Windows-only scope directed v1.16 by ADR 0018.)

## Decision

1. The Phase 6 replacement verdict is computed from the permanent float64 CPU oracle under the
   registered v6 surface policy. The source-derived physical-size strata, grid/timestep/domain
   controls, conservative-intersection reduction, R15 path, and complete CAK, M1, and
   `M1_NO_DIP_ABLATION` campaign remain Phase 6 obligations.
2. Defer the v6 WGSL port, binary32 convergence/error envelope, adversarial CPU comparison, and
   automated preview-budget cohort to Phase 7. The accountable owner is the project maker,
   `billatgameology`, through a named Phase 7 GPU-parity work package.
3. Carry the existing cohort scope forward rather than silently shrinking it: after v6 parity and
   the envelope freeze, execute at least 200 automated preview-budget runs; the intended design is
   the complete 204-point grid for all three arms, 612 runs, unless a pre-run ADR registers a
   scientifically stronger coverage design. Keep GPU outcomes separate from the float64 headline.
4. Phase 6 neither requires nor claims a preview-GPU cohort. CPU rows do not masquerade as GPU
   rows, and historical v5 GPU evidence is not relabeled as v6. The accepted Phase 5
   Windows/Chromium/D3D12 gate remains historical evidence for the product architecture.
5. Phase 7 must establish v6 oracle parity before the WebGPU production solver represents the
   Phase 6 operator. It retains bounded dispatch, GPU residency, fail-closed evaluation, exact
   host/runtime/adapter/backend provenance, and tolerance rather than bitwise comparison.

## Consequences

**Buys.** Phase 6 answers the scientific question with the operator that is already the registered
ground truth, rather than spending the gate on a knowingly different v5 GPU implementation. The
large CPU campaign and all numerical controls remain intact.

**Costs.** Phase 6 supplies no preview-GPU validation claim for its v6 operator. Phase 7 inherits a
substantial parity and cohort workload before the production WebGPU path can represent the final
Phase 6 science. The float64 campaign will use more wall-clock time and host CPU capacity.

**Forecloses.** Counting CPU rows as the charter's old GPU cohort, running v5 and calling it v6,
copying float64 tolerances into binary32 without derivation, relabeling Phase 5 evidence, or claiming
general WebGPU/backend parity from the Phase 6 result.

## Alternatives considered

**Run the current v5 GPU path for Phase 6.** Rejected because it uses a different opposing-operand
reduction and cannot execute the registered v6/M1 campaign faithfully.

**Port and validate v6 before any further Phase 6 work.** Rejected by maker direction. It would
delay the float64 scientific verdict behind production-backend engineering while adding no evidence
about what the registered oracle itself predicts.

**Treat the accepted Phase 5 cohort as Phase 6 evidence.** Rejected because Phase 5 validated a
different protocol and surface policy; historical acceptance is not transferable to the new
campaign.
