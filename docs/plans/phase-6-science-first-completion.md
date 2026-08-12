# Plan — Phase 6 science-first gate completion

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-01
- **Last touched:** 2026-08-03 by OpenAI Codex (maker redirect execution active)

## Goal

Complete the Phase 6 scientific gate that the 2026-08-01 external review correctly found
incomplete. The maker keeps the science-first core of open item O1b: execute the registered
conservative-intersection headline, numerical-control ladder, R15 path, and complete three-arm
float64 campaign. Decisions 0043 and 0044 move only the scientifically incompatible held-out
families and the non-parity preview-GPU work past Phase 6; decision 0042 bounds evidence hardening to
honest-execution failures. Resource cost may shape scheduling and concurrency, but it may not weaken
a retained validity criterion, substitute an unregistered configuration, or turn a missing core
comparison into prose.

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

Current accepted charter v1.21, verbatim:

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the versioned protocol freeze (item 1) makes every authorized change auditable and invalidates prior sweep evidence for the replacement gate after a post-freeze edit.

The quoted gate is reached only after all retained Phase 6 charter items that give it meaning are
discharged: source-derived physical-size strata and the full protocol freeze before new evidence;
grid, timestep, and domain controls at registered points; the R15 artifact path; the complete CAK,
M1, and `M1_NO_DIP_ABLATION` float64 campaigns; ADR 0026's conservative-intersection headline; and
separate no-SDAK/SDAK reports with evidence labels limited to executed comparisons. Decisions 0043
and 0044 make the held-out incompatibility finding and GPU deferral explicit; neither earns Phase 6
credit for work not executed.

## Governing direction

The maker's 2026-08-01 direction is binding for this work:

> O1b needs to be executed. If there is a choice between science and resource, choose science.

This supersedes ADR 0037 §5 only as a scheduling/resource decision. It does not change or erase
ADR 0037's measurements: N = 48 fails its registered domain check at three of four sampled points,
N = 64 fails against N = 80 at three of four, and no configuration tested so far satisfies every
registered numerical condition. A new accepted ADR must record this supersession and quote the
applicable charter clauses before a replacement protocol freezes. Accepted ADR 0040 and charter
v1.19 govern the coefficient/provenance correction discovered during this review; accepted ADR 0041
and charter v1.20 govern only the continuation-host CPU upgrade. Neither acceptance weakens a
scientific obligation or freezes R15. ADR 0039 remains proposed. Its
protocol-independent streamed codec and field-adopting float64 CPU restore are implemented and
reviewed, but the runner generation/publication/retry/trace contract cannot be frozen before WP3.
No runner/evidence contract becomes authoritative and no production row may use resume until ADR
0039 is accepted after that review.

The maker's 2026-08-03 direction is binding and reshapes scope. Recorded verbatim from an
interactive maker session (Claude Fable 5 recording; each numbered choice below was explicitly
selected by the maker, not inferred):

> I want protection against sloppiness, not malicious attacks on my own research. Cut to the
> chase: close Phase 6 through the final registered campaign, defer what needs deferring by
> proper ADR, and stop the review recursion.

1. **Threat model.** Phase 6 evidence infrastructure defends against accidental error, process
   crashes, and environment drift — not against a hostile author tampering with this repository on
   this host. Findings whose exploitation requires deliberate attacker action on the maker's own
   machine — Git replacement-ref/attribute-overlay/stat-cache laundering, junction and reparse
   attacks, index-hidden tampering, hostile substitution of committed worker/launcher code —
   are out of scope for Phase 6. One ADR closes that entire class by name; the finding ledgers are
   preserved as history, not dispatched individually. AGENTS.md's integrity-budget anti-rule
   governs: no new adversarial evidence machinery without a new **in-scope** attack surface.
2. **Review depth.** Each unit receives one proportionate non-author review (Rule 10 provenance
   unchanged). A blocker is a defect that could change a published number or scientific claim, or
   silently corrupt evidence; hardening suggestions are recorded, non-blocking. A unit that fails
   review twice escalates to the maker with options rather than a third rebuild. Reviews of
   reviews end.
3. **WP1.** The v4/V4.x source-search register, publisher, and control-batch apparatus is closed
   as rejected history; do not iterate it further. WP1 narrows to freezing the Nakaya-comparison
   physical size strata from the already-locked sources via the simplest reviewable deterministic
   operator, under the capped review depth.
4. **WP7.** All four held-out families are deferred past Phase 6 by ADR and charter amendment,
   with the audited incompatibility record as the Phase 6 finding and a named post-Phase-6 owner.
   This supersedes the corresponding "Out of scope" bullet below pending that ADR.
5. **WP5.** The preview-budget GPU cohort and the v6 WGSL port are deferred to Phase 7 by ADR and
   charter amendment; the float64 CPU oracle carries the Phase 6 verdict. This also supersedes the
   corresponding "Out of scope" bullet below pending that ADR.
6. **Arms.** The final campaign keeps all three arms: CAK, M1, and `M1_NO_DIP_ABLATION`.
7. **Push.** Once ADR 0041 lands canonically and exact `npm test` is green, push `main`
   (maker-authorized).

Execution checkpoint: accepted ADR 0041, its charter v1.20 amendment, and the manifest-covered host
observation landed canonically as `1ff948c`. The six exact untracked root-side V4/V4.x apparatus
source/test files were removed from live workspace discovery without byte changes and retained under
`research/tmp/recovery/wp1-v4x-root-apparatus-rejected-20260803/`. No request, acquisition, TAX2
measurement, evidence publication, control launch, or solver row ran during that closure.
After recompacting the current-state index and removing the rejected tests from live discovery,
exact `npm.cmd test` exited 0 in 674.8 seconds: Rule 7 scanned 425 files, both TypeScript projects
passed, and Vitest passed 81 files / 1,446 tests in 666.70 seconds. This is repository verification,
not Phase 6 scientific evidence.

Direction-amendment checkpoint: decisions 0042–0044 and charter v1.21 implement the maker's
2026-08-03 scope boundary. Decision 0042 closes the attacker-only finding class and caps review;
decision 0043 records the held-out incompatibility finding and assigns the deferred work to
`billatgameology`; decision 0044 assigns the v6 WGSL/preview cohort to the same owner in Phase 7 and
leaves the float64 oracle as the Phase 6 verdict path. Their acceptance record and exact landing
verification are recorded below before this unit closes.

The unit's one proportionate non-author review was OpenAI Codex `gpt-5.6-sol`, read-only, with full
shared context and no authorship. It independently checked all 19 ADR quote blocks against the
pre-amendment charter, covered all six deleted charter lines, searched the live plan for stale
attacker-only/GPU/held-out instructions, checked the three retained arms and core dependencies, and
verified the Phase 5/permanent-architecture boundary. Its first verdict found one blocker: §9 of the
live source-currency record still required Phase 6 held-out execution. After the bounded repair, the
same review engagement independently matched the 29,714-byte amended record at SHA-256
`af045438ab2e4bb0de82aea4b289388d7d2c0448322298f7ecfe4ed21e5d2563` and returned 0 blockers / 0
non-blocking suggestions. Rule 7 was clean over 428 files, the focused progress/evidence set passed
2 files / 14 tests, and `git diff --check` passed apart from line-ending warnings. Review limits: no
exact full `npm test`, solver/GPU/campaign execution, source acquisition or source-byte verifier,
rejected-apparatus inspection, finding-by-finding dispatch, or review of prior reviews.

After acceptance, exact `npm.cmd test` on the v1.21 landing candidate exited 0 in 665.9 seconds:
Rule 7 was clean over 428 files, both TypeScript projects passed, and Vitest passed 81 files / 1,446
tests in 657.56 seconds. This is repository consistency only, not a solver campaign or scientific
gate result.

The unit's single proportionate non-author review was OpenAI Codex `gpt-5.6-sol`, read-only, with
full shared thread/repository context and no authorship. It independently ran the metrics,
progress-index, and evidence-integrity suites (3 files / 46 tests), Rule 7 over 425 then-live files,
both TypeScript projects, and `git diff --check`; it also compared `crystallographicSpans()` with
Cartesian projections over 100 deterministic asymmetric sets and all 24 tested D6h transforms. It
found one blocker: live WP1/register text still instructed a cold reader to resume the rejected
apparatus. The correction replaced active WP1 with only the narrowed size-strata task, moved the
four exact register/catalog/finding records into `research/rejected/phase6-wp1-v4x/`, and reduced
the live Section 11 to a non-authorizing tombstone. The same reviewer performed one bounded
correction follow-up and reported the original blocker closed with 0 new blockers. After the
record-only authority repair, the author reran the same 3 files / 46 tests, Rule 7 over 426 files,
both typechecks, and the diff check successfully. Review limits: no repeated full `npm test`, no
inspection of individual historical findings or the rejected batch clone, no source-to-size mapping,
direction-ADR quote audit, clean checkout, or Phase 6 scientific execution.

The 2026-08-01 science-first direction stands for the core: the registered
conservative-intersection headline, the numerical-control ladder, and the three-arm production
campaign are executed, not narrowed. The 2026-08-03 direction narrows only the held-out and GPU
obligations — explicitly, by ADR and charter amendment, never silently. This partially supersedes
the 2026-08-01 rejection of "narrow O1b by ADR" recorded under Tried and rejected: that rejection
remains in force for the headline and numerics, and is lifted for WP7 and WP5 only.

**The maker's 2026-08-06 direction is binding and closes the campaign scope.** Recorded verbatim
from an interactive maker session (Claude Fable 5 recording):

> we already know the phase 6 run will not reproduce the nakaya diagram. are we doing all the
> compute just for record and completeness? I am okay if it's less than a week, but if it's
> more then we need to reevaluate

After a written options review that included the proposed Phase 8/9 drafts, the maker selected
the recommended bounded closure. Accepted decision
[0045](../decisions/0045-bound-phase6-closure-to-a-compute-week.md) and charter v1.22 enact it:
all remaining Phase 6 computation fits a seven-wall-clock-day envelope on the recorded host. The
WP2 ladder executes budget-capped with its no-pass branch first-class, and **no production
selection follows a pass** — stated in advance so the ladder's result cannot be outcome-shopped.
ADR 0026's conservative-intersection headline, WP4's R15 production path, and WP6's three-arm
campaign **close at measured-only grade**, stated in every report as *not computed by decision
0045*, never as satisfied. One addition executes inside the envelope: a 204-point measured-only
`M1_NO_DIP_ABLATION` sweep identical to the executed arm-2 configuration in every registered
respect except `paramSet`, so the three arms are same-protocol comparable. WP2's reconnaissance
Stage B (the ≤ 36-run three-arm matrix) is closed unexecuted — its purpose was ladder-axis
freezing for a production campaign that no longer runs; Stage A completes as the ladder's cost
input. WP3 shrinks to recording the closure in the gated values manifest (the arm-3 registration
mirroring arm 2's schema; both historical manifests byte-identical). WP8's gate re-derives the
amended obligation set per decision 0045. This supersedes the 2026-08-01 direction's remaining
application to the headline and campaign; the strata freeze, the budget-capped ladder, honest
labels, and every retained validity criterion stand.

**Maker clarification, 2026-08-07, verbatim:** "we have already committed to this plan, if
it's not perfectly done is 7 days, it's fine. let's focus on getting it done as efficiently as
possible while maintaining science, accuracy, and record keeping at highest priority." The
envelope bounds scope, not correctness: a unit that needs an extra day to be done right takes
the extra day; no validity criterion, label, or record is ever traded for the calendar.

The maker's 2026-08-02 sequencing direction is also binding: **freeze all further education-site
work until Phase 6 is complete.** The landing page carries a prominent warning that the course is
not the authoritative status or validation record. Preserve the current `docs/education/**` work
exactly as commit `60e3f3f`; do not polish its prose, repair Chapter 16, regenerate its
figures, run its visual matrix, or spend Phase 6 resources extending its verifier. The prior
education checks remain historical checks of earlier candidate bytes, not acceptance of the frozen
current tree. Education repair and its adversarial acceptance review move to a post-Phase-6
reconciliation step. This scheduling change does not remove, weaken, or substitute for any Phase 6
scientific obligation.

## Approach

Work proceeds through independently reviewable freezes. No expensive evidence campaign starts
until its inputs, evaluator, negative controls, output schema, resource estimate, and termination
rules are committed and receive their one proportionate non-author review. Reconnaissance may
measure cost or discriminate between predeclared numerical configurations, but it is stamped
non-transferable and cannot enter a gate result.

Unattended execution is resumable by construction. Before any long task, update `docs/PROGRESS.md`
with the exact resume point; update `docs/HANDOFF.md` only when the maker explicitly requests a
stop/restart handoff. Run only from a tracked-clean committed source
snapshot; write separate labeled live/error/exit logs; publish useful generated science under the
tracked `evidence/` manifest boundary; and, after ADR 0039 is implemented, use immutable
cycle-boundary generations rather than relying on one process surviving. Maker-facing status is at
normal development cadence; only an actually running 2+ hour script or campaign reduces unsolicited
status to at most hourly unless requested.

The Phase 6 result stays anchored to the float64 CPU oracle and the D6h-equivariant
`aggregate-hv-g1h1-v6` policy. Decision 0044 moves the separately reported preview-budget GPU cohort
to its named Phase 7 work package; before that cohort runs, WGSL must implement the same registered
surface policy and a binary32-appropriate convergence rule must be derived and validated against
float64. The current v5-only, gather-order path cannot be treated as equivalent to v6 or counted in
Phase 6.

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
  This step does **not** freeze the R15 protocol: its values/protocol hash waits for WP1's
  source-derived physical-size strata and WP2 numerical inputs.
- [x] Run the first WP0 landing checks. Exact `npm.cmd test` exited 0 in 723.7 seconds (Rule 7 clean
  over 415 files, both TypeScript projects green, 78 Vitest files / 1,394 tests in 713.98 seconds).
  The complete public/offline education verifier passed 213 checks as recorded above. These are
  historical checks of the earlier candidate bytes; they do not close the later metrology repair,
  satisfy WP8's future final-gate verification, or discharge any R15 evidence obligation.
- [x] Freeze the education site under the maker's 2026-08-02 sequencing direction and add a visible
  non-authoritative-status notice to its landing page. The completed verifier and visual-QA results
  above describe earlier candidate bytes; later Chapter 16/provenance edits reopened acceptance and
  are preserved in commit `60e3f3f` as deferred work-in-progress. No further education content, figure, visual-QA, or
  verifier work is on the Phase 6 critical path. Reconcile and independently review the entire site
  only after Phase 6 closes.
- [x] Close ADR 0040's acceptance-audit follow-up. The implementation and authority records now
  classify the exact Boltzmann constant, Celsius/kelvin offset, and standard-atmosphere conversion
  as P1 authoritative definitions, their binary64 representation as P4 precision policy, and the
  exact-atmosphere `D_air` anchor as a P2 project closure. Independently review those final bytes and
  the new 50,464-byte table pin, run focused non-education checks plus exact `npm test`, then commit
  this non-education WP0 unit without touching either legacy manifest or the frozen
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
  passes 7/7. Landed as `7a60eaf` and was later included in the maker-pushed restart baseline
  through `cd54b3e`.
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

### WP1 — freeze Nakaya-comparison physical-size strata from locked sources

- [x] Complete the Phase 6 source-currency audit and preserve the five-file/21-member candidate lock
  with all 16 reconciled levitation traces. The lock remains `passEligible=false`; its audited result
  is that no current held-out family is apples-to-apples with the implemented geometry and transport
  physics. The maker directs that finding into the post-Phase-6 held-out deferral ADR rather than a
  new Phase 6 source search.
- [x] Close the V4/V4.x source-search register, publisher, and control-batch apparatus as rejected
  history. Its exact last live-path register/catalog/finding bytes are retained under
  `research/rejected/phase6-wp1-v4x/`; its exact source/test bytes remain under
  `research/tmp/recovery/wp1-v4x-root-apparatus-rejected-20260803/` and the isolated batch clone.
  Embedded future-tense instructions and open-finding states in those historical bytes have no
  current authority. No request, import, TAX2 measurement, publication, or solver row executed.
- [x] Write a new bounded plan for the narrowed task before implementation. It may consume only
  already-locked source observations and uncertainties, never model morphology output, a new
  literature search, or the rejected TAX2 apparatus. Freeze the simplest deterministic operator
  that maps the source record to one or more Nakaya-comparison physical-size strata plus explicit
  uncertainty/refusal outcomes; define how each stratum maps to physical seed size without choosing
  a numerically or morphologically favorable result. Completed 2026-08-06 under
  [phase-6-wp1-size-strata.md](phase-6-wp1-size-strata.md): `runner/src/phase6-size-strata.ts`
  consumes only the hash-pinned candidate lock and emits the frozen
  `evidence/phase6-size-strata/strata.json` (18,867 bytes, SHA-256 `aba93698…d0288b6`) — stratum
  S1 observed initial radius `[5.8999999999999995, 12.1]` µm over the 15 uncontested traces
  (`716d` echoed, flagged, excluded per the lock's unresolved-mismatch pin), stratum S2 grown
  mass-equivalent radius at 300 s `[9.472732790460505, 20.459585775743665]` µm under a declared
  uniform-density closure whose central values are floors on half the true maximum dimension,
  warm mass anchor W1 with a length-conversion refusal, seven refusals, and declared
  condition-domain/size-scale extrapolations. S1 maps directly to physical seed size; S2 is a
  grown measurement size seeded from the same trace family; the lattice mapping and Z choice
  belong to WP2/WP3.
- [x] Obtain one proportionate non-author review of that operator and its source operands before
  freezing any numeric stratum. If the unit fails twice, escalate options to the maker rather than
  rebuilding a third time. Publish only the reviewed freeze and exact operands needed by WP2.
  Completed as a single three-round engagement (fresh-context non-author reviewer; read-only;
  different-model status not established and recorded conservatively per Rule 10 in the WP1
  plan's Review record): round 1 found two blockers (the contested `716d` radius set the S1
  floor; an unsourced "~0.1–3 mm" Nakaya size claim), round 2 verified both repairs by
  independent out-of-repo experiments and found one plan-text blocker plus a required Rule 10
  provenance correction, round 3 CONFIRMED with 0 open blockers. 266 + 156 independently
  recomputed values, all bit-exact. Exact `npm.cmd test` on the frozen tree exited 0 (Rule 7
  clean over 436 files; both TypeScript projects; Vitest 82 files / 1,454 tests in 628.68 s).

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
  cleared only core design; runner acceptance still waits for WP3, and at that checkpoint the WP0
  dependency still preceded implementation. Cold-start reconnaissance remains non-transferable.
- [x] Implement and verify decision 0039's protocol-independent stream codec and field-adopting
  solver restore, including frozen legacy byte fixtures, cross-family rejection and exact
  direct/checkpoint-every-cycle/multiply-resumed CAK and M1 equality. The implementation lineage is
  `557d1de`, `c595b55`, and `a1d540c`. It adds `core/src/lk-resume-checkpoint.ts`, leaves the legacy
  codec bytes/readers frozen, and lets `LKSolver.fromResumeStateV3` consume decoder-owned fields and
  independently validated topology exactly once. Review found and fixed a Proxy-forgeable symbol
  constructor capability through WeakMap identity branding, then reproduced and closed a public
  encode/decode asymmetry for degenerate monopole shells. Three zero-radius geometries now fail
  before the first sink write; an independently framed hostile checkpoint remains decoder-rejected;
  the minimum nondegenerate shell round-trips with finite positive radii.

  A durable, **test-only and non-transferable** 12×12×9 CAK/M1 regression executes nine converged
  cycles at 34–75 sweeps/cycle, covers odd and even sweep parity, noise, nonzero monopole lag,
  attachments, saturation clipping, M1 hole fill at cycle 8, and exact continuation through cycle
  9. Direct, every-cycle-restored, and multiply resumed reports, complete state, topology/order,
  ledgers, and checkpoint bytes match exactly. The two final read-only OpenAI `gpt-5.6-sol` ultra
  non-author reviews reported 0 blockers after independently executing the focused 22-test core and
  16-test solver suites; the multi-sweep reviewer requested the non-transferable wording now
  recorded here. Their limits exclude production-size memory, hostile mutation beyond the
  registered trust boundary, runner crash recovery, R15, GPU, and held-out science. Exact
  `npm.cmd test` at `a1d540c` exited 0 in 735.3 seconds: Rule 7 clean over 419 files, both TypeScript
  projects green, and 81 Vitest files / 1,442 tests passed in 725.30 seconds. This completes only
  the protocol-independent core unit; ADR 0039 and its WP3-dependent runner layer remain proposed.
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
- [ ] **Pre-register the deterministic numerical-control ladder.** After WP1 freezes exact
  source-derived physical-size strata, commit and independently review the control protocol before
  any transferable row runs. Freeze the exact arms/points, rational spacing rungs, domain
  increments, timestep halvings, relaxation controls, physical-seed mappings and sensitivities,
  starting rungs, escalation order, acceptance criteria, exhaustion/no-pass consequence, raw key
  set, binary64 schema, immutable execution provenance, and the deterministic function that selects
  one production configuration or returns no-pass. Reconnaissance may inform the candidate ladder
  but cannot satisfy it.
- [ ] **Execute the registered numerical-control ladder.** At each physical size and spacing,
  expand the far boundary until two successive registered increments pass; execute the whole
  204-point domain matrix for every arm/spacing/size unless an independently reviewed bound covers
  omissions; use at least three spacings plus ADR 0026's conditional fourth; halve the interface
  timestep at registered points; test relaxation caps/tolerances; and run seed-mapping sensitivity.
  Preserve every rung under `evidence/` and apply only the pre-registered numerical criteria and
  selection function. Morphology agreement may not choose a rung. If the ladder exhausts, publish
  that numerical blocker; any extension requires a new reviewed pre-registration.
- [ ] **Publish the artifact-derived numerical-control result.** Independent recomputation derives
  either the exact selected spacing/domain/timestep/relaxation/seed configuration or no-pass from
  the registered bytes. These rows are numerical-control evidence only and are not recycled into
  R15 production morphology evidence.

The dependency is therefore: WP1 source-derived sizes → non-transferable reconnaissance → reviewed
control-ladder pre-registration → registered control execution → independently selected
configuration or no-pass → WP3 production binding → fresh R15 production execution.

### WP3 — decision and protocol freeze

- [ ] Accept an ADR that records the maker's science-first direction, supersedes ADR 0037 §5's
  no-re-sweep scheduling decision, quotes every affected/no-impact charter clause, and preserves
  ADR 0037's negative evidence.
- [ ] Amend the Phase 6 protocol through the charter's existing post-freeze mechanism. The amendment
  must name all sizes, grid spacings, physical domains, timestep controls, the float64 CPU role,
  exact run counts, uncertainty operators, engine versions, environment policy, and failure
  consequences. It records decisions 0043–0044's held-out/GPU deferrals rather than inventing
  targets or GPU rows.
- [ ] **Bind, do not choose, the production configuration.** Hash-bind the reviewed WP2
  pre-registration and its independently recomputed control artifact. The replacement ADR and
  protocol may bind only the exact configuration selected by the pre-registered function; no author
  or reviewer may choose among passing rungs after seeing morphology outcomes. If WP2 returned
  no-pass, WP3 cannot freeze production. Pre-freeze reconnaissance never satisfies a Phase 6
  numerical obligation.
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
- [ ] Add a preflight that proves every frozen row reaches every spawned CPU invocation and is
  echoed into each result.
- [ ] Execute production children from one tracked-clean committed source snapshot. Record the exact
  argv, allow-listed environment, source commit, package manifests, lockfile, and resolved workspace
  modules used by each child, and refuse accidental source/environment drift between launches.
- [ ] Subject the ADR, source freeze, protocol, cost model, and expected-result statement to a
  single proportionate non-author review under decision 0042. Resolve blockers before any
  production row runs; record non-blocking hardening suggestions without rebuilding around them.

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

### WP5 — preview GPU work deferred to Phase 7

- [x] Decision 0044 and charter v1.21 move the v6 WGSL port, binary32 convergence/error envelope,
  adversarial oracle comparison, and preview-budget cohort out of the Phase 6 gate. Owner:
  `billatgameology`, through the named Phase 7 GPU-parity work package.
- [x] Preserve the carried scope: at least 200 automated preview-budget runs, intended as all 204
  points for CAK, M1, and `M1_NO_DIP_ABLATION` (612 total) unless a pre-run ADR registers a
  scientifically stronger design. The future GPU report remains separate from the Phase 6 float64
  headline. No Phase 6 CPU row, v5 GPU row, or Phase 5 artifact satisfies that deferred work.

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

### WP7 — held-out validation deferred past Phase 6

- [x] Decision 0043 and charter v1.21 accept the audited `passEligible=false` incompatibility as the
  Phase 6 finding and move growth-rate, size-dependent-habit, pressure-dependence, and
  growth-history execution to the named Phase 7 held-out-validation work package. Owner:
  `billatgameology`.
- [x] Preserve the four families as separate post-Phase-6 obligations. Each future freeze must make
  geometry, conditions, transport physics, observable, uncertainty, and scoring apples-to-apples or
  record continued non-comparability. No near-match score, invented crystallography, P3-active
  Nakaya result, or absence of a target earns held-out validation credit.

### WP8 — gate, publication, and handoff

- [ ] Build one flagless Phase 6 gate whose preflight and evaluator re-derive every obligation from
  committed evidence: freeze identity, source-derived size strata, numerical controls, R15
  conservative intersection, all three separate float64 arms, diagrams, reports, evidence labels,
  and the decision-0043/0044 deferral records. It verifies the deferrals without pretending the
  deferred executions are gate evidence.
- [ ] Execute all registered negative controls and prove each named mutation occurred independently
  of the verifier it attacks.
- [ ] Run exact `npm test`; no substitute command counts as the required local check.
- [ ] Obtain the gate unit's one proportionate non-author review under decision 0042. It states
  model/context provenance, independently re-executed checks, explicit limits, and separates
  blockers from non-blocking hardening suggestions.
- [ ] Reconcile the charter, ADRs, solver specs, plan, `docs/PROGRESS.md`, reports, and user-facing
  evidence labels. Reconcile `docs/HANDOFF.md` only if the maker requests a stop/restart handoff.
  Phase 6 changes to complete only if the artifact-derived gate exits zero.

## Evidence topology

```text
locked sources → size-strata freeze → registered numerical controls
                                             │
                                  production protocol + ADR freeze
                                             │
                         ┌───────────────────┼────────────────────┐
                         │                   │                    │
                    float64 CAK         float64 M1     matched no-dip
                         │                   │                    │
                         └───────────────────┼────────────────────┘
                                             │
                              independent byte re-derivation
                                             │
                                  flagless Phase 6 gate

held-out candidate lock → audited incompatibility → Phase 7 owner (reported, not scored)
v5/v6 GPU mismatch     → decision 0044         → Phase 7 owner (not a Phase 6 input)
```

The producer never supplies both sides of a comparison. The final gate consumes only committed
source freezes, protocol manifests, raw result artifacts, and independently derived evaluations.

## Out of scope

- Quietly redefining the registered headline to measured-only agreement.
- Reopening the decision-0043/0044 deferrals inside Phase 6 or treating them as executed evidence.
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

**Narrow O1b wholesale by ADR and charter amendment.** Rejected by maker direction on 2026-08-01.
The 2026-08-03 direction partially supersedes that scheduling choice for two obligations only:
decisions 0043 and 0044 defer scientifically incompatible held-out work and the non-parity GPU
cohort. The conservative-intersection headline, numerical ladder, R15, and three-arm float64
campaign remain in full. **Superseded further on 2026-08-06 by decision 0045:** the maker's
bounded-closure direction closes the headline, R15 production path, and campaign at
measured-only grade; the ladder still executes, budget-capped, with no-pass first-class.

**Blindly execute the old N = 64 remediation.** Rejected by measurement: N = 64 fails against N =
80 at three of four registered spot-check points. Spending a full sweep there would knowingly
produce evidence that fails its own prerequisite.

**Treat N = 80 or extent 29 as adequate because a favorable habit class is stable.** Rejected.
The registered attached-count criterion still fails at sampled points, and physical size is an
observable, not a numerical refinement knob.

**Publish 3/90 and 54/90 as the registered headline.** Rejected. They are valid measured-only
counts, while ADR 0026 requires a conservative intersection that consumes grid-extrapolated
classes.

**Use float64 CPU rows as if they were preview-GPU rows.** Rejected. Decision 0044 moves the GPU
cohort to Phase 7; it does not convert CPU artifacts into GPU evidence.

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

- Deferred, non-blocking for Phase 6: no audited held-out family currently has both observed initial
  state and compatible transport. Decision 0043 assigns resolution of the crystallography,
  latent-heat, pressure, support/asymmetry, sublimation, and ventilation gaps to
  `billatgameology`'s Phase 7 held-out-validation work package; outcome-selected surrogates remain
  forbidden.
- What physical crystal size or size strata make the Nakaya comparison apples-to-apples with the
  selected reference? This must be sourced and frozen, not inferred from the prior ladder.
- What domain/grid/timestep configuration passes at the eventual physical sizes? WP2 measures it;
  no value is assumed here.
- Deferred, non-blocking for Phase 6: can a v6 float32 solver meet a derived, independently
  justified error envelope at preview scale? Decision 0044 assigns that test to
  `billatgameology`'s Phase 7 GPU-parity work package.
  If not, the mismatch is escalated as a scientific/implementation blocker rather than waived.
- What exact wall-clock, storage, and RAM/VRAM budgets follow from the passing configuration?
  Reconnaissance records them; the maker's science-first direction determines that cost alone does
  not cancel the work.
