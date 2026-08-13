import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_DBT_CLAIM_BOUNDARY,
  PHASE9_DBT_CONSTANTS,
  PHASE9_DBT_LINEAGE_STATUS,
  PHASE9_DBT_RESCALE_SEARCH,
  phase9DbtContinuumTransferKgM1S1,
  phase9DbtDecideComparator,
  phase9DbtDecisionEnvelope,
  phase9DbtEqualHistoryMse,
  phase9DbtEquivalentSphereRadiusUm,
  phase9DbtFitContinuumRescale,
  phase9DbtFitPrimaryLeaveOneHistoryOut,
  phase9DbtFivePercentSensitivity,
  phase9DbtInitialRadiusCases,
  phase9DbtIntegerSecondGrid,
  phase9DbtIntegrateInitialRadiusCases,
  phase9DbtIntegrateMassRatios,
  phase9DbtLambTransferKgM1S1,
  phase9DbtMassDerivativeKgS,
  phase9DbtProjectAmbientExcessHybridAttachmentCoefficient,
  phase9DbtNelsonBakerCriticalSupersaturationFraction,
  phase9DbtProjectAmbientExcessHybridTransferKgM1S1,
  phase9DbtPrepareObservations,
  phase9DbtReleasedSnapshotNelsonBakerDiagnostic,
  phase9DbtSaturationVaporPressureIcePa,
  phase9DbtSphereMassKg,
  phase9DbtSummarizeResiduals,
  phase9DbtThermalConductivityAirWMK,
  phase9DbtTransferKgM1S1,
  phase9DbtVaporDiffusivityM2S,
  type Phase9DbtCondition,
  type Phase9DbtHistory,
  type Phase9DbtModel,
} from "../src/phase9-dbt-model.ts";

const CONDITION: Phase9DbtCondition = {
  tempK: 239.35,
  pressurePa: 97_055,
  excessIceSupersaturationFraction: 0.17,
  initialRadiusUm: 8.9,
};

interface FrozenProtocol {
  readonly schema: string;
  readonly adoptionCommit: string;
  readonly state: {
    readonly protocol: string;
    readonly modelScoreInspected: boolean;
    readonly launch: {
      readonly status: string;
      readonly scoreMayRun: boolean;
      readonly remainingBlockers: readonly string[];
    };
    readonly grantsValidationClaim: boolean;
  };
  readonly lineage: { readonly status: string };
  readonly upstreamBindings: {
    readonly sourceOverlay: {
      readonly identity: {
        readonly path: string;
        readonly byteLength: number;
        readonly sha256: string;
      };
      readonly shelfFreezeSchema: string;
      readonly requiredSourceBlocked: boolean;
      readonly restrictionDischarges: Readonly<Record<string, {
        readonly id: string;
        readonly status: string;
        readonly localDischarge: string;
      }>>;
    };
    readonly measurementAdapters: {
      readonly identity: { readonly byteLength: number; readonly sha256: string };
      readonly requiredMappings: readonly unknown[];
    };
  };
  readonly primaryRoster: readonly {
    readonly runId: string;
    readonly rowArtifact: {
      readonly sha256: string;
      readonly lastTimeS: number;
    };
    readonly scoreGrid: {
      readonly firstSecond: number;
      readonly lastSecond: number;
      readonly sampleCount: number;
    };
  }[];
  readonly modelOperator: {
    readonly comparators: readonly {
      readonly id: string;
      readonly projectDeviations?: readonly string[];
    }[];
  };
  readonly score: {
    readonly family: string;
    readonly primaryDecision: { readonly expectedEffect: string };
  };
  readonly sensitivity: {
    readonly promotionAvailability: {
      readonly temperatureOneFactorAvailable: boolean;
      readonly supersaturationOneFactorAvailable: boolean;
      readonly promotionAvailable: boolean;
    };
  };
}

function frozenProtocol(): FrozenProtocol {
  return JSON.parse(
    readFileSync(resolve("research/phase9-dbt-protocol-v1.json"), "utf8"),
  ) as FrozenProtocol;
}

function independentContinuum(condition: Phase9DbtCondition): number {
  const vaporPressure = Math.exp(
    9.550426 -
    5723.265 / condition.tempK +
    3.53068 * Math.log(condition.tempK) -
    0.00728332 * condition.tempK,
  );
  const diffusivity =
    2.11e-5 * (condition.tempK / 273.15) ** 1.94 * (101_325 / condition.pressurePa);
  const conductivity =
    (5.69 + 0.017 * (condition.tempK - 273.15)) * 1e-3 * 4.187;
  return independentTransfer(condition.tempK, vaporPressure, diffusivity, conductivity);
}

function independentTransfer(
  tempK: number,
  vaporPressurePa: number,
  diffusivityM2S: number,
  conductivityWMK: number,
): number {
  const vaporResistance =
    (8.3144521 * tempK) /
    (vaporPressurePa * diffusivityM2S * 18e-3);
  const heatResistance =
    (2.837e6 / (conductivityWMK * tempK)) *
    ((2.837e6 * 18e-3) / (8.3144521 * tempK) - 1);
  return 1 / (vaporResistance + heatResistance);
}

function independentNelsonBaker(
  massKg: number,
  condition: Phase9DbtCondition,
): number {
  const tempC = condition.tempK - 273.15;
  const critical = 9.6066e-5 * Math.abs(tempC) ** 1.9171;
  const drive = condition.excessIceSupersaturationFraction;
  const attachmentCoefficient = (drive / critical) * Math.tanh(critical / drive);
  const radiusM = ((3 * massKg) / (4 * Math.PI * 910)) ** (1 / 3);
  const vaporPressure = Math.exp(
    9.550426 -
    5723.265 / condition.tempK +
    3.53068 * Math.log(condition.tempK) -
    0.00728332 * condition.tempK,
  );
  const diffusivity =
    2.11e-5 * (condition.tempK / 273.15) ** 1.94 * (101_325 / condition.pressurePa);
  const modifiedDiffusivity = diffusivity /
    (radiusM / (radiusM + 1.3 * 8e-8) +
      (diffusivity / (radiusM * attachmentCoefficient)) *
        Math.sqrt((2 * Math.PI) / (461.51 * condition.tempK)));
  const conductivity =
    (5.69 + 0.017 * (condition.tempK - 273.15)) * 1e-3 * 4.187;
  const airDensity = condition.pressurePa / (287.05 * condition.tempK);
  const modifiedConductivity = conductivity /
    (radiusM / (radiusM + 2.16e-7) +
      (conductivity / (radiusM * 1 * 1_005 * airDensity)) *
        Math.sqrt((2 * Math.PI) / (287.05 * condition.tempK)));
  return independentTransfer(
    condition.tempK,
    vaporPressure,
    modifiedDiffusivity,
    modifiedConductivity,
  );
}

function syntheticHistories(multiplier = 0.7): Phase9DbtHistory[] {
  return Array.from({ length: 6 }, (_unused, index) => {
    const condition = {
      tempK: 232 + index,
      pressurePa: 96_900 + index * 37,
      excessIceSupersaturationFraction: 0.08 + index * 0.01,
      initialRadiusUm: 7.5 + index * 0.4,
    };
    const timesS = phase9DbtIntegerSecondGrid(8 + index);
    return {
      id: `synthetic-${index}`,
      condition,
      timesS,
      observedMassRatios: phase9DbtIntegrateMassRatios(
        condition,
        { kind: "continuum-rescale", multiplier },
        timesS,
      ),
    };
  });
}

describe("Phase 9 D-BT source formulas", () => {
  it("binds the frozen pre-score protocol and exact six-history grids", () => {
    const protocol = frozenProtocol();
    expect(protocol.schema).toBe("phase9-dbt-protocol-v1");
    expect(protocol.adoptionCommit).toBe("f936920");
    expect(protocol.state).toMatchObject({
      protocol: "frozen-before-model-output",
      modelScoreInspected: false,
      grantsValidationClaim: false,
    });
    expect(protocol.state.launch).toMatchObject({ status: "blocked", scoreMayRun: false });
    expect(protocol.state.launch.remainingBlockers.join(" ")).toContain("source-data publisher");
    expect(protocol.lineage.status).toBe(PHASE9_DBT_LINEAGE_STATUS);
    expect(protocol.upstreamBindings.sourceOverlay.shelfFreezeSchema).toBe(
      "phase9-source-shelf-freeze-v1",
    );
    expect(protocol.upstreamBindings.sourceOverlay.identity).toEqual({
      path: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
      byteLength: 63_975,
      sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06",
    });
    expect(protocol.upstreamBindings.sourceOverlay.requiredSourceBlocked).toBe(false);
    const discharges = protocol.upstreamBindings.sourceOverlay.restrictionDischarges;
    expect(Object.keys(discharges)).toHaveLength(9);
    for (const [key, discharge] of Object.entries(discharges)) {
      expect(discharge.id).toBe(key);
      expect(discharge.status).toBe("discharged");
      expect(discharge.localDischarge.length).toBeGreaterThan(0);
    }
    expect(protocol.upstreamBindings.measurementAdapters.identity).toEqual({
      path: "research/phase9-adapter-registry-v1.jsonl",
      byteLength: 48_946,
      sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337",
    });
    expect(protocol.upstreamBindings.measurementAdapters.requiredMappings).toHaveLength(6);
    expect(protocol.primaryRoster.map((entry) => entry.runId)).toEqual([
      "725c",
      "725e",
      "805a",
      "805b",
      "805h",
      "805l",
    ]);
    expect(protocol.primaryRoster.map((entry) => entry.rowArtifact.sha256)).toEqual([
      "9c6f7dfb34ac493871aa2c943f3530bdaab1dbc8d069360f68bf754af086c35d",
      "6d5088fcd69d75c2a4107a0aa49fb109ee205ea28c306dedaff64c7527b62f8e",
      "b839a5301c7059784f05ded5443ee2a813cf1af9884841bc52cfa3c85c72dcea",
      "dc2d020d3fcae39d5568e11ac40c998e6bb8cffc9dd31306b3d86d0797c414d6",
      "c587bfe396ac374093cb332581d0fa9c67b9db5d8e698679b61b1221ea24cb17",
      "f4cdaf3a956869e8b862fe94b7646e96b98bd0f06b5ba2845dae7f5367efcffd",
    ]);
    for (const entry of protocol.primaryRoster) {
      const expectedGrid = phase9DbtIntegerSecondGrid(entry.rowArtifact.lastTimeS);
      expect(entry.scoreGrid).toEqual({
        firstSecond: 0,
        lastSecond: expectedGrid.at(-1),
        sampleCount: expectedGrid.length,
      });
      expect(entry.scoreGrid.lastSecond).toBeLessThan(500);
    }
    expect(protocol.modelOperator.comparators.map((entry) => entry.id)).toEqual([
      "continuum",
      "project-ambient-excess-hybrid",
      "lamb",
      "leave-one-history-out-continuum-rescale",
    ]);
    expect(protocol.modelOperator.comparators[1].projectDeviations).toEqual([
      expect.stringContaining("ambient chamber excess"),
      expect.stringContaining("thermal-jump correction"),
      expect.stringContaining("measured pressure"),
    ]);
    expect(protocol.score.family).toContain("mean of the six per-history MSE");
    expect(protocol.score.primaryDecision.expectedEffect).toContain("strictly lower");
    expect(protocol.sensitivity.promotionAvailability).toEqual({
      temperatureOneFactorAvailable: false,
      supersaturationOneFactorAvailable: false,
      promotionAvailable: false,
      upgradeRule: expect.any(String),
    });
  });

  it("pins the development-only claim and lineage boundaries", () => {
    expect(PHASE9_DBT_LINEAGE_STATUS).toBe("code-indicated-nonoverlap-not-definitive");
    expect(PHASE9_DBT_CLAIM_BOUNDARY).toEqual({
      developmentEvidenceOnly: true,
      grantsValidationClaim: false,
      predictsFacetOrHabit: false,
      transfersUnqualifiedToFreeParticles: false,
    });
  });

  it("round-trips the released 910 kg/m3 spherical mass convention", () => {
    const massKg = phase9DbtSphereMassKg(9.34240961638);
    expect(phase9DbtEquivalentSphereRadiusUm(massKg)).toBeCloseTo(9.34240961638, 12);
    expect(massKg).toBeCloseTo(3.10818397095e-12, 22);
  });

  it("independently recomputes the continuum vapor-plus-heat resistance", () => {
    const expected = independentContinuum(CONDITION);
    expect(phase9DbtContinuumTransferKgM1S1(CONDITION)).toBeCloseTo(expected, 15);
    expect(phase9DbtSaturationVaporPressureIcePa(CONDITION.tempK)).toBeGreaterThan(0);
    expect(phase9DbtVaporDiffusivityM2S(CONDITION.tempK, CONDITION.pressurePa)).toBeGreaterThan(0);
    expect(phase9DbtThermalConductivityAirWMK(CONDITION.tempK)).toBeGreaterThan(0);
  });

  it("uses measured pressure rather than the released snapshot's fixed pressure", () => {
    const lowerPressure = phase9DbtContinuumTransferKgM1S1({
      ...CONDITION,
      pressurePa: 90_000,
    });
    const higherPressure = phase9DbtContinuumTransferKgM1S1({
      ...CONDITION,
      pressurePa: 105_000,
    });
    expect(lowerPressure).toBeGreaterThan(higherPressure);
  });

  it("keeps the printed Nelson-Baker drive distinct from the released snapshot seam", () => {
    const tempC = CONDITION.tempK - 273.15;
    const critical = 9.6066e-5 * Math.abs(tempC) ** 1.9171;
    expect(phase9DbtNelsonBakerCriticalSupersaturationFraction(tempC)).toBeCloseTo(
      critical,
      15,
    );
    const intended =
      (CONDITION.excessIceSupersaturationFraction / critical) *
      Math.tanh(critical / CONDITION.excessIceSupersaturationFraction);
    expect(
      phase9DbtProjectAmbientExcessHybridAttachmentCoefficient(
        CONDITION.excessIceSupersaturationFraction,
        tempC,
      ),
    ).toBeCloseTo(intended, 15);
    const snapshot = phase9DbtReleasedSnapshotNelsonBakerDiagnostic(
      1 + CONDITION.excessIceSupersaturationFraction,
      tempC,
    );
    expect(snapshot).toBeGreaterThan(intended);
    expect(snapshot).toBeLessThanOrEqual(1);
  });

  it("applies the transitional Nelson-Baker resistance to both vapor and heat", () => {
    const massKg = phase9DbtSphereMassKg(CONDITION.initialRadiusUm);
    const transfer = phase9DbtProjectAmbientExcessHybridTransferKgM1S1(massKg, CONDITION);
    expect(transfer).toBeCloseTo(independentNelsonBaker(massKg, CONDITION), 15);
    expect(transfer).toBeLessThan(phase9DbtContinuumTransferKgM1S1(CONDITION));
  });

  it("replays the released scaled Lamb equation and exposes both asymptotic seams", () => {
    const continuum = phase9DbtContinuumTransferKgM1S1(CONDITION);
    const massKg = phase9DbtSphereMassKg(CONDITION.initialRadiusUm);
    const expected =
      1e-9 *
      ((continuum * 1e9) ** 1.3153063 /
        (1 / 1.1682062 + 2.6606467 / (massKg * 1e12)) +
        0.1123054);
    expect(phase9DbtLambTransferKgM1S1(massKg, continuum)).toBeCloseTo(expected, 15);

    const tinyMass = phase9DbtLambTransferKgM1S1(1e-30, continuum);
    expect(tinyMass).toBeCloseTo(0.1123054e-9, 19);
    const largeMass = phase9DbtLambTransferKgM1S1(1e20, continuum);
    expect(largeMass).not.toBeCloseTo(continuum, 14);
  });

  it("dispatches all four comparators without changing their units", () => {
    const massKg = phase9DbtSphereMassKg(CONDITION.initialRadiusUm);
    const continuum = phase9DbtTransferKgM1S1(massKg, CONDITION, { kind: "continuum" });
    expect(
      phase9DbtTransferKgM1S1(massKg, CONDITION, {
        kind: "continuum-rescale",
        multiplier: 0.5,
      }),
    ).toBeCloseTo(0.5 * continuum, 18);
    expect(phase9DbtTransferKgM1S1(massKg, CONDITION, {
      kind: "project-ambient-excess-hybrid",
    })).toBeGreaterThan(0);
    expect(phase9DbtTransferKgM1S1(massKg, CONDITION, { kind: "lamb" })).toBeGreaterThan(0);
  });
});

describe("Phase 9 D-BT grid, interpolation, and integration", () => {
  it("freezes t < 500 as integer seconds 0 through 499", () => {
    const long = phase9DbtIntegerSecondGrid(1_200);
    expect(long).toHaveLength(500);
    expect(long[0]).toBe(0);
    expect(long.at(-1)).toBe(499);

    const short = phase9DbtIntegerSecondGrid(449.5908);
    expect(short).toHaveLength(450);
    expect(short.at(-1)).toBe(449);
  });

  it("coalesces duplicates by median, inserts only the definitional zero anchor, and preserves decreases", () => {
    const prepared = phase9DbtPrepareObservations([
      { timeS: 0.2, massRatio: 1 },
      { timeS: 1, massRatio: 1.2 },
      { timeS: 1, massRatio: 0.8 },
      { timeS: 2, massRatio: 0.7 },
      { timeS: 3.4, massRatio: 1.4 },
    ]);
    expect(prepared.duplicateRowCount).toBe(1);
    expect(prepared.timeZeroAnchorInserted).toBe(true);
    expect(prepared.timesS).toEqual([0, 1, 2, 3]);
    expect(prepared.massRatios[0]).toBe(1);
    expect(prepared.massRatios[1]).toBe(1);
    expect(prepared.massRatios[2]).toBe(0.7);
    expect(prepared.massRatios[3]).toBeCloseTo(1.2, 15);
  });

  it("uses the exact source value when an integer second has duplicates", () => {
    const prepared = phase9DbtPrepareObservations([
      { timeS: 0, massRatio: 1 },
      { timeS: 1, massRatio: 7 },
      { timeS: 1, massRatio: 3 },
      { timeS: 1, massRatio: 5 },
      { timeS: 2, massRatio: 9 },
      { timeS: 2, massRatio: 1 },
    ]);
    expect(prepared.massRatios).toEqual([1, 5, 5]);
    expect(prepared.duplicateRowCount).toBe(3);
  });

  it("integrates continuum at fixed one-second RK4 steps against its analytic solution", () => {
    const timesS = phase9DbtIntegerSecondGrid(20);
    const actual = phase9DbtIntegrateMassRatios(CONDITION, { kind: "continuum" }, timesS);
    const initialMass = phase9DbtSphereMassKg(CONDITION.initialRadiusUm);
    const geometry = (3 / (4 * Math.PI * PHASE9_DBT_CONSTANTS.rhoIceKgM3)) ** (1 / 3);
    const rate =
      4 *
      Math.PI *
      geometry *
      CONDITION.excessIceSupersaturationFraction *
      independentContinuum(CONDITION);
    const expectedMass =
      (initialMass ** (2 / 3) + (2 / 3) * rate * 20) ** (3 / 2);
    expect(actual.at(-1)).toBeCloseTo(expectedMass / initialMass, 9);
  });

  it("keeps zero-drive histories stationary in every comparator", () => {
    const zeroDrive = { ...CONDITION, excessIceSupersaturationFraction: 0 };
    const timesS = phase9DbtIntegerSecondGrid(4);
    for (const model of [
      { kind: "continuum" },
      { kind: "project-ambient-excess-hybrid" },
      { kind: "lamb" },
      { kind: "continuum-rescale", multiplier: 1.7 },
    ] as const) {
      expect(phase9DbtIntegrateMassRatios(zeroDrive, model, timesS)).toEqual([1, 1, 1, 1, 1]);
    }
  });

  it("runs lower, central, and upper initial-radius cases separately", () => {
    expect(phase9DbtInitialRadiusCases(8.9, 0.2)).toEqual([
      { case: "lower", initialRadiusUm: 8.700000000000001 },
      { case: "central", initialRadiusUm: 8.9 },
      { case: "upper", initialRadiusUm: 9.1 },
    ]);
    const cases = phase9DbtIntegrateInitialRadiusCases(
      CONDITION,
      0.2,
      { kind: "lamb" },
      phase9DbtIntegerSecondGrid(3),
    );
    expect(cases.map((value) => value.case)).toEqual(["lower", "central", "upper"]);
    expect(cases.every((value) => value.massRatios.length === 4)).toBe(true);
  });
});

describe("Phase 9 D-BT loss and leave-one-history-out rival", () => {
  const decisionInputs = (
    lambMse: readonly number[],
    leaveOneHistoryOutRescaleMse: readonly number[],
  ) => ({
    historyIds: ["a", "b", "c", "d", "e", "f"],
    lambMse,
    leaveOneHistoryOutRescaleMse,
  });

  it("reports per-history residual direction, sign counts, and endpoint", () => {
    expect(phase9DbtSummarizeResiduals([1, 2, 3], [1, 1.5, 4])).toEqual({
      sampleCount: 3,
      mse: 1.25 / 3,
      meanSignedResidual: 1 / 6,
      meanResidualSign: "positive",
      endResidual: 1,
      endResidualSign: "positive",
      residualSignCounts: { negative: 1, zero: 1, positive: 1 },
    });
  });

  it("keeps the source-stated five-percent maximum error nonprobabilistic", () => {
    const result = phase9DbtFivePercentSensitivity([1, 2, 3], [0.9, 2.05, 3.3]);
    expect(result.maximumRelativeErrorFraction).toBe(0.05);
    expect(result.predictionPositions).toEqual({ below: 1, inside: 1, above: 1 });
    expect(result.centralMse).toBeCloseTo((0.1 ** 2 + 0.05 ** 2 + 0.3 ** 2) / 3, 15);
    expect(result.outsideBandMse).toBeCloseTo((0.05 ** 2 + 0 + 0.15 ** 2) / 3, 15);
  });

  it("averages history MSEs rather than pooling their point counts", () => {
    const equalHistory = phase9DbtEqualHistoryMse([{ mse: 0 }, { mse: 4 }]);
    const pooledPointLoss = (1 * 0 + 100 * 4) / 101;
    expect(equalHistory).toBe(2);
    expect(equalHistory).not.toBe(pooledPointLoss);
  });

  it("uses the exact strict family and four-of-six decision with ties failing", () => {
    const survives = phase9DbtDecideComparator(decisionInputs(
      [1, 1, 1, 1, 3, 3],
      [2, 2, 2, 2, 2, 2],
    ));
    expect(survives).toMatchObject({
      survives: true,
      strictPerHistoryWins: 4,
      perHistoryTies: 0,
      familyComparison: "lamb-lower",
    });

    const familyTie = phase9DbtDecideComparator(decisionInputs(
      [1, 1, 1, 1, 4, 4],
      [2, 2, 2, 2, 2, 2],
    ));
    expect(familyTie.familyComparison).toBe("tie");
    expect(familyTie.survives).toBe(false);

    const perHistoryTie = phase9DbtDecideComparator(decisionInputs(
      [1, 1, 1, 2, 3, 3],
      [2, 2, 2, 2, 2, 2],
    ));
    expect(perHistoryTie.perHistoryTies).toBe(1);
    expect(perHistoryTie.strictPerHistoryWins).toBe(3);
    expect(perHistoryTie.survives).toBe(false);
  });

  it("treats sensitivities as heldout-only win-flip diagnostics with promotion unavailable", () => {
    const central = decisionInputs([1, 1, 1, 1, 3, 3], [2, 2, 2, 2, 2, 2]);
    const names = [
      "initial-radius-lower-heldout-only",
      "initial-radius-upper-heldout-only",
      "mass-ratio-minus-five-percent-heldout-only",
      "mass-ratio-plus-five-percent-heldout-only",
    ] as const;
    const comparisons = names.flatMap((name) => central.historyIds.map((historyId, index) => ({
      name,
      historyId,
      lambMse: name === "initial-radius-lower-heldout-only" && index === 0 ? 3 : central.lambMse[index],
      leaveOneHistoryOutRescaleMse: central.leaveOneHistoryOutRescaleMse[index],
    })));
    const envelope = phase9DbtDecisionEnvelope(central, comparisons);
    expect(envelope.central.survives).toBe(true);
    expect(envelope.anyHistoryWinFlip).toBe(true);
    expect(envelope.heldoutOnlySensitivities).toHaveLength(24);
    expect(envelope.promotionAvailable).toBe(false);
    expect(envelope.temperatureOneFactorAvailable).toBe(false);
    expect(envelope.supersaturationOneFactorAvailable).toBe(false);
    expect(envelope.label).toBe("sensitivity-dependent-promotion-unavailable");
  });

  it("recovers a synthetic global continuum multiplier inside the frozen search", () => {
    expect(PHASE9_DBT_RESCALE_SEARCH).toEqual({
      minimum: 0,
      maximum: 2,
      coarseIntervals: 256,
      goldenIterations: 80,
    });
    const fit = phase9DbtFitContinuumRescale(syntheticHistories(0.7));
    expect(fit.multiplier).toBeCloseTo(0.7, 10);
    expect(fit.equalHistoryMse).toBeLessThan(1e-24);
    expect(fit.boundary).toBe("interior");
  });

  it("fits each fold on the other five histories only", () => {
    const baseline = syntheticHistories(0.7);
    const first = phase9DbtFitPrimaryLeaveOneHistoryOut(baseline);
    const changed = baseline.map((history, index) => index === 0
      ? {
          ...history,
          observedMassRatios: phase9DbtIntegrateMassRatios(
            history.condition,
            { kind: "continuum-rescale", multiplier: 1.6 },
            history.timesS,
          ),
        }
      : history);
    const second = phase9DbtFitPrimaryLeaveOneHistoryOut(changed);
    expect(first).toHaveLength(6);
    expect(first[0].heldOutHistoryId).toBe("synthetic-0");
    expect(second[0].multiplier).toBe(first[0].multiplier);
    expect(second[0].equalHistoryMse).toBe(first[0].equalHistoryMse);
    expect(second[0].trainingHistoryIds).not.toContain("synthetic-0");
    expect(second[1].multiplier).not.toBe(first[1].multiplier);
  });

  it("records an exact lower-bound fit instead of hiding it", () => {
    const histories = syntheticHistories(0).slice(0, 2);
    const fit = phase9DbtFitContinuumRescale(histories);
    expect(fit.multiplier).toBe(0);
    expect(fit.boundary).toBe("minimum");
  });
});

describe("Phase 9 D-BT fail-closed inputs", () => {
  it("rejects malformed conditions, models, masses, and grids", () => {
    expect(() => phase9DbtContinuumTransferKgM1S1({ ...CONDITION, pressurePa: 0 })).toThrow(/pressure/);
    expect(() => phase9DbtSphereMassKg(0)).toThrow(/radius/);
    expect(() => phase9DbtLambTransferKgM1S1(0, 1e-10)).toThrow(/mass/);
    expect(() => phase9DbtMassDerivativeKgS(1e-12, CONDITION, {
      kind: "unknown",
    } as unknown as Phase9DbtModel)).toThrow(/not recognized/);
    expect(() => phase9DbtIntegrateMassRatios(CONDITION, { kind: "continuum" }, [0, 2])).toThrow(
      /consecutive/,
    );
    expect(() => phase9DbtIntegerSecondGrid(-1)).toThrow(/nonnegative/);
    expect(() => phase9DbtContinuumTransferKgM1S1({ ...CONDITION, tempK: 204.999 })).toThrow(
      /205 <= T <= 240/,
    );
    expect(() => phase9DbtContinuumTransferKgM1S1({ ...CONDITION, tempK: 240.001 })).toThrow(
      /205 <= T <= 240/,
    );
    expect(() => phase9DbtIntegrateMassRatios(
      CONDITION,
      { kind: "continuum-rescale", multiplier: 2.000_001 },
      [0],
    )).toThrow(/within \[0, 2\]/);
    expect(() => phase9DbtIntegrateMassRatios(CONDITION, { kind: "continuum" }, [0, 1, 500]))
      .toThrow(/0\.\.499/);
  });

  it("rejects invalid source histories rather than extrapolating", () => {
    expect(() => phase9DbtPrepareObservations([])).toThrow(/must not be empty/);
    expect(() => phase9DbtPrepareObservations([
      { timeS: 1, massRatio: 1.1 },
      { timeS: 2, massRatio: 1.2 },
    ])).toThrow(/must begin at unit mass ratio/);
    expect(() => phase9DbtPrepareObservations([
      { timeS: 0, massRatio: 1 },
      { timeS: 2, massRatio: 1.2 },
      { timeS: 1, massRatio: 1.1 },
    ])).toThrow(/nondecreasing/);
    expect(() => phase9DbtPrepareObservations([
      { timeS: 0, massRatio: 1 },
      { timeS: 1, massRatio: Number.NaN },
    ])).toThrow(/finite/);
  });

  it("rejects mismatched residuals and invalid marginal-radius cases", () => {
    expect(() => phase9DbtSummarizeResiduals([1], [1, 2])).toThrow(/same nonzero length/);
    expect(() => phase9DbtFivePercentSensitivity([], [])).toThrow(/same nonzero length/);
    expect(() => phase9DbtEqualHistoryMse([])).toThrow(/at least one history/);
    expect(() => phase9DbtInitialRadiusCases(0.2, 0.2)).toThrow(/remain positive/);
  });

  it("rejects a shifted or duplicate fitting roster", () => {
    const histories = syntheticHistories();
    expect(() => phase9DbtFitPrimaryLeaveOneHistoryOut(histories.slice(0, 5))).toThrow(
      /exactly six/,
    );
    expect(() => phase9DbtFitContinuumRescale([
      histories[0],
      { ...histories[1], id: histories[0].id },
    ])).toThrow(/unique/);
    expect(() => phase9DbtFitContinuumRescale([
      { ...histories[0], timesS: [0, 2] },
    ])).toThrow(/consecutive/);
  });
});
