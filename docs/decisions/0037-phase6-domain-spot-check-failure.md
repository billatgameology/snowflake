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

## 5. Decision (PENDING §4)

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
