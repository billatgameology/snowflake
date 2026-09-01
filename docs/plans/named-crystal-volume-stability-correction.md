# Named snow-crystal volume stability correction

**Status:** active
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
- `simple-stars-baseline` has a `525×525×29` cropped volume, or 743.03 cells across its box
  diagonal. Quality 3 requests 1.55 samples per crossed cell (1,152 steps) but is capped at 768,
  reducing that ray to 1.03 samples per cell. The cap can skip the narrow isosurface around
  one-cell branch detail; which samples miss changes as the camera moves.
- The complete live scene census finds the configured march cap truncates 37 of 195 component
  instances. The largest six-component Radiating Dendrite case requests 892 quality-2 steps but is
  capped at 512, a still larger shortfall.
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
  shader ceiling, while the configured sampling rate asks for 1,152 steps on the reported direct
  source and 892 on the six-component Radiating Dendrite source.
