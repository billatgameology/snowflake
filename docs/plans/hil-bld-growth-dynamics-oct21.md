# Plan — HIL and BLD growth dynamics campaign

- **Phase:** active Phase 10 exploration under charter sections 2.5/3.2 and ADRs 0011, 0055, 0058–0060 and 0062.
- **Status:** BLD's finite queue has ended with 91 checked endpoints/one failure, verified NAS publication and fresh BLD recovery on October24. HIL's latest locally recorded launch remains October21; no new live HIL observation is claimed.
- **Started / last touched:** 2026-10-21 / 2026-10-24 by Codex/GPT-6.
- **Authority:** maker requests full useful use of HIL's 20-worker allocation and BLD's 32-worker allocation, detailed long queues, resumability and no wall-clock cutoff. The subsequent October21 direction puts all longest/least-predictable work on HIL so BLD can finish and shut down. This supersedes the initial 60/56 host split and the October8 HIL-only default.
- **Publication:** `origin/main`; planning branch `codex/phase10-two-host-growth`, based on `8e008644085f075922cfccd8a296b0dd248beb60`.
- **Immediate deliverable:** HIL freshly recovers the preserved BLD collection and completes the registered matched-cohort comparisons; observe HIL's current queue before further dispatch. BLD's finite run/preservation slice is complete. Solo scientific research; hostile actors excluded.

## Goal

Determine how preparation history, facet attachment and vapor transport establish and sustain
growth patterns in the implemented model. Warm hollow-growth memory is the leading case; opposing
facet responses, cold core/tip structure and longer warming histories provide distinct questions.
Use the [October 21 findings](../../evidence/hil-results-review-2026-10-21/README.md) to spend compute
on unresolved contrasts, numerical qualification and predictions. The objective is informative
positive, negative or unresolved results, not an occupied-core count or a new physical claim.

## Done when

The charter's broader Phase 10 endpoint remains, verbatim:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

This planning deliverable is complete when both host allocations, all 116 new operands, reused
controls, queue order, scientific endpoints, readouts, continuation decisions, operational limits,
cost uncertainty and implementation gaps are explicit. It does not close Phase 10 or start Phase 11.
Execution is complete only when every dispatched row has an independently checked terminal or
unresolved disposition, its matched comparison is recorded, and retained output has verified NAS
recovery. A launch or a producer's success flag is insufficient.

## Approach and allocation

Run four connected studies through existing scientific seams. HIL starts the expensive representation
and larger-history work; BLD runs the shorter discriminators. Refill free workers from one queue per host. Keep new
matched groups together. Analyze completed groups while other rows continue. Follow-ups below are
finite reserves requiring a written selection before launch, not an automatic Cartesian expansion.

| Host | Maximum simultaneous workers | Base new runs | Work |
|---|---:|---:|---|
| HIL | 20 | 24 | All long/uncertain work: 4 fine warm timestep, 8 cold representation, 12 larger pressure/history |
| BLD | 32 | 92 | Fixed shorter queue: 50 coarse warm history/width/transport, 36 facet qualification, 2 facet and 4 cold numerical sentinels |
| Total | 52 | 116 | Plus two reused warm operands and other named historical controls; no full-run repeats merely for utilization |

These are worker allocations. HIL's retained hardware record is a Core Ultra 9 285K with 24 cores/
24 logical processors and about 64 GB RAM; BLD's October 8 receipt is a Ryzen 9 5900XT with 16 physical/
32 logical processors and `totalMemoryBytes=68602580992`. Current BLD availability must be observed
locally. SMT and shared memory/cache contention mean 32 workers do not imply 32 physical-core
throughput. Aim for 20/32 while ready work and memory permit; do not invent useless rows to keep
the final tail full. The expensive rows can last weeks and all belong to HIL. BLD receives no
new work after its fixed queue unless the maker requests it. Smaller N64 cases can still surprise;
the allocation aims to let BLD finish first, without promising a shutdown date.

## Common scientific contract

Unless a block overrides it, use N64 cubic allocation, `dxUm=.35`, seed radius 2/thickness 1,
pressure 101325 Pa, noise 0, PRNG seed 1, `aggregate-hv-g1h1-v6`, monopole-matched `hexPrism`, residual
tolerance 1e-9, divergence tolerance 1e-7 and at most 200000 relaxation sweeps. Preserve the existing
Robin/fill operator, geometry completion, field initialization, monopole lag and ledger semantics.
Use `sigmaInfinity = phase6SigmaWaterFromTable(tempC) * fraction` without rounded substitutes.
`fraction` is this table-relative forcing fraction, not relative humidity or surface supersaturation.

The largest lattice-coordinate extent includes occupied end cells; center span is
`(extent - 1) * dxUm`. Target 29 at .35 and target 57 at .175 both mean 9.8 um center span.
Target 57 at .35 means 19.6 um. These are largest coordinate spans, not a Cartesian diameter.
Ordinary M1/no-dip and the separately identified facet/width experiments remain distinct.
Every row carries its own exact full scientific specification and experimental identity.

Events record every completed update. Warm coarse field crossings are 5,9,13,17,21,25;
warm fine 9,17,25,33,41,49. Facet/cold coarse crossings are odd 5 through 27; cold fine 9,13,...,53.
History crossings are odd 5 through 55. A field crossing is the first actual extent at or beyond
the request, sampled after converged relaxation before the next surface update; save actual
extent/time. Do not call a crossed threshold an exact geometry. Attachment events support
intervening geometry reconstruction. At a history trigger the next field is already in the
destination environment; it is not a pre-switch field.

Every production row uses `discovery-resume-v1`: initial state and each completed update,
current and previous verified generations, event/snapshot prefix and schedule cursor.
Neither `maxWallSeconds` nor queue `hardWallSeconds` is set. A size endpoint, step-cap, contact,
nonconvergence, resource pause or integrity failure retains its actual meaning. Step-cap/contact
or unavailable comparison coverage is unresolved, never evidence of no effect. No target or
scientific control may be changed inside a resume. Any larger successor gets a new registered row.

Facet arms throughout this plan use M1 base plus explicit `experimentalFacetDips`, ordered
`neither`, `basal-only`, `prism-only`, `both`. Existing .05/.025 controls are reused as below.

## HIL roster — 24 long or uncertain rows

### W4: fine warm timestep challenge — 4 new, expensive

Temperature-4.5, fraction .075, CFL .025, N126/.175 um, seed radius 4, thickness{1,3}, arms{broad,
early 20-w 6}; target 57, max 100000. IDs: `gd21-hil-w4-h{1|3}-{broad|early20-w6}`.
Compare each to the exact corresponding completed CFL .05 `warm-refine-fine-thin-*` or
`warm-refine-fine-thick-*`, and compare the new coarse/fine .025 groups separately.

N64/.35 and N126/.175 share shell-coordinate half-length 10.85 um, seed radius .7 um and target
center span 9.8 um. Fine seed thicknesses.175/.525 um bracket coarse.35 um; they do not match
voxelized shape/volume or bound nonlinear outcomes. Two spacings do not establish convergence.

### C1: cold representation — 8 new, expensive

Temperature-14.4, fraction .10, N126/.175, seed radius 4/thickness{1,3}, all 4 explicit facet arms,
CFL .025, target 57, max 100000. IDs `gd21-hil-c1-h{1|3}-{arm}`. Compare to the existing N64/.35,
radius 2/thickness 1, same-temperature/fraction/CFL quartet. Match physical stage and distance;
the seed-thickness caveat in W4 applies. Earlier N96/.35 results examine domain size and do not
qualify fine-grid domain independence. Cold mature N126 cost is unmeasured.

### H1: longer pressure/history — 12 new

For each pressure{50662.5,101325,202650} Pa, run these four M1 rows:

- `switch7`: -14.4 C to -6 C at completed largest-extent trigger 7.
- `switch15`: the same change at largest extent 15.
- `source`: static -14.4 C.
- `destination`: static -6 C.

All use fraction .20 at each environment, N96/.35, seed 2/1, CFL .025, target 57 =19.6 um center
span, max 100000. IDs `gd21-hil-h1-p{50662p5|101325|202650}-{switch7|switch15|source|destination}`.
For histories the full post-event environment uses the -6 C table value times.20; pressure stays
fixed. ADR0011 density-conserving event semantics and ADR0060 schedule resume apply. No facet/
width option is combined with these events.

These are new larger-domain/larger-target runs from the registered seed, not edited continuations
of old N64 checkpoints. Target 57 is nominally below the N96 contact condition `extent > .65*96`
(first integer 63); a growth-step overshoot can still cause contact, evaluated before size success.
Larger target does not guarantee a specified physical duration or domain adequacy. New matched
statics are necessary; older smaller-domain source histories are contextual comparisons only.

## BLD roster — 92 shorter rows

### W1: preparation duration and timestep — 30 new, 2 reused

Cross temperature{-4.5,-5 C}, fill CFL{.05,.025}, and these eight arms:

1. `broad`: ordinary `M1_NO_DIP_ABLATION`, no width/history option.
2. `full-w3`: M1 base, width threshold 3, full history.
3. `late20-w3`: M1 base, width 3, late-only cutoff 20 s.
4. `early1-w3`.
5. `early5-w3`.
6. `early10-w3`.
7. `early20-w3`.
8. `early40-w3`.

Early arms use early-only with the indicated cutoff in physical seconds. All have fraction .075,
target 29 and max 100000 updates. The width intervention uses no-dip prism kinetics. Under ADR0059
the mode is fixed through a coupled update: a crossing update finishes under its old mode and
the next relaxation changes it. Record actual switch brackets and exposure, not just nominal time.
The new 1/5/10/40 s values are registered here; historical twenty-second protocols remain frozen.

Reuse `warm-refine-coarse-t4p5-broad` and `warm-refine-coarse-t4p5-early` for the -4.5/.05 broad
and early 20 operands. W1 has 32 scientific operands but 30 newly launched rows. Do not reuse on
label alone: bind full row configuration, retained input hashes and unchanged numerical paths.

IDs: `gd21-bld-w1-t{4p5|5}-c{05|025}-{arm}`, excluding those two reused operands. Arm ordering
above and ordered sets printed here define a unique roster; broad has no fictitious width setting.

Question: how much early preparation is sufficient for advancing open growth, and does that
conclusion survive timestep reduction? Full/early/late/broad distinguish duration from continued
application. A late-only null with little selected demand is weak exposure. If the 40 s switch
leaves insufficient post-switch development before target 29, report unresolved coverage.

### W2: width selection — 12 new

Temperature{-4.5,-5}, CFL .025, width{2,4}, arms{full,early 5,early 20}; fraction .075, target 29,
max 100000. All are M1-base width experiments. Reuse W1 width 3 and broad at the same temperature/
CFL as controls. IDs: `gd21-bld-w2-t{4p5|5}-w{2|4}-{full|early5|early20}`.
This tests the discrete geometric selection rule; threshold times spacing is an inclusive chord
scale, not a measured molecular width law or proof that only a rim was changed.

### W3: transport and forcing boundaries — 8 new

Temperature-4.5, CFL .025, target 29, max 100000; each condition has matched `broad` and `early20-w3`:

| Condition tag | Pressure (Pa) | Fraction |
|---|---:|---:|
| pHalf | 50662.5 | .075 |
| pDouble | 202650 | .075 |
| fLow | 101325 | .05 |
| fHigh | 101325 | .10 |

IDs: `gd21-bld-w3-{condition}-{broad|early20-w3}`. W1 supplies normal-pressure/.075 controls.
Vary pressure or forcing separately. Pressure uses the existing inverse-pressure diffusivity
closure; this is a model transport contrast, not a new atmospheric-pressure validation.

### F0 and C0: numerical sentinels — 6 new

- F0: temperature-9.5, fraction .15, seed 3/1, explicit facet arms{basal-only,neither}, CFL .0125,
  target 29, max 20000. IDs `gd21-bld-f0-{arm}`. Resolve the observed occupancy sign reversal
  between .05 and .025 without relying on agreement of axial spans.
- C0: temperature-20, fraction .15, seed 2/1, all four explicit facet arms, CFL .0125,
  target 29, max 20000. IDs `gd21-bld-c0-{arm}`. Test the tip 9 feature that differs between .05
  and .025, retaining tip 8 as a separate observation.

### F1–F3: qualify facet balance over shape, temperature and forcing — 36 new

All N64/.35, pressure 101325, CFL .025, target 29, max 20000; no environment event.

| Block | Exact Cartesian operands | New rows | IDs |
|---|---|---:|---|
| F1 tall completion | T{-6.5,-9.5}, fraction .15, seed 1/5, arms{basal-only,prism-only} | 4 | `gd21-bld-f1-t{6p5|9p5}-{arm}` |
| F2 midpoint qualification | T{-7.5,-8.5}, fraction .15, seeds{3/1,1/5}, all 4 arms | 16 | `gd21-bld-f2-t{7p5|8p5}-r{3|1}-h{1|5}-{arm}` |
| F3 forcing qualification | T{-6.5,-9.5}, fractions{.10,.20}, seed 3/1, all 4 arms | 16 | `gd21-bld-f3-t{6p5|9p5}-f{10|20}-{arm}` |

F2's seed set is two pairs, not an independent radius/thickness cross. F1 reuses completed .025
both/neither tall rows to complete the four-arm decomposition. F2/F3 qualify existing .05
observations, not a new blind temperature sweep. Test whether opposing facet contributions,
catch-up and forcing response survive the smaller timestep. A seed comparison changes initial
volume and shape together; do not call it an isolated aspect-ratio or width mechanism.

## Queue order and keeping useful work moving

Use the listed nested-set order unless overridden below; round-robin matched groups within a
priority band so all controls start early. One coordinator per host owns the aggregate ceiling.

**HIL initial 20:** all four W4 and eight C1 fine-grid rows, then all four H1 rows at half
pressure 50662.5 Pa and all four at normal pressure 101325 Pa, following the printed pressure order.
Queue the four H1 double-pressure rows next; no measured pressure-cost ranking is assumed.
These totals are 20 initially plus 4 queued. All twelve fine-grid cases start first; N96 histories
fill the remaining slots and their own replacements. Do not postpone long work until BLD finishes.
A freed slot takes the next pending row immediately.

**BLD initial 32:** F0's two, C0's four, all sixteen W1/.025 rows, all four F1, and six new
W1 -4.5/.05 rows (the broad/early20 operands are reused, not relaunched). Then queue eight
W1 -5/.05 rows, twelve W2, eight W3, sixteen F2, and sixteen F3. These totals are 32 initially
plus 60 queued. Every new matched pair/quartet stays on one host; field/geometry comparisons
between coarse and fine groups can be completed later on HIL from preserved BLD output.

Review at completed matched blocks, not at a fixed day. Keep the other independent groups running.
At HIL queue exhaustion, select a justified reserve below or finish the tail. At BLD queue
exhaustion, perform the completion handoff below; reserve selection must not keep BLD running.
Pending, never-started complete matched groups may move from BLD to HIL through a committed
allocation amendment if costs warrant it. Moving long work back to BLD requires new maker
direction. Already-started checkpoints stay on their host; never silently transfer or duplicate them.

### BLD completion and shutdown handoff

BLD does not depend on HIL finishing, a cross-host final report, or reserve selection. Once its
92 rows have checked terminal dispositions (with scientific failures/coverage gaps explicit),
stop its coordinator after confirming no workers or output writers remain. An interrupted
unfinished row is not a completed result; resume locally or record an intentional unresolved
pause, preserving its checkpoint and exact future resume command.

Publish the stable BLD output under its registered external-evidence collection, with the
existing NAS lifecycle, hashes, recovery receipt and committed bindings. Verify a fresh restore
on HIL covering the BLD bytes needed for continuing analysis and restart records; retain BLD's
local originals. HIL can then analyze completed data while its long runs continue. BLD can be
turned off after this handoff, without waiting for final scientific interpretation. Do not add
new BLD rows or an automatic power-off action. Worktree closure and pruning remain separate.

## Reused evidence and comparison bindings

Primary retained root is `out/hil-retired-2026-10-21/<campaign>/out/<campaign>/rows/`, except
warm uses `hil-warm-refinement/out/warm-refinement-hil/rows/`. NAS collection
`hil-exploration-results@2026-10-21` and its [verified recovery](hil-results-preservation-oct21.md)
preserve the bytes. Restore explicitly on BLD only the inputs it needs; bind old producer IDs
and hashes separately from the new producer. Existing controls are evidence inputs, never
checkpoints to resume under the new source. A comparison across hosts is not automatically a
bitwise cross-engine claim.

| New block | Existing row identities / input record |
|---|---|
| W1/W4 | `warm-refine-{coarse|fine-thin|fine-thick}-t4p5-{broad|early}`; [warm inputs](../../evidence/hil-results-review-2026-10-21/warm/inputs.json) |
| F0 | `oct19-hil-facet-step-t9p5-f0p15-r3-h1-cfl0p025-basal-only` and `oct19-hil-seed-step-t9p5-f0p15-r3-h1-cfl0p025-neither`; [facet readout](../../evidence/hil-results-review-2026-10-21/facet/README.md) binds .05 too |
| F1 | `oct11-hil-seed-t{6p5|9p5}-f0p15-r1-h5-{basal-only|prism-only}`; .025 both/neither in `oct19-hil-seed-step-t{6p5|9p5}-f0p15-r1-h5-cfl0p025-{both|neither}` |
| F2 | `oct12-hil-seed-t{7p5|8p5}-f0p15-r{3|1}-h{1|5}-{arm}` |
| F3 | `oct12-hil-seed-t{6p5|9p5}-f{0p1|0p2}-r3-h1-{arm}` |
| C1 | `oct11-hil-cold-step-t14p4-f0p1-cfl0p025-{arm}` |
| C0 | `oct11-hil-cold-t20-f0p15-{arm}` (.05) and `oct12-hil-cold-step-t20-f0p15-cfl0p025-{arm}` |
| H1 | Exact-condition old N64 histories/statics in [history-pressure inputs/readout](../../evidence/hil-results-review-2026-10-21/history-pressure/README.md); new N96 source and destination statics are the actual matched controls |

The implementation expands every set to one explicit row list and validates 116 unique IDs,
24 HIL/92 BLD, all two-arm/four-arm groups and exact numerical operands. Bind reused controls
once, with a source-path/configuration comparison. If numerical compatibility is absent, record
the missing comparison and amend the roster before adding a fresh control; do not treat matching
labels as evidence. Counts above exclude historical controls and all conditional reserves.

## Readouts, expected effects and decisions

The row producer is `runPostPhase10DiscoveryRow`; the implemented endpoint checker is
`summarizeFirstBatchRow`, invoked by the summary/readout path. The earlier `checkFirstBatchRow`
name was a stale plan reference, not a separate executed checker.
They supply events, row specification, convergence/ledger/CFL/symmetry records, complete-cycle
restart and sampled fields. Existing October 21 analysis CLIs hardcode historical row selectors;
passing a new root alone does not analyze this campaign. Reuse their reconstruction/window
definitions through a small new campaign selector/comparison recipe, and exercise that selection
on retained inputs before production. Proposed entry: `runner/src/growth-dynamics-oct21-readout.ts`;
its CLI and executable checks are pending, not advertised as working commands.

Read completed, hash-bound row bytes. Each report records input paths/hashes, producer/runtime,
initial geometry, actual terminal reason, missing members, selection brackets, units and exact
recipe command. Separate common-size and common-age results. No interpolation of discrete
occupancy and no extrapolation beyond a trajectory. Use adjacent-event alternatives to expose
stage ambiguity. Report measured continuous values rather than inventing a universal pass score.

| Block | Required readout and prior expectation | What changes the next decision |
|---|---|---|
| W1/W2 | Track original open intervals, newly opened post-switch intervals, tip advance after actual switch, maximum open-envelope depth, added full-probe waist, added axial/lateral spans; selected basal demand before/after. Compare common sizes and common ages within each matched group. Expect preparation duration/width to change establishment; monotonicity is not assumed. | Persistent opening with advancing tips after selection ends supports state-history feedback. A timestep-dependent conclusion prioritizes numerical qualification. Little selected demand or no post-switch coverage is unresolved exposure, not a null mechanism. |
| W3 | Same warm readout, one pressure/forcing contrast at a time with matched broad controls. | Persistence across contrasts strengthens the scoped lead; suppression/reversal locates a boundary to predict in a held-back reserve. It does not establish pressure universality. |
| W4 | Same-size 9.8 um, common-age and post-switch readouts against the old .05 representation and new coarse .025. | Agreement strengthens tested representation/timestep robustness; disagreement prevents a continuum/physical interpretation and directs the next numerical question. |
| F0 | Initial-seed-subtracted axial/lateral additions and occupied sites, basal-minus-neither only, across its three CFLs. Retain the old 12.374393154152461–16.499190872203283 s window only if covered, alongside a separately recomputed common window. | Resolve occupancy/catch-up sensitivity without claiming the absent prism/both contrasts. |
| F1–F3 | Initial-seed-subtracted axial/lateral additions and occupied sites separately; basal/prism/both minus neither and combined-minus-sum at common ages and quarters within complete quartets. | Opposing axial effects may persist while occupancy/catch-up changes. A sign reversal or adjacent-event ambiguity is a scoped sensitivity, not a habit flip. Constant combined-minus-sum at one endpoint is not a general additive law. |
| C0/C1 | Core/tip gaps and rings from reconstructed events: coarse tips 8/9 versus fine 16/18, plateau fractions 0/.25/.5/.75, physical distances and separately common physical ages. | Persistence in both fine thicknesses strengthens representation robustness; cell-fixed gaps, disappearance or thickness dependence localizes the weakness. C0 tests tip 9 explicitly; agreement at tip 8 alone is insufficient. |
| H1 | Verify source prefixes through each trigger. Compare added axial/lateral growth and occupancy during D0=7.547248938077988 s and D0..2D0 where covered, plus newly common full duration/halves/quarters. Name source-static full-window coverage per pressure. | Persistence, catch-up or reversal distinguishes lasting versus transient preparation effects. Missing full windows remain missing. Fresh-seed statics cannot isolate inherited geometry from vapor/fill/other state. |

Warm original intervals and signed plane/side records are not independent crystals or cavities.
The width predicate can select most basal demand; an advancing opening is not proof of rim-only
attachment. All effects are implementation-level findings in one coupled model family. New ice
physics would additionally require novelty assessment and compatible independent physical data.

### Frozen comparison cohorts and time windows

For each cohort below, let `Tcommon` be the minimum terminal physical age over **every named
member**. Evaluate states at fractions{.25,.5,.75,1} of `Tcommon`, and increments over adjacent
quarters and each half. Preserve at-or-before and next-event alternatives; do not silently shrink
a cohort when a member is missing/invalid. Its primary comparison is then unavailable. Pair-specific
secondary windows are labeled separately and cannot support a cross-cohort contrast.

- W1: one 16-member cohort per temperature, all eight arms at both CFLs, including reused rows.
  Each early arm also has a matched broad secondary post-switch window at the same temperature/
  CFL: start at that intervention's actual switch age and end at the smaller of their terminal
  ages. Nonpositive duration or no observed switch is unavailable. Both trajectories use those
  same absolute ages. Selection/demand and opening persistence are reported even when a contrast
  is unavailable; no binary physical threshold is inferred from one voxel.
- W2: one 10-member cohort per temperature at .025: broad plus widths 2/3/4 crossed with
  full/early 5/early 20. W3: one four-member cohort per changed condition, its two arms and the two
  W1/.025 normal-pressure/.075 reference arms. Cross-temperature or cross-W3-condition contrasts
  require a separately reported union-cohort minimum, never subtraction at different common ages.
- W4: a 12-member cohort: three representations (coarse, fine-thin, fine-thick), two arms,
  two CFLs. Same-representation four-member and same-CFL six-member secondary comparisons are
  labeled. Same-size results separately use exact 9.8 um when available, otherwise actual bracketing
  states/overshoot; do not relabel a crossed target as exact size.
- F0: all six basal/neither rows at .05/.025/.0125. F1: one eight-member cohort per temperature,
  tall seed, all four arms at .05/.025. F2: one eight-member cohort per temperature/seed pair;
  F3: one eight-member cohort per temperature/forcing pair. Cross-temperature/shape/forcing
  conclusions use the union of the compared cohorts to set a shared age. The fixed F0 window
  remains a distinct requested window with explicit coverage, not the new common denominator.
- C0: twelve members, four arms at three CFLs. C1: separate eight-member cohorts for each fine
  thickness, the four fine arms plus four coarse .025 arms; a cross-thickness statement uses their
  twelve-member union. At each registered central-plane radial tip (coarse 8/9, fine 16/18), use
  existing event reconstruction to identify the first exact-tip plateau and its exit. Let `Dtip`
  be the shortest positive plateau duration in the full cohort. Sample each row at its own
  plateau entry plus{0,.25,.5,.75} times `Dtip`, with adjacent-event alternatives. Missing exact
  tip, skipped plateau, absent exit or nonpositive duration makes that cohort/stage unavailable.
  This aligns physical tip radius, not equal plateau age or equal radial increment: a fine cell
  is half as wide. Convert core/tip/gap distances to micrometres before cross-spacing contrasts;
  report integer ring counts and their cell-size-dependent meaning separately. Common absolute-age
  observations use the cohort's `Tcommon` and remain distinct from tip-aligned observations.
- H1: `Dnew` is the minimum terminal-minus-actual-event age across **all six new histories**
  (three pressures, two triggers). Evaluate full, halves and four quarters of this shared duration
  relative to each actual event. Also request [0,D0] and [D0,2D0] relative to that event, with
  D0 fixed above. Source-static references use the history's absolute event age as origin;
  destination-static contextual references start at fresh-seed age 0. Neither static sets `Dnew`.
  Check each requested window against its complete saved coverage before calling existing window
  calculations; unavailable windows are not clamped. The source prefix check is through the
  completed trigger cycle. These controls retain the existing geometry/history interpretation limit.

## Finite conditional reserve — at most 22 additional rows

These are options selected after base readout, not queued now. Write the chosen exact rows,
prediction and comparison inputs into this plan before inspecting their outcomes. Reuse the
base producer if the numerical contract is unchanged; a new batch identity holds the selected
roster. All reserves run on HIL so BLD's completion remains final for this allocation.
No automatic expansion solely because workers become idle.

| Reserve | Owner / maximum | Selection and exact candidates |
|---|---|---|
| R1 timestep | HIL /2 | If W1 .05/.025 changes the persistence conclusion at-4.5, run N64/.35, fraction .075, broad and early 20-w 3, CFL .0125, target 29/max 100000. |
| R2 duration boundary | HIL /4 | After timestep-qualified W1, select at most two early-only cutoffs per temperature from{2.5,7.5,15,30}s, strictly between adjacent tested{1,5,10,20,40}s with contrasting outcomes. Width 3/CFL .025/fraction .075/N64/target 29/max 100000. Record a prediction before execution; do not assume a monotone boundary. |
| R3 seed robustness | HIL /8 | If a W1 early cutoff yields qualified persistence, take that one cutoff per temperature{-4.5,-5} with broad controls for seeds{2/3,3/1}, width 3/CFL .025/fraction .075/N64/target 29/max 100000. One selected cutoff per temperature; shape and volume change together. |
| R4 fine width | HIL /4 | If W2 width 2/3/4 changes early 20 persistence and W4 supports the .025 numerical comparison, add -4.5 fine-thin/fine-thick early 20 at widths 4 and 8, CFL .025/fraction .075/N126/.175/target 57/max 100000. W4 supplies width 6 and broad controls. This is explicitly expensive. |
| R5 facet numerical follow-up | HIL /4 | If F2 -8.5 wide-seed axial/catch-up interpretation changes from .05 to .025, run its same four-arm group at .0125, fraction .15/N64/.35/seed 3/1/target 29/max 20000. |

If all 22 are selected, the finite envelope is 138 new runs: HIL 46 and BLD 92. Selection can also be
zero. Other follow-ups require a plan amendment; no blanket permission for an endless sweep.
A controlled shared-state branch could be more discriminating than more parameter rows, but
requires an explicit state-intervention contract and governing amendment. It is outside this queue.
If a reserve needs new source rather than an already implemented immutable row-selection interface,
use a new producer checkout/batch; never modify the producer of still-running base rows.

## Costs, memory and storage — observations, not forecasts

The following values were read from retained `rows/<id>/result.json` on October 21. `wallSeconds`
is accumulated active per-row elapsed time, including contention, not processor CPU time or
calendar duration across pauses. New CFL, domain and 20/32 concurrency make these non-transferable
as forecasts. Halving CFL is not guaranteed to double time. No fresh speed ladder is required.

| Predecessors | Observed active wall hours | Maximum recorded RSS |
|---|---|---:|
| Warm coarse broad / early | 1.331 /2.310 | 313856000 B |
| Warm fine thin / thick broad | 149.550 /159.492 | 515182592 B |
| Warm fine thin / thick early | 224.422 /228.948 | 605999104 B |
| Existing N96 cold-domain quartet | 5.947–17.636 per row | 394309632 B |
| Existing Oct 19 facet/pressure 12 | 1.419–4.114 per row;31.529 summed | 328298496 B |

Warm exact active seconds are 4791.678/8314.843 coarse,538380.159/574171.880 fine broad and
807919.491/824212.831 fine early, from the six named warm IDs above. Other sets are the four
`oct19-hil-cold-domain-*` results and all twelve `hil-facet-pressure-oct19` results. Thus existing
fine rows consumed roughly 6–10 active days each; W4 at smaller CFL can take substantially longer.
C1 N126 cold and H1 N96/target 57 have no mature cost measurement. Start them with that uncertainty
visible. Report observed progress without extrapolating a three-cycle prefix to whole-run completion.

HIL's old N64 prefix ladder completed 20 workers with minimum available RAM53912084480 B.
BLD's old production used 16 with minimum 48468979712 B; its 28-worker probe failed a 180-second
speed watchdog while RAM was ample. Those records do not impose 16 as a hardware ceiling or
qualify mature 32-worker performance. Sources: `evidence/new-host-readiness-2026-10-07/capacity/
ladder-2026-10-07T23-31-24-977Z/result.json` and `evidence/bld-first-batch-2026-10-08/`.

Existing sampled guard floors remain 12 GiB available RAM and 8 GiB commit headroom. The current
monitor stops its coordinator's children on violation; it does not dynamically lower concurrency.
Record a direct CPU/RAM/runtime/process/disk observation at dispatch. If paused for memory,
preserve checkpoints and record a lower operational allocation through supported routing before
resume; do not edit a scientific binding or fabricate a probe receipt. CPU utilization and
per-row speed are observations, not reasons to terminate a slow but progressing science row.

Observed terminal row directories were about 13–20 MB for N64 and 83–96 MB for fine warm N126;
each fine checkpoint generation about 34.07 MB. The whole warm output owner was 1236895495 B,
including logs/control history. Require 100 GiB free local fast disk as a conservative operational
reserve, not an estimated payload size. Observe free space during status checks. NAS is for
durable publication, not active checkpoint writes. No new disk supervisor or scheduler is needed.

## Execution implementation and exact-command handoff

### BLD implementation and launch assignment — October21

The maker authorizes BLD to proceed independently in its existing isolated worktree. Start from
the registered scientific protocol at `48a8ffb` and incorporate this instruction record. HIL's
new HIL-prefixed entry is not a BLD executable; BLD must implement its own thin named roster
and explicit-budget entry using the existing discovery queue and complete-cycle runner. Do not
wait for HIL's simulations or an additional shared executable. If BLD has already started science,
keep its tested execution producer/runtime fixed and report that fact instead of rebuilding it.

Execute exactly the 92 BLD base rows and queue order registered above: W1 30, W2 12, W3 8,
F0 2, C0 4, and F1-F3 36. Do not dispatch HIL's W4/C1/H1 or any conditional reserve. Use at most
32 simultaneous independent workers with automatic queue refill, complete-cycle checkpoints and
no production wall deadline. Retain all registered finite scientific targets, step caps,
convergence and contact classifications. A slow row is not a reason to terminate it.

Before launch, verify exact roster/operands, host routing, observation/readout selection and
recovery routing under this plan's verification scope; commit the tested producer. Make one
current resource/process/runtime/disk observation, using Node24.13.1, locked dependencies and
the existing memory floors. Reuse applicable unchanged restart witnesses; do not repeat a
capacity or restart ladder without a changed contract. The existing plan specifies the minimum
readout exercise and source/runtime limits. No solver/codec change is needed for this assignment.

Then launch BLD's queue and retain its exact cwd, producer, command, actual worker count,
stdout/stderr/exit files and initial/advancing checkpoint observations. Record the exact resume
command and push the implementation, verification and progress records. Bulk output stays out
of Git/GitHub. HIL will compare numerical source identity and registered scientific operands when
integrating the independently produced results; matching wrapper commits is not required.

After BLD's finite queue finishes, check terminal/unresolved dispositions, publish retained
output through the NAS lifecycle and verify fresh recovery for HIL's analysis. Retain the local
originals until separately authorized pruning. BLD may then shut down without waiting for HIL;
all longest cases and conditional follow-ups belong to HIL. Do not claim launch readiness from
this instruction document alone: the BLD executable and actual dispatch receipt are its deliverables.

### Independent HIL execution slice — October21

The maker reports BLD is working from `48a8ffb` in its own worktree and directs HIL to start
without waiting for that unpublished work. HIL therefore implements its unchanged 24-row roster
in `hil-growth-dynamics-oct21-roster.ts` and `hil-growth-dynamics-oct21-main.ts`. BLD's 92-row
implementation remains owned by BLD. This supersedes the shared-entry dependency below: the
hosts need matching registered scientific operands and unchanged numerical code, not the same
new wrapper file or Git commit. Each host still pins its own tested producer for exact resume.
Do not change or restart a running BLD producer merely to unify wrappers.

One deliverable is HIL's 24-row queue running and checkpointing: 20 initial workers and four
queued history rows, with the frozen W4/C1/H1 order. Reuse the existing queue and complete-cycle
runner. Add only the explicit worker ceiling/attempt-count separation needed to resume at fewer
workers after a resource stop; preserve historical callers. The small HIL readout selector must
demonstrate retained-input reconstruction before dispatch; complete cohort comparisons remain
pending the new rows and BLD handoff. No solver, codec or scientific definition changes.

The concrete launch/resume interface is now the HIL-prefixed entry above with the same arguments
as the proposed shared entry below. Record its exact tested command before launch. Verification
is exact roster/host/routing tests, readout-selection tests, one exact `npm test` at the stable
checkpoint, and the existing restart witnesses where continuation code is unchanged. The
known failures remain wrong control/host selection and omitted observations (Rule6 and lessons
C3/C6/E1/E5); nearest-boundary tests cover the new selection, while interpretation still needs
judgment. Solo scientific research remains the scope; hostile actors are excluded. No new
scheduler, capacity ladder, restart format or assurance layer is needed.

Existing `launchDiscoveryRows` accepts heterogeneous rows and any positive worker count;
`DiscoveryBatchDefinition` already understands HIL/BLD. `hil-operational-batch-main.ts` provides
the explicit-budget lease/resume/monitor path but is HIL-specific. Implement a thin two-host
entry using those APIs, preserving old callers. Do not route this campaign through the old
probe-required launch path or mint a fake capacity receipt. No solver or codec change is planned.
N126 is within the existing 126^3-cell/64 MiB resume limits; do not silently choose N128.

Keep the registered host ceiling immutable, with actual requested concurrency recorded per
attempt. The new entry must accept an optional positive `--workers` no greater than that ceiling
for resource-recovery launch/resume, defaulting to 20/32. Existing HIL wrappers bind their fixed
requested count; preserve those callers. This small operational argument must not alter the
scientific roster, producer/runtime/host binding or row checkpoints. No adaptive scheduler is added.

Proposed files: `runner/src/growth-dynamics-oct21-roster.ts`,
`runner/src/growth-dynamics-oct21-main.ts`, and the small readout selector above. Proposed commands
below are a required implementation interface, **not yet executable launch instructions**:

```text
node runner/src/growth-dynamics-oct21-main.ts list HIL
node runner/src/growth-dynamics-oct21-main.ts launch HIL out/growth-dynamics-oct21-hil
node runner/src/growth-dynamics-oct21-main.ts resume HIL out/growth-dynamics-oct21-hil
node runner/src/growth-dynamics-oct21-main.ts list BLD
node runner/src/growth-dynamics-oct21-main.ts launch BLD out/growth-dynamics-oct21-bld
node runner/src/growth-dynamics-oct21-main.ts resume BLD out/growth-dynamics-oct21-bld
node runner/src/growth-dynamics-oct21-main.ts summarize <campaign-directory>
```

For example, a resource-paused HIL campaign may resume with the same command plus `--workers 12`
after its operational allocation is recorded. This option is also pending implementation.

Before dispatch, replace pending interface status with the tested producer commit, exact working
directory/command, actual worker count, stdout/stderr/exit receipt paths and readout command.
Use hidden `Start-Process -WindowStyle Hidden` helpers, fresh labeled logs and a single writer
lease. HIL develops/tests/publishes the common producer. BLD fetches/checks out that exact commit,
uses the `.nvmrc` runtime and locked dependencies, performs its local resource observation and
launches only its named rows. No remote access to BLD is assumed and no chat message is sent here.

Each execution checkout remains at its committed producer and Node/V8 versions for the queue.
Analyze/update progress from a separate task checkout if needed. ADR0060 resume is **same host,
same producer and same runtime**; no HIL-to-BLD checkpoint migration. After Windows restart,
first check for existing writers, then invoke that host's exact recorded resume command. It skips
independently checked completed rows and continues unfinished rows from the last valid complete
generation. An interrupted elliptic solve repeats from its preceding complete update; no four-hour
limit or automatic retry of scientific nonconvergence is introduced.

Reuse the existing [actual restart witnesses](../../evidence/discovery-resume-2026-10-07/verification.json)
and N126 witness in the [warm plan](hil-warm-refinement.md) when the scientific contract is unchanged.
Exercise changed host dispatch/recovery routing with a bounded process fixture. Repeat scientific
restart qualification only if the continuation contract changes, not because another row is slow.
If new runtime compatibility is needed, qualify it explicitly rather than ignore binding refusal.

## Verification and publication

Plan-only checks: Rule 7, progress-index, diff and local link/operand/count checks. No solver suite
is justified for this prose change. Implementation checks must cover exact row operands/counts,
host separation, unique IDs, no production wall deadline, grouped queue order, recovery selection
and the newly adapted readout's independent calculations. Because the intended implementation
includes executable scientific readout, exact `npm test` is required once at its stable checkpoint;
focused development checks do not substitute. An orchestration-only slice uses the smaller Rule 6
tier if it truly leaves scientific calculation/readout unchanged. A green suite is not a gate.

One bounded review after interfaces/checks stabilize checks claim-changing errors and missing
scientific coverage. No new registry, reviewer-of-reviewer or hostile-runtime verifier. The plausible
in-scope failures are wrong host/control selection, omitted observations and mistaken terminal/
resume handling. Existing queue/codec checks cover state integrity; row and readout checks at
the nearest boundary cover new selection. That is the smallest useful assurance investment.

New bulk output belongs to provisional external-evidence collections
`hil-growth-dynamics@2026-10-21-v1` and `bld-growth-dynamics@2026-10-21-v1`, not Git/GitHub.
Before publication follow [local-assets](../local-assets.md) and ADR0051/0061: owner manifest,
stable inventory, copy-first absent immutable placement, hashes, receipt, committed catalogue/
recovery bindings and successful fresh-stage verification. Resolve the NAS mount, never assume
the same drive letter on BLD. Never label a mutating live-root copy a complete backup.
Completed immutable subsets may get separate versions with exact coverage; later versions do not
overwrite them. Track concise comparisons, scripts, manifests and hashes. Keep local originals;
last-copy pruning is a separate decision. Do not close output-owning execution worktrees before
verified NAS recovery. Planning-only checkout produces no useful ignored science payload.

## Source currency and provenance

On 2026-10-21 checked the original arXiv version histories: [TAX2](https://arxiv.org/abs/2306.13087)
v1 (2023-06-22), [CM9](https://arxiv.org/abs/2011.02353) v1 (2020-11-04),
[CM4](https://arxiv.org/abs/1512.03389) v2 (2015-12-11),
[CM8](https://arxiv.org/abs/2009.08404) v2 (2021-08-10), and
[M1 context](https://arxiv.org/abs/1910.09067) v2 (2019-11-13).
The [author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm) lists the
2023 faceting and TAX2 papers and later 2025 teaching-lab papers; this bounded check found no
new listed replacement for the retained inputs. It is not an exhaustive novelty search.
No new external parameter or measured width law is adopted. Preserve
[parameter provenance](../libbrecht-parameters.md): M1 functions/dips are P3; its logarithm-base
transcription and the width predicate are project choices; pressure diffusivity uses the existing
closure. Review of new physical measurements or a new law is separate work.

## Steps and current record

### BLD execution preparation — October21

BLD fetched `aa2f96b` and adopted the explicit independent implementation assignment in its
existing `codex/bld-growth-dynamics-oct21` worktree at
`G:/Code Files/snowflake/.worktrees/bld-growth-dynamics-oct21`. The registered 92-row queue is
unchanged. The vertical deliverable is that queue running with complete-cycle checkpoints;
the shortest implementation checks cover its exact roster, BLD-only routing, lower-worker
resume and saved warm/facet/cold reconstruction. Exact `npm.cmd test` is required at the stable
scientific-readout checkpoint. No simulation has launched at this preparation record.

Reuse the explicit-budget coordinator with an optional host defaulting to HIL, preserving its
old callers. The BLD entry binds its own host/ceiling/roster/producer and logs each attempt's
worker count. This addresses wrong-host dispatch and lost recovery identity at the existing
boundary; it adds no scheduler or numerical/codec change. Lessons C3/C6/E1/E5 and Rule6 apply
to row selection and subsequent interpretation; the existing resume witness remains applicable
when the numerical and continuation source comparison is unchanged. Solo scientific research;
hostile actors excluded. Full frozen-cohort comparisons remain a results-stage obligation.

Historical operands are restored from `hil-exploration-results@2026-10-21` into
`out/restores/hil-exploration-results-bld-oct21`; selected campaign archives expand under
`out/restores/bld-gd21-inputs/`. Retain those original producer identities. These are recovery
inputs, not new BLD outcomes. The default Python interpreter lacks `hashlib.file_digest`; use
`C:/Users/biao3/AppData/Local/Programs/Python/Python313/python.exe` for the existing archive
member verifier. The failed default invocation did not invalidate the verified NAS payload.

The [retained readout](../../evidence/bld-growth-dynamics-2026-10-21/readout-retained-demo.json)
reconstructs four checked endpoints and 4166 updates (two warm, one facet, one cold), preserving
original identities and explicitly leaving cohort comparisons pending. The two W1 reused
operands have exact configuration/input bindings and unchanged numerical/continuation source
paths in [reused-controls.json](../../evidence/bld-growth-dynamics-2026-10-21/reused-controls.json).
Historical recovery checked every archive member in the registered collection; its
[receipt](../../evidence/bld-growth-dynamics-2026-10-21/historical-recovery.json) names commands.

Author focused checks passed three roster/dispatch files with 16 tests and two readout files
with 12 tests, plus the root TypeScript check. The initial sandboxed process fixtures hit a
temporary-file rename permission error in both new BLD and unchanged HIL tests; the same
dispatch command passed outside that sandbox. No production guard was relaxed.
The [bounded review](../../evidence/bld-growth-dynamics-2026-10-21/review.json) by a non-author
Codex/GPT-6 reviewer with shared context found no material implementation finding. It independently
checked historical HIL binding compatibility and reconstructed the four retained endpoints;
its record states what was not executed. Exact `npm.cmd test` remains the prelaunch checkpoint.

The first exact `npm.cmd test` ran at clean producer `5e03d71` from 20:45:14 to
21:11:21 UTC on October 21 and exited 1: 245 files passed, two failed; 3069 tests passed,
three failed and 53 skipped. The [verification record](../../evidence/bld-growth-dynamics-2026-10-21/verification.json)
retains complete stdout/stderr and the command/timing. The progress index exceeded 250 lines;
its subsequent correction and evidence integrity passed18 focused tests. Rule7 passed; exact
log bytes retain diagnostic whitespace. Two existing comparison-builder tests failed
before exercising their assertions because Windows denied file/directory symlink creation.
No production or test guard was weakened. A local prelaunch hold initially requested Developer
Mode and another full check; the maker subsequently explicitly approved execution after the
recorded outcome, as documented below. No Windows setting changed. The failed full check remains
recorded, with no full-suite-green or scientific result claim.
The implementation and records remain local: automatic approval review rejected the Git push
because the maker explicitly named NAS publication/local commit rather than a remote branch
update. Separate Git push approval is pending; no remote ref was changed.

Implemented commands from this execution worktree:

```powershell
node runner/src/bld-growth-dynamics-oct21-main.ts list BLD
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-bld-growth-dynamics-oct21.ps1 -Mode launch -Workers 32
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-bld-growth-dynamics-oct21.ps1 -Mode resume -Workers 32
node runner/src/bld-growth-dynamics-oct21-main.ts summarize out/bld-growth-dynamics-oct21
node runner/src/bld-growth-dynamics-oct21-readout.ts campaign out/bld-growth-dynamics-oct21 out/bld-growth-dynamics-oct21-controls/readout-new.json
```

Launch requires an absent campaign directory and a clean committed producer. Resume requires
that same producer/runtime and checks for existing writers; only `-Workers` may be reduced within
1..32 for resource recovery. The wrapper retains separate coordinator invocation/stdout/stderr/exit
files under `out/bld-growth-dynamics-oct21-controls/`; row logs live under each row's `attempts/`.
After launch, keep this execution checkout fixed and record status from primary `main`.
NAS publication of the finished output remains under `bld-growth-dynamics@2026-10-21-v1`, followed
by fresh recovery and committed bindings before worktree closure; local originals remain.

### BLD launch — October21

The maker confirmed `S:/` as the NAS path and explicitly approved executing the run after the
reported test outcome. This supersedes the local prelaunch hold for the two unchanged gallery
symlink setup failures; the progress defect is corrected. The required exact full check was
executed, and queue/recovery/readout checks passed. No test, solver or publication guard changed,
no Windows setting changed, and no full-suite-green claim is made. The scientific protocol,
complete-cycle restart witnesses and later NAS verification obligations remain unchanged.

[Preflight](../../evidence/bld-growth-dynamics-2026-10-21/preflight.json) observed BLD's Ryzen9
5900XT/32 logical processors, Node24.13.1/V8 13.6.233.17-node.40, no existing Node workers,
45342138368 B available RAM, 67975184384 B commit headroom and 612761272320 B free local disk.
The resolver verified the marked `s:/` share. All executable source paths match the tested
`5e03d71` implementation; only records changed before producer `d7f76cb` was frozen.

The [launch receipt](../../evidence/bld-growth-dynamics-2026-10-21/launch.json) binds the exact
command, cwd, process tree and live checkpoint observations. The hidden wrapper started at
2026-10-21T21:26:01.1671046Z; wrapper25720 owns coordinator37800. At the 21:28:30 UTC observation,
32 actual workers were running, 60 rows were queued, and all32 active rows had pointer-matching
checkpoint manifests. Of those32, 28 had advanced to tick1; the receipt lists every witness.
The associated resource sample remained above the existing memory floors. This is a live
execution observation, not a completed row, scientific result or stable publication inventory.

Keep this execution worktree/branch at `d7f76cb84fdd6ba7ea0cf8f0d53708e74b09c365` and its runtime
fixed. Record later status in primary main. Coordinator stdout/stderr are under
`out/bld-growth-dynamics-oct21-controls/campaign-launch-20261021T142601525.*.log`; the wrapper
will write its separate exit file, and rows keep labeled `attempts/initial/` logs. If interrupted,
check for existing writers before the exact resume command from the execution directory:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-bld-growth-dynamics-oct21.ps1 -Mode resume -Workers 32
```

After the finite queue terminates, check all terminal/unresolved dispositions and reconstruct
retained readouts. Preserve exactly `out/bld-growth-dynamics-oct21` and
`out/bld-growth-dynamics-oct21-controls` in external-evidence collection
`bld-growth-dynamics@2026-10-21-v1`, using the existing bounded NAS transaction/archive procedure.
Exclude restored historical input duplicates, which already have immutable collection coverage.
At launch, catalogue/owner-manifest registration, publication, fresh restore/member verification
and committed recovery bindings were pending; see the October24 preservation record below.
Retain the workstation originals/worktree. HIL's fresh recovery remains a separate handoff
check. The Git remote push also still awaits its separate approval; local commits are retained.
Launch-record verification passed the existing evidence-integrity/progress checks (18 tests),
Rule7 (2843 files) and prose/JSON diff checks; original captured Windows command bytes retain
their original line endings. This does not replace the earlier full-check outcome.

### BLD finished-output preservation — October24

The [terminal readout](../../evidence/bld-growth-dynamics-2026-10-21/terminal-readout.json)
checked all 92 rows: 91 size endpoints (49/50 warm, 38/38 facet, 4/4 cold), no missing or pending
rows, and 132290 independently reconstructed updates. The one invalid row,
`gd21-bld-w3-pDouble-early20-w3`, failed boundary convergence after 505 completed updates at
extent13 and simulated age34.45725867784839 s (`sigma_b` 1e-323 versus iterate0 at cell149472).
Both retained checkpoint generations (505 and504) passed hash/codec/event-prefix checks.
No recovery or retry ran; complete W3 double-pressure comparison is unavailable. The existing
individual-row reader does not implement the complete frozen matched-cohort comparisons.

Continue the maker's original authorization to publish findings to NAS and commit when done.
One deliverable is the completed BLD output preserved on the confirmed `S:/` NAS with verified
fresh recovery and concise terminal/unresolved results. Solo scientific research; hostile actors
excluded. Keep the execution producer fixed; primary main owns these records. No rerun, numerical
fix, new comparison definition, Windows setting, Git remote update, worktree closure or pruning.

Use provisional identity `bld-growth-dynamics@2026-10-21-v1`, external evidence under ADR0061
and this plan: project-owned/public metadata, serving denied, immutable, permanent retention,
no automatic garbage collection. The actual publication date is October24; the previously named
version identity is retained. BLD's original G-drive files/prepared archive are the independent
`bld-workstation-g` storage domain; no same-NAS copy or local restore counts as another domain.

Adapt only constants/source selection in the existing HIL October21 pack/preserve/member-check
recipes into `docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-*`. The sole source is
`G:/Code Files/snowflake/.worktrees/bld-growth-dynamics-oct21/out`, selecting exactly
`bld-growth-dynamics-oct21` and `bld-growth-dynamics-oct21-controls`. Preserve the failed row,
attempt logs, both retained checkpoint generations, events, snapshots and completed readouts.
Historical restored input duplicates remain covered by their existing immutable collection.
Publication and fresh-restore staging stay outside the selected source directories.

Rule14A: accidental source omission, an active writer, partial copying or archive corruption can
lose expensive completed results. Existing stable source inventories, endpoint reconstruction and
NAS transaction/member verification cover these boundaries; only bounded recipe adaptation is
needed. Lessons A1/A2/C4/E1 and Rules6/9 govern bytes, complete-set status and scoped conclusions.
No new transport/checker or adversarial review layer is warranted. The adapted publication recipe
requires exact `npm.cmd test` at a stable checkpoint; report any failures without a green claim.

Steps: finish saved-row checks; confirm writers stopped; pack with before/after source hashes;
publish copy-first into absent immutable `collections/bld-growth-dynamics/2026-10-21-v1/payload`;
verify final bytes; transactionally restore to fresh local staging and verify every archive member;
activate the catalogue binding and run full collection/destination verification; commit concise
results, commands, owner manifest and recovery receipts. Done when those records show the exact
source coverage and successful BLD recovery, with the scientific failure explicit. HIL's fresh
recovery and frozen matched-cohort interpretation remain separately named pending work. No HIL
recovery, scientific null, physical validation or completed joint comparison is inferred here.

Planned commands use Python3.13 and the existing transaction helpers:

```powershell
python docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-pack.py bld-growth-dynamics-oct21
node docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-preserve.mjs prepare
node docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-preserve.mjs publish
node docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-preserve.mjs restore
python docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-verify-archives.py out/restores/bld-growth-dynamics-2026-10-21-v1
node docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-preserve.mjs register
npm.cmd run assets:verify -- --collection bld-growth-dynamics@2026-10-21-v1 --full
npm.cmd run assets:verify-restored -- --collection bld-growth-dynamics@2026-10-21-v1 --from out/restores/bld-growth-dynamics-2026-10-21-v1
```

The member-check JSON must be saved as the recipe's `restored-members.json` before registration.
All commands above executed successfully; [recovery verification](../nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-verification.json)
records exact executable paths, times and exit codes. Python3.13 was selected explicitly.

The source pack contains 2308 files / 1609093065 bytes; its archive plus inventory occupy
196041058 bytes across two payload files. Every restored archive member matched. Full collection
hash verification and destination verification both exited0. Payload tree SHA-256:
`768f8b0b8dcefa92efd8da0ee4006c8e6e755c5d172fe9d750ea842ec4db2753`.
The immutable NAS location is `S:/collections/bld-growth-dynamics/2026-10-21-v1/payload`.
Original campaign/control files remain in the fixed execution worktree; prepared archive and
fresh restore remain under primary `out/`. No output/worktree was removed.

HIL recovery is still pending. From its current primary checkout with the marked NAS mounted,
use a fresh absent destination (do not merge it with an existing restore):

```powershell
npm.cmd run assets:restore -- --collection bld-growth-dynamics@2026-10-21-v1 --to out/restores/bld-growth-dynamics-oct21-hil
npm.cmd run assets:verify-restored -- --collection bld-growth-dynamics@2026-10-21-v1 --from out/restores/bld-growth-dynamics-oct21-hil
python docs/nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-verify-archives.py out/restores/bld-growth-dynamics-oct21-hil
```

Use Python3.13 there too. Verify archived members before extracting for registered matched-cohort
analysis. Retain the failed row as unresolved, without changing convergence or retrying unchanged.
BLD recovery does not assert HIL recovery or completion of the joint scientific comparisons.
The exact `npm.cmd test` at `c73c29618f6fd880ceffeb3ec933301b84c95dd3` ran from
2026-10-24T19:49:09.319099Z to20:14:59.785572Z, exiting1: 246 passing/one failing test file;
3070 passed, two failed and53 skipped tests. Both failures are the existing comparison-builder
file/directory symlink setup failures (Windows EPERM, lines581/644), also recorded on October21.
Rule7 and both TypeScript checks passed; NAS catalogue/transaction, evidence-integrity, progress
and BLD readout tests passed. Exact logs are retained in
[evidence](../../evidence/bld-growth-dynamics-2026-10-21/npm-test-preservation.stdout.log) with
[stderr](../../evidence/bld-growth-dynamics-2026-10-21/npm-test-preservation.stderr.log), and their
hashes/exit are bound by the recovery record. No full-suite-green claim. No numerical behavior,
frozen protocol, test assertion or Windows setting was changed for preservation.
Final record checks passed all27 NAS-catalogue/evidence-integrity/progress tests and Rule7
(2854 scanned files); exact command/output receipts are in the recovery record. Edited prose/JSON
passed diff checks; raw test logs retain original diagnostic whitespace and line endings.
Findings and recovery bindings are locally committed as `c73c296`; Git remote publication and
HIL fresh recovery remain pending. Source files and the execution worktree remain on BLD.

### BLD branch/worktree closeout preparation — October24

The maker requests confirmation of NAS preservation, committed integration and readiness to close
this task. One deliverable is a reconciled task checkout with useful originals retained outside
its directory. Solo scientific research; hostile actors excluded. This is operational preparation,
not completion of the pending HIL recovery or frozen matched-cohort scientific comparisons.

Read-only checks confirm task producer `d7f76cb84fdd6ba7ea0cf8f0d53708e74b09c365` is an ancestor
of primary `main` at `9f2a0c4452983cb3f03d5e2c8bd88e3685dc4b65`; `main..task` is empty and
both tracked checkouts are clean. All 2308 campaign/control files /1609093065 bytes still match
the published archive inventory; the fresh full NAS hash check exited0. Reuse collection
`bld-growth-dynamics@2026-10-21-v1` and its successful publication/fresh-stage/member receipts,
without duplicating NAS payloads or repeating a restore solely for closeout.

Prepare local custody by moving exactly
`G:/Code Files/snowflake/.worktrees/bld-growth-dynamics-oct21/out` to the absent target
`G:/Code Files/snowflake/out/bld-retired-2026-10-24/out`, after resolving both paths inside the
workspace and recording a complete stable inventory. Recompute that inventory after the move.
This retains every original campaign/control file plus the historical input restore directories
and the empty test-scratch directory. Historical inputs keep their existing
`hil-exploration-results@2026-10-21` binding; the new BLD collection covers exactly the two
campaign/control roots. Reinstallable `node_modules/` and rebuildable `app/dist/` need no backup.

Lessons A1/A2/C4 and Rules15/16 govern exact coverage and custody. Existing archive inventory,
NAS full-hash check and stable-tree inventory address accidental omission or changed bytes.
No new verifier, full scientific check or numerical rerun is needed. Done when local custody
matches before/after, the recovery record/progress state and exact later removal targets are
committed, and both checkouts are clean. Leave branch/worktree removal and source pruning
unexecuted; local Git publication remains separate from a Git remote update.

### HIL executable and recovery — October21

HIL's producer is `2f2d605f0ed8fdb8d78cdea02a58102a7001cb53`, on
`codex/hil-growth-dynamics-oct21` at
`C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake`.
Keep that execution checkout and Node24.13.1/V8 13.6.233.17-node.40 fixed. Primary `main`
holds later status/receipts; moving primary does not move this execution checkout.

From that execution directory, the implemented commands are:

```powershell
node runner/src/hil-growth-dynamics-oct21-main.ts list HIL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-growth-dynamics-oct21.ps1 -Mode launch -Workers 20
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-growth-dynamics-oct21.ps1 -Mode resume -Workers 20
node runner/src/hil-growth-dynamics-oct21-main.ts summarize out/hil-growth-dynamics-oct21
node runner/src/hil-growth-dynamics-oct21-readout.ts campaign out/hil-growth-dynamics-oct21 out/hil-growth-dynamics-control/readout-new.json
```

Launch is for an absent campaign directory; after interruption, check for existing workers and
use resume. The wrapper writes labeled coordinator stdout/stderr/invocation/exit files under
`out/hil-growth-dynamics-oct21-controls/`; each row retains separate attempt logs under
`out/hil-growth-dynamics-oct21/rows/<id>/attempts/<attempt>/`. Only the operational `-Workers`
value may be reduced to 1..20 on resource recovery. Do not change row operands, source/runtime
bindings, or discard failed scientific evidence. HIL launched after the full check passed. The
[launch receipt](../../evidence/hil-growth-dynamics-2026-10-21/launch.json) binds actual commands,
processes, logs and checkpoint observations; no conditional reserve was dispatched.

The retained readout exercise is pinned in
[`readout-retained-demo.json`](../../evidence/hil-growth-dynamics-2026-10-21/readout-retained-demo.json):
three original endpoints and 2269 reconstructed updates. Exact `npm.cmd test` at `2f2d605`
passed 244 files / 3088 tests, with 23 skipped and exit0; the
[verification receipt](../../evidence/hil-growth-dynamics-2026-10-21/verification.json) preserves
its command, timing and full stdout/stderr. This exercises selection and individual
reconstruction, not the still-pending W4/C1/H1 complete cohort comparisons. The
[`bounded implementation review`](../../evidence/hil-growth-dynamics-2026-10-21/review.json)
records no launch blocker and its shared-context/execution limits. Exact source comparison to
the N126 restart-witness producer found no change in core/solver/discovery/checkpoint code.

- [x] Read completed comparisons, governing contracts, known failures and current source versions.
- [x] Select 116 explicit new rows, amended 24/92 host allocation and a finite conditional reserve.
- [x] Finish bounded design review and prose checks; publish this plan before implementation.
- [x] Implement and verify the independent HIL roster/entry and minimal individual readout selection.
- [x] Commit/push HIL producer `2f2d605`; record the implemented exact commands above.
- [x] Record HIL local observations and dispatch its 20-worker/24-row queue.
- [x] Record BLD producer, verification disposition and dispatch receipts for its unchanged 92-row queue.
- [ ] Analyze completed matched blocks; record predictions before any reserve dispatch.
- [ ] Publish/recover retained output on NAS, reconcile concise findings and next experiment.

### Bounded design review — October 21

Codex/GPT-6 reviewer used inherited/shared project and design context. It read this plan and
relevant historical readout definitions and independently expanded all roster/queue/reserve
counts. It did not execute a solver, new readout, test suite, NAS transaction or live BLD check.
Two material protocol ambiguities were corrected: F0 now requests only its available two-arm
contrast, and the common-time/plateau cohorts and formulas are explicit above. The reserve's
immutable-producer handling is also clarified. This is an internal design review, not physical
validation or a launch audit; implementation behavior and actual new-host resource use remain
unverified. No second review layer is requested.

Original planning verification (before the host-allocation amendment): `npm.cmd run lint:rule7` passed; locked Vitest
`npx.cmd --no-install vitest run runner/test/progress-index.test.ts` passed 11 tests;
`git diff --check` passed. A read-only document check resolved 138 local file links and expanded
116 unique planned IDs with the then-current 60/56 split and 138-row maximum reserve envelope. These are prose/
plan checks, not full-suite or scientific results. The first test invocation could not load the
worktree's missing Vitest dependency and ran no tests; `npm.cmd ci --ignore-scripts` installed
the locked dependencies, after which the check above passed. No dependency files changed.
This planning worktree contains no useful untracked output payload; dependencies are rebuildable.

### Allocation amendment — longest work on HIL, October21

Maker requested that BLD be able to finish and turn off while HIL continues the longest work.
Before any launch, this amendment moves W1/W2/W3/F0/C0 to BLD, C1/H1 to HIL, and R5 to HIL;
W4 stays on HIL and F1–F3 stay on BLD. The relocated prospective row IDs now name their actual
host. The 116 scientific operands, endpoints and comparison definitions are unchanged. All22
conditional reserves now belong to HIL; no pending HIL result or follow-up keeps BLD's queue open.

Work was isolated on `codex/hil-long-run-allocation` from `b6c5ffa`. A shared-context Codex/GPT-6
read-only allocation check confirmed the24/92 split, whole matched groups and shutdown dependency;
it executed no solver, scientific readout, NAS transaction or live BLD check. The author separately
compared all eight scientific block definitions to `b6c5ffa` after normalizing only relocated
host prefixes, and checked the20/32 initial slots,4/60 queued rows and46/92 maximum envelope.
`npm.cmd run lint:rule7`, `npx.cmd --no-install vitest run runner/test/progress-index.test.ts`
(11 tests) and `git diff --check` passed. No numerical code or execution readiness claim changed.
The amendment checkout has no useful untracked output; installed dependencies are rebuildable.

## Out of scope

No Phase 11 opening, full Nakaya explanation, physical-causality or quantitative-validation claim;
no Phase 7/GPU work, heat/diffusivity law change, ordinary checkpoint change, failed-cooling rerun,
S6 reopening, environment events combined with width/facet flags, arbitrary checkpoint state
transplant, external-source acquisition/provider contact, automatic endless fan-out or data pruning.

## Tried and rejected

- **October24 preservation check with unchanged Windows symlink privilege:** the exact full
  check above again reached both comparison-builder fixture EPERM failures. The 246 other files
  passed; keep the receipt and do not weaken tests or repeat the full run for unchanged permissions.
- **Initial BLD full check with missing Windows symlink privilege:** the exact run at `5e03d71`
  exited 1 with two setup failures in the existing comparison-builder suite and one progress-length
  assertion. The progress correction and failing receipt are retained. The maker then explicitly
  approved execution; the initial local hold is superseded by the scoped launch disposition above.
  No test was skipped or publication guard weakened; no full-suite-green claim is made.

- **Keeping long fine-grid work on both hosts:** superseded before launch by the maker's shutdown
  preference. All fine-grid and larger-history cases now run on HIL; BLD has a closed shorter
  queue and hands its data back for analysis. This is an allocation decision, not a failed experiment.

- **Two tiny coarse cases as a two-computer program:** previously left most useful capacity idle.
  This roster supplies complete independent scientific groups to 20/32 worker ceilings.
- **A portfolio document advertised as launch-ready:** BLD previously pulled approval without a
  tested runner/named executable workload. This record explicitly marks the remaining executable
  work and requires a pinned, tested handoff before saying BLD can start. The same communication
  failure recurred at `48a8ffb`: the maker expected fetch-and-launch, while the commit only held
  the protocol. The October21 correction gives BLD explicit authority to implement/test/launch
  its own 92 rows and makes HIL independent. Future handoffs must say either "implement this
  protocol" or provide an already exercised executable command and producer; a plan is not a
  launchable campaign.
- **Four-hour production cutoff / observational logs as restart:** cannot preserve multi-day
  scientific progression. Use existing complete-cycle checkpoints; no production wall timeout.
- **Repeated short capacity ladders:** BLD's 28-worker speed timeout and HIL's N126 watchdog were
  not mature duration estimates. Use existing evidence, direct operational observations and live
  memory floors; do not rerun a ladder just to authorize work the maker wants to perform.
- **Unannounced multi-day refinement:** prior fine warm rows took 149.550–228.948 active hours.
  W4/C1 are explicitly long and uncertain from the outset, with controls and coarse work beside them.
- **Assuming size matching proves adequacy:** lesson C2 and the warm/cold plans require separate
  domain/spacing/seed statements. Two spacings or a fixed extent/domain ratio is not convergence.
- **Reusing a result by label or treating an endpoint as a habit theorem:** lessons C3/C6/E1/E5
  require exact bindings, reconstructible observations and scoped interpretation. Existing event
  readers and endpoint checker cover named cases; judgment remains for physical relevance.
- **Adding all threshold×cutoff×seed×pressure combinations:** unnecessary redundant expansion.
  Use W1–W3 one-factor blocks and the finite reserve; register a prediction before a selected follow-up.
- **Shared-geometry continuation disguised as resume:** different field/fill/lag/ledger state can
  matter; ordinary resume preserves them and may not be relabeled a new counterfactual.
- **Unchanged cooling retry:** its nonconvergence at cell 145376/update 414/extent 21 was reproduced.
  Preserve the failure; diagnose under a separate numerical task before proposing a correction.
- **Process expansion:** lessons C1/F2 and Rules 14A–14B favor the existing worker/queue/readouts.
  No new dashboard or scheduler is required for this deliverable.

## Open questions

BLD completed its fixed queue with 91 checked size endpoints and one numerical failure;
[terminal reconstruction](../../evidence/bld-growth-dynamics-2026-10-21/terminal-readout.json)
records the complete census and the intact failed-row checkpoints. NAS preservation and fresh BLD recovery passed below; full frozen matched-cohort comparisons and fresh HIL recovery remain pending.
Do not retry the failed double-pressure case unchanged or infer a null effect from its prefix.
HIL status requires a host-side observation; scientific conclusions may select none of the reserve.
