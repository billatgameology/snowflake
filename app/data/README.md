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

The live page needs only this tracked asset. It does not need the source file, the website
sibling, a running solver, or access to the non-served scientific NAS collection.
