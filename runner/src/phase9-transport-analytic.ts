/**
 * Phase 9 M-PT/M-LH analytic-only machinery.
 *
 * This module deliberately has no file I/O and consumes no source observations. The
 * continuum resistance relation is available only for manufactured checks. Every
 * quantitative SD71 request remains gated by the final M-V refusal.
 */

export const PHASE9_TRANSPORT_PROTOCOL_ID =
  "phase9-mpt-mlh-analytic-prescore-v1" as const;

export const PHASE9_TRANSPORT_SD71_SELECTION_IDS = Object.freeze([
  "P8B-P1-SD71-M11",
  "P8B-P1-SD71-M12",
  "P8B-P1-SD71-M13",
  "P8B-P1-SD71-M14",
  "P8B-P1-SD71-M15",
  "P8B-P1-SD71-M16",
  "P8B-P1-SD71-M23",
  "P8B-P1-SD71-M24",
  "P8B-P1-SD71-M25",
  "P8B-P1-SD71-M26",
] as const);

export type Phase9TransportSd71SelectionId =
  (typeof PHASE9_TRANSPORT_SD71_SELECTION_IDS)[number];

export type Phase9TransportQuantitativePurpose =
  | "absolute-free-fall-score"
  | "model-relative-free-fall-score"
  | "axis-length-prediction"
  | "aspect-ratio-prediction"
  | "transport-interaction-effect";

export const PHASE9_TRANSPORT_QUANTITATIVE_PURPOSES = Object.freeze([
  "absolute-free-fall-score",
  "model-relative-free-fall-score",
  "axis-length-prediction",
  "aspect-ratio-prediction",
  "transport-interaction-effect",
] as const satisfies readonly Phase9TransportQuantitativePurpose[]);

export interface Phase9TransportResistanceInput {
  /** Prevents a manufactured calculation from being mislabeled as a source replay. */
  readonly purpose: "manufactured-analytic-check";
  /** The printed scalar resistance sum uses one shared spherical capacitance closure. */
  readonly geometry: "shared-capacitance-spherical-bulk";
  /** Ventilation is intentionally absent; this is not a free-fall transfer closure. */
  readonly ventilation: "not-represented-manufactured-only";
  readonly temperatureK: number;
  readonly saturationVaporPressureIcePa: number;
  readonly vaporDiffusivityM2S: number;
  readonly thermalConductivityWMK: number;
  readonly gasConstantJMolK: number;
  readonly waterMolarMassKgMol: number;
  readonly latentHeatSublimationJKg: number;
}

export interface Phase9TransportResistanceBreakdown {
  readonly status: "manufactured-diagnostic-only";
  readonly vaporResistanceSMPerKg: number;
  readonly latentHeatResistanceSMPerKg: number;
  readonly totalResistanceSMPerKg: number;
  readonly bulkTransferCoefficientKgM1S1: number;
  readonly vaporFractionOfTotalResistance: number;
  readonly latentHeatFractionOfTotalResistance: number;
  readonly sourceDataScoreProduced: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9TransportOneFactorResult {
  readonly status: "manufactured-diagnostic-only";
  readonly axis: "vapor-diffusivity" | "thermal-conductivity";
  readonly baseline: Phase9TransportResistanceBreakdown;
  readonly candidate: Phase9TransportResistanceBreakdown;
  readonly bulkTransferCoefficientRatio: number;
  readonly vaporResistanceRatio: number;
  readonly latentHeatResistanceRatio: number;
  readonly interactionEstimate: null;
  readonly sourceDataScoreProduced: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9TransportOneFactorRefusal {
  readonly status: "refused";
  readonly reasonCode:
    | "NO_INTERVENTION"
    | "UNCROSSED_DESIGN"
    | "NON_INTERVENTION_CONDITION_CHANGED";
  readonly reason: string;
  readonly interactionEstimate: null;
  readonly sourceDataScoreProduced: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9TransportSd71GateResult {
  readonly status: "source-blocked" | "ineligible";
  readonly reasonCode:
    | "MV_BLOCKS_SD71_QUANTITATIVE_RESULT"
    | "SOURCE_RECORD_OUTSIDE_CLOSED_SD71_REGISTRY";
  readonly sourceRecordId: string;
  readonly requestedPurpose: Phase9TransportQuantitativePurpose;
  readonly absoluteEligibility: false;
  readonly modelRelativeEligibility: false;
  readonly sourceRelativeOrderSpanRemainsAvailableOnlyThroughMv: boolean;
  readonly ventilationConfound: "non-air-free-fall-transport-confounded";
  readonly sourceDataScoreProduced: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9LatentHeatingAnchorResult {
  readonly status: "printed-anchor-identity-only";
  readonly temperatureC: -1 | -10;
  readonly chi0: 0.8 | 0.4;
  readonly diffusionLimitedMultiplier: number;
  readonly sourceInputEligible: false;
  readonly sourceDataScoreProduced: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9LatentHeatingAnchorRefusal {
  readonly status: "refused";
  readonly temperatureC: number;
  readonly reasonCode:
    | "TARGET_CONDITION_RESISTANCE_REQUIRED"
    | "ANCHOR_INTERPOLATION_OR_EXTRAPOLATION_FORBIDDEN";
  readonly reason: string;
  readonly sourceInputEligible: false;
  readonly sourceDataScoreProduced: false;
  readonly grantsValidationClaim: false;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positive(value: number, label: string): number {
  finite(value, label);
  if (value <= 0) throw new Error(`${label} must be positive`);
  return value;
}

function positiveDerived(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must remain finite and positive after evaluation`);
  }
  return value;
}

function openUnitFraction(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new Error(`${label} must remain finite and strictly between zero and one`);
  }
  return value;
}

function validateManufacturedInput(
  input: Phase9TransportResistanceInput,
): void {
  if (input.purpose !== "manufactured-analytic-check") {
    throw new Error("transport resistance purpose must remain manufactured-analytic-check");
  }
  if (input.geometry !== "shared-capacitance-spherical-bulk") {
    throw new Error("transport resistance geometry is outside the printed scalar closure");
  }
  if (input.ventilation !== "not-represented-manufactured-only") {
    throw new Error("transport resistance diagnostic does not represent ventilation");
  }
  positive(input.temperatureK, "temperature");
  positive(input.saturationVaporPressureIcePa, "ice saturation vapor pressure");
  positive(input.vaporDiffusivityM2S, "vapor diffusivity");
  positive(input.thermalConductivityWMK, "thermal conductivity");
  positive(input.gasConstantJMolK, "gas constant");
  positive(input.waterMolarMassKgMol, "water molar mass");
  positive(input.latentHeatSublimationJKg, "latent heat of sublimation");
  const thermodynamicFactor =
    (input.latentHeatSublimationJKg * input.waterMolarMassKgMol) /
      (input.gasConstantJMolK * input.temperatureK) -
    1;
  if (thermodynamicFactor <= 0) {
    throw new Error("manufactured operands make the printed thermal resistance nonpositive");
  }
}

/**
 * Evaluate the printed bulk continuum resistance sum with caller-supplied manufactured
 * operands. No source condition, gas mapping, shape factor, or ventilation factor is inferred.
 */
export function phase9TransportResistanceBreakdown(
  input: Phase9TransportResistanceInput,
): Phase9TransportResistanceBreakdown {
  validateManufacturedInput(input);
  const vaporResistanceSMPerKg = positiveDerived(
    (input.gasConstantJMolK * input.temperatureK) /
    (input.saturationVaporPressureIcePa *
      input.vaporDiffusivityM2S *
      input.waterMolarMassKgMol),
    "vapor resistance",
  );
  const latentHeatResistanceSMPerKg = positiveDerived(
    (input.latentHeatSublimationJKg /
      (input.thermalConductivityWMK * input.temperatureK)) *
    ((input.latentHeatSublimationJKg * input.waterMolarMassKgMol) /
      (input.gasConstantJMolK * input.temperatureK) -
      1),
    "latent-heat resistance",
  );
  const totalResistanceSMPerKg = positiveDerived(
    vaporResistanceSMPerKg + latentHeatResistanceSMPerKg,
    "total transport resistance",
  );
  const bulkTransferCoefficientKgM1S1 = positiveDerived(
    1 / totalResistanceSMPerKg,
    "bulk transfer coefficient",
  );
  const vaporFractionOfTotalResistance = openUnitFraction(
    vaporResistanceSMPerKg / totalResistanceSMPerKg,
    "vapor fraction of total resistance",
  );
  const latentHeatFractionOfTotalResistance = openUnitFraction(
    latentHeatResistanceSMPerKg / totalResistanceSMPerKg,
    "latent-heat fraction of total resistance",
  );
  return {
    status: "manufactured-diagnostic-only",
    vaporResistanceSMPerKg,
    latentHeatResistanceSMPerKg,
    totalResistanceSMPerKg,
    bulkTransferCoefficientKgM1S1,
    vaporFractionOfTotalResistance,
    latentHeatFractionOfTotalResistance,
    sourceDataScoreProduced: false,
    grantsValidationClaim: false,
  };
}

function sameNonInterventionConditions(
  baseline: Phase9TransportResistanceInput,
  candidate: Phase9TransportResistanceInput,
): boolean {
  return (
    baseline.purpose === candidate.purpose &&
    baseline.geometry === candidate.geometry &&
    baseline.ventilation === candidate.ventilation &&
    baseline.temperatureK === candidate.temperatureK &&
    baseline.saturationVaporPressureIcePa ===
      candidate.saturationVaporPressureIcePa &&
    baseline.gasConstantJMolK === candidate.gasConstantJMolK &&
    baseline.waterMolarMassKgMol === candidate.waterMolarMassKgMol &&
    baseline.latentHeatSublimationJKg === candidate.latentHeatSublimationJKg
  );
}

/**
 * Compare exactly one manufactured transport intervention. A two-axis change is refused
 * because the SD71 source is not a crossed design and therefore cannot identify interaction.
 */
export function phase9TransportOneFactorManufacturedComparison(
  baselineInput: Phase9TransportResistanceInput,
  candidateInput: Phase9TransportResistanceInput,
): Phase9TransportOneFactorResult | Phase9TransportOneFactorRefusal {
  const baseline = phase9TransportResistanceBreakdown(baselineInput);
  const candidate = phase9TransportResistanceBreakdown(candidateInput);
  if (!sameNonInterventionConditions(baselineInput, candidateInput)) {
    return {
      status: "refused",
      reasonCode: "NON_INTERVENTION_CONDITION_CHANGED",
      reason:
        "Temperature, vapor-pressure, constants, geometry, and ventilation declaration " +
        "must remain exact in a one-factor manufactured check.",
      interactionEstimate: null,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    };
  }

  const vaporChanged =
    baselineInput.vaporDiffusivityM2S !== candidateInput.vaporDiffusivityM2S;
  const thermalChanged =
    baselineInput.thermalConductivityWMK !==
    candidateInput.thermalConductivityWMK;
  if (!vaporChanged && !thermalChanged) {
    return {
      status: "refused",
      reasonCode: "NO_INTERVENTION",
      reason: "A one-factor manufactured check must change exactly one resistance operand.",
      interactionEstimate: null,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    };
  }
  if (vaporChanged && thermalChanged) {
    return {
      status: "refused",
      reasonCode: "UNCROSSED_DESIGN",
      reason:
        "A simultaneous vapor and thermal change cannot be interpreted from the uncrossed SD71 design.",
      interactionEstimate: null,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    };
  }

  const bulkTransferCoefficientRatio = positiveDerived(
    candidate.bulkTransferCoefficientKgM1S1 /
      baseline.bulkTransferCoefficientKgM1S1,
    "bulk transfer coefficient ratio",
  );
  const vaporResistanceRatio = positiveDerived(
    candidate.vaporResistanceSMPerKg / baseline.vaporResistanceSMPerKg,
    "vapor resistance ratio",
  );
  const latentHeatResistanceRatio = positiveDerived(
    candidate.latentHeatResistanceSMPerKg /
      baseline.latentHeatResistanceSMPerKg,
    "latent-heat resistance ratio",
  );
  return {
    status: "manufactured-diagnostic-only",
    axis: vaporChanged ? "vapor-diffusivity" : "thermal-conductivity",
    baseline,
    candidate,
    bulkTransferCoefficientRatio,
    vaporResistanceRatio,
    latentHeatResistanceRatio,
    interactionEstimate: null,
    sourceDataScoreProduced: false,
    grantsValidationClaim: false,
  };
}

/**
 * Enforce the final M-V decision for every selected Gonda-Komabayasi series.
 * Source-reported order spans remain an M-V-only descriptive output, not a transport score.
 */
export function phase9TransportSd71QuantitativeGate(
  sourceRecordId: string,
  requestedPurpose: Phase9TransportQuantitativePurpose,
): Phase9TransportSd71GateResult {
  if (!(PHASE9_TRANSPORT_QUANTITATIVE_PURPOSES as readonly unknown[]).includes(requestedPurpose)) {
    throw new Error("transport quantitative purpose is outside the closed registry");
  }
  const registered = (
    PHASE9_TRANSPORT_SD71_SELECTION_IDS as readonly string[]
  ).includes(sourceRecordId);
  return {
    status: registered ? "source-blocked" : "ineligible",
    reasonCode: registered
      ? "MV_BLOCKS_SD71_QUANTITATIVE_RESULT"
      : "SOURCE_RECORD_OUTSIDE_CLOSED_SD71_REGISTRY",
    sourceRecordId,
    requestedPurpose,
    absoluteEligibility: false,
    modelRelativeEligibility: false,
    sourceRelativeOrderSpanRemainsAvailableOnlyThroughMv: registered,
    ventilationConfound: "non-air-free-fall-transport-confounded",
    sourceDataScoreProduced: false,
    grantsValidationClaim: false,
  };
}

/**
 * Preserve only the two approximate printed heating anchors and their printed
 * diffusion-limited multiplier. This is an identity diagnostic, not a source input.
 */
export function phase9LatentHeatingPrintedAnchor(
  temperatureC: number,
): Phase9LatentHeatingAnchorResult | Phase9LatentHeatingAnchorRefusal {
  finite(temperatureC, "Celsius temperature");
  if (temperatureC === -1 || temperatureC === -10) {
    const chi0 = temperatureC === -1 ? 0.8 : 0.4;
    return {
      status: "printed-anchor-identity-only",
      temperatureC,
      chi0,
      diffusionLimitedMultiplier: 1 / (1 + chi0),
      sourceInputEligible: false,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    };
  }
  if (temperatureC === -7 || temperatureC === -15) {
    return {
      status: "refused",
      temperatureC,
      reasonCode: "TARGET_CONDITION_RESISTANCE_REQUIRED",
      reason:
        "The printed anchors do not define a target-condition value; a byte-bound " +
        "exact-condition geometry and conductivity calculation is required.",
      sourceInputEligible: false,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    };
  }
  return {
    status: "refused",
    temperatureC,
    reasonCode: "ANCHOR_INTERPOLATION_OR_EXTRAPOLATION_FORBIDDEN",
    reason:
      "Only the exact printed minus-one and minus-ten Celsius anchors are represented; " +
      "interpolation, extrapolation, and pressure rescaling are unavailable.",
    sourceInputEligible: false,
    sourceDataScoreProduced: false,
    grantsValidationClaim: false,
  };
}
