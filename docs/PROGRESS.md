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
- Maker-accepted [ADR 0041](decisions/0041-phase6-ryzen9-host.md) and charter v1.20 record the CPU
  upgrade, but their canonical Git landing is still pending; no new production evidence may rely on
  the host amendment until that complete closure lands.
  Node independently reports an AMD Ryzen 9 5900XT, 32 logical processors, and 68,603,244,544
  physical-memory bytes; `nvidia-smi` reports the RTX 3080, 10,240 MiB and driver 591.86. Exact
  commands/outputs are manifest-covered in
  [the host observation](../evidence/phase6-host/observation-20260803T033028Z.json) (3,051 bytes,
  SHA-256 `a21e93a7433666981b1b347f5b88a03e8d4e75658e4e9c25a360aae120a055dd`). Phase 5 and
  pre-upgrade Phase 6 sweeps keep their historical Ryzen 7 provenance; the latter lack artifact-level
  host binding and retain that evidence limit. Phase 6 continuation/replacement work uses the new
  16-core host and records actual host, concurrency and launch fields. No scientific criterion or
  omitted obligation changed. Detached recovery commit
  `4955b9b15a097876a5d3bb02a08aee35540a0fbf` and verified bundle SHA-256
  `583c432426d35b3e83fd780ad5fb5cc8b40e9a27be6cb1991c2370f3cbee94c2` preserve the current
  record/host correction checkpoint; they are not canonical branch landings.
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
  Celsius/kelvin offset, and the standard-atmosphere conversion. Their governed correction is
  complete at `7a60eaf`. The monograph's approximate `D_air` value is not explicitly tied to exactly 101325 Pa;
  that association is a P2 project-derived/model-inferred closure. The repaired current table is
  50,464 LF-normalized bytes with current SHA-256
  `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`. A scoped read-only
  non-author acceptance follow-up independently verified that identity, all six current manifest
  identities, the exact-metrology authority chain, and 22/22 charter quotations with 0 blockers and
  0 should-fixes. Its landing `npm.cmd test` result—417 files scanned and 79 files / 1,404 tests—is
  historical and superseded as the current repository check by the 419-file / 1,442-test result
  below. Historical parameter/protocol hashes and both legacy manifests remain untouched.
- WP1's machine-verified candidate-source lock covers five files, 21 Harrison archive members, and
  all 16 reconciled levitation traces, but deliberately reports `passEligible=false`. No audited
  held-out target is apples-to-apples with the current geometry and transport physics. Missing
  crystallography, substrate/needle geometry, latent heat, sublimation, ventilation, and confounded
  pressure conditions are scientific scope blockers, not permission to score a near miss.
- WP1 source-search registers v2 and v3 are both **rejected and unauthorized for execution**. The
  complete failure registries and recovery anchors live in the
  [WP1 plan](plans/phase-6-wp1-source-lineage-and-tax2.md). V3 exact-byte audits held register
  `957216d13166140588e85bd684f6108c0da53a538e48571301012983610371a2` (52,764 bytes / 704 LF),
  registry `81dbfd2b50535f956240712210cd0c0f331a9c6baf32841319603267a69f3733` (28,565 bytes / 349 LF),
  and catalog `dc15d1808b5446eb80dc21c07165510e12ad3d89b41376c66924ffc775585963`
  (23,791 bytes / 528 LF) unchanged. Schema review rejected 10 blockers / 3 should-fixes, science
  review 5 / 2, and publication/recovery review 7 / 2. Decisive failures include non-unique search
  traversal, a confound-admitting matched-pressure rule, false-negative pressure screening, a
  rotation-dependent nonphysical span mapping, undefined attempt/payload/control schemas, impossible
  clean-checkout source rederivation, and no hard-kill publication recovery. Detached recovery commit
  `6b19839c8917a61df4ebada882623960e81edb85` plus verified bundle SHA-256
  `f4360b662299e4df3b61105c64a84acdf0626f9db120cd3df192da72a3bd985d` preserve v3 as rejected
  evidence. The plan now requires a v4 **combined protocol-and-offline-code freeze**: science rules,
  exact parsers/schemas, fixtures, verifier and reusable shared-publisher recovery are reviewed at one
  committed identity before the first request. No provider request, import, publication, TAX2
  measurement or production solver job has run. The old executor/test skeleton remains untracked
  reference material. Exact root `npm test` has not run on this WIP.
- Under the current whole-grid rule the minimum planning count is `612 × S × D × Z` rows
  (three arms × 204 points × spacings × domains × physical-size strata). The present
  three-spacing, three-domain, one-size baseline is 5,508 CPU rows. This is a feasibility bound, not
  a frozen protocol or evidence result.
- Proposed [ADR 0039](decisions/0039-cycle-boundary-lk-resume-checkpoints.md) now has a reviewed
  protocol-independent streamed v3 codec and field-adopting float64 CPU restore path through
  `a1d540c`. Frozen GG v1 and LK v1/v2 fixtures, cross-family rejection, canonical framing,
  topology/state validation, one-use ownership, bounded streaming, mutation controls, and exact
  CAK/M1 continuation are covered. The restart review closed both findings: zero-radius monopole
  shells now fail before any encoder write and remain decoder-rejected under an independently framed
  attack; a test-only, non-transferable 12×12×9 CAK/M1 witness exercises nine converged cycles at
  34–75 sweeps/cycle, both sweep parities, nonzero noise/lag/attachment/clipping, an M1 hole fill,
  and exact post-fill continuation. Two read-only non-author reviews independently executed the
  focused 22-test core and 16-test solver suites: the codec review reported 0 blockers / 0
  should-fixes; the continuation review reported no blocker and its scope-label should-fix is
  incorporated. Exact `npm.cmd test` at `a1d540c` exited 0 in 735.3 seconds:
  Rule 7 clean over 419 files, both TypeScript projects green, and 81 files / 1,442 tests passed.
  After the record-only reconciliation, Rule 7 remains clean over 419 files, the progress-index
  suite passes 7/7, and `git diff --check` is clean.
  ADR 0039 remains proposed: no runner publication/crash path exists, and those pieces remain
  deferred until WP3 freezes scientific inputs.
- The first source-lock/prepared-kinetics correction unit is committed at `8dc7a60` after exact
  `npm test`. The education work-in-progress is frozen in commit `60e3f3f`; the site
  warns that it is non-authoritative. No education content, figures, visual QA, verifier expansion,
  or acceptance work resumes until Phase 6 is complete.
- The non-education WP0/ADR 0040 and progress-compaction unit landed at `7a60eaf` and is included in
  the maker-pushed restart baseline after
  independent review and exact verification. Exact `npm.cmd test` exited 0 in 728.5 seconds; Vitest reported 79 files / 1,404 tests in
  718.77 seconds after Rule 7 and both typechecks pass. After the final record-only edits, Rule 7 is
  clean over the then-current 416-file scan and the progress-index test passes 7/7. This is
  repository verification, not R15 or validation evidence.
- Branch `main` is based on the maker-pushed restart state and currently carries the reviewed Phase
  6 continuation locally ahead of `origin/main`; do not push unless asked. Preserve untracked
  `.claude/settings.local.json` and the zero-byte root file `=`; neither belongs to Phase 6 work.
  Preserve `research/tmp/` as useful local
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

1. Preserve the rejected v3 bytes and old skeleton under ignored recovery; do not dispatch a
   request. Correct the scientific traversal, Rule 12, screening, matched-pressure and physical-
   observable rules while implementing the offline staged executor, immutable attempt journal,
   exact payload schemas, governed fixtures, independent semantic verifier and reusable shared-seam
   hard-crash recovery. Complete
   `runner/src/phase6-wp1-source-search.ts`, `runner/src/phase6-wp1-source-search-main.ts`, and
   `runner/test/phase6-wp1-source-search.test.ts` under the amended WP1 plan. No live request/import
   is authorized during offline implementation. First focused checks are `npm.cmd run lint:rule7`,
   `npx.cmd vitest run runner/test/phase6-wp1-source-search.test.ts`,
   `npx.cmd vitest run runner/test/evidence-integrity.test.ts`, and `git diff --check`.
   Then bind the complete protocol/code/test/fixture/import closure at one committed identity and
   require fresh non-author schema, science and publication audits at 0 blockers / 0 should-fixes
   before a record-only freeze authorizes the first request.
2. From a clean committed executor, resolve the Yamashita primary-data lineage and separately search
   for a genuinely matched air-pressure target. Keep the candidate lock `passEligible=false` unless
   independence, geometry, transport, observable, and uncertainty all pass.
3. Pre-register and independently review the TAX2 segmentation/span operator before any numeric
   extraction. Do not consume or compare new R15 model output while selecting a target; no personnel
   blindness to historical output is claimed. Do not promote in-sample or geometry-mismatched data
   to held-out validation.
4. After WP1 freezes exact source-derived physical-size strata, pre-register, review, execute, and
   independently recompute the deterministic WP2 numerical-control ladder. WP3 may bind only the
   artifact-selected configuration; it may not choose after seeing morphology.
5. Freeze and independently review the replacement R15 ADR/protocol only after WP1 supplies
   admissible targets and WP2 supplies a passing transferable numerical configuration. Then build
   the new artifact/gate path and execute CPU arms, matched ablation, GPU cohort, and held-out
   families in dependency order.

Do not launch R15, GPU, matched-ablation, or held-out production rows from the current moving tree.
