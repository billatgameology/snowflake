# Named snow-crystal volume stability correction

**Status:** complete (2026-09-01)
**Registered:** 2026-09-01
**Worktree:** `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog`
**Branch:** `feature/named-crystal-catalog`

## Goal

Remove the black, patchy and camera-jittering holes from the named-catalog volume presentation while
preserving crystal geometry, animation timing, accepted growth/Compose identities, truthful route
disclosures and the existing less-than-20,000,000-byte per-animation network payloads. This is a
renderer correction only.

## Measured failure

- The maker's exact `12-branched-stars-upper` view and the generated
  `simple-stars-baseline` preview both show dense background-coloured pinholes inside illuminated
  branches. The direct source proves this is not solely a Compose depth-overlap problem.
- `simple-stars-baseline` (`out/named-crystal-catalog/final-resolution-c-v1/simple-stars-baseline/growth-v1.bin`)
  has a `525×525×29` cropped volume, or 743.03 cells across its box
  diagonal. The shader's exact 524×524×28 cell-path diagonal requests 1.55 samples per crossed cell
  (1,150 steps) but is capped at 768,
  reducing that ray to 1.03 samples per cell. The cap can skip the narrow isosurface around
  one-cell branch detail; which samples miss changes as the camera moves.
- The live scene census found the configured march cap also truncates the largest six-component
  Radiating Dendrite case: it requests 890 quality-2 steps but is capped at 512.
- This sampling shortfall is the registered first hypothesis. A fixed-camera before/after capture
  must show that restoring the requested sampling removes the holes. If dark facets remain after
  ray coverage is restored, lighting/normal stability is a separate second correction, not an
  excuse to blur or inflate geometry blindly.

## Approach

1. Add a small catalog quality selector with four bounded shader buckets: the existing standard
   quality-2/quality-3 programs and high-resolution variants used only when the transformed volume
   diagonal would otherwise hit the march ceiling. Keep the requested samples-per-cell unchanged.
2. Raise only the high-resolution ceilings far enough to cover the current catalog maxima, then
   compare the exact Simple Star / 12-branched Star camera and timeline against the rejected render.
3. If the coverage A/B leaves unstable black facets, add the smallest presentation-only shading
   floor or normal stabilization demonstrated by a second A/B. Do not replace the arrival field,
   alter attachment events, smooth away named branch structure or change Compose transforms.
4. Check direct dense planar, two-component dense Compose, six-component Compose, thin plate and
   tall/hollow sentinels. Record readiness and frame time so stability is not bought with a frozen UI.
5. Regenerate all 99 card previews after acceptance, rerun the 99-scene browser sweep, update the
   live records, and reopen the loopback page for the maker.

## Done when

- `simple-stars-baseline` and `12-branched-stars-upper` no longer show background-coloured pinholes
  across their illuminated branches, and a small orbit change does not make black patches chatter.
- Radiating Dendrites and another greater-than-two-component scene receive sufficient bounded march
  coverage and render without the same defect.
- Thin planar detail remains distinct; needles, hollow columns and capped columns remain fully
  framed and do not become swollen or blurred.
- All 99 scenes pass real-browser load/error/framing/shared-texture checks, and all 99 matching
  final-frame previews are regenerated.
- Focused renderer/geometry/service tests, both TypeScript projects, the app build, Rule 7, script
  syntax, diff check and live gallery smoke pass. Exact `npm test` and scientific gates remain out of
  scope for this presentation-only repair.

## Out of scope

- Solver changes, regenerated growth histories, new snow physics, modified Compose recipes, evidence
  or phase-gate work, public deployment, or a scientific optics claim.
- Hiding the issue with an opaque white material, a static camera, post-process blur, or lower-detail
  geometry.

## Tried and rejected

- **Treat the speckles as Compose intersection detail.** Rejected because the same defect is present
  in the one-component `simple-stars-baseline` preview.
- **Accept the quality label as proof of coverage.** Rejected because “768-step volume” is a hard
  shader ceiling, while the configured sampling rate asks for 1,150 steps on the reported direct
  source and 890 on the six-component Radiating Dendrite source.
- **Raise the march ceilings as the primary fix.** Rejected by the exact target A/B: 1,280 first-hit
  steps did not remove the black pattern, made the SwiftShader capture path dramatically slower and
  produced one capture before its heavy render had completed. The capture-only solid-hit mode at the
  original 768-step ceiling showed a continuous subject where the lit render was black, proving the
  defect was downstream of first-hit coverage.
- **Compensate with softer lighting, no contact darkening or a body-colour floor.** Rejected because
  these reduced contrast but could not repair invalid values already introduced in the far-surface
  normal path.

## Completion record

- The root cause was the transmission pass's `farPoint`: its 28-step thickness probe recorded the
  first coarse sample inside a later body, which can lie many cells beyond the actual surface where
  the scalar field is flat. Normalizing that zero gradient produced invalid black pixels; the coarse
  probe moved with the camera, so the pixels chattered.
- The shader now bisects the actual empty-to-solid far-side crossing four times, normalizes with a
  deterministic view-facing fallback when a gradient is degenerate, and uses a 1.8-cell shading
  stencil to keep lattice terraces without pixel-scale normal flashes. Arrival data, first-hit
  geometry, Compose transforms and timing are unchanged. The original 768/512 first-hit budgets are
  retained after their rejected A/B.
- Capture-only `coverage` and `normals` views isolate geometry from shading without affecting normal
  playback. The exact 6,614-byte stability review (SHA-256
  `907d8aaca7cd95919cdbb2cc639fac5175b489512aa3215aadd1cace6ff00f4a`) at
  `out/named-crystal-volume-stability/final-review/report.json` binds ten 900×900 captures: the direct
  Simple Star, the maker's 12-branched Star at 5.5/5.6/final seconds, its solid-hit diagnostic, a
  six-component Radiating Dendrite, a thin plate, a needle, a hollow column and a capped column.
- The separate 1,602-byte headed-hardware report (SHA-256
  `bc0e05c34ed68139b886e426e7023a3718e5c8573f7306b3ac099baa9e9783e8`) records the exact NVIDIA /
  D3D11 renderer and two adjacent target frames. Its seek-plus-250-ms-settle-plus-PNG-capture times
  are 368 ms and 359 ms; the images remain clean across the small orbit step.
- All 99 card previews were regenerated. Their 19,066-byte report (SHA-256
  `5a316187e3bae4f9ed25bd1083865cfb772bcfdaf82784665b0033f494b0dcc3`) is
  `out/named-crystal-gallery-volume-previews/report.json`; accepted growth/scene bytes and web
  payloads did not change.
- `npx vitest run app/test/catalog-volume.test.ts app/test/growth-scene.test.ts
  app/test/named-crystal-catalog-service.test.ts` passed three files / nine tests. Both TypeScript
  projects, the app production build, Rule 7, all touched script syntax and diff checks passed. The
  218-byte complete browser log (SHA-256
  `0ca6239bc1ab4a303f717351d7570e5dfc848db2d6a715380ea9bfc85c3f7860`) records 66 direct / 33
  Compose players passing; the 152-byte gallery log (SHA-256
  `b649a4c733fa883992de9a44e36d56beedac0fde7bf3d0834a1f425adbf58103`) records the serving boundary
  plus direct/Compose modal smoke. Exact `npm test` and scientific gates were deliberately not run.
