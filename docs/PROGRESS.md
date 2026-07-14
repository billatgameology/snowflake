# Progress — The Virtual Cloud Chamber

**This file is the project's state. Read it first, update it as you work, leave it true.**
Rules: [AGENTS.md](../AGENTS.md). Spec: [project charter.md](../project%20charter.md).

- **Current phase:** Phase 0 complete. Phases 1 (UX spike) and 2 (CPU solver) are next and may
  run in parallel (§3.2). Plans exist for both; neither is started.
- **Last updated:** 2026-07-14 by Claude Fable 5
- **Active plans:** [phase-1-ux-spike.md](plans/phase-1-ux-spike.md) — written, not started;
  [phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md) — rewritten for decision 0003, synced to
  charter v1.2, not started. **Both hardened 2026-07-14 by an adversarial review pass** (each
  plan's header lists what changed). The two blockers it found, so nobody re-trusts the old
  text: the seam's bookkeeping was being treated as settled while charter / gg-machinery /
  attachment-kinetics could not all be read literally at once — it is now explicitly unsettled,
  four written sub-decisions required before the seam is coded; and the Dirichlet gate as
  charter-phrased could not fail (a uniform field is a fixed point under *both* boundary
  conditions) — the plan now carries a falsifiable depleted-start differential test.
- **Charter is at v1.2** (2026-07-14, review integration): far-field boundary conditions (§2.4),
  domain-contact guard and determinism scope (§3.1), Phase 4 dual-pass, Phase 6 protocol freeze,
  the seam's reference implementation, cube-speak and citation-source fixes. **Docs and plans
  were synced to v1.2 on 2026-07-14** — if you are reading a doc that contradicts the charter,
  the charter wins and the doc needs fixing, not vice versa.

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
- [`1910.06389v2-llm.md`](../research/1910.06389v2-llm.md) — reproducible index for the local,
  gitignored LLM bundle of the 523-page monograph: searchable page text, 376 condition-aware
  figure cards, and 279 rendered evidence pages. Strict integrity check passed on 2026-07-14;
  generated full-content derivatives remain untracked under decision 0004.
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

**Phases 0 and 1 are the two exceptions, by nature.** Phase 0's exit criteria (§2.8) are
knowledge checks — can you sketch the Nakaya diagram from memory, write the G–G update loop as
pseudocode, explain hollowing without a hollowing rule, say which parts are physics and which are
phenomenology. No metric can test those; the maker is the only valid evidence source, and the
maker asserted them on 2026-07-14. Phase 1's gate is a **UX finding**, not a scientific
milestone — its evidence is the maker's written play-session notes per the protocol in
[phase-1-ux-spike.md](plans/phase-1-ux-spike.md), plus saved history artifacts. Every
*scientific* gate — Phase 2a onward — is an automated metric, no exceptions (§3.3).

| Phase | Gate | Status |
|---|---|---|
| 0 | §2.8 exit criteria hold | ✅ maker-asserted, 2026-07-14 |
| 1 | 2D spike answers "is designing a cloud journey engaging?" with evidence | ⬜ plan written |
| **2a** | Sixfold-symmetric plate on G-G machinery; symmetry error **exactly 0** across a full run, noise off | ⬜ plan written |
| **2b** | Habit changes with **temperature alone** — two temperatures, no other change, two habits (habit = pre-registered aspect-ratio thresholds at a stated crystal size — operationalized in the plan). Plus (v1.2): fixed-σ Dirichlet far field passes the plan's **depleted-start differential test** (the charter's "holds σ in a crystal-free run" phrasing is vacuous from a uniform start — see plan) | ⬜ plan written |
| 3 | Facet center visibly starves in the slice view while the plate grows | ⬜ not started |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds — **run twice, once per `AttachmentRule`** (v1.2): pass A certifies machinery+metrics under `GGThreshold`, pass B sweeps temperature under `LibbrechtKinetics` | ⬜ not started |
| 5 | GPU agrees with CPU oracle to tolerance **on both backends** (Metal and D3D12/Vulkan); preview budget (**≈8M cells**, not a cube — ADR 0001) interactively editable | ⬜ not started |
| 6 | Model's T-vs-σ morphology diagram compared against Nakaya's — **agreements and disagreements both reported** | ⬜ not started |
| 7 | Product layer | ⬜ not started |

Phase 2 is now **2a (machinery) / 2b (physics)**, and Phase 6 is **validation, not calibration** —
both from decision 0003. The governing rule for 2a→2b is *never physics ahead of the machinery*: a
physics bug on an unproven lattice is two bugs wearing one coat.

**Phase 6 may legitimately fail.** If the model does not reproduce the Nakaya habit reversals,
that is a finding, it gets reported as one, and Phase 2a's `GGThreshold` still ships a beautiful
crystal. What is forbidden is quietly tuning until the diagram matches and calling it validation —
and as of charter v1.2 this is **structural, not aspirational**: the parameter table and the
validation protocol **freeze before the first sweep** (pre-registration); any post-freeze edit
requires a logged ADR and invalidates prior sweep results.

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
- [research-snow-crystals-llm-bundle.md](plans/research-snow-crystals-llm-bundle.md) — ✅ done
  2026-07-14 (Codex). Generated a 327 MB local bundle covering 523/523 pages and 376 figures;
  the strict checker passed with 279 rendered evidence pages and a 12-card visual QA sample.
  Next use is cited retrieval for the Phase 2b parameter table, not automatic claim acceptance.

## Next step

Phase 0 is closed and both plans are written, so the next action is **start building Phase 1 or
Phase 2a — they may run in parallel** (§3.2). Cold-start instructions for each:

- **Phase 1:** open [phase-1-ux-spike.md](plans/phase-1-ux-spike.md), build in `spike/` at the
  repo root — deliberately *outside* the npm workspace, plain JS, zero dependencies. Traps
  already known: Reiter's parameters are conventionally α/β/γ — a *third* unrelated α; Rule 7
  applies even to throwaway code (`reiterAlpha`, `reiterBeta`, `reiterGamma`). No physical labels
  on the sliders (§1.5 has no prototype exemption). And Reiter's diffusion runs on **every** cell
  including receptive ones (the plan spells out the exact update rule) — diffusing only
  non-receptive cells silently kills branching and will look like a parameter problem.
- **Phase 2a:** open [phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md), start at the Scaffold
  steps (npm workspaces, strict TS, Vitest, the Rule 7 lint check, **counter-based** seeded PRNG
  in `core`). Trap already known: **gg-machinery §6 (the noise term) is still a hole** — it has
  not been extracted from `research/GravnerGriffeath_PhysRevE09.pdf`, it blocks the 2a gate, and
  skipping it will present later as a fake physics failure in 2b. Extract it early, not last.
  Second trap: the 19-site seed erratum (gg-machinery §5) — the paper says 20; do not "fix" it
  back. Third trap (2b, not 2a): **the seam's bookkeeping is deliberately unsettled** — four
  written sub-decisions (plan, Approach item 4) come before any `LibbrechtKinetics` code.

Whichever starts first, flip its plan's **Status** to *in progress* and update this file.
