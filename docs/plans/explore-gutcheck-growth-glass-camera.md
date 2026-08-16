# Plan — Glass look and legacy-camera parity for compact Run B

- **Phase:** Maker-directed Journey/media exploration; not a charter phase gate
- **Status:** in progress
- **Started:** 2026-08-16
- **Last touched:** 2026-08-16 by OpenAI Codex

## Goal

Make the compact Run B attachment-time replay use the existing named `glass` presentation and
follow the exact camera choreography authored for the legacy `growth-B-intro` video. The two sides
of the comparison should therefore carry the same growth timing and camera movement while the
compact side retains exact-tick seeking and a user-controlled orbit override. This changes only the
media presentation; exact attachment events, evidence labels, source identity and phase authority
remain unchanged.

## Done when

This follow-up has no charter milestone. It is done when all of the following are true:

- the compact renderer has an explicit glass branch whose background remains visible through the
  crystal body and whose rim/specular treatment remains legible at the accepted start, middle,
  final and oblique views;
- the compact player consumes the exact committed camera and frame tracks from
  `app/scenes/growth-B-intro.json`, including its 16-second duration, default in/out-cubic
  interpolation, camera poses at 0/6/11/15.5 seconds, growth reaching tick 70,000 at 13 seconds,
  and the 13–16 second final-state hold;
- exact-tick poster seeks map to the legacy video times 0, 6.5 and 13 seconds and apply the same
  sampled tilt, yaw and zoom as the legacy scene player;
- autoplay drives growth and camera from one virtual scene clock, pausing holds both, reduced
  motion suppresses both automatic tracks, and starting a manual orbit suspends camera following
  until an explicit control restores it;
- a shared, independently tested sampler prevents the legacy and compact players from acquiring
  separate interpolation meanings;
- the comparison page identifies the compact side as the glass look with matched camera movement
  without upgrading its `MODEL / UNVALIDATED` status;
- focused adversarial tests cover malformed scene data, track endpoints, interpolation, final hold,
  manual override, reduced motion and comparison URL wiring; exact `TMPDIR=/private/tmp npm test`
  and the production app build pass; and
- a fresh real-browser comparison record and direct visual inspection confirm glass readability,
  matched camera witnesses, exact seek/reverse behavior, zero legacy-mesh requests, responsive
  containment and the existing five failure lanes before the local review bundle is replaced.

## Approach

Treat `app/scenes/growth-B-intro.json` as the one camera/timing authority. Add a small browser-safe
scene-track parser and sampler, then use that same sampler in both the legacy scene player and the
compact arrival-volume player. The comparison page passes the committed scene asset to the compact
iframe; it does not duplicate the four camera poses in query parameters or prose.

The compact renderer cannot reuse `MeshPhysicalMaterial` directly because its surface exists only
inside the ray-marching shader. Give that shader a named glass presentation branch: preserve the
exact first-hit geometry and depth, but use a low-opacity body with stronger Fresnel rim/specular
response over the existing glass backdrop. This is a presentation approximation, not physical
refraction, and remains covered by the existing unvalidated label.

The scene clock owns automatic playback. The scene frame track maps seconds to exact growth ticks;
the scene camera track maps the same seconds to tilt/yaw/zoom. Manual seeking applies both tracks.
`OrbitControls` remains available, but its first user interaction disables camera following so the
authored path does not fight the user; a named restore control re-enables and reapplies the current
scene pose.

## Steps

- [x] Audit the legacy scene, current look registry, compact shader/player and comparison harness.
- [x] Record and commit this bounded plan before executable changes.
- [ ] Add and independently test the shared strict scene-track sampler.
- [ ] Add the compact glass shader branch and expose its presentation identity in debug state.
- [ ] Drive compact growth, camera, seeking and pause from the legacy scene clock with manual orbit
      override and reduced-motion handling.
- [ ] Wire the exact committed scene into the comparison page and extend browser/publisher checks.
- [ ] Run focused checks, exact `TMPDIR=/private/tmp npm test`, production build and a fresh browser
      capture; visually inspect the accepted views and repair blockers.
- [ ] Update this plan and `docs/PROGRESS.md`, replace the local review bundle, obtain one
      proportionate non-author review and commit the completed follow-up.

## Out of scope

- Changing the compact event asset, Run B solver result, legacy mesh sequence or legacy MP4 bytes.
- Claiming optical refraction, physical ice appearance, scientific validation or camera pixel
  identity between two different surface representations.
- Removing free orbit, forcing camera motion under reduced-motion preferences, or making the camera
  track a second source of growth truth.
- Governed NAS publication, public hosting, mobile/hardware-GPU/cross-browser performance acceptance
  or accessibility certification beyond the existing bounded checks.

## Tried and rejected

- **Copy the four camera poses into compact-player code.** Rejected because the legacy scene JSON
  would remain a separate authority and the two tracks could drift silently.
- **Call the existing opaque first-hit shader glass after changing only its colors.** Rejected
  because the named glass look is defined by backdrop visibility through the body; white opaque
  shading would preserve the label but not the requested appearance.
- **Keep linear 0–70,000 growth across all 16 seconds.** Rejected because the legacy scene reaches
  its final frame at 13 seconds and holds it while the camera completes the last move.
- **Let scripted camera updates and `OrbitControls` run simultaneously.** Rejected because the
  authored track would continually overwrite user input and the advertised free camera would be
  misleading.

## Open questions

- Whether a later renderer should add true two-surface thickness/refraction. This follow-up first
  measures the cheaper transparent Fresnel treatment; no optical-fidelity claim depends on it.
