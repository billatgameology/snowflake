# Attachment kinetics — the physics spec

The attachment rule — the only **physically parameterized** step of the update cycle; the rest
lives in [gg-machinery.md](gg-machinery.md). (Corrected v1.3, decision 0005: this header
previously said "the only step that is physics," which overstated it — diffusion is physical
too, while `κ`, `μ`, hole-filling, and noise are phenomenological machinery. What is unique
about this step is that its parameters carry physical provenance and units.)

**Source:** K. Libbrecht, "A quantitative physical model of the snow crystal morphology diagram"
(arXiv:1910.09067) — `research/1910.09067v2.pdf`. Primer: arXiv:1211.5555. Monograph:
arXiv:1910.06389.

Decision: [0003](decisions/0003-libbrecht-attachment-kinetics.md). Charter: §2.5.

> **⚠ Symbol ban (charter §3.3).** A bare `alpha` is banned repo-wide, because G-G's `α`
> (a boundary-mass threshold) and Libbrecht's `α` (the Hertz–Knudsen attachment coefficient) are
> unrelated and both conventionally written `α`. In this file, α always means Libbrecht's, and it
> is always written **`alphaHK`** — dimensionless, in [0, 1].

---

## 1. The governing equation

```
v_n = alphaHK · v_kin · sigma_surf
```

| Symbol | Meaning | Units |
|---|---|---|
| `v_n` | outward growth velocity of the surface, normal to the local facet | m/s |
| `alphaHK` | attachment coefficient — the probability an arriving molecule is incorporated | dimensionless, [0, 1] |
| `v_kin(T)` | kinetic maximum velocity — the speed if every arriving molecule stuck | m/s |
| `sigma_surf` | local supersaturation **at the surface**, delivered by the diffusion field | dimensionless |

`alphaHK` is the single most important quantity in this project. `v_kin` and `sigma_surf` are
comparatively boring: `v_kin` is a function of temperature only, and `sigma_surf` is whatever the
vapor field already computed.

## 2. Where `alphaHK` comes from

**Faceted growth is nucleation-limited.** New molecular layers must nucleate as 2D islands on a
flat facet, which gives:

```
alphaHK = A · exp(−sigma_0 / sigma_surf)
```

`A(T)` and `sigma_0(T)` are measured, per facet family. Both go in
[libbrecht-parameters.md](libbrecht-parameters.md).

**This exponential is the most important nonlinearity in the model, and it is why hollowing
works.** It is violently nonlinear in `sigma_surf`: as `sigma_surf → 0`, `alphaHK → 0` far faster
than linearly. So a *modest* sag in supersaturation at a facet center — the Berg effect, which
the diffusion field produces on its own (charter §2.4) — drives `alphaHK` toward zero there while
the rim, sitting in richer vapor, keeps growing. **Hollowing is primarily diffusion plus this
exponential** — no hollowing rule, no SDAK, no width term required by the hypothesis. (Softened
v1.3: whether this mechanism *suffices* at this lattice resolution is exactly what Phase 4
pass B tests — the sentence is the experiment's hypothesis, not a settled fact.) That is the
Phase 4 gate, and it is reachable without the risky part of this spec.

**Basal and prism facets have different coefficients:**

```
alphaHKBasal(T, sigma_surf) = A_basal(T) · exp(−sigma_0_basal(T) / sigma_surf)
alphaHKPrism(T, sigma_surf) = A_prism(T) · exp(−sigma_0_prism(T) / sigma_surf)
```

**The Nakaya diagram is the story of these two trading places.** Where `alphaHKBasal <
alphaHKPrism`, basal faces are reluctant, growth goes sideways, you get a **plate**. Where the
inequality reverses, growth goes up the c-axis and you get a **column**. The non-monotonic flip
across temperature — plates at −2 °C, columns at −5 °C, plates again at −15 °C, columns below
−30 °C — is a *crossing* of `sigma_0_basal(T)` and `sigma_0_prism(T)`.

**Under this rule the habit is an output, not a knob.** That is the whole of decision 0003: G-G
lets you *set* plate-vs-column with `β₀₁/β₂₀`; Libbrecht makes you *predict* it from T. The
second can be wrong. That is why it is worth doing.

**Which facet is a given cell on?** Reuse G-G's boundary configuration `(n_T, n_Z)` — it already
classifies this and costs nothing: `(0,1)` is a flat basal face, `(1,0)` is a flat prism face
([gg-machinery.md](gg-machinery.md) §3). The configuration index survives the switch; it stops
being a *threshold lookup* and becomes a *facet-type classifier*. Mixed and concave configurations
need a documented interpolation policy — **write it down explicitly, do not let it emerge from
whatever the `if`-chain happens to do.**

## 3. SDAK — last, gated, and not load-bearing

Libbrecht's key hypothesis: `alphaHK` also depends on the **width of the facet**. Narrow facets
grow more easily, which makes them narrower, which makes them grow more easily — a positive
feedback producing thin plates, sharpening edges, and needles.

Implementing it requires a **local geometric query over surface cells** to estimate local facet
width each step. Unpublished at this lattice resolution; attackable, not research-hard.

**Provenance (v1.3, decision 0005 — this is the load-bearing caveat):** the SDAK dip locations
were **chosen to impose agreement with the Nakaya diagram** and remain substantially uncertain
(monograph; extraction p. 153). SDAK inputs are provenance class **P3**
([libbrecht-parameters.md](libbrecht-parameters.md)); any Nakaya comparison that uses them is
**in-sample reproduction**, and Phase 6 reports no-SDAK and SDAK runs separately (charter §2.7,
Phase 6).

**Sequence it last and gate it behind the basal/prism split working.** It buys the *extreme*
morphologies — the absurdly thin plates, the needles at the tips of the Nakaya diagram. It does
**not** buy basic hollowing (§2). If SDAK proves intractable, the fallback is `alphaHK(T,
sigma_surf)` without the width term, which still yields a temperature-driven solver, still
reaches the Phase 4 hollowing gate, and still makes Phase 6 falsifiable. **The scary part of this
spec is not on the critical path.** Do not let it become the first thing anyone tries.

## 4. The seam — continuous velocity → discrete lattice ⚠ THE REAL WORK

**This is the substance of Phase 2b, not an implementation detail of it.** G-G's attachment is a
**binary cell flip**. Libbrecht's `v_n` is a **continuous surface velocity**. Converting one into
the other is the actual engineering problem, and it is where physical units enter the model.

### 4.1 Units enter — and this is a gift

The model acquires real dimensions:

| Quantity | Units | Source |
|---|---|---|
| `Δx` — lattice spacing | microns | chosen; sets resolution vs. domain size |
| `Δt` — growth timestep | seconds | **derived**, see 4.3 |
| `D(T, P)` — vapor diffusivity in air | m²/s | [libbrecht-parameters.md](libbrecht-parameters.md) |
| `v_kin(T)` | m/s | same |

The charter previously waved at "run many diffusion iterations per growth step." With units, that
guess becomes a **derived quantity** — this is the concrete payoff, and it is worth more than the
cost of carrying units.

### 4.2 Velocity → attachment: the conversion

A surface advancing at `v_n` for time `Δt` moves forward `v_n · Δt`. A lattice cell of size `Δx`
is filled when that accumulated advance reaches `Δx`. So accumulate a **filled fraction** on each
boundary cell and attach when it saturates:

```
f(x) += v_n(x) · Δt / Δx          # per growth step
attach when f(x) ≥ 1
```

**Where `f` lives — SETTLED 2026-07-15 by §4.4 below** (the surface-operator specification that
this paragraph used to demand; charter v1.3 explicitly delegated the decision to that spec, so
no ADR is required). The answer: a **separate dimensionless field**, not `b` — §4.4 component 4
carries the rationale. The analysis that forced the question stands and is kept for the record:
`b` is a **mass ledger** with its own per-tick dynamics (step (ii) freezing deposits into it,
step (iv) melting drains it), while `f` is a **dimensionless fraction**. Read together
literally, "attach at `b ≥ 1`" stops being an implementation of `v_n`, and adding `v_n·Δt/Δx`
to a mass ledger injects mass from nowhere. The physical surface condition is a **Robin
boundary condition**: the monograph derives the vapor flux balance and `v_n = alphaHK · v_kin ·
sigma_surf` *together* (printed p. 93 / pdf p. 94, Eqs. 3.5–3.10). Keeping G–G's `κ` freezing
transfer running alongside a separate `v_n` accumulator can double-count vapor uptake or
disconnect vapor loss from ice gain — the operator couples them so that vapor lost equals ice
gained. Decision 0005 D2 required the spec to define, as one coupled whole:

1. the `d` → dimensionless-σ normalization, and where `sigma_surf` is sampled (before or after
   which substep);
2. facet classification / local normal estimation (what `(n_T, n_Z)` is trusted for, and where
   it is not enough);
3. vapor flux into the surface cell and ice-volume gain, coupled (the Robin discipline above);
4. the fill state — the deterministic accumulator survives — and where it is stored (`b` under a
   defined normalization, or a separate dimensionless field), including what the answer does to
   the interface shape (a per-cell accumulator is state);
5. the explicit **kept / replaced / disabled** disposition of `κ`, `μ`, melting, and
   hole-filling under `LibbrechtKinetics`, each with a reason — gg-machinery §4's "(ii)/(iv)
   identical under both rules" is exact for `GGThreshold` and is *not assumed* here;
6. the interface: a **surface-operator interface**, wider than a per-cell `shouldAttach` — plus
   the mass-conservation claim made under `LibbrechtKinetics` and the test that asserts it.

**This question is settled — charter §3.2 Phase 2b (v1.2) specifies (a) as the reference
implementation.** Both options stay recorded so the rationale survives the decision:

- **(a) Deterministic accumulation** — as above. **The reference implementation.** Determinism
  is a hard requirement (charter §3.1: deterministic seeds throughout; Phase 5's GPU-vs-oracle
  comparison is meaningless without it), and G-G's noise term already supplies the stochasticity
  that sidebranching needs. Stochasticity enters *only* through that explicit noise term — never
  through stochastic rounding — so randomness stays a single labeled dial.
- **(b) Stochastic attachment** — attach with probability `p = v_n·Δt/Δx`. **Rejected.** Tempting
  because it supplies noise for free, but it entangles the symmetry-breaking source with the
  attachment rule, meaning you can no longer turn noise off to run the symmetry gate. It also
  makes the oracle-vs-GPU comparison a statistical exercise rather than a tolerance check.

Departing from (a) now contradicts the charter: that takes an ADR (Rule 5), not a code comment.

### 4.3 Quasi-static numerics and the two timescales — REWRITTEN v1.3 (decision 0005 D3)

This section previously assigned a physical time increment to each Jacobi sweep and derived an
iteration count from it. That mixed two different models — **transient diffusion** (stability
timesteps, physical substeps) and **quasi-static diffusion** (an elliptic solve to a residual
tolerance) — and produced a wrong test: relaxation counts scale like `(L/Δx)²`, so *thousands of
Jacobi iterations per growth step are entirely expected* and prove nothing about units.
**Retracted.**

The formulation, per rule:

- **`GGThreshold`:** diffusion is G–G's single masked-average pass per tick, exactly as
  published. That *is* their dynamics — machinery fidelity, no physical-time claim attached.
- **`LibbrechtKinetics`:** the field is quasi-static. Between growth steps, iterate the smoother
  (Jacobi is the baseline; accelerated elliptic solvers are permitted later) until a stated
  **residual norm** (e.g. relative max-residual of the discrete Laplacian with the surface
  condition applied) falls below a stated **tolerance**, with convergence tests in the suite.
  The iteration count is an *output*, not a target.

Physical time enters only through the interface update, with its own bounds:

- **fill-CFL:** `v_n·Δt/Δx` bounded below 1 — and small enough that per-step shape change is
  sub-cell. This, not the diffusion sweep count, is where `Δt` lives.
- **Quasi-static validity check** (kept from the old text — it was the one right part): the
  field must relax much faster than the surface moves. Relaxation `~L²/D` against growth `~L/v_n`
  gives the Péclet-like condition `v_n·L/D ≪ 1`. Evaluate it with the extracted `v_kin`, the
  measured `alphaHK` ranges, and `D(T, P)` across the target regimes; where it fails, the
  quasi-static model is invalid *there*, and that is a finding to report, not a nuisance to tune
  away. Record the arithmetic in the Phase 2b plan so a later model can check it rather than
  trust it.

## 4.4 The surface-operator specification (decision 0005 D2 — Phase 2b opening deliverable)

**Written 2026-07-15. Type: specification; Evidence: unvalidated** (§1.5 v1.3 taxonomy — this
section is a design with cited physics, not a validated model; every claim below is falsifiable
by the tests it names). Sources: monograph printed pp. 92–93 / pdf 93–94 (Eqs. 3.5–3.10, the
flux balance and mixed boundary condition), monograph Table 2.1 (printed p. 57 / pdf 58),
arXiv:1910.09067 Eqs. 1–4. Parameters: [libbrecht-parameters.md](libbrecht-parameters.md).

**The operator in one paragraph.** Under `LibbrechtKinetics` one growth step is: (1) relax the
supersaturation field to a stated residual tolerance with the Robin condition at the crystal
surface and fixed-σ Dirichlet at the far shell; (2) read `sigma_surf` per boundary cell from
the converged field; (3) classify each boundary cell's facet type from `(n_T, n_Z)` and compute
`v_n = alphaHK · v_kin · sigma_surf`; (4) advance the fill state `f += v_n·Δt/Δx`, attach cells
reaching `f ≥ 1` (simultaneously, from start-of-step state); (5) settle the ledger — ice gained
is debited against the metered far-field source. This replaces G–G steps (i)–(iv) **as one
coupled whole** under `LibbrechtKinetics`; under `GGThreshold` the four published steps run
exactly as in Phase 2a, bit-identical, behind the same interface.

### Component 1 — `d` → σ normalization, and where `sigma_surf` is sampled

Under `LibbrechtKinetics` the per-cell vapor field **is the dimensionless supersaturation**:
`d(x) ≡ sigma(x) = (c(x) − c_sat(T)) / c_sat(T)` (the paper's definition, arXiv:1910.09067
p. 3). No separate normalization step exists because the field is stored normalized.
Consequences, each deliberate:

- **The G–G smoother is reused unchanged.** The diffusion stencil is linear, and σ is an
  affine transform of number density `c`; a masked average of an affine transform equals the
  affine transform of the masked average. The machinery certified in Phase 2a is exactly the
  relaxation kernel (component 3 modifies only the *surface* substitution).
- **Initialization:** `sigma = sigma_infinity` uniformly; the Dirichlet far shell holds
  `sigma_infinity` (charter §2.4: Libbrecht's measurements and Nakaya coordinates assume a
  *maintained* far field). `sigma_infinity` is a run input in [0, sigma_water(T)] — the
  physically meaningful ceiling is supersaturation relative to liquid water, Table 2.1.
- **Sampling point:** `sigma_surf(x)` is the converged field value **at the boundary cell
  itself**, read after relaxation and before the interface update. There is no "before or
  after step (ii)" ambiguity because no step (ii) exists under this rule (component 5): vapor
  uptake happens only inside the relaxation's Robin condition.
- **Reflecting far field is diagnostic-only under this rule.** A quasi-static solve with
  reflecting outer walls and an absorbing crystal has only the fully-depleted steady state
  (`sigma → 0` everywhere): no physical growth claim can be made from it. It remains available
  for machinery tests (symmetry of the operator, determinism), never for physics. This is not
  a change to Phase 2a, whose G–G dynamics with reflecting walls is the published model.

### Component 2 — facet classification from `(n_T, n_Z)`

Nucleation-limited kinetics (`alphaHK = A·exp(−sigma_0/sigma_surf)`) applies to **perfect
facets**; step and kink sites incorporate admolecules essentially barrier-free (the paper's
molecularly-rough limit, `alphaHK ≈ 1`, arXiv:1910.09067 pp. 3–4). The boundary configuration
already distinguishes these — the classifier is a policy table, not an `if`-chain accident:

| `(n_T, n_Z)` | Reading | `alphaHK` |
|---|---|---|
| `(0,1)` | flat basal face | `alphaHKBasal(T, sigma_surf)` |
| `(1,0)` | flat prism face | `alphaHKPrism(T, sigma_surf)` |
| all others (`n_T ≥ 2`, or `n_T ≥ 1` and `n_Z ≥ 1`) | step/kink/concave site | `1` (rough) |
| raw `n_T ≥ 4` and `n_Z ≥ 1` | interior void | attach immediately (kept, see component 5) |

The third row is the **mixed-configuration interpolation policy** the plan's Open questions
demanded: sites with more than one attached neighbor sit at terrace steps or concave corners,
where no 2D nucleation barrier exists — the physical reading of G–G's own monotonicity
assumption (§7 of gg-machinery: more concave catches more readily). SDAK (facet-width
dependence) is deliberately absent here; when it lands (last, gated), it modifies rows 1–2 via
a local facet-width query and touches nothing else.

### Component 3 — vapor flux and ice gain, coupled (the Robin condition)

Continuous statement (monograph Eqs. 3.7–3.10): diffusive resupply equals kinetic uptake,
`X_0 · (∂σ/∂n)_surf = alphaHK · sigma_surf`, where `X_0(T, P) = (c_sat/c_ice) · D / v_kin` is
the kinetic length (Table 2.1: `X_0 ≈ 0.145 µm` in air at −15 °C, 1 atm). Growth then follows
`v_n = alphaHK · v_kin · sigma_surf` — the same equation system, never two mechanisms.

Discrete scheme: during relaxation, a boundary cell's stencil term pointing at an attached
face is replaced not by the cell's own value (G–G reflecting) but by a **partial reflection**:

```
sigma_face = sigma(x) · (1 − s_eff),   s_eff = s / (1 + s),   s = alphaHK(x) · Δx / X_0
```

Limits anchor it: `alphaHK → 0` recovers G–G's reflecting substitution exactly (a non-growing
facet is a wall); `alphaHK·Δx/X_0 → ∞` gives a perfect absorber (`sigma_face → 0`, fully
diffusion-limited). `s_eff = s/(1+s)` keeps the substitution stable for any `s > 0` (`Δx` is
expected to be of order `X_0` or larger, so `s > 1` is the normal regime, not an edge case).

**No separate freezing transfer exists** — the Robin substitution is the *only* vapor sink,
which is what makes double-counting structurally impossible (ADR 0005's disease). Ice gain is
computed from the converged field via Hertz–Knudsen (component 4), and the **consistency test**
is the divergence identity of the converged solve: net influx through the Dirichlet shell
(computed from field gradients) must equal the sum of surface sinks (computed from
`alphaHK·sigma_surf`) to a stated relative tolerance. A solve that fails the identity is not
converged, whatever its residual norm says.

### Component 4 — the fill state `f`

**`f` is a separate dimensionless Float64 field.** It is NOT stored in `b`. Rationale:

- `b` is a mass ledger with G–G dynamics (freeze/melt); `f` is a geometric fraction with
  Libbrecht dynamics. One array with two meanings under two rules is the field-level version
  of the bare-α conflation this repo bans (Rule 7's spirit).
- `b` stays exclusively `GGThreshold`'s, so the control-group rule remains bit-identical
  behind the shared interface — the 2b plan gate demands exactly that.
- The checkpoint format gains `f` as a per-field entry for `LibbrechtKinetics` runs (the
  header already carries per-field dtype by design; a format version bump, made before any
  Phase 6 freeze).

Charter note: v1.3 explicitly delegated this decision to this spec ("v1.2's 'reuses the
boundary-mass machinery' was one candidate answer, not a decision") — choosing the separate
field therefore contradicts nothing and needs no ADR. The quasi-liquid layer language of
charter §2.2 is honored where the physics actually lives in this rule: premelting effects are
folded into the *measured* `sigma_0(T)`/`A(T)` (§5), not into a simulated mass pool.

Update rule, per growth step, simultaneous across the boundary (start-of-step `(n_T, n_Z)` and
field): `Δf = min(v_n·Δt/Δx, 1 − f)` — truncated at saturation so the ledger never overdraws;
the sub-cell placement error this truncation introduces is bounded by the fill-CFL bound and
recorded. `v_n` is clamped at 0 from below (no sublimation — gg-machinery §2's permanence rule
survives; a negative `sigma_surf` grows nothing rather than un-growing something). On attach:
`a = 1`, `f` frozen at 1 for bookkeeping, cell leaves the vapor domain (`sigma = 0`
internally, excluded from the solve), neighbors' configurations update next step.

**Ledger.** Ice gained per step, in vapor-ledger units, is `M_ice(T) · Σ Δf` with
`M_ice = c_ice / c_sat(T)` (Table 2.1 supplies both densities; ≈ 6.7×10⁵ at −15 °C). The
far-field Dirichlet shell is a **metered source**: every clamp during relaxation accumulates
its injected/removed amount. The conservation claim under `LibbrechtKinetics` is therefore an
**accounting identity, not a Σ(b+d) invariant**: ice gained = metered source − field content
change, exact in ledger arithmetic (asserted), while the *physical* consistency of the solve is
the divergence identity of component 3 (asserted to tolerance). Anyone expecting the Phase 2a
mass invariant here has mixed up the rules: G–G's invariant is a reflecting-boundary property
of a mass field; this rule's field is a quasi-static potential with an explicit source.

### Component 5 — disposition of the G–G machinery under `LibbrechtKinetics`

| Mechanism | Disposition | Reason |
|---|---|---|
| step (i) single diffusion pass | **replaced** — same kernel, iterated to residual tolerance (quasi-static solve; ADR 0005 D3) | the field is elliptic under this rule; one pass is a G–G-fidelity choice, not physics |
| step (ii) freezing (`κ`) | **replaced** by the Robin substitution (component 3) | a second uptake channel double-counts vapor |
| step (iii) threshold attachment | **replaced** by the fill rule (component 4) | this is the seam itself |
| step (iv) melting (`μ`) | **disabled** | sublimation is not modeled (gg-machinery §2); `μ`'s smoothing role was phenomenological — if a smoothing dial is ever needed it enters as a labeled, documented dial, not as an inherited default |
| hole-filling (raw `n_T ≥ 4`, `n_Z ≥ 1`) | **kept** | geometric hygiene against discretization voids, now also physically consistent (max-coordination kink sites have no barrier). Answering the plan's open question: it survives, so interior voids remain interpretable as physics, not artifacts |
| noise (gg-machinery §6) | **redefined for this rule** | §6's diffusion-slowdown perturbs a *mass* pass, which no longer exists. Under this rule noise is a per-cell multiplicative slowdown of the interface update, `v_n → (1 − ξ)·v_n`, `ξ ∈ {0, ε}` from the counter PRNG (own stream id), applied per growth step. Default off; labeled dial; provenance class P4. The gate stays noise-off |
| drift `φ` | **unsupported (error if set)** | all §8 presets have `φ = 0`; a drift term inside a quasi-static solve is a different physical statement that nobody has specified |

### Component 6 — the interface, and the tests that hold it together

```ts
interface SurfaceOperator {
  /** Field relaxation for one growth step. GGThreshold: exactly one published masked pass.
      LibbrechtKinetics: iterate to the stated residual tolerance; returns iterations,
      residual achieved, divergence-identity residual, metered source total. */
  relaxField(state: SolverState): RelaxationReport;
  /** The surface exchange: freezing/attachment/melting under GGThreshold (bit-identical to
      Phase 2a); classification, v_n, fill update, attachment under LibbrechtKinetics.
      Owns per-cell surface state (f). Attachment is simultaneous from start-of-step state. */
  advanceSurface(state: SolverState): SurfaceReport;
  /** The rule's conservation claim, measurably: GGThreshold reports the Sigma(b+d) drift;
      LibbrechtKinetics reports the ledger identity and divergence residual. */
  ledger(): LedgerReport;
}
```

The old `AttachmentRule.shouldAttach` sketch is superseded (it could not own state or mediate
mass, exactly as the plan predicted). Tests the spec commits to, before any habit claim:

1. **Bit-identity:** `GGThreshold` behind `SurfaceOperator` reproduces every Phase 2a gate
   bit-identically (pinned engine). This is the refactor gate — no physics lands before it.
2. **Robin limits:** with `alphaHK ≡ 0` everywhere, the relaxation is G–G's reflecting pass
   (bitwise); with `alphaHK ≡ 1` and `Δx/X_0 → large`, boundary cells relax toward 0.
3. **Divergence identity** on converged solves, tolerance stated in the test.
4. **Ledger identity** exact in ledger arithmetic; metered-source accounting reported.
5. **Fill-CFL:** the chosen `Δt` keeps `max Δf` under the stated bound (default 0.1) for the
   run's `v_kin(T)·sigma_infinity`; asserted during runs, recorded in checkpoints.
6. **Quasi-static validity (Péclet):** `v_n·L/D ≪ 1` evaluated with extracted numbers per run
   regime; where it fails, the run is labeled invalid-as-physics. Worked arithmetic in the
   Phase 2 plan (Stage 2b steps).

## 5. What this rule does *not* model

State these plainly; they are the honest limits of the v1 physics, and they belong in any writeup:

- **Latent heat transport.** Deposition warms the surface; the model ignores it. Inherited from
  G-G, accepted (charter §2.6).
- **The Gibbs–Thomson effect** (added 2026-07-15 with §4.4). Curvature raises the equilibrium
  vapor pressure; the monograph calls it minor and calculable (`d_sv ≈ 1 nm`, Appendix A) and
  uses it in the SDAK edge argument. v1 omits the curvature correction to `sigma_surf` —
  relevant mostly at sharp edges under high σ, i.e. exactly the SDAK regime, so it is
  revisited if and when SDAK lands, not before.
- **Surface diffusion of admolecules** across facets before incorporation. The Ehrlich–Schwoebel
  barrier (charter §2.5) is folded into the measured `A(T)` and `sigma_0(T)` rather than modeled.
- **Sublimation** — attachment remains permanent (gg-machinery §2).
- **Nucleation itself** — the seed is placed, not nucleated (charter §2.2).
