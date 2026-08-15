// Grow many crystals concurrently. The solver is single-threaded per run, so throughput on a
// many-core box comes from running N of them at once, not from making one faster.
//
//   node scripts/gutcheck-grow-batch.mjs [--specs-dir evidence/gutcheck-gg-realism/specs] \
//        [--out-root out/gutcheck-gg-realism] [--concurrency 16] [--dims 500,500,96]
//        [--ticks 30000] [--match bentley872] [--dry-run]
//
// Records are provenance and land in the TRACKED tree (evidence/gutcheck-gg-realism/
// gen-records/, relocated out of gitignored out/ on 2026-08-12); logs and bulk outputs stay
// under --out-root. Each finished record is re-pinned into evidence/MANIFEST.json here,
// because npm test fails on any evidence file the manifest does not list.
//
// Resumable by design: a spec is skipped only when the published record (and requested
// timeline, when enabled) matches the full result-affecting invocation. A stale basename or
// completion flag never substitutes for identity. That matters because a full sweep is hours
// long and this box has already lost one run to a shell teardown.
//
// Every generated crystal is kept whether or not it matches a photograph — the sweep is the
// deliverable (maker, 2026-08-07: "every crystal generated could be used for the website or
// might even match another by accident").

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { cpus } from "node:os";

import {
  buildGutcheckRunIdentity,
  isCompleteRecord,
  isCompleteTimeline,
  updateGutcheckEvidenceManifest,
} from "./gutcheck-evidence-lib.ts";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}
const flag = (n) => process.argv.includes(`--${n}`);

const specsDir = resolve(arg("specs-dir", "evidence/gutcheck-gg-realism/specs"));
const outRoot = resolve(arg("out-root", "out/gutcheck-gg-realism"));
// Tracked record destination — deliberately NOT under --out-root: records are the loss-exposure
// class (docs/local-assets.md) and live in git; everything under out/ is disposable.
const recordsDir = resolve(arg("records-dir", "evidence/gutcheck-gg-realism/gen-records"));
// Portable-workpack mode is implicit: the MANIFEST re-pin applies only when records land in
// THIS repo's evidence tree. A workpack (scripts/gutcheck-make-workpack.mjs) runs this same
// file next to no evidence/ at all and points --records-dir at results/gen — re-pinning
// there would crash on the absent manifest (review 2026-08-12, ERR_MODULE_NOT_FOUND's
// sibling failure).
const repoGutcheckEvidence = resolve(import.meta.dirname, "..", "evidence/gutcheck-gg-realism");
const recordsInEvidence =
  recordsDir === repoGutcheckEvidence || recordsDir.startsWith(repoGutcheckEvidence + sep);
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

const dimsParts = dims.split(",").map(Number);
if (dimsParts.length !== 3 || dimsParts.some((part) => !Number.isInteger(part) || part < 8)) {
  throw new Error("--dims wants nx,ny,nz integers >= 8");
}
const dimsIdentity = { nx: dimsParts[0], ny: dimsParts[1], nz: dimsParts[2] };
const tickCap = Number(ticks);
const spacingValue = Number(spacing);
if (!Number.isInteger(tickCap) || tickCap < 1) throw new Error("--ticks must be a positive integer");
if (!Number.isInteger(framesEvery) || framesEvery < 0) {
  throw new Error("--frames-every must be a non-negative integer");
}
if (!Number.isFinite(spacingValue) || spacingValue <= 0) throw new Error("--spacing must be positive");
if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("--concurrency must be a positive integer");

const genDir = join(outRoot, "gen"); // logs only since 2026-08-12; records go to recordsDir
mkdirSync(recordsDir, { recursive: true });
const meshDir = join(outRoot, "large", "gen");
mkdirSync(genDir, { recursive: true });
mkdirSync(meshDir, { recursive: true });

const jobs = [];
for (const f of readdirSync(specsDir).sort()) {
  if (!f.endsWith(".json")) continue;
  const id = f.replace(/\.json$/, "");
  if (match !== null && !id.includes(match)) continue;
  if (exclude.some((x) => id.includes(x))) continue;
  const record = join(recordsDir, `${id}-record.json`);
  const framesDir = join(outRoot, "large", "anim", id);
  const specPath = join(specsDir, f);
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const expected = {
    id,
    framesEvery,
    run: buildGutcheckRunIdentity({
      spec,
      dims: dimsIdentity,
      domain: "hexPrism",
      tickCap,
      rngSeed: 1,
      noiseEpsilon: 0,
      seedThickness: 1,
      extraction: { spacing: spacingValue, sigma: 0.45, iso: 0.5, margin: 4, normalDelta: 3 },
    }),
  };
  // Resume on what this batch actually produces. With frames on, a record alone is not
  // enough — a crystal grown earlier without a timeline still needs the animated run.
  // isCompleteRecord (schema + identity), not existsSync: a truncated record must count as
  // "not grown" or it skips regrowth forever. With frames on, BOTH the record and the
  // complete timeline are required — a complete-marked timeline with no record is a crashed
  // finalization and must regrow (round-2 review, 2026-08-12).
  const complete =
    framesEvery > 0
      ? isCompleteTimeline(join(framesDir, "manifest.json"), record, expected)
      : isCompleteRecord(record, expected);
  if (complete) continue;
  jobs.push({ id, spec: specPath, record, mesh: join(meshDir, `${id}-mesh.bin`), framesDir, expected });
}

// Heal the crash window even when every record is already complete: an earlier child may have
// atomically published its record and then died before its parent re-pinned the manifest. Dry
// runs remain strictly read-only.
if (recordsInEvidence && !dryRun) updateGutcheckEvidenceManifest();

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
      const complete =
        framesEvery > 0
          ? isCompleteTimeline(join(job.framesDir, "manifest.json"), job.record, job.expected)
          : isCompleteRecord(job.record, job.expected);
      if (code === 0 && complete) {
        done++;
        // Re-pin the manifest per record rather than per batch, so an interrupted batch
        // never strands npm test red — but only when the record landed in this repo's
        // evidence tree (a workpack has neither the tree nor the manifest).
        if (recordsInEvidence) updateGutcheckEvidenceManifest();
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
