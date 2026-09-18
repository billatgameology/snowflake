# Review — series home, continuous entry and E01 MP4

## Delivered scope

The opening's series-only growth rate doubles from 1.25 to 2.5. Completed-crystal hold,
zoom/handover and snowfall speed are preserved. A fixed-frame compositor records the actual
home, Hero1 WebGL2 snowfall, title, downward entry and all of E01 with current Mandarin audio
and Simplified Chinese. Website implementation commits: `ff2ccc2`, `98f0b7c` in
`/Users/clipper/github/snowcrystal_website-film-part1`.

No narration words, MP3 source files, old film, E02 content, solver or scientific gate changed.
The path-scoped diff against website baseline `d434084` confirms the content/audio preservation.
This is a presentation export, not scientific evidence or a fresh science/content review.

## Artifact and checks

Website `docs/series-export-final.json` is the compact receipt; its source report is
`export/series-e01-zh-2026-09-17-fast-v2/report.json`. Values read from that artifact at write time:

- Output: `Cryosphere-home-and-episode-1-mandarin.mp4` in the same export directory.
- 1920×1080, 30 fps, H.264/BT.709 plus AAC Mandarin; 1,391.8666666666666 seconds, 41,756 frames.
- 338,183,144 bytes; SHA-256 `a1f8a16c351df5b66db3985df968a521f9d6c5cf03f535cfaff2432ae5f106f6`.
- Full decode passed; all video packet presentation timestamps and exact rational video duration
  checked, complete section coverage, unchanged frozen build, no recorded runtime errors.
- Existing source MP3 SHA-256 `8cd202aa33c24971a4f207cda17088628f1f65f204e7f340277a83a8b0725ac1`.

The focused command/build record is website `docs/series-export-checks.json`: 54 focused tests
passed; TypeScript/Sites build passed. The exporter-only repair additionally ran
`node --test scripts/series-export.test.mjs scripts/film-export.test.mjs` (six passed), syntax
checks on both CLI scripts, and the live rendered equivalence probes. No unrelated scientific
suite or gate was launched. Authority prose uses `npm run lint:rule7` and `git diff --check`.

## Independent review and repairs

Read-only runtime review caught context-loss handling, concurrent capture seeks and a decimal
duration equality that would reject the repeating frame duration; these were repaired before
the completed run. Slow PNG encoding led to a bounded lossless benchmark. The first fast attempt
then failed worker equivalence, exposing missing compositor publication synchronization.
Fonts, two paint frames and explicit layout/viewport capture repaired that failure. Saved PNGs
independently decode to identical RGB across both workers and the ordinary capture path at the
two probe times. Never replace this check with the paused benchmark alone.

The earlier run's completed chunks were imported only after manifest/material-recipe, file hash,
receipt and decoded frame-count checks; partial chunks were not imported. Original directories
remain intact. The final receipt records every imported chunk's provenance.

`out/series-export-review/full-receipt-audit.json` independently checked all 47 completed chunks,
46 joins and 1,439 saved acknowledgements. Mandarin semantic time/section/progress agreed within
floating-point rounding; no recorded reader reversal or discontinuity was found. This audit did
not independently inspect the final assembled MP4; the exporter and root's decoded image review did.

`out/series-export-review/full-audio-audit.json` independently decoded both complete audio streams
and searched fourteen waveform windows (including every scene start, beginning, middle and end).
All peaked at 789,390 samples, exactly 17.9 seconds, with zero offset error. Lowest correlation
at that offset: 0.9999297506512722. Leading/trailing silence checks passed, allowing measured AAC
pre-ringing rather than asserting exact leading digital zero. Reproduce with
`python3 out/series-export-review/audit-full-audio.py`. This is sampled alignment, not proof of
every unsampled interval, pronunciation, or human listening acceptance.

## Visual inspection and limitations

Root inspected the final file's eighteen automatically decoded stills under its `stills/`
directory, plus `comparison-reveal-1180.png`. They cover growth, handover, snowfall/title,
descent, all eleven scenes and ending. Model/diagram layers, Chinese labels and highlighted
reader paragraphs are present and readable in these samples. The initially empty colder box at
the scene-nine introduction is populated in the later reveal, not a missing layer.

This is the scrolling website rendered into video. Home/E01 introductory call-to-action text,
source labels and the closed further-reading area remain visible where they belong in that
layout; navigation/transport chrome is hidden. It is not a newly designed film-only edit.
The movie is fixed Mandarin/Simplified Chinese; bilingual switching remains interactive on the
website. There was no uninterrupted full-movie watching or human-listening/comprehension test.

Next: maker watches the retained MP4. For a requested revision, preserve this output and use a
new export directory; start with website `docs/series-export.md`. Do not resynthesize unchanged
audio, automatically start E03, publish, or run scientific gates.
