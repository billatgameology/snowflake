# 0007 — Phase 3 work may overlap the tail of Phase 2b's pre-registered evidence run

- **Date:** 2026-07-15
- **Status:** accepted
- **Charter impact:** §3.2 updated in this session (charter v1.4 → v1.5)

## Context

Charter §3.2 states: "Phases 1 and 2 can run in parallel; everything else is sequential."
Phase 2b's deliverables are complete — spec, parameter table, implementation, six maker audit
rounds, protocol v3 registered — and the only outstanding item is the `gate2b` evidence run
itself, an hours-scale single-core process launched from commit 4ca9680 and still executing
(log `out/gate2b.log`). The maker directed on 2026-07-15 that Phase 3 (development
visualization) be planned and completed now rather than idling the project on that run.

Phase 3's gate — the automated center-vs-rim depletion metric during plate growth — depends
exclusively on Phase 2a machinery (`GGThreshold` plate, gated and maker-asserted 2026-07-15).
It has zero technical dependency on the 2b habit-gate result.

## Decision

Phase 3 work proceeds while `gate2b` executes, under these constraints:

1. The `gate2b` process, `out/gate2b.log`, and `out/gate2b-*.ckpt` are untouched by every
   Phase 3 session and subagent.
2. No Phase 3 claim, label, or gate criterion rests on any Phase 2b result.
3. Phase 2b's gate still closes only on its own recorded evidence; PROGRESS's registered
   next action for 2b (record the result honestly when the run exits, validate checkpoints,
   reconcile against the pre-registration) is unchanged and is not a Phase 3 task.
4. Phase 3 changes to shared packages are additive only; `GGSolver`/`LKSolver` numerics are
   untouched. (Editing `runner/src/main.ts` on disk cannot affect the running process — Node
   loaded its modules at launch.)
5. If `gate2b` exits during Phase 3 work, the coordinator surfaces that to the maker; Phase 3
   does not record or interpret the 2b result.

## Consequences

- Buys: hours of wall-clock overlap; the project does not idle on a compute-bound run with no
  remaining code work.
- Costs: the sequential-phases rule now has a recorded exception, and future models must read
  it as maker-directed and constraint-bounded, not as license for arbitrary phase overlap.
  Minor CPU contention with the 2b run is accepted (it is single-core; dev work is light).
- Forecloses: nothing. Phase 2b remains open until its own gate result is recorded.

## Alternatives considered

- **Wait for gate2b to finish** — rejected: the maker directed otherwise, and there is no
  technical dependency; the wait purchases nothing but idle time.
- **Start Phase 3 silently** — rejected: Rule 5. A bent charter rule without an ADR is exactly
  the drift these records exist to prevent.
- **Reorder: record 2b first from partial state** — rejected: a run in flight has no result to
  record; interpreting a partial log would itself violate the 2b evidence discipline.
