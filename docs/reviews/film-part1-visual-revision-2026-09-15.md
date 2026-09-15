# Part 1 — implemented visual revision

Date: 2026-09-15. Maker request: “Please make the improvement.”

## Result

The short prototype has been revised on website branch `explore/film-part1`, commit
`3e17dfa2bd35ac0386f89f6d11da77381ef71a2e`. Preview: `http://127.0.0.1:5185/film/part-1`.
Nothing was pushed, published or merged. This improves the representative sequence; it is
not the full documentary, and its sound remains timing tones rather than the maker's voice.

The [original visual findings](film-part1-visual-review-2026-09-15.md) remain the historical
critique. The changes address their primary compositional and phone-interaction defects:

- **Attention:** full-width watch presentation; the transcript is revealed deliberately through
  Read this scene or native reader takeover. Large headings step back during the shots.
- **Opening:** a cropped unfinished branch detail, followed by the seed. No completed final
  silhouette is spent early. The title has a restrained scrim for legibility over the detail.
- **Causality:** establish the halo, push into one corner, diminish peripheral emphasis,
  strengthen net-delivery arrows, then mark attachment opposition on the drawn interface.
  The diagrams retain their qualitative/not-computed disclosure.
- **Continuity:** the early plate and diagram share projected centre, scale and right-facing
  orientation. The return preserves that tip's screen position before widening and tilting.
  These are editorial correspondences, not a claim that the schematic is Run B's measured field.
- **Ending:** the crystal recedes through the camera inside a stationary renderer. Its backdrop
  no longer becomes a shrinking rectangle. The MODEL/unvalidated/thickness disclosure remains.
- **Reading:** model PNGs contain only the model, with square framing; descriptions and diagram
  labels are readable HTML. Slider time and genuine reader position have separate ownership.
  Caption reflow no longer sends phone seeks into the article. A hidden model retains a valid
  rendering viewport so a diagram-first phone page can become ready.

Narration, source chapters, solver behavior and the inactive full-film draft were not changed.
The byte-identical score import now includes `productionDraft`, but its
`activeForPlayback:false` is preserved and only the root prototype cues run.

## What was inspected

Primary reviewer: OpenAI Codex, the implementation agent, same build context. This is not an
independent aesthetic acceptance. Exact served model build is not exposed.

- Live desktop inspection at 1440×900: opening, adjacent model/diagram compositions, corner
  close-up, normal-rate playback sampled around the opening, corner and model return, then a
  separate playback of the ending cue through its endpoint. A development reload interrupted
  the first playback pass; no uninterrupted narrated-film viewing is claimed.
- Live phone viewport at 390×844: image-only model view, the opening-to-corner slider seek,
  legible HTML diagram labels, and player position. The browser matrix separately exercises
  enlarged text and semantic reading reflow. This is desktop viewport emulation, not phone hardware.
- Retained capture samples and boundary pairs under website
  `export/part1-visual-revision-checked/`; the exact file/time/hash list is copied in the
  [verification receipt](../video/part1-visual-revision-verification.json).
- Separate `story_review` agent, shared context but no website authorship, inspected the draft
  exported opening/seed, both cut pairs, corner, attachment, oblique and ending stills. It found
  the cuts intentional and suggested the title scrim and interface-bound attachment emphasis,
  both implemented. Its initial claim that the ending badge vanished was **mistaken and
  retracted after checking the exact images**. Do not carry that claim forward.
- Separate `runtime_review` agent performed read-only source review of reader ownership,
  camera evaluation and the optional shared-stage target. Its remaining finding—wheel gestures
  over controls pausing only after scrolling—was repaired. A capture-phase scroll observer in
  the regression now checks that audio is already paused. Button touch retains toggle intent.

No reviewer performed a new full scientific audit or certified final emotional impact with
the maker's delivery. The ending remains a restrained transition rehearsal, not the complete
film's final payoff. One non-blocking inherited copy issue was observed: after Restart, the
status sentence can retain the previous completion notice although the clock and controls reset.

## Executed verification

The [receipt](../video/part1-visual-revision-verification.json) records command output and copies
the actual reports. It identifies the score, replay, generated stills and website revision.

- `node --test --test-reporter=tap scripts/film-timeline.test.mjs`: 8 passing focused tests.
- Site build helper (`npm run build`, including `tsc -b` and Vite): exit 0; existing large-chunk
  warning remains.
- `FILM_CHECK_OUT=export/film-visual-revision-final-verification node scripts/film-browser-check.mjs`:
  18 passing checks, no reported page errors.
- `FILM_OUT=export/part1-visual-revision-checked node scripts/export-part1-prototype.mjs`:
  exact repeated/reverse/reload screenshot equality at sampled times on the named renderer;
  decoded 6.000-second, 180-frame 1920×1080/30 fps montage with equally long audio. Export wall
  time 27.784 seconds is sample cost, not full-film performance.
- Recomputed all 15 source digests in the capture report against the committed implementation;
  all match. Export report SHA-256:
  `c41ef42826cd38246731846cb4d9748b98e68274e8b549a3a39f6909f625e5b3`.
- `node scripts/build-part1-production-score.mjs --check`, `node scripts/lint-rule7.mjs`,
  and diff whitespace checks passed. No root scientific suite or gate was run for this
  presentation-only change.

Earlier local draft/failed checks are retained. The first phone check exposed the zero-size
hidden-renderer readiness failure. Another playback check timed out while build/export jobs
were also rewriting development assets; the final browser check ran after those writers
finished and passed. Run these asset-writing/build and live-playback checks sequentially.

## Next

Keep this revision and use its directed-attention approach for the selected full-story visuals.
Continue WP4/WP5 from the approved script and score rather than duplicating the old static
diagram pattern. Maker visual acceptance and the aloud narration read remain distinct inputs;
passing transport tests does not substitute for either.
