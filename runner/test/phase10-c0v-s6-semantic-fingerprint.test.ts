import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson, strictJsonSnapshot } from "../src/gate4-evidence.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH,
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6PacketCatalogue,
  type Phase10C0VS6PacketProtocol,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  independentlyReprovePhase10C0VS6ApNegativeControl,
} from "../src/phase10-c0v-s6-ap-independent.ts";
import {
  runPhase10C0VS6MissingProducerControl,
  runPhase10C0VS6UncalledCheckControl,
  type Phase10C0VS6ApNegativeControlReceipt,
} from "../src/phase10-c0v-s6-ap-negative-controls.ts";
import {
  phase10C0VS6BuildMutationWitness,
  phase10C0VS6ResolveCurrentWholeFileOutputPath,
} from "../src/phase10-c0v-s6-published-packet.ts";
import {
  parsePhase10C0VS6PacketVerificationV2Bytes,
  writePhase10C0VAggregateVerificationReceipt,
  writePhase10C0VS6ApVerificationReceipt,
  type Phase10C0VS6NegativeControlResult,
  type Phase10C0VS6PacketVerificationV2Authority,
} from "../src/phase10-c0v-s6-receipts.ts";
import { phase10C0VS6CanonicalSemanticSha256 } from "../src/phase10-c0v-s6-semantic-fingerprint.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const MATRIX = parsePhase10C0VS6Matrix(parsePhase10C0VS6PrettyJsonBytes(
  new Uint8Array(readFileSync(resolve(ROOT, "research/phase10-c0v-s6-obligation-matrix-v1.json"))),
  "C0V matrix",
));

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function textBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function prettyBytes(value: unknown): Uint8Array {
  return textBytes(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function identity(path: string, seed = path): Phase10C0VS6ArtifactIdentity {
  const encoded = textBytes(seed);
  return Object.freeze({ path, byteLength: encoded.byteLength, sha256: sha256(encoded) });
}

function livePacket(packetId: Phase10C0VS6PacketProtocol["packetId"]): Phase10C0VS6PacketProtocol {
  const path = `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets/${packetId}/protocol.json`;
  return parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
    new Uint8Array(readFileSync(resolve(ROOT, path))),
    path,
  ));
}

function liveCatalogue(): Phase10C0VS6PacketCatalogue {
  return parsePhase10C0VS6PacketCatalogue(parsePhase10C0VS6PrettyJsonBytes(
    new Uint8Array(readFileSync(resolve(ROOT, PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH))),
    PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH,
  ));
}

function controlResult(receipt: Phase10C0VS6ApNegativeControlReceipt): Phase10C0VS6NegativeControlResult {
  return Object.freeze({
    negativeControlId: receipt.fixtureId === "missing-producer"
      ? "nc-ap-c0v-s6-missing-producer"
      : "nc-ap-c0v-s6-uncalled-check",
    mutationExecuted: true,
    rejected: true,
    beforeWitness: receipt.beforeWitness,
    afterWitness: receipt.afterWitness,
    errors: Object.freeze([]),
  });
}

function verificationFixture(
  packet: Phase10C0VS6PacketProtocol,
  catalogue: Phase10C0VS6PacketCatalogue,
  negativeControlResults: readonly Phase10C0VS6NegativeControlResult[],
): Readonly<{ value: unknown; authority: Phase10C0VS6PacketVerificationV2Authority }> {
  const subroute = packet.terminalSubroutes.find((entry) => entry.dispositionCode === null);
  if (subroute === undefined) throw new Error(`${packet.packetId} lacks a normal verification subroute`);
  const verifiedArtifacts = Object.freeze(subroute.requiredOutputIds
    .filter((outputId) => !outputId.endsWith("-verification") && !outputId.endsWith("-terminal-receipt"))
    .map((outputId) => Object.freeze({
      outputId,
      ...identity(
        phase10C0VS6ResolveCurrentWholeFileOutputPath(MATRIX, packet, outputId),
        `${packet.packetId}:${outputId}`,
      ),
    })));
  const checkResults = Object.freeze(subroute.requiredCheckIds.map((checkId) => Object.freeze({
    checkId,
    verdict: "pass" as const,
    reasons: Object.freeze([]),
    witnessOutputIds: Object.freeze([]),
  })));
  const callerRoster = packet.terminalReceiptContract.callerInvocationResultRosters.find(
    (entry) => entry.subrouteId === subroute.subrouteId,
  );
  if (callerRoster === undefined) throw new Error(`${packet.packetId} lacks its caller-result roster`);
  const callerInvocationResults = Object.freeze(callerRoster.callerInvocationResults.map(
    (row, callerIndex) => Object.freeze({
      callerInvocationId: row.callerInvocationId,
      stage: row.stage,
      callerCallableId: row.callerCallableId,
      evaluatorCallableId: row.evaluatorCallableId,
      terminalState: row.terminalState,
      executedCheckIds: row.executedCheckIds,
      evaluatedCheckIds: row.evaluatedCheckIds,
      executedNegativeControlIds: row.executedNegativeControlIds,
      evaluatorResult: strictJsonSnapshot({ verdict: "pass", callerInvocationId: row.callerInvocationId }),
      sourceArtifactIdentities: Object.freeze(row.sourceArtifactAuthorities.map((source, sourceIndex) => {
        const output = source.outputId === null
          ? undefined
          : verifiedArtifacts.find((entry) => entry.outputId === source.outputId);
        return Object.freeze({
          artifactRole: source.artifactRole,
          artifact: output === undefined
            ? identity(
              `${packet.paths.attemptRoot}/fixture-source-${callerIndex}-${sourceIndex}.json`,
              `${packet.packetId}:source:${callerIndex}:${sourceIndex}`,
            )
            : Object.freeze({ path: output.path, byteLength: output.byteLength, sha256: output.sha256 }),
        });
      })),
    })),
  );
  const invocationRecords = Object.freeze(packet.verificationInvocationRoster.map((row, index) => {
    const elapsedNanoseconds = index + 1;
    return Object.freeze({
      invocationId: row.invocationId,
      callableId: row.callableId,
      negativeControlId: row.negativeControlId,
      invocationClass: row.invocationClass,
      startedAt: "2026-08-24T00:00:00.000Z",
      finishedAt: "2026-08-24T00:00:00.000Z",
      elapsedNanoseconds,
      wallSeconds: elapsedNanoseconds / 1_000_000_000,
      registeredWallSecondsMaximum: row.registeredWallSecondsMaximum,
      terminalState: "complete" as const,
    });
  }));
  const currentNanoseconds = invocationRecords.reduce((sum, row) => sum + row.elapsedNanoseconds, 0);
  const governedTiming = Object.freeze({
    source: "packet-verification-worker" as const,
    selectedAttemptId: null,
    attemptLedger: null,
    invocationRecords,
    governedInvocationElapsedNanoseconds: currentNanoseconds,
    governedInvocationWallSeconds: currentNanoseconds / 1_000_000_000,
    processHours: currentNanoseconds / 3_600_000_000_000,
  });
  const currentIndex = catalogue.packets.findIndex((entry) => entry.packetId === packet.packetId);
  if (currentIndex < 0) throw new Error(`${packet.packetId} is absent from the catalogue`);
  const selectedPacketIds = Object.freeze(catalogue.packets.slice(0, currentIndex + 1)
    .map((entry) => entry.packetId));
  const priorPacketVerifications = Object.freeze(selectedPacketIds.slice(0, -1).map((packetId) => Object.freeze({
    packetId,
    verification: identity(`fixture/prior/${packetId}/verification.json`),
    governedInvocationElapsedNanoseconds: 0,
    processHours: 0,
  })));
  const packageProcessAccounting = Object.freeze({
    selectedPacketIds,
    priorPacketVerifications,
    unselectedAttemptRows: Object.freeze([]),
    priorSelectedPacketElapsedNanoseconds: 0,
    unselectedAttemptElapsedNanoseconds: 0,
    currentPacketElapsedNanoseconds: currentNanoseconds,
    totalElapsedNanoseconds: currentNanoseconds,
    maximumElapsedNanoseconds: 86_400_000_000_000 as const,
    priorSelectedPacketProcessHours: 0,
    unselectedAttemptProcessHours: 0,
    currentPacketProcessHours: currentNanoseconds / 3_600_000_000_000,
    totalProcessHours: currentNanoseconds / 3_600_000_000_000,
    maximumProcessHours: 24 as const,
    duplicateAccountingVerdict: "pass" as const,
    omissionAccountingVerdict: "pass" as const,
  });
  const attemptRootArtifacts = Object.freeze([
    identity(`${packet.paths.attemptRoot}/fixture-semantic-roundtrip.json`),
  ]);
  const materializedPublicationArtifacts = Object.freeze(verifiedArtifacts
    .map((entry) => Object.freeze({ path: entry.path, byteLength: entry.byteLength, sha256: entry.sha256 }))
    .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  const attemptTerminalRetainedBytes = attemptRootArtifacts.reduce((sum, row) => sum + row.byteLength, 0);
  const materializedPublicationBytes = materializedPublicationArtifacts
    .reduce((sum, row) => sum + row.byteLength, 0);
  const projectedFinalizationBytes = packet.resources.publicationFinalizationProjections
    .reduce((sum, row) => sum + row.maximumByteLength * 2, 0);
  const projectedPacketRetainedBytes =
    attemptTerminalRetainedBytes + materializedPublicationBytes + projectedFinalizationBytes;
  const packetResourceAccounting = Object.freeze({
    source: "append-only-attempt-root" as const,
    attemptId: packet.registeredAttemptId,
    attemptLedger: null,
    attemptRoot: packet.paths.attemptRoot,
    attemptRootArtifacts,
    attemptMaximumObservedConcurrentBytes: attemptTerminalRetainedBytes,
    attemptTerminalRetainedBytes,
    materializedPublicationArtifacts,
    materializedPublicationBytes,
    publicationFinalizationProjections: packet.resources.publicationFinalizationProjections,
    projectedFinalizationBytes,
    projectedPacketRetainedBytes,
    physicalPathUniquenessVerdict: "pass" as const,
    appendOnlyVerdict: "pass" as const,
  });
  const priorPacketResources = Object.freeze(priorPacketVerifications.map((row) => Object.freeze({
    packetId: row.packetId,
    verification: row.verification,
    terminalReceipt: identity(`fixture/prior/${row.packetId}/terminal-receipt.json`),
    attemptMaximumObservedConcurrentBytes: 0,
    finalizedPacketRetainedBytes: 0,
  })));
  const totalPackageRetainedBytes =
    packet.resources.packageStorageBaselineBytes + projectedPacketRetainedBytes;
  const packageResourceAccounting = Object.freeze({
    selectedPacketIds,
    priorPacketResources,
    packageStorageBaselineArtifacts: packet.resources.packageStorageBaselineArtifacts,
    packageStorageBaselineBytes: packet.resources.packageStorageBaselineBytes,
    priorFinalizedPacketRetainedBytes: 0,
    currentProjectedPacketRetainedBytes: projectedPacketRetainedBytes,
    totalPackageRetainedBytes,
    maximumPackageRetainedBytes: 68_719_476_736 as const,
    physicalPathDuplicateVerdict: "pass" as const,
    omissionAccountingVerdict: "pass" as const,
    storageLimitVerdict: "pass" as const,
  });
  const execution = Object.freeze({
    evaluatorCallableId: callerRoster.callerInvocationResults[0]!.evaluatorCallableId,
    modulePath: "runner/src/phase10-c0v-s6-ap-independent.ts",
    exportName: "independentlyVerifyPhase10C0VS6ApArtifacts",
    byteLength: 1,
    sha256: "0".repeat(64),
    runtime: packet.resources.requiredRuntime,
    command: "node focused-semantic-fixture",
    gitHead: "0".repeat(40),
    startedOn: "2026-08-24T00:00:00.000Z",
    endedOn: "2026-08-24T00:00:00.000Z",
    processConcurrency: packet.resources.processConcurrency,
  });
  const executedNegativeControlIds = Object.freeze(negativeControlResults
    .map((entry) => entry.negativeControlId));
  const authority: Phase10C0VS6PacketVerificationV2Authority = Object.freeze({
    selectedSubrouteId: subroute.subrouteId,
    verifiedArtifacts,
    checkResults,
    executedNegativeControlIds,
    negativeControlResults,
    execution,
    callerInvocationResults,
    governedTiming,
    packageProcessAccounting,
    packetResourceAccounting,
    packageResourceAccounting,
  });
  const value = Object.freeze({
    schema: "phase10-packet-verification-v2",
    verificationId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`,
    matrixId: MATRIX.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    terminalState: "complete",
    verifiedArtifacts,
    checkResults,
    executedNegativeControlIds,
    negativeControlResults,
    boundDependencyPacketIds: packet.boundDependencyPacketIds,
    execution,
    callerInvocationResults,
    governedTiming,
    packageProcessAccounting,
    packetResourceAccounting,
    packageResourceAccounting,
    aggregateVerdict: "pass",
    limits: packet.claimBoundary.forbidden,
  });
  return Object.freeze({ value, authority });
}

describe("Phase 10 C0V S6 semantic fingerprints", () => {
  it("round-trips real A-P controls through independent reproof and verification-v2", () => {
    const packet = livePacket("a-p-c0v-s6");
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    for (const receipt of [missing, uncalled]) {
      for (const witness of [receipt.beforeWitness, receipt.afterWitness]) {
        expect(witness.sha256).not.toBe(witness.semanticFingerprint.sha256);
        expect(witness.semanticFingerprint.sha256).toBe(
          phase10C0VS6CanonicalSemanticSha256(witness.semanticFingerprint.projection),
        );
      }
      const reproof = independentlyReprovePhase10C0VS6ApNegativeControl(ROOT, prettyBytes(receipt));
      expect(reproof.verdict).toBe("pass");
      expect(reproof.failingCheckIds).toContain(reproof.ownerCheckId);
    }

    const fixture = verificationFixture(
      packet,
      liveCatalogue(),
      Object.freeze([controlResult(missing), controlResult(uncalled)]),
    );
    const encoded = writePhase10C0VS6ApVerificationReceipt(fixture.value, packet, fixture.authority);
    const parsed = parsePhase10C0VS6PacketVerificationV2Bytes(encoded, packet, fixture.authority);
    expect(parsed.negativeControlResults).toHaveLength(2);
    expect(parsed.packageResourceAccounting.packageStorageBaselineBytes)
      .toBe(packet.resources.packageStorageBaselineBytes);

    const forged = JSON.parse(new TextDecoder().decode(encoded)) as {
      negativeControlResults: Array<{
        beforeWitness: { semanticFingerprint: { projection: unknown; sha256: string } };
      }>;
    };
    const fingerprint = forged.negativeControlResults[0]!.beforeWitness.semanticFingerprint;
    fingerprint.sha256 = sha256(textBytes(`${canonicalJson(fingerprint.projection)}\n`));
    expect(() => writePhase10C0VS6ApVerificationReceipt(forged, packet, fixture.authority))
      .toThrow(/canonical semantic projection bytes/u);
  }, 180_000);

  it("round-trips a generic mutation result with the exact no-LF canonical digest", () => {
    const packet = livePacket("c0v-aggregate");
    const physical = identity(`${packet.paths.attemptRoot}/any-layer-nonpass-control.json`);
    const beforeProjection = strictJsonSnapshot({ z: 1, nested: { y: 2, x: 3 } });
    const afterProjection = strictJsonSnapshot({ nested: { x: 4, y: 2 }, z: 1 });
    const result: Phase10C0VS6NegativeControlResult = Object.freeze({
      negativeControlId: "nc-c0v-any-layer-nonpass",
      mutationExecuted: true,
      rejected: true,
      beforeWitness: phase10C0VS6BuildMutationWitness("c0v-terminal-table", physical, beforeProjection),
      afterWitness: phase10C0VS6BuildMutationWitness("c0v-terminal-table", physical, afterProjection),
      errors: Object.freeze([]),
    });
    for (const witness of [result.beforeWitness, result.afterWitness]) {
      const noLf = sha256(textBytes(canonicalJson(witness.semanticFingerprint.projection)));
      const withLf = sha256(textBytes(`${canonicalJson(witness.semanticFingerprint.projection)}\n`));
      expect(witness.semanticFingerprint.sha256).toBe(noLf);
      expect(witness.semanticFingerprint.sha256).not.toBe(withLf);
    }
    const fixture = verificationFixture(packet, liveCatalogue(), Object.freeze([result]));
    const encoded = writePhase10C0VAggregateVerificationReceipt(fixture.value, packet, fixture.authority);
    const parsed = parsePhase10C0VS6PacketVerificationV2Bytes(encoded, packet, fixture.authority);
    expect(parsed.negativeControlResults).toEqual([result]);
  });
});
