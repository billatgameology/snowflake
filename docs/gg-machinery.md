# The Gravner–Griffeath machinery — implementation spec

The shared computational skeleton: lattice, diffusion, state fields, mass bookkeeping, melting,
noise. Diffusion is physical transport; G-G's surface knobs are phenomenological. The coupled
surface operator that uses this machinery is specified separately in
[attachment-kinetics.md](attachment-kinetics.md).

Both `solver-cpu` and (later) `solver-gpu` are written against this file, and Phase 5's
oracle-vs-GPU comparison checks against these definitions.

**Source:** J. Gravner & D. Griffeath, "Modeling snow crystal growth III: three-dimensional
snowfakes," Phys. Rev. E **79**, 011601 (2009) — `research/GravnerGriffeath_PhysRevE09.pdf`.
Preprint: arXiv:0711.4020. Sections below cite the paper's own numbering.

Outputs here are **Type = computed state, Evidence = unvalidated** in charter §1.5's current
two-axis taxonomy. This file makes no physical-validation claim.

> **Read this first — the split (decision 0003, 2026-07-14).** This file was previously
> `gg-model.md` and treated G-G as the whole model. It is not. G-G's contribution to this project
> is *how to compute 3D crystal growth on a lattice at feasible cost* — and that part is kept in
> full for `GGThreshold`. Under `LibbrechtKinetics`, the surface exchange is replaced as a
> coupled whole (iterated surface-boundary relaxation, policy-versioned boundary-pixel fill,
> freezing replaced, melting disabled),
> because G-G's thresholds contain no temperature and make the central question unaskable.
>
> The threshold rule survives permanently as `GGThreshold`, one of two `SurfaceOperator`
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
> gated with noise **off**. G-G's published 3D branches are deterministic; noise is an optional
> labeled dial for natural asymmetric sidebranching, not an existence requirement.

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

> **`b` is `GGThreshold`'s quasi-liquid layer — and stays exclusively its** (corrected
> 2026-07-15; this note previously said "`b` is where the physics will live," which the settled
> surface-operator spec decided otherwise). Under `LibbrechtKinetics` the surface state is a
> *separate* fill field, `b` is untouched, and charter §2.2's premelting requirement is honored
> only to the extent that the provenance-recorded `sigma_0(T)`/`A(T)` parameterizations encode it
> (attachment-kinetics §4.4 component 4, and §5). The solver has no separate quasi-liquid mass pool
> and does not claim that those inputs quantitatively absorb every premelting effect.

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

`GGThreshold` uses every row above as published. `LibbrechtKinetics` does **not** merely replace
the last row: its Robin sink replaces `κ` freezing, its fill rule replaces threshold attachment,
`μ` melting is disabled, drift `φ` is unsupported, and noise is redefined on `alphaHK`. The
governing disposition table is attachment-kinetics §4.4 component 5.

The primary-facet configurations relevant to habit, under `GGThreshold`:

- **`(0,1)` = a flat basal face.** `ggThreshBeta₀₁` is the *basal* attachment threshold.
- **`(2,0)` = a flat prism face.** `ggThreshBeta₂₀` is the *prism/convexifying* attachment
  threshold. `(1,0)` is an isolated lateral tip, not the broad prism facet.

**Corrected interpretation, 2026-07-16:** this paragraph previously called `(1,0)` the flat
prism face even though the next paragraph and the source's reduced parameter set identify the
`(0,1)`/`(2,0)` pair. The Phase 2b v3 classifier copied that error. This correction changes no
`GGThreshold` parameter slot or update mechanic; every configured threshold is still applied to
its same `[n_T,n_Z]` count. Attachment-kinetics §4.4 records the source audit and the unresolved
forward LibbrechtKinetics policy.

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
  explodes); `μ` is what suppresses side-branching. Realistic G–G dendrites live in a narrow `μ`
  band. This statement governs `GGThreshold`; `LibbrechtKinetics` disables the G–G melting step
  by decision (attachment-kinetics §4.4 component 5).

## 4. Update cycle

Under `GGThreshold`, four steps run in order every tick. **Every step conserves total mass**, and
hence so does the whole cycle — this is the Phase 2a mass-conservation test, and it is an exact
invariant, not an approximate one. `LibbrechtKinetics` replaces the surface exchange as a coupled
whole; its distinct ledger and convergence claims live in attachment-kinetics §4.4.

All neighbor counts `n_T`, `n_Z` are computed from the attachment flags **as they stand at the
start of the tick**. Attachment must be simultaneous across `∂A_t`: a cell that attaches in step
(iii) must not influence its neighbor's counts within the same tick.

> **The four steps below are the `GGThreshold` implementation.** The shared seam is the wider
> `SurfaceOperator`, not step (iii) alone. Under `LibbrechtKinetics`, diffusion becomes an
> iterated surface-boundary relaxation, freezing is replaced by that sole sink, threshold
> attachment is replaced by policy-versioned boundary-pixel fill, and melting is disabled. The complete kept/replaced/disabled table
> is [attachment-kinetics.md](attachment-kinetics.md) §4.4 component 5. For `GGThreshold` —
> everything Phase 2a certified — nothing changes, ever.

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

> **Far-field boundary conditions (charter §2.4, added v1.2).** The reflecting rule above is the
> **Phase 2a default** and the G-G-fidelity condition: it conserves total vapor, so the crystal
> grows by consuming a finite reservoir and σ falls over the run. Phase 2b adds a second,
> per-run-selectable condition — **fixed-σ Dirichlet**: the domain faces are held at the set
> supersaturation, i.e. vapor is replenished at the far field. Nakaya coordinates and Libbrecht's
> measurements assume a *maintained* far-field σ, so **every Phase 6 validation run requires
> Dirichlet.** Two consequences that must not get lost:
>
> - The exact mass-conservation invariant (§4 intro) holds **under reflecting only.** Dirichlet
>   makes the domain boundary a source/sink *by design*; its strengthened Phase 2b check starts
>   depleted and verifies that Dirichlet returns to the set value with injected field change
>   metered and balancing, while the identical reflecting run conserves and settles depleted.
> - Which condition a run used is recorded in its **checkpoint metadata**, and results are never
>   compared across conditions silently (charter §3.3) — the two record different experiments.

> **Under `LibbrechtKinetics` this pass becomes the relaxation kernel** (settled 2026-07-15;
> this note previously promised "an iteration count," which ADR 0005 D3 superseded). Fixed-σ
> Dirichlet physics runs require both the residual tolerance and divergence identity; reflecting
> LK is residual-only diagnostic. Counts are outputs, not targets. Same stencil, iterated with
> the selected aggregate boundary-pixel condition—full formulation in attachment-kinetics
> §4.3–§4.4 and decision 0009. Under
> `GGThreshold` it stays exactly one pass per tick, as published, forever.

### (ii) Freezing — on `x ∈ ∂A_t`

Proportion `1 − κ` of the vapor at a boundary site becomes boundary mass.

```
b′(x) = b°(x) + (1 − κ(n_T, n_Z))·d°(x)
d′(x) =         κ(n_T, n_Z) ·d°(x)
```

### (iii) GGThreshold attachment — on `x ∈ ∂A_t`

**`GGThreshold` implementation** (Phase 2a; kept permanently):

```
if (raw n_T ≥ 4 and n_Z ≥ 1):        attach       # hole-filling rule, uses the UNCAPPED count
elif b°(x) ≥ ggThreshBeta(n_T, n_Z): attach

on attach:  a = 1,  b′(x) = b°(x) + d°(x),  d′(x) = 0
```

Step (ii) runs first, so the `b°` tested here already includes this tick's freezing.

**`LibbrechtKinetics` implementation** (Phase 2b): see
[attachment-kinetics.md](attachment-kinetics.md) §4.4. The hole-filling rule above is *geometric
hygiene*, not physics — it prevents interior voids from the discretization. **Decided
2026-07-15 (§4.4 component 5): it survives** — kept under both rules, and under the kinetics
rule it is additionally consistent with barrier-free attachment at maximum-coordination kink
sites, so hollowing results stay interpretable as physics rather than artifacts.

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

## 6. Noise — the diffusion-slowdown perturbation (§VI.C)

**Extracted 2026-07-14 from the paper, §VI.C "Random dynamics", p. 011601-9.** The former
version of this section was a documented hole; it is now filled from the published text.

The noise term is an explicit, labeled symmetry-breaking option. It is **not required for branch
existence**: G-G's published 3D snowfakes, branches included, are deterministic. Use it when the
experiment asks for natural asymmetric sidebranching; keep it off for exact-symmetry gates.
Under `LibbrechtKinetics` the same dial is redefined as an `alphaHK` slowdown applied identically
to sink and growth (attachment-kinetics §4.4 component 5).

**Honesty note first: this is a *proposal* in the paper, not a mechanism their 3D case studies
used.** §VI.C opens: "Our only three-dimensional virtual snowflakes to date are deterministic,
since randomness would also require the just discussed simulation without symmetry." Everything
below is what G-G *propose* for 3D — carried over from their 2D model (their ref. [3]) but
redesigned for mass conservation. No published 3D snowfake figure depends on it.

**The rule.** Let 𝒟 denote the whole linear diffusion operator of step (i) — substeps (1a)–(1c)
composed, reflecting rule included — so an unperturbed tick computes `d‴ = 𝒟(d°)`. Let
`ξ_t(x)`, for `t ≥ 0, x ∈ T×Z`, be **independent random variables equal to ε > 0 or 0, each
with probability 1/2** — "the proportion of particles that refuse to diffuse at position x and
time t." The randomized step (i) is (paper's display, §VI.C):

```
d‴ = 𝒟[(1 − ξ_t)·d°] + ξ_t·d°     ( = 𝒟(d°) + ξ_t·d° − 𝒟(ξ_t·d°) )
```

"In a natural way, this represents small random temperature fluctuations in space and time."

- **Which field:** `d` (diffusive mass) only. `a` and `b` are untouched.
- **Where in the tick:** inside step (i) — it *is* step (i) with a perturbed input; steps
  (ii)–(iv) are unchanged.
- **Symbol and range:** ε ("residual noise on the mesoscopic scale"); "ε would need to be
  quite small, say on the order 10⁻⁵." In code: `noiseEpsilon` (a bare Greek letter or its
  spelled-out name violates Rule 7's spirit of provenance; ε here is *G-G's noise amplitude*,
  nothing else).
- **Mass:** **conserved exactly, by construction** (in real arithmetic). 𝒟 conserves the total
  of any input field (reflecting boundary, §4.i), so
  `Σ d‴ = Σ(1−ξ)d° + Σ ξd° = Σ d°`. This is the paper's stated reason for the design: the 2D
  model's additive perturbation of diffusive mass "is not suitable in 3D since it is not
  physical to violate mass conservation. Instead, a small random slowdown in the diffusion rate
  is more appropriate." The Phase 2a mass gate is nevertheless defined **noise off** (plan),
  which is now known to be conservative rather than necessary; a supplementary noise-on mass
  test is legitimate and exists in `solver-cpu`.
- **Reading adopted (only interpretive step, and it is forced):** the reflecting rule replaces
  neighbor terms with *the centre cell's own value of the operator's input field* — with noise
  on, that is `(1−ξ(x))·d°(x)`, not raw `d°(x)`. This is what "apply 𝒟 to the field
  `(1−ξ)d°`" literally says, and it is the only reading under which 𝒟's mass conservation
  (and hence the identity above) survives.
- **Determinism:** ξ is generated by the counter-based PRNG in `core` —
  `ξ_t(x) = ε · bit(rngSeed, cellIndex(x), t, STREAM_NOISE_XI)` — a pure function of the
  tuple, independent of iteration order. Same seed ⇒ same realization, on any engine and on
  the GPU later. Never `Math.random()`.
- **Symmetry:** ξ is i.i.d. per site, so noise **breaks D6h symmetry by design**. The Phase 2a
  symmetry gate runs noise **off**; studies specifically targeting natural asymmetric branching
  may run it **on**. Two different experiments.

**Not adopted (recorded so nobody re-derives it):** §VI.C also sketches variants where a small
proportion of particles "refuse to freeze in (2), or melt in (4)" — e.g. freezing becomes
`b′ = b° + (1−κ)·d°·(1−ξ)`, `d′ = κ·d°·(1−ξ) + d°·ξ`, likewise mass-conserving. The paper
presents these as further options ("one could introduce…"), not as the primary rule. Phase 2a
implements the diffusion-slowdown form only; the freeze/melt variants can be added behind their
own stream ids if a later phase wants them.

## 7. Guardrails on parameter space

G-G derive these in §5. They bound the usable region and belong in the validator (and later, in
what the UI will let a user reach). **These constrain `GGThreshold`.** `LibbrechtKinetics` does
not inherit them; its separate fill-CFL and Péclet checks are specified in
[attachment-kinetics.md](attachment-kinetics.md) §4.3–§4.4.

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

**Domain-contact guard (charter §3.1, added v1.2).** Distinct from, and stricter than, G-G's 80%
stopping rule: the metrics module automatically flags **invalid** any run in which the crystal's
bounding box exceeds **~65% of any domain extent**. A crystal near the wall interacts with its
own mirror image (reflecting) or with a clamped edge (Dirichlet), corrupting the field silently
while the shape still looks plausible. Flagged runs never enter validation results.

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
