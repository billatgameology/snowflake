# Plan — dendrite visual studies

- **Phase:** maker-directed pre-Phase 7 presentation exploration; no phase gate
- **Status:** complete, including two views and closer branch detail
- **Started:** 2026-09-04
- **Last touched:** 2026-09-05 by Codex

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
four at the same tick. Two Views adds independent pane dragging and **Detail zoom**;
Crystal Cast's **Move the light** control changes relief lighting while paused or playing.
Reduced-motion visitors start on a paused still. The replacement follow-ups below supersede
Darkfield, Chronograph and Growth Front; their completed records remain historical.

| Treatment | Visual use of the recording | Suggested role |
|---|---|---|
| Ion Bloom | Bright mint light on recent attachments, older ice fades to blue | Opening growth shot; the author's preferred visual hook |
| Timeglass | Persistent arrival-time colour with narrow temporal bands | Show that the shape contains a history |
| Two Views | Top view beside a magnified branch detail | Connect the whole silhouette to local branch structure |
| Crystal Cast | Projected surface relief, edge shaping and movable shadows | Make the branch structure and spaces between branches feel tangible |

These are author judgments from inspected browser captures, not audience-test findings.
The website's existing Run B glass renderer was inspected separately at its captured playhead;
its refraction, dispersion and flyaround remain unchanged. This exploration uses point splats
to make attachment chronology visible and does not replace the established glass renderer.

## Initial verification record (before the replacement views)

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

### Follow-up completion

The existing page now opens in Timeglass and selects from the approved library, with search,
previous/next, an explicit view selector and crystal/view identity retained in its URL.
Known habits are shown beside figure labels. Switching loads only the chosen replay, cancels
an earlier request, decodes off the UI thread, and disposes replaced GPU geometry. Columns
are viewed from the side and framed using their full extent; Chronograph reserves room for
the additional time displacement. Failed requests show a retry action and do not display
the preceding crystal beneath a new label. Graphics-context restoration redraws the current
geometry and restores the dark backdrop.

`out/growth-study-library/packaging.json` records 52 prepared/decoded assets, 198,282,280
presentation bytes and `allPayloadsUnchanged: true` against the original website files.
The tracked source identities are in `app/data/growth-library.json`; the existing Fig. 6
exclusion remains explicit. No source payload was added to Git or copied into a new NAS
collection. A source-limited checkout shows unavailable options and keeps the original
tracked dendrite usable; this host and its built preview contain the full registered set.

Verification (values copied from the named artifacts at completion):

- `npm run typecheck` — `out/growth-study-library/typecheck.log`.
- `npm run lint:rule7` — `out/growth-study-library/rule7.log`.
- `npx vitest run app/test/dendrite-data.test.ts app/test/growth-study-library.test.ts runner/test/growth-study-assets.test.ts runner/test/vite-nas-serving.test.ts`
  — `out/growth-study-library/focused-tests.log`: 28 passed, two platform-specific skips.
- `npm run build --workspace app` — `out/growth-study-library/build.log`.
- `node app/scripts/growth-study-library-smoke.mjs` against the production preview on port
  5192 — `out/growth-study-library/browser-smoke.json`: 52 crystals through 208 view renders,
  matching registered endpoints, nonempty rendered pixels, one live GPU geometry, search,
  navigation, deep links/view retention, delayed-request cancellation, injected failure/retry,
  mobile overflow and reduced-motion checks; zero unexpected browser errors. The intentionally
  injected HTTP 503 is excluded from that unexpected-error count.
- The final habit-label check is `out/growth-study-library/final-ui-smoke.json`; the explicit
  context-loss/restore probe is `context-restore.json` in that directory. The latter reports
  ready state restored, status dismissed and the original backdrop pixel `[8, 13, 18, 255]`.
  Final Timeglass and representative needle/column/Run B stills were inspected in Chromium.

The full-library smoke preceded a display-label clarification and backdrop-restoration fix;
those final boundaries received the targeted built-page checks above. This is a product
rendering check on this host, not a general device-performance or scientific validation claim.
All logs and captures remain reproducible inspection scratch.

### Follow-up tried and rejected

- Announcing capture readiness when decoding finished: Chromium's startup graphics interruption
  could leave an early capture blank. Readiness now also requires a drawn frame with the current
  data and a live graphics context; restoration redraws the view. The first full-library smoke
  caught this through its nonempty-pixel check, before any pass was recorded.

### Next step

Review `http://127.0.0.1:5191/dendrite-styles.html`, select an animation, and keep Timeglass or
choose another view. A fresh session starts it with
`npm run dev --workspace app -- --port 5191`; the optional production smoke uses
`npm run preview --workspace app -- --port 5192` after a build. No implementation work remains
in that initial library pass. The maker's catalogue correction below supersedes its source scope.

## Correction — include the newer named catalogue

The maker identified the newer batch omitted from the first selector. The sibling worktree
`../snowflake-named-catalog`, branch `feature/named-crystal-catalog` at `ff15473`, holds the
completed accepted catalogue in `docs/named-snow-crystal-catalog.json`, with its exact direct
and Compose review records. Its completion record and PROGRESS supersede the stale in-progress
heading in its catalogue plan. This task consumes those accepted products without editing that
worktree or changing its acceptance records.

### Approach and done criteria

- Import a digest-bound product manifest from the accepted catalogue and review records. Keep
  the earlier library available and put named types/variants first, with a collection filter.
- Package direct recordings from exact allowlisted local paths. Package Compose using its
  recorded transforms and phase offsets with deduplicated component event payloads. Decode and
  combine components in the worker, preserve chronological seeking, and label composed scenes
  explicitly. Never claim they are one solver run or one shared model-tick clock.
- Support restored local output or the sibling producer worktree without serving generic out,
  raw scientific bundles, private metadata, or changing NAS policy. Missing sources remain
  visible as unavailable. No new simulations or retained binary source copies.
- Verify the imported manifest matches the accepted identities; exercise all added entries in
  all four styles and representative composed/axial/planar forms visually. Add focused controls
  for transforms, phase offsets, deduplication, source mismatch and contained serving. Run
  typecheck, Rule 7, focused product tests and app build; no full scientific suite or gates.

### Next step

Open `http://127.0.0.1:5191/dendrite-styles.html` and select **Collection → Named catalogue**.
Use the named type and variant with Timeglass or any other view. Implementation is complete.
The restarted live server is recorded under `out/named-growth-studies/dev-server.pid`, with
stdout/stderr beside it; a fresh session uses `npm run dev --workspace app -- --port 5191`.

### Implementation and source checks

`app/data/named-growth-library.json` binds the accepted catalogue and direct/Compose review
document identities. `node app/scripts/verify-growth-studies.mjs` produced
`out/named-growth-studies/packaging.json`: 151 prepared/decoded entries, 99 from the named
catalogue, and 484,531,000 presentation bytes. Its checks compare every named direct event payload
byte-for-byte with the producer, compare the accepted scene transforms/phase offsets and unique
component counts, then independently count visible original events at five progress values for
each of the 33 composed entries (165 timeline checks). No original event payload changed.

The combined focused product command recorded in `out/named-growth-studies/focused-tests.log`
passes 32 tests, with two platform-specific skips. The final camera adjustment opens selected
named hollow/capped forms obliquely; original library camera behavior is preserved.

### Completion checks

Commands and artifacts under `out/named-growth-studies/` (reproducible inspection scratch):

- `npx vitest run app/test/dendrite-data.test.ts app/test/growth-study-data.test.ts app/test/growth-study-library.test.ts runner/test/growth-study-assets.test.ts runner/test/vite-nas-serving.test.ts`
  — `focused-tests.log`, covering source packaging, bounded reads, selectors, transforms and
  exact phase-boundary visibility. The named-source fixture proves component deduplication and
  refuses corrupt or escaping component paths.
- `npm run typecheck` — `typecheck.log`; `npm run lint:rule7` — `rule7.log`;
  `npm run build --workspace app` — `build.log`. The final build includes the camera and
  visibility refinements. No full scientific suite or gate was run for this presentation work.
- `node app/scripts/growth-study-library-smoke.mjs` — `browser-smoke.json`: 151 entries,
  604 nonempty view renders, matching source identities/endpoints, one live GPU geometry,
  collection filters, named trio search, composition labels, URL/view retention, navigation,
  delayed-request cancellation, failure/retry, mobile overflow and reduced motion; no
  unexpected browser errors. This production sweep preceded the final camera/seek refinements.
- With `DENDRITE_STUDY_URL=http://127.0.0.1:5191/dendrite-styles.html?capture=1`,
  `node app/scripts/named-growth-study-smoke.mjs` — `final-browser-smoke.json`: five selected
  forms, 20 view renders, five original-source timeline counts for Needle Clusters, mobile
  overflow and no browser errors. This exercised the final camera/seek code through live Vite.
- `final-production.json` records the rebuilt-page Needle Clusters regression at 82%, with
  966,522 visible instanced events, one live GPU geometry and no page errors. The value is copied
  from that artifact; it matches the independently read source counts in `packaging.json`.
  `mobile-scrolled-final.png` checks the redraw after scrolling on a phone-sized viewport.
- `live-index.json` records 151/151 available and 99 named entries on port 5191 after restarting
  the earlier dev server, whose middleware had retained the original library in memory.

The author inspected Timeglass for stellar/radiating dendrites, bullet rosettes, custom small
forms, the final oblique Cup and the scrolled mobile composition. These are rendering/product
checks on this host, not audience studies or scientific validation. No source binary, accepted
catalogue, scientific bundle, NAS policy, solver or separate website was changed.

### Tried and rejected

- Equating the older website index with all available animations: it omitted the accepted named
  catalogue in a separate worktree. Source discovery must include that tracked catalogue.
- Using the algebraic inverse of the composed player's tick test as its exact floating-point
  arrival: the independent source comparison found a boundary disagreement for Needle Clusters
  at 82%. The adapter now finds the first representable progress where the original local
  integer-tick test passes. A focused adjacent-float control and the real-source timeline
  comparisons pass; colour attributes remain float32, while visibility uses float64.
- An exact side view for Cups hides the cavity. The named direct camera recipe now opens selected
  hollow/capped forms obliquely; point coordinates and attachment times are unchanged.

## Follow-up — browse animations visually

Maker direction, 2026-09-04: the large animation dropdown is difficult to browse. Replace its
primary UI with a searchable thumbnail gallery in an accessible modal browser, retaining the
current view, playback controls and all registered animation choices.

### Approach and done criteria

- Show a prominent Browse crystals button, thumbnail cards with names/variant labels, collection
  and broad shape filters, matching counts and selection state. Keep the recorded Compose label.
  Clicking a card closes the browser and loads that exact animation through the existing loader.
- Keep keyboard focus inside the modal, restore it on close, preserve filters/scroll between
  visits, pause the current playback while browsing, and support narrow screens and empty results.
- Generate small Timeglass stills using the existing renderer and exact registered source data.
  Store the bounded project-owned thumbnail derivatives with source/render identities in app/data
  for portable browsing. Serve only the registered thumbnail paths through the product handler
  and include them in builds. Do not expose original source paths or private/scientific data.
- Lazy-load thumbnail images; opening/filtering the gallery must not fetch the full replay for
  each card. A browse-first URL can show cards before any growth recording is downloaded.
- Run focused serving/filter checks, typecheck, Rule 7, app build and a representative live browser
  smoke covering every card's preview, selection in the current style, search/filter/reset,
  keyboard close, failure fallback and phone layout. Do not repeat the completed all-renderer
  sweep or run scientific suites; this change is isolated browsing/presentation work.

### Next step

Open `http://127.0.0.1:5191/dendrite-styles.html?browse=1` for the gallery, or use **Browse
crystals** from the player. Pick a thumbnail, keeping Timeglass or the currently selected view.
The live server's PID and logs are under `out/growth-gallery/dev-server.*`; a fresh session uses
`npm run dev --workspace app -- --port 5191`. This follow-up is complete.

### Completion record

The thumbnail gallery replaces the visible long selector. It includes names and variant labels,
collection and shape filters, search/empty/reset behavior, selected-card marking and explicit
Compose labels. Named dendrites lead the gallery. Earlier-library navigation buckets reuse the
existing identity-matched visual audit, with its source digest recorded in
`app/data/growth-library.json`; they do not change scientific morphology claims.

`node app/scripts/growth-study-thumbnails.mjs` generated 151 Timeglass PNGs totaling 12,029,518
bytes (`app/data/growth-previews/index.json`, `out/growth-gallery/thumbnails.log`). Their manifest
records source and image digests plus the renderer commit/recipe. They are tracked project-owned
product derivatives; source recordings, accepted catalogue decisions and NAS policy are unchanged.
The handler verifies registered preview paths/digests, supports HEAD/ETag and emits previews in
production builds. Broken images keep their card's name and replay action.

Verification artifacts under `out/growth-gallery/` are reproducible product inspection scratch:

- `npx vitest run app/test/growth-study-library.test.ts runner/test/growth-study-assets.test.ts runner/test/vite-nas-serving.test.ts`
  — `focused-tests.log`: 28 passed and two platform skips, including browse ordering, original
  shape metadata, valid preview serving and corrupt/unknown/escaping preview refusal.
- `npm run typecheck` — `typecheck.log`; `npm run lint:rule7` — `rule7.log`;
  `npm run build --workspace app` — `build.log`. No scientific suites or gates were run.
- `node app/scripts/growth-gallery-smoke.mjs` — `browser-smoke.json`: 151 cards and decoded
  previews; no full growth requests on browse-first entry; no unexpected browser errors.
  Covers collection/shape/search/reset, exact composed selection, retaining the selected view
  and comparison layout, keyboard focus/close, playback pause/resume (including load completion
  while browsing), filter/scroll retention,
  phone selection/overflow and broken-preview fallback. `desktop-gallery.png` and
  `mobile-gallery.png` were visually inspected by the author; these are product checks on this
  host, not audience-response measurements. The earlier exhaustive render sweep was not repeated.
- `live-preview.json` records the restarted port 5191 page: 151 available recordings with
  previews, successful Stellar Dendrites selection in Timeglass and no page errors. The updated
  capture helpers passed `node --check`; `git diff --check` found no whitespace errors.

### Tried and rejected

- Another longer dropdown or name-only list: the maker needs to recognize crystal shapes visually.
- Loading every growth recording to animate gallery cards: that would make discovery needlessly
  expensive. The existing player loads the selected recording; cards use small derived stills.
- Relying solely on the native dialog for keyboard behavior: the browser smoke found Tab could
  leave the page, and Escape from a search field could be consumed before close. Explicit focus
  wrapping and Escape handling now pass. Close cleanup is synchronous and idempotent so queued
  native close events cannot delay playback restoration or affect a reopened dialog.

## Follow-up — reveal growth and structure beyond colour

Maker direction: remove Darkfield and Chronograph and build two new rendering approaches.
Continue in the existing clean task worktree on `fix/animation-queue-windows-spawn`. Keep the
gallery and the accepted Ion Bloom/Timeglass views, including their existing thumbnail recipe.

### Approach and done criteria

- Replace style slots with **Growth Front**, a moving window of recently attached sites with a
  quiet footprint for orientation, and **Crystal Cast**, a sculptural relief rendered from the
  projected recorded sites with edge shaping, shadows and movable grazing light. These change
  temporal visibility and surface rendering, rather than providing new colour palettes.
- Use bounded offscreen rendering and screen-space compositing for the new approaches. Keep
  original positions/timestamps and precise CPU visibility thresholds; artistic relief and
  shadows carry no optical or physical-rate claims. Do not infer vapor flow from event data.
- Expose a recent-history window and light direction in the relevant focused views. Preserve
  seeking, pause, reduced motion, camera dragging, all gallery choices and comparison layout.
- Inspect a dendrite at several playheads in both new views, plus representative column and
  composed forms. Refine the visuals from actual browser captures. Confirm retired names and
  time-depth controls are absent from the product UI.
- Run focused presentation tests, typecheck, Rule 7, app build and a representative browser
  smoke including new controls, backward seeking, selected-gallery view retention, mobile and
  GPU resource disposal. No full scientific suite, new simulations or repeat catalogue sweep.

### Next step

Open `http://127.0.0.1:5191/dendrite-styles.html?style=2&crystal=named-stellar-dendrites-baseline`
for Growth Front; switch **View → Crystal Cast** and move its light. The implementation and
product checks are complete. The same Browse crystals gallery selects other recordings. A fresh
session starts `npm run dev --workspace app -- --port 5191`; the existing server and its logs
remain recorded in `out/growth-gallery/dev-server.*`.

### Completion record

The new `app/src/growth-sculpture.ts` uses a shared bounded render target and compositing quad
over the player's existing event geometry. Growth Front combines a faint current footprint with
a separate union of recent sites. Recent occupancy has its own mask channel, combined with
componentwise maximum; older points contribute zero to that channel. CPU binary-search bounds
preserve the original direct/composed timestamp thresholds and
seeking order. Its short default interval reads as separated advancing tips on the inspected
stellar dendrite; the longer first default obscured that distinction.

Crystal Cast uses projected surface depth, shallow cell caps, edge bevels and directional cast
shadows. A floating-point target avoids visible depth bands on this host, with lower-precision
format fallbacks where the required extensions are absent. These are artistic reconstruction
choices, not optics or a physical-rate readout. Recorded coordinates, event payloads, source
metadata and thumbnail bytes are unchanged. Small coarse recordings still show their cell scale.
The retired treatments and depth slider are removed from the product; capture helpers now use
the new controls and allow the recording geometry plus one shared screen quad.

Product-sized checks, with reproducible scratch under `out/growth-structure/`:

- `npx vitest run app/test/growth-sculpture.test.ts app/test/dendrite-data.test.ts app/test/growth-study-data.test.ts`
  — `focused-tests.log`: eight passed, including seed/tied-event interval bounds and backward
  seeks. The existing direct/composed decode boundaries also pass.
- `npm run typecheck` — `typecheck.log`; `npm run build --workspace app` — `build.log`;
  `npm run lint:rule7` — `rule7.log`. No scientific suite, gate or new simulation was run.
- `node app/scripts/growth-structure-smoke.mjs` — `browser-smoke.json` / `browser-smoke.log`:
  50 sampled renders across stellar/sharp dendrites, Cups, Radiating Dendrites and Needle Clusters
  in both new views; no unexpected browser errors. Repeated backward seeks produced identical
  image hashes; window and light controls visibly changed the expected rendering, with source
  visibility unchanged by light. The checks include actual gallery selection, paused camera
  dragging, comparison, playback, phone overflow and reduced motion. Resource counts stayed at
  the recording geometry plus the shared compositing quad across the sampled switches.

The author inspected dendrite/front/cast, composed, Cup, comparison and mobile captures. These
are rendering observations on this host; there was no audience study or general device-performance
test. The earlier catalogue-wide renderer sweep and preview generation were not repeated.
`live-preview.json` records the final port 5191 check; `comparison-final.png` and
`mobile-cast-final.png` show the completed live page. Updated capture scripts passed
`node --check`, and `git diff --check` found no whitespace errors.

### Tried and rejected

- More colour treatments: the maker explicitly asks for different ways of seeing growth.
- Invented vapor trajectories: these recordings contain attachment events, not a velocity field.
  The new views must reveal recorded timing and structure without fabricating that information.
- A long default history window made Growth Front resemble the complete crystal. Shortening the
  window separated the advancing tips visibly in the inspected stellar dendrite.
- A broad depth-smoothing kernel introduced crossing patterns on small Cup recordings. Removed;
  retain shallow cell caps and use supported full-float depth to avoid the half-float banding
  exposed by a nearly flat cap. Coarse recorded cells remain visible rather than inventing a mesh.

## Follow-up — optional graphs and MP4 export

Maker direction: add at least two optional interesting-stat graphs to the single view and a way
to export that view as MP4. Reuse this task branch/worktree; its opening tree is clean.

### Approach and done criteria

- Offer independently selectable **Attached sites**, **New attachments** and **Outward reach**
  graphs in focused mode. Synchronize the cursor/current values with playback and backward
  seeking; clicking a chart seeks. Preserve choices across crystal/view changes. Comparison
  stays focused on the four render treatments.
- Compute graph data off the UI thread from the exact decoded recording: total event count at
  each playhead, counts in equal one-percent recording intervals (seed reported separately),
  and maximum distance from the recorded origin in lattice units. Preserve exact current bounds
  using event indices/reach change points. Composed scenes count instances and use their scene
  origin/normalized recording clock. Do not call site counts mass or G-G ticks physical seconds.
  Label these as derived recording statistics, unvalidated model output.
- Add an export dialog with duration/resolution and include-visible-graphs options. Use browser
  WebCodecs and the maintained Mediabunny MP4 muxer to produce H.264/MP4 with explicit frame
  timestamps, complete growth and a final hold. Render clean video framing from the selected
  camera/style/window/light; preserve and restore the user's playhead/play state on success,
  cancellation or failure. Display progress and a cancellable operation, with an MP4 download.
- Keep export entirely local, with no upload, external server execution or NAS change. Bound
  duration/resolution/output memory; do not relabel another container as MP4. Unsupported
  encoding receives a useful UI error. Verify an actual downloaded file with FFprobe and inspect
  decoded frames, including selected graphs.
- Use independent focused controls for derived statistics, export timing and browser behavior.
  Run app build and the exact `npm test`: unlike the earlier render-only passes, this task adds
  computed readouts, so Rule 6's full-check boundary applies. No scientific gate or simulation
  is needed. Exercise graph toggles/scrub, export cancellation/restoration, a real MP4, mobile
  layout and a composed recording with the correct labels.

### Next step

Complete. Open **Graphs** or **Export MP4** below the animation in any single view at
`http://127.0.0.1:5191/dendrite-styles.html`. Viewing and reproduction instructions are in
`app/data/README.md`. No implementation or required verification remains for this request.

### Implementation and verification record

`growth-statistics.ts` computes checkpoint counts, maximum distance and exact reach change points
in the existing loader worker. `growth-graphs.ts` draws independently selectable graphs and
shares its drawing with MP4 export. The current interval counts only attachments that have
already appeared; the muted reference shows complete intervals. Direct sites and composed
instances have distinct labels, and the starting count is excluded from new attachments.
The graphs clear immediately during a source change. Click and keyboard scrubbing pause playback.

`growth-video.ts` loads pinned `mediabunny@1.55.7` only on export, following its official
[writing-media documentation](https://mediabunny.dev/guide/writing-media-files). It renders the
selected camera/style/window/light into clean video framing, adds any selected graphs, and
encodes explicit frame timestamps through WebCodecs into H.264/MP4. Resolution, duration and
bitrate constrain the in-memory export. Progress and cancellation remain responsive; success,
cancellation and unsupported-encoder failure restore the prior playback state. No source
recording, solver, scientific evidence or NAS payload changes.

The initial browser checks downloaded real MP4 files and independently counted the decoded
Radiating Dendrites composed scene. Final review then found an exact-percentage interval rounding
edge case; the regression now compares against the original checkpoint fractions. The final
browser rerun adds those percentage boundaries. `npm run build --workspace app` passed after
that correction (`out/growth-insights/build-final.log`). Exact `npm test` passed with canonical
Windows temporary paths: 143 files passed; 2,248 tests passed and 49 skipped, in 445.11 seconds
(`out/growth-insights/npm-test-final.log`, exit 0 in `npm-test-final.exit`). This includes the
Rule 7 scan, both typechecks and the independent statistics/timeline controls. The final prose
scan also passed (`out/growth-insights/rule7-final.log`). No scientific gate or simulation ran.

Final browser command (no app edits or dev reload during capture):

```powershell
$env:DENDRITE_STUDY_URL = 'http://127.0.0.1:5191/dendrite-styles.html'
node app/scripts/growth-insights-smoke.mjs
```

`out/growth-insights/browser-smoke.json` / `.log` report no unexpected browser errors. The
independent composed-source calculation matches nine playheads, including the corrected
percentage boundaries. At the final playhead it reports 5,140,734 instances and outward reach
202.8000085831387 lattice units from the scene origin. These are recording-derived quantities,
not validation evidence. Graph toggles, click/keyboard seeking, choices across source/view
changes, cleared loading readouts, comparison visibility, paused/running cancellation,
successful restoration, unsupported-encoder error and mobile layout all pass.

The same report records FFprobe results for downloaded `timeglass-with-graphs.mp4` (H.264,
1280 × 720, 4,726,864 bytes) and `crystal-cast-1080p.mp4` (H.264, 1920 × 1080, 2,659,837 bytes).
Both contain 300 frames at 30 frames/second and last 10 seconds; FFmpeg decoded each complete
stream without error. The author inspected decoded video frames, desktop graphs and mobile
graphs/export screenshots. These are observations on this Windows/Chromium host. The export
timing unit control separately covers all offered durations; actual full-file checks use the
shortest duration at both resolutions. `node --check app/scripts/growth-insights-smoke.mjs`
and `git diff --check` also pass.

The first exact `npm test` failed (`out/growth-insights/npm-test.log`): this host's inherited
`TEMP`/`TMP` resolve through the Windows short alias `HIL_AD~1`, which the existing evidence
guards correctly reject. The check also exposed a stale hardcoded progress date. The progress
test now requires one valid ISO date and permits the session date to advance, with missing,
duplicate and invalid-date controls; all scientific status and archive pins remain intact.
The final check sets both process-local environment variables to the canonical path before
running exact `npm test`:

```powershell
$env:TEMP = 'C:\Users\HIL_ADMIN\AppData\Local\Temp'
$env:TMP = $env:TEMP
npm test
```

The first canonical-path rerun (`npm-test-canonical-temp.log`) was stopped by this session before
completion to apply the interval-boundary fix; it is not a completed check. The subsequent
`npm-test-final.log` / `.exit` are the final check record. Evidence guards were not changed.

### Tried and rejected

- Physical growth-rate or mass labels: these recordings provide model attachment events and a
  replay clock; neither label is earned by counting sites per playback interval.
- Renaming WebM to MP4 or relying on screen-recording frame cadence: use actual MP4 muxing and
  explicit frame timestamps so the requested output format and full growth sequence are retained.
- Deferring the graph's local playhead update until animation repaint made a rapid keyboard seek
  use the previous click position. Update it synchronously before invoking the shared seek.
- `ceil(progress * 100)` moved exact percentage boundaries into the next interval when the
  multiplication rounded upward. Compare with the same checkpoint fractions used for sampling;
  independent controls cover every checkpoint and the immediately following partial interval.
- One preview smoke encountered a vanished dynamic chunk while build output was being replaced.
  The completed live-page smoke uses port 5191 without concurrent app edits; do not rebuild a
  preview's bundle while testing an open export dialog against it.
- Relaxing alias/junction evidence guards to accommodate a short Windows temporary path: use
  canonical process-local `TEMP` and `TMP` instead. A partial rerun is not full-suite evidence.

## Follow-up — Three Views and centered Crystal Cast

Maker direction: replace Growth Front with one synchronized multi-angle view: a large normal top
view, a smaller bottom-right three-quarter branch close-up, and another useful angle at top right.
Center Crystal Cast. Reuse the existing clean task worktree/branch at `b54fd94`.

### Approach and done criteria

- Replace the third treatment with **Three Views**. Keep a large top view left, a low-angle whole
  crystal view at upper right, and a magnified branch detail at lower right. Use the existing
  arrival-colour rendering and recorded geometry; the new contribution is the simultaneous
  spatial comparison. Add clear pane labels and show which region is magnified.
- Frame a deterministic branch region from the selected recording. Keep the framing stable
  during growth/backward seeking so magnification does not chase individual attachment events.
  Retain real recorded Z geometry and use oblique cameras to expose height. No invented layers,
  physical thickness readout, or change to derived graph statistics.
- Preserve source selection, synchronized playhead, graphs, comparison, camera interaction and
  MP4 export. The exported view must include the three camera panes. Remove the retired recent
  window control and its obsolete rendering branch. Reuse one recording geometry.
- Correct Crystal Cast's offscreen viewport scaling. Three.js `setViewport` multiplies by the
  renderer pixel ratio even when the caller supplies already-scaled target dimensions; use the
  render target's own pixel viewport. Verify centering at device ratios 1, 1.5 and 2, including
  scrolling, resized screens, comparison and export.
- Run focused camera/layout/presentation tests, `npm run typecheck`, Rule 7, app build and a live
  browser smoke with inspected dendrite, composed/axial and mobile captures plus a real MP4.
  This is camera/rendering work only: no full scientific suite, gate or new growth run is needed.

### Next step

Complete. Open `http://127.0.0.1:5191/dendrite-styles.html?style=2&crystal=sweep-t1-sharp`
for the synchronized panes. Drag a pane or adjust **Detail zoom**; switch to **Crystal Cast**
for the centered relief. Graphs and MP4 export work with both. No implementation or required
verification remains. `app/data/README.md` contains the current viewing instructions.

### Implementation and current checks

`three-views.ts` computes stable framing from complete recorded positions and shares the pane
rectangles and overlay drawing between interactive and exported views. The detail target is an
actual recorded site near the selected side of the crystal; each pane has independent drag/reset
angles. Top-view marker coordinates are projected from that target. Camera magnification changes
neither recorded positions nor event visibility. The low-angle whole-crystal view fits the rotated
bounding box with margin. On narrow tall screens, the two insets move below the top view.

The main player renders all panes using one event geometry and the existing Timeglass shaders.
Its transparent overlay carries pane labels and the detail marker; MP4 frames composite the same
overlay. The retired recent-window control, recent-union shader branch and its obsolete unit test
are removed. No graph computation or source decoder changed. Existing export controls still
operate on the complete selected composition.

The pre-fix diagnostic `out/three-views/cast-before.json` sampled the original sharp dendrite at
its final playhead: at device scale 1.5 the dark-pixel bounding-box center was
`[0.720703125, 0.447265625]` in normalized viewport coordinates and the shape touched the right/top
edges; device scale 1 was centered. Three.js `setViewport` multiplied the already-scaled target
dimensions by the renderer ratio. Removing that call uses the render target's physical viewport
and corrects the offset; no snowflake geometry is translated to hide it.

`npx vitest run app/test/three-views.test.ts app/test/dendrite-data.test.ts app/test/growth-study-data.test.ts`
passed nine tests (`out/three-views/focused-tests.log`), including independent Three.js projection
of bounding-box corners into fitted camera extents, disjoint contained pane rectangles and an
unchanged recorded detail target. `npm run typecheck`, `npm run lint:rule7` and
`npm run build --workspace app` passed (`typecheck.log`, `rule7.log`, `build.log` in that directory).
No exact `npm test`, scientific gate or growth run is required or launched for this render-only pass.

`node app/scripts/three-views-smoke.mjs` passed against the built preview on port 5192
(`out/three-views/browser-smoke.json` / `.log`): nine Crystal Cast centering samples across device
scales 1, 1.5 and 2, in focused, resized/scrolled and comparison layouts. At device scale 1.5,
the corrected focused dark-pixel bounding-box center is `[0.49609375, 0.4921875]`, with visible
margin on every side. The sampled pixel mask excludes the outer rasterized viewport seam;
the original clipped shape would still touch the measured interior edge.

The same report verifies top, profile and detail panes on the original sharp dendrite, named
Stellar Dendrites, Cups and composed Radiating Dendrites, including exact repeated image hashes
after backward seeking. Independent pane dragging/reset, zoom, gallery retention, graphs,
bounded geometry reuse, mobile layout and reduced motion pass, with no unexpected browser
errors. Its downloaded `three-views-with-graphs.mp4` is H.264, 1920 × 1080, 300 frames at 30 fps,
10 seconds, 8,559,713 bytes; FFmpeg decodes the complete stream without error. Playback/playhead
and pane angles restore after export. The author inspected its decoded `export-frame.png`,
desktop dendrite/Cup captures, centered Cast and the actual phone `mobile-viewport.png`.
These are presentation observations on this host, not audience or scientific validation.

The supplementary actual Cast export from a device-scale-2 page is recorded in
`out/three-views/cast-export.json`: H.264, 1280 × 720, 300 frames, 10 seconds, 1,700,696 bytes.
FFmpeg decoded the complete file; `cast-export-frame.png` shows the final crystal centered in
its video region. It used the normal Export MP4 dialog on the built page, with graphs closed,
10-second duration and the default 720p size; the paused playhead restored after download.

### Tried and rejected

- Additional colour palettes do not implement the requested spatial comparison.
- Exaggerating recorded height would change the geometry's meaning. Use magnification and
  oblique viewpoints; thin model crystals remain thin.
- Full-page screenshots can misplace a fixed WebGL canvas relative to scrolled DOM content.
  Inspect the actual viewport instead; the current smoke captures mobile screenshots that way.
- The first resized centering sample included an antialiased viewport edge as dark crystal.
  Exclude the narrow raster seam and continue requiring the crystal to stay inside that inset;
  do not loosen the centering/cropping bounds to accept the old pixel-ratio error.

## Follow-up — branch camera journey and pane cropping

Maker direction: fix the branch-detail pane escaping its web frame (MP4 looks correct), remove
the static low angle, and use a camera movement that zooms into the center, travels outward
along a branch and circles its tip. Keep the top and fixed detail views. Reuse this task worktree
at `b875b3a`; opening status is clean.

### Approach and done criteria

- Replace the upper-right low-angle camera with **Branch journey**: smoothly approach the
  center, follow the selected branch outward, then orbit its growing tip. Derive a deterministic
  camera path from recorded positions/timestamps, tied to the shared playhead; pause, backwards
  seeking and MP4 must reproduce the same pose. The path is a camera choice, not simulated motion.
- Keep the overview and branch close-up, independent pane turns, detail zoom and optional graphs.
  Preserve original geometry, attachment visibility, graph quantities, reduced-motion behavior
  and export restoration. No invented height or scientific readout is introduced.
- Size the on-screen drawing buffer from the displayed canvas rectangle, not `innerWidth`.
  The reproduced scrollbar-gutter case in `out/branch-flight/crop-before.json` has a 1412-pixel
  displayed canvas but renders using 1440 CSS pixels, causing the supplied screenshot's bleed.
  Keep explicit frame dimensions for export, and test actual pixels in pane gutters while using
  reserved scrollbars, fractional device ratios, resize/scroll, comparison and mobile layouts.
- Run focused camera-path/layout tests, typecheck, Rule 7, app build and a representative browser
  smoke. Inspect the journey at each phase and a decoded exported sequence. Product checks only:
  no full scientific suite, new simulation, solver/source change or gate.

### Next step

Open `http://127.0.0.1:5191/dendrite-styles.html?style=2&crystal=sweep-t1-sharp` and press Replay
to review the complete center-to-tip journey. The implementation and requested product checks are
complete. `app/data/README.md` describes the controls and reproduction command. No solver or
scientific work is pending under this request.

### Implementation and verification

`branch-journey.ts` builds a smoothed camera track along the branch selected by the fixed detail
view. Camera travel follows recorded outward extremities; approach and orbit use eased transitions
on the shared playhead. Both the live viewport and exported frame call the same pose function and
draw the same stage caption. The static profile camera and its fit helper are retired. Geometry,
recorded height, event visibility and graph calculations are unchanged.

Rendering now uses the displayed canvas rectangle, including its offset, while export retains its
explicit frame dimensions. `out/branch-flight/visual-check.json` records zero colored pixels in
the reproduced divider sample, compared with 996 in `gutter-before.json` there. Its center, travel
and orbit stills were inspected in the actual viewport.

`npx vitest run app/test/branch-journey.test.ts app/test/three-views.test.ts app/test/dendrite-data.test.ts`
passes eight tests (`out/branch-flight/focused-tests.log`): branch selection rejects a farther site
outside its cone, source coordinates/ticks remain unchanged, the journey reaches the tip and
completes an orbit, phase seams are continuous, backwards seeking reproduces the pose, and pane
rectangles remain contained and disjoint. `npm run typecheck`, `npm run lint:rule7` and
`npm run build --workspace app` pass (`typecheck.log`, `rule7.log`, `build.log` in that directory).
No full scientific suite or solver run was needed or launched.

`node app/scripts/three-views-smoke.mjs` passes against the built preview on port 5192
(`out/branch-flight/browser-smoke.json` / `.log`). All 16 gutter samples contain zero colored pixels,
covering reserved scrollbars at device scales 1, 1.5 and 2, resized/scrolled and comparison layouts,
graphs, restored rendering after export and phone layout. The report includes nine passing Cast
centering samples and 36 camera samples across the original sharp dendrite, named Stellar
Dendrites, Cups and composed Radiating Dendrites. Backward seeks reproduce the same camera pose
and pixel hashes; pane turns/reset, detail zoom, gallery retention and reduced motion pass, with
no unexpected browser errors.

The same UI check downloaded `out/branch-flight/three-views-with-graphs.mp4`: H.264, 1920 × 1080,
300 frames at 30 fps, 10 seconds, 9,080,998 bytes (`browser-smoke.json`). FFmpeg decodes the full
stream successfully. The author inspected decoded center-approach, branch-travel and tip-orbit
frames (`export-1.6.png`, `export-3.6.png`, `export-6.56.png`, `export-7.36.png`), desktop crystal
samples and the phone viewport. The paused playhead, journey pose, pane angles and correctly sized
web canvas restore after export. These are presentation checks on this host, not scientific or
audience validation.

### Tried and rejected

- The static low angle is explicitly rejected by the maker; replace its behavior, not its palette.
- The earlier headless smoke had no reserved scrollbar gutter, so its aligned screenshots did
  not cover the maker's web layout. Test a real reserved gutter and use displayed canvas bounds.

## Follow-up — two views and closer branch detail

Maker direction: remove Branch Journey and zoom the branch detail in a bit more. Reuse the clean
task worktree at `4b45d4e`. This is a bounded presentation change.

### Approach and done criteria

- Remove the journey camera, path construction and captions. Rename the treatment **Two Views**.
  Keep the large top view and expand branch detail into the right column; stack them on phones.
- Increase default detail zoom from 3.2 to 4, retaining the existing adjustment control, stable
  recorded target, pane dragging/reset, synchronized growth, graphs and MP4 composition.
- Preserve the displayed-canvas cropping fix and source geometry/chronology. No solver or
  scientific readout changes, and no full scientific suite.
- Update focused pane tests and the browser smoke, run typecheck, Rule 7 and the app build,
  then inspect the browser composition and an actual MP4. Update current usage/state records.

### Next step

Open `http://127.0.0.1:5191/dendrite-styles.html?style=2&crystal=sweep-t1-sharp` to use **Two Views**.
The requested work and product checks are complete; **Detail zoom** remains adjustable.

### Implementation and verification

The treatment is now **Two Views**, with top and detail cameras only. Detail fills the right
column on desktop and the lower row on phones. Its default zoom is 4 in
`app/dendrite-styles.html`; the control remains adjustable. The journey implementation and its
obsolete tests are removed. Both web and MP4 use the same pane layout and labels.

`npx vitest run app/test/three-views.test.ts app/test/dendrite-data.test.ts` passed in the terminal.
`npm run typecheck`, `npm run lint:rule7` and `npm run build --workspace app` passed, with logs in
`out/two-views/typecheck.log`, `rule7.log` and `build.log`. The author inspected the sharp dendrite
browser capture. No full scientific suite or solver run was needed or launched.

`node app/scripts/three-views-smoke.mjs` passed on the built preview at port 5192
(`out/two-views/browser-smoke.json` / `.log`). It verifies the two remaining cameras, closer default
zoom, pane turns/reset, backward seeking, graphs and export restoration on representative direct,
axial and composed recordings. All 16 gutter samples have zero colored pixels; reserved scrollbars,
display scaling, resize/scroll, comparison and mobile checks pass, with no unexpected browser
errors. Cast's nine sampled centering checks remain green in that report.

The actual UI export `out/two-views/two-views-with-graphs.mp4` is H.264, 1920 × 1080, 300 frames
at 30 fps, 10 seconds and 8,420,401 bytes (`browser-smoke.json`). FFmpeg decoded the full stream,
and the author inspected its `export-frame.png` plus the desktop and phone browser captures.
These are presentation checks, not scientific validation.

### Tried and rejected

- The maker has rejected Branch Journey. Remove its camera and computation instead of keeping
  a hidden third pane or leaving an empty space in the composition.

## Follow-up — shared color-age legend

The maker requested the same color-age legend at the bottom right. This trivial presentation fix
replaces Two Views' pane-layout key with Timeglass's existing **EARLY → LATE** label and shared
gradient class, and removes the unused layout-key styling. Rendering and MP4 are unchanged.

`npm run typecheck` and `npm run build --workspace app` pass (build log:
`out/two-views-legend/build.log`). A built-page browser check compares the rendered label and
gradient against Timeglass at desktop and phone widths, with no page errors or horizontal overflow
(`out/two-views-legend/browser-check.json`). The footer screenshot was visually inspected.

### Next step

Open the Two Views link above to see the matching legend. Publication now follows the approved
GitHub-app route below; do not restart the stale Git Credential Manager push.

### Tried and rejected

- The pane-layout key does not explain the arrival colors. Reuse the existing Timeglass legend.

## Follow-up — publish through the connected GitHub app

The maker explicitly approved publishing the local changes as new commits through the connected
GitHub app. Its Git-data tools cannot retain the original commit metadata/IDs. The target remains
`billatgameology/snowflake`, branch `fix/animation-queue-windows-spawn`; main is not a publication
target. The source worktree opens clean at `cd4ca7b`.

### Approach and done criteria

- Stop only the previous stalled push owned by this session. Preserve the original local history
  under a backup branch before aligning the task branch with the new published commit IDs.
- Inventory committed objects from the shared ancestor. Upload exact blob bytes and file modes,
  reconstruct each tree and require its SHA to equal the corresponding original local tree SHA.
  Replay commit messages and parent order, adding the original commit ID for traceability.
- Create the remote branch only after its ordered commit chain is complete. Refuse to overwrite
  an unexpected remote branch. Record the original-to-published mapping and verify the final
  published tree matches the local tree before updating local tracking.
- This is source publication, with no solver execution or implementation changes. Use Git object
  checks and focused prose/state checks; do not repeat scientific suites or animation exports.

### Next step

Continue work on `fix/animation-queue-windows-spawn` using its published commit IDs. Use
`docs/animation-github-publication.json` to resolve the original IDs in historical plan records.
Original local history is retained under `backup/animation-before-github-publication-20260906`.
The stalled Credential Manager push has been stopped; publication uses the approved GitHub app.

### Publication record

The source inventory in `out/github-publication/inventory.json` contains the requested commits
and the publication-plan commit. Every uploaded blob's returned SHA matches its local Git object
(`uploaded.json` there). Each reconstructed tree matches the original tree SHA, and each created
commit was independently read back to check its tree and remapped parent (`mapping.json` there).

The durable [commit map](../animation-github-publication.json) records all 20 source commits through
that plan, their original author/committer metadata, replacement IDs and identical tree SHAs.
The source head `52f9b18e7d08b4480ac91b237bedd919f51ddc1f` maps to
`0ae6ef5948c5c09f4bea2bbcf8a1f914ed565784`, sharing tree
`3f220d514d2f6c907d85cbd9014308c2b475d4d9` (copied from that map). GitHub's branch ref was read back
at that replacement head. The following verification-record commit carries its own Original-Commit
trailer rather than trying to include itself in this map.

The API route changes commit IDs and GitHub-generated authorship/timestamps, as approved. Original
commit messages are preserved with an Original-Commit trailer, and the local backup retains the
original Git history. This is source publication with no changed model code or scientific claim;
no solver run, scientific suite or new animation export is required.

### Tried and rejected

- The command-line push remained blocked in Git Credential Manager despite the separate GitHub
  app connection having repository write access. The maker chose API publication with new IDs.
- Recreating only the final snapshot would lose the requested intermediate commits. Preserve the
  ordered sequence and verify every reconstructed file tree.

## Follow-up — integrate main and merge the animation PR

The maker requests fetching main, combining both branches, creating a PR to main and merging it.
Continue in this existing isolated animation worktree. Merge fetched `origin/main`, retaining its
catalog, volume renderer, education publication and scientific records together with the completed
visual studies. Resolve shared Vite registration and progress-index changes explicitly.

### Approach and done criteria

- Commit this integration plan before merging; preserve both histories and existing backups.
- Inspect conflicts and the resulting diff. Run exact `npm test` for the combined scientific
  readout / incoming solver and evidence boundaries, plus the app build and representative browser
  smoke for shared app integration. No scientific gate or new production run is authorized.
- Publish exact verified Git trees through the already approved GitHub app, create the PR, inspect
  applicable GitHub checks, and merge with the tested head pinned. Fetch and verify main. Existing
  main failures reproduced independently are recorded below, not described as a passing suite;
  no required status check or branch protection may be bypassed.
- Done when the PR is merged and its animation head is reachable from remote main.

### Next step

[PR #11](https://github.com/billatgameology/snowflake/pull/11) is the integration and merge record.
If resuming this session, read its current state and Tests check before any merge attempt; the
maker has already requested merging. The baseline comparison below records the known failures.
After merge, fetch `origin/main` and use
the visual-study viewing instructions above. No further product implementation is planned.

### Integration record

Fetched main at `9722561524afc30e171b23089b06912742d2b9b8`. Vite retains both services and
page entries, PROGRESS combines both workstreams with main's newer education state, and the
progress test retains the valid-date check rather than restoring a fixed historical date.
The incoming catalog service eagerly opened ignored Compose scenes during configuration load,
blocking this checkout's build. Scene loading and component-allowlist validation now run on
scene requests; tracked index construction needs no generated output. Hash checks remain intact.
The fresh-checkout regression covers index access plus missing/unknown asset refusal.

`npx vitest run app/test/named-crystal-catalog-service.test.ts` passes (`out/main-integration/catalog-test.log`),
and `npm run build --workspace app` passes (`build-final.log` there). The representative built-page
smoke renders all four styles, checks the matching age legends and phone width, and reads both
library indexes with unknown-scene refusal (`browser-smoke.json` there). Two Views was visually
inspected. The new loopback integration server uses port 5193 (`dev-server.pid` there).
The full check command is exact `npm test`, with process-local `TEMP` and `TMP` set to
`C:\Users\HIL_ADMIN\AppData\Local\Temp`; its output and exit status are
`out/main-integration/npm-test-final.log` and `npm-test-final.exit`. The PR's Tests check records
the independent Ubuntu/Node 24 check and its result. These records, rather than this pre-merge
note, determine whether the tested head is ready to merge.

### Full-check result and existing-main comparison

Exact `npm test` exited 1: 10 failed / 156 passed files, 35 failed / 2,308 passed / 49 skipped
tests (`out/main-integration/npm-test-final.log`, `npm-test-final.exit`, copied at write time).
All failing files are older named-catalog planning/acceptance tests. A detached checkout of
`9722561524afc30e171b23089b06912742d2b9b8` at `out/main-integration/main-baseline` reran those
same ten files: 35 failed / 12 passed. `main-baseline-test.log` records the exact failures, and
`baseline-comparison.json` confirms the complete failing-test-name sets are equal. The implicated
scripts and catalog inputs are unchanged from main. Failures include initial catalog-route/empty
slot assumptions after final acceptance, and Windows checkout bytes against registered pins.

Main's existing [Tests run](https://github.com/billatgameology/snowflake/actions/runs/33983406013)
also failed before this PR, including the missing-scene startup issue corrected here. GitHub's
main-branch response reports `protected: false` and no required status contexts. The requested
merge proceeds with the independently reproduced existing failures documented; it does not
claim full-suite success, disable checks, change scientific protocols or bypass protection.
The PR workflow remains visible, and main's normal workflow runs after merging. Repairing the
older catalog-test fixtures and byte preservation is a separate workstream; start with the
failed files named in `baseline-comparison.json`, not by changing accepted catalog results.

The integration-plan tree and combined merge tree were recreated through the connected GitHub
app with exact SHA equality and the merge commit's two parents read back. Local integration
commits are retained under `backup/animation-main-integration-original-20260906` before aligning
with the published branch; the earlier animation backup and tracked commit map remain intact.

### Tried and rejected

- Replacing the progress index wholesale with this older branch would restore stale education
  status and omit the completed named catalog. Combine the records using main's newer state.
- Eagerly opening every generated Compose scene during Vite configuration fails without the
  producer's ignored output (`out/main-integration/build.log`). Validate a scene when requested.
  The initial full check was stopped for this correction; it is not passing-suite evidence.
