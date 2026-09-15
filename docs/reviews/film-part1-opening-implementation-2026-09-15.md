# Part 1 opening chapter — implementation and visual check

## Outcome and boundary

The prepared opening is implemented in website `explore/film-part1` at
`a1c7ed32d8acb8e468885405f31a34dab874fe15`. It is the default local
`/film/part-1` edition; `/film/part-1/prototype` retains the earlier comparison study.
Both have independent static reading pages, media timelines, score identities and model stills.
Nothing was pushed, merged, hosted or uploaded. The original website checkout was not edited.

The [opening score](../video/part1-opening-score.json), imported from `aea24c1`, contains
the reviewed S00/S01/S02/S05 rows: 520 seconds, 20 rows, 956 spoken words and 56 provisional
captions. These values are re-derived in the [verification receipt](../video/part1-opening-verification.json).
The unchanged full production draft remains inactive. This is a prepared opening with timing
tones, not recorded narration, the complete film, or final maker visual acceptance.

## What changed

- Compiled a separate opening artifact from the reviewed script with script/review/source hashes.
  The compiler retains every narration word and source binding; sentence-aware captions avoid
  dangling fragments. Timing is proportional and provisional, not aligned to a recorded voice.
- Preserved the cropped unfinished model preview and the return to the seed. No completed model
  silhouette is shown. Run B remains MODEL · UNVALIDATED; model cells are not molecules and
  the rendering's thickness styling is disclosed.
- Added original diagrams for scales, independent habits, the qualified shape map, an abstract
  experiment-to-map scene, deposition versus frozen drops, aggregation/rime, supercooling and
  the liquid–vapour–ice budget. Their state is a direct function of cue time.
- Kept the cold region qualified, the map under constant conditions, supersaturation relative
  to ice, the equilibrium comparison at one subzero temperature, and the large-crystal budget
  attributed and approximate. No scientific solver, readout, gate or chapter was changed.
- Added sequence jumps and a clear end-of-prepared-material message. Restart updates its status
  immediately and ignores an obsolete media-ended event after a newer seek.
- Kept phone figures image-only with descriptions and qualifications as reflowing text. Model
  fallback PNGs are generated from identified frames, not substituted stock images.

## Inspection and review provenance

The root implementation agent inspected the live desktop macro, seed cut, map, and relay-to-budget
playback, plus phone opening and supercooling views. This was sampled inspection, not a continuous
watch of the whole opening. The receipt records the live samples and viewport dimensions.

The non-author `science_review` agent inspected source and exported images in the same thread
context, without editing the website or controlling the browser. It found and rechecked these
repairs: a rectangular-looking column cap became hexagonal; freezing uses a compact frozen-drop
symbol before subsequent faceted growth; rime beads sit on the ice; the exhausted-liquid region
is labeled correctly; the cold-region label describes a revised historical map; and the budget
title no longer implies an entire cloud makes one crystal. It confirmed the final source hash
`ec871dc81f4ebeaca83049aa35219398f16119d9dbfb69ee00880e2c5895876b` and final frame hashes.
This is a bounded visual/source-scope check, not a fresh independent audit of the full narration.

The read-only `runtime_review` agent caught edition mixing in static model-image selection and
the missing fail-closed page/score identity check in export. Both were repaired and covered by
executable checks. That agent did not run browser tests. The `story_review` agent authored the
bounded opening compiler/artifact outside the website; root reviewed, committed and imported it.

## Verification

The [receipt](../video/part1-opening-verification.json) copies the actual reports and command outputs:

- 13 focused tests, TypeScript/Vite production build, 8 opening browser checks and 18 retained
  prototype browser checks pass. The build retains its existing large-chunk warning.
- The opening export report has 31 sampled still entries, exact repeated/reverse/reload sample
  equality, and a decoded 6.000-second, 180-frame, 1920×1080/30 fps montage. Export wall time was
  19.56 seconds. These are sample measurements, not whole-film cost or real-time performance.
- All 19 source-file digests in the opening export match the committed implementation. The
  prototype's frame-only export regression also passes. A wrong-edition negative control is
  rejected before any frame or public still is written.
- Opening capture pins software rasterization for 2D SVG content while retaining the Metal
  WebGL model renderer. No screenshot tolerance was relaxed. That pixel claim does not extend
  to arbitrary devices, live browser GPU rasterization or other capture recipes.
- Static reading is checked separately from JavaScript playback. Phone and enlarged-text checks
  are browser emulation, not real-device or screen-reader certification.

Prose/source checks: `node scripts/build-part1-opening-score.mjs --check`,
`node scripts/build-part1-production-score.mjs --check`, `node scripts/lint-rule7.mjs`, and
`git diff --check`. Scientific `npm test` and gates were deliberately not run for this isolated
presentation scope.

## Failed approaches and remaining work

Balanced caption chunks stranded starts of later sentences. Sentence/clause-aware partitioning
fixed this without changing dialogue. The initial browser test also passed unrounded binary
floats to a hundredth-second range control; its user-input helper now honors that control's step.

Sparse SVG edge pixels differed on reload with default GPU rasterization. Retaining/replacing
markup, geometricPrecision, and SVG-image isolation did not alone fix this. The named 2D capture
recipe passed the unchanged exact comparator. Failed local reports remain under the distinct
`export/part1-opening-*-look` directories; they are not the accepted report.

Continue with S06 in `docs/video/part1-script.md`: the molecular structure of ice, then the
surface/transport explanation. The next production slice should be committed in the active
plan before new implementation, preserving the current prepared edition and preview. Fine
motion direction, final reader copy, maker table read, recorded narration, audio-aligned
captions, full-duration playback/export and release remain production work. The static diagram
language is a first produced pass, not a claim that the film has reached its final visual bar.
