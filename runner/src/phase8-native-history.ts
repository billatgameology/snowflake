// Phase 8B S3 — preregistered native full-history normalization.
//
// The producer reads the two source ZIPs directly. It emits one NAS-local TSV per selected
// history while preserving the source lexemes of every selected numeric value. It never
// coalesces duplicate times, smooths a trace, or interprets the undocumented Harrison column 6.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import { phase8bReadZipInventory } from "./phase8-corpus-local.ts";

export const PHASE8_NATIVE_OPERATOR = "phase8b-native-full-history-v1" as const;
export const PHASE8_NATIVE_SCHEMA = "phase8b-native-history-v1" as const;
export const PHASE8_NATIVE_METADATA_NAMES = [
  "artifact-index.json",
  "operator.json",
  "records.jsonl",
  "report.json",
] as const;
export const PHASE8_NATIVE_LOCK_PATH = "research/phase6-heldout-candidate-lock.json" as const;
export const PHASE8_NATIVE_LOCK_SHA256 =
  "f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5" as const;
export const PHASE8_NATIVE_SELECTION_PATH =
  "evidence/phase8b-benchmark-selection-v1/selection.jsonl" as const;
export const PHASE8_NATIVE_SELECTION_SHA256 =
  "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537" as const;

export const PHASE8_NATIVE_IMPLEMENTATION_PATHS = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-corpus-local.ts",
  "runner/src/phase8-native-history.ts",
  "runner/src/phase8-native-history-verify.ts",
  "runner/test/phase8-native-history.test.ts",
] as const;

const HARRISON_ROOT =
  "harrison-et-al-electrodynamic-levitation-diffusion-heteroogeneously-nucleated-ice-crystals-2016";
const DIMENSION_ROOT =
  "harrington-pokrifka-revisiting-theories-for-the-growth-of-single-crystalline-ice-2026";
const MASS_HEADER = "sourceRowIndex\ttime_s\tmass_ratio\n";
const DIMENSION_HEADER =
  "sourceRowIndex\ttime_s\ta_um\tc_um\ta_error_min_um\tc_error_min_um\t" +
  "a_error_max_um\tc_error_max_um\trim_width_um\trim_error_min_um\trim_error_max_um\n";
const NUMBER_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8NativeArchiveSpec {
  readonly fileName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly regularMemberCount: number;
  readonly memberRoot: string;
}

export interface Phase8NativeMassSpec {
  readonly runId: string;
  readonly sourceUnitId: string;
  readonly memberName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly rowCount: number;
}

export interface Phase8NativeDimensionSpec {
  readonly runId: "20231128" | "20240814" | string;
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

export interface Phase8NativeRegistration {
  readonly scope: "registered-20260812" | "test-fixture";
  /** Portable root recorded in Git; the registered physical mount is /Volumes/snowcrystal. */
  readonly dataLogicalRoot: string;
  readonly harrisonArchive: Phase8NativeArchiveSpec;
  readonly dimensionArchive: Phase8NativeArchiveSpec;
  readonly massHistories: readonly Phase8NativeMassSpec[];
  readonly dimensionHistories: readonly Phase8NativeDimensionSpec[];
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

const MASS_SPECS: readonly Phase8NativeMassSpec[] = [
  { runId: "712a", sourceUnitId: "P8B-UNIT-2CEE953BBC0243F9A214005F", memberName: "heticegrowth_712a.dat", byteLength: 759_413, sha256: "46764d36da549b0b0f21515418194b8064ad6906716578a6d531bc28be6501f4", rowCount: 7_829 },
  { runId: "712k", sourceUnitId: "P8B-UNIT-D37E50BA5B73C60418AC7078", memberName: "heticegrowth_712k.dat", byteLength: 1_013_165, sha256: "7be837919a54264eb8ff3222332169088426d33d630475866049d71495a0ce0c", rowCount: 10_445 },
  { runId: "716a", sourceUnitId: "P8B-UNIT-D35BE7104F02E7551CFEDC0C", memberName: "heticegrowth_716a.dat", byteLength: 1_083_296, sha256: "d2f879e65cb4224394659e9539c268f325cedc38cdfe467660514cffff1f2c25", rowCount: 11_168 },
  { runId: "716d", sourceUnitId: "P8B-UNIT-DBEC7A33DFCCD81A3E66906A", memberName: "heticegrowth_716d.dat", byteLength: 955_062, sha256: "1e69b553e54cf473fe54122a19695ab92a5c30a4afbcf3485ba7426a39685343", rowCount: 9_846 },
  { runId: "716k", sourceUnitId: "P8B-UNIT-3BBE89E3D3B1429A8DC127E0", memberName: "heticegrowth_716k.dat", byteLength: 1_868_996, sha256: "153a8866cf4e98906cd7ce84289c22b416ce88a29322a91c4d94802023262dc0", rowCount: 19_268 },
  { runId: "724b", sourceUnitId: "P8B-UNIT-85E829413C55ABDE9FA35B1C", memberName: "heticegrowth_724b.dat", byteLength: 5_655_197, sha256: "3d9a72486a014ada5fcf887676d24165a17125ecb2163de0e2a5e3172712b475", rowCount: 58_301 },
  { runId: "724c", sourceUnitId: "P8B-UNIT-20D9F95FE223A7AB67209A30", memberName: "heticegrowth_724c.dat", byteLength: 928_969, sha256: "020c848a4465bf7fc2cce24fb2e67fe6963ee444bcbc78cdb999e08b7ee87d11", rowCount: 9_577 },
  { runId: "725c", sourceUnitId: "P8B-UNIT-D6442E662770C35854FB2D8B", memberName: "heticegrowth_725c.dat", byteLength: 956_449, sha256: "40872c57d5d8fe2c2638458fde46acda69f8b58c3a5be511257614c0eb4e0486", rowCount: 16_694 },
  { runId: "725e", sourceUnitId: "P8B-UNIT-4CB1637CA175FA4D94EF6063", memberName: "heticegrowth_725e.dat", byteLength: 1_458_492, sha256: "d058131a26879321299d7b54d3f4cd6027517d256361391c5a674f8daafe8380", rowCount: 15_036 },
  { runId: "731a", sourceUnitId: "P8B-UNIT-F3E2FF9C322C58220A773D99", memberName: "heticegrowth_731a.dat", byteLength: 2_686_900, sha256: "d8f63d564f77851b09a6108b0cd43763bc8d65036e61079b0fafc2bdb6d561e1", rowCount: 27_700 },
  { runId: "731b", sourceUnitId: "P8B-UNIT-C8D909E75461AEEEFBF0B365", memberName: "heticegrowth_731b.dat", byteLength: 1_893_052, sha256: "e1e551faaa660375f73617b99fa79495afcff9480e8b23f3f9628d7fcf0f298a", rowCount: 19_516 },
  { runId: "802d", sourceUnitId: "P8B-UNIT-831531AE323523A95D510307", memberName: "heticegrowth_802d.dat", byteLength: 2_055_527, sha256: "d7046e363fe88c582940a3a19657797cd35021c9ca009486e4f2c787eb11fc85", rowCount: 21_191 },
  { runId: "805a", sourceUnitId: "P8B-UNIT-A6FA0826C9C2852672C2B87A", memberName: "heticegrowth_805a.dat", byteLength: 711_689, sha256: "81864448ce5997b41379a398adf114f9be481c822095e727d81ac48bea4209f5", rowCount: 7_337 },
  { runId: "805b", sourceUnitId: "P8B-UNIT-8376DA186B16D7C1C8F650BD", memberName: "heticegrowth_805b.dat", byteLength: 753_399, sha256: "ca3d2bb0159a5e93cbe51eae988e8fb16ab1a8bc55989ef1f9bf91c04846ef6e", rowCount: 7_767 },
  { runId: "805h", sourceUnitId: "P8B-UNIT-5C37491C76718529DA5A4C93", memberName: "heticegrowth_805h.dat", byteLength: 508_862, sha256: "88a96cbaba0a93b8aeeaf7728fed8d83c2173b7d1f10025fac30059a295e5b7f", rowCount: 5_246 },
  { runId: "805l", sourceUnitId: "P8B-UNIT-25FF44515D32E7473616AC2A", memberName: "heticegrowth_805l.dat", byteLength: 496_543, sha256: "8fdf7781f994a5eba24d5f17f2aeb86db680cb28c2f1b9039bec27197d0d9e1f", rowCount: 5_119 },
];

const DIMENSION_SPECS: readonly Phase8NativeDimensionSpec[] = [
  {
    runId: "20231128",
    sourceUnitId: "P8B-UNIT-10C734F0C6C31B5904B10BE7",
    memberName: "dimensions-20231128.dat",
    byteLength: 1_692,
    sha256: "c4b8d3d5c674898b8e5bfa761e95933b251d59daa833dbd5fb27483238c57c48",
    rowCount: 26,
    experimentHeader: "Experiment 2023/11/28",
    temperatureHeader: "Temperature: -50C",
    supersaturationHeader: "Supersaturation: 48%",
    pressureHeader: "Pressure: 970 hPa",
    tempC: -50,
    pressureHpa: 970,
    initialSupersaturationPercent: 48,
    forcingEvent: null,
  },
  {
    runId: "20240814",
    sourceUnitId: "P8B-UNIT-2CF2C2C5B3A6900FC3F9CDDA",
    memberName: "dimensions-20240814.dat",
    byteLength: 4_100,
    sha256: "8aff69945a47d383b708942bb0441768ddf2822f812495fea69e51aebf3f25e8",
    rowCount: 68,
    experimentHeader: "Experiment 2024/08/14",
    temperatureHeader: "Temperature: -50C",
    supersaturationHeader: "Supersaturation: 48%, switch to 20% at 230 min",
    pressureHeader: "Pressure: 972 hPa",
    tempC: -50,
    pressureHpa: 972,
    initialSupersaturationPercent: 48,
    forcingEvent: {
      atSeconds: 13_800,
      supersaturationPercent: 20,
      previousRowTimeLexeme: "13504.00",
      nextRowTimeLexeme: "13804.00",
    },
  },
];

export const PHASE8_NATIVE_REGISTERED: Phase8NativeRegistration = {
  scope: "registered-20260812",
  dataLogicalRoot: "research-cache/phase8b-derived/native-histories-20260812-v1",
  harrisonArchive: {
    fileName: "harrison-2016.zip",
    byteLength: 3_422_359,
    sha256: "4901759b3f5f6d71759b31286db6103d9f7d9b23512c01237067c11da3be815c",
    regularMemberCount: 21,
    memberRoot: HARRISON_ROOT,
  },
  dimensionArchive: {
    fileName: "harrington-pokrifka-2026.zip",
    byteLength: 104_949,
    sha256: "3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36",
    regularMemberCount: 13,
    memberRoot: DIMENSION_ROOT,
  },
  massHistories: MASS_SPECS,
  dimensionHistories: DIMENSION_SPECS,
  excludedMassMember: {
    memberName: "heticegrowth_625.dat",
    byteLength: 2_178_814,
    sha256: "26ff4d08236a147aad064f088863435a8db01372d24ecf0b1e7c79d841a79fd8",
  },
  requiredAbsentConditionFragment:
    "-31.5 C, 5 percent ice supersaturation, initial radius 10.69 micrometers",
  expectedTotals: {
    historyCount: 18,
    massHistoryCount: 16,
    dimensionHistoryCount: 2,
    rowCount: 252_134,
    selectedSourceMemberBytes: 23_790_803,
  },
};

export interface Phase8NativeInputs {
  readonly registration?: Phase8NativeRegistration;
  readonly harrisonArchiveBytes: Uint8Array;
  readonly dimensionArchiveBytes: Uint8Array;
  readonly conditionLockBytes: Uint8Array;
  readonly selectionBytes: Uint8Array;
  readonly implementation: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8NativeBundle {
  readonly scope: "registered-20260812" | "test-fixture";
  readonly dataLogicalRoot: string;
  readonly metadataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly dataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly historyCount: number;
    readonly massHistoryCount: number;
    readonly dimensionHistoryCount: number;
    readonly rowCount: number;
    readonly selectedSourceMemberBytes: number;
    readonly normalizedDataBytes: number;
  };
}

interface ParsedMass {
  readonly tsv: Uint8Array;
  readonly rowCount: number;
  readonly firstTimeLexeme: string;
  readonly lastTimeLexeme: string;
  readonly uniqueTimeCount: number;
  readonly adjacentRepeatedTimeCount: number;
  readonly maximumTimeMultiplicity: number;
  readonly adjacentMassDecreaseCount: number;
}

interface ParsedDimension {
  readonly tsv: Uint8Array;
  readonly rowCount: number;
  readonly firstTimeLexeme: string;
  readonly lastTimeLexeme: string;
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a nonempty string`);
  return value;
}

function asArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} keys differ`);
}

function decodeSource(bytes: Uint8Array, label: string): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (text.includes("\r")) throw new Error(`${label} contains non-LF line endings`);
  if (!text.endsWith("\n")) throw new Error(`${label} is not LF-terminated`);
  return text;
}

function parseNumberToken(token: string, label: string): number {
  if (!NUMBER_TOKEN.test(token)) throw new Error(`${label} is not a decimal source token`);
  const value = Number(token);
  if (!Number.isFinite(value)) throw new Error(`${label} is not finite`);
  return value;
}

function assertPin(bytes: Uint8Array, pin: { readonly byteLength: number; readonly sha256: string }, label: string): void {
  if (bytes.byteLength !== pin.byteLength || sha256Bytes(bytes) !== pin.sha256) {
    throw new Error(`${label} byte/hash pin differs`);
  }
}

function parseMass(bytes: Uint8Array, label: string): ParsedMass {
  const lines = decodeSource(bytes, label).slice(0, -1).split("\n");
  const output: string[] = [MASS_HEADER.slice(0, -1)];
  const times = new Set<string>();
  const multiplicity = new Map<string, number>();
  let previousTime = -Infinity;
  let previousTimeLexeme: string | null = null;
  let previousMass = -Infinity;
  let adjacentRepeatedTimeCount = 0;
  let adjacentMassDecreaseCount = 0;
  let firstTimeLexeme = "";
  let lastTimeLexeme = "";
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.trim().length === 0) throw new Error(`${label} row ${index + 1} is blank`);
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 6) throw new Error(`${label} row ${index + 1} does not have six columns`);
    const values = fields.map((field, column) => parseNumberToken(field, `${label} row ${index + 1} column ${column + 1}`));
    const time = values[2];
    const mass = values[4];
    if (time < 0 || time < previousTime) throw new Error(`${label} time is negative or decreases at row ${index + 1}`);
    if (!(mass > 0)) throw new Error(`${label} mass ratio is not positive at row ${index + 1}`);
    if (previousTimeLexeme !== null && time === previousTime) adjacentRepeatedTimeCount++;
    if (index > 0 && mass < previousMass) adjacentMassDecreaseCount++;
    const timeKey = String(time);
    times.add(timeKey);
    multiplicity.set(timeKey, (multiplicity.get(timeKey) ?? 0) + 1);
    firstTimeLexeme ||= fields[2];
    lastTimeLexeme = fields[2];
    output.push(`${index + 1}\t${fields[2]}\t${fields[4]}`);
    previousTime = time;
    previousTimeLexeme = fields[2];
    previousMass = mass;
  }
  if (lines.length === 0) throw new Error(`${label} has no numeric rows`);
  return {
    tsv: new TextEncoder().encode(`${output.join("\n")}\n`),
    rowCount: lines.length,
    firstTimeLexeme,
    lastTimeLexeme,
    uniqueTimeCount: times.size,
    adjacentRepeatedTimeCount,
    maximumTimeMultiplicity: Math.max(...multiplicity.values()),
    adjacentMassDecreaseCount,
  };
}

function parseDimension(bytes: Uint8Array, spec: Phase8NativeDimensionSpec, label: string): ParsedDimension {
  const lines = decodeSource(bytes, label).slice(0, -1).split("\n");
  const expectedHeaders = [
    spec.experimentHeader,
    spec.temperatureHeader,
    spec.supersaturationHeader,
    spec.pressureHeader,
    "",
    "Columns:   time (sec) dimensions (micron)",
    "time, a, c, Delta a min, Delta c min, Delta a max, Delta c max, ring width, Delta ring min, Delta ring max",
  ];
  if (canonicalJson(lines.slice(0, 7)) !== canonicalJson(expectedHeaders)) {
    throw new Error(`${label} seven-line source header differs`);
  }
  const rows = lines.slice(7);
  const output: string[] = [DIMENSION_HEADER.slice(0, -1)];
  let previousTime = -Infinity;
  let firstTimeLexeme = "";
  let lastTimeLexeme = "";
  for (let index = 0; index < rows.length; index++) {
    const fields = rows[index].trim().split(/\s+/);
    if (rows[index].trim().length === 0 || fields.length !== 10) {
      throw new Error(`${label} numeric row ${index + 1} does not have ten columns`);
    }
    const values = fields.map((field, column) => parseNumberToken(field, `${label} numeric row ${index + 1} column ${column + 1}`));
    const time = values[0];
    if (time < 0 || time < previousTime) throw new Error(`${label} time is negative or decreases at numeric row ${index + 1}`);
    if (values.slice(1).some((value) => value < 0)) throw new Error(`${label} has a negative dimension/error value at numeric row ${index + 1}`);
    firstTimeLexeme ||= fields[0];
    lastTimeLexeme = fields[0];
    output.push(`${index + 1}\t${fields.join("\t")}`);
    previousTime = time;
  }
  if (rows.length === 0) throw new Error(`${label} has no numeric rows`);
  if (spec.forcingEvent !== null) {
    const event = spec.forcingEvent;
    const times = rows.map((row) => row.trim().split(/\s+/)[0]);
    if (times.includes(String(event.atSeconds)) ||
        !times.includes(event.previousRowTimeLexeme) || !times.includes(event.nextRowTimeLexeme) ||
        !(Number(event.previousRowTimeLexeme) < event.atSeconds && event.atSeconds < Number(event.nextRowTimeLexeme))) {
      throw new Error(`${label} forcing-event bracketing rows differ`);
    }
  }
  return {
    tsv: new TextEncoder().encode(`${output.join("\n")}\n`),
    rowCount: rows.length,
    firstTimeLexeme,
    lastTimeLexeme,
  };
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

function parseLock(
  bytes: Uint8Array,
  registration: Phase8NativeRegistration,
): ReadonlyMap<string, LockCondition> {
  if (registration.scope === "registered-20260812" && sha256Bytes(bytes) !== PHASE8_NATIVE_LOCK_SHA256) {
    throw new Error("condition-lock bytes drifted");
  }
  const root = asObject(JSON.parse(decodeSource(bytes, "condition lock")), "condition lock");
  if (root.schema !== "phase6-heldout-candidate-lock-v1") throw new Error("condition lock schema differs");
  const sources = asObject(root.sources, "condition lock sources");
  const archive = asObject(sources.harrison2016Archive, "condition lock Harrison archive");
  if (archive.fileName !== registration.harrisonArchive.fileName ||
      archive.byteLength !== registration.harrisonArchive.byteLength ||
      archive.sha256 !== registration.harrisonArchive.sha256) {
    throw new Error("condition lock Harrison archive pin differs");
  }
  const candidate = asObject(root.harrisonCandidate, "condition lock Harrison candidate");
  if (candidate.status !== "source-locked-not-scoreable") throw new Error("condition lock candidate status differs");
  const extraction = asObject(candidate.extraction, "condition lock extraction");
  if (extraction.columns !== 6 || extraction.timeColumnZeroBased !== 2 ||
      extraction.massRatioColumnZeroBased !== 4 || extraction.requireNondecreasingTime !== true ||
      extraction.requirePositiveMassRatio !== true) {
    throw new Error("condition lock mass-column contract differs");
  }
  const excluded = asArray(candidate.excludedMembers, "condition lock excluded members");
  const excludedRecord = excluded
    .map((entry) => asObject(entry, "excluded member"))
    .find((entry) => entry.name === registration.excludedMassMember.memberName);
  if (excludedRecord === undefined ||
      excludedRecord.byteLength !== registration.excludedMassMember.byteLength ||
      excludedRecord.sha256 !== registration.excludedMassMember.sha256) {
    throw new Error("condition lock does not preserve the excluded mass member pin");
  }
  const absences = asArray(candidate.requiredAbsence, "condition lock required absence");
  if (!absences.some((entry) => String(asObject(entry, "required absence").condition).includes(registration.requiredAbsentConditionFragment))) {
    throw new Error("condition lock does not preserve the unmatched corrected condition");
  }
  const conditions = new Map<string, LockCondition>();
  for (const item of asArray(candidate.traces, "condition lock traces")) {
    const trace = asObject(item, "condition lock trace");
    const runId = String(trace.id);
    if (conditions.has(runId)) throw new Error(`condition lock duplicates run ${runId}`);
    const spec = registration.massHistories.find((value) => value.runId === runId);
    if (spec === undefined) throw new Error(`condition lock has unregistered trace ${runId}`);
    if (trace.member !== spec.memberName || trace.byteLength !== spec.byteLength || trace.sha256 !== spec.sha256) {
      throw new Error(`condition lock source-member pin differs for ${runId}`);
    }
    const numericKeys = [
      "pressurePa", "tempC", "tempRangeC", "sigmaIcePercent",
      "sigmaIceRangePercent", "initialRadiusUm", "initialRadiusRangeUm",
    ] as const;
    for (const key of numericKeys) {
      if (typeof trace[key] !== "number" || !Number.isFinite(trace[key])) {
        throw new Error(`condition lock ${runId}.${key} is invalid`);
      }
    }
    conditions.set(runId, {
      pressurePa: trace.pressurePa as number,
      tempC: trace.tempC as number,
      tempRangeC: trace.tempRangeC as number,
      sigmaIcePercent: trace.sigmaIcePercent as number,
      sigmaIceRangePercent: trace.sigmaIceRangePercent as number,
      initialRadiusUm: trace.initialRadiusUm as number,
      initialRadiusRangeUm: trace.initialRadiusRangeUm as number,
    });
  }
  if (conditions.size !== registration.massHistories.length) {
    throw new Error("condition lock selected-trace roster differs");
  }
  return conditions;
}

function descriptor(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { path, format, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function implementationPins(inputs: Phase8NativeInputs): readonly JsonObject[] {
  return PHASE8_NATIVE_IMPLEMENTATION_PATHS.map((path) => {
    const bytes = inputs.implementation.get(path);
    if (bytes === undefined) throw new Error(`missing native-history implementation bytes: ${path}`);
    return descriptor(path, bytes, "source");
  });
}

function assertRegistration(registration: Phase8NativeRegistration): void {
  const specs = [...registration.massHistories, ...registration.dimensionHistories];
  if (new Set(specs.map((spec) => spec.runId)).size !== specs.length ||
      new Set(specs.map((spec) => spec.sourceUnitId)).size !== specs.length ||
      new Set(specs.map((spec) => spec.memberName)).size !== specs.length) {
    throw new Error("native-history registration contains duplicate identities");
  }
  const totals = {
    historyCount: specs.length,
    massHistoryCount: registration.massHistories.length,
    dimensionHistoryCount: registration.dimensionHistories.length,
    rowCount: specs.reduce((sum, spec) => sum + spec.rowCount, 0),
    selectedSourceMemberBytes: specs.reduce((sum, spec) => sum + spec.byteLength, 0),
  };
  if (canonicalJson(totals) !== canonicalJson(registration.expectedTotals)) {
    throw new Error("native-history registered totals differ from member specifications");
  }
  if (registration.scope === "registered-20260812" &&
      (totals.historyCount !== 18 || totals.massHistoryCount !== 16 ||
       totals.dimensionHistoryCount !== 2 || totals.rowCount !== 252_134 ||
       totals.selectedSourceMemberBytes !== 23_790_803)) {
    throw new Error("registered Phase 8B P0 totals differ");
  }
}

function parseSelectionRoster(bytes: Uint8Array, registration: Phase8NativeRegistration): void {
  if (registration.scope === "registered-20260812" && sha256Bytes(bytes) !== PHASE8_NATIVE_SELECTION_SHA256) {
    throw new Error("P0 selection bytes drifted");
  }
  const text = decodeSource(bytes, "P0 selection");
  const p0: JsonObject[] = [];
  for (const [index, line] of text.slice(0, -1).split("\n").entries()) {
    if (line.length === 0) throw new Error("P0 selection contains a blank line");
    const record = asObject(
      parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `P0 selection line ${index + 1}`),
      `P0 selection line ${index + 1}`,
    );
    if (record.priorityClass !== "P0") continue;
    if (record.schema !== "phase8b-benchmark-selection-v1" ||
        record.recordKind !== "benchmark-selection" ||
        record.phase9EvidenceRole !== "model-development" ||
        record.numericTargetCoordinatesExtractedBeforeSelection !== false ||
        record.outcomeValueUsedAsSelectionCriterion !== false) {
      throw new Error(`P0 selection line ${index + 1} has incompatible selection semantics`);
    }
    const source = asObject(record.source, `P0 selection line ${index + 1} source`);
    p0.push({
      sourceUnitId: asString(source.sourceUnitId, `P0 selection line ${index + 1} sourceUnitId`),
      locator: asString(source.locator, `P0 selection line ${index + 1} locator`),
      measurementFamily: asString(record.measurementFamily, `P0 selection line ${index + 1} measurementFamily`),
    });
  }
  const expected = [
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
  p0.sort(order);
  expected.sort(order);
  if (canonicalJson(p0) !== canonicalJson(expected)) {
    throw new Error("P0 selection unit/locator roster differs from the native-history registration");
  }
}

/** Derive the complete P0 native-history publication without writing any files. */
export function derivePhase8NativeBundle(inputs: Phase8NativeInputs): Phase8NativeBundle {
  const registration = inputs.registration ?? PHASE8_NATIVE_REGISTERED;
  assertRegistration(registration);
  parseSelectionRoster(inputs.selectionBytes, registration);
  assertPin(inputs.harrisonArchiveBytes, registration.harrisonArchive, "Harrison archive");
  assertPin(inputs.dimensionArchiveBytes, registration.dimensionArchive, "dimension archive");
  const harrison = phase8bReadZipInventory(inputs.harrisonArchiveBytes);
  const dimension = phase8bReadZipInventory(inputs.dimensionArchiveBytes);
  if (harrison.regularMembers.length !== registration.harrisonArchive.regularMemberCount ||
      dimension.regularMembers.length !== registration.dimensionArchive.regularMemberCount) {
    throw new Error("source archive regular-member count differs");
  }
  const harrisonByPath = new Map(harrison.regularMembers.map((member) => [member.path, member]));
  const dimensionByPath = new Map(dimension.regularMembers.map((member) => [member.path, member]));
  const excludedPath = `${registration.harrisonArchive.memberRoot}/${registration.excludedMassMember.memberName}`;
  const excludedMember = harrisonByPath.get(excludedPath);
  if (excludedMember === undefined) throw new Error("excluded mass member is absent from its source archive");
  assertPin(excludedMember.bytes, registration.excludedMassMember, "excluded mass member");
  const conditions = parseLock(inputs.conditionLockBytes, registration);
  const dataArtifacts = new Map<string, Uint8Array>();
  const records: JsonObject[] = [];
  let historiesWithMassDecrease = 0;
  let largestMassDecreaseCount = -1;
  let largestMassDecreaseRunId = "";

  for (const spec of registration.massHistories) {
    const memberPath = `${registration.harrisonArchive.memberRoot}/${spec.memberName}`;
    const member = harrisonByPath.get(memberPath);
    if (member === undefined) throw new Error(`selected mass member is missing: ${memberPath}`);
    assertPin(member.bytes, spec, `selected mass member ${spec.runId}`);
    const parsed = parseMass(member.bytes, `mass history ${spec.runId}`);
    if (parsed.rowCount !== spec.rowCount) throw new Error(`mass-history row count differs for ${spec.runId}`);
    if (parsed.adjacentMassDecreaseCount > 0) historiesWithMassDecrease++;
    if (parsed.adjacentMassDecreaseCount > largestMassDecreaseCount) {
      largestMassDecreaseCount = parsed.adjacentMassDecreaseCount;
      largestMassDecreaseRunId = spec.runId;
    }
    if (registration.scope === "registered-20260812" && spec.runId === "712k" &&
        (parsed.uniqueTimeCount !== 1_595 || parsed.adjacentRepeatedTimeCount !== 8_850 ||
         parsed.maximumTimeMultiplicity !== 22)) {
      throw new Error("712k duplicate-time structure differs");
    }
    if (registration.scope === "registered-20260812" && spec.runId === "724b" &&
        parsed.lastTimeLexeme !== "3.6106760e+03") {
      throw new Error("724b raw terminal time differs from 3610.676 seconds");
    }
    const outputPath = `data/mass-ratio-${spec.runId}.tsv`;
    if (dataArtifacts.has(outputPath)) throw new Error(`duplicate output path ${outputPath}`);
    dataArtifacts.set(outputPath, parsed.tsv);
    const condition = conditions.get(spec.runId) as LockCondition;
    records.push({
      recordKind: "measurement-set",
      schema: PHASE8_NATIVE_SCHEMA,
      id: `P8B-NATIVE-MASS-${spec.runId.toUpperCase()}`,
      priorityClass: "P0",
      developmentRole: "model-development",
      historyKind: "mass-ratio",
      runId: spec.runId,
      sourceUnitId: spec.sourceUnitId,
      sourceContainer: registration.harrisonArchive.fileName,
      sourceContainerSha256: registration.harrisonArchive.sha256,
      sourceMemberPath: memberPath,
      sourceMemberByteLength: spec.byteLength,
      sourceMemberSha256: spec.sha256,
      sourceRows: parsed.rowCount,
      sourceColumns: 6,
      selectedSourceColumnsZeroBased: [2, 4],
      excludedSourceColumn: { zeroBased: 5, reason: "undocumented base unit; not an eligible observable" },
      normalized: {
        logicalRoot: registration.dataLogicalRoot,
        path: outputPath,
        mediaType: "text/tab-separated-values",
        byteLength: parsed.tsv.byteLength,
        sha256: sha256Bytes(parsed.tsv),
        header: MASS_HEADER.trimEnd(),
        sourceRowIndex: "one-based numeric source-row order",
        sourceLexemesPreserved: true,
      },
      observable: "single-particle mass ratio m/m0 as a function of elapsed time",
      conditions: {
        pressurePa: condition.pressurePa,
        pressureUncertainty: "not stated",
        tempC: condition.tempC,
        tempRangeC: condition.tempRangeC,
        sigmaIcePercent: condition.sigmaIcePercent,
        sigmaIceRangePercent: condition.sigmaIceRangePercent,
        initialRadiusUm: condition.initialRadiusUm,
        initialRadiusRangeUm: condition.initialRadiusRangeUm,
        source: PHASE8_NATIVE_LOCK_PATH,
        covariance: "not reported; marginal ranges remain separate",
      },
      uncertainty: {
        massRatio: "source-stated maximum relative error of 5 percent; not a probability interval",
        extraction: "zero lexical transcription error for selected native columns after independent byte comparison",
      },
      timeFacts: {
        firstSourceLexeme: parsed.firstTimeLexeme,
        lastSourceLexeme: parsed.lastTimeLexeme,
        uniqueTimeCount: parsed.uniqueTimeCount,
        adjacentRepeatedTimeCount: parsed.adjacentRepeatedTimeCount,
        maximumTimeMultiplicity: parsed.maximumTimeMultiplicity,
        adjacentMassDecreaseCount: parsed.adjacentMassDecreaseCount,
        coalesced: false,
        smoothed: false,
      },
      specimen: "one selected Snomax-frozen levitated particle; crystallography and habit unobserved",
      lineage: "Harrison 2016 raw trace joined to Pokrifka 2020 corrected conditions; one campaign witness",
      rights: {
        sourceBytes: "not broadly redistributable under identified terms",
        derivedRows: "unknown; substantial row body remains NAS-local",
      },
      disposition: "included-native-history",
    });
  }

  for (const spec of registration.dimensionHistories) {
    const memberPath = `${registration.dimensionArchive.memberRoot}/${spec.memberName}`;
    const member = dimensionByPath.get(memberPath);
    if (member === undefined) throw new Error(`selected dimension member is missing: ${memberPath}`);
    assertPin(member.bytes, spec, `selected dimension member ${spec.runId}`);
    const parsed = parseDimension(member.bytes, spec, `dimension history ${spec.runId}`);
    if (parsed.rowCount !== spec.rowCount) throw new Error(`dimension-history row count differs for ${spec.runId}`);
    const outputPath = `data/dimensions-${spec.runId}.tsv`;
    dataArtifacts.set(outputPath, parsed.tsv);
    records.push({
      recordKind: "measurement-set",
      schema: PHASE8_NATIVE_SCHEMA,
      id: `P8B-NATIVE-DIMENSIONS-${spec.runId}`,
      priorityClass: "P0",
      developmentRole: "model-development",
      historyKind: "dimensions",
      runId: spec.runId,
      sourceUnitId: spec.sourceUnitId,
      sourceContainer: registration.dimensionArchive.fileName,
      sourceContainerSha256: registration.dimensionArchive.sha256,
      sourceMemberPath: memberPath,
      sourceMemberByteLength: spec.byteLength,
      sourceMemberSha256: spec.sha256,
      sourceRows: parsed.rowCount,
      sourceColumns: 10,
      selectedSourceColumnsZeroBased: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      normalized: {
        logicalRoot: registration.dataLogicalRoot,
        path: outputPath,
        mediaType: "text/tab-separated-values",
        byteLength: parsed.tsv.byteLength,
        sha256: sha256Bytes(parsed.tsv),
        header: DIMENSION_HEADER.trimEnd(),
        sourceRowIndex: "one-based numeric source-row order after the exact seven-line header",
        sourceLexemesPreserved: true,
      },
      observable: "single-particle a dimension, c dimension, and rim width as functions of elapsed time",
      conditions: {
        tempC: spec.tempC,
        temperatureUncertainty: "not stated",
        pressureHpa: spec.pressureHpa,
        pressureUncertainty: "not stated",
        sourceReportedSupersaturationPercent: spec.initialSupersaturationPercent,
        supersaturationSemanticStatus: "source-relative basis unresolved; not a model input",
        forcingEvent: spec.forcingEvent === null ? null : {
          atSeconds: spec.forcingEvent.atSeconds,
          sourceReportedSupersaturationPercent: spec.forcingEvent.supersaturationPercent,
          assignment: "event remains at exactly 13800 s; no observation occurs at the event",
          previousRowTimeLexeme: spec.forcingEvent.previousRowTimeLexeme,
          nextRowTimeLexeme: spec.forcingEvent.nextRowTimeLexeme,
        },
      },
      uncertainty: {
        dimensions: "source min/max error constructions retained as separate columns; not standard deviations or confidence intervals",
        covariance: "not reported across time, axes, views, or error columns",
        extraction: "zero lexical transcription error after independent byte comparison",
      },
      timeFacts: {
        firstSourceLexeme: parsed.firstTimeLexeme,
        lastSourceLexeme: parsed.lastTimeLexeme,
        smoothed: false,
      },
      specimen: "one selected substrate-grown columnar ice crystal observed from two camera views",
      lineage: "Pokrifka, Moyle, and Harrington 2025 observation reused in Harrington and Pokrifka 2026",
      rights: {
        sourceBytes: "not broadly redistributable under identified terms",
        derivedRows: "unknown; substantial row body remains NAS-local",
      },
      disposition: "included-native-history",
    });
  }

  records.sort((left, right) => String(left.id) < String(right.id) ? -1 : String(left.id) > String(right.id) ? 1 : 0);
  if (registration.scope === "registered-20260812" &&
      (historiesWithMassDecrease !== 12 || largestMassDecreaseCount !== 57 || largestMassDecreaseRunId !== "805a")) {
    throw new Error("registered raw mass nonmonotonicity facts differ");
  }
  const normalizedDataBytes = [...dataArtifacts.values()].reduce((sum, bytes) => sum + bytes.byteLength, 0);
  const counts = {
    historyCount: records.length,
    massHistoryCount: registration.massHistories.length,
    dimensionHistoryCount: registration.dimensionHistories.length,
    rowCount: records.reduce((sum, record) => sum + Number(record.sourceRows), 0),
    selectedSourceMemberBytes: records.reduce((sum, record) => sum + Number(record.sourceMemberByteLength), 0),
    normalizedDataBytes,
  };
  if (counts.historyCount !== registration.expectedTotals.historyCount ||
      counts.rowCount !== registration.expectedTotals.rowCount ||
      counts.selectedSourceMemberBytes !== registration.expectedTotals.selectedSourceMemberBytes) {
    throw new Error("derived native-history totals differ from registration");
  }

  const recordsBytes = new TextEncoder().encode(`${records.map((record) => canonicalJson(record)).join("\n")}\n`);
  const operator: JsonObject = {
    schema: "phase8b-native-history-operator-v1",
    operator: PHASE8_NATIVE_OPERATOR,
    state: "registered-and-executed-producer-awaiting-independent-verification",
    scope: registration.scope,
    nasDataLogicalRoot: registration.dataLogicalRoot,
    rules: {
      mass: "parse every six-column row; emit one-based row index plus exact source time and m/m0 lexemes from columns 3 and 5",
      dimensions: "retain the exact seven-line header contract; emit every ten-column row and all source lexemes",
      duplicateTimes: "preserve raw rows; no coalescing in this operator",
      monotonicity: "time must be nondecreasing; measured mass and dimensions are not forced monotone",
      excludedSixthMassColumn: true,
      excluded625: true,
      unmatchedCorrectedConditionRemainsAbsent: true,
      derivedViewsProduced: false,
    },
    sourceInputs: {
      harrisonArchive: descriptor(registration.harrisonArchive.fileName, inputs.harrisonArchiveBytes, "zip"),
      dimensionArchive: descriptor(registration.dimensionArchive.fileName, inputs.dimensionArchiveBytes, "zip"),
      conditionLock: descriptor(PHASE8_NATIVE_LOCK_PATH, inputs.conditionLockBytes, "json"),
      benchmarkSelection: descriptor(PHASE8_NATIVE_SELECTION_PATH, inputs.selectionBytes, "canonical-jsonl"),
      excludedMassMember: descriptor(excludedPath, excludedMember.bytes, "source-member"),
    },
    implementation: implementationPins(inputs),
    rightsBoundary: "normalized row bodies remain NAS-local until redistribution rights are resolved",
  };
  const operatorBytes = canonicalJsonBytes(operator);
  const dataBindings = [...dataArtifacts.entries()]
    .map(([path, bytes]) => descriptor(path, bytes, "tsv-source-lexemes"))
    .sort((left, right) => String(left.path) < String(right.path) ? -1 : 1);
  const report: JsonObject = {
    schema: "phase8b-native-history-report-v1",
    operator: PHASE8_NATIVE_OPERATOR,
    state: "producer-derived-awaiting-independent-verification",
    counts,
    rawFacts: {
      historiesWithMassDecrease,
      largestAdjacentMassDecreaseCount: largestMassDecreaseCount,
      largestAdjacentMassDecreaseRunId: largestMassDecreaseRunId,
      duplicateTimeHandling: "preserved-not-coalesced",
      dimensionForcingEventSeconds: 13_800,
    },
    limitations: [
      "row bodies are NAS-local because broad derived-data redistribution rights are unresolved",
      "source-reported dimension supersaturation basis remains unresolved and is not a model input",
      "mass-history specimens lack observed habit and crystallography",
      "this producer report is not an independent verification verdict and grants no validation claim",
    ],
    grantsValidationClaim: false,
    permitsPhase9Execution: false,
    artifacts: {
      operator: descriptor("operator.json", operatorBytes, "canonical-json"),
      records: descriptor("records.jsonl", recordsBytes, "canonical-jsonl"),
      nasData: dataBindings,
    },
  };
  const reportBytes = canonicalJsonBytes(report);
  const index: JsonObject = {
    schema: "phase8b-native-history-index-v1",
    operator: PHASE8_NATIVE_OPERATOR,
    metadataArtifacts: [
      descriptor("operator.json", operatorBytes, "canonical-json"),
      descriptor("records.jsonl", recordsBytes, "canonical-jsonl"),
      descriptor("report.json", reportBytes, "canonical-json"),
    ],
    nasDataArtifacts: dataBindings,
  };
  const metadataArtifacts = new Map<string, Uint8Array>([
    ["artifact-index.json", canonicalJsonBytes(index)],
    ["operator.json", operatorBytes],
    ["records.jsonl", recordsBytes],
    ["report.json", reportBytes],
  ]);
  return {
    scope: registration.scope,
    dataLogicalRoot: registration.dataLogicalRoot,
    metadataArtifacts,
    dataArtifacts,
    counts,
  };
}

function safeDataPath(path: string): readonly [string, string] {
  const match = /^data\/([a-z0-9-]+\.tsv)$/.exec(path);
  if (match === null) throw new Error(`unsafe native-history data path: ${path}`);
  return ["data", match[1]];
}

function physicalTarget(path: string): string {
  let cursor = resolve(path);
  const suffix: string[] = [];
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) throw new Error(`native-history target has no existing ancestor: ${path}`);
    suffix.unshift(basename(cursor));
    cursor = parent;
  }
  return resolve(realpathSync(cursor), ...suffix);
}

function pathIsWithin(parent: string, candidate: string): boolean {
  const displacement = relative(parent, candidate);
  return displacement === "" ||
    (!isAbsolute(displacement) && displacement !== ".." && !displacement.startsWith(`..${sep}`));
}

/** Atomically publish one complete NAS-local directory and refuse any overwrite. */
export function writePhase8NativeDirectory(
  directory: string,
  bundle: Phase8NativeBundle,
  options: { readonly repositoryRoot?: string } = {},
): void {
  const metadataNames = [...bundle.metadataArtifacts.keys()].sort();
  if (canonicalJson(metadataNames) !== canonicalJson([...PHASE8_NATIVE_METADATA_NAMES].sort())) {
    throw new Error("refusing incomplete native-history metadata bundle");
  }
  if (bundle.dataArtifacts.size !== bundle.counts.historyCount) {
    throw new Error("refusing incomplete native-history data bundle");
  }
  if (bundle.scope === "registered-20260812") {
    if (options.repositoryRoot === undefined) {
      throw new Error("registered native-history publication requires repositoryRoot containment check");
    }
    const repositoryPhysical = realpathSync(resolve(options.repositoryRoot));
    const targetPhysical = physicalTarget(directory);
    if (pathIsWithin(repositoryPhysical, targetPhysical)) {
      throw new Error("refusing registered native-history row bodies inside the repository");
    }
  }
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing native-history directory: ${directory}`);
  const parent = dirname(directory);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    mkdirSync(join(staging, "data"));
    for (const [name, bytes] of bundle.metadataArtifacts) {
      writeFileSync(join(staging, name), bytes, { flag: "wx" });
    }
    for (const [path, bytes] of bundle.dataArtifacts) {
      const [, name] = safeDataPath(path);
      writeFileSync(join(staging, "data", name), bytes, { flag: "wx" });
    }
    renameSync(staging, directory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

export function capturePhase8NativeInputs(options: {
  readonly repositoryRoot: string;
  readonly contentRoot: string;
}): Phase8NativeInputs {
  const implementation = new Map<string, Uint8Array>();
  for (const path of PHASE8_NATIVE_IMPLEMENTATION_PATHS) {
    implementation.set(path, new Uint8Array(readFileSync(resolve(options.repositoryRoot, path))));
  }
  return {
    registration: PHASE8_NATIVE_REGISTERED,
    harrisonArchiveBytes: new Uint8Array(readFileSync(resolve(options.contentRoot, PHASE8_NATIVE_REGISTERED.harrisonArchive.fileName))),
    dimensionArchiveBytes: new Uint8Array(readFileSync(resolve(options.contentRoot, PHASE8_NATIVE_REGISTERED.dimensionArchive.fileName))),
    conditionLockBytes: new Uint8Array(readFileSync(resolve(options.repositoryRoot, PHASE8_NATIVE_LOCK_PATH))),
    selectionBytes: new Uint8Array(readFileSync(resolve(options.repositoryRoot, PHASE8_NATIVE_SELECTION_PATH))),
    implementation,
  };
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-native-history.ts build --content-root <dir> " +
    "--bundle <dir> [--repository-root <dir>]",
  );
}

function cli(argv: readonly string[]): void {
  if (argv[0] !== "build") usage();
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
  const repositoryRoot = values.get("--repository-root") ?? resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const bundle = derivePhase8NativeBundle(capturePhase8NativeInputs({ repositoryRoot, contentRoot }));
  writePhase8NativeDirectory(resolve(bundleDirectory), bundle, { repositoryRoot });
  process.stdout.write(`${canonicalJson({ state: "published-native-history-candidate", directory: resolve(bundleDirectory), counts: bundle.counts })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    cli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
