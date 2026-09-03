# Plan — education continuation through Phase 10

- **Phase:** Cross-phase education reconciliation — Phases 6–10
- **Status:** in progress
- **Started:** 2026-09-02
- **Last touched:** 2026-09-02 by OpenAI Codex
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
- [ ] Reconcile the index and Chapter 29 bridge with the final Phase 6 state and new course range.
- [ ] Author Chapters 30–33 with their original diagrams, examples, interactions, citations, and
  explicit limits.
- [ ] Extend the site manifest and reconcile the Phase 6/new-chapter verifier semantics.
- [ ] Run public and offline education verification, inspect representative desktop/mobile visual
  captures, and repair content or layout defects.
- [ ] Run Rule 7, `git diff --check`, and exact `npm test`; record the verified result here and in
  `docs/PROGRESS.md`.
- [ ] Perform one bounded skeptical content pass over the final learner-facing claims, apply any
  warranted corrections, and mark this plan complete.

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

## Open questions

None currently blocks the bounded continuation. The course remains unpublished in-repository
content unless the maker separately restores a deployment path.
