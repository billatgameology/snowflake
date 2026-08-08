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
|---|---|
| Completed sweep crystals | **2** (both `staged-branch1-to-plate3-*`) |
| Bentley staged attempts | 2 (`bentley785`, `bentley872`) — final mesh only, no timeline |
| Specs written and tracked | 81 in `out/gutcheck-gg-realism/specs/` |
| Still to grow | 79 |
| Disk free | ~187 GB |

The two completed crystals are **the same crystal twice**. Both hit domain contact at tick 7438,
before their switches at 8000 and 12000, so neither schedule fired — identical geometry
(343,045 verts), empty `stageTransitions`. The index labels them
`[schedule never fired — single stage]`.

## Do not restart the sweep as-is

Three things must be decided first, all measured, none guesses.

### 1. Concurrency — the default is now `logical/4`, leave it there

Measured on this box (Ryzen 9 5900XT, **16 physical** / 32 logical):

| concurrent | per run | aggregate |
|---|---|---|
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
