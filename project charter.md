The Virtual Cloud Chamber

Project Document — v1.0, July 2026

Working title. An interactive instrument for designing a snow crystal's growth history and seeing the hidden conditions that shape it.


1. Project Goal

1.1 What this is

A desktop-browser application in which a user designs the environmental history of a snow crystal — the sequence of temperatures, humidities, and conditions it passes through as it "falls" — and watches a three-dimensional crystal grow in response. The crystal that emerges is a readable record of its journey: arms sprouted during a cold, humid phase; a column capped by plates when conditions shifted; a hollow core formed where vapor could not reach.

The core loop:


The user edits an environmental timeline (the crystal's journey through a virtual cloud).
A physically motivated field solver grows the crystal through those conditions.
Diagnostic views expose the normally invisible state driving the growth — the vapor field around the crystal, the local growth propensity on its surface — so the user can see not just what grew, but why.


The distinctive contribution is the third step. Plenty of generative-art snowflake toys exist. This project is an explanatory instrument: it makes the model's hidden state legible, so a "snowflake designer" can reason about cause and effect rather than pull slot-machine levers.

1.2 Why this project


It sits on a genuine scientific mystery. The Nakaya morphology diagram — why ice flips between plates and columns as temperature drops — resisted explanation for ~75 years and was only given a quantitative semi-empirical model by Kenneth Libbrecht in 2019. The science is real, recent, and still partly open.
It is emergent complexity made interactive: simple local rules plus a designed environment produce elaborate, unrepeatable structure. The experience is understandable in one sentence — change the cloud, watch a unique crystal grow.
It fits the maker's direction: a flagship interactive science artifact (in the Gameology Space sense) — beautiful, technically serious, and delightful to play with — rather than a startup or ed-tech product.


1.3 What this is explicitly not


Not a molecular simulation. A real snow crystal contains ~10^18 water molecules. This is a mesoscopic model: each lattice cell stands in for trillions of molecules. That is legitimate because the physics being modeled (vapor diffusion, boundary attachment rates) is already continuum-scale — not because of any hand-wavy "fractal scaling" argument.
Not a validated physical simulator. The solver is a phenomenological model inspired by real physics. The product's identity includes being honest about this (see §1.5).
Not mobile. Target: desktop browser, WebGPU required, discrete GPU expected. Development hardware: RTX 4080 (16 GB). Resolution stays a runtime parameter so the sim also runs small and fast (see §3).
Not (initially) a social product. Galleries, sharing, and export come after the science works.


1.4 Definition of success for v1

One solver, on a hexagonal-prism lattice, that:


grows a sixfold-symmetric hexagonal plate;
grows a solid column from the same code by changing only model parameters;
transitions continuously between plate-like and column-like habits;
shows facet-center vapor depletion in its diagnostic views;
produces hollow columns as emergent behavior, with no hard-coded "make hollow" rule;
supports conditions changing mid-growth (the timeline, in embryo);
exposes its vapor field and surface growth propensity visually the whole time.


Plus one independent finding from a cheap 2D prototype: that "designing a cloud journey" is understandable and enjoyable as an interaction.

1.5 Epistemic honesty as product identity

Every quantity shown to the user carries one of four confidence levels, and the UI never silently upgrades one to another:


Direct model state — computed exactly by the solver (vapor field value, model growth propensity).
Qualitative physical interpretation — "plate-favoring conditions," "vapor-starved region."
Empirically calibrated quantity — matched against laboratory observations (only after §3 Phase 6).
True physical unit — only where the model and calibration genuinely support it.


Amended 2026-07-14 (decision 0003). Temperature is now a genuine input to the solver's physics, not a label applied to a knob afterward — so a real temperature slider is honest, and reads as level 1 (direct model input). What is not yet earned is the next claim: that the crystal which emerges at −15 °C is what nature actually grows at −15 °C. That is a level 3 claim and only Phase 6 can grant it, by testing it and possibly refuting it.

Hold the distinction precisely, because it is the one this project exists to be honest about: giving a model real physics is not the same as showing the model reproduces reality. Until Phase 6 reports, the UI says "−15 °C (model input; morphology not yet validated against measurement)." A hover readout says "high relative attachment tendency," not "attachment rate: 91%." A designer tool can be honest about being a model; a fake physics readout is worse than none — and a real-looking number resting on an untested model is the most convincing fake of all.

1.6 Long-term shape (post-v1, non-binding)


Three modes: Explore (simple temperature/moisture controls), Lab (model parameters, graphs, morphology comparison), Sculpt (deliberate shaping, saving, STL export for 3D printing).
Two engines: the interactive mesoscopic solver for design and exploration, plus an offline high-fidelity "bake" (more diffusion iterations, higher resolution, potentially phase-field) that recomputes a chosen history in seconds-to-minutes.
Comparison tooling: same seed, two histories, side by side — the clearest possible demonstration that the crystal is a diary of its journey.



2. The Science You Need

This section is a learning path, ordered from foundations to the research frontier, ending with a reading list and exit criteria. The goal is not to become a physicist; it is to understand the model well enough that every line of solver code is a deliberate choice.

2.1 Ice crystallography — why six?

Ordinary ice (ice Ih) is a hexagonal crystal: hydrogen bonding forces H₂O molecules into a lattice with sixfold symmetry about one axis. A growing crystal therefore has two families of facets: the basal facets (top and bottom, perpendicular to the c-axis) and the six prism facets (the sides, perpendicular to the a-axes). Every plate-vs-column question in this project is, at bottom, the competition between growth normal to basal facets and growth normal to prism facets.

Consequence for the simulation: the symmetry must live in the lattice itself. The solver uses a stacked triangular lattice — triangular packing in the horizontal plane, layers stacked vertically — whose fundamental cell is a hexagonal prism with 6 lateral neighbors and 2 vertical neighbors. A cubic voxel grid has fourfold in-plane symmetry, and no amount of parameter tuning turns four into six. This is a foundational data-structure decision, not a rendering detail.

2.2 Nucleation and deposition

Pure supercooled vapor does not readily self-organize into ice; real snow crystals nucleate heterogeneously on a foreign speck (dust, clay, pollen). After nucleation, a crystal grows by deposition: water vapor becomes solid directly, skipping the bulk liquid phase. The fuel gauge for growth is supersaturation σ — the excess of vapor density over the equilibrium value above ice. In the simulation: one seed cell at the center, a vapor field everywhere else.

One nuance to hold onto: "skipping the liquid phase" is true macroscopically, but the ice surface carries a nanoscale premelted, quasi-liquid layer that matters enormously to attachment physics. Mesoscopic models represent it abstractly as a boundary-mass field. It never needs to be rendered as liquid, but it should exist as internal state.

2.3 The Nakaya morphology diagram — the central mystery

Mapped by Ukichiro Nakaya in the 1930s from lab-grown crystals: shape depends on temperature and supersaturation in a strange, oscillating way.


≈ −2 °C: thin plates
≈ −5 °C: needles and columns (including hollow columns)
≈ −15 °C: plates again — the classic stellar dendrites
below ≈ −30 °C: columns again
Higher supersaturation → more complex, branched forms at any temperature; low supersaturation → simple compact facets.


Why the same molecule flips its growth habit back and forth across a few degrees went unexplained for decades. This diagram is v1's report card: the model does not need to reproduce it quantitatively, but it must be able to move across it qualitatively.

2.4 Transport physics — diffusion-limited growth

Vapor must travel through air to reach the crystal. Because growth is slow relative to molecular motion, the vapor field around the crystal is well approximated by the quasi-static diffusion (Laplace) equation, ∇²σ ≈ 0, with the crystal surface as a sink. Two consequences drive most of the visible drama:


Tips win. Corners and edges protrude into richer vapor, receive more flux, and grow faster — the branching instability behind dendrites (a faceted cousin of the Mullins–Sekerka instability).
Centers starve. The middle of a wide facet is shielded; local supersaturation sags there. Push this far enough and the facet center stops advancing while the rim continues — that is hollowing, and in this project it must emerge from the field, never from a rule.


Air pressure sets the diffusion constant, which shifts the balance between diffusion-limited growth (branchy, at high pressure) and kinetics-limited growth (simple compact facets, at low pressure). The draggable slice-plane view in the app exists to make exactly this physics visible.

2.5 Interface physics — attachment kinetics

When vapor reaches the surface, how readily does it incorporate? The Hertz–Knudsen form:


v_n = α · v_kin · σ_surf



where v_n is the outward growth velocity of the surface, v_kin the kinetic maximum, σ_surf the local supersaturation at that point, and α ∈ [0, 1] the attachment coefficient — the single most important symbol in this project. Key facts about α:


It differs between basal and prism facets, and both depend on temperature and σ_surf. The Nakaya diagram is, in Libbrecht's model, the story of α_basal(T, σ) and α_prism(T, σ) trading places.
Facets are flat because faceted growth is nucleation-limited: new molecular layers must nucleate as 2D islands, giving α ≈ A·exp(−σ₀/σ_surf). Growth on a facet switches on nonlinearly with supersaturation.
The Ehrlich–Schwoebel barrier governs whether admolecules diffusing across a facet can hop over its edge and lock in — and how "leaky" that barrier is varies with temperature and surface premelting.
SDAK (structure-dependent attachment kinetics) — Libbrecht's key hypothesis: α also depends on the width of the facet. Narrow facets grow more easily, which makes them narrower, which makes them grow more easily — a positive feedback that produces thin plates, sharpening edges, and hollow columns.


These equations are the solver's attachment rule. (Amended 2026-07-14 — see decision 0003. This section previously read "you will not implement these equations literally in v1," deferring them to a Phase 6 calibration layer. That was the wrong call: it would have made Phase 6 curve-fitting rather than validation. The reasoning is in the ADR and is not repeated here.)

The consequence to hold onto: temperature is an input to the physics, not a label applied afterward. α_basal(T, σ_surf) and α_prism(T, σ_surf) are computed each step from the local supersaturation the diffusion field delivers, and the plate↔column habit is an output of their competition rather than a knob. This is what allows the model to be wrong — and therefore worth testing (§3.2, Phase 6).

Note the symbol collision, which is a live hazard in this repository: Gravner–Griffeath also use α, for an entirely unrelated quantity (a boundary-mass attachment threshold indexed by neighbor count). A bare α is banned from the code and the docs; see §3.3.

2.6 The computable models


Reiter's 2D cellular automaton — a lightweight hex-grid CA that makes pretty branching plates. Not physical. Its role here: the throwaway UX prototype (§3, Phase 1) and nothing more.
Gravner–Griffeath mesoscopic model — the computational skeleton (amended 2026-07-14; this section previously called it "the implementation blueprint"). Their 3D version runs on the stacked triangular lattice, carries per-cell fields (diffusive vapor mass, boundary/semi-liquid mass, crystal state), and cycles through diffusion → freezing → attachment (with geometry-dependent thresholds) → melting steps. It reproduces plates, solid and hollow columns, sandwich plates, ridges, and dendrites at feasible compute cost. G-G's real contribution to this project is not physics — it is the answer to "how do you compute 3D crystal growth on a lattice at feasible cost." That part is kept in full: the lattice, the diffusion step and its reflecting boundary, the boundary/quasi-liquid mass field, melting, exact mass bookkeeping, and — load-bearing, easily overlooked — the noise term, without which sidebranching never seeds. Only the attachment thresholds are replaced, by §2.5's kinetics (decision 0003). Its honest limitation, and the reason for that replacement: the thresholds are phenomenological knobs containing no temperature, so the relationship to physical (T, σ, p) is not merely unknown, it is unaskable. It also omits latent-heat transport and some surface-diffusion effects — known, acceptable approximations for v1.
Phase-field methods — continuum models with a smooth phase variable φ; higher fidelity, heavier compute, still incomplete parameter-to-physics mapping. The candidate engine for a future offline "bake" mode, not for v1.


2.7 The open problem this project inherits

There is no validated end-to-end map from real conditions (T, σ, p) to mesoscopic model parameters. Libbrecht's model is physically grounded but his published numerical work largely uses reduced geometry; Gravner–Griffeath produces the 3D shapes but with abstract knobs. Nobody has fully closed the loop, and this project lives in the gap.

The plan of attack (amended 2026-07-14, decision 0003). The original plan was empirical and, in hindsight, circular: sweep G-G's knobs, measure the morphologies, build an atlas, and map temperature controls onto it after the fact. That fits a curve; it does not close a loop. Because the solver now takes temperature as a physical input (§2.5), the plan is instead to attempt the loop directly: extract σ₀(T), A(T), v_kin(T) and D(T, P) from Libbrecht's measurements into the model, run the solver at a stated temperature, and check the morphology it produces against the Nakaya diagram and Libbrecht's controlled-growth results.

This converts Phase 6 from calibration into validation, and the difference is the whole point: the model can now fail. Set −5 °C — does a column grow? Set −15 °C — does the habit flip back to plates? A model that cannot be wrong is not attempting this problem. The four confidence levels in §1.5 exist so that the gap between "the model was given real physics" and "the model was shown to reproduce reality" is stated rather than hidden — those are different claims, and Phase 6 is the only thing that can promote the first to the second.

2.8 Reading list, in order


Libbrecht — "Toward a comprehensive model of snow crystal growth dynamics: 1. Overarching features and physical origins" (arXiv:1211.5555). The primer. Extract: vocabulary, the shape of the problem, SDAK intuition.
Gravner & Griffeath — "Modeling snow-crystal growth: A three-dimensional mesoscopic approach," Phys. Rev. E 79, 011601 (2009). The implementation paper. Read until you can write the update cycle and parameter table as pseudocode from memory. (Their 2D predecessor, Physica D, 2008, is a gentler on-ramp if the 3D paper feels dense.)
Libbrecht — "A quantitative physical model of the snow crystal morphology diagram" (arXiv:1910.09067). Extract the α_basal / α_prism vs. temperature narrative; this is the future mapping layer's physical anchor.
Libbrecht — Snow Crystals (monograph; arXiv:1910.06389 / Princeton University Press, 2022). ~500 pages; use as a reference, not a cover-to-cover read. Prioritize the chapters on attachment kinetics, diffusion-limited growth, and computational modeling.
snowcrystals.com — Libbrecht's site. Visual ground truth: lab photos, growth videos, the designer-crystal gallery your product implicitly converses with.


Exit criteria for the reading phase. You can: sketch the Nakaya diagram from memory; explain why a cubic lattice can never work; write the Gravner–Griffeath update loop as pseudocode; explain hollowing without reference to any hollowing rule; and state cleanly which parts of the model are physics and which are phenomenology.


3. Technology and Milestones

3.1 The stack (decided)

Platform. Desktop browser only. WebGPU required — the app detects the adapter at startup, requests explicit requiredLimits (defaults are far below what a discrete GPU supports), and fails with a clear message on unsupported hardware.

Development hardware is split (ADR 0002): an Apple M4 Mac is the daily driver and carries Phases 0–4, which are entirely CPU; an RTX 4080 (16 GB) carries the GPU port and the Phase 6 sweeps, which are throughput-bound and are where that card earns its keep. Consequently the WGSL is tested on both Metal and D3D12/Vulkan before Phase 5's gate closes — a GPU solver validated on one backend is not validated — and the bounded-dispatch discipline below is a portability requirement rather than a Windows workaround. macOS will not reproduce Windows' ≈2 s watchdog reset, so a dispatch that feels fine on the Mac can still kill the tab on the 4080.

Resolution is a first-class runtime parameter — the sim must run small (a 128×128×64-class grid) for fast iteration and testing, not only at showcase sizes, so the developer's hardware never becomes a silent floor. Domain size is three independent integers (nx, ny, nz), never a single cubic N (ADR 0001): plates grow wide and flat, columns tall and narrow, and since the central Phase 4 experiment sweeps continuously from one to the other, a cube is badly sized for one end of every sweep.

Platform decision (July 2026): web, deliberately. A native C++/CUDA application was evaluated and declined. The project's purpose is an artifact anyone on a desktop can open from a link — reach outranks peak compute, and the v1 scope does not need what CUDA uniquely offers. Native remains a candidate for exactly one thing: a future offline bake engine (§1.6), if and when it is earned. Nothing in Phases 0–4 depends on this choice, so it carries no schedule risk if revisited at the Phase 5 gate.

Language and tooling. TypeScript + Vite. Strict types matter here: the solver is index arithmetic over flat typed arrays, and a swapped coordinate is a silent physics bug.

Solver — two implementations, permanently.


CPU reference solver: plain TypeScript, float64, at a 128×128×64-class grid, running in a Web Worker. This is the ground truth and the debugging environment. It is never deleted.
Production solver: WGSL compute passes on WebGPU — diffusion, boundary/semi-liquid update, attachment/freezing, diagnostics — over ping-pong storage buffers or 3D textures, f32. All fields stay GPU-resident; only probe values, metrics, and snapshots come back to JavaScript. Every pass is bounded (Windows' GPU watchdog resets dispatches that run ≈2 s), so bake-quality work is chunked across many dispatches by design.


The GPU solver is validated against the CPU oracle with tolerance comparisons (f32 vs f64) on identical seeds. Debugging physics in WGSL is miserable; debugging it in inspectable TypeScript is merely hard. Never port ahead of the oracle.

Repository structure — the solver is not the app. Five parts from the start: core (model definitions, parameters, morphology metrics, checkpoint format), solver-cpu (the oracle), solver-gpu (WGSL passes), runner (headless CLI), and app (the Three.js instrument). The checkpoint format — JSON metadata plus binary field snapshots — lives in core and is defined early, because oracle-vs-GPU comparisons, regression tests, and the sweep harness all speak through it. The headless runner executes the same WGSL solver outside the browser (Deno ships WebGPU; Dawn/wgpu bindings exist for Node), so parameter sweeps, atlas generation, and overnight runs never require a browser tab. The GUI is one client of the solver, not its home.

Rendering. Three.js WebGPURenderer. Development geometry is instanced hexagonal prisms of occupied boundary cells — it matches the solver lattice exactly, gives free cell picking, takes field coloring directly, and leaves no interpolation ambiguity. Smooth surfaces come later (exposed-prism-face meshing first; resampling to a Cartesian volume + marching cubes only if needed), and ice materials / post-processing come last.

UI. Tweakpane for development controls. The product UI framework decision (Svelte/Solid/etc.) is deferred until there is a product to build.

Testing. Deterministic seeds throughout. An automated morphology-metrics module (aspect ratio, hollowness index, branch count, sixfold-symmetry error) turns visual milestones into a regression suite: when a later optimization silently breaks hollowing, a test fails.

Explicitly out of scope (struck from earlier plans): ECS / bitECS, particle systems, spatial hashing for vapor particles, instanced "molecule" meshes, mobile targets, early marching cubes, early bloom/gallery/export work.

3.2 Milestones

Phases 1 and 2 can run in parallel; everything else is sequential. Each milestone has a done when.

Phase 0 — Ground truth (reading, no project code).
Work through §2.8. Done when the exit criteria at the end of §2.8 hold. Timebox it (2–3 focused weeks); the monograph is a reference, not a gate.

Phase 1 — UX spike (2D, throwaway, ~a weekend).
Reiter CA on a hex grid in a canvas, with one addition: an editable environmental timeline that changes parameters mid-growth. Test: pausing and changing conditions, naming and saving growth histories, comparing one seed under two histories. Done when you can answer "does designing a cloud journey feel engaging?" with evidence. The code is then archived, not extended — it must not quietly become the architecture.

Phase 2 — CPU reference solver. Split into 2a and 2b (2026-07-14, decision 0003). The governing rule is the same one that governs the GPU port: never physics ahead of the machinery. Phase 2a must stand on its own and be gated before any Libbrecht equation is written.

Phase 2a — the machinery, with G-G's thresholds exactly as published.


Stacked triangular lattice: flat typed arrays, index math, 6+2 neighbor lookup. Unit tests for neighbor symmetry and boundary handling. Done when neighbor tests pass in all directions.
Vapor diffusion on the lattice, with a mass-conservation test. Done when total mass is conserved to tolerance over long runs.
Seed + cell states + the full Gravner–Griffeath update cycle (diffusion → freezing → attachment → melting), including the noise term, with the published threshold parameters. Done when a crystal grows at all.
First scientific gate: a stable, sixfold-symmetric hexagonal plate, verified by an automated symmetry check — not by eyeballing. Done when the symmetry-error metric stays under threshold across a full run.
Crude field observability from day one: dump vapor slices and surface propensity as images. A malformed crystal can look plausibly organic; a malformed field is obvious immediately.


Why 2a exists as its own gate. It proves neighbors, diffusion, mass conservation, and sixfold symmetry independently of the physics — so when the kinetics later misbehave, the machinery underneath is already known-good. It also guarantees a working, beautiful crystal as a floor. That floor matters: the hybrid genuinely might not reproduce the Nakaya flip, and this project is meant to produce a delightful artifact regardless of whether it also produces a scientific result.

Phase 2b — attachment becomes physics.


Put attachment behind an AttachmentRule interface with two implementations, GGThreshold (2a's, unchanged) and LibbrechtKinetics. Both are kept permanently, exactly as the CPU oracle is kept permanently: the threshold rule is the working floor and the differential diagnosis when the physics misbehaves.
Physical units: Δx in microns, Δt in seconds, D in m²/s, and the CFL-like stability bound on the diffusion step. This is the step that yields a principled number of diffusion iterations per growth step — enough for the quasi-static field to relax — rather than a guess.
The seam, which is the real work of this phase: G-G's attachment is a binary cell flip; Libbrecht's v_n = α·v_kin·σ_surf is a continuous velocity. Converting a surface velocity into lattice attachment events is the substance of LibbrechtKinetics, not an implementation detail of it.
α(T, σ_surf) with the basal/prism split, from the parameter table (first deliverable of this phase; see below).
SDAK last, and gated. It is the least certain piece — α depending on facet width requires a local geometric query over surface cells, attackable but unpublished at this resolution. It is deliberately last because it is not load-bearing for the Phase 4 hollowing gate (see §2.4 and decision 0003): hollowing comes primarily from the Berg effect amplified by the nonlinearity of A·exp(−σ₀/σ_surf), and survives dropping the width term. SDAK buys the extreme thin plates and needles, not basic hollowing.


First concrete deliverable of Phase 2b: docs/libbrecht-parameters.md — σ₀(T) and A(T) for basal and prism, v_kin(T), and D(T, P), extracted with citations from arXiv:1910.09067. That table is the mapping layer, and it is measured physics in place of curve-fitting. No number enters it without a citation.


Phase 3 — Development visualization (Three.js).


Instanced hex prisms of boundary cells; orbit camera.
Surface overlay with a selectable quantity: vapor availability, growth propensity, boundary mass, recent growth velocity.
Draggable slice plane through the vapor field; freeze-and-inspect; adjustable value range.
Cell picking with a hover readout using model-honest labels (§1.5).
Done when you can watch a facet center starve in the slice view while the plate grows. These views are debugging instruments first and product features second — that they are the same artifact is the project's luckiest property.


Phase 4 — The morphology gauntlet (CPU solver, all diagnostics on).


Solid column from the same solver — parameter change only. Done when aspect ratio inverts.
Continuous, controllable plate↔column transition. Done when aspect ratio tracks a swept parameter monotonically.
Facet-center vapor depletion clearly visible in the slice view on a widening column.
Second scientific gate: hollowing emerges with no explicit hollow rule. Done when the hollowness metric rises from field dynamics alone, reproducibly across seeds.
Conditions changing mid-growth: the timeline drives the real solver. Done when a plate→column history yields a capped column.
Branching / dendritic growth at high supersaturation parameters.


Phase 5 — GPU port.


Diffusion pass alone in WGSL; validate against the CPU oracle to tolerance on identical seeds.
Full update cycle on GPU; ping-pong buffers; bounded dispatches; adapter-limit handling.
Resolution modes wired end-to-end. Each mode is a cell budget, not a cube (ADR 0001) — the (nx, ny, nz) triple is chosen to fit the morphology, since a plate wants roughly 800 × 800 × 80 and a column the transpose. Dev ≈ 1M cells / preview ≈ 8M / detailed ≈ 30M / bake ≈ 130M (the 4080's 16 GB holds several f32 fields at bake size; browser buffer limits, not VRAM, are the practical ceiling to engineer around).
GPU-resident rendering: overlays and slices sample the solver's buffers directly; no full-field readback per frame. Decouple simulation stepping from display frame rate — run many diffusion iterations per visible growth step.
Done when GPU and CPU runs agree within tolerance and 256³ is interactively editable.


Phase 6 — Validation against the Nakaya diagram (renamed 2026-07-14 from "Calibration atlas"; decision 0003). Because temperature is now an input to the physics rather than a label applied afterward, this phase is a test the model can fail. That is its purpose. The old framing — sweep knobs, build an atlas, fit a temperature axis onto it — could not have failed, and therefore could not have taught anything.


Harden the morphology-metrics module (it already exists from testing).
Parameter-sweep harness on the headless runner: hundreds of automated runs at preview resolution, no browser involved — this is where the 4080 earns its keep, and it matters more than maximum grid size.
Sweep temperature and supersaturation — the axes of the real Nakaya diagram — and auto-measure the habit at each point. This produces the model's morphology diagram in the same coordinates as the published one, so the two can be laid side by side rather than mapped onto one another.
The falsifiable test: does the model reproduce the habit reversals? Plates near −2 °C, columns near −5 °C, plates again near −15 °C, columns below −30 °C. The non-monotonic flip is the thing Libbrecht's α_basal/α_prism crossing explains, and it is the thing a curve-fit could never have predicted.
Upgrade UI labels from level 1–2 to level 3 (§1.5) only where the comparison supports it, and only where it holds.
Done when the model's temperature-vs-supersaturation morphology diagram is compared against Nakaya's, with the agreements and the disagreements both stated. A negative result is a result: if the model does not reproduce the flip, that is a finding about the model, it is reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not permitted is quietly tuning until the diagram matches and calling it validation.


Phase 7 — Product layer.


The timeline editor, polished, on the 3D solver — the killer feature gets built last because everything under it must be true first.
Smooth surface extraction (exposed prism faces → optional resampled shell) and the ice look: materials, lighting, restrained post-processing.
Save/load experiments; same-seed/two-histories comparison view; a simple local-first "flurry" gallery; STL export for 3D printing.
Explore / Lab / Sculpt modes over the one engine.
Optional v2+ candidates, in rough order of value: forecast ghost shell (snapshot + run-ahead; deterministic solver makes it well-defined, but it doubles compute), parameter-branch previews, line-probe graphs, volumetric vapor rendering, phase-field bake engine.


3.3 Standing guardrails


Model validity outranks compute. Spend surplus GPU budget on diffusion iterations, observability, determinism, and sweeps before resolution.
The 2D spike stays throwaway; the CPU oracle stays forever. So does GGThreshold — the working floor is never deleted, for the same reason the oracle is never deleted.
Never physics ahead of the machinery. Phase 2a is gated before any Libbrecht equation is written, exactly as the CPU oracle is gated before any WGSL is written. A physics bug on top of an unproven lattice is two bugs wearing one coat.
No UI label ever claims more physical confidence than Phase 6 has earned. "The model was given real physics" and "the model was shown to reproduce reality" are different claims; only Phase 6 can promote the first to the second.
Every scientific milestone is an automated metric, not a screenshot.
Resolution scaling is never allowed to rot — if 128³ stops working, development speed and testing die with it.
A bare α is banned from this repository — in code, in docs, in commit messages. Libbrecht's attachment coefficient and Gravner–Griffeath's attachment threshold are both conventionally written α, they are unrelated quantities, and a solver that confuses them will produce plausible-looking crystals for the wrong reasons — the worst possible failure mode for a project whose identity is epistemic honesty. Every occurrence carries its provenance: alphaHK, alphaHKBasal, alphaHKPrism for the Hertz–Knudsen coefficient (dimensionless, [0,1]); ggThreshAlpha, ggThreshBeta, ggThreshTheta for G-G's boundary-mass thresholds. Enforced by lint, not by vigilance.