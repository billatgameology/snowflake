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

The browser validates and expands the sparse records into a cropped uint16 normalized arrival-time
volume, reserving the maximum value for never attached. The crop retains empty padding on every
face so texture-edge clamping cannot falsely seal the surface. A WebGL2 2D texture array and custom
ray-marched iso-surface shader make time continuous, allow topology to split and branch, and retain
orbit-camera control. The array layout is deliberate: WebGL2 guarantees only a 256-sample minimum
3D texture edge, while its guaranteed 2D edge and array-layer limits cover Run B's wide, shallow
crop. Exact uint32 ticks remain in the source asset; normalization and surface smoothing are
presentation operations. The old high-resolution mesh may remain available as an optional paused
hero view, but the growth mode itself must not depend on legacy frame fetches.

The same live NAS manifest reports Run B ending at 961,597 attached cells and a Cartesian
`finalBBox` spanning approximately 591 × 511 × 15 world units. A conservative planning proxy of
591 × 591 × 15 lattice samples would make the decoded uint16 volume roughly 10.5 MB before padding,
versus the recorded 6.62 GB quantized sequence. The crop and volume bytes are estimates, not
measurements, and must not be promoted to result numbers until the actual asset reports them.

## Steps

- [x] Inspect the current 701-frame manifest, raw and quantized mesh formats, viewer cache/playback,
      Run B dimensions, solver attachment observation, and existing scene/capture tooling.
- [x] Record this implementation plan and commit it before executable work.
- [ ] Add the strict `gutcheck-growth-v1` codec and focused adversarial tests.
- [ ] Add a deterministic baker/smoke command using `GGSolver.lastAttached`, with seed handling,
      crop accumulation, exact run identity, and atomic output publication.
- [ ] Add a smooth `?growth=` viewer mode, arrival-volume reconstruction, quality tiers,
      playback/scrub controls, reduced-motion behavior, and an explicit MODEL/unvalidated label.
- [ ] Produce the small smoke asset and run start/middle/end plus reverse-scrub browser checks.
- [ ] Record measured smoke size/performance/limits in this plan and `docs/PROGRESS.md`.
- [ ] Obtain one proportionate non-author review, repair blockers, and run exact
      `TMPDIR=/private/tmp npm test`.
- [ ] Commit the reviewed implementation, then launch the full Run B bake only if the smoke result
      supports it; record its resumable command, logs, output, digest, and next action.

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
