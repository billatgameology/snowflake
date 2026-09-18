# Plan — faster opening and complete home-to-E01 MP4

- Status: complete; delivered artifact checked, maker playback review next
- Date: 2026-09-17
- Baselines: authority `a60e4d3`; website `d434084`
- Parent: [series plan](explore-journey-science-series.md)

## Goal

Double the current series opening crystal-growth speed, then deliver one local MP4 containing
that opening, its actual Hero1 snowfall/title, the continuous downward entry, and all of E01.
Use the current Mandarin narration and Simplified Chinese presentation, as stated to the maker;
landscape 1920×1080, 30 fps, H.264 video and AAC audio. Preserve the original film and recordings.

## Approach

1. Change the series-only growth rate from its existing 1.25 to 2.5. Preserve the short finished
   crystal hold, zoom/handover and natural snowfall speed. Original Run B Hero defaults stay intact.
2. Add an explicitly opt-in fixed-frame series capture mode. Reuse the actual DOM, diagrams,
   growth renderer and Hero1 implementation. Step accumulated opening weather sequentially;
   derive E01 visuals/reader position from the current Mandarin phrase-to-story clock. Do not
   use the crystal-only high-bit-depth export or screen-record dropped real-time frames.
3. Retain the title long enough to read, then reproduce the existing 1.8-second descent. Audio
   begins at descent start, just as it does on the website. Render a short prototype before the
   full export; pin viewport, fonts, render tier, sources, timing, audio identity and output recipe.
4. Reuse the compositor/encoder infrastructure for bounded resumable chunks, verify each frame
   acknowledgment and assembly, and mux the existing complete Mandarin track with the declared
   opening offset. Keep output in a new local export directory; no old export is overwritten.
5. Run focused timing/capture tests, TypeScript/build and live/decoded visual inspection. Verify
   full MP4 decoding, stream dimensions/rate/duration, complete section coverage and audio offset.
   Document actual coverage and limitations, update PROGRESS, and deliver the file.

## Done when

The live series opening grows at twice its previous rate and a verified full home/transition/E01
Mandarin MP4 exists, with source-bound audio and representative decoded visual review. A preview
or silent video alone is not completion. No uninterrupted audience/listening acceptance is inferred.

## Out of scope

No script/science revision, speech synthesis, Episode 2 export, solver/evidence/gate change,
deployment, upload, push, merge, deletion or public release. Product-sized checks only.

## Open questions

Mandarin and landscape are explicit working assumptions; adjust if the maker requests otherwise.

## Execution — prototype and initial render

Website `docs/series-export.md` records the capture implementation and exact checks. Its
`docs/series-export-checks.json` records 54 focused passes, zero failures and TypeScript/build
success. Root inspected the prototype's decoded growth/title/descent frames and compositor
samples of all eleven sections, plus the live snowfall/title. The prototype receipt is
`export/series-e01-zh-2026-09-17-preview/report.json` in that worktree. This is bounded inspection,
not a full listening or audience acceptance claim.

The full run uses `node scripts/export-series-e01.mjs`; live receipts are under
`export/series-e01-zh-2026-09-17/`. Its `manifest.json` registers 41,756 frames with narration
starting at 17.9 seconds, using the existing source MP3 and semantic-onsets-v2 clock. Independent
code review repaired a full-duration decimal-rounding assertion before launch. `worker-equivalence.json`
records matching composed PNG bytes across both workers at one crystal and one diagram time.
The initial run was superseded by the capture repair below without rebuilding the site.

### Lossless capture performance repair

The initial full-render path spends substantial time compressing PNGs, not changing the visual.
Website `export/series-capture-benchmark/report.json` compares twelve standard screenshots
(2.070202166 seconds) with twelve speed-optimized lossless PNGs (0.583091792 seconds), while
the original render was running. Both decode to the same RGB SHA-256 at the sampled diagram.
Use the faster PNG-compression option without changing the frozen site, dimensions or frames.
Retain the original run directory. A new versioned recipe may copy only completed chunks after
checking the original manifest, identical built bytes/timing/renderer/encoder contract, receipt
and file hashes, dimensions and decoded frame count; record explicit reuse provenance. Partial
chunks are not reused. This is a capture-encoding repair, not lower-resolution or lossy imagery.

The first fast attempt stopped before any new chunk: its worker-equivalence assertion found a
compositor synchronization mismatch (`export/series-e01-zh-2026-09-17-fast/failure.json`). The
paused benchmark did not test publication immediately after a new frame. The exporter now waits
for fonts and two animation frames, reads layout and captures the explicit viewport. The new
`export/series-e01-zh-2026-09-17-fast-v2/worker-equivalence.json` records equal decoded RGB across
workers **and** the ordinary screenshot path at both probes. Its saved proof PNGs make the
comparison independently inspectable. This changes only the exporter, not the frozen site.
The full render completed there; the earlier directories and partial files remain intact.

## Completion

Website `docs/series-export-final.json` copies the finished report and independent audit values
at write time and records their source paths/hashes. The output is
`export/series-e01-zh-2026-09-17-fast-v2/Cryosphere-home-and-episode-1-mandarin.mp4` in the retained
website worktree: 41,756 frames, 1,391.8666666666666 seconds, 338,183,144 bytes, SHA-256
`a1f8a16c351df5b66db3985df968a521f9d6c5cf03f535cfaff2432ae5f106f6` (adjacent `report.json`).
Full decode and timestamp checks passed. Independent audio samples all align at the declared
opening offset; the completed-chunk review found no recorded semantic/scroll discontinuities.
Root inspected decoded samples of the opening, transition, all scenes and ending.
See the [review](../reviews/science-series-home-e01-export-2026-09-17.md) for coverage and limits.
Next: maker watches this retained MP4; no further render or source rewrite is required by this task.

## Tried and rejected

- Canvas-only capture: excludes the reader, title and multi-layer snowfall.
- A whole-episode English/Mandarin duration ratio: contradicts the delivered phrase alignment.
- Random access into accumulated weather: cannot reproduce the opening's actual continuous state.
- Setting the rate to 2 instead of doubling 1.25: would only speed current growth by 1.6 times.
- Fast PNG capture without a final paint/layout fence: failed the worker equivalence check;
  a stable paused-frame benchmark alone was insufficient. Keep the equality check.
