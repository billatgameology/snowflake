// Phase 6 — discharge the REGISTERED domain spot-check (erratum E6).
//
// WHY THIS EXISTS. The `domain-budgets` freeze row makes the sweep's validity at N = 48
// CONDITIONAL: the budget "does NOT generalise across growth RATE ... so the sweep's fastest-growing
// point must be spot-checked against N = 64 rather than assumed covered." `PHASE6_DOMAIN_SPOT_CHECK`
// registers the criterion INSIDE the gated values manifest — coarseN 48, fineN 64, identical class
// required, attached counts within 0.5% — and registers the failure consequence: raise the
// registered domain to N = 64 for the ENTIRE grid and re-run it.
//
// `phase6DomainSpotCheckPasses` has no caller outside `runner/test`. The check was never run, and
// arm 1's "What this does NOT establish" list never disclosed it as outstanding. This runs it.
//
// WHAT PLAYS EACH SIDE, and why that is not circular. The COARSE measurement is the published
// N = 48 row itself — that is the measurement whose validity is conditional, so it is the correct
// left-hand side and re-running it would test the wrong thing. The FINE measurement is a new N = 64
// run at the same registered conditions and the same registered extent 21. The verdict comes from
// the REGISTERED evaluator, imported rather than transcribed, because here the evaluator IS the
// registered criterion; the two sides it compares come from different executions.
//
// WHICH POINT. "Fastest-growing" has two natural readings and the registered row does not
// disambiguate, so BOTH are run, for BOTH arms, derived from `points.json` rather than assumed:
//
//   arm 1 `CAK`  most attached  T = -13, f = 0.15  (5291 cells)
//   arm 1 `CAK`  fastest/step   T = -31, f = 0.60  (19.79 cells/step)
//   arm 2 `M1`   most attached  T = -27, f = 0.15  (5329 cells)
//   arm 2 `M1`   fastest/step   T =  -6, f = 0.15  (19.64 cells/step)
//
// The last of those sits inside the Nakaya `columns` regime, where erratum E5 records that NO
// convergence study exists under either executed parameter set.
//
//   node app/scripts/phase6-domain-spot-check.mjs --repo "G:/Code Files/snowflake-phase6-arm2"

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { phase6DomainSpotCheckPasses } from "../../runner/src/phase6-sweep.ts";
import { PHASE6_DOMAIN_SPOT_CHECK } from "../../runner/src/phase6-protocol.ts";

const argv = process.argv.slice(2);
const arg = (n, d = null) => {
  const at = argv.indexOf(n);
  return at >= 0 && at + 1 < argv.length ? argv[at + 1] : d;
};
const REPO = arg("--repo");
if (REPO === null || !existsSync(join(REPO, "runner", "src", "main.ts"))) {
  console.error(`--repo must point at a checkout containing runner/src/main.ts (got ${REPO})`);
  process.exit(2);
}
const CONCURRENCY = Number(arg("--concurrency", "2"));
const OUT_DIR = join(process.cwd(), "out", "phase6-domain-spot-check");
const OUT_FILE = join(OUT_DIR, "spot-check.json");
const REGISTERED_EXTENT = 21;

const ARTIFACTS = { arm1: "phase6-sweep", arm2: "phase6-sweep-arm2" };
const PARAM_SET = { arm1: "CAK", arm2: "M1" };

/** Re-derive the two readings of "fastest-growing" from the artifact, never from a literal. */
function fastestPoints(arm) {
  const rows = JSON.parse(readFileSync(join(process.cwd(), "out", ARTIFACTS[arm], "points.json"), "utf8"));
  const byAttached = rows.slice().sort((a, b) => b.result.attached - a.result.attached)[0];
  const byRate = rows
    .slice()
    .sort((a, b) => b.result.attached / b.result.steps - a.result.attached / a.result.steps)[0];
  return [
    { arm, reading: "most-attached", row: byAttached },
    { arm, reading: "fastest-per-step", row: byRate },
  ];
}

const classify = (ar) => (!Number.isFinite(ar) || ar <= 0 ? "invalid" : ar <= 1 / 1.5 ? "plate" : ar >= 1.5 ? "column" : "neutral");

function command(job) {
  return [
    "runner/src/main.ts", "grow-lk",
    "--temp-c", String(job.row.point.tempC),
    "--sigma-inf", job.row.point.sigmaInf.toFixed(6),
    "--dims", `${PHASE6_DOMAIN_SPOT_CHECK.fineN},${PHASE6_DOMAIN_SPOT_CHECK.fineN},${PHASE6_DOMAIN_SPOT_CHECK.fineN}`,
    "--dx-um", "0.35",
    "--cfl", "0.1",
    "--target-extent", String(REGISTERED_EXTENT),
    "--surface-policy", "aggregate-hv-g1h1-v6",
    "--far-field", "monopole-matched",
    "--param-set", PARAM_SET[job.arm],
    "--metrics-every", "100000",
  ];
}

const jobs = [...fastestPoints("arm1"), ...fastestPoints("arm2")];
mkdirSync(OUT_DIR, { recursive: true });
const recorded = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : [];
// Same resume rule as the ladder: a row without a finite measurement is NOT done.
const done = recorded.filter((d) => d.error === null && Number.isFinite(d.fine?.aspectRatio));
const key = (j) => `${j.arm}-${j.reading}`;
const already = new Set(done.map((d) => `${d.arm}-${d.reading}`));
const todo = jobs.filter((j) => !already.has(key(j)));

console.log(`registered domain spot-check: coarseN=${PHASE6_DOMAIN_SPOT_CHECK.coarseN} fineN=${PHASE6_DOMAIN_SPOT_CHECK.fineN} ` +
  `identicalClass=${PHASE6_DOMAIN_SPOT_CHECK.requireIdenticalClass} tolerance=${PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance}`);
console.log(`onFailure: ${PHASE6_DOMAIN_SPOT_CHECK.onFailure}`);
for (const j of todo) {
  console.log(`  queued ${key(j)}  T=${j.row.point.tempC} f=${j.row.point.fraction} ${PARAM_SET[j.arm]} ` +
    `coarse: ${j.row.result.attached} cells / AR ${j.row.result.aspectRatio} / ${j.row.modelClass}`);
}

function runOne(job) {
  return new Promise((resolve) => {
    const started = Date.now();
    execFile(process.execPath, command(job), { cwd: REPO, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }, (error, stdout) => {
      const text = String(stdout ?? "");
      const at = text.lastIndexOf("stop reason=");
      const line = at < 0 ? "" : text.slice(at).split("\n")[0];
      const g = (re) => re.exec(line)?.[1];
      const fine = at < 0 ? { aspectRatio: Number.NaN } : {
        stopReason: g(/stop reason=(\S+)/) ?? null,
        steps: Number(g(/ step=(\d+)/)),
        attached: Number(g(/ attached=(\d+)/)),
        extent: Number(g(/ extent=(\d+)/)),
        aspectRatio: Number(g(/ AR=([\d.eE+-]+)/)),
        symmetryError: Number(g(/ symErr=([\d.eE+-]+)/)),
      };
      if (Number.isFinite(fine.aspectRatio)) fine.modelClass = classify(fine.aspectRatio);
      resolve({
        arm: job.arm,
        reading: job.reading,
        paramSet: PARAM_SET[job.arm],
        tempC: job.row.point.tempC,
        fraction: job.row.point.fraction,
        sigmaInf: job.row.point.sigmaInf,
        coarse: {
          dimsN: PHASE6_DOMAIN_SPOT_CHECK.coarseN,
          attached: job.row.result.attached,
          steps: job.row.result.steps,
          aspectRatio: job.row.result.aspectRatio,
          modelClass: job.row.modelClass,
          source: `out/${ARTIFACTS[job.arm]}/points.json (the published row whose validity is conditional)`,
        },
        fine: { dimsN: PHASE6_DOMAIN_SPOT_CHECK.fineN, ...fine },
        seconds: (Date.now() - started) / 1000,
        error: error === null ? null : String(error.message).slice(0, 300),
        stdoutTail: text.slice(-1200),
      });
    });
  });
}

let next = 0;
async function worker() {
  while (next < todo.length) {
    const job = todo[next++];
    const row = await runOne(job);
    done.push(row);
    writeFileSync(OUT_FILE, JSON.stringify(done, null, 1));
    console.log(`  ${key(job)} done in ${(row.seconds / 60).toFixed(1)} min: fine attached=${row.fine.attached} AR=${row.fine.aspectRatio}`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

// ── The registered verdict ────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(92));
let anyFail = false;
for (const r of done) {
  if (!Number.isFinite(r.fine.aspectRatio)) {
    console.log(`${r.arm}/${r.reading}: NO MEASUREMENT (${r.error ?? "unparsed"})`);
    anyFail = true;
    continue;
  }
  const verdict = phase6DomainSpotCheckPasses(
    { attached: r.coarse.attached, modelClass: r.coarse.modelClass },
    { attached: r.fine.attached, modelClass: r.fine.modelClass },
  );
  const rel = Math.abs(r.fine.attached - r.coarse.attached) / r.coarse.attached;
  console.log(
    `${r.arm} ${r.paramSet} ${r.reading}  T=${r.tempC} f=${r.fraction}\n` +
      `   N=48 : ${String(r.coarse.attached).padStart(5)} cells  AR ${r.coarse.aspectRatio}  ${r.coarse.modelClass}\n` +
      `   N=64 : ${String(r.fine.attached).padStart(5)} cells  AR ${r.fine.aspectRatio}  ${r.fine.modelClass}  (stop ${r.fine.stopReason}, extent ${r.fine.extent})\n` +
      `   attached differ by ${(rel * 100).toFixed(3)}% against a registered ${(PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance * 100).toFixed(1)}%\n` +
      `   REGISTERED VERDICT: ${verdict.passed ? "PASS" : "**FAIL**"} — ${verdict.reason}`,
  );
  if (!verdict.passed) anyFail = true;
}
console.log("");
if (anyFail) {
  console.log("AT LEAST ONE SPOT CHECK FAILED. The registered consequence is not discretionary:");
  console.log(`  "${PHASE6_DOMAIN_SPOT_CHECK.onFailure}"`);
  console.log("PHASE6 DOMAIN SPOT CHECK: FAIL");
  process.exit(1);
}
console.log("Every reading of the fastest-growing point passes at both arms.");
console.log("PHASE6 DOMAIN SPOT CHECK: PASS");
