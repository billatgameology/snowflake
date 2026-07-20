# Plan — Phase 2b v5p parallel retry

- **Phase:** Phase 2b — attachment becomes physics
- **Status:** in progress
- **Started:** 2026-07-19
- **Last touched:** 2026-07-19 by Codex

## Goal

Complete the unchanged Phase 2b aggregate-v5 temperature pair while using two independent CPU
cores concurrently, preserving the scientific meaning and fail-closed evidence contract of the
reviewed sequential v5 protocol. Decision 0015 governs the scheduling change.

## Done when

The charter has no single “done when” sentence for Phase 2b. Its binding milestone remains:
**habit changes with temperature alone — the same solver, domain, far-field condition,
supersaturation, pressure, spacing, seed, noise, convergence controls, stopping rule, and
measurement size produce both pre-registered aspect-ratio habits; every fixed-sigma Dirichlet
relaxation satisfies both the iterate-residual and divergence-identity tolerances; the
depleted-start differential and permanent G-G control pass.** The flagless concurrent parent must
exit 0 and both independently authenticated checkpoints must satisfy every registered criterion.

## Interrupted sequential-v5 attempt

The first sequential-v5 execution at reviewed commit
`dd762f0154ba04134e32c8c82d864cfc80ae971c` was interrupted by accidental host shutdown. It is
incomplete liveness evidence, not a gate result:

- stdout `out/gate2b-v5-20260719_083231.log`: 21,710 bytes, SHA-256
  `7b19399678bbc9c5696b30dcfbb0f84fba8b3aee97ba367da8fec28bf2e5a610`;
- stderr `out/gate2b-v5-20260719_083231.err`: 850 bytes, SHA-256
  `61ee8cd4a9ad5d215ef299be3dcfb018d3a693505767f562704e256025d4632b`;
- completed warm step 188; shutdown occurred during step-189 relaxation after 6,144 sweeps, with
  residual `8.87e-9` and divergence `1.55e-4` still above tolerance;
- last complete morphology line was step 173: attached 693, extent 19, aspect ratio `0.157895`,
  exact delta symmetry;
- no final checkpoint, exit-status file, terminal verdict, or cold-run start exists.

These bytes remain immutable and are never reused by `v5p`.

## Frozen v5p protocol — pre-registration

The commit containing this section is the v5p pre-registration commit. Scientific and numerical
controls are byte-for-byte the sequential-v5 freeze in
[the v4/v5 plan](phase-2b-v4-convergence-failure-and-v5.md#frozen-protocol-v5--pre-registration):
surface policy `aggregate-hv-g1h1-v5`; temperatures −5/−15 °C; `96×96×96` `hexPrism`; center
`[48,48,48]`; fixed-σ Dirichlet; `sigmaInfinity=0.002`; 101325 Pa; `dx=0.35 µm`; `CAK_A1`;
fill-CFL `0.1`; `relaxTol=1e-9`; `divTol=1e-7`; 200,000 sweeps and surface steps; extent target
60; canonical radius-2/thickness-1 19-site seed; PRNG seed 1; noise 0; metrics every 200; no
events, SDAK, or ramps; plate AR `<=1/1.5`; column AR `>=1.5`; exact Node `v24.13.1` and V8
`13.6.233.17-node.40`.

The only registered differences are:

- command remains flagless `node runner/src/main.ts gate2b`, but the printed execution protocol
  is `v5p`;
- parent launches both fixed-role child processes before awaiting either;
- role-prefixed child streams may interleave nondeterministically;
- outputs are `out/gate2b-v5p-plate.ckpt` and `out/gate2b-v5p-column.ckpt`;
- wrapper artifacts use the `gate2b-v5p-<timestamp>` prefix.

All ten sequential-v5 acceptance criteria remain load-bearing. Additionally, the parent rejects
missing/duplicate/wrong-role IPC, a role/temperature mismatch, child error or abnormal exit,
unrecognized extra results, or a checkpoint path that does not match the role. Both jobs are
allowed to finish so one valid result is not discarded merely because its peer records a valid
negative or infrastructure failure; the aggregate verdict waits for and names both outcomes.

## Approach

Refactor the frozen options and result checks into shared runner functions, then use two Node
child processes with separate V8 heaps. The parent alone owns provenance and the aggregate exit
status. Each child owns exactly one solver and checkpoint and returns one typed result over IPC.
Line-prefixing keeps concurrent liveness output attributable without turning timing into evidence.

Pre-execution verification includes a compact real child-process comparison: run both roles once
sequentially and once concurrently with identical reduced-size controls, then require byte-equal
checkpoint pairs. Adversarial coordinator tests independently shift role, temperature, message
count, checkpoint binding, and exit status. The exact root suite, depleted-start differential,
and permanent enforcing Phase 2a control must remain green. A final independent audit requires
zero blockers and zero should-fixes before launch.

## Steps

- [x] Preserve and classify the interrupted sequential-v5 attempt.
- [x] Record decision 0015 and freeze v5p before implementation or morphology.
- [x] Implement isolated concurrent workers, labeled streams, IPC binding, and aggregate checks.
- [x] Prove compact sequential/concurrent checkpoint byte identity and adversarial coordinator
  failures.
- [x] Pass exact root tests, depleted-start differential, and enforcing Phase 2a control.
- [ ] Obtain independent review with zero blockers and zero should-fixes.
- [ ] Run the flagless v5p pair once and retain stdout, stderr, status, checkpoints, byte lengths,
  and SHA-256 values.
- [ ] Record the terminal result; close Phase 2b only if both habits and all criteria pass.

## Implementation evidence before final audit

The flagless parent now forks both fixed-role children before awaiting either. Each worker builds
the frozen options internally, writes only its registered v5p path, round-trips its v2 checkpoint,
and sends one typed terminal envelope. The parent role-prefixes both streams, waits for both,
authenticates exact IPC count/kind/role/temperature/path and process exit, reopens and decodes each
new checkpoint, checks every frozen header control, and independently binds tick, simulated time,
attached count, largest extent, aspect ratio, and final symmetry to the returned result. Existing
output paths reject before launch, preventing overwrite or stale-artifact substitution.

Focused verification passes 14/14 tests. The real compact process control starts separate warm
and cold Node processes concurrently and requires both checkpoint byte arrays to equal their
sequential counterparts exactly. Negative controls independently shift message count, role,
temperature, checkpoint path, exit code, signal, finite result data, and pre-existing outputs.
Exact `npm test` passes Rule 7 over 158 files, both TypeScript projects, and 793/793 tests across
43 files. The depleted-start differential passes 3/3. The permanent enforcing Phase 2a command
exits 0 at far-field stop tick 4,800 with exact symmetry, mass drift `2.056e-13`, aspect ratio
`0.168831`, and canonical checkpoint SHA-256
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`.

## Out of scope

- Parallelizing or changing the arithmetic inside `LKSolver`.
- Changing any scientific input, tolerance, stopping rule, threshold, seed, or operator policy.
- Resuming the interrupted in-memory warm state or using its partial log as a checkpoint.
- Phase 5 GPU work, Phase 6 sweeps, SDAK, event histories, or exploratory v5p morphology.

## Tried and rejected

- **Treating the interrupted warm log as resumable state.** Rejected: no checkpoint exists and
  current LK checkpoints do not define mid-history resume.
- **Launching cold ad hoc beside a restarted sequential warm run.** Rejected: it would not be one
  fail-closed gate and would violate the already registered sequential protocol.
- **Using worker threads inside the solver.** Rejected: shared/reordered reductions could change
  the float64 oracle. Separate processes preserve solver arithmetic.

## Open questions

None. The user explicitly selected concurrent execution on the multicore 64 GB host.
