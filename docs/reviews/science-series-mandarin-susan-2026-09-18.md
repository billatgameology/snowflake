# Chinese translation refinement and Susan-voice Mandarin review — 2026-09-18

## Scope and provenance

The maker supplied an independent DeepSeek rendering of the E01/E02 page text as a second reference,
asked for a closer and more natural Simplified Chinese version by editorial judgment, and then asked to
change the Mandarin narration to ElevenLabs voice `0H4ruoQ81Ei2FCwjW5j1`. The shared-voice search
identifies it as "Susan - Warm Narrator" (Mandarin, `cmn-CN`, professional narration); it was added to the
account library before synthesis and its non-secret metadata is retained as `voice-library.json` beside each
new revision. The bounded plan amendment is authority `210f492`; baselines were authority `8df2b44` and
website `d7eb937`. The implementation is website `explore/film-part1@e3bfbb4`.

This review was written by the implementing session (Claude Fable 5.1) with full shared context. It is not a
non-author review. Everything below distinguishes what was re-executed from what was judged by reading.

## Translation method and judgment

Both episodes were re-authored at bilingual phrase-anchor granularity: each paragraph is the exact
concatenation of its cue pairs, and a validator mirroring the pacing script's rules (ordered, unique,
complete anchors; prediction answers present) passed before any paid request. The DeepSeek text was used
as a second reading, not copied: its `水晶` for crystal, `利布布雷希特`, literal clause orders and dropped
qualifiers were rejected; its plainer sentence rhythm and several concrete phrasings were adopted.
Representative decisions:

- "balance" stays `平衡`; the named concept "equilibrium" is introduced once as `平衡态` (E01-05, E01-08),
  so the Chinese keeps the English distinction between the everyday word and the technical name.
- E01-11's final paragraph now translates the current English hook ("Next episode, we're going inside the
  ice…"), so the new E01 clock binds the current English import directly; the retained 2026-09-17 revision
  keeps its `english-variation.json` record as history.
- E02-04's prediction answer leads with `不能了。` before the qualification, so the reveal lands at the
  answer onset in Mandarin as it does in English; `answerZh` anchors were rewritten for all four E02 holds.
- A Chinese-only sentence in the old E02-06 (`沿着环数，正好有六个氧原子——这是一个六元环。`) with no English
  counterpart was removed; the ring is introduced as the English does.
- Every scientific qualifier was kept and re-read against the English runtime source: calculated
  comparisons versus observations, no promise of liquid at minus forty, model recordings versus natural
  specimens, explanatory drawings versus experimental photographs, one allowed hydrogen arrangement, no
  growth-speed prediction, and "the water was already gathered together" for the frozen-raindrop contrast.
  Numbers (a hundred thousand droplets, one to two hundredths of a millimetre, minus fifteen/forty,
  half a nanometre, two point three millimetres, five million repeats) are unchanged.

Optional reader text, UI strings and diagram labels were re-read and left unchanged; they read naturally
already and are unvoiced. Character counts of the narrated source: E01 4,863, E02 3,351
(website `docs/series-mandarin-susan-verification.json`).

## Audio production and independent checks

One take per section, `eleven_multilingual_v2`, the retained settings, no retry. All 19 requests
succeeded on the first attempt. Website `docs/series-narration/mandarin-review-2026-09-18-susan/README.md`
records the rerun of the retained integrity, pacing and semantic audits (parameterized by environment,
defaults unchanged) with these values copied from its artifacts:

| Episode | Paced Mandarin | Decoded samples | Paced MP3 SHA-256 | Anchors / holds | Dropped onsets |
|---|---:|---:|---|---|---:|
| E01 | 1360.3771201814059 s | 59,992,631 | `ba44db1195822940a042cdb677127728cba580fd2ff56355e6add347f6277d46` | 317 / 3 | 0 |
| E02 | 918.683514739229 s | 40,513,943 | `9cbcc8cc7fd26b0b7a919e7d98e02fedf4904e3dba189b18311e15cd2b1eecaf` | 236 / 4 | 0 |

All raw takes and masters decode with `-xerror` and no warnings; every pre-encode segment equals its raw
decode slice (minimum encoded-segment correlation 0.9999427804694537 and 0.9999572275861647); every
inserted-pause interior is exactly zero; the semantic review passes with all 40 E02 production onsets within
3.4e-13 s and the four holds releasing at the refined answers. The offline Whisper spot-check on E01-06 and
E01-09 matched 260/416 and 302/496 normalized characters, comparable to the 2026-09-17 baseline and with the
same homophone/traditional-character noise; these are not speech error rates.

**Level observation, not a verdict.** Measured with FFmpeg `astats`/`ebur128` on the paced masters:
Susan E01 −21.0 LUFS integrated (RMS −21.39 dBFS, peak −2.05 dBFS) and E02 −20.7 LUFS; the English masters
are −25.2 LUFS (E01) and −25.6 LUFS (E02); the retained Yun E01 master is −29.0 LUFS. The Mandarin side is
therefore about 4 LU louder than English across the toggle, where the previous voice was about 4 LU quieter.
No loudness target exists in the contract, and no gain change was made; a matched-loudness pacing step is a
one-line production decision if the maker wants it after listening.

## Runtime, tests and live checks

Website receipts: `docs/series-mandarin-susan-verification.json` (exact commands), `docs/series-mandarin-susan-tests.txt`
(**97 passes, zero failures** for the focused series/content/audio/continuity/localization/release/export set),
`tsc -b` and `npm run build` exit 0 with the existing large-chunk advisory. Two test defects were found and
fixed in the same commit: the prediction-release test read the superseded top-level E02 cue file instead of the
live score's semantic sources, and the variation-contract test assumed the live E01 clock always carries a
variation record; both now test the intended contract.

`docs/series-mandarin-susan-browser-checks.json` (`scripts/series-mandarin-live-check.mjs`, Playwright,
Chrome) records cold loads at 1280×900 and 390×844 with 中文 selected, the Mandarin element bound to the
Susan revision (1360.377 s) and the English element unchanged (957.439 s); Play starting Mandarin only;
switching to English mid-play pausing Mandarin at 9.1 s and continuing English at 9.7 s at the mapped story
position; switching back resuming Mandarin only; paused toggles in both directions leaving both elements
paused; no page errors; and `/series/episode-2` still withheld (Coming soon, no E02 media). Screenshots were
viewed for the desktop playing state and the phone intro.

One observation: at 390×844 the intro `播放本集 ↓` button sits partly under the fixed controls bar before any
scrolling, and a first scripted click on it did not start playback; the shared controls-bar Play works and was
used for the recorded phone run. This layout predates this change and was not modified.

## Not covered

No fluent-listener acceptance of pronunciation, pacing or warmth; no uncoached audience comprehension; no
complete uninterrupted viewing of either episode; no physical-phone interaction; no E02 live playback (the
release hold keeps it unmounted); no loudness normalization decision. Machine identity and a working toggle
do not establish any of these.

## Reproduction

From the website worktree:

```sh
node --test scripts/series-bilingual-audio.test.mjs scripts/series.test.mjs scripts/series-continuous.test.mjs scripts/series-reading.test.mjs scripts/series-localization.test.mjs scripts/series-audio.test.mjs scripts/episode-two.test.mjs scripts/episode-two-audio.test.mjs scripts/series-release.test.mjs scripts/series-opening-sound.test.mjs scripts/series-export.test.mjs
npx tsc -b && npm run build
node scripts/series-mandarin-live-check.mjs <output-dir>
```

The audit and ASR commands are in the website audit README named above. Authority checks:
`node scripts/lint-rule7.mjs --file <changed files>` and `git diff --check` in both repositories.
