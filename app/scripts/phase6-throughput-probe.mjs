// Phase 6 — host throughput probe. The x64 half of the arm64 host assessment's missing measurement.
//
// WHY. `docs/arm64-host-assessment.md` compares the two candidate hosts and has to stamp its
// headline ratio as an ESTIMATE, because the only x64 wall times available come from the sweep's
// own rows — which `research/phase6-convergence.md:417` says are CONTENDED and are not cost
// measurements. So the arm64 numbers (serial on an idle machine) were being compared against x64
// numbers taken under ~7-way load. That comparison overstates one side by an unknown amount, and
// the assessment says so and asks for exactly this run.
//
// The protocol mirrors the arm64 probe so the two are comparable:
//
//   phase 1  serial, idle       4 points, one at a time     -> clean per-process cost
//   phase 2  4 concurrent       1 copy of each point        -> scaling at 4-way
//   phase 3  8 concurrent       2 copies of each point      -> scaling at saturation
//
// The four points are the registered ADR 0032 control points, and `--param-set CAK` is mandatory
// for the same reason it is mandatory everywhere else: omitting it silently runs CAK_A1.
//
// Determinism is checked as well as speed: every copy of a point must produce a byte-identical
// stop-reason line. If contention changes a result, that is a far more important finding than any
// timing.
//
//   node app/scripts/phase6-throughput-probe.mjs

import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = process.cwd();
const OUT = join(REPO, "out", "phase6-throughput-probe");
mkdirSync(OUT, { recursive: true });

const POINTS = [
  { label: "robust-plate", tempC: -2, sigmaInf: "0.002000" },
  { label: "robust-column", tempC: -28, sigmaInf: "0.031500" },
  { label: "fragile-plate-ceiling", tempC: -3, sigmaInf: "0.007500" },
  { label: "fragile-column-floor", tempC: -23, sigmaInf: "0.037875" },
];

const command = (p) => [
  "runner/src/main.ts", "grow-lk",
  "--temp-c", String(p.tempC),
  "--sigma-inf", p.sigmaInf,
  "--dims", "48,48,48",
  "--dx-um", "0.35",
  "--cfl", "0.1",
  "--target-extent", "21",
  "--surface-policy", "aggregate-hv-g1h1-v6",
  "--far-field", "monopole-matched",
  "--param-set", "CAK",
  "--metrics-every", "100000",
];

function run(p, tag) {
  return new Promise((resolve) => {
    const started = Date.now();
    execFile(process.execPath, command(p), { cwd: REPO, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }, (error, stdout) => {
      const text = String(stdout ?? "");
      const at = text.lastIndexOf("stop reason=");
      resolve({
        label: p.label,
        tag,
        seconds: (Date.now() - started) / 1000,
        finalLine: at < 0 ? null : text.slice(at).split("\n")[0],
        error: error === null ? null : String(error.message).slice(0, 200),
      });
    });
  });
}

const results = [];
const phase = async (name, jobs) => {
  console.log(`\n--- ${name}: ${jobs.length} process(es) ---`);
  const t0 = Date.now();
  const rows = await Promise.all(jobs.map((j, i) => run(j, `${name}#${i}`)));
  const wall = (Date.now() - t0) / 1000;
  for (const r of rows) console.log(`   ${r.label.padEnd(23)} ${r.seconds.toFixed(1)} s`);
  console.log(`   AGGREGATE WALL: ${wall.toFixed(1)} s`);
  results.push({ name, wall, rows });
  writeFileSync(join(OUT, "probe.json"), JSON.stringify(results, null, 1));
  return { wall, rows };
};

console.log("PHASE 6 HOST THROUGHPUT PROBE — x64");
console.log(`node ${process.version} ${process.arch} ${process.platform}`);

// Phase 1 — serial and idle. Run sequentially, not via Promise.all.
console.log("\n--- serial (idle): 4 processes, one at a time ---");
const serialRows = [];
const s0 = Date.now();
for (const p of POINTS) {
  const r = await run(p, "serial");
  serialRows.push(r);
  console.log(`   ${r.label.padEnd(23)} ${r.seconds.toFixed(1)} s`);
}
const serialWall = (Date.now() - s0) / 1000;
console.log(`   AGGREGATE WALL: ${serialWall.toFixed(1)} s`);
results.push({ name: "serial", wall: serialWall, rows: serialRows });
writeFileSync(join(OUT, "probe.json"), JSON.stringify(results, null, 1));

const four = await phase("4-concurrent", POINTS);
const eight = await phase("8-concurrent", [...POINTS, ...POINTS]);

// ── Report ────────────────────────────────────────────────────────────────────────────────────
const perProcess = (rows) => rows.map((r) => r.seconds);
const worstPenalty = (rows) => {
  let worst = 0;
  for (const r of rows) {
    const base = serialRows.find((s) => s.label === r.label).seconds;
    worst = Math.max(worst, (r.seconds - base) / base);
  }
  return worst;
};

console.log("\n" + "=".repeat(84));
console.log("| regime | aggregate wall | work | throughput vs serial | worst per-process penalty |");
console.log(`| serial (idle)   | ${serialWall.toFixed(0)} s | 1 x 4 points | 1.00x | - |`);
console.log(`| 4 concurrent    | ${four.wall.toFixed(0)} s | 1 x 4 points | ${(serialWall / four.wall).toFixed(2)}x | +${(worstPenalty(four.rows) * 100).toFixed(1)}% |`);
console.log(`| 8 concurrent    | ${eight.wall.toFixed(0)} s | 2 x 4 points | ${((2 * serialWall) / eight.wall).toFixed(2)}x | +${(worstPenalty(eight.rows) * 100).toFixed(1)}% |`);
console.log("");
console.log(`per-point throughput at 8-way: ${(eight.wall / 8).toFixed(1)} s/point`);
console.log(`per-point serial              : ${(serialWall / 4).toFixed(1)} s/point`);

// Determinism under contention — the finding that would outrank any timing.
const byLabel = new Map();
let mismatches = 0;
for (const r of [...serialRows, ...four.rows, ...eight.rows]) {
  const prior = byLabel.get(r.label);
  if (prior === undefined) byLabel.set(r.label, r.finalLine);
  else if (prior !== r.finalLine) {
    mismatches += 1;
    console.log(`\n**DETERMINISM BROKEN** for ${r.label} under contention:\n  ${prior}\n  ${r.finalLine}`);
  }
}
console.log(`\ndeterminism under contention: ${mismatches === 0 ? "all 16 runs byte-identical per point" : `${mismatches} MISMATCHES`}`);
console.log(`written to ${join(OUT, "probe.json")}`);
