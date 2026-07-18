# 0010 — Phase 4 may proceed in isolation while Phase 3 review and Phase 2b evidence finish

- **Date:** 2026-07-16
- **Status:** accepted (maker-directed); original location clause amended by decision 0012
- **Charter impact:** §3.2 updated in this session (charter v1.7 → v1.8); execution location
  updated after maker consolidation in charter v1.10

## Context

Charter §3.2 says that, apart from its recorded exceptions, phases are sequential. Phase 3 is
implementation- and evidence-complete: its flagless `gate3` run passed, the app was visually
inspected by the coordinator and a separate reviewer, and the result is waiting for external
review and maker assertion. Phase 2b remains open for a different reason. Its v3 habit gate is
an execution-valid negative result; decision 0009's v4 surface policy is accepted and green,
while its hours-scale flagless evidence run continues in a separate worktree.

The maker explicitly directed on 2026-07-16 that the entire Phase 4 workflow proceed now in a
new worktree while Phase 3 testing continues. Phase 4 Pass A depends on the closed Phase 2a
oracle and the already-built Phase 3 inspection instrument, not on either pending assertion.
Pass B depends on decision 0009's accepted implementation contract, but its morphology is
diagnostic by decision 0005 and does not borrow validity from the still-running 96-cubed pair.

## Decision

Phase 4 may proceed on branch `codex/phase4-morphology-gauntlet` in the isolated worktree
`/Users/clipper/github/snowflake-phase4`, under all of these constraints:

1. The Phase 3 and Phase 2b worktrees, running processes, and `out/gate3*` / `out/gate2b*`
   artifacts are read-only from Phase 4. Phase 4 writes only its own `out/phase4/` evidence.
2. No Phase 4 criterion or claim is satisfied by an unfinished Phase 3 review or by partial
   Phase 2b output. A completed, honestly recorded Phase 2b v4 result may be linked later only
   as a higher-resolution reference, never substituted for Phase 4's registered Pass B.
3. Phase 4 begins from the accepted v4 code and authority chain integrated at merge commit
   `b080654`. The Phase 3 app and gate evidence remain preserved in that history.
4. If either upstream workstream lands a relevant code or contract correction before Phase 4
   evidence runs, the correction is integrated, reviewed, and all affected Phase 4 tests and
   evidence are rerun. An upstream scientific result alone does not permit threshold tuning.
5. Work remains serial inside Phase 4: each bounded implementation package is followed by a
   different agent's adversarial review and fix/retest loop before the next package begins.
6. This exception ends with Phase 4. It does not authorize Phase 5, Phase 6, or arbitrary
   overlapping work.

### 2026-07-18 location amendment — decision 0012

After the original isolated work completed, the maker directed that its commits be merged to
`main` and that the Phase 4 worktree/branch be removed. Phase 4 v2 therefore executes only on
`main` in the current Windows root `G:\Code Files\snowflake`; the obsolete branch/path in the
opening sentence above remains historical, not a live requirement.

This amendment changes location only. Items 1–6 retain their substantive force: the separate
Phase 2b worktree, PID, and evidence are read-only; no claim is borrowed; relevant upstream
corrections require integration/review/rerun; serial independent review remains mandatory; and
the overlap exception still ends with Phase 4. Phase 4 continues to write only `out/phase4/`.

## Consequences

- Buys: Phase 4 can use otherwise idle wall time, and its blocking G-G machinery gauntlet can
  close independently of two external review/evidence tails.
- Costs: three status lines coexist. Handoffs must distinguish Phase 3's pending maker
  assertion, Phase 2b's live v4 evidence, and Phase 4's own criteria and artifacts precisely.
- Requires: a final upstream reconciliation immediately before accepted Phase 4 evidence, plus
  reruns if reconciliation changes any load-bearing behavior.
- Forecloses: treating worktree isolation as permission to mutate or interpret another
  workstream's live evidence.

## Alternatives considered

- **Wait for both pending workstreams** — rejected by maker direction. Phase 4's blocking pass
  has no technical dependency on their unfinished decisions, and the accepted v4 contract is
  already available for its diagnostic pass.
- **Work in the Phase 3 or Phase 2b worktree** — rejected because it would mix reviewable state
  with active evidence and make artifact provenance ambiguous.
- **Use partial Phase 2b output to skip Pass B** — rejected: a live log is not a result, and
  Phase 4's smaller diagnostic sweep is separately pre-registered.
- **Treat decisions 0007/0008 as a standing overlap license** — rejected: both were narrowly
  scoped to Phase 3. The new maker instruction requires its own bounded exception.
