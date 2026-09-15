# Part 1 film — bounded runtime review

Date: 2026-09-15. Scope: **WP0A only**, the local halo/corner sequence and ending-transition prototype defined by the [active plan](../plans/explore-film-part1-science-scroll-documentary.md). This is not acceptance of the complete documentary, its final narration, or a scientific result.

## Reviewer and inspected state

Reviewer: Codex runtime-review subagent (`/root/runtime_review`), using the inherited parent model. The exact model/version identifier was not exposed to this reviewer. I shared the task and development context with the implementation agent, supplied runtime findings, and inspected its repairs, but authored no website changes. This is a non-author source review, **not a clean-context or different-model independent audit**.

The initial plan review used snowflake commit `d7d1de70251be1fb8b8596b8e6da35d82ef2b8a4`. This closing review inspected the working implementation in `/Users/clipper/github/snowcrystal_website-film-part1`, branch `explore/film-part1`, based on `e8f82d00f0892f1b9cef930c845f2898d1053490`. The website changes were uncommitted at inspection; the base commit alone therefore does not identify the reviewed code. The imported prototype score identifies snowflake revision `40e7891636a91f3d6dc054f8cc8b1782db526028` and SHA-256 `b1cc5babc1ed783d0412e37180d9ca6a64ad6cd6ba68d705f351c735fb2b4621`.

I personally ran read-only Git/source inspections, local dependency/version checks, report parsing and SHA-256 comparisons. Earlier, I also ran a blank-page Chromium WebGL2 capability probe: it returned WebGL2 support and `ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)`. That probe did not visit or render the film. I did **not** execute the website build, timeline tests, browser matrix, export or media decode; I inspected the implementation agent's saved outputs for those checks. I did not watch/listen to the movie or independently inspect its screenshots. The sole file I created is this review.

## Earlier defects and verified repairs

Paths below are relative to the website worktree. Line references identify the inspected working files, not the base commit.

| Prior failure | Repair verified in source |
|---|---|
| An old `play()` promise could pause a newer successful play request. A replay's interrupted seek could subsequently start playback anyway. | `src/film/timeline.ts:24` gives each request an epoch; `shouldPauseStale` preserves newer loading/playing ownership. `src/film/Part1Film.tsx:158` rejects stale seek completion; both play continuations use the guarded stale-pause rule, and replay checks the seek's boolean result at line 173. |
| Worker readiness was mistaken for a mounted, initialized R3F renderer. The first image could be acknowledged before the exact driver existed. | `src/growth/GrowthStage.tsx:704` installs an opt-in exact driver and sends readiness after mount/size changes. `src/film/Part1Film.tsx:120` performs two post-layout draw/paint passes before setting `visualReady`. Successful readiness now also clears `visualFailure` at line 129. Capture requires replay, driver and visual readiness at line 279. |
| Lost WebGL context could produce a successful DOM acknowledgement despite a missing model; the live failure path could leave audio running. | `src/growth/GrowthStage.tsx:710` checks context loss before and after rendering, with `finish()` in capture mode. `src/film/Part1Film.tsx:95` clears readiness, rethrows during capture, and pauses live playback with a visible Retry action. The capture path draws both layers before acknowledging. |
| Camera damping/history, frame ordering and wall-clock grain undermined arbitrary seeking. | `src/growth/GrowthStage.tsx:408` adds undamped exact camera evaluation, camera-before-material priority and matrix update. Exact mode uses `frameloop='never'`, excludes the old clock/capture bridge and omits temporal Noise. `src/film/HaloCorner.tsx:13` derives schematic paths and annotations from supplied progress; ending particles in `src/film/Part1Film.tsx:106` derive position from cue time rather than accumulated simulation state. |
| Reduced-motion/phone compaction could reinterpret the old scroll position as a different cue. Enlarged phone text overlapped positioned stage elements. | `src/film/Part1Film.tsx:186` remeasures semantic anchors and makes a tagged, instant position correction on reading-layout changes; continuous playback scrolling remains disabled for still modes at line 135. `src/film/film.css:47` moves phone headings, provenance and captions into normal flow. The semantic article and descriptive stills remain separate from the decorative stage at `Part1Film.tsx:320`. |
| Fractional quality input passed a type cast but could select an undefined renderer tier. Pending media work could survive route departure. | `src/film/Part1Film.tsx:24` accepts only integer tiers in the supported range. The unmount cleanup at line 258 invalidates transport ownership and pauses the captured media element. |

The implementation agent additionally diagnosed the inherited near plane clipping the seed, global atmosphere covering article text, root view-transition fades changing reload captures, and AAC padding at montage joins. I inspected the resulting source changes: the near-plane override is limited to exact film mode (`GrowthStage.tsx:764`); the film gets its own stacking context and transition rules (`film.css:1`); `RootLayout.tsx:10` excludes global grain/scroll ownership on this route; and the exporter constructs final audio from the original PCM timing fixture rather than concatenating the independently encoded audio streams.

Replay identity and lifecycle are explicit: `Part1Film.tsx:35` supplies the expected digest, `src/growth/growthVolume.worker.ts:84` checks the downloaded bytes before decoding, and `src/growth/useGrowthVolume.ts:47` terminates the worker after a reported decode failure or successful result, as well as on cleanup. This demonstrates one-asset ownership, not a tested multi-asset cache.

## Artifact record inspected at write time

The durable [prototype verification receipt](../video/part1-prototype-verification.json) was 41,140 bytes, SHA-256 `e3ebfefbf4180da2274c95389af9ecf373e8382004c868bee6cb83d04d13ef2c` when read. It embeds the implementation agent's command results and the following exact website reports:

| Artifact | Inspected result |
|---|---|
| `export/film-prototype-check/report.json` — 1,064 bytes; SHA-256 `52fb70fabf71e6c6f85925944c4fee3300b72474e096ad227a8c4ebbdd1153e8` | Chrome `153.0.8010.36`; 16 recorded checks; empty errors list. Coverage includes intentional play/manual takeover, exact seek, reverse reading, live reduced motion, resized reading position, phone/enlarged text, rejected audio play, no WebGL, capture/live context loss, hidden-tab and keyboard/touch handlers, no-JavaScript reading, and required missing replay rejection. |
| `export/part1-prototype/report.json` — 21,551 bytes; SHA-256 `c7a9e5caed50b36608d2dcb0d38fda77e077087a8fcf6bd97a938195083e10d1` | Three 2-second windows starting at score seconds 13, 61 and 76; 180 decoded video frames total. Reported profile: 1920×1080, 30 fps, 8-bit browser composition converted to limited-range BT.709 `yuv420p`, with 48 kHz AAC. Video/audio durations both 6 seconds; decode passed; empty errors list; total recorded wall time 28.061 seconds. Selected repeated/reverse/reload cue screenshots have exact byte equality on the reported renderer. |
| Timeline/build entries in the verification receipt | `node --test scripts/film-timeline.test.mjs`: exit 0, 6 passed, 0 failed. The recorded production build (`tsc -b && vite build`, invoked by the implementation agent's build wrapper) exited 0, retaining its large-chunk warning. These are inspected outputs, not my reruns. |

I recomputed the current hashes of every source path in the export report's `implementation` object; all matched. In particular, its `Part1Film.tsx` digest `396be5bc3fdd61dc3ec3c0e5a09ee61d62f4745e236d1d0d0bacb3a329d7e7d6` includes both clear-on-ready and unmount-media repairs. Additional reviewed files outside that export map were:

- `src/growth/useGrowthVolume.ts`: `8f28ad7fb424c4a30e5557ff16490dbcac775e500873e616b10c9a6c54d5f461`.
- `src/growth/growthVolume.worker.ts`: `11dea4e6212c2238d97190b42ac3b2132b7580179170ca1f30544771ae5e827a`.
- `src/components/chrome/RootLayout.tsx`: `ecc0b45bf00b78dd4d6913c701b7b21687536cca66a1f7dbc3ad5e39ebe57a82`.

## Verdict and remaining limits

**No unresolved blocking/high runtime finding remains in the reviewed WP0A scope.** The repairs and inspected product-sized checks support proceeding with narration and selected scene production on this runtime. They do not establish that the full film is complete or ready to publish.

The sequence is an 80-second prototype with timing tones, not the maker's voice. The exported montage covers only the listed transition windows, not continuous full-prototype playback or a documentary-length export. Real recorded speech synchronization, final captions, full-film export cost and multi-asset cache behavior remain unmeasured. The exact screenshot comparison is renderer- and sample-specific, not cross-platform determinism.

Visibility, keyboard and touch checks use synthesized browser events; they do not certify real phone hardware, operating-system backgrounding or screen-reader usability. GPU allocation payloads in the report exclude browser/driver/compositor overhead and are not total VRAM. The implementation agent's representative image inspection is recorded in the receipt; it is not my visual verdict or the maker's aesthetic acceptance. Preserve the visible MODEL/DIAGRAM qualifications and geometry styling disclosure during expansion. No scientific gate, numerical solver or validation label is accepted by this review.
