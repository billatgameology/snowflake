# Plan — faster opening and complete home-to-E01 MP4

- Status: implementation starting
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

## Tried and rejected

- Canvas-only capture: excludes the reader, title and multi-layer snowfall.
- A whole-episode English/Mandarin duration ratio: contradicts the delivered phrase alignment.
- Random access into accumulated weather: cannot reproduce the opening's actual continuous state.
- Setting the rate to 2 instead of doubling 1.25: would only speed current growth by 1.6 times.
