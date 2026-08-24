import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { strictJsonSnapshot } from "../src/gate4-evidence.ts";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6RetainedPreflight,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import { phase10C0VS6ValidateAggregateInvocationResult } from "../src/phase10-c0v-s6-executor.ts";

const protocolPath = "research/phase10-execution-v2/recovery-v1/packets/c0v-aggregate/protocol.json";
const packet = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
  new Uint8Array(readFileSync(resolve(process.cwd(), protocolPath))),
  "aggregate parent test protocol",
));
const attemptDirectory =
  "out/phase10-execution-v2/recovery-v1/attempts/c0v-aggregate/c0v-aggregate-20260822-v1";
const preflight = Object.freeze({
  observed: Object.freeze({ attemptDirectory, candidateDirectory: `${attemptDirectory}/candidate` }),
}) as Phase10C0VS6RetainedPreflight;
const completeRoute = (() => {
  const found = packet.terminalSubroutes.find((entry) => entry.dispositionCode === null);
  if (found === undefined) throw new Error("aggregate parent test protocol lacks its complete route");
  return found;
})();

function controlReceipt(): Readonly<Record<string, unknown>> {
  const boundary = Object.freeze({
    allowed: Object.freeze(["synthetic-aggregate-negative-control"]),
    forbidden: Object.freeze(["evidence-credit", "qualification-credit"]),
  });
  const makeRow = (layerId: "C0V-RADIAL" | "C0V-STATIC" | "C0V-MOVING-EVENT") => {
    const stem = layerId === "C0V-RADIAL" ? "radial" : layerId === "C0V-STATIC" ? "static" : "moving";
    return Object.freeze({
      layerId,
      branch: "independent-reference",
      terminalStatus: "pass",
      result: phase10C0VS6ArtifactIdentity(
        `out/phase10-execution-v2/fixtures/c0v-aggregate/synthetic-${stem}-result.json`,
        new TextEncoder().encode(`phase10-c0v-synthetic-${stem}-pass-v1\n`),
      ),
      scientificDisposition: "pass",
      negativeControlDisposition: "pass",
      resourceDisposition: "within-cap",
      claimBoundary: boundary,
    });
  };
  const cleanRows = Object.freeze([
    makeRow("C0V-RADIAL"), makeRow("C0V-STATIC"), makeRow("C0V-MOVING-EVENT"),
  ]);
  const cleanTable = Object.freeze({
    schema: "phase10-c0v-terminal-table-v1",
    tableId: "c0v-terminal-table-synthetic-all-pass-v1",
    rows: cleanRows,
    allThreeTerminal: true,
    allIndependentReferences: true,
    allLayersPass: true,
    aggregateStatus: "pass",
  });
  const mutatedTable = Object.freeze({
    ...cleanTable,
    tableId: "c0v-terminal-table-synthetic-radial-refusal-v1",
    rows: Object.freeze([
      Object.freeze({ ...cleanRows[0], scientificDisposition: "refusal" }),
      cleanRows[1],
      cleanRows[2],
    ]),
    allLayersPass: false,
    aggregateStatus: "non-pass",
  });
  return Object.freeze({
    schema: "phase10-c0v-any-layer-nonpass-control-v1",
    negativeControlId: "nc-c0v-any-layer-nonpass",
    ownerCheckId: "chk-c0v-any-layer-nonpass",
    callableId: "phase10-nc-c0v-any-layer-nonpass",
    cleanTable,
    mutatedLayerId: "C0V-RADIAL",
    mutatedTable,
    mutation: Object.freeze({
      field: "scientificDisposition",
      before: "pass",
      after: "refusal",
      changedRowCount: 1,
      otherRowsUnchanged: true,
    }),
    cleanOutcome: Object.freeze({
      aggregateStatus: "pass",
      packageCompletionEligible: true,
      dependentQualificationBlocked: false,
    }),
    attackedOutcome: Object.freeze({
      aggregateStatus: "non-pass",
      packageCompletionEligible: true,
      dependentQualificationBlocked: true,
    }),
    result: Object.freeze({
      negativeControlId: "nc-c0v-any-layer-nonpass",
      mutationExecuted: true,
      witnessMoved: true,
      cleanCapturePreserved: true,
      attackedCheckFailed: true,
      pass: true,
    }),
  });
}

function callerResult(): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schema: "phase10-c0v-aggregate-check-caller-result-v1",
    packetId: "c0v-aggregate",
    callerCallableId: "phase10-c0v-aggregate-check-caller",
    evaluatorCallableId: "phase10-c0v-aggregate-evaluator",
    evaluation: Object.freeze({
      schema: "phase10-c0v-aggregate-independent-evaluation-v1",
      packetId: "c0v-aggregate",
      evaluatorCallableId: "phase10-c0v-aggregate-evaluator",
      terminalTable: Object.freeze({}),
      resourceLedger: Object.freeze({}),
      aggregate: Object.freeze({}),
      artifactIndex: Object.freeze({}),
      outputIdentities: Object.freeze([]),
      negativeControlReproof: Object.freeze({}),
      checkResults: Object.freeze([]),
      aggregateVerdict: "pass",
    }),
    executedCheckIds: completeRoute.requiredCheckIds,
    evaluatedCheckIds: completeRoute.requiredCheckIds,
    executedNegativeControlIds: completeRoute.requiredNegativeControlIds,
  });
}

describe("Phase 10 C0V S6 aggregate parent wire authority", () => {
  it("accepts only the exact passing retained negative-control bytes", () => {
    const receipt = controlReceipt();
    const bytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(receipt));
    expect(phase10C0VS6ValidateAggregateInvocationResult(
      packet,
      preflight,
      "inv-c0v-aggregate-nc-any-layer-nonpass",
      Object.freeze({ receipt, bytes }),
      new Map(),
    )).toMatchObject({ bytes });

    const forged = Object.freeze({
      ...receipt,
      result: Object.freeze({ ...(receipt.result as object), pass: false }),
    });
    expect(() => phase10C0VS6ValidateAggregateInvocationResult(
      packet,
      preflight,
      "inv-c0v-aggregate-nc-any-layer-nonpass",
      Object.freeze({ receipt: forged, bytes: phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(forged)) }),
      new Map(),
    )).toThrow(/did not pass/u);
  });

  it("refuses the governed aggregate caller before its producer capture", () => {
    expect(() => phase10C0VS6ValidateAggregateInvocationResult(
      packet,
      preflight,
      "inv-c0v-aggregate-check-caller",
      callerResult(),
      new Map(),
    )).toThrow(/before its exact producer capture/u);
  });
});
