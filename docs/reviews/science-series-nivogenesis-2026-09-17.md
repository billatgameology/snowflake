# Nivogenesis opening — implementation and bounded review

Maker request: add three E02 recordings, remove the top original-film link, use the name
Nivogenesis and create the suggested quiet opening sound. Plan was committed as `2c92490`
before implementation. Website implementation: `explore/film-part1@1f0fbd5` in the retained
`snowcrystal_website-film-part1` checkout, following baseline `64ce9c6`.

## Delivered

- The series home/page title and episode brand now say Nivogenesis, with “The birth of snow”.
  The EN/中文 control, stored language choice and routes remain unchanged. Standalone instrument
  branding, historical media filenames and original film content are not renamed or removed.
- The initial recorded collection adds hollow column, capped column and sectored plate from
  E02 to plate/column and the incoming Run B. The same catalogued volume renderer supplies
  preview, enlargement, rotation and zoom. Later falling replacements still cycle the catalog.
  Low tiers decimate the added volumes; the demand-driven/one-inspector/offscreen bounds remain.
- A reproducible original stereo composition uses synthesized air and sparse crystalline tones.
  No source samples, paid generation, new dependencies or new narration. “Play with sound” is
  explicit opt-in and replays the opening; ordinary visits stay silent. The atmosphere stops
  before episode narration. It is composed atmosphere, not scientific sonification.

## Review, defects and repairs

A non-author agent audited catalog identity and rendering costs before implementation, then
reviewed the actual audio/visual lifecycle. It found two cancellation/readiness defects and a
fallback clock defect: Skip could be undone by a pending play promise; muting did not stop
the file finishing during slow asset loading; and a fixed fallback time could cause repeated
seeking. The implementation now invalidates pending play, holds authorized media paused until
the visual is ready, and uses free-running audio for non-animated fallbacks. Focused tests cover
these boundaries, including cancellation of a pending authorized resume.

Root's browser inspection found blank small markers after display-density changes and missing
snowfall after replay. The reviewer reproduced the actual GPU factory's stale-boot race with
deferred mock adapters: an obsolete boot configured the live canvas, then unconfigured it in
cleanup. Cancellation now occurs inside the factory before canvas access; canceled devices
are destroyed. Exact rendering also invalidates after DPR changes, not only CSS dimensions.
The final browser replay and phone-size resize retained their imagery. No shader, particle
style, solver, scientific readout, source claim or validation gate was changed.

## Verification and limits

Exact commands/results live in website `docs/series-nivogenesis-verification.json`, not a
scientific evidence bundle. Its named focused selection reports **67 passes, zero failures**;
the Sites portable build runs `tsc -b && vite build` successfully. The existing large-chunk
warning remains. `git diff --check` passed; authority prose also passed `npm run lint:rule7`.
No full scientific test/gate was needed or run.

The retained WAV is **20 seconds**, **3840044 bytes**, SHA-256
`237f432b6335363f090dd63195cae10c5e79fed36772129f05820b5384795f2b`, copied at write time from
that verification artifact and its linked audio manifest. Recipe `--verify` reproduced it
byte-for-byte; ffmpeg decoded the complete file successfully. The manifest measures a peak of
**−17.00113169360012 dBFS** and RMS **−31.499994546587068 dBFS**, with zero endpoints.
These figures do not establish perceived loudness, device comfort or musical quality.

Root visually inspected all three new models enlarged, keyboard rotation/zoom on the hollow
column, phone-width sectored-plate inspection/zoom, the title and controls, growth/replay,
the snowfall handover and the final resize/replay repairs. Browser media observations confirmed
cold-visit silence, explicit playback, natural end without looping, Still cancellation and
episode entry switching from opening sound to the existing English narration. The final
cold-load window after `2026-09-18T05:30:00Z` contained no captured console errors; earlier
hot-reload errors were not silently relabelled as final runtime failures. Three.Clock
deprecation warnings remain. Temporary viewport override was restored.

This was sampled visual inspection and mechanical audio verification, **not a human audition**,
full episode rewatch, audience-comprehension test or long mobile GPU/memory benchmark. A
delegated asset author also independently decoded/reproduced the WAV; it did not claim listening.
The canonical design guide records the reusable sound/collection and lifecycle lessons.

Next: maker playback at `http://127.0.0.1:5185/series`, using **Play with sound**, then inspect
the added crystals. Existing bilingual narration, original film and previous MP4 remain
preserved. No new export or deployment was requested or performed.
