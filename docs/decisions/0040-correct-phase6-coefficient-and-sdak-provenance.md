# 0040 — Phase 6 tests coupled attachment-coefficient parameterizations, not curve crossings

- **Date:** 2026-08-02
- **Status:** accepted
- **Charter impact:** amends the document revision marker, the v1.18 current-revision status, the
  v1.17 revision-history description, §2.2, §2.4, §2.5, §2.6,
  §2.7, §3.1, §3.2 Phase 2b, §3.2 Phase 4, §3.2 Phase 6, and §3.3. It also authorizes correction
  and registration of a separately named current revision of `docs/libbrecht-parameters.md`.
  Historical artifacts and legacy manifest hashes remain preserved,
  but the corrected freeze invalidates the old sweep for the replacement gate and requires a rerun.

## Context

The Phase 6 soundness audit retracted a claimed structural bound that counted crossings of
`sigma_0_basal(T)` and `sigma_0_prism(T)` and treated them as habit transitions. The governing
attachment coefficient is `alphaHK = A(T)·exp(−sigma_0(T)/sigma_surf)`, and different evolving
facets generally do not share one `sigma_surf`. A `sigma_0` crossing alone therefore neither equals
an attachment-coefficient ordering swap outside restricted equal-prefactor/equal-field conditions
nor bounds a coupled morphology.

The same source-currency work also found published model-dependent inversions of narrow-facet
growth-rate observations supporting barrier reductions in approximate regions near −4 °C and
−14 °C. Surface supersaturation was not directly verified in those inversions. What remains
Nakaya-informed P3 is the exact M1 dip functional forms/placement and any Nakaya comparison using
them—not the observed approximate barrier-reduction regions. The M1 source prints `log` without a
base; this project's Figure-1-width-supported base-10 resolution is a P4 transcription choice, not
a source-printed P3 constant.

Several charter clauses still encoded the superseded interpretation or theorem-strength audit claim.
The inherited P1 definition also named only measured broad-facet kinetics even though the same
authoritative table had long classified directly adopted textbook material and transport inputs as
P1. That made the taxonomy contradict its own rows. The correction must distinguish direct
empirical/source-tabulated inputs from fits, inversions, derivations, and digitizations.

The same propagation audit found that the charter's v1.17 history promoted one exact
28³/40³ monopole comparison into removal of domain dependence “outright,” even though decision
0024 and its test record a smaller-domain break. The far-field selection remains accepted; only
the theorem-strength description is corrected.

That audit also found v1.18 clauses that had not caught up with already accepted v6/monopole
behavior or the implemented monopole/timeline seam: §2.4's convergence summary, §3.1's domain-guard
description, and the Phase 2b and Phase 4 clauses below. This decision repairs that charter drift in
the same accepted revision. It does not change historical behavior or evidence. Where the text
names proposed decision 0039, it states only the reviewed design's scope and pending status; it
does not grant that decision or a production resume path authority.

### Charter document marker being amended

> Project Document — v1.18, July 2026

### Charter v1.18 current-revision paragraph being amended

> Current revision. v1.18 (2026-07-28) — decision 0029, Phase 7 pre-solidification (maker-directed while Phase 6 remains in flight; no evidence claim changes and Phase 7 still begins after Phase 6). §3.2 Phase 7's "Explore / Lab / Sculpt modes" sketch is replaced by four view profiles over the one engine — Realistic, Scientific, Designer, Developer — where a profile changes UI composition and rendering only and every profile reads and writes the same decision-0011 environment-schedule artifact. The snowcrystals.com growth footage under research/snowcrystals.com-videos is named the Realistic/Designer visual target: transparent refractive ice colored by the backdrop gradient, preserved interior relief, near-orthographic face-on default camera, and continuous edge advance rendered from the LK fill fraction as a level set. A timeline ramp is UI sugar that compiles to a dense staircase of decision-0011 abrupt events (at most one per interface step — the solver's native temporal resolution, since physical time advances only in the interface update), adopted conditionally on a recorded step-halving convergence check; continuous within-step variation is rejected. The Designer profile compiles growth intents through the model's own Phase 6-produced morphology diagram into a schedule grown forward by the real solver, with full inverse design out of v1 scope; the Developer profile plays repo-committed scene scripts read-only with deterministic frame capture.

### Charter v1.17 revision-history description being amended

> Prior revision. v1.17 (2026-07-27) — decisions 0024–0027, Phase 6 pre-sweep. §2.4 gains a third far-field condition, monopole-matched, and Phase 6's registered condition changes from fixed-σ Dirichlet to it: the Dirichlet shell holds σ∞ at a finite radius and therefore over-supplies vapor by an amount that GROWS with the crystal — about 46% at 48³ and ~160% at Phase 2b's own configuration — while monopole matching removes the domain dependence outright (a measured 4.1% swing becomes 0.0%). The v1.2 wording that mandated Dirichlet "for every Phase 6 validation run" predated that measurement; §3.2's freeze list now requires the condition be NAMED rather than fixing which one it is. §3.2 Phase 6 item 1 also gains two freeze rows the pre-registration was missing: how a model habit class is scored against the reference regimes (decision 0025) and how an extrapolated quantity is computed and when it is refused (decision 0026). Phase 2b, 4 and 5 evidence keeps the condition that produced it and is never pooled with a Phase 6 sweep.

### §2.2 clause being amended

> One nuance to hold onto: "skipping the liquid phase" is true macroscopically, but the ice surface carries a nanoscale premelted, quasi-liquid layer that matters enormously to attachment physics. G–G represents it abstractly as a boundary-mass field. Under LibbrechtKinetics its effects are folded into measured attachment parameters rather than simulated as a second mass pool. It never needs to be rendered as liquid, but the representation must be explicit.

### §2.4 numerical-convergence clause being amended

> How "quasi-static" is enforced (added v1.3, decision 0005; convergence criterion corrected v1.4, decision 0006; surface geometry corrected v1.7, decision 0009; float64 identity corrected v1.11, decision 0013; roundoff scope bounded v1.12–v1.13, decision 0014). Quasi-static is an elliptic statement, not a timestep one, and the two attachment rules treat it differently by design. Under GGThreshold, diffusion is G–G's single masked-average pass per tick — that is their published dynamics, machinery fidelity, with no physical-time claim attached. Under LibbrechtKinetics with the fixed-σ Dirichlet condition used for physics runs, the field is relaxed between growth steps until BOTH a stated iterate-residual tolerance in a stated norm AND the divergence identity of the discrete solve are met — the identity is part of convergence itself, because residual-only convergence was measured passing fields whose imbalance grew with domain size (decision 0006). Executed legacy-v3 and aggregate-v4 compare far-field injection with signed net numerical surface-boundary exchange. The new aggregate-v5 policy compares that exchange with far-field injection plus the independently metered signed change created by the float64 reflecting smoother before boundary replacement and shell clamp; exact arithmetic makes that third term zero, while the actual float64 term prevents harmless stencil roundoff from becoming a relative floor at weak cold exchange (decision 0013). Both forms use the same `divTol`; for a nonzero field, aggregate v5 also requires `abs(smoother drift) <= 1024 * activeCellCount * max(Number.EPSILON * maxAbsSweepInput, Number.MIN_VALUE)`, with an exact-zero-field special case and the positive fixed-temperature gate independently substituting `sigmaInfinity` for the field maximum (decision 0014). A finite or identity-canceling term outside that bound is a solver failure. The minimum-subnormal ULP floor keeps the accepted subnormal field domain covered without affecting the registered `sigmaInfinity = 0.002` condition. The new term is a numerical diagnostic, never vapor or uptake. Local boundary-replacement deltas may have either sign because the field is a potential; they are never called uptake or deposited. Reflecting LibbrechtKinetics mode is diagnostic-only: it has no far-field injection, makes no divergence-identity claim, and converges by residual alone. Iteration counts scale like (L/Δx)² and large counts are expected, not evidence of a unit error. Physical time enters only through the interface update, bounded separately by the fill-CFL on the geometry-adjusted per-boundary-pixel kinetic increment defined by the recorded surface policy (see Phase 2b; decision 0009).

### §2.6 clause being amended

> Gravner–Griffeath mesoscopic model — the computational skeleton (amended 2026-07-14; this section previously called it "the implementation blueprint"). Their 3D version runs on the stacked triangular lattice, carries per-cell fields (diffusive vapor mass, boundary/semi-liquid mass, crystal state), and cycles through diffusion → freezing → attachment (with geometry-dependent thresholds) → melting steps. It reproduces plates, solid and hollow columns, sandwich plates, ridges, and dendrites at feasible compute cost. G–G's chief contribution here is computational machinery, not the physically parameterized attachment law: it answers "how do you compute 3D crystal growth on a lattice at feasible cost." `GGThreshold` keeps its complete published cycle as the control. `LibbrechtKinetics` shares the lattice and diffusion stencil but replaces the surface exchange as a coupled whole — the attachment thresholds and the disposition of freezing/melting are decided together in the Phase 2b surface-operator spec (decision 0005 amending 0003; "only the attachment thresholds are replaced" understated the seam). G–G's §VI.C randomization is a proposal in the paper; their published 3D snowfakes, branches included, are deterministic. Noise is the labeled dial for natural, asymmetric sidebranching, not an existence requirement. The thresholds' honest limitation, and the reason for replacement in LK, is that they are phenomenological knobs containing no temperature, so the relationship to physical (T, σ, p) is not merely unknown, it is unaskable. The model also omits latent-heat transport and some surface-diffusion effects — known, acceptable approximations for v1.

### §2.5 coefficient clause being amended

> It differs between basal and prism facets, and both depend on temperature and σ_surf. The Nakaya diagram is, in Libbrecht's model, the story of α_basal(T, σ) and α_prism(T, σ) trading places.

### §2.5 clause being amended

> Two warnings attached in v1.3 (decision 0005). Provenance: the broad-facet forms of the attachment coefficient are measured; the SDAK narrow-facet dips are not — their locations were chosen to impose agreement with the Nakaya diagram and remain substantially uncertain (monograph). SDAK-bearing inputs are provenance class P3 (§2.7), and any Nakaya comparison that uses them is in-sample reproduction, not independent validation. Coupling: the surface is one boundary condition, not two mechanisms — the monograph derives the continuous vapor flux balance and `v_n = alphaHK·v_kin·σ_surf` together (a Robin condition). The discrete solver therefore owns the field boundary condition, kinetic demand, and placed fill in one `SurfaceOperator`; running G–G's freezing transfer alongside it would double-count. Its exact v1 claim is narrower than continuous vapor-loss = ice-gain equality: only placed fill advances ice, saturation excess is recorded but unapplied, and signed numerical surface exchange versus computed demand is a measured discretization diagnostic, never an identity (v1.4–v1.7, decisions 0006 and 0009).

The source-causality wording in the same section is also amended:

> SDAK (structure-dependent attachment kinetics) — Libbrecht's key hypothesis: α also depends on the width of the facet. Narrow facets grow more easily, which makes them narrower, which makes them grow more easily — a positive feedback that produces thin plates, sharpening edges, and hollow columns.

### §3.2 Phase 6 clause being amended

> The falsifiable test: does the model reproduce the habit reversals? Plates near −2 °C, columns near −5 °C, plates again near −15 °C, columns below −30 °C. Scoped honestly (v1.3, decision 0005): no-SDAK and SDAK runs are reported separately; with Nakaya-informed (P3) SDAK inputs active, matching the diagram is in-sample reproduction — the no-SDAK probe (does the measured large-facet crossing alone produce any reversal?) is a first-class result in its own right, and independent validation runs against held-out observables (growth rates, size-dependent habit, pressure dependence, histories; §2.7).

The full §3.2 Phase 6 protocol-freeze paragraph is amended. The shorter re-freeze sentence is
embedded in this clause and is not treated as a substitute quotation for the touched paragraph:

> Protocol freeze (added v1.2 — pre-registration; expanded v1.3–v1.4 and v1.7, decisions 0005–0006 and 0009). Before the first validation sweep runs, freeze docs/libbrecht-parameters.md and a written validation protocol: the T/σ grid; the far-field boundary condition (named per §2.4; monopole-matched as of v1.17, decision 0027); how a model habit class is scored against the reference regimes, including the treatment of a neutral class and the near-boundary ambiguity band (added v1.17, decision 0025); how any extrapolated quantity the report consumes is computed and when it is refused (added v1.17, decision 0026); the crystal size at which habit is measured — habit is size-dependent, so measuring at a stated maximum dimension is what keeps comparisons apples-to-apples; metric thresholds; domain budgets; and pressure, physical seed size, Δx, the named surface policy, the fill-CFL bound, the diffusion residual tolerance and its norm, the divergence-identity tolerance, the relaxation-sweep cap, float precision, the parameter interpolation scheme, noise amplitude, seed-ensemble size, the model/code version (commit hash), and the uncertainty-reporting scheme. Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior sweep results — the full sweep re-runs. This is what makes "a negative result is a result" survive contact with a disappointing plot.

### §2.7 clauses being amended

> There is no validated end-to-end map from real conditions (T, σ, p) to mesoscopic model parameters. Libbrecht's model is physically grounded but his published numerical work largely uses reduced geometry; Gravner–Griffeath produces the 3D shapes but with abstract knobs. Nobody has fully closed the loop, and this project lives in the gap.

> Amended again 2026-07-14 (decision 0005): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 measured broad-facet kinetics; P2 fitted or inferred quantities (with stated domain of validity); P3 Nakaya-informed SDAK hypotheses (dip locations chosen to impose agreement with the diagram); P4 numerical/discretization choices. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Independent validation runs against held-out observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses.

The acceptance audit found that current v1.19 still omitted three exact metrological definitions
used directly by the solver. This decision therefore also amends the following complete current
§2.7 clause, quoted verbatim before this follow-up correction:

> Amended again 2026-07-14 (decision 0005; provenance split and taxonomy corrected 2026-08-02 by decision 0040): "Libbrecht's measurements" was too generous, and the circularity the v1.1 amendment removed from our side survives on the source's side. Every solver input carries a provenance class: P1 measured or source-tabulated empirical inputs adopted directly (including instrument broad-facet data and textbook material/transport properties, with stated uncertainty or precision); P2 fitted, model-inferred, project-derived, or figure-digitized quantities (with a stated domain of validity); P3 Nakaya-informed prescriptions, including the exact M1 dip functional forms/placement chosen using the diagram; P4 numerical/discretization choices, including this project's base-10 resolution of the M1 source's unstated logarithm base from its plotted dip widths. A source fit or inversion does not become P1 merely because its paper is authoritative. Published model-dependent inversions of narrow-facet growth observations can support the existence and approximate temperature regions of barrier reductions without promoting the exact M1 prescription out of P3. Phase 6 reports no-SDAK and SDAK runs separately; wherever P3 inputs are active, matching Nakaya is in-sample reproduction. Independent validation runs against held-out observables the inputs were not tuned to: growth rates vs (T, σ), size-dependent habit, pressure dependence, and growth-history responses.

The plan clause being amended is:

> The plan of attack (amended 2026-07-14, decision 0003). The original plan was empirical and, in hindsight, circular: sweep G–G's knobs, measure the morphologies, build an atlas, and map temperature controls onto it after the fact. That fits a curve; it does not close a loop. Because the solver now takes temperature as a physical input (§2.5), the plan is instead to attempt the loop directly: extract σ₀(T), A(T), v_kin(T) and D(T, P) from Libbrecht's measurements into the model, run the solver at a stated temperature, and check the morphology it produces against the Nakaya diagram and Libbrecht's controlled-growth results.

### §3.2 Phase 2b clause being amended

> SDAK last, and gated. It is the least certain piece — Libbrecht's attachment coefficient depending on facet width requires a local geometric query over surface cells, attackable but unpublished at this resolution. It is deliberately last because it is not load-bearing for the Phase 4 hollowing gate (see §2.4 and decision 0003): hollowing comes primarily from the Berg effect amplified by the nonlinearity of A·exp(−σ₀/σ_surf), and survives dropping the width term. SDAK buys the extreme thin plates and needles, not basic hollowing.

The same Phase 2b section still described only v5 and two far-field conditions even though accepted
decisions 0023, 0024 and 0027 govern v6 and monopole matching. These clauses are amended too:

> Physical units: Δx in microns, Δt in seconds, D in m²/s. Physical time attaches to the interface update, bounded by the fill-CFL on the per-cell kinetic increment `alphaHK·v_kin·sigma_b·Δt/(H_b·Δx)` under the recorded surface policy. `aggregate-hv-g1h1-v5` retains v4's surface physics: `[01]` basal and `[20]` prism are aggregate boundary pixels with the source's `H_b = 1`; the same unit value on other configurations is an explicit P4 simplification (v1.7, decision 0009). V5 differs only in the float64 divergence identity and mandatory operation-count roundoff bound specified in §2.4 and decisions 0013–0014; `aggregate-hv-g1h1-v4` remains immutable executed history. The v1.4 per-contact expression `[(2/3)·n_T + n_Z]·alphaHK·v_kin·sigma_face·Δt/Δx` remains only the executed `legacy-v3` policy, because correcting its broad prism from `[10]` to `[20]` exposed a `4/3` normal-speed conflict. Under fixed-σ Dirichlet, the vapor field itself is quasi-static — relaxed until the stated residual tolerance, policy-versioned divergence identity, and any policy-specific numerical diagnostic bound all hold (v1.4, v1.11, and v1.12; decisions 0006, 0013, and 0014), with (L/Δx)²-scale iteration counts expected (§2.4). Reflecting LibbrechtKinetics remains a residual-only diagnostic mode with no physical claim. (v1.3, decision 0005: the v1.2 phrasing that derived a "principled number of diffusion iterations" from per-sweep physical time mixed transient and quasi-static formulations and is retracted.)

> Both far-field boundary conditions (§2.4): reflecting (2a's default, unchanged) and fixed-σ Dirichlet, selectable per run and recorded in checkpoint metadata. The strengthened Dirichlet gate starts both runs depleted: Dirichlet returns everywhere to the set value with injected field change metered and balancing, while the identical reflecting run conserves and settles depleted. Reflecting LK artifacts remain diagnostic-only and cannot support a physics claim. (Added v1.2; evidence scope clarified v1.4.)

The Phase 2b parameter-table paragraph is also amended because its universal taxonomy/citation rule
contradicts the corrected table's explicitly scoped analytic and project-derived entries:

> The parameter table is one of Phase 2b's two opening deliverables (with the surface-operator spec): docs/libbrecht-parameters.md — σ₀(T) and A(T) for basal and prism, v_kin(T), and D(T, P), extracted with citations from arXiv:1910.09067 and, for the standard kinetic-theory forms (v_kin, D), the Snow Crystals monograph (amended v1.2 — the previous single-source rule would have blocked textbook constants). Every entry carries a provenance class (P1–P4, §2.7) and canonical units — σ₀ is a dimensionless fraction, and the percent-vs-fraction ambiguity is a 100× exponent error waiting in the cited tables (v1.3). That table is the mapping layer. No number enters it without a citation.

### §3.1 domain-guard clause being amended

> Testing. Deterministic seeds throughout (see determinism scope above). An automated morphology-metrics module (aspect ratio, hollowness index, branch count, sixfold-symmetry error) turns visual milestones into a regression suite: when a later optimization silently breaks hollowing, a test fails. The metrics module also enforces a domain-contact guard (added v1.2): any run in which the crystal's bounding box exceeds ~65% of any domain extent is automatically flagged invalid — a crystal near the wall interacts with its own mirror image (reflecting boundary) or with a clamped edge (Dirichlet), corrupting the field silently while the shape still looks plausible. Flagged runs never enter validation results.

### §3.2 Phase 4 clause being amended

> Conditions changing mid-growth: the timeline drives the real solver. Done when a **column→plate** history yields a capped column (direction corrected v1.9, decision 0011, to match G-G §XII and the intended geometry). Events are deterministic abrupt jumps; ramps are unsupported. A G-G event replaces registered parameter vectors while leaving `a`, `b`, and `d` bit-unchanged. An LK temperature event conserves interior absolute vapor number density by transforming each active unattached cell as `sigmaNew = (1 + sigmaOld)·cSat(oldT)/cSat(newT) − 1`; attached cells and inactive walls are excluded, and negative results are not clamped. The active Dirichlet shell is transformed too, then the next elliptic solve clamps it to the schedule's explicit `sigmaInfinity` and reports that reservoir exchange only as a numerical boundary diagnostic. Temperature-derived kinetics and conversion factors update atomically; cross-temperature demand bookkeeping uses each step's temperature rather than the final temperature for the whole history. Existing checkpoint meanings do not change; the schedule and event log accompany final-state evidence.

### §3.2 and §3.3 freeze claims being amended

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation — the protocol freeze (item 1) makes that structurally impossible rather than merely forbidden.

> Phase 6 runs pre-registered (added v1.2). The parameter table and validation protocol freeze before the sweep; post-freeze edits are ADR-logged and force a full re-sweep. Quiet tuning is not a discipline failure that review catches — it is structurally impossible to hide.

Decision 0025 declared no charter impact while registering the same crossing-language premise. That
claim is superseded here: the current charter literally contains the premise, so correcting it is a
charter amendment.

## Decision

1. Replace “measured large-facet crossing alone” with “the full implemented broad-facet attachment
   parameterization with recorded P1/P2 provenance.” The no-SDAK arm remains a first-class
   falsifiable forward-solver result, but no curve-crossing diagnostic is promoted to morphology.
2. Split narrow-facet provenance precisely. Published model-dependent inversions of narrow-facet
   growth-rate observations support the existence and approximate temperature regions of barrier
   reductions; they do not directly verify surface supersaturation. The exact M1 dip functions and
   placement used for Nakaya comparison remain substantially uncertain, Nakaya-informed P3, and
   in-sample. The paper leaves the logarithm base unspecified: retain the Figure-1-width-supported
   base-10 implementation as an explicit P4 transcription choice, separate from the P3 prescription.
3. Restricted attachment-order calculations remain input-function diagnostics only. They compare
   alphaHKBasal and alphaHKPrism at the same positive surface supersaturation and are named
   `basal-higher`, `prism-higher`, or tie—never `plate`/`column`, habit transitions, or a Nakaya
   score. Habit labels are derived only by the frozen evaluator from published 3-D forward-run
   artifact bytes.
4. The historical analytic plate/column labels and 15-of-15 Nakaya score are retracted and are
   inadmissible to future gates. Historical evidence is not rewritten: CAK and M1 run artifacts
   retain their measured classes and hashes, while CAK→M1 remains a confounded comparison. The
   replacement protocol intends a new matched M1/no-dip pair and must register it before execution.
   Only that pair may support a causal statement about the implemented dip factors' effect on this
   solver's outputs under the frozen configuration; it cannot establish physical SDAK causality or
   necessity in nature.
5. Correct the authoritative parameter/specification documents to distinguish broad-facet CAK,
   the everywhere-narrow M1 approximation, and the still-unimplemented width-dependent M2 closure.
   After this decision is accepted, preserve the historical table constant and both legacy values
   manifests on their old hashes, then register a separately named current parameter-table revision
   and redirect only the current-file integrity assertion to it. Arm 1's legacy values manifest
   carries the historical table digest; arm 2's independently frozen M1 values manifest never did,
   so preserving it means retaining that exact key set rather than adding a post-result field. The
   R15 values/protocol hash freezes
   later, only after WP1/WP2 supply its held-out and numerical inputs; that replacement protocol then
   consumes the new table revision and reruns the full sweep.
6. Replace unqualified priority and “structurally impossible to hide” claims. The reviewed corpus
   establishes the project's scope, not universal priority; versioned freezes make authorized edits
   auditable and undisclosed drift detectable, not misconduct impossible.
7. Clarify the P1/P2 boundary without promoting fits. P1 is a directly adopted authoritative source
   quantity: either a measured/source-tabulated empirical input or an exact metrological definition.
   Empirical entries state uncertainty or precision; exact definitions state their defining
   authority and exact status. P2 covers fitted, model-inferred,
   project-derived, and figure-digitized quantities, with a stated domain. A fit or inversion stays
   P2 even when it appears in an authoritative source. Binary representation of an exact decimal
   definition is P4 precision policy, not a change in the quantity's P1 provenance. P3 meaning is
   unchanged. Scope the
   Phase 2b table rule accordingly: every adopted solver input carries P1–P4 and canonical units;
   every adopted source value/transcription has a citation; project-derived values and P4 choices
   name their operands/method; and analytic or contextual non-input quantities are explicitly
   labeled outside P1–P4.
8. Correct the model-limit claims that followed from the old provenance wording. Premelting enters
   LibbrechtKinetics only insofar as the recorded parameterizations encode it; the project has not
   shown that all premelting effects are quantitatively absorbed. Likewise, latent-heat transport
   and explicit surface-diffusion dynamics are known omissions, not automatically acceptable
   approximations for a validation claim. Their regime-dependent error must be quantified or
   carried as a stated systematic before such a claim is made.
9. Correct theorem-strength numerical justifications without changing historical values. The exact
   28³/40³ monopole equality does not establish general domain independence; the size/domain/grid/
   timestep reconnaissance does not transfer outside its executed composition; and far-field
   coefficient diagnostics do not assign a dominant mechanism or habit. Use ADR 0033's split to
   append new arm-1 and arm-2 justification/combined hashes while preserving both values hashes and
   every historical revision.
10. Synchronize the stale transport, domain-guard, Phase 2b and Phase 4 descriptions with accepted
     decisions 0023, 0024 and 0027 and the existing tested monopole/timeline implementation. Keep
     proposed decision 0039 explicitly nonbinding: its reviewed core design may be implemented only
     under the active plan, and its WP3-dependent runner/evidence contract remains deferred.
11. Acceptance promotes the reviewed revision to current charter v1.19 dated 2026-08-02, changes
    the document marker to v1.19/August 2026, and relabels the quoted v1.18 paragraph as the prior
    revision without changing its substantive record. This status transition makes the reviewed
    amendments authoritative; it does not retrospectively date acceptance to the draft date.

## Consequences

- The charter, solver spec, live interpretation, scripts and tests must use coefficient-order
  terminology at the restricted analytic seam and habit terminology only for forward morphology.
- M1 results remain in-sample for Nakaya. Model-dependent inversions of narrow-facet growth
  observations do not turn the exact M1 functional form into held-out physics.
- The source's M1 prescription remains P3 while the project's base-10 resolution of its unstated
  logarithm base is P4; neither is relabelled as a direct measurement or source-printed base.
- The parameter table's P1 labels on directly adopted textbook properties no longer contradict the
  taxonomy. The exact Boltzmann constant, Celsius/kelvin offset, and standard-atmosphere conversion
  are P1 authoritative definitions with no empirical uncertainty; their binary representation is
  P4 precision policy. Associating the monograph's approximate `D_air` specifically with exact one
  standard atmosphere is a P2 project-derived/model-inferred closure because the source says only
  "typical atmospheric conditions." Derived constants, source fits/inversions, and digitized curves
  remain P2 or P3 as applicable.
- Correcting the inherited pressure-row justification moves only the current prose/combined
  manifest identities. Arm 1 is now `52697efb…` / `ea9c76fc…` and arm 2 is `e2f7f24c…` /
  `4be5c82d…`; their immediately preceding identities remain in ordered revision history. Both
  values hashes remain byte-for-byte unchanged, so no historical executed artifact is relabelled.
- Registering the corrected table revision does not rewrite either historical Phase 6 values
  manifest and does not prematurely freeze R15. Arm 1 keeps its historical table-digest field; arm 2
  keeps its historical absence of one and its independent values hash. The new path only gives the
  current authoritative table its own identity and restores a meaningful current-file integrity
  check for future use. After the acceptance-audit metrology repair, the LF-normalized current file
  is 50,464 bytes with SHA-256
  `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`;
  `PHASE6_CURRENT_PARAMETER_TABLE_SHA256` names it separately from the immutable legacy constant.
- Premelting, latent-heat transport, and explicit surface diffusion remain model limitations whose
  possible error is stated or measured rather than presumed to be folded into the fitted inputs.
- Monopole matching remains the registered far field, but its measured equality is scoped to the
  named configuration/domain pair; every replacement domain still requires its own numerical check.
- The historical CAK broad-facet forward run's named failure to reproduce the registered diagram at
  its executed size/domain survives. The confounded M1 comparison, former necessity claim, priority,
  and causal explanation do not gain that measured-only status.
- R15's replacement protocol must register all three intended arms and may report only the
  M1/no-dip matched pair as a causal ablation of the implemented dip factors within the frozen
  solver configuration. That intervention does not establish physical SDAK causality or necessity
  in nature.
- Current charter v1.19 names all three far-field conditions and v6 consistently at the affected
  seams. This documentation repair does not relabel old evidence, accept decision 0039 or authorize
  a resumable production campaign.

## Alternatives considered

- **Leave the charter as historical wording and correct only reports** — rejected because the
  charter is the governing spec and would continue to regenerate the false inference.
- **Call every SDAK input measured** — rejected because the exact M1 dip placement/form was chosen
  against Nakaya and remains P3.
- **Call every narrow-facet effect unmeasured** — rejected because published model-dependent
  inversions of narrow-facet growth-rate observations support reductions near the two approximate
  temperature regions.
- **Use equal-field coefficient ordering as a habit proxy** — rejected because the forward solver
  has facet-dependent surface fields, geometry, size and seed history; the historical run produced
  neutral classes that the proxy cannot represent.

## Review provenance and limits

Two read-only non-author reviewers used OpenAI `gpt-5.6-sol` at ultra reasoning. Both inherited the
full root task and repository context, so they were independent of authorship but not context-blind.
They made no tracked edits.

The evidence/oracle reviewer independently re-derived all 408 historical row semantics, configs and
labels; reproduced CAK 3/90 and M1 54/78 arm-scope / 54/90 common-scope measurements; checked the
18-file evidence manifest; recomputed the 448-entry Tier 1 comparison (9 differences, maximum 31
ULP); confirmed the four preserved Tier 2 output rows while retaining their missing-raw-evidence
limit; and verified the five-file/21-member held-out source lock remains `passEligible=false`. It ran
the 153 production-predicate negative controls in public-source and offline-source modes, focused
tests, Rule 7, both TypeScript checks, syntax checks and `git diff --check`.

The acceptance/quote reviewer independently recomputed the M1 dip centres under base 10 and natural
logarithms, all restricted equal-shared-field coefficient-equality roots, both arm fragility counts
and threshold witnesses, the historical proxy census and a counterexample to its habit inference,
all evidence-manifest hashes, Tier 1 portability counts, historical/current parameter-table bytes
and hashes, and the source lock. Its final Rule 5 audit matched all 22 charter lines deleted by the
accepted diff to 22 unique verbatim ADR quotations with no miss, extra or non-`HEAD` mismatch. It
also reran the final arm-2/protocol/SDAK set (101/101) after the last live-field correction and
confirmed that the values hash stayed unchanged while the justification/combined revision histories
advanced.

A later acceptance follow-up used the same OpenAI model and reasoning level, read-only and
non-author, with full shared task/repository context. It independently recomputed the 50,464-byte
current parameter table and all six arm identities; verified both legacy values hashes and their
ordered revision histories; checked the official exact Boltzmann, Celsius/kelvin and
standard-atmosphere authorities and the separate P2 diffusivity/reference-pressure closure; matched
all 22/22 deleted charter clauses to unique verbatim quotations; and proved the frozen education
tree still equals checkpoint `60e3f3f`. Its final focused suite passed 4 files / 132 tests, Rule 7
was clean over 417 files, both TypeScript projects passed, and `git diff --check` passed. It reported
0 blockers / 0 should-fixes.

Neither reviewer re-ran the 408 long solver jobs, R15, a preview-budget GPU cohort, any held-out
experiment, an arm64 computation, or primary-source digitization. The Tier 2 raw arm64 logs and exit
records are unavailable, so their four-row table cannot be independently regenerated. They did not
perform root's repository-wide `npm test` or the complete 33-page dual-mode browser matrix. The
follow-up also did not run a clean-clone checkout or inspect education beyond the landing notice.
Those are separate landing checks, not substitutes for scientific evidence. This decision does not itself
execute R15, validate M1, or establish the magnitude of the narrow-facet reductions for this lattice.

After the scoped reviews closed, root ran the exact repository check on the landing candidate:
`npm.cmd test` exited 0 in 728.5 seconds, with Rule 7 clean over 417 files, both TypeScript projects
green, and Vitest passing 79 files / 1,404 tests in 718.77 seconds. This verifies repository
consistency only; it is not R15, a rerun of the 408 historical jobs, or validation evidence.
