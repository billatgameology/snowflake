import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

export const PHASE10_C0V_SCHEMA_CONTRACTS_SCHEMA =
  "phase10-c0v-schema-contracts-v1" as const;
export const PHASE10_C0V_REGISTRY_SCHEMA =
  "phase10-artifact-schema-registry-v1" as const;
export const PHASE10_C0V_RADIAL_PROTOCOL_SCHEMA =
  "phase10-c0v-radial-protocol-v1" as const;
export const PHASE10_C0V_STATIC_PROTOCOL_SCHEMA =
  "phase10-c0v-static-protocol-v1" as const;
export const PHASE10_C0V_MOVING_PROTOCOL_SCHEMA =
  "phase10-c0v-moving-protocol-v1" as const;
export const PHASE10_C0V_RADIAL_REFERENCE_SCHEMA =
  "phase10-c0v-radial-reference-v1" as const;
export const PHASE10_C0V_MOVING_REFERENCE_SCHEMA =
  "phase10-c0v-moving-reference-v1" as const;
export const PHASE10_C0V_REFERENCE_REFUSAL_SCHEMA =
  "phase10-c0v-reference-refusal-v1" as const;

export type Phase10C0VLayerId = "C0V-RADIAL" | "C0V-STATIC" | "C0V-MOVING-EVENT";
export type Phase10C0VBranch = "independent-reference" | "reference-refusal";
export type Phase10C0VTerminalStatus = "pass" | "fail" | "refusal";

export interface Phase10C0VNumericIdentity {
  readonly decimal: string;
  readonly binary64Hex: string;
}

export interface Phase10C0VArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0VProtocolBindings {
  readonly foundation: Phase10C0VArtifactIdentity;
  readonly obligationMatrix: Phase10C0VArtifactIdentity;
  readonly schemaRegistry: Phase10C0VArtifactIdentity;
  readonly schemaContracts: Phase10C0VArtifactIdentity;
}

export interface Phase10C0VCodeIdentity {
  readonly role:
    | "generator"
    | "independent-checker"
    | "shared-parser"
    | "neutral-derive"
    | "neutral-check"
    | "neutral-publish";
  readonly modulePath: string;
  readonly exportName: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0VFinalCodeAndImportReceipt {
  readonly protocolBindings: Phase10C0VProtocolBindings;
  readonly freezePreflight: {
    readonly branch: "phase10/evidence-verification";
    readonly head: string;
    readonly runtime: "v24.13.1";
    readonly trackedWorktreeClean: true;
    readonly protocol: Phase10C0VArtifactIdentity;
  };
  readonly commands: {
    readonly derive: string;
    readonly check: string;
    readonly publish: string;
  };
  readonly timestamps: {
    readonly deriveStartedAt: string;
    readonly deriveCompletedAt: string;
    readonly checkCompletedAt: string;
    readonly publishCompletedAt: string;
  };
  readonly codeIdentities: {
    readonly generator: Phase10C0VCodeIdentity;
    readonly independentChecker: Phase10C0VCodeIdentity;
    readonly sharedParser: Phase10C0VCodeIdentity;
    readonly neutralDerive: Phase10C0VCodeIdentity;
    readonly neutralCheck: Phase10C0VCodeIdentity;
    readonly neutralPublish: Phase10C0VCodeIdentity;
  };
  readonly observedImports: {
    readonly generator: readonly Phase10C0VArtifactIdentity[];
    readonly independentChecker: readonly Phase10C0VArtifactIdentity[];
  };
  readonly allowedSharedImports: readonly string[];
  readonly forbiddenImportPatterns: readonly string[];
  readonly forbiddenImportsObserved: readonly [];
  readonly generatorCheckerScientificImportOverlap: readonly [];
  readonly pass: true;
}

export interface Phase10C0VPhysicalConstants {
  readonly kBoltzmannJPerK: number;
  readonly celsiusZeroK: number;
  readonly waterMoleculeMassKg: number;
  readonly iceNumberDensityPerM3: number;
  readonly diffusivityAir1AtmM2S: number;
  readonly standardAtmospherePa: number;
  readonly saturationPressurePrefactorMbar: number;
  readonly saturationPressureExponentK: number;
  readonly mbarToPa: number;
}

export interface Phase10C0VRadialReferenceInput {
  readonly protocolId: string;
  readonly operands: {
    readonly radiusM: number;
    readonly farRadiusM: number;
    readonly sigmaInfinity: number;
    readonly tempC: number;
    readonly pressurePa: number;
    readonly alphaHKConst: number;
    readonly physicalConstants: Phase10C0VPhysicalConstants;
  };
  readonly roster: readonly {
    readonly caseId: string;
    readonly requestedSpacingM: number;
    readonly expectedIntervalCount: number;
    readonly expectedNodeCount: number;
    readonly expectedActualSpacingM: number;
    readonly actualSpacingUmNumerator: number;
    readonly actualSpacingUmDenominator: number;
  }[];
  readonly tolerances: {
    readonly surfaceRelative: number;
    readonly velocityRelative: number;
    readonly fieldRelativeLInf: number;
    readonly fieldWeightedRelativeL2: number;
    readonly shellNormalized: number;
    readonly uniformNormalizedLInf: number;
    readonly robinResidualNormalized: number;
    readonly generatorCheckerAgreement: number;
  };
}

export interface Phase10C0VMovingFixture {
  readonly surfacePolicy: "aggregate-hv-g1h1-v6";
  readonly dimensions: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly domain: "hexPrism";
  readonly farField: "dirichlet";
  readonly seedRadius: 0;
  readonly seedThickness: 1;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: "CAK_A1";
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly maxSweeps: number;
  readonly noiseEpsilon: 0;
  readonly rngSeed: 0;
  readonly physicalConstants: Phase10C0VPhysicalConstants;
  readonly kineticInputs: {
    readonly basalPrefactor: 1;
    readonly basalSigma0: number;
    readonly robinGeometry: 1;
    readonly fillGeometry: 1;
  };
}

export interface Phase10C0VMovingTopology {
  readonly linearIndexRule: "i + ni * (j + nj * k)";
  readonly neighborOffsets: readonly (readonly [number, number, number])[];
  readonly initialAttachedIndices: readonly number[];
  readonly initialBoundaryIndices: readonly number[];
  readonly tiedOrbitIndices: readonly number[];
  readonly postAttachedIndices: readonly number[];
  readonly postBoundaryIndices: readonly number[];
  readonly eventOrdinal: 4;
  readonly d6hClosureRule: string;
}

export interface Phase10C0VMovingCriteria {
  readonly allChecksRequired: true;
  readonly scalarEquationResidualRelative: number;
  readonly preEventFieldLInf: number;
  readonly preEventFieldWeightedL2: number;
  readonly axialRateRelative: number;
  readonly axialRatesBitIdenticalPositive: true;
  readonly otherInitialBoundaryRatesBitwiseZero: true;
  readonly attachedNowByStep: readonly [0, 0, 0, 2];
  readonly eventTimeRelative: number;
  readonly maxKineticIncrementAbsolute: number;
  readonly exactTopologyNeighborD6hSets: true;
  readonly postFieldShellBitwiseSigmaInfinity: true;
  readonly postFieldAttachedAndWallBitwiseZero: true;
  readonly placedFillAbsolute: number;
  readonly clippingAbsolute: number;
  readonly vaporLedgerRelative: number;
  readonly eventChainRelative: number;
  readonly holeFillExact: {
    readonly count: 0;
    readonly deficit: 0;
  };
  readonly postFieldFixedPointResidual: number;
  readonly relaxationCriteria: {
    readonly residualStrictlyLessThan: number;
    readonly divergenceStrictlyLessThan: number;
    readonly maxSweeps: number;
    readonly smootherDriftWithinRoundoffBound: true;
  };
  readonly comparisonOperators: {
    readonly tolerance: "less-than-or-equal";
    readonly relaxation: "strictly-less-than";
    readonly exact: "strict-equality-or-bitwise-as-named";
  };
}

export interface Phase10C0VMovingFormulas {
  readonly environmentEquations: string;
  readonly inPlaneEquation: string;
  readonly verticalEquation: string;
  readonly opposingEquation: string;
  readonly boundaryEquation: string;
  readonly preEventScalarEquation: string;
  readonly evaluationOrder: readonly string[];
  readonly bisection: {
    readonly lowerBound: string;
    readonly upperBound: string;
    readonly maxIterations: number;
    readonly stopRule: string;
    readonly selectionRule: string;
  };
  readonly eventUpdate: {
    readonly rateEquation: string;
    readonly timeStepEquation: string;
    readonly fillEquation: string;
    readonly attachmentRule: string;
    readonly topologyRule: string;
  };
  readonly ledgerIdentity: {
    readonly iceCellEquation: string;
    readonly vaporEquation: string;
    readonly holeFillRule: string;
  };
  readonly driftBound: {
    readonly nonzeroEquation: string;
    readonly zeroFieldValue: string;
  };
}

export interface Phase10C0VMovingReferenceInput {
  readonly protocolId: string;
  readonly fixture: Phase10C0VMovingFixture;
  readonly topology: Phase10C0VMovingTopology;
  readonly formulas: Phase10C0VMovingFormulas;
  readonly criteria: Phase10C0VMovingCriteria;
}

export interface Phase10C0VMovingActiveCellRow {
  readonly linearIndex: number;
  readonly i: number;
  readonly j: number;
  readonly k: number;
  readonly di: number;
  readonly dj: number;
  readonly dk: number;
  readonly shell: boolean;
}

export interface Phase10C0VMovingNeighborRow {
  readonly linearIndex: number;
  readonly neighbors: readonly (number | null)[];
}

export interface Phase10C0VMovingFieldRow {
  readonly linearIndex: number;
  readonly attached: boolean;
  readonly wall: boolean;
  readonly fill: Phase10C0VNumericIdentity;
  readonly sigma: Phase10C0VNumericIdentity;
}

export interface Phase10C0VMovingBoundaryRow {
  readonly linearIndex: number;
  readonly nT: number;
  readonly nZ: number;
  readonly facetClass: "basal" | "inhibited" | "prism" | "rough";
  readonly opposingIndices: readonly number[];
  readonly sigmaOpp: Phase10C0VNumericIdentity;
  readonly sigmaBoundary: Phase10C0VNumericIdentity;
  readonly alphaHK: Phase10C0VNumericIdentity;
  readonly fillRatePerSecond: Phase10C0VNumericIdentity;
}

export interface Phase10C0VMovingRelaxationRecord {
  readonly sweeps: number;
  readonly residual: Phase10C0VNumericIdentity;
  readonly converged: boolean;
  readonly divergenceResidual: Phase10C0VNumericIdentity;
  readonly shellClampDiagnostic: Phase10C0VNumericIdentity;
  readonly surfaceExchangeDiagnostic: Phase10C0VNumericIdentity;
  readonly smootherDriftDiagnostic: Phase10C0VNumericIdentity;
  readonly smootherDriftLimit: Phase10C0VNumericIdentity;
  readonly maxAbsSweepInput: Phase10C0VNumericIdentity;
}

export interface Phase10C0VMovingStateRecord {
  readonly attachedIndices: readonly number[];
  readonly boundaryIndices: readonly number[];
  readonly fieldRows: readonly Phase10C0VMovingFieldRow[];
  readonly boundaryRows: readonly Phase10C0VMovingBoundaryRow[];
  readonly relaxation: Phase10C0VMovingRelaxationRecord;
}

export interface Phase10C0VMovingCycleRecord {
  readonly stepOrdinal: number;
  readonly deltaTimeSeconds: Phase10C0VNumericIdentity;
  readonly cumulativeTimeSeconds: Phase10C0VNumericIdentity;
  readonly maxKineticFillIncrement: Phase10C0VNumericIdentity;
  readonly placedFillDelta: Phase10C0VNumericIdentity;
  readonly saturationClippedFillDelta: Phase10C0VNumericIdentity;
  readonly kineticDemandDelta: Phase10C0VNumericIdentity;
  readonly attachedIndices: readonly number[];
}

export interface Phase10C0VMovingEventRecord {
  readonly eventOrdinal: number;
  readonly eventStepOrdinal: number;
  readonly tiedOrbitIndices: readonly number[];
  readonly maxRatePerSecond: Phase10C0VNumericIdentity;
  readonly nextRatePerSecond: Phase10C0VNumericIdentity;
  readonly tieMarginPerSecond: Phase10C0VNumericIdentity;
  readonly eventTimeSeconds: Phase10C0VNumericIdentity;
  readonly preEventFillRows: readonly {
    readonly linearIndex: number;
    readonly fill: Phase10C0VNumericIdentity;
  }[];
  readonly attachedIndices: readonly number[];
}

export interface Phase10C0VMovingLedgerRecord {
  readonly placedFillIceCells: Phase10C0VNumericIdentity;
  readonly saturationClippedFillIceCells: Phase10C0VNumericIdentity;
  readonly kineticDemandIceCells: Phase10C0VNumericIdentity;
  readonly holeFillDeficitIceCells: Phase10C0VNumericIdentity;
  readonly holeFillCount: number;
  readonly placedFillVaporUnits: Phase10C0VNumericIdentity;
}

export interface Phase10C0VMovingScalarRootRecord {
  readonly lowerEndpoint: Phase10C0VNumericIdentity;
  readonly upperEndpoint: Phase10C0VNumericIdentity;
  readonly selectedRoot: Phase10C0VNumericIdentity;
  readonly residual: Phase10C0VNumericIdentity;
  readonly relativeResidual: Phase10C0VNumericIdentity;
  readonly iterations: number;
}

export interface Phase10C0VMovingReferenceCandidate {
  readonly schema: "phase10-c0v-moving-reference-candidate-v1";
  readonly protocolId: string;
  readonly method: string;
  readonly activeCells: readonly Phase10C0VMovingActiveCellRow[];
  readonly neighborTable: readonly Phase10C0VMovingNeighborRow[];
  readonly initialState: Phase10C0VMovingStateRecord;
  readonly cycles: readonly Phase10C0VMovingCycleRecord[];
  readonly event: Phase10C0VMovingEventRecord;
  readonly postState: Phase10C0VMovingStateRecord;
  readonly ledger: Phase10C0VMovingLedgerRecord;
  readonly convergence: {
    readonly scalarRoot: Phase10C0VMovingScalarRootRecord;
    readonly preEvent: Phase10C0VMovingRelaxationRecord;
    readonly postEvent: Phase10C0VMovingRelaxationRecord;
  };
}

export interface Phase10C0VCheckGroup {
  readonly passed: boolean;
  readonly details: readonly string[];
}

export interface Phase10C0VMovingReferenceCheck {
  readonly schema: "phase10-c0v-moving-reference-check-v1";
  readonly protocolId: string;
  readonly method: string;
  readonly monotonicityBracketResidual: {
    readonly bracketed: boolean;
    readonly derivativePositive: boolean;
    readonly candidateResidualRelative: Phase10C0VNumericIdentity;
    readonly recomputedRoot: Phase10C0VNumericIdentity;
    readonly rootRelativeDifference: Phase10C0VNumericIdentity;
    readonly passed: boolean;
  };
  readonly topologyChecks: {
    readonly activeCellsExact: boolean;
    readonly neighborsExact: boolean;
    readonly initialSetsExact: boolean;
    readonly postSetsExact: boolean;
    readonly d6hOrbitExact: boolean;
    readonly passed: boolean;
    readonly details: readonly string[];
  };
  readonly fieldEquationChecks: {
    readonly preLInf: Phase10C0VNumericIdentity;
    readonly preWeightedL2: Phase10C0VNumericIdentity;
    readonly preFixedPointResidual: Phase10C0VNumericIdentity;
    readonly postLInf: Phase10C0VNumericIdentity;
    readonly postFixedPointResidual: Phase10C0VNumericIdentity;
    readonly shellExact: boolean;
    readonly zerosExact: boolean;
    readonly passed: boolean;
    readonly details: readonly string[];
  };
  readonly eventChecks: {
    readonly ratesTiedPositive: boolean;
    readonly otherRatesZero: boolean;
    readonly attachedNowByStep: readonly number[];
    readonly eventTimeRelativeDifference: Phase10C0VNumericIdentity;
    readonly passed: boolean;
    readonly details: readonly string[];
  };
  readonly ledgerChecks: {
    readonly placedAbsDifference: Phase10C0VNumericIdentity;
    readonly clippingAbsDifference: Phase10C0VNumericIdentity;
    readonly demandIdentityAbsResidual: Phase10C0VNumericIdentity;
    readonly vaporRelativeDifference: Phase10C0VNumericIdentity;
    readonly holeFillExact: boolean;
    readonly passed: boolean;
    readonly details: readonly string[];
  };
  readonly verdict: "pass" | "fail";
  readonly errors: readonly string[];
}

export interface Phase10C0VZeroExecutionRecord {
  readonly solverInvocations: 0;
  readonly referenceInvocations: 0;
  readonly productionInvocations: 0;
  readonly witnessesProduced: 0;
  readonly numericalEvaluations: 0;
  readonly scientificProcessHours: 0;
}

export interface Phase10C0VStaticPublicApiFinding {
  readonly findingId: string;
  readonly operandIds: readonly string[];
  readonly visibility: "public-accepted-state" | "not-specified";
  readonly contractChangeRequired: false;
  readonly evidenceLocator: string;
}

export interface Phase10C0VStaticSourceAudit {
  readonly auditId: string;
  readonly currentContractOnly: true;
  readonly inspectedArtifacts: readonly Phase10C0VArtifactIdentity[];
  readonly publicApiFindings: readonly Phase10C0VStaticPublicApiFinding[];
  readonly executionRecord: Phase10C0VZeroExecutionRecord;
}

export interface Phase10C0VStaticRefusalCandidate {
  readonly schema: "phase10-c0v-static-refusal-candidate-v1";
  readonly protocolId: string;
  readonly reasonCode: string;
  readonly currentContractScope: string;
  readonly unavailableOperands: readonly string[];
  readonly attemptedRoutes: StrictJson;
  readonly forbiddenSubstitutes: readonly string[];
  readonly contractEvidence: StrictJson;
  readonly executionRecord: Phase10C0VZeroExecutionRecord;
  readonly downstreamEffect: StrictJson;
  readonly claimBoundary: StrictJson;
}

export interface Phase10C0VStaticRefusalCheck {
  readonly schema: "phase10-c0v-static-refusal-check-v1";
  readonly protocolId: string;
  readonly method: string;
  readonly groundChecks: Phase10C0VCheckGroup;
  readonly routeChecks: Phase10C0VCheckGroup;
  readonly scopeChecks: Phase10C0VCheckGroup;
  readonly zeroExecutionChecks: Phase10C0VCheckGroup;
  readonly verdict: "pass" | "fail";
  readonly errors: readonly string[];
}

export interface Phase10C0VArtifactPaths {
  readonly protocol: string;
  readonly reference: string;
  readonly referenceRefusal: string;
  readonly witness: string;
  readonly evaluation: string;
  readonly result: string;
  readonly attemptLedger: string;
}

export interface Phase10C0VRadialProtocol {
  readonly schema: typeof PHASE10_C0V_RADIAL_PROTOCOL_SCHEMA;
  readonly protocolId: string;
  readonly layerId: "C0V-RADIAL";
  readonly frozenDate: string;
  readonly branch: "independent-reference";
  readonly bindings: Phase10C0VProtocolBindings;
  readonly artifactPaths: Phase10C0VArtifactPaths;
  readonly referenceOnlyCode: readonly Phase10C0VCodeIdentity[];
  readonly problem: StrictJson;
  readonly roster: StrictJson;
  readonly formulas: StrictJson;
  readonly referenceDerivation: StrictJson;
  readonly targetedCheck: StrictJson;
  readonly criteria: StrictJson;
  readonly negativeControls: StrictJson;
  readonly resourceBoundary: StrictJson;
  readonly independence: StrictJson;
  readonly terminalSemantics: StrictJson;
  readonly claimBoundary: StrictJson;
}

export interface Phase10C0VMovingProtocol {
  readonly schema: typeof PHASE10_C0V_MOVING_PROTOCOL_SCHEMA;
  readonly protocolId: string;
  readonly layerId: "C0V-MOVING-EVENT";
  readonly frozenDate: string;
  readonly branch: "independent-reference";
  readonly bindings: Phase10C0VProtocolBindings;
  readonly artifactPaths: Phase10C0VArtifactPaths;
  readonly referenceOnlyCode: readonly Phase10C0VCodeIdentity[];
  readonly fixture: StrictJson;
  readonly topology: StrictJson;
  readonly formulas: StrictJson;
  readonly referenceDerivation: StrictJson;
  readonly targetedCheck: StrictJson;
  readonly criteria: StrictJson;
  readonly negativeControls: StrictJson;
  readonly resourceBoundary: StrictJson;
  readonly independence: StrictJson;
  readonly terminalSemantics: StrictJson;
  readonly claimBoundary: StrictJson;
}

export interface Phase10C0VStaticProtocol {
  readonly schema: typeof PHASE10_C0V_STATIC_PROTOCOL_SCHEMA;
  readonly protocolId: string;
  readonly layerId: "C0V-STATIC";
  readonly frozenDate: string;
  readonly branch: "reference-refusal";
  readonly bindings: Phase10C0VProtocolBindings;
  readonly artifactPaths: Phase10C0VArtifactPaths;
  readonly referenceOnlyCode: readonly Phase10C0VCodeIdentity[];
  readonly refusalGrounds: StrictJson;
  readonly attemptedRoutes: StrictJson;
  readonly notApplicableObligations: StrictJson;
  readonly targetedCheck: StrictJson;
  readonly resourceBoundary: StrictJson;
  readonly independence: StrictJson;
  readonly terminalSemantics: StrictJson;
  readonly claimBoundary: StrictJson;
}

export interface Phase10C0VReferenceEnvelope {
  readonly schema:
    | typeof PHASE10_C0V_RADIAL_REFERENCE_SCHEMA
    | typeof PHASE10_C0V_MOVING_REFERENCE_SCHEMA;
  readonly referenceId: string;
  readonly protocolId: string;
  readonly layerId: "C0V-RADIAL" | "C0V-MOVING-EVENT";
  readonly branch: "independent-reference";
  readonly protocol: Phase10C0VArtifactIdentity;
  readonly freezeCommit: string;
  readonly createdAt: string;
  readonly generatorOutput: StrictJson;
  readonly independentCheck: StrictJson;
  readonly codeAndImportReceipt: Phase10C0VFinalCodeAndImportReceipt;
  readonly comparison: Phase10C0VReferenceComparison;
  readonly disposition: "reference-frozen" | "reference-discrepancy-refusal";
  readonly claimBoundary: StrictJson;
}

export interface Phase10C0VReferenceComparison {
  readonly method: "independent-reexecution";
  readonly expectedOutcome: "pass" | "refusal";
  readonly observedOutcome: "pass" | "fail" | "refusal";
  readonly errors: readonly string[];
}

export interface Phase10C0VReferenceRefusal {
  readonly schema: typeof PHASE10_C0V_REFERENCE_REFUSAL_SCHEMA;
  readonly refusalId: string;
  readonly protocolId: string;
  readonly layerId: Phase10C0VLayerId;
  readonly branch: "reference-refusal";
  readonly protocol: Phase10C0VArtifactIdentity;
  readonly freezeCommit: string;
  readonly createdAt: string;
  readonly reasonCode: string;
  readonly unavailableOperands: readonly string[];
  readonly attemptedRoutes: StrictJson;
  readonly forbiddenSubstitutes: readonly string[];
  readonly contractEvidence: StrictJson;
  readonly independentCheck: StrictJson;
  readonly executionRecord: StrictJson;
  readonly downstreamEffect: StrictJson;
  readonly claimBoundary: StrictJson;
}

export interface Phase10C0VSchemaContractEndpoint {
  readonly schemaId: string;
  readonly format: "json" | "jsonl-row" | "binary";
  readonly exactTopLevelFields: readonly string[];
  readonly fieldContracts: Readonly<Record<string, string>>;
  readonly nestedContracts: StrictJson;
  readonly enums: StrictJson;
  readonly nullRules: readonly string[];
  readonly invariants: readonly string[];
}

export interface Phase10C0VSchemaContracts {
  readonly schema: typeof PHASE10_C0V_SCHEMA_CONTRACTS_SCHEMA;
  readonly createdOn: string;
  readonly conformance: StrictJson;
  readonly definitions: StrictJson;
  readonly schemas: Readonly<Record<string, Phase10C0VSchemaContractEndpoint>>;
}

type JsonObject = { readonly [key: string]: StrictJson };

const SHA256 = /^[0-9a-f]{64}$/u;
const GIT_COMMIT = /^[0-9a-f]{40}$/u;
const BINARY64_HEX = /^[0-9a-f]{16}$/u;
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;
const EXPORT_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/u;

function invalid(label: string, detail: string): never {
  throw new Error(`${label} ${detail}`);
}

function root(value: unknown, label: string): JsonObject {
  return object(strictJsonSnapshot(value), label);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid(label, "must be an object");
  }
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    invalid(label, `keys differ: got [${actual.join(", ")}], expected [${wanted.join(", ")}]`);
  }
}

function string(value: StrictJson, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    invalid(label, "must be a nonempty string without surrounding whitespace");
  }
  return value;
}

function literal<T extends string>(value: StrictJson, expected: T, label: string): T {
  const result = string(value, label);
  if (result !== expected) invalid(label, `must equal ${expected}`);
  return expected;
}

function oneOf<T extends string>(
  value: StrictJson,
  allowed: readonly T[],
  label: string,
): T {
  const result = string(value, label);
  if (!(allowed as readonly string[]).includes(result)) {
    invalid(label, `must be one of ${allowed.join(", ")}`);
  }
  return result as T;
}

function array(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) invalid(label, "must be an array");
  return value;
}

function stringArray(value: StrictJson, label: string): readonly string[] {
  return Object.freeze(array(value, label).map((entry, index) =>
    string(entry, `${label}[${index}]`)));
}

function sortedUnique(values: readonly string[], label: string): void {
  for (let index = 1; index < values.length; index++) {
    if ((values[index - 1] as string) >= (values[index] as string)) {
      invalid(label, "must be sorted and unique");
    }
  }
}

function safePath(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (
    !SAFE_PATH.test(result) ||
    result.includes("\\") ||
    result.startsWith("/") ||
    result.endsWith("/") ||
    result.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    invalid(label, "must be a normalized repository-relative path");
  }
  return result;
}

function positiveInteger(value: StrictJson, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    invalid(label, "must be a positive safe integer");
  }
  return value;
}

function nonnegativeInteger(value: StrictJson, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    invalid(label, "must be a nonnegative safe integer");
  }
  return value;
}

function safeInteger(value: StrictJson, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    invalid(label, "must be a safe integer");
  }
  return value;
}

function finiteNumber(value: StrictJson, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Object.is(value, -0)) {
    invalid(label, "must be a finite JSON number other than negative zero");
  }
  return value;
}

function fixedNumber(value: StrictJson, expected: number, label: string): number {
  const result = finiteNumber(value, label);
  if (!Object.is(result, expected)) invalid(label, `must equal ${String(expected)}`);
  return result;
}

function fixedBoolean(value: StrictJson, expected: boolean, label: string): boolean {
  if (value !== expected) invalid(label, `must equal ${String(expected)}`);
  return expected;
}

function jsonBoolean(value: StrictJson, label: string): boolean {
  if (typeof value !== "boolean") invalid(label, "must be a boolean");
  return value;
}

function integerArray(value: StrictJson, label: string): readonly number[] {
  return Object.freeze(array(value, label).map((entry, index) =>
    nonnegativeInteger(entry, `${label}[${index}]`)));
}

function requireExactArray<T>(
  actual: readonly T[],
  expected: readonly T[],
  label: string,
): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    invalid(label, `must equal [${expected.join(", ")}]`);
  }
}

const PHYSICAL_CONSTANT_KEYS = [
  "kBoltzmannJPerK",
  "celsiusZeroK",
  "waterMoleculeMassKg",
  "iceNumberDensityPerM3",
  "diffusivityAir1AtmM2S",
  "standardAtmospherePa",
  "saturationPressurePrefactorMbar",
  "saturationPressureExponentK",
  "mbarToPa",
] as const;

function physicalConstants(value: StrictJson, label: string): Phase10C0VPhysicalConstants {
  const row = object(value, label);
  exactKeys(row, PHYSICAL_CONSTANT_KEYS, label);
  return Object.freeze({
    kBoltzmannJPerK: fixedNumber(row.kBoltzmannJPerK, 1.380649e-23, `${label}.kBoltzmannJPerK`),
    celsiusZeroK: fixedNumber(row.celsiusZeroK, 273.15, `${label}.celsiusZeroK`),
    waterMoleculeMassKg: fixedNumber(row.waterMoleculeMassKg, 3e-26, `${label}.waterMoleculeMassKg`),
    iceNumberDensityPerM3: fixedNumber(row.iceNumberDensityPerM3, 3.1e28, `${label}.iceNumberDensityPerM3`),
    diffusivityAir1AtmM2S: fixedNumber(row.diffusivityAir1AtmM2S, 2e-5, `${label}.diffusivityAir1AtmM2S`),
    standardAtmospherePa: fixedNumber(row.standardAtmospherePa, 101325, `${label}.standardAtmospherePa`),
    saturationPressurePrefactorMbar: fixedNumber(row.saturationPressurePrefactorMbar, 3.7e10, `${label}.saturationPressurePrefactorMbar`),
    saturationPressureExponentK: fixedNumber(row.saturationPressureExponentK, -6150, `${label}.saturationPressureExponentK`),
    mbarToPa: fixedNumber(row.mbarToPa, 100, `${label}.mbarToPa`),
  });
}

function artifactIdentity(value: StrictJson, label: string): Phase10C0VArtifactIdentity {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  const digest = string(row.sha256, `${label}.sha256`);
  if (!SHA256.test(digest)) invalid(`${label}.sha256`, "must be a lowercase SHA-256 digest");
  return Object.freeze({
    path: safePath(row.path, `${label}.path`),
    byteLength: positiveInteger(row.byteLength, `${label}.byteLength`),
    sha256: digest,
  });
}

function protocolBindings(value: StrictJson, label: string): Phase10C0VProtocolBindings {
  const row = object(value, label);
  exactKeys(row, ["foundation", "obligationMatrix", "schemaRegistry", "schemaContracts"], label);
  return Object.freeze({
    foundation: artifactIdentity(row.foundation, `${label}.foundation`),
    obligationMatrix: artifactIdentity(row.obligationMatrix, `${label}.obligationMatrix`),
    schemaRegistry: artifactIdentity(row.schemaRegistry, `${label}.schemaRegistry`),
    schemaContracts: artifactIdentity(row.schemaContracts, `${label}.schemaContracts`),
  });
}

function artifactPaths(value: StrictJson, label: string): Phase10C0VArtifactPaths {
  const row = object(value, label);
  const keys = [
    "protocol",
    "reference",
    "referenceRefusal",
    "witness",
    "evaluation",
    "result",
    "attemptLedger",
  ] as const;
  exactKeys(row, keys, label);
  return Object.freeze({
    protocol: safePath(row.protocol, `${label}.protocol`),
    reference: safePath(row.reference, `${label}.reference`),
    referenceRefusal: safePath(row.referenceRefusal, `${label}.referenceRefusal`),
    witness: safePath(row.witness, `${label}.witness`),
    evaluation: safePath(row.evaluation, `${label}.evaluation`),
    result: safePath(row.result, `${label}.result`),
    attemptLedger: safePath(row.attemptLedger, `${label}.attemptLedger`),
  });
}

function codeIdentity(value: StrictJson, label: string): Phase10C0VCodeIdentity {
  const row = object(value, label);
  exactKeys(row, ["role", "modulePath", "exportName", "byteLength", "sha256"], label);
  const modulePath = safePath(row.modulePath, `${label}.modulePath`);
  if (!modulePath.startsWith("runner/src/") || !modulePath.endsWith(".ts")) {
    invalid(`${label}.modulePath`, "must name a TypeScript module below runner/src");
  }
  const exportName = string(row.exportName, `${label}.exportName`);
  if (!EXPORT_NAME.test(exportName) || exportName === "default") {
    invalid(`${label}.exportName`, "must name a direct non-default export");
  }
  const digest = string(row.sha256, `${label}.sha256`);
  if (!SHA256.test(digest)) invalid(`${label}.sha256`, "must be a lowercase SHA-256 digest");
  return Object.freeze({
    role: oneOf(
      row.role,
      [
        "generator",
        "independent-checker",
        "shared-parser",
        "neutral-derive",
        "neutral-check",
        "neutral-publish",
      ],
      `${label}.role`,
    ),
    modulePath,
    exportName,
    byteLength: positiveInteger(row.byteLength, `${label}.byteLength`),
    sha256: digest,
  });
}

function codeIdentities(value: StrictJson, label: string): readonly Phase10C0VCodeIdentity[] {
  const result = array(value, label).map((entry, index) => codeIdentity(entry, `${label}[${index}]`));
  if (result.length !== 3) invalid(label, "must contain generator, independent-checker, and shared-parser");
  const roles = result.map((entry) => entry.role).sort();
  if (roles.join("|") !== "generator|independent-checker|shared-parser") {
    invalid(label, "must contain each reference-only role exactly once");
  }
  return Object.freeze(result);
}

const COMMON_RESOURCE_FIELDS = [
  "requiredRuntime",
  "timeoutSeconds",
  "projectedScratchBytes",
  "projectedPublicationBytes",
  "minimumFreeBytes",
  "solverProcessConcurrency",
  "s5ScientificProcessHours",
  "automaticRefinementOrFanOut",
  "capOutcome",
] as const;

const COMMON_INDEPENDENCE_FIELDS = [
  "scientificArithmeticSeparation",
  "permittedSharedCode",
  "sharedImportAllowlist",
  "forbiddenImports",
  "dependencyAudit",
  "testHooks",
  "productionImplementationPresent",
  "solverExecutionPresent",
] as const;

const COMMON_TERMINAL_FIELDS = [
  "earlyReferenceArtifact",
  "packetCompletion",
  "referenceReopener",
  "discrepancyOutcome",
  "aggregateRule",
] as const;

const COMMON_CLAIM_FIELDS = ["allowed", "forbidden"] as const;

const SHARED_IMPORT_ALLOWLIST = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase10-c0v-contracts.ts",
] as const;

const FORBIDDEN_REFERENCE_IMPORTS = [
  "core/**",
  "runner/src/phase10-execution-preflight.ts",
  "runner/src/phase10-executor-worker.ts",
  "runner/src/phase10-executor.ts",
  "solver-cpu/**",
  "solver-gpu/**",
] as const;

function validateCommonProtocolSections(row: JsonObject, label: string): void {
  const resourceLabel = `${label}.resourceBoundary`;
  const resource = object(row.resourceBoundary, resourceLabel);
  exactKeys(resource, COMMON_RESOURCE_FIELDS, resourceLabel);
  literal(resource.requiredRuntime, "v24.13.1", `${resourceLabel}.requiredRuntime`);
  positiveInteger(resource.timeoutSeconds, `${resourceLabel}.timeoutSeconds`);
  positiveInteger(resource.projectedScratchBytes, `${resourceLabel}.projectedScratchBytes`);
  positiveInteger(resource.projectedPublicationBytes, `${resourceLabel}.projectedPublicationBytes`);
  positiveInteger(resource.minimumFreeBytes, `${resourceLabel}.minimumFreeBytes`);
  fixedNumber(resource.solverProcessConcurrency, 1, `${resourceLabel}.solverProcessConcurrency`);
  fixedNumber(resource.s5ScientificProcessHours, 0, `${resourceLabel}.s5ScientificProcessHours`);
  fixedBoolean(resource.automaticRefinementOrFanOut, false, `${resourceLabel}.automaticRefinementOrFanOut`);
  literal(resource.capOutcome, "resource-refusal-and-maker-return", `${resourceLabel}.capOutcome`);

  const independenceLabel = `${label}.independence`;
  const independence = object(row.independence, independenceLabel);
  exactKeys(independence, COMMON_INDEPENDENCE_FIELDS, independenceLabel);
  string(independence.scientificArithmeticSeparation, `${independenceLabel}.scientificArithmeticSeparation`);
  const permittedSharedCode = stringArray(independence.permittedSharedCode, `${independenceLabel}.permittedSharedCode`);
  if (permittedSharedCode.length === 0) invalid(`${independenceLabel}.permittedSharedCode`, "must be nonempty");
  sortedUnique(permittedSharedCode, `${independenceLabel}.permittedSharedCode`);
  const sharedImportAllowlist = stringArray(independence.sharedImportAllowlist, `${independenceLabel}.sharedImportAllowlist`);
  requireExactArray(sharedImportAllowlist, SHARED_IMPORT_ALLOWLIST, `${independenceLabel}.sharedImportAllowlist`);
  const forbiddenImports = stringArray(independence.forbiddenImports, `${independenceLabel}.forbiddenImports`);
  requireExactArray(forbiddenImports, FORBIDDEN_REFERENCE_IMPORTS, `${independenceLabel}.forbiddenImports`);
  string(independence.dependencyAudit, `${independenceLabel}.dependencyAudit`);
  string(independence.testHooks, `${independenceLabel}.testHooks`);
  fixedBoolean(independence.productionImplementationPresent, false, `${independenceLabel}.productionImplementationPresent`);
  fixedBoolean(independence.solverExecutionPresent, false, `${independenceLabel}.solverExecutionPresent`);

  const terminalLabel = `${label}.terminalSemantics`;
  const terminal = object(row.terminalSemantics, terminalLabel);
  exactKeys(terminal, COMMON_TERMINAL_FIELDS, terminalLabel);
  for (const key of COMMON_TERMINAL_FIELDS) string(terminal[key], `${terminalLabel}.${key}`);

  const claimLabel = `${label}.claimBoundary`;
  const claim = object(row.claimBoundary, claimLabel);
  exactKeys(claim, COMMON_CLAIM_FIELDS, claimLabel);
  const allowed = stringArray(claim.allowed, `${claimLabel}.allowed`);
  const forbidden = stringArray(claim.forbidden, `${claimLabel}.forbidden`);
  if (allowed.length === 0 || forbidden.length === 0) invalid(claimLabel, "must name allowed and forbidden claims");
  sortedUnique(allowed, `${claimLabel}.allowed`);
  sortedUnique(forbidden, `${claimLabel}.forbidden`);
}

function validateResourceProjection(
  value: StrictJson,
  label: string,
  expected: readonly [number, number, number, number],
): void {
  const row = object(value, label);
  fixedNumber(row.timeoutSeconds, expected[0], `${label}.timeoutSeconds`);
  fixedNumber(row.projectedScratchBytes, expected[1], `${label}.projectedScratchBytes`);
  fixedNumber(row.projectedPublicationBytes, expected[2], `${label}.projectedPublicationBytes`);
  fixedNumber(row.minimumFreeBytes, expected[3], `${label}.minimumFreeBytes`);
}

function validateReferenceOnlyCodeRoster(
  identities: readonly Phase10C0VCodeIdentity[],
  expected: Readonly<Record<"generator" | "independent-checker" | "shared-parser", readonly [string, string]>>,
  label: string,
): void {
  for (const role of ["generator", "independent-checker", "shared-parser"] as const) {
    const identity = identities.find((entry) => entry.role === role);
    if (identity === undefined) invalid(label, `lacks ${role}`);
    const target = expected[role];
    if (identity.modulePath !== target[0] || identity.exportName !== target[1]) {
      invalid(`${label}.${role}`, `must name ${target[0]}#${target[1]}`);
    }
  }
}

function commonProtocol(
  row: JsonObject,
  label: string,
  schema: string,
  layerId: Phase10C0VLayerId,
  branch: Phase10C0VBranch,
): {
  readonly protocolId: string;
  readonly frozenDate: string;
  readonly bindings: Phase10C0VProtocolBindings;
  readonly artifactPaths: Phase10C0VArtifactPaths;
  readonly referenceOnlyCode: readonly Phase10C0VCodeIdentity[];
} {
  literal(row.schema, schema, `${label}.schema`);
  literal(row.layerId, layerId, `${label}.layerId`);
  literal(row.branch, branch, `${label}.branch`);
  validateCommonProtocolSections(row, label);
  const bindings = protocolBindings(row.bindings, `${label}.bindings`);
  const expectedBindingPaths = {
    foundation: "research/phase10-c0v-foundation-v1.json",
    obligationMatrix: "research/phase10-obligation-matrix-v1.json",
    schemaRegistry: "research/phase10-c0v-artifact-schema-registry-v1.json",
    schemaContracts: "research/phase10-c0v-schema-contracts-v1.json",
  } as const;
  for (const key of Object.keys(expectedBindingPaths) as (keyof typeof expectedBindingPaths)[]) {
    if (bindings[key].path !== expectedBindingPaths[key]) {
      invalid(`${label}.bindings.${key}.path`, `must equal ${expectedBindingPaths[key]}`);
    }
  }
  const paths = artifactPaths(row.artifactPaths, `${label}.artifactPaths`);
  const slug = layerId === "C0V-RADIAL" ? "radial" : layerId === "C0V-STATIC" ? "static" : "moving";
  const expectedArtifactPaths: Phase10C0VArtifactPaths = {
    protocol: `research/phase10-c0v-${slug}-protocol-v1.json`,
    reference: `evidence/phase10-numerical-verification-v1/c0v-${slug}-reference.json`,
    referenceRefusal: `evidence/phase10-numerical-verification-v1/c0v-${slug}-reference-refusal.json`,
    witness: `evidence/phase10-numerical-verification-v1/c0v-${slug}-witness.bin`,
    evaluation: `evidence/phase10-numerical-verification-v1/c0v-${slug}-evaluation.json`,
    result: `evidence/phase10-numerical-verification-v1/c0v-${slug}-result.json`,
    attemptLedger: `evidence/phase10-numerical-verification-v1/c0v-${slug}-attempts.jsonl`,
  };
  for (const key of Object.keys(expectedArtifactPaths) as (keyof Phase10C0VArtifactPaths)[]) {
    if (paths[key] !== expectedArtifactPaths[key]) {
      invalid(`${label}.artifactPaths.${key}`, `must equal ${expectedArtifactPaths[key]}`);
    }
  }
  return {
    protocolId: string(row.protocolId, `${label}.protocolId`),
    frozenDate: literal(row.frozenDate, "2026-08-21", `${label}.frozenDate`),
    bindings,
    artifactPaths: paths,
    referenceOnlyCode: codeIdentities(row.referenceOnlyCode, `${label}.referenceOnlyCode`),
  };
}

const RADIAL_PROTOCOL_FIELDS = [
  "schema",
  "protocolId",
  "layerId",
  "frozenDate",
  "branch",
  "bindings",
  "artifactPaths",
  "referenceOnlyCode",
  "problem",
  "roster",
  "formulas",
  "referenceDerivation",
  "targetedCheck",
  "criteria",
  "negativeControls",
  "resourceBoundary",
  "independence",
  "terminalSemantics",
  "claimBoundary",
] as const;

export function parsePhase10C0VRadialProtocol(value: unknown): Phase10C0VRadialProtocol {
  const label = "Phase 10 C0V radial protocol";
  const row = root(value, label);
  exactKeys(row, RADIAL_PROTOCOL_FIELDS, label);
  const common = commonProtocol(
    row,
    label,
    PHASE10_C0V_RADIAL_PROTOCOL_SCHEMA,
    "C0V-RADIAL",
    "independent-reference",
  );
  validateResourceProjection(row.resourceBoundary, `${label}.resourceBoundary`, [300, 8 * 1024 * 1024, 2 * 1024 * 1024, 64 * 1024 * 1024]);
  validateReferenceOnlyCodeRoster(common.referenceOnlyCode, {
    generator: ["runner/src/phase10-c0v-radial-reference-derive.ts", "derivePhase10C0VRadialReference"],
    "independent-checker": ["runner/src/phase10-c0v-radial-reference-check.ts", "independentlyCheckPhase10C0VRadialReference"],
    "shared-parser": ["runner/src/phase10-c0v-contracts.ts", "parsePhase10C0VRadialProtocol"],
  }, `${label}.referenceOnlyCode`);
  const protocol = Object.freeze({
    schema: PHASE10_C0V_RADIAL_PROTOCOL_SCHEMA,
    ...common,
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    problem: strictJsonSnapshot(row.problem),
    roster: strictJsonSnapshot(row.roster),
    formulas: strictJsonSnapshot(row.formulas),
    referenceDerivation: strictJsonSnapshot(row.referenceDerivation),
    targetedCheck: strictJsonSnapshot(row.targetedCheck),
    criteria: strictJsonSnapshot(row.criteria),
    negativeControls: strictJsonSnapshot(row.negativeControls),
    resourceBoundary: strictJsonSnapshot(row.resourceBoundary),
    independence: strictJsonSnapshot(row.independence),
    terminalSemantics: strictJsonSnapshot(row.terminalSemantics),
    claimBoundary: strictJsonSnapshot(row.claimBoundary),
  });
  phase10C0VRadialReferenceInput(protocol);
  return protocol;
}

const RADIAL_PROBLEM_FIELDS = [
  "geometry",
  "radiusM",
  "farRadiusM",
  "sigmaInfinity",
  "tempC",
  "pressurePa",
  "alphaHKConst",
  "physicalConstants",
  "provenance",
] as const;
const RADIAL_ROSTER_FIELDS = [
  "caseCount",
  "automaticRefinement",
  "nodeRule",
  "orderDisposition",
  "cases",
] as const;
const RADIAL_CASE_FIELDS = [
  "caseId",
  "requestedSpacingUm",
  "requestedSpacingM",
  "expectedIntervalCount",
  "expectedNodeCount",
  "expectedActualSpacingM",
  "actualSpacingUmRational",
] as const;
const RADIAL_CRITERIA_FIELDS = [
  "allCasesRequired",
  "exactOperandEcho",
  "exactNodeRoster",
  "exactActualSpacing",
  "surfaceRelative",
  "velocityRelative",
  "fieldRelativeLInf",
  "fieldWeightedRelativeL2",
  "shellNormalized",
  "uniformNormalizedLInf",
  "robinResidualNormalized",
  "generatorCheckerAgreement",
  "comparisonOperator",
] as const;
const RADIAL_FORMULA_FIELDS = [
  "temperatureK",
  "saturationPressurePa",
  "saturationNumberDensityPerM3",
  "diffusivityM2S",
  "thermalSpeedMS",
  "kineticVelocityMS",
  "kineticLengthM",
  "solutionFamily",
  "shellEquation",
  "robinEquation",
  "growthVelocityFluxMS",
  "growthVelocityKineticMS",
  "uniformControl",
  "fieldRelativeLInf",
  "fieldWeightedRelativeL2",
  "sphericalTrapezoidWeights",
  "normalizedResiduals",
] as const;
const RADIAL_REFERENCE_DERIVATION_FIELDS = [
  "method",
  "unknowns",
  "caseProcedure",
  "uniformControlProcedure",
  "actualSpacingRule",
  "outputValuePolicy",
] as const;
const RADIAL_TARGETED_CHECK_FIELDS = [
  "method",
  "independentParameterization",
  "checks",
  "aggregateRule",
  "generatorImportAllowed",
] as const;

function validateNegativeControls(
  value: StrictJson,
  expectedIds: readonly string[],
  label: string,
): void {
  const rows = array(value, label);
  if (rows.length !== expectedIds.length) invalid(label, `must contain ${expectedIds.length} controls`);
  const ids = rows.map((entry, index) => {
    const controlLabel = `${label}[${index}]`;
    const row = object(entry, controlLabel);
    exactKeys(
      row,
      ["negativeControlId", "mutation", "independentWitness", "attackedCheck", "expected"],
      controlLabel,
    );
    for (const key of ["negativeControlId", "mutation", "independentWitness", "attackedCheck", "expected"] as const) {
      string(row[key], `${controlLabel}.${key}`);
    }
    return row.negativeControlId as string;
  });
  requireExactArray(ids, expectedIds, `${label} IDs`);
}

export function phase10C0VRadialReferenceInput(
  protocol: Phase10C0VRadialProtocol,
): Phase10C0VRadialReferenceInput {
  const problemLabel = "Phase 10 C0V radial protocol.problem";
  const problem = object(protocol.problem, problemLabel);
  exactKeys(problem, RADIAL_PROBLEM_FIELDS, problemLabel);
  literal(problem.geometry, "finite-spherical-shell", `${problemLabel}.geometry`);
  const operands = Object.freeze({
    radiusM: fixedNumber(problem.radiusM, 3e-6, `${problemLabel}.radiusM`),
    farRadiusM: fixedNumber(problem.farRadiusM, 16.8e-6, `${problemLabel}.farRadiusM`),
    sigmaInfinity: fixedNumber(problem.sigmaInfinity, 0.0075, `${problemLabel}.sigmaInfinity`),
    tempC: fixedNumber(problem.tempC, -5, `${problemLabel}.tempC`),
    pressurePa: fixedNumber(problem.pressurePa, 101325, `${problemLabel}.pressurePa`),
    alphaHKConst: fixedNumber(problem.alphaHKConst, 0.393, `${problemLabel}.alphaHKConst`),
    physicalConstants: physicalConstants(problem.physicalConstants, `${problemLabel}.physicalConstants`),
  });
  const provenanceRows = array(problem.provenance, `${problemLabel}.provenance`);
  const expectedProvenance = [
    [
      "alphaHKConst",
      "idealized-finite-shell-spherical-control-constant",
      "solver-cpu/test/spherical-reference.test.ts",
      "solver-cpu/test/spherical-reference.test.ts#COEFFICIENT",
      "phase10-control-test-fixture-only-no-temperature-law-or-validation-claim",
    ],
    [
      "environment-and-metrological-constants",
      "source-explicit-and-authoritative-exact-mixture",
      "docs/libbrecht-parameters.md",
      "implemented physical inputs and exact definitions",
      "copied-as-frozen-operands",
    ],
    [
      "finite-shell-geometry-and-grid-roster",
      "phase10-control-design",
      "docs/plans/phase-10-evidence-verification-execution.md",
      "S5 branch and checkpoint design",
      "preimplementation-frozen",
    ],
  ] as const;
  if (provenanceRows.length !== expectedProvenance.length) {
    invalid(`${problemLabel}.provenance`, "must contain the three frozen provenance rows");
  }
  for (const [index, entry] of provenanceRows.entries()) {
    const label = `${problemLabel}.provenance[${index}]`;
    const row = object(entry, label);
    exactKeys(row, ["operandId", "provenanceClass", "source", "locator", "status"], label);
    const expected = expectedProvenance[index] as (typeof expectedProvenance)[number];
    for (const [fieldIndex, key] of ["operandId", "provenanceClass", "source", "locator", "status"].entries()) {
      literal(row[key] as StrictJson, expected[fieldIndex] as string, `${label}.${key}`);
    }
  }

  const rosterLabel = "Phase 10 C0V radial protocol.roster";
  const roster = object(protocol.roster, rosterLabel);
  exactKeys(roster, RADIAL_ROSTER_FIELDS, rosterLabel);
  fixedNumber(roster.caseCount, 4, `${rosterLabel}.caseCount`);
  fixedBoolean(roster.automaticRefinement, false, `${rosterLabel}.automaticRefinement`);
  literal(
    roster.orderDisposition,
    "not-applicable-exact-u-roundoff-control",
    `${rosterLabel}.orderDisposition`,
  );
  const nodeRule = object(roster.nodeRule, `${rosterLabel}.nodeRule`);
  exactKeys(nodeRule, ["formula", "rounding", "minimumNodes", "spanDefinition"], `${rosterLabel}.nodeRule`);
  literal(
    nodeRule.formula,
    "max(3, floor((farRadiusM - radiusM) / requestedSpacingM + 1 / 2) + 1)",
    `${rosterLabel}.nodeRule.formula`,
  );
  literal(nodeRule.rounding, "nearest-with-positive-half-up", `${rosterLabel}.nodeRule.rounding`);
  fixedNumber(nodeRule.minimumNodes, 3, `${rosterLabel}.nodeRule.minimumNodes`);
  literal(
    nodeRule.spanDefinition,
    "farRadiusM - radiusM",
    `${rosterLabel}.nodeRule.spanDefinition`,
  );
  const expectedCases = [
    ["radial-dr-0p7um", 0.7, 0.7e-6, 20, 21, (16.8e-6 - 3e-6) / 20, 69, 100],
    ["radial-dr-0p35um", 0.35, 0.35e-6, 39, 40, (16.8e-6 - 3e-6) / 39, 23, 65],
    ["radial-dr-0p175um", 0.175, 0.175e-6, 79, 80, (16.8e-6 - 3e-6) / 79, 69, 395],
    ["radial-dr-0p0875um", 0.0875, 0.0875e-6, 158, 159, (16.8e-6 - 3e-6) / 158, 69, 790],
  ] as const;
  const caseRows = array(roster.cases, `${rosterLabel}.cases`);
  if (caseRows.length !== expectedCases.length) invalid(`${rosterLabel}.cases`, "must contain four cases");
  const cases = caseRows.map((entry, index) => {
    const label = `${rosterLabel}.cases[${index}]`;
    const row = object(entry, label);
    exactKeys(row, RADIAL_CASE_FIELDS, label);
    const expected = expectedCases[index] as (typeof expectedCases)[number];
    literal(row.caseId, expected[0], `${label}.caseId`);
    fixedNumber(row.requestedSpacingUm, expected[1], `${label}.requestedSpacingUm`);
    const requestedSpacingM = fixedNumber(row.requestedSpacingM, expected[2], `${label}.requestedSpacingM`);
    const expectedIntervalCount = fixedNumber(row.expectedIntervalCount, expected[3], `${label}.expectedIntervalCount`);
    const expectedNodeCount = fixedNumber(row.expectedNodeCount, expected[4], `${label}.expectedNodeCount`);
    const expectedActualSpacingM = fixedNumber(row.expectedActualSpacingM, expected[5], `${label}.expectedActualSpacingM`);
    const rational = object(row.actualSpacingUmRational, `${label}.actualSpacingUmRational`);
    exactKeys(rational, ["numerator", "denominator"], `${label}.actualSpacingUmRational`);
    const numerator = fixedNumber(rational.numerator, expected[6], `${label}.actualSpacingUmRational.numerator`);
    const denominator = fixedNumber(rational.denominator, expected[7], `${label}.actualSpacingUmRational.denominator`);
    return Object.freeze({
      caseId: expected[0],
      requestedSpacingM,
      expectedIntervalCount,
      expectedNodeCount,
      expectedActualSpacingM,
      actualSpacingUmNumerator: numerator,
      actualSpacingUmDenominator: denominator,
    });
  });

  const criteriaLabel = "Phase 10 C0V radial protocol.criteria";
  const criteria = object(protocol.criteria, criteriaLabel);
  exactKeys(criteria, RADIAL_CRITERIA_FIELDS, criteriaLabel);
  fixedBoolean(criteria.allCasesRequired, true, `${criteriaLabel}.allCasesRequired`);
  fixedBoolean(criteria.exactOperandEcho, true, `${criteriaLabel}.exactOperandEcho`);
  fixedBoolean(criteria.exactNodeRoster, true, `${criteriaLabel}.exactNodeRoster`);
  fixedBoolean(criteria.exactActualSpacing, true, `${criteriaLabel}.exactActualSpacing`);
  literal(criteria.comparisonOperator, "less-than-or-equal", `${criteriaLabel}.comparisonOperator`);
  const tolerances = Object.freeze({
    surfaceRelative: fixedNumber(criteria.surfaceRelative, 1e-9, `${criteriaLabel}.surfaceRelative`),
    velocityRelative: fixedNumber(criteria.velocityRelative, 1e-9, `${criteriaLabel}.velocityRelative`),
    fieldRelativeLInf: fixedNumber(criteria.fieldRelativeLInf, 1e-9, `${criteriaLabel}.fieldRelativeLInf`),
    fieldWeightedRelativeL2: fixedNumber(criteria.fieldWeightedRelativeL2, 1e-9, `${criteriaLabel}.fieldWeightedRelativeL2`),
    shellNormalized: fixedNumber(criteria.shellNormalized, 1e-12, `${criteriaLabel}.shellNormalized`),
    uniformNormalizedLInf: fixedNumber(criteria.uniformNormalizedLInf, 1e-12, `${criteriaLabel}.uniformNormalizedLInf`),
    robinResidualNormalized: fixedNumber(criteria.robinResidualNormalized, 1e-9, `${criteriaLabel}.robinResidualNormalized`),
    generatorCheckerAgreement: fixedNumber(criteria.generatorCheckerAgreement, 1e-13, `${criteriaLabel}.generatorCheckerAgreement`),
  });
  const formulasLabel = "Phase 10 C0V radial protocol.formulas";
  const formulas = object(protocol.formulas, formulasLabel);
  exactKeys(formulas, RADIAL_FORMULA_FIELDS, formulasLabel);
  for (const key of RADIAL_FORMULA_FIELDS) string(formulas[key], `${formulasLabel}.${key}`);
  const derivationLabel = "Phase 10 C0V radial protocol.referenceDerivation";
  const derivation = object(protocol.referenceDerivation, derivationLabel);
  exactKeys(derivation, RADIAL_REFERENCE_DERIVATION_FIELDS, derivationLabel);
  for (const key of ["method", "actualSpacingRule", "outputValuePolicy"] as const) {
    string(derivation[key], `${derivationLabel}.${key}`);
  }
  literal(
    derivation.method,
    "independent-2x2-harmonic-coefficients",
    `${derivationLabel}.method`,
  );
  const unknowns = stringArray(derivation.unknowns, `${derivationLabel}.unknowns`);
  requireExactArray(unknowns, ["harmonicConstant", "harmonicInverseRadiusCoefficientM"], `${derivationLabel}.unknowns`);
  for (const key of ["caseProcedure", "uniformControlProcedure"] as const) {
    const steps = stringArray(derivation[key], `${derivationLabel}.${key}`);
    if (steps.length === 0) invalid(`${derivationLabel}.${key}`, "must be nonempty");
  }
  literal(
    derivation.outputValuePolicy,
    "no-actual-output-values-in-protocol",
    `${derivationLabel}.outputValuePolicy`,
  );
  const targetedLabel = "Phase 10 C0V radial protocol.targetedCheck";
  const targeted = object(protocol.targetedCheck, targetedLabel);
  exactKeys(targeted, RADIAL_TARGETED_CHECK_FIELDS, targetedLabel);
  for (const key of ["method", "independentParameterization", "aggregateRule"] as const) {
    string(targeted[key], `${targetedLabel}.${key}`);
  }
  literal(targeted.method, "independent-closed-form-lambda", `${targetedLabel}.method`);
  const targetedChecks = stringArray(targeted.checks, `${targetedLabel}.checks`);
  if (targetedChecks.length === 0) invalid(`${targetedLabel}.checks`, "must be nonempty");
  fixedBoolean(targeted.generatorImportAllowed, false, `${targetedLabel}.generatorImportAllowed`);
  validateNegativeControls(
    protocol.negativeControls,
    ["nc-radial-finite-shell-term", "nc-radial-forged-summary", "nc-radial-robin-coefficient"],
    "Phase 10 C0V radial protocol.negativeControls",
  );
  return Object.freeze({ protocolId: protocol.protocolId, operands, roster: Object.freeze(cases), tolerances });
}

const MOVING_PROTOCOL_FIELDS = [
  "schema",
  "protocolId",
  "layerId",
  "frozenDate",
  "branch",
  "bindings",
  "artifactPaths",
  "referenceOnlyCode",
  "fixture",
  "topology",
  "formulas",
  "referenceDerivation",
  "targetedCheck",
  "criteria",
  "negativeControls",
  "resourceBoundary",
  "independence",
  "terminalSemantics",
  "claimBoundary",
] as const;

export function parsePhase10C0VMovingProtocol(value: unknown): Phase10C0VMovingProtocol {
  const label = "Phase 10 C0V moving-event protocol";
  const row = root(value, label);
  exactKeys(row, MOVING_PROTOCOL_FIELDS, label);
  const common = commonProtocol(
    row,
    label,
    PHASE10_C0V_MOVING_PROTOCOL_SCHEMA,
    "C0V-MOVING-EVENT",
    "independent-reference",
  );
  validateResourceProjection(row.resourceBoundary, `${label}.resourceBoundary`, [1800, 32 * 1024 * 1024, 8 * 1024 * 1024, 128 * 1024 * 1024]);
  validateReferenceOnlyCodeRoster(common.referenceOnlyCode, {
    generator: ["runner/src/phase10-c0v-moving-reference-derive.ts", "derivePhase10C0VMovingReference"],
    "independent-checker": ["runner/src/phase10-c0v-moving-reference-check.ts", "independentlyCheckPhase10C0VMovingReference"],
    "shared-parser": ["runner/src/phase10-c0v-contracts.ts", "parsePhase10C0VMovingProtocol"],
  }, `${label}.referenceOnlyCode`);
  const protocol = Object.freeze({
    schema: PHASE10_C0V_MOVING_PROTOCOL_SCHEMA,
    ...common,
    layerId: "C0V-MOVING-EVENT",
    branch: "independent-reference",
    fixture: strictJsonSnapshot(row.fixture),
    topology: strictJsonSnapshot(row.topology),
    formulas: strictJsonSnapshot(row.formulas),
    referenceDerivation: strictJsonSnapshot(row.referenceDerivation),
    targetedCheck: strictJsonSnapshot(row.targetedCheck),
    criteria: strictJsonSnapshot(row.criteria),
    negativeControls: strictJsonSnapshot(row.negativeControls),
    resourceBoundary: strictJsonSnapshot(row.resourceBoundary),
    independence: strictJsonSnapshot(row.independence),
    terminalSemantics: strictJsonSnapshot(row.terminalSemantics),
    claimBoundary: strictJsonSnapshot(row.claimBoundary),
  });
  phase10C0VMovingReferenceInput(protocol);
  return protocol;
}

const MOVING_FIXTURE_FIELDS = [
  "surfacePolicy",
  "dimensions",
  "center",
  "domain",
  "farField",
  "seedRadius",
  "seedThickness",
  "tempC",
  "sigmaInfinity",
  "dxUm",
  "pressurePa",
  "paramSet",
  "cflFill",
  "relaxTol",
  "divTol",
  "maxSweeps",
  "noiseEpsilon",
  "rngSeed",
  "physicalConstants",
  "kineticInputs",
  "provenance",
] as const;
const MOVING_TOPOLOGY_FIELDS = [
  "linearIndexRule",
  "neighborOffsets",
  "initialAttachedIndices",
  "initialBoundaryIndices",
  "tiedOrbitIndices",
  "postAttachedIndices",
  "postBoundaryIndices",
  "eventOrdinal",
  "d6hClosureRule",
] as const;
const MOVING_FORMULA_FIELDS = [
  "environmentEquations",
  "inPlaneEquation",
  "verticalEquation",
  "opposingEquation",
  "boundaryEquation",
  "preEventScalarEquation",
  "evaluationOrder",
  "bisection",
  "eventUpdate",
  "ledgerIdentity",
  "driftBound",
] as const;
const MOVING_CRITERIA_FIELDS = [
  "allChecksRequired",
  "scalarEquationResidualRelative",
  "preEventFieldLInf",
  "preEventFieldWeightedL2",
  "axialRateRelative",
  "axialRatesBitIdenticalPositive",
  "otherInitialBoundaryRatesBitwiseZero",
  "attachedNowByStep",
  "eventTimeRelative",
  "maxKineticIncrementAbsolute",
  "exactTopologyNeighborD6hSets",
  "postFieldShellBitwiseSigmaInfinity",
  "postFieldAttachedAndWallBitwiseZero",
  "placedFillAbsolute",
  "clippingAbsolute",
  "vaporLedgerRelative",
  "eventChainRelative",
  "holeFillExact",
  "postFieldFixedPointResidual",
  "relaxationCriteria",
  "comparisonOperators",
] as const;
const MOVING_REFERENCE_DERIVATION_FIELDS = [
  "method",
  "integerTopologyRule",
  "nonlinearSolve",
  "fieldIteration",
  "eventProcedure",
  "postEventProcedure",
  "ledgerProcedure",
  "outputValuePolicy",
] as const;
const MOVING_TARGETED_CHECK_FIELDS = [
  "method",
  "independentArithmetic",
  "checks",
  "tieRule",
  "aggregateRule",
  "generatorImportAllowed",
] as const;

function integerTuple3(value: StrictJson, label: string): readonly [number, number, number] {
  const entries = array(value, label);
  if (entries.length !== 3) invalid(label, "must contain exactly three integers");
  const parsed = entries.map((entry, index) => {
    if (typeof entry !== "number" || !Number.isSafeInteger(entry)) {
      invalid(`${label}[${index}]`, "must be a safe integer");
    }
    return entry;
  });
  return Object.freeze([parsed[0] as number, parsed[1] as number, parsed[2] as number]);
}

export function phase10C0VMovingReferenceInput(
  protocol: Phase10C0VMovingProtocol,
): Phase10C0VMovingReferenceInput {
  const fixtureLabel = "Phase 10 C0V moving protocol.fixture";
  const row = object(protocol.fixture, fixtureLabel);
  exactKeys(row, MOVING_FIXTURE_FIELDS, fixtureLabel);
  const dimensions = integerTuple3(row.dimensions, `${fixtureLabel}.dimensions`);
  requireExactArray(dimensions, [3, 3, 5], `${fixtureLabel}.dimensions`);
  const center = integerTuple3(row.center, `${fixtureLabel}.center`);
  requireExactArray(center, [1, 1, 2], `${fixtureLabel}.center`);
  const kineticLabel = `${fixtureLabel}.kineticInputs`;
  const kinetic = object(row.kineticInputs, kineticLabel);
  exactKeys(kinetic, ["basalPrefactor", "basalSigma0", "robinGeometry", "fillGeometry"], kineticLabel);
  const expectedProvenance = [
    [
      "surface-policy-and-coupled-formulas",
      "accepted-solver-specification",
      "docs/attachment-kinetics.md",
      "docs/attachment-kinetics.md#4.4-the-surface-operator-specification",
      "aggregate-hv-g1h1-v6-production-contract-copied-for-independent-control",
    ],
    [
      "CAK_A1-minus5C-basal-kinetic-inputs",
      "P2-composite-source-digitization-and-cited-A1-modeling-choice",
      "docs/libbrecht-parameters.md",
      "Section 3 Branch 1, minus-5-C row and parameter-set provenance",
      "basalPrefactor-1-and-basalSigma0-0.007-copied-for-this-control",
    ],
    [
      "environment-and-metrological-constants",
      "source-explicit-and-authoritative-exact-mixture",
      "docs/libbrecht-parameters.md",
      "Section 1 governing equations and Section 2 physical constants and exact metrological definitions",
      "copied-as-frozen-operands-with-signed-saturation-pressure-exponent",
    ],
    [
      "moving-control-geometry-grid-and-step",
      "phase10-control-design",
      "docs/plans/phase-10-evidence-verification-execution.md",
      "S5 branch and checkpoint design",
      "tiny-first-event-control-only-no-habit-apparatus-mechanism-or-physical-realism-claim",
    ],
  ] as const;
  const provenanceRows = array(row.provenance, `${fixtureLabel}.provenance`);
  if (provenanceRows.length !== expectedProvenance.length) {
    invalid(`${fixtureLabel}.provenance`, "must contain the four frozen provenance rows");
  }
  for (const [index, entry] of provenanceRows.entries()) {
    const provenanceLabel = `${fixtureLabel}.provenance[${index}]`;
    const provenance = object(entry, provenanceLabel);
    const fields = ["operandId", "provenanceClass", "source", "locator", "status"] as const;
    exactKeys(provenance, fields, provenanceLabel);
    const expected = expectedProvenance[index] as (typeof expectedProvenance)[number];
    fields.forEach((field, fieldIndex) => {
      literal(provenance[field], expected[fieldIndex] as string, `${provenanceLabel}.${field}`);
    });
  }
  const fixture: Phase10C0VMovingFixture = Object.freeze({
    surfacePolicy: literal(row.surfacePolicy, "aggregate-hv-g1h1-v6", `${fixtureLabel}.surfacePolicy`),
    dimensions,
    center,
    domain: literal(row.domain, "hexPrism", `${fixtureLabel}.domain`),
    farField: literal(row.farField, "dirichlet", `${fixtureLabel}.farField`),
    seedRadius: fixedNumber(row.seedRadius, 0, `${fixtureLabel}.seedRadius`) as 0,
    seedThickness: fixedNumber(row.seedThickness, 1, `${fixtureLabel}.seedThickness`) as 1,
    tempC: fixedNumber(row.tempC, -5, `${fixtureLabel}.tempC`),
    sigmaInfinity: fixedNumber(row.sigmaInfinity, 0.0075, `${fixtureLabel}.sigmaInfinity`),
    dxUm: fixedNumber(row.dxUm, 0.35, `${fixtureLabel}.dxUm`),
    pressurePa: fixedNumber(row.pressurePa, 101325, `${fixtureLabel}.pressurePa`),
    paramSet: literal(row.paramSet, "CAK_A1", `${fixtureLabel}.paramSet`),
    cflFill: fixedNumber(row.cflFill, 0.26, `${fixtureLabel}.cflFill`),
    relaxTol: fixedNumber(row.relaxTol, 1e-13, `${fixtureLabel}.relaxTol`),
    divTol: fixedNumber(row.divTol, 1e-10, `${fixtureLabel}.divTol`),
    maxSweeps: fixedNumber(row.maxSweeps, 100000, `${fixtureLabel}.maxSweeps`),
    noiseEpsilon: fixedNumber(row.noiseEpsilon, 0, `${fixtureLabel}.noiseEpsilon`) as 0,
    rngSeed: fixedNumber(row.rngSeed, 0, `${fixtureLabel}.rngSeed`) as 0,
    physicalConstants: physicalConstants(row.physicalConstants, `${fixtureLabel}.physicalConstants`),
    kineticInputs: Object.freeze({
      basalPrefactor: fixedNumber(kinetic.basalPrefactor, 1, `${kineticLabel}.basalPrefactor`) as 1,
      basalSigma0: fixedNumber(kinetic.basalSigma0, 0.007, `${kineticLabel}.basalSigma0`),
      robinGeometry: fixedNumber(kinetic.robinGeometry, 1, `${kineticLabel}.robinGeometry`) as 1,
      fillGeometry: fixedNumber(kinetic.fillGeometry, 1, `${kineticLabel}.fillGeometry`) as 1,
    }),
  });

  const topologyLabel = "Phase 10 C0V moving protocol.topology";
  const topologyRow = object(protocol.topology, topologyLabel);
  exactKeys(topologyRow, MOVING_TOPOLOGY_FIELDS, topologyLabel);
  const neighborOffsets = array(topologyRow.neighborOffsets, `${topologyLabel}.neighborOffsets`)
    .map((entry, index) => integerTuple3(entry, `${topologyLabel}.neighborOffsets[${index}]`));
  const expectedOffsets = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [1, -1, 0],
    [-1, 1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ] as const;
  if (
    neighborOffsets.length !== expectedOffsets.length ||
    neighborOffsets.some((offset, index) =>
      offset.some((coordinate, coordinateIndex) =>
        coordinate !== expectedOffsets[index]?.[coordinateIndex]))
  ) {
    invalid(`${topologyLabel}.neighborOffsets`, "must equal the frozen ordered D6h-neighbor offsets");
  }
  const parseFrozenSet = (field: keyof Pick<
    Phase10C0VMovingTopology,
    "initialAttachedIndices" | "initialBoundaryIndices" | "tiedOrbitIndices" |
      "postAttachedIndices" | "postBoundaryIndices"
  >, expected: readonly number[]): readonly number[] => {
    const result = integerArray(topologyRow[field], `${topologyLabel}.${field}`);
    requireExactArray(result, expected, `${topologyLabel}.${field}`);
    return result;
  };
  const topology: Phase10C0VMovingTopology = Object.freeze({
    linearIndexRule: literal(
      topologyRow.linearIndexRule,
      "i + ni * (j + nj * k)",
      `${topologyLabel}.linearIndexRule`,
    ),
    neighborOffsets: Object.freeze(neighborOffsets),
    initialAttachedIndices: parseFrozenSet("initialAttachedIndices", [22]),
    initialBoundaryIndices: parseFrozenSet("initialBoundaryIndices", [13, 19, 20, 21, 23, 24, 25, 31]),
    tiedOrbitIndices: parseFrozenSet("tiedOrbitIndices", [13, 31]),
    postAttachedIndices: parseFrozenSet("postAttachedIndices", [13, 22, 31]),
    postBoundaryIndices: parseFrozenSet(
      "postBoundaryIndices",
      [4, 10, 11, 12, 14, 15, 16, 19, 20, 21, 23, 24, 25, 28, 29, 30, 32, 33, 34, 40],
    ),
    eventOrdinal: fixedNumber(topologyRow.eventOrdinal, 4, `${topologyLabel}.eventOrdinal`) as 4,
    d6hClosureRule: string(topologyRow.d6hClosureRule, `${topologyLabel}.d6hClosureRule`),
  });

  const formulaLabel = "Phase 10 C0V moving protocol.formulas";
  const formulaRow = object(protocol.formulas, formulaLabel);
  exactKeys(formulaRow, MOVING_FORMULA_FIELDS, formulaLabel);
  for (const key of [
    "environmentEquations",
    "inPlaneEquation",
    "verticalEquation",
    "opposingEquation",
    "boundaryEquation",
    "preEventScalarEquation",
  ] as const) string(formulaRow[key], `${formulaLabel}.${key}`);
  const evaluationOrder = stringArray(formulaRow.evaluationOrder, `${formulaLabel}.evaluationOrder`);
  if (evaluationOrder.length === 0) invalid(`${formulaLabel}.evaluationOrder`, "must be nonempty");
  for (const [key, expectedKeys] of [
    ["bisection", ["lowerBound", "upperBound", "maxIterations", "stopRule", "selectionRule"]],
    ["eventUpdate", ["rateEquation", "timeStepEquation", "fillEquation", "attachmentRule", "topologyRule"]],
    ["ledgerIdentity", ["iceCellEquation", "vaporEquation", "holeFillRule"]],
    ["driftBound", ["nonzeroEquation", "zeroFieldValue"]],
  ] as const) {
    const nested = object(formulaRow[key], `${formulaLabel}.${key}`);
    exactKeys(nested, expectedKeys, `${formulaLabel}.${key}`);
  }
  const bisection = object(formulaRow.bisection, `${formulaLabel}.bisection`);
  const eventUpdate = object(formulaRow.eventUpdate, `${formulaLabel}.eventUpdate`);
  const ledgerIdentity = object(formulaRow.ledgerIdentity, `${formulaLabel}.ledgerIdentity`);
  const driftBound = object(formulaRow.driftBound, `${formulaLabel}.driftBound`);
  const formulas: Phase10C0VMovingFormulas = Object.freeze({
    environmentEquations: string(formulaRow.environmentEquations, `${formulaLabel}.environmentEquations`),
    inPlaneEquation: string(formulaRow.inPlaneEquation, `${formulaLabel}.inPlaneEquation`),
    verticalEquation: string(formulaRow.verticalEquation, `${formulaLabel}.verticalEquation`),
    opposingEquation: string(formulaRow.opposingEquation, `${formulaLabel}.opposingEquation`),
    boundaryEquation: string(formulaRow.boundaryEquation, `${formulaLabel}.boundaryEquation`),
    preEventScalarEquation: string(formulaRow.preEventScalarEquation, `${formulaLabel}.preEventScalarEquation`),
    evaluationOrder,
    bisection: Object.freeze({
      lowerBound: string(bisection.lowerBound, `${formulaLabel}.bisection.lowerBound`),
      upperBound: string(bisection.upperBound, `${formulaLabel}.bisection.upperBound`),
      maxIterations: positiveInteger(bisection.maxIterations, `${formulaLabel}.bisection.maxIterations`),
      stopRule: string(bisection.stopRule, `${formulaLabel}.bisection.stopRule`),
      selectionRule: string(bisection.selectionRule, `${formulaLabel}.bisection.selectionRule`),
    }),
    eventUpdate: Object.freeze({
      rateEquation: string(eventUpdate.rateEquation, `${formulaLabel}.eventUpdate.rateEquation`),
      timeStepEquation: string(eventUpdate.timeStepEquation, `${formulaLabel}.eventUpdate.timeStepEquation`),
      fillEquation: string(eventUpdate.fillEquation, `${formulaLabel}.eventUpdate.fillEquation`),
      attachmentRule: string(eventUpdate.attachmentRule, `${formulaLabel}.eventUpdate.attachmentRule`),
      topologyRule: string(eventUpdate.topologyRule, `${formulaLabel}.eventUpdate.topologyRule`),
    }),
    ledgerIdentity: Object.freeze({
      iceCellEquation: string(ledgerIdentity.iceCellEquation, `${formulaLabel}.ledgerIdentity.iceCellEquation`),
      vaporEquation: string(ledgerIdentity.vaporEquation, `${formulaLabel}.ledgerIdentity.vaporEquation`),
      holeFillRule: string(ledgerIdentity.holeFillRule, `${formulaLabel}.ledgerIdentity.holeFillRule`),
    }),
    driftBound: Object.freeze({
      nonzeroEquation: string(driftBound.nonzeroEquation, `${formulaLabel}.driftBound.nonzeroEquation`),
      zeroFieldValue: string(driftBound.zeroFieldValue, `${formulaLabel}.driftBound.zeroFieldValue`),
    }),
  });
  for (const key of ["lowerBound", "upperBound", "stopRule", "selectionRule"] as const) {
    string(bisection[key], `${formulaLabel}.bisection.${key}`);
  }
  positiveInteger(bisection.maxIterations, `${formulaLabel}.bisection.maxIterations`);
  for (const key of ["rateEquation", "timeStepEquation", "fillEquation", "attachmentRule", "topologyRule"] as const) {
    string(eventUpdate[key], `${formulaLabel}.eventUpdate.${key}`);
  }
  for (const key of ["iceCellEquation", "vaporEquation", "holeFillRule"] as const) {
    string(ledgerIdentity[key], `${formulaLabel}.ledgerIdentity.${key}`);
  }
  for (const key of ["nonzeroEquation", "zeroFieldValue"] as const) {
    string(driftBound[key], `${formulaLabel}.driftBound.${key}`);
  }

  const criteriaLabel = "Phase 10 C0V moving protocol.criteria";
  const criteriaRow = object(protocol.criteria, criteriaLabel);
  exactKeys(criteriaRow, MOVING_CRITERIA_FIELDS, criteriaLabel);
  const attachedNowByStep = integerArray(criteriaRow.attachedNowByStep, `${criteriaLabel}.attachedNowByStep`);
  requireExactArray(attachedNowByStep, [0, 0, 0, 2], `${criteriaLabel}.attachedNowByStep`);
  const holeFill = object(criteriaRow.holeFillExact, `${criteriaLabel}.holeFillExact`);
  exactKeys(holeFill, ["count", "deficit"], `${criteriaLabel}.holeFillExact`);
  const relaxation = object(criteriaRow.relaxationCriteria, `${criteriaLabel}.relaxationCriteria`);
  exactKeys(
    relaxation,
    ["residualStrictlyLessThan", "divergenceStrictlyLessThan", "maxSweeps", "smootherDriftWithinRoundoffBound"],
    `${criteriaLabel}.relaxationCriteria`,
  );
  const operators = object(criteriaRow.comparisonOperators, `${criteriaLabel}.comparisonOperators`);
  exactKeys(operators, ["tolerance", "relaxation", "exact"], `${criteriaLabel}.comparisonOperators`);
  const criteria: Phase10C0VMovingCriteria = Object.freeze({
    allChecksRequired: fixedBoolean(criteriaRow.allChecksRequired, true, `${criteriaLabel}.allChecksRequired`) as true,
    scalarEquationResidualRelative: fixedNumber(criteriaRow.scalarEquationResidualRelative, 1e-14, `${criteriaLabel}.scalarEquationResidualRelative`),
    preEventFieldLInf: fixedNumber(criteriaRow.preEventFieldLInf, 5e-10, `${criteriaLabel}.preEventFieldLInf`),
    preEventFieldWeightedL2: fixedNumber(criteriaRow.preEventFieldWeightedL2, 5e-10, `${criteriaLabel}.preEventFieldWeightedL2`),
    axialRateRelative: fixedNumber(criteriaRow.axialRateRelative, 1e-7, `${criteriaLabel}.axialRateRelative`),
    axialRatesBitIdenticalPositive: fixedBoolean(criteriaRow.axialRatesBitIdenticalPositive, true, `${criteriaLabel}.axialRatesBitIdenticalPositive`) as true,
    otherInitialBoundaryRatesBitwiseZero: fixedBoolean(criteriaRow.otherInitialBoundaryRatesBitwiseZero, true, `${criteriaLabel}.otherInitialBoundaryRatesBitwiseZero`) as true,
    attachedNowByStep: Object.freeze([0, 0, 0, 2] as const),
    eventTimeRelative: fixedNumber(criteriaRow.eventTimeRelative, 1e-7, `${criteriaLabel}.eventTimeRelative`),
    maxKineticIncrementAbsolute: fixedNumber(criteriaRow.maxKineticIncrementAbsolute, 1e-14, `${criteriaLabel}.maxKineticIncrementAbsolute`),
    exactTopologyNeighborD6hSets: fixedBoolean(criteriaRow.exactTopologyNeighborD6hSets, true, `${criteriaLabel}.exactTopologyNeighborD6hSets`) as true,
    postFieldShellBitwiseSigmaInfinity: fixedBoolean(criteriaRow.postFieldShellBitwiseSigmaInfinity, true, `${criteriaLabel}.postFieldShellBitwiseSigmaInfinity`) as true,
    postFieldAttachedAndWallBitwiseZero: fixedBoolean(criteriaRow.postFieldAttachedAndWallBitwiseZero, true, `${criteriaLabel}.postFieldAttachedAndWallBitwiseZero`) as true,
    placedFillAbsolute: fixedNumber(criteriaRow.placedFillAbsolute, 1e-12, `${criteriaLabel}.placedFillAbsolute`),
    clippingAbsolute: fixedNumber(criteriaRow.clippingAbsolute, 1e-12, `${criteriaLabel}.clippingAbsolute`),
    vaporLedgerRelative: fixedNumber(criteriaRow.vaporLedgerRelative, 1e-10, `${criteriaLabel}.vaporLedgerRelative`),
    eventChainRelative: fixedNumber(criteriaRow.eventChainRelative, 1e-10, `${criteriaLabel}.eventChainRelative`),
    holeFillExact: Object.freeze({
      count: fixedNumber(holeFill.count, 0, `${criteriaLabel}.holeFillExact.count`) as 0,
      deficit: fixedNumber(holeFill.deficit, 0, `${criteriaLabel}.holeFillExact.deficit`) as 0,
    }),
    postFieldFixedPointResidual: fixedNumber(criteriaRow.postFieldFixedPointResidual, 1e-11, `${criteriaLabel}.postFieldFixedPointResidual`),
    relaxationCriteria: Object.freeze({
      residualStrictlyLessThan: fixedNumber(relaxation.residualStrictlyLessThan, 1e-13, `${criteriaLabel}.relaxationCriteria.residualStrictlyLessThan`),
      divergenceStrictlyLessThan: fixedNumber(relaxation.divergenceStrictlyLessThan, 1e-10, `${criteriaLabel}.relaxationCriteria.divergenceStrictlyLessThan`),
      maxSweeps: fixedNumber(relaxation.maxSweeps, 100000, `${criteriaLabel}.relaxationCriteria.maxSweeps`),
      smootherDriftWithinRoundoffBound: fixedBoolean(relaxation.smootherDriftWithinRoundoffBound, true, `${criteriaLabel}.relaxationCriteria.smootherDriftWithinRoundoffBound`) as true,
    }),
    comparisonOperators: Object.freeze({
      tolerance: literal(operators.tolerance, "less-than-or-equal", `${criteriaLabel}.comparisonOperators.tolerance`),
      relaxation: literal(operators.relaxation, "strictly-less-than", `${criteriaLabel}.comparisonOperators.relaxation`),
      exact: literal(operators.exact, "strict-equality-or-bitwise-as-named", `${criteriaLabel}.comparisonOperators.exact`),
    }),
  });
  const derivationLabel = "Phase 10 C0V moving protocol.referenceDerivation";
  const derivation = object(protocol.referenceDerivation, derivationLabel);
  exactKeys(derivation, MOVING_REFERENCE_DERIVATION_FIELDS, derivationLabel);
  for (const key of MOVING_REFERENCE_DERIVATION_FIELDS) {
    string(derivation[key], `${derivationLabel}.${key}`);
  }
  literal(
    derivation.method,
    "independent-integer-topology-scalar-bisection",
    `${derivationLabel}.method`,
  );
  literal(
    derivation.outputValuePolicy,
    "no-actual-output-values-in-protocol",
    `${derivationLabel}.outputValuePolicy`,
  );
  const targetedLabel = "Phase 10 C0V moving protocol.targetedCheck";
  const targeted = object(protocol.targetedCheck, targetedLabel);
  exactKeys(targeted, MOVING_TARGETED_CHECK_FIELDS, targetedLabel);
  for (const key of ["method", "independentArithmetic", "tieRule", "aggregateRule"] as const) {
    string(targeted[key], `${targetedLabel}.${key}`);
  }
  literal(
    targeted.method,
    "independent-cube-topology-safeguarded-newton-and-equation-residuals",
    `${targetedLabel}.method`,
  );
  const targetedChecks = stringArray(targeted.checks, `${targetedLabel}.checks`);
  if (targetedChecks.length === 0) invalid(`${targetedLabel}.checks`, "must be nonempty");
  fixedBoolean(targeted.generatorImportAllowed, false, `${targetedLabel}.generatorImportAllowed`);
  validateNegativeControls(
    protocol.negativeControls,
    ["nc-event-event-time", "nc-event-topology-orbit"],
    "Phase 10 C0V moving protocol.negativeControls",
  );
  return Object.freeze({
    protocolId: protocol.protocolId,
    fixture,
    topology,
    formulas,
    criteria,
  });
}

const STATIC_PROTOCOL_FIELDS = [
  "schema",
  "protocolId",
  "layerId",
  "frozenDate",
  "branch",
  "bindings",
  "artifactPaths",
  "referenceOnlyCode",
  "refusalGrounds",
  "attemptedRoutes",
  "notApplicableObligations",
  "targetedCheck",
  "resourceBoundary",
  "independence",
  "terminalSemantics",
  "claimBoundary",
] as const;

const STATIC_REFUSAL_GROUND_FIELDS = [
  "auditId",
  "reasonCode",
  "currentContractScope",
  "unavailableOperands",
  "forbiddenSubstitutes",
  "findings",
] as const;

const STATIC_FINDING_FIELDS = [
  "findingId",
  "operandIds",
  "visibility",
  "contractChangeRequired",
  "evidenceLocator",
  "ground",
] as const;

const STATIC_FINDING_EXPECTATIONS = [
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
    evidenceLocator: "docs/attachment-kinetics.md#4.4-the-surface-operator-specification",
  },
] as const;

const STATIC_UNAVAILABLE_OPERANDS = [
  "analyticExpectedFieldOrder",
  "analyticExpectedFluxOrder",
  "independentContinuumBoundaryFluxReference",
  "independentContinuumFieldReference",
  "orderLowerBound",
] as const;

const STATIC_FORBIDDEN_SUBSTITUTES = [
  "same-discrete-replay-as-spatial-accuracy",
  "self-convergence-as-absolute-accuracy",
] as const;

const STATIC_ROUTE_EXPECTATIONS = [
  ["public-one-sweep-reconstruction-plus-separate-discrete-replay", "available-but-insufficient"],
  ["tolerance-scaled-self-convergence", "forbidden-substitute"],
] as const;

const STATIC_ROUTE_FIELDS = ["routeId", "route", "disposition", "reason"] as const;
const STATIC_NOT_APPLICABLE_FIELDS = [
  "gridRoster",
  "normThresholds",
  "referenceValues",
  "solverCalls",
  "witnesses",
  "numericalEvaluations",
] as const;
const STATIC_TARGETED_CHECK_FIELDS = [
  "method",
  "requiredFindingIds",
  "requiredRouteIds",
  "zeroExecutionRequired",
  "scopeRule",
  "universalImpossibilityClaim",
] as const;

function parseStaticFinding(
  value: StrictJson,
  label: string,
  index: number,
): Phase10C0VStaticPublicApiFinding {
  const row = object(value, label);
  exactKeys(row, STATIC_FINDING_FIELDS, label);
  const operandIds = stringArray(row.operandIds, `${label}.operandIds`);
  const expected = STATIC_FINDING_EXPECTATIONS[index];
  if (expected === undefined) invalid(label, "has no frozen finding at this ordinal");
  requireExactArray(operandIds, expected.operandIds, `${label}.operandIds`);
  string(row.ground, `${label}.ground`);
  return Object.freeze({
    findingId: literal(row.findingId, expected.findingId, `${label}.findingId`),
    operandIds,
    visibility: literal(row.visibility, expected.visibility, `${label}.visibility`),
    contractChangeRequired: fixedBoolean(
      row.contractChangeRequired,
      false,
      `${label}.contractChangeRequired`,
    ) as false,
    evidenceLocator: literal(
      row.evidenceLocator,
      expected.evidenceLocator,
      `${label}.evidenceLocator`,
    ),
  });
}

function zeroExecutionRecord(): Phase10C0VZeroExecutionRecord {
  return Object.freeze({
    solverInvocations: 0,
    referenceInvocations: 0,
    productionInvocations: 0,
    witnessesProduced: 0,
    numericalEvaluations: 0,
    scientificProcessHours: 0,
  });
}

export function phase10C0VStaticSourceAudit(
  protocol: Phase10C0VStaticProtocol,
  inspectedArtifacts: readonly Phase10C0VArtifactIdentity[],
): Phase10C0VStaticSourceAudit {
  const label = "Phase 10 C0V static protocol.refusalGrounds";
  const grounds = object(protocol.refusalGrounds, label);
  exactKeys(grounds, STATIC_REFUSAL_GROUND_FIELDS, label);
  const findings = array(grounds.findings, `${label}.findings`).map((entry, index) =>
    parseStaticFinding(entry, `${label}.findings[${index}]`, index));
  if (findings.length !== 2) invalid(`${label}.findings`, "must contain the exact two current-contract findings");
  const artifacts = inspectedArtifacts.map((entry, index) =>
    artifactIdentity(strictJsonSnapshot(entry), `static source audit.inspectedArtifacts[${index}]`));
  if (artifacts.length === 0) invalid("static source audit.inspectedArtifacts", "must be nonempty");
  const paths = artifacts.map((entry) => entry.path);
  sortedUnique(paths, "static source audit.inspectedArtifacts paths");
  return Object.freeze({
    auditId: string(grounds.auditId, `${label}.auditId`),
    currentContractOnly: true,
    inspectedArtifacts: Object.freeze(artifacts),
    publicApiFindings: Object.freeze(findings),
    executionRecord: zeroExecutionRecord(),
  });
}

export function parsePhase10C0VStaticProtocol(value: unknown): Phase10C0VStaticProtocol {
  const label = "Phase 10 C0V static protocol";
  const row = root(value, label);
  exactKeys(row, STATIC_PROTOCOL_FIELDS, label);
  const common = commonProtocol(
    row,
    label,
    PHASE10_C0V_STATIC_PROTOCOL_SCHEMA,
    "C0V-STATIC",
    "reference-refusal",
  );
  validateResourceProjection(row.resourceBoundary, `${label}.resourceBoundary`, [300, 8 * 1024 * 1024, 2 * 1024 * 1024, 64 * 1024 * 1024]);
  validateReferenceOnlyCodeRoster(common.referenceOnlyCode, {
    generator: ["runner/src/phase10-c0v-static-refusal.ts", "derivePhase10C0VStaticRefusal"],
    "independent-checker": ["runner/src/phase10-c0v-static-refusal-check.ts", "independentlyCheckPhase10C0VStaticRefusal"],
    "shared-parser": ["runner/src/phase10-c0v-contracts.ts", "parsePhase10C0VStaticProtocol"],
  }, `${label}.referenceOnlyCode`);
  const groundsLabel = `${label}.refusalGrounds`;
  const grounds = object(row.refusalGrounds, groundsLabel);
  exactKeys(grounds, STATIC_REFUSAL_GROUND_FIELDS, groundsLabel);
  literal(grounds.auditId, "phase10-c0v-static-current-contract-audit-v1", `${groundsLabel}.auditId`);
  literal(
    grounds.reasonCode,
    "current-contract-lacks-independent-static-spatial-reference-v1",
    `${groundsLabel}.reasonCode`,
  );
  literal(grounds.currentContractScope, "accepted-current-public-solver-contract-only", `${groundsLabel}.currentContractScope`);
  const unavailableOperands = stringArray(grounds.unavailableOperands, `${groundsLabel}.unavailableOperands`);
  requireExactArray(unavailableOperands, STATIC_UNAVAILABLE_OPERANDS, `${groundsLabel}.unavailableOperands`);
  const forbiddenSubstitutes = stringArray(
    grounds.forbiddenSubstitutes,
    `${groundsLabel}.forbiddenSubstitutes`,
  );
  requireExactArray(forbiddenSubstitutes, STATIC_FORBIDDEN_SUBSTITUTES, `${groundsLabel}.forbiddenSubstitutes`);
  const findings = array(grounds.findings, `${groundsLabel}.findings`).map((entry, index) =>
    parseStaticFinding(entry, `${groundsLabel}.findings[${index}]`, index));
  if (findings.length !== 2) invalid(`${groundsLabel}.findings`, "must contain two findings");
  const findingIds = findings.map((entry) => entry.findingId);
  requireExactArray(
    findingIds,
    STATIC_FINDING_EXPECTATIONS.map((entry) => entry.findingId),
    `${groundsLabel}.findings findingIds`,
  );

  const routesLabel = `${label}.attemptedRoutes`;
  const routes = array(row.attemptedRoutes, routesLabel);
  if (routes.length !== 2) invalid(routesLabel, "must contain two frozen route dispositions");
  const routeIds = routes.map((entry, index) => {
    const routeLabel = `${routesLabel}[${index}]`;
    const route = object(entry, routeLabel);
    exactKeys(route, STATIC_ROUTE_FIELDS, routeLabel);
    for (const key of STATIC_ROUTE_FIELDS) string(route[key], `${routeLabel}.${key}`);
    const expected = STATIC_ROUTE_EXPECTATIONS[index];
    if (expected === undefined) invalid(routeLabel, "has no frozen route at this ordinal");
    literal(route.routeId, expected[0], `${routeLabel}.routeId`);
    literal(route.disposition, expected[1], `${routeLabel}.disposition`);
    return expected[0];
  });
  requireExactArray(routeIds, STATIC_ROUTE_EXPECTATIONS.map((entry) => entry[0]), `${routesLabel} routeIds`);

  const notApplicableLabel = `${label}.notApplicableObligations`;
  const notApplicable = object(row.notApplicableObligations, notApplicableLabel);
  exactKeys(notApplicable, STATIC_NOT_APPLICABLE_FIELDS, notApplicableLabel);
  for (const key of STATIC_NOT_APPLICABLE_FIELDS) {
    literal(notApplicable[key], "not-instantiated", `${notApplicableLabel}.${key}`);
  }

  const checkLabel = `${label}.targetedCheck`;
  const check = object(row.targetedCheck, checkLabel);
  exactKeys(check, STATIC_TARGETED_CHECK_FIELDS, checkLabel);
  literal(
    check.method,
    "independent-current-contract-ground-route-scope-and-zero-execution-check",
    `${checkLabel}.method`,
  );
  requireExactArray(stringArray(check.requiredFindingIds, `${checkLabel}.requiredFindingIds`), findingIds, `${checkLabel}.requiredFindingIds`);
  requireExactArray(stringArray(check.requiredRouteIds, `${checkLabel}.requiredRouteIds`), routeIds, `${checkLabel}.requiredRouteIds`);
  fixedBoolean(check.zeroExecutionRequired, true, `${checkLabel}.zeroExecutionRequired`);
  string(check.scopeRule, `${checkLabel}.scopeRule`);
  fixedBoolean(check.universalImpossibilityClaim, false, `${checkLabel}.universalImpossibilityClaim`);
  return Object.freeze({
    schema: PHASE10_C0V_STATIC_PROTOCOL_SCHEMA,
    ...common,
    layerId: "C0V-STATIC",
    branch: "reference-refusal",
    refusalGrounds: strictJsonSnapshot(row.refusalGrounds),
    attemptedRoutes: strictJsonSnapshot(row.attemptedRoutes),
    notApplicableObligations: strictJsonSnapshot(row.notApplicableObligations),
    targetedCheck: strictJsonSnapshot(row.targetedCheck),
    resourceBoundary: strictJsonSnapshot(row.resourceBoundary),
    independence: strictJsonSnapshot(row.independence),
    terminalSemantics: strictJsonSnapshot(row.terminalSemantics),
    claimBoundary: strictJsonSnapshot(row.claimBoundary),
  });
}

export function parsePhase10C0VNumericIdentity(
  value: unknown,
  label = "Phase 10 C0V numeric identity",
): Phase10C0VNumericIdentity {
  const row = root(value, label);
  exactKeys(row, ["decimal", "binary64Hex"], label);
  const decimal = string(row.decimal, `${label}.decimal`);
  const binary64Hex = string(row.binary64Hex, `${label}.binary64Hex`);
  if (!BINARY64_HEX.test(binary64Hex)) {
    invalid(`${label}.binary64Hex`, "must be 16 lowercase hexadecimal digits");
  }
  const parsed = Number(decimal);
  if (!Number.isFinite(parsed) || Object.is(parsed, -0)) {
    invalid(`${label}.decimal`, "must encode a finite non-negative-zero binary64 number");
  }
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, parsed, false);
  const expected = [...new Uint8Array(view.buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (expected !== binary64Hex) {
    invalid(label, "decimal and big-endian binary64Hex encode different values");
  }
  return Object.freeze({ decimal, binary64Hex });
}

function validateNumericIdentityFields(
  value: StrictJson,
  fields: readonly string[],
  label: string,
): void {
  const row = object(value, label);
  exactKeys(row, fields, label);
  for (const field of fields) {
    parsePhase10C0VNumericIdentity(row[field], `${label}.${field}`);
  }
}

function validateStringArrayValue(value: StrictJson, label: string): void {
  stringArray(value, label);
}

function validateRadialSample(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(row, ["nodeIndex", "radiusM", "sigma"], label);
  nonnegativeInteger(row.nodeIndex, `${label}.nodeIndex`);
  parsePhase10C0VNumericIdentity(row.radiusM, `${label}.radiusM`);
  parsePhase10C0VNumericIdentity(row.sigma, `${label}.sigma`);
}

const RADIAL_CASE_OUTPUT_FIELDS = [
  "caseId",
  "requestedSpacingM",
  "actualSpacingM",
  "nodeCount",
  "harmonicConstant",
  "harmonicInverseRadiusCoefficientM",
  "sigmaSurface",
  "sigmaShell",
  "surfaceGradientPerM",
  "growthVelocityFluxMS",
  "growthVelocityKineticMS",
  "robinResidual",
  "samples",
] as const;

function validateRadialCaseOutput(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(row, RADIAL_CASE_OUTPUT_FIELDS, label);
  string(row.caseId, `${label}.caseId`);
  positiveInteger(row.nodeCount, `${label}.nodeCount`);
  for (const field of RADIAL_CASE_OUTPUT_FIELDS.filter((field) =>
    !["caseId", "nodeCount", "samples"].includes(field))) {
    parsePhase10C0VNumericIdentity(row[field], `${label}.${field}`);
  }
  const samples = array(row.samples, `${label}.samples`);
  if (samples.length !== row.nodeCount) invalid(`${label}.samples`, "length must equal nodeCount");
  samples.forEach((entry, index) => validateRadialSample(entry, `${label}.samples[${index}]`));
}

const RADIAL_UNIFORM_CASE_OUTPUT_FIELDS = [
  "caseId",
  "requestedSpacingM",
  "actualSpacingM",
  "nodeCount",
  "sigmaSurface",
  "sigmaShell",
  "surfaceGradientPerM",
  "growthVelocityFluxMS",
  "growthVelocityKineticMS",
  "robinResidual",
  "samples",
] as const;

function validateRadialUniformCaseOutput(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(row, RADIAL_UNIFORM_CASE_OUTPUT_FIELDS, label);
  string(row.caseId, `${label}.caseId`);
  positiveInteger(row.nodeCount, `${label}.nodeCount`);
  for (const field of RADIAL_UNIFORM_CASE_OUTPUT_FIELDS.filter((field) =>
    !["caseId", "nodeCount", "samples"].includes(field))) {
    parsePhase10C0VNumericIdentity(row[field], `${label}.${field}`);
  }
  const samples = array(row.samples, `${label}.samples`);
  if (samples.length !== row.nodeCount) invalid(`${label}.samples`, "length must equal nodeCount");
  samples.forEach((entry, index) => validateRadialSample(entry, `${label}.samples[${index}]`));
}

const RADIAL_PHYSICS_FIELDS = [
  "temperatureK",
  "saturationPressurePa",
  "saturationNumberDensityPerM3",
  "diffusivityM2S",
  "thermalSpeedMS",
  "kineticVelocityMS",
  "kineticLengthM",
] as const;

const RADIAL_IDENTIFIED_CONSTANT_FIELDS = [
  "kBoltzmannJPerK",
  "celsiusZeroK",
  "waterMoleculeMassKg",
  "iceNumberDensityPerM3",
  "diffusivityAir1AtmM2S",
  "standardAtmospherePa",
  "saturationPressurePrefactorMbar",
  "saturationPressureExponentK",
  "mbarToPa",
] as const;

export function parsePhase10C0VRadialReferenceCandidate(value: unknown): StrictJson {
  const label = "Phase 10 C0V radial reference candidate";
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  exactKeys(
    row,
    ["schema", "protocolId", "method", "operands", "requestedRoster", "derivedPhysics", "cases", "uniformFieldControl", "scope"],
    label,
  );
  literal(row.schema, "phase10-c0v-radial-reference-candidate-v1", `${label}.schema`);
  string(row.protocolId, `${label}.protocolId`);
  literal(row.method, "independent-2x2-harmonic-coefficients", `${label}.method`);
  const operandsLabel = `${label}.operands`;
  const operands = object(row.operands, operandsLabel);
  exactKeys(
    operands,
    ["radiusM", "farRadiusM", "sigmaInfinity", "tempC", "pressurePa", "alphaHKConst", "physicalConstants"],
    operandsLabel,
  );
  for (const field of ["radiusM", "farRadiusM", "sigmaInfinity", "tempC", "pressurePa", "alphaHKConst"] as const) {
    parsePhase10C0VNumericIdentity(operands[field], `${operandsLabel}.${field}`);
  }
  validateNumericIdentityFields(operands.physicalConstants, RADIAL_IDENTIFIED_CONSTANT_FIELDS, `${operandsLabel}.physicalConstants`);
  const requestedRoster = array(row.requestedRoster, `${label}.requestedRoster`);
  if (requestedRoster.length !== 4) invalid(`${label}.requestedRoster`, "must contain exactly four cases");
  requestedRoster.forEach((entry, index) => {
    const rosterLabel = `${label}.requestedRoster[${index}]`;
    const roster = object(entry, rosterLabel);
    exactKeys(roster, ["caseId", "requestedSpacingM"], rosterLabel);
    string(roster.caseId, `${rosterLabel}.caseId`);
    parsePhase10C0VNumericIdentity(roster.requestedSpacingM, `${rosterLabel}.requestedSpacingM`);
  });
  validateNumericIdentityFields(row.derivedPhysics, RADIAL_PHYSICS_FIELDS, `${label}.derivedPhysics`);
  const cases = array(row.cases, `${label}.cases`);
  if (cases.length !== requestedRoster.length) invalid(`${label}.cases`, "length must equal requestedRoster length");
  cases.forEach((entry, index) => validateRadialCaseOutput(entry, `${label}.cases[${index}]`));
  const uniformLabel = `${label}.uniformFieldControl`;
  const uniform = object(row.uniformFieldControl, uniformLabel);
  exactKeys(uniform, ["alphaHKConst", "cases"], uniformLabel);
  parsePhase10C0VNumericIdentity(uniform.alphaHKConst, `${uniformLabel}.alphaHKConst`);
  const uniformCases = array(uniform.cases, `${uniformLabel}.cases`);
  if (uniformCases.length !== requestedRoster.length) invalid(`${uniformLabel}.cases`, "length must equal requestedRoster length");
  uniformCases.forEach((entry, index) => validateRadialUniformCaseOutput(entry, `${uniformLabel}.cases[${index}]`));
  const scopeLabel = `${label}.scope`;
  const scope = object(row.scope, scopeLabel);
  exactKeys(scope, ["control", "orderDisposition", "physicalValidationClaim", "habitClaim", "solverExecuted"], scopeLabel);
  literal(scope.control, "finite-shell-constant-coefficient-spherical-robin", `${scopeLabel}.control`);
  literal(scope.orderDisposition, "not-applicable-exact-u-roundoff-control", `${scopeLabel}.orderDisposition`);
  fixedBoolean(scope.physicalValidationClaim, false, `${scopeLabel}.physicalValidationClaim`);
  fixedBoolean(scope.habitClaim, false, `${scopeLabel}.habitClaim`);
  fixedBoolean(scope.solverExecuted, false, `${scopeLabel}.solverExecuted`);
  return snapshot;
}

const RADIAL_METRIC_FIELDS = [
  "surfaceRelative",
  "velocityRelative",
  "fieldRelativeLInf",
  "fieldWeightedRelativeL2",
  "shellNormalized",
  "uniformNormalizedLInf",
  "robinResidualNormalized",
  "generatorCheckerAgreement",
] as const;

function validateRadialMetric(value: StrictJson, label: string): boolean {
  const row = object(value, label);
  exactKeys(row, ["value", "tolerance", "pass"], label);
  parsePhase10C0VNumericIdentity(row.value, `${label}.value`);
  parsePhase10C0VNumericIdentity(row.tolerance, `${label}.tolerance`);
  return jsonBoolean(row.pass, `${label}.pass`);
}

function validateRadialMetrics(value: StrictJson, label: string): boolean {
  const row = object(value, label);
  exactKeys(row, RADIAL_METRIC_FIELDS, label);
  return RADIAL_METRIC_FIELDS.every((field) =>
    validateRadialMetric(row[field], `${label}.${field}`));
}

function validateRadialIndependentCase(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(
    row,
    ["caseId", "requestedSpacingM", "actualSpacingM", "nodeCount", "robinLambda", "harmonicConstant", "harmonicInverseRadiusCoefficientM", "sigmaSurface", "sigmaShell", "surfaceGradientPerM", "growthVelocityMS", "samples"],
    label,
  );
  string(row.caseId, `${label}.caseId`);
  positiveInteger(row.nodeCount, `${label}.nodeCount`);
  for (const field of ["requestedSpacingM", "actualSpacingM", "robinLambda", "harmonicConstant", "harmonicInverseRadiusCoefficientM", "sigmaSurface", "sigmaShell", "surfaceGradientPerM", "growthVelocityMS"] as const) {
    parsePhase10C0VNumericIdentity(row[field], `${label}.${field}`);
  }
  const samples = array(row.samples, `${label}.samples`);
  if (samples.length !== row.nodeCount) invalid(`${label}.samples`, "length must equal nodeCount");
  samples.forEach((entry, index) => validateRadialSample(entry, `${label}.samples[${index}]`));
}

export function parsePhase10C0VRadialReferenceCheck(value: unknown): StrictJson {
  const label = "Phase 10 C0V radial reference check";
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  exactKeys(
    row,
    ["schema", "protocolId", "method", "independentDerivedPhysics", "exactOperandEcho", "exactRoster", "cases", "maxima", "allFinite", "errors", "pass"],
    label,
  );
  literal(row.schema, "phase10-c0v-radial-reference-check-v1", `${label}.schema`);
  string(row.protocolId, `${label}.protocolId`);
  literal(row.method, "independent-closed-form-lambda", `${label}.method`);
  validateNumericIdentityFields(row.independentDerivedPhysics, RADIAL_PHYSICS_FIELDS, `${label}.independentDerivedPhysics`);
  for (const field of ["exactOperandEcho", "exactRoster", "allFinite"] as const) {
    jsonBoolean(row[field], `${label}.${field}`);
  }
  const cases = array(row.cases, `${label}.cases`);
  if (cases.length !== 4) invalid(`${label}.cases`, "must contain exactly four cases");
  const casePasses = cases.map((entry, index) => {
    const caseLabel = `${label}.cases[${index}]`;
    const caseRow = object(entry, caseLabel);
    exactKeys(
      caseRow,
      ["caseId", "exactRoster", "independent", "independentUniformFieldControl", "metrics", "exactUniformZeroRates", "errors", "pass"],
      caseLabel,
    );
    string(caseRow.caseId, `${caseLabel}.caseId`);
    const exactRoster = jsonBoolean(caseRow.exactRoster, `${caseLabel}.exactRoster`);
    validateRadialIndependentCase(caseRow.independent, `${caseLabel}.independent`);
    validateRadialUniformCaseOutput(caseRow.independentUniformFieldControl, `${caseLabel}.independentUniformFieldControl`);
    const metricsPass = validateRadialMetrics(caseRow.metrics, `${caseLabel}.metrics`);
    const exactUniformZeroRates = jsonBoolean(caseRow.exactUniformZeroRates, `${caseLabel}.exactUniformZeroRates`);
    const caseErrors = stringArray(caseRow.errors, `${caseLabel}.errors`);
    const casePass = jsonBoolean(caseRow.pass, `${caseLabel}.pass`);
    if (casePass !== (exactRoster && metricsPass && exactUniformZeroRates && caseErrors.length === 0)) {
      invalid(caseLabel, "pass must be reduced from exact roster, all metrics, exact uniform zero rates, and errors");
    }
    return casePass;
  });
  const maximaPass = validateRadialMetrics(row.maxima, `${label}.maxima`);
  const errors = stringArray(row.errors, `${label}.errors`);
  const pass = jsonBoolean(row.pass, `${label}.pass`);
  if (
    pass !== (
      row.exactOperandEcho === true && row.exactRoster === true && row.allFinite === true &&
      casePasses.every(Boolean) && maximaPass && errors.length === 0
    )
  ) {
    invalid(label, "pass must be reduced from exact echoes, all cases/maxima, finiteness, and errors");
  }
  return snapshot;
}

function validateMovingRelaxation(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(
    row,
    ["sweeps", "residual", "converged", "divergenceResidual", "shellClampDiagnostic", "surfaceExchangeDiagnostic", "smootherDriftDiagnostic", "smootherDriftLimit", "maxAbsSweepInput"],
    label,
  );
  nonnegativeInteger(row.sweeps, `${label}.sweeps`);
  jsonBoolean(row.converged, `${label}.converged`);
  for (const field of ["residual", "divergenceResidual", "shellClampDiagnostic", "surfaceExchangeDiagnostic", "smootherDriftDiagnostic", "smootherDriftLimit", "maxAbsSweepInput"] as const) {
    parsePhase10C0VNumericIdentity(row[field], `${label}.${field}`);
  }
}

function validateMovingState(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(row, ["attachedIndices", "boundaryIndices", "fieldRows", "boundaryRows", "relaxation"], label);
  integerArray(row.attachedIndices, `${label}.attachedIndices`);
  integerArray(row.boundaryIndices, `${label}.boundaryIndices`);
  const fieldRows = array(row.fieldRows, `${label}.fieldRows`);
  if (fieldRows.length === 0) invalid(`${label}.fieldRows`, "must be nonempty");
  fieldRows.forEach((entry, index) => {
    const fieldLabel = `${label}.fieldRows[${index}]`;
    const field = object(entry, fieldLabel);
    exactKeys(field, ["linearIndex", "attached", "wall", "fill", "sigma"], fieldLabel);
    nonnegativeInteger(field.linearIndex, `${fieldLabel}.linearIndex`);
    jsonBoolean(field.attached, `${fieldLabel}.attached`);
    jsonBoolean(field.wall, `${fieldLabel}.wall`);
    parsePhase10C0VNumericIdentity(field.fill, `${fieldLabel}.fill`);
    parsePhase10C0VNumericIdentity(field.sigma, `${fieldLabel}.sigma`);
  });
  const boundaryRows = array(row.boundaryRows, `${label}.boundaryRows`);
  boundaryRows.forEach((entry, index) => {
    const boundaryLabel = `${label}.boundaryRows[${index}]`;
    const boundary = object(entry, boundaryLabel);
    exactKeys(
      boundary,
      ["linearIndex", "nT", "nZ", "facetClass", "opposingIndices", "sigmaOpp", "sigmaBoundary", "alphaHK", "fillRatePerSecond"],
      boundaryLabel,
    );
    nonnegativeInteger(boundary.linearIndex, `${boundaryLabel}.linearIndex`);
    nonnegativeInteger(boundary.nT, `${boundaryLabel}.nT`);
    nonnegativeInteger(boundary.nZ, `${boundaryLabel}.nZ`);
    oneOf(boundary.facetClass, ["basal", "inhibited", "prism", "rough"], `${boundaryLabel}.facetClass`);
    integerArray(boundary.opposingIndices, `${boundaryLabel}.opposingIndices`);
    for (const field of ["sigmaOpp", "sigmaBoundary", "alphaHK", "fillRatePerSecond"] as const) {
      parsePhase10C0VNumericIdentity(boundary[field], `${boundaryLabel}.${field}`);
    }
  });
  validateMovingRelaxation(row.relaxation, `${label}.relaxation`);
}

export function parsePhase10C0VMovingReferenceCandidate(value: unknown): StrictJson {
  const label = "Phase 10 C0V moving reference candidate";
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  exactKeys(
    row,
    ["schema", "protocolId", "method", "activeCells", "neighborTable", "initialState", "cycles", "event", "postState", "ledger", "convergence"],
    label,
  );
  literal(row.schema, "phase10-c0v-moving-reference-candidate-v1", `${label}.schema`);
  string(row.protocolId, `${label}.protocolId`);
  literal(row.method, "independent-integer-topology-scalar-bisection", `${label}.method`);
  const activeCells = array(row.activeCells, `${label}.activeCells`);
  if (activeCells.length === 0) invalid(`${label}.activeCells`, "must be nonempty");
  activeCells.forEach((entry, index) => {
    const cellLabel = `${label}.activeCells[${index}]`;
    const cell = object(entry, cellLabel);
    exactKeys(cell, ["linearIndex", "i", "j", "k", "di", "dj", "dk", "shell"], cellLabel);
    for (const field of ["linearIndex", "i", "j", "k"] as const) nonnegativeInteger(cell[field], `${cellLabel}.${field}`);
    for (const field of ["di", "dj", "dk"] as const) safeInteger(cell[field], `${cellLabel}.${field}`);
    jsonBoolean(cell.shell, `${cellLabel}.shell`);
  });
  const neighborTable = array(row.neighborTable, `${label}.neighborTable`);
  if (neighborTable.length !== activeCells.length) invalid(`${label}.neighborTable`, "length must equal activeCells length");
  neighborTable.forEach((entry, index) => {
    const neighborLabel = `${label}.neighborTable[${index}]`;
    const neighbor = object(entry, neighborLabel);
    exactKeys(neighbor, ["linearIndex", "neighbors"], neighborLabel);
    nonnegativeInteger(neighbor.linearIndex, `${neighborLabel}.linearIndex`);
    const neighbors = array(neighbor.neighbors, `${neighborLabel}.neighbors`);
    if (neighbors.length !== 8) invalid(`${neighborLabel}.neighbors`, "must contain eight directions");
    neighbors.forEach((target, targetIndex) => {
      if (target !== null) nonnegativeInteger(target, `${neighborLabel}.neighbors[${targetIndex}]`);
    });
  });
  validateMovingState(row.initialState, `${label}.initialState`);
  const cycles = array(row.cycles, `${label}.cycles`);
  if (cycles.length === 0) invalid(`${label}.cycles`, "must be nonempty");
  cycles.forEach((entry, index) => {
    const cycleLabel = `${label}.cycles[${index}]`;
    const cycle = object(entry, cycleLabel);
    exactKeys(
      cycle,
      ["stepOrdinal", "deltaTimeSeconds", "cumulativeTimeSeconds", "maxKineticFillIncrement", "placedFillDelta", "saturationClippedFillDelta", "kineticDemandDelta", "attachedIndices"],
      cycleLabel,
    );
    positiveInteger(cycle.stepOrdinal, `${cycleLabel}.stepOrdinal`);
    for (const field of ["deltaTimeSeconds", "cumulativeTimeSeconds", "maxKineticFillIncrement", "placedFillDelta", "saturationClippedFillDelta", "kineticDemandDelta"] as const) {
      parsePhase10C0VNumericIdentity(cycle[field], `${cycleLabel}.${field}`);
    }
    integerArray(cycle.attachedIndices, `${cycleLabel}.attachedIndices`);
  });
  const eventLabel = `${label}.event`;
  const event = object(row.event, eventLabel);
  exactKeys(
    event,
    ["eventOrdinal", "eventStepOrdinal", "tiedOrbitIndices", "maxRatePerSecond", "nextRatePerSecond", "tieMarginPerSecond", "eventTimeSeconds", "preEventFillRows", "attachedIndices"],
    eventLabel,
  );
  positiveInteger(event.eventOrdinal, `${eventLabel}.eventOrdinal`);
  positiveInteger(event.eventStepOrdinal, `${eventLabel}.eventStepOrdinal`);
  integerArray(event.tiedOrbitIndices, `${eventLabel}.tiedOrbitIndices`);
  for (const field of ["maxRatePerSecond", "nextRatePerSecond", "tieMarginPerSecond", "eventTimeSeconds"] as const) {
    parsePhase10C0VNumericIdentity(event[field], `${eventLabel}.${field}`);
  }
  array(event.preEventFillRows, `${eventLabel}.preEventFillRows`).forEach((entry, index) => {
    const fillLabel = `${eventLabel}.preEventFillRows[${index}]`;
    const fill = object(entry, fillLabel);
    exactKeys(fill, ["linearIndex", "fill"], fillLabel);
    nonnegativeInteger(fill.linearIndex, `${fillLabel}.linearIndex`);
    parsePhase10C0VNumericIdentity(fill.fill, `${fillLabel}.fill`);
  });
  integerArray(event.attachedIndices, `${eventLabel}.attachedIndices`);
  validateMovingState(row.postState, `${label}.postState`);
  const ledger = object(row.ledger, `${label}.ledger`);
  exactKeys(
    ledger,
    ["placedFillIceCells", "saturationClippedFillIceCells", "kineticDemandIceCells", "holeFillDeficitIceCells", "holeFillCount", "placedFillVaporUnits"],
    `${label}.ledger`,
  );
  for (const field of ["placedFillIceCells", "saturationClippedFillIceCells", "kineticDemandIceCells", "holeFillDeficitIceCells", "placedFillVaporUnits"] as const) {
    parsePhase10C0VNumericIdentity(ledger[field], `${label}.ledger.${field}`);
  }
  nonnegativeInteger(ledger.holeFillCount, `${label}.ledger.holeFillCount`);
  const convergenceLabel = `${label}.convergence`;
  const convergence = object(row.convergence, convergenceLabel);
  exactKeys(convergence, ["scalarRoot", "preEvent", "postEvent"], convergenceLabel);
  const scalarLabel = `${convergenceLabel}.scalarRoot`;
  const scalar = object(convergence.scalarRoot, scalarLabel);
  exactKeys(scalar, ["lowerEndpoint", "upperEndpoint", "selectedRoot", "residual", "relativeResidual", "iterations"], scalarLabel);
  for (const field of ["lowerEndpoint", "upperEndpoint", "selectedRoot", "residual", "relativeResidual"] as const) {
    parsePhase10C0VNumericIdentity(scalar[field], `${scalarLabel}.${field}`);
  }
  nonnegativeInteger(scalar.iterations, `${scalarLabel}.iterations`);
  validateMovingRelaxation(convergence.preEvent, `${convergenceLabel}.preEvent`);
  validateMovingRelaxation(convergence.postEvent, `${convergenceLabel}.postEvent`);
  return snapshot;
}

function validateCheckDetails(value: StrictJson, fields: readonly string[], label: string): JsonObject {
  const row = object(value, label);
  exactKeys(row, [...fields, "passed", "details"], label);
  jsonBoolean(row.passed, `${label}.passed`);
  validateStringArrayValue(row.details, `${label}.details`);
  return row;
}

export function parsePhase10C0VMovingReferenceCheck(value: unknown): StrictJson {
  const label = "Phase 10 C0V moving reference check";
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  exactKeys(
    row,
    ["schema", "protocolId", "method", "monotonicityBracketResidual", "topologyChecks", "fieldEquationChecks", "eventChecks", "ledgerChecks", "verdict", "errors"],
    label,
  );
  literal(row.schema, "phase10-c0v-moving-reference-check-v1", `${label}.schema`);
  string(row.protocolId, `${label}.protocolId`);
  literal(
    row.method,
    "independent-cube-topology-safeguarded-newton-and-equation-residuals",
    `${label}.method`,
  );
  const monotonicityLabel = `${label}.monotonicityBracketResidual`;
  const monotonicity = object(row.monotonicityBracketResidual, monotonicityLabel);
  exactKeys(monotonicity, ["bracketed", "derivativePositive", "candidateResidualRelative", "recomputedRoot", "rootRelativeDifference", "passed"], monotonicityLabel);
  jsonBoolean(monotonicity.bracketed, `${monotonicityLabel}.bracketed`);
  jsonBoolean(monotonicity.derivativePositive, `${monotonicityLabel}.derivativePositive`);
  for (const field of ["candidateResidualRelative", "recomputedRoot", "rootRelativeDifference"] as const) {
    parsePhase10C0VNumericIdentity(monotonicity[field], `${monotonicityLabel}.${field}`);
  }
  jsonBoolean(monotonicity.passed, `${monotonicityLabel}.passed`);
  const topology = validateCheckDetails(
    row.topologyChecks,
    ["activeCellsExact", "neighborsExact", "initialSetsExact", "postSetsExact", "d6hOrbitExact"],
    `${label}.topologyChecks`,
  );
  for (const field of ["activeCellsExact", "neighborsExact", "initialSetsExact", "postSetsExact", "d6hOrbitExact"] as const) {
    jsonBoolean(topology[field], `${label}.topologyChecks.${field}`);
  }
  const field = validateCheckDetails(
    row.fieldEquationChecks,
    ["preLInf", "preWeightedL2", "preFixedPointResidual", "postLInf", "postFixedPointResidual", "shellExact", "zerosExact"],
    `${label}.fieldEquationChecks`,
  );
  for (const key of ["preLInf", "preWeightedL2", "preFixedPointResidual", "postLInf", "postFixedPointResidual"] as const) {
    parsePhase10C0VNumericIdentity(field[key], `${label}.fieldEquationChecks.${key}`);
  }
  jsonBoolean(field.shellExact, `${label}.fieldEquationChecks.shellExact`);
  jsonBoolean(field.zerosExact, `${label}.fieldEquationChecks.zerosExact`);
  const event = validateCheckDetails(
    row.eventChecks,
    ["ratesTiedPositive", "otherRatesZero", "attachedNowByStep", "eventTimeRelativeDifference"],
    `${label}.eventChecks`,
  );
  jsonBoolean(event.ratesTiedPositive, `${label}.eventChecks.ratesTiedPositive`);
  jsonBoolean(event.otherRatesZero, `${label}.eventChecks.otherRatesZero`);
  integerArray(event.attachedNowByStep, `${label}.eventChecks.attachedNowByStep`);
  parsePhase10C0VNumericIdentity(event.eventTimeRelativeDifference, `${label}.eventChecks.eventTimeRelativeDifference`);
  const ledger = validateCheckDetails(
    row.ledgerChecks,
    ["placedAbsDifference", "clippingAbsDifference", "demandIdentityAbsResidual", "vaporRelativeDifference", "holeFillExact"],
    `${label}.ledgerChecks`,
  );
  for (const key of ["placedAbsDifference", "clippingAbsDifference", "demandIdentityAbsResidual", "vaporRelativeDifference"] as const) {
    parsePhase10C0VNumericIdentity(ledger[key], `${label}.ledgerChecks.${key}`);
  }
  jsonBoolean(ledger.holeFillExact, `${label}.ledgerChecks.holeFillExact`);
  const verdict = oneOf(row.verdict, ["pass", "fail"], `${label}.verdict`);
  const errors = stringArray(row.errors, `${label}.errors`);
  const allGroupsPass = monotonicity.passed === true &&
    topology.passed === true && field.passed === true && event.passed === true && ledger.passed === true;
  if ((verdict === "pass") !== (allGroupsPass && errors.length === 0)) {
    invalid(label, "verdict must be reduced from every check group and errors");
  }
  return snapshot;
}

function validateZeroExecution(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(
    row,
    ["solverInvocations", "referenceInvocations", "productionInvocations", "witnessesProduced", "numericalEvaluations", "scientificProcessHours"],
    label,
  );
  for (const field of Object.keys(row)) fixedNumber(row[field] as StrictJson, 0, `${label}.${field}`);
}

function validateStaticPublicFinding(value: StrictJson, label: string, index: number): void {
  const row = object(value, label);
  exactKeys(row, ["findingId", "operandIds", "visibility", "contractChangeRequired", "evidenceLocator"], label);
  const expected = STATIC_FINDING_EXPECTATIONS[index];
  if (expected === undefined) invalid(label, "has no frozen finding at this ordinal");
  literal(row.findingId, expected.findingId, `${label}.findingId`);
  const operandIds = stringArray(row.operandIds, `${label}.operandIds`);
  requireExactArray(operandIds, expected.operandIds, `${label}.operandIds`);
  literal(row.visibility, expected.visibility, `${label}.visibility`);
  fixedBoolean(row.contractChangeRequired, false, `${label}.contractChangeRequired`);
  const locator = string(row.evidenceLocator, `${label}.evidenceLocator`);
  if (locator !== expected.evidenceLocator) invalid(`${label}.evidenceLocator`, "must equal the frozen locator");
  const separator = locator.indexOf("#");
  if (separator <= 0 || separator === locator.length - 1) {
    invalid(`${label}.evidenceLocator`, "must be <normalized-repository-path>#<nonempty-locator>");
  }
  safePath(locator.slice(0, separator) as StrictJson, `${label}.evidenceLocator path`);
}

function validateStaticSourceAudit(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(row, ["auditId", "currentContractOnly", "inspectedArtifacts", "publicApiFindings", "executionRecord"], label);
  string(row.auditId, `${label}.auditId`);
  fixedBoolean(row.currentContractOnly, true, `${label}.currentContractOnly`);
  const artifacts = array(row.inspectedArtifacts, `${label}.inspectedArtifacts`);
  if (artifacts.length === 0) invalid(`${label}.inspectedArtifacts`, "must be nonempty");
  const artifactPaths = artifacts.map((entry, index) =>
    artifactIdentity(entry, `${label}.inspectedArtifacts[${index}]`).path);
  sortedUnique(artifactPaths, `${label}.inspectedArtifacts paths`);
  const findings = array(row.publicApiFindings, `${label}.publicApiFindings`);
  if (findings.length !== 2) invalid(`${label}.publicApiFindings`, "must contain exactly two findings");
  findings.forEach((entry, index) => validateStaticPublicFinding(entry, `${label}.publicApiFindings[${index}]`, index));
  validateZeroExecution(row.executionRecord, `${label}.executionRecord`);
}

function validateAttemptedRoutes(value: StrictJson, label: string): void {
  const routes = array(value, label);
  if (routes.length !== STATIC_ROUTE_EXPECTATIONS.length) {
    invalid(label, "must contain exactly the two frozen route dispositions");
  }
  const routeIds = routes.map((entry, index) => {
    const routeLabel = `${label}[${index}]`;
    const route = object(entry, routeLabel);
    exactKeys(route, STATIC_ROUTE_FIELDS, routeLabel);
    for (const field of STATIC_ROUTE_FIELDS) string(route[field], `${routeLabel}.${field}`);
    const expected = STATIC_ROUTE_EXPECTATIONS[index];
    if (expected === undefined) invalid(routeLabel, "has no frozen route at this ordinal");
    literal(route.routeId, expected[0], `${routeLabel}.routeId`);
    literal(route.disposition, expected[1], `${routeLabel}.disposition`);
    return expected[0];
  });
  requireExactArray(routeIds, STATIC_ROUTE_EXPECTATIONS.map((entry) => entry[0]), `${label} routeIds`);
}

export function parsePhase10C0VStaticRefusalCandidate(value: unknown): StrictJson {
  const label = "Phase 10 C0V static refusal candidate";
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  exactKeys(
    row,
    ["schema", "protocolId", "reasonCode", "currentContractScope", "unavailableOperands", "attemptedRoutes", "forbiddenSubstitutes", "contractEvidence", "executionRecord", "downstreamEffect", "claimBoundary"],
    label,
  );
  literal(row.schema, "phase10-c0v-static-refusal-candidate-v1", `${label}.schema`);
  string(row.protocolId, `${label}.protocolId`);
  literal(
    row.reasonCode,
    "current-contract-lacks-independent-static-spatial-reference-v1",
    `${label}.reasonCode`,
  );
  literal(row.currentContractScope, "accepted-current-public-solver-contract-only", `${label}.currentContractScope`);
  const unavailable = stringArray(row.unavailableOperands, `${label}.unavailableOperands`);
  const substitutes = stringArray(row.forbiddenSubstitutes, `${label}.forbiddenSubstitutes`);
  requireExactArray(unavailable, STATIC_UNAVAILABLE_OPERANDS, `${label}.unavailableOperands`);
  requireExactArray(substitutes, STATIC_FORBIDDEN_SUBSTITUTES, `${label}.forbiddenSubstitutes`);
  validateAttemptedRoutes(row.attemptedRoutes, `${label}.attemptedRoutes`);
  validateStaticSourceAudit(row.contractEvidence, `${label}.contractEvidence`);
  validateZeroExecution(row.executionRecord, `${label}.executionRecord`);
  const downstream = object(row.downstreamEffect, `${label}.downstreamEffect`);
  exactKeys(downstream, COMMON_TERMINAL_FIELDS, `${label}.downstreamEffect`);
  for (const field of COMMON_TERMINAL_FIELDS) string(downstream[field], `${label}.downstreamEffect.${field}`);
  const claim = object(row.claimBoundary, `${label}.claimBoundary`);
  exactKeys(claim, COMMON_CLAIM_FIELDS, `${label}.claimBoundary`);
  const allowed = stringArray(claim.allowed, `${label}.claimBoundary.allowed`);
  const forbidden = stringArray(claim.forbidden, `${label}.claimBoundary.forbidden`);
  if (allowed.length === 0 || forbidden.length === 0) invalid(`${label}.claimBoundary`, "must be nonempty");
  sortedUnique(allowed, `${label}.claimBoundary.allowed`);
  sortedUnique(forbidden, `${label}.claimBoundary.forbidden`);
  return snapshot;
}

export function parsePhase10C0VStaticRefusalCheck(value: unknown): StrictJson {
  const label = "Phase 10 C0V static refusal check";
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  exactKeys(
    row,
    ["schema", "protocolId", "method", "groundChecks", "routeChecks", "scopeChecks", "zeroExecutionChecks", "verdict", "errors"],
    label,
  );
  literal(row.schema, "phase10-c0v-static-refusal-check-v1", `${label}.schema`);
  string(row.protocolId, `${label}.protocolId`);
  literal(
    row.method,
    "independent-current-contract-ground-route-scope-and-zero-execution-check",
    `${label}.method`,
  );
  const groups = ["groundChecks", "routeChecks", "scopeChecks", "zeroExecutionChecks"].map((field) =>
    validateCheckDetails(row[field] as StrictJson, [], `${label}.${field}`));
  const verdict = oneOf(row.verdict, ["pass", "fail"], `${label}.verdict`);
  const errors = stringArray(row.errors, `${label}.errors`);
  if ((verdict === "pass") !== (groups.every((group) => group.passed === true) && errors.length === 0)) {
    invalid(label, "verdict must be reduced from every refusal-validity group and errors");
  }
  return snapshot;
}

const FINAL_CODE_RECEIPT_FIELDS = [
  "protocolBindings",
  "freezePreflight",
  "commands",
  "timestamps",
  "codeIdentities",
  "observedImports",
  "allowedSharedImports",
  "forbiddenImportPatterns",
  "forbiddenImportsObserved",
  "generatorCheckerScientificImportOverlap",
  "pass",
] as const;

function artifactIdentityArray(
  value: StrictJson,
  label: string,
): readonly Phase10C0VArtifactIdentity[] {
  const identities = array(value, label).map((entry, index) =>
    artifactIdentity(entry, `${label}[${index}]`));
  if (identities.length === 0) invalid(label, "must be nonempty");
  const paths = identities.map((entry) => entry.path);
  sortedUnique(paths, `${label} paths`);
  return Object.freeze(identities);
}

export function parsePhase10C0VFinalCodeAndImportReceipt(
  value: unknown,
): Phase10C0VFinalCodeAndImportReceipt {
  const label = "Phase 10 C0V final code/import receipt";
  const row = root(value, label);
  exactKeys(row, FINAL_CODE_RECEIPT_FIELDS, label);
  const preflightLabel = `${label}.freezePreflight`;
  const preflight = object(row.freezePreflight, preflightLabel);
  exactKeys(preflight, ["branch", "head", "runtime", "trackedWorktreeClean", "protocol"], preflightLabel);
  const head = string(preflight.head, `${preflightLabel}.head`);
  if (!GIT_COMMIT.test(head)) invalid(`${preflightLabel}.head`, "must be a Git commit");

  const commandsLabel = `${label}.commands`;
  const commands = object(row.commands, commandsLabel);
  exactKeys(commands, ["derive", "check", "publish"], commandsLabel);
  const timestampsLabel = `${label}.timestamps`;
  const timestamps = object(row.timestamps, timestampsLabel);
  exactKeys(
    timestamps,
    ["deriveStartedAt", "deriveCompletedAt", "checkCompletedAt", "publishCompletedAt"],
    timestampsLabel,
  );
  const timestampValues = [
    string(timestamps.deriveStartedAt, `${timestampsLabel}.deriveStartedAt`),
    string(timestamps.deriveCompletedAt, `${timestampsLabel}.deriveCompletedAt`),
    string(timestamps.checkCompletedAt, `${timestampsLabel}.checkCompletedAt`),
    string(timestamps.publishCompletedAt, `${timestampsLabel}.publishCompletedAt`),
  ] as const;
  const instants = timestampValues.map((entry, index) => {
    const instant = Date.parse(entry);
    if (!entry.endsWith("Z") || !Number.isFinite(instant)) {
      invalid(`${timestampsLabel}[${index}]`, "must be a UTC ISO-8601 instant");
    }
    return instant;
  });
  if (instants.some((instant, index) => index > 0 && instant < (instants[index - 1] as number))) {
    invalid(timestampsLabel, "must be chronological");
  }

  const identitiesLabel = `${label}.codeIdentities`;
  const identities = object(row.codeIdentities, identitiesLabel);
  const identityKeys = [
    "generator",
    "independentChecker",
    "sharedParser",
    "neutralDerive",
    "neutralCheck",
    "neutralPublish",
  ] as const;
  exactKeys(identities, identityKeys, identitiesLabel);
  const expectedRoles = [
    "generator",
    "independent-checker",
    "shared-parser",
    "neutral-derive",
    "neutral-check",
    "neutral-publish",
  ] as const;
  const parsedIdentities = identityKeys.map((key, index) => {
    const identity = codeIdentity(identities[key], `${identitiesLabel}.${key}`);
    if (identity.role !== expectedRoles[index]) invalid(`${identitiesLabel}.${key}.role`, "does not match its keyed role");
    return identity;
  });
  const neutralExpected = [
    ["runner/src/phase10-c0v-reference-derive.ts", "derivePhase10C0VReferenceCandidate"],
    ["runner/src/phase10-c0v-reference-check.ts", "verifyPhase10C0VReferenceCandidate"],
    ["runner/src/phase10-c0v-reference-publish.ts", "publishPhase10C0VReference"],
  ] as const;
  for (let index = 0; index < neutralExpected.length; index++) {
    const identity = parsedIdentities[index + 3] as Phase10C0VCodeIdentity;
    const expected = neutralExpected[index] as (typeof neutralExpected)[number];
    if (identity.modulePath !== expected[0] || identity.exportName !== expected[1]) {
      invalid(`${identitiesLabel}.${identityKeys[index + 3]}`, "does not name the frozen neutral wrapper export");
    }
  }

  const importsLabel = `${label}.observedImports`;
  const imports = object(row.observedImports, importsLabel);
  exactKeys(imports, ["generator", "independentChecker"], importsLabel);
  const allowedSharedImports = stringArray(row.allowedSharedImports, `${label}.allowedSharedImports`);
  requireExactArray(allowedSharedImports, SHARED_IMPORT_ALLOWLIST, `${label}.allowedSharedImports`);
  const forbiddenImportPatterns = stringArray(row.forbiddenImportPatterns, `${label}.forbiddenImportPatterns`);
  requireExactArray(forbiddenImportPatterns, FORBIDDEN_REFERENCE_IMPORTS, `${label}.forbiddenImportPatterns`);
  const forbiddenImportsObserved = array(row.forbiddenImportsObserved, `${label}.forbiddenImportsObserved`);
  const scientificOverlap = array(
    row.generatorCheckerScientificImportOverlap,
    `${label}.generatorCheckerScientificImportOverlap`,
  );
  if (forbiddenImportsObserved.length !== 0 || scientificOverlap.length !== 0) {
    invalid(label, "cannot pass with a forbidden import or scientific overlap");
  }
  fixedBoolean(row.pass, true, `${label}.pass`);
  return Object.freeze({
    protocolBindings: protocolBindings(row.protocolBindings, `${label}.protocolBindings`),
    freezePreflight: Object.freeze({
      branch: literal(preflight.branch, "phase10/evidence-verification", `${preflightLabel}.branch`),
      head,
      runtime: literal(preflight.runtime, "v24.13.1", `${preflightLabel}.runtime`),
      trackedWorktreeClean: fixedBoolean(preflight.trackedWorktreeClean, true, `${preflightLabel}.trackedWorktreeClean`) as true,
      protocol: artifactIdentity(preflight.protocol, `${preflightLabel}.protocol`),
    }),
    commands: Object.freeze({
      derive: string(commands.derive, `${commandsLabel}.derive`),
      check: string(commands.check, `${commandsLabel}.check`),
      publish: string(commands.publish, `${commandsLabel}.publish`),
    }),
    timestamps: Object.freeze({
      deriveStartedAt: timestampValues[0],
      deriveCompletedAt: timestampValues[1],
      checkCompletedAt: timestampValues[2],
      publishCompletedAt: timestampValues[3],
    }),
    codeIdentities: Object.freeze({
      generator: parsedIdentities[0] as Phase10C0VCodeIdentity,
      independentChecker: parsedIdentities[1] as Phase10C0VCodeIdentity,
      sharedParser: parsedIdentities[2] as Phase10C0VCodeIdentity,
      neutralDerive: parsedIdentities[3] as Phase10C0VCodeIdentity,
      neutralCheck: parsedIdentities[4] as Phase10C0VCodeIdentity,
      neutralPublish: parsedIdentities[5] as Phase10C0VCodeIdentity,
    }),
    observedImports: Object.freeze({
      generator: artifactIdentityArray(imports.generator, `${importsLabel}.generator`),
      independentChecker: artifactIdentityArray(imports.independentChecker, `${importsLabel}.independentChecker`),
    }),
    allowedSharedImports,
    forbiddenImportPatterns,
    forbiddenImportsObserved: Object.freeze([] as const),
    generatorCheckerScientificImportOverlap: Object.freeze([] as const),
    pass: true,
  });
}

const REFERENCE_FIELDS = [
  "schema",
  "referenceId",
  "protocolId",
  "layerId",
  "branch",
  "protocol",
  "freezeCommit",
  "createdAt",
  "generatorOutput",
  "independentCheck",
  "codeAndImportReceipt",
  "comparison",
  "disposition",
  "claimBoundary",
] as const;

function referenceComparison(value: StrictJson, label: string): Phase10C0VReferenceComparison {
  const row = object(value, label);
  exactKeys(row, ["method", "expectedOutcome", "observedOutcome", "errors"], label);
  const observedOutcome = oneOf(
    row.observedOutcome,
    ["pass", "fail", "refusal"],
    `${label}.observedOutcome`,
  );
  const errors = stringArray(row.errors, `${label}.errors`);
  if ((observedOutcome === "pass") !== (errors.length === 0)) {
    invalid(label, "must have no errors exactly when observedOutcome is pass");
  }
  return Object.freeze({
    method: literal(row.method, "independent-reexecution", `${label}.method`),
    expectedOutcome: oneOf(row.expectedOutcome, ["pass", "refusal"], `${label}.expectedOutcome`),
    observedOutcome,
    errors,
  });
}

function utcIsoInstant(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (!result.endsWith("Z") || !Number.isFinite(Date.parse(result))) {
    invalid(label, "must be a UTC ISO-8601 instant");
  }
  return result;
}

function validateClaimBoundaryValue(value: StrictJson, label: string): void {
  const row = object(value, label);
  exactKeys(row, COMMON_CLAIM_FIELDS, label);
  const allowed = stringArray(row.allowed, `${label}.allowed`);
  const forbidden = stringArray(row.forbidden, `${label}.forbidden`);
  if (allowed.length === 0 || forbidden.length === 0) invalid(label, "must be nonempty");
  sortedUnique(allowed, `${label}.allowed`);
  sortedUnique(forbidden, `${label}.forbidden`);
}

export function parsePhase10C0VReferenceEnvelope(
  value: unknown,
): Phase10C0VReferenceEnvelope {
  const label = "Phase 10 C0V reference envelope";
  const row = root(value, label);
  exactKeys(row, REFERENCE_FIELDS, label);
  const schema = oneOf(
    row.schema,
    [PHASE10_C0V_RADIAL_REFERENCE_SCHEMA, PHASE10_C0V_MOVING_REFERENCE_SCHEMA],
    `${label}.schema`,
  );
  const layerId = oneOf(
    row.layerId,
    ["C0V-RADIAL", "C0V-MOVING-EVENT"],
    `${label}.layerId`,
  );
  if (
    (schema === PHASE10_C0V_RADIAL_REFERENCE_SCHEMA && layerId !== "C0V-RADIAL") ||
    (schema === PHASE10_C0V_MOVING_REFERENCE_SCHEMA && layerId !== "C0V-MOVING-EVENT")
  ) {
    invalid(label, "schema and layerId disagree");
  }
  const protocolId = string(row.protocolId, `${label}.protocolId`);
  const freezeCommit = string(row.freezeCommit, `${label}.freezeCommit`);
  if (!GIT_COMMIT.test(freezeCommit)) invalid(`${label}.freezeCommit`, "must be a Git commit");
  const generatorOutput = schema === PHASE10_C0V_RADIAL_REFERENCE_SCHEMA
    ? parsePhase10C0VRadialReferenceCandidate(row.generatorOutput)
    : parsePhase10C0VMovingReferenceCandidate(row.generatorOutput);
  const independentCheck = schema === PHASE10_C0V_RADIAL_REFERENCE_SCHEMA
    ? parsePhase10C0VRadialReferenceCheck(row.independentCheck)
    : parsePhase10C0VMovingReferenceCheck(row.independentCheck);
  const generatorRow = object(generatorOutput, `${label}.generatorOutput`);
  const independentRow = object(independentCheck, `${label}.independentCheck`);
  literal(generatorRow.protocolId, protocolId, `${label}.generatorOutput.protocolId`);
  literal(independentRow.protocolId, protocolId, `${label}.independentCheck.protocolId`);
  validateClaimBoundaryValue(row.claimBoundary, `${label}.claimBoundary`);
  const comparison = referenceComparison(row.comparison, `${label}.comparison`);
  if (comparison.expectedOutcome !== "pass") {
    invalid(`${label}.comparison.expectedOutcome`, "must be pass for an independent-reference protocol");
  }
  const independentPass = schema === PHASE10_C0V_RADIAL_REFERENCE_SCHEMA
    ? independentRow.pass === true
    : independentRow.verdict === "pass";
  if ((comparison.observedOutcome === "pass") !== independentPass) {
    invalid(`${label}.comparison.observedOutcome`, "must equal the raw independent-check outcome");
  }
  requireExactArray(
    comparison.errors,
    stringArray(independentRow.errors, `${label}.independentCheck.errors`),
    `${label}.comparison.errors`,
  );
  const disposition = oneOf(
    row.disposition,
    ["reference-frozen", "reference-discrepancy-refusal"],
    `${label}.disposition`,
  );
  if ((disposition === "reference-frozen") !== (comparison.observedOutcome === "pass")) {
    invalid(label, "disposition disagrees with independent comparison outcome");
  }
  return Object.freeze({
    schema,
    referenceId: string(row.referenceId, `${label}.referenceId`),
    protocolId,
    layerId,
    branch: literal(row.branch, "independent-reference", `${label}.branch`),
    protocol: artifactIdentity(row.protocol, `${label}.protocol`),
    freezeCommit,
    createdAt: utcIsoInstant(row.createdAt, `${label}.createdAt`),
    generatorOutput,
    independentCheck,
    codeAndImportReceipt: parsePhase10C0VFinalCodeAndImportReceipt(row.codeAndImportReceipt),
    comparison,
    disposition,
    claimBoundary: strictJsonSnapshot(row.claimBoundary),
  });
}

const REFUSAL_FIELDS = [
  "schema",
  "refusalId",
  "protocolId",
  "layerId",
  "branch",
  "protocol",
  "freezeCommit",
  "createdAt",
  "reasonCode",
  "unavailableOperands",
  "attemptedRoutes",
  "forbiddenSubstitutes",
  "contractEvidence",
  "independentCheck",
  "executionRecord",
  "downstreamEffect",
  "claimBoundary",
] as const;

export function parsePhase10C0VReferenceRefusal(
  value: unknown,
): Phase10C0VReferenceRefusal {
  const label = "Phase 10 C0V reference refusal";
  const row = root(value, label);
  exactKeys(row, REFUSAL_FIELDS, label);
  const protocolId = string(row.protocolId, `${label}.protocolId`);
  const freezeCommit = string(row.freezeCommit, `${label}.freezeCommit`);
  if (!GIT_COMMIT.test(freezeCommit)) invalid(`${label}.freezeCommit`, "must be a Git commit");
  const unavailableOperands = stringArray(row.unavailableOperands, `${label}.unavailableOperands`);
  const forbiddenSubstitutes = stringArray(row.forbiddenSubstitutes, `${label}.forbiddenSubstitutes`);
  requireExactArray(unavailableOperands, STATIC_UNAVAILABLE_OPERANDS, `${label}.unavailableOperands`);
  requireExactArray(forbiddenSubstitutes, STATIC_FORBIDDEN_SUBSTITUTES, `${label}.forbiddenSubstitutes`);
  validateAttemptedRoutes(row.attemptedRoutes, `${label}.attemptedRoutes`);
  const contractEvidenceLabel = `${label}.contractEvidence`;
  const contractEvidence = object(row.contractEvidence, contractEvidenceLabel);
  exactKeys(contractEvidence, ["sourceAudit", "codeAndImportReceipt"], contractEvidenceLabel);
  validateStaticSourceAudit(contractEvidence.sourceAudit, `${contractEvidenceLabel}.sourceAudit`);
  parsePhase10C0VFinalCodeAndImportReceipt(contractEvidence.codeAndImportReceipt);
  const independentCheck = parsePhase10C0VStaticRefusalCheck(row.independentCheck);
  const independentRow = object(independentCheck, `${label}.independentCheck`);
  literal(independentRow.protocolId, protocolId, `${label}.independentCheck.protocolId`);
  if (independentRow.verdict !== "pass") {
    invalid(`${label}.independentCheck.verdict`, "must pass the scoped refusal-validity check");
  }
  if (array(independentRow.errors, `${label}.independentCheck.errors`).length !== 0) {
    invalid(`${label}.independentCheck.errors`, "must be empty when the refusal-validity check passes");
  }
  validateZeroExecution(row.executionRecord, `${label}.executionRecord`);
  const downstream = object(row.downstreamEffect, `${label}.downstreamEffect`);
  exactKeys(downstream, COMMON_TERMINAL_FIELDS, `${label}.downstreamEffect`);
  for (const field of COMMON_TERMINAL_FIELDS) string(downstream[field], `${label}.downstreamEffect.${field}`);
  validateClaimBoundaryValue(row.claimBoundary, `${label}.claimBoundary`);
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_REFERENCE_REFUSAL_SCHEMA, `${label}.schema`),
    refusalId: string(row.refusalId, `${label}.refusalId`),
    protocolId,
    layerId: literal(row.layerId, "C0V-STATIC", `${label}.layerId`),
    branch: literal(row.branch, "reference-refusal", `${label}.branch`),
    protocol: artifactIdentity(row.protocol, `${label}.protocol`),
    freezeCommit,
    createdAt: utcIsoInstant(row.createdAt, `${label}.createdAt`),
    reasonCode: literal(
      row.reasonCode,
      "current-contract-lacks-independent-static-spatial-reference-v1",
      `${label}.reasonCode`,
    ),
    unavailableOperands,
    attemptedRoutes: strictJsonSnapshot(row.attemptedRoutes),
    forbiddenSubstitutes,
    contractEvidence: strictJsonSnapshot(row.contractEvidence),
    independentCheck,
    executionRecord: strictJsonSnapshot(row.executionRecord),
    downstreamEffect: strictJsonSnapshot(row.downstreamEffect),
    claimBoundary: strictJsonSnapshot(row.claimBoundary),
  });
}

function schemaContractEndpoint(
  value: StrictJson,
  schemaId: string,
  label: string,
): Phase10C0VSchemaContractEndpoint {
  const row = object(value, label);
  exactKeys(
    row,
    [
      "schemaId",
      "format",
      "exactTopLevelFields",
      "fieldContracts",
      "nestedContracts",
      "enums",
      "nullRules",
      "invariants",
    ],
    label,
  );
  literal(row.schemaId, schemaId, `${label}.schemaId`);
  const exactTopLevelFields = stringArray(
    row.exactTopLevelFields,
    `${label}.exactTopLevelFields`,
  );
  if (exactTopLevelFields.length === 0 || new Set(exactTopLevelFields).size !== exactTopLevelFields.length) {
    invalid(`${label}.exactTopLevelFields`, "must be nonempty and unique");
  }
  const fieldContractObject = object(row.fieldContracts, `${label}.fieldContracts`);
  const fieldContractKeys = Object.keys(fieldContractObject).sort();
  const exactKeysSorted = [...exactTopLevelFields].sort();
  if (
    fieldContractKeys.length !== exactKeysSorted.length ||
    fieldContractKeys.some((field, index) => field !== exactKeysSorted[index])
  ) {
    invalid(`${label}.fieldContracts`, "must exactly cover exactTopLevelFields");
  }
  const fieldContracts: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [field, contract] of Object.entries(fieldContractObject)) {
    fieldContracts[field] = string(contract, `${label}.fieldContracts.${field}`);
  }
  const nullRules = stringArray(row.nullRules, `${label}.nullRules`);
  const invariants = stringArray(row.invariants, `${label}.invariants`);
  if (nullRules.length === 0 || invariants.length === 0) {
    invalid(label, "must state null rules and substantive invariants");
  }
  return Object.freeze({
    schemaId,
    format: oneOf(row.format, ["json", "jsonl-row", "binary"], `${label}.format`),
    exactTopLevelFields,
    fieldContracts: Object.freeze(fieldContracts),
    nestedContracts: strictJsonSnapshot(row.nestedContracts),
    enums: strictJsonSnapshot(row.enums),
    nullRules,
    invariants,
  });
}

export function parsePhase10C0VSchemaContracts(value: unknown): Phase10C0VSchemaContracts {
  const label = "Phase 10 C0V schema contracts";
  const row = root(value, label);
  exactKeys(row, ["schema", "createdOn", "conformance", "definitions", "schemas"], label);
  const expectedDefinitionIds = [
    "artifactIdentity",
    "artifactPaths",
    "attemptedRoute",
    "checkResult",
    "claimBoundary",
    "codeAndImportReceipt",
    "codeIdentity",
    "independence",
    "movingCriteria",
    "movingFixture",
    "movingFormulas",
    "movingReferenceCandidate",
    "movingReferenceCheck",
    "movingReferenceDerivation",
    "movingTargetedCheck",
    "movingTopology",
    "negativeControl",
    "negativeControlResult",
    "numericIdentity",
    "observedReferenceImports",
    "protocolBindings",
    "radialCriteria",
    "radialFormulas",
    "radialProblem",
    "radialReferenceCandidate",
    "radialReferenceCheck",
    "radialReferenceDerivation",
    "radialRoster",
    "radialTargetedCheck",
    "receiptCodeIdentities",
    "receiptCodeIdentity",
    "referenceCommands",
    "referenceComparison",
    "referenceFreezePreflight",
    "referenceTimestamps",
    "resourceBoundary",
    "staticFinalContractEvidence",
    "staticNotApplicableObligations",
    "staticProtocolFinding",
    "staticPublicApiFinding",
    "staticRefusalCandidate",
    "staticRefusalCheck",
    "staticRefusalGrounds",
    "staticSourceAudit",
    "staticTargetedCheck",
    "terminalSemantics",
    "zeroExecutionRecord",
  ] as const;
  const definitions = object(row.definitions, `${label}.definitions`);
  requireExactArray(Object.keys(definitions).sort(), expectedDefinitionIds, `${label}.definition IDs`);
  for (const definitionId of expectedDefinitionIds) {
    const definitionLabel = `${label}.definitions.${definitionId}`;
    const definition = object(definitions[definitionId] as StrictJson, definitionLabel);
    exactKeys(definition, ["exactFields", "fieldContracts"], definitionLabel);
    const fields = stringArray(definition.exactFields, `${definitionLabel}.exactFields`);
    if (fields.length === 0 || new Set(fields).size !== fields.length) {
      invalid(`${definitionLabel}.exactFields`, "must be nonempty and unique");
    }
    const contracts = object(definition.fieldContracts, `${definitionLabel}.fieldContracts`);
    requireExactArray(Object.keys(contracts).sort(), [...fields].sort(), `${definitionLabel}.fieldContracts keys`);
    for (const [field, contract] of Object.entries(contracts)) {
      string(contract, `${definitionLabel}.fieldContracts.${field}`);
    }
  }
  const conformanceLabel = `${label}.conformance`;
  const conformance = object(row.conformance, conformanceLabel);
  exactKeys(
    conformance,
    ["unknownFields", "optionalFields", "numbers", "jsonEncoding", "jsonlEncoding", "binaryEncoding", "identityArrays", "producerVerdicts"],
    conformanceLabel,
  );
  literal(conformance.unknownFields, "reject at every object depth", `${conformanceLabel}.unknownFields`);
  fixedBoolean(conformance.optionalFields, false, `${conformanceLabel}.optionalFields`);
  for (const field of ["numbers", "jsonEncoding", "jsonlEncoding", "binaryEncoding", "identityArrays", "producerVerdicts"] as const) {
    string(conformance[field], `${conformanceLabel}.${field}`);
  }
  const schemaRows = object(row.schemas, `${label}.schemas`);
  const expectedSchemaIds = [
    "phase10-c0v-aggregate-v1",
    "phase10-c0v-attempt-row-v1",
    "phase10-c0v-moving-evaluation-v1",
    "phase10-c0v-moving-protocol-v1",
    "phase10-c0v-moving-reference-v1",
    "phase10-c0v-moving-result-v1",
    "phase10-c0v-moving-witness-v1",
    "phase10-c0v-radial-evaluation-v1",
    "phase10-c0v-radial-protocol-v1",
    "phase10-c0v-radial-reference-v1",
    "phase10-c0v-radial-result-v1",
    "phase10-c0v-radial-witness-v1",
    "phase10-c0v-reference-refusal-v1",
    "phase10-c0v-resource-ledger-v1",
    "phase10-c0v-static-evaluation-v1",
    "phase10-c0v-static-protocol-v1",
    "phase10-c0v-static-reference-v1",
    "phase10-c0v-static-result-v1",
    "phase10-c0v-static-witness-v1",
    "phase10-c0v-terminal-table-v1",
  ] as const;
  requireExactArray(Object.keys(schemaRows).sort(), expectedSchemaIds, `${label}.schema IDs`);
  const schemas: Record<string, Phase10C0VSchemaContractEndpoint> = Object.create(null) as Record<
    string,
    Phase10C0VSchemaContractEndpoint
  >;
  for (const schemaId of Object.keys(schemaRows).sort()) {
    schemas[schemaId] = schemaContractEndpoint(
      schemaRows[schemaId] as StrictJson,
      schemaId,
      `${label}.schemas.${schemaId}`,
    );
  }
  return Object.freeze({
    schema: literal(
      row.schema,
      PHASE10_C0V_SCHEMA_CONTRACTS_SCHEMA,
      `${label}.schema`,
    ),
    createdOn: literal(row.createdOn, "2026-08-21", `${label}.createdOn`),
    conformance: strictJsonSnapshot(row.conformance),
    definitions: strictJsonSnapshot(row.definitions),
    schemas: Object.freeze(schemas),
  });
}

export function assertPhase10C0VArtifactTopLevelContract(
  value: unknown,
  schemaId: string,
  contracts: Phase10C0VSchemaContracts,
): StrictJson {
  const label = `${schemaId} artifact`;
  const snapshot = strictJsonSnapshot(value);
  const row = object(snapshot, label);
  const contract = contracts.schemas[schemaId];
  if (contract === undefined) invalid(label, "has no registered C0V schema contract");
  if (contract.format === "binary") invalid(label, "uses the binary witness format");
  exactKeys(row, contract.exactTopLevelFields, label);
  literal(row.schema, schemaId, `${label}.schema`);
  return snapshot;
}
