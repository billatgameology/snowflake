// Phase 6 WP2 numerical-control ladder — the dispatcher.
//
// Pre-registration: docs/plans/phase-6-wp2-ladder.md (FROZEN 2026-08-08). Enumerates the frozen
// 80 rows, spawns one child node process per row (phase6-wp2-ladder-row.mjs), and is the SINGLE
// WRITER of out/phase6-wp2-ladder/rows.jsonl: children print their one JSON line to stdout and
// only this process appends completed rows as they finish. Resume = skip rowIds already present
// in rows.jsonl (a capped or errored row is a recorded outcome, never silently retried).
//
// Usage:
//   node app/scripts/phase6-wp2-ladder-run.mjs [--concurrency N] [--enumerate]
//
// --enumerate prints the 80 frozen rowIds in execution order and runs nothing.
// Exit codes: 0 = dispatcher completed (row outcomes, including failures, are data in
// rows.jsonl); 1 = usage error; 2 = dirty-tree refusal.

import { execFileSync, spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OUT_DIR = join(REPO_ROOT, "out", "phase6-wp2-ladder");
const ROWS_PATH = join(OUT_DIR, "rows.jsonl");
const LOG_PATH = join(OUT_DIR, "live.log");
const ROW_SCRIPT = join(REPO_ROOT, "app", "scripts", "phase6-wp2-ladder-row.mjs");

// ── The frozen enumeration (plan: "Budget and rungs", frozen 2026-08-08) ────────────────────
// The four registered check points — the `domain-budgets` spot-check points, unchanged, in the
// plan's stated order — each crossed with both arms at every rung.
const CHECK_POINTS = [
  { tempC: -31, fraction: 0.6 },
  { tempC: -13, fraction: 0.15 },
  { tempC: -6, fraction: 0.15 },
  { tempC: -27, fraction: 0.15 },
];
const ARMS = ["M1", "CAK"];
// Coarse spacing fully first (cheapest, catches driver defects), then 0.35 um rungs ascending.
const SPACINGS = [
  { dxUm: 0.7, seedRadius: 8, targetExtent: 27, domainNs: [48, 64, 80] },
  { dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainNs: [96, 112, 128] },
];
// Base-rung values every domain row uses; auxiliary controls vary exactly one of them by name.
const BASE_CFL = 0.1;
const BASE_RELAX_TOL = 1e-9;
// Auxiliary controls at the 0.35 um base rung (N = 96), in the plan's order: cflFill halved,
// relaxTol tightened one decade, seed radius ±1 cell.
const AUX_BASE = { dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainN: 96 };
const AUX_CONTROLS = [
  { name: "cfl0.05", cflFill: 0.05 },
  { name: "relaxTol1e-10", relaxTol: 1e-10 },
  { name: "seed16", seedRadius: 16 },
  { name: "seed18", seedRadius: 18 },
];
// Per-row wall cap: 10 h (one host up-window). Enforced HERE by killing the child; the recorded
// stopReason is wall-cap-infrastructure and the row is not-comparable (no-pass, never a drop).
const WALL_CAP_SECONDS = 10 * 3600;
const DEFAULT_CONCURRENCY = 12;
const STDERR_TAIL_CHARS = 2000;

/** The frozen 80 rows, in execution order. The evaluator transcribes this enumeration
 *  independently (Rule 9); runner/test/phase6-wp2-ladder-eval.test.ts cross-checks the two. */
function enumerateRows() {
  const rows = [];
  for (const spacing of SPACINGS) {
    for (const domainN of spacing.domainNs) {
      for (const point of CHECK_POINTS) {
        for (const arm of ARMS) {
          rows.push({
            rowId:
              `dom-${spacing.dxUm}-n${domainN}@${point.tempC}C-f${point.fraction}-${arm}`,
            tempC: point.tempC,
            fraction: point.fraction,
            paramSet: arm,
            dxUm: spacing.dxUm,
            seedRadius: spacing.seedRadius,
            targetExtent: spacing.targetExtent,
            domainN,
            cflFill: BASE_CFL,
            relaxTol: BASE_RELAX_TOL,
          });
        }
      }
    }
  }
  for (const control of AUX_CONTROLS) {
    for (const point of CHECK_POINTS) {
      for (const arm of ARMS) {
        rows.push({
          rowId: `aux-${control.name}@${point.tempC}C-f${point.fraction}-${arm}`,
          tempC: point.tempC,
          fraction: point.fraction,
          paramSet: arm,
          dxUm: AUX_BASE.dxUm,
          seedRadius: control.seedRadius ?? AUX_BASE.seedRadius,
          targetExtent: AUX_BASE.targetExtent,
          domainN: AUX_BASE.domainN,
          cflFill: control.cflFill ?? BASE_CFL,
          relaxTol: control.relaxTol ?? BASE_RELAX_TOL,
        });
      }
    }
  }
  return rows;
}

// ── Argv ────────────────────────────────────────────────────────────────────────────────────
function usageFail(message) {
  console.error(`phase6-wp2-ladder-run: ${message}`);
  process.exit(1);
}

let concurrency = DEFAULT_CONCURRENCY;
let enumerateOnly = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const flag = argv[i];
  if (flag === "--enumerate") {
    enumerateOnly = true;
  } else if (flag === "--concurrency") {
    const raw = argv[++i];
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > 16) {
      usageFail(`--concurrency wants an integer in 1..16, got "${raw}"`);
    }
    concurrency = value;
  } else {
    usageFail(`unknown flag: ${flag}`);
  }
}

const allRows = enumerateRows();
if (allRows.length !== 80) {
  // Frozen row count; a drift here is a driver defect, not a tunable.
  usageFail(`enumeration produced ${allRows.length} rows; the frozen plan says 80`);
}

if (enumerateOnly) {
  for (const row of allRows) process.stdout.write(`${row.rowId}\n`);
  process.exit(0);
}

// ── Startup provenance: recorded, and dirty trees refused by name ───────────────────────────
const gitOut = (args) =>
  execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
const porcelain = gitOut(["status", "--porcelain"]);
if (porcelain !== "") {
  console.error(
    "phase6-wp2-ladder-run: REFUSING to launch ladder rows — `git status --porcelain` is " +
      "non-empty, so the evidence could not be reproduced from HEAD. Commit or stash first.\n" +
      porcelain,
  );
  process.exit(2);
}
const head = gitOut(["rev-parse", "HEAD"]);

mkdirSync(OUT_DIR, { recursive: true });
function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`;
  console.log(stamped);
  appendFileSync(LOG_PATH, `${stamped}\n`);
}

log(
  `ladder dispatcher starting head=${head} node=${process.version} pid=${process.pid} ` +
    `concurrency=${concurrency} wallCapSeconds=${WALL_CAP_SECONDS} ` +
    `command=${JSON.stringify(process.argv.join(" "))}`,
);

// Resume: rowIds already recorded are skipped. Only THIS process ever appends to rows.jsonl.
function completedRowIds() {
  if (!existsSync(ROWS_PATH)) return new Set();
  const ids = new Set();
  for (const line of readFileSync(ROWS_PATH, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed.rowId === "string") ids.add(parsed.rowId);
    } catch {
      log(`WARNING rows.jsonl holds an unparseable line (left in place): ${line.slice(0, 120)}`);
    }
  }
  return ids;
}

const done = completedRowIds();
const pending = allRows.filter((row) => !done.has(row.rowId));
for (const row of allRows) {
  if (done.has(row.rowId)) log(`skip ${row.rowId} (already recorded)`);
}
log(`rows: ${allRows.length} enumerated, ${done.size} already recorded, ${pending.length} to run`);

function recordRow(record) {
  appendFileSync(ROWS_PATH, `${JSON.stringify(record)}\n`);
}

function rowArgs(row) {
  return [
    ROW_SCRIPT,
    "--temp-c", String(row.tempC),
    "--fraction", String(row.fraction),
    "--param-set", row.paramSet,
    "--dx-um", String(row.dxUm),
    "--seed-radius", String(row.seedRadius),
    "--target-extent", String(row.targetExtent),
    "--domain-n", String(row.domainN),
    "--cfl", String(row.cflFill),
    "--relax-tol", String(row.relaxTol),
    "--row-id", row.rowId,
  ];
}

let nextIndex = 0;
let inFlight = 0;
let completed = 0;

function launchNext() {
  while (inFlight < concurrency && nextIndex < pending.length) {
    launchRow(pending[nextIndex++]);
  }
  if (inFlight === 0 && nextIndex >= pending.length) {
    log(`ladder dispatcher done: ${completed} rows recorded this session`);
    process.exit(0);
  }
}

function launchRow(row) {
  inFlight += 1;
  const startedAt = process.hrtime.bigint();
  const wallSecondsNow = () => Number(process.hrtime.bigint() - startedAt) / 1e9;
  log(`start ${row.rowId} (concurrency ${inFlight}/${concurrency})`);

  const child = spawn(process.execPath, rowArgs(row), {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderrTail = "";
  let capped = false;
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderrTail = (stderrTail + chunk).slice(-STDERR_TAIL_CHARS);
  });
  const capTimer = setTimeout(() => {
    capped = true;
    log(`wall-cap ${row.rowId}: killing child at the 10 h per-row cap`);
    child.kill();
  }, WALL_CAP_SECONDS * 1000);
  capTimer.unref();

  child.on("error", (error) => {
    clearTimeout(capTimer);
    recordRow({
      ...row,
      stopReason: "child-error",
      dispatcherNote: `spawn failed: ${error.message}`,
      wallSeconds: wallSecondsNow(),
      engine: process.version,
    });
    log(`done ${row.rowId} stop=child-error (spawn failed) wall=${wallSecondsNow().toFixed(1)}s`);
    inFlight -= 1;
    completed += 1;
    launchNext();
  });

  child.on("close", (code, signal) => {
    clearTimeout(capTimer);
    const wallSeconds = wallSecondsNow();
    if (capped) {
      // Plan: a wall-capped row is recorded wall-cap-infrastructure and treated as
      // not-comparable — it can only produce no-pass, never a silent exclusion.
      recordRow({
        ...row,
        stopReason: "wall-cap-infrastructure",
        dispatcherNote: `child killed at the ${WALL_CAP_SECONDS} s per-row wall cap`,
        wallSeconds,
        engine: process.version,
      });
      log(`done ${row.rowId} stop=wall-cap-infrastructure wall=${wallSeconds.toFixed(1)}s`);
    } else if (code !== 0) {
      // Never retried silently: the failure is the recorded outcome.
      recordRow({
        ...row,
        stopReason: "child-error",
        exitCode: code,
        signal: signal ?? null,
        stderrTail,
        wallSeconds,
        engine: process.version,
      });
      log(`done ${row.rowId} stop=child-error exit=${code} wall=${wallSeconds.toFixed(1)}s`);
    } else {
      const lines = stdout.split("\n").filter((line) => line.trim() !== "");
      let record = null;
      if (lines.length === 1) {
        try {
          const parsed = JSON.parse(lines[0]);
          if (parsed !== null && parsed.rowId === row.rowId) record = parsed;
        } catch {
          record = null;
        }
      }
      if (record === null) {
        recordRow({
          ...row,
          stopReason: "child-error",
          dispatcherNote:
            `child exited 0 but its stdout was not exactly one JSON line for ${row.rowId} ` +
            `(${lines.length} line(s))`,
          stderrTail,
          wallSeconds,
          engine: process.version,
        });
        log(`done ${row.rowId} stop=child-error (bad stdout) wall=${wallSeconds.toFixed(1)}s`);
      } else {
        recordRow(record);
        log(
          `done ${row.rowId} stop=${record.stopReason} wall=${wallSeconds.toFixed(1)}s ` +
            `cycles=${record.cycles} attached=${record.attachedCount} ` +
            `extent=${record.finalExtent} AR=${Number(record.aspectRatio).toFixed(4)}`,
        );
      }
    }
    inFlight -= 1;
    completed += 1;
    launchNext();
  });
}

launchNext();
