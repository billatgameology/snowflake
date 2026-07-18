// Phase 4 aggregate gate acceptance tests: exit semantics, fail-closed report writing, and
// verdict/publication consistency. Pass outcomes are injected through the documented seams;
// the hours-scale real passes are never launched.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "../src/gate4-evidence.ts";
import {
  A_EXECUTION_CRITERIA,
  A_MORPHOLOGY_CRITERIA,
  B_EXECUTION_CRITERIA,
  B_MORPHOLOGY_CRITERIA,
  createPhase4CriterionRecord,
  evaluateGate4A,
  evaluateGate4B,
  type Phase4CriterionName,
  type Phase4CriterionRecord,
} from "../src/gate4-protocol.ts";
import {
  GATE4A_NODE,
  GATE4A_PROTOCOL,
  GATE4A_V8,
  buildGate4AManifest,
  type Gate4ARunOutcome,
} from "../src/gate4a.ts";
import {
  GATE4B_PROTOCOL,
  buildGate4BManifest,
  type Gate4BRunOutcome,
} from "../src/gate4b.ts";
import {
  GATE4_PROTOCOL,
  formatGate4TerminalPresentation,
  runGate4,
  type Gate4AggregateOutcome,
} from "../src/gate4-aggregate.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const main = join(repoRoot, "runner", "src", "main.ts");

beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

const temporaryDirectories: string[] = [];
afterAll(() => {
  while (temporaryDirectories.length > 0) {
    rmSync(temporaryDirectories.pop() as string, { recursive: true, force: true });
  }
});

function temporaryReportPath(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-gate4-"));
  temporaryDirectories.push(directory);
  return join(directory, "gate4-report.json");
}

function passingProvenance() {
  return {
    node: GATE4A_NODE,
    v8: GATE4A_V8,
    head: "a".repeat(40),
    trackedStatus: "",
    criteriaFreezeIsAncestor: true,
    runnerFreezeIsAncestor: true,
    cadenceFreezeIsAncestor: true,
    v2CriteriaFreezeIsAncestor: true,
  };
}

function records<N extends Phase4CriterionName>(
  names: readonly N[],
  failing: readonly Phase4CriterionName[] = [],
): Phase4CriterionRecord<N>[] {
  return names.map((name) => createPhase4CriterionRecord(
    name,
    !failing.includes(name),
    failing.includes(name) ? "synthetic failure" : "synthetic pass",
  ));
}

function syntheticPublication(
  directory: string,
  identity: { readonly protocol: string; readonly pass: "A" | "B"; readonly operator: string; readonly payloadVersion: number },
) {
  const reportBytes = new TextEncoder().encode("{}\n");
  const descriptor = {
    path: "report.json",
    kind: "phase4-evidence-report+json",
    byteLength: reportBytes.byteLength,
    sha256: sha256Bytes(reportBytes),
  };
  return {
    directory,
    report: {
      version: 1 as const,
      protocol: identity.protocol,
      pass: identity.pass,
      operator: identity.operator,
      artifacts: [],
      payload: strictJsonSnapshot({ version: identity.payloadVersion }),
    },
    index: {
      version: 1 as const,
      publication: "complete" as const,
      report: descriptor,
      artifacts: [descriptor],
    },
  };
}

function passAOutcome(failing: readonly Phase4CriterionName[] = []): Gate4ARunOutcome {
  const recordsA = records([...A_EXECUTION_CRITERIA, ...A_MORPHOLOGY_CRITERIA], failing);
  const verdict = evaluateGate4A(recordsA);
  return {
    manifest: buildGate4AManifest(),
    provenance: passingProvenance(),
    sourceHashes: { gg: "0".repeat(64), lk: "0".repeat(64) },
    results: [],
    records: recordsA,
    verdict,
    artifacts: [],
    publication: verdict.gatePass ? (syntheticPublication("/synthetic/pass-a", {
      protocol: GATE4A_PROTOCOL,
      pass: "A",
      operator: "GGThreshold",
      payloadVersion: 2,
    }) as never) : null,
  };
}

function passBOutcome(failing: readonly Phase4CriterionName[] = []): Gate4BRunOutcome {
  const recordsB = records([...B_EXECUTION_CRITERIA, ...B_MORPHOLOGY_CRITERIA], failing);
  const verdict = evaluateGate4B(recordsB);
  return {
    manifest: buildGate4BManifest(),
    provenance: (({ v2CriteriaFreezeIsAncestor: _omitted, ...passB }) => passB)(passingProvenance()),
    results: [],
    records: recordsB,
    verdict,
    artifacts: [],
    publication: verdict.executionValid ? (syntheticPublication("/synthetic/pass-b", {
      protocol: GATE4B_PROTOCOL,
      pass: "B",
      operator: "LibbrechtKinetics",
      payloadVersion: 1,
    }) as never) : null,
  };
}

describe("gate4 CLI is flagless and fail-closed", () => {
  it("rejects every supplied flag with exit 2 before starting evidence work", () => {
    const result = spawnSync(process.execPath, [main, "gate4", "--anything"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("gate4 takes no flags");
  });
});

describe("gate4 aggregate exit semantics", () => {
  it("fails closed on an existing aggregate report before either pass runs", () => {
    const reportPath = temporaryReportPath();
    writeFileSync(reportPath, "occupied\n");
    let passARuns = 0;
    let passBRuns = 0;
    expect(() => runGate4({
      repoRoot,
      reportPath,
      runPassA: () => {
        passARuns++;
        return passAOutcome();
      },
      runPassB: () => {
        passBRuns++;
        return passBOutcome();
      },
    })).toThrow(/GATE4: aggregate report already exists/);
    expect(passARuns).toBe(0);
    expect(passBRuns).toBe(0);
  });

  it("a failed Pass A exits 1 by name and never starts Pass B or writes a report", () => {
    const reportPath = temporaryReportPath();
    let passBRuns = 0;
    expect(() => runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(["A-EXEC-MASS"]),
      runPassB: () => {
        passBRuns++;
        return passBOutcome();
      },
    })).toThrow(/GATE4: Pass A failed \(A-EXEC-MASS\); Pass B was not started/);
    expect(passBRuns).toBe(0);
    expect(existsSync(reportPath)).toBe(false);
  });

  it("a Pass B execution failure exits 1 and writes no aggregate report", () => {
    const reportPath = temporaryReportPath();
    const outcome = runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(["B-EXEC-LEDGER"]),
    });
    expect(outcome.verdict.gatePass).toBe(false);
    expect(outcome.verdict.exitCode).toBe(1);
    expect(outcome.reportPath).toBeNull();
    expect(outcome.reportSha256).toBeNull();
    expect(existsSync(reportPath)).toBe(false);
    const presentation = formatGate4TerminalPresentation(outcome);
    expect(presentation.exitCode).toBe(1);
    expect(presentation.stderrLines.join("\n")).toContain("B: B-EXEC-LEDGER");
    expect(presentation.stderrLines.at(-1)).toBe("GATE4 EXIT STATUS: 1");
  });

  it("a Pass B morphology-only miss exits 0 and records the diagnostic negative", () => {
    const reportPath = temporaryReportPath();
    const outcome = runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(["B-HOLLOW", "B-TIMELINE"]),
    });
    expect(outcome.verdict.gatePass).toBe(true);
    expect(outcome.verdict.exitCode).toBe(0);
    expect(outcome.verdict.passBDiagnosticPass).toBe(false);
    expect(outcome.verdict.passBDiagnosticFailures).toEqual(["B-HOLLOW", "B-TIMELINE"]);
    expect(outcome.reportPath).toBe(reportPath);
    const bytes = new Uint8Array(readFileSync(reportPath));
    expect(sha256Bytes(bytes)).toBe(outcome.reportSha256);
    const report = parseCanonicalJson(bytes, "aggregate report") as {
      readonly aggregate: { readonly passBDiagnosticFailures: readonly string[] };
    };
    expect(report.aggregate.passBDiagnosticFailures).toEqual(["B-HOLLOW", "B-TIMELINE"]);
    const presentation = formatGate4TerminalPresentation(outcome);
    expect(presentation.exitCode).toBe(0);
    expect(presentation.stdoutLines.join("\n")).toContain('"diagnosticPass":false');
    expect(presentation.stdoutLines.at(-1)).toBe("GATE4 EXIT STATUS: 0");
  });

  it("a fully green aggregate writes a verified cross-linked report and exits 0", () => {
    const reportPath = temporaryReportPath();
    const outcome = runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(),
    });
    expect(outcome.verdict.gatePass).toBe(true);
    expect(outcome.reportPath).toBe(reportPath);
    const bytes = new Uint8Array(readFileSync(reportPath));
    expect(sha256Bytes(bytes)).toBe(outcome.reportSha256);
    const report = parseCanonicalJson(bytes, "aggregate report") as {
      readonly version: number;
      readonly protocol: string;
      readonly passA: {
        readonly protocol: string;
        readonly manifestVersion: number;
        readonly publication: { readonly directory: string; readonly report: StrictJson };
        readonly verdict: { readonly gatePass: boolean };
        readonly records: readonly unknown[];
      };
      readonly passB: {
        readonly protocol: string;
        readonly manifestVersion: number;
        readonly publication: { readonly directory: string };
        readonly verdict: { readonly executionValid: boolean };
        readonly records: readonly unknown[];
      };
      readonly aggregate: { readonly gatePass: boolean; readonly exitCode: number };
    };
    expect(report.version).toBe(2);
    expect(report.protocol).toBe(GATE4_PROTOCOL);
    expect(report.passA).toMatchObject({ protocol: GATE4A_PROTOCOL, manifestVersion: 2 });
    expect(report.passB).toMatchObject({ protocol: GATE4B_PROTOCOL, manifestVersion: 1 });
    expect(report.passA.publication.directory).toBe("/synthetic/pass-a");
    expect(report.passB.publication.directory).toBe("/synthetic/pass-b");
    expect(report.passA.verdict.gatePass).toBe(true);
    expect(report.passB.verdict.executionValid).toBe(true);
    expect(report.passA.records).toHaveLength(
      A_EXECUTION_CRITERIA.length + A_MORPHOLOGY_CRITERIA.length,
    );
    expect(report.passB.records).toHaveLength(
      B_EXECUTION_CRITERIA.length + B_MORPHOLOGY_CRITERIA.length,
    );
    expect(report.aggregate).toMatchObject({ gatePass: true, exitCode: 0 });
  });

  it("refuses a second aggregate execution against the written report", () => {
    const reportPath = temporaryReportPath();
    runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(),
    });
    expect(() => runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(),
    })).toThrow(/GATE4: aggregate report already exists/);
  });
});

describe("gate4 forged-outcome guards", () => {
  it("rejects Pass-A v1 manifest, report, and payload identities", () => {
    const valid = passAOutcome();
    for (const forged of [
      { ...valid, manifest: { ...valid.manifest, version: 1, protocol: "phase4-pass-a-v1" } },
      {
        ...valid,
        publication: {
          ...valid.publication,
          report: { ...(valid.publication as NonNullable<typeof valid.publication>).report, protocol: "phase4-pass-a-v1" },
        },
      },
      {
        ...valid,
        publication: {
          ...valid.publication,
          report: {
            ...(valid.publication as NonNullable<typeof valid.publication>).report,
            payload: strictJsonSnapshot({ version: 1 }),
          },
        },
      },
    ] as const) {
      expect(() => runGate4({
        repoRoot,
        reportPath: temporaryReportPath(),
        runPassA: () => forged as Gate4ARunOutcome,
        runPassB: () => passBOutcome(),
      })).toThrow(/Pass A (manifest|publication) identity/);
    }
  });

  it("rejects v2 ancestry leakage into Pass-B provenance", () => {
    const valid = passBOutcome();
    const forged = {
      ...valid,
      provenance: { ...valid.provenance, v2CriteriaFreezeIsAncestor: true },
    } as Gate4BRunOutcome;
    expect(() => runGate4({
      repoRoot,
      reportPath: temporaryReportPath(),
      runPassA: () => passAOutcome(),
      runPassB: () => forged,
    })).toThrow(/Pass B provenance identity failed/);
  });

  it("rejects a Pass A outcome whose verdict does not match its own records", () => {
    const forged = passAOutcome(["A-EXEC-MASS"]);
    const outcome: Gate4ARunOutcome = {
      ...forged,
      verdict: { ...forged.verdict, gatePass: true, exitCode: 0, blockingFailures: [] },
      publication: syntheticPublication("/synthetic/pass-a", {
        protocol: GATE4A_PROTOCOL, pass: "A", operator: "GGThreshold", payloadVersion: 2,
      }) as never,
    };
    expect(() => runGate4({
      repoRoot,
      reportPath: temporaryReportPath(),
      runPassA: () => outcome,
      runPassB: () => passBOutcome(),
    })).toThrow(/GATE4: Pass A outcome verdict does not match its own records/);
  });

  it("rejects a Pass B outcome whose verdict does not match its own records", () => {
    const forged = passBOutcome(["B-EXEC-LEDGER"]);
    const outcome: Gate4BRunOutcome = {
      ...forged,
      verdict: {
        ...forged.verdict,
        executionValid: true,
        gatePass: true,
        exitCode: 0,
        executionFailures: [],
      },
      publication: syntheticPublication("/synthetic/pass-b", {
        protocol: GATE4B_PROTOCOL, pass: "B", operator: "LibbrechtKinetics", payloadVersion: 1,
      }) as never,
    };
    expect(() => runGate4({
      repoRoot,
      reportPath: temporaryReportPath(),
      runPassA: () => passAOutcome(),
      runPassB: () => outcome,
    })).toThrow(/GATE4: Pass B outcome verdict does not match its own records/);
  });

  it("rejects pass outcomes whose publication state contradicts their verdict", () => {
    const validA = passAOutcome();
    expect(() => runGate4({
      repoRoot,
      reportPath: temporaryReportPath(),
      runPassA: () => ({ ...validA, publication: null }),
      runPassB: () => passBOutcome(),
    })).toThrow(/GATE4: Pass A verdict\/publication state is inconsistent/);

    const invalidB = passBOutcome(["B-EXEC-LEDGER"]);
    expect(() => runGate4({
      repoRoot,
      reportPath: temporaryReportPath(),
      runPassA: () => passAOutcome(),
      runPassB: () => ({
        ...invalidB,
        publication: syntheticPublication("/synthetic/pass-b", {
          protocol: GATE4B_PROTOCOL, pass: "B", operator: "LibbrechtKinetics", payloadVersion: 1,
        }) as never,
      }),
    })).toThrow(/GATE4: Pass B verdict\/publication state is inconsistent/);
  });

  it("refuses terminal presentation when verdict and written report disagree", () => {
    const reportPath = temporaryReportPath();
    const outcome = runGate4({
      repoRoot,
      reportPath,
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(),
    });
    const withoutReport: Gate4AggregateOutcome = {
      ...outcome,
      reportPath: null,
      reportSha256: null,
    };
    expect(() => formatGate4TerminalPresentation(withoutReport))
      .toThrow(/GATE4: passing aggregate verdict requires a written verified report/);
    const failed = runGate4({
      repoRoot,
      reportPath: temporaryReportPath(),
      runPassA: () => passAOutcome(),
      runPassB: () => passBOutcome(["B-EXEC-LEDGER"]),
    });
    const forgedFailure: Gate4AggregateOutcome = {
      ...failed,
      reportPath: outcome.reportPath,
      reportSha256: outcome.reportSha256,
    };
    expect(() => formatGate4TerminalPresentation(forgedFailure))
      .toThrow(/GATE4: failed aggregate verdict must not carry a written report/);
  });
});
