import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE10_C0V_S6_PACKET_IDS,
  assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity,
  parsePhase10C0VS6ArtifactSchemaRegistry,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  phase10C0VS6LauncherBoundaryRequests,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  independentlyReprovePhase10C0VS6ApNegativeControl,
  independentlyVerifyPhase10C0VS6ApArtifacts,
} from "../src/phase10-c0v-s6-ap-independent.ts";
import {
  runPhase10C0VS6MissingProducerControl,
  runPhase10C0VS6UncalledCheckControl,
} from "../src/phase10-c0v-s6-ap-negative-controls.ts";
import { producePhase10C0VS6ApArtifacts, verifyPhase10C0VS6ApArtifacts } from "../src/phase10-c0v-s6-ap.ts";
import {
  phase10C0VS6ArtifactIdentity,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6AssertRuntimeEntrypointRegistration,
} from "../src/phase10-c0v-s6-import-audit.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const AUTHORITY_PATHS = Object.freeze([
  "research/phase10-c0v-s6-obligation-matrix-v1.json",
  "research/phase10-c0v-s6-schema-contracts-v1.json",
  "research/phase10-c0v-s6-artifact-schema-registry-v1.json",
  "research/phase10-execution-v2/README.md",
  "research/phase10-execution-v2/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/packets/${packetId}/callable-registry.json`,
  ]),
]);

function bytes(path: string): Buffer {
  return readFileSync(resolve(ROOT, path));
}

function json(path: string): unknown {
  return parsePhase10C0VS6PrettyJsonBytes(bytes(path), path);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

interface MutableWitness {
  byteLength: number;
  sha256: string;
  semanticFingerprint: {
    projection: unknown;
    sha256: string;
  };
}

function mutableObject(value: unknown): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error("expected mutable object");
  }
  return value as Record<string, unknown>;
}

function rehashWitness(witness: MutableWitness): void {
  const encoded = canonicalBytes(witness.semanticFingerprint.projection);
  witness.byteLength = encoded.byteLength;
  witness.sha256 = sha256(encoded);
  witness.semanticFingerprint.sha256 = sha256(encoded);
}

describe("Phase 10 C0V S6 execution-v2 authority", () => {
  it("independently closes all ten supplemental A-P graph checks", () => {
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    const negativeControlReceiptBytes = {
      missingProducer: canonicalBytes(missing),
      uncalledCheck: canonicalBytes(uncalled),
    } as const;
    const evaluation = independentlyVerifyPhase10C0VS6ApArtifacts({
      repositoryRoot: ROOT,
      requireResolvedCallables: false,
      negativeControlReceiptBytes,
    });
    expect(evaluation.aggregateVerdict).toBe("pass");
    expect(evaluation.checkResults).toHaveLength(10);
    expect(evaluation.negativeControlReproofs.map((entry) => entry.verdict)).toEqual(["pass", "pass"]);
    expect(evaluation.checkResults.every((entry) => entry.verdict === "pass")).toBe(true);
    const callerResult = verifyPhase10C0VS6ApArtifacts({
      repositoryRoot: ROOT,
      requireResolvedCallables: false,
      negativeControlReceiptBytes,
    });
    expect(callerResult.callerCallableId).toBe("phase10-a-p-c0v-s6-check-caller");
    expect(callerResult.evaluatorCallableId).toBe("phase10-a-p-c0v-s6-evaluator");
    expect(callerResult.executedCheckIds).toEqual(callerResult.evaluatedCheckIds);
    expect(callerResult.executedNegativeControlIds).toEqual([
      "nc-ap-c0v-s6-missing-producer",
      "nc-ap-c0v-s6-uncalled-check",
    ]);
    const produced = producePhase10C0VS6ApArtifacts({ repositoryRoot: ROOT, negativeControlReceiptBytes });
    expect(produced.artifactIndex.artifacts.some((entry) =>
      entry.artifactId === "out-ap-c0v-s6-missing-producer")).toBe(true);
    expect(produced.artifactIndex.artifacts.some((entry) =>
      entry.artifactId === "out-ap-c0v-s6-uncalled-check")).toBe(true);
  });

  it("rejects an aliased repository root at every supplemental A-P public entry point", () => {
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    const negativeControlReceiptBytes = {
      missingProducer: canonicalBytes(missing),
      uncalledCheck: canonicalBytes(uncalled),
    } as const;
    const temporary = mkdtempSync(join(tmpdir(), "phase10-c0v-s6-ap-alias-"));
    const alias = join(temporary, "repo-alias");
    try {
      symlinkSync(ROOT, alias, process.platform === "win32" ? "junction" : "dir");
      expect(() => runPhase10C0VS6MissingProducerControl({ repositoryRoot: alias }))
        .toThrow(/unalias/u);
      expect(() => producePhase10C0VS6ApArtifacts({
        repositoryRoot: alias,
        negativeControlReceiptBytes,
      })).toThrow(/unalias/u);
      expect(() => independentlyVerifyPhase10C0VS6ApArtifacts({
        repositoryRoot: alias,
        requireResolvedCallables: false,
        negativeControlReceiptBytes,
      })).toThrow(/unalias/u);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  it("executes the split missing-producer and uncalled-check mutations non-vacuously", () => {
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    expect(missing.refused).toBe(true);
    expect(missing.error.refusalClass).toBe("missing-producer");
    expect(missing.beforeWitness.sha256).not.toBe(missing.afterWitness.sha256);
    expect(uncalled.refused).toBe(true);
    expect(uncalled.error.refusalClass).toBe("uncalled-check");
    expect(uncalled.beforeWitness.semanticFingerprint.sha256)
      .not.toBe(uncalled.afterWitness.semanticFingerprint.sha256);
    expect(independentlyReprovePhase10C0VS6ApNegativeControl(ROOT, canonicalBytes(missing)).verdict).toBe("pass");
    expect(independentlyReprovePhase10C0VS6ApNegativeControl(ROOT, canonicalBytes(uncalled)).verdict).toBe("pass");

    const forgedMessage = clone(missing) as unknown as {
      error: { refusalClass: string; message: string };
    };
    forgedMessage.error = {
      refusalClass: forgedMessage.error.refusalClass,
      message: "mutator-authored acceptance",
    };
    expect(() => independentlyReprovePhase10C0VS6ApNegativeControl(
      ROOT,
      canonicalBytes(forgedMessage),
    )).toThrow(/owner-check refusal differs/u);

    const wrongMutation = clone(missing) as unknown as {
      beforeWitness: MutableWitness;
      afterWitness: MutableWitness;
    };
    wrongMutation.afterWitness.semanticFingerprint.projection = clone(
      wrongMutation.beforeWitness.semanticFingerprint.projection,
    );
    const wrongRegistry = mutableObject(wrongMutation.afterWitness.semanticFingerprint.projection);
    if (!Array.isArray(wrongRegistry.callables)) throw new Error("callable roster absent");
    const wrongIndex = wrongRegistry.callables.findIndex((entry) =>
      mutableObject(entry).callableId === "phase10-c0v-radial-evaluator");
    if (wrongIndex < 0) throw new Error("wrong-mutation target absent");
    wrongRegistry.callables.splice(wrongIndex, 1);
    rehashWitness(wrongMutation.afterWitness);
    expect(() => independentlyReprovePhase10C0VS6ApNegativeControl(
      ROOT,
      canonicalBytes(wrongMutation),
    )).toThrow(/embedded mutation differs/u);

    expect(() => independentlyVerifyPhase10C0VS6ApArtifacts({
      repositoryRoot: ROOT,
      requireResolvedCallables: false,
      negativeControlReceiptBytes: {
        missingProducer: canonicalBytes(uncalled),
        uncalledCheck: canonicalBytes(missing),
      },
    })).toThrow(/roles are swapped/u);
  });

  it("strict-parses the canonical graph and registers every successor output schema once", () => {
    const matrix = parsePhase10C0VS6Matrix(json(
      "research/phase10-c0v-s6-obligation-matrix-v1.json",
    ));
    const catalogue = parsePhase10C0VS6PacketCatalogue(json(
      "research/phase10-execution-v2/packet-catalogue.json",
    ));
    const schemaRegistry = parsePhase10C0VS6ArtifactSchemaRegistry(json(
      "research/phase10-c0v-s6-artifact-schema-registry-v1.json",
    ));
    assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity(schemaRegistry, matrix);
    expect(schemaRegistry.schemas).toHaveLength(5);
    expect(schemaRegistry.schemas.flatMap((entry) => entry.outputBindings)).toHaveLength(28);
    expect(catalogue.packets.map((entry) => entry.packetId)).toEqual(PHASE10_C0V_S6_PACKET_IDS);
    expect(catalogue.runtimeEntrypoints).toEqual([
      {
        role: "parent-executor",
        modulePath: "runner/src/phase10-c0v-s6-executor.ts",
        exportName: "phase10C0VS6RunExecutor",
      },
      {
        role: "worker-dispatcher",
        modulePath: "runner/src/phase10-c0v-s6-executor-worker.ts",
        exportName: "phase10C0VS6ExecutorWorker",
      },
    ]);
    expect(catalogue.runtimeLoaderContract).toEqual({
      schema: "phase10-c0v-s6-runtime-loader-contract-v1",
      execArgvRule: "parent-and-worker-process-exec-argv-exact-empty-array",
      forbiddenEnvironmentKeyRule:
        "ascii-uppercase-equals-NODE-or-TS_NODE-or-starts-NODE_-or-TS_NODE_",
      workerEnvironmentRule:
        "parent-materializes-exact-runtime-launcher-clean-environment-worker-independently-exact-compares-complete-environment-no-ambient-clone",
      preflightRecordingRule: "frozen-code-rejection-no-ambient-environment-values-serialized",
      entryObservationScopeRule: "visible-at-entry-only-self-erasing-preloads-not-excluded",
      implementationFreezeBlockerRule:
        "external-registered-pre-node-launcher-required-before-implementation-freeze",
    });
    expect(catalogue.runtimeLauncherContract).toMatchObject({
      state: "design-frozen-source-absent",
      sourcePath: "runner/native/phase10-c0v-s6-launcher.c",
      executable: {
        path: "runner/native/phase10-c0v-s6-launcher-win32-x64.exe",
        resolution: "planned",
        identity: null,
      },
      repositoryRoot: "G:/Code Files/snowflake-phase10-evidence",
      directNodeRule:
        "direct-node-entrypoints-never-authorize-run-or-evidence-marker-alone-insufficient",
      buildContract: null,
    });
    expect(catalogue.runtimeLauncherContract.launcherChannelContract).toMatchObject({
      maximumFrameBytes: 4_096,
      challengeBytes: 32,
      challengeSource: "node-crypto-randombytes-fresh-per-request",
      authenticationTimeoutMilliseconds: 30_000,
      directionRule:
        "node-stdout-request-launcher-os-nonblocking-inherited-stdin-response-per-boundary-control-open-until-release-eof",
      responseReadHandleRule:
        "launcher-to-node-response-read-end-os-nonblocking-windows-createpipe-checked-setnamedpipehandlestate-pipe-nowait-before-createprocess-posix-checked-fcntl-o-nonblock-before-exec",
      responseReadObservationRule:
        "node-polls-parent-hrtime-only-eagain-or-ewouldblock-means-no-bytes-zero-means-eof-all-other-read-errors-fail-stop",
      preRequestQueueRule:
        "before-every-request-reject-any-queued-unsolicited-byte-or-eof-eagain-or-ewouldblock-required",
      nonreleaseResponseRule:
        "after-canonical-nonrelease-response-drain-currently-queued-bytes-reject-if-nonempty-or-eof-later-bytes-rejected-before-next-boundary",
      releaseResponseRule:
        "release-success-requires-canonical-response-then-exact-eof-no-intervening-byte-under-same-request-write-to-response-and-eof-deadline",
      launcherImageRule:
        "launcher-self-opens-canonical-image-before-child-and-every-response-requires-initial-equality-reports-current-identity-parent-reopens-rehashes-and-compares-resolved-catalogue",
      outputProxyRule:
        "control-requests-consumed-no-executor-output-before-accepted-release-response-and-exact-eof-then-raw-proxy-no-further-frame-parsing",
      proxyBufferBytesMaximum: 65_536,
    });
    expect(catalogue.runtimeLauncherContract.argumentRule.vectors).toHaveLength(16);
    expect(catalogue.runtimeLauncherContract.argumentRule.vectors.map((entry) =>
      `${entry.packetId}:${entry.mode}`)).toEqual(PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) =>
      [`${packetId}:check`, `${packetId}:run`]));
    const runtimeClosurePaths = new Set<string>();
    for (const entrypoint of catalogue.runtimeEntrypoints) {
      const moduleBytes = bytes(entrypoint.modulePath);
      const audit = phase10C0VS6AssertRuntimeEntrypointRegistration(ROOT, {
        ...entrypoint,
        identity: phase10C0VS6ArtifactIdentity(entrypoint.modulePath, moduleBytes),
      });
      for (const identity of audit.closure) runtimeClosurePaths.add(identity.path);
    }
    const runtimePaths = [...runtimeClosurePaths].sort();
    const runtimeAttributes = execFileSync("git", ["check-attr", "text", "--", ...runtimePaths], {
      cwd: ROOT,
      encoding: "utf8",
    });
    for (const path of runtimePaths) {
      expect(runtimeAttributes, path).toContain(`${path}: text: unset`);
      expect(bytes(path), `${path} contains checkout-dependent CR bytes`).not.toContain(13);
    }
    expect(catalogue.workerTransportContract).toMatchObject({
      transport: "blocking-fd0-command-fd1-message-canonical-compact-jsonl",
      maximumLineBytes: 33_554_432,
      maximumStderrBytes: 33_554_432,
      bytePayloadMarkerKey: "$phase10C0VS6Bytes",
      acknowledgementRule:
        "boundary-and-artifact-callback-return-only-after-exact-scoped-parent-acknowledgement",
      retainedAuthorityRule:
        "parent-synthesizes-all-retained-time-timing-terminal-fields-child-stdout-never-authoritative",
    });
    expect(matrix.outputs.find((entry) => entry.outputId === "out-ap-c0v-s6-missing-producer")
      ?.producerCallableId).toBe("phase10-nc-a-p-c0v-s6-missing-producer");
    expect(matrix.outputs.find((entry) => entry.outputId === "out-ap-c0v-s6-uncalled-check")
      ?.producerCallableId).toBe("phase10-nc-a-p-c0v-s6-uncalled-check");

    for (const packetId of PHASE10_C0V_S6_PACKET_IDS) {
      const protocol = parsePhase10C0VS6PacketProtocol(json(
        `research/phase10-execution-v2/packets/${packetId}/protocol.json`,
      ));
      const cataloguePacket = catalogue.packets.find((entry) => entry.packetId === packetId)!;
      const registry = parsePhase10C0VS6CallableRegistry(json(
        `research/phase10-execution-v2/packets/${packetId}/callable-registry.json`,
      ));
      expect(protocol.packetId).toBe(packetId);
      expect(registry.packetId).toBe(packetId);
      expect(protocol.terminalSubroutes.every((entry) =>
        String(entry.dispositionCode) !== "retryable-infrastructure")).toBe(true);
      expect(protocol.executionRecordTuples.every((entry) =>
        String(entry.dispositionCode) !== "retryable-infrastructure")).toBe(true);
      expect(cataloguePacket.maximumStdoutBytes).toBe(4_194_304);
      expect(cataloguePacket.stdoutMessageByteBudget.derivedMaximumBytes)
        .toBeLessThanOrEqual(cataloguePacket.maximumStdoutBytes);
      if (packetId === "c0v-radial-produce") {
        expect(cataloguePacket.stdoutMessageByteBudget.boundaryOrProgressLineCountMaximum).toBe(28);
        expect(cataloguePacket.stdoutMessageByteBudget.derivedMaximumBytes).toBe(3_088_384);
      }
      expect(protocol.resources.projectedScratchBytes).toBe(
        cataloguePacket.maximumStdoutBytes +
        catalogue.workerTransportContract.maximumStderrBytes +
        cataloguePacket.maximumOtherAttemptRootBytes,
      );
      expect(phase10C0VS6LauncherBoundaryRequests(protocol, "check", null)).toEqual([
        { kind: "initial-auth", boundaryId: "entry-before-arguments" },
        { kind: "release-output", boundaryId: "release-output" },
      ]);
      for (const subroute of protocol.terminalSubroutes) {
        const requests = phase10C0VS6LauncherBoundaryRequests(protocol, "run", subroute.subrouteId);
        expect(requests[0]).toEqual({ kind: "initial-auth", boundaryId: "entry-before-arguments" });
        expect(requests.slice(1, 3).map((entry) => entry.boundaryId)).toEqual([
          `publication-stage:${protocol.paths.preflightReceiptPath}.stage-${protocol.registeredAttemptId}`,
          `publication-install:${protocol.paths.preflightReceiptPath}`,
        ]);
        expect(requests[3]).toEqual({
          kind: "boundary-recheck",
          boundaryId:
            `terminal-candidate:${protocol.paths.attemptRoot}/${protocol.registeredAttemptId}/terminal-success-candidate.json`,
        });
        expect(requests.slice(-3)).toEqual([
          { kind: "boundary-recheck", boundaryId: `cleanup-packet-lock:${protocol.paths.lockPath}` },
          { kind: "boundary-recheck", boundaryId: `cleanup-package-lock:${protocol.paths.packageLockPath}` },
          { kind: "release-output", boundaryId: "release-output" },
        ]);
        expect(new Set(requests.map((entry) => entry.boundaryId)).size).toBe(requests.length);
      }
      expect(protocol.ancestryAuthority.launchCleanObservationRule).toBe(
        "preflight-observes-empty-status-before-first-generated-write",
      );
      expect(protocol.ancestryAuthority.indexConcealmentRule).toBe(
        "git-ls-files-t-v-roster-equals-launch-head-and-every-tag-is-uppercase-H",
      );
      if (packetId === "a-p-c0v-s6") {
        expect(protocol.verificationInvocationRoster.map((entry) => entry.invocationId)).toEqual([
          "inv-a-p-c0v-s6-nc-missing-producer",
          "inv-a-p-c0v-s6-nc-uncalled-check",
          "inv-a-p-c0v-s6-producer",
          "inv-a-p-c0v-s6-check-caller",
        ]);
        expect(protocol.verificationInvocationRoster.at(-1)?.callableId).toBe(
          "phase10-a-p-c0v-s6-check-caller",
        );
      }
      const expectedVerificationOrder: Partial<Record<typeof packetId, readonly string[]>> = {
        "c0v-moving-publish": [
          "phase10-c0v-moving-publish-producer",
          "phase10-c0v-moving-publish-check-caller",
        ],
        "c0v-radial-publish": [
          "phase10-c0v-radial-publish-producer",
          "phase10-c0v-radial-publish-check-caller",
        ],
        "c0v-static-publish": [
          "phase10-c0v-static-publish-producer",
          "phase10-c0v-static-publish-check-caller",
        ],
        "c0v-aggregate": [
          "phase10-nc-c0v-any-layer-nonpass",
          "phase10-c0v-aggregate-producer",
          "phase10-c0v-aggregate-check-caller",
        ],
      };
      const expectedOrder = expectedVerificationOrder[packetId];
      if (expectedOrder !== undefined) {
        expect(protocol.verificationInvocationRoster.map((entry) => entry.callableId)).toEqual(expectedOrder);
      }
      if (packetId === "c0v-moving-produce" || packetId === "c0v-static-produce") {
        const capTupleId = packetId === "c0v-moving-produce" ? "moving-cap-cause" : "static-cap-cause";
        expect(protocol.executionRecordTuples.find((entry) => entry.tupleId === capTupleId)
          ?.record.checkCallerInvocationCount).toBe(5);
        const capCallerRows = protocol.terminalReceiptContract.callerInvocationResultRosters
          .find((entry) => entry.subrouteId === capTupleId)?.callerInvocationResults;
        expect(capCallerRows?.filter((entry) => entry.terminalState === "child-registered-cap"))
          .toHaveLength(1);
      }
      if (packetId === "c0v-radial-produce") {
        for (const capSubroute of protocol.terminalSubroutes.filter((entry) =>
          entry.dispositionCode === "registered-cap-resource-refusal")) {
          expect(capSubroute.requiredCheckIds).not.toContain("chk-c0v-radial-numeric");
          expect(capSubroute.requiredCheckIds).not.toContain("chk-c0v-radial-reference-independence");
          expect(capSubroute.requiredNegativeControlIds).toEqual([]);
          expect(protocol.terminalCandidateContract.decisionRosters.find((entry) =>
            entry.subrouteId === capSubroute.subrouteId)?.candidateExecutedNegativeControlIds).toEqual([]);
        }
      }
      if (packetId === "c0v-aggregate") {
        expect(protocol.aggregateNegativeControlContract?.filename).toBe("any-layer-nonpass-control.json");
        const aggregateInternal = new Map(protocol.internalArtifactRosters.map((entry) => [
          entry.rosterId,
          entry.relativePaths,
        ]));
        expect(aggregateInternal.get("c0v-aggregate-registered-cap-c0v-aggregate-nc-any-layer-nonpass"))
          .not.toContain("any-layer-nonpass-control.json");
        expect(aggregateInternal.get("c0v-aggregate-registered-cap-c0v-aggregate-producer"))
          .toContain("any-layer-nonpass-control.json");
        expect(registry.callables.find((entry) => entry.callableId === "phase10-c0v-aggregate-check-caller")
          ?.modulePath).toBe("runner/src/phase10-c0v-s6-aggregate-checks.ts");
      }
      for (const roster of protocol.classificationProjectionRosters) {
        for (const observation of roster.observations.filter((entry) => entry.kind === "wall-seconds")) {
          expect(observation.observedValueSource).toMatch(
            /^internal\.workerInvocations\.[a-z0-9-]+\.elapsedNanoseconds$/u,
          );
          expect(observation.observedValueDerivation).toBe(
            "elapsed-nanoseconds-divided-by-1000000000",
          );
          expect(observation.finalizedValueBinding).toMatch(
            /^(?:attempt\.executableInvocationRecords|terminalReceipt\.invocationRecords)\.[a-z0-9-]+\.wallSeconds$/u,
          );
        }
      }
    }
  });

  it("rejects forged caller-result authority and post-candidate credit in a terminal candidate", () => {
    const path = "research/phase10-execution-v2/packets/c0v-moving-produce/protocol.json";
    const raw = json(path) as {
      terminalReceiptContract: {
        callerInvocationResultRosters: Array<{
          subrouteId: string;
          callerInvocationResults: Array<{
            callerInvocationId: string;
            sourceArtifactAuthorities: Array<{
              artifactRole: string;
              artifactRelativePath: string | null;
            }>;
          }>;
        }>;
      };
      terminalCandidateContract: {
        decisionRosters: Array<{
          subrouteId: string;
          candidateCallerInvocationIds: string[];
        }>;
      };
    };
    const missing = clone(raw);
    missing.terminalReceiptContract.callerInvocationResultRosters[0]!
      .callerInvocationResults.splice(1, 1);
    expect(() => parsePhase10C0VS6PacketProtocol(missing)).toThrow(/caller count differs/u);

    const wrongSource = clone(raw);
    wrongSource.terminalReceiptContract.callerInvocationResultRosters[0]!
      .callerInvocationResults[0]!.sourceArtifactAuthorities[0]!.artifactRole =
        "internal:worker-invocations.jsonl";
    expect(() => parsePhase10C0VS6PacketProtocol(wrongSource)).toThrow(/result-source authority/u);

    const postCandidateCredit = clone(raw);
    const roster = postCandidateCredit.terminalReceiptContract.callerInvocationResultRosters[0]!;
    const candidate = postCandidateCredit.terminalCandidateContract.decisionRosters[0]!;
    candidate.candidateCallerInvocationIds.push(roster.callerInvocationResults.at(-1)!.callerInvocationId);
    expect(() => parsePhase10C0VS6PacketProtocol(postCandidateCredit))
      .toThrow(/pre-candidate caller-result subsequence/u);
  });

  it("rejects completed negative-control credit on a radial capped-control prefix", () => {
    const path = "research/phase10-execution-v2/packets/c0v-radial-produce/protocol.json";
    const raw = json(path) as {
      terminalSubroutes: Array<{
        subrouteId: string;
        requiredNegativeControlIds: string[];
        forbiddenNegativeControlIds: string[];
      }>;
      terminalCandidateContract: {
        decisionRosters: Array<{
          subrouteId: string;
          candidateExecutedNegativeControlIds: string[];
        }>;
      };
    };
    const forged = clone(raw);
    const subroute = forged.terminalSubroutes.find((entry) =>
      entry.subrouteId === "radial-cap-nc-forged-summary")!;
    subroute.requiredNegativeControlIds = ["nc-radial-finite-shell-term"];
    subroute.forbiddenNegativeControlIds = subroute.forbiddenNegativeControlIds.filter((entry) =>
      entry !== "nc-radial-finite-shell-term");
    forged.terminalCandidateContract.decisionRosters.find((entry) =>
      entry.subrouteId === subroute.subrouteId)!.candidateExecutedNegativeControlIds = [
      "nc-radial-finite-shell-term",
    ];
    expect(() => parsePhase10C0VS6PacketProtocol(forged))
      .toThrow(/completed negative-control credit only after the full production campaign/u);
  });

  it("binds the live successor schema bytes from both registry and matrix", () => {
    const rawMatrix = json("research/phase10-c0v-s6-obligation-matrix-v1.json") as {
      bindings: Record<string, { path: string; byteLength: number; sha256: string }>;
    };
    for (const bindingName of ["successorSchemaRegistry", "successorSchemaContracts"] as const) {
      const identity = rawMatrix.bindings[bindingName]!;
      const artifact = bytes(identity.path);
      expect(identity.byteLength).toBe(artifact.byteLength);
      expect(identity.sha256).toBe(sha256(artifact));
    }
  });

  it("rejects omitted schema bindings and cross-packet catalogue paths", () => {
    const rawRegistry = json("research/phase10-c0v-s6-artifact-schema-registry-v1.json") as {
      schemas: Array<{ outputBindings: unknown[] }>;
    };
    const omitted = clone(rawRegistry);
    omitted.schemas[0]!.outputBindings.pop();
    expect(() => parsePhase10C0VS6ArtifactSchemaRegistry(omitted)).toThrow(/omits|differs/u);

    const rawCatalogue = json("research/phase10-execution-v2/packet-catalogue.json") as {
      packageLockPath: string;
      runtimeEntrypoints: Array<{ role: string; modulePath: string; exportName: string }>;
      runtimeLauncherContract: {
        state: string;
        executable: { resolution: string; identity: unknown };
        cleanEnvironment: Array<{ key: string; value: string }>;
        launcherChannelContract: {
          challengeSource: string;
          directionRule: string;
          responseReadHandleRule: string;
          responseReadObservationRule: string;
          preRequestQueueRule: string;
          nonreleaseResponseRule: string;
          releaseResponseRule: string;
          parentBindingRule: string;
          launcherImageRule: string;
          authenticationTimeoutMilliseconds: number;
          authenticationTimingRule: string;
          requestKinds: string[];
          boundaryCountRule: string;
          outputProxyRule: string;
          proxyBufferBytesMaximum: number;
        };
        argumentRule: {
          vectors: Array<{
            mode: string;
            packetId: string;
            protocolPath: string;
            attemptId: string;
            launcherArguments: string[];
            childArguments: string[];
          }>;
        };
        directNodeRule: string;
        buildContract: unknown;
      };
      runtimeLoaderContract: {
        execArgvRule: string;
        forbiddenEnvironmentKeyRule: string;
        workerEnvironmentRule: string;
        entryObservationScopeRule: string;
        implementationFreezeBlockerRule: string;
      };
      workerTransportContract: {
        maximumLineBytes: number;
        maximumStderrBytes: number;
        bytePayloadMarkerKey: string;
        childToParent: { nullabilityRule: string };
      };
      packets: Array<{
        attemptRoot: string;
        lockPath: string;
        maximumStdoutBytes: number;
        maximumOtherAttemptRootBytes: number;
        stdoutMessageByteBudget: {
          boundaryOrProgressLineCountMaximum: number;
          resultLineBytesMaximum: number;
          derivedMaximumBytes: number;
        };
      }>;
    };
    const swappedRuntimeEntrypoints = clone(rawCatalogue);
    swappedRuntimeEntrypoints.runtimeEntrypoints.reverse();
    expect(() => parsePhase10C0VS6PacketCatalogue(swappedRuntimeEntrypoints))
      .toThrow(/parent-executor then worker-dispatcher/u);
    const wrongWorkerExport = clone(rawCatalogue);
    wrongWorkerExport.runtimeEntrypoints[1]!.exportName = "phase10C0VS6ParseWorkerArguments";
    expect(() => parsePhase10C0VS6PacketCatalogue(wrongWorkerExport))
      .toThrow(/parent-executor then worker-dispatcher/u);
    const forgedMarkerAuthority = clone(rawCatalogue);
    forgedMarkerAuthority.runtimeLauncherContract.directNodeRule =
      "environment-marker-authorizes-direct-node";
    expect(() => parsePhase10C0VS6PacketCatalogue(forgedMarkerAuthority))
      .toThrow(/directNodeRule/u);
    const unauthenticatedChannel = clone(rawCatalogue);
    unauthenticatedChannel.runtimeLauncherContract.launcherChannelContract.parentBindingRule =
      "trust-environment-marker";
    expect(() => parsePhase10C0VS6PacketCatalogue(unauthenticatedChannel))
      .toThrow(/parentBindingRule/u);
    const selfReferentialImage = clone(rawCatalogue);
    selfReferentialImage.runtimeLauncherContract.launcherChannelContract.launcherImageRule =
      "launcher-embeds-and-self-verifies-final-executable-sha256";
    expect(() => parsePhase10C0VS6PacketCatalogue(selfReferentialImage))
      .toThrow(/launcherImageRule/u);
    const hiddenAuthenticationTimeout = clone(rawCatalogue);
    hiddenAuthenticationTimeout.runtimeLauncherContract.launcherChannelContract
      .authenticationTimeoutMilliseconds = 30_001;
    expect(() => parsePhase10C0VS6PacketCatalogue(hiddenAuthenticationTimeout))
      .toThrow(/authenticationTimeoutMilliseconds|timing/u);
    const blockingResponseRead = clone(rawCatalogue);
    blockingResponseRead.runtimeLauncherContract.launcherChannelContract.responseReadHandleRule =
      "launcher-to-node-response-read-end-blocking";
    expect(() => parsePhase10C0VS6PacketCatalogue(blockingResponseRead))
      .toThrow(/responseReadHandleRule/u);
    const eofAsNoBytes = clone(rawCatalogue);
    eofAsNoBytes.runtimeLauncherContract.launcherChannelContract.responseReadObservationRule =
      "zero-eagain-ewouldblock-all-mean-no-bytes";
    expect(() => parsePhase10C0VS6PacketCatalogue(eofAsNoBytes))
      .toThrow(/responseReadObservationRule/u);
    const queuedBytesAccepted = clone(rawCatalogue);
    queuedBytesAccepted.runtimeLauncherContract.launcherChannelContract.preRequestQueueRule =
      "queued-unsolicited-bytes-ignored";
    expect(() => parsePhase10C0VS6PacketCatalogue(queuedBytesAccepted))
      .toThrow(/preRequestQueueRule/u);
    const nonreleaseExtraBytesAccepted = clone(rawCatalogue);
    nonreleaseExtraBytesAccepted.runtimeLauncherContract.launcherChannelContract
      .nonreleaseResponseRule = "canonical-response-accepts-trailing-bytes";
    expect(() => parsePhase10C0VS6PacketCatalogue(nonreleaseExtraBytesAccepted))
      .toThrow(/nonreleaseResponseRule/u);
    const releaseSeparateEofDeadline = clone(rawCatalogue);
    releaseSeparateEofDeadline.runtimeLauncherContract.launcherChannelContract
      .releaseResponseRule = "canonical-response-then-unbounded-eof-wait";
    expect(() => parsePhase10C0VS6PacketCatalogue(releaseSeparateEofDeadline))
      .toThrow(/releaseResponseRule/u);
    const responseOnlyDeadline = clone(rawCatalogue);
    responseOnlyDeadline.runtimeLauncherContract.launcherChannelContract.authenticationTimingRule =
      "request-write-to-response-only";
    expect(() => parsePhase10C0VS6PacketCatalogue(responseOnlyDeadline))
      .toThrow(/authenticationTimingRule/u);
    const reusedChallenge = clone(rawCatalogue);
    reusedChallenge.runtimeLauncherContract.launcherChannelContract.challengeSource =
      "node-crypto-randombytes-fresh-per-process";
    expect(() => parsePhase10C0VS6PacketCatalogue(reusedChallenge))
      .toThrow(/challengeSource/u);
    const missingCleanupRecheck = clone(rawCatalogue);
    missingCleanupRecheck.runtimeLauncherContract.launcherChannelContract.boundaryCountRule =
      "initial-and-release-only";
    expect(() => parsePhase10C0VS6PacketCatalogue(missingCleanupRecheck))
      .toThrow(/boundaryCountRule/u);
    const missingOutputRelease = clone(rawCatalogue);
    missingOutputRelease.runtimeLauncherContract.launcherChannelContract.requestKinds.pop();
    expect(() => parsePhase10C0VS6PacketCatalogue(missingOutputRelease))
      .toThrow(/requestKinds/u);
    const parsedExecutorOutput = clone(rawCatalogue);
    parsedExecutorOutput.runtimeLauncherContract.launcherChannelContract.outputProxyRule =
      "parse-every-stdout-line-as-launcher-frame";
    expect(() => parsePhase10C0VS6PacketCatalogue(parsedExecutorOutput))
      .toThrow(/outputProxyRule/u);
    const unboundedProxy = clone(rawCatalogue);
    unboundedProxy.runtimeLauncherContract.launcherChannelContract.proxyBufferBytesMaximum =
      Number.MAX_SAFE_INTEGER;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedProxy))
      .toThrow(/proxyBufferBytesMaximum|proxy/u);
    const swappedLauncherVector = clone(rawCatalogue);
    swappedLauncherVector.runtimeLauncherContract.argumentRule.vectors.reverse();
    expect(() => parsePhase10C0VS6PacketCatalogue(swappedLauncherVector))
      .toThrow(/argumentRule\.vectors/u);
    const prematurelyResolvedLauncher = clone(rawCatalogue);
    prematurelyResolvedLauncher.runtimeLauncherContract.executable.resolution = "resolved";
    expect(() => parsePhase10C0VS6PacketCatalogue(prematurelyResolvedLauncher))
      .toThrow(/executable\.resolution/u);
    const inheritedExecArgv = clone(rawCatalogue);
    inheritedExecArgv.runtimeLoaderContract.execArgvRule = "allow-parent-loader";
    expect(() => parsePhase10C0VS6PacketCatalogue(inheritedExecArgv)).toThrow(/execArgvRule/u);
    const weakenedEnvironmentRule = clone(rawCatalogue);
    weakenedEnvironmentRule.runtimeLoaderContract.forbiddenEnvironmentKeyRule =
      "reject-NODE_OPTIONS-only";
    expect(() => parsePhase10C0VS6PacketCatalogue(weakenedEnvironmentRule))
      .toThrow(/forbiddenEnvironmentKeyRule/u);
    const ambientCloneWorkerEnvironment = clone(rawCatalogue);
    ambientCloneWorkerEnvironment.runtimeLoaderContract.workerEnvironmentRule =
      "parent-clones-environment-removes-forbidden-keys-worker-independently-rejects-remnants";
    expect(() => parsePhase10C0VS6PacketCatalogue(ambientCloneWorkerEnvironment))
      .toThrow(/workerEnvironmentRule/u);
    const falsePreloadExclusion = clone(rawCatalogue);
    falsePreloadExclusion.runtimeLoaderContract.entryObservationScopeRule =
      "all-pre-entry-loaders-excluded";
    expect(() => parsePhase10C0VS6PacketCatalogue(falsePreloadExclusion))
      .toThrow(/entryObservationScopeRule/u);
    const omittedLauncherBlocker = clone(rawCatalogue);
    omittedLauncherBlocker.runtimeLoaderContract.implementationFreezeBlockerRule =
      "in-process-check-is-sufficient";
    expect(() => parsePhase10C0VS6PacketCatalogue(omittedLauncherBlocker))
      .toThrow(/implementationFreezeBlockerRule/u);
    const wrongWireMarker = clone(rawCatalogue);
    wrongWireMarker.workerTransportContract.bytePayloadMarkerKey = "$bytes";
    expect(() => parsePhase10C0VS6PacketCatalogue(wrongWireMarker)).toThrow(/bytePayloadMarkerKey/u);
    const wrongWireNullability = clone(rawCatalogue);
    wrongWireNullability.workerTransportContract.childToParent.nullabilityRule =
      "ready-stopped-both-null";
    expect(() => parsePhase10C0VS6PacketCatalogue(wrongWireNullability)).toThrow(/nullabilityRule/u);
    const unboundedWire = clone(rawCatalogue);
    unboundedWire.workerTransportContract.maximumLineBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedWire)).toThrow(/maximumLineBytes/u);
    const unboundedStderr = clone(rawCatalogue);
    unboundedStderr.workerTransportContract.maximumStderrBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedStderr)).toThrow(/maximumStderrBytes/u);
    const unboundedStdout = clone(rawCatalogue);
    unboundedStdout.packets[0]!.maximumStdoutBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedStdout)).toThrow(/mapping/u);
    const unboundedOtherAttemptRoot = clone(rawCatalogue);
    unboundedOtherAttemptRoot.packets[0]!.maximumOtherAttemptRootBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedOtherAttemptRoot)).toThrow(/mapping/u);
    const oversizedResultShape = clone(rawCatalogue);
    oversizedResultShape.packets[0]!.stdoutMessageByteBudget.resultLineBytesMaximum += 1;
    oversizedResultShape.packets[0]!.stdoutMessageByteBudget.derivedMaximumBytes += 4;
    expect(() => parsePhase10C0VS6PacketCatalogue(oversizedResultShape))
      .toThrow(/stdoutMessageByteBudget/u);
    const radialBudgetPlusOne = clone(rawCatalogue);
    const radialPlusOne = radialBudgetPlusOne.packets.find((entry) =>
      entry.attemptRoot.endsWith("/c0v-radial-produce"))!;
    radialPlusOne.stdoutMessageByteBudget.derivedMaximumBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(radialBudgetPlusOne))
      .toThrow(/stdoutMessageByteBudget/u);
    const radialCountSubstitution = clone(rawCatalogue);
    const radialSubstitution = radialCountSubstitution.packets.find((entry) =>
      entry.attemptRoot.endsWith("/c0v-radial-produce"))!;
    radialSubstitution.stdoutMessageByteBudget.boundaryOrProgressLineCountMaximum = 29;
    radialSubstitution.stdoutMessageByteBudget.derivedMaximumBytes += 16_384;
    expect(() => parsePhase10C0VS6PacketCatalogue(radialCountSubstitution))
      .toThrow(/stdoutMessageByteBudget/u);
    const duplicateRoot = clone(rawCatalogue);
    duplicateRoot.packets[1]!.attemptRoot = duplicateRoot.packets[0]!.attemptRoot;
    expect(() => parsePhase10C0VS6PacketCatalogue(duplicateRoot)).toThrow(/mapping|unique/u);
    const swappedLock = clone(rawCatalogue);
    [swappedLock.packets[1]!.lockPath, swappedLock.packets[2]!.lockPath] = [
      swappedLock.packets[2]!.lockPath,
      swappedLock.packets[1]!.lockPath,
    ];
    expect(() => parsePhase10C0VS6PacketCatalogue(swappedLock)).toThrow(/mapping/u);
    const collidedPackageLock = clone(rawCatalogue);
    collidedPackageLock.packageLockPath = collidedPackageLock.packets[0]!.lockPath;
    expect(() => parsePhase10C0VS6PacketCatalogue(collidedPackageLock)).toThrow(/packageLockPath/u);

    const rawProtocol = json(
      "research/phase10-execution-v2/packets/a-p-c0v-s6/protocol.json",
    ) as {
      launcherBoundaryContract: {
        checkRequests: Array<{ kind: string; boundaryId: string }>;
        failureRule: string;
        runRosters: Array<{
          subrouteId: string;
          requests: Array<{ kind: string; boundaryId: string }>;
        }>;
      };
      verification: { executionProvenanceRule: string };
      paths: {
        attemptRoot: string;
        allowedPublicationPaths: string[];
        publicationStagingPaths: Array<{ finalPath: string; stagingPath: string }>;
      };
    };
    const duplicateFinal = clone(rawProtocol);
    duplicateFinal.paths.allowedPublicationPaths[1] = duplicateFinal.paths.allowedPublicationPaths[0]!;
    expect(() => parsePhase10C0VS6PacketProtocol(duplicateFinal)).toThrow(/unique values/u);
    const attemptRootStage = clone(rawProtocol);
    attemptRootStage.paths.publicationStagingPaths[0]!.stagingPath =
      `${attemptRootStage.paths.attemptRoot}/forbidden.stage`;
    expect(() => parsePhase10C0VS6PacketProtocol(attemptRootStage)).toThrow(/sibling stage/u);
    const omittedTerminalCandidateBoundary = clone(rawProtocol);
    omittedTerminalCandidateBoundary.launcherBoundaryContract.runRosters[0]!.requests.splice(3, 1);
    expect(() => parsePhase10C0VS6PacketProtocol(omittedTerminalCandidateBoundary))
      .toThrow(/launcherBoundaryContract.*outcome-selected/u);
    const swappedStageInstallBoundary = clone(rawProtocol);
    const requests = swappedStageInstallBoundary.launcherBoundaryContract.runRosters[0]!.requests;
    [requests[1], requests[2]] = [requests[2]!, requests[1]!];
    expect(() => parsePhase10C0VS6PacketProtocol(swappedStageInstallBoundary))
      .toThrow(/launcherBoundaryContract.*outcome-selected/u);
    const wrongCleanupPath = clone(rawProtocol);
    wrongCleanupPath.launcherBoundaryContract.runRosters[0]!.requests.at(-3)!.boundaryId =
      "cleanup-packet-lock:out/phase10-execution-v2/locks/other.lock";
    expect(() => parsePhase10C0VS6PacketProtocol(wrongCleanupPath))
      .toThrow(/launcherBoundaryContract.*outcome-selected/u);
    const prematureRelease = clone(rawProtocol);
    const release = prematureRelease.launcherBoundaryContract.runRosters[0]!.requests.pop()!;
    prematureRelease.launcherBoundaryContract.runRosters[0]!.requests.splice(4, 0, release);
    expect(() => parsePhase10C0VS6PacketProtocol(prematureRelease))
      .toThrow(/launcherBoundaryContract.*outcome-selected/u);
    const extraCheckBoundary = clone(rawProtocol);
    extraCheckBoundary.launcherBoundaryContract.checkRequests.splice(1, 0, {
      kind: "boundary-recheck",
      boundaryId: "unregistered-check-boundary",
    });
    expect(() => parsePhase10C0VS6PacketProtocol(extraCheckBoundary))
      .toThrow(/checkRequests/u);
    const failOpenPrefix = clone(rawProtocol);
    failOpenPrefix.launcherBoundaryContract.failureRule =
      "failure-may-skip-boundaries-and-release-output";
    expect(() => parsePhase10C0VS6PacketProtocol(failOpenPrefix))
      .toThrow(/failureRule/u);
    const fabricatedRefusalExecution = clone(rawProtocol);
    fabricatedRefusalExecution.verification.executionProvenanceRule =
      "always-copy-a-completed-evaluator-interval";
    expect(() => parsePhase10C0VS6PacketProtocol(fabricatedRefusalExecution))
      .toThrow(/executionProvenanceRule/u);

    const rawRadialProtocol = json(
      "research/phase10-execution-v2/packets/c0v-radial-produce/protocol.json",
    ) as {
      workerProgressContract: {
        eventStateTransitions: Array<{ transitionId: string; caseRule: string }>;
      };
    };
    for (const transitionId of ["invocation-finished", "worker-stopped"]) {
      expect(rawRadialProtocol.workerProgressContract.eventStateTransitions.find((entry) =>
        entry.transitionId === transitionId)?.caseRule)
        .toBe("case-id-null-started-completed-active-and-cumulative-progress-preserved");
    }
    const erasedMidCaseProgress = clone(rawRadialProtocol);
    erasedMidCaseProgress.workerProgressContract.eventStateTransitions.find((entry) =>
      entry.transitionId === "invocation-finished")!.caseRule = "case-id-null-active-null";
    expect(() => parsePhase10C0VS6PacketProtocol(erasedMidCaseProgress))
      .toThrow(/workerProgressContract.*caseRule/u);
  });

  it("rejects cyclic cap sources and missing raw-to-final joins", () => {
    const path = "research/phase10-execution-v2/packets/c0v-radial-produce/protocol.json";
    const raw = json(path) as {
      classificationProjectionRosters: Array<{
        observations: Array<{
          kind: string;
          observedValueSource: string;
          observedValueDerivation: string;
          finalizedValueBinding: string | null;
        }>;
      }>;
    };
    const observation = raw.classificationProjectionRosters
      .flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!;
    const cyclic = clone(raw);
    cyclic.classificationProjectionRosters.flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!.observedValueSource =
        observation.finalizedValueBinding!;
    expect(() => parsePhase10C0VS6PacketProtocol(cyclic)).toThrow(/raw route projection/u);
    const wallClockDerived = clone(raw);
    wallClockDerived.classificationProjectionRosters.flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!.observedValueDerivation = "identity";
    expect(() => parsePhase10C0VS6PacketProtocol(wallClockDerived)).toThrow(/raw route projection/u);
    const unbound = clone(raw);
    unbound.classificationProjectionRosters.flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!.finalizedValueBinding = null;
    expect(() => parsePhase10C0VS6PacketProtocol(unbound)).toThrow(/raw route projection/u);
  });

  it("keeps every authority path unignored and byte-stable on checkout", () => {
    for (const path of AUTHORITY_PATHS) {
      const ignored = spawnSync("git", ["check-ignore", "-q", "--", path], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(ignored.status, path).toBe(1);
    }
    const output = execFileSync("git", ["check-attr", "text", "--", ...AUTHORITY_PATHS], {
      cwd: ROOT,
      encoding: "utf8",
    });
    for (const path of AUTHORITY_PATHS) {
      expect(output).toContain(`${path}: text: unset`);
    }
  });
});
