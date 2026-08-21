import {
  canonicalJson,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";

export interface Phase10ScopeCandidateBytes {
  readonly phase8aOverlayBytes: Uint8Array;
  readonly phase8bOverlayBytes: Uint8Array;
  readonly reportBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

export interface Phase10ScopeMutation {
  readonly negativeControlId: string;
  readonly artifactId: string;
  readonly registeredPath: string;
  readonly mutatedBytes: Uint8Array;
  readonly candidate: Phase10ScopeCandidateBytes;
}

type JsonObject = { readonly [key: string]: StrictJson };

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonObject;
}

function canonicalJsonlRows(bytes: Uint8Array, label: string): readonly JsonObject[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r") || !text.endsWith("\n") || text === "\n") {
    throw new Error(`${label} must be nonempty LF-terminated JSONL`);
  }
  return text.slice(0, -1).split("\n").map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    const row = object(parsed as StrictJson, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) {
      throw new Error(`${label} row ${index + 1} is not canonical JSON`);
    }
    return row;
  });
}

function canonicalJsonlBytes(rows: readonly JsonObject[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function prettyJson(bytes: Uint8Array, label: string): JsonObject {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) throw new Error(`${label} must use LF line endings`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    throw new Error(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return object(snapshot, label);
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function replace(
  candidate: Phase10ScopeCandidateBytes,
  key: keyof Phase10ScopeCandidateBytes,
  bytes: Uint8Array,
): Phase10ScopeCandidateBytes {
  return { ...candidate, [key]: bytes };
}

export function phase10ASDropOneOverlayRow(
  candidate: Phase10ScopeCandidateBytes,
): Phase10ScopeMutation {
  const rows = canonicalJsonlRows(candidate.phase8aOverlayBytes, "Phase 8A overlay");
  if (rows.length < 2) throw new Error("drop-row control requires at least two Phase 8A rows");
  const mutatedBytes = canonicalJsonlBytes(rows.slice(1));
  return {
    negativeControlId: "nc-as-drop-one-overlay-row",
    artifactId: "out-as-phase8a-overlay",
    registeredPath: "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl",
    mutatedBytes,
    candidate: replace(candidate, "phase8aOverlayBytes", mutatedBytes),
  };
}

export function phase10ASRewriteFrozenRole(
  candidate: Phase10ScopeCandidateBytes,
): Phase10ScopeMutation {
  const rows = [...canonicalJsonlRows(candidate.phase8aOverlayBytes, "Phase 8A overlay")];
  const first = object(rows[0] as StrictJson, "Phase 8A first overlay row");
  const current = first.immutableEvidenceRole;
  if (typeof current !== "string") {
    throw new Error("role-rewrite control requires an immutableEvidenceRole string");
  }
  const replacement = current === "descriptive-only"
    ? "phase8a-historical-input"
    : "descriptive-only";
  rows[0] = { ...first, immutableEvidenceRole: replacement };
  const mutatedBytes = canonicalJsonlBytes(rows);
  return {
    negativeControlId: "nc-as-rewrite-frozen-role",
    artifactId: "out-as-phase8a-overlay",
    registeredPath: "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl",
    mutatedBytes,
    candidate: replace(candidate, "phase8aOverlayBytes", mutatedBytes),
  };
}

export function phase10ASCollapseMultipleBlockers(
  candidate: Phase10ScopeCandidateBytes,
): Phase10ScopeMutation {
  for (const [key, artifactId, registeredPath, label] of [
    [
      "phase8aOverlayBytes",
      "out-as-phase8a-overlay",
      "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl",
      "Phase 8A overlay",
    ],
    [
      "phase8bOverlayBytes",
      "out-as-phase8b-overlay",
      "evidence/phase10-scope-intake-v1/phase8b-overlay.jsonl",
      "Phase 8B overlay",
    ],
  ] as const) {
    const rows = [...canonicalJsonlRows(candidate[key], label)];
    const index = rows.findIndex((row) =>
      Array.isArray(row.representabilityBlockers) && row.representabilityBlockers.length >= 2);
    if (index < 0) continue;
    const row = rows[index] as JsonObject;
    const blockers = row.representabilityBlockers as readonly StrictJson[];
    const retained = blockers.slice(0, 1);
    const retainedBlocker = object(retained[0] as StrictJson, "retained representation blocker");
    if (typeof retainedBlocker.operandId !== "string") {
      throw new Error("blocker-collapse control requires an operandId string");
    }
    const eligibility = object(
      row.currentDecisionEligibility as StrictJson,
      "collapsed row currentDecisionEligibility",
    );
    rows[index] = {
      ...row,
      representabilityBlockers: retained,
      currentDecisionEligibility: {
        ...eligibility,
        blockingOperandIds: [retainedBlocker.operandId],
      },
    };
    const mutatedBytes = canonicalJsonlBytes(rows);
    return {
      negativeControlId: "nc-as-collapse-multiple-blockers",
      artifactId,
      registeredPath,
      mutatedBytes,
      candidate: replace(candidate, key, mutatedBytes),
    };
  }
  throw new Error("blocker-collapse control requires a row with multiple blockers");
}

export function phase10ASUpgradeValidationCredit(
  candidate: Phase10ScopeCandidateBytes,
): Phase10ScopeMutation {
  const report = prettyJson(candidate.reportBytes, "scope report");
  const claimBoundary = object(report.claimBoundary as StrictJson, "scope report claimBoundary");
  if (claimBoundary.quantitativeValidationEarned !== false) {
    throw new Error("validation-credit control requires a false quantitativeValidationEarned field");
  }
  const mutatedBytes = prettyJsonBytes({
    ...report,
    claimBoundary: { ...claimBoundary, quantitativeValidationEarned: true },
  });
  return {
    negativeControlId: "nc-as-upgrade-validation-credit",
    artifactId: "out-as-report",
    registeredPath: "evidence/phase10-scope-intake-v1/scope-report.json",
    mutatedBytes,
    candidate: replace(candidate, "reportBytes", mutatedBytes),
  };
}
