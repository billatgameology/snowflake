# Working rules — The Virtual Cloud Chamber

Different LLMs work on this project across sessions without shared memory. The durable memory is
[PROGRESS](docs/PROGRESS.md), the affected active plans and the lesson records. Logs, checkpoints
and other artifacts support live state only when those records point to them.

**`CLAUDE.md` is a symlink to this file. Keep `AGENTS.md` canonical; never replace the symlink with
a second instruction file.** The handoff mechanism is retired: `docs/HANDOFF.md` is a tombstone for
historical links, never a live snapshot. Use isolated task worktrees under Rule 16.

## Cold-start read order and authority

Read in this order on every cold start:

0. Read [phase6-lessons.md](docs/phase6-lessons.md) completely. Its incidents explain why the short
   warnings below exist; compaction does not make the lessons optional.
1. Read [PROGRESS.md](docs/PROGRESS.md) completely, including **Next step**. Its linked archives are
   historical records; open them only when a current record points there or provenance is needed.
2. Read every affected active plan, including **Tried and rejected**. Killed protocols and measured
   failure modes must not be rediscovered or restored.
3. Inspect `git status` and the relevant diff. Preserve unrelated dirty changes; they may be
   deliberate work belonging to another task.
4. Read the applicable charter clauses, accepted ADRs and technical contracts before changing
   behavior. Inspect implementation and evidence only after that contract is clear.

| Source | Authority |
|---|---|
| [project charter.md](project%20charter.md) | Governing product, science, phases and gates; the current charter wins. |
| Accepted ADRs in `docs/decisions/` | Decisions, rationale and explicit amendments. Read status and supersession notes; quoted prior charter clauses are history. |
| Solver specs | Delegated technical ground truth for algorithms. |
| Affected active plan | Current approach, registered protocols, evidence and rejected attempts. |
| `docs/PROGRESS.md` | Live state, completed work and next action. |
| Code, tests, logs, checkpoints | Implementation and evidence; they do not silently overrule the written contract. |

If sources disagree, state the disagreement and fix it at the proper authority level. Code existing,
a proposed ADR, a green self-test or an old launch record does not establish current authorization.

### Read before the affected action

| Action | Required additional reading |
|---|---|
| Numerical or solver work | [G-G machinery](docs/gg-machinery.md), relevant [attachment-kinetics](docs/attachment-kinetics.md) components, [parameter provenance](docs/libbrecht-parameters.md) and affected accepted ADRs. |
| Timeline or checkpoint work | [ADR 0011](docs/decisions/0011-phase4-timeline-environment-semantics.md), solver-spec state/codec contract and the affected plan. [ADR 0039](docs/decisions/0039-cycle-boundary-lk-resume-checkpoints.md) remains proposed; implemented core resume code does not authorize its production protocol. |
| Gate, comparison, scientific claim or campaign | Current charter gate, frozen protocol, active plan and relevant lessons; identify required outputs, executable checks and their actual producers/callers. |
| Retained assets, NAS publication, serving or cleanup | Rule 15, [local-assets.md](docs/local-assets.md), [ADR 0051](docs/decisions/0051-govern-durable-untracked-assets-on-nas.md) and the affected collection plan. |

## Repository and permanent controls

Strict-TypeScript ESM npm workspace. Use the development runtime in `.nvmrc`; `package.json`
records the minimum supported Node version. Current host, mount and readiness facts belong in
`PROGRESS.md` and its readiness record, not in a second machine inventory here.

| Path | Boundary |
|---|---|
| `core/` | Environment-neutral lattice/state, parameters, seeded counter-based PRNG, metrics and strict codecs. |
| `solver-cpu/` | Permanent float64 oracle: `GGSolver`, `LKSolver`, shared `SurfaceOperator`; no Node APIs or file I/O. |
| `runner/` | Node-only CLI, evidence I/O, stopping rules, metrics and enforced gates. |
| `spike/` | Frozen Phase 1 Reiter prototype, outside the workspace; never evolve it into the product. |
| `research/` | Tracked source records and ignored local input staging; private source bytes follow Rule 15. |
| `evidence/` | Tracked, digest-pinned claim artifacts and gut-check recipes/run records. Every artifact except the two root control manifests must be tracked and pinned in `evidence/MANIFEST.json`. |
| `app/` | Development instrument and product presentation; solver work stays off the UI thread. |
| `solver-gpu/` | WebGPU implementation under its own phase/comparison gates; preserve accepted Phase 5 protocols. |

Dependency direction is `core` → `solver-cpu` → `runner`; keep the oracle usable in a Web Worker.
**Never delete the CPU oracle or `GGThreshold`: it is the permanent floor and differential control.**
App/GPU work follows its chartered scope and explicit exceptions, not assumed phase completion.

The product must expose vapor and surface propensity so users can understand growth. Physical
inputs make the model falsifiable, not validated. Only an executed, pre-registered chartered
validation gate can earn that label over its named domain. Read current phase ownership and holds
in `PROGRESS.md`; source reconciliation and development experiments do not inherit validation credit.

## Numerical and timeline warnings — do not regress

These are reminders of recurrent failures, not a second specification. Read the required contracts
above before editing. Ordinary policies/checkpoints stay frozen; separately accepted experimental
opt-ins have their own identity, limits and active plan and do not silently amend the ordinary path.

- **Keep the operators separate.** LK replaces surface exchange as a coupled whole; do not layer
  G-G freezing/melting onto it. LK fill `f` is not G-G boundary mass `b`; hole fill is separately
  deficit-ledgered. G-G ticks have no physical-time interpretation.
- **Convergence needs both checks.** Fixed-σ Dirichlet physics requires residual and discrete
  divergence identity tolerances; read the registered maintained-shell policy for monopole runs.
  Reflecting LK is residual-only, diagnostic-only and cannot support a physical gate claim.
- **Drift is directly metered, bounded roundoff.** For v5/v6, meter reflecting-smoother drift before
  boundary replacement/clamp, never infer it from other terms or call it vapor. Require the
  independent absolute bound, including zero/subnormal cases; finite cancellation is not enough.
  Use `metersSmootherDrift(policy)`; legacy-v3/v4 retain their executed identity. See
  [0013](docs/decisions/0013-float64-smoother-drift-divergence-identity.md) and
  [0014](docs/decisions/0014-bound-float64-smoother-drift.md) for the formula and derivation.
- **D6h must survive evaluated arithmetic.** Reductions over a permuted neighborhood depend on
  the operand multiset, not gather order; evolution geometry uses exact integer invariants, not
  rounded Cartesian distances. Diagnostics wired into decisions inherit this requirement. Test at
  the largest admissible step, where earlier failures amplified. See
  [0023](docs/decisions/0023-d6h-equivariant-opposing-vapor-mean.md) and
  [0024](docs/decisions/0024-monopole-matched-far-field.md); existing LK/monopole suites cover both causes.
- **Do not repair historical policies in place.** v4/v5 gather-order surface reductions are not
  D6h-equivariant; a zero symmetry report alone does not prove otherwise. v6 sorts the operands.
  Preserve v3/v4/v5 bytes, the runner's v5 default and the GPU's v5-only refusal; do not relax that
  refusal without porting the shader and meeting its gate.
- **Use one coupled boundary/fill law.** Every forward run names `surfacePolicy`; for aggregate
  v4/v5/v6, `[01]` is basal, `[20]` prism, `[10]` inhibited. Never restore legacy classification,
  cell-value/inward-ghost growth sampling or per-contact fill to the aggregate path. Use the same
  solved `sigma_b` and `alphaHK` for the boundary condition and once-per-boundary-pixel kinetic
  demand; noise multiplies the coefficient identically on both sides. Detailed geometry/P4 closure
  belongs in [spec §4.4](docs/attachment-kinetics.md#44-the-surface-operator-specification-decision-0005-d2--phase-2b-opening-deliverable).
- **Keep ledger meanings honest.** Placed fill plus recorded unapplied saturation excess equals
  computed geometry-adjusted kinetic demand. Excess is not deposited ice or physical uptake;
  signed relaxation exchange and shell-clamp totals are numerical diagnostics. Fill-CFL bounds the
  per-cell kinetic increment; hole-fill events are outside it and reported separately. Never hide
  loss with clipping or replace this contract with vapor-loss/ice-gain equality.
- **Ordinary final snapshots stay strict.** LK checkpoints carry far field, convergence controls
  and recognized coupled policy; every codec/construction/round-trip boundary rejects invalid,
  missing, mismatched or shifted state. V1 means implicit `legacy-v3`; ordinary new final snapshots
  are v2. A distinct resume codec does not imply an authorized runner or timeline-resume protocol.
- **Relaxation is not physical time.** Only interface updates advance LK time; many elliptic sweeps
  do not by themselves demonstrate a units bug.
- **Timeline conservation is operator-specific.** The capped-column history is column→plate.
  G-G events replace parameters atomically without changing `a`, `b`, `d`. LK temperature events
  conserve active unattached cells' absolute vapor density, excluding attached cells/walls; never
  clamp negative transformed supersaturation. Transform the active shell before its next explicit
  reservoir clamp and report that exchange only as a numerical diagnostic.
- **Use each step's temperature.** Update derived kinetics/conversions atomically and accumulate
  ledger conversions per step; never apply the final temperature to the whole history. Phase 4
  supports deterministic abrupt events; old checkpoint meanings stay frozen and final snapshots
  carry external schedule/event manifests. Mid-history resume needs a new version and decision.

Changing these numerical/ledger contracts requires the proper ADR and a committed protocol before
results are generated; it is not a cleanup refactor. Existing protection includes
`solver-cpu/test/lk-solver.test.ts`, `monopole-far-field.test.ts`, `timeline-environment.test.ts`
and the core checkpoint/timeline suites. Tests protect named cases, not every future use of a rule.

## Execution and common traps

- Measure this host's process/memory budget before a scientific campaign; old-host worker counts
  do not transfer. Prefer NVMe. Run scientifically independent cases in parallel Node processes
  when the registered protocol and memory allow; do not change the protocol to gain concurrency
  or route work to GPU before its charter/comparison gate authorizes it.
- Before a nontrivial scientific campaign, prove a representative real pause/resume that preserves
  the same row's scientific state. Record checkpoint cadence and exact resume command; repeat only
  if that contract changes. Without resume, split into short independently terminal stages.
  Observation logs are not restart state; never launch another multi-day non-resumable campaign.
- Record actual concurrency and exact launch command/flags, not intended values. For parallel
  background runs, keep labeled live logs and separate error/exit files; report their paths unless
  narration is requested. Rule 6 governs check selection and trustworthy verification receipts.
- `grow` is observational unless its enforcement flag is present; `grow-lk` is exploratory.
  Flagless `gate2b` encodes its registered protocol and is hours-scale evidence, not a smoke test.
  Read state and check for an existing process before launching, killing or replacing a gate.
- The canonical radius-2, thickness-1 seed has **19 sites**; the paper's “20” is an erratum.
  Exact D6h gates require `hexPrism`; box walls are not symmetric. The runner defaults to
  `hexPrism`, but `GGSolver` defaults to `box`: tests must choose intentionally.
- A uniform field at the Dirichlet set value is a fixed point under both boundaries; it proves no
  boundary distinction. Use the depleted-start differential in `solver-cpu/test/dirichlet.test.ts`.
- A 65% contact guard detects collision, not domain independence; contact-stopped states are invalid
  gate evidence. Compare only named compatible far fields. Bitwise claims are limited to the pinned
  float64 Node/V8 oracle; cross-engine, float32 and GPU comparisons use stated tolerances.
- Use the counter-based seeded PRNG and named streams. Never introduce `Math.random()`.
- On macOS, the required full local check is `TMPDIR=/private/tmp npm test`: `/var` aliases trip
  the Phase 5 publication-path guard. Set `TMPDIR`; never relax the correct guard.
- Resolve NAS mounts through `scripts/nas-root.ts` and share-relative `/nas/<path>` URLs.
  Serving requires exact catalogue-approved public generated prefixes; containment alone is not
  permission. Mount facts and executed host checks live in the readiness/NAS records.
- After a direct edit under `evidence/gutcheck-gg-realism/`, run `npm run evidence:pin`.
  Its batch/spec/archive writers re-pin automatically; that command covers **only that subtree**.
  New artifacts elsewhere need their own `MANIFEST.json` entry. Integrity tests enforce presence,
  modes, bytes and digests, not whether every published claim has supplied its evidence.
- `docs/gg-model.md` is a tombstone; use the current machinery and kinetics specs.

## Rule 1 — Start every session by reading the state

Follow the cold-start order above, including the complete lessons document. Do not infer current
intent or completion from available code/artifacts; use current state and the affected active plans.

## Rule 2 — Plan in a file before you build

Beyond a trivial fix, write and commit the plan before implementation: goal, approach, steps,
done-when and exclusions. Copy a charter milestone's done-when verbatim; never soften it silently.
Use [the plan template](docs/plans/_TEMPLATE.md). Chat approval does not replace the file.

A bounded single-source intake, direct maker-requested analysis or focused docs/rules correction
with obvious scope is not a build and needs no new plan merely to restate the request.

**Keep lessons actionable.** In the existing plan or work note, name the relevant known failure,
the rule/lesson to reread before the risky action and the existing check that addresses it. Where
judgment remains necessary, say so; a link or green test is not proof the general mistake is impossible.
Use existing records and checks, not a new lesson registry or compliance document.

## Rule 3 — Update PROGRESS.md as you go, not at the end

Record meaningful completed steps and unfinished work while working: what changed, what it proves
and what is next, with artifact-backed numbers under Rule 6. Keep the index compact; chronology,
commands and rejected attempts belong in the affected plan. At closure, apply Rule 8.

## Rule 4 — Record what failed, not just what worked

Every plan ends with **Tried and rejected**. Record the attempted approach, measured failure and why
it was abandoned. Read that section before proposing an approach that may repeat it.

## Rule 5 — Decisions that contradict or extend the charter get an ADR

Write a numbered ADR and update the charter in the same session; use
[the decision template](docs/decisions/_TEMPLATE.md). Quote verbatim every charter clause touched,
including the clauses supporting a “charter impact: none” claim, and audit the complete diff.
Keep decisions out of chat-only memory. Accepted records and frozen historical bytes are not edited
merely to remove repetition; record genuine changes at the proper authority level.

## Rule 6 — Claims are cheap; evidence is the deliverable

- Scientific milestones are automated metrics, not screenshots. A completed gate record names
  metric/value, seed, dimensions/domain, engine, exact command, termination and validated checkpoint.
  Derive every gate precondition from its contract, make violations fail the process by name and
  pin bypasses with executed negative controls.
- Evidence/provenance labels apply to prose as well as UI. Do not write an unearned physical claim;
  if a finding was eyeballed, say so. Re-read the stated limitations before writing the conclusion.
- Copy every number in progress/plans from its named artifact **at write time**, with path or hash.
  Correct affected quotes when a bundle is superseded. Census/range/extremum claims require the
  complete named set, units, denominator and witness; reconcile recomputation with published fields.
- “Cannot”, “every”, “always”, “independent of” and “provably” require a scoped derivation about the
  quantity actually governed. A measurement supports its measured scope, not a stronger theorem.
- Tests must be non-vacuous and independently recompute load-bearing quantities. A uniform fixed
  point proves no transport path; a report agreeing with itself proves no ledger.

**Choose verification by the changed surface before running it:**

Checks explicitly required by the charter or an accepted ADR remain mandatory over their named
scope, including when the ordinary tier below would otherwise use a cheaper check.

| Changed surface | Required verification |
|---|---|
| Numerical/scientific behavior in `core/`, `solver-cpu/`, `solver-gpu/`; executable scientific calculation, readout or claim logic; phase gates; evidence generation, verification, integrity/publication; root-wide test/build configuration; or a mixture with product code | Exact `npm test` (Rule 7, both typechecks, all Vitest suites). Focused Vitest is not a substitute. A green suite is not a scientific gate result. |
| Isolated presentation website, gallery/selection UI, animation queue, camera/render recipe or batch orchestration without the surfaces above | Focused Vitest for the changed boundary, `npm run typecheck`, app build for bundled app changes, and applicable browser smoke/dry run/sample render. Stop when these pass; no full suite, solver suites or scientific gates for extra comfort. |
| Education/media presentation, layout, navigation, styling, playback, animation or video production without the scientific surfaces above | Relevant content/interactive checks, applicable build/render and browser/visual checks; typecheck only when affected code needs it. No full repository suite, unrelated solver tests or scientific gates. |
| Pure prose, source-index or governance edit | Cheapest check for its failure surface; Rule 7 for repository prose, plus applicable diff/link/contract checks. Never describe this as “suite green.” |

Scientific prose alone does not trigger solver suites or gates: check changed factual claims against
cited sources or named project artifacts and apply proportionate Rule 13 interpretation review.
Choose the smallest existing education/media check that covers the change. The complete
`education:verify` command includes scientific-model and negative-control execution; it is not the
default for layout, styling or playback edits with unchanged scientific logic.

An isolated-product plan must not make exact `npm test` its default done criterion; amend an inherited
plan accordingly. Historical completed checks remain a report of what ran, not a future requirement.
Before a check expected to exceed five minutes, tell the maker which required failure surface it
covers and that it is starting. Do not launch it if an allowed cheaper check covers that surface.
Use unique logs for each run, verify no stale process contaminates them, and record the exact command
and real completion/exit. Only exact `npm test` supports a full-suite-green claim.

## Rule 7 — A bare `alpha` is banned from this repository

The ban targets identifiers and unqualified prose everywhere, including `spike/`, `scripts/`,
documentation inline code and commit messages. Greek symbols in prose need provenance in the same
sentence or heading; deliberate policy mentions and lint fixtures are waived where they occur.

The Hertz–Knudsen attachment coefficient and G-G boundary-mass threshold are unrelated quantities.
Every occurrence carries its provenance:

| Write this | Never this | Meaning |
|---|---|---|
| `alphaHK`, `alphaHKBasal`, `alphaHKPrism` | `alpha`, `α` | Hertz–Knudsen attachment coefficient, dimensionless [0, 1] |
| `ggThreshAlpha`, `ggThreshBeta`, `ggThreshTheta` | `alpha`, `beta` | G-G boundary-mass thresholds |

The lint scanner enforces identifier cases; reviewers enforce qualified prose. Preserve both.

## Rule 8 — Leave the next model a landing spot

At session end, make **Next step** true and actionable on cold start: next concrete action, file,
command and known trap. Use current state, not a session diary or a revived handoff snapshot.

## Rule 9 — A verdict is computed from the artifact, never inherited from its producer

Gates/evaluators/reports rederive pass/fail from published bytes. No component supplies both sides
of its own comparison. Each negative control executes its named mutation, checked independently
of its author. Silently dropping an unrecognized diagnostic/status field is fail-open evidence.

## Rule 10 — Reviews carry provenance and state their limits

Record reviewer model and shared-context status, what was independently re-executed and what was
not checked. Limits are part of the evidence. Gate-bearing reviews prefer a model different from
the author; ordinary reviews remain proportionate under Rules 13–14.

## Rule 11 — Probes transfer only from the registered configuration

Calibration, convergence and cost measurements support only the exact configuration they govern.
Otherwise mark them **non-transferable** at record creation. Read governing freeze rows before
varying a quantity; a constant extent/domain ratio is not a substitute for measured adequacy.

## Rule 12 — Check source currency before any freeze

Before freezing parameters/protocols, verify cited versions and the authors' later output for
superseding sources; record the check with the freeze. Do not split a freeze from its provenance.

## Rule 13 — Interpretation is gated like evidence

Before publishing/merging/propagating an interpretation (reports, ADR claims, education or memory
records), audit it at the claim's decision risk
(Rule 14). Theorem-strength claims, gate verdicts and public scientific conclusions require the
chartered/accepted adversarial review; routine triage/internal judgments need the author's
proportionate skeptical pass, not independent review merely because they are committed.
Propagate accepted corrections to the documents readers meet; an isolated raw audit is not closure.
Matched code interventions identify effects in that implementation, not physical causality in nature.

## Rule 14 — Fix stupid process

Stop extending demonstrably redundant, disproportionate or self-defeating process. Preserve controls
required by the charter/accepted ADR over their named scope until amended at that authority; simplify
plan/implementation ceremony directly and record what was superseded. Prior effort is not evidence
of value. Follow [ADR 0049](docs/decisions/0049-make-assurance-proportionate-to-decision-risk.md):

| Decision risk | Assurance depth |
|---|---|
| Routine source intake | Identity/version, original/hash where applicable, exact locators, values with units/conditions/uncertainty and measured/transcribed/derived distinction; then stop. No default independent audit. |
| Load-bearing quantitative input | The above plus one independent targeted transcription, calculation or semantic check. |
| Phase gate or strong public scientific claim | Named pre-registration, independent derivation, negative controls and adversarial review under the charter/accepted ADR. |

No review-of-review or validator whose main purpose is validating another validator. Stop when
another pass is unlikely to change inclusion, classification, values, next experiment or claim;
state residual uncertainty. Use Rule 14A to admit controls and Rule 14B to keep work advancing.

### Rule 14A — Admit the threat before building the defense

Before adding/expanding a check, gate, review, launcher, transport, registry or verifier, answer in
the **existing** plan/note: plausible failure; accidental/in-scope versus deliberate hostile control;
scientific decision or claim-bearing bytes affected; why existing checks at the nearest boundary
miss it; and why it costs less than the likely harm. Missing answers mean do not build it.

Under [ADR 0042](docs/decisions/0042-bound-phase6-evidence-integrity-scope.md), deliberate hostile
control of the maker's machine/repository is outside the research-integrity threat model: trace
erasure inside a trusted runtime; substitution of repository/runtime/executable/worker/verifier
bytes; reference/index/attribute/path laundering; process/PID impersonation after authenticated
launch; intentional violation by an authenticated peer; or owner mutation during a check.
Do not relabel these as environment drift or make them blockers, required negative controls or
freeze prerequisites. Note limits without dispatching preserved attacker-only findings.
Expansion requires explicit maker direction and governing amendment. Credential, destructive-action
and external-system safety requirements remain independently in force.

### Rule 14B — Deliver the vertical slice before expanding process

Name one end-to-end deliverable and its shortest meaningful check in the existing plan/progress or
commentary. Build shared infrastructure only when its absence blocks that deliverable; implement
the smallest seam and return to it. Do not create another dashboard/schema/ledger to manage this.

Use focused checks while implementation moves; one implementation lane and at most one bounded
review engagement after interfaces/checks stabilize. Run identity cascades/full checks at a named
stable checkpoint under Rule 6. Two blocker-bearing verdicts require maker escalation, not a third
rebuild; a blocker must be capable of changing a scientific claim/number or silently corrupting
evidence. Other hardening suggestions are non-blocking.

If process consumes roughly one quarter of a work block without a direct source/measurement/
calculation/code/experiment/requested decision, a second meta-validation layer appears, or the
deliverable stays unusable while machinery grows, stop and tell the maker what remains undelivered.
Simplify to a smaller slice; do not add a metric, document or audit to manage process excess.
At intentional pause/compaction and immediately after resume, restate: solo scientific research;
hostile actors excluded unless maker-directed; one named scientific/product deliverable next.
Re-read Rules 14A–14B before adding assurance machinery.

## Rule 15 — Ignored is neither preserved nor disposable

**A hash detects change; it does not preserve bytes. An ignore rule, path, raw copy or NAS presence
grants neither preservation nor deletion authority.** Tracked research records remain Git authority;
ignored research payloads and `out/` are local staging. Before useful bytes outlive a task or a local
source is pruned, promote fitting project-owned claim evidence to tracked `evidence/` under
[ADR 0038](docs/decisions/0038-evidence-tree-is-tracked.md), or classify/publish under
[ADR 0051](docs/decisions/0051-govern-durable-untracked-assets-on-nas.md). Explicitly declared scratch
may be discarded. ADR 0038's historical `out/` deletion wording is superseded by this governance.

Before preserving, moving, serving or pruning a useful untracked collection, read and execute
[local-assets.md's standard procedure](docs/local-assets.md#standard-procedure-for-a-new-retained-collection)
and ADR 0051's applicable lifecycle. Use one class/rights/privacy/serving/retention policy per
collection; choose a provisional stable ID/immutable version before durable placement. Durable
payloads use `collections/<asset-id>/<version>/payload/`; `_control/` is non-served operational
custody, not durable ownership. Apart from the share marker these are the only project-owned roots.
Never recreate top-level NAS `out/` or `research-cache/`; translate historical locators via catalogue.

Publication requires one bound owner manifest, stable regular-file inventory, copy-first staging,
absent immutable final placement, final byte verification, publication receipt, committed catalogue/
provenance/recipe bindings, executable restore and successful fresh-stage verification. No merging
existing targets, silent source deletion or missing-receipt bypass. Historical/legacy registration
and restore may be read/restore-only; they do not certify transaction, backup or prune eligibility.
A detached/unmarked/conflicting share fails closed, never silently substitutes a local worktree.

Private filenames/media stay in their permitted non-served records; Git exposes only permissible
identity/binding. Credentials are not assets and never enter Git, collections, manifests, receipts,
archives or `/nas`; use the credential manager/runtime environment. Only catalogue-approved public
generated prefixes may be served. Containment is not serving authorization.

Local pruning is a **separate reviewed exact-target decision** after committed bindings, verified
restore and every class-specific backup condition. Same-NAS loose copies, archives, snapshots and
recycle entries are one failure domain. External evidence, unique private sources and irreplaceable
masters need their independent recovery domain before the last workstation copy is pruned.
Retain/quarantine unresolved material; no broad `git clean`, directory glob or recursive sweep may
substitute for classification/disposition. There is no generic forward `assets:publish`/`assets:prune`
command yet: use the affected bounded plan's exact lifecycle commands; convenience is not a waiver.

## Rule 16 — One task, one branch and one worktree; reconcile before PR

Default to one implementation branch/worktree per task. Before creating either, inspect
`git worktree list --porcelain` and `git branch -vv`; reuse an existing task checkout. Subagents
share it and create no extra branches/backup refs/worktrees unless assigned a necessary isolation.
At most one temporary detached review worktree may accompany it; record path, exact commit/tree,
purpose, owner/removal condition in the existing plan and remove it when review ends.
No `backup`/`finalize`/`close` chains instead of coherent commits. Emergency recovery refs name their
protected work and must be reconciled/deleted before publication.

Before pushing/opening a PR:

1. List every registered worktree/local branch and inspect staged, unstaged, untracked and ignored
   task-relevant state in each.
2. Classify deltas as included, independently owned or verified superseded; preserve other workstreams.
3. Remove temporary worktrees and redundant refs only after unique changes are committed, moved to
   their owning checkout or explicitly approved for deletion.
4. Verify the surviving primary, named unrelated worktrees and exactly one PR branch; record branch,
   head, checks and PR URL in the plan/progress and PR description.

`git worktree remove --force` and `git branch -D` are destructive tools, not ordinary workflow.
They require resolved exact paths/refs and the disposition audit; dirty never means disposable.

## Anti-rules

- Link the charter from progress; do not create a second specification or a per-session diary.
- Do not create documents these rules do not call for; use existing plans and lesson records.
- Reuse existing verifier seams. A new seam needs an admitted in-scope failure, not proof machinery
  for its own sake. Keep the short learned warnings here and the complete incident history linked.
