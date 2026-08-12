// Phase 6 WP2 numerical-control ladder — the dispatcher.
//
// Pre-registration: docs/plans/phase-6-wp2-ladder.md (FROZEN 2026-08-08). Enumerates the frozen
// 80 rows, spawns one child node process per row (phase6-wp2-ladder-row.mjs), and is the SINGLE
// WRITER of out/phase6-wp2-ladder/rows.jsonl: children print their one JSON line to stdout and
// only this process appends completed rows as they finish. Resume = skip rowIds already present
// in rows.jsonl (a capped or errored row is a recorded outcome, never silently retried; the
// ONLY sanctioned retry is the named `--retry-row` path below, which retires the old record to
// a `rows-retired-<timestamp>.jsonl` file instead of deleting it).
//
// Per the unit's pre-execution review, every appended record carries execution provenance
// (B2): gitHead, startedIso/finishedIso, concurrency, host, dispatcherCommand, engine — and a
// resume across differing HEADs is refused by name unless `--accept-mixed-heads` is passed, in
// which case every new row records `acceptedMixedHeads: true`. Appends are crash-safe (B3): a
// partial trailing line left by an interrupted append is quarantined by name to
// `rows-truncated-<timestamp>.log` before anything else is written. A PID lock file (review
// H5) refuses two concurrent dispatchers against one rows.jsonl.
//
// Usage:
//   node app/scripts/phase6-wp2-ladder-run.mjs [--concurrency N] [--enumerate]
//       [--accept-mixed-heads] [--retry-row <rowId>]...
//
// --enumerate prints the 80 frozen rowIds in execution order and runs nothing.
// Exit codes: 0 = dispatcher completed (row outcomes, including failures, are data in
// rows.jsonl); 1 = usage error; 2 = refusal by name (dirty tree, unusable HEAD, live
// dispatcher lock, mixed HEADs without --accept-mixed-heads, or a --retry-row refusal).
//
// The helper functions and constants are exported so runner/test/phase6-wp2-ladder-eval.test.ts
// can exercise them (crash-safe append, lock, retry, HEAD continuity, and the H2 constant
// cross-check) without launching rows; the dispatcher body runs only when this file is the
// executed script.

import { execFileSync, spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { phase6SigmaInf } from "../../runner/src/phase6-protocol.ts";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OUT_DIR = join(REPO_ROOT, "out", "phase6-wp2-ladder");
const ROWS_PATH = join(OUT_DIR, "rows.jsonl");
const LOG_PATH = join(OUT_DIR, "live.log");
const LOCK_PATH = join(OUT_DIR, "dispatcher.lock");
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
// Exported for the review-H2 cross-check against the registered fixture
// (PHASE6_CROSSPLATFORM_FIXTURE.cflFill / .relaxTol).
export const BASE_CFL = 0.1;
export const BASE_RELAX_TOL = 1e-9;
// Auxiliary controls at the 0.35 um base rung (N = 96), in the plan's order: cflFill halved,
// relaxTol tightened one decade, seed radius ±1 cell.
const AUX_BASE = { dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainN: 96 };
const AUX_CONTROLS = [
  { name: "cfl0.05", cflFill: 0.05 },
  { name: "relaxTol1e-10", relaxTol: 1e-10 },
  { name: "seed16", seedRadius: 16 },
  { name: "seed18", seedRadius: 18 },
];
// 2026-08-11 second amendment (maker direction 2026-08-09, verbatim: "we shouldn't stop
// anything with arbitrary timeliness, if it takes longer , it's okay"): the wall backstop is
// REMOVED entirely. A legitimate N=96 row measured 39.6 h under co-tenant load, so the 48 h
// "runaway" guard could have killed honest science at N=112/128. No wall guard is needed for
// termination: every row is bounded BY CONSTRUCTION by the registered step cap (100,000
// cycles) and relaxation cap (200,000 sweeps/cycle) — a wedged row is impossible in the
// solver loop, and an OS-level hang is handled by the sanctioned --retry-row path.
// History: 10 h caps (frozen plan) -> 16 h class caps (superseded in minutes) -> 48 h
// backstop -> removed; all recorded in docs/plans/phase-6-wp2-ladder.md.
export function wallCapSecondsFor(_rowId) {
  return null; // no wall limit: rows run to their constructive termination
}
// Review H5: the plan records concurrency ≤ 12; the clamp matches the recorded ceiling.
const DEFAULT_CONCURRENCY = 12;
const MAX_CONCURRENCY = 12;
const STDERR_TAIL_CHARS = 2000;
// Review H9: the only recorded outcomes a named --retry-row may retire. Anything else is a
// scientific result and is refused by name.
const RETRYABLE_STOP_REASONS = new Set(["child-error", "wall-cap-infrastructure"]);

/** The frozen 80 rows, in execution order. The evaluator transcribes this enumeration
 *  independently (Rule 9); runner/test/phase6-wp2-ladder-eval.test.ts cross-checks the two. */
export function enumerateRows() {
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
            sigmaInfinity: phase6SigmaInf(point.tempC, point.fraction),
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
          sigmaInfinity: phase6SigmaInf(point.tempC, point.fraction),
          cflFill: control.cflFill ?? BASE_CFL,
          relaxTol: control.relaxTol ?? BASE_RELAX_TOL,
        });
      }
    }
  }
  return rows;
}

// ── Crash-safe append (review B3) ───────────────────────────────────────────────────────────
/** Filesystem-safe timestamp for quarantine/retire file names. */
function fileStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/**
 * If rowsPath exists, is non-empty, and does not end in "\n", the trailing bytes after the
 * last newline are a partial line left by an interrupted append. Quarantine them by name to
 * `rows-truncated-<timestamp>.log` alongside the rows file, truncate the rows file back to its
 * last complete line, and log the action. The truncated row is then absent from the resume
 * scan, so it re-runs and records cleanly. Returns the quarantine record, or null if nothing
 * needed doing.
 */
export function quarantinePartialTrailingLine(rowsPath, log) {
  if (!existsSync(rowsPath)) return null;
  const text = readFileSync(rowsPath, "utf8");
  if (text.length === 0 || text.endsWith("\n")) return null;
  const lastNewline = text.lastIndexOf("\n");
  const partial = text.slice(lastNewline + 1);
  const kept = lastNewline === -1 ? "" : text.slice(0, lastNewline + 1);
  const quarantinePath = join(dirname(rowsPath), `rows-truncated-${fileStamp()}.log`);
  writeFileSync(quarantinePath, partial, "utf8");
  const tmpPath = `${rowsPath}.tmp-rewrite`;
  writeFileSync(tmpPath, kept, "utf8");
  renameSync(tmpPath, rowsPath);
  log(
    `crash-safe append: ${rowsPath} ended in a partial line (interrupted append); ` +
      `quarantined ${partial.length} byte(s) to ${quarantinePath} and truncated the rows ` +
      "file to its last complete line — the partial row is unrecorded and will re-run",
  );
  return { quarantinePath, partial };
}

/** Append one completed row record as a single JSON line. The only writer of rowsPath. */
export function appendRowRecord(rowsPath, record) {
  appendFileSync(rowsPath, `${JSON.stringify(record)}\n`);
}

// ── Resume scan ─────────────────────────────────────────────────────────────────────────────
/** Parse every recorded row. rowIds drive resume-skip; records feed the HEAD-continuity
 *  check. Unparseable lines are logged and left in place (the evaluator names them). */
export function readRecordedRows(rowsPath, log) {
  const rowIds = new Set();
  const records = [];
  if (!existsSync(rowsPath)) return { rowIds, records };
  for (const line of readFileSync(rowsPath, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed !== null && typeof parsed === "object" && typeof parsed.rowId === "string") {
        rowIds.add(parsed.rowId);
        records.push(parsed);
        continue;
      }
      log(`WARNING rows.jsonl holds a line with no rowId (left in place): ${line.slice(0, 120)}`);
    } catch {
      log(`WARNING rows.jsonl holds an unparseable line (left in place): ${line.slice(0, 120)}`);
    }
  }
  return { rowIds, records };
}

// ── HEAD continuity (review B2) ─────────────────────────────────────────────────────────────
/**
 * Every recorded row must carry the current HEAD's gitHead, or the resume is refused by name.
 * Returns the offending rowIds (empty = clean resume). Throws the refusal when offenders
 * exist and acceptMixedHeads is false.
 */
// The sanctioned pre-amendment phase (docs/plans/phase-6-wp2-ladder.md, 2026-08-09 two-phase
// record): rows recorded at the freeze-era head are ALWAYS acceptable history — the evaluator
// enforces the full two-phase shape fail-closed. Any other foreign head still refuses.
export const LADDER_FREEZE_HEAD = "f59d18702301155c0c2e7eaecc3442e6cf117123";
// 2026-08-12: the full sanctioned-head history, matching the evaluator's rule — the freeze
// head, the first-amendment head, and the current head. Rows at any of these resume freely.
export const SANCTIONED_HISTORY_HEADS = [
  LADDER_FREEZE_HEAD,
  "aa812952efbf5c4ef7152cc7595342092a51b000",
];
export function checkHeadContinuity(records, currentHead, acceptMixedHeads) {
  const offending = records
    .filter(
      (record) =>
        record.gitHead !== currentHead && !SANCTIONED_HISTORY_HEADS.includes(record.gitHead),
    )
    .map((record) => record.rowId);
  if (offending.length > 0 && !acceptMixedHeads) {
    throw new Error(
      `HEAD continuity: ${offending.length} recorded row(s) carry a gitHead that differs ` +
        `from the current HEAD ${currentHead}: ${offending.join(", ")}. Refusing to mix ` +
        "commits inside one rows.jsonl. Re-run with --accept-mixed-heads to proceed; every " +
        "new row will then record acceptedMixedHeads: true — but note the evaluator still " +
        "fails closed unless EVERY row (including the already-recorded ones) carries the " +
        "flag, so a mixed artifact whose older rows predate the flag stays no-pass.",
    );
  }
  return offending;
}

// ── PID lock (review H5) ────────────────────────────────────────────────────────────────────
function pidIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM = exists but not signalable by us: still alive. ESRCH = no such process.
    return error.code === "EPERM";
  }
}

/**
 * Take the dispatcher lock in outDir, refusing by name if a live PID holds it. A lock left by
 * a dead PID is named as stale and cleared. Returns the lock path (caller unlinks on exit).
 */
export function acquireDispatcherLock(outDir, log) {
  const lockPath = join(outDir, "dispatcher.lock");
  if (existsSync(lockPath)) {
    let holder = null;
    try {
      holder = JSON.parse(readFileSync(lockPath, "utf8"));
    } catch {
      holder = null;
    }
    const pid = holder === null ? null : holder.pid;
    if (Number.isSafeInteger(pid) && pidIsAlive(pid)) {
      throw new Error(
        `dispatcher lock ${lockPath} is held by live pid ${pid}` +
          `${holder.host ? ` on host ${holder.host}` : ""} (started ${holder.startedIso}); ` +
          "refusing to run two dispatchers against one rows.jsonl",
      );
    }
    log(
      Number.isSafeInteger(pid)
        ? `stale dispatcher lock: pid ${pid} is dead; clearing ${lockPath} by name`
        : `stale dispatcher lock: ${lockPath} is unparseable; clearing it by name`,
    );
    unlinkSync(lockPath);
  }
  writeFileSync(
    lockPath,
    `${JSON.stringify({ pid: process.pid, host: hostname(), startedIso: new Date().toISOString() })}\n`,
    "utf8",
  );
  return lockPath;
}

export function releaseDispatcherLock(lockPath) {
  try {
    unlinkSync(lockPath);
  } catch {
    // Best-effort: a missing lock at exit is not an error.
  }
}

// ── Named retry (review H9) ─────────────────────────────────────────────────────────────────
/**
 * Retire the recorded record for rowId into `rows-retired-<timestamp>.jsonl` alongside the
 * rows file so the row re-runs. Allowed ONLY for stopReason child-error or
 * wall-cap-infrastructure; any other recorded outcome is a scientific result and the retry is
 * refused by name. Throws on refusal; returns { retiredPath, retiredCount } on success.
 */
export function retireRowForRetry(rowsPath, rowId, log) {
  if (!existsSync(rowsPath)) {
    throw new Error(`--retry-row ${rowId}: ${rowsPath} does not exist; nothing to retry`);
  }
  const text = readFileSync(rowsPath, "utf8");
  const lines = text.split("\n").filter((line) => line !== "");
  const kept = [];
  const retired = [];
  for (const line of lines) {
    let parsed = null;
    try {
      parsed = JSON.parse(line);
    } catch {
      parsed = null;
    }
    if (parsed !== null && typeof parsed === "object" && parsed.rowId === rowId) {
      if (!RETRYABLE_STOP_REASONS.has(parsed.stopReason)) {
        throw new Error(
          `--retry-row ${rowId}: recorded stopReason "${String(parsed.stopReason)}" is not ` +
            "retryable — only child-error and wall-cap-infrastructure records may be " +
            "retired; every other recorded outcome is a scientific result",
        );
      }
      retired.push(line);
    } else {
      kept.push(line);
    }
  }
  if (retired.length === 0) {
    throw new Error(`--retry-row ${rowId}: no recorded row with that rowId; nothing to retry`);
  }
  const retiredPath = join(dirname(rowsPath), `rows-retired-${fileStamp()}.jsonl`);
  appendFileSync(retiredPath, retired.map((line) => `${line}\n`).join(""));
  writeFileSync(rowsPath, kept.map((line) => `${line}\n`).join(""), "utf8");
  log(
    `retry-row ${rowId}: retired ${retired.length} record(s) ` +
      `(stopReason child-error/wall-cap-infrastructure only) to ${retiredPath}; ` +
      "the row is unrecorded again and will re-run",
  );
  return { retiredPath, retiredCount: retired.length };
}

// ── The dispatcher body — runs only when this file is the executed script ───────────────────
function usageFail(message) {
  console.error(`phase6-wp2-ladder-run: ${message}`);
  process.exit(1);
}

function refuse(message) {
  console.error(`phase6-wp2-ladder-run: ${message}`);
  process.exit(2);
}

function main() {
  let concurrency = DEFAULT_CONCURRENCY;
  let enumerateOnly = false;
  let acceptMixedHeads = false;
  const retryRowIds = [];
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--enumerate") {
      enumerateOnly = true;
    } else if (flag === "--accept-mixed-heads") {
      acceptMixedHeads = true;
    } else if (flag === "--retry-row") {
      const raw = argv[++i];
      if (raw === undefined || raw === "") usageFail("--retry-row wants a rowId");
      retryRowIds.push(raw);
    } else if (flag === "--concurrency") {
      const raw = argv[++i];
      const value = Number(raw);
      if (!Number.isSafeInteger(value) || value < 1 || value > MAX_CONCURRENCY) {
        usageFail(
          `--concurrency wants an integer in 1..${MAX_CONCURRENCY} ` +
            `(the plan's recorded ceiling), got "${raw}"`,
        );
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

  // ── Startup provenance: recorded, and dirty trees refused by name ─────────────────────────
  const gitOut = (args) =>
    execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  const porcelain = gitOut(["status", "--porcelain"]);
  if (porcelain !== "") {
    refuse(
      "REFUSING to launch ladder rows — `git status --porcelain` is non-empty, so the " +
        "evidence could not be reproduced from HEAD. Commit or stash first.\n" + porcelain,
    );
  }
  const head = gitOut(["rev-parse", "HEAD"]);
  if (!/^[0-9a-f]{40}$/.test(head)) {
    refuse(`git rev-parse HEAD returned "${head}", not a 40-hex commit; refusing to stamp it`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  function log(line) {
    const stamped = `${new Date().toISOString()} ${line}`;
    console.log(stamped);
    appendFileSync(LOG_PATH, `${stamped}\n`);
  }

  // Review H5: one dispatcher per rows.jsonl, enforced by a PID lock.
  let lockPath;
  try {
    lockPath = acquireDispatcherLock(OUT_DIR, log);
  } catch (error) {
    refuse(error instanceof Error ? error.message : String(error));
  }
  process.on("exit", () => releaseDispatcherLock(lockPath));

  const dispatcherCommand = process.argv.join(" ");
  const host = hostname();
  log(
    `ladder dispatcher starting head=${head} node=${process.version} pid=${process.pid} ` +
      `host=${host} concurrency=${concurrency} wallCap=none (rows bounded by registered step/sweep caps) ` +
      `acceptMixedHeads=${acceptMixedHeads} command=${JSON.stringify(dispatcherCommand)}`,
  );
  if (acceptMixedHeads) {
    log(
      "--accept-mixed-heads ACTIVE: every row recorded this session carries " +
        "acceptedMixedHeads: true, and the artifact holds rows from more than one HEAD",
    );
  }

  // Review B3: quarantine an interrupted append BEFORE any read or append of rows.jsonl.
  quarantinePartialTrailingLine(ROWS_PATH, log);

  // Review H9: named retries retire their records before the resume scan.
  for (const rowId of retryRowIds) {
    try {
      retireRowForRetry(ROWS_PATH, rowId, log);
    } catch (error) {
      refuse(error instanceof Error ? error.message : String(error));
    }
  }

  // Resume: rowIds already recorded are skipped. Only THIS process ever appends to rows.jsonl.
  const { rowIds: done, records } = readRecordedRows(ROWS_PATH, log);

  // Review B2: refuse a resume that would silently mix HEADs in one artifact.
  try {
    const offending = checkHeadContinuity(records, head, acceptMixedHeads);
    if (offending.length > 0) {
      log(
        `mixed HEADs accepted by flag: ${offending.length} recorded row(s) carry a different ` +
          `gitHead than ${head} (${offending.join(", ")})`,
      );
    }
  } catch (error) {
    refuse(error instanceof Error ? error.message : String(error));
  }

  const pending = allRows.filter((row) => !done.has(row.rowId));
  for (const row of allRows) {
    if (done.has(row.rowId)) log(`skip ${row.rowId} (already recorded)`);
  }
  log(
    `rows: ${allRows.length} enumerated, ${done.size} already recorded, ${pending.length} to run`,
  );

  // Review B2: every appended record — child success, cap, or error — carries the same
  // execution provenance, stamped by the single writer.
  function stampProvenance(record, startedIso) {
    return {
      ...record,
      gitHead: head,
      startedIso,
      finishedIso: new Date().toISOString(),
      concurrency,
      host,
      dispatcherCommand,
      engine: process.version,
      ...(acceptMixedHeads ? { acceptedMixedHeads: true } : {}),
    };
  }

  function recordRow(record, startedIso) {
    appendRowRecord(ROWS_PATH, stampProvenance(record, startedIso));
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
    const startedIso = new Date().toISOString();
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
    // Second amendment (2026-08-11): no wall limit — capSeconds is null and no timer is set.
    // Rows terminate by construction (registered step cap × relaxation cap).
    const capSeconds = wallCapSecondsFor(row.rowId);
    let capTimer = null;
    if (capSeconds !== null) {
      capTimer = setTimeout(() => {
        capped = true;
        log(`wall-cap ${row.rowId}: killing child at the per-row wall cap`);
        child.kill();
      }, capSeconds * 1000);
      capTimer.unref();
    }

    child.on("error", (error) => {
      clearTimeout(capTimer);
      recordRow(
        {
          ...row,
          stopReason: "child-error",
          dispatcherNote: `spawn failed: ${error.message}`,
          wallSeconds: wallSecondsNow(),
        },
        startedIso,
      );
      log(
        `done ${row.rowId} stop=child-error (spawn failed) wall=${wallSecondsNow().toFixed(1)}s`,
      );
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
        recordRow(
          {
            ...row,
            stopReason: "wall-cap-infrastructure",
            dispatcherNote: `child killed at the ${capSeconds} s per-row wall cap`,
            wallSeconds,
          },
          startedIso,
        );
        log(`done ${row.rowId} stop=wall-cap-infrastructure wall=${wallSeconds.toFixed(1)}s`);
      } else if (code !== 0) {
        // Never retried silently: the failure is the recorded outcome.
        recordRow(
          {
            ...row,
            stopReason: "child-error",
            exitCode: code,
            signal: signal ?? null,
            stderrTail,
            wallSeconds,
          },
          startedIso,
        );
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
          recordRow(
            {
              ...row,
              stopReason: "child-error",
              dispatcherNote:
                `child exited 0 but its stdout was not exactly one JSON line for ${row.rowId} ` +
                `(${lines.length} line(s))`,
              stderrTail,
              wallSeconds,
            },
            startedIso,
          );
          log(`done ${row.rowId} stop=child-error (bad stdout) wall=${wallSeconds.toFixed(1)}s`);
        } else {
          recordRow(record, startedIso);
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
}

// Run the dispatcher only when executed directly (`node app/scripts/phase6-wp2-ladder-run.mjs`);
// importing this module (the focused tests do) must never launch rows or touch git.
const isDirectRun =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href.toLowerCase() === import.meta.url.toLowerCase();
if (isDirectRun) main();
