import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  independentlyReopenPhase10C0VS6HistoricalTerminalCandidate,
  phase10C0VS6ResolveRegisteredWholeFilePublicationPath,
} from
  "../src/phase10-c0v-s6-lifecycle.ts";
import { phase10C0VS6ArtifactIdentity } from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  derivePhase10C0VS6HistoricalRetainedRuntimeAuthority,
  derivePhase10C0VS6RetainedRuntimeAuthority,
} from "../src/phase10-c0v-s6-runtime-authority.ts";

type ResolverPacket = Parameters<typeof phase10C0VS6ResolveRegisteredWholeFilePublicationPath>[0];

const AP_OVERLAY_ROWS = Object.freeze([
  Object.freeze({
    outputId: "out-ap-c0v-s6-artifact-index",
    matrixPath: "evidence/phase10-obligation-preflight-v2/artifact-index.json",
    currentPath: "evidence/phase10-obligation-preflight-v6/artifact-index.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-missing-producer",
    matrixPath: "evidence/phase10-obligation-preflight-v2/missing-producer.json",
    currentPath: "evidence/phase10-obligation-preflight-v6/missing-producer.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-preflight",
    matrixPath: "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/preflight.json",
    currentPath: "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/preflight.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-terminal-receipt",
    matrixPath:
      "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/terminal-receipt.json",
    currentPath:
      "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-uncalled-check",
    matrixPath: "evidence/phase10-obligation-preflight-v2/uncalled-check.json",
    currentPath: "evidence/phase10-obligation-preflight-v6/uncalled-check.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-verification",
    matrixPath: "evidence/phase10-obligation-preflight-v2/verification.json",
    currentPath: "evidence/phase10-obligation-preflight-v6/verification.json",
  }),
] as const);
const ROOT = resolve(import.meta.dirname, "../..");

function packet(
  packetId: ResolverPacket["packetId"],
  allowedPublicationPaths: readonly string[],
): ResolverPacket {
  return Object.freeze({
    packetId,
    paths: Object.freeze({ allowedPublicationPaths: Object.freeze([...allowedPublicationPaths]) }),
  });
}

describe("Phase 10 C0V S6 lifecycle whole-file publication overlay", () => {
  it("reopens the accepted A-P lifecycle through its retained recovery-v5 protocol only", () => {
    const protocolPath =
      "research/phase10-execution-v2/recovery-v5/packets/a-p-c0v-s6/protocol.json";
    const preflightPath =
      "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/preflight.json";
    const protocolBytes = new Uint8Array(readFileSync(resolve(ROOT, protocolPath)));
    const input = Object.freeze({
      repositoryRoot: ROOT,
      packetProtocolIdentity: phase10C0VS6ArtifactIdentity(protocolPath, protocolBytes),
      packetProtocolBytes: protocolBytes,
      preflightBytes: new Uint8Array(readFileSync(resolve(ROOT, preflightPath))),
    });
    expect(() => derivePhase10C0VS6RetainedRuntimeAuthority(input))
      .toThrow(/current recovery-v8 packet protocol identity path differs/u);
    const retained = derivePhase10C0VS6HistoricalRetainedRuntimeAuthority(input);
    expect(retained.packet.packetId).toBe("a-p-c0v-s6");
    expect(retained.packet.registeredAttemptId).toBe("a-p-c0v-s6-20260822-v6");
    expect(retained.preflight.observed.packetProtocol).toEqual(input.packetProtocolIdentity);
    const candidate = independentlyReopenPhase10C0VS6HistoricalTerminalCandidate(input);
    expect(candidate.lifecycle.packet.protocolId)
      .toBe("phase10-a-p-c0v-s6-execution-v2-recovery-v5");
    expect(candidate.lifecycle.preflight.observed.packetProtocol).toEqual(input.packetProtocolIdentity);
    expect(candidate.lifecycle.selectedSubrouteId).toBe("a-p-c0v-s6-structural-complete");
  }, 600_000);

  it("resolves every exact immutable A-P v2 row to its fresh v6 publication path", () => {
    const authority = packet("a-p-c0v-s6", AP_OVERLAY_ROWS.map((entry) => entry.currentPath));
    for (const row of AP_OVERLAY_ROWS) {
      expect(phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
        authority,
        row.outputId,
        row.matrixPath,
      )).toBe(row.currentPath);
    }
  });

  it("rejects swapped matrix rows, unknown A-P output IDs, and wrong current registrations", () => {
    const exact = packet("a-p-c0v-s6", AP_OVERLAY_ROWS.map((entry) => entry.currentPath));
    expect(() => phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
      exact,
      AP_OVERLAY_ROWS[0].outputId,
      AP_OVERLAY_ROWS[1].matrixPath,
    )).toThrow(/does not resolve one registered whole-file publication path/u);
    expect(() => phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
      exact,
      "out-ap-c0v-s6-forged",
      AP_OVERLAY_ROWS[0].matrixPath,
    )).toThrow(/does not resolve one registered whole-file publication path/u);

    const wrongCurrent = packet(
      "a-p-c0v-s6",
      AP_OVERLAY_ROWS.slice(1).map((entry) => entry.currentPath),
    );
    expect(() => phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
      wrongCurrent,
      AP_OVERLAY_ROWS[0].outputId,
      AP_OVERLAY_ROWS[0].matrixPath,
    )).toThrow(/does not resolve one registered whole-file publication path/u);

    const swappedCurrentRoster = AP_OVERLAY_ROWS.map((entry) => entry.currentPath);
    [swappedCurrentRoster[0], swappedCurrentRoster[1]] =
      [swappedCurrentRoster[1]!, swappedCurrentRoster[0]!];
    expect(() => phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
      packet("a-p-c0v-s6", swappedCurrentRoster),
      AP_OVERLAY_ROWS[0].outputId,
      AP_OVERLAY_ROWS[0].matrixPath,
    )).toThrow(/does not resolve one registered whole-file publication path/u);
  });

  it("preserves exact non-A-P matrix paths and rejects a protocol mismatch", () => {
    const matrixPath = "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json";
    expect(phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
      packet("c0v-moving-produce", [matrixPath]),
      "out-c0v-moving-reference",
      matrixPath,
    )).toBe(matrixPath);
    expect(() => phase10C0VS6ResolveRegisteredWholeFilePublicationPath(
      packet("c0v-moving-produce", ["evidence/phase10-numerical-verification-v1/wrong.json"]),
      "out-c0v-moving-reference",
      matrixPath,
    )).toThrow(/does not resolve one registered whole-file publication path/u);
  });
});
