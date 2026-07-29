# Plan — Education static website for snowflake growth

- **Phase:** Documentation and onboarding (education-only worktree)
- **Status:** done
- **Started:** 2026-07-18
- **Last touched:** 2026-07-18

## Goal

Create a single-page educational website for the `snowflake-education` worktree that teaches snowflake physics first, then transitions into how this project’s simulation is structured, and provides child-friendly, visual, animated explanations of `rho`, `sigma`, residual/divergence checks, and checkpoint-based rigor.

## Done when

The site is committed as static assets under `docs/education/` with:

- a sectioned lesson layout (beginner sequence from real snow physics to the project simulation),
- at least two animated diagrams plus one interactive parameter mini-lab,
- explicit explainers for one growth step, expensive solves, checkpoint necessity, and parameter effects,
- no changes outside documentation files and no gate/evidence reruns triggered.

## Approach

Implement one browser-first static page (`index.html`) with supporting `education.css` and
`education.js`. Keep content text-first, with concise scientific meaning and visual sequencing
that avoids code-heavy implementation detail. Use accessible SVG/CSS animations and minimal vanilla
JavaScript so the page is deployable as static content.

## Steps

- [x] Add `docs/education/index.html` with sectioned class flow, navigation, and diagrams.
- [x] Add `docs/education/education.css` with polished visual style, responsive layout, and animations.
- [x] Add `docs/education/education.js` for section reveal and interactive educational animations.
- [x] Replace the prior quickstart markdown with the interactive site as the primary learning surface.
- [x] Verify file graph shows docs-only additions and provide a clear open instruction.

## Out of scope

- changing solver code, runner flags, checkpoints, or evidence workflows,
- running gate/evidence commands,
- adding frameworks or non-static dependencies.

## Tried and rejected

- **Plain markdown-only final output:** rejected by user request for visual interactive material.
- **Minimal single-static-block page:** rejected as too rigid for class-style sectioning and animations.

## Open questions

- None for this branch; no scientific-physics scope change is proposed.

## Completion note

- Completed the deeper 10-15 minute course flow in docs form with sectioned snow physics first,
  a full simulator architecture section, animated diagrams, interactive mini-lab controls, and
  explicit references to canonical research docs.
