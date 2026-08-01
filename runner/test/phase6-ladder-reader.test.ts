import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

type LadderRow = {
  pointId: string;
  rungId: string;
  dimsN: number;
  aspectRatio: number;
  [key: string]: unknown;
};

const repositoryRoot = process.cwd();
const readerPath = join(repositoryRoot, "app", "scripts", "phase6-ladder-read.mjs");
const evidencePath = join(repositoryRoot, "evidence", "phase6-columns-ladder", "ladder.json");

function runReader(path: string) {
  return spawnSync(process.execPath, [readerPath, "--ladder", path], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

function originalRows(): LadderRow[] {
  return JSON.parse(readFileSync(evidencePath, "utf8")) as LadderRow[];
}

describe("the Phase 6 columns-ladder reader", () => {
  it("reads only the exact registered A/B/C cohort and detects the P1 B-to-C fall", () => {
    const result = runReader(evidencePath);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("historical diagnostic only; not R15 and not Phase 6 gate evidence");
    expect(result.stdout).toContain("12 of 12 registered rungs present and valid; 6 later diagnostic rows kept separate");
    expect(result.stdout).toContain("B -> C: ΔAR -0.00458");
    expect(result.stdout).toContain("DECISIVE REGISTERED RESULT: P1 is OUTCOME 4 (non-monotone)");
  });

  it("fails closed when a registered key is missing, duplicated, shifted, or the deciding fall is removed", () => {
    const directory = mkdtempSync(join(tmpdir(), "phase6-ladder-reader-"));
    try {
      const cases: Array<{
        name: string;
        mutate: (rows: LadderRow[]) => void;
        verify: (rows: LadderRow[]) => void;
        expectedError: string;
      }> = [
        {
          name: "missing-P1-C",
          mutate: (rows) => {
            const index = rows.findIndex((row) => row.pointId === "P1" && row.rungId === "C");
            expect(index).toBeGreaterThanOrEqual(0);
            rows.splice(index, 1);
          },
          verify: (rows) => expect(rows.some((row) => row.pointId === "P1" && row.rungId === "C")).toBe(false),
          expectedError: "expected 12 unique registered rows, found 11",
        },
        {
          name: "duplicate-P1-C",
          mutate: (rows) => {
            const row = rows.find((candidate) => candidate.pointId === "P1" && candidate.rungId === "C");
            expect(row).toBeDefined();
            rows.push(structuredClone(row!));
          },
          verify: (rows) => expect(rows.filter((row) => row.pointId === "P1" && row.rungId === "C")).toHaveLength(2),
          expectedError: "duplicate registered key P1-C",
        },
        {
          name: "shifted-P1-C-grid",
          mutate: (rows) => {
            const row = rows.find((candidate) => candidate.pointId === "P1" && candidate.rungId === "C");
            expect(row).toBeDefined();
            row!.dimsN = 79;
            (row!.header as { dimsN: number }).dimsN = 79;
          },
          verify: (rows) => expect(rows.find((row) => row.pointId === "P1" && row.rungId === "C")?.dimsN).toBe(79),
          expectedError: "P1-C.dimsN: expected 80, got 79",
        },
        {
          name: "removed-B-to-C-fall",
          mutate: (rows) => {
            const row = rows.find((candidate) => candidate.pointId === "P1" && candidate.rungId === "C");
            expect(row).toBeDefined();
            row!.aspectRatio = 1.6;
            row!.line = String(row!.line).replace("AR=1.52174", "AR=1.60000");
          },
          verify: (rows) => expect(rows.find((row) => row.pointId === "P1" && row.rungId === "C")?.aspectRatio).toBe(1.6),
          expectedError: "P1 must evaluate to registered outcome 4",
        },
      ];

      for (const testCase of cases) {
        const rows = originalRows();
        testCase.mutate(rows);
        testCase.verify(rows);
        const path = join(directory, `${testCase.name}.json`);
        writeFileSync(path, `${JSON.stringify(rows)}\n`, "utf8");
        const result = runReader(path);
        expect(result.status, testCase.name).not.toBe(0);
        expect(result.stderr, testCase.name).toContain(testCase.expectedError);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("fails closed when a later domain-comparison row is numerically invalid or reaches contact", () => {
    const directory = mkdtempSync(join(tmpdir(), "phase6-ladder-validity-"));
    try {
      const cases: Array<{
        name: string;
        mutate: (row: LadderRow) => void;
        expectedError: string;
      }> = [
        {
          name: "unconverged-extra",
          mutate: (row) => { row.allConverged = false; },
          expectedError: "P1-B80.allConverged: expected true, got false",
        },
        {
          name: "contact-extra",
          mutate: (row) => { row.extent = 53; },
          expectedError: "P1-B80 reaches the domain-contact guard",
        },
        {
          name: "uncorroborated-ar-extra",
          mutate: (row) => { row.aspectRatio = 2; },
          expectedError: "P1-B80.line does not corroborate AR=2.00000",
        },
        {
          name: "shifted-identity-extra",
          mutate: (row) => {
            row.paramSet = "CAK";
            (row.header as { paramSet: string }).paramSet = "CAK";
          },
          expectedError: "P1-B80.paramSet: expected M1, got CAK",
        },
      ];
      for (const testCase of cases) {
        const rows = originalRows();
        const row = rows.find((candidate) => candidate.pointId === "P1" && candidate.rungId === "B80");
        expect(row).toBeDefined();
        testCase.mutate(row!);
        const path = join(directory, `${testCase.name}.json`);
        writeFileSync(path, `${JSON.stringify(rows)}\n`, "utf8");
        const result = runReader(path);
        expect(result.status, testCase.name).not.toBe(0);
        expect(result.stderr, testCase.name).toContain(testCase.expectedError);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
