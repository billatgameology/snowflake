# Plan — Phase 6 WP1 source lineage and TAX2 panel spans

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** closed as rejected history; narrowed successor not started
- **Started:** 2026-08-02
- **Last touched:** 2026-08-03 by OpenAI Codex (maker-directed closure)
- **Parent plan:** [phase-6-science-first-completion.md](phase-6-science-first-completion.md)

> **Governing closure, 2026-08-03.** The maker closed the V4/V4.x search-register, publisher, and
> control-batch apparatus as rejected history. Do not execute, repair, repin, or continue any step
> below. The active parent plan now owns a narrowed WP1: freeze Nakaya-comparison physical-size
> strata from already-locked sources through the simplest reviewable deterministic operator. This
> file retains the failed approaches, exact evidence identities, and review provenance only.

## Goal

Resolve the remaining Phase 6 WP1 source questions without selecting targets from model output.
This bounded plan treats three questions independently:

1. `YAMASHITA-FREEFALL-LINEAGE-01` — identify the original primary source and experimental
   conditions behind the Yamashita free-fall measurements reproduced through `[1987Kob]`;
2. `MATCHED-AIR-PRESSURE-01` — search for a genuinely matched experiment that varies background
   air pressure while controlling the other load-bearing conditions; and
3. `TAX2-PANEL-SPAN-01` — pre-register, independently review, and then execute a deterministic
   extraction of two-dimensional projected span at each reported growth-time snapshot across all
   216 candidate addresses, preserving the source's 206 reported observations and every
   operator-classified blank, refusal or censored row.

This work may source-freeze a validation candidate only if source independence, geometry, transport
physics, observable definition, and uncertainty all pass. Quantitative scoreability additionally
requires the separately pre-registered source-to-model bridge and numerical controls; WP1 alone does
not grant that status. A documented source-limited result is an honest WP1 outcome, but it does not
complete the Phase 6 charter gate or make the candidate lock pass-eligible.

## Done when

Maker-accepted charter v1.20 working-tree candidate, whose canonical Git landing is still pending,
verbatim:

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the versioned protocol freeze (item 1) makes every authorized change auditable and invalidates prior sweep evidence for the replacement gate after a post-freeze edit.

This subordinate plan is complete when every search is cold-resumable from its tracked register;
the Yamashita lineage resolves to a primary source or ends in a scoped search-negative record; the
matched-pressure search yields either a source-compatible candidate that explicitly remains
bridge-required or a source/model-scope blocker; the TAX2 operator is committed and reviewed before
numeric extraction; all acquired bytes and derived data have reproducible provenance; and the
candidate-lock disposition and `docs/PROGRESS.md` state the exact outcome and next dependency.
`docs/HANDOFF.md` is updated only if the maker explicitly requests a stop/restart handoff.

## Approach

The three question IDs remain separate because they answer different scientific questions and may
end differently. Finding the Yamashita source does not establish a matched-pressure experiment.
Extracting TAX2 sizes does not make its c-axis-needle corpus held out from M1 or geometry-compatible
with the current regular-prism seed.

Before execution, every source search freezes its databases/catalogs, exact query strings and
fields, date cutoff, pagination/result caps, backward/forward citation depth, inclusion/exclusion
and matching criteria, deduplication rule, inaccessible-source handling, and deterministic stopping
condition. Execution records UTC dates, exact queries/URLs/pages, every encountered or returned
result in an inclusion/exclusion ledger, total returned/screened counts, pagination or cursor
completion, stable identifiers, acquisition results, byte counts and digests, relevant pages,
experimental conditions, observables, uncertainty, independence, model-physics compatibility,
rejection reason, next action, reviewer provenance, and review limits. Preserve and hash a raw
response/snapshot where legally and technically possible. Negative results are bounded to that
pre-registered search and cutoff; they are not claims that no suitable experiment exists anywhere.

For a non-English source, retain the original-language excerpt and page plus the translation/OCR
tool and version, and record human-review uncertainty. A metadata- or stable-ID-only discovery is a
lead: it cannot freeze a quantitative target without inspectable primary methods/data bytes.

Third-party source bytes and renders remain ignored under `research/`. Transient extraction work
belongs under `research/tmp/`. Durable normalized source-search ledgers belong under
`evidence/phase6-wp1-source-search-01/`; durable numeric science outputs belong under a tracked
`evidence/phase6-tax2-panel-span-01/` bundle that binds the exact source and operator bytes. Do not
redistribute raw catalog HTML, abstracts, source photographs or PDFs in either bundle. Every
published evidence file must be registered
with its byte count and SHA-256 in `evidence/MANIFEST.json`; `.gitattributes` already fixes the
entire `evidence/**` subtree as `-text`, and the evidence-integrity test must reopen every entry.

`PHASE6_HELDOUT_CANDIDATES_2026_08_01` and its `passEligible=false` value are immutable. If new
candidates warrant a changed disposition, issue a new versioned successor lock with its own cutoff
and verifier; never edit or silently reinterpret the existing ID. A successor may become
pass-eligible only after a target passes every scientific admissibility check and receives
independent evidence review.

## Rejected register v2 and the lean v3 correction

The integrated register v2 is rejected and will not be patched into execution. Its exact identities
are register SHA-256 `e4e89faaf8de93161a480065ebff50725b58e6c8bc4f9f182efd5b599fdb00e0`
(289,935 bytes / 3,396 lines / Git blob `5d3b2f1792946f1d9e28612b74d2a5970ae64292`) and catalog SHA-256
`dc15d1808b5446eb80dc21c07165510e12ad3d89b41376c66924ffc775585963`
(23,791 bytes / 528 lines / Git blob `e12b6a58f8b7418ae7df0e92d50796088c797434`). The canonical
repository's `.git` was sandbox-read-only, so the exact eight intended working files were copied to
ignored recovery clone `research/tmp/recovery/wp1-checkpoint-e4e89faa` and committed there as
`5ec54ec810aabd1b590aa3225fe5923d28f2d78b`. Complete bundle
`research/tmp/recovery/wp1-checkpoint-5ec54ec.bundle` is 5,535,578 bytes, SHA-256
`adff515b6403ba9f97362e7f7462a4b2a8d5ba8bebfff366e8654541c1fabac5`, and passed `git bundle
verify`. These are recovery anchors, not a canonical branch landing or freeze.

Three fresh non-author reviews bound those exact bytes and confirmed no before/after drift:

- A `gpt-5.6-sol` schema/downstream review rejected with 18 blockers / 5 should-fixes. It found
  undefined assessment scheduling and evidence discriminators; citation review bypass; inadequate
  reviewer provenance; a positive-only decimal grammar unable to represent normal Celsius inputs;
  author-chosen pressure conversions/uncertainty; contradictory independence and currency universes;
  evidence-free independence; stale scheduling state; incomplete source-byte closure; ambiguous
  catalog-node selection; impossible heterogeneous ordering; incomplete checkpoint canonicalization;
  an undefined reviewed-assessment operand; self-attested/impossible reexecution modes; incomplete
  code/artifact review closure; and underdetermined preparation/publication roots.
- A different-model `gpt-5.6-terra` science review rejected with 1 blocker / 1 should-fix. A
  structurally coherent but fabricated or wrongly converted pressure output could pass because rows
  lacked source-segment, extraction, canonical-unit/conversion and solver-output bindings; repeat
  uncertainty also lacked a frozen estimator. TAX2's local `REGISTERED` label contradicted the
  globally unregistered state.
- A `gpt-5.6-sol` publication/recovery review rejected with 8 blockers / 3 should-fixes. It found an
  impossible verifier mode, vacuous negative-control and review-execution records, omitted CLI and
  transitive semantic code, no mandatory closure of prior findings, ambiguous review-ledger order,
  recovery scratch illegally placed under tracked `evidence/`, and a bespoke publisher/review stack
  duplicating the shared evidence seam. It also required canonical contributor IDs, removal of stale
  plan prose, and a committed clean-checkout verification step.

The v2 scientific content remains useful: exact queries, cutoff, provider caps, finite citation and
Rule 12 traversal, source/language assessment, pressure-confound fields, TAX2 scope, and the
machine-readable independence catalog all fail closed. The rejected part is the approximately
2,400-line custom exactly-once HTTP owner/recovery, hard-link journal, three-root publisher, and
publication-review state machine. Read-only GET repetition is observable and harmless when every
attempt is retained; it does not justify transaction machinery. The repository anti-rule also
requires reuse of an existing evidence seam unless a genuinely new attack surface is named.

### V3 approach that was reviewed and rejected

1. Move executable protocol data—not interpretation—into one canonical
   `research/phase6-wp1-search-registry.json`: the two entry IDs, 27 exact base queries, nine route
   templates/caps, common cutoff and headers, retry rule, seed identifiers, traversal limits,
   screening vocabularies, conversion/operator IDs, and the closed negative-control registry. The
   prose register states scientific meaning and hashes the JSON. The existing independence catalog
   remains separate because it is a different governed operand set.
2. Keep ignored acquisition bytes and restart state under
   `research/tmp/phase6-wp1-source-search-01/ENTRY_ID/`. An immutable stage plan lists exact request
   IDs. Each attempt receives a monotonically increasing ordinal, canonical envelope, and separate
   raw-body descriptor. A successful write is temporary-file + flush + rename; a partial is retained
   and journaled as interrupted. On resume, all authority is reconstructed from immutable plans and
   attempts; `checkpoint.json`, if present, is a disposable cache. Repeating a GET after an
   unrecorded crash is permitted and visible. The lowest-ordinal valid terminal attempt governs;
   every later attempt remains disclosed. No mutable owner, hard link, exported reservation, or
   exactly-once claim survives.
3. Execute in finite stages: registered discovery, deterministic normalization/assessment import,
   registered citation expansion, Rule 12 expansion, then final reduction. A later assessment may
   add a new stage but cannot delete a request or evidence claim. Every stage binds the preceding
   accepted bytes and depth/cap rules; no free-form request can dispatch.
4. Require a complete source inventory and reviewed evidence segments for every load-bearing claim.
   OCR/translation competence and tool identities are explicit. Assessment revisions are
   append-only, acyclic and single-headed; scheduling derives from accepted heads while all prior
   requests remain. Strong-identifier conflicts and fallback-only identity fail closed.
5. For matched pressure, every condition and output row binds reviewed source segment(s), exact
   page/table/figure/cell locator, and transcription bytes. Signed Celsius and zero are representable.
   Closed conversion IDs map pressure, supersaturation, time and each output to canonical units.
   Raw-repeat data require a frozen estimator. A closed no-fit solver mapping names the predicted
   metric, aggregation and geometry; omitted load-bearing physics, unsupported output mapping, or
   missing quantitative uncertainty blocks admission. Fabricated/detached rows, wrong conversion,
   wrong solver mapping and changed repeat reduction are registered negative controls.
6. Derive each independence arm over exactly its active catalog operand list. A non-overlap edge
   requires nonempty claim and reviewed-segment evidence; missing/unreadable source nodes or an
   incomplete edge set yield `unresolved`. No prose status can override the reduction.
7. Reuse `canonicalJsonBytes`, `publishEvidenceBundle`, and `verifyEvidenceBundle` from
   `runner/src/gate4-evidence.ts`. WP1 adds only strict science parsers/reducers and a separate
   verifier that may share byte/hash/canonical-JSON primitives but no semantic reducer. Publication
   uses one staged bundle and one final rename; all recovery scratch stays under `research/tmp/`.
   Normalized requests/attempt descriptors, occurrences, assessments, relations/currency,
   candidate/output rows, summary, review record, and captured review-command logs are manifest-
   covered tracked artifacts. Copyrighted response/source bytes remain ignored and are represented
   by exact descriptors.
8. Freeze every negative-control ID, fixture, exact mutation, mutation witness and expected detector
   in the registry. The result lists the complete expected ID set, before/after hashes and observed
   failing criteria; a missing or unexecuted mutation is itself a failure. Successor reviews receive
   all prior finding IDs and must close, explicitly decline, or retain every one. Review provenance
   uses canonical provider/model/context fields and states that contributor identity is attested,
   not cryptographically authenticated.
9. Publication is provisional until the bundle and `evidence/MANIFEST.json` are committed, reopened
   from a clean checkout, independently verified, and exact `npm test` passes. No source request or
   TAX2 measurement starts until the governed protocol and exact offline implementation receive a
   fresh non-author 0-blocker / 0-should-fix review and a canonical record-only freeze.

V3 was not pre-accepted. Three exact-byte reviews attacked it and rejected it with 22 blockers and
7 should-fixes; the identities and complete finding registry are recorded below. No request, import,
publication, TAX2 measurement or production solver run occurred under v3.

### V4 combined protocol-and-code freeze, registered before implementation

The v3 reviews established that prose alone cannot uniquely define this workflow's request DAG,
strict JSON payloads, crash states, fixtures, semantic closure and publication boundary without
growing back into v2's rejected state machine. V4 therefore splits authority by competence while
preserving the same science-first gate:

1. Section 11 and the registry own the scientific question, finite search universe, exact routes and
   queries, citation/Rule 12 traversal, screening/admission rules, matched-condition operator,
   physical observable mappings, evidence requirements, stopping rule, negative-control intent and
   bounded claim language.
2. Committed TypeScript schemas and pure parsers own exact keys, discriminators, canonical array
   order, Unicode/identifier normalization, request construction, immutable attempt-state reduction,
   evidence payloads, review records and verifier inputs. Governed fixtures own each exact mutation
   and an independent witness. The register hashes and names the complete transitive closure.
3. The shared evidence seam receives the smallest reusable hard-crash recovery extension needed by
   WP1; the source-search code may not create a bespoke publisher. Recovery behavior and killed-child
   controls are reviewed across all existing callers before acceptance.
4. Raw third-party/provider/source bytes remain ignored and content-addressed under `research/tmp/`.
   Candidate verification reopens those governed local bytes and rederives normalized claims.
   Published verification from a clean checkout proves the tracked bundle's integrity, internal
   semantics and review closure but explicitly does not claim to reconstruct omitted copyrighted or
   provider bytes. Source descriptors preserve the exact limitation.
5. Implementation is offline only until the combined candidate is accepted: no network/provider
   request, manual import, source acquisition, TAX2 measurement, production solver row or evidence
   publication may run. Exact protocol, code, tests, fixtures, dependencies and recovery records then
   receive schema, science and publication audits against the same committed identity. Every audit
   must return 0 blockers / 0 should-fixes before one record-only freeze authorizes the first request.

This ordering is a protocol correction, not permission to select rules from observed results: all
scientific and executable decisions still freeze before any search response or model output exists.
It eliminates the false separation in which prose was called complete before its executable meaning
could be reviewed.

## Steps

- [x] Replace rejected Section 11 v2 with a lean v3 register and machine-readable registry, preserve
  its exact recovery checkpoint, and obtain three exact-byte adversarial reviews. All three rejected
  v3 without byte drift: schema 10 blockers / 3 should-fixes, science 5 / 2, and publication 7 / 2.
  No HTTP/retry path, request, import, publication, TAX2 measurement or numeric extraction ran.

- [ ] Replace rejected v3 with the v4 combined protocol-and-code candidate above. Preserve the
  untracked v1/v2 skeleton under ignored `research/tmp/recovery/`, then implement the deterministic
  staged source-search executor, immutable attempt journal,
  normalized occurrence/candidate ledgers, independent semantic verifier and shared-seam evidence
  publisher exactly from Section 11 and the registry in
  `runner/src/phase6-wp1-source-search.ts`, with CLI wiring in
  `runner/src/phase6-wp1-source-search-main.ts` and focused tests in
  `runner/test/phase6-wp1-source-search.test.ts`. Pin the
  register/executor/source identities and reject unintended tracked dirty state. Tests must prove
  rejection of
  every registry-named mutation, including an unregistered route/query, tampered response/attempt,
  shifted cursor-parent hash, partial-write recovery, malformed identifier, conflicting identity
  bridge, detached/fabricated pressure row, wrong conversion/solver mapping/repeat estimator,
  incomplete independence evidence, dropped prior review finding, and manifest mutation. Prove
  resumable no-response and cap/access terminal states and that a late component merge cannot rename
  a scheduled request.
  The focused command is
  `npx.cmd vitest run runner/test/phase6-wp1-source-search.test.ts`. Obtain a non-author
  schema, science and publication review of the same exact protocol/code/fixture closure before the
  first live request. The existing uncommitted skeleton was written for rejected v1/v2 semantics and
  is reference material only until compared against v4; no current typecheck or implementation claim
  is made for it. Offline implementation does not authorize any request or import.

  The author-side v4 science/search candidate is stable at register SHA-256
  `f899590857a6f3c6ff2f1d2fe2563a1438a67d46fb209c476d1fdc9d34b18804` (58,641 bytes / 760 LF)
  and registry SHA-256 `a3f8ef568427b58ff0043065700a8ee4a3c8bb7b4d6fa7c91b112562753d2c18`
  (70,055 bytes / 593 LF). Author validation and a separate root recomputation agree on the exact
  108/168 and 135/210+12 schedules, 91 inherited findings, 69 single-mutation control intents,
  20 checks and all six catalog-v1 canonical-text hashes. These are unreviewed author bytes and the
  registry still intentionally binds preserved catalog v1; do not execute or hash-freeze them before
  the catalog successor is dispositioned and the combined closure is reviewed. Recovery commit
  `642b3af4991fb713a841a942142bc97988fbd10d` and verified bundle
  `research/tmp/recovery/wp1-v4-science-642b3af.bundle` (5,586,911 bytes / SHA-256
  `b9eaa20e4bf2ff5671dc0fab2ac3f410cdac328215e68139c07ed1679831402a`) preserve the register,
  registry, bound catalog-v1 bytes, `.gitattributes` and plan. A fresh `core.autocrlf=true` checkout at
  `research/tmp/recovery/autocrlf-check-642b3af/` reproduced all three governed hashes exactly.

  Preservation is complete at `research/tmp/recovery/wp1-rejected-skeleton-52fd477b/`: producer
  reference SHA-256 `52fd477b083facb4f6a10642bf894c8abe6fa1f516f61def886b5b3aaa1628d8`
  (51,596 bytes) and test reference SHA-256
  `4a43a633e41683a6edf018ef55d9a3d9e8fe9c26ddb371ce3f4d9a73114f1e76` (24,024 bytes). These
  ignored copies preserve rejected semantics; they are not implementation authority or evidence.

  The first reusable shared-publisher recovery candidate is also preserved outside the contested
  live files at `research/tmp/recovery/wp1-v4-publisher-c88d63/`, recovery commit
  `ce05292524262dcb7dd9ed4e635ad3b70f03fedb`. Its source is 41,168 bytes / 1,031 LF / SHA-256
  `c88d63edf0c17d2fdaaf611608ad33e09d60fd9468bf7bca0e4fc0f2a5b11ad0`; its test is 27,094
  bytes / 669 LF / SHA-256 `9a8fd7c450add361d8abb486509fbb7f7a8b374628087d0a077ac1d9668e5b50`.
  Verified bundle `research/tmp/recovery/wp1-v4-publisher-ce05292.bundle` is 5,537,645 bytes with
  SHA-256 `9a504b7a9591b82205f3fd16d56298081e53a4b8ccea79e6ded84b60df9d8c48`.
  In the isolated clone, focused recovery tests passed 52/52, `npx.cmd tsc --noEmit` passed, and
  `git diff --check` passed without hash drift. A separate concurrent continuation repeatedly
  overwrote the shared root during that work, so these self-checked candidate bytes were intentionally
  kept out of the live implementation. A fresh read-only non-author publication review then
  **rejected** the exact recovery commit with five independent blockers: it broke both Gate 4B
  publication tests through inconsistent tree ordering (76/78); Windows case aliases hid attempts;
  prefix parsing could adopt another publication's staging directory; the registered LF file hashes
  changed in a clean `core.autocrlf=true` checkout; and a deterministic directory-swap witness made
  resume return a self-consistent publication other than the immutable expected one. The review also
  kept the repository-manifest finalizer explicitly open. Gate 4A remained 89/89, the focused suite
  52/52, both typechecks passed, and Rule 7 was clean over 420 files; exact `npm test` was not green or
  claimed. The bundle is rejected-design evidence and a recovery anchor, not v4 acceptance.

  An isolated successor preserves that rejected commit and was initially an **unreviewed repair
  candidate**, not integrated code. Recovery commit
  `86b17ceb2d8a0087602a4481644c8ef4d5c7018c` is preserved by
  `research/tmp/recovery/wp1-v4-publisher-86b17ce.bundle` (5,540,646 bytes / SHA-256
  `b06a61bb4ae83c48ffec89411b563688175b0b3e3354ae136a94cbedee736637`). Its registered files are
  `.gitattributes` (2,005 bytes / SHA-256
  `45ae165631dd2be22432d6ad16a55b90262c0f535ef0de5ba6cdec4ece9a19d5`),
  `runner/src/gate4-evidence.ts` (49,983 bytes / SHA-256
  `ed5aa4b16ed87edfa07f361b818a383a284ee923804b8a74cfaa6de4f5d4e47a`),
  `runner/test/gate4-evidence.test.ts` (36,298 bytes / SHA-256
  `dab0a10fc8f7570109815647712704925a396025d14045cd767f5eb453ce4a62`), and
  `RECOVERY-MANIFEST.json` (2,621 bytes / SHA-256
  `bb1bf07fdea8a12e88c0b688c5228bb4e214efd30bda5c426766e17ddea8704b`). The manifest records 526
  targeted caller tests, both typechecks, Rule 7 over 420 files, and the diff check; the fresh
  `core.autocrlf=true` checkout at
  `research/tmp/recovery/wp1-v4-publisher-autocrlf-86b17ce/` reproduces all four hashes exactly.
  The repair uses one global tree order, anchored attempt names, Windows case-insensitive discovery,
  final immutable expected-byte reopening, no-follow checks, and explicitly process-kill-only
  recovery under a same-canonical single-writer contract. It makes no fsync/power-loss or general
  cross-process-locking claim. The repository-global `evidence/MANIFEST.json` transaction remains a
  named downstream blocker. The fresh non-author publication review below attacked and rejected the
  exact successor; it cannot replace the rejected design.

  A root-side preliminary attack (not the required non-author acceptance review) already found two
  additional successor blockers against exact commit `86b17ce`; its retained local witness is
  `research/tmp/recovery/publisher-root-attack-f2l1L1/`:

  - `PUB86-ROOT-B01`: after the publishing rename, a test-hook substitution made final expected-byte
    verification fail, but the catch path trusted `renamedByThisInvocation` and recursively deleted
    the now-substituted canonical tree. A failure path must not erase bytes it no longer proves it
    owns; divergent bytes must remain inspectable.
  - `PUB86-ROOT-B02`: publication through a non-final ancestor junction succeeded and wrote into the
    junction target. Checking only the final parent does not substantiate the candidate's no-follow
    claim; every governed ancestor boundary needs an explicit threat-model decision and test.

  Preserve `86b17ce` unchanged. A versioned successor must independently disposition both witnesses
  together with the global-manifest finalizer before publication review.

  **Exact `86b17ce` non-author review — rejected (2026-08-02).** Reviewer OpenAI Codex
  `gpt-5.6-sol`, ultra, was not the publisher author and inherited the complete project/task context;
  the review was read-only. The reviewer verified commit
  `86b17ceb2d8a0087602a4481644c8ef4d5c7018c`, the complete-history bundle and its SHA-256 above,
  a clean `core.autocrlf=true` checkout, and all four registered checkout hashes. Independently
  re-executed checks were publisher 65/65, Gate 4B 78/78, Gate 4A plus evidence-integrity 119/119,
  Phase 5/6 callers 174/174, and Gate 4 protocol 90/90: 526/526 targeted tests in total. Both
  TypeScript checks, Rule 7 over 420 files, and `git diff --check` also passed. One parallel wrapper
  exceeded 120 seconds and is not counted; every affected suite was rerun sequentially. Exact
  `npm test`, Linux/macOS execution, fsync/power-loss behavior, hostile concurrent writers, R15/GPU
  execution, and the absent global-manifest implementation were not checked.

  The exact review found four blockers and one should-fix:

  - `PUB86-ROOT-B01` was corroborated both after canonical rename and before rename: path-based catch
    cleanup recursively deletes a replacement canonical or staging tree that the publisher no longer
    proves it owns.
  - `PUB86-ROOT-B02` was corroborated: a non-final ancestor junction redirected successful
    publication outside the lexical evidence root.
  - `PUB86-AUD-B03`: adoption can name a nonexistent attempt while supplying a valid state token,
    return the canonical from a `canonical-with-residue` state, and leave the actual residue behind.
    The idempotent canonical branch must require `canonical-complete` and zero observed attempts.
  - `PUB86-AUD-B04`: the repository-global `evidence/MANIFEST.json` transaction and independent
    verifier are absent, so no global publication claim can follow from this module.
  - `PUB86-AUD-S01` (should-fix): use one portable, case-folded Windows namespace and reject device
    names and trailing dots for canonical, report, index, and artifact path segments.

  Preserve the candidate as recovery lineage only. Its successor must fix all five findings, add
  adversarial controls for them, pass exact `npm test`, and receive a further non-author review.

  The isolated publisher/global-manifest successor is now frozen for that review at final record
  commit `14460a3c799ca463d72ae016d4a9dd2211a333df` (implementation `eb86e5e…`, plan
  `9bbf031e…`, base `86b17ce…`) in `research/tmp/recovery/wp1-v4-publisher-global-86b17ce/`.
  Its complete-history bundle is `research/tmp/recovery/wp1-v4-publisher-global-14460a3.bundle`
  (5,587,956 bytes / SHA-256
  `91445545f91c6cbc01e1f40a8f7af2baf2a372c338cb503aa4b28d811ff0742c`) and its acyclic proof
  sidecar is `research/tmp/recovery/wp1-v4-publisher-global-14460a3.PROOF.json` (2,560 bytes /
  SHA-256 `1fd26ff5b1f45da3341d77dbee746ce247cc398763bde8b207881bb843c056af`). The author reports named
  controls for all five `PUB86-*` findings, 567/567 registered targeted tests, both typechecks, Rule 7
  over 423 files, and diff checks. A fresh `core.autocrlf=true` clone matched all six registered byte,
  line-ending, SHA and blob identities; protected paths and `RECOVERY-MANIFEST.json` reported
  `text: unset`, the tree was clean, and `git fsck --full --strict` passed. These are author results,
  not acceptance. Same-canonical single-writer process-kill recovery remains the stated ceiling; no
  fsync, power-loss, or general locking claim is made. A fresh non-author `gpt-5.6-sol` ultra review
  independently verified the exact commit, bundle/proof identities, complete history, a clean
  `core.autocrlf=true` checkout, all six non-self recovery-manifest byte/SHA/blob identities, strict
  fsck, 567/567 registered targeted tests, both strict typechecks, Rule 7 over 423 files, and clean
  diffs. It nevertheless rejected the candidate with four blockers and zero should-fixes:

  - `PUB144-REV-B01`: whole-path authentication becomes stale after adversarial hooks. Independent
    Windows witnesses swapped a non-final ancestor to a junction after the local publisher's check,
    making it return success through a byte-identical foreign tree, and swapped the global active
    transaction directory before `writeExpectedFile`, causing `new-manifest.json` to be written in
    the foreign target before the post-write rejection. Reauthenticate every governed ancestor
    after each hook and immediately before every mutation and final-success read, including the
    parent before `wx`.
  - `PUB144-REV-B02`: Git porcelain plus current auxiliary bytes accepts hidden baseline tamper. A
    tracked `OUT-TREES-MANIFEST.json` changed under `assume-unchanged` produced empty status and was
    self-bound into a successful descriptor. Reject index-hiding flags and derive/reopen/compare all
    tracked baseline auxiliary identities from `expectedCommit`, never current producer-selected
    bytes.
  - `PUB144-REV-B03`: retained completed records make the finalizer non-composable. After a valid
    first transaction was committed as the next baseline, a second valid transaction failed because
    the root treated the prior completed record as unknown. The production namespace/lifecycle must
    admit verified prior completions while still detecting every other active transaction.
  - `PUB144-REV-B04`: an exact completed record combined with an old-live rollback is classified only
    after mutation. The second invocation installed the new manifest and left both active and
    completed records before rejecting. Classify the complete live/active/completed tuple before any
    write; a completed record requires exact new-live unless a separately specified fail-closed
    recovery protocol applies.

  Review provenance: non-author OpenAI Codex `gpt-5.6-sol`, ultra reasoning, with inherited project
  context but no authorship of candidate bytes. It inspected all five original `PUB86-*` themes and
  found automatic-cleanup, canonical-adoption and Windows-namespace repairs closed, while the
  ancestor/global-manifest theme remains open through the four successor findings above. It did not
  run exact `npm test` as one command; test Linux/macOS, fsync/power-loss, uncontrolled concurrent
  processes, integrate live `evidence/MANIFEST.json`, or run science/R15/GPU work. The exact
  witnesses and temp roots are reviewer-local diagnostics, not accepted evidence. The successor
  finding universe is now 184 after the separate ledger-authority/science audits and the later
  `V4AS-ROOT-B02` / `PUBNEXT-ROOT-B01/B02/B03/B04` root attacks below; exact combined `npm test` remains
  open.

  The first v4 artifact-schema foundation is independently preserved at recovery commit
  `cc047e31f808e28c2f6b30f7378e65cc04b06041`. Its module is 150,098 bytes / 4,192 LF / SHA-256
  `07e327641a9ff6547dc1ccfad7c35e13875cc82f4c0ea95b91bdb7eb0401b8f7`; its focused test is
  35,417 bytes / 1,133 LF / SHA-256
  `aaf5456479e61020a115d962e124255bc959d7ff1c393ebb7b8e9b4142d795f4`. Verified bundle
  `research/tmp/recovery/wp1-v4-artifacts-cc047e3.bundle` is 5,551,358 bytes with SHA-256
  `efb2421a1e53fcc74a1c3a1d413e73d72bc70fa184dc718ac2edb064efbaf627`. Focused tests passed
  20/20, strict TypeScript passed, Rule 7 was clean over 429 files, and the scoped diff check was
  clean. This is an offline foundation under fresh non-author review, not a complete schema or
  execution freeze. Aggregate route caps; exact route/header comparison; identity, screening and
  relation reducers; exact conversion and uncertainty arithmetic; the source/model bridge ceiling;
  contributor/session/command closure; and independent detector derivation remain explicit combined-
  freeze blockers.

  An externally written catalog-v2 candidate (25,430 bytes / 553 LF / SHA-256
  `dd68ec83d8f5f0eaa799e7c636af8fd0da75e11ead961fab5145c0b42a10072e`) correctly proposed that
  universal exact metrological definitions are not empirical-data overlap, but a read-only non-author
  review rejected those bytes with `CATV2-B01` through `CATV2-B04` and `CATV2-S01` through
  `CATV2-S02`. The candidate disagreed with the still-v1 registry; allowed a free-text exemption
  without governed proof; assigned the exemption at source-node rather than source-node/data-family
  granularity; did not enforce the separate provenance/currency conjunction; lacked successor
  provenance; and left `SRC-ADR0036` ambiguous. Its measured arm consequences were otherwise
  conservative: CAK remains unresolved on the missing 1208 source, and M1/no-dip remain unresolved on
  that source plus unreadable 2109. A governed successor may retain the conceptual distinction, but
  v2 is unauthorized and the registry remains bound to catalog v1 until the successor is reviewed.

  The catalog-v3 author candidate is 59,101 bytes / SHA-256
  `35f11b8ea65fd43ac8097cf2ddda1e26515ffc7377cab97f7682bdbfecf0506f`, explicitly unreviewed and
  not accepted. It keeps v1 as the normative base, separately records rejected v2, and registers 59
  operand/data-family mappings, 97 source-role edges, four exact-definition authority descriptors,
  disjoint derived membership, a four-clause promotion conjunction and four closed control intents.
  Recovery commit `74c9482d716e084e89b7382b9e500568f911970c` and verified bundle
  `research/tmp/recovery/wp1-catalog-v3-74c9482.bundle` (5,524,654 bytes / SHA-256
  `70fd682122b97bf1a3773f9be129b3f7d16cbe923dfa12968674a0af01c32f5d`) preserve its Git-blob
  bytes. Do not repin the registry or treat any exemption as accepted before a non-author reviewer
  checks every mapping/role and returns 0 blockers / 0 should-fixes.

  A non-author mapping-by-mapping audit held those exact 59,101 bytes fixed and **rejected catalog
  v3 with 9 blockers / 1 should-fix**. Its additive finding registry is:

  - `CATV3-AUD-B01`: active project selection/intervention lineage from ADRs 0036/0040, the
    parameter table, implementation and protocol is absent from support edges; `generatedFrom` is
    not selection provenance.
  - `CATV3-AUD-B02`: active CAK/M1 lineage omits load-bearing monograph, 1910.09067, 2017Lib,
    CM10/1912.03230 and everywhere-narrow/intervention sources, and the no-dip prefactor family no
    longer matches the registered single-intervention meaning.
  - `CATV3-AUD-B03`: `SRC-CAK-DIGITIZATION-JSON` is only a machine-associated, scientifically
    unverified caption/crop record with no curve coordinates, calibration, readings or uncertainty;
    calling it a numeric digitization is false.
  - `CATV3-AUD-B04`: inactive SDAK-2 and `w_0` mappings wrongly substitute `2306.04042v1` for the
    distinct monograph Figure 4.14 and printed p.157/PDF p.158 prescriptions.
  - `CATV3-AUD-B05`: source-role edges have no governed page/section/segment/claim/derivation
    locators, and their numeric Markdown fragments do not resolve to the claimed table sections.
  - `CATV3-AUD-B06`: empirical, authority and currency verdicts are caller-declared states rather
    than closed per-arm/per-subject reductions with precedence and exact result identities.
  - `CATV3-AUD-B07`: v1/v2 predecessor paths and the six exact CATV2 review texts/provenance/checks/
    limits/dispositions are not closed.
  - `CATV3-AUD-B08`: the four controls have no governed fixture/mutation/detector/execution closure;
    NC04 names a field absent from its synthetic result.
  - `CATV3-AUD-B09`: commit `74c9482` lacks the later `-text` fix and drops the prior exact hash-
    domain rules; its 59,101-byte LF blob smudges to a different 59,868-byte Windows file.
  - `CATV3-AUD-S01`: provenance class must be assigned at data-family granularity; row-wide CAK P3
    and broad M1 ranges disagree with the current P2/P3/P4 table split.

  The reviewer independently enumerated all 59 mappings and 97 edges, verified the structural
  counts/memberships/authority links, all six generated-from hashes, all 15 readable source hashes,
  the complete bundle, and Windows smudge output. OpenAI Codex `gpt-5.6-sol` at ultra reasoning was
  nonauthor/read-only with full inherited context; an identity subreview separately checked blob,
  source, locator and predecessor seams. It ran no `npm test`, provider call, source acquisition,
  TAX2, solver, R15 or GPU job. The exact record is preserved by detached recovery commit
  `9db37dda1f86f71a168f9795f1df1e73399b80aa` and verified bundle
  `research/tmp/recovery/wp1-v4-records-9db37dd.bundle` (5,567,624 bytes / SHA-256
  `a2ad84e04ea843e2f84fc6ca45904d51e442c14b53864bf9fbdee0c17fd7e668`). Catalog v3 remains
  rejected and may not be repinned.

  The concurrent 99,033-byte `9ffe4edf…` V4.1 catalog was outside that audit. A preliminary reopen
  shows that it still labels the scientifically unverified crop/caption JSON as a CAK numeric
  digitization, still maps `DATA-W0` only to `2306.04042v1`, and lists added M1 context sources with
  no active support edges. Its separate finding ledger also omits all ten `CATV3-AUD-*` IDs. Those
  changed bytes are therefore an unreviewed author candidate with already-known open defects, not a
  catalog acceptance or a registry-repin basis.

  A separate read-only non-author audit then held V4.1 exact at 99,033 bytes / SHA-256
  `9ffe4edf928bfa3416ecd064a594da259c0fcc24ad87b2cbc744906d3c2163cb`. It **rejected V4.1 and
  found all ten `CATV3-AUD-*` findings still open**; B01, B06, B07 and B09 were only partial repairs.
  V4.2 must:

  - replace broad selection arrays with exact arm/operand/family/record edges; distinguish planned
    no-dip helpers from an executable parameter set and do not attribute the project's intervention
    to `2306.13087`;
  - make M1 and no-dip identical outside the two dip multipliers, including separate inherited
    prefactor-rationale and everywhere-narrow selection/history families. Complete direct and first-
    depth lineage includes the monograph, `1910.09067`, missing `2017Lib`, `2012.12916`,
    `1912.03230`, and—where the bounded traversal requires them—new nodes for `1512.03389`,
    `1302.1231`, and `1209.4932`; missing sources remain unresolved;
  - remove the caption/crop metadata JSON from all four CAK numeric families. A replacement
    digitization must bind page/crop hashes, log-axis calibration, raw readings, conversions,
    uncertainty, tool/contributor provenance and independent review; until then local CAK numeric
    lineage is unresolved;
  - keep inactive but separate monograph Figure 4.14 SDAK-2, the monograph p.157/PDF p.158 width law
    plus transitive `1512.03389`, and `2306.04042` Eqs. 32–33/Table 1. Split the latter's P2 broad
    branch from its P3 SDAK-2 branch;
  - replace all 97 unlocated support edges and 16 invalid numeric Markdown fragments with governed
    source/path/hash/page/figure/table/equation/segment/claim bindings and attack wrong-page,
    wrong-claim, source-swap, unresolved-segment and caption-as-number substitutions;
  - assign P1/P2/P3/P4 at data-family granularity, separately from evidence nature and project
    transformation; split mixed families;
  - implement independent byte-derived reducers with precedence overlap > unresolved > independent,
    selection overlap > unresolved > verified-no-candidate-reuse, and failed > unresolved > verified
    for authority/currency/integrity; bind complete input/result identities and reject caller verdicts;
  - remove `legacyRowUnionRule`, bind every predecessor's bytes/schema/hash/commit-or-bundle and clean-
    clone reopen method, retain missing historical reviewer provenance as not recorded, and reconcile
    the catalog with the now-184-finding successor universe;
  - turn control intents into fixture/patch/before-after/witness/independent-detector/log artifacts,
    replace stale NC04, and version the distinct raw-media, tracked-text, Git-blob and outer-manifest
    hash domains through a clean `core.autocrlf=true` checkout.

  Reviewer provenance: GPT-5.6-sol ultra, non-author with inherited context. It independently parsed
  the exact bytes; reproduced 28 rows / 24 active rows / 20 source nodes / 59 family records / 50
  unique family IDs / 97 edges / six selection records / seven control intents; re-derived the
  12/14/12 arm counts; and matched all six generated-from hashes and all 15 readable-source hashes.
  `SRC-2109.00098V1-UNREADABLE` reproduced `EPERM`. The reviewer inspected the relevant local source,
  parameter, implementation and protocol records but did not run `npm test`, perform clean-checkout
  rehashing, retrieve missing sources, redigitize Figure 4.5, quantify the M1 crop, or execute controls,
  TAX2, R15 or GPU work. No files were edited.

### V4 exact-byte rejection and V4.1 correction work order

Two fresh read-only non-author reviews bound the exact identities above. Both used OpenAI Codex
`gpt-5.6-sol` at ultra reasoning with shared repository/task context; neither edited files or called
providers. The science/catalog review independently recomputed request arithmetic, registry closure,
catalog membership/edges/hashes, cache accounting and current no-execution state. It rejected the
register/registry/catalog/plan identities with 11 blockers and 6 should-fixes. The artifact review
re-ran the focused 20/20 suite, reconstructed registry counts, inspected ID preimages and executed
adversarial runtime witnesses. It rejected the module/test identities with 8 blockers and 3
should-fixes. Their exact reviewed closure and then-current review records are preserved in
`research/tmp/recovery/wp1-v4-review-rejection-20260803T0440Z.tar` (514,048 bytes / SHA-256
`af1e8e889984bc044f87b379ffca57f3a3434cc28118af8dd86f98c4e203e0e2`). Neither review ran
`npm test`, source acquisition, TAX2, a solver, R15, or GPU work.

The science/catalog findings carried into every successor review are:

- `WP1V4-SCI-B01`: the registry and Section 11 pin catalog v1 while the live successor has materially
  different mapping-level and exact-definition semantics.
- `WP1V4-SCI-B02`: citation traversal is nonunique across roots/depths, title-only members lack a
  global first-depth identity rule, and local arXiv segment roots have no executable relation path.
- `WP1V4-SCI-B03`: Rule 12 omits machine-scheduled OpenAlex forward/author-ID construction and has no
  governed authority-currency subject universe for BIPM/CGPM.
- `WP1V4-SCI-B04`: `include-acquire` has no finite response-derived source acquisition/import request
  universe or terminal reducer, creating a metadata-to-bytes deadlock.
- `WP1V4-SCI-B05`: Yamashita admission is not bound to a reviewed root-to-source lineage or the
  entry's 1987 upper date, so a later or unrelated primary can pass.
- `WP1V4-SCI-B06`: pressure screening misses common two-token `mm Hg`/`mm-Hg` forms.
- `WP1V4-SCI-B07`: the exact mmHg-to-Torr equality has no governed current authority; mmHg must stay
  recognized-unmapped unless a separately frozen authority proves the applicable definition.
- `WP1V4-SCI-B08`: `instrument-repeat-rss-v1` assumes away covariance despite the registered
  never-assume-zero rule.
- `WP1V4-SCI-B09`: reuse or fitting in one arm can incorrectly fail the whole candidate rather than
  the affected arm only.
- `WP1V4-SCI-B10`: active project selection/intervention lineage is only hash-bound, not represented
  as inspectable arm-support evidence, so independence can omit the choices it must audit.
- `WP1V4-SCI-B11`: the six `CATV2-*` findings lack individual text, review provenance, limits and
  exact-byte closure in the registry's prior-finding universe.
- `WP1V4-SCI-SF01`: live review status inside frozen Section 11 self-invalidates when review occurs.
- `WP1V4-SCI-SF02`: this plan's old “scoreable target” outcome exceeded WP1's source-only ceiling.
- `WP1V4-SCI-SF03`: historical plan acceptance must remain scoped to its exact prior bytes.
- `WP1V4-SCI-SF04`: catalog hashing dropped explicit repository-root regular-file, symlink,
  terminal-newline and lone-carriage-return rules.
- `WP1V4-SCI-SF05`: retraction effects and bounded provider-observation currency need exact scope.
- `WP1V4-SCI-SF06`: the Yamashita duration screen omitted the governed SI token `s`.

The artifact/schema findings carried into every successor review are:

- `WP1V4-ART-B01`: language competence and full extractor/OCR/translator/reviewer role separation
  are unenforced; invalid language tags and cross-role self-review pass.
- `WP1V4-ART-B02`: source-review closure accepts rationale segment IDs absent from the reviewed
  segment universe.
- `WP1V4-ART-B03`: exact decimal normalization, rational/unit/conversion derivation and signed-zero
  rejection are fail-open, so the numeric controls cannot close.
- `WP1V4-ART-B04`: pairing, uncertainty and covariance records cannot represent or independently
  recompute the registered science; segment closure, nonnegative variance, PSD and complete-pressure
  coverage are unenforced.
- `WP1V4-ART-B05`: access/source-negative outcomes are unrepresentable, the registered bridge-
  required ceiling is rejected, and final status is producer-selected instead of artifact-derived.
- `WP1V4-ART-B06`: per-page caps permit `returnedCount > capMaximum`, and immutable recovery/orphan/
  collision/concurrent-reservation states are absent.
- `WP1V4-ART-B07`: controls lack exact mutation-patch and mutated-byte identities; review runs omit
  model/context/session provenance and cannot truthfully encode repository-root `cwd="."`; required
  sets are caller-supplied rather than registry-derived.
- `WP1V4-ART-B08`: Section 11's no-review claim is now false and `currencyAsOfUtc=null` still forbids
  candidate review/freeze.
- `WP1V4-ART-SF01`: canonical order is not enforced for covariance terms and other complex arrays.
- `WP1V4-ART-SF02`: 20 positive tests do not exercise the exported surface or any of the 69 governed
  negative controls.
- `WP1V4-ART-SF03`: unresolved provenance categories discard honestly known partial identities.

A second non-author artifact-schema audit then held the same module/test bytes fixed and found a
strict superset of executable failure modes. The reviewer was OpenAI Codex `gpt-5.6-sol` at ultra
reasoning with full inherited repository/task context, had not authored the candidate, made no
edits, and independently verified the complete recovery bundle and all 91 inherited finding IDs.
Its exact result is **12 module blockers / 3 module should-fixes plus 9 combined-freeze blockers /
1 combined should-fix**; all 91 inherited findings remain individually open until one exact
combined executor/fixture/publisher identity closes them. These IDs are additive review provenance,
not renames of the earlier `WP1V4-ART-*` findings:

- `V4AS-B01 SOURCE-GRAPH-CLOSURE`: a single acquired source need not equal its sole inventory
  member, and rationale segment IDs need not exist in the reviewed-segment universe.
- `V4AS-B02 ZERO-BYTE-REVIEW`: zero-byte extraction and translation records can support adequate
  evidence.
- `V4AS-B03 LANGUAGE-ROLE-SEPARATION`: a translation reviewer may be the original extractor.
- `V4AS-B04 EXACT-DECIMAL-GRAMMAR`: `+1e0`, `-0`, and `.5` pass despite the registered decimal
  grammar and negative-zero ban.
- `V4AS-B05 SOURCE-ONLY-STATE-SPACE`: honest zero-row search/access/cap outcomes are impossible,
  while exact positive `source-compatible-bridge-required` is unrepresentable.
- `V4AS-B06 PRESSURE-EVIDENCE-CLOSURE`: unknown pairing/uncertainty evidence and ghost observation
  IDs pass without forward and reverse referential closure.
- `V4AS-B07 PRESSURE-CONTRACT-UNDERDETERMINED`: gas-composition evidence, supersaturation-definition
  identity, pairing design/population/repeat identity, covariance type/coverage, and honest
  missing-uncertainty states are not representable.
- `V4AS-B08 DEFINITIVE-FAIL-RESURRECTION`: an assessment revision can retract the only definitive
  solver-compatibility trigger without a reviewed successor.
- `V4AS-B09 INDEPENDENCE-FALSE-POSITIVE`: caller-supplied row lists can declare independence while
  every required edge points to known-missing local bytes; the module also invents an evidence-class
  field absent from catalog v1.
- `V4AS-B10 REVIEW-CLOSURE-VACUITY-AND-ORDER`: empty required/check/run/control/finding universes and
  reversed arrays pass; command, reviewer provenance/competence, and evidence-log closure are not
  independently derived.
- `V4AS-B11 REDIRECT-VALIDITY`: redirect cycles and non-HTTP(S) `opaque:` targets pass.
- `V4AS-B12 UNSTABLE-CANDIDATE-IDENTITY`: neither candidate file is `-text`; a clean
  `core.autocrlf=true` checkout changes both registered raw SHA-256 identities.
- `V4AS-S01`: BCP-47 case/alias variants have no canonicalization.
- `V4AS-S02`: unresolved candidate provenance discards honestly known partial IDs.
- `V4AS-S03`: governed request and retained response headers admit CR/LF.
- `V4CF-B01` through `V4CF-B09`: the combined freeze still lacks, respectively, exact request/cap/
  traversal construction; scientific graph reducers; independent numeric and compatibility
  recomputation; frozen catalog integration; governed review identity/command/log binding; exact
  fixture/mutation/detector bytes; top-level bundle and publisher recovery authority; raw-byte reopen
  and clean-checkout derivation; and final currency/review/freeze/dispatch identities.
- `V4CF-S01`: frozen Section 11 still contains a live “no reviewer has parsed these bytes” statement.

The second reviewer reran the candidate-focused suite (20/20), both strict root/app typechecks,
Rule 7 (429 files), scoped diff checks, and bundle verification. Exact `npm.cmd test` did **not**
complete: after both typechecks, the timed run had already exposed two rejected source-search
skeleton failures (`base page ordinal is unregistered`; registered freeze commit not an ancestor of
HEAD) and the not-yet-canonically-landed host evidence file being untracked. A separate root rerun
reproduced those same three visible failures before its 180-second timeout. Neither timed execution
has a completed suite count and neither is a green `npm test` claim.

V4.1 corrects both exact review registries above before extending the executor:

1. Preserve catalog-v3 as rejected author-candidate evidence. Build a reviewed successor that
   restores the exact hash domain, binds every active project selection/intervention record, gives
   authority and empirical currency separate closed subject universes, and carries all six
   `CATV2-*` plus every V4 finding as individually governed records. Repin the registry only after a
   fresh mapping-by-mapping 0/0 audit.
2. Amend Section 11 and the registry together: use one global first-depth canonical subject identity
   per entry/direction, register local-segment relation extraction, construct every Rule 12 forward/
   author/authority request, add a finite acquisition stage, bind Yamashita to a reviewed pre-1988
   lineage, recognize spaced mmHg without converting it, remove unsupported covariance assumptions,
   and derive independence per arm. Review status belongs in a separate record, never frozen prose.
3. Correct the artifact foundation with strict runtime schemas and independent reductions for all
   language roles, evidence references, exact decimal/unit conversion, matched-pressure design,
   uncertainty/covariance, source-only dispositions, caps, immutable recovery, review provenance,
   canonical ordering and partial provenance. Each finding receives a non-vacuous negative control.
4. Implement producer and verifier semantic reducers independently. Their transitive import closures
   may share strict byte/schema primitives but not screening, traversal, identity, pressure,
   independence, verdict or control detectors.
5. Re-run focused tests, strict TypeScript, Rule 7, exact `npm test`, clean-checkout verification and
   three fresh exact-byte audits over one combined committed identity. Only a record-only successor
   with 0 blockers / 0 should-fixes may populate the final currency cutoff and authorize the first
   request. Until then every request/import/acquisition/TAX2/solver/publication path remains closed.

### 2026-08-03 shutdown checkpoint — V4.1 offline repairs saved, not frozen

The maker requested a power-off boundary. All three authors stopped without starting a request,
import, publication, TAX2 measurement, solver row, R15 row or GPU run. Current LF working-byte
identities are:

- registry `41a6d4cc3973ff92bd0ecd249cbb122bdf1a874b886f835f0ed1b21b6fc78f17`
  (112,565 bytes), catalog `9ffe4edf928bfa3416ecd064a594da259c0fcc24ad87b2cbc744906d3c2163cb`
  (99,033 bytes), split finding ledger
  `8f08e251754f4e1e2833bd9555b47bdd15903d10b460698f41502eaccbc161b9`
  (98,730 bytes), and Section 11 register
  `89ce2fe79af02ca3bf02e1c79e6a293acf2fdb70ecd60ef7414d24206720ec43`
  (65,594 bytes). The registry and ledger contain the same 150 unique, individually recorded open
  finding IDs. All three JSON files parse. The later catalog-v3 audit adds ten required
  `CATV3-AUD-*` IDs, the restart audit below adds `V4AS-ROOT-B01`, and the exact publisher review
  above adds five distinct `PUB86-*` IDs, so the coherent successor universe at that checkpoint was
  at least 166; the later `PUB144-REV-*` review adds four more, and `V42-ROOT-B01` records that the
  exact bad393 ledger's authority prose still claimed 150 findings and excluded `PUB86-*` even
  though its arrays included 166. A later exact 70-record science audit adds eight `V42-SCI-*`
  findings. Root then added `V4AS-ROOT-B02` for row-source supersets and
  `PUBNEXT-ROOT-B01/B02` after independently reproducing Git replacement-ref and local
  routing/attribute-overlay laundering. Root then reproduced `PUBNEXT-ROOT-B03`: on this NTFS
  host, changing a tracked five-byte file from `AAAA\n` to `BBBB\n` and restoring its exact
  modification time left both porcelain status and diff empty under the successor's exact Git
  flags, while the raw working blob `a07e2435607dcf6da1a9cfdddb160e2f78139a7c` differed from the
  committed blob `b19436197cedccbb7f56852cbdccf7942c6575ad`. The ignored reproducible repository is
  `research/tmp/recovery/git-stat-launder-probe-20260803/`, baseline commit
  `ee93f956fed95d631891c30143b4de04578d8176`. Git status is therefore not byte authority even after
  hidden-index and ambient-config defenses; the successor must force-read and authenticate tracked
  worktree content plus index entries against the named commit. During that repair, root reproduced
  `PUBNEXT-ROOT-B04`: the hand-written clean-byte transform disagreed with installed Git under
  `core.autocrlf=true`. For 100 bytes of `0x01` followed by CRLF, Git retained the raw blob
  `52df86e629209cd48425a92448e2dd59375c3afe` while the local transform produced
  `7d0ace1f19a7dba72842f5c09c3ca18823a4b243`; for `abc\rdef\r\n`, Git retained raw
  `4185411d259997fff6c4ed9a5bc7e57440376ca6` while the local transform produced
  `2c24e136a943fb38967ed2c32d10c56cd07eddce`. The finalizer must use Git's forced content object ID
  after authenticating attributes and excluding external filters, never approximate Git's
  text/binary conversion. The current closed successor universe is therefore 184.
  Neither 150-ID file nor the later exact 179-ID checkpoint may be accepted unchanged. These are
  author checkpoint bytes, not reviewed science.

  The first V4.2 science-author checkpoint records that complete 166-ID universe at isolated commit
  `8ec05aa5a9786c75a6ea26e73fc3fc45fa42f505`, preserved by the complete-history bundle
  `research/tmp/recovery/wp1-v4.2-science-ledger-8ec05aa.bundle` (5,741,517 bytes / SHA-256
  `1fec62b909344c321971569c4cdff5c1e89d8c214b2ae78763ff3f9faf21e2bc`). Its registry is 113,273
  bytes / SHA-256 `82581871f35350347776a7476c23c90400302b5082c7783fc69ac338fe6e048b`, catalog
  99,263 bytes / SHA-256 `204dced485efb52adffba297b63a58f8afb14da4b7eb38acaf26a2cbfd2e2b0e`, and
  finding ledger 113,810 bytes / SHA-256
  `cb93c560d8f972661721f4d3414a3ec737d41b1ca73459dcda7abf91b7116784`. Independent parsing
  confirmed 166 unique, sorted IDs in both registry lists and the ledger; all 166 findings resolve
  to one recorded review round and known candidate identities. The catalog-specific list now carries
  its ten `CATV3-AUD-*` findings. This checkpoint corrects record closure only: its scientific
  catalog mappings and reductions remain an unreviewed V4.1 author candidate and must not be frozen.
  The exact isolated replay `npx.cmd vitest run runner/test/phase6-wp1-artifacts.test.ts
  runner/test/phase6-wp1-source-search.test.ts` passed the artifact suite 20/20 and the source-search
  suite 8/10 (28/30 total), reproducing the already-registered `base page ordinal is unregistered`
  and `registered WP1 freeze commit is not an ancestor of HEAD` skeleton failures. It is not a green
  focused-suite or `npm test` claim.

  A later science-lineage checkpoint is isolated commit
  `bad39369aec25ad319a74b09cde61fe5818d721c`, preserved by complete-history bundle
  `research/tmp/recovery/wp1-v4.2-science-lineage-bad3936.bundle` (5,744,157 bytes / SHA-256
  `b5adc66f77267f08b1fc38fd65f02c8b6d96b29ca2e29055e8d0d7b7414051fb`). Its catalog is
  114,016 bytes / SHA-256 `81fc1b851c35564758ea7b1b202611295d5f953fe5cd74acd123609c1bedd119`.
  Independent local reconstruction finds 28 rows, 24 active rows, 23 source nodes, 68 operand/family
  occurrences, 56 unique family IDs, 68 support records and 146 source edges (134 inspectable, 11
  shared exact-definition and one disclosed nonsupport), with no missing/duplicate support pair,
  source-node or membership. It removes the false CAK crop-metadata digitization support; adds the
  three honestly missing bounded first-depth ESI sources (`1512.03389`, `1302.1231`, and
  `1209.4932`); separates the P1 diffusivity, P2 reference-pressure closure, exact metrological
  definitions and P4 binary64 representations; enriches M1/no-dip lineage symmetrically; and splits
  the inactive FACET broad P2 and SDAK-2 P3 branches. It is a recovery checkpoint, not a V4.2 schema
  candidate: per-family classifications, governed segments/locators, predecessor/domain closure,
  executable reducers and fresh reviews remain open.

  A non-author `gpt-5.6-sol` ultra science audit then inspected the exact 114,913-byte catalog
  (SHA-256 `331f12d18d278301c40d482931b645aead3c3025ad75beba1d9324b0fd87a3d7`) and closed its
  classification over all 70 then-current support records: 9 P1, 30 P2, 13 P3, 14 P4 and four
  outside the solver-input taxonomy. It added `V42-SCI-B01` through `V42-SCI-B08`: family-level
  classification and mixed-family repairs; direct project-transformation support distinct from
  exact-definition authority; corrected shared, M1/no-dip and inactive classifications; missing
  prefactor lineage; and unresolved CAK digitization. After the author split CICE/MMOL, the pressure
  fit/cSat derivation and printed/corrected spherical relations, the current unreviewed catalog has
  73 support records / 60 unique families / 157 source edges. The registry and finding ledger now
  carry the same sorted 179-ID universe at exact identities
  `5cbbc4c68493de75dc12cd69e7300ee754b40f87aa17f1d8454bee5a177f3309` (113,819 bytes) and
  `dca6ed1e893294512a69cbd575653a95d19f4ddec096a769cd53ee48445def27` (130,560 bytes).
  Root independently reparsed the four arrays as sorted, unique, 179-count and set-equal. The catalog
  is 118,638 bytes / SHA-256 `7e339da8512abddcf1a0d099b36d3fc7acb5874d7526420e95ac486099653865`.
  Recovery commit `14c6303e7d222e9a45be1b04c06776ac8032d045` is preserved by verified complete-history bundle
  `research/tmp/recovery/wp1-v4.2-science-audit-14c6303.bundle` (5,749,782 bytes / SHA-256
  `e85f747b88d13a417a1d26d32688885aaaed1404edc9fe83f6d2182f0136d95d`). JSON parsing,
  exact derived counts, set equality, `git diff --check`, and Rule 7 over 430 files passed before
  commit. This is an author-response recovery checkpoint; every finding remains open until exact
  combined non-author review.
- artifact module `9db4d735fb0137472d91419f3a42895f4cb8e3a1415fb07fdbb41c678c10c19f`
  (220,080 bytes) and test
  `530fe444a366ba2227984cf8bed94e4c85a5c2449062f24de60dda56d7d7079a`
  (47,020 bytes). Strict TypeScript and the existing focused 20/20 tests pass. The new V4AS paths
  still need non-vacuous regressions, including the already-built but not yet invoked complete
  pressure fixture; paginated/archive inventory rules still need a contract audit. V4CF-B01 through
  B09 and V4CF-S01 remain combined-freeze blockers.

  The restart contract audit now records `V4AS-ROOT-B01 PAGINATED/ARCHIVE-INVENTORY-AUTHORITY`.
  `validateWp1SourceReviewClosure` binds a sole `single` member to the source bytes, but for
  `paginated` and `archive` containers the member universe, locators, member hashes, and completeness
  are caller-supplied and are never derived from or reopened against the container. An executed
  witness paired a one-byte archive descriptor with a fabricated 999-byte
  `../../outside-the-archive.txt` member and a fully adequate reviewed segment; the closure accepted
  one segment. The successor must bind an exact container reader/parser/version, derive normalized
  member/page identity and ordering from reopened bytes (or an explicitly hash-bound canonical page-
  set descriptor), reject traversal/case/Unicode aliases and duplicates, and bind every inventory
  member identity to the container. Aggregate multi-page cap and continuation completeness remain a
  separate required reduction; a per-page cap parser cannot establish them.
- isolated reusable publisher module
  `b6693f8301c885bf196d82c9822ea2de533571b570687f49217d8147cc8f10cd`
  (39,060 bytes) and test
  `081dcee73ab9e0fa6807a8b123dee54ae42d15d8303be6bc17aa9af203b28b25`
  (25,619 bytes). Its focused plus existing Gate 4 caller suites pass 75/75, both TypeScript checks
  pass, and Rule 7 is clean over 431 files. Real child-process kills cover empty, mid-tree,
  pre-rename and post-rename recovery; ancestor-link attacks are rejected. It is not integrated or
  independently reviewed. The manifest result remains caller-reported with repository publication
  explicitly open; power-loss and general multiwriter guarantees are not claimed.

Exact `npm test`, clean-checkout verification, combined executor/verifier/fixtures, independent
reviews and the record-only freeze have not run. `.gitattributes` now marks all named WP1 protocol,
source/test and publisher paths `-text`; verify the effective attributes and clean-checkout hashes
after restart before treating these working-byte identities as checkout-stable. `.gitignore` now
explicitly admits `research/phase6-wp1-review-findings.json`; verify that exception from a clean
checkout. The complete concurrent shutdown observation is preserved in
`research/tmp/recovery/wp1-v4.1-concurrent-shutdown-20260803T051306Z.tar` (927,744 bytes / SHA-256
`9acc7f9c8fbd8e3502bacb382245e422a80c1b2bed0ac50c6e257409fa457f25`); it is recovery evidence,
not acceptance.

The broader selected working set is also preserved at detached recovery commit
`23e3dcd57011fdc55cfb1d364919c7f19f8fb8ac` and verified complete-history bundle
`research/tmp/recovery/phase6-poweroff-23e3dcd.bundle` (5,728,449 bytes; SHA-256
`fa3c7407ce48aaf0d8be7d7fab9ba70224ac8efbf0369559f949cdca06639d1c`). An independent byte read
from that commit reproduced all eight governed hashes above. That commit predates the later pointer
prose and `.gitignore` exception and is a recovery anchor, not the required canonical freeze.
Successor recovery commit `1a99f4ce0af2199df202b46b8a4b17dc958626e4` contains those two
recordkeeping corrections; verified complete-history bundle
`research/tmp/recovery/phase6-poweroff-final-1a99f4c.bundle` is 5,738,073 bytes with SHA-256
`f5ca213318939d26fb307de194f2786348e65fef819a0634f5b11688b8a8b7c8`. This final pointer is
necessarily outside the bundle, and neither detached commit is a combined freeze.

One offline solver-side primitive is already implemented but grants no bridge authority:
`crystallographicSpans()` in `core/src/metrics.ts` (30,010 bytes, SHA-256
`51d51d6bad0c177514292f3a46e7f03efbff63cb5b7d9f2fd54dde7e09e78080`) computes integer
`basalCaliper2` and `zLayers`. Its focused test (22,569 bytes, SHA-256
`5525c7b4cea80f55440edbd451f583457046b45f138c392514ad1644f08931f9`) passes 32/32, proves every
D6 planar transform plus z reflection on an asymmetric shape, and closes the old rotation-dependent
`tExtent` 2-to-3 witness. This establishes only an exact lattice caliper primitive. No external
observable mapping is registered, partial fill supplies no subcell geometry, and WP2 must still
bound grid/extrapolation error before any physical comparison.

- [ ] Execute `YAMASHITA-FREEFALL-LINEAGE-01`, beginning from authoritative `1910.06389v2`
  Figure 6.22 (printed p. 234 / PDF p. 235), Figure 7.21 (printed p. 268 / PDF p. 269), and the
  `[1987Kob]` bibliography entry (PDF p. 508). Figure 6.22 identifies Yamashita measurements after
  200 seconds via `[1987Kob]`; Figure 7.21 identifies the same Yamashita points and cross-references
  Figure 6.22. Inspect the 1987 book's own credits and references, then trace backward to the
  original Yamashita publication or dataset. Record authorship, title, year, venue, stable
  identifier, source bytes if available, and whether it reports pressure, temperature,
  supersaturation, growth time, seed/population, dimensions, sample size, and uncertainty.

- [ ] If the Yamashita primary source cannot be recovered, record every catalog, repository, query,
  candidate, access failure, and backward/forward citation route attempted. Keep the reproduced
  curve as secondary-source reconnaissance and do not infer missing conditions or uncertainty from
  the graph.

- [ ] Execute `MATCHED-AIR-PRESSURE-01`. A candidate is matched only if the same experimental
  lineage controls apparatus, gas composition, temperature, supersaturation, growth duration,
  seed/crystallography or population definition, ventilation/support state, and observable while
  varying numeric background air pressure. Record covariance and missing variables explicitly.

- [ ] For every pressure candidate, decide independently whether the current solver can predict its
  observable without fitting an unobserved initial state or omitted load-bearing physics. Do not
  derive a tolerance from the Takahashi 860/1010 mb cross-study comparison.

- [ ] Before freezing any newly found candidate, check its latest version, official
  errata/corrigenda, and later same-author primary work for anything that supersedes or qualifies
  its methods, values, or interpretation. Record the search and cutoff under Rule 12.

- [ ] Write the exact `TAX2-PANEL-SPAN-01` operator into
  `research/phase6-tax2-panel-span-preregistration.md`. It must freeze, before source execution:

  - exact PDF and page-render identities;
  - the measurement-input contract: renderer/tool and version, exact arguments, PDF page and crop
    boxes, DPI, output pixel dimensions, color/transparency-channel handling, resampling, and a deterministic
    render/hash check; if already-rendered bytes are the input, bind them explicitly and include a
    pre-registered renderer/resampling sensitivity;
  - the complete panel universe and blank-cell rule;
  - crop/grid registration and field-of-view label parsing;
  - foreground, c-axis needle, overlap, and ambiguity rules;
  - the definition of maximum two-dimensional projected crystal span;
  - conversion from pixels to micrometres;
  - truncation, boundary-touch, and refusal rules;
  - segmentation failures, with no silent exclusion;
  - repeat/perturbation measurements and uncertainty composition;
  - output schema, ordering, canonical serialization, and digests;
  - machine-readable bundle and row labels `inSampleForM1=true`, `geometry=c-axis-needle`,
    `observable=2d-projected-span`, and `passEligible=false` (or an exact versioned schema with the
    same fail-closed meanings);
  - negative controls for blank panels, scale mutation, field-of-view substitution, needle
    inclusion, boundary truncation, and malformed labels; and
  - the independently selected remeasurement sample and acceptance rule.

  Prior visual inspection of the TAX2 plates and historical CAK/M1 output is already part of
  repository history and cannot be undone. The defensible procedure is prospective: freeze the
  operator before any new R15 output, make its implementation consume no model result, and keep
  target selection independent and predeclared. No personnel blinding to historical output is
  claimed.

  Any post-extraction change to rendering, crop, scale, segmentation threshold, operator, or
  implementation creates a new versioned operator ID, preserves the old operator and outputs,
  receives fresh independent review, and forces full re-extraction. Panel-specific fixes after
  seeing spans are forbidden.

- [ ] Commit the TAX2 pre-registration and deterministic implementation, then obtain a non-author
  review before executing it against pages 11–14. The reviewer records model/context provenance,
  what was independently rerun, and what was not checked.

- [ ] Execute the accepted operator against every registered panel. Retain refusals and censored
  observations. Publish only derived numeric records, audit metadata, source/operator digests, and
  summaries under `evidence/phase6-tax2-panel-span-01/`; keep copyrighted image bytes and diagnostic
  renders ignored under `research/`.

- [ ] Review the TAX2 result without consuming or comparing model output during that review, while
  explicitly acknowledging prior knowledge of historical CAK/M1 results. State it only as a
  measured two-dimensional projected span for the source's c-axis-needle geometry. Do not call
  field-of-view width a crystal span, reconstruct an unobserved three-dimensional maximum dimension,
  or promote the corpus to held-out M1 validation.

- [ ] Update `research/phase6-source-currency.md` and, only if warranted, a new versioned candidate
  lock plus verifier. A selected target freezes only when independence, geometry, transport,
  observable, and uncertainty all pass. Otherwise record the exact blocker and leave
  `passEligible=false`.

- [ ] Run exact `npm test`, the applicable source/lock verifiers, and `git diff --check`. Record
  exact commands, counts, artifacts, reviewer provenance, and limits in the active records. The
  applicable manifest check includes
  `npx.cmd vitest run runner/test/evidence-integrity.test.ts` against every new evidence file.

- [ ] Keep `docs/PROGRESS.md` cold-resumable with exact completed question IDs, source and evidence
  paths, lock status, remaining blocker, next file, and next command. Update `docs/HANDOFF.md` only
  when the maker explicitly requests a stop/restart handoff.

## Out of scope

- R15 production rows, numerical-control execution, GPU cohorts, and the flagless Phase 6 gate.
- Implementing a c-axis electric-needle seed, latent heat, ventilation, substrate, sublimation,
  polycrystal, rim, or step-source physics.
- Choosing a convenient physical size from model output or from the rejected 100–300 µm ranges.
- Treating TAX2 as held-out evidence for M1.
- Treating a two-dimensional projection as an observed three-dimensional extent.
- Education-site work, which remains frozen until Phase 6 is complete.
- Claiming the searches exhaust all past or future literature.

## Tried and rejected

### Exact v2 finding registry carried into v3 review

V3 reviewers must disposition every ID below; a grouped assurance is not closure. The exact rejected
bytes and reviewer provenance/limits are recorded above.

- `V2-SCHEMA-B01`: assessment `schedulingWitnesses` was mandatory but undefined.
- `V2-SCHEMA-B02`: both `entryEvidence.kind` discriminators lacked permitted literals.
- `V2-SCHEMA-B03`: citation evidence could support load-bearing claims without adequate review.
- `V2-SCHEMA-B04`: source-review provenance could not establish reviewer kind, context or
  disjointness.
- `V2-SCHEMA-B05`: the positive/nonzero decimal grammar could not encode ordinary negative or zero
  Celsius inputs and left conversions unstated.
- `V2-SCHEMA-B06`: pressure output conversion and uncertainty were author-selected rather than
  independently recomputable.
- `V2-SCHEMA-B07`: the independence edge universe contradicted the arm-specific catalog arrays.
- `V2-SCHEMA-B08`: an independence edge could pass with empty claim/segment evidence.
- `V2-SCHEMA-B09`: currency alternated between effective heads and every historical descriptor.
- `V2-SCHEMA-B10`: entry-specific scheduling used stale occurrence screen state.
- `V2-SCHEMA-B11`: source inputs omitted manual page-source bytes and had ambiguous path roots.
- `V2-SCHEMA-B12`: “active catalog source-node” had two incompatible derivations.
- `V2-SCHEMA-B13`: reviewer-assignment rows lacked the key required by heterogeneous ordering.
- `V2-SCHEMA-B14`: checkpoint review ordering was incomplete and contributor/provenance equality was
  contradictory.
- `V2-SCHEMA-B15`: `reviewedAssessmentRevisionIds` named a descriptor hash that did not exist.
- `V2-SCHEMA-B16`: mandatory reexecution was self-attested and required an impossible verifier mode.
- `V2-SCHEMA-B17`: the required review set omitted CLI, transitive code and other load-bearing bytes.
- `V2-SCHEMA-B18`: preparation/publication artifact sets, roots and verifier inputs were
  underdetermined.
- `V2-SCHEMA-SF01`: entry wording referenced a stale independence field.
- `V2-SCHEMA-SF02`: null-byte authoritative external nodes had no explicit fail-closed treatment.
- `V2-SCHEMA-SF03`: media-type inventory mapping and tool/version were not frozen.
- `V2-SCHEMA-SF04`: alias-history prose conflicted with final-state-only derivation.
- `V2-SCHEMA-SF05`: the location and immutability of the eventual 0/0 review record were unclear.
- `V2-SCIENCE-B01`: a fabricated or wrongly converted pressure output row could pass without
  source-segment, transcription, unit, solver-mapping or governed-repeat binding.
- `V2-SCIENCE-SF01`: TAX2 said `REGISTERED` inside a globally unregistered candidate.
- `V2-PUBLICATION-B01`: mandatory review invoked a verifier mode forbidden by the verifier's closed
  mode set.
- `V2-PUBLICATION-B02`: negative controls lacked frozen IDs, mutations, witnesses and detectors.
- `V2-PUBLICATION-B03`: review runs were self-attested and their generated logs were not tracked.
- `V2-PUBLICATION-B04`: review closure omitted load-bearing dependencies and allowed a shared
  semantic-reducer attack.
- `V2-PUBLICATION-B05`: successor review could omit earlier rejected findings.
- `V2-PUBLICATION-B06`: heterogeneous publication-review rows had no deterministic total order.
- `V2-PUBLICATION-B07`: ignored recovery scratch under `evidence/` conflicted with the tracked
  evidence boundary and integrity test.
- `V2-PUBLICATION-B08`: the bespoke publisher/review/recovery stack duplicated the shared evidence
  seam without a justified new attack surface.
- `V2-PUBLICATION-SF01`: contributor/model disjointness was free-text and its attestation limit
  understated.
- `V2-PUBLICATION-SF02`: the active plan still carried stale “not integrated” prose.
- `V2-PUBLICATION-SF03`: durable publication lacked an explicit commit, clean-checkout verify and
  exact `npm test` boundary.

### Exact v3 rejection registry carried into v4 review

Three non-author reviews bound the same v3 bytes and confirmed unchanged identities before and
after. The schema and publication reviewers used OpenAI Codex `gpt-5.6-sol` at ultra reasoning with
full inherited context. The science reviewer used the same model/reasoning and inherited context but
worked a separate read-only science scope. None edited or browsed. Together they independently parsed
the registry/catalog counts and identities; reconstructed the 243 base combinations; inspected the
relevant solver metrics and shared publisher; and checked inherited findings within their scopes.
They did not call providers, acquire/translate sources, run the untracked executor, execute controls,
build/publish a bundle, run exact `npm test`, measure TAX2, run the solver, or assess source truth
beyond the frozen records. V4 reviewers must disposition every ID below.

- `V3-SCHEMA-B01`: request identities, initial ordinals and response-driven pagination DAG were not
  uniquely constructible.
- `V3-SCHEMA-B02`: citation and Rule 12 expansion omitted exact truncation, query/author and
  partial-date rules.
- `V3-SCHEMA-B03`: attempt/result/retry/crash schemas and concurrent reservation authority were
  incomplete and race-prone.
- `V3-SCHEMA-B04`: provider projections/rank, screening normalization, identifier reduction and the
  opaque route contract were not reproducible.
- `V3-SCHEMA-B05`: assessment/source/inventory/segment/relation/edge payloads remained prose-only;
  `assessmentId` was self-referential.
- `V3-SCHEMA-B06`: the claimed clean-checkout semantic rederivation required ignored response,
  source and extraction bytes that the checkout did not contain.
- `V3-SCHEMA-B07`: matched-pressure admission failed to require air, positive supersaturation,
  supported temperatures or a computable match/confound operator.
- `V3-SCHEMA-B08`: controls, fixtures, review checks, prior findings and import closure could execute
  vacuously or could not be reconstructed.
- `V3-SCHEMA-B09`: final payload schemas/order and shared-publisher wrapper inputs were not frozen.
- `V3-SCHEMA-B10`: the no-scratch crash claim contradicted the shared publisher's possible orphaned
  staging directory.
- `V3-SCHEMA-SF01`: active plans quoted charter v1.19 after charter v1.20 was accepted.
- `V3-SCHEMA-SF02`: the stated unresolved source-node set omitted BIPM/CGPM no-local-byte nodes.
- `V3-SCHEMA-SF03`: the immutable location/format of the eventual acceptance record was unnamed.
- `V3-SCIENCE-B01`: backward/forward citation roots, qualifying roots and recursively expanded
  relation members were undefined, so conforming executors could search different graphs.
- `V3-SCIENCE-B02`: correction/version/same-author Rule 12 construction, authors, dates and derived
  pagination were underdetermined.
- `V3-SCIENCE-B03`: pressure values need not be distinct and load-bearing conditions could differ as
  unspecified “pressure-specific measured inputs,” admitting confounded comparisons.
- `V3-SCIENCE-B04`: pressure screening did not require a number and omitted common `Pa`, `kPa`,
  `Torr` and `mmHg` forms, creating systematic false-negative exclusions.
- `V3-SCIENCE-B05`: transverse-span mappings used `latticeExtents.tExtent`, a rotation-dependent
  trigger span rather than an objective Cartesian physical observable; the existing aspect-ratio
  denominator also changed under the reviewer's explicit 60-degree witness.
- `V3-SCIENCE-SF01`: all three arms also referenced BIPM/CGPM no-local-byte nodes, so the current
  unresolved-set prose was incomplete or the exact-definition policy needed correction.
- `V3-SCIENCE-SF02`: source decimal handling omitted common printed and scientific-notation forms or
  a traceable normalized-transcription field.
- `V3-PUBLICATION-B01`: hard kills can orphan shared-publisher staging or leave a renamed bundle
  before `evidence/MANIFEST.json`; recovery authority was undefined.
- `V3-PUBLICATION-B02`: the 20 symbolic fixtures and alternative-worded mutations were not exact,
  governed bytes.
- `V3-PUBLICATION-B03`: the attacked verifier also executed and witnessed its mutations, violating
  independent negative-control proof.
- `V3-PUBLICATION-B04`: published-byte rederivation was impossible without the ignored raw/source/
  extraction bytes.
- `V3-PUBLICATION-B05`: review payload schemas, ordering, required commands, logs and check-to-
  evidence mapping were underdetermined.
- `V3-PUBLICATION-B06`: the 36 inherited findings existed only in mutable plan prose, not a governed
  machine registry bound into semantic closure.
- `V3-PUBLICATION-B07`: contributor IDs hashed mutable/free-text attestations, allowing one session
  to appear disjoint by changing wording.
- `V3-PUBLICATION-SF01`: the transitive import-resolution algorithm and permitted shared exports were
  not frozen.
- `V3-PUBLICATION-SF02`: the durable post-commit clean-checkout result, tested commit, logs and
  acceptance verdict had no named record.

### Independent v3 review round 2 carried into v4 review

A second read-only non-author round bound the same rejected v3 register, registry, and catalog
identities before any v4 edit. The three OpenAI Codex reviewers used `gpt-5.6-sol` at ultra
reasoning with full inherited repository/task context, but worked in separate schema, science, and
publication scopes and made no edits. The science review rejected 5 blockers / 1 should-fix; the
schema review rejected 12 / 2; and the publication/recovery review rejected 5 / 1. They independently
parsed the governed files, inspected the relevant runner/solver/shared-publisher contracts, reran the
v3 consistency validator, and, in the publication scope, reran the focused Gate 4 and evidence-
integrity suites (51/51). They did not call a provider, acquire or translate sources, run TAX2 or the
solver, execute the untracked source-search skeleton, publish evidence, perform a clean checkout, or
run exact root `npm test`. These are independent overlapping attacks, not added counts of unique
defects. V4 reviewers must disposition their deltas as well as the first-round registry above.

- `V3R2-SCHEMA-B01`: the exact JSON schemas remained undefined and `assessmentId` depended on the
  object that was supposed to contain it.
- `V3R2-SCHEMA-B02`: the global page schedule contradicted the entry-specific route/page counts.
- `V3R2-SCHEMA-B03`: citation and Rule 12 expansion remained unbounded or non-unique.
- `V3R2-SCHEMA-B04`: the immutable attempt state machine omitted reachable reservation, partial,
  retry, interruption, terminal, and concurrent-writer transitions.
- `V3R2-SCHEMA-B05`: assessment revision and source-replacement rules could leave stale accepted
  heads or ambiguous authority.
- `V3R2-SCHEMA-B06`: the reduction from attempts and assessments to success, unresolved, or
  definitive failure was not defined.
- `V3R2-SCHEMA-B07`: independence could pass with a nonempty but scientifically vacuous edge set;
  it did not require coverage of the candidate and every active operand data family/source node.
- `V3R2-SCHEMA-B08`: pressure transcription, conversion, covariance, uncertainty, and solver-output
  bindings remained underdetermined.
- `V3R2-SCHEMA-B09`: review-result schemas, required commands, finding closure, and evidence mapping
  were not exact.
- `V3R2-SCHEMA-B10`: registered controls were symbolic enough to execute vacuously or described
  mutations that the named witness could not independently prove.
- `V3R2-SCHEMA-B11`: shared-publisher options, staging topology, recovery authority, and the clean-
  checkout boundary remained underdefined.
- `V3R2-SCHEMA-B12`: the hash-registered prose register was not `-text`, while the catalog's
  `generatedFrom` hash domain did not say raw, LF-normalized, filtered, or Git-blob bytes.
- `V3R2-SCHEMA-SF01`: the validator's claim that it checked all source hashes exceeded the set of
  source bytes it actually reopened.
- `V3R2-SCHEMA-SF02`: closure prose omitted the BIPM/CGPM authoritative nodes that the governed
  operand catalog named.
- `V3R2-SCIENCE-B01`: a historical eligibility cutoff was used as if it were an actual
  freeze-time source-currency observation; no final `currencyAsOfUtc` was bound.
- `V3R2-SCIENCE-B02`: 243 route/query combinations were mislabeled as page requests; the frozen
  initial-page schedule was not uniquely derived and had no exact root/seed set.
- `V3R2-SCIENCE-B03`: source conditions were not bound to the LK solver's supported temperature,
  positive maintained supersaturation, pressure, duration, and checkpoint/output domain; current
  `grow-lk` also has no pressure argument and defaults to 101325 Pa.
- `V3R2-SCIENCE-B04`: proposed output mappings were not objective, physically comparable observables;
  lattice trigger span, projection/fill definitions, and the comparison endpoint remained unfrozen.
- `V3R2-SCIENCE-B05`: uncertainty pairing, covariance, repeated-measurement reduction, and contrast
  propagation were insufficient to define a quantitative pressure comparison.
- `V3R2-SCIENCE-SF01`: source language, translation/OCR competence, tool identity, and human-review
  adequacy should be machine-checkable where they support a load-bearing claim.
- `V3R2-PUBLICATION-B01`: the register's exact bytes were not stable under a clean Windows checkout;
  with `core.autocrlf=true`, the reviewed LF bytes would become a different registered object.
- `V3R2-PUBLICATION-B02`: the global 243-stage claim contradicted the entry-specific 108/135 route-
  query roots and therefore could not drive one deterministic schedule.
- `V3R2-PUBLICATION-B03`: recovery after a real process kill or a crash between bundle rename and
  manifest finalization had no authoritative, non-destructive reducer.
- `V3R2-PUBLICATION-B04`: the acceptance-review verdict was not machine-closed over required checks,
  logs, prior findings, and the exact reviewed closure.
- `V3R2-PUBLICATION-B05`: the final shared-publisher call, option set, schemas, fixtures, transitive
  imports, semantic independence, and future-behavior boundary remained underdefined.
- `V3R2-PUBLICATION-SF01`: Section 11's statement that no reviewer had parsed the registry became
  false as soon as review occurred; reviewer observations belong in an append-only external review
  record rather than the frozen scientific protocol.

The rejected lean v3 candidate identities are register SHA-256
`957216d13166140588e85bd684f6108c0da53a538e48571301012983610371a2` (52,764 bytes / 704 LF
lines), registry SHA-256 `81dbfd2b50535f956240712210cd0c0f331a9c6baf32841319603267a69f3733`
(28,565 bytes / 349 LF lines), and unchanged catalog SHA-256
`dc15d1808b5446eb80dc21c07165510e12ad3d89b41376c66924ffc775585963` (23,791 bytes / 528 LF
lines). Recovery commit `6b19839c8917a61df4ebada882623960e81edb85` and verified bundle
`research/tmp/recovery/wp1-v3-checkpoint-6b19839.bundle` preserve them. They are rejected evidence,
not accepted/frozen identities.

- **Use `[1987Kob]` as the original Yamashita source.** Rejected. The authoritative monograph
  bibliography resolves it to T. Kobayashi and T. Kuroda, *Snow Crystals: Morphology of Crystals —
  Part B*, Terra Scientific, Tokyo, 1987. The monograph's Figures 6.22 and 7.21 make that book a
  backward-trace lead, not the original Yamashita publication or dataset. No book figure number or
  original citation is currently established from admissible tracked evidence.

- **Infer missing pressure or uncertainty from the reproduced Yamashita curve.** Rejected. The
  current tracked extracts do not establish those source conditions.

- **Use the Takahashi 860/1010 mb ratio as a pressure target.** Rejected. The comparison changes
  liquid-water content, temperature behavior, apparatus/run population, ventilation,
  polycrystallinity, and riming along with pressure.

- **Use Kuroda/Gonda/Gomi as already matched-pressure evidence.** Rejected. The audited studies
  change substrate, gas species, or other load-bearing conditions.

- **Use a TAX2 field-of-view label as crystal size.** Rejected. It is the width of the square image,
  not the observed crystal span.

- **Select visually convenient or model-favorable TAX2 panels.** Rejected. The complete registered
  panel universe executes, and failures remain visible.

- **Use TAX2 as independent M1 validation.** Rejected. TAX2 defines M1 and shares its 206-observation
  c-axis-needle corpus.

- **Freeze one value from the broad 100–300 µm reconnaissance ranges.** Rejected. Those ranges do
  not define an apples-to-apples endpoint for the current solver.

## Open questions

- Can the original Yamashita publication or dataset be identified and acquired by following the
  `1910.06389v2` Figures 6.22/7.21 → `[1987Kob]` chain into the 1987 book's credits and references?
- Does a primary experiment exist within the recorded search cutoff that varies air pressure while
  holding all other load-bearing conditions sufficiently fixed?
- Can one uniformly applied, prospectively frozen segmentation operator produce auditable spans
  across all TAX2 panels without panel-specific tuning, and how many observations must be refused
  or treated as censored?
- Even if TAX2 spans are extracted successfully, does any later accepted c-axis-needle
  implementation make them usable beyond an explicitly in-sample M1 comparison?

## Plan review provenance and limits

The plan-acceptance review used OpenAI Codex `gpt-5.6-sol` at ultra reasoning. The reviewer was a
read-only non-author with full inherited task/repository context and known historical CAK/M1 output.
It independently read this plan, the parent WP1/WP2 dependencies, `docs/PROGRESS.md`, the relevant
and complete handoff sections, Phase 6 charter clauses, the source-currency record, candidate lock,
Phase 6 lessons, and Rules 2, 6, 10, 12, and 13. It independently compared the verbatim charter
quotation; parsed the lock as `passEligible=false` with five byte-bearing sources, 16 traces, and 21
pinned/excluded/data members; hashed the TAX2 PDF and four 2550×3300 page renders; visually checked
four blank cells on page 11 and six on page 14, consistent with `24×9−10=206`; resolved the plan
link; and ran Rule 7 clean over 420 files, the progress-index suite 7/7, `git diff --check`, and an
untracked-file whitespace/BOM/final-newline audit. It returned 0 blockers / 0 should-fixes after the
Yamashita source-chain, search freeze/stopping, source-currency, renderer, manifest, anti-tuning,
historical-output knowledge, non-English source, and machine-readable scope corrections above.

It did not browse; acquire or translate the 1987 book or original Yamashita source; execute either
literature search; implement or run TAX2 extraction; validate segmentation uncertainty; inspect all
206 spans; run solver, R15, or GPU work; inspect education; run the source-lock verifier,
evidence-integrity suite, or exact root `npm test`; or assess copyright law beyond the repository's
path policy. Those are limits of this plan review, not evidence that the later work passed.
