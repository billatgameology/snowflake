# Phase 6 cross-platform reproducibility control

> **Status: RUN 2026-07-31 on Apple silicon. Both tiers measured.** See **§Result** below.
> Tier 1 **differs** across architectures; tier 2 **reproduced exactly at all four points**.
>
> This file is the runbook, and it is retained as the protocol that was executed. Its result is
> recorded here, in `research/phase6-convergence.md`, and in
> `PHASE6_LIBM_DIGEST_ARM64_BASELINE`. It is **not** recorded in the `float-precision` freeze-list
> row: that row's prose is hash-pinned and editing it breaks the registered protocol hashes, so it
> needs an ADR. See the note at the end of §Reporting the result.
>
> The exact former Git blob of the arm64 tier-1 table is preserved at
> `evidence/phase6-crossplatform/arm64-libm-fingerprint.txt` (18,398 bytes; SHA-256
> `d6686f8e687bc4328cf693febe0325932077582f4fd3445bf6d6010e9bce0c02`) and registered in
> `evidence/MANIFEST.json`. The complete x64 fixture output is preserved beside it (18,395 bytes;
> SHA-256 `c21fa3775360cfb910d524bf34eb2a6fef76059476805e50b9acb7531f6b53a4`). Their exact comparison localizes the difference to 9/448
> entries, 1–31 ULP; the largest is `alphaHK.prism|-14.0@0.25` at 31 ULP.

## Why this control exists

IEEE 754 makes `+ − × ÷ √` correctly rounded on every conforming platform. It does **not**
specify `Math.exp`, `Math.log` or `Math.pow`, and different libm implementations legitimately
differ in low-order ULPs. This solver depends on all three throughout its physics inputs:

| quantity | transcendental |
|---|---|
| `pSatIce`, `pSatWater`, `cSat`, `vKin`, `kineticLength` | `exp` |
| `sigma0Basal`, `sigma0Prism` | `log` and `exp` (the piecewise log-log scheme) |
| `alphaHK` | `exp`, of `−σ₀/σ_surf` |

That last one is where a ULP gets amplified rather than absorbed. `alphaHK = A·exp(−σ₀/σ_surf)`,
and at the registered conditions `σ₀/σ_surf` is of order 10, so a relative perturbation in `σ₀`
arrives at the growth rate multiplied by roughly that ratio. WP0b already demonstrated that this
solver did turn one ULP into a different crystal in that measured case: a float64 addition-order difference in the
boundary operator propagated through `σ_b → alphaHK → fill rate → accumulated fill` until an
attachment threshold was crossed a step early. That measured case establishes the mechanism; it
does not prove how often or how strongly it acts across architectures.

Phase 2b pinned its exact Node/V8 build and declined any cross-engine bitwise claim. This control
is the step past that.

## What counts as the result

**The registered comparison is the habit CLASS.** Not the digits, not the attached count.

- **Classes match** → the conclusions are portable across the two architectures, and the sweep's
  claims widen from "on the registered host" to "on both tested architectures". Any bitwise
  differences found in tier 1 are still recorded, as a measured statement about how far
  reproducibility extends.
- **A class differs** → **that is a finding, and it is reported as one.** It means the conclusion
  at that point was sensitive to low-order platform arithmetic. It is not averaged, not re-run until it
  agrees, and neither architecture is declared correct. The affected sweep points are labelled
  fragile.

Nothing here is a pass/fail gate on the Mac. Both outcomes are publishable; only silence is not.

## Tier 1 — the libm fingerprint (seconds)

Bitwise-exact values of every transcendental-dependent quantity above, at 1 °C spacing across the
whole Nakaya range plus the three digitized boundaries and every fixture temperature — 448
entries, printed as raw float64 bit patterns so nothing can hide in a rounded decimal.

```sh
git clone <this repo> && cd snowflake && npm install
node runner/src/main.ts phase6-fixture
```

Compare the last line against the registered x64 baseline:

```
PHASE6 LIBM DIGEST: 2a9f64b3
```

measured on **win32 x64, Node v24.13.1, V8 13.6.233.17-node.40**.

> **Re-issued 2026-07-28 by ADR 0031**, `560aeaf7` → `2a9f64b3`. The fingerprint previously sampled
> `nucleationAPrism` and `alphaHK` at a hard-coded `"CAK_A1"`, under which `nucleationAPrism`
> returns a constant 1 at every temperature — so it fingerprinted a code path the sweep does not
> ship and exercised nothing of the A_prism interpolation. It now samples the registered
> `PHASE6_PARAM_SET`. **Any arm64 digest recorded against `560aeaf7` is not comparable to this
> one** and must be re-measured.

If the digests match, the two platforms agree on every sampled physics input bit for bit, and no
downstream difference at those inputs can be attributed to the sampled libm path. If they differ,
preserve the full output and compare the per-entry lines; that comparison has now been executed for
the measured x64 and arm64 hosts and is pinned by `phase6-crossplatform.test.ts`.

```sh
node runner/src/main.ts phase6-fixture > fingerprint-arm64.txt
```

**Tier 1 matching does not close the control.** Identical inputs can still diverge downstream: the
relaxation is iterative, and a tie at the attachment threshold can break either way. Tier 2 is
required regardless of what tier 1 says.

## Tier 2 — the end-to-end habit classification

`phase6-fixture` prints these two commands; they are the sweep's own registered configuration
(N = 48, measurement extent 21, Δx = 0.35 µm, `cflFill` = 0.1, policy `aggregate-hv-g1h1-v6`,
far field `monopole-matched`, noise off), deliberately rather than a cheaper lookalike, because
the registered failure mode is a habit class flipping and the fixture has to sit where a class is
actually being decided.

```sh
COMMON="--dims 48,48,48 --dx-um 0.35 --cfl 0.1 --target-extent 21 \
  --surface-policy aggregate-hv-g1h1-v6 --far-field monopole-matched \
  --param-set CAK --metrics-every 100000"

# robust-plate            T =  -2 C, f = 0.10
node runner/src/main.ts grow-lk --temp-c  -2 --sigma-inf 0.002000 $COMMON

# robust-column           T = -28 C, f = 0.10
node runner/src/main.ts grow-lk --temp-c -28 --sigma-inf 0.031500 $COMMON

# fragile-plate-ceiling   T =  -3 C, f = 0.25
node runner/src/main.ts grow-lk --temp-c  -3 --sigma-inf 0.007500 $COMMON

# fragile-column-floor    T = -23 C, f = 0.15
node runner/src/main.ts grow-lk --temp-c -23 --sigma-inf 0.037875 $COMMON

# Also record, on the same machine:
node --version && node -p "process.arch + ' ' + process.versions.v8"
```

**`--param-set CAK` is mandatory and is the whole point of ADR 0031.** Omitting it silently falls
back to the CLI default `CAK_A1`, which is what caused the first sweep to run a parameterization
its own frozen protocol did not register. A run without this flag is not comparable to the
baseline below and must be discarded.

Cost on one core, from the x64 measurements: 20–35 minutes each. All four are independent and can
run concurrently.

### The x64 baseline

These are **not fresh runs**. They are rows taken verbatim from the ADR 0031 re-sweep's own
`evidence/phase6-sweep/points.json` (protocol `8aeb2b80…`, commit `390fe35`, 204/204 with zero
exclusions). ADR 0032's selection rule picks fixture points *from* the sweep's valid points, so
they had already been measured — same arithmetic, with no chance of a separate run diverging.

| point | T | σ∞ | steps | attached | `AR` | **habit** |
|---|---|---|---|---|---|---|
| `robust-plate` | −2 °C | 0.002000 | 175 | 1313 | 0.263158 | **plate** |
| `robust-column` | −28 °C | 0.031500 | 195 | 1171 | 2.33333 | **column** |
| `fragile-plate-ceiling` | −3 °C | 0.007500 | 198 | 3157 | 0.684211 | **neutral** |
| `fragile-column-floor` | −23 °C | 0.037875 | 248 | 3037 | **1.5** | **column** |

Every one reported `symErr = 0`, `deltaSymClean = true`, and all relaxations converged; the arm64
runs should report the same, and any difference in those flags is itself worth reporting.

### The two pairs mean different things — never pool them (ADR 0032)

**The robust pair** (`robust-plate`, `robust-column`) is the smallest and largest aspect ratio in
the whole sweep. It spans plate/column with wide margins, so it asks: *does the pipeline agree
across architectures at all?* **A difference here is serious** and points at something structural,
not at a rounding tie.

**The fragile pair** (`fragile-plate-ceiling`, `fragile-column-floor`) sits as close to the class
thresholds as any point in the sweep. It asks: *is any habit class here sensitive to low-order
platform arithmetic?* `fragile-column-floor` measured `AR` **exactly 1.5000** — an exact integer tie in lattice
extents landing precisely on the column floor, so a single attached site either way changes its
  class. **A difference here is EXPECTED-POSSIBLE and is a finding, not a bug.** It would show that
  classification is platform-fragile for the two tested hosts and must be reported as such.

Report the two pairs separately. A robust pair agreeing while a fragile pair differs is the most
informative outcome available, and collapsing them into one pass/fail destroys exactly that
distinction.

**Read the `habit` column first.** The other columns exist to locate a difference, not to be
required to match.

## Result — measured 2026-07-31 on arm64

**Host.** Apple M4, 4 performance + 6 efficiency cores (10 logical), macOS 26.5.2,
Node **v24.13.1**, `process.arch` **arm64**, V8 **13.6.233.17-node.40**. That is the *same Node
and V8 build* as the registered x64 baseline, so this control isolates architecture and platform
libm rather than engine version — a cleaner comparison than the protocol required.

### Tier 1 — DIFFERS

```
arm64        3662b9e2     (evidence/phase6-crossplatform/arm64-libm-fingerprint.txt, 448 entries)
x64 baseline 2a9f64b3
```

Confirmed to be the ADR 0031 **re-issued** fixture, not the retired `560aeaf7`: `nucleationAPrism`
varies with temperature (0.28 at −2 °C, 0.21 at −3 °C) rather than returning a constant 1, so it
samples `PHASE6_PARAM_SET`. The digest is FNV-1a over `name|argument|bits` only
(`phase6-crossplatform.ts` `fnv1a`) — the `platform=`/`arch=` header line is **not** hashed, so
this is a genuine float64 difference in the physics inputs and not an artifact of the banner.

**The two platforms do not agree bit-for-bit on the physics inputs.**

The difference is now localized by exact table comparison: **9 of 448 entries differ**, at ULP
distances **1, 1, 2, 3, 4, 5, 7, 11, and 31**. The largest is
`alphaHK.prism|-14.0@0.25` at **31 ULP**. The other eight named entries and both parsed full-table
448-entry digests are pinned in `runner/test/phase6-crossplatform.test.ts`; the parser rejects
duplicate, malformed, and extra rows. This is a measured two-host result, not a general bound for
other architectures or libm implementations.

### Tier 2 — ALL FOUR REPRODUCED EXACTLY

Run serially, one at a time, on an otherwise idle machine. Logs and exit status in
`out/phase6-arm64/` (gitignored); every run exited 0 with an empty stderr.

| point | steps | attached | `AR` | habit | arm64 wall | x64 wall |
|---|---|---|---|---|---|---|
| `robust-plate` | 175 | 1313 | 0.263158 | **plate** | 697 s (11.6 min) | 20.9 min |
| `robust-column` | 195 | 1171 | 2.33333 | **column** | 810 s (13.5 min) | 22.1 min |
| `fragile-plate-ceiling` | 198 | 3157 | 0.684211 | **neutral** | 780 s (13.0 min) | 23.6 min |
| `fragile-column-floor` | 248 | 3037 | 1.50000 | **column** | 1197 s (20.0 min) | 33.4 min |

> **The two wall-time columns are NOT comparable, and their ratio must not be quoted as a
> speedup.** The arm64 column was measured serially on an idle machine; the x64 column comes from
> the sweep's own rows, and `research/phase6-convergence.md` states that its wall times are
> contended and are not cost measurements. **NON-TRANSFERABLE** (Rule 11): the arm64 figure is one
> process at a time and licenses no conclusion about sweep throughput. See
> `docs/arm64-host-assessment.md`.

Every value matches `PHASE6_FIXTURE_X64_BASELINE` — not merely the registered habit class, but the
step count and attached count as well. Classes are assigned by the registered rule
(`phase6-protocol.ts`: plate `AR` ≤ 0.6667, column `AR` ≥ 1.5, else neutral).

All four reported `symErr = 0`, `deltaSymClean = true`, `allConverged = true`,
`worstDiv = 1.000e-7`, `maxKineticFill = 0.1000`, matching the baseline's stated flags.

**`fragile-column-floor` is the load-bearing one.** Its `AR` is exactly 1.5000, sitting on the
column floor by an exact integer tie in lattice extents, where a single attached site either way
changes the class. It landed on 248 steps and 3037 attached — identical to x64. The tie did not
break differently.

### What this establishes, and what it does not

- **Established:** at these four registered configurations, the habit-class conclusions reproduce
  on x64 and arm64. The sweep's claims at these points widen from "on the registered host" to
  "on both tested architectures".
- **Established, negatively:** bitwise reproducibility of the physics inputs does **not** extend
  across architectures. Phase 2b's refusal to make a cross-engine bitwise claim was correct and
  is now measured rather than assumed.
- **Not established:** that every point in the 204-point sweep is architecture-independent. Four
  points were measured. Two were selected by ADR 0032 precisely because they sit closest to the
  class thresholds, which is the strongest available evidence at this cost — but it is four
  points, not a theorem, and the surviving exact tie at `fragile-column-floor` should not be read
  as proof that no point anywhere can flip.
- **Not established:** anything about a third architecture or a different V8 build. The engine was
  held fixed here.

### Historical incidental finding — 2026-07-31 suite snapshot

Exact `npm test` on arm64: **32 failed / 1286 passed / 7 skipped (73 files)**. None of the
failures is numerical.

- **31 failures** — macOS `os.tmpdir()` is `/var/folders/…`, a symlink to `/private/var/folders/…`.
  The Phase 5 and Phase 4 evidence guards reject any path resolving through a symlink
  (`gate5-evidence.ts` `directoryIdentity`: "resolves through an alias or junction"). The Rule 9
  anti-tampering check fires on the *test harness's own scaffolding*, in
  `runner/test/gate5-evidence.test.ts`, `runner/test/gate5-runner.test.ts` and
  `app/test/phase4-verify.test.ts`, each of which does `mkdtempSync(join(tmpdir(), …))`.
  Re-running those three files with `TMPDIR=/private/tmp/vcc-tmp`: **130 passed, 0 failed.**
- **1 failure at that time** — `runner/test/phase6-sweep.test.ts` read a sweep artifact that was then
  gitignored and absent from a fresh clone. ADR 0038 later moved that artifact into tracked
  `evidence/`; this specific cause no longer applies.

With the symlink cause removed, that historical exact `npm test` gave **1317 passed / 1 failed /
7 skipped**; the remaining artifact-absence cause was later repaired. This is not a current arm64
full-suite result for the post-repair tree, so general suite portability remains to be re-measured.

The fix is for those tests to `realpathSync` their temp root before use, not for the guard to
relax — the guard is correct and is load-bearing. Not done here: this session's scope was the
control, and changing Phase 5 evidence machinery is not a cleanup refactor.

## Reporting the result

Record, in `research/phase6-convergence.md` under "Validity, and what is not established here"
(which currently states that no cross-platform control has been run):

1. The arm64 host: `node --version`, `process.arch`, V8 version, and the machine.
2. The tier-1 digest, and whether it matched.
3. If tier 1 differed: which entries, from the diff.
4. The tier-2 habit class for both points, and whether each matched the baseline.
5. The scope sentence the evidence now supports — either "conclusions reproduce on x64 and arm64"
   or "point X is fragile across architectures", with nothing in between.

Then update the `float-precision` freeze-list row's reproducibility note in
`runner/src/phase6-protocol.ts`, and delete the **MAC RUN NEEDED** marker from the top of this
file.

**Done on 2026-07-31, with one step blocked** — see §Result. The marker is removed, the
convergence report's validity bullet is rewritten, and `PHASE6_LIBM_DIGEST_ARM64_BASELINE` is
recorded so the tier-1 digest is now pinned by test on both measured architectures instead of
returning early on arm64 (pin-register R28).

> **BLOCKED, and this runbook's instruction is wrong as written: the `float-precision` freeze-list
> row cannot be edited here.** Its `source` prose is hash-pinned. Adding the reproducibility note
> to it was attempted and changed the registered protocol hashes, failing seven tests across
> `phase6-protocol.test.ts` ("pins both new hashes, with revision history"), `phase6-arm2.test.ts`
> ("keeps all three of arm 1's registered hashes") and the sweep preflight, which then rejected
> the protocol it is supposed to admit. The edit was reverted; `runner/src/phase6-protocol.ts` is
> unchanged.
>
> That row's prose is part of the protocol identity under which the 204-point sweep was produced,
> so rewriting it silently would re-stamp the sweep's protocol as something it did not run under —
> exactly the fail-open substitution Rule 9 exists to prevent. **Recording this measurement in the
> freeze list requires an ADR and a re-pin of the ADR 0033 values/justification hashes**, which is
> a registered decision, not a documentation edit, and is deliberately not taken in this session.
> Until then the measurement lives in §Result, in `research/phase6-convergence.md`, and in
> `PHASE6_LIBM_DIGEST_ARM64_BASELINE`, none of which are hash-pinned.

## What must not happen

- Do not tune, re-seed, or re-run a point until the architectures agree. That converts a finding
  into a fabrication.
- Do not declare either architecture correct. Neither libm is more IEEE-conforming than the
  other; the standard does not specify these functions.
- Do not run the fixture with any flag. `phase6-fixture` refuses them, because a comparison
  across machines only means something if both ran exactly the same thing.
- Do not substitute a smaller or faster fixture. The registered configuration is the point.
