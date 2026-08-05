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

## Track D executed record (2026-08-05)

- `?profile=realistic|developer` over the spike viewer (UI composition only, per charter):
  realistic drops the look dropdown (the page's curated look is pinned), developer keeps
  the full surface; a profile dropdown switches while carrying every content param.
- Verified headlessly against the static build (`out/gutcheck-gg-realism/check-profiles.mjs`,
  screenshots `profile-realistic.png` / `profile-developer.png`): realistic shows no look
  selector; switching realistic→developer preserved manifest, frame=350, frameExtent, and
  look (relanded at tick 35,000, frame 351/701) with zero page errors.

## Track C executed record (2026-08-05)

- Compiler `scripts/gutcheck-ramp-compile.ts`: ramp spec -> stages[] staircase executed by
  the already-tested `gutcheck-grow-params` public-timeline path. Representative ramp:
  Fig 4 prototype vector -> §VIII dendrite vector over ticks 6000..18000, 400,400,64,
  cap 24k (`p7/ramp-plate-to-dendrite.json`, seed 1, noise 0).
- Density ladder (records `p7/ramp-n{96,48,24}-record.json`; all three stopped far-field
  ~tick 19.7k): attached 212601 / 213057 / 230685. **Step-halving deltas: 48→96 = 0.214%
  attached (2.2% mesh verts); 24→48 = 7.64% attached.** Aggregates converge by 48 events
  over 12k ticks.
- **Prototype finding (the reason this check must be morphology-level):** the eyeball strip
  (`p7/ramp-convergence.png`) shows n96 vs n48 still visibly differing in sidebranch/fringe
  placement despite the 0.21% aggregate agreement — branch placement is
  staircase-density-sensitive after aggregate metrics have converged (consistent with the
  known perturbation sensitivity of sidebranch patterns). Implication carried forward: the
  charter's conditional adoption check for the ramp compiler should compare morphology with
  a stated tolerance, not aggregate counts alone, or it will pass prematurely. These
  prototype numbers inform but do not constitute that check.

## Adversarial review round (2026-08-05) — INCOMPLETE, and read the limits

Provenance (Rule 10): a 16-agent workflow (Claude Fable 5 subagents, fresh contexts, not
sharing the author's session) reviewed all four tracks; each non-nit finding was routed to
an independent refutation agent. **The round did not finish.** The `quantizer` and `ramp`
verify agents completed; **10 of 16 agents died on a Fable 5 rate limit**, killing every
`scene` and `site` verification. So:

- **Independently verified (2 findings, both confirmed, both fixed):** the ramp compiler's
  duplicate-untilTick cascade when events > span (verifier reproduced the one-event-per-tick
  stretch past rampEndTick with the real runner), and gutcheck-build-site's Windows-hostile
  basename/`npx` handling (verifier reproduced with a path.win32 probe; CLAUDE.md names
  Windows as the primary execution host).
- **Reported but NOT independently verified (scene + site tracks).** I verified the worst one
  myself before fixing — `scene-capture.mjs` resolved a missing `--out-dir` to `resolve("")`
  = the CWD, and the truthiness guard could not catch it, so `rmSync(outDir, {recursive:
  true, force: true})` would have deleted the working directory. Reproduced the resolve()
  behavior in isolation (never the deletion), then fixed. **This is author-verified, not
  independently verified — it carries less weight than the two above, and the remaining
  scene/site findings were fixed on reading alone.**
- **The quantizer track produced no confirmed findings**, but its verification is the one
  place a clean result is trustworthy here, since those agents did complete.

Fixes applied this round (all in `a91d5e2`'s successor commit):
- `app/scripts/scene-capture.mjs`: raw-argument validation before `resolve()` (the
  destructive path); positive-duration/frameCount validation so an empty capture can no
  longer "pass" a determinism check by hashing nothing; server stdout/stderr drained
  (python's per-GET logging would deadlock a long capture at the ~64 KB pipe buffer);
  spawn-error and early-exit detection; a Python-server identity check so a stale process
  on the port cannot silently serve an old bundle.
- `scripts/gutcheck-ramp-compile.ts`: refuse `--events > span` by name; final event now
  emits the `to` vector exactly rather than `a + (b−a)·1`.
- `scripts/gutcheck-build-site.ts`: `basename()` instead of a "/" search; EXDEV copy
  fallback; `shell: true` for `npx` on win32; existence guards for gitignored source dirs;
  absent sources printed rather than silently skipped.
- `app/src/spike-gg-realism.ts`: scene files apply their own `look` on human preview;
  scene duration and keyframe-track ordering validated (unsorted tracks silently made
  segments unreachable); `style`/`zscale` carried across profile switches.

Post-fix verification: ramp controls A/B/D executed with observed outcomes (guard fires by
name; N=span compiles with strictly increasing ticks and an exact endpoint; the recorded
96/48/24 ladder's tick schedule is bit-identical, so the Track C numbers above still stand);
capture-runner guard refuses the destructive invocation; site + profile checks re-pass; the
scene capture re-ran to the **same aggregate sha256
`67dd656cbb5945b0bcfa1c23f19b91ca60fb654c44c80fcf88221e0c73539353`**. Exact
`TMPDIR=/private/tmp npm test` green (rule7 clean 443 files, `npm-test-11.log`).

**Open, and it should stay open until done:** re-run the scene and site review lanes to
completion when the token budget allows. Until then, those two tracks carry author-verified
fixes only, and this record is the reason not to treat them as reviewed.

## Tried and rejected

- **Betting on raw-byte shrink alone for the wire size** — quantization gives only 66.7%
  raw because index data (u32, ~2 triangles/vertex) dominates once vertex data shrinks 3x;
  the shippable number is v2q + host gzip at 29% of raw v1. Index reordering/delta coding
  rejected for the spike: three.js wants flat typed arrays and the added decoder complexity
  isn't justified at these sizes.
