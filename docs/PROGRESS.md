# Progress — The Virtual Cloud Chamber

**This file is the project's state. Read it first, update it as you work, leave it true.**
Rules: [AGENTS.md](../AGENTS.md). Spec: [project charter.md](../project%20charter.md).

- **Current phase:** **Phase 1 is done** (gate maker-asserted 2026-07-15; spike archived under
  `spike/README.md`). **Phase 2a is gated (2026-07-15), through two review rounds:** an
  adversarial subagent review (six findings, fixed), then the maker's charter- and
  source-grounded audit, which confirmed the plate result genuine (independent recomputation
  from raw checkpoint bytes; independent re-implementation of the diffusion equations agreed
  to 1 ulp; no core solver defect) but found three evidence problems — non-enforcing gate
  tooling, an invalid needle run (past the 65% guard), and a mis-recorded 10k mass experiment.
  All three remediated same-day: the gate is now **enforced** (`--enforce-gate` exits 1;
  pinned by tests), the needle evidence comes from a valid far-field-stopped run, and the
  specified 10k grown mass test exists and passes. The maker also source-confirmed the needle
  finding: G-G's paper calls its needle a "slender hollow tube" — the pre-registered
  "hollowness ≈ 0" expectation was wrong, the measurement right. Phase 2b remains paused
  (ADR 0005).
- **Last updated:** 2026-07-15 by Claude Fable 5
- **Active plan:** [phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md) — rewritten for decision
  0003, synced to charter v1.2/v1.3, Scaffold + Stage 2a in progress. Hardened 2026-07-14 by an
  adversarial review pass (the plan's header lists what changed); the review's two blockers, so
  nobody re-trusts the old text: the seam's bookkeeping was being treated as settled while
  charter / gg-machinery / attachment-kinetics could not all be read literally at once — it is
  now explicitly unsettled, escalated by ADR 0005 into the required surface-operator spec; and
  the Dirichlet gate as charter-phrased could not fail (a uniform field is a fixed point under
  *both* boundary conditions) — the plan now carries a falsifiable depleted-start differential
  test.
- **Charter is at v1.3** (2026-07-14, decision
  [0005](decisions/0005-validation-scope-surface-operator-numerics.md) — maker review). The
  three big ones: Phase 6 input-provenance classes with an **in-sample/held-out split** (SDAK
  inputs are Nakaya-informed; matching Nakaya with them active is reproduction, not validation);
  the seam is a **coupled surface operator** and **Phase 2b is paused** until its spec and the
  parameter table exist; quasi-static numerics are an **elliptic residual solve**, not
  physical-time Jacobi sweeps (the "thousands of iterations means wrong units" claim is
  retracted). Plus: expanded Phase 6 freeze list + convergence controls; Phase 4 pass A blocking
  / pass B diagnostic; timeline semantics named an open decision; two-axis epistemic labels
  (Type × Evidence) replacing the four levels; Phase 3 gets a center-vs-rim depletion metric.
  If a doc contradicts the charter, the charter wins and the doc needs fixing, not vice versa.

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
melting, mass bookkeeping, and **the noise term** — status corrected by decision 0005: G-G's
published 3D snowfakes are deterministic, branches included; noise is their *proposed*
randomization (§VI.C) and our labeled dial for natural, asymmetric sidebranching, not an
existence requirement for branches. The surface exchange step is replaced **as a coupled whole**
(decision 0005 amending 0003 — "only the attachment thresholds" understated the seam). G-G's
rule lives on permanently as `GGThreshold`, the working floor and the control group.

**If you are holding a stale link to `gg-model.md`, stop** — it is a tombstone. The content split
into the two specs below.

## Where we are

**Phase 0 is done** (maker-asserted, 2026-07-14 — see the gate table). **Code now exists**
(2026-07-14): the npm workspace scaffold with `core` / `solver-cpu` / `runner` packages plus the
repo-root Rule 7 lint (`scripts/lint-rule7.mjs`), and the Phase 1 spike in `spike/` (outside the
workspace, by design). **Stage 2a is gated as of 2026-07-15** — the two red items resolved,
and both turned out to be the same Rule 1 pattern: *the handoff undersold the code, and the
code was right.* The D6h symmetry failure was the *domain shape*, not index arithmetic (a box
domain is geometrically incapable of exact D6h symmetry — rhombic footprint, and no center
plane when nz is even). The scaffold session had already found this on 2026-07-14 and built the
hexPrism-masked domain for it, but recorded the finding only in code comments while the handoff
said "not yet investigated"; the 2026-07-15 session verified the diagnosis by the triage
protocol (metric certified in isolation, box-scaling probes, hexPrism controls), fixed the gate
test onto hexPrism — threshold untouched at exactly 0 — and added a box negative-control test
pinning the geometry (full triage in the plan's Tried and rejected). The Rule 7 scan was
likewise already fixed at HEAD and was verified to still fail on real violations.
`npm test`: 69/69 green. **Phase 2b is paused** (decision 0005) pending its two
opening deliverables. The stack is
decided in charter §3.1 — TypeScript + Vite, WebGPU, stacked triangular lattice, CPU oracle +
GPU production solver, five-part repo (`core` / `solver-cpu` / `solver-gpu` / `runner` / `app`;
`solver-gpu` and `app` are reserved and uncreated).

The solver specs — **read the relevant one before writing solver code:**

- **[gg-machinery.md](gg-machinery.md)** — lattice, diffusion, state fields, mass bookkeeping,
  melting, noise, seed, guardrails, G-G's presets. Physics-agnostic infrastructure; computed
  state, Evidence: unvalidated (§1.5 v1.3 taxonomy) — nothing in it is a physical claim. §6
  (noise) is **extracted** (2026-07-14, from the paper's §VI.C, with the honesty note that G-G's
  published 3D results are deterministic and the randomization is their proposal).
- **[attachment-kinetics.md](attachment-kinetics.md)** — the attachment rule, `v_n = alphaHK ·
  v_kin · sigma_surf`. The only **physically parameterized** step of the update cycle
  (corrected v1.3: diffusion is physical too; κ, μ, hole-filling, noise are phenomenological).
  §4.2 now carries the **surface-operator spec requirement** (decision 0005 D2) and §4.3 the
  quasi-static formulation.
- **[libbrecht-parameters.md](libbrecht-parameters.md)** — σ₀(T), A(T), v_kin(T), D(T,P).
  **Currently empty by design.** One of Phase 2b's two opening deliverables (with the
  surface-operator spec). Every entry carries a provenance class (P1–P4) and canonical units —
  σ₀ is a dimensionless fraction, and percent-vs-fraction is a 100× exponent trap. No number
  enters it without a citation; a gap filled with a plausible value is a fabrication that would
  invalidate Phase 6 without anyone noticing.

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
| 1 | 2D spike answers "is designing a cloud journey engaging?" with evidence | ✅ **maker-asserted, 2026-07-15** — informal sessions, positive; the four-task protocol was *not* run (recorded honestly in the plan's Findings, with the Phase 7 takeaways) |
| **2a** | Sixfold-symmetric plate on G-G machinery; symmetry error **exactly 0** across a full run, noise off | ✅ **2026-07-15, enforced + maker-audited** — plate, seed 1, dims 128,128,64, hexPrism: delta check clean all 4800 ticks, full metric 0 everywhere sampled, AR 0.168831, drift 2.056e-13 (float floor 3.8e-16; 10k grown test 4.19e-14), far-field stop. Enforcing repro (exit 0 is the claim): `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. Maker independently re-derived the result from raw checkpoint bytes; the audit's three evidence defects are remediated (see the plan's Tried and rejected). Full record in [the plan](plans/phase-2-cpu-solver.md), Steps |
| **2b** | Habit changes with **temperature alone** — two temperatures, no other change, two habits (habit = pre-registered aspect-ratio thresholds at a stated crystal size — operationalized in the plan). Plus (v1.2): fixed-σ Dirichlet far field passes the plan's **depleted-start differential test** (the charter's "holds σ in a crystal-free run" phrasing is vacuous from a uniform start — see plan) | ⏸ **paused** (ADR 0005): surface-operator spec + parameter table first |
| 3 | Facet center starves in the slice view while the plate grows, **confirmed by the automated center-vs-rim depletion metric** (v1.3) | ⬜ not started |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds — **run twice, once per `AttachmentRule`**: pass A (`GGThreshold`) is **blocking**, pass B (`LibbrechtKinetics`) is **diagnostic** (v1.3) — a failed pass B is a finding, not a blocker for Phase 6 | ⬜ not started |
| 5 | GPU agrees with CPU oracle to tolerance **on both backends** (Metal and D3D12/Vulkan); preview budget (**≈8M cells**, not a cube — ADR 0001) interactively editable | ⬜ not started |
| 6 | Model's T-vs-σ morphology diagram compared against Nakaya's — **agreements and disagreements both reported**; no-SDAK and SDAK runs reported **separately**, SDAK-active comparisons labeled **in-sample**; independent validation on held-out observables (v1.3) | ⬜ not started |
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
- **[0005](decisions/0005-validation-scope-surface-operator-numerics.md) — validation scope, the
  coupled surface operator, quasi-static numerics** (maker review, 2026-07-14). Amends 0003.
  Phase 6 gets provenance classes and the in-sample/held-out split; **Phase 2b pauses** until the
  surface-operator spec and parameter table exist; the field solve is elliptic-with-residual, not
  per-sweep physical time. Charter v1.2 → v1.3 in the same session

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
- [phase-1-ux-spike.md](plans/phase-1-ux-spike.md) — ✅ done 2026-07-15. Spike built in
  `spike/` (outside the workspace), three maker-review fix rounds landed the replay-fidelity
  invariant (39 automated checks in `spike/check.mjs`), gate closed maker-asserted, spike
  archived with a freeze README. Findings: positive informal signal; protocol not run; Phase 7
  takeaways recorded in the plan (frozen-prefix timeline model works; replay honesty must be
  designed in from day one; slow ambient parameters make poor journey "drama" knobs).

## Next step

Phase 1 is closed (2026-07-15). **Phase 2a is gated (2026-07-15, enforced + maker-audited)** —
machinery proven, all four presets grown with 3/4 pre-registered inequality checks held
(needle-hollowness failed as a finding, and the maker source-confirmed the finding was right:
the paper's needle is a "slender hollow tube"), evidence in the plan's Steps. The work is now
**Phase 2b's two opening deliverables**, in order (ADR 0005 keeps 2b's code paused until both
exist):

1. **The surface-operator specification.** Open
   [attachment-kinetics.md](attachment-kinetics.md) §4.2 — it lists the six required components
   (ADR 0005 D2). This includes settling the seam's four bookkeeping sub-decisions *in writing*
   (plan, Approach item 4): where the fill fraction lives, what freezing/melting do under
   `LibbrechtKinetics`, what mass claim holds, and where `sigma_surf` reads from `d`. If the
   resolution departs from the charter's "reuses the boundary-mass machinery" wording, that is
   an ADR (Rule 5).
2. **The parameter table.** Fill [libbrecht-parameters.md](libbrecht-parameters.md) from
   arXiv:1910.09067 via the LLM bundle index
   ([1910.06389v2-llm.md](../research/1910.06389v2-llm.md)) — every number cited, provenance
   class P1–P4, canonical units; σ₀ percent-vs-fraction is a 100× trap. A gap is a finding; a
   plausible fill-in is a fabrication.
3. **Doc debt before 2b code starts:** the phase-2 plan's 2b section still predates ADR 0005
   (its "n_diff plausibility" step and "four sub-decisions" wording need reconciling with the
   ADR's elliptic-residual numerics decision).

Traps already known: the 19-site seed erratum (gg-machinery §5 — the paper says 20; do not
"fix" it back). The symmetry gate runs on the **hexPrism** domain — a box cannot pass it for
geometric reasons (plan, Tried and rejected); do not "simplify" the gate run back to a box.
Gate claims must come from `--enforce-gate` runs (exit code, not prose) — the runner without it
is a neutral instrument that exits 0 on asymmetric runs by design. A domain-contact-stopped
run's final metrics are **not valid evidence** (charter §3.1; the runner now warns — this
invalidated the first needle run). The needle preset grows a genuinely hollow tube (hollowness
0.074, bore = the 19-cell seed footprint; G-G's own words: "slender hollow tube"), so do not
use "needle hollowness ≈ 0" as an assumption anywhere downstream.
`out/*.ts` are untracked triage probes (symmetry, metric isolation, needle-bore diagnosis) —
usable, disposable, not part of the build.

Trap for whoever touches the timeline next (Phase 4, or Phase 7 thinking): timeline semantics
are an open decision (ADR 0005 D5) — changing temperature changes c_sat(T), so until the
conserved field and control semantics are written down, no timeline run carries a physical
reading.
