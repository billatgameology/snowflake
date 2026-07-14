# ⚠ This file has been split. Do not use it.

Superseded 2026-07-14 by decision
[0003](decisions/0003-libbrecht-attachment-kinetics.md). It described Gravner–Griffeath as the
whole model. **That is no longer the architecture**, and building from this file would produce a
solver with no temperature in it.

The content moved, in full, to two files with different truth status:

- **[gg-machinery.md](gg-machinery.md)** — lattice, diffusion, state fields, mass bookkeeping,
  melting, noise, seed, guardrails, presets. Kept from G-G, unchanged. Physics-agnostic.
- **[attachment-kinetics.md](attachment-kinetics.md)** — the attachment rule, now Libbrecht's
  `v_n = alphaHK · v_kin · sigma_surf`. This is the only step that is physics.
- **[libbrecht-parameters.md](libbrecht-parameters.md)** — the measured parameters. Empty; it is
  the first deliverable of Phase 2b.

G-G's threshold rule survives as `GGThreshold`, one of two permanent `AttachmentRule`
implementations, and remains the Phase 2a gate. Nothing was thrown away — it was demoted from
*the model* to *the machinery plus a reference attachment rule*.

This tombstone exists because several models work this repo concurrently and may hold a stale
link. Delete it once the repo has git history and the rename is traceable.
