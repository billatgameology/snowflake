# Plan — dendrite visual studies

- **Phase:** maker-directed pre-Phase 7 presentation exploration; no phase gate
- **Status:** original studies complete; library extension in progress
- **Started:** 2026-09-04
- **Last touched:** 2026-09-04 by Codex

## Goal

Make several visibly different, playable dendrite treatments from the existing attachment
history, so the maker can judge the visual hook before choosing a website treatment.

## Approach

Reuse this animation worktree and branch `fix/animation-queue-windows-spawn`; its previous
growth work is complete and the opening tree is clean. The website sibling is read-only
reference: its glass raymarch and the source viewer's existing colour presets already cover
conventional ice. Add an independent presentation page to this app, using recorded site
positions and attachment ticks for event-driven light, persistent age colour, darkfield
structure, and a deliberately displaced time sculpture. No solver execution is needed.

Keep a compact project-owned dendrite asset with the page, preserving all original events
and their integer ticks, while omitting workstation paths from its display-only header.
Record the original asset identity. Screen-space splats, colours, bloom and time displacement
are visual treatments, not measured optics or molecular trajectories. G-G ticks are not seconds.

## Done when

- Four selectable styles replay the same dendrite and synchronized tick, including seeking
  backwards, replay, pause, and a focused presentation view.
- The recorded event set is unchanged; no site appears before its attach tick.
- The page identifies model replay and artistic colour/depth encoding without interrupting
  the viewing experience. Missing data and unavailable graphics show a useful error.
- Focused presentation-boundary tests, `npm run typecheck`, `npm run lint:rule7`, and
  `npm run build --workspace app` pass. A live Chromium smoke exercises the controls and
  produces inspected comparison/focus screenshots. No full scientific suite is required.
- PROGRESS links the implementation, viewing command, checks and remaining aesthetic choice.

## Steps

- [x] Read current state, governing presentation clauses, completed animation plan and renderers.
- [x] Implement the portable event asset, four treatments, comparison and focus controls.
- [x] Inspect live motion/stills and refine composition and readability.
- [x] Run product-sized checks and record reproducible review instructions.

## Viewing and comparison

Run `npm run dev --workspace app -- --port 5191`, then open
`http://127.0.0.1:5191/dendrite-styles.html`. The existing catalogue links to this page.
It also ships in the app build and carries its own project-owned data, so a website sibling,
NAS mount and solver process are unnecessary. Focus a card, drag to turn it, or scrub all
four at the same tick. Chronograph's **Unfold time** slider continuously returns its displaced
sites to their recorded positions at zero. Reduced-motion visitors start on a paused still.

| Treatment | Visual use of the recording | Suggested role |
|---|---|---|
| Ion Bloom | Bright mint light on recent attachments, older ice fades to blue | Opening growth shot; the author's preferred visual hook |
| Timeglass | Persistent arrival-time colour with narrow temporal bands | Show that the shape contains a history |
| Darkfield | Etched silver body, gold recent attachments | Quieter, more restrained alternative for research pages |
| Chronograph | Arrival time displaces each site along the depth axis | Interactive reveal: unfold the history, then collapse to the snowflake |

These are author judgments from inspected browser captures, not audience-test findings.
The website's existing Run B glass renderer was inspected separately at its captured playhead;
its refraction, dispersion and flyaround remain unchanged. This exploration uses point splats
to make attachment chronology visible and does not replace the established glass renderer.

## Verification record

Product checks passed; logs are reproducible inspection scratch below `out/dendrite-styles/`:

- `npm run typecheck` — `typecheck.log`.
- `npm run lint:rule7` — `rule7.log`.
- `npx vitest run app/test/dendrite-data.test.ts runner/test/vite-nas-serving.test.ts` —
  `focused-tests.log`, 23 passed and two platform-specific skips (copied from that log).
- `npm run build --workspace app` — `build.log`, including the new page and packaged asset.

The source payload comparison in `asset-preparation.json` reports
`eventPayloadUnchanged: true`. The reproducible packager in
`app/scripts/prepare-dendrite-study.mjs` checks the selected original digest before packaging;
its format and source identity are documented in `app/data/README.md`.

The live smoke/export command is `node app/scripts/dendrite-study-preview.mjs --video`.
For a stable production preview, first build the app, run
`npm run preview --workspace app -- --port 5192`, and set `DENDRITE_STUDY_URL` to
`http://127.0.0.1:5192/dendrite-styles.html?capture=1` when invoking the script.
The video requires local FFmpeg. Omit `--video` for the quick browser smoke.
Rendered stills, the clip and browser report are reproducible inspection scratch, not retained
scientific evidence or a NAS publication.

Final production-preview smoke completed successfully; `out/dendrite-styles/browser-smoke.json`
records seed/endpoint visibility, backward seeking, UI scrubbing, all styles, time-depth control,
paused dragging, play/pause, replay, mobile overflow and reduced-motion checks, with no browser
errors. `comparison.png`, `style-1.png` through `style-4.png`, and the folded/unfolded/orbit
Chronograph captures were produced by the smoke. The author inspected the desktop comparison,
focus renders and a decoded frame of the finished film. The mobile overflow check is automated;
this record does not claim a general device-performance or audience test.

The completed `out/dendrite-styles/dendrite-styles.mp4` is a comparison preview: 10 seconds,
1440 × 1260, 24 fps, 240 frames, 3,683,566 bytes (copied from
`out/dendrite-styles/video-info.json`, produced by FFprobe). The final capture used the static
production preview on port 5192; the development review page remains on port 5191.
The temporary website-reference server on port 5190 was stopped after inspection.

Next action is maker visual review: open Ion Bloom in focus, replay from the seed, then compare
Timeglass and unfold Chronograph while paused. Applying a selected treatment to the website is
a later product task; this completed study does not start Phase 7 or change its held status.

## Out of scope

New growth runs, optical or physical-rate claims, Phase 7 adoption, website deployment,
NAS publication or serving-policy changes, and changes to existing renders or evidence.

## Tried and rejected

- More backdrop palettes alone: existing footage, frost, aurora, ember, graphite, abyss and
  glass recipes already explore this. Use attachment chronology to change what viewers see.
- Serving the scientific NAS collection directly: its catalogue explicitly denies serving.
  The review page instead carries a bounded project-owned presentation asset in app/data.
- Capturing a film while editing a live Vite development page: a source save triggered a reload
  and destroyed the browser context during the first export. Export from the static production
  preview; the capture helper now also terminates its encoder if capture fails.

## Follow-up — select the available growth library

Maker direction, 2026-09-04: Timeglass is particularly promising; make the available animations
selectable through all four views. Reuse this worktree and branch. This is presentation work.

### Approach and done criteria

- Commit a compact source manifest for the approved website library plus original Run B.
  Preserve the earlier exclusion of the divergent Fig. 6 regrowth. The original single-dendrite
  product asset remains the portable fallback when external local sources are absent.
- Add a bounded Vite product plugin that packages only exact digest-matched, registered local
  growth files into the existing presentation format. Development responses omit workstation
  metadata; production builds emit the same product assets. Read local fleet/website files
  only; the scientific NAS collection stays non-served. No new retained source copy or NAS
  publication is created. Build outputs remain reproducible product scratch.
- Add searchable selection, previous/next controls, linkable crystal identity, and a persistent
  view choice. Timeglass becomes the default. Only one crystal is loaded at once; cancel stale
  requests, decode in a worker, dispose replaced GPU geometry, and make load errors retryable.
- Frame both planar and columnar crystals using their full extent. Keep positions, attachment
  order, all original events and the rendering/physical-time distinction intact.
- Verify the complete registered library can be packaged/decoded, test the bounded serving
  handler and playback controls, and exercise rapid switching, deep links, missing assets,
  a dendrite, a needle and a hollow column in Chromium. Run focused tests, typecheck, Rule 7
  and app build; stop at these product-sized checks.

### Next step

Implement the source manifest, bounded product packaging and reusable loading path, then add
the selector and inspect the non-planar framing before final product checks.
