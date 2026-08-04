# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). [HANDOFF.md](HANDOFF.md) is only the last
maker-triggered stop/restart snapshot and may predate this live index.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md). That snapshot is
historical, not current authority. Its original body is 191,859 bytes with SHA-256
`2550319a3ac5d528c111875242419de91d2ed9b34f245f7a0364ede8b323f955`. Open it only when this
index, a plan, ADR, or audit links to historical detail.

## Current state

- **Phase 6 is ACTIVE AND INCOMPLETE.** The maker accepts the historical failure to reproduce the
  Nakaya diagram and still requires the science-first core: source-derived physical-size strata,
  the registered numerical-control ladder, ADR 0026's conservative-intersection headline, and the
  full three-arm float64 campaign. Resources may shape scheduling, not scientific criteria.
- The maker's 2026-08-03 direction is recorded verbatim in the
  [active plan](plans/phase-6-science-first-completion.md). It keeps `CAK`, `M1`, and
  `M1_NO_DIP_ABLATION`; narrows the threat model to accidental error, crashes, and environment
  drift; caps each unit at one proportionate non-author review; closes the V4/V4.x source-register,
  publisher, and control-batch line as rejected history; and directs held-out and preview-GPU
  deferrals by ADR plus charter amendment. Those deferrals do not alter the charter until accepted.
- [ADR 0041](decisions/0041-phase6-ryzen9-host.md) and charter v1.20 landed canonically in
  `1ff948c`. The manifest-covered [host observation](../evidence/phase6-host/observation-20260803T033028Z.json)
  is 3,051 bytes with SHA-256
  `a21e93a7433666981b1b347f5b88a03e8d4e75658e4e9c25a360aae120a055dd`: Node reports an AMD
  Ryzen 9 5900XT, 32 logical processors, and 68,603,244,544 physical-memory bytes; `nvidia-smi`
  reports the RTX 3080, 10,240 MiB, and driver 591.86. Historical Phase 5 and pre-upgrade Phase 6
  evidence keeps its Ryzen 7 provenance and stated host-binding limits. New evidence records actual
  host, runtime, process concurrency, command, and flags.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict. R15 still
  has no production caller or complete artifact-derived gate, and numerical adequacy is unproved.
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- [ADR 0040](decisions/0040-correct-phase6-coefficient-and-sdak-provenance.md) and charter v1.19
  govern the coefficient/provenance correction. The current LF-normalized parameter table is 50,464
  bytes with SHA-256 `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`.
  Historical parameter/protocol hashes and both legacy manifest schemas remain untouched.
- The candidate source lock covers five files, 21 Harrison archive members, and all 16 reconciled
  levitation traces but remains `passEligible=false`. The audited incompatibility finding is that no
  current held-out family is apples-to-apples with the implemented geometry and transport physics.
  No provider request, new import, TAX2 measurement, R15 row, GPU validation row, or production
  solver job has run during the continuation work.
- The V4/V4.x search-register, publisher, and eight-control batch apparatus is closed as rejected
  history. The isolated batch clone under `research/tmp/recovery/wp1-v42-control-execution-author/`
  remains untouched. Six exact root-side apparatus files were removed from the live test/source
  paths without changing their bytes and preserved at
  `research/tmp/recovery/wp1-v4x-root-apparatus-rejected-20260803/`. Exact register/catalog/finding
  bytes are tracked only under `research/rejected/phase6-wp1-v4x/` as non-authorizing history for
  the threat-model ADR. Do not resume or dispatch that apparatus.
- The offline `crystallographicSpans()` primitive reports exact integer `basalCaliper2` and
  `zLayers`; its existing focused tests cover all D6 planar transforms and z reflection. It is not
  yet a reviewed source-to-model size mapping and does not replace numerical controls.
- Proposed [ADR 0039](decisions/0039-cycle-boundary-lk-resume-checkpoints.md) has reviewed,
  implemented protocol-independent streaming and field-adopting float64 restore through `a1d540c`.
  Its runner generation/publication/retry/trace contract remains deferred until WP3 freezes exact
  campaign inputs; production rows may not use resume before acceptance.
- The minimum current planning count remains `612 × S × D × Z` rows (three arms × 204 points ×
  spacings × domains × physical-size strata). The illustrative three-spacing, three-domain,
  one-size matrix is 5,508 CPU rows; it is a feasibility count, not a frozen protocol.
- Exact `npm.cmd test` on the redirected live tree exited 0 in 674.8 seconds: Rule 7 was clean over
  425 files, both TypeScript projects passed, and Vitest passed 81 files / 1,446 tests in 666.70
  seconds. The unit's one non-author review found and closed a stale live instruction that could
  reauthorize rejected WP1 work; its bounded follow-up reported 0 blockers. After that record-only
  repair, the focused set passed 3 files / 46 tests, Rule 7 was clean over 426 files, both typechecks
  passed, and `git diff --check` was clean. This verifies the repository baseline; it is not Phase 6
  scientific evidence.
- Education remains frozen at commit `60e3f3f` until Phase 6 closes. Preserve `research/tmp/` as
  useful local research context; durable generated science belongs under tracked `evidence/`.
- Branch `main` is ahead of `origin/main` by the ADR 0041 landing. The maker authorized a push only
  after exact `npm test` is green and the three direction ADR/charter amendments are accepted. Keep
  the zero-byte root file `=` and local settings out of Phase 6 commits.
- **Last updated:** 2026-08-03 by OpenAI Codex (`gpt-5.6-sol`, ultra reasoning)

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
| 6 | **Active and incomplete** | Historical CAK/M1 measurements are retained. Direction ADRs, size-strata freeze, numerical ladder, WP3/R15, three-arm production, and WP8 gate remain open. Held-out/GPU deferrals are maker-directed but not authoritative until the charter amendments land. |
| 7 | Not started | Begins only after Phase 6 closes; the maker directs the deferred preview-GPU work here, pending ADR. |

## Active plan

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the only active
implementation plan. The detailed V4/V4.x chronology remains in the closed
[WP1 history](plans/phase-6-wp1-source-lineage-and-tax2.md) and recovery artifacts; it is not a live
schedule.

Before any production row, the repository must have accepted direction ADRs/charter amendments,
reviewed source-derived physical-size strata, a pre-registered and executed numerical-control ladder
that selects one configuration or no-pass, an accepted WP3 protocol freeze, and an independently
reviewed artifact-derived R15 path. Until the deferral amendments land, the charter's existing
held-out and preview-GPU clauses remain authoritative.

## Next step

### Current resume point — adopt the maker-direction amendments

ADR 0041 is canonically landed and the redirected baseline is exact-suite green at the result above.
Author and accept three direction decisions with verbatim charter quotes and same-session charter
amendments: held-out deferral with a named post-Phase-6 owner; preview-GPU/v6-WGSL deferral to Phase
7; and the sloppiness-focused threat model plus review-depth cap closing the attacker-only finding
class by name. Obtain one proportionate non-author review of that unit. If it fails twice, escalate
to the maker rather than rebuilding a third time.

Then push `main` (maker-authorized), write the narrowed WP1 size-strata plan, freeze the simplest
reviewable deterministic operator over already-locked sources, and proceed in order: WP2 ladder
pre-registration → registered Ryzen 9 execution → WP3 freeze → WP4 R15 → WP6 three-arm campaign →
WP8 gate. Do not resume education, V4/V4.x apparatus, held-out execution, or preview-GPU work.
