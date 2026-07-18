# 0012 — Phase 4 branch controls use a matched normalized reservoir stopping rule

- **Date:** 2026-07-18
- **Status:** accepted (maker-authorized Phase 4 v2)
- **Charter impact:** §3.2 Phase 4 updated in this session (charter v1.9 → v1.10)

## Context

Phase 4 v1 registered a dendrite under the published G-G dendrite preset and a compact control
under the published plate preset. The dendrite stopped at the ordinary reflecting far-field
condition and supplied its final transverse extent as a live target for the compact control.
That target was intended to prevent crystal size from confounding the branch-count comparison.

The contract combined two incompatible ideas. A reflecting G-G run consumes a finite reservoir,
and different surface parameters convert that reservoir into different crystal extents. The first
canonical v1 attempt therefore ended honestly but invalidly: the dendrite reached transverse
extent 99 at its ordinary far-field stop, while the compact control reached its own ordinary
far-field stop at extent 83 before it could cross 99. An unchanged non-evidence replay confirmed
that the step cap was still 6,550 cycles away and that the failure was not a runner defect.

The charter requires a dendritic result and a compact negative control; it does not require one
reflecting finite-reservoir experiment to inherit a geometric target from another. G-G §III uses
a far-field vapor fraction as an ordinary stopping rule. The existing v1 runner already uses and
records the first observed crossing below `2*rho/3` every 25 completed cycles, but only
cross-checks copied scalar rows; v2 adds the independent raw verification specified below.

## Decision

Phase 4 v1 remains immutable failed history and cannot satisfy Phase 4. Phase 4 v2 changes the
A-BRANCH compact-control termination contract plus the mechanical wire, raw-witness, and
non-vacuity rules needed to make that replacement fail closed. It changes no numeric morphology
parameter or acceptance threshold:

1. The dendrite and compact control both run to their own first registered observation with
   `farFieldMean < 2*rho/3`, before the unchanged 12,000-cycle cap. Each run uses its own
   registered preset value of `rho`. What is matched is the source-authorized normalized
   threshold, observation cadence, and first-observed-crossing rule—not equal terminal
   `farFieldMean/rho`, equal absolute vapor fields, or equal geometry. Both normalized crossing
   means are recorded.
2. The dendrite remains the published dendrite preset with only `rho=0.105`, dimensions
   `160,160,48`, hex-prism domain, seed 1, noise off, and reflecting far field. It must retain
   `branchCount >= 6` and aspect ratio `< 0.3`.
3. The compact control remains the exact published plate preset with the same dimensions,
   domain, seed, noise setting, and far-field condition. It must retain `branchCount = 0`.
4. Both runs must independently pass every shared Pass-A execution criterion. The A-BRANCH
   record carries each run's `rho`, threshold, previous/crossing cycles and means, final
   transverse extent, stop reason, branch count, and shared-configuration hash. The compact
   control is non-vacuous only if its final raw occupancy strictly exceeds the canonical 19-site
   seed and its independently reconstructed delta chain contains at least one nonempty attachment
   cycle. It makes no same-size claim.
5. The v2 Pass-A wire identity is pinned by the matrix below and rejects the v1 dependent-extent
   stop kind. The new criteria-freeze commit joins the three existing freeze ancestors in
   execution provenance. V1 reports or manifests cannot be relabeled as v2.
6. Every other Pass-A scenario and every numeric parameter, morphology threshold, cap, and
   cadence are unchanged. Evidence is strengthened only where v2 version separation, raw
   far-field verification, and the explicitly grown compact control require it. The frozen
   Pass-B manifest and its diagnostic semantics are unchanged.
7. No calibration execution is allowed between this decision's criteria freeze and v2
   implementation. The first real v2 run is canonical evidence; a blocking failure is recorded,
   not tuned away.
8. Decision 0010's obsolete Phase 4 worktree location is amended: v2 runs only on `main` at the
   current Windows root `G:\Code Files\snowflake`. Its isolation semantics remain binding on the
   separate Phase 2b worktree/process/artifacts and on Phase 3 evidence.

The comparison is therefore matched by a source-authorized normalized threshold/cadence/
first-crossing rule. Final normalized crossing values and geometric extents remain separately
reported outcomes rather than equality prerequisites.

### Raw far-field witness

The stop is load-bearing and cannot be proven by a crossing object that merely copies CSV row
scalars. Every Pass-A run records an independent raw witness at cycle 0 and after every completed
cycle divisible by the unchanged cadence 25, through termination:

- `runs/<runId>/far-field.f64le`, kind `phase4-far-field-f64le-v1`, is one little-endian float64
  per far-field support cell, sample-major, at each registered observation.
- The support is independently derived from dims, center, and hex-prism geometry in increasing
  flat-index order: every active cell with hex distance equal to the inscribed radius or absolute
  z offset equal to the active half-extent. Scenario payload v2 contains a nested
  `farFieldWitness` object with exactly these keys and no others: `version`, `path`, `kind`,
  `encoding`, `supportDefinition`, `supportCount`, `supportIndicesSha256`, `sampleCycles`,
  `valuesPerSample`, `byteLength`, and `sha256`. Their fixed literals are witness `version: 1`,
  `kind: "phase4-far-field-f64le-v1"`, `encoding: "float64-le"`, and
  `supportDefinition: "hex-prism-active-outer-shell-v1"`; the remaining values bind the exact
  artifact/support/samples described here. Support-index hashing encodes each index as
  little-endian int32.
- The verifier reconstructs occupancy at every sample from the canonical seed and raw delta
  chain, excludes attached support cells exactly as `farFieldMean()` does, and recomputes each
  mean with an ordered Neumaier compensated sum. The CSV value must be bit-identical to that raw
  recomputation.
- From those recomputed means and the manifest's `rho`, the verifier proves the exact threshold,
  previous/crossing cycles and values, first observed crossing, and stop reason. A size-target
  run must have no observed raw crossing before its stop. A coherent scalar row/crossing rewrite
  with unchanged raw witness fails.

Every observed cadence is witnessed; v2 makes no unproved monotonicity assumption. Fixture tests
derive the support and compensated means independently rather than calling the capture helper.

### Exact v2 wire identity

This matrix is part of the decision; implementation may not choose different version literals:

| Surface | Exact v2 identity |
|---|---|
| Pass-A manifest | `version: 2`, `protocol: "phase4-pass-a-v2"`, exact rebuilt canonical SHA-256 pinned in code and the plan after implementation review |
| Pass-A evidence report | shared `phase4-evidence-report+json` envelope remains `version: 1`; exact `protocol: "phase4-pass-a-v2"`, `pass: "A"`, `operator: "GGThreshold"`; payload is `version: 2` |
| Pass-A artifact index | shared complete-publication index remains `version: 1`; every existing descriptor-kind literal and checkpoint kind `gg-checkpoint-v1` remains unchanged, and exactly one new kind `phase4-far-field-f64le-v1` is added |
| Pass-A scenario/delta payloads | scenario payload is `version: 2` and contains no dependent-target field; delta payload remains `version: 1` because its schema is unchanged |
| Pass-A far-field witness | exact `runs/<runId>/far-field.f64le` / `phase4-far-field-f64le-v1` binary and scenario-v2 metadata contract above, for cycle 0 plus every registered observation |
| Aggregate report | `version: 2`, `protocol: "phase4-aggregate-v2"`; it records Pass A protocol/version/hash and Pass B protocol/version/hash explicitly |
| Pass B | unchanged manifest `version: 1`, `protocol: "phase4-pass-b-v1"`, canonical SHA-256 `c0ceed5b0ebb68defee85b1d78d52c9563f5edd35ed415b8cfdad57dd7c3e812`; report envelope/payload/index stay v1; LK checkpoints stay v2 |
| App real/synthetic Pass-A identity | exact A v2 manifest/report/payload identity above; synthetic bundles remain explicitly developer-only and NOT GATE EVIDENCE; no A v1 compatibility path |
| App Pass-B identity | exact unchanged B v1 identity above |
| Visual capture manifest | visual schema remains `version: 1`, but every Pass-A source identity is `phase4-pass-a-v2`; a v1 Pass-A source rejects before capture |

The Pass-A provenance object retains the existing keys with their existing meanings:
`criteriaFreezeIsAncestor` for `e567767`, `runnerFreezeIsAncestor` for `cd24365`, and
`cadenceFreezeIsAncestor` for `7be4c5d`. It adds exactly `v2CriteriaFreezeIsAncestor` for the
reviewed authority-freeze commit. The Pass-A manifest's `criteriaFreezes` array contains those
four hashes in that order. The freeze hash is bootstrapped in two commits: the first contains the
reviewed authority text and defines the hash; a metadata-only follow-up records that full hash
without changing criteria. Implementation begins only after the follow-up.

Pass B must not inherit the new key merely because its current collector is shared with Pass A.
Its provenance JSON remains exactly the existing seven keys: `node`, `v8`, `head`,
`trackedStatus`, `criteriaFreezeIsAncestor`, `runnerFreezeIsAncestor`, and
`cadenceFreezeIsAncestor`. The B collector projects those keys into an owned B object and omits
`v2CriteriaFreezeIsAncestor`; its existing validation meaning and report envelope/payload/index
versions and schema remain v1. Only the frozen Pass-B manifest bytes/hash are identical; execution
report bytes remain run-dependent.
The v2 aggregate obtains the new ancestry claim from its Pass-A half.

## Consequences

- Buys: both registered reflecting experiments can terminate under the same pre-existing,
  independently witnessed rule; neither run's feasibility depends on the other's geometry.
- Preserves: published G-G presets, reflecting machinery fidelity, exact mass accounting,
  branch thresholds, caps, cadence, source hashes, Pass B, and all prior negative controls.
- Proves: the compact negative is a live grown morphology rather than a seed-only branch count of
  zero; the lower bound is the canonical initial state, not a value selected from v1 output.
- Costs: the two final crystals may differ in size, so v2 cannot claim a size-matched comparison.
  It instead claims a matched normalized threshold/cadence/first-crossing rule and reports both
  normalized crossing values and extents.
- Requires: a new manifest version, criteria-freeze ancestor, fail-closed v1/v2 separation,
  targeted adversarial tests, full regressions, and a fresh canonical Phase 4 run.
- Forecloses: choosing a fixed extent from the observed 99/83 result, widening the v1 cap,
  changing either preset, switching only the control to Dirichlet, or reusing v1 output.

## Alternatives considered

- **Widen the v1 cap.** Rejected because the ordinary far-field stop bound 6,550 cycles before
  the cap. A conforming v1 run had to stop there; continuing beyond it would be a different
  protocol, and the remaining vapor's hypothetical later geometry is not claimed.
- **Choose a fixed extent below 83.** Rejected as outcome-fitted. No source or charter clause
  privileges a number selected after observing both endpoints.
- **Use the dendrite's final extent but switch the compact control to Dirichlet.** Rejected
  because it silently compares different far-field experiments, discards the reflecting mass
  invariant for one side, and still lets one result define the other's stop.
- **Switch both runs to Dirichlet.** Rejected because Pass A certifies the published G-G
  reflecting machinery and its finite-reservoir behavior; fixed-supersaturation physics runs
  belong to the LK/Phase 6 path.
- **Compare at an equal cycle count.** Rejected because a tick has no physical-time meaning and
  equal cycle count is not a source-defined environmental endpoint.
- **Remove the compact control.** Rejected because the live negative control proves that the
  branch metric distinguishes the registered dendrite from a compact morphology in the same
  domain and measurement pipeline.
