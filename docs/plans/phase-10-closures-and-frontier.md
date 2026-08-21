# Plan — Phase 10: Closures, state-dependent kinetics, and the scope boundary

- **Phase:** Phase 10 (proposed) — Invent what is not printed, and say what the model is not
- **Status:** draft for maker review — not chartered; adopting it requires a charter amendment
  and logged ADRs. Depends on Phase 8 (target book) and on Phase 9's promotion results — the
  module shelf's outcomes determine which closures are even worth attempting. **Those outcomes
  have now landed and undercut the draft's premises; read the dated reassessment below before
  the 2026-08-04 body, which is preserved as written.**
- **Started:** 2026-08-04 (drafted)
- **Last touched:** 2026-08-20 by Claude Fable 5 — reassessment against the completed
  Phase 6/8B/9 outcomes, at the maker's direction

## Reassessment against landed outcomes (2026-08-20)

Phase 6 closed 2026-08-20; Phase 8B closed 2026-08-12; Phase 9 closed 2026-08-13. The draft
body below predates all three. This section re-derives its premises from the committed
records; a chartering ADR must quote this section's state, not the 2026-08-04 body's.

**What landed:**

- **Phase 6 closed with the negative result accepted** — the model did not reproduce the
  Nakaya diagram at measured-only grade (CAK 3/90, M1 54/90, ablation 5/90) — and the
  numerical-control ladder published **overall NO-PASS, class `criterion`, both spacings**:
  attached-cell counts exceeded the registered 0.5% agreement at 5/16 coarse-domain, 6/16
  fine-domain, and 17/32 auxiliary check points, with seed-perturbation deltas reaching
  9.285% (quoted from `evidence/phase6-wp2-ladder/report.json`, SHA-256 `fd20f701…ebb7`).
  The numerics are published as NOT converged at these resolutions.
- **Phase 9 closed all-no-pass with zero promotions.** No one-factor mechanism survived its
  cheapest honest discriminator; the Lamb bulk-transfer law failed 0/6, the planar-facet
  M-K2 diagnostic was mapping-dependent (2/5), and everything else ended as compatibility
  refusals, categorical foundations, or source intake
  ([execution plan](phase-9-execution.md); [guide](../phase9-model-development-guide.md)).
- **The governing Phase 8B corpus has zero held-out rows** (decision 0048). All 51 records
  are development evidence. The 8A held-out split is frozen historical evidence with no gate
  effect, and the charter requires future confirmation to use genuinely unseen evidence
  frozen before its values are inspected; held-out validation is Phase 7 property
  (decision 0043).

**How this changes the draft:**

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
4. **The observation-mapping blocker precedes surface physics.** Phase 9's central finding is
   that the apparatus-to-surface forcing map and support/transport representation block both
   quantitative families that got close (planar facets, pressure residual). A closure program
   without that bridge re-runs Phase 9's refusals at higher cost.

**Options as they now stand (maker decision, none authorized here):**

- **Option A — scope boundary and housekeeping first.** Execute WD5 (in/out-of-scope flag for
  every Phase 8 record, charter statement) and WD6 (standing source watch), plus the
  phase6-lessons B2 preflight apparatus. Cheap, needed under every other option, no science
  risk.
- **Option B — observation-mapping and evidence acquisition.** Charter the Phase 9 guide's
  evidence-gated route (its steps 1–5): the apparatus-to-surface map, support/substrate
  transport, complete HP26 model, controlled-velocity ventilation source, calibrated
  surface-state observables. Directly converts Phase 9's two stalled quantitative families
  into decidable experiments; Mac-friendly, no large compute.
- **Option C — numerical convergence program.** Attack the ladder NO-PASS: resolution and
  timestep convergence, or observables demonstrated robust to seed sensitivity. Prerequisite
  for ever scoring the 3-D solver against the Phase 8 baseline.
- **Option D — closures as drafted (WD1–WD4).** Deferred: every prerequisite it lacks is what
  Options B and C produce. Attempting it now would violate its own promotion standard.

Recommended sequencing: A, then B with C as its numerical work package; closures stay gated
on B/C outcomes. Phase 7 (product, held-out validation, GPU parity) runs as a parallel track
under its own future plan and does not gate any of this.

**Maker decision (2026-08-20): Options A + B selected, in that order.** C is not adopted and
stays available as future work; D stays deferred until its prerequisites exist. The next
actions — isolated worktree, a separate Phase 10 execution plan scoped to A + B, and the
Rule 5 chartering ADR plus charter amendment — are specified in
[PROGRESS.md](../PROGRESS.md) → **Next step**. This draft remains design history; it is not
the execution plan.

## Goal

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

## Done when

The charter has no Phase 10 milestone; proposed metric: done when every attempted closure is
either (a) promoted with held-out behavioural evidence under a frozen protocol, or (b) closed
with a recorded negative result stating what was tried and why it failed; and the model's
scope boundary is stated in the charter such that every target in the Phase 8 book is
classified in-scope or out-of-scope with a reason.

## Approach

Closures are treated as hypotheses with more degrees of freedom than printed physics, so the
discipline tightens: every closure carries a **calibration set and a confrontation set fixed
in advance** (from the Phase 8 held-out split), a stated parameter count, and a pre-committed
falsification condition. A closure that can only be tuned, never surprised, is not promoted.

### WD1 — Width-dependent kinetics closure (the M2 gap)

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

### WD2 — State-dependent kinetics (the Pokrifka axis)

A per-crystal (or per-facet-patch) **defect state** variable: young frozen-droplet surfaces
grow in an efficient dislocation-fed mode; the state decays toward nucleation-limited faceted
kinetics as facets emerge. Anchors: Pokrifka's order-of-magnitude α fall within one crystal's
growth (0.025 → 0.0016 fitted example), the P-exponent signature (P < 1 during transition),
and Gonda & Yamazaki's minutes-scale sphere→droxtal→prism timeline. Confrontation: the
levitation mass curves (held-out), and the seed-arm results from Phase 9 M-S — if a droxtal
seed plus WD2 reproduces early-growth behaviour that a static-α droxtal seed cannot, the
state variable earned its place. This is also the model-side test of the Class C α-spread
reconciliation hypothesis.

### WD3 — Full thermal coupling (only if Phase 9 M-LH says so)

Promote latent heat from σ∞ rescaling to a coupled solve only if the rescaling's residuals at
the warm end are demonstrably load-bearing on a Phase 8 target. Otherwise record the negative
result and keep the cheap form.

### WD4 — Efficiency machinery (enabling, not physics)

If the closure × module × protocol space outgrows brute-force sweeps: a registered
emulator/active-learning layer that *proposes* runs, with every promoted claim still backed by
a real frozen-protocol run. The emulator never becomes evidence — it only chooses where to
spend the solver budget.

### WD5 — The scope boundary (write it down)

A charter statement, with the Phase 8 book as its census: this is a **single-crystal,
fixed-lattice, vapour-growth** model. Out of model class, permanently and by design:
polycrystalline forms (dominant between −20 and −40 °C per Bailey–Hallett, and generated in
free fall by droplet accretion below −13/−19 °C per Takahashi), riming and graupel,
aggregation, nucleation-mode diversity and twinning, and chemical-impurity habit effects.
Every out-of-scope Phase 8 target gets the flag; the model's reports state coverage as "of the
in-scope regime" with the in-scope fraction printed, so the boundary is visible in every
result rather than remembered by insiders.

### WD6 — Watch the outside

Two standing, low-cost intake obligations: the Penn State lineage (Harrington–Pokrifka 2026
and successors — their −50 °C axis-resolved data extends the measurable range below anything
in the current book) and any MD progress on the CM10 program (terrace step energies and the
Ehrlich–Schwoebel barrier through the premelting onset — the quantities that would turn WD1
from closure into physics). Rule 12 currency checks extend to this lineage.

## Steps

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

## Out of scope

- Molecular-dynamics simulation in this repository (WD6 watches for it; we do not attempt it).
- Modeling polycrystals, riming, aggregation, twinning, or impurity chemistry (WD5 states
  this permanently, with sources).
- Any claim that a promoted closure is *the* physical mechanism — closures reproduce
  behaviour; mechanism attribution stays with the laboratories (the SDAK "working hypothesis"
  status transfers to anything built on it).
- Phase 7 territory (GPU cohort, held-out execution machinery) except as a consumer of its
  published results.

## Tried and rejected

- **Treating gas-phase diffusion as an implicit width closure** — the Phase 6 record already
  rejects "the pressure is set, therefore ESI is modeled" (`libbrecht-figure-findings.md`
  §10.2); a closure must be explicit or absent.
- **Calibrating to eye-guide curves** — the CM8/CM9 dotted lines are explicitly not fits;
  Phase 6 nearly inherited this mistake and the prohibition is now structural (S1).
- **"The sweep failed, therefore SDAK is load-bearing"** — the retracted Phase 6 inference;
  WD1's promotion standard (held-out behavioural evidence with a matched ablation) is written
  specifically so that its conclusion, if reached, is earned the right way.

## Open questions

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
