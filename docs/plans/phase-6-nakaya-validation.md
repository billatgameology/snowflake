# Plan — Phase 6: Validation against the Nakaya diagram

- **Phase:** Phase 6 — validation, not calibration (decision 0003)
- **Status:** registered, not started. WP0 is the pre-registration work package; **no validation
  sweep runs until its freeze lands**.
- **Started:** 2026-07-26
- **Last touched:** 2026-07-26 by Claude
- **Charter version at registration:** v1.16 (2026-07-24)

## Goal

Produce the model's own temperature-vs-supersaturation morphology diagram and lay it beside the
published one, stating the agreements *and* the disagreements. This is a test the model is
allowed to fail, and the phase is built so that failing is reportable rather than embarrassing:
the protocol freezes before the first sweep, so no result can be reached by tuning until the
picture matches.

## Done when

Charter §3.2, Phase 6, **verbatim at plan registration** (charter v1.16, line 312):

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against
> Nakaya's, with the agreements and the disagreements both stated. A negative result is a
> result: if the model does not reproduce the flip, that is a finding about the model, it is
> reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not
> permitted is quietly tuning until the diagram matches and calling it validation — the
> protocol freeze (item 1) makes that structurally impossible rather than merely forbidden.

The falsifiable test it names (charter line 308, verbatim):

> The falsifiable test: does the model reproduce the habit reversals? Plates near −2 °C, columns
> near −5 °C, plates again near −15 °C, columns below −30 °C. Scoped honestly (v1.3, decision
> 0005): no-SDAK and SDAK runs are reported separately; with Nakaya-informed (P3) SDAK inputs
> active, matching the diagram is in-sample reproduction — the no-SDAK probe (does the measured
> large-facet crossing alone produce any reversal?) is a first-class result in its own right,
> and independent validation runs against held-out observables (growth rates, size-dependent
> habit, pressure dependence, histories; §2.7).

Exit 0 of the registered flagless gate command is the phase claim. A *morphology miss is not a
gate failure*: the gate fails on invalid numerics, provenance, artifacts, incomplete runs, or a
protocol violation — never on the model disagreeing with the diagram. That separation is what
makes "a negative result is a result" executable rather than aspirational.

## Authority and starting state

Governing sources, in authority order:

- **Charter** §1.5 (Evidence labels — only Phase 6 can grant "quantitatively validated over a
  named domain", and only where the comparison holds), §2.3 (the Nakaya diagram; "this diagram
  is v1's report card: the model does not need to reproduce it quantitatively, but it must be
  able to move across it qualitatively"), §2.4 (fixed-σ Dirichlet far field **required for every
  Phase 6 validation run**), §2.5 and §2.7 (provenance classes P1–P4; the in-sample/held-out
  split), §3.1 (host; the 65% domain-contact guard is a collision heuristic, and flagged runs
  never enter validation results), §3.2 Phase 6 (items 1–7), §3.3 (standing guardrails).
- **Decisions.** 0003 (Libbrecht kinetics make temperature a physical input, so Phase 6 is
  falsifiable), **0005** (the phase's constitution: D1 provenance classes and split reporting;
  D4 the expanded freeze list and the convergence studies), 0006 (dual convergence; `divTol` and
  `relaxMaxSweeps` join the freeze list), 0009 (the coupled `surfacePolicy`
  `aggregate-hv-g1h1-v4` joins the freeze list), 0004 (research media is not versioned — what
  Phase 6 needs from it must be a derived, citable measurement in a tracked file), 0011
  (timeline semantics for any history run), 0016/0018 (the sweep host; Windows/D3D12 scope).
- **Solver truth.** `docs/attachment-kinetics.md`, `docs/gg-machinery.md`,
  `docs/libbrecht-parameters.md`, `docs/monograph-review.md`.

**Permanent controls.** `GGSolver`, `LKSolver`, `GGThreshold`, `LibbrechtKinetics`, the strict
CPU checkpoints, and all accepted Phase 2–5 evidence stay as they are. None may be deleted,
weakened, or reinterpreted to make a comparison come out better. The float64 CPU solvers remain
the oracle; Phase 5's float32 GPU port is a speed instrument whose only established claim is
conformance to that oracle on observed Windows/Chromium/D3D12.

**Starting state.** Phases 2a, 2b, 3, 4 and 5 are complete with zero-finding review. Phase 5's
canonical evidence is the `c436df5` bundle at `out/phase5/` (`gate5` 16/16). Phase 4 Pass B
already records five honest morphology misses out of eight diagnostics; per charter line 278 a
failed Pass B does not block Phase 6 — reporting that failure properly is precisely this phase's
job. `ADR 0010`'s phase-overlap exception ended with Phase 4, so Phase 6 runs under the ordinary
sequential rule.

**Host.** The registered sweep host is the Ryzen 7 5700G / 64 GB / RTX 3080 10 GB Windows
machine (ADR 0016). One process per physical adapter unless a registered protocol proves a
different arrangement.

## What Phase 6 compares against

The project owns two reference sources, and they answer different questions. Conflating them is
the single largest scientific risk in this phase, because their boundaries genuinely sit at
different `(T, σ)`.

| Source | What it is | Role here | Strongest permitted claim |
|---|---|---|---|
| **The Nakaya diagram** — Libbrecht 1211.5555v1 Figure 1 (printed p. 2) | The classical morphology diagram, redrawn: T from 0 to −35 °C, supersaturation 0–0.3 **g/m³**, water-saturation curve overlaid, regime bands bounded near −3, −10 and −20/−22 °C | **The report card.** Does the model cross plate → column → plate → column at roughly the right temperatures? | Qualitative / ordinal. Never percent-level onset claims: it is a schematic composite of natural free-falling crystals |
| **Libbrecht Figure 8.16** — the e-needle grid indexed in `research/lab-validation-dataset.md` (109 morphology tiles, T −0.5 to −21 °C, σ 8–128% rel. ice) | Controlled measurements of isolated single crystals on e-needle tips at fixed `(T, σ)` per tile | **Quantitative onset boundaries**, measured in the same geometry class our runs use | Quantitative onset/trend comparison — but only after the column-seed ADR and per-entry PDF re-verification |

Two consequences the plan is built around:

1. **The charter's wording is satisfied literally.** The gate says "compared against Nakaya's",
   and §2.3 says the comparison need only be qualitative. Using Figure 1 as the report card
   therefore needs no deviation ADR.
2. **Figure 8.16 costs more than it looks.** Its entire grid is e-needle geometry, and
   `research/lab-validation-dataset.md` rule 3 states that adding an elongated seed class is an
   **ADR-level change for evidence use** (the canonical 19-site seed is pinned). That ADR is
   deferred until the quantitative work package, not taken on now.

`research/lab-validation-dataset.md` rule 1 governs both: association is not human-certified,
and **every entry must be re-verified against the canonical PDF before any accepted
comparison**. Rule 2 governs σ semantics — `sigma_surf` (kinetics-only), `sigma_infinity`
(transport included), and relative-to-ice values that legitimately exceed water saturation are
never mixed.

### Digitizing Figure 1 into citable reference data

Under ADR 0004 the page renders are not versioned and cannot be evidence as they stand; there is
no tracked index for 1211.5555 at all. WP1 therefore produces one, and it is a derived
measurement with a stated uncertainty, not a screenshot:

- **Read** the three habit-boundary temperatures and the regime sequence, with an explicit read
  uncertainty (the boundaries are dashed lines on a schematic; the honest figure is ±1–2 °C).
- **Convert** the y-axis: the figure's supersaturation is absolute excess vapour density in
  g/m³, while the solver's σ is a fraction relative to ice. `σ = Δρ / ρ_sat,ice(T)`, with
  `ρ_sat,ice` from `cSat()` in `core/src/libbrecht.ts`. This is arithmetic, not a fit.
- **Cross-check the reading against the source's own ink.** The water-saturation curve drawn on
  the figure is a known physical function of temperature, and `sigmaWater()` already computes
  it. Digitizing that curve and comparing it against our computed values verifies the axis
  reading and the conversion; a disagreement means our transcription is wrong, and catching it
  here is what stops a digitization error from being reported later as a disagreement about the
  model. **The cross-check runs before any boundary is registered, and its residual is
  recorded.**

## Approach

### One registered protocol per sweep, never merged

Phase 6 does not run as a single monolithic freeze. It runs as a sequence of **registered
protocols**, each frozen before its own sweep, each pinned by hash the way
`PHASE4_CRITERIA_FREEZE`, `GATE2B_PREREGISTRATION` and `PHASE5_PROTOCOL_SHA256` are, and each
reported separately. Charter item 1 binds every one of them: any post-freeze edit needs a logged
ADR and **invalidates that protocol's prior sweep results — the sweep re-runs in full**.

The first protocol is the no-SDAK reversal probe. Later protocols (SDAK-active reproduction,
quantitative onset comparison against Fig 8.16, held-out observables) are registered when their
work packages open. Splitting this way does not weaken pre-registration — each sweep is still
fully frozen before it runs — and it avoids freezing a grid for work whose requirements are not
yet known, which would guarantee an ADR-and-re-sweep cycle later.

### Reporting rules that hold for every protocol

- **No-SDAK and SDAK results are never merged in a report** (charter §3.3; ADR 0005 D1).
- Wherever P3 inputs are active, the comparison is labelled **in-sample reproduction**, never
  independent validation.
- Results are never compared across far-field boundary conditions silently. Every Phase 6
  validation run uses **fixed-σ Dirichlet** (charter §2.4).
- Any run that trips the 65% domain-contact guard is invalid for validation and is excluded by
  name, not silently dropped.
- Evidence labels move to "quantitatively validated over a named domain" only where a
  comparison actually supports it, and only for the named domain.
- Exploratory comparisons say that they are exploratory.

### Numerical verification (charter item 2)

Grid-, timestep- and domain-convergence studies at representative sweep points. The 65%
domain-contact guard is a collision heuristic and **is not** a proof that the far boundary is
irrelevant; only a domain-convergence study is. Scope for this phase is the charter minimum: the
1D spherical reference solver proposed in `docs/monograph-review.md` is explicitly **not** in
scope here (see Out of scope).

## Pre-registration contents (WP0)

The freeze list is charter line 303 plus its amendments. WP0 is complete when every row below
has a registered value in a tracked protocol module, `docs/libbrecht-parameters.md` is frozen,
and the freeze commit is an ancestor of every execution commit that follows.

| Group | Frozen items |
|---|---|
| Comparison design | The T/σ grid; the crystal size at which habit is measured (habit is size-dependent, so a stated maximum dimension is what keeps comparisons apples-to-apples); metric thresholds; the uncertainty-reporting scheme |
| Physics inputs | `docs/libbrecht-parameters.md` in full; pressure; the parameter interpolation scheme (an open P4 choice today — see Open questions); noise amplitude; physical seed size |
| Boundary and domain | Fixed-σ Dirichlet far field (charter §2.4); domain budgets; Δx |
| Surface operator | The named coupled `surfacePolicy` `aggregate-hv-g1h1-v4` (ADR 0009) |
| Numerics | Fill-CFL bound; diffusion residual tolerance **and its norm**; the divergence-identity tolerance `divTol`; the relaxation-sweep cap `relaxMaxSweeps` (ADR 0006); float precision |
| Statistics | Seed-ensemble size |
| Provenance | Model/code version (commit hash); exact engine version; host and adapter identity |

**Threshold values land from calibration probes, and those probes are not evidence.** This is
the Phase 3 pattern: run coordinator-only probes, register the resulting numbers here with the
probe output named, and state the margin reasoning. A probe's printed metrics are never citable
as a gate result.

**Two corrections must land before the freeze, while no ADR is required.**
`docs/monograph-review.md` records two factual errors in the SDAK section of
`docs/libbrecht-parameters.md` (SDAK-2 modifies `A_prism`, not `sigma_0`; a printed width form
`sigma_0(w) = sigma_0,broad·[1 − exp(−w/w_0)]` does exist). The file is not yet frozen, so these
are ordinary corrections now and would cost a full re-sweep later.

## Gate contract

The registered flagless gate command's exit 0 is the phase claim. WP0 supplies exact criterion
names and numerical thresholds, but it may not remove a row.

| Area | Blocking claim |
|---|---|
| Pre-registration | The protocol freeze commit and the frozen parameter table are ancestors of the execution commit; the protocol hash matches; the tree is tracked-clean |
| Provenance | Host, adapter, engine, commit, protocol/parameter hashes, and the far-field condition are recorded per run and authenticate |
| Reference data | Every reference boundary used is a derived, citable measurement with stated uncertainty; the Figure 1 water-saturation cross-check is recorded with its residual |
| Execution validity | Every sweep point completed, converged under both convergence controls, and stopped for a registered reason; no run that contacted its domain enters the results |
| Numerical verification | Grid, timestep and domain convergence studies ran at the registered representative points and are reported with their deltas |
| Habit classification | Every sweep point is classified by the registered metric at the registered measurement size, including `neutral` and `invalid` outcomes |
| Diagram artifact | The model's own T-vs-σ diagram is produced from the run set, with every point traceable to its run |
| Comparison honesty | Agreements *and* disagreements are both stated; no-SDAK and SDAK results are reported separately and never merged; P3-active comparisons are labelled in-sample |
| Negative controls | Each registered control fails by name: forged provenance, a post-freeze parameter edit, a merged no-SDAK/SDAK report, a domain-contacted run entering results, a mismatched far-field condition, and a habit classification taken at the wrong measurement size |

A morphology miss does not change exit 0. Invalid numerics, provenance, artifacts, incomplete
runs, or protocol violations exit 1. Any flag exits 2.

## Steps

- [ ] **WP0 — pre-registration.** Correct the two known SDAK errors in
      `docs/libbrecht-parameters.md`; decide and register the parameter interpolation scheme;
      run coordinator-only calibration probes for every threshold; register the full freeze list
      above in a tracked protocol module with a hash pin; freeze the parameter table. Nothing
      sweeps until this commit exists and review accepts it.
- [ ] **WP1 — Nakaya reference data.** Produce the tracked derived-measurement file for
      1211.5555v1 Figure 1: the habit-boundary temperatures with read uncertainty, the g/m³→σ
      conversion, and the water-saturation cross-check against `sigmaWater()` with its recorded
      residual. Cite figure, printed page and PDF page. No solver work.
- [ ] **WP2 — sweep harness and diagram artifact.** A flagless registered command that runs the
      frozen (T, σ) grid on the headless runner, classifies habit at the registered measurement
      size, excludes domain-contacted runs by name, and emits the model's own diagram as an
      authenticated artifact with every point traceable to its run. Sweeps cross habit flips by
      design, so domains may not be pre-shaped to a morphology that is not yet known (ADR 0001
      cuts both ways): use compromise near-cubic budgets or the two-pass probe-then-refit scheme.
- [ ] **WP3 — numerical verification.** Grid, timestep and domain convergence studies at the
      registered representative sweep points, reported with deltas. The domain study is the only
      thing that speaks to far-field independence.
- [ ] **WP4 — the no-SDAK reversal probe.** Run the frozen grid with SDAK inactive and answer
      the charter's question: does the measured large-facet crossing alone produce any habit
      reversal? Report the model's diagram beside Figure 1's boundaries, with agreements and
      disagreements both stated, and every systematic from Open questions carried in the report.
      **Either answer closes this work package.** A null result is written up as a result.
- [ ] **WP5 — canonical evidence and closure.** Run the registered gate command flagless at one
      exact clean commit, authenticate the artifacts, obtain independent review to zero blockers
      and zero should-fixes, and record every metric, value, host, command, commit and artifact
      hash in `PROGRESS.md`.

Later work packages — SDAK-active reproduction (labelled in-sample), the quantitative Fig 8.16
onset comparison (needs the column-seed ADR and per-entry PDF re-verification), and held-out
observables — are registered when they open, each with its own frozen protocol.

## Out of scope

- Calibration. Phase 6 is validation (decision 0003); tuning inputs to improve agreement is the
  one thing the freeze exists to prevent.
- The 1D spherical reference solver proposed in `docs/monograph-review.md`. It is the project's
  only absolute accuracy anchor and remains a good idea; this phase runs the charter minimum
  (convergence studies) and does not take it on.
- A `monopole-matched` third far-field condition (`docs/monograph-review.md`) — an ADR-level
  addition, not a Phase 6 deliverable.
- An elongated/column seed class, until the ADR that authorizes it for evidence use.
- Any Metal or general-WebGPU portability claim (ADR 0018), and any change to
  `PHASE5_PROTOCOL_SHA256`, the Phase 5 bundles, or accepted Phase 2–4 evidence.
- Phase 7 product work: smooth surfaces, materials, post-processing, gallery, export.
- Percent-level onset claims against the Nakaya schematic, or any claim that mixes σ semantics
  across reference entries.

## Tried and rejected

- **Make Libbrecht Figure 8.16 the primary comparison target and write an ADR deviating from the
  charter's "Nakaya's" wording.** Rejected on 2026-07-26 once Figure 1 of 1211.5555v1 was
  located: the project does own the classical diagram, the charter asks only for a qualitative
  crossing (§2.3), and taking Fig 8.16 first would have required both a deviation ADR and the
  column-seed ADR before a single sweep. Fig 8.16 remains the right *quantitative* target later.
- **Compare quantitatively against the Nakaya schematic.** Rejected: `docs/monograph-review.md`
  warns that the e-needle and classical diagrams' boundaries sit at visibly different `(T, σ)`,
  and "comparing against the wrong diagram would manufacture false disagreement". The schematic
  supports ordinal claims only.
- **Freeze the entire phase's protocol once, up front.** Rejected: the later quantitative and
  held-out work packages have requirements that are not yet known, so a single freeze would
  guarantee a post-freeze ADR and a full re-sweep. One registered protocol per sweep keeps
  pre-registration strict without pre-committing unknowns.
- **Keep Phase 6 as-is and rely on pre-registration alone to handle SDAK circularity.** Rejected
  by ADR 0005: "freezing a leaked input freezes the leak. Pre-registration binds future hands; it
  cannot unknow what the SDAK curves were built from."
- **Drop SDAK entirely to keep Phase 6 clean.** Rejected by ADR 0005: SDAK is the best available
  hypothesis for the extreme morphologies, and split reporting keeps the clean no-SDAK result
  *and* the hypothesis-bearing run.
- **Treat the 65% domain-contact guard as evidence of far-field independence.** Rejected by
  charter item 2 and `AGENTS.md`: it is a collision heuristic. Only a domain-convergence study
  speaks to boundary independence.
- **Pre-shape each sweep point's domain to its expected habit.** Rejected: sweeps cross habit
  flips by design, so shaping the box to a morphology that is not yet known biases the result
  ADR 0001 was written to protect.

## Open questions

These are recorded systematics, not blockers. Each must be carried in the Phase 6 report; none
may be discovered after the fact.

1. **The σ₀ crossing discrepancy.** 1910.09067 Figure 4 puts the raw-measurement crossing at
   T ≈ −6 °C; the monograph's CAK curves cross at (Tm−T) ≈ 9–10 °C. The solver uses the CAK set.
   `docs/libbrecht-parameters.md` requires this be carried as a stated systematic, and that the
   no-SDAK probe be run against **both** crossings before any conclusion about "the model".
2. **±25% digitization bands can flip the cold-side ordering.** Propagating the bands
   independently per anchor lets the −15 °C bands overlap, so uncertainty-consistent parameter
   draws exist in which the ordering reverses. No covariance information exists to exclude them.
3. **No `D(T)` law exists.** The solver, like the monograph's working table, treats diffusivity
   as temperature-independent at 1 atm. This bites hardest in exactly this phase's temperature
   sweeps.
4. **CAK-in-air vs CAK-in-vacuum.** The monograph is internally split; the choice is a stated
   Phase 6 systematic.
5. **Latent heating is unmodelled.** Ignoring it overestimates diffusion-limited growth by
   40–80% on the warm side. Whether a labelled correction enters the freeze list is a WP0
   decision.
6. **Registered σ∞ = 0.002 puts the cold half of a sweep in a dead-facet regime**, which makes
   "no column at −15 °C" partly predictable from regime placement alone. The frozen σ grid must
   address this — per-temperature σ scaled to σ₀(T), or a second registered point near
   0.01–0.02 — and the choice is registered in WP0, not decided after seeing results.
7. **Permanent model limits** (`docs/attachment-kinetics.md`): no latent-heat transport, no
   Gibbs–Thomson, no admolecule surface diffusion, no sublimation, seed placed rather than
   nucleated; plus intrinsic vicinal anisotropy (~10%, not removable by resolution) and a
   convergence-tolerance growth-rate bias.
