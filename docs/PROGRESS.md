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
  **Phase 2b history preserves protocol v3 as an execution-valid recorded negative result for
  the exact registered v3 implementation:** the
  flagless gate completed and exited 1; the −5 °C run passed its plate threshold, while the
  −15 °C run produced the same one-layer plate instead of the registered column. All enforced
  non-habit criteria passed. This is a failed gate, not missing or invalidated evidence.
  **Decision 0009 and charter v1.7 then adopted the
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
  an explicit aggregate-v5 three-term identity. The repair is now implemented without changing
  field arithmetic: focused classification/solver/gate tests pass 54/54, checkpoint/gate tests
  pass 22/22 with both TypeScript projects clean, aggregate-v4/v5 one-sweep fields are
  bit-identical, and the retained cold-checkpoint regression accepts the same fixed point under
  v5 in one sweep with residual/divergence exactly zero. Exact root verification is Rule 7 clean
  over 153 files with both typechecks and 784/784 tests green; the depleted-start differential
  passes 3/3; and the enforcing Phase 2a control exits 0 with its canonical checkpoint SHA-256
  `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Independent repair review
  round 1 rejected `975f304` with two blockers and three should-fixes: the finite drift lacked an
  absolute roundoff-scale bound, the checkpoint regression did not enforce its registered hash,
  explicit CLI v5 routing was absent, the bit-preservation input was uniform, and comments were
  stale. Decision 0014 and charter v1.12–v1.13 define the bound before remediation. The v5
  remediation now addresses all five findings: focused tests pass 73/73, Rule 7 is clean over
  156 files, both typechecks pass, and the authenticated cold checkpoint closes within its
  independent bound. Root replay passed 786/788 both before and after remediation commit
  `47fc01d`; the two failures exposed stale Phase 4 tests that assumed current `HEAD` must forever
  match the frozen solver source. The verifier itself correctly rejected v5. Positive fixtures
  now name immutable recorded commits `70a2496`/`dce7081`, and the unchanged verifier passes 59/59
  targeted tests. At tracked-clean `61ccc40`, exact root verification is Rule 7 clean over 156
  files with both typechecks and 788/788 tests green. The final depleted-start differential is
  3/3 and enforcing Phase 2a control exits 0 with canonical hash
  `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Sequential v5 was later
  frozen at `acf4f82`; its reviewed execution was interrupted by host shutdown without a
  checkpoint or cold start. Concurrent v5p is pre-registered at `8adea86`, implemented at
  `c30aa6f`, and passed its code/protocol audit plus final 0-blocker/0-should-fix recheck.
  **Phase 2b is COMPLETE:** the one flagless concurrent v5p execution at tracked-clean `0dc0f86`
  exited 0. At the same registered extent 61, −5 °C produced a plate with aspect ratio `0.118644`
  and −15 °C produced a column with aspect ratio `12.2000`; both had symmetry error 0,
  size-target termination, all relaxations converged, bounded smoother drift, and
  round-trip-identical checkpoints. Stable evidence and exact hashes are in
  [the v5p plan](plans/phase-2b-v5p-parallel-retry.md#terminal-v5p-result).
- **Last updated:** 2026-07-24 by Codex
- **Phase 5 is frozen as Windows-only at the operator's direction.** Decision
  [0018](decisions/0018-phase5-windows-only-gate.md), charter v1.16, and the active
  [Phase 5 plan](plans/phase-5-gpu-port.md) defer Metal to a later machine and narrow the current
  claim to Windows/Chromium/D3D12. The old two-lane `phase5-gpu-conformance-v1` hash
  `b62ec34cf118ebffbfd493203b68ff1028cf057f1b1736b5fc5028a87091ff09` remains immutable
  superseded history. The Windows `phase5-gpu-conformance-windows-v2` manifest has SHA-256
  `223428d864189130f675e5595e44325c0adccad90bb4484ed051910878984c5e`, with 16 criteria and one
  negative control per criterion. Fixtures remain unchanged at
  `29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512`; removing only the
  cross-backend term changes the tolerance-manifest hash to
  `1e77ed673e77aba6598c2bdd56e6b80f0f59343067bd7cb2c677d220d2fc05ba`, while every numerical
  CPU-vs-GPU tolerance and decision margin remains unchanged. The v2 freeze at
  `60be8c0f14b44c1f5bf1b2753c409baad3da0833` passes
  exact root `npm test` in 371.8 seconds: Rule 7 clean over 178 files, both typechecks green, and
  46 files / 816 tests passed; the 33-module app build also exits 0. From that tracked-clean
  commit, the canonical capability and WP1 probes independently recorded the same commit and
  clean tree, observed D3D12, exited 0, and reported zero uncaptured errors.
  The Windows RTX 3080 capability probe observed D3D12, passed the requested limits,
  timestamped dispatch, and scoped validation-error checks. The CPU shadow passes all blocking
  envelopes with zero occupancy/convergence classification mismatches; minimum decision margins
  are `0.002877725076560811` (G-G) and `0.6` (LK), both above `4e-4`.
  Decision [0019](decisions/0019-phase5-gg-dirichlet-ledger-conformance.md) supersedes v2 for
  final evidence after provisional WP3 execution exposed its unmeasured cancellation-heavy
  direct-meter criterion. Historical v3 id `phase5-gpu-conformance-windows-v3` has SHA-256
  `ce1821df86461cbd7660cbb34c697071bd5d3822a4ca4def042245f569d61e98`; fixture and tolerance
  hashes and every numerical envelope are unchanged. V3 blocks on exact clamp-path witnesses,
  within-lane corrected-mass conservation, and cross-lane corrected-mass agreement while
  retaining direct meter differences as mandatory diagnostics.
  Decision [0020](decisions/0020-floor-phase5-float32-smoother-drift.md) superseded v3 before
  production LK WGSL. Historical v4 id `phase5-gpu-conformance-windows-v4` has
  SHA-256 `62f6f940a38a477dd34b6fd53687808708f7ccf89d6f59eccc8cb7960ccc8688`; fixture SHA-256 remains
  `29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512`, while tolerance SHA-256 is
  `c0062a8b9c2d01ed8fba7d43ad64f3da7a6dc931f50265257b545de665281866`. The only numerical
  addition is the binary32 minimum-subnormal `2^-149` floor in the independently computed
  smoother-drift bound; every registered normal-field envelope and non-LK criterion is unchanged.
  Production D3D12 execution later proved v4 infeasible on the evolving cold f32 trajectory:
  step 3 enters an exact two-cell period-two orbit with one ULP of motion, residual
  `5.82076573607537e-8`, and divergence zero. Accepted decision
  [0021](decisions/0021-bound-phase5-float32-two-cycles.md) creates Windows protocol v5 with
  exact period-two / maximum-one-ULP classification, both phases' unchanged divergence/drift
  guards, resettable history, and explicit reporting. Accepted aggregate/tolerance SHA-256
  values are `bdc61bfe5cb48e9e29f5b79337036d7b23ec11e1677f1657595d00f5e7de91ec` /
  `d38ec0f7a0096dc297d651cd1b89fb80275edb4098c16545c44274e585c2a09b`; fixtures are unchanged.
  Final exact root `npm test` exited 0 in 377.6 seconds: Rule 7 clean over 166 files, both
  TypeScript projects green, and 44 files / 802 tests passed. WP0 freeze commit
  `f2373bea9294947aa501805e4299ea08d829878f` then passed the canonical capability probe from a
  tracked-clean tree with observed D3D12, timestamp dispatch, validation capture, and zero
  uncaptured errors.
  The M4 was unreachable and remains explicitly unobserved; decision 0018 now defers it rather
  than guessing or relabeling a result. `solver-gpu/` was absent at the immutable v1 WP0 boundary.
- **Phase 5 WP1–WP3 are COMPLETE; WP4 protocol v5 repair is active.** WP1 closes at
  `afd94078e515236124bace82ff263390d80609f9`. The exact
  root pre-WP1 baseline at clean commit `c29754b`
  exited 0 in 371.1 seconds: Rule 7 clean over 166 files, both TypeScript projects green, and
  44 files / 802 tests passed. The concurrent canonical capability probe passed on observed
  D3D12 with timestamp dispatch, scoped validation capture, and zero uncaptured errors. The
  active plan froze WP1's package boundary, 48-byte G-G / 60-byte LK per-cell schemas,
  48-byte grid uniforms, 4,194,304-cell dispatch ranges, resource lifecycle, PRNG parity, and
  readback audit before the package was created. The resulting environment-neutral package has
  transport-only coordinate, exact word-copy, and counter-PRNG WGSL plus checked resource,
  submission, allocation, and readback ownership; it contains no diffusion or surface operator.
  `node app/scripts/phase5-wp1.mjs` passed through pinned Chromium on observed D3D12 with 0/3,553
  coordinate mismatches, 3,366 detected j/k-mutation mismatches, 0/4,096 mixed-word-copy
  mismatches, 0/3,553 PRNG mismatches, all eight dev/preview GG/LK allocations passing,
  contiguous bounded preview ranges, both registered WP1 negative controls passing, and zero
  uncaptured errors. The canonical capability and WP1 probes reran from tracked-clean
  `27f69994696ac486a689b5aeada8f7b83f0214ef`; both independently recorded that commit and
  cleanliness, observed D3D12, and exited 0. Exact root `npm test` exited 0 in 357.4 seconds:
  Rule 7 clean over 177
  files, both typechecks green, and 46 files / 816 tests passed; the 33-module app build also
  passed. Decision 0018 removes the former Metal replay precondition. Independent review of
  clean handoff `5707708f686652f3f35f3f989d8a46f0d8ee8c43` found five blockers and three
  should-fixes: caller-trusted readback classification/purpose, an oversized dispatch override,
  an in-flight stale-generation success seam, forged allocation plans/duplicate-name leakage,
  adapter-maxima allocation reporting, absent real nonzero-base dispatch, probe duplication of
  production transport, and the stale charter line below. The remediation candidate closes all
  eight findings. Both typechecks, Rule 7 over 178 files, and focused tests 17/17 pass. Its
  provisional dirty-tree D3D12 run retained zero coordinate/copy/PRNG mismatches, executed 14
  real coordinate ranges (13 nonzero bases), passed all eight blocking arenas, rejected all four
  bake/operator cases from the negotiated device limits, rejected both forbidden readbacks, and
  reported zero uncaptured errors. Exact root `npm test` exited 0 in 369.5 seconds: Rule 7 was
  clean over 178 files, both typechecks passed, and 46 files / 819 tests passed; the 33-module
  app build also exited 0. This session's Git metadata is read-only, so creating the repair
  commit failed at `.git/index.lock`. Same-reviewer round 2 closed six of the eight findings but
  found two remaining blockers: display-frame chunks could cumulatively cover a full source, and
  the required-limit negative mutated advertised capability rather than omission/downgrade at
  the production request boundary. The second repair uses audit-issued frame tokens, actual
  source identity, cumulative interval coverage, and exact frozen request comparison. Both
  typechecks and focused tests 19/19 pass. Its provisional D3D12 run rejects the direct and
  chunked full-field attacks plus both request mutations while retaining every prior exact
  transport/allocation result and zero uncaptured errors. Exact root `npm test` exited 0 in 366.9
  seconds: Rule 7 was clean over 178 files, both typechecks passed, and 46 files / 821 tests
  passed; the 33-module app build also exited 0. A clean commit, canonical clean probes, and
  same-reviewer zero-finding result remain mandatory before WP1 closes. Same-reviewer round 3
  found one surviving blocker: an active frame could omit its token and classify a full read as
  non-display. The third repair makes active audit state authoritative and requires the exact
  token for every read during that scope. Both typechecks and focused tests 19/19 pass; the
  provisional D3D12 probe rejects the omission, direct-full, and cumulative-chunk attacks plus
  both request mutations while retaining all prior exact results and zero uncaptured errors.
  Exact root `npm test` exited 0 in 367.7 seconds: Rule 7 was clean over 178 files, both
  typechecks passed, and 46 files / 821 tests passed; the 33-module app build also exited 0.
  Same-reviewer round 4 is ACCEPTED with zero blockers and zero should-fixes after independent
  focused-test and real-D3D12 replay. The primary workspace could not write `.git/index.lock`,
  so the operator directed creation of an isolated clone under ignored `out/worktrees/`.
  That clone committed the exact accepted ten-file diff as
  `afd94078e515236124bace82ff263390d80609f9`. Both canonical probes then ran serially from that
  tracked-clean commit and exited 0. Capability recorded clean provenance, D3D12, timestamp
  completion, captured validation, and zero uncaptured errors. WP1 recorded the same clean
  commit/backend with 0 coordinate/copy/PRNG mismatches, 3,366 axis-swap mismatches, 14 real
  coordinate ranges including 13 nonzero bases, 17 submissions, five accepted readbacks, every
  residency/purpose/request mutation rejected, all eight blocking arenas passing, all four
  bake/operator cases rejected from negotiated limits, and zero uncaptured errors. The final
  same-reviewer provenance audit accepted the commit parent, exact ten-file tree/blob identity,
  object integrity, and both complete probe predicates with zero blockers and zero should-fixes.
- **Phase 5 WP2 is COMPLETE at reviewed implementation
  `9f7a7b476a17e9f47849cc323d49e928fc177b65`.** Its tracked-clean RTX 3080 D3D12 replay passed
  all six registered field comparisons and rejected the wrong-clamp mutation with zero
  uncaptured errors or unexpected loss. Same-reviewer round 3 reported zero code/evidence
  findings; docs-only closure is `20cba9d`. WP3 candidate `12f7af4` then implemented complete
  G-G cycles. Review round 1 found six blockers and four should-fixes; the current repair closes
  them with correctly placed decision margins, mandatory per-cycle meter diagnostics, blocking
  reflecting-meter enforcement, raw wall/flag/report/event authentication, negative-vapor
  rejection, exact v3/runtime/host/adapter provenance, recoverable validation-only events,
  fail-closed partial writes/accessors, and targeted branch/report mutations. Focused GPU tests
  pass 46/46, exact root `npm test` passes 49 files / 849 tests, and the
  33-module app build passes. The dirty-tree D3D12 replay passes every scientific/provenance
  predicate and fails only required worktree cleanliness; its correctly sampled decision
  margins are `0.002879962029400218` and `0.002877725076560811`, with zero wall, packed-flag,
  or `SurfaceReport` mismatches and all 128 Dirichlet cycle diagnostics retained. Repair commit
  `0ff70b65403655d3e5084717dafa2f1656fd66be` then passed the exact clean canonical D3D12 replay;
  `out/wp3-canonical-0ff70b6.log` has SHA-256
  `a0578ffecdcf15688343b8a50e8d96d1032bd6cc51e2256a4bf5036fd6a51827`, report `pass: true`,
  778 bounded submissions (maximum 5.9 ms), 946 audited test readbacks, zero display-frame
  full-field reads, and zero GPU errors/loss. Same-reviewer round 2 reports zero blockers and
  accepts all code/evidence. Docs closure
  `39d8b435ef638608b98480cb7f052adb845e9ad1` received zero-finding re-review, so WP3 is closed.
  WP4 design commit `5ca5c3651c4ea5f968c8c976607b7f9e42289625` was rejected with seven blockers
  and three should-fixes before production LK WGSL began. Repair `98a8083` specified the
  representable zero-exchange divergence branch, f32 ledger-closure bounds and clipping stress,
  stalled updates, no-write far-field-only events, non-resumable LK v2 conversion scope,
  positive source/exchange guards, tick/noise lifetime, complete topology order, and synchronized
  handoff. Its pre-shader operation-rounded probe covers all nine registered LK
  topology samples: 22–141 sweeps, final residual/divergence exactly zero, positive Dirichlet
  source/exchange, and every direct drift below its independent f32 limit. Same-reviewer round 2
  closed the original findings but found four blockers and one should-fix: the drift bound omitted
  a binary32 minimum-subnormal floor; a legal zero-exchange first sweep was poisoned; same-
  temperature events could split ledger segments; load-bearing tests trusted producer flags; and
  this handoff was stale. Decision 0020 and the current repair close those findings with protocol
  v4, a host-binary64 `2^-149` floor, an integrated unconverged zero-exchange probe, ordinary
  nonzero-exchange overflow rejection, a bit-preserving same-temperature ledger rule/mutation,
  and independent sample-matrix/predicate/extrema recomputation. Focused v4 tests pass 13/13.
  Same-reviewer round 3 authenticated exact clean
  `87150eb8d0835d7bf5fd595d075dd9a6f92ef4dd`, independently reran the full verification and
  direct shadow, and returned zero blockers and zero should-fixes. Production execution then
  exposed v4's missing persistent-f32 history case. Same-reviewer diagnosis independently
  reproduced the exact two-cell/one-ULP orbit and returned one blocker, zero should-fixes; it
  endorses decision 0021's exact period-two rule over a generic residual floor. V5 design repair
  `79ec322` then received zero blockers and zero should-fixes; implementation has resumed.
  Exact root `npm test` passes 50 files / 852 tests in 368.3 seconds, both TypeScript projects
  pass, Rule 7 is clean over 192 files, and the 33-module app build passes.
- **Phase 2b v5 execution update:** reviewed sequential execution commit `dd762f0` was interrupted
  by accidental host shutdown during warm step-189 relaxation, after completed step 188. No warm
  checkpoint, exit status, terminal verdict, or cold start exists; the attempt is incomplete
  liveness evidence, not a pass/fail result. Exact artifact hashes are in the active
  [v5p retry plan](plans/phase-2b-v5p-parallel-retry.md). At the user's direction, accepted
  decision [0015](decisions/0015-parallel-phase2b-temperature-pair.md) replaces only sequential
  scheduling with two isolated concurrent Node processes; all aggregate-v5 scientific and
  numerical controls remain frozen. V5p completed at `0dc0f86` with status 0 and both registered
  habits; its authenticated artifacts now live below `out/phase2b/v5p/`.
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
  condition-independent completion. Phase 3 is maker-asserted complete as of 2026-07-23; its
  plan is:
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
- **Charter is at v1.16** (2026-07-24): decisions
  [0016](decisions/0016-phase5-hardware-backend-lanes.md) and
  [0018](decisions/0018-phase5-windows-only-gate.md) define the Phase 5 backend protocol and
  narrow the current gate to Windows/Chromium/D3D12 while deferring Metal. Before those, v1.13
  (2026-07-19) and decision
  [0014](decisions/0014-bound-float64-smoother-drift.md) bound aggregate-v5 smoother drift at
  operation-count-derived float64 roundoff scale, including the minimum-subnormal floor. Decision
  [0013](decisions/0013-float64-smoother-drift-divergence-identity.md) retains dual convergence
  and every v4 surface-physics choice while adding the independently metered drift to aggregate
  v5's divergence identity. Executed v3/v4 and Phase 4 meanings remain frozen. Decision
  [0015](decisions/0015-parallel-phase2b-temperature-pair.md) changes only v5p scheduling and has
  no charter impact. Before those, decision
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
`app` now exists under Phase 3, while `solver-gpu` remains reserved and uncreated until the active
Phase 5 plan's WP0 criteria freeze is committed and reviewed).

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
| **2b** | Habit changes with **temperature alone** — two temperatures, no other change, two habits (habit = pre-registered aspect-ratio thresholds at a stated crystal size — operationalized in the plan). Plus (introduced v1.2; strengthened v1.4): fixed-σ Dirichlet far field passes the **depleted-start differential test** (v1.2's "holds σ in a crystal-free run" wording was vacuous from a uniform start — see plan) | ✅ **complete, 2026-07-20.** One flagless v5p run at tracked-clean `0dc0f86`, pre-registration `8adea86`, Node `v24.13.1` / V8 `13.6.233.17-node.40`, exited 0. Same `96×96×96` hexPrism, extent target, fixed-σ far field, `sigmaInfinity=0.002`, pressure, spacing, mapping, seed 1, noise 0, CFL, and convergence controls; temperature alone differed. −5 °C: step 814, extent 61, attached 18,193, AR `0.118644` plate. −15 °C: step 330, extent 61, attached 1,159, AR `12.2000` column. Both: size-target, symmetry error 0, every relaxation converged, bounded smoother drift, checkpoint round trip identical. The depleted-start differential was 3/3 and permanent Phase 2a control retained canonical SHA-256 `f1796b5015…a389`. Final log SHA-256 `ea69d65a…c45e`, status 0, empty stderr; complete evidence: [v5p plan](plans/phase-2b-v5p-parallel-retry.md#terminal-v5p-result). V3 negative and v4 execution-invalid history remain preserved. |
| 3 | Facet center starves in the slice view while the plate grows, **confirmed by the automated center-vs-rim depletion metric** (v1.3) | ✅ **maker-asserted complete, 2026-07-23** — `gate3` exit 0: window median depletionRatio 0.531454 (registered ≤ 0.75), 90.2% of window samples < 1 (≥ 80%), radius 38, AR 0.168831, far-field stop tick 4800, symErr 0 all ticks. Repro: `node runner/src/main.ts gate3` (flagless, protocol pinned; plate, dims 128,128,64, seed 1, hexPrism, reflecting, noise 0). Checkpoint byte-identical to the accepted 2a artifact (SHA f1796b5015…). Slice-view half: app captures in `out/phase3-visual/` via `node app/scripts/visual.mjs`, coordinator + reviewer inspected. Full record: [phase-3 plan](plans/phase-3-dev-visualization.md) |
| 4 | Hollowing emerges with no explicit hollow rule, reproducibly across seeds — **run twice, once per `SurfaceOperator` implementation**: pass A (`GGThreshold`) is **blocking**, pass B (`LibbrechtKinetics`) is **diagnostic** (v1.3) — a failed pass B is a finding, not a blocker for Phase 6 | ✅ **complete, 2026-07-18** — one canonical `node runner/src/main.ts gate4` at `70a2496`, Node `v24.13.1` / V8 `13.6.233.17-node.40`, exit 0 in 7,178.8 s. Pass A: 13 runs, 24/24 records green; plate/column AR `0.0666667`/`1.66667`; five-point sweep strictly increasing; depletion median `0.770238`, 7/7 samples below one, width 7→13; three distinct reproducible open-hollow occupancies; cap score `1.3`; dendrite/compact branches 6/0 at independent first reservoir crossings (cycles 4,775/5,450, extents 99/83). A manifest/report/index SHA-256: `e5e85c70…8644` / `bcb29e05…7188` / `92346e3e…1917`. Pass B: 11 runs, 12/12 execution records green; three morphology diagnostics pass and five honestly miss (depletion, widening, hollowing, capped history, branch). B manifest/report/index: `c0ceed5b…e812` / `22c8a92c…fa2d` / `5644f838…5cb0`. Aggregate v2 SHA-256 `194f837d…d8e2`, `gatePass=true`, `passBDiagnosticPass=false`. Real `node app/scripts/visual.mjs --phase4`: 20/20 original-resolution captures inspected by coordinator and reviewer, zero absent/error/clipped/hash-mismatch views, manifest `19e0fcfe…573b`. Post-publication exact root suite 779/779 and 33-module build green; final same-reviewer verdict on repair `b7153cc`: CLEAN, 0 blockers / 0 should-fixes. Full record: [v2 plan](plans/phase-4-v2-reservoir-matched-branch-control.md). |
| 5 | GPU agrees with CPU oracle to tolerance on observed Windows D3D12; preview budget (**≈8M cells**, not a cube — ADR 0001) interactively editable. This phase makes no Metal/general-WebGPU portability claim (ADR 0018). | ✅ **maker-asserted complete, 2026-07-26** — all seven work packages closed with zero-finding independent review. The canonical run at exact clean commit `c436df5` exits 0 on both frozen flagless commands: `node runner/src/main.ts gate5-lane` (observed D3D12, 172 commit-derived source hashes) and `node runner/src/main.ts gate5` (**16/16 criteria**), publishing `out/phase5/`. Both preview budgets meet every registered bound (plate edit-ack max 9.90 ms and first valid frame max 308.0 ms; column 10.90 ms and 309.3 ms; published p99 37.70 / 34.40 ms; all 560 bounded segments inside 500 ms) with zero device losses, uncaptured errors, hidden retries, stale generations, and **zero full-field display-frame reads** across 2,715 audited readbacks. All sixteen negative controls were rejected with their registered owner in the observed failing set (ADR 0022, protocol v6 `5ef6d11b…`). Three review rounds: four should-fixes, then two, then **CLEAN**. Scope is Windows/Chromium/D3D12 only — **no Metal and no general-WebGPU portability claim** (ADR 0018); Metal remains a separately frozen later-machine extension. Plan: [phase-5-gpu-port.md](plans/phase-5-gpu-port.md). |
| 6 | Model's T-vs-σ morphology diagram compared against Nakaya's — **agreements and disagreements both reported**; no-SDAK and SDAK runs reported **separately**, SDAK-active comparisons labeled **in-sample**; independent validation on held-out observables (v1.3) | 🔶 **in progress, 2026-07-26** — WP1, WP0a and WP0b done; WP0c pending after WP3 — [phase-6-nakaya-validation.md](plans/phase-6-nakaya-validation.md). Comparison targets are split by claim strength: the classical Nakaya diagram (Libbrecht 1211.5555v1 Fig. 1, printed p. 2) is the **qualitative** report card the charter §2.3 asks for, and Libbrecht's Fig. 8.16 e-needle grid is the **quantitative** onset target later, once the ADR-level column-seed question is answered. WP0 (pre-registration) must land before any sweep; the first scientific deliverable is the no-SDAK reversal probe, which ADR 0005 makes a first-class result whichever way it lands. |
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
- [0002](decisions/0002-dev-hardware-split.md) — historical M4/RTX 4080 hardware split,
  superseded by 0016 and then by 0018 for the current gate; bounded dispatch survives
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
- [0013](decisions/0013-float64-smoother-drift-divergence-identity.md) — aggregate v5 retains
  dual convergence while directly metering the float64 reflecting-smoother drift in the actual
  three-term divergence identity. V3/v4 meanings remain immutable. Charter v1.10 → v1.11
- [0014](decisions/0014-bound-float64-smoother-drift.md) — the directly metered drift must also
  satisfy an independent operation-count-derived absolute roundoff bound, including a
  minimum-subnormal floor. Charter v1.11 → v1.13
- [0015](decisions/0015-parallel-phase2b-temperature-pair.md) — the registered v5p replacement
  runs the fixed −5/−15 °C roles in isolated concurrent Node processes without changing any
  scientific or numerical control. No charter impact
- [0016](decisions/0016-phase5-hardware-backend-lanes.md) — the Windows Ryzen 7 5700G / 64 GB /
  RTX 3080 10 GB machine is the primary Phase 5 development, D3D12/Vulkan, and Phase 6 sweep
  host; it originally retained the M4 Metal lane, which decision 0018 now defers. Preview and
  bounded dispatch remain binding; bake is adapter-dependent. Charter v1.13 → v1.14
- [0017](decisions/0017-phase5-headless-runtime.md) — Phase 5 uses Playwright 1.61.1's
  lockfile-pinned Chromium revision 1228 for headless WebGPU capability and evidence runs; the
  evidence path and browser instrument run the same package/WGSL. Its former two-host clause is
  superseded by 0018. Charter v1.14 → v1.15
- [0018](decisions/0018-phase5-windows-only-gate.md) — at the operator's direction, current
  Phase 5 closes on the available Windows RTX 3080 / observed D3D12 stack. Metal is deferred to
  a later machine and separately frozen extension; no cross-backend claim is made. All numerical,
  residency, checkpoint, bounded-dispatch, interactivity, and evidence controls remain binding.
  Charter v1.15 → v1.16
- [0019](decisions/0019-phase5-gg-dirichlet-ledger-conformance.md) — Phase 5 protocol v3 keeps
  the direct G-G Dirichlet meter difference visible but gates on independently reconstructed
  within-GPU and CPU-vs-GPU corrected-mass invariants after the cancellation seam was measured.
  Numerical field/scalar tolerances are unchanged. Charter impact: none
- [0020](decisions/0020-floor-phase5-float32-smoother-drift.md) — Phase 5 protocol v4 adds the
  binary32 minimum-subnormal floor to the independently computed aggregate-v5 smoother-drift
  bound before production LK WGSL. Fixtures and normal-field envelopes are unchanged. V4 is
  historical after production execution exposed the persistent-f32 orbit addressed by 0021.
  Charter impact: none
- [0021](decisions/0021-bound-phase5-float32-two-cycles.md) — accepted Phase 5 protocol v5 keeps
  the normal fixed-point branch and adds a narrowly bounded exact-period-two / maximum-one-ULP
  f32 classification. Both phases retain the applicable fixed-sigma Dirichlet divergence and
  smoother-drift guards; history resets on mutation and persists across bounded segments.
  Fixtures and configured tolerances are unchanged. Charter impact: none

The two decisions predating this system (web over native C++/CUDA; the five-part repo split) live
in charter §3.1 and get no retroactive ADR.

## Active plan

- [phase-5-gpu-port.md](plans/phase-5-gpu-port.md) — two-lane WP0 remains superseded history;
  decision 0018 narrows the active lane to Windows. Accepted decision 0021 and protocol v5 are
  the current contract. WP4 is independently closed; WP5 is active.
  WP1 is independently closed. WP2 is independently closed at reviewed implementation
  `9f7a7b476a17e9f47849cc323d49e928fc177b65`: focused tests pass 21/21, exact root
  verification passes 47 files / 833 tests, the 33-module app build passes, and the canonical
  clean D3D12 probe passes every registered comparison and negative with zero uncaptured errors
  and no unexpected device loss. WP3 is independently closed at docs closure
  `39d8b435ef638608b98480cb7f052adb845e9ad1`: exact root verification passes 49 files /
  849 tests, the app build passes, and canonical D3D12 log
  `out/wp3-canonical-0ff70b6.log` has SHA-256
  `a0578ffecdcf15688343b8a50e8d96d1032bd6cc51e2256a4bf5036fd6a51827`, zero GPU
  errors/loss, 778 bounded submissions, 946 audited test readbacks, and zero display-frame
  full-field reads. Both blocking G-G fixtures pass exact discrete comparisons and unchanged
  frozen tolerances; same-reviewer closure found zero blockers and zero should-fixes. WP4 design
  commit `5ca5c36` received seven blockers and three should-fixes; repair `98a8083` then received
  four blockers and one should-fix. Protocol v4's minimum-subnormal drift repair at exact clean
  `87150eb` received same-reviewer round-3 acceptance with zero blockers and zero should-fixes,
  but production execution then exposed the persistent-f32 cold orbit. Protocol v5 repairs only
  that representability seam. Same-reviewer acceptance of exact repair `79ec322` returned zero
  blockers and zero should-fixes. WP4 exact implementation
  `2788cc060116ce8021911248771aa3c148b8fe63` passes post-commit root `npm test`
  (53 files / 863 tests in 436.80 seconds). Clean canonical artifact
  `out/wp4-canonical-2788cc0.json` has SHA-256
  `541c73d6f940e4f5676f3f38a469a0cf3b92e0067a3e60b8c6ed29c463a35d00`,
  strict UTF-8/no-BOM bytes, internal `pass: true`, 3/3 blocking fixtures, 3/3 stress
  diagnostics, exact 48/48 controls, 133 bounded submissions (22.2 ms maximum / 20.4 ms p99),
  481 audited readbacks with zero full-field display reads, and zero GPU errors/loss. Final
  same-reviewer closure on the exact commit/artifact reports zero blockers and zero should-fixes.
  WP4 is closed. WP1–WP4 canonical probes must replay before final publication.

## Completed plans

- [phase-3-dev-visualization.md](plans/phase-3-dev-visualization.md) — ✅ done 2026-07-23.
  The maker accepted the previously reviewed flagless gate3 result and its visual evidence:
  median depletion ratio `0.531454`, 90.2% of samples below one, radius 38, aspect ratio
  `0.168831`, exact symmetry, and a byte-identical Phase 2a checkpoint.
- [phase-2b-v5p-parallel-retry.md](plans/phase-2b-v5p-parallel-retry.md) — ✅ done 2026-07-20.
  Reviewed v5p ran the unchanged temperature pair concurrently and exited 0: extent-61 aspect
  ratios `0.118644` at −5 °C and `12.2000` at −15 °C, exact symmetry, all relaxations converged,
  bounded float64 smoother drift, and authenticated round-trip checkpoints.
- [phase-2b-v4-convergence-failure-and-v5.md](plans/phase-2b-v4-convergence-failure-and-v5.md)
  — ✅ done 2026-07-20. Preserved v4's invalid cold convergence attempt, diagnosed the exact
  float64 drift floor, froze and reviewed aggregate v5, and closed through decision 0015's v5p
  replacement after the sequential attempt was externally interrupted.
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
result recorded above; authenticated copies now live under `out/phase2b/v4/` and remain
immutable.

## Next step

**Phases 2b, 3, 4, and 5 are complete. Phase 6 is next.**
**Phase 5 is COMPLETE — maker-asserted 2026-07-26.** All seven work packages closed with
zero-finding independent review, the last of them on the canonical Windows/Chromium/D3D12
evidence at `out/phase5/`: both frozen flagless commands exit 0 at exact clean commit
`c436df5`, `gate5` reporting 16/16 criteria. The float64 CPU solvers remain the permanent
oracle — unchanged, selectable in the app, and the differential control the GPU port is
measured against. This phase makes **no Metal and no general-WebGPU portability claim**
(ADR 0018).
WP4 implementation `2788cc060116ce8021911248771aa3c148b8fe63` and documentation closure
`e91dd1dd3f9603c029276b194bb6d535a374b989` have zero-finding independent review. Its canonical
D3D12 artifact is `out/wp4-canonical-2788cc0.json`, SHA-256
`541c73d6f940e4f5676f3f38a469a0cf3b92e0067a3e60b8c6ed29c463a35d00`.

WP5 candidate `eb5c5fbd6dff7025bf59e562d9925a45b19b5051` completed both registered hardware
commands on the Windows RTX 3080 / observed D3D12 lane: `node runner/src/main.ts gate5-lane`
published 155 source files, and `node runner/src/main.ts gate5` reported 16/16 criteria. The
candidate report records zero device loss/errors/retries, 70 measured submissions, 60 edit
acknowledgements and first-frame samples, 1,518 audited readbacks totaling 150,348,576 bytes,
and zero full-field display-frame readbacks. These artifacts are preserved as **rejected,
provisional evidence**, not an accepted or canonical claim. Their hashes are: lane artifact
index `3f7921aef61944492a41a00d14c3e01efbf0fc9c4e4c0c25e52016c2f9205d5b`,
lane manifest `fb216d8cb4abdba76b1fc0421f9400cd89cb013968cbd06fb7a00590e0b6ca25`,
lane report `7dab57a2597799485777ccccc0bbbfa90f1c91d8e874ce5edf24ed423fdab191`,
aggregate report `2d0ce1bf74565232749b2c5ecc8730a39502d28a52ec5c8e0a333c62277aa2ac`, and
aggregate artifact index `3a4b8a38eded44f1431571895910161d79e7b87200394d21a8923e4491ff5954`.
Post-repair focused verification passed 59 tests, Rule 7, and both TypeScript projects. The last
full root result remains the earlier 56 files / 918 tests and must not be presented as verification
of the final candidate.

Independent review rejected exact clean commit `eb5c5fb` with five blockers and two should-fixes:
(1) science comparisons contain self-attested duplicate witnesses and blocking `null`/`null`
scalars instead of independent CPU/GPU measurements; (2) the G-G exception retains only the last
clamp comparison rather than the required complete 128-cycle signed chronology and independently
reconstructed corrected-mass safeguards; (3) the performance probe times direct environment
application, a solver step, and a tiny report read rather than registered UI edits and rendered
frames, and replaces observed error/loss state with zeroes; (4) ten of sixteen negative controls
do not execute their named mutation and hardcode criterion ownership, while aggregate replay uses
substitute summary-field mutations; and (5) source authentication permits a change-and-restore
race during live Vite execution instead of executing an immutable source snapshot. The two
should-fixes are to preserve both observed GG and LK per-buffer allocation graphs and to close the
identity-check-to-recursive-delete capture-cleanup race. WP5 remains open; WP6 and WP7 must not
start.

The 2026-07-24 repair audit ran from the real parent checkout
`G:/Code Files/snowflake`, local `main` `e04d250f159aa2cca172373b747a19cf489716b9`.
That commit contained all 34 local Phase 5 commits and was 34 ahead of `origin/main`. The first
repair commit `758c06d` sits directly on it. (Phase 5 was pushed to `origin/main` at `d8a8a39`
on completion, 2026-07-26.) The redundant nested clone `out/worktrees/phase5-wp1` was clean and
byte-identical at `e04d250`; it was kept while repair work was open and removed at Phase 5
closeout, having never been referenced by any published evidence.

**Blocker (2) — the G-G Dirichlet ledger — is repaired at `758c06d` and confirmed on the
registered hardware lane. No canonical `gate5-lane` or `gate5` bundle has been produced since
the repair, and none should be until the other blockers are closed.**
The producer keeps every Dirichlet cycle's CPU/GPU clamp delta, cumulative meter, tick, boundary
and attachment bookkeeping, relaxation/surface reports, corrected-mass operands, raw
positive/negative clamp-path delta and vapor bytes, both persistent-meter reduction reports, and
a consolidated `ggDirichletLedger`. `app/scripts/phase5-gate.mjs` now publishes that payload
verbatim into the Dirichlet fixture's `comparison.json`, and `runner/src/gate5-evidence.ts`
reconstructs it independently on both publication and reopening — so the aggregate gate
re-derives it rather than trusting a lane report. The runner reads no producer verdict: it
replays the 128 contiguous cycles, the exact binary64 CPU and single-rounded persistent binary32
GPU meter recurrences, per-cycle cross-lane tick/boundary/attachment/hole-fill agreement, both
clamp-path delta and clamped-vapor fields rebuilt from the registered `rho − destination`
construction and compared bit-exactly, its own 256-lane reduction and dispatch inventory, all
four policy-named mutations, the persistent two-advance accumulation, and the three
corrected-mass safeguards under the unchanged mixed-scalar bound — then cross-links the ledger's
operands to the fixture's published `ledger.total-mass-bd`, `ledger.dirichlet-meter`, and
`relaxation.shell-clamp` scalars so an internally consistent but unrelated ledger cannot pass.
The registered witness construction is the new non-manifest
`PHASE5_GG_DIRICHLET_LEDGER_WITNESS`; `PHASE5_PROTOCOL_SHA256` is unchanged at
`bdc61bfe5cb48e9e29f5b79337036d7b23ec11e1677f1657595d00f5e7de91ec`, which
`runner/test/phase5-wp0.test.ts` asserts directly, because the witness parameterizes an already
frozen ADR 0019 criterion rather than changing one.

Verification actually run for this slice, all from `G:/Code Files/snowflake`: exact root
`npm test` passed 56 files / 946 tests in 420.90 seconds, including Rule 7 (clean, 211 files
scanned) and both TypeScript projects; `npm run build --workspace app` built 33 modules;
`node --check` passed on both changed probe scripts; `git diff --check` is clean. The 22 new
`ADR-0019 G-G Dirichlet corrected-mass ledger` tests in `runner/test/gate5-evidence.test.ts`
each reject one tampered ledger — omitted or misplaced ledger, altered policy, truncated or
skipped chronology, forged binary64 and binary32 meters, a meter no binary32 accumulator could
hold, a clamp delta its own relaxation report contradicts, cross-lane bookkeeping disagreement,
raised device error flags, an omitted shell delta, an unclamped vapor cell, a reduction the
delta field does not produce, an abandoned registered construction, a wrong shell count, a
non-persistent accumulation, an unplanned dispatch inventory, final meters the chronology never
reaches, operands the published scalars contradict, and both within-lane and cross-lane
corrected-mass breaches.

**Hardware confirmation of the repaired ledger (2026-07-24).** `node app/scripts/phase5-wp3.mjs`
ran at clean commit `7bbacfb` on the registered Windows lane — NVIDIA GeForce RTX 3080, observed
backend `D3D12`, protocol `phase5-gpu-conformance-windows-v5` — and exited 0 with `pass: true`,
both G-G fixtures passing, 946 audited readbacks, `clampPathWitness.pass` and
`meterReductionWitness.exact` both true. Its real `ggDirichletLedger` was then accepted by the
production runner validator: 128 contiguous cycles, both meter recurrences exact on device data,
123 positive and 5 negative CPU clamp cycles, and `reductionDispatches` 2 as independently
planned. The measured corrected-mass safeguards are CPU `4559.399999999982` against initial
`4559.400000000001`, GPU `4559.440876508714` against initial `4559.400067657232`, all inside the
unchanged mixed-scalar bound `0.911980`. The direct CPU-vs-GPU meter difference is
`0.024480659606307853` — bit-for-bit the value ADR 0019 recorded when it made that comparison a
required diagnostic, which is independent confirmation that the ledger measures the same seam
the decision describes. This is an implementation-stage probe result, **not** canonical gate
evidence: no `gate5-lane` or `gate5` bundle was produced, and none should be until blockers (1),
(3), (4), (5) are closed, because the reviewer requires one exact clean commit whose bundle has
zero blockers.

**All five blockers and both should-fixes are repaired, and a full v6 bundle exists
(2026-07-25).** Exact clean commit `2e746f5786dfda7809799b10349a63448c9c7309` (WP3/WP4 now also
measure re-acquisition, so all five probes observe retry counts), superseding `42c7f3c` and
the earlier `947f22f`: a self-audit found that bundle's closure claim for blocker (4)
incomplete — the evaluator's internal replay still used the substitute summary-field mutations
the reviewer rejected, and no verifier re-derived the producer's control roster, so a fabricated
`failedCriteria` would have published. That replay is now deleted, and the runner re-executes
all sixteen registered mutations against the published payloads at both publication and
reopening (`assertObservedNegativeControls`), refusing any roster differing from its own
observations. `symmetryChecked`, `symmetryMismatchCount` and `domainContact` are likewise now
derived from the frozen fixture and the invariant operands instead of trusted as declared.
Both registered hardware commands succeeded at `2e746f5` on the RTX 3080 / observed `D3D12`
lane: `node runner/src/main.ts gate5-lane` exited 0 publishing `out/phase5/windows-d3d12` over
158 authenticated source files, and `node runner/src/main.ts gate5` exited 0 with 16/16
criteria. Protocol is `phase5-gpu-conformance-windows-v6`, SHA-256
`5ef6d11bab19e722379b3ba0c6a39bddc619cb22e21ed672478f0530a19ad115`. Artifact hashes:
`gate5-report.json` `ce500f96f85530cb5d1d776f6e1230afa36ed356f88504680694d3e9377e10bd`,
`gate5-artifact-index.json` `3e77dbc8e5378753d11bff72d5b554cfed7c230615618f75bcfc7b0673db98cf`,
`lane-manifest.json` `441ae0c09cf2077dad4dbdc7c8227ca4f141bcb7454a064026ff446a67185a44`,
`lane-report.json` `a9b9f538c02143cfc9ea71ecc3fed8ba54e8c8cbe7616adf635fa94620e36c0d`,
`artifact-index.json` `9817ec77c0f28f8726e8b912f5bbdfdb58b6e710864a205c603d17c8735f84ba`.
Root `npm test` at this commit passes 58 files / 1,011 tests in 471.20 seconds.

An independent audit of the published artifacts — not of the gate's own verdict — reports **zero
self-attested comparisons** across all ten fixtures, against 15 in the previous bundle: 242
comparisons carry two separately computed operands. The 10 remaining `null`/`null` scalars are
exactly the frozen non-applicability roster, each declaring `applicability: "not-applicable"`
with a registered reason; **zero** are unregistered and none declares itself measured while
carrying a null. All 16 negative controls were rejected with their registered owner in the
observed failing set. `NC-TOLERANCE-BYPASS` observes
`[P5-LAYOUT-INDEXING, P5-NEGATIVE-CONTROLS]`, the two-criterion outcome ADR 0022 predicted and
the old sole-criterion rule made impossible to report honestly. The bundle records 1,730 audited
readbacks totalling 185,578,140 bytes with **zero** full-field display-frame reads, and zero
device losses, uncaptured errors and hidden retries, each standing beside the observation list
that produced it. Preview performance in that exact bundle (the `2e746f5` candidate's own
`gate5-report.json`, published at `out/phase5/` when it ran and since replaced there by WP7's
evidence; the `2e746f5` bytes are not preserved on disk) measured 15.4 ms edit acknowledgement against 100, 131.3 ms first valid post-edit
frame against 2,000, 33.8 and 17.6 ms p99 submission segments against 250, and a 42.4 ms
maximum against 500, over 70 opened display frames. (Earlier superseded bundles measured
slightly different values; independent review caught this section still quoting them.)

Supporting verification at the same commit: exact root `npm test` passes 58 files / 1,011 tests
in 471.20 seconds, including Rule 7 (clean, 215 files) and both TypeScript projects, and
`npm run build --workspace app` builds 33 modules.

**Round-two candidate (2026-07-25), exact clean commit
`0a611e797203d7eba65e79657228268df4105292`.** Independent review of the `2e746f5` bundle
verified all five original blockers and both original should-fixes REPAIRED and returned zero
blockers with four should-fixes; all four are repaired at this commit: PROGRESS's superseded
prose measurements corrected, the plan's pre-ADR-0022 sole-criterion wording replaced, the
eight single-source blocking scalars now carry genuinely two-sided operands (GG
`relaxation.sweeps` measured 1/1 from the oracle report and the GPU pass-counter delta; LK ULP
scalars from the host replay against the in-shader reductions, per fixture: warm 0/0 & 0/0,
cold 1/1 & 0/0, reflecting 0/0 & 1/1 — the nonzero pairs are what proves these are
measurements, correct for cold's bounded-two-cycle classification and honest under
reflecting's fixed-point; the two-back operand also previously read the wrong quantity and
now reads the ADR 0021 definition), and the
negative-control replay now imports one shared comparison statement from the new leaf module
`gate5-comparison.ts` (no runtime cycle; drift guard retained). `gate5-lane` and `gate5` both
exited 0 at `0a611e7`, the latter 16/16; the published-artifact audit again reports zero
self-attested comparisons (242 measured). Root `npm test` passes 58 files / 1,011 tests in
499.72 seconds. Artifact hashes: `gate5-report.json`
`3c213ef580ef645aadccd7c70a053455c92e4bee28bf994c89c74eeb3295fbbc`, `gate5-artifact-index.json`
`550dff1ff672c7ced947360bb3d2379ca45c275a52cf1736dfb23dcd776d287b`, `lane-manifest.json`
`3f196044aa6181c34c62816e50d9eb94af2b6de013817bd268a5464a6a3963da`, `lane-report.json`
`9c4fda75f220517dad64cf71a4f735b2e123a4e1a0be9474221df2b0a3c7ac3f`, `artifact-index.json`
`94d1f00571223249ce25d2d687ff5f06e521d61eddc207adfa100b79acee9ce8`.

**WP5 is CLOSED (2026-07-25).** The same independent reviewer returned **zero blockers and
zero should-fixes** on round three. Round one verified all five original blockers and both
original should-fixes repaired (with the reviewer's own replays of the ledger recurrences,
negative-control roster, and protocol hashes) and returned four should-fixes; round two
verified those four repaired against the regenerated `0a611e7` bundle and returned one prose
defect; round three verified that sentence repaired at docs-only `bb97e26` with the bundle
byte-unchanged. Canonical WP5 evidence: the `0a611e7` bundle, produced at `out/phase5/` and
preserved since WP7's run at `out/phase5-wp5-0a611e7/` and `out/phase5-wp5-0a611e7-original/`
(byte-identical, hashes above), under protocol `phase5-gpu-conformance-windows-v6`. Scope is
Windows/Chromium/D3D12 only. `out/phase5/` now holds WP7's bundle, which is a different
commit's evidence and must never be read as WP5's.

**WP6 implementation is COMPLETE and awaiting independent review (2026-07-25).** Slices S0-S6
landed as `f357756` (frozen design), `a19f45b` (engine seam; worker untouched), `03254a4`
(shared production-checked device; honest fallback taxonomy), `83b2e22` (GpuEngine: live
simulation on the GPU package, fail-closed budgets naming violated limits, ~135 ticks/s on
dev-plate), `698f46b` (GPU-resident overlays/slice/crystal; go/no-go passed at 73.3 ms vs the
frozen 500 ms bound), `9115dde` (differential probe), `97c9689` (harnesses reconciled;
performance measured on the app's own engine). The Phase 3 trap note "the solver runs ONLY in
the worker" is superseded by the frozen WP6 design's D1: the float64 CPU reference solver
stays in its worker as the selectable oracle; the GPU engine orchestrates on the main thread.

Canonical evidence at exact clean commit `b26b0af` (contains all WP6 work): root `npm test`
passes 62 files / 1,110 tests in 510.35 s; `node app/scripts/phase5-wp6.mjs` exits 0 with
`pass: true` and a clean repository. Its observed quantities: the production CPU engine ran
`gg-plate-reflecting-48x48x24` at its exact registered dims to the 256-cycle cap BIT-exactly
against an independent float64 oracle; the cross-engine differential at dev-plate matched
occupancy/wall/topology/attachment history with zero mismatches and held `b` (maxAbs 2.551e-5,
rms 2.336e-7) and `d` (maxAbs 1.483e-6) inside the frozen field bounds; overlay parity showed
max channel delta 0 across all five overlays; residency stayed at zero full-field display
reads. App-path preview performance: edit ack max 10.7 ms (≤100), first valid frame max
314.5 ms (≤2,000), p99 segments 37.1 ms (≤250), max 51 ms (≤500), zero
losses/errors/retries. Phase 4 captures reran 20/20 byte-identical; Phase 3 bit-identical in
every numeric quantity with PNG deltas traced to named causes (S2 status line, S3 pane rows,
tick-rate text, and a backend-name change a control run proved predates the pin).
`PHASE5_PROTOCOL_SHA256` is unmoved; WP6 left the WP5 evidence then at `out/phase5/` untouched
(WP7 later preserved it at `out/phase5-wp5-0a611e7/` before publishing its own bundle there).

**WP6 is CLOSED (2026-07-25): the same independent reviewer returned zero blockers and zero
should-fixes over two rounds** — round one verified every scope clause from primary sources
(its own hardware run of `phase5-wp6.mjs` reproducing the deterministic quantities exactly,
its own byte-comparison of all 20 Phase 4 captures, its own backend-control run, and the full
root suite at 62 files / 1,110 tests) and returned one file-count transcription should-fix,
repaired at docs-only `f188573` and verified in round two.

**WP7 is CLOSED and PHASE 5 IS COMPLETE (2026-07-26): the independent reviewer returned zero
blockers and zero should-fixes on round three, and stated that every WP7 scope clause is met.
Scope is Windows/Chromium/D3D12 only — no Metal and no general-WebGPU portability claim
(ADR 0018).**

*The precondition repair.* The WP6 reviewer's confirmed finding was fixed first, at
`32eed48`, and hardened after review at `c436df5`. The WP6-S6 performance probe collects the
APPLICATION's own production readback labels (`app:gg:tick-N:…`, `app:view:pick-i-j-k:…`,
`app:view:sample:…`, `init:far-field-mean`), and none of them names a fixture, so the gate's
label match with a per-source default would have published all 1,195 app-path records under
the plate fixture — including the 597 the preview-column case produced. They are now
attributed from the probe's own observations: each preview case reports the application's
audit-record count at case start and at case end, and the app's `GpuReadbackAudit` is
append-only for the session, so those counts are exact index boundaries into the one published
list. The windows partition it — case k owns `[previous case end, its own end)` — so the reads
the application performed before a case opened are published with the case they precede, and
records after the last case closed fail closed. Each window is then
cross-checked rather than trusted: every named-probe pick label carries the cell the app was
asked to probe, so a pick naming a different cell than its window, or a label naming a
different registered preview case, rejects the attribution. The rule lives in the runner as
`runner/src/gate5-readback-attribution.ts` with 16 tests; the capture resolves a fixture's
submissions, interactions AND readbacks through that module's one map (`previewCaseOfFixture`,
its exact inverse) so the three cannot drift apart. No evidence-artifact schema, protocol hash,
or `app/src` source changed. The gate's terminal line (now `phase5-browser-gate-terminal-v2`)
publishes the boundary numbers, and the lane publishes that line as `stdout.log`, so the
attribution is re-derivable from the bundle alone. `setupRecordCount` publishes how many of a
case's records were taken before it opened: on this host three for the plate window (the
page-load boot engine, the probe's `applyConfig` re-init, and the budget selection that builds
the case's own engine — solver generations 1, 2, 3) and two for the column window
(generations 4, 5), each a single 8-byte `init:far-field-mean` compact read.

*Preconditions at the evidence commit.* Root `npm test` — which runs the Rule 7 scan and both
typechecks before vitest — passes **63 files / 1,126 tests in 529.02 s**;
`npm run build --workspace app` exits 0; `git status --porcelain=v1 --untracked-files=all` is
empty.

*The frozen commands, both at exact clean commit
`c436df5716578a61f8c0598e9230420cbdef6108`.* `node runner/src/main.ts gate5-lane` exited 0
(protocol `phase5-gpu-conformance-windows-v6`, backend D3D12, 172 source files) publishing
`out/phase5/windows-d3d12/`; `node runner/src/main.ts gate5` exited 0 with **16/16 criteria**
publishing `out/phase5/gate5-report.json` and `out/phase5/gate5-artifact-index.json`. The
manifest's own capture window is `2026-07-26T16:26:53.619Z` → `2026-07-26T16:27:54.684Z`
(61.065 s for all five production probes plus capture assembly). The bundle is 78 files /
80,944,402 bytes with 172 source hashes and 73 lane artifacts.

*Provenance as published.* Host win32 10.0.26200, x64, AMD Ryzen 7 5700G with Radeon Graphics,
16 logical processors, 68,502,585,344 bytes of memory. Adapter NVIDIA GeForce RTX 3080 —
vendor `nvidia`, architecture `ampere`, device `0x2206`, discrete GPU, backend **D3D12**,
driver `D3D12 driver version 32.0.15.9186`. Runtime `playwright-bundled-chromium`
`playwright-1.61.1/chromium-1228`, product `Chrome/149.0.7827.55`, revision
`@3188f8a607ae7e067593be8aab7f02d2451fec07`, launched with `--enable-unsafe-webgpu` and
`--enable-webgpu-developer-features`. Protocol `phase5-gpu-conformance-windows-v6`
`5ef6d11bab19e722379b3ba0c6a39bddc619cb22e21ed672478f0530a19ad115`, fixtures
`29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512`, tolerances
`d38ec0f7a0096dc297d651cd1b89fb80275edb4098c16545c44274e585c2a09b`.

*Artifact SHA-256.* `gate5-report.json`
`57ae43901fa140c17c7c92ab83846bca546b93f269f44c6fabd37f15b8d45026` (931,186 B);
`gate5-artifact-index.json`
`66546520c39c531ea253791fad7f5786ae6623855c7b59354ed4a18cb4c67747` (16,014 B);
`windows-d3d12/lane-manifest.json`
`a897985cd6fdc5381bf45de3bfd4e98208ed42ad70b3115cb674200001c673c5` (46,083 B);
`windows-d3d12/lane-report.json`
`1adaebbe560353e303188b178084702a48baf832551bf7869d43f29815caa007` (1,915,577 B);
`windows-d3d12/artifact-index.json`
`3659912fedca5b2db3c1bd4c09d7f9df6981c73cdaae78f2e11571dc67c89189` (14,796 B);
`windows-d3d12/stdout.log`
`57f541459e501ed7cad89900a8c6db07e7aedebc123dd348a5080ab1640442ec` (754 B);
`windows-d3d12/exit-status.txt`
`9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa` (2 B).

*Interactive preview evidence, as published in `lane-report.json` (bounds in parentheses).*
Each case ran 5 untimed warmups and 30 measured samples. `preview-plate`: edit acknowledgement
min 2.40 / **max 9.90 ms** (≤ 100) and first valid post-edit frame min 175.9 / **max 308.0 ms**
(≤ 2,000) over its 30 measured samples; **published p99 37.70 ms** (≤ 250) — the registered
`nearest-rank-ceil` percentile of those 30 samples' per-sample maximum segments, taken from the
bundle's own `p99ByBudget` rather than recomputed here. `preview-column`: edit acknowledgement
min 5.10 / **max 10.90 ms**, first valid post-edit frame min 161.8 / **max 309.3 ms**,
**published p99 34.40 ms**. Every one of the **560 bounded submission segments** the two cases
produced (280 each, warmups included, which is the population the dispatch criterion checks)
is inside the 500 ms bound; the largest is **50.40 ms** on the plate case and **34.40 ms** on
the column case. Zero samples accepted or rendered a stale generation. Device losses,
uncaptured errors and hidden retries are **0/0/0**. The audit holds **2,715 readback records
totalling 185,590,780 bytes with zero full-field display-frame reads**.

*Published-artifact audits (run against the bundle bytes, not against any evaluator verdict).*
Zero self-attested operands among the **242 decision, event-record and invariant comparisons**
(167 decisions, 39 event records, 36 invariants) — the rows where a lane could have quoted the
other side. Beside them the bundle publishes 160 scalar comparisons (150 measured, 10
registered non-applicable) and 15 field comparisons. Those ten null/null blocking scalars are
every one registered in `PHASE5_SCALAR_NON_APPLICABILITY`, with zero unregistered or
inconsistent. All
**16 negative controls REJECTED with the registered owner inside the observed failing set**
(ADR 0022's rule; `NC-TOLERANCE-BYPASS` legitimately fails `P5-LAYOUT-INDEXING` alongside its
owner `P5-NEGATIVE-CONTROLS`). The attribution audit, derived from the published bundle alone,
reproduces the two windows (`preview-plate` → `gg-plate-reflecting-48x48x24`, records
`[0, 598)`, in-case from 3, 3 setup reads, pick target 200-200-25; `preview-column` →
`gg-column-dirichlet-noise-timeline-32x32x64`, records `[598, 1195)`, in-case from 600, 2
setup reads, pick target 80-80-160), confirms the per-fixture record sets reconstruct the raw
2,715-record inventory exactly, splits the 1,195 app-path records **598 plate / 597 column**,
and finds **840 self-identifying pick labels agreeing and 0 contradicting** while **0 of the
1,195 labels name a fixture at all** — which is the defect the repair removes.

*Review round one and what it changed.* Independent review of the first WP7 bundle (commit
`32eed48`) returned **zero blockers and four should-fixes**, having re-executed the whole
claim: the reviewer's own `npm test` (63 files / 1,125 tests), its own performance-probe run
reproducing the case boundaries `3/598` and `600/1195` and the same 598/597 attribution, the
runner's own `verifyPhase5LaneBundle` and `verifyGate5Aggregate` on the published bytes, all 78
file hashes, both artifact indexes cross-linked, and the 172 source hashes re-derived from a
fresh detached-worktree export of the commit. Its four should-fixes: (1) the p99 figures this
file had quoted were a percentile recomputed over a flat segment list, not the registered
statistic the bundle publishes; (2) the module comment described a case's pre-opening reads too
narrowly; (3) the preview-case-to-fixture map was duplicated between the attribution module and
the capture's submission/interaction filters; (4) "242 measured" was quoted without saying what
it counts. All four are repaired above and at `c436df5`, and **the evidence was regenerated at
that commit** so the published bundle is the product of exactly the code that ships — the
`32eed48` bundle is preserved under `out/phase5-wp7-32eed48-superseded/` and must not be
quoted as current.

*Rounds two and three.* Round two re-authenticated the regenerated bundle rather than carrying
round one forward — all 78 hashes, both artifact indexes cross-linked, the 172 source hashes
against a fresh detached-worktree export of `c436df5`, both runner verifiers accepting the
published bytes, the negative-control replay, the attribution re-derived from the bundle alone,
and its own probe run at this commit reproducing the same windows and the same 598/597 split.
It also checked that the two code repairs are behaviour-preserving: `previewCaseOfFixture`
agrees with the deleted inline ternaries across all fourteen registered fixtures with zero
disagreements, and all twenty fail-closed mutations still refuse. It returned **zero blockers
and two should-fixes**, both prose: three sentences still pointed at `out/phase5/` for WP5's
accepted bundle, and the WP7 summary clause kept the over-narrow phrasing round one had flagged
in the code comment. Both are repaired at docs-only `dae9aef` with the bundle byte-unchanged
(re-hashed after the edits). **Round three returned CLEAN — zero blockers, zero should-fixes —
and stated that every WP7 scope clause is met, that the box may be checked, and that Phase 5
may be called complete.** The reviewer's own summary of the evidence itself: nothing wrong in
the bundle, the code, or any published number.

*What the reviewer did not check, recorded as a limit of this evidence rather than a gap in
it.* The numerical physics behind the science comparisons was not recomputed from the
checkpoint bytes — the tolerance manifest hash, the zero-failure counters, the applicability
rules and the runner's own payload-graph re-derivation were verified instead; that recompute
was WP5's review scope and the tolerance hash is unchanged. Re-running the frozen commands to
reproduce this exact bundle was out of scope by instruction (the two runner verifiers are the
read-only substitute), as were the browser probe's internal timing seams and the historical
WP1-WP4 claims. One inherent limit of the attribution rule is disclosed by the module itself:
shifting a window boundary by ±1 inside a run of records that carry no self-identifying content
would be accepted, so roughly 30% of app-path records rest on the application's own audit
counts rather than on label corroboration.

*The superseded WP5 bundle is preserved, not overwritten.* Its five recorded hashes were
re-verified on disk first, then it was copied file-by-file to `out/phase5-wp5-0a611e7/` (78/78
byte-identical) and the original directory renamed to `out/phase5-wp5-0a611e7-original/`
before the WP7 run created a fresh `out/phase5/`. Both copies are the accepted `0a611e7` WP5
evidence; neither may be relabelled as WP7's.

**Next action: close Phase 6 WP0c — Δx and the σ axis are the last two freeze rows.** Both wait on
a cost measurement of the finer grid that is running now; everything else in the freeze list is
registered and the parameter table is frozen and hash-enforced. Phase 5 is closed and pushed (`d8a8a39`); the
Phase 6 plan is registered at [phase-6-nakaya-validation.md](plans/phase-6-nakaya-validation.md)
and **no validation sweep may run until WP0's freeze lands**. WP1 is done (`research/nakaya-morphology-diagram.md`: boundaries −3.3/−9.9/−21.5 °C ±0.5, a non-uniform temperature axis, and a water-saturation cross-check that passes on position and fails on scale).

**WP0b is done (2026-07-26) and it found a solver defect, not a probe artefact.** One calibration
run reported `symErr = 0.020915` with noise off where its siblings reported 0. Reproducing it
established two things. First, the break was **not silent** — the run line already published
`deltaSymClean=false` and the heartbeat printed `deltaSym=false` from step 78; the WP0 calibration
harness parsed only `symErr=` and dropped it, so the defect was in the solver and the silence was
in a coordinator-only probe. Second, the cause is float64 addition order in the boundary operator:
`opposingSigma` accumulates the Eq. 5.35 opposing-vapor operands in lattice-gather order, and
rot60 permutes those enumeration positions by the cycle (1 3 6 2 4 5), which is not
order-preserving — so from three operands up, a cell and its rotated image sum the *same operands
bitwise* in a different order, and float64 addition is not associative. Re-summing the image's
operands in the source cell's direction order reproduces the source value bit-for-bit. The
resulting ulp propagates through σ_b → α_HK → fill rate → accumulated fill until one orbit member
attaches a step early. **How often that happens was then measured rather than assumed**: the
field asymmetry is chronic (at 32³ the field loses exact D6h invariance at growth step 14 while
the attached set stays invariant through step 40), but whether it reaches the attached set is
condition-dependent. Re-running two v5 siblings that had reported `symErr = 0` with the dropped
field captured, both came back `deltaSymClean=true` — genuinely clean runs, not lucky stops. So
of three v5 grid points examined, one broke and two did not; `symErr` at the stop instant is a
weaker check than the per-step delta, and the safe reading is that a v4/v5 `symErr = 0` does not
by itself establish a clean run. Fixed by
[ADR 0023](decisions/0023-d6h-equivariant-opposing-vapor-mean.md): surface policy
`aggregate-hv-g1h1-v6`, identical to v5 except that those operands are summed in ascending value
order, making the mean a function of the operand multiset alone. v4/v5 stay bit-unchanged because
Phase 4b and Phase 2b evidence was produced under them, and the runner's default stays v5 — Phase 6
names v6 explicitly. On the configuration that opened WP0b, v6 gives `symErr = 0` and
`deltaSymClean = true` at the same stop step (88), extent (17) and aspect ratio (0.605799), with
attached count 765 → 749. The WGSL kernel has the same defect in f32, where one ulp is ~1.2e-7; it
is registered rather than repaired, and the GPU LK entry points already refuse any policy but v5,
so the diagnostic lane now differs from the sweep in width, tolerance **and** operand order.
**Consequence: every calibration number measured under v5 must be re-measured under v6.**

WP0 calibration had already caught three things by running rather than reading: the registered surface policy was ADR 0009's `v4` while every run uses `v5`; the σ ladder cannot be computed from `sigmaWater()`, whose difference form goes negative warmer than about −3 °C; and **the habit metric is degenerate at a small measurement size** — five physically different runs all returned `AR = 0.740` (a v5-era measurement whose direction is expected to hold but whose values are being re-measured). That last one, plus CPU run costs of 191–289 s at a *degenerate* size, means the measurement size and grid cannot be frozen from CPU probes alone. **The plan was rewritten on 2026-07-26 against the operator's stated priority — accuracy to reality and science first, speed secondary.** The GPU registration is retracted on measurement: it ran 6x slower than the oracle at 28^3 and cannot satisfy the frozen absolute `divTol = 1e-7` in sustained runs at all, because that tolerance sits below the float32 roundoff floor. The sweep runs on the float64 CPU oracle, parallel across cores; the GPU keeps a labelled diagnostic role only. Numerical verification now runs BEFORE the grid freeze, because 28^3 gives a needle where 96^3 gives a plate at identical conditions; the 1D spherical reference solver returns to scope as the only absolute accuracy anchor; the parameter uncertainty (both sigma_0 crossings, the +/-25% cold-side band edges) is swept rather than narrated; and a cross-platform reproducibility control is registered, since Math.exp/log/pow are not correctly rounded and a habit class that flips between arm64 and x64 would be a fragility finding. The pre-freeze source corrections
are already in (2026-07-26): `docs/libbrecht-parameters.md` now records SDAK-2 as an `A_prism`
mechanism rather than a missing gap (§4.2), the printed width parameterization (§4.3), the
latent-heating parameter `chi_0(T, P)` with anchors and its `sigma_inf/(1 + chi_0)` correction
(§7), and a qualified pressure-independence entry carrying the monograph's own retraction —
each quotation verified against the page renders, and each free to make only while the file is
unfrozen. WP0a (schemes and decisions needing no probe) and WP0b (the symmetry defect) are
closed.

**WP3b is closed (`7d821ee`) and it corrected the source.** The 1D spherical reference
(`solver-cpu/src/spherical-reference.ts`) is the project's only *absolute* accuracy anchor —
everything else shows the solver agreeing with itself under refinement. Transcribing monograph
Eqs. 3.16–3.24 and 3.33–3.36 from the page renders exposed an **erratum in the printed Eq. 3.35**:
its denominator should be the attachment coefficient, not `X_0/R`. Three independent checks
confirm it, each of which the printed form fails — Eq. 3.33 must reduce to Eq. 3.17 as the shell
recedes (the printed form yields the exact complement); an independent exact solve of the same
boundary-value problem gives an amplification of 1.18947162 that the corrected bracket matches to
every digit and the printed one misses by 16%; and a crystal with zero attachment must carry no
far-field bias, where the printed form asserts 22%. The source's own stated check cannot catch
this, because the bracket tends to 1 for any value. The consequence is large: the printed form
makes the finite-shell bias a few percent and independent of crystal size, while the corrected
form makes it grow toward `[1 − R/R_far]^(−1)` — about 46% at 48³ and **~160% at Phase 2b's own
extent-61-in-96³ configuration**.

**That drove ADR 0024 (`c16208e`): a monopole-matched far field.** Monograph Eqs. 5.30–5.31 hold
each shell pixel at `sigma_inf − (dV/dt)/(4·pi·rho_far·X_0·v_kin)` rather than at a flat
`sigma_inf`. Measured: growing the same crystal 60 steps, the fixed-σ shell gives 291 attached at
28³ against 279 at 40³ — a 4.1% swing from domain size alone — while the monopole shell gives
**231 at both**, identical aspect ratio, symmetry exactly 0. Two consequences are stated rather
than buried: **it changes the answer** (AR 0.500 → 0.300), so no threshold measured under the
Dirichlet shell transfers; and **it has a validity limit** (24³ through 48³ agree, 20³ does not),
so it moves the minimum domain outward rather than removing it. The ADR attributed that limit to
the point-source approximation and so to the ratio `rho_far/R`; **WP3 disproved the attribution**
and the ADR now carries an erratum — see below. `dirichlet` and `reflecting` are bit-unchanged and
gate 2b pins its own.

**v6 reproduces Phase 2b exactly at full scale.** Re-running Phase 2b's −15 °C column condition
(96³, σ∞ = 0.002, extent 61) under v6 returns step 330, attached 1,159, extent 61,
`AR = 12.2000`, `symErr = 0` — every published digit of the accepted v5 evidence. That is the
strongest available evidence that ADR 0023 changed summation order and not physics.

**WP3 is closed and reported at [phase6-convergence.md](../research/phase6-convergence.md).** Four
convergence studies, all under v6 + monopole matching; every point reported `symErr = 0`,
`deltaSymClean = true` and a converged relaxation. The dominant finding is a **class/value split**:
on three of the four axes the habit CLASS converges early while the value underneath converges late
or not at all. Registered from it: **domain N = 48**, **measurement extent 21**, **`cflFill` = 0.1**
— each carrying a measured residual rather than a claim of convergence. Four things are worth
carrying forward:

- **Domain, and a sequencing error that cost correctness rather than confidence.** The first ladder
  ran at extent 15 and the measurement extent was *then* chosen from the trajectory curves, so the
  two did not compose. Re-running at the registered extent 21 (10 points, N = 40…80) did not merely
  reconfirm it — it **reversed its central conclusion**. At extent 15 the cold attached count
  climbed monotonically to 64³ and was reported as an unconverged domain systematic; at extent 21 it
  converges exactly by N = 64 (5185 → 5161 → 5161 → 5159 → 5159), and warm is bit-identical at all
  five domains. The non-convergence was an artefact of measuring mid-development.
- **Grid Δx is the axis that does not converge.** Δx = 0.7 flips the cold habit class outright;
  Δx = 0.35 — the value every result in this project has used — still moves `AR` +10.6% cold and
  +18% warm going finer, approximately first order, extrapolating to warm 0.584 and cold 1.305
  against thresholds of 0.667 and 1.5. Neither class flips under the extrapolation and **both move
  in the direction that would flip them**. This is what makes Δx a cost/systematic decision at WP0c
  rather than a free pick.
- **ADR 0024's validity limit is real; its explanation was wrong.** The 20³ break sits at
  `rho_far/R` = 1.74, not the "about 2.3" recorded — the `hexPrism` shell's nearest cell is at
  ≈ 0.42·N, not N/2 — while the extent-21 ladder is bit-identical down to ratio 1.24. Absolute
  clearance in cells does not order the two either (3.31 breaks, 2.50 is exact), and the dipole term
  `(R/rho_far)²` anti-predicts. Every candidate makes the *smaller* crystal the more sensitive one,
  the reverse of multipole truncation, so **the governing quantity is not identified**. The
  operative consequence is that the minimum domain must be measured at the configuration actually
  being run and must not be extrapolated from another.
- **The 65% domain-contact guard is not a convergence criterion.** At extent 21 it admits cold at
  N = 40, which still carries a +0.50% attached-count error. It is a collision heuristic and must
  not be read as evidence of domain independence.

**WP0c is most of the way in (2026-07-27).** Nineteen of the twenty-one freeze rows now carry a
registered value, each tied to the study that produced it. Registered: measurement extent 21,
domain 48³, `cflFill` 0.1, the habit thresholds, `relaxTol` 1e-9 **with its norm stated**
(a relative max-norm on the successive-iterate *change*, not a PDE residual — which is why ADR
0006 pairs it with the independent divergence identity), `divTol` 1e-7 relative,
`relaxMaxSweeps` 200000, 101325 Pa, the canonical 19-site seed, noise 0, and seed-ensemble size
1 (a *consequence* of noise 0 — the RNG is consumed only by the alphaHK slowdown, so an ensemble
would report a spread of exactly zero and misrepresent a deterministic result as a sampled one).

Four WP0c decisions are worth carrying rather than just recording:

- **The temperature axis is uniform 1 °C from −2 to −35, and that reverses the plan's own design
  note.** The note assumed fine spacing near the boundaries had to be bought by coarsening
  elsewhere; a cost probe measured otherwise, so the axis is fine everywhere. Not finer than
  1 °C, because the band half-width is `0.5 + spacing/2` and the 0.5 floor is the *reference's*
  uncertainty — resolving past it would measure our axis, not compare against theirs.
- **The ambiguity band is now a number, ±1.0 °C, and the evidence budget is published
  pre-sweep**: of 34 temperatures, **28 count as evidence and 6 are ambiguous** (−3, −4, −9,
  −10, −21, −22), two flanking each boundary. Discovering that split after seeing results is the
  post-hoc move the freeze exists to prevent.
- **Uncertainty is reported as class robustness, not as an interval on `AR`.** The grid does not
  converge, so a bar around `AR` would imply a precision the study itself denies. Every point
  instead carries its measured class *and* its grid-extrapolated class, and headline agreement is
  counted twice. Where the two differ the point is flagged grid-fragile in both counts rather
  than dropped from either. The σ₀ ±25% band is not folded in — it moves the inputs rather than
  the measurement, so WP4 sweeps its edges as separate runs.
- **`docs/libbrecht-parameters.md` is FROZEN and enforced by content hash**, recomputed from the
  live file by the test suite, LF-normalized so it verifies on any platform including the arm64
  control. An edit now fails the suite instead of silently changing what a completed sweep ran
  against.

**The cross-platform control is built, measured on x64, and committed marked `MAC RUN NEEDED`**
([docs/phase6-cross-platform-control.md](phase6-cross-platform-control.md)) rather than blocking
the phase. Tier 1 is a millisecond libm fingerprint — 448 bitwise float64 entries covering every
transcendental the solver consumes, digest `560aeaf7` — which localizes a difference to a
function and an argument. Tier 2 is the end-to-end habit class at the sweep's own configuration;
its baseline needed no new runs because the fixture reproduces WP3's extent-21 ladder conditions
exactly, which a test asserts so the two cannot drift apart. **A habit class that differs across
architectures is a FINDING reported as fragile** — never averaged away, and neither architecture
declared correct.

Two rows remain: **Δx** and the **σ axis**, both waiting on a cost measurement of the finer grid
(Δx = 0.2333 µm, 72³, extent 32) now running. The coarse-grid cost is measured: eight
temperatures at the registered configuration cost 40 minutes wall across seven cores, and cost
peaks at −15 °C and falls both ways — so the plan's assumption that the cold low-σ end is
uniformly the expensive one does not hold at fixed water-relative fraction. Δx is under the
operator's option 1: register the finest affordable spacing and carry the extrapolated grid bias
on every point. It is not a free pick — WP3 §4 found Δx is the one axis that does not converge —
and choosing a finer one **re-opens the domain budget**, because WP3 §1.3 disproved the rule that
would have let it be extrapolated.

WP0's remainder is **WP0c**, which the rewritten plan sequences *after* WP3's convergence
studies: re-run the calibration probes under v6 **and the monopole shell**, choose the T/σ grid,
the habit measurement size, the metric thresholds, the domain budgets, Δx, the numerics
tolerances and the seed-ensemble size from them, register the whole freeze list in the
hash-pinned protocol module, then freeze the parameter table. Two corrections have now
invalidated earlier calibration numbers, which is precisely why numerical verification runs
before the freeze rather than after it. The comparison target is settled:
the classical Nakaya diagram (Libbrecht 1211.5555v1 Fig. 1) is the qualitative report card
charter §2.3 asks for — its axis converts to σ exactly via `cSat()`, and its printed
water-saturation curve cross-checks the transcription against `sigmaWater()` — while Libbrecht's
Fig. 8.16 e-needle grid is the quantitative target later, gated behind the ADR-level column-seed
question. Nothing in Phase 5 authorizes a physical-validation or calibration claim; the GPU
port's claim is conformance to the CPU oracle on observed Windows D3D12, nothing more.
Do not push unless the user separately asks. Do not modify, move, or delete anything
under `out/phase5/`, `out/phase5-wp5-0a611e7/`, `out/phase5-wp5-0a611e7-original/`, or
`out/phase5-wp7-32eed48-superseded/`. Metal is deferred; never relabel Windows evidence as
Metal or claim general WebGPU portability. Preserve accepted evidence under `out/phase2b/`,
`out/phase4/`, and `out/phase4-visual/`. Standing disclosures that are not defects: GPU-mode
raycast picking is deferred with named-probe `pickCell` as the floor; `growthPropensity` is
refused by name in GPU pick readouts.

**Phase 3 is COMPLETE — maker-asserted 2026-07-23 (ADRs 0007/0008), orchestrated per
[phase-3-dev-visualization.md](plans/phase-3-dev-visualization.md)** — all work packages
built, adversarially reviewed (R1: 2 rounds to CLEAN incl. one blocker; R2 and R3: CLEAN with
all should-fixes landed), visually inspected, and the flagless `gate3` evidence run passed
with exit 0 (values in the gate table). **Review entry points:** the plan's passing criteria
and Steps evidence; the pre-registration trail (thresholds committed at d80b426/4867a67
before the evidence run); `out/gate3.log`, `out/gate3-depletion.csv`,
`out/gate3-exit-status.txt`, `out/gate3-plate.ckpt` (byte-identical to the accepted 2a
artifact); the `out/phase3-visual/` captures, reproducible via `node app/scripts/visual.mjs`;
and the review-loop records in the plan's Steps. Repro commands: `node runner/src/main.ts
gate3` (evidence) and the Phase 3 plan's recorded suite. The maker accepted this evidence on
2026-07-23 without changing the protocol. Traps for whoever opens `app/`: the
solver runs ONLY in the worker; checkpoint headers carry exactly the eleven v1 metric keys
(depletion metrics are print/CSV material — re-adding them to headers needs an ADR, see the
phase-3 plan's Tried and rejected); the Rule 7 scan covers app code, so Three.js's
alpha-named opacity APIs stay banned. Nothing below about 2b is superseded by this.

Phase 1 is closed (2026-07-15). Phase 2a is closed — maker-asserted complete 2026-07-15
(evidence in the plan's Steps). 2a byte-identity was re-verified after the follow-up evidence
hardening: exact enforced run exit 0, `cmp` exit 0 against `out/plate-gate.ckpt`, SHA-256
`f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`; exact results and
adversarial cases are in [the hardening plan](plans/phase-2a-evidence-hardening.md).
**Phase 2b historical v3 record (2026-07-16): the scoped no-SDAK deliverables and implementation
existed, and protocol v3 completed as execution-valid negative evidence for its exact
implementation.** This history is retained after the passing v5p result above.
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

**Phase 2b terminal v5p record (2026-07-20):** implementation `c30aa6f` and final reviewed
execution commit `0dc0f86` launch fixed −5/−15 °C roles concurrently and bind processes, IPC,
results, and decoded checkpoints fail-closed. The one flagless run exited 0 with aspect ratios
`0.118644` and `12.2000` at extent 61, exact symmetry, all relaxations converged, and every
registered criterion enforced. The final log SHA-256 is
`ea69d65ab5baf4c06d0f6947683f4f7c580ebec3d3590f7db83b7730a14c45e6`; plate and column
checkpoint SHA-256 values are
`c81f45b7efba2a4db92da0b3871e919e74b93e3a8a99663add4103d58e8b532f` and
`28e97c088b3ce6ad3bd1d15f1a3638b1a1ac17092aacb2c07b085c04432a669a`. Stable local copies live
under `out/phase2b/v5p/`; v4 is under `out/phase2b/v4/`; interrupted sequential-v5 liveness logs
are under `out/phase2b/v5-interrupted/`. Preserve those bytes and do not rerun or relabel them.

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
