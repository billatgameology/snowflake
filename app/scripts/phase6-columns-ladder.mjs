// Phase 6 — the columns diagnostic, executed.
//
// Pre-registered in `docs/phase6-columns-refinement-prereg.md` BEFORE this ran. Read that first:
// it fixes what each outcome means, so this script only has to produce the numbers.
//
// THE QUESTION. Neither arm produced a column in the Nakaya `columns` regime. The closest approach
// is arm 2 at T=-5, f=0.10: AR = 1.4000, one representable instrument step below the 1.5 floor
// (zExtent 21 / tExtent 15; a column needs tExtent 14). Is that verdict a property of the model or
// of measuring at extent 21?
//
// THE DESIGN. Vary the RULER, hold the PHYSICS fixed. Only `--dims` and `--target-extent` move, and
// they move together so `targetExtent/N` stays at the sweep's own 0.4375 — otherwise the
// domain-contact margin would improve alongside the size and the two effects could not be separated.
//
// WHY IT RUNS IN A DETACHED WORKTREE. Erratum E4: five commits landed on main during the 11.5-hour
// arm-2 sweep and the completion-time provenance check refused the artifact. An evidence run must
// not share a worktree with a session that commits. Pass --repo pointing at a detached worktree.
//
// THIS IS NOT REGISTERED EVIDENCE. No hash gates it; the published 3/90 and 54/90 do not move.
//
//   node app/scripts/phase6-columns-ladder.mjs --repo "G:/Code Files/snowflake-phase6-arm2" [--only P1] [--rung B]

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const at = argv.indexOf(name);
  return at >= 0 && at + 1 < argv.length ? argv[at + 1] : fallback;
};
const REPO = arg("--repo");
if (REPO === null || !existsSync(join(REPO, "runner", "src", "main.ts"))) {
  console.error(`--repo must point at a checkout containing runner/src/main.ts (got ${REPO})`);
  process.exit(2);
}
const CONCURRENCY = Number(arg("--concurrency", "3"));
const onlyPoint = arg("--only");
const onlyRung = arg("--rung");
const OUT_DIR = join(process.cwd(), "evidence", "phase6-columns-ladder");
const OUT_FILE = join(OUT_DIR, "ladder.json");

// The four points, fixed in the pre-registration by one stated criterion.
const POINTS = [
  { id: "P1", arm: "arm2", paramSet: "M1", tempC: -5, fraction: 0.1, sigmaInf: "0.005000", publishedAR: 1.4 },
  { id: "P2", arm: "arm2", paramSet: "M1", tempC: -4, fraction: 0.1, sigmaInf: "0.004000", publishedAR: 1.23529 },
  { id: "P3", arm: "arm2", paramSet: "M1", tempC: -5, fraction: 0.9, sigmaInf: "0.045000", publishedAR: 1.26594 },
  { id: "P4", arm: "arm1", paramSet: "CAK", tempC: -5, fraction: 0.9, sigmaInf: "0.045000", publishedAR: 1.3125 },
  // P5 — ADDED 2026-07-31, AFTER SEEING P1-B, and the reason is recorded rather than smoothed over.
  //
  // P1 (arm 2, M1, -5 C, f = 0.10) crossed the column floor at rung B: 1.40000 -> 1.52632, a COLUMN
  // at the temperature the reference demands one. The obvious next sentence is "and SDAK is what did
  // it" — but the ladder had no arm-1 run at these conditions to support it. P4 is arm 1's best
  // columns-regime point and sits at f = 0.90, a different supersaturation entirely, so the two are
  // not a controlled pair.
  //
  // P5 is that control: same temperature, same sigma_inf (0.005000 — sigma_water is
  // parameter-set-independent, so the two arms' f = 0.10 points are the SAME condition), differing
  // only in paramSet. At the registered size arm 1 reads 0.789474 here against arm 2's 1.40000.
  //
  // Adding a point after seeing data is exactly the move a pre-registration exists to restrain, so:
  // this ADDS A CONTROL that can only weaken the conclusion I am moving toward, it changes no
  // reading rule, drops no point, and its result is reported whichever way it falls. If P5 also
  // crosses, then SIZE and not SDAK makes the column, which the pre-registration already named as
  // the outcome worse for arm 2 than the one being reported.
  { id: "P5", arm: "arm1", paramSet: "CAK", tempC: -5, fraction: 0.1, sigmaInf: "0.005000", publishedAR: 0.789474 },
];
// targetExtent / N = 0.4375 at every rung — the sweep's own ratio.
//
// ⚠ THAT RATIO IS NOT A JUSTIFICATION, AND SAYING IT WAS IS A DEFECT IN THIS LADDER'S DESIGN.
// The `domain-budgets` freeze row states plainly: "WP3 §1.3 also disproved ADR 0024's ratio-based
// validity limit, so this number may not be extrapolated to any other configuration — it must be
// re-measured if Δx, THE MEASUREMENT EXTENT, or the far field changes." This ladder changes the
// measurement extent at every rung. Holding extent/N fixed is exactly the ratio-based reasoning
// that row says was disproved, so rungs B and C carry NO domain-adequacy evidence, and the AR rise
// they report could be a domain effect rather than a size effect.
//
// Rung B80 is the fix, applied to the point the conclusion rests on: the SAME target extent as
// rung B at a LARGER domain. Per PHASE6_DOMAIN_SPOT_CHECK's registered criterion, if the habit
// class is identical and the attached counts agree within 0.5%, N = 64 is adequate at extent 28
// and rung B's crossing is a size effect. If they disagree, it is a domain artifact and the
// correction built on it is withdrawn.
// Rungs C64/D/D80 belong to `docs/phase6-convergence-study-prereg.md` and pick the SMALLEST domain
// at which the extent is legal under the registered 0.65 domain-contact guard, rather than a fixed
// extent/N ratio. Rung C above was run at N = 80 for extent 35 when N = 64 (0.547) was legal — the
// ratio reasoning cost compute as well as validity.
const RUNGS = [
  { id: "A", n: 48, targetExtent: 21 },
  { id: "B", n: 64, targetExtent: 28 },
  { id: "C", n: 80, targetExtent: 35 },
  { id: "B80", n: 80, targetExtent: 28 },
  { id: "C64", n: 64, targetExtent: 35 },
  { id: "D", n: 64, targetExtent: 41 },
  { id: "D80", n: 80, targetExtent: 41 },
];

/** Everything the sweep passes, unchanged except dims and target extent. */
function command(point, rung) {
  return [
    "runner/src/main.ts", "grow-lk",
    "--temp-c", String(point.tempC),
    "--sigma-inf", point.sigmaInf,
    "--dims", `${rung.n},${rung.n},${rung.n}`,
    "--dx-um", "0.35",
    "--cfl", "0.1",
    "--target-extent", String(rung.targetExtent),
    "--surface-policy", "aggregate-hv-g1h1-v6",
    "--far-field", "monopole-matched",
    "--param-set", point.paramSet,
    "--metrics-every", "100000",
  ];
}

const num = (s) => (s === undefined || s === null ? Number.NaN : Number(s));
/** Parse grow-lk's final line. The whole tail is kept regardless, so nothing is lost to a regex. */
function parseFinal(stdout) {
  const at = stdout.lastIndexOf("stop reason=");
  if (at < 0) return null;
  const line = stdout.slice(at).split("\n")[0];
  const g = (re) => re.exec(line)?.[1];
  return {
    stopReason: g(/stop reason=(\S+)/) ?? null,
    steps: num(g(/ step=(\d+)/)),
    attached: num(g(/ attached=(\d+)/)),
    extent: num(g(/ extent=(\d+)/)),
    aspectRatio: num(g(/ AR=([\d.eE+-]+)/)),
    symmetryError: num(g(/ symErr=([\d.eE+-]+)/)),
    deltaSymClean: g(/ deltaSymClean=(\w+)/) === "true",
    allConverged: g(/ allConverged=(\w+)/) === "true",
    holeFills: num(g(/ holeFills=(\d+)/)),
    line,
  };
}
/** The header's self-reported geometry — the run describing what it was actually built with. */
function parseHeader(stdout) {
  const head = stdout.slice(0, Math.max(0, stdout.indexOf("stop reason=")));
  const g = (re) => re.exec(head)?.[1];
  return {
    dimsN: num(g(/dims=(\d+)/)),
    hexRadius: num(g(/hexRadius=(\d+)/)),
    activeCells: num(g(/activeCells=(\d+)/)),
    seedSites: num(g(/seedSites=(\d+)/)),
    targetExtent: num(g(/targetExtent=(\d+)/)),
    paramSet: g(/paramSet=(\S+)/) ?? null,
  };
}

const jobs = [];
for (const p of POINTS) {
  for (const r of RUNGS) {
    if (onlyPoint !== null && p.id !== onlyPoint) continue;
    if (onlyRung !== null && r.id !== onlyRung) continue;
    jobs.push({ point: p, rung: r });
  }
}
mkdirSync(OUT_DIR, { recursive: true });
const recorded = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : [];
const key = (j) => `${j.point.id}-${j.rung.id}`;
// A row only counts as DONE if it actually produced a measurement. Killing the driver mid-run — as
// happened at the 2026-07-30 shutdown — records a row with `error` set and `aspectRatio: null`, and
// keying resume on the id alone would have skipped those runs FOREVER while the summary table
// printed a blank line for them. An incomplete row is retried and its carcass discarded.
const succeeded = (d) => d.error === null && Number.isFinite(d.aspectRatio);
const abandoned = recorded.filter((d) => !succeeded(d));
const done = recorded.filter(succeeded);
if (abandoned.length > 0) {
  console.log(`discarding ${abandoned.length} incomplete row(s) and re-running them:`);
  for (const d of abandoned) console.log(`  ${d.pointId}-${d.rungId} (${d.error === null ? "no measurement parsed" : "errored"})`);
}
const already = new Set(done.map((d) => `${d.pointId}-${d.rungId}`));
const todo = jobs.filter((j) => !already.has(key(j)));

console.log(`columns ladder: ${jobs.length} runs requested, ${todo.length} to run, ${already.size} already recorded`);
console.log(`repo:   ${REPO}`);
console.log(`out:    ${OUT_FILE}`);
for (const j of todo) console.log(`  queued ${key(j)}  T=${j.point.tempC} f=${j.point.fraction} ${j.point.paramSet} N=${j.rung.n} extent=${j.rung.targetExtent}`);

function runOne(job) {
  return new Promise((resolve) => {
    const started = Date.now();
    execFile(
      process.execPath,
      command(job.point, job.rung),
      { cwd: REPO, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
      (error, stdout) => {
        const seconds = (Date.now() - started) / 1000;
        const text = String(stdout ?? "");
        const final = parseFinal(text);
        const row = {
          pointId: job.point.id,
          rungId: job.rung.id,
          arm: job.point.arm,
          paramSet: job.point.paramSet,
          tempC: job.point.tempC,
          fraction: job.point.fraction,
          sigmaInf: job.point.sigmaInf,
          dimsN: job.rung.n,
          requestedExtent: job.rung.targetExtent,
          publishedAR: job.point.publishedAR,
          seconds,
          error: error === null ? null : String(error.message).slice(0, 400),
          header: parseHeader(text),
          ...(final ?? { stopReason: null, aspectRatio: Number.NaN }),
          stdoutTail: text.slice(-1800),
        };
        console.log(
          `  ${key(job)} done in ${(seconds / 60).toFixed(1)} min: ` +
            `stop=${row.stopReason} extent=${row.extent} AR=${row.aspectRatio} steps=${row.steps}`,
        );
        resolve(row);
      },
    );
  });
}

// Bounded concurrency, and the results file is rewritten after EVERY completion — erratum E4's
// lesson is that an 11.5-hour run holding all its output in memory is one interruption from nothing.
/**
 * MERGE-ON-WRITE, and this is a bug fix paid for with a 5.2-hour measurement.
 *
 * The previous version held its own `done` array in memory and wrote the WHOLE array after each
 * completion. Three driver instances were running concurrently against one file — the rung B/C
 * sweep, the P5 control, and the P1-B80 domain check — each having read the file at ITS OWN start
 * time. Every write therefore reverted the file to that instance's snapshot plus its own results.
 *
 * P5-B (arm 1 at −5 °C, f = 0.10) completed at ~14:21 and wrote its row. P4-C completed at ~14:46
 * and overwrote the file from a snapshot taken at 05:52, deleting it. The measurement survives only
 * as one line in a log, without the `attached`, `symErr`, `allConverged` and `deltaSymClean` fields
 * that decide whether a run is admissible at all — so it has to be re-run, which is the honest cost.
 *
 * The fix: re-read the file immediately before every write and merge by (pointId, rungId), keeping
 * whichever row actually carries a measurement. Concurrent drivers now converge instead of racing.
 * This is not atomic against a simultaneous write to the byte, but the runs are hours apart and the
 * failure it actually had was a stale snapshot, not a torn write.
 */
function mergeAndWrite(row) {
  let onDisk = [];
  try {
    onDisk = JSON.parse(readFileSync(OUT_FILE, "utf8"));
  } catch {
    onDisk = [];
  }
  const merged = new Map();
  const succeeded = (d) => d.error === null && Number.isFinite(d.aspectRatio);
  for (const r of [...onDisk, ...done, row]) {
    const k = `${r.pointId}-${r.rungId}`;
    const prior = merged.get(k);
    // A row that measured something always beats one that did not.
    if (prior === undefined || (!succeeded(prior) && succeeded(r))) merged.set(k, r);
  }
  const out = [...merged.values()];
  writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));
  return out.length;
}

let next = 0;
async function worker() {
  while (next < todo.length) {
    const job = todo[next++];
    const row = await runOne(job);
    done.push(row);
    const total = mergeAndWrite(row);
    console.log(`     merged into ${OUT_FILE} — ${total} rows on disk`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

// ── The table, with the pre-registered reading applied ────────────────────────────────────────
const COLUMN_FLOOR = 1.5;
console.log("\n" + "=".repeat(88));
console.log("point  arm   T    f     rung  N   extent   AR        vs published   column?");
for (const p of POINTS) {
  for (const r of RUNGS) {
    const d = done.find((x) => x.pointId === p.id && x.rungId === r.id);
    if (d === undefined) continue;
    const delta = d.rungId === "A" ? (d.aspectRatio === p.publishedAR ? "REPRODUCES" : "**DIFFERS**") : "";
    console.log(
      `${p.id}     ${p.arm}  ${String(p.tempC).padStart(3)}  ${String(p.fraction).padEnd(4)}  ` +
        `${r.id}     ${String(r.n).padStart(2)}  ${String(d.extent).padStart(6)}   ` +
        `${String(d.aspectRatio).padEnd(9)} ${delta.padEnd(14)} ${d.aspectRatio >= COLUMN_FLOOR ? "COLUMN" : "no"}`,
    );
  }
}
console.log(`\nwritten to ${OUT_FILE}`);
console.log("Read docs/phase6-columns-refinement-prereg.md for what these outcomes mean. The reading");
console.log("was fixed before the runs; do not choose it now.");
