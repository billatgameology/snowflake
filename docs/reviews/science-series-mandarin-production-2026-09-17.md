# E01/E02 Mandarin production and same-page switching review

## Scope and provenance

The maker supplied ElevenLabs voice `4AfodMgwXps9oZFhHzoj` after the Simplified Chinese text
pass, lifting its explicit audio deferral. The committed production amendment is authority
`60a6d2e`; source baselines are authority `4496d5d` and website `9fd4a37`. Root implemented the
website and performed bounded browser checks. Shared-context helpers authored exact bilingual
cue pairs, reviewed transport/semantic timing and independently audited audio bytes. These are
agent checks, not a fluent audience review or maker acceptance.

Website worktree: `/Users/clipper/github/snowcrystal_website-film-part1`, branch
`explore/film-part1@d434084`. This is additive: English scripts/masters, model assets, home transition,
the continuous reader and `/film/part-1` remain intact. No new episode, language route, push,
deployment or scientific gate was performed. The credential was used locally and never copied
to reports, public assets or Git.

## Delivered behavior

One top **English / 中文** control now selects text and the corresponding full narration for
both existing episodes. Both audio elements stay mounted. The selected media owns playback;
its aligned time maps to the retained English visual score by shared semantic phrases, not
equal seconds or an episode-wide duration ratio. A toggle pauses the old recording, invalidates
pending play, transfers the current concept, preserves speed and only resumes if already playing.
Paused/manual reading does not autoplay. A late metadata event applies the latest seek; errors
leave a retryable paused player. Selected-language duration and AI disclosure are visible.

The Mandarin source is the existing reviewed Chinese JSON, not a new rewrite. Each request binds
those actual JSON bytes plus the English reference identity. Original takes, timestamps,
requests without credentials, raw masters and separate paced masters are retained. No uncertain
paid request was retried. Optional reader material remains outside narration.

## Audio and source checks

Website `docs/series-narration/2026-09-17-e01-mandarin/paced-report-semantic-v2.json` and its E02
counterpart are the active production records; original `paced-report.json` files preserve the
first clock revision. Actual MP3 bytes did not change during clock refinement.

| Episode | Decoded Mandarin duration | Paced MP3 SHA-256 |
| --- | --- | --- |
| E01 | 1370.9654195011337 s | `8cd202aa33c24971a4f207cda17088628f1f65f204e7f340277a83a8b0725ac1` |
| E02 | 935.5412018140589 s | `41edc9ea3e802cd9750cb7fa89819be68c1ca65632f8745ca2d72737f326155f` |

These values were copied from the independently recomputed website
`docs/series-narration/mandarin-review/pace-integrity-audit.json`, not estimated from text.
The same directory retains the independent audit README, signal/alignment report, reproduction
scripts and bounded offline transcription. It verifies every raw take, exact requested source,
audio hashes, decoded format, finite complete character alignment, contiguous PCM composition,
inserted silence and the final sample counts. No omitted source paragraph or clipped/nonfinite
sample was found by those checks. The final MP3 is lossy; exact source-sample preservation is a
pre-encode claim, while final waveform order is independently checked by correlation.

One minor provenance discrepancy remains explicitly recorded: the unused unpaced E02 master
duration in its first report is short of actual decode by about 0.883 ms. The playing paced
master has exact sample-count timing. Do not silently rewrite the original report to conceal it.

Offline cached Whisper base transcribed E01 sections 6 and 9 without a reference prompt.
It broadly follows the source but makes many Chinese homophone and traditional-character
substitutions. Its character-match fraction is not a speech error rate. The audit README names
uncertain listening checkpoints, notably “比冰”, “却比液态水所需的少”, and the two temperatures.
These are not confirmed voice defects and did not trigger unnecessary resynthesis.

## Review and edit loop

- Runtime review caught a TypeScript constructor parameter property incompatible with the
  project's strip-only/erasable syntax and missing finite-duration guards. Both were repaired.
  Pending EN→ZH→EN resolve/reject permutations, manual interruption, late metadata and retry are
  now exercised in `scripts/series-bilingual-audio.test.mjs`.
- Initial semantic composition prioritized audio cuts over spoken onsets. Where Mandarin had
  no natural gap but English did, several E02 answers/reveals were late. The revised clock
  prioritizes actual speech onsets after scene boundaries. Audio and physical prediction pauses
  are unchanged. The visual predicate already holds until the spoken answer, so it retains the
  complete Mandarin thinking pause even when the English inserted-silence endpoint maps earlier.
- Coincident endpoints cannot both belong to a strictly invertible clock. Lower-priority cut/end
  anchors are therefore explicitly retained in `collapsed`, not silently discarded. Some reflect
  natural pause differences; one also reflects translated clause order in the tilted-ring scene.
  Within-phrase progress is interpolation, not independently measured bilingual phonetic time.
- The live pass caught an obsolete “English AI narration” Chinese status label; it now correctly
  identifies Mandarin. Native, desktop and phone-sized views retained the same top toggle and
  usable reader/playback controls.

The retained independent `docs/series-narration/mandarin-review/semantic-score-review.json`
and its checker rederive the final mappings from digest-pinned source/char-alignment inputs:
all 40 E02 production cue occurrences, its four prediction holds, and nine targeted E01 onsets
in sections 6/9 pass. The four holds were sampled through their interiors using the actual
`structureCue` implementation, with release checked at the spoken answer. No spoken onset was
dropped. This is source/clock verification, not listening acceptance.

## Reproduction and observed coverage

From the website worktree:

```sh
node --test scripts/series-bilingual-audio.test.mjs scripts/series.test.mjs scripts/series-continuous.test.mjs scripts/series-reading.test.mjs scripts/series-localization.test.mjs scripts/series-audio.test.mjs scripts/episode-two.test.mjs scripts/episode-two-audio.test.mjs
node /Users/clipper/.codex/plugins/cache/openai-bundled/sites/0.1.70/scripts/build-site.mjs
```

`docs/series-mandarin-tests.txt` records **76 passes, zero failures**. Tests cover both complete
source/audio bindings, reversible monotonic clocks, preserved English hashes, actual Mandarin
prediction-answer timing, held visuals throughout inserted pauses, transport races and existing
episode/localization boundaries. `docs/series-mandarin-build.json` records TypeScript and
production build exit 0; the existing large-chunk advisory remains. Product-sized checks only.
Authority `node scripts/lint-rule7.mjs --file` on the changed plan, review, guide, progress and
cue assets passes; `git diff --check` passes in both repositories.

`docs/series-mandarin-browser-checks.json` records observed E01/E02 playing and paused toggles,
same-URL/scene retention, selected-language media durations, rapid switches at retained speed,
manual-scroll interruption, and switches inside prediction pauses. Screenshots were actually
viewed at native, desktop and phone-sized layouts. The final semantic-v2 score was cold reloaded
and checked while switching inside E02's diffraction hold, followed by the narrated correction.
The detailed artifact distinguishes earlier checks from the post-refinement sample; a development
hot-reload interruption was discarded and repeated. No full performance or all-device claim.

## Next review

Open the existing `/series/episode-1` or `/series/episode-2`, select **中文**, and listen. The
preview was left at E01's beginning in Mandarin with audio paused. A fluent human listen for
pronunciation, pacing and natural delivery, and an uncoached general-adult comprehension check,
remain separate acceptance tasks. Machine text identity and a functioning toggle do not prove
either. For future authorized spoken rewrites, refresh affected takes in the already approved
language voices and rebuild semantic mappings; preserve prior audio and the same-page contract.
