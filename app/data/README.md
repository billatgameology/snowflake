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
