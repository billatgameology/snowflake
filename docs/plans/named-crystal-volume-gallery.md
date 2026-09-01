# Named snow-crystal volume-rendered gallery

**Status:** active
**Registered:** 2026-08-31
**Worktree:** `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog`
**Branch:** `feature/named-crystal-catalog`

## Goal

Replace the visually flat instanced-cell animation view in the completed local catalog with an
ice-volume presentation derived from the existing GG website's renderer. Preserve all accepted
growth records, direct/Compose disclosures, exact content identities and less-than-20,000,000-byte
per-animation web payloads. This is a presentation correction, not new solver physics.

## Measured starting point

- The exact 1,948,261-byte `simple-prisms-lower` growth record decoded without error in the GG
  website renderer and exposed substantially more surface, thickness and internal detail than the
  catalog player. The underlying record is therefore not the cause of the presentation failure.
- All 66 direct accepted records decode under the GG website's strict growth decoder. The largest
  full-detail cropped arrival volume is 10,147,167 cells / 40,588,668 bytes in memory; the tallest
  crop is 415 layers. The current browser reports 2,048 array-texture layers.
- Compose scenes contain at most six component instances and at most 38,577,364 bytes of unique
  full-detail arrival-volume data because repeated component identities can share one texture.
- Existing color presets do not close the gap. `footage-ice`, `povray`, `glass` and `frost` remain
  flat, washed out or dominated by visible cell layering.

## Approach

1. Add a dedicated vanilla Three.js volume player, keeping the current strict scene and growth
   endpoints. Decode each accepted growth record into its header-defined crop and upload attachment
   ticks as an integer array texture.
2. Raymarch a continuous revealed surface and shade it with a synchronized studio environment:
   directional key/rim/fill cards, Fresnel/GGX surface response, Beer-Lambert depth, transmission,
   clearcoat, contact darkening, restrained edge color and fresh-growth emphasis.
3. Use a perspective camera with smooth tracked framing and a resting orbit. Respect tall-form
   vertical extent and the accepted Compose transforms/phase offsets.
4. Cache decoded assets and textures by SHA-256 so repeated Compose components share storage. Keep
   the old instanced player available only as a capability fallback.
5. Point the gallery modal at the new player and regenerate its accepted preview stills only after
   the live player passes the visual sentinels.

## Done when

- The same accepted direct record shows clear edge, thickness, terrace and internal-growth detail
  comparable to the existing GG website showcase, without a washed-out silhouette.
- Direct planar, simple needle, hollow column and capped-column sentinels load, grow, remain fully
  framed and settle into a smooth orbit.
- Crossed Plates, Radiating Dendrites and Multiply Capped Columns Compose sentinels retain their
  component transforms and phase offsets, use shared textures where identities repeat, and remain
  fully framed.
- All 99 catalog cards open the new player; direct and Compose disclosures remain truthful and the
  existing `<20 MB` network-payload claims remain unchanged.
- Focused decoder/scene/geometry tests, both TypeScript projects, the app build, Rule 7, diff check,
  and a real-browser sentinel smoke pass. This presentation-only scope does not run exact
  `npm test` or scientific gates.
- `docs/PROGRESS.md` records the completed visual correction and the loopback page is opened for the
  maker.

## Out of scope

- Solver changes, regenerated growth histories, new physical operators, evidence/gate changes or
  scientific validation claims.
- Public deployment, NAS publication or copying the 99 products into another repository.
- Replacing the accepted Compose construction with a claim that it is one solver state.

## Tried and rejected

- **Retune the old `bold-ice` preset.** Rejected by the four-look browser comparison: the animation
  path remains instanced cells with no growth-scene edge pass, so color changes cannot recover the
  missing surface representation.
- **Use the old player with a darker background.** Rejected because contrast alone does not add
  thickness marching, surface normals, coherent refraction, tracked perspective or Compose-aware
  volume shading.
