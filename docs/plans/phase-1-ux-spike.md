# Plan — Phase 1 UX spike: the 2D cloud-journey prototype

- **Phase:** Phase 1 — UX spike (charter §3.2). 2D, throwaway, ~a weekend.
- **Status:** in progress
- **Started:** 2026-07-14
- **Last touched:** 2026-07-14 by Claude Fable 5 — initial plan, written against charter v1.2;
  hardened same day after an adversarial review pass (Reiter update rule made precise enough to
  not diverge on, lint-rule dependency made real, Findings scaffold added, trim order named).
  Build session same day (Claude Fable 5, agent): Steps 1–7 implemented in `spike/`;
  `spike/check.mjs` (plain node, zero deps) added as the automated core check — see
  **Verification record** below for what is automated vs eyeballed. Fix session same day after
  the maker's real-browser review: six interaction defects fixed (live-edit replay fidelity,
  compare lockstep + evidence, split selection, schema/UI bounds unification, seed validation,
  prototype-safe storage) with regressions in `check.mjs` — see the Verification record's
  **Fix session** subsection. Fix round 2 same day after maker re-test: three replay-honesty
  defects (tick-0 re-seed, completed-segment re-timing, staircase segment-cap overflow) fixed
  under one stated invariant — see **Fix session round 2**.

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

- [x] **Scaffold `spike/`.** `index.html` + JS modules, no dependencies, no workspace membership.
      Check: serves statically, renders an empty hex grid (axial coordinates, pointy-top, canvas
      2D) at ~200×200 cells with a full-grid redraw around 16 ms or better (devtools frame
      timing, eyeballed — this is a spike). *Built 2026-07-14; see Verification record.*
- [x] **Reiter CA core.** The update rule above, grid edge clamped to `reiterBeta`, single center
      seed cell at `s = 1`. Check: at a sensible starting point (e.g. `reiterAlpha ≈ 1`,
      `reiterBeta ≈ 0.4`, `reiterGamma ≈ 0.0001` — curate by experiment, these are ballparks, not
      citations) a recognizably hexagonal, branching crystal grows. Eyeballed, and recorded as
      eyeballed: this spike has no metrics module and does not need one. *Curated band landed at
      `reiterBeta ≈ 0.6` for the classic dendrite; the plan's 0.4 ballpark grows but slowly.*
- [x] **Run controls + live parameters.** Play / pause / step / reset; tick counter; three
      sliders with the honest labels and the disclaimer line. Check: changing `reiterGamma`
      mid-run visibly changes growth character without a restart.
- [x] **The timeline.** Segment list + bar + cursor; schedule consulted per tick; edit while
      paused (add / split / delete / resize / re-value segments). Check: a two-segment history
      replays *identically* from reset, twice in a row (deterministic replay is what makes the
      rest of the spike trustworthy). *Automated: check.mjs (b).*
- [x] **Name / save / load histories.** JSON schema `{name, seed, gridSize, segments[]}`;
      localStorage list plus file export/import. Check: reload the page, load a saved history,
      get the identical crystal. *Persistence round-trip still needs a human in a real browser —
      flagged for the play session.*
- [x] **Compare mode.** Two canvases, same seed, two chosen histories, lockstep stepping.
      Check: histories differing in one segment produce visibly different crystals from identical
      starts, side by side.
- [x] **Curate 3–4 preset journeys** as starting points (e.g. "steady growth," "boost then
      starve," "two-phase"). Check: each grows something visually distinct — presets are what
      make the first five minutes of a play session about *designing*, not about finding the
      model's narrow good band. *Four shipped: steady growth / boost then starve / branch then
      fill / calm-then-stormy.*
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

## Verification record (build session, 2026-07-14)

What is automated and what was eyeballed, per Rule 6. The UX gate itself remains open — nothing
below claims it.

**Automated — `node spike/check.mjs`, zero deps, exits non-zero on failure.** All 18 checks
passed on 2026-07-14:

- **(a) growth:** "Preset — steady growth" (620 ticks, grid 200) grows to 5215 ice cells from
  the 1-cell seed, staying > 3 cells clear of the clamped rim.
- **(b) deterministic replay:** two runs of the same two-segment history on a 120 grid produce
  **bit-identical** `Float64Array` fields (byte comparison).
- **(c) timeline effect:** a two-segment history (`reiterGamma` 0.0001 → 0.010 at tick 125)
  differs from a one-segment control of the same 250-tick length (1231 vs 2677 ice cells).
- **Preset sanity:** all four presets validate against the save-format schema, grow, stay inside
  the grid, and are pairwise non-identical.
- Informational: sim cost ≈ 0.75 ms/tick at 200×200 under node.

**Automated-ish — headless Chrome (screenshots + console capture), 2026-07-14:** page served by
`python3 -m http.server` from `spike/`; all modules load (HTTP 200, `text/javascript`); **zero
console errors**; a full 620-tick autoplay run in the browser finishes with **exactly 5215 ice
cells — the same count as the node run**, a cross-environment determinism data point. A
compare-mode screenshot shows both canvases at the same tick (lockstep from the shared control)
with already-diverging on-screen ice counts (19 vs 13 at tick 16) under two histories from
identical seeds; headless GPU rAF is vsync-capped, so a *mature* side-by-side was not reachable
headlessly — that visual is the maker's to eyeball in play. (The headless pass caught one real
bug: a boot-order crash where the timeline cursor read the runner before it existed — fixed.)

**Eyeballed, and recorded as eyeballed:**

- The crystal is *recognizably hexagonal and branching* — judged from ASCII dumps in node and
  the headless screenshot (a clean sixfold dendrite). No symmetry metric exists here, by design.
- Preset journeys are *visually distinct* — judged from ASCII dumps and screenshots; the
  automated check only proves they are not identical.
- Redraw cost: the UI shows a live `draw N ms` stat per canvas; headless timing is virtualized
  (reads 0), so **the ≈16 ms budget must be eyeballed by the maker in a real browser** via that
  on-screen stat. Sim cost (0.75 ms/tick node) says the budget is spent in drawImage calls, not
  the CA.
- **Not yet verified by anyone:** localStorage persistence across a real page reload, and file
  export/import round-trip — both need a human browser session; flagged as the first two minutes
  of the play session. The schema validation both paths rely on *is* automated.

Test hooks: `?autoplay=1` starts the run on load; `?compare=1` opens compare mode (used by the
headless checks; harmless in play).

### Fix session (2026-07-14, after maker browser review)

The maker's real-browser pass found six interaction defects; all are fixed. Status of each,
with its evidence:

1. **Live edits were not replayable** (saved JSON did not describe the on-screen crystal; 427
   vs 595 ice cells in the maker's reproduction). Fixed by split-at-cursor in the model layer
   (`history.mjs` `prepareSegmentEditAt`), used by the slider handler; duration edits of the
   in-progress segment clamp to the consumed tick count. **Automated:** `check.mjs` (1) —
   the maker's scenario replays bit-identical, prefix frozen, boundary edits don't split.
2. **Compare was not lockstep and hid evidence.** One shared clock now stops the comparison at
   the shorter journey's end (nobody steps alone; the displayed tick is the true shared tick,
   over the comparison's total); compact read-only timelines (segment bars + cursors, values in
   tooltips) render under both canvas titles; wording corrected to "same seed cell and grid" and
   the B label flags a differing first-segment `reiterBeta` explicitly. **Browser-side, not
   DOM-testable here:** verified by headless screenshot (both panes at the same tick, mini
   timelines visible) and recorded as such; the mature behavior is the maker's to confirm in
   play.
3. **Split-at-cursor left the consumed half selected**, so the natural next edit touched the
   past. Fixed: the right-hand segment becomes the selection. **Browser-side; eyeballed.**
4. **Control bounds drifted from the schema** (`reiterGamma` 0.0001 vs slider step 0.0002, grid
   64–400 vs schema 16–512). Fixed: `PARAM_BOUNDS` (now with steps) and `GRID_BOUNDS` live in
   `history.mjs` and are consumed by both `validateHistory` and the UI controls at boot; HTML
   carries no bounds. **Automated:** `check.mjs` (4) — every preset value sits on the shared
   step lattice; `GRID_BOUNDS` matches what the sim accepts.
5. **(a) `seed` was reserved but unvalidated.** `validateHistory` now rejects anything but 0.
   **Automated:** `check.mjs` (a).
6. **(b) storage used ordinary-object keys** — a history named `__proto__` reported success
   without persisting. Fixed with a null-prototype store. **Automated:** `check.mjs` (b), which
   exercises `storage.mjs` under node with a minimal localStorage stand-in.

**Maker's render measurement, recorded for the play session:** ≈16–17 ms per canvas full
redraw, and compare mode draws both canvases sequentially (≈33 ms/frame). No code fix mandated;
**the maker should explicitly assess compare-mode responsiveness during the play session** and
note it in Findings — if it drags, shrinking the compare grid beats optimizing spike code.

### Fix session round 2 (2026-07-14, after maker re-test)

Maker verdict on round 1: compare lockstep, split selection, and shared bounds confirmed in
browser; replay fidelity was *partial*. The governing invariant, now stated in the code and
enforced by regression: **the live run always equals the replay of its own saved history, or
diverges only past a loud visible warning — and the UI can never record a journey that
`validateHistory` refuses to save.** Three remaining defects, all fixed:

- **A — tick-0 initial-state edit did not re-seed the field** (live 271 vs replay 61, silent).
  Fixed with `reseedAtTickZero(sim, segments)` in `history.mjs`: at tick 0 nothing is consumed,
  so any edit that can change the first segment's values (slider edits; deleting segment 0)
  losslessly rebuilds the field from the edited history. The Reset path already rebuilt from
  the current history (no cached initial state) — verified by reading and by regression.
  **Automated:** check.mjs (A) — the maker's scenario replays bit-identical (61 = 61), and the
  helper refuses to touch a run with consumed ticks.
- **B — lengthening a completed segment silently reassigned consumed ticks** (live 427 vs
  replay 271, stale totals). **Choice: warn loudly, don't reject** — duration edits to passed
  segments follow the same policy as value edits to passed segments, keeping design-while-paused
  possible; Reset replays the edited history faithfully. Implemented as
  `applyDurationEdit(segments, index, tick, requested)` in `history.mjs` with the precise
  divergence rule `tick > start + min(oldTicks, newTicks)` — so lengthening a segment whose end
  sits exactly at the cursor is correctly *not* divergent (all added ticks are future), while
  the maker's case is. In-progress segments still clamp to their consumed prefix. Stale totals
  fixed by refreshing the header readout on every timeline mutation. **Automated:** check.mjs
  (B) — divergent flag on the maker's case, updated totals, bit-identical replay for the
  boundary-lengthen case, clamp behavior.
- **C — a long live drag could exceed the segment cap and record an unsaveable journey.**
  Three-part fix: `MAX_SEGMENTS` raised to 4096 in the shared bounds (one definition, UI and
  validation); `normalizeHistory` merges adjacent identical-parameter segments losslessly on
  save/export (replay is bit-identical — `paramsAtTick` is unchanged); and if the cap is ever
  reached, `prepareSegmentEditAt` refuses further mid-run splits (`refused: true`) and the UI
  drops the edit with a loud notice instead of silently diverging or recording an unsaveable
  journey (Add/Split buttons carry the same guard). **Automated:** check.mjs (C) — a 320-event
  staircase drag saves (normalized 321 → 41 segments), loads, and replays bit-identical to the
  live run; cap refusal verified; normalization leaves distinct-parameter journeys untouched.

Browser-side after round 2: boot smoke with zero console errors (screenshot); everything else
in this round is model-layer and covered by the regressions above.

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

- **Preset journeys whose mid-run drama is a `reiterBeta` jump.** Tried first ("boost then
  starve" was originally a compact-plate phase followed by a raised-`reiterBeta` phase) and
  rejected after node experiments: `reiterBeta` is the rim boundary condition plus the initial
  field, so a mid-journey change only diffuses in from the far edge and takes hundreds of ticks
  to reach the crystal — raising it from 0.35 to 0.70 mid-run barely changed the next 500 ticks.
  Not a bug; it is what the parameter *is* in this model. Presets now get immediate mid-journey
  changes from `reiterGamma` (acts directly on receptive cells) and `reiterAlpha` (global
  mixing), and the UI's slider hint says exactly this so players are not mystified. Phase 7
  should remember the general lesson: in any diffusion model, "ambient conditions" knobs act on
  a lag; "local kinetics" knobs act now.
- **Letting journeys run past the grid edge.** The rim is clamped to `reiterBeta`, so growth
  that reaches it is an artifact, not a crystal. Rejected silently allowing it; the run
  auto-pauses when ice comes within 3 cells of the rim, with an on-screen explanation. Presets
  were budgeted (by measurement) to end before tripping the guard.
- **Warning on every mid-run edit that touches already-consumed ticks.** Strictly honest — any
  edit before the cursor makes the on-screen crystal diverge from a pure replay — but it fires
  on exactly the interaction the spike exists to probe (turning a knob mid-flight), burying the
  case that matters. Rejected in favor of: silent for the segment the cursor is inside, loud
  ("crystal no longer matches this timeline — Reset to replay") for edits to fully-passed
  segments and for structural inserts/deletes behind the cursor. Splitting a segment never
  warns: it preserves the schedule exactly.
- **In-place live edits with the suppressed warning (the compromise directly above) —
  overturned by maker browser testing.** Mutating the whole in-progress segment was not merely
  un-warned divergence, it made the save format lie: the maker's reproduction (50 ticks at
  `reiterGamma` 0.0001, live edit to 0.01, run to tick 100) grew 427 ice cells on screen while
  its own saved one-segment history replayed to 595. Replaced by split-at-cursor: the first
  mid-segment edit freezes the consumed prefix with the values that actually ran and lands the
  edit on the suffix (now the selection). Consequence accepted deliberately: dragging a slider
  *while playing* lays down a staircase of small segments — that staircase is the faithful
  record of a knob turned over time, and coalescing it would break bit-exact replay
  (`MAX_SEGMENTS` raised 64 → 256 for headroom). Regression: `check.mjs` (1) asserts the maker's
  exact scenario now replays bit-identical (427 = 427).
- **Requiring equal-length histories in compare mode.** Considered as the lockstep fix
  (maker-found: one side used to run 625/800 past the other's 620/620 while the UI claimed
  lockstep). Rejected — it would force pre-editing journeys before any comparison. Instead one
  shared clock stops the whole comparison at the shorter journey's end, with a notice saying
  why; nobody ever steps alone.
- **Enforcing the slider step-lattice in `validateHistory`.** With bounds and steps unified in
  one exported definition (maker-found drift: `reiterGamma` 0.0001 was unrepresentable on a
  0.0002-step slider), the last gap is an imported value that is in-bounds but off-lattice
  (e.g. 0.00015). Rejected rejecting those files: hand-written JSON is legal, the readout always
  shows the segment's true value, and only an actual slider touch snaps to the lattice. Bounds
  are enforced; the lattice is a UI property, not a schema one.
- **Hard-rejecting duration edits to completed segments while a run is in progress** (option
  (i) of maker defect B). Rejected in favor of allow-with-loud-warning, for consistency with
  value edits to passed segments and to keep the design-while-paused flow: the maker pauses
  mid-run, reshapes the whole journey against the current crystal as a visual reference, then
  Resets to replay the new design. A hard reject would force losing that reference first. The
  divergence rule is precise (`tick > start + min(old, new)`), so re-timing that only adds
  future ticks never warns.
- **Preserving unedited manual splits across save/load.** `normalizeHistory` merges adjacent
  segments with identical parameters on save, so a Split made deliberately but not yet re-valued
  is merged back when the journey is saved and reloaded. Considered keeping such splits;
  rejected: the split carries no replay information (replay is bit-identical either way), the
  in-editor timeline keeps it during the session, and compact saved files are what defect C
  needed. If a play session shows this stings, the fix is a `label` field on segments, not
  keeping ghost boundaries.

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

*(The gate writes here — task-by-task notes first, then the answer to the charter question.
Protocol: the play-sessions step above.)*

### Informal session record — 2026-07-14/15 (recorded by Claude Fable 5 from the maker's messages)

The maker play-tested in a real browser across the round-2 and round-3 fix cycles (this was
functional testing interleaved with play, not the structured protocol). Verbatim: *"i think it
works, did not try many journey but the few presets in there works well. compare mode also works
when using different journey, different snowflake are generated."* Earlier in the same sessions
the maker independently exercised mid-run editing, segment splitting, compare mode with
unequal-length journeys, and save/reload — finding four real interaction defects in the process,
all since fixed with regressions.

Honest labeling per this plan's own gate standard: this is **informal positive evidence**
("works well", compare mode legible), not the protocol's four tasks, and the gate question —
does *designing a cloud journey* feel engaging? — has not been formally answered. The structured
tasks below remain empty. The maker has moved on to Phase 2 (the phases were always parallel;
Phase 2 was never blocked on this gate). **To close this gate:** either run the four-task
protocol, or the maker explicitly asserts the answer (as Phase 0's exit was maker-asserted) and
that assertion is recorded here and in PROGRESS.md.

### Task 1 — free play

### Task 2 — design to a brief

### Task 3 — reproduce a target

### Task 4 — explain a comparison

### The answer: does designing a cloud journey feel engaging?
