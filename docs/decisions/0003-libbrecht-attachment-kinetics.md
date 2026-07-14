# 0003 — Libbrecht's attachment kinetics drive the solver; G–G supplies the machinery

- **Date:** 2026-07-14
- **Status:** accepted
- **Charter impact:** §2.5, §2.6, §2.7, §1.5, §3.2 (Phases 2 and 6) and §3.3 amended in this
  session. This ADR **overrides** the charter's original "you will not implement these equations
  literally in v1."

## Context

The charter as written made Gravner–Griffeath the "implementation blueprint" (§2.6): its
threshold-based attachment rule *was* the model, and Libbrecht's physics was deferred to Phase 6
as a calibration layer. §2.5 said plainly: "You will not implement these equations literally in
v1."

That was a ship-it call, and on this point it under-served the project. The consequence nobody
had named:

**With G–G's knobs, Phase 6 is curve-fitting.** Sweep the parameter space, measure the
morphologies, paste a temperature axis onto the resulting atlas. G–G's solver contains no
temperature at all. You can reproduce the shapes on both sides of the Nakaya flip without
reproducing the reason for it, and when asked "why does it return to plates at −15 °C," the only
honest answer is "because a knob was tuned until it did."

**With Libbrecht's α, temperature is an input to the physics, so Phase 6 becomes falsifiable
validation.** Set −5 °C: does a column come out? Set −15 °C: does it flip back to plates? The
model can now be *wrong* — which is precisely what makes the experiment worth running. The
project stops being "pretty crystals with an honest disclaimer" and becomes an actual attempt at
the open loop described in §2.7.

## Decision

**One solver. G–G contributes the computational skeleton; Libbrecht contributes the attachment
physics.**

Keep, unchanged, from G–G — this is infrastructure, not physics, and it is the part that makes
3D crystal growth computable on a lattice at feasible cost:

- the stacked triangular lattice (`T × Z`, 6 + 2 neighbors)
- the quasi-static vapor diffusion step and its reflecting boundary
- the boundary / quasi-liquid mass field `b` (which is where Libbrecht's premelted layer lives)
- melting / sublimation
- exact mass bookkeeping
- **the noise term** — Libbrecht's equations are deterministic and supply no stochasticity;
  without noise, sidebranching never seeds

Replace, and only this:

- **the attachment thresholds `β(n_T, n_Z)`** → Libbrecht's Hertz–Knudsen kinetics,
  `v_n = alphaHK · v_kin · sigma_surf`, with the nucleation-limited form
  `alphaHK ≈ A·exp(−sigma_0 / sigma_surf)`, separate basal and prism coefficients, and
  (last, gated) SDAK's facet-width dependence.

Attachment sits behind an **`AttachmentRule` interface with two permanent implementations**,
`GGThreshold` and `LibbrechtKinetics`. Both are kept forever, in the same spirit as the CPU
oracle: the threshold rule is the working floor and the differential-diagnosis tool when the
physics misbehaves.

## Consequences

**What this buys.** Temperature enters the solver as a physical input rather than a label applied
afterward. Phase 6 becomes a test the model can fail. The §2.7 gap — no validated map from
(T, σ, p) to model parameters — becomes the thing the project attacks rather than the thing it
routes around.

**What it costs.**

- *The seam is not a drop-in.* G–G's attachment is a **binary cell flip**; Libbrecht's `v_n` is a
  **continuous velocity**. Converting between them is the actual work of Phase 2b.
- *Physical units enter the model.* Δx in microns, Δt in seconds, D in m²/s, and a CFL-like
  stability constraint on the diffusion step. **This is a gift, not a cost:** it yields a
  principled number of diffusion iterations per growth step — enough for the quasi-static field
  to relax — in place of the guess the charter previously waved at.
- *The model can now be wrong.* Deliberately. See above.

**What it forecloses.** Nothing, because `GGThreshold` survives. If `LibbrechtKinetics` fails to
reproduce the Nakaya flip, the project still has a working, beautiful crystal to ship — see the
Phase 2a guardrail in §3.2.

**Risk, sized honestly.** SDAK (α depending on facet *width*) is the least certain piece:
measuring local facet width on the lattice is a local geometric query over surface cells —
unpublished at this resolution, but not research-hard. Crucially, **it is not load-bearing for
the Phase 4 hollowing gate.** Hollowing is primarily the *Berg effect* — diffusion-limited vapor
starvation at facet centers — amplified by the nucleation-limited form `A·exp(−sigma_0/sigma_surf)`,
which is violently nonlinear in `sigma_surf`: a modest sag in center supersaturation drives
`alphaHK` toward zero at the center while the rim keeps growing. That mechanism is pure diffusion
plus faceting and survives dropping the width term entirely. SDAK buys the extreme thin plates
and needles, not basic hollowing. So the scary dependency is off the critical path, which is what
de-risks this whole decision.

## Alternatives considered

**Charter as written** (G–G thresholds for v1; Libbrecht at Phase 6). Lowest risk, ships a
growing 3D crystal soonest. Rejected because Phase 6 could then never be more than curve-fitting,
and the project's stated ambition (§2.7) would go unattempted. Retained in the codebase as
`GGThreshold`, so the risk reduction is kept without the ceiling.

**Libbrecht end-to-end** (build from §2.5's equations; treat G–G as background reading only).
Most faithful to the physical intent, rejected as a Phase 2. Libbrecht's published numerics
largely use reduced (near-cylindrical) geometry — they do not hand you a 3D lattice scheme, so
this amounts to inventing the computational method from scratch. It also discards the diffusion
step, mass bookkeeping, quasi-liquid field, and noise term, all of which do quiet, necessary work
and none of which are the part that was wrong.
