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

## Maker follow-up: identity and sequence

Authority amendment `82ceb53` preceded website implementation
`094911865d2e1af3de44e837bce6dfbf911996a0`. The maker accepted E01-05 and requested
white vapour arriving during the opening budget, no premature snowflake in the cloud's
air-gap explanation, and distinguishable droplet/speck/first-ice identities.

The opening now sustains illustrative white arrivals at the budget cue. Cloud air gaps
contain gas tracers between liquid droplets, without a crystal. E01-04 links a labelled
droplet to its rectangular magnified interior: an unchanged irregular particle, amber
liquid, and newly formed hatched ice on the particle's surface. Text-led temperature
examples keep their clean-water/bacterial-protein qualifiers and non-universal scope.

The same shared-context `science_review` agent reviewed the depiction read-only. It caught
the selected droplet freezing then resetting across example cards, and phase labels lagging
the spreading ice. Both were repaired: the freeze finishes during “Some droplets freeze”,
stays complete on returning to the selected seed, and transitional labels identify materials
with a texture key. The reviewer confirmed those fixes in source. Root's phone view then
exposed poor key contrast over the final ice; an opaque label strip corrected it. No subagent
browser work, blind review, or independently identified reviewer model is claimed.

Root inspected representative desktop 1270×710 and phone-sized 390×844 views: budget
arrivals, air gaps, liquid before nucleation, first ice, partial/final freezing, and qualified
example cards. Actual opening audio/auto-scroll advancement and reverse seeking were
observed. Viewport override reset; final preview console query returned no errors. This
bounded pass is not uninterrupted listening, physical-phone testing or audience acceptance.

Website `docs/series-tests.tap` at the implementation commit records **60 passes**, zero
failures, including budget arrivals and material-label/seed-continuity regressions. Exact
focused command is in website `docs/science-series.md`; `npx tsc -b` and the standalone Sites
production build pass with the existing chunk-size advisory. A read-only comparison against
`82c4e10` found E01-05's entire drawing block and `surfaceCue` byte-identical. Home/player,
source imports, narration and old-film paths have no diff from that baseline. Re-read master
and script SHA-256 values match those recorded above, and `stat` still reports the old MP4
as **280575547 bytes**. No synthesis, export, scientific suite, push or publication occurred.

## Full visual storytelling pass

Plan-before-code authority commit: `9368961`. Website baseline: `0949118`; implementation:
`68e31f265b4b463a528cf53ef608968698cf5528`. The maker requested a written account of the useful
first-five-scene treatments and a complete visual rewrite after scene 5, plus better cloud
imagery and the same seed carried into the surface view. The
[visual guide](../video/science-series-e01-visual-guide.md) records the baseline, principles and
produced result. Root edited the website; shared-context story/science/runtime agents worked
read-only without browser access. Exact model identities were unavailable, so no blind or
different-model review is claimed.

Produced: phase-labelled mist and vapour, mixed-cloud context, rising/expanding/cooling parcel
and condensation; frozen-seed continuation into a magnified exterior; paired liquid/ice
exchange and balance references; a highlighted vapour handover with reciprocal traffic;
changing denominator and distinct percent/amount comparisons; depletion by freezing and
evaporation followed by cloud-history/cold-supply/remaining-water views; and a labelled
conceptual laboratory ending that retains old ice while adding different outer branches.
The accepted surface mechanics and the existing narration/transport are not rewritten.

Material review findings and repairs:

- The highlighted molecule initially stopped at a model bounding radius, not on ice. It now
  arrives at the explicit solid edge in a magnified cutaway. Other exchange is in a linked
  surface inset, never through empty space inside a branched model's bounding circle.
- The fallback crystal initially revealed less geometry than the opening. Its return now
  retains the full earlier branches; Run B continues its original recorded-growth interval.
- Opposite net traffic initially outlasted ice/liquid boundary motion. Both surface amounts
  now continue changing through that comparison.
- The liquid gauge initially ignored freezing. Both liquid-loss routes now affect the
  explicitly qualitative indicator.
- Browser inspection found overlapping paired-chart labels, seed-zoom caption clutter and a
  wrapped phone ending title. Spacing/quiet label areas were repaired. Still's contact pose
  initially kept the gas label because its timestamp is just before sentence end; the terminal
  contact now settles at the solid edge with the matching label.

The science reviewer rechecked its four material repairs in source and found no remaining
blocker among those findings. The runtime reviewer found no new concrete runtime/cue blocker
in its bounded source and finite-drawing probes. Root performed the final rendered checks;
the reviews do not substitute for that inspection or for maker comprehension acceptance.

Website `docs/series-tests.tap` at the implementation commit records **66 passes, zero failures**.
The exact focused command is in website `docs/science-series.md`; `npx tsc -b` and the standalone
Sites production build pass, with the existing chunk-size advisory. Root inspected representative
states of every revised scene at desktop **1270×710** and phone-sized **390×844**, real audio-clock
advancement/auto-scroll through the seed zoom and handover, wheel-up manual takeover, forward/
reverse seeking and Still. The phone DOM reported no horizontal overflow; viewport override reset.

Development hot reload reproduced the previously recorded Hero1 unconfigured-GPU-context error.
This pass did not change that engine or claim device-loss recovery. A later cold-load/scene-seek
console query since `2026-09-17T01:05:05.802Z` returned no new errors. No uninterrupted listening,
physical-phone/touch test, audience study or all-frame comparison was performed.

Re-read script SHA-256: `24fc2cf16689c64b8eee3a73594c00f4e02c3d1a2aaf39ac0639171ef5df9901`.
Re-read master SHA-256: `8d734b20709c0eda4081b28a7050a29b5fc40da969d7cd3b820b3a672c23214c`.
Both match website `docs/series-verification.json`. Source/import/alignment/master audio, home
and old-film paths have no diff from the website baseline. `stat` on the old export still
reports **280575547 bytes** at `export/part1-full-final/part1-visual-film.mp4`. No generation,
export, dependency change, scientific suite/gate, push, merge or publication occurred.
