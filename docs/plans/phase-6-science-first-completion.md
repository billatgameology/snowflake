# Plan — Phase 6 science-first gate completion

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-01
- **Last touched:** 2026-08-02 by OpenAI Codex (`gpt-5.6-sol`, ultra reasoning)

## Goal

Complete the Phase 6 scientific gate that the 2026-08-01 external review correctly found
incomplete. The maker has chosen the science-first branch of open item O1b: execute the registered
conservative-intersection headline and the omitted charter obligations rather than amend the
charter to fit the evidence already produced. Resource cost may shape scheduling and concurrency,
but it may not weaken a validity criterion, substitute an unregistered configuration, or turn a
missing comparison into a prose limitation.

The existing two 204-row sweeps remain tracked measurements of the model at their executed
configuration. They are not erased, upgraded, or silently pooled into the new result. The accepted
failure to reproduce the Nakaya diagram also remains a valid measured-only result. This plan is
about earning the registered verdict and the independent evidence that were not produced.

The historical CAK→M1 comparison is also not a causal SDAK ablation. It simultaneously changes the
broad σ₀ functions, the facet prefactors, and the M1 dip factors. A new, explicitly named
`M1_NO_DIP_ABLATION` arm therefore matches M1 in every implemented kinetic choice except that its
basal and prism dip factors are one: it uses `sigma0BasalM2Broad`, `sigma0PrismM2Broad`, and
`A_basal = A_prism = 1`. CAK-versus-M1 remains a useful parameter-family comparison; only the
matched M1-versus-`M1_NO_DIP_ABLATION` comparison may support a causal statement about the
implemented dip factors' effect on this solver's outputs under the frozen configuration. Even
that clean intervention cannot establish physical SDAK causality or necessity in nature.

## Done when

Current accepted charter v1.19, verbatim:

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the versioned protocol freeze (item 1) makes every authorized change auditable and invalidates prior sweep evidence for the replacement gate after a post-freeze edit.

The quoted gate is reached only after all preceding Phase 6 charter items that give it meaning are
also discharged: the full protocol is frozen before new evidence; grid, timestep, and domain
controls pass at representative registered points; the production headline is the conservative
intersection required by ADR 0026; hundreds of automated preview-budget runs execute on the
headless GPU harness; no-SDAK and SDAK results remain separate; held-out growth-rate,
size-dependent-habit, pressure, and history-response comparisons run; and evidence labels are
upgraded only where those comparisons support them.

## Governing direction

The maker's 2026-08-01 direction is binding for this work:

> O1b needs to be executed. If there is a choice between science and resource, choose science.

This supersedes ADR 0037 §5 only as a scheduling/resource decision. It does not change or erase
ADR 0037's measurements: N = 48 fails its registered domain check at three of four sampled points,
N = 64 fails against N = 80 at three of four, and no configuration tested so far satisfies every
registered numerical condition. A new accepted ADR must record this supersession and quote the
applicable charter clauses before a replacement protocol freezes. Accepted ADR 0040 and current
charter v1.19 now govern the coefficient/provenance correction discovered during this review; their
acceptance does not weaken any scientific obligation or freeze R15. ADR 0039 remains proposed: an
implementation-readiness audit found a reachable-state contradiction and runner inputs that cannot
be frozen before WP3. The protocol-independent core resume work may proceed under this plan, but no
runner/evidence contract becomes authoritative until ADR 0039 is accepted after WP3 review.

The maker's 2026-08-02 sequencing direction is also binding: **freeze all further education-site
work until Phase 6 is complete.** The landing page carries a prominent warning that the course is
not the authoritative status or validation record. Preserve the current `docs/education/**` work
exactly as the local, unpushed checkpoint `60e3f3f`; do not polish its prose, repair Chapter 16, regenerate its
figures, run its visual matrix, or spend Phase 6 resources extending its verifier. The prior
education checks remain historical checks of earlier candidate bytes, not acceptance of the frozen
current tree. Education repair and its adversarial acceptance review move to a post-Phase-6
reconciliation step. This scheduling change does not remove, weaken, or substitute for any Phase 6
scientific obligation.

## Approach

Work proceeds through independently reviewable freezes. No expensive evidence campaign starts
until its inputs, evaluator, negative controls, output schema, resource estimate, and termination
rules are committed and adversarially reviewed. Reconnaissance may measure cost or discriminate
between predeclared numerical configurations, but it is stamped non-transferable and cannot enter
a gate result.

Unattended execution is resumable by construction. Before any long task, update `docs/HANDOFF.md`
and `docs/PROGRESS.md` with the exact resume point; run only from a tracked-clean committed source
snapshot; write separate labeled live/error/exit logs; publish useful generated science under the
tracked `evidence/` manifest boundary; and, after ADR 0039 is implemented, use immutable
cycle-boundary generations rather than relying on one process surviving. Maker-facing status is at
most hourly unless requested, so narration cannot consume the context needed to finish the work.

The scientific result stays anchored to the float64 CPU oracle and the D6h-equivariant
`aggregate-hv-g1h1-v6` policy. The GPU cohort is a separately reported preview-budget execution and
CPU-comparison obligation, not a cheaper replacement for the oracle. Before the GPU cohort can run,
the WGSL path must implement the same registered surface policy and a binary32-appropriate
convergence rule must be derived and validated against float64; the current v5-only, gather-order
path cannot be treated as equivalent to v6.

Physical crystal size and numerical convergence are kept distinct. Growth can genuinely depend on
size, so a larger target extent is not automatically “more converged.” The validation size or size
strata must come from a source-matched, pre-registered comparison design. At each such physical
size, grid spacing, timestep, and far-boundary placement are numerical controls and must be shown
adequate independently. The previous extent ladder is retained as a diagnostic and cannot choose a
convenient production size after its habit classes are known.

The new production artifact is self-sufficient: every row carries all three grid-spacing
measurements, fitted order, extrapolation admission/refusal, measured class, extrapolated class
where admitted, conservative-intersection verdict, numerical-validity witnesses, engine and source
provenance, and immutable input hashes. The gate re-derives its verdict from those bytes. No
producer-supplied pass field is trusted.

## Work packages

### WP0 — repair the state before making new claims

- [x] Reconcile `docs/PROGRESS.md`, `docs/HANDOFF.md`, the prior Phase 6 plan, ADR 0037, the two-arm
  report, and the conclusion so they agree that the gate is active and incomplete.
- [x] Correct the columns diagnostic to registered outcome 4 (non-monotone) and remove every
  surviving priority or gate-standing claim derived from that inadmissible diagnostic.
- [x] Recompute the symmetric extent-fragility census with an explicit boundary convention and pin
  it in executable tests; do not publish 42/51 or 43/52 until the convention and raw rows agree.
- [x] Narrow cross-architecture prose to the four executed `CAK` configurations.
- [x] Add an executable M1 regression that pins the analytic base-invariant dip centre rather than
  only a downstream transition count.
- [x] Correct the surviving arm-2 hashed justification that still claimed natural logarithm moved
  those centres to approximately 3.08/8.07 °C. Preserve the historical justification/combined hashes in revision
  history; the registered values hash and executed rows remain unchanged.
- [x] Correct stale cross-references and run the existing independent verifiers against the tracked
  evidence.
- [x] Complete the first non-author closing review before the initial correction commit. Its
  then-zero-blocker verdict is retained as historical provenance but **superseded** by the later
  expanded audit; it is not a clean review of the current tree.
- [x] Complete the expanded theorem/interpretation propagation audit after a later non-author R15
  review falsified the first closing summary. It has now found live or internally contradictory
  material in at least ten files, not four: `research/2306.13087v1.md`, `research/figures.md`,
  `research/libbrecht-figure-findings.md`, `docs/monograph-review.md`, the superseded Phase 6 plan,
  `research/phase6-convergence.md`, the attachment-kinetics solver spec, the stretch/publication
  note, the video explainer and `research/libbrecht-papers-extracts.md`. It also found critical
  outward-facing copies under `docs/education/**`. A read-only local handback audit on 2026-08-01
  found no owner, branch, worktree, commit, patch, bundle or current agent, so this session reclaimed
  the bounded repair rather than leave an unowned dependency. Its exact known roots are
  `FIGURES.md`, `assets/anim-sigma0.js`, chapters 12, 13, 17, 28 and 29, `glossary.html`, `index.html`, and
  `tools/part-two-oracles.mjs`. The repair must cover the coefficient-versus-habit,
  centre-versus-equality-location, source-fit-versus-measurement and verifier-oracle semantics, rerun
  the education verifier, and receive a proportionate adversarial review. Three non-author review
  slices initially closed the non-education
  code, dataset/report and recordkeeping surfaces, but a later complete-diff audit found further
  status, hash, unit, inventory and source-provenance defects. A fresh complete-diff reviewer
  initially closed those repairs, but the subsequent ADR 0040 acceptance audit found omitted charter
  quote scopes and stale arm-2 provenance/status/label seams. Those fixes landed, including the last
  partial-field 42/90 proxy labels and their append-only hash revisions. The reclaimed education
  repair is integrated and materially expanded: the current
  focused verifier derives Phase 6 status from the 18-file evidence manifest, all three 204-row
  point/report pairs, both 448-entry fingerprints, the held-out source lock and tracked state records;
  it passes **153/153 named negative controls** in both public-source and offline-source modes. The
  new controls include coherent manifest repins,
  all M1 report/config identity fields, exact invalid-row scope/reason/tuple semantics, source-level
  held-out/pressure mutations, independently recomputed 9/448 and 31-ULP portability, the explicit
  absence of Tier 2 raw evidence, and non-vacuous formula sample inventories. The Tier 2 arm64 logs
  and exit records were never tracked and are unavailable, so the four matching output rows are now
  labeled a non-rederivable historical report everywhere; lesson A1 records this repeated
  evidence-preservation failure. Targeted visual QA passed 12 Chromium profiles / 24 screenshots
  (`out/education-visual-qa/report.json`) after mobile repairs to chapters 13, 28 and 29. The
  then-closing non-author review was clean for those candidate bytes: exact charter quote coverage
  was 22/22, current/historical hash lineage was preserved, and arm-2/protocol/SDAK tests passed
  101/101. Later metrology findings reopened the non-education unit, and later Chapter 16 edits
  reopened education acceptance before the maker froze that snapshot. The complete-course
  verifier then passed 213 checks over 33 pages and 179 visual roots in public and offline modes,
  including 198 profile loads per mode plus deterministic repeats and 165/165 negative controls
  (`out/education-verify/report.json`).
- [x] Accept ADR 0040 and register the corrected parameter table through a separately named current
  path without overwriting historical identity. The initially accepted 48,359-byte current-table
  candidate was superseded when the acceptance audit found omitted exact metrological inputs. The
  repaired LF-normalized current revision is 50,464 bytes with hash
  `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`; the historical
  `PHASE6_PARAMETER_TABLE_SHA256 = 276494f69682adb2b071c2e2683a98281aef17b3558b4efa6301ceaf11dfa741`
  remains bound inside arm 1's legacy values manifest. Arm 2's historical M1 values manifest never
  carried a parameter-table digest; preserve that exact schema and its independent `13e678d5…` values
  hash rather than retrofitting a new field. Add a separately named revision/current-table hash path
  and redirect only the current-file integrity assertion; do not mutate either historical manifest
  identity. The current-file integrity assertion now uses the separately named current constant.
  This step does **not** freeze the R15 protocol: its values/protocol hash waits for WP1 held-out
  targets and WP2 numerical inputs.
- [x] Run the first WP0 landing checks. Exact `npm.cmd test` exited 0 in 723.7 seconds (Rule 7 clean
  over 415 files, both TypeScript projects green, 78 Vitest files / 1,394 tests in 713.98 seconds).
  The complete public/offline education verifier passed 213 checks as recorded above. These are
  historical checks of the earlier candidate bytes; they do not close the later metrology repair,
  satisfy WP8's future final-gate verification, or discharge any R15 evidence obligation.
- [x] Freeze the education site under the maker's 2026-08-02 sequencing direction and add a visible
  non-authoritative-status notice to its landing page. The completed verifier and visual-QA results
  above describe earlier candidate bytes; later Chapter 16/provenance edits reopened acceptance and
  are preserved in local, unpushed checkpoint `60e3f3f` as deferred work-in-progress. No further education content, figure, visual-QA, or
  verifier work is on the Phase 6 critical path. Reconcile and independently review the entire site
  only after Phase 6 closes.
- [x] Close ADR 0040's acceptance-audit follow-up. The implementation and authority records now
  classify the exact Boltzmann constant, Celsius/kelvin offset, and standard-atmosphere conversion
  as P1 authoritative definitions, their binary64 representation as P4 precision policy, and the
  exact-atmosphere `D_air` anchor as a P2 project closure. Independently review those final bytes and
  the new 50,464-byte table pin, run focused non-education checks plus exact `npm test`, then commit
  this non-education WP0 unit locally without touching either legacy manifest or the frozen
  education snapshot. The scoped OpenAI `gpt-5.6-sol` ultra read-only non-author follow-up is now
  clean (0 blockers / 0 should-fixes): it independently recomputed the table and six manifest
  identities, checked the official exact-metrology authority chain, matched 22/22 charter deletions
  to unique quotations, and proved the education tree still equals `60e3f3f`. Its focused set passed
  4 files / 132 tests; it also reran Rule 7, both typechecks, and `git diff --check`. Root's current
  broader focused set passes 12 files / 253 tests with Rule 7 clean over 417 files and both
  typechecks green. Exact root `npm.cmd test` then exited 0 in 728.5 seconds: Rule 7 remained clean
  over 417 files, both TypeScript projects passed, and Vitest passed 79 files / 1,404 tests in
  718.77 seconds. The staged diff check is clean; the local landing commit contains this completion
  record and changes neither legacy manifest nor the frozen education snapshot. After these final
  record-only edits, Rule 7 is clean over the then-current 416-file scan and the progress-index test
  passes 7/7. Landed locally as `7a60eaf`; nothing was pushed.
- [x] Compact `docs/PROGRESS.md` into a small authoritative current-state index. Move only clearly
  historical or explicitly superseded material verbatim into linked archive files; keep the current
  phase/gate state, active-plan pointer, current verification limits, ranked next actions, and
  cold-resume instructions in `PROGRESS.md`. Preserve discoverability with stable links, audit all
  code/tests and documentation that consume the file, and independently compare the archived plus
  retained bytes so no scientific claim or provenance record disappears. This is recordkeeping
  only: it changes no gate, evidence, protocol, or authority ordering. Completed with a 10,405-byte /
  127-line current index and a same-directory archive whose exact pre-compaction body is 191,859 raw
  bytes (`2550319a…f955`) or 190,074 LF-normalized bytes (`9f7ee2ad…a9d`). An exact-path Git `-text`
  rule prevents this host's clean filter from changing the mixed endings; raw and filtered object
  IDs both equal `79264387…`. After staging exposed CR bytes as false trailing-whitespace findings,
  the same exact path gained `whitespace=-trailing-space`; adjacent files retain normal checking.
  The enforcing test passes 7/7. A read-only OpenAI `gpt-5.6-sol` ultra
  non-author reviewer with full shared context independently reproduced those identities, checked
  144 local paths plus all three fragments across the routing files, reran the focused test and
  `git diff --check`, and reported 0 blockers / 0 should-fixes. A short follow-up independently
  confirmed the path scope, unchanged raw/filtered/staged object identity, both body hashes, focused
  7/7 result, and clean staged diff. It did not run exact root `npm test`,
  validate Phase 6 science, inspect education, revalidate historical archive claims, or perform a
  clean-clone checkout.

### WP1 — source currency and held-out target inventory

- [x] Re-check every Phase 6 input and validation citation against its latest primary-source
  version, and sweep the cited authors' later primary output for superseding forms or data.
- [x] Build a candidate inventory for all four charter-mandated held-out families: growth rates over
  named (T, supersaturation) points, size-dependent habit, pressure dependence, and deterministic
  growth-history responses.
- [x] Record whether each candidate is truly held out from P1–P4 inputs, its geometry and substrate
  conditions, observable definition, digitization/measurement uncertainty, and whether the 3-D
  lattice can make an apples-to-apples prediction without a new fitted quantity.
- [x] Reject targets that reuse Nakaya-tuned P3 inputs as “independent,” require an unregistered
  geometry mapping, or cannot be scored without looking at the model output.
- [x] Freeze candidate primary-source bytes/stable identifiers and a deterministic extraction in a
  fail-closed partial lock. The 16-trace Harrison/Pokrifka candidate, Takahashi diagnostics,
  rejected pressure row and two history candidates are pinned by
  `research/phase6-heldout-candidate-lock.json`; the executable verifier independently checks five
  external files and 21 archive members. The loader pins LF-normalized source text before parsing,
  so duplicate JSON keys cannot hide behind `JSON.parse`; the CLI rejects unknown and duplicate
  flags. Final non-author recheck is clean after all findings. The lock says `passEligible=false`
  and is not a target.
- [x] Inventory the mixed root `tmp/` cache and promote its nine durable third-party source files to
  ignored `research/` paths. Record stable identifiers, byte counts, page/member counts and SHA-256
  in `research/phase6-source-currency.md`; preserve the unprovenanced derivative renders, parse cache
  and tool dependencies under ignored `research/tmp/`, explicitly transient and inadmissible as
  evidence. The five-file verifier re-executed from the new paths with `files=5 members=21
  maxGap=0.9451000000000249s passEligible=false`. No generated science data was present to promote
  into `evidence/`.
- [ ] Freeze a selected validation target, prediction-side geometry/transport uncertainty and
  scoring operator after independent review. The corrected audit found no presently apples-to-apples
  family: Harrison crystallography is unobserved; Takahashi's warm supersaturation/rim state is
  unresolved; pressure is confounded; and both history candidates require missing load-bearing
  physics. The classical Nakaya reference also supplies no crystal size or size stratum; the later
  206-panel grid supplies field-of-view widths, not crystal dimensions, and uses a load-bearing
  c-axis needle seed. A blind, pre-registered pixel-segmentation operator could derive panel terminal
  spans from those fields of view, but only after source-byte lock and uncertainty review; the result
  remains in-sample for M1 and requires a matching electric-needle geometry. The second audit
  exact-byte checked Nelson 1998, the official Bailey–Hallett 2002 precursor and Bacon et al. 2003;
  the indexed 2004 publisher rendering was reviewed, but no journal PDF/hash was available. It
  rejected those target families for, respectively, sublimation/capillary/thermal physics,
  filament/polycrystal/coupled-pressure physics, and unresolved/polycrystalline initial state plus
  supersaturation inferred from the same mass curve.
  Their 100–300 µm ranges do not define one apples-to-apples size. Source/model compatibility, not
  compute cost, is the current WP1 blocker.

### WP2 — numerical configuration campaign

- [x] Independently derive the minimum campaign and feasibility envelope. Without a new theorem the
  whole-grid row count is `612 × S × D × Z` (three arms × 204 points × `S` spacings × `D` domains ×
  `Z` physical-size strata). The three-by-three, one-size baseline is 5,508 rows; one extra domain costs 1,836
  only while `S = 3`, and one extra spacing costs 1,836 only while `D = 3`. If both axes grow, their
  cross-term is mandatory. Exact D6h symmetry and a monopole shell do not bound the surviving
  quadrupole/nonlinear attachment path, so they do not replace the whole-grid matrix. A 350 µm target
  would require dimensions up to roughly 744 at the candidate third spacing and makes the current
  uniform Jacobi path infeasible without audited acceleration/resume work.
- [x] Land the first bit-identical CPU acceleration: temperature/parameter-set facet constants are
  prepared once while the per-call Hertz–Knudsen expression, noise order and every solver update
  remain unchanged. A non-author audit accepted all four policies, all three existing parameter
  sets, noise off/on, accepted/same-temperature/rejected events, complete state, reports, ledgers and
  checkpoint bytes with no remaining finding. The measured 4.86× figure is coefficient-only and is
  not a whole-solver or campaign-speed claim.
- [x] Clear decision 0039's protocol-independent core resume design; keep the ADR proposed until
  WP3 freezes and reviews the runner contract. The core format must stream rather than
  concatenate: at the contemplated 744³ envelope the three main fields alone occupy 7,001,123,328
  bytes. Restore adopts decoded fields without a second full copy; the runner will hash-bind immutable
  protocol/case/runtime/trace-bound generations and independently replay trace state. This protects
  process-crash recovery and accidental corruption, not hostile tampering. A prior OpenAI
  `gpt-5.6-sol` ultra non-author review of the 929-line candidate reported no remaining blocker; a
  later implementation-readiness audit superseded that verdict. It proved that an unattached boundary
  cell with exact `f=1` is reachable, so the decoder must accept finite `f` in `[0,1]`, and found that
  the run-spec, policy, manifest, cadence and retention contracts depend on inputs not frozen until
  WP3. The ADR now preserves complete generation chains to genesis and defers those runner details;
  it required a fresh non-author core-design review before core implementation. That review is now
  clean on the exact 1,095-line / 80,760-byte candidate at SHA-256
  `b9bfec3708b8ef04feed040a8c02d1cda54187dee90f990bb49d74355d33b69f`: 0 blockers and 0 core
  should-fixes. The reviewer shared full context, static-traced reachable `f=1`, topology adoption
  and recovery-chain semantics, ran a small binary64 witness and `git diff --check`, and ran no
  streaming/crash/resume implementation, production, GPU, held-out or full-suite checks. This
  clears only core design; runner acceptance still waits for WP3, and the active WP0 dependency
  still precedes implementation. Cold-start reconnaissance remains non-transferable.
- [ ] After that core design review, implement and verify decision 0039's protocol-independent stream
  codec and field-adopting solver restore, including frozen legacy byte fixtures, cross-family
  rejection and direct/checkpoint-every-cycle/multiply-resumed CAK and M1 equality. The reviewed
  landing points are a new `core/src/lk-resume-checkpoint.ts` exported from `core/src/index.ts` while
  leaving legacy `core/src/checkpoint.ts` bytes/readers frozen, plus an internal
  `LKSolver.fromResumeStateV3` path that adopts decoder-owned fields and validated topology and
  recomputes only solver floating-physics and scratch caches. Retain original spacing/dimensions/centre, accepted-event count, sticky test-hook
  use and mutation epoch. Do not reuse the runner canonical-JSON helper: it sorts keys and appends a
  newline, contrary to the v3 contract. A fresh read-only implementation scout found no additional
  core blocker after WP0 closes. It confirmed that the mutation epoch is a live encode-concurrency
  sentinel, not a wire field; core must define its own structural resume-report type rather than
  import `solver-cpu`; the decoder must independently construct final topology arrays for one-time
  adoption; and `M1_NO_DIP_ABLATION` remains a wire reservation only until WP3. It recommended new
  isolated `core/test/lk-resume-checkpoint.test.ts` and `solver-cpu/test/lk-resume.test.ts` files so
  current legacy/provenance edits remain undisturbed, with literal/base64 v1/v2 fixture pins before
  the new path lands. **Restart checkpoint 2026-08-02:** the implementation is present in the named
  core and solver files. Root observed the combined new suites green (2 files / 34 tests), the
  broader checkpoint/solver regression green (5 files / 94 tests), and both TypeScript projects
  green. Review found and fixed a Proxy-forgeable symbol constructor capability by replacing it
  with one-use WeakMap identity branding. A read-only solver cross-review found no blocker and one
  should-fix: preserve its independently passing realistic 15-cycle, multi-sweep CAK/M1 continuation
  probe as a durable regression. The interrupted non-author review also found a likely public-core
  encode/decode asymmetry for a manually supplied degenerate monopole domain with zero shell radius;
  add a focused probe and make the paired APIs agree. Other read-only review execution was interrupted.
  This checkbox remains open for that test, remaining verdicts/findings, exact `npm test`, final
  provenance, and the reviewed commit.
- [ ] After WP3 freezes the exact ordered run-spec and manifests plus termination, retry, checkpoint,
  stop, environment, symmetry, cadence and retention policies, implement the independent R15 worker,
  immutable generations/trace replay, publication crash controls and killed-child differential. A
  separate non-author code/evidence review must close before any R15 production row. This is a new
  `phase6-r15-*` path; do not extend `phase6-sweep.ts`/`grow-lk`, whose prose parsing, timeout and
  final-checkpoint semantics are legacy and cannot carry the resume/evidence contract.
- [ ] Pre-register a reconnaissance matrix that spans all three intended arms, both habit axes,
  near-threshold and fast-growth cases, and all physical sizes selected in WP1. Reconnaissance
  outputs are explicitly non-transferable.
- [ ] Use reconnaissance only to estimate feasibility and freeze candidate axes plus deterministic
  escalation rules. It cannot select or certify a production geometry, discharge domain/grid/time
  adequacy, or enter the gate result.
- [ ] Design the **transferable** numerical-control campaign for WP3 freeze: at each physical size
  and spacing, expand the far boundary until two successive registered increments pass; execute the
  whole 204-point domain matrix for every arm/spacing/size unless an independently reviewed bound
  covers omissions; use at least three spacings plus ADR 0026's conditional fourth; halve the
  interface timestep at registered points; test relaxation caps/tolerances; and run seed-mapping
  sensitivity. These rows become evidence only after their protocol is committed and reviewed.
- [ ] Freeze deterministic geometry-selection/escalation rules rather than one convenient geometry
  chosen from reconnaissance. Exact rational spacing, dimensions, target/achieved physical size,
  one-cell overshoot, primary spacing, seed representation and failure consequences must all be
  decided before transferable rows run. If no rung passes, continue the frozen escalation or report
  the measured scientific obstacle; resource cost is not a stopping rule.

### WP3 — decision and protocol freeze

- [ ] Accept an ADR that records the maker's science-first direction, supersedes ADR 0037 §5's
  no-re-sweep scheduling decision, quotes every affected/no-impact charter clause, and preserves
  ADR 0037's negative evidence.
- [ ] Amend the Phase 6 protocol through the charter's existing post-freeze mechanism. The amendment
  must name all sizes, grid spacings, physical domains, timestep controls, CPU/GPU roles, selected
  held-out targets, exact run counts, uncertainty operators, engine versions, environment policy,
  and failure consequences.
- [ ] Freeze the complete transferable domain × spacing × size numerical-control matrix and its
  deterministic escalation/selection rule. Explicitly forbid any pre-freeze reconnaissance row from
  satisfying a Phase 6 numerical obligation.
- [ ] Freeze the complete R15 truth table before execution: primary measured spacing; inclusive,
  boundary-safe fitted-order comparisons; admitted versus mathematically refused versus
  missing/invalid triplets; measured-only eligibility for a refused fit; component denominators;
  `classSurvivesGridExtrapolation`; and the class sequence used by the flip census.
- [ ] Freeze round-trip-exact numeric serialization, underlying occupancy/extents needed for
  independent metric recomputation, per-resolution timeout and retry limits, and the rule that a
  timeout is infrastructure failure rather than a scientific exclusion. The historical three-hour
  timeout is shorter than an observed fine-spacing run and cannot be reused.
- [ ] Put every behavior-affecting value in the gated values manifest; prose remains the
  justification, never the only pin. This includes exact rational spacings, dimensions, target and
  achieved-size/overshoot rules, physical seed mapping, sweep domain, cross-platform fixture,
  surface mapping, denominators, and registered output set.
- [ ] Freeze an explicit clean child-process environment allow-list. Inherited `NODE_OPTIONS`,
  preload hooks, and equivalent out-of-repository mutation paths must fail closed.
- [ ] Add a preflight that proves every frozen row reaches every spawned CPU/GPU invocation and is
  echoed into each result.
- [ ] Execute production children from an immutable detached source snapshot. Hash the exact argv,
  allow-listed environment, source tree, package manifests, lockfile, and resolved workspace
  modules used by each child; before/after endpoint hashes are not evidence against a transient
  source edit.
- [ ] Subject the ADR, source freeze, protocol, cost model, and expected-result statement to a
  non-author adversarial review. Resolve findings before any production row runs.

### WP4 — implement R15 as an end-to-end evidence path

- [ ] Give `phase6FitGridExtrapolation` a production caller that consumes three spacing rows for the
  same registered point and rejects missing, duplicated, shifted, mixed-protocol, or numerically
  invalid inputs.
- [ ] Extend the artifact schema with raw spacing rows, fitted order, admission reason,
  extrapolated value/class, measured/extrapolated agreement components, conservative-intersection
  verdict, and a counted `not-extrapolatable` state.
- [ ] Replace six-significant-digit stdout ingestion with canonical structured records that preserve
  every binary64 number round-trip exactly. Independently recompute aspect ratio from retained
  occupancy/extents, and test values immediately on both sides of the 2/3, 1.5, 0.7, and 1.5 fit
  boundaries, including exact endpoints and nonfinite, constant, and non-monotone sequences.
- [ ] Require the exact frozen raw key set before reduction. For the two charter arms the minimum is
  `1,224 × D × Z` valid raw rows (`2 × 204 × 3 spacings × D domains × Z physical-size
  strata`): 1,224 per domain/size stratum and 3,672 at the current three-domain, one-size baseline.
  The no-dip arm adds 1,836 rows there, for 5,508 total. A missing, timed-out, duplicated,
  unparseable, or shifted row fails the artifact rather than shrinking a denominator.
- [ ] Stage results atomically in canonical key order while retaining exact stdout, stderr, exit
  status, convergence trace, argv, environment fingerprint, source snapshot identity, frozen
  physical-host identity, independently verified live numerical-engine fingerprint, and compact
  occupancy/extents for every child. Fresh and recovery attempts for one case remain on that same
  physical gate host; matching platform/architecture labels alone are insufficient.
- [ ] Compute all reports, tables, diagrams, and the final verdict from the artifact rather than
  from producer summaries.
- [ ] Add independent recomputation that imports neither the sweep producer nor its evaluator.
- [ ] Add executable negative controls for every new field and seam, including a mutation that
  changes the conservative-intersection result while leaving the measured-only count unchanged.
- [ ] Make the gate refuse old measured-only artifacts as headline evidence while continuing to
  verify and label them as historical measurements.

### WP5 — make the preview GPU cohort scientifically comparable

- [ ] Port `aggregate-hv-g1h1-v6`'s order-invariant opposing-vapor reduction to WGSL and keep legacy
  v5 evidence bit-unchanged.
- [ ] Derive a binary32 convergence/error envelope from operation counts and machine precision,
  then validate it against the float64 oracle over adversarial fields and registered morphology
  cases. Do not copy the float64 `divTol` or waive dual convergence because it is expensive.
- [ ] Extend the existing pinned Chromium/D3D12 headless harness to Phase 6 parameter sweeps at the
  charter's preview budget (approximately eight million total resident cells), with bounded dispatch,
  device/error provenance, GPU-resident stepping, and fail-closed readback/evaluation.
- [ ] Freeze and execute an exact count of at least 200 automated preview-budget runs. The intended
  science-first target is the complete 204-point grid for all three intended arms (612 total: CAK,
  M1, and matched no-dip) unless the pre-run ADR registers a scientifically stronger coverage design;
  “hundreds” is never discharged by CPU rows.
- [ ] Report GPU outcomes separately from the float64 production headline and publish CPU-vs-GPU
  class, metric, convergence, and failure comparisons. A mismatch is a result, not permission to
  tune the tolerance after seeing it.

### WP6 — execute the float64 production campaigns

- [ ] After WP3 freezes R15, run its no-SDAK (`CAK`) domain × spacing × size matrix. Its exact count is
  `204 × S × D × Z`; with three spacings, three domains and one size it is 1,836 rows, not 612.
- [ ] Run R15's SDAK (`M1`) matrix separately at the same `204 × S × D × Z` keys.
- [ ] Run R15's planned `M1_NO_DIP_ABLATION` matrix separately at the same
  `204 × S × D × Z` keys after WP3 has frozen its exact values and protocol,
  with a manifest-level proof that the only kinetic difference from M1 is replacement
  of both registered dip factors by one. Use this matched pair—not CAK→M1—for any causal statement
  about the implemented dip factors' effect on this solver under the frozen configuration; do not
  promote that intervention to physical SDAK causality or necessity in nature.
- [ ] Run independent cases in isolated parallel processes within measured RAM limits; preserve a
  live log, stderr, exit status, checkpoint/result bytes, and immutable manifest entry per case.
- [ ] Stop and invalidate by name on any domain contact, convergence failure, symmetry split,
  protocol mismatch, environment violation, or missing witness. Do not silently retry into the
  published artifact.
- [ ] Verify each completed cohort before allowing it into the aggregate, then generate the
  conservative-intersection diagrams and reports with both agreements and disagreements stated.

### WP7 — execute held-out validation

- [ ] Do not treat “no compatible target found” as execution of a charter obligation. Continue the
  primary-source search and, where a scientifically defensible target requires source-specified
  supported/needle seed geometry, vapor-thermal coupling, ventilation, sublimation, or other
  load-bearing physics, add the necessary ADR/spec/implementation/verification work before freezing
  that family. Missing unobserved crystallography may require a set-valued target or new source; it
  must not be invented from model output. Phase 6 remains incomplete until all four families execute
  apples-to-apples or the maker explicitly amends the charter.

- [ ] Run the frozen growth-rate comparison and publish residuals against source uncertainty over
  its named (T, supersaturation, geometry, size, pressure) domain.
- [ ] Run the frozen size-dependent-habit comparison at every registered size rather than selecting
  the size whose class is favorable.
- [ ] Run the frozen pressure comparison with diffusivity and latent-heating limitations carried
  explicitly; do not attribute a mismatch to one omitted mechanism without a discriminating test.
- [ ] Run the frozen schedule/history comparison using decision 0011 event semantics and compare
  predeclared observables at predeclared times/sizes. Do not freeze a target until its free-crystal
  or explicitly implemented supported/needle geometry, temperature, supersaturation history,
  pressure, and observables are apples-to-apples with the solver; absence of an admissible current
  target is a geometry/model-scope blocker to resolve, not permission to score a near miss or close
  the obligation.
- [ ] Report each family independently. Failure or non-comparability in one family is not averaged
  away by another. P3-active Nakaya outcomes remain in-sample; call a held-out-family result
  independent only after proving that its observable and source were not used to construct or
  select those inputs.

### WP8 — gate, publication, and handoff

- [ ] Build one flagless Phase 6 gate whose preflight and evaluator re-derive every obligation from
  committed evidence: freeze identity, numerical controls, R15 conservative intersection, separate
  arms, preview GPU count/provenance, all four held-out families, diagrams, reports, and evidence
  labels.
- [ ] Execute all registered negative controls and prove each named mutation occurred independently
  of the verifier it attacks.
- [ ] Run exact `npm test`; no substitute command counts as the required local check.
- [ ] Obtain a non-author closing review that states model/context provenance, independently
  re-executed checks, and explicit limits.
- [ ] Reconcile the charter, ADRs, solver specs, plan, `docs/PROGRESS.md`, `docs/HANDOFF.md`, reports,
  and user-facing evidence labels. Phase 6 changes to complete only if the artifact-derived gate
  exits zero.

## Evidence topology

```text
primary sources + currency audit
              │
              ├── held-out target freeze ───────────────┐
              │                                         │
numerical reconnaissance (non-transferable)             │
              │                                         │
              └── production protocol + ADR freeze      │
                               │                         │
              ┌────────────┬──────────┼───────────────┐  │
              │            │          │               │  │
       float64 CAK   float64 M1   matched no-dip  preview GPU
              │            │          │               │  │
              └────────────┴──────────┴──────┬────────┘  │
                                     │                  │
                         independent byte re-derivation │
                                     │                  │
                                     ├──────────────────┘
                                     │
                              flagless Phase 6 gate
```

The producer never supplies both sides of a comparison. The final gate consumes only committed
source freezes, protocol manifests, raw result artifacts, and independently derived evaluations.

## Out of scope

- Quietly redefining the registered headline to measured-only agreement.
- Amending the charter to replace GPU evidence with the CPU oracle or to defer held-out validation.
- Tuning CAK, M1, the habit thresholds, the ambiguity band, or the reference boundaries to improve
  agreement.
- Implementing M2's full facet-width-dependent policy or inventing a sub-grid width closure without
  independently sourced parameters. The planned `M1_NO_DIP_ABLATION`, if frozen by WP3 as intended,
  will use only M2's printed broad-branch functions as a matched no-dip input; it will not implement
  M2's width feedback.
- Treating a diagnostic size ladder as registered validation evidence.
- Claiming general WebGPU, Metal, or cross-architecture portability beyond executed configurations.
- Deleting or rewriting superseded evidence. Historical artifacts remain tracked and labeled.
- Beginning Phase 7 work while this gate completion is active.

## Tried and rejected

**Narrow O1b by ADR and charter amendment.** Rejected by maker direction on 2026-08-01. It would
save resources but leave the registered scientific work undone.

**Blindly execute the old N = 64 remediation.** Rejected by measurement: N = 64 fails against N =
80 at three of four registered spot-check points. Spending a full sweep there would knowingly
produce evidence that fails its own prerequisite.

**Treat N = 80 or extent 29 as adequate because a favorable habit class is stable.** Rejected.
The registered attached-count criterion still fails at sampled points, and physical size is an
observable, not a numerical refinement knob.

**Publish 3/90 and 54/90 as the registered headline.** Rejected. They are valid measured-only
counts, while ADR 0026 requires a conservative intersection that consumes grid-extrapolated
classes.

**Use the float64 CPU rows to satisfy the preview GPU clause.** Rejected. The charter names the
headless GPU harness and preview budget explicitly.

**Run the existing GPU LK v5 path as if it were CPU v6.** Rejected. V5's gather-order reduction is
not D6h-equivariant, the GPU path refuses M1 and v6 today, and binary32 cannot inherit a float64
tolerance without a derivation.

**Choose held-out targets after seeing which ones agree.** Rejected. Targets, extraction,
uncertainty, scoring, and failure handling freeze before model output is generated.

**Use Libbrecht–Arnold 2009 as held-out CAK validation.** Rejected by source currency. The later
−5 °C reanalysis says the original kinetic interpretation was largely incorrect, chamber
supersaturation was not accurately known, and CAK is assumed in the reinterpretation.

**Freeze the archive's pressure thresholds without primary reconciliation.** Rejected. Gonda and
Gomi's primary prose reports about 1.7/4.1/10.1%, while the later archive reports materially
different 2.84/5.83% values for nominally corresponding pressures. Observable definitions and
digitization must be reconciled first.

**Call a supported prescribed-history experiment a free-crystal test.** Rejected. The best exact
history found is substrate-grown and depends on rim width/step-source/asymmetric transport absent
from the solver. Takahashi is free fall but constant-environment ensemble data, not one-crystal
history. No current candidate discharges the history obligation honestly.

**Promote the cleanest levitation mass data by assigning the current seed.** Rejected. Harrison's
mass ratios and conditions are excellent, but the particles' shape and crystallography were not
observed, later work finds growth-mode transitions, and the present operator omits latent heat. A
regular D6h seed would be a sensitivity surrogate chosen by this project, not a source observation.

**Use the Takahashi 860/1010 mb ratio as a pressure tolerance.** Rejected. The two studies change
liquid-water content, temperature drift, apparatus/run population, polycrystallinity and riming at
the same time as pressure. The source observation is locked as context, with no pass interval.

**Use symmetry plus monopole matching to skip the whole-grid domain matrix.** Rejected. D6h permits
an axisymmetric quadrupole, supplies no coefficient bound for the discrete nonlinear Robin problem,
and does not establish attachment-event margins. The repository's measured non-monotone domain
response already refutes the available ratio and clearance proxies.

**Let resource exhaustion become a passing scientific result.** Rejected. Resource measurements
are reported and may trigger a maker-visible engineering redesign, but they cannot relax a frozen
criterion or turn absence of evidence into validation.

**Reject a resumed checkpoint solely because an unattached boundary cell has `f=1`.** Rejected by
the existing update arithmetic: the pre-addition attachment test may pass and binary64 addition may
then round the stored fill to exactly one. Changing the evolution to fit a decoder invariant would
alter historical results; the resume format must preserve the reachable state.

**Implement the R15 runner contract before WP3 freezes its inputs.** Rejected. Run-spec fields,
manifest schemas, policy values, symmetry derivation, checkpoint cadence and retention would become
implementation-chosen scientific controls. Only protocol-independent core checkpoint/restore work may
precede that freeze.

## Open questions

- No audited held-out family currently has both observed initial state and compatible transport.
  Harrison's latent-heat term is source-specifiable, but its crystallography is not. A matched
  experiment or source-constrained set-valued initial-state model is required before a validation
  target can freeze; an outcome-selected surrogate is forbidden.
- Pressure needs a matched-pressure experiment or original matched runs. Prescribed history needs
  either supported/asymmetric/rim physics for Harrington/Pokrifka, or sublimation/ventilation and a
  source-constrained frozen-droplet state for Magee. Until then both remain explicitly incomplete.
- What physical crystal size or size strata make the Nakaya comparison apples-to-apples with the
  selected reference? This must be sourced and frozen, not inferred from the prior ladder.
- What domain/grid/timestep configuration passes at the eventual physical sizes? WP2 measures it;
  no value is assumed here.
- Can a v6 float32 solver meet a derived, independently justified error envelope at preview scale?
  If not, the mismatch is escalated as a scientific/implementation blocker rather than waived.
- What exact wall-clock, storage, and RAM/VRAM budgets follow from the passing configuration?
  Reconnaissance records them; the maker's science-first direction determines that cost alone does
  not cancel the work.
