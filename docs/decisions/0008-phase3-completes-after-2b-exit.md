# 0008 — Phase 3 completes after the 2b evidence run's exit

- **Date:** 2026-07-16
- **Status:** accepted
- **Charter impact:** §3.2 updated in this session (charter v1.5 → v1.6)

## Context

ADR 0007 authorized Phase 3 work while the pre-registered `gate2b` evidence run executed.
That run has exited (exit status 1; recorded by the 2b session as an execution-valid negative
result — protocol v3's −15 °C run failed its column criterion). The 2b recording session then
paused further Phase 3 work in PROGRESS, correctly reading 0007's license as ended, "pending
explicit maker direction and, if overlap continues, an amending ADR."

At pause time Phase 3 stood one step from completion: WP1/WP1b (depletion metric + flagless
`gate3`) reviewed CLEAN through two adversarial rounds; WP2/WP3 (the app) built, WP2 reviewed
CLEAN; remaining work was the R3 review loop of WP3, one coordinator-found visual fix (slice
capture composition), and the `gate3` evidence run. Phase 3's gate rests exclusively on
Phase 2a machinery (`GGThreshold` plate, closed); it neither reads nor claims anything from
Phase 2b, whose protocol-v4 work proceeds independently.

## Decision

The maker directed on 2026-07-16 (in the Phase 3 orchestration session, via explicit
choice): **complete Phase 3** — R3 review loop, visual fix, `gate3` evidence run, and honest
recording of its result. This is the amending ADR that 0007's pause language called for.

Constraints carried forward from 0007, now condition-independent:

1. The completed 2b evidence (`out/gate2b.log`, `out/gate2b-*.ckpt`,
   `out/gate2b-exit-status.txt`) is immutable.
2. No Phase 3 claim, label, or criterion rests on any Phase 2b result.
3. Phase 3 changes to shared packages remain additive; solver numerics untouched.
4. Territory separation with the concurrent 2b session holds: the 2b session's uncommitted
   work (`core/src/libbrecht.ts`, `core/test/libbrecht.test.ts`, 2b docs) is left intact and
   is never committed by Phase 3 sessions; Phase 3 sessions commit only files they own.

## Consequences

- Buys: Phase 3 closes on its registered protocol instead of stranding a 95%-complete,
  twice-reviewed work package; the charter's Phase 4 pass A (GGThreshold, blocking) gains its
  visualization instrument regardless of how 2b's v4 physics work resolves.
- Costs: two phases are now legitimately active at once (Phase 3 finishing, Phase 2b v4 in
  flight), so sessions must read both plans' territories before touching shared files.
- Forecloses: nothing. A failed or passed gate3 is recorded either way; 2b v4 proceeds
  unaffected.

## Alternatives considered

- **Hold Phase 3 until 2b closes** — rejected by the maker: 2b's v4 protocol (reopened
  facet-classification policy, amending ADR, rerun) is long-horizon, and Phase 3 has zero
  dependency on its outcome.
- **Finish R3 only, hold the gate3 run** — rejected by the maker: an unclaimed gate leaves
  PROGRESS in exactly the ambiguous state the handoff rules exist to prevent.
- **Treat 0007 as still licensing the work** — rejected: its stated condition ("while gate2b
  executes") ended; continuing without a new decision would overrule the 2b session's
  correct governance reading silently.
