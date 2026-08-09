// Phase 6 WP2 ladder — focused tests on the dispatcher's helpers and the evaluator, per the
// unit's pre-execution review (blockers B1-B4, hardening H2/H4/H5/H7/H9/H12).
//
// The evaluator (app/scripts/phase6-wp2-ladder-eval.mjs) is run AS A CHILD PROCESS on fixtures
// written to the OS temp dir, exactly as it runs on the real artifact. Rule 9 discipline: every
// negative control asserts its named mutation actually executed, verified from the WRITTEN
// fixture bytes rather than from the code that made the mutation; and the fully-passing fixture
// is generated from the DISPATCHER's own enumerateRows() (operands included), so a
// zero-missing-rows, zero-echo-mismatch pass proves the dispatcher's enumeration and the
// evaluator's independent transcription agree on every rowId AND every operand. The dispatcher
// module is imported directly (its main body runs only when executed as a script) so the
// crash-safe append (B3), PID lock (H5), HEAD continuity (B2), and named retry (H9) helpers
// are exercised without launching any ladder row.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { PHASE6_CROSSPLATFORM_FIXTURE } from "../src/phase6-crossplatform.ts";
import { PHASE6_FAR_FIELD, PHASE6_SURFACE_POLICY } from "../src/phase6-protocol.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const EVAL_SCRIPT = join(REPOSITORY_ROOT, "app", "scripts", "phase6-wp2-ladder-eval.mjs");
const RUN_SCRIPT = join(REPOSITORY_ROOT, "app", "scripts", "phase6-wp2-ladder-run.mjs");
const ROW_SCRIPT = join(REPOSITORY_ROOT, "app", "scripts", "phase6-wp2-ladder-row.mjs");

// Registered habit thresholds, restated for the byte-level mutation checks (source:
// runner/src/phase6-protocol.ts freeze item "metric-thresholds").
const PLATE_AR_CEILING = 1 / 1.5;
const COLUMN_AR_FLOOR = 1.5;
const ATTACHED_COUNT_TOLERANCE = 0.005;

// The frozen scope statement (review B4), restated VERBATIM here as the cross-check that the
// evaluator emits exactly these bytes in its report and its stderr summary.
const SCOPE_STATEMENT =
  "SCOPE: This verdict covers the floor sizes only (seed 17 cells growing to extent 54 at " +
  "dx 0.35 um; seed 8 to extent 27 at dx 0.7 um) at the four registered check points. The " +
  "S1-ceiling seed, S2-ceiling extent, and the 0.2333 um fine spacing are excluded as " +
  "measured-scaling-infeasible under decision 0045's envelope; the S2-ceiling stratum's " +
  "numerics are UNVERIFIED. A pass authorizes no production campaign (decision 0045). The " +
  "M1_NO_DIP_ABLATION arm inherits M1's rung verdict as an untested transfer assumption, " +
  "not a measurement.";

// Two syntactically valid 40-hex heads for the provenance fixtures.
const FIXTURE_GIT_HEAD = "a1b2c3d4".repeat(5);
const OTHER_GIT_HEAD = "e5f60718".repeat(5);

// ── The dispatcher module, imported WITHOUT running its main body ───────────────────────────
interface EnumeratedRow {
  rowId: string;
  tempC: number;
  fraction: number;
  sigmaInfinity: number;
  paramSet: "M1" | "CAK";
  dxUm: number;
  seedRadius: number;
  targetExtent: number;
  domainN: number;
  cflFill: number;
  relaxTol: number;
}

interface RunModule {
  BASE_CFL: number;
  BASE_RELAX_TOL: number;
  enumerateRows(): EnumeratedRow[];
  quarantinePartialTrailingLine(
    rowsPath: string,
    log: (line: string) => void,
  ): { quarantinePath: string; partial: string } | null;
  appendRowRecord(rowsPath: string, record: object): void;
  readRecordedRows(
    rowsPath: string,
    log: (line: string) => void,
  ): { rowIds: Set<string>; records: Array<Record<string, unknown>> };
  checkHeadContinuity(
    records: ReadonlyArray<Record<string, unknown>>,
    currentHead: string,
    acceptMixedHeads: boolean,
  ): string[];
  acquireDispatcherLock(outDir: string, log: (line: string) => void): string;
  releaseDispatcherLock(lockPath: string): void;
  retireRowForRetry(
    rowsPath: string,
    rowId: string,
    log: (line: string) => void,
  ): { retiredPath: string; retiredCount: number };
}

const run = (await import(pathToFileURL(RUN_SCRIPT).href)) as RunModule;

interface FixtureRow {
  rowId: string;
  tempC: number;
  fraction: number;
  sigmaInfinity: number;
  paramSet: string;
  dxUm: number;
  seedRadius: number;
  targetExtent: number;
  domainN: number;
  cflFill: number;
  relaxTol: number;
  surfacePolicy: string;
  farField: string;
  pressurePa: number;
  noiseEpsilon: number;
  rngSeed: number;
  domain: string;
  divTol: number;
  relaxMaxSweeps: number;
  seedThickness: number;
  stopReason: string;
  attachedCount: number;
  aspectRatio: number;
  gitHead: string;
  acceptedMixedHeads?: boolean;
}

interface LadderComparison {
  kind: string;
  comparison: string;
  tempC: number;
  fraction: number;
  arm: string;
  rowIdA: string;
  rowIdB: string;
  classA: string | null;
  classB: string | null;
  attachedA: number | null;
  attachedB: number | null;
  relDiff: number | null;
  verdict: string;
  failureClass: string | null;
  reason: string;
}

interface LadderSpacing {
  dxUm: number;
  domainNs: number[];
  domainComparisons: LadderComparison[];
  domainPass: boolean;
  auxiliaryPass: boolean;
  verdict: string;
  noPassClass: string | null;
  reasons: string[];
}

interface LadderReport {
  scopeStatement: string;
  overallVerdict: string;
  overallNoPassClass: string | null;
  rowsSha256: string | null;
  expectedRowCount: number;
  presentExpectedRowCount: number;
  missingRowIds: string[];
  unexpectedRowIds: string[];
  artifactDefects: string[];
  distinctGitHeads: string[];
  ladderFreezeHead: string;
  amendmentHead: string | null;
  globalForcingReasons: string[];
  auxiliaryComparisons: LadderComparison[];
  spacings: LadderSpacing[];
}

const temporaryDirectories: string[] = [];
afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory !== undefined) rmSync(directory, { recursive: true, force: true });
  }
});

function scratchDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "phase6-wp2-ladder-eval-"));
  temporaryDirectories.push(dir);
  return dir;
}

let cachedRowIds: string[] | null = null;
function enumeratedRowIds(): string[] {
  if (cachedRowIds !== null) return cachedRowIds;
  const result = spawnSync(process.execPath, [RUN_SCRIPT, "--enumerate"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  cachedRowIds = result.stdout.split("\n").filter((line) => line.trim() !== "");
  return cachedRowIds;
}

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Deterministic passing fixture: plate at −31/−6 °C, column at −13/−27 °C, attached counts
 *  jittered well inside the 0.5% tolerance (10000..10004, worst pairwise 0.04%) — small enough
 *  that the 0.6% mutation control exceeds the tolerance against any jittered partner. Rows are
 *  built from the DISPATCHER's enumerateRows() (rowIds AND operands) plus the registered fixed
 *  block imported from runner/src, so a fully-clean evaluation also proves the evaluator's
 *  independent transcription (Rule 9) agrees with both. */
function passingRows(): FixtureRow[] {
  return run.enumerateRows().map((row) => {
    const plate = row.tempC === -31 || row.tempC === -6;
    const hash = fnv1a(row.rowId);
    return {
      ...row,
      surfacePolicy: PHASE6_SURFACE_POLICY,
      farField: PHASE6_FAR_FIELD,
      pressurePa: PHASE6_CROSSPLATFORM_FIXTURE.pressurePa,
      noiseEpsilon: PHASE6_CROSSPLATFORM_FIXTURE.noiseEpsilon,
      rngSeed: PHASE6_CROSSPLATFORM_FIXTURE.rngSeed,
      domain: PHASE6_CROSSPLATFORM_FIXTURE.domain,
      divTol: PHASE6_CROSSPLATFORM_FIXTURE.divTol,
      relaxMaxSweeps: PHASE6_CROSSPLATFORM_FIXTURE.relaxMaxSweeps,
      seedThickness: 2 * row.seedRadius + 1,
      stopReason: "size-target",
      attachedCount: 10_000 + (hash % 5),
      aspectRatio: plate ? 0.5 + (hash % 40) * 0.002 : 2 + (hash % 40) * 0.005,
      gitHead: FIXTURE_GIT_HEAD,
    };
  });
}

function writeFixture(rows: readonly FixtureRow[]): string {
  const path = join(scratchDir(), "rows.jsonl");
  writeFileSync(path, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  return path;
}

/** Independent re-read of a written fixture — the verifier for "the mutation executed". */
function readFixtureRows(path: string): Map<string, FixtureRow> {
  const out = new Map<string, FixtureRow>();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    const row = JSON.parse(line) as FixtureRow;
    out.set(row.rowId, row);
  }
  return out;
}

function runEval(rowsPath: string): { report: LadderReport; stderr: string } {
  const result = spawnSync(process.execPath, [EVAL_SCRIPT, "--rows", rowsPath], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
  // Exit 0 always — the verdict is data, not an error.
  expect(result.status).toBe(0);
  return { report: JSON.parse(result.stdout) as LadderReport, stderr: result.stderr };
}

function spacingByDx(report: LadderReport, dxUm: number): LadderSpacing {
  const spacing = report.spacings.find((candidate) => candidate.dxUm === dxUm);
  if (spacing === undefined) throw new Error(`no spacing ${dxUm} in the report`);
  return spacing;
}

function mustFind(
  comparisons: readonly LadderComparison[],
  predicate: (c: LadderComparison) => boolean,
): LadderComparison {
  const found = comparisons.find(predicate);
  if (found === undefined) throw new Error("expected comparison not found in the report");
  return found;
}

function mustGet(rows: Map<string, FixtureRow>, rowId: string): FixtureRow {
  const row = rows.get(rowId);
  if (row === undefined) throw new Error(`fixture row ${rowId} not found`);
  return row;
}

function everyComparison(report: LadderReport): LadderComparison[] {
  return [
    ...report.auxiliaryComparisons,
    ...report.spacings.flatMap((spacing) => spacing.domainComparisons),
  ];
}

describe("Phase 6 WP2 ladder dispatcher enumeration", () => {
  it("enumerates the frozen 80 rows in the plan's order", () => {
    const ids = enumeratedRowIds();
    expect(ids).toHaveLength(80);
    expect(new Set(ids).size).toBe(80);
    expect(ids.slice(0, 6)).toEqual([
      "dom-0.7-n48@-31C-f0.6-M1",
      "dom-0.7-n48@-31C-f0.6-CAK",
      "dom-0.7-n48@-13C-f0.15-M1",
      "dom-0.7-n48@-13C-f0.15-CAK",
      "dom-0.7-n48@-6C-f0.15-M1",
      "dom-0.7-n48@-6C-f0.15-CAK",
    ]);
    expect(ids.slice(-3)).toEqual([
      "aux-seed18@-6C-f0.15-CAK",
      "aux-seed18@-27C-f0.15-M1",
      "aux-seed18@-27C-f0.15-CAK",
    ]);
    // Coarse spacing fully first, then 0.35 um, then the 32 auxiliary rows.
    expect(ids.slice(0, 24).every((id) => id.startsWith("dom-0.7-"))).toBe(true);
    expect(ids.slice(24, 48).every((id) => id.startsWith("dom-0.35-"))).toBe(true);
    expect(ids.findIndex((id) => id.startsWith("aux-"))).toBe(48);
    expect(ids.slice(48).every((id) => id.startsWith("aux-"))).toBe(true);
    // The imported module and the executed CLI agree — the fixtures below are built from the
    // module, so this pins them to the byte-identical --enumerate output.
    expect(run.enumerateRows().map((row) => row.rowId)).toEqual(ids);
  });

  it("row-runner and dispatcher constants equal the registered sources (review H2)", () => {
    // The row script is an argv-driven evidence path, so its frozen literals are read from
    // the SOURCE BYTES rather than by importing it (importing would execute a run).
    const source = readFileSync(ROW_SCRIPT, "utf8");
    const fixedMatch = source.match(/^const FIXED = (\{[\s\S]*?\n\});/m);
    if (fixedMatch === null) throw new Error("row script lost its `const FIXED = {...};` block");
    const fixed = new Function(`return (${fixedMatch[1]});`)() as Record<string, unknown>;
    expect(fixed.surfacePolicy).toBe(PHASE6_SURFACE_POLICY);
    expect(fixed.farField).toBe(PHASE6_FAR_FIELD);
    expect(fixed.pressurePa).toBe(PHASE6_CROSSPLATFORM_FIXTURE.pressurePa);
    expect(fixed.noiseEpsilon).toBe(PHASE6_CROSSPLATFORM_FIXTURE.noiseEpsilon);
    expect(fixed.rngSeed).toBe(PHASE6_CROSSPLATFORM_FIXTURE.rngSeed);
    expect(fixed.domain).toBe(PHASE6_CROSSPLATFORM_FIXTURE.domain);
    expect(fixed.divTol).toBe(PHASE6_CROSSPLATFORM_FIXTURE.divTol);
    expect(fixed.relaxMaxSweeps).toBe(PHASE6_CROSSPLATFORM_FIXTURE.relaxMaxSweeps);

    const stepMatch = source.match(/^const STEP_CAP = ([0-9_]+);/m);
    if (stepMatch === null) throw new Error("row script lost its `const STEP_CAP = ...;` line");
    expect(Number(stepMatch[1].replace(/_/g, ""))).toBe(PHASE6_CROSSPLATFORM_FIXTURE.steps);

    // The isometric seed mapping the strata freeze records, asserted textually.
    expect(source).toContain("const seedThickness = 2 * input.seedRadius + 1;");

    // The dispatcher's base-rung values are the registered fixture's numerics.
    expect(run.BASE_CFL).toBe(PHASE6_CROSSPLATFORM_FIXTURE.cflFill);
    expect(run.BASE_RELAX_TOL).toBe(PHASE6_CROSSPLATFORM_FIXTURE.relaxTol);
  });
});

describe("Phase 6 WP2 ladder dispatcher crash-safe append (review B3)", () => {
  it("quarantines an interrupted append by name, the row re-runs and records cleanly", () => {
    const dir = scratchDir();
    const rowsPath = join(dir, "rows.jsonl");
    const [row1, row2] = passingRows();
    const partial = JSON.stringify(row2).slice(0, 47); // a crash mid-append: no newline
    writeFileSync(rowsPath, `${JSON.stringify(row1)}\n${partial}`, "utf8");
    // The mutation executed: the written bytes really end mid-line.
    expect(readFileSync(rowsPath, "utf8").endsWith("\n")).toBe(false);

    const logLines: string[] = [];
    const result = run.quarantinePartialTrailingLine(rowsPath, (line) => logLines.push(line));
    if (result === null) throw new Error("quarantine reported nothing to do on a partial line");
    // The partial line is preserved byte-for-byte in the named quarantine file...
    expect(result.partial).toBe(partial);
    expect(result.quarantinePath).toContain("rows-truncated-");
    expect(readFileSync(result.quarantinePath, "utf8")).toBe(partial);
    expect(logLines.join("\n")).toContain("quarantined");
    // ...and the rows file is truncated back to its last complete line.
    const remaining = readFileSync(rowsPath, "utf8");
    expect(remaining.endsWith("\n")).toBe(true);
    expect(remaining).toBe(`${JSON.stringify(row1)}\n`);

    // The truncated row is unrecorded, so the resume scan re-runs it...
    const scan = run.readRecordedRows(rowsPath, () => {});
    expect(scan.rowIds.has(row1.rowId)).toBe(true);
    expect(scan.rowIds.has(row2.rowId)).toBe(false);
    // ...and its re-run records cleanly (simulated with the dispatcher's own append).
    run.appendRowRecord(rowsPath, row2);
    const recovered = readFixtureRows(rowsPath);
    expect(recovered.size).toBe(2);
    expect(mustGet(recovered, row2.rowId)).toEqual(row2);
    expect(readFileSync(rowsPath, "utf8").endsWith("\n")).toBe(true);
    // A second pass finds nothing to quarantine: the cycle is closed.
    expect(run.quarantinePartialTrailingLine(rowsPath, () => {})).toBeNull();
  });

  it("is a no-op on a missing, empty, or cleanly terminated rows file", () => {
    const dir = scratchDir();
    const rowsPath = join(dir, "rows.jsonl");
    expect(run.quarantinePartialTrailingLine(rowsPath, () => {})).toBeNull();
    writeFileSync(rowsPath, "", "utf8");
    expect(run.quarantinePartialTrailingLine(rowsPath, () => {})).toBeNull();
    const [row1] = passingRows();
    writeFileSync(rowsPath, `${JSON.stringify(row1)}\n`, "utf8");
    const before = readFileSync(rowsPath, "utf8");
    expect(run.quarantinePartialTrailingLine(rowsPath, () => {})).toBeNull();
    expect(readFileSync(rowsPath, "utf8")).toBe(before);
  });
});

describe("Phase 6 WP2 ladder dispatcher lock and clamp (review H5)", () => {
  it("refuses a lock held by a live pid by name", () => {
    const dir = scratchDir();
    writeFileSync(
      join(dir, "dispatcher.lock"),
      `${JSON.stringify({ pid: process.pid, host: "host-x", startedIso: "2026-08-08T00:00:00Z" })}\n`,
      "utf8",
    );
    expect(() => run.acquireDispatcherLock(dir, () => {})).toThrow(
      new RegExp(`live pid ${process.pid}`),
    );
  });

  it("names and clears a stale lock from a dead pid, then takes the lock", () => {
    const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"], { encoding: "utf8" });
    expect(dead.status).toBe(0);
    const deadPid = dead.pid;
    const dir = scratchDir();
    writeFileSync(
      join(dir, "dispatcher.lock"),
      `${JSON.stringify({ pid: deadPid, host: "host-x", startedIso: "2026-08-08T00:00:00Z" })}\n`,
      "utf8",
    );
    const logLines: string[] = [];
    const lockPath = run.acquireDispatcherLock(dir, (line) => logLines.push(line));
    expect(logLines.join("\n")).toContain(`stale dispatcher lock: pid ${deadPid} is dead`);
    const holder = JSON.parse(readFileSync(lockPath, "utf8")) as { pid: number };
    expect(holder.pid).toBe(process.pid);
    run.releaseDispatcherLock(lockPath);
    expect(() => readFileSync(lockPath, "utf8")).toThrow();
  });

  it("clamps --concurrency to 1..12, the plan's recorded ceiling, by name", () => {
    for (const raw of ["13", "0", "16"]) {
      const result = spawnSync(process.execPath, [RUN_SCRIPT, "--concurrency", raw], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("--concurrency wants an integer in 1..12");
    }
  });
});

describe("Phase 6 WP2 ladder dispatcher HEAD continuity (review B2)", () => {
  it("refuses to resume across HEADs by name unless --accept-mixed-heads", () => {
    const records = [
      { rowId: "row-same", gitHead: FIXTURE_GIT_HEAD },
      { rowId: "row-other", gitHead: OTHER_GIT_HEAD },
      { rowId: "row-unstamped" },
    ];
    expect(() => run.checkHeadContinuity(records, FIXTURE_GIT_HEAD, false)).toThrow(
      /row-other, row-unstamped/,
    );
    expect(() => run.checkHeadContinuity(records, FIXTURE_GIT_HEAD, false)).toThrow(
      /--accept-mixed-heads/,
    );
    // The explicit flag converts the refusal into a named, recorded acceptance...
    expect(run.checkHeadContinuity(records, FIXTURE_GIT_HEAD, true)).toEqual([
      "row-other",
      "row-unstamped",
    ]);
    // Rows at the sanctioned freeze-era head are always acceptable history (2026-08-09
    // two-phase amendment) — no flag needed, and they are not listed as offending.
    expect(
      run.checkHeadContinuity(
        [
          { rowId: "row-freeze", gitHead: "f59d18702301155c0c2e7eaecc3442e6cf117123" },
          { rowId: "row-same", gitHead: FIXTURE_GIT_HEAD },
        ],
        FIXTURE_GIT_HEAD,
        false,
      ),
    ).toEqual([]);
    // ...and a single-head artifact resumes without any flag.
    expect(
      run.checkHeadContinuity(
        [{ rowId: "row-same", gitHead: FIXTURE_GIT_HEAD }],
        FIXTURE_GIT_HEAD,
        false,
      ),
    ).toEqual([]);
  });
});

describe("Phase 6 WP2 ladder dispatcher named retry (review H9)", () => {
  function retryFixture(): { rowsPath: string; rows: FixtureRow[] } {
    const [r1, r2, r3] = passingRows();
    const rows = [
      { ...r1, stopReason: "child-error" },
      r2, // size-target: a scientific outcome, never retryable
      { ...r3, stopReason: "wall-cap-infrastructure" },
    ];
    return { rowsPath: writeFixture(rows), rows };
  }

  it("retires a child-error or wall-cap record to rows-retired and lets the row re-run", () => {
    const { rowsPath, rows } = retryFixture();
    const logLines: string[] = [];
    const result = run.retireRowForRetry(rowsPath, rows[0].rowId, (line) => logLines.push(line));
    expect(result.retiredCount).toBe(1);
    expect(result.retiredPath).toContain("rows-retired-");
    // The record moved, not vanished: the retired file holds the exact original line.
    const retired = readFixtureRows(result.retiredPath);
    expect(mustGet(retired, rows[0].rowId).stopReason).toBe("child-error");
    expect(logLines.join("\n")).toContain(`retry-row ${rows[0].rowId}`);
    // The rows file no longer records it, so the resume scan re-runs exactly that row.
    const scan = run.readRecordedRows(rowsPath, () => {});
    expect(scan.rowIds.has(rows[0].rowId)).toBe(false);
    expect(scan.rowIds.has(rows[1].rowId)).toBe(true);
    expect(scan.rowIds.has(rows[2].rowId)).toBe(true);
    // wall-cap-infrastructure is the other named retryable outcome.
    const capResult = run.retireRowForRetry(rowsPath, rows[2].rowId, () => {});
    expect(capResult.retiredCount).toBe(1);
    expect(run.readRecordedRows(rowsPath, () => {}).rowIds.has(rows[2].rowId)).toBe(false);
  });

  it("refuses to retire a scientific outcome or an unknown rowId by name", () => {
    const { rowsPath, rows } = retryFixture();
    const before = readFileSync(rowsPath, "utf8");
    expect(() => run.retireRowForRetry(rowsPath, rows[1].rowId, () => {})).toThrow(
      /stopReason "size-target" is not retryable/,
    );
    expect(() => run.retireRowForRetry(rowsPath, "no-such-row", () => {})).toThrow(
      /nothing to retry/,
    );
    // A refused retry mutates nothing.
    expect(readFileSync(rowsPath, "utf8")).toBe(before);
  });
});

describe("Phase 6 WP2 ladder evaluator", () => {
  it("passes both spacings on a fully passing synthetic artifact", () => {
    const rowsPath = writeFixture(passingRows());
    const writtenBytes = readFileSync(rowsPath);
    const { report, stderr } = runEval(rowsPath);
    expect(report.expectedRowCount).toBe(80);
    expect(report.presentExpectedRowCount).toBe(80);
    // Zero missing rows AND zero echo mismatches on a fixture generated from the dispatcher's
    // enumeration proves the evaluator's independent transcription and the dispatcher agree
    // on all 80 rowIds and on every operand (rung values, aux overrides, fixed block).
    expect(report.missingRowIds).toEqual([]);
    expect(report.unexpectedRowIds).toEqual([]);
    expect(report.artifactDefects).toEqual([]);
    expect(report.globalForcingReasons).toEqual([]);
    expect(report.spacings.map((spacing) => spacing.dxUm)).toEqual([0.7, 0.35]);
    expect(report.auxiliaryComparisons).toHaveLength(32);
    for (const spacing of report.spacings) {
      expect(spacing.domainComparisons).toHaveLength(16);
      expect(spacing.domainPass).toBe(true);
      expect(spacing.auxiliaryPass).toBe(true);
      expect(spacing.verdict).toBe("pass");
      expect(spacing.noPassClass).toBeNull();
      expect(spacing.reasons).toEqual([]);
    }
    for (const comparison of everyComparison(report)) {
      expect(comparison.verdict).toBe("pass");
      expect(comparison.failureClass).toBeNull();
    }
    // Review H12: the verdict is top-level and the report hashes the exact bytes it read.
    expect(report.overallVerdict).toBe("pass");
    expect(report.overallNoPassClass).toBeNull();
    expect(report.rowsSha256).toBe(createHash("sha256").update(writtenBytes).digest("hex"));
    // Review B2 + 2026-08-09 two-phase amendment: provenance reported — one non-freeze head,
    // which the sanctioned shape allows (a full single-head run at the amendment head).
    expect(report.distinctGitHeads).toEqual([FIXTURE_GIT_HEAD]);
    expect(report.ladderFreezeHead).toBe("f59d18702301155c0c2e7eaecc3442e6cf117123");
    expect(report.amendmentHead).toBe(FIXTURE_GIT_HEAD);
    // Review B4: the frozen scope statement, verbatim, in the report and the stderr summary.
    expect(report.scopeStatement).toBe(SCOPE_STATEMENT);
    expect(stderr).toContain(SCOPE_STATEMENT);
  });

  it("no-passes 0.35 um when one attached count moves 0.6% (control: attached-count)", () => {
    const target = "dom-0.35-n112@-13C-f0.15-CAK";
    const baseline = passingRows();
    const mutant = baseline.map((row) =>
      row.rowId === target
        ? { ...row, attachedCount: Math.round(row.attachedCount * 1.006) }
        : row,
    );
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the mutation executed — recomputed from the written bytes of both fixtures,
    // under the REFERENCE-row convention (review H7): the coarse rung's count is the
    // denominator, matching the registered phase6DomainSpotCheckPasses implementation.
    const passingBytes = readFixtureRows(passingPath);
    const mutantBytes = readFixtureRows(mutantPath);
    const reference = "dom-0.35-n96@-13C-f0.15-CAK";
    const relDiff = (rows: Map<string, FixtureRow>): number => {
      const referenceCount = mustGet(rows, reference).attachedCount;
      const variantCount = mustGet(rows, target).attachedCount;
      return Math.abs(referenceCount - variantCount) / referenceCount;
    };
    expect(relDiff(passingBytes)).toBeLessThanOrEqual(ATTACHED_COUNT_TOLERANCE);
    expect(relDiff(mutantBytes)).toBeGreaterThan(ATTACHED_COUNT_TOLERANCE);

    const { report } = runEval(mutantPath);
    const fine = spacingByDx(report, 0.35);
    const coarse = spacingByDx(report, 0.7);
    expect(report.overallVerdict).toBe("no-pass");
    expect(fine.verdict).toBe("no-pass");
    expect(fine.noPassClass).toBe("criterion");
    expect(coarse.verdict).toBe("pass");
    const failing = mustFind(
      fine.domainComparisons,
      (c) => c.comparison === "n96->n112" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.failureClass).toBe("criterion");
    expect(failing.reason).toContain("attached counts differ");
    expect(failing.attachedB).toBe(mustGet(mutantBytes, target).attachedCount);
  });

  it("no-passes at the disagreement band of the relDiff conventions (review H7)", () => {
    // reference 100000 vs variant 100501: 0.501% under the registered reference-row
    // convention (no-pass), but 501/100501 = 0.4985% under the rejected max(a, b) form
    // (would have passed) — so this control is non-vacuous about the convention itself.
    const reference = "dom-0.35-n96@-31C-f0.6-M1";
    const variant = "dom-0.35-n112@-31C-f0.6-M1";
    const counts = new Map<string, number>([
      [reference, 100_000],
      [variant, 100_501],
      // Keep every OTHER comparison touching these rows inside tolerance, so exactly one
      // comparison exercises the band.
      ["dom-0.35-n128@-31C-f0.6-M1", 100_501],
      ["aux-cfl0.05@-31C-f0.6-M1", 100_000],
      ["aux-relaxTol1e-10@-31C-f0.6-M1", 100_000],
      ["aux-seed16@-31C-f0.6-M1", 100_000],
      ["aux-seed18@-31C-f0.6-M1", 100_000],
    ]);
    const mutant = passingRows().map((row) =>
      counts.has(row.rowId) ? { ...row, attachedCount: counts.get(row.rowId) as number } : row,
    );
    const mutantPath = writeFixture(mutant);

    // Rule 9: the band executed — from the written bytes, the reference convention fails it
    // and the max(a, b) convention would have passed it.
    const bytes = readFixtureRows(mutantPath);
    const referenceCount = mustGet(bytes, reference).attachedCount;
    const variantCount = mustGet(bytes, variant).attachedCount;
    const referenceForm = Math.abs(referenceCount - variantCount) / referenceCount;
    const maxForm = Math.abs(referenceCount - variantCount) / Math.max(referenceCount, variantCount);
    expect(referenceForm).toBeGreaterThan(ATTACHED_COUNT_TOLERANCE);
    expect(maxForm).toBeLessThanOrEqual(ATTACHED_COUNT_TOLERANCE);

    const { report } = runEval(mutantPath);
    const fine = spacingByDx(report, 0.35);
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("criterion");
    expect(spacingByDx(report, 0.7).verdict).toBe("pass");
    expect(fine.verdict).toBe("no-pass");
    expect(fine.noPassClass).toBe("criterion");
    const failing = mustFind(
      fine.domainComparisons,
      (c) => c.comparison === "n96->n112" && c.rowIdB === variant,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.relDiff).toBeCloseTo(0.00501, 10);
    expect(failing.reason).toContain("attached counts differ");
    // Exactly one comparison fails: the neighbours were kept inside tolerance.
    expect(everyComparison(report).filter((c) => c.verdict !== "pass")).toHaveLength(1);
  });

  it("no-passes 0.7 um when one habit class flips (control: class flip)", () => {
    const target = "dom-0.7-n64@-6C-f0.15-M1";
    const baseline = passingRows();
    const mutant = baseline.map((row) =>
      row.rowId === target ? { ...row, aspectRatio: 2.0 } : row,
    );
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the flip executed — the written bytes classify plate before, column after.
    expect(mustGet(readFixtureRows(passingPath), target).aspectRatio).toBeLessThanOrEqual(
      PLATE_AR_CEILING,
    );
    expect(mustGet(readFixtureRows(mutantPath), target).aspectRatio).toBeGreaterThanOrEqual(
      COLUMN_AR_FLOOR,
    );

    const { report } = runEval(mutantPath);
    expect(report.overallVerdict).toBe("no-pass");
    expect(spacingByDx(report, 0.35).verdict).toBe("pass");
    const coarse = spacingByDx(report, 0.7);
    expect(coarse.verdict).toBe("no-pass");
    expect(coarse.noPassClass).toBe("criterion");
    const failing = mustFind(
      coarse.domainComparisons,
      (c) => c.comparison === "n48->n64" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.failureClass).toBe("criterion");
    expect(failing.reason).toContain("habit class differs");
    expect(failing.classA).toBe("plate");
    expect(failing.classB).toBe("column");
  });

  it("no-passes BOTH spacings on a wall-capped auxiliary row (control: wall cap)", () => {
    const target = "aux-relaxTol1e-10@-31C-f0.6-M1";
    const baseline = passingRows();
    const mutant = baseline.map((row) =>
      row.rowId === target ? { ...row, stopReason: "wall-cap-infrastructure" } : row,
    );
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the cap executed — verified from the written bytes.
    expect(mustGet(readFixtureRows(passingPath), target).stopReason).toBe("size-target");
    expect(mustGet(readFixtureRows(mutantPath), target).stopReason).toBe(
      "wall-cap-infrastructure",
    );

    const { report } = runEval(mutantPath);
    // The plan's selection function makes every auxiliary control a conjunct of EVERY
    // spacing's pass, so a capped auxiliary row forces no-pass for both spacings while both
    // domain ladders themselves still pass. A cap is an infrastructure no-pass (review H4).
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("infrastructure");
    for (const dxUm of [0.7, 0.35]) {
      const spacing = spacingByDx(report, dxUm);
      expect(spacing.domainPass).toBe(true);
      expect(spacing.auxiliaryPass).toBe(false);
      expect(spacing.verdict).toBe("no-pass");
      expect(spacing.noPassClass).toBe("infrastructure");
    }
    const failing = mustFind(report.auxiliaryComparisons, (c) => c.rowIdB === target);
    expect(failing.verdict).toBe("no-pass");
    expect(failing.failureClass).toBe("infrastructure");
    expect(failing.reason).toContain("wall-cap-infrastructure");
  });

  it("no-passes 0.7 um when a row is missing entirely (control: missing row)", () => {
    const target = "dom-0.7-n64@-27C-f0.15-M1";
    const baseline = passingRows();
    const mutant = baseline.filter((row) => row.rowId !== target);
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the removal executed — the written bytes hold 79 rows and lack the target.
    expect(readFixtureRows(passingPath).has(target)).toBe(true);
    const mutantBytes = readFixtureRows(mutantPath);
    expect(mutantBytes.size).toBe(79);
    expect(mutantBytes.has(target)).toBe(false);

    const { report } = runEval(mutantPath);
    expect(report.presentExpectedRowCount).toBe(79);
    expect(report.missingRowIds).toEqual([target]);
    expect(report.overallVerdict).toBe("no-pass");
    expect(spacingByDx(report, 0.35).verdict).toBe("pass");
    const coarse = spacingByDx(report, 0.7);
    expect(coarse.verdict).toBe("no-pass");
    expect(coarse.noPassClass).toBe("infrastructure");
    const failing = mustFind(
      coarse.domainComparisons,
      (c) => c.comparison === "n48->n64" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.failureClass).toBe("infrastructure");
    expect(failing.reason).toContain("missing from the artifact");
  });

  it("classes a spacing with both failure kinds as mixed (review H4)", () => {
    const criterionTarget = "dom-0.7-n64@-6C-f0.15-M1";
    const infrastructureTarget = "dom-0.7-n48@-13C-f0.15-CAK";
    const mutant = passingRows().map((row) => {
      if (row.rowId === criterionTarget) return { ...row, aspectRatio: 2.0 };
      if (row.rowId === infrastructureTarget) {
        return { ...row, stopReason: "wall-cap-infrastructure" };
      }
      return row;
    });
    const mutantPath = writeFixture(mutant);

    // Rule 9: both mutations executed — verified from the written bytes.
    const bytes = readFixtureRows(mutantPath);
    expect(mustGet(bytes, criterionTarget).aspectRatio).toBeGreaterThanOrEqual(COLUMN_AR_FLOOR);
    expect(mustGet(bytes, infrastructureTarget).stopReason).toBe("wall-cap-infrastructure");

    const { report } = runEval(mutantPath);
    const coarse = spacingByDx(report, 0.7);
    expect(coarse.verdict).toBe("no-pass");
    expect(coarse.noPassClass).toBe("mixed");
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("mixed");
    expect(spacingByDx(report, 0.35).verdict).toBe("pass");
  });

  it("rejects a row whose echoed operand differs from the enumeration (review M3)", () => {
    const target = "dom-0.35-n112@-13C-f0.15-M1";
    const baseline = passingRows();
    const mutant = baseline.map((row) =>
      row.rowId === target ? { ...row, relaxTol: 1e-8 } : row,
    );
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the mutation executed — the written bytes echo 1e-8 where the frozen
    // enumeration says 1e-9.
    expect(mustGet(readFixtureRows(passingPath), target).relaxTol).toBe(1e-9);
    expect(mustGet(readFixtureRows(mutantPath), target).relaxTol).toBe(1e-8);

    const { report } = runEval(mutantPath);
    expect(report.overallVerdict).toBe("no-pass");
    expect(spacingByDx(report, 0.7).verdict).toBe("pass");
    const fine = spacingByDx(report, 0.35);
    expect(fine.verdict).toBe("no-pass");
    expect(fine.noPassClass).toBe("infrastructure");
    const failing = mustFind(
      fine.domainComparisons,
      (c) => c.comparison === "n96->n112" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.failureClass).toBe("infrastructure");
    expect(failing.reason).toContain("echoes operands that differ from the frozen enumeration");
    expect(failing.reason).toContain("relaxTol");
  });

  it("rejects a row whose echoed fixed block differs (review M4: far field)", () => {
    const target = "dom-0.7-n48@-31C-f0.6-M1";
    const baseline = passingRows();
    const mutant = baseline.map((row) =>
      row.rowId === target ? { ...row, farField: "fixed-sigma-dirichlet" } : row,
    );
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the mutation executed — the written bytes echo the banned Dirichlet shell.
    expect(mustGet(readFixtureRows(passingPath), target).farField).toBe("monopole-matched");
    expect(mustGet(readFixtureRows(mutantPath), target).farField).toBe("fixed-sigma-dirichlet");

    const { report } = runEval(mutantPath);
    expect(report.overallVerdict).toBe("no-pass");
    expect(spacingByDx(report, 0.35).verdict).toBe("pass");
    const coarse = spacingByDx(report, 0.7);
    expect(coarse.verdict).toBe("no-pass");
    expect(coarse.noPassClass).toBe("infrastructure");
    const failing = mustFind(
      coarse.domainComparisons,
      (c) => c.comparison === "n48->n64" && c.rowIdA === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.reason).toContain("farField");
    expect(failing.reason).toContain("monopole-matched");
  });

  it("rejects a row whose seedThickness breaks the isometric mapping (review M5)", () => {
    const target = "aux-seed16@-13C-f0.15-M1";
    const baseline = passingRows();
    // 2*16 + 1 = 33 is the mapped thickness; 35 is the base rung's — the plausible
    // copy-paste defect.
    const mutant = baseline.map((row) =>
      row.rowId === target ? { ...row, seedThickness: 35 } : row,
    );
    const passingPath = writeFixture(baseline);
    const mutantPath = writeFixture(mutant);

    // Rule 9: the mutation executed — the written bytes violate 2*seedRadius + 1.
    const mutatedRow = mustGet(readFixtureRows(mutantPath), target);
    expect(mustGet(readFixtureRows(passingPath), target).seedThickness).toBe(33);
    expect(mutatedRow.seedRadius).toBe(16);
    expect(mutatedRow.seedThickness).toBe(35);

    const { report } = runEval(mutantPath);
    // An auxiliary row gates BOTH spacings.
    expect(report.overallVerdict).toBe("no-pass");
    for (const dxUm of [0.7, 0.35]) {
      const spacing = spacingByDx(report, dxUm);
      expect(spacing.verdict).toBe("no-pass");
      expect(spacing.noPassClass).toBe("infrastructure");
    }
    const failing = mustFind(report.auxiliaryComparisons, (c) => c.rowIdB === target);
    expect(failing.verdict).toBe("no-pass");
    expect(failing.failureClass).toBe("infrastructure");
    expect(failing.reason).toContain("seedThickness");
  });

  it("forces no-pass on an unexpected rowId even when every comparison passes (review M6)", () => {
    const baseline = passingRows();
    const stray = {
      ...baseline[47], // a fully well-formed row...
      rowId: "dom-0.35-n144@-13C-f0.15-M1", // ...the frozen enumeration does not contain
    };
    const mutantPath = writeFixture([...baseline, stray]);

    // Rule 9: the mutation executed — the written bytes hold 81 rows including the stray.
    const bytes = readFixtureRows(mutantPath);
    expect(bytes.size).toBe(81);
    expect(bytes.has(stray.rowId)).toBe(true);

    const { report } = runEval(mutantPath);
    expect(report.unexpectedRowIds).toEqual([stray.rowId]);
    // Every registered comparison still passes — the no-pass is FORCED, not incidental.
    for (const comparison of everyComparison(report)) {
      expect(comparison.verdict).toBe("pass");
    }
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("infrastructure");
    for (const spacing of report.spacings) {
      expect(spacing.verdict).toBe("no-pass");
      expect(spacing.noPassClass).toBe("infrastructure");
      expect(spacing.reasons.join("\n")).toContain("unexpected rowIds force no-pass");
      expect(spacing.reasons.join("\n")).toContain(stray.rowId);
    }
  });

  it("forces no-pass on a truncated partial line even when every comparison passes (review M7)", () => {
    const rowsPath = writeFixture(passingRows());
    appendFileSync(rowsPath, '{"rowId":"dom-0.7-n48@-31C-f0.6-M1","tempC":-31,"frac');

    // Rule 9: the mutation executed — the written bytes end mid-line, unparseable.
    const raw = readFileSync(rowsPath, "utf8");
    expect(raw.endsWith("\n")).toBe(false);
    const lastLine = raw.slice(raw.lastIndexOf("\n") + 1);
    expect(() => JSON.parse(lastLine)).toThrow();

    const { report } = runEval(rowsPath);
    expect(report.presentExpectedRowCount).toBe(80);
    expect(report.artifactDefects.join("\n")).toContain("truncated partial append");
    expect(report.artifactDefects.join("\n")).toContain("not parseable JSON");
    // Every registered comparison still passes — the no-pass is FORCED by the defect.
    for (const comparison of everyComparison(report)) {
      expect(comparison.verdict).toBe("pass");
    }
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("infrastructure");
    for (const spacing of report.spacings) {
      expect(spacing.verdict).toBe("no-pass");
      expect(spacing.reasons.join("\n")).toContain("artifact defects force no-pass");
    }
  });

  it("enforces the sanctioned two-phase head shape (review M10, amended 2026-08-09)", () => {
    const LADDER_FREEZE_HEAD = "f59d18702301155c0c2e7eaecc3442e6cf117123";
    const heavy = (rowId: string) => /^dom-0.35-n(112|128)@/.test(rowId);

    // Sanctioned: pre-amendment rows at the freeze-era head, heavy rows at the amendment head.
    const sanctioned = passingRows().map((row) => ({
      ...row,
      gitHead: heavy(row.rowId) ? FIXTURE_GIT_HEAD : LADDER_FREEZE_HEAD,
    }));
    const sanctionedPath = writeFixture(sanctioned);
    const writtenHeads = new Set(
      [...readFixtureRows(sanctionedPath).values()].map((r) => r.gitHead),
    );
    expect(writtenHeads.size).toBe(2); // Rule 9: the mixture executed
    const sanctionedRun = runEval(sanctionedPath);
    expect(sanctionedRun.report.overallVerdict).toBe("pass");
    expect(sanctionedRun.report.amendmentHead).toBe(FIXTURE_GIT_HEAD);

    // Violation 1: a heavy row at the freeze-era head — no N=112/128 row ran pre-amendment.
    const heavyAtFreeze = sanctioned.map((row) =>
      row.rowId === "dom-0.35-n128@-6C-f0.15-M1" ? { ...row, gitHead: LADDER_FREEZE_HEAD } : row,
    );
    const heavyPath = writeFixture(heavyAtFreeze);
    expect(readFixtureRows(heavyPath).get("dom-0.35-n128@-6C-f0.15-M1")?.gitHead).toBe(
      LADDER_FREEZE_HEAD,
    );
    const heavyRun = runEval(heavyPath);
    expect(heavyRun.report.overallVerdict).toBe("no-pass");
    expect(heavyRun.report.overallNoPassClass).toBe("infrastructure");
    expect(heavyRun.report.artifactDefects.join(String.fromCharCode(10))).toContain("not sanctioned");

    // Violation 2: a THIRD distinct head — outside the sanctioned pair.
    const threeHeads = sanctioned.map((row) =>
      row.rowId === "aux-seed18@-27C-f0.15-CAK" ? { ...row, gitHead: OTHER_GIT_HEAD } : row,
    );
    const threePath = writeFixture(threeHeads);
    expect(
      new Set([...readFixtureRows(threePath).values()].map((r) => r.gitHead)).size,
    ).toBe(3);
    const threeRun = runEval(threePath);
    expect(threeRun.report.overallVerdict).toBe("no-pass");
    expect(threeRun.report.artifactDefects.join(String.fromCharCode(10))).toContain(
      "more than one non-freeze gitHead",
    );
  });

  it("forces no-pass on a duplicated rowId with conflicting values (review M11)", () => {
    const target = "dom-0.35-n96@-27C-f0.15-CAK";
    const baseline = passingRows();
    const original = baseline.find((row) => row.rowId === target);
    if (original === undefined) throw new Error(`fixture lost ${target}`);
    const rowsPath = writeFixture(baseline);
    appendFileSync(
      rowsPath,
      `${JSON.stringify({ ...original, attachedCount: original.attachedCount + 777 })}\n`,
    );

    // Rule 9: the mutation executed — the written bytes hold the rowId twice with
    // conflicting attached counts.
    const rawLines = readFileSync(rowsPath, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as FixtureRow)
      .filter((row) => row.rowId === target);
    expect(rawLines).toHaveLength(2);
    expect(rawLines[0].attachedCount).not.toBe(rawLines[1].attachedCount);

    const { report } = runEval(rowsPath);
    expect(report.artifactDefects.join("\n")).toContain(`rowId ${target} appears more than once`);
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("infrastructure");
    for (const spacing of report.spacings) {
      expect(spacing.verdict).toBe("no-pass");
      expect(spacing.reasons.join("\n")).toContain("artifact defects force no-pass");
    }
    // The ambiguous row is also gated out of its own comparisons by name.
    const gated = mustFind(
      spacingByDx(report, 0.35).domainComparisons,
      (c) => c.rowIdA === target || c.rowIdB === target,
    );
    expect(gated.verdict).toBe("no-pass");
    expect(gated.reason).toContain("duplicated in the artifact");
  });
});
