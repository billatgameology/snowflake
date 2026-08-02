# Plan — Phase 6 WP1 source lineage and TAX2 panel spans

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-02
- **Last touched:** 2026-08-02 by OpenAI Codex (`gpt-5.6-sol`, ultra reasoning)
- **Parent plan:** [phase-6-science-first-completion.md](phase-6-science-first-completion.md)

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

This work may freeze a validation target only if source independence, geometry, transport physics,
observable definition, and uncertainty all pass. A documented source-limited result is an honest
WP1 outcome, but it does not complete the Phase 6 charter gate or make the candidate lock
pass-eligible.

## Done when

Current accepted charter v1.19, verbatim:

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the versioned protocol freeze (item 1) makes every authorized change auditable and invalidates prior sweep evidence for the replacement gate after a post-freeze edit.

This subordinate plan is complete when every search is cold-resumable from its tracked register;
the Yamashita lineage resolves to a primary source or ends in a scoped search-negative record; the
matched-pressure search yields either a scoreable target or a source/model-scope blocker; the TAX2
operator is committed and reviewed before numeric extraction; all acquired bytes and derived data
have reproducible provenance; and the candidate-lock disposition, `docs/PROGRESS.md`, and
`docs/HANDOFF.md` state the exact outcome and next dependency.

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

## Steps

- [x] Add the three open entries to `research/phase6-source-currency.md`. Each begins explicitly
  `UNEXECUTED` and freezes the search scope/stopping fields above before execution; a known pointer
  is not recorded as a completed search. Section 11 now fixes 243 base query-route combinations,
  derived citation/Rule 12 routes, finite traversal, admission rules, entry-specific atomic
  checkpoints and durable evidence schemas. Three offline non-author review slices returned 0
  blockers / 0 should-fixes on the initial register. A pre-implementation audit then exposed
  underdetermined byte identities, manual-capture/header outcomes, entry ownership and evidence
  publication details. The dated Section 11 amendment fixes those choices before code or execution;
  a no-shared-chat-context `gpt-5.6-terra` high-reasoning non-author review closed at 0 blockers / 0
  should-fixes after three rounds, but a later broader schema/Rule 9 audit reopened that scoped
  verdict. The broader inherited-context `gpt-5.6-sol` non-author review closed the current bytes at
  0 blockers / 0 should-fixes after exact identity, witness, verifier and crash-recovery corrections.
  No request or numeric extraction ran.

- [ ] Implement the deterministic source-search executor, entry-specific checkpoint/resume path,
  normalized occurrence/candidate ledgers, and evidence publisher exactly from Section 11 in
  `runner/src/phase6-wp1-source-search.ts`, with CLI wiring in
  `runner/src/phase6-wp1-source-search-main.ts` and focused tests in
  `runner/test/phase6-wp1-source-search.test.ts`. Pin the
  register/executor/source identities and reject tracked dirty state. Tests must prove rejection of
  an unregistered route/query, tampered response/checkpoint, shifted cursor-parent hash, malformed
  identifier, conflicting identity bridge and manifest mutation; prove resumable no-response and
  cap/access terminal states; and prove a late component merge cannot rename a scheduled request.
  The focused command is
  `npx.cmd vitest run runner/test/phase6-wp1-source-search.test.ts`. Obtain a non-author
  code/evidence-boundary review before the first live request.

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

- [ ] Make `docs/PROGRESS.md` and `docs/HANDOFF.md` cold-resumable: exact completed question IDs,
  source and evidence paths, lock status, remaining blocker, next file, and next command.

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
