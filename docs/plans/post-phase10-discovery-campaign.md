# Post-Phase-10 discovery campaign

**Status:** runner implementation checkpoint ready; no campaign row launched
**Worktree:** `G:\Code Files\snowflake-science-exploration`  
**Branch:** `explore/post-phase10-discovery`  
**Base:** `fda6bd3a1aa04b819de81576d446e191213080b1`  
**Claim level:** exploratory model-development evidence only

## Goal

Use the Windows host's independent-process capacity for one bounded discovery campaign that asks:

1. does the published -6 C / fraction 0.15 M1 numerical sentinel approach a domain/timestep
   plateau, and do domain and fill-CFL errors interact;
2. when, during growth, do M1 and its matched no-dip ablation diverge; and
3. does that divergence have reproducible transition structure as forcing changes in the warm
   and cold regions where the existing final states differ strongly?

This is not Phase 7, does not reopen Phase 10 or C0V/S6, and is not a new validation gate. A useful
negative result is allowed: the campaign may find only unresolved numerical sensitivity or final
differences without a localized growth mechanism.

## Why these experiments

The selection is derived from committed bytes, not from an unbounded search:

- `evidence/phase10-numerical-verification-v1/c0-analysis.json`, SHA-256
  `bfd247d513aa2b2bda98a4db4d1885877a1788ddb3dfdc92be79b415ce94bc72`, reports maximum
  attached-count changes of 9.285% for seed radius, 4.564% for the latest coarse-domain rung,
  3.098% for `cflFill`, and 1.094% for the latest fine-domain rung. These are all larger than the
  inherited 0.5% comparison tolerance except the relaxation-tolerance effects.
- The matched Phase 6 M1 and `M1_NO_DIP_ABLATION` rows are
  `evidence/phase6-sweep-arm2/points.json` at SHA-256
  `b3fb4616d6413520f6505bfb6e1e068544622fee76bbca743f2aa01a7549a520` and
  `evidence/phase6-sweep-arm3/points.json` at SHA-256
  `08ec59ee47965abab414d339f1c39ce53e5b0dbf01aa6859185a087b243b9d73`.
  Their final aspect-ratio contrast changes sign between the warm and cold regions and reaches
  1.352222 at -19 C / fraction 0.1. Those rows contain final states, not the trajectory needed to
  locate when the contrast appears.

## Fixed machinery

Every row uses the float64 CPU `LKSolver`, `aggregate-hv-g1h1-v6`, monopole-matched far field,
101325 Pa, noise off, RNG seed 1, `hexPrism`, explicit `domainCenter`, `relaxTol = 1e-9`,
`divTol = 1e-7`, and `relaxMaxSweeps = 200000`. No solver equation, attachment parameterization,
or stopping-rule implementation changes in this campaign.

The runner will call `relaxField()` and `advanceSurface()` directly, preserving their public
cycle contract while observing the converged pre-advance boundary state. It will not add a new
surface operator or a generalized experiment framework.

## Run roster

### Lane A - continuity and domain anchor (three rows maximum)

The anchor is the candidate plan's C1/C2 configuration: -6 C, fraction 0.15,
`sigmaInfinity = 0.00906`, M1, `dxUm = 0.7`, seed radius 8 / thickness 17, target extent 27,
`cflFill = 0.1`, and step cap 100000.

| Row | Domain | Execution and interpretation |
|---|---:|---|
| A80 | 80 cubed | Fresh replay and cost anchor. Historical comparison is exact only because the current Node is v24.13.1; a source-identity mismatch makes continuity ineligible but does not invalidate the new exploratory row. |
| A96 | 96 cubed | Run concurrently as part of Lane B. Compare with A80 only if both rows are admissible. |
| A112 | 112 cubed | Launch only if A80 to A96 has the same habit class and attached-count difference at most 0.5%. |

An admissible comparison requires `size-target`, convergence at every cycle, no domain contact,
the residual/divergence and smoother-drift checks, valid fill-CFL/ledger diagnostics, and exact D6h
closure of every recorded attachment batch. A failed admissibility check is reported by cause; it
is not converted into evidence for or against a plateau.

### Lane B - numerical interaction and local initialization sensitivity

Lane B shares A80 and A96, then adds exactly four rows at the same -6 C / fraction 0.15 M1
condition:

| Row | Domain | `cflFill` | Seed radius / thickness | Purpose |
|---|---:|---:|---:|---|
| B80-c05 | 80 cubed | 0.05 | 8 / 17 | domain by timestep cell |
| B96-c05 | 96 cubed | 0.05 | 8 / 17 | domain by timestep cell |
| B96-seed7 | 96 cubed | 0.1 | 7 / 15 | local smaller-seed perturbation |
| B96-seed9 | 96 cubed | 0.1 | 9 / 19 | local larger-seed perturbation |

Together A80, A96, B80-c05 and B96-c05 form one 2 by 2 domain/timestep diagnostic. The two seed
rows are a local sensitivity pair, not a convergence proof or uncertainty bound. Their fixed
target extent deliberately asks how initialization affects the same observed crystal size.

### Lane C - matched mechanism and forcing transitions (24 rows)

Lane C uses the Phase 6 geometry: 48 cubed, `dxUm = 0.35`, seed radius 2 / thickness 1, target
extent 21, `cflFill = 0.1`, and step cap 100000. Each condition runs both M1 and the matched
`M1_NO_DIP_ABLATION` parameter set.

| Temperature | Fractions | Exact `sigmaInfinity` values | Reason |
|---:|---|---|---|
| -5 C | 0.125, 0.15, 0.20 | 0.00625, 0.0075, 0.01 | warm dip neighborhood |
| -6 C | 0.125, 0.15, 0.20 | 0.00755, 0.00906, 0.01208 | numerical anchor and warm transition |
| -19 C | 0.10, 0.125, 0.20 | 0.02034, 0.025425, 0.04068 | largest existing final aspect-ratio contrast |
| -24 C | 0.10, 0.125, 0.20 | 0.0265, 0.033125, 0.053 | existing plate-to-column class inversion |

Fractions already present in Phase 6 are intentional trajectory replays; intermediate fractions
are new exploratory conditions. The exact values above are products of the same committed
integer-temperature water-supersaturation anchors and the named fractions, so no new temperature
interpolation rule is introduced.

## Telemetry and analysis

Each process writes to its own ignored `out/post-phase10-discovery/<campaign-id>/<row-id>/`
directory:

- immutable row spec plus Git head, Node/OS/CPU/RAM, exact command, start/end, wall time, peak RSS,
  stdout, stderr, and exit status;
- one JSONL record per interface cycle with sweeps, convergence diagnostics, physical time,
  attachment count and coordinates, extent, aspect ratio, D6h event closure, kinetic and hole-fill
  ledgers, and pre-advance boundary counts plus `sigma`/fill summaries by facet; and
- a final result containing the stop reason, aggregate extrema/totals, final morphology metrics,
  and integrity verdicts.

Analysis is deliberately small:

1. Lane A reports the two available successive domain deltas and whether A112 was eligible.
2. Lane B reports the four-cell domain/timestep contrasts and their interaction, plus the two
   signed seed perturbations. It does not fit an error law from two levels.
3. Lane C aligns matched arms by physical time, extent, and attachment count; locates the first
   sustained separation in aspect ratio, basal/prism boundary composition, and attachment-event
   orientation; and maps whether the sign or timing changes monotonically with forcing.

Any pattern found here is a candidate explanation to test next, not a physical causal claim.

## Execution and stop rules

- Use independent Node processes. Start Lane C and the nonconditional Lane A/B rows together at
  actual concurrency 12. This leaves headroom on the 16-physical-core / 32-logical-processor,
  64-GB host. Later batches may rise to 16 only if the recorded first-batch peak RSS stays below
  48 GB and the host remains responsive; no protocol value changes for throughput.
- A row stops on size target, domain contact, unconverged relaxation, solver exception, or step
  cap. A failed row is retained and classified; it is not silently retried with changed values.
- Do not launch A112 unless its stated condition is met. Do not automatically expand the matrix
  beyond these 31 unique rows. A follow-up needs a result-driven science rationale and maker
  approval, not another recovery version.
- Raw runs remain ignored staging. Only the compact analyzed dataset needed to support the report
  is promoted to tracked, manifest-pinned evidence after its semantics are checked.

## Implementation steps

1. Commit and push this plan before runner code.
2. Add one row worker, one finite roster/launcher, and focused tests for roster values, per-cycle
   telemetry, stop classification, and a tiny deterministic fixture.
3. Run focused tests, runner typecheck, Rule 7, and a two-row short smoke. Because the resulting
   telemetry is a scientific readout used by the analysis, run exact `npm test` once on the stable
   bytes, then commit/push the implementation checkpoint.
4. Launch the finite campaign, recording actual concurrency and process files.
5. Analyze completed bytes, promote only compact claim-bearing artifacts, update this plan and
   `docs/PROGRESS.md`, then run the verification tier required by the final changed surfaces.

## Done when

- every nonconditional row has a terminal result and A112 is either terminal or recorded
  ineligible under its frozen condition;
- the three analyses above are reproducible from the retained row artifacts;
- the report clearly separates numerical findings, implementation-level M1/no-dip contrasts,
  unresolved results, and proposed next experiments; and
- `docs/PROGRESS.md` names the measured outcome and next scientific decision without implying a
  Phase 7 result, a reopened Phase 10 package, or quantitative validation.

## Deliberately not done

- no Phase 7, GPU, UI, held-out validation, new source search, or C0V/S6 recovery;
- no hostile-runtime, multi-user, or malicious-actor defenses for this solo local campaign;
- no new phase gate, ADR, solver-physics change, parameter fitting, automated fan-out, dashboard,
  generic scheduler, or protocol-version succession; and
- no exact-test/review loop after each small edit. Verification is proportional to the changed
  runner boundary and one stable final checkpoint.

## Tried and rejected

- Repeating the full 204-row Phase 6 sweep was rejected: it would reproduce known endpoints while
  still omitting the trajectory needed for the present question.
- A broad Cartesian parameter search was rejected: it spends compute without a sharper hypothesis
  and creates selection ambiguity.
- A full 2 by 2 by 3 domain/timestep/seed factorial was rejected for the first tranche: four shared
  domain/timestep rows plus two signed seed perturbations answer the immediate interaction and
  initialization questions at lower cost.
- Reusing the Phase 10 S6 executor/recovery machinery was rejected: its governance problem is
  unrelated to local scientific process concurrency and it is explicitly closed.

## Implementation record

The implementation adds only `runner/src/post-phase10-discovery.ts`, its small CLI launcher, and
one focused test file. It changes no solver or core byte. The worker uses existing public
`boundaryCells()`, `boundaryState()`, `facetClassOf()`, `relaxField()`, and `advanceSurface()`
interfaces. The launcher hard-codes the registered roster, uses independent Node processes, and
writes separate stdout, stderr, exit, status, event, and result files per row.

Pre-checks on the stable runner bytes:

- `npx vitest run runner/test/post-phase10-discovery.test.ts`: 1 file / 4 tests passed;
- `npx tsc --noEmit`: passed;
- `npm run lint:rule7`: clean across 1,514 files; and
- two-process smoke `out/post-phase10-discovery/smoke-5d9204b-v2`: both M1 and no-dip workers
  exited 0, each completed one converged cycle, and each wrote the complete registered file set.

Exact `npm test` then ran once, as required for the scientific-readout boundary. Rule 7 and both
TypeScript checks passed; Vitest completed 166 files with 158 passed / 8 failed and 2,500 tests
passed / 14 failed / 72 skipped in 1,100.81 seconds. The new discovery file passed 4/4 inside that
run. Every failure is in completed Phase 10 code and has one of two inherited prerequisites:

- eight tests reopen ignored `out/phase10-execution-v2` recovery bytes that do not exist in this
  fresh worktree; the completed Phase 10 worktree retains 70 such files totaling 1,703,099 bytes;
  or
- the Phase 10 scope/B/final-package fixtures mix commit-blob LF identities with the published
  Windows working-tree CRLF identities. For example the current science worktree's
  `phase10-b-schema-contracts-v1.json` is the published 1,557-byte SHA-256
  `22f387843aa8c0dea866de6fcdc26b4d8acc8bec1a343564311e81b4d2aef813`, while the completed
  Phase 10 worktree's LF checkout is the failing 1,523-byte
  `ca34bd9bae3d9a33e84ffa722899dd02395544ef2129389628dae2985d85f59a` identity.

The suite is therefore recorded as **not green for inherited Phase 10 fixture reasons**, not
represented as a pass. No failed test imports the new runner or reports a new solver/readout
disagreement. Repairing historical Phase 10 tests or copying its ignored recovery lineage into
this campaign would be unrelated maintenance and is deliberately not made a launch prerequisite.

The first real CLI smoke at `out/post-phase10-discovery/smoke-5d9204b` exited 1 for both workers:
the launcher passed its two smoke-only ids through the campaign-only row lookup. No solver cycle or
science ran. The lookup now checks the two fixed smoke rows before the campaign roster; the v2
smoke above verifies the repaired subprocess path. This was an implementation defect, not a new
protocol version or campaign attempt.
