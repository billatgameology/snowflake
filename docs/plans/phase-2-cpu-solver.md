# Plan — Repo scaffold and the CPU reference solver

- **Phase:** Phase 2 (charter §3.2), split into **2a** (machinery) and **2b** (physics), plus the
  repo scaffold that precedes both
- **Status:** Scaffold + **Stage 2a COMPLETE — maker-asserted 2026-07-15** (enforced gate,
  twelve criteria; closed after six adversarial review rounds — three subagent, three maker —
  all recorded in Tried and rejected; evidence in Steps). **Stage 2b: both ADR 0005 opening
  deliverables EXIST as of 2026-07-15** — the surface-operator specification
  (attachment-kinetics §4.4, settling the seam's four sub-decisions in writing) and the cited
  parameter table (libbrecht-parameters.md). Whether they lift the pause is the maker's call,
  not this plan's (this project's review history says exactly why). **2b code has not
  started**; when it does, the first step is the `SurfaceOperator` refactor gated by
  bit-identity
- **Started:** 2026-07-14
- **2026-07-15 session:** the D6h symmetry failure is resolved (it was the domain shape, not
  index arithmetic — see "The symmetry gate runs on a hexPrism domain" below and Tried and
  rejected; the underlying finding was first made 2026-07-14 by the scaffold session and left
  code-comment-only, a Rule 1 disagreement recorded in Tried and rejected); the Rule 7
  mention-vs-use waiver is verified complete (repo scan clean,
  real violations still fail in both `--file` and repo-scan modes); diffusion verification
  strengthened per the triage directives (hand-computed impulse weights one and two ticks out,
  face/edge/corner/attached-cell conservation, bitwise D6h impulse response, uniform fixed
  point). Gate results recorded in the Steps checklist as they land.
- **Last touched:** 2026-07-14 by Claude Fable 5 — synced to charter v1.2 (review integration),
  then hardened same day after an adversarial review pass: the seam's bookkeeping demoted from
  "settled" to explicitly-unsettled (four written sub-decisions required first), the Dirichlet
  gate strengthened from a check that could not fail to a falsifiable differential test, the
  hollowness metric redefined so open-ended hollow columns actually score, the 2b habit gate
  operationalized, tolerances and arithmetic corrected — details inline where each applies

> **Restructured 2026-07-14, mid-plan, before any code.** The original plan built the G-G model as
> *the* model. Decision 0003 replaced its attachment thresholds with Libbrecht's kinetics, so
> Phase 2 is now two gated stages. **Everything the original plan established is preserved below**
> — the scaffold, the symmetry-threshold argument, the performance estimate, the dendrite risk. It
> was all still right; it is now Stage 2a.

> **Synced to charter v1.2, 2026-07-14, still before any code.** The review integration touched
> this phase in four places, all folded in below: 2b gains a second far-field boundary condition
> (fixed-σ Dirichlet) with its own gate; the checkpoint header records which condition a run used;
> the metrics module gains the domain-contact guard (~65% bbox flag); and the seam's deterministic
> fill-fraction accumulator is now the charter-specified reference implementation rather than this
> plan's preference. Determinism scope is also now explicit (charter §3.1): bitwise claims hold
> only within the oracle pinned to one engine (Node/V8); everything cross-engine or cross-backend
> compares by stated tolerance.

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
>   attachment → melting), including the noise term, with the published threshold parameters.
>   **Done when a crystal grows at all.**
> - First scientific gate: a stable, sixfold-symmetric hexagonal plate, verified by an automated
>   symmetry check — not by eyeballing. **Done when the symmetry-error metric stays under threshold
>   across a full run.**
> - Crude field observability from day one: dump vapor slices and surface propensity as images. A
>   malformed crystal can look plausibly organic; a malformed field is obvious immediately.

**Threshold for the symmetry gate: exactly 0.** The metric counts cells in the symmetric
difference `|A Δ g(A)| / |A|` over the D6h generators, so it is either 0 or at least `1/|A|` —
there is no meaningful "small but nonzero." The dynamics is deterministic and the seed is
symmetric, so any nonzero value is an index-arithmetic bug, which is precisely what this gate
exists to catch. (Caveat recorded honestly, with the mechanism stated right: symmetric cells sum
the *same multiset* of neighbor values in *permuted order*, and float addition is not
associative — so `b`/`d` at symmetric sites can differ at ulp scale at **any** preset, not just
near-critical ones. The metric reads only `A`, so it stays 0 unless that ulp sliver happens to
straddle a `b ≥ ggThreshBeta` crossing on some tick. Triage order when the gate reads nonzero:
index arithmetic first — it is the overwhelmingly likely cause and the bug this gate exists to
catch; the ulp-straddle flip is a rare tail event. If a genuine ulp flip is ever demonstrated,
that is a finding — make the neighbor-summation order canonical, or write an ADR; do not soften
the threshold.)

**Run the symmetry gate with noise OFF.** The noise term breaks exact symmetry by design; the
sidebranching results need it ON. Two different runs, and conflating them will waste a day.

**The symmetry gate runs on a hexPrism domain (found 2026-07-14, scaffold session;
independently verified and the gate test fixed 2026-07-15).** A box domain is
*geometrically incapable* of an exactly-symmetric run: the axial-rectangle footprint is a
rhombus (not rot60-invariant), and an even `nz` has no center plane, so the reflecting walls
imprint their asymmetry on the vapor field and, through it, on the crystal — legitimately, not
as a bug. Measured (see Tried and rejected for the full triage): at 32×32×16 the first
asymmetric attachment lands at tick 270 via zmirror with a boundary-mass split of ~0.03 between
mirror partners — mesoscopic wall physics, three orders above ulp scale. The scaffold session
had already implemented `domain: "hexPrism"` for exactly this reason — the active region masked
to the inscribed hexagonal prism with a zmirror-symmetric z-range, wall cells inert and
reflecting exactly like attached cells (G-G themselves ran "a finite lattice in the shape of
hexagonal prism", paper §III) — and the gate runs there. This is the domain shape made
D6h-symmetric so the *claim under test* (symmetric environment ⇒ symmetric crystal) is actually
testable; the gate threshold is untouched at exactly 0, and a box negative-control test pins the
geometry argument so nobody "simplifies" the gate back onto a box. Not an ADR: the charter does
not prescribe a domain shape, so nothing is contradicted or extended — recorded here and in the
solver header (decision 1) instead. Defaults, precisely: **the runner defaults every run to
hexPrism**; the `GGSolver` constructor defaults to `box`, which remains available for anything
that does not need exact sixfold symmetry (most unit tests use it deliberately).

### Stage 2b

`LibbrechtKinetics` grows a crystal whose habit is an **output of temperature**, while
`GGThreshold` still passes every 2a gate on the same machinery.

Not softened: 2b does not pass merely by running. **It passes when the same solver, at two
different temperatures, with no other change, produces two different habits.**

Plus the far-field gate, copied verbatim from charter §3.2 (added v1.2):

> - Both far-field boundary conditions (§2.4): reflecting (2a's default, unchanged) and fixed-σ
>   Dirichlet, selectable per run and recorded in checkpoint metadata. **Done when a long
>   crystal-free run under Dirichlet holds σ at the set value to tolerance.**

**Strengthened here, deliberately — strengthening is not softening.** As literally written this
gate cannot fail: the documented initial state (gg-machinery §5) is uniform `d = ρ`, and a
uniform field is a fixed point of the diffusion smoother under *both* boundary conditions — so
"holds σ at the set value" passes even if the Dirichlet code is absent, wrong-faced, or never
called. The Steps section replaces it with a depleted-start differential test that distinguishes
the two conditions by construction. The charter's phrasing is met a fortiori; a gate that cannot
fail proves nothing (Rule 6).

Also operationalized here (Rule 6 — a metric, not a feeling): **habit = aspect ratio
(z-extent / max T-extent), measured when the crystal's largest dimension first reaches a stated
size** — habit is size-dependent (the charter's Phase 6 protocol freeze says exactly this), so
the size is part of the result; propose 60 cells and record whatever is actually used. Plate ⟺
AR ≤ 1/1.5; column ⟺ AR ≥ 1.5. The gate needs one temperature in each class — an inversion with
margin, not a wiggle across 1.0 — and the two temperatures are **chosen in advance from the
extracted `sigma_0_basal`/`sigma_0_prism` crossing** in libbrecht-parameters.md, not scanned for
after the results are in.

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
destroys the Phase 5 oracle-vs-GPU comparison. Scope that determinism precisely (charter §3.1,
v1.2): **bitwise reproducibility is claimed only for the oracle pinned to one engine (Node/V8)** —
the JS spec does not guarantee bit-identical `Math.exp`/`Math.pow` across engines, and
`LibbrechtKinetics` leans on `exp()`. Cross-engine and cross-backend comparisons are by stated
tolerance, never bitwise.

Two design choices worth stating up front, both recorded as ADRs because they contradicted the
charter as first written (v1.2 has since absorbed both — §3.1 now states `(nx, ny, nz)` and the
hardware split itself, so the charter no longer disagrees):

- **Grid dimensions are `(nx, ny, nz)`, independent — never `N³`.** See
  [ADR 0001](../decisions/0001-non-cubic-grid-dimensions.md). Plates want wide and flat; columns
  want tall and narrow. Retrofitting this through WGSL in Phase 5 would be miserable.
- **Dev hardware is split**: Mac for Phases 0–4, the RTX 4080 for GPU work and Phase 6 sweeps.
  See [ADR 0002](../decisions/0002-dev-hardware-split.md). No effect on this plan — it is all
  CPU — but it is why the code stays platform-neutral.

Performance sanity check, so nobody optimizes prematurely or panics late: the plate gate needs a
crystal of radius ≈50, which G-G reach in ~10 000 ticks. At 128×128×64 that is ~10⁶ cells ×
10⁴ ticks ≈ 10¹⁰ cell-updates — minutes, not hours, of plain float64 TypeScript. (Previously
misstated here as 10⁵ cells / 10⁹ updates; 128·128·64 ≈ 1.05 × 10⁶. The coffee-break conclusion
survives the 10× correction.) **The gate is a coffee-break run, not an overnight one.** Diffusion
is O(cells) and dominates; the boundary is O(surface) and is maintained as an explicit list
rather than rediscovered by scanning.

### Stage 2b — attachment becomes physics

Introduce the `AttachmentRule` interface with **two permanent implementations**:

```ts
interface AttachmentRule {
  // called on boundary cells only; step (iii) of the update cycle
  shouldAttach(cell: BoundaryCell, ctx: FieldContext): AttachmentResult;
}
```

`GGThreshold` (2a's, unchanged) and `LibbrechtKinetics`. **Both kept forever**, exactly as the CPU
oracle is kept forever (charter §3.3). Treat the sketch above as illustrative, not signed-off: a
rule that owns a per-cell fill accumulator is *stateful*, and a pure `shouldAttach` cannot
express it — the interface's final shape is part of seam sub-decision (1) below.

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
3. **Far-field boundary conditions** (charter §2.4, added v1.2) — keep reflecting as the 2a
   default, unchanged; add **fixed-σ Dirichlet** (domain faces held at the set supersaturation),
   selectable per run and recorded in checkpoint metadata. Machinery-adjacent, so it lands before
   the physics: its gate (a crystal-free run holds σ) needs no attachment rule at all. Note the
   mass-conservation invariant is a **reflecting-only** property — under Dirichlet the boundary
   is a source/sink by design (gg-machinery §4.i).
4. **The seam** — continuous `v_n` → discrete lattice attachment (§4.2). What charter v1.2
   settled is the **determinism**: a fill-fraction accumulator, never stochastic rounding.
   **The four bookkeeping sub-decisions are now SETTLED, in writing (2026-07-15), by the
   surface-operator specification — attachment-kinetics §4.4** (the ADR 0005 D2 deliverable).
   The answers, one line each, with the rationale living in the spec:
   1. **Where `f` lives:** a separate dimensionless Float64 field; `b` stays exclusively
      `GGThreshold`'s (§4.4 component 4). The `AttachmentRule` sketch is superseded by a
      `SurfaceOperator` interface that owns per-cell surface state (§4.4 component 6). No ADR
      was needed: charter v1.3 had already demoted "reuses the boundary-mass machinery" to
      "one candidate answer, not a decision" and delegated the call to the spec.
   2. **Steps (ii)/(iv) under `LibbrechtKinetics`:** freezing is *replaced* by the Robin-sink
      substitution inside the field relaxation (the only vapor uptake channel — double
      counting is structurally impossible); melting is *disabled* (no sublimation; `v_n`
      clamped at 0 from below). Full disposition table incl. hole-filling (kept) and noise
      (redefined per-rule): §4.4 component 5.
   3. **Mass claim:** not a `Σ(b+d)` invariant — an *accounting identity*: ice gained =
      metered Dirichlet source − field change (exact in ledger arithmetic, asserted), plus a
      divergence-identity consistency check on every converged solve (to stated tolerance).
      Reflecting far field under `LibbrechtKinetics` is diagnostic-only (§4.4 components 3–4).
   4. **`sigma_surf` sampling and normalization:** under `LibbrechtKinetics` the field *is* σ
      (`d ≡ sigma`; the smoother is affine-invariant so the Phase 2a kernel is reused
      unchanged); `sigma_surf` is read at the boundary cell from the converged field, before
      the interface update; there is no "before/after step (ii)" ambiguity because step (ii)
      no longer exists (§4.4 component 1).
   The remaining work of the seam is now *implementation against the spec*, gated by the
   bit-identity refactor test (§4.4 component 6, test 1).
5. **`alphaHK(T, sigma_surf)`** with the basal/prism split.
6. **SDAK — last, and gated.** See Out of scope.

## Steps

**Scaffold**
- [x] npm workspaces, `tsconfig.base.json` (strict), Vitest. Check: `npm test` exits 0 before the
      first test lands (Vitest needs `--passWithNoTests` for that — set it, remove it once real
      tests exist). *Done (a00110e); suite green at 2a close (81 tests, 2026-07-15).*
- [x] **Rule 7 lint.** *(Done: `scripts/lint-rule7.mjs`, mention-vs-use policy in its header and
      AGENTS.md Rule 7; per-line `rule7-waive: <reason>` markers; fixture tests in
      `runner/test/rule7-lint.test.ts`. Verified 2026-07-15: repo scan clean, and real
      violations — bare stem, provenance-free qualifier, markdown inline-span assignment,
      fenced-block identifier — still fail in both `--file` and repo-scan modes.)*
      A repo-root check wired into `npm test`: scan source *and* docs —
      explicitly including `spike/`, which is outside the workspace, and `docs/` — for bare
      `alpha`/`beta` identifiers; allowlist `alphaHK*`, `ggThresh*`,
      `reiterAlpha`/`reiterBeta`/`reiterGamma`. Decide and document the mention-vs-use policy as
      part of writing it (the specs legitimately *discuss* the α collision; qualified prose
      mentions pass, bare identifiers never do). Both plans lean on this rule existing; nothing
      builds it but this step. Check: a fixture containing
      `const alpha = 1` <!-- rule7-waive: the check has to name its own fixture. -->
      fails the check; the current repo passes.
- [x] *(Done, a00110e; `core/src/prng.ts`, tests in `core/test/prng.test.ts`.)* **Counter-based**
      seeded PRNG in `core` — output is a pure function of
      `(seed, cellIndex, tick, streamId)` (a splitmix/PCG-style hash of the tuple), never a
      sequential stream. A stream PRNG makes the noise realization depend on iteration order,
      which GPU threads do not have — a sequential choice here quietly forecloses Phase 5's
      oracle-vs-GPU comparison on every noise-on run. Check: same tuple ⇒ same value across
      processes and across iteration orders.

**Stage 2a — machinery**
- [x] *(Done, a00110e; verified by `core/test/lattice.test.ts`, 13 tests.)* **`core/lattice`.**
      Axial index math, 6+2 neighbor gather (fast flat offsets in the interior,
      bounds-checked on the domain shell), cartesian embedding, D6h symmetry operators, hex-plate
      seed generator. Check *(gate)*: neighbor symmetry holds in all 8 directions — `y ∈ N(x) ⟺
      x ∈ N(y)` — and boundary handling is tested at every face, edge and corner of the domain.
      Also: `rot60⁶ = id`, and `hexSeed(r=2, t=1)` returns **19** sites (**not 20** — see the
      erratum in gg-machinery §5) and is invariant under the full group.
- [x] *(Done, a00110e; `core/test/params.test.ts`, 9 tests, including the two hollowColumn
      monotonicity warnings.)* **`core/params`.** `Params` type with `ggThreshBeta`/κ/μ as
      length-8 arrays indexed
      `n_T*2 + n_Z` (slot 0 unused); the four published presets from gg-machinery §8; validator
      enforcing the Packard and growth-stall bounds as **errors** and monotonicity as a **warning**.
      Check: all four presets pass the hard bounds; monotonicity warnings are **per violated
      comparison**, and `hollowColumn` raises exactly two — `(3,0)→(3,1)` and `(2,1)→(3,1)`, both
      into slot (3,1), which is why "one warning at (3,1)" was ambiguous as first written.
- [x] *(Done, a00110e; `core/test/metrics.test.ts`, 12 tests covering every named synthetic-shape
      check. Metric additionally certified in isolation 2026-07-15 during the symmetry triage:
      19-site seed scores exactly 0; an asymmetric blob's full D6h orbit closure scores exactly
      0, including about an off-center pivot; bare asymmetry scores > 0.)* **`core/metrics`.**
      Total mass — summed **pairwise or Kahan**, because naive summation over
      ~10⁶ f64 cells has a worst-case relative error of order n·ε ≈ 1e-10, i.e. *at* the
      mass-gate tolerance itself. D6h symmetry error. Aspect ratio (z-extent / T-extent).
      **Hollowness, defined per cross-section:** 2D flood-fill each z-slice from its in-plane
      border; unattached cells enclosed *in-plane* are cavity. This is deliberate — real hollow
      columns are **open-ended tubes**, and a 3D flood-fill from the domain face reaches into an
      open cavity and scores the canonical hollow column 0; keep the 3D fill as a second,
      stricter *sealed-void* number. **Branch count** (charter §3.1 names it; an
      angular-local-maxima count of boundary radius in the mid-plane is enough — document the
      chosen convention, including what a plain hexagon scores under it). Bounding radius. And
      the **domain-contact guard** (charter §3.1, v1.2): flag invalid any state whose crystal
      bounding box exceeds 65% of any domain extent. Check: unit tests on synthetic shapes — a
      perfect hex prism scores symmetry 0 and hollowness 0; a hand-built **open-ended tube scores
      cross-section hollowness > 0 and sealed-void 0**; a closed shell scores sealed-void > 0; a
      six-armed star scores branch count 6; a shape spanning 70% of one axis trips the guard
      while a 50% one does not.
- [x] *(Done, a00110e; round-trip verified on synthetic state in `core/test/checkpoint.test.ts`
      and on every grown crystal by the runner — `roundTripIdentical=true` on all 2026-07-15 gate
      runs.)* **`core/checkpoint`.** Magic + `u32` header length + JSON header (dims, tick, params, seed,
      **far-field boundary condition** — charter §2.4 v1.2, so cross-condition comparisons are
      tooling-checkable — **per-field dtype**, and metrics) + raw field bytes, **little-endian
      mandated and stated in the header** (`a` u8, `b`/`d` f64 here, f32 from the GPU — the
      header says which, per field; checkpoints cross the Mac/Windows boundary by design,
      ADR 0002). Defined now because the oracle-vs-GPU comparison, the regression suite and the
      sweep harness all speak through it (charter §3.1). Check: round-trip equality on a
      synthetic hand-built state now; re-verified on the first grown crystal once `runner`
      exists (the solver is two steps away — do not make this step wait on it).
- [x] *(Done 2026-07-14: gg-machinery §6 extracted from the paper's §VI.C, with the honesty note
      that G-G's published 3D snowfakes are deterministic. Implemented in the solver; seeded ⇒
      bit-identical reproduction and mass conservation with noise ON are tested.)*
      **⚠ Extract the noise term from the paper.** gg-machinery §6 is a **known hole in our spec**,
      not an oversight to skip past. Determine the exact expression, which field it perturbs, where
      in the tick it applies, its symbol and range, and **whether it conserves mass**. Load-bearing:
      Libbrecht's kinetics are fully deterministic, so without noise, sidebranching never seeds in
      2b — and the failure will look like a physics failure and will not be one. Check: seeded ⇒
      reproducible.
- [x] *(Done, a00110e + 2026-07-15. Mass gate, **as specified — 10 000 ticks with a growing
      crystal, noise off, reflecting** (maker audit 2026-07-15 caught the first record
      combining a 10k crystal-free control with a 4800-tick grown run — that was an evidence
      failure, corrected here): the enforcing test is
      `solver-cpu/test/gg-solver.test.ts` "conserves total mass to < 1e-10 relative over
      10 000 ticks GROWN" — dev grid 32,32,16, seed 1, 704 cells attached, measured drift
      **4.189e-14**; the maker's independent 10k grown check read ≈ 3.04e-14. Supporting
      records: crystal-free float floor at gate scale = **3.819e-16** over 10 000 ticks —
      `node runner/src/main.ts grow --preset plate --dims 128,128,64 --seed-radius none
      --ticks 10000 --stop-check-every 1000000`; grown plate gate run drift = **2.056e-13**
      over its full 4800-tick run, ~500× above the float floor, consistent with per-tick
      freeze/melt/attach float shuffling rather than a leak. Noise-ON and φ>0 conservation:
      `solver-cpu/test/`. Diffusion
      step verification strengthened 2026-07-15 in `solver-cpu/test/diffusion.test.ts`: uniform
      fixed point ≤ 2 ulp/tick; impulse weights hand-computed one and two ticks out — 4/49,
      3/98 at tick 1; 41/686, 82/2401, 41/4802, 41/2401, 12/343, 9/1372 at tick 2; exact
      conservation at faces/edges/corners and around attached cells; bitwise D6h impulse
      response with and without a crystal in the field.)*
      **`solver-cpu`.** The four-step cycle from gg-machinery §4. Ping-pong buffer for `d`
      (diffusion is Jacobi, not Gauss–Seidel — in-place is a silent physics bug). Neighbor counts
      snapshotted at tick start so attachment is simultaneous. Stopping rules from §7. Keep
      `solver-cpu` environment-neutral — no Node APIs; all file I/O lives in `runner` — so
      Phase 3 can host the identical solver in a Web Worker (charter §3.1). Check *(gate)*: total
      mass conserved to < 1e-10 relative over 10 000 ticks, **noise off, reflecting far field** —
      the invariant is a reflecting-only property (gg-machinery §4.i); the Dirichlet condition
      added in 2b is a source/sink by design. The invariant is exact **in real arithmetic**; in
      float64 both the state and the *measurement* drift, which is why `core/metrics` sums
      pairwise/Kahan. Characterize the float floor with a crystal-free control run; a failure
      well above that floor is a real leak, not drift.
- [x] **`runner`.** Headless CLI: `grow --preset plate --dims 128,128,64 --ticks 10000 --out
      run.ckpt`, printing metrics as it goes. Check *(gate)*: a crystal grows at all.
      *(Done: 19 seed sites → 26 783 attached at tick 4800 on the gate run below. Also grew
      `--seed-radius N|none` for crystal-free control runs, and `--enforce-gate` — the runner
      exits 1 naming every failed gate criterion, so the gate is a build failure, not a printed
      line (maker audit 2026-07-15; pinned by `runner/test/gate-enforce.test.ts`). A
      contact-stopped run now prints a NOT-valid-evidence warning, since its final state
      exceeds the 65% guard by construction.)*
- [x] *(Done, a00110e: `runner/src/pgm.ts`, `--pgm-every`. Gate run dumped vapor/propensity/
      occupancy at 2000-tick cadence; eyeballed 2026-07-15 — and recorded as an eyeball, per
      Rule 6: smooth hexagonal depletion halo, no streaks or checkerboarding, solid plate
      occupancy.)* **Field observability.** Dump a mid-plane vapor slice and a **surface-propensity map** —
      per-boundary-cell, `b / ggThreshBeta(n_T, n_Z)` under `GGThreshold`, the fill rate under
      `LibbrechtKinetics` in 2b — as PGM from the runner, every N ticks; a top-down occupancy map
      is a cheap third. The charter's done-when names vapor slices *and surface propensity*; an
      occupancy map is not a substitute for the latter. Not negotiable and not deferrable — the
      charter's reasoning is that a malformed crystal looks plausibly organic while a malformed
      field is obvious on sight, and that asymmetry is the whole argument for doing this on day
      one.
- [x] **PHASE 2a GATE.** Plate preset → sixfold hexagonal plate, symmetry error 0 across the entire
      run (noise off), aspect ratio < 1. "Entire run" defined: until the far-field stopping
      rule fires (mean shell vapor < 2ρ/3, gg-machinery §7). *(Corrected 2026-07-15, round-3
      review: this sentence originally also accepted a domain-contact-guard trip as a valid
      run end — but a contact-stopped run's final state exceeds the 65% limit by construction
      and is not valid evidence (charter §3.1), the exact rule that invalidated the first
      needle run. The guard still ends a run; it cannot end a GATE run, and `--enforce-gate`
      rejects it. Narrowing the accepted ends is a strengthening, not a softening.)* Record in
      PROGRESS.md with the metric value, seed, resolution and exact command (AGENTS.md Rule 6).

      **PASSED 2026-07-15 — and re-passed the same day under enforcement** after the maker's
      audit (see Tried and rejected) turned the runner into an enforcing gate.
      Command (enforcing form; exit 0 is itself the claim):
      `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1
      --out out/plate-gate.ckpt --pgm-every 2000 --pgm-dir out/pgm-plate --enforce-gate`
      (domain defaults to hexPrism: hexRadius 63, zHalfExtent 31, 762 111 active cells; noise
      off; seed 1 recorded, unconsumed with noise off).
      Run ended by the **far-field stopping rule** (mean shell vapor < (2/3)·ρ) at **tick 4800**.
      Symmetry: the exact per-tick delta check was clean on **all 4800 ticks** and the full
      `|A Δ g(A)|/|A|` metric read **0** at every 1000-tick cadence point and on the final
      state (`maxFullSymErr=0`) — symmetry error exactly 0 across the entire run.
      Aspect ratio **0.168831 < 1** (plate). Attached 26 783. Mass drift 2.056e-13 (< 1e-10).
      Checkpoint round-trip bit-identical; the enforced re-run reproduced every number and the
      checkpoint byte count exactly. Independently verified by the maker (2026-07-15) from raw
      checkpoint bytes without the project decoder: D6h error, AR, mass drift, connectedness,
      and the far-field stop all confirmed; "compact, connected, safe-domain plate: 26 783
      cells, bbox 77×77×13." Engine: Node v24.13.1 (pinned-oracle scope).
- [x] *(Scope of this [x], stated precisely: all four presets grow and are morphologically
      separated; 3 of 4 pre-registered inequality checks hold and one FAILED as a finding —
      detailed below. "Reproduced" in the paper-fidelity sense — visual comparison against
      G-G's published figures — was not attempted and is not claimed.)*
      **Reproduce all four G-G presets** (plate, needle, hollow column, dendrite — but see the
      dendrite risk below). Check — stated inequalities, not "metrics distinguish them": plate vs
      needle by aspect ratio (< 1 vs > 1); hollow column vs needle by cross-section hollowness
      (> 0 vs ≈ 0); dendrite vs plate by branch count / boundary complexity under the documented
      convention. Record the actual values in PROGRESS.md when this lands. **This is the floor** —
      the beautiful crystal that survives whatever Phase 6 concludes — **and the control group
      for 2b.**

      **Run 2026-07-15, seed 1, noise off, hexPrism, Node v24.13.1. Three of the four
      pre-registered inequalities hold; one FAILED and is recorded as a finding, not adjusted
      away:**
      - **plate** (gate run above, 128,128,64): AR **0.168831**, branches 0, hollowness 0.0014,
        stop far-field @ 4800.
      - **needle** (96,96,256): AR **6.60000**, cross-section hollowness **0.0740**, sealedVoid
        0, stop **far-field @ tick 10000**, domainContact=false — valid evidence.
        `node runner/src/main.ts grow --preset needle --dims 96,96,256 --ticks 20000 --seed 1
        --out out/needle-256.ckpt`
        *(Supersedes the first needle run at 96,96,192, whose metrics were taken at the
        domain-contact trip state — z extent 125/192 = 65.104% > the charter's 65% — and are
        formally INVALID per charter §3.1. Caught by the maker's audit; that run's numbers are
        kept out of the record deliberately. A tick-capped 7000-tick run at 192 gave the
        consistent AR 5.17 / hollowness 0.0908 on a valid state.)*
      - **hollow column** (96,96,192): AR **4.18519**, cross-section hollowness **0.187633**,
        sealedVoid 0, stop far-field @ 7075.
        `node runner/src/main.ts grow --preset hollowColumn --dims 96,96,192 --ticks 10000
        --seed 1 --out out/hollow-column-192.ckpt`
      - **dendrite** (reduced scale 160,160,48, per the dendrite risk): **branch count 6** vs
        plate's 0, AR 0.0928, stop far-field @ 4975.
        `node runner/src/main.ts grow --preset dendrite --dims 160,160,48 --ticks 12000 --seed 1
        --out out/dendrite.ckpt`
      - All four: symmetry error exactly 0 across the entire run (per-tick delta clean +
        periodic full metric 0), mass drift ≤ 4.3e-13, checkpoints round-trip identical.

      **Inequality outcomes:** plate vs needle AR ✓ (0.169 vs 6.60, comfortably straddling the
      operationalized 1/1.5–1.5 thresholds); dendrite vs plate branch count ✓ (6 vs 0);
      hollow-column hollowness > 0 ✓ (0.188). **needle hollowness ≈ 0 ✗ — measured 0.0740.**
      Diagnosed (out/needle-hollow-probe.ts against out/needle-256.ckpt; independently
      recomputed from raw checkpoint bytes in the round-3 review): the **shaft proper — both
      arms above and below the seed region — encloses exactly 19 free cells per slice, the
      seed's own footprint** (the few seed-plane-adjacent slices vary, zmirror-symmetrically)
      — i.e. this preset grows
      a hollow tube: a sheath around the seed's rim that never fills behind the growth front.
      That is a real morphology, not a metric artifact (the metric's open-tube signature,
      sealedVoid = 0, behaves as designed). **Source-confirmed by the maker (2026-07-15): the
      G-G paper itself describes this preset's product as a "slender hollow tube" — the
      pre-registered expectation was wrong, the measurement right.** What still separates the
      two presets: hollowness magnitude (0.188 vs 0.074, 2.5×) and the needle's much higher AR.
      Left failed-as-pre-registered per Rule 6; anyone tightening this into a future gate now
      has the paper's own words to register against.

**Stage 2b — physics**
- [x] **Fill [libbrecht-parameters.md](../libbrecht-parameters.md)** from arXiv:1910.09067, with
      citations. Check: every cell cited, or explicitly marked as a gap. A documented gap is a
      finding; a gap filled with a plausible number is a fabrication.
      *(Done 2026-07-15. Every entry cited with page numbers; provenance classes assigned.
      Findings worth knowing before reading it: the σ₀(T)/A(T) curves exist in the sources
      ONLY as figures — no printed closed forms or tables anywhere — so the numeric anchors
      are figure digitizations, labeled P2 with ±25% method uncertainty, against two printed
      text anchors; the two sources put the σ₀ crossing at different temperatures (−6 °C in
      1910.09067's A≡1 fits vs ≈−10 °C in the monograph's CAK curves) — recorded as a stated
      systematic, solver uses CAK; D(T) has NO temperature law in the source (the monograph's
      own Table 2.1 is consistent with constant D at 1 atm — verified by back-computation);
      the monograph's "Appendix B" is cited by its own text but does not exist in v2. The
      monograph's Table 2.1 (image-embedded) was transcribed and supplies v_kin(T), c_sat(T),
      sigma_water(T), X_0(T) anchors with a closed-form cross-check at −15 °C to 1.4%.)*
- [x] ~~Units + the `n_diff` derivation~~ **RETRACTED as specified** (ADR 0005 D3: per-sweep
      physical time was the wrong model; the field solve is elliptic-with-residual, and
      iteration counts are outputs, not targets). Replaced by, per attachment-kinetics §4.3
      and §4.4: a **fill-CFL bound** on `Δt` (physical time lives only in the interface
      update) and the **quasi-static validity (Péclet) check**, arithmetic recorded here as
      §4.4 requires — with the freshly extracted numbers, at −15 °C and 1 atm:
      `v_kin = 2.079e-4 m/s` (Table 2.1), so `v_n ≤ alphaHK·v_kin·sigma_infinity ≤ 2.08e-6 m/s`
      at `sigma_infinity = 0.01`; with `L = 100 µm` and `D = 2e-5 m²/s`:
      `Pe = v_n·L/D ≤ 1.04e-5 ≪ 1`. Worst case in the target regime (`sigma_infinity =
      sigma_water(−15) = 0.157`, `L = 1 mm`): `Pe ≤ 1.64e-3 ≪ 1`. At −5 °C
      (`v_kin = 4.959e-4`, `sigma_water = 0.05`, `L = 100 µm`): `Pe ≤ 1.24e-4 ≪ 1`. Lower
      pressure only helps (`D ∼ P⁻¹`). **Quasi-static is comfortably valid across the whole
      Nakaya-relevant regime**; the per-run assertion stays in the suite per §4.4 test 6.
      Sample fill-CFL: `Δx = 0.5 µm`, `sigma_infinity = 0.01`, bound 0.1 →
      `Δt = 0.1·Δx/(v_kin·sigma_infinity) ≈ 0.024 s` per growth step.
- [ ] **Fixed-σ Dirichlet far-field condition** (charter §2.4, v1.2), selectable per run, recorded
      in checkpoint metadata; reflecting stays the default. Check *(gate, strengthened — see Done
      when)*: crystal-free, **depleted** start (`d = σ_set/2` uniform — a uniform-at-`σ_set`
      start is a fixed point under both conditions and tests nothing), diffusion-only until the
      per-tick max change < 1e-12; under Dirichlet, `max|d − σ_set| < 1e-6` everywhere; the
      *identical* run under reflecting must instead conserve total mass and settle at the initial
      mean — the differential is what proves the two conditions are actually different code
      paths. And the 2a mass-conservation gate still passes untouched under reflecting.
- [ ] `SurfaceOperator` interface (supersedes the `AttachmentRule` sketch — attachment-kinetics
      §4.4 component 6 defines it: it owns per-cell surface state and mediates the mass
      exchange); `GGThreshold` refactored behind it. Check *(gate)*: **all 2a gates still pass,
      bit-identical** (same engine — bitwise claims are scoped to the pinned oracle, charter
      §3.1 v1.2). No physics before this passes.
- [ ] `LibbrechtKinetics`: the seam — **implemented against attachment-kinetics §4.4** (the
      surface-operator spec; its four bookkeeping sub-decisions were settled in writing
      2026-07-15 — see Approach item 4 for the one-line answers). Includes the quasi-static
      relaxation with the Robin substitution and metered Dirichlet source, the facet
      classifier policy table, the separate fill field, and §4.4's committed tests 2–5
      (Robin limits, divergence identity, ledger identity, fill-CFL). Check: a crystal grows
      at all, and the ledger does exactly what §4.4 component 4 claims it does.
- [ ] Basal/prism split. Check *(gate)*: **habit changes with temperature alone** — two
      temperatures, no other change, two different habits, per the operationalized aspect-ratio
      thresholds in Done when (plate ⟺ AR ≤ 1/1.5, column ⟺ AR ≥ 1.5, at the stated measurement
      size; temperatures pre-registered from the `sigma_0` crossing).
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
- **Running the symmetry gate on a box domain** — the dev-grid symmetry test as first written
  (32×32×16, default `box`), and the cause of the 0.0424403183 failure that blocked the gate
  through 2026-07-15. **Provenance, straightened out 2026-07-15 (Rule 1):** the scaffold
  session had already made this finding on 2026-07-14 — `core/src/state.ts` carries the full
  diagnosis dated that day (rhombic footprint, even-nz z-asymmetry, the measured Δb ≈ 0.03 by
  tick 269) and a00110e already shipped the hexPrism implementation with the runner defaulting
  to it — but it recorded the finding only in code comments (the state.ts comment even says
  "recorded in the Phase 2 plan", which was false until 2026-07-15), left the dev-grid test on
  `box` and failing, and the PROGRESS handoff said the symmetry bug was "not yet investigated."
  The state file disagreed with the code, and the code was right — same pattern as the Rule 7
  item below. The 2026-07-15 session found the code's own diagnosis first (solver header,
  state.ts) and then *verified it rather than trusting it*, by the triage protocol (metric in
  isolation first): the metric is
  clean — the 19-site seed scores exactly 0, an asymmetric blob's full D6h orbit closure scores
  exactly 0 including about an off-center pivot, and bare asymmetry scores > 0. The dynamics
  probe then separated wall physics from index bugs by scaling the box: first asymmetric
  attachment at tick 146 on 24×24×16 (rot60 pair, in-plane wall distances 8 vs 7), tick ~270 on
  32/48/64×…×16 — converging to the same tick and the same zmirror pairs as in-plane size grows,
  because nz=16 is even and the z-walls sit 8-vs-7 layers from the center plane. Boundary-mass
  splits at the broken pairs: ~0.02–0.03, i.e. mesoscopic field asymmetry, three orders above
  ulp scale — not index arithmetic, not float knife-edges. hexPrism control at all four sizes:
  exactly 0 for 1200 ticks. Verdict: the box violates the gate's *premise* (a D6h-symmetric
  environment), so the box run was measuring the walls, not the solver. Fixed by running the
  gate on hexPrism (see Done when) and pinning the geometry with a box negative-control test.
  Also observed and pinned in that test: a broken delta can transiently *heal* at the set level
  (box 32×32×16 breaks at tick 270, `|A Δ g(A)|` back to 0 by tick 400) — a periodic full
  metric alone can miss a break, which is why the gate also runs the exact per-tick delta check.
- **Claiming the 2a gate off non-enforcing tooling and one invalid run (maker audit,
  2026-07-15).** The first "Phase 2a GATED" claim survived an adversarial subagent review but
  not the maker's charter-grounded audit, which found the *result* genuine (independent
  recomputation from raw checkpoint bytes: symmetry, AR, mass, connectedness, far-field stop
  all confirmed; independent re-implementation of the diffusion equations agreed to 1 ulp) and
  the *evidence process* deficient in three ways, all fixed same-day: (1) the runner printed
  gate metrics but enforced nothing — a known-asymmetric box run exited 0; now `--enforce-gate`
  exits 1 naming each failed criterion, pinned by `runner/test/gate-enforce.test.ts` (the box
  run's end-state full metric reads 0 by the transient heal, so enforcement keys on the
  per-tick delta — the test asserts exactly that). (2) The needle-192 run's metrics were taken
  at the domain-contact trip state — z extent 125/192 = 65.104% > the charter's 65% — formally
  invalid evidence; replaced by a run ending on a valid state, and the runner now prints a
  NOT-valid-evidence warning on every contact-stopped run. (3) The declared 10 000-tick grown
  mass experiment had been recorded as a 10k crystal-free control plus a 4800-tick grown run;
  the specified experiment now exists as an enforcing test (drift 4.189e-14; maker's
  independent check ≈ 3.04e-14). The same class of gap surfaced three more times after
  remediation and was closed the same way each time: a round-3 review found non-plate presets
  passing the enforced gate; the maker's round 4 found non-canonical seeds passing it
  (`--seed-radius 1`/`3` exited 0 while gg-machinery §5 mandates the radius-2, 19-site seed);
  and the maker's round 5 found three more false-pass paths — a *short* box run that ends by
  far-field before the walls bite (18,18,12 grew 19→37, exited 0), a seed-only run on a tiny
  domain (8,8,8 stopped at exactly 19 attached — no growth — against charter §3.2's "a
  crystal grows at all"), and invalid noise amplitudes (`--noise -0.00001` / `NaN` coerced to
  silent noise-off while poisoning recorded metadata). Enforcement now pins twelve criteria —
  preset, hexPrism domain, seed by configuration (radius 2) AND behavior (the run header's
  `seedSites` must be 19, so "fixing" the seed back to the paper's erroneous 20 fails the
  gate), noise exactly 0, actual growth, delta clean, full metric 0, drift, AR, no contact,
  far-field end — and the parser rejects negative/non-finite noise for *every* run; all
  pinned by adversarial regression tests in `runner/test/gate-enforce.test.ts`. Lesson for
  the next model: **subagent review checks the work against itself; the maker checks it
  against the charter and the sources — write the gate so a build failure, not a reader,
  catches the gap. And when enforcing a gate, enumerate the claim's preconditions from the
  spec (preset, domain, seed, noise, growth) — not just its outcome metrics; every
  precondition left un-enforced is a false "exit 0 is the whole claim". Degenerate runs that
  end before the interesting physics starts (tiny domains, short tick caps) pass outcome
  metrics vacuously — enforce that the phenomenon under test actually occurred.**
- **"npm test fails in the repo-wide Rule 7 scan" (PROGRESS.md, 2026-07-15 handoff)** — did not
  reproduce at HEAD (a58bac0): the scan and the fixture tests pass, and the lint verifiably
  still fails on real violations (bare stem, provenance-free qualifier, markdown inline-span
  assignment, fenced-block identifier) in both `--file` and repo-scan modes, checked 2026-07-15.
  The WIP commit (6fe21f5) evidently completed more than its own handoff note credited — its
  lint script and fixtures were already the finished per-line-semantics version. Recorded per
  Rule 1: the state file disagreed with the code, and the code was right.

## Open questions

- ~~What is Phase 0's real status?~~ **Resolved 2026-07-14: Phase 0 closed, maker-asserted.** One
  thing still stands, though, and it is not bookkeeping: [gg-machinery.md](../gg-machinery.md) was
  written by a model, and the charter's purpose for Phase 0 is that "every line of solver code is a
  deliberate choice." The spec should be **read and checked against the paper**, not merely trusted
  — most of all its three deviations from the published text (19-site seed, the monotonicity
  warning, melting excluded on freshly-attached cells). Each is argued in the file; each is a place
  where a wrong call silently corrupts the 2a gate rather than failing loudly.
- ~~**Does the hole-filling rule** survive into `LibbrechtKinetics`?~~ **Resolved 2026-07-15
  (attachment-kinetics §4.4 component 5): KEPT** — geometric hygiene, now also physically
  consistent (max-coordination kink sites have no nucleation barrier). Interior voids stay
  interpretable as physics, not artifacts.
- ~~**The seam's bookkeeping — the four sub-decisions**~~ **Resolved 2026-07-15, in writing:
  attachment-kinetics §4.4; one-line answers in Approach item 4.** No ADR was needed — charter
  v1.3 had already delegated the decision to the spec.
- ~~**Mixed/concave boundary configurations** — what interpolation?~~ **Resolved 2026-07-15
  (attachment-kinetics §4.4 component 2, the policy table):** `(0,1)` → basal, `(1,0)` →
  prism, everything else is a step/kink site with `alphaHK = 1` (nucleation-limited kinetics
  applies to perfect facets; steps incorporate barrier-free — the sources' own
  molecularly-rough limit). Not an interpolation: a physical classification.
- **Do Libbrecht's published parameters carry an assumption about his reduced (near-cylindrical)
  geometry** that breaks when transplanted onto a 3D lattice? Charter §2.7. **The most likely way
  this hybrid fails quietly.** Worth an hour of suspicion before it is worth a week of debugging.
- **f64 oracle vs f32 GPU tolerance.** Deferred to Phase 5, but the checkpoint format has to carry
  both dtypes from the start, so the format is designed for it now.
