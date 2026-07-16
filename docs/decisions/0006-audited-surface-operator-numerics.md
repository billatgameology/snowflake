# 0006 — Audited surface-operator numerics: dual convergence, per-face fill, recorded flux identity

- **Date:** 2026-07-15
- **Status:** accepted (maker audit rounds 2–5, 2026-07-15). **Amends 0005** (D2 item 3, D3);
  does not supersede it.
- **Charter impact:** §2.4 ("How quasi-static is enforced") and §3.2 Phase 2b (units bullet,
  seam bullet) updated in this session (charter v1.3 → v1.4).

## Context

ADR 0005 defined the surface operator's shape and delegated its detailed physics to the §4.4
spec, but committed three numerics statements at charter level that the implementation audits
(rounds 2–4, catalogued in the Phase 2 plan's Tried and rejected) measured to be wrong or
dangerously under-specified:

1. **Residual-only convergence.** Iterate-change alone reported "converged" fields whose
   Dirichlet-shell vs Robin-sink imbalance *grew with domain size* (2.46e-6 at 32³ →
   8.85e-6 at 48³ at tol 1e-9), on course to fail the habit gate's own `< 1e-6` criterion at
   96³ while printing "converged" (round-3 audit).
2. **Uniform `v_n·Δt/Δx` fill, and a fill-CFL stated on scalar `v_n`.** The lattice cell is a
   hexagonal prism (across-flats = height = Δx): a prism face fills a cell at 2/3 the basal
   rate. Uniform fill overdrove lateral growth by 50% and quietly biased the habit gate — the
   "robust 1.77" warm-side ratio was ≈ 1.18 in volume terms (round-3 audit).
3. **"Vapor lost equals ice gained" as a bare equality promise.** Two defects hid under the
   slogan: saturation-clipped flux silently discarded when a cell's fill hit 1 mid-increment
   (a measured 35% ledger deficit on an ordinary step), and "metered-source" accounting that
   integrated relaxation-sweep clamp totals — quantities with **no physical duration** (the
   charter itself: physical time enters only through the interface update).

Rounds 2–4 corrected the implementation and the §4.4 spec, but the *charter* (§2.4, §3.2
Phase 2b) and ADR 0005 still specified the superseded numerics — and the charter governs, so
the implementation formally violated its highest-authority specification (round-5 blocker).
Rule 5: a change that contradicts the charter gets an ADR and a same-session charter edit.

## Decision

Under `LibbrechtKinetics`:

1. **Convergence is DUAL.** A relaxation is converged only when the iterate residual is under
   `relaxTol` AND the divergence identity — |far-field injection − Robin absorption| /
   absorption — is under `divTol`. Both tolerances are run inputs, recorded in checkpoint
   headers, and pinned by gate protocols. A solve failing the identity is not converged,
   whatever its residual says.
2. **Fill is per attached face, with the hexagonal-prism geometry factors.**
   `Δf = [(2/3)·n_T + n_Z] · alphaHK·v_kin·sigma_face·Δt/Δx`. The fill-CFL binds the
   per-cell summed *kinetic* increment; `Δt = cfl / max(rate)` adaptively. Hole-fill events
   remain outside the CFL claim, counted and deficit-ledgered separately (ADR 0005 D3's
   scalar `v_n·Δt/Δx` phrasing is re-stated accordingly).
3. **The mass claim is a flux identity over recorded terms, not an equality slogan.**
   `fill ledger + recorded saturation clipping = the per-face Hertz–Knudsen flux integral`,
   exact in ledger arithmetic and tested non-tautologically (recomputed outside the solver).
   The hole-fill deficit is reported separately; shell-clamp totals are numerical
   diagnostics only and never enter a mass claim. The *field sink* is a
   first-order-consistent discretization of the same Robin condition; its deviation from the
   converged-field uptake is a **computed diagnostic** with a pinned measured band, never
   claimed to be 1.
4. **Noise multiplies `alphaHK`,** identically in the Robin sink and the interface update for
   the same tick — never the growth side alone.

## Consequences

- The charter and ADR 0005 no longer promise numerics the audits measured to be wrong; the
  implementation, §4.4, the plan, and the charter state one model. The habit-gate protocol
  (v3) already pins the corrected numerics — this ADR changes no registered protocol.
- Cost: the seam is more complex than "add `v_n·Δt/Δx`" — the 2/3 face factor is one more
  lattice-specific constant that can rot. It is pinned by the area derivation in §4.4
  component 3 and by the non-tautological flux-integral test.
- Foreclosed: no future "simplification" back to uniform fill, residual-only convergence, or
  bare-equality mass claims without overturning *measured* audit findings — that requires its
  own ADR citing new evidence.

## Alternatives considered

- **Keep the charter text; treat the implementation as a documented deviation.** Rejected:
  the charter governs (PROGRESS header rule); a standing contradiction makes every downstream
  claim ambiguous about which spec it satisfies.
- **Revert the implementation to the charter's literal text.** Rejected: the audits measured
  the failures (domain-growing imbalance under residual-only convergence; 50% lateral
  overdrive; 35% silent ledger deficit). The charter text was the defect.
- **Force exact sink/growth equality instead of the recorded-identity + diagnostic split.**
  Rejected in round 3: the discrete stencil's absorbed quantity is not algebraically
  `alphaHK·sigma_face` at finite `Δx/X_0`; promising equality re-creates the overclaim. The
  honest object is the exact *ledger* identity plus the *measured* sink diagnostic.
