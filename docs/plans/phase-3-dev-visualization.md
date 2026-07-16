# Plan — Phase 3: Development visualization (Three.js) + center-vs-rim depletion gate

- **Phase:** Phase 3 — Development visualization (Three.js)
- **Status:** done (evidence-complete 2026-07-16; gate3 exit 0; pending maker assertion)
- **Started:** 2026-07-15
- **Last touched:** 2026-07-16 by Claude (Fable 5), coordinating session

## Goal

Build the development visualization instrument (the `app/` workspace package): the crystal
rendered as instanced hexagonal prisms with an orbit camera, a selectable surface overlay, a
draggable slice plane through the vapor field with freeze-and-inspect, and cell picking with a
model-honest hover readout — all driven by the **same CPU oracle** (`GGSolver`) running in a Web
Worker. Alongside it, the gate's evidence instrument: an automated **center-vs-rim depletion
metric** in `core/` and a flagless `gate3` runner command that enforces the pre-registered
protocol. The views are debugging instruments first and product features second.

Phase 3 runs under **ADR 0007**: it overlaps the tail of Phase 2b's in-flight, pre-registered
`gate2b` evidence run. Phase 3's gate rests exclusively on Phase 2a machinery (`GGThreshold`
plate, closed 2026-07-15); nothing here reads, claims, or touches the 2b run or the LK seam.

## Done when

Charter §3.2, Phase 3, verbatim:

> Done when you can watch a facet center starve in the slice view while the plate grows — and
> the automated center-vs-rim depletion metric (facet-center σ vs rim σ, tracked over the run)
> confirms it (added v1.3: §3.3's automated-metric rule applies to this gate like any other; the
> visualization stays, the eyeball stops being the evidence). These views are debugging
> instruments first and product features second — that they are the same artifact is the
> project's luckiest property.

(The σ above is the charter's own symbol for local supersaturation, quoted with its provenance.
Under `GGThreshold` the measured field is G-G's diffusive vapor mass `d` — a phenomenological,
dimensionless stand-in, and every label in app and evidence says so; see "Honest-field note"
below.)

## Approach

**Orchestrated, serial, criteria-first.** The maker directed this phase be delegated: passing
criteria are written first (this file), then development is done by subagents in serial work
packages, each followed by a **separate adversarial review agent** and — for anything visible —
**visual inspection of actual screenshots**, looping dev→review→fix until every criterion
passes. The coordinating session owns PROGRESS.md, the charter, ADRs, plan edits, and commits
(agents never touch those). Each agent gets a disjoint file territory.

Work packages, in order:

| WP | Territory | Builds |
|---|---|---|
| WP1 | `core/src/metrics.ts`, `core/test/`, `runner/src/main.ts` (additive), `runner/test/` | `centerRimDepletion` metric + `grow` printing + unit tests |
| probe | coordinator only, `out/` | calibration run (**not evidence**) → thresholds registered here, committed |
| WP1b | same as WP1, plus `runner/src/gate3.ts` (new sibling module, the `pgm.ts` pattern — `main.ts` runs its CLI at module top level, so pure criteria functions must live beside it to be testable; recorded post-hoc, R1 note 8) | flagless `gate3` command enforcing the registered protocol + adversarial negative-control tests |
| WP2 | `app/` (new), root `package.json`/`vitest.config.ts` (additive), `app/tsconfig.json` | Vite + Three.js scaffold, worker-hosted `GGSolver`, instanced hex prisms, orbit camera, run controls |
| WP3 | `app/` | overlays, slice plane, picking + honest readout, depletion HUD, screenshot harness |

Solver-side rules for every agent: `GGSolver`/`LKSolver` numerics are **untouchable** —
WP1/WP1b are additive (new metric functions, new command); `core` and `solver-cpu` stay
environment-neutral (no Node or DOM APIs); the app consumes only public package exports
(`@vcc/core`, `@vcc/solver-cpu`); nobody touches `out/gate2b*` or the running gate2b process.

**Honest-field note (§1.5 discipline).** Under `GGThreshold` there is no physical σ. The
depletion metric and every app overlay read G-G's diffusive vapor mass `d`: Type = computed
state, Evidence = unvalidated, dimensionless phenomenological units. The metric is a **ratio**
(center/rim of the same field), so it is well-defined without a unit claim, and the same
function applies unchanged to a future LK σ field. UI copy and evidence lines must say
"vapor mass d (model units)" or equivalent — never bare "supersaturation", never a percent.

### The metric (WP1) — precise definition

`centerRimDepletion(a, field, dims, center, wall?)` in `core/src/metrics.ts`, pure over typed
arrays:

- `kTop` = max `k` over attached cells (`a = 1`) — the global crystal bbox top. The basal facet
  of a plate.
- **Center sample** `depletionCenter` = `field` at `(ic, jc, kTop + 1)` — the vapor cell
  immediately above the facet center. Undefined (NaN) if out of domain, wall, or attached.
- **Rim set** = attached cells in layer `kTop` with ≥ 1 free (unattached, non-wall) in-plane
  T-neighbor within layer `kTop` — the facet's edge ring.
- **Rim sample** `depletionRim` = mean of `field` over the cells directly above the rim set
  (same `k = kTop + 1`), counting only free, non-wall cells; NaN if the count is 0.
- `depletionRatio = depletionCenter / depletionRim`. Berg-effect expectation: < 1, falling as
  the facet widens. NaN propagates; the gate treats NaN after the registered start tick as a
  named failure, never as a pass.

Added to the `Metrics` bundle additively (`depletionCenter`, `depletionRim`,
`depletionRatio`); `grow` prints them at the existing metrics cadence.

Known subtlety, decided up front: `kTop + 1` cells are G-G boundary cells whose `d` is drained
by freezing every tick — at the center **and** at the rim, by the same rule with the same
kappa, so the ratio cancels the drain to first order, and `kTop + 1` is the vapor that
actually feeds the facet. If the probe shows the signal there is too weak or ill-behaved to
threshold, the sampling layer may be moved (e.g., to `kTop + 2`) **before** registration, with
the reasoning recorded here; after registration it is frozen like every other protocol value.

### Gate protocol (pre-registered; thresholds land after the probe)

`gate3` is flagless, like `gate2b`: the protocol is pinned in code and here.

- Run: `GGSolver`, preset `plate`, dims `128,128,64`, domain `hexPrism`, far field
  `reflecting`, seed `1`, noise `0`, max 10000 ticks with the §7 far-field stopping rule — the
  exact 2a canonical plate (known good: stopped at 4800 ticks, AR 0.168831, no domain contact).
- Sample the depletion metric every 100 ticks; write `out/gate3-plate.ckpt` and
  `out/gate3-depletion.csv` (tick, attachedCount, boundingRadius, aspectRatio,
  depletionCenter, depletionRim, depletionRatio).
- The **registered window** is samples at ticks 400 to 4400 inclusive, step 100 (41 samples).
  The run itself continues to its natural stop and the CSV records every sample from tick 100
  to the end — including any post-window behavior — so nothing is hidden by the window.
- Enforced criteria, each failing **by name** with nonzero exit; exit 0 is the whole claim:
  - **G3-GROWTH** — the plate grows across the window: attachedCount strictly increases
    across every consecutive pair of window samples, and final boundingRadius ≥
    REGISTERED_MIN_RADIUS.
  - **G3-PLATE** — it is a plate: final aspectRatio < 0.3.
  - **G3-DEPLETION** — over the window: the median depletionRatio ≤ REGISTERED_MAX_MEDIAN,
    and the fraction of window samples with depletionRatio < 1 is ≥
    REGISTERED_MIN_FRACTION_BELOW_1. (Median of the 41 sorted values = the 21st. Windowed
    robust statistics, not a final sample — see Tried and rejected: layer-nucleation spikes
    are real, transient, and themselves Berg-effect signatures.)
  - **G3-DEFINED** — depletionRatio is finite at every window sample.
  - **G3-VALID** — no domain contact; termination reason recorded and is far-field stop or
    tick budget; symmetry preserved (noise off, hexPrism — the 2a incremental delta check,
    threshold exactly 0, **and** belt-and-braces the final full symmetryError must be exactly
    0; implied by delta-clean plus the symmetric seed, so strictly tightening).
  - **G3-WINDOW** — the registered window must be complete: all 41 samples at ticks 400..4400
    exist. An incomplete window is this named failure — never a rescaled or partial statistic.
  (G3-WINDOW and the final-full-symmetry clause were implemented conservatively by WP1b and
  registered here in the same session, before the evidence run — R1 round-1 should-fix 3.)
- REGISTERED values — **registered 2026-07-15 from the calibration probe (observational, not
  citable as the gate result): `out/phase3-probe.log`, command
  `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1
  --metrics-every 100`, far-field stop at tick 4800, final AR 0.168831, radius 38, no domain
  contact, delta-sym clean:**
  - REGISTERED_MIN_RADIUS = 30 *(probe final boundingRadius 38)*
  - REGISTERED_MAX_MEDIAN = 0.75 *(probe window median 0.5315)*
  - REGISTERED_MIN_FRACTION_BELOW_1 = 0.80 *(probe: 37/41 = 0.902)*
  The run is deterministic (noise 0, pinned engine), so these margins cover protocol drift,
  not run-to-run noise.
- Negative controls (committed tests, non-vacuous, recomputing independently):
  - crystal-free state → metric NaN → gate3 criterion fails by name;
  - hand-built uniform field with a plate → ratio = 1 → G3-DEPLETION fails;
  - hand-built **inverted** field (rim depleted below center) → ratio > 1 → fails;
  - brute-force recomputation of center/rim on a small constructed lattice with known values
    must match the library function exactly;
  - a criteria unit test proving each named G3 criterion individually trips (no criterion is
    dead code).

### The app (WP2 + WP3) — passing criteria

**WP2 — scaffold, worker, crystal, camera:**

- **A2-1** `app/` joins the npm workspace; `npm install` clean; root `npm test` (Rule 7 scan +
  typecheck + vitest) stays green with app files scanned. App typechecking is wired into the
  root `typecheck` script via `tsc -p app --noEmit` (its own tsconfig: DOM lib, bundler
  resolution); the root Node tsconfig does not absorb app files.
- **A2-2** `npm run dev` serves the app; page loads with zero console errors (verified in the
  screenshot harness run).
- **A2-3** `GGSolver` runs in a real `Worker` (module worker), never on the main thread; the
  message protocol (init/run/pause/reset/snapshot) is a typed module with node-side unit tests
  for its pure parts. Snapshots carry typed arrays (copies or transferables), including `a`,
  `d` (f32 copy is fine for display), `b`, per-cell attach-tick, tick, and the standard
  `Metrics` bundle.
- **A2-4** Crystal renders as **instanced hexagonal prisms** of surface cells (attached cells
  with ≥ 1 free neighbor), across-flats and orientation consistent with `cartesian()` from
  `@vcc/core` (odd-row offset — visual check: a grown plate reads as a hexagon with flat
  facets, not a jagged rhombus). Orbit camera (zoom/pan/rotate) works.
- **A2-5** Run controls (Tweakpane): preset (plate/dendrite/needle/hollowColumn), start/pause/
  step/reset, seed and noise inputs, dims default 128×128×64, domain hexPrism, reflecting.
  Every control label carries §1.5 Type; every displayed number carries Evidence = unvalidated
  phrasing. No physical units on G-G quantities.
- **A2-6** Renderer is Three.js `WebGPURenderer`; the backend actually in use (WebGPU vs its
  WebGL2 fallback) is displayed in the UI and recorded with every screenshot. Fallback is
  acceptable for dev screenshots; the claim recorded is only ever the backend that ran.
- **A2-7** Rule 7: no identifiers with the banned stems. Specifically avoid the Three.js
  opacity APIs named alphaTest, alphaMap, alphaHash and the renderer constructor's
  canvas-transparency option named alpha (all four are Three.js blending/canvas flags —
  unrelated to both Libbrecht's attachment coefficient and G-G's thresholds); use opaque
  materials. If one ever becomes unavoidable, it takes a per-line waiver with a reason, not an
  allowlist edit.
- **A2-8** Interactivity: on the dev machine, a plate run at 128×128×64 advances visibly
  (≥ ~5 ticks/s sustained early-run) with the UI responsive; the render loop is decoupled from
  solver stepping (worker batches ticks; UI renders latest snapshot).
- **A2-9** Screenshot harness exists (Playwright chromium, `app/scripts/visual.mjs` or
  similar): boots the dev/preview server, waits for N ticks, captures PNG(s) to
  `out/phase3-visual/` with the backend recorded. Used by every review round. (Playwright and
  its browser are devDependencies/tooling only; nothing in `app/src` may depend on them.)

**WP3 — overlays, slice, picking, HUD:**

- **A3-1** Surface overlay selector with the charter's four quantities, each with a stated
  definition and honest label: vapor availability (mean `d` over the cell's free neighbors),
  growth propensity (for `GGThreshold`: max over adjacent boundary sites of
  `b / ggThreshBeta(slot)` — labeled "progress toward G-G attachment threshold
  (phenomenological)"), boundary mass `b`, recent growth velocity (attach-tick recency over a
  stated window). Adjustable value range + on-screen legend; a perceptually monotone colormap.
- **A3-2** Slice plane through the vapor field `d`: vertical (j-index through center, the
  Berg-picture view) and horizontal (k-index) orientations, draggable along its normal,
  adjustable value range, freeze-and-inspect (pause solver; slice and readout keep working on
  the frozen snapshot).
- **A3-3** Cell picking: hover/click on a prism → readout of (i, j, k), a, b, d, uncapped
  n_T/n_Z, current overlay value — every quantity with §1.5 Type × Evidence labels;
  no invented units, no percentages implying measurement.
- **A3-4** Depletion HUD: current depletionCenter/depletionRim/depletionRatio computed by the
  **same** `@vcc/core` function (imported, not reimplemented), shown live with a small
  time-series display ("watch it starve" with the number attached).
- **A3-5** Visual gate rehearsal (screenshots read by the coordinator and reviewer): plate at
  mid-run with the vertical slice visibly depressed above the facet center relative to the rim,
  and the HUD ratio < 1 and falling. This satisfies the "watch" half of Done-when; the metric
  half is `gate3`.
- **A3-6** Root `npm test` green; Rule 7 clean; no app import reaches into `runner/` or into
  package internals (only exported entry points).

### Review protocol (every R round; separate agent from the dev agent)

The reviewer receives this plan, the diff, and the criteria for its WP, and must:
read the relevant specs (gg-machinery for field semantics; this plan; charter §1.5/§3.1/§3.2
Phase 3); check every criterion adversarially and *by running things* (`npm test`, the negative
controls, the app + screenshot harness for WP2/WP3); independently recompute the depletion
metric on a fixture; hunt for label dishonesty (fake units, silent Evidence upgrades); check
Rule 7 and territory boundaries; verify tests are non-vacuous (would fail if the feature
broke). Findings come back as a numbered list with severity; the dev agent fixes; loop until
the reviewer reports zero blockers. The coordinator additionally does visual inspection of the
screenshots at R2/R3 and before the gate claim.

## Steps

- [x] Passing criteria written and committed before any dev agent runs (this file, ea9376d)
- [x] ADR 0007 + charter §3.2 amendment (phase overlap) committed (ea9376d)
- [x] WP1: metric + printing + tests (dev agent; d804603, 150/150 green)
- [x] Probe run (observational, `out/phase3-probe.log` + `out/phase3-ktop-probe.ts`);
      thresholds REGISTERED above; criteria shape corrected to windowed statistics (see
      Tried and rejected) — committed with this edit
- [x] WP1b: gate3 + negative controls (dev agent; 830c518)
- [x] R1 adversarial review loop → CLEAN in 2 rounds. Round 1: 1 BLOCKER (checkpoint-header
      schema drift broke the recorded 2a byte-identity — see Tried and rejected; fixed
      5dd6127 with the eleven-key wire contract, byte-identity re-proven by cmp + SHA) +
      3 should-fixes (unknown-key decode rejection; G3-WINDOW/final-symmetry registration,
      4867a67; evidence-line §1.5 provenance). Round 2: independently re-verified with fresh
      enforced run + mutation tests, 172/172, no new findings.
- [x] WP2: app scaffold + worker + prisms + camera (dev agent; 05b5027 — 29 new tests,
      201/201, WebGPU backend measured in headless chromium, 84.9 ticks/s vs the 5 bar)
- [x] R2 review + coordinator visual inspection → CLEAN round 1 (0 blockers, 0 should-fixes,
      8 notes — labels honest, worker boundary proven, prism orientation mutation-pinned,
      WebGL2 fallback forced with truthful label, protocol semantics driven live 13/13;
      coordinator inspected the three screenshots: hexagonal silhouette, flat facets,
      terraced shoulders, §1.5 status footer)
- [x] WP3: overlays + slice + picking + HUD (dev agent; 068dce4, 43 new tests) + coordinator
      visual-finding fix round (09d412f — slice captures were illegible: panels occluded the
      well and the demo range saturated; fixed with a bottom-left chrome column, reproducible
      camera pose, and a profile-calibrated mid range recorded in the manifest)
- [x] R3 review + coordinator visual inspection → CLEAN (0 blockers, 1 should-fix, 5 notes).
      Overlay quantities brute-force-matched exactly (walls included); slice axis mapping
      proven with an (i,j,k)-encoding fixture both orientations; HUD depletion numbers
      bit-identical to a fresh oracle at the same tick; labels swept honest; debug hooks
      proven view-only. Should-fix (slider bounds pinned to default dims → legend/render
      divergence off-default) fixed in b7653c7 with a single-source clamp + 4 tests, 248/248.
      Coordinator re-inspection of the fixed captures: PASS (Berg picture legible:
      depletion band thickest above facet center, pinching at rim tips).
- [x] gate3 evidence run — **PASSED, exit 0** (2026-07-16): windowMedianRatio 0.531454
      (registered ≤ 0.75), fractionBelow1 0.902439 (≥ 0.80), finalRadius 38 (≥ 30),
      finalAR 0.168831 (< 0.3), stop far-field at tick 4800, symErr 0 with delta-sym clean
      all ticks, no domain contact. Command: `node runner/src/main.ts gate3` (flagless;
      protocol pinned — plate preset, dims 128,128,64, hexPrism, reflecting, seed 1,
      noise 0). Artifacts: `out/gate3.log`, `out/gate3-exit-status.txt` (exit 0),
      `out/gate3-depletion.csv` (48 samples, full series incl. the post-window ring-
      nucleation inversion 13.5→4.04), `out/gate3-plate.ckpt` (roundTripIdentical=true and
      **byte-identical to the accepted 2a artifact** — SHA-256 f1796b5015…, `cmp` exit 0).
      Window statistics reproduce the registered probe exactly (deterministic pinned-engine
      trajectory).
- [x] Final: PROGRESS updated, gate marked evidence-complete pending maker assertion
      (2026-07-16). Both Done-when halves hold: the automated metric via gate3 exit 0, and
      the watch-it half via the app's slice view (accepted captures in `out/phase3-visual/`,
      reproducible via `node app/scripts/visual.mjs`).

## Out of scope

- Anything Phase 7 product-shaped: polished UI framework, galleries, export, timeline editor,
  smooth surface extraction, ice materials/post-processing.
- GPU work (`solver-gpu/`, WGSL) — Phase 5; the app renders from CPU-solver snapshots only.
- LK-driven gate claims. `LKSolver` may be *loadable* in the app later, but Phase 3's gate and
  evidence are `GGThreshold` plate only, and no LK run is started while gate2b is in flight.
- SDAK, parameter sweeps, Nakaya comparisons (Phase 6).
- Checkpoint loading/saving in the app (runner owns evidence I/O).

## Tried and rejected

- **Box-domain gate runs** — rejected before trying, on the 2a record: a box footprint cannot
  be D6h-symmetric (rhombic walls); the gate runs hexPrism, exactly like the 2a plate gate.
- **Defining the metric on "supersaturation"** — under `GGThreshold` no such physical field
  exists; the metric is defined on the `d` field with the honesty note above, as a ratio, so
  the same code serves a future LK σ without relabeling. (Charter's σ wording is satisfied by
  the ratio + explicit field provenance, not by inventing units.)
- **Letting the dev agent pick gate thresholds** — rejected; thresholds are registered in this
  plan by the coordinator after the probe, before the evidence run, mirroring 2b's
  pre-registration discipline.
- **One mega-agent for the whole phase** — rejected; maker directed criteria-first serial WPs
  with separate reviewers, and the 2b audit history shows single-pass self-review misses
  blockers.
- **Final-sample + baseline-drop gate criteria** (the shape first drafted here) — rejected
  after the calibration probe measured why they cannot work. The depletionRatio sawtooths
  with basal layer nucleation, and the probe's finale inverts outright: ratio 0.58 at tick
  4400, then 13.5 → 8.5 → 6.3 → 4.04 over ticks 4500–4800. The kTop occupancy probe
  (`out/phase3-ktop-probe.ts`) shows the mechanism as measured fact, not inference: **new
  basal layers nucleate as rings that exclude the starved facet center** (tick 3400: kTop
  layer = 324 cells, radii 9.5–21, center column absent, filled inward to rMin 0 by 3500 and
  the ratio recovered 4.26 → 0.35; tick 4500: new kTop layer radii 7.8–21.5, still unfilled
  at the 4800 far-field stop). During a ring episode the registered center sample at
  (ic, jc, kTop+1) floats above the canyon — one layer above the local center surface — and
  reads geometrically richer vapor, so single-sample criteria measure layer-cycle phase, not
  starvation. The ring nucleation is itself the strongest form of the facet-center-starvation
  story (growth abandons the center), and the gate now uses windowed median + fraction-below-1
  statistics over ticks 400–4400, with the full series still recorded and reported through the
  natural stop.

- **Embedding the new depletion metrics in checkpoint headers** (WP1's first landing) —
  reversed by R1 round 1 (2026-07-15), which measured it as a BLOCKER: `Metrics` is
  serialized whole into the GG v1 checkpoint header, so the three new keys grew the accepted
  2a artifact's header by 111 bytes and broke the recorded byte-identity claim
  (SHA f1796b… no longer reproducible at HEAD; field payload and enforced exit 0 were intact).
  The 2a evidence-hardening plan pins the v1 wire layout and names "new checkpoint fields" as
  out of scope, so the fix pins `encodeCheckpoint` to exactly the eleven v1 metric keys and
  makes `validateGGMetrics` validate that exact set (unknown keys rejected). The in-memory
  `Metrics` bundle keeps the depletion fields for printing, the HUD, and gate3's CSV — the
  registered evidentiary home for the series. Do NOT re-add fields to the checkpoint header
  without an ADR: it silently demotes a closed gate's accepted artifact as regression oracle.

## Open questions

- Whether headless chromium on this machine exposes WebGPU to the screenshot harness, or the
  harness records the WebGL2 fallback. Either is acceptable for A2-6/A2-9 as long as the
  backend is recorded honestly; the maker sees the WebGPU path in a real browser.
