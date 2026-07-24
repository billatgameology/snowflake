// Phase 5 WP0 CPU-side binary32 shadow. This is not a GPU implementation and must never be
// presented as one. It supplies pre-WGSL error measurements from (a) an independent
// operation-rounded diffusion kernel, (b) binary32 storage at each public SurfaceOperator
// boundary, and (c) scalar attachment-kinetics sweeps. Frozen tolerances add explicit safety
// factors over these measurements before any production shader exists.

import { pathToFileURL } from "node:url";
import {
  GG_PRESETS,
  alphaHK,
  ggTimelineEnvironmentFromParams,
  nucleationABasal,
  nucleationAPrism,
  paramSlot,
  randomBit,
  sigma0Basal,
  sigma0Prism,
  STREAM_NOISE_XI,
  type FacetClass,
  type GGParams,
} from "@vcc/core";
import { GGSolver, LKSolver } from "@vcc/solver-cpu";
import {
  PHASE5_DECISION_MARGINS,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_SCALAR_TOLERANCES,
  type Phase5DiffusionFixture,
  type Phase5FieldTolerance,
  type Phase5GGFixture,
  type Phase5LKFixture,
} from "./phase5-protocol.ts";

export interface Phase5ArrayComparison {
  readonly maxAbs: number;
  readonly rms: number;
  readonly maxRelative: number;
  readonly relativeComparedCount: number;
  readonly length: number;
}

export function comparePhase5Arrays(
  reference: ArrayLike<number>,
  candidate: ArrayLike<number>,
  relativeDenominatorFloor: number,
): Phase5ArrayComparison {
  if (reference.length !== candidate.length) {
    throw new Error(`comparison length mismatch: ${reference.length} vs ${candidate.length}`);
  }
  if (!Number.isFinite(relativeDenominatorFloor) || relativeDenominatorFloor <= 0) {
    throw new Error("relativeDenominatorFloor must be finite and positive");
  }
  let maxAbs = 0;
  let squareSum = 0;
  let maxRelative = 0;
  let relativeComparedCount = 0;
  for (let index = 0; index < reference.length; index++) {
    const expected = reference[index];
    const actual = candidate[index];
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
      throw new Error(`comparison requires finite values at ${index}`);
    }
    const difference = Math.abs(actual - expected);
    if (difference > maxAbs) maxAbs = difference;
    squareSum += difference * difference;
    const denominator = Math.abs(expected);
    if (denominator >= relativeDenominatorFloor) {
      const relative = difference / denominator;
      if (relative > maxRelative) maxRelative = relative;
      relativeComparedCount++;
    }
  }
  return {
    maxAbs,
    rms: reference.length === 0 ? 0 : Math.sqrt(squareSum / reference.length),
    maxRelative,
    relativeComparedCount,
    length: reference.length,
  };
}

export function phase5ComparisonPasses(
  comparison: Phase5ArrayComparison,
  tolerance: Phase5FieldTolerance,
): boolean {
  return (
    comparison.maxAbs <= tolerance.maxAbs &&
    comparison.rms <= tolerance.rms &&
    comparison.maxRelative <= tolerance.maxRelative
  );
}

export function quantizeBinary32InPlace(values: Float64Array): void {
  for (let index = 0; index < values.length; index++) values[index] = Math.fround(values[index]);
}

function clonePresetWithPhi(preset: keyof typeof GG_PRESETS, phi: number): GGParams {
  const source = GG_PRESETS[preset];
  return {
    rho: source.rho,
    phi,
    kappa: new Float64Array(source.kappa),
    mu: new Float64Array(source.mu),
    ggThreshBeta: new Float64Array(source.ggThreshBeta),
  };
}

function sortedTriple(
  first: number,
  second: number,
  third: number,
): readonly [number, number, number] {
  if (first <= second) {
    if (second <= third) return [first, second, third];
    if (first <= third) return [first, third, second];
    return [third, first, second];
  }
  if (first <= third) return [second, first, third];
  if (second <= third) return [second, third, first];
  return [third, second, first];
}

/**
 * One WGSL-shaped binary32 G-G diffusion pass. Every arithmetic result that would inhabit a
 * WGSL f32 value is explicitly rounded with Math.fround. The kernel is intentionally
 * independent of GGSolver's mutable implementation.
 */
export function phase5Binary32DiffusionPass(
  solver: GGSolver,
  source: Float32Array,
): Float32Array {
  const { nx, ny, nz } = solver.dims;
  const plane = nx * ny;
  const length = plane * nz;
  if (source.length !== length) throw new Error("binary32 diffusion source length mismatch");
  const blocked = new Uint8Array(length);
  for (let index = 0; index < length; index++) {
    blocked[index] = solver.a[index] === 1 || solver.wall[index] === 1 ? 1 : 0;
  }
  const params = solver.params;
  const noised = new Float32Array(length);
  const refusal = new Float32Array(length);
  const epsilon = Math.fround(solver.noiseEpsilon);
  for (let index = 0; index < length; index++) {
    const xi = Math.fround(
      epsilon * randomBit(solver.rngSeed, index, solver.tick, STREAM_NOISE_XI),
    );
    refusal[index] = xi;
    noised[index] = Math.fround(Math.fround(1 - xi) * source[index]);
  }
  const input = solver.noiseEpsilon > 0 ? noised : source;
  const inPlane = new Float32Array(length);
  const vertical = new Float32Array(length);

  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let j = 0; j < ny; j++) {
      const row = kBase + j * nx;
      for (let i = 0; i < nx; i++) {
        const index = row + i;
        if (blocked[index] === 1) continue;
        const own = input[index];
        const east =
          i + 1 < nx && blocked[index + 1] === 0 ? input[index + 1] : own;
        const west =
          i - 1 >= 0 && blocked[index - 1] === 0 ? input[index - 1] : own;
        const northEast =
          j + 1 < ny && blocked[index + nx] === 0 ? input[index + nx] : own;
        const southWest =
          j - 1 >= 0 && blocked[index - nx] === 0 ? input[index - nx] : own;
        const southEast =
          i + 1 < nx &&
          j - 1 >= 0 &&
          blocked[index + 1 - nx] === 0
            ? input[index + 1 - nx]
            : own;
        const northWest =
          i - 1 >= 0 &&
          j + 1 < ny &&
          blocked[index - 1 + nx] === 0
            ? input[index - 1 + nx]
            : own;
        const pair1 = Math.fround(east + west);
        const pair2 = Math.fround(northEast + southWest);
        const pair3 = Math.fround(southEast + northWest);
        const [low, middle, high] = sortedTriple(pair1, pair2, pair3);
        const sum1 = Math.fround(own + low);
        const sum2 = Math.fround(sum1 + middle);
        const sum3 = Math.fround(sum2 + high);
        inPlane[index] = Math.fround(sum3 / Math.fround(7));
      }
    }
  }

  const weightCenter = Math.fround(4 / 7);
  const weightVertical = Math.fround(3 / 14);
  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let offset = 0; offset < plane; offset++) {
      const index = kBase + offset;
      if (blocked[index] === 1) continue;
      const own = inPlane[index];
      const up =
        k + 1 < nz && blocked[index + plane] === 0 ? inPlane[index + plane] : own;
      const down =
        k - 1 >= 0 && blocked[index - plane] === 0 ? inPlane[index - plane] : own;
      const verticalPair = Math.fround(up + down);
      const centerTerm = Math.fround(weightCenter * own);
      const verticalTerm = Math.fround(weightVertical * verticalPair);
      vertical[index] = Math.fround(centerTerm + verticalTerm);
    }
  }

  let result = vertical;
  if (params.phi > 0) {
    const drifted = new Float32Array(length);
    const phi = Math.fround(params.phi);
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      for (let offset = 0; offset < plane; offset++) {
        const index = kBase + offset;
        if (blocked[index] === 1) continue;
        const freeBelow = k - 1 >= 0 && blocked[index - plane] === 0 ? 1 : 0;
        const freeAbove = k + 1 < nz && blocked[index + plane] === 0 ? 1 : 0;
        const retained = Math.fround(
          Math.fround(1 - Math.fround(phi * freeBelow)) * vertical[index],
        );
        const inflow =
          freeAbove === 1 ? Math.fround(phi * vertical[index + plane]) : 0;
        drifted[index] = Math.fround(retained + inflow);
      }
    }
    result = drifted;
  }

  const output = new Float32Array(length);
  const rho = Math.fround(params.rho);
  for (let index = 0; index < length; index++) {
    if (blocked[index] === 1) continue;
    output[index] =
      solver.noiseEpsilon > 0
        ? Math.fround(result[index] + Math.fround(refusal[index] * source[index]))
        : result[index];
  }
  if (solver.farField === "dirichlet") {
    for (const index of solver.farFieldCells) {
      if (blocked[index] === 0) output[index] = rho;
    }
  }
  return output;
}

export interface Phase5DiffusionShadowResult {
  readonly fixtureId: string;
  readonly comparisons: Readonly<Record<string, Phase5ArrayComparison>>;
  readonly passesFrozenTolerance: boolean;
}

function runDiffusionFixture(
  fixture: Phase5DiffusionFixture,
): Phase5DiffusionShadowResult {
  const solver = new GGSolver({
    dims: fixture.dims,
    params: clonePresetWithPhi(fixture.preset, fixture.phi),
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    domain: fixture.domain,
    farField: fixture.farField,
    seedRadius: fixture.seedRadius,
    seedThickness: fixture.seedThickness,
  });
  let shadow: Float32Array<ArrayBufferLike> = Float32Array.from(solver.d, Math.fround);
  const comparisons: Record<string, Phase5ArrayComparison> = {};
  const finalPass = Math.max(...fixture.passes);
  for (let pass = 1; pass <= finalPass; pass++) {
    solver.relaxField();
    shadow = phase5Binary32DiffusionPass(solver, shadow);
    if (fixture.passes.includes(pass)) {
      comparisons[String(pass)] = comparePhase5Arrays(
        solver.d,
        shadow,
        PHASE5_FIELD_TOLERANCES.diffusionD.relativeDenominatorFloor,
      );
    }
  }
  return {
    fixtureId: fixture.id,
    comparisons,
    passesFrozenTolerance: Object.values(comparisons).every((comparison) =>
      phase5ComparisonPasses(comparison, PHASE5_FIELD_TOLERANCES.diffusionD),
    ),
  };
}

export interface Phase5GGShadowResult {
  readonly fixtureId: string;
  readonly boundaryMass: Phase5ArrayComparison;
  readonly vapor: Phase5ArrayComparison;
  readonly occupancyMismatchCount: number;
  readonly attachedCountReference: number;
  readonly attachedCountShadow: number;
  readonly minimumDecisionMargin: number;
  readonly passesDecisionMargin: boolean;
  readonly passesFrozenTolerance: boolean;
}

function ggMinimumDecisionMargin(solver: GGSolver): number {
  const params = solver.params;
  let minimum = Infinity;
  for (const index of solver.boundaryCells()) {
    const [rawNT, rawNZ] = solver.neighborCounts(index);
    if (rawNT >= 4 && rawNZ >= 1) continue;
    const slot = paramSlot(Math.min(rawNT, 3), rawNZ > 0 ? 1 : 0);
    const postFreezeBoundaryMass =
      solver.b[index] + (1 - params.kappa[slot]) * solver.d[index];
    minimum = Math.min(
      minimum,
      Math.abs(postFreezeBoundaryMass - params.ggThreshBeta[slot]),
    );
  }
  return minimum;
}

function runGGFixture(fixture: Phase5GGFixture): Phase5GGShadowResult {
  const options = {
    dims: fixture.dims,
    params: clonePresetWithPhi(fixture.preset, fixture.phi),
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    domain: fixture.domain,
    farField: fixture.farField,
    seedRadius: fixture.seedRadius,
    seedThickness: fixture.seedThickness,
  } as const;
  const reference = new GGSolver(options);
  const shadow = new GGSolver(options);
  const cycleCap = Number(fixture.stop.value);
  let minimumDecisionMargin = Infinity;
  for (let cycle = 0; cycle < cycleCap; cycle++) {
    if (fixture.timeline !== null && cycle === fixture.timeline.completedCycle) {
      const next = clonePresetWithPhi(fixture.timeline.nextPreset, fixture.phi);
      const environment = ggTimelineEnvironmentFromParams(next);
      reference.applyTimelineEnvironment(environment);
      shadow.applyTimelineEnvironment(environment);
    }
    reference.relaxField();
    shadow.relaxField();
    quantizeBinary32InPlace(shadow.d);
    shadow.dirichletMeter = Math.fround(shadow.dirichletMeter);
    minimumDecisionMargin = Math.min(
      minimumDecisionMargin,
      ggMinimumDecisionMargin(reference),
    );
    reference.advanceSurface();
    shadow.advanceSurface();
    quantizeBinary32InPlace(shadow.b);
    quantizeBinary32InPlace(shadow.d);
  }
  let occupancyMismatchCount = 0;
  for (let index = 0; index < reference.a.length; index++) {
    if (reference.a[index] !== shadow.a[index]) occupancyMismatchCount++;
  }
  const boundaryMass = comparePhase5Arrays(
    reference.b,
    shadow.b,
    PHASE5_FIELD_TOLERANCES.ggBoundaryMass.relativeDenominatorFloor,
  );
  const vapor = comparePhase5Arrays(
    reference.d,
    shadow.d,
    PHASE5_FIELD_TOLERANCES.ggVapor.relativeDenominatorFloor,
  );
  return {
    fixtureId: fixture.id,
    boundaryMass,
    vapor,
    occupancyMismatchCount,
    attachedCountReference: reference.attachedCount,
    attachedCountShadow: shadow.attachedCount,
    minimumDecisionMargin,
    passesDecisionMargin:
      minimumDecisionMargin >= PHASE5_DECISION_MARGINS.ggBoundaryMass,
    passesFrozenTolerance:
      occupancyMismatchCount === 0 &&
      minimumDecisionMargin >= PHASE5_DECISION_MARGINS.ggBoundaryMass &&
      phase5ComparisonPasses(boundaryMass, PHASE5_FIELD_TOLERANCES.ggBoundaryMass) &&
      phase5ComparisonPasses(vapor, PHASE5_FIELD_TOLERANCES.ggVapor),
  };
}

export interface Phase5LKShadowResult {
  readonly fixtureId: string;
  readonly sigma: Phase5ArrayComparison;
  readonly fill: Phase5ArrayComparison;
  readonly occupancyMismatchCount: number;
  readonly attachedCountReference: number;
  readonly attachedCountShadow: number;
  readonly minimumDecisionMargin: number;
  readonly passesDecisionMargin: boolean;
  readonly convergenceClassificationMismatchCount: number;
  readonly ledgerMaxAbs: number;
  readonly ledgerMaxRelative: number;
  readonly ledgerWithinMixedTolerance: boolean;
  readonly passesFrozenTolerance: boolean;
}

function lkMinimumDecisionMargin(solver: LKSolver): number {
  const rates: number[] = [];
  let maxRate = 0;
  for (const index of solver.boundaryCells()) {
    const boundary = solver.boundaryState(index);
    const rate =
      (boundary.alphaHKBoundary * solver.vKinMS * boundary.sigmaBoundary) /
      solver.dxM;
    rates.push(rate);
    if (rate > maxRate) maxRate = rate;
  }
  if (maxRate <= 0) return Infinity;
  const deltaTime = solver.cflFill / maxRate;
  let minimum = Infinity;
  let boundaryOffset = 0;
  for (const index of solver.boundaryCells()) {
    const projectedFill = solver.f[index] + rates[boundaryOffset] * deltaTime;
    minimum = Math.min(minimum, Math.abs(1 - projectedFill));
    boundaryOffset++;
  }
  return minimum;
}

function scalarDifference(reference: number, candidate: number): readonly [number, number] {
  const absolute = Math.abs(candidate - reference);
  const relative =
    absolute /
    Math.max(
      Math.abs(reference),
      PHASE5_SCALAR_TOLERANCES.relativeDenominatorFloor,
    );
  return [absolute, relative];
}

function runLKFixture(fixture: Phase5LKFixture): Phase5LKShadowResult {
  const options = {
    surfacePolicy: fixture.surfacePolicy,
    dims: fixture.dims,
    tempC: fixture.tempC,
    sigmaInfinity: fixture.sigmaInfinity,
    dxUm: fixture.dxUm,
    pressurePa: fixture.pressurePa,
    paramSet: fixture.paramSet,
    cflFill: fixture.cflFill,
    relaxTol: fixture.relaxTol,
    divTol: fixture.divTol,
    relaxMaxSweeps: fixture.relaxMaxSweeps,
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    domain: fixture.domain,
    farField: fixture.farField,
    seedRadius: fixture.seedRadius,
    seedThickness: fixture.seedThickness,
  } as const;
  const reference = new LKSolver(options);
  const shadow = new LKSolver(options);
  const stepCap = Number(fixture.stop.value);
  let convergenceClassificationMismatchCount = 0;
  let ledgerMaxAbs = 0;
  let ledgerMaxRelative = 0;
  let ledgerWithinMixedTolerance = true;
  let minimumDecisionMargin = Infinity;
  for (let step = 0; step < stepCap; step++) {
    if (fixture.timeline !== null && step === fixture.timeline.completedStep) {
      reference.applyTimelineEnvironment({
        tempC: fixture.timeline.tempC,
        sigmaInfinity: fixture.timeline.sigmaInfinity,
      });
      shadow.applyTimelineEnvironment({
        tempC: fixture.timeline.tempC,
        sigmaInfinity: fixture.timeline.sigmaInfinity,
      });
      quantizeBinary32InPlace(shadow.sigma);
    }
    const referenceRelaxation = reference.relaxField();
    const shadowRelaxation = shadow.relaxField();
    if (referenceRelaxation.converged !== shadowRelaxation.converged) {
      convergenceClassificationMismatchCount++;
    }
    quantizeBinary32InPlace(shadow.sigma);
    if (!referenceRelaxation.converged || !shadowRelaxation.converged) break;
    minimumDecisionMargin = Math.min(
      minimumDecisionMargin,
      lkMinimumDecisionMargin(reference),
    );
    reference.advanceSurface();
    shadow.advanceSurface();
    quantizeBinary32InPlace(shadow.f);
    quantizeBinary32InPlace(shadow.sigma);
    shadow.fillLedger = Math.fround(shadow.fillLedger);
    shadow.holeFillDeficit = Math.fround(shadow.holeFillDeficit);
    shadow.saturationClippedFill = Math.fround(shadow.saturationClippedFill);
    shadow.simTimeSeconds = Math.fround(shadow.simTimeSeconds);
    shadow.lastMaxFillVelocityMS = Math.fround(shadow.lastMaxFillVelocityMS);
    const referenceLedger = reference.ledger();
    const shadowLedger = shadow.ledger();
    for (const key of [
      "fillLedgerIceCells",
      "fillLedgerVaporUnits",
      "holeFillDeficit",
      "saturationClippedFill",
    ] as const) {
      const expected = referenceLedger[key];
      const actual = shadowLedger[key];
      if (expected === null || actual === null) throw new Error(`missing LK ledger ${key}`);
      const [absolute, relative] = scalarDifference(expected, actual);
      ledgerMaxAbs = Math.max(ledgerMaxAbs, absolute);
      ledgerMaxRelative = Math.max(ledgerMaxRelative, relative);
      const mixedLimit =
        PHASE5_SCALAR_TOLERANCES.maxAbs +
        PHASE5_SCALAR_TOLERANCES.maxRelative * Math.abs(expected);
      if (absolute > mixedLimit) ledgerWithinMixedTolerance = false;
    }
  }
  let occupancyMismatchCount = 0;
  for (let index = 0; index < reference.a.length; index++) {
    if (reference.a[index] !== shadow.a[index]) occupancyMismatchCount++;
  }
  const sigma = comparePhase5Arrays(
    reference.sigma,
    shadow.sigma,
    PHASE5_FIELD_TOLERANCES.lkSigma.relativeDenominatorFloor,
  );
  const fill = comparePhase5Arrays(
    reference.f,
    shadow.f,
    PHASE5_FIELD_TOLERANCES.lkFill.relativeDenominatorFloor,
  );
  return {
    fixtureId: fixture.id,
    sigma,
    fill,
    occupancyMismatchCount,
    attachedCountReference: reference.attachedCount,
    attachedCountShadow: shadow.attachedCount,
    minimumDecisionMargin,
    passesDecisionMargin:
      minimumDecisionMargin >= PHASE5_DECISION_MARGINS.lkFill,
    convergenceClassificationMismatchCount,
    ledgerMaxAbs,
    ledgerMaxRelative,
    ledgerWithinMixedTolerance,
    passesFrozenTolerance:
      occupancyMismatchCount === 0 &&
      minimumDecisionMargin >= PHASE5_DECISION_MARGINS.lkFill &&
      convergenceClassificationMismatchCount === 0 &&
      phase5ComparisonPasses(sigma, PHASE5_FIELD_TOLERANCES.lkSigma) &&
      phase5ComparisonPasses(fill, PHASE5_FIELD_TOLERANCES.lkFill) &&
      ledgerWithinMixedTolerance,
  };
}

function binary32AttachmentCoefficient(
  facet: FacetClass,
  tempC: number,
  sigmaSurface: number,
): number {
  if (facet === "rough") return 1;
  if (facet === "inhibited" || sigmaSurface <= 0) return 0;
  const sigma = Math.fround(sigmaSurface);
  const coefficient =
    facet === "basal"
      ? Math.fround(nucleationABasal(tempC, "CAK_A1"))
      : Math.fround(nucleationAPrism(tempC, "CAK_A1"));
  const sigma0 =
    facet === "basal"
      ? Math.fround(sigma0Basal(tempC))
      : Math.fround(sigma0Prism(tempC));
  const exponent = Math.fround(-Math.fround(sigma0 / sigma));
  return Math.fround(coefficient * Math.fround(Math.exp(exponent)));
}

export interface Phase5KineticsScalarShadow {
  readonly sampleCount: number;
  readonly maxAbs: number;
  readonly maxRelative: number;
}

function runKineticsScalarShadow(): Phase5KineticsScalarShadow {
  let sampleCount = 0;
  let maxAbs = 0;
  let maxRelative = 0;
  for (const tempC of [-5, -15]) {
    for (const facet of ["basal", "prism"] as const) {
      for (let exponent = -8; exponent <= -1.6; exponent += 0.05) {
        const sigmaSurface = 10 ** exponent;
        const reference = alphaHK(facet, tempC, sigmaSurface, "CAK_A1");
        const candidate = binary32AttachmentCoefficient(facet, tempC, sigmaSurface);
        const absolute = Math.abs(candidate - reference);
        const relative = absolute / Math.max(Math.abs(reference), 1e-30);
        maxAbs = Math.max(maxAbs, absolute);
        maxRelative = Math.max(maxRelative, relative);
        sampleCount++;
      }
    }
  }
  return { sampleCount, maxAbs, maxRelative };
}

export interface Phase5ShadowReport {
  readonly schema: "phase5-f32-shadow-v1";
  readonly description: string;
  readonly diffusion: readonly Phase5DiffusionShadowResult[];
  readonly gg: readonly Phase5GGShadowResult[];
  readonly lk: readonly Phase5LKShadowResult[];
  readonly kineticsScalar: Phase5KineticsScalarShadow;
  readonly allBlockingMeasurementsWithinFrozenTolerance: boolean;
}

export function runPhase5ShadowProbe(): Phase5ShadowReport {
  const diffusion = PHASE5_FIXTURES.filter(
    (fixture): fixture is Phase5DiffusionFixture => fixture.kind === "diffusion",
  ).map(runDiffusionFixture);
  const gg = PHASE5_FIXTURES.filter(
    (fixture): fixture is Phase5GGFixture => fixture.kind === "gg",
  ).map(runGGFixture);
  const lk = PHASE5_FIXTURES.filter(
    (fixture): fixture is Phase5LKFixture => fixture.kind === "lk",
  ).map(runLKFixture);
  const kineticsScalar = runKineticsScalarShadow();
  return {
    schema: "phase5-f32-shadow-v1",
    description:
      "Independent operation-rounded diffusion, public-stage binary32 storage shadow, " +
      "and scalar kinetics sweep; this is pre-GPU tolerance evidence, not GPU output",
    diffusion,
    gg,
    lk,
    kineticsScalar,
    allBlockingMeasurementsWithinFrozenTolerance:
      diffusion.every((result) => result.passesFrozenTolerance) &&
      gg.every((result) => result.passesFrozenTolerance) &&
      lk.every((result) => result.passesFrozenTolerance),
  };
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runPhase5ShadowProbe(), null, 2));
}
