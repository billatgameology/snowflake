/**
 * Phase 9 S8 M-PK residual source-replay foundation.
 *
 * This pure module verifies exact caller-supplied source rows and returns eligibility/refusal
 * facts only. It deliberately contains no surface-kinetics residual, supported-crystal transfer
 * model, score, fitting, I/O, or promotion path.
 */

export const PHASE9_MPK_PROTOCOL_ID = "phase9-mpk-residual-source-replay-foundation-v1" as const;

export type Phase9MpkSeriesId =
  | "P8B-P1-L16-F3-H"
  | "P8B-P1-L16-F3-R"
  | "P8B-P1-L16-F4-H"
  | "P8B-P1-L16-F4-R";

export type Phase9MpkAxis = "height" | "radius";

export interface Phase9MpkSeriesRegistration {
  readonly selectionId: Phase9MpkSeriesId;
  readonly figure: "Figure 3" | "Figure 4";
  readonly sourceLocator: string;
  readonly axis: Phase9MpkAxis;
  readonly rowCount: 18 | 21;
  readonly rowArtifact: {
    readonly logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3";
    readonly path: string;
    readonly byteLength: number;
    readonly sha256: string;
  };
  readonly metadataSemanticSha256: string;
  readonly adapterSemanticSha256: string;
  readonly successorSemanticSha256: string;
  readonly airPressureBar: 1;
  readonly temperatureC: -5;
  readonly centerSupersaturationPercentApprox: 0.92 | 1.8;
  readonly deltaTC: 2.5 | 3.5;
  readonly plottedVariable:
    | "plotted_dimension"
    | "plotted_height_with_arbitrary_offset"
    | "needle_tip_radius";
  readonly heightOffsetPolicy: "source-subtracted-arbitrary-constant-preserved" | "not-applicable";
}
const ROW_ROOT = "research-cache/phase8b-derived/plot-extraction-20260812-v3" as const;

export const PHASE9_MPK_SERIES = Object.freeze([
  Object.freeze({
    selectionId: "P8B-P1-L16-F3-H",
    figure: "Figure 3",
    sourceLocator: "P8B-S2R0-909CDB8504D9CFC72F703634;pdf-page:5;Figure 3",
    axis: "height",
    rowCount: 18,
    rowArtifact: Object.freeze({
      logicalRoot: ROW_ROOT,
      path: "rows/P8B-P1-L16-F3-H.jsonl",
      byteLength: 28_912,
      sha256: "7e13eccd708eac7355b3d06ab0990915517fb85d2a9b7d3da11badbdcd00b221",
    }),
    metadataSemanticSha256: "1c230f8568c2c2dce1b1ced07c1cd90fddfe0324c641b8b1ccc124c5124d1f39",
    adapterSemanticSha256: "a0a1fd7f4b658dfb9e34705c1159cbdfc497e50ae028ae10ef12f2c4e18ebbfb",
    successorSemanticSha256: "9311dbd4c843213f55ab9f49481d2bb02a425674e5349e759bd977e30934f4e1",
    airPressureBar: 1,
    temperatureC: -5,
    centerSupersaturationPercentApprox: 0.92,
    deltaTC: 2.5,
    plottedVariable: "plotted_dimension",
    heightOffsetPolicy: "source-subtracted-arbitrary-constant-preserved",
  }),
  Object.freeze({
    selectionId: "P8B-P1-L16-F3-R",
    figure: "Figure 3",
    sourceLocator: "P8B-S2R0-909CDB8504D9CFC72F703634;pdf-page:5;Figure 3",
    axis: "radius",
    rowCount: 18,
    rowArtifact: Object.freeze({
      logicalRoot: ROW_ROOT,
      path: "rows/P8B-P1-L16-F3-R.jsonl",
      byteLength: 29_598,
      sha256: "35b3393f05dcea6ff3a17b214c0a6c3218417496294d0f3aa4fc20da7408b0de",
    }),
    metadataSemanticSha256: "0bd1b7519a042f11a925b262a5fcfb0388f3a7c823dace2ece7ecd91ff2242cd",
    adapterSemanticSha256: "776a73cb74e55d2ade12e0145ff8e894a8dda95542b63957292ffe0baefe0bd7",
    successorSemanticSha256: "8ea855731e09c6a68793bc164a96f512835f7223ac2c4480ca20dfebdde96e37",
    airPressureBar: 1,
    temperatureC: -5,
    centerSupersaturationPercentApprox: 0.92,
    deltaTC: 2.5,
    plottedVariable: "plotted_dimension",
    heightOffsetPolicy: "not-applicable",
  }),
  Object.freeze({
    selectionId: "P8B-P1-L16-F4-H",
    figure: "Figure 4",
    sourceLocator: "P8B-S2R0-909CDB8504D9CFC72F703634;pdf-page:7;Figure 4;top panel",
    axis: "height",
    rowCount: 21,
    rowArtifact: Object.freeze({
      logicalRoot: ROW_ROOT,
      path: "rows/P8B-P1-L16-F4-H.jsonl",
      byteLength: 34_175,
      sha256: "e59bd13c4738795b164609d5d5fd7cc3e8fd00589f54337758f0777f9ad51c52",
    }),
    metadataSemanticSha256: "75fabecb58da475182ed88adb21fe87d886208d6b2001f5a4f09a5800d4e235e",
    adapterSemanticSha256: "df767173f2a25d580184410087f7c3a86a4e43a2df3c201c1b4db3593174d10a",
    successorSemanticSha256: "dbaea8ce730f0016fe8e34085ee05e1191a02dfabe5d360c6146f3a5569d8fad",
    airPressureBar: 1,
    temperatureC: -5,
    centerSupersaturationPercentApprox: 1.8,
    deltaTC: 3.5,
    plottedVariable: "plotted_height_with_arbitrary_offset",
    heightOffsetPolicy: "source-subtracted-arbitrary-constant-preserved",
  }),
  Object.freeze({
    selectionId: "P8B-P1-L16-F4-R",
    figure: "Figure 4",
    sourceLocator: "P8B-S2R0-909CDB8504D9CFC72F703634;pdf-page:7;Figure 4;bottom panel",
    axis: "radius",
    rowCount: 21,
    rowArtifact: Object.freeze({
      logicalRoot: ROW_ROOT,
      path: "rows/P8B-P1-L16-F4-R.jsonl",
      byteLength: 34_952,
      sha256: "d07c1de41c54209890cbbbf5c722e0ec293dd32627972800fc0f2f7676887221",
    }),
    metadataSemanticSha256: "8a1f52eff1cea40459138facfb87446a73bec09022f7d168e5430a870037c7fa",
    adapterSemanticSha256: "da0ddcdfe4f9529c039e18e9cc253edcc75ebf80d8f472e88f9785d29466048c",
    successorSemanticSha256: "522552be3da8a455588bed06f13e5a0484cd81f81e011020f90381eef244fcd6",
    airPressureBar: 1,
    temperatureC: -5,
    centerSupersaturationPercentApprox: 1.8,
    deltaTC: 3.5,
    plottedVariable: "needle_tip_radius",
    heightOffsetPolicy: "not-applicable",
  }),
] as const satisfies readonly Phase9MpkSeriesRegistration[]);

export const PHASE9_MPK_REFUSAL_CODES = Object.freeze([
  "SURFACE_KINETICS_RESIDUAL_NOT_IDENTIFIED",
  "ARBITRARY_HEIGHT_OFFSET_MUST_BE_PRESERVED",
  "SUBSTRATE_ASYMMETRIC_TRANSFER_NOT_IMPLEMENTED",
  "CROSS_PRESSURE_NUMERIC_SCORE_FORBIDDEN",
  "THREE_DIMENSIONAL_REPLAY_NOT_AUTHORIZED",
  "PROMOTION_NOT_AUTHORIZED",
  "VALIDATION_NOT_AUTHORIZED",
] as const);

export type Phase9MpkRefusalCode = (typeof PHASE9_MPK_REFUSAL_CODES)[number];

export interface Phase9MpkPlotInterval {
  readonly digitizationLower: number;
  readonly digitizationUpper: number;
  readonly unit: "s" | "um";
  readonly value: number;
  readonly variable: string;
}

export interface Phase9MpkSourceRow {
  readonly schema: "phase8b-plot-point-v1";
  readonly selectionId: Phase9MpkSeriesId;
  readonly pointId: string;
  readonly sourceLocator: string;
  readonly sourceStatus: "direct-observation";
  readonly phase9EvidenceRole: "model-development";
  readonly expectedPointCount: number;
  readonly operator: "phase8b-adjudicated-plot-digitization-v3";
  readonly adjudicationStatus: string;
  readonly adjudication: object;
  readonly digitizationUncertainty: object;
  readonly preReadRefusal: object;
  readonly sourceUncertainty: object;
  readonly x: Phase9MpkPlotInterval;
  readonly y: Phase9MpkPlotInterval;
}

export interface Phase9MpkReplayPreparationInput {
  readonly purpose: "exact-one-bar-source-replay-preparation";
  readonly selectionId: Phase9MpkSeriesId;
  readonly sourceArtifactSha256: "909cdb8504d9cfc72f70363436e5c796b99c7e107cab4331051e446255fc8ed4";
  readonly airPressureBar: 1;
  readonly support: "substrate-grown-needle";
  readonly geometry: "supported-individual-needle";
  readonly transferModel: "unavailable";
  readonly arbitraryHeightOffsetPolicy:
    | "source-subtracted-arbitrary-constant-preserved"
    | "not-applicable";
  readonly rows: readonly Phase9MpkSourceRow[];
}

export interface Phase9MpkReplayPreparation {
  readonly status: "source-replay-prepared-residual-refused";
  readonly selectionId: Phase9MpkSeriesId;
  readonly axis: Phase9MpkAxis;
  readonly sourceRowCount: 18 | 21;
  readonly firstTimeSeconds: number;
  readonly lastTimeSeconds: number;
  readonly arbitraryHeightOffsetPreserved: boolean;
  readonly aggregateGasPressureConstraintCount: 26;
  readonly aggregateGasPressureConstraintStatus: "transport-confounded-no-cross-pressure-score";
  readonly refusalCodes: readonly Phase9MpkRefusalCode[];
  readonly sourceDataScoreProduced: false;
  readonly modelScoreProduced: false;
  readonly surfaceKineticsResidualProduced: false;
  readonly threeDimensionalReplayExecuted: false;
  readonly promotionAuthorized: false;
  readonly grantsValidationClaim: false;
}

type UnknownRecord = Record<string, unknown>;

function exactKeys(value: unknown, expected: readonly string[], label: string): asserts value is UnknownRecord {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const pinned = [...expected].sort();
  if (actual.length !== pinned.length || actual.some((key, index) => key !== pinned[index])) {
    throw new Error(`${label} key set differs`);
  }
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function validateInterval(
  interval: Phase9MpkPlotInterval,
  expectedVariable: string,
  expectedUnit: "s" | "um",
  label: string,
): void {
  exactKeys(interval, ["digitizationLower", "digitizationUpper", "unit", "value", "variable"], label);
  const lower = finite(interval.digitizationLower, `${label} lower`);
  const value = finite(interval.value, `${label} value`);
  const upper = finite(interval.digitizationUpper, `${label} upper`);
  if (lower > value || value > upper) throw new Error(`${label} interval order differs`);
  if (interval.unit !== expectedUnit || interval.variable !== expectedVariable) {
    throw new Error(`${label} variable or unit differs`);
  }
}

function denseRows(rows: readonly Phase9MpkSourceRow[], count: number): void {
  if (!Array.isArray(rows) || rows.length !== count) throw new Error("source row count differs");
  const actualKeys = Reflect.ownKeys(rows);
  const expectedKeys: PropertyKey[] = Array.from({ length: count }, (_unused, index) => String(index));
  expectedKeys.push("length");
  if (actualKeys.length !== expectedKeys.length ||
      actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error("source rows must have only the exact dense array own properties");
  }
  for (let index = 0; index < count; index += 1) {
    if (!Object.hasOwn(rows, index)) throw new Error("source rows must be dense");
  }
}

/** Verify exact row-envelope semantics and return only preparation/refusal facts. */
export function phase9MpkPrepareSourceReplay(
  input: Phase9MpkReplayPreparationInput,
): Phase9MpkReplayPreparation {
  exactKeys(input, [
    "purpose", "selectionId", "sourceArtifactSha256", "airPressureBar", "support", "geometry",
    "transferModel", "arbitraryHeightOffsetPolicy", "rows",
  ], "M-PK replay input");
  if (input.purpose !== "exact-one-bar-source-replay-preparation") {
    throw new Error("M-PK purpose differs");
  }
  const registration = PHASE9_MPK_SERIES.find((row) => row.selectionId === input.selectionId);
  if (registration === undefined) throw new Error("M-PK series is not registered");
  if (input.sourceArtifactSha256 !== "909cdb8504d9cfc72f70363436e5c796b99c7e107cab4331051e446255fc8ed4") {
    throw new Error("M-PK source identity differs");
  }
  if (input.airPressureBar !== 1 || input.support !== "substrate-grown-needle" ||
      input.geometry !== "supported-individual-needle" || input.transferModel !== "unavailable") {
    throw new Error("M-PK condition or transfer refusal differs");
  }
  if (input.arbitraryHeightOffsetPolicy !== registration.heightOffsetPolicy) {
    throw new Error("M-PK arbitrary height offset policy differs");
  }
  denseRows(input.rows, registration.rowCount);
  let previousTime = -Infinity;
  for (let index = 0; index < input.rows.length; index += 1) {
    const row = input.rows[index];
    exactKeys(row, [
      "adjudication", "adjudicationStatus", "digitizationUncertainty", "expectedPointCount",
      "operator", "phase9EvidenceRole", "pointId", "preReadRefusal", "schema", "selectionId",
      "sourceLocator", "sourceStatus", "sourceUncertainty", "x", "y",
    ], `source row ${index + 1}`);
    if (row.schema !== "phase8b-plot-point-v1" || row.selectionId !== registration.selectionId ||
        row.pointId !== `p${String(index + 1).padStart(3, "0")}` ||
        row.sourceLocator !== registration.sourceLocator || row.sourceStatus !== "direct-observation" ||
        row.phase9EvidenceRole !== "model-development" || row.expectedPointCount !== registration.rowCount ||
        row.operator !== "phase8b-adjudicated-plot-digitization-v3") {
      throw new Error(`source row ${index + 1} identity or provenance differs`);
    }
    validateInterval(row.x, "growth_time", "s", `source row ${index + 1} x`);
    validateInterval(row.y, registration.plottedVariable, "um", `source row ${index + 1} y`);
    if (row.x.value <= previousTime) throw new Error("source row times must be strictly increasing");
    previousTime = row.x.value;
  }
  const first = input.rows[0];
  const last = input.rows[input.rows.length - 1];
  if (first === undefined || last === undefined) throw new Error("source rows are empty");
  return Object.freeze({
    status: "source-replay-prepared-residual-refused",
    selectionId: registration.selectionId,
    axis: registration.axis,
    sourceRowCount: registration.rowCount,
    firstTimeSeconds: first.x.value,
    lastTimeSeconds: last.x.value,
    arbitraryHeightOffsetPreserved: registration.axis === "height",
    aggregateGasPressureConstraintCount: 26,
    aggregateGasPressureConstraintStatus: "transport-confounded-no-cross-pressure-score",
    refusalCodes: PHASE9_MPK_REFUSAL_CODES,
    sourceDataScoreProduced: false,
    modelScoreProduced: false,
    surfaceKineticsResidualProduced: false,
    threeDimensionalReplayExecuted: false,
    promotionAuthorized: false,
    grantsValidationClaim: false,
  });
}
