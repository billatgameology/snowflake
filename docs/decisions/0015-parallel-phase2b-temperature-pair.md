# 0015 — Run the Phase 2b temperature pair concurrently

- **Date:** 2026-07-19
- **Status:** accepted
- **Charter impact:** none; this changes execution scheduling, not the Phase 2b scientific gate

## Context

The reviewed protocol-v5 implementation is deterministic and each temperature run owns a
separate `LKSolver` instance, output path, and mutable state. Its first registered execution was
externally interrupted by an accidental computer shutdown after about 2.4 hours, during the warm
run, before either final checkpoint or the cold run existed. The solver is single-threaded while
the replacement Windows host has many CPU cores and 64 GB of RAM. Repeating the sequential pair
would leave most cores idle and roughly add the two wall times.

The v5 pre-registration required warm-then-cold sequential execution. Although ordering is not a
scientific input, silently changing it would contradict the registered evidence protocol. The
change therefore needs a named replacement protocol before another morphology execution.

## Decision

1. Execution protocol `v5p` retains `aggregate-hv-g1h1-v5` and every frozen v5 scientific,
   numerical, stopping, engine, provenance, and acceptance control. Only scheduling and artifact
   names change.
2. The flagless parent command launches exactly two separate Node child processes concurrently:
   one fixed −5 °C plate job and one fixed −15 °C column job. Each child receives only its named
   role; it constructs the complete frozen options internally. No command-line or environment
   override may alter a gate child.
3. Children share no solver arrays, PRNG state, checkpoint path, or mutable evidence object.
   Operating-system interleaving may change elapsed time and log-line order only. It may not enter
   any solver equation or counter-based random stream.
4. The parent validates the exact engine, tracked-clean execution commit, and pre-registration
   ancestry before launch. It binds each IPC result to its expected role and temperature, waits
   for both terminal results, and applies the same fail-closed criteria as sequential v5.
5. Worker output is role-prefixed. Final checkpoints use distinct `v5p` paths. Child failure,
   missing/duplicate IPC, wrong role, wrong temperature, abnormal exit, or incomplete checkpoint
   is a named gate failure. One failed child does not silently relabel or substitute the other.
6. Before the hours-scale execution, a compact deterministic control must show that isolated
   concurrent execution and sequential execution produce bit-identical final checkpoint bytes for
   both temperatures. Coordinator tests must also prove both children are launched before either
   finishes and independently trip every role/IPC/exit failure.
7. The interrupted sequential v5 attempt remains immutable liveness evidence only. It is neither
   an execution result nor an input to `v5p`.

## Consequences

- On a multicore machine, elapsed wall time should approach the slower temperature run rather
  than their sum. Each solver remains the permanent single-threaded float64 oracle.
- CPU contention can change wall-clock duration and heartbeat ordering. It cannot change a valid
  deterministic checkpoint; the compact byte-identity control makes that premise falsifiable.
- Peak memory and CPU use approximately double, which is acceptable on the stated 64 GB host.
- Protocol `v5p` needs a new pre-registration hash, execution commit, audit, log names, and
  checkpoint names. Sequential v5 and its interrupted log remain frozen history.

## Alternatives considered

- **Restart sequential v5 unchanged.** Scientifically valid but rejected by the user because it
  leaves available cores idle and repeats the sum of both wall times.
- **Add threads inside one solver.** Rejected because it changes reduction order and the float64
  oracle itself; this is a scheduling repair, not a new numerical operator.
- **Run two ad-hoc `grow-lk` commands.** Rejected because exploratory commands do not aggregate or
  enforce the complete gate and would lose fail-closed provenance/result binding.
- **Start cold now while resuming warm.** Rejected because no warm checkpoint exists and LK
  mid-history resume has no defined checkpoint meaning.
