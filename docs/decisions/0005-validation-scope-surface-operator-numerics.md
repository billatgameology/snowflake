# 0005 — Validation scope, the coupled surface operator, and quasi-static numerics

- **Date:** 2026-07-14
- **Status:** accepted (maker review, 2026-07-14). **Amends 0003**; does not supersede it.
  **Amended in part by [0006](0006-audited-surface-operator-numerics.md) (2026-07-15):** D2
  item 3's bare "vapor lost equals ice gained," D2's implemented interface name, D3's
  residual-only convergence + scalar `v_n·Δt/Δx` fill-CFL, and D4's convergence-control
  freeze are re-stated there after implementation audits measured their failure modes. Inline
  notes below mark the amended clauses; the rest of this record stands. **Amended again for
  forward LK policies by [0009](0009-source-constrained-boundary-pixel-policy.md)
  (2026-07-16):** the v3 per-contact classifier/geometry is historical, forward fill and sink
  use a checkpointed aggregate boundary-pixel policy, and D4 freezes that policy.
- **Charter impact:** §1.5, §2.4, §2.5, §2.6, §2.7, §3.2 (Phases 2b, 3, 4, 6), §3.3 amended in
  this session (charter v1.2 → v1.3). Phase 2b was **paused** until its two opening deliverables
  (D2 below) existed; that condition was fulfilled before implementation on 2026-07-15.

## Context

A maker-led review of charter v1.2 against the actual sources (the Snow Crystals monograph via
the `research/1910.06389v2-llm` extraction, and Gravner–Griffeath §VI.C) found three blockers
that decision 0003 left unaddressed, plus a set of protocol and taxonomy gaps. Each was a place
where the project's stated identity — epistemic honesty — was about to be quietly violated by
its own founding documents.

1. **Target leakage into Phase 6.** The charter called the Phase 2b parameter table "measured
   physics" and treated the Nakaya comparison as independent validation. But the source itself
   says the narrow-facet SDAK dip locations were *chosen to impose agreement with Nakaya* and
   remain substantially uncertain (monograph, extraction p. 153). Large-facet measurements alone
   do not produce the full reversal sequence. Pre-registration (v1.2) prevents *later* tuning,
   but cannot remove leakage already baked into the SDAK curves: a model whose inputs were fitted
   to the target diagram "reproducing" that diagram is an in-sample result, however frozen the
   protocol.

2. **An uncoupled surface is not a physical model.** 0003 said "replace only the attachment
   thresholds." But the physical surface condition couples vapor flux and Hertz–Knudsen growth
   through a Robin boundary condition — the monograph derives the flux balance and
   `v_n = alphaHK · v_kin · sigma_surf` *together* (p. 94). Retaining G–G's independent `κ`
   freezing transfer while separately accumulating `v_n` can double-count vapor uptake, or
   disconnect vapor loss from ice gain entirely. The repo's own docs had already found the
   symptom (`b` is a mass ledger, `f` is dimensionless — attachment-kinetics §4.2) without
   naming the disease: there is no coupled surface operator specified at all.

3. **Two diffusion models were being reasoned about as one.** The charter specifies a
   quasi-static (Laplace) vapor field; attachment-kinetics §4.3 assigned physical time to
   individual Jacobi sweeps and derived an iteration count from it. Those are different
   formulations — transient diffusion has stability timesteps; quasi-static diffusion is an
   elliptic solve to a residual tolerance. Worse, the relaxation count scales like `(L/Δx)²`, so
   *thousands of Jacobi iterations are entirely expected* — the plan's claim that "thousands
   proves a unit error" was simply wrong.

Also corrected here, because 0003 asserted it and the §VI.C extraction disproved it: **"without
noise, sidebranching never seeds" is false as stated.** G–G's published 3D snowfakes — including
the branching ones — are deterministic; §VI.C's randomization is a *proposal*, carried from
their 2D work. Deterministic dynamics from a symmetric seed produce (perfectly symmetric)
branching. Noise is the labeled dial for *natural, asymmetric* sidebranching, and it remains the
right design for LibbrechtKinetics runs — but it is a realism mechanism, not an existence
requirement for branches.

## Decisions

### D1 — Phase 6 input provenance; in-sample vs held-out validation

Every input to the solver is classified into one of four provenance classes, recorded in
`docs/libbrecht-parameters.md` per entry:

- **P1** — measured broad-facet kinetics (instrument data, stated uncertainty);
- **P2** — fitted or inferred quantities (functional forms, fits; stated domain of validity);
- **P3** — Nakaya-informed SDAK hypotheses (dip locations/depths chosen to impose agreement
  with the morphology diagram);
- **P4** — numerical / discretization choices (Δx, tolerances, interpolation schemes, noise
  amplitude…).

Phase 6 **reports no-SDAK and SDAK runs separately.** Wherever P3 inputs are active, the Nakaya
comparison is labeled **in-sample reproduction**, never independent validation. Independent
validation uses **held-out observables**: growth rates vs (T, σ), size-dependent habit, pressure
dependence, and history/timeline responses — data the inputs were not tuned against.

The no-SDAK Nakaya probe becomes a first-class scientific result in its own right: does the
measured large-facet crossing alone produce *any* habit reversal? Either answer is publishable
within the project's own terms.

### D2 — The coupled surface operator (amends 0003's "replace only the attachment thresholds")

The seam is not a per-cell threshold swap; it is the **whole surface exchange step**. Before any
`LibbrechtKinetics` code, Phase 2b produces a written **surface-operator specification** defining,
together, as one coupled operator:

1. normalization of `d` → dimensionless σ (and where σ_surf is sampled: before/after which
   substep);
2. facet classification / local normal estimation (what `(n_T, n_Z)` is trusted for, and where
   it is not enough);
3. vapor flux into the surface cell and ice-volume gain, **coupled** so that vapor lost equals
   ice gained (the Robin-condition discipline: flux balance and `v_n` are one equation system,
   not two mechanisms); *(amended by 0006: the exact discrete claim is kinetic-demand
   bookkeeping—placed fill + recorded unapplied saturation excess = computed kinetic demand—
   not a bare physical-uptake equality; 0009 changes forward demand geometry from per-contact
   to aggregate per-boundary-pixel while preserving this auditability posture)*;
4. the fill state (the deterministic accumulator survives from v1.2) and its storage;
5. the explicit disposition of `κ`, `μ`, melting, and hole-filling under `LibbrechtKinetics` —
   each *kept / replaced / disabled*, with a reason; "identical under both rules" (gg-machinery
   §4) holds for `GGThreshold` and is **not assumed** for the kinetics rule;
6. the interface: a **surface-operator interface**, wider than a per-cell `shouldAttach`, owns
   per-cell state and mediates the exchange. *(Name synchronized by 0006 after implementation:
   the committed interface is `SurfaceOperator`; `AttachmentRule` was the superseded sketch.)*

Phase 2b's opening deliverables are therefore **two documents**: this operator spec and the
parameter table. **Phase 2b is paused until both exist.** GGThreshold/Phase 2a is unaffected.

### D3 — Quasi-static numerics: one formulation per rule, stated tolerances

- Under **`GGThreshold`**: diffusion is G–G's single masked-average pass per tick, exactly as
  published. That *is* their dynamics — machinery fidelity, no physical-time claim attached.
- Under **`LibbrechtKinetics`**: the vapor field is **quasi-static** — between growth steps the
  same smoother iterates to a stated **residual tolerance in a stated norm** (with convergence
  tests; accelerated elliptic solvers are allowed later, Jacobi is the baseline). Iteration
  counts are whatever the tolerance demands; `(L/Δx)²`-scale counts are expected, not a bug.
  The "n_diff in the thousands means the units are wrong" claim is **retracted**.
  *(Amended by 0006: fixed-σ Dirichlet convergence is DUAL — the divergence identity is
  required alongside the residual; reflecting LK remains a residual-only diagnostic with no
  divergence claim. Residual-only Dirichlet convergence passed fields whose imbalance grew
  with domain size.)*
- Physical time enters only through the **interface update**: constrain `v_n·Δt/Δx` (a
  fill-CFL) separately, as its own stability bound. *(Amended by 0006 and then 0009: the bound
  binds the per-cell kinetic fill increment under the recorded surface policy; per-contact
  face factors are `legacy-v3`, while forward v4 is aggregate per boundary pixel.)*

### D4 — Phase 6 protocol freeze: expanded; convergence controls; Phase 4 pass semantics

The freeze list (charter Phase 6, item 1) additionally includes: pressure; physical seed size;
Δx; interface timestep / fill-CFL bound; diffusion residual tolerance and norm; float precision;
parameter interpolation scheme; noise amplitude; seed-ensemble size; model/code version (commit
hash); and the uncertainty-reporting scheme. *(Amended by 0006: because fixed-σ Dirichlet
convergence is dual, freeze `divTol` and `relaxMaxSweeps` as well; both determine whether a
field is accepted as converged. Amended by 0009: freeze the coupled `surfacePolicy`.)*

The 65% domain-contact guard is a **collision heuristic**, not proof of far-field irrelevance:
Phase 6 adds **grid-, timestep-, and domain-convergence studies** at representative sweep points.

**Phase 4 runs its two passes with different statuses:** Pass A (`GGThreshold`) is **blocking** —
it certifies machinery and metrics. Pass B (`LibbrechtKinetics`) is **diagnostic** — a failed
Pass B is a reportable finding and does **not** block reaching Phase 6, which is precisely the
phase whose job is to report that failure properly.

### D5 — Timeline semantics are a named open design decision

Changing temperature changes `c_sat(T)`. Holding absolute vapor density fixed silently changes
supersaturation; holding supersaturation fixed silently creates or removes vapor everywhere in
the field (monograph p. 94 warns about exactly this). Before the timeline drives the real solver
(Phase 4's mid-growth milestone), a plan/ADR must define: the conserved field (absolute vapor
density vs σ relative to ice); what the timeline controls *mean* in those terms (and what the UI
exposes); jumps vs ramps at segment boundaries; and how the interior field and the far-field
reservoir transform when a segment boundary crosses. Until then, no timeline result carries any
physical reading.

### D6 — Epistemic labels: two independent axes; Phase 3 gains a metric

The four numbered confidence levels (§1.5) conflated provenance, validation, and units
(temperature *input* is not computed state; units do not imply validation). Replaced by two
independent labels carried by every user-visible quantity:

- **Type:** input | computed state | derived metric | phenomenological parameter.
- **Evidence:** unvalidated | qualitatively supported | quantitatively validated *(over a named
  domain)*.

Mapping for stale references: old levels 1–2 ≈ (their Type, Evidence: unvalidated/qualitatively
supported); old levels 3–4 ≈ Evidence: quantitatively validated over a named domain.

Phase 3's gate ("watch a facet center starve") gains an **automated center-vs-rim depletion
metric** (facet-center σ vs rim σ over time) alongside the visualization, restoring "every
scientific milestone is an automated metric."

## Consequences

- Phase 6's headline claim gets weaker and true: "in-sample reproduction with Nakaya-informed
  SDAK; independent validation on held-out observables." The project stops being able to
  accidentally claim the thing it exists to refuse to fake.
- Phase 2b costs more before its first line of kinetics code (two documents, one of them hard).
  That is the price of the surface being a physical boundary condition rather than a code seam.
  The differential-diagnosis structure (GGThreshold floor) is unchanged.
- The quasi-static solve makes per-growth-step cost scale like an elliptic solve, not one sweep.
  This strengthens the Phase 5 GPU case and was true all along; v1.2 was just not pricing it.
- Doc debt created deliberately, **discharged 2026-07-15 during the 0006 conformance sweep**:
  gg-machinery's "only step that is physics" framing and the noise-necessity claim were
  softened (attachment is the only *physically parameterized* step; diffusion is physical,
  while κ, μ, hole-filling, and noise are phenomenological). PROGRESS records the completed
  authority-chain truth pass.

## Alternatives considered

- **Keep Phase 6 as-is and rely on pre-registration.** Rejected: freezing a leaked input freezes
  the leak. Pre-registration binds future hands; it cannot unknow what the SDAK curves were
  built from.
- **Drop SDAK entirely to keep Phase 6 clean.** Rejected: SDAK is the best available hypothesis
  for the extreme morphologies, and the split-reporting design (D1) keeps the clean no-SDAK
  result *and* the hypothesis-bearing run. Choosing one would discard information either way.
- **Treat the seam as attachment-only and patch mass consistency later.** Rejected: double
  counting vapor uptake is not a patchable detail — it invalidates the mass bookkeeping that
  Phase 2a certifies, silently, under exactly the rule Phase 6 depends on.
- **Keep the physical-time-per-sweep derivation with a corrected constant.** Rejected: it is the
  wrong model, not a wrong constant. The quasi-static field has no per-sweep physical time; it
  has a residual.
