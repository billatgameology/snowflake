# E01 visual-cue review — 2026-09-16

Implemented in website `explore/film-part1@82c4e10b7698f6c47b1a871df6ff10eefd5c5a8e`,
in `/Users/clipper/github/snowcrystal_website-film-part1`. Authority plan amendment
`efe0746` preceded implementation. Scope: maker feedback on E01-01 through E01-05,
not a narration rewrite, solver change, new synthesis request or series-wide acceptance.

## Result

- Clear white opening quantity separated from the particles. One stationary donor is
  explicitly pointed out, shrinks during its spoken sentence and retains a before-size outline.
- Overview grid retains context while lighting/enlarging the narrated category; rime contact,
  deposition and aggregation remain distinct processes.
- Cloud explanations now have separate phase, rise/expansion/condensation, scale, reservoir
  and supercooling views. First ice appears at its narration cue; later freezing fills the
  droplet, with liquid neighbours and separately qualified source examples retained.
- Ice is introduced through a face-magnification cue. Its fixed-base solid region changes
  amount, with a labelled before line, direction arrows and two-way equilibrium traffic.
- Still uses sentence-selected discrete poses, not an arbitrary fixed whole-section fraction.
  Audio, source words, home transition and old film remain unchanged.

## Review and edit loop

Root and the read-only `story_review`, `science_review` and `runtime_review` agents are
OpenAI Codex with shared session context; exact model IDs were unavailable. This is not a
blind/different-model review. Story review independently checked actual sentence alignment;
science review checked depiction against the retained Chapter 1/4 scope; runtime review
executed focused tests and short-height geometry probes. None of the subagents used a browser.

Verified findings repaired: delayed first ice and vapour-removal response; faint whole-section
motion; label/figure overlap; pre-contact rime; stretching rather than adding diagram branches;
frozen neighbours reverting to liquid; shrink arrows during equilibrium; inconsistent vapour
level at restored balance; short-height zero/negative geometry; and Still selecting stale or
not-yet-spoken concepts. Targeted follow-up confirmed the principal repairs; root corrected
the remaining Still-gap and equilibrium-density findings and added regression assertions.

## Checks and limits

Website `docs/series-tests.tap` at the implementation commit records **58 passes**, zero failures.
`npx tsc -b` and the Sites build script pass; only the existing Vite chunk-size advisory remains.
`docs/science-series.md` records exact commands and bounded browser observations. Root inspected
representative states of all revised scenes, phone-sized 390×844 opening/grid/nucleation/surface
and Still, actual audio-clock advancement/auto-scroll, and wheel-up manual takeover. Viewport
override was reset. The fresh preview console check returned no errors. This was not an
uninterrupted performance review, all-frame comparison or physical-device/touch test.

Re-read master SHA-256: `8d734b20709c0eda4081b28a7050a29b5fc40da969d7cd3b820b3a672c23214c`.
Re-read source-script SHA-256: `24fc2cf16689c64b8eee3a73594c00f4e02c3d1a2aaf39ac0639171ef5df9901`.
Both match website `docs/series-verification.json`. The retained old MP4 is **280575547 bytes**
(`stat` on `export/part1-full-final/part1-visual-film.mp4`); no render ran. Relevant source/public
diff against `fd4ee2f` is empty outside the named series presentation files. No scientific
suite/gate, deployment, push or new paid generation. Maker comprehension/listening acceptance
remains the next check, not something these tests establish.
