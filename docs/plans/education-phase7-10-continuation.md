# Plan — education continuation through Phase 10

- **Phase:** Cross-phase education reconciliation — Phases 6–10
- **Status:** implementation complete and review-corrected (2026-09-03); exact repository-suite closure pending
- **Started:** 2026-09-02
- **Last touched:** 2026-09-03 by Claude (independent review pass and corrections)
- **Branch/worktree:** `docs/education-phase10` at
  `G:\Code Files\snowflake-education-phase10`

## Goal

Continue the learner-facing course from its frozen Phase 6-era ending through the project's
current Phase 10 boundary. Preserve the established audience and visual language: a smart teenager
should be able to understand the physics, numerical methods, evidence rules, and negative findings
without programming experience. The continuation must leave the historical Phase 6 story legible
while making the present status unmistakable: Phase 6 closed on an accepted negative finding,
Phase 7 has not started, Phases 8 and 9 completed as development work, and Phase 10 completed as a
negative package without validation credit.

## Done when

The public-source course has four new navigable chapters covering Phases 7–10; each chapter has a
plain-language question, learning goals, concrete examples, at least three working interactive
teaching models, source/limit captions, and a handoff to the next chapter. The index, Chapter 29,
course manifest, and education verifier agree on the current phase states. Historical Phase 6
measurements remain labeled measured-only; final Phase 6, 8, 9, and 10 claims match the named
current artifacts; Phase 7 remains explicitly not started. `node docs/education/tools/verify.mjs
--public-only`, `node docs/education/tools/build-local.mjs`, a focused visual QA capture of the
index and four new chapters, the Rule 7 scan, `git diff --check`, and exact `npm test` all pass on
the final bytes. A proportionate skeptical content pass finds no unsupported scientific upgrade or
stale active-phase wording.

## Approach

1. Use Chapter 30 as the bridge rather than rewriting Chapters 14–29 into a different historical
   narrative. Its first job is to close the old cliffhanger with the final Phase 6 result; its
   second is to distinguish Phase 7's chartered product design from completed implementation.
2. Use one chapter per later completed science/evidence phase:
   - Chapter 31: Phase 8's heterogeneous laboratory record and why 51 records are not one score.
   - Chapter 32: Phase 9's cheapest-discriminator method and all-no-pass result.
   - Chapter 33: Phase 10's evidence bridges, absolute-reference attempt, infrastructure stop, and
     complete-negative closure.
3. Build original SVG/HTML teaching models from committed aggregate values. Do not publish source
   figures or private/NAS data. Every interactive says what it encodes and what it cannot prove.
4. Reconcile the existing Phase 6 education oracle at the narrow status boundary. Retain its
   detailed historical sweep checks, but derive the current teaching state from the final Phase 6
   closure artifacts and live progress record instead of the retired handoff snapshot.
5. Extend the existing generic browser verifier and site manifest rather than creating another
   verification framework. Add only targeted semantic checks needed to prevent the new phase
   summaries from silently upgrading evidence labels.

## Steps

- [x] Read the governing state, charter clauses, completed Phase 8–10 plans, plain-English guides,
  final Phase 10 report, current education structure, and frozen verifier boundary.
- [x] Create the isolated task branch/worktree and record this plan before implementation.
- [x] Reconcile the index and Chapter 29 bridge with the final Phase 6 state and new course range.
- [x] Author Chapters 30–33 with their original diagrams, examples, interactions, citations, and
  explicit limits.
- [x] Extend the site manifest and reconcile the Phase 6/new-chapter verifier semantics.
- [x] Run public and offline education verification, inspect representative desktop/mobile visual
  captures, and repair content or layout defects.
- [ ] Run Rule 7, `git diff --check`, and exact `npm test`; record the verified result here and in
  `docs/PROGRESS.md`. Rule 7 and `git diff --check` passed again on 2026-09-03 after the review
  corrections; exact `npm test` still awaits an idle host.
- [x] Perform one bounded skeptical content pass over the final learner-facing claims, apply any
  warranted corrections, and mark this plan complete.
- [x] Run an independent six-agent review (four fact-checks against the Phase 6–10 records, one
  style pass against Chapters 17 and 29, one accessibility/verifier pass) and apply every verified
  correction (2026-09-03).

## Verification record

- `node docs/education/tools/verify.mjs --public-only` passed on the final authored content: 37
  manifest pages, 222 browser-profile loads plus deterministic repeats, and all 149 artifact-backed
  negative controls. Report: ignored `out/education-verify/report.json`.
- `node docs/education/tools/build-local.mjs` passed and built all 37 pages under ignored
  `out/education-local/`. The build retained rights-aware placeholders for 139 absent source
  figures and one video; none was silently republished.
- Focused visual QA passed 36 desktop/mobile, light/dark profiles, then four corrected Chapter 31
  profiles after the skeptical content pass. Report: ignored `out/education-visual-qa/report.json`.
- `npm run lint:rule7` passed with 1,515 files scanned. `node --check` passed for every changed
  JavaScript/MJS file. `git diff --check` passed again after the final state-record edit.
- The skeptical pass checked the learner-facing numbers against the Phase 8 final report and guide,
  the Phase 9 D-BT and M-F/M-K2 reports and guides, and the Phase 10 closure/C0 reports. It corrected
  an early draft that had mistaken P0/P1/P2 for recovery levels: P0 is native longitudinal data, P1
  is direct module-discriminating measurement, and P2 is interpretation/lineage safeguarding with
  no measurement-coordinate rows.
- Exact `npm test` on 2026-09-03 passed Rule 7 and both typechecks, then completed Vitest after
  4,530.15 seconds with 139 files passed, 26 failed; 2,318 tests passed, 16 failed, and 72 skipped.
  Seventeen failed suites correctly refused the temporary installed-runtime junction used to
  bootstrap this isolated worktree; that junction was removed and replaced with a real local
  `npm ci` installation. A focused S6 authority run then loaded and ran without the junction
  refusal, but was deliberately stopped rather than treated as timing evidence while an unrelated
  scientific campaign still occupied all 32 logical CPUs. The remaining recorded failures were
  pre-existing Phase 10 byte-identity disagreements and process/IPC wall-time caps outside the
  education files. Therefore the exact-suite checkbox remains open: rerun exact `npm test` when the
  registered campaign workers are gone, and do not describe this run as green.
- Independent review on 2026-09-03: four fact-check agents reported 4, 14, 16, and 13 factual
  findings for Chapters 30–33 (47 in all), the style agent five more plus tone and pedagogy gaps,
  and the accessibility agent seven defects (an undefined `--accent` token that blanked every bar
  and highlight, zero-height multiplier bars, Chapter 30 buttons that never updated
  `aria-pressed`, hard-coded low-contrast colours, an unstyled disabled state, hover-only
  `title` tooltips, and a missing table caption). Each factual finding was re-checked against
  the cited artifact before the fix; reviewer claims that could not be confirmed in the record
  (an M-PT/M-LH free-fall refusal example) were left out. Corrections landed in Chapters 30–33,
  `glossary.html` (five new headwords: arm, attached count, development evidence, forcing,
  packet), `assets/education.css` (`.button:disabled`), and the regenerated `figures.html`
  caption (33 chapters).
- After the corrections: `node docs/education/tools/verify.mjs --public-only` passed 37 pages,
  191 checks, 0 failures, and all 149 negative controls (report generated 2026-09-04T00:24:43Z,
  manifest sha256 8f6eb402…). `node --check` and a Playwright page-error probe were clean on all
  four chapters; one shadowed-variable regression in Chapter 30 was caught by the screenshot tool
  and fixed before the final verifier run. Targeted visual QA passed 24 of 28 profiles before that
  fix and 4 of 4 for Chapter 30 after it. `npm run lint:rule7` passed (1,515 files) and
  `git diff --check` passed.

## Out of scope

- Starting or claiming completion of Phase 7 product, GPU-parity, or held-out-validation work.
- Rewriting or relabeling any Phase 6–10 evidence artifact.
- Adding new physics, solver behavior, experiments, source acquisition, or scientific gate credit.
- Republishing copyrighted figures, PDFs, videos, or private NAS measurements.
- Reworking Chapters 1–27 except for navigation or a directly necessary current-status link.
- Reviving `docs/HANDOFF.md` or using it as current authority.

## Tried and rejected

- **Continue directly from Chapter 29 as though its August 2 state were current.** Rejected: the
  chapter and oracle still say Phase 6 is active, R15 is pending, and the retired handoff is live.
  The project later closed Phase 6, 8, 9, and 10 under different bounded claims.
- **Write a triumphant Phase 7 chapter.** Rejected: Phase 7 is chartered but not started. The honest
  lesson is the difference between a designed product layer and completed work.
- **Compress Phases 8–10 into one epilogue.** Rejected: each teaches a distinct transferable idea
  and has enough concrete evidence for its own chapter—building a data book, testing one idea at a
  time, and finishing a package without turning refusal into success.
- **Replace the historical Phase 6 interactives wholesale.** Rejected: they preserve a real
  intermediate state and several expensive lessons. Reconcile the current-status view and add the
  final closure bridge while retaining the measured history.
- **Add a second education-specific evidence framework.** Rejected: the existing manifest and
  browser verifier already exercise interactive state and content boundaries; extend that seam.
- **Link the new chapters directly to plans and evidence outside the public education root.**
  Rejected after the verifier caught the boundary crossing. The chapters link to the public
  references page, which explains the authority chain without making private repository paths
  deployable.
- **Describe P0/P1/P2 as recovery-strength levels.** Rejected during the skeptical pass because the
  Phase 8 records define measurement roles, not a quality ladder. Chapter 31 now teaches those exact
  roles and keeps P2 separate from coordinate-bearing measurements.
- **Keep a shared `node_modules` junction in the isolated worktree.** Rejected after the exact suite
  correctly refused an aliased installed runtime. The link was removed without touching its target
  and replaced by a local `npm ci` installation.
- **Treat process timeouts under the 32-worker scientific campaign as education regressions.**
  Rejected: the full run showed passing neighboring assertions and wall-time-only failures in
  untouched Phase 4/10 process tests. The exact suite still must be rerun under an idle host; this
  observation is a limit, not a waiver.

## Open questions

The bounded continuation is implemented and education-verified. Formal plan closure is waiting on
an exact `npm test` rerun after the unrelated 32-worker scientific campaign finishes and any
persisting Phase 10 byte-identity failures are resolved in their own authorized workstream. The
maker asked on 2026-09-04 for the GitHub Pages deployment to be restored. `.github/workflows/pages.yml`
is back on this branch in its original form (trigger: pushes to `main` that touch
`docs/education/**`), with the page pin raised from 33 to 37; it publishes only the manifest-pinned
public pages plus assets, `FIGURES.md` and `.nojekyll` after the public verifier passes (no research
media, per decision 0004). Pages itself was never disabled: the site at
https://billatgameology.github.io/snowflake/ still serves the 29-chapter build deployed from `main`
on 2026-08-06, and the `github-pages` environment allows only `main`. The 33-chapter course goes
live when this branch reaches `main`, or when the maker allows this branch in that environment and
adds it to the workflow trigger. The 2026-09-03 review corrections are committed on this branch.
