// Phase 6 WP2 numerical-control ladder — ONE row, run in-process.
//
// Pre-registration: docs/plans/phase-6-wp2-ladder.md (FROZEN 2026-08-08). This is the PRODUCER
// side of the ladder. Importing the registered sigma mapping from runner/src/phase6-protocol.ts
// is correct here — the row must run the registered configuration — while the Rule 9 evaluator
// (phase6-wp2-ladder-eval.mjs) deliberately imports nothing from runner/src and recomputes the
// verdict from rows.jsonl bytes alone.
//
// Contract: prints EXACTLY ONE JSON line to stdout. The dispatcher
// (phase6-wp2-ladder-run.mjs) is the single writer of rows.jsonl; this process writes no files.
// Progress and errors go to stderr only.

import { LKSolver } from "@vcc/solver-cpu";
import { aspectRatio, domainCenter, symmetryError } from "@vcc/core";
import { phase6SigmaInf } from "../../runner/src/phase6-protocol.ts";

// ── Frozen fixed configuration (plan: "Fixed run configuration, frozen") ────────────────────
// Every row uses these; a rung or auxiliary control varies its own operand by named flag only.
// runner/test/phase6-wp2-ladder-eval.test.ts (review H2) reads this object LITERALLY from the
// source bytes and cross-checks it against the registered constants in
// runner/src/phase6-crossplatform.ts and runner/src/phase6-protocol.ts — keep the
// `const FIXED = { ... };` form (and the `const STEP_CAP = ...;` line below) intact.
const FIXED = {
  surfacePolicy: "aggregate-hv-g1h1-v6",
  farField: "monopole-matched",
  pressurePa: 101_325,
  noiseEpsilon: 0,
  rngSeed: 1,
  domain: "hexPrism",
  divTol: 1e-7,
  relaxMaxSweeps: 200_000,
};
// Frozen cycle cap: a row still growing after this many interface cycles records "step-cap".
const STEP_CAP = 100_000;
// Charter §3.1 contact guard, same comparison as Stage A and grow-lk: largestExtent() is a span,
// compared against the domain edge directly.
const DOMAIN_CONTACT_FRACTION = 0.65;

function fail(message) {
  console.error(`phase6-wp2-ladder-row: ${message}`);
  process.exit(1);
}

// ── Argv: all ten flags required, validated by name ─────────────────────────────────────────
const finiteNumber = (raw, flag) => {
  const value = Number(raw);
  if (!Number.isFinite(value)) fail(`${flag} wants a finite number, got "${raw}"`);
  return value;
};
const positiveNumber = (raw, flag) => {
  const value = finiteNumber(raw, flag);
  if (!(value > 0)) fail(`${flag} wants a number > 0, got "${raw}"`);
  return value;
};
const positiveInteger = (raw, flag) => {
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail(`${flag} wants a positive integer, got "${raw}"`);
  }
  return value;
};

const FLAG_SPEC = [
  { flag: "--temp-c", key: "tempC", parse: finiteNumber },
  { flag: "--fraction", key: "fraction", parse: finiteNumber },
  {
    flag: "--param-set",
    key: "paramSet",
    parse: (raw, flag) => {
      if (raw !== "M1" && raw !== "CAK") fail(`${flag} must be M1 or CAK, got "${raw}"`);
      return raw;
    },
  },
  { flag: "--dx-um", key: "dxUm", parse: positiveNumber },
  { flag: "--seed-radius", key: "seedRadius", parse: positiveInteger },
  { flag: "--target-extent", key: "targetExtent", parse: positiveInteger },
  { flag: "--domain-n", key: "domainN", parse: positiveInteger },
  { flag: "--cfl", key: "cflFill", parse: positiveNumber },
  { flag: "--relax-tol", key: "relaxTol", parse: positiveNumber },
  {
    flag: "--row-id",
    key: "rowId",
    parse: (raw, flag) => {
      if (raw.length === 0) fail(`${flag} wants a non-empty row id`);
      return raw;
    },
  },
];

function parseArgv(argv) {
  const byFlag = new Map(FLAG_SPEC.map((spec) => [spec.flag, spec]));
  const input = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const spec = byFlag.get(flag);
    if (spec === undefined) fail(`unknown flag: ${flag}`);
    const raw = argv[i + 1];
    if (raw === undefined) fail(`${flag} needs a value`);
    if (spec.key in input) fail(`${flag} was passed twice; refusing to pick one silently`);
    input[spec.key] = spec.parse(raw, flag);
  }
  const missing = FLAG_SPEC.filter((spec) => !(spec.key in input)).map((spec) => spec.flag);
  if (missing.length > 0) fail(`missing required flags: ${missing.join(" ")}`);
  return input;
}

const input = parseArgv(process.argv.slice(2));

// The registered sigma mapping: throws on an unregistered fraction or an out-of-domain
// temperature, which is the validation the plan wants for both operands.
let sigmaInfinity;
try {
  sigmaInfinity = phase6SigmaInf(input.tempC, input.fraction);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

// The isometric seed mapping the strata freeze records: thickness = 2*radius + 1 layers.
const seedThickness = 2 * input.seedRadius + 1;
const dims = { nx: input.domainN, ny: input.domainN, nz: input.domainN };
const center = domainCenter(dims);

const started = process.hrtime.bigint();
const elapsedSeconds = () => Number(process.hrtime.bigint() - started) / 1e9;

const solver = new LKSolver({
  surfacePolicy: FIXED.surfacePolicy,
  dims,
  tempC: input.tempC,
  sigmaInfinity,
  dxUm: input.dxUm,
  pressurePa: FIXED.pressurePa,
  paramSet: input.paramSet,
  cflFill: input.cflFill,
  relaxTol: input.relaxTol,
  divTol: FIXED.divTol,
  relaxMaxSweeps: FIXED.relaxMaxSweeps,
  rngSeed: FIXED.rngSeed,
  noiseEpsilon: FIXED.noiseEpsilon,
  domain: FIXED.domain,
  farField: FIXED.farField,
  seedRadius: input.seedRadius,
  seedThickness,
  center, // explicit — no constructor defaults on an evidence path
});

let stopReason = "step-cap";
let cycles = 0;
let totalSweeps = 0;
let peakRssBytes = 0;

for (let cycle = 0; cycle < STEP_CAP; cycle++) {
  const relaxation = solver.relaxField();
  totalSweeps += relaxation.sweeps;
  if (!relaxation.converged) {
    // relaxField exhausts relaxMaxSweeps without meeting both tolerances; growing on an
    // unconverged field is a silent physics error, so the row stops here by name.
    stopReason = "unconverged";
    break;
  }
  solver.advanceSurface();
  cycles += 1;
  const rss = process.memoryUsage().rss;
  if (rss > peakRssBytes) peakRssBytes = rss;
  const extent = solver.largestExtent();
  // Contact wins if one attachment batch crosses both thresholds — otherwise a large jump
  // could be mislabeled size-target and admitted as boundary-confounded evidence.
  if (extent > DOMAIN_CONTACT_FRACTION * input.domainN) {
    stopReason = "domain-contact";
    break;
  }
  if (extent >= input.targetExtent) {
    stopReason = "size-target";
    break;
  }
  if (cycle % 500 === 0) {
    console.error(
      `${input.rowId} cycle=${cycle} extent=${extent} attached=${solver.attachedCount} ` +
        `sweeps=${totalSweeps} t=${elapsedSeconds().toFixed(0)}s`,
    );
  }
}

const row = {
  rowId: input.rowId,
  // Inputs, echoed so the artifact line is self-describing.
  tempC: input.tempC,
  fraction: input.fraction,
  paramSet: input.paramSet,
  dxUm: input.dxUm,
  seedRadius: input.seedRadius,
  targetExtent: input.targetExtent,
  domainN: input.domainN,
  cflFill: input.cflFill,
  relaxTol: input.relaxTol,
  // Frozen fixed values, echoed rather than assumed.
  surfacePolicy: FIXED.surfacePolicy,
  farField: FIXED.farField,
  pressurePa: FIXED.pressurePa,
  noiseEpsilon: FIXED.noiseEpsilon,
  rngSeed: FIXED.rngSeed,
  domain: FIXED.domain,
  divTol: FIXED.divTol,
  relaxMaxSweeps: FIXED.relaxMaxSweeps,
  seedThickness,
  sigmaInfinity,
  // Outcome.
  stopReason,
  cycles,
  totalSweeps,
  wallSeconds: elapsedSeconds(),
  attachedCount: solver.attachedCount,
  finalExtent: solver.largestExtent(),
  aspectRatio: aspectRatio(solver.a, dims),
  // Full |A Δ g(A)|/|A| metric from @vcc/core — the same function grow-lk reports as symErr.
  symmetryError: symmetryError(solver.a, dims, center),
  engine: process.version,
  peakRssBytes,
};

process.stdout.write(`${JSON.stringify(row)}\n`);
