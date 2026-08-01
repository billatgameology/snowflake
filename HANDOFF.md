> **THIS IS NOT THE PROJECT HANDOFF.** It is the education-worktree handoff, kept for that
> session. For the current project state, open items and standing constraints, read
> **`docs/HANDOFF.md`**. Flagged 2026-08-01 after an external review found the two files
> conflicting; `docs/HANDOFF.md` was added without checking whether a root one already existed.

# Handoff — Education Worktree

## Purpose of this worktree

This worktree (`G:/Code Files/snowflake-education`) is intentionally isolated for
science education and documentation work only. It was created from `main` at commit
`6e8fad7` on branch `education-worktree` so it does not alter the active evidence
or experiment worktrees.

## Current state at handoff

- New worktree exists and is cleanly separated from:
  - `G:/Code Files/snowflake` (main)
  - `.tmp-gate2b-clean-1784305494` (immutable gate2b evidence worktree, **read-only`)
  - `.tmp-phase4-gate3-dfd83ec` (immutable gate3 evidence worktree, **read-only**)
- Root project context in main remains Phase 4 active; docs/proofs about Phase 2b v4 runs are in `main`.
- No scientific/evidence files were modified in this worktree yet.

## What to do next (immediately)

1. Start the educational documentation work under `docs/education/` (or create it if missing).
2. Follow `docs/education/onboarding.md` (new file) as the first authoring target.
3. Keep all explanatory work separate from solver/evidence changes:
   - No edits to `runner/`, `core/`, `solver-*`, or phase gates.
   - No `gate` re-runs from this worktree.
4. Commit docs changes on `education-worktree` only.

## Hard constraints (don’t break)

- `AGENTS.md` is project-authoritative and should stay untouched unless explicitly requested.
- `Rule 7` alpha naming rules and evidence integrity constraints apply to the codebase;
  this does not block markdown prose, but keep identifiers consistent if code snippets are added.
- Do not treat any `.tmp-*` evidence artifacts as reusable outputs for this educational work.
- If you need to confirm project state, read:
  - `docs/PROGRESS.md` (authoritative state)
  - active plan file under `docs/plans/`
- Always avoid altering or deleting tracked gate logs/checkpoints/artifacts.

## Suggested first deliverable

- Build an educational “Snowflake Growth 101” page with plain-language explanations of:
  - `rho` and `sigma`
  - quasi-static vapor solve
  - kinetic growth rules (`alphaHK`, `v_kin`, boundary condition)
  - residual/divergence checks
  - why checkpointed evidence is required for scientific claims

## Branch and validation workflow

- Branch: `education-worktree` (already created)
- For docs-only work, no tests are required unless you add executable code.

