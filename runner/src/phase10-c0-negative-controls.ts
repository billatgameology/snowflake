import {
  canonicalJson,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  phase10C0JsonlBytes,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  type Phase10C0DeriveCandidateBytes,
  type Phase10C0NegativeControlId,
} from "./phase10-c0-contracts.ts";

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10C0Mutation {
  readonly negativeControlId: Phase10C0NegativeControlId;
  readonly artifactId: string;
  readonly registeredPath: string;
  readonly mutatedBytes: Uint8Array;
  readonly semanticTarget: StrictJson;
  readonly candidate: Phase10C0DeriveCandidateBytes;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0 negative control refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function compactJsonl(bytes: Uint8Array, label: string): readonly JsonObject[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r") || !text.endsWith("\n") || text === "\n") {
    fail(`${label} is not nonempty LF-terminated JSONL`);
  }
  return Object.freeze(text.slice(0, -1).split("\n").map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      fail(`${label} line ${index + 1} is malformed`);
    }
    const snapshot = strictJsonSnapshot(value);
    if (canonicalJson(snapshot) !== line) fail(`${label} line ${index + 1} is not canonical compact JSON`);
    return object(snapshot, `${label} line ${index + 1}`);
  }));
}

function replace(
  candidate: Phase10C0DeriveCandidateBytes,
  field: keyof Phase10C0DeriveCandidateBytes,
  bytes: Uint8Array,
): Phase10C0DeriveCandidateBytes {
  return Object.freeze({ ...candidate, [field]: bytes });
}

export function phase10C0MissingRow(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(candidate.rowsBytes);
  if (!text.endsWith("\n")) fail("missing-row fixture lacks terminal LF");
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== 80) fail("missing-row control requires the exact 80-row clean fixture");
  const removed = object(strictJsonSnapshot(JSON.parse(lines[0]!) as unknown), "removed row");
  const mutatedBytes = new TextEncoder().encode(`${lines.slice(1).join("\n")}\n`);
  return Object.freeze({
    negativeControlId: "nc-c0-missing-row",
    artifactId: "input-c0-rows",
    registeredPath: "evidence/phase6-wp2-ladder/rows.jsonl",
    mutatedBytes,
    semanticTarget: strictJsonSnapshot({ mutation: "drop-row", rowId: removed.rowId }),
    candidate: replace(candidate, "rowsBytes", mutatedBytes),
  });
}

export function phase10C0DuplicateOrTruncatedRow(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(candidate.rowsBytes);
  if (!text.endsWith("\n")) fail("duplicate-row fixture lacks terminal LF");
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== 80) fail("duplicate-row control requires the exact 80-row clean fixture");
  const duplicated = object(strictJsonSnapshot(JSON.parse(lines[0]!) as unknown), "duplicated row");
  const mutatedBytes = new TextEncoder().encode(`${[lines[0]!, ...lines].join("\n")}\n`);
  return Object.freeze({
    negativeControlId: "nc-c0-duplicate-or-truncated",
    artifactId: "input-c0-rows",
    registeredPath: "evidence/phase6-wp2-ladder/rows.jsonl",
    mutatedBytes,
    semanticTarget: strictJsonSnapshot({ mutation: "duplicate-row", rowId: duplicated.rowId }),
    candidate: replace(candidate, "rowsBytes", mutatedBytes),
  });
}

function mixedSpacing(
  candidate: Phase10C0DeriveCandidateBytes,
  dxUm: 0.7 | 0.35,
  negativeControlId: "nc-c0-coarse-fail-fine-pass" | "nc-c0-fine-fail-coarse-pass",
): Phase10C0Mutation {
  const rows = [...compactJsonl(candidate.comparisonsBytes, "C0 comparisons")];
  // Build the exact mixed-direction fixture independently of the historical scientific verdict:
  // both spacings are first represented as pass, then one registered domain comparison is made
  // no-pass. The evaluator must use every, so neither mixed direction can become an overall pass.
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    rows[rowIndex] = Object.freeze({
      ...rows[rowIndex]!,
      habitCriterionPass: true,
      attachedCountCriterionPass: true,
      comparisonVerdict: "pass",
      failureClass: null,
      failureReasons: [],
    });
  }
  const index = rows.findIndex((row) => row.kind === "domain" && row.domainSpacingDxUm === dxUm);
  if (index < 0) fail(`${negativeControlId} requires a ${dxUm} domain comparison`);
  const original = rows[index]!;
  rows[index] = Object.freeze({
    ...original,
    habitCriterionPass: false,
    comparisonVerdict: "no-pass",
    failureClass: "criterion",
    failureReasons: [{
      code: "c0-negative-control-spacing-failure",
      failureClass: "criterion",
      detail: `negative control makes only spacing ${dxUm} no-pass`,
    }],
  });
  const mutatedBytes = phase10C0JsonlBytes(rows);
  return Object.freeze({
    negativeControlId,
    artifactId: "out-c0-comparisons",
    registeredPath: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl",
    mutatedBytes,
    semanticTarget: strictJsonSnapshot({
      mutation: "single-spacing-no-pass",
      failedSpacingDxUm: dxUm,
      expectedOtherSpacing: "pass",
      expectedOverall: "no-pass",
    }),
    candidate: replace(candidate, "comparisonsBytes", mutatedBytes),
  });
}

export function phase10C0CoarseFailFinePass(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  return mixedSpacing(candidate, 0.7, "nc-c0-coarse-fail-fine-pass");
}

export function phase10C0FineFailCoarsePass(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  return mixedSpacing(candidate, 0.35, "nc-c0-fine-fail-coarse-pass");
}

export function phase10C0ForbiddenField(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  const analysis = object(phase10C0ParsePrettyJson(candidate.analysisBytes, "C0 analysis"), "C0 analysis");
  const mutatedBytes = phase10C0PrettyJsonBytes({
    ...analysis,
    occupancyMask: "forbidden inferred field",
  });
  return Object.freeze({
    negativeControlId: "nc-c0-forbidden-field",
    artifactId: "out-c0-analysis",
    registeredPath: "evidence/phase10-numerical-verification-v1/c0-analysis.json",
    mutatedBytes,
    semanticTarget: strictJsonSnapshot({ mutation: "add-forbidden-field", field: "occupancyMask" }),
    candidate: replace(candidate, "analysisBytes", mutatedBytes),
  });
}

export function phase10C0ForgedProducerVerdict(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  const analysis = object(phase10C0ParsePrettyJson(candidate.analysisBytes, "C0 analysis"), "C0 analysis");
  const current = analysis.overallVerdict;
  if (current !== "pass" && current !== "no-pass") fail("analysis has no mutable overall verdict");
  const replacement = current === "pass" ? "no-pass" : "pass";
  const mutatedBytes = phase10C0PrettyJsonBytes({
    ...analysis,
    overallVerdict: replacement,
    overallNoPassClass: replacement === "pass" ? null : "criterion",
  });
  return Object.freeze({
    negativeControlId: "nc-c0-forged-producer-verdict",
    artifactId: "out-c0-analysis",
    registeredPath: "evidence/phase10-numerical-verification-v1/c0-analysis.json",
    mutatedBytes,
    semanticTarget: strictJsonSnapshot({ mutation: "forge-producer-verdict", before: current, after: replacement }),
    candidate: replace(candidate, "analysisBytes", mutatedBytes),
  });
}

export function phase10C0OperandEcho(
  candidate: Phase10C0DeriveCandidateBytes,
): Phase10C0Mutation {
  const rows = [...compactJsonl(candidate.comparisonsBytes, "C0 comparisons")];
  const first = rows[0];
  if (first === undefined) fail("operand-echo control requires a comparison row");
  const rowA = object(first.rowA as StrictJson, "first comparison rowA");
  if (typeof rowA.tempC !== "number") fail("operand-echo control requires numeric tempC");
  rows[0] = Object.freeze({ ...first, rowA: { ...rowA, tempC: rowA.tempC + 1 } });
  const mutatedBytes = phase10C0JsonlBytes(rows);
  return Object.freeze({
    negativeControlId: "nc-c0-operand-echo",
    artifactId: "out-c0-comparisons",
    registeredPath: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl",
    mutatedBytes,
    semanticTarget: strictJsonSnapshot({ mutation: "rewrite-operand-echo", field: "rowA.tempC" }),
    candidate: replace(candidate, "comparisonsBytes", mutatedBytes),
  });
}
