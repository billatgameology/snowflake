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

## Follow-up runs — paper-scale portfolio, three in parallel (LAUNCHED 2026-08-02, maker-approved)

Written 2026-08-02 in answer to the maker's "before you run the 8–15 hr job, tell me
exactly what your plan is," extended same-day after the maker asked for parallelism, and
**launched same day on the maker's "go"** — all three commands exactly as registered
below. Startup verified: each run reports `hexRadius=599, zHalfExtent=23,
activeCells=50675447, seedSites=19, seedSymErr=0` and holds a full core (~1.8 GB steady
deterministic, ~2.8 GB noisy). Expected completion ≈ 10–18 h from launch; results land in
the named logs/checkpoints regardless of which session harvests them. Per the working rules, independent cases run as separate
single-threaded Node processes; on this 10-core / 24 GB M4, three paper-scale runs cost
the same wall clock as one (4 performance cores; ~2.6–3.4 GB steady each; the ~6 GB
checkpoint round-trip transients only overlap if two runs finish simultaneously — worst
case ≈ 22 GB, acceptable, briefly swappy).

**Goal.** Close the "did we reproduce the paper?" question figure-to-figure at the
paper's own scale (case studies run to radius ≈ 350), and re-run the ADR 0029 ice-look
comparison without the scale handicap — three separable questions, one per process, all
with the existing `grow` CLI (no new code, `runner/` stays untouched).

**Run A — classic dendrite vs paper Fig. 14 (exact command, from the worktree root):**

```
node runner/src/main.ts grow --preset dendrite --dims 1200,1200,48 --domain hexPrism \
  --ticks 80000 --noise 0 \
  --metrics-every 500 --full-metrics-every 2000 \
  --pgm-every 2000 --pgm-dir out/gutcheck-gg-realism/pgm-1200 \
  --out out/gutcheck-gg-realism/dendrite-1200x1200x48-noise0.ckpt
```

- `--noise 0`, deliberately unlike the first run: the paper's case-study figures are
  deterministic (§III C: "Our only three-dimensional virtual snowflakes to date are
  deterministic"), so noise-off is the paper-faithful setting. Seed is then unread
  (default 1, unused). Bitwise-reproducible on this oracle/engine; exact D6h symmetry
  expected at every cadence (`symErr=0`) — a nice large-scale exhibit, but **no gate is
  claimed**.
- Sizing, from measured facts: both completed runs stopped at radius ≈ 0.61 × hexRadius
  (38/63 and 117/191, noise-on). Dims 1200 → hexRadius 599 → predicted far-field stop at
  radius ≈ 350–365. Domain-contact guard will not fire first (2·365/1200 = 61% < 65%).
  Tick cap 80,000 ≈ 1.8× the naive extrapolation (350 / 0.0079 cells·tick⁻¹ ≈ 44k ticks;
  paper's radius-350 plate took 70k steps).
- Cost, from measured facts: ~50.7M active cells at ~16 ns/cell·tick (measured on the 384
  run) ≈ 0.8 s/tick → **10–18 h wall clock**; ~2.6 GB steady (noise-off arrays), ~7 GB
  transient at the checkpoint round-trip; host has 24 GB (`hw.memsize`), so it fits. Same
  log/error/exit-status file pattern, `grow-1200.*` names.
- Fallback semantics recorded up front: if the tick cap fires before radius 350, the
  result is still a valid eyeball object; the shortfall gets recorded, not hidden.

**Run B — plate prototype vs paper Fig. 4 (§VII: 70,000 steps, radius ≈ 350, "ridges
and plates"):**

```
node runner/src/main.ts grow --preset plate --dims 1200,1200,48 --domain hexPrism \
  --ticks 70000 --noise 0 \
  --metrics-every 500 --full-metrics-every 2000 \
  --pgm-every 2000 --pgm-dir out/gutcheck-gg-realism/pgm-1200-plate \
  --out out/gutcheck-gg-realism/plate-1200x1200x48-noise0.ckpt
```

`--ticks 70000` deliberately matches the paper's stated step count for Fig. 4. The solid
plate is more massive than the skeletal dendrite, so the reflecting reservoir may
far-field-stop it before radius 350 — whichever termination fires is recorded. Fig. 4's
"extensive branching but also regularly shaped plates, or facets" plus midline ridges is
also, of the four presets, the closest morphology class to the J0521r2p footage specimen
(a broad-branched sector plate), so B doubles as the best realism candidate.

**Run C — noisy dendrite at paper scale, the realism-redux crystal:**

```
node runner/src/main.ts grow --preset dendrite --dims 1200,1200,48 --domain hexPrism \
  --ticks 80000 --seed 20260802 --noise 1e-5 \
  --metrics-every 500 --full-metrics-every 2000 \
  --pgm-every 2000 --pgm-dir out/gutcheck-gg-realism/pgm-1200-noise \
  --out out/gutcheck-gg-realism/dendrite-1200x1200x48-noise1e-5-seed20260802.ckpt
```

Same configuration lineage as the completed gut-check run (same seed and noise, bigger
domain). A and B are deterministic and therefore perfectly symmetric — itself a realism
giveaway; C carries the natural slight asymmetry the footage comparison wants. ~0.8 GB
extra steady memory for the noise fields.

Logs per run: `grow-1200-dendrite-n0.{log,err,exit-status}`, `grow-1200-plate-n0.*`,
`grow-1200-dendrite-noise.*` under `out/gutcheck-gg-realism/`.

**Expected result (prediction, written before the run so hindsight can't edit it):** A: a
deterministic, exactly sixfold-symmetric stellar dendrite ≈ 700 cells across with dense
alternating sidebranches and midline ridges — Fig. 14's "classic dendrite" morphology at
Fig. 14's scale. B: a broad hexagonal plate that destabilizes into six ridged, faceted
branches with plate-like sector fill between them — Fig. 4's morphology; stop radius
honestly uncertain (reservoir-limited, possibly < 350). C: run A's morphology class with
slight natural asymmetry and stochastic sidebranch placement. Two extractions per
checkpoint: crisp (σ ≈ 0.30–0.35) for the figure comparisons, and the ice look at the σ
trade-off sweet spot for the footage comparison. If A's sidebranch texture does *not*
match Fig. 14 qualitatively, that is a
real fidelity finding (likeliest suspects, in order: boundary condition — our reflecting
hexPrism reservoir vs the paper's large-lattice treatment — then scale-dependent
depletion; a solver defect is unlikely given the Phase 2a gates but would outrank this
spike if implicated).

**Comparisons the outputs feed (both eyeball-only, Evidence = unvalidated):**

1. Primary — G-G Phys. Rev. E **79** 011601, Fig. 14 (ρ = 0.1), p. 9: same parameters,
   same scale, our render vs their published figure. APS holds the figure copyright, so
   that composite stays in gitignored `out/` like the video frame.
2. Secondary — J0521r2p @ 23.633 s again: same target frame as the completed gut check,
   now without the 3–10× scale handicap. Stated limit: the footage specimen is a 2.5 mm
   broad-branched sector-plate crystal grown under changing conditions; ours is a
   fixed-parameter classic dendrite at radius ≈ 350 — this compares look and texture,
   not specimen morphology. C (noisy) is the primary crystal for this lane; B competes
   if its sector-plate morphology reads closer.
3. B primary — G-G Fig. 4 (p. 3, the §VII prototype): same parameters, same 70,000-step
   count, our render vs their published figure. Same copyright handling as Fig. 14.

### Run A outcome and the Fig. 14 discrepancy (recorded 2026-08-02 evening)

A ended `stop reason=domain-contact` at tick 57834, radius 390, attached 1046549,
`symErr=0` at every cadence, `deltaCheckCleanAllTicks=true`, massDrift 2.389e-12,
checkpoint `dendrite-1200x1200x48-noise0.ckpt` (1175040817 bytes, roundTripIdentical=true,
sha256 `8d2079790c3132bec0966fbe7bc7e454f8831191a072dbace56e014c9d751554`), exit 0, final
state guard-flagged NOT valid evidence as expected. ~8.6 h wall clock (0.53 s/tick).

**Discrepancy.** The crystal (occupancy dumps `pgm-1200/occupancy-*.pgm`; crisp mesh
`dendrite-1200-mesh-s030-h06.bin`) is six slender arms with short sparse sidebranches —
sparse from at least radius ~213 (tick 30000) onward, not just late. Verified against the
paper before theorizing: §VIII "Case study 2: classic dendrites" states exactly our preset
vector (β01=1.6, β10=β20=1.5, β11=1.4, β30=β21=β31=1, κ≡0.1, all μ≡0.008, φ=0; ρ=0.1 for
Fig. 14), the series crystals are "our largest crystals, with radii around 400" (ours:
390), their stop rules are ours (edge density below "typically 2ρ/3 or ρ/2", or radius
> 80% of system radius; §III), and their case-study dynamics are deterministic (§III C).
Parameters, scale, stop rules, determinism all match — yet eyeballed against the page-9
figure images (extracted via pdfimages, kept out of the repo), our ρ=0.1 crystal
resembles their ρ≈0.09 "simple star" more than their ρ=0.1 classic dendrite. One
systematic difference found in §III: their domain is a hexagonal prism with **periodic**
boundary conditions and an **unstated z-extent**; ours is a reflecting-wall slab with
zHalfExtent 23 — a value this spike inherited from the original dims suggestion and never
examined. Both conditions conserve vapor, so the live hypothesis is not the wall rule but
the **vertical reservoir**: a thin slab supplies far less vapor per unit plate area, which
acts like a lower effective ρ, which per §VIII's own ρ ladder produces exactly the
sidebranch loss we see.

**Registered differential probe (launched on registration):** two deterministic 384-planar
runs differing only in nz —

```
node runner/src/main.ts grow --preset dendrite --dims 384,384,48  --domain hexPrism --ticks 30000 --noise 0 \
  --metrics-every 1000 --full-metrics-every 2000 --pgm-every 2000 \
  --pgm-dir out/gutcheck-gg-realism/pgm-384-z48-n0  --out out/gutcheck-gg-realism/dendrite-384x384x48-noise0.ckpt
node runner/src/main.ts grow --preset dendrite --dims 384,384,144 --domain hexPrism --ticks 30000 --noise 0 \
  --metrics-every 1000 --full-metrics-every 2000 --pgm-every 2000 \
  --pgm-dir out/gutcheck-gg-realism/pgm-384-z144-n0 --out out/gutcheck-gg-realism/dendrite-384x384x144-noise0.ckpt
```

Prediction, written before results: if the hypothesis is right, the nz=144 run shows
visibly fatter arms and denser sidebranching than the nz=48 control at matched radius
(compare occupancy dumps at equal radius, not equal tick). If they are indistinguishable,
z-extent is exonerated and the next suspects are the periodic-vs-wall difference and only
then an implementation seam — the last would outrank this spike and get escalated, not
absorbed here. Probe transfer limit (Rule 11 spirit): the probe runs at 384-planar, so its
conclusion informs the hypothesis, and any paper-scale re-run still measures its own
morphology.

**Probe outcome (recorded 2026-08-02 ~23:15, numbers copied from the two logs at write
time): hypothesis supported.** Control (nz=48): far-field stop tick 14875, radius 116,
attached 136239, AR 0.0386266, farField 0.0666186 — replicating the noisy 384 run's
macro-trajectory (14900/117), so noise is morphologically neutral here. Tall (nz=144):
**domain-contact** stop tick 13847, radius 125, attached 243617, AR 0.0996016, farField
still 0.0911564. At matched radius (tall tick 12000 r=109 vs control tick 14000 r=111;
`probe-z-compare-matched-radius.png`), the tall crystal shows longer, denser sidebranches
and fuller arms — plus ~2.6× plate thickness and ~1.8× attached mass at similar radius,
with tips ~17% faster. Eyeball-scale conclusion: **the thin zHalfExtent-23 slab materially
starves G-G growth; vertical reservoir depth is a first-order morphology input at this
scale.** Limits stated: 384-planar probe; nz=144 is still finite and the paper's z-extent
remains unknown; the probe does not by itself show that a tall paper-scale run reproduces
Fig. 14's density — that requires the run itself. Paper-scale tall-domain options (costs
from measured 16 ns/cell·tick, 38 B/cell steady): `1200,1200,144` → radius ~390, ~2.5
s/tick, ~36 h, ~8 GB steady with a ~14 GB checkpoint transient (fits the 24 GB Mac only
with nothing else heavy); `960,960,144` → radius ~312, ~1.6 s/tick, ~20 h, ~5 GB steady;
either runs comfortably on the 64 GB Windows host. Decision is the maker's; not launched.

### Run B outcome — the paper's prototype reproduces (recorded 2026-08-02 ~23:45)

B ended `stop reason=tick-cap` at exactly 70000 (the paper's stated step count for
Fig. 4), radius 294, attached 961597, `symErr=0` at every cadence, massDrift 3.018e-12,
no domain contact, farField 0.0732 (never hit the stop), exit 0. Checkpoint
`plate-1200x1200x48-noise0.ckpt` (1175040791 bytes, roundTripIdentical=true). Crisp mesh
`plate-1200-mesh-s030-h06.bin` (σ 0.30, spacing 0.6, sha256
`9222f7598994a98c66dcc8f8ffec6313b1d7c88de3865b7cf5e2974c4a2f4713`).

**Eyeball verdict (Claude Fable 5, from `side-by-side-B-vs-fig4.png`, sha256
`9fbb517009a49f0e52636732b24b453b42b8dd91a077eb705032b56d8c8dd02f`; Fig. 4 ray-traced
view cropped from PDF page 5 at 150 dpi, kept in gitignored `out/` — APS copyright):**
this is a close morphological match. Same six broad branched arms, same prominent midline
ridges, same serrated arm edges, and the same distinctive detached sector-plate "leaves"
between arms in comparable positions. Differences: ours is radius 294 vs their ≈350
(reservoir-limited, pre-registered) and correspondingly slightly sparser in the
between-arm fill. Conclusion pair, stated together: **the paper's §VII prototype
reproduces figure-to-figure even in the thin nz=48 slab, while the §VIII classic-dendrite
series does not** — consistent with the z-starvation reading, since the slow-growing
(μ≡0.001, strong convexification) prototype demands far less vapor flux than the
fast-tipped dendrite series (μ≡0.008), and B never even reached the far-field stop. The
A-vs-Fig. 14 composite is `side-by-side-A-vs-fig14.png` (sha256
`172e4b3156dd6479bf67115d52380d6014257c417b3f2c2df43bc8d04bf8d11b`).

### Run C outcome and the paper-scale realism verdicts (recorded 2026-08-03, closes the portfolio)

C ended `stop reason=domain-contact` at tick 58028, radius 390, attached 1078460,
`symErr=0.583486` (noise-broken from tick 7916 — wanted for this lane), massDrift
1.451e-12, exit 0, checkpoint `dendrite-1200x1200x48-noise1e-5-seed20260802.ckpt`
(1175040845 bytes, roundTripIdentical=true), guard-flagged NOT valid evidence as expected.
C's macro-trajectory matches deterministic A almost exactly (contact at 58028 vs 57834),
confirming again that G-G noise decorates rather than redirects growth.

Ice-look meshes (σ 0.375, spacing 0.6): C
`dendrite-1200-noise-mesh-s0375-h06.bin` sha256
`6776664a04410cb24befa75a9be8c28f789102d30b29d325e813ee8068c80836`; B
`plate-1200-mesh-s0375-h06.bin` sha256
`c31802bae2a4dad004b4661d0832012a854f66665295cb302e8846ec9e3c4657`. Renders (1600²,
zscale 2.5 stylization as recorded, same look params as the original gut check):
`render-1200-C-ice.png` sha256
`1fb039b6472ffa0f450f393b6a0a85c0c9521b130ccffb06a3698dd7163edbe6`,
`render-1200-B-ice.png` sha256
`21c4c2de4344310567445d4ddda55b10228fde1be9516173bf5a7609c06d8f4a`. Composites against
the same J0521r2p 23.633 s frame: `side-by-side-C-vs-footage.png` sha256
`acea1e71772e4925591b559f322d1c17be12f782cf3c3051b689b348763b7132`,
`side-by-side-B-vs-footage.png` sha256
`b3b518ceb5e6f217a4d41e7b28d1a2d8c0aec6baf8885d7f3e14993e9414f54e`.

**Eyeball verdicts (Claude Fable 5, 2026-08-03, both under the stated nz=48-starvation
limit — these are lower bounds on what G-G can do):**

- **B vs footage: the strongest G-G realism result of the exploration.** The ridged
  branched plate rhymes with the footage crystal structurally — six broad ridged arms,
  serrated edges, sector-plate features, hexagonal center. Still gives itself away by
  thinner limbs, paler thinner line work, and a much emptier center than the footage's
  bold interior relief.
- **C vs footage: natural asymmetry works, morphology starved.** The noise-broken
  symmetry reads organic (no two arms identical, like the footage), but the slab-starved
  slender arms read as a delicate fern sketch, not the footage's robust plate.
- Portfolio conclusion for Phase 7 planning, superseding nothing from the original
  verdict: the ice look transfers; G-G morphology class and growth conditions (especially
  vapor reservoir depth) dominate realism; the plate/ridges regime — not the classic
  dendrite — is G-G's closest approach to this footage specimen.

### Maker feedback round (2026-08-03) and registered proposals

**Maker feedback, recorded verbatim in effect:** render B looks the best; the renders are
hard to see (too faint); noisy C is the worst — **no more noise runs in this
exploration**. Consequences applied: the bold look is now the reference for
presentation renders (`render-1200-B-ice-bold.png`, params
`keyI=3.2&fillI=1.3&thick=14&edge=1.9&edgePow=1.3&rough=0.05&zscale=2.5&bgTop=e6b95c&bgBottom=9aa5e0`),
and all future runs in this exploration are noise-off deterministic.

**Why B renders best (recorded so the reason survives):** B is a solid ridged plate — a
continuous face-on surface with interior relief — so the refraction and the
edge/tint pass have geometry to work with everywhere; and B never starved (farField
0.0732 at its cap; slow μ≡0.001 convexifying growth), so it kept its sector fill. The
dendrites are skeletal thin arms: mostly background with outline strokes, and slab-starved
besides.

**2D growth-cycle preview (delivered):** `growth-B-topdown.mp4` — Run B's 35 periodic
occupancy dumps unsheared to cartesian by `scripts/gutcheck-pgm2cart.ts` (exact integer
unshear at 2× supersampling, √3/2 vertical factor in ffmpeg), 6 fps + 2 s hold.

**Proposal 1, revised per maker direction (2026-08-03) and LAUNCHED: interactive growth
timeline, not a fixed mp4.** The maker wants the website viewer animated from seed with a
scrubbing timeline (forward/backward) and free camera (fixed face-on default). Built and
committed (`d32cdc2`): `scripts/gutcheck-mesh-lib.ts` (shared extraction core; one
recorded metadata fix — the mesh header's hardcoded `preset: "dendrite"` was wrong for
plate checkpoints and is now caller-supplied provenance, so meshes regenerated after the
refactor differ from earlier recorded hashes in header bytes only),
`scripts/gutcheck-animate-grow.ts` (deterministic replay of a registered grow config via
the public `GGSolver` API, one level-set mesh every N ticks, manifest rewritten after
every frame so a partial replay is already viewable), and `?manifest=` timeline mode in
the viewer (slider + play/pause + step buttons, LRU frame cache with prefetch, orbit
controls, face-on reset, framing fixed to the final extent). Pipeline verified at smoke
scale before launch (20-frame 128,128,48 replay; screenshots at frames 7/20 and 20/20).
Launched replay (exact command):

```
node --max-old-space-size=12288 scripts/gutcheck-animate-grow.ts --preset plate \
  --dims 1200,1200,48 --ticks 70000 --every 500 \
  --out-dir out/gutcheck-gg-realism/anim-B \
  --spacing 0.8 --sigma 0.45 --normal-delta 3
```

Deterministic noise-0 replay of Run B on this host; 141 frames (seed, every 500 ticks,
final); expected ~10.5–11 h, ~1.5–2 GB of frame meshes, logs
`out/gutcheck-gg-realism/anim-B.{log,err,exit-status}`. The viewer works mid-run on the
partial manifest.

**COMPLETE (2026-08-04 evening, every-100 restart):** 701 frames, `complete=true`,
exit 0, 9.3 GB under `out/gutcheck-gg-realism/anim-B/`, 41,194 s (11.4 h). Endpoint
determinism check: the final frame's `attached=961597` exactly equals Run B's final
attached count — the replay landed bit-consistent with the original at the observable
level. Viewer verified on the finished manifest (`timeline-B-mid.png`,
`timeline-B-final.png`: scrub, playback controls, face-on reset all live).

**Restarted 2026-08-03 evening at maker direction with `--every 100`** (the maker wants a
smoother timeline; the 500-tick run was stopped ~1.5 h in and its partial frames
discarded). Same command otherwise; 701 frames, estimated ~11.5–12.5 h (snapshot
extraction becomes ~1–1.5 h of the total), ~8–10 GB of frame meshes (66 GB free on the
volume at launch). Two viewer defects found by the maker mid-run and fixed first
(`07f244b`): edge-pass z-fighting stipple at high zoom (polygon offset), and mid-run
framing magnifying early frames (`?frameExtent=` pins framing to the expected final
size; for this replay use `frameExtent=620`).

**Registered proposal 2 — more figure-to-figure comparisons (NOT launched), in
recommendation order:** (a) the tall-domain Fig. 14 rerun already costed above — still
the single most informative next run; (b) `needle` and `hollowColumn` presets vs Figs.
29/30 — column forms need tall-z domains (e.g. `128,128,512`, ~8.4M cells, cheap; the
z-starvation lesson applies in reverse); (c) via proposal 1's params-capable driver: the
§VIII ρ ladder at tall z — 0.105 fern (Fig. 13), 0.095 (Fig. 15), 0.09 star (Fig. 16) —
and the §VII prototype ρ variations (Figs. 6–12); (d) sectored plates and the μ sweep
(Figs. 21–25) after transcribing their parameter vectors from §IX/X. Parallel batches of
~3 fit the Mac comfortably; awaiting maker selection.

### Style-matching session (2026-08-03, maker-directed): two locked render recipes

The maker asked to iterate the rendering toward (1) the J0521r2p footage frame and (2)
G-G Fig. 4's ray-trace. `app/src/spike-gg-realism.ts` was restructured around a `?style=`
switch (`ice` default / `povray`) with per-style URL-param defaults, so both recipes are
data, not code. All renders below use Run B's checkpoint.

**Locked recipe 1 — `style=ice` (footage target), hero `style-ice-v4.png` sha256
`d6b0b4be7e81664d6086f7706b01888b26e0e4c7995e90cd891c5b2196eec59e`:** mesh σ 0.45
spacing 0.6 (`plate-1200-mesh-s045-h06.bin` sha256
`fdc32015d3e44c1d6aefad50fc14b33108fd875fbab1c0f732ae5e48900e6c67`), params
`style=ice&edge=2.2&edgeLo=0.06&edgePow=1.0&edgeCool=100c2e&keyI=3.6&fillI=2.2&fillHex=7d90e8&dispersion=0.18&bgTop=e2ae4e&bgBottom=8f9be0&exposure=1.0&zscale=3.5`.
Iteration findings recorded: bold-wide edge response (edgeLo 0.06, edgePow 1.0) supplies
the footage's thick contour lines; the σ 0.30 mesh makes those lines gritty
(lattice-texture speckle) while σ 0.45 makes them liquid — **at this crystal scale
(features 10–30 cells) the smoothing/crispness trade-off inverts relative to the small
384 crystal**, so mesh σ is a per-scale choice, not a constant. Composite:
`side-by-side-styleice-vs-footage.png` sha256
`8724986aceee11cd642a16da588ea59814b24d9f9004f04f5f6045ad54dbc609`. Remaining gap is
model truth, not shading: the footage plate's interior relief density and fill.

**Locked recipe 2 — `style=povray` (Fig. 4 target), hero `style-pov-v2.png` sha256
`11c2a64bdac53392e622f6d3760f48cb806c50f6d9b650be84bc90fa12fedc95`:** mesh σ 0.375
spacing 0.6, params
`style=povray&tr=0.72&body=dceafc&edge=1.35&edgeLo=0.08&edgeCool=ecf4ff&spec=1.5&keyI=2.7&exposure=1.28&bgInner=5b8fd8&bgOuter=04060f`.
Design: dark navy radial glow backdrop, partial transmission (0.72) so the glow floods
the plate, bright blue-white edge pass (the paper's own figures draw edges with MATLAB's
LINE routine, so bright line work is style-faithful). Composite:
`side-by-side-stylepov-vs-fig4.png` sha256
`27e774a45dd3720dfda4d3e671c5a485078e8115d8b45ddec51dab84a6bc886b`. Remaining visible
differences: Fig. 4's hot specular blooms (would need a bloom post-pass — deliberately
skipped under "restrained post-processing") and the known radius 294-vs-350 tip
shortfall.

### Phase 7 usability inputs (recorded 2026-08-03 at maker request; measured on this branch)

ADR 0029 already commits the Realistic profile to "curated pre-baked histories"; this
exploration measured what that costs and prototyped the consumption model. Numbers, all
from artifacts on this branch: growing the paper-scale plate is ~10.5 h on one M4 core
(50.7M active cells, single-threaded float64 oracle, ~2.6 GB); even the small 384
dendrite is ~21 min — visitors cannot compute, they must consume. The compute-once /
replay-forever split works end-to-end: offline `gutcheck-animate-grow.ts` → frame meshes
+ manifest; online the timeline viewer streams frames on demand (visitor downloads only
manifest + frames actually viewed; LRU cache + prefetch). Raw history weight measured:
every-100 ≈ 8–10 GB, largest frame ~35 MB at spacing 0.8 — too heavy to ship raw; the
reduction ladder for Phase 7, in leverage order: (1) 16-bit position quantization +
octahedral normals + brotli ≈ 6–10×; (2) adaptive frame cadence (dense only at
morphological events) ≈ 2×; (3) two-tier LOD (coarse scrub mesh, fine at rest) for
perceived latency; (4) hybrid hero: few-MB fixed-camera video default, streaming 3D
viewer opt-in. Small-domain live growth (~30 s at 128 scale in a Web Worker) remains the
Scientific instrument's lane; pre-baked is for big-and-beautiful — and the z-reservoir
finding (taller domains needed) makes big crystals *more* expensive than assumed,
strengthening the pre-baked case. Everything here is unvalidated exploration; a real
Phase 7 plan and a versioned frame format gate any external shipping.

### WP: reproduce-all-paper-figures sweep (registered 2026-08-03, maker-directed)

Maker direction: catalog every virtual snowflake in the G-G paper, then attempt to
reproduce each and produce a 2D side-by-side (our locked bold-ice render vs the paper
figure) like the Run-B-vs-Fig. 4 comparison; failures are expected and are themselves the
finding. Plan: (1) two-pass transcription catalog (parallel transcribers + independent
verifiers per paper section) into `scripts/gutcheck-gg-figure-catalog.json` — every
parameter vector with its quoted source sentence; (2) new spike script
`scripts/gutcheck-grow-params.ts` driving `GGSolver` with arbitrary validated `GGParams`
(the presets cover only 4 of the paper's vectors), far-field/contact/tick-cap stop rules
replicated from the public API, final mesh + run-record JSON out; (3) reproduction lanes
~3 abreast on free cores (the every-100 replay keeps its core), quick figures first,
radius-350+ figures overnight; (4) per-figure side-by-side + eyeball verdict appended to
a coverage table here. Known-in-advance caveats: Fig. 4 (reproduced, Run B) and Fig. 14
(starved in the thin slab, Run A + probe) are already measured and not re-run at nz=48;
fast-growing dendrite-series figures inherit the z-starvation caveat; sandwich/double
figures need taller nz by construction; column/needle figures need tall-z domains.

**Catalog landed (commit `e15349f`): 45 crystal figures, Figs. 3–47.** Coverage triage
from the verified transcriptions: **(a) runnable now** (canonical prism seed, single
parameter stage): Figs. 3, 6–13, 15–22, 29–31, 40–43, 45–47 — Figs. 5/12/18/22 are
time-sequences of parent runs and are covered by their parents; **(b) blocked — tapered
seeds** (`GGSolverOptions` exposes only uniform prism seeds; the paper's §X/§XII cones
like "height 3, lower radius 2, upper radius 1" cannot be constructed via the public
API): Figs. 23–28 and 32–36 — reproducing them faithfully needs a seed-construction API
(a real sweep finding for any future phase; labeled canonical-seed *approximations* are
the interim option); **(c) blocked — two-stage environment schedules**: Figs. 32–39 and
44 also need mid-run parameter replacement (the Phase 4 G-G event machinery, via
`GGEnvironmentTransitionReport`) — sweep stage 2. Lanes 1–3 launched: Fig. 3 (the
paper's own labeled failure case — a deliberate control), Fig. 9 (ρ=0.05 sectored
plate), Fig. 29 (needle, 128,128,768). Logs under `out/gutcheck-gg-realism/figs/`.

#### Coverage table (grows as lanes harvest; all eyeball-only, Evidence = unvalidated)

Artifacts per row under `out/gutcheck-gg-realism/figs/` (`figN-mesh.bin`,
`figN-record.json`, `figN-render.png`, `side-by-side-figN.png`) unless noted. Verdicts
are Claude Fable 5's eyeballed comparisons of the named composites.

| Figure | Run config | Termination | Verdict |
|---|---|---|---|
| Fig. 3 (failure control) | 600,600,48; cap 30k | domain-contact @ 15829, attached 224625 | **Reproduced.** The deliberately "failed" morphology matches: overdense parallel sidebranch thickets on six arms, high midline ridges (theirs oblique, ours face-on). Strong fidelity control — the implementation reproduces the paper's ugly crystal, not just its pretty ones. |
| Fig. 4 (prototype) | Run B, 1200,1200,48, 70000 ticks exact | tick-cap @ 70000, r=294 | **Reproduced** (recorded above; `side-by-side-B-vs-fig4.png`). |
| Fig. 14 (classic dendrite) | Run A, 1200,1200,48 | domain-contact @ 57834, r=390 | **Not reproduced at nz=48** — slab starvation (probe-confirmed z-reservoir effect, recorded above). Tall-domain rerun is the costed open item. |
| Fig. 29 (needle) | 128,128,768; cap 30k | far-field @ 25075, attached 220173; bbox 404 long × 36 wide | **Reproduced.** Same needle class: segmented hexagonal shaft with stepped bands, tapered spear tips with fine spiky fringes. (Render note, also applied forward: side-view captures use the screen-fixed background — the static backdrop plane is edge-on at tilt 90.) |
| Fig. 7 (ρ=0.15 ridged sidebranches) | 600,600,48; cap 40k | far-field @ 18150, attached 511993 | **Reproduced (class).** Six ridged arms, serrated sidebranches with their own ridges, detached leaf plates between arms — visibly sparser fill than the paper's larger crystal; consistent with our half-size domain/reservoir, not a morphology mismatch. |
| Fig. 30 (hollow column) | 128,128,768; cap 30k | far-field @ 25000, attached 329133; 286 long × 48 wide | **Reproduced.** Hexagonal column of matching aspect with banded walls; end-on view (`fig30-endon.png`) confirms the defining feature — a genuinely hollow interior with terraced conical cavity walls, as in the paper's wireframe cutaway. |
| Fig. 31 (column, hollow prism facets) | 192,192,288; cap 30k | tick-cap @ 30000, attached 246463; 76×80 aspect ≈ 1 | **Reproduced.** Stubby hexagonal block, recessed hollow rectangles on every prism face, patterned end face — matches the paper's oblique views directly. |
| Fig. 8 (ρ=0.09 flumes) | 600,600,48; cap 60k | far-field @ 36425, attached 295645 | **Reproduced.** Six broad arms with the caption's defining feature — well-delineated flumes (paired midline ridges with a channel between) — plus matching scalloped short-toothed edges. |
| Fig. 6 (double plate, thickness-3 seed) | 600,600,96; cap 60k; `--seed-thickness 3` | domain-contact @ 42981, z-extent 62 | **Reproduced.** The thicker seed splits into the paper's double plate: two parallel lobed plate decks mirrored across the mid-plane, matching their oblique and side views. (The catalog's seed-thickness catch and the runner's new flag made this one possible.) |
| Fig. 10 (ρ=0.045 sectored branches) | 600,600,48; cap 60k | tick-cap @ 60000, attached 128211 (farField 0.033, stop 0.030) | **Reproduced (structure-consistent).** Silhouette with plate-tipped branches matches; exterior near-featureless exactly as §IX describes for this regime; the mid-plane cutaway (`fig10-cutaway.png`, new `?clip=1` viewer mode — the paper's own Fig. 22 device) reveals internal branching channels and ribs. The paper's glowing figure displays that interior through transparency. |
| Fig. 40 (star with needles, §XIII eccentric) | 320,320,192; cap 60k | domain-contact @ 10576, z-extent 100 | **Reproduced (class).** The needle instability nucleates perpendicular spikes on the thick narrow star exactly as in the paper; ours is smaller (early contact) with correspondingly fewer needles. §XIII flags these near-critical forms as "quite sensitive to any change", so class-match at reduced scale is the expected best case. Triage correction recorded: all §XIII figures (39–47) use the canonical seed and fixed vectors — my earlier schedule-blocked flags on 39/44 were display-regex false positives. |
| Fig. 43 (sandwich plate w/ broad branches; photo-matched "[8] p. 44") | 600,600,96; cap 60k | domain-contact @ 25422, attached 379685 | **Reproduced (class + mechanism).** Outer form matches as a younger crystal (our guard fired mid-broadening; theirs is nearly fused hexagonal). The load-bearing check is interior: the cutaway (`fig43-cutaway.png`) reveals the same dendritic vein skeleton inside the sandwich that the paper's transparency shows as its dark central pattern. |
| Fig. 39 (stellar dendrite w/ nucleating needles) | 480,480,144; cap 60k | domain-contact @ 14269, attached 301085 | **Reproduced (class).** The §XIII hybrid phenomenon — needles nucleating perpendicular from a planar stellar dendrite's faces — appears in both; ours is smaller at contact with correspondingly fewer needle sites. (Paper's own real-photo anchors for this type: Nakaya Fig. 137 and Plate 116 middle.) |
| Fig. 45 (exploding tips, β01=1.5 perturbation) | 600,600,96; cap 60k | domain-contact @ 36890, attached 531149 | **Reproduced (class).** The §XIII exploding-tip instability — narrow arm shafts flaring into broad plate tips — on all six arms in both; the paper's interior hieroglyphs are inner-sandwich structure per the established cutaway pattern. |
| Fig. 46 (exploding tips, β01=1.19) | 600,600,96; cap 60k | domain-contact @ 37383, attached 421447 | **Reproduced.** Chain-of-plates arm architecture matches segment for segment: stacked hexagonal plate segments ending in widened terminal plates on all six arms (`side-by-side-fig46.png`). |
| Fig. 41 (butterflake, wings along arms) | 320,320,192; cap 60k | domain-contact @ 19822, z-extent 124 | **Reproduced, strikingly** (`side-by-side-fig41.png`): the same butterfly of serrated thin wing-plates radiating in the arm directions with the crossing central blade — one of the paper's "never been seen in nature" idealizations, and our run grows its twin. |
| Fig. 42 (butterflake, side wings) | 320,320,192; cap 60k | domain-contact @ 10380, planar r≈104, z-extent 10 | **Partial — under-grown.** The spiky star arms match, but the paper's side-wing plates on the arm flanks had not nucleated before the 65% guard fired in our small domain. Requeue registered at 480,480,192 (runs after the current queue). **RESOLVED → Reproduced by v2** (domain-contact @ 15748; `side-by-side-fig42v2.png`): with the larger domain the side-wing plates nucleate on every arm flank, matching the paper's fins. Third and final domain-resolution — every under-grown case in the sweep resolved to reproduced once given adequate room. |
| Fig. 21 (ρ=0.15 sandwich plate) | 500,500,96; cap 36100 (paper-exact) | far-field @ 30475, r≈133 (paper ≈150) | **Reproduced.** Silhouette with notched hexagonal lobes matches, and the §IX signature — the nearly circular macrostep ring near center — is plainly present. The paper's glowing ribs are interior structure shown by their transparency ray-trace; our exterior render shows the near-featureless outside the text describes. |
| Fig. 20 (ρ=0.08 sandwich plate) | 400,400,96; cap 100k | far-field @ 34475, r≈88 (paper: r=150 @ t=100000) | **Under-grown — our domain too small, not a divergence.** The 400-planar reservoir depleted at a third of the paper's stated time and ~60% of its radius. Re-queued at 700,700,96 with the paper's 100k cap (runs when a lane frees). **RESOLVED → Reproduced by v2** (far-field @ 77600, attached 479323, r≈145 vs paper ≈150; `side-by-side-fig20v2.png`): notched hexagonal plate lobes and the §IX circular reverse-shape ring both present; the paper's dark interior star is sandwich-interior structure of the kind our cutaways show. Second confirmation that the earlier shortfall was reservoir size, not model. |
| Fig. 9 (ρ=0.05 sectored plates) | 600,600,48; cap 60k | tick-cap @ 60000, attached 131173 (farField 0.041, stop 0.033 not reached) | **Partial — under investigation.** Silhouette class reproduces (six broad sectored plates with narrow notches) but the paper's radiating interior ridge line-work is absent. Discriminated against a rendering artifact: 5× relief amplification (`fig9-render-z5.png`) shows the mesh interior is genuinely flat. Remaining suspects, in order: run length (paper time unstated; ρ=0.05 is the slow regime and our cap fired before far-field), z-starvation muting thickness relief, then model divergence. Rerun queued: 600,600,96, cap 200k, with `--out-state` checkpoint capture (`fig9v2-*`). *Cutaway addendum (`fig9-cutaway.png`): the v1 interior carries pocked texture but not the paper's radial sector-ridges.* **RESOLVED → Reproduced by v2** (600,600,96; far-field @ 67200, attached 362809; `side-by-side-fig9v2.png`): with doubled z the full radial ridge system appears — six midline ridges, sectored lobes with internal ridge lines, ribs, open hexagonal center — matching the paper's figure element for element. The v1 flatness was thin-slab z-starvation suppressing thickness relief: the same mechanism as Fig. 14, now confirmed on a second morphology class. *Maker question, center circle (answered with probes, 2026-08-04): not a hole and not an artifact — the state checkpoint shows the center solid and uniformly 19 layers thick at every sampled radius with no partial-layer ring in `b` (probe scripts `probe-center.ts`/`probe-ring.ts` under `out/.../figs/`); it is the shallow surface demarcation where the six midline ridges terminate at the early smooth-plate core, visible but subtle at `zscale=1` (`fig9v2-z1.png`) and amplified by the 2.5× relief stylization. The paper documents circular surface markings as characteristic of exactly this family (§IX's near-circular layer hole; §XIV(d) "sole surface markings of sandwich plates are circular reverse shapes"), and its own Fig. 9 shows a central demarcation — hexagonal there; our σ0.45 level-set smoothing rounds ours toward circular.* |

Host note: the charter prefers the Windows box for long
evidence runs; these are eyeball runs and the Mac is acceptable, but the
registered commands reproduce on either host (habit-class reproduction across arm64/x64
was verified at commit `945437f`; bitwise identity is not claimed cross-arch).

### WP: photo-target reproductions (registered 2026-08-04, maker-directed — "beyond the paper")

Maker direction: find real snow-crystal photographs and reproduce the same shapes with
G-G. Approach, in strength order: (1) **the paper's own named photo matches** — the text
repeatedly cites specific plates ("[13] Fig. 135", "[8] pp. 64–66", "Plate 116 in [13]",
"[8] p. 44 lower right") — the authors staked these claims, we test them; (2) local
assets (snowcrystals.com research cache, Phase 6 lab-validation dataset index); (3)
public-domain Bentley plates and other open sources per morphology class. Parameter
choice per photo = nearest verified catalog anchor ± documented small tweaks (≤3
attempts per target), the paper's own method ("visual comparison with snow-crystal
photographs is the only method"). **Stated boundary:** G-G is phenomenological; nothing
here maps growth conditions to shapes — that is `LibbrechtKinetics`' Phase 6 lane — and
no output is validation evidence. All photo-bearing composites stay in gitignored `out/`
regardless of rights status. Sourcing workflow `wf_30f47d91-806` gathers targets (paper
citations, local inventory, PD web sources); target table lands here when it reports.

**Sources landed (2026-08-04).** The paper names five single-specimen photo matches
(full citation table in the sourcing workflow record): Takahashi et al. 1991 Fig. 1(h) ↔
G-G Fig. 4 (≈−13 °C crystal; the paper's only size-quantified match); Nakaya Fig. 135 ↔
Fig. 29; Nakaya Fig. 137 ↔ Figs. 39–40; Nakaya Plate 116 middle ↔ Fig. 39; Libbrecht
Field Guide p. 44 lower-right ↔ Fig. 43. The paper's stated acceptance criterion is
verbatim: "visual comparison with snow-crystal photographs is the only method we use to
decide whether a virtual snowflake is a 'failure' or a 'success.'" Rights-clean photo
pool fetched to `out/gutcheck-gg-realism/photos/` (Wikimedia PD: Bentley plates 565/785/
872/890; USDA LT-SEM dendrite) — PD status notwithstanding, media stay in `out/` per
branch discipline.

**First photo composites (eyeball verdicts, Claude Fable 5, 2026-08-04):**

| Photo (real crystal) | Ours | Verdict |
|---|---|---|
| Bentley 890 (sectored plate, radiating ridge fans) | Fig. 9-v2 render | **Class match, strongest of the set** (`photos/side-by-side-fig9v2-vs-bentley890.png`): six broad plate lobes with radiating ridges, notched separations, central ring/medallion in both. Bentley's lobes are rounder fans; ours carry paired midline ridges. |
| Bentley 785 (stellar, fern tips, dense sectored center) | Run B render | **Partial** (`photos/side-by-side-B-vs-bentley785.png`): arm structure rhymes (ridged arms, leaf plates, fern tips), but the photo's central sector medallion has no counterpart — it records a *changed-conditions* growth history (plate core, then branching), which constant-parameter G-G cannot produce. Matching such crystals properly needs the §XII schedule machinery (stage 2). A genuinely useful finding: many natural specimens are environment-history composites. |
| Bentley 565 (irregular fernlike star) | Fig. 7 render | Composite built (`photos/side-by-side-fig7-vs-bentley565.png`); fern texture class matches, the photo's natural asymmetry has no counterpart in deterministic runs (noise runs are maker-retired). |

**Takahashi 1991 Fig. 1(h) — the paper's own named match, landed.** Open-access PDF
verified and fetched (J-Stage, DOI `10.2151/jmsj1965.69.1_15`; "Vapor Diffusional Growth
of Free-Falling Snow Crystals between −3 and −23°C", JMSJ 69(1), 1991;
`photos/takahashi1991.pdf`, journal p. 17 = PDF p. 3). Composite
`photos/side-by-side-B-vs-takahashi-fig1h.png`: our Run B (the G-G Fig. 4 reproduction)
vs the laboratory crystal grown at ≈−13 °C that G-G explicitly invited comparison with.
Eyeball verdict (Claude Fable 5): credible class match on the same terms G-G claimed —
six ridged main arms with feathery sidebranch fill and a small hexagonal core; sizes in
the same ballpark under the paper's ~1 µm/cell reading (ours ≈0.59 mm across vs the
photo's ≈0.55 mm). The lab crystal's fern feathering is finer-grained than our serrated
arms — consistent with the same-scale texture gaps recorded throughout this branch.

**Side-discovery worth flagging for Phase 6:** Takahashi Fig. 1 is a *lettered,
temperature-labeled photo ladder* of laboratory crystals (panels a–n spanning −2 to
−24 °C: thick plate / plate / sector / broad branch / dendrite / column / bundle of
sheaths) — effectively an experimental Nakaya diagram in open access with per-panel
scale bars. That is exactly the photo corpus shape `LibbrechtKinetics` validation wants
to compare against (LK predicts habit vs temperature); recorded here as a Phase 6 input
pointer, nothing more claimed.

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
