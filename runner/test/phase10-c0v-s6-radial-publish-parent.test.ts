import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6RetainedPreflight,
} from "../src/phase10-c0v-s6-contracts.ts";
import { phase10C0VS6PrettyJsonBytes } from "../src/phase10-c0v-s6-execution-contracts.ts";
import { phase10C0VS6ValidateRadialPublishInvocationResult } from "../src/phase10-c0v-s6-executor.ts";

const protocolPath = "research/phase10-execution-v2/recovery-v1/packets/c0v-radial-publish/protocol.json";
const packet = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
  new Uint8Array(readFileSync(resolve(process.cwd(), protocolPath))),
  "radial-publish parent test protocol",
));
const candidateDirectory =
  "out/phase10-execution-v2/recovery-v1/attempts/c0v-radial-publish/" +
  "c0v-radial-publish-20260822-v1/candidate";
const preflight = Object.freeze({
  observed: Object.freeze({ candidateDirectory }),
}) as Phase10C0VS6RetainedPreflight;
const completeRoute = (() => {
  const found = packet.terminalSubroutes.find((entry) => entry.dispositionCode === null);
  if (found === undefined) throw new Error("radial-publish test protocol lacks its complete route");
  return found;
})();

function producerResult(): Readonly<Record<string, unknown>> {
  const result = Object.freeze({
    schema: "phase10-c0v-radial-result-v2",
    resultId: "c0v-radial-result-v2",
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    terminalStatus: "pass",
    scientificDisposition: "pass",
  });
  const artifactIndex = Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([]),
  });
  return Object.freeze({
    packetId: packet.packetId,
    result,
    artifactIndex,
    bytes: Object.freeze({
      result: phase10C0VS6PrettyJsonBytes(result),
      artifactIndex: phase10C0VS6PrettyJsonBytes(artifactIndex),
    }),
  });
}

function callerResult(producer: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schema: "phase10-c0v-publication-check-caller-result-v1",
    packetId: packet.packetId,
    callerCallableId: "phase10-c0v-radial-publish-check-caller",
    evaluatorCallableId: "phase10-c0v-radial-publication-verifier",
    evaluation: Object.freeze({
      schema: "phase10-c0v-publication-evaluation-v1",
      packetId: packet.packetId,
      evaluatorCallableId: "phase10-c0v-radial-publication-verifier",
      selectedAttempt: Object.freeze({}),
      result: producer.result,
      artifactIndex: producer.artifactIndex,
      resultIdentity: Object.freeze({}),
      artifactIndexIdentity: Object.freeze({}),
      checkResults: Object.freeze([]),
      aggregateVerdict: "pass",
    }),
    executedCheckIds: completeRoute.requiredCheckIds,
    evaluatedCheckIds: completeRoute.requiredCheckIds,
    executedNegativeControlIds: completeRoute.requiredNegativeControlIds,
  });
}

describe("Phase 10 C0V S6 radial-publish parent wire authority", () => {
  it("binds the producer bytes before accepting the governed publication caller", () => {
    const producer = producerResult();
    const capture = phase10C0VS6ValidateRadialPublishInvocationResult(
      packet,
      preflight,
      "inv-c0v-radial-publish-producer",
      producer,
      new Map(),
    );
    const results = new Map<string, unknown>([["inv-c0v-radial-publish-producer", capture]]);
    expect(phase10C0VS6ValidateRadialPublishInvocationResult(
      packet,
      preflight,
      "inv-c0v-radial-publish-check-caller",
      callerResult(producer),
      results,
    )).toMatchObject({
      schema: "phase10-c0v-publication-check-caller-result-v1",
      packetId: "c0v-radial-publish",
      evaluatorCallableId: "phase10-c0v-radial-publication-verifier",
    });
  });

  it("rejects scope drift, byte drift, and a caller that precedes its producer", () => {
    const producer = producerResult();
    expect(() => phase10C0VS6ValidateRadialPublishInvocationResult(
      packet,
      preflight,
      "inv-c0v-radial-publish-producer",
      Object.freeze({
        ...producer,
        result: Object.freeze({ ...(producer.result as object), layerId: "C0V-MOVING-EVENT" }),
      }),
      new Map(),
    )).toThrow(/wire\/bytes projection/u);

    expect(() => phase10C0VS6ValidateRadialPublishInvocationResult(
      packet,
      preflight,
      "inv-c0v-radial-publish-producer",
      Object.freeze({
        ...producer,
        bytes: Object.freeze({
          ...(producer.bytes as object),
          result: new Uint8Array([1]),
        }),
      }),
      new Map(),
    )).toThrow(/valid JSON|wire\/bytes projection/u);

    expect(() => phase10C0VS6ValidateRadialPublishInvocationResult(
      packet,
      preflight,
      "inv-c0v-radial-publish-check-caller",
      callerResult(producer),
      new Map(),
    )).toThrow(/before its exact producer capture/u);
  });
});
