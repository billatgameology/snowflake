# Episode 1 — conversational production and review

**Date:** 2026-09-17. **Status:** implementation and bounded review/edit loop complete;
fresh audience acceptance remains open.

## Authority and scope

The maker approved the conversational revision, requested its website implementation and
complete narration with ElevenLabs voice `aMSt68OGf4xUZAnLpTU8`, then a visual/audio/content
self-review. Plan-before-production commit: `1d3aed3`. Website baseline:
`explore/film-part1@2ecebe2d7cd97fee7a35af683e420bd3525e67d6` in
`/Users/clipper/github/snowcrystal_website-film-part1`.
Completed website commit: `1fd50e6cde5e49e7d553c60126ce45b2e8b31201`.

The performed source is now
[the conversational comprehension revision](../video/science-series-e01-comprehension-draft.md),
SHA-256 `af6dd3f386a14af9d66bf529aa3772aa9f9a96b768ba6e4bd2da82b579a0fb3a`.
Its eleven sections contain 2,465 spoken words, independently checked against all retained
requests and character alignments. The previous performed script, imported content, takes
and master are preserved. This changes E01, not E02, the original film, the model or a
scientific gate. Nothing was pushed or published.

The Sites skill kept the existing React/canvas architecture, local preview and recorded
Run B visual; it did not scaffold or replace the website. Root owned edits and browser
inspection. Shared-context read-only agents separately reviewed sources/depictions,
story/guide compliance, and audio bytes/timing. Exact model IDs were not independently
recorded, and these reviews were not blind.

## What changed

- The opening makes a shrinking selected drop the question immediately. Cloud/gas identity,
  first ice and the magnified busy surface retain the maker-praised visual language.
- Equilibrium is demonstrated as two continuing changes balancing before the name is used.
  The two-neighbour comparison has separate, equal-gas-space boxes, then shared air, with
  wavy liquid, flat ice and visible input/result changes. Pressure figures and humidity
  arithmetic no longer interrupt that explanation.
- The water's route gets its payoff before the new pressure lesson. That lesson shows
  wall impacts, distinguishes water from other gases, adds water at fixed box size and
  temperature, then returns to the known ice balance.
- Percentages first use explicitly invented counters. The subsequent scientific reference
  comparison uses equal volumes and a constant water amount per dot. The ice reference,
  extra subset and separated extra piles are identified in that order.
- Five optional reader disclosures retain the quantitative pressure/humidity example,
  source temperatures, calculated excess amounts, caveats and growth-history detail.
  They are not added to the narration burden.
- Audio owns the scene clock, paragraph following and reversible cues. There are no new
  paid requests for the old film or E02.

## Review findings and edits

| Finding | Repair and verification |
| --- | --- |
| Two source sentences confused arriving with joining the solid/surface. | Before synthesis, changed them to water that **joins** versus leaves. Subsequent source/request/alignment checks agree. |
| Raw scene 6 delivery was faster than its conceptual neighbours. | Pitch-preserving 0.90× processing of that retained take, paragraph pauses and explicit prediction holds. The paced audit measures 160.25 words/minute including its paragraph pauses. No resynthesis or new charge for this repair. |
| Shared-air vapour reduction changed labels/rates but not the background gas. | Both panels now reduce the same illustrative gas population from 24 to 21; the values are staging, not physical measurements. Independent cue closeout confirms it. |
| At the ice-reference sentence, rings selected the surplus instead. | Separate reference and extra cue states. First ring the reference; select surplus only after it is named, then pull it aside. Checked in code, regression assertions and desktop/narrow views. |
| Rounded counted dots sat next to precise source-table percentages. | Use larger/smaller percentage labels in the diagram; retain the precise source values and provenance in the optional reader. Do not imply six plus three dots calculates 47.4%. |
| Prediction staging did not consistently match the question. | Scene 5 visibly adds vapour before the answer and labels the held face as a prediction pose. Scene 6 hides result wording until the answer. Background traffic continues. New assertions pin input change, held geometry and absence of the answer label. |
| Small-screen counters and their captions were crowded; advancing ice crowded its gas region. | Shortened the counter grid, separated the labels, reserved gas headroom and re-inspected at 390×844. |
| Reader references exposed production language or pointed at the wrong scene. | Reader disclosures now link their corresponding chapter sources; the calculation paragraph points to Chapter 4's “Percentages are not grams.” |

Source/depiction closeout found no remaining actionable contradiction in its bounded
inspection. This is not a new scientific validation result.

## Visual and runtime review

Root inspected the browser at its desktop viewport (1280×720) and a temporary 390×844
viewport, subsequently reset. Inspection used the actual player, source-bound audio,
seek control, manual scrolling and Still mode—not screenshots rendered by a separate
implementation. Representative observations:

| Sections | Observed |
| --- | --- |
| 1–2 | A stationary selected donor shrinks against its dashed prior outline; the recorded crystal grows and white vapour crosses the gap. The active precipitation cell brightens while unrelated cells dim. |
| 3 | Recognizable mixed cloud; explicit liquid, white water-vapour and grey other-gas labels; magnified air gap; a rising/cooling parcel develops droplets. No premature crystal in the gas-gap explanation. |
| 4–5 | A labelled irregular speck remains distinct from hatched first ice inside the circular lens. The frozen seed carries into the sealed-box/surface zoom. Joining/leaving arrows and fixed-base solid make loss/balance/gain legible. |
| 6 | Separate boxes display different balance amounts. Shared air produces different surface changes; liquid stays wavy. The question holds its result until the answer. |
| 7 | A selected handover connects drop, gas and ice; local return traffic remains. The surrounding-air view has wandering, tailed routes to multiple points on the ice edge. |
| 8 | Wall-attached impacts accompany moving gas. Other gases dim when water is selected; the pressure indicator accompanies added water. The known ice interface returns for balance and surplus. |
| 9 | Counter amounts are countable and separately labelled as invented. The reference is highlighted before the extra, with separated extra piles remaining white vapour. Equal-volume and equilibrium/cold-liquid caveats remain adjacent. |
| 10–11 | Freezing and evaporating donors leave ice and vapour behind. The grown model persists into the three shape questions rather than restarting from a new seed. |

Bounded normal-1× playback included opening growth and the first grid focus, cloud
formation, the seed-to-surface transition, balance/prediction/result, shared-air comparison,
pressure impacts/selection/balance, reference-to-extra extraction and later-scene transitions.
These were sampled intervals, not an uninterrupted frame-by-frame viewing of every second.
Forward/reverse seeking reproduced the ideas. Upward wheel input paused audio and switched
to manual mode; downward scrolling changed the visual position; Play resumed from the new
reading position. Still retained the current idea as a completed sentence pose. Narrow-screen
DOM inspection reported no horizontal overflow. The earlier bounded playback error query
returned an empty list. Documentation-triggered hot reload later produced the previously
known Hero1 `GPUCanvasContext` not-configured errors at 14:24:26 UTC. After a fresh reload,
the new E01 master and model played correctly; the error query bounded after
2026-09-17T14:29:03Z returned no new errors. The retained home GPU hot-reload/device lifecycle
issue and existing Three.js deprecation warnings are **not** claimed fixed. This limits the
runtime claim; it is not hidden behind a global “console clean” statement.

The full master reached its natural end at 945.981723 s with `ended: true`, paused media
and a 15:45/15:45 control display. Optional pressure and percentage disclosures opened with
their full text and chapter links. Continuing to E02 left E01 audio paused and started the
unchanged silent rehearsal. Returning home settled at scroll position zero with no speech;
the E01 home button then restarted the new narration during the continuous descent.

## Audio and matching checks

Voice lookup first failed because the ID was not a saved voice. The exact ID was found in
ElevenLabs' shared library as **Juniper — Grounded and Professional**, added to the library
and used for all eleven takes. No fallback voice or impersonation claim is used. The page
labels the narration AI-generated.

Website records are under `docs/series-narration/2026-09-17-conversational/`; generated audio
is under the corresponding `public/series/narration/` revision directory. `report.json`
preserves raw takes/master; `paced-report.json` describes the live master:

- Source-bound text and all 252 caption texts agree.
- Master: `e01-complete-paced.mp3`, SHA-256
  `d64a3c6ebc366aec7a8cdce2e827473a1ba4d6e86006e47a7f050a563c80a53f`.
- Independent decode: 41,717,794 samples at 44,100 Hz; **945.981723356 s** (displayed 15:45).
- `paced-audit.json` independently checks 62 contiguous source segments, 51 paragraph
  pauses (including three long prediction holds), ten section joins and silent pause interiors.
  Stored paragraph boundaries differ from independently accumulated PCM by at most 1.37 µs.
- Final signal measurement: −25.2 LUFS integrated, −2.6 dBFS true peak, 4.1 LU range.
  No clipping indication. No arbitrary normalization target was imposed.
- An independent local, cached Whisper base transcription of the **raw** complete master
  recovered the story with no missing sentence or paragraph. `asr-comparison.json` retains
  differences, including uncertain proper-name/technical-word renderings. This was not
  provider-text round-tripping or a claim that ASR spelling proves pronunciation.

**Listening/timing limits:** this is signal, transcription, source-alignment and bounded
browser synchronization review, not a claim of human auditory listening or approval of
performance/prosody. The paced derivative was not re-transcribed. Scene 6 word times use
nominal-rate interpolation within independently measured paragraph segments, not new forced
alignment; the measured segment-duration discrepancy (maximum 20.6 ms) is not a bound on
every spoken-word timestamp. Browser state confirmed that the new paced file, not the old
voice, owns playback. A human listen should check Libbrecht, graupel and the overall delivery.

## Checks and reproduction

Website focused command:

```sh
node --test --test-reporter=tap scripts/series.test.mjs scripts/series-audio.test.mjs scripts/series-continuous.test.mjs scripts/episode-two.test.mjs
npx tsc -b
node /Users/clipper/.codex/plugins/cache/openai-bundled/sites/0.1.70/scripts/build-site.mjs
```

`docs/episode-one-conversational-tests.tap`: **52 passes, zero failures**. TypeScript and
the Sites production build pass (`docs/episode-one-conversational-build.txt`), including a
fresh build after the layout repairs; the existing
large-chunk advisory remains. Authority prose uses
`npm run lint:rule7` and `git diff --check`, not a scientific suite. Audio records include
`signal-source-audit.json`, `paced-audit.json`, `asr-comparison.json`, and `loudness.json`.
Do not rerun the paid generator or overwrite its immutable output for verification.

Pinned tests retain the old source/import snapshot, old narration snapshot, every prior
take and old master. A path-scoped diff against the website baseline is empty for original
film/home/E02 and existing growth assets. Shared CSS changes are scoped to the optional reader.

## Remaining acceptance questions

No content/depiction defect requiring another take was found. Technical completion does
not establish that a first-time adult understands the film. Ask a fresh viewer, without
coaching: What does balance mean if molecules keep moving? Why can the same air shrink a
drop and grow ice? What contributes water-vapour pressure? What does the percentage compare
against? Scenes 8–9 remain the most vocabulary/comparison-heavy portion even after revision.
Use that teach-back and a human listening pass to guide any next revision, not a new
compression target. Physical mobile-device and prolonged GPU playback acceptance are open.
