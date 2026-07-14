# Progress — The Virtual Cloud Chamber

**This file is the project's state. Read it first, update it as you work, leave it true.**
Rules: [AGENTS.md](../AGENTS.md). Spec: [project charter.md](../project%20charter.md).

- **Current phase:** Phase 0 complete. Phases 1 (UX spike) and 2 (CPU solver) are next and may
  run in parallel (§3.2).
- **Last updated:** 2026-07-14 by Claude Opus 4.8
- **Active plan:** [phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md) — rewritten for decision
  0003, not started

---

## ⚠ The architecture changed on 2026-07-14 — read this before anything else

**Decision [0003](decisions/0003-libbrecht-attachment-kinetics.md): Libbrecht's attachment
kinetics drive the solver; Gravner–Griffeath supplies the machinery.** The charter previously
made G-G the whole model and deferred Libbrecht's physics to a Phase 6 "calibration layer." The
maker overruled that, before any code was written.

Why it matters, in one line: **G-G's solver contains no temperature**, so Phase 6 could only ever
have been curve-fitting — sweep the knobs, paste a temperature axis onto the atlas. With
Libbrecht's α, temperature is an *input to the physics*, so **Phase 6 becomes a test the model can
fail.** That is the point. The project stops being "pretty crystals with an honest disclaimer" and
becomes an actual attempt at the open loop in charter §2.7.

What survives from G-G, unchanged: the lattice, diffusion, the boundary/quasi-liquid mass field,
melting, mass bookkeeping, and — load-bearing and easy to overlook — **the noise term** (Libbrecht's
equations are deterministic; without noise, sidebranching never seeds). Only the attachment
thresholds are replaced. G-G's rule lives on permanently as `GGThreshold`, the working floor and
the control group.

**If you are holding a stale link to `gg-model.md`, stop** — it is a tombstone. The content split
into the two specs below.

## Where we are

**Phase 0 is done** (maker-asserted, 2026-07-14 — see the gate table). Still pre-code: `git init`
has been run but there is **no scaffold and no solver**. The stack is decided in charter §3.1 —
TypeScript + Vite, WebGPU, stacked triangular lattice, CPU oracle + GPU production solver,
five-part repo (`core` / `solver-cpu` / `solver-gpu` / `runner` / `app`).

The solver specs — **read the relevant one before writing solver code:**

- **[gg-machinery.md](gg-machinery.md)** — lattice, diffusion, state fields, mass bookkeeping,
  melting, noise, seed, guardrails, G-G's presets. Physics-agnostic infrastructure. Level 1
  throughout; nothing in it is a physical claim. ⚠ **§6 (noise) is a known hole** — not yet
  extracted from the paper, and it blocks the Phase 2a gate.
- **[attachment-kinetics.md](attachment-kinetics.md)** — the attachment rule, `v_n = alphaHK ·
  v_kin · sigma_surf`. **The only step of the update cycle that is physics.**
- **[libbrecht-parameters.md](libbrecht-parameters.md)** — σ₀(T), A(T), v_kin(T), D(T,P).
  **Currently empty by design.** First deliverable of Phase 2b. No number enters it without a
  citation; a gap filled with a plausible value is a fabrication that would invalidate Phase 6
  without anyone noticing.

**Symbol ban, now a standing rule (AGENTS.md Rule 7, charter §3.3):** a bare `alpha` is banned
repo-wide. Libbrecht's attachment coefficient and G-G's attachment threshold are unrelated
quantities both conventionally written α, and they appear in the same update step. Use `alphaHK*`
and `ggThresh*`. Enforce by lint, not vigilance.

Source material in [research/](../research/):

- `GravnerGriffeath_PhysRevE09.pdf` — the mesoscopic CA model the solver's update cycle follows
- `1910.06389v2.pdf`, `1910.09067v2.pdf`, `1211.5555v1.pdf` — the Libbrecht reading list
- "The Snowflake Myth" video transcript (`.vtt`, plain text, metadata)
- [`snowcrystals.com-videos.md`](../research/snowcrystals.com-videos.md) —
  10 lab-growth movies (16 resolution-specific MP4 links), one highest-available local MP4 of
  each movie, and original preview-image URLs (no local JPEG copies). Sources, byte sizes, media
  properties, and SHA-256 checksums are recorded in the index. Verified 2026-07-14. **Visual
  reference only** — no claim from it has been counted as evidence for any gate.

> ⚠ **`research/` media is on disk but NOT in git** (decision
> [0004](decisions/0004-research-media-not-versioned.md)). It is Libbrecht's copyrighted work, and
> committing it would publish it on the first push. **A fresh clone will not have the videos, PDFs,
> or transcript** — re-download them from the URLs in the `.md` indexes and verify against the
> recorded SHA-256s. The indexes are tracked; the media is gitignored. Do not `git add -f` it back.

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
| **2a** | Sixfold-symmetric plate on G-G machinery; symmetry error **exactly 0** across a full run, noise off | ⬜ plan written |
| **2b** | Habit changes with **temperature alone** — two temperatures, no other change, two habits | ⬜ plan written |
| 3 | Facet center visibly starves in the slice view while the plate grows | ⬜ not started |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds | ⬜ not started |
| 5 | GPU agrees with CPU oracle to tolerance; 256³ interactively editable | ⬜ not started |
| 6 | Model's T-vs-σ morphology diagram compared against Nakaya's — **agreements and disagreements both reported** | ⬜ not started |
| 7 | Product layer | ⬜ not started |

Phase 2 is now **2a (machinery) / 2b (physics)**, and Phase 6 is **validation, not calibration** —
both from decision 0003. The governing rule for 2a→2b is *never physics ahead of the machinery*: a
physics bug on an unproven lattice is two bugs wearing one coat.

**Phase 6 may legitimately fail.** If the model does not reproduce the Nakaya habit reversals,
that is a finding, it gets reported as one, and Phase 2a's `GGThreshold` still ships a beautiful
crystal. What is forbidden is quietly tuning until the diagram matches and calling it validation.

## Decisions

Records live in [docs/decisions/](decisions/):

- [0001](decisions/0001-non-cubic-grid-dimensions.md) — grid dimensions are `(nx, ny, nz)`, not
  `N³`; charter §3.1/§3.2 updated to match
- [0002](decisions/0002-dev-hardware-split.md) — dev hardware is split: Mac for the solver, the
  RTX 4080 for GPU work and sweeps; charter §3.1 updated to match
- **[0003](decisions/0003-libbrecht-attachment-kinetics.md) — Libbrecht's attachment kinetics
  drive the solver; G-G supplies the machinery.** The load-bearing one. Charter §1.5, §2.5, §2.6,
  §2.7, §3.2 (Phases 2 and 6) and §3.3 all amended to match
- [0004](decisions/0004-research-media-not-versioned.md) — `research/` media is not versioned; its
  `.md` index is. Libbrecht's copyrighted videos were purged from history before the first push

The two decisions predating this system (web over native C++/CUDA; the five-part repo split) live
in charter §3.1 and get no retroactive ADR.

## Completed plans

- [phase-0-snowcrystals-site-research.md](plans/phase-0-snowcrystals-site-research.md) — ✅ done
  2026-07-14 (Codex). Catalogued the site's videos and archived the 10 highest-available MP4s.
  Preview-image source URLs remain documented, but the local JPEG copies were removed.

## Next step

Phase 0 is closed, so the next action is **Phase 1 or Phase 2 — they may run in parallel.**

**If picking up Phase 2 (the spine):** [plans/phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md)
is written and not started. Read [gg-machinery.md](gg-machinery.md) and
[attachment-kinetics.md](attachment-kinetics.md) first, then the plan, then scaffold the repo.
First checkpoint is neighbor-symmetry unit tests on the stacked triangular lattice — 6 in-plane +
2 vertical, all 8 bonds unit length. Do not write solver code before those tests pass in all
directions (§3.2).

**If picking up Phase 1 (the spike):** no plan exists yet. Write `plans/phase-1-ux-spike.md` from
[the template](plans/_TEMPLATE.md) before any code. It is a Reiter CA on a 2D hex grid in a
canvas, plus an editable environmental timeline.

> **Trap, from the charter:** the Phase 1 spike is **throwaway**. It gets archived, not extended
> — it must not quietly become the architecture (§3.2). The CPU oracle from Phase 2, by contrast,
> is never deleted (§3.1).

**Housekeeping:** `git init` has been run and the repo now has its **first real commit** (the docs,
governance files, and ADR 0004; the 277 MB of `research/` media was purged from history first and
is gitignored). There is now history to recover from — but still no remote, so a push has not
happened and the copyright exposure that 0004 addresses stays contained until one is added.

> **Concurrency warning, learned the hard way on 2026-07-14:** two models (Codex and Claude) wrote
> this file within minutes of each other and one write was lost. If another session may be active,
> re-read `PROGRESS.md` immediately before writing it, and prefer a targeted edit over a full
> rewrite. **A live Codex session was active during the 2026-07-14 history-purge** — its
> uncommitted 149-line working copy of this file was reverted by `git filter-repo`'s hard reset and
> restored from the acting model's context. If two agents may be editing, coordinate before any
> history rewrite; a rewrite resets the working tree and discards everyone's uncommitted changes.
