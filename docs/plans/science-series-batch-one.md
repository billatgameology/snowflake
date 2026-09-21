# Plan — first parallel science-series batch (E05, E06, E08)

- **Status:** complete — first batch fully built and technically verified; available for maker review
- **Started:** 2026-09-20
- **Coordinator:** root Codex agent; three episode owners share the existing sibling checkouts
- **Authority checkout:** `/Users/billw/Code Files/snowflake`, existing `explore/film-part1-plan` branch
- **Website checkout:** `/Users/billw/Code Files/snowcrystal_website`, `codex/series-first-batch` branch

## Goal

### Full-production amendment — 2026-09-20

The maker now directs: **“build them fully.”** Complete E05, E06 and E08 as integrated bilingual
episodes, using approved Juniper English and Yun Mandarin performances, final spoken cues, polished
episode-specific visuals and the existing site/player contracts. This supersedes the initial
draft-only stopping point and authorizes the necessary production narration. No other episode is
assigned. Public deployment remains separate from building the complete episodes.

Continue in the existing two task branches/checkouts. The same three episode owners take their
episodes through full temporary-voice rehearsal, final visual/phrase design, English/Chinese content,
semantic pairs, episode-specific components/tests and fixes. They own their episode-specific files;
the coordinator owns shared pipeline configuration, catalog/routes/home, shared dictionaries,
production invocation, cross-episode review and commits. Owners stage dictionary additions in
episode-specific files for the coordinator to merge. No concurrent editing of shared files.

Before production speech, execute and review each complete 1× temporary-voice performance on a
stable local build, apply concrete findings and freeze the reviewed source/cues. Then generate each
approved-voice take once under an immutable revision, retain provider alignment and original takes,
pace both languages and audit source identity, audio integrity, prediction holds and semantic timing.
Final visuals use actual spoken phrases; normalized paragraph fractions are not final cue timing.

Completion includes normal site entry, reader/source access, playback ownership and Continue
behaviour, English/Chinese switching, desktop/narrow/Still interactions, focused checks and both
builds. E06 still leads to the unbuilt E07; E08 remains directly selectable and leads to E09 when
that episode is built. Do not silently change viewing order to connect E06 directly to E08.
Use presentation-sized checks, not solver suites. Record technical verification separately from
human listening, physical-device and audience-comprehension acceptance. Continue until the three
episodes are fully built or a concrete external blocker prevents the remaining work.

Production steps:

- [x] Complete stable temporary-voice rehearsals and repair their findings.
- [x] Freeze reviewed English/Chinese words, visual cues and semantic pairs.
- [x] Produce and audit Juniper/Yun performances, preserving every take.
- [x] Integrate production visuals/player, all three catalog entries and bilingual UI.
- [x] Verify final builds, narration, art, responsive interactions and handoffs; record final state.

### Frozen content and preproduction review — 2026-09-20

Coordinator independently reviewed the complete English and Mandarin narration/readers and checked
source hashes, authority/site mirrors, all 382 ordered bilingual semantic pairs, phrase-start
reveals and the five exact bilingual prediction answers. E05 cue provenance was refreshed after
its reader-only cleanup before any synthesis. Frozen authority script hashes:

- E05: `94f79cee932ac0c723ad877253d2deba3fdf1d89a66b82798c4f63ce8ca0e1db`.
- E06: `5a3933832b9c4ada7d18daac1223b2dfca64c39025515a77b64c0dee2f0602ac`.
- E08: `1146c7d3963a33f0821091191bcf280050b2a296e7cedf2f490ba7559c960f7b`.

Each authority Chinese/cue JSON names its source and exact imported English bytes. Cue mirrors
are retained in the website's `docs/series-narration/eNN-mandarin-cues.json`. Unchanged spoken
content preserves the earlier source review; reader edits removed editorial bookkeeping.

All three initial temporary-voice performances reached natural end without seeking, clock reversal,
rate change, browser errors or build mutation on one stable standalone build: E05 582.373 s / 55
sampled images; E06 521.082 s / 49; E08 559.283 s / 56. Generated replay artifacts are temporary
cache at website `export/series-batch-full-rehearsal/`; the retained website batch report records
results and input digests. Episode owners inspect all sampled images in order; coordinator samples
the difficult causal sequences. This is automated real-time playback plus image inspection, not
human listening or audience acceptance. E06 additionally requires a scoped normal-speed rehearsal
of its expanded plate/column recording opening before its paid speech. Its remaining narration is
unchanged. No paid attempt may be automatically retried. E06's revised opening subsequently passed
60.213 seconds of uninterrupted 1× playback with the actual production renderer and injected
provisional cue clock: both recordings loaded, only one mounted at a time, and no seeking,
overflow, errors or input changes. All 16 sampled images were inspected. Two preceding local
attempts were interrupted by shared development-server hot reloads; the accepted pass used an
isolated no-HMR server. A cue ending inside the hyphenated “history—and” token was shortened to
its unique exact-word prefix without changing narration, semantic pair or reveal onset.

### Production implementation and final review — 2026-09-20

Website implementation checkpoint `30944bb` and final repairs `373daff` contain all three full bilingual episodes and retained
media. Fifty-four first-attempt Juniper/Yun takes were generated, with no automatic retry. Raw
requests, alignments, takes and masters remain beside the six paced production masters. Source,
signal, decoded-sample composition, prediction silence and semantic timing audits pass for all
382 bilingual pairs, 234 reveals and five bilingual holds. Frozen scripts are unchanged.

Normal catalog entries/routes, Sources/readers, language switching and exclusive playback are
integrated. Continue follows E04→E05→E06 and stops at the unbuilt E07; E08 remains independently
selectable. Shared Chinese UI/diagram entries are merged, including the authority diagram mirror.
Final integration repaired E08’s desktop chrome inset and E06’s closing-map annotation position.
Neither repair changes narration, cues or scientific meaning.

Both builds and focused checks pass. All three owners inspected every sampled image in their
normal-speed production replay (E05 53 images, E06 55, E08 54). E05/E06 reached native media end;
E08 reached the exact 561.563311-second endpoint before the shared transport’s pause preempted
Chrome’s ended flag. The earlier harness failure is preserved with a terminal analysis rather
than rewritten. A single earlier blank E06 recap capture was not reproduced in a scoped final-build
continuous playback from 490.014 seconds to 544.920 seconds, with 23 inspected captures and no seek
after playback began. The cause of that earlier witness remains unresolved. Final E06 map images
in both languages and desktop/phone layouts show the annotation clear of the axis.

Desktop/phone-sized live checks cover all nine scenes in each language, language position,
seek/reverse seek, Still, menus, manual takeover/resume and both endings. Delayed lazy handoffs
preserve one audio owner. The final full-player smoke passes 116 observations; retained verification closure is complete. The local Firebase emulator’s missing Range support caused seeking restrictions
and six pending audio streams to block document navigation. Identical navigation passed in 41 ms
on the range-capable preview; no app repair was needed. Final browser and hosting-header assertions
therefore use their appropriate local servers and retain both addresses in the receipt.

The full report is website `docs/science-series-batch-one.md`; machine-readable checks and input
digests are `docs/series-batch-one-verification.json` and `docs/series-batch-one-qa/`. Generated
screenshots and provisional audio under website `export/` are reproducible QA cache. This is
technical playback and sampled-image verification, not human listening, physical-phone or
uncoached audience acceptance. No public deployment or later episode was started.

### Initial draft scope (superseded stopping point)

Execute the maker's request to coordinate and launch the first batch only: Episodes 5, 6 and 8. Keep the viewing order unchanged. Turn the reviewed boundaries into complete English scripts, substantive readers and runnable visual prototypes so the difficult explanations and episode handoffs can be reviewed before multiplying final production. The current E01–E04 bilingual release remains the production baseline.

This follows the website's `docs/series-content-readiness-review-2026-09-20.md` and the authority design guide. The maker's latest instruction authorizes this batch; earlier episode-specific “do not start” limits do not bar this work. All-four-released current state supersedes historical E02/E03 holds. No later batch is launched.

## Initial draft approach and ownership

| Owner | Episode and editorial boundary | Files owned |
| --- | --- | --- |
| E05 agent | Branching feedback after E04 compensation fails; tip/direction selection and unequal sidebranches. End on habit versus branching. | `docs/video/science-series-e05-script.md`, `docs/reviews/science-series-e05-draft-review-2026-09-20.md`; website `src/series/drafts/episode-five-prototype.ts` and episode-specific draft assets only |
| E06 agent | Controlled condition comparisons → conditional habit map; plate/column versus complexity; representative hollow forms; pressure/seed/cold-region limits. End on changing history for E07. | Corresponding e06 script/review; website `src/series/drafts/episode-six-prototype.ts` and episode-specific draft assets only |
| E08 agent | Measured optical/mass signal → dimensions/mass → growth rate; apparatus and calibration effects; independent levitation method. End on inference for E09. | Corresponding e08 script/review; website `src/series/drafts/episode-eight-prototype.ts` and episode-specific draft assets only |
| Coordinator | Source/content review, boundaries and difficult-scene review, preview integration, checks and durable state | This plan, PROGRESS, website shared preview/import/rehearsal infrastructure and review records |

Do not edit the same shared file concurrently. Episode owners send proposed shared changes to root. They do not create branches, commit, generate paid narration, deploy, change released episodes or begin E07/E09–E11. Root commits coherent checkpoints. Existing sources and model assets are reused with their exact status; illustrative diagrams are not scientific forward runs.

Every script follows the existing importable E04 shape, with stable `ENN-NN` scene IDs, conversational narration, visual/source notes, source dispositions and substantive reader paragraphs. Its scene worksheet states subject/scale, changed condition, visible action/result, likely misconception, narrow/Still treatment and incoming/outgoing continuity. No forced scene count or duration. Predictions precede answers, and comparisons are built one case at a time.

The initial browser prototype is an explicitly provisional local review surface outside released routes. Each episode module uses the coordinator's shared drawing contract; root supplies imported text, controls, reversible scene/paragraph timing and optional local rehearsal voice. Production cues must later be based on actual recorded timing. Draft artifacts must not leak into the public build.

## Done when — first review milestone

- All three complete English scripts and readers exist, with verified local source anchors and deliberate chapter-section dispositions.
- A non-author reviews their load-bearing claims and handoffs; actual findings are repaired or explicitly retained as limits.
- Runnable prototypes demonstrate each episode's hardest explanation and represent the remaining scenes honestly as drafts.
- Root checks desktop and narrow compositions, play/seek/Still behaviour, and what the prototype actually covers. A complete playback is distinguished from sampled captures, human listening and audience understanding.
- Authority prose has no new Rule 7 findings, with the unrelated baseline failure recorded; website TypeScript/build and focused checks cover modified boundaries. No solver suite or scientific gate is launched for this presentation scope.
- Current plan/progress records name completed artifacts, checks and the next production action. Draft readiness is not final narration or publication readiness.

## Steps

- [x] Inspect existing branches/worktrees and preserve current episode release.
- [x] Dispatch E05, E06 and E08 owners with source/design boundaries.
- [x] Review draft scripts, source dispositions and adjacent-story contracts.
- [x] Integrate and inspect prototypes and rehearsal timing.
- [x] Repair concrete issues and record the review milestone and next action.

## Historical draft checkpoint

All three owners finished their assignments. Each complete English draft has nine scenes;
E05/E06/E08 have five/seven/seven substantive reader entries. The coordinator read all main
narration and readers, verified imported anchors and repaired integration issues. The review
preserves the distinction between liquid saturation and ice-relative excess in E06, and
between levitated mass observations and unobserved shape/grain structure in E08.

The website's `series-batch-preview.html` host presents all 27 scene studies with temporary
local narration, measured paragraph timing, five prediction pauses, sources and readers.
Website `docs/science-series-batch-one.md` and `docs/series-batch-one-verification.json` record
the integrated checks, repairs and limits. Episode author self-reviews live in this checkout's
`docs/reviews/science-series-e05-draft-review-2026-09-20.md`, and the corresponding e06/e08 files.

**Next:** review the complete temporary-voice performances before final production, starting
with the compensation/amplification, hollow-growth and apparatus/signal passages. Integrated
checks are sampled; full uninterrupted viewing, human listening and audience understanding
remain unverified. No later episode, paid narration or public release was started.

## Out of scope for this first milestone

Other episodes; chapter/solver edits; new scientific experiments; paid final speech before scripts and visual treatments are reviewed; public deployment; replacing the prior film or current episodes. Further work on the selected episodes remains within this batch, with the guide's script/rehearsal checkpoints applied to concrete artifacts.

## Tried and rejected

The original one-line map alone is too ambiguous for parallel production. The review establishes actual narrated prerequisites and source exceptions rather than letting each owner infer them from older chapter prose. Production order does not change episode numbering or viewing order.

Initial `node scripts/lint-rule7.mjs` reports three pre-existing findings in
`.agents/skills/firebase-hosting-basics/references/deploying.md` at lines 24, 44 and 47.
No finding names the new plan or progress entry. Keep this unrelated baseline failure visible;
do not change installed skill prose as part of episode authoring.
