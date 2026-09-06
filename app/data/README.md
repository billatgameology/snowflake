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
