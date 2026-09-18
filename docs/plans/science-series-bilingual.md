# Plan — same-page English / 中文 series

- **Status:** translation refinement and Susan-voice Mandarin re-production in progress (2026-09-18); fluent listening/understanding review remains
- **Started:** 2026-09-17
- **Scope:** existing Simplified Chinese series; Mandarin voice `4AfodMgwXps9oZFhHzoj` (2026-09-17 revisions, retained) superseded by maker-supplied `0H4ruoQ81Ei2FCwjW5j1` (2026-09-18 amendment below)
- **Parent:** [series plan](explore-journey-science-series.md), [episode design guide](../video/science-series-design-guide.md)
- **Baselines:** authority `696dad8`; website `5fcd95a` on the retained `explore/film-part1` worktree

## Goal

One top-level **English / 中文** toggle changes the existing series' readable language on the
same page and URL, preserving the current story position. Translate the current E01 and E02
scripts, optional reader, series navigation and explanatory labels into natural Simplified
Chinese with the approved conversational tone and unchanged scientific qualifications.

## Approach

1. Keep English performed sources, audio, cue keys and current timing immutable. Bind each
   Chinese section/paragraph to the existing English identity; use the current production
   source, not the superseded ten-section E01 or silent E02 draft.
2. Draft translation assets with paragraph parity, source links, shared scientific vocabulary
   and separate production metadata. Independently review meaning/qualifiers and natural wording.
3. Add a single shared language preference and top toggle inside the existing React document,
   without a language route, remounted episode or replacement animation. Translate DOM and
   canvas text; retain source names, scientific symbols and immutable asset identifiers where
   appropriate. Use Chinese-capable fonts and space for readable labels.
4. Remeasure translated reader geometry while retaining story time, playback ownership and
   reading position. Changing language must not seek to zero, call episode start or change URL.
   While Mandarin audio is absent, English audio remains unchanged with a clear bilingual
   disclosure; do not imply the English speech is Mandarin or invent Chinese voice timing.
5. Run focused localization/content/continuity tests, TypeScript and the existing website build.
   Use the maker's standing visual-inspection direction for bounded desktop/narrow checks of
   text, representative diagrams and same-position toggling. Preserve old film, home choreography,
   model assets and both English recordings. Record coverage and untested behavior honestly.

## Done when

Both existing episodes and shared series text are available in Simplified Chinese through the
single same-page toggle; essential labels and optional depth remain understandable; position
and English playback survive switching; targeted checks and translation review are recorded.
This is text localization, not completed bilingual narration or Mandarin timing acceptance.

## Out of scope

No speech generation, credential access, voice-library changes, new page/route, solver changes,
scientific gate, new episode, export, deployment, push or publication. Actual Mandarin voice
selection, generation, phrase alignment and cross-language audio switching require the later
voice ID and production request. No new dependency is expected.

## Open questions

A fluent audience listening/understanding review follows the recorded performance; text review
and machine audio checks cannot establish subjective delivery or audience comprehension.

## Mandarin production amendment — 2026-09-17

The maker has now supplied `4AfodMgwXps9oZFhHzoj` for Mandarin. This lifts the earlier speech
generation deferral for the two already translated episodes. Baselines: authority `4496d5d`,
website `9fd4a37`. English recordings, the revised source/visuals, old film and home remain intact.

1. Generate one source-bound Mandarin take per existing section from the reviewed Simplified
   Chinese paragraphs, retaining requests, alignment, hashes and decoded samples. Use the
   existing authorized ElevenLabs credential without logging it. New immutable language-specific
   revision directories; one paid request per take and no automatic retry of an uncertain outcome.
2. Retain shared section/paragraph IDs and author English/Chinese semantic phrase anchors.
   Compose Mandarin with its own paragraph and prediction pauses; map its real aligned speech
   to the retained English story clock. Never equate elapsed seconds or use a whole-episode
   duration ratio. Visual cues and scroll position follow the shared story position.
3. Upgrade the one existing English / 中文 toggle to select text and the corresponding audio.
   Preserve current concept/progress, paused/playing state, speed, manual scrolling and prediction
   pauses. Keep the same DOM, route and URL; pause old audio before new playback, invalidate stale
   play promises, and handle not-yet-loaded or unavailable media without restarting or double sound.
4. Update duration/disclosures for the selected language; retain English playback and sample
   provenance. Review Mandarin pronunciation/meaning with bounded independent machine checks
   where available, distinguish those from native-speaker listening acceptance.
5. Verify semantic-map monotonicity and round trips, source/voice/audio identity, mode/race/error
   behavior and both episode timelines with focused tests. Run TypeScript/production build and
   standing-authorized live playback/toggle checks on desktop and narrow layouts. Update this
   plan, PROGRESS and a production review with actual coverage and remaining listening limits.

Done when both translated episodes play the requested Mandarin voice and the top toggle changes
languages at the corresponding story position without resetting the episode, with verified cues
and preserved English assets. No new episode, voice-library mutation, solver work, scientific
gate, new language page, export, deployment, push or publication is authorized by this amendment.

## Text-only execution and verification — 2026-09-17 (historical milestone)

Website `explore/film-part1@e37bf80` implements the shared top toggle, translated home/E01/E02
reader and diagrams, CJK typography, position restoration and an explicit English-audio notice.
Chinese authority assets are `docs/video/science-series-e01-zh-CN.json`,
`science-series-e02-zh-CN.json` and `science-series-diagrams-zh-CN.json`; website copies match.
English cue identities, sources, audio and models remain unchanged. No Mandarin synthesis or
credential access occurred.

The [review](../reviews/science-series-bilingual-2026-09-17.md) records shared-context translation
cross-review, runtime review, fixes and sampled browser observations. Website
`docs/series-localization-tests.txt` records **64 passes, zero failures** for the exact focused
command in that review. The Sites build, including TypeScript, passes with the existing
large-chunk advisory. `npm run lint:rule7` in this authority repo and `git diff --check` in both
repos pass. Product-sized checks only; no full scientific suite/gate.

Website `docs/series-localization-browser-checks.json` records paused and playing switches,
manual reading, optional-note continuity, persisted preference, and representative desktop/
phone-sized layouts. Physical-phone interaction, a full listening pass and live switching
inside a prediction hold were not verified. Mandarin performance/timing remains unproduced.

The later Mandarin amendment supersedes that milestone's speech deferral.

## Mandarin execution and review — 2026-09-17

Website `explore/film-part1@d434084` is the completed implementation. The
[production review](../reviews/science-series-mandarin-production-2026-09-17.md) records the
source-bound recordings, reversible phrase clock, same-page player, independent audio checks,
and bounded browser observations. E01/E02 both use the supplied Mandarin voice; English source
and MP3 bytes are preserved. Original requests/takes/masters and the first semantic score are
retained. The active `semantic-onsets-v2` clocks fix late E02 reveals without new synthesis.
Website `docs/series-mandarin-tests.txt` records 76 passes, zero failures; TypeScript/build pass
is recorded in `docs/series-mandarin-build.json`. The canonical episode guide now carries this
bilingual production/timing contract. No solver, evidence gate or publication changed.

Next: maker listens in 中文 on the same episode links and gives pronunciation/delivery and
comprehension feedback. The review names the uncertain machine-transcription checkpoints;
no fluent-listener or audience acceptance is claimed. Refresh affected authorized-language
takes when their spoken text changes; never leave a stale recording against rewritten words.

## Translation refinement and Susan voice amendment — 2026-09-18 (planned before implementation)

The maker supplied an independent DeepSeek rendering of the E01/E02 page text as a second
reference and asked for a closer, more natural Simplified Chinese version by editorial judgment,
then asked to change the Mandarin narration to ElevenLabs voice `0H4ruoQ81Ei2FCwjW5j1`. Library
metadata for that ID (read through the shared-voice search, not the account library) is
"Susan - Warm Narrator": Mandarin (`cmn-CN`, Beijing), professional narration category. It is not
yet in the account library. Baselines: authority `8df2b44`, website `d7eb937`.

Both requests converge: rewritten spoken Chinese words require fresh Mandarin takes under the
standing refresh direction, and the new voice replaces the voice for every take, so no 2026-09-17
Mandarin take is reusable. E02 stays unreleased (`EPISODE_TWO_RELEASED = false`) but its retained
translation and narration are refreshed together, so no stale recording plays against rewritten words
if it is released later.

1. Author the refined E01/E02 Chinese at bilingual phrase-anchor granularity: every paragraph is the
   exact concatenation of its cue pairs, so the semantic clock sources and the spoken text cannot
   drift apart. Keep section IDs, paragraph counts, source lists, names, symbols, numbers and every
   scientific qualifier; improve rhythm and idiom, using the DeepSeek text where it is more natural
   and rejecting it where it is literal, wrong (`水晶`, `利布布雷希特`) or drops a qualifier.
   E01-11's closing paragraph now translates the current English ending, so the new E01 clock binds
   the current English import directly; the retained `2026-09-17-e01-hook/english-variation.json`
   stays as history for the retained 2026-09-17 revision only. Update status fields, and only those
   reader/UI/diagram strings that read awkwardly. Validate anchors (ordered, unique, full coverage,
   prediction answers present) before any paid request.
2. Add the shared voice to the account library (ElevenLabs requires this before synthesis; it is
   the maker's explicit voice choice, reversible, and not a voice-library edit of any other voice).
   Give the generator an explicit Mandarin voice option defaulting to the new ID, then synthesize one
   source-bound take per section for both episodes into new immutable revisions
   `2026-09-18-e01-mandarin-susan` and `2026-09-18-e02-mandarin-susan` with the same model and
   settings, one paid request per take, no automatic retry of an uncertain outcome. Prior Mandarin
   revisions, masters and scores remain retained and untouched.
3. Give the pacing script a revision option, pace both episodes (E01 three holds, E02 four holds,
   unchanged breath/join lengths) and rebuild the semantic clocks from the new cue files and
   `answerZh` anchors. The live website scores point at the new revisions.
4. Update the voice pin and variation-contract tests, website copies of the three Chinese assets,
   Chinese status/disclosure text and the website production doc. Run the focused series tests,
   TypeScript/production build, the retained independent audio/pace/semantic audit scripts
   parameterized for the new revisions, a bounded offline ASR spot-check, and sampled live
   playback/toggle checks on the existing preview at `http://127.0.0.1:5185`.
5. Record the result: authority review, this plan's execution record, `docs/PROGRESS.md`, the
   design guide's Mandarin voice line and the next-session prompt; scoped commits per repository.

Done when both episodes play the refined Chinese text with Susan-voice Mandarin from the same-page
toggle at the corresponding story position, focused tests and build pass, prior audio and English
assets are preserved, and the records above are updated. Not claimed: fluent-listener acceptance,
audience comprehension, E02 release, export, deployment, push, or any English narration change.

Out of scope: English text/audio, solver, scientific gates, E02 release hold, export, publication.

## Tried and rejected

- Matching languages by elapsed seconds: translations have different durations. Shared
  story identities and actual Mandarin phrase timing now drive the reversible map.
- Creating a Chinese route or remounting the player on toggle: loses continuity and conflicts
  with the maker's explicit same-page/same-link requirement.
- Generating a placeholder Mandarin voice before selection: explicitly disallowed in the text
  pass. The later maker-supplied voice lifts that deferral only for its authorized scope.
- Re-running clock effects when language changes: their cleanup pauses narration. Keep the
  transport effects independent of locale and update only displayed content/geometry.
- English character-count pill sizing and the old hidden-header fallback: translated glyphs
  and the taller phone toggle header require measured widths and correct reading geometry.
- Prioritizing PCM cut points over spoken onsets when one performance has no natural gap:
  delayed some E02 answer reveals. Preserve actual cue onsets; record collapsed lower-priority
  endpoints and test the entire thinking interval through actual answer release.
