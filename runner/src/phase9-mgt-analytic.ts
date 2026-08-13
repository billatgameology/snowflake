/**
 * Phase 9 M-GT spherical Gibbs-Thomson and manufactured-grid foundation.
 *
 * This module is deliberately pure and diagnostic-only. It does not read source
 * observations, estimate curvature from a lattice, modify either permanent solver,
 * apply a nonpositive effective drive, score a measurement, or authorize a 3-D run.
 * The frozen protocol owns provenance and claim limits; this file owns only bounded
 * arithmetic, one-factor controls, and fail-closed purpose checks.
 */

export const PHASE9_MGT_PROTOCOL_ID =
  "phase9-mgt-manufactured-diagnostic-v1" as const;

/**
 * P4 manufactured fixture. Its rounded 1 nm scale is seeded by the source-derived,
 * temperature-dependent and uncertain P2 estimate below; it is not a physical input.
 */
export const PHASE9_MGT_MANUFACTURED_GIBBS_THOMSON_LENGTH_M = 1e-9 as const;

const PHASE9_MGT_P2_GAMMA_SV_CENTRAL_J_M2 = 0.106;
const PHASE9_MGT_P2_GAMMA_SV_UNCERTAINTY_J_M2 = 0.015;
const PHASE9_MGT_P2_C_ICE_M3 = 3.1e28;
const PHASE9_MGT_BOLTZMANN_J_K = 1.380649e-23;

function p2ScaleExample(temperatureK: number): {
  readonly temperatureK: number;
  readonly centralM: number;
  readonly gammaOnlyLowerM: number;
  readonly gammaOnlyUpperM: number;
} {
  const denominator = PHASE9_MGT_P2_C_ICE_M3 * PHASE9_MGT_BOLTZMANN_J_K * temperatureK;
  return Object.freeze({
    temperatureK,
    centralM: PHASE9_MGT_P2_GAMMA_SV_CENTRAL_J_M2 / denominator,
    gammaOnlyLowerM:
      (PHASE9_MGT_P2_GAMMA_SV_CENTRAL_J_M2 -
        PHASE9_MGT_P2_GAMMA_SV_UNCERTAINTY_J_M2) / denominator,
    gammaOnlyUpperM:
      (PHASE9_MGT_P2_GAMMA_SV_CENTRAL_J_M2 +
        PHASE9_MGT_P2_GAMMA_SV_UNCERTAINTY_J_M2) / denominator,
  });
}

/** Bound scale context; the temperatures are examples, not an adopted physical domain. */
export const PHASE9_MGT_P2_SCALE_CONTEXT = Object.freeze({
  provenanceClass: "P2-temperature-dependent-uncertain-derived-scale",
  formula: "dSv = gammaSv / (cIce * kBoltzmann * temperatureK)",
  gammaSvCentralJPerM2: PHASE9_MGT_P2_GAMMA_SV_CENTRAL_J_M2,
  gammaSvReportedUncertaintyJPerM2: PHASE9_MGT_P2_GAMMA_SV_UNCERTAINTY_J_M2,
  cIceApproximateM3: PHASE9_MGT_P2_C_ICE_M3,
  cIceUncertaintyStatus: "unreported-in-bound-table",
  kBoltzmannJPerK: PHASE9_MGT_BOLTZMANN_J_K,
  examples: Object.freeze([
    p2ScaleExample(233.15),
    p2ScaleExample(258.15),
    p2ScaleExample(273.15),
  ]),
  exampleStatus:
    "scale examples only; gamma-only intervals omit unreported cIce uncertainty and do not define a physical-use domain",
  physicalUse: "blocked",
});

/** P4 arithmetic domain, not a claim that continuum curvature is valid throughout it. */
export const PHASE9_MGT_RADIUS_DOMAIN_M = Object.freeze({
  minimum: 1e-7,
  maximum: 1e-4,
});

/** P4 arithmetic domain in dimensionless fraction units, never percent. */
export const PHASE9_MGT_SIGMA_SURFACE_DOMAIN = Object.freeze({
  minimum: 0,
  maximum: 0.3,
});

export const PHASE9_MGT_GRID_CELLS_PER_RADIUS = Object.freeze([
  8,
  16,
  32,
  64,
] as const);

export const PHASE9_MGT_MANUFACTURED_COARSE_RELATIVE_ERROR = 0.08 as const;

/** One tolerance for fixture identity and its propagated derived-order checks. */
export const PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS = 8 as const;

/** Operation-count safety factor for the reported binary64 one-factor residual. */
export const PHASE9_MGT_ONE_FACTOR_RESIDUAL_BOUND_ULPS = 8 as const;

export const PHASE9_MGT_CLAIM_BOUNDARY = Object.freeze({
  phase9Role: "development-only-numerical-diagnostic",
  consumesSourceObservations: false,
  measurementScoreAvailable: false,
  physicalPromotionAvailable: false,
  threeDimensionalCampaignAvailable: false,
  solverCouplingAvailable: false,
  grantsValidationClaim: false,
});

export const PHASE9_MGT_FUTURE_3D_BLOCKERS = Object.freeze([
  "NO_MATCHED_CURVATURE_INTERVENTION",
  "MONOGRAPH_ONLY_NUMERIC_INPUT_RESTRICTIONS_UNRESOLVED",
  "DISCRETE_CURVATURE_ESTIMATOR_NOT_IMPLEMENTED_OR_REGISTERED",
  "CURVATURE_TO_SURFACE_OPERATOR_COUPLING_NOT_SPECIFIED",
  "NONPOSITIVE_EFFECTIVE_DRIVE_UPDATE_NOT_SUPPORTED",
  "ANISOTROPIC_SURFACE_ENERGY_POLICY_NOT_SPECIFIED",
  "ACTUAL_SOLVER_GRID_AND_DOMAIN_CONVERGENCE_NOT_RUN",
  "THREE_DIMENSIONAL_RESOURCE_PROBE_OR_HOST_RELEASE_NOT_AVAILABLE",
] as const);

export type Phase9MgtMode =
  | "zero-gibbs-thomson-term-control"
  | "gibbs-thomson-intervention";

export interface Phase9MgtSphericalInput {
  readonly purpose: "registered-manufactured-spherical-diagnostic";
  readonly geometry: "sphere";
  readonly curvatureConvention: "positive-two-over-radius-for-convex-ice";
  readonly mode: Phase9MgtMode;
  /** Physical radius in metres. */
  readonly radiusM: number;
  /** Dimensionless supersaturation fraction, never percent. */
  readonly sigmaSurfaceFraction: number;
  /** Metres. Zero is admitted only for the type-appropriate control. */
  readonly gibbsThomsonLengthM: number;
}

export type Phase9MgtDriveDisposition =
  | "positive-effective-drive-diagnostic-only"
  | "equilibrium-threshold-diagnostic-only"
  | "deposition-update-refused-nonpositive-effective-drive";

export interface Phase9MgtSphericalResult {
  readonly status: "manufactured-spherical-diagnostic-only";
  readonly mode: Phase9MgtMode;
  readonly radiusM: number;
  readonly sigmaSurfaceFraction: number;
  readonly gibbsThomsonLengthM: number;
  readonly exactMeanCurvatureM1: number;
  readonly equilibriumShiftFraction: number;
  readonly effectiveSupersaturationFraction: number;
  readonly driveDisposition: Phase9MgtDriveDisposition;
  readonly sourceValueStatus:
    | "type-appropriate-zero-control"
    | "P4-manufactured-fixture-seeded-by-P2-temperature-dependent-uncertain-scale";
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly threeDimensionalCampaignEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MgtOneFactorResult {
  readonly status: "manufactured-one-factor-diagnostic-only";
  readonly intervention: "enable-gibbs-thomson-length-at-fixed-sphere-and-drive";
  readonly baseline: Phase9MgtSphericalResult;
  readonly candidate: Phase9MgtSphericalResult;
  readonly equilibriumShiftIncreaseFraction: number;
  readonly effectiveSupersaturationChangeFraction: number;
  readonly binary64OneFactorIdentityResidual: number;
  readonly binary64OneFactorIdentityAbsoluteBound: number;
  readonly binary64OneFactorIdentityWithinBound: true;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MgtOneFactorRefusal {
  readonly status: "refused";
  readonly reasonCode:
    | "CONTROL_AND_INTERVENTION_ORDER_REQUIRED"
    | "NON_INTERVENTION_OPERAND_CHANGED";
  readonly reason: string;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

export type Phase9MgtGridProvenance =
  | "registered-second-order-manufactured-sphere-fixture"
  | "future-three-dimensional-lattice-estimator";

export interface Phase9MgtGridSampleInput {
  readonly cellsPerRadius: number;
  /** Estimated positive convex-sphere mean curvature in inverse metres. */
  readonly estimatedMeanCurvatureM1: number;
}

export interface Phase9MgtGridInput {
  readonly purpose: "registered-manufactured-grid-convergence-diagnostic";
  readonly provenance: Phase9MgtGridProvenance;
  readonly sphericalIntervention: Phase9MgtSphericalInput;
  readonly samples: readonly Phase9MgtGridSampleInput[];
}

export interface Phase9MgtGridSampleResult {
  readonly cellsPerRadius: 8 | 16 | 32 | 64;
  readonly latticeSpacingM: number;
  readonly estimatedMeanCurvatureM1: number;
  readonly exactMeanCurvatureM1: number;
  readonly signedCurvatureErrorM1: number;
  readonly relativeCurvatureError: number;
  readonly estimatedEquilibriumShiftFraction: number;
  readonly estimatedEffectiveSupersaturationFraction: number;
}

export interface Phase9MgtGridResult {
  readonly status: "manufactured-grid-convergence-diagnostic-only";
  readonly provenance: "registered-second-order-manufactured-sphere-fixture";
  readonly exactMeanCurvatureM1: number;
  readonly samples: readonly Phase9MgtGridSampleResult[];
  readonly pairwiseObservedOrders: readonly [number, number, number];
  readonly relativeErrorsStrictlyDecrease: boolean;
  readonly manufacturedSecondOrderIdentitySatisfied: boolean;
  readonly finestRelativeCurvatureError: number;
  readonly manufacturedDiagnosticEligible: true;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly threeDimensionalCampaignEligible: false;
  readonly grantsValidationClaim: false;
}

export interface Phase9MgtGridRefusal {
  readonly status: "refused";
  readonly reasonCode:
    | "THREE_DIMENSIONAL_CAMPAIGN_NOT_AUTHORIZED"
    | "GRID_LEVEL_ROSTER_MISMATCH"
    | "MANUFACTURED_FIXTURE_IDENTITY_MISMATCH"
    | "MANUFACTURED_SECOND_ORDER_IDENTITY_FAILED";
  readonly reason: string;
  readonly manufacturedDiagnosticEligible: false;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly threeDimensionalCampaignEligible: false;
  readonly grantsValidationClaim: false;
}

export type Phase9MgtRequestedPurpose =
  | "manufactured-spherical-correction"
  | "manufactured-grid-convergence"
  | "phase8-measurement-score"
  | "phase9-source-data-score"
  | "physical-module-promotion"
  | "three-dimensional-campaign";

export interface Phase9MgtEligibilityResult {
  readonly requestedPurpose: Phase9MgtRequestedPurpose;
  readonly status: "diagnostic-eligible" | "ineligible" | "source-blocked";
  readonly reasonCode:
    | "MANUFACTURED_DIAGNOSTIC_ONLY"
    | "NO_MATCHED_CURVATURE_INTERVENTION"
    | "NO_SOURCE_DATA_SCORING_PROTOCOL"
    | "PHYSICAL_PROMOTION_FORBIDDEN_WITHOUT_MATCHED_EXPERIMENT"
    | "THREE_DIMENSIONAL_FOUNDATION_INCOMPLETE";
  readonly measurementScoreEligible: false;
  readonly physicalPromotionEligible: false;
  readonly threeDimensionalCampaignEligible: false;
  readonly grantsValidationClaim: false;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function inClosedDomain(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  finite(value, label);
  if (value < minimum || value > maximum) {
    throw new Error(`${label} must be in [${minimum}, ${maximum}]`);
  }
  return value;
}

function validateSphericalInput(input: Phase9MgtSphericalInput): void {
  if (input.purpose !== "registered-manufactured-spherical-diagnostic") {
    throw new Error("M-GT purpose must remain registered-manufactured-spherical-diagnostic");
  }
  if (input.geometry !== "sphere") {
    throw new Error("M-GT analytic relation is registered only for a sphere");
  }
  if (input.curvatureConvention !== "positive-two-over-radius-for-convex-ice") {
    throw new Error("M-GT curvature convention is outside the registered spherical relation");
  }
  inClosedDomain(
    input.radiusM,
    PHASE9_MGT_RADIUS_DOMAIN_M.minimum,
    PHASE9_MGT_RADIUS_DOMAIN_M.maximum,
    "sphere radius in metres",
  );
  inClosedDomain(
    input.sigmaSurfaceFraction,
    PHASE9_MGT_SIGMA_SURFACE_DOMAIN.minimum,
    PHASE9_MGT_SIGMA_SURFACE_DOMAIN.maximum,
    "surface supersaturation fraction",
  );
  finite(input.gibbsThomsonLengthM, "Gibbs-Thomson length in metres");
  if (input.mode === "zero-gibbs-thomson-term-control") {
    if (input.gibbsThomsonLengthM !== 0) {
      throw new Error("zero-term control requires exactly zero Gibbs-Thomson length");
    }
    return;
  }
  if (input.mode === "gibbs-thomson-intervention") {
    if (input.gibbsThomsonLengthM !== PHASE9_MGT_MANUFACTURED_GIBBS_THOMSON_LENGTH_M) {
      throw new Error(
        "Gibbs-Thomson intervention requires the registered 1e-9 metre P4 manufactured fixture",
      );
    }
    return;
  }
  throw new Error("unrecognized M-GT mode");
}

function driveDisposition(effectiveSupersaturationFraction: number): Phase9MgtDriveDisposition {
  if (effectiveSupersaturationFraction > 0) {
    return "positive-effective-drive-diagnostic-only";
  }
  if (effectiveSupersaturationFraction === 0) {
    return "equilibrium-threshold-diagnostic-only";
  }
  return "deposition-update-refused-nonpositive-effective-drive";
}

/**
 * Evaluate the registered spherical identity
 *   kappa = 2/R; sigma_effective = sigma_surface - d_sv*kappa.
 *
 * The returned effective value is diagnostic. This function never applies it to a solver.
 */
export function phase9MgtSphericalCorrection(
  input: Phase9MgtSphericalInput,
): Phase9MgtSphericalResult {
  validateSphericalInput(input);
  const exactMeanCurvatureM1 = 2 / input.radiusM;
  const equilibriumShiftFraction = input.gibbsThomsonLengthM * exactMeanCurvatureM1;
  const effectiveSupersaturationFraction =
    input.sigmaSurfaceFraction - equilibriumShiftFraction;
  return {
    status: "manufactured-spherical-diagnostic-only",
    mode: input.mode,
    radiusM: input.radiusM,
    sigmaSurfaceFraction: input.sigmaSurfaceFraction,
    gibbsThomsonLengthM: input.gibbsThomsonLengthM,
    exactMeanCurvatureM1,
    equilibriumShiftFraction,
    effectiveSupersaturationFraction,
    driveDisposition: driveDisposition(effectiveSupersaturationFraction),
    sourceValueStatus: input.mode === "zero-gibbs-thomson-term-control"
      ? "type-appropriate-zero-control"
      : "P4-manufactured-fixture-seeded-by-P2-temperature-dependent-uncertain-scale",
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    threeDimensionalCampaignEligible: false,
    grantsValidationClaim: false,
  };
}

function oneFactorRefusal(
  reasonCode: Phase9MgtOneFactorRefusal["reasonCode"],
  reason: string,
): Phase9MgtOneFactorRefusal {
  return {
    status: "refused",
    reasonCode,
    reason,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  };
}

/** Enable only the registered curvature term while holding sphere and drive bit-identical. */
export function phase9MgtOneFactorComparison(
  baselineInput: Phase9MgtSphericalInput,
  candidateInput: Phase9MgtSphericalInput,
): Phase9MgtOneFactorResult | Phase9MgtOneFactorRefusal {
  const baseline = phase9MgtSphericalCorrection(baselineInput);
  const candidate = phase9MgtSphericalCorrection(candidateInput);
  if (
    baseline.mode !== "zero-gibbs-thomson-term-control" ||
    candidate.mode !== "gibbs-thomson-intervention"
  ) {
    return oneFactorRefusal(
      "CONTROL_AND_INTERVENTION_ORDER_REQUIRED",
      "comparison requires the zero-term control first and the registered intervention second",
    );
  }
  if (
    baseline.radiusM !== candidate.radiusM ||
    baseline.sigmaSurfaceFraction !== candidate.sigmaSurfaceFraction
  ) {
    return oneFactorRefusal(
      "NON_INTERVENTION_OPERAND_CHANGED",
      "sphere radius and surface supersaturation must remain bit-identical",
    );
  }
  const equilibriumShiftIncreaseFraction =
    candidate.equilibriumShiftFraction - baseline.equilibriumShiftFraction;
  const effectiveSupersaturationChangeFraction =
    candidate.effectiveSupersaturationFraction - baseline.effectiveSupersaturationFraction;
  const binary64OneFactorIdentityResidual =
    effectiveSupersaturationChangeFraction + equilibriumShiftIncreaseFraction;
  const binary64OneFactorIdentityAbsoluteBound =
    PHASE9_MGT_ONE_FACTOR_RESIDUAL_BOUND_ULPS *
    Number.EPSILON *
    Math.max(
      Math.abs(baseline.effectiveSupersaturationFraction),
      Math.abs(candidate.effectiveSupersaturationFraction),
      Math.abs(equilibriumShiftIncreaseFraction),
      Number.MIN_VALUE,
    );
  if (
    Math.abs(binary64OneFactorIdentityResidual) >
      binary64OneFactorIdentityAbsoluteBound
  ) {
    throw new Error("binary64 one-factor identity residual exceeds its registered bound");
  }
  return {
    status: "manufactured-one-factor-diagnostic-only",
    intervention: "enable-gibbs-thomson-length-at-fixed-sphere-and-drive",
    baseline,
    candidate,
    equilibriumShiftIncreaseFraction,
    effectiveSupersaturationChangeFraction,
    binary64OneFactorIdentityResidual,
    binary64OneFactorIdentityAbsoluteBound,
    binary64OneFactorIdentityWithinBound: true,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  };
}

/**
 * Deterministic manufactured second-order curvature sequence. The 8-cells-per-radius
 * value has +8% relative error, falling by exactly four on each factor-two refinement.
 */
export function phase9MgtManufacturedSecondOrderSamples(
  sphericalIntervention: Phase9MgtSphericalInput,
): readonly Phase9MgtGridSampleInput[] {
  const exact = phase9MgtSphericalCorrection(sphericalIntervention);
  if (exact.mode !== "gibbs-thomson-intervention") {
    throw new Error("manufactured grid fixture requires the Gibbs-Thomson intervention");
  }
  return PHASE9_MGT_GRID_CELLS_PER_RADIUS.map((cellsPerRadius) => ({
    cellsPerRadius,
    estimatedMeanCurvatureM1:
      exact.exactMeanCurvatureM1 *
      (1 + PHASE9_MGT_MANUFACTURED_COARSE_RELATIVE_ERROR * (8 / cellsPerRadius) ** 2),
  }));
}

function gridRefusal(
  reasonCode: Phase9MgtGridRefusal["reasonCode"],
  reason: string,
): Phase9MgtGridRefusal {
  return {
    status: "refused",
    reasonCode,
    reason,
    manufacturedDiagnosticEligible: false,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    threeDimensionalCampaignEligible: false,
    grantsValidationClaim: false,
  };
}

function positiveBinary64Bits(value: number): bigint {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("binary64 ULP comparison requires a finite positive value");
  }
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false);
}

function positiveBinary64FromBits(bits: bigint): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, bits, false);
  const value = view.getFloat64(0, false);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("binary64 ULP step left the finite positive domain");
  }
  return value;
}

function positiveBinary64UlpDistance(left: number, right: number): bigint {
  const leftBits = positiveBinary64Bits(left);
  const rightBits = positiveBinary64Bits(right);
  return leftBits >= rightBits ? leftBits - rightBits : rightBits - leftBits;
}

function positiveBinary64AtUlpOffset(value: number, offset: number): number {
  if (!Number.isSafeInteger(offset)) throw new Error("ULP offset must be a safe integer");
  const bits = positiveBinary64Bits(value);
  return positiveBinary64FromBits(bits + BigInt(offset));
}

/**
 * Re-derive the spherical reference, manufactured fixture identity, errors, and orders.
 * A future lattice-estimator label is refused: no such implementation or 3-D protocol exists.
 */
export function phase9MgtGridConvergenceDiagnostic(
  input: Phase9MgtGridInput,
): Phase9MgtGridResult | Phase9MgtGridRefusal {
  if (input.purpose !== "registered-manufactured-grid-convergence-diagnostic") {
    throw new Error("M-GT grid purpose must remain manufactured-grid-convergence diagnostic");
  }
  const spherical = phase9MgtSphericalCorrection(input.sphericalIntervention);
  if (spherical.mode !== "gibbs-thomson-intervention") {
    throw new Error("M-GT grid diagnostic requires the registered intervention");
  }
  if (input.provenance === "future-three-dimensional-lattice-estimator") {
    return gridRefusal(
      "THREE_DIMENSIONAL_CAMPAIGN_NOT_AUTHORIZED",
      "no discrete curvature estimator, coupling policy, actual-solver convergence result, or 3-D resource authorization exists",
    );
  }
  if (input.provenance !== "registered-second-order-manufactured-sphere-fixture") {
    throw new Error("unrecognized M-GT grid provenance");
  }
  if (
    input.samples.length !== PHASE9_MGT_GRID_CELLS_PER_RADIUS.length ||
    input.samples.some(
      (sample, index) => sample.cellsPerRadius !== PHASE9_MGT_GRID_CELLS_PER_RADIUS[index],
    )
  ) {
    return gridRefusal(
      "GRID_LEVEL_ROSTER_MISMATCH",
      "manufactured ladder must contain exactly 8, 16, 32, and 64 cells per radius in order",
    );
  }

  const expectedSamples = phase9MgtManufacturedSecondOrderSamples(input.sphericalIntervention);
  let fixtureIdentityWithinTolerance = true;
  for (let index = 0; index < input.samples.length; index += 1) {
    const sample = input.samples[index];
    finite(sample.estimatedMeanCurvatureM1, "estimated mean curvature in inverse metres");
    if (sample.estimatedMeanCurvatureM1 <= 0) {
      throw new Error("estimated mean curvature must be positive for the registered convex sphere");
    }
    fixtureIdentityWithinTolerance &&=
      positiveBinary64UlpDistance(
        sample.estimatedMeanCurvatureM1,
        expectedSamples[index].estimatedMeanCurvatureM1,
      ) <= BigInt(PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS);
  }

  const samples = input.samples.map((sample, index): Phase9MgtGridSampleResult => {
    const cellsPerRadius = PHASE9_MGT_GRID_CELLS_PER_RADIUS[index];
    const signedCurvatureErrorM1 =
      sample.estimatedMeanCurvatureM1 - spherical.exactMeanCurvatureM1;
    const relativeCurvatureError =
      Math.abs(signedCurvatureErrorM1) / spherical.exactMeanCurvatureM1;
    const estimatedEquilibriumShiftFraction =
      spherical.gibbsThomsonLengthM * sample.estimatedMeanCurvatureM1;
    return {
      cellsPerRadius,
      latticeSpacingM: spherical.radiusM / cellsPerRadius,
      estimatedMeanCurvatureM1: sample.estimatedMeanCurvatureM1,
      exactMeanCurvatureM1: spherical.exactMeanCurvatureM1,
      signedCurvatureErrorM1,
      relativeCurvatureError,
      estimatedEquilibriumShiftFraction,
      estimatedEffectiveSupersaturationFraction:
        spherical.sigmaSurfaceFraction - estimatedEquilibriumShiftFraction,
    };
  });

  const pairwiseObservedOrders = [0, 1, 2].map((index) =>
    Math.log2(
      samples[index].relativeCurvatureError /
      samples[index + 1].relativeCurvatureError,
    )
  ) as [number, number, number];
  const relativeErrorsStrictlyDecrease = [0, 1, 2].every(
    (index) => samples[index + 1].relativeCurvatureError < samples[index].relativeCurvatureError,
  );
  const expectedRelativeErrorBounds = expectedSamples.map((sample) => {
    const lowerEstimate = positiveBinary64AtUlpOffset(
      sample.estimatedMeanCurvatureM1,
      -PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS,
    );
    const upperEstimate = positiveBinary64AtUlpOffset(
      sample.estimatedMeanCurvatureM1,
      PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS,
    );
    const lower = Math.abs(lowerEstimate - spherical.exactMeanCurvatureM1) /
      spherical.exactMeanCurvatureM1;
    const upper = Math.abs(upperEstimate - spherical.exactMeanCurvatureM1) /
      spherical.exactMeanCurvatureM1;
    return { minimum: Math.min(lower, upper), maximum: Math.max(lower, upper) };
  });
  const relativeErrorIdentitySatisfied = samples.every((sample, index) =>
    sample.relativeCurvatureError >= expectedRelativeErrorBounds[index].minimum &&
    sample.relativeCurvatureError <= expectedRelativeErrorBounds[index].maximum
  );
  const pairwiseOrderIdentitySatisfied = pairwiseObservedOrders.every((order, index) => {
    const minimum = Math.log2(
      expectedRelativeErrorBounds[index].minimum /
      expectedRelativeErrorBounds[index + 1].maximum,
    );
    const maximum = Math.log2(
      expectedRelativeErrorBounds[index].maximum /
      expectedRelativeErrorBounds[index + 1].minimum,
    );
    return order >= minimum && order <= maximum;
  });
  const manufacturedSecondOrderIdentitySatisfied =
    fixtureIdentityWithinTolerance &&
    relativeErrorsStrictlyDecrease &&
    relativeErrorIdentitySatisfied &&
    pairwiseOrderIdentitySatisfied;

  if (!fixtureIdentityWithinTolerance) {
    return gridRefusal(
      "MANUFACTURED_FIXTURE_IDENTITY_MISMATCH",
      "sample exceeds the frozen eight-ULP manufactured-fixture tolerance",
    );
  }
  if (!manufacturedSecondOrderIdentitySatisfied) {
    return gridRefusal(
      "MANUFACTURED_SECOND_ORDER_IDENTITY_FAILED",
      "derived errors or observed orders fail the propagated eight-ULP second-order identity",
    );
  }

  return {
    status: "manufactured-grid-convergence-diagnostic-only",
    provenance: "registered-second-order-manufactured-sphere-fixture",
    exactMeanCurvatureM1: spherical.exactMeanCurvatureM1,
    samples,
    pairwiseObservedOrders,
    relativeErrorsStrictlyDecrease,
    manufacturedSecondOrderIdentitySatisfied,
    finestRelativeCurvatureError: samples[3].relativeCurvatureError,
    manufacturedDiagnosticEligible: true,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    threeDimensionalCampaignEligible: false,
    grantsValidationClaim: false,
  };
}

/** Purpose gate that never upgrades a manufactured result into physical evidence. */
export function phase9MgtEligibility(
  requestedPurpose: Phase9MgtRequestedPurpose,
): Phase9MgtEligibilityResult {
  if (
    requestedPurpose === "manufactured-spherical-correction" ||
    requestedPurpose === "manufactured-grid-convergence"
  ) {
    return {
      requestedPurpose,
      status: "diagnostic-eligible",
      reasonCode: "MANUFACTURED_DIAGNOSTIC_ONLY",
      measurementScoreEligible: false,
      physicalPromotionEligible: false,
      threeDimensionalCampaignEligible: false,
      grantsValidationClaim: false,
    };
  }
  if (requestedPurpose === "phase8-measurement-score") {
    return {
      requestedPurpose,
      status: "ineligible",
      reasonCode: "NO_MATCHED_CURVATURE_INTERVENTION",
      measurementScoreEligible: false,
      physicalPromotionEligible: false,
      threeDimensionalCampaignEligible: false,
      grantsValidationClaim: false,
    };
  }
  if (requestedPurpose === "phase9-source-data-score") {
    return {
      requestedPurpose,
      status: "source-blocked",
      reasonCode: "NO_SOURCE_DATA_SCORING_PROTOCOL",
      measurementScoreEligible: false,
      physicalPromotionEligible: false,
      threeDimensionalCampaignEligible: false,
      grantsValidationClaim: false,
    };
  }
  if (requestedPurpose === "physical-module-promotion") {
    return {
      requestedPurpose,
      status: "ineligible",
      reasonCode: "PHYSICAL_PROMOTION_FORBIDDEN_WITHOUT_MATCHED_EXPERIMENT",
      measurementScoreEligible: false,
      physicalPromotionEligible: false,
      threeDimensionalCampaignEligible: false,
      grantsValidationClaim: false,
    };
  }
  if (requestedPurpose === "three-dimensional-campaign") {
    return {
      requestedPurpose,
      status: "source-blocked",
      reasonCode: "THREE_DIMENSIONAL_FOUNDATION_INCOMPLETE",
      measurementScoreEligible: false,
      physicalPromotionEligible: false,
      threeDimensionalCampaignEligible: false,
      grantsValidationClaim: false,
    };
  }
  throw new Error("unrecognized M-GT requested purpose");
}
