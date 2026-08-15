import { createHash } from "node:crypto";

/** Pre-score, descriptive-only M-S package. No function in this module scores a model. */
export const PHASE9_MS_PROTOCOL_ID = "phase9-ms-prescore-protocol-v1" as const;
export const PHASE9_MS_REGISTRY_SHA256 =
  "a2e5d97681335c4b819b3b9e40a7ff7fa04d744a55d179018d1f019ce959623f" as const;
export const PHASE9_MS_REGISTRY_BYTE_LENGTH = 4590 as const;
export const PHASE9_MS_SATO_SHA256 =
  "3b2003581d94e04c6d4e3d611d1c229e326df28a7d16997a1b09c2f561f68d4d" as const;
export const PHASE9_MS_BACON_SHA256 =
  "f312a5a18889320c0be62d200c39db723bca2a1d68968b8ec308dc4789370530" as const;

export const PHASE9_MS_CATEGORY_CODEBOOK = Object.freeze([
  Object.freeze({ code: 1, label: "column" }),
  Object.freeze({ code: 2, label: "combination-of-columns" }),
  Object.freeze({ code: 3, label: "combination-of-columns-and-plates" }),
  Object.freeze({ code: 4, label: "radiating-assemblage-of-plates" }),
  Object.freeze({ code: 5, label: "peculiar-shape" }),
] as const);

export const PHASE9_MS_CLAIM_BOUNDARY = Object.freeze({
  phase9Role: "pre-score-descriptive-development-only",
  sourceDataScoreProduced: false,
  causalEffectEstimated: false,
  matchedExposureClaimAvailable: false,
  physicalPromotionEligible: false,
  grantsValidationClaim: false,
});

export type Phase9MsSatoPurpose =
  | "preactivation-reported-directions"
  | "microcline-morphology-reported-directions"
  | "microcline-nucleation-proportion-contrast"
  | "frozen-droplet-peculiar-proportion";

export type Phase9MsBaconSelectionId =
  | "P8B-P1-BACON-INITIATION-ASPECT"
  | "P8B-P1-BACON-MASS-GROWTH-CONTRAST";

export type Phase9MsBaconPurpose =
  | "directional-range-description"
  | "frequency-or-effect-size";

interface Direction {
  readonly category: string;
  readonly greaterGroup: string;
  readonly lesserGroup: string;
}

interface RegistryRecord {
  readonly recordId: string;
  readonly groups: readonly Record<string, unknown>[];
  readonly reportedDirections: readonly Direction[];
  readonly exactDerivedOutcomes?: readonly Record<string, unknown>[];
}

export interface Phase9MsRegistryIdentity {
  readonly byteLength: number;
  readonly sha256: string;
}

const EXPECTED_REGISTRY_SEMANTICS: Readonly<Record<string, Readonly<Record<string, unknown>>>> =
  Object.freeze({
    "SK88-PREACTIVATION": Object.freeze({
      allowedDiagnostics: ["reported-direction-description"],
      confounds: [
        "competitive-vapor-depletion-and-spacing-dependent-exposure",
        "preactivation-history-includes-prior-growth-evaporation-and-hold",
        "initial-and-preactivation-exposures-and-supersaturation-differ",
      ],
      design: "initial-versus-preactivation-direction-only",
      forbiddenClaims: [
        "causal-seed-state-effect",
        "population-frequency-effect-size",
        "matched-exposure-contrast",
        "validation-or-promotion",
      ],
      groups: [
        {
          categoryCounts: null,
          denominator: 42,
          denominatorKind: "initial-grown-crystals",
          groupId: "initial",
        },
        {
          categoryCounts: null,
          denominator: 36,
          denominatorKind: "preactivation-grown-crystals",
          groupId: "preactivation",
        },
      ],
      locator: "Sato and Kikuchi (1988), Figure 15 and pp. 15-16",
      reportedDirections: [
        { category: "column", greaterGroup: "preactivation", lesserGroup: "initial" },
        { category: "peculiar-shape", greaterGroup: "initial", lesserGroup: "preactivation" },
      ],
    }),
    "SK88-MICROCLINE-SIZE": Object.freeze({
      allowedDiagnostics: [
        "reported-direction-description",
        "nucleation-proportion-contrast",
        "two-by-two-null-model-diagnostic",
      ],
      confounds: [
        "competitive-vapor-depletion-and-spacing-dependent-exposure",
        "microcline-size-groups-have-different-initial-size-distributions",
        "microcline-size-groups-do-not-establish-randomized-or-matched-exposure",
      ],
      design: "microcline-size-nucleation-and-morphology",
      forbiddenClaims: [
        "causal-nucleant-size-effect",
        "population-morphology-effect-size",
        "matched-exposure-contrast",
        "validation-or-promotion",
      ],
      groups: [
        {
          categoryCounts: null,
          crystalCount: 89,
          groupId: "small-microcline",
          modeDiameterUm: 20,
          nucleantDenominator: 112,
          sizeRangeUm: [10, 60],
        },
        {
          categoryCounts: null,
          crystalCount: 48,
          groupId: "large-microcline",
          modeDiameterUm: 60,
          nucleantDenominator: 49,
          sizeRangeUm: [40, 100],
        },
      ],
      locator: "Sato and Kikuchi (1988), Figure 16 and pp. 16-17",
      reportedDirections: [
        {
          category: "peculiar-shape",
          greaterGroup: "large-microcline",
          lesserGroup: "small-microcline",
        },
        {
          category: "combination-of-columns",
          greaterGroup: "small-microcline",
          lesserGroup: "large-microcline",
        },
        {
          category: "radiating-assemblage-of-plates",
          greaterGroup: "large-microcline",
          lesserGroup: "small-microcline",
        },
      ],
    }),
    "SK88-FROZEN-DROPLET": Object.freeze({
      allowedDiagnostics: ["reported-single-group-proportion"],
      confounds: [
        "competitive-vapor-depletion-and-spacing-dependent-exposure",
        "frozen-droplet-nucleants-are-not-a-matched-mineral-substance-control",
        "small-denominator",
      ],
      design: "frozen-droplet-single-group-description",
      exactDerivedOutcomes: [
        {
          category: "peculiar-shape",
          denominator: 20,
          derivation: "20 * 35 / 100 = 7",
          numerator: 7,
          proportion: 0.35,
          sourcePrintedPercent: 35,
        },
      ],
      forbiddenClaims: [
        "between-nucleant-causal-effect",
        "population-frequency-effect-size",
        "matched-exposure-contrast",
        "validation-or-promotion",
      ],
      groups: [
        {
          categoryCounts: null,
          denominator: 20,
          denominatorKind: "grown-crystals",
          groupId: "frozen-droplets",
          modeDiameterUm: 40,
          temperatureC: -35,
        },
      ],
      locator: "Sato and Kikuchi (1988), Figure 17 and pp. 17-18",
      reportedDirections: [],
    }),
  });

export interface Phase9MsNullModelDiagnostic {
  readonly status: "descriptive-two-by-two-null-model-diagnostic-only";
  readonly table: readonly [readonly [number, number], readonly [number, number]];
  readonly rowTotals: readonly [number, number];
  readonly columnTotals: readonly [number, number];
  readonly total: number;
  readonly pooledSuccessProportion: number;
  readonly expectedCounts: readonly [
    readonly [number, number],
    readonly [number, number],
  ];
  readonly pearsonChiSquare: number;
  readonly asymptoticPValue: null;
  readonly smallCellWarning: boolean;
  readonly sourceDataScoreProduced: false;
  readonly causalEffectEstimated: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MsDirectionResult {
  readonly status: "reported-directions-only";
  readonly recordId: "SK88-PREACTIVATION" | "SK88-MICROCLINE-SIZE";
  readonly denominators: Readonly<Record<string, number>>;
  readonly directions: readonly Direction[];
  readonly numericMorphologyEffect: null;
  readonly contingencyDiagnostic: null;
  readonly limits: readonly string[];
  readonly sourceDataScoreProduced: false;
  readonly causalEffectEstimated: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MsNucleationContrastResult {
  readonly status: "descriptive-nucleation-proportion-contrast-only";
  readonly recordId: "SK88-MICROCLINE-SIZE";
  readonly smallMicrocline: {
    readonly crystalCount: 89;
    readonly nucleantDenominator: 112;
    readonly proportion: number;
  };
  readonly largeMicrocline: {
    readonly crystalCount: 48;
    readonly nucleantDenominator: 49;
    readonly proportion: number;
  };
  readonly largeMinusSmallProportion: number;
  readonly nullModelDiagnostic: Phase9MsNullModelDiagnostic;
  readonly limits: readonly string[];
  readonly sourceDataScoreProduced: false;
  readonly causalEffectEstimated: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MsFrozenDropletResult {
  readonly status: "reported-single-group-proportion-only";
  readonly recordId: "SK88-FROZEN-DROPLET";
  readonly category: "peculiar-shape";
  readonly numerator: 7;
  readonly denominator: 20;
  readonly proportion: 0.35;
  readonly sourcePrintedPercent: 35;
  readonly betweenGroupContrast: null;
  readonly limits: readonly string[];
  readonly sourceDataScoreProduced: false;
  readonly causalEffectEstimated: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MsBaconRefusal {
  readonly status: "refused";
  readonly selectionId: Phase9MsBaconSelectionId;
  readonly requestedPurpose: Phase9MsBaconPurpose;
  readonly reasonCode:
    | "MISSING_DENOMINATOR_AND_EXPOSURE_CONFOUND"
    | "NO_DENOMINATOR_NO_INDIVIDUAL_ROWS";
  readonly reason: string;
  readonly computedProportion: null;
  readonly sourceDataScoreProduced: false;
  readonly causalEffectEstimated: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

const LIMIT_FLAGS = Object.freeze({
  sourceDataScoreProduced: false,
  causalEffectEstimated: false,
  physicalPromotionEligible: false,
  grantsValidationClaim: false,
} as const);

function ownRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, i) => key !== wanted[i])) {
    throw new Error(`${label} keys mismatch`);
  }
}

function safeCount(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value as number;
}

function safePositiveCount(value: unknown, label: string): number {
  const count = safeCount(value, label);
  if (count === 0) throw new Error(`${label} must be positive`);
  return count;
}

function safeAdd(left: number, right: number, label: string): number {
  if (left > Number.MAX_SAFE_INTEGER - right) {
    throw new Error(`${label} exceeds the safe-integer domain`);
  }
  return left + right;
}

function exactJson(value: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(value) !== JSON.stringify(expected)) {
    throw new Error(`${label} semantic mismatch`);
  }
}

function validateRecord(record: unknown, index: number): RegistryRecord {
  const row = ownRecord(record, `registry row ${index}`);
  if (row.schema !== "phase9-ms-categorical-registry-v1") {
    throw new Error(`registry row ${index} schema mismatch`);
  }
  const commonKeys = [
    "allowedDiagnostics",
    "categories",
    "confounds",
    "design",
    "forbiddenClaims",
    "groups",
    "locator",
    "recordId",
    "reportedDirections",
    "schema",
    "sourceIdentity",
  ];
  exactKeys(
    row,
    row.recordId === "SK88-FROZEN-DROPLET"
      ? [...commonKeys, "exactDerivedOutcomes"]
      : commonKeys,
    `registry row ${index}`,
  );
  exactJson(row.categories, PHASE9_MS_CATEGORY_CODEBOOK, `registry row ${index} categories`);
  exactJson(
    row.sourceIdentity,
    {
      byteLength: 1_656_110,
      sha256: PHASE9_MS_SATO_SHA256,
      shareRelativePath:
        "research-cache/phase8b-search/targeted-sources-20260812-v1/sato-kikuchi-1988-nucleation.pdf",
    },
    `registry row ${index} source identity`,
  );
  const expected = EXPECTED_REGISTRY_SEMANTICS[String(row.recordId)];
  if (expected === undefined) {
    throw new Error(`registry row ${index} recordId is not registered`);
  }
  for (const field of [
    "allowedDiagnostics",
    "confounds",
    "design",
    "forbiddenClaims",
    "groups",
    "locator",
    "reportedDirections",
  ] as const) {
    exactJson(row[field], expected[field], `registry row ${index} ${field}`);
  }
  exactJson(
    row.exactDerivedOutcomes,
    expected.exactDerivedOutcomes,
    `registry row ${index} exactDerivedOutcomes`,
  );
  if (!Array.isArray(row.groups) || !Array.isArray(row.reportedDirections)) {
    throw new Error(`registry row ${index} groups and directions must be arrays`);
  }
  return row as unknown as RegistryRecord;
}

function parseRegistryWithIdentity(
  bytes: Uint8Array,
  declaredIdentity: Phase9MsRegistryIdentity,
): ReadonlyMap<string, RegistryRecord> {
  const identity = ownRecord(declaredIdentity, "M-S declared registry identity");
  exactKeys(identity, ["byteLength", "sha256"], "M-S declared registry identity");
  if (!Number.isSafeInteger(identity.byteLength) || (identity.byteLength as number) <= 0) {
    throw new Error("M-S declared registry byte length must be a positive safe integer");
  }
  if (typeof identity.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(identity.sha256)) {
    throw new Error("M-S declared registry SHA-256 must be lowercase hexadecimal");
  }
  if (bytes.byteLength !== identity.byteLength) {
    throw new Error("M-S registry byte length mismatch");
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== identity.sha256) {
    throw new Error("M-S registry SHA-256 mismatch");
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\r") || !text.endsWith("\n")) {
    throw new Error("M-S registry must be LF-terminated UTF-8 JSONL");
  }
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== 3 || lines.some((line) => line.length === 0)) {
    throw new Error("M-S registry must contain exactly three nonempty rows");
  }
  const records = lines.map((line, index) => {
    try {
      return validateRecord(JSON.parse(line) as unknown, index);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(`registry row ${index} is invalid JSON`);
      throw error;
    }
  });
  const expectedIds = [
    "SK88-PREACTIVATION",
    "SK88-MICROCLINE-SIZE",
    "SK88-FROZEN-DROPLET",
  ];
  if (records.some((record, index) => record.recordId !== expectedIds[index])) {
    throw new Error("M-S registry record roster or order mismatch");
  }
  return new Map(records.map((record) => [record.recordId, record]));
}

/**
 * Validates the exact registered semantics after checking a declared byte identity.
 * Supplying the identity separately lets tests prove that a coherent hash re-pin still
 * cannot alter counts, directions, confounds, diagnostics, or derived outcomes.
 */
export function phase9MsValidateRegistrySnapshot(
  bytes: Uint8Array,
  declaredIdentity: Phase9MsRegistryIdentity,
): void {
  parseRegistryWithIdentity(bytes, declaredIdentity);
}

function parseRegistry(bytes: Uint8Array): ReadonlyMap<string, RegistryRecord> {
  return parseRegistryWithIdentity(bytes, {
    byteLength: PHASE9_MS_REGISTRY_BYTE_LENGTH,
    sha256: PHASE9_MS_REGISTRY_SHA256,
  });
}

function recordById(
  records: ReadonlyMap<string, RegistryRecord>,
  id: string,
): RegistryRecord {
  const record = records.get(id);
  if (record === undefined) throw new Error(`required M-S registry record missing: ${id}`);
  return record;
}

/**
 * Computes a Pearson diagnostic against a pooled two-group null. It deliberately
 * returns no p-value: inferential testing was not predeclared and the unmatched
 * source design does not support an inferential or causal claim.
 */
export function phase9MsTwoByTwoNullModelDiagnostic(input: {
  readonly purpose: "registered-descriptive-two-by-two-null-model";
  readonly table: readonly [readonly [number, number], readonly [number, number]];
}): Phase9MsNullModelDiagnostic {
  if (input.purpose !== "registered-descriptive-two-by-two-null-model") {
    throw new Error("unknown M-S null-model purpose");
  }
  if (!Array.isArray(input.table) || input.table.length !== 2) {
    throw new Error("M-S null-model table must have two rows");
  }
  const a = safeCount(input.table[0]?.[0], "table[0][0]");
  const b = safeCount(input.table[0]?.[1], "table[0][1]");
  const c = safeCount(input.table[1]?.[0], "table[1][0]");
  const d = safeCount(input.table[1]?.[1], "table[1][1]");
  if (input.table[0]?.length !== 2 || input.table[1]?.length !== 2) {
    throw new Error("M-S null-model table rows must each have two cells");
  }
  const row0 = safeAdd(a, b, "row 0 total");
  const row1 = safeAdd(c, d, "row 1 total");
  if (row0 === 0 || row1 === 0) throw new Error("M-S null-model row totals must be positive");
  const col0 = safeAdd(a, c, "column 0 total");
  const col1 = safeAdd(b, d, "column 1 total");
  if (col0 === 0 || col1 === 0) throw new Error("M-S null-model column totals must be positive");
  const total = safeAdd(row0, row1, "table total");
  const expected = [
    [(row0 / total) * col0, (row0 / total) * col1],
    [(row1 / total) * col0, (row1 / total) * col1],
  ] as const;
  const observed = [[a, b], [c, d]] as const;
  let pearsonChiSquare = 0;
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const residual = observed[row]![column]! - expected[row]![column]!;
      pearsonChiSquare += (residual * residual) / expected[row]![column]!;
    }
  }
  if (!Number.isFinite(pearsonChiSquare)) {
    throw new Error("M-S null-model diagnostic is non-finite");
  }
  return Object.freeze({
    status: "descriptive-two-by-two-null-model-diagnostic-only",
    table: observed,
    rowTotals: [row0, row1] as const,
    columnTotals: [col0, col1] as const,
    total,
    pooledSuccessProportion: col0 / total,
    expectedCounts: expected,
    pearsonChiSquare,
    asymptoticPValue: null,
    smallCellWarning: expected.flat().some((value) => value < 5),
    ...LIMIT_FLAGS,
  });
}

export function phase9MsEvaluateSato(
  registryBytes: Uint8Array,
  requestedPurpose: Phase9MsSatoPurpose,
):
  | Phase9MsDirectionResult
  | Phase9MsNucleationContrastResult
  | Phase9MsFrozenDropletResult {
  const records = parseRegistry(registryBytes);
  if (requestedPurpose === "preactivation-reported-directions") {
    const record = recordById(records, "SK88-PREACTIVATION");
    return Object.freeze({
      status: "reported-directions-only",
      recordId: "SK88-PREACTIVATION",
      denominators: Object.freeze({ initial: 42, preactivation: 36 }),
      directions: record.reportedDirections,
      numericMorphologyEffect: null,
      contingencyDiagnostic: null,
      limits: Object.freeze([
        "category counts were not transcribed from plotted bar heights",
        "prior growth and evaporation history differs",
        "competitive depletion and exposure differ",
      ]),
      ...LIMIT_FLAGS,
    });
  }
  if (requestedPurpose === "microcline-morphology-reported-directions") {
    const record = recordById(records, "SK88-MICROCLINE-SIZE");
    return Object.freeze({
      status: "reported-directions-only",
      recordId: "SK88-MICROCLINE-SIZE",
      denominators: Object.freeze({
        smallMicroclineNucleants: 112,
        smallMicroclineCrystals: 89,
        largeMicroclineNucleants: 49,
        largeMicroclineCrystals: 48,
      }),
      directions: record.reportedDirections,
      numericMorphologyEffect: null,
      contingencyDiagnostic: null,
      limits: Object.freeze([
        "category counts were not transcribed from plotted bar heights",
        "initial microcline size distributions differ",
        "competitive depletion and exposure differ",
      ]),
      ...LIMIT_FLAGS,
    });
  }
  if (requestedPurpose === "microcline-nucleation-proportion-contrast") {
    recordById(records, "SK88-MICROCLINE-SIZE");
    const smallProportion = 89 / 112;
    const largeProportion = 48 / 49;
    return Object.freeze({
      status: "descriptive-nucleation-proportion-contrast-only",
      recordId: "SK88-MICROCLINE-SIZE",
      smallMicrocline: Object.freeze({
        crystalCount: 89,
        nucleantDenominator: 112,
        proportion: smallProportion,
      }),
      largeMicrocline: Object.freeze({
        crystalCount: 48,
        nucleantDenominator: 49,
        proportion: largeProportion,
      }),
      largeMinusSmallProportion: largeProportion - smallProportion,
      nullModelDiagnostic: phase9MsTwoByTwoNullModelDiagnostic({
        purpose: "registered-descriptive-two-by-two-null-model",
        table: [[89, 23], [48, 1]],
      }),
      limits: Object.freeze([
        "descriptive nucleation proportions only",
        "inferential p-value was not predeclared for this unmatched contrast",
        "initial microcline size and competitive exposure differ",
      ]),
      ...LIMIT_FLAGS,
    });
  }
  if (requestedPurpose === "frozen-droplet-peculiar-proportion") {
    const record = recordById(records, "SK88-FROZEN-DROPLET");
    if (record.exactDerivedOutcomes === undefined) {
      throw new Error("frozen-droplet exact derived outcome missing");
    }
    return Object.freeze({
      status: "reported-single-group-proportion-only",
      recordId: "SK88-FROZEN-DROPLET",
      category: "peculiar-shape",
      numerator: 7,
      denominator: 20,
      proportion: 0.35,
      sourcePrintedPercent: 35,
      betweenGroupContrast: null,
      limits: Object.freeze([
        "numerator is exactly derived from the printed 35 percent and N=20",
        "single small group with no matched mineral-substance comparator",
        "no causal or population effect claim",
      ]),
      ...LIMIT_FLAGS,
    });
  }
  throw new Error(`unknown M-S Sato purpose: ${String(requestedPurpose)}`);
}

/** Bacon reports ranges/averages without an ensemble denominator or individual rows. */
export function phase9MsEvaluateBaconAggregate(
  selectionId: Phase9MsBaconSelectionId,
  requestedPurpose: Phase9MsBaconPurpose,
): Phase9MsBaconRefusal {
  if (
    selectionId !== "P8B-P1-BACON-INITIATION-ASPECT" &&
    selectionId !== "P8B-P1-BACON-MASS-GROWTH-CONTRAST"
  ) {
    throw new Error(`unknown M-S Bacon selection: ${String(selectionId)}`);
  }
  if (requestedPurpose === "directional-range-description") {
    return Object.freeze({
      status: "refused",
      selectionId,
      requestedPurpose,
      reasonCode: "MISSING_DENOMINATOR_AND_EXPOSURE_CONFOUND",
      reason:
        "Bacon's reported aggregate may be quoted directionally, but no proportion or contrast is computed because the ensemble denominator is missing and exposures differ.",
      computedProportion: null,
      ...LIMIT_FLAGS,
    });
  }
  if (requestedPurpose === "frequency-or-effect-size") {
    return Object.freeze({
      status: "refused",
      selectionId,
      requestedPurpose,
      reasonCode: "NO_DENOMINATOR_NO_INDIVIDUAL_ROWS",
      reason:
        "A frequency or effect size is refused because Bacon reports neither an ensemble denominator nor individual rows.",
      computedProportion: null,
      ...LIMIT_FLAGS,
    });
  }
  throw new Error(`unknown M-S Bacon purpose: ${String(requestedPurpose)}`);
}
