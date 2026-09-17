# Plan — same-page English / 中文 series

- **Status:** text translation and same-page toggle complete; Mandarin voice/timing deferred
- **Started:** 2026-09-17
- **Scope:** maker-requested Simplified Chinese translation; Mandarin voice explicitly deferred
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

Mandarin voice ID remains maker-supplied. A fluent audience listening/understanding review follows
the eventual recorded performance; text review cannot establish spoken timing or delivery.

## Execution and verification — 2026-09-17

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

Next: maker reads the Chinese text on the existing series URL. Wait for the voice ID and
production request before synthesis; then align actual Mandarin speech to semantic story
positions rather than raw English seconds. Preserve the completed English performances.

## Tried and rejected

- Matching languages by elapsed seconds: translations have different durations. Retain shared
  story identities now; actual Mandarin phrase timing belongs to later audio production.
- Creating a Chinese route or remounting the player on toggle: loses continuity and conflicts
  with the maker's explicit same-page/same-link requirement.
- Generating a placeholder Mandarin voice: specifically disallowed by the current request.
- Re-running clock effects when language changes: their cleanup pauses narration. Keep the
  transport effects independent of locale and update only displayed content/geometry.
- English character-count pill sizing and the old hidden-header fallback: translated glyphs
  and the taller phone toggle header require measured widths and correct reading geometry.
