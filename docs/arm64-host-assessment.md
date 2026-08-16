# arm64 host assessment — should the project move from the x64 PC to the Mac?

> **This is decision support, NOT a decision, and NOT an ADR.** No host change is taken here.
> If the operator decides to move the primary execution host, that contradicts the "Local
> execution host and operator preference" section of `AGENTS.md` and needs an ADR under Rule 5.
>
> Written 2026-07-31 on `mac-branch`. Revised the same day after the concurrent throughput probe,
> which **overturned the performance objection** in the first draft and weakened the GPU one.

> ## ⚠ THE MISSING MEASUREMENT WAS TAKEN (2026-08-01). "Performance is a wash" is WITHDRAWN.
>
> §"The one measurement still missing" asked for the same two-phase probe on the PC. It was run —
> `app/scripts/phase6-throughput-probe.mjs`, same four registered control points, same protocol,
> same code, on an idle machine — and it **contradicts this document's central estimate.**
>
> | | M4 (4P + 6E) | Ryzen 7 5700G (8C/16T) |
> |---|---|---|
> | serial idle, 4 points | 3484 s | **4959 s** |
> | 4-concurrent wall | 1247 s | **2236 s** |
> | 8-concurrent wall | 1531 s | **2580 s** |
> | scaling at 4-way | 2.79× | **2.22×** |
> | scaling at 8-way | 4.55× | **3.84×** |
> | worst per-process penalty, 4-way | +4.8% | **+54.0%** |
> | worst per-process penalty, 8-way | +39% | **+73.5%** |
> | **per-point at 8-way** | **191.4 s** | **322.5 s** |
>
> **The Mac is 1.42× faster per process serially and 1.69× faster in aggregate throughput — the
> quantity a multi-day sweep actually consumes.** The estimate of "≈1.12× — effectively parity" was
> built on an inferred PC figure of ~214 s/point; the measured figure is **322.5 s/point**, so the
> assumption named in that section was wrong in the Mac's disfavour.
>
> **And the scaling story reverses too.** This document argued the Mac's heterogeneous cores were a
> risk under saturation. Measured, the *Ryzen* degrades far worse: +54% per-process at 4-way against
> the Mac's +4.8%, and it converts 8 processes into only 3.84× throughput against the Mac's 4.55×.
> This workload is memory-bandwidth-bound, and the M4's unified memory subsystem handles concurrency
> better than dual-channel DDR4 plus SMT.
>
> **Determinism holds on both hosts:** all 16 x64 runs byte-identical per point under contention,
> matching the arm64 result.
>
> **What does NOT change: the recommendation.** Performance was listed as *not* a reason to migrate,
> and it is still not a reason — it has simply flipped from "a wash" to "a real Mac advantage" while
> the binding constraints stay where they were: **24 GB against 64 GB of headroom** (binding at the
> queued 72³), reference-architecture continuity for an x64-pinned evidence corpus, the macOS
> `TMPDIR` blocker, and the GPU. A 1.69× throughput gain does not buy a 24 GB machine more memory.
>
> Every per-run figure below that compares hosts should be read against this box.

## The short version

**Recommendation: do not migrate wholesale — but performance is no longer a reason, and neither
is the GPU as strongly as first written.** Keep the x64 PC as the registered evidence host, keep
the Mac as the second architecture and development machine.

**Aggregate sweep throughput between the two machines is roughly a wash** (estimate: within
~10–15%, Mac marginally ahead). The decision therefore rests on memory/disk headroom, reference
continuity, and the macOS test blocker — none of which is decisive on its own, which is why the
honest recommendation is "don't move yet" rather than "the Mac is worse."

## Performance — MEASURED, and it is not the problem

The first draft of this document argued that the M4's 4 performance + 6 efficiency layout would
collapse under sweep-like load, and that per-core latency did not transfer to throughput. **The
first half of that was wrong and the probe says so.**

All figures below are the four registered control points, same configuration, on the M4.
Logs mirrored to the NAS share on 2026-08-12 and now live at
`collections/phase6-arm64-host-record/2026-08-12/payload/concurrent/`
(per-file SHA-256 in `docs/nas-ledger.json`; the gitignored local copy was removed).

| regime | aggregate wall | work delivered | throughput vs serial | worst per-process penalty |
|---|---|---|---|---|
| serial (1 at a time, idle) | 3484 s (58.1 min) | 1 × 4 points | 1.00× | — |
| **4 concurrent** | **1247 s (20.8 min)** | 1 × 4 points | **2.79×** | +4.8% |
| **8 concurrent** (2 copies each) | **1531 s (25.5 min)** | 2 × 4 points | **4.55×** | +39% |

- **4-way is near-perfect.** 2.79× against a ceiling of 2.91× (bounded by the longest job) = 96%
  of achievable scaling, with ≤4.8% contention. The four performance cores are effectively
  independent for this workload; memory bandwidth is not binding at 48³.
- **8-way did not collapse.** Per-process cost rose 26–39%, and aggregate throughput still improved
  by 1.63× over 4-way. The feared efficiency-core cliff **did not appear**. macOS spread the load
  rather than stranding four processes on slow cores — the duplicate pairs finished within ~3% of
  each other (950/942, 1112/1117, 1051/1084, 1531/1513) instead of splitting into fast and slow
  groups, which is what a hard P/E partition would have produced.
- **Determinism survives contention.** All 16 runs (4 serial + 4 at 4-way + 8 at 8-way) produced
  byte-identical `stop reason` lines, including `fillLedger` and `maxAbsSmootherDrift`. Scheduling
  has no path into the arithmetic, now verified rather than assumed.

### Cross-host comparison — an ESTIMATE, with its assumption named

The x64 baseline walls were produced under contention (`research/phase6-convergence.md`: *"Wall
times are contended and are not cost measurements"*), at roughly seven concurrent processes
(`PROGRESS.md`: "eight temperatures … 40 minutes wall across seven cores"). The **8-way arm64
phase is therefore the comparable regime** — not the serial phase this document originally, and
wrongly, compared against.

| point | arm64 @ 8-way | x64 baseline (contended) |
|---|---|---|
| `robust-plate` | 950 / 942 s | 1254 s |
| `robust-column` | 1112 / 1117 s | 1326 s |
| `fragile-plate-ceiling` | 1051 / 1084 s | 1416 s |
| `fragile-column-floor` | 1531 / 1513 s | 2004 s |

Per point, the M4 is ≈ **1.28×** the x64 host under comparable load — not the 1.72× the serial
numbers suggested, and that earlier figure is retracted.

Aggregate throughput, which is what a 12-hour sweep actually consumes:

- arm64: 8 point-runs in 1531 s → **191 s of wall per point delivered**
- x64: ~7 concurrent at ~1500 s average → **~214 s of wall per point delivered**

**≈ 1.12× in the Mac's favour — effectively parity.**

> **ASSUMPTION, and the estimate fails without it:** that the x64 baseline rows were produced at
> ~7-way concurrency. That is inferred from a *different* probe (the 8-temperature cost run), not
> measured during the sweep that produced these rows. If the sweep ran at lower concurrency, the
> PC's per-point number is better than 214 s and the PC wins on throughput. **This is an estimate
> with a named assumption, not a measurement**, and the assumption is checkable in one run — see
> below. Also unmeasured: sustained thermal behaviour. The arm64 figures are 25-minute bursts; a
> 12-hour sweep is a different thermal regime, and a desktop tower has cooling headroom a laptop-
> class part does not.

### The one measurement still missing

Run this same two-phase probe on the PC: the four points serially and idle, then 8 concurrent.
That produces the clean x64 per-core number and the clean x64 scaling curve, which together
replace the estimate above with a measurement. Roughly 2.5 hours of PC time.

## The non-performance factors

**1. Headroom — now the strongest argument.** PC: 64 GB RAM, multiple NVMe SSDs. Mac: **24 GB RAM,
68 GB free of 228 GB.** Not binding at the registered 48³ — 8 concurrent processes ran without
trouble — but the finer-grid work already queued in `PROGRESS.md` (Δx = 0.2333 µm, 72³, extent 32)
is ~3.4× the cells per process, and evidence runs accumulate checkpoints and field dumps. At 8-way
concurrency on 72³ the Mac's 24 GB is a real constraint where the PC's 64 GB is not.

**2. GPU — weaker than the first draft claimed.** Phase 5 lane evidence records adapter identity
(`gate5-evidence.ts`: `adapter.vendor` / `.architecture` / `.device`) and was certified on the
RTX 3080, which Apple silicon cannot stand in for. **But** the registered `float-precision` row
states the float32 GPU port is "a labelled diagnostic cross-check only, at a relaxed divergence
tolerance, **never a gate criterion**", and the calibration probe measured it *slower* than the
CPU oracle (32.9 s against ~5 s at 28³). The GPU is not on the critical path for Phase 6, so this
costs the ability to reproduce Phase 5's device-witnessed evidence and any future GPU work — not
the sweep programme. The first draft called this "the strongest single argument"; that was wrong.

**3. Reference-architecture continuity.** Every frozen protocol hash, the 204-point sweep, gate2b
and Phase 5 were produced on x64, and `PHASE6_LIBM_DIGEST_X64_BASELINE` is the pinned constant.
The control measured that **tier 1 differs across architectures**, so making the Mac primary
changes the reference architecture for a project whose identity is epistemic honesty.
*Mitigating:* **zero checkpoints are committed** (`git ls-files | grep '\.ckpt$'` → 0), so no
committed artifact risks failing a cross-machine bitwise comparison. Real, but the smallest of the
three.

**4. The suite does not currently pass on macOS.** 31 of 32 failures come from `os.tmpdir()` being
a symlink (`/var/folders/…` → `/private/var/folders/…`) tripping the Phase 5 evidence guard on the
test harness's own scaffolding. With `TMPDIR` unsymlinked the suite reproduces exactly (1317
passed). A hard blocker for making the Mac primary, fixable by having those tests `realpathSync`
their temp root — but it touches Rule 9 anti-tampering machinery, so it is a reviewed change.

## What the Mac is unambiguously good for

**It is the second architecture**, which is what closed a control outstanding since WP0c and which
the PC structurally cannot provide. It also runs the same Node v24.13.1 and V8 13.6.233.17-node.40,
so the split is purely architectural. Keeping it in that role — plus development and exploratory
runs — captures the benefit at none of the four costs above.

## What would change the recommendation

- **The PC-side probe** showing the PC's aggregate throughput materially below the Mac's. That
  would make the Mac the better sweep host on measurement rather than estimate — though headroom
  (argument 1) would still need answering for 72³ and beyond.
- **Fixing the macOS tmpdir issue**, which retires argument 4 cheaply and is worth doing regardless
  of the host decision, since it currently blocks running the suite on the second architecture.
- **More RAM on the Mac**, which retires argument 1.

## Limits of this assessment (Rule 10)

Written by the same session that produced the evidence it cites, so it is not an independent
review. **Re-executed here:** the four tier-2 control runs serially, the same four at 4-way and
8-way concurrency, the tier-1 fingerprint, and exact `npm test` — all on arm64. **Not checked:**
any x64 run whatsoever (no x64 host was available, so every x64 number is quoted from committed
artifacts, never re-measured); the actual concurrency of the sweep that produced the x64 baseline,
which the throughput estimate assumes; sustained multi-hour thermal behaviour on either machine;
72³ memory behaviour on 24 GB; GPU behaviour on Apple silicon; and whether LK checkpoint *bytes*
are bit-identical across architectures. This session reported matching Tier 2 discrete outcomes and
full `stop reason` lines, but those raw logs and exit records remained gitignored and are no longer
available in this repository. The statement is therefore an author report, not independently
rederivable evidence or a field-by-field byte comparison.
