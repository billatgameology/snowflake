# Frozen — Phase 1 UX spike (throwaway, do not extend)

This is the Phase 1 2D prototype: a Reiter cellular automaton with an editable environmental
timeline. **Phase 1 closed 2026-07-15** (gate maker-asserted — see the Findings section of
[docs/plans/phase-1-ux-spike.md](../docs/plans/phase-1-ux-spike.md), which is the record of
what this spike found and how it was verified).

Per the charter (§3.2, Phase 1): *"The code is then archived, not extended — it must not
quietly become the architecture."* The real solver lives in the workspace packages (`core/`,
`solver-cpu/`, `runner/`). Nothing imports from this directory, and nothing here imports from
the workspace. If a future question needs a 2D testbed, that is a new plan file and a conscious
decision — not a quiet reopening of this one.

To run it anyway (it still works): serve this directory statically —
`python3 -m http.server 8321 --directory spike` — and open `index.html`. `?compare=1` opens
compare mode. `node spike/check.mjs` runs the 39-check verification suite.

It is a toy model. The on-screen disclaimer is load-bearing: labels are metaphors, not physics.
