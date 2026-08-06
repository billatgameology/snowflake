// Phase 6 WP2 reconnaissance — Stage A cost probe. NON-TRANSFERABLE (Rule 11).
//
// Pre-registration: docs/plans/phase-6-wp2-reconnaissance.md (committed d8c34c5). M1 only,
// two registered points, the plan's five configurations per point, run SEQUENTIALLY in one
// process so each row is an interference-free serial cost measurement (the historical
// throughput probe covers concurrency scaling separately). Results append one JSON line per
// completed row (lesson A3: never overwrite from memory); a killed run resumes by re-running
// only rows absent from the output file.
//
// Nothing here is gate evidence, numerical adequacy, or a production geometry choice.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LKSolver } from "@vcc/solver-cpu";
import { aspectRatio } from "@vcc/core";
import { phase6SigmaInf } from "../../runner/src/phase6-protocol.ts";

const OUT_DIR = "out/phase6-wp2-recon/stage-a";
const ROWS_PATH = join(OUT_DIR, "rows.jsonl");
const LOG_PATH = join(OUT_DIR, "live.log");

// Stage A driver constants (recorded, not tunable per run).
const FRACTION = 0.25; // the third of the six registered fractions — the plan's "middle"
const TEMPS_C = [-15, -5];
const WALL_CAP_SECONDS = 12 * 3600; // Stage A's own cap; Stage B's derives from measurements
const STEP_CAP = 200_000;
const RELAX_MAX_SWEEPS = 200_000;

// The plan's Stage A configurations, in SPAN semantics (corrected 2026-08-06, see the plan's
// Tried and rejected): solver.largestExtent() is the max per-axis index span, so a physical
// radius r maps to extent ~ round(2*r/dxUm). Isometric seed: thickness = 2*radius + 1 layers,
// because the AR convention (core/src/metrics.ts) counts layer height and across-flats width
// as the same cell unit, so an isometric particle spans equal cells on both axes.
const CONFIGS = [
  { id: "A5-coarse", dxUm: 0.7, seedRadius: 8, targetExtent: 27, domainN: 48 },
  { id: "A1-floor-n96", dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainN: 96 },
  { id: "A2-floor-n128", dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainN: 128 },
  { id: "A4-ceiling-n192", dxUm: 0.35, seedRadius: 35, targetExtent: 117, domainN: 192 },
  { id: "A3-ceiling-n256", dxUm: 0.35, seedRadius: 35, targetExtent: 117, domainN: 256 },
];

function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`;
  console.log(stamped);
  appendFileSync(LOG_PATH, `${stamped}\n`);
}

function completedRowIds() {
  if (!existsSync(ROWS_PATH)) return new Set();
  return new Set(
    readFileSync(ROWS_PATH, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line).rowId),
  );
}

function runRow(tempC, config) {
  const sigmaInfinity = phase6SigmaInf(tempC, FRACTION);
  const dims = { nx: config.domainN, ny: config.domainN, nz: config.domainN };
  const seedThickness = 2 * config.seedRadius + 1;
  const started = process.hrtime.bigint();
  const startedIso = new Date().toISOString();
  const solver = new LKSolver({
    surfacePolicy: "aggregate-hv-g1h1-v6",
    dims,
    tempC,
    sigmaInfinity,
    dxUm: config.dxUm,
    pressurePa: 101_325,
    paramSet: "M1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: RELAX_MAX_SWEEPS,
    rngSeed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "dirichlet",
    seedRadius: config.seedRadius,
    seedThickness,
  });
  let stopReason = "step-cap";
  let cycles = 0;
  let totalSweeps = 0;
  let unconvergedCycles = 0;
  let peakRssBytes = 0;
  const elapsedS = () => Number(process.hrtime.bigint() - started) / 1e9;
  for (let cycle = 0; cycle < STEP_CAP; cycle++) {
    const relaxation = solver.relaxField();
    totalSweeps += relaxation.sweeps;
    if (relaxation.sweeps >= RELAX_MAX_SWEEPS) {
      unconvergedCycles += 1;
      stopReason = "unconverged";
      break;
    }
    solver.advanceSurface();
    cycles += 1;
    const rss = process.memoryUsage().rss;
    if (rss > peakRssBytes) peakRssBytes = rss;
    const extent = solver.largestExtent();
    // largestExtent() is already a span; the 65% guard compares it to the domain edge directly.
    if (extent > 0.65 * config.domainN) {
      stopReason = "domain-contact";
      break;
    }
    if (extent >= config.targetExtent) {
      stopReason = "size-target";
      break;
    }
    if (elapsedS() > WALL_CAP_SECONDS) {
      stopReason = "wall-cap-infrastructure";
      break;
    }
    if (cycle % 200 === 0) {
      log(
        `  ${config.id} T=${tempC} cycle=${cycle} extent=${extent} ` +
          `attached=${solver.attachedCount} sweeps=${totalSweeps} t=${elapsedS().toFixed(0)}s`,
      );
    }
  }
  return {
    rowId: `${config.id}@${tempC}C`,
    nonTransferable: true,
    startedIso,
    config: { ...config, seedThickness, fraction: FRACTION, tempC, sigmaInfinity },
    fixed: {
      paramSet: "M1",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      farField: "dirichlet",
      domain: "hexPrism",
      pressurePa: 101_325,
      cflFill: 0.1,
      relaxTol: 1e-9,
      divTol: 1e-7,
      relaxMaxSweeps: RELAX_MAX_SWEEPS,
      rngSeed: 1,
      noiseEpsilon: 0,
    },
    stopReason,
    wallSeconds: elapsedS(),
    cycles,
    totalSweeps,
    unconvergedCycles,
    attachedCount: solver.attachedCount,
    finalExtent: solver.largestExtent(),
    aspectRatio: aspectRatio(solver.a, dims),
    peakRssBytes,
    engine: process.version,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
log(`Stage A cost probe starting — node ${process.version}, pid ${process.pid}, serial rows`);
const done = completedRowIds();
for (const tempC of TEMPS_C) {
  for (const config of CONFIGS) {
    const rowId = `${config.id}@${tempC}C`;
    if (done.has(rowId)) {
      log(`skip ${rowId} (already recorded)`);
      continue;
    }
    log(`start ${rowId}`);
    const row = runRow(tempC, config);
    appendFileSync(ROWS_PATH, `${JSON.stringify(row)}\n`);
    log(
      `done ${rowId}: ${row.stopReason} in ${row.wallSeconds.toFixed(1)}s, ` +
        `cycles=${row.cycles} sweeps=${row.totalSweeps} attached=${row.attachedCount} ` +
        `extent=${row.finalExtent} AR=${row.aspectRatio.toFixed(4)} ` +
        `rss=${(row.peakRssBytes / 1e9).toFixed(2)}GB`,
    );
  }
}
log("Stage A cost probe complete");
writeFileSync(join(OUT_DIR, "COMPLETE"), `${new Date().toISOString()}\n`);
