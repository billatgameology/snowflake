// Phase 8B residual-audit correction: Bacon seed/history dependency and selection successor.
//
// The registered residual audit exposed one real selection miss. This producer preserves every
// v1 selection row byte-for-byte, adds two development-only P1 measurement sets, updates the residual
// set differences, transcribes only the source's printed aggregate statements, and normalizes the
// separately published Bacon hollowing digitizations to NAS-only TSV files.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import { phase8bReadZipInventory } from "./phase8-corpus-local.ts";

export const PHASE8_BACON_SUCCESSOR_OPERATOR = "phase8b-bacon-residual-correction-v1" as const;
export const PHASE8_BACON_SELECTION_OPERATOR = "phase8b-priority-selection-v2" as const;
export const PHASE8_BACON_SELECTION_IDS = [
  "P8B-P1-BACON-INITIATION-ASPECT",
  "P8B-P1-BACON-MASS-GROWTH-CONTRAST",
] as const;
export const PHASE8_BACON_SELECTION_ARTIFACTS = [
  "artifact-index.json",
  "backlog.json",
  "protocol.json",
  "report.json",
  "selection.jsonl",
] as const;
export const PHASE8_BACON_METADATA_ARTIFACTS = [
  "artifact-index.json",
  "records.jsonl",
  "report.json",
] as const;

export const PHASE8_BACON_PATHS = {
  historicalSelectionRoot: "evidence/phase8b-benchmark-selection-v1",
  localContainers: "evidence/phase8b-local-denominator/source-containers.jsonl",
  localUnits: "evidence/phase8b-local-denominator/source-units.jsonl",
  auditRegistration: "research/phase8b-residual-audit-registration.md",
  sourcePdf: "research-cache/content/bacon-baker-swanson-2003.pdf",
  sourceArchive:
    "research-cache/phase8b-search/targeted-sources-20260812-v1/harrington-pokrifka-hollowing-data-2023.zip",
  normalizedDataRoot: "research-cache/phase8b-derived/bacon-20260812-v1",
} as const;

export const PHASE8_BACON_TRIAGE_INPUTS = {
  focused: {
    path: "research-cache/phase8b-search/offline-title-triage-20260811-v1/focused-title-triage.jsonl",
    byteLength: 439_828,
    sha256: "e08923b4d636c86099eb33682d8d0bb654c461b26a2d09dfc2e1f900c8700e89",
  },
  author: {
    path: "research-cache/phase8b-search/offline-title-triage-20260811-v1/author-title-triage.jsonl",
    byteLength: 280_654,
    sha256: "3e7015adc8e94a85262e47caff7283318cf2f3018aa54ff11153a7bf796513df",
  },
  citation: {
    path: "research-cache/phase8b-search/offline-title-triage-20260811-v1/citation-title-triage.jsonl",
    byteLength: 532_659,
    sha256: "dfff67624d720af0baae8c0e4e6c9131b632c92482cf8579c7c03c6f9b9b7d0e",
  },
} as const;

const HISTORICAL_NAMES = [
  "artifact-index.json",
  "backlog.json",
  "protocol.json",
  "report.json",
  "selection.jsonl",
] as const;

const HISTORICAL_HASHES: Readonly<Record<(typeof HISTORICAL_NAMES)[number], string>> = {
  "artifact-index.json": "d7aa55169ede97585da39d78bbeba6f515a36624dba7660b02f37dec2f8e3863",
  "backlog.json": "9182633d66345247f6138461441f9a637780fa4a284496da4f2f97ec1658d20a",
  "protocol.json": "09b6087abe3f0d40f9dd42810a57c96e7c0ff214dc9e69dd750ce86a4861cfa9",
  "report.json": "54010691aa8a81876883b414a7a9e884d72c984f3e48cd3b377eb741b04931bc",
  "selection.jsonl": "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537",
};

const LOCAL_CONTAINER_SHA256 = "3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106";
const LOCAL_UNITS_SHA256 = "d806c220c6057eb0d80b44458c185acc61d25b9c7be6495e5c57f2a038a41178";
const AUDIT_REGISTRATION_SHA256 = "0235f013dcf91d6c0d05cc115ad00ba68ba967c8725f4cfb9b7b9ff392c39220";
const BACON_CONTAINER_ID = "P8B-CONT-755B3746D3762F0BD610671A";
const BACON_IDENTIFIER = "https://openalex.org/W2102420161";
const BACON_PAGE_UNITS = [
  { id: "P8B-UNIT-B0DCD7FDA387CB295CD769BB", locator: "pdf-page:10", printedPage: 1912 },
  { id: "P8B-UNIT-00226103BC70AD226DC0E8F7", locator: "pdf-page:11", printedPage: 1913 },
  { id: "P8B-UNIT-73FDF99ABAE79BC3B8CD9869", locator: "pdf-page:15", printedPage: 1917 },
] as const;

const ARCHIVE_ROOT =
  "harrington-pokrifka-laboratory-data-on-the-hollowing-of-atmospheric-ice-crystals-2023";
const SOLID_MEMBER = `${ARCHIVE_ROOT}/bacon-solid.csv`;
const FLORID_MEMBER = `${ARCHIVE_ROOT}/bacon-florid.csv`;
const DESCRIPTION_MEMBER = `${ARCHIVE_ROOT}/datadescription-hollowing.txt`;
const NUMBER_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export interface Phase8BaconRegistration {
  readonly scope: "registered-20260812" | "test-fixture";
  readonly sourcePdf: {
    readonly logicalPath: string;
    readonly byteLength: number;
    readonly sha256: string;
    readonly pageCount: number;
  };
  readonly sourceArchive: {
    readonly logicalPath: string;
    readonly byteLength: number;
    readonly sha256: string;
    readonly datasetRegistryId: string;
    readonly landingPage: string;
  };
  readonly archiveMembers: {
    readonly solid: { readonly path: string; readonly expectedRows: number };
    readonly florid: { readonly path: string; readonly expectedRows: number };
    readonly description: { readonly path: string };
  };
  readonly normalizedDataRoot: string;
}

export const PHASE8_BACON_REGISTERED: Phase8BaconRegistration = {
  scope: "registered-20260812",
  sourcePdf: {
    logicalPath: PHASE8_BACON_PATHS.sourcePdf,
    byteLength: 1_270_112,
    sha256: "f312a5a18889320c0be62d200c39db723bca2a1d68968b8ec308dc4789370530",
    pageCount: 25,
  },
  sourceArchive: {
    logicalPath: PHASE8_BACON_PATHS.sourceArchive,
    byteLength: 4_566,
    sha256: "977fcc882ab454f18e288fb5e7ef95cabba44ae59344c63eb74d45417a1e7121",
    datasetRegistryId: "Penn-State-Data-Commons-6381",
    landingPage:
      "https://www.datacommons.psu.edu/download/meteorology/harrington-pokrifka-laboratory-data-on-the-hollowing-of-atmospheric-ice-crystals-2023/",
  },
  archiveMembers: {
    solid: { path: SOLID_MEMBER, expectedRows: 71 },
    florid: { path: FLORID_MEMBER, expectedRows: 22 },
    description: { path: DESCRIPTION_MEMBER },
  },
  normalizedDataRoot: PHASE8_BACON_PATHS.normalizedDataRoot,
};

export const PHASE8_BACON_IMPLEMENTATION_PATHS = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-corpus-local.ts",
  "runner/src/phase8-bacon-successor.ts",
  "runner/test/phase8-bacon-successor.test.ts",
] as const;

type JsonObject = { readonly [key: string]: StrictJson };
type MutableObject = { [key: string]: unknown };

export interface Phase8BaconSuccessorInputs {
  readonly registration?: Phase8BaconRegistration;
  readonly historicalSelection: ReadonlyMap<string, Uint8Array>;
  readonly localContainersBytes: Uint8Array;
  readonly localUnitsBytes: Uint8Array;
  readonly auditRegistrationBytes: Uint8Array;
  readonly triage: {
    readonly focused: Uint8Array;
    readonly author: Uint8Array;
    readonly citation: Uint8Array;
  };
  readonly sourcePdfBytes: Uint8Array;
  readonly sourceArchiveBytes: Uint8Array;
  readonly implementation: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8BaconSuccessorBundle {
  readonly selectionArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly baconMetadataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly baconDataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly selectedRecords: 51;
    readonly p0: 18;
    readonly p1: 28;
    readonly p2: 5;
    readonly selectedLocalContainers: 4;
    readonly residualLocalContainers: 19;
    readonly selectedLocalUnits: 31;
    readonly residualLocalUnits: 883;
    readonly promotedIdentifiers: 9;
    readonly residualIdentifiers: 1544;
    readonly derivativeClassificationRows: number;
  };
}

interface ParsedCsv {
  readonly rows: readonly {
    readonly sourceRowIndex: number;
    readonly temperatureLexeme: string;
    readonly supersaturationLexeme: string;
  }[];
  readonly normalizedBytes: Uint8Array;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function mutable(value: unknown, label: string): MutableObject {
  return object(value, label) as MutableObject;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be nonempty`);
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
}

function jsonlLines(bytes: Uint8Array, label: string): readonly string[] {
  const text = decodeUtf8(bytes, label);
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${label} must be LF-terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${label} has a blank row`);
  for (const [index, line] of lines.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    if (canonicalJson(parsed) !== line) throw new Error(`${label} row ${index + 1} is not canonical JSON`);
  }
  return lines;
}

function parseJsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  return jsonlLines(bytes, label).map((line) => object(JSON.parse(line) as unknown, label));
}

function parseUpstreamJsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  const text = decodeUtf8(bytes, label);
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${label} must be LF-terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${label} has a blank row`);
  return lines.map((line, index) => {
    try {
      return object(JSON.parse(line) as unknown, `${label} row ${index + 1}`);
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
  });
}

function descriptor(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { path, format, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function pin(path: string, bytes: Uint8Array): JsonObject {
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function exactNames(actual: Iterable<string>, expected: readonly string[], label: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (canonicalJson(left) !== canonicalJson(right)) throw new Error(`${label} file set differs`);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function implementationPins(inputs: Phase8BaconSuccessorInputs): readonly JsonObject[] {
  exactNames(inputs.implementation.keys(), PHASE8_BACON_IMPLEMENTATION_PATHS, "implementation");
  return PHASE8_BACON_IMPLEMENTATION_PATHS.map((path) => pin(path, inputs.implementation.get(path) as Uint8Array));
}

function validateRegisteredInputs(inputs: Phase8BaconSuccessorInputs, registration: Phase8BaconRegistration): void {
  exactNames(inputs.historicalSelection.keys(), HISTORICAL_NAMES, "historical selection");
  if (registration.scope !== "registered-20260812") return;
  for (const name of HISTORICAL_NAMES) {
    const actual = sha256Bytes(inputs.historicalSelection.get(name) as Uint8Array);
    if (actual !== HISTORICAL_HASHES[name]) throw new Error(`historical ${name} hash differs`);
  }
  if (sha256Bytes(inputs.localContainersBytes) !== LOCAL_CONTAINER_SHA256) throw new Error("local containers hash differs");
  if (sha256Bytes(inputs.localUnitsBytes) !== LOCAL_UNITS_SHA256) throw new Error("local units hash differs");
  if (sha256Bytes(inputs.auditRegistrationBytes) !== AUDIT_REGISTRATION_SHA256) {
    throw new Error("residual audit registration hash differs");
  }
  if (
    inputs.sourcePdfBytes.byteLength !== registration.sourcePdf.byteLength ||
    sha256Bytes(inputs.sourcePdfBytes) !== registration.sourcePdf.sha256
  ) {
    throw new Error("Bacon source PDF bytes differ");
  }
  if (
    inputs.sourceArchiveBytes.byteLength !== registration.sourceArchive.byteLength ||
    sha256Bytes(inputs.sourceArchiveBytes) !== registration.sourceArchive.sha256
  ) {
    throw new Error("Bacon derivative archive bytes differ");
  }
  for (const key of ["focused", "author", "citation"] as const) {
    const expected = PHASE8_BACON_TRIAGE_INPUTS[key];
    const bytes = inputs.triage[key];
    if (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256) {
      throw new Error(`${key} triage bytes differ`);
    }
  }
}

function localIdentityChecks(inputs: Phase8BaconSuccessorInputs, registration: Phase8BaconRegistration): void {
  const containers = parseUpstreamJsonl(inputs.localContainersBytes, "local containers");
  const selected = containers.filter((row) => row.id === BACON_CONTAINER_ID);
  if (selected.length !== 1) throw new Error("Bacon source container is absent or duplicated");
  const container = selected[0] as Record<string, unknown>;
  if (
    container.relativePath !== "bacon-baker-swanson-2003.pdf" ||
    integer(object(container.extent, "Bacon container extent").count, "Bacon page count") !== registration.sourcePdf.pageCount
  ) {
    throw new Error("Bacon source container path or page count differs");
  }
  if (registration.scope === "registered-20260812" && (
    container.byteLength !== registration.sourcePdf.byteLength || container.sha256 !== registration.sourcePdf.sha256
  )) {
    throw new Error("Bacon source container does not bind the registered PDF bytes");
  }

  const units = parseUpstreamJsonl(inputs.localUnitsBytes, "local units");
  for (const expected of BACON_PAGE_UNITS) {
    const matches = units.filter((row) => row.id === expected.id);
    if (matches.length !== 1 || matches[0]?.containerId !== BACON_CONTAINER_ID || matches[0]?.locator !== expected.locator) {
      throw new Error(`Bacon source unit ${expected.id} differs`);
    }
  }
}

function matchedIds(row: Record<string, unknown>): readonly string[] {
  const ids: string[] = [];
  const add = (value: unknown): void => {
    if (typeof value === "string" && value.length > 0) ids.push(value);
  };
  const inspect = (value: unknown): void => {
    if (value === null || value === undefined) return;
    const match = object(value, "triage known match");
    add(match.recordId);
    add(match.sourceId);
    if (Array.isArray(match.recordIds)) for (const id of match.recordIds) add(id);
  };
  inspect(row.knownMatch);
  if (Array.isArray(row.knownMatches)) for (const match of row.knownMatches) inspect(match);
  return [...new Set(ids)].sort();
}

function findBaconCapturedIdentifier(inputs: Phase8BaconSuccessorInputs): string {
  const identifiers = new Set<string>();
  for (const key of ["focused", "author", "citation"] as const) {
    for (const row of parseUpstreamJsonl(inputs.triage[key], `${key} triage`)) {
      if (matchedIds(row).includes(BACON_CONTAINER_ID)) identifiers.add(string(row.identifier, "Bacon triage identifier"));
    }
  }
  if (identifiers.size !== 1 || !identifiers.has(BACON_IDENTIFIER)) {
    throw new Error(`Bacon captured identity differs: ${[...identifiers].sort().join(",")}`);
  }
  return BACON_IDENTIFIER;
}

function parseBaconCsv(bytes: Uint8Array, classification: "solid" | "florid", expectedRows: number): ParsedCsv {
  const text = decodeUtf8(bytes, `Bacon ${classification} member`);
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`Bacon ${classification} member must be LF-terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines[0] !== " temp  ice supersaturation" || lines[1] !== "  (C)    [%]") {
    throw new Error(`Bacon ${classification} header differs`);
  }
  const rows = lines.slice(2).map((line, index) => {
    const match = /^\s*([^\s]+)\s+([^\s]+)\s*$/.exec(line);
    if (match === null || !NUMBER_TOKEN.test(match[1] as string) || !NUMBER_TOKEN.test(match[2] as string)) {
      throw new Error(`Bacon ${classification} row ${index + 1} is malformed`);
    }
    const temperatureLexeme = match[1] as string;
    const supersaturationLexeme = match[2] as string;
    const temperature = Number(temperatureLexeme);
    const supersaturation = Number(supersaturationLexeme);
    if (!Number.isFinite(temperature) || !Number.isFinite(supersaturation) || supersaturation < 0) {
      throw new Error(`Bacon ${classification} row ${index + 1} is outside its numeric domain`);
    }
    return { sourceRowIndex: index + 1, temperatureLexeme, supersaturationLexeme };
  });
  if (rows.length !== expectedRows) {
    throw new Error(`Bacon ${classification} row count ${rows.length} differs from ${expectedRows}`);
  }
  const header = "source_row_index\ttemperature_c\tice_supersaturation_percent\tclassification\n";
  const body = rows.map((row) =>
    `${row.sourceRowIndex}\t${row.temperatureLexeme}\t${row.supersaturationLexeme}\t${classification}\n`).join("");
  return { rows, normalizedBytes: new TextEncoder().encode(`${header}${body}`) };
}

function archiveExtraction(inputs: Phase8BaconSuccessorInputs, registration: Phase8BaconRegistration): {
  readonly dataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly memberDescriptors: readonly JsonObject[];
  readonly normalizedDescriptors: readonly JsonObject[];
  readonly rowCount: number;
} {
  const inventory = phase8bReadZipInventory(inputs.sourceArchiveBytes);
  const byPath = new Map(inventory.regularMembers.map((member) => [member.path, member]));
  const solidMember = byPath.get(registration.archiveMembers.solid.path);
  const floridMember = byPath.get(registration.archiveMembers.florid.path);
  const descriptionMember = byPath.get(registration.archiveMembers.description.path);
  if (solidMember === undefined || floridMember === undefined || descriptionMember === undefined) {
    throw new Error("Bacon derivative archive lacks a required member");
  }
  const description = decodeUtf8(descriptionMember.bytes, "Bacon archive description");
  for (const phrase of [
    "data on the hollowing of crystals from prior publications",
    "crystals that remained solid during growth",
    "crystals that begain to hollow during growth",
  ]) {
    if (!description.includes(phrase)) throw new Error(`Bacon archive description lacks ${JSON.stringify(phrase)}`);
  }
  const solid = parseBaconCsv(solidMember.bytes, "solid", registration.archiveMembers.solid.expectedRows);
  const florid = parseBaconCsv(floridMember.bytes, "florid", registration.archiveMembers.florid.expectedRows);
  const dataArtifacts = new Map<string, Uint8Array>([
    ["bacon-solid.tsv", solid.normalizedBytes],
    ["bacon-florid.tsv", florid.normalizedBytes],
  ]);
  const memberDescriptors = [solidMember, floridMember, descriptionMember]
    .map((member): JsonObject => ({
      path: member.path,
      byteLength: member.byteLength,
      sha256: member.sha256,
      ...(member.path === solidMember.path ? { rowCount: solid.rows.length, classification: "solid" } : {}),
      ...(member.path === floridMember.path ? { rowCount: florid.rows.length, classification: "florid" } : {}),
    }))
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  const normalizedDescriptors = [...dataArtifacts.entries()].map(([path, bytes]): JsonObject => ({
    path,
    format: "tab-separated-source-lexemes",
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    rowCount: path.includes("solid") ? solid.rows.length : florid.rows.length,
  })).sort((left, right) => String(left.path).localeCompare(String(right.path)));
  return {
    dataArtifacts,
    memberDescriptors,
    normalizedDescriptors,
    rowCount: solid.rows.length + florid.rows.length,
  };
}

function baconSelectionRecords(): readonly JsonObject[] {
  const shared = {
    schema: "phase8b-benchmark-selection-v1",
    recordKind: "benchmark-selection",
    priorityClass: "P1",
    candidateModules: ["M-S"],
    phase9EvidenceRole: "model-development",
    numericTargetCoordinatesExtractedBeforeSelection: false,
    outcomeValueUsedAsSelectionCriterion: false,
    promotionTiming: {
      state: "post-registered-residual-audit-correction",
      sourceAggregatesInspectedBeforePromotion: true,
      plotCoordinatesDigitizedBeforePromotion: false,
      developmentOnlyBecauseSourceOutcomeWasExposed: true,
    },
  } as const;
  return [
    {
      ...shared,
      id: PHASE8_BACON_SELECTION_IDS[0],
      dependencies: [BACON_CONTAINER_ID, BACON_PAGE_UNITS[0].id, BACON_PAGE_UNITS[1].id],
      observable: "reported initiation-conditioned aspect-ratio summary",
      selectionBasis: "registered residual audit found a direct printed seed-versus-frozen-droplet aspect-ratio table block",
      sourceLocator: `${BACON_CONTAINER_ID};pdf-page:10;printed-page:1912;Table 1`,
    },
    {
      ...shared,
      id: PHASE8_BACON_SELECTION_IDS[1],
      dependencies: [BACON_CONTAINER_ID, BACON_PAGE_UNITS[2].id],
      observable: "reported initiation-conditioned mass-growth-factor contrast",
      selectionBasis: "registered residual audit found a direct printed seed-versus-frozen-droplet mass-growth contrast",
      sourceLocator: `${BACON_CONTAINER_ID};pdf-page:15;printed-page:1917;section 5(c)(iii)`,
    },
  ];
}

function selectionRows(inputs: Phase8BaconSuccessorInputs): Uint8Array {
  const historical = inputs.historicalSelection.get("selection.jsonl") as Uint8Array;
  const historicalLines = jsonlLines(historical, "historical selection.jsonl");
  if (historicalLines.length !== 49) throw new Error("historical selection must contain 49 rows");
  const rows = historicalLines.map((line) => ({ line, id: string(object(JSON.parse(line), "selection row").id, "selection ID") }));
  for (const record of baconSelectionRecords()) {
    rows.push({ line: canonicalJson(record), id: string(record.id, "Bacon selection ID") });
  }
  rows.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  if (new Set(rows.map((row) => row.id)).size !== 51) throw new Error("successor selection has duplicate IDs");
  return new TextEncoder().encode(`${rows.map((row) => row.line).join("\n")}\n`);
}

function successorBacklog(inputs: Phase8BaconSuccessorInputs): Uint8Array {
  const historicalBytes = inputs.historicalSelection.get("backlog.json") as Uint8Array;
  const backlog = mutable(JSON.parse(JSON.stringify(parseCanonicalJson(historicalBytes, "historical backlog"))) as unknown, "backlog");
  backlog.schema = "phase8b-benchmark-backlog-v2";
  backlog.operator = PHASE8_BACON_SELECTION_OPERATOR;

  const containers = mutable(backlog.localContainers, "backlog.localContainers");
  const containerIds = array(containers.selectedIds, "selected container IDs").map((value) => string(value, "container ID"));
  if (containerIds.includes(BACON_CONTAINER_ID)) throw new Error("historical backlog already selects Bacon container");
  containers.selectedIds = [...containerIds, BACON_CONTAINER_ID].sort();
  containers.residualCount = integer(containers.residualCount, "residual container count") - 1;

  const units = mutable(backlog.localUnits, "backlog.localUnits");
  const unitIds = array(units.selectedIds, "selected unit IDs").map((value) => string(value, "unit ID"));
  for (const selected of BACON_PAGE_UNITS) {
    if (unitIds.includes(selected.id)) throw new Error(`historical backlog already selects ${selected.id}`);
    unitIds.push(selected.id);
  }
  units.selectedIds = unitIds.sort();
  units.residualCount = integer(units.residualCount, "residual unit count") - BACON_PAGE_UNITS.length;
  const reasons = mutable(units.deterministicReasonCounts, "local-unit reasons");
  reasons.NO_CURRENT_P0_P1_P2_ROLE = integer(reasons.NO_CURRENT_P0_P1_P2_ROLE, "nonpriority unit count") - BACON_PAGE_UNITS.length;

  const identifiers = mutable(backlog.capturedIdentifiers, "backlog.capturedIdentifiers");
  const promoted = array(identifiers.promotedIdentifiers, "promoted identifiers")
    .map((value) => string(value, "promoted identifier"));
  const baconIdentifier = findBaconCapturedIdentifier(inputs);
  if (promoted.includes(baconIdentifier)) throw new Error("historical backlog already promotes Bacon identifier");
  identifiers.promotedIdentifiers = [...promoted, baconIdentifier].sort();
  identifiers.residualCount = integer(identifiers.residualCount, "residual identifier count") - 1;
  return canonicalJsonBytes(backlog);
}

function baconRecords(registration: Phase8BaconRegistration): readonly JsonObject[] {
  const shared = {
    schema: "phase8b-bacon-aggregate-record-v1",
    recordKind: "phase8b-bacon-aggregate-measurement-set",
    priorityClass: "P1",
    status: "TERMINAL",
    phase9EvidenceRole: "model-development",
    disposition: "terminal-direct-reported-aggregate-development",
    sourceIdentity: {
      containerId: BACON_CONTAINER_ID,
      title: "Initial stages in the morphological evolution of vapour-grown ice crystals: A laboratory investigation",
      authors: ["Neil J. Bacon", "Marcia B. Baker", "Brian D. Swanson"],
      year: 2003,
      doi: "10.1256/qj.02.04",
      logicalPath: registration.sourcePdf.logicalPath,
      byteLength: registration.sourcePdf.byteLength,
      sha256: registration.sourcePdf.sha256,
      pageCount: registration.sourcePdf.pageCount,
    },
    numericExtraction: {
      coordinatesExtracted: false,
      targetCoordinateRowCount: 0,
      plotDigitizationPerformed: false,
      printedAggregateValuesTranscribed: true,
    },
    plotDisposition: {
      figures: ["Figure 6", "Figure 7"],
      status: "not-digitized-for-current-benchmark",
      reason: "the printed table and prose aggregates directly answer the current categorical M-S discriminator; per-particle coordinates are not needed for that use and remain confounded by initial size and mass-growth history",
    },
    rights: {
      sourcePdf: "NAS-only; redistribution not established",
      gitPublication: "metadata, hashes, source locators, and short factual transcriptions only",
    },
  } as const;
  return [
    {
      ...shared,
      selectionId: PHASE8_BACON_SELECTION_IDS[0],
      observable: "initiation-conditioned final aspect-ratio summary",
      sourceUnitIds: [BACON_PAGE_UNITS[0].id, BACON_PAGE_UNITS[1].id],
      sourceLocator: "pdf-page:10;printed-page:1912;Table 1;context on pdf-page:11",
      reportedValues: [
        {
          group: "droplet-initiated",
          specimen: "compact particles grown to final size 100-200 micrometers",
          aspectRatio: { kind: "reported-range", lower: 0.6, upper: 1.5, unit: "dimensionless c-axis/a-axis" },
        },
        {
          group: "seed-initiated",
          specimen: "particles grown to final size 100-200 micrometers",
          aspectRatio: {
            kind: "reported-range-with-qualifier",
            lower: 0.4,
            upper: 8,
            unit: "dimensionless c-axis/a-axis",
            qualifier: "few with 0.8 < aspect ratio < 1.2",
            qualifierCountReported: false,
          },
        },
      ],
      contextualFindings: [
        {
          locator: "pdf-page:10;printed-page:1912;paragraph below Table 1",
          report: "in several cases both thick plates and short columns occurred at the same temperature and humidity conditions",
          caseCountReported: false,
          exactConditionsReportedHere: false,
        },
        {
          locator: "pdf-page:11;printed-page:1913;paragraph below Figure 7",
          specimen: "seed-initiated particles starting below 10 micrometers",
          report: "tended to form hexagonal prism-like single crystals across the temperatures studied; polycrystalline or florid particles were seldom observed; faces were sharper and flatter and aspect ratios varied widely under similar reported conditions",
        },
      ],
      measurementContext: {
        aspectRatioDefinition: "longest c-axis dimension divided by longest a-axis dimension",
        reportedAspectRatioMeasurementError: {
          absolute: 0.2,
          unit: "dimensionless",
          meaning: "conservative estimate due to particle-alignment uncertainty",
          locator: "pdf-page:9;printed-page:1911;section 4(a)",
        },
        ensembleDenominatorReported: false,
      },
      phase9Use: {
        candidateModule: "M-S",
        supports: "a categorical formation-history intervention and an aspect-range confrontation",
        doesNotSupport: "a fitted event frequency, universal temperature law, or held-out validation score",
      },
    },
    {
      ...shared,
      selectionId: PHASE8_BACON_SELECTION_IDS[1],
      observable: "initiation-conditioned final-to-initial mass-growth-factor contrast",
      sourceUnitIds: [BACON_PAGE_UNITS[2].id],
      sourceLocator: "pdf-page:15;printed-page:1917;section 5(c)(iii)",
      reportedValues: [
        {
          group: "frozen-droplet",
          specimen: "particles shown in Figure 6",
          massGrowthFactor: {
            kind: "reported-average-spread-and-minimum",
            average: 11.2,
            plusMinus: 4.5,
            plusMinusMeaning: "not identified by the source as standard deviation, standard error, or range",
            minimum: 5.1,
            unit: "dimensionless final-to-initial mass factor",
          },
        },
        {
          group: "seed-initiated",
          specimen: "earlier experiments represented by Figure 7",
          massGrowthFactor: {
            kind: "reported-lower-bound",
            lowerBound: 100,
            boundExclusive: true,
            sourceExpression: "more than 10^2",
            unit: "dimensionless final-to-initial mass factor",
          },
        },
      ],
      measurementContext: {
        finalSize: { lower: 100, upper: 200, unit: "micrometers" },
        ensembleDenominatorReported: false,
        sourceInternalCaution: "the same paragraph first describes frozen drops as growing by not more than a factor of 10, then reports Figure 6 average 11.2 plus or minus 4.5; both statements are preserved and the numeric aggregate is not silently reconciled",
      },
      phase9Use: {
        candidateModule: "M-S",
        supports: "explicit control of mass-growth history when comparing seed classes",
        doesNotSupport: "attributing the aspect contrast to initiation alone without matching initial size and mass history",
      },
    },
  ];
}

function deriveBaconMetadata(
  inputs: Phase8BaconSuccessorInputs,
  registration: Phase8BaconRegistration,
  extraction: ReturnType<typeof archiveExtraction>,
  implementation: readonly JsonObject[],
): ReadonlyMap<string, Uint8Array> {
  const recordsBytes = new TextEncoder().encode(
    `${baconRecords(registration).map((record) => canonicalJson(record)).join("\n")}\n`,
  );
  const report = canonicalJsonBytes({
    schema: "phase8b-bacon-aggregate-report-v1",
    operator: PHASE8_BACON_SUCCESSOR_OPERATOR,
    status: "terminal-development-only",
    counts: {
      records: 2,
      directMeasurementSets: 2,
      reportedNumericAggregates: 4,
      contextualQualitativeFindings: 2,
      numericCoordinateRows: 0,
      derivativeClassificationRows: extraction.rowCount,
      derivativeSolidRows: registration.archiveMembers.solid.expectedRows,
      derivativeFloridRows: registration.archiveMembers.florid.expectedRows,
    },
    sourcePdf: pin(registration.sourcePdf.logicalPath, inputs.sourcePdfBytes),
    sourceArchive: pin(registration.sourceArchive.logicalPath, inputs.sourceArchiveBytes),
    sourceArchiveMembers: extraction.memberDescriptors,
    derivativeArchiveRelationship:
      "third-party-released Bacon hollowing digitization; separate from and not evidence for the seed/history comparison",
    normalizedData: {
      logicalRoot: registration.normalizedDataRoot,
      artifacts: extraction.normalizedDescriptors,
      rightsStatus: "NAS-only-pending-redistribution-determination",
    },
    implementation,
    scope: {
      phase9EvidenceRole: "model-development",
      grantsValidationClaim: false,
      digitizesBaconPlots: false,
      figuresSixAndSevenNeededForCurrentDiscriminator: false,
      derivativeRowsMeasureSeedHistory: false,
    },
    recordArtifact: descriptor("records.jsonl", recordsBytes, "canonical-jsonl"),
  });
  const index = canonicalJsonBytes({
    schema: "phase8b-bacon-seed-history-index-v1",
    operator: PHASE8_BACON_SUCCESSOR_OPERATOR,
    artifacts: [
      descriptor("records.jsonl", recordsBytes, "canonical-jsonl"),
      descriptor("report.json", report, "canonical-json"),
    ],
  });
  return new Map([
    ["artifact-index.json", index],
    ["records.jsonl", recordsBytes],
    ["report.json", report],
  ]);
}

function deriveSelectionMetadata(
  inputs: Phase8BaconSuccessorInputs,
  selection: Uint8Array,
  backlog: Uint8Array,
  implementation: readonly JsonObject[],
): ReadonlyMap<string, Uint8Array> {
  const historical = HISTORICAL_NAMES.map((name) => pin(
    `${PHASE8_BACON_PATHS.historicalSelectionRoot}/${name}`,
    inputs.historicalSelection.get(name) as Uint8Array,
  ));
  const protocol = canonicalJsonBytes({
    schema: "phase8b-benchmark-selection-protocol-v2",
    operator: PHASE8_BACON_SELECTION_OPERATOR,
    authority: "decision-0048-and-charter-v1.25",
    cutoffDate: "2026-08-12",
    parentSelection: {
      operator: "phase8b-priority-selection-v1",
      artifacts: historical,
      rowsPreservedIndividuallyByteExact: true,
      recordCount: 49,
    },
    correctionTrigger: {
      registeredAudit: pin(PHASE8_BACON_PATHS.auditRegistration, inputs.auditRegistrationBytes),
      sampledContainerId: BACON_CONTAINER_ID,
      finding: "one genuine missed source containing two direct seed/history measurement sets",
      correction: `add ${PHASE8_BACON_SELECTION_IDS.join(" and ")} and remove their container, three pages, and captured identity from the residual backlog`,
    },
    promotionPolicy: {
      sourceAggregatesWereVisibleBeforePromotion: true,
      favorableOutcomeSelected: false,
      rationale: "membership follows the direct seed-versus-droplet intervention and Phase 9 module dependency regardless of effect direction or magnitude",
      phase9EvidenceRole: "model-development",
      heldOutUseForbidden: true,
      plotDigitizationAuthorized: false,
    },
    residualPolicy: {
      representation: "v1 exact set differences with one audited source promotion containing two P1 measurement sets",
      broadAcquisitionAuthorized: false,
      allOtherResidualReasonsPreserved: true,
    },
    trackedInputs: [
      pin(PHASE8_BACON_PATHS.localContainers, inputs.localContainersBytes),
      pin(PHASE8_BACON_PATHS.localUnits, inputs.localUnitsBytes),
    ],
    nasTriageInputs: (["focused", "author", "citation"] as const).map((key) => ({
      sourceKey: key,
      ...pin(PHASE8_BACON_TRIAGE_INPUTS[key].path, inputs.triage[key]),
    })),
    implementation,
  });
  const report = canonicalJsonBytes({
    schema: "phase8b-benchmark-selection-report-v2",
    operator: PHASE8_BACON_SELECTION_OPERATOR,
    state: "successor-frozen-after-registered-residual-audit-correction",
    counts: {
      p0: 18,
      p1: 28,
      p2: 5,
      selectedRecords: 51,
      selectedLocalContainerCount: 4,
      residualLocalContainerCount: 19,
      selectedLocalUnitCount: 31,
      residualLocalUnitCount: 883,
      selectedAcquiredSourceCount: 5,
      residualAcquiredSourceCount: 23,
      exactIdentifierCount: 1553,
      promotedIdentifierCount: 9,
      residualIdentifierCount: 1544,
    },
    scope: {
      parentRowsPreserved: 49,
      addedP1Records: 2,
      allRecordsModelDevelopment: true,
      heldOutRecords: 0,
      original49SelectedBeforeTargetCoordinates: true,
      addedP1PlotCoordinatesExtracted: false,
      addedP1SourceAggregatesInspectedBeforePromotion: true,
      favorableOutcomeUsedForPromotion: false,
      claimsGlobalSearchSaturation: false,
      grantsValidationClaim: false,
    },
    artifacts: [
      descriptor("backlog.json", backlog, "canonical-json"),
      descriptor("protocol.json", protocol, "canonical-json"),
      descriptor("selection.jsonl", selection, "canonical-jsonl"),
    ],
  });
  const index = canonicalJsonBytes({
    schema: "phase8b-benchmark-selection-index-v2",
    operator: PHASE8_BACON_SELECTION_OPERATOR,
    artifacts: [
      descriptor("backlog.json", backlog, "canonical-json"),
      descriptor("protocol.json", protocol, "canonical-json"),
      descriptor("report.json", report, "canonical-json-report"),
      descriptor("selection.jsonl", selection, "canonical-jsonl"),
    ],
  });
  return new Map([
    ["artifact-index.json", index],
    ["backlog.json", backlog],
    ["protocol.json", protocol],
    ["report.json", report],
    ["selection.jsonl", selection],
  ]);
}

export function derivePhase8BaconSuccessorBundle(inputs: Phase8BaconSuccessorInputs): Phase8BaconSuccessorBundle {
  const registration = inputs.registration ?? PHASE8_BACON_REGISTERED;
  validateRegisteredInputs(inputs, registration);
  localIdentityChecks(inputs, registration);
  const implementation = implementationPins(inputs);
  const extraction = archiveExtraction(inputs, registration);
  const selection = selectionRows(inputs);
  const backlog = successorBacklog(inputs);
  const selectionArtifacts = deriveSelectionMetadata(inputs, selection, backlog, implementation);
  const baconMetadataArtifacts = deriveBaconMetadata(inputs, registration, extraction, implementation);
  return {
    selectionArtifacts,
    baconMetadataArtifacts,
    baconDataArtifacts: extraction.dataArtifacts,
    counts: {
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
      derivativeClassificationRows: extraction.rowCount,
    },
  };
}

function compareArtifacts(
  actual: ReadonlyMap<string, Uint8Array>,
  expected: ReadonlyMap<string, Uint8Array>,
  label: string,
): void {
  exactNames(actual.keys(), [...expected.keys()], label);
  for (const [name, expectedBytes] of expected) {
    const actualBytes = actual.get(name) as Uint8Array;
    if (!bytesEqual(actualBytes, expectedBytes)) throw new Error(`${label} ${name} differs from re-derivation`);
  }
}

export function verifyPhase8BaconSuccessorArtifacts(
  published: {
    readonly selectionArtifacts: ReadonlyMap<string, Uint8Array>;
    readonly baconMetadataArtifacts: ReadonlyMap<string, Uint8Array>;
    readonly baconDataArtifacts: ReadonlyMap<string, Uint8Array>;
  },
  inputs: Phase8BaconSuccessorInputs,
): Phase8BaconSuccessorBundle["counts"] {
  const expected = derivePhase8BaconSuccessorBundle(inputs);
  compareArtifacts(published.selectionArtifacts, expected.selectionArtifacts, "selection-v2");
  compareArtifacts(published.baconMetadataArtifacts, expected.baconMetadataArtifacts, "Bacon metadata");
  compareArtifacts(published.baconDataArtifacts, expected.baconDataArtifacts, "Bacon NAS data");
  return expected.counts;
}

function readDirectory(path: string, names: readonly string[], label: string): ReadonlyMap<string, Uint8Array> {
  if (!existsSync(path)) throw new Error(`${label} directory is missing: ${path}`);
  exactNames(readdirSync(path), names, label);
  return new Map(names.map((name) => [name, new Uint8Array(readFileSync(join(path, name)))]));
}

function writeDirectory(path: string, artifacts: ReadonlyMap<string, Uint8Array>): void {
  if (existsSync(path)) throw new Error(`refusing to replace existing directory: ${path}`);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  mkdirSync(temporary, { recursive: false });
  try {
    for (const [name, bytes] of artifacts) writeFileSync(join(temporary, name), bytes, { flag: "wx" });
    renameSync(temporary, path);
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
}

export function captureRegisteredPhase8BaconSuccessorInputs(options: {
  readonly repositoryRoot: string;
  readonly contentRoot: string;
  readonly triageRoot: string;
  readonly sourceArchivePath: string;
}): Phase8BaconSuccessorInputs {
  const root = resolve(options.repositoryRoot);
  const historicalRoot = join(root, PHASE8_BACON_PATHS.historicalSelectionRoot);
  const implementation = new Map(PHASE8_BACON_IMPLEMENTATION_PATHS.map((path) =>
    [path, new Uint8Array(readFileSync(join(root, path)))] as const));
  return {
    registration: PHASE8_BACON_REGISTERED,
    historicalSelection: new Map(HISTORICAL_NAMES.map((name) =>
      [name, new Uint8Array(readFileSync(join(historicalRoot, name)))] as const)),
    localContainersBytes: new Uint8Array(readFileSync(join(root, PHASE8_BACON_PATHS.localContainers))),
    localUnitsBytes: new Uint8Array(readFileSync(join(root, PHASE8_BACON_PATHS.localUnits))),
    auditRegistrationBytes: new Uint8Array(readFileSync(join(root, PHASE8_BACON_PATHS.auditRegistration))),
    triage: {
      focused: new Uint8Array(readFileSync(join(options.triageRoot, "focused-title-triage.jsonl"))),
      author: new Uint8Array(readFileSync(join(options.triageRoot, "author-title-triage.jsonl"))),
      citation: new Uint8Array(readFileSync(join(options.triageRoot, "citation-title-triage.jsonl"))),
    },
    sourcePdfBytes: new Uint8Array(readFileSync(join(options.contentRoot, "bacon-baker-swanson-2003.pdf"))),
    sourceArchiveBytes: new Uint8Array(readFileSync(options.sourceArchivePath)),
    implementation,
  };
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-bacon-successor.ts <produce|verify> " +
    "--content-root <path> --triage-root <path> --source-archive <path> " +
    "--selection-bundle <path> --bacon-bundle <path> --data-root <path>",
  );
}

function parseCli(argv: readonly string[]): {
  readonly command: "produce" | "verify";
  readonly contentRoot: string;
  readonly triageRoot: string;
  readonly sourceArchive: string;
  readonly selectionBundle: string;
  readonly baconBundle: string;
  readonly dataRoot: string;
} {
  const command = argv[0];
  if (command !== "produce" && command !== "verify") return usage();
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--") || value.startsWith("--")) return usage();
    if (values.has(flag)) throw new Error(`duplicate option ${flag}`);
    values.set(flag, value);
  }
  const required = ["--content-root", "--triage-root", "--source-archive", "--selection-bundle", "--bacon-bundle", "--data-root"] as const;
  if (values.size !== required.length || required.some((flag) => !values.has(flag))) return usage();
  return {
    command,
    contentRoot: resolve(values.get("--content-root") as string),
    triageRoot: resolve(values.get("--triage-root") as string),
    sourceArchive: resolve(values.get("--source-archive") as string),
    selectionBundle: resolve(values.get("--selection-bundle") as string),
    baconBundle: resolve(values.get("--bacon-bundle") as string),
    dataRoot: resolve(values.get("--data-root") as string),
  };
}

function runCli(argv: readonly string[]): void {
  const options = parseCli(argv);
  const repositoryRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const inputs = captureRegisteredPhase8BaconSuccessorInputs({
    repositoryRoot,
    contentRoot: options.contentRoot,
    triageRoot: options.triageRoot,
    sourceArchivePath: options.sourceArchive,
  });
  if (options.command === "produce") {
    for (const path of [options.selectionBundle, options.baconBundle, options.dataRoot]) {
      if (existsSync(path)) throw new Error(`refusing to replace existing directory: ${path}`);
    }
    const bundle = derivePhase8BaconSuccessorBundle(inputs);
    const written: string[] = [];
    try {
      writeDirectory(options.selectionBundle, bundle.selectionArtifacts);
      written.push(options.selectionBundle);
      writeDirectory(options.baconBundle, bundle.baconMetadataArtifacts);
      written.push(options.baconBundle);
      writeDirectory(options.dataRoot, bundle.baconDataArtifacts);
      written.push(options.dataRoot);
    } catch (error) {
      for (const path of written) rmSync(path, { recursive: true, force: true });
      throw error;
    }
    process.stdout.write(`${canonicalJson({ ok: true, command: "produce", counts: bundle.counts })}\n`);
    return;
  }
  const counts = verifyPhase8BaconSuccessorArtifacts({
    selectionArtifacts: readDirectory(options.selectionBundle, PHASE8_BACON_SELECTION_ARTIFACTS, "selection-v2"),
    baconMetadataArtifacts: readDirectory(options.baconBundle, PHASE8_BACON_METADATA_ARTIFACTS, "Bacon metadata"),
    baconDataArtifacts: readDirectory(options.dataRoot, ["bacon-florid.tsv", "bacon-solid.tsv"], "Bacon NAS data"),
  }, inputs);
  process.stdout.write(`${canonicalJson({ ok: true, command: "verify", counts })}\n`);
}

const invokedPath = process.argv[1] === undefined ? "" : resolve(process.argv[1]);
if (invokedPath !== "" && pathToFileURL(invokedPath).href === import.meta.url) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
