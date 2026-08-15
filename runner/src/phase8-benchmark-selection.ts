// Phase 8B priority-benchmark selection freeze.
//
// This boundary selects source units and display series before numeric coordinates are read. It
// deliberately keeps the residual universe as set-difference rules over accepted upstream bytes
// instead of copying 1,553 discovery records into a second database.

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
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE8B_SELECTION_SCHEMA = "phase8b-benchmark-selection-v1" as const;
export const PHASE8B_SELECTION_OPERATOR = "phase8b-priority-selection-v1" as const;
export const PHASE8B_SELECTION_ARTIFACT_NAMES = [
  "artifact-index.json",
  "backlog.json",
  "protocol.json",
  "report.json",
  "selection.jsonl",
] as const;

export const PHASE8B_SELECTION_TRACKED_INPUTS = {
  localArtifactIndex: "evidence/phase8b-local-denominator/artifact-index.json",
  localContainers: "evidence/phase8b-local-denominator/source-containers.jsonl",
  localUnits: "evidence/phase8b-local-denominator/source-units.jsonl",
  reconnaissanceArtifactIndex: "evidence/phase8b-s2-round0-reconnaissance/artifact-index.json",
  acquiredSources: "evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl",
  targetBook: "research/phase8-target-book.jsonl",
} as const;

export const PHASE8B_SELECTION_NAS_INPUTS = {
  focused: {
    logicalPath: "research-cache/phase8b-search/offline-title-triage-20260811-v1/focused-title-triage.jsonl",
    byteLength: 439_828,
    sha256: "e08923b4d636c86099eb33682d8d0bb654c461b26a2d09dfc2e1f900c8700e89",
    recordCount: 513,
  },
  author: {
    logicalPath: "research-cache/phase8b-search/offline-title-triage-20260811-v1/author-title-triage.jsonl",
    byteLength: 280_654,
    sha256: "3e7015adc8e94a85262e47caff7283318cf2f3018aa54ff11153a7bf796513df",
    recordCount: 293,
  },
  citation: {
    logicalPath: "research-cache/phase8b-search/offline-title-triage-20260811-v1/citation-title-triage.jsonl",
    byteLength: 532_659,
    sha256: "dfff67624d720af0baae8c0e4e6c9131b632c92482cf8579c7c03c6f9b9b7d0e",
    recordCount: 852,
  },
} as const;

const SOURCE_PATHS = [
  "runner/src/phase8-benchmark-selection.ts",
  "runner/test/phase8-benchmark-selection.test.ts",
] as const;

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8bSelectionInputs {
  readonly scope?: "registered" | "test-fixture";
  readonly tracked: ReadonlyMap<string, Uint8Array>;
  readonly triage: {
    readonly focused: Uint8Array;
    readonly author: Uint8Array;
    readonly citation: Uint8Array;
  };
  readonly implementation: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8bSelectionBundle {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly p0: number;
    readonly p1: number;
    readonly p2: number;
    readonly selectedLocalUnitCount: number;
    readonly residualLocalUnitCount: number;
    readonly selectedAcquiredSourceCount: number;
    readonly residualAcquiredSourceCount: number;
    readonly exactIdentifierCount: number;
    readonly promotedIdentifierCount: number;
    readonly residualIdentifierCount: number;
  };
}

interface LocalUnit {
  readonly id: string;
  readonly containerId: string;
  readonly containerPath: string;
  readonly locator: string;
  readonly memberPath: string | null;
}

interface AcquiredSource {
  readonly sourceId: string;
  readonly provisionalScopeBucket: string;
}

interface TriageOccurrence {
  readonly identifier: string;
  readonly sourceKey: "focused" | "author" | "citation";
  readonly line: number;
  readonly matchedIds: readonly string[];
  readonly hasReason: boolean;
}

const P0_UNITS = [
  ["P8B-UNIT-10C734F0C6C31B5904B10BE7", "dimension-history"],
  ["P8B-UNIT-2CF2C2C5B3A6900FC3F9CDDA", "dimension-history"],
  ["P8B-UNIT-2CEE953BBC0243F9A214005F", "mass-ratio-history"],
  ["P8B-UNIT-D37E50BA5B73C60418AC7078", "mass-ratio-history"],
  ["P8B-UNIT-D35BE7104F02E7551CFEDC0C", "mass-ratio-history"],
  ["P8B-UNIT-DBEC7A33DFCCD81A3E66906A", "mass-ratio-history"],
  ["P8B-UNIT-3BBE89E3D3B1429A8DC127E0", "mass-ratio-history"],
  ["P8B-UNIT-85E829413C55ABDE9FA35B1C", "mass-ratio-history"],
  ["P8B-UNIT-20D9F95FE223A7AB67209A30", "mass-ratio-history"],
  ["P8B-UNIT-D6442E662770C35854FB2D8B", "mass-ratio-history"],
  ["P8B-UNIT-4CB1637CA175FA4D94EF6063", "mass-ratio-history"],
  ["P8B-UNIT-F3E2FF9C322C58220A773D99", "mass-ratio-history"],
  ["P8B-UNIT-C8D909E75461AEEEFBF0B365", "mass-ratio-history"],
  ["P8B-UNIT-831531AE323523A95D510307", "mass-ratio-history"],
  ["P8B-UNIT-A6FA0826C9C2852672C2B87A", "mass-ratio-history"],
  ["P8B-UNIT-8376DA186B16D7C1C8F650BD", "mass-ratio-history"],
  ["P8B-UNIT-5C37491C76718529DA5A4C93", "mass-ratio-history"],
  ["P8B-UNIT-25FF44515D32E7473616AC2A", "mass-ratio-history"],
] as const;

const P2_LOCAL_UNIT_IDS = [
  "P8B-UNIT-30617A3EC7F916985CBF8286",
  "P8B-UNIT-15CD54E461D8E4DBE9088223",
  "P8B-UNIT-06EF743E8FB45CE7024DE2AB",
  "P8B-UNIT-8EB1CE17EA1223DB85FCAB75",
  "P8B-UNIT-D2473890EDB3FD6BC21F94E6",
  "P8B-UNIT-FD055F2F028BF562E62513EB",
  "P8B-UNIT-14C3EDE87642E08D9D3CCC43",
  "P8B-UNIT-76CB065A2E7B602E49024D27",
  "P8B-UNIT-CE5858AA413297EA828851B7",
  "P8B-UNIT-7DB41288CD8BAD7E6132C59E",
] as const;

const SELECTED_LOCAL_CONTAINER_IDS = [
  "P8B-CONT-1034F981B47FACA23A038372",
  "P8B-CONT-21F26713EF4DDC626CDFD820",
  "P8B-CONT-31C9AE8E361BC8BD92F402E3",
] as const;

const P1_SOURCE_IDS = [
  "P8B-S2R0-2EA39D1BD3D62F87101CF104",
  "P8B-S2R0-5EF679012E89A00B20AEC8C7",
  "P8B-S2R0-7100720EAA6B8458FB4BBDD2",
  "P8B-S2R0-909CDB8504D9CFC72F703634",
] as const;

const P2_SOURCE_IDS = [
  "P8B-S2R0-D15EF2E38A0B1D94D4340292",
  "P8B-S2R0-909CDB8504D9CFC72F703634",
] as const;

const SELECTED_ACQUIRED_SOURCE_IDS = [...new Set([...P1_SOURCE_IDS, ...P2_SOURCE_IDS])].sort();
const SELECTED_ACQUIRED_SOURCE_ID_SET = new Set<string>(SELECTED_ACQUIRED_SOURCE_IDS);
const SELECTED_IDENTITY_IDS = new Set<string>([
  ...SELECTED_LOCAL_CONTAINER_IDS,
  ...SELECTED_ACQUIRED_SOURCE_IDS,
]);

const TARGET_BOOK_IDS = [
  "P8-I-ALPHAHK-CROSS-LAB",
  "P8-I-LIBBRECHT-KINETICS",
  "P8-T-HP26-RIM-HISTORY",
  "P8-T-LEVITATION-MASS-RATIO",
  "P8-T-LEVITATION-POWER",
  "P8-T-LEVITATION-SCALED",
] as const;

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be nonempty`);
  return value;
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function pin(path: string, bytes: Uint8Array): JsonObject {
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function parseJsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n") || text.includes("\r")) throw new Error(`${label} must be LF-terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.some((line) => line.length === 0)) throw new Error(`${label} contains a blank line`);
  return lines.map((line, index) => {
    const value = JSON.parse(line) as unknown;
    return asObject(value, `${label} line ${index + 1}`);
  });
}

function trackedInput(inputs: Phase8bSelectionInputs, path: string): Uint8Array {
  const bytes = inputs.tracked.get(path);
  if (bytes === undefined) throw new Error(`missing tracked selection input: ${path}`);
  return bytes;
}

function parseLocalUnits(bytes: Uint8Array): readonly LocalUnit[] {
  const units = parseJsonl(bytes, "local source units").map((record): LocalUnit => ({
    id: asString(record.id, "local unit id"),
    containerId: asString(record.containerId, "local unit containerId"),
    containerPath: asString(record.containerPath, "local unit containerPath"),
    locator: asString(record.locator, "local unit locator"),
    memberPath: record.memberPath === null ? null : asString(record.memberPath, "local unit memberPath"),
  }));
  if (new Set(units.map((unit) => unit.id)).size !== units.length) throw new Error("duplicate local unit id");
  return units;
}

function parseAcquiredSources(bytes: Uint8Array): readonly AcquiredSource[] {
  const sources = parseJsonl(bytes, "acquired source register").map((record): AcquiredSource => ({
    sourceId: asString(record.sourceId, "acquired source id"),
    provisionalScopeBucket: asString(record.provisionalScopeBucket, "acquired source scope bucket"),
  }));
  if (new Set(sources.map((source) => source.sourceId)).size !== sources.length) {
    throw new Error("duplicate acquired source id");
  }
  return sources;
}

function matchedIds(record: Record<string, unknown>): readonly string[] {
  const matches: unknown[] = [];
  if (record.knownMatch !== null && record.knownMatch !== undefined) matches.push(record.knownMatch);
  if (Array.isArray(record.knownMatches)) matches.push(...record.knownMatches);
  const ids: string[] = [];
  for (const value of matches) {
    const match = asObject(value, "triage known match");
    const id = match.recordId ?? match.sourceId;
    if (typeof id === "string" && id.length > 0) ids.push(id);
  }
  return [...new Set(ids)].sort();
}

function hasTriageReason(record: Record<string, unknown>): boolean {
  if (typeof record.reasonCode === "string" && record.reasonCode.length > 0) return true;
  if (typeof record.reason === "string" && record.reason.length > 0) return true;
  return Array.isArray(record.reasonCodes) && record.reasonCodes.length > 0 &&
    record.reasonCodes.every((value) => typeof value === "string" && value.length > 0);
}

function parseTriage(
  sourceKey: TriageOccurrence["sourceKey"],
  bytes: Uint8Array,
): readonly TriageOccurrence[] {
  return parseJsonl(bytes, `${sourceKey} triage`).flatMap((record, index): readonly TriageOccurrence[] => {
    if (record.identifier === undefined) return [];
    return [{
      identifier: asString(record.identifier, `${sourceKey} identifier`),
      sourceKey,
      line: index + 1,
      matchedIds: matchedIds(record),
      hasReason: hasTriageReason(record) && typeof record.disposition === "string",
    }];
  });
}

function p0Records(unitsById: ReadonlyMap<string, LocalUnit>): readonly JsonObject[] {
  return P0_UNITS.map(([sourceUnitId, family]) => {
    const unit = unitsById.get(sourceUnitId);
    if (unit === undefined) throw new Error(`selected P0 unit is absent: ${sourceUnitId}`);
    const anchors = family === "mass-ratio-history"
      ? ["P8-T-LEVITATION-MASS-RATIO", "P8-T-LEVITATION-POWER", "P8-T-LEVITATION-SCALED"]
      : ["P8-T-HP26-RIM-HISTORY"];
    return {
      schema: PHASE8B_SELECTION_SCHEMA,
      recordKind: "benchmark-selection",
      id: `P8B-P0-${sourceUnitId.slice("P8B-UNIT-".length)}`,
      priorityClass: "P0",
      source: {
        sourceUnitId,
        containerId: unit.containerId,
        locator: unit.locator,
      },
      measurementFamily: family,
      targetBookAnchors: anchors,
      selectionBasis: "native longitudinal member in one of the two frozen local archives",
      phase9EvidenceRole: "model-development",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
    };
  });
}

function p1Record(options: {
  readonly id: string;
  readonly sourceId: string;
  readonly page: number;
  readonly display: string;
  readonly sourceSeriesId: string;
  readonly observable: string;
  readonly modules: readonly string[];
  readonly lineage: string;
  readonly conditionLocators: readonly JsonObject[];
}): JsonObject {
  return {
    schema: PHASE8B_SELECTION_SCHEMA,
    recordKind: "benchmark-selection",
    id: options.id,
    priorityClass: "P1",
    source: {
      sourceId: options.sourceId,
      locator: `pdf-page:${options.page};${options.display};series:${options.sourceSeriesId}`,
      conditionLocators: options.conditionLocators,
    },
    observable: options.observable,
    candidateModules: options.modules,
    lineageId: options.lineage,
    selectionBasis: "direct numeric observable under a controlled intervention or facet-specific protocol",
    phase9EvidenceRole: "model-development",
    numericTargetCoordinatesExtractedBeforeSelection: false,
    outcomeValueUsedAsSelectionCriterion: false,
  };
}

function p1Records(): readonly JsonObject[] {
  const records: JsonObject[] = [];
  const gondaSource = "P8B-S2R0-2EA39D1BD3D62F87101CF104";
  const gondaConditions = [
    { locator: "pdf-page:2;Table 1", role: "protocol-property-labels" },
    { locator: "pdf-page:2;Table 2", role: "protocol-property-labels" },
  ];
  const gonda = [
    ["SD71-M11", 6, "Figure 3", "mean a-axis length versus carrier-gas thermal conductivity"],
    ["SD71-M12", 6, "Figure 3", "mean a-axis length versus carrier-gas thermal conductivity"],
    ["SD71-M13", 6, "Figure 4", "mean c-axis length versus carrier-gas thermal conductivity"],
    ["SD71-M14", 6, "Figure 4", "mean c-axis length versus carrier-gas thermal conductivity"],
    ["SD71-M15", 6, "Figure 5", "mean c-to-a axis ratio versus carrier-gas thermal conductivity"],
    ["SD71-M16", 6, "Figure 5", "mean c-to-a axis ratio versus carrier-gas thermal conductivity"],
    ["SD71-M23", 8, "Figure 8", "mean c-axis length versus reported vapor diffusivity"],
    ["SD71-M24", 8, "Figure 8", "mean c-axis length versus reported vapor diffusivity"],
    ["SD71-M25", 8, "Figure 9", "mean c-to-a axis ratio versus reported vapor diffusivity"],
    ["SD71-M26", 8, "Figure 9", "mean c-to-a axis ratio versus reported vapor diffusivity"],
  ] as const;
  for (const [series, page, display, observable] of gonda) {
    records.push(p1Record({
      id: `P8B-P1-${series}`,
      sourceId: gondaSource,
      page,
      display,
      sourceSeriesId: series,
      observable,
      modules: ["M-LH", "M-P"],
      lineage: "gonda-komabayasi-1971-campaign",
      conditionLocators: gondaConditions,
    }));
  }

  const libbrecht2011 = [
    ["L11-F2-C1-R", 5, "Figure 2", "individual-crystal radius versus time"],
    ["L11-F2-C1-H", 5, "Figure 2", "individual-crystal thickness versus time"],
    ["L11-F2-C1-SIGMA-INF", 5, "Figure 2", "imposed far-field supersaturation schedule"],
    ["L11-F6-C2-R", 9, "Figure 6", "individual-crystal radius versus time"],
    ["L11-F6-C2-H", 9, "Figure 6", "individual-crystal thickness versus time"],
    ["L11-F6-C2-SIGMA-INF", 9, "Figure 6", "imposed far-field supersaturation schedule"],
  ] as const;
  for (const [series, page, display, observable] of libbrecht2011) {
    records.push(p1Record({
      id: `P8B-P1-${series}`,
      sourceId: "P8B-S2R0-7100720EAA6B8458FB4BBDD2",
      page,
      display,
      sourceSeriesId: series,
      observable,
      modules: ["M-H", "M-K2"],
      lineage: "libbrecht-2011-two-specimen-campaign",
      conditionLocators: [{ locator: `pdf-page:${page};${display}`, role: "forcing-and-run-protocol" }],
    }));
  }

  const libbrecht2016 = [
    ["L16-F3-R", 5, "Figure 3", "individual-crystal radius versus time"],
    ["L16-F3-H", 5, "Figure 3", "individual-crystal height versus time"],
    ["L16-F4-R", 7, "Figure 4", "individual-crystal radius versus time"],
    ["L16-F4-H", 7, "Figure 4", "individual-crystal height versus time"],
  ] as const;
  for (const [series, page, display, observable] of libbrecht2016) {
    records.push(p1Record({
      id: `P8B-P1-${series}`,
      sourceId: "P8B-S2R0-909CDB8504D9CFC72F703634",
      page,
      display,
      sourceSeriesId: series,
      observable,
      modules: ["M-H"],
      lineage: "libbrecht-2016-two-specimen-campaign",
      conditionLocators: [{ locator: `pdf-page:${page};${display}`, role: "forcing-and-run-protocol" }],
    }));
  }

  const sei = [
    ["S89-F3-BASAL", 4, "Figure 3", "basal-face normal growth rate versus supersaturation"],
    ["S89-F3-PRISM", 4, "Figure 3", "prism-face normal growth rate versus supersaturation"],
    ["S89-F4-BASAL", 4, "Figure 4", "basal-face normal growth rate versus supersaturation"],
    ["S89-F4-PRISM", 4, "Figure 4", "prism-face normal growth rate versus supersaturation"],
    ["S89-F5-BASAL", 5, "Figure 5", "basal-face normal growth rate versus supersaturation"],
    ["S89-F5-PRISM", 5, "Figure 5", "prism-face normal growth rate versus supersaturation"],
  ] as const;
  for (const [series, page, display, observable] of sei) {
    records.push(p1Record({
      id: `P8B-P1-${series}`,
      sourceId: "P8B-S2R0-5EF679012E89A00B20AEC8C7",
      page,
      display,
      sourceSeriesId: series,
      observable,
      modules: ["M-K2"],
      lineage: "sei-gonda-1989-low-pressure-campaign",
      conditionLocators: [{ locator: "pdf-pages:1-3;method", role: "pressure-temperature-and-supersaturation-calibration" }],
    }));
  }
  if (records.length !== 26) throw new Error(`P1 registry count drifted: ${records.length}`);
  return records;
}

function p2Records(): readonly JsonObject[] {
  return [
    {
      schema: PHASE8B_SELECTION_SCHEMA,
      recordKind: "benchmark-selection",
      id: "P8B-P2-PK20-HETERO-JOIN",
      priorityClass: "P2",
      need: "corrected-condition lineage, excluded unmatched archive member, and missing-member accounting for P0 mass histories",
      dependencies: [
        "P8B-UNIT-7DB41288CD8BAD7E6132C59E",
        "P8B-UNIT-15CD54E461D8E4DBE9088223",
        "P8B-UNIT-06EF743E8FB45CE7024DE2AB",
        "P8B-UNIT-8EB1CE17EA1223DB85FCAB75",
        "P8B-UNIT-D2473890EDB3FD6BC21F94E6",
      ],
      selectionBasis: "standing source-to-archive join discrepancy required to interpret P0",
      phase9EvidenceRole: "model-development",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
    },
    {
      schema: PHASE8B_SELECTION_SCHEMA,
      recordKind: "benchmark-selection",
      id: "P8B-P2-PK20-HOMO-DENOM",
      priorityClass: "P2",
      need: "unresolved printed-row versus analyzed-experiment denominator",
      dependencies: [
        "P8B-UNIT-FD055F2F028BF562E62513EB",
        "P8B-UNIT-14C3EDE87642E08D9D3CCC43",
        "P8B-UNIT-76CB065A2E7B602E49024D27",
        "P8B-UNIT-CE5858AA413297EA828851B7",
        "P8B-UNIT-7DB41288CD8BAD7E6132C59E",
      ],
      selectionBasis: "standing discrepancy that blocks specimen-denominator interpretation",
      phase9EvidenceRole: "model-development",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
    },
    {
      schema: PHASE8B_SELECTION_SCHEMA,
      recordKind: "benchmark-selection",
      id: "P8B-P2-HP25-SOURCE-SEMANTICS",
      priorityClass: "P2",
      need: "supersaturation reference basis and source-defined uncertainty semantics for the two dimension histories",
      dependencies: ["P8B-UNIT-30617A3EC7F916985CBF8286"],
      externalIdentity: { doi: "10.1175/JAS-D-25-0030.1", openAlex: "W4413020701" },
      selectionBasis: "missing first-report semantics required to interpret P0",
      phase9EvidenceRole: "model-development",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
    },
    {
      schema: PHASE8B_SELECTION_SCHEMA,
      recordKind: "benchmark-selection",
      id: "P8B-P2-L13-L16-SUPERSESSION",
      priorityClass: "P2",
      need: "bind the later source correction to the earlier interpretation without treating either paper as a second experiment",
      dependencies: [
        "P8B-S2R0-D15EF2E38A0B1D94D4340292",
        "P8B-S2R0-909CDB8504D9CFC72F703634",
      ],
      sourceLocator: "P8B-S2R0-909CDB8504D9CFC72F703634;pdf-page:12;interpretation correction",
      selectionBasis: "source-currency and lineage correction required to interpret P1",
      phase9EvidenceRole: "model-development",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
    },
    {
      schema: PHASE8B_SELECTION_SCHEMA,
      recordKind: "benchmark-selection",
      id: "P8B-P2-INPUT-LINEAGE",
      priorityClass: "P2",
      need: "retain the accepted source-fitted attachment-kinetics input lineage beside direct P1 confrontations",
      dependencies: ["P8-I-ALPHAHK-CROSS-LAB", "P8-I-LIBBRECHT-KINETICS"],
      selectionBasis: "existing input lineage required to prevent calibration evidence from becoming a validation witness",
      phase9EvidenceRole: "model-development",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
    },
  ];
}

function assertSelectionContainsNoOutcomeCoordinates(records: readonly JsonObject[]): void {
  const forbiddenKeys = new Set([
    "expectedEffect", "expectedDirection", "numericRows", "ordinates", "targetCoordinates",
    "threshold", "measuredValues", "outcomeValues",
  ]);
  const visit = (value: StrictJson, path: string): void => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) throw new Error(`selection contains forbidden outcome field ${path}.${key}`);
      visit(child, `${path}.${key}`);
    }
  };
  records.forEach((record, index) => visit(record, `selection[${index}]`));
}

function localResidualReason(unit: LocalUnit): string {
  if (unit.containerId === "P8B-CONT-31C9AE8E361BC8BD92F402E3") {
    if (unit.memberPath?.endsWith("/heticegrowth_625.dat")) return "PROVENANCE_MISMATCH_625";
    throw new Error(`unclassified residual Harrison unit: ${unit.id}`);
  }
  if (unit.containerId === "P8B-CONT-21F26713EF4DDC626CDFD820") {
    const path = unit.memberPath ?? "";
    if (/\/(?:a|c)-dimension-TF1991-raw\.csv$/.test(path)) return "TAKAHASHI_DERIVED_DIGITIZATION_DEFERRED";
    if (/\/(?:a|c)-dim-5\.3C-col\.csv$/.test(path)) return "STRICT_SUBSET_VIEW_DUPLICATE";
    if (/\.(?:dat|f90|py)$/.test(path)) return "MODEL_ARRAY_OR_CODE_NOT_MEASUREMENT";
    throw new Error(`unclassified residual Harrington-Pokrifka unit: ${unit.id}`);
  }
  if (unit.containerId === "P8B-CONT-1034F981B47FACA23A038372") {
    return "SAME_CAMPAIGN_DERIVED_OR_NONPRIORITY_PAGE";
  }
  return "NO_CURRENT_P0_P1_P2_ROLE";
}

function triagePin(
  sourceKey: keyof typeof PHASE8B_SELECTION_NAS_INPUTS,
  bytes: Uint8Array,
  registeredScope: boolean,
): JsonObject {
  const registered = PHASE8B_SELECTION_NAS_INPUTS[sourceKey];
  if (registeredScope && (
    bytes.byteLength !== registered.byteLength ||
    sha256Bytes(bytes) !== registered.sha256
  )) {
    throw new Error(`${sourceKey} triage bytes differ from the registered snapshot`);
  }
  const records = parseJsonl(bytes, `${sourceKey} triage`);
  if (registeredScope && records.length !== registered.recordCount) {
    throw new Error(`${sourceKey} triage record count drifted`);
  }
  return {
    sourceKey,
    path: registeredScope ? registered.logicalPath : `test-fixture/${sourceKey}-triage.jsonl`,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    recordCount: records.length,
  };
}

function descriptor(path: string, kind: string, bytes: Uint8Array): JsonObject {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

export function derivePhase8bSelectionBundle(inputs: Phase8bSelectionInputs): Phase8bSelectionBundle {
  const registeredScope = (inputs.scope ?? "registered") === "registered";
  const localContainersBytes = trackedInput(inputs, PHASE8B_SELECTION_TRACKED_INPUTS.localContainers);
  const localUnitsBytes = trackedInput(inputs, PHASE8B_SELECTION_TRACKED_INPUTS.localUnits);
  const acquiredSourcesBytes = trackedInput(inputs, PHASE8B_SELECTION_TRACKED_INPUTS.acquiredSources);
  const targetBookBytes = trackedInput(inputs, PHASE8B_SELECTION_TRACKED_INPUTS.targetBook);
  const localUnits = parseLocalUnits(localUnitsBytes);
  const acquiredSources = parseAcquiredSources(acquiredSourcesBytes);
  const localContainerRecords = parseJsonl(localContainersBytes, "local source containers");
  const localContainerIds = new Set(localContainerRecords.map((record) => asString(record.id, "container id")));
  const targetBookRecords = parseJsonl(targetBookBytes, "target book");
  const targetBookIds = new Set(targetBookRecords.flatMap((record) =>
    typeof record.id === "string" ? [record.id] : []));
  if (localUnits.length !== 914) throw new Error(`local-unit universe drifted: ${localUnits.length}`);
  if (localContainerIds.size !== 23) throw new Error(`local-container universe drifted: ${localContainerIds.size}`);
  if (acquiredSources.length !== 28) throw new Error(`acquired-source universe drifted: ${acquiredSources.length}`);
  for (const id of SELECTED_LOCAL_CONTAINER_IDS) {
    if (!localContainerIds.has(id)) throw new Error(`selected local container is absent: ${id}`);
  }
  for (const id of TARGET_BOOK_IDS) {
    if (!targetBookIds.has(id)) throw new Error(`selected target-book anchor is absent: ${id}`);
  }
  const acquiredIds = new Set(acquiredSources.map((source) => source.sourceId));
  for (const id of SELECTED_ACQUIRED_SOURCE_IDS) {
    if (!acquiredIds.has(id)) throw new Error(`selected acquired source is absent: ${id}`);
  }

  const unitsById = new Map(localUnits.map((unit) => [unit.id, unit]));
  const selectedLocalUnitIds = new Set<string>([
    ...P0_UNITS.map(([id]) => id),
    ...P2_LOCAL_UNIT_IDS,
  ]);
  if (selectedLocalUnitIds.size !== 28) throw new Error(`selected local-unit set drifted: ${selectedLocalUnitIds.size}`);
  for (const id of selectedLocalUnitIds) {
    if (!unitsById.has(id)) throw new Error(`selected local unit is absent: ${id}`);
  }
  const residualLocalUnits = localUnits.filter((unit) => !selectedLocalUnitIds.has(unit.id));
  const localReasonCounts = new Map<string, number>();
  for (const unit of residualLocalUnits) {
    const reason = localResidualReason(unit);
    localReasonCounts.set(reason, (localReasonCounts.get(reason) ?? 0) + 1);
  }

  const residualAcquired = acquiredSources.filter((source) =>
    !SELECTED_ACQUIRED_SOURCE_ID_SET.has(source.sourceId));
  const eligibleResidualCount = residualAcquired.filter((source) =>
    source.provisionalScopeBucket === "provisional-eligible-primary-content").length;
  const contextResidualCount = residualAcquired.filter((source) =>
    source.provisionalScopeBucket === "provisional-context-or-exclude").length;
  if (eligibleResidualCount + contextResidualCount !== residualAcquired.length) {
    throw new Error("an acquired residual source lacks a registered backlog bucket");
  }

  const triagePins = [
    triagePin("focused", inputs.triage.focused, registeredScope),
    triagePin("author", inputs.triage.author, registeredScope),
    triagePin("citation", inputs.triage.citation, registeredScope),
  ];
  const occurrences = [
    ...parseTriage("focused", inputs.triage.focused),
    ...parseTriage("author", inputs.triage.author),
    ...parseTriage("citation", inputs.triage.citation),
  ];
  const byIdentifier = new Map<string, TriageOccurrence[]>();
  for (const occurrence of occurrences) {
    const prior = byIdentifier.get(occurrence.identifier) ?? [];
    byIdentifier.set(occurrence.identifier, [...prior, occurrence]);
  }
  if (registeredScope && byIdentifier.size !== 1_553) {
    throw new Error(`combined exact-identifier universe drifted: ${byIdentifier.size}`);
  }
  const promotedIdentifiers = new Set<string>();
  for (const [identifier, rows] of byIdentifier) {
    if (rows.some((row) => row.matchedIds.some((id) => SELECTED_IDENTITY_IDS.has(id)))) {
      promotedIdentifiers.add(identifier);
    }
  }
  if (registeredScope && promotedIdentifiers.size !== 8) {
    throw new Error(`selected identifier aliases drifted: ${promotedIdentifiers.size}`);
  }
  for (const [identifier, rows] of byIdentifier) {
    if (!promotedIdentifiers.has(identifier) && !rows.some((row) => row.hasReason)) {
      throw new Error(`residual identifier lacks stable source-row reason: ${identifier}`);
    }
  }

  const selection = [...p0Records(unitsById), ...p1Records(), ...p2Records()]
    .sort((left, right) => {
      const leftId = String(left.id);
      const rightId = String(right.id);
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
  if (new Set(selection.map((record) => record.id)).size !== selection.length) throw new Error("duplicate selection id");
  assertSelectionContainsNoOutcomeCoordinates(selection);
  const classCount = (priorityClass: string): number => selection.filter((record) =>
    record.priorityClass === priorityClass).length;
  const counts = {
    p0: classCount("P0"),
    p1: classCount("P1"),
    p2: classCount("P2"),
    selectedLocalUnitCount: selectedLocalUnitIds.size,
    residualLocalUnitCount: residualLocalUnits.length,
    selectedAcquiredSourceCount: SELECTED_ACQUIRED_SOURCE_IDS.length,
    residualAcquiredSourceCount: residualAcquired.length,
    exactIdentifierCount: byIdentifier.size,
    promotedIdentifierCount: promotedIdentifiers.size,
    residualIdentifierCount: byIdentifier.size - promotedIdentifiers.size,
  };
  if (counts.p0 !== 18 || counts.p1 !== 26 || counts.p2 !== 5) {
    throw new Error(`priority selection counts drifted: ${counts.p0}/${counts.p1}/${counts.p2}`);
  }
  if (counts.residualLocalUnitCount !== 886 || counts.residualAcquiredSourceCount !== 23 ||
      (registeredScope && counts.residualIdentifierCount !== 1_545)) {
    throw new Error("residual universe counts drifted");
  }

  const trackedPins = Object.values(PHASE8B_SELECTION_TRACKED_INPUTS).map((path) =>
    pin(path, trackedInput(inputs, path)));
  const implementationPins = SOURCE_PATHS.map((path) => {
    const bytes = inputs.implementation.get(path);
    if (bytes === undefined) throw new Error(`missing selection implementation bytes: ${path}`);
    return pin(path, bytes);
  });
  const protocol: JsonObject = {
    schema: "phase8b-benchmark-selection-protocol-v1",
    operator: PHASE8B_SELECTION_OPERATOR,
    derivationScope: registeredScope ? "registered-20260812" : "test-fixture",
    authority: "decision-0048-and-charter-v1.25",
    cutoffDate: "2026-08-12",
    priorityClasses: {
      P0: "native longitudinal data in the two frozen local archives",
      P1: "direct numeric series that discriminate a named candidate module or condition-matched comparison",
      P2: "independent-witness, discrepancy, or missing input-lineage evidence required to interpret P0 or P1",
    },
    selectionPolicy: {
      usesObservableProtocolAndLineageOnly: true,
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
      favorableOutcomeSelectionForbidden: true,
      everySelectedMeasurementRole: "model-development",
      phase9ImplementationAuthorized: false,
    },
    residualPolicy: {
      representation: "exact set difference over immutable upstream records plus deterministic reason rules",
      broadAcquisitionAuthorized: false,
      promotionRequiresPlanUpdateBeforeValueUse: true,
    },
    trackedInputs: trackedPins,
    nasTriageInputs: triagePins,
    implementation: implementationPins,
  };
  const backlog: JsonObject = {
    schema: "phase8b-benchmark-backlog-v1",
    operator: PHASE8B_SELECTION_OPERATOR,
    localContainers: {
      universeCount: localContainerIds.size,
      selectedIds: SELECTED_LOCAL_CONTAINER_IDS,
      residualCount: localContainerIds.size - SELECTED_LOCAL_CONTAINER_IDS.length,
      stableLocator: `${PHASE8B_SELECTION_TRACKED_INPUTS.localContainers}:record-id`,
      residualReason: "NO_CURRENT_PRIORITY_ROLE",
    },
    localUnits: {
      universeCount: localUnits.length,
      selectedIds: [...selectedLocalUnitIds].sort(),
      residualCount: residualLocalUnits.length,
      stableLocator: `${PHASE8B_SELECTION_TRACKED_INPUTS.localUnits}:record-id-and-source-locator`,
      deterministicReasonCounts: Object.fromEntries([...localReasonCounts].sort()),
      detailedContext: "evidence/phase8b-s2-round0-reconnaissance/local-existing-coverage.md",
    },
    acquiredSources: {
      universeCount: acquiredSources.length,
      selectedIds: SELECTED_ACQUIRED_SOURCE_IDS,
      residualCount: residualAcquired.length,
      stableLocator: `${PHASE8B_SELECTION_TRACKED_INPUTS.acquiredSources}:sourceId`,
      deterministicReasonCounts: {
        BACKLOG_ELIGIBLE_NONPRIORITY: eligibleResidualCount,
        BACKLOG_SCOPE_OR_PROTOCOL_MISMATCH: contextResidualCount,
      },
    },
    capturedIdentifiers: {
      universeCount: byIdentifier.size,
      promotedIdentifiers: [...promotedIdentifiers].sort(),
      residualCount: byIdentifier.size - promotedIdentifiers.size,
      stableLocator: "nas-triage-file-and-one-based-line; all route occurrences retained",
      residualReason: "each upstream row's disposition plus reasonCode, reasonCodes, or reason",
      precedenceForCrossRouteAccounting: [
        "known-local-or-acquired",
        "likely-eligible-primary",
        "needs-metadata-or-fulltext",
        "clearly-out-of-scope",
      ],
    },
  };
  const selectionBytes = new TextEncoder().encode(`${selection.map((record) => canonicalJson(record)).join("\n")}\n`);
  const protocolBytes = canonicalJsonBytes(protocol);
  const backlogBytes = canonicalJsonBytes(backlog);
  const payloadDescriptors = [
    descriptor("backlog.json", "canonical-json", backlogBytes),
    descriptor("protocol.json", "canonical-json", protocolBytes),
    descriptor("selection.jsonl", "canonical-jsonl", selectionBytes),
  ];
  const report: JsonObject = {
    schema: "phase8b-benchmark-selection-report-v1",
    operator: PHASE8B_SELECTION_OPERATOR,
    state: "priority-selection-frozen-before-coordinate-extraction",
    counts,
    selectedSourceCounts: {
      localContainerCount: SELECTED_LOCAL_CONTAINER_IDS.length,
      acquiredSourceCount: SELECTED_ACQUIRED_SOURCE_IDS.length,
    },
    scope: {
      targetCoordinatesExtracted: false,
      favorableOutcomeUsedForSelection: false,
      numericMeasurementRowsExtracted: 0,
      grantsValidationClaim: false,
      runsOrScoresModel: false,
      claimsGlobalSearchSaturation: false,
    },
    artifacts: payloadDescriptors,
  };
  const reportBytes = canonicalJsonBytes(report);
  const reportDescriptor = descriptor("report.json", "canonical-json-report", reportBytes);
  const index: JsonObject = {
    schema: "phase8b-benchmark-selection-index-v1",
    operator: PHASE8B_SELECTION_OPERATOR,
    report: reportDescriptor,
    artifacts: [reportDescriptor, ...payloadDescriptors],
  };
  const artifacts = new Map<string, Uint8Array>([
    ["artifact-index.json", canonicalJsonBytes(index)],
    ["backlog.json", backlogBytes],
    ["protocol.json", protocolBytes],
    ["report.json", reportBytes],
    ["selection.jsonl", selectionBytes],
  ]);
  return { artifacts, counts };
}

export function verifyPhase8bSelectionArtifacts(
  actual: ReadonlyMap<string, Uint8Array>,
  inputs: Phase8bSelectionInputs,
): Phase8bSelectionBundle {
  const expected = derivePhase8bSelectionBundle(inputs);
  const actualNames = [...actual.keys()].sort();
  const expectedNames = [...expected.artifacts.keys()].sort();
  if (canonicalJson(actualNames) !== canonicalJson(expectedNames)) throw new Error("selection bundle file set differs");
  for (const name of expectedNames) {
    if (!bytesEqual(actual.get(name) as Uint8Array, expected.artifacts.get(name) as Uint8Array)) {
      throw new Error(`selection artifact differs: ${name}`);
    }
  }
  return expected;
}

export function readPhase8bSelectionDirectory(directory: string): ReadonlyMap<string, Uint8Array> {
  const artifacts = new Map<string, Uint8Array>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`selection bundle entry is not a regular file: ${entry.name}`);
    artifacts.set(entry.name, new Uint8Array(readFileSync(join(directory, entry.name))));
  }
  return artifacts;
}

export function writePhase8bSelectionDirectory(directory: string, bundle: Phase8bSelectionBundle): void {
  const names = [...bundle.artifacts.keys()].sort();
  if (canonicalJson(names) !== canonicalJson([...PHASE8B_SELECTION_ARTIFACT_NAMES].sort())) {
    throw new Error("refusing incomplete selection bundle");
  }
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing selection bundle: ${directory}`);
  const parent = dirname(directory);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const [name, bytes] of bundle.artifacts) writeFileSync(join(staging, name), bytes, { flag: "wx" });
    renameSync(staging, directory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

export function capturePhase8bSelectionInputs(options: {
  readonly repositoryRoot: string;
  readonly triageRoot: string;
}): Phase8bSelectionInputs {
  const tracked = new Map<string, Uint8Array>();
  for (const path of Object.values(PHASE8B_SELECTION_TRACKED_INPUTS)) {
    tracked.set(path, new Uint8Array(readFileSync(resolve(options.repositoryRoot, path))));
  }
  const implementation = new Map<string, Uint8Array>();
  for (const path of SOURCE_PATHS) {
    implementation.set(path, new Uint8Array(readFileSync(resolve(options.repositoryRoot, path))));
  }
  return {
    scope: "registered",
    tracked,
    triage: {
      focused: new Uint8Array(readFileSync(resolve(options.triageRoot, "focused-title-triage.jsonl"))),
      author: new Uint8Array(readFileSync(resolve(options.triageRoot, "author-title-triage.jsonl"))),
      citation: new Uint8Array(readFileSync(resolve(options.triageRoot, "citation-title-triage.jsonl"))),
    },
    implementation,
  };
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-benchmark-selection.ts <build|verify> " +
    "--triage-root <dir> --bundle <dir> [--repository-root <dir>]",
  );
}

function cli(argv: readonly string[]): void {
  const command = argv[0];
  if (command !== "build" && command !== "verify") usage();
  const values = new Map<string, string>();
  const allowed = new Set(["--triage-root", "--bundle", "--repository-root"]);
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !allowed.has(key) || values.has(key)) usage();
    values.set(key, value);
  }
  const repositoryRoot = values.get("--repository-root") ?? fileURLToPath(new URL("../..", import.meta.url));
  const triageRoot = values.get("--triage-root");
  const bundlePath = values.get("--bundle");
  if (triageRoot === undefined || bundlePath === undefined) usage();
  const inputs = capturePhase8bSelectionInputs({ repositoryRoot, triageRoot });
  if (command === "build") {
    const bundle = derivePhase8bSelectionBundle(inputs);
    writePhase8bSelectionDirectory(bundlePath, bundle);
    process.stdout.write(`PHASE8B SELECTION BUILT P0=${bundle.counts.p0} P1=${bundle.counts.p1} P2=${bundle.counts.p2}\n`);
  } else {
    const bundle = verifyPhase8bSelectionArtifacts(readPhase8bSelectionDirectory(bundlePath), inputs);
    process.stdout.write(
      `PHASE8B SELECTION OK P0=${bundle.counts.p0} P1=${bundle.counts.p1} P2=${bundle.counts.p2} ` +
      `residualIdentifiers=${bundle.counts.residualIdentifierCount}\n`,
    );
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  try {
    cli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`PHASE8B SELECTION FAIL ${message}\n`);
    process.exitCode = 1;
  }
}
