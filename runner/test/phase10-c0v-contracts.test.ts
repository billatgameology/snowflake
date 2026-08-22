import { describe, expect, it } from "vitest";
import {
  parsePhase10C0VMovingReferenceCandidate,
  parsePhase10C0VMovingReferenceCheck,
  parsePhase10C0VNumericIdentity,
  parsePhase10C0VRadialReferenceCandidate,
  parsePhase10C0VRadialReferenceCheck,
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
  parsePhase10C0VStaticRefusalCandidate,
  parsePhase10C0VStaticRefusalCheck,
} from "../src/phase10-c0v-contracts.ts";

function numeric(value: number): { readonly decimal: string; readonly binary64Hex: string } {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  return Object.freeze({
    decimal: value.toString(),
    binary64Hex: [...new Uint8Array(view.buffer)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""),
  });
}

const N0 = numeric(0);
const N1 = numeric(1);
const SHA = "a".repeat(64);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function artifact(path: string): Record<string, unknown> {
  return { path, byteLength: 1, sha256: SHA };
}

function radialSample(): Record<string, unknown> {
  return { nodeIndex: 0, radiusM: N1, sigma: N1 };
}

function radialCase(caseId: string): Record<string, unknown> {
  return {
    caseId,
    requestedSpacingM: N1,
    actualSpacingM: N1,
    nodeCount: 1,
    harmonicConstant: N1,
    harmonicInverseRadiusCoefficientM: N1,
    sigmaSurface: N1,
    sigmaShell: N1,
    surfaceGradientPerM: N1,
    growthVelocityFluxMS: N1,
    growthVelocityKineticMS: N1,
    robinResidual: N0,
    samples: [radialSample()],
  };
}

function radialUniformCase(caseId: string): Record<string, unknown> {
  return {
    caseId,
    requestedSpacingM: N1,
    actualSpacingM: N1,
    nodeCount: 1,
    sigmaSurface: N1,
    sigmaShell: N1,
    surfaceGradientPerM: N0,
    growthVelocityFluxMS: N0,
    growthVelocityKineticMS: N0,
    robinResidual: N0,
    samples: [radialSample()],
  };
}

function radialPhysics(): Record<string, unknown> {
  return {
    temperatureK: N1,
    saturationPressurePa: N1,
    saturationNumberDensityPerM3: N1,
    diffusivityM2S: N1,
    thermalSpeedMS: N1,
    kineticVelocityMS: N1,
    kineticLengthM: N1,
  };
}

function radialCandidate(): Record<string, unknown> {
  const caseIds = ["case-a", "case-b", "case-c", "case-d"];
  return {
    schema: "phase10-c0v-radial-reference-candidate-v1",
    protocolId: "synthetic-radial-protocol",
    method: "independent-2x2-harmonic-coefficients",
    operands: {
      radiusM: N1,
      farRadiusM: N1,
      sigmaInfinity: N1,
      tempC: N1,
      pressurePa: N1,
      alphaHKConst: N1,
      physicalConstants: {
        kBoltzmannJPerK: N1,
        celsiusZeroK: N1,
        waterMoleculeMassKg: N1,
        iceNumberDensityPerM3: N1,
        diffusivityAir1AtmM2S: N1,
        standardAtmospherePa: N1,
        saturationPressurePrefactorMbar: N1,
        saturationPressureExponentK: N1,
        mbarToPa: N1,
      },
    },
    requestedRoster: caseIds.map((caseId) => ({ caseId, requestedSpacingM: N1 })),
    derivedPhysics: radialPhysics(),
    cases: caseIds.map(radialCase),
    uniformFieldControl: {
      alphaHKConst: N0,
      cases: caseIds.map(radialUniformCase),
    },
    scope: {
      control: "finite-shell-constant-coefficient-spherical-robin",
      orderDisposition: "not-applicable-exact-u-roundoff-control",
      physicalValidationClaim: false,
      habitClaim: false,
      solverExecuted: false,
    },
  };
}

function radialMetric(): Record<string, unknown> {
  return { value: N0, tolerance: N1, pass: true };
}

function radialMetrics(): Record<string, unknown> {
  return {
    surfaceRelative: radialMetric(),
    velocityRelative: radialMetric(),
    fieldRelativeLInf: radialMetric(),
    fieldWeightedRelativeL2: radialMetric(),
    shellNormalized: radialMetric(),
    uniformNormalizedLInf: radialMetric(),
    robinResidualNormalized: radialMetric(),
    generatorCheckerAgreement: radialMetric(),
  };
}

function radialIndependentCase(caseId: string): Record<string, unknown> {
  return {
    caseId,
    requestedSpacingM: N1,
    actualSpacingM: N1,
    nodeCount: 1,
    robinLambda: N1,
    harmonicConstant: N1,
    harmonicInverseRadiusCoefficientM: N1,
    sigmaSurface: N1,
    sigmaShell: N1,
    surfaceGradientPerM: N1,
    growthVelocityMS: N1,
    samples: [radialSample()],
  };
}

function radialCheck(): Record<string, unknown> {
  const caseIds = ["case-a", "case-b", "case-c", "case-d"];
  return {
    schema: "phase10-c0v-radial-reference-check-v1",
    protocolId: "synthetic-radial-protocol",
    method: "independent-closed-form-lambda",
    independentDerivedPhysics: radialPhysics(),
    exactOperandEcho: true,
    exactRoster: true,
    cases: caseIds.map((caseId) => ({
      caseId,
      exactRoster: true,
      independent: radialIndependentCase(caseId),
      independentUniformFieldControl: radialUniformCase(caseId),
      metrics: radialMetrics(),
      exactUniformZeroRates: true,
      errors: [],
      pass: true,
    })),
    maxima: radialMetrics(),
    allFinite: true,
    errors: [],
    pass: true,
  };
}

function relaxation(): Record<string, unknown> {
  return {
    sweeps: 0,
    residual: N0,
    converged: true,
    divergenceResidual: N0,
    shellClampDiagnostic: N0,
    surfaceExchangeDiagnostic: N0,
    smootherDriftDiagnostic: N0,
    smootherDriftLimit: N0,
    maxAbsSweepInput: N0,
  };
}

function movingState(): Record<string, unknown> {
  return {
    attachedIndices: [],
    boundaryIndices: [],
    fieldRows: [{ linearIndex: 0, attached: false, wall: false, fill: N0, sigma: N1 }],
    boundaryRows: [],
    relaxation: relaxation(),
  };
}

function movingCandidate(): Record<string, unknown> {
  return {
    schema: "phase10-c0v-moving-reference-candidate-v1",
    protocolId: "synthetic-moving-protocol",
    method: "independent-integer-topology-scalar-bisection",
    activeCells: [{ linearIndex: 0, i: 0, j: 0, k: 0, di: 0, dj: 0, dk: 0, shell: true }],
    neighborTable: [{ linearIndex: 0, neighbors: [null, null, null, null, null, null, null, null] }],
    initialState: movingState(),
    cycles: [{
      stepOrdinal: 1,
      deltaTimeSeconds: N1,
      cumulativeTimeSeconds: N1,
      maxKineticFillIncrement: N0,
      placedFillDelta: N0,
      saturationClippedFillDelta: N0,
      kineticDemandDelta: N0,
      attachedIndices: [],
    }],
    event: {
      eventOrdinal: 1,
      eventStepOrdinal: 1,
      tiedOrbitIndices: [],
      maxRatePerSecond: N0,
      nextRatePerSecond: N0,
      tieMarginPerSecond: N0,
      eventTimeSeconds: N1,
      preEventFillRows: [],
      attachedIndices: [],
    },
    postState: movingState(),
    ledger: {
      placedFillIceCells: N0,
      saturationClippedFillIceCells: N0,
      kineticDemandIceCells: N0,
      holeFillDeficitIceCells: N0,
      holeFillCount: 0,
      placedFillVaporUnits: N0,
    },
    convergence: {
      scalarRoot: {
        lowerEndpoint: N0,
        upperEndpoint: N1,
        selectedRoot: N1,
        residual: N0,
        relativeResidual: N0,
        iterations: 0,
      },
      preEvent: relaxation(),
      postEvent: relaxation(),
    },
  };
}

function passedDetails(extra: Record<string, unknown>): Record<string, unknown> {
  return { ...extra, passed: true, details: [] };
}

function movingCheck(): Record<string, unknown> {
  return {
    schema: "phase10-c0v-moving-reference-check-v1",
    protocolId: "synthetic-moving-protocol",
    method: "independent-cube-topology-safeguarded-newton-and-equation-residuals",
    monotonicityBracketResidual: {
      bracketed: true,
      derivativePositive: true,
      candidateResidualRelative: N0,
      recomputedRoot: N1,
      rootRelativeDifference: N0,
      passed: true,
    },
    topologyChecks: passedDetails({
      activeCellsExact: true,
      neighborsExact: true,
      initialSetsExact: true,
      postSetsExact: true,
      d6hOrbitExact: true,
    }),
    fieldEquationChecks: passedDetails({
      preLInf: N0,
      preWeightedL2: N0,
      preFixedPointResidual: N0,
      postLInf: N0,
      postFixedPointResidual: N0,
      shellExact: true,
      zerosExact: true,
    }),
    eventChecks: passedDetails({
      ratesTiedPositive: true,
      otherRatesZero: true,
      attachedNowByStep: [0, 0, 0, 2],
      eventTimeRelativeDifference: N0,
    }),
    ledgerChecks: passedDetails({
      placedAbsDifference: N0,
      clippingAbsDifference: N0,
      demandIdentityAbsResidual: N0,
      vaporRelativeDifference: N0,
      holeFillExact: true,
    }),
    verdict: "pass",
    errors: [],
  };
}

function zeroExecution(): Record<string, unknown> {
  return {
    solverInvocations: 0,
    referenceInvocations: 0,
    productionInvocations: 0,
    witnessesProduced: 0,
    numericalEvaluations: 0,
    scientificProcessHours: 0,
  };
}

function sourceAudit(): Record<string, unknown> {
  return {
    auditId: "synthetic-static-audit",
    currentContractOnly: true,
    inspectedArtifacts: [artifact("synthetic/source.ts")],
    publicApiFindings: [
      {
        findingId: "public-one-sweep-reconstruction-available",
        operandIds: [
          "acceptedFinalSweepPreCallField",
          "postSmootherCandidate",
          "relaxField",
          "relaxMaxSweeps",
          "sigma",
        ],
        visibility: "public-accepted-state",
        contractChangeRequired: false,
        evidenceLocator: "solver-cpu/src/lk-solver.ts#LKSolver.relaxField-relaxMaxSweeps-incomplete-and-sigma",
      },
      {
        findingId: "independent-static-spatial-reference-order-not-specified",
        operandIds: [
          "analyticExpectedFieldOrder",
          "analyticExpectedFluxOrder",
          "independentContinuumBoundaryFluxReference",
          "independentContinuumFieldReference",
          "orderLowerBound",
        ],
        visibility: "not-specified",
        contractChangeRequired: false,
        evidenceLocator: "docs/attachment-kinetics.md#4.4-the-surface-operator-specification",
      },
    ],
    executionRecord: zeroExecution(),
  };
}

function terminal(): Record<string, unknown> {
  return {
    earlyReferenceArtifact: "published refusal",
    packetCompletion: "refused",
    referenceReopener: "contract change",
    discrepancyOutcome: "not applicable",
    aggregateRule: "non-pass",
  };
}

function claimBoundary(): Record<string, unknown> {
  return { allowed: ["current-contract refusal"], forbidden: ["universal impossibility"] };
}

function attemptedRoutes(): readonly Record<string, unknown>[] {
  return [
    {
      routeId: "public-one-sweep-reconstruction-plus-separate-discrete-replay",
      route: "synthetic same-discrete replay",
      disposition: "available-but-insufficient",
      reason: "same-discrete replay is not a spatial reference",
    },
    {
      routeId: "tolerance-scaled-self-convergence",
      route: "synthetic tolerance-scaled self-convergence",
      disposition: "forbidden-substitute",
      reason: "stopping error is not absolute accuracy",
    },
  ];
}

function staticCandidate(): Record<string, unknown> {
  return {
    schema: "phase10-c0v-static-refusal-candidate-v1",
    protocolId: "synthetic-static-protocol",
    reasonCode: "current-contract-lacks-independent-static-spatial-reference-v1",
    currentContractScope: "accepted-current-public-solver-contract-only",
    unavailableOperands: [
      "analyticExpectedFieldOrder",
      "analyticExpectedFluxOrder",
      "independentContinuumBoundaryFluxReference",
      "independentContinuumFieldReference",
      "orderLowerBound",
    ],
    attemptedRoutes: attemptedRoutes(),
    forbiddenSubstitutes: [
      "same-discrete-replay-as-spatial-accuracy",
      "self-convergence-as-absolute-accuracy",
    ],
    contractEvidence: sourceAudit(),
    executionRecord: zeroExecution(),
    downstreamEffect: terminal(),
    claimBoundary: claimBoundary(),
  };
}

function staticCheck(): Record<string, unknown> {
  return {
    schema: "phase10-c0v-static-refusal-check-v1",
    protocolId: "synthetic-static-protocol",
    method: "independent-current-contract-ground-route-scope-and-zero-execution-check",
    groundChecks: passedDetails({}),
    routeChecks: passedDetails({}),
    scopeChecks: passedDetails({}),
    zeroExecutionChecks: passedDetails({}),
    verdict: "pass",
    errors: [],
  };
}

function codeIdentity(role: string, modulePath: string, exportName: string): Record<string, unknown> {
  return { role, modulePath, exportName, byteLength: 1, sha256: SHA };
}

function receipt(): Record<string, unknown> {
  const sharedClosure = [
    artifact("runner/src/gate4-evidence.ts"),
    artifact("runner/src/phase10-c0v-contracts.ts"),
  ];
  return {
    protocolBindings: {
      foundation: artifact("research/phase10-c0v-foundation-v1.json"),
      obligationMatrix: artifact("research/phase10-obligation-matrix-v1.json"),
      schemaRegistry: artifact("research/phase10-c0v-artifact-schema-registry-v1.json"),
      schemaContracts: artifact("research/phase10-c0v-schema-contracts-v1.json"),
    },
    freezePreflight: {
      branch: "phase10/evidence-verification",
      head: "a".repeat(40),
      runtime: "v24.13.1",
      trackedWorktreeClean: true,
      protocol: artifact("research/synthetic-protocol.json"),
    },
    commands: { derive: "synthetic derive", check: "synthetic check", publish: "synthetic publish" },
    timestamps: {
      deriveStartedAt: "2026-08-21T00:00:00.000Z",
      deriveCompletedAt: "2026-08-21T00:00:01.000Z",
      checkCompletedAt: "2026-08-21T00:00:02.000Z",
      publishCompletedAt: "2026-08-21T00:00:03.000Z",
    },
    codeIdentities: {
      generator: codeIdentity("generator", "runner/src/synthetic-generator.ts", "deriveSynthetic"),
      independentChecker: codeIdentity("independent-checker", "runner/src/synthetic-checker.ts", "checkSynthetic"),
      sharedParser: codeIdentity("shared-parser", "runner/src/phase10-c0v-contracts.ts", "parseSynthetic"),
      neutralDerive: codeIdentity("neutral-derive", "runner/src/phase10-c0v-reference-derive.ts", "derivePhase10C0VReferenceCandidate"),
      neutralCheck: codeIdentity("neutral-check", "runner/src/phase10-c0v-reference-check.ts", "verifyPhase10C0VReferenceCandidate"),
      neutralPublish: codeIdentity("neutral-publish", "runner/src/phase10-c0v-reference-publish.ts", "publishPhase10C0VReference"),
    },
    observedImports: { generator: sharedClosure, independentChecker: sharedClosure },
    allowedSharedImports: ["runner/src/gate4-evidence.ts", "runner/src/phase10-c0v-contracts.ts"],
    forbiddenImportPatterns: [
      "core/**",
      "runner/src/phase10-execution-preflight.ts",
      "runner/src/phase10-executor-worker.ts",
      "runner/src/phase10-executor.ts",
      "solver-cpu/**",
      "solver-gpu/**",
    ],
    forbiddenImportsObserved: [],
    generatorCheckerScientificImportOverlap: [],
    pass: true,
  };
}

describe("Phase 10 C0V strict artifact codecs", () => {
  it("binds decimal and big-endian binary64 representations exactly", () => {
    expect(parsePhase10C0VNumericIdentity(N1)).toEqual(N1);
    expect(() => parsePhase10C0VNumericIdentity({ ...N1, extra: true })).toThrow(/keys differ/u);
    expect(() => parsePhase10C0VNumericIdentity({ ...N1, binary64Hex: N0.binary64Hex }))
      .toThrow(/different values/u);
    expect(() => parsePhase10C0VNumericIdentity({ decimal: "-0", binary64Hex: "8000000000000000" }))
      .toThrow(/non-negative-zero/u);
  });

  it("rejects unknown fields at every radial candidate/check boundary", () => {
    const candidate = radialCandidate();
    const check = radialCheck();
    expect(parsePhase10C0VRadialReferenceCandidate(candidate)).toEqual(candidate);
    expect(parsePhase10C0VRadialReferenceCheck(check)).toEqual(check);

    const candidateTop = clone(candidate) as any;
    candidateTop.extra = true;
    expect(() => parsePhase10C0VRadialReferenceCandidate(candidateTop)).toThrow(/keys differ/u);
    const candidateNested = clone(candidate) as any;
    candidateNested.cases[0].samples[0].extra = true;
    expect(() => parsePhase10C0VRadialReferenceCandidate(candidateNested)).toThrow(/keys differ/u);
    const checkNested = clone(check) as any;
    checkNested.cases[0].metrics.surfaceRelative.value.extra = true;
    expect(() => parsePhase10C0VRadialReferenceCheck(checkNested)).toThrow(/keys differ/u);
    const wrongRoster = clone(check) as any;
    wrongRoster.cases.pop();
    expect(() => parsePhase10C0VRadialReferenceCheck(wrongRoster)).toThrow(/exactly four/u);
  });

  it("rejects unknown fields at every moving candidate/check boundary", () => {
    const candidate = movingCandidate();
    const check = movingCheck();
    expect(parsePhase10C0VMovingReferenceCandidate(candidate)).toEqual(candidate);
    expect(parsePhase10C0VMovingReferenceCheck(check)).toEqual(check);

    const candidateNested = clone(candidate) as any;
    candidateNested.initialState.relaxation.residual.extra = true;
    expect(() => parsePhase10C0VMovingReferenceCandidate(candidateNested)).toThrow(/keys differ/u);
    const neighborMutation = clone(candidate) as any;
    neighborMutation.neighborTable[0].neighbors.push(null);
    expect(() => parsePhase10C0VMovingReferenceCandidate(neighborMutation)).toThrow(/eight/u);
    const checkNested = clone(check) as any;
    checkNested.ledgerChecks.extra = true;
    expect(() => parsePhase10C0VMovingReferenceCheck(checkNested)).toThrow(/keys differ/u);
  });

  it("requires the exact two-finding static audit and strict refusal check", () => {
    const candidate = staticCandidate();
    const check = staticCheck();
    expect(parsePhase10C0VStaticRefusalCandidate(candidate)).toEqual(candidate);
    expect(parsePhase10C0VStaticRefusalCheck(check)).toEqual(check);

    const candidateNested = clone(candidate) as any;
    candidateNested.contractEvidence.publicApiFindings[0].extra = true;
    expect(() => parsePhase10C0VStaticRefusalCandidate(candidateNested)).toThrow(/keys differ/u);
    const missingFinding = clone(candidate) as any;
    missingFinding.contractEvidence.publicApiFindings.pop();
    expect(() => parsePhase10C0VStaticRefusalCandidate(missingFinding)).toThrow(/exactly two/u);
    const retiredPrivatePremise = clone(candidate) as any;
    retiredPrivatePremise.contractEvidence.publicApiFindings[0].visibility = "private-transient";
    retiredPrivatePremise.contractEvidence.publicApiFindings[0].contractChangeRequired = true;
    expect(() => parsePhase10C0VStaticRefusalCandidate(retiredPrivatePremise))
      .toThrow(/visibility|public-accepted-state/u);
    const checkNested = clone(check) as any;
    checkNested.scopeChecks.extra = true;
    expect(() => parsePhase10C0VStaticRefusalCheck(checkNested)).toThrow(/keys differ/u);
  });

  it("dispatches final artifacts through their deep raw-output parsers", () => {
    const envelope = {
      schema: "phase10-c0v-radial-reference-v1",
      referenceId: "synthetic-reference",
      protocolId: "synthetic-radial-protocol",
      layerId: "C0V-RADIAL",
      branch: "independent-reference",
      protocol: artifact("research/synthetic-radial-protocol.json"),
      freezeCommit: "a".repeat(40),
      createdAt: "2026-08-21T00:00:03.000Z",
      generatorOutput: radialCandidate(),
      independentCheck: radialCheck(),
      codeAndImportReceipt: receipt(),
      comparison: {
        method: "independent-reexecution",
        expectedOutcome: "pass",
        observedOutcome: "pass",
        errors: [],
      },
      disposition: "reference-frozen",
      claimBoundary: claimBoundary(),
    };
    expect(parsePhase10C0VReferenceEnvelope(envelope)).toEqual(envelope);
    const envelopeMutation = clone(envelope) as any;
    envelopeMutation.generatorOutput.cases[0].unexpected = true;
    expect(() => parsePhase10C0VReferenceEnvelope(envelopeMutation)).toThrow(/keys differ/u);
    const envelopeProtocolMismatch = clone(envelope) as any;
    envelopeProtocolMismatch.independentCheck.protocolId = "different-protocol";
    expect(() => parsePhase10C0VReferenceEnvelope(envelopeProtocolMismatch)).toThrow(/protocolId/u);
    const envelopeSummaryMismatch = clone(envelope) as any;
    envelopeSummaryMismatch.independentCheck.pass = false;
    expect(() => parsePhase10C0VReferenceEnvelope(envelopeSummaryMismatch))
      .toThrow(/pass must be reduced|raw independent-check outcome/u);

    const refusal = {
      schema: "phase10-c0v-reference-refusal-v1",
      refusalId: "synthetic-refusal",
      protocolId: "synthetic-static-protocol",
      layerId: "C0V-STATIC",
      branch: "reference-refusal",
      protocol: artifact("research/synthetic-static-protocol.json"),
      freezeCommit: "a".repeat(40),
      createdAt: "2026-08-21T00:00:03.000Z",
      reasonCode: "current-contract-lacks-independent-static-spatial-reference-v1",
      unavailableOperands: [
        "analyticExpectedFieldOrder",
        "analyticExpectedFluxOrder",
        "independentContinuumBoundaryFluxReference",
        "independentContinuumFieldReference",
        "orderLowerBound",
      ],
      attemptedRoutes: attemptedRoutes(),
      forbiddenSubstitutes: [
        "same-discrete-replay-as-spatial-accuracy",
        "self-convergence-as-absolute-accuracy",
      ],
      contractEvidence: { sourceAudit: sourceAudit(), codeAndImportReceipt: receipt() },
      independentCheck: staticCheck(),
      executionRecord: zeroExecution(),
      downstreamEffect: terminal(),
      claimBoundary: claimBoundary(),
    };
    expect(parsePhase10C0VReferenceRefusal(refusal)).toEqual(refusal);
    const refusalMutation = clone(refusal) as any;
    refusalMutation.contractEvidence.sourceAudit.executionRecord.extra = 0;
    expect(() => parsePhase10C0VReferenceRefusal(refusalMutation)).toThrow(/keys differ/u);
    const refusalProtocolMismatch = clone(refusal) as any;
    refusalProtocolMismatch.independentCheck.protocolId = "different-protocol";
    expect(() => parsePhase10C0VReferenceRefusal(refusalProtocolMismatch)).toThrow(/protocolId/u);
    const nonStaticRefusal = clone(refusal) as any;
    nonStaticRefusal.layerId = "C0V-RADIAL";
    expect(() => parsePhase10C0VReferenceRefusal(nonStaticRefusal)).toThrow(/C0V-STATIC/u);
  });
});
