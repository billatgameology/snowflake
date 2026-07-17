# Progress — The Virtual Cloud Chamber

**This file is the project's state. Read it first, update it as you work, leave it true.**
Rules: [AGENTS.md](../AGENTS.md). Spec: [project charter.md](../project%20charter.md).

- **Current phase:** **Phase 1 is done** (gate maker-asserted 2026-07-15; spike archived under
  `spike/README.md`). **Phase 2a is COMPLETE — maker-asserted 2026-07-15**, closed after six
  adversarial review rounds (three subagent, three maker; the full defect-and-remediation
  history is in the plan's Tried and rejected). The gate is *enforcing*: `--enforce-gate`
  checks twelve criteria and exit 0 is the whole claim; the maker independently recomputed the
  plate result from raw checkpoint bytes and found no core solver defect. A follow-up senior
  evidence review closed four residual boundary defects: malformed GG checkpoint arrays could
  shift fields, non-finite seeds and oversized noise could enter evidence metadata/state, and
  parameter-key aliases could counterfeit seven slots. The post-fix canonical run remains
  byte-identical to the accepted checkpoint. **Phase 2b: spec +
  parameter table + implementation exist and have been through SIX maker audit rounds
  (2026-07-15)** — round 2: seven blockers, gate v1 killed; round 3: three blockers +
  closure blocker, gate v2 killed; round 4: physics fixes verified correct but the
  plan/spec still encoded the superseded model (blocker) plus evidence should-fixes;
  round 5: the same staleness one authority level up — the CHARTER (§2.4, Phase 2b) and
  ADR 0005 still specified residual-only convergence, uniform fill, and bare-equality mass
  claims → **ADR 0006 + charter v1.4**, plus evidence-strictness should-fixes (LK decode
  validation with tests, diagnostic scope overstatement, stale public field docs); round 6
  found two surviving spec contradictions plus incomplete writer-side checkpoint validation;
  its final pass also found raw-positive controls whose derived SI scales underflowed or
  overflowed, plus two committed tests that did not enforce the nonuniform Robin limit or the
  load-bearing `divTol` criterion. All are now remediated in the round-6 commit containing this
  update, with symmetric encode/decode/solver validation, non-vacuous negative controls,
  and a full authority-chain truth pass. Decision 0009's v4 implementation is now complete:
  explicit coupled policy routing, the post-smoother aggregate boundary condition, unit
  `G_b/H_b` fill, v2 checkpoints, and fail-closed gate validation. After integration with the
  completed Phase 3 implementation, `npm test` is 278/278 after the WP0 negative-
  supersaturation fix, including typecheck and the Rule 7
  scan. The full catalogs live in the plans' Tried and rejected sections.
  **Phase 2b is NOT closed. Protocol v3 is now an execution-valid recorded negative result for
  the exact registered v3 implementation:** the
  flagless gate completed and exited 1; the −5 °C run passed its plate threshold, while the
  −15 °C run produced the same one-layer plate instead of the registered column. All enforced
  non-habit criteria passed. This is a failed gate, not missing or invalidated evidence; no
  passing Phase 2b habit result exists. **Decision 0009 and charter v1.7 now adopt the
  source-constrained aggregate `[HV]` boundary-pixel repair, and protocol v4 is committed in
  the active plan before implementation-driven morphology.** V4 code and non-morphology
  controls now pass; `legacy-v3` remains only as an explicit reproduction path. The flagless
  v4 habit run is executing in its isolated Phase 2b worktree and remains the Phase 2b closure
  item; its process and artifacts are untouchable from this worktree.
- **Last updated:** 2026-07-16 by Codex
- **Phase 4 is active under maker-directed decision
  [0010](decisions/0010-phase4-overlaps-pending-phase3-and-phase2b-evidence.md)** (charter
  v1.8), in isolated worktree `/Users/clipper/github/snowflake-phase4`. Its passing criteria
  were committed at `23b5d6c` before the first development agent; accepted Phase 2b v4 was
  integrated at `b080654`; 276/276 tests pass. Decision
  [0011](decisions/0011-phase4-timeline-environment-semantics.md) (charter v1.9) now resolves
  the timeline contract and corrects the capped history to column→plate. Active plan:
  [phase-4-morphology-gauntlet.md](plans/phase-4-morphology-gauntlet.md). WP0's independent
  integration review found three blockers and four should-fixes before feature implementation;
  re-review verified those fixes, then caught a noisy-ensemble symmetry contradiction and tick-
  boundary wording ambiguity. A third round caught a vacuous applied-noise witness and frozen-
  checkpoint wording conflict. All were fixed before feature work; round 4 reported CLEAN with
  zero blockers/should-fixes, 278/278 tests, and a green app build. WP1 implementation is now
  complete at review commit `7af3f2e`: exact lattice/cap metrics, a strict operator-tagged
  abrupt timeline cursor, and fail-closed A/B/visual criterion contracts passed 364/364 tests
  and the app production build. Independent WP1 review round 1 nevertheless found three
  blockers and four should-fixes: late/forged cursor history, assertion-only target crossings,
  self-reported hollowing and replay aliasing, plus finite/negative-zero/snapshot/test-coverage
  hardening. The fix/retest/re-review loop is active. No solver, app, or external evidence
  artifact changed in WP1.
- **Phase 3 started 2026-07-15 under decision
  [0007](decisions/0007-phase3-overlaps-2b-evidence-run.md)** (charter v1.5): maker-directed
  overlap with the tail of the v3 evidence run. Decision
  [0008](decisions/0008-phase3-completes-after-2b-exit.md) (charter v1.6) then authorized
  condition-independent completion. Phase 3 is now evidence-complete and awaiting maker
  assertion; its plan is:
  [phase-3-dev-visualization.md](plans/phase-3-dev-visualization.md) — criteria-first,
  serial dev/review subagent work packages; the completed gate2b evidence remains immutable.
- **Concurrent plan (2b):** [phase-2-cpu-solver.md](plans/phase-2-cpu-solver.md) — rewritten for decision
  0003 and synced through charter v1.7. Scaffold + Stage 2a complete; Stage 2b's v3 contract and
  negative result remain explicit history, while decision
  [0009](decisions/0009-source-constrained-boundary-pixel-policy.md) settles the reopened
  classifier/geometry seam as the versioned `aggregate-hv-g1h1-v4` policy and pre-registers
  its flagless pair. The "n_diff
  plausibility" step is retracted-as-specified, replaced by fill-CFL + worked Péclet
  arithmetic). Still true from the 2026-07-14 hardening: the charter v1.2 Dirichlet wording
  could not fail (a uniform field is a fixed point under *both* boundary conditions). Charter
  v1.4 now carries the plan's falsifiable depleted-start differential test.
- **Charter is at v1.9** (2026-07-16): decision
  [0011](decisions/0011-phase4-timeline-environment-semantics.md) resolves abrupt operator-
  specific timeline events and the source-correct column→plate capped history; decision
  [0010](decisions/0010-phase4-overlaps-pending-phase3-and-phase2b-evidence.md) authorizes the
  isolated Phase 4 overlap. Before those, v1.7 (decision
  [0009](decisions/0009-source-constrained-boundary-pixel-policy.md)) makes forward LK use an
  aggregate, policy-versioned boundary-pixel condition: `[01]` basal, `[20]` prism, `[10]`
  inhibited, cited `G_b = H_b = 1` on the primary facets, v2 policy-bearing checkpoints;
  per-contact geometry remains `legacy-v3`). Before that, v1.6 (2026-07-16, decision
  [0008](decisions/0008-phase3-completes-after-2b-exit.md) — maker-directed completion of
  Phase 3 after the failed 2b v3 run, with Phase 2b work continuing independently and strict
  territory separation), v1.5 (2026-07-15, decision
  [0007](decisions/0007-phase3-overlaps-2b-evidence-run.md) — Phase 3 may overlap the tail of
  2b's pre-registered evidence run; §3.2 exception recorded), and v1.4 (2026-07-15, decision
  [0006](decisions/0006-audited-surface-operator-numerics.md) — audited surface-operator
  numerics: fixed-σ Dirichlet LibbrechtKinetics convergence is DUAL (residual AND divergence
  identity; reflecting LK is residual-only diagnostic), fill is per attached face with the
  hexagonal-prism 2/3 factor under the now-historical v3 policy, and the seam's exact bookkeeping claim was `placed fill +
  recorded unapplied saturation excess = computed per-face Hertz–Knudsen kinetic demand`,
  with shell-clamp totals as diagnostics only; amends 0005 after audit rounds 2–6 measured
  the failure modes and documentation overclaims of the older statements). Before that,
  v1.3 (2026-07-14,
  decision [0005](decisions/0005-validation-scope-surface-operator-numerics.md) — maker
  review). v1.3's three big ones: Phase 6 input-provenance classes with an **in-sample/held-out split** (SDAK
  inputs are Nakaya-informed; matching Nakaya with them active is reproduction, not validation);
  the seam is a **coupled surface operator**, and **Phase 2b was paused** until its spec and the
  parameter table existed (fulfilled 2026-07-15); quasi-static numerics are an **elliptic residual solve**, not
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

What survives from G-G is scoped by operator. `GGThreshold` keeps the published four-step cycle
bit-identically. `LibbrechtKinetics` shares the lattice and diffusion stencil but replaces surface
exchange **as a coupled whole**: iterated Robin relaxation, separate fill, freezing replaced,
melting disabled, and rule-specific noise on `alphaHK` (decision 0005 amending 0003 — "only the
attachment thresholds" understated the seam). G-G's published 3D snowfakes are deterministic,
branches included; noise is their *proposed* randomization (§VI.C) and our labeled dial for
natural asymmetric sidebranching, not an existence requirement. `GGThreshold` remains the
working floor and control group.

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
`npm test`: 81/81 green at 2a close (2026-07-15); 122/122 after the round-6 remediation;
138/138 after the follow-up Phase 2a evidence hardening
(2026-07-15 — exact counts only, since the round-4 audit caught a "past 120" here; rounds
4–6 added the sink-vs-kinetic-demand diagnostic and completed the LK checkpoint mutation-probe
matrix); 201/201 in the committed Phase 3 WP2 evidence; 244/244 after WP3 (`068dce4`);
262/262 after the v4 surface-policy implementation and gate hardening.
**Phase 2b's scoped no-SDAK deliverable docs and implementation exist (LKSolver,
SurfaceOperator, Dirichlet, runner gate) and have been through six maker audit rounds. Protocol
v3 completed according to its registered controls and FAILED its habit gate:** both registered temperatures reached the same
one-layer plate at the measurement size. The protocol was registered after round 3 and unchanged
by rounds 4–6. The stack is
decided in charter §3.1 — TypeScript + Vite, WebGPU, stacked triangular lattice, CPU oracle +
GPU production solver, five-part repo (`core` / `solver-cpu` / `solver-gpu` / `runner` / `app`;
`app` now exists under Phase 3, while `solver-gpu` remains reserved and uncreated).

The solver specs — **read the relevant one before writing solver code:**

For a high-level map of the repository, package responsibilities, source files, data flow, and
common commands, start with the root [README](../README.md). It is an orientation layer only;
the charter, accepted decisions, solver specs, active plan, and this file remain authoritative.

- **[gg-machinery.md](gg-machinery.md)** — lattice, diffusion, state fields, mass bookkeeping,
  melting, noise, seed, guardrails, G-G's presets. Shared machinery with physical diffusion
  transport and phenomenological G-G surface knobs; outputs are Type = computed state,
  Evidence = unvalidated (§1.5), so this makes no physical-validation claim. §6
  (noise) is **extracted** (2026-07-14, from the paper's §VI.C, with the honesty note that G-G's
  published 3D results are deterministic and the randomization is their proposal).
- **[attachment-kinetics.md](attachment-kinetics.md)** — the attachment rule, `v_n = alphaHK ·
  v_kin · sigma_surf`. The only **physically parameterized** step of the update cycle
  (corrected v1.3: diffusion is physical too; κ, μ, hole-filling, noise are phenomenological).
  **§4.4 is the surface-operator specification** (decision 0005 D2 deliverable, written
  2026-07-15 — the coupled Robin operator, facet-classification policy, fill state, machinery
  disposition table, `SurfaceOperator` interface, and its committed tests); §4.3 the
  quasi-static formulation.
- **[libbrecht-parameters.md](libbrecht-parameters.md)** — σ₀(T), A(T), v_kin(T), D(T,P).
  **Extracted 2026-07-15** (first pass, not yet frozen): every entry cited with pages,
  provenance classes P1–P4, canonical units with raw values alongside — σ₀ is a dimensionless
  fraction, and percent-vs-fraction is a 100× exponent trap the file guards explicitly. Its
  own header states the two extraction limits: σ₀/A curves are figure-only in the sources
  (digitized anchors, labeled, ±25%), and no D(T) law exists in the source (gap recorded).

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
| **2a** | Sixfold-symmetric plate on G-G machinery; symmetry error **exactly 0** across a full run, noise off | ✅ **maker-asserted complete, 2026-07-15** (enforced + maker-audited; follow-up evidence hardening complete) — plate, seed 1, dims 128,128,64, hexPrism: delta check clean all 4800 ticks, full metric 0 everywhere sampled, AR 0.168831, drift 2.056e-13 (float floor 3.8e-16; 10k grown test 4.19e-14), far-field stop. Enforcing repro (exit 0 is the claim, twelve criteria): `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. Post-hardening `cmp` is bit-identical, SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Full records: [solver plan](plans/phase-2-cpu-solver.md), [hardening plan](plans/phase-2a-evidence-hardening.md) |
| **2b** | Habit changes with **temperature alone** — two temperatures, no other change, two habits (habit = pre-registered aspect-ratio thresholds at a stated crystal size — operationalized in the plan). Plus (introduced v1.2; strengthened v1.4): fixed-σ Dirichlet far field passes the **depleted-start differential test** (v1.2's "holds σ in a crystal-free run" wording was vacuous from a uniform start — see plan) | ❌ **open after an execution-valid v3 failure** — protocol v3 completed at execution commit `4ca9680`, command `node runner/src/main.ts gate2b`, exit 1. −5 °C passed plate (AR 0.01888163179957996); −15 °C failed column with the identical AR and attached occupancy. Every non-habit gate criterion and the suite's depleted-start differential passed. Decision 0009's v4 repair is pre-registered, implemented, and green on 262 tests plus the byte-identical Phase 2a differential; its isolated flagless v4 habit pair is running and has no result yet. |
| 3 | Facet center starves in the slice view while the plate grows, **confirmed by the automated center-vs-rim depletion metric** (v1.3) | 🔶 **evidence-complete, pending maker assertion** (2026-07-16) — `gate3` exit 0: window median depletionRatio 0.531454 (registered ≤ 0.75), 90.2% of window samples < 1 (≥ 80%), radius 38, AR 0.168831, far-field stop tick 4800, symErr 0 all ticks. Repro: `node runner/src/main.ts gate3` (flagless, protocol pinned; plate, dims 128,128,64, seed 1, hexPrism, reflecting, noise 0). Checkpoint byte-identical to the accepted 2a artifact (SHA f1796b5015…). Slice-view half: app captures in `out/phase3-visual/` via `node app/scripts/visual.mjs`, coordinator + reviewer inspected. Full record: [phase-3 plan](plans/phase-3-dev-visualization.md) |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds — **run twice, once per `SurfaceOperator` implementation**: pass A (`GGThreshold`) is **blocking**, pass B (`LibbrechtKinetics`) is **diagnostic** (v1.3) — a failed pass B is a finding, not a blocker for Phase 6 | 🔶 **in progress, criteria frozen** — final freeze `e567767`; WP0 v4 integration/review CLEAN. WP1 review round 1 found 3 blockers/4 should-fixes despite 364 green tests; repair/re-review is active. No Phase 4 gate result exists. |
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
  Phase 6 gets provenance classes and the in-sample/held-out split; **Phase 2b was paused** until
  the surface-operator spec and parameter table existed (condition fulfilled 2026-07-15); the
  field solve is elliptic-with-residual, not
  per-sweep physical time. Charter v1.2 → v1.3 in the same session. Amended in part by 0006
- **[0006](decisions/0006-audited-surface-operator-numerics.md) — audited surface-operator
  numerics** (implementation audit rounds 2–6, 2026-07-15). Amends 0005: fixed-σ Dirichlet
  convergence is dual (residual AND divergence identity), while reflecting LK is residual-only
  diagnostic; fill is per attached face (hexagonal-prism 2/3 factor,
  fill-CFL on the per-cell kinetic increment); the exact bookkeeping claim is `placed fill +
  recorded unapplied saturation excess = computed per-face Hertz–Knudsen kinetic demand`,
  shell-clamp totals diagnostics only; noise multiplies `alphaHK` in sink and growth alike.
  Charter v1.3 → v1.4 in the same session. Per-contact geometry amended for forward policies
  by 0009; retained as `legacy-v3`
- [0007](decisions/0007-phase3-overlaps-2b-evidence-run.md) — Phase 3 development-visualization
  work overlaps the tail of Phase 2b's pre-registered evidence run (maker-directed,
  2026-07-15). Constraint-bounded: gate2b process/artifacts untouched, no Phase 3 claim rests
  on 2b, additive-only changes to shared packages. Charter v1.4 → v1.5 in the same session
- [0008](decisions/0008-phase3-completes-after-2b-exit.md) — after gate2b exited and 0007's
  condition ended, the maker explicitly directed Phase 3 to complete R3, its visual fix, and
  gate3 while Phase 2b v4 proceeds independently. The immutable 2b evidence and strict file
  territories remain binding. Charter v1.5 → v1.6 in the same session
- **[0009](decisions/0009-source-constrained-boundary-pixel-policy.md) — source-constrained
  boundary-pixel policy after v3's recorded failure and source audit.** `[01]` basal, `[20]`
  prism, `[10]` inhibited; aggregate Eq. 5.34 with cited `G_b = H_b = 1` on primary facets;
  a named coupled policy in required v2 LK checkpoints; event-limited timing deferred.
  Amends 0006's forward geometry and terminology. Charter v1.6 → v1.7 in the same session
- [0010](decisions/0010-phase4-overlaps-pending-phase3-and-phase2b-evidence.md) — maker-directed
  Phase 4 work proceeds in its own worktree while Phase 3 external review and Phase 2b v4
  evidence finish; external processes/artifacts are immutable, claims remain independent, and
  relevant upstream fixes require integration and reruns. Charter v1.7 → v1.8
- [0011](decisions/0011-phase4-timeline-environment-semantics.md) — deterministic abrupt
  timeline events; G-G parameter jumps preserve state, LK temperature jumps conserve interior
  absolute vapor density, the Dirichlet reservoir stays explicit, and capped-column direction
  is corrected to column→plate. Charter v1.8 → v1.9

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

**Phase 4 is ACTIVE under decisions 0010/0011 and
[phase-4-morphology-gauntlet.md](plans/phase-4-morphology-gauntlet.md).** The criteria were
committed before delegation (`23b5d6c`), WP0 integrated decision 0009's accepted v4 history
without changing the Phase 3 app (`b080654`), and review round 1 found three blockers/four
should-fixes before feature work. The negative-supersaturation solver fix is `cc63a87`; the
criteria now enforce a genuinely solid column, individually named execution validity,
deterministic cap/trigger semantics, and automated widening; final criteria-freeze commit is
`e567767`. WP0 re-review round 4 is CLEAN: zero blockers/should-fixes, 278/278 tests, app build
green, Phase 3 unchanged. WP1 implementation commit `7af3f2e` passed 364/364 tests and the app
build, but independent review round 1 found three blockers and four should-fixes: forged/late
timeline history, assertion-only habit/depletion crossings, self-reported hollow metrics and an
aliased replay, plus finite B depletion, negative-zero identity, returned snapshot aliasing, and
raw false-path coverage. The next serial action is to return this complete set to the WP1
developer, run the full checks, and send the fix commit to the same reviewer. Loop until zero
blockers and zero unaddressed should-fixes; only then begin WP2. Work only in
`/Users/clipper/github/snowflake-phase4`.
Do not touch the live Phase 2b process/worktree or any external `out/gate2b*` / `out/gate3*`
artifacts.

**Phase 3 remains EVIDENCE-COMPLETE and READY FOR EXTERNAL REVIEW (maker-marked 2026-07-16;
ADRs 0007/0008), orchestrated per
[phase-3-dev-visualization.md](plans/phase-3-dev-visualization.md)** — all work packages
built, adversarially reviewed (R1: 2 rounds to CLEAN incl. one blocker; R2 and R3: CLEAN with
all should-fixes landed), visually inspected, and the flagless `gate3` evidence run passed
with exit 0 (values in the gate table). **Review entry points:** the plan's passing criteria
and Steps evidence; the pre-registration trail (thresholds committed at d80b426/4867a67
before the evidence run); `out/gate3.log`, `out/gate3-depletion.csv`,
`out/gate3-exit-status.txt`, `out/gate3-plate.ckpt` (byte-identical to the accepted 2a
artifact); the `out/phase3-visual/` captures, reproducible via `node app/scripts/visual.mjs`;
and the review-loop records in the plan's Steps. Repro commands: `node runner/src/main.ts
gate3` (evidence) and the Phase 3 plan's recorded suite. **Gate assertion follows that external
review** — flip the gate row to ✅ if satisfied. Phase 4 does not make that assertion. Traps for
whoever opens `app/`: the
solver runs ONLY in the worker; checkpoint headers carry exactly the eleven v1 metric keys
(depletion metrics are print/CSV material — re-adding them to headers needs an ADR, see the
phase-3 plan's Tried and rejected); the Rule 7 scan covers app code, so Three.js's
alpha-named opacity APIs stay banned. Nothing below about 2b is superseded by this.

Phase 1 is closed (2026-07-15). Phase 2a is closed — maker-asserted complete 2026-07-15
(evidence in the plan's Steps). 2a byte-identity was re-verified after the follow-up evidence
hardening: exact enforced run exit 0, `cmp` exit 0 against `out/plate-gate.ckpt`, SHA-256
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`; exact results and
adversarial cases are in [the hardening plan](plans/phase-2a-evidence-hardening.md).
**Phase 2b state (2026-07-16): the scoped no-SDAK deliverables and implementation exist, and
protocol v3 completed as execution-valid negative evidence for the exact v3 implementation.**
Its pre-registration is commit `62af3b3`,
before execution commit `4ca9680`; the flagless command was
`node runner/src/main.ts gate2b`. The recovered wrapper status is 1
(`out/gate2b-exit-status.txt`). `out/gate2b.log` has SHA-256
`344bbcacfd06626bafd5ea0ca66770fd9e48cbef949d25a8abf7e3bfc17e44b0` and records:

- −5 °C: size-target at step 423, simulated time 47.79 s, attached 2,149, extent 61,
  AR 0.01888163179957996 — the registered plate criterion passed.
- −15 °C: size-target at step 459, simulated time 111.19 s, attached 2,149, extent 61,
  AR 0.01888163179957996 — the registered column criterion AR ≥ 1.5 failed.
- Both runs used the registered 96³ hexPrism centered at `[48,48,48]`, 19-site radius-2 seed,
  seed 1, Dirichlet far field,
  `CAK_A1`, `sigma_infinity = 0.002`, `dx = 0.35 µm`, 101325 Pa, fill-CFL 0.1,
  `relaxTol = 1e-9`, `divTol = 1e-7`, 200000 relaxation-sweep and surface-step caps, target
  extent 60, and noise off. Every enforced
  non-habit criterion passed: size-target termination, exact D6h symmetry (delta clean and
  final metric 0), all relaxations converged, the rounded log printed worst divergence
  1.000e-7 and the `< 1e-6` gate passed, maximum
  kinetic fill 0.1, and Péclet ≤ 1.66e-6 / 6.97e-7. The log also observed zero hole fills;
  that is a diagnostic, not an enforced gate criterion.
- The preserved v1 checkpoints were byte-round-tripped under the pre-0009 v1 writer. The
  current decoder accepts them as implicit `legacy-v3`; the public encoder intentionally
  migrates decoded state to v2, so current decode→encode is not byte-identical. The original
  SHA-256 values remain immutable: plate `e1fe0c8062aa4dd21e42a83d1bf953ee5cd72c45e55c6d2bdf18c65595902ecb`;
  column `108227d929af7686eea6f95e30f60caa5d6f2deed12793340ec0c1931a7723ca`.
  A one-off independent decode probe (not retained) found the two attached-occupancy arrays
  bit-identical: 2,149 cells in one z layer, axial bounding box 61×61. SHA-256 of the raw
  decoded 884,736-byte `a:u8` array in checkpoint index order:
  `b758492e97155307083c5df2dc88eddd74829b9a62f2c2b4fd1f7fc2f566e647`. The fill fields
  differ at 4,460 cells and the vapor fields at 601,142, so the supported claim is **identical
  final morphology at the registered measurement size**, not “temperature had no effect.”
  The exact Node/V8 version was not captured; no cross-engine bitwise claim is made.
- From log totals rounded to 0.001, recorded unapplied saturation excess was approximately
  118.059 / (3256.413 + 118.059) = 3.50% warm and
  151.133 / (2145.874 + 151.133) = 6.58% cold. This is a documented timestep limitation, not
  by itself a demonstrated cause of the habit failure.

**Post-result source-audit finding (one-off primary-source/checkpoint probes; probes not
retained):** the monograph identifies `[01]` as basal and `[20]` as the prism facet (printed
pp. 205–206), while the executed component-2 policy classifies `(1,0)` as prism and every
`n_T ≥ 2` site—including `[20]`—as barrier-free rough. The canonical seed begins with 12
such `[20]` lateral boundary sites. Thus protocol v3's broad-facet rate-ratio arithmetic did
not bound the temperature-independent rough path that controlled those sites. This source
contradiction is a seam defect discovered after the run, not a reason to rewrite or discard
the negative result; it limits interpretation of the failure as a test of the intended physical
model. The governing detail and citations are recorded in attachment-kinetics §4.4.

**Current Phase 2b action belongs to its isolated worktree:** its tracked-clean v4 command
`node runner/src/main.ts gate2b` is already running (PID 10608 observed read-only on
2026-07-16). Do not launch a duplicate, kill it, or inspect/modify its live artifacts from this
worktree. Its pre-gate controls were complete: 262/262 tests; exact engine Node v24.13.1 / V8
13.6.233.17-node.40; enforced
Phase 2a exit 0; `cmp` exit 0 and canonical SHA-256
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. The v4 tests independently
cover all raw slots and invalid counts; canonical-seed 38 `[01]` / 12 `[20]` / 6 `[10]`
topology; `[20]` routing in the boundary condition and fill; unequal opposing-cell averaging;
nonlinear/planar laws and the legacy `4/3` negative control; signed exchange reconstruction;
noise coupling; checkpoint v1/v2 mutations and migration; demand bookkeeping through
saturation; dual convergence; CFL; determinism; D6h; and fail-closed gate provenance/reports.
The owning Phase 2b session must record exit 0 or 1 honestly with metrics, execution hash, log
hash, and checkpoint hashes after the run exits. LK resume still does not exist. Event-limited
stepping, SDAK, parameter changes, alternate target sizes, and exploratory temperature pairs
remain outside v4. ADRs 0008/0010 authorize other work independently; their strict territory
separation and the immutable v3 evidence remain binding.

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

Timeline semantics are no longer open: decision 0011 resolves ADR 0005 D5. G-G parameter jumps
leave state bytes unchanged; LK temperature jumps conserve active unattached vapor number
density with the registered affine transform, preserve negative supersaturation, and expose the
Dirichlet re-clamp as a numerical reservoir diagnostic. Events are abrupt; ambiguous coincident
triggers reject; ramps remain unsupported.
