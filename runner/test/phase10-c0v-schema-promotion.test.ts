import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  parsePhase10C0VMovingProtocol,
  parsePhase10C0VRadialProtocol,
  parsePhase10C0VSchemaContracts,
  parsePhase10C0VStaticProtocol,
} from "../src/phase10-c0v-contracts.ts";
import {
  phase10ObligationFreezePreflight,
  phase10ObligationRunPreflight,
} from "../src/phase10-obligation-preflight.ts";

const ROOT = process.cwd();
const CONTRACT_PATH = "research/phase10-c0v-schema-contracts-v1.json";
const SUCCESSOR_PATH = "research/phase10-c0v-artifact-schema-registry-v1.json";
const ORIGINAL_PATH = "research/phase10-artifact-schema-registry-v1.json";
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";

function bytes(path: string): Buffer {
  return readFileSync(join(ROOT, path));
}

function json<T = Record<string, unknown>>(path: string): T {
  return JSON.parse(bytes(path).toString("utf8")) as T;
}

function identity(path: string): { readonly byteLength: number; readonly sha256: string } {
  const value = bytes(path);
  return {
    byteLength: value.byteLength,
    sha256: createHash("sha256").update(value).digest("hex"),
  };
}

function expectPretty2Lf(path: string): void {
  const value = bytes(path);
  expect(value.includes(13), `${path} contains CR bytes`).toBe(false);
  const parsed = JSON.parse(value.toString("utf8")) as unknown;
  expect(value.toString("utf8"), `${path} is not pretty-2 plus LF`)
    .toBe(`${JSON.stringify(parsed, null, 2)}\n`);
}

interface ExternalDefinition {
  readonly schemaId: string;
  readonly owner: string;
  readonly state: "defined";
  readonly contractPath: string;
  readonly contractPointer: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface Reservation {
  readonly schemaId: string;
  readonly owner: string;
  readonly state: "reserved";
  readonly requiredBeforePacketIds: readonly string[];
}

interface Registry extends Record<string, unknown> {
  readonly externalSchemaDefinitions: readonly ExternalDefinition[];
  readonly externalSchemaReservations: readonly Reservation[];
  readonly schemaAvailability: readonly Record<string, unknown>[];
}

describe("Phase 10 C0V schema promotion", () => {
  it("rejects unknown contract definitions, schemas, and incomplete exact-field coverage", () => {
    const clean = json<Record<string, any>>(CONTRACT_PATH);
    expect(parsePhase10C0VSchemaContracts(clean).schemas).toHaveProperty("phase10-c0v-aggregate-v1");

    const extraDefinition = structuredClone(clean);
    extraDefinition.definitions.unregisteredDefinition = {
      exactFields: ["value"],
      fieldContracts: { value: "string" },
    };
    expect(() => parsePhase10C0VSchemaContracts(extraDefinition)).toThrow(/definition IDs/u);

    const extraSchema = structuredClone(clean);
    extraSchema.schemas["phase10-c0v-unregistered-v1"] =
      structuredClone(extraSchema.schemas["phase10-c0v-aggregate-v1"]);
    extraSchema.schemas["phase10-c0v-unregistered-v1"].schemaId = "phase10-c0v-unregistered-v1";
    expect(() => parsePhase10C0VSchemaContracts(extraSchema)).toThrow(/schema IDs/u);

    const incomplete = structuredClone(clean);
    delete incomplete.definitions.numericIdentity.fieldContracts.binary64Hex;
    expect(() => parsePhase10C0VSchemaContracts(incomplete)).toThrow(/fieldContracts keys/u);
  });

  it("preserves the immutable A-P registry and promotes exactly the 20 C0V reservations", () => {
    expect(identity(ORIGINAL_PATH)).toEqual({
      byteLength: 114255,
      sha256: "c89463c37384d5652b57c039e26f0c612b08a2d9bb5994482bbf750eae121c70",
    });
    const original = json<Registry>(ORIGINAL_PATH);
    const successor = json<Registry>(SUCCESSOR_PATH);
    const contracts = parsePhase10C0VSchemaContracts(json(CONTRACT_PATH));
    const promotedIds = Object.keys(contracts.schemas).sort();
    expect(promotedIds).toHaveLength(20);

    for (const key of Object.keys(original)) {
      if (!["externalSchemaDefinitions", "externalSchemaReservations", "schemaAvailability"].includes(key)) {
        expect(successor[key], `successor changed inherited ${key}`).toEqual(original[key]);
      }
    }
    const originalReservation = new Map(
      original.externalSchemaReservations.map((row) => [row.schemaId, row]),
    );
    expect(promotedIds.every((schemaId) => originalReservation.has(schemaId))).toBe(true);
    const remaining = original.externalSchemaReservations
      .filter((row) => !promotedIds.includes(row.schemaId));
    expect(successor.externalSchemaReservations).toEqual(remaining);
    expect(successor.externalSchemaReservations.map((row) => row.schemaId)).toEqual([
      "phase10-claim-map-v1",
      "phase10-nas-publication-disposition-v1",
      "phase10-return-proposal-v1",
      "phase10-return-proposals-v1",
    ]);

    const inheritedSchemaIds = new Set(
      original.externalSchemaDefinitions.map((row) => row.schemaId),
    );
    const inheritedDefinitions = successor.externalSchemaDefinitions
      .filter((row) => inheritedSchemaIds.has(row.schemaId));
    expect(inheritedDefinitions).toEqual(original.externalSchemaDefinitions);
    const promoted = successor.externalSchemaDefinitions
      .filter((row) => !inheritedSchemaIds.has(row.schemaId));
    expect(promoted.map((row) => row.schemaId)).toEqual(promotedIds);
    const contractIdentity = identity(CONTRACT_PATH);
    for (const definition of promoted) {
      expect(definition).toMatchObject({
        state: "defined",
        contractPath: CONTRACT_PATH,
        contractPointer: `/schemas/${definition.schemaId}`,
        byteLength: contractIdentity.byteLength,
        sha256: contractIdentity.sha256,
      });
    }
    expect(successor.schemaAvailability).toHaveLength(original.schemaAvailability.length);
    const successorAvailability = new Map(
      successor.schemaAvailability.map((row) => [row.schemaId as string, row]),
    );
    for (const row of original.schemaAvailability) {
      const schemaId = row.schemaId as string;
      if (!promotedIds.includes(schemaId)) expect(successorAvailability.get(schemaId)).toEqual(row);
      else expect(successorAvailability.get(schemaId)?.state).toBe("defined");
    }
  });

  it("keeps every new research contract pretty-2 LF, trackable, and byte-stable", () => {
    const paths = [
      CONTRACT_PATH,
      SUCCESSOR_PATH,
      "research/phase10-c0v-radial-protocol-v1.json",
      "research/phase10-c0v-moving-protocol-v1.json",
      "research/phase10-c0v-static-protocol-v1.json",
      ...["radial", "moving", "static"].flatMap((layer) => [
        `research/phase10-execution-v1/packets/c0v-${layer}-produce/protocol.json`,
        `research/phase10-execution-v1/packets/c0v-${layer}-produce/callable-registry.json`,
      ]),
    ];
    for (const path of paths) {
      expectPretty2Lf(path);
      const ignored = spawnSync("git", ["check-ignore", "--no-index", "--quiet", "--", path], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(ignored.status, `${path} must not be ignored`).toBe(1);
      const attribute = spawnSync("git", ["check-attr", "text", "--", path], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(attribute.status, `${path} check-attr`).toBe(0);
      expect(attribute.stdout.trim()).toBe(`${path}: text: unset`);
    }
  });

  it("rejects retired or unproven scientific-protocol premises", () => {
    const radial = json<Record<string, any>>("research/phase10-c0v-radial-protocol-v1.json");
    const radialLawClaim = structuredClone(radial);
    radialLawClaim.problem.provenance[0].status = "temperature-law-provenance";
    expect(() => parsePhase10C0VRadialProtocol(radialLawClaim)).toThrow(/must equal/u);

    const moving = json<Record<string, any>>("research/phase10-c0v-moving-protocol-v1.json");
    const missingMovingProvenance = structuredClone(moving);
    missingMovingProvenance.fixture.provenance.pop();
    expect(() => parsePhase10C0VMovingProtocol(missingMovingProvenance)).toThrow(/four frozen provenance/u);

    const staticProtocol = json<Record<string, any>>("research/phase10-c0v-static-protocol-v1.json");
    const retiredPrivatePremise = structuredClone(staticProtocol);
    retiredPrivatePremise.refusalGrounds.unavailableOperands.push(
      "acceptedFinalSweepPreSweepActiveField",
    );
    expect(() => parsePhase10C0VStaticProtocol(retiredPrivatePremise)).toThrow(/unavailableOperands/u);
    const contractChangeClaim = structuredClone(staticProtocol);
    contractChangeClaim.refusalGrounds.findings[0].contractChangeRequired = true;
    expect(() => parsePhase10C0VStaticProtocol(contractChangeClaim)).toThrow(/contractChangeRequired/u);
  });

  it("binds strict science protocols and exact reference-only code identities", () => {
    const radial = parsePhase10C0VRadialProtocol(json("research/phase10-c0v-radial-protocol-v1.json"));
    const moving = parsePhase10C0VMovingProtocol(json("research/phase10-c0v-moving-protocol-v1.json"));
    const staticProtocol = parsePhase10C0VStaticProtocol(json("research/phase10-c0v-static-protocol-v1.json"));
    expect([radial.branch, moving.branch, staticProtocol.branch]).toEqual([
      "independent-reference",
      "independent-reference",
      "reference-refusal",
    ]);
    for (const protocol of [radial, moving, staticProtocol]) {
      expect(protocol.referenceOnlyCode).toHaveLength(3);
      for (const code of protocol.referenceOnlyCode) {
        expect(code).toMatchObject(identity(code.modulePath));
      }
      expect(protocol.bindings.foundation).toMatchObject(identity(protocol.bindings.foundation.path));
      expect(protocol.bindings.obligationMatrix).toMatchObject(identity(protocol.bindings.obligationMatrix.path));
      expect(protocol.bindings.schemaRegistry).toMatchObject(identity(protocol.bindings.schemaRegistry.path));
      expect(protocol.bindings.schemaContracts).toMatchObject(identity(protocol.bindings.schemaContracts.path));
    }
  });

  it("freezes exact packet rosters but leaves every S6 callable planned and run-impossible", () => {
    const matrix = json(MATRIX_PATH);
    const expected = {
      radial: [5, 4, 3],
      moving: [5, 4, 2],
      static: [3, 3, 0],
    } as const;
    for (const layer of ["radial", "moving", "static"] as const) {
      const root = `research/phase10-execution-v1/packets/c0v-${layer}-produce`;
      const protocol = json<Record<string, unknown> & {
        registeredOutputIds: readonly string[];
        registeredCheckIds: readonly string[];
        registeredNegativeControlIds: readonly string[];
      }>(`${root}/protocol.json`);
      const registry = json<Record<string, unknown> & {
        callables: readonly { readonly resolution: string; readonly identity: unknown }[];
      }>(`${root}/callable-registry.json`);
      expect([
        protocol.registeredOutputIds.length,
        protocol.registeredCheckIds.length,
        protocol.registeredNegativeControlIds.length,
      ]).toEqual(expected[layer]);
      expect(registry.callables.every((row) => row.resolution === "planned" && row.identity === null))
        .toBe(true);
      expect(phase10ObligationFreezePreflight(matrix, protocol, registry)).toMatchObject({
        pass: true,
        stage: "freeze",
        packetId: `c0v-${layer}-produce`,
      });
      expect(() => phase10ObligationRunPreflight(matrix, protocol, registry))
        .toThrow(/planned|unresolved/u);
    }
  });

  it("contains no S5b reference/refusal or S6 production artifacts", () => {
    for (const layer of ["radial", "moving", "static"]) {
      for (const suffix of ["reference.json", "reference-refusal.json", "witness.bin", "evaluation.json", "result.json", "attempts.jsonl"]) {
        expect(existsSync(join(ROOT, `evidence/phase10-numerical-verification-v1/c0v-${layer}-${suffix}`)))
          .toBe(false);
      }
    }
  });
});
