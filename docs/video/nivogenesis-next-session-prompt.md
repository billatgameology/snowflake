# Nivogenesis — next-session prompt

Copy the prompt below into the next development session. This is a user-requested launcher
and file map, not a replacement state document. `docs/PROGRESS.md` and active plans remain
the live authority; reread them because later work may supersede this snapshot. Do not revive
the retired `docs/HANDOFF.md` mechanism.

---

Continue developing **Nivogenesis**, our interactive, narrated snow-crystal documentary series.
Use my next specific request as the work scope. Preserve the existing work, check the science,
implement the change, inspect the visuals and audio/visual timing where affected, then review
and fix concrete defects. If I provide no new task beyond this prompt, read the current state,
briefly confirm readiness and ask what I want to develop next. Do not invent another episode,
release Episode 2, synthesize more narration, export a movie or deploy merely to get started.

## Two repositories — do not edit the wrong checkout

| Role | Checkout | Retained branch | Known baseline when this prompt was written |
| --- | --- | --- | --- |
| Science, source chapters, scripts, design requirements, plans and reviews | `/Users/clipper/github/snowflake` | `explore/film-part1-plan` | `2626442` before this documentation save |
| Actual React website, animations, playback, public audio/assets and export tooling | `/Users/clipper/github/snowcrystal_website-film-part1` | `explore/film-part1` | `d7eb937` |

These are separate repositories with separate commits, not two directories in one repo.
Check branch, status, recent log and relevant diff in BOTH before editing. Preserve unrelated
changes. Follow the authority repo's Rule 16 worktree rules; the paths above identify the
retained work, not permission to overwrite another active session. Do not switch to a similarly
named main checkout and wonder why the preview does not change. Never reset/clean these trees.

First read the applicable `AGENTS.md`/`CLAUDE.md`, then the authority repo's
`docs/phase6-lessons.md`, all of `docs/PROGRESS.md` including **Next step**, and affected active
plans including **Tried and rejected**. Read relevant charter clauses/ADRs before behavior
changes. Non-trivial implementation needs a bounded plan/amendment committed first. Update
PROGRESS as meaningful steps complete, leaving its Next step true.

## Current experience to preserve

- Local preview: `http://127.0.0.1:5185/series`; direct E01: `/series/episode-1`.
  Reuse the existing server and browser tab. If the exact URL is unavailable, inspect the
  existing process first; from the WEBSITE checkout the normal start command is
  `npm run dev -- --host 127.0.0.1 --port 5185 --strictPort`. Do not kill an unrelated process
  or silently select another port. Follow available Sites/browser skills if applicable.
- Brand: **Nivogenesis**; kicker: **The birth of snow**; tagline exactly
  **Every flake is a record of its fall.** The opening has no All experiments or original-film
  navigation link. Episode cards match in size. EN / 中文 is one shared top toggle.
- E01, **Not a frozen raindrop**, is playable with English and Mandarin narration.
- **E02 is deliberately unreleased.** It is built and narrated, but its card says **Coming soon**.
  `src/series/seriesRelease.ts` sets `EPISODE_TWO_RELEASED = false`. Its content/audio are not
  mounted, its direct URL does not expose it, and E01 has no active continuation into it.
  Preserve E02 files and its crystal catalog; do not enable this flag without my request.
- Home grows the actual Run B crystal, then blends that same object into the actual Hero1
  snowfall. The faster growth and continuous handover are intentional. The opening collection
  includes recorded plate, column, hollow column, capped column, sectored plate and Run B.
  Inspectable flakes use real recorded volumes and the established renderer, not fake icons.
- Optional **Play with sound** replays the opening with an original quiet air/crystal composition.
  Ordinary visits stay silent. It must not overlap narration or restart after Skip/Still/exit.
- Home → E01 is one continuous document: Play guides downward, deliberate manual scrolling
  takes over, Play resumes. Language changes retain the semantic story position and URL,
  without restarting or remounting the episode.
- The earlier film remains at `/film/part-1`. Do not delete it, earlier narration, model data,
  source material or completed exports. Hidden navigation is not deleted work.

## Authority repo: files to read and edit

All paths in this section are relative to `/Users/clipper/github/snowflake`.

| Work | Files |
| --- | --- |
| Current state and overall series scope | `docs/PROGRESS.md`; `docs/plans/explore-journey-science-series.md` |
| How the maker critiques scenes, what was actually praised, requirements and review method | `docs/video/science-series-design-guide.md`; `docs/video/science-series-e01-visual-guide.md` |
| **Current E01 spoken source** and scene directions | `docs/video/science-series-e01-comprehension-draft.md` |
| E02 spoken source/visual plan, retained but unreleased | `docs/video/science-series-e02-script.md`; `docs/plans/science-series-episode-2.md` |
| Translation and semantic-switching contract | `docs/plans/science-series-bilingual.md` |
| Canonical Chinese text and diagram translations | `docs/video/science-series-e01-zh-CN.json`; `science-series-e02-zh-CN.json`; `science-series-diagrams-zh-CN.json` in the same directory |
| Mandarin semantic cue sources | `docs/video/science-series-e01-mandarin-cues-early.json`; `science-series-e01-mandarin-cues-late.json`; `science-series-e02-mandarin-cues.json` in the same directory; consult the live score for any later override |
| Latest opening/release review | `docs/reviews/science-series-nivogenesis-2026-09-17.md` |
| Relevant earlier production review | `docs/reviews/science-series-e01-opening-followup-2026-09-17.md`; `science-series-e01-attention-2026-09-17.md`; `science-series-e02-review-2026-09-16.md`; `science-series-mandarin-production-2026-09-17.md` in the same directory |
| Scientific source chapters | `docs/education/chapters/` — E01 primarily Chapters 1/4; E02 primarily Chapters 2/3; broader series draws from Chapters 1–13 |
| Existing animation/rendering library | `app/data/README.md`; `app/data/growth-library.json`; `app/data/named-growth-library.json`; `app/data/growth-previews/index.json`; `docs/named-snow-crystal-catalog.md` |
| Other rendering treatments | `docs/plans/dendrite-visual-studies.md`; `named-crystal-volume-gallery.md`; `named-crystal-volume-stability-correction.md`; `explore-gutcheck-growth-glass-camera.md` in the same directory |
| Export contract, only for an export request | `docs/plans/science-series-home-e01-export.md`; `docs/reviews/science-series-home-e01-export-2026-09-17.md` |

**E01 source trap:** `science-series-e01-script.md` is the historical older cut. The current
production imports the eleven-section `science-series-e01-comprehension-draft.md`. Do not use
an old import command to replace it with the ten-section version. Draft IDs R01–R11 map to
runtime E01-01–E01-11. Earlier scene-number feedback refers to earlier cuts.

Older plan/draft paragraphs can describe superseded silent-only, Mandarin-deferred, badge or
public-E02 behavior. Read their later amendments and current PROGRESS/design guide; do not
restore an obsolete behavior because a historical passage still describes it. Identify and
reconcile genuine current contradictions at the right authority level.

## Website repo: files to touch by task

All paths in this section are relative to `/Users/clipper/github/snowcrystal_website-film-part1`.

| Work | Main files |
| --- | --- |
| Opening copy/cards, shared language control, same-document episode ownership | `src/series/SeriesHome.tsx`; `src/series/series.css` |
| Release availability | `src/series/seriesRelease.ts`; route entry in `src/router.tsx` |
| Run B growth/camera/handover | `src/growth/RunBHero.tsx`; `src/series/openingTiming.ts`; `src/growth/scene/growth-B-intro.json` |
| Snowfall and real-model inspection | `src/pages/Hero1Page.tsx`; `src/hero1/SnowMarkers.tsx`; `RecordedSnowMarker.tsx`; `recordedCollection.ts`; `markerField.ts` in `src/hero1/` |
| Shared volume renderer/shading | `src/growth/GrowthStage.tsx`; `iceMaterial.ts`; `useGrowthVolume.ts` in `src/growth/` — touch only for renderer work |
| Opening soundtrack | `src/series/openingSound.ts`; `public/series/sound/nivogenesis-opening-v1.wav`; recipe and manifest under `docs/series-sound/nivogenesis-v1/` |
| E01 player/visual integration | `src/series/EpisodeOne.tsx`; `EpisodeVisual.tsx`; `episodeGrowth.ts` in `src/series/` |
| E01 explanatory drawings and cues | `src/series/episodeDrawing.ts`; `earlyEpisodeDrawing.ts`; `comprehensionDrawing.ts`; `seedDrawing.ts`; `laterEpisodeDrawing.ts`; `episodeCues.ts`; `laterEpisodeCues.ts`; `waterStory.ts` in `src/series/` |
| E02 retained player/visuals | `src/series/EpisodeTwo.tsx`; `EpisodeTwoVisual.tsx`; `episodeTwoDrawing.ts`; `episodeTwoGeometry.ts`; `episodeTwoStructure.ts`; `episodeTwoCues.ts`; `episodeTwoRecordings.ts` in `src/series/` |
| Imported content | `src/series/episode-one.json`; `episode-two.json`; `episode-one.zh-CN.json`; `episode-two.zh-CN.json` |
| UI/diagram translation | `src/series/SeriesLanguage.tsx`; `seriesLocale.ts`; `series-ui.zh-CN.json`; `series-diagrams.zh-CN.json` |
| Playback, reading motion and bilingual time mapping | `src/series/BilingualAudio.tsx`; `bilingualMedia.ts`; `languagePosition.ts`; `narrationTransport.ts`; `episodeTransport.ts`; `episodeTimeline.ts`; `scrollTimeline.ts` |
| Active narration scores | `src/series/episode-narration.json` (English E01); `episode-one-narration.zh-CN.json`; `episode-two-narration.json`; `episode-two-narration.zh-CN.json` |
| Preserved narration assets/provenance | `public/series/narration/<revision>/`; `docs/series-narration/<revision>/` |
| Recorded crystal assets | `src/series/episode-two-crystals.json`; `public/growth/episode-2/`; `public/growth/run-b-growth-v1.bin` |

`scripts/import-episode-two-crystals.mjs` accepts the authority checkout and imports catalogued
recordings; inspect its selection and source identities before using it. It is not a command
to regenerate or replace the whole crystal library.

Do not patch only generated/imported narration text. Change its canonical authority script,
then import and update the source-bound audio/cues when required. For a UI-only or visual-only
request, avoid touching script/audio files unnecessarily.

From the WEBSITE checkout, the current source import entry points are:

```sh
node scripts/import-series-episode.mjs /Users/clipper/github/snowflake/docs/video/science-series-e01-comprehension-draft.md
node scripts/import-series-episode-two.mjs /Users/clipper/github/snowflake/docs/video/science-series-e02-script.md
```

These write runtime JSON. Run only for an intended source update, not as an automatic startup
step. Check source hashes and script/runtime parity afterward. Preserve Chinese paragraph and
section bindings, or explicitly revise/review them when the source changes.

## Audio and export traps

- The maker's standing direction is to refresh affected narration when its spoken words are
  rewritten. Retain unchanged takes when their text/voice/settings match. UI/tagline changes
  are not spoken episode changes and do not need new narration.
- Current English voice: `aMSt68OGf4xUZAnLpTU8` (Juniper); Mandarin: `4AfodMgwXps9oZFhHzoj` (Yun,
  chosen again on 2026-09-18 after a Susan `0H4ruoQ81Ei2FCwjW5j1` audition whose revisions are
  retained history). Do not substitute older audition voices or invent a new voice.
- Inspect `scripts/generate-series-narration.mjs` before use. It supports explicit revision,
  reuse, episode and language options; no-generation invocation is a dry run. Actual generation
  uses `--generate` plus the credential file argument. The local key was supplied at
  `/Users/clipper/github/snowflake/out/secret/elevenlabs.txt`. Never print, copy into prompts,
  commit or expose its contents. Do not access it for visual/docs work.
- `scripts/pace-series-narration.mjs`, `scripts/pace-episode-two.mjs` and
  `scripts/pace-mandarin-narration.mjs` handle retained audio/pacing. Some default/hardcode old
  revision paths; read before running and use a new revision, not overwrite. Uncertain paid
  synthesis attempts must be investigated, not automatically retried.
- Current E01 English score points to `2026-09-17-e01-hook`; E02 English points to
  `2026-09-17-e02-juniper`. Current E01 Mandarin is `2026-09-18-e01-mandarin-yun`; the unreleased
  E02 keeps `2026-09-18-e02-mandarin-susan` until the maker asks for E02 work. Cue files live inside
  those revision directories; the 2026-09-17 and Susan E01 directories are retained history. Read
  the active JSON for current identities rather than assuming the newest folder name is active.
- The 2026-09-18 E01 Mandarin translates the current English ending directly, so its clock binds
  the current English import with no variation record. The retained 2026-09-17 revision still
  carries `docs/series-narration/2026-09-17-e01-hook/english-variation.json` and its
  `semantic-hook-v3` score as history; do not rewrite that provenance. Update semantic anchors
  deliberately if a future rewrite affects them.
- Preserve exact caption/paragraph ownership and actual performed timing. Rounding a caption
  onset across a paragraph boundary once caused reading to bounce backward. Do not hide a
  mapping error with more scroll smoothing. Language changes map story position, not equal
  seconds between two differently timed performances.
- Original atmosphere recipe verification:
  `node docs/series-sound/nivogenesis-v1/synthesize-opening.mjs --verify`.
  It is composed sound, not physical sonification; do not claim to have listened if only
  waveform/decoding/media state was inspected.
- Existing MP4 to preserve:
  `export/series-e01-zh-2026-09-17-fast-v2/Cryosphere-home-and-episode-1-mandarin.mp4`.
  Its historical filename is not a rename request. It predates later website changes.
  `scripts/export-series-e01.mjs` plus `src/series/seriesCapture.ts` own the current export
  workflow; the recipe is Mandarin-specific and fingerprints the built `dist` bytes. For an
  authorized new export use a new `SERIES_OUT`, never overwrite the retained run or reuse its
  chunks across changed fingerprints. Do not start a new export without an export task.

## Creative and scientific direction

Read the design guide fully. Our audience is a curious general adult or teenager, not a
specialist. Be thorough without a fixed episode runtime: extra time must buy understanding,
not prolonged preamble or static diagrams. Introduce, visibly explain, then build on concepts.

Write words and pictures together. The maker praised scene 5's intelligible two-way surface
exchange and scene 9's progressive construction: reveal the reference, demonstrate change,
then compare. Use these as methods, not a mandate to repeat their exact graphics. Select the
object being discussed, label unfamiliar objects/symbols at the moment needed, make growth or
shrink obvious over a short narrated interval, and preserve object identity across transitions.
Avoid stacked titles, all-at-once diagrams, unexplained numbers, near-static charts over long
speech and repeated on-stage production disclaimers. Keep secondary tools in Menu and full
provenance in Sources/optional reading; essential conditions still belong in the explanation.

Use the extensive actual crystal library and established rendering treatments. Inspect the
asset and its provenance; a model animation is not evidence that its mechanism is validated.
For NAS assets use authority `scripts/nas-root.ts` and `docs/nas-assets.json`, not hardcoded
mounts or new public exposure of private source bytes. Source-check both narration and what
the diagram implies. Historical chapter wording can need qualification; use primary sources
when a new scientific claim needs verification. Do not change the solver or run scientific
gates for a presentation-only task.

## Regression boundaries and completion

- Keep one audio owner. Opening playback is opt-in, waits paused for visual readiness, and
  pending starts/resumes must be canceled by Skip, Still, hiding, exit or episode takeover.
- Keep actual Run B geometry through handover. Do not replace the arriving model with a
  decorative glyph, or undo stable shading/retained drawing-buffer fixes.
- Static model previews redraw after CSS size **and DPR** changes. Obsolete asynchronous GPU
  boots must be canceled inside the factory before configuring a replacement's canvas.
- E02 release hold gates mounting, direct entry, home action and E01 continuation—not just CSS
  visibility. Its reusable models must remain available to the opening.
- For product edits, use affected focused tests, typecheck/build and relevant live checks.
  Latest website receipts are `docs/series-release-hold-verification.json` and
  `docs/series-nivogenesis-verification.json`; reproduce the relevant named commands, not every
  old test result. A useful opening/release selection is:

```sh
node --test scripts/series-release.test.mjs scripts/series-opening-sound.test.mjs scripts/series-localization.test.mjs scripts/series-continuous.test.mjs scripts/series-export.test.mjs
npm run build
```

If using the available Sites skill, follow its profile/build instructions instead of inventing
a different project setup. E01 drawing changes also use `scripts/series.test.mjs`; E02 work uses
`scripts/episode-two.test.mjs` and affected audio checks. Bilingual changes use
`scripts/series-bilingual-audio.test.mjs`; reading changes use `scripts/series-reading.test.mjs`.
Authority prose uses `npm run lint:rule7` and `git diff --check`. Exact root `npm test` is not
the default for isolated website work; follow AGENTS Rule 6 if the scope becomes scientific.

The maker has repeatedly requested visual inspection. Cold-load after renderer changes;
inspect normal-speed before/action/after, reverse/manual scroll, resize and narrow layouts as
relevant. Check controls and actual audio ownership, not only screenshots. Verify the affected
scientific wording and teaching sequence. Repair concrete defects, then state the real review
coverage. Automated tests and sampled viewing do not establish a full human audition, fluent
Mandarin review, general-adult comprehension or all-device performance.

At the end, update the affected authority plan/review and `docs/PROGRESS.md`, save/commit scoped
changes separately in each repository that changed, report any remaining dirty work and give me a concise
result plus the same preview URL. Do not push, merge, publish, delete old work or regenerate
unrelated media without my request.
