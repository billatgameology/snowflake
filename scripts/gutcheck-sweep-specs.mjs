// Generate the G-G parameter sweep: the spec files that gutcheck-grow-batch.mjs grows.
//
//   node scripts/gutcheck-sweep-specs.mjs [--out-dir evidence/gutcheck-gg-realism/specs] [--list]
//
// The point of the sweep is range, not fit — "hundreds of these generated snowflakes to show
// the vast possibilities by just a few parameters" (maker, 2026-08-07). Photo matches are a
// welcome accident, so every combination is kept and named for what it is.
//
// Axes, and what each does to the crystal (learned from the Fig. catalogue and the Bentley
// staged runs, see the plan's staged-growth section):
//   thresh  prism-slot attachment threshold — THE morphology dial. Low (~1.0) attaches
//           easily and branches into dendrites; high (~3.0) attaches only on completed
//           facets and grows flat plates. Everything else modulates this.
//   rho     background vapour density — how much material is available; raises branch
//           density and growth rate.
//   kappa   freezing coefficient on the boundary layer — higher thickens/roughens.
//   mu      boundary melting; the 10/20 overrides sharpen arm tips (Fig. 32 stage 2).
//   phi     the paper's vapour-diffusion term.
// Staged pairs schedule two of those in sequence, which is the only way to reach the
// conditions-history morphologies (plate core then branches, branches then end plates).

import { mkdirSync, renameSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { updateGutcheckEvidenceManifest } from "./gutcheck-evidence-lib.ts";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d;
};
// Specs are tracked provenance (evidence tree since 2026-08-12); writing one obliges a
// MANIFEST.json re-pin, done below after the writes.
const outDir = resolve(arg("out-dir", "evidence/gutcheck-gg-realism/specs"));
const listOnly = process.argv.includes("--list");
mkdirSync(outDir, { recursive: true });

/** One parameter vector -> the stage object grow-params expects. */
const stage = ({ untilTick = null, thresh, rho = 0.12, phi = 0.01, kappa = 0.005, mu = 0.001, sharpTips = false }) => ({
  untilTick,
  rho,
  phi,
  ggThreshTable: { "10": thresh, "11": thresh, "20": thresh, "21": 1, "30": 1, "31": 1, "01": 3.5 },
  kappa: { default: kappa, overrides: {} },
  mu: { default: mu, overrides: sharpTips ? { "10": 0.006, "20": 0.006 } : {} },
});

const specs = new Map();
const add = (id, label, stages) => specs.set(id, { label, stages });
// Two decimals, "." -> "p", so ids stay filesystem- and URL-safe and sort sensibly.
const tag = (n) => String(n).replace(".", "p");

// ── 1. The morphology spine: threshold against vapour density, single stage. ───────────
// This is the grid that shows "a few parameters, vast possibilities" most directly.
const THRESH = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0, 2.5, 3.0];
const RHO = [0.08, 0.1, 0.12, 0.16];
for (const t of THRESH) {
  for (const r of RHO) {
    add(
      `sweep-t${tag(t)}-r${tag(r)}`,
      `single stage: thresh ${t}, rho ${r}`,
      [stage({ thresh: t, rho: r })],
    );
  }
}

// ── 2. Boundary-layer character at three representative thresholds. ────────────────────
const KAPPA = [0.001, 0.02, 0.1];
const MU = [0.001, 0.006];
for (const t of [1.15, 1.75, 2.5]) {
  for (const k of KAPPA) {
    for (const m of MU) {
      add(
        `sweep-t${tag(t)}-k${tag(k)}-m${tag(m)}`,
        `single stage: thresh ${t}, kappa ${k}, mu ${m}`,
        [stage({ thresh: t, kappa: k, mu: m })],
      );
    }
  }
}

// ── 3. Tip sharpening on/off across the dendritic half. ────────────────────────────────
for (const t of [1.0, 1.15, 1.3, 1.5]) {
  add(
    `sweep-t${tag(t)}-sharp`,
    `single stage: thresh ${t}, sharpened tips`,
    [stage({ thresh: t, sharpTips: true })],
  );
}

// ── 4. Staged pairs: the conditions-history morphologies. ──────────────────────────────
// plate->branch is the Fig. 32 family (plate core, dendritic extensions);
// branch->plate is the Bentley 872 family (arms that end in plates).
const SWITCH = [4000, 8000, 12000];
for (const sw of SWITCH) {
  for (const [a, b] of [[2.25, 1.15], [2.6, 1.3], [3.0, 1.0]]) {
    add(
      `staged-plate${tag(a)}-to-branch${tag(b)}-at${sw}`,
      `staged: plate ${a} until ${sw}, then branch ${b}`,
      [stage({ untilTick: sw, thresh: a }), stage({ thresh: b, sharpTips: true })],
    );
  }
  for (const [a, b] of [[1.15, 2.25], [1.3, 2.6], [1.0, 3.0]]) {
    add(
      `staged-branch${tag(a)}-to-plate${tag(b)}-at${sw}`,
      `staged: branch ${a} until ${sw}, then plate ${b}`,
      [stage({ untilTick: sw, thresh: a, sharpTips: true }), stage({ thresh: b })],
    );
  }
}

// ── 5. Three-stage schedules: plate, branch, plate again. ──────────────────────────────
for (const [s1, s2] of [[5000, 11000], [7000, 15000]]) {
  add(
    `staged3-plate-branch-plate-${s1}-${s2}`,
    `staged x3: plate 2.5 -> branch 1.15 -> plate 2.5 (switch ${s1}, ${s2})`,
    [
      stage({ untilTick: s1, thresh: 2.5 }),
      stage({ untilTick: s2, thresh: 1.15, sharpTips: true }),
      stage({ thresh: 2.5 }),
    ],
  );
}

if (listOnly) {
  for (const [id, s] of specs) console.log(id.padEnd(42), s.label);
  console.log(`\n${specs.size} specs`);
  process.exit(0);
}

const existing = new Set(readdirSync(outDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
let written = 0;
for (const [id, spec] of specs) {
  // Never clobber a hand-written or already-grown spec: the record next to it may already
  // describe a crystal grown from the old contents.
  if (existing.has(id)) continue;
  // Temp + rename so a killed run never leaves a truncated spec for the batch to grow.
  const tmp = join(outDir, `.${id}.json.tmp`);
  writeFileSync(tmp, JSON.stringify(spec, null, 1));
  renameSync(tmp, join(outDir, `${id}.json`));
  written++;
}
// Unconditionally, not only when written > 0: a previous run that wrote specs and died
// before pinning leaves the manifest stale, and the rerun writes nothing (review 2026-08-12).
updateGutcheckEvidenceManifest();
console.log(`${specs.size} specs in sweep, ${written} newly written to ${outDir}`);
