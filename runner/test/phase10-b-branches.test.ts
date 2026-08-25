import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  producePhase10B1aProtocol,
  producePhase10B1bProtocol,
  producePhase10B2Protocol,
  producePhase10B3Protocol,
  producePhase10B4Protocol,
  producePhase10B5Protocol,
} from "../src/phase10-b-branches.ts";
import { phase10ObligationRunPreflight } from "../src/phase10-obligation-preflight.ts";

const ROOT = process.cwd();
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const PREDECESSOR_REGISTRY_PATH = "research/phase10-b-artifact-schema-registry-v1.json";
const SUCCESSOR_REGISTRY_PATH = "research/phase10-b-branch-artifact-schema-registry-v1.json";
const CONTRACT_PATH = "research/phase10-b-branch-schema-contracts-v1.json";
const ACQUISITION_PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/protocol.json";
const ACQUISITION_CALLABLES_PATH = "research/phase10-execution-v1/packets/b-acquisition/callable-registry.json";
const FREEZE_COMMIT = "1".repeat(40);

function bytes(path: string): Buffer {
  return readFileSync(join(ROOT, path));
}

function json<T = Record<string, any>>(path: string): T {
  return JSON.parse(bytes(path).toString("utf8")) as T;
}

function identity(path: string): { readonly byteLength: number; readonly sha256: string } {
  const value = bytes(path);
  return {
    byteLength: value.byteLength,
    sha256: createHash("sha256").update(value).digest("hex"),
  };
}

describe("Phase 10 terminal B branches", () => {
  it("promotes only the two return schemas and leaves the acquisition authority usable", () => {
    const predecessor = json<Record<string, any>>(PREDECESSOR_REGISTRY_PATH);
    const successor = json<Record<string, any>>(SUCCESSOR_REGISTRY_PATH);
    const contract = json<Record<string, any>>(CONTRACT_PATH);
    const promoted = ["phase10-return-proposal-v1", "phase10-return-proposals-v1"];

    for (const key of Object.keys(predecessor)) {
      if (!["createdOn", "externalSchemaDefinitions", "externalSchemaReservations", "schemaAvailability"].includes(key)) {
        expect(successor[key], `successor changed inherited ${key}`).toEqual(predecessor[key]);
      }
    }
    expect(Object.keys(contract.schemas)).toEqual(promoted);
    expect(successor.externalSchemaReservations).toEqual(
      predecessor.externalSchemaReservations.filter((row: { readonly schemaId: string }) => !promoted.includes(row.schemaId)),
    );
    const added = successor.externalSchemaDefinitions.filter(
      (row: { readonly schemaId: string }) => !predecessor.externalSchemaDefinitions.some(
        (old: { readonly schemaId: string }) => old.schemaId === row.schemaId,
      ),
    );
    expect(added).toEqual(promoted.map((schemaId) => ({
      schemaId,
      owner: "S7 B branch integration",
      state: "defined",
      contractPath: CONTRACT_PATH,
      contractPointer: `/schemas/${schemaId}`,
      ...identity(CONTRACT_PATH),
    })));
    expect(phase10ObligationRunPreflight(
      json(MATRIX_PATH),
      json(ACQUISITION_PROTOCOL_PATH),
      json(ACQUISITION_CALLABLES_PATH),
      ROOT,
    )).toMatchObject({ pass: true, packetId: "b-acquisition" });
  });

  it("derives each deciding protocol from the frozen matrix roster before results", () => {
    const matrix = json<{ readonly packets: readonly any[] }>(MATRIX_PATH);
    const protocols = [
      producePhase10B1aProtocol(ROOT, FREEZE_COMMIT),
      producePhase10B1bProtocol(ROOT, FREEZE_COMMIT),
      producePhase10B2Protocol(ROOT, FREEZE_COMMIT),
      producePhase10B3Protocol(ROOT, FREEZE_COMMIT),
      producePhase10B4Protocol(ROOT, FREEZE_COMMIT),
      producePhase10B5Protocol(ROOT, FREEZE_COMMIT),
    ] as readonly Record<string, any>[];

    expect(protocols.map((protocol) => protocol.branchId)).toEqual(["B1a", "B1b", "B2", "B3", "B4", "B5"]);
    for (const protocol of protocols) {
      const packetId = String(protocol.branchId).toLowerCase();
      const packet = matrix.packets.find((row) => row.packetId === packetId);
      expect(packet).toBeDefined();
      expect(protocol.protocolCommit).toBe(FREEZE_COMMIT);
      expect(protocol.outputRoster).toEqual(packet.baseOutputIds);
      expect(protocol.checkRoster).toEqual(packet.baseCheckIds);
      expect(protocol.eligibilityRule.conjunctiveOperandIds).toEqual(protocol.operandRules.map((row: any) => row.operandId));
      expect(protocol.claimBoundary).toMatchObject({
        allOpenedSourceValuesArePhase10DevelopmentEvidence: true,
        quantitativeValidationEarned: false,
        downstreamExecutionAuthorized: false,
      });
    }
  });

  it("passes the resolved preflight for every frozen B packet", () => {
    const matrix = json(MATRIX_PATH);
    for (const packetId of ["b1a", "b1b", "b2", "b3", "b4", "b5", "b-aggregate"]) {
      const protocolPath = `research/phase10-execution-v1/packets/${packetId}/protocol.json`;
      const callablesPath = `research/phase10-execution-v1/packets/${packetId}/callable-registry.json`;
      const callables = json<{ readonly callables: readonly Record<string, any>[] }>(callablesPath).callables;
      expect(phase10ObligationRunPreflight(matrix, json(protocolPath), json(callablesPath), ROOT)).toMatchObject({
        pass: true,
        packetId,
      });
      const evaluator = callables.find((row) => row.role === "independent-evaluator");
      const producers = callables.filter((row) => row.role === "producer");
      expect(evaluator).toBeDefined();
      expect(producers.every((row) => row.modulePath !== evaluator?.modulePath)).toBe(true);
    }
  });
});
