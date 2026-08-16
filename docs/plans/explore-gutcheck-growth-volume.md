# Plan — Compact smooth 3D replay for the G-G gutcheck

- **Phase:** Maker-directed Journey/media exploration; not a charter phase gate
- **Status:** in progress
- **Started:** 2026-08-15
- **Last touched:** 2026-08-15 by OpenAI Codex

## Goal

Replace the Run B gutcheck viewer's multi-gigabyte sequence of independently extracted meshes with
one compact, prebaked growth asset that supports smooth forward/reverse playback, scrubbing, and a
free 3D camera on the web. Preserve the executed G-G cell-attachment order without changing solver
behavior, and state plainly that the continuous surface between discrete attachment events is a
visual interpolation, Evidence = unvalidated.

This is a new media/replay experiment alongside the immutable 701-frame `gutcheck-anim-v1`
timeline. It does not start Phase 7, alter any phase gate or scientific result, edit the permanent
solver, or replace the recorded source artifacts before the new representation is measured and
accepted.

## Done when

There is no charter milestone for this exploration. This unit is done when:

- a versioned `gutcheck-growth-v1` baker records every initially attached cell and every later
  `GGSolver.lastAttached` cell exactly once with its solver tick, while retaining the complete run
  configuration, lattice embedding, crop, count, and source/provenance fields needed to replay it;
- a strict decoder independently rejects malformed, truncated, duplicate, out-of-range, or
  count-inconsistent assets and reconstructs the cropped arrival-time volume;
- the gutcheck viewer loads that one asset, exposes continuous play/pause/scrub controls and the
  existing free camera, and renders a spatially and temporally smoothed implicit surface without
  fetching or swapping the 701 mesh frames;
- a small deterministic smoke replay proves start/middle/end behavior, reverse scrubbing, resize,
  reduced-motion/manual control, error handling, and zero page errors in a real browser;
- the smoke record states asset bytes, decoded/GPU memory, observed frame behavior, exact command,
  source configuration, and the difference from the legacy mesh extractor;
- a skeptical non-author review checks the format, solver-observation boundary, renderer failure
  modes, claims, and destructive-path handling; every blocker is repaired; and
- exact `TMPDIR=/private/tmp npm test` passes before the code commit. Only after those checks may
  the roughly ten-hour deterministic Run B replay recorded in
  `docs/plans/explore-gg-realism-gutcheck.md` be launched to produce the full private asset.

## Approach

The existing animation is 701 unrelated Surface Nets meshes at ticks 0 through 70,000. At plan
write time, those counts and the 9,986,535,068-byte raw sum were recomputed from the private NAS
artifact `out/gutcheck-gg-realism/large/anim-B/manifest.json` and its named frame files. Every
adjacent pair changes vertex and triangle count, so normal glTF morph targets and ordinary vertex
animation textures have no stable correspondence. The measured quantized total of 6.62 GB is
recorded in `docs/plans/explore-phase7-prep.md`; neither it nor the viewer's coded five-frame-per-
second default in `app/src/spike-gg-realism.ts` removes frame swapping.

Exploit the monotone fact that G-G attachment is terminal. During a deterministic replay, consume
the public read-only `lastAttached` list after every step. Write one sparse event stream containing
flat lattice index plus exact uint32 attachment tick; include the seed cells at tick zero. Accumulate
the final axial crop without scanning the full lattice every frame. The baker lives in `scripts/`
and consumes `GGSolver`; it does not change `core/`, `solver-cpu/`, `runner/`, checkpoints, or
evidence machinery.

The browser validates and expands the sparse records into a cropped exact uint32 attachment-tick
volume, reserving uint32 maximum for never attached and therefore capping v1 ticks at one less than
that sentinel. The crop retains empty padding on every face so texture-edge clamping cannot falsely
seal the surface. A WebGL2 R32UI 2D texture array and custom ray-marched iso-surface shader make
display time continuous, allow topology to split and branch, and retain orbit-camera control. The
array layout is deliberate: WebGL2 guarantees only a 256-sample minimum 3D texture edge, while its
guaranteed 2D edge and array-layer limits cover Run B's wide, shallow crop. Triangular-prism
interpolation uses the lattice-compatible simplicial decomposition; the CPU shadow's registered
60-degree rotation samples stayed below their stated tolerance, while GPU D6h error remains
unmeasured. Temporal and surface smoothing remain presentation operations. The old high-resolution
mesh may remain available as an optional paused hero view, but the growth mode itself must not
depend on legacy frame fetches.

The pinned Run B checkpoint reports 961,597 attached cells. A 2026-08-15 read-only stream of its
full `a` field measured tight axial bounds `[306,306,18]` through `[894,894,30]`; the registered
two-cell halo is therefore 593 × 593 × 17 = 5,978,033 samples and 23,912,132 nominal R32UI bytes,
versus the recorded 6.62 GB quantized sequence. The checkpoint measurement is named in
`docs/PROGRESS.md`; actual browser allocation and performance still require the smoke record.

## Steps

- [x] Inspect the current 701-frame manifest, raw and quantized mesh formats, viewer cache/playback,
      Run B dimensions, solver attachment observation, and existing scene/capture tooling.
- [x] Record this implementation plan and commit it before executable work.
- [x] Add the strict `gutcheck-growth-v1` codec and focused adversarial tests.
- [x] Add a deterministic baker/smoke command using `GGSolver.lastAttached`, with seed handling,
      crop accumulation, exact run identity, and atomic output publication.
- [x] Add a smooth `?growth=` viewer mode, arrival-volume reconstruction, quality tiers,
      playback/scrub controls, reduced-motion behavior, and an explicit MODEL/unvalidated label.
- [x] Produce the small smoke asset and run start/middle/end plus reverse-scrub browser checks.
- [x] Record measured smoke size/performance/limits in this plan and `docs/PROGRESS.md`.
- [x] Obtain one proportionate non-author review, repair blockers, and run exact
      `TMPDIR=/private/tmp npm test`.
- [ ] Commit the reviewed implementation, then launch the full Run B bake only if the smoke result
      supports it; record its restart-only command, logs, output, digest, and next action.

## Implementation record

The first deterministic smoke bake used:

```text
node scripts/gutcheck-bake-growth.ts --preset plate --dims 20,20,12 --ticks 200 --out out/gutcheck-growth-smoke/growth.bin --domain hexPrism --seed 1 --noise 0 --padding 2 --progress 50 --expected-attached-count 61
```

It completed at tick 200 with 61 attached cells (19 seed plus 42 later events), a 2,588-byte
asset, full-lattice occupancy SHA-256
`840c2a6cc9f46ae8978137735d78f30995a132d1144d3b723ef7b87f6b080796`, and asset SHA-256
`28e9bb62f3c9d073adbe9b134790e568e99dc372476af2aa8416d2f22f0fc233`. The asset is disposable
workspace output, not evidence. Exact
`TMPDIR=/private/tmp npx vitest run runner/test/gutcheck-growth-baker.test.ts app/test/gutcheck-growth-format.test.ts`
passed 34/34 focused tests after the exact-R32UI/uint-playhead revision; `npm run typecheck` and
`npm run build --workspace app` passed. The
codec tests include a hand-authored wire fixture and fail-closed mutations; the baker test grows an
independent 20×20×12 solver trace and matches every decoded index/tick plus occupancy snapshots.

The final non-author browser run used:

```text
/Users/clipper/.nvm/versions/node/v24.19.0/bin/node /Users/clipper/github/snowflake-education-ch1-video/app/scripts/growth-capture.mjs --growth out/gutcheck-growth-smoke/growth.bin --out-dir out/gutcheck-growth-smoke/browser-r32-runb-probe-v6 --quality low --port 4330 --params probeVolume=593,593,17
```

Its 8,418-byte record at
`out/gutcheck-growth-smoke/browser-r32-runb-probe-v6/record.json` has SHA-256
`c9e3250179a10ce334a61a5e6c49f7f6bcfc90988ef62c34f63d5e51fbbed17b`. Chromium 149 over
ANGLE SwiftShader WebGL2 uploaded the measured 593×593×17 R32UI allocation (23,912,132 nominal
bytes). Start/middle/final raw images differed, the forward and reverse tick-167 PNG hashes were
identical, portrait proxy bounds remained inside clip space, reduced motion stopped requested
autoplay, real controls paused/rewound and completed the tick-200→display-204 visual tail, one
growth request and zero legacy mesh requests occurred, malformed bytes failed with a specific
codec error, and both valid pages retained ready/no-error state before the record published. The
two raw control-canvas PNGs are retained beside the record and their independently recomputed
SHA-256 values match its fields.

This probe expands only the allocation around the tiny 61-event smoke. Its timing and image
complexity are explicitly stamped **NON-TRANSFERABLE** to Run B in the record. It does not measure
hardware-GPU performance, full Run B occupancy, OOM/context-loss recovery, GPU D6h error, mobile or
cross-browser behavior, or accessibility. The non-author reviewer was OpenAI Codex, GPT-5 family,
with inherited developer/repository context; it independently executed the browser captures,
34/34 focused tests, app typecheck, Rule 7, and diff checks, edited no tracked files, and approved
the implementation with no remaining blocker/high code findings. Exact root `npm test` and the full
Run B bake were explicitly outside that review. After the repairs and PROGRESS compaction, exact
`TMPDIR=/private/tmp npm test` passed; it covered Rule 7, both TypeScript projects and the complete
Vitest suite. The docs-only status update after that run is covered by the focused progress-index,
Rule 7 and diff checks before commit. The full Run B bake remains below.

The v1 baker has no mid-run restore path: it retains events in memory and publishes only after the
70,000th tick and all endpoint/legacy checks pass. A terminated run therefore restarts from tick
zero. Adding resumability would require a separately versioned solver-state/event checkpoint, not
an undocumented append mode. The reviewed launch must write its complete asset to local APFS first;
only after hashing it will a no-clobber verified copy be published to the SMB NAS. This avoids
discovering unsupported hard-link publication on SMB after roughly ten hours of computation.

## Full Run B bake — running

The reviewed implementation committed as `44fd4b6`. Immediately before launch,
`detectNasMount()` resolved `/Volumes/snowcrystal/`; the 97,503-byte legacy manifest at the derived
share-relative path had SHA-256
`a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d`. One process (actual
concurrency 1) launched locally under the original Run B executable
`/Users/clipper/.nvm/versions/node/v24.13.1/bin/node` (V8 `13.6.233.17-node.40`) with:

```text
scripts/gutcheck-bake-growth.ts --preset plate --dims 1200,1200,48 --ticks 70000 --out out/gutcheck-growth-runB/gutcheck-growth-v1.bin --domain hexPrism --seed 1 --noise 0 --padding 2 --progress 100 --legacy-manifest /Volumes/snowcrystal/out/gutcheck-gg-realism/large/anim-B/manifest.json --expected-attached-count 961597 --expected-occupancy-sha256 9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7
```

`out/gutcheck-growth-runB/live.log` is stdout, `error.log` is stderr, and the wrapper writes
`exit-status` only when the process terminates. The first measured line in `live.log` was tick
100/70,000, 37 attached/events, elapsed 55.0 seconds; `error.log` was empty. Do not start a second
copy. On exit 0, decode and re-derive asset/count/tick/crop/endpoints before a no-clobber NAS copy;
on interruption or nonzero exit, preserve the logs and restart from tick zero only after diagnosis.

## Out of scope

- Modifying `GGSolver`, either permanent surface operator, checkpoint meaning, scientific
  specifications, the charter, ADRs, gate evidence, or executed Run B source records.
- Calling the smoothed implicit surface an exact replay of the old partial-boundary
  `b / ggThreshBeta` level set. Attached-cell timing is exact; the continuous shell is visual.
- Activating Phase 7, earning Phase 6/7 credit, or treating a browser performance result as a
  scientific result.
- Deleting the 701-frame timeline, its quantized derivative, or the existing MP4s.
- Assuming mobile performance, production hosting, CDN compression, or accessibility from a
  desktop smoke check. Each requires its own measured acceptance.
- Starting the full Run B replay before the format, renderer, smoke test, and review close.

## Tried and rejected

- **Direct glTF morph targets or an ordinary vertex-animation texture.** Rejected because all 700
  adjacent legacy frame pairs change topology and have no stable vertex/index correspondence.
- **Bundle the 701 meshes into one larger file.** Rejected because it changes request count, not
  the 6.62 GB quantized payload, decode cost, topology seam, or memory pressure.
- **Cross-fade adjacent transparent ice meshes as the primary result.** Rejected because it draws
  two million-triangle-class shells, ghosts silhouettes and internal transmission, and remains
  bandwidth-bound. It may be useful only as a temporary comparison control.
- **Reveal only the final mesh by a per-vertex birth value.** Rejected as the primary model because
  surfaces exposed early and buried later do not exist in the final exterior topology.
- **One full signed-distance volume per timeline frame.** Rejected because it recreates a 4D
  multi-gigabyte payload. The monotone arrival-time field is the compact representation.
- **Normalize Run B ticks into uint16 texture values.** Rejected after review because floor
  quantization could reveal a cell before its exact attachment tick and made the CPU shadow differ
  from the shader contract. Exact R32UI ticks cost 23,912,132 nominal bytes for the measured crop,
  still tiny relative to the legacy sequence, and reserve one explicit never-attached sentinel.
- **One transmissive prism instance per attached cell.** Retained only as a fallback diagnostic:
  roughly 962,000 instances expose internal faces and change the smooth Surface Nets aesthetic.

## Open questions

- Whether the first polished renderer should use ray-marched arrival time throughout, or switch to
  a recorded high-resolution hero mesh after playback pauses.
- Which measured desktop and mobile quality tiers are acceptable after the smoke run; do not set a
  production default from estimates.
- Whether a later generalized format should also carry an optional partial-boundary visual field.
  That field is not monotone under G-G freezing/melting and cannot be folded into attachment time
  without a separate representation.
