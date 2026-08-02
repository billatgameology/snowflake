# Plan — GG realism gut check (eyeball-only exploration)

- **Phase:** Pre-Phase 7 exploration, maker-directed 2026-08-02. Not a charter phase gate.
- **Status:** complete — deliverables produced, agent eyeball verdict recorded below;
  the maker's own sentence of judgment is the one open slot
- **Started:** 2026-08-02
- **Last touched:** 2026-08-02 by Claude Fable 5 (`claude-fable-5`)

## Goal

De-risk the ADR 0029 Realistic-profile bet with one artifact: grow a large, noisy `GGThreshold`
crystal, extract a smooth surface from its checkpoint, render it with the ADR 0029 ice look
(refractive material, backdrop gradient, dark facet edges, near-orthographic face-on camera),
and put the image beside a named frame of
`research/snowcrystals.com-videos/J0521r2p-44-minute-2-5mm-1080w.mp4`. The deliverable is the
image plus one recorded human sentence of judgment. The code is disposable scaffolding around
that sentence.

This lives on branch `explore/gg-realism-gutcheck` (worktree
`../snowflake-gutcheck-gg-realism`). Merging into `main` is a separate, later maker decision;
discarding the branch entirely is an acceptable outcome and needs no ceremony.

## Done when

A rendered image of a `GGThreshold`-grown crystal exists beside a named target frame, and a
human's eyeball verdict is recorded in this file with the exact run command, seed, dims, preset,
and checkpoint path/hash beside it. **This is deliberately an eyeball-scale check** (Rule 6: if
you eyeballed it, write that you eyeballed it). No metric, no gate, no evidence claim; every
produced quantity and image is Evidence = unvalidated (charter §1.5).

## Approach

Use the permanent phenomenological floor, not the physical solver: the Gravner–Griffeath paper
(`research/GravnerGriffeath_PhysRevE09.pdf`) published convincing fernlike dendrites from the
algorithm `GGThreshold` faithfully implements, so shape realism here is re-execution risk.
Whether `LibbrechtKinetics` can do the same is Phase 6's question, not this spike's.

Pipeline: existing `grow --preset dendrite` (observational, no gate flags) at a few hundred
cells across on hexPrism with noise on → checkpoint + PGM dumps into gitignored `out/` →
new extraction script resamples the hex lattice and pulls a level-set mesh from the attached
indicator / boundary-mass field → three.js ice-look render → side-by-side.

Constraints that make the branch safe to discard or merge:

- **No edits to `core/`, `solver-cpu/`, or `runner/`.** Solver and checkpoints are consumed
  read-only; all new code in new files.
- Seeded counter-based PRNG with named streams for anything random, including render-side
  jitter. `Math.random()` stays banned here as everywhere.
- The Rule 7 scan covers this branch. three.js opacity API names are precedented in
  [phase-3-dev-visualization.md](phase-3-dev-visualization.md) (A2 acceptance notes); follow
  the same handling rather than inventing a new waiver.
- Runs follow the working-rules background pattern: labeled live log, error, and exit-status
  files under `out/gutcheck-gg-realism/`; report paths, not narration.

Host facts for this Mac (measured, commit `945437f`, Apple M4, Node v24.13.1): bitwise
reproducibility does not extend across architectures (tier-1 float64 physics inputs differ
x64 vs arm64), but habit-class results reproduced exactly at all four ADR 0032 points — for an
eyeball check the Mac is fine; record seed/params so any host can regrow it. Exact `npm test`
on macOS needs an unsymlinked `TMPDIR` (`os.tmpdir()` symlink trips the Phase 5 evidence guard
on the harness's own scaffolding; 31–32 known failures otherwise, reported in `945437f`, not
fixed). Rendering uses Chrome WebGPU (Metal) or the WebGL2 fallback already exercised by the
Phase 4 review harness; the Phase 5 authenticated evidence lane stays Windows/D3D12 and is not
implicated by anything here.

## Steps

- [x] Pick the run: start from `--preset dendrite`, noise on, hexPrism, ~`384,384,48`; consult
      the G-G paper's fernlike parameter sets if the preset disappoints. Record the exact
      command, seed, and dims in this file **before** launching.

  **Run record (written before launch, 2026-08-02).** Two sizing probes at `128,128,48`
  (verbatim stdout: `out/gutcheck-gg-realism/probe-128.log`, local only — `out/` is
  gitignored): the dendrite preset with `--noise 1e-5` (the G-G paper's stated order,
  gg-machinery §6) and `--seed 20260802` reached far-field stop at tick 3800 with
  `radius=38` (60% of hexRadius 63), `branches=6`, `AR=0.117`, ~8.4 ms/tick at 568,559
  active cells. Scaling to `384,384,48` (hexRadius 191, ~5.17M active cells, ~9.1× per-tick
  cost): expected stop near radius ~115 (≈230 cells across) at roughly tick 30–50k, order
  an hour of wall clock. Registered command (run from the worktree root):

  ```
  node runner/src/main.ts grow --preset dendrite --dims 384,384,48 --domain hexPrism \
    --ticks 60000 --seed 20260802 --noise 1e-5 \
    --metrics-every 500 --full-metrics-every 2000 \
    --pgm-every 1000 --pgm-dir out/gutcheck-gg-realism/pgm \
    --out out/gutcheck-gg-realism/dendrite-384x384x48-seed20260802.ckpt
  ```

  Preset `dendrite` = the paper's classic stellar dendrite (ρ = 0.1 per `core/src/params.ts`
  provenance comment; Fig. 14 of `research/GravnerGriffeath_PhysRevE09.pdf`). Observational
  run, no gate flags; a far-field or domain-contact stop are both acceptable terminations
  for an eyeball check. Logs: `out/gutcheck-gg-realism/grow.log` / `grow.err` /
  `grow.exit-status`.
- [x] Background `grow` run on the Mac writing checkpoint + PGM dumps under
      `out/gutcheck-gg-realism/` with live/error/exit files. Record the termination reason
      (a domain-contact stop is acceptable here — it invalidates gates, not looks).

  **Run outcome (copied from `out/gutcheck-gg-realism/grow.log` at write time):** stop
  `reason=far-field` at tick 14900, exit status 0. Final line: `attached=138249
  massDrift=3.708e-13 symErr=0 AR=0.0382979 hollow=0.0647034 sealedVoid=0.00121372
  branches=6 radius=117 farField=0.0666502 domainContact=false`. Noise broke the exact
  per-tick delta symmetry from tick 14091 (`deltaCheckCleanAllTicks=false
  firstAsymmetricTick=14091`) — expected for a noise-on run, no gate is claimed. Checkpoint
  `out/gutcheck-gg-realism/dendrite-384x384x48-seed20260802.ckpt` (120324920 bytes,
  `roundTripIdentical=true`), sha256
  `8aee546c478b50f41251b3bb1cb66e5d61bba263fa7c97522ee388aa8a54dd75` (printed by the
  extraction script from the file bytes). ~24 min wall clock, ~85 ms/tick.
- [x] Extraction script (new file): `scripts/gutcheck-extract-mesh.ts` — checkpoint →
      hex-lattice-aware resample (Gaussian splat through the exact embedding
      `x = i + j/2, y = j·√3/2, z = k`) → naive surface nets at iso 0.5 → binary mesh +
      optional OBJ. Smoke-tested on a re-grown 128,128,48 checkpoint (same seed/noise as the
      probe): 147k triangles, opens in the render page, not visibly voxelized. **Level-set
      answer to the open question below:** attached indicator = 1, and an unattached
      boundary cell is graded by its attachment progress `b / ggThreshBeta[2·min(nT,3) +
      min(nZ,1)]` — the G-G analog of the LK fill fraction (both measure progress toward
      deterministic attachment). Recorded in the mesh header for provenance.
- [x] Ice-look render per ADR 0029 sketch: `app/spike-gg-realism.html` +
      `app/src/spike-gg-realism.ts` (dev-server-only page) + deterministic Playwright capture
      `app/scripts/spike-capture.mjs` (throwaway Vite dev server, mesh served by route
      interception, single fixed frame, PNG at any viewport size; separate ports/paths from
      the review harnesses). Look: `MeshPhysicalMaterial` transmission ice, frustum-filling
      two-tone warm→cool gradient (matched to the target frame), designed
      oblique-illumination environment (warm patch up-left, dark horizon), directional
      edge pass (warm where facing the key light, dark indigo opposite, weighted by normal
      tilt off face-on). Converged on the smoke mesh over 5 iterations; final render happens
      on the 384 mesh.
- [x] Side-by-side against a named J0521r2p frame (state the timestamp). Record the eyeball
      verdict here: what reads as real, what gives it away, one-line recommendation for
      Phase 7 planning. **Frame chosen:** 23.633 s (frame 709 of 788 @ 30 fps ≈ 90% of the
      26.27 s video), extracted with ffmpeg 8.0.1 from the main repo's local copy to
      `out/gutcheck-gg-realism/target-frame-23.633s.png`. Copyright: Libbrecht holds the
      video copyright (research/snowcrystals.com-videos.md), so the extracted frame and any
      composite containing it stay in gitignored `out/` and are never committed or published.
      Verdict recorded in **Eyeball verdict** below.
- [x] Append every dead end to **Tried and rejected** as it happens, not at the end.

## Deliverables (all local under gitignored `out/gutcheck-gg-realism/`; sha256 at write time)

Everything below is **Evidence = unvalidated** (charter §1.5); nothing here supports any gate.

| Artifact | Path | sha256 |
|---|---|---|
| Checkpoint (tick 14900) | `dendrite-384x384x48-seed20260802.ckpt` | `8aee546c478b50f41251b3bb1cb66e5d61bba263fa7c97522ee388aa8a54dd75` |
| Level-set mesh (436,255 verts / 872,344 tris) | `dendrite-384-mesh.bin` | `271eacd778829d536e45c17aae4f8173d9fb5c1ebf2da2ff962e15ac7b261d43` |
| Final render, 1600×1600 | `render-384-final.png` | `6305d48f89dd1a8a6ce86679f84611239c6f905737d3cc4e12e5c299f098da8f` |
| Side-by-side (render left, J0521r2p @ 23.633 s right) | `side-by-side-23.633s.png` | `b90c64041f3c0637cf0389471d19e37cbc816be0f6aedabe1a8fe03168a5c984` |

Reproduction from the checkpoint (or regrow with the registered command above):

```
node scripts/gutcheck-extract-mesh.ts out/gutcheck-gg-realism/dendrite-384x384x48-seed20260802.ckpt \
  out/gutcheck-gg-realism/dendrite-384-mesh.bin --sigma 0.45 --spacing 0.4
node app/scripts/spike-capture.mjs --mesh out/gutcheck-gg-realism/dendrite-384-mesh.bin \
  --out out/gutcheck-gg-realism/render-384-final.png --size 1600 \
  --params "keyI=2.4&fillI=0.9&thick=12&edge=1.1&edgePow=1.9&rough=0.045&zscale=2.5&bgTop=eeca7a&bgBottom=c3c9ee"
ffmpeg -y -i out/gutcheck-gg-realism/render-384-final.png -i out/gutcheck-gg-realism/target-frame-23.633s.png \
  -filter_complex "[0:v]scale=1080:1080[left];[1:v]crop=1424:1080:248:0,scale=-2:1080[right];[left][right]hstack=inputs=2" \
  out/gutcheck-gg-realism/side-by-side-23.633s.png
```

Pixel identity of the PNGs across machines is not claimed (GPU rasterization); the mesh is
deterministic given the checkpoint and flags. Suite check after all spike files were in the
tree: exact `npm test` with `TMPDIR=/private/tmp`, exit 0, 1431 passed / 7 skipped
(`out/gutcheck-gg-realism/npm-test.log`).

## Eyeball verdict

**Provenance: this is Claude Fable 5's (`claude-fable-5`) eyeballed judgment of
`side-by-side-23.633s.png`, written 2026-08-02. It is an aesthetic comparison, not a
measurement; nothing here is validated. The maker's own sentence goes in the slot below.**

What reads as real: the silhouette. A sixfold fernlike stellar dendrite with six distinct
arms, plausible sidebranch hierarchy, transparent refractive ice whose interior color is
genuinely the refracted backdrop (no white volume), directional dark-edge/warm-glint line
work, and a smooth, nowhere-voxelized surface. At arm's length it reads as a snow crystal,
and the G-G shape realism itself was never the risk (the paper's own figures are the
control).

What gives it away, in one glance next to the footage: (1) **tip character** — the real
crystal ends every branch in crisp hexagonal facets and arrowhead sector plates; the G-G
dendrite's tips are knobby and rounded in this render. *[Attribution corrected below: the
roundness is the extraction smoothing, not the model — see the Correction paragraph.]*
(2) **Interior relief depth** — the footage's center is packed with bold radial
ridges, concentric ribs, and a central hexagon; the G-G plate interior is nearly flat, and
even with the recorded 2.5× z-relief stylization its features are an order of magnitude
shallower. (3) Line boldness — the footage's contour lines are thick and clean; the
render's are thin and speckled at lattice scale.

One-line recommendation for Phase 7: **the ADR 0029 ice look transfers — the open risk is
surface structure, not shading** — the backdrop/refraction/oblique-edge/orthographic shell
worked on the first real mesh, while both giveaways (facet-straight tips, deep interior
relief) are exactly what `LibbrechtKinetics`' faceted kinetics plus a relief-preserving
level set are supposed to supply, supporting the ADR's choice to pair the Realistic
profile with LK rather than G-G.

**Correction (same session, after the maker asked why the G-G figures aren't reproduced).**
The paragraph above over-attributed giveaway (1): a differential extraction at σ = 0.30,
spacing 0.35 (`dendrite-384-mesh-s030.bin`, sha256
`a6bbdaaca732fc5bc3f914345a7f645c56a99be81d6eedf61bd31f545a37bfa6`; render
`render-384-s030.png`, sha256
`355e0d2310da6b6946e36b8aafef51ac1ec1f2a803d8af9a79f076c92d417023`, same render params as
the final) restores crisp 60°/120° hexagonal facet lines at tips, flanks, and interior
voids. **The tip roundness was the σ = 0.45 extraction smoothing, not the model** — the
model's facets are lattice-crisp, exactly as the paper's own cell-true prism figures show.
The measured statement is: at this crystal size (radius 117), facet crispness and
smooth-surface continuity trade off directly through the smoothing width; σ = 0.30 is
facet-crisp but lattice texture starts to show, σ = 0.45 is smooth but rounds few-cell
features. The remaining honest gaps against the footage are (a) **crystal scale** — the
paper's case studies run to radius ≈ 350 (70,000 steps, §VII) and the J0521r2p crystal is
2.5 mm ≈ radius 1250 at the paper's ~1 µm-per-cell reading, versus our far-field-stopped
radius 117, so its feathery fern texture lives at 3–10× our linear scale — and (b)
**interior relief depth** on the AR 0.038 plate (the model's ridges are present in the
render but shallow). Both statements are eyeball comparisons of the named images.

**Paper-figure comparison (added with the correction).** G-G's paper (§III, p. 4) names
its rendering pipeline but does not fully specify it: crystals are drawn as the visible
boundaries of fundamental prisms on attached sites (cell-true), a boundary smoothing that
"enlarges the crystal by no more than one mesoscopic unit" is applied without stating the
algorithm, MATLAB `PATCH` renders faces with edges *drawn on* via the `LINE` routine (the
figures' dark line work is an overlay, not optics), and photo-viewpoint comparisons use a
POV-RAY `MESH2` ray-trace whose scene/lighting are not given. Its ray-traced figures
(pp. 9–10) are stylized white-on-dark-blue backlit images, not photo-real microscope
looks. So "reproduce the paper's rendering" was never a fully specified target; this
spike's target was deliberately the harder one — the ADR 0029 ice look against real
footage. If a paper-scale crystal is wanted for a future comparison, the reflecting
far-field ratio measured here (stop at radius ≈ 0.61 × hexRadius, two runs) implies
dims ≈ 1152,1152,48 (hexRadius 575, ~47M active cells, ~3.4 GB, roughly 8–15 h on this
Mac at the measured ~16 ns per cell-tick) to reach radius ≈ 350 — an option, not a
commitment.

**Maker verdict (one sentence, in the maker's own words):** _pending._

## Out of scope

- Any `LibbrechtKinetics` run — LK realism is Phase 6's question.
- Any edit to solver packages, Phase 6 lanes, artifacts, protocols, or `evidence/`.
- `solver-gpu/`, charter edits, ADRs, education content.
- Merging into `main` (separate maker decision after the verdict exists).
- Any claim stronger than the recorded eyeball sentence. No output of this branch is evidence
  for any gate, and none of it migrates into education or Phase 6/7 records except via a
  future, properly labeled plan.

## Tried and rejected

All entries 2026-08-02, eyeballed on the 128,128,48 smoke mesh (renders kept locally as
`out/gutcheck-gg-realism/smoke-render*.png`, superseded iterations numbered in order):

- **Radial "condenser-spot" backdrop** — rejected on first comparison with the actual
  23.633 s target frame: the footage backdrop is a smooth near-vertical linear gradient,
  warm pale amber above to cool blue-lavender below, not a bright center with vignette.
- **Backdrop plane sized 4× the subject** — the camera frustum saw only the flat center of
  the gradient, so the designed two-tone read as a plain wall. The plane must be sized to
  the frustum.
- **`RoomEnvironment` as the IBL** — a uniformly bright environment reflects white into
  every slightly-tilted facet and the transparent ice reads as milky plastic; lowering its
  intensity just fades it toward invisible. Replaced with a designed oblique-illumination
  environment (bright warm patch up-left, dark horizon band, dim cool floor) so face-on
  facets stay clear while steep walls reflect darkness.
- **Expecting PBR transmission alone to produce the dark facet-edge lines** — three.js
  screen-space transmission refracts into whatever backdrop pixel the bent ray lands on,
  which is always bright here; it cannot express "ray deviated outside the microscope's
  collection cone", which is what actually makes the footage's edges dark. Approximated
  honestly with a separate normal-tilt edge pass (dark where the surface tilts off
  face-on), tinted directionally: warm toward the key-light flank, dark indigo opposite —
  which also supplies the footage's amber/indigo oblique-illumination split that
  physically-correct neutral lighting never produced.
- **Smoothing σ = 0.6 lattice units at 0.5 spacing** — visibly rounder than the footage;
  interior relief mostly gone on the small smoke crystal. σ = 0.45 at 0.4 spacing keeps
  branch relief while still not voxelized. (ADR 0029's cost note — relief-preserving
  smooth extraction is genuinely harder than blocky or over-smoothed — is confirmed by
  direct experience here.)
- **Rendering the 384 plate at true 1:1 z proportions** — at aspect ratio 0.038 the
  face-on relief shading nearly vanishes and the crystal reads as a faint ghost
  (`out/gutcheck-gg-realism/render-384-v1.png`). Kept a `?zscale=` exaggeration knob
  (final render uses 2.5×) and recorded it as a stylization, not a model claim. The honest
  fix is a model whose plate actually carries deep relief — see the verdict.

## Open questions — all resolved during implementation

- Where the render code lives → **`app/` dev-only page** (`app/spike-gg-realism.html` +
  `app/src/spike-gg-realism.ts`, strict-typechecked and Rule 7-scanned) plus committed
  scripts (`scripts/gutcheck-extract-mesh.ts`, `app/scripts/spike-capture.mjs`). Untracked
  `out/` scripts were rejected because the deliverable code had to be committable and
  reviewable.
- Which field defines the level set → **attached indicator graded by attachment progress
  `b / ggThreshBeta[2·min(nT,3) + min(nZ,1)]` on unattached boundary cells** (see the
  extraction step above). This is the G-G analog of the LK fill fraction, and it worked:
  the surface advances sub-cell smoothly between attachments. Phase 7 input as hoped.
- Canonical comparison frame → **23.633 s** (frame 709/788, ≈90% of duration).
