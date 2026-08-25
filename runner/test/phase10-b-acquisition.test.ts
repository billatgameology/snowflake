import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  phase10BClassifyAcquisitionResponse,
} from "../src/phase10-b-acquisition.ts";
import { phase10BAcquisitionVerify } from "../src/phase10-b-acquisition-verify.ts";
import { phase10ObligationRunPreflight } from "../src/phase10-obligation-preflight.ts";

const ROOT = process.cwd();
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/protocol.json";
const CALLABLE_REGISTRY_PATH = "research/phase10-execution-v1/packets/b-acquisition/callable-registry.json";
const ACQUISITION_PROTOCOL_PATH = "research/phase10-execution-v1/packets/b-acquisition/acquisition-protocol.json";
const PREDECESSOR_REGISTRY_PATH = "research/phase10-c0v-artifact-schema-registry-v1.json";
const SUCCESSOR_REGISTRY_PATH = "research/phase10-b-artifact-schema-registry-v1.json";
const CONTRACT_PATH = "research/phase10-b-schema-contracts-v1.json";
const COLLECTION_ID = "phase10-source-intake@2026-08-21-v1";
const FREEZE_COMMIT = "1".repeat(40);
const EXPECTED_TARGET_IDS = Object.freeze([
  "P10-ACQ-HP26-FINAL-ARTICLE",
  "P10-ACQ-KELLER-HALLETT-1982",
  "P10-ACQ-PMH2025-METHODS",
  "P10-ACQ-PRINCETON-MONOGRAPH-CURRENT",
  "P10-ACQ-ZHAO-2026-MAIN-ARTICLE",
  "P10-ACQ-ZHAO-2026-S2-VIDEO",
]);

const temporaryDirectories: string[] = [];

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

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("Phase 10 B acquisition", () => {
  it("freezes exactly six targets and passes the resolved packet preflight", () => {
    const acquisition = json<{
      readonly round: { readonly expectedTargetCount: number };
      readonly network: { readonly actualConcurrency: number; readonly retryCount: number };
      readonly targets: readonly { readonly targetId: string; readonly endpoint: string }[];
    }>(ACQUISITION_PROTOCOL_PATH);
    expect(acquisition.round.expectedTargetCount).toBe(6);
    expect(acquisition.network).toMatchObject({ actualConcurrency: 1, retryCount: 0 });
    expect(acquisition.targets.map((target) => target.targetId)).toEqual(EXPECTED_TARGET_IDS);
    expect(acquisition.targets.every((target) => new URL(target.endpoint).protocol === "https:"))
      .toBe(true);

    expect(phase10ObligationRunPreflight(
      json(MATRIX_PATH),
      json(PROTOCOL_PATH),
      json(CALLABLE_REGISTRY_PATH),
      ROOT,
    )).toMatchObject({
      pass: true,
      stage: "run",
      packetId: "b-acquisition",
      outputIds: [
        "out-b-acquisition-nas-publication",
        "out-b-acquisition-round",
        "out-b-acquisition-verification",
      ],
      checkIds: [
        "chk-b-acquisition-nas-receipt-or-na",
        "chk-b-acquisition-six-targets",
      ],
      negativeControlIds: [],
    });
  });

  it("promotes only the NAS publication disposition schema", () => {
    const predecessor = json<Record<string, any>>(PREDECESSOR_REGISTRY_PATH);
    const successor = json<Record<string, any>>(SUCCESSOR_REGISTRY_PATH);
    const contract = json<Record<string, any>>(CONTRACT_PATH);
    const schemaId = "phase10-nas-publication-disposition-v1";

    for (const key of Object.keys(predecessor)) {
      if (!["externalSchemaDefinitions", "externalSchemaReservations", "schemaAvailability"].includes(key)) {
        expect(successor[key], `successor changed inherited ${key}`).toEqual(predecessor[key]);
      }
    }
    expect(Object.keys(contract.schemas)).toEqual([schemaId]);
    expect(successor.externalSchemaReservations).toEqual(
      predecessor.externalSchemaReservations.filter((row: { readonly schemaId: string }) => row.schemaId !== schemaId),
    );
    const added = successor.externalSchemaDefinitions.filter(
      (row: { readonly schemaId: string }) => !predecessor.externalSchemaDefinitions.some(
        (old: { readonly schemaId: string }) => old.schemaId === row.schemaId,
      ),
    );
    expect(added).toEqual([{
      schemaId,
      owner: "S1 integration",
      state: "defined",
      contractPath: CONTRACT_PATH,
      contractPointer: `/schemas/${schemaId}`,
      ...identity(CONTRACT_PATH),
    }]);
    const availability = successor.schemaAvailability.find(
      (row: { readonly schemaId: string }) => row.schemaId === schemaId,
    );
    expect(availability).toMatchObject({ schemaId, state: "defined" });
  });

  it("keeps only complete requested media from the single network response", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7\nminimal fixture");
    expect(phase10BClassifyAcquisitionResponse(
      { mediaKind: "pdf", expectedByteLength: null, expectedMd5: null },
      200,
      "application/pdf",
      pdf,
    )).toMatchObject({ accepted: true, disposition: "staged-for-private-publication" });

    const html = new TextEncoder().encode("<html>purchase required</html>");
    expect(phase10BClassifyAcquisitionResponse(
      { mediaKind: "pdf", expectedByteLength: null, expectedMd5: null },
      200,
      "text/html",
      html,
    )).toMatchObject({ accepted: false, disposition: "rights-blocked" });
    expect(phase10BClassifyAcquisitionResponse(
      { mediaKind: "pdf", expectedByteLength: null, expectedMd5: null },
      403,
      "text/html",
      html,
    )).toMatchObject({ accepted: false, disposition: "rights-blocked" });

    const wrongS2 = new Uint8Array([0, 0, 0, 12, 102, 116, 121, 112, 0, 0, 0, 0]);
    expect(phase10BClassifyAcquisitionResponse(
      { mediaKind: "mp4", expectedByteLength: wrongS2.byteLength, expectedMd5: "0".repeat(32) },
      200,
      "video/mp4",
      wrongS2,
    )).toMatchObject({ accepted: false, disposition: "unavailable" });
  });

  it("accepts the exact six-target no-byte result and rejects an incomplete roster", () => {
    const directory = mkdtempSync(join(tmpdir(), "phase10-b-acquisition-"));
    temporaryDirectories.push(directory);
    const acquisition = json<{
      readonly targets: readonly {
        readonly targetId: string;
        readonly attemptId: string;
        readonly identity: string;
        readonly persistentId: string;
        readonly endpoint: string;
      }[];
    }>(ACQUISITION_PROTOCOL_PATH);
    const timestamp = "2026-08-24T12:00:00.000Z";
    const targetRows = acquisition.targets.map((target) => ({
      schema: "phase10-acquisition-round-row-v1",
      targetId: target.targetId,
      attemptId: target.attemptId,
      freezeCommit: FREEZE_COMMIT,
      startedOn: timestamp,
      endedOn: timestamp,
      endpoints: [target.endpoint],
      identityCandidates: [target.identity, target.persistentId].sort(),
      acquiredBinding: null,
      terminalDisposition: "rights-blocked",
      reason: "The official endpoint did not provide a complete public artifact.",
    }));
    const round = {
      schema: "phase10-acquisition-round-v1",
      roundId: "P10-ACQUISITION-ROUND-01",
      freezeCommit: FREEZE_COMMIT,
      targetRoster: EXPECTED_TARGET_IDS,
      targets: targetRows,
      terminalDisposition: "refusal",
      producer: {
        producerId: "phase10-b-acquisition-producer",
        commit: FREEZE_COMMIT,
        command: "node runner/src/phase10-b-acquisition.ts run --repository-root .",
        startedOn: timestamp,
        endedOn: timestamp,
        actualConcurrency: 1,
      },
    };
    writeJson(join(directory, "acquisition-round.json"), round);
    writeJson(join(directory, "acquisition-nas-publication.json"), {
      schema: "phase10-nas-publication-disposition-v1",
      collectionId: COLLECTION_ID,
      state: "not-applicable-no-new-bytes",
      publicationReceipt: null,
      restoreReceipt: null,
      ownerManifest: null,
      sourcePruneAuthorized: false,
      reason: "No new bytes were obtained.",
    });

    expect(phase10BAcquisitionVerify({
      repositoryRoot: ROOT,
      bundleDirectory: directory,
      command: "focused synthetic verification",
      gitHead: FREEZE_COMMIT,
      startedOn: timestamp,
      endedOn: timestamp,
    })).toMatchObject({
      packetId: "b-acquisition",
      terminalState: "refusal",
      aggregateVerdict: "refusal",
      checkResults: [
        { checkId: "chk-b-acquisition-nas-receipt-or-na", verdict: "pass" },
        { checkId: "chk-b-acquisition-six-targets", verdict: "pass" },
      ],
    });

    writeJson(join(directory, "acquisition-round.json"), { ...round, targets: targetRows.slice(0, 5) });
    expect(() => phase10BAcquisitionVerify({
      repositoryRoot: ROOT,
      bundleDirectory: directory,
      command: "focused synthetic verification",
      gitHead: FREEZE_COMMIT,
      startedOn: timestamp,
      endedOn: timestamp,
    })).toThrow(/must contain six target rows/u);
  });
});
