# Episode 4 — bounded source and drawing-code review

Date: 2026-09-20. Scope: the held local Episode 4, **How a growing face stays flat**.

Author/reviewer: the shared-context OpenAI Codex subagent assigned `science_outline`; its exact
runtime model identifier was not exposed. This agent authored the English authority script, so its
source check is an author check, not independent approval of its own words. The coordinating Codex
agent separately read the complete spoken script and the Chapter 5 mechanism before accepting the
English source for production. The drawing-code findings below are a non-author review: the
coordinating agent authored and repaired that implementation.

This record covers source meaning, source locators, phrase identity and code-level implications.
It does **not** claim rendered-frame inspection, ordinary-speed viewing, listening, physical-phone
testing, spoken Mandarin fluency review or audience understanding. A later text-only bilingual
semantic pass is recorded below. The website's production and QA record owns performance checks.
No public release, deployment or scientific solver gate follows from this review.

## Frozen authority and source evidence

The English source is [science-series-e04-script.md](../video/science-series-e04-script.md), committed
alone as `bc6aedd6d12c8dbd58f464a34507205e178df563`, raw SHA-256
`7855f8384ad7f241b4a5020c47b753e03b72bb18a2d5a44360acd6497b82a49f`.
It has nine scene IDs, three spoken paragraphs per scene and 1,500 whitespace-separated spoken
words. Both prediction-answer phrases occur exactly once in the narration: E04-03 paragraph 2,
“The slower faces remain.”, and E04-07 paragraph 1, “More closely spaced steps give the middle more
places to add ice.” Each is authored with a three-second hold before its measured answer onset.

The source review used education Chapter 5 for steps, kinetic selection and compensation, Chapter 6
for the regulator's limit, and Chapter 11 for terrace nucleation and its assumptions. All nine
distinct full local chapter anchors cited by the script were checked to exist.

The primary [Libbrecht monograph, arXiv:1910.06389v2](https://arxiv.org/abs/1910.06389) was also checked
directly. The browser could not open the oversized PDF, so the same public PDF was downloaded to
temporary local scratch and read using `pdftotext`. Its SHA-256 was
`f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471`, matching the existing
[research bundle index](../../research/1910.06389v2-llm.md). The checked printed pages were 53–54,
79–81, 112 and 139–142. The official
[Caltech faceting explanation](https://www.its.caltech.edu/~atomic/snowcrystals/faceting/faceting.htm)
separately supports the kinematic slow-face demonstration. No source photograph or PDF bytes were
added to Git or the served website by this review.

The load-bearing distinctions preserved in the frozen narration and reader are:

- Steps provide incorporation opportunities, without turning a drawn encounter into a guaranteed
  capture or treating the tidy side view as a complete molecular model.
- Faster boundary segments leave the growth envelope while their deposited material remains.
  The sixfold constant-rate teaching example is not a numerical ice-growth prediction.
- Small islands can form and disintegrate; the nucleation picture does not require every layer
  to finish before another starts, or exclude defect-supplied steps.
- In the monograph's blocky-facet account, layers preferentially start near corners, their steps
  travel inward more slowly and become more closely spaced near the center. This is not a
  conveyor of individual molecules across the whole face.
- Lower local surface supersaturation and stronger effective attachment response can yield the
  same normal growth speed. The tiny steady concavity is explanatory, not a measured profile
  supplied by the diagram or opening computer-grown recording.
- Local vapor surplus is not net flux. Printed p. 112 explicitly supplies a thin-plate
  counterexample to any unconditional “richest air at the projecting edge” rule.
- Feedback is limited by the source's effective-response ceiling, without an invented universal
  humidity, size or temperature threshold for branching.

Several stronger phrases in the education chapters were deliberately not repeated as universal
claims: that molecules only stick to steps, that one complete layer must always finish before
another begins, or that a typical critical-island estimate has a diameter of ten molecular widths.
The primary p. 142 estimate gives a **radius** of approximately ten molecular size units and about
300 molecules under its representative conditions; the E04 reader preserves that distinction.
The reader also separates the observed apparently flat crystal in figure 3.4 from its inferred
microprofile, and the basal-step microscopy in figure 6.20 from our schematic prism face.

## Drawing-code findings and repairs

The source-level reread after repair covered these website files:

| File | SHA-256 at bounded reread |
|---|---|
| `src/series/episodeFourDrawing.ts` | `a9609489d193f9a91d47fd4f7600e17db227b6a427656ac11442a262d221c9cb` |
| `src/series/episodeFourGeometry.ts` | `b803b5990ad9505a7c24ebad1a734e65b49a885674c075fd69f6f16156bc48fc` |
| `src/series/episode-four-cues.json` | `8301599ea72ded5fc287b3e4025ad7ea58fdbc4441c8f0d1ec9dc2f6beb7cd21` |

The hashes identify this review scope, not a claim that later display-only repairs invalidate its
scientific reasoning. A browser verdict must still identify the built artifact it actually viewed.

| Scene and spoken obligation | Initial finding | Verified code repair |
|---|---|---|
| E04-02, molecule can linger and leave | Only the later directed step marker was implemented. | Separate exchange cue now moves a marker to the terrace and back into air before the step-incorporation emphasis. |
| E04-04, more spare vapor and more new layers | The spoken changed input and consequence had no drawing state. | `vapor` adds visible spare-vapor markers; the later `islands` cue introduces successive additional islands. These remain schematic, unmeasured counts. |
| E04-05, corners advance and face dishes | The slab stayed flat under different arrows. | The puzzle drives an actual dish with matching normal advance, leaving the center fixed while corners gain material. The retained initial surface line is now at its actual y=60 coordinate. |
| E04-06, successive steps slow and bunch | The single-step clock finished before the paragraph introducing additional steps; a completed train appeared at once. | Separate delayed births begin at the crowd cue and evolve over its own interval. The following scene starts from the same completed train. |
| E04-07, local supply versus response | Heading said less vapor “reaches” the middle, conflating local surplus with net delivery. | Heading now says “Less spare vapor beside the middle.” |
| E04-08, correction has a limit | The limit was only a caption over the finished correction. | A failure cue adds corner growth while holding the center, making lost compensation visible. The earlier “middle catches up” label/arrow retire before “middle cannot keep up”; the limit also gets its own heading. |
| E04-09, step spreads and leaves a layer | The `spread` cue was ignored by the fixed recap ledge. | The edge position now follows `spread`, leaving new material over the stationary old solid. |

The initial review also checked the coordinator's already-identified repairs: the slow-face
diagram's new-ice label points outside the old outline, and the too-flat correction advances the
corners without removing center material. These findings are resolved at code level. Their motion
speed, composition, on-screen visibility and audience readability require the separate visual pass.

## Checks executed and limits

`node scripts/lint-rule7.mjs --file docs/video/science-series-e04-script.md` passed, scanning one
file. A small direct source parser confirmed all nine IDs, the three-paragraph shape, the word
count, answer uniqueness and local anchors. A second source comparison checked all 42 authored
reveal phrases and both prediction answers against their exact scene/paragraph: zero missing or
ambiguous normalized phrase matches. This establishes text identity, not delivered audio timing.

A read-only Node geometry probe sampled 100 successive growth-envelope intervals: every old
polygon vertex remained inside the next envelope, and the polygon changed from twelve boundary
segments to six. It also sampled the original step train through time 1.62 at increments of 0.01
and horizontal positions every two drawing units, with no old-material removal. The two feedback
repair paths were sampled over 100 intervals, again with no removal. The later delayed-birth
parameterization changes the reveal order; its formula and continuity were reread, rather than
presenting the earlier sample as a re-executed numerical check of the new timing schedule.

These are bounded geometric and source checks. The figures still use chosen display speeds,
exaggerated heights and prescribed illustrative profiles. They are not a verified solution of
diffusion coupled to microscopic step kinetics. English source is ready for the authorized
production pass; the completed performed episode's visual, listening and audience acceptance
remain separate decisions.

## Chinese semantic text review

The same reviewer, who did not author the Chinese translation, read all 27 Chinese spoken
paragraphs and all six reader entries against the frozen English. This is a complete text
comparison of those fields, not a fluent human listen or proof of audience understanding.
No concrete meaning drift was found in this pass.

In particular, the translated text retains the model-versus-measurement distinction; the sixfold
fixed-rate teaching example; chance island stability, simultaneous layers and defect-supplied
steps; inward-moving layer edges rather than whole-face transport of individual molecules;
conditional blocky-crystal local supply; nearly even advance rather than perfectly flat molecular
geometry; finite response and non-universal branching thresholds. The reader retains units,
dimensions, the illustrative products, the critical **radius** distinction and the thin-plate
local-supersaturation/flux counterexample. The English qualifiers “can,” “more likely,” “in this
example” and the identified source mechanism are not promoted into universal outcomes.

The reviewed authority translation is `docs/video/science-series-e04-zh-CN.json`, byte-identical
at this check to the website's `src/series/episode-four.zh-CN.json`, SHA-256
`4d268cc850da6e500a938a9b8bc1836a166aad15f1cb630e60abf43be280ce97`.
Its `sourceEnglishSha256` equals the recomputed imported English JSON SHA-256,
`517f03cf8022701f59c61429ce9356c969523e4b3d59a6ae6313aa27ca23fa08`; the raw authority-script
hash remains the separately recorded `7855f838…` value. IDs and paragraph counts match
9 × 3, with six reader entries in each language. The semantic cue pairs, performed Yun audio,
pronunciation, silence insertion and live language switching require their own production checks.

## Bilingual phrase and component integration reread

The reviewer subsequently read all 141 English/Chinese cue pairs in
`docs/video/science-series-e04-mandarin-cues.json`. No concrete semantic mispair was found.
E04-03 paragraph 2's final pair aligns the beginning of the same sentence despite Chinese word
order; E04-07 paragraph 2 aligns the whole-face instruction including its old-outline reference;
E04-08 paragraph 2 aligns the conditional loss of compensation. These are semantic phrase anchors,
not a claim that reordered languages have identical word boundaries.

An independent source check found all 141 pairs unique, ordered and non-overlapping within their
own paragraphs in both languages, with all 42 visual-reveal phrases starting an English pair.
The authority cue file and website `docs/series-narration/e04-mandarin-cues.json` were byte-identical,
SHA-256 `d3dd17ba5301e1915908ee95fb31a706cd2f480b773b823f3ab4a1a5c5a731fb`.
This does not establish provider alignment accuracy or spoken naturalness.

A bounded read-only component check covered `EpisodeFour.tsx` and `EpisodeFourVisual.tsx`, without
expanding into repairs of earlier episodes. The reviewed visual binds catalogue entry 1 to the
verified `named-solid-columns-baseline` identity, shows its completed tick 6000 at unit thickness
with a fixed pose, and mounts at most one recorded-model context during the model cue in E04-01.
It unmounts at the close-up or when offscreen. The model key depends on an actual successful draw;
the Sources copy identifies the G–G recording as unvalidated and separates ticks/cells from physical
seconds/molecules. These are code properties, not measured browser resource counts.

The component uses the selected audio's duration and semantic mapping, supplies the page playback
handle, and preserves paragraph geometry while withholding the two future answer paragraphs during
active narration. Manual reading leaves them available. E04-03's navigation/reader heading becomes
a question, and its Chinese UI entry is present. No concrete new model-identity or source-copy
regression was found in this scope.

One ownership-contract issue was sent to the coordinator: the direct-entry, entering and following
tick paths did not consult `isBlocked` before scrolling or sampling the clock. The parent ordinarily
pauses peer handles when claiming ownership, but E04's tick should itself honor the blocker.
The coordinator added an E04-only guard before direct-entry, entering, following or manual tick
mutations. The reviewer reread that repair: a blocked component pauses active playback/entry,
hides its top bar through visibility state and returns without a scroll or clock update. The
key-checked parent release callback preserves another episode's ownership. This resolves the
reported issue at code level; cross-episode browser verification remains the integration pass's job.
The final inspected component SHA-256 values were
`7c79c99bfe8715a59f380fc3a495d8b65ab2c41714bcfe722d1a1a83de817efe` (`EpisodeFour.tsx`) and
`64d805a36aa5a7f07ed12ef07f96757615070c5c003e5461997bfcb6831e06c5` (`EpisodeFourVisual.tsx`).
This reread did not launch a build or browser, and it makes no playback or UI-layout acceptance claim.
