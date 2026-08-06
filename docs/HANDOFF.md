# Handoff — WP1 size-strata candidate awaiting its non-author review (2026-08-06)

This is the maker-triggered stop snapshot (host restart). `docs/PROGRESS.md` is the compact live
authority; the bounded WP1 unit is governed by
[phase-6-wp1-size-strata.md](plans/phase-6-wp1-size-strata.md).

## Resume point

The maker pushed `main` on 2026-08-06 (`origin/main` = `af7463b`); two newer local commits are
unpushed: `d338265` (resume baseline + bounded WP1 plan) and `afebde3` (the WP1 size-strata
operator, tests, and the review-pending candidate freeze artifact
`evidence/phase6-size-strata/strata.json`, 14,620 bytes, SHA-256 `b27ce3a0…ce266d`). Exact
`npm.cmd` `test` on that candidate exited 0: Rule 7 clean over 436 files, both TypeScript
projects, Vitest 82 files / 1,453 tests in 689.04 s.

The next action is to relaunch the unit's one proportionate non-author review of commit `afebde3`
(decision 0042 scope; a different model than the author per Rule 10). The first reviewer process
(Claude Opus, fresh context, read-only) was stopped by this host restart before delivering any
verdict — that interruption is not a failed review round and its partial notes carry no
authority. After a clean verdict: record provenance in the WP1 plan, mark the strata frozen,
publish the WP2 operands in `PROGRESS.md`, then proceed WP2 reconnaissance pre-registration →
ladder pre-registration → registered execution → WP3 freeze → WP4 R15 → WP6 three-arm campaign →
WP8 gate.

## State to preserve

- No solver, evidence, or long campaign run is active. Nothing in `out/` is load-bearing for WP1.
- The candidate strata are S1 observed initial radius `[5.3999999999999995, 12.1]` µm and S2
  grown mass-equivalent radius at 300 s `[9.472732790460505, 20.459585775743665]` µm (quoted
  from the tracked candidate artifact), plus warm anchor W1 and seven refusals. **No stratum is
  frozen until the review closes.**
- Do not resume education, the V4/V4.x apparatus, held-out execution, or preview-GPU work.
  Phase 8–10 plan drafts remain uncharted proposals.
- Pushes remain maker-triggered.
