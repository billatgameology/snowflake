#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseNasAssetCatalogV1 } from "./nas-asset-lib.ts";
import { detectNasMount } from "./nas-root.ts";
import { loadPhase9KnowledgeSources } from "./phase9-knowledge-source-lib.ts";

const ROOT = resolve(import.meta.dirname, "..");
const mountedShare = detectNasMount();
if (mountedShare === null) {
  throw new Error("the marked project NAS share is detached");
}
const CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(resolve(ROOT, "docs/nas-assets.json"), "utf8"),
);
const KNOWLEDGE_SOURCES = loadPhase9KnowledgeSources({
  catalogue: CATALOGUE,
  repoRoot: ROOT,
  shareRoot: mountedShare,
});

const K_BOLTZMANN = 1.380649e-23;
const CELSIUS_ZERO_K = 273.15;
const P_ATM = 101325;
const WATER_MOLECULE_MASS = 3.0e-26;
const D_AIR_1ATM = 2.0e-5;
const GIBBS_THOMSON_LENGTH_M = 1.0e-9;

// Lamb et al.'s released code uses these values. They intentionally differ slightly from
// the project's metrological/source table and are kept separate for exact model replay.
const LAMB = Object.freeze({
  rhoIceKgM3: 910,
  gasConstant: 8.3144521,
  waterMolarMassKgMol: 18e-3,
  latentHeatSublimationJKg: 2.837e6,
  joulesPerCalorie: 4.187,
  exponent: 1.3153063,
  massScaleCoefficient: 2.6606467,
  denominatorScale: 1.1682062,
  additiveScaled: 0.1123054,
  releasedArchivePressurePa: 97190,
});

function parseArgs(argv) {
  const args = { out: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      args.out = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argv[index]}`);
    }
  }
  return args;
}

function round(value, digits = 12) {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(digits));
}

function saturationVaporPressureIcePa(tempK) {
  return Math.exp(9.550426 - 5723.265 / tempK + 3.53068 * Math.log(tempK) - 0.00728332 * tempK);
}

function lambContinuumTransfer(tempK, pressurePa) {
  const vaporDiffusivity = 2.11e-5 * (tempK / CELSIUS_ZERO_K) ** 1.94 * (P_ATM / pressurePa);
  const thermalConductivity =
    (5.69 + 0.017 * (tempK - CELSIUS_ZERO_K)) * 1e-3 * LAMB.joulesPerCalorie;
  const vaporResistance =
    (LAMB.gasConstant * tempK) /
    (saturationVaporPressureIcePa(tempK) * vaporDiffusivity * LAMB.waterMolarMassKgMol);
  const heatResistance =
    (LAMB.latentHeatSublimationJKg / (thermalConductivity * tempK)) *
    ((LAMB.latentHeatSublimationJKg * LAMB.waterMolarMassKgMol) /
      (LAMB.gasConstant * tempK) -
      1);
  return 1 / (vaporResistance + heatResistance);
}

function lambTransferScaled(massKg, continuumTransfer) {
  assert.ok(Number.isFinite(massKg) && massKg > 0, "Lamb mass must be finite and positive");
  assert.ok(
    Number.isFinite(continuumTransfer) && continuumTransfer > 0,
    "Lamb continuum transfer must be finite and positive",
  );
  const massScaled = massKg * 1e12;
  const continuumScaled = continuumTransfer * 1e9;
  return (
    1e-9 *
    (continuumScaled ** LAMB.exponent /
      (1 / LAMB.denominatorScale + LAMB.massScaleCoefficient / massScaled) +
      LAMB.additiveScaled)
  );
}

function lambTransferExpandedExact(massKg, continuumTransfer) {
  const numeratorCoefficient = 10 ** (9 * (LAMB.exponent - 1));
  return (
    (numeratorCoefficient * continuumTransfer ** LAMB.exponent) /
      (1 / LAMB.denominatorScale + (LAMB.massScaleCoefficient * 1e-12) / massKg) +
    LAMB.additiveScaled * 1e-9
  );
}

function lambTransferPrintedRounded(massKg, continuumTransfer) {
  return (
    (688.267 * continuumTransfer ** 1.3153) /
      (0.85601 + 2.6606e-12 / massKg) +
    1.123e-10
  );
}

function relativeError(actual, expected) {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function sphereMassKg(radiusUm, densityKgM3 = LAMB.rhoIceKgM3) {
  const radiusM = radiusUm * 1e-6;
  return (4 / 3) * Math.PI * densityKgM3 * radiusM ** 3;
}

function equivalentSphereRadiusUm(massKg, densityKgM3 = LAMB.rhoIceKgM3) {
  return ((3 * massKg) / (4 * Math.PI * densityKgM3)) ** (1 / 3) * 1e6;
}

function projectKineticLengthM(tempK, pressurePa) {
  const molecularSpeed = Math.sqrt(K_BOLTZMANN * tempK / (2 * Math.PI * WATER_MOLECULE_MASS));
  const diffusivity = D_AIR_1ATM * (P_ATM / pressurePa);
  return diffusivity / molecularSpeed;
}

function m1BarrierPercent(tempC, facet, withDip) {
  const t = Math.abs(tempC);
  const isBasal = facet === "basal";
  const broad = isBasal ? 0.02 * t ** 1.75 + 0.3 : 0.015 * t ** 2 + 0.02 * t ** 0.6;
  if (!withDip) return broad;
  const center = isBasal ? 4.5 : 14.4;
  const depth = isBasal ? 0.87 : 0.95;
  const width = isBasal ? 0.07 : 0.06;
  const dip = 1 - depth * Math.exp(-((Math.log10(t) - Math.log10(center)) ** 2) / width);
  return broad * dip;
}

function attachmentCoefficient(barrierPercent, surfaceSupersaturationPercent) {
  return Math.exp(-barrierPercent / surfaceSupersaturationPercent);
}

function parseDimensionHistory(source) {
  return source.data.toString("utf8")
    .split(/\r?\n/u)
    .filter((line) => /^\d/u.test(line.trim()))
    .map((line) => {
      const values = line.trim().split(/\s+/u).map(Number);
      return {
        timeS: values[0],
        aUm: values[1],
        cUm: values[2],
        rimWidthUm: values[7],
      };
    });
}

function describeHistory(source, eventTimeS = null) {
  const rows = parseDimensionHistory(source);
  const first = rows[0];
  const last = rows.at(-1);
  const result = {
    path: source.recordedPath,
    sha256: source.sha256,
    rowCount: rows.length,
    first,
    last,
    endpointChange: {
      aFactor: round(last.aUm / first.aUm),
      cFactor: round(last.cUm / first.cUm),
      rimFactor: round(last.rimWidthUm / first.rimWidthUm),
      rimToAInitial: round(first.rimWidthUm / first.aUm),
      rimToAFinal: round(last.rimWidthUm / last.aUm),
    },
  };
  if (eventTimeS !== null) {
    const before = rows.filter((row) => row.timeS < eventTimeS).at(-1);
    const after = rows.find((row) => row.timeS > eventTimeS);
    const after2 = rows.find((row) => row.timeS > after.timeS);
    result.event = {
      eventTimeS,
      observationAtEvent: rows.some((row) => row.timeS === eventTimeS),
      before,
      firstAfter: after,
      secondAfter: after2,
      rimChangeFirstAfterFraction: round((after.rimWidthUm - before.rimWidthUm) / before.rimWidthUm),
      rimChangeSecondAfterFraction: round((after2.rimWidthUm - before.rimWidthUm) / before.rimWidthUm),
    };
  }
  return result;
}

function readNativeMassRecords() {
  const path = resolve(ROOT, "evidence/phase8b-native-histories-v1/records.jsonl");
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse)
    .filter((record) => record.id?.startsWith("P8B-NATIVE-MASS-"));
}

function makeLambConditionRows() {
  return readNativeMassRecords().map((record) => {
    const condition = record.conditions;
    const tempK = condition.tempC + CELSIUS_ZERO_K;
    const massKg = sphereMassKg(condition.initialRadiusUm);
    const continuumTransfer = lambContinuumTransfer(tempK, condition.pressurePa);
    const learnedTransfer = lambTransferScaled(massKg, continuumTransfer);
    const releasedArchiveContinuumTransfer = lambContinuumTransfer(
      tempK,
      LAMB.releasedArchivePressurePa,
    );
    const releasedArchiveTransfer = lambTransferScaled(massKg, releasedArchiveContinuumTransfer);
    const largeMassLimit = lambTransferExpandedExact(Number.MAX_VALUE, continuumTransfer);
    const kineticLengthM = projectKineticLengthM(tempK, condition.pressurePa);
    return {
      recordId: record.id,
      tempC: condition.tempC,
      tempK: round(tempK),
      temperatureInPaperTrainingDomain: tempK >= 205 && tempK <= 240,
      pressurePa: condition.pressurePa,
      sigmaIcePercent: condition.sigmaIcePercent,
      initialRadiusUm: condition.initialRadiusUm,
      initialRadiusRangeUm: condition.initialRadiusRangeUm,
      paperConventionInitialMassKg: round(massKg),
      continuumTransferKgM1S1: round(continuumTransfer),
      lambTransferKgM1S1: round(learnedTransfer),
      lambToContinuumRatio: round(learnedTransfer / continuumTransfer),
      lambLargeMassLimitToContinuumRatio: round(largeMassLimit / continuumTransfer),
      releasedArchivePressurePa: LAMB.releasedArchivePressurePa,
      releasedArchivePressureLambToMeasuredPressureRatio: round(
        releasedArchiveTransfer / learnedTransfer,
      ),
      projectKineticLengthUm: round(kineticLengthM * 1e6),
      projectX0OverInitialRadius: round(kineticLengthM / (condition.initialRadiusUm * 1e-6)),
      sphericalGibbsThomsonEquilibriumShiftFraction: round(
        (2 * GIBBS_THOMSON_LENGTH_M) / (condition.initialRadiusUm * 1e-6),
      ),
    };
  });
}

function makeLambReplayChecks() {
  const rows = readNativeMassRecords().map((record) => {
    const tempK = record.conditions.tempC + CELSIUS_ZERO_K;
    const massKg = sphereMassKg(record.conditions.initialRadiusUm);
    const continuumTransfer = lambContinuumTransfer(tempK, record.conditions.pressurePa);
    const scaled = lambTransferScaled(massKg, continuumTransfer);
    const expandedExact = lambTransferExpandedExact(massKg, continuumTransfer);
    const printedRounded = lambTransferPrintedRounded(massKg, continuumTransfer);
    return {
      recordId: record.id,
      exactRelativeError: relativeError(expandedExact, scaled),
      printedRoundedRelativeError: relativeError(printedRounded, scaled),
    };
  });
  const maxExactRelativeError = Math.max(...rows.map((row) => row.exactRelativeError));
  const maxPrintedRoundedRelativeError = Math.max(
    ...rows.map((row) => row.printedRoundedRelativeError),
  );
  assert.ok(
    maxExactRelativeError < 5e-15,
    `expanded Lamb equation disagrees with released-code scaling: ${maxExactRelativeError}`,
  );
  assert.ok(
    maxPrintedRoundedRelativeError < 2e-4,
    `printed rounded Lamb equation differs unexpectedly: ${maxPrintedRoundedRelativeError}`,
  );
  const crossoverMassKg = LAMB.massScaleCoefficient * LAMB.denominatorScale * 1e-12;
  const crossoverConstantTerm = 1 / LAMB.denominatorScale;
  const crossoverMassTerm = (LAMB.massScaleCoefficient * 1e-12) / crossoverMassKg;
  const crossoverRelativeError = relativeError(crossoverMassTerm, crossoverConstantTerm);
  assert.ok(crossoverRelativeError < 5e-15, "Lamb crossover denominator terms do not match");
  return {
    phase8ConditionCount: rows.length,
    maxExactRelativeError: round(maxExactRelativeError),
    maxPrintedRoundedRelativeError: round(maxPrintedRoundedRelativeError),
    crossoverDenominatorTermsRelativeError: round(crossoverRelativeError),
    assertionLimits: {
      exactRelativeErrorLessThan: 5e-15,
      printedRoundedRelativeErrorLessThan: 2e-4,
    },
  };
}

function makeFacetSensitivityRows() {
  const temperaturesC = [-7, -15, -30];
  const surfaceSupersaturationPercent = [0.5, 1, 3, 6];
  return temperaturesC.flatMap((tempC) =>
    ["basal", "prism"].flatMap((facet) => {
      const m1Barrier = m1BarrierPercent(tempC, facet, true);
      const broadBarrier = m1BarrierPercent(tempC, facet, false);
      return surfaceSupersaturationPercent.map((sigmaSurfacePercent) => {
        const m1 = attachmentCoefficient(m1Barrier, sigmaSurfacePercent);
        const broad = attachmentCoefficient(broadBarrier, sigmaSurfacePercent);
        return {
          tempC,
          facet,
          sigmaSurfacePercent,
          m1BarrierPercent: round(m1Barrier),
          broadBranchBarrierPercent: round(broadBarrier),
          m1AttachmentCoefficient: round(m1),
          broadBranchAttachmentCoefficient: round(broad),
          m1ToBroadRatio: round(m1 / broad),
        };
      });
    }),
  );
}

function makeOutput() {
  const crossoverMassKg = LAMB.massScaleCoefficient * LAMB.denominatorScale * 1e-12;
  const lambRows = makeLambConditionRows();
  return {
    schema: "phase9-knowledge-calculations-v1",
    generatedDate: "2026-08-12",
    claimBoundary: {
      projectDerived: true,
      scoresModelAgainstMeasurements: false,
      authorizesPhase9Execution: false,
      grantsValidationClaim: false,
    },
    lambMassConditionedTransfer: {
      status:
        "project application of the paper equation at each measured Phase 8 pressure, transcribed from the commented released-code formula",
      sourceLocator: "Lamb et al. 2025 PDF p. 7 Eq. 6 and p. 19 Table S2 equation 8",
      releasedCodeLocator:
        "IceNODE Gfunctions.py commented lines 8-10 and evaluate.py mass/G scaling; the archive is not runnable end-to-end",
      coefficientUnitWarning:
        "The printed paper omits coefficient units. The numeric coefficients are valid only with mass in kg and both G and Gc in kg m^-1 s^-1; G/Gc is dimensionless. The scaled released-code form is the safest replay.",
      crossoverMassKg: round(crossoverMassKg),
      crossoverEquivalentSphereRadiusUmAt910KgM3: round(equivalentSphereRadiusUm(crossoverMassKg)),
      zeroMassLimitKgM1S1: LAMB.additiveScaled * 1e-9,
      largeMassLimit:
        "G -> 688.267 * Gc^1.3153 / 0.85601 + 1.123e-10, not Gc; the symbolic law does not enforce its stated continuum asymptote.",
      phase8InitialConditions: lambRows,
      proposedScoringDomain: {
        status: "pre-adoption recommendation; no score executed",
        paperTrainingTemperatureK: [205, 240],
        primaryElapsedTimeS: [0, 500],
        primaryPhase8RecordIds: lambRows
          .filter((row) => row.temperatureInPaperTrainingDomain)
          .map((row) => row.recordId),
        extrapolationRule:
          "All hotter Phase 8 conditions and all observations after 500 s are reported separately as extrapolation.",
        constantRescaleRule:
          "For each primary-history fold, estimate one global Gc multiplier from the other primary histories and evaluate only on the held-out history.",
      },
      initialRatioRange: {
        minimum: round(Math.min(...lambRows.map((row) => row.lambToContinuumRatio))),
        maximum: round(Math.max(...lambRows.map((row) => row.lambToContinuumRatio))),
      },
      releasedArchivePressureComparison: {
        archivePressurePa: LAMB.releasedArchivePressurePa,
        interpretation:
          "The public archive hard-codes this pressure. Phase 8 rows above instead use their measured record pressure; this field quantifies the resulting change rather than calling the rows exact condition replay.",
        maximumAbsoluteFractionalTransferDifference: round(
          Math.max(
            ...lambRows.map((row) =>
              Math.abs(row.releasedArchivePressureLambToMeasuredPressureRatio - 1),
            ),
          ),
        ),
      },
      strongestSameConditionContrast: {
        recordA: "P8B-NATIVE-MASS-731A",
        recordB: "P8B-NATIVE-MASS-731B",
        sharedCondition: "-31.7 C, 97055 Pa, source ice supersaturation 7.5 percent",
        predictedInitialRatios: lambRows
          .filter((row) => ["P8B-NATIVE-MASS-731A", "P8B-NATIVE-MASS-731B"].includes(row.recordId))
          .map(({ recordId, initialRadiusUm, lambToContinuumRatio }) => ({
            recordId,
            initialRadiusUm,
            lambToContinuumRatio,
          })),
      },
    },
    facetKineticsSensitivity: {
      status: "project calculation from printed M1 and broad-branch functions",
      sourceLocator: "Libbrecht 2023 arXiv:2306.13087v1 p. 6 Eq. 6 and p. 7 broad branch",
      interpretation:
        "These are idealized sigmaSurface diagnostics at the exact Phase 8 facet-test temperatures. The Phase 8 x coordinates are far-field/source supersaturations and must not be substituted for sigmaSurface without a transport adapter.",
      rows: makeFacetSensitivityRows(),
    },
    transportAndCurvatureRegimes: {
      sourceLocator:
        "docs/libbrecht-parameters.md: kinetic length X0; FACET Eq. 7 uses sigmaSurface - d_sv*kappa with kappa=2/R for a sphere",
      phase8InitialRows: lambRows.map(
        ({
          recordId,
          initialRadiusUm,
          projectKineticLengthUm,
          projectX0OverInitialRadius,
          sphericalGibbsThomsonEquilibriumShiftFraction,
        }) => ({
          recordId,
          initialRadiusUm,
          projectKineticLengthUm,
          projectX0OverInitialRadius,
          sphericalGibbsThomsonEquilibriumShiftFraction,
        }),
      ),
      interpretation:
        "The curvature term is small for the 5.8-12 um equivalent spheres but can become material at submicron tips. X0/R alone does not select the regime; it must be compared with the local facet attachment coefficient.",
    },
    widthConditionedBarrier: {
      sourceLocator: "Libbrecht monograph printed p. 157 / PDF p. 158",
      equation: "sigma0(w)/sigma0Infinity = 1 - exp(-w/w0)",
      status: "source-printed hypothesis with unfrozen adjustable w0",
      normalizedRows: [0.1, 0.5, 1, 2, 5].map((widthOverW0) => ({
        widthOverW0,
        barrierFractionOfBroadFacet: round(1 - Math.exp(-widthOverW0)),
      })),
      limitation:
        "No numerical w0 or lattice-to-physical facet-width mapping is established, so this is a shape-of-hypothesis calculation, not an executable Phase 9 arm.",
    },
    latentHeatingAnchors: {
      sourceLocator: "Libbrecht monograph printed p. 98 / PDF p. 99",
      status: "source-stated approximate anchors; no interpolated curve",
      rows: [
        { tempC: -1, chi0: 0.8 },
        { tempC: -10, chi0: 0.4 },
      ].map((row) => ({
        ...row,
        diffusionLimitedGrowthMultiplier: round(1 / (1 + row.chi0)),
        overestimateFractionIfIgnored: row.chi0,
      })),
    },
    stepSourceObservedGeometry: {
      status: "project-derived endpoint/event diagnostics; not a mechanism fit",
      sourceLocator: "Harrington-Pokrifka companion archive native dimension histories",
      histories: [
        describeHistory(KNOWLEDGE_SOURCES.dimensions20231128),
        describeHistory(KNOWLEDGE_SOURCES.dimensions20240814, 13800),
      ],
      interpretation:
        "The histories make rim width a scoreable state. They do not distinguish SDAK from source-location/flux-gradient hollowing without a spatial growth-profile prediction.",
    },
    checks: {
      lambScaledAndPrintedAgreement: makeLambReplayChecks(),
      crossoverIdentity:
        "mStar = 2.6606467e-12 / 0.856013... kg = 2.6606467e-12 * 1.1682062 kg = a3/a2 in the printed form.",
      sourceArtifactsPresent: [
        KNOWLEDGE_SOURCES.lambPdf,
        KNOWLEDGE_SOURCES.iceNodeArchive,
        KNOWLEDGE_SOURCES.dimensions20231128,
        KNOWLEDGE_SOURCES.dimensions20240814,
      ].map((source) => ({
        path: source.recordedPath,
        sha256: source.sha256,
      })),
    },
  };
}

const args = parseArgs(process.argv.slice(2));
const output = `${JSON.stringify(makeOutput(), null, 2)}\n`;
if (args.out) {
  writeFileSync(resolve(ROOT, args.out), output);
} else {
  process.stdout.write(output);
}
