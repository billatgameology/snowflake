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

**The intended test is whether habit becomes an output rather than a knob.** That is the whole
of decision 0003: G-G lets you *set* plate-vs-column with its qualified attachment-threshold
ratio; LibbrechtKinetics is meant to *predict* it from T. Protocol v3 did not demonstrate that:
both registered temperatures reached the same one-layer plate at the measurement size. A
prediction can be wrong, but Phase 2b still requires two temperature-conditioned habits.

**Which facet is a given cell on?** Protocol v3 reused G-G's boundary configuration
`(n_T, n_Z)` through the explicit policy in component 2. That made the choice auditable, but a
post-result primary-source check found that the chosen mapping was not the monograph's mapping:
v3 treated `(1,0)` as prism and `[20]` as rough, while the source identifies `[20]` as the prism
facet and `[10]` as a weak isolated tip. The v3 table is preserved below as the executed
contract, not endorsed as the forward classifier. Mixed and concave configurations still need
an explicit policy — **write it down; do not let it emerge from an `if` chain.**

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

The charter previously waved at "run many diffusion iterations per growth step." Units instead
make the **interface timestep** a derived quantity through the fill-CFL; the number of elliptic
relaxation sweeps is a convergence output, never a physical-time derivation (§4.3).

### 4.2 Velocity → attachment: the conversion

A surface advancing at `v_n` for time `Δt` moves forward `v_n · Δt`. A lattice cell of size `Δx`
is filled when that accumulated advance reaches `Δx`. So accumulate a **filled fraction** on each
boundary cell and attach when it saturates:

```text
f(x) += alphaHK · v_kin · sigma_b · Δt / (H_b · Δx)    # per growth step
attach when f(x) ≥ 1
```

*(Forward formula corrected by decision 0009 after the v3 source audit. The selected surface
policy supplies the aggregate boundary value and geometry; aggregate v4 and v5 use the
cited `G_b = H_b = 1` on `[01]` and `[20]` and a labeled P4 unit extension elsewhere.
Decision 0006's per-contact expression remains the executed `legacy-v3` formula. §4.4
components 3–4 are governing; this section is the pedagogical intro.)*

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
disconnect the two sides. The continuous equations are one coupled system; in the discrete
operator the claims are deliberately separated (decisions 0006 and 0009): **exact bookkeeping** is
`placed fill + saturationClippedFill = computed geometry-adjusted per-boundary-pixel Hertz–Knudsen kinetic demand`, where
the clipping term is unapplied numerical excess, while numerical surface exchange versus that
demand form is a measured discretization diagnostic, never asserted equal.
Decision 0005 D2 required the spec to define, as one coupled whole:

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
   the exact kinetic-demand bookkeeping claim, solve-quality claim, and tests that assert them.

**This question is settled — charter §3.2 Phase 2b (v1.2) specifies (a) as the reference
implementation.** Both options stay recorded so the rationale survives the decision:

- **(a) Deterministic accumulation** — as above. **The reference implementation.** Determinism
  is a hard requirement (charter §3.1: deterministic seeds throughout; Phase 5's GPU-vs-oracle
  comparison is meaningless without it). Branches exist deterministically in G-G's published
  3D results; the optional labeled noise dial supplies natural asymmetry when requested. It slows
  G-G diffusion under `GGThreshold` and `alphaHK` under `LibbrechtKinetics`, never attachment by
  stochastic rounding.
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
- **`LibbrechtKinetics`:** the field is quasi-static. For fixed-σ Dirichlet physics runs,
  between growth steps iterate the smoother
  (Jacobi is the baseline; accelerated elliptic solvers are permitted later) until a stated
  **residual norm** (e.g. relative max-residual of the discrete Laplacian with the surface
  condition applied) falls below a stated **tolerance** AND the **policy-versioned divergence identity** of the
  solve is under its own stated tolerance — convergence is DUAL *(decision 0006, synced here
  round-5: this bullet previously stated the residual alone, which was measured passing
  fields whose shell-vs-sink imbalance grew with domain size)* — with convergence tests in
  the suite. Under aggregate v5, the identity is
  `|shell injection + float64 smoother drift − boundary exchange| / |boundary exchange|`;
  the drift is independently metered before boundary replacement and clamp, and is zero in exact
  arithmetic (decision 0013). Legacy-v3 and aggregate-v4 retain their executed two-term identity.
  The reflecting mode is diagnostic-only: it has no far-field injection and therefore
  makes no divergence-identity claim; there convergence is residual-only. The iteration count is
  an *output*, not a target.

Physical time enters only through the interface update, with its own bounds:

- **fill-CFL:** the per-cell kinetic fill increment
  `alphaHK·v_kin·sigma_b·Δt/(H_b·Δx)` under the recorded forward surface policy, bounded
  below 1 *(aggregate boundary-pixel geometry, decision 0009; the per-contact v3 form is
  historical)* — and small enough
  that per-step shape change is sub-cell. This, not the diffusion sweep count, is where `Δt`
  lives.
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

**The operator in one paragraph** *(forward policy synced 2026-07-16 to decision 0009; the
per-contact protocol-v3 operator remains documented below as immutable history)*. Under
`LibbrechtKinetics` with fixed-σ Dirichlet, one physics growth step is: (1) apply the certified
reflecting smoother and replace each boundary-pixel value with the self-consistent aggregate
condition `sigma_b = sigma_opp/(1 + alphaHK·G_b·Δx/X_0)`, iterating until BOTH the field
residual and the divergence identity are under their stated tolerances, then hold the far shell
at fixed σ; (2) classify the boundary pixel from raw `(n_T,n_Z)` under the checkpointed surface
policy—`[01]` basal, `[20]` prism, `[10]` inhibited in aggregate v4 and v5; (3) use the same
converged `(alphaHK,sigma_b)` pair to advance the
pixel's fill by `alphaHK·v_kin·sigma_b·Δt/(H_b·Δx)`, with the source's `G_b = H_b = 1` on
both primary facets and a labeled P4 unit extension elsewhere; (4) attach cells reaching
`f ≥ 1` simultaneously from start-of-step state and record any saturation-clipped excess;
(5) settle the ledger—`placed fill + recorded clipping` equals the computed
geometry-adjusted per-boundary-pixel Hertz–Knudsen demand exactly. Clipping is unapplied
numerical excess and shell-clamp totals are numerical diagnostics, never physical uptake or a
mass claim. This replaces G–G steps (i)–(iv) **as one coupled whole** under
`LibbrechtKinetics`; under `GGThreshold` the four published steps run exactly as in Phase 2a,
bit-identical, behind the same interface. Reflecting LK is a residual-only diagnostic and omits
the divergence identity from step (1).

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
  *maintained* far field). The runtime requires a finite positive `sigma_infinity`. Table 2.1's
  supersaturation relative to liquid water is a useful source-side plausibility reference,
  **not a normative runtime ceiling in v1**: the available fit-difference expression becomes
  negative near −1 °C and no cited continuous ceiling interpolation has been adopted
  (`docs/libbrecht-parameters.md`, “Known source inconsistency”). The registered −5/−15 °C
  runs remain in the positive, source-tabulated regime; no code or evidence reader may claim
  it enforced `sigma_water(T)` until a cited interpolation/domain decision is added.
- **Sampling point (forward policy, decision 0009):** `sigma_surf` is the aggregate boundary
  value `sigma_b` solved self-consistently from the mean of opposing vapor pixels
  (`sigma_opp`, component 3). The same cached `(alphaHK,sigma_b)` pair defines the boundary
  condition and `v_n`; signed relaxation exchange remains a separate diagnostic. The
  legacy-v3 inward ghost called `sigma_face` is not reused or
  silently renamed. Read after relaxation, before the interface update. There is no "before
  or after step (ii)" ambiguity because no G–G freezing step exists under this rule
  (component 5).
- **Reflecting far field is diagnostic-only under this rule.** A quasi-static solve with
  reflecting outer walls and an absorbing crystal has only the fully-depleted steady state
  (`sigma → 0` everywhere): no physical growth claim can be made from it. It remains available
  for machinery tests (symmetry of the operator, determinism), never for physics. This is not
  a change to Phase 2a, whose G–G dynamics with reflecting walls is the published model.

### Component 2 — facet classification from `(n_T, n_Z)`

Nucleation-limited kinetics (`alphaHK = A·exp(−sigma_0/sigma_surf)`) applies to **perfect
facets**; step and kink sites incorporate admolecules essentially barrier-free (the paper's
molecularly-rough limit, `alphaHK ≈ 1`, arXiv:1910.09067 pp. 3–4). The boundary configuration
was mapped as follows in protocol v3 — the classifier was a policy table, not an `if`-chain
accident:

| `(n_T, n_Z)` | v3 reading | v3 `alphaHK` |
|---|---|---|
| `(0, n_Z ≥ 1)` | flat basal face — *(amended at implementation, 2026-07-15: originally `(0,1)` only, which left `(0,2)` — a cell between two perfect basal faces, still nucleation-limited — with no row)* | `alphaHKBasal(T, sigma_surf)` |
| `(1,0)` | flat prism face *(v3 interpretation; rejected for forward use below)* | `alphaHKPrism(T, sigma_surf)` |
| all others (`n_T ≥ 2`, or `n_T ≥ 1` and `n_Z ≥ 1`) | step/kink/concave site *(v3 interpretation; rejected for `[20]` below)* | `1` (rough) |
| raw `n_T ≥ 4` and `n_Z ≥ 1` | interior void | attach immediately (kept, see component 5) |

**Post-v3 source-audit finding (2026-07-16): this table is rejected for forward use, but remains
the exact v3 contract.** In monograph arXiv:1910.06389v2's `[HV]` notation, `H` is the in-plane
attached count and `V` the vertical count (Figure 5.26). It identifies `[01]` as basal (printed
p. 205) and `[20]` as prism; it then suggests `alphaHK = 0` for isolated `[10]` tips and
`alphaHK = 1` for `[30]`, `[40]`, `[21]`, etc. kink-dominated sites (printed p. 206).
The later `G_b`/`H_b` prose prints “`[10]` (basal facet)” (printed pp. 208–209), but that token
conflicts with Figure 5.26, the explicit `[01]`/`[20]` classification, the isolated-tip paragraph,
and the source's later return to “`[01]` and `[20]` facet surfaces” (printed p. 209). Decision
0009 explicitly treats those two tokens as `[01]` typos; this paragraph records the audit path.

The same source also sets the facet geometry factors `G_b = 1` for `[20]` in the Eq. 5.34
boundary condition and `H_b = 1` for `[20]` in the Eq. 5.36 fill update (printed pp. 208–209).
V3's per-attached-face formula instead gives `[20]` aggregate fill factor
`(2/3)·2 = 4/3`; its Robin stencil likewise represents the two contacts separately. The source
uses a different boundary-pixel/normal discretization, so the source observation alone did not
authorize a silent formula swap. Decision 0009 resolved the conflict at the governing level:
forward v4 adopts the aggregate `G_b=H_b=1` boundary-pixel rule and amends the charter, while
the classifier-only/per-contact alternative is rejected for Phase 2b-closing use.

The mismatch is load-bearing. An ad hoc canonical-seed audit (probe not retained) counted 38
`[01]`, 12 `[20]`, and 6 `[10]` boundary cells. V3 therefore assigned
temperature-independent `alphaHK = 1` to all 12 straight prism-facet cells from step zero, while
`alphaHKPrism` controlled only the six `[10]` sites. Among final unattached boundary cells in the
−15 °C checkpoint, maximum partial fill by those classes was 1.079e-4 (`[01]`), 0.0716
(`[20]`), and 5.90e-11 (`[10]`);
the maximum at `[30]` was 0.645. This diagnostic supports rough-path domination, while the
gate result itself establishes only identical final attached morphology for the pinned v3 run.

**Aggregate surface policy adopted 2026-07-16 by decision 0009.** Aggregate v4 and v5 validate raw
integer `n_T in [0,6]`, `n_Z in [0,2]`, rejects non-boundary `[00]`, and applies this exhaustive
nearest-neighbor closure:

| Configuration | Kinetic class | Provenance |
|---|---|---|
| `[01]` | basal | source-explicit broad-facet family |
| `[02]` | basal | P4 extension of the basal family |
| `[10]` | inhibited (`alphaHK = 0`) | source-suggested isolated-tip simplification |
| `[20]` | prism | source-explicit broad-facet family |
| `[21]`, `[30]`, `[40]` | rough (`alphaHK = 1`) | source-explicit kink-dominated examples |
| every other valid nonzero `[HV]` | rough (`alphaHK = 1`) | P4 nearest-neighbor closure |

The hole-fill predicate `n_T >= 4 && n_Z >= 1` remains a separate geometric attachment mode.
It does not alter the kinetic class or enter the fill-CFL. This policy is source-constrained,
not source-faithful: raw counts do not implement the source's nonlocal signed-terrace
classification.

Checkpoint provenance covers the coupled policy, not only this table. Version-1 LK headers
must omit the field and decode as implicit `legacy-v3`; version 2 requires recognized
`surfacePolicy`, and every new solver/write/gate uses version 2. LK resume does not exist today.
The v4 pre-registration is committed before every two-temperature morphology probe.

Decision 0009 also resolves the adjacent geometry conflict by replacing the forward
per-contact rule with the source's aggregate `G_b = H_b = 1` primary-facet convention
(component 3). At `sigma_opp = 0.002`, the independently recomputed necessary broad-facet
demand ratios are 4.866678 prism/basal at −5 °C and 54.587910 basal/prism at −15 °C. These
are necessary coefficient-ordering checks, not habit margins; rough sites remain outside them.

The original third row was the v3 **mixed-configuration interpolation policy**: it assumed that
every site with more than one attached neighbor sat at a terrace step or concave corner where no
2D nucleation barrier exists. The source audit disproved that assumption for `[20]`. A fuller
facet-vicinal model would use the monograph's signed terrace distances to distinguish upper
terraces from nearby kink sites, but that larger nonlocal model is not automatically required
for the nearest-neighbor v4 policy. SDAK remains deliberately absent and must not be enabled as
a post-result rescue knob.

### Component 3 — vapor flux and ice gain, coupled (the Robin condition)

Continuous statement (monograph Eqs. 3.7–3.10): diffusive resupply equals kinetic uptake,
`X_0 · (∂σ/∂n)_surf = alphaHK · sigma_surf`, where `X_0(T, P) = (c_sat/c_ice) · D / v_kin` is
the kinetic length (Table 2.1: `X_0 ≈ 0.145 µm` in air at −15 °C, 1 atm). Growth then follows
`v_n = alphaHK · v_kin · sigma_surf` — the same equation system, never two mechanisms.

**Aggregate discrete scheme (v4/v5, decisions 0009 and 0013).** For each attached-neighbor
direction `d` of boundary pixel `x`, the cell at `x-d` is nominated as an opposing pixel.
Eq. 5.35's mask retains unique active unattached vapor pixels; `sigma_opp` is their arithmetic
mean, or zero when the mask is empty. A primary `[01]` or `[20]` pixel has exactly `H+V`
opposing vapor pixels, as the source states. The partial/empty-mask rule is a P4 closure for
concave lattice configurations.

The boundary value is the residual-verified nonlinear solution

```text
sigma_b = sigma_opp / (1 + alphaHK(sigma_b) · G_b · Δx/X_0)
```

with `G_b = 1` for `[01]` and `[20]` from monograph Eq. 5.34 and `G_b = 1` elsewhere under
the monograph's explicitly tentative simple geometry (printed p. 209), provenance P4. One
relaxation sweep applies the certified Phase 2a reflecting smoother, replaces boundary pixels
by this aggregate value, then clamps the Dirichlet shell. The replacement delta at one pixel may
have either sign: low tangential neighbors can make the reflecting candidate smaller than
`sigma_b`. Because σ is a potential, that signed local delta is relaxation redistribution, not
physical uptake, and is never clamped or deposited. The globally summed
`surfaceExchangeDiagnostic` is the net numerical boundary exchange; the convergence identity
for aggregate v5 compares that signed total with far-shell injection plus the independently
metered signed float64 reflecting-smoother drift. Exact arithmetic makes the drift zero; it is a
numerical diagnostic, not uptake, and may not be inferred from the other terms (decision 0013).
Executed aggregate v4 compares the two original terms. The gate requires source and exchange
positive on its positive-demand runs. The nonnegative physical kinetic demand remains the
separate `alphaHK·v_kin·sigma_b/(H_b·Δx)` ledger quantity; no equality with the relaxation
diagnostic is promised. An unequal-neighbor negative control pins this distinction. The last
accepted sweep caches the identical `(alphaHK,sigma_b)` pair for the interface update.

At `alphaHK = 0`, the aggregate condition becomes `sigma_b = sigma_opp`: no kinetic sink or
growth. This includes nonpositive `sigma_opp` produced by decision 0011's density-conserving
temperature transform. The signed supersaturation potential is preserved, never clamped to
zero; the no-sublimation production law instead sets `alphaHK = 0`, so kinetic demand remains
zero. It does not claim that one transient v4 sweep on a nonuniform field is bitwise identical
to GG's reflecting pass. The permanent `GGThreshold` control remains bit-identical; the v4
limit is tested directly against the aggregate equation and a uniform zero-sink fixed point.

**Executed legacy-v3 discrete scheme (history, not forward use).** During v3 relaxation, a
boundary cell's stencil term pointing at an attached face was replaced not by the cell's own
value (G–G reflecting) but by a partial reflection:

```
sigma_face = sigma(x) · (1 − s_eff),   s_eff = s / (1 + s),   s = alphaHK(x) · Δx / X_0
```

Legacy limits anchored it: `alphaHK → 0` recovers G–G's reflecting substitution exactly (a non-growing
facet is a wall); `alphaHK·Δx/X_0 → ∞` gives a perfect absorber (`sigma_face → 0`, fully
diffusion-limited). `s_eff = s/(1+s)` keeps the substitution stable for any `s > 0` (`Δx` is
expected to be of order `X_0` or larger, so `s > 1` is the normal regime, not an edge case).

**Legacy-v3 audit correction, 2026-07-15 (round-2 review blocker 3, re-corrected round-3 blocker 1): one
`sigma_face` feeds both sides, growth is PER FACE with the hexagonal-prism geometry factors,
and the flux claims are scoped to what is actually exact.**

- **One `(alphaHK, sigma_face)` pair.** Solved self-consistently per boundary cell (damped
  fixed point of `sigma_face = sigma_cell/(1 + alphaHK(sigma_face)·Δx/X_0)`, deterministic,
  order-free, residual-verified); drives the Robin substitution *and* the interface update.
  With noise on, the per-cell `(1 − ξ)` factor multiplies `alphaHK` **in both places** for
  the same tick (round-3: noising growth but not the sink silently split the coupling).
- **Face geometry (round-3 blocker 1a).** The cell is a hexagonal prism with across-flats =
  height = `Δx`: volume `(√3/2)·Δx³`, basal face area `(√3/2)·Δx²`, prism face area
  `(1/√3)·Δx²`. A basal face advancing at `v_n` fills a cell in `Δx/v_n`; a prism face in
  `(3/2)·Δx/v_n`. Fill is therefore **summed per attached face**:
  `Δf = [(2/3)·n_T + n_Z] · alphaHK·v_kin·sigma_face·Δt/Δx`. The first implementation's
  uniform `v_n·Δt/Δx` overdrove lateral growth by 50% — directly biasing the habit gate.
- **What is exact, and what is first-order (round-3 blocker 1b/1c — the previous "one number
  by construction at any Δx/X_0" claim overstated):** the **ledger** records *exactly* the
  computed per-face Hertz–Knudsen kinetic demand as placed fill plus unapplied saturation
  excess (component 4) — that is bookkeeping and is tested non-tautologically. The **field
  sink** is a first-order-consistent discretization of the same Robin condition: its stencil
  substitutions act on the operator's own substep fields with the diffusion weights, so the
  per-face absorbed quantity is not algebraically identical to `alphaHK·sigma_face` at
  finite `Δx/X_0`. The sink-vs-kinetic-demand ratio is a **computed diagnostic** *(round-4
  review: the previous sentence here called it "reported" while nothing in the repo computed
  it)*: the committed test `solver-cpu/test/lk-solver.test.ts`
  ("sink-vs-kinetic-demand diagnostic") recomputes the converged-field per-sweep kinetic demand outside the solver and
  divides the last sweep's actual Robin absorption by it — **measured 0.98922–1.01290**
  over 80 growth steps at its pinned configuration (hexPrism 24×24×14, −5 °C,
  `sigma_infinity = 0.01`, Δx = 0.35 µm, `CAK_A1`, seed 1; command `npm test`), values
  pinned in the test. At the gate resolution (96³) the round-3 audit measured
  0.95879–1.01266 for the same effect — an audit probe, attributed as such, not reproduced
  by a committed run. A discretization diagnostic, never claimed as 1. **Scope (round-5
  review):** the ratio observes the SINK side against the shared per-face kinetic-demand form — it
  never reads the ledger or `advanceSurface`, so ledger defects (e.g. silent clipping) do
  not move it. Component 4's independent demand-bookkeeping test covers placed fill plus
  unapplied clipping. Together the tests separately check sink discretization and demand
  bookkeeping; they do **not** assert that field sink equals deposited growth.
  For fixed-σ Dirichlet runs, the solve-quality statement is the divergence identity, which is
  **now part of the convergence criterion itself** (round-3 blocker 3: iterate-change alone reported
  "converged" fields whose shell-vs-sink imbalance grew with domain size; a solve is
  converged only when the residual AND the divergence identity are under their stated
  tolerances).

Decision 0009 preserves this block because it specifies and diagnoses the executed negative
result. It rejected the block for forward use after the source audit showed two coupled faults:
`[10]` was not the broad prism configuration, and per-contact `[20]` gives a `4/3` fill factor
plus a planar fixed point different from Eq. 5.34. Forward tests and ledger language use
`sigma_b`, aggregate `G_b/H_b`, and per-boundary-pixel demand instead.

**No separate freezing transfer exists** — the selected surface-policy boundary condition is the
only surface exchange path, which makes a second uptake mechanism structurally impossible
(ADR 0005's disease).
The converged field determines Hertz–Knudsen kinetic demand; only the part placed into `f`
advances ice, while saturation excess remains recorded and unapplied (component 4). The
**solve-consistency test** is the policy-versioned divergence identity of the converged Dirichlet
solve. Under aggregate v5, the final sweep's shell-clamp injection plus the independently metered
signed float64 reflecting-smoother drift must equal that sweep's **signed net numerical
surface-boundary exchange** to a stated relative tolerance. Under exact arithmetic the drift is
zero, recovering the executed legacy-v3/aggregate-v4 two-term identity. Local replacement deltas
may have either sign and are not uptake.
The drift must separately satisfy decision 0014's absolute float64 bound
`1024 * activeCellCount * max(Number.EPSILON * maxAbsSweepInput, Number.MIN_VALUE)` for a
nonzero field; an exact zero field has a zero bound. The minimum-subnormal floor prevents the
relative product itself from underflowing while rounded stencil operations remain nonzero. The registered positive,
fixed-temperature gate independently substitutes `sigma_infinity` for `maxAbsSweepInput` by the
discrete maximum principle. A finite or identity-canceling term outside that bound is a smoother
failure, not convergence.
Comparing
that numerical exchange with reconstructed kinetic demand is a separate discretization diagnostic; it
is not the divergence identity. A Dirichlet solve that fails the identity is not converged,
whatever its residual norm says. Reflecting diagnostic mode has no shell source and makes no
identity claim.

### Component 4 — the fill state `f`

**`f` is a separate dimensionless Float64 field.** It is NOT stored in `b`. Rationale:

- `b` is a mass ledger with G–G dynamics (freeze/melt); `f` is a geometric fraction with
  Libbrecht dynamics. One array with two meanings under two rules is the field-level version
  of the `alpha` conflation this repo bans (Rule 7's spirit: G–G's α vs Libbrecht's α).
- `b` stays exclusively `GGThreshold`'s, so the control-group rule remains bit-identical
  behind the shared interface — the 2b plan gate demands exactly that.
- The checkpoint format carries `f` as a per-field entry for `LibbrechtKinetics` runs through a
  separate rule-tagged LK header and field table (`a`, `f`, `sigma`). Version 1 is the executed
  implicit `legacy-v3` policy. Decision 0009 advances forward writes to version 2, which requires
  the coupled `surfacePolicy`; v1 remains decodable only without that field. The header records
  the actual far-field condition; reflecting LK checkpoints are valid diagnostic data but cannot
  support a physics or habit-gate claim, whose acceptance requires fixed-σ Dirichlet.

Charter note: v1.3 explicitly delegated this decision to this spec ("v1.2's 'reuses the
boundary-mass machinery' was one candidate answer, not a decision") — choosing the separate
field therefore contradicts nothing and needs no ADR. The quasi-liquid layer language of
charter §2.2 is honored where the physics actually lives in this rule: premelting effects are
folded into the *measured* `sigma_0(T)`/`A(T)` (§5), not into a simulated mass pool.

Forward update rule, per growth step, simultaneous across the boundary (start-of-step
`(n_T,n_Z)` and field):
`Δf = min(alphaHK·v_kin·sigma_b·Δt/(H_b·Δx), 1 − f)`, with `H_b = 1` under
aggregate v4/v5 (source-explicit on `[01]`/`[20]`, P4 elsewhere). The executed
legacy-v3 rule was
`min([(2/3)·n_T+n_Z]·alphaHK·v_kin·sigma_face·Δt/Δx, 1−f)` and is retained only for decoding
and reproducing its named policy. The active rule is truncated at saturation so the ledger
never overdraws; the truncated excess is **recorded** in `saturationClippedFill`
(round-3 blocker 2), so the kinetic-demand bookkeeping identity below stays exact. The kinetic rate is clamped at 0
from below (no sublimation — gg-machinery §2's permanence rule
survives; a negative `sigma_surf` grows nothing rather than un-growing something). On attach:
`a = 1`, `f` frozen at 1 for bookkeeping, cell leaves the vapor domain (`sigma = 0`
internally, excluded from the solve), neighbors' configurations update next step.

**Ledger — REWRITTEN 2026-07-15 (round-2 maker review, blocker 5; the previous text defined
an identity that was not physically well-defined).** The defect: it treated relaxation-sweep
clamp totals as a physical "metered source," but **elliptic relaxation sweeps have no
physical duration** — the charter is explicit that physical time enters only through the
interface update — so integrating clamp operations over sweeps measures numerics, not vapor.
The corrected claims, each measurable:

- **The bookkeeping identity, exactly stated (re-corrected round-3, blocker 2; forward geometry
  amended by decision 0009):** computed kinetic demand over a v4 step is the
  geometry-adjusted per-boundary-pixel Hertz–Knudsen integral
  `Σ alphaHK·v_kin·sigma_b·Δt/(H_b·Δx)`, and the bookkeeping identity is
  **`placed fill ledger + saturation-clipped fill = that demand`, exact** — when a cell
  saturates (`f` hits 1 mid-increment) the excess demand is *recorded* in
  `saturationClippedFill`, never silently dropped (the round-3 audit measured a 35% silent
  deficit on an ordinary saturating step — a historical audit probe whose script/config was
  not retained; see ADR 0006's evidence-status note). The clipped term is unapplied numerical excess,
  not deposited fill, ice, or physical uptake. Clipping per cell per step is bounded by the
  fill-CFL and reported in the ledger; ice-cell units convert by
  `M_ice(T) = c_ice/c_sat(T)` (≈ 6.7×10⁵ at −15 °C).
  There is no second uptake channel. The **non-tautological test** recomputes the integral
  outside the solver—from the converged public field, public neighbor topology, core's
  `alphaHK`, and the recorded aggregate geometry—across many steps *including saturating ones*, and
  asserts it equals ledger-delta + clipped-delta.
  **Numerical limitation, stated rather than repaired silently:** v1 chooses
  `Δt = cfl/max(rate)`. If a cell reaches `f = 1` before that interval ends, its remaining
  demand is recorded but not deposited or replayed after the topology change; recording
  repairs auditability, not the first-order timestep error. The physically cleaner candidate
  is an event-limited step,
  `Δt = min(cfl/max(rate), min_{rate>0}[(1-f)/rate])`, followed by attachment and a fresh
  field relaxation before more physical time advances. That changes event timing,
  relaxation frequency, and potentially size-conditioned habit, so it is **not** silently
  substituted into registered protocol v4; adopting it requires a later amending ADR, a
  committed new protocol before its first run, and a full two-temperature rerun. Implementation must
  retain and snap all minimizing/tied event cells (rather than trust rounded
  `rate·[(1-f)/rate] ≥ 1-f`) and process an unattached `f = 1` cell as a zero-time topology
  event, including when its rate is zero.
  **Observed v3 magnitude (2026-07-16):** from log totals rounded to 0.001, the completed warm
  run recorded approximately 118.059 clipped units out of 3256.413 placed + 118.059 clipped
  (3.50%); the cold run recorded 151.133 out of 2145.874 + 151.133 (6.58%). Those nonzero fractions justify a controlled event-limited
  differential, but they do not identify clipping as the cause of the habit failure. Do not
  bundle this change with the classifier/geometry correction merely to force a pass.
- **Solve self-consistency = the divergence identity** (component 3): at aggregate-v5
  convergence, per-sweep shell clamp plus the independently metered signed float64 smoother drift
  equals the signed net numerical surface-boundary exchange. The reflecting interior kernel
  conserves in exact arithmetic, where the added term is zero; metering its actual float64 drift
  prevents an absolute `~1e-13` stencil floor from being magnified at weak exchange (decision
  0013). Executed legacy-v3 and aggregate-v4 retain the two-term identity, to
  a tolerance that scales with the relaxation tolerance. This is the quasi-static statement
  that the global numerical boundary updates balance. Local signed exchange is not uptake;
  per-sweep clamp totals are
  reported **as numerical diagnostics only** and must never be integrated into a mass claim.
- **Hole-filling deficit is reported, never netted away**: cells attached by the geometric
  hygiene rule carry fill the vapor never supplied; the deficit is a first-class ledger line.

Anyone expecting the Phase 2a mass invariant here has mixed up the rules: G–G's invariant is
a reflecting-boundary property of a mass field; this rule's field is a quasi-static potential.
Dirichlet physics runs have an implicit far-field supply; reflecting LK is a depleted,
residual-only diagnostic with no physics claim.

### Component 5 — disposition of the G–G machinery under `LibbrechtKinetics`

| Mechanism | Disposition | Reason |
|---|---|---|
| step (i) single diffusion pass | **replaced** — same kernel, iterated to the DUAL criterion for fixed-σ Dirichlet (residual tolerance AND divergence identity); reflecting LK is residual-only diagnostic (ADR 0005 D3 as amended by 0006) | the field is elliptic under this rule; one pass is a G–G-fidelity choice, not physics |
| step (ii) freezing (`κ`) | **replaced** by the selected surface-policy boundary update (component 3) | a second uptake channel double-counts vapor |
| step (iii) threshold attachment | **replaced** by the fill rule (component 4) | this is the seam itself |
| step (iv) melting (`μ`) | **disabled** | sublimation is not modeled (gg-machinery §2); `μ`'s smoothing role was phenomenological — if a smoothing dial is ever needed it enters as a labeled, documented dial, not as an inherited default |
| hole-filling (raw `n_T ≥ 4`, `n_Z ≥ 1`) | **kept** | geometric hygiene against discretization voids, now also physically consistent (max-coordination kink sites have no barrier). Answering the plan's open question: it survives, so interior voids remain interpretable as physics, not artifacts |
| noise (gg-machinery §6) | **redefined for this rule** | §6's diffusion-slowdown perturbs a *mass* pass, which no longer exists. Under this rule noise is a per-cell multiplicative slowdown of the **attachment coefficient**, `alphaHK → (1 − ξ)·alphaHK`, `ξ ∈ {0, ε}` from the counter PRNG (own stream id), per growth step — applied identically in the relaxation boundary condition and in the interface update for the same tick *(round-3 correction, synced here round-4: the earlier `v_n → (1 − ξ)·v_n` phrasing noised growth but not the boundary condition, silently splitting the coupling)*. Default off; labeled dial; provenance class P4. The gate stays noise-off |
| drift `φ` | **unsupported — structurally unsettable** (corrected 2026-07-15: "error if set" was vacuous since no option exists; the solver has no `phi` input and the CLI rejects unknown flags — pinned by a test) | all §8 presets have `φ = 0`; a drift term inside a quasi-static solve is a different physical statement that nobody has specified |

### Component 6 — the interface, and the tests that hold it together

```ts
interface SurfaceOperator {
  /** Field relaxation for one growth step. GGThreshold: exactly one published masked pass
      (vacuously converged). LibbrechtKinetics with fixed-σ Dirichlet: iterate until BOTH the
      stated residual tolerance AND the divergence identity hold — the dual criterion of decision 0006
      (round-5 sync: this sketch previously promised residual-only convergence); reports
      sweeps, residual, the divergence-identity residual, and the per-sweep clamp
      DIAGNOSTIC (never a physical mass number). */
  relaxField(): RelaxationReport;
  /** The surface exchange: freezing/attachment/melting under GGThreshold (bit-identical to
      Phase 2a); policy-versioned classification, aggregate boundary-pixel fill, and
      attachment under forward LibbrechtKinetics.
      Owns per-cell surface state (f). Attachment is simultaneous from start-of-step state.
      NEVER runs on an unconverged field — ENFORCED, not advisory (round-3 review: the
      public method itself throws without a converged relaxField for this step; step()
      additionally reports skippedUnconverged rather than advancing). */
  advanceSurface(): SurfaceReport;
  /** The rule's evidence/ledger report, measurably: GGThreshold reports Sigma(b+d) and its
      Dirichlet meter; LibbrechtKinetics reports exact kinetic-demand bookkeeping (ice-cell
      and vapor units), the RECORDED unapplied saturation excess (the ledger identity's
      second term — round-5
      sync: this sketch previously omitted it), the hole-fill deficit, and, for Dirichlet,
      the last divergence residual. */
  ledger(): LedgerReport;
}
```

Both solvers implement this interface literally (`solver-cpu/src/operator.ts`; conformance
is compile-checked and exercised in `solver-cpu/test/operator.test.ts` — added 2026-07-15
after the round-2 review found the first implementation had shipped two unrelated report
shapes and no `ledger()` at all).

The old `AttachmentRule.shouldAttach` sketch is superseded (it could not own state or mediate
coupled surface exchange, exactly as the plan predicted). Tests the spec commits to, before any
habit claim:

1. **Bit-identity:** `GGThreshold` behind `SurfaceOperator` reproduces every Phase 2a gate
   bit-identically (pinned engine). This is the refactor gate — no physics lands before it.
2. **Boundary-law limits:** under aggregate v4/v5, independently enumerate opposing
   pixels (including unequal `[20]` values), verify the nonlinear Eq. 5.34 residual, and show
   planar `[01]` and `[20]` recover the same `G_b=H_b=1` normal law. With `alphaHK ≡ 0`,
   `sigma_b = sigma_opp`, kinetic demand and growth are zero (signed numerical exchange may
   still be nonzero during relaxation), and a uniform field is a fixed point;
   with `alphaHK ≡ 1` and `Δx/X_0 → large`, boundary values relax far below the far field.
   A negative control must fail the legacy `[20]=4/3` fill rule. The v3 arbitrary-field
   one-pass bit-identity test remains only a `legacy-v3` regression; Phase 2a byte identity is
   still mandatory.
3. **Divergence identity** on converged fixed-σ Dirichlet solves: far-shell injection equals
   signed net numerical boundary exchange, tolerance stated in the test. Unequal-neighbor
   negative control proves a local negative replacement is not called uptake or allowed to hide
   a failing global identity. Gate runs require positive global source and exchange totals;
   reflecting LK mode is diagnostic-only and makes no divergence claim.
4. **Ledger identity** exact in ledger arithmetic — `placed fill + recorded saturation
   clipping = computed geometry-adjusted per-boundary-pixel Hertz–Knudsen kinetic demand`, recomputed outside the solver
   across steps including saturating ones; clipping is unapplied numerical excess and
   shell-clamp totals are numerical diagnostics only *(round-5
   sync: this line previously still promised the rejected "metered-source accounting" —
   component 4 above is the governing statement)*.
5. **Fill-CFL:** max **kinetic** `Δf ≤` the stated bound (default 0.1) on every growth step.
   *(Amended at implementation, 2026-07-15: `Δt` is ADAPTIVE — `Δt = cfl / max(rate)` per
   step, where a v4 cell's fill rate is
   `alphaHK·v_kin·sigma_b/(H_b·Δx)` under its recorded surface policy; a deterministic
   function of the state, so slow-kinetics regimes advance in
   wall-clock-feasible step counts while the bound holds exactly by construction. Corrected
   same day, round-2 review blocker 6: hole-filling jumps `f → 1` are geometric events
   OUTSIDE the CFL claim and must never be absorbed into — or censored out of — the kinetic
   maximum; they are counted and deficit-ledgered separately, and the gate reads both.)*
6. **Quasi-static validity (Péclet):** `v_n·L/D ≪ 1` evaluated with extracted numbers per run
   regime; where it fails, the run is labeled invalid-as-physics. Worked arithmetic in the
   Phase 2 plan (Stage 2b steps).
7. **Discrete-surface diagnostic:** independently reconstruct the reflecting candidate and the
   applied aggregate boundary value, and require their signed difference to equal the reported
   last-sweep `surfaceExchangeDiagnostic`. Separately report net numerical exchange versus
   geometry-adjusted kinetic demand as a discretization diagnostic, never a ledger identity or
   a promised ratio of 1.
   The v4 dev-grid exchange/demand diagnostic is pinned at 0.3858030057 in
   `solver-cpu/test/lk-solver.test.ts`; it is deliberately not an identity. The legacy-v3
   sink band 0.98922–1.01290 remains pinned only under `legacy-v3`.

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
