# Plan — dendrite visual studies

- **Phase:** maker-directed pre-Phase 7 presentation exploration; no phase gate
- **Status:** optional graphs and MP4 export in progress; gallery and four views complete
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
four at the same tick. Growth Front's **Recent window** control isolates shorter or longer
intervals; Crystal Cast's **Move the light** control changes relief lighting while paused or
playing. Reduced-motion visitors start on a paused still. The replacement follow-up at the end
of this plan supersedes the original Darkfield and Chronograph treatments.

| Treatment | Visual use of the recording | Suggested role |
|---|---|---|
| Ion Bloom | Bright mint light on recent attachments, older ice fades to blue | Opening growth shot; the author's preferred visual hook |
| Timeglass | Persistent arrival-time colour with narrow temporal bands | Show that the shape contains a history |
| Growth Front | Recent attachments drawn separately from a faint current footprint | Follow advancing tips and quiet regions without retaining the whole bright body |
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

Implement worker statistics, chart controls and frame-based export; check recorded quantities and
the downloaded MP4, then update the viewing instructions and completion record.

### Tried and rejected

- Physical growth-rate or mass labels: these recordings provide model attachment events and a
  replay clock; neither label is earned by counting sites per playback interval.
- Renaming WebM to MP4 or relying on screen-recording frame cadence: use actual MP4 muxing and
  explicit frame timestamps so the requested output format and full growth sequence are retained.
