# 0060 — Resumable discovery experiments

- **Date:** 2026-10-07
- **Status:** accepted under the maker's explicit direction that exploration must be resumable and must not lose findings to an arbitrary wall-clock limit; campaign use still requires the checks below.
- **Charter impact:** append narrow discovery-resume permission to section 2.5 and the Phase 4 history boundary in section 3.2. Existing numerical laws, checkpoint meanings, historical evidence and phase gates remain unchanged.

## Context

The first HIL/BLD batch was implemented with a four-hour terminal budget because the discovery
runner could not save its complete scientific state. Its raw events and spatial observations
are useful evidence but omit evolution-bearing field state. A capped case cannot be continued
from those observations. The maker rejects that tradeoff and requires actual checkpoint
continuation before the rerun.

The implemented v3 core codec from proposed decision 0039 preserves ordinary constant-
environment state, but its solver interface excludes the present no-dip, experimental and
history cases. Accepting that entire proposal would also import a deferred Phase 6 production
protocol unrelated to this development batch. This decision supplies only the missing
checkpoint/runner seam for the registered discovery workload.

## Decision

### Scope and compatibility

Add the separate format identity `discovery-resume-v1` and explicitly named export/restore
APIs. It supports completed-cycle float64 CPU state under aggregate-v6, monopole-matched far
field and hexPrism domain, with these finite alternatives:

- ordinary M1 or `M1_NO_DIP_ABLATION`, with no event or the registered single abrupt
  environment event;
- M1 base metadata and exactly one of the four decision-0055 facet arms, constant environment;
- the decision-0058 basal-width experiment with full history or the decision-0059 early-only/
  late-only cutoff, constant environment.

The late-only member preserves the same already accepted family; it adds no first-batch row.
Neither geometric-hole-filling opt-in nor its combined prism experiment is supported. No
experimental kinetics option may combine with environment events. Existing option validation,
coefficient preparation, coupled Robin/fill evaluation, convergence, D6h arithmetic, timestep,
hole filling, ledger and timeline transformation remain unchanged.

GG v1, LK final v1/v2 and the existing ordinary v3 readers, writers, bytes and eligibility
remain frozen. Their APIs do not acquire this format by inference or by widening a shared enum.
The new decoder rejects those other formats, and old decoders reject the new identity. This
permission supersedes the experiment export exclusions in decisions 0055, 0058 and 0059 only
through the explicitly separate discovery format. Their ordinary checkpoint and timeline
refusals remain. Decision 0039 stays proposed and grants no Phase 6 production authority.

### Complete continuation state

Preserve the exact scientific controls, row and experimental identity; occupancy, fill and
supersaturation bits; historical boundary order; last-attachment order; tick; physical time;
monopole volume-rate lag; maximum fill velocity; placed-fill, saturation-excess and geometric-
hole ledgers; hole count; and last relaxation report. Test-hook histories remain ineligible.
Derived topology and geometry-only width caches may be rebuilt, but not historical ordering
or cumulative values. Reevaluate width cutoff eligibility before the next relaxation without
resetting state or changing the coupled-update cutoff convention.

Ordinary event histories additionally preserve accepted-event count, closed prior-temperature
vapor-unit total, current temperature-segment fill origin, current environment, immutable
schedule, complete cursor and fired-event/transition records. Preserve the cursor's last
observed boundary even when no event fired. Immediately after a valid environment event,
positive tick with no last relaxation report and zero last velocity/monopole lag is reachable;
the new format admits that state under its history invariants. It retains transformed shell
values and negative supersaturation until the next ordinary solve. It never substitutes the
final temperature into earlier ledger contributions.

Checkpoint only at initialization or a complete interface-cycle boundary after its observation
record and any eligible environment event. No in-relaxation checkpoint is added. Recovery from
an interruption during relaxation repeats that unfinished cycle from the last committed state.
No accepted Robin/fill cache from the interrupted cycle is reused.

Runner continuation preserves cumulative scientific metrics and flags, completed event count,
spatial-sample inventory and pending crossings, timeline state, row/spec identity and the exact
committed event prefix. Source, Node/V8 runtime and host identity are bound; this initial route
resumes on the same host with the same producer/runtime. Operational elapsed time, RSS, process
attempts and interruption provenance remain honest and need not match an uninterrupted run.
A matching final shape alone is insufficient evidence of continuation.

### Publication, stopping and retention

Publish one checkpoint generation binding solver state, runner state and committed event-prefix
length/digest only after its payloads are complete and verified. Preserve the preceding complete
generation across a partial publication. Resume verifies the selected generation and all its
bindings before modifying the working output. Missing, corrupt or mismatched committed state
fails visibly; it is not repaired by defaulted fields or silently rolled back.

Observations beyond the committed prefix, including a partial final record or a snapshot from
an unfinished cycle, cannot be reused as completed evidence. The existing plan specifies their
exact recovery disposition and keeps truthful attempt records so resumed cycles neither vanish
nor appear twice. It also registers checkpoint cadence, the two-generation recovery retention,
exact pause/resume commands and representative interruption witness. Broader output preservation
continues under Rule 15; no NAS publication or unrelated pruning is authorized here.

Remove the first batch's four-hour scientific termination and corresponding production hard
kill. A pause, machine interruption or resource stop leaves the case unfinished and recoverable;
it is not an absent-effect finding. The finite registered scientific target, step limit,
convergence failure and domain-contact rules retain their stated meanings. No size/step extension
is silently authorized. Short resource qualification probes may retain their separate bounded
budgets because they are operational measurements, not deciding scientific cases.

Existing old-producer prefixes are retained as such. A stopped process that never wrote complete
resume state cannot be retroactively continued from observation logs. The rerun uses new output
paths and the tested producer; old scientific bytes are not overwritten or relabeled.

### Verification before the rerun

Use existing codec, solver and discovery tests, adding only the missing continuation boundaries.
Uninterrupted and multiply resumed comparisons cover complete fields/order/ledgers/reports and
subsequent evolution for all admitted kinetic families, and compare runner scientific events,
spatial observations, timeline positions, cumulative quantities and terminal scientific output.
Exercise splits on both sides of a width cutoff and immediately before/after an environment event
in both registered temperature directions. Keep the valid unattached boundary `f=1` witness,
old-format refusals and frozen bytes.

Execute a fresh-process interruption/resume differential, interrupted checkpoint publication,
trailing-event recovery, and concrete wrong-row, changed-control/schedule, source/runtime,
missing-state and corrupt-payload refusals. Run exact `npm test` at the stable scientific-code
checkpoint. Before dispatching the rerun, demonstrate a representative actual N64 checkpoint,
process interruption and continuation and retain its exact commands and outcome. The active
plan records one bounded non-author review and its execution limits under Rules 10 and 14.

These controls address accidental interruption, partial writes, wrong invocation and lost or
duplicated scientific state at the existing producer boundary. Ordinary observations cannot
cover those failures because they lack the field/order/ledger restart state. Reusing the codec
and row runner is smaller than repeatedly recomputing long trajectories. This remains solo
scientific research; hostile-owner controls, a distributed scheduler, the R15 generation/trace
framework and review-of-review are outside scope.

## Governing charter clauses retained verbatim

The existing clauses below remain unchanged. The charter receives only the two explicitly
identified additions beside section 2.5's experiment clauses and section 3.2's history clause.
Those additions implement this decision; no revision header or historical clause is rewritten.

Section 2.5, facet experiment:

> Post-Phase-10 development experiment (decision 0055, 2026-09-09): under the maker's autonomous bounded-science direction, a separately identified constant-environment CPU experiment may select both, neither, basal-only or prism-only M1 dip preparations. It retains the coupled aggregate-v6 Robin/fill operator and ordinary behavior, and cannot use existing checkpoint formats to imply ordinary kinetics. The active discovery plan registers its finite comparisons and controls. These interventions identify effects within the implemented discrete model, not width-dependent SDAK, physical necessity, grid convergence or quantitative validation. They do not reopen Phase 10 or involve the separate Phase 7 path.

Section 2.5, width experiment:

> Local basal-width experiment (decision 0058, 2026-09-11): a separately identified constant-environment aggregate-v6 CPU experiment may select the existing M1 or no-dip basal kinetics using an integer exposed-terrace chord threshold, while retaining no-dip prism kinetics and geometric completion. This is an explicitly P4 mesoscopic width rule, not a measured molecular law, full M2 implementation or physical validation. The attachment spec defines its symmetric geometry and coupled Robin/fill evaluation; the active discovery plan registers the finite comparisons, observables and reused controls before implementation. Ordinary operators, historical evidence, checkpoint meanings and the separate Phase 7 path remain unchanged.

Section 2.5, early/late experiment:

> Early/late basal-width counterfactual (decision 0059, 2026-09-12): a separately identified constant-environment CPU experiment may enable that width rule before or after a registered physical-time cutoff, using broad basal kinetics outside its window. Switch only between complete coupled updates, re-relax before fill, and preserve accumulated state. The active plan registers matched controls, actual transition-time observations and longer growth comparisons. This tests early-growth history versus continuing feedback within the discrete model; it adds no physical-validation claim, arbitrary environment timeline or ordinary checkpoint meaning.

Section 3.2, complete Phase 4 environment/history clause:

> Conditions changing mid-growth: the timeline drives the real solver. Done when a **column→plate** history yields a capped column (direction corrected v1.9, decision 0011, to match G-G §XII and the intended geometry). Events are deterministic abrupt jumps; ramps are unsupported. A G-G event replaces registered parameter vectors while leaving `a`, `b`, and `d` bit-unchanged. An LK temperature event conserves interior absolute vapor number density by transforming each active unattached cell as `sigmaNew = (1 + sigmaOld)·cSat(oldT)/cSat(newT) − 1`; attached cells and inactive walls are excluded, and negative results are not clamped. The active maintained Dirichlet shell is transformed too. Under fixed-σ, the next elliptic solve clamps it to the schedule's explicit `sigmaInfinity`. Under monopole-matched, the current implementation clears the old-environment volume-rate lag, so the first post-event solve targets `sigmaInfinity`; after the following completed interface update, later solves again evaluate the registered per-pixel monopole target from the newly computed lag (and remain at `sigmaInfinity` if that rate is zero). This implemented combination has no Phase 6 evidence run; Phase 6 registers no timeline events. Reservoir exchange is reported only as a numerical boundary diagnostic. Temperature-derived kinetics and conversion factors update atomically; cross-temperature demand bookkeeping uses each step's temperature rather than the final temperature for the whole history. Existing checkpoint meanings do not change; the schedule and event log accompany final-state evidence. Proposed decision 0039's resume design is constant-environment only and does not authorize timeline resume.

Section 3.1, retained determinism scope:

> Determinism scope (added v1.2). Bitwise reproducibility is claimed only for the oracle pinned to one engine (Node/V8): the JS spec does not guarantee bit-identical Math.exp/Math.pow across engines, and LibbrechtKinetics leans on exp(). Float32 GPU vs float64 oracle and any future cross-engine or cross-backend comparison use stated tolerances, never bitwise equality; FMA contraction and driver shader compilers differ legitimately. “Deterministic seeds throughout” therefore means bitwise within the pinned oracle and tolerance-bounded on the recorded Windows GPU stack. Untested backends carry no Phase 5 claim.

Section 3.1, retained core/runner boundary:

> Repository structure — the solver is not the app. Five parts from the start: core (model definitions, parameters, morphology metrics, checkpoint format), solver-cpu (the oracle), solver-gpu (WGSL passes), runner (headless CLI), and app (the Three.js instrument). The checkpoint format — JSON metadata plus binary field snapshots — lives in core and is defined early, because oracle-vs-GPU comparisons, regression tests, and the sweep harness all speak through it. Checkpoint metadata records the far-field boundary condition of every run (§2.4). The headless runner executes the same WGSL solver under Playwright 1.61.1's lockfile-pinned Chromium revision 1228 (decision 0017), so parameter sweeps, atlas generation, and overnight runs never require a visible browser tab. The controlled evidence runtime records its exact browser product/revision, observed backend, adapter, driver where exposed, limits, and launch flags on the Windows gate host. Chromium's development-only adapter fields are evidence instrumentation, not production-app dependencies. The GUI is one client of the solver, not its home.

## Consequences

Interruption no longer requires abandoning an entire new-producer trajectory. Checkpoint I/O
and two retained generations consume time and storage, and a crash may lose work since the last
committed boundary. Equality is limited to the pinned producer/runtime and registered supported
modes. This grants no physical-validation status, checkpoint migration between hosts, intra-
relaxation recovery, or power-loss durability guarantee beyond demonstrated filesystem behavior.
It does not reopen Phase 6 production, Phase 7 or the closed Phase 10/S6 work.

## Alternatives considered

- Four-hour terminal cases followed by fresh-seed retries: rejected by the maker because the
  window may omit useful findings and retries discard expensive scientific state.
- Removing the timer without restart: leaves the existing interruption-loss problem unresolved.
- Treating events, spatial observations or v2 snapshots as restart state: lacks the field,
  historical ordering, lag, ledgers and cursor needed for exact continuation.
- Widening the existing v3 schema or accepting all of proposed 0039: changes old meanings or
  imports deferred Phase 6 obligations beyond this discovery deliverable.
- Checkpointing within relaxation or adding other experimental combinations: unnecessary for
  this first complete slice; revisit only if measurements identify a concrete unmet need.
