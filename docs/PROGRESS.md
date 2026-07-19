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
  v4 habit rerun has now terminated at tracked-clean `dce7081` with exit 1. The −5 °C run
  reached extent 61 and passed its registered plate threshold, but the −15 °C run exhausted
  200,000 relaxation sweeps while attempting step 12: iterate residual reached zero while the
  divergence identity plateaued at `3.10e-7 > divTol=1e-7`. It therefore stopped unconverged at
  completed step 11 and extent 5. **V4 is execution-invalid, not a measured cold-habit failure.**
  Exact artifact hashes and the criteria-first repair protocol are in
  [phase-2b-v4-convergence-failure-and-v5.md](plans/phase-2b-v4-convergence-failure-and-v5.md).
  The cold checkpoint now reproduces the cause exactly: naïve, compensated, and exact sums all
  give the same `1.1395225041344048e-13` mismatch, while the independently metered float64
  reflecting-smoother drift is its exact negative. Decision
  [0013](decisions/0013-float64-smoother-drift-divergence-identity.md) and charter v1.11 define
  an explicit aggregate-v5 three-term identity; implementation and regression are next.
- **Last updated:** 2026-07-19 by Codex
- **Phase 4 is COMPLETE under maker-directed decision
  [0010](decisions/0010-phase4-overlaps-pending-phase3-and-phase2b-evidence.md)** (charter
  v1.8). It began in isolated worktree `/Users/clipper/github/snowflake-phase4`; on 2026-07-16
  the user directed all work to be committed, merged into primary tree
  `/Users/clipper/github/snowflake`, and the Phase 4 worktree removed. Merge `5ab204f` landed the
  complete topic history on `main`; the dedicated worktree and merged topic branch are now
  removed. Post-merge verification passed the Rule 7 scan over 129 files, both TypeScript
  projects, all 508 tests, and the 27-module app production build. Its passing criteria
  were committed at `23b5d6c` before the first development agent; accepted Phase 2b v4 was
  integrated at `b080654`; 276/276 tests pass. Decision
  [0011](decisions/0011-phase4-timeline-environment-semantics.md) (charter v1.9) now resolves
  the timeline contract and corrects the capped history to column→plate. Decision
  [0012](decisions/0012-phase4-reservoir-matched-branch-control.md) supersedes only v1's
  infeasible dependent-extent branch control. Completion plan:
  [phase-4-v2-reservoir-matched-branch-control.md](plans/phase-4-v2-reservoir-matched-branch-control.md);
  [the v1 plan](plans/phase-4-morphology-gauntlet.md) remains immutable failed history. The
  v2 authority, implementation, controls, one canonical gate, real visual evidence, and final
  independent review are all complete. Canonical `node runner/src/main.ts gate4` ran once at
  execution commit `70a2496` and exited 0 in 7,178.8 seconds: Pass A was execution-valid and
  passed all 24 blocking records; Pass B passed all 12 execution records and recorded five
  non-blocking morphology misses. Aggregate SHA-256 is `194f837d…d8e2`; real visual manifest
  SHA-256 is `19e0fcfe…573b` for 20/20 inspected captures with zero errors/clipping/hash mismatch.
  Post-publication test-isolation repair `b7153cc` restored exact root `npm test` to 779/779;
  same-reviewer final replay is CLEAN with zero blockers and zero should-fixes. Exact evidence is
  in the active plan and gate row below.
  WP0's independent
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
  hardening. All findings are now repaired: event logs prove raw first crossings, habit and
  depletion records bind raw targets/stops, hollow metrics are recomputed from full occupancy,
  and replays require distinct executions/non-overlapping buffers. Coordinator follow-up also
  pins non-shrinking retained histories, finite endpoints, and simultaneous-batch depletion
  sampling. Round 2 verified every original exploit closed, then found two hollow-contract
  blockers and one coverage should-fix: the raw initial state did not enforce the canonical
  19-site seed, B-HOLLOW omitted the common 50,000-step cap, and the new guards need direct
  mutation coverage. Those findings are repaired with a byte-exact canonical-seed comparison,
  strict B crossing cap, and direct mutations for every raw occupancy/field/replay guard. The
  tree passes 394/394 tests and the app build. Same-reviewer round 3 reported CLEAN — zero
  blockers and zero should-fixes — after independently rerunning all round-1/2 exploits. WP1 is
  complete. WP2a is also complete after three review rounds: atomic G-G/LK environment changes,
  density-preserving LK temperature transitions, step-local vapor-unit ledger accounting, and
  hardened split-cycle state machines pass 422/422 tests and the app build; same-reviewer round
  3 was CLEAN. WP2b now has Pass-A runner/evidence review candidate `34b832a`. It registers
  the exact 13-run manifest (SHA-256
  `6d1ee3a262e8985930ded30f8ef490e1e47402dce6c55f2b3b16e4e80b0d9a98`), reconstructs raw
  attachment histories, independently witnesses applied G-G noise, cross-links timeline and
  checkpoint evidence, publishes only a reopened complete staging graph, and prints exact
  provenance/termination/artifact facts. Developer verification is 175/175 targeted and 508/508
  full tests with Rule 7 and both TypeScript projects clean; coordinator re-verification passed
  the same targets plus the 27-module app build. It is not accepted until a distinct reviewer
  reports zero blockers and zero should-fixes. Independent WP2b review round 1 rejected
  `43fd6b3` (coherent pre-rename payload/report/index rewrite could replace the staged evidence
  graph and still publish, plus six should-fixes); repairs `3641847` and `2204f59` closed the
  complete set: original-byte canonical JSON, exact report-kind pinning, an owned immutable
  expected publication root checked before/after rename, `A-EXEC-CONFIG` ownership of corrupt
  manifest bytes, verdict/publication mismatch rejection at the terminal seam, a new
  strictly-increasing delta-witness order guard, and 34 negative controls pinning the full
  exploit matrix. Because round 1's reviewer session no longer exists, a distinct independent
  reviewer (not the developer) replayed every round-1 exploit plus novel variations and
  reported CLEAN — zero blockers, zero should-fixes — at 542/542 tests, Rule 7 over 129 files,
  both typechecks, and the 27-module app build. **WP2b is complete at `2204f59`.**
  WP2c is also complete and CLEAN at `5c382c3`. WP3 implementation candidate `dce7081` adds the
  operator-honest app instrument and Phase 4 visual harness. Independent WP3 review round 1
  rejected it with seven blockers and two should-fixes: synthetic fixtures could be relabeled as
  published evidence; bundle run sets and backend provenance were fail-open; capture manifests
  omitted load-bearing morphology/size facts; original-resolution images clipped a column and
  every checkpoint hash; the Windows launch hard-coded Metal and never exercised available
  WebGPU; output paths could overwrite evidence or mix stale captures; and the exact root test
  command exited 1 on a Vitest worker RPC timeout despite all 709 assertions passing. Portable
  paths/hashes and morphology-based framing are the two should-fixes. Repair commit `b9f8ccb`
  closed that set and passed 176/176 app tests, a 33-module build, 20/20 synthetic Phase 4
  captures, 9/9 Phase 3 regression captures, and exact root `npm test` at 719/719 with Rule 7
  and both typechecks clean. Vitest now uses one serial thread worker because its default fork
  transport twice timed out a worker-status RPC after every assertion had passed on Windows.
  Same-reviewer round 2 rejected `b9f8ccb` with three blockers and no should-fixes: a Windows
  junction could alias capture output into immutable evidence; real reports did not require the
  exact criterion set or independently recompute their verdict; and a nonexistent recorded Git
  head, trusted ancestry booleans, and unbound source hashes could forge provenance. The second
  repair resolves output/evidence roots through the filesystem, rejects output aliases before
  writes, derives verdicts from exact frozen A/B records, and authenticates the recorded commit,
  all three freeze ancestors, and both solver sources from Git objects. It passes 190/190 app
  tests, the 33-module build, fresh 20/20 Phase 4 and 9/9 Phase 3 visual harnesses inspected at
  full resolution, and exact root `npm test` at 42 files / 733 tests with Rule 7 over 353 files
  and both typechecks clean. Same-reviewer round 3 rejected immutable commit `b0cfb92` with one
  blocker and no should-fixes: output safety was checked only once, so an initially absent parent
  replaced by a Windows junction either before or after staging creation redirected all 20
  captures and the manifest into disposable Pass-A evidence while the harness exited 0. All
  other round-3 checks were clean, including exact provenance/criteria replay, 733/733 root
  tests, and both full-resolution visual harnesses. The repair now stages beneath the originally
  identity-bound existing ancestor, pins realpath/device/inode identities, and revalidates every
  write/read/publication boundary. Deterministic IPC tests replay both exact swaps without adding
  a test-side filesystem writer; both fail closed with unchanged evidence and no staging/output
  residue. An initially absent evidence directory is also pinned absent for the full run. Final
  developer checks are 47/47 targeted verifier tests, 195/195 app tests, both
  typechecks, the 33-module build, and the previously fresh 20/20 Phase 4 plus 9/9 Phase 3 visual
  sets. Same-reviewer round 4 rejected immutable commit `464c53d` with one blocker family and no
  should-fixes: a precreated staged PNG hard-linked to a Pass-A manifest, or staged manifest
  hard-linked to a Pass-A report, was overwritten while the harness exited 0; a post-create
  external hard link also survived publication and could later mutate the canonical PNG. Every
  directory-identity/junction/absent-evidence repair and all other WP3 surfaces passed, including
  738/738 root tests. The repair now keeps Phase 4 screenshots in memory, exclusively creates
  every staged file, and pins one-link device/inode/size/hash facts across every read and both
  sides of the rename. Four deterministic hard-link controls cover precreated PNG and manifest,
  plus post-create and post-rename aliases. Post-rename failures safely roll the exact directory
  object back to trusted staging before cleanup, or refuse destructive cleanup if identity proof
  is lost. The first three repairs passed exact root `npm test` at 741/741 plus fresh inspected
  20/20 Phase 4 and 9/9 Phase 3 captures; the final rollback follow-up passes 199/199 app tests,
  typecheck, and the 33-module build. Same-reviewer round 5 reports CLEAN at immutable commit
  `4f2d14c`: zero blockers and zero should-fixes after replaying every round-1–4 exploit. Its
  independent matrix passed 51/51 verifier tests, 199/199 app tests, the 33-module build, and
  exact root `npm test` at 42 files / 742 tests with Rule 7 over 529 files and both typechecks;
  fresh Phase 4 20/20, absent-B 10/10, and Phase 3 9/9 captures were all inspected at original
  resolution. **WP3 is complete.** Pre-gate regression controls then passed on tracked-clean
  `dfd83ec`: exact `npm test` was Rule 7 clean over 459 files with both typechecks and 742/742
  tests; the app build transformed 33 modules; the enforcing Phase 2a plate control exited 0 at
  tick 4800 with exact symmetry, mass drift `2.056e-13`, and a byte-identical checkpoint SHA-256
  `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`; detached-worktree
  `gate3` exited 0 with median depletion ratio `0.531454`, fraction below one `0.902439`, radius
  38, aspect ratio `0.168831`, far-field stop, and the same byte-identical checkpoint. Fresh
  developer-only Phase 4 synthetic captures were 20/20 across primary/forced-WebGL2, zero errors,
  manifest SHA-256 `567a0e940dd0480a7c28cbc337783b2142f54e44633c6559bf26ee275048e5b0`;
  Phase 3 was 9/9, zero errors, manifest SHA-256
  `95a06cd9ab245b92e892f443bff98e31d353cc2915fab94c9f6a943c188ea37d`.
  The first real flagless `gate4` attempt then ran from tracked-clean commit
  `ad04e87100fd1ad8f472ec5ca6b5e6c9138be709` and exited 1 after 371.2 s with the blocking
  named failure `A-EXEC-TERMINATION: A-BRANCH-COMPARATOR has no extent crossing`. Pass B never
  started; the runner published no canonical Pass A, Pass B, or aggregate artifact and cleaned
  its partial state. This attempted evidence run is invalid under the pre-registered contract,
  not a Pass-B diagnostic negative and not a license to widen the 12,000-step cap or change the
  target. The thrown seam discarded unpublished per-run rows, so the current record does not yet
  distinguish ordinary far-field stop from step-cap or state the final/target extents.
  An explicitly NON-EVIDENCE replay of only the unchanged frozen pair at `ddd04e8` resolves that
  uncertainty. Manifest SHA-256 remained
  `6d1ee3a262e8985930ded30f8ef490e1e47402dce6c55f2b3b16e4e80b0d9a98`. Dendrite config
  SHA-256 `eaffd62b25a6f472f6de82141d5d53afc608420871701c93c421b8ef2e918410` stopped on
  ordinary far field at cycle 4,775 with `tExtent=99`, attached 25,605, far-field mean
  `0.06982702050795417 < 0.07`, six branches, aspect ratio `0.0909091`, and no contact.
  Comparator config SHA-256 `93307656c2bfe690b9b4590aa1b71d4e7eaeafcc56a81c3242271c15b68080f7`
  inherited target 99 but stopped on ordinary far field at cycle 5,450 with `tExtent=83`,
  attached 28,511, previous/crossing means `0.06672679203869303 >= 0.06666666666666667` and
  `0.06643583913501325 < 0.06666666666666667`, zero branches, aspect ratio `0.1325301`, and no
  contact. The cap was 6,550 cycles away. Runner/protocol/solver/metrics code is byte-unchanged
  between the execution and diagnostic commits. This is an honest infeasible frozen comparator,
  not a runner/witness defect.
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
- **Charter is at v1.11** (2026-07-19): decision
  [0013](decisions/0013-float64-smoother-drift-divergence-identity.md) retains dual convergence
  and every v4 surface-physics choice while adding the independently metered float64
  reflecting-smoother drift to aggregate v5's divergence identity. Executed v3/v4 and Phase 4
  meanings remain frozen. Before it, decision
  [0012](decisions/0012-phase4-reservoir-matched-branch-control.md) replaces Phase 4 v1's
  infeasible dependent-extent compact control with the same normalized reflecting-reservoir
  threshold, cadence, and first-crossing rule for each branch run, while preserving all
  parameters and thresholds; decision
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
- [`lab-validation-dataset.md`](../research/lab-validation-dataset.md) /
  [`.jsonl`](../research/lab-validation-dataset.jsonl) — **extracted 2026-07-16**: 122
  condition-annotated lab-crystal targets from the monograph (the full Fig. 8.16 e-needle
  morphology grid plus 21 curated case studies, 9 of them quantitative). Phase 6 prep material;
  source-stated conditions with per-entry verification status; **no entry is gate evidence**.
  Companion analysis: [monograph-review.md](monograph-review.md) (review findings +
  exploration candidates, 2026-07-16).
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
| **2b** | Habit changes with **temperature alone** — two temperatures, no other change, two habits (habit = pre-registered aspect-ratio thresholds at a stated crystal size — operationalized in the plan). Plus (introduced v1.2; strengthened v1.4): fixed-σ Dirichlet far field passes the **depleted-start differential test** (v1.2's "holds σ in a crystal-free run" wording was vacuous from a uniform start — see plan) | ❌ **open after an execution-valid v3 habit failure and execution-invalid v4 attempt.** V3 completed at `4ca9680`, command `node runner/src/main.ts gate2b`, exit 1: −5 °C passed plate while −15 °C formed the identical plate; every non-habit criterion passed. V4 ran at `dce7081`, exit 1: −5 °C passed at extent 61, but −15 °C stopped unconverged at extent 5 after its attempted step-12 divergence identity plateaued at `3.10e-7 > 1e-7` despite zero iterate residual. The cold aspect ratio is not a valid habit measurement. Investigation and any v5 freeze are governed by [the active repair plan](plans/phase-2b-v4-convergence-failure-and-v5.md). |
| 3 | Facet center starves in the slice view while the plate grows, **confirmed by the automated center-vs-rim depletion metric** (v1.3) | 🔶 **evidence-complete, pending maker assertion** (2026-07-16) — `gate3` exit 0: window median depletionRatio 0.531454 (registered ≤ 0.75), 90.2% of window samples < 1 (≥ 80%), radius 38, AR 0.168831, far-field stop tick 4800, symErr 0 all ticks. Repro: `node runner/src/main.ts gate3` (flagless, protocol pinned; plate, dims 128,128,64, seed 1, hexPrism, reflecting, noise 0). Checkpoint byte-identical to the accepted 2a artifact (SHA f1796b5015…). Slice-view half: app captures in `out/phase3-visual/` via `node app/scripts/visual.mjs`, coordinator + reviewer inspected. Full record: [phase-3 plan](plans/phase-3-dev-visualization.md) |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds — **run twice, once per `SurfaceOperator` implementation**: pass A (`GGThreshold`) is **blocking**, pass B (`LibbrechtKinetics`) is **diagnostic** (v1.3) — a failed pass B is a finding, not a blocker for Phase 6 | ✅ **complete, 2026-07-18** — one canonical `node runner/src/main.ts gate4` at `70a2496`, Node `v24.13.1` / V8 `13.6.233.17-node.40`, exit 0 in 7,178.8 s. Pass A: 13 runs, 24/24 records green; plate/column AR `0.0666667`/`1.66667`; five-point sweep strictly increasing; depletion median `0.770238`, 7/7 samples below one, width 7→13; three distinct reproducible open-hollow occupancies; cap score `1.3`; dendrite/compact branches 6/0 at independent first reservoir crossings (cycles 4,775/5,450, extents 99/83). A manifest/report/index SHA-256: `e5e85c70…8644` / `bcb29e05…7188` / `92346e3e…1917`. Pass B: 11 runs, 12/12 execution records green; three morphology diagnostics pass and five honestly miss (depletion, widening, hollowing, capped history, branch). B manifest/report/index: `c0ceed5b…e812` / `22c8a92c…fa2d` / `5644f838…5cb0`. Aggregate v2 SHA-256 `194f837d…d8e2`, `gatePass=true`, `passBDiagnosticPass=false`. Real `node app/scripts/visual.mjs --phase4`: 20/20 original-resolution captures inspected by coordinator and reviewer, zero absent/error/clipped/hash-mismatch views, manifest `19e0fcfe…573b`. Post-publication exact root suite 779/779 and 33-module build green; final same-reviewer verdict on repair `b7153cc`: CLEAN, 0 blockers / 0 should-fixes. Full record: [v2 plan](plans/phase-4-v2-reservoir-matched-branch-control.md). |
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
  Phase 4 work proceeds while Phase 3 external review and Phase 2b v4 evidence finish; external
  processes/artifacts are immutable, claims remain independent, and relevant upstream fixes
  require integration and reruns. Its original isolated-worktree location was later amended by
  0012 after maker consolidation to `main`. Charter v1.7 → v1.8; location synchronized in v1.10
- [0011](decisions/0011-phase4-timeline-environment-semantics.md) — deterministic abrupt
  timeline events; G-G parameter jumps preserve state, LK temperature jumps conserve interior
  absolute vapor density, the Dirichlet reservoir stays explicit, and capped-column direction
  is corrected to column→plate. Charter v1.8 → v1.9
- [0012](decisions/0012-phase4-reservoir-matched-branch-control.md) — Phase 4 v1 remains an
  immutable failed protocol; v2 replaces only its infeasible dependent-extent compact control
  with each branch run's first registered normalized reflecting-reservoir crossing, pins the
  complete v2/v1 wire identity, and executes on consolidated `main`. Charter v1.9 → v1.10

The two decisions predating this system (web over native C++/CUDA; the five-part repo split) live
in charter §3.1 and get no retroactive ADR.

## Completed plans

- [phase-4-v2-reservoir-matched-branch-control.md](plans/phase-4-v2-reservoir-matched-branch-control.md)
  — ✅ done 2026-07-18. Blocking G-G Pass A earned all 24 records; LK Pass B was execution-valid
  and recorded five diagnostic morphology misses; real evidence and 20/20 visual captures passed
  exact integrity checks and final independent review closed CLEAN.
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

## Phase 4 completion

**Phase 4 v2 is COMPLETE under decisions 0010/0011/0012 and
[phase-4-v2-reservoir-matched-branch-control.md](plans/phase-4-v2-reservoir-matched-branch-control.md).**
The v1 plan remains immutable failed history. Its original criteria were
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
developer, run the full checks, and send the fix commit to the same reviewer. That repair is now
green at 372/372 tests plus the app build, including raw crossing/full-state replay controls and
coordinator follow-up for simultaneous size crossings. Same-reviewer round 2 closed the original
findings but caught a noncanonical hollow seed and missing B-HOLLOW 50,000-step cap, plus missing
mutations for the new raw guards. Those findings are now repaired and independently pass 394/394
tests plus the app build. Same-reviewer WP1 round 3 is CLEAN with zero blockers and zero
should-fixes. The next serial action is WP2a: implement atomic G-G/LK environment transitions,
the LK density-conserving transform and step-local cross-temperature ledger, then run a separate
review/fix loop before any gate runner command is built. WP2a implementation is now coordinator-
accepted and awaiting that independent review: G-G owns and atomically replaces complete control
bundles only at completed-cycle boundaries; LK stages the signed active-vapor density transform,
temperature-derived scales, cache invalidation, and explicit reservoir target before one commit;
placed-fill vapor units accumulate at each interface step's `M_ice`; and unchanged LK v2
checkpoint headers now accept active `sigma >= -1` while still rejecting negative attached/wall
state. The transition/checkpoint/operator target was 26/26, root verification was 404/404 with
Rule 7 and both TypeScript checks clean, and the 27-module app build passed, but independent
review round 1 rejected commit `b19a3c9` with four blockers and one should-fix: a second LK
relaxation could reuse stale readiness so a callback advanced mid-solve, corrupted 56 attached
cells, and admitted an event; G-G admitted unmatched surface updates while valid split calls left
both solvers' tick/noise provenance unchanged; changing LK accessors bypassed staging and produced
mixed invalid live controls; a typed-array subclass defeated G-G control ownership; and the
running vapor-unit sum broke exact fixed-temperature product compatibility after two steps. The
repair closes all five with explicit fail-closed cycle states and surface-owned ticks, one-read
owned environment snapshots, intrinsic base-`Float64Array` copies, and temperature-segment
bookkeeping. Its 17-case exploit suite covers direct/wrapper noise replay, bare/repeated calls,
recursive and throwing callbacks/getters with recovery, typed-array subclasses, eight-step exact
fixed-temperature equality, same-temperature continuity, and three-temperature history. The
targeted set is 78/78; independent coordinator verification is 421/421 with Rule 7 and both
TypeScript projects clean; the 27-module app build and `git diff --check` pass. The next serial
action returned repair commit `7b4eca8` to the same reviewer. All five round-1 exploits replay
closed and root verification remained 421/421, but round 2 found one should-fix: entering a new
LK relaxation resets `lastMaxFillVelocityMS` even though no new update exists, falsifying its
most-recent-update definition after ready, unconverged, or throwing relaxation. Return this
narrow diagnostic-lifetime fix to the same developer, rerun, and re-review to CLEAN. That repair
now preserves the completed velocity through ready, unconverged, throwing, retry, and late-failed
surface paths, stages a replacement until successful completion, and independently passes
422/422 tests plus the 27-module app build. Commit it and return it to the same reviewer for the
final CLEAN requirement. Same-reviewer round 3 is now CLEAN with zero blockers and zero
should-fixes; WP2a closes at commits `b19a3c9`, `7b4eca8`, and `a285631`. The next serial action is
WP2b: implement shared runner evidence infrastructure and the flagless Pass A gate/artifacts,
then run its separate developer/coordinator/reviewer fix loop before WP2c. Before delegation, a
runner-completion freeze closes the only remaining termination ambiguity: A-DEPLETION and every
A-HOLLOW primary/replay run use a strict 12,000-cycle cap. It also pins the independently reviewed
G-G/LK solver-source hashes for `A-HOLLOW-STRUCTURAL` and requires staging-directory publication
so partial or mixed artifacts cannot masquerade as canonical evidence. Record that freeze commit
as an additional provenance ancestor, then delegate WP2b. That freeze is `cd24365`; a final
execution-cadence freeze additionally pins one series row per completed cycle and ordinary
far-field observation every 25 completed cycles, while all other execution checks remain
per-cycle. That freeze is `7be4c5d`. Criteria/provenance freezes `e567767`, `cd24365`, and
`7be4c5d` must all be ancestors of the 40-hex clean execution commit. **WP2b closed
CLEAN at `2204f59` (2026-07-16)**: the round-1 blocker and all six should-fixes are repaired and
independently re-reviewed to zero blockers/zero should-fixes at 542/542 tests (see the plan's
WP2b step for the exploit matrix). **WP2c closed CLEAN at `5c382c3` (2026-07-17)**: flagless
`gate4b`/`gate4` with the frozen 11-run Pass-B manifest (SHA-256
`c0ceed5b0ebb68defee85b1d78d52c9563f5edd35ed415b8cfdad57dd7c3e812`), twelve independently
recomputed `B-EXEC-*` witnesses, LK v2 checkpoint round-trips, fail-closed publication, and
the aggregate report; independent review replayed forgery/seam/exit-semantics/guard-disable
attacks and reported zero blockers/zero should-fixes at 629/629 tests. Three non-blocking
observations for the evidence runs are recorded in the plan's WP2c step (source-hash pinning
across passes, an unreachable schedule+noise binding, and fail-closed 48³ witness risk).
WP3 implementation landed at `dce7081`: operator-honest snapshots and overlays, registered
scenario/artifact inspection, and `node app/scripts/visual.mjs --phase4`. Independent review
round 1 rejected it with the seven blockers and two should-fixes summarized above. Repair
`b9f8ccb` passed 719/719 root tests but same-reviewer round 2 found three further blockers:
junction-aliased output, verdicts not derived from exact frozen records, and provenance not
authenticated from the recorded Git commit. The second repair closes all three and is green on
190/190 app tests, the 33-module build, fresh 20/20 synthetic Phase 4 and 9/9 Phase 3 captures
inspected at full resolution, plus exact root `npm test` at 733/733 with Rule 7 over 353 files
and both typechecks. Same-reviewer round 3 rejected `b0cfb92` with one blocker and no
should-fixes: an absent output parent could be replaced by a junction after the one-time safety
check, both before and after staging creation, redirecting all captures and the manifest into
evidence while the harness exited 0. Every other round-3 exploit and regression passed. WP3 later
closed CLEAN at `4f2d14c`; exact review and regression evidence is in the v1 plan. Independent
review of decision 0012, charter v1.10, and the v2 criteria-first plan is now CLEAN with zero
blockers and zero should-fixes after the reviewer verified the normalized reservoir rule,
non-vacuous compact control, raw far-field witness, exact wire/provenance matrix, immutable v1
history, and unchanged Pass-B manifest. The next serial action is to commit this reviewed authority
as the v2 criteria freeze. That reviewed freeze is
`9c9dd5a45eafb80f3e547298494f005a73d19086`; the metadata-only follow-up records it without
changing a criterion. The bounded implementation is complete at
`90f19a786d113f673815d4cf75459e3177806c94`: Pass A v2 has independent raw reservoir evidence,
Pass B retains its exact v1 wire shape, aggregate publication is v2, and the app requires the
exact A-v2/B-v1 split. Independent review found three blockers and two should-fixes; repair
`bbb14740642488c92720888d3887806b49c42e15` closes all five. Exact root `npm test` now passes
779/779 tests, both typechecks and Rule 7 are clean, the 33-module app build passes, and the same
reviewer replayed 16/16 selected exploits to CLEAN with zero blockers/should-fixes. Phase 2b
isolation reconciliation was also clean at Phase 4 closure: exactly one `gate2b` process existed
(PID 36792), its detached worktree was tracked-clean at `dce7081`, stderr was empty, and it had
advanced to growth step 600 before controls. Those controls then closed green on `c96f4d6`: 779/779 tests, 33-module
build, byte-identical Phase 2a/gate3 checkpoints, 20/20 synthetic Phase 4 captures, and 9/9 Phase
3 captures. The one canonical exact `gate4` execution at `70a2496` exited 0 with blocking Pass A
green and execution-valid Pass B diagnostic-negative; real visual evidence was 20/20 and clean.
Final independent review authenticated the complete graph and images, found one post-publication
test-isolation blocker, and closed CLEAN after test-only repair `b7153cc`; exact root verification
is 779/779. The Phase 2b v4 rerun later terminated with the execution-invalid cold convergence
result recorded above; its `out/gate2b-rerun-20260717_162624.*` artifacts remain immutable.

## Next step

**Do not start Phase 5 while Phase 2b remains open.** Follow
[phase-2b-v4-convergence-failure-and-v5.md](plans/phase-2b-v4-convergence-failure-and-v5.md):
implement decision 0013's versioned aggregate-v5 smoother-drift diagnostic, add the checkpoint
fixed-point regression plus residual-only and forged-drift negative controls, and prove aggregate
v4 remains bit-identical. Freeze v5 only after the repair is green and before any morphology
execution, then
review it independently and run the exact flagless pair once. Preserve every v4 artifact byte.
Phase 3 separately remains evidence-complete and awaits the maker assertion described below.

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

**Next Phase 2b action:** implement and test decision 0013 in the isolated v5 repository. The
terminal v4 stdout, stderr, and checkpoints in `.tmp-gate2b-clean-1784305494/out/` are immutable;
their exact hashes and result are in the active v5 plan. Do not rerun or relabel v4. Commit and
independently review the numerical repair, then freeze the exact v5 pair before its first
morphology execution.

The first v4 attempt was externally interrupted on 2026-07-17 during warm run 1/2. Its log
ended during relaxation for growth step 771; the last completed metric line was step 768 with
16,873 attached cells, extent 57, AR 0.122807, exact symmetry, and elapsed 48,867.0 s. It never
reached the registered extent-60 measurement, wrote no plate or column checkpoint, never
started the cold run, and emitted no terminal gate result. This is incomplete liveness
evidence, not a failed or accepted gate result. LK resume does not exist. Its pre-gate controls
were complete: 262/262 tests; exact engine Node v24.13.1 / V8 13.6.233.17-node.40; enforced
Phase 2a exit 0; `cmp` exit 0 and canonical SHA-256
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. The v4 tests independently
cover all raw slots and invalid counts; canonical-seed 38 `[01]` / 12 `[20]` / 6 `[10]`
topology; `[20]` routing in the boundary condition and fill; unequal opposing-cell averaging;
nonlinear/planar laws and the legacy `4/3` negative control; signed exchange reconstruction;
noise coupling; checkpoint v1/v2 mutations and migration; demand bookkeeping through
saturation; dual convergence; CFL; determinism; D6h; and fail-closed gate provenance/reports.
Event-limited stepping, SDAK, parameter changes, alternate target sizes, and exploratory temperature pairs
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
