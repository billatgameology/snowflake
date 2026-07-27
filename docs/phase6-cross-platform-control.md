# MAC RUN NEEDED — Phase 6 cross-platform reproducibility control

> **Status: registered and awaiting a second machine.** Everything on the x64 side is done and
> committed. What is outstanding is a single operator action on an Apple-silicon (arm64) machine,
> described below. **Nothing in Phase 6 is blocked on it** — the sweep runs and reports scoped to
> the registered x64 host, and this control either widens that scope or produces a fragility
> finding. Until it runs, no result in this project may claim cross-platform reproducibility.
>
> This file is the runbook. Its result lands in `research/phase6-convergence.md` and in the
> `float-precision` / reproducibility rows of the Phase 6 freeze list.

## Why this control exists

IEEE 754 makes `+ − × ÷ √` correctly rounded on every conforming platform. It does **not**
specify `Math.exp`, `Math.log` or `Math.pow`, and different libm implementations legitimately
differ in the last ULP. This solver depends on all three throughout its physics inputs:

| quantity | transcendental |
|---|---|
| `pSatIce`, `pSatWater`, `cSat`, `vKin`, `kineticLength` | `exp` |
| `sigma0Basal`, `sigma0Prism` | `log` and `exp` (the piecewise log-log scheme) |
| `alphaHK` | `exp`, of `−σ₀/σ_surf` |

That last one is where a ULP gets amplified rather than absorbed. `alphaHK = A·exp(−σ₀/σ_surf)`,
and at the registered conditions `σ₀/σ_surf` is of order 10, so a relative perturbation in `σ₀`
arrives at the growth rate multiplied by roughly that ratio. WP0b already demonstrated that this
solver can turn one ULP into a different crystal: a float64 addition-order difference in the
boundary operator propagated through `σ_b → alphaHK → fill rate → accumulated fill` until an
attachment threshold was crossed a step early. The mechanism is proven; only its magnitude across
architectures is unmeasured.

Phase 2b pinned its exact Node/V8 build and declined any cross-engine bitwise claim. This control
is the step past that.

## What counts as the result

**The registered comparison is the habit CLASS.** Not the digits, not the attached count.

- **Classes match** → the conclusions are portable across the two architectures, and the sweep's
  claims widen from "on the registered host" to "on both tested architectures". Any bitwise
  differences found in tier 1 are still recorded, as a measured statement about how far
  reproducibility extends.
- **A class differs** → **that is a finding, and it is reported as one.** It means the conclusion
  at that point was resting on a last-ULP coin toss. It is not averaged, not re-run until it
  agrees, and neither architecture is declared correct. The affected sweep points are labelled
  fragile.

Nothing here is a pass/fail gate on the Mac. Both outcomes are publishable; only silence is not.

## Tier 1 — the libm fingerprint (seconds)

Bitwise-exact values of every transcendental-dependent quantity above, at 1 °C spacing across the
whole Nakaya range plus the three digitized boundaries and both fixture temperatures — 448
entries, printed as raw float64 bit patterns so nothing can hide in a rounded decimal.

```sh
git clone <this repo> && cd snowflake && npm install
node runner/src/main.ts phase6-fixture
```

Compare the last line against the registered x64 baseline:

```
PHASE6 LIBM DIGEST: 560aeaf7
```

measured on **win32 x64, Node v24.13.1, V8 13.6.233.17-node.40**.

If the digests match, the two platforms agree on every physics input bit for bit, and no
downstream difference can be attributed to libm. If they differ, redirect the full output to a
file on both machines and diff it — the per-entry lines name the exact function and argument that
moved, which no end-to-end comparison can do.

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
node runner/src/main.ts grow-lk --temp-c -5 --sigma-inf 0.007500 --dims 48,48,48 \
  --dx-um 0.35 --cfl 0.1 --target-extent 21 \
  --surface-policy aggregate-hv-g1h1-v6 --far-field monopole-matched --metrics-every 100000

node runner/src/main.ts grow-lk --temp-c -15 --sigma-inf 0.023550 --dims 48,48,48 \
  --dx-um 0.35 --cfl 0.1 --target-extent 21 \
  --surface-policy aggregate-hv-g1h1-v6 --far-field monopole-matched --metrics-every 100000

# Also record, on the same machine:
node --version && node -p "process.arch + ' ' + process.versions.v8"
```

Cost on one core, from the x64 measurements: the warm point is minutes, the cold point tens of
minutes. They are independent and can run concurrently.

### The x64 baseline

These are **not fresh runs**. They are the N = 48 rows of WP3's extent-21 domain ladder
(`research/phase6-convergence.md` §1.2), whose conditions this fixture reproduces exactly — which
is asserted in `runner/test/phase6-crossplatform.test.ts` so the two cannot drift apart.

| point | T | σ∞ | steps | attached | `AR` | **habit** |
|---|---|---|---|---|---|---|
| warm | −5 °C | 0.007500 | 145 | 1513 | 0.3821 | **plate** |
| cold | −15 °C | 0.023550 | 316 | 5161 | 1.1053 | **neutral** |

Every one of those runs reported `symErr = 0`, `deltaSymClean = true`, and all relaxations
converged; the arm64 run should report the same, and any difference in those flags is itself
worth reporting.

The two points classify differently on purpose. A control whose points shared a habit class could
not detect a flip in either.

**Read the `habit` column first.** The other columns exist to locate a difference, not to be
required to match.

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

## What must not happen

- Do not tune, re-seed, or re-run a point until the architectures agree. That converts a finding
  into a fabrication.
- Do not declare either architecture correct. Neither libm is more IEEE-conforming than the
  other; the standard does not specify these functions.
- Do not run the fixture with any flag. `phase6-fixture` refuses them, because a comparison
  across machines only means something if both ran exactly the same thing.
- Do not substitute a smaller or faster fixture. The registered configuration is the point.
