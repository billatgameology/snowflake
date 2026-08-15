/**
 * Phase 9 S9 pre-score foundation for the M-W, M-SS, and M-SR hollowing rivals.
 *
 * This module is pure and deliberately has no solver, filesystem, NAS, or 3-D path. It
 * evaluates only a normalized width-law shape, a P4 manufactured width fixture, exact
 * tracked rim-summary replays, categorical observed surface features, and refusals.
 */

export const PHASE9_HOLLOWING_PROTOCOL_ID =
  "phase9-hollowing-rivals-prescore-v1" as const;

export const PHASE9_NORMALIZED_WIDTH_DOMAIN = Object.freeze({
  minimum: 0.1,
  maximum: 5,
});

export const PHASE9_NORMALIZED_WIDTH_ROSTER = Object.freeze([
  0.1,
  0.5,
  1,
  2,
  5,
] as const);

export const PHASE9_MANUFACTURED_WIDTH_FIXTURE = Object.freeze({
  provenance: "P4-symmetric-piecewise-linear-half-maximum-fixture",
  coordinateUnit: "dimensionless-manufactured-coordinate",
  coordinates: Object.freeze([-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]),
  profile: Object.freeze([0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]),
  thresholdFraction: 0.5,
  exactLeftCrossing: -0.5,
  exactRightCrossing: 0.5,
  exactWidth: 1,
  physicalWidthMapping: "absent",
});

export const PHASE9_HP26_RIM_FIXTURES = Object.freeze({
  "P8B-P0-10C734F0C6C31B5904B10BE7": Object.freeze({
    historyId: "P8B-NATIVE-DIMENSIONS-20231128",
    sourceMemberSha256: "c4b8d3d5c674898b8e5bfa761e95933b251d59daa833dbd5fb27483238c57c48",
    rowCount: 26,
    first: Object.freeze({ timeS: 0, aUm: 11.14, cUm: 34.91, rimWidthUm: 6.75 }),
    last: Object.freeze({ timeS: 7502, aUm: 37.64, cUm: 221.01, rimWidthUm: 6.71 }),
    event: null,
  }),
  "P8B-P0-2CF2C2C5B3A6900FC3F9CDDA": Object.freeze({
    historyId: "P8B-NATIVE-DIMENSIONS-20240814",
    sourceMemberSha256: "8aff69945a47d383b708942bb0441768ddf2822f812495fea69e51aebf3f25e8",
    rowCount: 68,
    first: Object.freeze({ timeS: 0, aUm: 14.13, cUm: 19.31, rimWidthUm: 5.53 }),
    last: Object.freeze({ timeS: 20106, aUm: 54.71, cUm: 194.95, rimWidthUm: 31.65 }),
    event: Object.freeze({
      eventTimeS: 13800,
      observationAtEvent: false,
      before: Object.freeze({ timeS: 13504, aUm: 51.5, cUm: 174.54, rimWidthUm: 6.37 }),
      firstAfter: Object.freeze({ timeS: 13804, aUm: 51.7, cUm: 176.07, rimWidthUm: 7.87 }),
      secondAfter: Object.freeze({ timeS: 14104, aUm: 51.33, cUm: 176.97, rimWidthUm: 13.81 }),
    }),
  }),
});

export type Phase9Hp26RimSelectionId = keyof typeof PHASE9_HP26_RIM_FIXTURES;

export const PHASE9_OBSERVED_SURFACE_FEATURES = Object.freeze({
  "nelson-swanson-2019": Object.freeze({
    sourceSha256: "84bdc4f49db156160b52c6887e55080f547850e21c172b5794f47eeb34deac1f",
    evidenceRole: "observed-lateral-facet-state-rival",
    features: Object.freeze([
      "lateral-facet-spreading",
      "corner-pockets",
      "planar-pockets",
      "elongated-edge-pockets",
      "growth-sublimation-regrowth-response",
    ] as const),
    restriction: "categorical source replay only; pocket/regrowth codebook and trajectory reads are not frozen",
  }),
  "voigtlander-et-al-2018": Object.freeze({
    sourceSha256: "8062802f15b237ed51d0abd9589a22963539f9a27ed2e5596f7932852c08133c",
    evidenceRole: "observed-roughness-cycle-rival",
    features: Object.freeze([
      "supersaturation-associated-roughness",
      "growth-sublimation-cycle-roughness-ratcheting",
      "later-cycle-growth-rate-reduction",
    ] as const),
    restriction: "categorical source replay only; calibration data, videos, and a registered numeric trajectory operator are absent",
  }),
  "magee-et-al-2014": Object.freeze({
    sourceSha256: "1a0709a42e70ad507e83239a92e29740b317755704f31076099a00aa8d643e41",
    evidenceRole: "observed-mesoscopic-surface-state-rival",
    features: Object.freeze([
      "ridges-steps-pits-and-crevasses",
      "growth-and-sublimation-surface-topography",
      "post-equilibrium-growth-stall-observation",
    ] as const),
    restriction: "categorical context only; no frozen ridge/roughness codebook, uncertainty, or native surface map",
  }),
});

export type Phase9ObservedSurfaceSource = keyof typeof PHASE9_OBSERVED_SURFACE_FEATURES;

export const PHASE9_HOLLOWING_CLAIM_BOUNDARY = Object.freeze({
  phase9Role: "development-only-prescore-foundation",
  sourceReplayAvailable: true,
  sourceDataScoreAvailable: false,
  mechanismRankingAvailable: false,
  morphologyInferenceAvailable: false,
  causalInferenceAvailable: false,
  physicalPromotionAvailable: false,
  validationClaimAvailable: false,
  threeDimensionalCampaignAvailable: false,
});

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length ||
      actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(`${label} fields must match the registered schema exactly`);
  }
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

export interface Phase9NormalizedWidthLawInput {
  readonly purpose: "registered-normalized-width-law-shape";
  readonly widthOverW0: number;
  readonly physicalWidthM: null;
  readonly w0M: null;
}

export interface Phase9NormalizedWidthLawResult {
  readonly status: "normalized-width-law-diagnostic-only";
  readonly rival: "M-W";
  readonly widthOverW0: number;
  readonly barrierFractionOfBroadFacet: number;
  readonly barrierReductionFraction: number;
  readonly physicalWidthMappingAvailable: false;
  readonly newerPrincetonEditionCompared: false;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

/** Evaluate only the printed dimensionless shape 1-exp(-w/w0). */
export function phase9NormalizedWidthLaw(
  input: Phase9NormalizedWidthLawInput,
): Phase9NormalizedWidthLawResult {
  exactKeys(input, ["purpose", "widthOverW0", "physicalWidthM", "w0M"], "width-law input");
  if (input.purpose !== "registered-normalized-width-law-shape") {
    throw new Error("width-law purpose is outside the registered normalized diagnostic");
  }
  if (input.physicalWidthM !== null || input.w0M !== null) {
    throw new Error("physical w and w0 mapping is unavailable and must remain null");
  }
  finite(input.widthOverW0, "widthOverW0");
  if (input.widthOverW0 < PHASE9_NORMALIZED_WIDTH_DOMAIN.minimum ||
      input.widthOverW0 > PHASE9_NORMALIZED_WIDTH_DOMAIN.maximum) {
    throw new Error("widthOverW0 is outside the registered [0.1, 5] diagnostic domain");
  }
  const barrierFractionOfBroadFacet = -Math.expm1(-input.widthOverW0);
  return {
    status: "normalized-width-law-diagnostic-only",
    rival: "M-W",
    widthOverW0: input.widthOverW0,
    barrierFractionOfBroadFacet,
    barrierReductionFraction: 1 - barrierFractionOfBroadFacet,
    physicalWidthMappingAvailable: false,
    newerPrincetonEditionCompared: false,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  };
}

export interface Phase9ManufacturedWidthInput {
  readonly purpose: "registered-manufactured-half-maximum-width";
  readonly provenance: "P4-symmetric-piecewise-linear-half-maximum-fixture";
  readonly coordinateUnit: "dimensionless-manufactured-coordinate";
  readonly coordinates: readonly number[];
  readonly profile: readonly number[];
  readonly thresholdFraction: 0.5;
  readonly physicalWidthMapping: "absent";
}

export interface Phase9ManufacturedWidthResult {
  readonly status: "manufactured-width-estimator-diagnostic-only";
  readonly leftCrossing: number;
  readonly rightCrossing: number;
  readonly width: number;
  readonly exactWidth: 1;
  readonly absoluteError: number;
  readonly manufacturedIdentitySatisfied: true;
  readonly physicalWidthMappingAvailable: false;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

function sameNumbers(actual: readonly number[], expected: readonly number[]): boolean {
  if (actual.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (!Object.hasOwn(actual, index) || actual[index] !== expected[index]) return false;
  }
  return true;
}

function sameDenseRoster<T>(actual: readonly T[], expected: readonly T[]): boolean {
  if (actual.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (!Object.hasOwn(actual, index) || actual[index] !== expected[index]) return false;
  }
  return true;
}

/** Exercise a half-maximum crossing estimator only on the exact P4 fixture. */
export function phase9ManufacturedWidthEstimate(
  input: Phase9ManufacturedWidthInput,
): Phase9ManufacturedWidthResult {
  exactKeys(input, [
    "purpose",
    "provenance",
    "coordinateUnit",
    "coordinates",
    "profile",
    "thresholdFraction",
    "physicalWidthMapping",
  ], "manufactured width input");
  const fixture = PHASE9_MANUFACTURED_WIDTH_FIXTURE;
  if (input.purpose !== "registered-manufactured-half-maximum-width" ||
      input.provenance !== fixture.provenance ||
      input.coordinateUnit !== fixture.coordinateUnit ||
      input.thresholdFraction !== fixture.thresholdFraction ||
      input.physicalWidthMapping !== "absent" ||
      !sameNumbers(input.coordinates, fixture.coordinates) ||
      !sameNumbers(input.profile, fixture.profile)) {
    throw new Error("manufactured width estimator requires the exact registered P4 fixture");
  }
  const threshold = input.thresholdFraction * Math.max(...input.profile);
  const activeIndices = input.profile
    .map((value, index) => value >= threshold ? index : -1)
    .filter((index) => index >= 0);
  const leftCrossing = input.coordinates[activeIndices[0]];
  const rightCrossing = input.coordinates[activeIndices[activeIndices.length - 1]];
  const width = rightCrossing - leftCrossing;
  const absoluteError = Math.abs(width - fixture.exactWidth);
  if (leftCrossing !== fixture.exactLeftCrossing ||
      rightCrossing !== fixture.exactRightCrossing || absoluteError !== 0) {
    throw new Error("manufactured width identity failed");
  }
  return {
    status: "manufactured-width-estimator-diagnostic-only",
    leftCrossing,
    rightCrossing,
    width,
    exactWidth: 1,
    absoluteError,
    manufacturedIdentitySatisfied: true,
    physicalWidthMappingAvailable: false,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  };
}

export interface Phase9Hp26RimReplayInput {
  readonly purpose: "registered-source-labelled-rim-feature-replay";
  readonly selectionId: Phase9Hp26RimSelectionId;
  readonly support: "substrate";
  readonly temperatureC: -50;
  readonly forcingSemantics: "source-labelled-categorical-only";
  readonly absoluteForcingConversion: false;
}

export interface Phase9Hp26RimReplayResult {
  readonly status: "same-lineage-rim-feature-replay-only";
  readonly rivalUse: "shared-M-W-M-SS-M-SR-observable";
  readonly selectionId: Phase9Hp26RimSelectionId;
  readonly historyId: string;
  readonly rowCount: number;
  readonly aFactor: number;
  readonly cFactor: number;
  readonly rimFactor: number;
  readonly rimToAInitial: number;
  readonly rimToAFinal: number;
  readonly event: null | {
    readonly eventTimeS: 13800;
    readonly observationAtEvent: false;
    readonly beforeToFirstAfterRimChangeFraction: number;
    readonly beforeToSecondAfterRimChangeFraction: number;
  };
  readonly absoluteForcingAvailable: false;
  readonly mechanismRankingAvailable: false;
  readonly causalInferenceAvailable: false;
  readonly sourceDataScoreProduced: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

/** Re-derive only tracked endpoint/event features; no raw NAS rows or source score are consumed. */
export function phase9Hp26RimFeatureReplay(
  input: Phase9Hp26RimReplayInput,
): Phase9Hp26RimReplayResult {
  exactKeys(input, [
    "purpose",
    "selectionId",
    "support",
    "temperatureC",
    "forcingSemantics",
    "absoluteForcingConversion",
  ], "rim replay input");
  if (input.purpose !== "registered-source-labelled-rim-feature-replay" ||
      input.support !== "substrate" || input.temperatureC !== -50 ||
      input.forcingSemantics !== "source-labelled-categorical-only" ||
      input.absoluteForcingConversion !== false) {
    throw new Error("rim replay must preserve substrate, temperature, and categorical forcing limits");
  }
  const fixture = PHASE9_HP26_RIM_FIXTURES[input.selectionId];
  if (fixture === undefined) throw new Error("unrecognized HP26 rim selection");
  const event = fixture.event === null ? null : {
    eventTimeS: 13800 as const,
    observationAtEvent: false as const,
    beforeToFirstAfterRimChangeFraction:
      (fixture.event.firstAfter.rimWidthUm - fixture.event.before.rimWidthUm) /
      fixture.event.before.rimWidthUm,
    beforeToSecondAfterRimChangeFraction:
      (fixture.event.secondAfter.rimWidthUm - fixture.event.before.rimWidthUm) /
      fixture.event.before.rimWidthUm,
  };
  return {
    status: "same-lineage-rim-feature-replay-only",
    rivalUse: "shared-M-W-M-SS-M-SR-observable",
    selectionId: input.selectionId,
    historyId: fixture.historyId,
    rowCount: fixture.rowCount,
    aFactor: fixture.last.aUm / fixture.first.aUm,
    cFactor: fixture.last.cUm / fixture.first.cUm,
    rimFactor: fixture.last.rimWidthUm / fixture.first.rimWidthUm,
    rimToAInitial: fixture.first.rimWidthUm / fixture.first.aUm,
    rimToAFinal: fixture.last.rimWidthUm / fixture.last.aUm,
    event,
    absoluteForcingAvailable: false,
    mechanismRankingAvailable: false,
    causalInferenceAvailable: false,
    sourceDataScoreProduced: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  };
}

export interface Phase9ObservedFeatureComparisonInput {
  readonly purpose: "registered-observed-surface-feature-comparison";
  readonly sourceRoster: readonly Phase9ObservedSurfaceSource[];
  readonly transportMatching: "unavailable";
  readonly numericCodebook: "unavailable";
}

export interface Phase9ObservedFeatureComparisonResult {
  readonly status: "categorical-observed-feature-comparator-only";
  readonly rival: "M-SR";
  readonly records: readonly (typeof PHASE9_OBSERVED_SURFACE_FEATURES)[Phase9ObservedSurfaceSource][];
  readonly transportMatched: false;
  readonly numericScoreAvailable: false;
  readonly mechanismRankingAvailable: false;
  readonly morphologyInferenceAvailable: false;
  readonly causalInferenceAvailable: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
}

/** Return the frozen categorical feature roster without assigning a score or mechanism. */
export function phase9ObservedSurfaceFeatureComparison(
  input: Phase9ObservedFeatureComparisonInput,
): Phase9ObservedFeatureComparisonResult {
  exactKeys(input, ["purpose", "sourceRoster", "transportMatching", "numericCodebook"],
    "observed feature input");
  const expectedRoster = Object.keys(PHASE9_OBSERVED_SURFACE_FEATURES) as Phase9ObservedSurfaceSource[];
  if (input.purpose !== "registered-observed-surface-feature-comparison" ||
      input.transportMatching !== "unavailable" || input.numericCodebook !== "unavailable" ||
      !sameDenseRoster(input.sourceRoster, expectedRoster)) {
    throw new Error("observed feature comparison requires the exact categorical source roster and refusals");
  }
  return {
    status: "categorical-observed-feature-comparator-only",
    rival: "M-SR",
    records: expectedRoster.map((source) => PHASE9_OBSERVED_SURFACE_FEATURES[source]),
    transportMatched: false,
    numericScoreAvailable: false,
    mechanismRankingAvailable: false,
    morphologyInferenceAvailable: false,
    causalInferenceAvailable: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  };
}

export type Phase9HollowingPurpose =
  | "normalized-width-law-shape"
  | "manufactured-width-estimator"
  | "hp26-rim-feature-source-replay"
  | "observed-spatial-roughness-feature-comparison"
  | "physical-width-law"
  | "mss-exact-equation-evaluation"
  | "absolute-forcing-response"
  | "mechanism-ranking"
  | "morphology-or-causal-claim"
  | "physical-module-promotion"
  | "quantitative-validation"
  | "three-dimensional-campaign";

export interface Phase9HollowingEligibilityResult {
  readonly requestedPurpose: Phase9HollowingPurpose;
  readonly status: "diagnostic-eligible" | "eligible-with-limitation" | "source-blocked" | "ineligible";
  readonly reasonCode:
    | "NORMALIZED_DIAGNOSTIC_ONLY"
    | "SAME_LINEAGE_CATEGORICAL_REPLAY_ONLY"
    | "PRINCETON_W0_AND_PHYSICAL_WIDTH_MAPPING_UNRESOLVED"
    | "P9B_MISSING_HP26_EXACT_EQUATIONS"
    | "HP25_ABSOLUTE_FORCING_SEMANTICS_UNRESOLVED"
    | "UNMATCHED_TRANSPORT_AND_NO_COMMON_NUMERIC_CODEBOOK"
    | "MORPHOLOGY_AND_CAUSAL_INFERENCE_FORBIDDEN"
    | "PRESCORE_FOUNDATION_CANNOT_PROMOTE"
    | "PHASE9_CANNOT_GRANT_VALIDATION"
    | "NO_3D_PROTOCOL_OR_RESOURCE_AUTHORIZATION";
  readonly sourceDataScoreEligible: false;
  readonly mechanismRankingEligible: false;
  readonly physicalPromotionEligible: false;
  readonly grantsValidationClaim: false;
  readonly threeDimensionalCampaignEligible: false;
}

function eligibility(
  requestedPurpose: Phase9HollowingPurpose,
  status: Phase9HollowingEligibilityResult["status"],
  reasonCode: Phase9HollowingEligibilityResult["reasonCode"],
): Phase9HollowingEligibilityResult {
  return {
    requestedPurpose,
    status,
    reasonCode,
    sourceDataScoreEligible: false,
    mechanismRankingEligible: false,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
    threeDimensionalCampaignEligible: false,
  };
}

/** Fail-closed purpose gate for every S9 pre-score use. */
export function phase9HollowingEligibility(
  requestedPurpose: Phase9HollowingPurpose,
): Phase9HollowingEligibilityResult {
  if (requestedPurpose === "normalized-width-law-shape" ||
      requestedPurpose === "manufactured-width-estimator") {
    return eligibility(requestedPurpose, "diagnostic-eligible", "NORMALIZED_DIAGNOSTIC_ONLY");
  }
  if (requestedPurpose === "hp26-rim-feature-source-replay" ||
      requestedPurpose === "observed-spatial-roughness-feature-comparison") {
    return eligibility(requestedPurpose, "eligible-with-limitation",
      "SAME_LINEAGE_CATEGORICAL_REPLAY_ONLY");
  }
  if (requestedPurpose === "physical-width-law") {
    return eligibility(requestedPurpose, "source-blocked",
      "PRINCETON_W0_AND_PHYSICAL_WIDTH_MAPPING_UNRESOLVED");
  }
  if (requestedPurpose === "mss-exact-equation-evaluation") {
    return eligibility(requestedPurpose, "source-blocked", "P9B_MISSING_HP26_EXACT_EQUATIONS");
  }
  if (requestedPurpose === "absolute-forcing-response") {
    return eligibility(requestedPurpose, "source-blocked",
      "HP25_ABSOLUTE_FORCING_SEMANTICS_UNRESOLVED");
  }
  if (requestedPurpose === "mechanism-ranking") {
    return eligibility(requestedPurpose, "ineligible",
      "UNMATCHED_TRANSPORT_AND_NO_COMMON_NUMERIC_CODEBOOK");
  }
  if (requestedPurpose === "morphology-or-causal-claim") {
    return eligibility(requestedPurpose, "ineligible",
      "MORPHOLOGY_AND_CAUSAL_INFERENCE_FORBIDDEN");
  }
  if (requestedPurpose === "physical-module-promotion") {
    return eligibility(requestedPurpose, "ineligible", "PRESCORE_FOUNDATION_CANNOT_PROMOTE");
  }
  if (requestedPurpose === "quantitative-validation") {
    return eligibility(requestedPurpose, "ineligible", "PHASE9_CANNOT_GRANT_VALIDATION");
  }
  if (requestedPurpose === "three-dimensional-campaign") {
    return eligibility(requestedPurpose, "ineligible", "NO_3D_PROTOCOL_OR_RESOURCE_AUTHORIZATION");
  }
  throw new Error("unrecognized S9 hollowing purpose");
}
