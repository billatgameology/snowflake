# Handoff — Phase 6 science-first completion active (2026-08-02)

Read this file, then `docs/phase6-lessons.md`, `docs/PROGRESS.md`, and the active
`docs/plans/phase-6-science-first-completion.md`. The older
`docs/plans/phase-6-nakaya-validation.md` is historical registration, not the live schedule.

## 1. Where the project is

**Phases 2b, 3, 4 and 5 are complete. Phase 6 is ACTIVE AND INCOMPLETE.** The maker accepted the
historical failure to reproduce the Nakaya diagram and directed the science-first branch of O1b:
execute the omitted obligations rather than narrow the charter. Resource cost may control scheduling
and concurrency; it may not weaken a scientific criterion.

The two historical extent-21 artifacts remain valid measured-only results:

| artifact | measured-only agreement | classes plate / neutral / column | scope |
|---|---:|---:|---|
| CAK | 3/90 | 6 / 168 / 30 | 204 rows, broad-facet parameterization |
| M1 | 54/90 common; 54/78 arm scope | 75 / 119 / 10 | 204 rows, dipped parameterization; in-sample |

They are **not** ADR 0026's registered conservative-intersection headline. R15 has no production
caller or complete artifact/gate. The charter's held-out comparisons and hundreds of automated
preview-resolution GPU runs were not executed. Do not report Phase 6 as a completed gate.

The maker froze all further education-site work on 2026-08-02 until Phase 6 is complete. A prominent
landing-page notice says that `docs/education/**` may lag the current science and is not the
authoritative status or validation record. Preserve its 44-file work-in-progress snapshot in commit
`60e3f3f` (6,404 insertions / 2,904 deletions relative to its parent), but do not edit
Chapter 16, regenerate figures, run visual QA, extend the education verifier, or make education
acceptance a prerequisite for the science campaign. Reconcile and independently review the site
after Phase 6 closes. This is a scheduling decision only; it changes no scientific obligation.

CAK→M1 is not a causal SDAK ablation: it changes broad `sigma_0` functions and facet prefactors as
well as M1's dip factors. The active plan adds `M1_NO_DIP_ABLATION`, matching M1 except that both dip
factors are one. Only that matched pair may isolate the implemented factors' effect on this solver's
outputs under the frozen configuration; it cannot establish physical SDAK causality or necessity in
nature.

## 2. Corrections and resume decision

The first correction/source-lock/prepared-kinetics unit is committed at `8dc7a60` after exact root
verification and clean non-author reviews. The maker pushed the restart baseline through `cd54b3e`;
the current local continuation adds the reviewed ADR 0039 core closure. Specifically:

- M1's analytic dip centres are 4.5 °C and 14.4 °C under both `log10` and `ln`; approximately 3.08/8.07 are
  restricted equal-shared-positive-field `alphaHKBasal = alphaHKPrism` locations under the base-10
  reading, not moved centres or habit transitions. Executable regression added. The last surviving
  false copy in arm 2's hashed justification is now corrected without changing its values hash; old
  justification/combined hashes remain explicit revisions so historical rows still verify.
- The exact registered columns cohort is P1–P4 × A/B/C = 12 rows. Its fail-closed reader now compares
  consecutive rungs and reports P1 **outcome 4**: 1.40000 → 1.52632 → 1.52174. Six later diagnostics
  are separate. Missing, duplicate, shifted and fall-removed mutations are rejected.
- A closed symmetric ±0.135 threshold distance flags 43 additional CAK rows and 52 additional M1
  rows, for totals 59/204 and 85/204. The extra boundary rows have AR exactly 1.500.
- At f = 0.90 the two arms have identical classes at all 34 temperatures, but raw AR differs in
  28/34 pairs; maximum sampled `|ΔAR| = 0.218335`.
- The tracked cross-architecture Tier 1 fingerprints differ in 9/448 entries at 1–31 ULP. A
  historical table reports four CAK output rows matching the x64 baseline, but the raw arm64 logs
  and exit records were never tracked and are unavailable here, so no end-to-end, M1 or full-grid
  portability claim is independently rederivable.
- The flip operator scans pure classes, skips neutral rows and finds two `plate→column` flips per
  arm: one on 2/6 constant-f ladders, none on 4/6, and zero reverse flips. Independent verifiers now
  label their output **MEASURED-ONLY AGREEMENT**, not headline.
- The withdrawn `sigma_0`-crossing structural theorem was not fully propagated despite two closing
  summaries saying otherwise. The expanded non-author audit found obsolete roots, labels or universal
  conclusions across at least ten files: the initial four, the superseded Phase 6 plan,
  `research/phase6-convergence.md`, the solver spec, stretch/publication note, video explainer and
  papers-extract table. The correction landed at `7a60eaf` with roots under the
  registered, Figure-1-width-supported P4 base-10 M1 transcription
  and measured/source-scoped claims, including TAX2 independence, seed/score, pressure, priority,
  causality and domain-generalisation corrections. Three non-author slices initially closed the
  non-education code, dataset/report and recordkeeping surfaces, but later complete-diff/ADR 0040
  audits found further status, hash, unit, inventory, source-provenance, charter-quote and causal-scope
  defects. Later clean verdicts apply only to their named candidate bytes. The newest acceptance
  audit reopened the non-education candidate for exact-metrology authority and table-pin repairs.
  Its final scoped re-review is now clean: 0 blockers / 0 should-fixes after independently checking
  the table, six manifests, metrology chain, charter quotes and frozen education-tree identity.
  Education is a frozen post-Phase-6 reconciliation, not a dependency of that non-education verdict.
- ADR 0037's measurements remain: N = 48→64 fails 3/4 sampled checks and N = 64→80 fails 3/4. Its
  no-re-sweep resource decision is superseded. A ratio of 0.746 would require five further
  reductions to get below 0.5% (four gives about 0.576%, five about 0.430%), and is not a convergence
  proof.

Decision 0039 is again **proposed**, not accepted. A first draft would have
concatenated fields into one byte array; the non-author review
computed that a possible 744³ configuration's `a/f/sigma` fields alone occupy 7,001,123,328 bytes.
The revised design instead streams exact binary state, adopts decoded fields without a second full
copy, preserves the monopole lag and historical boundary order, and hash-binds immutable
protocol/case/runtime/trace-bound generations for process-termination recovery. It does not claim
hostile authentication or power-loss durability. It restricts production use to constant-environment
float64 CPU / hex-prism / v6 / monopole runs. A later implementation-readiness audit superseded the
earlier clean design verdict: an unattached boundary `f=1` state is reachable and must decode, while
the exact run-spec, manifest, policy, cadence and retention contracts cannot be accepted before WP3
freezes their scientific inputs. The ADR is corrected to preserve that state, retain the complete
generation chain to genesis and defer runner-dependent details. Its exact 1,095-line / 80,760-byte
pre-review-record core-design candidate (`b9bfec37…3b69f`) received a clean non-author re-review:
0 blockers and 0 core should-fixes. The implementation lineage `557d1de` → `c595b55` → `a1d540c`
now contains the protocol-independent codec and field-adopting restore. Review found and fixed a
Proxy-forgeable symbol constructor capability with one-use WeakMap identity branding and then closed
the restart's two findings. Zero-radius monopole shells fail before the first encoder write and an
independently framed hostile checkpoint remains decoder-rejected. A test-only, non-transferable
12×12×9 CAK/M1 differential executes nine converged cycles at 34–75 sweeps/cycle with both parities,
noise, lag, attachment, clipping, an M1 hole fill at cycle 8, and exact continuation through cycle 9.
Two final read-only non-author reviews reported 0 blockers after independently running the focused
22-test core and 16-test solver suites. Exact `npm.cmd test` at `a1d540c` exited 0 in 735.3 seconds:
Rule 7 clean over 419 files, both TypeScript projects green, and 81 files / 1,442 tests passed.

ADR 0039 remains proposed because WP3-dependent runner inputs are unfrozen. No runner
publication/crash control exists yet; the core implementation authorizes no production resume use.

## 3. Why R15 cannot be launched yet

Do not extend the legacy 204-row loop in place. At one domain and one physical-size stratum, the
three-spacing cohort for the two charter arms is 1,224 raw runs: 612 per arm, reducing to 204
complete triplets per arm. The matched no-dip arm adds another 612. The transferable numerical
campaign must then multiply that 1,836-row three-arm cohort by every registered domain and size
stratum; the current three-domain, one-size baseline is 5,508, not 1,836. Before any production row,
a replacement ADR/protocol must freeze and independently review all of the following:

- exact rational spacings, dimensions, physical target/achieved size and one-cell overshoot rule;
- a physical seed representation held fixed under refinement, plus a seed-mapping sensitivity test;
- which spacing supplies the primary measured class and the exact admitted/refused/invalid truth
  table, denominators and boundary-safe fitted-order comparisons;
- whole-grid domain escalation at every spacing/arm until two successive increments pass, unless an
  independently reviewed worst-case bound genuinely covers omitted points;
- fixed-physics timestep and relaxation controls;
- round-trip-exact structured binary64 output with independently recomputable occupancy/extents;
- exact raw key set; missing, timeout, duplicate, malformed or shifted rows fail rather than shrink a
  denominator;
- per-resolution timeout/retry rules—the old three-hour timeout is shorter than an observed fine run;
- immutable detached source snapshot; exact argv; environment allow-list rejecting `NODE_OPTIONS` and
  preload hooks; per-child source/environment/provenance hashes; canonical atomic publication;
- a flagless artifact-derived `gate6` with independent recomputation and adversarial controls.

The historical prose tuple was not fixed physics: the radius-2/thickness-1 seed stayed fixed in
cells while spacing changed, and 11×0.7, 21×0.35 and 33×0.2333 measure about 7.70, 7.35 and 7.70 µm.
Human stdout also rounded AR to six significant digits, enough to change habit and fitted-order
boundary decisions. Historical ladder rows cannot be upgraded into R15 evidence.

## 4. GPU and held-out obligations

The existing WGSL Phase 6 path is v5/CAK/Dirichlet-oriented. Before the GPU cohort it needs v6's
order-invariant reduction, M1 and matched no-dip routing as registered, monopole-matched far field,
and a derived binary32 convergence envelope validated against float64. Copying float64 tolerances or
calling CPU rows “GPU harness” is not allowed. The charter minimum remains hundreds of automated
runs at approximately eight million total resident cells; the science-first target is the full 204-point
grid for CAK, M1 and the matched no-dip arm (612 preview-budget runs), reported separately from the
float64 headline.

The source inventory now has a fail-closed partial lock, not a selected validation target.
`research/phase6-heldout-candidate-lock.json` pins five external file hashes, 21 Harrison archive
members, all 16 reconciled levitation traces, corrected experimental conditions, a deterministic
five-time extraction, Takahashi diagnostics, the rejected pressure row, and two history candidates.
The executable verifier reproduces those bytes and says `passEligible=false`. Current findings:

- Harrison/Pokrifka is the cleanest mass-growth candidate, but particle shape and crystallography
  were not observed and the present operator omits vapor-thermal latent-heat resistance. A regular
  D6h seed would be this project's surrogate, not a source observation.
- Takahashi −5.3 °C early mass is retained as a non-gating ensemble diagnostic only. Later sources
  leave the actual warm supersaturation, hollow rim width and step-source state unresolved; its `a`
  and `c` rows are unpaired and cannot form per-crystal aspect ratios.
- The Takahashi 860/1010 mb ratio is context only. Pressure covaries with liquid-water content,
  temperature drift, apparatus/population, polycrystallinity and riming, so no pass interval exists.
- Harrington/Pokrifka 2026 needs substrate/asymmetric/rim/step-source physics. Magee 2006 is the
  strongest free-particle history challenge but needs reversible sublimation, ventilation, latent
  heat, figure digitization and a source-constrained frozen-droplet state.
- No audited held-out family is presently apples-to-apples with the current solver. This is a
  scientific source/model-scope blocker, not a resource deferral or permission to promote a near
  miss.
- The classical Nakaya reference gives morphology regions in temperature/supersaturation but no
  crystal size or size stratum. The later 206-panel grid gives field-of-view widths around
  c-axis-needle observations, not reported crystal dimensions for the current free-prism seed.
  WP2 therefore cannot freeze an arbitrary convenient physical size. A blind, pre-registered panel
  segmentation can derive terminal span from pixels × field of view, but the electric-needle
  geometry remains load-bearing and the corpus is in-sample for M1.
- A broader 2026-08-01 primary-source search found Nelson 1998 as a cleaner history/sublimation lead
  and Bailey–Hallett 2004 as a growth/size lead, plus Bacon et al. 2003. Nelson and Bacon bytes and the
  official Bailey–Hallett 2002 conference precursor were exact-byte audited. The indexed publisher
  rendering of the 2004 journal article was reviewed, but its PDF was unavailable and there is no
  2004 byte/hash claim. All three target families are rejected for the current solver. Nelson is a
  capillary-supported sublimation study; Bailey–Hallett is a filament/polycrystal population study
  with coupled pressure/temperature; Bacon has unresolved/polycrystalline initial state and infers
  supersaturation from the mass-growth curve it might otherwise validate. Their 100–300 µm ranges do
  not define one R15 size. Exact available-source hashes and review limits are in
  `research/phase6-source-currency.md`; the source-lock remains `passEligible=false`.

## 5. Ranked next actions

1. Commit and independently review the bounded WP1 source-lineage/TAX2 plan and create the
   cold-resumable register for `YAMASHITA-FREEFALL-LINEAGE-01`, `MATCHED-AIR-PRESSURE-01`, and
   `TAX2-PANEL-SPAN-01` before any numeric extraction.
2. The adversarial review of the candidate-source lock is clean. Retain `passEligible=false` until
   geometry, independence, observable definition and uncertainty all pass. Do not infer the missing
   Harrison crystallography or a convenient Nakaya measurement size from model output.
3. The first bit-identical CPU preparation/cache improvement is implemented and independently
   accepted. Defer the R15 worker, run-spec bindings, immutable generation publisher and crash
   controls until WP3 freezes their exact schemas and policies. Under the current
   whole-grid rule the row count is `612 × S × D × Z` (three arms × 204 points × spacings × domains
   × physical-size strata); the 3×3×1 baseline is 5,508 and no rigorous D6h/monopole bound replaces it.
4. Resolve the Yamashita primary-data lineage and separately search for a genuinely matched
   air-pressure target. Pre-register and review the TAX2 span operator before execution. Do not
   inspect model output during extraction; do not promote TAX2 to held-out M1 evidence or infer a
   target from rejected candidates' broad size ranges.
5. After WP1 freezes exact physical-size strata, pre-register, review, and execute the deterministic
   WP2 numerical-control ladder. Independent recomputation selects one production configuration or
   no-pass; WP3 binds that artifact and may not choose among rungs after seeing morphology.
6. Write the replacement science-first ADR and amended Phase 6 protocol only after WP1/WP2 supply
   admissible held-out targets and passing numerical inputs. A source-limited disposition may stop
   Phase 6 as incomplete but cannot substitute for the charter obligation or permit a pass. A plan is already committed;
   the ADR must quote every affected/no-impact charter clause and preserve ADR 0037's negative data.
7. Implement a new versioned `phase6-r15-*` evidence path and flagless gate, then adversarially review
   it before any registered production row.
8. Execute the frozen numerical campaign, CPU arms, matched ablation, GPU cohort and held-out families
   in that order only where the preceding freeze/adequacy dependency is satisfied.

## 6. Standing constraints

- Do not push unless asked. The maker pushed the restart baseline; later local continuation commits
  may remain ahead of `origin/main` until explicitly requested.
- Education is frozen by maker direction until Phase 6 closes. The landing-page warning is already
  included in checkpoint `60e3f3f`; preserve that exact snapshot and authorize no further education
  edits. Defer content,
  figures, visual QA, verifier work and adversarial education acceptance until post-Phase-6
  reconciliation. Treat existing `out/education-*` artifacts as read-only, byte-scoped historical
  checks; they do not certify the frozen snapshot.
- Historical education verification reached the byte-scoped counts recorded in the active plan,
  but those runs predate the frozen `60e3f3f` snapshot and do not certify it. Do not rerun or extend
  them during Phase 6. The non-education WP0 close requires only its scoped reviewer and repository
  checks; education receives its own reconciliation and adversarial acceptance after Phase 6 closes.
- Preserve `.claude/settings.local.json`; it is untracked user state, not part of this correction.
- Treat accepted `out/phase5*`, `out/phase2b/`, `out/phase4/` and `out/phase4-visual/` as read-only.
- Never relabel Windows/Chromium/D3D12 evidence as Metal or general WebGPU portability.
- Calibration/reconnaissance probes are non-transferable unless they use the exact registered
  configuration; they never enter a gate by prose.
- Only exact `npm test` counts as the full local check. Name the exact command and result.
- A verdict is recomputed from published bytes; no component supplies both sides. Every negative
  control must prove its named mutation occurred independently of the verifier it attacks.
- No long Phase 6 evidence run from a moving working tree or inherited environment.
- For unattended long work, user-facing status is at most hourly unless the maker asks. Before a
  long run, make this handoff and `docs/PROGRESS.md` independently sufficient to resume, use ADR
  0039's immutable cycle-boundary generations only after its runner layer is accepted, and write labeled live/error/exit
  logs plus durable scientific outputs under the tracked `evidence/` manifest boundary.

## 7. Repository state and current verification

- Branch `main`; the maker-pushed restart baseline reaches `cd54b3e`, and the reviewed ADR 0039 core
  closure is currently local ahead of `origin/main`. `8dc7a60` commits the reviewed source-lock/
  prepared-kinetics unit, `60e3f3f` commits the frozen education snapshot, and `7a60eaf` commits the
  reviewed non-education WP0/ADR 0040, compact progress record, and exact verification record.
  ADR 0039's core implementation closes at `a1d540c`: the codec review reported 0 blockers / 0
  should-fixes, the continuation review reported no blocker and its one scope-label should-fix is
  incorporated, and exact `npm.cmd test` passed (419 scanned files; both typechecks; 81 files /
  1,442 tests). Its runner layer
  remains WP3-deferred and the ADR remains proposed.
- The repaired current table is 50,464 LF-normalized bytes with current SHA-256
  `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`, propagated through the
  separately named `PHASE6_CURRENT_PARAMETER_TABLE_SHA256`. The final scoped review and exact root
  verification are clean.
  Historical registered hash
  `276494f69682adb2b071c2e2683a98281aef17b3558b4efa6301ceaf11dfa741` and both legacy values
  manifests remain untouched. This is a current content pin, not the R15 values/protocol freeze;
  that freeze remains deferred until WP1/WP2.
- The compact `docs/PROGRESS.md` is the sole current-state authority (10,405 bytes / 127 lines at
  this checkpoint). Its linked archive preserves
  the exact 191,859-byte pre-compaction body at SHA-256
  `2550319a3ac5d528c111875242419de91d2ed9b34f245f7a0364ede8b323f955`; an enforcing test pins the
  raw and LF-normalized identities, live-file size/headings, critical status phrases, dates, and
  local links. The exact-path Git rule is `-text whitespace=-trailing-space`: the first term
  preserves the mixed endings, while the second prevents those preserved CR bytes alone from
  defeating staged whitespace checks. A follow-up independently verified unchanged raw, filtered
  and staged object identity plus a clean staged diff.
- `.claude/settings.local.json` is untracked user state and intentionally untouched.
- The untracked zero-byte root file `=` has unknown ownership/purpose and is intentionally preserved;
  do not delete or absorb it without maker direction.
- The former mixed root `tmp/` no longer exists. Nine durable third-party sources (23,215,628 bytes)
  were promoted to ignored `research/` paths and recorded in `research/phase6-source-currency.md`.
  The remaining 831 files / 61,711,278 bytes are preserved under ignored `research/tmp/` as
  provenance-incomplete renders, cache and extraction tooling; they are not evidence. The inventory
  found no generated scientific result eligible for `evidence/`.
- Historical production sweep bytes were not modified. The arm64 fingerprint was relocated
  byte-identically from `docs/` to
  `evidence/phase6-crossplatform/arm64-libm-fingerprint.txt` (18,398 bytes, SHA-256
  `d6686f8e687bc4328cf693febe0325932077582f4fd3445bf6d6010e9bce0c02`). The complete x64
  fixture beside it, `x64-libm-fingerprint.txt`, is 18,395 bytes with SHA-256
  `c21fa3775360cfb910d524bf34eb2a6fef76059476805e50b9acb7531f6b53a4`; the evidence manifest
  records both. Neither is a production sweep.
- At the `7a60eaf` WP0 landing, Rule 7 passed over 417 files, both TypeScript projects passed, and a
  12-file / 253-test focused non-education set plus staged `git diff --check` passed. That landing's
  exact `npm.cmd test` exited 0 in 728.5 seconds with 79 files / 1,404 tests in 718.77 seconds. The
  scoped non-author review was clean. These are historical checks, superseded as the current
  repository result by §7's `a1d540c` run; none is R15 or validation evidence.
- Historical targeted verification for the committed `8dc7a60` unit (not the later dirty-tree
  interpretation/ADR changes):

```text
node app/scripts/phase6-ladder-read.mjs
node app/scripts/phase6-flip-census.mjs
node app/scripts/phase6-wp5-independent.mjs
node app/scripts/phase6-arm2-independent.mjs
node app/scripts/phase6-diagram-reconcile.mjs
npx vitest run runner/test/evidence-integrity.test.ts runner/test/phase6-ladder-reader.test.ts runner/test/phase6-independent-evidence-scripts.test.ts runner/test/phase6-sdak.test.ts runner/test/phase6-sweep.test.ts runner/test/phase6-crossplatform.test.ts runner/test/phase6-protocol.test.ts
npm run lint:rule7
node scripts/verify-phase6-heldout-source-lock.mjs --harrison research/harrison-2016.zip --pokrifka research/pokrifka-2020.pdf --takahashi research/takahashi1991.pdf --corrigendum research/takahashi1991-corrigendum.pdf --history research/harrington-pokrifka-2026.zip
```

All five direct readers/verifiers pass. The combined focused run is **7 files / 125 tests passed**,
including evidence integrity and ten fail-closed reader/verifier regressions. Exact root `npm test`
exited 0 in 735.4 seconds on the final candidate: Rule 7 clean across 408 files, both TypeScript
projects passed, and Vitest passed **76 files / 1,347 tests** in 725.74 seconds. `git diff --check`
is clean. The closing reviewer separately invoked `npm.cmd test`; its 600.4-second tool ceiling
terminated the still-passing run with exit 124 after Rule 7 and both typechecks completed, so that
reviewer attempt is explicitly a timeout, not a second full-suite pass.

The new partial source-lock verifier separately exits 0: five exact external files, 21 Harrison ZIP
members, and every fixed-time interpolation reproduce; maximum observed bracket gap is
`0.9451000000000249 s` in binary64 evaluation. Its focused Vitest file passes 7/7, including raw
duplicate-key and unknown/duplicate-CLI-field controls. The prepared-kinetics differential passes
56/56 across all existing parameter sets and all four policies; its independent reviewer reports no
remaining blocker or should-fix. Exact root `npm test` on the complete unit exits 0 in 731.9 seconds:
Rule 7 clean over 426 files, both TypeScript projects green, and 78 files / 1,383 tests passed
(Vitest 721.88 seconds).

The final combined `8dc7a60`-unit run passed **4 files / 99 tests**. The source-lock reviewer
independently reran 7/7 plus both byte verifiers and closed with zero blockers/should-fixes. The
prepared-kinetics reviewer independently reran 56/56 and closed with zero blockers/should-fixes.

Before the later ADR-acceptance and education repairs, the dirty tree passed Rule 7 over 415 files,
both TypeScript projects, `git diff --check`, the five-file / 21-member source lock, the independent
arm-2 reader and the flip census. That earlier focused checkpoint/timeline/LK/arm-2 run passed
**5 files / 121 tests**, and the earlier broader Phase 6 group passed 106/107 with only the deliberate
corrected-table versus historical-table-pin mismatch. Those suite counts are historical and
superseded by §7's current exact run. The latest direct canonical manifest recomputation exactly matches the
candidate constants:

| arm | values | justification | combined |
|---|---|---|---|
| arm 1 | `879e069f612f1c6b4b40074d5cc890419fc17f09545dc27b2c8823d7667938f6` | `52697efb3fd01c5f5777100b5572b51e595a0e1a44cf9755cad6167214181a5c` | `ea9c76fc3819adceb0bce32dbe07b8288d079ed734b0addd6ee1891483f845c1` |
| arm 2 | `13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76` | `e2f7f24c5fc71137c9d06bb2344685b260d8702426edf656f22dd6b42f58471f` | `4be5c82d8ddb64947f459f40f1d941eb0e95d7548a6f6dd18067c65eda53076b` |

Both values hashes are unchanged; every intermediate justification/combined hash, including the
immediately preceding `13911b85…` / `6f35c2bc…` and `709646e5…` / `21b16a7b…` pairs, remains in
ordered revision history. On the earlier pre-metrology candidate, exact root `npm.cmd test` exited 0
in 723.7 seconds: Rule 7 clean over 415 files, both TypeScript projects green, and Vitest 78 files /
1,394 tests in 713.98 seconds. That is a historical check, not verification of the hashes above. The
historical `276494f6…` table constant remains inside arm 1's legacy values manifest; the accepted
current bytes use the separate `c0b314b6…` content pin.
Arm 2's historical M1 values manifest never carried a parameter-table digest and retains its exact
independent `13e678d5…` identity; adding a field after execution would rewrite that contract. The
current-tree full-suite claim is §7's exact `a1d540c` result.

The current focused verification commands are:

```text
npm.cmd run lint:rule7
npm.cmd run typecheck
npx.cmd vitest run core/test/libbrecht.test.ts core/test/checkpoint.test.ts core/test/timeline.test.ts solver-cpu/test/lk-solver.test.ts solver-cpu/test/timeline-environment.test.ts runner/test/phase6-arm2.test.ts runner/test/phase6-independent-evidence-scripts.test.ts runner/test/phase6-sdak.test.ts runner/test/evidence-integrity.test.ts runner/test/phase6-crossplatform.test.ts runner/test/phase6-protocol.test.ts runner/test/progress-index.test.ts
git diff --check
git diff --cached --check
npm.cmd test
```

## 8. Review provenance and limits

The compact-progress recordkeeping reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, read-only
and non-author with full shared task/repository context. It independently reproduced the raw and
LF-normalized archive-body identities, unique marker, effective Git `-text` attribute and equal raw/
filtered object IDs; measured the 10,405-byte / 127-line current index; reconciled its status and
ranked actions against this handoff and the active plan; resolved 144 local paths and three heading
fragments across the seven routing files; reran the 7/7 focused progress test and `git diff --check`;
and reported 0 blockers / 0 should-fixes after the clean-filter, stale-HANDOFF, README and R90
repairs. A staging-specific follow-up checked the exact-path `whitespace=-trailing-space` exception,
proved adjacent files retain normal checking, reproduced the unchanged raw/filtered/staged object
ID and both body hashes, reran 7/7 tests and a clean staged diff, and again reported 0 blockers /
0 should-fixes. It did not run exact root `npm test`, validate Phase 6 science, inspect education content,
revalidate claims inside the historical body, or perform a clean-clone checkout.

The 2026-08-01 claim audit used OpenAI `gpt-5.6-sol` at ultra reasoning. It inherited the current
request/handoff context but did not author Phase 6. It independently re-executed both historical
artifact verifiers, diagram reconciliation, flip census, ladder reader, direct JSON class/fragility/
f = 0.90 recomputations and the live fingerprint, and inspected CAK/M1 mappings. Separate non-author
reviews audited R15 and the GPU/held-out seams.

The closing content/verifier review used OpenAI `gpt-5.6-terra` at ultra reasoning. It shared the
task/handoff context, did not author or edit the candidate, and independently rechecked the focused
7-file / 125-test suite, evidence integrity, both complete fingerprint tables and their manifest,
reader mutation coverage, Rule 7, both typechecks and `git diff --check`. It found no remaining
content or fail-closed-verifier blocker. Its attempted repository-wide test hit the 600.4-second
  tool limit described above; that timeout is a review limit, not a pass or test failure. **This
  zero-blocker verdict is superseded:** a later `gpt-5.6-sol` non-author audit found additional live
  interpretation, hash-bound protocol, ADR and education propagation defects. It must not be cited
  as a clean review of the current tree.

The candidate-source reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It independently checked all five external hashes, all 21 locked Harrison members,
the 16 corrected condition rows, 80 interpolated ratios, duplicate/exclusion/missing-row controls,
Takahashi ranges and every fail-closed mutation; final focused recheck was 7/7 plus both byte
verifiers. It did not run the solver, exhaust world literature, recover missing crystallography,
derive distributions, or digitize a compatible physical-size target.

The prepared-kinetics reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It inspected construction, all boundary paths, timeline transactions, noise and
override ordering, reports, ledgers and checkpoint codec use, and independently ran the final 56/56
differential. It did not compare a separately built historical executable, run production-size or
final-tolerance trajectories, test another engine/architecture, establish a whole-solver speedup,
or complete final-tree `npm test`.

The R15 science-path/source reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with
full shared context. It independently inspected the charter/plan/ADRs, source currency, solver,
protocol/evaluator seams and primary-source leads. It initially found four missed live theorem
propagations, then expanded that set to at least ten during the current recheck; it identified blind
TAX2 span extraction as possible but in-sample and
needle-dependent, and identified Nelson 1998 and Bailey–Hallett 2004 as unaudited leads. It did not
acquire/hash every new source, digitize TAX2, implement source-required physics, benchmark the large
domains, or execute any campaign.

The closing code/test reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It independently inspected the corrected Libbrecht mappings, arm-2 hash revisions,
SDAK/root logic, timeline behavior and tests; recomputed all arm-2 hashes; and reran the 6-file /
107-test focused suite. It found no remaining code/test finding. It did not run exact root `npm test`,
R15, GPU, education, production or source re-digitization work.

The closing dataset/report reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It independently ran eight lightweight readers/verifiers, parsed all 123 JSONL lines,
recomputed the 65,536/262,144 actual uncertainty corners and 6,561/19,683 collapsed relative-factor
patterns, verified CAK/M1 counts and source-fit comparisons, and programmatically checked all 14 ADR
0040 charter quotations against accepted `HEAD`. After repairs it found no remaining non-education
dataset/report/interpretation or ADR 0040 authority finding. It did not run long campaigns, exact root
`npm test`, education, source re-digitization or a systematic external literature search. That
at-the-time verdict is superseded by the later complete-diff audit and must not be cited as a clean
review of the current tree.

The closing recordkeeping reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It checked the handoff/progress/plan against the dirty tree, current and historical
parameter-table hashes, no-touch education boundary, moved `research/tmp/` inventory and source lock.
After two prose repairs it found no remaining recordkeeping inconsistency. It did not execute solver
science, exact root `npm test` or the education verifier. That at-the-time verdict is superseded by
the later complete-diff audit and current recheck.

The final non-education complete-diff reviewer at that checkpoint was OpenAI `gpt-5.6-sol` at ultra reasoning,
non-author with full shared repository/task context. It independently inspected the entire current
non-education dirty diff and recordkeeping; rechecked Rule 7 over 415 files, both TypeScript projects,
244 passing focused tests plus the deliberately retained historical parameter-table pin mismatch,
18/18 evidence-integrity/cross-platform tests, five Phase 6 scripts and their independent readers,
the five-file/21-member fail-closed source lock, all current arm-2 hashes and revision history, all 14
ADR 0040 charter quotations, the 123-line dataset, corrected parameter-table bytes, 840-file source
cache inventory, cross-platform fixture hashes, local Markdown targets and `git diff --check`; and
reported 0 blockers / 0 should-fixes. **That verdict is superseded by the later ADR 0040 acceptance
audit**, which found omitted charter-impact quote scopes and additional live provenance/status seams.
It did not run exact root `npm test`, R15, the 408 historical
jobs, GPU production, held-out experiments, arm64 computation, source re-digitization or a new
literature search. `docs/education/**` was explicitly excluded and remained the external dependency
at that checkpoint; the later accepted review above supersedes that state.

The final current-state recordkeeping recheck at that checkpoint used OpenAI `gpt-5.6-sol` at ultra reasoning,
non-author with full shared context. It independently reconciled the handoff, progress, active plan,
candidate charter and decisions with the current tree; reran the exact 5-file/121-test set, the
106/107 protocol group, Rule 7, both TypeScript projects, source lock, arm-2 reader, flip census and
`git diff --check`; and independently checked the candidate-table bytes/hash, source-cache inventory,
protocol/fingerprint hashes, accepted-versus-candidate quotations, dirty-file disposition and
long-run resume rules. It reported 0 blockers / 0 should-fixes after the then-current status repairs.
That verdict is also superseded by the later ADR 0040 findings and current edits. It did not
run exact root `npm test`, the education verifier, R15, the 408 historical jobs, GPU/held-out
campaigns, arm64 execution, source re-digitization or a new literature search; it is not a Phase 6
gate-completion verdict.

The education-handback locator was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context and no edits. It inspected registered worktrees, local refs, history, unreachable
objects, turn-diff refs, historical paths and workspace metadata. It found no durable ADR 0040
education repair: only main and the clean detached arm-2 worktree exist; the historical education
paths/refs are absent; the current education subtree equals accepted `HEAD`; and the latest education
commit predates this correction. It did not query unrelated external clones or an undisclosed remote
session, so its conclusion is limited to locally visible repository/session state.

The first integrated education acceptance reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning,
non-author with full shared project context and no edits. It statically audited the scientific prose,
browser hooks, oracles and negative controls; independently recomputed the M1 dip centres under both
log bases, all three coefficient-equality roots, CAK/CAK_A1 scores, CAK/M1 class and fragility counts,
and every used evidence-manifest hash; and ran `node --check` on the seven reviewed JS/MJS files plus
a scoped `git diff --check`. It returned a blocked verdict for the state, causal/provenance/scope and
source-independence defects summarized above. It did not run either full browser matrix, exact root
`npm test`, R15, GPU/held-out production, arm64 execution, primary-source re-digitization or manual
visual QA. Its verdict governs the first handback only; the repaired education bytes require a fresh
non-author re-review.

The final ADR 0040 acceptance pair used OpenAI `gpt-5.6-sol` at ultra reasoning, read-only and
non-author, with full shared development context. Between them they independently re-derived the 408
historical row semantics/configs/labels, CAK 3/90 and M1 54/78 arm-scope / 54/90 common-scope,
dip centres under both logarithm bases, equality roots, fragility witnesses, proxy counterexample,
18-file evidence hashes, 448-entry portability difference, source lock, historical/current table and
manifest hashes, and exact charter quote coverage 22/22. The final targeted set passed 101/101,
focused public/offline education rejected 153/153 controls in each mode, and the reviewer reported no
remaining blocker. It did not rerun the 408 long jobs, R15, GPU/held-out work, arm64/Tier 2 raw
computation, primary-source redigitization, root `npm test`, or the full browser matrix; root ran the
last browser matrix separately and records it above. Full provenance and limits are in ADR 0040.
**That clean verdict was superseded for its candidate bytes:** a later acceptance audit found
the exact Boltzmann constant, Celsius/kelvin offset, and standard-atmosphere conversion missing from
the authority chain, the approximate diffusivity/reference-pressure association misclassified, a
  future interpolation described as already registered, a stale current-table pin, and recordkeeping
  that still made education a current dependency. The final scoped re-review below closes those repairs.

The ADR 0040 acceptance follow-up used OpenAI `gpt-5.6-sol` at ultra reasoning, read-only and
non-author, with full shared task/repository context. It independently recomputed the 50,464-byte
`c0b314b6…` current table and all six arm identities; verified both legacy values hashes and ordered
revision histories; checked the official exact Boltzmann, Celsius/kelvin and standard-atmosphere
authorities and the separate P2 diffusivity-pressure closure; matched all 22/22 deleted charter
clauses to unique verbatim quotations; and proved `docs/education/**` still equals frozen checkpoint
`60e3f3f`. Its final focused set passed 4 files / 132 tests, Rule 7 was clean over 417 files, both
TypeScript projects passed, and `git diff --check` passed. Verdict: 0 blockers / 0 should-fixes. It
did not run exact root `npm test`, any long Phase 6 job, R15, GPU/held-out work, arm64 computation, a
clean clone, source redigitization, the education verifier/browser matrix/visual QA, or education
content beyond the landing notice.

The ADR 0039 design history used OpenAI `gpt-5.6-sol` at ultra reasoning, non-author reviewers with
full shared context. An earlier reviewer independently inspected decision 0011, the charter,
checkpoint codec/tests, complete LK mutable state, runner and active plan; recomputed the 744³ field
lower bound; and rejected the initial monolithic, under-bound and provenance-conflating design. A
later narrow recheck reported no blocker, but the newest implementation-readiness audit superseded
that verdict: static inspection proved an unattached boundary `f=1` state is reachable, identified
unfrozen WP3-dependent runner contracts and found inconsistent generation-retention wording. Those
points are corrected or explicitly deferred in the proposed ADR. A fresh core-design reviewer then
checked the exact 1,095-line / 80,760-byte candidate at
`b9bfec3708b8ef04feed040a8c02d1cda54187dee90f990bb49d74355d33b69f`, static-traced reachable
`f=1`, topology adoption and chain recovery, reproduced a small binary64 witness, and reported
0 blockers / 0 core should-fixes. It ran no `npm test`, implementation, large-memory trial, crash
injection, filesystem durability experiment, resumed differential or production case. Runner
acceptance remains outside that verdict and deferred to WP3.

A later ADR 0039 implementation scout used OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with
full shared context and no edits. It read all 1,106 current ADR lines, the active plan and complete
solver/legacy-codec topology/cycle paths; ran small CAK/M1 diagnostic probes and scoped
`git diff --check`; and found no new core blocker after WP0. Its key landing constraints are: keep
legacy codecs byte-frozen; put v3 in a new core module; let core independently validate and construct
the final topology for single-consume solver adoption; treat the mutation epoch as a live encode
sentinel rather than a wire field; keep the no-dip spelling schema-reserved only; and add isolated
core/solver resume tests with frozen v1/v2 fixtures. It did not edit, run `npm test`, build the codec,
perform large-memory/crash/durability trials, or inspect the WP3-deferred runner publication layer.

No reviewer re-ran the 408 historical long solver jobs, an R15 production campaign, preview-budget
GPU cohort or held-out experiment. The candidate-source lock is complete, but the selected target/
evidence freeze remains open because the current sources do not specify an apples-to-apples target.
`docs/education/**` was explicitly out of scope of that non-education review and was then a separate
propagation dependency. Its first author handback was **not accepted**. A non-author education
acceptance audit independently confirmed the corrected M1 centres/roots, both CAK grids/scores,
CAK/M1 class and fragility totals, and `evidence/MANIFEST.json` hashes, but returned blockers: planned
R15/no-dip work was called registered/frozen; causal, provenance, held-out, fingerprint and freeze
claims exceeded their evidence; supersaturation and cross-platform scope were wrong; current status
was checked against a second hand copy instead of tracked evidence; three scientific interactives had
no direct oracle; and visible scientific disclaimers were fail-open. The active-plan no-dip status
contradiction and the full finding set were subsequently repaired; the final acceptance pair above
supersedes this blocked checkpoint with a clean verdict. No arm64 execution or primary-source
revalidation was performed by either education review.

Root separately completed exact `npm.cmd test` on the earlier pre-metrology/pre-compaction candidate:
exit 0, Rule 7 clean over 415 files, both TypeScript projects green, and 78 files / 1,394 tests
passed. That result remains historical. Root's current-tree landing check is recorded in §7: exact
`npm.cmd test` at `a1d540c` exits 0 with Rule 7 clean over 419 files, both TypeScript projects green,
and 81 files / 1,442 tests passed.
