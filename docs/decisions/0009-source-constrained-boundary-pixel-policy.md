# 0009 — Source-constrained boundary-pixel policy for LibbrechtKinetics

- **Date:** 2026-07-16
- **Status:** accepted. **Amends 0006** (Decision items 2–3 and their associated tests and
  terminology) for forward `LibbrechtKinetics` policies; the executed protocol-v3 policy and
  its negative result remain immutable history.
- **Charter impact:** §2.4 (fill-CFL wording), §3.2 Phase 2b (physical-units and seam bullets),
  and Phase 6's protocol-freeze list updated in this session (charter v1.6 → v1.7). The
  depleted-start Dirichlet gate and the Phase 2b habit thresholds do not change.

## Context

Protocol v3 completed as registered and failed its cold-habit criterion: both −5 °C and
−15 °C produced the same one-layer plate at the registered measurement size. The result is
valid negative evidence for that exact implementation. A post-result primary-source audit then
found that its intended temperature-dependent mechanism was not actually routed through the
source's broad prism configuration:

- The monograph defines `[HV]` as horizontal and vertical attached-neighbor counts, identifies
  `[01]` as basal, and identifies `[20]` as prism (printed pp. 204–206, Figure 5.26 and text).
  It suggests zero attachment at isolated `[10]` tips and unit attachment at kink-dominated
  `[30]`, `[40]`, and `[21]` sites (printed p. 206).
- V3 instead classified `[10]` as prism and every `n_T >= 2` site as rough. The canonical
  19-site seed begins with 12 `[20]` broad-prism boundary cells, all of which therefore used
  temperature-independent unit attachment in v3.
- The source's generalized 3D boundary condition is an aggregate boundary-pixel equation,
  not one Robin ghost per attached contact. It gives both primary facets `G_b = H_b = 1`
  (printed pp. 208–209, Eqs. 5.34–5.36). The later two tokens saying `[10]` “basal facet” are
  internal typographical errors: they conflict with Figure 5.26, the explicit `[01]` basal and
  `[20]` prism text, the isolated-`[10]` paragraph, and the source's own return to “`[01]` and
  `[20]` facet surfaces” on printed p. 209.

ADR 0006's per-contact fill correction was evaluated under v3's mistaken `[10]` broad-prism
mapping. Relabeling the actual broad prism as `[20]` turns its formula from one lateral factor
`2/3` into `4/3`. That is not the source's unit broad-facet normal speed. The Robin side is also
not an equivalent spelling of Eq. 5.34. For constant attachment coefficient on a planar facet,
let `O` be the opposing vapor value, `B` the legacy boundary-cell value,
`s = alphaHK*dx/X_0`, and `R = B/(1+s)` the legacy substituted value. The legacy fixed point
obeys `2B = O + R`, hence `R/O = 1/(1+2s)`; Eq. 5.34 instead requires the boundary value
`sigma_b/O = 1/(1+s)` when `G_b = 1`. At the gate's `dx/X_0 ~= 2.4`, the distinction is
load-bearing.

The source also says that raw `[HV]` counts alone cannot distinguish every broad upper terrace
from a nearby kink: its fuller facet-vicinal model uses nonlocal signed terrace distances.
Therefore a nearest-neighbor policy can be source-constrained without being source-faithful.
That limitation must remain explicit.

## Decision

### 1. Version the coupled surface policy

Every new LK solver and checkpoint names one immutable **surface policy**, not merely a facet
classifier. The forward policy is `aggregate-hv-g1h1-v4`; the executed policy is
`legacy-v3`. The policy covers classification, the Robin sampling/geometry rule, and the fill
geometry rule together so a checkpoint cannot name one while silently using another.

LK checkpoint JSON headers advance to version 2 and require a recognized `surfacePolicy`.
The binary magic and field payload remain unchanged. Version-1 LK checkpoints are accepted only
without a policy field and decode as implicit `legacy-v3`; a version-1 header that claims a
policy is rejected. New encoding writes version 2 only. Missing, unknown, and mismatched
policies fail in construction, encoding, decoding, the runner's write-time round trip, and the
flagless gate. The preserved v3 bytes and hashes remain the evidence; decoding them does not
authorize rewriting history as v2.

### 2. Classify raw nearest-neighbor configurations explicitly

For `aggregate-hv-g1h1-v4`, raw integer counts are validated over `n_T in [0,6]` and
`n_Z in [0,2]`; `[00]` is not a boundary configuration and is rejected.

| Configuration | Kinetic class | Status |
|---|---|---|
| `[01]` | basal | source-explicit broad-facet family |
| `[02]` | basal | P4 nearest-neighbor extension of the basal family |
| `[10]` | inhibited, `alphaHK = 0` | source-suggested isolated-tip simplification |
| `[20]` | prism | source-explicit broad-facet family |
| `[21]`, `[30]`, `[40]` | rough, `alphaHK = 1` | source-explicit kink-dominated examples |
| every other valid nonzero `[HV]` | rough, `alphaHK = 1` | P4 nearest-neighbor closure |

The retained hole-fill rule is a separate attachment mode: raw `n_T >= 4 && n_Z >= 1`
attaches geometrically and reports its deficit exactly as before. It does not change the kinetic
class or hide inside the fill-CFL claim. Nonlocal signed-terrace classification and SDAK remain
out of scope.

### 3. Use the aggregate boundary-pixel Robin equation

For a boundary cell `x`, each attached neighbor direction `d` nominates the cell at `x-d` as
its opposing cell. Following Eq. 5.35's mask, only active unattached vapor cells contribute;
duplicates are counted once. `sigma_opp(x)` is their arithmetic mean, or zero when the mask is
empty. The empty/partial-mask rule is a stated P4 closure for concave lattice configurations;
the primary `[01]` and `[20]` facets have exactly `H+V` opposing vapor cells as in the source.

The boundary value and attachment coefficient are solved self-consistently:

```text
sigma_b = sigma_opp / (1 + alphaHK(class, sigma_b) * G_b * dx/X_0)
```

For v4, `G_b = 1` on `[01]` and `[20]` as cited, and `G_b = 1` on all other boundary pixels as
the source's explicitly tentative simplification (printed p. 209), provenance P4. A relaxation
sweep first applies the certified Phase 2a reflecting smoother, then replaces boundary-pixel
values with this aggregate condition, then applies the far-field clamp.

The boundary replacement acts on a quasi-static **potential**, not a mass store. Its signed
per-pixel numerical exchange—reflecting candidate minus applied boundary value—may be negative
when low tangential neighbors pull the reflecting candidate below `sigma_b`; that is relaxation
redistribution, not negative physical uptake. It must not be clamped, deposited, or called local
absorption. The globally summed `surfaceExchangeDiagnostic` is the actual net numerical boundary
exchange of the sweep. Fixed-sigma Dirichlet convergence requires the iterate residual and the
divergence identity between far-shell injection and that signed net exchange; an accepted
positive-supersaturation physics solve also requires both totals to be positive. Reflecting LK
remains diagnostic-only. The nonnegative physical kinetic demand is separately
`alphaHK*v_kin*sigma_b/(H_b*dx)` and is the interface ledger's quantity; no equality between it
and the relaxation diagnostic is promised.

An adversarial unequal-neighbor test must exercise a negative local replacement while proving
that it is reported only inside the signed numerical total, the aggregate boundary equation
still holds, kinetic demand remains nonnegative, and canceling local exchanges cannot satisfy a
Dirichlet solve whose global source/exchange totals or divergence identity fail.

The converged `sigma_b` and `alphaHK` pair used by the last accepted boundary update is cached
and drives growth. V4 therefore does not call the legacy inward ghost value `sigma_face`.
At `alphaHK = 0`, the source boundary equation becomes `sigma_b = sigma_opp`; this is the
correct v4 zero-flux boundary law, but it does not promise bitwise equality with one transient
GG reflecting pass on a nonuniform field. `GGThreshold` itself remains bit-identical and is the
control.

### 4. Fill once per boundary pixel with the source geometry

The v4 kinetic fill rate is

```text
rate_f = alphaHK * v_kin * sigma_b / (H_b * dx)
```

with `H_b = 1` on `[01]` and `[20]` as cited and `H_b = 1` elsewhere as the same P4
simplification. The fill-CFL continues to bind the maximum per-cell kinetic increment;
`dt = cflFill/max(rate_f)`. Placed fill plus recorded unapplied saturation excess equals the
computed geometry-adjusted per-boundary-pixel Hertz–Knudsen demand. Hole-fill deficit and shell
clamp diagnostics retain their separate meanings.

The adaptive CFL/clipping scheme is deliberately unchanged in v4. V3's approximate 3.50% and
6.58% clipping fractions justify a future controlled event-limited comparison, but do not show
that clipping caused the failed habit. Event-limited timing must not be bundled into this repair
to obtain a favorable result.

### 5. Pre-register v4 before morphology work

The Phase 2 plan freezes the complete v4 pair before implementation-driven morphology probes.
The only intended run-to-run difference remains temperature. Policy-table, topology, analytic
boundary-law, ledger, checkpoint, symmetry, determinism, and convergence tests may precede the
gate; no two-temperature habit or size-conditioned morphology probe may. Because the concrete
implementation commit cannot exist before this decision, execution provenance is frozen as a
procedure: commit all behavior and tests, launch only from a tracked-clean worktree, have the
flagless gate derive and print its HEAD hash, and name that hash in the result record.

## Consequences

- The proved classifier defect and its entangled normal geometry are repaired together. The
  primary `[01]` and `[20]` facets now use the cited aggregate equations and unit `G_b/H_b`
  convention rather than a relabeled per-contact approximation.
- V4 remains **unvalidated and source-constrained, not source-faithful**. It omits the source's
  nonlocal signed-terrace classifier, uses the project's certified split diffusion smoother
  instead of adopting the monograph's entire propagation kernel, and extends `G_b = H_b = 1`
  to non-primary pixels as a P4 simplification.
- ADR 0006's dual convergence, separate fill field, clipping record, exact bookkeeping posture,
  noise coupling, and hole-fill reporting survive. Its per-contact geometry formula and
  per-face demand terminology survive only as the `legacy-v3` historical policy.
- The old alphaHK-zero transient bit-identity test is no longer a v4 contract. It is replaced
  by direct tests of the aggregate equation, its zero-coefficient limit, planar `[01]`/`[20]`
  equivalence, and the unchanged Phase 2a byte-identity gate.
- Version-2 checkpoint provenance is deliberately not wire-byte-compatible with a re-encoded
  v1 header. The public encoder never emits v1: decode-v1 then encode intentionally migrates to
  explicit v2 and is not byte-identical. The recorded v3 byte-round-trip claim refers to the
  pre-0009 validation with the then-current v1 writer; the original artifacts and hashes remain
  immutable, and the forward decoder still identifies them as `legacy-v3`.
- The change can still fail the Phase 2b habit gate. That would be a valid v4 result, not
  permission to tune supersaturation, enable SDAK, or add event timing after seeing morphology.

## Alternatives considered

- **Change only `[20]` classification and keep per-contact Robin/fill geometry.** Rejected:
  the same correction changes the actual broad-prism factor to `4/3`, contrary to the cited
  `G_b = H_b = 1`; the legacy planar fixed point also differs by order one at gate resolution.
- **Retain per-contact geometry as a separately justified finite-volume model.** Viable for a
  future policy, but it first needs a complete macroscopic-normal derivation and planar
  convergence evidence. V3 has neither, so it cannot be promoted as the source-backed repair.
- **Implement the full nonlocal facet-vicinal model now.** Rejected for this phase: the source
  itself presents it as complex and exploratory, and Phase 2b only needs a falsifiable
  temperature-conditioned broad-facet model. Its omission is labeled, not hidden.
- **Adopt event-limited fill timing in the same change.** Deferred: clipping is measured, but
  causation is not. Combining independent changes would make a future pass uninterpretable.
- **Discard or invalidate the v3 failure.** Rejected: v3 ran its registered implementation and
  controls correctly. A later source defect limits interpretation; it does not erase evidence.
