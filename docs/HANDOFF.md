# Handoff — decision-0045 bounded closure in flight; overnight shutdown (2026-08-06)

This is the maker-triggered stop snapshot (overnight host shutdown). `docs/PROGRESS.md` is the
compact live authority; the governing scope decision is
[decision 0045](decisions/0045-bound-phase6-closure-to-a-compute-week.md) (charter v1.22).

## Resume point

`main` = `origin/main` = `0410cf2`, tracked-clean, fully pushed. Exact `npm.cmd test` on the
merged tree (`4181724`) exited 0: Rule 7 clean over 475 files, both TypeScript projects, Vitest
83 files / 1,467 tests in 680.51 s.

The first action on resume is to relaunch the WP2 Stage A cost probe:
`node app/scripts/phase6-wp2-recon-stage-a.mjs` from the repo root (check for an existing
process first; write its stdout to `out/phase6-wp2-recon/stage-a-process.log`). The driver
resumes by skipping the rows already recorded in `out/phase6-wp2-recon/stage-a/rows.jsonl`
(A5-coarse@−15C, 163.2 s; A1-floor-n96@−15C, 10,472.8 s — both size-target); the in-flight
A2-floor-n128 row was stopped by this shutdown twice (merge, then shutdown) and restarts from
scratch, which the driver handles. Rows have a 12 h wall cap; the two ceiling rows are expected
to cap, and that is a decisive feasibility datum, not a failure.

Then, per `PROGRESS.md` → Next step, inside decision 0045's seven-day envelope (day 1 was
2026-08-06): (1) pre-register and execute the budget-capped ladder over the frozen WP1 strata;
(2) run the 204-point measured-only `M1_NO_DIP_ABLATION` sweep, arm-2-identical except
`paramSet`, with its gated values-manifest registration; (3) the WP2 unit's one non-author
review (sub-unit A + Stage A + the 0045 rescope; Stage B is closed unexecuted); (4) the WP8
gate over the amended obligations, exact `npm test`, full reconciliation.

## State to preserve

- The WP1 strata remain FROZEN (`evidence/phase6-size-strata/strata.json`, 18,867 bytes,
  SHA-256 `aba93698…d0288b6`). Decision 0045's closure labels govern every report: the
  registered headline is *not computed by decision 0045*, never satisfied.
- The maker's gut-check exploration lives in the separate worktree
  `G:\Code Files\snowflake-gutcheck-gg-realism` (branch `explore/gg-realism-gutcheck`) — not
  evidence, no gate claim, independent of Phase 6; never switch this checkout off `main`.
- Stage A rows are serial timing measurements: no CPU-heavy work (including `npm test`) while a
  row is in flight, or the row is flagged and re-run.
- No solver, evidence, or long campaign run is active at this handoff. Do not resume education,
  V4/V4.x apparatus, held-out execution, or preview-GPU work.
