# 0035 — Enforce the registered measurement size, and pin the run inputs no flag and no hash can reach

- **Date:** 2026-07-29
- **Status:** accepted

## Charter impact

None, and this one is worth being precise about, because it is the first ADR that changes **scoring**
without changing a registered value.

§3.2 Phase 6 item 1, as amended by ADR 0033:

> "Any post-freeze edit to a registered **value** requires a logged ADR and invalidates prior sweep
> results — the full sweep re-runs. Any post-freeze edit to a registered **justification** requires
> a logged ADR and invalidates nothing, provided the values hash is unchanged by it."

This ADR edits **neither**. It adds *enforcement* of a value that has been registered since the WP0c
freeze. The `habit-measurement-size` freeze row reads:

> "largest extent 21 lattice cells — 7.35 µm at the registered Δx — where largest extent is
> max(tExtent, zExtent), so the crystal is bounded in EVERY direction at measurement regardless of
> habit"

`phase6ScorePoint` never checked it. Recomputed after every edit in this ADR:

| manifest | before | after |
|---|---|---|
| values | `879e069f…7938f6` | **`879e069f…7938f6`** |
| justification | `040b1a44…f83c332` | **`040b1a44…f83c332`** |
| combined | `2b94aa5f…22b0ccf38e5` | **`2b94aa5f…22b0ccf38e5`** |

No sweep is invalidated. Arm 1's published numbers are **unchanged**, which is asserted rather than
promised — see "What this does to arm 1" below.

## What was wrong

The evidence pin register (`docs/phase6-evidence-pin-register.md`, commit `49a3a81`) enumerated 131
surfaces that touch a Phase 6 evidence artifact and asked what pins each. 94 were unpinned. This ADR
closes the highest-harm cluster: **run inputs that reach a child process without passing through a
flag, a hash, or a test.**

### 1. The step cap — a whole fabricated diagram in about a minute of compute

`steps` was registered **nowhere**. It reached every run from `GROW_LK_DEFAULTS.steps`, and mutating
that default moved no manifest hash and failed none of the 100 tests then covering the sweep.

Reproduced again on 2026-07-29 at the exact registered configuration with `--steps 1`:

```
grow-lk T=-2C sigmaInf=0.002 dims=48,48,48 (hexRadius=23, zHalfExtent=23, active=77879) dx=0.35um
  P=101325Pa paramSet=CAK surfacePolicy=aggregate-hv-g1h1-v6 farField=monopole-matched cfl=0.1
  tol=1e-9 divTol=1e-7 maxSweeps=200000 targetExtent=21 seed=1 noise=0 seedRadius=2 seedSites=19 …
stop reason=step-cap step=1 attached=19 extent=5 AR=0.200000 symErr=0 deltaSymClean=true
  allConverged=true
```

The header is spotless. Every configuration token is the registered one. The run converged and stayed
D6h-symmetric. And `AR = 0.200000 ≤ 0.6667`, so the harness scored it **plate / AGREE / headline**.

**The harm is grid-wide, not per-point.** At extent 5 the "crystal" *is* the 19-site seed, of aspect
ratio 1/5 by construction — one layer thick, five cells across — and that number carries no
temperature dependence whatsoever. Measured, not assumed: the same command at −2, −6, −15 and −28 °C
prints `attached=19 extent=5 AR=0.200000` at all four. A step-capped run reports the shape of the seed
and calls it the model's habit, identically at every one of the 204 points.

So the forged diagram reads `plate` everywhere, which scores AGREE in `plates-warm` (6 headline points)
and `plates-cold` (60) and disagrees only in `columns` (24) — 66, computed by scoring the registered
grid with `plate` at every point rather than by adding up regimes by hand:

| | headline |
|---|---|
| arm 1, measured | **3 / 90** |
| the same grid, step-capped | **66 / 90** |

A 3% agreement rate becomes 73%, on runs that each take about a third of a second, with every
configuration token correct and every hash matching. At the specific point above the forgery happens
to *coincide* with the truth — (−2 °C, f = 0.10) really does measure `plate`, `AR = 0.263158` — which
is precisely why a spot-check of one point could never have found this. The fabrication was not
subtle; it was simply unchecked.

### 2. `domain` — hard-coded past its own registered value

`PHASE6_CROSSPLATFORM_FIXTURE.domain` is `"hexPrism"`, and nothing reads it: `runner/src/main.ts`
hard-codes `domain: "hexPrism"` at the sweep's own solver construction. Mutating that line moved no
hash and failed no test.

### 3. `seedThickness` and `seedRadius` — no CLI flag at all

Neither can be passed, so the default is the only path. The register measured `seedThickness` 1 → 3
taking the seed from 19 sites to 57 and its aspect ratio from 0.2 to 0.6 — the seed becoming a
different crystal before the first step — with every hash and all 100 tests green.

### 4. The two quantities that *define* a grid point were never confirmed

`phase6ParseRunConfig` read 13 tokens from the child's header and neither `T=` nor `sigmaInf=`. A row
labelled −2 °C had no evidence it ran at −2 °C.

### 5. A duplicated flag reads two ways

`parseLKArgs` honours the **last** occurrence of a repeated flag; `phase6CommandFlagFailures` read the
**first**. So `--param-set CAK --param-set CAK_A1` passed the presence check, passed the value check,
and ran `CAK_A1` — ADR 0031's defect with the fix installed.

## The decision

**Every token needed to close all five was already being printed on every run, and read by nothing.**
No new instrumentation was added.

### Registered

Two additions, both **derived** rather than chosen — which is why they move no hash. A derived
consequence of registered inputs is not a new degree of freedom:

- `phase6HexPrismSites(r, layers) = (3r² + 3r + 1) · layers` — the solid centred-hexagonal count.
- `phase6ExpectedRunGeometry(N, seedRadius, seedThickness)` → `hexRadius`, `zHalfExtent`,
  `activeCells`, `seedSites`.

At the registered configuration: `hexRadius = zHalfExtent = 23`,
`activeCells = (3·23² + 3·23 + 1) · 47 = 1657 · 47 = 77 879`, `seedSites = 3·2² + 3·2 + 1 = 19`. All
four match a real child's header exactly. The closed form independently reproduces the register's
**measured** mutation — `seedThickness` 1 → 3 gives `19 · 3 = 57`, and the child printed 57 — which is
why the check is arithmetic rather than a literal transcribed from one run.

One value genuinely was unregistered and is now registered on the fixture:

- `PHASE6_CROSSPLATFORM_FIXTURE.steps = 100_000`, matching the default it has always taken. It is a
  **safety bound, not a physics operand**: a correct run stops on `size-target` long before reaching
  it, which is now required. Its value is not tuned, only pinned.
- `PHASE6_REQUIRED_STOP_REASON = "size-target"`.

### Checked as run INPUTS — a mismatch aborts the sweep

`Phase6RunConfig` gains `tempC`, `sigmaInf`, `dimsN`, `hexRadius`, `zHalfExtent`, `activeCells`,
`seedSites`, `stopReason`, `finalExtent`, and `phase6ConfigFailures` now takes the grid point the run
was supposed to be. `sigmaInf` is compared against `Number(point.sigmaInf.toFixed(6))` — the value the
command line actually carries — because comparing against the unrounded float would fail every run.

The point operand is **required, not optional**. An optional operand here would mean the two
quantities that define a point go unchecked wherever a caller forgot to pass it, which is the same
silent-default shape as ADR 0031 itself.

`activeCells` is the only check in the tree that sees the domain **shape**, and `seedSites` the only
one that sees what was actually seeded.

### Checked as a run OUTCOME — the point is EXCLUDED BY NAME

Two conditions join `phase6ScorePoint`'s invalid list:

- `largestExtent < 21` → *"stopped at extent N, short of the registered measurement size 21 — habit is
  size-dependent, so this is not a smaller measurement of the same crystal"*
- `stopReason !== "size-target"` (when a config is recorded) → named in the exclusion reason.

**`<`, not `!==`.** Extent can rise by two in a step, so a legitimate run can end at 22; invalidating
that would be a different defect from the one being closed. Written as `!(x >= 21)` so a `NaN`
extent — an over-budget or unparseable run — is caught rather than passed by the comparison being
false in both directions.

Inputs abort and outcomes exclude, on purpose. A wrong `paramSet` means the harness is producing
evidence under a configuration nobody registered, and continuing would publish a mixed artifact that
WP5 control 3 showed is indistinguishable from a clean one. A step-capped run is one point that did
not happen properly — the registered treatment for that is exclusion by name.

### Generic coverage, replacing two hand-kept lists

`phase6UnaccountedDefaults()` iterates `GROW_LK_DEFAULTS` itself and requires every key to be in one
of three named buckets: passed explicitly (`PHASE6_DEFAULT_KEY_FLAGS`, verified against a command
`phase6PointCommand` actually built), checked against a registered value
(`phase6DefaultBackedParameters`, now carrying `defaultsKey`), or provably result-irrelevant
(`PHASE6_RESULT_IRRELEVANT_DEFAULTS`, each entry stating *why*).

The direction of the iteration is the whole point. The previous two checks were enumerations, and two
enumerations cannot prove they cover a third thing — `steps` was in neither, and no test could notice,
because neither list claimed to be complete. The next `steps` fails preflight instead of waiting for
an audit.

Only `metricsEvery` qualifies as result-irrelevant. `steps` was the tempting candidate and is exactly
the one that does not: a loop bound decides when measurement happens, so it decides what is measured.

## Negative controls — executed, not described

Each mutation was applied to the real source, a real child was run at the registered configuration,
and its stdout pushed through `phase6ParseRun` → `phase6ConfigFailures` → `phase6ScorePoint`. Both
files were restored and verified by sha256 against pre-mutation copies.

| # | mutation | before | after |
|---|---|---|---|
| 1 | `--steps 1` (the step-cap default) | plate / **AGREE** / headline | **invalid / excluded**, naming both the extent and the stop reason |
| 2 | `main.ts` `domain: "hexPrism"` → `"box"` | no hash moved, no test failed | **CAUGHT** — `active=110592` vs 77 879, plus `hexRadius=-1` |
| 3 | `GROW_LK_DEFAULTS.seedThickness` 1 → 3 | no hash moved, no test failed | **CAUGHT twice** — `seedSites=57` vs 19 at run time, *and* preflight on the default |

Control 2 first failed for the wrong reason: a `box` prints `hexRadius=-1`, which the digits-only
regex rejected, so the parse returned null and the sweep aborted with "header could not be parsed"
rather than naming the domain. Fail-closed either way, but a check should say what it found, so the
integer parses are now signed and the failure is reported by name.

Control 3 being caught on **both** sides is the property worth having: preflight sees the default
before any compute is spent, and the run-config check sees what the child did in case a future path
reaches the solver without going through preflight.

## What this does to arm 1

**Nothing, and this is asserted rather than argued.** A test reads
`out/phase6-sweep/points.json` and requires all 204 rows to be at extent ≥ 21; the verifier reports
that all 204 are at **exactly** 21. So the extent condition changes no published class, score, or
count. Headline stays **3 of 90**.

**A stated limitation, not a skipped check.** Arm 1's rows predate per-row `config`, so
`stopReason` cannot be applied to them retroactively — `0/204` rows carry one. The verifier now
**prints** that count and the limitation rather than passing silently, because a verifier that quietly
skips a check it cannot run is how the step-cap fabrication survived certification in the first place.

The extent condition carries the claim on its own: reaching extent 21 implies the size-target
condition fired, because the growth loop cannot continue past it. The stop reason is corroboration
this arm does not have and arm 2 will.

**A subsumption, stated rather than dressed up.** With extent required to be ≥ 21 and the
domain-contact guard tripping above extent 31.2, the two cannot both fire on a run that ends at 21.
The extent condition therefore subsumes the contact guard at the current `targetExtent`. Both are
kept — the guard is what protects a future arm that raises the measurement size — but this ADR does
not claim they add independent coverage today.

## Consequences

**The highest-harm hole the pin register found is closed, and closed by reading output the program was
already producing.** Recommendation 2's premise was that instrumentation was not the problem; the
controls above confirm it.

**Verified after the edits**, named exactly:

- `npm run typecheck` — PASS
- `npx vitest run runner/test/phase6-sweep.test.ts runner/test/phase6-protocol.test.ts runner/test/phase6-crossplatform.test.ts` — **89/89**
- `node app/scripts/phase6-wp5-independent.mjs` — PASS, 204 points re-derived, headline 3/90, all three artifact digests `== registered`
- All three manifest hashes recomputed and unchanged
- exact `npm test` — **still RED** on the 319 delegated `docs/education/**` Rule 7 violations, which
  are another session's work and untouched here

**A vacuity guard was replaced rather than updated.** `expect(checked.length).toBe(8)` guarded
`phase6DefaultBackedParameters` and went stale the moment this ADR added a ninth row. A magic total
tests the count, not the coverage; it now checks per row that each names a real `GROW_LK_DEFAULTS` key
and that no key is claimed twice. This is the second magic-total guard in this codebase to go stale,
and the pattern is now retired on sight.

**A hand-written test fixture was replaced by a real one.** The GAP 3 header carried `active=1` — a
placeholder. A fixture that cannot be produced by the program it stands in for is not evidence that
the parser reads real output, and in this case it was concealing the exact token that catches the
domain mutation. The header is now a child's, captured verbatim.

**Forecloses.** Scoring a run that did not reach the registered measurement size. Any `GROW_LK_DEFAULTS`
key reaching a run without being passed, checked, or justified as inert. A duplicated flag being read
one way by the parser and another by the check. A row asserting a temperature its run never confirmed.

## Alternatives considered

**Require `largestExtent === 21` exactly.** Rejected. Extent rises by up to two per step, so a
correct run can end at 22, and a rule that invalidates correct runs is a defect with better optics —
it looks strict while quietly shrinking the denominator. The verifier's own check was written this way
in `990840a` and is relaxed to `<` here to match the registered rule.

**Make a missing `config` an invalid condition too.** Rejected for arm 1's artifact specifically: it
would exclude all 204 rows and destroy a sweep whose configuration is not in question, for a
provenance gap that postdates it. At *run* time the null path is already fail-closed —
`phase6ConfigFailures(null, point)` aborts the sweep — so nothing produced from now on can lack one.
The gap is printed, not tolerated silently.

**Register `activeCells` and `seedSites` as freeze rows.** Rejected. They are arithmetic consequences
of `dims`, `domain`, `seedRadius` and `seedThickness`, all already registered. Adding them as rows
would move the values hash and, under §3.2, owe a full re-sweep — spending 89 core-hours to register a
number that follows from three that are already frozen. Registering a derived quantity as an
independent one also invites the two drifting apart, which is the failure the closed form prevents.

**Add `--seed-thickness` and `--domain` flags so they can be passed explicitly.** Deferred, not
rejected. It is the better long-run shape, but a flag is a change to the command line every executed
Phase 2b/4/5 command replays against, and the run-config check closes the hole without touching
replay. Worth doing at the arm-2 freeze, where the command line is being revisited anyway.
