# The Virtual Cloud Chamber

The Virtual Cloud Chamber is a scientific-computing project for growing simulated snow
crystals. Its eventual product is a desktop-browser instrument where a user designs a crystal's
temperature and humidity history, watches the crystal grow in 3D, and inspects the vapor field
that explains why it grew that way.

This repository is currently the model and evidence layer, not the finished application. It has
a tested TypeScript CPU reference solver, a command-line runner, checkpoint and image output,
scientific specifications, and a frozen 2D interaction prototype. The WebGPU solver and polished
3D app are later phases and do not exist yet.

## What the software does

At a high level, a run does this:

1. Build a three-dimensional stacked triangular lattice. Each cell has six horizontal neighbors
   and two vertical neighbors, matching the sixfold structure of ice.
2. Place a small crystal seed in a field of water vapor.
3. Repeatedly diffuse vapor through the lattice and let surface cells grow according to one of
   two surface models.
4. Measure the result: symmetry, aspect ratio, hollowness, branch count, mass behavior, crystal
   size, and whether the crystal is too close to the domain boundary.
5. Optionally write a binary checkpoint and grayscale PGM images of the vapor, surface growth
   propensity, and crystal occupancy.

There are two permanent solver paths:

- `GGThreshold` / `GGSolver` implements the Gravner-Griffeath mesoscopic update cycle. It is the
  proven computational baseline and control group. It can grow plates, needles, hollow columns,
  and dendrite-like forms from phenomenological parameter presets.
- `LibbrechtKinetics` / `LKSolver` keeps the same lattice and diffusion machinery but replaces
  the surface exchange with temperature-dependent attachment physics. This is the path intended
  to test whether changing temperature alone produces different crystal habits.

Both implement the shared `SurfaceOperator` contract, which separates field relaxation, surface
growth, and evidence ledgers.

## How the pieces connect

```text
runner command
    |
    +-- reads presets and physical inputs from core/
    +-- constructs GGSolver or LKSolver from solver-cpu/
    +-- advances the simulation and asks core/ for metrics
    +-- writes checkpoints and PGM diagnostic images to out/

future app/ and solver-gpu/
    |
    +-- will reuse the same model definitions, metrics, and checkpoint contract
```

The separation is intentional: `core/` and `solver-cpu/` have no Node-specific file I/O, so the
same CPU solver can later run in a browser worker. Only `runner/` touches the filesystem and
process APIs.

## Repository map

| Path | Purpose |
|---|---|
| `project charter.md` | Governing product, science, architecture, and phase specification. This is the highest-level source of truth. |
| `AGENTS.md` | Working rules for humans and coding agents, including planning, evidence, and naming requirements. |
| `docs/PROGRESS.md` | Current project state, accepted phase evidence, active work, and the exact next step. Read this before changing the project. |
| `docs/plans/` | Implementation plans and their completed, pending, and rejected approaches. The active plan is linked from `PROGRESS.md`. |
| `docs/decisions/` | Architecture decision records explaining choices that change or extend the charter. |
| `docs/gg-machinery.md` | Technical specification for the shared lattice, state, diffusion, G-G update cycle, noise, and mass bookkeeping. |
| `docs/attachment-kinetics.md` | Technical specification for the temperature-dependent coupled surface operator. |
| `docs/libbrecht-parameters.md` | Cited physical parameter table and provenance notes used by the Libbrecht model. |
| `core/` | Environment-neutral model types, lattice math, parameters, metrics, deterministic randomness, and checkpoint encoding. |
| `solver-cpu/` | Float64 TypeScript CPU reference implementations of both surface models. |
| `runner/` | Headless Node command-line interface, gate enforcement, file output, and PGM diagnostic generation. |
| `spike/` | Frozen Phase 1 2D UX prototype. It tested the editable journey/timeline idea and must not become the production architecture. |
| `scripts/` | Repository linting plus research-PDF bundle generation and integrity verification tools. |
| `research/` | Source indexes and local scientific source material. Large third-party media is intentionally ignored by Git; tracked indexes preserve URLs and hashes. |
| `out/` | Reproducible run artifacts such as checkpoints, logs, probes, and PGM images. Ignored by Git. |
| `package.json` | npm workspace definition and the main lint, typecheck, test, and runner scripts. |
| `tsconfig*.json`, `vitest.config.ts` | Strict TypeScript and test configuration shared by the workspace. |

`app/` and `solver-gpu/` are reserved architecture names. They will be added in later phases for
the Three.js/WebGPU instrument and the production GPU solver.

## Source files and high-level functions

### `core/`

| File | High-level responsibility |
|---|---|
| `src/lattice.ts` | Converts between flat and 3D cell coordinates, finds the eight neighbors, builds the canonical seed, and implements hexagonal symmetry transforms. |
| `src/state.ts` | Defines the solver's grid dimensions, domain shape, far-field condition, and main cell fields. |
| `src/params.ts` | Defines G-G parameter sets, four named morphology presets, parameter indexing, and validity checks. |
| `src/libbrecht.ts` | Computes physical helper values and temperature-dependent basal/prism attachment behavior from the cited parameter table. |
| `src/metrics.ts` | Computes mass, symmetry error, aspect ratio, hollowness, sealed voids, branch count, bounding radius, far-field vapor, and domain contact. |
| `src/checkpoint.ts` | Encodes and strictly decodes portable little-endian binary checkpoints for both solver paths. |
| `src/prng.ts` | Supplies deterministic, counter-based random values so results do not depend on cell iteration order. |
| `src/index.ts` | Public export surface for the package. |

The G-G state uses three flat typed-array fields: `a` marks attached crystal cells, `b` stores
boundary/frozen mass, and `d` stores diffusing vapor. The Libbrecht solver also maintains `f`, a
per-cell fractional fill value that reaches one before a new cell attaches.

### `solver-cpu/`

| File | High-level responsibility |
|---|---|
| `src/operator.ts` | Defines the common `SurfaceOperator` interface and its relaxation, surface, and ledger reports. |
| `src/gg-solver.ts` | Implements diffusion, freezing, threshold attachment, melting, stopping conditions, and mass accounting for `GGSolver`. |
| `src/lk-solver.ts` | Implements iterative vapor-field relaxation, the coupled surface boundary, per-face fill, temperature-dependent growth, and convergence diagnostics for `LKSolver`. |
| `src/index.ts` | Public export surface for the package. |

The CPU solver is deliberately clear and testable rather than optimized. It is the oracle that a
future float32 WebGPU implementation must match within a declared tolerance.

### `runner/`

| File | High-level responsibility |
|---|---|
| `src/main.ts` | Parses commands, constructs solvers, runs growth loops, prints metrics, enforces phase gates, and reads/writes checkpoints. |
| `src/pgm.ts` | Converts vapor slices, surface propensity, and top-down occupancy into grayscale PGM images. |

The runner exposes three commands:

- `grow` runs the G-G solver with a named preset.
- `grow-lk` runs one temperature-dependent Libbrecht simulation.
- `gate2b` runs the fixed, pre-registered two-temperature Phase 2b protocol. It accepts no
  flags so the comparison cannot be silently changed after seeing a result.

### Tests

Each package has a `test/` directory. Tests cover lattice geometry, deterministic randomness,
parameter validation, metrics, checkpoint mutation resistance, diffusion and boundary behavior,
solver conservation, model coupling, PGM output, gate enforcement, and the repository naming
rule. `npm test` runs the naming scan, TypeScript typecheck, and all Vitest suites.

### `spike/`

This is a standalone browser prototype using a simpler 2D Reiter cellular automaton. Its files
handle timeline/history editing, simulation, canvas rendering, presets, and browser storage.
It proved useful interaction ideas, but it is frozen and shares no code with the real solver.
See `spike/README.md` before running or inspecting it.

## Common commands

Install dependencies and run all verification:

```sh
npm install
npm test
```

Run a G-G plate and save a checkpoint:

```sh
node runner/src/main.ts grow \
  --preset plate \
  --dims 128,128,64 \
  --ticks 10000 \
  --seed 1 \
  --out out/plate.ckpt
```

Add `--pgm-every 2000 --pgm-dir out/plate-images` to emit diagnostic images. Add
`--enforce-gate` only when running the canonical Phase 2a gate configuration; it converts failed
criteria into a nonzero process exit.

Run a single temperature-dependent experiment:

```sh
node runner/src/main.ts grow-lk \
  --temp-c -5 \
  --sigma-inf 0.002 \
  --dims 48,48,48 \
  --steps 200
```

Run the registered Phase 2b comparison:

```sh
node runner/src/main.ts gate2b
```

That gate is computationally expensive and can run for hours. Check `docs/PROGRESS.md` and the
active Phase 2 plan before starting or restarting it.

Run the archived 2D prototype:

```sh
python3 -m http.server 8321 --directory spike
node spike/check.mjs
```

Then open `http://localhost:8321` in a browser.

## Outputs

- Checkpoints (`.ckpt`) contain dimensions, run controls, field descriptors, and raw typed-array
  bytes; G-G checkpoints also carry the last computed metrics. They are the contract between the
  runner, regression tests, future GPU solver, and future app.
- PGM files are simple grayscale diagnostic images viewable by many image tools. They expose
  the otherwise invisible vapor field and surface behavior.
- Console metrics and process exit status are evidence. A printed metric is not automatically a
  passed gate; canonical gate commands explicitly enforce all registered preconditions and
  thresholds.

Generated outputs belong in `out/` and are reproducible from the command, seed, dimensions, and
checkpoint metadata. They are intentionally not committed.

## Current project status

- Phase 0 research and model orientation: complete.
- Phase 1 editable-journey UX spike: complete and frozen.
- Phase 2a G-G machinery and CPU solver gate: complete.
- Phase 2b temperature-dependent surface model: specified and implemented; its registered habit
  gate does not yet have an accepted result.
- Phases 3-7, including field visualization, 3D interaction, GPU parity, scientific validation,
  and the product layer: not started.

For the live status, trust `docs/PROGRESS.md` over this summary. For intended behavior, the
authority order is: `project charter.md`, accepted decision records, the relevant solver spec,
the active plan, and then implementation comments.

## Starting a work session

This README is only an orientation layer. Follow the authoritative cold-start order in
`AGENTS.md` before changing the repository:

1. Read `docs/PROGRESS.md` completely, including its next action.
2. Read the active plan it links, including `Tried and rejected`.
3. Inspect `git status` and the relevant diff.
4. Read the relevant charter clauses, accepted decisions, and solver specification.
5. Only then inspect implementation, tests, logs, and checkpoints.

Read `docs/libbrecht-parameters.md` before changing any physical parameter or temperature
mapping.
