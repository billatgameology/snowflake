# Plan — Catalog snowcrystals.com visual resources

- **Phase:** Phase 0 — Ground truth (reading, no project code)
- **Status:** done
- **Started:** 2026-07-14
- **Last touched:** 2026-07-14 by Codex

## Goal

Capture snowcrystals.com's relevant video resources as a durable, source-linked research index,
and preserve a small set of useful, clearly attributable reference photographs locally so later
scientific and visual-design work can trace every asset back to its original page.
The 2026-07-14 extension also preserves one highest-available local copy of each distinct movie.

## Done when

Work through §2.8. Done when the exit criteria at the end of §2.8 hold. Timebox it (2–3 focused weeks); the monograph is a reference, not a gate.

This plan is only one supporting task within that broader Phase 0 gate. It is complete when the
site's discoverable video titles and links are recorded in one Markdown file, any downloaded
reference photographs have stable filenames and source-page/asset attribution in that file,
and the recorded links and local files are checked.

## Approach

Navigate from the site's visible menus and index pages, prioritizing its video and snow-crystal
photography sections. Record canonical page or media links and on-site titles. Download only a
small, research-relevant photo set rather than mirroring galleries, and preserve both the source
page URL and direct image URL for provenance.

## Steps

- [x] Inspect the site's visible navigation and identify video/resource sections.
- [x] Record each relevant video title and canonical link in a research Markdown index.
- [x] Select and save a small set of useful photographs with descriptive filenames.
- [x] Verify saved files, source links, and documentation; update project state.
- [x] Download one highest-available version of each of the 10 distinct movies.
- [x] Record local filenames, byte sizes, SHA-256 checksums, and source URLs; verify all MP4s.
- [x] Rename all preview stills to begin with the corresponding source movie ID, update the
  index, and verify that no old or broken paths remain.

## Out of scope

- Mirroring the entire site or its full photo galleries.
- Downloading redundant lower-resolution variants or re-hosting the archived videos publicly.
- Treating visual inspection as evidence that any Phase 0 scientific exit criterion holds.
- Changing the charter, solver plans, or implementation code.

## Tried and rejected

- An interactive in-app browser connection was unavailable in this session. Direct inspection of
  the public HTML exposed the same site navigation, link targets, descriptions, and image assets,
  so the catalog was built from those canonical pages instead.
- Mirroring the site's full photo galleries was rejected: it would add dozens of copyrighted
  images without improving the video catalog. The 10 video-preview photographs form a complete,
  bounded, directly relevant set.

## Open questions

- None for this scoped catalog. Broader gallery selection should be driven by a later, explicit
  scientific or visual-design need.
