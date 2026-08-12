# Resume notes — crystal sweep (written 2026-08-07 evening)

Everything is stopped. Nothing is running, nothing is half-written. Read this top to bottom
before restarting the sweep; the first run was halted for reasons that still apply.

## Where to look first

```bash
npm run dev          # note the port it prints — 5173 is often taken
```

Open `http://localhost:<port>/gutcheck-index.html`. Two sections matter:

- **Crystal by crystal** — 38 crystals, 48 comparisons, 33 with an interactive model, 1 with an
  animation (Run B, the 701-frame anim-B).
- **Generated crystals (parameter sweep)** — the new work. 4 rows, 2 with scrubbable growth
  timelines. This is the section the sweep fills up.

## What exists right now

| | |
| --- | --- |
| Completed sweep crystals | **2** (both `staged-branch1-to-plate3-*`) |
| Bentley staged attempts | 2 (`bentley785`, `bentley872`) — final mesh only, no timeline |
| Specs written and tracked | 81 in `out/gutcheck-gg-realism/specs/` |
| Still to grow | 79 |
| Disk free | ~187 GB |

The two completed crystals are **the same crystal twice**. Both hit domain contact at tick 7438,
before their switches at 8000 and 12000, so neither schedule fired — identical geometry
(343,045 verts), empty `stageTransitions`. The index labels them
`[schedule never fired — single stage]`.

## Animation dial-in in flight (started 2026-08-08)

Before the sweep restarts, the maker wants the generation spec dialed in for **smooth,
large crystal animations**: the sweep's 63-frame timelines (every 120 ticks, ~4 cells of
radial growth per frame) scrub badly next to anim-B's 701 frames (~0.9 cells/frame). Three
runs of the SAME branch 1 → plate 3 recipe are growing concurrently, sized so each lands
600+ frames; the maker picks a winner off the site comparison, then the sweep restarts with
that spec.

| id | dims | switch | frames every | spacing | expected end (revised) |
| --- | --- | --- | --- | --- | --- |
| `dialin-b1p3-500` | 500×500×96 | t4000 ✓ fired | 12 | 0.8 | tick cap 30k → ~2,500 frames |
| `dialin-b1p3-800` | 800×800×96 | t8000 | 20 | 0.8 | tick cap 40k → ~2,000 frames |
| `dialin-b1p3-1200` | 1200×1200×96 | t12000 | 40 | 0.8 | tick cap 60k → ~1,500 frames, ~2–3 days |
| `dialin-b1p3-500-f2` | 500×500×96 | t4000 ✓ fired | 2 | 0.8 | tick cap 30k → ~15,000 frames, ~120–150 GB |
| `dialin-b1p3-500-s06` | 500×500×96 | t4000 ✓ fired | 12 | 0.6 | tick cap 30k → ~2,500 frames |

**Revision 2 (2026-08-09): plate-stage radial growth is slow but not zero — the 500
reached domain contact at t26,906, just under its 30k cap (2,244 frames, 12.1 h). Its
same-seed siblings (`-f2`, `-s06`) will stop at the same tick; f2 therefore tops out
near ~13,450 frames, not 15,000. The 800/1200 will hit contact or their cap, whichever
comes first.** Original revision below kept for the reasoning: The old "contact ~t7438" figure came from runs whose schedule never fired —
pure branch mode racing to the wall. Once plate 3 takes over, radial growth nearly stalls
(~6 cells per 2,000 ticks measured on the 500) and the crystal thickens instead, so
domain contact (65% of nx) stays out of reach; far-field vapor also plateaus around 0.19,
far above the 2/3·ρ = 0.08 stop. Consequences: every run gets a two-act animation (fast
branching, then slow rim-plating) and lands 1,500–2,500 frames — master-grade density —
except `-f2`, whose every-2 sampling balloons to ~15,000 frames ≈ 120–150 GB by the cap.
The maker chose to keep `-f2` running and free disk space by moving files off G:
themselves; a background disk watchdog warns at <60 GB and <30 GB free, and stopping
`-f2` (a solo process — killing it does NOT touch the other runs) remains the pressure
valve. Its frames stay viewable either way; only its record/final-mesh/checkpoint would
be lost.

### Verdict on 1200 (2026-08-11)

The maker stopped `dialin-b1p3-1200` at t36,080 after 75 h: "no way to spend 70+ hrs for
one animation." **Production size ceiling is therefore 800 (19 h, 1,425 frames) or 500
(12 h, 2,244+ frames); 1200-scale is one-off/archival only.** The 904-frame partial
timeline is kept and viewable (STOPPED marker in its frames dir; the index labels it
"stopped by choice"). No record or final mesh exists for it.

### Video deliverable math (added later on 2026-08-08)

The maker wants video output of 15 s–60 s, phone-size up to YouTube 1080p, quality over
time. That fixes two budgets:

- **Frames** = duration × playback fps, 1:1 sim-to-video. 60 s @ 30 fps = 1,800 frames;
  60 fps doubles it. An ~1,800–2,000-frame master covers 60 s @ 30 **and** 30 s @ 60 from
  one run. The `-f2` probe (every 2 → ~3,700 frames) exists to preview 60 s @ 60 fps in
  the viewer (`?fps=60`) and decide whether 60 fps is worth 2× the frames.
- **Pixels**: a crystal filling 1080p gets ~1,000 px. 500³ ≈ 410 cells across (~2.5
  px/cell, phone-fine), 1200 ≈ 980 cells ≈ 1 cell/px — the 1200 domain is matched to
  1080p; nothing bigger is useful short of 4K (~2000²). The `-s06` probe tests whether
  spacing 0.6 visibly beats 0.8 at 1080p.
- The three 500-size runs are the SAME crystal (same seed, deterministic) sampled
  differently, so they A/B cleanly per axis.
- `-f2` also writes a full state checkpoint (`large/gen/dialin-b1p3-500-state.bin`) so
  future spacing experiments can re-extract the final mesh without regrowing. **Any
  future long run should pass `--out-state` too** — the three big dial-ins don't (flag
  didn't get added), so their final states die with the process.
- **Master run, after the 1200 finishes and its contact tick is measured**: 1200×1200×96,
  `--frames-every = contact ÷ 1800` (30 fps master) or `÷ 3600` (60 fps — decide off the
  f2 probe), spacing per the s06 probe. Disk estimate before launching: ~1,800 frames ×
  avg 25–50 MB at this size ≈ 50–90 GB (more at spacing 0.6) — prune or quantize
  (`scripts/gutcheck-mesh-quantize.ts`, the anim-B-v2q treatment, −33%) after video
  capture.

- Specs: `out/gutcheck-gg-realism/dialin/` — deliberately NOT in `specs/`, so a sweep
  resume can't pick them up. Logs: `gen/dialin-*.log`. Frames: `large/anim/dialin-*/`.
- The index has a new section, "Animation dial-in — one recipe at 500 / 800 / 1200",
  which lists these rows even while incomplete (partial timelines are viewable; the row
  says "growing"). Re-run `node scripts/gutcheck-build-index.ts` to refresh the stats.
- **Do not kill these processes** — same job-object caveat as the batch scheduler, and
  these are solo runs with no STOP-BATCH mechanism: killing one loses its progress (the
  partial timeline stays viewable, but there is no record/final mesh and no resume).
- When each finishes: `node scripts/gutcheck-render-mesh.mjs --dir out/gutcheck-gg-realism/large/gen --out-dir out/gutcheck-gg-realism/gen/renders --look glass`
  then `node scripts/gutcheck-build-index.ts`.
- Whatever spec wins is for **showcase regrows, not all 79 sweep entries** — ~4 GB of
  frames per crystal at 600+ frames × 79 ≈ 316 GB, over the 187 GB free. The sweep keeps
  a coarse `--frames-every` (60–120); winners get regrown at the fine spec.

## Outputs moved to the NAS

ALL bulk outputs (large/**, gen/renders — 446 GB, 21,480 files, SHA-256 verified) live on
`\\GameStation\snowcrystal` = drive `S:` as of 2026-08-12; the earlier lifework stash was
migrated there too. The authoritative, git-tracked ledger is **`docs/nas-ledger.md`** (+
`.json` twin with per-file hashes). The site serves them via the dev server's `/nas` route
and works whenever the NAS is attached; `docs/crystal-catalogue.md` lists every crystal
with its parameters.

## Pagefile note (2026-08-08)

`G:\pagefile.sys` was manually fixed at 96 GB (peak usage ever: 74 MB) and has been
reconfigured to a fixed 16 GB. **The 80 GB comes back at the next reboot** — but do not
reboot while dial-in runs are still growing; a reboot kills them all. Reboot after the
1200 finishes (~2026-08-10/11), then G: gains ~80 GB.

## Sweep RESTARTED 2026-08-09 (final meshes only)

The maker chose 500×500×96, no timelines ("make the crystal pieces without animation,
then we pick good ones"). Launched: 85 specs · tick cap 30000 · spacing 0.8. Bumped to
**concurrency 12** on maker request an hour in: the original 6-way scheduler is draining
on `STOP-BATCH` (its 6 in-flight bentley872-v2..v6 + b1p3-at3000 finish normally; delete
that file once it exits), and a second scheduler runs the other 79 at 12-way on its own
flag file — pause THAT one with `touch out/gutcheck-gg-realism/STOP-BATCH-12`
(`--stop-file` is new in gutcheck-grow-batch.mjs for exactly this drain-and-replace). The three decisions below are settled:
size 500³, concurrency 6→8, and the dead staged entries were handled by generating
corrected twins — every branch-first `at8000/at12000` (6 entries, contact ~t7,400 beats
the switch) is excluded and replaced by `at3000/at6000` versions; plate-first staged
entries keep their original switches (slow stage 1 means t8000/t12000 are reachable).
Pause with `touch out/gutcheck-gg-realism/STOP-BATCH`, never by killing the scheduler.
Staged runs that fire now grow to ~t27k (~8–12 h each); simple branchy specs stop at
contact ~t7.4k (~2–3 h). Expect several days total; fully resumable.

## Do not restart the sweep as-is (original analysis, decisions now made — see above)

Three things must be decided first, all measured, none guesses.

### 1. Concurrency — the default is now `logical/4`, leave it there

Measured on this box (Ryzen 9 5900XT, **16 physical** / 32 logical):

| concurrent | per run | aggregate |
| --- | --- | --- |
| 2 | 1.55 ticks/s | 3.1 ticks/s |
| 23 | 0.39 ticks/s | 9.9 ticks/s |

12× the processes bought 3.2× the throughput. The solver streams large 3-D arrays and saturates
memory bandwidth, not cores. `os.cpus()` reports 32 — that is logical processors, and sizing
against it is what produced the 23-way run. **8 concurrent is right for this machine.**

### 2. A third of the staged sweep cannot fire

Switch ticks must sit **below the domain-contact tick for the parameters in play**. At threshold
1.0, ρ 0.12, 500³, contact arrives around tick 7,400 — so every `*-at8000` and `*-at12000`
staged entry is unreachable and silently degenerates to single-stage.

Options: lower the switch ticks, raise the domain (600³ or 700³ buys more ticks but costs time),
or drop the unreachable entries. `gutcheck-grow-params.ts` now warns and records
`unfiredTransitions`, so this is at least visible — but the sweep as generated still contains
the dead combinations.

### 3. Size and time budget

At 500×500×96 and 8 concurrent, expect roughly **5–7 h per crystal**, so 79 crystals is on the
order of **2–3 days** of wall clock. 400×400×96 is ~0.64× the cells and reaches contact sooner —
probably 2.5× faster overall for some loss of arm detail. The maker has said detail matters, so
this is a real trade, not an obvious win.

## How to restart

```bash
# 1. Regenerate specs if you changed the sweep definition (never clobbers existing files)
node scripts/gutcheck-sweep-specs.mjs

# 2. Dry run first — always
node scripts/gutcheck-grow-batch.mjs --frames-every 120 --spacing 0.8 --dry-run

# 3. Go. Concurrency defaults to logical/4 (= 8 here); pass --concurrency to override.
node scripts/gutcheck-grow-batch.mjs --frames-every 120 --spacing 0.8 \
     --dims 500,500,96 --ticks 30000
```

Resumable: a crystal with a **complete** timeline manifest is skipped, a partial one is regrown.
Safe to stop and re-run.

### Pausing without destroying work — read this

```bash
touch out/gutcheck-gg-realism/STOP-BATCH     # in-flight runs finish; no new ones start
rm    out/gutcheck-gg-realism/STOP-BATCH     # then re-run the batch command to continue
```

**Do not kill the scheduler process.** The harness puts a background task's whole process tree
in a job object, so `TaskStop` *and* `Stop-Process` on the scheduler pid both take every running
solver with them. That is how 23 crystals (~83 core-hours) were lost on 2026-08-07. The
`STOP-BATCH` file exists specifically so this never needs doing again.

## After crystals finish

```bash
# Render every new mesh (batch, one browser, resumable, skips existing)
node scripts/gutcheck-render-mesh.mjs --dir out/gutcheck-gg-realism/large/gen \
     --out-dir out/gutcheck-gg-realism/gen/renders --look glass

# Refresh the site index — picks up new records, meshes and timelines automatically
node scripts/gutcheck-build-index.ts
```

Renders must be named `<id>-render.png` or `<id>.png` in `gen/renders/` for the index to find
them. The index reads `gen/*-record.json` directly, so nothing else needs editing.

## The other machine

`node scripts/gutcheck-make-workpack.mjs --concurrency 32` builds a ~600 KB self-contained
folder: copy it over, run `RUN.cmd`, copy `results/` back into `out/gutcheck-gg-realism/`.
Needs only Node ≥ 23.6 — no npm, no network, no repo.

Regenerate it at the time of use so it excludes whatever has finished here. Size concurrency off
the target's **physical** cores (the Threadripper 3975WX is 32 physical / 64 logical, so ~32,
memory permitting: ~1 GB per run).

## Open threads

- **Bentley 872** — v1 faceted the arm tips but the terminal plates are ~10% of arm length
  against the photo's ~40%. Variants `v2`–`v6` walk switch time, arm threshold and plate
  threshold independently; none has been grown yet.
- **Bentley 785** — the architecture matched (plate core + branching arms), which the plan had
  recorded as impossible for constant-parameter G-G. Its core is smooth where the real
  medallion has radiating sector structure. No timeline yet — the record is from a frames-off
  run.
- **Photo catalogue** — `figures.jsonl` in the main worktree lists 376 monograph figures, 139 of
  them photographs; 4 have been matched against existing models so far. See
  `docs/local-assets.md` for where that media lives.
- **`scripts/` is not typechecked.** The root tsconfig omits it. Running tsc directly against
  `gutcheck-build-index.ts` found a real bug the same day (a stale `r.image` that made all 48
  comparison images reappear as leftovers). Adding `scripts/**/*.ts` to the include is worth
  doing, but will surface findings across every script at once.
