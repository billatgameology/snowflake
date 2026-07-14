# Progress — The Virtual Cloud Chamber

**This file is the project's state. Read it first, update it as you work, leave it true.**
Rules: [AGENTS.md](../AGENTS.md). Spec: [project charter.md](../project%20charter.md).

- **Current phase:** Phase 0 complete. Phases 1 (UX spike) and 2 (CPU solver) are next and may
  run in parallel (§3.2).
- **Last updated:** 2026-07-14 by Codex
- **Active plan:** [phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md) — written, not started

---

## Where we are

**Phase 0 is done** (maker-asserted, 2026-07-14 — see the gate table). Still pre-code: no
repository scaffold, no solver. The stack is decided in charter §3.1 — TypeScript + Vite, WebGPU,
stacked triangular lattice, CPU oracle + GPU production solver, five-part repo
(`core` / `solver-cpu` / `solver-gpu` / `runner` / `app`).

The durable output of Phase 0 is **[docs/gg-model.md](gg-model.md)** — the Gravner–Griffeath
update cycle and parameter table extracted from the Phys. Rev. E paper as an implementation spec.
Both solvers are written against it, and Phase 5's oracle-vs-GPU comparison checks against the
same definitions. **Read it before writing solver code.** It is level-1 (direct model state)
throughout: nothing in it is a physical claim.

Source material in [research/](../research/):

- `GravnerGriffeath_PhysRevE09.pdf` — the mesoscopic CA model the solver's update cycle follows
- `1910.06389v2.pdf`, `1910.09067v2.pdf`, `1211.5555v1.pdf` — the Libbrecht reading list
- "The Snowflake Myth" video transcript (`.vtt`, plain text, metadata)
- [`snowcrystals.com-videos.md`](../research/snowcrystals.com-videos.md) —
  10 lab-growth movies (16 resolution-specific MP4 links), one highest-available local MP4 of
  each movie, and original preview-image URLs (no local JPEG copies). Sources, byte sizes, media
  properties, and SHA-256 checksums are recorded in the index. Verified 2026-07-14. **Visual
  reference only** — no claim from it has been counted as evidence for any gate.

## Phase gates

Gates come from charter §3.2. A gate flips to ✅ only with a named metric, its value, and the
seed/resolution/command to reproduce it (AGENTS.md, Rule 6).

**Phase 0 is the one exception, by nature:** its exit criteria (§2.8) are knowledge checks — can
you sketch the Nakaya diagram from memory, write the G–G update loop as pseudocode, explain
hollowing without a hollowing rule, say which parts are physics and which are phenomenology. No
metric can test those. The maker is the only valid evidence source, and the maker asserted them
on 2026-07-14. Every gate from Phase 1 on is an automated metric, no exceptions (§3.3).

| Phase | Gate | Status |
|---|---|---|
| 0 | §2.8 exit criteria hold | ✅ maker-asserted, 2026-07-14 |
| 1 | 2D spike answers "is designing a cloud journey engaging?" with evidence | ⬜ not started |
| 2 | Sixfold-symmetric plate; symmetry-error metric under threshold across a full run | ⬜ plan written |
| 3 | Facet center visibly starves in the slice view while the plate grows | ⬜ not started |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds | ⬜ not started |
| 5 | GPU agrees with CPU oracle to tolerance; 256³ interactively editable | ⬜ not started |
| 6 | "≈ −5 °C" preset lands in the column-forming region by measurement, not hard-coding | ⬜ not started |
| 7 | Product layer | ⬜ not started |

## Decisions

Records live in [docs/decisions/](decisions/):

- [0001](decisions/0001-non-cubic-grid-dimensions.md) — grid dimensions are `(nx, ny, nz)`, not
  `N³`; charter §3.1/§3.2 updated to match
- [0002](decisions/0002-dev-hardware-split.md) — dev hardware is split: Mac for the solver, the
  RTX 4080 for GPU work and sweeps; charter §3.1 updated to match

The two decisions predating this system (web over native C++/CUDA; the five-part repo split) live
in charter §3.1 and get no retroactive ADR.

## Completed plans

- [phase-0-snowcrystals-site-research.md](plans/phase-0-snowcrystals-site-research.md) — ✅ done
  2026-07-14 (Codex). Catalogued the site's videos and archived the 10 highest-available MP4s.
  Preview-image source URLs remain documented, but the local JPEG copies were removed.

## Next step

Phase 0 is closed, so the next action is **Phase 1 or Phase 2 — they may run in parallel.**

**If picking up Phase 2 (the spine):** [plans/phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md)
is written and not started. Read [gg-model.md](gg-model.md) first, then the plan, then scaffold
the repo. First checkpoint is neighbor-symmetry unit tests on the stacked triangular lattice —
6 in-plane + 2 vertical, all 8 bonds unit length. Do not write solver code before those tests
pass in all directions (§3.2).

**If picking up Phase 1 (the spike):** no plan exists yet. Write `plans/phase-1-ux-spike.md` from
[the template](plans/_TEMPLATE.md) before any code. It is a Reiter CA on a 2D hex grid in a
canvas, plus an editable environmental timeline.

> **Trap, from the charter:** the Phase 1 spike is **throwaway**. It gets archived, not extended
> — it must not quietly become the architecture (§3.2). The CPU oracle from Phase 2, by contrast,
> is never deleted (§3.1).

**Housekeeping:** `git init` **has** now been run, but there are still **no commits** — so there is
no history behind any of these files and no way to recover a bad overwrite. Make the first commit
before the code lands.

> **Concurrency warning, learned the hard way on 2026-07-14:** two models (Codex and Claude) wrote
> this file within minutes of each other and one write was lost. If another session may be active,
> re-read `PROGRESS.md` immediately before writing it, and prefer a targeted edit over a full
> rewrite. The absence of commits makes a lost write unrecoverable.
