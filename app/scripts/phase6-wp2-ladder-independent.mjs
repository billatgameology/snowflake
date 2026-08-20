// Independent re-derivation of the Phase 6 WP2 ladder verdict (Rule 9 sibling verifier).
//
// NON-AUTHOR review artifact, 2026-08-20: this script was written by an independent reviewer
// context from the frozen plan and the published rows bytes alone, firewalled from the author
// evaluator (app/scripts/phase6-wp2-ladder-{eval,run,row}.mjs, its tests, and report.json —
// never opened). Its verdict was cross-compared against the published report afterward:
// complete agreement (overall no-pass, both spacings, the identical 28 failing comparisons to
// three decimals, pass counts 11/16, 10/16, 15/32). Six named mutation controls (count flips
// at the 0.5% boundary, deleted row, unsanctioned head, step-cap stop, habit-class flip) were
// each caught. The reviewed original ran at out/wp2-review/rederive.mjs; this committed copy
// differs ONLY in resolving the rows path portably from the repository root and accepting an
// explicit rows-path argument so the suite can rerun the mutation controls.
//
// Sources of truth used:
//   - docs/plans/phase-6-wp2-ladder.md (frozen plan, read in full)
//   - evidence/phase6-wp2-ladder/rows.jsonl (artifact bytes)
//   - runner/src/phase6-sweep.ts phase6DomainSpotCheckPasses + phase6ClassifyHabit
//     (the pre-existing registered operator the plan inherits by name; NOT ladder author code)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ROWS_PATH = process.argv[2] ?? resolve(REPOSITORY_ROOT, "evidence", "phase6-wp2-ladder", "rows.jsonl");

// ── Registered operator semantics, restated from runner/src/phase6-sweep.ts ──
// phase6DomainSpotCheckPasses(coarse, fine):
//   fail if classes differ; else relative = |fine.attached - coarse.attached| / coarse.attached,
//   fail if relative > 0.005 (attachedCountTolerance). DENOMINATOR = the COARSE (base) run.
const TOL = 0.005;
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;
function classifyHabit(ar) {
  if (!Number.isFinite(ar) || ar <= 0) return "invalid";
  if (ar <= PLATE_CEILING) return "plate";
  if (ar >= COLUMN_FLOOR) return "column";
  return "neutral";
}

// ── Frozen enumeration from the plan ──
const POINTS = [
  { tempC: -31, fraction: 0.6 },
  { tempC: -13, fraction: 0.15 },
  { tempC: -6, fraction: 0.15 },
  { tempC: -27, fraction: 0.15 },
];
const ARMS = ["M1", "CAK"];
const SPACINGS = [
  { dxUm: 0.7, rungs: [48, 64, 80], seedRadius: 8, targetExtent: 27 },
  { dxUm: 0.35, rungs: [96, 112, 128], seedRadius: 17, targetExtent: 54 },
];
const AUX = [
  { label: "cfl0.05", key: (p, a) => `aux-cfl0.05@${pt(p)}-${a}` },
  { label: "relaxTol1e-10", key: (p, a) => `aux-relaxTol1e-10@${pt(p)}-${a}` },
  { label: "seed16", key: (p, a) => `aux-seed16@${pt(p)}-${a}` },
  { label: "seed18", key: (p, a) => `aux-seed18@${pt(p)}-${a}` },
];
function pt(p) {
  // fraction 0.6 renders "f0.6", 0.15 renders "f0.15" per observed artifact ids;
  // the id is only a lookup key — the expected enumeration is constructed independently.
  return `${p.tempC}C-f${p.fraction}`;
}
function domId(dx, n, p, a) {
  return `dom-${dx}-n${n}@${pt(p)}-${a}`;
}

// Expected 80 row ids
const expected = new Set();
for (const s of SPACINGS)
  for (const n of s.rungs) for (const p of POINTS) for (const a of ARMS) expected.add(domId(s.dxUm, n, p, a));
for (const aux of AUX) for (const p of POINTS) for (const a of ARMS) expected.add(aux.key(p, a));
if (expected.size !== 80) throw new Error(`expected enumeration has ${expected.size} ids, not 80`);

// ── Load artifact ──
const lines = readFileSync(ROWS_PATH, "utf8").trim().split(/\r?\n/);
const byId = new Map();
const duplicates = [];
for (const line of lines) {
  const r = JSON.parse(line);
  if (byId.has(r.rowId)) duplicates.push(r.rowId);
  byId.set(r.rowId, r);
}
const missing = [...expected].filter((id) => !byId.has(id)).sort();
const extraneous = [...byId.keys()].filter((id) => !expected.has(id)).sort();

// Sanctioned head shape (plan, execution scheduling record 2026-08-09/-11):
// heads = {freeze f59d187, aa81295, 3827b77}; every N=112/128 row must carry an amendment head.
const FREEZE_HEAD = "f59d18702301155c0c2e7eaecc3442e6cf117123";
const SANCTIONED = new Set([
  FREEZE_HEAD,
  "aa812952efbf5c4ef7152cc7595342092a51b000",
  "3827b7763e870da6a81f8dc3430cfc4be5ab3ec6",
]);
const headDefects = [];
for (const r of byId.values()) {
  if (!SANCTIONED.has(r.gitHead)) headDefects.push(`${r.rowId}: unsanctioned head ${r.gitHead}`);
  if (/^dom-0\.35-n1(12|28)@/.test(r.rowId) && r.gitHead === FREEZE_HEAD)
    headDefects.push(`${r.rowId}: heavy row at freeze head`);
}

// Row usability: a row enters a comparison only if it converged to its size target and is valid.
function rowProblem(r) {
  if (r === undefined) return "missing";
  if (r.stopReason !== "size-target") return `stopReason=${r.stopReason}`;
  if (classifyHabit(r.aspectRatio) === "invalid") return `invalid aspectRatio=${r.aspectRatio}`;
  if (!Number.isFinite(r.attachedCount) || r.attachedCount <= 0) return `bad attachedCount=${r.attachedCount}`;
  return null;
}

function compare(label, p, a, base, next) {
  const where = `${label} @ ${p.tempC}C f${p.fraction} ${a}`;
  const pb = rowProblem(base);
  const pn = rowProblem(next);
  if (pb !== null || pn !== null)
    return { pass: false, detail: `${where}: not-comparable (${pb ?? "ok"} / ${pn ?? "ok"})` };
  const cb = classifyHabit(base.aspectRatio);
  const cn = classifyHabit(next.aspectRatio);
  const rel = Math.abs(next.attachedCount - base.attachedCount) / base.attachedCount;
  const pctStr = (rel * 100).toFixed(3);
  if (cb !== cn)
    return {
      pass: false,
      detail: `${where}: class ${cb} vs ${cn}; counts ${pctStr}% (${base.attachedCount} vs ${next.attachedCount})`,
    };
  if (rel > TOL)
    return { pass: false, detail: `${where}: ${pctStr}% (${base.attachedCount} vs ${next.attachedCount})` };
  return { pass: true, detail: null };
}

// ── Auxiliary comparisons at the 0.35 µm base rung: 4 controls x 4 points x 2 arms = 32 ──
const perSpacing = [];
const auxFailures = [];
let auxPass = 0;
const auxTotal = AUX.length * POINTS.length * ARMS.length; // 32
for (const aux of AUX)
  for (const p of POINTS)
    for (const a of ARMS) {
      const base = byId.get(domId(0.35, 96, p, a));
      const row = byId.get(aux.key(p, a));
      const c = compare(aux.label, p, a, base, row);
      if (c.pass) auxPass += 1;
      else auxFailures.push(c.detail);
    }

// ── Domain comparisons per spacing: 2 increments x 4 points x 2 arms = 16 ──
for (const s of SPACINGS) {
  let domainPass = 0;
  const failures = [];
  for (let i = 0; i + 1 < s.rungs.length; i += 1)
    for (const p of POINTS)
      for (const a of ARMS) {
        const c = compare(
          `${s.rungs[i]}→${s.rungs[i + 1]}`,
          p,
          a,
          byId.get(domId(s.dxUm, s.rungs[i], p, a)),
          byId.get(domId(s.dxUm, s.rungs[i + 1], p, a)),
        );
        if (c.pass) domainPass += 1;
        else failures.push(c.detail);
      }
  const domainTotal = 16;
  const spacingDomainOk = domainPass === domainTotal;
  const auxOk = auxPass === auxTotal; // the auxiliary conjunct gates BOTH spacings
  const artifactOk = missing.length === 0 && extraneous.length === 0 && duplicates.length === 0 && headDefects.length === 0;
  perSpacing.push({
    spacing: `${s.dxUm} um`,
    verdict: spacingDomainOk && auxOk && artifactOk ? "pass" : "no-pass",
    domainPass,
    domainTotal,
    auxPass,
    auxTotal,
    failedComparisons: [...failures, ...auxFailures].sort(),
  });
}

const overall = perSpacing.some((s) => s.verdict === "pass") ? "pass" : "no-pass";
const out = {
  perSpacing,
  overall,
  artifactChecks: { missing, extraneous, duplicates, headDefects },
  denominatorConvention:
    "relative = |fine - coarse| / coarse.attached (registered phase6DomainSpotCheckPasses); base/unmodified run is the denominator; fail iff relative > 0.005 strictly",
};
console.log(JSON.stringify(out, null, 2));
