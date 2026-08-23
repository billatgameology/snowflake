import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  derivePhase10C0VRadialReference,
} from "../src/phase10-c0v-radial-reference-derive.ts";
import {
  independentlyCheckPhase10C0VRadialReference,
} from "../src/phase10-c0v-radial-reference-check.ts";
import {
  independentlyEvaluatePhase10C0VRadialSyntheticFixture,
  type Phase10C0VRadialEvaluationInput,
} from "../src/phase10-c0v-radial-evaluator.ts";
import {
  classifyPhase10C0VRadialCampaign,
  materializePhase10C0VRadialCampaign,
  phase10C0VRadialSyntheticFixtureCheckCaller,
  independentlyWitnessPhase10RadialFiniteShellMutation,
  independentlyWitnessPhase10RadialRobinMutation,
  type Phase10C0VRadialSyntheticFixtureCheckCallerInput,
} from "../src/phase10-c0v-radial-checks.ts";
import {
  phase10RadialFiniteShellTerm,
  phase10RadialRobinCoefficient,
  type Phase10C0VRadialNegativeControlInvocationBoundary,
} from "../src/phase10-c0v-radial-negative-controls.ts";
import {
  independentlyReprovePhase10C0VRadialRawArtifactsSyntheticFixture,
  type Phase10C0VRadialNegativeControlArtifact,
} from "../src/phase10-c0v-radial-reproof.ts";
import {
  PHASE10_C0V_RADIAL_CASE_SCALAR_ORDER,
  PHASE10_C0V_RADIAL_GLOBAL_FLOAT_ORDER,
  producePhase10C0VRadialWitness,
  type Phase10C0VRadialProductionOutput,
  type Phase10C0VRadialWitnessLayout,
} from "../src/phase10-c0v-radial-production.ts";
import type { Phase10C0VRadialReferenceInput } from "../src/phase10-c0v-contracts.ts";
import type {
  Phase10C0VS6ArtifactIdentity,
  Phase10C0VS6LifecycleCheckContext,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6DependencyArtifactRosterVariants,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6RetainedPreflight,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6AssertCallableRegistration,
} from "../src/phase10-c0v-s6-import-audit.ts";
import { parsePhase10C0VS6RadialEvaluationBytes } from "../src/phase10-c0v-s6-receipts.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const textEncoder = new TextEncoder();
const CASE_IDS = [
  "radial-dr-0p7um",
  "radial-dr-0p35um",
  "radial-dr-0p175um",
  "radial-dr-0p0875um",
] as const;
const NODE_COUNTS = [21, 40, 80, 159] as const;
const RECORD_BYTES = [523, 828, 1_469, 2_734] as const;
const SHARED_RUNTIME_CLOSURE_PATHS = Object.freeze([
  "runner/src/gate4-evidence.ts",
  "runner/src/phase10-c0v-contracts.ts",
  "runner/src/phase10-c0v-s6-contracts.ts",
  "runner/src/phase10-c0v-s6-execution-contracts.ts",
] as const);

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value: unknown): Uint8Array {
  return textEncoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}

function identity(path: string, bytes: Uint8Array): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function syntheticScience(): Phase10C0VRadialReferenceInput {
  const radiusM = 4.6e-6;
  const farRadiusM = 32.2e-6;
  const requested = [1.4e-6, 0.7e-6, 0.35e-6, 0.175e-6] as const;
  const intervals = [20, 39, 79, 158] as const;
  const rationals = [[138, 100], [46, 65], [138, 395], [138, 790]] as const;
  return Object.freeze({
    protocolId: "synthetic-c0v-radial-s6-v1",
    operands: Object.freeze({
      radiusM,
      farRadiusM,
      sigmaInfinity: 0.0123,
      tempC: -17,
      pressurePa: 75_000,
      alphaHKConst: 0.217,
      physicalConstants: Object.freeze({
        kBoltzmannJPerK: 1.380649e-23,
        celsiusZeroK: 273.15,
        waterMoleculeMassKg: 3e-26,
        iceNumberDensityPerM3: 3.1e28,
        diffusivityAir1AtmM2S: 2e-5,
        standardAtmospherePa: 101_325,
        saturationPressurePrefactorMbar: 3.7e10,
        saturationPressureExponentK: -6_150,
        mbarToPa: 100,
      }),
    }),
    roster: Object.freeze(CASE_IDS.map((caseId, index) => Object.freeze({
      caseId,
      requestedSpacingM: requested[index]!,
      expectedIntervalCount: intervals[index]!,
      expectedNodeCount: NODE_COUNTS[index]!,
      expectedActualSpacingM: (farRadiusM - radiusM) / intervals[index]!,
      actualSpacingUmNumerator: rationals[index]![0],
      actualSpacingUmDenominator: rationals[index]![1],
    }))),
    tolerances: Object.freeze({
      surfaceRelative: 1e-9,
      velocityRelative: 1e-9,
      fieldRelativeLInf: 1e-9,
      fieldWeightedRelativeL2: 1e-9,
      shellNormalized: 1e-12,
      uniformNormalizedLInf: 1e-12,
      robinResidualNormalized: 1e-9,
      generatorCheckerAgreement: 1e-13,
    }),
  });
}

function layout(): Phase10C0VRadialWitnessLayout {
  return Object.freeze({
    magic: "C0VRAD01",
    formatVersion: 1,
    endiannessMarker: 0x01020304,
    schemaId: "phase10-c0v-radial-witness-v1",
    schemaByteLength: 29,
    headerByteLength: 153,
    payloadByteLength: 5_738,
    fileByteLength: 5_891,
    protocolDigestSource: "s5-science-protocol",
    referenceDigestSource: "s5-reference",
    producerEvaluatorSharedRuntimeClosurePaths: SHARED_RUNTIME_CLOSURE_PATHS,
    headerOffsets: Object.freeze({
      magic: Object.freeze([0, 8] as const),
      formatVersion: Object.freeze([8, 12] as const),
      endiannessMarker: Object.freeze([12, 16] as const),
      schemaByteLength: Object.freeze([16, 20] as const),
      schema: Object.freeze([20, 49] as const),
      protocolSha256: Object.freeze([49, 81] as const),
      referenceSha256: Object.freeze([81, 113] as const),
      payloadByteLength: Object.freeze([113, 121] as const),
      payloadSha256: Object.freeze([121, 153] as const),
      payload: Object.freeze([153, 5_891] as const),
    }),
    globalFloatNames: PHASE10_C0V_RADIAL_GLOBAL_FLOAT_ORDER,
    caseScalarNames: PHASE10_C0V_RADIAL_CASE_SCALAR_ORDER,
    caseOrder: CASE_IDS,
    caseNodeCounts: NODE_COUNTS,
    caseRecordByteLengths: RECORD_BYTES,
    payloadPrefixByteLength: 184,
    recordByteLengthPrefixPresent: false,
    numericEncoding: "float64-le-finite-no-negative-zero",
    exactZeroEncoding: "positive-zero",
    trailingBytesAllowed: false,
  });
}

function syntheticReferenceBytes(
  science: Phase10C0VRadialReferenceInput,
  scienceProtocol: Phase10C0VS6ArtifactIdentity,
): Uint8Array {
  const generatorOutput = derivePhase10C0VRadialReference(science);
  const independentCheck = independentlyCheckPhase10C0VRadialReference(science, generatorOutput);
  expect(independentCheck.pass).toBe(true);
  return pretty({
    schema: "phase10-c0v-radial-reference-v1",
    referenceId: "synthetic-c0v-radial-reference-v1",
    protocolId: science.protocolId,
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    protocol: scienceProtocol,
    freezeCommit: "1111111111111111111111111111111111111111",
    createdAt: "2026-08-22T00:00:00.000Z",
    generatorOutput,
    independentCheck,
    codeAndImportReceipt: syntheticCodeAndImportReceipt(scienceProtocol),
    comparison: {
      method: "independent-reexecution",
      expectedOutcome: "pass",
      observedOutcome: "pass",
      errors: [],
    },
    disposition: "reference-frozen",
    claimBoundary: {
      allowed: ["synthetic numerical-control plumbing only"],
      forbidden: ["scientific or validation claim"],
    },
  });
}

function syntheticScienceProtocolBytes(science: Phase10C0VRadialReferenceInput): Uint8Array {
  return pretty({
    schema: "synthetic-c0v-radial-science-protocol-v1",
    protocolId: science.protocolId,
    purpose: "synthetic-only radial production/evaluation differential fixture",
    operands: science.operands,
    roster: science.roster,
    tolerances: science.tolerances,
    claimBoundary: {
      allowed: ["synthetic numerical-control plumbing only"],
      forbidden: ["scientific or validation claim"],
    },
  });
}

function syntheticCodeIdentity(
  role: string,
  modulePath: string,
  exportName: string,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    role,
    modulePath,
    exportName,
    byteLength: 1,
    sha256: "a".repeat(64),
  });
}

function syntheticCodeAndImportReceipt(
  scienceProtocol: Phase10C0VS6ArtifactIdentity,
): Readonly<Record<string, unknown>> {
  const sharedClosure = Object.freeze([
    fixtureIdentity("runner/src/gate4-evidence.ts"),
    fixtureIdentity("runner/src/phase10-c0v-contracts.ts"),
  ]);
  return Object.freeze({
    protocolBindings: {
      foundation: fixtureIdentity("research/synthetic-c0v-foundation.json"),
      obligationMatrix: fixtureIdentity("research/synthetic-c0v-obligation-matrix.json"),
      schemaRegistry: fixtureIdentity("research/synthetic-c0v-schema-registry.json"),
      schemaContracts: fixtureIdentity("research/synthetic-c0v-schema-contracts.json"),
    },
    freezePreflight: {
      branch: "phase10/evidence-verification",
      head: "1".repeat(40),
      runtime: "v24.13.1",
      trackedWorktreeClean: true,
      protocol: scienceProtocol,
    },
    commands: {
      derive: "synthetic radial derive",
      check: "synthetic radial independent check",
      publish: "synthetic radial envelope assembly",
    },
    timestamps: {
      deriveStartedAt: "2026-08-22T00:00:00.000Z",
      deriveCompletedAt: "2026-08-22T00:00:01.000Z",
      checkCompletedAt: "2026-08-22T00:00:02.000Z",
      publishCompletedAt: "2026-08-22T00:00:03.000Z",
    },
    codeIdentities: {
      generator: syntheticCodeIdentity(
        "generator",
        "runner/src/synthetic-radial-generator.ts",
        "deriveSyntheticRadial",
      ),
      independentChecker: syntheticCodeIdentity(
        "independent-checker",
        "runner/src/synthetic-radial-checker.ts",
        "checkSyntheticRadial",
      ),
      sharedParser: syntheticCodeIdentity(
        "shared-parser",
        "runner/src/phase10-c0v-contracts.ts",
        "parseSyntheticRadial",
      ),
      neutralDerive: syntheticCodeIdentity(
        "neutral-derive",
        "runner/src/phase10-c0v-reference-derive.ts",
        "derivePhase10C0VReferenceCandidate",
      ),
      neutralCheck: syntheticCodeIdentity(
        "neutral-check",
        "runner/src/phase10-c0v-reference-check.ts",
        "verifyPhase10C0VReferenceCandidate",
      ),
      neutralPublish: syntheticCodeIdentity(
        "neutral-publish",
        "runner/src/phase10-c0v-reference-publish.ts",
        "publishPhase10C0VReference",
      ),
    },
    observedImports: {
      generator: sharedClosure,
      independentChecker: sharedClosure,
    },
    allowedSharedImports: [
      "runner/src/gate4-evidence.ts",
      "runner/src/phase10-c0v-contracts.ts",
    ],
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
  });
}

function fixtureIdentity(path: string): Phase10C0VS6ArtifactIdentity {
  return identity(path, textEncoder.encode(`synthetic fixture identity: ${path}\n`));
}

function syntheticS6Authority(
  scienceProtocol: Phase10C0VS6ArtifactIdentity,
  reference: Phase10C0VS6ArtifactIdentity,
): Readonly<{
  packetProtocol: Phase10C0VS6ArtifactIdentity;
  packetProtocolBytes: Uint8Array;
  preflight: Phase10C0VS6ArtifactIdentity;
  preflightBytes: Uint8Array;
  lifecycle: Phase10C0VS6LifecycleCheckContext;
  candidateDirectory: string;
}> {
  const packetPath =
    "research/phase10-execution-v2/packets/c0v-radial-produce/protocol.json";
  const canonicalPacket = JSON.parse(readFileSync(resolve(ROOT, packetPath), "utf8")) as {
    bindings?: Record<string, unknown>;
  } & Record<string, unknown>;
  if (canonicalPacket.bindings === undefined) {
    throw new Error("canonical radial packet fixture lacks bindings");
  }
  const radialLayout = canonicalPacket.radialBinaryLayout as Record<string, unknown> | undefined;
  if (radialLayout === undefined) {
    throw new Error("canonical radial packet fixture lacks radial binary layout");
  }
  expect(radialLayout.producerEvaluatorSharedRuntimeClosurePaths)
    .toEqual(SHARED_RUNTIME_CLOSURE_PATHS);
  canonicalPacket.bindings.scienceProtocol = scienceProtocol;
  canonicalPacket.bindings.referenceOrRefusal = reference;
  const packetProtocolBytes = pretty(canonicalPacket);
  const packetProtocol = identity(packetPath, packetProtocolBytes);
  const packet = parsePhase10C0VS6PacketProtocol(canonicalPacket);
  if (
    packet.radialBinaryLayout === null ||
    packet.bindings.scienceProtocol === null ||
    packet.bindings.referenceOrRefusal === null ||
    packet.selectedRouteId === null ||
    packet.s5ArtifactDisposition === null
  ) {
    throw new Error("canonical radial packet fixture differs from the frozen production lane");
  }

  const attemptId = packet.registeredAttemptId;
  const attemptDirectory = `${packet.paths.attemptRoot}/${attemptId}`;
  const candidateDirectory = `${attemptDirectory}/candidate`;
  const head = "2".repeat(40);
  const codeFreezeCommit = "1".repeat(40);
  const runCommand = packet.commandTemplates.find((entry) => entry.commandId === "run");
  if (runCommand === undefined) throw new Error("canonical radial packet lacks its run command");
  const verificationPaths = packet.paths.allowedPublicationPaths.filter((path) =>
    path.endsWith(`/${packet.verification.filename}`));
  if (verificationPaths.length !== 1) {
    throw new Error("canonical radial packet lacks one exact verification path");
  }
  const dependencyVariant = phase10C0VS6DependencyArtifactRosterVariants(packet)[0];
  if (dependencyVariant === undefined) throw new Error("radial packet lacks a dependency roster variant");
  const dependencyArtifacts = dependencyVariant
    .map((entry) => fixtureIdentity(entry.artifactPath))
    .sort((left, right) => left.path.localeCompare(right.path));
  const packageElapsedNanosecondsBeforeAttempt = 0;
  const projectedPackageElapsedNanosecondsAfterAttempt =
    packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum;
  const packageRetainedBytesBeforeAttempt = packet.resources.packageStorageBaselineBytes;
  const projectedPackageBytesAfterAttempt = packageRetainedBytesBeforeAttempt +
    packet.resources.projectedScratchBytes +
    packet.resources.projectedPublicationBytes;
  const observedFreeBytes = 1_073_741_824;
  const resourceValues: Readonly<Record<string, unknown>> = {
    ...packet.resources,
    packageElapsedNanosecondsBeforeAttempt,
    projectedPackageElapsedNanosecondsAfterAttempt,
    packageProcessHoursBeforeAttempt: packageElapsedNanosecondsBeforeAttempt / 3_600_000_000_000,
    projectedPackageProcessHoursAfterAttempt:
      projectedPackageElapsedNanosecondsAfterAttempt / 3_600_000_000_000,
    packageRetainedBytesBeforeAttempt,
    projectedPackageBytesAfterAttempt,
    observedFreeBytes,
    nasOrNetworkAccess: false,
  };
  const observedResources = Object.fromEntries(
    packet.preflightObservedContract.resourceFieldOrder.map((field) => {
      if (!(field in resourceValues)) {
        throw new Error(`synthetic preflight lacks resource field ${field}`);
      }
      return [field, resourceValues[field]];
    }),
  );
  const observedValues: Readonly<Record<string, unknown>> = {
    launchClass: packet.preflightObservedContract.launchClass,
    executionMode: packet.executionMode,
    selectedRouteId: packet.selectedRouteId,
    branch: packet.ancestryAuthority.launchBranch,
    head,
    runtime: packet.resources.requiredRuntime,
    command: runCommand.command,
    cwd: ".",
    repositoryBundleRoot: ".",
    compositeMatrix: packet.bindings.matrix,
    packetCatalogue: packet.bindings.packetCatalogue,
    successorSchemaRegistry: packet.bindings.successorSchemaRegistry,
    evidenceManifest: fixtureIdentity("evidence/MANIFEST.json"),
    scienceProtocol,
    referenceOrRefusal: reference,
    packetProtocol,
    callableRegistry: packet.bindings.callableRegistry,
    codeFreeze: {
      commit: codeFreezeCommit,
      artifacts: [fixtureIdentity("runner/src/synthetic-radial-worker.ts")],
    },
    registeredAttemptRoot: packet.paths.attemptRoot,
    attemptDirectory,
    candidateDirectory,
    stdoutPath: `${attemptDirectory}/stdout.log`,
    stderrPath: `${attemptDirectory}/stderr.log`,
    exitStatusPath: `${attemptDirectory}/exit-status.json`,
    packageLockPath: packet.paths.packageLockPath,
    lockPath: packet.paths.lockPath,
    finalPreflightReceiptPath: packet.paths.preflightReceiptPath,
    finalTerminalReceiptPath: packet.paths.terminalReceiptPath,
    verificationPaths,
    dependencyPacketIds: packet.boundDependencyPacketIds,
    dependencyArtifacts,
    resources: observedResources,
    ancestry: {
      repositoryClean: true,
      headMatchesLaunch: true,
      requiredCommitsAreAncestors: true,
      boundArtifactsMatch: true,
      codeFreezeMatches: true,
      verdict: "pass",
      errors: [],
    },
  };
  const observed = Object.fromEntries(packet.preflightObservedContract.observedFieldOrder.map((field) => {
    if (!(field in observedValues)) throw new Error(`synthetic preflight lacks observed field ${field}`);
    return [field, observedValues[field]];
  }));
  const preflightBytes = pretty({
    schema: "phase10-c0v-s6-preflight-receipt-v2",
    receiptId: `phase10-${packet.packetId}-${attemptId}-preflight-v2`,
    matrixId: packet.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId,
    stage: "run",
    observed,
    outputIds: packet.registeredOutputIds,
    checkIds: packet.registeredCheckIds,
    negativeControlIds: packet.registeredNegativeControlIds,
    callableIds: [
      "phase10-c0v-radial-produce-check-caller",
      "phase10-c0v-radial-production-producer",
    ],
    selectedBranches: {
      selectedRouteId: packet.selectedRouteId,
      s5ArtifactDisposition: packet.s5ArtifactDisposition,
    },
    refusalCandidate: null,
    verdict: "pass",
    reasons: [],
  });
  const preflight = identity(packet.paths.preflightReceiptPath, preflightBytes);
  const lifecycle: Phase10C0VS6LifecycleCheckContext = Object.freeze({
    packetId: packet.packetId,
    attemptId,
    executionMode: packet.executionMode,
    selectedRoute: packet.selectedRouteId,
    runtime: packet.resources.requiredRuntime,
    command: runCommand.command,
    gitHead: head,
    packetProtocol,
    scienceProtocol,
    preflight,
    referenceOrRefusal: reference,
    resource: Object.freeze({
      maxWallSeconds: packet.resources.solverWorkerTimeoutSeconds,
      processConcurrency: packet.resources.processConcurrency,
      projectedScratchBytes: packet.resources.projectedScratchBytes,
      projectedPublicationBytes: packet.resources.projectedPublicationBytes,
      minimumFreeBytes: packet.resources.minimumFreeBytes,
      observedFreeBytes,
    }),
    boundDependencyPacketIds: Object.freeze([...packet.boundDependencyPacketIds]),
  });
  return Object.freeze({
    packetProtocol,
    packetProtocolBytes,
    preflight,
    preflightBytes,
    lifecycle,
    candidateDirectory,
  });
}
interface Fixture {
  readonly science: Phase10C0VRadialReferenceInput;
  readonly layout: ReturnType<typeof layout>;
  readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocolBytes: Uint8Array;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly referenceBytes: Uint8Array;
  readonly preflightBytes: Uint8Array;
  readonly production: Phase10C0VRadialProductionOutput;
  readonly witness: Phase10C0VS6ArtifactIdentity;
  readonly lifecycle: Phase10C0VS6LifecycleCheckContext;
  readonly candidateDirectory: string;
}

let fixture: Fixture;

beforeAll(() => {
  const science = syntheticScience();
  const scienceProtocolBytes = syntheticScienceProtocolBytes(science);
  // These are in-memory synthetic bytes under the authority-required paths; the
  // test never opens either tracked S5 artifact.
  const scienceProtocol = identity(
    "research/phase10-c0v-radial-protocol-v1.json",
    scienceProtocolBytes,
  );
  const referenceBytes = syntheticReferenceBytes(science, scienceProtocol);
  const reference = identity(
    "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json",
    referenceBytes,
  );
  const frozenLayout = layout();
  const authority = syntheticS6Authority(scienceProtocol, reference);
  const production = producePhase10C0VRadialWitness({
    layout: frozenLayout,
    science,
    packetProtocol: authority.packetProtocol,
    scienceProtocol,
    referenceOrRefusal: reference,
  });
  const witness = identity(
    `${authority.candidateDirectory}/c0v-radial-witness.bin`,
    production.witnessBytes,
  );
  fixture = Object.freeze({
    science,
    layout: frozenLayout,
    packetProtocol: authority.packetProtocol,
    packetProtocolBytes: authority.packetProtocolBytes,
    scienceProtocol,
    scienceProtocolBytes,
    reference,
    referenceBytes,
    preflightBytes: authority.preflightBytes,
    production,
    witness,
    lifecycle: authority.lifecycle,
    candidateDirectory: authority.candidateDirectory,
  });
});

function evaluationInput(
  witnessBytes = fixture.production.witnessBytes,
  witness = identity(`${fixture.candidateDirectory}/c0v-radial-witness.bin`, witnessBytes),
): Phase10C0VRadialEvaluationInput {
  return Object.freeze({
    evaluationId: "synthetic-radial-evaluation-1",
    packetProtocol: fixture.packetProtocol,
    packetProtocolBytes: fixture.packetProtocolBytes,
    scienceProtocol: fixture.scienceProtocol,
    scienceProtocolBytes: fixture.scienceProtocolBytes,
    referenceOrRefusal: fixture.reference,
    referenceBytes: fixture.referenceBytes,
    preflightBytes: fixture.preflightBytes,
    witness,
    witnessBytes,
    producerSummary: identity(
      `${fixture.candidateDirectory}/c0v-radial-producer-summary.json`,
      fixture.production.producerSummaryBytes,
    ),
    producerSummaryBytes: fixture.production.producerSummaryBytes,
    lifecycle: fixture.lifecycle,
  });
}

function evaluateSynthetic(input: Phase10C0VRadialEvaluationInput) {
  return independentlyEvaluatePhase10C0VRadialSyntheticFixture(input, fixture.science);
}

function resealPayload(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes);
  result.set(createHash("sha256").update(result.subarray(153)).digest(), 121);
  return result;
}

function mutateU32(bytes: Uint8Array, offset: number, value: number, reseal = false): Uint8Array {
  const result = new Uint8Array(bytes);
  new DataView(result.buffer).setUint32(offset, value, true);
  return reseal ? resealPayload(result) : result;
}

type ResourceRefusalKind = "free-space" | "process-hours" | "storage";

function resourceRefusalPreflight(kind: ResourceRefusalKind): Uint8Array {
  const packet = parsePhase10C0VS6PacketProtocol(
    JSON.parse(new TextDecoder().decode(fixture.packetProtocolBytes)),
  );
  const receipt = JSON.parse(new TextDecoder().decode(fixture.preflightBytes)) as {
    observed: { resources: Record<string, unknown> };
    outputIds: string[];
    checkIds: string[];
    negativeControlIds: string[];
    refusalCandidate: unknown;
    verdict: string;
    reasons: string[];
  } & Record<string, unknown>;
  const resources = receipt.observed.resources;
  const conditionId = `cond-c0v-radial-produce-prelaunch-${kind}`;
  const condition = packet.classificationConditions.find((entry) => entry.conditionId === conditionId);
  const subroute = packet.terminalSubroutes.find((entry) =>
    entry.dispositionCode === "prelaunch-resource-refusal");
  if (condition === undefined || subroute === undefined) {
    throw new Error(`synthetic refusal fixture lacks ${conditionId} authority`);
  }
  let observedValue: number;
  let inlineObservationPath: string;
  if (kind === "free-space") {
    observedValue = packet.resources.minimumFreeBytes - 1;
    resources.observedFreeBytes = observedValue;
    inlineObservationPath = "observed.resources.observedFreeBytes";
  } else if (kind === "process-hours") {
    const elapsedBefore = packet.resources.packageElapsedNanosecondsMaximum -
      packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum + 1;
    const projectedElapsed = elapsedBefore +
      packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum;
    resources.packageElapsedNanosecondsBeforeAttempt = elapsedBefore;
    resources.projectedPackageElapsedNanosecondsAfterAttempt = projectedElapsed;
    resources.packageProcessHoursBeforeAttempt = elapsedBefore / 3_600_000_000_000;
    observedValue = projectedElapsed / 3_600_000_000_000;
    resources.projectedPackageProcessHoursAfterAttempt = observedValue;
    inlineObservationPath = "observed.resources.projectedPackageProcessHoursAfterAttempt";
  } else {
    const retainedBefore = packet.resources.retainedStorageBytesMaximum -
      packet.resources.projectedScratchBytes - packet.resources.projectedPublicationBytes + 1;
    observedValue = retainedBefore + packet.resources.projectedScratchBytes +
      packet.resources.projectedPublicationBytes;
    resources.packageRetainedBytesBeforeAttempt = retainedBefore;
    resources.projectedPackageBytesAfterAttempt = observedValue;
    inlineObservationPath = "observed.resources.projectedPackageBytesAfterAttempt";
  }
  const inlineEvidenceId = `evidence-${conditionId}-inline`;
  const evidence = [
    {
      evidenceId: inlineEvidenceId,
      evidenceRole: "classification-input",
      retentionClass: "inline-observation",
      artifact: null,
      inlineObservationPath,
    },
    {
      evidenceId: "evidence-packet-protocol",
      evidenceRole: "packet-protocol",
      retentionClass: "tracked-authority",
      artifact: fixture.packetProtocol,
      inlineObservationPath: null,
    },
  ];
  receipt.outputIds = [...subroute.requiredOutputIds];
  receipt.checkIds = [...subroute.requiredCheckIds];
  receipt.negativeControlIds = [...subroute.requiredNegativeControlIds];
  receipt.refusalCandidate = {
    dispositionCode: "prelaunch-resource-refusal",
    observation: {
      conditionId,
      kind: condition.kind,
      comparator: condition.comparator,
      registeredValue: condition.registeredValue,
      observedValue,
      unit: condition.unit,
      routeConditionMatched: true,
      preconditionPassed: false,
      evidenceIds: evidence.map((entry) => entry.evidenceId),
    },
    failedArtifact: null,
    evidence,
    solverLaunched: false,
    verdict: "refusal",
  };
  receipt.verdict = "refusal";
  receipt.reasons = [conditionId];
  return pretty(receipt);
}

describe("Phase 10 C0V S6 radial production and independent evaluation", () => {
  it("encodes the exact 5,891-byte witness and binds the S5 science protocol", () => {
    const bytes = fixture.production.witnessBytes;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(bytes).toHaveLength(5_891);
    expect(new TextDecoder().decode(bytes.subarray(0, 8))).toBe("C0VRAD01");
    expect(view.getUint32(8, true)).toBe(1);
    expect(view.getUint32(12, true)).toBe(0x01020304);
    expect(Buffer.from(bytes.subarray(49, 81)).toString("hex")).toBe(fixture.scienceProtocol.sha256);
    expect(Buffer.from(bytes.subarray(81, 113)).toString("hex")).toBe(fixture.reference.sha256);
    expect(Number(view.getBigUint64(113, true))).toBe(5_738);
    expect(Buffer.from(bytes.subarray(121, 153)).toString("hex")).toBe(sha256(bytes.subarray(153)));
    expect(fixture.production.producerSummary).toMatchObject({
      authority: "non-authoritative",
      caseCount: 4,
      totalNumericFieldValues: 300,
      totalUniformFieldValues: 300,
      allFinite: true,
      reportedDisposition: "pass",
    });

    for (const registration of [
      {
        callableId: "phase10-c0v-radial-production-producer",
        modulePath: "runner/src/phase10-c0v-radial-production.ts",
        exportName: "producePhase10C0VRadialWitness",
      },
      {
        callableId: "phase10-c0v-radial-evaluator",
        modulePath: "runner/src/phase10-c0v-radial-evaluator.ts",
        exportName: "independentlyEvaluatePhase10C0VRadial",
      },
      {
        callableId: "phase10-c0v-radial-produce-check-caller",
        modulePath: "runner/src/phase10-c0v-radial-checks.ts",
        exportName: "phase10C0VRadialProduceCheckCaller",
      },
    ] as const) {
      const moduleBytes = new Uint8Array(readFileSync(resolve(ROOT, registration.modulePath)));
      const audit = phase10C0VS6AssertCallableRegistration(ROOT, {
        ...registration,
        identity: identity(registration.modulePath, moduleBytes),
      });
      expect(audit.forbiddenPaths).toEqual([]);
      expect(audit.forbiddenIdentifiers).toEqual([]);
    }
  });

  it("exposes deterministic per-case and negative-control invocation boundaries", () => {
    const productionEvents: string[] = [];
    const repeated = producePhase10C0VRadialWitness({
      layout: fixture.layout,
      science: fixture.science,
      packetProtocol: fixture.packetProtocol,
      scienceProtocol: fixture.scienceProtocol,
      referenceOrRefusal: fixture.reference,
      observeCaseBoundary: (event) => {
        productionEvents.push(`${event.stage}:${event.caseIndex}:${event.caseId}`);
      },
    });
    expect(repeated.witnessBytes).toEqual(fixture.production.witnessBytes);
    expect(productionEvents).toEqual(CASE_IDS.flatMap((caseId, index) => [
      `start:${index}:${caseId}`,
      `complete:${index}:${caseId}`,
    ]));

    const controlEvents: string[] = [];
    const output = phase10C0VRadialSyntheticFixtureCheckCaller({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
      observeNegativeControlBoundary: (event: Phase10C0VRadialNegativeControlInvocationBoundary) => {
        controlEvents.push(
          `${event.boundaryKind}:${event.stage}:${event.negativeControlId}:` +
          `${event.caseIndex ?? "all"}:${event.caseId ?? "all"}`,
        );
      },
      observeNegativeControlProgress: (event) => {
        controlEvents.push(`progress:${event.stage}:${event.negativeControlId}`);
      },
      observeNegativeControlArtifact: (artifact) => {
        controlEvents.push(`artifact:${artifact.negativeControlId}:${artifact.identity.path}`);
      },
    });
    expect(output.terminalStatus).toBe("pass");
    expect(controlEvents).toEqual([
      "governed-leaf:start:nc-radial-finite-shell-term:all:all",
      "progress:attacked-evaluation-complete:nc-radial-finite-shell-term",
      "progress:independent-proof-complete:nc-radial-finite-shell-term",
      "governed-leaf:complete:nc-radial-finite-shell-term:all:all",
      `artifact:nc-radial-finite-shell-term:${fixture.candidateDirectory}/nc-radial-finite-shell-term-witness.bin`,
      "governed-leaf:start:nc-radial-forged-summary:all:all",
      "progress:attacked-evaluation-complete:nc-radial-forged-summary",
      "progress:independent-proof-complete:nc-radial-forged-summary",
      "governed-leaf:complete:nc-radial-forged-summary:all:all",
      `artifact:nc-radial-forged-summary:${fixture.candidateDirectory}/nc-radial-forged-summary.json`,
      "governed-leaf:start:nc-radial-robin-coefficient:all:all",
      ...CASE_IDS.flatMap((caseId, index) => [
        `internal-case:start:nc-radial-robin-coefficient:${index}:${caseId}`,
        `internal-case:complete:nc-radial-robin-coefficient:${index}:${caseId}`,
      ]),
      "progress:attacked-evaluation-complete:nc-radial-robin-coefficient",
      "progress:independent-proof-complete:nc-radial-robin-coefficient",
      "governed-leaf:complete:nc-radial-robin-coefficient:all:all",
      `artifact:nc-radial-robin-coefficient:${fixture.candidateDirectory}/nc-radial-robin-coefficient-witness.bin`,
    ]);
  });

  it("rederives the clean verdict and makes all three named controls load-bearing", () => {
    const callerInput: Phase10C0VRadialSyntheticFixtureCheckCallerInput = Object.freeze({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
    });
    const output = phase10C0VRadialSyntheticFixtureCheckCaller(callerInput);
    expect(output.terminalStatus).toBe("pass");
    expect(output.executedCheckIds).toEqual([
      "chk-c0v-radial-numeric",
      "chk-c0v-radial-reference-independence",
    ]);
    expect(output.executedNegativeControlIds).toEqual([
      "nc-radial-finite-shell-term",
      "nc-radial-forged-summary",
      "nc-radial-robin-coefficient",
    ]);
    expect(output.evaluation.protocol).toEqual(fixture.scienceProtocol);
    expect(output.evaluation.limits).toEqual([
      "c1-through-c5-qualification",
      "model-tuning",
      "new-validation-label",
      "target-facing-score",
    ]);
    expect(output.evaluation.negativeControls.map((entry) => entry.pass)).toEqual([true, true, true]);
    expect(output.evaluation.artifactDisposition).toBe("valid");
    expect(output.campaignDisposition).toBe("valid");
    expect(output.campaignInvalidReasonCodes).toEqual([]);
    expect(output.acceptedEvaluationBytes).toEqual(output.evaluationBytes);
    expect(output.evaluation.negativeControls[1]).toMatchObject({
      negativeControlId: "nc-radial-forged-summary",
      witnessMoved: false,
      attackedCheckFailed: false,
      pass: true,
    });
    const numericWitness = output.evaluation.checkResults[0]!.witnesses.at(-1) as {
      negativeControlAudit: Array<{
        negativeControlId: string;
        fieldMovedCaseIds: string[];
        cleanEvaluationIdentical: boolean;
      }>;
    };
    expect(numericWitness.negativeControlAudit).toMatchObject([
      { negativeControlId: "nc-radial-finite-shell-term", fieldMovedCaseIds: [CASE_IDS[0]] },
      { negativeControlId: "nc-radial-forged-summary", fieldMovedCaseIds: [], cleanEvaluationIdentical: true },
      { negativeControlId: "nc-radial-robin-coefficient", fieldMovedCaseIds: CASE_IDS },
    ]);
    expect(JSON.parse(new TextDecoder().decode(output.evaluationBytes))).toEqual(output.evaluation);
  });

  it("retains each raw mutation and purely rederives the clean science and complete NC audit", () => {
    const observedArtifacts: Phase10C0VRadialNegativeControlArtifact[] = [];
    const output = phase10C0VRadialSyntheticFixtureCheckCaller(Object.freeze({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
      observeNegativeControlArtifact: (artifact: Phase10C0VRadialNegativeControlArtifact) =>
        observedArtifacts.push(artifact),
    }));
    expect(observedArtifacts).toEqual(output.negativeControlArtifacts);
    expect(output.negativeControlArtifacts.map((entry) => entry.identity.path)).toEqual([
      `${fixture.candidateDirectory}/nc-radial-finite-shell-term-witness.bin`,
      `${fixture.candidateDirectory}/nc-radial-forged-summary.json`,
      `${fixture.candidateDirectory}/nc-radial-robin-coefficient-witness.bin`,
    ]);
    const [finite, forged, robin] = output.negativeControlArtifacts;
    const rawInput = Object.freeze({
      packetProtocol: fixture.packetProtocol,
      packetProtocolBytes: fixture.packetProtocolBytes,
      preflightBytes: fixture.preflightBytes,
      scienceProtocolBytes: fixture.scienceProtocolBytes,
      referenceBytes: fixture.referenceBytes,
      evaluationBytes: output.evaluationBytes,
      cleanWitnessBytes: fixture.production.witnessBytes,
      cleanProducerSummaryBytes: fixture.production.producerSummaryBytes,
      finiteShellWitnessBytes: finite.bytes,
      forgedSummaryBytes: forged.bytes,
      robinCoefficientWitnessBytes: robin.bytes,
    });
    const reproof = independentlyReprovePhase10C0VRadialRawArtifactsSyntheticFixture(
      rawInput,
      fixture.science,
    );
    expect(reproof).toMatchObject({
      packetId: "c0v-radial-produce",
      verdict: "pass",
      numericalDisposition: "pass",
      artifactDisposition: "valid",
    });
    expect(reproof.cleanScienceReproof.checkResults).toEqual(output.evaluation.checkResults);
    expect(reproof.mutationReproofs.map((entry) => entry.pass)).toEqual([true, true, true]);

    const forgedEvaluation = JSON.parse(new TextDecoder().decode(output.evaluationBytes)) as {
      checkResults: Array<{ witnesses: Array<{ cases?: Array<{ metrics: { surfaceRelative: { value: number } } }> }> }>;
    };
    forgedEvaluation.checkResults[0]!.witnesses[0]!.cases![0]!.metrics.surfaceRelative.value = 1;
    expect(() => independentlyReprovePhase10C0VRadialRawArtifactsSyntheticFixture(
      { ...rawInput, evaluationBytes: pretty(forgedEvaluation) },
      fixture.science,
    )).toThrow(/clean science check results/u);
    expect(() => independentlyReprovePhase10C0VRadialRawArtifactsSyntheticFixture(
      { ...rawInput, cleanProducerSummaryBytes: new Uint8Array() },
      fixture.science,
    )).toThrow(/clean radial producer summary/u);

    const reproofSource = readFileSync(
      resolve(ROOT, "runner/src/phase10-c0v-radial-reproof.ts"),
      "utf8",
    );
    expect(reproofSource).not.toMatch(/from "\.\/phase10-c0v-radial-(?:evaluator|negative-controls|production)\.ts"/u);
    expect(reproofSource).not.toMatch(/from "(?:@vcc\/solver-cpu|\.\.\/\.\.\/solver-cpu)/u);
  });

  it("never exposes the capped leaf artifact before its governed completion is accepted", () => {
    const captured: Phase10C0VRadialNegativeControlArtifact[] = [];
    expect(() => phase10C0VRadialSyntheticFixtureCheckCaller(Object.freeze({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
      observeNegativeControlBoundary: (event: Phase10C0VRadialNegativeControlInvocationBoundary) => {
        if (event.negativeControlId === "nc-radial-finite-shell-term" && event.stage === "complete") {
          throw new Error("synthetic registered cap");
        }
      },
      observeNegativeControlArtifact: (artifact: Phase10C0VRadialNegativeControlArtifact) =>
        captured.push(artifact),
    }))).toThrow(/synthetic registered cap/u);
    expect(captured).toEqual([]);
  });

  it.each(["free-space", "process-hours", "storage"] as const)(
    "rejects the valid %s prelaunch refusal before any science or control callback",
    (kind) => {
      const preflightBytes = resourceRefusalPreflight(kind);
      const packet = parsePhase10C0VS6PacketProtocol(
        JSON.parse(new TextDecoder().decode(fixture.packetProtocolBytes)),
      );
      expect(parsePhase10C0VS6RetainedPreflight(
        JSON.parse(new TextDecoder().decode(preflightBytes)),
        packet,
        fixture.packetProtocol,
      ).verdict).toBe("refusal");
      let boundaries = 0;
      let artifacts = 0;
      const input = Object.freeze({
        ...evaluationInput(),
        preflightBytes,
        producerSummary: fixture.production.producerSummary,
        syntheticScience: fixture.science,
        observeNegativeControlBoundary: () => { boundaries += 1; },
        observeNegativeControlArtifact: () => { artifacts += 1; },
      });
      expect(() => phase10C0VRadialSyntheticFixtureCheckCaller(input))
        .toThrow(/retained pass|passing retained preflight/u);
      expect(() => independentlyEvaluatePhase10C0VRadialSyntheticFixture(
        Object.freeze({ ...evaluationInput(), preflightBytes }),
        fixture.science,
      )).toThrow(/retained pass|passing retained preflight/u);
      expect(boundaries).toBe(0);
      expect(artifacts).toBe(0);
    },
  );

  it("rejects wrong candidate roots and missing producer-summary bytes before controls", () => {
    let boundaries = 0;
    const wrongWitness = Object.freeze({
      ...fixture.witness,
      path: "out/phase10-execution-v2/attempts/c0v-radial-produce/wrong/candidate/c0v-radial-witness.bin",
    });
    expect(() => phase10C0VRadialSyntheticFixtureCheckCaller(Object.freeze({
      ...evaluationInput(fixture.production.witnessBytes, wrongWitness),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
      observeNegativeControlBoundary: () => { boundaries += 1; },
    }))).toThrow(/witness path differs/u);
    expect(boundaries).toBe(0);

    expect(() => phase10C0VRadialSyntheticFixtureCheckCaller(Object.freeze({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      producerSummaryBytes: new Uint8Array(),
      syntheticScience: fixture.science,
      observeNegativeControlBoundary: () => { boundaries += 1; },
    }))).toThrow(/producer summary/u);
    expect(boundaries).toBe(0);

    const wrongRootPreflight = JSON.parse(new TextDecoder().decode(fixture.preflightBytes)) as {
      observed: { candidateDirectory: string };
    };
    wrongRootPreflight.observed.candidateDirectory += "-wrong";
    expect(() => phase10C0VRadialSyntheticFixtureCheckCaller(Object.freeze({
      ...evaluationInput(),
      preflightBytes: pretty(wrongRootPreflight),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
    }))).toThrow(/path authority differs/u);
  });

  it("keeps the science verdict independent when a negative control invalidates the campaign", () => {
    const output = phase10C0VRadialSyntheticFixtureCheckCaller(Object.freeze({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
    }));
    const failedControls = output.evaluation.negativeControls.map((entry, index) =>
      index === 0 ? Object.freeze({ ...entry, mutationExecuted: false, pass: false }) : entry);

    const sciencePassControlFail = classifyPhase10C0VRadialCampaign(
      output.evaluation.checkResults,
      failedControls,
    );
    expect(sciencePassControlFail).toEqual({
      numericalDisposition: "pass",
      artifactDisposition: "refusal",
      campaignDisposition: "invalid-successor-required",
      acceptedEvaluation: false,
      campaignInvalidReasonCodes: ["negative-control-failed:nc-radial-finite-shell-term"],
    });
    const sciencePassDiagnostics = materializePhase10C0VRadialCampaign(Object.freeze({
      ...output.evaluation,
      negativeControls: Object.freeze(failedControls),
      artifactDisposition: "refusal" as const,
    }));
    expect(sciencePassDiagnostics.terminalStatus).toBe("pass");
    expect(sciencePassDiagnostics.campaignDisposition).toBe("invalid-successor-required");
    expect(sciencePassDiagnostics.acceptedEvaluationBytes).toBeNull();
    expect(JSON.parse(new TextDecoder().decode(sciencePassDiagnostics.evaluationBytes))).toMatchObject({
      numericalDisposition: "pass",
      artifactDisposition: "refusal",
    });
    expect(parsePhase10C0VS6RadialEvaluationBytes(
      sciencePassDiagnostics.evaluationBytes,
      parsePhase10C0VS6PacketProtocol(JSON.parse(new TextDecoder().decode(fixture.packetProtocolBytes))),
    )).toMatchObject({ numericalDisposition: "pass", artifactDisposition: "refusal" });

    const failedScienceChecks = output.evaluation.checkResults.map((entry, index) =>
      index === 0
        ? Object.freeze({ ...entry, pass: false, reasonCodes: Object.freeze(["synthetic-science-failure"]) })
        : entry);
    const scienceFailControlFail = classifyPhase10C0VRadialCampaign(
      failedScienceChecks,
      failedControls,
    );
    expect(scienceFailControlFail).toEqual({
      numericalDisposition: "fail",
      artifactDisposition: "refusal",
      campaignDisposition: "invalid-successor-required",
      acceptedEvaluation: false,
      campaignInvalidReasonCodes: ["negative-control-failed:nc-radial-finite-shell-term"],
    });
    const scienceFailDiagnostics = materializePhase10C0VRadialCampaign(Object.freeze({
      ...output.evaluation,
      checkResults: Object.freeze(failedScienceChecks),
      negativeControls: Object.freeze(failedControls),
      numericalDisposition: "fail" as const,
      artifactDisposition: "refusal" as const,
    }));
    expect(scienceFailDiagnostics.terminalStatus).toBe("fail");
    expect(scienceFailDiagnostics.campaignDisposition).toBe("invalid-successor-required");
    expect(scienceFailDiagnostics.acceptedEvaluationBytes).toBeNull();
    expect(JSON.parse(new TextDecoder().decode(scienceFailDiagnostics.evaluationBytes))).toMatchObject({
      numericalDisposition: "fail",
      artifactDisposition: "refusal",
    });
    expect(parsePhase10C0VS6RadialEvaluationBytes(
      scienceFailDiagnostics.evaluationBytes,
      parsePhase10C0VS6PacketProtocol(JSON.parse(new TextDecoder().decode(fixture.packetProtocolBytes))),
    )).toMatchObject({ numericalDisposition: "fail", artifactDisposition: "refusal" });
  });

  it("executes the registered finite-shell A-prime mutation and preserves reference identity", () => {
    const mutation = phase10RadialFiniteShellTerm({
      candidateDirectory: fixture.candidateDirectory,
      cleanWitness: fixture.witness,
      cleanWitnessBytes: fixture.production.witnessBytes,
      reference: fixture.reference,
      scienceProtocol: fixture.scienceProtocol,
      producerSummary: fixture.production.producerSummary,
      producerSummaryBytes: fixture.production.producerSummaryBytes,
    });
    const cleanView = new DataView(fixture.production.witnessBytes.buffer);
    const mutatedView = new DataView(mutation.mutatedWitnessBytes.buffer);
    const recordStart = 153 + 184;
    const scalarStart = recordStart + 12 + CASE_IDS[0].length;
    const fieldStart = recordStart + 164 + CASE_IDS[0].length;
    const radiusM = cleanView.getFloat64(153 + 8, true);
    const farRadiusM = cleanView.getFloat64(153 + 8 + 8, true);
    const spacingM = cleanView.getFloat64(scalarStart + 8, true);
    const u0 = radiusM * cleanView.getFloat64(fieldStart, true);
    const u1 = (radiusM + spacingM) * cleanView.getFloat64(fieldStart + 8, true);
    const harmonicConstant = (u1 - u0) / spacingM;
    const inverseCoefficientM = u0 - harmonicConstant * radiusM;
    const expectedShell = harmonicConstant - inverseCoefficientM / farRadiusM +
      inverseCoefficientM / farRadiusM;
    expect(mutatedView.getFloat64(fieldStart + (NODE_COUNTS[0] - 1) * 8, true)).toBe(expectedShell);
    expect(mutation.reference).toEqual(fixture.reference);
    const evaluation = evaluateSynthetic(evaluationInput(
      mutation.mutatedWitnessBytes,
      mutation.mutatedWitness,
    ));
    expect(evaluation.numericalCheck.pass).toBe(false);
    expect(evaluation.referenceIndependenceCheck.pass).toBe(true);
  });

  it("rejects arbitrary field-moving substitutes for both registered control operators", () => {
    const arbitraryFirst = new Uint8Array(fixture.production.witnessBytes);
    const firstFieldStart = 153 + 184 + 164 + CASE_IDS[0].length;
    const firstView = new DataView(arbitraryFirst.buffer);
    firstView.setFloat64(
      firstFieldStart,
      firstView.getFloat64(firstFieldStart, true) * 0.9,
      true,
    );
    const resealedFirst = resealPayload(arbitraryFirst);
    const finiteProof = independentlyWitnessPhase10RadialFiniteShellMutation(
      fixture.production.witnessBytes,
      resealedFirst,
      fixture.scienceProtocol.sha256,
      fixture.reference.sha256,
    );
    expect(finiteProof.pass).toBe(false);
    expect(finiteProof.reasonCodes).toContain("finite-shell-field-formula-differs");
    expect(evaluateSynthetic(evaluationInput(resealedFirst)).numericalCheck.pass)
      .toBe(false);

    const arbitraryAll = new Uint8Array(fixture.production.witnessBytes);
    const allView = new DataView(arbitraryAll.buffer);
    let recordStart = 153 + 184;
    for (let index = 0; index < CASE_IDS.length; index++) {
      const fieldStart = recordStart + 164 + CASE_IDS[index]!.length;
      allView.setFloat64(fieldStart, allView.getFloat64(fieldStart, true) * 0.95, true);
      recordStart += RECORD_BYTES[index]!;
    }
    const resealedAll = resealPayload(arbitraryAll);
    const robinProof = independentlyWitnessPhase10RadialRobinMutation(
      fixture.production.witnessBytes,
      resealedAll,
      fixture.scienceProtocol.sha256,
      fixture.reference.sha256,
    );
    expect(robinProof.pass).toBe(false);
    expect(robinProof.reasonCodes.some((reason) =>
      reason.includes("half-coefficient-field-solution-differs"))).toBe(true);
    expect(evaluateSynthetic(evaluationInput(resealedAll)).numericalCheck.pass)
      .toBe(false);
  });

  it("rejects a malformed dependent scalar and an interior-field edit after valid operators", () => {
    const controlInput = {
      candidateDirectory: fixture.candidateDirectory,
      cleanWitness: fixture.witness,
      cleanWitnessBytes: fixture.production.witnessBytes,
      reference: fixture.reference,
      scienceProtocol: fixture.scienceProtocol,
      producerSummary: fixture.production.producerSummary,
      producerSummaryBytes: fixture.production.producerSummaryBytes,
    } as const;
    const finite = phase10RadialFiniteShellTerm(controlInput);
    const malformedFinite = new Uint8Array(finite.mutatedWitnessBytes);
    const firstScalarStart = 153 + 184 + 12 + CASE_IDS[0].length;
    const finiteView = new DataView(malformedFinite.buffer);
    finiteView.setFloat64(
      firstScalarStart + 3 * 8,
      finiteView.getFloat64(firstScalarStart + 3 * 8, true) * 0.99,
      true,
    );
    const resealedFinite = resealPayload(malformedFinite);
    const finiteProof = independentlyWitnessPhase10RadialFiniteShellMutation(
      fixture.production.witnessBytes,
      resealedFinite,
      fixture.scienceProtocol.sha256,
      fixture.reference.sha256,
    );
    expect(finiteProof.pass).toBe(false);
    expect(finiteProof.reasonCodes).toContain("finite-shell-dependent-scalars-differ");
    expect(evaluateSynthetic(evaluationInput(resealedFinite)).numericalCheck.pass)
      .toBe(false);

    const robin = phase10RadialRobinCoefficient(controlInput);
    const malformedRobinField = new Uint8Array(robin.mutatedWitnessBytes);
    const firstFieldStart = 153 + 184 + 164 + CASE_IDS[0].length;
    const robinFieldView = new DataView(malformedRobinField.buffer);
    robinFieldView.setFloat64(
      firstFieldStart + 5 * 8,
      robinFieldView.getFloat64(firstFieldStart + 5 * 8, true) * 1.001,
      true,
    );
    const resealedRobinField = resealPayload(malformedRobinField);
    const robinFieldProof = independentlyWitnessPhase10RadialRobinMutation(
      fixture.production.witnessBytes,
      resealedRobinField,
      fixture.scienceProtocol.sha256,
      fixture.reference.sha256,
    );
    expect(robinFieldProof.pass).toBe(false);
    expect(robinFieldProof.reasonCodes).toContain(
      `${CASE_IDS[0]}-half-coefficient-field-solution-differs`,
    );
    expect(evaluateSynthetic(evaluationInput(resealedRobinField)).numericalCheck.pass)
      .toBe(false);

    const malformedRobinScalar = new Uint8Array(robin.mutatedWitnessBytes);
    const robinScalarView = new DataView(malformedRobinScalar.buffer);
    robinScalarView.setFloat64(
      firstScalarStart + 5 * 8,
      robinScalarView.getFloat64(firstScalarStart + 5 * 8, true) * 1.01,
      true,
    );
    const resealedRobinScalar = resealPayload(malformedRobinScalar);
    const robinScalarProof = independentlyWitnessPhase10RadialRobinMutation(
      fixture.production.witnessBytes,
      resealedRobinScalar,
      fixture.scienceProtocol.sha256,
      fixture.reference.sha256,
    );
    expect(robinScalarProof.pass).toBe(false);
    expect(robinScalarProof.reasonCodes).toContain(
      `${CASE_IDS[0]}-half-coefficient-dependent-scalars-differ`,
    );
    expect(evaluateSynthetic(evaluationInput(resealedRobinScalar)).numericalCheck.pass)
      .toBe(false);
  });

  it.each([
    ["magic", (bytes: Uint8Array) => {
      const changed = new Uint8Array(bytes);
      changed[0] = 0;
      return changed;
    }, /magic differs/u],
    ["version", (bytes: Uint8Array) => mutateU32(bytes, 8, 2), /format version differs/u],
    ["endian marker", (bytes: Uint8Array) => mutateU32(bytes, 12, 0x04030201), /endian marker differs/u],
    ["payload length", (bytes: Uint8Array) => {
      const changed = new Uint8Array(bytes);
      new DataView(changed.buffer).setBigUint64(113, 5_737n, true);
      return changed;
    }, /payload byte length differs/u],
    ["payload digest", (bytes: Uint8Array) => {
      const changed = new Uint8Array(bytes);
      changed[121] = changed[121]! ^ 0xff;
      return changed;
    }, /payload digest differs/u],
    ["node count", (bytes: Uint8Array) => mutateU32(bytes, 153 + 184 + 4 + 15, 22, true), /node count differs/u],
    ["NaN", (bytes: Uint8Array) => {
      const changed = new Uint8Array(bytes);
      new DataView(changed.buffer).setFloat64(153 + 8, Number.NaN, true);
      return resealPayload(changed);
    }, /non-finite or negative zero/u],
    ["negative zero", (bytes: Uint8Array) => {
      const changed = new Uint8Array(bytes);
      new DataView(changed.buffer).setFloat64(153 + 8, -0, true);
      return resealPayload(changed);
    }, /non-finite or negative zero/u],
    ["trailing byte", (bytes: Uint8Array) => {
      const changed = new Uint8Array(bytes.byteLength + 1);
      changed.set(bytes);
      return changed;
    }, /byte length is not 5,891/u],
  ] as const)("rejects a golden %s mutation", (_label, mutate, expected) => {
    const bytes = mutate(fixture.production.witnessBytes);
    expect(() => evaluateSynthetic(evaluationInput(bytes))).toThrow(expected);
  });

  it("strictly derives authority from packet and preflight bytes", () => {
    const cleanPreflight = JSON.parse(
      new TextDecoder().decode(fixture.preflightBytes),
    ) as { observed: { head: string; codeFreeze: { commit: string } } };
    expect(cleanPreflight.observed.codeFreeze.commit).not.toBe(cleanPreflight.observed.head);
    expect(evaluateSynthetic(evaluationInput()).preflightAncestryConsistency.pass).toBe(true);

    const packetWithUnknown = JSON.parse(
      new TextDecoder().decode(fixture.packetProtocolBytes),
    ) as Record<string, unknown>;
    packetWithUnknown.unknownField = true;
    const packetWithUnknownBytes = pretty(packetWithUnknown);
    expect(() => evaluateSynthetic({
      ...evaluationInput(),
      packetProtocol: identity(fixture.packetProtocol.path, packetWithUnknownBytes),
      packetProtocolBytes: packetWithUnknownBytes,
    })).toThrow(/packet protocol keys must equal/u);

    const preflightWithUnknown = JSON.parse(
      new TextDecoder().decode(fixture.preflightBytes),
    ) as { observed: Record<string, unknown> };
    preflightWithUnknown.observed.unknownField = true;
    const preflightWithUnknownBytes = pretty(preflightWithUnknown);
    expect(() => evaluateSynthetic({
      ...evaluationInput(),
      preflightBytes: preflightWithUnknownBytes,
      lifecycle: Object.freeze({
        ...fixture.lifecycle,
        preflight: identity(fixture.lifecycle.preflight.path, preflightWithUnknownBytes),
      }),
    })).toThrow(/observed ordered keys must equal/u);

    const preflightWithForgedResource = JSON.parse(
      new TextDecoder().decode(fixture.preflightBytes),
    ) as { observed: { resources: { projectedScratchBytes: number } } };
    preflightWithForgedResource.observed.resources.projectedScratchBytes += 1;
    const forgedResourceBytes = pretty(preflightWithForgedResource);
    expect(() => evaluateSynthetic({
      ...evaluationInput(),
      preflightBytes: forgedResourceBytes,
      lifecycle: Object.freeze({
        ...fixture.lifecycle,
        preflight: identity(fixture.lifecycle.preflight.path, forgedResourceBytes),
      }),
    })).toThrow(/resources differs from packet authority/u);

    const lifecycleDrift = evaluateSynthetic({
      ...evaluationInput(),
      lifecycle: Object.freeze({
        ...fixture.lifecycle,
        selectedRoute: "forged-route",
      }),
    });
    expect(lifecycleDrift.preflightAncestryConsistency).toMatchObject({
      pass: false,
      reasonCodes: ["selected-route-differs"],
    });
    expect(() => phase10C0VRadialSyntheticFixtureCheckCaller({
      ...evaluationInput(),
      producerSummary: fixture.production.producerSummary,
      syntheticScience: fixture.science,
      lifecycle: Object.freeze({
        ...fixture.lifecycle,
        selectedRoute: "forged-route",
      }),
    })).toThrow(/artifact-derived preflight consistency failed: selected-route-differs/u);

    const failedAncestry = JSON.parse(
      new TextDecoder().decode(fixture.preflightBytes),
    ) as { observed: { ancestry: { requiredCommitsAreAncestors: boolean } } };
    failedAncestry.observed.ancestry.requiredCommitsAreAncestors = false;
    const failedAncestryBytes = pretty(failedAncestry);
    expect(() => evaluateSynthetic({
      ...evaluationInput(),
      preflightBytes: failedAncestryBytes,
      lifecycle: Object.freeze({
        ...fixture.lifecycle,
        preflight: identity(fixture.lifecycle.preflight.path, failedAncestryBytes),
      }),
    })).toThrow(/must be an independently checked empty-error pass/u);
  });

  it("rejects case reordering, case identity changes, and a shifted layout", () => {
    const reordered = new Uint8Array(fixture.production.witnessBytes);
    const firstStart = 153 + 184;
    const first = reordered.slice(firstStart, firstStart + RECORD_BYTES[0]);
    const second = reordered.slice(
      firstStart + RECORD_BYTES[0],
      firstStart + RECORD_BYTES[0] + RECORD_BYTES[1],
    );
    reordered.set(second, firstStart);
    reordered.set(first, firstStart + RECORD_BYTES[1]);
    const resealedReordered = resealPayload(reordered);
    expect(() => evaluateSynthetic(evaluationInput(resealedReordered)))
      .toThrow(/case 0 ID differs/u);

    const changedIdentity = new Uint8Array(fixture.production.witnessBytes);
    changedIdentity[firstStart + 4] = "x".charCodeAt(0);
    const resealedIdentity = resealPayload(changedIdentity);
    expect(() => evaluateSynthetic(evaluationInput(resealedIdentity)))
      .toThrow(/case 0 ID differs/u);

    const shiftedPacket = JSON.parse(new TextDecoder().decode(fixture.packetProtocolBytes)) as {
      radialBinaryLayout: { caseNodeCounts: number[] };
    };
    shiftedPacket.radialBinaryLayout.caseNodeCounts[0] = 22;
    const shiftedPacketBytes = pretty(shiftedPacket);
    expect(() => evaluateSynthetic({
      ...evaluationInput(),
      packetProtocol: identity(fixture.packetProtocol.path, shiftedPacketBytes),
      packetProtocolBytes: shiftedPacketBytes,
    })).toThrow(/caseNodeCounts/u);
  });
});
