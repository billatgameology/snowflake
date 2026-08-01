# Handoff — state at the close of Phase 6 (2026-08-01)

Read this first, then `research/phase6-conclusion.md`, then `docs/phase6-lessons.md`.

## 1. Where the project is

**Phases 2b, 3, 4, 5 complete. Phase 6 concluded — measurement and reporting are done; the phase's
question does not have a clean answer, and the conclusion says so.** Those are different things and
should not be blurred.

Exact `npm test` green: **74 files, 1332 tests**, `rule7` clean. Working tree clean.

### What Phase 6 established

- **SDAK is a trade**: buys 66 neutral→plate conversions, pays 20 of arm 1's 30 columns. In
  `columns-and-plates` — the easiest regime on the board — arm 2 is *worse* than the control.
- **Neither arm ever produces a `column→plate` flip** in 408 measurements. The reference needs one at
  −9.9 °C. The model's habit sequence is monotone in temperature.
- **SDAK produces the −5 °C column its author says it requires**: 1.52632 (`COLUMN`) against a
  matched no-SDAK control's 0.851852 at identical T, σ∞ and measurement size. Low-supersaturation
  specific — at f = 0.90 the control also climbs toward the floor with size.
- **Habit classes cross architectures; digits do not** (x64 `2a9f64b3` vs arm64 `3662b9e2`, tier 2
  identical at all four points).

### What Phase 6 could not establish

- The headline numbers (3/90, 54/90) describe the model **at extent 21**, and extent 21 is measured
  unable to resolve the `columns` regime.
- The registered domain **fails its own registered check**, and so does the fix that check mandates.
- **No configuration is demonstrated converged** (pre-registered outcome 3). No re-sweep was run.
- No Δx study exists warmer than −15 °C under either executed parameter set.

## 2. Open items, ranked

### O1 — Full-grid re-measurement of the `columns` regime at extent 29 — HIGHEST VALUE

The single job that converts the conclusion's biggest limitation into an answer. **Now scoped rather
than open-ended.** Measured cost: N = 64 / extent 29 ran 166–297 min per point, so a two-arm 408-point
sweep is roughly **1130 core-hours (~4 days at 12 concurrent)**.

**Before launching, read `docs/phase6-lessons.md` §B3** — the registered domain criterion is *not*
satisfied at any configuration tested, so this re-measurement would produce a better-founded number
that still fails the same check. Decide deliberately whether that is worth 4 days; it is a maker
decision, and ADR 0037 §5 explains why no re-sweep was run under the current criterion.

### O2 — Preflight asserts every registered output was produced — HIGHEST LEVERAGE

`docs/phase6-lessons.md` "What could NOT be automated". A registered check nothing calls and a
registered output nothing produces are indistinguishable from not being registered. This one check
would have caught **E6, R15 and R55** generically. Not implemented. Small compared to what it
prevents.

### O3 — R15: the registered conservative-intersection headline rule was never implemented

Needs three grid spacings per point — 612 runs per arm — which the registered budget never contained.
**A defect in the registration, not a shortcut in the implementation.** Do not close it by amending
the registration to describe what the code does; ADR 0031 rejected exactly that move by name.

### O4 — E5: no Δx convergence study warmer than −15 °C under either executed set

WP3's campaign ran `CAK_A1`, which ADR 0031 invalidated. Its cold arm is bit-identical under `CAK`
and survives; its warm arm is a different crystal. The whole `columns` regime is warmer than −15 °C.
Halving Δx costs ~60× per point.

### O5 — Host decision

`docs/arm64-host-assessment.md`, with the measured correction at its head. **The Mac is 1.69× faster
in aggregate throughput** — "performance is a wash" was withdrawn on measurement. The recommendation
still stands (do not migrate wholesale) on **headroom (24 GB vs 64 GB, binding at the queued 72³),
reference continuity for an x64-pinned corpus, the macOS `TMPDIR` blocker, and the GPU** — none of
which a throughput gain addresses.

### O6 — Small and worth doing

- Fix the macOS `TMPDIR` symlink issue so the suite passes there without a workaround (31 of 32
  failures come from `os.tmpdir()` being a symlink and tripping the Phase 5 evidence guard on the
  test harness's own scaffolding).
- Decide whether the earlier-phase binaries in `out/` (862 MB, digests registered in
  `evidence/OUT-TREES-MANIFEST.json`) should move to **Git LFS**. ADR 0038 explains why that was not
  taken unilaterally.

## 3. Standing constraints — carry these forward

- **Do not push unless asked.** There are unpushed commits; see §4.
- **Never attempt the Mac/arm64 work from this machine.** (The cross-platform control is now DONE.)
- **`docs/education/**` is delegated to a separate session.** Do not touch it.
- **Read-only, digests only:** `out/phase5*`, `out/phase2b/`, `out/phase4/`, `out/phase4-visual/`.
- **Metal is deferred.** Never relabel Windows GPU evidence as Metal or claim general WebGPU
  portability.
- **Calibration probes are never citable as gate evidence.**
- **Only exact `npm test` counts as the suite being green**, and the command must be named beside the
  claim.
- **Rule 6** — state the measured claim, not the strongest one. Theorem words need a derivation about
  the quantity the claim governs.
- **Rule 7** — `alphaHK*` and `ggThresh*`; never bare `alpha`/`beta`.
- **Rule 9** — a verdict is computed from published artifacts; no component supplies both sides.
- **Rule 13** — interpretive documents get their adversarial audit *before* publication.

## 4. Repository state

- Branch `main`, tree clean. **Unpushed commits present** — the last push was a safety step before
  deleting `mac-branch`.
- **Evidence is tracked** at `evidence/` (ADR 0038), 16 files + 2 manifests, fresh-clone reproducible
  (verified by checking `HEAD` into a throwaway worktree and re-hashing: 16/16).
- `out/` is scratch and may be deleted. 862 MB of earlier-phase artifacts remain there with digests
  registered.
- A detached worktree `G:/Code Files/snowflake-phase6-arm2` exists for evidence runs, so HEAD cannot
  move under a long sweep (the structural fix from erratum E4). **Use it for any long run.**

## 5. How to verify everything from scratch

```sh
npm ci
npm test                                              # 74 files, 1332 tests
node app/scripts/phase6-wp5-independent.mjs           # arm 1  -> PASS
node app/scripts/phase6-arm2-independent.mjs          # arm 2  -> PASS
node app/scripts/phase6-arm2-negative-controls.mjs    # 16 controls, 15 CAUGHT / 1 GAP by design
node app/scripts/phase6-diagram-reconcile.mjs         # figures are the data -> PASS
node app/scripts/phase6-flip-census.mjs               # the registered flip count
node app/scripts/phase6-ladder-read.mjs               # the size ladder against its pre-registration
```

Everything reads from `evidence/`. No prior artifacts, no network, no GPU.
