# E01 — attention and progressive-reveal review

## Verdict and scope

Ready for maker viewing, not audience acceptance. The maker requested an English-wide visual
declutter pass after a scene-7 screenshot and praised revised scene 9's sequential construction.
Website implementation: `explore/film-part1@4d7cc52` in the retained
`/Users/clipper/github/snowcrystal_website-film-part1` checkout, from baseline `0e480a5`.
The [committed plan amendment](../plans/explore-journey-science-series.md#english-e01-attention-pass--2026-09-17-planned-before-implementation)
preceded implementation. The [canonical guide](../video/science-series-design-guide.md)
now records the critique, its bounded praise and the reusable attention/disclosure requirements.

Root OpenAI Codex agent owns implementation, browser inspection and this record. Three
shared-context read-only agents reviewed story/design, runtime and scientific representation;
exact model identities were unavailable. Their source/code inspections were not browser or
general-adult comprehension tests. No new source-science claim or solver behavior was introduced.

## What changed

- One Menu contains chapter navigation, Still and expandable scene Sources. Playback and the
  language control remain reachable. The non-modal panel pauses playback, stays outside reader
  layout, supports keyboard dismissal, and does not resume audio when closed.
- Removed the persistent visual chapter eyebrow/title and repeated production paragraphs.
  A small model badge follows actual renderer availability; it opens the same Sources panel.
  Run B remains explicitly unvalidated. The ending identifies enlarged thickness; Sources
  retain its 2.6× factor, time compression, cells-versus-molecules and nonphysical tick meaning.
- Expanded the useful diagram area. Local identity/condition labels remain; generic repeated
  descriptions retire. Reveals depend on recorded phrases rather than equal scene fractions.

| Section | Attention change |
| --- | --- |
| 1 | Selected donor and visible shrink lead; the quantity/approximate-example qualifier arrives later without three simultaneous headline lines. |
| 2 | Retains the praised focused overview; taught result labels appear with their panels. Uses “crystals stuck together,” not an unexplained aggregate term. |
| 3 | Cloud → visible mist/invisible vapour → air-gap close-up → rising/cooling/condensation. One local phase legend; narrated millimetre unit instead of an additional micrometre label. |
| 4 | Starts with one cold liquid drop; the circular magnifier appears when requested, with smooth parent positioning. The second freezing example waits its turn. |
| 5 | Keeps the praised solid surface/reference and two-way mechanism; joining/leaving labels appear with their explanation. Retains fixed temperature and the prediction hold. |
| 6 | Short local states replace repeated descriptions. Ice is established first; liquid is not falsely labelled balanced on entry. The final opposite-change result waits for its spoken observation. |
| 7 | Single molecule becomes the focus while contextual traffic dims; reciprocal exchange returns at its cue. The budget no longer competes with a miniature surface diagram. The air passage retains wandering transport. |
| 8 | Pressure wording, water-only indicator, ice balance and saturation arrive in sequence. The initial meter has no unexplained balance mark. |
| 9 | Preserves the praised reference → extra → colder sample → comparison sequence. Retains equal-volume/dot meaning and the calculated cold-example limit, without duplicated subtitles. |
| 10 | Freezing/shrinking and remaining materials are labelled at their beats. The cold-limit conclusion is delayed; the unused schematic balance marker is removed. |
| 11 | Faces, directions and branches appear individually at their actual phrases. The ending now reaches the inside-the-solid selection and “Why six?” instead of an unreachable branch. |

## Audio and preservation

No spoken words, takes, masters or alignment were changed. No credential access or synthesis.
English still loads `/series/narration/2026-09-17-e01-clearer/e01-complete-paced.mp3`.
Fresh file hashing and the source-bound focused tests confirm SHA-256
`d69db9caac009f1e73b8b64d6126950732ba3ec3437bc3b655c9e17b8105cb6e`;
the current narration manifest retains performed-source hash
`8e15559ac3d9819b1ad6f52bf5c8772d78e4800d17abdc918b241d02b6dc313f`.
The website's `docs/series-e01-attention-tests.txt` records the retained-take/source checks.

Chinese performed content and audio remain unchanged. The shared diagram dictionary includes
equivalents for shortened labels so the existing same-page toggle does not regress into mixed
languages. This is compatibility maintenance, not a Mandarin editorial/audio pass. E02 source,
original film, home choreography, renderer assets and previous MP4 are preserved. The delivered
MP4 remains the prior cut; this request did not ask for another export.

## Review findings and repairs

1. Story review found the initial liquid falsely labelled balanced and the final shape keys
   all visible together. Both now follow the actual demonstrated event/phrase.
2. Science review caught the cloud legend multiplied by an already-zero opacity after the
   mixed-cloud transition. Independent contrast timing and a visible-opacity regression test
   repair it; final desktop and narrow screenshots show the labels.
3. Runtime review found backwards Tab from Close could focus a distant footer and scroll the
   film. That boundary returns focus to Menu with `preventScroll`; live checks retained the
   same scroll and story position. Model identity also waits for the exact renderer driver,
   not just downloaded bytes, and disappears on the schematic fallback path.
4. Root normal-speed playback exposed the final scene-6 opposite-change label appearing while
   the vapour input was still being described. Delayed it to the liquid-change phrase; the
   final cold-load checks at 510 and 517 seconds show the before/after distinction.
5. The first automated pass expected superseded labels and flagged missing Chinese equivalents.
   Assertions now check the retained meaning and new reveal boundaries; shortened display
   labels are translated. This did not relax narration, source-value or scientific contracts.

The bounded follow-up story/design review found no material remaining change to request.
It specifically checked preservation of scene 5, scene 9 and the guide's scoped praise.

## Checks actually run

Website receipt files at implementation commit:

- `docs/series-e01-attention-tests.txt`: **61 passed, zero failed**. Exact command:
  `node --test scripts/series.test.mjs scripts/series-reading.test.mjs scripts/series-continuous.test.mjs scripts/series-localization.test.mjs scripts/series-bilingual-audio.test.mjs scripts/series-export.test.mjs scripts/series-audio.test.mjs`.
  Covers finite/reversible diagrams at actual caption boundaries, new reveal assertions,
  selected model readiness, scrolling, language clocks, preserved audio and export timing.
- `docs/series-e01-attention-build.json`: the standalone Sites build command passed, including
  `tsc -b`; Vite retains the existing large-chunk advisory. No full scientific suite or gate.
- `docs/series-e01-attention-browser.json`: exact sampled seconds, viewport sizes, observed
  menu/media states and limits. All sections sampled at phone width; desktop samples focus on
  cloud identity, the difficult balance comparison and molecule handover. Final drawing changes
  were cold-reloaded before the decisive rechecks.

Browser checks included normal-speed English playback with media time owning the visuals,
pause-on-menu, chapter seek, Sources, Still prediction, Escape, backwards Tab, outside-language
dismissal, paused language round trip, wheel takeover and resume. Final browser error query was
empty. Temporary viewport override was reset; the existing preview is left paused in English.
In authority: `npm run lint:rule7` and `git diff --check`; in website: `git diff --check`.

## Limits and next action

This was sampled visual inspection, not a complete uninterrupted viewing or new subjective
listening test. No physical-phone, forced WebGL-context-loss, OS reduced-motion or full old-film/
E02 playback check was performed. Existing focused checks cover the unchanged relevant boundaries.
Paused resizing can leave reader pixels at the old location until seek/resume, while story time
is preserved; this existing scroll-restoration limitation was not broadened into a separate fix.

Next: maker views the existing E01 link, especially the crowded screenshot's scene-7 budget,
the new magnifier entrance and the ending. A general-adult teach-back still remains the way to
test understanding; less text and green tests do not themselves establish it.
