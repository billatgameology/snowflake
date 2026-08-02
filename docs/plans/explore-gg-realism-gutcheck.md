# Plan — GG realism gut check (eyeball-only exploration)

- **Phase:** Pre-Phase 7 exploration, maker-directed 2026-08-02. Not a charter phase gate.
- **Status:** not started
- **Started:** 2026-08-02
- **Last touched:** 2026-08-02 by Claude Fable 5 (`claude-fable-5`)

## Goal

De-risk the ADR 0029 Realistic-profile bet with one artifact: grow a large, noisy `GGThreshold`
crystal, extract a smooth surface from its checkpoint, render it with the ADR 0029 ice look
(refractive material, backdrop gradient, dark facet edges, near-orthographic face-on camera),
and put the image beside a named frame of
`research/snowcrystals.com-videos/J0521r2p-44-minute-2-5mm-1080w.mp4`. The deliverable is the
image plus one recorded human sentence of judgment. The code is disposable scaffolding around
that sentence.

This lives on branch `explore/gg-realism-gutcheck` (worktree
`../snowflake-gutcheck-gg-realism`). Merging into `main` is a separate, later maker decision;
discarding the branch entirely is an acceptable outcome and needs no ceremony.

## Done when

A rendered image of a `GGThreshold`-grown crystal exists beside a named target frame, and a
human's eyeball verdict is recorded in this file with the exact run command, seed, dims, preset,
and checkpoint path/hash beside it. **This is deliberately an eyeball-scale check** (Rule 6: if
you eyeballed it, write that you eyeballed it). No metric, no gate, no evidence claim; every
produced quantity and image is Evidence = unvalidated (charter §1.5).

## Approach

Use the permanent phenomenological floor, not the physical solver: the Gravner–Griffeath paper
(`research/GravnerGriffeath_PhysRevE09.pdf`) published convincing fernlike dendrites from the
algorithm `GGThreshold` faithfully implements, so shape realism here is re-execution risk.
Whether `LibbrechtKinetics` can do the same is Phase 6's question, not this spike's.

Pipeline: existing `grow --preset dendrite` (observational, no gate flags) at a few hundred
cells across on hexPrism with noise on → checkpoint + PGM dumps into gitignored `out/` →
new extraction script resamples the hex lattice and pulls a level-set mesh from the attached
indicator / boundary-mass field → three.js ice-look render → side-by-side.

Constraints that make the branch safe to discard or merge:

- **No edits to `core/`, `solver-cpu/`, or `runner/`.** Solver and checkpoints are consumed
  read-only; all new code in new files.
- Seeded counter-based PRNG with named streams for anything random, including render-side
  jitter. `Math.random()` stays banned here as everywhere.
- The Rule 7 scan covers this branch. three.js opacity API names are precedented in
  [phase-3-dev-visualization.md](phase-3-dev-visualization.md) (A2 acceptance notes); follow
  the same handling rather than inventing a new waiver.
- Runs follow the working-rules background pattern: labeled live log, error, and exit-status
  files under `out/gutcheck-gg-realism/`; report paths, not narration.

Host facts for this Mac (measured, commit `945437f`, Apple M4, Node v24.13.1): bitwise
reproducibility does not extend across architectures (tier-1 float64 physics inputs differ
x64 vs arm64), but habit-class results reproduced exactly at all four ADR 0032 points — for an
eyeball check the Mac is fine; record seed/params so any host can regrow it. Exact `npm test`
on macOS needs an unsymlinked `TMPDIR` (`os.tmpdir()` symlink trips the Phase 5 evidence guard
on the harness's own scaffolding; 31–32 known failures otherwise, reported in `945437f`, not
fixed). Rendering uses Chrome WebGPU (Metal) or the WebGL2 fallback already exercised by the
Phase 4 review harness; the Phase 5 authenticated evidence lane stays Windows/D3D12 and is not
implicated by anything here.

## Steps

- [ ] Pick the run: start from `--preset dendrite`, noise on, hexPrism, ~`384,384,48`; consult
      the G-G paper's fernlike parameter sets if the preset disappoints. Record the exact
      command, seed, and dims in this file **before** launching.
- [ ] Background `grow` run on the Mac writing checkpoint + PGM dumps under
      `out/gutcheck-gg-realism/` with live/error/exit files. Record the termination reason
      (a domain-contact stop is acceptable here — it invalidates gates, not looks).
- [ ] Extraction script (new file): checkpoint → hex-lattice-aware resample → level-set mesh
      (e.g. marching cubes on the resampled field) → mesh file. Check: the mesh opens in a
      viewer and is not visibly voxelized.
- [ ] Ice-look render per ADR 0029 sketch: transmission/refraction over a designed backdrop
      gradient, dark facet-edge lines, bright ridge highlights, near-orthographic face-on
      camera, restrained post-processing. Check: a PNG at 1024² or better.
- [ ] Side-by-side against a named J0521r2p frame (state the timestamp). Record the eyeball
      verdict here: what reads as real, what gives it away, one-line recommendation for
      Phase 7 planning.
- [ ] Append every dead end to **Tried and rejected** as it happens, not at the end.

## Out of scope

- Any `LibbrechtKinetics` run — LK realism is Phase 6's question.
- Any edit to solver packages, Phase 6 lanes, artifacts, protocols, or `evidence/`.
- `solver-gpu/`, charter edits, ADRs, education content.
- Merging into `main` (separate maker decision after the verdict exists).
- Any claim stronger than the recorded eyeball sentence. No output of this branch is evidence
  for any gate, and none of it migrates into education or Phase 6/7 records except via a
  future, properly labeled plan.

## Tried and rejected

(Append as you go. Empty at plan creation.)

## Open questions

- Where the render code lives: an `app/` dev-only route (gets typecheck + existing three.js
  Rule 7 handling for free) vs. untracked scripts under `out/` (zero workspace friction, but
  unreviewable). Decide at implementation; either is acceptable for a spike.
- Which field defines the level set: smoothed attached-indicator, boundary mass `b`, or a blend.
  The ADR 0029 language ties smooth advance to the LK fill fraction, which does not exist under
  `GGThreshold` — this spike must find the G-G equivalent, and that finding is itself a useful
  Phase 7 input.
- Which J0521r2p frame is the canonical comparison target (late-growth ~90% timestamp is the
  working default).
