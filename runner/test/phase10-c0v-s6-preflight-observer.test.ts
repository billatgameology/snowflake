import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RecoveryV2Authority,
  parsePhase10C0VS6RecoveryV3Authority,
  parsePhase10C0VS6RecoveryV4Authority,
  parsePhase10C0VS6RecoveryV5Authority,
  parsePhase10C0VS6RecoveryV6Authority,
  parsePhase10C0VS6RecoveryV7Authority,
  parsePhase10C0VS6RecoveryV8Authority,
  type Phase10C0VS6PacketProtocol,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6AttemptLedgerBytes,
  phase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6AssertExactPhysicalRootCensus,
  phase10C0VS6AssertActiveLockedPacketWatchdog,
  phase10C0VS6CensusUniquePhysicalDirectory,
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6WithExclusiveLock,
  phase10C0VS6WithPackageAndPacketLocks,
  type Phase10C0VS6PackageAndPacketLockContext,
} from "../src/phase10-c0v-s6-filesystem.ts";
import {
  phase10C0VS6AssertObservedLocks,
  phase10C0VS6ClassifyPreflightResources,
  phase10C0VS6ResolvePriorRouteOutputPaths,
  phase10C0VS6ResolveRuntimeLabel,
  phase10C0VS6AssertSelectedAttemptPathRoster,
  phase10C0VS6SelectPreflightFailure,
} from "../src/phase10-c0v-s6-preflight-observer.ts";
import {
  independentlyEvaluatePhase10C0VMovingPublicationSemantic,
  type Phase10C0VMovingPublicationSemanticRequest,
} from "../src/phase10-c0v-s6-publication-semantic.ts";
import { phase10C0VS6WithOuterInfrastructureWatchdog } from "../src/phase10-c0v-s6-watchdog.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const temporaryRoots: string[] = [];

function packet(packetId: Phase10C0VS6PacketProtocol["packetId"]): Phase10C0VS6PacketProtocol {
  const path = resolve(ROOT, `research/phase10-execution-v2/recovery-v8/packets/${packetId}/protocol.json`);
  return parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(readFileSync(path), `${packetId} protocol`),
  );
}

function temporaryRoot(label: string): string {
  const parent = resolve(ROOT, "out", "phase10-c0v-s6-preflight-observer-tests");
  mkdirSync(parent, { recursive: true });
  const root = join(parent, `${label}-${process.pid}-${temporaryRoots.length}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: false });
  temporaryRoots.push(root);
  return root;
}

function write(root: string, path: string, bytes: Uint8Array | string): void {
  const absolute = resolve(root, path);
  mkdirSync(resolve(absolute, ".."), { recursive: true });
  writeFileSync(absolute, bytes, { flag: "wx" });
}

function writeRecoveryPredecessorState(root: string): void {
  const authorityPath = "research/phase10-execution-v2/recovery-v8/recovery-authority.json";
  const authorityBytes = new Uint8Array(readFileSync(resolve(ROOT, authorityPath)));
  if (!existsSync(resolve(root, authorityPath))) write(root, authorityPath, authorityBytes);
  const authority = parsePhase10C0VS6RecoveryV8Authority(
    parsePhase10C0VS6PrettyJsonBytes(authorityBytes, "preflight-test recovery authority"),
  );
  const v7AuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, authority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    authority.predecessorRecoveryAuthority.path,
    v7AuthorityBytes,
  )).toEqual(authority.predecessorRecoveryAuthority);
  write(root, authority.predecessorRecoveryAuthority.path, v7AuthorityBytes);
  const v7Authority = parsePhase10C0VS6RecoveryV7Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      v7AuthorityBytes,
      "preflight-test recovery-v7 authority",
    ),
  );
  const predecessorAuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, v7Authority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    v7Authority.predecessorRecoveryAuthority.path,
    predecessorAuthorityBytes,
  )).toEqual(v7Authority.predecessorRecoveryAuthority);
  write(root, v7Authority.predecessorRecoveryAuthority.path, predecessorAuthorityBytes);
  const predecessorAuthority = parsePhase10C0VS6RecoveryV6Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      predecessorAuthorityBytes,
      "preflight-test recovery-v6 authority",
    ),
  );
  const earlierRecoveryAuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, predecessorAuthority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    predecessorAuthority.predecessorRecoveryAuthority.path,
    earlierRecoveryAuthorityBytes,
  )).toEqual(predecessorAuthority.predecessorRecoveryAuthority);
  write(root, predecessorAuthority.predecessorRecoveryAuthority.path, earlierRecoveryAuthorityBytes);
  const earlierRecoveryAuthority = parsePhase10C0VS6RecoveryV5Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      earlierRecoveryAuthorityBytes,
      "preflight-test recovery-v5 authority",
    ),
  );
  const secondEarlierRecoveryAuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, earlierRecoveryAuthority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    earlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    secondEarlierRecoveryAuthorityBytes,
  )).toEqual(earlierRecoveryAuthority.predecessorRecoveryAuthority);
  write(
    root,
    earlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    secondEarlierRecoveryAuthorityBytes,
  );
  const secondEarlierRecoveryAuthority = parsePhase10C0VS6RecoveryV4Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      secondEarlierRecoveryAuthorityBytes,
      "preflight-test recovery-v4 authority",
    ),
  );
  const thirdEarlierRecoveryAuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, secondEarlierRecoveryAuthority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    secondEarlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    thirdEarlierRecoveryAuthorityBytes,
  )).toEqual(secondEarlierRecoveryAuthority.predecessorRecoveryAuthority);
  write(
    root,
    secondEarlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    thirdEarlierRecoveryAuthorityBytes,
  );
  const thirdEarlierRecoveryAuthority = parsePhase10C0VS6RecoveryV3Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      thirdEarlierRecoveryAuthorityBytes,
      "preflight-test recovery-v3 authority",
    ),
  );
  const fourthEarlierRecoveryAuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, thirdEarlierRecoveryAuthority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    thirdEarlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    fourthEarlierRecoveryAuthorityBytes,
  )).toEqual(thirdEarlierRecoveryAuthority.predecessorRecoveryAuthority);
  write(
    root,
    thirdEarlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    fourthEarlierRecoveryAuthorityBytes,
  );
  const fourthEarlierRecoveryAuthority = parsePhase10C0VS6RecoveryV2Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      fourthEarlierRecoveryAuthorityBytes,
      "preflight-test recovery-v2 authority",
    ),
  );
  const originalAuthorityBytes = new Uint8Array(readFileSync(
    resolve(ROOT, fourthEarlierRecoveryAuthority.predecessorRecoveryAuthority.path),
  ));
  expect(phase10C0VS6ArtifactIdentity(
    fourthEarlierRecoveryAuthority.predecessorRecoveryAuthority.path,
    originalAuthorityBytes,
  )).toEqual(fourthEarlierRecoveryAuthority.predecessorRecoveryAuthority);
  write(root, fourthEarlierRecoveryAuthority.predecessorRecoveryAuthority.path, originalAuthorityBytes);
  for (const identity of [
    authority.predecessorPacketCatalogue,
    authority.predecessorApProtocol,
    authority.predecessorAuthorizedPacketProtocol,
    ...authority.predecessorAttemptArtifacts,
    ...authority.predecessorPublishedArtifacts,
  ]) {
    const artifact = new Uint8Array(readFileSync(resolve(ROOT, identity.path)));
    expect(phase10C0VS6ArtifactIdentity(identity.path, artifact)).toEqual(identity);
    write(root, identity.path, artifact);
  }
  for (const lock of authority.predecessorLockArtifacts) {
    write(root, lock.path, phase10C0VS6PrettyJsonBytes(lock.parsedContent));
  }
  write(root, "evidence/MANIFEST.json", readFileSync(resolve(ROOT, "evidence/MANIFEST.json")));
}

function identity(path: string, bytes: Uint8Array | string): Phase10C0VS6ArtifactIdentity {
  return phase10C0VS6ArtifactIdentity(
    path,
    typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes,
  );
}

function movingPublicationSemanticRequest(): Phase10C0VMovingPublicationSemanticRequest {
  const produce = packet("c0v-moving-produce");
  const publication = packet("c0v-moving-publish");
  const protocol = produce.bindings.scienceProtocol;
  const referenceOrRefusal = produce.bindings.referenceOrRefusal;
  if (protocol === null || referenceOrRefusal === null) {
    throw new Error("moving fixture lacks its exact science/reference bindings");
  }
  const attemptDirectory =
    "out/phase10-execution-v2/recovery-v8/attempts/c0v-moving-produce/c0v-moving-produce-20260822-v4";
  const stdout = identity(`${attemptDirectory}/stdout.log`, "stdout\n");
  const stderr = identity(`${attemptDirectory}/stderr.log`, "stderr\n");
  const terminalCandidate = identity(
    `${attemptDirectory}/terminal-success-candidate.json`,
    "terminal candidate\n",
  );
  const terminalArtifacts = Object.freeze([stderr, stdout, terminalCandidate]
    .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  const terminalRetainedBytes = terminalArtifacts.reduce(
    (total, artifact) => total + artifact.byteLength,
    0,
  );
  const invocationAuthority = produce.executableInvocationRosters.find(
    (entry) => entry.tupleId === "moving-discrepancy-refusal",
  )?.invocations[0];
  if (invocationAuthority === undefined) {
    throw new Error("moving fixture lacks its exact discrepancy caller invocation");
  }
  const elapsedNanoseconds = 1_000_000_000;
  const attempt: Phase10C0VS6AttemptRowV2 = Object.freeze({
    schema: "phase10-c0v-attempt-row-v2",
    attemptId: produce.registeredAttemptId,
    layerId: "C0V-MOVING-EVENT",
    branch: "independent-reference",
    protocol,
    referenceOrRefusal,
    runtime: "Node v24.13.1",
    command: "synthetic-moving-publication-semantic-reproof",
    gitHead: "a".repeat(40),
    startedAt: "2026-08-22T12:00:00.000Z",
    finishedAt: "2026-08-22T12:00:02.000Z",
    wallSeconds: 2,
    processHours: elapsedNanoseconds / 3_600_000_000_000,
    processConcurrency: 1,
    scratchBytes: terminalRetainedBytes,
    retainedBytes: terminalRetainedBytes,
    terminalStatus: "refusal",
    dispositionCode: "reference-discrepancy-refusal",
    exitCode: 0,
    preflight: identity("evidence/synthetic-moving-preflight.json", "preflight\n"),
    stdout,
    stderr,
    terminalCandidate,
    executableInvocationRecords: Object.freeze([Object.freeze({
      invocationId: invocationAuthority.invocationId,
      callableId: invocationAuthority.callableId,
      negativeControlId: invocationAuthority.negativeControlId,
      invocationClass: invocationAuthority.invocationClass,
      startedAt: "2026-08-22T12:00:00.000Z",
      finishedAt: "2026-08-22T12:00:01.000Z",
      elapsedNanoseconds,
      wallSeconds: 1,
      registeredWallSecondsMaximum: invocationAuthority.registeredWallSecondsMaximum,
      terminalState: "complete",
    })]),
    workerProgress: null,
    resourceRecord: Object.freeze({
      schema: "phase10-c0v-resource-record-v1",
      registeredObservationPointIds: Object.freeze(["terminal"]),
      observations: Object.freeze([Object.freeze({
        observationId: "terminal",
        observedAt: "2026-08-22T12:00:02.000Z",
        artifacts: terminalArtifacts,
        concurrentBytes: terminalRetainedBytes,
      })]),
      maximumObservedConcurrentBytes: terminalRetainedBytes,
      maximumObservationId: "terminal",
      terminalRetainedBytes,
      excludedLedgerPath: "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl",
    }),
    executionRecord: Object.freeze({
      protocolReopenCount: 1,
      referenceOrRefusalReopenCount: 1,
      workerProcessInvocationCount: 1,
      solverWorkerInvocationCount: 0,
      productionInvocationCount: 0,
      discrepancyOrRefusalEvaluatorInvocationCount: 1,
      freezeEvaluatorInvocationCount: 1,
      resourceEvaluatorInvocationCount: 1,
      attemptCensusEvaluatorInvocationCount: 1,
      checkCallerInvocationCount: 4,
      numericalEvaluatorInvocationCount: 0,
      numericalNegativeControlInvocationCount: 0,
      acceptedValidWitnessCount: 0,
      acceptedNumericalVerdictCount: 0,
      governedInvocationElapsedNanoseconds: elapsedNanoseconds,
      governedInvocationWallSeconds: 1,
    }),
    partialExecution: null,
    classificationValidation: Object.freeze({
      validationId: "classification-c0v-moving-produce-semantic-reproof",
      assemblerCallableId: "phase10-c0v-moving-attempt-receipt-writer",
      componentEvaluatorCallableIds: Object.freeze([
        "phase10-c0v-moving-evaluator",
        "phase10-c0v-s6-freeze-evaluator",
        "phase10-c0v-s6-attempt-census-evaluator",
        "phase10-c0v-s6-resource-evaluator",
      ]),
      method: "independent-reference-discrepancy-classification",
      validatedDispositionCode: "reference-discrepancy-refusal",
      observations: Object.freeze([Object.freeze({
        conditionId: "cond-moving-semantic-reproof",
        kind: "reference-check-outcome",
        comparator: "equal",
        registeredValue: "fail",
        observedValue: "fail",
        unit: "outcome",
        conditionPassed: true,
        evidenceIds: Object.freeze(["evidence-moving-reference"]),
      })]),
      evidence: Object.freeze([Object.freeze({
        evidenceId: "evidence-moving-reference",
        evidenceRole: "reference-or-refusal",
        retentionClass: "tracked-evidence",
        artifact: referenceOrRefusal,
        inlineObservationPath: null,
      })]),
      zeroScientificExecution: true,
      partialExecutionMatched: true,
      acceptedValidWitnessAbsent: true,
      acceptedNumericalVerdictAbsent: true,
      completedNumericalNegativeControlCampaignCreditAbsent: true,
      verdict: "pass",
      errors: Object.freeze([]),
    }),
  });
  const attemptLedgerBytes = phase10C0VS6AttemptLedgerBytes(Object.freeze([attempt]));
  const attemptLedgerIdentity = phase10C0VS6ArtifactIdentity(
    "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl",
    attemptLedgerBytes,
  );
  const result = Object.freeze({
    schema: "phase10-c0v-moving-result-v1",
    resultId: "c0v-moving-result-v1",
    layerId: "C0V-MOVING-EVENT",
    branch: "independent-reference",
    protocol,
    referenceOrRefusal,
    attemptLedger: attemptLedgerIdentity,
    witness: null,
    evaluation: null,
    terminalStatus: "refusal",
    scientificDisposition: "refusal",
    negativeControlDisposition: "not-run-no-credit",
    resourceDisposition: "within-cap",
    claimBoundary: publication.claimBoundary,
  });
  const resultBytes = phase10C0VS6PrettyJsonBytes(result);
  const resultIdentity = phase10C0VS6ArtifactIdentity(
    "evidence/phase10-numerical-verification-v1/c0v-moving-result.json",
    resultBytes,
  );
  const indexEntry = (
    artifactId: string,
    artifact: Phase10C0VS6ArtifactIdentity,
    role: string,
    producedBy: string,
  ) => Object.freeze({
    artifactId,
    path: artifact.path,
    mediaType: artifact.path.endsWith(".jsonl") ? "application/x-ndjson" : "application/json",
    byteLength: artifact.byteLength,
    sha256: artifact.sha256,
    role,
    producedBy,
  });
  const artifactIndexBytes = phase10C0VS6PrettyJsonBytes(Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([
      indexEntry(
        "out-c0v-moving-attempt-ledger",
        attemptLedgerIdentity,
        "attempt-ledger",
        "phase10-c0v-moving-attempt-receipt-writer",
      ),
      indexEntry(
        "out-c0v-moving-protocol",
        protocol,
        "science-protocol",
        "phase10-c0v-moving-protocol-producer",
      ),
      indexEntry(
        "out-c0v-moving-reference",
        referenceOrRefusal,
        "independent-reference",
        "phase10-c0v-moving-reference-producer",
      ),
      indexEntry(
        "out-c0v-moving-result",
        resultIdentity,
        "layer-result",
        "phase10-c0v-moving-publish-producer",
      ),
    ].sort((left, right) => left.artifactId < right.artifactId
      ? -1
      : left.artifactId > right.artifactId ? 1 : 0)),
  }));
  return Object.freeze({
    publicationPacket: publication,
    verifiedProduce: Object.freeze({
      packet: produce,
      selectedAttempt: attempt,
      attemptLedgerIdentity,
      attemptLedgerBytes,
      reopenedArtifacts: Object.freeze([
        Object.freeze({
          artifactRole: "published-output",
          outputId: "out-c0v-moving-protocol",
          identity: protocol,
          bytes: new Uint8Array(readFileSync(resolve(ROOT, protocol.path))),
        }),
        Object.freeze({
          artifactRole: "published-output",
          outputId: "out-c0v-moving-reference",
          identity: referenceOrRefusal,
          bytes: new Uint8Array(readFileSync(resolve(ROOT, referenceOrRefusal.path))),
        }),
        Object.freeze({
          artifactRole: "published-output",
          outputId: "out-c0v-moving-attempt-ledger",
          identity: attemptLedgerIdentity,
          bytes: attemptLedgerBytes,
        }),
      ]),
    }),
    candidate: Object.freeze({ resultBytes, artifactIndexBytes }),
  });
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Phase 10 C0V S6 parent preflight observer", () => {
  it("maps the exact raw Node version to the registered runtime label", () => {
    expect(phase10C0VS6ResolveRuntimeLabel("v24.13.1")).toBe("Node v24.13.1");
  });

  it("rejects every other raw Node version", () => {
    expect(() => phase10C0VS6ResolveRuntimeLabel("v24.13.0")).toThrow(/live runtime .* differs/u);
  });

  it("resolves every accepted A-P route output from its exact matrix row through the live overlay", () => {
    const authority = packet("a-p-c0v-s6");
    const matrix = parsePhase10C0VS6Matrix(parsePhase10C0VS6PrettyJsonBytes(
      readFileSync(resolve(ROOT, authority.bindings.matrix.path)),
      "A-P observer route matrix",
    ));
    const route = authority.terminalSubroutes.find((entry) =>
      entry.subrouteId === "a-p-c0v-s6-structural-complete");
    if (route === undefined) throw new Error("A-P observer route fixture is missing");

    expect(phase10C0VS6ResolvePriorRouteOutputPaths(
      matrix,
      authority,
      route.requiredOutputIds,
    )).toEqual([
      "evidence/phase10-obligation-preflight-v6/artifact-index.json",
      "evidence/phase10-obligation-preflight-v6/missing-producer.json",
      "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/preflight.json",
      "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json",
      "evidence/phase10-obligation-preflight-v6/uncalled-check.json",
      "evidence/phase10-obligation-preflight-v6/verification.json",
    ]);

    const wrongMatrix = {
      outputs: matrix.outputs.map((entry) => entry.outputId === "out-ap-c0v-s6-verification"
        ? { ...entry, artifact: { ...entry.artifact, path: "evidence/wrong-verification.json" } }
        : entry),
    };
    expect(() => phase10C0VS6ResolvePriorRouteOutputPaths(
      wrongMatrix,
      authority,
      route.requiredOutputIds,
    )).toThrow(/does not resolve one registered whole-file publication path/u);

    const incompleteOverlay = {
      packetId: authority.packetId,
      paths: {
        allowedPublicationPaths: authority.paths.allowedPublicationPaths.slice(0, -1),
      },
    };
    expect(() => phase10C0VS6ResolvePriorRouteOutputPaths(
      matrix,
      incompleteOverlay,
      route.requiredOutputIds,
    )).toThrow(/does not resolve one registered whole-file publication path/u);
  });

  it("deep-reproofs the moving publication before any current preflight write", () => {
    const request = movingPublicationSemanticRequest();
    expect(independentlyEvaluatePhase10C0VMovingPublicationSemantic(request).aggregateVerdict)
      .toBe("pass");

    const result = JSON.parse(new TextDecoder().decode(request.candidate.resultBytes)) as Record<
      string,
      unknown
    >;
    const coherentlyMutatedResultBytes = phase10C0VS6PrettyJsonBytes({
      ...result,
      scientificDisposition: "pass",
    });
    const coherentlyMutatedResultIdentity = phase10C0VS6ArtifactIdentity(
      "evidence/phase10-numerical-verification-v1/c0v-moving-result.json",
      coherentlyMutatedResultBytes,
    );
    const index = JSON.parse(new TextDecoder().decode(
      request.candidate.artifactIndexBytes,
    )) as { artifacts: Array<Record<string, unknown>> };
    const coherentlyRehashedIndexBytes = phase10C0VS6PrettyJsonBytes({
      ...index,
      artifacts: index.artifacts.map((entry) => entry.artifactId === "out-c0v-moving-result"
        ? {
            ...entry,
            byteLength: coherentlyMutatedResultIdentity.byteLength,
            sha256: coherentlyMutatedResultIdentity.sha256,
          }
        : entry),
    });
    expect(() => independentlyEvaluatePhase10C0VMovingPublicationSemantic({
      ...request,
      candidate: {
        resultBytes: coherentlyMutatedResultBytes,
        artifactIndexBytes: coherentlyRehashedIndexBytes,
      },
    })).toThrow(/result rederivation differs/u);

    const coherentlyMutatedIndexBytes = phase10C0VS6PrettyJsonBytes({
      ...index,
      artifacts: index.artifacts.map((entry) => entry.artifactId === "out-c0v-moving-attempt-ledger"
        ? { ...entry, role: "scientific-witness" }
        : entry),
    });
    expect(() => independentlyEvaluatePhase10C0VMovingPublicationSemantic({
      ...request,
      candidate: {
        ...request.candidate,
        artifactIndexBytes: coherentlyMutatedIndexBytes,
      },
    })).toThrow(/artifact graph rederivation differs/u);

    const observerSource = readFileSync(
      resolve(ROOT, "runner/src/phase10-c0v-s6-preflight-observer.ts"),
      "utf8",
    );
    const deepProjection = observerSource.indexOf(
      "const deeplyVerifiedPriorPacketIds = assertSupportedDeepPriorProjection(input, preliminary);",
    );
    const writer = observerSource.indexOf("export function phase10C0VS6WriteObservedPreflight");
    const observerCall = observerSource.indexOf("const observed = phase10C0VS6ObservePreflight(input);", writer);
    const publication = observerSource.indexOf(
      "const publication = phase10C0VS6PublishCrashSafeExclusive(",
      writer,
    );
    expect(deepProjection).toBeGreaterThan(0);
    expect(writer).toBeGreaterThan(deepProjection);
    expect(observerCall).toBeGreaterThan(writer);
    expect(publication).toBeGreaterThan(observerCall);
    expect(observerSource).toContain(
      "independentlyVerifyPhase10C0VS6ObservedPublishedDependencyPrefix",
    );
    expect(observerSource).toContain("\"c0v-static-publish\"");
    expect(observerSource).toContain("packetIds.every((entry, index) => entry === order[index])");
    const publishedPacketSource = readFileSync(
      resolve(ROOT, "runner/src/phase10-c0v-s6-published-packet.ts"),
      "utf8",
    );
    expect(packet("c0v-radial-produce").boundDependencyPacketIds).toEqual(["a-p-c0v-s6"]);
    expect(publishedPacketSource).toContain("for (const packetId of requiredCoreIds)");
    expect(publishedPacketSource).toContain("const expected = manifest.get(outputPath)");
    expect(publishedPacketSource).toContain("const pending = [...requiredCoreIds]");
    expect(publishedPacketSource).toContain(
      "if (nestedPacketId === \"a-p\" && packetId === \"a-p-c0v-s6\") continue;",
    );
  });

  it("uses exact integer boundaries and refuses ambiguous simultaneous resource failures", () => {
    const authority = packet("c0v-radial-produce");
    const elapsedAtEquality = authority.resources.packageElapsedNanosecondsMaximum -
      authority.resources.currentPacketRegisteredElapsedNanosecondsMaximum;
    const retainedAtEquality = authority.resources.retainedStorageBytesMaximum -
      authority.resources.projectedScratchBytes - authority.resources.projectedPublicationBytes;
    const equality = phase10C0VS6ClassifyPreflightResources(authority, {
      packageElapsedNanosecondsBeforeAttempt: elapsedAtEquality,
      packageRetainedBytesBeforeAttempt: retainedAtEquality,
      observedFreeBytes: authority.resources.minimumFreeBytes,
    });
    expect(equality.projectedPackageElapsedNanosecondsAfterAttempt)
      .toBe(authority.resources.packageElapsedNanosecondsMaximum);
    expect(equality.projectedPackageBytesAfterAttempt)
      .toBe(authority.resources.retainedStorageBytesMaximum);
    expect(equality.failedConditionIds).toEqual([]);
    expect(phase10C0VS6SelectPreflightFailure(equality, false)).toBeNull();

    const elapsedOver = phase10C0VS6ClassifyPreflightResources(authority, {
      packageElapsedNanosecondsBeforeAttempt: elapsedAtEquality + 1,
      packageRetainedBytesBeforeAttempt: authority.resources.packageStorageBaselineBytes,
      observedFreeBytes: authority.resources.minimumFreeBytes,
    });
    expect(elapsedOver.failedConditionIds)
      .toEqual(["cond-c0v-radial-produce-prelaunch-process-hours"]);
    expect(phase10C0VS6SelectPreflightFailure(elapsedOver, false))
      .toBe("cond-c0v-radial-produce-prelaunch-process-hours");

    const storageOver = phase10C0VS6ClassifyPreflightResources(authority, {
      packageElapsedNanosecondsBeforeAttempt: 0,
      packageRetainedBytesBeforeAttempt: retainedAtEquality + 1,
      observedFreeBytes: authority.resources.minimumFreeBytes,
    });
    expect(storageOver.failedConditionIds)
      .toEqual(["cond-c0v-radial-produce-prelaunch-storage"]);

    const multiple = phase10C0VS6ClassifyPreflightResources(authority, {
      packageElapsedNanosecondsBeforeAttempt: elapsedAtEquality + 1,
      packageRetainedBytesBeforeAttempt: authority.resources.packageStorageBaselineBytes,
      observedFreeBytes: authority.resources.minimumFreeBytes - 1,
    });
    expect(multiple.failedConditionIds).toEqual([
      "cond-c0v-radial-produce-prelaunch-free-space",
      "cond-c0v-radial-produce-prelaunch-process-hours",
    ]);
    expect(() => phase10C0VS6SelectPreflightFailure(multiple, false))
      .toThrow(/multiple simultaneous failures/u);
    expect(() => phase10C0VS6SelectPreflightFailure(elapsedOver, true))
      .toThrow(/multiple simultaneous failures/u);
    expect(phase10C0VS6SelectPreflightFailure(equality, true))
      .toBe("cond-c0v-radial-artifact-precondition-failed");
  });

  it("carries the accepted A-P accounting into the recovery-v8 moving-v4 projection", () => {
    const authority = packet("c0v-moving-produce");
    expect(authority.registeredAttemptId).toBe("c0v-moving-produce-20260822-v4");
    expect(authority.resources.packageStorageBaselineBytes).toBe(2_995_707);
    expect(authority.resources.currentPacketRegisteredElapsedNanosecondsMaximum)
      .toBe(14_400_000_000_000);

    const observed = phase10C0VS6ClassifyPreflightResources(authority, {
      packageElapsedNanosecondsBeforeAttempt: 532_300_704_500,
      packageRetainedBytesBeforeAttempt: 3_633_382,
      observedFreeBytes: Number.MAX_SAFE_INTEGER,
    });
    expect(observed).toEqual({
      packageElapsedNanosecondsBeforeAttempt: 532_300_704_500,
      projectedPackageElapsedNanosecondsAfterAttempt: 14_932_300_704_500,
      packageRetainedBytesBeforeAttempt: 3_633_382,
      projectedPackageBytesAfterAttempt: 79_130_854,
      observedFreeBytes: Number.MAX_SAFE_INTEGER,
      failedConditionIds: [],
    });
  });

  it("requires the accepted A-P attempt's six internal plus three selected candidate files", () => {
    const protocolPath = resolve(
      ROOT,
      "research/phase10-execution-v2/recovery-v5/packets/a-p-c0v-s6/protocol.json",
    );
    const historical = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
      readFileSync(protocolPath),
      "accepted historical A-P protocol",
    ));
    const routeId = "a-p-c0v-s6-structural-complete";
    const attemptDirectory = `${historical.paths.attemptRoot}/${historical.registeredAttemptId}`;
    const internal = historical.internalArtifactRosters.find((entry) => entry.rosterId === routeId);
    const candidates = historical.candidateFilenameRosters[routeId];
    if (internal === undefined || candidates === undefined) throw new Error("A-P route fixture is incomplete");
    const expected = [
      ...internal.relativePaths.map((path) => `${attemptDirectory}/${path}`),
      ...candidates.map((filename) => `${attemptDirectory}/candidate/${filename}`),
    ].sort();
    expect(expected).toHaveLength(9);
    expect(() => phase10C0VS6AssertSelectedAttemptPathRoster(
      historical,
      routeId,
      attemptDirectory,
      expected,
    )).not.toThrow();
    expect(() => phase10C0VS6AssertSelectedAttemptPathRoster(
      historical,
      routeId,
      attemptDirectory,
      expected.slice(1),
    )).toThrow(/selected attempt paths/u);
    expect(() => phase10C0VS6AssertSelectedAttemptPathRoster(
      historical,
      routeId,
      attemptDirectory,
      [...expected, `${attemptDirectory}/candidate/unregistered.json`],
    )).toThrow(/selected attempt paths/u);
    expect(() => phase10C0VS6AssertSelectedAttemptPathRoster(
      historical,
      routeId,
      attemptDirectory,
      expected.map((path, index) => index === 0 ? `${attemptDirectory}/wrong.json` : path).sort(),
    )).toThrow(/selected attempt paths/u);
  });

  it("censuses physical copies in path order and rejects a hard-linked retained artifact", () => {
    const rootPath = temporaryRoot("census");
    write(rootPath, "out/attempt/c.txt", "ccc\n");
    write(rootPath, "out/attempt/nested/a.bin", new Uint8Array([1, 2, 3]));
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const census = phase10C0VS6CensusUniquePhysicalDirectory(root, "out/attempt");
    expect(census.map((entry) => entry.path)).toEqual([
      "out/attempt/c.txt",
      "out/attempt/nested/a.bin",
    ]);
    expect(census.map((entry) => entry.byteLength)).toEqual([4, 3]);

    linkSync(
      resolve(rootPath, "out/attempt/c.txt"),
      resolve(rootPath, "out/attempt/copy.txt"),
    );
    expect(() => phase10C0VS6CensusUniquePhysicalDirectory(root, "out/attempt"))
      .toThrow(/unique physical census file/u);
  });

  it("recursively rejects an unknown file anywhere below a governed retained root", () => {
    const rootPath = temporaryRoot("retained-root");
    const first = new TextEncoder().encode("first\n");
    const second = new Uint8Array([4, 5, 6]);
    write(rootPath, "evidence/package/a.json", first);
    write(rootPath, "evidence/package/nested/b.bin", second);
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const expected = Object.freeze([
      phase10C0VS6ArtifactIdentity("evidence/package/a.json", first),
      phase10C0VS6ArtifactIdentity("evidence/package/nested/b.bin", second),
    ]);
    expect(phase10C0VS6AssertExactPhysicalRootCensus(root, ["evidence/package"], expected))
      .toEqual(expected);

    write(rootPath, "evidence/package/nested/unregistered.json", "{}\n");
    expect(() => phase10C0VS6AssertExactPhysicalRootCensus(root, ["evidence/package"], expected))
      .toThrow(/cardinality differs/u);
    expect(() => phase10C0VS6AssertExactPhysicalRootCensus(
      root,
      ["evidence/package", "evidence/package/nested"],
      expected,
    )).toThrow(/repeated, or overlapping/u);
  });

  it("reopens both live lock bytes and rejects caller or on-disk lock drift", () => {
    const authority = packet("c0v-moving-produce");
    const rootPath = temporaryRoot("locks");
    const acquiredAt = "2026-08-22T12:00:00.000Z";
    const locks: Phase10C0VS6PackageAndPacketLockContext = Object.freeze({
      packageLock: Object.freeze({
        schema: "phase10-c0v-s6-lock-v1",
        packetId: "phase10-c0v-s6-execution-v2-recovery-v8-packet-paths-v1",
        attemptId: `${authority.packetId}:${authority.registeredAttemptId}`,
        processId: process.pid,
        acquiredAt,
      }),
      packetLock: Object.freeze({
        schema: "phase10-c0v-s6-lock-v1",
        packetId: authority.packetId,
        attemptId: authority.registeredAttemptId,
        processId: process.pid,
        acquiredAt,
      }),
    });
    write(rootPath, authority.paths.packageLockPath, phase10C0VS6PrettyJsonBytes(locks.packageLock));
    write(rootPath, authority.paths.lockPath, phase10C0VS6PrettyJsonBytes(locks.packetLock));
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    expect(() => phase10C0VS6AssertObservedLocks(root, authority, locks)).not.toThrow();

    const unknownLockPath = "out/phase10-execution-v2/recovery-v8/locks/unregistered.lock";
    write(rootPath, unknownLockPath, "unknown\n");
    expect(() => phase10C0VS6AssertObservedLocks(root, authority, locks))
      .toThrow(/cardinality differs/u);
    unlinkSync(resolve(rootPath, unknownLockPath));

    expect(() => phase10C0VS6AssertObservedLocks(root, authority, {
      ...locks,
      packetLock: { ...locks.packetLock, processId: process.pid + 1 },
    })).toThrow(/contexts differ/u);

    writeFileSync(
      resolve(rootPath, authority.paths.lockPath),
      phase10C0VS6PrettyJsonBytes({ ...locks.packetLock, acquiredAt: "2026-08-22T12:00:01.000Z" }),
    );
    expect(() => phase10C0VS6AssertObservedLocks(root, authority, locks))
      .toThrow(/bytes changed/u);
  });

  it("binds preflight authority to the exact active lock-issued parent watchdog", async () => {
    const packetId = "c0v-moving-produce" as const;
    const rootPath = temporaryRoot("authenticated-watchdog");
    for (const path of [
      "research/phase10-execution-v2/recovery-v8/recovery-authority.json",
      "research/phase10-execution-v2/recovery-v8/packet-catalogue.json",
      `research/phase10-execution-v2/recovery-v8/packets/${packetId}/protocol.json`,
    ]) {
      write(rootPath, path, readFileSync(resolve(ROOT, path)));
    }
    writeRecoveryPredecessorState(rootPath);
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    let assertAfterCallback: (() => void) | null = null;
    await phase10C0VS6WithPackageAndPacketLocks(
      root,
      packetId,
      "run",
      async (locks, authority, watchdog) => {
        expect(() => phase10C0VS6AssertActiveLockedPacketWatchdog(
          root,
          locks,
          authority,
          watchdog,
          "run",
        )).not.toThrow();
        const forgedWatchdog = Object.freeze({
          signal: new AbortController().signal,
          startedAtMonotonicNanoseconds: process.hrtime.bigint(),
          assertActive(): void {},
          registerTerminationTarget(): () => void {
            return () => {};
          },
        });
        expect(() => phase10C0VS6AssertActiveLockedPacketWatchdog(
          root,
          locks,
          authority,
          forgedWatchdog,
          "run",
        )).toThrow(/watchdog context was not issued/u);
        await phase10C0VS6WithOuterInfrastructureWatchdog(
          1_000_000_000,
          (otherGenuineWatchdog) => {
            expect(() => phase10C0VS6AssertActiveLockedPacketWatchdog(
              root,
              locks,
              authority,
              otherGenuineWatchdog,
              "run",
            )).toThrow(/watchdog context was not issued/u);
          },
          "synthetic unrelated watchdog",
        );
        assertAfterCallback = () => phase10C0VS6AssertActiveLockedPacketWatchdog(
          root,
          locks,
          authority,
          watchdog,
          "run",
        );
      },
    );
    expect(assertAfterCallback).not.toBeNull();
    expect(() => assertAfterCallback!()).toThrow(/not issued by the active package-lock callback/u);
  });

  it("retains a completed lock when the cleanup-eligibility deadline expires before unlink", async () => {
    const rootPath = temporaryRoot("cleanup-deadline");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const lockPath = "locks/packet.lock";
    let cleanupAssertions = 0;
    await expect(phase10C0VS6WithExclusiveLock(
      root,
      lockPath,
      "packet",
      "attempt",
      () => "completed-action",
      () => {
        cleanupAssertions += 1;
        if (cleanupAssertions === 2) throw new Error("synthetic cleanup deadline expired");
      },
    )).rejects.toThrow(/synthetic cleanup deadline expired/u);
    expect(cleanupAssertions).toBe(2);
    expect(existsSync(resolve(rootPath, lockPath))).toBe(true);
  });
});
