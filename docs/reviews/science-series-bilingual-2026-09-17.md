# Review — same-page Simplified Chinese series text

Date: 2026-09-17. Scope: maker-requested translation now, Mandarin narration only after a
later voice ID. Plan-before-build: `bea8a41`; authority baseline `696dad8`, website baseline
`5fcd95a` in `/Users/clipper/github/snowcrystal_website-film-part1`.
Implementation commit: website `e37bf80`.

## Verdict

The text-only bilingual pass is implemented and ready for maker reading. Home, E01 and E02
share one **English / 中文** control without a language URL, page reload, or episode restart.
Chinese uses Simplified characters, a conversational explanatory voice, and the existing
section/paragraph identities. English audio remains the sole performance and is explicitly
identified in Chinese mode. This does not accept Mandarin speech, timing or audience comprehension.

## Sources and translation review

The Chinese authority assets are `docs/video/science-series-e01-zh-CN.json`,
`science-series-e02-zh-CN.json` and `science-series-diagrams-zh-CN.json`. Website copies are
byte-identical. Each episode pins its English import digest and original performed-source
identity. The unchanged English imports are:

- E01 `f9a07e5dcdd83fa11e05aa084da00ebd7edc2011e560e233e82772e9cc9d9d1b`.
- E02 `7cf10c9601dbf950a47f4f122b03c68f25224181a48e8c204159dfb3ee68c11b`.

`e01_story_review` drafted E01 and reviewed E02; `e01_science_review` drafted E02 and reviewed
E01. `e01_runtime_review` inventoried drawing labels and separately reviewed runtime changes.
Root read the translations and dictionary, resolved findings, integrated code and inspected
the browser. These are same-context agent reviews, not blind, different-model or human
reviews; exact subagent model identities were unavailable.

Review repairs included:

- Use **凇** for generic *rime*, not the narrower 雾凇. The Chinese
  [WMO Cloud Atlas](https://cloudatlas.wmo.int/zh-hans/rime.html) distinguishes the generic
  category from its subtypes. Preserve the frozen-droplet mechanism in plain language.
- Clarify that nearby vapour need not remain at the **same concentration** as more distant
  air; remove wording that could suggest a global conserved total.
- Keep calculation-record provenance and source qualifications, rather than silently move
  derived quantities into a chapter citation.
- Describe a side face advancing **perpendicular to its own surface**, not an ambiguous
  vertical motion. Explain the c-axis and preserve O/H as identified symbols.
- Transliterate Libbrecht in narration, replace production episode codes with readable
  episode references in optional reading, and retain model/illustration/nonphysical-time
  qualifications. Equilibrium remains a balance of ongoing changes, not still molecules.

No English performed-source, audio, caption alignment, crystal data, solver, physical claim
or route was changed. The older silent-status prose inside E02's hash-bound source remains a
known historical metadata issue; current runtime/plan state correctly identifies English narration.

## Runtime and layout review

The shared language context changes display strings only. Existing cue lookup phrases and
audio imports remain English. A switch captures the current story time, remeasures reader
anchors, then restores the corresponding scroll position. It does not remount the player or
change the narration source. Optional reading retains a visible DOM landmark and open details.

Review caught and repaired a single-scroll E01 takeover case: after an unanticipated scrollbar
movement, the next frame must adopt the new position rather than remember it as already handled.
It also caught Chinese E02 description/source-note overlap and the hidden mobile header's old
fallback height. Separate text lanes and a shared reading-line helper address these. Chinese
canvas pill widths now use measured glyph widths, not English character-count estimates.

Root's live observations are recorded in website `docs/series-localization-browser-checks.json`.
The desktop and phone-sized samples cover paused E01/E02 switches, playing E01 switches,
manual reading through Chinese–English–Chinese switches, optional-note continuity, persisted
preference and a home-to-E01 entry that keeps the same URL. Representative opening, water/ice,
percentage and molecular diagrams were visually inspected. The phone header and audio-language
disclosure were readable in these samples. No full-frame or whole-episode visual acceptance
is implied.

## Verification

Website `docs/series-localization-tests.txt` records **64 passes, zero failures** from:

```text
node --test scripts/series.test.mjs scripts/series-audio.test.mjs scripts/series-continuous.test.mjs scripts/episode-two.test.mjs scripts/episode-two-audio.test.mjs scripts/series-localization.test.mjs
```

The checks include source binding/paragraph parity, untranslated diagram strings at caption
boundaries, finite drawing commands, retained audio hashes, prediction timing, scroll mapping,
mobile header geometry, and no language-dependent transport effect. Static guards are not
presented as a substitute for the sampled browser observations.

The following production build passed, including TypeScript; Vite retained its existing
large-chunk advisory:

```text
node /Users/clipper/.codex/plugins/cache/openai-bundled/sites/0.1.70/scripts/build-site.mjs
```

No full scientific suite/gate was required or run for this isolated presentation change.
No synthesis, credential access, new dependency, export, deployment or push occurred.
Authority `npm run lint:rule7` and `git diff --check` in both repositories pass.

## Remaining limits and next action

- Maker/fluent-reader acceptance of the Chinese prose is still useful. No human review was
  substituted by agent review.
- No Mandarin voice, timing or listening QA exists. After the maker supplies a voice ID and
  requests production, align actual Mandarin speech to the shared semantic identities before
  implementing language-to-language audio transfer. Never map it by equal elapsed seconds.
- Native slider value-setting rejected the prediction-hold seek, so live switching within
  a prediction pause was not verified; focused timing tests cover the underlying guards.
- No uninterrupted listening, physical-phone/touch, forced graphics failure or OS preference
  switching pass. Screenshots were inspected in browser output, not retained as image files.
- Keep the original film and English sources/audio intact. The existing series URLs remain
  the user's entry points.
