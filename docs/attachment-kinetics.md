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

**Where `f` lives is deliberately unsettled** (2026-07-14 review; this paragraph previously said
"carry it in `b`" — that is one candidate, not a decision). The tempting answer — the existing
boundary-mass field `b`, which is already the quasi-liquid layer (charter §2.2) and is the
charter's own wording ("reuses the boundary-mass machinery") — cannot be adopted by default: `b`
is a **mass ledger** with its own per-tick dynamics (step (ii) freezing deposits into it, step
(iv) melting drains it), while `f` is a **dimensionless fraction**. Read together literally,
"attach at `b ≥ 1`" stops being an implementation of `v_n`, and adding `v_n·Δt/Δx` to a mass
ledger injects mass from nowhere. **Escalated (2026-07-14, decision 0005 D2): the sub-decisions below are now part of a required
surface-operator specification** — one of Phase 2b's two opening deliverables, and **2b is
paused until it exists.** The physical surface condition is a **Robin boundary condition**: the
monograph derives the vapor flux balance and `v_n = alphaHK · v_kin · sigma_surf` *together*
(p. 94). Keeping G–G's `κ` freezing transfer running alongside a separate `v_n` accumulator can
double-count vapor uptake or disconnect vapor loss from ice gain — the operator must couple
them so that vapor lost equals ice gained. The spec defines, as one coupled whole:

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

## 5. What this rule does *not* model

State these plainly; they are the honest limits of the v1 physics, and they belong in any writeup:

- **Latent heat transport.** Deposition warms the surface; the model ignores it. Inherited from
  G-G, accepted (charter §2.6).
- **Surface diffusion of admolecules** across facets before incorporation. The Ehrlich–Schwoebel
  barrier (charter §2.5) is folded into the measured `A(T)` and `sigma_0(T)` rather than modeled.
- **Sublimation** — attachment remains permanent (gg-machinery §2).
- **Nucleation itself** — the seed is placed, not nucleated (charter §2.2).
