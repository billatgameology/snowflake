# Plan — Phase 1 UX spike: the 2D cloud-journey prototype

- **Phase:** Phase 1 — UX spike (charter §3.2). 2D, throwaway, ~a weekend.
- **Status:** not started
- **Started:** 2026-07-14
- **Last touched:** 2026-07-14 by Claude Fable 5 — initial plan, written against charter v1.2;
  hardened same day after an adversarial review pass (Reiter update rule made precise enough to
  not diverge on, lint-rule dependency made real, Findings scaffold added, trim order named)

## Goal

Answer one question with evidence, cheaply: **does designing a cloud journey feel engaging?**
This is the independent finding charter §1.4 demands from a 2D prototype, and it is a *UX*
finding, not a scientific one. The spike exists so that Phase 7's timeline editor — the killer
feature, built last — is designed from observed interaction rather than from hope. It also
de-risks the product premise itself: if mid-growth condition changes are not fun in 2D at 60fps,
they will not become fun by adding a dimension.

May run in parallel with Phase 2 (charter §3.2). Nothing in it blocks, or is blocked by, the
solver.

## Done when

Copied verbatim from charter §3.2, Phase 1:

> Reiter CA on a hex grid in a canvas, with one addition: an editable environmental timeline that
> changes parameters mid-growth. Test: pausing and changing conditions, naming and saving growth
> histories, comparing one seed under two histories. **Done when you can answer "does designing a
> cloud journey feel engaging?" with evidence.** The code is then archived, not extended — it must
> not quietly become the architecture.

**What "with evidence" means here, decided now so the gate is checkable:** written play-session
notes from the maker, produced by the structured protocol in the Steps below, recorded in this
file's *Findings* section — plus the session's saved history files as artifacts. This gate is
deliberately not an automated metric: charter §3.3's metric rule governs *scientific* milestones,
and this is a usability finding. The honest form of evidence for "does it feel engaging" is a
person's recorded answer to specific tasks, and the maker is that person. "I played it and it was
fine" does not pass; the protocol's questions answered in writing do.

## Approach

**The model: Reiter's 2D cellular automaton** (C. A. Reiter, "A local cellular model for snow
crystal growth," *Chaos, Solitons & Fractals* 23 (2005) 1111–1119). The paper is not in
`research/`, so the five lines below **are the spec** — they are what two implementers must not
diverge on. Hex grid; each cell carries a scalar `s`; cells with `s ≥ 1` are **ice**; *receptive*
cells are ice cells and their six neighbors. Each tick:

1. **Split:** `u = s` on non-receptive cells, `u = 0` on receptive cells; `v = s` on receptive
   cells, `v = 0` elsewhere.
2. **Addition** (receptive cells only): `v′ = v + reiterGamma`.
3. **Diffusion — on every cell, including receptive ones:**
   `u′(z) = u(z) + (reiterAlpha/2)·(ū_nb(z) − u(z))`, where `ū_nb` is the mean of the six
   neighbors' `u`. Receptive cells enter this update with `u = 0` — they are **sinks**, which is
   what starves their surroundings and makes branching possible — and they *receive* their `u′`
   share like any other cell.
4. **Recombine:** `s′ = u′ + v′`.
5. **Boundary and initial state:** edge cells are clamped to `reiterBeta` (background vapor);
   initially `s = reiterBeta` everywhere except the single center seed cell at `s = 1`.

Getting step 3 wrong — diffusing only the non-receptive cells — is the one mistake that quietly
kills the model: ice then grows only by `reiterGamma` per tick, uniformly, and branching never
appears. If growth looks bland and radially uniform, check step 3 before touching parameters.

**Not physical, and that is fine** — charter §2.6 assigns Reiter exactly one role: the throwaway
UX prototype, nothing more. Fidelity to the paper beyond the rule above is explicitly not a goal.
(If the PDF is fetched anyway, it goes in `research/`, which is gitignored — decision 0004.)

**⚠ Rule 7 applies here too, and Reiter is a trap for it.** Reiter's three parameters are
conventionally written α, β, γ — a *third* unrelated α (a diffusion constant), on top of
Libbrecht's and G-G's. In the spike's code and in all docs they are `reiterAlpha` (diffusion),
`reiterBeta` (background vapor), `reiterGamma` (vapor addition). A bare `alpha` is banned
repo-wide, and the ban does not have a "but it's throwaway code" exemption — the lint rule that
will enforce it must not need one. That lint rule does not exist yet: building it is a Scaffold
step of [phase-2-cpu-solver.md](phase-2-cpu-solver.md) (a repo-root scan that explicitly covers
`spike/` and `docs/`, since `spike/` is outside the workspace and no workspace ESLint would ever
see it). If Phase 1 starts before Phase 2's scaffold, create that check first — it is a
standalone repo-root script with no workspace dependency.

**Isolation is a design requirement, not hygiene.** The charter's sharpest warning about this
phase is that the spike "must not quietly become the architecture." So:

- It lives in `spike/` at the repo root — **outside** the five-package workspace of charter §3.1.
  No `package.json`, no build step, no dependencies: one `index.html` plus plain JS modules,
  served by any static file server (`npx serve spike`, or Python's `http.server`).
- It imports nothing from `core`/`solver-cpu`, and nothing ever imports from it.
- Plain JS rather than TypeScript, deliberately: a shared `tsconfig` is exactly the kind of quiet
  tendril that turns a spike into a foundation.

**The timeline — the actual experiment.** A growth history is an ordered list of segments, each
holding a duration in ticks and the three parameter values. Rendered as a horizontal bar with a
moving cursor; the run consults it every tick. Edit while paused: select a segment, adjust its
sliders, add/split/delete segments, set durations numerically. This is intentionally the crudest
thing that lets a person *design a journey* rather than *twiddle live knobs* — the difference
between those two is precisely what the spike is meant to probe.

**Honest labels, even in a toy** (charter §1.5). The temptation is to label sliders
"temperature" and "humidity" to make the journey metaphor land. Resist it: Reiter's parameters
have no physical meaning, and a fake physics label in the very first artifact would break the
project's identity on day one. Sliders get qualitative, provenance-free names — "vapor supply"
(`reiterBeta`), "growth boost" (`reiterGamma`), "mixing" (`reiterAlpha`) — under a permanent
on-screen line: *"Toy model (Reiter CA) — labels are metaphors, not physics."* Whether the
journey metaphor survives honest labeling is itself part of the finding.

**Determinism for free.** Reiter's base model has no randomness, so the same seed cell and the
same history always reproduce the same crystal — which is what makes "compare one seed under two
histories" meaningful and makes saved histories exact replays. No PRNG enters the spike; the
save format reserves a `seed` field for honesty about grid initialization, currently unused.

**Compare mode.** Two canvases, same seed, two named histories, stepped in lockstep from one
play/pause control. This is the embryo of charter §1.6's "same seed, two histories, side by
side," and the second half of what the play sessions probe.

## Steps

- [ ] **Scaffold `spike/`.** `index.html` + JS modules, no dependencies, no workspace membership.
      Check: serves statically, renders an empty hex grid (axial coordinates, pointy-top, canvas
      2D) at ~200×200 cells with a full-grid redraw around 16 ms or better (devtools frame
      timing, eyeballed — this is a spike).
- [ ] **Reiter CA core.** The update rule above, grid edge clamped to `reiterBeta`, single center
      seed cell at `s = 1`. Check: at a sensible starting point (e.g. `reiterAlpha ≈ 1`,
      `reiterBeta ≈ 0.4`, `reiterGamma ≈ 0.0001` — curate by experiment, these are ballparks, not
      citations) a recognizably hexagonal, branching crystal grows. Eyeballed, and recorded as
      eyeballed: this spike has no metrics module and does not need one.
- [ ] **Run controls + live parameters.** Play / pause / step / reset; tick counter; three
      sliders with the honest labels and the disclaimer line. Check: changing `reiterGamma`
      mid-run visibly changes growth character without a restart.
- [ ] **The timeline.** Segment list + bar + cursor; schedule consulted per tick; edit while
      paused (add / split / delete / resize / re-value segments). Check: a two-segment history
      replays *identically* from reset, twice in a row (deterministic replay is what makes the
      rest of the spike trustworthy).
- [ ] **Name / save / load histories.** JSON schema `{name, seed, gridSize, segments[]}`;
      localStorage list plus file export/import. Check: reload the page, load a saved history,
      get the identical crystal.
- [ ] **Compare mode.** Two canvases, same seed, two chosen histories, lockstep stepping.
      Check: histories differing in one segment produce visibly different crystals from identical
      starts, side by side.
- [ ] **Curate 3–4 preset journeys** as starting points (e.g. "steady growth," "boost then
      starve," "two-phase"). Check: each grows something visually distinct — presets are what
      make the first five minutes of a play session about *designing*, not about finding the
      model's narrow good band.
- [ ] **Play sessions — the gate.** The maker plays through a structured protocol and the notes
      go in *Findings* below:
      1. **Free play**, ~15 minutes. Where does attention go — the sliders, the timeline, the
         compare view?
      2. **Design to a brief:** "compact early growth, then branching." Could a journey be
         *reasoned out*, or only found by trial and error?
      3. **Reproduce a target:** shown a crystal grown from a hidden two-segment history,
         reconstruct something like it. Is cause→effect legible enough to invert?
      4. **Explain a comparison:** same seed, two saved journeys, side by side — narrate *why*
         they differ. Does the journey metaphor carry the explanation?
      Then answer in writing: what was engaging, what was tedious or confusing, was the mental
      model actually "a journey through conditions," and what should Phase 7's timeline editor
      keep, drop, or fix? Check *(gate)*: the charter question answered in *Findings*, with the
      task-by-task notes and the saved history JSONs (`spike/histories/`) as artifacts, and the
      answer recorded in PROGRESS.md.
- [ ] **Archive.** `spike/README.md` stating: throwaway, frozen, superseded by the real solver;
      do not extend; see this plan for findings. PROGRESS.md updated; status here flipped to
      done. Check: the freeze notice exists and PROGRESS points at the findings.

## Out of scope

- **Any 3D anything.** No stacked triangular lattice, no aspect ratios, no basal/prism — that is
  Phase 2's world.
- **Physics.** No G-G machinery, no Libbrecht kinetics, no units, no supersaturation vocabulary
  in the UI (it would be a borrowed costume on a toy).
- **Metrics.** No symmetry error, no hollowness. The gate is a UX finding; adding metrics here
  would be rigor theater on a model that doesn't warrant it.
- **The product stack.** No TypeScript, no Vite, no Tweakpane, no framework — and no code sharing
  with the workspace packages, in either direction, ever.
- **Polish.** Colors legible, hexes visible, nothing more. No ice materials, no bloom, no
  galleries, no STL.
- **Extending the spike after archive.** If a Phase 7 question needs a 2D testbed again, that is
  a new plan file and a conscious decision, not a quiet reopening of `spike/`.

## Risks

- **Reiter's pleasant regime may be narrow** — many parameter combinations stall or explode into
  blobs, which would make free play frustrating for reasons that say nothing about the journey
  metaphor. Mitigation: curated slider ranges and the preset journeys step; finding the good band
  is part of the build, not part of the gate.
- **The finding may be negative or lukewarm.** That is a result (charter's own stance on Phase 6
  applies in miniature here): record *what* was unengaging — the toy model's blandness, the
  timeline's editing friction, the metaphor itself — because each of those points Phase 7 in a
  different direction. Do not soften the writeup to protect the premise.
- **Scope creep toward "the real app."** The spike is one weekend and one question. The isolation
  rules above are the structural defense; the timebox is the cultural one. If the weekend runs
  short, trim in this order: presets 4 → 2, then file export/import (keep localStorage). Compare
  mode, save/load, and the play protocol are charter-required and are never the trim.

## Tried and rejected

*(Append as you go. This is not written at the end.)*

- **Physical labels on the sliders ("temperature", "humidity").** Rejected at planning time,
  before any code: Reiter's parameters have no physical meaning, and charter §1.5 does not have a
  prototype exemption. Qualitative metaphor labels plus an explicit toy-model disclaimer instead;
  whether the journey metaphor survives honest labeling is part of what the spike measures.
- **Building the spike inside the npm workspace with TypeScript.** Rejected at planning time: the
  charter's one warning about this phase is that the spike must not quietly become the
  architecture, and shared tooling is how that happens quietly. Plain JS in `spike/`, zero
  dependencies, no imports across the boundary.

## Open questions

- **Slider metaphor names.** "Vapor supply" / "growth boost" / "mixing" are proposals; the maker
  may have better ones. Only constraint: no physical-unit vocabulary, and the disclaimer line
  stays regardless.
- **Grid size vs. feel.** ~200×200 is a guess at "big enough to look like a snowflake, small
  enough to redraw every tick." If growth feels sluggish in play, shrinking the grid beats
  optimizing the code — this is a spike.
- **Does the evidence protocol need a second player?** The charter asks for the maker's finding
  and §1.4 calls it independent; one structured session is the plan. If the maker wants an
  outside player as well, that strengthens the evidence but is their call, not a gate
  requirement.

## Findings

*(Empty until the play sessions run. The gate writes here — task-by-task notes first, then the
answer to the charter question. Protocol: the play-sessions step above.)*

### Task 1 — free play

### Task 2 — design to a brief

### Task 3 — reproduce a target

### Task 4 — explain a comparison

### The answer: does designing a cloud journey feel engaging?
