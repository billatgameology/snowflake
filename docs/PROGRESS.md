# Progress — The Virtual Cloud Chamber

**This file is the project's state. Read it first, update it as you work, leave it true.**
Rules: [AGENTS.md](../AGENTS.md). Spec: [project charter.md](../project%20charter.md).

- **Current phase:** Phase 0 — Ground truth (reading, no project code)
- **Last updated:** 2026-07-14 by Claude Opus 4.8
- **Active plan:** [phase-0-snowcrystals-site-research.md](plans/phase-0-snowcrystals-site-research.md)

---

## Where we are

Pre-code. The charter (v1.0, July 2026) is written and the stack is decided: TypeScript + Vite,
WebGPU, stacked triangular lattice, CPU oracle + GPU production solver, five-part repo
(`core` / `solver-cpu` / `solver-gpu` / `runner` / `app`). None of that exists on disk yet.

The source material for Phase 0 is gathered in [research/](../research/):

- `GravnerGriffeath_PhysRevE09.pdf` — the mesoscopic CA model the solver's update cycle follows
- `1910.06389v2.pdf`, `1910.09067v2.pdf`, `1211.5555v1.pdf`
- "The Snowflake Myth" video transcript (`.vtt`, plain text, metadata)

The snowcrystals.com visual-resource catalog is being gathered under the active Phase 0 plan;
no claims from that source have been counted toward the reading gate yet.

> **Unverified:** how much of the §2.8 reading has actually been done, and whether the Phase 0
> exit criteria hold. The next session should ask the maker and replace this note with the
> answer — do not assume either way.

## Phase gates

Gates come from charter §3.2. A gate flips to ✅ only with a named metric, its value, and the
seed/resolution/command to reproduce it (AGENTS.md, Rule 6).

| Phase | Gate | Status |
|---|---|---|
| 0 | §2.8 exit criteria hold | ⬜ unverified |
| 1 | 2D spike answers "is designing a cloud journey engaging?" with evidence | ⬜ not started |
| 2 | Sixfold-symmetric plate; symmetry-error metric under threshold across a full run | ⬜ not started |
| 3 | Facet center visibly starves in the slice view while the plate grows | ⬜ not started |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds | ⬜ not started |
| 5 | GPU agrees with CPU oracle to tolerance; 256³ interactively editable | ⬜ not started |
| 6 | "≈ −5 °C" preset lands in the column-forming region by measurement, not hard-coding | ⬜ not started |
| 7 | Product layer | ⬜ not started |

## Decisions

Records live in [docs/decisions/](decisions/). None written yet — the two decisions already made
(web over native C++/CUDA; the five-part repo split) are recorded in charter §3.1 and need no
retroactive ADR. New decisions from here get one.

## Next step

Establish Phase 0's real status, then start Phase 1. Concretely:

1. Ask the maker how far §2.8's reading has gone and whether the exit criteria hold. Update the
   Phase 0 row above with the answer.
2. If Phase 0 holds: write `docs/plans/phase-1-ux-spike.md` from the template before writing any
   code. Phases 1 and 2 may run in parallel (§3.2).
3. Known trap, already in the charter: the Phase 1 spike is **throwaway**. It is a Reiter CA on a
   2D hex grid in a canvas, and it must be archived rather than extended — it must not quietly
   become the architecture.

Not a git repo yet (`git init` has not been run), so there is no history to consult and no
commits behind this file. Everything you need is in this directory.
