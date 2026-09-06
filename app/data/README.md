# Dendrite presentation asset

`dendrite-study.bin` is a project-owned product asset for `dendrite-styles.html`, not
scientific gate evidence. It contains the unchanged attachment-event payload from
`out/growth-assets/sweep-t1-sharp-growth-v1.bin`, with a smaller display-only JSON header.
No media from a photographer or research paper is included.

Original SHA-256: `8615928490192af7442b27bb7c2a6731c501a148774e0f95b1ef8c1d8fa15073`.
The source header records 220,982 sites, a 19-site seed and final tick 7,438, with
`domain-contact` termination. It is an aesthetic example, not boundary-independent evidence.
The prepared file is 1,768,058 bytes (copied from
`out/dendrite-styles/asset-preparation.json` at creation).

Repackage the selected source from the repository root:

```text
node app/scripts/prepare-dendrite-study.mjs out/growth-assets/sweep-t1-sharp-growth-v1.bin
```

The packager checks the selected source digest before writing. The format is a little-endian
u32 JSON-header length, that many UTF-8 bytes, then `(u32 flatIndex, u32 attachTick)` event
pairs. Dimensions and integer centre retain the original triangular-lattice embedding.
The browser checks bounds, uniqueness and ordered timestamps before rendering.

The original dendrite remains available from this tracked asset without the source file,
website sibling, a running solver or access to the non-served scientific NAS collection.

## Selectable growth library

`growth-library.json` registers the existing approved website growth set plus original Run B,
with source digests and display metadata read from those existing event files. The divergent
Fig. 6 regrowth stays excluded under the maker's earlier decision.

`app/growth-study-assets.ts` prepares the same compact presentation format on demand in
development and emits it into `app/dist/growth-studies/` during a product build. Only named,
digest-matched local files are accepted: fleet assets in `out/growth-assets/`, or the existing
website copies in the sibling `snowcrystal_website/public/growth/library/`. Original Run B is
read from that sibling's `public/growth/run-b-growth-v1.bin`.

No source binary is copied into Git by the library extension. The build is reproducible product
scratch; the fleet source bytes already have the recorded scientific-collection preservation
path. The scientific NAS serving policy remains unchanged. The plugin emits only the compact
header and unchanged event payload, with no workstation paths or source-command metadata.

Missing sources are marked unavailable in the selector; the original packaged dendrite remains
usable in a fresh checkout. To include a new approved replay later, add its exact identity and
digest to the manifest. The browser downloads and decodes only the selected animation.

## Newer named catalogue

`named-growth-library.json` imports the accepted named catalogue and its direct/Compose reviews
from the separate producer worktree. It records the exact three source-document digests and each
accepted web/scene identity. Regenerate it using
`node app/scripts/import-named-growth-studies.mjs ../snowflake-named-catalog`.
The two manifests combine in the selector; named types appear first, with a collection filter.

`app/named-growth-study-assets.ts` checks exact file digests and accepts only registered growth
binaries or scene JSON below the final-resolution/Compose product directories. It tries the
current repository, then sibling `snowflake-named-catalog`. For an already restored local producer
tree, set `GROWTH_STUDY_CATALOG_ROOT` to the directory containing its `out/named-crystal-catalog/`.
It never serves the raw source paths or opens the NAS collection through the browser.

Direct recordings use the existing compact format. A `growth-study-scene-v1` presentation file
has the same u32 JSON-length prefix, a header containing the source-scene digest, unique component
byte lengths, component indices/transforms/phase offsets and camera angles, followed by each unique
compact direct payload once. Scientific locators and source commands are omitted. The worker
applies the explicit XYZ Euler transforms at unit lattice Z scale and merges instance arrivals on
a normalized scene clock derived from `phaseOffset + (1 - phaseOffset) * attachTick / finalTick`.
Each arrival is adjusted to the first representable float64 progress where the original player's
local integer-tick test passes; directly inverting that test can differ by a rounding unit.
CPU seeking retains float64 scene times; shader attributes use float32 only for artistic colour
and time displacement. No common model-tick or physical-time meaning is assigned to that clock.
Composed views are labeled beside the animation, including when the details are collapsed.

Build outputs and browser captures are reproducible product scratch. No source binary or
scientific state is rewritten, and the producer catalogue's original payload-size measurements
continue to describe its original web assets, not the downstream renderer's in-memory geometry.

## Visual gallery previews

The **Browse crystals** button opens a searchable thumbnail gallery, with collection and shape
filters and dendrites first. `dendrite-styles.html?browse=1` opens the gallery before downloading
any full growth recording. A card loads its recording in the current view; reopening the browser
preserves filters and scroll position. Missing recordings remain visible as unavailable.

`growth-previews/` contains tracked project-owned PNG derivatives from the existing Timeglass
renderer at the final attachment event. Its `index.json` binds each image's source identity,
PNG digest, byte length and render recipe. The product handler serves only registered,
digest-matched previews and includes them in builds. These are artistic navigation stills, not
new simulations or scientific evidence; no outside media is included.

To regenerate after a deliberate render-recipe change, build the app, start its preview server
on port 5192, then run `node app/scripts/growth-study-thumbnails.mjs`. It captures at 384 × 320
and checks source identity, event count and nonempty pixels. `DENDRITE_STUDY_URL` can point to
another running capture page. Existing preview bytes need no regeneration for gallery UI edits.

Earlier-library shape buckets come from identity-matched entries in the producer's existing
visual audit; `growth-library.json` records that document's digest and navigation-only scope.
Regenerate those display buckets with `node app/scripts/import-growth-browse-shapes.mjs`
(optional argument: the audit JSON path). Named entries use their accepted catalogue names.

## Two Views and Crystal Cast

The current views are Ion Bloom, Timeglass, Two Views and Crystal Cast. **Two Views** shows a
large top view beside a magnified branch detail. Both show the same recorded moment with
Timeglass arrival colours, with the same **EARLY → LATE** gradient legend. A marker on the top
view identifies the detail center. Drag a pane
to turn its camera independently, double-click to reset that pane, and use **Detail zoom** to
adjust magnification (default 4). On narrow phone screens the detail sits below the top view.

The close-up frames a fixed region as growth reaches it. Its center is a recorded site near one
branch, selected from the complete recording; the target remains stable during playback and
backward seeks. `three-views.ts` shares pane layout and labels between the player and MP4 export.
Branch Journey has been removed. Recorded Z height is preserved. On-screen rendering uses the
canvas's displayed bounds so pane cropping stays aligned when the browser reserves a scrollbar
gutter.

Crystal Cast reconstructs an artistic screen-space relief with a **Move the light** control.
`app/src/growth-sculpture.ts` projects the same recorded geometry into a bounded shared mask and
composites surface bevels and shadows. Cell caps and lighting are display choices, not molecular
geometry or physical ice optics. Small low-resolution recordings retain visible lattice cells.
Its render target uses its own physical-pixel viewport, keeping the crystal centered when display
pixel density changes. The retired recent-window and time-depth controls are removed.
Ion Bloom, Timeglass and the existing Timeglass gallery previews retain their rendering recipe.

Run `node app/scripts/three-views-smoke.mjs` against the built preview on port 5192 for camera,
centering, mobile and actual MP4 checks; `DENDRITE_STUDY_URL` can select another running page.
The older `growth-structure-smoke.mjs` entry point delegates to this current check. Captures and
logs under `out/two-views/` are reproducible product scratch, not scientific evidence;
`out/three-views/` preserves the initial three-camera checks, and `out/branch-flight/` preserves
the retired journey checks.

## Optional graphs and MP4 export

In any single view, open **Graphs** below the animation and select any combination of:

- **Attached sites**: how many recorded sites have appeared by the current playhead.
- **New attachments**: additions during the current one-percent interval of the recording,
  excluding the sites already present at the start. The current interval fills as it plays.
- **Outward reach**: the furthest attached site from the recorded origin, in lattice units.

The cursor and values follow playback and backward seeking. Click a graph to scrub, or focus it
and use the arrow keys. Graph choices persist while switching crystals and views. Composed
scenes report instances and distance from their scene origin, on the normalized scene clock.
The muted trace shows the full recording as a reference. Counts are not mass and recording
intervals are not physical time. These are derived, unvalidated model-recording statistics.

**Export MP4** creates a complete growth cycle using the current view, camera and rendering
controls. Choose a total duration of 10, 20 or 30 seconds and 720p or 1080p; optionally include
the visible graphs beside the crystal. The final two seconds hold the completed shape. Export
uses H.264 in a real MP4 container at 30 frames per second, with fixed frame timestamps rather
than the screen's playback cadence. A download starts when it finishes; **Save MP4 again**
remains available in the dialog. Cancelling or completing restores playback and the playhead.
Encoding happens on the device and requires browser H.264 encoding support; an unsupported
browser receives a useful error. No animation data is uploaded.

`growth-statistics.ts` derives checkpoint samples and exact reach change points in the loader
worker. `growth-graphs.ts` shares graph drawing between the screen and exported video.
`growth-video.ts` loads the pinned Mediabunny encoder/muxer integration only when exporting.
Run `node app/scripts/growth-insights-smoke.mjs` against the built preview on port 5192 for
graph interactions, independent composed-recording statistics, cancellation/restoration,
mobile layout and decoded 720p/1080p MP4 checks. Set `DENDRITE_STUDY_URL` for a different page;
the smoke requires FFmpeg/FFprobe on PATH. Outputs are local product scratch under
`out/growth-insights/`, not scientific evidence.
