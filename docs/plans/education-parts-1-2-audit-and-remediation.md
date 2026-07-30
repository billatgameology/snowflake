# Plan — Education Parts One and Two audit and remediation

- **Phase:** Documentation and onboarding (education website)
- **Status:** in progress
- **Started:** 2026-07-30
- **Last touched:** 2026-07-30 by Codex
- **Candidate under review:** `c69c66cf8b6d05898b810f02794a8fd66df05045`

## Goal

Independently audit the complete education website rather than inherit its producer's verdict.
Part One must teach the concepts and visual evidence in the local snow-crystal research corpus
to a smart general audience in a coherent order. Part Two must accurately teach this repository
from its current authority documents and implementation. Every interactive model must be tested
for its claimed behavior, and every useful missing demonstration found by the review must be
built and tested.

## Done when

The user supplied this milestone rather than the charter, so the executable completion criteria
are:

- every Part One source named by the site's research inventory has a concept checklist mapped to
  chapter coverage, a relevant image reference where the source has one, and an interactive
  demonstration where interaction materially improves understanding; every deliberate omission
  is named with a reason;
- the Part One chapter sequence has been reviewed as one learning path, and every ordering defect
  found by that review is repaired;
- every Part One interactive is enumerated and browser-tested against its own scientific claim,
  including controls, reset/replay behavior, boundary cases, labels, and the visible state change;
- Part Two has an equivalent coverage and ordering audit against the current charter, accepted
  decisions, solver specifications, package boundaries, live code, tests, and recorded evidence;
- every Part Two interactive is enumerated and browser-tested against the implementation concept
  it claims to explain;
- every additional demonstration recommended by either review is implemented, integrated into
  the appropriate chapter, and covered by behavioral tests;
- the offline build contains the licensed local figures while the GitHub Pages build keeps
  references/placeholders only, with no copyrighted research media added to Git;
- all 29 chapters plus the shared pages pass link, console, layout, accessibility-smoke, theme,
  and interaction checks; exact `npm test` passes; and an adversarial review rechecks the
  published bytes with its provenance and limits recorded;
- the plan and `docs/PROGRESS.md` identify what changed, what the checks prove, and the next
  concrete action, and the completed work is committed without absorbing unrelated Phase 6
  changes already present in the worktree.

## Approach

Treat `c69c66c` as a review candidate, not as evidence of completion. Build two explicit source
maps: papers-to-concepts for Part One and authority/code-to-concepts for Part Two. Audit content
coverage and pedagogy separately from demo correctness so an attractive but scientifically wrong
widget cannot pass by presentation quality. Reuse the existing local figure catalog and offline
builder; copyrighted PDFs, images, and videos stay untracked. Use independent reviewers for the
two course parts and a separate code-level demo audit, then repair the union of findings and send
the resulting bytes through a final adversarial pass.

## Steps

- [x] Reconcile the education worktree, merged history, current candidate, and research-source
      inventory without changing or force-adding local media.
- [ ] Audit Part One source coverage, image choices, terminology, and chapter order; record the
      paper-by-paper checklist and omissions in this plan.
- [ ] Audit every Part One demo from code and in a real browser; add behavioral assertions that
      independently recompute load-bearing outputs.
- [ ] Repair every Part One gap and implement every recommended new demo.
- [ ] Audit Part Two against current authority documents, repository code, tests, evidence, and
      chapter order; record the authority-to-chapter checklist and omissions in this plan.
- [ ] Audit every Part Two demo from code and in a real browser; repair gaps and implement every
      recommended new demo.
- [ ] Run the offline/online media split checks, whole-site browser matrix, exact `npm test`, and
      visual inspection of representative pages and every changed interactive.
- [ ] Obtain an independent adversarial re-review of the final bytes, remediate all findings, then
      update `docs/PROGRESS.md`, mark this plan done, and commit the completed audit.

## Out of scope

- Changing solver, runner, GPU, Phase 6 protocol, parameter-table, or evidence behavior.
- Re-running scientific gates or validation sweeps.
- Publishing or force-adding copyrighted research PDFs, videos, or images.
- Reviewing Phase 7 product UI except where Part Two explains its currently accepted design.
- Pushing commits or deploying GitHub Pages; the user requested a local commit only.

## Tried and rejected

- **Accept `c69c66c` from its commit message and prior browser run.** Rejected under Rule 9: the
  producer cannot supply the verdict for the artifact it changed.
- **Count citations or demo containers as coverage.** Rejected: a citation may not teach the
  source's concept, and a canvas may animate while implementing the wrong relationship.
- **Use only extracted PDF text.** Rejected: the request explicitly includes relevant images,
  and layout, captions, axes, and figure-to-claim correspondence require rendered-page review.
- **Commit the local research corpus for a self-contained online site.** Rejected by ADR 0004 and
  copyright scope. The offline builder may consume local media; the public site must reference it.

## Audit record

### Worktree, history, and corpus reconciliation

- `education-worktree` is clean at `f8668d23667f499693a015062756430a4d6a8e81`; that commit is
  also its merge base with `main`. The reviewed Part Two branch was merged by `5af860e`; candidate
  `c69c66c` is a later main-only whole-course remediation and is therefore the byte set under
  review, not an unmerged alternate implementation.
- At audit start `main` was at `c69c66c`, 19 commits ahead of `origin/main`, with unrelated
  in-progress Phase 6 SDAK files already dirty. Plan commit `9897fd5` added only this file; the
  Phase 6 files remain outside the education scope and must not be staged.
- The local research cache contains 14 top-level PDFs plus generated page/figure derivatives,
  10 videos, and the transcript: 3,628 ignored files in total and zero untracked non-ignored
  research files. Git tracks 13 research indexes/reports, not the copyrighted media. No cache
  byte was modified, moved, staged, or force-added during reconciliation.
- The public source inventory names the monograph, ten post-monograph measurement/method papers,
  three modelling papers (including Gravner-Griffeath), three historical works, and the
  Murphy-Koop reference standard. Part One's paper audit uses that inventory and the 120-entry
  tracked figure manifest; historical works and the standard are checked as concept sources even
  though they are not among the 14 cached PDFs.

## Open questions

- None currently. Any source whose licensing or scientific role is genuinely ambiguous will be
  left as a referenced omission rather than silently copied or guessed.
