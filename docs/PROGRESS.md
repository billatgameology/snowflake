# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). The handoff mechanism is retired (maker direction
2026-08-20): this index plus the active plans are the sole live state, and work proceeds in
isolated worktrees per Rule 16.

## In progress: iOS report on the live site — 2026-09-18

The maker's iPhone screenshots (Chrome for iOS, a WebKit WebView) of the live site show large soft snow
blobs, oversized episode cards, a story card whose tap does nothing and a Play that "moves a little"
then stops; Android is fine. No iOS device or simulator exists on this Mac. Diagnosis from code and
phone emulation: iOS WebViews get the WebGL2 snowfall, whose near sprites are art-directed 15 px discs;
Episode 1's guided scroll treated iOS WebKit's asynchronously reported scroll positions (and tap wobble on
`touchmove`) as a manual takeover and paused itself; the opening held nine live WebGL2 contexts and a
112 MB heap at arrival. Website `explore/film-part1@3c3677e` (not yet live; live stays at `30d05f6`):
phone-scaled WebGL2 sprites, an envelope-based takeover test plus a ten-pixel touch threshold, compact
cards (336×102 CSS px), three live recorded renderers and half-resolution marker volumes on touch devices
(peak seven contexts, 62 MB heap), plain-`vh` fallbacks, and an opt-in `?diag=1` overlay (user agent,
viewport/canvas metrics, renderer mode, contexts, marker states, every media `play()` outcome, errors).
Deployed to the preview channel `https://nivogenesis--ios-dp3vhdsa.web.app` (expires 2026-09-25);
99/99 focused tests, release test and preview smoke clean; phone-emulation captures viewed. Next: the
maker tests that preview on the iPhone (`?diag=1` for the readout); promote with
`firebase deploy --only hosting --project nivogenesis` from a committed head if it resolves the report.

## Completed Nivogenesis public release — 2026-09-18

**Live at https://nivogenesis.web.app** (Firebase Hosting, Spark). The maker-authored
[public release plan](plans/explore-nivogenesis-public-release.md) was executed after a second-pass
review; its completion record names the deployed website commit `30d05f6` (tag
`nivogenesis-public-2026-09-18`, pushed; merged into `explore/film-part1` at `fa26ecd`), the 32-file,
74,390,477-byte public output, 99 focused passes with the eleven-control release test, clean
emulator/preview/live smokes on desktop and mobile emulation, and the
[independent science review](reviews/nivogenesis-e01-public-science-review-2026-09-18.md) (Opus,
no shared context; site fixes applied before launch, chapter follow-ups deferred). The public site
carries only the opening and Episode 1 in English and Mandarin (Yun); experiments, the film, drafts and
the frozen Episode 2 stay local. Local dev routes changed with it: `/`, `/episode-1`, `/experiments`.
Next: the maker views and listens on the live site; education-chapter follow-ups are the next content task.

## Completed Chinese refinement, Susan audition and Yun restoration — 2026-09-18

The maker supplied a DeepSeek rendering as a second reference and ElevenLabs voice
`0H4ruoQ81Ei2FCwjW5j1` (Susan), then after listening chose the earlier Yun voice again and froze
Episode 2. The [bilingual plan amendments](plans/science-series-bilingual.md#translation-refinement-and-susan-voice-amendment--2026-09-18-planned-before-implementation)
govern both steps. Both episodes' Simplified Chinese was refined at phrase-anchor granularity; an
independent 137-agent review then confirmed 18 of 39 findings, and the E01 fixes were applied before
regeneration (authority `docs/video/science-series-e01-zh-CN.json`; E02 findings deferred). Website
`explore/film-part1@e343142` plays E01 Mandarin from `2026-09-18-e01-mandarin-yun` (Yun
`4AfodMgwXps9oZFhHzoj`; paced 1361.6309977324263 s, SHA-256
`b59d63ab8e46893fb835de04c669eb5bc416ad0db600ec7b730c1653f4a99779`, 317 anchors, 3 holds); E02's live
score keeps `2026-09-18-e02-mandarin-susan` (918.683514739229 s), unreleased and unchanged; the Susan E01
and 2026-09-17 revisions are retained history. Website `docs/series-mandarin-yun-verification.json`
records 97 focused passes, zero failures, TypeScript/build success, rerun audits, an ASR spot-check and
sampled desktop/phone live checks. The [review](reviews/science-series-mandarin-susan-2026-09-18.md)
and its addendum record the translation decisions, the loudness measurements (Yun −28.8 LUFS vs English
−25.2 LUFS; no gain change) and the open listening limits. English narration, old film, E02 release hold
and the completed MP4 are unchanged. Next: maker listens in 中文 at the existing E01 URL.

## Completed Nivogenesis opening update — 2026-09-17

**Completed follow-up:** the maker requests removal of All experiments, the new tagline
“Every flake is a record of its fall.”, matching cards and an E02 Coming soon release hold.
The [bounded amendment](plans/explore-journey-science-series.md#opening-copy-and-episode-2-release-hold--planned-2026-09-17)
preserves E02 source/assets while hiding its content and entry actions. Website `d7eb937`
implements the release gate, matching cards and localized tagline. Website
`docs/series-release-hold-verification.json` records 31 focused passes, zero failures,
TypeScript/build success, equal card bounds on default/phone layouts, no E02 content/audio at
the series and direct episode URLs, and retained E01 playback. Next: maker viewing of `/series`;
E02 remains unreleased until explicitly requested. Its recordings still supply opening models.

The maker requests the Nivogenesis series name, removal of the top original-film link, three
additional E02 recordings in the opening and original sound design. The
[bounded amendment](plans/explore-journey-science-series.md#nivogenesis-identity-opening-collection-and-sound--planned-2026-09-17)
governs implementation. Website `explore/film-part1@1f0fbd5` adds the name, recorded collection
and optional original sound, including reviewed loading/cancellation, replay and resize fixes.
Website `docs/series-nivogenesis-verification.json` records 67 focused passes, zero failures,
TypeScript/build success and complete WAV reproduction/decode. The
[review](reviews/science-series-nivogenesis-2026-09-17.md) records sampled visual checks and the
remaining human-listening/performance limits. Design guide updated. Next: maker viewing and
audition with **Play with sound** at the existing series URL. Original film, narration, routes
and completed export remain preserved; no deployment or new MP4.

## Completed opening inspection and E01 follow-up — 2026-09-17

The maker's latest screenshot requests real inspectable snowfall crystals, removal of two
on-stage notes, a labelled droplet/air explanation and a next-episode closing hook. The
[bounded amendment](plans/explore-journey-science-series.md#opening-inspection-and-e01-follow-up--2026-09-17-planned-before-implementation)
governs work in the retained website checkout. Website `explore/film-part1@725c69c` implements
real recorded-model inspection, note removal, labelled below-drop airflow and the new English
ending. The new final take is retained under website `docs/series-narration/2026-09-17-e01-hook/`;
earlier takes and Mandarin audio remain unchanged. Website `docs/series-opening-verification.json`
records 64 focused passes, zero failures and TypeScript/build success. The
[follow-up review](reviews/science-series-e01-opening-followup-2026-09-17.md) records independent
source/audio checks, sampled phone/desktop visual checks and remaining listening limits.
The design guide is updated. Prior film, E02 and completed export stay preserved. Next: maker
viewing of the same series/E01 page, not a new export or an audience-acceptance claim.

Small follow-up: website `64ce9c6` changes the shared visible English language button to `EN`,
retaining `English` as its accessible name and preserving switching behavior. Localization
checks (`node --test --test-reporter=dot scripts/series-localization.test.mjs`) and the Sites
portable build (`tsc -b && vite build`) passed; no audio or content changed. Next remains
maker viewing of the existing page.

## Completed English E01 attention revision — 2026-09-17

The maker requests a sweeping declutter/progressive-reveal pass after the scene-7 screenshot,
with chapter navigation/Sources/Still behind one Menu and the scene-9 build-up used as the
reference. The [series plan amendment](plans/explore-journey-science-series.md#english-e01-attention-pass--2026-09-17-planned-before-implementation)
governs website work and the canonical design-guide update. The Menu, reduced stage text and
all-section attention pass are implemented; spoken source and recordings remain unchanged.
Shared display labels retain Chinese equivalents, while the prior film, E02 and completed MP4
are preserved. The canonical guide now records the clutter critique and bounded scene-9 praise.
Website `explore/film-part1@4d7cc52` contains the revision. The
[review](reviews/science-series-e01-attention-2026-09-17.md) records the per-section pass,
bounded non-author findings and repairs, and sampled narrow/desktop interaction checks.
Website `docs/series-e01-attention-tests.txt` records 61 passes, zero failures;
`docs/series-e01-attention-build.json` records build/typecheck success. This is ready for maker
viewing, not audience acceptance. Next: review the existing E01 page; no new audio or MP4 needed.

## Completed media export — 2026-09-17

The maker requests twice-speed series opening growth and one home → continuous entry → E01 MP4.
The [bounded export plan](plans/science-series-home-e01-export.md) governs the implementation in
the retained website worktree. Current Mandarin narration and landscape export are the stated
working choices. No source words, recordings, old film, solver or scientific gate will change.
The faster opening and fixed-frame compositor are implemented; the prototype and sampled section
frames were inspected. Website `docs/series-export-checks.json` records focused tests/build results.
The complete MP4 is under website `export/series-e01-zh-2026-09-17-fast-v2/`; the
[review](reviews/science-series-home-e01-export-2026-09-17.md) records full decoding/timestamp
verification, independent audio/chunk audits and bounded decoded visual inspection. Website
`docs/series-export-final.json` records the exact file identity and source receipts. Next: maker
playback review of the retained MP4; no further render or narration rewrite is required.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 (Phases 0–5 and early
Phase 6) are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md); its body is
byte- and SHA-256-pinned by `runner/test/progress-index.test.ts`. The detailed Phase 6, 8, and
9 entries pruned from this index on 2026-08-20 are preserved as last written in
[progress-history-phases-6-8-9.md](progress-history-phases-6-8-9.md). Both are historical, not
current authority; open them only when this index, a plan, ADR, or audit links to historical
detail.

## Current state

- **Refined Chinese text, Susan audition and Yun restoration complete (2026-09-18).** E01 Mandarin
  plays Yun (`4AfodMgwXps9oZFhHzoj`) over independently reviewed refined text; E02 is frozen on its
  Susan revision and unreleased. Details in the top entry and the
  [review](reviews/science-series-mandarin-susan-2026-09-18.md). The 2026-09-17 production below is
  retained history. Next: maker listening in 中文.

- **Mandarin narration and same-page language switching complete (2026-09-17; superseded by the
  2026-09-18 Susan revisions above).** Maker
  supplied voice `4AfodMgwXps9oZFhHzoj`, authorizing production for the already translated E01/E02.
  The [bilingual plan amendment](plans/science-series-bilingual.md#mandarin-production-amendment--2026-09-17)
  now covers source-bound takes, semantic alignment and same-page audio switching. Preserve
  current English source/audio and visuals. Both source-bound Mandarin masters and semantic
  mappings are generated in website `explore/film-part1@d434084`; the same-page toggle selects
  matching audio at the current idea.
  The [production review](reviews/science-series-mandarin-production-2026-09-17.md) records
  independent source/signal/timing checks, late-reveal repairs and bounded live desktop/narrow
  playback. Website `docs/series-mandarin-tests.txt` records 76 passes, zero failures;
  `docs/series-mandarin-build.json` records TypeScript/build pass. No complete human listening
  or audience acceptance is claimed. Next: maker listens in 中文 and reviews understanding.

- **Episode 1 maker playback repair complete (2026-09-17).** The
  [active series plan](plans/explore-journey-science-series.md#maker-playback-repair--2026-09-17-planned-before-implementation)
  lands as website `explore/film-part1@9fd4a37`: source-owned forward reading, Libbrecht's introduction, controlled scene-6
  experiments and a full scene-9 reference/extra-water rewrite; Chinese text follows the new
  meaning. The [review](reviews/science-series-e01-clearer-2026-09-17.md) names the edits,
  independent science/audio review and sampled desktop/narrow playback. Website
  `docs/series-e01-clearer-tests.txt` records **68 passes, zero failures**; build/typecheck pass.
  Audio `docs/series-narration/2026-09-17-e01-clearer/paced-report.json` records
  **956.3235169999996 s**, SHA-256
  `d69db9caac009f1e73b8b64d6126950732ba3ec3437bc3b655c9e17b8105cb6e`.
  Every future spoken-English rewrite now includes matching Juniper narration under maker
  direction. Mandarin production is tracked above. Next: maker listening/teach-back; no
  subjective or audience acceptance is inferred from these technical checks.

- **Same-page Chinese text complete (2026-09-17).** Website `explore/film-part1@e37bf80`
  adds one **English / 中文** toggle to the existing series home/E01/E02, with translated
  reader, controls and diagram labels. Same URL and story position are retained; English
  recordings remain unchanged and Chinese mode identifies English audio. The
  [review](reviews/science-series-bilingual-2026-09-17.md) records translation/runtime repairs
  and bounded browser checks; website `docs/series-localization-tests.txt` records **64 passes,
  zero failures**, and the TypeScript/production build passes. The
  [plan](plans/science-series-bilingual.md) records that text-only milestone and the newly
  authorized Mandarin extension above. Next: maker reads/listens to Chinese.

- **Episode 2 full Juniper narration complete (2026-09-17).** Website
  `explore/film-part1@5fcd95a` adds the latest E01 voice to all eight unchanged E02 scenes.
  Actual media time owns the visuals and continuous scrolling, including four real prediction
  pauses; E01/home/original film are preserved. Website
  `docs/series-narration/2026-09-17-e02-juniper/paced-report.json` records **664.5643310657597 s**,
  SHA-256 `6cb793dca161eb7b39430294ace35d52e650a4f3fe47e88673255e401e28ecec`.
  `docs/episode-two-audio-tests.tap` records **86 passes, zero failures**; typecheck/build pass.
  Independent source/signal/ASR checks and sampled desktop/narrow playback are in the
  [audio review/edit record](reviews/science-series-e02-review-2026-09-16.md#authorized-juniper-narration-and-synchronization--2026-09-17).
  Next: maker listening/comprehension review, not automatic resynthesis or E03. Full human
  listening and fresh audience acceptance are not claimed.

- **Episode 2 updated-guide revision complete (2026-09-17).** Website
  `explore/film-part1@414dbe85c704fc750dec7db66057717a62d46de7` revises the silent episode
  with conversational explanation, demonstrated prerequisites, substantive optional reading
  and visible prediction/reveal beats. The [plan](plans/science-series-episode-2.md#updated-guide-comprehension-revision--2026-09-17)
  and [review/edit record](reviews/science-series-e02-review-2026-09-16.md#updated-guide-comprehension-revision--2026-09-17)
  name source/runtime repairs and bounded desktop/narrow viewing. Website
  `docs/episode-two-guide-tests.tap`: **82 passes, zero failures**; TypeScript/build pass.
  New E01, home, original film and crystal assets are preserved. Next: maker comprehension
  review and later authorized spoken rehearsal; no E02 audio or audience acceptance claimed.

- **Future-episode design reference updated (2026-09-17).** The
  [canonical guide](video/science-series-design-guide.md) now integrates the conversational
  production lessons: demonstrated prerequisites, visible input changes, prediction/reveal
  timing, reference-before-surplus, usable optional depth and actual-audio cue ownership.
  Its workflow, scene worksheet and scoped review checklist distinguish technical readiness,
  human listening and audience understanding. Earlier scene critiques remain historical,
  not approval of the revised cut. Documentation only; website, script and audio unchanged.
  Next: use this guide in the next authorized episode's existing plan/shot table; E01 still
  awaits the human listening and general-adult teach-back recorded below.

- **E01 conversational production and review/edit loop complete (2026-09-17).** Website
  `explore/film-part1@1fd50e6cde5e49e7d553c60126ce45b2e8b31201` implements the eleven-section
  revision with the requested voice `aMSt68OGf4xUZAnLpTU8` (Juniper). Its
  `docs/series-narration/2026-09-17-conversational/paced-report.json` records **945.981724 s**;
  `docs/episode-one-conversational-tests.tap` records **52 passes, zero failures**.
  TypeScript/build pass. [Review and limits](reviews/science-series-e01-conversational-production-2026-09-17.md)
  record source checks, independent audio decode/alignment/ASR, bounded desktop/narrow
  playback, timing/attention repairs, manual takeover, Still and natural end. Old film,
  prior audio, home and E02 remain preserved. Next: human listening and fresh general-adult
  teach-back, particularly scenes 5/6/8/9—not another automatic narration or compression pass.

- **E01 narration-tone direction adopted (2026-09-17).** The maker approved the teenager-friendly
  two-neighbours sample. The [approval draft](video/science-series-e01-comprehension-draft.md)
  now uses that conversational, concrete voice throughout, with the fixed-condition qualifiers
  and separate quantitative reader retained. The [guide](video/science-series-design-guide.md#narrators-voice--maker-approved-direction-2026-09-17)
  records the voice for future writing. This was initially tone-only approval; the later
  production request and completed checkpoint above supersede its no-import/no-audio boundary.

- **E01 full comprehension review and approval script (2026-09-16).** A maker-reported general
  adult was lost after scene 6; the [full review](reviews/science-series-e01-comprehension-review-2026-09-16.md)
  identifies prerequisite debt from scene 3 and overload in scenes 6/8. The separate
  [approval draft](video/science-series-e01-comprehension-draft.md) explains equilibrium before
  reuse, puts pressure after the relay payoff and retains quantitative depth in supplied reader
  text. The guide now requires demonstrated prerequisites and plain-language understanding
  checks. Only the requested circular magnifier/wavy-liquid live visuals change; existing words
  and narration remain intact. Website `2ecebe2d7cd97fee7a35af683e420bd3525e67d6` records
  **87 passes, zero failures** in `docs/episode-one-comprehension-tests.tap`; TypeScript/build
  and bounded visual checks pass. Full verification is in the review; next is maker
  script approval and a subsequent audience check, not automatic narration generation.

- **Episode 2 maker revision: library and molecular continuity (2026-09-16).** Website
  `explore/film-part1@707ca01ec8f9c753f49389ac667e6559c8268daa` replaces the opening drawings
  with recorded crystals, adds three further library growths, removes the history detours,
  defines necessary symbols and carries an explicit-H sheet through rotation into a connected
  network. [Plan](plans/science-series-episode-2.md) and
  [review/edit record](reviews/science-series-e02-review-2026-09-16.md#maker-revision--recordings-and-a-continuous-molecular-story)
  document source/asset checks, code-review repairs and bounded desktop/narrow viewing.
  Website `docs/episode-two-revision-tests.tap` at that commit: **85 passes, zero failures**;
  TypeScript/build pass. Home/E01/old film preserved; no audio generation or scientific gate.
  Next: maker comprehension/pace review of the eight-scene silent revision.

- **Episode 2 complete silent draft, science/design review and repairs (2026-09-16).** Website
  `explore/film-part1@f02a3be751e32d70ac26584651b564620ed2bf4c` adds `/series/episode-2`
  in the same continuous document, preserving home, E01 and the original film. The [E02 plan](plans/science-series-episode-2.md),
  [source-bound script](video/science-series-e02-script.md) and [review/edit record](reviews/science-series-e02-review-2026-09-16.md)
  cover fact checking, original structure animations, semantic-label/continuity repairs and
  exclusive playback. Website `docs/episode-two-tests.tap` at that commit records **81 passes,
  zero failures**; TypeScript/build and bounded desktop/narrow viewing checks passed. No audio
  generation, credential access, scientific suite/gate, export or deployment. Next: maker
  comprehension/pace review; final narration/alignment and physical-phone checks remain pending.

- **Science-series maker critique is now reusable design guidance (2026-09-16).** The
  [guide](video/science-series-design-guide.md) records the maker's feedback across the pilot,
  home and E01, actual praise versus unaccepted repairs, and concrete future-episode design/
  review requirements. The active plan's shot-table/done criteria, media specification and
  E01 guide link it. Next: use it while reviewing the latest E01 passages and drafting later
  episodes; no new scene, narration, scientific or publication acceptance is implied.

- **E01 meaning-before-numbers follow-up implemented (2026-09-16).** Website
  `explore/film-part1@c3143a2dbc4ce7d9902515b58614156b6c0cefc0` clarifies liquid/gas and
  supercooling in scenes 3–4, shows scene 6's same air keeping liquid steady while ice grows,
  and replays material transfer before scene 10's concrete shape questions. The
  [bounded amendment](plans/explore-journey-science-series.md#e01-meaning-before-numbers-follow-up--2026-09-16)
  and [review](reviews/science-series-e01-visual-cues-2026-09-16.md#meaning-before-numbers-follow-up)
  record source/depiction repairs and bounded desktop/phone playback, reverse/Still checks.
  Website `docs/series-tests.tap` at that commit records **72 passes, zero failures**;
  TypeScript/build pass. Narration, home and old film remain intact. Next: maker comprehension/
  listening acceptance; no synthesis, scientific suite/gate, export or publication.

- **E01 transport/amount/reservoir follow-up implemented (2026-09-16).** Website
  `explore/film-part1@068dc120037063c28b4ee78034307fcd6dc82695` adds moving surrounding-air
  paths in scene 7, equal-volume counted water and separated surplus in scene 8, and one
  persistent cloud population through scene 9. The
  [bounded amendment](plans/explore-journey-science-series.md#e01-transport-amount-and-reservoir-follow-up--2026-09-16)
  and [follow-up review](reviews/science-series-e01-visual-cues-2026-09-16.md#air-counted-water-and-persistent-cloud-follow-up)
  record source recomputation, bounded desktop/phone playback/seek/Still checks and the
  unchanged-source build retry. Website `docs/series-tests.tap` at that commit records
  **68 passes, zero failures**; TypeScript/build pass. Narration, earlier drawings/cues, home
  and old film remain intact. Next: maker comprehension/listening acceptance; no synthesis,
  scientific suite/gate, export or publication.

- **E01 full visual storytelling pass implemented (2026-09-16).** Website
  `explore/film-part1@68e31f265b4b463a528cf53ef608968698cf5528` adds labelled cloud formation,
  same-seed surface magnification and staged explanations through scenes 6–10. The
  [visual guide](video/science-series-e01-visual-guide.md) records the first-five-scene lessons;
  the [review/edit record](reviews/science-series-e01-visual-cues-2026-09-16.md#full-visual-storytelling-pass)
  records contact-boundary, two-way traffic, reservoir, readability and Still repairs.
  Website `docs/series-tests.tap` at that commit records **66 focused passes, zero failures**;
  TypeScript/build and bounded desktop/phone-sized playback/seek/Still checks pass. Narration,
  home, accepted surface mechanics and old film remain intact. Next: maker comprehension and
  uninterrupted listening acceptance; no synthesis, solver work, export or publication.

- **E01 identity/sequence follow-up implemented (2026-09-16).** Website
  `explore/film-part1@094911865d2e1af3de44e837bce6dfbf911996a0` sustains opening-budget
  vapour arrivals, removes the premature crystal from the cloud passage, and distinguishes
  liquid, non-ice speck and first ice in a labelled magnified cutaway. The accepted surface
  scene's drawing/cue remain byte-identical to `82c4e10`. The
  [review follow-up](reviews/science-series-e01-visual-cues-2026-09-16.md#maker-follow-up-identity-and-sequence)
  records freeze-continuity/label repairs and bounded desktop/phone-sized inspection;
  website `docs/series-tests.tap` at the new commit records 60 focused passes. TypeScript/build
  pass, narration/home/old film remain intact. Next: maker comprehension/playback acceptance;
  no new synthesis, export, solver work or publication.

- **E01 visual-cue revision implemented (2026-09-16).** Website
  `explore/film-part1@82c4e10b7698f6c47b1a871df6ff10eefd5c5a8e` revises E01-01 through
  E01-05 with clear opening typography, a pointed-out shrinking donor, narrated grid focus,
  staged cloud/nucleation views and an explicitly magnified, visibly moving ice face. The
  [review/edit record](reviews/science-series-e01-visual-cues-2026-09-16.md) records timing,
  source-depiction, small-window and Still repairs; website `docs/series-tests.tap` at that commit records
  58 focused passes. TypeScript/build and bounded desktop/phone-sized browser checks pass.
  Narration/source bytes, accepted home and old film are preserved. Next: maker playback
  acceptance of these cues, then uninterrupted listening and real-phone checks. No synthesis,
  solver work, export or publication occurred.

- **Continuous series/full E01 narration implemented (2026-09-16).** Website
  `explore/film-part1@fd4ee2f2c61004dab8629b5920372b418e3a4767` preserves the opening
  handover, repairs the observed dark streaks, makes episode growth visible with fixed
  framing, and places home/E01 in one document with narrated auto-scroll/manual takeover. The
  [bounded revision](plans/explore-journey-science-series.md#continuous-series-renderer-repair-and-full-e01-voice--2026-09-16)
  also authorizes full unchanged E01 narration using supplied voice `yUj9r3iC7zOlXqMJy2qy`,
  visibly labeled AI-generated. Source-bound synthesis is complete: the website's
  `docs/series-narration/report.json` records all 10 sections, 844.6750120000002 seconds,
  master SHA-256 `8d734b20709c0eda4081b28a7050a29b5fc40da969d7cd3b820b3a672c23214c`.
  Independent source/hash/decode review found no missing stored text; this is not human
  listening acceptance. `docs/series-tests.tap` at that website commit records 52 focused
  passes; TypeScript/build and bounded desktop/phone visual and keyboard/wheel checks pass.
  [Review/edit record](reviews/science-series-continuous-e01-2026-09-16.md) names exact
  scope, repairs, hot-reload observation and untested device/listening boundaries. Prior
  film/sample assets remain intact. Next: maker uninterrupted listening and real-phone check;
  no regeneration, later episode, export or publication is implied.

- **E01 opening voice sample implemented (2026-09-15).** Website
  `explore/film-part1@d36ba9eca25b8cef108afafbbe14789d4b585873` includes the requested
  Isla Sterling / ElevenLabs opening sample. Its `docs/series-audio-sample/report.json`
  binds 37.941406 seconds / 608174 bytes / 72 unchanged opening words; the sample owns
  playback/caption timing, pauses at its end, and offers explicit silent continuation.
  `docs/series-tests.tap` records 43 passing focused tests; typecheck/build and bounded
  browser playback/phone inspection passed. [Review](reviews/science-series-home-e01-2026-09-15.md#opening-audio-sample-follow-up)
  records repairs and limits. Original film unchanged; no full-episode synthesis or final
  narrator selection. Next: open E01 and listen; maker voice/performance acceptance is pending.

- **Separate series home and complete E01 visual draft implemented (2026-09-15).** Website
  `explore/film-part1@8c336ff0dcd88e51d6bfc8308a57eda8782b34a4` adds `/series` and
  `/series/episode-1`, preserving the old film. The home joins Run B growth to the actual
  Hero1 snowfall, then the title/episode entry. The [source-reviewed script](video/science-series-e01-script.md)
  is imported into a full scroll/playback reader with owned illustration timing and Still mode.
  [Review and repairs](reviews/science-series-home-e01-2026-09-15.md) record exact provenance,
  browser observations and limitations. The website's `docs/series-verification.json` records
  10 sections / 2,241 narration words / 1145.1363636363637 provisional seconds;
  `docs/series-tests.tap` records 35 passing focused tests. TypeScript/build passed.
  Next: maker editorial viewing/read-through, physical scroll interruption check, and later
  narration alignment. This is a pre-narration draft, not audience acceptance or publication.

- **Science-series editorial rework prepared (2026-09-15).** Maker feedback
  [JTS-M010/M011](journey/TRANSCRIPT.md#jts-m010--the-format-works-the-content-needs-rethinking)
  accepts the scroll/playback format while questioning the opening pace, missing depth and
  crystal presentation. The new [active plan](plans/explore-journey-science-series.md) removes
  the single-film runtime ceiling and organizes chapters 1–13 into provisional question-led
  episodes: observations, mechanisms, experiments, counterexamples and scoped conclusions.
  [JTS-M012](journey/TRANSCRIPT.md#jts-m012--use-the-animation-library-and-rendering-experiments-freely)
  adds extensive reuse of the animation library and tested renderers, plus new rendering
  treatments as needed. Visual attraction is a core requirement; the plan now links the source
  catalogs/render studies and calls for episode shot shortlists and inspection in motion.
  Episode count and lengths remain open. The working map, first-episode treatment and visual
  revision target are written; revised scripts and visuals are not yet produced. The old film
  remains a reusable technical pilot with its identified score/export unchanged, not an
  approved series edit. Next: draft E01's full script with section-level source disposition and
  browse the visual library alongside it, then test a representative crystal/mechanism sequence
  before expanding production. This documentation change does not alter the website, audio,
  scientific work or publication state.
  Documentation checks: `node scripts/lint-rule7.mjs` and `git diff --check` pass; no product or
  scientific suites were needed for this prose-only rework.

- **Opening voice comparison ready (2026-09-15).** At the maker's request, ElevenLabs Lydia
  and Isla Sterling read the same unchanged opening excerpt with the same generation settings.
  Local `out/film-part1-voice-sample-oN30O8/report.json` records Lydia at 27.724626 seconds;
  `out/film-part1-voice-sample-XjXJPP/report.json` records Isla at 30.278821 seconds. Both
  complete MP3 decodes passed; audio and non-secret timing/settings are beside each report. The
  [audition record](plans/explore-film-part1-science-scroll-documentary.md#opening-voice-audition--2026-09-15)
  binds its identity and retained shorter take. Maker listening remains optional input to the
  voice choice; these audition the old opening, not the revised series. This is an audio-only
  sample; no website, score, full-film export or final narration choice changed.

- **Earlier single-film technical pilot complete (2026-09-15).** The requested pre-narration
  implementation and its recorded review/edit loop reached the credits. The
  [complete receipt](video/part1-complete-verification.json) derives 2120 seconds / 82 rows /
  3924 spoken words / 229 provisional captions from the identified prepared score, imported
  from `95c837678291014327af6b6970596d17dc244d22`. Website implementation is
  `9d181afb6937a1e91fb89091b3543091c5f46eb5`, with final execution documentation at
  `a0163d360bbd252b2cb442465c3e7b23d6c5500c`. The receipt records 27 focused tests,
  successful typecheck/build, 10 complete-film / 8 opening / 18 prototype browser checks,
  exact representative reverse/reload captures and the verified full viewing copy.
  Website `export/part1-full-final/report.json` records 63600 frames, 2120 seconds,
  71 checked chunk-boundary pairs and 3158.362 seconds of render/verification wall time
  with two workers. The MP4 and VTT are beside that report; this is an 8-bit 1080p/30-fps
  timing-only copy, not recorded narration. Root inspected decoded samples spanning every
  scored row and selected joins/end states, not an uninterrupted watch. The
  [review/edit record](reviews/film-part1-complete-review-2026-09-15.md) documents source,
  drawing, pacing, camera and runtime repairs with reviewer provenance and limits.
  The series rework above now supersedes this cut's editorial direction: recording the old
  full script is no longer the next step. Its checks remain scoped to the identified pilot,
  not evidence that the maker accepted its content or crystal treatment. Nothing was pushed,
  merged or published; the original website checkout is clean.

- **Earlier Part 1 prepared-film milestone (2026-09-15).** Maker direction: “Keep going.” The
  [bounded next slice](plans/explore-film-part1-science-scroll-documentary.md#next-prepared-film-slice--2026-09-15)
  adds S06/S11/S09/S13 from the reviewed production score: molecular structure, surface
  growth, diffusion and corner feedback. The source-bound
  prepared score at that milestone was imported from `a2c5555`; website
  implementation is committed at `834c7690cc46ec9da8cfae09344ce9814597e1f4`. The
  [receipt](video/part1-prepared-verification.json) derives 1040 seconds / 40 rows / 1930 words /
  113 captions and records 21 focused tests, 9 prepared browser checks, 8 opening checks,
  18 prototype checks and successful build. Its 59 sampled still entries pass exact repeated/
  reverse/reload comparison on the named capture recipe; a 6.000000-second / 180-frame sample
  decodes successfully. The 21.811-second export wall time is sample cost, not full-film performance.
  [Visual findings and repairs](reviews/film-part1-prepared-implementation-2026-09-15.md) include
  the lattice, contour field, branch camera, portrait figures, late-metadata seek and control-focus
  scrolling. Default `/film/part-1` is now the prepared film; `/opening` and `/prototype` below
  that route preserve both earlier editions. Nothing was pushed/published; original checkout
  remains clean. This bounded milestone is superseded by the complete visual-film record above.

- **Part 1 opening chapter implemented and checked (2026-09-15).** The maker
  accepted the prototype revision and asked to continue. The separate
  [opening score](video/part1-opening-score.json), imported from `aea24c1`, compiles reviewed
  S00/S01/S02/S05 into 20 rows / 520 seconds / 56 provisional captions; reproduce with
  `node scripts/build-part1-opening-score.mjs --check`. Website
  `explore/film-part1@a1c7ed32d8acb8e468885405f31a34dab874fe15` has the chapter, original diagrams,
  sequence navigation and reading editions implemented. The
  [implementation/visual record](reviews/film-part1-opening-implementation-2026-09-15.md) and
  [receipt](video/part1-opening-verification.json) record 13 focused tests, 8 opening browser
  checks, 18 prototype browser checks, the successful TypeScript/Vite build and decoded
  6.000-second / 180-frame sample. Its 19.56-second export wall time is bounded sample cost;
  full-film performance is unmeasured. This earlier opening milestone is now retained at
  `/film/part-1/opening`; the default route is the extended prepared film described above.
  `/film/part-1/prototype` preserves the original comparison study.
  The
  earlier [implemented revision](reviews/film-part1-visual-revision-2026-09-15.md) addressed the
  requested visual review: full-width watch presentation, cropped opening detail, directed
  corner close-up, aligned representation cuts, in-renderer ending pullback and phone
  image-only reading/seek fixes at website `3e17dfa`. Current website worktree:
  `/Users/clipper/github/snowcrystal_website-film-part1`; preview
  `http://127.0.0.1:5185/film/part-1`. Nothing was pushed or published; the original hero
  checkout remains clean and untouched.
  The [earlier revision receipt](video/part1-visual-revision-verification.json) covers the
  80-second prototype, not the new opening or full film. New visual observations,
  independent-context limits, repaired failures and remaining polish are in the opening record.
  The original [receipt](video/part1-prototype-verification.json) and
  [visual critique](reviews/film-part1-visual-review-2026-09-15.md) are historical.
  The [full script](video/part1-script.md) and resolved
  [source audit](reviews/film-part1-script-review-2026-09-15.md) are unchanged. The score's
  inactive `productionDraft` still records 3,924 spoken words and a provisional 2,120-second
  (35:20) cut; reproduce with `node scripts/build-part1-production-score.mjs --check`.
  These opening-only checks are historical; use the complete-film receipt above for current
  implementation status. The prototype's embedded full draft remains inactive: the separately
  identified prepared artifact supplies the complete film.

- **Earlier Part 1 film plan reviewed and revised (2026-09-15).** The then-current direction
  (`JTS-M009`, now superseded by `JTS-M011`) used education chapters 1–13 as flexible source
  material for a documentary under one hour, with the maker's narration and generated web
  visuals in playback/manual reading.
  The [review](reviews/film-part1-plan-review-2026-09-15.md) assesses original commit `d7d1de7`
  and records applied story, scientific-wording, pacing, accessibility and runtime corrections.
  [The revised plan](plans/explore-film-part1-science-scroll-documentary.md) keeps Run B as the
  story object, makes the scene list optional editorial material, replaces the rushed cold open,
  and puts a representative visual/playback/export prototype before bulk production. Current
  sources govern claim scope; the old Phase 6 education freeze is not reinstated.
  Documentation checks pass: `node scripts/lint-rule7.mjs` and `git diff --check`; the review
  records the sample-script arithmetic and limits. No runtime or final narration existed at
  that review point; the execution entry above is current.
  The [author-response addendum](reviews/film-part1-plan-review-2026-09-15.md#author-response-and-wp1-notes)
  records the source-wording refinements for WP1 and the author-run graph check; the revision
  and prototype-first sequence are retained. Its accepted wording and reveal refinements are
  incorporated into the full narration draft.
- **macOS dev-server guard defect fixed; NAS closeout checked from the Mac (2026-09-09).** On this
  Mac the documented `npm run dev --workspace app -- --port 5191` served every gallery page as an
  unstyled "Loading…" shell. The repository-local `/@fs` guard in `app/vite.config.ts` strips
  `/@fs/` and then requires an absolute path, but on POSIX Vite emits `/@fs/Users/...` with the
  leading slash consumed, so every hoisted `node_modules` module (Vite's own `env.mjs` first) was
  refused while the double-slash fixtures in `runner/test/vite-nas-serving.test.ts` stayed green;
  Windows was unaffected because its remainder is `C:/...`. The fix mirrors Vite's `fsPathFromId`
  (re-prefix the slash, then the same allow/deny decision) with a regression test on the emitted
  form; a pre-fix/post-fix probe returned 403/204 for `env.mjs` and 403/403 for an `out/` file.
  Focused boundary tests 23/23, typecheck, Rule 7 (1,330 files) and the app build pass
  (`out/nas-verify-2026-09-09/fix-checks.log`). The change is committed on branch
  `fix/vite-fs-guard-posix`; the visual-studies section under Next step holds its PR and merge record. Separately, the marked
  `snowcrystal` share mounted at `/Volumes/snowcrystal`; `assets:verify` confirmed both owner
  manifests and aggregates without reading payload; the gallery-facing subset of
  `render-worktrees-closeout@2026-09-04` copied to local `out/` matched the tracked manifest
  byte-for-byte (315 files / 388,459,029 bytes in `out/nas-verify-2026-09-09/gallery-subset-copy.json`;
  99 volume previews in `volume-previews-copy.json`); and the `--full` hash verify of that
  collection, followed by the scientific collection, started at 2026-09-09T23:31:09Z
  (`out/nas-verify-2026-09-09/full.timeline.log`, `*.full.log`, `*.full.exit`). The documented
  130 GB + 84 GB local restore cannot run on this Mac (41 GiB free); the closeout section below
  records that. The dev server on `127.0.0.1:5191` now serves all 151 animations from that subset.
- **Animation/main integration is resolved (2026-09-06).** The maker requested a PR and merge.
  Both Vite gallery services and the newer main records are retained. A missing-local-scenes
  startup failure is corrected by validating generated Compose files on request; the hash and
  growth allowlist checks remain enforced. App build, fresh-checkout service tests and a browser
  smoke pass (`out/main-integration/build-final.log`, `catalog-test.log`, `browser-smoke.json`).
  The [integration follow-up](plans/dendrite-visual-studies.md) records full-check and publication work;
  [PR #11](https://github.com/billatgameology/snowflake/pull/11) holds the live checks and merge record.
  Exact `npm test` is **not green**: 35 failures / 2,308 passes / 49 skipped
  (`out/main-integration/npm-test-final.log`). All 35 failing test names reproduce in an untouched
  checkout of fetched main (`main-baseline-test.log`, `baseline-comparison.json` there). The app
  checks pass; existing catalog test assumptions and Windows byte identities need separate repair.

- **The animation history is published through the connected GitHub app.** The maker approved
  new commit IDs. The [commit map](animation-github-publication.json) records the ordered source
  sequence through its publication plan, with identical file-tree SHAs checked for each replacement.
  The branch is `fix/animation-queue-windows-spawn`; the local originals are retained under
  `backup/animation-before-github-publication-20260906`. The
  [publication follow-up](plans/dendrite-visual-studies.md) records the checks. Next: continue
  from the published branch and use the map when resolving references to original commit IDs.

- **Two Views is complete.** Branch Journey is removed,
  and branch detail fills the right column with stronger default zoom. The final
  [visual-study follow-up](plans/dendrite-visual-studies.md) records the change. Focused pane/data
  tests, typecheck, Rule 7 and app build pass. The browser smoke verifies both panes, closer zoom,
  seeking, graphs and export restoration, with zero colored pixels in all 16 gutter samples and
  no unexpected browser errors (`out/two-views/browser-smoke.json`). Its actual 1080p MP4 decodes
  successfully and was visually inspected. The bottom-right legend now uses Timeglass's same
  **EARLY → LATE** gradient; desktop/phone matching checks pass
  (`out/two-views-legend/browser-check.json`). Next: open the Two Views link below.

- **Web pane cropping and Crystal Cast centering are corrected.** Rendering uses displayed
  canvas bounds and Cast's own offscreen pixel viewport. The preceding product checks are
  preserved in `out/branch-flight/browser-smoke.json` and `out/three-views/browser-smoke.json`;
  the final [visual-study follow-up](plans/dendrite-visual-studies.md) records the current
  two-pane simplification. Source coordinates, chronology and graph calculations are preserved.

- **Phase 6 is COMPLETE (2026-08-20).** The maker accepts the recorded failure to reproduce the
  Nakaya diagram as the phase's scientific finding. Decision
  [0045](decisions/0045-bound-phase6-closure-to-a-compute-week.md) and charter v1.22 defined the
  discharge and every element executed: the frozen WP1 strata; the three measured-only arms
  (CAK 3/90; M1 54/78 arm scope, 54/90 common denominator; `M1_NO_DIP_ABLATION` 5/78, 5/90); the
  80/80 numerical-control ladder with its published **NO-PASS (criterion)** verdict and
  review-confirmed re-derivation; the pinned
  [three-arm narrative](../evidence/phase6-three-arm-report/report.md) stating agreements,
  disagreements, numerical limits, and the accepted failure; and the flagless `gate6`, which
  re-derives all of it from committed evidence and exited 0 (13/13 criteria; repro:
  `node runner/src/main.ts gate6`). ADR 0026's conservative-intersection headline, R15's
  production path, and the full three-arm campaign closed at measured-only grade — stated as
  not computed by decision 0045, never as satisfied. No Phase 6 label was upgraded; the phase
  closes with zero quantitative-validation claims, and the 0043/0044 deferrals stay Phase 7
  property with no Phase 6 credit.
- **Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12).**
  Decision [0048](decisions/0048-focus-phase8b-on-phase9-ready-benchmarks.md) and charter v1.25
  preserve the completed [Phase 8A target book](plans/phase-8-what-is-real.md) byte-for-byte and
  focus the [Phase 8B corpus](plans/phase-8-measurement-corpus.md) on measurements Phase 9 can use.
  The [plain-English guide](phase8-baseline-guide.md) maps measured families to tests, limits and
  Git/NAS artifacts.
  Phase 8B writes separate artifacts; the immutable Phase 8A book remains 59,019 bytes / SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`.
  Quoted from [`evidence/phase8b-benchmark-final-v1/report.json`](../evidence/phase8b-benchmark-final-v1/report.json):
  the successor contains 51 model-development records (18 P0 / 28 P1 / 5 P2), zero held-out rows,
  252,134 native history rows, 431 adjudicated plot points and zero P2 coordinate rows. Its
  independent verifier returned `ok=true`; successor-target-book SHA-256 is
  `c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3`. The targeted pass is
  terminal and bounded, not global literature closure; the corrected residual sample is 0/9 misses
  after preserving and remediating its original Bacon miss. Phase 8B itself scored no model,
  supplied no adoption authority, and cannot grant a validation label. The exact full suite passed 97/97
  files; the detached clean-checkout verifier and 51 focused tests passed; and the final non-author audit
  returned zero blockers after its two bookkeeping findings were repaired. Phase 7 is completely
  standalone, unstarted and requires its own plan/worktree; Phase 10 remains uncharted.
- **Phase 9 is COMPLETE (development-only, 2026-08-13).**
  Decision [0050](decisions/0050-adopt-phase9-modular-physics-experiments.md), charter v1.27 and the
  [execution plan](plans/phase-9-execution.md) authorized isolated Mac development. S0B's
  [report](../evidence/phase9-source-overlay-v1/report.json) (6,530 bytes; SHA-256 `51e1fa2b…63d8a`)
  resolves 70 aliases to 59 complete artifacts. The files record an in-session shelf freeze before
  scoring; detailed S0B and scored-result bytes first entered Git together in `1efe127`, so
  Git ordering cannot independently prove that sequence. S1 maps all 51 rows through fail-closed adapters. All 51 Phase 8B records remain development evidence.
  Separate [verification receipts](../evidence/phase9-publication-verification-v1/) bind the clean-head
  commands and stdout for D-BT (`central-no-effect-or-failure`, Lamb `431.3416` versus rescale
  `0.6578183`, 0/6 wins, 24 no-flip sensitivities) and M-F/M-K2
  (`diagnostic-mapping-dependent`, 2/5, physical score unavailable). Other arms stop at reviewed
  source/analytic/refusal foundations; the all-no-pass branch closed:
  zero promotions and no combination campaign. Exact `TMPDIR=/private/tmp npm test` passed at
  completion; a later [different-model external review](reviews/phase9-external-review-2026-08-13.md)
  re-ran it as 115/115 files, 1,912 passed and seven skipped; the
  [post-review repair run](reviews/phase9-external-review-repairs-2026-08-13.md) passed 116/116 and
  1,924. Phase 9 cannot grant a quantitative-validation label or earn Phase 6/7 credit. The Mac
  lane ran only source/scalar/planar work; Phase 6's Windows evidence
  host, processes, artifacts, and then-unpublished verdict remained isolated throughout. The
  [maker guide](phase9-model-development-guide.md) explains the data, methods, results, and next evidence.
- **The Phase 9 knowledge baseline is COMPLETE (research-only, 2026-08-12).** Its
  [report](../research/phase9-knowledge-sources.md), [guide](phase9-knowledge-guide.md), and
  [artifact](../evidence/phase9-knowledge-baseline-v1/report.json) (5,263 bytes; SHA-256
  `37c7aadf18bce7420883930f66d6c6a473100dd27e1468dd8396a3c1214b1f96`) preserve 18 sources and
  15 hypotheses. It is now a bound S0B input; no model ran during its construction.
- Snow Crystal Journey media proceeds in parallel. Transcript entries `JTS-M006`/`JTS-M007` record
  the one-long-documentary source, manga-like scroll story/autoplay export, and intent to continue
  through Phase 10. The versioned narrative score and fixed-frame export interpretation is recorded
  by plan commit `86fe656`; Chapter 1 remains the bounded pilot and scientific authority is unchanged.
- The maker-directed compact G-G growth replay is **COMPLETE AS A LOCAL VERIFIED CANDIDATE** under
  [explore-gutcheck-growth-volume.md](plans/explore-gutcheck-growth-volume.md); governed NAS
  publication is deferred. Commit `44fd4b6` records exact attachment index/tick events and renders a
  separately labeled smoothed surface without changing solver/phase authority or replacing the
  immutable 701 meshes. `out/gutcheck-growth-runB/live.log` records the restart-only Run B exit at
  tick 70,000 after 36,348.1 solver seconds under its original Node v24.13.1 engine. The asset is
  7,695,060 bytes, SHA-256
  `475c1f7c227c45b005bfdb8691b1250599b405fa59902462110312a4f26ceb7d`; strict validation plus a
  separate handwritten parser are bound by the 618-byte and 1,234-byte records named in the plan.
  They confirmed 961,597 unique ordered events, the canonical seed, ticks 0–70,000, the
  593×593×17 crop, source/runtime identity and reconstructed 69,120,000-cell occupancy SHA-256
  `9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7`.
  `out/gutcheck-growth-runB/comparison-record-v2.json` (3,002 bytes, SHA-256
  `5488f738f3068e74cfdbc38e07c35c1a30e21fe73f891a22ab1e8d50399086f8`) derives the measured
  6,622,194,703-byte quantized sequence versus the 7,695,060-byte compact asset: 861x smaller after
  rounding. The accepted Chromium/SwiftShader v5 browser record is 48,961 bytes, SHA-256
  `ea194edc23dd583d9591c5009449c96d45f515291664b1baf76f8d508a3f2cb1`; it passed play/pause,
  exact seek/reverse, orbit, keyboard, reduced motion, portrait/desktop containment and five scoped
  failure lanes while fetching one compact asset and zero legacy meshes. The non-author closing
  reviews found no blocker/high issue. Final exact `TMPDIR=/private/tmp npm test` passed 123/123
  files, 2,091 tests with 8 skipped; its 33,723-byte log is
  `out/checks/gutcheck-growth-final-npm-test-v3.log`, SHA-256
  `8750759f51abe23f45e72dc1bac1424b7417c94f8330b4ae67a026a01bc67fe4`. The parallel NAS migration
  retired the old top-level `out/` destination; do not run or retarget the legacy publisher, recreate
  aliases, or claim public availability. Forward publication waits for the governed catalogue,
  owner-manifest, receipt and fresh-restore contract.
- The [glass/camera follow-up](plans/explore-gutcheck-growth-glass-camera.md) is **IMPLEMENTED AS A
  LOCAL CANDIDATE; BROWSER/VISUAL ACCEPTANCE IS PENDING**. It binds the compact replay to the exact
  `growth-B-intro` clock/camera track, retains exact-tick/manual-orbit/reduced-motion paths, and labels
  the shader `GLASS-STYLED · MODEL / UNVALIDATED`; the panes are not live-transport-locked. Exact
  `TMPDIR=/private/tmp npm test`, the app build and non-author source audit passed after four named
  repairs recorded in the plan. No browser session was available, so there is no fresh WebGL visual
  verdict; v5 remains evidence only for the prior bold-ice/stationary-camera version.
- **The Journey/media branch is reconciled with current `main` for review (2026-09-12).** Branch
  `explore/education-ch1-video` merged fetched `origin/main` at `c2dd1d4`, retaining both the
  compact `?growth=` replay and the newer composed `?growthScene=` presentation path. The conflict
  resolution also keeps both Vite entry points and separates the historical compact-comparison NAS
  lookup from the governed collection detector. The Rule 16 audit found this as the sole PR branch;
  the clean `main` worktree and unattached `plan/phase10-options` branch are unrelated, while ignored
  `out/gutcheck-growth-runB/` remains the plan-governed local candidate and is excluded from Git.
  Focused replay/NAS/progress tests, both loopback-serving test files with bind permission, typecheck,
  and the app build pass. Exact `TMPDIR=/private/tmp npm test` reproduces the already documented
  `main` catalog failures; its extra sandbox-only bind failures pass in the focused permitted runs.
  Merge commit `5ef0d69` is published in
  [PR #13](https://github.com/billatgameology/snowflake/pull/13); this does not close the pending
  browser/visual or Rule 13 review boundaries.
- **Maker directions (2026-08-20).** Phase 7 is on hold and, when resumed, runs as a parallel
  product/engineering track beside the science workstream (charter v1.23 already makes it
  standalone; this adds no new authority and starts nothing). The handoff mechanism is retired:
  [HANDOFF.md](HANDOFF.md) is a tombstone kept only for the byte-frozen archive's links, and its
  test pin now enforces the tombstone. The maker clarified that the Phase 10 A+B text was
  brainstorming and **selected no Phase 10 package (2026-08-20)**. Commit `f51f58e` recorded that
  brainstorm as a selection before the correction arrived; this live index and the
  [decision-ready candidate plan](plans/phase-10-closures-and-frontier.md) supersede that status
  statement. Phase 10 remains uncharted, no execution plan is active, and no scientific PC run is
  authorized.
- **Assurance is proportional to decision risk.** [Decision 0049](decisions/0049-make-assurance-proportionate-to-decision-risk.md),
  charter v1.26 and `AGENTS.md` require integrity for routine sources, one targeted check for
  load-bearing inputs, and full named controls for gates or strong public claims. No recursive
  reviews; stop when another check cannot change the decision. No evidence or criteria changed.
- **Maker verification boundary (2026-08-24).** Isolated website, gallery, animation-selection,
  render-recipe, and batch-orchestration changes use focused tests, relevant typecheck/build checks,
  and a live smoke or representative render. They do not trigger exact `npm test`, scientific gates,
  or unrelated solver suites unless they also change a scientific, evidence, gate, or root-wide
  contract. `AGENTS.md` Rule 6 is the durable operating rule; completed records still state checks
  that actually ran but do not establish precedent.
- **The GG gut-check catalogue now leads with its image-bearing generated sweep (2026-08-23).**
  The governed NAS split intentionally leaves historical mixed comparison/reference media
  unserved, but 89 project-generated PNG renders remain public and healthy. The index formerly
  placed 37 model-only orphan links ahead of them, making the thumbnails appear absent; the
  generator now orders the generated-crystal gallery first and a regression pins that priority.
  This is an operational UX correction only and changes no scientific evidence or phase state.
- **The maker-directed animation selection, growth replay, website library, and scientific-bundle
  NAS copy/registration are COMPLETE (2026-08-29).** The completed
  [queue plan](plans/gutcheck-animation-selection-queue.md) adds preview-adjacent selection,
  portable manifests, deterministic disjoint batches, and the later growth-event path. The Windows
  fleet completed 52 web assets and 52 full scientific bundles; the maker kept the original `fig6`,
  and the website library serves the other 51 from `snowcrystal_website`. The local scientific tree
  at `out/growth-scientific/` contains 6,308 files / 84,247,312,054 bytes. Maker direction on
  2026-08-29 direction copied it as generated-cache collection
  `gutcheck-growth-scientific@2026-08-26`. It is active at
  `collections/gutcheck-growth-scientific/2026-08-26/payload`, with 6,308 files /
  84,247,312,054 bytes / tree SHA-256
  `4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`. The tracked 6,308-row owner
  manifest tells the project every exact NAS path. Two earlier Windows/SMB attempts failed closed
  and remain preserved in non-served quarantine; no local deletion was authorized or performed.
  The [publication plan](plans/gutcheck-growth-scientific-nas-publication.md) records the receipts
  and narrowed no-restore scope. A later fresh-process full verifier on 2026-09-04 reopened all
  6,308 files / 84,247,312,054 bytes and returned `ok=true`, `payload=verified-full` with zero
  defects. A subsequently started local restore was stopped under the maker's narrowed direction;
  its incomplete duplicate remains local and is not closeout evidence.
- **The named snow-crystal animation catalog is COMPLETE (2026-08-31).** The strict
  [catalog](named-snow-crystal-catalog.json) and linked [text table](named-snow-crystal-catalog.md)
  report all 35 Libbrecht guide names exactly once: 33 included types with three accepted animations
  each, plus `Rimed` and `Graupel` visibly excluded because this work adds no droplet-accretion
  physics. Final totals are 99 accepted / zero remaining, 22 direct GG/GG+ families and 11 explicitly
  composed families. All 99 decoder-verified cold web payloads are below 20,000,000 bytes and range
  from 4,769 to 10,923,005 bytes. The 66 direct entries retain 8,999 scientific files /
  110,701,619,469 bytes with 101–121 mesh frames each; the 33 Compose records bind exact component
  scientific identities without claiming a composed scene is one solver state. The exact
  [Compose review](named-snow-crystal-final-compose-review.json) is 50,204 bytes / SHA-256
  `212434bf4704763ccdd33d17b063a79f4305c020fc9e89024046f372e9e0ac19` and binds all 297 real-browser
  captures after live clearance and visual progression review. The catalog plan contains the exact
  report/contact-sheet/catalog identities and final product-sized checks.
- **The named snow-crystal local gallery is COMPLETE (2026-08-31).** The dedicated loopback page
  renders all 35 taxonomy rows and 99 accepted variant cards with previews, payload metadata,
  search, route filters and click-to-play animation. Its exact allowlist API preserves the generic
  Vite `out/` denial and distinguishes direct G-G/G-G+ recordings from Compose. A live Playwright
  smoke counted 35 rows / 99 cards, confirmed unknown/generic-`out` denial, and completed one direct
  and one Compose playback. The server is running at `http://127.0.0.1:5173/named-crystal-catalog.html`;
  PID and logs are under `out/named-crystal-gallery-site/`.
- **Render-worktree NAS closeout is active (2026-09-04).** Maker direction now requests a simple,
  non-destructive NAS copy of the generated output from all three worktrees, the standard tracked
  owner manifest and publication receipt, and a pull request to `main`. The maker will merge and
  test restoration on another computer. No worktree, branch, local output, or NAS byte is removed;
  cleanup is explicitly deferred until the maker confirms that restore. The immutable
  `render-worktrees-closeout@2026-09-04` payload is now published: 18,932 files /
  130,479,382,836 bytes / tree SHA-256
  `1a2f9d0f4758a1f54e73f4d11e6da31046d041417f890020c1c7f9e2175960c2`. Its tracked 18,932-row
  owner manifest is 5,337,142 bytes / SHA-256
  `c9489ad64f6e693f09853ab35863b158e23dc3107c618c9cdd8282789d8b8a8d`; the standard publication
  receipt is recorded in the closeout plan. Focused closeout checks passed, the feature branch is
  pushed, and [PR #10](https://github.com/billatgameology/snowflake/pull/10) is open against `main`.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict, which
  decision 0045 closed as not computed.
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- **Visual-study catalogue correction is complete (2026-09-04).** The maker identified the newer
  accepted named catalogue in `../snowflake-named-catalog/docs/named-snow-crystal-catalog.json`.
  The correction in [the visual-study plan](plans/dendrite-visual-studies.md) adds its accepted
  named recordings and explicitly composed scenes to all four views. The live index reports
  151 available entries, including 99 named entries (`out/named-growth-studies/live-index.json`).
- **Visual animation browser is complete (2026-09-04).** The large dropdown is replaced by
  **Browse crystals**, a thumbnail gallery with search, shape/collection filters, dendrites first
  and click-to-play in the current view. The [visual-study plan](plans/dendrite-visual-studies.md)
  records implementation and checks. The browser smoke verified 151 cards and decoded Timeglass
  previews, zero full recording downloads on browse-first entry and no unexpected errors
  (`out/growth-gallery/browser-smoke.json`). Keyboard focus, phone layout, selection, playback,
  filter/scroll retention and broken-image fallback pass. Next: open the gallery link below.
- **Last updated:** 2026-09-17 (authorized E02 narration and synchronized playback; no phase or scientific-evidence change)
- **Optional graphs and MP4 export are complete.** Single views offer attached-site,
  interval-attachment and outward-reach graphs with independent toggles and synchronized seeking.
  **Export MP4** creates the current treatment/camera in H.264, with optional graphs. Actual UI
  downloads pass 720p/1080p stream decoding; composed statistics, cancellation/restoration and
  mobile checks pass (`out/growth-insights/browser-smoke.json`). Exact `npm test` passed:
  143 files, 2,248 tests passed / 49 skipped (`out/growth-insights/npm-test-final.log`, exit 0).
  Build passed. The [visual-study follow-up](plans/dendrite-visual-studies.md) records the controls,
  canonical Windows temporary-path fix and earlier rejected attempts. Next: use the controls below
  the single animation. No solver or source recording has changed.
- **Education is reconciled through Phase 10 and published again (2026-09-05).** Chapters 1–29 keep
  the teaching baseline with their stale Phase 6 status boundary corrected; Chapters 30–33 teach the
  unstarted Phase 7 plan and the Phase 8–10 records as development and refusal evidence, never
  validation. Chapters 30–33 describe the Phase 10 package as recorded on the
  `phase10/evidence-verification` branch (complete-negative, 2026-08-25); that branch is still open
  in its own session and is not merged here, so this index catches up when it lands. An independent
  six-agent review corrected 47 factual and seven accessibility findings before the merge; the
  public verifier then passed 37 pages, 191 checks, 0 failures and 149 negative controls
  (2026-09-04T00:24:43Z). The Pages deploy workflow retired on 2026-08-16 is restored by maker
  direction (`.github/workflows/pages.yml`: `main`-only trigger, 37-page pin, manifest-pinned public
  artifact, no research media), so pushes to `main` touching `docs/education/**` republish
  https://billatgameology.github.io/snowflake/. Exact `npm test` closure for the education plan is
  still pending an idle host; see the [education plan](plans/education-phase7-10-continuation.md).
  Full freeze history: [the history file](progress-history-phases-6-8-9.md).

## Phase gates

A scientific gate is complete only through named, reproducible evidence. Detailed review history
and every superseded attempt live in the linked plans and historical progress snapshot.

| Phase | Current gate state | Reproduction/evidence |
|---|---|---|
| 0 | Complete, maker-asserted 2026-07-14 | Charter §2.8 knowledge checks; no automated metric is applicable. |
| 1 | Complete, maker-asserted 2026-07-15 | Informal UX sessions were positive; the four-task protocol was not run. [Plan](plans/phase-1-ux-spike.md). |
| 2a | Complete, maker-asserted 2026-07-15 | Seed 1, `128,128,64` hexPrism plate: symmetry error 0 through 4,800 ticks, AR `0.168831`; checkpoint SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Repro: `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. |
| 2b | Complete 2026-07-20 | Clean `0dc0f86`, seed 1, `96³` hexPrism, extent 61: −5 °C AR `0.118644` plate; −15 °C AR `12.2000` column; symmetry error 0 and every relaxation converged. Repro: `node runner/src/main.ts gate2b`. |
| 3 | Complete, maker-asserted 2026-07-23 | `gate3` exit 0: depletion-ratio median `0.531454`, 90.2% below 1, radius 38, symmetry error 0. Repro: `node runner/src/main.ts gate3`. |
| 4 | Complete 2026-07-18 | `gate4` at `70a2496`: 24/24 blocking G-G records and 12/12 diagnostic LK records executed; `gatePass=true`, `passBDiagnosticPass=false`. Repro: `node runner/src/main.ts gate4`. |
| 5 | Complete, maker-asserted 2026-07-26 | Clean `c436df5`, observed Windows/Chromium/D3D12: 16/16 gate criteria, 560 bounded segments below 500 ms, zero device losses/errors/full-field display-frame reads, 16/16 negative controls rejected. Repro: `node runner/src/main.ts gate5-lane` and `node runner/src/main.ts gate5`. |
| 6 | **Complete 2026-08-20** | `gate6` exit 0 at `44488ab`: 13/13 criteria re-derive the amended obligations from committed evidence — strata freeze, three measured-only arms (3/90; 54/78·54/90; 5/78·5/90), ladder NO-PASS (criterion), narrative report, closure labels, 0043/0044 deferrals. Negative result accepted as the finding; no label upgraded. Repro: `node runner/src/main.ts gate6`. |
| 7 | Not started; independently eligible | Charter v1.25 preserves Phase 7's independence but does not start it. A committed Phase 7 plan and isolated worktree are required; product, held-out validation, and v6 WGSL/preview-GPU parity remain its scope. |
| 8 | **Complete (8A + 8B)** | The immutable 8A book remains 18 entries / 59,019 bytes / SHA-256 `47a75f3f…71ec`. The verified 8B successor is 51 development records, 252,134 native rows and 431 plot points; no row is held out. [Completed plan](plans/phase-8-measurement-corpus.md). |
| 9 | **Complete (development-only)** | The all-no-pass branch closed: D-BT failed, M-F/M-K2 stayed mapping-dependent, controls/path-state/M-PK are unavailable or non-identifiable, and zero items promoted. Exact `TMPDIR=/private/tmp npm test` passed; no result grants validation credit. [Completed plan](plans/phase-9-execution.md). |

## Active plan

The [same-page bilingual plan](plans/science-series-bilingual.md) records completed Simplified
Chinese text, Mandarin narration and semantic switching. English narration remains preserved.

The [science-series plan](plans/explore-journey-science-series.md) is the active editorial record
on `explore/film-part1-plan`, including JTS-M012's library-reuse and rendering direction.
The [Part 1 plan](plans/explore-film-part1-science-scroll-documentary.md) and its
[review](reviews/film-part1-plan-review-2026-09-15.md) preserve the earlier technical pilot;
its website implementation remains isolated on `explore/film-part1`. E01's source script,
full AI narration and revised visual treatment are implemented; maker acceptance is next.

The maker-directed [growth visual studies](plans/dendrite-visual-studies.md), including the
newer named catalogue, are complete on `fix/animation-queue-windows-spawn` in `snowflake-animation`.
`out/named-growth-studies/packaging.json` records 151 prepared/decoded replays, including all 99
newer named entries. The gallery now offers collection and shape filtering; direct recordings and composed
scenes share Ion Bloom, Timeglass, Two Views and Crystal Cast with explicit composition labels.
Focused tests, typecheck, Rule 7 and app build passed. The earlier production browser sweep records
604 view renders and no unexpected errors (`out/named-growth-studies/browser-smoke.json`).
Final camera/timing refinements passed 20 targeted live renders and the rebuilt-production
seek check (`final-browser-smoke.json` and `final-production.json` in that directory).
Exact source identities are in `app/data/named-growth-library.json`.
The subsequent gallery pass adds tracked Timeglass previews (`app/data/growth-previews/index.json`)
and the focused browsing checks in `out/growth-gallery/browser-smoke.json`; it does not repeat
the earlier renderer sweep. The plan's gallery follow-up records the current browsing UI.
The subsequent structural-rendering pass replaces the two retired treatments and records its
representative controls/render checks in `out/growth-structure/browser-smoke.json`.
The completed graphs/export follow-up adds recording-derived readouts and actual MP4 downloads;
its browser and required full-check records are in `out/growth-insights/` as named above.
The subsequent Three Views replacement and Cast centering use the representative product checks
in `out/three-views/`, followed by the retired moving camera checks in `out/branch-flight/` and
the current two-pane/cropping checks in `out/two-views/`;
the earlier catalogue-wide sweep predates these rendering changes.
No solver, scientific evidence, source acceptance or phase state changed.

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the completed Phase 6 record (see its Completion record).
[phase-8-measurement-corpus.md](plans/phase-8-measurement-corpus.md) and
[phase-8-what-is-real.md](plans/phase-8-what-is-real.md) are completed records; the
[Phase 9 execution plan](plans/phase-9-execution.md) is complete and its
[knowledge-baseline plan](plans/phase-9-knowledge-baseline.md) is a completed research input.
The older [proposed consumer plan](plans/phase-9-modular-physics-arms.md) is superseded design
history, not execution authority. Decisions 0046–0050 keep worktrees, processes, artifacts, claims,
and completion credit isolated.
[nas-asset-governance.md](plans/nas-asset-governance.md) is a completed infrastructure record; its
correction changes no phase claim or credit.

The [compact gutcheck growth-replay plan](plans/explore-gutcheck-growth-volume.md) is the completed
local Journey/media implementation record; only governed NAS publication remains deferred. It is
parallel to, and cannot change, the Phase 6 lane.

The [glass/camera follow-up](plans/explore-gutcheck-growth-glass-camera.md) remains the active local
Journey presentation record; browser/visual acceptance is still pending.

The maker-directed [gut-check animation selection and queue plan](plans/gutcheck-animation-selection-queue.md)
is complete, including growth-event and full scientific output. The
[scientific-bundle NAS publication plan](plans/gutcheck-growth-scientific-nas-publication.md) is
also complete after the durable generated-cache copy, manifest registration, and exact repository
checks; it changes no phase status or scientific claim.
The maker-selected [named snow-crystal animation catalog plan](plans/named-crystal-animation-catalog.md)
is a completed product record in `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` on
branch `feature/named-crystal-catalog`. Its 99 accepted animations, final table, exact dual-output
bindings and real-browser Compose review are complete; no publication or cross-repository copy is
implied by that completion.
The maker-requested [local gallery plan](plans/named-crystal-local-gallery.md) is complete. Its
loopback-only 35-row visual catalog shows three cards per included type and click-to-play
direct/Compose web payloads. The service exposes only catalog/review-bound files and leaves Vite's
general `out/` denial intact; this is local presentation, not publication.
The maker rejected the first gallery player's visual quality after comparison with the existing GG
website. The completed [volume-rendered gallery plan](plans/named-crystal-volume-gallery.md) now uses
that showcase's strict decoder, arrival-volume texture and studio ice material for every card and
modal. Accepted records, identities, direct/Compose meaning and `<20 MB` payloads remain fixed. The
99-scene live-browser smoke passed 66 direct and 33 Compose scenes, including safe final framing and
shared-texture checks; the exact output is
`out/named-crystal-gallery-site/all-volume-smoke-final.log`. The generated-preview report at
`out/named-crystal-gallery-volume-previews/report.json` (19,066 bytes; SHA-256
`5a316187e3bae4f9ed25bd1083865cfb772bcfdaf82784665b0033f494b0dcc3`) binds all 99 current 720×720
volume-rendered card images.
The maker then rejected black, patchy and camera-jittering pinholes in the dense volume view. The
completed [volume stability correction](plans/named-crystal-volume-stability-correction.md) traced
them past a solid first-hit mask to the transmission pass: a coarse probe inside a later body could
have zero field gradient, so normalizing it emitted invalid black pixels that moved with the camera.
The shader now refines the actual far-side crossing, uses a safe fallback normal and smooths only its
shading stencil. The exact ten-capture review is bound by
`out/named-crystal-volume-stability/final-review/report.json` (6,614 bytes; SHA-256
`907d8aaca7cd95919cdbb2cc639fac5175b489512aa3215aadd1cace6ff00f4a`); all accepted products and
payload claims remain unchanged.
The active [render-worktree NAS closeout plan](plans/render-worktrees-nas-closeout.md) now governs
copy-only collection of generated named-catalog, animation, and primary-worktree output, durable NAS
publication, tracked discovery metadata, and a pull request. Merge, cross-machine restore testing,
and all cleanup remain maker-controlled later actions. It changes no catalog, renderer or scientific
result.
The
[Phase 10 candidate plan](plans/phase-10-closures-and-frontier.md) is decision support, not
execution authority; no A–H package is selected.

The old source-strata/ladder/WP3/R15 prerequisite sentence governed the now-closed Phase 6
production path. WP3 and R15 closed as not computed under decision 0045; that sentence does not
govern a future Phase 10 diagnostic. Any selected Phase 10 execution must instead freeze and pass
the package-specific prerequisites in its charter amendment and execution plan. Decisions
0043–0044's Phase 7 deferrals remain authoritative and cannot be discharged by Phase 10.

## Next step

User-requested [next-session prompt and two-repository file map](video/nivogenesis-next-session-prompt.md)
is saved for continuing this video work. It is a launcher, not another live state document:
this index and the affected active plans still govern. Read their latest entries before using
the prompt's baseline references; the E02 release hold remains intentional.

### Nivogenesis opening — ready for maker viewing and listening

Read the [review](reviews/science-series-nivogenesis-2026-09-17.md), then open
`http://127.0.0.1:5185/series` and choose **Play with sound**. Inspect the added hollow column,
capped column and sectored plate. For a concrete follow-up, start in website
`src/series/SeriesHome.tsx`, `src/series/openingSound.ts` and `src/hero1/recordedCollection.ts`;
run `node --test scripts/series-opening-sound.test.mjs`. Preserve the explicit opt-in,
pending-play cancellation and pre-narration stop. Human audition remains the next useful check;
do not regenerate narration or the previous MP4 without a new request.
The latest opening has no experiment links and says “Every flake is a record of its fall.”
E02's matching card says Coming soon; `src/series/seriesRelease.ts` deliberately keeps it
unmounted on all series routes and removes E01 continuation. Preserve this release hold until
the maker asks to expose it; do not mistake preserved E02 source/assets for a live release.

### Opening inspection and E01 follow-up — ready for maker viewing

Open the [follow-up review](reviews/science-series-e01-opening-followup-2026-09-17.md), then
`http://127.0.0.1:5185/series` and `/series/episode-1`. Check hover/drag/zoom on recorded snowfall
crystals, scene 3's below-drop labelled airflow and the final English hook. For a concrete
follow-up edit, start in `src/hero1/RecordedSnowMarker.tsx`, `src/series/earlyEpisodeDrawing.ts`
or the canonical E01 draft as appropriate. Reproduce the website receipt's focused commands,
not scientific gates. The English final take is already refreshed; Mandarin retains its words
and audio with an explicit editorial-variation clock. Do not replace prior masters or MP4.
Human listening and uncoached audience comprehension remain unverified.

### English E01 attention pass — ready for maker viewing

Open the [series amendment](plans/explore-journey-science-series.md#english-e01-attention-pass--2026-09-17-planned-before-implementation).
The retained website has the Menu and progressive, decluttered scenes. Open the
[attention review](reviews/science-series-e01-attention-2026-09-17.md), then
`http://127.0.0.1:5185/series/episode-1` in English: review the scene-7 budget, scene-4 magnifier
entrance and the separate ending feature reveals. Focused tests/build and sampled live checks
are recorded; no complete uninterrupted viewing or audience comprehension is claimed.
That attention-only pass did not change audio; the newer follow-up above owns the current
English hook revision. Preserve the existing Mandarin export; no new MP4 was requested.

### Home → E01 MP4 — ready to watch

Open the [export review](reviews/science-series-home-e01-export-2026-09-17.md), then the retained
website worktree's `export/series-e01-zh-2026-09-17-fast-v2/Cryosphere-home-and-episode-1-mandarin.mp4`.
The opening grows at twice its previous speed; the complete movie preserves current Mandarin
audio and Chinese reader content. Website `docs/series-export.md` names the reproducible commands;
`docs/series-export-final.json` binds the delivered bytes and independent audit receipts. No render
is running. Preserve this file and the earlier prototype/partial directories; any requested new
export uses a new directory, not an overwrite. Human viewing/listening acceptance remains open.

### Nivogenesis is live — view it, then decide the follow-ups

Open **https://nivogenesis.web.app** (and `/episode-1`) on desktop and phone; switch EN / 中文 and press
Play with sound. Everything shipped is in the [plan's completion record](plans/explore-nivogenesis-public-release.md#completion-record--2026-09-18).
To change the site: work on `explore/film-part1` in the retained website worktree, run
`npm run build:public`, `node --test scripts/public-release.test.mjs`, the smoke against
`firebase serve --only hosting --host 127.0.0.1 --port 5099`, commit, then
`firebase deploy --only hosting --project nivogenesis` from that committed head and tag it. Never deploy
`dist/`. Candidate follow-ups, none started: the education-chapter findings in the
[science review](reviews/nivogenesis-e01-public-science-review-2026-09-18.md); Mandarin loudness matching;
a custom domain. Episode 2 remains frozen and unreleased.

### Same-page Chinese and Mandarin — Yun voice on reviewed E01 text, ready to listen

Open the [review addendum](reviews/science-series-mandarin-susan-2026-09-18.md#addendum--yun-restored-for-e01-over-independently-reviewed-text-later-on-2026-09-18),
then `http://127.0.0.1:5185/episode-1` (local; the public site is https://nivogenesis.web.app/episode-1) and select **中文**. The retained website worktree is
`/Users/clipper/github/snowcrystal_website-film-part1` at `e343142`. E01 plays Yun
(`4AfodMgwXps9oZFhHzoj`) over the reviewed refined Chinese; E02 is frozen on its Susan revision and stays
unreleased until the maker asks for E02 work. Judge pronunciation, delivery and the refined wording. For
wording edits, change the authority `docs/video/science-series-e01-zh-CN.json` through its cue pairs
(each paragraph is the concatenation of its pairs in
`docs/series-narration/2026-09-18-e01-mandarin-yun/cues-early.json` and `cues-late.json`), regenerate
the affected take in a new revision (the generator defaults to Yun; `--voice=` selects another retained
voice), pace with `--revision=` and `--cues=`, and rerun the focused command in the review. Deferred E02
translation findings are in website `docs/series-narration/2026-09-18-e01-mandarin-yun/translation-review.json`.
Recordings follow shared scene/paragraph/cue identities, not equal elapsed seconds. English remains
preserved.

### Episode 1 — listen and test comprehension of the clearer revision

Open the [latest review](reviews/science-series-e01-clearer-2026-09-17.md)
and [performed conversational source](video/science-series-e01-comprehension-draft.md).
Website `9fd4a37` in `/Users/clipper/github/snowcrystal_website-film-part1` serves the completed
eleven-section repair at `http://127.0.0.1:5185/series/episode-1`. The earlier approval-only
instructions are superseded. The server was left running; if needed, check the existing
listener before `npm run dev -- --host 127.0.0.1 --port 5185 --strictPort` in that worktree.
Cold reload after drawing-code edits: hot reload can retain a stale canvas callback.

Next is a human listen for delivery/proper names and an uncoached general-adult teach-back
of balance, the two neighbours, water-vapour pressure, and reference versus extra water. Review
records distinguish automated audio checks and sampled browser playback from those open
acceptance questions. Preserve the original film/audio, home and narrated E02. For every future
spoken-English rewrite, automatically refresh the affected Juniper takes in a new retained
revision and retime captions/cues. Refresh changed Mandarin words with the now-approved Mandarin
voice and rebuild the semantic map as well. Do not start E03, publish
or run scientific gates without a new relevant request.
Requested E01 revisions begin with `src/series/episodeCues.ts`, `laterEpisodeCues.ts` and their
corresponding drawing files; the focused check command is in the review.

### Episode 2 — narrated performance ready for review

Open `http://127.0.0.1:5185/series/episode-2` and press Play. Website `5fcd95a` is paused at the
opening with the latest E01 voice, Juniper, and audio-owned timing. The preview server remains
running. Read [the audio amendment](plans/science-series-episode-2.md#narrated-performance-amendment--2026-09-17)
and [review](reviews/science-series-e02-review-2026-09-16.md#authorized-juniper-narration-and-synchronization--2026-09-17)
for retained identities and verification limits. Next: human listening, especially “ice Ih,”
“Libbrecht,” and “Faster end advance,” then uncoached prediction/meaning feedback.
Local unchanged listening clips and exact audit commands are indexed by
`out/e02-audio-review/README.md` and `listening-clips.json`; these are staging, not phase evidence.
For repairs, start in website `src/series/episodeTwoCues.ts` and `EpisodeTwo.tsx`; run the focused
command in website `docs/science-series-episode-two.md`. Do not rerun synthesis as a test or
overwrite retained takes. Cold-reload after canvas changes. Preserve E01 speech/home/old film;
no E03, export, push or publication is implied. Silent-build notes below are historical.

#### Updated-guide revision baseline

Pre-audio baseline: the [2026-09-17 guide amendment](plans/science-series-episode-2.md#updated-guide-comprehension-revision--2026-09-17)
is implemented at website `414dbe85c704fc750dec7db66057717a62d46de7`. Open
`http://127.0.0.1:5185/series/episode-2`; preview is running and paused at the opening.
Use Play for the revised silent performance and “A closer look” for optional depth.
The [latest review](reviews/science-series-e02-review-2026-09-16.md#updated-guide-comprehension-revision--2026-09-17)
names actual checked states and pending audience questions. Next is an uncoached explanation
of the X-ray comparison, molecule/network distinction and faster-side-growth prediction—not
automatic narration. Requested repairs start in the authority script and website
`episodeTwoCues.ts`/`episodeTwoDrawing.ts`; the focused command is in
website `docs/science-series-episode-two.md`. Cold-reload after canvas edits. No E02 audio.
The earlier library revision below is the preserved baseline, not the latest source identity.

The maker requested more actual crystal recordings, no unearned history detour, spoken symbol
definitions, an explained tetrahedral neighbourhood, and a continuous H₂O sheet → rotating
network → stack. The bounded amendment is in [E02 plan](plans/science-series-episode-2.md#maker-revision--library-meaning-and-molecular-continuity).
The eight-scene rewrite, six manifest-pinned recordings, explicit hydrogen network and continuous
sheet/stack are complete at website `707ca01ec8f9c753f49389ac667e6559c8268daa`. Independent
source/code-review findings are repaired; checks and bounded viewing are in the
[latest review](reviews/science-series-e02-review-2026-09-16.md#maker-revision--recordings-and-a-continuous-molecular-story).
Next is maker comprehension/pace feedback on port 5185, not more automatic implementation.
No audio. The original draft below is historical baseline, not acceptance of the revised scenes.

Open [E02 plan](plans/science-series-episode-2.md), [script](video/science-series-e02-script.md)
and [review/edit record](reviews/science-series-e02-review-2026-09-16.md). In the existing website
worktree on port 5185, open `http://127.0.0.1:5185/series/episode-2` and use Play for the silent
rehearsal. Seek/scroll/Still support inspection; there is no E02 audio to troubleshoot.
For requested revisions, open `src/series/episodeTwoDrawing.ts`, `episodeTwoCues.ts` and the
authority script; preserve numbered-ring identity and completed additions across paragraphs.
Run the exact focused command in the review, not the scientific suite. Narration needs separate
authorization and actual alignment. Do not automatically generate speech or start E03.

### Science series — apply the maker's design guide to E01 review and later episodes

Start with the [guide's creation workflow](video/science-series-design-guide.md#start-here-when-creating-an-episode),
then use its scene worksheet in the next authorized episode's existing script/shot table.
Read the [active plan](plans/explore-journey-science-series.md) for source dispositions and
library/rendering discovery. Prototype the hardest explanatory passage, earn prerequisites
before reuse, and review the actual performance rather than only its words or stills.
No fixed episode duration, new narrator selection or automatic speech generation is implied.

For the current E01 reference, use the
[performed conversational source](video/science-series-e01-comprehension-draft.md) and
[production review](reviews/science-series-e01-conversational-production-2026-09-17.md), not
the superseded ten-scene script or its old import command. The current website/next checks
are in the E01 subsection above. Earlier visual guides/reviews remain useful repair history;
their scene numbers and timestamps are not the new cut's timing authority. Preserve the
praised home, donor and surface principles without inferring approval of entire scenes.

The reusable guide now requires visible input changes, a genuine prediction pause, reference
before extra, substantive optional reading and timing bound to the actual delivered audio.
For a future production review, distinguish content, visuals, audio/matching, interaction
and uncoached audience understanding. Human listening and fresh adult teach-back remain open
for E01; technical completion did not settle those questions.

Documentation-only changes use `npm run lint:rule7`, changed-link checks and `git diff --check`.
Website revisions use their scoped commands in the production review. Keep the original film,
earlier audio, home and silent E02 intact; no new episode build, synthesis, scientific gate,
export or publication is authorized by this guide update.

### Growth visual studies — ready to use

For integration status, open [PR #11](https://github.com/billatgameology/snowflake/pull/11): its
Tests check and merge record show publication. On macOS the dev server also needs the `/@fs` guard fix
from [PR #12](https://github.com/billatgameology/snowflake/pull/12) (branch `fix/vite-fs-guard-posix`,
fix commit `a7f2fbf`; the Current state entry above records the defect and checks). At maker direction
on 2026-09-09 the merged remote branches `feature/named-crystal-catalog` and
`fix/animation-queue-windows-spawn` were deleted with zero unique commits beyond `main`; the Windows
worktrees and their local branches remain the separately authorized cleanup pass in the closeout plan. The existing main failures are recorded above;
the maker's merge request proceeds on the verified unchanged failure set. Fetch `origin/main`; the viewing
instructions below apply to the integrated app. No further product implementation is planned.

Open `http://127.0.0.1:5191/dendrite-styles.html?browse=1` to see the thumbnail gallery. Search or
filter by shape/collection, then click a card to play it in the current view. Use **Browse
crystals** to reopen the gallery and **View** to select Timeglass or another treatment. The
**Named catalogue** filter shows the newer types and their variants. A fresh session can use
`npm run dev --workspace app -- --port 5191`. The [plan](plans/dendrite-visual-studies.md)
records the completed checks and source locations. No implementation work remains in this request.
The loopback dev server is recorded at `out/growth-gallery/dev-server.pid`; its logs are
beside it. Missing local source files remain visibly unavailable; the tracked original dendrite
remains usable. For already restored producer output, see `app/data/README.md` and
`GROWTH_STUDY_CATALOG_ROOT`. Timeglass is the default view.
For the new composition, start at `dendrite-styles.html?style=2&crystal=sweep-t1-sharp`.
**Two Views** shows the top view beside a closer three-quarter branch detail. Drag panes
independently, double-click to reset a pane, or adjust **Detail zoom**. **Crystal Cast** is centered
and retains **Move the light**. Open **Graphs** below any single animation to toggle attached sites,
new attachments and outward reach, or click a chart to scrub. **Export MP4** offers 720p/1080p,
10/20/30-second complete-growth clips and optional visible graphs. It retains the current
camera/rendering controls and restores playback after export. The plan's final follow-up records
the two-pane composition and closer detail checks; `app/data/README.md` has usage and browser requirements.

### Render-worktree NAS closeout — active

[PR #10](https://github.com/billatgameology/snowflake/pull/10) merged into `main` at `4cc1cb3` on
2026-09-04 with the tracked locator and owner manifest for `render-worktrees-closeout@2026-09-04`;
[PR #11](https://github.com/billatgameology/snowflake/pull/11) followed at `b9f0a0c` on 2026-09-06.
The Mac-side check on 2026-09-09 (Current state above) mounted the share, verified both owner
manifests, hash-verified a 414-file gallery subset against the manifest and started the full-hash
verify; the full restore below cannot run on that Mac (41 GiB free), so it still needs a host with
roughly 215 GB free or an external disk. The maker's remaining action is to attach the marked
`snowcrystal` NAS on such a host, then run:

```text
npm run assets:restore -- --collection render-worktrees-closeout@2026-09-04 --to out/restores/render-worktrees-closeout-2026-09-04
npm run assets:verify-restored -- --collection render-worktrees-closeout@2026-09-04 --from out/restores/render-worktrees-closeout-2026-09-04
npm run assets:restore -- --collection gutcheck-growth-scientific@2026-08-26 --to out/restores/gutcheck-growth-scientific-2026-08-26
npm run assets:verify-restored -- --collection gutcheck-growth-scientific@2026-08-26 --from out/restores/gutcheck-growth-scientific-2026-08-26
```

The first pair restores the new 130,479,382,836-byte closeout; the second restores the separately
owned 84,247,312,054-byte scientific tree that was deliberately not duplicated. Report both results
before any cleanup. Do not remove a worktree, delete a branch, or delete local output until the
maker explicitly confirms the cross-machine restore.

### Named snow-crystal catalog — complete

Work only in `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` on
`feature/named-crystal-catalog`; do not touch the running NAS publisher in the animation worktree.
The strict taxonomy, exact [52-asset visual audit](named-snow-crystal-current-assets.md), and
versioned GG+ seed implementation are complete in the isolated worktree. GG+ is a separate
initial-condition adapter: the permanent `gg-solver.ts` control remains byte-identical, while the
adapter's hexagonal-prism route matches its tested 200-tick state bit-for-bit. Strict custom sites
are connected, canonicalized, bounds-checked, and identity-bound by exact sorted-site digest.
A real four-site custom-seed growth sample round-tripped its web growth event file and full public
checkpoint. Focused seed/runner/control-identity tests passed 25/25. Exact `npm test` then passed
140/140 files, 2,237 tests with 49 skipped, in 440.00 seconds after setting `TEMP` and `TMP` to the
canonical long Windows temp path; the permanent G-G control identity passed inside that run.

The coverage-first command `node scripts/named-crystal-baseline-probes.ts run` then used exactly 24
workers and completed 24/24 direct-growth jobs. Its report is
`out/named-crystal-catalog/baseline-probes-v1/report.json` (40,380 bytes; SHA-256
`68221cc4190f4d28008dfc17c8fb0cf3cfa67347fc741ec4e13f9b767904ed3c`): web files ranged from
62,188 to 830,136 bytes, totalled 8,188,899 bytes, and all were strictly below 20,000,000 bytes.
The bound three-view review records ten advance candidates, five retune candidates and nine failed
probes, with zero formal slots filled. A presentation-only orthographic camera correction now
includes projected Z and full three-dimensional extent, so tall columns are no longer clipped into
vertical bars; its focused review/runner/framing checks passed 8/8, both typechecks passed, and the
app build transformed 73 modules. Next register one 24-job, one-driver-per-family follow-up across
the six failed GG+ hard forms (four deterministic variants each). That follow-up is now registered
in `docs/named-snow-crystal-hard-form-probes.json`: 24 unique jobs, four variants each for Scrolls
on Plates, Triangular Forms, Cups, Multiply Capped Columns, Needle Clusters and Hollow Plates. Its
runner independently binds those IDs to the failed first-pass review, materializes exact custom
sites/schedules, records exact argv and actual worker count, and enforces the same strict web
ceiling. The 24-job plan, connected-seed/schedule tests, both typechecks, Rule 7 scan and diff check
pass. Next run `node scripts/named-crystal-hard-form-probes.ts run` with exactly 24 independent
processes. That run completed 24/24 jobs with 24 actual workers; its 47,848-byte report (SHA-256
`21475d310edcc231fe1f5429d42684ac0bbb92f047c060acf7249570aa281ddf`) records web files from
34,549 to 507,663 bytes, 2,895,660 bytes total, all below the strict ceiling. Three-view review
advances the four Hollow Plates variants, sends Multiply Capped Columns and Needle Clusters to
explicit Compose, and sends Scrolls on Plates, Triangular Forms and Cups to one bounded early-stop
search because growth erased their defining seed feature. Zero formal slots are filled. Next
register the three-family, 24-job early-stop interval search before launching it on all 24 cores;
that manifest and runner are now complete. They derive one fixed source seed/spec for each family,
vary only stop tick across 100–1,200, record initial and newly attached site counts, and require 24
actual workers plus the strict web gate. Its 24-job plan, fixed-spec tests, both typechecks, Rule 7
scan and diff check pass. The run then completed 24/24 with 24 workers. Its 50,418-byte report
(SHA-256 `4b09087bbcf515f527bc8fa5e281b51f5be9661a86d53be61e564f41f7a74db3`) records positive growth
for every job and web assets from 4,105 to 53,312 bytes. Three-view review advances Scrolls on
Plates at 100/300/400 ticks, Triangular Forms at 200/400/600 ticks, and Cups at 100/200/400 ticks:
nine production candidates, still zero formal slots. Next bind the accepted direct-growth
production candidate matrix—including these nine and four Hollow Plates candidates. The versioned
Compose contract and live player are now also implemented: strict component/scientific identities,
transforms, phase offsets, bounds, unique cold-byte accounting, actual browser byte/hash checks and
an explicit composed-visualization disclosure. A deterministic crossed-needle smoke used one
121,806-byte growth request for two transformed instances and sought successfully at 4/8 seconds;
the three focused files passed 8/8, both typechecks and the 75-module app build passed. That local
probe is player evidence only, not an accepted scene. Next commit this contract, then build the
direct-growth production candidate matrix and first scientifically bound Compose baselines before
changing the two route decisions. The generated maker-facing catalog table now links all selected
early-stop/hollow-plate trios plus the Solid Column, Sheath, Split Plate and Isolated Bullet
baselines, and it names the two pending Compose transitions. Its strict validator and four focused
tests pass while correctly retaining zero accepted slots. Next register the dual-output production
matrix: exact lower/baseline/upper recipe identities for the new GG+ families and exact reuse
identities for current strong anchors, without inventing a scientific locator before the independent
publisher registers it. Do not touch the independently running NAS publisher in the animation
worktree.

The first production matrix completed 24/24 with 24 actual workers. The exact 567,085-byte report
(SHA-256 `ed3153cb3480180555c972ee07c0ec635111deb0773ed9bdcc1726e16dd4ef52`)
records decoder-verified web files from 4,759 to 361,488 bytes, 3,084,489 bytes total. The full
scientific inventory is 2,924 files / 2,291,163,313 bytes with 101–121 frames per entry. The bound
8,384,905-byte three-view contact sheet (SHA-256
`a77d447ecb0ca6b3f4f43de02007d165076f062aa6becbfc4c4ab3677e463346`)
supports acceptance of all eight lower/baseline/upper trios. The generated catalog table now links
each accepted preview, web asset, recipe and scientific bundle and reports 24 accepted / 75
remaining. Outputs remain local ignored products; governed publication is still pending and no NAS
locator is claimed.

The second 24-job protocol is now registered for Simple Prisms, Hexagonal Plates, Hollow Columns,
Stellar Plates, Capped Columns, Sectored Plates, Simple Needles and Fernlike Stellar Dendrites.
Every trio varies only one schedule-wide `rho` scale by ±5%. Six families derive from advance-grade
baseline materializations; Simple Prisms binds the strong `fig11` current-audit source, and
Hexagonal Plates binds the strong `sweep-t2p5-r0p08` source. The two plate families whose probes
contacted their domains use fixed enlarged domains. The exact manifest and runner are now
implemented and the read-only plan materializes all 24 jobs. It reuses the first tranche's
dual-output executor/verifier and refuses source review/hash, route, dimension, host/concurrency or
output-contract drift. The focused two-file check passes 11 tests; both TypeScript projects, the
Rule 7 scan and diff check pass. The implementation was committed as `8c13747`, then
`node scripts/named-crystal-direct-production-2.ts run` completed 24/24 with 24 actual workers. Its
594,644-byte report (SHA-256
`f5d30f6e896980a19df9716f5400c207c5c9994dce7fcd3804ec0c2ef97b85e1`) records decoder-verified
web files from 55,268 to 3,576,987 bytes and scientific bundles totalling 3,078 files /
6,568,205,710 bytes with 115–121 mesh states each. The 9,983,672-byte three-view sheet (SHA-256
`6e849aab1f49ed1e6e107516e42c27578ed6dee37a3d15e7abde5c92d3e6e578`) shows the eight expected
morphologies. Hollow Columns and Simple Needles retain 41–48 Z layers at their closest boundary;
Capped Columns retain 66–70. They are not vertically clipped.

Maker direction nevertheless requires the established large scientific domain scale: existing
planar sources are generally 500–800 cells across, Simple Needles/Hollow Columns are
128×128×768, and Capped Columns are 320×320×512. Therefore both completed 24-job fleets are retained
as parameter/morphology screens but do not complete final-resolution catalog slots. The active plan
now registers two replacement 24-worker fleets with exact large domains/caps and a vertical
clearance gate, while preserving the same three-variant recipes, 120-mesh-state scientific cadence,
actual web decoder and strict byte ceiling. Next commit that protocol revision; then implement the
tracked supersession/reset plus the common final-resolution runner and focused preflight before
launching Fleet A on all 24 cores. The protocol revision is committed as `e73d467`. The exact
36,250-byte supersession record (SHA-256
`7529a3c2ee754f24baf5515bb6b8631670a8423b14194f485dee4c789b080dbd`) now preserves both screens
and resets the strict catalog to 0 accepted / 99 remaining. The common manifest/runner materializes
24 unique source-bound jobs for either Fleet A or B, checks all registered large dimensions/caps,
and enforces both 16-layer and 5%-of-`nz` vertical clearance after generation. Its five focused
files pass 26 tests, both TypeScript projects pass, the Rule 7 scan is clean across 1,077 files and
the diff check passes; both final output roots remain absent. Next commit this implementation
checkpoint, then launch
`node scripts/named-crystal-final-resolution-production.ts run --fleet a` with all 24 workers. Do
not touch the independently completed NAS publisher in the animation worktree.

Fleet A is now running with 24 actual child processes and no early stderr. While it runs, the active
plan registers Fleet C for the final six direct-growth types: three exact-source `rho` variants each
for Columns on Plates, Skeletal Forms, Simple Stars, Stellar Dendrites and Double Plates, plus nine
fixed-recipe Capped Bullet stop candidates from which three adjacent bullet-and-cap results must
survive review. Implement and preflight Fleet C without launching it; Fleet A retains the only
24-worker production lane until it completes. Fleet C is now implemented as a separate byte-pinned
manifest/runner, its 24-job read-only plan leaves the output root absent, and its combined focused
check with the A/B runner passes 14 tests. Both TypeScript projects pass, the Rule 7 scan is clean
across 1,080 files, and the diff check passes. Commit this implementation without changing or
restarting Fleet A; Fleet C remains queued until the lane is free.

The final Compose protocol is also registered for 11 families / 33 scenes, including the deferred
Multiply Capped Columns and Needle Clusters route transitions. Every trio varies one small transform
property, counts unique component bytes, binds exact full-resolution component science identities,
and requires real-browser hash/decode/seek/render evidence. Implement its recipe manifest and
fail-closed builder while Fleet A runs, but do not materialize scenes or change routes until the
consolidated direct review exists.

The recipe manifest and fail-closed Compose builder are now implemented. A fixture consolidated
review exercised all 33 scenes through strict scene parsing, actual component decoding, unique cold
byte accounting and scientific-scene inventory generation; the three focused files pass nine tests,
both TypeScript projects pass, and the Rule 7 scan is clean across 1,083 files. The production plan
reports `directReviewReady: false` and leaves its output root absent as required. Commit this
checkpoint; do not build real scenes or change routes before direct acceptance.

The Compose browser-review helper is now implemented too. It requires the complete real 33-entry
report, rechecks scene identities and the cold-byte ceiling, and drives the app's strict
`growthScene` path through component fetch/hash/decode before capturing start / 55% / final time.
It will write 99 capture identities bound to the exact source report, but cannot itself accept or
change a catalog row. Its JavaScript syntax check passes, the Rule 7 scan is clean across 1,085
files, and the diff check passes. Commit this helper while Fleet A continues; do not run it before
direct acceptance and real Compose materialization.

Review found that those 99 captures cover three timeline stages but only one camera and therefore do
not yet discharge the separately registered three-view morphology gate. The correction is now
registered before implementation: add capture-only bounded growth-scene camera overrides and produce
face/oblique/axial × start/55%/final captures, 297 exact playback images in total. Update and test the
helper while Fleet A continues; do not use its current 99-image form as Compose acceptance evidence.

The Compose three-view correction is now implemented. Normal playback cannot apply review params;
capture mode bounds tilt/yaw, and the helper now writes 297 face/oblique/axial × start/55%/final
captures plus a bound final-time contact sheet. Eight focused tests, both TypeScript projects and the
76-module app build pass. The built-app smoke command loaded a strict in-memory scene through real
component fetch/hash/decode, rendered the axial override, proved normal playback ignored review
params and refused 91° capture tilt; its screenshot SHA-256 was
`7179d18e9f33958313bec382944557db902a612fda33d8dfc0aa3ccc27cd3d75`. Both review scripts pass
syntax checks, Rule 7 is clean across 1,090 files and the diff check passes. Commit the correction;
real capture remains blocked on direct acceptance and scene materialization.

The final Compose acceptance transaction is now registered before implementation. A future reviewed
decision must pin the exact 33-scene report, 297-capture browser review and final-time three-view
contact sheet, with one morphology rationale per Compose family. A fail-closed verifier will rehash
all scenes, scientific-scene bundles and 297 captures, reparse scenes, recompute cold bytes, then fill
the last 33 slots and apply the two deferred route changes in one catalog/table transaction. Implement
and fixture-test it while Fleet A continues; production decisions remain blocked on real direct
acceptance, scene materialization and visual review.

The fail-closed final Compose verifier is now implemented. It rechecks all 33 actual scene/science
products, recomputes cold bytes, rehashes all 297 captures, requires exact nine-view/stage coverage
per entry, and prepares the last 33 slots plus both deferred route changes before any tracked output
replacement. The catalog validator now permits only the empty 24/9 pending route state or the complete
22/11 terminal route state. Six acceptance fixtures plus four catalog tests pass, including report,
capture, coverage, cold-byte and premature-route controls; both TypeScript projects pass, Rule 7 is
clean across 1,092 files and the diff check passes. Commit the verifier; real decisions remain blocked
on direct acceptance, scene generation, 297-image capture and visual review.

The final direct-acceptance transaction is now registered before implementation. One future tracked
decision file must pin the exact A/B/C reports, three-view contact sheets and clearance reports,
record every morphology rationale, and choose exactly three adjacent Capped Bullets stops. A
fail-closed verifier will recheck all selected actual web/scientific identities and clearance rows,
then atomically produce the consolidated 22-family / 66-variant direct review and fill only the 66
direct catalog slots. Implement and fixture-test that verifier while Fleet A continues, but do not
create the production decision file or accept any row before all real outputs are visually reviewed.

The fail-closed direct-acceptance verifier is now implemented. It rechecks contained A/B/C artifact
identities, complete 24-worker reports, every selected decoder/web/scientific identity, all registered
clearance rows and Capped Bullets adjacency before preparing the consolidated review and 66-slot
catalog/table transaction. Five focused fixtures pass: one complete 66-slot transaction plus exact
report drift, non-adjacent Capped Bullets, selected web-byte drift and incomplete-clearance controls.
Both TypeScript projects pass, the Rule 7 scan is clean across 1,087 files, and the diff check passes.
Commit the verifier; its production decision/review inputs remain absent until A/B/C visual review.

Final-resolution Fleet A then completed 24/24 jobs with 24 actual workers and zero failed/missing.
Its exact 591,740-byte report (SHA-256
`3f2450ea36371ad66198004e5f66368d59eeccb0e2ac021b46b973a121aa1cfd`) records 24 decoder-verified
web files from 623,976 to 10,923,005 bytes, all strictly below 20,000,000 bytes, plus 3,043
scientific files / 42,323,811,889 bytes with 109–121 mesh states per entry. The exact 4,225-byte
vertical-clearance report (SHA-256
`8badf5ef28933e6f3247edff9938ac30fe0345b38839492ae3439a166615f456`) passes 9/9 tall results:
Hollow Columns retain 238–249 Z layers at the closer boundary, Capped Columns 106–121 and Simple
Needles 178–196. Visual inspection of the exact 10,913,625-byte three-view sheet (SHA-256
`66222f9f5a84edb1b0132f7d049319b519c199eefa1c4f85f35af40a2572fcdf`) accepts all eight trios as
production candidates: planar forms retain their named face morphology, Hollow Columns/Needles are
axial and fully framed, and Capped Columns keep distinct caps at both ends. These 24 outputs remain
unaccepted until the consolidated A/B/C direct decision. Next commit this execution/review record,
then run `node scripts/named-crystal-final-resolution-production.ts run --fleet b` in the freed
24-worker lane; do not launch Fleet C concurrently.

Final-resolution Fleet B then completed 24/24 jobs with 24 actual workers and zero failed/missing.
Its exact 568,078-byte report (SHA-256
`51c23843bcbb0953d07fcd4ad0fe2d8734ee07b3c7a73e130fea713c5b8a97fe`) records 24 decoder-verified
web files from 4,769 to 444,686 bytes, all strictly below 20,000,000 bytes, plus 2,924 scientific
files / 12,489,068,672 bytes with 101–121 mesh states per entry. The exact 5,342-byte clearance
report (SHA-256 `0ce28de986c0424ea7adc2aabf720180ecfdccb7bfcdfaa8c78f062998235339`)
passes 12/12 tall results: Cups retain 246–250 Z layers at the closer boundary, Isolated Bullets
205–218, Sheaths 321–332 and Solid Columns 267–269. Visual inspection of the exact 8,666,417-byte
three-view sheet (SHA-256
`31dd77b506bf723dd110330e9497acc6c637286f061766b5ee172008b2386cae`) accepts all eight trios as
production candidates: the tall families are fully framed, Hollow Plates retain their cavity,
Scrolls remain asymmetric, Triangular Forms remain triangular and Split Plates & Stars remain
visibly split. These outputs remain unaccepted until the consolidated direct decision. Next commit
this record, then run `node scripts/named-crystal-final-resolution-production-c.ts run` in the freed
24-worker lane; do not start Compose generation concurrently.

Final-resolution Fleet C first pass then finished 21/24 with zero missing and 24 actual workers.
The exact 524,024-byte report (SHA-256
`84415852227cc635782358f5f2342173ff47edd9d2b910614a7a1b919e0d320e`) shows all nine Capped
Bullets searches and all Stellar Dendrites, Simple Stars and Skeletal Forms variants passed. The
exact 4,703-byte clearance report (SHA-256
`b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`) passes all 12 Columns on
Plates / Capped Bullets rows. Three child solvers exited zero and produced decoder-valid web files
below 20,000,000 bytes, but deterministic domain contact preceded their tick caps and left only
88/95/88 scientific frames: `columns-on-plates-upper` stopped at tick 10,251,
`double-plates-baseline` at 33,737 and `double-plates-upper` at 31,081. The active plan now registers
an exact three-job cadence-only repair at 86/282/260 ticks per frame, targeting 121 states while
requiring the final mesh/state/record/growth identities to remain byte-identical. Next implement and
focused-test the fail-closed repair/reconciliation tool, commit it, run the three jobs in parallel,
then render and inspect Fleet C's contact sheet. Do not weaken the 100-frame floor or change solver
recipes/domains.

The fail-closed cadence repair is now implemented. Its tracked manifest binds all first-pass and
unchanged-product identities; the runner derives exactly the three registered jobs, stages them in
a separate root, verifies 121-frame timelines plus byte-identical final mesh/checkpoint/record/web
products, archives the failed bundles, and reconciles the fleet without rewriting its original
24-worker launch. The read-only plan succeeds; the three focused files pass 13 tests; both
TypeScript projects, the Rule 7 scan (1,095 files) and diff check pass. Next commit this checkpoint,
then run `node scripts/named-crystal-final-resolution-c-cadence-repair.ts run`; the three independent
repairs use three actual workers because no other failed recipe exists to occupy the remaining
cores. After 3/3 completes, render and inspect Fleet C's three-view sheet.

The cadence repair generation completed 3/3 at exactly 121 frames each; the decoder-verified staged
web files are 1,599,644 / 5,877,133 / 6,214,328 bytes. Reconciliation then stopped before replacing
anything because the preregistered byte-identity assertion included `record.json` and
`growth-v1.bin`. Direct comparison proves every repaired final mesh and checkpoint is byte-identical.
The record differs only in generated paths, web byte count and wall time; strict decoding shows the
web event counts, seed counts, endpoints, dimensions, center, flat-index arrays and attach-tick
arrays are identical, while its provenance header records the different root and cadence argv. The
active plan now registers a correction: retain byte equality for mesh/checkpoint, require exact
field/event semantic equality for record/web, relocate only embedded root prefixes, and rebuild the
final inventory/status. Next implement and focused-test that correction, commit it, then rerun the
reconciliation stage without rerunning the completed solvers.

The correction is now implemented and product-sized verification passes: three focused files / 15
tests, both TypeScript projects, Rule 7 across 1,095 files and diff check. Exact mesh/checkpoint
identity remains mandatory; non-provenance record fields and both decoded attachment arrays now have
independent negative controls. The final-root files are re-decoded and recursively inventoried after
their embedded root prefixes are relocated. Next commit this correction and rerun the same repair
command; it must detect the complete 3/3 staged report, skip solver work, reconcile Fleet C and leave
the original failed bundles in the registered archive.

Fleet C is now complete and visually reviewed. Its exact 686,526-byte consolidated report (SHA-256
`0807b91d123516b4cbfc6d9be8306e8a1838b21f36e1f0e76d8363240e380490`) records 24/24,
decoder-verified web assets of 88,655–8,441,989 bytes, and 3,032 scientific files /
55,888,738,908 bytes with 102–121 frames. Clearance remains 12/12 in the exact 4,703-byte report
(SHA-256 `b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`). The exact 9,654,924-byte
three-view sheet (SHA-256
`4addc816196a172831df0702b7901d5f2028188076d8aaca1405672015cbee5d`) passes all five trios; Capped
Bullets stops 4,500/5,000/5,500 are the selected adjacent trio because each retains a tapered bullet
body and distinct plate cap. The exact three-fleet decision is now tracked. Next commit this review
and decision, then run `node scripts/named-crystal-final-direct-accept.ts` to fill 66 direct slots;
after its focused verification, build the 33 registered Compose scenes.

Final direct acceptance is complete: the exact 92,966-byte consolidated review (SHA-256
`31f5566114deae377d0a715bab2938b05750e5c6095a08e6144e6787023223ec`) binds 22 families / 66
variants, and the generated catalog is now 66 accepted / 33 remaining. Two focused tests had stale
0/99 fixture assumptions after the intended state transition; they now construct an explicit empty
direct fixture and assert the live 66/33 catalog. Both focused files pass nine tests, both TypeScript
projects pass, Rule 7 is clean across 1,097 files and diff check passes. Next commit this transaction,
then run `node scripts/named-crystal-final-compose.ts build`, capture all 297 real-browser review
images, inspect them and execute final Compose acceptance.

The first complete 297-capture Compose review is not accepted. Visual inspection found that the
fixed −500…500 scene cube makes several families tiny, while radial bullets/needles and crossed
needles overlap because their old Euler Z variation does not rotate the component's local Z axis in
the player's XYZ order. The active plan now registers exact event-derived transformed bounds, tested
polar-axis Euler rotations and high-visibility `bold-ice` review captures. Next commit this correction
protocol, implement it with focused geometry controls, rebuild the 33 scenes and replace all 297
review captures before creating any Compose decision.

The Compose framing/rotation correction is implemented. Exact decoded-event AABBs replace the fixed
cube; every transformed corner is checked against its published bounds; radial/crossed axes now use
a tested polar-to-XYZ mapping; and review switches to high-visibility `bold-ice`. Three focused files
pass 12 tests, both TypeScript projects pass, Rule 7 is clean across 1,097 files, JavaScript syntax
and diff checks pass. Next commit this implementation, rebuild the 33 scenes and regenerate the full
297-capture review before visual acceptance.

All 33 real Compose scene/scientific bundles are built. The first browser-review request stopped on
a Vite 403 before any scene rendered because the helper attempted raw `/@fs` access to `out/`, which
the app's security boundary intentionally denies. The boundary remains unchanged. The helper now
intercepts only the exact byte/SHA-verified scene and component URLs inside Playwright while serving
ordinary app code through loopback Vite; syntax, Rule 7 and diff checks pass. Next commit this helper
fix, rerun all 297 captures, then inspect the final-time three-view contact sheet.

The exact Playwright routes then reached and rendered the first real scene, but its first WebGPU
screenshot exceeded Playwright's unrelated 30-second capture default. The helper now gives scene
and contact-sheet screenshots the same 120-second ceiling already used for scene readiness. Next
commit this capture-only timeout and restart the browser review; no scene output or solver product
changed.

The corrected review reached 13/33 scenes before a second presentation defect was found and the run
was stopped: Multiply Capped Columns touches/crosses the viewport edge in oblique and axial views.
The transformed scene bounds themselves contain every component, but the orthographic fit omits
the yaw contribution from X and the final Compose `zoom` values below 1 shrink the calculated
half-span. The active plan now registers yaw-aware projected framing, a tall/yawed regression and a
minimum scene frame factor of 1. Next implement and focus-check that correction, rebuild the same 33
scenes, remove the partial rejected captures and restart all 297 views.

The yaw-aware projected-framing correction is implemented and focus-checked. Orthographic width and
height now include the actual yawed X/Y contributions, and final Compose scale-to-frame factors are
1 or 1.05 so the built-in 12% allowance remains positive. Fifteen focused tests pass, the root
typecheck covers both TypeScript projects, the app production build passes, Rule 7 is clean across
1,097 files and syntax/diff checks pass. Next commit the correction, rebuild all 33 scenes, remove
the rejected partial capture directory and restart the complete 297-view review.

That restarted review was stopped after six scenes because the first real face-on 12-branched Star
still reaches the top and bottom pixels despite the yaw-aware AABB fit. This partial capture set is
also rejected. The active plan now registers a conservative 1.4 scene frame factor plus a live
Three.js projected-cell rectangle that makes the browser harness fail unless every view retains 5%
clearance on all sides. Next implement/focus-check the rendered-clearance contract, rebuild the 33
scenes and validate the first flat and tall sentinels before continuing the full pass.

The rendered-clearance gate is implemented: full-growth decoded cells are projected through the
actual Three.js component/scene matrices and camera, and the review helper refuses a view outside
`-0.9..0.9` NDC before taking screenshots. Final Compose scenes use a conservative 1.4 frame factor.
Four focused files pass 16 tests, both TypeScript projects and the app production build pass, Rule 7
is clean across 1,097 files and syntax/diff checks pass. Next commit, rebuild, archive the rejected
partial review and restart with early flat/tall visual sentinels.

That final pass completed all 33 scenes / 297 captures with every live clearance check passing.
Flat and tall sentinels plus the complete contact sheet and representative seed/middle/final frames
passed visual review. The exact 45,797-byte Compose report (SHA-256
`d20832db1c7af49aaaae8e132b536e0298b8a992a11d9c5a25a1dc62a6513467`), 137,828-byte browser review
(SHA-256 `42b25f9177cdadd5ea7aa9931c3b2f74db0459c6bba9d0de1dd3422260d9d311`) and 5,243,676-byte contact
sheet (SHA-256 `0e2ea39dccb3fbf2b2c5bed4ef81ecf000670c1afbb80e999b76fe1397f47e59`) are bound by the tracked
decision and consolidated review. Final acceptance atomically filled the last 33 slots and changed
Multiply Capped Columns and Needle Clusters to Compose. The catalog is terminal at 99 accepted /
zero remaining, 22 direct / 11 Compose / two excluded; every cold web payload is below 20,000,000
bytes. Six focused files pass 26 tests, the root typecheck, app production build, Rule 7 across 1,099
files and diff check pass. This workstream has no remaining generation step. Publication or copying
these local products is a separate maker-authorized transaction if desired.

### Named snow-crystal local gallery — complete

The [local gallery plan](plans/named-crystal-local-gallery.md) completed the dedicated Vite page,
exact allowlist service and truthful direct/Compose playback distinction. Focused tests passed 2
files / 6 tests, both TypeScript projects typechecked, the app production build and Rule 7 passed,
and the live browser smoke covered the serving boundary plus one direct and one Compose playback.
No gallery implementation step remains. Public deployment or cross-repository copying would be a
separate maker-authorized transaction.

### Named snow-crystal volume rendering — complete

The [volume-rendered gallery plan](plans/named-crystal-volume-gallery.md) is complete. All 99 cards
now use matching final-frame previews and open the component-aware GG-style volume player. The
direct planar, tall/hollow and Compose sentinels passed visual inspection; the complete 66-direct /
33-Compose browser sweep passed framing, error and shared-texture assertions. Focused tests passed
three files / nine tests, both TypeScript projects typechecked, the app production build, Rule 7,
script syntax, diff check and the live gallery smoke passed. No solver, growth history, accepted
identity, scientific claim or network-payload ceiling changed. The loopback page remains
`http://127.0.0.1:5173/named-crystal-catalog.html`; public deployment is a separate transaction.

### Named snow-crystal volume stability correction — complete

The [volume stability correction](plans/named-crystal-volume-stability-correction.md) is complete.
The maker's exact 12-branched Star, its direct Simple Star source, two adjacent orbit frames, a
six-component Radiating Dendrite and thin/tall/hollow sentinels now render without the invalid black
pattern. All 99 previews were regenerated; the full browser sweep passed 66 direct / 33 Compose
players and the gallery smoke passed its serving boundary plus both playback routes. Focused tests,
both TypeScript projects, the app build, Rule 7, script syntax and diff checks pass. No solver output,
accepted identity, Compose transform, animation timing or network payload changed. The loopback page
remains `http://127.0.0.1:5173/named-crystal-catalog.html`.

### Phase 10 — planning complete; maker package selection pending

The [candidate plan](plans/phase-10-closures-and-frontier.md) replaces the original A–D shorthand
with composable A–H packages and explicit return gates. Nothing is selected. Its recommended
default is **A-S + A-I + B, alongside no-solver C0 and verification-first C0V with its
packet-specific A-P preflight**, with no PC habit run. A separate opt-in early numerical-risk
probe is **C0 + A-P + C1–C2**: fresh N80 replay, N96
sentinel, then N112 only if N96 passes, with a three-row/72-process-hour maximum. It is diagnostic
at one neutral attached-count consumer and does not qualify a future B target. D remains deferred.

The next action is the maker's package choice or a decision to stop at G. After a choice—and not
before—the repository actions are:

1. write a package-scoped execution plan and ADR/charter amendment with the chosen done/stop rules,
   authority boundaries, resource budget, and complete charter-clause audit;
2. correct `AGENTS.md`'s stale “Phases 0–8” sentence during that reconciliation; and
3. for any executable/PC package, implement A-P's obligation matrix, producer, independent
   evaluator, negative controls required by the protocol, and exact launch README; pass exact
   `npm test` and packet preflight before moving the run to the PC.

Standing constraints: no Phase 8 record may be relabeled unseen; Phase 7 retains held-out,
product, and GPU obligations; B outcomes do not automatically authorize E/F/H; the permanent
`GGThreshold`/`LibbrechtKinetics` operators remain unchanged unless a separately adopted package
explicitly amends their contract; and no Phase 6 evidence artifact is rewritten.

### Other live decision points

1. **NAS prune approval** — the exact workstation-source prune list (pinned ladder worktree
   `G:\Code Files\snowflake-phase6-ladder`, archived `out/` trees) is now unblocked by the
   verified external-evidence backups; it remains a separate reviewed maker decision. Nothing
   has been deleted.
2. **Education reconciliation** — done and merged on 2026-09-05: Chapters 30–33 and the corrected
   Chapters 13–29 status boundary are on `main`, and the education verifier oracles
   (`docs/education/tools/part-two-oracles.mjs`) now pin the final Phase 6 state instead of the
   retired handoff. Still open: the exact `npm test` closure recorded in the education plan, and
   catching this index up with Chapters 30–33 when the Phase 10 evidence branch merges.

Phase 7 stays on hold as a parallel product/engineering track; it still requires its own
committed plan and isolated worktree before any work starts, and V4/V4.x apparatus stays
retired.

### Phase 6 closure record — no Phase 6 work remains

Closed 2026-08-20 on the flagless `gate6` exit 0 (gate table above; completed
[plan](plans/phase-6-science-first-completion.md)). The
[80-row ladder](plans/phase-6-wp2-ladder.md) published **NO-PASS (criterion)** on both
spacings — the numerics are NOT converged at these resolutions and the attached-count
observable carries multi-percent seed sensitivity — and the WP2 and gate-unit non-author
reviews closed with 0 blockers. A same-day macOS re-derivation at `9e64ef7` (clean tree)
reproduced gate6 13/13 / exit 0 and exact `TMPDIR=/private/tmp npm test` green: 132 files,
2,250 passed / 7 skipped in 403.61 s. Full closure detail:
[the history file](progress-history-phases-6-8-9.md). Held-out and preview-GPU work remain
Phase 7 property with no Phase 6 credit.

### Journey compact growth replay — glass/camera parity follow-up active (2026-08-16)

Open [explore-gutcheck-growth-glass-camera.md](plans/explore-gutcheck-growth-glass-camera.md), then
[explore-gutcheck-growth-volume.md](plans/explore-gutcheck-growth-volume.md). The strict format,
baker, full Run B asset, smooth viewer, measured comparison page, strict v5 Chromium record, visual
inspection, adversarial reviews and final full suite are complete locally. No Journey/media action is
required for those accepted v5 bytes. Hard-refresh
`http://127.0.0.1:4177/gutcheck-growth-comparison.html?record=%2Fcomparison-record.json` and inspect
poster views, final-state camera hold, orbit and `follow tour`. When Browser is available, add
presentation/camera/manual-hold witnesses to `app/scripts/growth-comparison-capture.mjs`, capture to
a new no-clobber directory, inspect the screenshots, then close the follow-up plan. Do not cite v5
for this look. Governed publication still waits for the parallel NAS-governance workstream's forward
collection command and catalogue/owner-manifest/receipt/fresh-restore contract. Do not run or
retarget `scripts/gutcheck-publish-growth-comparison.ts`, recreate the retired NAS `out/` tree, or
append the old ledger. Preserve the legacy meshes and do not count this media work toward any phase
gate.

### Phase 8B record — closed; external search remains stopped

Decision 0048, charter v1.25, and the
[benchmark-corpus plan](plans/phase-8-measurement-corpus.md) govern. Preserve `evidence/phase8-target-book/`
byte-for-byte, along with rejected plot-adjudication history and the failed original residual
audit. Broad discovery and the residual backlog remain stopped absent a new named
measurement gap; Phase 9 S0B is bounded reconciliation of already registered complete Git/NAS
sources. All 51 Phase 8B records are development evidence and none may be relabeled held out.

### NAS asset governance — complete through the Windows write lane; prune approval pending

The [governance plan](plans/nas-asset-governance.md) holds the full record: the macOS
correction applied without deletion (`d92f39a`), the Windows write lane executed 2026-08-20
(`0b34ee9`: 11 collections, 8,362 files, receipt-verified, 11/11 fresh-process full verifies,
green restore round-trip), and the external-evidence backup gap closed same day (`9e64ef7`:
independent-domain copies verified twice against ledger pins, `backup.status: verified`). SMB
rename crash-durability stays verification-based. Remaining: the maker's exact prune approval
(decision point 1 under **Other live decision points**). Quoted detail:
[the history file](progress-history-phases-6-8-9.md).
