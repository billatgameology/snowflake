import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0_COST_FIELDS,
  PHASE10_C0_DERIVE_CHECK_IDS,
  PHASE10_C0_DERIVE_OUTPUTS,
  PHASE10_C0_ERROR_SOURCE_IDS,
  PHASE10_C0_GAP_IDS,
  PHASE10_C0_NEGATIVE_CONTROL_IDS,
  PHASE10_C0_NUMERICAL_FIELDS,
  PHASE10_C0_ROW_FIELDS,
  PHASE10_C0_SCIENCE_PROTOCOL_ID,
  parsePhase10C0Protocol,
  phase10C0ArtifactIdentity,
  phase10C0AssertBoundEvaluatorExecution,
  phase10C0AssertBoundExecution,
  phase10C0JsonlBytes,
  phase10C0Lexical,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  phase10C0Sha256,
  type Phase10C0DeriveCandidateBytes,
  type Phase10C0DeriveCheckId,
  type Phase10C0ArtifactDefect,
  type Phase10C0ExecutionProvenance,
  type Phase10C0ErrorSourceId,
  type Phase10C0ExpectedRow,
  type Phase10C0FailureClass,
  type Phase10C0NegativeControlId,
  type Phase10C0Pairing,
  type Phase10C0ParsedRows,
  type Phase10C0Row,
} from "./phase10-c0-contracts.ts";
import { phase10C0DeriveCheckCaller } from "./phase10-c0-checks.ts";
import {
  phase10C0CoarseFailFinePass,
  phase10C0DuplicateOrTruncatedRow,
  phase10C0FineFailCoarsePass,
  phase10C0ForbiddenField,
  phase10C0ForgedProducerVerdict,
  phase10C0MissingRow,
  phase10C0OperandEcho,
  type Phase10C0Mutation,
} from "./phase10-c0-negative-controls.ts";

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10C0CheckResult {
  readonly checkId: Phase10C0DeriveCheckId;
  readonly verdict: "pass" | "fail" | "refusal";
  readonly reasons: readonly string[];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10C0MutationWitness {
  readonly artifactId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: {
    readonly projection: StrictJson;
    readonly sha256: string;
  };
}

export interface Phase10C0NegativeControlResult {
  readonly negativeControlId: Phase10C0NegativeControlId;
  readonly mutationExecuted: boolean;
  readonly rejected: boolean;
  readonly beforeWitness: Phase10C0MutationWitness;
  readonly afterWitness: Phase10C0MutationWitness;
  readonly errors: readonly string[];
}

export interface Phase10C0VerifiedArtifact {
  readonly outputId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0DeriveEvaluation {
  readonly verifiedArtifacts: readonly Phase10C0VerifiedArtifact[];
  readonly checkResults: readonly Phase10C0CheckResult[];
  readonly executedNegativeControlIds: readonly Phase10C0NegativeControlId[];
  readonly negativeControlResults: readonly Phase10C0NegativeControlResult[];
  readonly terminalState: "complete" | "fail" | "refusal";
  readonly aggregateVerdict: "pass" | "fail" | "refusal";
}

export interface Phase10C0EvaluatorExecution {
  readonly evaluatorCallableId: "phase10-c0-evaluator";
  readonly modulePath: "runner/src/phase10-c0-independent.ts";
  readonly exportName: "independentlyEvaluatePhase10C0Derive";
  readonly byteLength: number;
  readonly sha256: string;
  readonly runtime: string;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly processConcurrency: number;
}

export interface Phase10C0EvaluateRequest {
  readonly scienceProtocolBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly historicalReportBytes: Uint8Array;
  readonly candidate: Phase10C0DeriveCandidateBytes;
  readonly evaluatorExecution: Phase10C0EvaluatorExecution;
  readonly evaluatorCwd: string;
  readonly enforceFrozenInputIdentities?: boolean;
  readonly executeNegativeControls?: boolean;
}

interface ExpectedComparison {
  readonly pairing: Phase10C0Pairing;
  readonly rowA: Phase10C0Row | null;
  readonly rowB: Phase10C0Row | null;
  readonly habitClassA: string | null;
  readonly habitClassB: string | null;
  readonly relativeDifference: number | null;
  readonly habitPass: boolean | null;
  readonly countPass: boolean | null;
  readonly verdict: "pass" | "no-pass";
  readonly failureClass: Phase10C0FailureClass | null;
  readonly failureReasons: readonly StrictJson[];
  readonly numericalDeltas: ReadonlyMap<string, number | null>;
  readonly costDeltas: ReadonlyMap<string, number | null>;
  readonly stopReasonDisagreement: 0 | 1 | null;
}

interface CoreEvaluation {
  readonly errorsByCheck: ReadonlyMap<Phase10C0DeriveCheckId, readonly string[]>;
  readonly parsedRows: Phase10C0ParsedRows;
}

const WITNESSES: Readonly<Record<Phase10C0DeriveCheckId, readonly string[]>> = Object.freeze({
  "chk-c0-all-spacings": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-comparison-roster": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-cost-separation": Object.freeze(["out-c0-analysis"]),
  "chk-c0-field-allowlist": Object.freeze(["out-c0-analysis", "out-c0-gaps"]),
  "chk-c0-independent-rederivation": Object.freeze(["out-c0-analysis", "out-c0-comparisons"]),
  "chk-c0-no-solver": Object.freeze(["out-c0-analysis"]),
  "chk-c0-operand-echo": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-row-roster": Object.freeze(["out-c0-comparisons"]),
});

function fail(message: string): never {
  throw new Error(`Phase 10 C0 independent evaluation refused: ${message}`);
}

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(phase10C0Lexical);
  const wanted = [...expected].sort(phase10C0Lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

function jsonl(bytes: Uint8Array, label: string): readonly JsonObject[] {
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
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      fail(`${label} line ${index + 1} is malformed`);
    }
    const snapshot = strictJsonSnapshot(parsed);
    if (canonicalJson(snapshot) !== line) fail(`${label} line ${index + 1} is not canonical compact JSON`);
    return object(snapshot, `${label} line ${index + 1}`);
  }));
}

function add(errors: Map<Phase10C0DeriveCheckId, string[]>, checkId: Phase10C0DeriveCheckId, detail: string): void {
  errors.get(checkId)!.push(detail);
}

function same(left: unknown, right: unknown): boolean {
  return canonicalJson(strictJsonSnapshot(left)) === canonicalJson(strictJsonSnapshot(right));
}

type IndependentExpectedRow = Pick<Phase10C0Row,
  "rowId" | "tempC" | "fraction" | "paramSet" | "dxUm" | "seedRadius" |
  "targetExtent" | "domainN" | "cflFill" | "relaxTol" | "surfacePolicy" |
  "farField" | "pressurePa" | "noiseEpsilon" | "rngSeed" | "domain" | "divTol" |
  "relaxMaxSweeps" | "seedThickness" | "sigmaInfinity">;

const INDEPENDENT_POINTS = Object.freeze([
  Object.freeze({ tempC: -31, fraction: 0.6, sigmaInfinity: 0.21204000000000003 }),
  Object.freeze({ tempC: -13, fraction: 0.15, sigmaInfinity: 0.02025 }),
  Object.freeze({ tempC: -6, fraction: 0.15, sigmaInfinity: 0.00906 }),
  Object.freeze({ tempC: -27, fraction: 0.15, sigmaInfinity: 0.045375 }),
]);
const INDEPENDENT_ARMS = Object.freeze(["M1", "CAK"] as const);
const INDEPENDENT_SPACINGS = Object.freeze([
  Object.freeze({ dxUm: 0.7 as const, seedRadius: 8, targetExtent: 27, domainNs: Object.freeze([48, 64, 80]) }),
  Object.freeze({ dxUm: 0.35 as const, seedRadius: 17, targetExtent: 54, domainNs: Object.freeze([96, 112, 128]) }),
]);
const INDEPENDENT_CONTROLS = Object.freeze([
  Object.freeze({ name: "cfl0.05", cflFill: 0.05, relaxTol: 1e-9, seedRadius: 17 }),
  Object.freeze({ name: "relaxTol1e-10", cflFill: 0.1, relaxTol: 1e-10, seedRadius: 17 }),
  Object.freeze({ name: "seed16", cflFill: 0.1, relaxTol: 1e-9, seedRadius: 16 }),
  Object.freeze({ name: "seed18", cflFill: 0.1, relaxTol: 1e-9, seedRadius: 18 }),
]);
const INDEPENDENT_FIXED = Object.freeze({
  surfacePolicy: "aggregate-hv-g1h1-v6",
  farField: "monopole-matched",
  pressurePa: 101_325,
  noiseEpsilon: 0,
  rngSeed: 1,
  domain: "hexPrism",
  divTol: 1e-7,
  relaxMaxSweeps: 200_000,
});
const INDEPENDENT_ECHO_FIELDS = Object.freeze([
  "tempC", "fraction", "paramSet", "dxUm", "seedRadius", "targetExtent", "domainN",
  "cflFill", "relaxTol", "surfacePolicy", "farField", "pressurePa", "noiseEpsilon",
  "rngSeed", "domain", "divTol", "relaxMaxSweeps", "seedThickness", "sigmaInfinity",
] as const);

function independentExpectedRow(
  rowId: string,
  point: typeof INDEPENDENT_POINTS[number],
  paramSet: typeof INDEPENDENT_ARMS[number],
  dxUm: number,
  seedRadius: number,
  targetExtent: number,
  domainN: number,
  cflFill: number,
  relaxTol: number,
): IndependentExpectedRow {
  return Object.freeze({
    rowId,
    tempC: point.tempC,
    fraction: point.fraction,
    paramSet,
    dxUm,
    seedRadius,
    targetExtent,
    domainN,
    cflFill,
    relaxTol,
    ...INDEPENDENT_FIXED,
    seedThickness: seedRadius * 2 + 1,
    sigmaInfinity: point.sigmaInfinity,
  });
}

function independentRows(): readonly IndependentExpectedRow[] {
  const rows: IndependentExpectedRow[] = [];
  for (const spacing of INDEPENDENT_SPACINGS) {
    for (const domainN of spacing.domainNs) {
      for (const point of INDEPENDENT_POINTS) {
        for (const arm of INDEPENDENT_ARMS) {
          rows.push(independentExpectedRow(
            `dom-${spacing.dxUm}-n${domainN}@${point.tempC}C-f${point.fraction}-${arm}`,
            point,
            arm,
            spacing.dxUm,
            spacing.seedRadius,
            spacing.targetExtent,
            domainN,
            0.1,
            1e-9,
          ));
        }
      }
    }
  }
  for (const control of INDEPENDENT_CONTROLS) {
    for (const point of INDEPENDENT_POINTS) {
      for (const arm of INDEPENDENT_ARMS) {
        rows.push(independentExpectedRow(
          `aux-${control.name}@${point.tempC}C-f${point.fraction}-${arm}`,
          point,
          arm,
          0.35,
          control.seedRadius,
          54,
          96,
          control.cflFill,
          control.relaxTol,
        ));
      }
    }
  }
  const rosterBytes = new TextEncoder().encode(`${rows.map((row) => row.rowId).sort(phase10C0Lexical).join("\n")}\n`);
  if (
    rows.length !== 80 || new Set(rows.map((row) => row.rowId)).size !== 80 || rosterBytes.byteLength !== 2_152 ||
    phase10C0Sha256(rosterBytes) !== "560b19895d883e77dee2a3ea889d45684aa9188ba247fc1f2fcbbb8a0c537593"
  ) fail("independent 80-row roster differs from the frozen identity");
  return Object.freeze(rows);
}

function independentDomainId(dxUm: number, domainN: number, point: typeof INDEPENDENT_POINTS[number], arm: string): string {
  return `dom-${dxUm}-n${domainN}@${point.tempC}C-f${point.fraction}-${arm}`;
}

function independentErrorSource(
  kind: "domain" | "auxiliary",
  rowIdA: string,
  rowIdB: string,
  expectedRows: ReadonlyMap<string, IndependentExpectedRow>,
): Phase10C0ErrorSourceId {
  const rowA = expectedRows.get(rowIdA);
  const rowB = expectedRows.get(rowIdB);
  if (rowA === undefined || rowB === undefined) fail(`independent mapping lacks operands for ${rowIdA}|${rowIdB}`);
  const matches: Phase10C0ErrorSourceId[] = [];
  if (
    kind === "domain" && rowA.dxUm === 0.7 && rowB.dxUm === 0.7 &&
    ((rowA.domainN === 48 && rowB.domainN === 64) || (rowA.domainN === 64 && rowB.domainN === 80))
  ) matches.push("domain-coarse-spacing");
  if (
    kind === "domain" && rowA.dxUm === 0.35 && rowB.dxUm === 0.35 &&
    ((rowA.domainN === 96 && rowB.domainN === 112) || (rowA.domainN === 112 && rowB.domainN === 128))
  ) matches.push("domain-fine-spacing");
  if (kind === "auxiliary" && rowA.cflFill === 0.1 && rowB.cflFill === 0.05 && rowIdB.startsWith("aux-cfl0.05@")) matches.push("cflFill");
  if (kind === "auxiliary" && rowA.relaxTol === 1e-9 && rowB.relaxTol === 1e-10 && rowIdB.startsWith("aux-relaxTol1e-10@")) matches.push("relaxTol");
  if (
    kind === "auxiliary" && rowA.seedRadius === 17 &&
    ((rowB.seedRadius === 16 && rowB.seedThickness === 33 && rowIdB.startsWith("aux-seed16@")) ||
      (rowB.seedRadius === 18 && rowB.seedThickness === 37 && rowIdB.startsWith("aux-seed18@")))
  ) matches.push("seedRadius");
  if (matches.length !== 1) fail(`independent five-rule map matched ${matches.length} rules for ${rowIdA}|${rowIdB}`);
  return matches[0]!;
}

function independentPairings(expectedRows: ReadonlyMap<string, IndependentExpectedRow>): readonly Phase10C0Pairing[] {
  const pairs: Phase10C0Pairing[] = [];
  const add = (kind: "domain" | "auxiliary", domainSpacingDxUm: 0.7 | 0.35 | null, rowIdA: string, rowIdB: string): void => {
    pairs.push(Object.freeze({
      comparisonId: `${kind}|${rowIdA}|${rowIdB}`,
      kind,
      errorSourceId: independentErrorSource(kind, rowIdA, rowIdB, expectedRows),
      domainSpacingDxUm,
      rowIdA,
      rowIdB,
    }));
  };
  for (const spacing of INDEPENDENT_SPACINGS) {
    for (let domainIndex = 0; domainIndex < spacing.domainNs.length - 1; domainIndex += 1) {
      for (const point of INDEPENDENT_POINTS) {
        for (const arm of INDEPENDENT_ARMS) {
          add(
            "domain",
            spacing.dxUm,
            independentDomainId(spacing.dxUm, spacing.domainNs[domainIndex]!, point, arm),
            independentDomainId(spacing.dxUm, spacing.domainNs[domainIndex + 1]!, point, arm),
          );
        }
      }
    }
  }
  for (const control of INDEPENDENT_CONTROLS) {
    for (const point of INDEPENDENT_POINTS) {
      for (const arm of INDEPENDENT_ARMS) {
        add(
          "auxiliary",
          null,
          independentDomainId(0.35, 96, point, arm),
          `aux-${control.name}@${point.tempC}C-f${point.fraction}-${arm}`,
        );
      }
    }
  }
  pairs.sort((left, right) => phase10C0Lexical(left.comparisonId, right.comparisonId));
  const counts = new Map<Phase10C0ErrorSourceId, number>(PHASE10_C0_ERROR_SOURCE_IDS.map((id) => [id, 0]));
  for (const pair of pairs) counts.set(pair.errorSourceId, counts.get(pair.errorSourceId)! + 1);
  const requiredCounts = [16, 16, 8, 8, 16] as const;
  if (
    pairs.length !== 64 || new Set(pairs.map((pair) => pair.comparisonId)).size !== 64 ||
    PHASE10_C0_ERROR_SOURCE_IDS.some((id, index) => counts.get(id) !== requiredCounts[index])
  ) fail("independent pairing map does not form the exact 16/16/8/8/16 partition");
  const identity = new TextEncoder().encode(`${pairs.map((pair) => pair.comparisonId).join("\n")}\n`);
  if (identity.byteLength !== 3_992 || phase10C0Sha256(identity) !== "90016bf4f3d3268f83409a760146ece6110626042c83e4e33a980b44d2a52216") {
    fail("independent 64-pair roster differs from the frozen identity");
  }
  return Object.freeze(pairs);
}

function independentTopLevelKeys(line: string): readonly string[] {
  const keys: string[] = [];
  let index = 0;
  const skip = (): void => { while (/\s/u.test(line[index] ?? "")) index += 1; };
  skip();
  if (line[index] !== "{") fail("independent JSONL row is not an object");
  index += 1;
  while (true) {
    skip();
    if (line[index] === "}") return keys;
    if (line[index] !== '"') fail("independent JSONL row has a non-string top-level key");
    const start = index;
    index += 1;
    let escaped = false;
    while (index < line.length) {
      const character = line[index++]!;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') break;
    }
    const key = JSON.parse(line.slice(start, index)) as unknown;
    if (typeof key !== "string" || keys.includes(key)) fail("independent JSONL row has a duplicate or invalid key");
    keys.push(key);
    skip();
    if (line[index++] !== ":") fail("independent JSONL row key lacks a colon");
    skip();
    let depth = 0;
    let inString = false;
    escaped = false;
    while (index < line.length) {
      const character = line[index]!;
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
      } else if (character === '"') inString = true;
      else if (character === "[" || character === "{") depth += 1;
      else if (character === "]" || character === "}") {
        if (depth === 0 && character === "}") break;
        depth -= 1;
      } else if (character === "," && depth === 0) break;
      index += 1;
    }
    skip();
    if (line[index] === ",") { index += 1; continue; }
    if (line[index] === "}") return keys;
    fail("independent JSONL row delimiter differs");
  }
}

function independentNumber(row: JsonObject, field: string, label: string, minimum = -Infinity, strict = false): number {
  const value = row[field];
  if (typeof value !== "number" || !Number.isFinite(value) || (strict ? value <= minimum : value < minimum)) fail(`${label}.${field} differs`);
  return value;
}

function independentInteger(row: JsonObject, field: string, label: string, minimum: number): number {
  const value = row[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) fail(`${label}.${field} differs`);
  return value;
}

function independentString(row: JsonObject, field: string, label: string): string {
  const value = row[field];
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) fail(`${label}.${field} differs`);
  return value;
}

function independentParseRow(value: unknown, label: string): Phase10C0Row {
  const row = object(value, label);
  exactKeys(row, PHASE10_C0_ROW_FIELDS, label);
  const parsed: Phase10C0Row = Object.freeze({
    rowId: independentString(row, "rowId", label),
    tempC: independentNumber(row, "tempC", label),
    fraction: independentNumber(row, "fraction", label),
    paramSet: independentString(row, "paramSet", label),
    dxUm: independentNumber(row, "dxUm", label, 0, true),
    seedRadius: independentInteger(row, "seedRadius", label, 1),
    targetExtent: independentInteger(row, "targetExtent", label, 1),
    domainN: independentInteger(row, "domainN", label, 1),
    cflFill: independentNumber(row, "cflFill", label, 0, true),
    relaxTol: independentNumber(row, "relaxTol", label, 0, true),
    surfacePolicy: independentString(row, "surfacePolicy", label),
    farField: independentString(row, "farField", label),
    pressurePa: independentNumber(row, "pressurePa", label, 0, true),
    noiseEpsilon: independentNumber(row, "noiseEpsilon", label, 0),
    rngSeed: independentInteger(row, "rngSeed", label, Number.MIN_SAFE_INTEGER),
    domain: independentString(row, "domain", label),
    divTol: independentNumber(row, "divTol", label, 0, true),
    relaxMaxSweeps: independentInteger(row, "relaxMaxSweeps", label, 1),
    seedThickness: independentInteger(row, "seedThickness", label, 1),
    sigmaInfinity: independentNumber(row, "sigmaInfinity", label),
    stopReason: independentString(row, "stopReason", label),
    cycles: independentInteger(row, "cycles", label, 0),
    totalSweeps: independentInteger(row, "totalSweeps", label, 0),
    wallSeconds: independentNumber(row, "wallSeconds", label, 0),
    attachedCount: independentInteger(row, "attachedCount", label, 0),
    finalExtent: independentInteger(row, "finalExtent", label, 0),
    aspectRatio: independentNumber(row, "aspectRatio", label, 0, true),
    symmetryError: independentNumber(row, "symmetryError", label, 0),
    engine: independentString(row, "engine", label),
    peakRssBytes: independentInteger(row, "peakRssBytes", label, 0),
    gitHead: independentString(row, "gitHead", label),
    startedIso: independentString(row, "startedIso", label),
    finishedIso: independentString(row, "finishedIso", label),
    concurrency: independentInteger(row, "concurrency", label, 1),
    host: independentString(row, "host", label),
    dispatcherCommand: independentString(row, "dispatcherCommand", label),
  });
  if (!/^[0-9a-f]{40}$/u.test(parsed.gitHead) || Number.isNaN(Date.parse(parsed.startedIso)) || Number.isNaN(Date.parse(parsed.finishedIso))) {
    fail(`${label} provenance differs`);
  }
  return parsed;
}

function independentlyParseRows(bytes: Uint8Array): Phase10C0ParsedRows {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("independent rows are not valid UTF-8");
  }
  const expected = independentRows();
  const expectedRowsById = new Map(expected.map((row) => [row.rowId, row] as const));
  const pairings = independentPairings(expectedRowsById);
  const defects: Phase10C0ArtifactDefect[] = [];
  const rowsById = new Map<string, Phase10C0Row>();
  const duplicates = new Set<string>();
  const unexpected = new Set<string>();
  if (text.includes("\r")) defects.push({ code: "c0-input-cr-byte", scope: "input", rowId: null, lineNumber: null, detail: "rows contain CR bytes" });
  const terminalLf = text.endsWith("\n");
  if (!terminalLf) defects.push({ code: "c0-input-missing-terminal-lf", scope: "input", rowId: null, lineNumber: null, detail: "rows lack the required terminal LF" });
  const lines = (terminalLf ? text.slice(0, -1) : text).split("\n");
  if (lines.some((line) => line.length === 0)) defects.push({ code: "c0-input-blank-line", scope: "input", rowId: null, lineNumber: null, detail: "rows contain a blank line" });
  for (const [offset, line] of lines.entries()) {
    if (line.length === 0) continue;
    const lineNumber = offset + 1;
    let value: unknown;
    let row: Phase10C0Row;
    try {
      const keys = [...independentTopLevelKeys(line)].sort(phase10C0Lexical);
      const wanted = [...PHASE10_C0_ROW_FIELDS].sort(phase10C0Lexical);
      if (keys.length !== wanted.length || keys.some((key, index) => key !== wanted[index])) throw new Error("row key set differs from the frozen 36-field schema");
      value = JSON.parse(line) as unknown;
      row = independentParseRow(value, `independent row line ${lineNumber}`);
    } catch (error) {
      const possible = value !== null && typeof value === "object" && !Array.isArray(value) ? (value as { rowId?: unknown }).rowId : null;
      defects.push({ code: "c0-row-field-contract", scope: "row", rowId: typeof possible === "string" ? possible : null, lineNumber, detail: error instanceof Error ? error.message : "row parse failed" });
      continue;
    }
    const expectedRow = expectedRowsById.get(row.rowId);
    if (expectedRow === undefined) {
      unexpected.add(row.rowId);
      defects.push({ code: "c0-unexpected-row", scope: "row", rowId: row.rowId, lineNumber, detail: "rowId is outside the independent frozen roster" });
      continue;
    }
    if (rowsById.has(row.rowId) || duplicates.has(row.rowId)) {
      duplicates.add(row.rowId);
      rowsById.delete(row.rowId);
      defects.push({ code: "c0-duplicate-row", scope: "row", rowId: row.rowId, lineNumber, detail: "rowId occurs more than once" });
      continue;
    }
    const echo = INDEPENDENT_ECHO_FIELDS.filter((field) => row[field] !== expectedRow[field]);
    if (echo.length > 0) {
      defects.push({ code: "c0-operand-echo", scope: "row", rowId: row.rowId, lineNumber, detail: `${echo.join(",")} differ from independent enumeration` });
      continue;
    }
    const sanctioned = new Set(["f59d18702301155c0c2e7eaecc3442e6cf117123", "aa812952efbf5c4ef7152cc7595342092a51b000", "3827b7763e870da6a81f8dc3430cfc4be5ab3ec6"]);
    if (!sanctioned.has(row.gitHead)) {
      defects.push({ code: "c0-unsanctioned-head", scope: "provenance", rowId: row.rowId, lineNumber, detail: `unsanctioned gitHead ${row.gitHead}` });
      continue;
    }
    if (/^dom-0\.35-n(112|128)@/u.test(row.rowId) && row.gitHead === "f59d18702301155c0c2e7eaecc3442e6cf117123") {
      defects.push({ code: "c0-heavy-row-freeze-head", scope: "provenance", rowId: row.rowId, lineNumber, detail: "heavy row carries the forbidden pre-amendment head" });
      continue;
    }
    rowsById.set(row.rowId, row);
  }
  for (const duplicate of duplicates) rowsById.delete(duplicate);
  const missingRowIds = [...expectedRowsById.keys()].filter((rowId) => !rowsById.has(rowId)).sort(phase10C0Lexical);
  for (const rowId of missingRowIds) defects.push({ code: "c0-missing-row", scope: "row", rowId, lineNumber: null, detail: "expected row is unavailable or invalid" });
  defects.sort((left, right) => phase10C0Lexical(`${left.code}\u0000${left.rowId ?? ""}\u0000${left.lineNumber ?? 0}`, `${right.code}\u0000${right.rowId ?? ""}\u0000${right.lineNumber ?? 0}`));
  return Object.freeze({
    rowsById,
    expectedRowsById: expectedRowsById as ReadonlyMap<string, Phase10C0ExpectedRow>,
    pairings,
    missingRowIds: Object.freeze(missingRowIds),
    unexpectedRowIds: Object.freeze([...unexpected].sort(phase10C0Lexical)),
    duplicateRowIds: Object.freeze([...duplicates].sort(phase10C0Lexical)),
    defects: Object.freeze(defects),
  });
}

// These load-bearing reductions deliberately do not call the producer's shared helpers. The
// frozen protocol is the common authority; this evaluator supplies a second implementation.
function independentHabitClass(aspectRatio: number): "plate" | "neutral" | "column" | "invalid" {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return "invalid";
  if (aspectRatio <= 1 / 1.5) return "plate";
  if (aspectRatio >= 1.5) return "column";
  return "neutral";
}

function independentFailureClass(
  classes: readonly Phase10C0FailureClass[],
): Phase10C0FailureClass | null {
  const hasCriterion = classes.includes("criterion") || classes.includes("mixed");
  const hasInfrastructure = classes.includes("infrastructure") || classes.includes("mixed");
  return hasCriterion && hasInfrastructure
    ? "mixed"
    : hasCriterion
    ? "criterion"
    : hasInfrastructure
    ? "infrastructure"
    : null;
}

function independentEverySpacing(
  spacingVerdicts: readonly ("pass" | "no-pass")[],
): "pass" | "no-pass" {
  if (spacingVerdicts.length !== 2) fail("independent all-spacings reduction requires exactly two spacings");
  return spacingVerdicts[0] === "pass" && spacingVerdicts[1] === "pass" ? "pass" : "no-pass";
}

function independentNormalizedDelta(left: number, right: number): number {
  if (!Number.isFinite(left) || !Number.isFinite(right)) fail("independent diagnostic operands must be finite");
  const denominator = Math.max(Math.abs(left), Math.abs(right));
  return denominator === 0 ? 0 : Math.abs(left - right) / denominator;
}

function independentGapItems(): readonly StrictJson[] {
  const definitions: Readonly<Record<string, readonly [string, string, string]>> = {
    "attachment-event-orbit": ["per-cycle attachment coordinates or orbit witnesses", "absent-from-persisted-rows", "attachment-event bytes"],
    "checkpoint-state": ["checkpoint or resume-state bytes", "absent-from-persisted-rows", "checkpoint bytes"],
    "crystallographic-calipers": ["exact crystallographic spans or axis calipers", "forbidden-inference", "registered caliper output"],
    "future-target-observation": ["a future B-defined observation operator", "requires-future-observation-operator", "future selected target operator"],
    "kinetic-ledgers": ["kinetic, clipping, hole-fill, or vapor ledgers", "absent-from-persisted-rows", "detailed ledger bytes"],
    "occupancy-mask": ["occupancy or attached-cell masks", "absent-from-persisted-rows", "occupancy bytes"],
    "physical-time-history": ["physical-time history", "absent-from-persisted-rows", "per-step physical-time bytes"],
    "relaxation-histories": ["relaxation residual, divergence, or smoother-drift histories", "absent-from-persisted-rows", "relaxation history bytes"],
    trajectory: ["per-cycle or continuous trajectories", "absent-from-persisted-rows", "trajectory bytes"],
    "vapor-surface-fields": ["vapor-field or surface-propensity arrays", "absent-from-persisted-rows", "field-array bytes"],
  };
  return Object.freeze(PHASE10_C0_GAP_IDS.map((gapId) => {
    const [fieldDescription, reasonCode, requiredSource] = definitions[gapId]!;
    return strictJsonSnapshot({
      gapId,
      fieldDescription,
      availability: "unavailable",
      reasonCode,
      requiredSource,
      disposition: "explicit-refusal",
    });
  }));
}

function assertEvaluatorExecution(request: Phase10C0EvaluateRequest): void {
  const execution = request.evaluatorExecution;
  exactKeys(execution, ["evaluatorCallableId", "modulePath", "exportName", "byteLength", "sha256", "runtime", "command", "gitHead", "startedOn", "endedOn", "processConcurrency"], "C0 evaluator execution");
  if (
    execution.evaluatorCallableId !== "phase10-c0-evaluator" ||
    execution.modulePath !== "runner/src/phase10-c0-independent.ts" ||
    execution.exportName !== "independentlyEvaluatePhase10C0Derive" ||
    !Number.isSafeInteger(execution.byteLength) || execution.byteLength <= 0 ||
    !/^[0-9a-f]{64}$/u.test(execution.sha256)
  ) fail("C0 evaluator execution provenance differs");
  phase10C0AssertBoundEvaluatorExecution(execution, request.evaluatorCwd, request.preflightReceiptBytes, "c0-derive");
}

function expectedComparison(
  pairing: Phase10C0Pairing,
  parsed: Phase10C0ParsedRows,
  defects: readonly { readonly code: string; readonly detail: string }[],
): ExpectedComparison {
  const rowA = parsed.rowsById.get(pairing.rowIdA) ?? null;
  const rowB = parsed.rowsById.get(pairing.rowIdB) ?? null;
  const reasons: StrictJson[] = [];
  if (defects.length > 0) {
    reasons.push(strictJsonSnapshot({
      code: "c0-artifact-defect",
      failureClass: "infrastructure",
      detail: `${defects.length} artifact defect(s) force every comparison and spacing to no-pass`,
    }));
  }
  let infrastructure = false;
  for (const [side, rowId, row] of [["A", pairing.rowIdA, rowA], ["B", pairing.rowIdB, rowB]] as const) {
    if (row === null) {
      infrastructure = true;
      reasons.push(strictJsonSnapshot({ code: `c0-row-${side.toLowerCase()}-unavailable`, failureClass: "infrastructure", detail: `${rowId} is unavailable for the registered ${side} operand` }));
    } else if (row.stopReason !== "size-target") {
      infrastructure = true;
      reasons.push(strictJsonSnapshot({ code: `c0-row-${side.toLowerCase()}-stop-reason`, failureClass: "infrastructure", detail: `${rowId} stopReason is ${row.stopReason}, not size-target` }));
    } else if (!Number.isSafeInteger(row.attachedCount) || row.attachedCount <= 0) {
      infrastructure = true;
      reasons.push(strictJsonSnapshot({ code: `c0-row-${side.toLowerCase()}-attached-count`, failureClass: "infrastructure", detail: `${rowId} attachedCount is not a positive safe integer` }));
    }
  }
  const habitClassA = rowA === null ? null : independentHabitClass(rowA.aspectRatio);
  const habitClassB = rowB === null ? null : independentHabitClass(rowB.aspectRatio);
  let relativeDifference: number | null = null;
  let habitPass: boolean | null = null;
  let countPass: boolean | null = null;
  if (!infrastructure && rowA !== null && rowB !== null) {
    relativeDifference = Math.abs(rowB.attachedCount - rowA.attachedCount) / rowA.attachedCount;
    habitPass = habitClassA !== "invalid" && habitClassB !== "invalid" && habitClassA === habitClassB;
    countPass = relativeDifference <= 0.005;
    if (!habitPass) reasons.push(strictJsonSnapshot({ code: "c0-habit-class-mismatch", failureClass: "criterion", detail: `${pairing.rowIdA} class ${String(habitClassA)} differs from ${pairing.rowIdB} class ${String(habitClassB)}` }));
    if (!countPass) reasons.push(strictJsonSnapshot({ code: "c0-attached-count-tolerance", failureClass: "criterion", detail: `attachedCount relative difference ${relativeDifference} exceeds 0.005` }));
  }
  const numericalDeltas = new Map<string, number | null>();
  const costDeltas = new Map<string, number | null>();
  for (const [fields, target] of [
    [PHASE10_C0_NUMERICAL_FIELDS, numericalDeltas],
    [PHASE10_C0_COST_FIELDS, costDeltas],
  ] as const) {
    for (const field of fields) {
      const left = rowA?.[field] ?? null;
      const right = rowB?.[field] ?? null;
      target.set(field, typeof left === "number" && typeof right === "number"
        ? independentNormalizedDelta(left, right)
        : null);
    }
  }
  return Object.freeze({
    pairing,
    rowA,
    rowB,
    habitClassA,
    habitClassB,
    relativeDifference,
    habitPass,
    countPass,
    verdict: reasons.length === 0 ? "pass" : "no-pass",
    failureClass: independentFailureClass(reasons.map((reason) => (reason as JsonObject).failureClass as Phase10C0FailureClass)),
    failureReasons: Object.freeze(reasons),
    numericalDeltas,
    costDeltas,
    stopReasonDisagreement: rowA === null || rowB === null
      ? null
      : rowA.stopReason === rowB.stopReason ? 0 : 1,
  });
}

function expectedRanking(
  comparisons: readonly ExpectedComparison[],
  fields: readonly string[],
  category: "numerical" | "cost",
): readonly StrictJson[] {
  const entries: Array<{
    readonly observableId: string;
    readonly errorSourceId: string;
    readonly comparisonCount: number;
    readonly definedCount: number;
    readonly nonZeroComparisonCount: number;
    readonly maxNormalizedAbsoluteDelta: number | null;
    readonly maxWitnessPairId: string | null;
  }> = [];
  for (const observableId of fields) {
    for (const errorSourceId of PHASE10_C0_ERROR_SOURCE_IDS) {
      const group = comparisons.filter((comparison) => comparison.pairing.errorSourceId === errorSourceId);
      const defined = group.map((comparison) => ({
        comparisonId: comparison.pairing.comparisonId,
        value: (category === "numerical" ? comparison.numericalDeltas : comparison.costDeltas).get(observableId) ?? null,
      })).filter((entry): entry is { comparisonId: string; value: number } => entry.value !== null);
      let maximum: number | null = null;
      let witness: string | null = null;
      for (const entry of defined) {
        if (
          maximum === null || entry.value > maximum ||
          (entry.value === maximum && witness !== null && phase10C0Lexical(entry.comparisonId, witness) < 0)
        ) {
          maximum = entry.value;
          witness = entry.comparisonId;
        }
      }
      entries.push({
        observableId,
        errorSourceId,
        comparisonCount: group.length,
        definedCount: defined.length,
        nonZeroComparisonCount: defined.filter((entry) => entry.value > 0).length,
        maxNormalizedAbsoluteDelta: maximum,
        maxWitnessPairId: witness,
      });
    }
  }
  entries.sort((left, right) => {
    if (left.maxNormalizedAbsoluteDelta === null && right.maxNormalizedAbsoluteDelta !== null) return 1;
    if (left.maxNormalizedAbsoluteDelta !== null && right.maxNormalizedAbsoluteDelta === null) return -1;
    if (
      left.maxNormalizedAbsoluteDelta !== null && right.maxNormalizedAbsoluteDelta !== null &&
      left.maxNormalizedAbsoluteDelta !== right.maxNormalizedAbsoluteDelta
    ) return right.maxNormalizedAbsoluteDelta - left.maxNormalizedAbsoluteDelta;
    if (left.nonZeroComparisonCount !== right.nonZeroComparisonCount) return right.nonZeroComparisonCount - left.nonZeroComparisonCount;
    const byObservable = phase10C0Lexical(left.observableId, right.observableId);
    return byObservable !== 0 ? byObservable : phase10C0Lexical(left.errorSourceId, right.errorSourceId);
  });
  return Object.freeze(entries.map((entry, index) => strictJsonSnapshot({ rank: index + 1, ...entry })));
}

function validateComparison(
  actual: JsonObject,
  expected: ExpectedComparison,
  errors: Map<Phase10C0DeriveCheckId, string[]>,
): void {
  try {
    exactKeys(actual, [
      "schema", "comparisonId", "kind", "errorSourceId", "domainSpacingDxUm", "rowIdA", "rowIdB",
      "rowA", "rowB", "habitClassA", "habitClassB", "attachedCountRelativeDifference",
      "habitCriterionPass", "attachedCountCriterionPass", "comparisonVerdict", "failureClass",
      "failureReasons", "normalizedDiagnostics", "categoricalDiagnostics",
    ], `comparison ${expected.pairing.comparisonId}`);
  } catch (error) {
    add(errors, "chk-c0-field-allowlist", error instanceof Error ? error.message : "comparison fields differ");
    return;
  }
  const pairing = expected.pairing;
  for (const [field, value] of [
    ["schema", "phase10-c0-comparison-row-v1"],
    ["comparisonId", pairing.comparisonId],
    ["kind", pairing.kind],
    ["errorSourceId", pairing.errorSourceId],
    ["domainSpacingDxUm", pairing.domainSpacingDxUm],
    ["rowIdA", pairing.rowIdA],
    ["rowIdB", pairing.rowIdB],
  ] as const) {
    if (actual[field] !== value) add(errors, field === "errorSourceId" ? "chk-c0-independent-rederivation" : "chk-c0-comparison-roster", `${pairing.comparisonId} ${field} differs`);
  }
  if (!same(actual.rowA, expected.rowA) || !same(actual.rowB, expected.rowB)) {
    add(errors, "chk-c0-operand-echo", `${pairing.comparisonId} row snapshot differs from reopened row bytes`);
  }
  for (const [field, value] of [
    ["habitClassA", expected.habitClassA],
    ["habitClassB", expected.habitClassB],
    ["attachedCountRelativeDifference", expected.relativeDifference],
    ["habitCriterionPass", expected.habitPass],
    ["attachedCountCriterionPass", expected.countPass],
    ["comparisonVerdict", expected.verdict],
    ["failureClass", expected.failureClass],
  ] as const) {
    if (actual[field] !== value) {
      add(errors, "chk-c0-independent-rederivation", `${pairing.comparisonId} ${field} differs from independent re-derivation`);
      if (field === "comparisonVerdict") {
        add(errors, "chk-c0-all-spacings", `${pairing.comparisonId} emitted verdict differs from reopened row bytes`);
      }
    }
  }
  if (!Array.isArray(actual.failureReasons)) {
    add(errors, "chk-c0-independent-rederivation", `${pairing.comparisonId} failureReasons is not an array`);
  } else if (!same(actual.failureReasons, expected.failureReasons)) {
    add(errors, "chk-c0-independent-rederivation", `${pairing.comparisonId} failureReasons differ from independent re-derivation`);
  }
  const diagnostics = Array.isArray(actual.normalizedDiagnostics) ? actual.normalizedDiagnostics : [];
  if (diagnostics.length !== 8) add(errors, "chk-c0-field-allowlist", `${pairing.comparisonId} numerical/cost diagnostic roster differs`);
  for (const [category, fields, map] of [
    ["numerical-observable", PHASE10_C0_NUMERICAL_FIELDS, expected.numericalDeltas],
    ["execution-cost", PHASE10_C0_COST_FIELDS, expected.costDeltas],
  ] as const) {
    for (const fieldId of fields) {
      const matches = diagnostics.filter((value) => {
        if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
        const row = value as JsonObject;
        return row.category === category && row.fieldId === fieldId;
      });
      if (matches.length !== 1) {
        add(errors, category === "execution-cost" ? "chk-c0-cost-separation" : "chk-c0-independent-rederivation", `${pairing.comparisonId} ${category} ${fieldId} roster differs`);
        continue;
      }
      const diagnostic = matches[0] as JsonObject;
      try {
        exactKeys(diagnostic, ["category", "fieldId", "valueA", "valueB", "normalizedAbsoluteDelta", "availability", "unavailableReason"], `${pairing.comparisonId} diagnostic ${fieldId}`);
      } catch (error) {
        add(errors, "chk-c0-field-allowlist", error instanceof Error ? error.message : "diagnostic fields differ");
        continue;
      }
      const delta = map.get(fieldId) ?? null;
      const expectedValueA = expected.rowA?.[fieldId as keyof Phase10C0Row] ?? null;
      const expectedValueB = expected.rowB?.[fieldId as keyof Phase10C0Row] ?? null;
      if (
        diagnostic.valueA !== expectedValueA || diagnostic.valueB !== expectedValueB ||
        diagnostic.normalizedAbsoluteDelta !== delta ||
        diagnostic.availability !== (delta === null ? "unavailable" : "defined") ||
        diagnostic.unavailableReason !== (delta === null ? "one or both exact persisted operands are unavailable" : null)
      ) add(errors, "chk-c0-independent-rederivation", `${pairing.comparisonId} ${fieldId} normalized delta differs`);
    }
  }
  const categorical = Array.isArray(actual.categoricalDiagnostics) ? actual.categoricalDiagnostics : [];
  if (categorical.length !== 1) add(errors, "chk-c0-field-allowlist", `${pairing.comparisonId} stopReason diagnostic roster differs`);
  else {
    const item = object(categorical[0], `${pairing.comparisonId} stopReason diagnostic`);
    try {
      exactKeys(item, ["fieldId", "valueA", "valueB", "disagreement", "availability", "unavailableReason"], `${pairing.comparisonId} stopReason diagnostic`);
    } catch (error) {
      add(errors, "chk-c0-field-allowlist", error instanceof Error ? error.message : "stopReason diagnostic fields differ");
    }
    if (
      item.fieldId !== "stopReason" || item.valueA !== (expected.rowA?.stopReason ?? null) ||
      item.valueB !== (expected.rowB?.stopReason ?? null) || item.disagreement !== expected.stopReasonDisagreement ||
      item.availability !== (expected.stopReasonDisagreement === null ? "unavailable" : "defined") ||
      item.unavailableReason !== (expected.stopReasonDisagreement === null ? "one or both exact persisted operands are unavailable" : null)
    ) {
      add(errors, "chk-c0-independent-rederivation", `${pairing.comparisonId} stopReason disagreement differs`);
    }
  }
}

function expectedSpacing(
  comparisons: readonly ExpectedComparison[],
  dxUm: 0.7 | 0.35,
  defects: readonly { readonly code: string; readonly detail: string }[],
): StrictJson {
  const domain = comparisons.filter((comparison) => comparison.pairing.kind === "domain" && comparison.pairing.domainSpacingDxUm === dxUm);
  const auxiliary = comparisons.filter((comparison) => comparison.pairing.kind === "auxiliary");
  const domainPass = domain.length === 16 && domain.every((comparison) => comparison.verdict === "pass");
  const auxiliaryPass = auxiliary.length === 32 && auxiliary.every((comparison) => comparison.verdict === "pass");
  const verdict = domainPass && auxiliaryPass && defects.length === 0 ? "pass" : "no-pass";
  const classes = [...domain, ...auxiliary].flatMap((comparison) => comparison.failureClass === null ? [] : [comparison.failureClass]);
  if (defects.length > 0) classes.push("infrastructure");
  const failing = [...domain, ...auxiliary].filter((comparison) => comparison.verdict !== "pass");
  const reasons = verdict === "pass" ? [] : [...new Set([
    ...failing.map((comparison) => `${comparison.pairing.comparisonId}: ${comparison.failureReasons.map((reason) => (reason as JsonObject).code).join(",")}`),
    ...defects.map((defect) => `${defect.code}: ${defect.detail}`),
  ])].sort(phase10C0Lexical);
  return strictJsonSnapshot({
    dxUm,
    domainComparisonCount: 16,
    domainPass,
    auxiliaryComparisonCount: 32,
    auxiliaryPass,
    verdict,
    noPassClass: independentFailureClass(classes),
    reasons,
  });
}

function expectedHistoricalCrossCheck(
  bytes: Uint8Array,
  parsed: Phase10C0ParsedRows,
  spacings: readonly StrictJson[],
  overallVerdict: "pass" | "no-pass",
  overallNoPassClass: Phase10C0FailureClass | null,
): StrictJson {
  let report: JsonObject;
  try {
    report = object(phase10C0ParsePrettyJson(bytes, "historical Phase 6 report"), "historical Phase 6 report");
  } catch (error) {
    return strictJsonSnapshot({
      status: "unavailable",
      differences: [error instanceof Error ? error.message : "historical report could not be parsed"],
    });
  }
  const differences: string[] = [];
  for (const [field, expected] of [
    ["overallVerdict", overallVerdict],
    ["overallNoPassClass", overallNoPassClass],
    ["expectedRowCount", 80],
    ["presentExpectedRowCount", parsed.rowsById.size],
  ] as const) if (report[field] !== expected) differences.push(`${field} differs`);
  for (const [field, expected] of [["missingRowIds", parsed.missingRowIds], ["unexpectedRowIds", parsed.unexpectedRowIds]] as const) {
    if (!same(report[field], expected)) differences.push(`${field} differs`);
  }
  if (!Array.isArray(report.spacings)) {
    differences.push("spacings is unavailable");
  } else {
    for (const spacingValue of spacings) {
      const spacing = object(spacingValue, "expected spacing");
      const matches = report.spacings.filter((value) =>
        value !== null && typeof value === "object" && !Array.isArray(value) &&
        (value as JsonObject).dxUm === spacing.dxUm);
      if (matches.length !== 1) {
        differences.push(`spacing ${String(spacing.dxUm)} roster differs`);
        continue;
      }
      const actual = matches[0] as JsonObject;
      for (const field of ["domainPass", "auxiliaryPass", "verdict", "noPassClass"] as const) {
        if (actual[field] !== spacing[field]) differences.push(`spacing ${String(spacing.dxUm)} ${field} differs`);
      }
    }
  }
  return strictJsonSnapshot({
    status: differences.length === 0 ? "agree" : "disagree",
    differences: [...new Set(differences)].sort(phase10C0Lexical),
  });
}

function validateAnalysis(
  request: Phase10C0EvaluateRequest,
  parsed: Phase10C0ParsedRows,
  expectedComparisons: readonly ExpectedComparison[],
  expectedDefects: readonly Phase10C0ArtifactDefect[],
  errors: Map<Phase10C0DeriveCheckId, string[]>,
): JsonObject | null {
  let analysis: JsonObject;
  try {
    analysis = object(phase10C0ParsePrettyJson(request.candidate.analysisBytes, "C0 analysis"), "C0 analysis");
    exactKeys(analysis, [
      "schema", "protocolId", "rowsArtifact", "historicalReportArtifact", "comparisonsArtifact", "roster",
      "artifactDefects", "spacingResults", "overallVerdict", "overallNoPassClass", "numericalRanking",
      "costRanking", "categoricalDiagnostics", "unavailableGapIds", "historicalReportCrossCheck",
      "solverExecuted", "execution",
    ], "C0 analysis");
  } catch (error) {
    add(errors, "chk-c0-field-allowlist", error instanceof Error ? error.message : "analysis parse failed");
    return null;
  }
  if (analysis.schema !== "phase10-c0-analysis-v1" || analysis.protocolId !== PHASE10_C0_SCIENCE_PROTOCOL_ID) {
    add(errors, "chk-c0-independent-rederivation", "analysis identity differs");
  }
  const protocol = parsePhase10C0Protocol(request.scienceProtocolBytes);
  const rowsIdentity = phase10C0ArtifactIdentity(protocol.rowsArtifact.path, request.candidate.rowsBytes);
  const reportIdentity = phase10C0ArtifactIdentity(protocol.historicalReportArtifact.path, request.historicalReportBytes);
  const comparisonsIdentity = phase10C0ArtifactIdentity(PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path, request.candidate.comparisonsBytes);
  if (!same(analysis.rowsArtifact, rowsIdentity) || !same(analysis.historicalReportArtifact, reportIdentity) || !same(analysis.comparisonsArtifact, comparisonsIdentity)) {
    add(errors, "chk-c0-independent-rederivation", "analysis artifact identity binding differs from reopened bytes");
  }
  let roster: JsonObject | null = null;
  try {
    roster = object(analysis.roster, "analysis roster");
    exactKeys(roster, ["expectedRowCount", "presentExpectedRowCount", "missingRowIds", "unexpectedRowIds", "duplicateRowIds", "expectedPairingCount", "emittedPairingCount", "rowIdRosterSha256", "pairingRosterSha256"], "analysis roster");
  } catch (error) {
    add(errors, "chk-c0-row-roster", error instanceof Error ? error.message : "analysis roster differs");
  }
  if (roster !== null) {
    const expectedRoster = {
      expectedRowCount: 80,
      presentExpectedRowCount: parsed.rowsById.size,
      missingRowIds: parsed.missingRowIds,
      unexpectedRowIds: parsed.unexpectedRowIds,
      duplicateRowIds: parsed.duplicateRowIds,
      expectedPairingCount: 64,
      emittedPairingCount: 64,
      rowIdRosterSha256: "560b19895d883e77dee2a3ea889d45684aa9188ba247fc1f2fcbbb8a0c537593",
      pairingRosterSha256: "90016bf4f3d3268f83409a760146ece6110626042c83e4e33a980b44d2a52216",
    };
    if (!same(roster, expectedRoster)) add(errors, "chk-c0-row-roster", "analysis roster differs from reopened rows and registered pairings");
  }
  if (!same(analysis.artifactDefects, expectedDefects)) {
    add(errors, "chk-c0-independent-rederivation", "analysis artifact-defect roster differs from reopened input bytes");
  }
  const expectedSpacings = ([0.7, 0.35] as const).map((dxUm) =>
    expectedSpacing(expectedComparisons, dxUm, expectedDefects));
  const actualSpacings = Array.isArray(analysis.spacingResults) ? analysis.spacingResults : [];
  if (actualSpacings.length !== 2) add(errors, "chk-c0-all-spacings", "analysis spacing roster differs from two registered spacings");
  for (const [index, expected] of expectedSpacings.entries()) {
    const actual = actualSpacings[index];
    if (actual === null || typeof actual !== "object" || Array.isArray(actual)) {
      add(errors, "chk-c0-all-spacings", `analysis spacing ${index} is malformed`);
      continue;
    }
    const row = actual as JsonObject;
    try {
      exactKeys(row, ["dxUm", "domainComparisonCount", "domainPass", "auxiliaryComparisonCount", "auxiliaryPass", "verdict", "noPassClass", "reasons"], `analysis spacing ${index}`);
    } catch (error) {
      add(errors, "chk-c0-all-spacings", error instanceof Error ? error.message : `analysis spacing ${index} fields differ`);
    }
    if (!same(row, expected)) add(errors, "chk-c0-all-spacings", `analysis spacing ${String((expected as JsonObject).dxUm)} differs from independent re-derivation`);
  }
  const spacingVerdicts = expectedSpacings.map((spacing) => (spacing as JsonObject).verdict as "pass" | "no-pass");
  const expectedOverall = independentEverySpacing(spacingVerdicts);
  const expectedOverallClass = independentFailureClass(expectedSpacings.flatMap((spacing) => {
    const value = (spacing as JsonObject).noPassClass;
    return value === null ? [] : [value as Phase10C0FailureClass];
  }));
  if (analysis.overallVerdict !== expectedOverall || analysis.overallNoPassClass !== expectedOverallClass) {
    add(errors, "chk-c0-all-spacings", "analysis overall verdict is not the authoritative every-spacing reduction");
    add(errors, "chk-c0-independent-rederivation", "producer overall verdict differs from independent re-derivation");
  }
  const expectedNumerical = expectedRanking(expectedComparisons, PHASE10_C0_NUMERICAL_FIELDS, "numerical");
  const expectedCost = expectedRanking(expectedComparisons, PHASE10_C0_COST_FIELDS, "cost");
  if (!same(analysis.numericalRanking, expectedNumerical)) add(errors, "chk-c0-independent-rederivation", "numerical ranking differs from reopened row values and registered error-source groups");
  if (!same(analysis.costRanking, expectedCost)) add(errors, "chk-c0-cost-separation", "execution-cost ranking differs or enters the numerical rank");
  const categoricalDefined = expectedComparisons.filter((comparison) => comparison.stopReasonDisagreement !== null);
  const categoricalDisagreements = categoricalDefined.filter((comparison) => comparison.stopReasonDisagreement === 1);
  const expectedCategorical = [{
    fieldId: "stopReason",
    comparisonCount: 64,
    definedCount: categoricalDefined.length,
    disagreementCount: categoricalDisagreements.length,
    maxDisagreement: categoricalDefined.length === 0 ? null : categoricalDisagreements.length === 0 ? 0 : 1,
    witnessPairId: categoricalDisagreements.length === 0
      ? null
      : categoricalDisagreements.map((comparison) => comparison.pairing.comparisonId).sort(phase10C0Lexical)[0]!,
  }];
  if (!same(analysis.categoricalDiagnostics, expectedCategorical)) {
    add(errors, "chk-c0-independent-rederivation", "categorical stopReason summary differs from reopened rows");
  }
  if (!same(analysis.unavailableGapIds, PHASE10_C0_GAP_IDS)) add(errors, "chk-c0-field-allowlist", "analysis unavailable gap roster differs");
  const expectedCrossCheck = expectedHistoricalCrossCheck(
    request.historicalReportBytes,
    parsed,
    expectedSpacings,
    expectedOverall,
    expectedOverallClass,
  );
  if (!same(analysis.historicalReportCrossCheck, expectedCrossCheck)) {
    add(errors, "chk-c0-independent-rederivation", "historical report cross-check differs from reopened cross-check bytes");
  }
  if (analysis.solverExecuted !== false) add(errors, "chk-c0-no-solver", "analysis claims solver execution");
  let productionExecution: Phase10C0ExecutionProvenance | null = null;
  try {
    productionExecution = analysis.execution as unknown as Phase10C0ExecutionProvenance;
    phase10C0AssertBoundExecution(productionExecution, request.preflightReceiptBytes, "c0-derive");
  } catch (error) {
    add(errors, "chk-c0-no-solver", error instanceof Error ? error.message : "producer execution provenance differs");
  }
  if (productionExecution !== null) {
    if (/solver-cpu|grow-lk|gate6|solver/u.test(productionExecution.command)) add(errors, "chk-c0-no-solver", "producer command crosses the no-solver boundary");
  }
  return analysis;
}

function validateGaps(
  request: Phase10C0EvaluateRequest,
  errors: Map<Phase10C0DeriveCheckId, string[]>,
): void {
  try {
    const gaps = object(phase10C0ParsePrettyJson(request.candidate.gapsBytes, "C0 gaps"), "C0 gaps");
    exactKeys(gaps, ["schema", "protocolId", "rowsArtifact", "persistedFieldIds", "independentlyDerivableFieldIds", "gaps", "targetObservationOperatorStatus", "claimBoundary"], "C0 gaps");
    const protocol = parsePhase10C0Protocol(request.scienceProtocolBytes);
    const expected = {
      schema: "phase10-c0-gap-report-v1",
      protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
      rowsArtifact: phase10C0ArtifactIdentity(protocol.rowsArtifact.path, request.candidate.rowsBytes),
      persistedFieldIds: [...PHASE10_C0_ROW_FIELDS].sort(phase10C0Lexical),
      independentlyDerivableFieldIds: ["attachedCountCriterionPass", "attachedCountRelativeDifference", "comparisonVerdict", "failureClass", "habitClass", "habitCriterionPass", "normalizedAbsoluteDelta", "stopReasonDisagreement"].sort(phase10C0Lexical),
      gaps: independentGapItems(),
      targetObservationOperatorStatus: "not-defined-in-selected-package",
      claimBoundary: "inventory-only",
    };
    if (!same(gaps, expected)) add(errors, "chk-c0-field-allowlist", "gap report does not exactly refuse all ten unavailable field groups");
  } catch (error) {
    add(errors, "chk-c0-field-allowlist", error instanceof Error ? error.message : "gap report parse failed");
  }
}

function validateHistoricalLimit(
  request: Phase10C0EvaluateRequest,
  errors: Map<Phase10C0DeriveCheckId, string[]>,
): void {
  try {
    const limit = object(phase10C0ParsePrettyJson(request.candidate.historicalLimitBytes, "C0 historical limit"), "C0 historical limit");
    exactKeys(limit, ["schema", "protocolId", "historicalReportArtifact", "historicalScript", "issue", "disposition", "historicalReportUse", "phase6EvidenceMutationAuthorized", "claimLimits"], "C0 historical limit");
    const protocol = parsePhase10C0Protocol(request.scienceProtocolBytes);
    const expected = {
      schema: "phase10-c0-historical-limit-v1",
      protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
      historicalReportArtifact: phase10C0ArtifactIdentity(protocol.historicalReportArtifact.path, request.historicalReportBytes),
      historicalScript: {
        path: "app/scripts/phase6-wp2-ladder-independent.mjs",
        gitCommit: protocol.adoptionCommit,
        byteLength: 8_149,
        sha256: "7a9371917dbc56005b4e612c0637dce1cdc0156230a6495bd0d4042d3811181a",
      },
      issue: {
        issueId: "c0-historical-any-spacing-aggregation",
        location: "app/scripts/phase6-wp2-ladder-independent.mjs:177",
        observedReduction: "any-spacing-some",
        authoritativeReduction: "all-spacings-every",
        consequence: "The historical sibling verifier could pass when only one spacing passes; both historical spacings failed, so its published verdict did not change.",
      },
      disposition: "excluded-as-authority",
      historicalReportUse: "cross-check-only",
      phase6EvidenceMutationAuthorized: false,
      claimLimits: [
        "The historical script and report do not supply the Phase 10 verdict.",
        "C0 does not establish numerical accuracy, a robust habit, a target score, or quantitative validation.",
        "Phase 6 evidence bytes remain immutable.",
      ],
    };
    if (!same(limit, expected)) add(errors, "chk-c0-independent-rederivation", "historical verifier limitation is not exactly bound and excluded as authority");
  } catch (error) {
    add(errors, "chk-c0-independent-rederivation", error instanceof Error ? error.message : "historical limit parse failed");
  }
}

function core(request: Phase10C0EvaluateRequest): CoreEvaluation {
  const errors = new Map(PHASE10_C0_DERIVE_CHECK_IDS.map((checkId) => [checkId, [] as string[]] as const));
  parsePhase10C0Protocol(request.scienceProtocolBytes);
  let parsed: Phase10C0ParsedRows;
  try {
    parsed = independentlyParseRows(request.candidate.rowsBytes);
  } catch (error) {
    fail(error instanceof Error ? error.message : "rows parser failed");
  }
  for (const defect of parsed.defects) add(errors, "chk-c0-row-roster", `${defect.code}: ${defect.detail}`);
  const protocol = parsePhase10C0Protocol(request.scienceProtocolBytes);
  const rowsIdentity = phase10C0ArtifactIdentity(protocol.rowsArtifact.path, request.candidate.rowsBytes);
  const reportIdentity = phase10C0ArtifactIdentity(protocol.historicalReportArtifact.path, request.historicalReportBytes);
  const expectedDefects: Phase10C0ArtifactDefect[] = [...parsed.defects];
  if (request.enforceFrozenInputIdentities !== false) {
    if (rowsIdentity.byteLength !== protocol.rowsArtifact.byteLength || rowsIdentity.sha256 !== protocol.rowsArtifact.sha256) {
      add(errors, "chk-c0-row-roster", "rows byte identity differs from the frozen protocol");
      expectedDefects.push({ code: "c0-rows-byte-identity", scope: "input", rowId: null, lineNumber: null, detail: "rows bytes differ from the frozen input identity" });
    }
    if (reportIdentity.byteLength !== protocol.historicalReportArtifact.byteLength || reportIdentity.sha256 !== protocol.historicalReportArtifact.sha256) {
      add(errors, "chk-c0-independent-rederivation", "historical cross-check byte identity differs from the frozen protocol");
      expectedDefects.push({ code: "c0-historical-report-byte-identity", scope: "input", rowId: null, lineNumber: null, detail: "historical report bytes differ from the frozen cross-check identity" });
    }
  }
  expectedDefects.sort((left, right) => {
    return phase10C0Lexical(`${left.code}\u0000${left.rowId ?? ""}`, `${right.code}\u0000${right.rowId ?? ""}`);
  });
  let comparisonRows: readonly JsonObject[] = [];
  try {
    comparisonRows = jsonl(request.candidate.comparisonsBytes, "C0 comparisons");
  } catch (error) {
    add(errors, "chk-c0-comparison-roster", error instanceof Error ? error.message : "comparison parse failed");
  }
  const actualIds = comparisonRows.map((row) => typeof row.comparisonId === "string" ? row.comparisonId : "");
  const expectedIds = parsed.pairings.map((pairing) => pairing.comparisonId);
  if (actualIds.length !== 64 || new Set(actualIds).size !== 64 || JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    add(errors, "chk-c0-comparison-roster", "comparison JSONL is not the exact sorted 64-pair roster");
  }
  const expectedComparisons = parsed.pairings.map((pairing) =>
    expectedComparison(pairing, parsed, expectedDefects));
  const byId = new Map(comparisonRows.map((row) => [typeof row.comparisonId === "string" ? row.comparisonId : "", row] as const));
  for (const expected of expectedComparisons) {
    const actual = byId.get(expected.pairing.comparisonId);
    if (actual === undefined) continue;
    validateComparison(actual, expected, errors);
  }
  validateAnalysis(request, parsed, expectedComparisons, expectedDefects, errors);
  validateGaps(request, errors);
  validateHistoricalLimit(request, errors);
  assertEvaluatorExecution(request);
  return Object.freeze({
    errorsByCheck: new Map([...errors.entries()].map(([checkId, values]) => [checkId, Object.freeze([...new Set(values)].sort(phase10C0Lexical))] as const)),
    parsedRows: parsed,
  });
}

function bytesForMutation(candidate: Phase10C0DeriveCandidateBytes, mutation: Phase10C0Mutation): Uint8Array {
  if (mutation.artifactId === "input-c0-rows") return candidate.rowsBytes;
  if (mutation.artifactId === "out-c0-analysis") return candidate.analysisBytes;
  if (mutation.artifactId === "out-c0-comparisons") return candidate.comparisonsBytes;
  fail(`unsupported mutation artifact ${mutation.artifactId}`);
}

interface IndependentMutationExpectation {
  readonly artifactId: string;
  readonly registeredPath: string;
  readonly mutatedBytes: Uint8Array;
  readonly semanticTarget: StrictJson;
  readonly candidateField: keyof Phase10C0DeriveCandidateBytes;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function independentMutationExpectation(
  controlId: Phase10C0NegativeControlId,
  candidate: Phase10C0DeriveCandidateBytes,
): IndependentMutationExpectation {
  if (controlId === "nc-c0-missing-row" || controlId === "nc-c0-duplicate-or-truncated") {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(candidate.rowsBytes);
    if (text.includes("\r") || !text.endsWith("\n")) fail(`${controlId} source rows do not have exact LF JSONL bytes`);
    const lines = text.slice(0, -1).split("\n");
    if (lines.length !== 80) fail(`${controlId} source does not have the exact 80-row roster`);
    const first = object(strictJsonSnapshot(JSON.parse(lines[0]!) as unknown), `${controlId} first row`);
    if (typeof first.rowId !== "string") fail(`${controlId} first row lacks rowId`);
    const missing = controlId === "nc-c0-missing-row";
    return Object.freeze({
      artifactId: "input-c0-rows",
      registeredPath: "evidence/phase6-wp2-ladder/rows.jsonl",
      mutatedBytes: new TextEncoder().encode(`${(missing ? lines.slice(1) : [lines[0]!, ...lines]).join("\n")}\n`),
      semanticTarget: strictJsonSnapshot({ mutation: missing ? "drop-row" : "duplicate-row", rowId: first.rowId }),
      candidateField: "rowsBytes",
    });
  }
  if (controlId === "nc-c0-forbidden-field" || controlId === "nc-c0-forged-producer-verdict") {
    const analysis = object(phase10C0ParsePrettyJson(candidate.analysisBytes, `${controlId} analysis`), `${controlId} analysis`);
    if (controlId === "nc-c0-forbidden-field") {
      return Object.freeze({
        artifactId: "out-c0-analysis",
        registeredPath: PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path,
        mutatedBytes: phase10C0PrettyJsonBytes({ ...analysis, occupancyMask: "forbidden inferred field" }),
        semanticTarget: strictJsonSnapshot({ mutation: "add-forbidden-field", field: "occupancyMask" }),
        candidateField: "analysisBytes",
      });
    }
    if (analysis.overallVerdict !== "pass" && analysis.overallVerdict !== "no-pass") fail("forged-verdict source lacks a verdict");
    const replacement = analysis.overallVerdict === "pass" ? "no-pass" : "pass";
    return Object.freeze({
      artifactId: "out-c0-analysis",
      registeredPath: PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path,
      mutatedBytes: phase10C0PrettyJsonBytes({
        ...analysis,
        overallVerdict: replacement,
        overallNoPassClass: replacement === "pass" ? null : "criterion",
      }),
      semanticTarget: strictJsonSnapshot({ mutation: "forge-producer-verdict", before: analysis.overallVerdict, after: replacement }),
      candidateField: "analysisBytes",
    });
  }
  const comparisons = [...jsonl(candidate.comparisonsBytes, `${controlId} comparisons`)];
  if (controlId === "nc-c0-operand-echo") {
    const first = comparisons[0];
    if (first === undefined) fail("operand-echo source lacks comparisons");
    const rowA = object(first.rowA, "operand-echo first rowA");
    if (typeof rowA.tempC !== "number") fail("operand-echo first rowA.tempC differs");
    comparisons[0] = Object.freeze({ ...first, rowA: { ...rowA, tempC: rowA.tempC + 1 } });
    return Object.freeze({
      artifactId: "out-c0-comparisons",
      registeredPath: PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path,
      mutatedBytes: phase10C0JsonlBytes(comparisons),
      semanticTarget: strictJsonSnapshot({ mutation: "rewrite-operand-echo", field: "rowA.tempC" }),
      candidateField: "comparisonsBytes",
    });
  }
  const failedSpacingDxUm = controlId === "nc-c0-coarse-fail-fine-pass" ? 0.7 : 0.35;
  for (let index = 0; index < comparisons.length; index += 1) {
    comparisons[index] = Object.freeze({
      ...comparisons[index]!,
      habitCriterionPass: true,
      attachedCountCriterionPass: true,
      comparisonVerdict: "pass",
      failureClass: null,
      failureReasons: [],
    });
  }
  const failedIndex = comparisons.findIndex((row) => row.kind === "domain" && row.domainSpacingDxUm === failedSpacingDxUm);
  if (failedIndex < 0) fail(`${controlId} source lacks its attacked spacing`);
  comparisons[failedIndex] = Object.freeze({
    ...comparisons[failedIndex]!,
    habitCriterionPass: false,
    comparisonVerdict: "no-pass",
    failureClass: "criterion",
    failureReasons: [{
      code: "c0-negative-control-spacing-failure",
      failureClass: "criterion",
      detail: `negative control makes only spacing ${failedSpacingDxUm} no-pass`,
    }],
  });
  return Object.freeze({
    artifactId: "out-c0-comparisons",
    registeredPath: PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path,
    mutatedBytes: phase10C0JsonlBytes(comparisons),
    semanticTarget: strictJsonSnapshot({
      mutation: "single-spacing-no-pass",
      failedSpacingDxUm,
      expectedOtherSpacing: "pass",
      expectedOverall: "no-pass",
    }),
    candidateField: "comparisonsBytes",
  });
}

/** Independently proves the exact registered attack, including its target and untouched bytes. */
export function phase10C0ProveNegativeControlMutation(
  candidate: Phase10C0DeriveCandidateBytes,
  mutation: Phase10C0Mutation,
): boolean {
  try {
    const expected = independentMutationExpectation(mutation.negativeControlId, candidate);
    if (
      mutation.artifactId !== expected.artifactId || mutation.registeredPath !== expected.registeredPath ||
      !same(mutation.semanticTarget, expected.semanticTarget) ||
      !sameBytes(mutation.mutatedBytes, expected.mutatedBytes) ||
      !sameBytes(mutation.candidate[expected.candidateField], expected.mutatedBytes)
    ) return false;
    return (Object.keys(candidate) as (keyof Phase10C0DeriveCandidateBytes)[]).every((field) =>
      field === expected.candidateField || sameBytes(candidate[field], mutation.candidate[field]));
  } catch {
    return false;
  }
}

function semanticProjection(
  controlId: Phase10C0NegativeControlId,
  bytes: Uint8Array,
): StrictJson {
  try {
    if (controlId === "nc-c0-missing-row" || controlId === "nc-c0-duplicate-or-truncated") {
      const parsed = independentlyParseRows(bytes);
      return strictJsonSnapshot({
        presentExpectedRowCount: parsed.rowsById.size,
        missingRowIds: parsed.missingRowIds,
        duplicateRowIds: parsed.duplicateRowIds,
        defectCodes: [...new Set(parsed.defects.map((defect) => defect.code))].sort(phase10C0Lexical),
      });
    }
    if (controlId === "nc-c0-forbidden-field" || controlId === "nc-c0-forged-producer-verdict") {
      const analysis = object(phase10C0ParsePrettyJson(bytes, "mutated analysis"), "mutated analysis");
      return strictJsonSnapshot({
        fieldNames: Object.keys(analysis).sort(phase10C0Lexical),
        overallVerdict: analysis.overallVerdict,
        overallNoPassClass: analysis.overallNoPassClass,
      });
    }
    const comparisons = jsonl(bytes, "mutated comparisons");
    const domain = ([0.7, 0.35] as const).map((dxUm) => ({
      dxUm,
      verdict: comparisons.filter((row) => row.kind === "domain" && row.domainSpacingDxUm === dxUm)
        .every((row) => row.comparisonVerdict === "pass") ? "pass" : "no-pass",
    }));
    const first = comparisons[0];
    return strictJsonSnapshot({
      spacingVerdicts: domain,
      overallVerdict: independentEverySpacing(domain.map((entry) => entry.verdict as "pass" | "no-pass")),
      firstRowATempC: first === undefined || first.rowA === null || typeof first.rowA !== "object" || Array.isArray(first.rowA)
        ? null
        : (first.rowA as JsonObject).tempC,
    });
  } catch (error) {
    return strictJsonSnapshot({ parseError: error instanceof Error ? error.message : "semantic projection failed" });
  }
}

function witness(artifactId: string, path: string, bytes: Uint8Array, projection: StrictJson): Phase10C0MutationWitness {
  const projectionBytes = new TextEncoder().encode(canonicalJson(projection));
  return Object.freeze({
    artifactId,
    path,
    byteLength: bytes.byteLength,
    sha256: phase10C0Sha256(bytes),
    semanticFingerprint: Object.freeze({ projection, sha256: phase10C0Sha256(projectionBytes) }),
  });
}

const CONTROL_FUNCTIONS: Readonly<Record<Phase10C0NegativeControlId, (candidate: Phase10C0DeriveCandidateBytes) => Phase10C0Mutation>> = Object.freeze({
  "nc-c0-coarse-fail-fine-pass": phase10C0CoarseFailFinePass,
  "nc-c0-duplicate-or-truncated": phase10C0DuplicateOrTruncatedRow,
  "nc-c0-fine-fail-coarse-pass": phase10C0FineFailCoarsePass,
  "nc-c0-forbidden-field": phase10C0ForbiddenField,
  "nc-c0-forged-producer-verdict": phase10C0ForgedProducerVerdict,
  "nc-c0-missing-row": phase10C0MissingRow,
  "nc-c0-operand-echo": phase10C0OperandEcho,
});

const CONTROL_CHECKS: Readonly<Record<Phase10C0NegativeControlId, Phase10C0DeriveCheckId>> = Object.freeze({
  "nc-c0-coarse-fail-fine-pass": "chk-c0-all-spacings",
  "nc-c0-duplicate-or-truncated": "chk-c0-row-roster",
  "nc-c0-fine-fail-coarse-pass": "chk-c0-all-spacings",
  "nc-c0-forbidden-field": "chk-c0-field-allowlist",
  "nc-c0-forged-producer-verdict": "chk-c0-independent-rederivation",
  "nc-c0-missing-row": "chk-c0-row-roster",
  "nc-c0-operand-echo": "chk-c0-operand-echo",
});

function executeControl(request: Phase10C0EvaluateRequest, controlId: Phase10C0NegativeControlId): Phase10C0NegativeControlResult {
  const mutation = CONTROL_FUNCTIONS[controlId](request.candidate);
  if (mutation.negativeControlId !== controlId) fail(`${controlId} mutation callable returned the wrong ID`);
  const beforeBytes = bytesForMutation(request.candidate, mutation);
  const beforeProjection = semanticProjection(controlId, beforeBytes);
  const afterProjection = semanticProjection(controlId, mutation.mutatedBytes);
  const beforeWitness = witness(mutation.artifactId, mutation.registeredPath, beforeBytes, beforeProjection);
  const afterWitness = witness(mutation.artifactId, mutation.registeredPath, mutation.mutatedBytes, afterProjection);
  const attacked = core({ ...request, candidate: mutation.candidate, executeNegativeControls: false, enforceFrozenInputIdentities: false });
  const owner = CONTROL_CHECKS[controlId];
  const ownerErrors = attacked.errorsByCheck.get(owner) ?? [];
  const errors: string[] = [];
  const mutationExecuted = beforeWitness.sha256 !== afterWitness.sha256 &&
    beforeWitness.semanticFingerprint.sha256 !== afterWitness.semanticFingerprint.sha256;
  if (!mutationExecuted) errors.push("mutation did not change both exact bytes and the independent semantic projection");
  const targetProved = phase10C0ProveNegativeControlMutation(request.candidate, mutation);
  if (!targetProved) errors.push("independent evaluator did not prove the exact named before-to-after mutation");
  const rejected = ownerErrors.length > 0 && targetProved;
  if (!rejected) errors.push(`${owner} did not reject the named mutation`);
  return Object.freeze({
    negativeControlId: controlId,
    mutationExecuted,
    rejected,
    beforeWitness,
    afterWitness,
    errors: Object.freeze(errors.sort(phase10C0Lexical)),
  });
}

/** Independent evaluator: reopens supplied bytes, ignores producer verdicts, and re-derives. */
export function independentlyEvaluatePhase10C0Derive(
  request: Phase10C0EvaluateRequest,
): Phase10C0DeriveEvaluation {
  const result = core(request);
  const checkResults = phase10C0DeriveCheckCaller((checkId): Phase10C0CheckResult => {
    const reasons = result.errorsByCheck.get(checkId) ?? [];
    return Object.freeze({
      checkId,
      verdict: reasons.length === 0 ? "pass" : "fail",
      reasons,
      witnessOutputIds: WITNESSES[checkId],
    });
  });
  const controlResults = request.executeNegativeControls === false
    ? []
    : PHASE10_C0_NEGATIVE_CONTROL_IDS.map((controlId) => executeControl(request, controlId));
  const aggregatePass = checkResults.every((entry) => entry.verdict === "pass") &&
    controlResults.length === PHASE10_C0_NEGATIVE_CONTROL_IDS.length &&
    controlResults.every((entry) => entry.mutationExecuted && entry.rejected && entry.errors.length === 0);
  const candidateArtifacts = [
    ["out-c0-analysis", request.candidate.analysisBytes],
    ["out-c0-comparisons", request.candidate.comparisonsBytes],
    ["out-c0-gaps", request.candidate.gapsBytes],
    ["out-c0-historical-limit", request.candidate.historicalLimitBytes],
  ] as const;
  const verifiedArtifacts = candidateArtifacts.map(([outputId, bytes]) => {
    const registration = PHASE10_C0_DERIVE_OUTPUTS[outputId];
    return Object.freeze({ outputId, ...phase10C0ArtifactIdentity(registration.path, bytes) });
  }).sort((left, right) => phase10C0Lexical(left.outputId, right.outputId));
  return Object.freeze({
    verifiedArtifacts: Object.freeze(verifiedArtifacts),
    checkResults: Object.freeze(checkResults),
    executedNegativeControlIds: request.executeNegativeControls === false
      ? Object.freeze([])
      : PHASE10_C0_NEGATIVE_CONTROL_IDS,
    negativeControlResults: Object.freeze(controlResults),
    terminalState: aggregatePass ? "complete" : "fail",
    aggregateVerdict: aggregatePass ? "pass" : "fail",
  });
}
