import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  PHASE8_BACON_IMPLEMENTATION_PATHS,
  PHASE8_BACON_SELECTION_IDS,
  derivePhase8BaconSuccessorBundle,
  verifyPhase8BaconSuccessorArtifacts,
  type Phase8BaconRegistration,
  type Phase8BaconSuccessorInputs,
} from "../src/phase8-bacon-successor.ts";

const ROOT = process.cwd();
const encoder = new TextEncoder();
const HISTORICAL_NAMES = [
  "artifact-index.json",
  "backlog.json",
  "protocol.json",
  "report.json",
  "selection.jsonl",
] as const;
const ARCHIVE_ROOT =
  "harrington-pokrifka-laboratory-data-on-the-hollowing-of-atmospheric-ice-crystals-2023";

function bytes(value: string): Uint8Array {
  return encoder.encode(value);
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return bytes(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function crc32(value: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function storedZip(entries: readonly { readonly name: string; readonly value: Uint8Array }[]): Uint8Array {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const value = Buffer.from(entry.value);
    const checksum = crc32(value);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(value.length, 18);
    local.writeUInt32LE(value.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, value);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(value.length, 20);
    central.writeUInt32LE(value.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(0x81a40000, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + value.length;
  }
  const localBytes = Buffer.concat(localParts);
  const centralBytes = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(localBytes.length, 16);
  return new Uint8Array(Buffer.concat([localBytes, centralBytes, eocd]));
}

function fixture(options: { readonly omitDescription?: boolean } = {}): Phase8BaconSuccessorInputs {
  const sourcePdfBytes = bytes("fixture source PDF bytes");
  const solid = bytes(
    " temp  ice supersaturation\n" +
    "  (C)    [%]\n" +
    "-15.0 4.5\n" +
    "-20.0 8.25\n",
  );
  const florid = bytes(
    " temp  ice supersaturation\n" +
    "  (C)    [%]\n" +
    "-15.0 12.5\n",
  );
  const description = bytes(
    "These files contain data on the hollowing of crystals from prior publications.\n" +
    "The solid file lists crystals that remained solid during growth.\n" +
    "The florid file lists crystals that begain to hollow during growth.\n",
  );
  const entries = [
    { name: `${ARCHIVE_ROOT}/bacon-solid.csv`, value: solid },
    { name: `${ARCHIVE_ROOT}/bacon-florid.csv`, value: florid },
    ...(options.omitDescription ? [] : [{ name: `${ARCHIVE_ROOT}/datadescription-hollowing.txt`, value: description }]),
  ];
  const sourceArchiveBytes = storedZip(entries);
  const registration: Phase8BaconRegistration = {
    scope: "test-fixture",
    sourcePdf: {
      logicalPath: "fixture/bacon.pdf",
      byteLength: sourcePdfBytes.byteLength,
      sha256: sha256Bytes(sourcePdfBytes),
      pageCount: 25,
    },
    sourceArchive: {
      logicalPath: "fixture/hollowing.zip",
      byteLength: sourceArchiveBytes.byteLength,
      sha256: sha256Bytes(sourceArchiveBytes),
      datasetRegistryId: "fixture-6381",
      landingPage: "https://example.test/dataset/6381",
    },
    archiveMembers: {
      solid: { path: `${ARCHIVE_ROOT}/bacon-solid.csv`, expectedRows: 2 },
      florid: { path: `${ARCHIVE_ROOT}/bacon-florid.csv`, expectedRows: 1 },
      description: { path: `${ARCHIVE_ROOT}/datadescription-hollowing.txt` },
    },
    normalizedDataRoot: "fixture/derived/bacon-v1",
  };
  const historicalRoot = join(ROOT, "evidence/phase8b-benchmark-selection-v1");
  return {
    registration,
    historicalSelection: new Map(HISTORICAL_NAMES.map((name) =>
      [name, new Uint8Array(readFileSync(join(historicalRoot, name)))] as const)),
    localContainersBytes: new Uint8Array(readFileSync(join(ROOT, "evidence/phase8b-local-denominator/source-containers.jsonl"))),
    localUnitsBytes: new Uint8Array(readFileSync(join(ROOT, "evidence/phase8b-local-denominator/source-units.jsonl"))),
    auditRegistrationBytes: new Uint8Array(readFileSync(join(ROOT, "research/phase8b-residual-audit-registration.md"))),
    triage: {
      focused: jsonl([{ recordKind: "route-status", status: "complete" }]),
      author: jsonl([{
        identifier: "https://openalex.org/W2102420161",
        disposition: "known-local-or-acquired",
        reasonCode: "MATCH_LOCAL_EXACT_WORK",
        knownMatch: { recordIds: ["P8B-CONT-755B3746D3762F0BD610671A"] },
      }]),
      citation: jsonl([{ recordKind: "route-status", status: "complete" }]),
    },
    sourcePdfBytes,
    sourceArchiveBytes,
    implementation: new Map(PHASE8_BACON_IMPLEMENTATION_PATHS.map((path) =>
      [path, new Uint8Array(readFileSync(join(ROOT, path)))] as const)),
  };
}

function parseJson(bytesValue: Uint8Array): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(bytesValue)) as Record<string, unknown>;
}

describe("Phase 8B Bacon residual-audit correction", () => {
  it("preserves 49 selected rows, adds two P1 measurement sets, and updates all affected set differences", () => {
    const inputs = fixture();
    const bundle = derivePhase8BaconSuccessorBundle(inputs);
    expect(bundle.counts).toEqual({
      selectedRecords: 51,
      p0: 18,
      p1: 28,
      p2: 5,
      selectedLocalContainers: 4,
      residualLocalContainers: 19,
      selectedLocalUnits: 31,
      residualLocalUnits: 883,
      promotedIdentifiers: 9,
      residualIdentifiers: 1544,
      derivativeClassificationRows: 3,
    });

    const oldLines = new TextDecoder().decode(inputs.historicalSelection.get("selection.jsonl") as Uint8Array)
      .trimEnd().split("\n");
    const newLines = new TextDecoder().decode(bundle.selectionArtifacts.get("selection.jsonl") as Uint8Array)
      .trimEnd().split("\n");
    expect(newLines).toHaveLength(51);
    for (const line of oldLines) expect(newLines).toContain(line);
    const records = newLines.map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(records.map((row) => row.id)).toEqual(records.map((row) => row.id).sort());
    const added = records.filter((row) => PHASE8_BACON_SELECTION_IDS.includes(row.id as typeof PHASE8_BACON_SELECTION_IDS[number]));
    expect(added).toHaveLength(2);
    expect(added.every((row) => row.priorityClass === "P1")).toBe(true);
    expect(added.every((row) => row.phase9EvidenceRole === "model-development")).toBe(true);
    expect(added.every((row) => row.outcomeValueUsedAsSelectionCriterion === false)).toBe(true);

    const backlog = parseJson(bundle.selectionArtifacts.get("backlog.json") as Uint8Array);
    expect(JSON.stringify(backlog)).toContain('"residualCount":883');
    expect(JSON.stringify(backlog)).toContain('"NO_CURRENT_P0_P1_P2_ROLE":821');
    expect(JSON.stringify(backlog)).toContain('"https://openalex.org/W2102420161"');
  });

  it("transcribes the two direct aggregate measurement sets while keeping plot coordinates at zero", () => {
    const bundle = derivePhase8BaconSuccessorBundle(fixture());
    const rows = new TextDecoder().decode(bundle.baconMetadataArtifacts.get("records.jsonl") as Uint8Array)
      .trimEnd().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(rows.map((row) => row.selectionId)).toEqual([...PHASE8_BACON_SELECTION_IDS]);
    expect(rows.every((row) => row.status === "TERMINAL")).toBe(true);
    expect(rows.every((row) => row.phase9EvidenceRole === "model-development")).toBe(true);
    expect(JSON.stringify(rows)).toContain('"lower":0.6');
    expect(JSON.stringify(rows)).toContain('"upper":8');
    expect(JSON.stringify(rows)).toContain('"average":11.2');
    expect(JSON.stringify(rows)).toContain('"plusMinus":4.5');
    expect(JSON.stringify(rows)).toContain('"minimum":5.1');
    expect(JSON.stringify(rows)).toContain('"lowerBound":100');
    expect(rows.every((row) => JSON.stringify(row.numericExtraction) === JSON.stringify({
      coordinatesExtracted: false,
      plotDigitizationPerformed: false,
      printedAggregateValuesTranscribed: true,
      targetCoordinateRowCount: 0,
    }))).toBe(true);
  });

  it("normalizes derivative hollowing rows separately and verifies every published byte", () => {
    const inputs = fixture();
    const bundle = derivePhase8BaconSuccessorBundle(inputs);
    expect(new TextDecoder().decode(bundle.baconDataArtifacts.get("bacon-solid.tsv") as Uint8Array)).toBe(
      "source_row_index\ttemperature_c\tice_supersaturation_percent\tclassification\n" +
      "1\t-15.0\t4.5\tsolid\n" +
      "2\t-20.0\t8.25\tsolid\n",
    );
    expect(verifyPhase8BaconSuccessorArtifacts({
      selectionArtifacts: bundle.selectionArtifacts,
      baconMetadataArtifacts: bundle.baconMetadataArtifacts,
      baconDataArtifacts: bundle.baconDataArtifacts,
    }, inputs).derivativeClassificationRows).toBe(3);

    const changedData = new Map(bundle.baconDataArtifacts);
    const solid = (changedData.get("bacon-solid.tsv") as Uint8Array).slice();
    solid[solid.length - 2] = 88;
    changedData.set("bacon-solid.tsv", solid);
    expect(() => verifyPhase8BaconSuccessorArtifacts({
      selectionArtifacts: bundle.selectionArtifacts,
      baconMetadataArtifacts: bundle.baconMetadataArtifacts,
      baconDataArtifacts: changedData,
    }, inputs)).toThrow(/Bacon NAS data bacon-solid.tsv differs/);
  });

  it("fails closed on an absent archive-description member and caller-edited selection", () => {
    expect(() => derivePhase8BaconSuccessorBundle(fixture({ omitDescription: true })))
      .toThrow(/lacks a required member/);

    const inputs = fixture();
    const bundle = derivePhase8BaconSuccessorBundle(inputs);
    const changedSelection = new Map(bundle.selectionArtifacts);
    const selection = (changedSelection.get("selection.jsonl") as Uint8Array).slice();
    selection[10] = selection[10] === 65 ? 66 : 65;
    changedSelection.set("selection.jsonl", selection);
    expect(() => verifyPhase8BaconSuccessorArtifacts({
      selectionArtifacts: changedSelection,
      baconMetadataArtifacts: bundle.baconMetadataArtifacts,
      baconDataArtifacts: bundle.baconDataArtifacts,
    }, inputs)).toThrow(/selection-v2 selection.jsonl differs/);
  });
});
