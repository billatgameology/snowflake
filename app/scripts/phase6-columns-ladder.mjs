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
const OUT_DIR = join(process.cwd(), "out", "phase6-columns-ladder");
const OUT_FILE = join(OUT_DIR, "ladder.json");

// The four points, fixed in the pre-registration by one stated criterion.
const POINTS = [
  { id: "P1", arm: "arm2", paramSet: "M1", tempC: -5, fraction: 0.1, sigmaInf: "0.005000", publishedAR: 1.4 },
  { id: "P2", arm: "arm2", paramSet: "M1", tempC: -4, fraction: 0.1, sigmaInf: "0.004000", publishedAR: 1.23529 },
  { id: "P3", arm: "arm2", paramSet: "M1", tempC: -5, fraction: 0.9, sigmaInf: "0.045000", publishedAR: 1.26594 },
  { id: "P4", arm: "arm1", paramSet: "CAK", tempC: -5, fraction: 0.9, sigmaInf: "0.045000", publishedAR: 1.3125 },
];
// targetExtent / N = 0.4375 at every rung — the sweep's own ratio.
const RUNGS = [
  { id: "A", n: 48, targetExtent: 21 },
  { id: "B", n: 64, targetExtent: 28 },
  { id: "C", n: 80, targetExtent: 35 },
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
let next = 0;
async function worker() {
  while (next < todo.length) {
    const job = todo[next++];
    const row = await runOne(job);
    done.push(row);
    writeFileSync(OUT_FILE, JSON.stringify(done, null, 1));
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
