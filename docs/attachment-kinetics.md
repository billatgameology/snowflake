# Attachment kinetics — the physics spec

The attachment rule. This is the **only** step of the update cycle that is physics; everything
else is machinery and lives in [gg-machinery.md](gg-machinery.md).

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
the rim, sitting in richer vapor, keeps growing. **Hollowing is diffusion plus this exponential,
and nothing else.** No hollowing rule, no SDAK, no width term. That is the Phase 4 gate, and it
is reachable without the risky part of this spec.

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
ledger injects mass from nowhere. Four sub-decisions must be settled in writing, in the Phase 2b
plan, before the seam is coded:

1. `f` in `b` under a defined normalization, or a separate dimensionless field — including what
   the answer does to the `AttachmentRule` interface shape (a per-cell accumulator is state);
2. what steps (ii) and (iv) do under `LibbrechtKinetics`;
3. whether exact mass conservation is claimed under `LibbrechtKinetics`, and what test asserts
   whatever is claimed;
4. where `sigma_surf` is read from `d` — before or after step (ii) depletes it — and the
   normalization mapping `d` to the dimensionless σ these equations need.

If the resolution departs from the charter's "reuses the boundary-mass machinery" wording, that
is an ADR (Rule 5).

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

### 4.3 Stability and the diffusion iteration count ⚠ DERIVE, DO NOT GUESS

G-G's diffusion step is a **Jacobi relaxation** toward `∇²σ = 0` (a weighted neighbor average),
not an explicit Euler integration — so it is unconditionally stable *as a smoother*. But once
`Δx` and `D` carry units, **one diffusion pass corresponds to a definite physical time
increment**, and that is what makes the iteration count derivable rather than guessed:

1. Identify the effective `D·Δt_diff / Δx²` implied by G-G's `1/7` and `4/7, 3/14` weights.
   **Derive this from the scheme; it is not stated in the paper in these terms.**
2. That fixes `Δt_diff` — the physical time one diffusion pass represents — given `Δx` and
   `D(T, P)`.
3. The quasi-static approximation (charter §2.4) requires the vapor field to relax over the
   crystal scale `L` *between* growth steps. Relaxation time is `~L²/D`. So the number of
   diffusion iterations per growth step is roughly `n_diff ≈ (L²/D) / Δt_diff`.
4. Cross-check the result against the growth timescale: the field must relax **much faster** than
   the surface moves, or the quasi-static assumption is invalid and the model is wrong in a way
   no metric will announce.

Step 4 is the one to take seriously. If `n_diff` comes out implausible — thousands of iterations
per growth step, or fewer than one — **the units are wrong somewhere**, and that is a genuine
finding, not an inconvenience to be tuned away. Record the derivation in the Phase 2b plan with
its arithmetic shown, so a later model can check it rather than trust it.

## 5. What this rule does *not* model

State these plainly; they are the honest limits of the v1 physics, and they belong in any writeup:

- **Latent heat transport.** Deposition warms the surface; the model ignores it. Inherited from
  G-G, accepted (charter §2.6).
- **Surface diffusion of admolecules** across facets before incorporation. The Ehrlich–Schwoebel
  barrier (charter §2.5) is folded into the measured `A(T)` and `sigma_0(T)` rather than modeled.
- **Sublimation** — attachment remains permanent (gg-machinery §2).
- **Nucleation itself** — the seed is placed, not nucleated (charter §2.2).
