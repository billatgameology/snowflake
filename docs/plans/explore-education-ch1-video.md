# Plan — Chapter 1 long-form video script and Claude animation prompts

- **Phase:** Maker-directed exploration, outside Phase 6 scope (precedent: `explore/social-content`)
- **Status:** in progress
- **Started:** 2026-08-07
- **Last touched:** 2026-08-07 by Claude Fable 5 (`claude-fable-5`)

## Goal

Turn education Chapter 1 (`docs/education/chapters/01-not-a-frozen-raindrop.html`) into a
production-ready long-form YouTube video package: a fully timestamped voiceover/on-screen script,
plus a set of self-contained animation prompts the maker can paste into Claude to generate each
animation as a single-file HTML/canvas piece for screen capture. The video is the long-form
companion to the short-form program in `docs/social/`; it reuses that program's editorial
guardrails (source tags, fact-check discipline, rights rules, honesty badge).

## Done when

There is no charter clause for this work; the charter does not govern video production. Done means:

- A timestamped script exists covering the whole chapter's causal spine, in the
  `docs/social/scripts/` table format (TIME | VOICEOVER | ON SCREEN), with a fact-check table in
  which **every factual beat carries a printed-page citation or is marked as the chapter's gloss**.
- Every animation the script calls for has a paste-ready Claude prompt, keyed to the script's
  timestamps, self-contained (a fresh Claude session with no repo access can execute it), and
  carrying the same source guardrails the education chapter's own animations carry (printed
  anchors only; invented spreads labelled illustrative; no source-figure reproduction).
- Publication itself is **not** in scope of done — per Rule 13 the script must receive an
  adversarial fact-check audit (a non-author review, per the maker's workflow) before recording.

## Approach

Follow the house format that already exists rather than inventing one: the
`docs/social/scripts/*.md` table layout, the series bible's retention mechanics (negation hook
before 2 s, answer at ~60 % of runtime, badge as terminal beat), and its failure-mode guardrails
(PHOTO/MODEL/DIAGRAM tags, no uncited colourful details, no Libbrecht figure reproduction).
This video is deliberately **DIAGRAM-only**: every visual is an original animation, so no model
disclosure is triggered and no rights question arises. Animation prompts specify deterministic,
seeded, single-file HTML at 1920×1080 with a capture mode, so renders are reproducible.

Deliverables live under `docs/video/` (new directory, long-form track), separate from
`docs/social/` (short-form track), because the two tracks have different formats and cadence.

## Steps

- [x] Read Chapter 1 in full, including its three animation implementations and their
      built-from notes.
- [x] Read `docs/social/` conventions (script format, series bible, rights rules).
- [x] Commit this plan.
- [ ] Write `docs/video/ch01-not-a-frozen-raindrop-script.md` — timestamped script with
      fact-check table.
- [ ] Write `docs/video/ch01-animation-prompts.md` — global style preamble plus one paste-ready
      prompt per animation, each naming the script rows and timestamps it feeds.
- [ ] Commit deliverables on this branch.

## Out of scope

- Any edit to `docs/education/` — education is frozen at `60e3f3f` until Phase 6 closes
  (PROGRESS.md). This branch only *reads* Chapter 1.
- Any Phase 6 artifact: PROGRESS.md, the charter, ADRs, solver code, evidence. This branch
  follows the `explore/social-content` precedent — the plan lives on the branch; PROGRESS.md
  gets its bullet at merge/reconciliation time by the coordinating session.
- Recording, editing, publishing, thumbnails-as-files, or channel setup.
- MODEL (simulation render) footage. If the maker later inserts any, the series bible's
  three-second spoken disclosure rule applies ("these are renders; a computer model, not
  photographs") and the PHOTO/MODEL/DIAGRAM tag discipline extends to it.
- Chapters 2+. One chapter, end to end, so the pipeline can be judged before it is scaled.

## Tried and rejected

- **Putting the script in `docs/social/scripts/`** — rejected: that directory is the short-form
  program with its own numbering, publishing order, and cadence rules; a 14-minute script would
  corrupt its bookkeeping. New `docs/video/` directory instead.
- **Reusing the chapter's own Libbrecht figures in the video** — rejected without needing a
  debate: the series bible marks any composite embedding a source figure as rights-blocked
  (© Kenneth G. Libbrecht). All visuals are original DIAGRAM animations.
- **Teasing Chapter 2 with the Kepler/Bentley colour details** — rejected: "Kepler's poverty"
  is already flagged UNSOURCED in the social program's review findings, and the same discipline
  (cut, don't soften) applies here. The outro tease stays generic.

## Open questions

- Who performs the pre-recording adversarial audit (Rule 13)? The maker's standing workflow
  prefers a reviewer that did not share context with the author.
- Voice: the social program is voiceover-only with no on-camera face. This script assumes the
  same. If the maker wants an on-camera presenter, the ON SCREEN column needs a pass.
- Whether the cold open should later be upgraded with a MODEL growth-timeline render once one
  is cleared for use (with the spoken disclosure). The script works without it.
