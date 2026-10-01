# Plan — Glass look and legacy-camera parity for compact Run B

- **Phase:** Maker-directed Journey/media exploration; not a charter phase gate
- **Status:** implementation candidate complete; fresh browser/visual acceptance pending
- **Started:** 2026-08-16
- **Last touched:** 2026-08-16 by OpenAI Codex

## Goal

Make the compact Run B attachment-time replay use the existing named `glass` presentation and
follow the exact camera choreography authored for the legacy `growth-B-intro` video. The two sides
should therefore sample the same authored growth and camera tracks, although their playback
controls remain independent rather than transport-locked. The compact side retains exact-tick
seeking and a user-controlled orbit override. This changes only the media presentation; exact
attachment events, evidence labels, source identity and phase authority remain unchanged.

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
compact arrival-volume player. Compile-time source binding keeps the exact committed scene bytes in
the production build; the comparison iframe does not perform an unauthenticated runtime scene fetch
or duplicate the four camera poses in query parameters or prose.

The compact renderer cannot reuse `MeshPhysicalMaterial` directly because its surface exists only
inside the ray-marching shader. Give that shader a named glass presentation branch: preserve the
exact first-hit geometry and depth, keep the proxy material opaque for correct depth and sorting,
and precompose a normal/IOR-offset sample of the same backdrop with Fresnel rim/specular response.
This cannot reveal or refract far arms like a two-surface optical renderer; it is a nonphysical
glass-styled presentation approximation and remains covered by the existing unvalidated label.

The scene clock owns automatic playback. The scene frame track maps seconds to exact growth ticks;
the scene camera track maps the same seconds to tilt/yaw/zoom. Manual seeking applies both tracks.
`OrbitControls` remains available, but its first user interaction disables camera following so the
authored path does not fight the user; a named restore control re-enables and reapplies the current
scene pose.

## Steps

- [x] Audit the legacy scene, current look registry, compact shader/player and comparison harness.
- [x] Record and commit this bounded plan before executable changes.
- [x] Add and independently test the shared strict scene-track sampler.
- [x] Add the compact glass shader branch and expose its presentation identity in debug state.
- [x] Drive compact growth, camera, seeking and pause from the legacy scene clock with manual orbit
      override and reduced-motion handling.
- [x] Wire the exact committed scene into the comparison page without executing or retargeting the
      retired publisher.
- [x] Run focused checks, exact `TMPDIR=/private/tmp npm test`, the production build and one
      proportionate non-author source audit; repair every blocker/high finding.
- [ ] Supersede the local browser-capture contract, run a fresh browser capture and visually inspect
      the accepted views before calling the new appearance accepted evidence.
- [ ] Close this plan only after that browser/visual boundary is satisfied; keep the historical v5
      record and its screenshots unchanged meanwhile.

## Out of scope

- Changing the compact event asset, Run B solver result, legacy mesh sequence or legacy MP4 bytes.
- Claiming optical refraction, physical ice appearance, scientific validation or camera pixel
  identity between two different surface representations.
- Removing free orbit, forcing camera motion under reduced-motion preferences, or making the camera
  track a second source of growth truth.
- Making the independently controlled legacy and compact panes share a live transport clock.
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
- **Use transparent proxy-box blending for the glass body.** Rejected because the implicit surface
  needs its refined first-hit depth; proxy transparency would introduce sorting errors without
  revealing the crystal's true far surface.

## Open questions

- Whether a later renderer should add true two-surface thickness/refraction. This follow-up first
  measures the cheaper backdrop-precomposited Fresnel treatment; no optical-fidelity claim depends
  on it.

## Implementation record — 2026-08-16

The executable candidate now compile-time binds the exact UTF-8 bytes of
`app/scenes/growth-B-intro.json` under presentation id `run-b-intro-v1`; its source SHA-256 is
checked by `app/src/gutcheck-scene-motion.ts`, and `app/scenes/.gitattributes` prevents Windows
checkout conversion from changing those bytes. The legacy scene player, scene editor and compact
player use the same strict camera/frame sampler. The compact player continuously samples the
authored frame coordinate for smooth motion while its integer-tick seek path retains the exact
requested tick, including values whose time round-trip lands on an adjacent binary float.

The compact shader keeps its first implicit hit, opaque depth write and front-face proxy, then
precomposes a normal/IOR-offset sample of the same backdrop with Fresnel, roughness, specular and
clearcoat-inspired terms. Its UI says `GLASS-STYLED`, `MODEL / UNVALIDATED` and nonphysical; it does
not claim true far-surface refraction. The comparison page binds poster times 0, 6.5 and 13 seconds,
requires matching appearance/presentation debug identity and explicitly says the panes are not
transport-locked.

Exact `TMPDIR=/private/tmp npm test` exited 0 on the repaired tree, and
`npm run build --workspace app` exited 0. A non-author OpenAI Codex audit with inherited full
context independently ran the app typecheck and focused tests, found the camera-damping,
manual-seek, Windows-EOL and exact-tick seams, then reported no remaining blocker/high finding after
their repairs. Its limits were no browser/WebGL execution, screenshots, NAS access or publication.

The generated local review site was refreshed as an **unaccepted candidate** at
`out/gutcheck-growth-runB/review-site-v1`; the unchanged local URL is
`http://127.0.0.1:4177/gutcheck-growth-comparison.html?record=%2Fcomparison-record.json`. Browser
selection returned no available session, so no fresh WebGL capture or visual inspection exists in
this record. The historical v5 browser record remains the latest accepted visual evidence, but it
validates the prior bold-ice/stationary-camera presentation only and must not be cited for this
candidate.

## Integration record — 2026-09-12

Branch `explore/education-ch1-video` is the sole surviving PR branch for this candidate and the
related Journey/media history. It merged fetched `origin/main` at `c2dd1d4` into branch head
`0882118`, preserving both compact `?growth=` and composed `?growthScene=` render paths. The Rule 16
audit found the clean `main` worktree and unattached `plan/phase10-options` branch unrelated; ignored
`out/gutcheck-growth-runB/` remains this plan's local, excluded candidate output. Merge commit
`5ef0d69` is published in [PR #13](https://github.com/billatgameology/snowflake/pull/13).

Focused replay/NAS/progress tests, both loopback-serving files with bind permission, typecheck, and
the app build pass on the reconciled tree. Exact `TMPDIR=/private/tmp npm test` reproduces the
already-recorded `main` catalog failures; additional sandbox-only bind denials pass in those focused
permitted runs. This reconciliation does not supply the still-pending fresh browser/WebGL visual
acceptance.
