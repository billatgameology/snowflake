# 0011 — Phase 4 timeline conserves vapor density across abrupt environment events

- **Date:** 2026-07-16
- **Status:** accepted; trigger-boundary ambiguity clarified after WP0 review on 2026-07-16
- **Charter impact:** §3.2 Phase 4 updated in this session (charter v1.8 → v1.9). This resolves
  decision 0005 D5 and corrects the capped-column history from plate→column to column→plate.

## Context

Decision 0005 deliberately left timeline semantics open because a temperature change alters
the saturation vapor density over ice. Holding the stored supersaturation field fixed would
therefore create or remove vapor throughout the domain. The two permanent surface operators
also store fields with different meanings: G-G `d` is phenomenological diffusive mass, while
LK `sigma` is physical supersaturation relative to ice.

The charter contained a second, independent contradiction. It asked a plate→column history to
produce a capped column, but G-G §XII grows the axial shaft first under column-promoting
conditions and then grows plates at its ends. A plate cannot retroactively become that shaft.
The source, the product example in §1.1, and the geometry all require column→plate.

## Decision

### 1. Timeline events and triggers

Phase 4 supports deterministic, abrupt events only. A schedule names its operator, initial
environment, event index, exact trigger (`tick`, largest extent, transverse extent, or z
extent), and complete post-event environment. The counter is completed solver cycles: a
`tick=N` event fires at the boundary where exactly N cycles have completed, before the **next**
cycle's relaxation, so tick 0 precedes the first solver step. An extent trigger is observed only
after a complete interface step and fires before the next relaxation/update cycle.

Duplicate trigger declarations are rejected during validation. If multiple unfired events
become eligible at one cycle boundary—including distinct extent thresholds crossed by one
simultaneous attachment batch, or a tick event coinciding with a queued extent event—the run
fails as ambiguous before any event mutates state. Phase 4 does not infer an order. Ramps and
interpolation are unsupported.

The capped-column milestone and charter are corrected to **column→plate**. Pass A uses the
source-cited G-G §XII jump after a column has formed. Pass B uses a cold column-candidate stage
followed by a warmer plate-candidate stage; its morphology remains diagnostic.

### 2. G-G events change parameters, not state

G-G timeline controls are phenomenological parameter vectors, not temperature or physical
humidity. At an event the registered parameters are replaced atomically. The `a`, `b`, and `d`
arrays are bit-unchanged; no field is reconstructed or rescaled. When `rho` and `phi` are not
changed, `Sigma(b+d)` is bit-continuous at the event and retains the reflecting-run invariant.
The event itself consumes no tick and performs no solver substep.

### 3. LK events conserve interior absolute vapor number density

For an active, unattached vapor cell, the stored value represents

```text
c = (1 + sigma) * cSat(T)
```

where `c` is absolute vapor number density and `cSat(T)` is saturation number density over ice.
At an abrupt temperature event, `c` is the conserved interior quantity. Before any relaxation
or surface advance at the new environment, every active unattached cell is transformed by

```text
sigmaNew = (1 + sigmaOld) * cSat(oldT) / cSat(newT) - 1
```

Attached cells and inactive hex-prism wall cells are excluded. The affine result is not clamped:
a negative value truthfully represents subsaturation, and the existing kinetic law already
gives it zero growth demand rather than inventing vapor.

### 4. The far-field reservoir remains an explicit control

The active Dirichlet shell undergoes the same density-conserving transform so the event has an
auditable before/after state. The next elliptic solve then clamps it to the schedule's explicit
new `sigmaInfinity`. That clamp is external-reservoir exchange and is reported with the
existing numerical boundary diagnostics; it is not kinetic uptake, deposited ice, or part of
the interface-demand identity. A reflecting LK history remains diagnostic-only under decision
0006 and gains no physical claim from this timeline rule.

### 5. Environment-derived values and ledgers update atomically

The event atomically replaces temperature and any explicitly scheduled far-field control, then
recomputes all temperature-derived quantities used by relaxation and growth: `vKin`, `X0`,
`M_ice`, and basal/prism `alphaHK` kinetics. Grid spacing, pressure, surface policy, seed, and
convergence controls do not change unless a future versioned protocol explicitly permits them.
No interface step may observe a mixture of old and new derived values.

Dimensionless fill `f`, attached state, physical time, and cumulative ice-cell demand are not
rescaled at an event. Fixed-temperature vapor-equivalent bookkeeping currently multiplies fill
by `M_ice(T)`; a history instead accumulates each step's increment with that step's temperature.
Multiplying the entire history by the final `M_ice` is invalid. The cross-temperature total is
labeled a sum of step-local vapor-equivalent units, not a conserved absolute-vapor pool; the
density transform and reservoir diagnostics are reported separately.

### 6. Replay and checkpoint scope

The schedule and fired-event log are evidence inputs. Reports record both environments, trigger
observation, event index, before/after field hashes, and the derived constants used after each
event. Existing GG v1 and LK v1/v2 checkpoint meanings do not change. Phase 4 may write
final-state checkpoints with an external schedule manifest; resumable mid-history checkpoints
would require a new version, schedule cursor, mutation tests, and a separate decision.

## Consequences

- Buys: temperature changes no longer silently synthesize domain-wide vapor; G-G and LK each
  have operator-honest event semantics; the capped-column experiment matches its source.
- Costs: LK events require an O(domain) affine field transform and a fresh elliptic solve. The
  explicit far-field reservoir can add or remove vapor after the transform, so the event log
  must keep that diagnostic separate from conserved-interior and kinetic-demand statements.
- Limits: only jumps are defined. There is no claim that an abrupt event approximates a smooth
  cloud trajectory, and no timeline result upgrades the model's validation evidence.
- Forecloses: reinterpreting G-G `d` as physical supersaturation, holding LK `sigma` fixed
  through temperature changes, clamping transformed subsaturation to zero, or multiplying all
  historical fill by the final temperature's conversion factor.

## Alternatives considered

- **Keep stored LK supersaturation fixed** — rejected because `cSat(T)` changes; absolute vapor
  would jump in every cell without a transport or reservoir mechanism.
- **Conserve relative supersaturation and call the difference a reservoir impulse** — rejected
  because that hides a domain-wide source inside a control-label change rather than at the
  explicit far-field boundary.
- **Rescale G-G `d` with the LK formula** — rejected: it is a different model field with no
  temperature or saturation-density semantics.
- **Clamp negative transformed values** — rejected because it creates vapor exactly where the
  conservation transform predicts subsaturation.
- **Implement ramps now** — deferred. A ramp needs a time-interpolation contract, event ordering
  within relaxation/interface steps, and replay/checkpoint state that Phase 4 does not require.
- **Retain plate→column wording** — rejected as inconsistent with G-G §XII, the intended capped
  morphology, and the charter's own product example.
