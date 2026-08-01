# ADR 0037 — the registered domain spot-check failed, and what that costs

**Status:** DRAFT — the failure and its enumeration are final; the replacement domain is pending the
escalation check described in §4. Do not act on §5 until that returns.

**Date:** 2026-07-31

## 1. What happened

The `domain-budgets` freeze row makes the sweep's validity at N = 48 **conditional**:

> "the budget does NOT generalise across growth RATE … so the sweep's fastest-growing point must be
> spot-checked against N = 64 rather than assumed covered"

`PHASE6_DOMAIN_SPOT_CHECK` registers the criterion inside the **gated** values manifest — `coarseN`
48, `fineN` 64, identical habit class required, attached counts within 0.5% — and registers the
failure consequence: *raise the registered domain to N = 64 for the ENTIRE grid and re-run it.*

**That check had never been executed** (erratum E6). It was run on 2026-07-31, against both arms and
both natural readings of "fastest-growing", each re-derived from `points.json` rather than assumed:

| reading | point | N = 48 | N = 64 | Δ attached | class | verdict |
|---|---|---|---|---|---|---|
| arm 1 fastest/step | −31 °C, f = 0.60 | 4551 | 4551 | 0.000% | neutral = neutral | PASS |
| arm 1 most attached | −13 °C, f = 0.15 | 5291 | 5159 | **2.495%** | neutral = neutral | **FAIL** |
| arm 2 fastest/step | −6 °C, f = 0.15 | 4223 | 4295 | **1.705%** | neutral = neutral | **FAIL** |
| arm 2 most attached | −27 °C, f = 0.15 | 5329 | 5197 | **2.477%** | neutral = neutral | **FAIL** |

Three of four exceed the registered tolerance by 3–5×.

**The failures are not an artifact of the fine runs.** The one PASS reproduces the coarse attached
count *exactly* — 4551 against 4551 at a different domain. A systematic error could not do that.

**The habit CLASS is identical at all four points**, and class is the only quantity the headline
consumes, so no published tally is shown wrong by this. What fails is the registered criterion,
which requires identical class **and** attached counts within 0.5%.

## 2. Why it was findable only by running it

WP3's domain ladder concluded "value converged at 48 to 0.04%, exact from 64" — but it measured
exactly **two** conditions, −5 °C and −15 °C, and measured them under `CAK_A1` (erratum E5). Every
point that fails here is a different condition: −13, −6 and −27 °C.

**The registered domain budget was justified on two points and fails at three of the four others
that were checked.** That is precisely the hazard the freeze row named when it demanded a
spot-check at the fastest-growing point, and precisely why leaving the check unrun for the whole
phase mattered. The 0.5% tolerance is itself inherited from the same `CAK_A1` ladder, so E5 touches
the threshold as well as the justification.

## 3. What a domain change touches — and a defect it exposes

Enumerated so the edit is a known set rather than a search:

| location | what it holds | in the GATED hash? |
|---|---|---|
| `PHASE6_DOMAIN_SPOT_CHECK.coarseN` | 48 | **yes** — `domainSpotCheck` is in `phase6ValuesManifest()` |
| `PHASE6_SWEEP_DOMAIN_N` | 48 | **no** |
| `PHASE6_CROSSPLATFORM_FIXTURE.dims` | 48³ | **no** |
| `domain-budgets` freeze row prose | "48 x 48 x 48 … a 16.8 µm box" | **no** — prose is the justification manifest |
| `phase6ExpectedRunGeometry` | derives `hexRadius` 23, `activeCells` 77 879 from `dimsN` | derived, not pinned |

**This is pin-register REC 8 appearing in practice.** The quantity actually under change — the
domain the sweep runs at — is carried in an **ungated** constant and in **prose**, while only a
calibration parameter that mentions it sits inside the gated hash. So the gate cannot by itself
distinguish "we changed the registered domain" from "we edited a sentence". The freeze survives on
`PHASE6_SWEEP_DOMAIN_N` being read by the harness and checked per run, not on the hash.

Both arms' gated hashes move when `coarseN` changes, so both freezes are re-pinned and **both arms
must be re-swept** — a partial re-sweep would compare points measured at two domains, which the
same freeze row forbids: *"a per-point domain would make points incomparable with each other, which
is the one thing a morphology diagram cannot survive."*

## 4. The prerequisite this ADR is blocked on

The mandated target is N = 64. **Nothing has ever tested whether N = 64 is itself adequate.** The
spot-check only established that N = 48 and N = 64 disagree; if N = 64 and N = 80 also disagree, a
re-sweep at N = 64 would spend ~780 core-hours producing evidence that fails the very check that
ordered it.

`app/scripts/phase6-domain-escalation.mjs` runs exactly that comparison — the already-measured N = 64
runs as the coarse side, fresh N = 80 runs as the fine side, the same registered criterion and the
same registered evaluator. It is running as this is written.

- **N = 64 adequate** → the mandated target stands; proceed to §5 at N = 64.
- **N = 64 inadequate** → the mandate's target is wrong. The domain must escalate further, cost rises
  steeply (N = 80 is ~12× N = 48 per point, not 4.4×), and that is a materially different decision
  which returns to the maker rather than being taken here.

Erratum E4 records me reaching for expensive re-verification instead of the cheap discriminating
check and nearly paying 11.5 hours for it. This is that check, costing hours against days.

### RESULT (2026-07-31, 21:20) — N = 64 IS NOT ADEQUATE. 3 of 4 FAIL.

| reading | point | N=48 → 64 | **N=64 → 80** | verdict at N=64 |
|---|---|---|---|---|
| arm 1 most attached | −13 °C, f = 0.15 | 2.495% | **1.861%** | **FAIL** |
| arm 2 most attached | −27 °C, f = 0.15 | 2.477% | **0.693%** | **FAIL** |
| arm 2 fastest/step | −6 °C, f = 0.15 | 1.705% | **0.559%** | **FAIL** |
| arm 1 fastest/step | −31 °C, f = 0.60 | 0.000% | 0.264% | PASS |

**The check was worth its four hours: it stopped a ~780 core-hour re-sweep from landing on a domain
that fails the very criterion that ordered it.**

**And the finding is larger than a wrong target. The registered protocol's own remediation
instruction does not remediate.** The `domain-budgets` row's failure consequence is "raise the
registered domain to N = 64 for the ENTIRE grid and re-run it". Executed, that would have produced
408 fresh points at a domain now measured to fail the same spot-check. A registered consequence
that does not discharge the condition it answers is a defect in the registration, and it is recorded
here rather than quietly widened to N = 80.

**Escalating N alone is unlikely to be affordable.** At the worst point the successive differences
are 2.495% → 1.861%, a ratio of 0.746. If that geometric rate held, reaching the registered 0.5%
would take roughly four more domain doublings beyond N = 80 — and N = 80 already costs ~12× N = 48
per point. This is not a budget that can be bought.

**A more promising reading, and it is being tested rather than asserted.** Every failure above is at
the registered **extent 21**. At **extent 29**, P1's own domain check PASSED — N = 64 vs N = 80
agreeing to 0.354%. A plausible mechanism: at extent 21 the crystal is small relative to its
diffusion field, so the far-field boundary contributes proportionally more; as the crystal grows it
dominates its own field and domain sensitivity falls. **If that holds, the fix is a larger
measurement extent rather than an ever-larger box** — which would also address the extent
non-convergence that motivated the columns ladder, with one configuration instead of two.

**This is not yet a controlled comparison and must not be quoted as one:** the four failing points
are different (T, f) conditions from P1, so extent and condition are confounded. `P1-C64` (N = 64,
extent 35, against the existing N = 80 extent-35 run) is executing and tests the same point at a
third extent.

## 5. DECISION (2026-08-01) — no re-sweep; the measured non-convergence is the result

**Status: ACCEPTED.** §4 returned and the pre-registered convergence study completed.

Maker direction was to honor the registered consequence in full. **That consequence has no valid
target, and this ADR records why rather than substituting a cheaper one.**

1. The mandated target, N = 64, is **measured inadequate** — 3 of 4 fail against N = 80 at the
   registered extent 21 (§4). Re-sweeping there would produce 408 fresh points failing the check
   that ordered the re-sweep.
2. Escalating the domain alone is **not affordable**: successive differences run 2.495% → 1.861%
   (ratio 0.746), so reaching 0.5% needs roughly four more doublings past an N = 80 that already
   costs ~12× N = 48 per point.
3. The alternative — a larger measurement extent, where the domain checks looked better — was
   pre-registered and tested. It returns **outcome 3, NOT CONVERGED**: the domain check fails at
   extent 35 (1.071%) even though it passes at 29 and 41.

**So there is no configuration, at any affordable cost, demonstrated to satisfy the registered
criterion. A sweep at an unconverged configuration buys a different unconverged number, and the
pre-registration says so in advance.** No re-sweep is run.

**What is published instead is the non-convergence itself, measured.** That is a weaker headline and
a stronger paper: the phase reports what its numerics do and do not support, on evidence, rather
than a converged-looking figure that no check backs.

**What this decision does NOT license.** It is not a finding that N = 48 is adequate, and the
published tallies do not acquire a clean bill of health. They stand as measured at a domain that
fails its own registered check, and every document reporting them says so.

**The one thing that survives the failure intact, and it is what the comparison consumes.** Across
extents 29, 35 and 41, at BOTH N = 64 and N = 80, P1's aspect ratio is identical to six figures and
the class is `COLUMN` in all six runs. The registered criterion fails on **total accreted mass**
(11 201 vs 11 081 at extent 35 — 120 cells of interior fill inside a bit-identical envelope), not on
the habit determination. Both are reported. **The criterion is not rewritten to the one that
passes.**

### Consequential follow-up, recorded not scheduled

The registered criterion couples two quantities of different robustness: habit class, which is
invariant here across every domain tested, and attached count, which is not. A future protocol
should decide deliberately whether a mass-conservation tolerance belongs in the same gate as a
morphology criterion. **That is a protocol-design question for a later phase and is deliberately not
settled here** — changing a registered criterion in response to it failing is the exact move
ADR 0031 rejected by name.

## 5a. Superseded draft decision (retained)

Maker direction 2026-07-31: **honor the registered consequence in full** — re-sweep both arms at the
adequate domain rather than record the failure and carry it.

Cost, measured from the spot-check runs rather than estimated: N = 64 at extent 21 ran **4.0–4.7×**
its N = 48 counterpart, so a two-arm 408-point re-sweep is roughly **780 core-hours**.

To be filled once §4 returns: the target N, the re-pinned values hashes for both arms, the new
freeze commit, and the geometry closed form at the new N.

## 6. What is NOT invalidated

- **No published tally is shown wrong.** Habit class is identical at all four spot-check points, and
  class is what 3/90 and 54/90 score.
- The two-arm comparison's *controlled* character is untouched: both arms ran at the same domain, so
  whatever bias N = 48 carries, it carries equally in both and the arm-to-arm differences survive it.
- Everything measured about the arms' relationship — the trade, the flip census, the bistable-band
  failure — is a comparison between two artifacts produced identically, and none of it rests on the
  absolute attached count.
