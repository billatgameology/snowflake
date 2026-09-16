# Separate series home and Episode 1 — implementation review

Status: complete local pre-narration implementation, with review repairs applied. This is
not final narration, audience acceptance, an exported episode or a public release.

## Exact work and preservation

Website: `/Users/clipper/github/snowcrystal_website-film-part1`, branch `explore/film-part1`,
commit `8c336ff0dcd88e51d6bfc8308a57eda8782b34a4`.

- New home: `http://127.0.0.1:5185/series`.
- Complete first-episode reader/player: `http://127.0.0.1:5185/series/episode-1`.
- Preserved film: `http://127.0.0.1:5185/film/part-1`.

The website's `docs/series-verification.json` records the measured identities and counts;
`docs/series-tests.tap` records the focused test results. `docs/science-series.md` contains
the full implementation review, shot choices, actual browser observations and reproduction
commands. These committed product records are not scientific gate evidence.

The imported source is [the full E01 script](../video/science-series-e01-script.md) at
authority commit `c60d6b8`, SHA-256
`24fc2cf16689c64b8eee3a73594c00f4e02c3d1a2aaf39ac0639171ef5df9901`.
Copied from the website verification artifact at review time: **10 sections, 2,241 spoken
words, 1145.1363636363637 seconds of provisional rehearsal timing**. The reader exposes
the full text; shorter caption cards preserve every word. The timing is not a prescribed
episode length and is not the maker's recorded performance.

Against website baseline `a0163d360bbd252b2cb442465c3e7b23d6c5500c`, `src/film` and
`public/film` have no diff; the prepared score's byte hash is unchanged. The existing
`export/part1-full-final/part1-visual-film.mp4` remains present. It was not rerendered or
rehash-verified as a new export in this task. The old film was also opened and its model
loaded successfully in the browser. Original Run B Hero and Hero1 routes remain available.

## What was implemented

The home reuses Run B Hero's actual event volume, camera and material, with modestly faster
growth on the new route only. It hands the crystal into the **actual Hero1 field**, including
its original GPU/GL/CSS fallback architecture, density ramp and marker population. The
incoming marker follows the crystal during the last part of the zoom, then joins ordinary
fall/sway. The title and episode entry follow. Skip, Replay and Still remain available.

E01 opens with droplets supplying a growing crystal, distinguishes precipitation routes,
explains the cloud's liquid/gas phases and supercooling, follows two-way surface equilibrium,
works the two-surface pressure comparison, explains the relay and the limits of its supply,
then ends on the still-unanswered shape question. Source tables and the complete reader
retain the detail that the compressed film lacked. Other episode topics remain separate.

The shot selection uses Run B where continuity is useful, Hero1 for the requested weather,
new reversible explanatory diagrams, and the existing Chapter 4 calculation for the
absolute/relative comparison. Wider catalog and renderer discovery points were read; no
claim is made that all library animations were restored or newly inspected. Named prism and
habit sequences belong to the later shape investigations rather than serving as cloud-water
evidence here. The library remains available; this is not a new Run-B-only series rule.

## Review and edit loop

`science_review` read the complete relevant local Chapter 1/4 passages and the script,
correcting the incorporation and sealed-box qualifications before import. Its provenance,
calculations and limits are in the script. `runtime_review` independently inspected the
website changes without editing them or using the browser. Root performed the browser
inspection and implemented the repairs. All reviewers are OpenAI Codex agents with shared
session context; exact model IDs were unavailable. This was not blind/different-model review.

The loop fixed the early detached destination snowflake, visible model rectangle, reader
stacking failure, overlapping mobile/diagram text, unchanged ice amount despite gain/loss
labels, moving particles under Pause, paused-model resize loss, hidden-but-focusable snow
controls, WebGPU Still rendering before initialization, paused context-loss handling,
mobile scene selection, reading-position transfer, endpoint Replay and lingering replay title.

Actual browser checks covered each episode scene on desktop; representative phone reading,
quantitative and ending views; the short-screen reader; growth/handover/snowfall/title;
Still; section selection; source disclosure; end seek/restart; same-position Read; and
keyboard Page Down interruption. The home used WebGPU in the observed browser. A Still
screenshot remained byte-identical across separate captures. These are bounded observations,
not a claim of uninterrupted narrated playback, universal device compatibility or audience
engagement.

From `docs/series-tests.tap`: **35 focused tests passed, zero failed**. The checks cover
the new script/timeline/captions, deterministic diagram commands, held/released marker
continuity, and the existing film boundaries. TypeScript and the production build passed
through the Sites build command; Vite's large-chunk advisory remains. `git diff --check`
passed. No scientific suite or scientific gate was warranted or run for this isolated
presentation scope. No push, publishing, new paid generation or source cleanup occurred.

## Remaining production limits and next action

The maker's narration remains later. Before multiplying this treatment across the series,
review E01 as an uninterrupted editorial performance, read it aloud, and adjust shot/subtitle
timing to the actual speech. The implemented still control exercises reduced-motion logic,
but an OS preference-switch test and physical-phone test were not performed. Computer-use
scrolling did not generate the intended wheel event on the fixed player; keyboard interruption
was verified, while physical trackpad/touch interruption remains to be checked. GPU context
loss handling was source-reviewed, not forcibly induced. No new E01 MP4 was exported.

The next concrete viewing action is to open `/series/episode-1`, use **Play**, inspect the
whole draft, then exercise **Read** and a real trackpad/touch interruption. Record specific
content/visual changes against the stable E01 section IDs; preserve the original film.
