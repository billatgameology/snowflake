# Episode 1 — clearer comparisons and forward reading

Maker-directed revision, 2026-09-17. Authority plan amendment committed before implementation
at `d70ed55`; website `9fd4a37` implements the revision from starting point `e37bf80` on
`explore/film-part1`. This is a product/editorial
review, not a scientific validation gate or new audience acceptance.

## What the feedback meant, and what changed

- **Reading reverses between paragraphs:** a real timing-ownership bug, not a preference for
  another easing curve. A caption could begin microscopically before the next paragraph's
  rounded start, so timestamp-based membership assigned it to the preceding paragraph. That
  put the preceding paragraph's bottom after the following paragraph's top. Captions now belong
  to paragraphs by exact sequential source text. Forward anchors are validated; conflicting
  duplicate-time positions fail. The unscheduled final scroll offset is removed from E01/E02.
  The audio remains the sole playback clock; manual scroll still takes over.
- **Introduce Kenneth Libbrecht:** the first mention now explains his relevant work at Caltech,
  growing and studying ice crystals under controlled conditions to understand snowflake formation.
  Checked against his [faculty profile](https://www.pma.caltech.edu/people/kenneth-g-libbrecht)
  and [research page](https://www.its.caltech.edu/~atomic/). The approximate droplet budget is
  introduced afterwards, with the crystal still visibly growing.
- **Section 6 talks too long before the image changes:** carry balanced ice forward, introduce
  its liquid neighbour, and immediately show liquid loss. Add vapour to stop that loss; give
  ice the same higher amount; let the viewer predict before growth appears. Then join the
  air regions and reduce vapour into the gap. Wavy liquid, fixed before-lines, two-way exchange
  and labelled external vapour controls remain visible. These are controlled schematic trials,
  not conserved closed-box simulations or measured exchange rates.
- **Section 9 starts with unexplained numbers and loses the viewer:** the entire narration is
  rewritten around one physical question: how much vapour is above the ice-balance reference?
  Start with that reference, add enough to balance liquid, then separate the extra. Introduce
  the second temperature only when comparing equal-volume samples with equal water per dot.
  The invented counter detour and main-scene percentage arithmetic are removed; exact source
  values, percentages, formulas and qualifications remain in the unchanged optional reader.
  The result is scoped to the illustrated −15/−40 °C pair, not a monotonic temperature law,
  lifetime cloud-water budget or growth-speed prediction. The −40 °C reference never promises
  liquid droplets there. End by returning to replenishment through the air.
- **Future rewrites must refresh audio:** recorded as standing maker direction in the canonical
  [design guide](../video/science-series-design-guide.md#narration-and-timing-contract).
  Affected English takes use the current Juniper voice; unchanged takes can be retained with
  exact provenance. Visual-only and optional-reader-only edits need no synthesis. Chinese text
  follows the meaning; Mandarin recording still requires its separately deferred voice choice.

## Review/edit loop

Independent story and science reviewers checked the exact revised English and Chinese. The
science review retained external vapour control, equal-volume comparison, ice-reference-first
sequencing and the cold-sample caveat. No material factual or translation-equivalence blocker
remained before synthesis. English source identity is
`8e15559ac3d9819b1ad6f52bf5c8772d78e4800d17abdc918b241d02b6dc313f`.

The runtime reviewer reproduced the original paragraph ownership defect and checked the new
source-based assignment, end continuity and paid-request safeguards. Live visual inspection
prompted a second pass: change “vapour added” to “vapour reduced” after removal, label reference
versus extra explicitly, move the extracted piles into their comparison positions, and return
to a replenishment picture during the final qualification. Cue tests guard against showing
growth before the prediction or revealing a number before its introduction.

## Recorded checks

Website records are in `/Users/clipper/github/snowcrystal_website-film-part1`:

- `docs/series-e01-clearer-tests.txt`: **68 passes, zero failures** from
  `node --test scripts/series.test.mjs scripts/series-continuous.test.mjs
  scripts/series-reading.test.mjs scripts/series-localization.test.mjs
  scripts/series-audio.test.mjs scripts/episode-two.test.mjs scripts/episode-two-audio.test.mjs`.
  Coverage includes real narration ownership, forward anchors on unequal layouts, final
  continuity, cue ordering, finite/reversible drawings, translation parity and E02 preservation.
- `docs/series-e01-clearer-build.txt`: Sites build wrapper runs TypeScript and Vite production
  build. Only the existing bundle-size advisory remains.
- `docs/series-e01-clearer-browser-checks.json`: sampled normal-speed playback and screenshots
  at the recorded desktop, narrow and native preview sizes; same-position active language
  switch, manual takeover and final paused-at-start state. These are sampled checks, not a
  full episode screening. Earlier temporary HMR cue errors were superseded by a cold reload.
- Authority prose: `node scripts/lint-rule7.mjs --file` against the changed source, Chinese,
  diagram dictionary, guide, plan, progress and this review; `git diff --check` in both worktrees.
  No scientific gate or root-wide scientific suite was needed or run for this presentation work.

## English audio

New immutable revision: `2026-09-17-e01-clearer`. Exactly the changed E01-01, E01-06 and E01-09
takes were synthesized; the other takes/alignment bytes remain identical to the previous cut.
Original takes and masters are retained. Requests preserve voice/model/settings, source text,
and original neighbour context when a take is reused. Incomplete paid-request markers block
automatic retries. No Mandarin request was made.

The website's `docs/series-narration/2026-09-17-e01-clearer/paced-report.json` records
**956.3235169999996 seconds**, SHA-256
`d69db9caac009f1e73b8b64d6126950732ba3ec3437bc3b655c9e17b8105cb6e`.
The copied independent `signal-source-pacing-audit.json` verifies source/hash/alignment,
decoding, all source-sample ranges and paced waveform segments; no failures. Its companion
`asr-comparison.json` used already-cached offline Whisper on the changed takes without a
reference prompt and indicated no missing sentence. The audit README records exact commands,
values and limitations; local reproduction scripts remain in
`out/e01-clearer-audio-review/` in the authority repository.

**Remaining listening limits:** no human/prosody acceptance is claimed. ASR spelled Libbrecht
differently and heard “both services” for “both surfaces” in the raw scene-9 take around
51.4–53.64 seconds; those are targeted listening checks, not established synthesis defects.
Pacing uses nominal tempo-mapped provider alignment, not a new acoustic forced alignment.
The general-adult teach-back remains open: what is the reference, what is extra, and what does
that comparison not tell us? The maker's current report is the reason for this repair, not
proof that the repair has now resolved comprehension.

## Next action

Watch `http://127.0.0.1:5185/series/episode-1`, especially sections 6 and 9. A new reviewer should
read this record and the canonical guide before another rewrite. If spoken English changes,
refresh affected Juniper narration, preserve old assets and update Chinese text and all cues.
Do not start E03, replace the old film, publish, or generate Mandarin from this task.
