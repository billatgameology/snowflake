# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). Exact cold-resume detail: [HANDOFF.md](HANDOFF.md).

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md). That snapshot is
historical, not current authority. Its original body is 191,859 bytes with SHA-256
`2550319a3ac5d528c111875242419de91d2ed9b34f245f7a0364ede8b323f955`. Open it only when this
index, a plan, ADR, or audit links to historical detail.

## Current state

- **Phase 6 is ACTIVE AND INCOMPLETE.** Phases 2b, 3, 4, and 5 are complete. Phase 7 has not
  started. The maker accepted the historical failure to reproduce the Nakaya diagram and selected
  the science-first branch of O1b: execute the omitted obligations rather than narrow the charter.
  Resource cost may determine scheduling and concurrency; it may not weaken a scientific criterion.
- The two historical extent-21 Phase 6 artifacts remain valid measured-only comparisons:
  **CAK 3/90, M1 54/90** over their named scopes. They are not ADR 0026's registered
  conservative-intersection headline. R15 has no production caller or complete artifact-derived
  gate, numerical adequacy is not established, and neither the preview-budget GPU cohort nor the
  four held-out validation families has executed.
- CAK→M1 is a confounded parameter-family comparison, not a causal SDAK ablation. The active plan
  adds matched `M1_NO_DIP_ABLATION`, which may isolate the implemented dip factors' effect on this
  solver under a frozen configuration; it **cannot establish physical SDAK causality or necessity**
  in nature.
- Accepted [ADR 0040](decisions/0040-correct-phase6-coefficient-and-sdak-provenance.md) and charter
  v1.19 govern the coefficient/provenance correction. Its acceptance audit subsequently found three
  exact metrological definitions missing from the authority chain: the Boltzmann constant, the
  Celsius/kelvin offset, and the standard-atmosphere conversion. Their governed correction is in
  progress. The monograph's approximate `D_air` value is not explicitly tied to exactly 101325 Pa;
  that association is a P2 project-derived/model-inferred closure. The repaired current table is
  50,464 LF-normalized bytes with current SHA-256
  `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`. A scoped read-only
  non-author acceptance follow-up independently verified that identity, all six current manifest
  identities, the exact-metrology authority chain, and 22/22 charter quotations with 0 blockers and
  0 should-fixes. Exact current-tree `npm.cmd test` exits 0: Rule 7 clean over 417 files, both
  TypeScript projects green, and 79 test files / 1,404 tests pass. Historical parameter/protocol hashes and both legacy
  manifests remain untouched.
- WP1's machine-verified candidate-source lock covers five files, 21 Harrison archive members, and
  all 16 reconciled levitation traces, but deliberately reports `passEligible=false`. No audited
  held-out target is apples-to-apples with the current geometry and transport physics. Missing
  crystallography, substrate/needle geometry, latent heat, sublimation, ventilation, and confounded
  pressure conditions are scientific scope blockers, not permission to score a near miss.
- Under the current whole-grid rule the minimum planning count is `612 × S × D × Z` rows
  (three arms × 204 points × spacings × domains × physical-size strata). The present
  three-spacing, three-domain, one-size baseline is 5,508 CPU rows. This is a feasibility bound, not
  a frozen protocol or evidence result.
- Proposed [ADR 0039](decisions/0039-cycle-boundary-lk-resume-checkpoints.md) now has an implemented
  protocol-independent streamed v3 codec and field-adopting float64 CPU restore path. Frozen GG v1
  and LK v1/v2 fixtures, cross-family rejection, exact CAK/M1 continuation, canonical framing,
  topology/state validation, one-use ownership, bounded streaming, and mutation controls are
  covered. Root verification is green for the combined new tests (2 files / 34 tests), a broader
  checkpoint/solver set (5 files / 94 tests), and both TypeScript projects. A read-only cross-review
  found two open items: add a durable realistic multi-sweep continuation regression (its independent
  15-cycle CAK/M1 probe passed), and close a likely encode/decode asymmetry for degenerate monopole
  domains where a zero-radius shell may encode but decode rejects. Exact `npm test` remains open. No runner
  publication/crash path exists; those pieces remain deferred until WP3 freezes scientific inputs.
- The first source-lock/prepared-kinetics correction unit is committed locally at `8dc7a60` after
  exact `npm test`. The education work-in-progress is frozen in local checkpoint `60e3f3f`; the site
  warns that it is non-authoritative. No education content, figures, visual QA, verifier expansion,
  or acceptance work resumes until Phase 6 is complete.
- The non-education WP0/ADR 0040 and progress-compaction unit is landed locally at `7a60eaf` after
  independent review and exact verification. Exact `npm.cmd test` exited 0 in 728.5 seconds; Vitest reported 79 files / 1,404 tests in
  718.77 seconds after Rule 7 and both typechecks pass. After the final record-only edits, Rule 7 is
  clean over the then-current 416-file scan and the progress-index test passes 7/7. This is
  repository verification, not R15 or validation evidence.
- Branch `main` is local and unpushed. Preserve untracked `.claude/settings.local.json` and the
  zero-byte root file `=`; neither belongs to Phase 6 work. Preserve `research/tmp/` as useful local
  research context, but do not treat its provenance-incomplete cache as evidence. Durable generated
  science belongs under the tracked `evidence/` manifest boundary.
- **Last updated:** 2026-08-02 by OpenAI Codex (`gpt-5.6-sol`, ultra reasoning)

## Phase gates

A scientific gate is complete only through named, reproducible evidence. Detailed review history
and every superseded attempt live in the linked plans and the historical progress snapshot.

| Phase | Current gate state | Reproduction/evidence |
|---|---|---|
| 0 | Complete, maker-asserted 2026-07-14 | Charter §2.8 knowledge checks; no automated metric is applicable. |
| 1 | Complete, maker-asserted 2026-07-15 | Informal UX sessions were positive; the four-task protocol was not run. [Plan](plans/phase-1-ux-spike.md). |
| 2a | Complete, maker-asserted 2026-07-15 | Seed 1, `128,128,64` hexPrism plate: symmetry error exactly 0 through 4,800 ticks, AR `0.168831`; canonical checkpoint SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Repro: `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. [Evidence plan](plans/phase-2a-evidence-hardening.md). |
| 2b | Complete 2026-07-20 | Flagless v5p at clean `0dc0f86`, seed 1, `96³` hexPrism, extent 61: −5 °C AR `0.118644` plate; −15 °C AR `12.2000` column; symmetry error 0 and every relaxation converged. Repro: `node runner/src/main.ts gate2b`. [Evidence](plans/phase-2b-v5p-parallel-retry.md#terminal-v5p-result). |
| 3 | Complete, maker-asserted 2026-07-23 | `gate3` exit 0: depletion-ratio median `0.531454`, 90.2% of window samples below 1, radius 38, symmetry error 0. Repro: `node runner/src/main.ts gate3`. [Plan](plans/phase-3-dev-visualization.md). |
| 4 | Complete 2026-07-18 | `gate4` exit 0 at `70a2496`; blocking G-G pass 24/24 records green, diagnostic LK pass 12/12 execution records green, `gatePass=true`, `passBDiagnosticPass=false`. Repro: `node runner/src/main.ts gate4`. [Evidence](plans/phase-4-v2-reservoir-matched-branch-control.md). |
| 5 | Complete, maker-asserted 2026-07-26 | Clean `c436df5`, observed Windows/Chromium/D3D12 only: `gate5` 16/16 criteria, all 560 bounded segments below 500 ms, zero device losses/errors/full-field display-frame reads, all 16 negative controls rejected. Repro: `node runner/src/main.ts gate5-lane` and `node runner/src/main.ts gate5`. [Plan](plans/phase-5-gpu-port.md). |
| 6 | **Active and incomplete** | Historical measured-only CAK/M1 results are retained. R15, transferable numerical controls, matched no-dip arm, preview GPU cohort, and all four held-out families remain open. [Active plan](plans/phase-6-science-first-completion.md). |
| 7 | Not started | Begins only after Phase 6 closes. |

## Active plan

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the only active
implementation plan. The historical Phase 6 plan is not a live schedule. Before any production row,
the replacement ADR/protocol must freeze and independently review:

- admissible held-out targets and source-matched physical sizes;
- physical seed mapping, exact spacings, whole-grid domains, timestep/relaxation controls, and
  deterministic escalation rules;
- exact raw key set, structured binary64 serialization, truth table, failure semantics, retry and
  checkpoint policy;
- immutable source/environment/argv/engine/host provenance;
- the v6/M1/no-dip GPU path and a derived binary32 convergence envelope; and
- an artifact-derived `phase6-r15-*` evaluator, independent recomputation, and adversarial controls.

## Next step

### Current resume point — Phase 6 science-first completion

For unattended long work: first update this index and `HANDOFF.md`; run only from a clean immutable
source snapshot; write labeled live/error/exit records; put durable generated science under
`evidence/`; and report user-facing status at most once per hour unless the maker asks.

1. Resume ADR 0039 implementation review from local checkpoint `557d1de`: add the realistic
   multi-sweep continuation regression, collect the interrupted read-only verdicts, resolve any
   findings, run exact `npm test`, record provenance/limits, and commit the reviewed unit. Do not
   redo the implementation from scratch.
2. Repair the WP1 handoff before source work: identify the intended Yamashita/pressure citation
   (the current phrase has no cold-resumable bibliographic identity) and split the circular WP2/WP3
   sequence into a pre-registered deterministic control ladder, execution, and final production
   binding. Then pre-register blind TAX2 segmentation before extracting a physical size.
   before extracting a physical size. Do not inspect model output while selecting a target and do
   not promote in-sample or geometry-mismatched data to held-out validation.
3. Freeze and independently review the replacement R15 ADR/protocol only after WP1 supplies
   admissible targets and WP2 supplies a passing transferable numerical configuration. Then build
   the new artifact/gate path and execute CPU arms, matched ablation, GPU cohort, and held-out
   families in dependency order.

Do not launch R15, GPU, matched-ablation, or held-out production rows from the current moving tree.
