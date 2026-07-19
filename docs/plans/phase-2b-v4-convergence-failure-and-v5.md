# Plan — Phase 2b v4 convergence failure and v5 closure attempt

- **Phase:** Phase 2b — attachment becomes physics
- **Status:** in progress
- **Started:** 2026-07-19
- **Last touched:** 2026-07-19 by Codex

## Goal

Preserve protocol v4 as immutable evidence, explain why the registered −15 °C run reached a
floating-point fixed point while failing its divergence-identity tolerance, and repair only a
demonstrated numerical-conformance defect. Freeze a versioned v5 protocol before any new
two-temperature morphology execution, review it independently, then execute the unchanged
flagless pair exactly once. Phase 2b closes only if both registered habits and every numerical
criterion pass; an execution-valid habit miss remains an honest negative result.

## Done when

The charter has no single “done when” sentence for Phase 2b. Its binding milestone is therefore
operationalized without softening it: **habit changes with temperature alone — the same solver,
domain, far-field condition, supersaturation, pressure, spacing, seed, noise, convergence
controls, stopping rule, and measurement size produce both pre-registered aspect-ratio habits;
every fixed-sigma Dirichlet relaxation satisfies both the iterate-residual and divergence-identity
tolerances; the depleted-start differential and permanent G-G control pass.** The exact thresholds
and controls must be frozen in this plan before execution, and the flagless gate must exit 0.

## Recorded v4 terminal result

Protocol v4 is an **execution-invalid gate attempt**, not a measured cold-habit failure. It ran
from tracked-clean execution commit `dce70816e34a6eee8ed15edff3c254d6da7fa7d8`, preregistration
`8e0017a`, Node `v24.13.1`, and V8 `13.6.233.17-node.40`.

- Command: `node runner/src/main.ts gate2b` in isolated worktree
  `.tmp-gate2b-clean-1784305494`.
- Warm run: −5 °C reached the size target at completed growth step 814, extent 61,
  aspect ratio `0.118644`, attached cells 18,193, exact symmetry, all relaxations converged,
  and checkpoint round trip passed.
- Cold run: −15 °C stopped `unconverged` while attempting growth step 12. The last completed
  state was step 11, extent 5, attached cells 57. The attempted relaxation used all 200,000
  sweeps, reached iterate residual exactly zero, and plateaued at divergence `3.10e-7` against
  registered `divTol=1e-7`. Its aspect ratio `0.6` is below the registered measurement size and
  has no habit meaning.
- Terminal stderr named four criteria: unconverged termination, extent below 60, failed
  relaxation, and aspect ratio below the column threshold. Exit status was 1.
- Log: `out/gate2b-rerun-20260717_162624.log`, 116,549 bytes, SHA-256
  `9f6ac629a5175cacbe0f55435e638276fdfc018d7ef163855c5a1c2ce0de41e6`.
- Stderr: `out/gate2b-rerun-20260717_162624.err`, 271 bytes, SHA-256
  `17535e98a254c4986eccc919f0e6e70a40dbc3e088b4f3ec70bb9a8190669b10`.
- Warm checkpoint: `out/gate2b-v4-plate.ckpt`, 15,041,089 bytes, SHA-256
  `fee39ec1ebdf481e370661e1ca4a13384b2d6f3a56477db1b35927f2355179a8`.
- Cold checkpoint: `out/gate2b-v4-column.ckpt`, 15,041,088 bytes, SHA-256
  `8997d90689fdbe6fb7fe496e4d2780d2f61abe92166e67ed56fa77e65f2de91d`.

All paths above are relative to `.tmp-gate2b-clean-1784305494`. These bytes are immutable; v5
must use distinct filenames and must not modify, replace, or relabel them.

## Approach

1. Independently decode the cold checkpoint and reconstruct the attempted next relaxation.
   Recompute iterate residual, shell injection, Robin absorption, and their divergence identity
   from raw state rather than trusting the gate report.
2. Reduce the plateau to the smallest deterministic regression that preserves the cold topology
   and registered numerical controls. Determine whether the discrepancy is an implementation
   defect, arithmetic-accumulation floor, or a genuine incompatibility between the equation and
   the frozen tolerance.
3. If the cause is a conformance bug, implement the smallest correction and pin a negative
   control that fails on the v4 implementation and passes after the repair. Do not change the
   equation, convergence meaning, tolerance, cap, or scientific inputs. If any such semantic
   change is required, stop implementation and write an ADR plus synchronized charter/spec edits
   before proceeding.
4. Run targeted tests, the independently recomputed cold-step regression, the depleted-start
   differential, the permanent Phase 2a G-G control, and the exact root suite.
5. Only after the defect and repair are known, append and commit a complete v5 pre-registration
   here. Version all protocol identifiers and output filenames while retaining every scientific
   and gate control not directly implicated by a documented authority change.
6. Obtain an independent adversarial review with zero blockers and zero should-fixes before the
   morphology run. Any repair changes require the same reviewer to re-check the final immutable
   commit.
7. From a tracked-clean isolated worktree at the reviewed execution commit, run the flagless v5
   pair exactly once. Validate process exit, report criteria, checkpoint round trips, provenance,
   and hashes before updating the gate state.

## Diagnosed cause and authority decision

`scripts/diagnose-gate2b-v4.ts` independently decoded the immutable cold checkpoint, rebuilt the
aggregate boundary set and reflecting stencil from raw arrays, and compared naïve,
Neumaier-compensated, and exact binary-rational sums. All three reproduced the solver's one-sweep
result: max change `0`, injection `3.679402302324622e-7`, exchange
`3.679401162802118e-7`, and divergence `3.097032516200489e-7`. The independently metered signed
reflecting-smoother change was exactly `-1.1395225041344048e-13`, which closes
`injection + smoother drift − exchange` exactly.

The plateau is therefore local float64 stencil roundoff, not naïve total accumulation, incomplete
relaxation, or a physical imbalance. Because the governing two-term identity expressly omitted
that third term, this requires an authority change. Decision
[0013](../decisions/0013-float64-smoother-drift-divergence-identity.md) and charter v1.11 create
`aggregate-hv-g1h1-v5`: v4 surface physics is unchanged, but v5 directly meters the pre-boundary
smoother drift and includes it in the divergence numerator. V4 remains immutable.

## Steps

- [x] Preserve and hash the terminal v4 log, stderr, and both checkpoints; classify the cold run
  as execution-invalid rather than a habit measurement.
- [x] Independently reproduce and explain the cold step-12 divergence plateau from its checkpoint.
- [x] Add a non-vacuous regression and implement the minimum contract-honest repair, or stop for
  an ADR if the accepted numerical contract must change.
- [x] Pass targeted numerical checks, permanent controls, and exact `npm test`.
- [ ] Freeze and commit the complete v5 protocol before any two-temperature morphology run.
- [ ] Complete independent adversarial review with no unresolved findings.
- [ ] Execute the flagless v5 pair once from a clean isolated worktree and validate all artifacts.
- [ ] Record the result in this plan and `docs/PROGRESS.md`; close Phase 2b only if every criterion
  passes.

## Repair evidence before protocol freeze

The implementation adds only the versioned aggregate-v5 diagnostic path defined by decision
0013. Aggregate-v5 directly accumulates each active unattached cell's post-smoother candidate
minus sweep input before boundary replacement and clamp; aggregate-v4 continues to report no
such term and retains its executed two-term convergence meaning. The gate validator requires a
finite direct term for v5, rejects it for older policies, and independently recomputes the
three-term ratio. Existing v2 checkpoint framing already carries the surface-policy string;
an aggregate-v5 encode/decode control proves that no wire-version reinterpretation is required.

Focused verification on Node v24.13.1 passed 54/54 classification, solver, and fail-closed gate
tests, followed by 22/22 checkpoint and gate tests plus both TypeScript projects. The regression
includes a real compact float64 fixed-point floor, an independent stencil/drift reconstruction,
forged and missing drift controls, and a one-sweep aggregate-v4/v5 field comparison that is
bit-identical. Running `scripts/diagnose-gate2b-v4.ts` against the immutable cold checkpoint also
passes its embedded assertions: v4's two-term ratio is `3.097032516200489e-7`, the independently
metered drift is `-1.1395225041344048e-13`, exact three-term closure is zero, and v5 accepts the
same field in one sweep with residual and divergence both exactly zero.

Exact root verification then passed the Rule 7 scan over 153 files, both TypeScript projects,
and 784/784 tests across 42 files. The explicit depleted-start differential passed 3/3. The
permanent enforcing Phase 2a command exited 0 at far-field stop tick 4,800 with exact symmetry,
mass drift `2.056e-13`, aspect ratio `0.168831`, and a round-trip-identical 17,826,573-byte
checkpoint whose SHA-256 is the canonical
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`.

Independent repair review round 1 rejected commit `975f304` with two blockers and three
should-fixes. The blockers were an unbounded finite drift term that could coherently mask a
non-conservative smoother, and a retained cold-checkpoint regression that computed but did not
enforce the registered byte length/hash. Decision
[0014](../decisions/0014-bound-float64-smoother-drift.md) resolves the first before code changes:
both the absolute operation-count-derived roundoff bound and the corrected divergence tolerance
are load-bearing. The repair must also authenticate the artifact before decode. Should-fixes are
explicit v5 `grow-lk` parsing/round-trip coverage, a deterministic nonuniform v4/v5 field-bit
control, and correction of v4-only aggregate comments. The same reviewer must re-check every
finding before freeze.

All five repairs are now implemented. The solver and runner independently enforce decision
0014's bound; a coherent `shell=1`, `exchange=1e-6`, `drift=-0.999999` report fails by name.
The exact checkpoint length/hash are authenticated before decode with same-length shifted-byte
and shifted-length controls. Explicit aggregate-v5 CLI routing writes and round-trips a v2
checkpoint, the v4/v5 bit control starts from a deterministic nonuniform field, and aggregate
comments cover both policies. Both TypeScript projects, Rule 7 over 156 files, the authenticated
cold-checkpoint reconstruction, and 73/73 focused tests pass.

The first root replay while these source edits were deliberately uncommitted passed 786/788; its
only two failures were Phase 4 visual-provenance controls rejecting solver source bytes that
differed from Git `HEAD`. After remediation commit `47fc01d`, those two controls still failed and
exposed a narrower stale test assumption: they treated the current repository head as an accepted
Phase 4 evidence source forever. The verifier was correct to reject the evolved v5 source. The
tests now use immutable recorded Phase 4 commits `70a2496` (Pass A) and `dce7081` (archived Pass B)
as their positive fixtures, while current `HEAD` is deliberately irrelevant. The unchanged
verifier passes all 59/59 targeted tests with that correction. Commit the test repair, then rerun
the exact root suite.

## Out of scope

- Phase 5, GPU scaffolding, Phase 6 sweeps, and any modification of Phase 4 evidence.
- Loosening `divTol`, increasing `relaxMaxSweeps`, changing temperature, `sigmaInfinity`, pressure,
  grid spacing, domain, seed, size target, aspect-ratio thresholds, fill-CFL, noise, SDAK, or event
  timing to rescue morphology.
- Treating shell-clamp totals as physical uptake or weakening the dual-convergence contract.
- Re-running v4, tuning between v5 temperatures, or running exploratory morphology before the v5
  freeze.

## Tried and rejected

- **Calling −15 °C a failed column.** Rejected: it stopped at extent 5 after an unconverged
  relaxation, below the registered extent 60 measurement. Aspect ratio `0.6` is not valid gate
  evidence.
- **Waiting longer or merely raising the 200,000-sweep cap.** Rejected: iterate residual was
  exactly zero and divergence remained at `3.10e-7`; more identical sweeps cannot move a
  floating-point fixed point.
- **Loosening `divTol` or relying only on iterate residual.** Rejected: that restores the
  divergence-blind defect closed by decision 0006 and invalidates the scientific contract.
- **Changing scientific inputs, enabling SDAK, or adding event timing.** Rejected: those do not
  diagnose the numerical failure and would turn a pre-registered test into post-result tuning.
- **Starting Phase 5 while Phase 2b is unresolved.** Rejected: the charter permits no Phase 5
  overlap exception.
- **Accepting any finite drift that closes the identity.** Rejected by review: direct metering
  prevents inference but does not prove roundoff scale. Decision 0014 adds an independent
  operation-count-derived absolute bound.
- **Trusting checkpoint metadata as artifact identity.** Rejected by review: another structurally
  compatible tick-11 checkpoint could satisfy the numerical assertions. The retained regression
  must authenticate exact byte length and SHA-256 before decode.
- **Requiring current `HEAD` to remain a valid Phase 4 evidence source.** Rejected after the
  committed replay: a later versioned solver must differ. Positive provenance tests use the
  immutable recorded Phase 4 commits; the verifier still rejects evolved or rewritten sources.

## Open questions

- ~~Does the floor come from naïve accumulation or a deeper mismatch?~~ Resolved: exact summation
  proves it is the directly measurable float64 conservation drift of the split reflecting
  smoother.
- ~~Can the checkpoint reproduce the attempt?~~ Resolved: the written checkpoint contains the
  step-11 topology and attempted step-12 fixed-point field; one reconstructed sweep reproduces the
  plateau exactly without replaying morphology.
