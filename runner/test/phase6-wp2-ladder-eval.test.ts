// Phase 6 WP2 ladder evaluator — focused tests on synthetic fixtures.
//
// The evaluator (app/scripts/phase6-wp2-ladder-eval.mjs) is run AS A CHILD PROCESS on fixtures
// written to the OS temp dir, exactly as it runs on the real artifact. Rule 9 discipline: every
// negative control asserts its named mutation actually executed, verified from the WRITTEN
// fixture bytes rather than from the code that made the mutation; and the fully-passing fixture
// is generated from the DISPATCHER's `--enumerate` output, so a zero-missing-rows pass also
// proves the dispatcher's enumeration and the evaluator's independent transcription agree.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const EVAL_SCRIPT = join(REPOSITORY_ROOT, "app", "scripts", "phase6-wp2-ladder-eval.mjs");
const RUN_SCRIPT = join(REPOSITORY_ROOT, "app", "scripts", "phase6-wp2-ladder-run.mjs");

// Registered habit thresholds, restated for the byte-level mutation checks (source:
// runner/src/phase6-protocol.ts freeze item "metric-thresholds").
const PLATE_AR_CEILING = 1 / 1.5;
const COLUMN_AR_FLOOR = 1.5;
const ATTACHED_COUNT_TOLERANCE = 0.005;

interface FixtureRow {
  rowId: string;
  tempC: number;
  fraction: number;
  paramSet: string;
  stopReason: string;
  attachedCount: number;
  aspectRatio: number;
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
  reason: string;
}

interface LadderSpacing {
  dxUm: number;
  domainComparisons: LadderComparison[];
  domainPass: boolean;
  auxiliaryPass: boolean;
  verdict: string;
  reasons: string[];
}

interface LadderReport {
  expectedRowCount: number;
  presentExpectedRowCount: number;
  missingRowIds: string[];
  unexpectedRowIds: string[];
  artifactDefects: string[];
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
 *  that the 0.6% mutation control exceeds the tolerance against any jittered partner
 *  (worst case 56/10064 = 0.556%). */
function passingRows(): FixtureRow[] {
  return enumeratedRowIds().map((rowId) => {
    const match = /@(-?\d+)C-f([0-9.]+)-(M1|CAK)$/.exec(rowId);
    if (match === null) throw new Error(`unparseable rowId in enumeration: ${rowId}`);
    const tempC = Number(match[1]);
    const plate = tempC === -31 || tempC === -6;
    const hash = fnv1a(rowId);
    return {
      rowId,
      tempC,
      fraction: Number(match[2]),
      paramSet: match[3] as string,
      stopReason: "size-target",
      attachedCount: 10_000 + (hash % 5),
      aspectRatio: plate ? 0.5 + (hash % 40) * 0.002 : 2 + (hash % 40) * 0.005,
    };
  });
}

function writeFixture(rows: readonly FixtureRow[]): string {
  const dir = mkdtempSync(join(tmpdir(), "phase6-wp2-ladder-eval-"));
  temporaryDirectories.push(dir);
  const path = join(dir, "rows.jsonl");
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

function runEval(rowsPath: string): LadderReport {
  const result = spawnSync(process.execPath, [EVAL_SCRIPT, "--rows", rowsPath], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
  // Exit 0 always — the verdict is data, not an error.
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout) as LadderReport;
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
  });
});

describe("Phase 6 WP2 ladder evaluator", () => {
  it("passes both spacings on a fully passing synthetic artifact", () => {
    const report = runEval(writeFixture(passingRows()));
    expect(report.expectedRowCount).toBe(80);
    expect(report.presentExpectedRowCount).toBe(80);
    // Zero missing rows on a fixture generated from the dispatcher's enumeration proves the
    // evaluator's independent transcription and the dispatcher agree on all 80 rowIds.
    expect(report.missingRowIds).toEqual([]);
    expect(report.unexpectedRowIds).toEqual([]);
    expect(report.artifactDefects).toEqual([]);
    expect(report.spacings.map((spacing) => spacing.dxUm)).toEqual([0.7, 0.35]);
    expect(report.auxiliaryComparisons).toHaveLength(32);
    for (const spacing of report.spacings) {
      expect(spacing.domainComparisons).toHaveLength(16);
      expect(spacing.domainPass).toBe(true);
      expect(spacing.auxiliaryPass).toBe(true);
      expect(spacing.verdict).toBe("pass");
      expect(spacing.reasons).toEqual([]);
    }
    for (const comparison of [
      ...report.auxiliaryComparisons,
      ...report.spacings.flatMap((spacing) => spacing.domainComparisons),
    ]) {
      expect(comparison.verdict).toBe("pass");
    }
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

    // Rule 9: the mutation executed — recomputed from the written bytes of both fixtures.
    const passingBytes = readFixtureRows(passingPath);
    const mutantBytes = readFixtureRows(mutantPath);
    const neighbour = "dom-0.35-n96@-13C-f0.15-CAK";
    const relDiff = (rows: Map<string, FixtureRow>): number => {
      const a = mustGet(rows, neighbour).attachedCount;
      const b = mustGet(rows, target).attachedCount;
      return Math.abs(a - b) / Math.max(a, b);
    };
    expect(relDiff(passingBytes)).toBeLessThanOrEqual(ATTACHED_COUNT_TOLERANCE);
    expect(relDiff(mutantBytes)).toBeGreaterThan(ATTACHED_COUNT_TOLERANCE);

    const report = runEval(mutantPath);
    const fine = spacingByDx(report, 0.35);
    const coarse = spacingByDx(report, 0.7);
    expect(fine.verdict).toBe("no-pass");
    expect(coarse.verdict).toBe("pass");
    const failing = mustFind(
      fine.domainComparisons,
      (c) => c.comparison === "n96->n112" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.reason).toContain("attached counts differ");
    expect(failing.attachedB).toBe(mustGet(mutantBytes, target).attachedCount);
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

    const report = runEval(mutantPath);
    expect(spacingByDx(report, 0.35).verdict).toBe("pass");
    const coarse = spacingByDx(report, 0.7);
    expect(coarse.verdict).toBe("no-pass");
    const failing = mustFind(
      coarse.domainComparisons,
      (c) => c.comparison === "n48->n64" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
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

    const report = runEval(mutantPath);
    // The plan's selection function makes every auxiliary control a conjunct of EVERY
    // spacing's pass, so a capped auxiliary row forces no-pass for both spacings while both
    // domain ladders themselves still pass.
    for (const dxUm of [0.7, 0.35]) {
      const spacing = spacingByDx(report, dxUm);
      expect(spacing.domainPass).toBe(true);
      expect(spacing.auxiliaryPass).toBe(false);
      expect(spacing.verdict).toBe("no-pass");
    }
    const failing = mustFind(report.auxiliaryComparisons, (c) => c.rowIdB === target);
    expect(failing.verdict).toBe("no-pass");
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

    const report = runEval(mutantPath);
    expect(report.presentExpectedRowCount).toBe(79);
    expect(report.missingRowIds).toEqual([target]);
    expect(spacingByDx(report, 0.35).verdict).toBe("pass");
    const coarse = spacingByDx(report, 0.7);
    expect(coarse.verdict).toBe("no-pass");
    const failing = mustFind(
      coarse.domainComparisons,
      (c) => c.comparison === "n48->n64" && c.rowIdB === target,
    );
    expect(failing.verdict).toBe("no-pass");
    expect(failing.reason).toContain("missing from the artifact");
  });
});
