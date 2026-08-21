# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). The handoff mechanism is retired (maker direction
2026-08-20): this index plus the active plans are the sole live state, and work proceeds in
isolated worktrees per Rule 16.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 (Phases 0–5 and early
Phase 6) are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md); its body is
byte- and SHA-256-pinned by `runner/test/progress-index.test.ts`. The detailed Phase 6, 8, and
9 entries pruned from this index on 2026-08-20 are preserved as last written in
[progress-history-phases-6-8-9.md](progress-history-phases-6-8-9.md). Both are historical, not
current authority; open them only when this index, a plan, ADR, or audit links to historical
detail.

## Current state

- **Phase 6 is COMPLETE (2026-08-20).** The maker accepts the recorded failure to reproduce the
  Nakaya diagram as the phase's scientific finding. Decision
  [0045](decisions/0045-bound-phase6-closure-to-a-compute-week.md) and charter v1.22 defined the
  discharge and every element executed: the frozen WP1 strata; the three measured-only arms
  (CAK 3/90; M1 54/78 arm scope, 54/90 common denominator; `M1_NO_DIP_ABLATION` 5/78, 5/90); the
  80/80 numerical-control ladder with its published **NO-PASS (criterion)** verdict and
  review-confirmed re-derivation; the pinned
  [three-arm narrative](../evidence/phase6-three-arm-report/report.md) stating agreements,
  disagreements, numerical limits, and the accepted failure; and the flagless `gate6`, which
  re-derives all of it from committed evidence and exited 0 (13/13 criteria; repro:
  `node runner/src/main.ts gate6`). ADR 0026's conservative-intersection headline, R15's
  production path, and the full three-arm campaign closed at measured-only grade — stated as
  not computed by decision 0045, never as satisfied. No Phase 6 label was upgraded; the phase
  closes with zero quantitative-validation claims, and the 0043/0044 deferrals stay Phase 7
  property with no Phase 6 credit.
- **Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12).**
  Decision [0048](decisions/0048-focus-phase8b-on-phase9-ready-benchmarks.md) and charter v1.25
  preserve the completed [Phase 8A target book](plans/phase-8-what-is-real.md) byte-for-byte and
  focus the [Phase 8B corpus](plans/phase-8-measurement-corpus.md) on measurements Phase 9 can use.
  The [plain-English guide](phase8-baseline-guide.md) maps measured families to tests, limits and
  Git/NAS artifacts.
  Phase 8B writes separate artifacts; the immutable Phase 8A book remains 59,019 bytes / SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`.
  Quoted from [`evidence/phase8b-benchmark-final-v1/report.json`](../evidence/phase8b-benchmark-final-v1/report.json):
  the successor contains 51 model-development records (18 P0 / 28 P1 / 5 P2), zero held-out rows,
  252,134 native history rows, 431 adjudicated plot points and zero P2 coordinate rows. Its
  independent verifier returned `ok=true`; successor-target-book SHA-256 is
  `c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3`. The targeted pass is
  terminal and bounded, not global literature closure; the corrected residual sample is 0/9 misses
  after preserving and remediating its original Bacon miss. Phase 8B itself scored no model,
  supplied no adoption authority, and cannot grant a validation label. The exact full suite passed 97/97
  files; the detached clean-checkout verifier and 51 focused tests passed; and the final non-author audit
  returned zero blockers after its two bookkeeping findings were repaired. Phase 7 is completely
  standalone, unstarted and requires its own plan/worktree; Phase 10 was still uncharted when
  Phase 8 closed.
- **Phase 9 is COMPLETE (development-only, 2026-08-13).**
  Decision [0050](decisions/0050-adopt-phase9-modular-physics-experiments.md), charter v1.27 and the
  [execution plan](plans/phase-9-execution.md) authorized isolated Mac development. S0B's
  [report](../evidence/phase9-source-overlay-v1/report.json) (6,530 bytes; SHA-256 `51e1fa2b…63d8a`)
  resolves 70 aliases to 59 complete artifacts. The files record an in-session shelf freeze before
  scoring; detailed S0B and scored-result bytes first entered Git together in `1efe127`, so
  Git ordering cannot independently prove that sequence. S1 maps all 51 rows through fail-closed adapters. All 51 Phase 8B records remain development evidence.
  Separate [verification receipts](../evidence/phase9-publication-verification-v1/) bind the clean-head
  commands and stdout for D-BT (`central-no-effect-or-failure`, Lamb `431.3416` versus rescale
  `0.6578183`, 0/6 wins, 24 no-flip sensitivities) and M-F/M-K2
  (`diagnostic-mapping-dependent`, 2/5, physical score unavailable). Other arms stop at reviewed
  source/analytic/refusal foundations; the all-no-pass branch closed:
  zero promotions and no combination campaign. Exact `TMPDIR=/private/tmp npm test` passed at
  completion; a later [different-model external review](reviews/phase9-external-review-2026-08-13.md)
  re-ran it as 115/115 files, 1,912 passed and seven skipped; the
  [post-review repair run](reviews/phase9-external-review-repairs-2026-08-13.md) passed 116/116 and
  1,924. Phase 9 cannot grant a quantitative-validation label or earn Phase 6/7 credit. The Mac
  lane ran only source/scalar/planar work; Phase 6's Windows evidence
  host, processes, artifacts, and then-unpublished verdict remained isolated throughout. The
  [maker guide](phase9-model-development-guide.md) explains the data, methods, results, and next evidence.
- **The Phase 9 knowledge baseline is COMPLETE (research-only, 2026-08-12).** Its
  [report](../research/phase9-knowledge-sources.md), [guide](phase9-knowledge-guide.md), and
  [artifact](../evidence/phase9-knowledge-baseline-v1/report.json) (5,263 bytes; SHA-256
  `37c7aadf18bce7420883930f66d6c6a473100dd27e1468dd8396a3c1214b1f96`) preserve 18 sources and
  15 hypotheses. It is now a bound S0B input; no model ran during its construction.
- **Maker directions (2026-08-20).** Phase 7 is on hold and, when resumed, runs as a parallel
  product/engineering track beside the science workstream (charter v1.23 already makes it
  standalone; this adds no new authority and starts nothing). The handoff mechanism is retired:
  [HANDOFF.md](HANDOFF.md) is a tombstone kept only for the byte-frozen archive's links, and its
  test pin now enforces the tombstone. The maker clarified that the Phase 10 A+B text was
  brainstorming and **selected no Phase 10 package (2026-08-20)**. Commit `f51f58e` recorded that
  brainstorm as a selection before the correction arrived; this live index and the
  [decision-ready candidate plan](plans/phase-10-closures-and-frontier.md) supersede that status
  statement. At the close of 2026-08-20, Phase 10 remained uncharted, no execution plan was active,
  and no scientific PC run was authorized.
- **Phase 10 is IN PROGRESS (selected 2026-08-21).** The maker accepted the candidate plan's
  recommended **A-S + A-I + B + C0 + C0V with packet-specific A-P** package. The separate C1–C5
  numerical qualification work, including the early attached-count/domain sentinel and every
  scientific habit row, is explicitly unselected. The active
  [execution plan](plans/phase-10-evidence-verification-execution.md) runs in the isolated
  `phase10/evidence-verification` branch at `G:\Code Files\snowflake-phase10-evidence`. The S0
  governance checkpoint is complete: accepted
  [decision 0052](decisions/0052-adopt-phase10-evidence-verification.md), charter v1.28, the active
  plan, state reconciliation, and complete charter-diff audit landed together before source
  consumption or package implementation. S1 now freezes the 21-packet, 112-output, 140-check,
  23-negative-control obligation graph and its three conditional groups. The registered matrix is
  125,508 bytes / SHA-256 `8f85e6febad1ec7568b2a7a47dd764c260cc1f602da08c7dd27d5ee1a6c1bab3`; its
  foundation is 32,327 bytes / SHA-256
  `7847f26a24d1a09eefc6b15ed07baf1d007782fdd58c3301e3f926e4c8805871`; and its schema
  registry is 114,255 bytes / SHA-256
  `c89463c37384d5652b57c039e26f0c612b08a2d9bb5994482bbf750eae121c70`. The focused
  preflight suite passes 14/14, both required mutations refuse, and a non-author contract review
  reports zero unresolved blockers. Exact `npm test` is the S1 checkpoint check. S2 has now frozen
  the independently audited 69-row A-S classification protocol as separate 18-entry Phase 8A and
  51-record Phase 8B rosters. Before that commit, two temporary focused-test invocations derived
  throwaway candidate bytes from the real frozen corpus; they are recorded as invalid ordering
  attempts, retained and published nothing, changed no classification, and do not count as S2
  verification. The executable checkpoint resolves the real A-P and A-S registries and their
  independently reviewed static lifecycles; its exact `npm test` passed 135/135 files and 2,250
  tests with 49 skipped. From clean head `ce2d9e62c17336060381d9bc806e4379f744070d`, A-P then
  published a six-file PASS bundle: 12 artifacts reopened, 11/11 checks passed, and both mandatory
  missing-producer and uncalled-check mutations executed and were rejected. Its independently
  rederived evidence landed at `63ca13c0de16f01f224c60e7fe29405b2798cf0e`. From that clean
  head, A-S published separate 18-entry Phase 8A and 51-record Phase 8B overlays: all 11 checks pass
  and all four named mutations execute and are rejected. A non-author evidence review rederived
  every row, count, role, ownership, eligibility, claim boundary, and dependency with zero
  blockers. A-S reports scope in/mixed/out/unresolved = 9/1/3/5 for Phase 8A and 31/0/2/18 for
  Phase 8B, with quantitative eligibility 0 in both. Its seven files total 537,246 bytes and are
  pinned in the 363-file / 4,874,715-byte evidence manifest. Exact post-publication `npm test`
  passes 135/135 files and 2,250 tests with 49 skipped. No solver row or scientific result occurred.
- **Phase 10 C0 implementation trap (found 2026-08-21).** The frozen WP2 plan, primary evaluator,
  its mixed pass/fail controls, and `gate6` require every spacing to pass before the top-level result
  can pass. The later post-execution independent script uses `some` instead of `every`. Both
  published spacings are no-pass, so the historical verdict is unchanged. C0 must freeze the
  all-spacings rule, test both mixed directions, and retain the old script mismatch as a historical
  verifier limit; see the active plan's **Tried and rejected** record.
- **Assurance is proportional to decision risk.** [Decision 0049](decisions/0049-make-assurance-proportionate-to-decision-risk.md),
  charter v1.26 and `AGENTS.md` require integrity for routine sources, one targeted check for
  load-bearing inputs, and full named controls for gates or strong public claims. No recursive
  reviews; stop when another check cannot change the decision. No evidence or criteria changed.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict, which
  decision 0045 closed as not computed.
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- Education is frozen with known-stale prose; the Pages deploy is retired (2026-08-16, maker
  direction) and content stays in-repo unpublished, `test.yml` CI unaffected. Reconciliation is
  a live decision point under **Next step**. Full freeze history:
  [the history file](progress-history-phases-6-8-9.md).
- **Last updated:** 2026-08-21 (committed A-P PASS; published, pinned, independently rederived, and
  exact-suite checked A-S PASS; left the S2 evidence commit)

## Phase gates

A scientific gate is complete only through named, reproducible evidence. Detailed review history
and every superseded attempt live in the linked plans and historical progress snapshot.

| Phase | Current gate state | Reproduction/evidence |
|---|---|---|
| 0 | Complete, maker-asserted 2026-07-14 | Charter §2.8 knowledge checks; no automated metric is applicable. |
| 1 | Complete, maker-asserted 2026-07-15 | Informal UX sessions were positive; the four-task protocol was not run. [Plan](plans/phase-1-ux-spike.md). |
| 2a | Complete, maker-asserted 2026-07-15 | Seed 1, `128,128,64` hexPrism plate: symmetry error 0 through 4,800 ticks, AR `0.168831`; checkpoint SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Repro: `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. |
| 2b | Complete 2026-07-20 | Clean `0dc0f86`, seed 1, `96³` hexPrism, extent 61: −5 °C AR `0.118644` plate; −15 °C AR `12.2000` column; symmetry error 0 and every relaxation converged. Repro: `node runner/src/main.ts gate2b`. |
| 3 | Complete, maker-asserted 2026-07-23 | `gate3` exit 0: depletion-ratio median `0.531454`, 90.2% below 1, radius 38, symmetry error 0. Repro: `node runner/src/main.ts gate3`. |
| 4 | Complete 2026-07-18 | `gate4` at `70a2496`: 24/24 blocking G-G records and 12/12 diagnostic LK records executed; `gatePass=true`, `passBDiagnosticPass=false`. Repro: `node runner/src/main.ts gate4`. |
| 5 | Complete, maker-asserted 2026-07-26 | Clean `c436df5`, observed Windows/Chromium/D3D12: 16/16 gate criteria, 560 bounded segments below 500 ms, zero device losses/errors/full-field display-frame reads, 16/16 negative controls rejected. Repro: `node runner/src/main.ts gate5-lane` and `node runner/src/main.ts gate5`. |
| 6 | **Complete 2026-08-20** | `gate6` exit 0 at `44488ab`: 13/13 criteria re-derive the amended obligations from committed evidence — strata freeze, three measured-only arms (3/90; 54/78·54/90; 5/78·5/90), ladder NO-PASS (criterion), narrative report, closure labels, 0043/0044 deferrals. Negative result accepted as the finding; no label upgraded. Repro: `node runner/src/main.ts gate6`. |
| 7 | Not started; independently eligible | Charter v1.25 preserves Phase 7's independence but does not start it. A committed Phase 7 plan and isolated worktree are required; product, held-out validation, and v6 WGSL/preview-GPU parity remain its scope. |
| 8 | **Complete (8A + 8B)** | The immutable 8A book remains 18 entries / 59,019 bytes / SHA-256 `47a75f3f…71ec`. The verified 8B successor is 51 development records, 252,134 native rows and 431 plot points; no row is held out. [Completed plan](plans/phase-8-measurement-corpus.md). |
| 9 | **Complete (development-only)** | The all-no-pass branch closed: D-BT failed, M-F/M-K2 stayed mapping-dependent, controls/path-state/M-PK are unavailable or non-identifiable, and zero items promoted. Exact `TMPDIR=/private/tmp npm test` passed; no result grants validation credit. [Completed plan](plans/phase-9-execution.md). |
| 10 | **In progress — A-S PASS staged; commit pending** | A-P PASS is committed. At clean head `63ca13c`, A-S published 18/18 and 51/51 overlays, passed 11/11 checks, executed/rejected four controls, and received a zero-blocker non-author evidence review. Seven files are manifest-pinned and exact post-publication `npm test` passes 135/135 files; only the S2 commit remains. Selection still includes no C1–C5 or habit rows; no solver row or scientific result occurred. |

## Active plan

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the completed Phase 6 record (see its Completion record).
[phase-8-measurement-corpus.md](plans/phase-8-measurement-corpus.md) and
[phase-8-what-is-real.md](plans/phase-8-what-is-real.md) are completed records; the
[Phase 9 execution plan](plans/phase-9-execution.md) is complete and its
[knowledge-baseline plan](plans/phase-9-knowledge-baseline.md) is a completed research input.
The older [proposed consumer plan](plans/phase-9-modular-physics-arms.md) is superseded design
history, not execution authority. Decisions 0046–0050 keep worktrees, processes, artifacts, claims,
and completion credit isolated.
[nas-asset-governance.md](plans/nas-asset-governance.md) is a completed infrastructure record; its
correction changes no phase claim or credit.

The [Phase 10 execution plan](plans/phase-10-evidence-verification-execution.md) is active in its
isolated worktree. Its S0 governance checkpoint, S1 contract freeze, and S2 A-S classification
freeze are complete; the A-P bootstrap and A-S static lifecycle are implemented and independently
reviewed. The six-file terminal A-P PASS dependency is committed. A-S is published, independently
rederived, manifest-pinned, and exact-suite checked; the S2 evidence commit is the active bounded
work. A-I, B, C0, and C0V remain unstarted. The
[Phase 10 candidate plan](plans/phase-10-closures-and-frontier.md) is completed decision support
and superseded for execution. It remains the design history for the selected and rejected packages,
not execution authority.

The old source-strata/ladder/WP3/R15 prerequisite sentence governed the now-closed Phase 6
production path. WP3 and R15 closed as not computed under decision 0045; that sentence does not
govern a future Phase 10 diagnostic. Any selected Phase 10 execution must instead freeze and pass
the package-specific prerequisites in its charter amendment and execution plan. Decisions
0043–0044's Phase 7 deferrals remain authoritative and cannot be discharged by Phase 10.

## Next step

### Phase 10 — commit A-S PASS, then start A-I and C0

The maker selected **A-S + A-I + B + C0 + C0V with packet-specific A-P** on 2026-08-21. No
C1–C5 numerical-qualification or scientific habit row is part of this execution. The
[active plan](plans/phase-10-evidence-verification-execution.md) preserves the candidate plan's
done/stop rules, authority boundaries, finite source and compute budgets, and return-only handling
of candidate E/F/H branches.

S0 landed accepted [decision 0052](decisions/0052-adopt-phase10-evidence-verification.md), charter
v1.28, the execution plan, state reconciliation, and complete charter-clause audit together before
source consumption or implementation. S1 then froze the package matrix, schemas, input identities,
rights/resource boundaries, and fail-closed callable/receipt contracts. The independently audited
69-row A-S classification protocol and strict contract are committed, and both the A-P and A-S
static lifecycles now have resolved callable identities, focused tests, exact full-suite coverage,
and zero-blocker non-author reviews.

The A-P PASS dependency is committed at `63ca13c`. From that clean head, the exact A-S sequence
published separate 18-entry and 51-record overlays, passed all 11 checks, executed and rejected all
four controls, and received a zero-blocker non-author evidence review. The seven files are pinned
in the 363-file / 4,874,715-byte manifest, and exact post-publication `npm test` passes 135/135 files
and 2,250 tests with 49 skipped. Commit S2.

After the clean S2 evidence head exists, begin S3 A-I and S4 C0 as separate bounded lanes. A-I may
inspect only the governed 14-payload/24-file intake and the frozen finite currency roster; it does
not execute `b-acquisition`. C0 reads only the committed Phase 6 ladder report and transitively
bound 80-row file, runs no solver, freezes the all-spacings rule, and records the historical
`some`/`every` verifier mismatch without rewriting Phase 6 evidence.

The A-S evidence preserves the Phase 8A status row/filter rule, immutable evidence roles, phase
ownership, Phase 8B's development/zero-held-out labels, cited classification reasons, and multiple
simultaneous blockers. It grants no quantitative eligibility, validation, held-out comparison, or
prior-phase credit. Do not begin A-I or C0 until the exact S2 check and evidence commit land; B and
C0V retain their later protocol/reference freezes.

Standing constraints: no Phase 8 record may be relabeled unseen; Phase 7 retains held-out,
product, and GPU obligations; B outcomes do not automatically authorize E/F/H; the permanent
`GGThreshold`/`LibbrechtKinetics` operators remain unchanged unless a separately adopted package
explicitly amends their contract; and no Phase 6 evidence artifact is rewritten.

### Other live decision points

1. **NAS prune approval** — the exact workstation-source prune list (pinned ladder worktree
   `G:\Code Files\snowflake-phase6-ladder`, archived `out/` trees) is now unblocked by the
   verified external-evidence backups; it remains a separate reviewed maker decision. Nothing
   has been deleted.
2. **Education reconciliation** — maker-directed, not started. The frozen education verifier
   oracles (`docs/education/tools/part-two-oracles.mjs`) pin superseded state-document
   content, including the retired handoff, so they are part of that reconciliation's scope.

Phase 7 stays on hold as a parallel product/engineering track; it still requires its own
committed plan and isolated worktree before any work starts, and V4/V4.x apparatus stays
retired.

### Phase 6 closure record — no Phase 6 work remains

Closed 2026-08-20 on the flagless `gate6` exit 0 (gate table above; completed
[plan](plans/phase-6-science-first-completion.md)). The
[80-row ladder](plans/phase-6-wp2-ladder.md) published **NO-PASS (criterion)** on both
spacings — the numerics are NOT converged at these resolutions and the attached-count
observable carries multi-percent seed sensitivity — and the WP2 and gate-unit non-author
reviews closed with 0 blockers. A same-day macOS re-derivation at `9e64ef7` (clean tree)
reproduced gate6 13/13 / exit 0 and exact `TMPDIR=/private/tmp npm test` green: 132 files,
2,250 passed / 7 skipped in 403.61 s. Full closure detail:
[the history file](progress-history-phases-6-8-9.md). Held-out and preview-GPU work remain
Phase 7 property with no Phase 6 credit.

### Phase 8B record — closed; external search remains stopped

Decision 0048, charter v1.25, and the
[benchmark-corpus plan](plans/phase-8-measurement-corpus.md) govern. Preserve `evidence/phase8-target-book/`
byte-for-byte, along with rejected plot-adjudication history and the failed original residual
audit. Broad discovery and the residual backlog remain stopped absent a new named
measurement gap; Phase 9 S0B is bounded reconciliation of already registered complete Git/NAS
sources. All 51 Phase 8B records are development evidence and none may be relabeled held out.

### NAS asset governance — complete through the Windows write lane; prune approval pending

The [governance plan](plans/nas-asset-governance.md) holds the full record: the macOS
correction applied without deletion (`d92f39a`), the Windows write lane executed 2026-08-20
(`0b34ee9`: 11 collections, 8,362 files, receipt-verified, 11/11 fresh-process full verifies,
green restore round-trip), and the external-evidence backup gap closed same day (`9e64ef7`:
independent-domain copies verified twice against ledger pins, `backup.status: verified`). SMB
rename crash-durability stays verification-based. Remaining: the maker's exact prune approval
(decision point 1 under **Other live decision points**). Quoted detail:
[the history file](progress-history-phases-6-8-9.md).
