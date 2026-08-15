# Plan — Phase 8: What is real — the reconciled laboratory target book

- **Phase:** Phase 8 — Cross-laboratory evidence reconciliation
- **Status:** complete under accepted decision 0046 and charter v1.23; S0-S6 are complete and the
  final frozen artifact passed the required non-author review with zero unresolved blockers.
  Phase 8 executed concurrently with Phase 6 in an isolated worktree; Phase 7 has no Phase 6/8
  completion dependency but still requires its own plan before it starts.
- **Started:** 2026-08-04 (drafted)
- **Last touched:** 2026-08-10 by OpenAI Codex — Phase 8 completed

## Goal

Phase 6 compared one model class against one ruler and both sides were weaker than assumed: the
model was missing load-bearing physics, and the ruler — a single digitized morphology diagram
scored by final aspect ratio — is contradicted between laboratories, protocol-dependent, and
criticized as a habit metric by its own sources. Before Phase 9 modeling, this phase turns
the full multi-laboratory record now in `research/` (Libbrecht corpus **plus** Takahashi/Fukuta
free-fall, Nelson sublimation, Bacon–Baker–Swanson levitation, Bailey–Hallett cold-end,
Harrison/Pokrifka/Harrington levitation-mass lineage) into a graded, protocol-tagged,
machine-readable **target book**: what is established, by whom, under what protocol, with what
uncertainty — and where the laboratories genuinely disagree. Phase 9 scores models against this
book instead of against any single diagram. This source-curation work does not depend on Phase 6
closing or on Phase 7 executing; incomplete Phase 6 results and all Phase 7 work remain outside its
evidence chain.

## Done when

Charter v1.23 milestone, verbatim:

> Done when every target in the book carries (a) a page-cited extraction line in a tracked research index, (b) protocol tags (seed, pressure, geometry, supersaturation semantics and uncertainty, growth history, ensemble semantics), (c) a robustness class where Class A requires at least two independent witnesses, (d) an inputs-vs-targets flag, and (e) membership in a pre-registered held-out split — and the frozen, hashed book passes one proportionate non-author review with zero unresolved blockers.

## Approach

Curation as registered science, not as a reading list. Everything follows the Phase 6 evidence
discipline that already exists: exact numeric transcriptions or brief verbatim quotations with page
cites, no value read off a plotted
curve without being flagged as a digitization with read uncertainty, deterministic registered
operators for anything derived, content hashes, and in-sample classification per ADR 0005. The
book extends — never replaces — `research/lab-validation-dataset.md`/`.jsonl` (122 entries,
graded, `passEligible=false`), which stays byte-unchanged as the historical Libbrecht-scoped
index.

### Sequencing and isolation

The maker directed on 2026-08-10 that Phase 8 proceed in parallel with Phase 6 and that Phase 7
be completely standalone from both Phase 6 and Phase 8 completion. Accepted decision 0046 and the
matching charter v1.23 amendment complete S-1 and authorize S0 under these boundaries:

- Phase 8 runs in its own worktree and branch. Phase 6 worktrees, live processes, frozen protocol,
  `evidence/phase6-*`, plans, reports, and gate machinery are read-only to this phase. S-1 has one
  bounded authority exception: reconcile the Phase 6 plan's superseded Phase 7 scheduling text and
  its pre-decision-0045 Goal/Done-when summary; after adoption, that plan is read-only again.
- Phase 8 performs no solver run and consumes no material CPU capacity on the Phase 6 evidence host
  while a timing-sensitive row is active. No verification exemption is created: every non-exempt
  Phase 8 change runs exact `npm test` on a separate host, plus the checks its scope requires.
- Phase 8 may read already-published Phase 6 records only with their existing evidence labels and
  limits. It may not cite an incomplete Phase 6 result as established, change a Phase 6 obligation,
  or earn Phase 6 gate credit.
- Phase 7 neither blocks nor supplies Phase 8. Decision 0046 also removes Phase 7's former
  Phase 6 completion dependency, but does not start Phase 7; its own committed plan and isolated
  worktree remain prerequisites.
- Before the Phase 8 book freezes, changes on `main` that affect a cited source, provenance class,
  or shared research record are reconciled into this worktree and the affected extraction or class
  assignment is rechecked. Parallelism never licenses a stale freeze.
- `docs/PROGRESS.md` remains one live index. Before every Phase 8 state-record commit, reconcile
  its current `origin/main` version, preserve the Phase 6 lane, and apply only the Phase 8 delta;
  never overwrite it wholesale from this branch's older snapshot.

This exception authorizes Phase 8 only. It does not start Phase 9 or Phase 10 and does not create a
general permission to overlap charter phases.

Three organizing rules:

1. **Inputs ≠ targets.** Libbrecht's Hertz–Knudsen attachment-coefficient (`alphaHK`)
   measurements are what the model's kinetics are fitted
   from; they can calibrate but never validate. The free-fall and levitation datasets are the
   candidate validation targets. TAX2's 206 needle panels stay in-sample for M1 (ADR 0005).
2. **Prefer supersaturation-free observables.** The labs disagree most about σ calibration.
   Observables that cancel it — Pokrifka's power exponent P, mass-law exponents, scaled
   trajectories, boundary temperatures at water saturation — are first-class targets.
3. **Disagreements are recorded, not averaged.** A Class C entry carries each position as an exact
   numeric transcription or source-faithful paraphrase backed by a page/archive/data-located
   extraction, plus an operational protocol-based reconciliation hypothesis. Rights-conscious
   traceability does not require reproducing substantial source expression.

### Robustness classes (audited S3 assignments)

- **Class A — multiply witnessed under the charter's different-laboratory AND different-method
  rule:** only the conditional diffusion scaling (Takahashi isometric mass proportional to
  time^1.5 plus Bacon spherical-equivalent radius proportional to time^0.5). The mapping remains
  conditional on constant density and isometric/spherical-equivalent geometry.
- **Class B — single-lab or protocol-bound:** all other 15 targets and both inputs. In particular,
  Bacon's seed/history result is one levitation laboratory; the exact −4.0 and −8.1 °C Hokkaido
  category boundaries overlap the Nakaya-informed M1 tuning lineage and are model-development
  diagnostics; Libbrecht's near-rate equality at −8 °C is context, not a second located boundary;
  and the unmatched Libbrecht/Penn fitted-coefficient inventories do not establish a conflict.
- **Class C — standing disagreements:** none is frozen from the currently adequate source bytes.
  The Bailey cold-end current-lineage position awaits local 2004/2009/2012 governing bytes and
  page extraction. The coefficient lineages await a matched common inversion quantity and an
  operational discrepancy measure. Neither gap is converted into false consensus or a hypothesis
  that the frozen evidence cannot test.

## Steps

- [x] **S-1 — Charter and isolate the phase.** Accepted decision 0046, amended the charter's
  sequential phase rule, added the Phase 8 milestone, updated `docs/PROGRESS.md` to show the two
  independent active lanes, and recorded the isolated worktree/territory boundary above. Check: the authority
  records agree; `git diff --check`, Rule 7, the focused progress test, and exact `npm test` pass;
  no Phase 6 artifact, process, report, or gate file changed, and the Phase 6 plan diff is limited
  to reconciling decision 0045's closure summary and decision 0046's scheduling boundary.
- [x] **S0 — Extraction indexes for the non-Libbrecht corpus.** One tracked
  `research/<paper>.md` per source (takahashi-fukuta-1988, takahashi-1991 + corrigendum,
  nelson-1998, bailey-hallett-2002, bacon-baker-swanson-2003, harrison-2016, pokrifka-2020,
  harrington-pokrifka-2026 archive), in the style of `libbrecht-papers-extracts.md`: every
  number destined for the book transcribed exactly with a page cite or exact archive/data-member
  locator, as applicable, while surrounding wording is
  paraphrased unless a brief quotation is necessary; plotted-only quantities listed
  as digitizable with axes described and **no value invented**; Takahashi table bodies are
  image-only in our scans — any transcription is a digitization task with recorded read
  uncertainty. Check: all eight indexes now record byte identity, currency, rights, protocol, and
  digitization limits, plus page/visual checks where page bytes were available or complete
  archive-member scans otherwise; every book reference resolves to exactly one anchor. Takahashi
  raster tables and plotted coordinates remain undigitized.
- [x] **S1 — σ-semantics normalization.** Every target's supersaturation classified
  (ice-relative σ∞ / σ_surf / at-water-saturation / chamber-calibrated) with stated
  uncertainty, under the convention pinned from `1211.5555v1` p. 2. The Harrison→Pokrifka
  calibration revision recorded on both datasets. Check: the strict parser rejects unknown
  semantics and invented numeric values for water-saturation, mixed-source, or unreported fields;
  the Harrison→Pokrifka revision is explicit.
- [x] **S2 — Protocol tags.** Seed (frozen droplet / frost seed / e-needle / substrate prism /
  filament), pressure, transport geometry (free-fall + ventilation / static chamber /
  levitated), history (constant, ramp, fast-start), substrate interaction status, ensemble
  semantics (selected specimens vs population statistics). Check: the schema requires every field
  on every entry and rejects missing/shifted keys; mixed protocols retain source-specific detail.
- [x] **S3 — Class assignment with witness lists.** Class A demands ≥2 independent witnesses
  (different lab AND different method); any Class C entry must carry two locator-backed, distinct
  positions plus an operationally testable hypothesis. Check: executable negative controls reject
  a same-lab pressure pair as Class A and reject Class C without two positions/hypothesis; the
  revised target classes are A=1, B=15, C=0, and both inputs are Class B. The first review's
  overclassifications were removed rather than defended.
- [x] **S4 — Inputs-vs-targets partition.** Explicit flag per entry; the Libbrecht
  attachment-coefficient (`alphaHK`) lineage
  marked input; ADR 0005 in-sample markings carried over; candidate held-out entries named.
  Check: 7 targets are held out, 5 are model development, 4 are out of model, and both inputs are
  in-sample/not-scoreable/not-applicable. A fail-closed guard additionally requires explicit
  non-use of Penn fitted coefficient/transition inputs for the three Penn direct/derived traces to
  retain held-out eligibility; the parser enforces the disjoint role/split and leakage rules.
- [x] **S5 — Registered derived-observable operators.** Deterministic specs (with test
  vectors) for: mass-law exponent fit, P exponent, scaled-trajectory comparison, and
  boundary-temperature extraction — the Phase 6 lesson that unregistered operators
  (agreement scoring, grid extrapolation) become disputes is not repeated. Check: each
  operator has a spec, an implementation, and passing fixtures before any model output is
  scored with it. Check: `docs/target-book-observables.md`,
  `core/src/target-observables.ts`, and twenty-six independent tests cover exact limits, unit
  invariance, interpolation, and invalid controls; operators refuse window selection and
  extrapolation.
- [x] **S6 — Freeze, split, review.** Hash the book; pre-register the held-out split (which
  entries Phase 9 may tune against vs may only confront); one proportionate non-author review
  per the 2026-08-03 direction. Final check:
  `research/phase8-target-book.jsonl` has 18 entries, 59,019 bytes, SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`.
  The 9,930-byte report has SHA-256
  `02950ac06a95a1b06e8466c716e9d9a9b705a1443e88d90dae6d5a8cf8090712`; the 4,434-byte
  freeze has SHA-256
  `f9a5f4ee1f75c3038c2c051fe27ea68ee3f11f38f14d6ac6770604dd65e3b158` and pins the
  book, report, eight cited source indexes, three supporting
  records (Bailey precursor audit, current Libbrecht currency audit, operand provenance),
  registered data, historical extension, operators, verifier, and split. The required review
  accepted these bytes with zero unresolved blockers; its report-only final-status transfer check
  also returned zero blockers.

## Out of scope

- No solver runs, no model or parameter changes, no scoring of any model output.
- No Phase 7 work, dependency, artifact, or completion credit; Phase 7 remains its own track.
- No resolution of Class C disagreements by averaging, majority vote, or preference for any
  single laboratory.
- No adoption of TAX2/TAX1 needle matrices as held-out validation (in-sample per ADR 0005;
  needle-seeded protocol besides).
- No re-litigation of Phase 6 WP1's locked Nakaya strata — the book references them.
- Polycrystalline and rimed-crystal targets are recorded (they dominate parts of parameter
  space) but flagged out-of-model-class; the scope statement itself is Phase 10 work.

## Open questions resolved in S0

- Takahashi's image-only tables are deferred until a Phase 9 arm needs named cells. The tracked
  indexes inventory them but do not transcribe a table body or invent read uncertainty.
- Bacon's index uses paraphrase plus two brief attributed quotations (19 words total) and
  reproduces no figure, photograph, or table. Any broader reuse needs a separate rights decision.
- Bailey's audited precursor remains a pinned source gap, not a current-lineage machine target.
  The governing 2004/2009/2012 bytes and page extractions are a prerequisite to freezing that
  directional or quantitative disagreement in a later book version.
- Education stays outside Phase 8. No education file or frozen Phase 6 education artifact changed;
  a later maker decision may choose whether to mirror this source list.

## S6 non-author review record

### Round 1 — five blockers, candidate rejected and repaired

- **Reviewer provenance/context:** OpenAI Codex subagent; the service did not expose a more exact
  model identifier. The reviewer received a bounded review brief and repository instructions with
  no fork of the author conversation (`fork_turns: none`), shared only the working directory, and
  received candidate-hash updates from the author. It modified no files.
- **Independently re-executed:** `node runner/src/phase8-verify.ts`; the 19-test operator/schema
  focus; the 7-test evidence-integrity suite; `npm run lint:rule7`; cached diff/attribute checks;
  nine-index byte/count hashes; and the complete five-source historical lock. It rendered and
  visually checked the load-bearing Pokrifka Eq. 10 and Eq. 14 pages. The rejected candidate was
  59,998 bytes with SHA-256 `d8626650…4dc7`; its 3,909-byte freeze was `45ceb2f5…87a4`.
- **Blockers found:** locator-free paraphrase anchors did not discharge the extraction protocol;
  the Bailey cold witness was explicitly not a local extraction; category and Penn-fit leakage
  made the held-out partition fail open; the two Class-C hypotheses were not operational; and the
  nine-index rights/currency census overclaimed the legacy Libbrecht index.
- **Repairs:** source verification now requires a page/archive/data-located extraction for every
  entry and every witness; the unsupported cold entry was removed and Bailey pinned as a source
  gap; M4/M8 moved to model development, Bacon became a single-lab Class-B target, and a Penn
  non-use guard became executable; the unmatched coefficient record was downgraded to Class B;
  and the report now distinguishes the eight new rights-audited indexes from the legacy corpus and
  pins the separate currency/provenance records. Supplemental classification audit also removed
  unsupported `100000 Pa` values, corrected the ventilation wording/temperature, and added direct
  pressure-confound anchors.
- **Evidence limits:** the reviewer did not run exact full `npm test`, a solver/evidence-production
  run, or a legal rights assessment; it did not compare every paraphrase against every source page
  or acquire the governing Bailey 2004/2009/2012 bytes. Its operator check did not audit all
  scientific claims. Those limits are not upgraded by the author-side repair.

### Round 2 — zero blockers, final freeze accepted

- **Reviewer provenance/context:** OpenAI Codex subagent in the GPT-5 family; the exact served
  identifier was unavailable. It again received no author-conversation fork, only the bounded
  review brief, repository/developer instructions, live identity updates, and the shared working
  directory. It used no subagent and modified no file.
- **Exact reviewed artifact:** the accepted machine book is 59,019 bytes with SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`. The reviewer first
  accepted the 9,944-byte candidate report/freeze, then independently proved that the final delta
  changed only two report-status phrases and the corresponding report pin. It confirmed transfer
  to the final 9,930-byte report and 4,434-byte freeze identities recorded in S6 above.
- **Independently re-executed:** the Phase 8 verifier; 26 operator tests, 17 schema/freeze tests,
  and 7 evidence-integrity tests; both TypeScript projects; Rule 7 over 506 files; cached diff and
  26-path stage-0 byte checks; manifest verification; the complete five-source historical lock;
  nine local source byte/count identities; and visual inspection of the Pokrifka Eq. 10/Eq. 14
  pages. Its final report-only transfer reran the verifier, 17 schema/freeze tests, Rule 7, the
  cached diff check, and independent freeze-delta/pin/manifest censuses.
- **Verdict:** zero unresolved blockers. The reviewer explicitly closed locator coverage, the
  Bailey source gap, split/leakage classification, unsupported Class C claims, rights/currency
  census accuracy, exact-numeric anchors, verifier dependency closure, stage-0 binding, numerical
  edge cases, media exclusion, and the no-validation/no-solver scope.
- **Evidence limits:** it did not run exact full `TMPDIR=/private/tmp npm test`, a solver, model
  scoring, or a Phase 9 leakage decision; make a legal rights determination; reread every
  paraphrase against every source page; reproduce the full legacy Libbrecht audit; simulate a
  Windows checkout; or acquire the missing Bailey 2004/2009/2012 bytes. The final transfer did not
  repeat unchanged source, operator, or typecheck work after proving the delta was report-only.

### Supplemental read-only audits

- A shared-context GPT-5 technical reviewer found and drove repairs for range/cancellation defects
  in the four derived operators, then returned zero blockers on the exact accepted book and
  pre-status freeze. It re-executed 50 focused tests, typecheck, Rule 7, verifier/diff/index checks,
  visual Eq. 10/Eq. 14 inspection, and 30,003 exact-rational interpolation comparisons; it did not
  run full `npm test`, solver/scoring work, a full source/legal audit, or a BigInt performance run.
- A shared-context GPT-5 classification reviewer audited the revised claims, splits, witness
  classes, and all then-current source-reference occurrences and returned zero classification
  blockers. It did not reopen source PDFs, run exact full `npm test`, execute a solver/scorer, or
  repeat the legal/source-currency audit. These supplemental reviews informed repairs but did not
  substitute for Round 2's required independent acceptance.

## Tried and rejected

- **Scoring habit as a single final-aspect-ratio label against one diagram** (Phase 6): the
  sources themselves warn ρ_aspect encodes growth history and can invert the facet-rate
  ratio (CM8 p. 15; CM6 p. 10). Retained only as one operator among several, never the gate.
- **Counting σ₀ crossings as a habit bound** — retracted 2026-07-29/08-01; see the retraction
  notices in `research/libbrecht-figure-findings.md`. Nothing in this book may inherit it.
- **Treating any single lab's diagram as ground truth** — the cold end proves the failure mode.
- **Promoting the 860/1010 mb pair to Class A** — rejected after lineage audit: it is one
  Takahashi/Fukuta method family with site, apparatus, droplet, selection, and history confounds.
- **Freezing a Bailey–Hallett transition coordinate from the local 2002 conference PDF** —
  rejected because that document is explicitly a precursor. The 2004 version of record and later
  2009/2012 lineage must be acquired and extracted before quantitative reuse.
- **Promoting the exact −4.0 °C boundary to Class A** — rejected because the audited corpus lacks
  a second laboratory/method that pins that same boundary; generic warm reversal agreement is not
  enough.
- **Promoting the −8.1 °C boundary to Class A from a Libbrecht −8 °C near-rate equality** — rejected
  in non-author review. Equality at one temperature is not an independently located boundary, and
  the Libbrecht context is in the model's source lineage.
- **Calling unmatched Libbrecht/Penn inversions a Class-C coefficient disagreement** — rejected in
  non-author review. They do not share a matched facet/shape, supersaturation calibration,
  diffusion/thermal treatment, or fitted quantity, so no discrepancy magnitude is established.
- **Assigning `100000 Pa` to experiments described only as normal air** — rejected. The primary
  TAX1/TAX2 matrix and cited −5 °C targeted extraction print no numeric chamber pressure; the book
  records `not-reported` instead of borrowing a value from related experiments.
- **Transcribing raster tables or curves because they are visible** — rejected for S0. Visibility
  is not a registered digitization operator, and no read uncertainty was available.
- **Reproducing substantial source prose or table bodies to prove extraction fidelity** — rejected
  after the rights audit. Exact numbers, page/figure locators, paraphrase, and a few brief attributed
  quotations establish traceability without republishing copyrighted expression.
