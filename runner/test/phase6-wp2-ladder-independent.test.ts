import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Suite-pins the WP2 non-author review's independent verifier (2026-08-20): the script was
// authored firewalled from the ladder evaluator and must keep re-deriving the published
// NO-PASS verdict from the published bytes alone, and its Rule 9 mutation controls must keep
// firing. If the published artifact or the verifier drifts, this test fails.
const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SCRIPT = resolve(REPO, "app", "scripts", "phase6-wp2-ladder-independent.mjs");
const ROWS = resolve(REPO, "evidence", "phase6-wp2-ladder", "rows.jsonl");

interface Verdict {
  readonly perSpacing: readonly {
    readonly spacing: string;
    readonly verdict: string;
    readonly domainPass: number;
    readonly domainTotal: number;
    readonly auxPass: number;
    readonly auxTotal: number;
    readonly failedComparisons: readonly string[];
  }[];
  readonly overall: string;
  readonly artifactChecks: {
    readonly missing: readonly string[];
    readonly extraneous: readonly string[];
    readonly duplicates: readonly string[];
    readonly headDefects: readonly string[];
  };
}

function run(rowsPath?: string): Verdict {
  const args = rowsPath === undefined ? [SCRIPT] : [SCRIPT, rowsPath];
  return JSON.parse(execFileSync("node", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })) as Verdict;
}

function mutateRows(mutate: (rows: Record<string, unknown>[]) => void): string {
  const rows = readFileSync(ROWS, "utf8").trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
  mutate(rows);
  const path = join(mkdtempSync(join(tmpdir(), "wp2-independent-")), "rows.jsonl");
  writeFileSync(path, `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`);
  return path;
}

describe("Phase 6 WP2 independent ladder verifier (non-author review, 2026-08-20)", () => {
  it("re-derives the published NO-PASS verdict from the published bytes", () => {
    const verdict = run();
    expect(verdict.overall).toBe("no-pass");
    expect(verdict.artifactChecks).toEqual({ missing: [], extraneous: [], duplicates: [], headDefects: [] });
    const coarse = verdict.perSpacing.find((s) => s.spacing === "0.7 um");
    const fine = verdict.perSpacing.find((s) => s.spacing === "0.35 um");
    expect(coarse).toMatchObject({ verdict: "no-pass", domainPass: 11, domainTotal: 16, auxPass: 15, auxTotal: 32 });
    expect(fine).toMatchObject({ verdict: "no-pass", domainPass: 10, domainTotal: 16, auxPass: 15, auxTotal: 32 });
    expect(coarse?.failedComparisons).toHaveLength(22);
    expect(fine?.failedComparisons).toHaveLength(23);
    // The cross-compared extremes: worst domain, worst overall, and both near-boundary failures.
    expect(coarse?.failedComparisons).toContain("48→64 @ -31C f0.6 CAK: 4.782% (8281 vs 8677)");
    expect(fine?.failedComparisons).toContain("seed16 @ -27C f0.15 CAK: 9.285% (64813 vs 58795)");
    expect(fine?.failedComparisons).toContain("seed18 @ -27C f0.15 CAK: 0.506% (64813 vs 64485)");
    expect(fine?.failedComparisons).toContain("112→128 @ -31C f0.6 M1: 0.524% (77873 vs 78281)");
  });

  it("agrees with the published report's failing-comparison set exactly", () => {
    const verdict = run();
    const report = JSON.parse(readFileSync(resolve(REPO, "evidence", "phase6-wp2-ladder", "report.json"), "utf8")) as {
      readonly overallVerdict: string;
      readonly overallNoPassClass: string;
      readonly spacings: readonly { readonly domainComparisons: readonly { readonly verdict: string }[] }[];
      readonly auxiliaryComparisons: readonly { readonly verdict: string }[];
    };
    expect(report.overallVerdict).toBe("no-pass");
    expect(report.overallNoPassClass).toBe("criterion");
    const reportDomainFails = report.spacings.map(
      (s) => s.domainComparisons.filter((c) => c.verdict !== "pass").length,
    );
    expect(reportDomainFails).toEqual([16 - 11, 16 - 10]);
    expect(report.auxiliaryComparisons.filter((c) => c.verdict !== "pass")).toHaveLength(32 - 15);
  });

  it("catches a 0.6% count flip on a passing comparison and tolerates 0.4% (Rule 9 M1/M2)", () => {
    const target = "dom-0.35-n128@-27C-f0.15-CAK";
    const flip = mutateRows((rows) => {
      const row = rows.find((r) => r.rowId === target);
      if (row === undefined) throw new Error("target row absent");
      row.attachedCount = Math.round((row.attachedCount as number) * 1.006);
    });
    const flipped = run(flip);
    expect(flipped.perSpacing.find((s) => s.spacing === "0.35 um")?.domainPass).toBe(9);

    const within = mutateRows((rows) => {
      const row = rows.find((r) => r.rowId === target);
      if (row === undefined) throw new Error("target row absent");
      row.attachedCount = Math.round((row.attachedCount as number) * 0.996);
    });
    expect(run(within).perSpacing.find((s) => s.spacing === "0.35 um")?.domainPass).toBe(10);
  });

  it("flags a missing row, an unsanctioned head, and a habit-class flip (Rule 9 M3/M4/M6)", () => {
    const target = "dom-0.35-n128@-27C-f0.15-CAK";
    const missing = run(mutateRows((rows) => {
      rows.splice(rows.findIndex((r) => r.rowId === target), 1);
    }));
    expect(missing.artifactChecks.missing).toEqual([target]);

    const foreignHead = run(mutateRows((rows) => {
      const row = rows.find((r) => r.rowId === target);
      if (row === undefined) throw new Error("target row absent");
      row.gitHead = "151d6791a32154bb3e5d71608e6625d53f9ca1d4";
    }));
    expect(foreignHead.artifactChecks.headDefects).toHaveLength(1);

    const classFlip = run(mutateRows((rows) => {
      const row = rows.find((r) => r.rowId === target);
      if (row === undefined) throw new Error("target row absent");
      row.aspectRatio = 1.5121951219512195;
    }));
    const fine = classFlip.perSpacing.find((s) => s.spacing === "0.35 um");
    expect(fine?.domainPass).toBe(9);
    expect(fine?.failedComparisons.some((f) => f.includes("class neutral vs column"))).toBe(true);
  });
});
