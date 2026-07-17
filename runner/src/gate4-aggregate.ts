// Phase 4 aggregate gate: run Pass A then Pass B through their own reviewed orchestration
// code paths, then write the fail-closed aggregate report. Exit 0 means Pass A passed AND
// Pass B was execution-valid; Pass B's diagnostic morphology verdicts are recorded either
// way and never convert into a software failure or a false success.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalJson,
  canonicalJsonBytes,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  evaluateGate4A,
  evaluateGate4Aggregate,
  type Gate4AggregateVerdict,
} from "./gate4-protocol.ts";
import {
  GATE4A_MANIFEST_SHA256,
  runGate4A,
  type Gate4ARunOutcome,
} from "./gate4a.ts";
import {
  GATE4B_MANIFEST_SHA256,
  runGate4B,
  type Gate4BRunOutcome,
} from "./gate4b.ts";

export const GATE4_PROTOCOL = "phase4-gate4-v1";
export const GATE4_REPORT_PATH = "out/phase4/gate4-report.json";

export interface Gate4AggregateOutcome {
  readonly passA: Gate4ARunOutcome;
  readonly passB: Gate4BRunOutcome;
  readonly verdict: Gate4AggregateVerdict;
  /** Absolute path of the written canonical aggregate report; null when the gate failed. */
  readonly reportPath: string | null;
  readonly reportSha256: string | null;
}

export interface RunGate4Options {
  readonly repoRoot?: string;
  readonly reportPath?: string;
  readonly canonicalDirectoryA?: string;
  readonly canonicalDirectoryB?: string;
  /** Test-only direct-function seams; the CLI always runs both real passes. */
  readonly runPassA?: () => Gate4ARunOutcome;
  readonly runPassB?: () => Gate4BRunOutcome;
}

function writeExclusiveVerified(path: string, bytes: Uint8Array): string {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes, { flag: "wx" });
  const reopened = new Uint8Array(readFileSync(path));
  const expected = sha256Bytes(bytes);
  if (reopened.byteLength !== bytes.byteLength || sha256Bytes(reopened) !== expected) {
    throw new Error(`GATE4: aggregate report changed during write: ${path}`);
  }
  return expected;
}

function passPublicationFacts(
  publication: { readonly directory: string; readonly index: { readonly report: unknown } } | null,
): StrictJson {
  return strictJsonSnapshot(
    publication === null
      ? null
      : { directory: publication.directory, report: publication.index.report },
  );
}

/**
 * Serial aggregate orchestration. Existing canonical aggregate evidence fails closed before
 * any pass executes; a failed Pass A fails closed before Pass B starts.
 */
export function runGate4(options: RunGate4Options = {}): Gate4AggregateOutcome {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const reportPath = resolve(repoRoot, options.reportPath ?? GATE4_REPORT_PATH);
  if (existsSync(reportPath)) {
    throw new Error(`GATE4: aggregate report already exists: ${reportPath}`);
  }
  const passA = options.runPassA?.() ??
    runGate4A({ repoRoot, canonicalDirectory: options.canonicalDirectoryA });
  // Recompute the aggregate semantics from records; a forged outcome verdict cannot stand in.
  if (canonicalJson(passA.verdict) !== canonicalJson(evaluateGate4A(passA.records))) {
    throw new Error("GATE4: Pass A outcome verdict does not match its own records");
  }
  if (passA.verdict.gatePass !== (passA.publication !== null)) {
    throw new Error("GATE4: Pass A verdict/publication state is inconsistent");
  }
  if (!passA.verdict.gatePass) {
    throw new Error(
      "GATE4: Pass A failed " +
        `(${[...passA.verdict.contractFailures, ...passA.verdict.blockingFailures].join("; ") || "unnamed"}); ` +
        "Pass B was not started and no aggregate evidence was generated",
    );
  }
  const passB = options.runPassB?.() ??
    runGate4B({ repoRoot, canonicalDirectory: options.canonicalDirectoryB });
  const verdict = evaluateGate4Aggregate(passA.records, passB.records);
  if (canonicalJson(passB.verdict) !== canonicalJson(verdict.passB)) {
    throw new Error("GATE4: Pass B outcome verdict does not match its own records");
  }
  if (passB.verdict.executionValid !== (passB.publication !== null)) {
    throw new Error("GATE4: Pass B verdict/publication state is inconsistent");
  }
  let writtenPath: string | null = null;
  let reportSha256: string | null = null;
  if (verdict.gatePass) {
    const report = strictJsonSnapshot({
      version: 1,
      protocol: GATE4_PROTOCOL,
      passA: {
        manifestSha256: GATE4A_MANIFEST_SHA256,
        provenance: passA.provenance,
        publication: passPublicationFacts(passA.publication),
        verdict: passA.verdict,
        records: passA.records,
      },
      passB: {
        manifestSha256: GATE4B_MANIFEST_SHA256,
        provenance: passB.provenance,
        publication: passPublicationFacts(passB.publication),
        verdict: passB.verdict,
        records: passB.records,
      },
      aggregate: {
        gatePass: verdict.gatePass,
        exitCode: verdict.exitCode,
        passBDiagnosticPass: verdict.passBDiagnosticPass,
        passBDiagnosticFailures: verdict.passBDiagnosticFailures,
      },
    });
    reportSha256 = writeExclusiveVerified(reportPath, canonicalJsonBytes(report));
    writtenPath = reportPath;
  }
  return { passA, passB, verdict, reportPath: writtenPath, reportSha256 };
}

export interface Gate4TerminalPresentation {
  readonly exitCode: 0 | 1;
  readonly stdoutLines: readonly string[];
  readonly stderrLines: readonly string[];
}

function terminalFact(label: string, value: unknown): string {
  return `GATE4 ${label} ${canonicalJson(strictJsonSnapshot(value))}`;
}

/** Deterministic aggregate terminal evidence with the verdict/report consistency guard. */
export function formatGate4TerminalPresentation(
  outcome: Gate4AggregateOutcome,
): Gate4TerminalPresentation {
  if (outcome.verdict.gatePass && (outcome.reportPath === null || outcome.reportSha256 === null)) {
    throw new Error("GATE4: passing aggregate verdict requires a written verified report");
  }
  if (!outcome.verdict.gatePass && (outcome.reportPath !== null || outcome.reportSha256 !== null)) {
    throw new Error("GATE4: failed aggregate verdict must not carry a written report");
  }
  const stdoutLines = [
    terminalFact("PASS-A", {
      gatePass: outcome.passA.verdict.gatePass,
      exitCode: outcome.passA.verdict.exitCode,
      published: outcome.passA.publication?.directory ?? null,
      manifestSha256: GATE4A_MANIFEST_SHA256,
    }),
    terminalFact("PASS-B", {
      executionValid: outcome.passB.verdict.executionValid,
      diagnosticPass: outcome.passB.verdict.diagnosticPass,
      diagnosticFailures: outcome.passB.verdict.diagnosticFailures,
      exitCode: outcome.passB.verdict.exitCode,
      published: outcome.passB.publication?.directory ?? null,
      manifestSha256: GATE4B_MANIFEST_SHA256,
    }),
    terminalFact("AGGREGATE", {
      gatePass: outcome.verdict.gatePass,
      passBDiagnosticPass: outcome.verdict.passBDiagnosticPass,
      passBDiagnosticFailures: outcome.verdict.passBDiagnosticFailures,
      report: outcome.reportPath,
      reportSha256: outcome.reportSha256,
    }),
  ];
  if (outcome.verdict.gatePass) {
    stdoutLines.push("GATE4 EXIT STATUS: 0");
    return { exitCode: 0, stdoutLines, stderrLines: [] };
  }
  const stderrLines = [
    "GATE4 FAILED:",
    ...outcome.passA.verdict.contractFailures.map((failure) => `  - A: ${failure}`),
    ...outcome.passA.verdict.blockingFailures.map((criterion) => `  - A: ${criterion}`),
    ...outcome.passB.verdict.contractFailures.map((failure) => `  - B: ${failure}`),
    ...outcome.passB.verdict.executionFailures.map((criterion) => `  - B: ${criterion}`),
    "GATE4 EXIT STATUS: 1",
  ];
  return { exitCode: 1, stdoutLines, stderrLines };
}

/** CLI presentation only; main.ts owns exit-code assignment and flag rejection. */
export function gate4(): 0 | 1 {
  const outcome = runGate4();
  const presentation = formatGate4TerminalPresentation(outcome);
  for (const line of presentation.stdoutLines) console.log(line);
  for (const line of presentation.stderrLines) console.error(line);
  return presentation.exitCode;
}
