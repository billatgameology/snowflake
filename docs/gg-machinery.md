# The Gravner–Griffeath machinery — implementation spec

The computational skeleton: lattice, diffusion, state fields, mass bookkeeping, melting, noise.
**This file is physics-agnostic infrastructure.** The attachment rule that plugs into it is
specified separately in [attachment-kinetics.md](attachment-kinetics.md).

Both `solver-cpu` and (later) `solver-gpu` are written against this file, and Phase 5's
oracle-vs-GPU comparison checks against these definitions.

**Source:** J. Gravner & D. Griffeath, "Modeling snow crystal growth III: three-dimensional
snowfakes," Phys. Rev. E **79**, 011601 (2009) — `research/GravnerGriffeath_PhysRevE09.pdf`.
Preprint: arXiv:0711.4020. Sections below cite the paper's own numbering.

Everything here is **level 1 (direct model state)** in the charter §1.5 sense. Nothing in this
file is a physical claim.

> **Read this first — the split (decision 0003, 2026-07-14).** This file was previously
> `gg-model.md` and treated G-G as the whole model. It is not. G-G's contribution to this project
> is *how to compute 3D crystal growth on a lattice at feasible cost* — and that part is kept in
> full. Its **attachment thresholds `β(n_T, n_Z)` are replaced** by Libbrecht's kinetics, because
> they contain no temperature and therefore make the project's central question unaskable.
>
> The threshold rule survives permanently as `GGThreshold`, one of two `AttachmentRule`
> implementations (§4 below). It is the Phase 2a gate, the working floor, and the differential
> diagnosis when the physics misbehaves. It is never deleted.

> **⚠ Symbol ban (charter §3.3).** G-G's `α` and Libbrecht's `α` are unrelated quantities that
> are both conventionally written `α`. A bare `alpha` is banned repo-wide. In this file, G-G's
> thresholds are `ggThreshAlpha`, `ggThreshBeta`, `ggThreshTheta`.

---

## 1. Lattice

`T × Z`, where `T` is the planar triangular lattice. Each site has **8 neighbors: 6 in-plane
(T) + 2 vertical (Z)**. The fundamental cell is a hexagonal prism with base side `1/√3` and
height `1` — so across-flats = 1 and height = 1, and *all 8 bonds have unit length*.

Store on a flat array with axial coordinates `(i, j, k)` — G-G do the same ("simulations
actually run on the cubic lattice ℤ³, which can be mapped onto T × Z", §3).

```
idx = k*(nx*ny) + j*nx + i

T-neighbors (axial):  (+1, 0)  (−1, 0)  (0, +1)  (0, −1)  (+1, −1)  (−1, +1)
T-neighbor offsets:   +1       −1       +nx      −nx      +1−nx     −1+nx
Z-neighbor offsets:   ±(nx*ny)
```

The flat offsets are only valid away from the domain faces — `i±1` wraps across rows. Use a
bounds-checked gather on the boundary shell (it is O(N^⅔), so the cost is noise) and the fast
offsets in the interior.

**Cartesian embedding** (rendering, metrics):

```
x = i + j/2        y = j·(√3/2)        z = k
```

Hexagon vertices at angles `30° + 60°·m`, circumradius `1/√3`, so each flat face points at a
T-neighbor.

**Symmetry group.** With a symmetric seed and `φ = 0` the dynamics is exactly **D6h**-symmetric:

```
rot60(i, j)  = (−j, i + j)     # 60° rotation, order 6
mirror(i, j) = (j, i)          # reflection (det = −1)
zmirror(k)   = 2·k_c − k       # about the seed plane
```

`rot60⁶ = id`. These generate the full group and are the basis of the Phase 2a symmetry metric.

> Note for Phase 2b: the noise term (§6) breaks exact symmetry by design. The symmetry metric is
> gated with noise **off**; sidebranching requires it **on**. Do not conflate the two runs.

## 2. State

Three fields per cell. The 3D model has **no separate crystal-mass field** — the 2D predecessor's
`c` is folded into `b`.

| Field | Type | Meaning |
|---|---|---|
| `a` | 0/1 | attachment flag; `a = 1` ⟺ the site is in the crystal `A_t` |
| `b` | float | **boundary mass** — semi-liquid when `a = 0`, frozen ice when `a = 1` |
| `d` | float | **diffusive mass** — water vapor |

Boundary set `∂A_t = { x ∉ A_t : some neighbor y ∈ N_x has a(y) = 1 }`.

Attached sites have `d = 0` forever and **no further dynamics** — attachment is permanent and
sublimation is not modeled (§2).

> **`b` is where the physics will live.** Charter §2.2 requires the nanoscale premelted
> quasi-liquid layer to exist as internal state. `b` *is* that layer. `LibbrechtKinetics` reads
> and writes it; this is not a coincidence but the reason the seam works at all.

## 3. Parameters

Two scalars plus three 7-vectors. The 7-vectors are indexed by **boundary configuration**
`(n_T, n_Z)` where

```
n_T = min(#attached T-neighbors, 3)   ∈ {0,1,2,3}
n_Z = min(#attached Z-neighbors, 1)   ∈ {0,1}
```

excluding `(0,0)` — that's `4·2 − 1 = 7` slots. **Subscript order is `(n_T, n_Z)`**: the paper's
Fig. 2 caption fixes it — "the '21' site has 2 horizontal (T-)neighbors and 1 vertical
(Z-)neighbor, and consequently needs boundary mass β₂₁."

| Symbol | Belongs to | Role |
|---|---|---|
| `ρ` | machinery | initial/ambient vapor density — the supersaturation knob |
| `φ` | machinery | drift strength (vapor drifts in −z; the crystal effectively rises). `0` in most case studies |
| `κ(n_T, n_Z)` | machinery | fraction of vapor that *stays* vapor at a boundary site (so `1 − κ` = freezing rate) |
| `μ(n_T, n_Z)` | machinery | **melting rate** — fraction of boundary mass returned to vapor |
| `ggThreshBeta(n_T, n_Z)` | **GGThreshold only** | attachment threshold — boundary mass needed to join the crystal |

Only the last row is replaced by `LibbrechtKinetics`. Everything above it is kept.

The two configurations that carry the habit, under `GGThreshold`:

- **`(0,1)` = a flat basal face.** `ggThreshBeta₀₁` is the *basal* attachment threshold.
- **`(1,0)` = a flat prism face.** `ggThreshBeta₁₀` is the *prism* attachment threshold.

> **`β₀₁ / β₂₀` is the plate↔column axis under `GGThreshold`.** High `β₀₁` ⇒ basal faces attach
> reluctantly ⇒ growth goes sideways ⇒ **plate**. Low `β₀₁` ⇒ basal faces attach easily ⇒ growth
> goes up ⇒ **column**. G-G name this explicitly as one of four knobs in their reduced parameter
> set (§5).
>
> **This is exactly the knob that decision 0003 replaces.** Under `LibbrechtKinetics` the habit
> is not a knob at all — it is an *output* of the α_basal/α_prism competition at a given
> temperature. When comparing the two rules, this is the axis to compare along.

The other three knobs in G-G's reduced set, worth knowing before tuning anything:

- `ρ` — supersaturation. More vapor ⇒ more side-branching.
- `β₂₀` — *convexifying strength*. Large `β₂₀` ⇒ the crystal stays a clean hexagonal prism longer.
- `μ` — semi-liquid layer smoothing. **`μ ≈ 0` makes dendrites impossible** (branch density
  explodes); `μ` is what suppresses side-branching. Realistic dendrites live in a narrow `μ` band.
  Note this survives into `LibbrechtKinetics` — it is machinery, not threshold physics.

## 4. Update cycle

Four steps, in order, every tick. **Every step conserves total mass**, and hence so does the
whole cycle — this is the Phase 2a mass-conservation test, and it is an exact invariant, not an
approximate one.

All neighbor counts `n_T`, `n_Z` are computed from the attachment flags **as they stand at the
start of the tick**. Attachment must be simultaneous across `∂A_t`: a cell that attaches in step
(iii) must not influence its neighbor's counts within the same tick.

> **Step (iii) is the seam.** It is the *only* step behind the `AttachmentRule` interface. Steps
> (i), (ii) and (iv) are identical under both rules. If a diff to this solver touches (i), (ii)
> or (iv) while claiming to be about physics, it is out of scope.

### (i) Diffusion — on `x ∉ A_t`

Two substeps, plus an optional drift substep.

```
(1a)  d′(x)  = (1/7) · Σ_{y ∈ N_T(x) ∪ {x}} d°(y)

(1b)  d″(x)  = (4/7)·d′(x) + (3/14) · Σ_{y ∈ N_Z(x)} d′(y)

(1c)  d‴(x)  = (1 − φ·(1 − a(x − e₃)))·d″(x) + φ·(1 − a(x + e₃))·d″(x + e₃)
```

The `4/7`, `3/14` weights are not arbitrary: they make diffusion isotropic once the lattice is
scaled so all 8 bonds have unit length (§2). Note `4/7 + 2·(3/14) = 1`.

**Reflecting boundary.** Any neighbor term pointing at an attached cell is replaced by the
*centre cell's own value* — `d°(x)` in (1a), `d′(x)` in (1b). Apply the identical rule at the
domain faces. This is what makes mass conservation exact: a cell retains `(1 + n_attached)/7` of
its mass and hands `1/7` to each free neighbor, and the books balance.

> **Phase 2b will add an iteration count here.** One diffusion pass per growth step is a *guess*
> that the vapor field has relaxed. Once Δx, Δt and D carry physical units
> ([attachment-kinetics.md](attachment-kinetics.md) §4), the number of diffusion iterations
> needed for the quasi-static field to actually relax becomes a *derived* quantity. This is one
> of the concrete gifts of taking on units.

### (ii) Freezing — on `x ∈ ∂A_t`

Proportion `1 − κ` of the vapor at a boundary site becomes boundary mass.

```
b′(x) = b°(x) + (1 − κ(n_T, n_Z))·d°(x)
d′(x) =         κ(n_T, n_Z) ·d°(x)
```

### (iii) Attachment — on `x ∈ ∂A_t`  ← THE SEAM

**`GGThreshold` implementation** (Phase 2a; kept permanently):

```
if (raw n_T ≥ 4 and n_Z ≥ 1):        attach       # hole-filling rule, uses the UNCAPPED count
elif b°(x) ≥ ggThreshBeta(n_T, n_Z): attach

on attach:  a = 1,  b′(x) = b°(x) + d°(x),  d′(x) = 0
```

Step (ii) runs first, so the `b°` tested here already includes this tick's freezing.

**`LibbrechtKinetics` implementation** (Phase 2b): see
[attachment-kinetics.md](attachment-kinetics.md). Note the hole-filling rule above is *geometric
hygiene*, not physics — it prevents interior voids from the discretization. Decide deliberately
whether it survives into `LibbrechtKinetics`; it probably should, and if it does not, hollowing
results become very hard to interpret.

### (iv) Melting — on `x ∈ ∂A_t` that did **not** just attach

```
b′(x) = (1 − μ(n_T, n_Z))·b°(x)
d′(x) =  d°(x) + μ(n_T, n_Z)·b°(x)
```

> **Implementation decision.** The paper writes step (iv) over `∂A_t`, which literally read would
> include cells that attached in step (iii). We exclude them, because §2 states attachment is
> permanent with "no further dynamics at attached sites," and Fig. 2's flowchart makes *attached*
> a terminal state. Including them would let freshly-frozen ice leak mass back out. The effect is
> tiny (`μ ~ 10⁻³`) but the semantics are not ambiguous.

## 5. Initial state

`a = 1` and `b = 1` on the seed; `a = 0`, `b = 0`, `d = ρ` everywhere else.

**Canonical seed: a hexagonal plate of radius 2, thickness 1 — 19 sites.**

Do **not** seed a single cell. Its Z-neighbors see 7 free faces, which immediately triggers a
spurious needle instability and runaway Z-growth (§2).

> ### ⚠ Erratum — the paper says 20 sites; it is 19. Do not "fix" this back.
>
> Both the preprint and the published version say the radius-2 hexagon "consist[s] of 20 sites."
> That is a miscount, in both.
>
> A hexagonal ball of radius `r` on a triangular lattice has `3r² + 3r + 1` sites, so `r = 2`
> gives **19**. More decisively: under 6-fold rotation about a lattice site, every orbit has size
> 6 except the fixed centre, so **any C₆-symmetric set has `|S| ≡ 0 or 1 (mod 6)`**. `20 mod 6 =
> 2`, so a 20-site seed *cannot* be sixfold symmetric — and G-G's snowfakes plainly are. The
> authors' code was surely right; the sentence is wrong.
>
> This matters: a symmetry-broken seed would silently defeat the Phase 2a gate, whose entire job
> is to detect symmetry breaking. Seed size stays a parameter so the 20-site variant can be run
> deliberately — the metric should reject it.

## 6. Noise — ⚠ NOT YET EXTRACTED FROM THE PAPER

**This section is a known hole in the spec and a Phase 2a blocker.**

The noise term is load-bearing and easy to overlook. Libbrecht's kinetics are fully
deterministic and supply **no stochasticity whatsoever** — so if noise is dropped from the
machinery, **sidebranching never seeds** under `LibbrechtKinetics` and the Phase 4 dendrite
milestone becomes unreachable for a reason that will look like a physics failure and will not be
one. Noise is not decoration; it is the symmetry-breaking source the whole branching instability
feeds on.

G-G apply a small stochastic perturbation to the diffusive mass field. **The exact form,
placement in the cycle, and magnitude have not been extracted from the paper**, and are
deliberately not guessed here.

To do, before Phase 2a can be gated:

- [ ] Extract the noise rule from `research/GravnerGriffeath_PhysRevE09.pdf` — exact expression,
      which field it perturbs, where in the tick it applies, and the parameter's symbol and range.
- [ ] Confirm whether it preserves mass exactly. **If it does not, the mass-conservation test
      must be defined with noise off** — and that fact must be stated in the test, or the test
      will appear to fail intermittently and be "fixed" by someone deleting it.
- [ ] Record whether determinism is preserved under a seeded PRNG (charter §3.1 requires
      deterministic seeds throughout; a naive `Math.random()` in the hot loop silently destroys
      the oracle-vs-GPU comparison in Phase 5).

## 7. Guardrails on parameter space

G-G derive these in §5. They bound the usable region and belong in the validator (and later, in
what the UI will let a user reach). **These constrain `GGThreshold`.** `LibbrechtKinetics` will
need its own stability analysis — the CFL-like bound in
[attachment-kinetics.md](attachment-kinetics.md) §4 — and it does not inherit these.

**Avoid the Packard regime** — unphysical runaway where the crystal expands as fast as the CA
light cone, an artifact of discrete averaging rather than physics:

```
(1 − κ₀₁)·ρ < β₀₁          (1 − κ₁₀)·ρ < β₁₀
```

**Avoid growth stall** — melting drains the boundary layer faster than it fills, and nothing ever
attaches. Sufficient for continued growth in all directions (and necessary too, when
`β₁₀ = β₂₀`):

```
μ₀₁·β₀₁ < (1 − κ₀₁)·ρ      μ₁₀·β₁₀ < (1 − κ₁₀)·ρ
```

**Drift** `φ ≈ 0.01`, chosen last, and `φ ≈ 1/(array size)` is required for a diffusion limit.

**Stopping rules** (§3): halt when far-field vapor falls to a set fraction of `ρ` (they use
`2ρ/3` or `ρ/2`), or when the crystal radius exceeds 80% of the domain radius.

### Monotonicity is a warning, not an error

The paper assumes `β`, `κ`, `μ` are each **decreasing in both coordinates** — more concave
corners should catch vapor and attach more readily — and says the assignment "only makes
physical sense" that way.

**The paper's own hollow-column preset violates it:** `β₃₁ = 1` while `β₃₀ = β₂₁ = 0.5`, so β
*increases* from (3,0) to (3,1). A validator that enforced monotonicity as a hard error would
reject the published parameters. Warn; do not reject. Flag which slot violated it and move on.

## 8. Published parameter sets — `GGThreshold` presets

These are the **Phase 2a floor**: the proof that the machinery works, and the beautiful-crystal
guarantee that survives whatever Phase 6 concludes. All have `φ = 0`; all β not listed are `1`.

| Preset | `β₀₁` | `β₁₀`=`β₂₀` | `β₁₁` | `β₃₀`,`β₂₁`,`β₃₁` | `κ` | `μ` | `ρ` | Paper |
|---|---|---|---|---|---|---|---|---|
| **plate** (ridges) | 2.5 | 2 | 2 | 1, 1, 1 | ≡0.1 | ≡0.001 | 0.1 | §7, Fig. 4 |
| **needle** | 2 | 4 | 4 | 1, 1, 1 | ≡0.1 | ≡0.001 | 0.1 | §11, Fig. 29 |
| **hollow column** | 1 | 2 | 0.5 | 0.5, 0.5, **1** | ≡0.1 | ≡0.01 | 0.1 | §11, Fig. 30 |
| **classic dendrite** | 1.6 | 1.5 | 1.4 | 1, 1, 1 | ≡0.1 | ≡0.008 | 0.095–0.105 | §8 |

Notes that will save time:

- **plate vs needle differ almost entirely in `β₀₁/β₂₀`** (1.25 vs 0.5). Same solver, parameter
  change only — charter §1.4's second success criterion, and it is a two-line diff.
- **The dendrite series is a `ρ` sweep**: `ρ = 0.105` → fern; `0.1`/`0.095` → classic stellar;
  `0.09` → simple star with no significant side-branching. Note its `μ ≡ 0.008`, eight times the
  plate's — without it the branches choke.
- **Hollowing "starts developing early on"** (§11) — so the hollowness gate does *not* need a
  showcase-sized grid. Good news for Phase 4 on the CPU oracle.
- G-G's **§12 is "change of environment"**: abrupt mid-growth parameter changes producing capped
  columns and plates-with-dendritic-extensions. The charter's timeline is a reproduction of a
  published result, not a leap.

> **These presets are also the control group.** When `LibbrechtKinetics` produces something
> strange, the first question is always: does `GGThreshold` still produce these four, on this
> same machinery, from this same seed? If yes, the bug is in the physics. If no, the bug is
> underneath it and the physics is innocent. That differential is the entire reason both rules
> are kept forever.

Their own honest note (§4, §5): parameter selection is "an arduous and imprecise task," the good
examples are "quite sensitive to perturbations," and **"visual comparison with snow crystal
photographs is the only method we use to decide whether a snowfake is a failure or a success."**

That sentence is the best available argument for decision 0003. Automated morphology metrics
(charter §3.1) are already an improvement on it. Physically-grounded attachment is the rest.
