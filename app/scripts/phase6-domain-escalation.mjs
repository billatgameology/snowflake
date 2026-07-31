// Phase 6 — is N = 64 ITSELF adequate? (prerequisite to erratum E6's mandated re-sweep)
//
// WHY THIS RUNS BEFORE THE RE-SWEEP AND NOT AFTER IT. The `domain-budgets` freeze row's failure
// consequence is "raise the registered domain to N = 64 for the ENTIRE grid and re-run it", and the
// spot-check has now failed, so that re-sweep is owed. But the spot-check only established that
// N = 48 disagrees with N = 64 by 1.7–2.5% against a 0.5% tolerance. **Nothing has ever tested
// whether N = 64 agrees with N = 80.** If it does not, the mandated re-sweep would spend ~780
// core-hours producing evidence that fails the very check that ordered it.
//
// Erratum E4 records me reaching for expensive re-verification instead of the cheap discriminating
// check, and nearly paying 11.5 hours for it. This is that check, costing hours against days.
//
// THE COARSE SIDE IS THE N = 64 RUN ALREADY MEASURED, read from the spot-check artifact rather than
// re-run — same discipline as E6, where re-running the measurement under test would test the wrong
// thing. The fine side is a fresh N = 80 run at the same registered extent 21.
//
// The criterion is the registered one and is applied by the registered evaluator: identical habit
// class AND attached counts within `PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance`.
//
//   node app/scripts/phase6-domain-escalation.mjs --repo "G:/Code Files/snowflake-phase6-arm2"

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
const FINE_N = Number(arg("--fine-n", "80"));
const CONCURRENCY = Number(arg("--concurrency", "4"));
const REGISTERED_EXTENT = 21;
const SPOT = join(process.cwd(), "out", "phase6-domain-spot-check", "spot-check.json");
const OUT_DIR = join(process.cwd(), "out", "phase6-domain-escalation");
const OUT_FILE = join(OUT_DIR, `escalation-n${FINE_N}.json`);

const prior = JSON.parse(readFileSync(SPOT, "utf8")).filter((r) => Number.isFinite(r.fine?.aspectRatio));
const classify = (ar) => (!Number.isFinite(ar) || ar <= 0 ? "invalid" : ar <= 1 / 1.5 ? "plate" : ar >= 1.5 ? "column" : "neutral");

mkdirSync(OUT_DIR, { recursive: true });
const recorded = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : [];
const done = recorded.filter((d) => d.error === null && Number.isFinite(d.fine?.aspectRatio));
const key = (r) => `${r.arm}-${r.reading}`;
const already = new Set(done.map(key));
const todo = prior.filter((r) => !already.has(key(r)));

console.log(`domain escalation: is N=${PHASE6_DOMAIN_SPOT_CHECK.fineN} adequate, judged against N=${FINE_N}?`);
console.log(`criterion (registered): identical class AND attached within ${(PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance * 100).toFixed(1)}%`);
for (const r of todo) {
  console.log(`  queued ${key(r)}  T=${r.tempC} f=${r.fraction} ${r.paramSet}  coarse(N=${r.fine.dimsN}) ${r.fine.attached} cells`);
}

function runOne(r) {
  return new Promise((resolve) => {
    const started = Date.now();
    execFile(
      process.execPath,
      [
        "runner/src/main.ts", "grow-lk",
        "--temp-c", String(r.tempC),
        "--sigma-inf", Number(r.sigmaInf).toFixed(6),
        "--dims", `${FINE_N},${FINE_N},${FINE_N}`,
        "--dx-um", "0.35",
        "--cfl", "0.1",
        "--target-extent", String(REGISTERED_EXTENT),
        "--surface-policy", "aggregate-hv-g1h1-v6",
        "--far-field", "monopole-matched",
        "--param-set", r.paramSet,
        "--metrics-every", "100000",
      ],
      { cwd: REPO, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
      (error, stdout) => {
        const text = String(stdout ?? "");
        const at = text.lastIndexOf("stop reason=");
        const line = at < 0 ? "" : text.slice(at).split("\n")[0];
        const g = (re) => re.exec(line)?.[1];
        const fine = at < 0 ? { aspectRatio: Number.NaN } : {
          dimsN: FINE_N,
          stopReason: g(/stop reason=(\S+)/) ?? null,
          steps: Number(g(/ step=(\d+)/)),
          attached: Number(g(/ attached=(\d+)/)),
          extent: Number(g(/ extent=(\d+)/)),
          aspectRatio: Number(g(/ AR=([\d.eE+-]+)/)),
        };
        if (Number.isFinite(fine.aspectRatio)) fine.modelClass = classify(fine.aspectRatio);
        resolve({
          arm: r.arm, reading: r.reading, paramSet: r.paramSet, tempC: r.tempC, fraction: r.fraction,
          sigmaInf: r.sigmaInf,
          coarse: { ...r.fine, source: "out/phase6-domain-spot-check/spot-check.json (the N=64 run already measured)" },
          fine,
          seconds: (Date.now() - started) / 1000,
          error: error === null ? null : String(error.message).slice(0, 300),
        });
      },
    );
  });
}

let next = 0;
async function worker() {
  while (next < todo.length) {
    const row = await runOne(todo[next++]);
    done.push(row);
    writeFileSync(OUT_FILE, JSON.stringify(done, null, 1));
    console.log(`  ${key(row)} done in ${(row.seconds / 60).toFixed(1)} min: N=${FINE_N} attached=${row.fine.attached}`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

console.log("\n" + "=".repeat(92));
let fails = 0;
for (const r of done) {
  if (!Number.isFinite(r.fine.aspectRatio)) { console.log(`${key(r)}: NO MEASUREMENT`); fails += 1; continue; }
  const verdict = phase6DomainSpotCheckPasses(
    { attached: r.coarse.attached, modelClass: r.coarse.modelClass },
    { attached: r.fine.attached, modelClass: r.fine.modelClass },
  );
  const rel = Math.abs(r.fine.attached - r.coarse.attached) / r.coarse.attached;
  console.log(
    `${r.arm} ${r.paramSet} ${r.reading}  T=${r.tempC} f=${r.fraction}\n` +
      `   N=${r.coarse.dimsN} : ${String(r.coarse.attached).padStart(5)} cells  ${r.coarse.modelClass}\n` +
      `   N=${FINE_N} : ${String(r.fine.attached).padStart(5)} cells  ${r.fine.modelClass}\n` +
      `   differ by ${(rel * 100).toFixed(3)}%  =>  ${verdict.passed ? "PASS" : "**FAIL**"} — ${verdict.reason}`,
  );
  if (!verdict.passed) fails += 1;
}
console.log("");
if (fails > 0) {
  console.log(`N=${PHASE6_DOMAIN_SPOT_CHECK.fineN} IS NOT ADEQUATE at ${fails} of ${done.length} readings.`);
  console.log("Re-sweeping the whole grid at N=64 would produce evidence that fails the same check.");
  console.log("The mandated target is wrong and the domain must escalate further before any re-sweep.");
  console.log("PHASE6 DOMAIN ESCALATION: N=64 INADEQUATE");
  process.exit(1);
}
console.log(`N=${PHASE6_DOMAIN_SPOT_CHECK.fineN} is adequate against N=${FINE_N} at every reading checked.`);
console.log("The mandated re-sweep target stands.");
console.log("PHASE6 DOMAIN ESCALATION: N=64 ADEQUATE");
