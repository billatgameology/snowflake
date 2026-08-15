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

**Maker direction and adopted planning interpretation, 2026-08-15.** This Chapter 1 package is now
the bounded pilot input for the planned living scroll documentary: a chaptered vertical reader,
narrated playback, and deterministic long-video export are intended to share one narrative score,
while the scientific story continues through Phase 10 and media creation proceeds in parallel.
This note does not expand the current deliverables to Chapters 2–10, implement the website or
renderer, bypass the pending Rule 13 audit, reopen `docs/education/**`, start independently
eligible Phase 7, reopen completed Phases 8 or 9, or charter/start Phase 10. The
cross-Journey architecture is governed by
[the living scroll-documentary plan](explore-journey-scroll-documentary.md).

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
- [x] Write `docs/video/ch01-not-a-frozen-raindrop-script.md` — timestamped script with
      fact-check table (13 animations A1–A13, ~14:10 runtime, badge SETTLED).
- [x] Write `docs/video/ch01-animation-prompts.md` — global style preamble plus one paste-ready
      prompt per animation, each naming the script rows and timestamps it feeds.
- [x] Commit deliverables on this branch.
- [x] Write `docs/video/ch01-video-gen-prompts.md` — Seedance-class text-to-video prompts
      (V-series B-roll track): per-shot scene/setting/camera or elements/animation
      descriptions, mapped to script rows, with the no-text rule, the six-fold geometry QC
      gate, and the on-screen tag requirement (maker-requested addition, 2026-08-07).
- [ ] Rule 13 adversarial fact-check audit by a non-author reviewer, against the script's
      fact-check table and the chapter, before any recording. Two VO glosses are pre-flagged
      for that audit inside the script ("picks the birthday", "a snowflake is a diary").

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
- Building the scroll-story runtime or treating this script package as proof that the through-Phase-10
  documentary workflow is usable; those are separate implementation and audience tests.

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
- **On-screen tag for AI-generated footage.** The series bible's source-tag system is
  three-state (PHOTO / MODEL / DIAGRAM) and generated video fits none of them. The V-series
  file proposes **AI ILLUSTRATION** as a fourth state; ratifying (or renaming) that tag is a
  maker decision that should also be reflected in the series bible if the social program ever
  uses generated clips. Until decided, no generated clip ships.
- Voice: the social program is voiceover-only with no on-camera face. This script assumes the
  same. If the maker wants an on-camera presenter, the ON SCREEN column needs a pass.
- Whether the cold open should later be upgraded with a MODEL growth-timeline render once one
  is cleared for use (with the spoken disclosure). The script works without it.
