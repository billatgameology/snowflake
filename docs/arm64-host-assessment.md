# arm64 host assessment — should the project move from the x64 PC to the Mac?

> **This is decision support, NOT a decision, and NOT an ADR.** No host change is taken here.
> If the operator decides to move the primary execution host, that contradicts the "Local
> execution host and operator preference" section of `AGENTS.md` and needs an ADR under Rule 5.
>
> Written 2026-07-31 on `mac-branch`, alongside the Phase 6 cross-platform control
> (`docs/phase6-cross-platform-control.md` §Result), which is the only new measured evidence here.

## The short version

**Recommendation: do not migrate wholesale. Keep the x64 PC as the registered evidence host and
adopt the Mac as the second architecture and development machine.**

The reason is not that the Mac is worse. It is that **the measurement that would justify a move
has not been taken, and the one I did take does not transfer to it** (Rule 11). Three of the four
non-performance factors also favour the PC, and none of them is close.

## The performance evidence does NOT support a move — including the part that looked like it did

The four control runs, serial, on an otherwise idle M4:

| point | arm64 wall | x64 wall (baseline) | naive ratio |
|---|---|---|---|
| `robust-plate` | 697 s | 1254 s (20.9 min) | 1.80 |
| `robust-column` | 810 s | 1326 s (22.1 min) | 1.64 |
| `fragile-plate-ceiling` | 780 s | 1416 s (23.6 min) | 1.82 |
| `fragile-column-floor` | 1197 s | 2004 s (33.4 min) | 1.67 |
| **total** | **3484 s (58.1 min)** | **6000 s (100 min)** | **1.72** |

**That 1.72× is not a valid comparison and must not be quoted as one.** The x64 column is taken
from the sweep's own `points.json` rows, and `research/phase6-convergence.md:417` states plainly:
*"Wall times are contended and are not cost measurements."* The sweep runs roughly seven points
concurrently (`docs/PROGRESS.md`: "eight temperatures … cost 40 minutes wall across seven cores").
So the table compares a **contended** x64 host against an **uncontended, serial** arm64 host. It
overstates the Mac's advantage by an unknown amount, and the amount is unknown in the unhelpful
direction — it could be most of the gap.

The honest statement of what was measured: **the M4 completed the four registered points serially,
idle, in 58.1 minutes.** There is no clean x64 counterpart to compare it against, so there is
currently **no valid per-core speed comparison between the two hosts in either direction.**

### And per-core speed is the wrong quantity anyway

Even a clean per-core number would not settle this, because the work is not run one process at a
time. Sweeps run as N independent processes, so the deciding quantity is **aggregate throughput
under the real parallel load**, and the two machines differ structurally in exactly the way that
makes per-core latency non-transferable:

| | x64 PC | Mac |
|---|---|---|
| cores | Ryzen 7 5700G, **8 homogeneous physical** (16 logical) | M4, **4 performance + 6 efficiency** |
| behaviour under 7–8 concurrent solver processes | 7–8 equivalent cores | 4 fast + 3–4 much slower cores |

A single-process measurement on a heterogeneous CPU says nothing about what happens when you
saturate it, because the scheduler starts placing work on efficiency cores. This is precisely the
Rule 11 failure mode the project has already paid for twice, so it is stamped here at creation
time rather than discovered later:

> **NON-TRANSFERABLE.** The 58.1-minute serial figure was measured at one process at a time on an
> idle machine. It does not license any conclusion about sweep throughput, and no migration
> decision should rest on it.

## The measurement that would actually settle it

Cheap, and it is a genuine A/B rather than a cross-host guess:

1. On the Mac, re-run the same four control points **concurrently** and record aggregate wall time.
   Compare against the 58.1-minute serial total. This measures directly how much the M4's 4P+6E
   layout gives up under saturation — the whole question, on one machine, with no cross-host
   contention confound.
2. On the PC, run the same four points **serially and idle**. That produces the clean per-core x64
   number that does not currently exist, making the table above meaningful.

Until at least (1) exists, "the Mac is faster" is an impression, not a result.

## The non-performance factors, which mostly favour the PC

**1. GPU — the strongest single argument against moving.** Phase 5 lane evidence records adapter
identity (`gate5-evidence.ts` carries `adapter.vendor` / `.architecture` / `.device`), and it was
certified on the RTX 3080. `solver-gpu/` is a tracked package and the WGSL kernel plus GPU LK entry
points are pinned (they refuse any surface policy but v5, per `AGENTS.md`). Apple silicon has no
CUDA; the WebGPU path would run on Metal against a different adapter. Moving strands the hardware
that Phase 5's device witnesses name, and any future GPU comparison gate would be on a device the
existing evidence does not cover.

**2. Headroom.** PC: 64 GB RAM, multiple NVMe SSDs. Mac: **24 GB RAM, 68 GB free on a 228 GB
volume.** Neither is binding at the registered 48³, but the finer-grid work already queued in
`PROGRESS.md` (Δx = 0.2333 µm, 72³, extent 32) is ~3.4× the cells, and evidence runs accumulate
checkpoints and field dumps. The PC has room to grow into; the Mac has noticeably less.

**3. Reference-architecture continuity.** Every frozen protocol hash, the 204-point sweep, gate2b
and Phase 5 were produced on x64, and `PHASE6_LIBM_DIGEST_X64_BASELINE` is the pinned constant.
The control just measured that **tier 1 differs across architectures**, so making the Mac primary
changes the reference architecture for a project whose stated identity is epistemic honesty.
*Mitigating, and it matters:* **zero checkpoints are committed to git** (`git ls-files | grep
'\.ckpt$'` → 0), so no committed artifact is at risk of failing a cross-machine bitwise
comparison. The continuity cost is real but smaller than it first looks.

**4. The suite does not currently pass on macOS.** 31 of 32 failures come from `os.tmpdir()` being
a symlink (`/var/folders/…` → `/private/var/folders/…`) and tripping the Phase 5 evidence guard on
the test harness's own scaffolding. With `TMPDIR` unsymlinked the suite reproduces exactly
(1317 passed). It is a real blocker for making the Mac primary, and it is fixable — the tests
should `realpathSync` their temp root — but it touches Rule 9 anti-tampering machinery, so it is a
reviewed change, not a cleanup.

## What the Mac is unambiguously good for

Its highest value is the thing it just delivered and the PC structurally cannot: **it is the
second architecture.** The cross-platform control had been outstanding since WP0c precisely
because no second machine existed. Keeping it in that role — plus development, test runs, and
exploratory work — captures the benefit without paying any of the four costs above.

It also runs the same Node v24.13.1 and V8 13.6.233.17-node.40 as the PC, so the toolchain is
identical and the split is purely architectural, which is what made the control clean.

## What would change this recommendation

- The concurrent-throughput probe showing the M4 matching or beating the PC's aggregate sweep
  throughput. That would make the Mac attractive for CPU-only sweep work — but arguments 1 and 2
  (GPU, headroom) would still stand and would still need answering separately.
- Phase 5 / GPU work being formally closed out, which would retire argument 1.
- A Mac with substantially more RAM, which would retire argument 2.

## Limits of this assessment (Rule 10)

Written by the same session that produced the control it cites, so it is not an independent
review. What it re-executed: the four tier-2 runs, the tier-1 fingerprint, and exact `npm test`,
all on arm64. What it did **not** check: any x64 run (no x64 host was available, so every x64
number here is quoted from committed artifacts, not re-measured); concurrent throughput on either
host; GPU behaviour on Apple silicon; and whether LK checkpoint bytes are bit-identical across
architectures — tier 2 shows the *discrete* outcomes match exactly, which says nothing about the
float64 field bytes.
