# Plan — Phase 2b v4 convergence failure and v5 closure attempt

- **Phase:** Phase 2b — attachment becomes physics
- **Status:** complete
- **Started:** 2026-07-19
- **Last touched:** 2026-07-23 by Codex

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
- Log: `out/phase2b/v4/gate2b-rerun-20260717_162624.log`, 116,549 bytes, SHA-256
  `9f6ac629a5175cacbe0f55435e638276fdfc018d7ef163855c5a1c2ce0de41e6`.
- Stderr: `out/phase2b/v4/gate2b-rerun-20260717_162624.err`, 271 bytes, SHA-256
  `17535e98a254c4986eccc919f0e6e70a40dbc3e088b4f3ec70bb9a8190669b10`.
- Warm checkpoint: `out/phase2b/v4/gate2b-v4-plate.ckpt`, 15,041,089 bytes, SHA-256
  `fee39ec1ebdf481e370661e1ca4a13384b2d6f3a56477db1b35927f2355179a8`.
- Cold checkpoint: `out/phase2b/v4/gate2b-v4-column.ckpt`, 15,041,088 bytes, SHA-256
  `8997d90689fdbe6fb7fe496e4d2780d2f61abe92166e67ed56fa77e65f2de91d`.

The original paths were relative to `.tmp-gate2b-clean-1784305494`; authenticated copies now
live at the stable primary-tree paths above. These bytes are immutable; v5/v5p use distinct
filenames and must not modify, replace, or relabel them.

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
- [x] Freeze and commit the complete v5 protocol before any two-temperature morphology run.
- [x] Complete independent adversarial repair review with no unresolved findings.
- [x] Execute decision 0015's flagless concurrent v5p replacement once from a clean isolated
  repository and validate all artifacts.
- [x] Record the result in this plan and `docs/PROGRESS.md`; close Phase 2b only if every criterion
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
verifier passes all 59/59 targeted tests with that correction. At tracked-clean commit `61ccc40`,
exact `npm test` passes the Rule 7 scan over 156 files, both TypeScript projects, and 788/788 tests
across 43 files. The final depleted-start differential passes 3/3, and the enforcing Phase 2a
control again exits 0 at tick 4,800 with exact symmetry, mass drift `2.056e-13`, and canonical
checkpoint SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`.
The same reviewer replayed every round-1 finding and the provenance-test correction at
`9640c42`: all five original findings are closed, the authenticated cold reconstruction remains
inside the registered-scale bound, and focused solver/runner/artifact/Phase 4 tests pass. That
review found one new should-fix before freeze: for an accepted all-subnormal field such as
`sigmaInfinity = 1e-320`, the relative-error product could underflow to a zero bound while the
stencil still produced nonzero subnormal roundoff. This is fail-closed and cannot affect the
registered `0.002` condition, but decision 0014 applies to the full accepted domain. The authority
and implementation now floor the per-cell error scale at one minimum binary64 subnormal while
special-casing an exact zero field. The reviewer's exact three-site reproduction passes, as do
Rule 7, both typechecks, and 30/30 focused solver tests. The same reviewer re-checked immutable
commit `af90921` and returned **0 blockers / 0 should-fixes**. Its independent nonuniform
subnormal probe measured drift `2e-323` within bound `1.31034e-318`; exact zero produced zero
drift and bound; the registered-scale bound remained bit-identical at
`2.924275577242952e-10`. Exact `npm test` at that tracked-clean commit passes Rule 7 over 156
files, both TypeScript projects, and 789/789 tests across 43 files.

## Frozen protocol v5 — pre-registration

This section is the complete protocol freeze. The commit containing this section is the v5
pre-registration commit; the subsequent execution implementation must pin its full hash and may
change only the runner routing named below. No two-temperature v5 morphology has been run before
this freeze. The independently reviewed repair baseline is
`af90921def17961a45765ca83c672c6c742112c6`.

### Execution and provenance

- Command: `node runner/src/main.ts gate2b`, with no flags. Any flag is an error.
- Engine: exactly Node `v24.13.1`, V8 `13.6.233.17-node.40`.
- Execution state: a tracked-clean Git commit for which this pre-registration commit is an
  ancestor. The runner prints both full identities before starting.
- Order: run −5 °C first, then −15 °C. Execute the pair exactly once; there is no mid-run resume,
  substitution from v4, tuning between temperatures, or exploratory v5 morphology beforehand.
- Outputs: `out/gate2b-v5-plate.ckpt` and `out/gate2b-v5-column.ckpt`. These are distinct from and
  may not overwrite the immutable v3/v4 evidence. Stdout, stderr, wrapper exit status, checkpoint
  byte lengths, and SHA-256 values are retained after termination.

### Frozen controls

Both runs use `aggregate-hv-g1h1-v5`, the same v4 aggregate boundary/fill physics and arithmetic
ordering with only decisions 0013–0014's directly metered, bounded float64 smoother-drift
diagnostic added to convergence. Temperature is the only differing control.

| Control | Frozen value |
|---|---|
| temperatures / expected habits | −5 °C plate, then −15 °C column |
| domain | `96 × 96 × 96` `hexPrism`, center `[48,48,48]` |
| far field | fixed-σ Dirichlet |
| `sigmaInfinity` | `0.002` dimensionless fraction |
| air pressure | `101325 Pa` |
| lattice spacing | `0.35 µm` |
| nucleation mapping | `CAK_A1` |
| fill-CFL | `0.1` |
| relaxation residual tolerance | `1e-9` |
| divergence tolerance | `1e-7` |
| maximum sweeps per relaxation | `200000` |
| maximum completed surface steps | `200000` |
| stopping target | largest extent at least `60` cells |
| seed | radius `2`, thickness `1`, canonical `19` sites |
| PRNG seed / production noise | `1` / `0` |
| metrics cadence | every `200` completed steps |
| events, SDAK, ramps | none |

### Enforced acceptance criteria

The flagless process exits 0 only when every item below passes for both runs; otherwise it exits
1 and names each failed criterion. A contact-stopped, stalled, unconverged, or step-limited state
is not habit evidence even if its instantaneous aspect ratio crosses a threshold.

1. Provenance and engine match the frozen values above; execution is tracked-clean and descends
   from this pre-registration.
2. The decoded/constructed policy is exactly `aggregate-hv-g1h1-v5`, and the seed contains exactly
   19 sites.
3. Termination is `size-target`, with measured extent at least 60 and no domain contact.
4. Every attachment delta is D6h-invariant and final symmetry error is exactly zero.
5. Every fixed-σ relaxation converges with residual `< 1e-9` and independently recomputed
   three-term divergence residual `< 1e-7`. Signed shell injection and signed net surface
   exchange are finite and strictly positive on every accepted step.
6. Every directly metered smoother drift is finite and satisfies the independently constructed
   decision 0014 bound using the fixed `sigmaInfinity`; report-supplied scale cannot authorize it.
7. Maximum kinetic fill increment is `<= 0.1 + 1e-12`; hole-fill events remain separately
   deficit-ledgered and do not consume this bound.
8. The conservative Péclet upper bound is `< 1e-2`.
9. Each final v2 checkpoint round-trips with identical controls and field bits and names v5.
10. At the registered extent, −5 °C has aspect ratio `<= 1/1.5`; −15 °C has aspect ratio `>= 1.5`.

Exit 0 is the Phase 2b result. Exit 1 with valid numerical execution is an honest morphology
negative; an unconverged or provenance-invalid execution is invalid gate evidence and must not be
relabelled as a habit result.

## Execution implementation verification

The runner now pins full pre-registration commit
`acf4f82e80382b01c5dc13dc353d96b070077cf6`, requires it as an ancestor of tracked-clean execution
`HEAD`, routes the flagless pair and forward `grow-lk` default to aggregate v5, and writes only the
frozen v5 checkpoint paths. Aggregate v4 remains available only by an explicit exploratory policy
flag. Per-step validation still independently recomputes the three-term identity and absolute
drift bound; a separate run-summary validator rejects missing, shifted, non-finite, out-of-bound,
or older-policy drift fields. The final aggregate divergence criterion now uses the frozen
`divTol = 1e-7` directly rather than v4's redundant looser `1e3 * relaxTol` summary check.

Focused runner/artifact verification passes 12/12 with both typechecks and Rule 7 clean. The
depleted-start differential passes 3/3. The permanent enforcing Phase 2a command exits 0 at
far-field stop tick 4,800 with exact symmetry, mass drift `2.056e-13`, aspect ratio `0.168831`,
and canonical checkpoint SHA-256
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Exact `npm test` after all
execution-routing changes passes Rule 7 over 156 files, both TypeScript projects, and 791/791
tests across 43 files.

## Terminal execution result

The first sequential-v5 execution at reviewed commit `dd762f0` was interrupted by accidental host
shutdown during warm step-189 relaxation. It produced no checkpoint, no wrapper status, no
terminal verdict, and never started the cold role. Its immutable liveness-only log and stderr are
preserved below `out/phase2b/v5-interrupted/` with SHA-256 values
`7b19399678bbc9c5696b30dcfbb0f84fba8b3aee97ba367da8fec28bf2e5a610` and
`61ee8cd4a9ad5d215ef299be3dcfb018d3a693505767f562704e256025d4632b`.

Decision [0015](../decisions/0015-parallel-phase2b-temperature-pair.md) then pre-registered v5p,
changing only scheduling and artifact names. Its reviewed flagless execution at `0dc0f86` exited
0: the −5 °C role reached extent 61 with aspect ratio `0.118644`, and the −15 °C role reached
extent 61 with aspect ratio `12.2000`. Both had exact symmetry, size-target termination, all
relaxations converged, bounded float64 smoother drift, fill-CFL and Péclet controls satisfied,
and round-trip-identical checkpoints. The complete artifact table and hashes are in
[the v5p plan](phase-2b-v5p-parallel-retry.md#terminal-v5p-result). This satisfies the frozen
Phase 2b milestone; the earlier v3 negative and v4 execution-invalid records remain immutable.

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
