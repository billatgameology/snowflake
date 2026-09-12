# Plan — Phase 10 candidates: evidence bridges, numerical adequacy, and the scope boundary

- **Phase:** Phase 10 (proposed) — establish what is in scope, measurable, and numerically
  admissible before inventing a closure
- **Status:** **decision-ready planning record; no option has been selected and no Phase 10 work
  is authorized.** Phase 10 is not chartered. Adoption requires an accepted ADR, a charter
  amendment, and a committed execution plan before source consumption, implementation, or a
  scientific PC run. The 2026-08-04 closure proposal is preserved below as design history, not
  as an executable plan.
- **Started:** 2026-08-04 (drafted)
- **Last touched:** 2026-08-20 — decision-ready option and PC-probe design after the maker
  clarified that the working-tree material was brainstorming and that nothing had been selected

## Decision this record supports

Choose what to try next without silently turning a promising lead into a phase commitment. The
choices below are **composable work packages**, not four mutually exclusive programmes:

- A is a menu of three bounded foundations: scope/authority (A-S), intake/currency (A-I), and
  execution preflight (A-P). Adopt only the pieces a selected route needs.
- B and C answer different blockers and neither is a universal prerequisite for the other.
- E is the observation-operator bridge that becomes useful only when B identifies a mapping and a
  target observable.
- H is a separate conditional apparatus/transport implementation; B cannot close a missing solver
  boundary condition by doing source analysis alone.
- F is the honest exit when a required measurement does not exist in accessible sources.
- D, the original closure programme, remains gated on the relevant B/C results.
- G is a legitimate stop-and-synthesize outcome at every decision gate.

Phase 7 is not one of these choices. It remains an independent, paused product/held-out/GPU track
under charter v1.25 and needs its own plan if resumed.

## Landed facts that every option inherits (2026-08-20)

Phase 6 closed 2026-08-20; Phase 8B closed 2026-08-12; Phase 9 closed 2026-08-13. The original
closure draft predates all three. A chartering ADR must use these facts rather than the historical
draft's assumptions.

- **Phase 6 closed with its negative scientific result accepted.** At measured-only grade the
  three arms scored CAK 3/90, M1 54/90, and matched M1 dip-factor ablation 5/90. The numerical
  ladder published **overall NO-PASS, class `criterion`, both spacings**. Attached-cell counts
  exceeded the registered 0.5% agreement at 5/16 coarse-domain comparisons, 6/16 fine-domain
  comparisons, and 17/32 auxiliary comparisons; the largest seed-radius delta was 9.285%.
  These values are quoted from `evidence/phase6-wp2-ladder/report.json` (SHA-256
  `fd20f701…ebb7`).
- **Phase 9 closed all-no-pass with zero promotions.** No one-factor mechanism survived its
  cheapest honest discriminator; the Lamb bulk-transfer law failed 0/6, the planar-facet
  M-K2 diagnostic was mapping-dependent (2/5), and everything else ended as compatibility
  refusals, categorical foundations, or source intake
  ([execution plan](phase-9-execution.md); [guide](../phase9-model-development-guide.md)).
- **The governing Phase 8B corpus has zero held-out rows** (decision 0048). All 51 records are
  development evidence. Phase 8A is a separate frozen 18-entry historical target book; its old
  split has no current gate effect. Future confirmation needs genuinely unseen evidence frozen
  before value inspection, and held-out validation remains Phase 7 property (decision 0043).
- **The ladder does not show stochastic seed noise.** All 80 rows use `noiseEpsilon = 0` and
  `rngSeed = 1`; the seed auxiliary changes the deterministic rasterized initial geometry by one
  cell. Across all 64 registered pairwise comparisons there were no habit-class mismatches, but
  every compared side was neutral, so that fact does not establish a generally robust habit
  observable. The compact breakdown is:
  - domain, 0.7 µm: 5/16 count failures, maximum 4.782%;
  - domain, 0.35 µm: 6/16 count failures, maximum 1.106%;
  - `cflFill` 0.1 → 0.05: 3/8 failures, maximum 3.098%;
  - `relaxTol` 1e-9 → 1e-10: 0/8 failures, with identical counts and aspect ratios; and
  - seed radius 17 → 16 or 18: 14/16 failures, maximum 9.285%.
- **Fourteen post-freeze payloads are already on the governed NAS but unregistered.** The intake
  contains 24 files / 165,706,780 bytes and includes the Voigtländer and Magee supplements,
  carrier-gas and apparatus/heat papers, Zhao 2026 supporting information, and Pokrifka datasets
  (`research/phase9-post-freeze-source-intake-v1.{md,json}`). Any scientific use needs a new
  eligibility decision; none of these bytes revises Phase 9 retroactively.

Consequences for the historical closure draft:

1. **WD1/WD2 have no promoted foundation.** The draft assumed Phase 9's shelf would select
   closures worth attempting; zero promotions means the width law and defect-state closures
   would be built on mechanisms that have not yet survived any one-factor test.
2. **The confrontation sets as drafted do not exist.** "Calibration set and confrontation set
   fixed in advance from the Phase 8 held-out split" cannot be executed: the governing corpus
   holds no held-out rows, and relabeling development records is charter-forbidden. Honest
   confrontation requires either newly acquired frozen-before-inspection evidence or a
   separately gated Phase 7 held-out domain.
3. **Quantitative confrontation inherits the ladder NO-PASS.** Any closure scored through the
   3-D solver at current resolutions confronts an attached-count observable with published
   multi-percent seed sensitivity and failed convergence. Behavioural scoring would need
   observables demonstrated robust to that verdict, or the numerics fixed first.
4. **Observation mapping precedes surface-physics scoring.** The apparatus-to-surface forcing map,
   support/transport representation, and observation operator block the planar and pressure/gas
   families. A closure programme without those bridges would repeat Phase 9's refusals at higher
   cost.

## Corrected option set

| Package | Question answered | Cost shape | What it cannot earn by itself |
|---|---|---|---|
| **A — bounded foundations (A-S/A-I/A-P)** | What is the model class, what evidence is available, and will a selected execution produce its registered obligations? | Modular; scope plus source/media triage may take days to weeks | A physical score, a validation claim, or a risk-free classification |
| **B — observation mapping and evidence** | Can apparatus forcing, support, gas transport, HP26 theory/measurement semantics, and surface state be made measurable? | Mostly source and analytic work; Mac-friendly but access-dependent | A 3-D score before target-specific numerical adequacy |
| **C — numerical adequacy** | Which error source dominates, and is a named consumer observable stable enough at a selected configuration? | Starts cheap, then potentially PC-weeks | Physical relevance without B's target and mapping |
| **D — closures** | Does an explicit width/state/thermal closure beat its matched control? | Code plus expensive solver confrontation | Eligibility until B and C provide its inputs and score |
| **E — observation operator** | Can a source-defined specimen/apparatus measurement be computed from solver state without changing surface physics? | Analytic/code work, then target-specific runs | The missing source map or measurement semantics |
| **F — external experiment/data request** | What exact new measurement would make a blocked comparison decidable? | Specification and laboratory/provider coordination | Evidence unless the requested data are actually acquired and frozen |
| **G — stop and synthesize** | Is the negative result plus a precise blocker map the best current deliverable? | Small | A claim that nature or the model cannot ever do more |
| **H — conditional apparatus/transport implementation** | Can a source-specified support, heat, vapor, or imposed-flow boundary be represented without altering surface kinetics? | Solver/reference-model design and target-specific verification | Source semantics, surface-physics promotion, or a generic 3-D adequacy claim |

These packages refine the original A–D list. In particular:

- A-S/A-I are low-compute, not “zero science risk”: scope, lineage, and eligibility
  classifications are scientific judgments and must retain reasons and uncertainty. A-P is
  execution-specific rather than a universal housekeeping gate.
- B must include Phase 9 guide Step 3, the same-geometry cross-pressure separation that the earlier
  shorthand omitted.
- Ventilation was not “almost scored.” It had zero absolute/model-relative eligible rows. Treat it
  as high-leverage and source-blocked, not near-pass.
- C concerns deterministic initial-geometry sensitivity, domain/grid/timestep adequacy, and
  consumer-specific observables—not random-seed averaging.
- D remains deferred. E, F, and H are additional routes that keep B from becoming an endless
  source search when a bridge must instead be observed, implemented, or newly measured.

## Recommended default sequence — a recommendation, not a selection

1. For the evidence route, adopt A-S + A-I, triage the already-held post-freeze tranche, then run
   B1–B5 in the Phase 9 guide's order.
2. In parallel, C0 may re-derive persisted numerical diagnostics and C0V may design/execute its
   verification controls without a PC habit run; executing C0V also adopts its packet-specific
   A-P preflight.
3. Freeze one target and observation operator before a target-facing C campaign. The early C1–C2
   attached-count probe is a separate opt-in if the maker wants to prioritize numerical-risk
   information before B selects that consumer.
4. If C1–C2 are selected, adopt A-P for their exact packet and stop on its declared branch rather
   than launching a broad convergence campaign.
5. B outcomes propose E, F, or H; they do not automatically authorize code, external contact, or
   another search. Return to the maker unless the chartering ADR preauthorizes an exact bounded
   branch and budget.
6. Attempt D only after the relevant B/E/H and target-specific C gates pass. G remains available
   independently at every gate.

This sequence does not make C a prerequisite for analytic Phase 10 results. It makes
target-specific numerical adequacy a prerequisite for every quantitative 3-D solver comparison.

## A — bounded foundations, selected by consumer

### A-S — scope and authority overlay

Do not reduce scope to one in/out bit. Record the Phase 8A 18-entry book and the Phase 8B 51-record
corpus as separate denominators, and give each record these independent fields:

1. **phenomenon class:** single crystal, polycrystal/twin, aggregation, riming/graupel, nucleation,
   impurity/chemistry, or mixed/uncertain;
2. **charter model-class scope:** in, out, mixed, or unresolved, with reason and source;
3. **current representability blockers:** zero or more of missing physical operator, missing
   forcing map, missing observation operator, numerical inadequacy, or other named blocker;
4. **specimen/apparatus compatibility:** direct, adapter-required, source-blocked, or incompatible;
5. **immutable evidence role:** Phase 8B development; Phase 8A historical-held-out with no current
   gate effect, historical model-development, historical input, or historical out-of-model; or a
   separately identified descriptive-only role—never newly unseen and never a rewrite of the
   frozen split;
6. **phase ownership:** Phase 7 held-out/product/GPU obligation, Phase 10 development, shared
   read-only input, or out of either phase; and
7. **current decision eligibility:** quantitative, diagnostic-only, categorical-only, or refused,
   with the exact blocking operands.

Store these as a new versioned overlay/crosswalk; do not modify the frozen 8A or 8B artifacts.
Genuinely unseen evidence can exist only in a future value-blind Phase 7 freeze with its own new
denominator. The charter amendment states the permanent product/model-class boundary. It must not
make today's missing mapping or numerical failure permanently “out of scope,” or use a Phase 10
classification to waive a Phase 7 obligation. Reports print both historical denominators and the
unresolved/mixed counts rather than one flattering coverage percentage.

**A-S done when:** separate overlays cover 18/18 Phase 8A entries and 51/51 Phase 8B records,
preserve immutable role/phase ownership, allow multiple simultaneous blockers, and carry cited
reasons for every scope classification. This earns a scope census only.

### A-I — post-freeze intake and finite currency

Before new acquisition, assign every one of the 14 payloads / 24 files a committed identity,
version/correction, rights, lineage, duplicate, purpose, and eligibility disposition. Any consumed
item remains development evidence. Likely routing, to be confirmed by inspection rather than
assumed from filenames:

- Voigtländer S1/S2 and the clean Magee supplement → B5 surface-state trajectories;
- Libbrecht apparatus/systematics, Nelson heat conduction, and Libbrecht–Rickerby → B1 transport
  and support constraints, with an explicit transfer argument before use for a different apparatus;
- Gonda–Namba–Sei 2001, Gonda–Sei 1988, and Zhao 2026 supporting information → B3 cross-pressure
  intake after geometry/condition audit;
- Pokrifka datasets → B4/B5 only after their schema, method, lineage, and forcing semantics are
  inspected; and
- the Lamb source tar → a reproducibility side branch, not evidence that reopens D-BT.

Replace a “standing watch” with one frozen currency snapshot at protocol freeze plus named reopen
triggers: a correction/version change to a consumed source, a newly selected load-bearing family,
an unresolved priority lead becoming available, or a maker-scheduled refresh. Record queries,
dates, endpoints, and terminal dispositions. Do not create an indefinite search obligation.

**A-I done when:** all 14 post-freeze payloads have terminal identity/rights/lineage/eligibility
dispositions and the selected B source lineages have one closed currency snapshot. A-I is required
for B, not for G or a source-independent C probe.

### A-P — selected-execution obligation preflight

Implement the still-open `docs/phase6-lessons.md` B2 rule for any selected execution that registers
outputs/checks. A frozen matrix names every registered output and check, its producer, artifact
field/path, and—where the governing protocol requires them—its independent evaluator and negative
control. Preflight fails before launch for any obligation with no production path or any registered
check with no caller. Run-specific checks also cover clean worktree, allowed head, exact runtime,
unique output/log paths, expected roster, sufficient disk, and stale writers.

**A-P done when for a selected packet:** an adversarial fixture proves the matrix refuses one
missing producer and one uncalled check, plus any additional negative controls proportionate to
that packet under decision 0049. A-P proves obligation completeness, not scientific correctness.

## B — evidence-gated observation route

Execute the Phase 9 guide's steps 1–5 without skipping Step 3:

**Finite acquisition boundary:** B starts from A-I's 14-payload tranche. It permits one named
acquisition round for the complete HP26 article, Pokrifka–Moyle–Harrington 2025 Methods,
Keller–Hallett 1982, the complete current Princeton monograph, Zhao's main article, and its
identified missing S2 companion video. For each still-missing operand, it then permits at most one
pre-registered targeted search packet with frozen services/endpoints, queries, date window, result
cap, and terminal dispositions. No broad discovery or recursive citation chase is authorized; new
leads go to a backlog unless a maker-approved plan amendment names them. Thus every B branch can
end in success or a finite source-blocked refusal. Every source or result whose values B opens or
uses becomes Phase 10 development evidence. A candidate for a future Phase 7 denominator must stay
sealed and value-blind; if preserving that role matters, it leaves B rather than being inspected.

### B1 — two independent apparatus-forcing branches

#### B1a — Sei–Gonda planar facets

Establish a source-specific mapping from plotted/apparatus supersaturation to the crystal-surface
forcing for the planar apparatus. A map borrowed from another apparatus needs an explicit,
falsifiable transfer argument.

For the Sei–Gonda planar family, mapping alone is insufficient. A physical score also requires
complete observation/model-input uncertainty and comparison against the complete current Princeton
edition for the inherited CAK control. The retained 46-page preview lacks the needed chapters.

**Stop/done B1a:** either (1) freeze a bounded source-backed mapping and the current-edition
comparison, plus either complete input/observation uncertainty or a predeclared non-statistical
sensitivity envelope; or (2) record a terminal mapping, uncertainty, or edition refusal and
propose the exact missing-operand scope for a separately selected F branch. The sensitivity
envelope cannot be called a statistical uncertainty and cannot substitute for the forcing map or
current-edition comparison. Do not declare the planar branch complete from a map alone.

#### B1b — supported pressure/residual apparatus

Independently specify the supported specimen's local vapor and temperature forcing, needle/support
heat path, asymmetric vapor transfer, evolving geometry, and matched cross-pressure observation.
Source analysis may produce an analytic/scalar comparison. If a solver comparison needs a support,
heat, or vapor boundary absent from the current model, route that work to H; do not call the source
map an implemented transport representation.

**Stop/done B1b:** either freeze the source-backed apparatus/transport specification and its
observation domain and propose the exact candidate E/H scope for maker return, or record an
operand-level refusal and propose the exact candidate F request for maker return. B does not
execute E/H or write/send F's request. B1 is terminal only when B1a and B1b each have an independent
disposition.

### B2 — controlled-velocity ventilation evidence

Seek the complete Keller–Hallett 1982 source or another source-complete controlled-velocity
dataset. Eligibility requires interval-wide density, viscosity, speed, characteristic size, time,
temperature, droplet/support state, and method. `Re < 2` remains a diagnostic condition, not a
universal no-ventilation rule; the source set includes a reported no-effect example at `Re = 7.5`.

Finding Keller–Hallett could create a standalone controlled-velocity dataset. It would not
retrofit eligibility into the ten Gonda–Komabayasi rows or unlock pressure/latent-heat scores
without ventilation-complete target rows and a crossed design.

**Stop/done:** freeze one complete controlled-velocity dataset/protocol, or retain ventilation as
source-blocked and propose F's exact candidate data request for maker return. B does not write or
send that request.

### B3 — same-geometry cross-pressure separation

Seek trajectories that vary pressure/gas while holding specimen geometry, support, temperature,
history, and ventilation sufficiently controlled to separate gas transport from surface response.
Before value extraction, execute the already-registered intake work: Isono source currency; a
source-specific two-reader extraction with frozen operator, point identity, uncertainty, and
lineage; and adjudication of Gonda Figure 3's temperature conflict. Audit the Gonda carrier-gas
materials and both Zhao article/supplement roles before claiming they meet this condition.

**Stop/done:** freeze an eligible one-factor/crossed design, or a source-validated transport
adjustment that identifies gas transport separately from surface response. Merely listing
controlled and confounded axes is not eligibility. Otherwise record that the historical
comparisons remain non-identifying and propose the minimum missing design as a candidate F scope
for maker return; B does not write or send the request.

### B4 — complete HP26 semantics

There are two distinct gaps:

1. the complete HP26 final theory article needed to compare step-source/width rivals; and
2. Pokrifka–Moyle–Harrington 2025 Methods needed to define the measurement history's categorical
   `48% → 20%` forcing labels.

Equations from the final theory paper cannot supply the measurement method's forcing semantics.
Wang 1987 remains a frontier lead, not a required blocker.

Even with both papers, physical `w0`, a lattice-to-width map, the current monograph comparison,
numeric spatial/rim trajectories, and matched transport remain separate prerequisites.

**Stop/done:** bind both source roles independently and limit the immediate result to a
same-lineage theory replay/rival fit; mechanism ranking additionally requires those remaining
operands through B1/B5/E/H/C5. Otherwise retain M-SS as source-blocked without inventing the forcing
history.

### B5 — calibrated surface-state observables

Use the newly acquired videos and supplements as candidate calibration media for numeric
roughness, pocket, terrace, lateral-facet, or rim trajectories. Video availability removes only
the old “media absent” condition; scale/time calibration, observation uncertainty, local forcing,
and matched transport are still required.

Before numeric inspection, freeze the finite media and candidate-feature roster, scale/time
calibration, extraction operator, repeatability/uncertainty method, and eligibility thresholds.
Publish every attempted extraction or refusal; do not choose only the most favorable video or
feature afterward.

**Stop/done:** every frozen attempt is reported, and at least one reproducible numeric trajectory
meets its predeclared observation/forcing/transport eligibility, or the complete roster closes with
recorded categorical-only/refusal reasons.

**B done when:** B1a, B1b, and B2–B5 each have either a frozen eligible bridge/dataset or a terminal,
operand-level refusal that can become candidate scope for a separately selected F package; every
allowed acquisition/search packet is terminal; and no unbounded source chase remains. B does not
promote a mechanism, implement missing transport, write or send an external request, or earn a 3-D
score.

## C — numerical adequacy, staged by information per PC-hour

### C0 — existing-byte diagnostic, no solver run

Re-derive the ladder breakdown above and test candidate consumer observables against all existing
pairings. The terminal artifact persists attached count, aspect ratio, final extent, symmetry
error, cycles, sweeps, timing/RSS, stop reason, and inputs; C0 may analyze only those fields and
quantities independently derivable from them. It does not contain occupancy, checkpoints, exact
crystallographic spans, or trajectories, so those and any future B-defined observation operator
require fresh replay output. Do not adopt habit class merely because it had 0/64 mismatches: all
comparison sides were neutral. Output is a ranked list of persisted observable/error-source pairs
and a list of additional fields needed by the target-specific acceptance quantity.

### C0V — absolute verification before a target score

Self-convergence can show consistency without showing accuracy. Use three separately frozen
controls:

1. **Existing exact radial control:** retain the analytic constant-coefficient spherical case at
   radial spacings 0.7, 0.35, 0.175, and 0.0875 µm, with relative surface-supersaturation error
   below 1e-9 at every spacing, the no-attachment uniform-field and shell-value identities, and an
   independently derived growth-velocity comparison. Mutating the Robin coefficient or finite-shell
   term must fail.
2. **Static 3-D aggregate-v6 control:** before implementation, derive and freeze an exact or
   independently solved field that exercises the actual aggregate-v6 boundary and
   monopole-matched shell. Its protocol names the physical domain, at least three grid levels,
   volume-weighted L2 and L-infinity field/flux norms, the analytically justified expected order and
   lower bound, residual/divergence/smoother-drift limits, and a boundary-stencil negative control.
   If no such reference can be derived without sharing the production operator, record a refusal;
   do not substitute self-convergence and call it accuracy.
3. **Moving-interface event control:** freeze a small symmetric case with independently computable
   first-event time, tied attaching cells, topology update, post-event relaxation, and exact kinetic
   ledger. Compare event time, new-cell orbit, field state, and ledger, and require a mutated event
   time/topology path to fail. This is a numerical event check, not physical validation.

C0V passes only if all three controls meet their frozen norms/order/tolerances and negative
controls; otherwise it records which layer refused or failed and C5 cannot pass. The exact 3-D
manufactured values must be derived and frozen before its production implementation, not selected
from results. This Mac-friendly work may proceed beside an explicitly opt-in C1–C2 diagnostic. A
faster backend must reproduce the permanent float64 oracle's accepted solution and ledger
quantities; speed is not scientific evidence.

### C1 — PC replay and cost anchor

If C is adopted, the first PC job is an exact replay of the **sentinel's own baseline**, not new
science:

- row: `dom-0.7-n80@-6C-f0.15-M1`, originally produced at
  `f59d18702301155c0c2e7eaecc3442e6cf117123`;
- fixed inputs: −6 °C, fraction 0.15, `sigmaInfinity = 0.00906`, M1, `dxUm = 0.7`, seed
  radius 8 / thickness 17, target extent 27, `N = 80` cubed with the explicit `domainCenter`
  convention, `cflFill = 0.1`, `relaxTol = 1e-9`, aggregate-v6, monopole-matched, pressure
  101325 Pa, noise off, seed 1, `hexPrism`, `divTol = 1e-7`, `relaxMaxSweeps = 200000`,
  step cap 100000, and contact guard 0.65;
- deterministic historical outcomes from the bound row: `size-target`, 92 cycles, 474,106
  sweeps, final extent 27, attached count 7,693, aspect ratio 1.2272727272727273, and symmetry
  error 0; and
- historical provenance only: Node v24.13.1, 10,655.1654165 s under recorded concurrency 12,
  peak RSS 153,739,264 bytes. That timing is contention-bound and is not a serial forecast.

Launch at concurrency 1 on the dedicated PC. Bind actual CPU/RAM/OS/Node/head, transitive
evolution-source hashes, command, start/finish, peak RSS, stdout/stderr, and exit status. Replay
acceptance is bitwise over stop reason, cycles, sweeps, final extent, attached count, aspect ratio,
and symmetry error only when the original transitive evolution bytes and Node v24.13.1 are
identical. Otherwise this exact-replay protocol is ineligible and must be amended before launch;
do not invent a tolerance after seeing a mismatch. A replay mismatch stops the campaign as an
apparatus/code-continuity finding. If it passes, this fresh N80 row—not the historical row—is C2's
baseline, so all C2 comparisons share one execution head and runtime.

### C2 — first scientific discriminator: coarse-domain plateau sentinel

If C1 passes, run exactly two conditional rows at the published point with the largest **latest
coarse-domain-rung** delta and the largest timestep delta: −6 °C, fraction 0.15, M1. This selection
uses published results and is diagnostic-only; it cannot establish the other seven points.

Use the same Phase 6 fixed configuration and −6 °C / fraction 0.15 / M1 condition as C1, and vary
only `N`:

1. run `N = 96` and compare with C1's fresh `N = 80` replay; then
2. only if `N = 80 → 96` has the same registered class and attached-count difference ≤0.5%, run
   `N = 112` and compare `N = 96 → 112` by the same rule.

A row is comparable only if it stops `size-target`, converges at every interface cycle, avoids
domain contact, satisfies the residual/divergence and smoother-drift bounds, closes the exact
placed-plus-clipped kinetic-demand ledger, satisfies the frozen shell diagnostics, and passes all
other frozen solver-integrity witnesses.
Retain each cycle's new-attachment coordinates (or an equivalently complete witness), so an
independent evaluator—not a producer boolean—can recompute D6h orbit closure at every cycle plus
periodic/final full-state symmetry. The evaluator also recomputes relative differences from row
bytes. Missing, capped, malformed, unconverged, contact-stopped, or otherwise
invalid rows stop the domain comparison with **no-decision**. Classify the cause separately as
infrastructure, artifact, solver-integrity, or mixed: residual/divergence, smoother-drift, ledger,
or symmetry violations are solver-integrity failures, not infrastructure facts and not evidence
that the domain-size criterion failed.
Only a comparison between two admissible rows that violates class/count tolerance earns a
domain-criterion no-pass and stops the fan-out. If both sentinel increments pass, the next optional
tranche is the same two new rungs at the remaining seven Phase 6 check-point/arm combinations
(14 rows). Only 16/16 passing new comparisons supports “coarse-domain plateau observed over the
registered eight-point roster at N = 80–112.” It does not resolve timestep, physical grid spacing,
initial geometry, or target relevance.

The choice of C2 over an immediate `cflFill = 0.025` run is an economic hypothesis to test in C1,
not a runtime promise. For scale only, the historical fine-grid 0.05 row at −6 °C/M1 took
72,251.382 s under recorded concurrency 12; that contention-bound value is explicitly
non-transferable as a serial forecast. The design is epistemically cleaner because it establishes
a domain plateau before testing timesteps at a domain whose adequacy is unknown.

### C3 — timestep plateau, only after a domain configuration is selected

At the selected domain and target observable, halve `cflFill` successively and require two
consecutive accepted increments. The published 0.1 → 0.05 comparison is prior diagnostic evidence,
not permission to assume 0.05 is converged. Start with the worst published timestep point
(−6 °C, fraction 0.15, M1), then expand to the frozen roster only if the sentinel passes. Stop on a
failed sentinel and choose between smaller steps or an event-limited interface integrator before
spending the full matrix. The event-limited alternative changes event timing and relaxation
frequency; it requires its own ADR and newly frozen protocol under
`docs/attachment-kinetics.md` §4.4 before implementation or comparison.

### C4 — initialization and grid convergence

Do not average “seed noise.” Freeze one physical initial crystal and represent rasterization error
explicitly. Candidate designs to decide by cheap pilot are:

- two deterministic inscribed/circumscribed rasterizations at each grid spacing, reported as a
  sampled representation envelope—not a mathematical bound on the evolved observable unless a
  monotonicity proof is supplied;
- a volume-matched family that reports initial physical volume, basal/prism spans, and surface
  contact counts before growth; or
- a new fractional/subcell initialization, which changes state semantics and therefore needs a
  solver ADR and fresh verification before use.

Grid comparisons hold physical domain, physical seed geometry, observation endpoint/time, forcing,
and support semantics fixed, and requalify elliptic and interface-timestep error at each spacing.
Compare at matched physical observation conditions, not merely matched cell counts. The existing
radius 16/17/18 auxiliary is evidence of initialization sensitivity, not a grid-convergence ladder.

### C5 — target-specific adequacy gate

After B/E name the target and observation operator, freeze the minimum domain, timestep, grid, and
initialization envelope plus the `relaxTol`, `divTol`, and sweep-cap controls that can change that
target's decision. Phase 6's 0/8 relaxation-tolerance failures do not transfer to new domains,
spacings, targets, or operators. Preserve separate criterion, infrastructure, artifact,
solver-integrity, and mixed outcomes; invalid rows yield no target numerical decision even when
they independently establish a solver-integrity failure. A pass is scoped to that target and observable.
If a target enables nonzero `noiseEpsilon`, add a frozen stochastic ensemble, uncertainty
estimator, and seed-count adequacy check; the deterministic rasterized-seed result supplies no
stochastic qualification.
After single-axis fail-first screens, execute the critical combined corners of domain × timestep ×
grid × initialization; separate one-axis passes are not assumed to compose. No generic “solver
converged” label transfers to another family.

**C done when:** C0V passes; domain/grid/timestep axes have either a target-scoped plateau over the
predeclared successive increments or a criterion no-pass; initialization sampling has a declared
envelope whose variation cannot change the target decision or a criterion no-pass; solve tolerances
pass their own residual/divergence/cap criteria; the selected observable's decision is stable over
the full declared envelope and critical crossed corners; every inadmissible result stays no-decision
for the target criterion while retaining any separate solver-integrity failure; and an independent
evaluator re-derives the verdict from artifact bytes.

## E — observation-operator implementation

When B identifies source semantics, implement the smallest operator that maps solver state to what
the apparatus measured: for example local face-normal rate, projected calipers, mass-equivalent
radius, rim position, or a calibrated video feature. Freeze units, sampling cadence, interpolation,
support mask, and uncertainty propagation before inspecting the comparison. Verify it first on
analytic/manufactured geometry and source examples; only then couple it to C5. E changes no surface
physics and earns no mechanism claim.

**E done when:** the target, estimand, required solver state, operator, and acceptance uncertainty
are frozen before model output is inspected; manufactured/source fixtures and an independent
calculation meet the registered tolerance; and the operator either produces the named observable
with propagated uncertainty or refuses because required state is absent, routing that gap to H/F.

## H — conditional apparatus/transport implementation

H exists because an observation map and an observation operator cannot represent physics absent
from the solved domain. It is opened only when B1b/B2/B3 supplies source-defined geometry and
boundary semantics that a named comparison actually needs. Candidate forms are a standalone
planar/axisymmetric support-aware reference model or a versioned 3-D boundary module for substrate
heat flow, asymmetric vapor access, or imposed flow. Choose the smallest model that computes the
source observable; do not modify `LibbrechtKinetics` surface exchange merely to absorb apparatus
effects.

Any 3-D transport/boundary change needs an ADR and solver-spec update, manufactured/reference
verification, ledger and checkpoint treatment, matched ablation against the unchanged transport
control, and C5 qualification. A reduced-dimensional result stays scoped to its geometry and may
be preferable when the experiment measures face speed or a supported history rather than free 3-D
morphology.

**H done when:** the source-required boundary is either implemented and verified for its named
observable, or refused with the missing equation/geometry/condition identified. H cannot infer its
own boundary conditions from the model output it is being asked to score.

## F — external experiment or data-request specification

For every B refusal, write the smallest sufficient request rather than “more data”: exact geometry,
support, temperature/pressure/gas, controlled velocity, far-field and local forcing semantics,
timebase, size axes, uncertainty, calibration, raw-data format, and the crossed intervention. Rank
requests by identifiability/information gain, feasibility and cost, lineage independence, rights,
evidence role, and only then the number of comparisons unlocked. Provider contact or experiment
execution is a separate maker-authorized external action. Before values are inspected, designate
any acquired material either Phase 10 development evidence or a sealed candidate for a future
Phase 7 held-out freeze; Phase 10 cannot consume the latter and later relabel it unseen.

**F done when:** each request names the decision/estimand, exact minimum fields and tolerances,
freeze-before-view rule, intended evidence role, rights needs, owner, and required external
authorization; it then has a terminal `request-ready`, `not-worth-requesting`, or
`provider/experiment-refused` disposition. Writing a request does not authorize sending it.

## D — closure eligibility gate

WD1–WD4 below become candidates only when all of the following are true for a named target:

1. B supplies source-complete forcing, support/transport, and observation semantics;
2. E computes the measured quantity from the model and H supplies any required missing apparatus
   boundary;
3. C5 establishes numerical adequacy for that quantity;
4. Phase 10 development calibration and falsification data are prospectively separated where the
   available evidence permits, while any label-bearing unseen confirmation remains a separately
   planned Phase 7 gate frozen value-blind before inspection; and
5. a one-factor matched control, parameter count, uncertainty propagation, and falsification rule
   are frozen before the result is seen.

Until then, D is preserved design inventory only. Zero Phase 9 promotions means no closure is
grandfathered through this gate.

## G — stop-and-synthesize outcome

At any gate, the programme may close with the Phase 6 negative result, Phase 9 blocker map, scope
census, source dispositions, numerical no-pass, and exact external-data request as its deliverable.
“Stopped because the deciding operand does not exist” is a scientific result. It does not imply
that the mechanism is false or permanently untestable.

**G done when:** the synthesis binds every quoted claim to its existing artifact, distinguishes
criterion failures from refusals/no-decisions, lists unresolved operands and the exact reopen
trigger, and states that it performed no new scoring or validation. G may be selected independently;
it does not require source triage or PC preflight unless those outputs are part of its stated scope.

## PC execution packet that must exist before the maker moves the run

If C1–C2 are selected, the implementation plan must provide a dedicated Phase 10 row producer,
dispatcher, evaluator, and launch README. Do not write into or amend Phase 6 evidence. The packet
must contain:

- a frozen three-row maximum initial roster (C1 replay, C2 N96, conditional C2 N112);
- the exact conditional branch and no automatic fan-out beyond N112;
- a 24 h wall cap per row and 72 process-hour cap for the initial packet; a capped row is recorded
  as an infrastructure/resource refusal, never a numerical failure or silently excluded result,
  every retry, restart, failed attempt, and superseded attempt counts against both caps, and no
  later row launches after the packet cap is exhausted;
- obligation-production preflight from A-P;
- clean-head/runtime/source-hash checks and a dirty-tree refusal;
- unique live log, error, exit-status, and partial-result paths;
- single-writer, append/merge-safe output with restart semantics;
- actual process concurrency and per-row provenance; and
- physical time and trajectory samples plus exact spans/occupancy, initial geometry, stopping
  overshoot, relaxation/divergence, hole-fill/deficit, kinetic ledger, and shell diagnostics needed
  to distinguish event timing from boundary or initialization effects; and
- an artifact-derived evaluator that rejects missing/duplicate/unexpected rows and recomputes
  every comparison.

Use concurrency 1 for time-to-first-decision. The Phase 6 record measured about 10× per-process
wall inflation at sustained concurrency 12 on this memory-bandwidth-bound host. Before a full
roster, measure aggregate throughput at a small bounded concurrency without changing any case, and
record the chosen value. “Max out all cores” is not assumed to minimize wall time.

The Windows launch order is: create/update the isolated worktree on NVMe; install the pinned
dependencies; verify a clean head and Node v24.13.1; run exact `npm test`; run packet preflight;
launch C1; inspect its evaluator verdict; then allow the dispatcher to take only the declared C2
branch. Exact commands belong in the committed implementation plan after selection, not in this
decision record before the scripts exist.

## Adoption choices for the maker

- **Scope only:** A-S, then return to the maker with the two immutable overlays.
- **Evidence plus verification (recommended default):** A-S + A-I + B, alongside read-only C0 and
  executable C0V with its packet-specific A-P preflight. B outcomes identify candidate E/F/H
  branches but do not authorize them; return to the maker with their exact scope and budget. No
  scientific PC habit row runs in this package.
- **Early numerical-risk probe (explicit opt-in):** C0 + A-P + C1–C2, with C0V allowed in
  parallel. This answers only the neutral attached-count/domain sentinel and may be selected before
  B if the maker values early numerical-risk information despite its non-transfer to a future B
  consumer.
- **Consumer-defined numerical qualification:** after B/E/H freeze a target, adopt C0V and the
  relevant C3–C5 protocol plus A-P. This is the route to a quantitative 3-D development score.
- **Stop and publish the boundary:** A-S + G, or G alone over already published state if no new
  scope census is wanted.

D is not currently selectable. E, F, and H are separately selectable only after their exact target,
branch, resource budget, and return/stop rule are named in the chartering ADR or a later maker
decision; a B outcome never authorizes them automatically.

Selecting a package still requires the chartering ADR to quote the exact work packages, claim
limits, and done-when clauses it adopts. Its authority audit must cover the charter's scientific
claim discipline, Phase 7 held-out ownership, Phase 8 immutability, Phase 9 development labels,
sequencing/isolation, and assurance clauses—not only the sentences that say Phase 10 is uncharted.
That reconciliation should also correct `AGENTS.md`'s stale statement that the charter covers only
Phases 0–8. Unselected packages remain proposals.

## Planning done when

This planning session is complete when this record and `docs/PROGRESS.md` state that no package is
selected, preserve the corrected A–H option set, define the first bounded PC branch and its stop
rules, and leave the next session an explicit maker decision. No source is consumed, solver code is
changed, or scientific row is launched by satisfying this planning milestone.

## Historical 2026-08-04 closure draft — preserved design history, not executable

The body below is retained because its closure ideas may become useful after D's eligibility gate.
Its held-out-set assumptions and immediate WD1–WD4 sequence were superseded by the landed facts and
decision structure above.

### Goal

Phases 8–9 exhaust what the literature *prints*: tabulated kinetics, source-endorsed
corrections, protocol variables. What remains is the physics the sources themselves say is not
resolved — the width-dependent nucleation barrier whose scale (~50 nm terraces) sits far below
any affordable lattice cell, the edge-sharpening feedback that makes kinetics
structure-dependent, and the young-crystal defect state that makes kinetics time-dependent.
This phase attempts those as explicit, honest **closures** — invented sub-grid models,
calibrated then confronted with held-out behaviour — and, equally important, writes down the
**scope boundary**: the parts of real snowfall (polycrystals, riming, aggregation,
nucleation-mode diversity) this single-crystal model will never claim, so absence of those
forms is never again scored as model failure.

### Historical done when

The charter has no Phase 10 milestone; proposed metric: done when every attempted closure is
either (a) promoted with held-out behavioural evidence under a frozen protocol, or (b) closed
with a recorded negative result stating what was tried and why it failed; and the model's
scope boundary is stated in the charter such that every target in the Phase 8 book is
classified in-scope or out-of-scope with a reason.

### Historical approach

Closures are treated as hypotheses with more degrees of freedom than printed physics, so the
discipline tightens: every closure carries a **calibration set and a confrontation set fixed
in advance** (from the Phase 8 held-out split), a stated parameter count, and a pre-committed
falsification condition. A closure that can only be tuned, never surprised, is not promoted.

#### WD1 — Width-dependent kinetics closure (the M2 gap)

The source's own program: α depends on facet width w, with the operative terrace scale
~50 nm against our Δx = 0.35 µm — unresolvable directly, therefore a closure, not a
discretization. Two candidate forms, both ADR-gated:

- **WD1a — continuous:** σ₀_eff(w) interpolating between narrow-facet (M1-dipped) and
  broad-facet (M2-undipped) printed curves, with w measured from local surface geometry
  (contiguous faceted-cell runs; integer lattice invariants per the ADR 0023/0024 D6h rule).
- **WD1b — two-state with hysteresis:** each facet patch carries a narrow/broad flag with
  ESI-style switching (fast growth + sharpening edge → narrow; broad recovery is slow),
  mimicking the source's described feedback rather than resolving it.

Calibration anchors: the printed M1/M2 curve pairs; the CM8/CM9 SDAK inversions **only if**
digitized under the Phase 8 read-uncertainty discipline (their dotted lines are eye guides,
not fits — never calibrate to an eye guide); the FACET width statements (1–2 µm "large facet"
threshold at −2 °C). Confrontation: held-out trajectory and bistability targets, and the
capped-column abrupt transition.

#### WD2 — State-dependent kinetics (the Pokrifka axis)

A per-crystal (or per-facet-patch) **defect state** variable: young frozen-droplet surfaces
grow in an efficient dislocation-fed mode; the state decays toward nucleation-limited faceted
kinetics as facets emerge. Anchors: Pokrifka's order-of-magnitude α fall within one crystal's
growth (0.025 → 0.0016 fitted example), the P-exponent signature (P < 1 during transition),
and Gonda & Yamazaki's minutes-scale sphere→droxtal→prism timeline. Confrontation: the
levitation mass curves (held-out), and the seed-arm results from Phase 9 M-S — if a droxtal
seed plus WD2 reproduces early-growth behaviour that a static-α droxtal seed cannot, the
state variable earned its place. This is also the model-side test of the Class C α-spread
reconciliation hypothesis.

#### WD3 — Full thermal coupling (only if Phase 9 M-LH says so)

Promote latent heat from σ∞ rescaling to a coupled solve only if the rescaling's residuals at
the warm end are demonstrably load-bearing on a Phase 8 target. Otherwise record the negative
result and keep the cheap form.

#### WD4 — Efficiency machinery (enabling, not physics)

If the closure × module × protocol space outgrows brute-force sweeps: a registered
emulator/active-learning layer that *proposes* runs, with every promoted claim still backed by
a real frozen-protocol run. The emulator never becomes evidence — it only chooses where to
spend the solver budget.

#### WD5 — The scope boundary (write it down)

A charter statement, with the Phase 8 book as its census: this is a **single-crystal,
fixed-lattice, vapour-growth** model. Out of model class, permanently and by design:
polycrystalline forms (dominant between −20 and −40 °C per Bailey–Hallett, and generated in
free fall by droplet accretion below −13/−19 °C per Takahashi), riming and graupel,
aggregation, nucleation-mode diversity and twinning, and chemical-impurity habit effects.
Every out-of-scope Phase 8 target gets the flag; the model's reports state coverage as "of the
in-scope regime" with the in-scope fraction printed, so the boundary is visible in every
result rather than remembered by insiders.

#### WD6 — Watch the outside

Two standing, low-cost intake obligations: the Penn State lineage (Harrington–Pokrifka 2026
and successors — their −50 °C axis-resolved data extends the measurable range below anything
in the current book) and any MD progress on the CM10 program (terrace step energies and the
Ehrlich–Schwoebel barrier through the premelting onset — the quantities that would turn WD1
from closure into physics). Rule 12 currency checks extend to this lineage.

### Historical steps

- [ ] **S0 — Scope boundary ADR + charter amendment (WD5).** Check: every Phase 8 book entry
  carries an in-scope/out-of-scope flag with a reason; reports template updated.
- [ ] **S1 — Closure protocol ADR.** The tightened rules above (calibration/confrontation
  fixed in advance, parameter counts, falsification conditions, no eye-guide calibration).
  Check: ADR accepted before any closure code.
- [ ] **S2 — WD1 candidate implementation + calibration.** Both forms behind Phase 9's module
  interface; width measurement D6h-regression-tested with a negative control. Check:
  calibration reproduces the printed curve pairs at the width limits; parameter count and
  falsification condition on record.
- [ ] **S3 — WD1 confrontation.** Held-out trajectories, bistability, capped-column
  transition. Check: promote or record the negative result, per closure form.
- [ ] **S4 — WD2 implementation + confrontation.** Defect-state variable; calibrate on the
  named anchors; confront the held-out levitation curves and the seed-arm interaction.
  Check: promote or record the negative result.
- [ ] **S5 — WD3 decision.** From Phase 9 M-LH residuals. Check: decision recorded either way.
- [ ] **S6 — WD4 emulator, only if budget demands.** Check: emulator proposals audited against
  a random-baseline batch before adoption; no emulated number ever cited as evidence.
- [ ] **S7 — Synthesis report.** What the best surviving configuration reproduces of the
  in-scope Phase 8 book, behaviourally scored; what it still cannot; whether the Class C
  disagreements (cold end, α spread) were illuminated by protocol-matched runs; and the
  stopping-rule recommendation for the programme.

### Historical out of scope

- Molecular-dynamics simulation in this repository (WD6 watches for it; we do not attempt it).
- Modeling polycrystals, riming, aggregation, twinning, or impurity chemistry (WD5 states
  this permanently, with sources).
- Any claim that a promoted closure is *the* physical mechanism — closures reproduce
  behaviour; mechanism attribution stays with the laboratories (the SDAK "working hypothesis"
  status transfers to anything built on it).
- Phase 7 territory (GPU cohort, held-out execution machinery) except as a consumer of its
  published results.

### Tried and rejected

- **Treating gas-phase diffusion as an implicit width closure** — the Phase 6 record already
  rejects "the pressure is set, therefore ESI is modeled" (`libbrecht-figure-findings.md`
  §10.2); a closure must be explicit or absent.
- **Calibrating to eye-guide curves** — the CM8/CM9 dotted lines are explicitly not fits;
  Phase 6 nearly inherited this mistake and the prohibition is now structural (S1).
- **"The sweep failed, therefore SDAK is load-bearing"** — the retracted Phase 6 inference;
  WD1's promotion standard (held-out behavioural evidence with a matched ablation) is written
  specifically so that its conclusion, if reached, is earned the right way.

### Historical open questions

- Is WD1a or WD1b attempted first, or both in parallel with a shared calibration set? (WD1b
  is closer to the source's described mechanism; WD1a is fewer parameters.)
- What is the programme's stopping rule? A candidate: stop when the in-scope Class A book is
  behaviourally reproduced within stated uncertainties, and further closure complexity buys
  no held-out improvement — but the maker should set this before S7 makes it contentious.
- Does WD2 operate per-crystal (cheap, global state) or per-facet-patch (expensive, local)?
  The levitation data cannot distinguish these; the seed-arm interaction might.
- Whether and when any of this becomes publishable outside the repository — the Phase 8 book
  plus the re-scored baseline may be the more valuable public artifact than any single model
  result.
