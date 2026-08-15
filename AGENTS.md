# Working rules — The Virtual Cloud Chamber

This project is worked on by **multiple different LLMs across sessions**, with no shared memory
between them. Any model may pick up work another left mid-flight. `docs/PROGRESS.md` is the compact
current-state index, and the active plans hold the detailed work records; logs, checkpoints, and
other artifacts are evidence only when one of those current records points to them.

`docs/HANDOFF.md` is a manually triggered stop/restart snapshot, not a second live progress log.
Update it only when the maker explicitly says the session is stopping, restarting, or needs an
immediate saved handoff. During ordinary work and long runs, leave it untouched.

**`CLAUDE.md` is a symlink to this file.** Keep `AGENTS.md` canonical and never replace the
symlink with a second copy; two instruction files will drift.

The governing document is [project charter.md](project charter.md). It defines the goal, the
science, the stack, and Phases 0–8. **The charter is the spec; these files are the state.**

---

## Cold-start read order and authority

| File | Answers | Written |
|---|---|---|
| `docs/PROGRESS.md` | Where is the project *right now*? | Every session that changes anything |
| `docs/plans/<phase>-<slug>.md` | What are we about to do, and why that way? | Before any non-trivial work |
| `docs/decisions/NNNN-<slug>.md` | Why is it this way and not the obvious alternative? | When a real choice gets made |

Templates live at `docs/plans/_TEMPLATE.md` and `docs/decisions/_TEMPLATE.md`.

Read in this order on every cold start:

0. **Read `docs/HANDOFF.md`.** It is the last explicitly requested stop/restart snapshot and may
   predate ongoing work. Then read **`docs/phase6-lessons.md`** — every rule in it came from a real incident that cost time or
   nearly cost evidence, and several are enforced by `npm test`
   (`runner/test/evidence-integrity.test.ts`).
1. Read `docs/PROGRESS.md` completely, including **Next step**.
   It is deliberately a compact current-state index. Its linked pre-compaction archive is a frozen
   historical record, not current authority; open that archive only when a current record points to
   it or the task requires historical provenance.
2. Read each active plan it names for the workstream you will touch, including **Tried and
   rejected**. If a task crosses workstreams, read every affected active plan. Those sections
   contain killed protocols and measured failure modes that must not be rediscovered or restored.
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
| `docs/libbrecht-parameters.md` | provenance-recorded σ₀(T), A(T), v_kin(T), D(T,P), and exact metrological inputs | extracted mapping table distinguishing directly adopted empirical inputs and authoritative exact definitions from fits/inversions, digitizations and P3/P4 prescriptions, with stated uncertainty/exact status and explicit gaps; source values/transcriptions cite their source, while project-derived/P4 choices name operands and method |

### When sources disagree

These files answer different questions; do not collapse them into one vague "source of truth."

| Source | Authority |
|---|---|
| `project charter.md` | Governing product, science, phase, and gate contract. The current charter wins. |
| Accepted ADRs in `docs/decisions/` | Why the charter changed and which tempting alternative was rejected. An ADR and the charter should already agree. |
| Solver specs | Delegated technical ground truth for the implemented algorithms. |
| Active plan for the affected workstream | Current implementation approach, pre-registered protocols, evidence, and rejected attempts. |
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
an executed, pre-registered chartered validation gate can earn a quantitative validation claim
over its named domain: Phase 6 owns the Nakaya comparison, and Phase 7 may separately gate a
held-out domain. Phase 8 source reconciliation cannot grant that label.

## Repository map

The root is a strict-TypeScript ESM npm workspace on Node 23.6 or newer.

| Path | Responsibility and boundary |
|---|---|
| `core/` | Environment-neutral data/model contracts: lattice and D6h transforms, state, G-G parameters, Libbrecht mappings, seeded counter-based PRNG, metrics, and strict checkpoint codecs. |
| `solver-cpu/` | Permanent float64 oracle. Exports `GGSolver`, `LKSolver`, and their shared `SurfaceOperator` contract. No Node APIs or file I/O. |
| `runner/` | Node-only CLI and evidence boundary: argument validation, runs, stopping rules, metrics, PGM dumps, checkpoint I/O and round-trip checks, and enforced gates. |
| `spike/` | Frozen Phase 1 Reiter prototype, deliberately outside the npm workspace. Do not evolve it into the product. |
| `research/` | Tracked source indexes and citations; most downloaded media are local and gitignored. Never force-add copyrighted media. |
| `evidence/` | Tracked, digest-pinned artifacts: evidence backing published claims (ADR 0038) plus the gut-check spike's recipes and run records (`gutcheck-gg-realism/`, relocated out of `out/` 2026-08-12). Every artifact file below it, except the two root control manifests `evidence/MANIFEST.json` and `evidence/OUT-TREES-MANIFEST.json`, must be tracked and pinned in `evidence/MANIFEST.json`; `npm test` enforces file mode, presence, byte length, and SHA-256. |
| `app/` | Phase 3 Three.js development instrument: Web Worker CPU solver, overlays, vapor slice, picking/readouts, stop-rule parity, and deterministic visual harness. Phase 4 extends it without moving solver work onto the UI thread. |
| `solver-gpu/` | Phase 5 WebGPU implementation and Windows/Chromium/D3D12 evidence path. Phase 7 GPU-parity work must preserve the accepted Phase 5 protocols and remains downstream of its own freeze/comparison gate. |

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
- **Anything a D6h generator maps onto itself must be computed so that the invariance survives
  evaluation, not merely so that it holds in exact arithmetic** (gg-solver determinism decision
  2; ADRs 0023 and 0024). This has now been got wrong twice, in two different ways, so it is
  stated in the general form and both instances are named below. The cheapest guarantee is to
  key the value to something the group preserves *exactly* — a multiset, or an integer.
  - **Reductions over a permuted neighborhood** must be a function of the multiset, not of the
    enumeration order (ADR 0023). Float addition is not associative, so a fixed direction order
    makes a cell and its image round differently.
  - **Geometric quantities must be keyed to an integer invariant, not to evaluated cartesian
    floats** (ADR 0024). The distance from the centre is equal across an orbit in exact
    arithmetic, but `sqrt(dx² + dy² + dz²)` on the embedded coordinates differs by up to ~7e-15
    between equivalent cells. Use the integer form `di² + di·dj + dj² + dk²`, which rot60 and
    mirror preserve exactly.

  Either way, growth amplifies the ulp until an orbit splits, and a larger fill-CFL amplifies it
  faster — the ADR 0024 break was invisible at `cfl = 0.1` and obvious at `0.2`, so a symmetry
  regression test that does not run at the largest admissible step is not testing much.

  Audited 2026-07-26: the remaining float-geometry sites (`Math.hypot` in `core/src/metrics.ts`,
  for `centerRimDepletion` and `boundingRadius`) are REPORTED DIAGNOSTICS that never feed back
  into the evolution, so they cannot break the crystal's symmetry. If any of them is ever wired
  into the solver's own decisions, it inherits this rule. The in-plane smoother
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

- The primary Windows execution host has an AMD Ryzen 9 5900XT (16 physical cores / 32 logical
  processors), 64 GB RAM (63.8 GB usable), an NVIDIA GeForce RTX 3080 with 10 GB dedicated VRAM,
  and multiple NVMe SSDs. Prefer an NVMe-backed workspace for long evidence runs.
- Run independent cases, temperature points, sweeps, and other scientifically separable jobs in
  parallel processes whenever the registered protocol and available memory allow it. Preserve
  deterministic per-case semantics and never alter a pre-registered protocol merely to increase
  concurrency.
- Every long evidence launch records the actual process concurrency and exact launch command and
  flags in its bundle; the intended concurrency is not silently substituted for what executed.
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
- On macOS the required local check is `TMPDIR=/private/tmp npm test`. A bare `npm test` fails
  31 Phase 5 gate tests ("publication parent resolves through an alias or junction"):
  `os.tmpdir()` returns `/var/folders/…`, which `realpathSync.native` resolves through the
  macOS `/var` → `/private/var` symlink, tripping the evidence guard in
  `runner/src/gate5-evidence.ts`. The guard is correct; set `TMPDIR`, never relax it.
- The NAS share `\\GameStation\snowcrystal` is mounted `S:` on Windows and
  `/Volumes/snowcrystal` on macOS. Never hardcode a mount: resolve it via
  `scripts/nas-root.ts` and address share files by share-relative path (the dev server's
  `/nas/<path>` route). The emitted URL is mount-agnostic by construction; end-to-end index
  and streaming behavior was measured on macOS, while the current Windows `S:/` path remains
  unexecuted. Paid for twice: the 2026-08-06 and 2026-08-12 machine transfers each broke the
  same tooling.
- Nothing under `out/` is tracked. Treat it as disposable workspace, not a byte-for-byte
  backup set: durable provenance lives under `evidence/`; ledgered bulk and archived scratch
  can be restored from the NAS through `docs/nas-ledger.json`; transient logs and checks are
  regenerated or discarded. `scripts/gutcheck-grow-batch.mjs`,
  `scripts/gutcheck-sweep-specs.mjs`, and `scripts/gutcheck-archive-pack.ts` re-pin the
  gut-check evidence subtree automatically. After a direct writer invocation or hand edit
  under `evidence/gutcheck-gg-realism/`, run `npm run evidence:pin`; it re-pins that subtree
  ONLY. A new file elsewhere under `evidence/` needs its own MANIFEST entry or `npm test`
  fails on the stray.
- Keep unrelated dirty changes intact. Never “clean up” a handoff by reverting or absorbing it
  without understanding the affected active plan.

---

## Rule 1 — Start every session by reading the state

Before touching anything: read `docs/PROGRESS.md`, then every active plan relevant to the work.
Do not infer project state from the code, the file tree, or this charter alone — they tell you
what exists, not what was *intended*, what was *tried and rejected*, or what the last model was
halfway through. If `PROGRESS.md` disagrees with the code, say so explicitly rather than
silently trusting one.

## Rule 2 — Plan in a file before you build

Any work beyond a trivial fix gets a plan file *first*, committed before implementation starts.
A plan is: the goal, the approach, the steps, the "done when", and the things deliberately not
done. Charter phases already state their own **done when** — copy it into the plan verbatim and
do not quietly soften it.

A bounded single-source intake, a direct analysis requested by the maker, or a focused docs/rules
correction with an obvious scope is not a build and does not need a new plan file. Do not create a
plan merely to restate the request or to document that another process document will be changed.

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

An ADR must quote verbatim every charter clause it touches — and a "charter impact: none"
claim must quote the clauses that make it none. Paid for once: ADR 0024 declared no charter
impact while §2.4 literally mandated the far-field condition it replaced; the contradiction
sat unnoticed until an outside review and cost ADR 0027 plus charter v1.17 to repair.

## Rule 6 — Claims are cheap; evidence is the deliverable

This project's identity is epistemic honesty (charter §1.5), and it applies to the docs too.
Scientific milestones are **automated metrics, not screenshots** (§3.3). So:

- Never mark a phase gate done in `PROGRESS.md` without naming the metric, its value, and how
  to reproduce it (seed, resolution, command).
- Never write a physical claim the model hasn't earned. The confidence-level discipline in
  §1.5 governs prose in the docs exactly as it governs UI labels.
- "Looks right" is not a result. If you eyeballed it, write that you eyeballed it.
- Every number written into `PROGRESS.md` or a plan is copied from a named artifact **at
  write time**, with that artifact's path or hash beside it — never quoted from memory or an
  earlier prose mention. When a bundle is superseded, correct its quoted numbers in the same
  session; at least three review rounds have been spent entirely on stale prose quotes (a
  recomputed p99, superseded bundle measurements, a wrong file count).
- **State the measured claim, not the strongest claim.** "Cannot", "every", "always",
  "independent of", and "provably" assert theorems: they require a stated derivation whose
  quantity and scope are both named — and the derivation must be about the quantity the
  claim governs. If what you have is a measurement, write the measured statement with its
  scope. Paid for twice in two days: ADR 0031's retracted "three independent routes"
  paragraph, and the `5463e76` retraction of the Phase 6 structural bound, whose script
  counted sigma_0 crossings while the claim governed habit — which depends on the full
  attachment coefficient alphaHK, a different quantity with a different crossing count.
- **For executable code, tests, build configuration, gate/evidence generation or verification,
  or any change whose governing plan names the full suite, the required local check is exact
  `npm test`, and nothing else counts as it.** A green `npx vitest run` omits the Rule 7 scan
  and both typechecks; quoting it as verification is how 319 scan violations merged to `main`
  unnoticed on 2026-07-29. Pure prose, source-index, and governance edits use the cheapest check
  that covers their actual failure surfaces, including the Rule 7 scan when repository prose
  changes, and are never described as "suite green." Name the exact command beside any claim.

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

## Rule 9 — A verdict is computed from the artifact, never inherited from its producer

Any gate, evaluator, or report derives pass/fail by re-deriving from the published bytes. No
component may supply both sides of a comparison it participates in. Every negative control
must execute its named mutation, verified by something other than its author. A harness that
silently ignores an unrecognized field in a status line is fail-open and invalid evidence.

Paid for twice: the rejected Phase 5 WP5 gate candidate (`eb5c5fb` — self-attested duplicate
witnesses; ten of sixteen negative controls never executing their named mutation) and the
Phase 6 WP0b calibration probe that parsed only `symErr=` and dropped the
`deltaSymClean=false` that was reporting a real solver defect.

## Rule 10 — Reviews carry provenance and state their limits

Every review round records three things: the reviewing agent's model and whether it shared
context with the developer; what it independently re-executed; and what it did **not** check,
stated as a limit of the evidence rather than left implicit (Phase 5 WP7's closing review is
the template). Gate-bearing reviews prefer a different model than the one that wrote the
code — this history shows each model catching seams the other's author missed, and none of
that is recoverable afterward from git, because reviewers do not commit.

## Rule 11 — Probes transfer only from the registered configuration

A calibration, convergence, or cost measurement supports a decision only if it ran at exactly
the configuration the decision governs. Anything else is stamped **non-transferable** in the
record that reports it, at creation time — not discovered later. Paid for twice in one work
package: the extent-15 domain ladder whose conclusion *reversed* when re-run at the
registered extent 21, and the grid-spacing ladder that repeated the identical composition
error at extents 9/15/23.

## Rule 12 — Check source currency before any freeze

Before a parameter table or protocol freezes: confirm every cited source is its latest
version, and sweep the cited authors' later output for anything superseding the extraction.
Record the check as part of the freeze. Paid for at exactly the wrong moment: three uncited
Libbrecht papers printing closed forms for figure-digitized curves (arXiv:2009.08404,
2306.13087, 2306.04042) surfaced the day *after* the table's hash-freeze, converting a free
upgrade into an ADR-plus-re-freeze decision.

## Rule 13 — Interpretation is gated like evidence

An interpretive document — a sweep report, a scientific-claim section of an ADR, a memory or
ledger entry, education content, anything outward-facing — receives an adversarial audit
**before** it is published, merged, or propagated into other artifacts, not after. Scale the
audit to the claim: anything carrying a theorem-strength claim (Rule 6's "cannot / every /
independent of" class), a gate verdict, or a public scientific conclusion gets the full
adversarial treatment. Routine source triage, internal working judgments, and non-load-bearing
records get the author's proportionate skeptical pass; they do not require independent review
merely because they are committed. The audit that retracted the Phase 6
structural bound (`5463e76`) found exactly the attacks it was asked to try — meaning it
would have caught the error pre-publication, and running it post-publication was purely a
scheduling choice. By then the claim had already propagated into a memory entry, a findings
ledger, and education chapters, each of which needed its own correction pass. Evidence
earned this gate in Phase 2; interpretation has now paid for it twice.

## Rule 14 — Fix stupid process

Do not preserve a gate, workflow, plan detail, or inherited convention merely because time has
already been spent on it. When process is demonstrably redundant, self-defeating, disproportionate
to its risk, or displacing the real work, say so plainly and stop extending it. Determine the actual
authority: preserve controls required by the charter or an accepted ADR unless the maker authorizes
an amendment, in which case Rule 5 still requires the ADR and matching charter edit to land before
the control is relaxed; simplify plan- and implementation-level machinery directly; and record what
was superseded so a later model does not restore it by inertia.

Keep checks that protect scientific correctness, provenance, safety, reproducibility, or a real
fail-open boundary. Remove or defer ceremony that only proves the proof system, duplicates a later
gate, attacks an out-of-scope adversary, or attempts to machine-prove social facts such as reviewer
identity. Prior effort is not evidence of value, and accumulated ceremony is not rigor. When a
review loop starts producing more review machinery instead of source coverage, measurements, or
other named deliverables, escalate to the maker and fix the process before doing another rebuild.

Use decision risk, not anxiety or the mere availability of another check, to set assurance depth:

- **Routine source intake:** establish identity/version, preserve the original and hash when
  applicable, record exact locators, and extract values with units, conditions, uncertainty, and a
  measured/transcribed/derived distinction. Then stop; independent review is not the default.
- **Load-bearing quantitative input:** do the routine work plus one independent transcription,
  calculation, or semantic check targeted at the value the project will consume.
- **Phase gate or strong public scientific claim:** use the pre-registered evaluator, independent
  derivation, negative controls, and adversarial review required by the charter or accepted ADR.

A proposed gate, check, review, registry, or verifier is admitted only when it names a plausible
in-scope failure, explains how that failure could change a scientific decision or silently corrupt
evidence, shows that existing controls do not already catch it, and costs less than the likely harm.
If any part is missing, do not build it. Never add a review of a review or a validator whose main
purpose is to validate another validator.

Stop checking when another pass is unlikely to change inclusion, classification, extracted values,
the next experiment, or a published claim. State the residual uncertainty and move on. As a judgment
tripwire—not a tracked metric—if process consumes roughly one quarter of a work block without
producing source coverage, measurements, calculations, code, experiments, or the requested
decision, or if a second meta-validation layer appears, stop and simplify before continuing.

---

## Anti-rules

- Don't summarize the charter into `PROGRESS.md`. Link to it. Two copies of a spec means one is
  wrong.
- Don't keep a per-session diary. `PROGRESS.md` describes *state*, not chronology; prune it as
  work lands. Detail belongs in the plan file for that work.
- Don't create documents these rules don't call for. More files is not more clarity.
- Don't split a freeze from its provenance record. They are one commit, not two a minute
  apart.
- Don't build new adversarial evidence machinery per work package. Reuse the existing
  verifier seams; a new seam is justified only by a new attack surface. Integrity has a
  budget: ceremony ran ~15% of all commits and evidence-hardening ~45% of all rework through
  Phase 5, with visibly declining yield after WP5.
