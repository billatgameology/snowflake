# Named snow-crystal local gallery

**Status:** active  
**Registered:** 2026-08-31  
**Worktree:** `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog`  
**Branch:** `feature/named-crystal-catalog`

## Goal

Present the completed 99-animation named snow-crystal catalog as a clear local website. The page
must make all 35 taxonomy rows visible, show the three accepted variants for each of the 33 included
types, identify the 22 direct and 11 Compose routes, keep Rimed/Graupel visibly excluded, and let the
maker play the actual less-than-20,000,000-byte growth payloads rather than only inspect Markdown.

## Approach

1. Add a dedicated multi-page Vite entry and a small TypeScript gallery renderer with search and
   route filters, three variant cards per type, payload/driver metadata, and an in-page player modal.
2. Add a development-only, loopback-only catalog service. It reads the strict tracked catalog plus
   the exact final direct/Compose reviews and creates an explicit allowlist for the 99 previews,
   decoder-verified growth payloads and scene manifests. It must never expose a general `out/` path.
3. Serve Compose scenes after rewriting only their component URLs to allowlisted content-addressed
   growth routes. Create one-component direct scene wrappers with the truthful
   `direct-growth-recording` disclosure, decoded-event bounds and exact review-bound asset/science
   identities.
4. Extend `growth-scene-v1` disclosure parsing/player copy to distinguish direct growth from
   composed visualization. Existing Compose files retain their current meaning and bytes.
5. Add focused service/parser/page tests, typecheck, app build, Rule 7 and a live Playwright smoke
   that opens the gallery and plays one direct and one Compose animation.

## Done when

- `/named-crystal-catalog.html` renders counts of 35 taxonomy rows, 33 included, 99 animations,
  22 direct, 11 Compose and two exclusions from the strict tracked catalog.
- Every included row shows lower/baseline/upper preview cards and exact variation/payload metadata.
- A direct card and a Compose card both load and animate in the existing Three.js player.
- The local service refuses unknown entry IDs, path traversal and files not bound by the catalog and
  final reviews; the existing blanket Vite `out/` denial remains unchanged.
- Focused tests, both TypeScript projects, the app production build, Rule 7, diff check and the live
  browser smoke pass.
- The loopback dev server is running and the page is opened for the maker.

## Out of scope

- Public deployment, NAS publication, copying artifacts into another repository, or changing the
  existing `snowcrystal_website` library.
- New animations, solver changes, scientific claims, or changes to the completed 99/99 catalog.
- Serving full scientific states or frame bundles through the browser; playback uses only the
  accepted web payloads.

## Tried and rejected

- **Serve the repository root with a generic static server.** Rejected because it would expose
  unrelated `out/`, research and repository files instead of the exact catalog surface.
- **Show only the generated Markdown table.** Rejected because it does not provide the requested
  visual gallery or play the animations.
- **Describe a one-component direct animation as composed visualization.** Rejected because the
  catalog deliberately distinguishes direct growth from Compose; the player disclosure must retain
  that distinction.
