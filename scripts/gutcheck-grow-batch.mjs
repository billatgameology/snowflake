// Grow many crystals concurrently. The solver is single-threaded per run, so throughput on a
// many-core box comes from running N of them at once, not from making one faster.
//
//   node scripts/gutcheck-grow-batch.mjs --specs-dir out/gutcheck-gg-realism/specs \
//        --out-root out/gutcheck-gg-realism [--concurrency 16] [--dims 500,500,96]
//        [--ticks 30000] [--match bentley872] [--dry-run]
//
// Resumable by design: a spec whose record already exists is skipped, so the batch can be
// re-run after an interruption and will only pick up what is missing. That matters because a
// full sweep is hours long and this box has already lost one run to a shell teardown.
//
// Every generated crystal is kept whether or not it matches a photograph — the sweep is the
// deliverable (maker, 2026-08-07: "every crystal generated could be used for the website or
// might even match another by accident").

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { cpus } from "node:os";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}
const flag = (n) => process.argv.includes(`--${n}`);

const specsDir = resolve(arg("specs-dir", "out/gutcheck-gg-realism/specs"));
const outRoot = resolve(arg("out-root", "out/gutcheck-gg-realism"));
const dims = arg("dims", "500,500,96");
const ticks = arg("ticks", "30000");
// 0 = final mesh only. Otherwise every crystal also gets a growth timeline the viewer can
// scrub. Frame meshes dominate disk, so this and --spacing are the two dials that decide
// whether a sweep of this size fits: see the plan's animation-cost note.
const framesEvery = Number(arg("frames-every", "0"));
const spacing = arg("spacing", "0.6");
const match = arg("match", null);
// A spec that is being grown RIGHT NOW has no record yet, so the resume check cannot see it
// and the batch would happily start a second copy writing to the same mesh path. --exclude
// keeps in-flight ids out. (Comma-separated substrings.)
const exclude = arg("exclude", "").split(",").map((s) => s.trim()).filter((s) => s.length > 0);
const dryRun = flag("dry-run");
// Default to a QUARTER of the logical processors, and resist the urge to raise it.
//
// os.cpus() reports LOGICAL processors — 32 on a 16-core 5900XT. Sizing concurrency off that
// number is what went wrong on 2026-08-07: 23 runs on 16 physical cores. Measured there,
//   2 concurrent  -> 1.55 ticks/s each,  3.1 ticks/s aggregate
//   23 concurrent -> 0.39 ticks/s each,  9.9 ticks/s aggregate
// 12x the processes for 3.2x the throughput. The solver streams large 3-D arrays, so it
// saturates memory bandwidth long before it runs out of cores; past roughly physical/2 the
// extra runs buy almost nothing and every crystal takes proportionally longer to appear.
const concurrency = Number(arg("concurrency", String(Math.max(1, Math.floor(cpus().length / 4)))));

const genDir = join(outRoot, "gen");
const meshDir = join(outRoot, "large", "gen");
mkdirSync(genDir, { recursive: true });
mkdirSync(meshDir, { recursive: true });

const jobs = [];
for (const f of readdirSync(specsDir).sort()) {
  if (!f.endsWith(".json")) continue;
  const id = f.replace(/\.json$/, "");
  if (match !== null && !id.includes(match)) continue;
  if (exclude.some((x) => id.includes(x))) continue;
  const record = join(genDir, `${id}-record.json`);
  const framesDir = join(outRoot, "large", "anim", id);
  // Resume on what this batch actually produces. With frames on, a record alone is not
  // enough — a crystal grown earlier without a timeline still needs the animated run.
  const complete = framesEvery > 0 ? isTimelineComplete(join(framesDir, "manifest.json")) : existsSync(record);
  if (complete) continue;
  jobs.push({ id, spec: join(specsDir, f), record, mesh: join(meshDir, `${id}-mesh.bin`), framesDir });
}

function isTimelineComplete(manifestPath) {
  if (!existsSync(manifestPath)) return false;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8")).complete === true;
  } catch {
    return false; // truncated by an interrupted run — regrow it
  }
}

console.log(
  `${jobs.length} spec(s) to grow · concurrency ${concurrency} · dims ${dims} · tick cap ${ticks}` +
    (framesEvery > 0 ? ` · timeline every ${framesEvery} ticks · spacing ${spacing}` : " · final mesh only"),
);
if (jobs.length === 0 || dryRun) {
  for (const j of jobs) console.log(`  would grow ${j.id}`);
  process.exit(0);
}

let next = 0;
let done = 0;
let failed = 0;
const started = Date.now();

function runOne(job) {
  return new Promise((resolveJob) => {
    const log = join(genDir, `${job.id}.log`);
    const fd = openSync(log, "w");
    const child = spawn(
      process.execPath,
      [
        "scripts/gutcheck-grow-params.ts",
        "--spec-file", job.spec,
        "--dims", dims,
        "--ticks", ticks,
        "--out-mesh", job.mesh,
        "--record", job.record,
        "--metrics-every", "5000",
        "--spacing", spacing,
        ...(framesEvery > 0 ? ["--frames-dir", job.framesDir, "--frames-every", String(framesEvery)] : []),
      ],
      { stdio: ["ignore", fd, fd] },
    );
    child.on("exit", (code) => {
      closeSync(fd);
      const mins = ((Date.now() - started) / 60000).toFixed(0);
      if (code === 0 && existsSync(job.record)) {
        done++;
        const mb = (statSync(job.mesh).size / 1e6).toFixed(0);
        console.log(`[${mins}m] ok   ${job.id} (${mb} MB)  ${done + failed}/${jobs.length}`);
      } else {
        failed++;
        console.error(`[${mins}m] FAIL ${job.id} (exit ${code}) — see gen/${job.id}.log`);
      }
      resolveJob();
    });
  });
}

// Graceful drain. There is no safe way to stop the scheduler from outside: the harness puts a
// background task's whole process tree in a job object, so killing the scheduler — by TaskStop
// OR by Stop-Process on just its pid — takes every running solver with it. That cost 23
// crystals at ~3.6 h each on 2026-08-07. Touch this file instead: in-flight runs finish, no new
// ones start, and the batch exits clean.
// --stop-file gives a replacement batch its own flag, so it can start while its predecessor
// is still draining on the default one (concurrency changes require a relaunch).
const stopFile = join(outRoot, arg("stop-file", "STOP-BATCH"));
let draining = false;

async function worker() {
  while (next < jobs.length) {
    if (existsSync(stopFile)) {
      if (!draining) {
        draining = true;
        console.log(`\nSTOP-BATCH seen — no new runs; ${jobs.length - next} left queued. ` +
          `In-flight runs finish normally. Delete the file and re-run to continue.`);
      }
      return;
    }
    const job = jobs[next++];
    console.log(`start ${job.id}`);
    await runOne(job);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
console.log(
  `batch complete: ${done} grown, ${failed} failed, ${((Date.now() - started) / 60000).toFixed(0)} min`,
);
process.exitCode = failed > 0 ? 1 : 0;
