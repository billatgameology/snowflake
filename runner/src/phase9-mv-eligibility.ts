/**
 * Phase 9 M-V ventilation compatibility and refusal gate.
 *
 * The frozen Phase 8B/S0B bytes do not contain a complete, byte-bound
 * Takahashi-like consuming-arm record: density and viscosity bounds, the
 * interval-wide fall-speed and a-axis envelopes, and several source protocol
 * dimensions are absent. Absolute eligibility therefore stays closed. The
 * Reynolds helper below is analytic/diagnostic only and cannot open the gate.
 *
 * The only positive runtime result is a source-order-span label for one of the
 * exact SD71 records independently reconstructed by the byte-bound preflight.
 */

export const TAKAHASHI_LOW_REYNOLDS_BOUND_EXCLUSIVE = 2;

export const PHASE9_MV_VENTILATION_CONFOUND_LABEL =
  "non-air-free-fall-transport-confounded" as const;

export type Phase9MvInterventionAxis =
  | "carrier-gas-thermal-conductivity"
  | "reported-vapor-diffusivity";

export interface Phase9MvSourceRelativeRecord {
  readonly sourceRecordId: string;
  readonly rowArtifactIdentity: {
    readonly bytes: number;
    readonly byteLength: number;
    readonly path: string;
    readonly rowCount: number;
    readonly sha256: string;
  };
  readonly interventionAxis: Phase9MvInterventionAxis;
  readonly orderSpanSemantics: "source-order-span-not-confidence-interval";
  readonly ventilationConfoundLabel: typeof PHASE9_MV_VENTILATION_CONFOUND_LABEL;
}

function freezeSourceRelativeRegistry(
  records: readonly Phase9MvSourceRelativeRecord[],
): readonly Phase9MvSourceRelativeRecord[] {
  return Object.freeze(records.map((record) => Object.freeze({
    ...record,
    rowArtifactIdentity: Object.freeze({ ...record.rowArtifactIdentity }),
  })));
}

/**
 * Private closed registry used by eligibility. phase9MvPreflight independently
 * reconstructs the roster from frozen successor and plot-metadata bytes.
 */
const PRIVATE_PHASE9_MV_SOURCE_RELATIVE_REGISTRY = freezeSourceRelativeRegistry([
  { sourceRecordId: "P8B-P1-SD71-M11", rowArtifactIdentity: { bytes: 11924, byteLength: 11924, path: "rows/P8B-P1-SD71-M11.jsonl", rowCount: 5, sha256: "bc09c0195851a59b4fc1ed4ebf0ba35bce6b475993cc50d0513b7efdcd4c9df5" }, interventionAxis: "carrier-gas-thermal-conductivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M12", rowArtifactIdentity: { bytes: 12224, byteLength: 12224, path: "rows/P8B-P1-SD71-M12.jsonl", rowCount: 5, sha256: "07f2574296df8f650ce7de413cd5a19b7604914f2c93b46b5e93d3bc7b54ab5f" }, interventionAxis: "carrier-gas-thermal-conductivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M13", rowArtifactIdentity: { bytes: 11863, byteLength: 11863, path: "rows/P8B-P1-SD71-M13.jsonl", rowCount: 5, sha256: "84c719ca6637fa954e43328295fd98ec68e2f1c8b05b763b55efbde6c65d0ea8" }, interventionAxis: "carrier-gas-thermal-conductivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M14", rowArtifactIdentity: { bytes: 11561, byteLength: 11561, path: "rows/P8B-P1-SD71-M14.jsonl", rowCount: 5, sha256: "621220e1bb883836658fc6d235fab34f964622aba1a75edd4eafa936ebe6c12f" }, interventionAxis: "carrier-gas-thermal-conductivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M15", rowArtifactIdentity: { bytes: 11198, byteLength: 11198, path: "rows/P8B-P1-SD71-M15.jsonl", rowCount: 5, sha256: "8e8fdc87daf0e5a78d6f18291b8931a760d402e368a1c48c58a06948c72df34f" }, interventionAxis: "carrier-gas-thermal-conductivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M16", rowArtifactIdentity: { bytes: 11190, byteLength: 11190, path: "rows/P8B-P1-SD71-M16.jsonl", rowCount: 5, sha256: "d5755d31006f7c501e9c7857de6344f659af8a7f57d30744c37acd7b903e1206" }, interventionAxis: "carrier-gas-thermal-conductivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M23", rowArtifactIdentity: { bytes: 11967, byteLength: 11967, path: "rows/P8B-P1-SD71-M23.jsonl", rowCount: 5, sha256: "58969c98fbc63aaa7018788712bf88ce8ce1d844dbda7b85dbab5689e424cfb8" }, interventionAxis: "reported-vapor-diffusivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M24", rowArtifactIdentity: { bytes: 11384, byteLength: 11384, path: "rows/P8B-P1-SD71-M24.jsonl", rowCount: 5, sha256: "edd32181e07a0ff6bb8547f0505345ecb8c7522924da27e5bb07cfb1c64ecae2" }, interventionAxis: "reported-vapor-diffusivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M25", rowArtifactIdentity: { bytes: 11381, byteLength: 11381, path: "rows/P8B-P1-SD71-M25.jsonl", rowCount: 5, sha256: "b62df64ddcf1e592b0d09227a41b767516ee6d180ec3acf7eecd9d10d43d895d" }, interventionAxis: "reported-vapor-diffusivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
  { sourceRecordId: "P8B-P1-SD71-M26", rowArtifactIdentity: { bytes: 11341, byteLength: 11341, path: "rows/P8B-P1-SD71-M26.jsonl", rowCount: 5, sha256: "e20ff50948de7c9fcd1a69314ee2e3a0eca13c71584bd2c4856654f59b8b04b3" }, interventionAxis: "reported-vapor-diffusivity", orderSpanSemantics: "source-order-span-not-confidence-interval", ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL },
] as const satisfies readonly Phase9MvSourceRelativeRecord[]);

/**
 * Deep-frozen public snapshot for preflight/reporting. Eligibility uses the
 * separate private registry, so callers cannot mutate its decision state.
 */
export const PHASE9_MV_SOURCE_RELATIVE_REGISTRY =
  freezeSourceRelativeRegistry(PRIVATE_PHASE9_MV_SOURCE_RELATIVE_REGISTRY);

export interface EvidenceScalarBound {
  readonly value: number;
  readonly unit: string;
}

export interface ReynoldsDiagnosticOperands {
  readonly airDensityUpper: EvidenceScalarBound;
  readonly speedUpper: EvidenceScalarBound;
  readonly aAxisLengthUpper: EvidenceScalarBound;
  readonly dynamicViscosityLower: EvidenceScalarBound;
}

export type VentilationCompatibilityReasonCode =
  | "source-reported-order-span-only"
  | "absolute-byte-bound-record-unavailable"
  | "paired-byte-bound-record-unavailable"
  | "unqualified-still-air-transfer-forbidden"
  | "source-relative-record-unavailable"
  | "purpose-unknown";

export type VentilationCompatibilityResult =
  | {
      readonly status: "eligible-with-limitation";
      readonly reasonCode: "source-reported-order-span-only";
      readonly sourceRecordId: string;
      readonly limitations: readonly string[];
    }
  | {
      readonly status: "ineligible";
      readonly reasonCode: Exclude<
        VentilationCompatibilityReasonCode,
        "source-reported-order-span-only"
      >;
      readonly detail: string;
    };

type ObjectRecord = Readonly<Record<string, unknown>>;

function object(value: unknown, label: string): ObjectRecord {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as ObjectRecord;
}

function exactKeys(value: ObjectRecord, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} keys differ`);
  }
}

function finitePositive(value: unknown, label: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    Object.is(value, -0)
  ) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}

function parseScalar(
  value: unknown,
  unit: string,
  label: string,
): EvidenceScalarBound {
  const row = object(value, label);
  exactKeys(row, ["value", "unit"], label);
  if (row.unit !== unit) throw new Error(`${label}.unit must be ${unit}`);
  return { value: finitePositive(row.value, `${label}.value`), unit };
}

/**
 * Analytic Reynolds calculation only. Its result is not an eligibility token,
 * carries no provenance, and is never consumed by evaluateVentilationCompatibility.
 */
export function deriveDiagnosticReynoldsUpperBound(
  rawOperands: unknown,
): number {
  const row = object(rawOperands, "diagnostic Reynolds operands");
  exactKeys(row, [
    "airDensityUpper",
    "speedUpper",
    "aAxisLengthUpper",
    "dynamicViscosityLower",
  ], "diagnostic Reynolds operands");
  const airDensityUpper = parseScalar(row.airDensityUpper, "kg/m3", "airDensityUpper");
  const speedUpper = parseScalar(row.speedUpper, "m/s", "speedUpper");
  const aAxisLengthUpper = parseScalar(row.aAxisLengthUpper, "m", "aAxisLengthUpper");
  const dynamicViscosityLower = parseScalar(row.dynamicViscosityLower, "Pa s", "dynamicViscosityLower");
  const numerator = airDensityUpper.value * speedUpper.value * aAxisLengthUpper.value;
  if (!Number.isFinite(numerator) || numerator <= 0) {
    throw new Error("diagnostic Reynolds numerator overflowed or is not positive");
  }
  const result = numerator / dynamicViscosityLower.value;
  if (!Number.isFinite(result) || result <= 0 || Object.is(result, -0)) {
    throw new Error("diagnostic Reynolds result overflowed or is not positive");
  }
  return result;
}

function ineligible(
  reasonCode: Exclude<VentilationCompatibilityReasonCode, "source-reported-order-span-only">,
  detail: string,
): VentilationCompatibilityResult {
  return { status: "ineligible", reasonCode, detail };
}

function parseSourceRelativeRecord(value: unknown): Phase9MvSourceRelativeRecord {
  const row = object(value, "source relative record");
  exactKeys(row, [
    "sourceRecordId",
    "rowArtifactIdentity",
    "interventionAxis",
    "orderSpanSemantics",
    "ventilationConfoundLabel",
  ], "source relative record");
  const artifact = object(row.rowArtifactIdentity, "source relative row artifact identity");
  exactKeys(artifact, [
    "bytes",
    "byteLength",
    "path",
    "rowCount",
    "sha256",
  ], "source relative row artifact identity");
  if (
    typeof row.sourceRecordId !== "string" ||
    typeof artifact.bytes !== "number" ||
    !Number.isSafeInteger(artifact.bytes) ||
    artifact.bytes <= 0 ||
    artifact.byteLength !== artifact.bytes ||
    typeof artifact.path !== "string" ||
    !/^rows\/P8B-P1-SD71-M(?:1[1-6]|2[3-6])\.jsonl$/u.test(artifact.path) ||
    artifact.rowCount !== 5 ||
    typeof artifact.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(artifact.sha256) ||
    (row.interventionAxis !== "carrier-gas-thermal-conductivity" &&
      row.interventionAxis !== "reported-vapor-diffusivity") ||
    row.orderSpanSemantics !== "source-order-span-not-confidence-interval" ||
    row.ventilationConfoundLabel !== PHASE9_MV_VENTILATION_CONFOUND_LABEL
  ) {
    throw new Error("source relative record fields differ from the closed registry schema");
  }
  return {
    sourceRecordId: row.sourceRecordId,
    rowArtifactIdentity: {
      bytes: artifact.bytes,
      byteLength: artifact.byteLength as number,
      path: artifact.path,
      rowCount: artifact.rowCount,
      sha256: artifact.sha256,
    },
    interventionAxis: row.interventionAxis,
    orderSpanSemantics: row.orderSpanSemantics,
    ventilationConfoundLabel: row.ventilationConfoundLabel,
  } as Phase9MvSourceRelativeRecord;
}

function registeredSourceRelativeRecord(
  candidate: Phase9MvSourceRelativeRecord,
): Phase9MvSourceRelativeRecord | undefined {
  return PRIVATE_PHASE9_MV_SOURCE_RELATIVE_REGISTRY.find((entry) =>
    entry.sourceRecordId === candidate.sourceRecordId &&
    entry.rowArtifactIdentity.bytes === candidate.rowArtifactIdentity.bytes &&
    entry.rowArtifactIdentity.byteLength === candidate.rowArtifactIdentity.byteLength &&
    entry.rowArtifactIdentity.path === candidate.rowArtifactIdentity.path &&
    entry.rowArtifactIdentity.rowCount === candidate.rowArtifactIdentity.rowCount &&
    entry.rowArtifactIdentity.sha256 === candidate.rowArtifactIdentity.sha256 &&
    entry.interventionAxis === candidate.interventionAxis &&
    entry.orderSpanSemantics === candidate.orderSpanSemantics &&
    entry.ventilationConfoundLabel === candidate.ventilationConfoundLabel
  );
}

/** Evaluate only the frozen refusal/relative-reporting contract. */
export function evaluateVentilationCompatibility(
  rawInput: unknown,
): VentilationCompatibilityResult {
  let raw: ObjectRecord;
  try {
    raw = object(rawInput, "ventilation compatibility input");
  } catch (error) {
    return ineligible("purpose-unknown", error instanceof Error ? error.message : "input could not be parsed");
  }

  if (raw.purpose === "unqualified-still-air-transfer") {
    try {
      exactKeys(raw, ["purpose"], "ventilation compatibility input");
    } catch (error) {
      return ineligible("purpose-unknown", error instanceof Error ? error.message : "input could not be parsed");
    }
    return ineligible(
      "unqualified-still-air-transfer-forbidden",
      "The source record cannot establish zero ventilation or a universal threshold.",
    );
  }

  if (raw.purpose === "absolute-score-under-low-re-approximation") {
    try {
      exactKeys(raw, ["purpose"], "ventilation compatibility input");
    } catch (error) {
      return ineligible("purpose-unknown", error instanceof Error ? error.message : "input could not be parsed");
    }
    return ineligible(
      "absolute-byte-bound-record-unavailable",
      "No frozen consuming-arm record byte-binds all Takahashi protocol dimensions and interval-wide Reynolds operands; analytic calculations cannot open absolute eligibility.",
    );
  }

  if (raw.purpose === "relative-intervention-direction") {
    try {
      exactKeys(raw, ["purpose"], "ventilation compatibility input");
    } catch (error) {
      return ineligible("purpose-unknown", error instanceof Error ? error.message : "input could not be parsed");
    }
    return ineligible(
      "paired-byte-bound-record-unavailable",
      "No frozen pair byte-binds all ventilation-relevant protocol dimensions; a caller-supplied matched flag or cloned record is insufficient.",
    );
  }

  if (raw.purpose !== "source-reported-relative-order-span") {
    return ineligible("purpose-unknown", "Ventilation purpose is not recognized.");
  }

  try {
    exactKeys(raw, ["purpose", "sourceRelativeRecord"], "ventilation compatibility input");
    const candidate = parseSourceRelativeRecord(raw.sourceRelativeRecord);
    const registered = registeredSourceRelativeRecord(candidate);
    if (registered === undefined) {
      return ineligible(
        "source-relative-record-unavailable",
        "The requested source-order record is absent from the byte-bound closed registry.",
      );
    }
    return {
      status: "eligible-with-limitation",
      reasonCode: "source-reported-order-span-only",
      sourceRecordId: registered.sourceRecordId,
      limitations: [
        "This reports the source's order span only; it is not an M-V absolute compatibility result.",
        "The non-air free-fall record remains ventilation/thermal/vapor-transport confounded.",
        "The source order span is not a confidence interval and has an unstated denominator.",
      ],
    };
  } catch (error) {
    return ineligible(
      "source-relative-record-unavailable",
      error instanceof Error ? error.message : "source relative record could not be parsed",
    );
  }
}
