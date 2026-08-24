import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6RetainedPreflight,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6ValidateRadialControlArtifact,
  phase10C0VS6ValidateRadialProductionBoundary,
} from "../src/phase10-c0v-s6-executor.ts";

const protocolPath = "research/phase10-execution-v2/recovery-v1/packets/c0v-radial-produce/protocol.json";
const packet = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
  new Uint8Array(readFileSync(resolve(process.cwd(), protocolPath))),
  "radial parent test protocol",
));
const candidateDirectory =
  "out/phase10-execution-v2/recovery-v1/attempts/c0v-radial-produce/" +
  "c0v-radial-produce-20260822-v1/candidate";
const preflight = Object.freeze({
  observed: Object.freeze({ candidateDirectory }),
}) as Phase10C0VS6RetainedPreflight;

describe("Phase 10 C0V S6 radial parent wire authority", () => {
  it("accepts only the alternating four-case production boundary roster", () => {
    const progress = packet.workerProgressContract;
    if (progress === null) throw new Error("radial test protocol lacks progress authority");
    for (const [caseIndex, caseId] of progress.caseOrder.entries()) {
      for (const [stageIndex, stage] of (["start", "complete"] as const).entries()) {
        expect(phase10C0VS6ValidateRadialProductionBoundary(
          packet,
          caseIndex * 2 + stageIndex,
          Object.freeze({
            stage,
            caseIndex,
            caseId,
            expectedNodeCount: progress.completedFieldValueCounts[caseIndex],
          }),
        )).toEqual({
          stage,
          caseIndex,
          caseId,
          expectedNodeCount: progress.completedFieldValueCounts[caseIndex],
        });
      }
    }

    expect(() => phase10C0VS6ValidateRadialProductionBoundary(packet, 0, Object.freeze({
      stage: "complete",
      caseIndex: 0,
      caseId: progress.caseOrder[0],
      expectedNodeCount: progress.completedFieldValueCounts[0],
    }))).toThrow(/protocol order/u);
    expect(() => phase10C0VS6ValidateRadialProductionBoundary(packet, 0, Object.freeze({
      stage: "start",
      caseIndex: 0,
      caseId: progress.caseOrder[1],
      expectedNodeCount: progress.completedFieldValueCounts[0],
    }))).toThrow(/protocol order/u);
  });

  it("binds each acknowledged control artifact to its exact retained path and bytes", () => {
    const bytes = new Uint8Array([2, 3, 5, 7, 11]);
    const path = `${candidateDirectory}/nc-radial-finite-shell-term-witness.bin`;
    const identity = phase10C0VS6ArtifactIdentity(path, bytes);
    const artifact = Object.freeze({
      negativeControlId: "nc-radial-finite-shell-term",
      artifactKind: "mutated-witness",
      identity,
      bytes,
    });
    expect(phase10C0VS6ValidateRadialControlArtifact(preflight, 0, artifact)).toEqual(artifact);

    expect(() => phase10C0VS6ValidateRadialControlArtifact(preflight, 0, Object.freeze({
      ...artifact,
      identity: Object.freeze({ ...identity, sha256: "0".repeat(64) }),
    }))).toThrow(/artifact bytes/u);
    expect(() => phase10C0VS6ValidateRadialControlArtifact(preflight, 1, artifact))
      .toThrow(/artifact authority/u);
  });
});
