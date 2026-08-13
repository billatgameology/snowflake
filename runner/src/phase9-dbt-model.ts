// Phase 9 D-BT: pure bulk-transfer comparators and source-matched history preparation.
//
// This module has no file I/O and does not know the registered six-history roster. The frozen
// protocol owns source identities and eligibility; these functions own deterministic arithmetic.

export const PHASE9_DBT_LINEAGE_STATUS =
  "code-indicated-nonoverlap-not-definitive" as const;

export const PHASE9_DBT_CLAIM_BOUNDARY = Object.freeze({
  developmentEvidenceOnly: true,
  grantsValidationClaim: false,
  predictsFacetOrHabit: false,
  transfersUnqualifiedToFreeParticles: false,
});

export const PHASE9_DBT_CONSTANTS = Object.freeze({
  celsiusZeroK: 273.15,
  standardPressurePa: 101_325,
  rhoIceKgM3: 910,
  gasConstantJMolK: 8.3144521,
  waterMolarMassKgMol: 18e-3,
  waterVaporGasConstantJKgK: 461.51,
  dryAirGasConstantJKgK: 287.05,
  dryAirSpecificHeatJKgK: 1_005,
  latentHeatSublimationJKg: 2.837e6,
  joulesPerCalorie: 4.187,
  vaporDiffusivityReferenceM2S: 2.11e-5,
  molecularMeanFreePathM: 8e-8,
  vaporJumpDistanceM: 1.3 * 8e-8,
  thermalJumpDistanceM: 2.16e-7,
  thermalAccommodationCoefficient: 1,
  lambExponent: 1.3153063,
  lambMassScaleCoefficient: 2.6606467,
  lambDenominatorScale: 1.1682062,
  lambAdditiveScaled: 0.1123054,
});

export const PHASE9_DBT_RESCALE_SEARCH = Object.freeze({
  minimum: 0,
  maximum: 2,
  coarseIntervals: 256,
  goldenIterations: 80,
});

export interface Phase9DbtCondition {
  readonly tempK: number;
  readonly pressurePa: number;
  /** Ambient excess ice supersaturation as a fraction: 0.17 means 17 percent. */
  readonly excessIceSupersaturationFraction: number;
  readonly initialRadiusUm: number;
}

export type Phase9DbtModel =
  | { readonly kind: "continuum" }
  | { readonly kind: "project-ambient-excess-hybrid" }
  | { readonly kind: "lamb" }
  | { readonly kind: "continuum-rescale"; readonly multiplier: number };

export interface Phase9DbtSourceRow {
  readonly timeS: number;
  readonly massRatio: number;
}

export interface Phase9DbtPreparedObservations {
  readonly timesS: readonly number[];
  readonly massRatios: readonly number[];
  readonly duplicateRowCount: number;
  readonly timeZeroAnchorInserted: boolean;
}

export type Phase9DbtResidualSign = "negative" | "zero" | "positive";

export interface Phase9DbtResidualSummary {
  readonly sampleCount: number;
  readonly mse: number;
  readonly meanSignedResidual: number;
  readonly meanResidualSign: Phase9DbtResidualSign;
  readonly endResidual: number;
  readonly endResidualSign: Phase9DbtResidualSign;
  readonly residualSignCounts: {
    readonly negative: number;
    readonly zero: number;
    readonly positive: number;
  };
}

export interface Phase9DbtFivePercentSensitivity {
  readonly maximumRelativeErrorFraction: 0.05;
  readonly centralMse: number;
  readonly coherentLowerObservationMse: number;
  readonly coherentUpperObservationMse: number;
  readonly outsideBandMse: number;
  readonly predictionPositions: {
    readonly below: number;
    readonly inside: number;
    readonly above: number;
  };
}

export interface Phase9DbtHistory {
  readonly id: string;
  readonly condition: Phase9DbtCondition;
  readonly timesS: readonly number[];
  readonly observedMassRatios: readonly number[];
}

export interface Phase9DbtRescaleFit {
  readonly multiplier: number;
  readonly equalHistoryMse: number;
  readonly boundary: "minimum" | "interior" | "maximum";
  readonly trainingHistoryIds: readonly string[];
}

export interface Phase9DbtLeaveOneHistoryOutFold extends Phase9DbtRescaleFit {
  readonly heldOutHistoryId: string;
}

export interface Phase9DbtDecisionInputs {
  readonly historyIds: readonly string[];
  readonly lambMse: readonly number[];
  readonly leaveOneHistoryOutRescaleMse: readonly number[];
}

export interface Phase9DbtDecision {
  readonly survives: boolean;
  readonly lambFamilyMse: number;
  readonly leaveOneHistoryOutRescaleFamilyMse: number;
  readonly strictPerHistoryWins: number;
  readonly perHistoryTies: number;
  readonly perHistory: readonly {
    readonly historyId: string;
    readonly comparison: "lamb-lower" | "tie" | "lamb-not-lower";
    readonly lambStrictWin: boolean;
  }[];
  readonly requiredStrictPerHistoryWins: 4;
  readonly familyComparison: "lamb-lower" | "tie" | "lamb-not-lower";
}

export type Phase9DbtSensitivityName =
  | "initial-radius-lower-heldout-only"
  | "initial-radius-upper-heldout-only"
  | "mass-ratio-minus-five-percent-heldout-only"
  | "mass-ratio-plus-five-percent-heldout-only";

export interface Phase9DbtSensitivityComparison {
  readonly name: Phase9DbtSensitivityName;
  readonly historyId: string;
  readonly lambMse: number;
  readonly leaveOneHistoryOutRescaleMse: number;
}

export interface Phase9DbtSensitivityDiagnostic {
  readonly name: Phase9DbtSensitivityName;
  readonly historyId: string;
  readonly centralLambStrictWin: boolean;
  readonly sensitivityLambStrictWin: boolean;
  readonly winFlipped: boolean;
}

export interface Phase9DbtDecisionEnvelope {
  readonly central: Phase9DbtDecision;
  readonly heldoutOnlySensitivities: readonly Phase9DbtSensitivityDiagnostic[];
  readonly anyHistoryWinFlip: boolean;
  readonly temperatureOneFactorAvailable: false;
  readonly supersaturationOneFactorAvailable: false;
  readonly promotionAvailable: false;
  readonly label:
    | "central-no-effect-or-failure"
    | "sensitivity-dependent-promotion-unavailable"
    | "central-survives-promotion-unavailable";
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    throw new Error(`${label} must be finite and must not be negative zero`);
  }
  return value;
}

function positive(value: number, label: string): number {
  finite(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
  return value;
}

function nonnegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
  return value;
}

function validateCondition(condition: Phase9DbtCondition): void {
  positive(condition.tempK, "temperature");
  if (condition.tempK < 205 || condition.tempK > 240) {
    throw new Error("D-BT temperature must satisfy 205 <= T <= 240 K");
  }
  positive(condition.pressurePa, "pressure");
  nonnegative(
    condition.excessIceSupersaturationFraction,
    "excess ice supersaturation",
  );
  positive(condition.initialRadiusUm, "initial radius");
}

function validateModel(model: Phase9DbtModel): void {
  if (
    model.kind !== "continuum" &&
    model.kind !== "project-ambient-excess-hybrid" &&
    model.kind !== "lamb" &&
    model.kind !== "continuum-rescale"
  ) {
    throw new Error("D-BT model kind is not recognized");
  }
  if (model.kind === "continuum-rescale") {
    nonnegative(model.multiplier, "continuum rescale multiplier");
    if (model.multiplier > PHASE9_DBT_RESCALE_SEARCH.maximum) {
      throw new Error("continuum rescale multiplier must be within [0, 2]");
    }
  }
}

export function phase9DbtSphereMassKg(
  radiusUm: number,
  densityKgM3 = PHASE9_DBT_CONSTANTS.rhoIceKgM3,
): number {
  positive(radiusUm, "sphere radius");
  positive(densityKgM3, "sphere density");
  const radiusM = radiusUm * 1e-6;
  return (4 / 3) * Math.PI * densityKgM3 * radiusM ** 3;
}

export function phase9DbtEquivalentSphereRadiusUm(
  massKg: number,
  densityKgM3 = PHASE9_DBT_CONSTANTS.rhoIceKgM3,
): number {
  positive(massKg, "sphere mass");
  positive(densityKgM3, "sphere density");
  return ((3 * massKg) / (4 * Math.PI * densityKgM3)) ** (1 / 3) * 1e6;
}

export function phase9DbtSaturationVaporPressureIcePa(tempK: number): number {
  positive(tempK, "temperature");
  return Math.exp(9.550426 - 5723.265 / tempK + 3.53068 * Math.log(tempK) - 0.00728332 * tempK);
}

export function phase9DbtVaporDiffusivityM2S(tempK: number, pressurePa: number): number {
  positive(tempK, "temperature");
  positive(pressurePa, "pressure");
  return (
    PHASE9_DBT_CONSTANTS.vaporDiffusivityReferenceM2S *
    (tempK / PHASE9_DBT_CONSTANTS.celsiusZeroK) ** 1.94 *
    (PHASE9_DBT_CONSTANTS.standardPressurePa / pressurePa)
  );
}

export function phase9DbtThermalConductivityAirWMK(tempK: number): number {
  positive(tempK, "temperature");
  const result =
    (5.69 + 0.017 * (tempK - PHASE9_DBT_CONSTANTS.celsiusZeroK)) *
    1e-3 *
    PHASE9_DBT_CONSTANTS.joulesPerCalorie;
  return positive(result, "air thermal conductivity");
}

function transferFromResistances(
  tempK: number,
  vaporDiffusivityM2S: number,
  thermalConductivityWMK: number,
): number {
  if (vaporDiffusivityM2S === 0) return 0;
  positive(vaporDiffusivityM2S, "vapor diffusivity");
  positive(thermalConductivityWMK, "thermal conductivity");
  const vaporResistance =
    (PHASE9_DBT_CONSTANTS.gasConstantJMolK * tempK) /
    (phase9DbtSaturationVaporPressureIcePa(tempK) *
      vaporDiffusivityM2S *
      PHASE9_DBT_CONSTANTS.waterMolarMassKgMol);
  const heatResistance =
    (PHASE9_DBT_CONSTANTS.latentHeatSublimationJKg /
      (thermalConductivityWMK * tempK)) *
    ((PHASE9_DBT_CONSTANTS.latentHeatSublimationJKg *
      PHASE9_DBT_CONSTANTS.waterMolarMassKgMol) /
      (PHASE9_DBT_CONSTANTS.gasConstantJMolK * tempK) -
      1);
  return positive(1 / (vaporResistance + heatResistance), "bulk transfer coefficient");
}

export function phase9DbtContinuumTransferKgM1S1(
  condition: Phase9DbtCondition,
): number {
  validateCondition(condition);
  return transferFromResistances(
    condition.tempK,
    phase9DbtVaporDiffusivityM2S(condition.tempK, condition.pressurePa),
    phase9DbtThermalConductivityAirWMK(condition.tempK),
  );
}

export function phase9DbtNelsonBakerCriticalSupersaturationFraction(
  tempC: number,
): number {
  finite(tempC, "Celsius temperature");
  return positive(9.6066e-5 * Math.abs(tempC) ** 1.9171, "critical supersaturation");
}

function nelsonBakerCoefficientFromDrive(driveFraction: number, tempC: number): number {
  nonnegative(driveFraction, "Nelson-Baker drive");
  if (driveFraction === 0) return 0;
  const critical = phase9DbtNelsonBakerCriticalSupersaturationFraction(tempC);
  const ratio = driveFraction / critical;
  return ratio * Math.tanh(1 / ratio);
}

/**
 * Project ambient-excess hybrid drive. This is not a Nelson-Baker reproduction: it supplies
 * ambient chamber excess where the source theory uses local surface drive.
 */
export function phase9DbtProjectAmbientExcessHybridAttachmentCoefficient(
  excessIceSupersaturationFraction: number,
  tempC: number,
): number {
  return nelsonBakerCoefficientFromDrive(excessIceSupersaturationFraction, tempC);
}

/** Diagnostic of the released snapshot's S_i input seam; never the named comparator. */
export function phase9DbtReleasedSnapshotNelsonBakerDiagnostic(
  saturationRatioIce: number,
  tempC: number,
): number {
  positive(saturationRatioIce, "ice saturation ratio");
  return nelsonBakerCoefficientFromDrive(saturationRatioIce, tempC);
}

/**
 * Project ambient-excess transitional hybrid. It combines the source-lineage kinetic form with
 * ambient rather than local-surface excess, a thermal-jump correction the source says to ignore,
 * and each history's measured pressure rather than the released snapshot's fixed pressure.
 */
export function phase9DbtProjectAmbientExcessHybridTransferKgM1S1(
  massKg: number,
  condition: Phase9DbtCondition,
): number {
  positive(massKg, "crystal mass");
  validateCondition(condition);
  const coefficient = phase9DbtProjectAmbientExcessHybridAttachmentCoefficient(
    condition.excessIceSupersaturationFraction,
    condition.tempK - PHASE9_DBT_CONSTANTS.celsiusZeroK,
  );
  if (coefficient === 0) return 0;

  const radiusM = phase9DbtEquivalentSphereRadiusUm(massKg) * 1e-6;
  const vaporDiffusivity = phase9DbtVaporDiffusivityM2S(
    condition.tempK,
    condition.pressurePa,
  );
  const waterMolecularSpeed = Math.sqrt(
    (8 * PHASE9_DBT_CONSTANTS.waterVaporGasConstantJKgK * condition.tempK) / Math.PI,
  );
  const modifiedVaporDiffusivity =
    vaporDiffusivity /
    (radiusM / (radiusM + PHASE9_DBT_CONSTANTS.vaporJumpDistanceM) +
      (4 * vaporDiffusivity) / (radiusM * coefficient * waterMolecularSpeed));

  const thermalConductivity = phase9DbtThermalConductivityAirWMK(condition.tempK);
  const airDensity =
    condition.pressurePa /
    (PHASE9_DBT_CONSTANTS.dryAirGasConstantJKgK * condition.tempK);
  const airMolecularSpeed = Math.sqrt(
    (8 * PHASE9_DBT_CONSTANTS.dryAirGasConstantJKgK * condition.tempK) / Math.PI,
  );
  const modifiedThermalConductivity =
    thermalConductivity /
    (radiusM / (radiusM + PHASE9_DBT_CONSTANTS.thermalJumpDistanceM) +
      (4 * thermalConductivity) /
        (radiusM *
          PHASE9_DBT_CONSTANTS.thermalAccommodationCoefficient *
          PHASE9_DBT_CONSTANTS.dryAirSpecificHeatJKgK *
          airDensity *
          airMolecularSpeed));

  return transferFromResistances(
    condition.tempK,
    modifiedVaporDiffusivity,
    modifiedThermalConductivity,
  );
}

export function phase9DbtLambTransferKgM1S1(
  massKg: number,
  continuumTransferKgM1S1: number,
): number {
  positive(massKg, "Lamb mass");
  positive(continuumTransferKgM1S1, "continuum transfer coefficient");
  const scaledMass = massKg * 1e12;
  const scaledContinuum = continuumTransferKgM1S1 * 1e9;
  return (
    1e-9 *
    (scaledContinuum ** PHASE9_DBT_CONSTANTS.lambExponent /
      (1 / PHASE9_DBT_CONSTANTS.lambDenominatorScale +
        PHASE9_DBT_CONSTANTS.lambMassScaleCoefficient / scaledMass) +
      PHASE9_DBT_CONSTANTS.lambAdditiveScaled)
  );
}

export function phase9DbtTransferKgM1S1(
  massKg: number,
  condition: Phase9DbtCondition,
  model: Phase9DbtModel,
): number {
  positive(massKg, "crystal mass");
  validateCondition(condition);
  validateModel(model);
  if (model.kind === "project-ambient-excess-hybrid") {
    return phase9DbtProjectAmbientExcessHybridTransferKgM1S1(massKg, condition);
  }
  const continuum = phase9DbtContinuumTransferKgM1S1(condition);
  if (model.kind === "continuum") return continuum;
  if (model.kind === "continuum-rescale") return model.multiplier * continuum;
  return phase9DbtLambTransferKgM1S1(massKg, continuum);
}

export function phase9DbtMassDerivativeKgS(
  massKg: number,
  condition: Phase9DbtCondition,
  model: Phase9DbtModel,
): number {
  positive(massKg, "crystal mass");
  validateCondition(condition);
  validateModel(model);
  if (condition.excessIceSupersaturationFraction === 0) return 0;
  const radiusM = phase9DbtEquivalentSphereRadiusUm(massKg) * 1e-6;
  return (
    4 *
    Math.PI *
    radiusM *
    condition.excessIceSupersaturationFraction *
    phase9DbtTransferKgM1S1(massKg, condition, model)
  );
}

export function phase9DbtIntegerSecondGrid(lastObservationTimeS: number): readonly number[] {
  nonnegative(lastObservationTimeS, "last observation time");
  const finalSecond = Math.min(499, Math.floor(lastObservationTimeS));
  return Array.from({ length: finalSecond + 1 }, (_unused, second) => second);
}

function validateIntegerSecondGrid(timesS: readonly number[]): void {
  if (timesS.length === 0 || timesS[0] !== 0) {
    throw new Error("D-BT integer-second grid must begin at zero");
  }
  for (let index = 0; index < timesS.length; index++) {
    const time = finite(timesS[index], `grid time ${index}`);
    if (!Number.isSafeInteger(time) || time !== index || time > 499) {
      throw new Error("D-BT integer-second grid must be consecutive 0..499 at most");
    }
  }
}

function rk4Step(
  massKg: number,
  condition: Phase9DbtCondition,
  model: Phase9DbtModel,
): number {
  const k1 = phase9DbtMassDerivativeKgS(massKg, condition, model);
  const k2 = phase9DbtMassDerivativeKgS(massKg + k1 / 2, condition, model);
  const k3 = phase9DbtMassDerivativeKgS(massKg + k2 / 2, condition, model);
  const k4 = phase9DbtMassDerivativeKgS(massKg + k3, condition, model);
  const next = massKg + (k1 + 2 * k2 + 2 * k3 + k4) / 6;
  return positive(next, "integrated crystal mass");
}

export function phase9DbtIntegrateMassRatios(
  condition: Phase9DbtCondition,
  model: Phase9DbtModel,
  timesS: readonly number[],
): readonly number[] {
  validateCondition(condition);
  validateModel(model);
  validateIntegerSecondGrid(timesS);
  const initialMassKg = phase9DbtSphereMassKg(condition.initialRadiusUm);
  const ratios = [1];
  let massKg = initialMassKg;
  for (let index = 1; index < timesS.length; index++) {
    massKg = rk4Step(massKg, condition, model);
    ratios.push(massKg / initialMassKg);
  }
  return ratios;
}

function coalesceRows(
  rows: readonly Phase9DbtSourceRow[],
): {
  readonly rows: readonly Phase9DbtSourceRow[];
  readonly duplicateRowCount: number;
  readonly timeZeroAnchorInserted: boolean;
} {
  if (rows.length === 0) throw new Error("D-BT source history must not be empty");
  const output: Phase9DbtSourceRow[] = [];
  let duplicateRowCount = 0;
  for (let start = 0; start < rows.length; ) {
    const timeS = nonnegative(rows[start].timeS, `source time ${start}`);
    if (start > 0 && timeS < rows[start - 1].timeS) {
      throw new Error("D-BT source times must be nondecreasing");
    }
    let end = start + 1;
    while (end < rows.length && rows[end].timeS === timeS) end++;
    const values = rows.slice(start, end).map((row, offset) =>
      positive(row.massRatio, `source mass ratio ${start + offset}`),
    ).sort((left, right) => left - right);
    duplicateRowCount += values.length - 1;
    const middle = Math.floor(values.length / 2);
    const massRatio = values.length % 2 === 1
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2;
    output.push({ timeS, massRatio });
    start = end;
  }
  let timeZeroAnchorInserted = false;
  if (output[0].timeS > 0) {
    if (output[0].massRatio !== 1) {
      throw new Error("a source history starting after zero must begin at unit mass ratio");
    }
    output.unshift({ timeS: 0, massRatio: 1 });
    timeZeroAnchorInserted = true;
  }
  return { rows: output, duplicateRowCount, timeZeroAnchorInserted };
}

function interpolateRow(rows: readonly Phase9DbtSourceRow[], timeS: number): number {
  let low = 0;
  let high = rows.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (rows[middle].timeS < timeS) low = middle + 1;
    else if (rows[middle].timeS > timeS) high = middle - 1;
    else return rows[middle].massRatio;
  }
  if (low === 0 || low >= rows.length) {
    throw new Error(`integer-second target ${timeS} is outside the source history`);
  }
  const before = rows[low - 1];
  const after = rows[low];
  return before.massRatio +
    ((timeS - before.timeS) / (after.timeS - before.timeS)) *
      (after.massRatio - before.massRatio);
}

export function phase9DbtPrepareObservations(
  sourceRows: readonly Phase9DbtSourceRow[],
): Phase9DbtPreparedObservations {
  const coalesced = coalesceRows(sourceRows);
  const timesS = phase9DbtIntegerSecondGrid(coalesced.rows.at(-1)?.timeS as number);
  return {
    timesS,
    massRatios: timesS.map((timeS) => interpolateRow(coalesced.rows, timeS)),
    duplicateRowCount: coalesced.duplicateRowCount,
    timeZeroAnchorInserted: coalesced.timeZeroAnchorInserted,
  };
}

function residualSign(value: number): Phase9DbtResidualSign {
  if (value < 0) return "negative";
  if (value > 0) return "positive";
  return "zero";
}

function pairedResiduals(
  observed: readonly number[],
  predicted: readonly number[],
): readonly number[] {
  if (observed.length === 0 || observed.length !== predicted.length) {
    throw new Error("observed and predicted histories must have the same nonzero length");
  }
  return observed.map((value, index) => {
    positive(value, `observed mass ratio ${index}`);
    positive(predicted[index], `predicted mass ratio ${index}`);
    return predicted[index] - value;
  });
}

export function phase9DbtSummarizeResiduals(
  observed: readonly number[],
  predicted: readonly number[],
): Phase9DbtResidualSummary {
  const residuals = pairedResiduals(observed, predicted);
  const meanSignedResidual = residuals.reduce((sum, value) => sum + value, 0) / residuals.length;
  const endResidual = residuals.at(-1) as number;
  const counts = { negative: 0, zero: 0, positive: 0 };
  for (const residual of residuals) counts[residualSign(residual)]++;
  return {
    sampleCount: residuals.length,
    mse: residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length,
    meanSignedResidual,
    meanResidualSign: residualSign(meanSignedResidual),
    endResidual,
    endResidualSign: residualSign(endResidual),
    residualSignCounts: counts,
  };
}

export function phase9DbtFivePercentSensitivity(
  observed: readonly number[],
  predicted: readonly number[],
): Phase9DbtFivePercentSensitivity {
  pairedResiduals(observed, predicted);
  let centralSquares = 0;
  let lowerSquares = 0;
  let upperSquares = 0;
  let outsideBandSquares = 0;
  const positions = { below: 0, inside: 0, above: 0 };
  for (let index = 0; index < observed.length; index++) {
    const lower = 0.95 * observed[index];
    const upper = 1.05 * observed[index];
    const prediction = predicted[index];
    centralSquares += (prediction - observed[index]) ** 2;
    lowerSquares += (prediction - lower) ** 2;
    upperSquares += (prediction - upper) ** 2;
    if (prediction < lower) {
      positions.below++;
      outsideBandSquares += (prediction - lower) ** 2;
    } else if (prediction > upper) {
      positions.above++;
      outsideBandSquares += (prediction - upper) ** 2;
    } else {
      positions.inside++;
    }
  }
  return {
    maximumRelativeErrorFraction: 0.05,
    centralMse: centralSquares / observed.length,
    coherentLowerObservationMse: lowerSquares / observed.length,
    coherentUpperObservationMse: upperSquares / observed.length,
    outsideBandMse: outsideBandSquares / observed.length,
    predictionPositions: positions,
  };
}

export function phase9DbtEqualHistoryMse(
  summaries: readonly Pick<Phase9DbtResidualSummary, "mse">[],
): number {
  if (summaries.length === 0) throw new Error("equal-history loss needs at least one history");
  return summaries.reduce((sum, summary, index) =>
    sum + nonnegative(summary.mse, `history MSE ${index}`), 0) / summaries.length;
}

export function phase9DbtDecideComparator(
  inputs: Phase9DbtDecisionInputs,
): Phase9DbtDecision {
  const count = inputs.historyIds.length;
  if (
    count !== 6 ||
    inputs.lambMse.length !== count ||
    inputs.leaveOneHistoryOutRescaleMse.length !== count
  ) {
    throw new Error("D-BT decision requires the same exact six histories for both comparators");
  }
  if (new Set(inputs.historyIds).size !== count || inputs.historyIds.some((id) => id.length === 0)) {
    throw new Error("D-BT decision history IDs must be nonempty and unique");
  }
  const lambMse = inputs.lambMse.map((value, index) =>
    nonnegative(value, `Lamb history MSE ${index}`),
  );
  const rescaleMse = inputs.leaveOneHistoryOutRescaleMse.map((value, index) =>
    nonnegative(value, `leave-one-history-out rescale MSE ${index}`),
  );
  const lambFamilyMse = lambMse.reduce((sum, value) => sum + value, 0) / count;
  const leaveOneHistoryOutRescaleFamilyMse =
    rescaleMse.reduce((sum, value) => sum + value, 0) / count;
  let strictPerHistoryWins = 0;
  let perHistoryTies = 0;
  const perHistory = inputs.historyIds.map((historyId, index) => {
    const comparison = lambMse[index] < rescaleMse[index]
      ? "lamb-lower" as const
      : lambMse[index] === rescaleMse[index]
        ? "tie" as const
        : "lamb-not-lower" as const;
    return { historyId, comparison, lambStrictWin: comparison === "lamb-lower" };
  });
  for (let index = 0; index < count; index++) {
    if (lambMse[index] < rescaleMse[index]) strictPerHistoryWins++;
    else if (lambMse[index] === rescaleMse[index]) perHistoryTies++;
  }
  const familyComparison = lambFamilyMse < leaveOneHistoryOutRescaleFamilyMse
    ? "lamb-lower"
    : lambFamilyMse === leaveOneHistoryOutRescaleFamilyMse
      ? "tie"
      : "lamb-not-lower";
  return {
    survives: familyComparison === "lamb-lower" && strictPerHistoryWins >= 4,
    lambFamilyMse,
    leaveOneHistoryOutRescaleFamilyMse,
    strictPerHistoryWins,
    perHistoryTies,
    perHistory,
    requiredStrictPerHistoryWins: 4,
    familyComparison,
  };
}

export function phase9DbtDecisionEnvelope(
  centralInputs: Phase9DbtDecisionInputs,
  sensitivityComparisons: readonly Phase9DbtSensitivityComparison[],
): Phase9DbtDecisionEnvelope {
  const requiredNames: readonly Phase9DbtSensitivityName[] = [
    "initial-radius-lower-heldout-only",
    "initial-radius-upper-heldout-only",
    "mass-ratio-minus-five-percent-heldout-only",
    "mass-ratio-plus-five-percent-heldout-only",
  ];
  const central = phase9DbtDecideComparator(centralInputs);
  if (sensitivityComparisons.length !== requiredNames.length * centralInputs.historyIds.length) {
    throw new Error("D-BT requires four heldout-only cases for each of the six histories");
  }
  const centralById = new Map(central.perHistory.map((entry) => [entry.historyId, entry]));
  const heldoutOnlySensitivities: Phase9DbtSensitivityDiagnostic[] = [];
  for (const name of requiredNames) {
    const named = sensitivityComparisons.filter((entry) => entry.name === name);
    if (
      named.length !== centralInputs.historyIds.length ||
      named.some((entry, index) => entry.historyId !== centralInputs.historyIds[index])
    ) {
      throw new Error(`D-BT sensitivity ${name} must cover the ordered central roster once`);
    }
    for (const entry of named) {
      const centralHistory = centralById.get(entry.historyId);
      if (centralHistory === undefined) {
        throw new Error(`${name} contains a history outside the central roster`);
      }
      const sensitivityLambStrictWin =
        nonnegative(entry.lambMse, `${name} Lamb MSE`) <
        nonnegative(entry.leaveOneHistoryOutRescaleMse, `${name} rescale MSE`);
      heldoutOnlySensitivities.push({
        name,
        historyId: entry.historyId,
        centralLambStrictWin: centralHistory.lambStrictWin,
        sensitivityLambStrictWin,
        winFlipped: sensitivityLambStrictWin !== centralHistory.lambStrictWin,
      });
    }
  }
  const anyHistoryWinFlip = heldoutOnlySensitivities.some((entry) => entry.winFlipped);
  const label = anyHistoryWinFlip
    ? "sensitivity-dependent-promotion-unavailable"
    : !central.survives
      ? "central-no-effect-or-failure"
      : "central-survives-promotion-unavailable";
  return {
    central,
    heldoutOnlySensitivities,
    anyHistoryWinFlip,
    temperatureOneFactorAvailable: false,
    supersaturationOneFactorAvailable: false,
    promotionAvailable: false,
    label,
  };
}

export function phase9DbtInitialRadiusCases(
  initialRadiusUm: number,
  initialRadiusRangeUm: number,
): readonly {
  readonly case: "lower" | "central" | "upper";
  readonly initialRadiusUm: number;
}[] {
  positive(initialRadiusUm, "initial radius");
  nonnegative(initialRadiusRangeUm, "initial-radius marginal range");
  if (!(initialRadiusUm - initialRadiusRangeUm > 0)) {
    throw new Error("lower initial-radius sensitivity case must remain positive");
  }
  return [
    { case: "lower", initialRadiusUm: initialRadiusUm - initialRadiusRangeUm },
    { case: "central", initialRadiusUm },
    { case: "upper", initialRadiusUm: initialRadiusUm + initialRadiusRangeUm },
  ];
}

export function phase9DbtIntegrateInitialRadiusCases(
  condition: Phase9DbtCondition,
  initialRadiusRangeUm: number,
  model: Phase9DbtModel,
  timesS: readonly number[],
): readonly {
  readonly case: "lower" | "central" | "upper";
  readonly initialRadiusUm: number;
  readonly massRatios: readonly number[];
}[] {
  validateCondition(condition);
  return phase9DbtInitialRadiusCases(condition.initialRadiusUm, initialRadiusRangeUm).map(
    (radiusCase) => ({
      ...radiusCase,
      massRatios: phase9DbtIntegrateMassRatios(
        { ...condition, initialRadiusUm: radiusCase.initialRadiusUm },
        model,
        timesS,
      ),
    }),
  );
}

function validateHistories(histories: readonly Phase9DbtHistory[]): void {
  if (histories.length === 0) throw new Error("D-BT fit requires histories");
  const ids = new Set<string>();
  for (const history of histories) {
    if (history.id.length === 0 || ids.has(history.id)) {
      throw new Error("D-BT history IDs must be nonempty and unique");
    }
    ids.add(history.id);
    validateCondition(history.condition);
    validateIntegerSecondGrid(history.timesS);
    pairedResiduals(history.observedMassRatios, history.observedMassRatios);
    if (history.timesS.length !== history.observedMassRatios.length) {
      throw new Error(`D-BT history ${history.id} grid and observation lengths differ`);
    }
  }
}

function rescaleObjective(
  histories: readonly Phase9DbtHistory[],
  multiplier: number,
): number {
  const summaries = histories.map((history) => phase9DbtSummarizeResiduals(
    history.observedMassRatios,
    phase9DbtIntegrateMassRatios(
      history.condition,
      { kind: "continuum-rescale", multiplier },
      history.timesS,
    ),
  ));
  return phase9DbtEqualHistoryMse(summaries);
}

function chooseBetter(
  left: { readonly multiplier: number; readonly objective: number },
  right: { readonly multiplier: number; readonly objective: number },
): { readonly multiplier: number; readonly objective: number } {
  if (right.objective < left.objective) return right;
  if (right.objective === left.objective && right.multiplier < left.multiplier) return right;
  return left;
}

export function phase9DbtFitContinuumRescale(
  histories: readonly Phase9DbtHistory[],
): Phase9DbtRescaleFit {
  validateHistories(histories);
  const { minimum, maximum, coarseIntervals, goldenIterations } = PHASE9_DBT_RESCALE_SEARCH;
  const step = (maximum - minimum) / coarseIntervals;
  let best: { multiplier: number; objective: number } = {
    multiplier: minimum,
    objective: rescaleObjective(histories, minimum),
  };
  let bestIndex = 0;
  for (let index = 1; index <= coarseIntervals; index++) {
    const candidate = {
      multiplier: minimum + index * step,
      objective: rescaleObjective(histories, minimum + index * step),
    };
    const chosen = chooseBetter(best, candidate);
    if (chosen === candidate) bestIndex = index;
    best = chosen;
  }

  let left = minimum + Math.max(0, bestIndex - 1) * step;
  let right = minimum + Math.min(coarseIntervals, bestIndex + 1) * step;
  const inverseGolden = (Math.sqrt(5) - 1) / 2;
  let innerLeft = right - inverseGolden * (right - left);
  let innerRight = left + inverseGolden * (right - left);
  let leftValue = rescaleObjective(histories, innerLeft);
  let rightValue = rescaleObjective(histories, innerRight);
  for (let iteration = 0; iteration < goldenIterations; iteration++) {
    if (leftValue <= rightValue) {
      right = innerRight;
      innerRight = innerLeft;
      rightValue = leftValue;
      innerLeft = right - inverseGolden * (right - left);
      leftValue = rescaleObjective(histories, innerLeft);
    } else {
      left = innerLeft;
      innerLeft = innerRight;
      leftValue = rightValue;
      innerRight = left + inverseGolden * (right - left);
      rightValue = rescaleObjective(histories, innerRight);
    }
  }
  for (const multiplier of [left, innerLeft, innerRight, right, (left + right) / 2]) {
    best = chooseBetter(best, {
      multiplier,
      objective: rescaleObjective(histories, multiplier),
    });
  }
  const boundary = best.multiplier === minimum
    ? "minimum"
    : best.multiplier === maximum
      ? "maximum"
      : "interior";
  return {
    multiplier: best.multiplier,
    equalHistoryMse: best.objective,
    boundary,
    trainingHistoryIds: histories.map((history) => history.id),
  };
}

export function phase9DbtFitPrimaryLeaveOneHistoryOut(
  histories: readonly Phase9DbtHistory[],
): readonly Phase9DbtLeaveOneHistoryOutFold[] {
  if (histories.length !== 6) {
    throw new Error("the frozen D-BT primary leave-one-history-out roster has exactly six histories");
  }
  validateHistories(histories);
  return histories.map((heldOut) => ({
    heldOutHistoryId: heldOut.id,
    ...phase9DbtFitContinuumRescale(histories.filter((history) => history.id !== heldOut.id)),
  }));
}
