// Phase 8B S3 — independent verifier for the native full-history publication.
//
// Deliberate independence boundary: this module does not import the producer. It hashes the two
// archives, reparses byte-identical expanded mirrors through a separate parser, reconstructs every
// TSV row, and re-derives the metadata graph from the published bytes.

import {
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";

const OPERATOR = "phase8b-native-full-history-v1";
const HISTORY_SCHEMA = "phase8b-native-history-v1";
const LOCK_PATH = "research/phase6-heldout-candidate-lock.json";
const LOCK_SHA256 = "f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5";
const SELECTION_PATH = "evidence/phase8b-benchmark-selection-v1/selection.jsonl";
const SELECTION_SHA256 = "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537";
const METADATA_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"];
const IMPLEMENTATION_PATHS = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-corpus-local.ts",
  "runner/src/phase8-native-history.ts",
  "runner/src/phase8-native-history-verify.ts",
  "runner/test/phase8-native-history.test.ts",
] as const;
const MASS_HEADER = "sourceRowIndex\ttime_s\tmass_ratio\n";
const DIMENSION_HEADER =
  "sourceRowIndex\ttime_s\ta_um\tc_um\ta_error_min_um\tc_error_min_um\t" +
  "a_error_max_um\tc_error_max_um\trim_width_um\trim_error_min_um\trim_error_max_um\n";
const NUMBER_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8NativeVerifyArchiveSpec {
  readonly fileName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly memberRoot: string;
}

export interface Phase8NativeVerifyMassSpec {
  readonly runId: string;
  readonly sourceUnitId: string;
  readonly memberName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly rowCount: number;
}

export interface Phase8NativeVerifyDimensionSpec {
  readonly runId: string;
  readonly sourceUnitId: string;
  readonly memberName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly rowCount: number;
  readonly experimentHeader: string;
  readonly temperatureHeader: string;
  readonly supersaturationHeader: string;
  readonly pressureHeader: string;
  readonly tempC: number;
  readonly pressureHpa: number;
  readonly initialSupersaturationPercent: number;
  readonly forcingEvent: null | {
    readonly atSeconds: number;
    readonly supersaturationPercent: number;
    readonly previousRowTimeLexeme: string;
    readonly nextRowTimeLexeme: string;
  };
}

export interface Phase8NativeVerifyRegistration {
  readonly scope: "registered-20260812" | "test-fixture";
  readonly dataLogicalRoot: string;
  readonly harrisonArchive: Phase8NativeVerifyArchiveSpec;
  readonly dimensionArchive: Phase8NativeVerifyArchiveSpec;
  readonly massHistories: readonly Phase8NativeVerifyMassSpec[];
  readonly dimensionHistories: readonly Phase8NativeVerifyDimensionSpec[];
  readonly excludedMassMember: {
    readonly memberName: string;
    readonly byteLength: number;
    readonly sha256: string;
  };
  readonly requiredAbsentConditionFragment: string;
  readonly expectedTotals: {
    readonly historyCount: number;
    readonly massHistoryCount: number;
    readonly dimensionHistoryCount: number;
    readonly rowCount: number;
    readonly selectedSourceMemberBytes: number;
  };
}

export interface Phase8NativePublishedBytes {
  readonly metadataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly dataArtifacts: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8NativeVerifyInputs {
  readonly registration: Phase8NativeVerifyRegistration;
  readonly harrisonArchiveBytes: Uint8Array;
  readonly dimensionArchiveBytes: Uint8Array;
  readonly conditionLockBytes: Uint8Array;
  readonly selectionBytes: Uint8Array;
  /** Exact full member paths from independently expanded archive mirrors, including excluded 625. */
  readonly mirrors: ReadonlyMap<string, Uint8Array>;
  readonly implementation: ReadonlyMap<string, Uint8Array>;
  readonly published: Phase8NativePublishedBytes;
}

export interface Phase8NativeVerification {
  readonly ok: true;
  readonly historyCount: number;
  readonly rowCount: number;
  readonly sourceLexemeRowsCompared: number;
  readonly archiveCountHashed: 2;
  readonly mirrorCountHashed: number;
  readonly normalizedDataBytes: number;
}

interface LockCondition {
  readonly pressurePa: number;
  readonly tempC: number;
  readonly tempRangeC: number;
  readonly sigmaIcePercent: number;
  readonly sigmaIceRangePercent: number;
  readonly initialRadiusUm: number;
  readonly initialRadiusRangeUm: number;
}

interface IndependentParse {
  readonly tsv: Uint8Array;
  readonly rowCount: number;
  readonly firstTimeLexeme: string;
  readonly lastTimeLexeme: string;
  readonly uniqueTimeCount?: number;
  readonly adjacentRepeatedTimeCount?: number;
  readonly maximumTimeMultiplicity?: number;
  readonly adjacentMassDecreaseCount?: number;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...expected].sort())) {
    throw new Error(`${label} keys differ`);
  }
}

function decodeLf(bytes: Uint8Array, label: string): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${label} is not LF-terminated text`);
  return text;
}

function numberToken(token: string, label: string): number {
  if (!NUMBER_TOKEN.test(token)) throw new Error(`${label} is not a decimal token`);
  const value = Number(token);
  if (!Number.isFinite(value)) throw new Error(`${label} is not finite`);
  return value;
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function assertPin(bytes: Uint8Array, spec: { readonly byteLength: number; readonly sha256: string }, label: string): void {
  if (bytes.byteLength !== spec.byteLength || sha256Bytes(bytes) !== spec.sha256) {
    throw new Error(`${label} byte/hash pin differs`);
  }
}

function descriptor(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { path, format, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

/** Separate mass parser; intentionally shares no code with the producer. */
function independentlyParseMass(bytes: Uint8Array, label: string): IndependentParse {
  const sourceRows = decodeLf(bytes, label).slice(0, -1).split("\n");
  if (sourceRows.length === 0) throw new Error(`${label} has no source rows`);
  const normalized = [MASS_HEADER.slice(0, -1)];
  const multiplicity = new Map<number, number>();
  let previousTime = -Infinity;
  let previousMass = -Infinity;
  let repeats = 0;
  let decreases = 0;
  let first = "";
  let last = "";
  for (let row = 0; row < sourceRows.length; row++) {
    const raw = sourceRows[row];
    const tokens = raw.trim().split(/\s+/);
    if (raw.trim() === "" || tokens.length !== 6) throw new Error(`${label} row ${row + 1} shape differs`);
    const numeric = tokens.map((token, column) => numberToken(token, `${label} row ${row + 1} column ${column + 1}`));
    const time = numeric[2];
    const mass = numeric[4];
    if (time < 0 || time < previousTime) throw new Error(`${label} time decreases at row ${row + 1}`);
    if (mass <= 0) throw new Error(`${label} mass is not positive at row ${row + 1}`);
    if (row > 0 && time === previousTime) repeats++;
    if (row > 0 && mass < previousMass) decreases++;
    multiplicity.set(time, (multiplicity.get(time) ?? 0) + 1);
    first ||= tokens[2];
    last = tokens[2];
    normalized.push(`${row + 1}\t${tokens[2]}\t${tokens[4]}`);
    previousTime = time;
    previousMass = mass;
  }
  return {
    tsv: new TextEncoder().encode(`${normalized.join("\n")}\n`),
    rowCount: sourceRows.length,
    firstTimeLexeme: first,
    lastTimeLexeme: last,
    uniqueTimeCount: multiplicity.size,
    adjacentRepeatedTimeCount: repeats,
    maximumTimeMultiplicity: Math.max(...multiplicity.values()),
    adjacentMassDecreaseCount: decreases,
  };
}

/** Separate dimension parser; intentionally shares no code with the producer. */
function independentlyParseDimension(
  bytes: Uint8Array,
  spec: Phase8NativeVerifyDimensionSpec,
  label: string,
): IndependentParse {
  const lines = decodeLf(bytes, label).slice(0, -1).split("\n");
  const headers = [
    spec.experimentHeader,
    spec.temperatureHeader,
    spec.supersaturationHeader,
    spec.pressureHeader,
    "",
    "Columns:   time (sec) dimensions (micron)",
    "time, a, c, Delta a min, Delta c min, Delta a max, Delta c max, ring width, Delta ring min, Delta ring max",
  ];
  if (canonicalJson(lines.slice(0, 7)) !== canonicalJson(headers)) throw new Error(`${label} source header differs`);
  const rows = lines.slice(7);
  if (rows.length === 0) throw new Error(`${label} has no numeric rows`);
  const normalized = [DIMENSION_HEADER.slice(0, -1)];
  let previousTime = -Infinity;
  let first = "";
  let last = "";
  const timeLexemes: string[] = [];
  for (let row = 0; row < rows.length; row++) {
    const tokens = rows[row].trim().split(/\s+/);
    if (rows[row].trim() === "" || tokens.length !== 10) throw new Error(`${label} numeric row ${row + 1} shape differs`);
    const numeric = tokens.map((token, column) => numberToken(token, `${label} numeric row ${row + 1} column ${column + 1}`));
    if (numeric[0] < 0 || numeric[0] < previousTime || numeric.slice(1).some((value) => value < 0)) {
      throw new Error(`${label} numeric domain differs at row ${row + 1}`);
    }
    first ||= tokens[0];
    last = tokens[0];
    timeLexemes.push(tokens[0]);
    normalized.push(`${row + 1}\t${tokens.join("\t")}`);
    previousTime = numeric[0];
  }
  if (spec.forcingEvent !== null) {
    const event = spec.forcingEvent;
    if (timeLexemes.includes(String(event.atSeconds)) ||
        !timeLexemes.includes(event.previousRowTimeLexeme) || !timeLexemes.includes(event.nextRowTimeLexeme) ||
        Number(event.previousRowTimeLexeme) >= event.atSeconds || Number(event.nextRowTimeLexeme) <= event.atSeconds) {
      throw new Error(`${label} forcing-event bracket differs`);
    }
  }
  return {
    tsv: new TextEncoder().encode(`${normalized.join("\n")}\n`),
    rowCount: rows.length,
    firstTimeLexeme: first,
    lastTimeLexeme: last,
  };
}

function independentlyParseLock(
  bytes: Uint8Array,
  registration: Phase8NativeVerifyRegistration,
): ReadonlyMap<string, LockCondition> {
  if (registration.scope === "registered-20260812" && sha256Bytes(bytes) !== LOCK_SHA256) {
    throw new Error("independent condition-lock hash differs");
  }
  const root = object(JSON.parse(decodeLf(bytes, "condition lock")), "condition lock");
  const candidate = object(root.harrisonCandidate, "condition lock Harrison candidate");
  const extraction = object(candidate.extraction, "condition lock extraction");
  if (root.schema !== "phase6-heldout-candidate-lock-v1" || candidate.status !== "source-locked-not-scoreable" ||
      extraction.columns !== 6 || extraction.timeColumnZeroBased !== 2 ||
      extraction.massRatioColumnZeroBased !== 4 || extraction.requireNondecreasingTime !== true ||
      extraction.requirePositiveMassRatio !== true) {
    throw new Error("condition-lock parsing contract differs");
  }
  const excluded = array(candidate.excludedMembers, "excluded members")
    .map((entry) => object(entry, "excluded member"));
  const excludedRecord = excluded.find((entry) => entry.name === registration.excludedMassMember.memberName);
  if (excludedRecord === undefined ||
      excludedRecord.byteLength !== registration.excludedMassMember.byteLength ||
      excludedRecord.sha256 !== registration.excludedMassMember.sha256) {
    throw new Error("excluded mass member pin is not preserved in the lock");
  }
  const absences = array(candidate.requiredAbsence, "required absences");
  if (!absences.some((entry) => String(object(entry, "required absence").condition).includes(registration.requiredAbsentConditionFragment))) {
    throw new Error("unmatched corrected condition is not preserved in the lock");
  }
  const results = new Map<string, LockCondition>();
  for (const value of array(candidate.traces, "condition-lock traces")) {
    const trace = object(value, "condition-lock trace");
    const id = String(trace.id);
    const spec = registration.massHistories.find((item) => item.runId === id);
    if (spec === undefined || trace.member !== spec.memberName || trace.byteLength !== spec.byteLength || trace.sha256 !== spec.sha256) {
      throw new Error(`condition-lock trace roster/pin differs for ${id}`);
    }
    if (results.has(id)) throw new Error(`condition lock duplicates ${id}`);
    const keys = ["pressurePa", "tempC", "tempRangeC", "sigmaIcePercent", "sigmaIceRangePercent", "initialRadiusUm", "initialRadiusRangeUm"] as const;
    for (const key of keys) if (typeof trace[key] !== "number" || !Number.isFinite(trace[key])) throw new Error(`condition ${id}.${key} differs`);
    results.set(id, {
      pressurePa: trace.pressurePa as number,
      tempC: trace.tempC as number,
      tempRangeC: trace.tempRangeC as number,
      sigmaIcePercent: trace.sigmaIcePercent as number,
      sigmaIceRangePercent: trace.sigmaIceRangePercent as number,
      initialRadiusUm: trace.initialRadiusUm as number,
      initialRadiusRangeUm: trace.initialRadiusRangeUm as number,
    });
  }
  if (results.size !== registration.massHistories.length) throw new Error("condition-lock selected trace count differs");
  return results;
}

function independentlyVerifySelection(
  bytes: Uint8Array,
  registration: Phase8NativeVerifyRegistration,
): void {
  if (registration.scope === "registered-20260812" && sha256Bytes(bytes) !== SELECTION_SHA256) {
    throw new Error("independent P0 selection hash differs");
  }
  const selected: JsonObject[] = [];
  for (const [index, line] of decodeLf(bytes, "benchmark selection").slice(0, -1).split("\n").entries()) {
    if (line === "") throw new Error("benchmark selection contains a blank line");
    const record = object(
      parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `benchmark selection line ${index + 1}`),
      `benchmark selection line ${index + 1}`,
    );
    if (record.priorityClass !== "P0") continue;
    if (record.schema !== "phase8b-benchmark-selection-v1" ||
        record.recordKind !== "benchmark-selection" ||
        record.phase9EvidenceRole !== "model-development" ||
        record.numericTargetCoordinatesExtractedBeforeSelection !== false ||
        record.outcomeValueUsedAsSelectionCriterion !== false) {
      throw new Error(`benchmark P0 selection semantics differ at line ${index + 1}`);
    }
    const source = object(record.source, `benchmark selection line ${index + 1} source`);
    if (typeof source.sourceUnitId !== "string" || typeof source.locator !== "string" ||
        typeof record.measurementFamily !== "string") {
      throw new Error(`benchmark P0 selection locator is invalid at line ${index + 1}`);
    }
    selected.push({
      sourceUnitId: source.sourceUnitId,
      locator: source.locator,
      measurementFamily: record.measurementFamily,
    });
  }
  const expected: JsonObject[] = [
    ...registration.massHistories.map((spec) => ({
      sourceUnitId: spec.sourceUnitId,
      locator: `zip-member:${registration.harrisonArchive.memberRoot}/${spec.memberName}`,
      measurementFamily: "mass-ratio-history",
    })),
    ...registration.dimensionHistories.map((spec) => ({
      sourceUnitId: spec.sourceUnitId,
      locator: `zip-member:${registration.dimensionArchive.memberRoot}/${spec.memberName}`,
      measurementFamily: "dimension-history",
    })),
  ];
  const order = (left: JsonObject, right: JsonObject): number =>
    String(left.sourceUnitId) < String(right.sourceUnitId) ? -1 :
      String(left.sourceUnitId) > String(right.sourceUnitId) ? 1 : 0;
  selected.sort(order);
  expected.sort(order);
  if (canonicalJson(selected) !== canonicalJson(expected)) {
    throw new Error("independent P0 selection unit/locator roster differs");
  }
}

function parseRecords(bytes: Uint8Array): readonly Record<string, unknown>[] {
  const text = decodeLf(bytes, "records.jsonl");
  const lines = text.slice(0, -1).split("\n");
  if (lines.some((line) => line === "")) throw new Error("records.jsonl contains a blank line");
  return lines.map((line, index) => {
    const lineBytes = new TextEncoder().encode(`${line}\n`);
    const parsed = parseCanonicalJson(lineBytes, `records.jsonl line ${index + 1}`);
    return object(parsed, `records.jsonl line ${index + 1}`);
  });
}

function assertDescriptor(value: unknown, expected: JsonObject, label: string): void {
  if (canonicalJson(value as StrictJson) !== canonicalJson(expected)) throw new Error(`${label} descriptor differs`);
}

function verifyCommonRecord(
  record: Record<string, unknown>,
  expected: {
    readonly id: string;
    readonly kind: "mass-ratio" | "dimensions";
    readonly runId: string;
    readonly sourceUnitId: string;
    readonly dataLogicalRoot: string;
    readonly container: Phase8NativeVerifyArchiveSpec;
    readonly memberPath: string;
    readonly memberSpec: { readonly byteLength: number; readonly sha256: string; readonly rowCount: number };
    readonly outputPath: string;
    readonly output: Uint8Array;
  },
): void {
  const required = [
    "recordKind", "schema", "id", "priorityClass", "developmentRole", "historyKind", "runId",
    "sourceUnitId", "sourceContainer", "sourceContainerSha256", "sourceMemberPath",
    "sourceMemberByteLength", "sourceMemberSha256", "sourceRows", "sourceColumns",
    "selectedSourceColumnsZeroBased", "normalized", "observable", "conditions", "uncertainty",
    "timeFacts", "specimen", "lineage", "rights", "disposition",
  ];
  if (expected.kind === "mass-ratio") required.push("excludedSourceColumn");
  exactKeys(record, required, `record ${expected.id}`);
  const scalars: Readonly<Record<string, unknown>> = {
    recordKind: "measurement-set",
    schema: HISTORY_SCHEMA,
    id: expected.id,
    priorityClass: "P0",
    developmentRole: "model-development",
    historyKind: expected.kind,
    runId: expected.runId,
    sourceUnitId: expected.sourceUnitId,
    sourceContainer: expected.container.fileName,
    sourceContainerSha256: expected.container.sha256,
    sourceMemberPath: expected.memberPath,
    sourceMemberByteLength: expected.memberSpec.byteLength,
    sourceMemberSha256: expected.memberSpec.sha256,
    sourceRows: expected.memberSpec.rowCount,
    sourceColumns: expected.kind === "mass-ratio" ? 6 : 10,
    priorityDisposition: undefined,
    disposition: "included-native-history",
  };
  for (const [key, value] of Object.entries(scalars)) {
    if (value !== undefined && record[key] !== value) throw new Error(`record ${expected.id}.${key} differs`);
  }
  const normalized = object(record.normalized, `record ${expected.id}.normalized`);
  exactKeys(normalized, ["logicalRoot", "path", "mediaType", "byteLength", "sha256", "header", "sourceRowIndex", "sourceLexemesPreserved"], `record ${expected.id}.normalized`);
  const expectedHeader = expected.kind === "mass-ratio" ? MASS_HEADER.trimEnd() : DIMENSION_HEADER.trimEnd();
  const expectedRowIndex = expected.kind === "mass-ratio"
    ? "one-based numeric source-row order"
    : "one-based numeric source-row order after the exact seven-line header";
  if (normalized.logicalRoot !== expected.dataLogicalRoot ||
      normalized.path !== expected.outputPath || normalized.mediaType !== "text/tab-separated-values" ||
      normalized.byteLength !== expected.output.byteLength || normalized.sha256 !== sha256Bytes(expected.output) ||
      normalized.header !== expectedHeader || normalized.sourceRowIndex !== expectedRowIndex ||
      normalized.sourceLexemesPreserved !== true) {
    throw new Error(`record ${expected.id} normalized binding differs`);
  }
  const rights = object(record.rights, `record ${expected.id}.rights`);
  exactKeys(rights, ["sourceBytes", "derivedRows"], `record ${expected.id}.rights`);
  if (rights.sourceBytes !== "not broadly redistributable under identified terms" ||
      rights.derivedRows !== "unknown; substantial row body remains NAS-local") {
    throw new Error(`record ${expected.id} rights boundary differs`);
  }
  const expectedSemantics = expected.kind === "mass-ratio" ? {
    observable: "single-particle mass ratio m/m0 as a function of elapsed time",
    uncertainty: {
      massRatio: "source-stated maximum relative error of 5 percent; not a probability interval",
      extraction: "zero lexical transcription error for selected native columns after independent byte comparison",
    },
    specimen: "one selected Snomax-frozen levitated particle; crystallography and habit unobserved",
    lineage: "Harrison 2016 raw trace joined to Pokrifka 2020 corrected conditions; one campaign witness",
  } : {
    observable: "single-particle a dimension, c dimension, and rim width as functions of elapsed time",
    uncertainty: {
      dimensions: "source min/max error constructions retained as separate columns; not standard deviations or confidence intervals",
      covariance: "not reported across time, axes, views, or error columns",
      extraction: "zero lexical transcription error after independent byte comparison",
    },
    specimen: "one selected substrate-grown columnar ice crystal observed from two camera views",
    lineage: "Pokrifka, Moyle, and Harrington 2025 observation reused in Harrington and Pokrifka 2026",
  };
  if (record.observable !== expectedSemantics.observable ||
      canonicalJson(record.uncertainty as StrictJson) !== canonicalJson(expectedSemantics.uncertainty) ||
      record.specimen !== expectedSemantics.specimen || record.lineage !== expectedSemantics.lineage) {
    throw new Error(`record ${expected.id} observable/uncertainty/specimen/lineage semantics differ`);
  }
}

/** Verify a publication by independently reconstructing every normalized source lexeme. */
export function verifyPhase8NativePublication(inputs: Phase8NativeVerifyInputs): Phase8NativeVerification {
  const { registration } = inputs;
  assertPin(inputs.harrisonArchiveBytes, registration.harrisonArchive, "independent Harrison archive");
  assertPin(inputs.dimensionArchiveBytes, registration.dimensionArchive, "independent dimension archive");
  independentlyVerifySelection(inputs.selectionBytes, registration);
  if (registration.scope === "registered-20260812" &&
      (registration.expectedTotals.historyCount !== 18 || registration.expectedTotals.rowCount !== 252_134 ||
       registration.expectedTotals.selectedSourceMemberBytes !== 23_790_803)) {
    throw new Error("independent registered totals differ");
  }
  const metadataNames = [...inputs.published.metadataArtifacts.keys()].sort();
  if (canonicalJson(metadataNames) !== canonicalJson([...METADATA_NAMES].sort())) {
    throw new Error("published metadata file set differs");
  }
  const expectedDataPaths = [
    ...registration.massHistories.map((spec) => `data/mass-ratio-${spec.runId}.tsv`),
    ...registration.dimensionHistories.map((spec) => `data/dimensions-${spec.runId}.tsv`),
  ].sort();
  if (canonicalJson([...inputs.published.dataArtifacts.keys()].sort()) !== canonicalJson(expectedDataPaths)) {
    throw new Error("published native data file set differs");
  }
  const expectedMirrorPaths = new Set<string>([
    ...registration.massHistories.map((spec) => `${registration.harrisonArchive.memberRoot}/${spec.memberName}`),
    ...registration.dimensionHistories.map((spec) => `${registration.dimensionArchive.memberRoot}/${spec.memberName}`),
    `${registration.harrisonArchive.memberRoot}/${registration.excludedMassMember.memberName}`,
  ]);
  if (canonicalJson([...inputs.mirrors.keys()].sort()) !== canonicalJson([...expectedMirrorPaths].sort())) {
    throw new Error("independent mirror file set differs");
  }
  const excludedPath = `${registration.harrisonArchive.memberRoot}/${registration.excludedMassMember.memberName}`;
  assertPin(
    inputs.mirrors.get(excludedPath) as Uint8Array,
    registration.excludedMassMember,
    "independent excluded 625 mirror",
  );
  const conditions = independentlyParseLock(inputs.conditionLockBytes, registration);
  const recordsBytes = inputs.published.metadataArtifacts.get("records.jsonl") as Uint8Array;
  const records = parseRecords(recordsBytes);
  if (records.length !== registration.expectedTotals.historyCount) throw new Error("record count differs");
  const ids = records.map((record) => String(record.id));
  const sortedIds = [...ids].sort();
  if (new Set(ids).size !== ids.length || canonicalJson(ids) !== canonicalJson(sortedIds)) {
    throw new Error("record IDs are duplicated or not lexically ordered");
  }
  const recordsById = new Map(records.map((record) => [String(record.id), record]));
  let sourceLexemeRowsCompared = 0;
  let normalizedDataBytes = 0;
  let selectedSourceMemberBytes = 0;
  let historiesWithMassDecrease = 0;
  let largestDecreaseCount = -1;
  let largestDecreaseRunId = "";
  const dataBindings: JsonObject[] = [];

  for (const spec of registration.massHistories) {
    const memberPath = `${registration.harrisonArchive.memberRoot}/${spec.memberName}`;
    const mirror = inputs.mirrors.get(memberPath) as Uint8Array;
    assertPin(mirror, spec, `independent mass mirror ${spec.runId}`);
    const parsed = independentlyParseMass(mirror, `independent mass mirror ${spec.runId}`);
    if (parsed.rowCount !== spec.rowCount) throw new Error(`independent row count differs for ${spec.runId}`);
    const outputPath = `data/mass-ratio-${spec.runId}.tsv`;
    const actual = inputs.published.dataArtifacts.get(outputPath) as Uint8Array;
    if (!bytesEqual(actual, parsed.tsv)) throw new Error(`source lexemes differ in ${outputPath}`);
    const id = `P8B-NATIVE-MASS-${spec.runId.toUpperCase()}`;
    const record = recordsById.get(id);
    if (record === undefined) throw new Error(`record is missing: ${id}`);
    verifyCommonRecord(record, {
      id, kind: "mass-ratio", runId: spec.runId, sourceUnitId: spec.sourceUnitId,
      dataLogicalRoot: registration.dataLogicalRoot,
      container: registration.harrisonArchive, memberPath, memberSpec: spec, outputPath, output: actual,
    });
    if (canonicalJson(record.selectedSourceColumnsZeroBased as StrictJson) !== canonicalJson([2, 4]) ||
        canonicalJson(record.excludedSourceColumn as StrictJson) !== canonicalJson({
          zeroBased: 5,
          reason: "undocumented base unit; not an eligible observable",
        })) {
      throw new Error(`${id} source-column selection differs`);
    }
    const condition = object(record.conditions, `${id}.conditions`);
    exactKeys(condition, [
      "pressurePa", "pressureUncertainty", "tempC", "tempRangeC", "sigmaIcePercent",
      "sigmaIceRangePercent", "initialRadiusUm", "initialRadiusRangeUm", "source", "covariance",
    ], `${id}.conditions`);
    const expectedCondition = conditions.get(spec.runId) as LockCondition;
    for (const [key, value] of Object.entries(expectedCondition)) if (condition[key] !== value) throw new Error(`${id} corrected condition ${key} differs`);
    if (condition.source !== LOCK_PATH || condition.covariance !== "not reported; marginal ranges remain separate") {
      throw new Error(`${id} condition lineage differs`);
    }
    const timeFacts = object(record.timeFacts, `${id}.timeFacts`);
    const expectedTimeFacts = {
      firstSourceLexeme: parsed.firstTimeLexeme,
      lastSourceLexeme: parsed.lastTimeLexeme,
      uniqueTimeCount: parsed.uniqueTimeCount,
      adjacentRepeatedTimeCount: parsed.adjacentRepeatedTimeCount,
      maximumTimeMultiplicity: parsed.maximumTimeMultiplicity,
      adjacentMassDecreaseCount: parsed.adjacentMassDecreaseCount,
      coalesced: false,
      smoothed: false,
    };
    if (canonicalJson(timeFacts as StrictJson) !== canonicalJson(expectedTimeFacts)) throw new Error(`${id} raw time facts differ`);
    if ((parsed.adjacentMassDecreaseCount as number) > 0) historiesWithMassDecrease++;
    if ((parsed.adjacentMassDecreaseCount as number) > largestDecreaseCount) {
      largestDecreaseCount = parsed.adjacentMassDecreaseCount as number;
      largestDecreaseRunId = spec.runId;
    }
    sourceLexemeRowsCompared += parsed.rowCount;
    normalizedDataBytes += actual.byteLength;
    selectedSourceMemberBytes += mirror.byteLength;
    dataBindings.push(descriptor(outputPath, actual, "tsv-source-lexemes"));
  }

  for (const spec of registration.dimensionHistories) {
    const memberPath = `${registration.dimensionArchive.memberRoot}/${spec.memberName}`;
    const mirror = inputs.mirrors.get(memberPath) as Uint8Array;
    assertPin(mirror, spec, `independent dimension mirror ${spec.runId}`);
    const parsed = independentlyParseDimension(mirror, spec, `independent dimension mirror ${spec.runId}`);
    if (parsed.rowCount !== spec.rowCount) throw new Error(`independent row count differs for ${spec.runId}`);
    const outputPath = `data/dimensions-${spec.runId}.tsv`;
    const actual = inputs.published.dataArtifacts.get(outputPath) as Uint8Array;
    if (!bytesEqual(actual, parsed.tsv)) throw new Error(`source lexemes differ in ${outputPath}`);
    const id = `P8B-NATIVE-DIMENSIONS-${spec.runId}`;
    const record = recordsById.get(id);
    if (record === undefined) throw new Error(`record is missing: ${id}`);
    verifyCommonRecord(record, {
      id, kind: "dimensions", runId: spec.runId, sourceUnitId: spec.sourceUnitId,
      dataLogicalRoot: registration.dataLogicalRoot,
      container: registration.dimensionArchive, memberPath, memberSpec: spec, outputPath, output: actual,
    });
    if (canonicalJson(record.selectedSourceColumnsZeroBased as StrictJson) !== canonicalJson([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      throw new Error(`${id} source-column selection differs`);
    }
    const condition = object(record.conditions, `${id}.conditions`);
    exactKeys(condition, [
      "tempC", "temperatureUncertainty", "pressureHpa", "pressureUncertainty",
      "sourceReportedSupersaturationPercent", "supersaturationSemanticStatus", "forcingEvent",
    ], `${id}.conditions`);
    if (condition.tempC !== spec.tempC || condition.pressureHpa !== spec.pressureHpa ||
        condition.sourceReportedSupersaturationPercent !== spec.initialSupersaturationPercent ||
        condition.supersaturationSemanticStatus !== "source-relative basis unresolved; not a model input") {
      throw new Error(`${id} condition semantics differ`);
    }
    const forcing = condition.forcingEvent;
    if (spec.forcingEvent === null) {
      if (forcing !== null) throw new Error(`${id} invents a forcing event`);
    } else {
      const event = object(forcing, `${id}.forcingEvent`);
      exactKeys(event, [
        "atSeconds", "sourceReportedSupersaturationPercent", "assignment",
        "previousRowTimeLexeme", "nextRowTimeLexeme",
      ], `${id}.forcingEvent`);
      if (event.atSeconds !== spec.forcingEvent.atSeconds ||
          event.sourceReportedSupersaturationPercent !== spec.forcingEvent.supersaturationPercent ||
          event.assignment !== "event remains at exactly 13800 s; no observation occurs at the event" ||
          event.previousRowTimeLexeme !== spec.forcingEvent.previousRowTimeLexeme ||
          event.nextRowTimeLexeme !== spec.forcingEvent.nextRowTimeLexeme) {
        throw new Error(`${id} forcing event differs`);
      }
    }
    if (canonicalJson(record.timeFacts as StrictJson) !== canonicalJson({
      firstSourceLexeme: parsed.firstTimeLexeme,
      lastSourceLexeme: parsed.lastTimeLexeme,
      smoothed: false,
    })) throw new Error(`${id} raw time facts differ`);
    sourceLexemeRowsCompared += parsed.rowCount;
    normalizedDataBytes += actual.byteLength;
    selectedSourceMemberBytes += mirror.byteLength;
    dataBindings.push(descriptor(outputPath, actual, "tsv-source-lexemes"));
  }
  dataBindings.sort((left, right) => String(left.path) < String(right.path) ? -1 : 1);
  if (sourceLexemeRowsCompared !== registration.expectedTotals.rowCount ||
      selectedSourceMemberBytes !== registration.expectedTotals.selectedSourceMemberBytes) {
    throw new Error("independent aggregate row/source-byte totals differ");
  }
  if (registration.scope === "registered-20260812" &&
      (historiesWithMassDecrease !== 12 || largestDecreaseCount !== 57 || largestDecreaseRunId !== "805a")) {
    throw new Error("independent registered nonmonotonicity facts differ");
  }

  const operatorBytes = inputs.published.metadataArtifacts.get("operator.json") as Uint8Array;
  const operator = object(parseCanonicalJson(operatorBytes, "operator.json"), "operator.json");
  exactKeys(operator, ["schema", "operator", "state", "scope", "nasDataLogicalRoot", "rules", "sourceInputs", "implementation", "rightsBoundary"], "operator.json");
  if (operator.schema !== "phase8b-native-history-operator-v1" || operator.operator !== OPERATOR ||
      operator.scope !== registration.scope ||
      operator.state !== "registered-and-executed-producer-awaiting-independent-verification" ||
      operator.nasDataLogicalRoot !== registration.dataLogicalRoot) {
    throw new Error("operator identity/state differs");
  }
  const expectedRules = {
    mass: "parse every six-column row; emit one-based row index plus exact source time and m/m0 lexemes from columns 3 and 5",
    dimensions: "retain the exact seven-line header contract; emit every ten-column row and all source lexemes",
    duplicateTimes: "preserve raw rows; no coalescing in this operator",
    monotonicity: "time must be nondecreasing; measured mass and dimensions are not forced monotone",
    excludedSixthMassColumn: true,
    excluded625: true,
    unmatchedCorrectedConditionRemainsAbsent: true,
    derivedViewsProduced: false,
  };
  if (canonicalJson(operator.rules as StrictJson) !== canonicalJson(expectedRules) ||
      operator.rightsBoundary !== "normalized row bodies remain NAS-local until redistribution rights are resolved") {
    throw new Error("operator rules or rights boundary differ");
  }
  const sourceInputs = object(operator.sourceInputs, "operator sourceInputs");
  exactKeys(sourceInputs, ["harrisonArchive", "dimensionArchive", "conditionLock", "benchmarkSelection", "excludedMassMember"], "operator sourceInputs");
  assertDescriptor(sourceInputs.harrisonArchive, descriptor(registration.harrisonArchive.fileName, inputs.harrisonArchiveBytes, "zip"), "operator Harrison archive");
  assertDescriptor(sourceInputs.dimensionArchive, descriptor(registration.dimensionArchive.fileName, inputs.dimensionArchiveBytes, "zip"), "operator dimension archive");
  assertDescriptor(sourceInputs.conditionLock, descriptor(LOCK_PATH, inputs.conditionLockBytes, "json"), "operator condition lock");
  assertDescriptor(sourceInputs.benchmarkSelection, descriptor(SELECTION_PATH, inputs.selectionBytes, "canonical-jsonl"), "operator benchmark selection");
  assertDescriptor(
    sourceInputs.excludedMassMember,
    descriptor(excludedPath, inputs.mirrors.get(excludedPath) as Uint8Array, "source-member"),
    "operator excluded mass member",
  );
  const expectedImplementation = IMPLEMENTATION_PATHS.map((path) => {
    const bytes = inputs.implementation.get(path);
    if (bytes === undefined) throw new Error(`independent implementation bytes are missing: ${path}`);
    return descriptor(path, bytes, "source");
  });
  if (canonicalJson(operator.implementation as StrictJson) !== canonicalJson(expectedImplementation)) {
    throw new Error("operator implementation pins differ");
  }

  const counts = {
    historyCount: registration.expectedTotals.historyCount,
    massHistoryCount: registration.expectedTotals.massHistoryCount,
    dimensionHistoryCount: registration.expectedTotals.dimensionHistoryCount,
    rowCount: sourceLexemeRowsCompared,
    selectedSourceMemberBytes,
    normalizedDataBytes,
  };
  const reportBytes = inputs.published.metadataArtifacts.get("report.json") as Uint8Array;
  const report = object(parseCanonicalJson(reportBytes, "report.json"), "report.json");
  exactKeys(report, ["schema", "operator", "state", "counts", "rawFacts", "limitations", "grantsValidationClaim", "permitsPhase9Execution", "artifacts"], "report.json");
  if (report.schema !== "phase8b-native-history-report-v1" || report.operator !== OPERATOR ||
      report.state !== "producer-derived-awaiting-independent-verification" ||
      report.grantsValidationClaim !== false || report.permitsPhase9Execution !== false ||
      canonicalJson(report.counts as StrictJson) !== canonicalJson(counts)) {
    throw new Error("report identity, claim boundary, or counts differ");
  }
  const expectedLimitations = [
    "row bodies are NAS-local because broad derived-data redistribution rights are unresolved",
    "source-reported dimension supersaturation basis remains unresolved and is not a model input",
    "mass-history specimens lack observed habit and crystallography",
    "this producer report is not an independent verification verdict and grants no validation claim",
  ];
  if (canonicalJson(report.limitations as StrictJson) !== canonicalJson(expectedLimitations)) {
    throw new Error("report limitations differ");
  }
  const rawFacts = object(report.rawFacts, "report rawFacts");
  exactKeys(rawFacts, [
    "historiesWithMassDecrease", "largestAdjacentMassDecreaseCount",
    "largestAdjacentMassDecreaseRunId", "duplicateTimeHandling", "dimensionForcingEventSeconds",
  ], "report rawFacts");
  if (rawFacts.historiesWithMassDecrease !== historiesWithMassDecrease ||
      rawFacts.largestAdjacentMassDecreaseCount !== largestDecreaseCount ||
      rawFacts.largestAdjacentMassDecreaseRunId !== largestDecreaseRunId ||
      rawFacts.duplicateTimeHandling !== "preserved-not-coalesced" ||
      rawFacts.dimensionForcingEventSeconds !== 13_800) {
    throw new Error("report raw facts differ");
  }
  const reportArtifacts = object(report.artifacts, "report artifacts");
  exactKeys(reportArtifacts, ["operator", "records", "nasData"], "report artifacts");
  assertDescriptor(reportArtifacts.operator, descriptor("operator.json", operatorBytes, "canonical-json"), "report operator");
  assertDescriptor(reportArtifacts.records, descriptor("records.jsonl", recordsBytes, "canonical-jsonl"), "report records");
  if (canonicalJson(reportArtifacts.nasData as StrictJson) !== canonicalJson(dataBindings)) throw new Error("report NAS data bindings differ");

  const indexBytes = inputs.published.metadataArtifacts.get("artifact-index.json") as Uint8Array;
  const index = object(parseCanonicalJson(indexBytes, "artifact-index.json"), "artifact-index.json");
  exactKeys(index, ["schema", "operator", "metadataArtifacts", "nasDataArtifacts"], "artifact-index.json");
  const expectedMetadata = [
    descriptor("operator.json", operatorBytes, "canonical-json"),
    descriptor("records.jsonl", recordsBytes, "canonical-jsonl"),
    descriptor("report.json", reportBytes, "canonical-json"),
  ];
  if (index.schema !== "phase8b-native-history-index-v1" || index.operator !== OPERATOR ||
      canonicalJson(index.metadataArtifacts as StrictJson) !== canonicalJson(expectedMetadata) ||
      canonicalJson(index.nasDataArtifacts as StrictJson) !== canonicalJson(dataBindings)) {
    throw new Error("artifact index graph differs");
  }
  return {
    ok: true,
    historyCount: counts.historyCount,
    rowCount: counts.rowCount,
    sourceLexemeRowsCompared,
    archiveCountHashed: 2,
    mirrorCountHashed: inputs.mirrors.size,
    normalizedDataBytes,
  };
}

/** Strictly read a producer publication without following symlinks. */
export function readPhase8NativePublishedDirectory(directory: string): Phase8NativePublishedBytes {
  const metadataArtifacts = new Map<string, Uint8Array>();
  const dataArtifacts = new Map<string, Uint8Array>();
  const rootEntries = readdirSync(directory, { withFileTypes: true });
  const names = rootEntries.map((entry) => entry.name).sort();
  if (canonicalJson(names) !== canonicalJson([...METADATA_NAMES, "data"].sort())) {
    throw new Error("native-history directory root entries differ");
  }
  for (const name of METADATA_NAMES) {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`native metadata entry is not a regular file: ${name}`);
    metadataArtifacts.set(name, new Uint8Array(readFileSync(path)));
  }
  const dataDirectory = join(directory, "data");
  const dataStat = lstatSync(dataDirectory);
  if (!dataStat.isDirectory() || dataStat.isSymbolicLink()) throw new Error("native data entry is not a real directory");
  for (const entry of readdirSync(dataDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !/^[a-z0-9-]+\.tsv$/.test(entry.name)) {
      throw new Error(`native data entry is invalid: ${entry.name}`);
    }
    dataArtifacts.set(`data/${entry.name}`, new Uint8Array(readFileSync(join(dataDirectory, entry.name))));
  }
  return { metadataArtifacts, dataArtifacts };
}

const REGISTERED_MASS_ROWS: Readonly<Record<string, { readonly sourceUnitId: string; readonly rowCount: number }>> = {
  "712a": { sourceUnitId: "P8B-UNIT-2CEE953BBC0243F9A214005F", rowCount: 7_829 },
  "712k": { sourceUnitId: "P8B-UNIT-D37E50BA5B73C60418AC7078", rowCount: 10_445 },
  "716a": { sourceUnitId: "P8B-UNIT-D35BE7104F02E7551CFEDC0C", rowCount: 11_168 },
  "716d": { sourceUnitId: "P8B-UNIT-DBEC7A33DFCCD81A3E66906A", rowCount: 9_846 },
  "716k": { sourceUnitId: "P8B-UNIT-3BBE89E3D3B1429A8DC127E0", rowCount: 19_268 },
  "724b": { sourceUnitId: "P8B-UNIT-85E829413C55ABDE9FA35B1C", rowCount: 58_301 },
  "724c": { sourceUnitId: "P8B-UNIT-20D9F95FE223A7AB67209A30", rowCount: 9_577 },
  "725c": { sourceUnitId: "P8B-UNIT-D6442E662770C35854FB2D8B", rowCount: 16_694 },
  "725e": { sourceUnitId: "P8B-UNIT-4CB1637CA175FA4D94EF6063", rowCount: 15_036 },
  "731a": { sourceUnitId: "P8B-UNIT-F3E2FF9C322C58220A773D99", rowCount: 27_700 },
  "731b": { sourceUnitId: "P8B-UNIT-C8D909E75461AEEEFBF0B365", rowCount: 19_516 },
  "802d": { sourceUnitId: "P8B-UNIT-831531AE323523A95D510307", rowCount: 21_191 },
  "805a": { sourceUnitId: "P8B-UNIT-A6FA0826C9C2852672C2B87A", rowCount: 7_337 },
  "805b": { sourceUnitId: "P8B-UNIT-8376DA186B16D7C1C8F650BD", rowCount: 7_767 },
  "805h": { sourceUnitId: "P8B-UNIT-5C37491C76718529DA5A4C93", rowCount: 5_246 },
  "805l": { sourceUnitId: "P8B-UNIT-25FF44515D32E7473616AC2A", rowCount: 5_119 },
};

function registeredVerificationRegistration(lockBytes: Uint8Array): Phase8NativeVerifyRegistration {
  if (sha256Bytes(lockBytes) !== LOCK_SHA256) throw new Error("registered condition-lock hash differs");
  const root = object(JSON.parse(decodeLf(lockBytes, "registered condition lock")), "registered condition lock");
  const traces = array(object(root.harrisonCandidate, "registered candidate").traces, "registered traces");
  const byId = new Map(traces.map((value) => {
    const trace = object(value, "registered trace");
    return [String(trace.id), trace] as const;
  }));
  const massHistories = Object.entries(REGISTERED_MASS_ROWS).map(([runId, registration]) => {
    const trace = byId.get(runId);
    if (trace === undefined) throw new Error(`registered lock lacks ${runId}`);
    return {
      runId,
      sourceUnitId: registration.sourceUnitId,
      memberName: String(trace.member),
      byteLength: Number(trace.byteLength),
      sha256: String(trace.sha256),
      rowCount: registration.rowCount,
    };
  });
  const dimensionHistories: readonly Phase8NativeVerifyDimensionSpec[] = [
    {
      runId: "20231128", sourceUnitId: "P8B-UNIT-10C734F0C6C31B5904B10BE7",
      memberName: "dimensions-20231128.dat", byteLength: 1_692,
      sha256: "c4b8d3d5c674898b8e5bfa761e95933b251d59daa833dbd5fb27483238c57c48", rowCount: 26,
      experimentHeader: "Experiment 2023/11/28", temperatureHeader: "Temperature: -50C",
      supersaturationHeader: "Supersaturation: 48%", pressureHeader: "Pressure: 970 hPa",
      tempC: -50, pressureHpa: 970, initialSupersaturationPercent: 48, forcingEvent: null,
    },
    {
      runId: "20240814", sourceUnitId: "P8B-UNIT-2CF2C2C5B3A6900FC3F9CDDA",
      memberName: "dimensions-20240814.dat", byteLength: 4_100,
      sha256: "8aff69945a47d383b708942bb0441768ddf2822f812495fea69e51aebf3f25e8", rowCount: 68,
      experimentHeader: "Experiment 2024/08/14", temperatureHeader: "Temperature: -50C",
      supersaturationHeader: "Supersaturation: 48%, switch to 20% at 230 min", pressureHeader: "Pressure: 972 hPa",
      tempC: -50, pressureHpa: 972, initialSupersaturationPercent: 48,
      forcingEvent: { atSeconds: 13_800, supersaturationPercent: 20, previousRowTimeLexeme: "13504.00", nextRowTimeLexeme: "13804.00" },
    },
  ];
  return {
    scope: "registered-20260812",
    dataLogicalRoot: "research-cache/phase8b-derived/native-histories-20260812-v1",
    harrisonArchive: {
      fileName: "harrison-2016.zip", byteLength: 3_422_359,
      sha256: "4901759b3f5f6d71759b31286db6103d9f7d9b23512c01237067c11da3be815c",
      memberRoot: "harrison-et-al-electrodynamic-levitation-diffusion-heteroogeneously-nucleated-ice-crystals-2016",
    },
    dimensionArchive: {
      fileName: "harrington-pokrifka-2026.zip", byteLength: 104_949,
      sha256: "3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36",
      memberRoot: "harrington-pokrifka-revisiting-theories-for-the-growth-of-single-crystalline-ice-2026",
    },
    massHistories,
    dimensionHistories,
    excludedMassMember: {
      memberName: "heticegrowth_625.dat",
      byteLength: 2_178_814,
      sha256: "26ff4d08236a147aad064f088863435a8db01372d24ecf0b1e7c79d841a79fd8",
    },
    requiredAbsentConditionFragment: "-31.5 C, 5 percent ice supersaturation, initial radius 10.69 micrometers",
    expectedTotals: {
      historyCount: 18, massHistoryCount: 16, dimensionHistoryCount: 2,
      rowCount: 252_134, selectedSourceMemberBytes: 23_790_803,
    },
  };
}

export function captureRegisteredPhase8NativeVerifyInputs(options: {
  readonly repositoryRoot: string;
  readonly contentRoot: string;
  readonly bundleDirectory: string;
}): Phase8NativeVerifyInputs {
  const conditionLockBytes = new Uint8Array(readFileSync(resolve(options.repositoryRoot, LOCK_PATH)));
  const registration = registeredVerificationRegistration(conditionLockBytes);
  const implementation = new Map<string, Uint8Array>();
  for (const path of IMPLEMENTATION_PATHS) implementation.set(path, new Uint8Array(readFileSync(resolve(options.repositoryRoot, path))));
  const mirrors = new Map<string, Uint8Array>();
  for (const path of [
    ...registration.massHistories.map((spec) => `${registration.harrisonArchive.memberRoot}/${spec.memberName}`),
    ...registration.dimensionHistories.map((spec) => `${registration.dimensionArchive.memberRoot}/${spec.memberName}`),
    `${registration.harrisonArchive.memberRoot}/${registration.excludedMassMember.memberName}`,
  ]) mirrors.set(path, new Uint8Array(readFileSync(resolve(options.contentRoot, path))));
  return {
    registration,
    harrisonArchiveBytes: new Uint8Array(readFileSync(resolve(options.contentRoot, registration.harrisonArchive.fileName))),
    dimensionArchiveBytes: new Uint8Array(readFileSync(resolve(options.contentRoot, registration.dimensionArchive.fileName))),
    conditionLockBytes,
    selectionBytes: new Uint8Array(readFileSync(resolve(options.repositoryRoot, SELECTION_PATH))),
    mirrors,
    implementation,
    published: readPhase8NativePublishedDirectory(resolve(options.bundleDirectory)),
  };
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-native-history-verify.ts verify --content-root <dir> " +
    "--bundle <dir> [--repository-root <dir>]",
  );
}

function cli(argv: readonly string[]): void {
  if (argv[0] !== "verify") usage();
  const values = new Map<string, string>();
  const allowed = new Set(["--content-root", "--bundle", "--repository-root"]);
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(key) || value === undefined || values.has(key)) usage();
    values.set(key, value);
  }
  const contentRoot = values.get("--content-root");
  const bundleDirectory = values.get("--bundle");
  if (contentRoot === undefined || bundleDirectory === undefined) usage();
  const repositoryRoot = values.get("--repository-root") ?? resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const result = verifyPhase8NativePublication(captureRegisteredPhase8NativeVerifyInputs({ repositoryRoot, contentRoot, bundleDirectory }));
  process.stdout.write(`${canonicalJson(result)}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    cli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
