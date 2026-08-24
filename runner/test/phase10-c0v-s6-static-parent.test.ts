import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6RetainedPreflight,
} from "../src/phase10-c0v-s6-contracts.ts";
import { phase10C0VS6PrettyJsonBytes } from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6ValidateStaticProduceInvocationResult,
  phase10C0VS6ValidateStaticPublishInvocationResult,
} from "../src/phase10-c0v-s6-executor.ts";

const protocolPath = "research/phase10-execution-v2/recovery-v2/packets/c0v-static-produce/protocol.json";
const packet = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
  new Uint8Array(readFileSync(resolve(process.cwd(), protocolPath))),
  "static parent test protocol",
));
const publishProtocolPath = "research/phase10-execution-v2/recovery-v2/packets/c0v-static-publish/protocol.json";
const publishPacket = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
  new Uint8Array(readFileSync(resolve(process.cwd(), publishProtocolPath))),
  "static-publish parent test protocol",
));
const publishPreflight = Object.freeze({
  observed: Object.freeze({
    candidateDirectory:
  "out/phase10-execution-v2/recovery-v2/attempts/c0v-static-publish/" +
      "c0v-static-publish-20260822-v1/candidate",
  }),
}) as Phase10C0VS6RetainedPreflight;
const publishCompleteRoute = (() => {
  const found = publishPacket.terminalSubroutes.find((entry) => entry.dispositionCode === null);
  if (found === undefined) throw new Error("static-publish test protocol lacks its complete route");
  return found;
})();

function exactResult(): Readonly<Record<string, unknown>> {
  return Object.freeze({
    evaluation: Object.freeze({
      layerId: "C0V-STATIC",
      dispositionCode: "preimplementation-reference-refusal",
      observations: Object.freeze([]),
      evidence: Object.freeze([]),
      verdict: "pass",
      errors: Object.freeze([]),
    }),
    terminalStatus: "refusal",
    executedCheckIds: Object.freeze(["chk-c0v-static-refusal-validity"]),
    evaluatedCheckIds: Object.freeze(["chk-c0v-static-refusal-validity"]),
    executedNegativeControlIds: Object.freeze([]),
  });
}

function publishProducerResult(): Readonly<Record<string, unknown>> {
  const result = Object.freeze({
    schema: "phase10-c0v-static-result-v1",
    resultId: "c0v-static-result-v1",
    layerId: "C0V-STATIC",
    branch: "reference-refusal",
    terminalStatus: "refusal",
    scientificDisposition: "refusal",
  });
  const artifactIndex = Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([]),
  });
  return Object.freeze({
    packetId: publishPacket.packetId,
    result,
    artifactIndex,
    bytes: Object.freeze({
      result: phase10C0VS6PrettyJsonBytes(result),
      artifactIndex: phase10C0VS6PrettyJsonBytes(artifactIndex),
    }),
  });
}

function publishCallerResult(producer: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schema: "phase10-c0v-publication-check-caller-result-v1",
    packetId: publishPacket.packetId,
    callerCallableId: "phase10-c0v-static-publish-check-caller",
    evaluatorCallableId: "phase10-c0v-static-publication-verifier",
    evaluation: Object.freeze({
      schema: "phase10-c0v-publication-evaluation-v1",
      packetId: publishPacket.packetId,
      evaluatorCallableId: "phase10-c0v-static-publication-verifier",
      selectedAttempt: Object.freeze({}),
      result: producer.result,
      artifactIndex: producer.artifactIndex,
      resultIdentity: Object.freeze({}),
      artifactIndexIdentity: Object.freeze({}),
      checkResults: Object.freeze([]),
      aggregateVerdict: "pass",
    }),
    executedCheckIds: publishCompleteRoute.requiredCheckIds,
    evaluatedCheckIds: publishCompleteRoute.requiredCheckIds,
    executedNegativeControlIds: publishCompleteRoute.requiredNegativeControlIds,
  });
}

describe("Phase 10 C0V S6 static-produce parent wire authority", () => {
  it("accepts the exact scoped-refusal caller result", () => {
    expect(phase10C0VS6ValidateStaticProduceInvocationResult(
      packet,
      "inv-c0v-static-cause",
      exactResult(),
    )).toEqual(exactResult());
  });

  it("rejects a moving disposition and a substituted check roster", () => {
    const exact = exactResult();
    expect(() => phase10C0VS6ValidateStaticProduceInvocationResult(
      packet,
      "inv-c0v-static-cause",
      Object.freeze({
        ...exact,
        evaluation: Object.freeze({
          ...(exact.evaluation as object),
          layerId: "C0V-MOVING-EVENT",
          dispositionCode: "reference-discrepancy-refusal",
        }),
      }),
    )).toThrow(/identity\/disposition differs/u);
    expect(() => phase10C0VS6ValidateStaticProduceInvocationResult(
      packet,
      "inv-c0v-static-cause",
      Object.freeze({
        ...exact,
        executedCheckIds: Object.freeze(["chk-c0v-moving-discrepancy-validity"]),
      }),
    )).toThrow(/check\/control roster differs/u);
  });
});

describe("Phase 10 C0V S6 static-publish parent wire authority", () => {
  it("binds the refusal result bytes before accepting the publication caller", () => {
    const producer = publishProducerResult();
    const capture = phase10C0VS6ValidateStaticPublishInvocationResult(
      publishPacket,
      publishPreflight,
      "inv-c0v-static-publish-producer",
      producer,
      new Map(),
    );
    const results = new Map<string, unknown>([["inv-c0v-static-publish-producer", capture]]);
    expect(phase10C0VS6ValidateStaticPublishInvocationResult(
      publishPacket,
      publishPreflight,
      "inv-c0v-static-publish-check-caller",
      publishCallerResult(producer),
      results,
    )).toMatchObject({
      packetId: "c0v-static-publish",
      evaluatorCallableId: "phase10-c0v-static-publication-verifier",
    });
  });

  it("rejects a radial branch and a caller that precedes its producer", () => {
    const producer = publishProducerResult();
    expect(() => phase10C0VS6ValidateStaticPublishInvocationResult(
      publishPacket,
      publishPreflight,
      "inv-c0v-static-publish-producer",
      Object.freeze({
        ...producer,
        result: Object.freeze({ ...(producer.result as object), branch: "independent-reference" }),
      }),
      new Map(),
    )).toThrow(/wire\/bytes projection/u);
    expect(() => phase10C0VS6ValidateStaticPublishInvocationResult(
      publishPacket,
      publishPreflight,
      "inv-c0v-static-publish-check-caller",
      publishCallerResult(producer),
      new Map(),
    )).toThrow(/before its exact producer capture/u);
  });
});
