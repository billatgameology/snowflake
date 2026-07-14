# Plan — Repo scaffold and the CPU reference solver

- **Phase:** Phase 2 (charter §3.2), split into **2a** (machinery) and **2b** (physics), plus the
  repo scaffold that precedes both
- **Status:** not started
- **Started:** 2026-07-14
- **Last touched:** 2026-07-14 by Claude Opus 4.8 — restructured for decision
  [0003](../decisions/0003-libbrecht-attachment-kinetics.md)

> **Restructured 2026-07-14, mid-plan, before any code.** The original plan built the G-G model as
> *the* model. Decision 0003 replaced its attachment thresholds with Libbrecht's kinetics, so
> Phase 2 is now two gated stages. **Everything the original plan established is preserved below**
> — the scaffold, the symmetry-threshold argument, the performance estimate, the dendrite risk. It
> was all still right; it is now Stage 2a.

## Goal

Stand up the repository and build the CPU oracle: a plain-TypeScript, float64 solver on the
stacked triangular lattice, running headless, in two gated stages.

**2a** builds G-G's machinery with G-G's own thresholds and drives it to a certified
sixfold-symmetric plate. **2b** replaces *only* the attachment step with Libbrecht's physics, so
temperature becomes an input to the model rather than a label pasted onto a knob afterward.

This is the project's spine. The charter is explicit that the oracle is never deleted (§3.1) and
that the GPU solver is validated against it (Phase 5). Everything downstream — the Three.js
instrument, the WGSL port, the sweep harness, Phase 6 — is a client of the model definitions and
checkpoint format this plan creates. Nothing else can be trusted until this is.

**Read before writing solver code:** [gg-machinery.md](../gg-machinery.md) for 2a,
[attachment-kinetics.md](../attachment-kinetics.md) for 2b. Both record decisions and errata that
are expensive to rediscover and that will silently break a gate if copied blindly from the papers.

## Done when

### Stage 2a — copied verbatim from charter §3.2

> - Stacked triangular lattice: flat typed arrays, index math, 6+2 neighbor lookup. Unit tests for
>   neighbor symmetry and boundary handling. **Done when neighbor tests pass in all directions.**
> - Vapor diffusion on the lattice, with a mass-conservation test. **Done when total mass is
>   conserved to tolerance over long runs.**
> - Seed + cell states + the full Gravner–Griffeath update cycle (diffusion → freezing →
>   attachment → melting), including the noise term. **Done when a crystal grows at all.**
> - First scientific gate: a stable, sixfold-symmetric hexagonal plate, verified by an automated
>   symmetry check — not by eyeballing. **Done when the symmetry-error metric stays under threshold
>   across a full run.**
> - Crude field observability from day one: dump vapor slices and surface propensity as images. A
>   malformed crystal can look plausibly organic; a malformed field is obvious immediately.

**Threshold for the symmetry gate: exactly 0.** The metric counts cells in the symmetric
difference `|A Δ g(A)| / |A|` over the D6h generators, so it is either 0 or at least `1/|A|` —
there is no meaningful "small but nonzero." The dynamics is deterministic and the seed is
symmetric, so any nonzero value is an index-arithmetic bug, which is precisely what this gate
exists to catch. (Caveat recorded honestly: float rounding *could* in principle flip a knife-edge
`b ≥ β` test in a near-critical parameter set. The plate preset is nowhere near critical. If a
future near-critical preset trips this, that is a finding, not a reason to soften the threshold —
write an ADR.)

**Run the symmetry gate with noise OFF.** The noise term breaks exact symmetry by design; the
sidebranching results need it ON. Two different runs, and conflating them will waste a day.

### Stage 2b

`LibbrechtKinetics` grows a crystal whose habit is an **output of temperature**, while
`GGThreshold` still passes every 2a gate on the same machinery.

Not softened: 2b does not pass merely by running. **It passes when the same solver, at two
different temperatures, with no other change, produces two different habits.**

## Approach

**The governing rule: never physics ahead of the machinery.** Same spirit as "never port ahead of
the oracle" (charter §3.1, §3.3). A physics bug sitting on an unproven lattice is two bugs wearing
one coat, and the symptom of each is "the crystal looks wrong."

### Scaffold

Five workspace packages, per charter §3.1, but only three get built here: `core`, `solver-cpu`,
`runner`. `solver-gpu` and `app` are reserved names, created empty or not at all until Phases 5
and 3 respectively. **The solver is not the app**, and the fastest way to honour that is to have
no app to hide in.

Tooling: **npm workspaces** (npm 11 is already on the machine; pnpm is not, and five local
packages do not justify a new dependency), TypeScript strict, Vitest. Vite arrives with the `app`
in Phase 3 — nothing here needs a bundler. **Seeded PRNG in `core`; never `Math.random()`** —
charter §3.1 requires determinism throughout, and a stray `Math.random()` in the hot loop silently
destroys the Phase 5 oracle-vs-GPU comparison.

Two design choices worth stating up front, both recorded as ADRs because they contradict the
charter:

- **Grid dimensions are `(nx, ny, nz)`, independent — never `N³`.** See
  [ADR 0001](../decisions/0001-non-cubic-grid-dimensions.md). Plates want wide and flat; columns
  want tall and narrow. Retrofitting this through WGSL in Phase 5 would be miserable.
- **Dev hardware is split**: Mac for Phases 0–4, the RTX 4080 for GPU work and Phase 6 sweeps.
  See [ADR 0002](../decisions/0002-dev-hardware-split.md). No effect on this plan — it is all
  CPU — but it is why the code stays platform-neutral.

Performance sanity check, so nobody optimizes prematurely or panics late: the plate gate needs a
crystal of radius ≈50, which G-G reach in ~10 000 ticks. At 128×128×64 that is ~10⁵ cells ×
10⁴ ticks ≈ 10⁹ cell-updates — a few minutes of plain float64 TypeScript. **The gate is a
coffee-break run, not an overnight one.** Diffusion is O(cells) and dominates; the boundary is
O(surface) and is maintained as an explicit list rather than rediscovered by scanning.

### Stage 2b — attachment becomes physics

Introduce the `AttachmentRule` interface with **two permanent implementations**:

```ts
interface AttachmentRule {
  // called on boundary cells only; step (iii) of the update cycle
  shouldAttach(cell: BoundaryCell, ctx: FieldContext): AttachmentResult;
}
```

`GGThreshold` (2a's, unchanged) and `LibbrechtKinetics`. **Both kept forever**, exactly as the CPU
oracle is kept forever (charter §3.3).

`GGThreshold` is the **control group**: when `LibbrechtKinetics` produces something strange,
re-run `GGThreshold` on the same machinery and the same seed. Still correct ⇒ the bug is in the
physics. Broken too ⇒ the bug is underneath it, and the physics is innocent. That differential is
the entire justification for keeping two rules, and it will save more time than it costs.

Order within 2b is deliberate; each step gates the next:

1. **Parameter extraction** → [libbrecht-parameters.md](../libbrecht-parameters.md). No number
   without a citation.
2. **Units** — Δx (µm), Δt (s), D (m²/s) — and derive `n_diff`, the diffusion iterations per
   growth step ([attachment-kinetics.md](../attachment-kinetics.md) §4.3). **Show the arithmetic
   in this file.**
3. **The seam** — continuous `v_n` → discrete lattice attachment (§4.2). Deterministic
   accumulation preferred over stochastic attachment, because determinism is a hard requirement
   and G-G's noise already supplies what sidebranching needs. **This is the real work of 2b**;
   budget accordingly.
4. **`alphaHK(T, sigma_surf)`** with the basal/prism split.
5. **SDAK — last, and gated.** See Out of scope.

## Steps

**Scaffold**
- [ ] npm workspaces, `tsconfig.base.json` (strict), Vitest. Check: `npm test` runs and exits 0
      with zero tests.
- [ ] Seeded PRNG in `core`. Check: same seed ⇒ identical sequence across processes.

**Stage 2a — machinery**
- [ ] **`core/lattice`.** Axial index math, 6+2 neighbor gather (fast flat offsets in the interior,
      bounds-checked on the domain shell), cartesian embedding, D6h symmetry operators, hex-plate
      seed generator. Check *(gate)*: neighbor symmetry holds in all 8 directions — `y ∈ N(x) ⟺
      x ∈ N(y)` — and boundary handling is tested at every face, edge and corner of the domain.
      Also: `rot60⁶ = id`, and `hexSeed(r=2, t=1)` returns **19** sites (**not 20** — see the
      erratum in gg-machinery §5) and is invariant under the full group.
- [ ] **`core/params`.** `Params` type with `ggThreshBeta`/κ/μ as length-8 arrays indexed
      `n_T*2 + n_Z` (slot 0 unused); the four published presets from gg-machinery §8; validator
      enforcing the Packard and growth-stall bounds as **errors** and monotonicity as a **warning**.
      Check: all four presets pass the hard bounds; `hollowColumn` raises exactly one monotonicity
      warning, at slot (3,1).
- [ ] **`core/metrics`.** Total mass; D6h symmetry error; aspect ratio (z-extent / T-extent);
      hollowness (flood-fill the unattached region from the domain face — anything unattached and
      unreachable is enclosed void); bounding radius. Check: unit tests on synthetic shapes — a
      perfect hex prism scores symmetry 0 and hollowness 0; a hand-built shell scores hollowness > 0.
- [ ] **`core/checkpoint`.** Magic + `u32` header length + JSON header (dims, tick, params, seed,
      metrics) + raw field bytes (`a` u8, `b`/`d` f64 here, f32 from the GPU). Defined now because
      the oracle-vs-GPU comparison, the regression suite and the sweep harness all speak through it
      (charter §3.1). Check: round-trip equality on a grown crystal.
- [ ] **⚠ Extract the noise term from the paper.** gg-machinery §6 is a **known hole in our spec**,
      not an oversight to skip past. Determine the exact expression, which field it perturbs, where
      in the tick it applies, its symbol and range, and **whether it conserves mass**. Load-bearing:
      Libbrecht's kinetics are fully deterministic, so without noise, sidebranching never seeds in
      2b — and the failure will look like a physics failure and will not be one. Check: seeded ⇒
      reproducible.
- [ ] **`solver-cpu`.** The four-step cycle from gg-machinery §4. Ping-pong buffer for `d`
      (diffusion is Jacobi, not Gauss–Seidel — in-place is a silent physics bug). Neighbor counts
      snapshotted at tick start so attachment is simultaneous. Stopping rules from §7. Check
      *(gate)*: total mass conserved to < 1e-10 relative over 10 000 ticks, **noise off**. This is
      an *exact* invariant of the model, so a tolerance failure means a real leak, not drift.
- [ ] **`runner`.** Headless CLI: `grow --preset plate --dims 128,128,64 --ticks 10000 --out
      run.ckpt`, printing metrics as it goes. Check *(gate)*: a crystal grows at all.
- [ ] **Field observability.** Dump a mid-plane vapor slice and a top-down occupancy map as PGM
      from the runner, every N ticks. Not negotiable and not deferrable — the charter's reasoning
      is that a malformed crystal looks plausibly organic while a malformed field is obvious on
      sight, and that asymmetry is the whole argument for doing this on day one.
- [ ] **PHASE 2a GATE.** Plate preset → sixfold hexagonal plate, symmetry error 0 across the entire
      run (noise off), aspect ratio < 1. Record in PROGRESS.md with the metric value, seed,
      resolution and exact command (AGENTS.md Rule 6).
- [ ] **Reproduce all four G-G presets** (plate, needle, hollow column, dendrite — but see the
      dendrite risk below). Check: morphology metrics distinguish them. **This is the floor** — the
      beautiful crystal that survives whatever Phase 6 concludes — **and the control group for 2b.**

**Stage 2b — physics**
- [ ] Fill [libbrecht-parameters.md](../libbrecht-parameters.md) from arXiv:1910.09067, with
      citations. Check: every cell cited, or explicitly marked as a gap. A documented gap is a
      finding; a gap filled with a plausible number is a fabrication.
- [ ] Units + the `n_diff` derivation, arithmetic shown in this file. Check: `n_diff` is plausible.
      **If it comes out in the thousands, or under one, the units are wrong — and that is a
      finding, not a nuisance to tune away.**
- [ ] `AttachmentRule` interface; `GGThreshold` refactored behind it. Check *(gate)*: **all 2a
      gates still pass, bit-identical.** No physics before this passes.
- [ ] `LibbrechtKinetics`: the seam (attachment-kinetics §4.2). Check: a crystal grows at all.
- [ ] Basal/prism split. Check *(gate)*: **habit changes with temperature alone** — two
      temperatures, no other change, two different habits.
- [ ] SDAK, gated. Check: thin plates / needles at the extremes. **Abandon without regret if it
      resists** — the fallback reaches every Phase 4 gate anyway.

## Out of scope

- **Anything GPU.** No WGSL, no WebGPU, no `solver-gpu` package beyond a reserved directory.
- **Anything visual beyond PGM dumps.** No Three.js, no orbit camera, no slice-plane UI — that is
  Phase 3, and the charter is emphatic that these are debugging instruments before they are
  product features.
- **The timeline.** Mid-growth parameter changes are a Phase 4 milestone. The solver should not
  grow a schedule abstraction until something needs one.
- **The 2D UX spike.** Phase 1, separate plan, stays a throwaway Reiter CA per the charter.
- **Dendrites at published scale.** See risks.
- **Optimizing the diffusion sweep** (restricting it to a bounding box around the depletion zone,
  SIMD, etc.). The gate runs in minutes. Do not trade oracle clarity for speed — that is what the
  GPU is for.
- **Tuning `LibbrechtKinetics` until it matches Nakaya.** That is **Phase 6, and it is the test.**
  Pre-tuning here destroys the only thing that makes the test meaningful. If 2b's habits come out
  wrong, **record it and proceed** — do not fit.
- **SDAK before the basal/prism split works.** It is the least certain piece and it is *not* on the
  critical path: hollowing comes from the Berg effect amplified by `exp(−sigma_0/sigma_surf)`, and
  survives dropping the width term entirely (attachment-kinetics §2, §3). Doing SDAK first puts the
  riskiest work in front of a gate it cannot even help.
- **Deleting `GGThreshold`** once Libbrecht works. Charter §3.3 — the floor is never deleted.

## Risks

- **Dendrites are probably not a CPU-era result.** G-G's classic dendrite reaches radius ≈400 at
  ~70 000 ticks, needing a grid around 900×900×100 — roughly 10¹² cell-updates, which is hours to
  days in TypeScript. Phase 4's last bullet ("branching / dendritic growth at high supersaturation
  parameters") may therefore only be demonstrable *qualitatively* at reduced scale on the oracle,
  with the showcase fern landing after the Phase 5 GPU port. This is a re-ordering of charter §3.2
  and gets an ADR **if and when** the CPU attempt actually fails — not pre-emptively. The other
  Phase 4 milestones (plate↔column inversion, facet-center depletion, hollowing) are all
  early-growth phenomena and should be comfortably CPU-reachable; G-G note hollowing "starts
  developing early on."
- **The symmetry gate could be tripped by float rounding rather than by a bug** in a near-critical
  parameter set. Not for the plate preset, which is far from the phase boundary. Flagged so that a
  future model meeting this on G-G's "eccentric crystals" (§13) recognises it.
- **2b may simply not reproduce the Nakaya flip.** That is an accepted, deliberate risk of decision
  0003 — it is what "the model can now be wrong" *means*. It is survivable precisely because 2a
  ships a working, beautiful crystal regardless. Report a negative result as a result; do not fit
  your way out of it.

## Tried and rejected

*(Append as you go. This is not written at the end.)*

- **Scaffolding before writing this plan.** Attempted at the start of the 2026-07-14 session:
  `git init` plus empty package directories, before any plan file existed. Caught by the maker and
  backed out. The directories were removed; **`git init` was left in place**. Noted because
  AGENTS.md Rule 2 exists precisely to prevent this and it still happened.
- **G-G thresholds as the v1 physics** — the charter's original plan, and this plan's original
  basis. Rejected 2026-07-14, before implementation, by decision
  [0003](../decisions/0003-libbrecht-attachment-kinetics.md). G-G's solver contains no temperature,
  so Phase 6 could only ever have been curve-fitting: sweep the knobs, paste a temperature axis on
  the atlas. Retained as `GGThreshold` — **rejected as the physics, kept as the floor and the
  control group.**

## Open questions

- ~~What is Phase 0's real status?~~ **Resolved 2026-07-14: Phase 0 closed, maker-asserted.** One
  thing still stands, though, and it is not bookkeeping: [gg-machinery.md](../gg-machinery.md) was
  written by a model, and the charter's purpose for Phase 0 is that "every line of solver code is a
  deliberate choice." The spec should be **read and checked against the paper**, not merely trusted
  — most of all its three deviations from the published text (19-site seed, the monotonicity
  warning, melting excluded on freshly-attached cells). Each is argued in the file; each is a place
  where a wrong call silently corrupts the 2a gate rather than failing loudly.
- **Does the hole-filling rule** (`n_T ≥ 4 and n_Z ≥ 1 ⇒ attach`, gg-machinery §4.iii) survive into
  `LibbrechtKinetics`? It is geometric hygiene, not physics — it prevents discretization voids. It
  probably should survive, but if it does not, **hollowing results become very hard to interpret**,
  because an interior void could then be physics or could be an artifact. Decide explicitly and
  write down which.
- **Mixed/concave boundary configurations** — `(2,1)`, `(3,1)` etc. are neither cleanly basal nor
  cleanly prism. What interpolation between `alphaHKBasal` and `alphaHKPrism`? Write the policy
  down; do not let it emerge from whatever the `if`-chain happens to do.
- **Do Libbrecht's published parameters carry an assumption about his reduced (near-cylindrical)
  geometry** that breaks when transplanted onto a 3D lattice? Charter §2.7. **The most likely way
  this hybrid fails quietly.** Worth an hour of suspicion before it is worth a week of debugging.
- **f64 oracle vs f32 GPU tolerance.** Deferred to Phase 5, but the checkpoint format has to carry
  both dtypes from the start, so the format is designed for it now.
