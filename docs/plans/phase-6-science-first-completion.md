# Plan — Phase 6 science-first gate completion

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-01
- **Last touched:** 2026-08-01 by OpenAI Codex (GPT-5)

## Goal

Complete the Phase 6 scientific gate that the 2026-08-01 external review correctly found
incomplete. The maker has chosen the science-first branch of open item O1b: execute the registered
conservative-intersection headline and the omitted charter obligations rather than amend the
charter to fit the evidence already produced. Resource cost may shape scheduling and concurrency,
but it may not weaken a validity criterion, substitute an unregistered configuration, or turn a
missing comparison into a prose limitation.

The existing two 204-row sweeps remain tracked measurements of the model at their executed
configuration. They are not erased, upgraded, or silently pooled into the new result. The accepted
failure to reproduce the Nakaya diagram also remains a valid measured-only result. This plan is
about earning the registered verdict and the independent evidence that were not produced.

## Done when

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the protocol freeze (item 1) makes that structurally impossible rather than merely forbidden.

The quoted gate is reached only after all preceding Phase 6 charter items that give it meaning are
also discharged: the full protocol is frozen before new evidence; grid, timestep, and domain
controls pass at representative registered points; the production headline is the conservative
intersection required by ADR 0026; hundreds of automated preview-budget runs execute on the
headless GPU harness; no-SDAK and SDAK results remain separate; held-out growth-rate,
size-dependent-habit, pressure, and history-response comparisons run; and evidence labels are
upgraded only where those comparisons support them.

## Governing direction

The maker's 2026-08-01 direction is binding for this work:

> O1b needs to be executed. If there is a choice between science and resource, choose science.

This supersedes ADR 0037 §5 only as a scheduling/resource decision. It does not change or erase
ADR 0037's measurements: N = 48 fails its registered domain check at three of four sampled points,
N = 64 fails against N = 80 at three of four, and no configuration tested so far satisfies every
registered numerical condition. A new accepted ADR must record this supersession and quote the
applicable charter clauses before a replacement protocol freezes. No charter amendment is planned:
the selected branch executes the current charter.

## Approach

Work proceeds through independently reviewable freezes. No expensive evidence campaign starts
until its inputs, evaluator, negative controls, output schema, resource estimate, and termination
rules are committed and adversarially reviewed. Reconnaissance may measure cost or discriminate
between predeclared numerical configurations, but it is stamped non-transferable and cannot enter
a gate result.

The scientific result stays anchored to the float64 CPU oracle and the D6h-equivariant
`aggregate-hv-g1h1-v6` policy. The GPU cohort is a separately reported preview-budget execution and
CPU-comparison obligation, not a cheaper replacement for the oracle. Before the GPU cohort can run,
the WGSL path must implement the same registered surface policy and a binary32-appropriate
convergence rule must be derived and validated against float64; the current v5-only, gather-order
path cannot be treated as equivalent to v6.

Physical crystal size and numerical convergence are kept distinct. Growth can genuinely depend on
size, so a larger target extent is not automatically “more converged.” The validation size or size
strata must come from a source-matched, pre-registered comparison design. At each such physical
size, grid spacing, timestep, and far-boundary placement are numerical controls and must be shown
adequate independently. The previous extent ladder is retained as a diagnostic and cannot choose a
convenient production size after its habit classes are known.

The new production artifact is self-sufficient: every row carries all three grid-spacing
measurements, fitted order, extrapolation admission/refusal, measured class, extrapolated class
where admitted, conservative-intersection verdict, numerical-validity witnesses, engine and source
provenance, and immutable input hashes. The gate re-derives its verdict from those bytes. No
producer-supplied pass field is trusted.

## Work packages

### WP0 — repair the state before making new claims

- [ ] Reconcile `docs/PROGRESS.md`, `docs/HANDOFF.md`, the prior Phase 6 plan, ADR 0037, the two-arm
  report, and the conclusion so they agree that the gate is active and incomplete.
- [ ] Correct the columns diagnostic to registered outcome 4 (non-monotone) and remove every
  surviving priority or gate-standing claim derived from that inadmissible diagnostic.
- [ ] Recompute the symmetric extent-fragility census with an explicit boundary convention and pin
  it in executable tests; do not publish 42/51 or 43/52 until the convention and raw rows agree.
- [ ] Narrow cross-architecture prose to the four executed `CAK` configurations.
- [ ] Add an executable M1 regression that pins the analytic base-invariant dip centre rather than
  only a downstream transition count.
- [ ] Correct stale cross-references and run the existing independent verifiers against the tracked
  evidence.
- [ ] Obtain an adversarial interpretation review before committing the corrected conclusion.

### WP1 — source currency and held-out target inventory

- [ ] Re-check every Phase 6 input and validation citation against its latest primary-source
  version, and sweep the cited authors' later primary output for superseding forms or data.
- [ ] Build a candidate inventory for all four charter-mandated held-out families: growth rates over
  named (T, supersaturation) points, size-dependent habit, pressure dependence, and deterministic
  growth-history responses.
- [ ] Record whether each candidate is truly held out from P1–P4 inputs, its geometry and substrate
  conditions, observable definition, digitization/measurement uncertainty, and whether the 3-D
  lattice can make an apples-to-apples prediction without a new fitted quantity.
- [ ] Reject targets that reuse Nakaya-tuned P3 inputs as “independent,” require an unregistered
  geometry mapping, or cannot be scored without looking at the model output.
- [ ] Freeze the selected primary-source bytes or stable identifiers, extraction scripts, target
  table, uncertainty model, and source-currency record in one commit after independent review.

### WP2 — numerical configuration campaign

- [ ] Pre-register a reconnaissance matrix that spans both parameter arms, both habit axes,
  near-threshold and fast-growth cases, and all physical sizes selected in WP1. Reconnaissance
  outputs are explicitly non-transferable.
- [ ] At fixed physical size and grid spacing, expand the far boundary until the registered domain
  quantities pass on successive comparisons. A resource estimate may choose concurrency; it may
  not declare a failing rung adequate.
- [ ] At fixed physical size and adequate physical boundary placement, execute at least three grid
  spacings and apply ADR 0026's fitted-order admission rule. Add a fourth spacing wherever the class
  or admission decision depends on the fit, as ADR 0026 already anticipates.
- [ ] Halve the interface timestep/fill-CFL at registered representative points and freeze a
  quantitative timestep criterion before observing the production result.
- [ ] Test relaxation caps and dual-convergence tolerances for non-vacuity at the worst registered
  points; convergence work is not physical time.
- [ ] Freeze one production geometry mapping per grid spacing only after every registered numerical
  control passes. If no tested configuration passes, continue the predeclared escalation or return
  to the maker with a measured scientific obstacle; resource cost alone is not a stopping rule.

### WP3 — decision and protocol freeze

- [ ] Accept an ADR that records the maker's science-first direction, supersedes ADR 0037 §5's
  no-re-sweep scheduling decision, quotes every affected/no-impact charter clause, and preserves
  ADR 0037's negative evidence.
- [ ] Amend the Phase 6 protocol through the charter's existing post-freeze mechanism. The amendment
  must name all sizes, grid spacings, physical domains, timestep controls, CPU/GPU roles, selected
  held-out targets, exact run counts, uncertainty operators, engine versions, environment policy,
  and failure consequences.
- [ ] Put every behavior-affecting value in the gated values manifest; prose remains the
  justification, never the only pin.
- [ ] Freeze an explicit clean child-process environment allow-list. Inherited `NODE_OPTIONS`,
  preload hooks, and equivalent out-of-repository mutation paths must fail closed.
- [ ] Add a preflight that proves every frozen row reaches every spawned CPU/GPU invocation and is
  echoed into each result.
- [ ] Subject the ADR, source freeze, protocol, cost model, and expected-result statement to a
  non-author adversarial review. Resolve findings before any production row runs.

### WP4 — implement R15 as an end-to-end evidence path

- [ ] Give `phase6FitGridExtrapolation` a production caller that consumes three spacing rows for the
  same registered point and rejects missing, duplicated, shifted, mixed-protocol, or numerically
  invalid inputs.
- [ ] Extend the artifact schema with raw spacing rows, fitted order, admission reason,
  extrapolated value/class, measured/extrapolated agreement components, conservative-intersection
  verdict, and a counted `not-extrapolatable` state.
- [ ] Compute all reports, tables, diagrams, and the final verdict from the artifact rather than
  from producer summaries.
- [ ] Add independent recomputation that imports neither the sweep producer nor its evaluator.
- [ ] Add executable negative controls for every new field and seam, including a mutation that
  changes the conservative-intersection result while leaving the measured-only count unchanged.
- [ ] Make the gate refuse old measured-only artifacts as headline evidence while continuing to
  verify and label them as historical measurements.

### WP5 — make the preview GPU cohort scientifically comparable

- [ ] Port `aggregate-hv-g1h1-v6`'s order-invariant opposing-vapor reduction to WGSL and keep legacy
  v5 evidence bit-unchanged.
- [ ] Derive a binary32 convergence/error envelope from operation counts and machine precision,
  then validate it against the float64 oracle over adversarial fields and registered morphology
  cases. Do not copy the float64 `divTol` or waive dual convergence because it is expensive.
- [ ] Extend the existing pinned Chromium/D3D12 headless harness to Phase 6 parameter sweeps at the
  charter's preview budget (approximately eight million active cells), with bounded dispatch,
  device/error provenance, GPU-resident stepping, and fail-closed readback/evaluation.
- [ ] Freeze and execute an exact count of at least 200 automated preview-budget runs. The intended
  target is the complete 204-point grid per arm (408 total) unless the pre-run ADR registers a
  scientifically stronger coverage design; “hundreds” is never discharged by CPU rows.
- [ ] Report GPU outcomes separately from the float64 production headline and publish CPU-vs-GPU
  class, metric, convergence, and failure comparisons. A mismatch is a result, not permission to
  tune the tolerance after seeing it.

### WP6 — execute the float64 production campaigns

- [ ] Run the frozen three-spacing no-SDAK (`CAK`) matrix. Each of 204 (T, supersaturation) points
  requires the registered spacing cohort, so the historical R15 minimum is 612 forward runs before
  any added convergence or held-out rows.
- [ ] Run the frozen three-spacing SDAK (`M1`) matrix separately, again at least 612 forward runs.
- [ ] Run independent cases in isolated parallel processes within measured RAM limits; preserve a
  live log, stderr, exit status, checkpoint/result bytes, and immutable manifest entry per case.
- [ ] Stop and invalidate by name on any domain contact, convergence failure, symmetry split,
  protocol mismatch, environment violation, or missing witness. Do not silently retry into the
  published artifact.
- [ ] Verify each completed cohort before allowing it into the aggregate, then generate the
  conservative-intersection diagrams and reports with both agreements and disagreements stated.

### WP7 — execute held-out validation

- [ ] Run the frozen growth-rate comparison and publish residuals against source uncertainty over
  its named (T, supersaturation, geometry, size, pressure) domain.
- [ ] Run the frozen size-dependent-habit comparison at every registered size rather than selecting
  the size whose class is favorable.
- [ ] Run the frozen pressure comparison with diffusivity and latent-heating limitations carried
  explicitly; do not attribute a mismatch to one omitted mechanism without a discriminating test.
- [ ] Run the frozen schedule/history comparison using decision 0011 event semantics and compare
  predeclared observables at predeclared times/sizes.
- [ ] Report each family independently. Failure or non-comparability in one family is not averaged
  away by another, and P3-active outcomes remain in-sample even when a held-out observable is used.

### WP8 — gate, publication, and handoff

- [ ] Build one flagless Phase 6 gate whose preflight and evaluator re-derive every obligation from
  committed evidence: freeze identity, numerical controls, R15 conservative intersection, separate
  arms, preview GPU count/provenance, all four held-out families, diagrams, reports, and evidence
  labels.
- [ ] Execute all registered negative controls and prove each named mutation occurred independently
  of the verifier it attacks.
- [ ] Run exact `npm test`; no substitute command counts as the required local check.
- [ ] Obtain a non-author closing review that states model/context provenance, independently
  re-executed checks, and explicit limits.
- [ ] Reconcile the charter, ADRs, solver specs, plan, `docs/PROGRESS.md`, `docs/HANDOFF.md`, reports,
  and user-facing evidence labels. Phase 6 changes to complete only if the artifact-derived gate
  exits zero.

## Evidence topology

```text
primary sources + currency audit
              │
              ├── held-out target freeze ───────────────┐
              │                                         │
numerical reconnaissance (non-transferable)             │
              │                                         │
              └── production protocol + ADR freeze      │
                               │                         │
              ┌────────────────┼───────────────┐         │
              │                │               │         │
       float64 CAK R15   float64 M1 R15   preview GPU    │
              │                │               │         │
              └────────────────┴──────┬────────┘         │
                                     │                  │
                         independent byte re-derivation │
                                     │                  │
                                     ├──────────────────┘
                                     │
                              flagless Phase 6 gate
```

The producer never supplies both sides of a comparison. The final gate consumes only committed
source freezes, protocol manifests, raw result artifacts, and independently derived evaluations.

## Out of scope

- Quietly redefining the registered headline to measured-only agreement.
- Amending the charter to replace GPU evidence with the CPU oracle or to defer held-out validation.
- Tuning CAK, M1, the habit thresholds, the ambiguity band, or the reference boundaries to improve
  agreement.
- Implementing M2 or inventing a facet-width closure without independently sourced parameters.
- Treating a diagnostic size ladder as registered validation evidence.
- Claiming general WebGPU, Metal, or cross-architecture portability beyond executed configurations.
- Deleting or rewriting superseded evidence. Historical artifacts remain tracked and labeled.
- Beginning Phase 7 work while this gate completion is active.

## Tried and rejected

**Narrow O1b by ADR and charter amendment.** Rejected by maker direction on 2026-08-01. It would
save resources but leave the registered scientific work undone.

**Blindly execute the old N = 64 remediation.** Rejected by measurement: N = 64 fails against N =
80 at three of four registered spot-check points. Spending a full sweep there would knowingly
produce evidence that fails its own prerequisite.

**Treat N = 80 or extent 29 as adequate because a favorable habit class is stable.** Rejected.
The registered attached-count criterion still fails at sampled points, and physical size is an
observable, not a numerical refinement knob.

**Publish 3/90 and 54/90 as the registered headline.** Rejected. They are valid measured-only
counts, while ADR 0026 requires a conservative intersection that consumes grid-extrapolated
classes.

**Use the float64 CPU rows to satisfy the preview GPU clause.** Rejected. The charter names the
headless GPU harness and preview budget explicitly.

**Run the existing GPU LK v5 path as if it were CPU v6.** Rejected. V5's gather-order reduction is
not D6h-equivariant, the GPU path refuses M1 and v6 today, and binary32 cannot inherit a float64
tolerance without a derivation.

**Choose held-out targets after seeing which ones agree.** Rejected. Targets, extraction,
uncertainty, scoring, and failure handling freeze before model output is generated.

**Let resource exhaustion become a passing scientific result.** Rejected. Resource measurements
are reported and may trigger a maker-visible engineering redesign, but they cannot relax a frozen
criterion or turn absence of evidence into validation.

## Open questions

- Which primary-source observations survive the currency/independence audit for each held-out
  family? WP1 answers this before target freeze.
- What physical crystal size or size strata make the Nakaya comparison apples-to-apples with the
  selected reference? This must be sourced and frozen, not inferred from the prior ladder.
- What domain/grid/timestep configuration passes at the eventual physical sizes? WP2 measures it;
  no value is assumed here.
- Can a v6 float32 solver meet a derived, independently justified error envelope at preview scale?
  If not, the mismatch is escalated as a scientific/implementation blocker rather than waived.
- What exact wall-clock, storage, and RAM/VRAM budgets follow from the passing configuration?
  Reconnaissance records them; the maker's science-first direction determines that cost alone does
  not cancel the work.
