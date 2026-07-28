# 0029 — Phase 7 product layer: four view profiles, staircase ramps, designer intent compiler

- **Date:** 2026-07-28
- **Status:** accepted
- **Charter impact:** §3.2 Phase 7 updated in this session (charter v1.17 → v1.18)

## Context

Phase 6 is in flight and Phase 7's charter text was a five-line sketch whose mode line —
"Explore / Lab / Sculpt modes over the one engine" — had never been defined. The maker directed
a pre-solidification of Phase 7 (2026-07-28 session) so the product shape is decided before the
phase opens, and made four concrete calls in that session:

1. The product layer is **four view profiles** selectable in the app shell: Realistic,
   Scientific, Designer, Developer.
2. The **reference footage** downloaded from snowcrystals.com
   (`research/snowcrystals.com-videos/`, gitignored media per decision 0004) is the visual
   target for the Realistic and Designer profiles — "replicate this as close as possible." The
   52-frame `J0521r2p-44-minute-2-5mm-1080w` sequence was reviewed frame by frame in-session as
   the canonical example.
3. Timeline **ramps**: adopt the staircase recommendation below, subject to seeing the
   convergence result before it is relied on.
4. The **Designer profile** is intent-driven: the user chooses *where and how* the crystal
   grows over time (uniform/faceted vs pointy/branchy, widen vs lengthen, sprout sidebranches,
   seal back to a facet) and the system derives the environmental journey that produces it —
   "every snowflake is a history of its environment, so that history needs to be generated."

Decision 0011 governs the timeline seam this builds on: events are deterministic abrupt jumps,
LK temperature events conserve interior absolute vapor number density, and ramps were
explicitly *deferred* (not rejected) because they need a time-interpolation contract, event
ordering, and replay state Phase 4 did not require.

## Decision

### 1. Four profiles are shells over one engine and one artifact

Realistic, Scientific, Designer, and Developer are UI compositions and rendering
configurations. A profile switch never changes solver behavior, schedules, checkpoints, or
evidence semantics. Every profile reads and writes the same environment-schedule artifact
(decision 0011's schedule + event manifest): Designer writes histories, Scientific edits them,
Realistic renders them, Developer replays them.

### 2. Scientific profile

The full instrument. Controls sit in grouped, collapsible panels organized by physical meaning
(environment: temperature, `sigmaInfinity`, pressure; kinetics: surface policy, noise;
domain/seed), with numerics (residual and divergence tolerances, sweep caps, fill-CFL) behind
an explicit advanced gate — misadjusting those does not vary the science, it invalidates the
run, and the UI must present them as run-validity controls, not dials. Surface propensity
coloring shows the **actual computed per-boundary-pixel growth quantity** — under LK the
Hertz–Knudsen kinetic rate (`alphaHK · vKin · sigmaB`), under G-G boundary mass relative to its
attachment threshold — labeled as a computed rate, never as a probability. §1.5 two-axis label
discipline applies to every control and readout.

### 3. Realistic profile and the named visual target

The reference footage defines the look, and its load-bearing observed properties are recorded
here so the renderer is built to the right model:

- The ice is **transparent**; essentially all color inside the crystal is the backdrop
  gradient refracted through it. The ice itself contributes dark facet-edge lines and bright
  specular ridge highlights (oblique-illumination microscopy look), not white volume.
- **Interior relief carries as much of the beauty as the silhouette**: ridges along sector
  boundaries, concentric ribs, small enclosed voids. Surface extraction must preserve relief;
  over-smoothing destroys the target look.
- The subject is a thin plate **viewed face-on, near-orthographic**, centered on a smooth
  two-tone gradient. Camera tilt is a garnish, not the default.
- Growth is **continuous sub-pixel edge advance** — nothing pops. The LK fill fraction is a
  continuous sub-cell quantity and is used as the level set for smooth surface extraction, so
  the mesh advances between interface steps. The Realistic profile therefore pairs with the LK
  operator; G-G attachment is binary and keeps the cell-true rendering of the Scientific view.

The profile ships a few curated pre-baked histories with a minimal control surface. Preset
labels obey §1.5 and whatever Phase 6 earns; exact label wording is deliberately **not**
decided here (maker-deferred).

### 4. Ramps compile to a staircase of decision-0011 events

A ramp drawn on the timeline is UI sugar. The schedule compiler emits a dense staircase of
abrupt events — bounded by at most one event per interface step — each executing the
decision-0011 machinery (density-conserving transform, atomic derived-value update, per-step
temperature ledger) unchanged. No solver-core change, no checkpoint version change; the event
log records the staircase truthfully.

**Why this is not a fidelity compromise:** physical time advances only in the interface update
(standing Phase 2b contract). Any "continuous" ramp implementation could still only be
evaluated at interface-step boundaries, so one event per step is already the solver's native
temporal resolution — a within-step ramp law would re-derive the 0011 conservation transform in
differential form for zero expressible gain. Real cloud journeys vary over minutes while
interface steps are far finer, so the staircase oversamples the physical variation regardless.

**Adoption condition (maker: "see the result first"):** before the compiler is relied on, run a
recorded step-halving convergence check on a representative ramped history — halve the
staircase step, confirm the registered morphology metrics are stable. That check is what
upgrades 0011's honest disclaimer ("no claim that an abrupt event approximates a smooth
trajectory") into a measured statement for dense staircases. If the check fails, that is a
recorded finding and the ramp feature does not ship on top of it.

### 5. Designer profile is a forward intent compiler, not an inverse solver

The user composes **growth intents over time** — uniform/faceted vs pointy/branchy, widen vs
lengthen, sprout sidebranches, seal the edge back to a facet. The intent compiler maps each
intent to a region of **the model's own morphology diagram — the artifact the Phase 6 sweep
produces** — emits an environment schedule (using the same staircase machinery), and grows the
crystal **forward with the real solver**. The output is the crystal plus its generated journey:
the same schedule artifact every other profile consumes. Propensity coloring (item 2) previews
where the crystal will grow under the currently selected intent before the user commits.

The mapping is labeled as *the model's* diagram, never nature's; if Phase 6 lands negative in a
regime, intents grounded there must say so (§1.5). Full inverse design — recover a history from
an arbitrary drawn target crystal — is out of scope for v1: it is ill-posed and computationally
heavy. A bounded target-silhouette search over schedule space is a v2+ candidate only.

### 6. Developer profile is read-only playback of repo-committed scenes

Scenes are TypeScript modules committed to the repo: a named checkpoint or run spec + seed,
camera keyframes, overlay toggles, step ranges, captions, pacing. The app registers and plays
them read-only, with deterministic frame capture for explainer-video production
(`docs/video-explainer.md` is the narrative source material). Scene scripts cannot alter solver
behavior — the moment a scene can nudge the solver, it is a second unreviewed physics path.

## Consequences

- **Buys:** one artifact, four lenses — Designer output is Scientific input is Realistic
  content is Developer material. The Phase 6 sweep artifact gains a second consumer (the intent
  compiler), so validation work directly powers the creative feature. The visual target is
  concrete and checkable against named frames. The ramp path reuses paid-for machinery.
- **Costs:** staircase ramps put hundreds of events into schedule manifests (tooling and
  reports must handle that scale); each event costs an O(domain) transform plus elliptic
  reconvergence — small for small ΔT, but nonzero. Designer quality is bounded by the measured
  diagram's coverage and honesty labels. Relief-preserving smooth extraction is genuinely
  harder than either blocky cells or aggressive smoothing.
- **Limits:** no profile upgrades any evidence claim; Phase 7 still begins after Phase 6;
  preset label wording remains an open maker decision.
- **Forecloses:** continuous within-step parameter variation; full inverse design in v1;
  solver-mutating scene scripts; volumetric-white "snow" rendering as the Realistic material
  model.

## Alternatives considered

- **Keep "Explore / Lab / Sculpt" as written** — superseded: the sketch had no
  authoring/production story, "Sculpt" was undefined, and the maker's four profiles give each
  audience (public, scientist friends, creators, the maker's own video pipeline) a named home.
- **True continuous ramps** — rejected: physical time is already discrete at interface steps,
  so a within-step ramp law cannot express anything the per-step staircase cannot, and it would
  force re-deriving the decision-0011 conservation transform in differential form.
- **Full inverse design for Designer v1** — rejected: recovering a history from an arbitrary
  target is ill-posed (many journeys, one silhouette; some silhouettes unreachable) and needs
  large-scale search the product does not require. The intent compiler delivers the "design
  where it grows" experience with a forward, honest pipeline.
- **Volumetric/white-snow rendering for Realistic** — rejected by direct observation of the
  reference footage: the crystal is a transparent refractive object whose color is the backdrop;
  painting it white is the wrong material model, however "snowy" it reads.
- **In-app scene editing for Developer** — rejected: repo-committed read-only scenes keep
  playback deterministic, reviewable, and unable to fork solver behavior.
