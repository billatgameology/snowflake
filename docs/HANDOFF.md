# Handoff — state at the close of Phase 6 (2026-08-01)

Read this first, then `research/phase6-conclusion.md`, then `docs/phase6-lessons.md`.

## 1. Where the project is

**Phases 2b, 3, 4, 5 complete. PHASE 6 CONCLUDED; MEASURED-ONLY NAKAYA REPRODUCTION FAILED. THE
REGISTERED SCIENTIFIC GATE REMAINS INCOMPLETE.**

> **Status corrected 2026-08-01 after independent external review** (Codex/GPT-5, no involvement in
> the authoring sessions). It reproduced every measured number — arm 1 3/90, arm 2 54/90, classes
> 6/168/30 and 75/119/10, zero stored-class mismatches, two `plate→column` flips per arm and zero
> `column→plate` — and found no solver defect. **It also found that this file previously said
> "Phase 6 concluded" without qualification, which reads as a cleanly completed gate. It is not
> one.**
>
> **3/90 and 54/90 are valid measured-only counts, NOT registered headline verdicts** — the
> pre-registered conservative-intersection rule was never implemented (**O3 / R15**, and it is a
> BLOCKER for gate acceptance, not a footnote). Charter obligations were also omitted without an
> amending ADR: held-out validation, and the "hundreds of automated runs at preview resolution" on
> the GPU harness (charter line 311) — the executed work used the float64 CPU oracle at ~78 000
> active cells. **Do not report this phase as a completed gate.**
>
> Full accepted-findings list at the head of `research/phase6-conclusion.md`.

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

### O1b — CLOSE THE GATE, OR NARROW IT BY ADR — REQUIRED BEFORE PHASE 6 IS "COMPLETE"

Raised by external review 2026-08-01. Phase 6 cannot be reported as a completed gate until one of:

- **Execute R15** (the conservative-intersection headline, 612 runs per arm) **and** the charter's
  held-out validation + preview-resolution GPU runs; **or**
- **An explicit maker decision, via ADR and charter amendment, that narrows the gate** — recording
  that the float64 CPU oracle at ~78 000 cells replaces the GPU harness clause, and that held-out
  validation is deferred with a named owner.

The second is legitimate and probably correct; what is not legitimate is leaving the charter saying
one thing and the evidence being another. **Do not close this by quietly restating the registered
rule to match what was built** — ADR 0031 rejected that move by name.

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
