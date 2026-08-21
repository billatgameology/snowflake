import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0_DERIVE_OUTPUTS,
  PHASE10_C0_GAP_IDS,
  PHASE10_C0_PUBLISH_CHECK_IDS,
  PHASE10_C0_PUBLISH_OUTPUTS,
  PHASE10_C0_SCIENCE_PROTOCOL_ID,
  parsePhase10C0Protocol,
  phase10C0ArtifactIdentity,
  phase10C0AssertBoundExecution,
  phase10C0Lexical,
  phase10C0ParsePrettyJson,
  type Phase10C0ExecutionProvenance,
  type Phase10C0PublishCheckId,
} from "./phase10-c0-contracts.ts";
import { phase10C0PublishCheckCaller } from "./phase10-c0-checks.ts";

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10C0PublicationCandidateBytes {
  readonly analysisBytes: Uint8Array;
  readonly comparisonsBytes: Uint8Array;
  readonly gapsBytes: Uint8Array;
  readonly historicalLimitBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
  readonly reportBytes: Uint8Array;
}

export interface Phase10C0PublicationCheckResult {
  readonly checkId: Phase10C0PublishCheckId;
  readonly verdict: "pass" | "fail" | "refusal";
  readonly reasons: readonly string[];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10C0PublicationEvaluation {
  readonly verifiedArtifacts: readonly {
    readonly outputId: string;
    readonly path: string;
    readonly byteLength: number;
    readonly sha256: string;
  }[];
  readonly checkResults: readonly Phase10C0PublicationCheckResult[];
  readonly executedNegativeControlIds: readonly [];
  readonly boundDependencyPacketIds: readonly ["a-p", "c0-derive"];
  readonly aggregateVerdict: "pass" | "fail" | "refusal";
}

export interface Phase10C0PublicationVerifyRequest {
  readonly scienceProtocolBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly candidate: Phase10C0PublicationCandidateBytes;
  readonly execution: Phase10C0ExecutionProvenance;
}

const WITNESSES: Readonly<Record<Phase10C0PublishCheckId, readonly string[]>> = Object.freeze({
  "chk-c0-publish-artifact-graph": Object.freeze(["out-c0-artifact-index"]),
  "chk-c0-publish-breakdown": Object.freeze(["out-c0-analysis", "out-c0-comparisons", "out-c0-report"]),
  "chk-c0-publish-gap-list": Object.freeze(["out-c0-gaps", "out-c0-report"]),
  "chk-c0-publish-historical-limit": Object.freeze(["out-c0-historical-limit", "out-c0-report"]),
  "chk-c0-publish-no-habit-claim": Object.freeze(["out-c0-report"]),
});

function fail(message: string): never {
  throw new Error(`Phase 10 C0 publication verification refused: ${message}`);
}

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as JsonObject;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(phase10C0Lexical);
  const wanted = [...expected].sort(phase10C0Lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(`${label} fields differ`);
}

function same(left: unknown, right: unknown): boolean {
  return canonicalJson(strictJsonSnapshot(left)) === canonicalJson(strictJsonSnapshot(right));
}

function outputPath(outputId: string): string {
  if (outputId in PHASE10_C0_DERIVE_OUTPUTS) {
    return PHASE10_C0_DERIVE_OUTPUTS[outputId as keyof typeof PHASE10_C0_DERIVE_OUTPUTS].path;
  }
  if (outputId in PHASE10_C0_PUBLISH_OUTPUTS) {
    return PHASE10_C0_PUBLISH_OUTPUTS[outputId as keyof typeof PHASE10_C0_PUBLISH_OUTPUTS].path;
  }
  fail(`unknown C0 output ${outputId}`);
}

/** Re-open all six content/index artifacts and re-derive the five publication checks. */
export function phase10C0PublicationVerifier(
  request: Phase10C0PublicationVerifyRequest,
): Phase10C0PublicationEvaluation {
  parsePhase10C0Protocol(request.scienceProtocolBytes);
  phase10C0AssertBoundExecution(request.execution, request.preflightReceiptBytes, "c0-publish");
  const errors = new Map(PHASE10_C0_PUBLISH_CHECK_IDS.map((checkId) => [checkId, [] as string[]] as const));
  const add = (checkId: Phase10C0PublishCheckId, detail: string): void => {
    errors.get(checkId)!.push(detail);
  };
  const readArtifact = (
    label: string,
    bytes: Uint8Array,
    checks: readonly Phase10C0PublishCheckId[],
  ): JsonObject | null => {
    try {
      return object(phase10C0ParsePrettyJson(bytes, `C0 ${label}`), `C0 ${label}`);
    } catch (error) {
      for (const checkId of checks) add(checkId, error instanceof Error ? error.message : `${label} parse failed`);
      return null;
    }
  };
  const analysis = readArtifact("analysis", request.candidate.analysisBytes, ["chk-c0-publish-breakdown"]);
  const gaps = readArtifact("gaps", request.candidate.gapsBytes, ["chk-c0-publish-gap-list"]);
  const historical = readArtifact("historical limit", request.candidate.historicalLimitBytes, ["chk-c0-publish-historical-limit"]);
  const report = readArtifact("report", request.candidate.reportBytes, ["chk-c0-publish-breakdown", "chk-c0-publish-gap-list", "chk-c0-publish-historical-limit", "chk-c0-publish-no-habit-claim"]);
  const index = readArtifact("artifact index", request.candidate.artifactIndexBytes, ["chk-c0-publish-artifact-graph"]);
  if (analysis !== null && report !== null) {
    try {
      exactKeys(report, ["schema", "protocolId", "analysisArtifact", "comparisonsArtifact", "gapArtifact", "historicalLimitArtifact", "comparisonBreakdown", "gapSummary", "historicalLimitSummary", "scientificDisposition", "claimLimits", "publishedIso"], "C0 report");
      if (report.schema !== "phase10-c0-report-v1" || report.protocolId !== PHASE10_C0_SCIENCE_PROTOCOL_ID) add("chk-c0-publish-breakdown", "report identity differs");
      const roster = object(analysis.roster, "C0 analysis roster");
      const expectedBreakdown = {
        expectedRowCount: roster.expectedRowCount,
        presentExpectedRowCount: roster.presentExpectedRowCount,
        expectedPairingCount: roster.expectedPairingCount,
        emittedPairingCount: roster.emittedPairingCount,
        spacingResults: analysis.spacingResults,
        overallVerdict: analysis.overallVerdict,
        overallNoPassClass: analysis.overallNoPassClass,
      };
      if (!same(report.comparisonBreakdown, expectedBreakdown)) add("chk-c0-publish-breakdown", "report comparison breakdown differs from reopened analysis");
      const comparisonText = new TextDecoder("utf-8", { fatal: true }).decode(request.candidate.comparisonsBytes);
      if (comparisonText.includes("\r") || !comparisonText.endsWith("\n") || comparisonText === "\n" || comparisonText.slice(0, -1).split("\n").length !== 64) {
        add("chk-c0-publish-breakdown", "comparison artifact is not exact 64-row LF JSONL");
      }
      const identities = [
        ["analysisArtifact", outputPath("out-c0-analysis"), request.candidate.analysisBytes],
        ["comparisonsArtifact", outputPath("out-c0-comparisons"), request.candidate.comparisonsBytes],
        ["gapArtifact", outputPath("out-c0-gaps"), request.candidate.gapsBytes],
        ["historicalLimitArtifact", outputPath("out-c0-historical-limit"), request.candidate.historicalLimitBytes],
      ] as const;
      for (const [field, path, bytes] of identities) {
        if (!same(report[field], phase10C0ArtifactIdentity(path, bytes))) add("chk-c0-publish-artifact-graph", `report ${field} identity differs from reopened bytes`);
      }
    } catch (error) {
      add("chk-c0-publish-breakdown", error instanceof Error ? error.message : "report breakdown validation failed");
    }
  }
  if (gaps !== null && report !== null) {
    try {
      const rows = Array.isArray(gaps.gaps) ? gaps.gaps : [];
      const ids = rows.map((value, index) => {
        const row = object(value, `gap ${index}`);
        return row.gapId;
      });
      const expected = {
        gapCount: 10,
        gapIds: PHASE10_C0_GAP_IDS,
        targetObservationOperatorStatus: "not-defined-in-selected-package",
      };
      if (!same(ids, PHASE10_C0_GAP_IDS) || !same(report.gapSummary, expected)) add("chk-c0-publish-gap-list", "report does not preserve the exact ten explicit refusals");
    } catch (error) {
      add("chk-c0-publish-gap-list", error instanceof Error ? error.message : "gap summary validation failed");
    }
  }
  if (historical !== null && report !== null) {
    try {
      const issue = object(historical.issue, "historical issue");
      const expected = {
        disposition: "excluded-as-authority",
        historicalReportUse: "cross-check-only",
        observedReduction: "any-spacing-some",
        authoritativeReduction: "all-spacings-every",
      };
      if (
        historical.disposition !== expected.disposition || historical.historicalReportUse !== expected.historicalReportUse ||
        issue.observedReduction !== expected.observedReduction || issue.authoritativeReduction !== expected.authoritativeReduction ||
        historical.phase6EvidenceMutationAuthorized !== false || !same(report.historicalLimitSummary, expected)
      ) add("chk-c0-publish-historical-limit", "report does not preserve the historical some/every limitation and non-mutation rule");
    } catch (error) {
      add("chk-c0-publish-historical-limit", error instanceof Error ? error.message : "historical summary validation failed");
    }
  }
  if (report !== null) {
    try {
      const disposition = object(report.scientificDisposition, "scientific disposition");
      exactKeys(disposition, ["status", "solverExecuted", "solverAccuracyPass", "robustHabitClaim", "targetScoreProduced", "quantitativeValidationClaim"], "scientific disposition");
      const expectedStatus = analysis !== null && Array.isArray(analysis.artifactDefects) &&
        analysis.artifactDefects.length === 0 &&
        object(analysis.roster, "analysis roster for disposition").presentExpectedRowCount === 80 &&
        object(analysis.roster, "analysis roster for disposition").emittedPairingCount === 64
        ? "diagnostic-complete"
        : "artifact-failure";
      const expectedClaimLimits = [
        "C0 ranks only persisted or independently derivable diagnostic fields.",
        "Neutral-only historical habit classes do not establish a robust habit observable.",
        "No solver run, absolute-accuracy reference, target score, or quantitative validation occurred.",
      ];
      if (
        disposition.status !== expectedStatus ||
        disposition.solverExecuted !== false || disposition.solverAccuracyPass !== false ||
        disposition.robustHabitClaim !== false || disposition.targetScoreProduced !== false ||
        disposition.quantitativeValidationClaim !== false || !same(report.claimLimits, expectedClaimLimits) ||
        typeof report.publishedIso !== "string" || Number.isNaN(Date.parse(report.publishedIso))
      ) add("chk-c0-publish-no-habit-claim", "report exceeds the diagnostic-only/no-habit claim boundary");
    } catch (error) {
      add("chk-c0-publish-no-habit-claim", error instanceof Error ? error.message : "scientific disposition validation failed");
    }
  }
  if (index !== null) {
    try {
      exactKeys(index, ["schema", "bundleId", "artifacts"], "C0 artifact index");
      if (index.schema !== "phase10-artifact-index-v1" || index.bundleId !== "phase10-numerical-verification-v1" || !Array.isArray(index.artifacts)) fail("artifact index identity/roster differs");
      const expected = [
        ["out-c0-analysis", request.candidate.analysisBytes, "c0-analysis", "phase10-c0-derive-producer"],
        ["out-c0-comparisons", request.candidate.comparisonsBytes, "c0-comparisons", "phase10-c0-derive-producer"],
        ["out-c0-gaps", request.candidate.gapsBytes, "c0-gap-report", "phase10-c0-derive-producer"],
        ["out-c0-historical-limit", request.candidate.historicalLimitBytes, "c0-historical-limit", "phase10-c0-derive-producer"],
        ["out-c0-report", request.candidate.reportBytes, "c0-report", "phase10-c0-publish-producer"],
      ] as const;
      const entries = index.artifacts.map((value, entryIndex) => object(value, `artifact index entry ${entryIndex}`));
      const ids = entries.map((entry) => entry.artifactId);
      if (!same(ids, expected.map(([outputId]) => outputId).sort(phase10C0Lexical))) fail("artifact index ID roster/order differs");
      for (const [outputId, bytes, role, producedBy] of expected) {
        const matches = entries.filter((entry) => entry.artifactId === outputId);
        if (matches.length !== 1) fail(`artifact index has ${matches.length} ${outputId} entries`);
        const entry = matches[0]!;
        exactKeys(entry, ["artifactId", "path", "mediaType", "byteLength", "sha256", "role", "producedBy"], `artifact index ${outputId}`);
        const identity = phase10C0ArtifactIdentity(outputPath(outputId), bytes);
        const mediaType = identity.path.endsWith(".jsonl") ? "application/x-ndjson" : "application/json";
        if (entry.path !== identity.path || entry.mediaType !== mediaType || entry.byteLength !== identity.byteLength || entry.sha256 !== identity.sha256 || entry.role !== role || entry.producedBy !== producedBy) fail(`artifact index ${outputId} differs from reopened bytes/registration`);
      }
    } catch (error) {
      add("chk-c0-publish-artifact-graph", error instanceof Error ? error.message : "artifact graph validation failed");
    }
  }
  const checkResults = phase10C0PublishCheckCaller((checkId): Phase10C0PublicationCheckResult => {
    const reasons = Object.freeze([...new Set(errors.get(checkId)!)].sort(phase10C0Lexical));
    return Object.freeze({ checkId, verdict: reasons.length === 0 ? "pass" : "fail", reasons, witnessOutputIds: WITNESSES[checkId] });
  });
  const artifacts = [
    ["out-c0-analysis", request.candidate.analysisBytes],
    ["out-c0-artifact-index", request.candidate.artifactIndexBytes],
    ["out-c0-comparisons", request.candidate.comparisonsBytes],
    ["out-c0-gaps", request.candidate.gapsBytes],
    ["out-c0-historical-limit", request.candidate.historicalLimitBytes],
    ["out-c0-report", request.candidate.reportBytes],
  ] as const;
  const verifiedArtifacts = artifacts.map(([outputId, bytes]) => Object.freeze({ outputId, ...phase10C0ArtifactIdentity(outputPath(outputId), bytes) }));
  return Object.freeze({
    verifiedArtifacts: Object.freeze(verifiedArtifacts),
    checkResults: Object.freeze(checkResults),
    executedNegativeControlIds: Object.freeze([]) as readonly [],
    boundDependencyPacketIds: Object.freeze(["a-p", "c0-derive"] as const),
    aggregateVerdict: checkResults.every((result) => result.verdict === "pass") ? "pass" : "fail",
  });
}
