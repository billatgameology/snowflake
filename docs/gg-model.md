# ⚠ This file has been split. Do not use it.

Superseded 2026-07-14 by decision
[0003](decisions/0003-libbrecht-attachment-kinetics.md). It described Gravner–Griffeath as the
whole model. **That is no longer the architecture**, and building from this file would produce a
solver with no temperature in it.

The content moved, in full, to two files with different truth status:

- **[gg-machinery.md](gg-machinery.md)** — lattice, diffusion, state fields, mass bookkeeping,
  melting, noise, seed, guardrails, presets. `GGThreshold` keeps the published cycle unchanged;
  `LibbrechtKinetics` shares the lattice/stencil but has the §4.4 coupled disposition. Diffusion
  is physical transport; the G-G surface knobs are phenomenological.
- **[attachment-kinetics.md](attachment-kinetics.md)** — the attachment rule, now Libbrecht's
  `v_n = alphaHK · v_kin · sigma_surf`. It is the physically parameterized surface-exchange
  step; diffusion remains physical transport.
- **[libbrecht-parameters.md](libbrecht-parameters.md)** — the extracted, cited parameter mapping
  used by Phase 2b.

G-G's threshold rule survives as `GGThreshold`, one of two permanent `SurfaceOperator`
implementations, and remains the Phase 2a gate. Nothing was thrown away — it was demoted from
*the model* to *the machinery plus a reference attachment rule*.

This permanent tombstone exists because several models work this repo concurrently and may hold
a stale link. Keep it: the warning is cheaper and safer than relying on history discovery.
