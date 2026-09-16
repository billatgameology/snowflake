# Continuous series and full E01 narration — implementation review

## Scope and identity

Maker request: repair black crystal artifacts; preserve the accepted Run B-to-Hero1 opening;
continue downward into Episode 1 without navigation; auto-scroll with narration until user
scrolling takes over; make opening growth obvious; voice the entire unchanged episode using
supplied ElevenLabs voice `yUj9r3iC7zOlXqMJy2qy`.

Plan amendment: authority `e3b4456`, committed before implementation. Website implementation:
`explore/film-part1@fd4ee2f2c61004dab8629b5920372b418e3a4767` in
`/Users/clipper/github/snowcrystal_website-film-part1`. No push, merge or publication.
The source remains `docs/video/science-series-e01-script.md`, SHA-256
`24fc2cf16689c64b8eee3a73594c00f4e02c3d1a2aaf39ac0639171ef5df9901`.

## Result

- Both routes mount the home followed by the same persistent E01 article. The home button
  starts narration within the click gesture and descends smoothly without navigation. The
  direct episode URL lands at E01 without autoplay on load.
- Actual media time owns reversible illustrations and paragraph-anchored scrolling. Wheel,
  touch, navigation-key or scrollbar input pauses narration and yields to native manual
  reading without repositioning/remounting. Play resumes there; Pause retains exact time.
- The series-only shader repair ports the authority catalog's safe normals, wider shading
  stencil and refined far-surface crossings. Arrival bytes, field and isosurface are unchanged.
  Default legacy rendering retains its original arithmetic branch. Series camera-near
  clipping and redundant chromatic post-processing are also corrected.
- E01's early-to-late interval has fixed framing/orientation, making radius growth visible.
  The relay continues the recording and the ending holds the finished crystal. The accepted
  home camera choreography is retained.
- Full AI sample narration uses ten source-bound takes, generated once each, decoded to PCM
  and joined with breathing gaps. Non-secret requests, alignment, takes and master remain
  retained separately from the earlier voice sample. No uncertain request was retried.

## Audio and checks

Website `docs/series-narration/report.json` records 10 sections / 844.6750120000002 seconds;
`docs/series-verification.json` records 2,241 words and 13516007 master bytes. Master SHA-256:
`8d734b20709c0eda4081b28a7050a29b5fc40da969d7cd3b820b3a672c23214c`.
All takes/master passed complete FFmpeg `-v error -xerror` decoding with zero error stderr.
A read-only reviewer independently rechecked source text, every take hash/byte count,
alignment and complete master decode. Provider alignment is not an independent transcription
or human performance assessment. UI disclosure does not imply the real person's recording
or endorsement. Credentials are not in requests, browser code or committed records.

At the website commit above, `docs/series-tests.tap` records **52 passing focused tests**:

```text
node --test --test-reporter=tap --test-reporter-destination=docs/series-tests.tap scripts/series-continuous.test.mjs scripts/series-audio.test.mjs scripts/series.test.mjs scripts/film-timeline.test.mjs scripts/film-opening.test.mjs scripts/film-prepared.test.mjs scripts/film-export.test.mjs
npx tsc -b
node /Users/clipper/.codex/plugins/cache/openai-bundled/sites/0.1.70/scripts/build-site.mjs
git diff --check
```

TypeScript/build pass; Vite retains its large-chunk advisory. No scientific suite or gate
was appropriate. Old film source/public paths have an empty diff against
`a0163d360bbd252b2cb442465c3e7b23d6c5500c`; the existing MP4 remains 280575547 bytes
(website verification record). E01 source import and earlier sample assets are unchanged
against `d36ba9e`.

## Visual and interaction observations

Root inspected a matched paused crystal pose before/after the repair: the dark streaks
visible before were absent after. Additional seed, growing, relay and finished views were
inspected, along with the home growth/receding crystal and snowfall/title. This is bounded
visual observation, not an all-frame pixel or all-device guarantee.

Root observed: home CTA retaining `/series` while audio/scroll advance; one persistent
article and retained home; wheel-up/down and Page Up takeover with media paused; resume
from manual position; forward/reverse section seek; repeated keyboard range adjustments
retaining focus; direct entry; phone playback and endpoint. Desktop 1400×900 and phone-sized
390×844 views were checked. Nucleation, saturation values, final crystal and ending text fit
the phone layout without observed horizontal overflow. Viewport overrides are reset at handoff.

An earlier hot-reload interval emitted WebGPU context-not-configured errors. They stopped;
the final playback/takeover/return-to-snowfall check produced no newer errors. This does not
prove hot-reload or device-loss robustness. If reproduced on cold load, inspect Hero1's
asynchronous engine boot/dispose ownership before broadening renderer changes.

## Review/edit loop and limits

Shared-context `runtime_review` and `story_review` agents performed read-only code/artifact
reviews; root implemented fixes and ran the browser. These were not blind/different-model
reviews; exact model IDs were unavailable.

Repaired findings: legacy arithmetic reassociation; paused scrollbar takeover; CSS highlight
precedence; entry focus without stealing seek focus; visible phone errors; reader entrance
surviving rejected play and media errors; immediate gesture playback; spoken-end anchors
before source/heading gaps; direct-entry scroll restoration; generator reuse requiring the
same voice/endpoint. Sites preserved the custom Vite app and supplied the production-build
workflow; nothing was hosted.

Remaining acceptance: uninterrupted maker listening, pronunciation/performance and section
joins, real-phone/iOS/touch behavior, live hidden-tab check, broader GPU fallback/device-loss
testing and audience response. No new E01 MP4 was requested or made. Later episodes remain
separate work. Technical completion is not final editorial or narrator acceptance.
