# Working rules — The Virtual Cloud Chamber

This project is worked on by **multiple different LLMs across sessions**, with no shared memory
between them. Any model may pick up work another left mid-flight. The markdown files described
here are the authoritative handoff index; logs, checkpoints, and other artifacts are evidence
only when the handoff points to them. Treat the handoff as part of the deliverable, not as
bookkeeping.

**`CLAUDE.md` is a symlink to this file.** Keep `AGENTS.md` canonical and never replace the
symlink with a second copy; two instruction files will drift.

The governing document is [project charter.md](project charter.md). It defines the goal, the
science, the stack, and Phases 0–7. **The charter is the spec; these files are the state.**

---

## Cold-start read order and authority

| File | Answers | Written |
|---|---|---|
| `docs/PROGRESS.md` | Where is the project *right now*? | Every session that changes anything |
| `docs/plans/<phase>-<slug>.md` | What are we about to do, and why that way? | Before any non-trivial work |
| `docs/decisions/NNNN-<slug>.md` | Why is it this way and not the obvious alternative? | When a real choice gets made |

Templates live at `docs/plans/_TEMPLATE.md` and `docs/decisions/_TEMPLATE.md`.

Read in this order on every cold start:

1. Read `docs/PROGRESS.md` completely, including **Next step**.
2. Read the active plan it names, including **Tried and rejected**. That section contains killed
   protocols and measured failure modes that must not be rediscovered or restored.
3. Inspect `git status` and the relevant diff before editing. A dirty worktree is often a
   deliberate, reviewed handoff rather than disposable noise.
4. Read the relevant charter clauses, accepted ADRs, and solver spec before changing behavior.
5. Inspect code, tests, logs, and checkpoints only after the intended contract is clear.

**The solver specs** are separate, and they are the technical ground truth — read the relevant
one before writing solver code, every time:

| File | Contains | Truth status |
|---|---|---|
| `docs/gg-machinery.md` | lattice, diffusion, state, mass, melting, noise | shared machinery; diffusion is physical transport, G-G surface knobs phenomenological |
| `docs/attachment-kinetics.md` | the attachment rule and coupled surface operator — Libbrecht's kinetics | **the physically parameterized surface-exchange step** (diffusion is physical transport too) |
| `docs/libbrecht-parameters.md` | measured σ₀(T), A(T), v_kin(T), D(T,P) | extracted mapping table with P1–P4 provenance, stated digitization uncertainty, and explicit gaps; no number without a citation |

### When sources disagree

These files answer different questions; do not collapse them into one vague "source of truth."

| Source | Authority |
|---|---|
| `project charter.md` | Governing product, science, phase, and gate contract. The current charter wins. |
| Accepted ADRs in `docs/decisions/` | Why the charter changed and which tempting alternative was rejected. An ADR and the charter should already agree. |
| Solver specs | Delegated technical ground truth for the implemented algorithms. |
| Active plan | Current implementation approach, pre-registered protocols, evidence, and rejected attempts. |
| `docs/PROGRESS.md` | Live state: what is complete, what is in flight, and the next concrete action. |
| Code, tests, logs, checkpoints | Implementation and evidence. They do not silently overrule the written contract. |

If any two disagree, state the disagreement explicitly and fix it at the proper authority level;
never choose one silently.

---

## Project context — the Phase 2b baseline

This is no longer a greenfield repository. The durable baseline is:

- Phase 0 research is established and the Phase 1 Reiter UX spike is archived under `spike/`.
- Phase 2a's float64 CPU oracle, G-G machinery, morphology metrics, checkpoints, field dumps,
  and enforcing plate gate exist. `GGThreshold` is the permanent working floor and control.
- Phase 2b's operator spec, cited parameter table, `LibbrechtKinetics` implementation,
  fixed-σ boundary support, strict LK checkpoints, and habit-gate tooling exist. Their existence
  does **not** mean the Phase 2b scientific gate is accepted; only `docs/PROGRESS.md` may say that.
- The CPU oracle and `GGThreshold` are never deleted. GPU and app work must stay downstream of
  their charter gates.

The project is an interactive snow-crystal growth instrument, not merely a crystal generator.
The product must expose the vapor field and surface propensity so a user can understand why a
shape grew. Physical inputs make the model falsifiable; they do not make it validated. Only
Phase 6 can earn a quantitative validation claim over a named domain.

## Repository map

The root is a strict-TypeScript ESM npm workspace on Node 23.6 or newer.

| Path | Responsibility and boundary |
|---|---|
| `core/` | Environment-neutral data/model contracts: lattice and D6h transforms, state, G-G parameters, Libbrecht mappings, seeded counter-based PRNG, metrics, and strict checkpoint codecs. |
| `solver-cpu/` | Permanent float64 oracle. Exports `GGSolver`, `LKSolver`, and their shared `SurfaceOperator` contract. No Node APIs or file I/O. |
| `runner/` | Node-only CLI and evidence boundary: argument validation, runs, stopping rules, metrics, PGM dumps, checkpoint I/O and round-trip checks, and enforced gates. |
| `spike/` | Frozen Phase 1 Reiter prototype, deliberately outside the npm workspace. Do not evolve it into the product. |
| `research/` | Tracked source indexes and citations; most downloaded media are local and gitignored. Never force-add copyrighted media. |
| `app/` | Phase 3 Three.js development instrument: Web Worker CPU solver, overlays, vapor slice, picking/readouts, stop-rule parity, and deterministic visual harness. Phase 4 extends it without moving solver work onto the UI thread. |
| `solver-gpu/` | Reserved future package for Phase 5. Do not scaffold it incidentally. |

Dependency direction is `core` → `solver-cpu` → `runner`. Keep solver code environment-neutral
so the same oracle can later run in a Web Worker and serve as the GPU comparison target.

## The two permanent surface operators

Both solvers implement `SurfaceOperator` with `relaxField()`, `advanceSurface()`, and `ledger()`.
They share contracts and lattice definitions, but keeping their mutable update implementations
separate is deliberate: the G-G path is the differential control when kinetics behaves strangely.

| Operator | Contract |
|---|---|
| `GGThreshold` / `GGSolver` | The published G-G cycle: one masked-average diffusion pass, freezing, threshold attachment, and melting. Its tick has no physical-time interpretation. Reflecting runs support the `Σ(b+d)` mass invariant. |
| `LibbrechtKinetics` / `LKSolver` | A coupled Robin field/surface operator: quasi-static relaxation, a policy-versioned self-consistent aggregate boundary value, deterministic boundary-pixel fill, and a physical interface timestep. Temperature is an input to its broad-facet kinetics. |

`LibbrechtKinetics` replaces surface exchange as a coupled whole. Do not run G-G freezing or
melting transfers alongside it: freezing is replaced by the policy-versioned boundary condition
plus fill update, melting
is disabled, hole-filling is retained and separately deficit-ledgered, and `f` is a distinct
dimensionless field rather than a reuse of G-G boundary mass `b`.

## Phase 2b numerical contract — do not regress

The concise contract below is a navigation aid. The equations and rationale live in
`docs/attachment-kinetics.md` §4.4 and ADRs 0005–0006, 0009, and 0013.

- Fixed-σ Dirichlet physics runs converge only when **both** the iterate residual and discrete
  divergence identity pass their stated tolerances. Reflecting LK is residual-only,
  diagnostic-only, and cannot support a physical gate claim.
- Under `aggregate-hv-g1h1-v5` and `-v6`, the divergence numerator is shell injection plus the
  directly metered signed float64 reflecting-smoother drift minus signed boundary exchange. The
  drift is measured before boundary replacement/clamp, is zero in exact arithmetic, and is never
  inferred from the other terms or called vapor. Legacy-v3 and aggregate-v4 keep their executed
  two-term identity (decision 0013). Ask `metersSmootherDrift(policy)`; never re-spell the
  comparison, because a fifth policy added to one site and missed at another is the failure mode.
- **Any reduction over a neighborhood that a D6h generator permutes must be a function of the
  multiset, not of the enumeration order** (gg-solver determinism decision 2; ADR 0023). Float
  addition is not associative, so a fixed direction order makes a cell and its image round
  differently, and growth amplifies that ulp until an orbit splits. The in-plane smoother
  discharges this by summing opposite-direction pairs then adding the three pair sums sorted.
  ADR 0009's aggregate boundary operator did **not** inherit the rule: v4 and v5 sum the Eq. 5.35
  opposing-vapor operands in gather order and are therefore not D6h-equivariant, so a noise-off
  `symErr = 0` under them means only "did not stop mid-split". `aggregate-hv-g1h1-v6` is v5 with
  those operands summed in ascending value order and is the policy Phase 6 registers; v4 and v5
  stay bit-unchanged because Phase 4b and Phase 2b evidence was produced under them, and the
  runner's default stays v5. The WGSL kernel is still gather-order and the GPU LK entry points
  refuse any policy but v5 — do not relax that refusal without porting the shader.
- Aggregate-v5/v6 drift must also satisfy decision 0014's absolute roundoff bound. For a nonzero
  field it is `1024 * activeCellCount * max(Number.EPSILON * maxAbsSweepInput,
  Number.MIN_VALUE)`; an exact zero field has a zero bound. The minimum-subnormal ULP floor keeps
  accepted subnormal fields covered. The positive fixed-temperature gate derives its independent
  bound with `sigmaInfinity`; a finite or coherently canceling term outside the bound is a solver
  failure, never accepted convergence.
- Every forward run names the coupled `surfacePolicy`. Under aggregate v4, v5 and v6, `[01]`
  is basal, `[20]` is prism, `[10]` is inhibited, and other valid raw configurations follow the
  explicit P4 closure in §4.4. Do not restore v3's `[10]`-prism / `[20]`-rough mapping.
- The same self-consistent aggregate `sigma_b` solution defines the surface boundary condition
  and Hertz–Knudsen kinetic demand. Signed local relaxation exchange may be negative and is a
  numerical potential diagnostic, never uptake or fill. Never restore cell-value or inward-ghost
  growth sampling as a second, inconsistent path.
- Aggregate fill (v4, v5, v6) is accumulated once per boundary pixel:
  `alphaHK * vKin * sigmaB * dt / (hB * dx)`, with source-cited `G_b = H_b = 1` on `[01]`
  and `[20]` and a labeled P4 unit extension elsewhere. The fill-CFL binds the per-cell kinetic
  increment; hole-fill events are outside that bound and reported separately. The per-contact
  `[(2/3) * nT + nZ]` formula belongs only to the immutable `legacy-v3` policy.
- The exact ledger claim is **placed fill + recorded unapplied saturation excess = computed
  geometry-adjusted per-boundary-pixel Hertz–Knudsen kinetic demand**. Recorded excess is not
  deposited ice, physical uptake, or a license to hide loss. Shell-clamp totals are
  elliptic-solve diagnostics, not physical mass.
- Noise multiplies `alphaHK` identically in the boundary condition and fill for a tick. Never
  perturb only one side.
- Every forward LK checkpoint must carry the far-field condition, convergence controls, and
  recognized coupled surface policy; encode, decode, solver construction, and runner round trips
  must reject invalid, missing, mismatched, or shifted state. V1 decodes only as implicit
  `legacy-v3`; new writes are v2.
- Physical time advances only in the interface update. Elliptic relaxation sweeps are convergence
  work, not timesteps; a large sweep count is not by itself a units bug.

Any change back to the legacy classifier/per-contact geometry, residual-only Dirichlet
convergence, silent clipping, or a bare vapor-loss/ice-gain equality overturns measured audit
findings. It requires an ADR and a new, committed protocol before results are generated; it is
not a cleanup refactor.

## Phase 4 timeline contract — do not regress

Decision 0011 resolves the timeline seam left open by decision 0005 D5:

- The capped-column history is **column→plate**, matching G-G §XII. The earlier charter
  plate→column wording was corrected, not implemented.
- G-G events atomically replace registered parameter vectors and leave `a`, `b`, and `d`
  bit-unchanged. G-G field state has no temperature or physical-supersaturation meaning.
- LK temperature events conserve active unattached cells' absolute vapor number density:
  `sigmaNew = (1 + sigmaOld) * cSat(oldT) / cSat(newT) - 1`. Do not clamp negative results.
  Attached cells and inactive walls are excluded.
- Transform the active Dirichlet shell with the field, then let the next elliptic solve clamp
  it to the schedule's explicit `sigmaInfinity`. Report that reservoir exchange only as a
  numerical boundary diagnostic.
- Update temperature-derived kinetics and conversion factors atomically. Accumulate each
  interface step's vapor-equivalent ledger increment using that step's temperature; never
  multiply an all-temperature history by the final `M_ice`.
- Phase 4 supports deterministic abrupt events only. Existing GG v1 and LK v1/v2 checkpoint
  meanings stay frozen; final-state checkpoints carry an external schedule/event manifest.
  Resumable mid-history checkpoints require a new version and decision.

## Commands and evidence semantics

### Local execution host and operator preference

- The primary Windows execution host has an AMD Ryzen 7 5700G (8 physical cores / 16 logical
  processors), 64 GB RAM (63.8 GB usable), an NVIDIA GeForce RTX 3080 with 10 GB dedicated VRAM,
  and multiple NVMe SSDs. Prefer an NVMe-backed workspace for long evidence runs.
- Run independent cases, temperature points, sweeps, and other scientifically separable jobs in
  parallel processes whenever the registered protocol and available memory allow it. Preserve
  deterministic per-case semantics and never alter a pre-registered protocol merely to increase
  concurrency.
- The current float64 CPU oracle is effectively single-threaded per process, so exploit the host
  primarily by running independent cases as separate Node processes. Do not route solver work to
  the GPU before its charter phase and comparison gate authorize that implementation.
- For parallel background runs, write clearly labeled live logs plus separate error and exit-status
  files. Unless the operator asks for narration, report only those paths so they can inspect the
  run directly.

```text
npm test
node runner/src/main.ts grow [options]
node runner/src/main.ts grow-lk --temp-c <C> --sigma-inf <fraction> [options]
node runner/src/main.ts gate2b
```

- `npm test` runs the Rule 7 scan, strict typecheck, and all Vitest suites. It is the required
  local check, but a green self-test is not sufficient evidence for a scientific gate.
- `grow` is observational unless the appropriate enforcement flag is present. Printed metrics
  do not turn exit 0 into a gate result.
- `grow-lk` is exploratory. `gate2b` is flagless because it encodes the pre-registered protocol;
  it is an hours-scale evidence run, not a smoke test. Read `docs/PROGRESS.md` and check for an
  existing process before launching, killing, or replacing it.
- For a gate, derive every precondition from the charter/spec and make the process fail by name
  when one is violated. Pin each bypass with an adversarial negative-control test.
- Record the metric and value, seed, dimensions/domain, exact command, termination reason, engine,
  and validated checkpoint. A liveness line, screenshot, test count, or contact-stopped state is
  not an accepted result.
- Tests of scientific contracts must be non-vacuous and independently recompute load-bearing
  quantities. A uniform fixed point does not prove a diffusion path ran; a report agreeing with
  itself does not prove its ledger.

## High-value traps already paid for

- `docs/gg-model.md` is a tombstone. Use `docs/gg-machinery.md` and
  `docs/attachment-kinetics.md`.
- The canonical radius-2, thickness-1 seed has **19 sites**. The paper's “20” is an erratum.
- Exact D6h symmetry gates require `hexPrism`. A box footprint and its walls are not a
  sixfold-symmetric environment. The runner defaults to `hexPrism`; `GGSolver` itself defaults to
  `box`, so tests must choose intentionally.
- A uniform field initialized at the Dirichlet set value is a fixed point under reflecting and
  fixed-σ boundaries alike. Use the documented depleted-start differential test.
- The 65% domain-contact guard detects collision; it does not prove boundary independence.
  Contact-stopped states are invalid gate evidence, and Phase 6 still needs domain convergence.
- Never compare results across far-field conditions silently. The checkpoint records the
  condition because reflecting is a finite reservoir and fixed-σ Dirichlet is replenished.
- Bitwise reproducibility is claimed only for the float64 oracle on the pinned Node/V8 engine.
  Cross-engine, float32, and GPU comparisons use stated tolerances.
- Use the counter-based seeded PRNG and named streams. Never introduce `Math.random()`.
- Keep unrelated dirty changes intact. Never “clean up” a handoff by reverting or absorbing it
  without understanding the active plan.

---

## Rule 1 — Start every session by reading the state

Before touching anything: read `docs/PROGRESS.md`, then the plan file it points at as active.
Do not infer project state from the code, the file tree, or this charter alone — they tell you
what exists, not what was *intended*, what was *tried and rejected*, or what the last model was
halfway through. If `PROGRESS.md` disagrees with the code, say so explicitly rather than
silently trusting one.

## Rule 2 — Plan in a file before you build

Any work beyond a trivial fix gets a plan file *first*, committed before implementation starts.
A plan is: the goal, the approach, the steps, the "done when", and the things deliberately not
done. Charter phases already state their own **done when** — copy it into the plan verbatim and
do not quietly soften it.

If the user approves a plan in chat, write it to the file anyway. The next model cannot read
this conversation.

## Rule 3 — Update PROGRESS.md as you go, not at the end

Sessions get cut off. A plan step that is done but unrecorded is work the next model will redo
or, worse, half-redo. Update `PROGRESS.md` when you finish a meaningful step — not only when
the whole task lands. Leaving work in progress is fine; leaving it *undescribed* is not.

Every entry states: what changed, what it proves, and what is next. Prefer "column aspect ratio
inverts at f=0.06, hollowing not yet observed" over "worked on the solver."

## Rule 4 — Record what failed, not just what worked

Dead ends are expensive and invisible. A model that doesn't know the last one already tried
`X` will try `X`. Every plan file ends with a **Tried and rejected** section, and it is a
first-class part of the document. "Kept the Laplace solve on a cubic grid, sixfold symmetry
error never dropped below threshold, abandoned" saves the next model a day.

## Rule 5 — Decisions that contradict or extend the charter get an ADR

The charter is decided, not sacred — but a change to it is a *documented* change. Write a
numbered decision record (context, decision, consequences, alternatives), and update the
charter itself in the same session so the two never drift. Never let a decision live only in a
chat transcript or a code comment.

## Rule 6 — Claims are cheap; evidence is the deliverable

This project's identity is epistemic honesty (charter §1.5), and it applies to the docs too.
Scientific milestones are **automated metrics, not screenshots** (§3.3). So:

- Never mark a phase gate done in `PROGRESS.md` without naming the metric, its value, and how
  to reproduce it (seed, resolution, command).
- Never write a physical claim the model hasn't earned. The confidence-level discipline in
  §1.5 governs prose in the docs exactly as it governs UI labels.
- "Looks right" is not a result. If you eyeballed it, write that you eyeballed it.

## Rule 7 — A bare `alpha` is banned from this repository

The ban targets identifiers and unqualified prose. Bare identifier forms are prohibited in code
everywhere (including `spike/` and `scripts/`), documentation inline code, and commit messages.
Prose may use a Greek symbol only when its provenance is attached in the same sentence or heading;
unqualified prose is forbidden. Deliberate policy mentions and lint fixtures are explicitly
waived where they occur.

Libbrecht's **attachment coefficient** (Hertz–Knudsen, dimensionless, [0, 1]) and
Gravner–Griffeath's **attachment threshold** (a boundary-mass cutoff indexed by neighbor count)
are *unrelated quantities that are both conventionally written α*. They appear in the same
update step of the same solver. A model that conflates them will produce plausible-looking
crystals for the wrong reasons — which is the worst available outcome for a project whose stated
identity is epistemic honesty (charter §1.5).

Every occurrence carries its provenance:

| Write this | Never this | Meaning |
|---|---|---|
| `alphaHK`, `alphaHKBasal`, `alphaHKPrism` | `alpha`, `α` | Hertz–Knudsen attachment coefficient |
| `ggThreshAlpha`, `ggThreshBeta`, `ggThreshTheta` | `alpha`, `beta` | G–G boundary-mass thresholds |

Enforce identifier use with a lint rule, not vigilance. Vigilance does not survive a model
handoff; a failing build does. Reviewers enforce the qualified-prose rule because the scanner
mechanically covers identifier cases only.

## Rule 8 — Leave the next model a landing spot

End every session by making `PROGRESS.md`'s **Next step** section true and specific enough to
act on cold: the next concrete action, the file to open, the command to run, and any trap you
already know about. Write it for someone with no memory of today — because that is exactly who
reads it.

---

## Anti-rules

- Don't summarize the charter into `PROGRESS.md`. Link to it. Two copies of a spec means one is
  wrong.
- Don't keep a per-session diary. `PROGRESS.md` describes *state*, not chronology; prune it as
  work lands. Detail belongs in the plan file for that work.
- Don't create documents these rules don't call for. More files is not more clarity.
