# Phase 7 preparation spike (maker-approved, 2026-08-05)

**Status: active. This is NOT Phase 7.** Charter v1.18 (decision 0029) defines Phase 7
pre-solidification "while Phase 6 remains in flight," and states plainly that Phase 7 still
begins after Phase 6. This plan continues that pre-solidification on the
`explore/gg-realism-gutcheck` branch: machinery and prototypes only, no phase-gate claim, no
evidence claim changes. The phase itself starts on `main` after Phase 6 lands, by its own
properly recorded decision; at that point this branch merges via maker review and the
durable pieces are adopted through a labeled plan on `main`
(see `docs/plans/explore-gg-realism-gutcheck.md`, Out of scope).

Maker directives captured verbatim-in-substance:
- All four prep tracks approved: shippable replay bundle, Developer scene scripts, ramp
  compiler prototype, profile shell prototype.
- "We will ship this on a real host website so use standard web dev stack like vite or
  something, not limited by GitHub Pages" — build for a real host (standard Vite production
  build, static `dist/`, relative paths); do not contort assets to fit Pages-style limits,
  but bandwidth still matters, so sizes are measured and minimized.

## Inherited constraints (unchanged from the gut-check plan)

No `LibbrechtKinetics` runs; no edits to `core/`, `solver-cpu/`, `runner/`, `evidence/`,
charter, ADRs, education, or main's `PROGRESS.md`; seeded counter-based PRNG only; Rule 7
everywhere; exact `TMPDIR=/private/tmp npm test` is the required local check; copyrighted
media never committed and never in `tracked/`; every visual claim is eyeball-only,
Evidence = unvalidated. Phase-6-dependent Phase 7 items are explicitly deferred: Designer
intent compiler (needs the Phase 6 morphology diagram), preset wording (open maker decision
pending Phase 6's outcome), anything LK-based.

## Track A — shippable replay bundle (first)

Goal: the growth-timeline experience (viewer + pre-baked history) as a normal Vite
production build a visitor can load from a real host — the compute-once/replay-forever
model recorded in the gut-check plan's Phase 7 usability inputs.

- Mesh compression ladder, measured: current gutcheck-mesh-v1 is raw f32/u32
  (701 frames ≈ 9.3 GB). Candidates, in order: (1) quantized positions (int16 against the
  frame bbox) + oct-encoded or int8 normals + u32→u16/varint indices where counts allow;
  (2) frame decimation presets (every 200/400 ticks); (3) host-level brotli/gzip measured,
  not assumed. Each rung records bytes and an eyeball A/B against the raw render at 1200 px.
  New format version (`gutcheck-mesh-v2q`) decoded in the viewer worker-side; v1 stays
  readable so nothing recorded breaks.
- Static build: a `vite build` entry that emits the viewer + index + selected bundles with
  relative asset URLs (no dev-server `/@fs` paths — the current pages are dev-only). Bundle
  manifest names assets by content hash so hosts cache correctly.
- Done when: a `dist/` directory serves the full index page, at least one interactive mesh
  viewer, and one growth timeline end-to-end from a plain `npx serve`-style static server,
  with a recorded size table (raw vs quantized vs decimated) and eyeball verdicts.

## Track B — Developer-profile scene scripts

Charter Phase 7 Developer profile: repo-committed scene scripts played read-only with
deterministic frame capture. Prototype: a JSON scene script (mesh or manifest ref, camera
keyframes with easing, frame ranges/pacing, caption track, look, background) + a viewer
player mode (`?scene=`) + a capture runner that emits numbered frames and an ffmpeg-encoded
mp4. Scene scripts cannot alter solver behavior (they only reference recorded artifacts).
Done when: one committed example script plays in the viewer and captures deterministically
to mp4 headlessly, twice, with identical frame hashes on this host.

## Track C — ramp compiler prototype + step-halving harness

Charter Phase 7 timeline editor: a drawn ramp is UI sugar compiling to a dense staircase of
decision-0011 abrupt events, at most one per solver-native step, adopted conditionally on a
recorded step-halving convergence check. Prototype on GGThreshold via the public
`applyTimelineEnvironment` only: `scripts/gutcheck-ramp-compile.ts` takes
`{from vector, to vector, startTick, endTick, maxEventsPerTick=1}` and emits an explicit
event schedule; the harness runs the same ramp at event densities N, N/2, N/4 and reports
morphology-metric deltas (attached count, bbox, occupancy profile) between rungs. Labeled
prototype; its numbers inform but do not constitute the charter's recorded adoption check,
which belongs to the real phase. Done when: one representative GG ramp (e.g. plate→dendrite
vector morph) has a recorded density-convergence table and the composite eyeball.

## Track D — profile shell prototype

`?profile=realistic|developer` over the existing spike viewer, UI composition and rendering
only, per the charter's profile definition. Realistic: minimal chrome (look fixed to a
curated recipe, bg pickers, motion buttons, timeline scrub), curated-history picker.
Developer: scene-script player + capture hooks + the existing full parameter surface.
Spike namespace only (`app/spike-gg-realism.html` + `app/src/spike-*`); the real app shell
is deliberately untouched. Done when: both profiles load from the static Track A build and
the profile switch preserves the current artifact.

## Order and process

A → B → D → C by user value, interleaved with the remaining sweep harvest (Fig 14 v2) and
opportunistic as lanes/notifications allow. Every track: plan-step commits, exact
`TMPDIR=/private/tmp npm test` before each code commit, adversarial review round (Rule 13
proportionate) before the track is called done, artifacts + sha256 + commands recorded here.

## Track A executed record (2026-08-05)

Numbers copied from the named artifacts/logs at write time.

- Quantizer `scripts/gutcheck-mesh-quantize.ts` (v1 -> v2q: u16 bbox positions, oct-snorm8
  normals, u16 indices when vertexCount fits); decoder added to viewer `parseMesh`.
- Measured ladder (`out/gutcheck-gg-realism/p7/`): hero plate 62.9 MB -> 41.9 MB raw
  (66.7% — index data dominates after vertex payload shrinks 3x), and the wire size with
  host gzip: 34.5 MB (raw v1 gz) -> **18.3 MB (v2q gz, 29% of raw v1)**. Full 701-frame
  timeline: 9.99 GB -> 6.62 GB raw (66.3%), frames lazy-load individually (~4-5 MB gz
  each). Visual A/B at 1200 px: PSNR 51.5 dB raw-vs-v2q (`p7/ab-raw.png`, `p7/ab-v2q.png`),
  eyeballed clean — no faceting, cracking, or normal artifacts.
- Static site `scripts/gutcheck-build-site.ts`: multi-page `vite build` (app pages now
  enumerated in `app/vite.config.ts` rollup inputs) + curated hardlinked `data/` bundle
  (6.3 GB, no extra disk) + relative-path `data/index.json`; `app/src/gutcheck-index.ts`
  tries `./data/index.json` before the dev `/@fs` fallback. Curation is ours-only by
  construction: composites, paper crops, and photos are never copied into the bundle.
- End-to-end check over plain `python3 -m http.server` (`out/gutcheck-gg-realism/check-site.mjs`,
  screenshots `site-check-{index,viewer,timeline}.png`): index galleries render, v2q hero
  mesh reaches `__spikeReady`, timeline scrubs at frame 351/701 — no page errors.
- Not in the v1 bundle (recorded gaps): cell-true ggview meshes (no v2q path for the edge
  payload yet), per-figure interactive viewers (only two hero meshes staged so far),
  frame-decimation presets (ladder rung not yet cut).

## Track B executed record (2026-08-05)

- Scene schema `gutcheck-scene-v1` (committed example `app/scenes/growth-B-intro.json`):
  camera keyframes (tilt/yaw/zoom, eased), piecewise-linear frame track over the recorded
  timeline, timed captions. Scenes reference recorded artifacts only — no solver access.
- Viewer `?scene=` mode (`sceneMain` in `app/src/spike-gg-realism.ts`): virtual-clock
  playback for humans; `?capture=1` disables the free clock and exposes deterministic
  `window.__sceneSeek(t)`.
- Capture runner `app/scripts/scene-capture.mjs`: serves the built site with plain
  `python3 -m http.server`, seeks frame-by-frame, screenshots, encodes mp4
  (`p7/growth-B-intro.mp4`, 480 frames @ 30 fps).
- Determinism check (done-when): two full captures, aggregate sha256 over all 480 PNGs
  identical both runs: `67dd656cbb5945b0bcfa1c23f19b91ca60fb654c44c80fcf88221e0c73539353`.
- Caption wording carries the §1.5 label ("model output, unvalidated") — outward-facing
  strings stay honest by construction.

## Tried and rejected

- **Betting on raw-byte shrink alone for the wire size** — quantization gives only 66.7%
  raw because index data (u32, ~2 triangles/vertex) dominates once vertex data shrinks 3x;
  the shippable number is v2q + host gzip at 29% of raw v1. Index reordering/delta coding
  rejected for the spike: three.js wants flat typed arrays and the added decoder complexity
  isn't justified at these sizes.
