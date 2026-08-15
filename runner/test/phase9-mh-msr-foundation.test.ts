import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_MH_MSR_PROTOCOL_ID,
  PHASE9_MH_REGISTERED_PATHS,
  PHASE9_MSR_REGISTERED_CODEBOOKS,
  phase9MhMemoryEligibility,
  phase9MhPathFeatures,
  phase9MsrObservableFeatures,
  type Phase9MemoryPrerequisites,
  type Phase9ObservableSurfaceInput,
  type Phase9PathInput,
  type Phase9RegisteredPathId,
  type Phase9MsrRegistryRecordId,
} from "../src/phase9-mh-msr-foundation.ts";

type JsonRecord = Record<string, unknown>;

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

const root = resolve(import.meta.dirname, "../..");
const protocolPath = "research/phase9-mh-msr-protocol-v1.json";
const registryPath = "research/phase9-mh-msr-registry-v1.jsonl";
const registryIdentity = Object.freeze({
  path: registryPath,
  byteLength: 11_725,
  sha256: "0651a991e2c6433c617c16b7f952616c664933addb4295dd2c1b9396fc9b07c3",
});

const upstreamIdentities = Object.freeze([
  { path: "evidence/phase9-source-overlay-v1/shelf-freeze.json", byteLength: 63_975,
    sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06" },
  { path: "evidence/phase9-source-overlay-v1/source-overlay.jsonl", byteLength: 114_408,
    sha256: "f79cfd5268524d9017439e7be3abfe8b1e5df13f4e909c5d62569b8cc59ed5f7" },
  { path: "research/phase9-source-dispositions-v1.jsonl", byteLength: 86_719,
    sha256: "598f75c28490ac6d50e1c4d1be443905f62f755caa1119757688cb71f492af21" },
  { path: "research/phase9-mgp-intake-protocol-v1.json", byteLength: 13_701,
    sha256: "9a9c654e0d6ab776620d058e5a060203141038938ed560ad1caf62c23545a3f6" },
  { path: "research/phase9-mgp-development-registry-v1.jsonl", byteLength: 40_805,
    sha256: "4332a287a003dc587d7380ad59245d9927d89a98e4108af71700f8192167ed9a" },
  { path: "research/phase9-adapter-registry-v1.jsonl", byteLength: 48_946,
    sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337" },
  { path: "evidence/phase9-knowledge-baseline-v1/hypotheses.jsonl", byteLength: 28_878,
    sha256: "1c7d5ad2f4778b60240e83f150b237a33b12dd0bca388e319d203beb8d209b08" },
  { path: "evidence/phase8b-plot-digitization-v3/records.jsonl", byteLength: 32_617,
    sha256: "3b22753b246e1ddd026daa8fe8eaab170971c71ef7d9fb63e0d25c8ad91547c8" },
  { path: "evidence/phase8b-native-histories-v1/records.jsonl", byteLength: 43_881,
    sha256: "0765fa74b0fca079a56b0bd30b02d03212ff49a9616034f9f31a196559c463ce" },
] as const);

const expectedSourceBindings = Object.freeze([
  { sourceRecordId: "P8B-S2R0-8062802F15B237ED51D0ABD9",
    shareRelativePath: "research-cache/phase8b-search/acquired-sources-20260811-v1/pfalzgraff-et-al-2018-growth-sublimation-roughness.pdf",
    byteLength: 1_546_665, pageCount: 16,
    sha256: "8062802f15b237ed51d0abd9589a22963539f9a27ed2e5596f7932852c08133c",
    loadBearingPages: [9, 10] },
  { sourceRecordId: "P8B-S2R0-84BDC4F49DB156160B52C688",
    shareRelativePath: "research-cache/phase8b-search/acquired-sources-20260811-v1/nelson-2019-lateral-facet-growth.pdf",
    byteLength: 15_146_764, pageCount: 36,
    sha256: "84bdc4f49db156160b52c6887e55080f547850e21c172b5794f47eeb34deac1f",
    loadBearingPages: [6, 14] },
  { sourceRecordId: "P8B-S2R0-1A0709A42E70AD507E83239A",
    shareRelativePath: "research-cache/phase8b-search/acquired-sources-20260811-v1/neshyba-et-al-2014-mesoscopic-roughness.pdf",
    byteLength: 5_071_351, pageCount: 15,
    sha256: "1a0709a42e70ad507e83239a92e29740b317755704f31076099a00aa8d643e41",
    loadBearingPages: [4, 5, 6, 7, 12] },
  { sourceRecordId: "P8B-S2R0-2E44238CA51A5DEC2FB1D048",
    shareRelativePath: "research-cache/phase8b-search/acquired-sources-20260811-v1/gonda-1957-hydrogen-carbon-dioxide.pdf",
    byteLength: 6_306_927, pageCount: 12,
    sha256: "2e44238ca51a5dec2fb1d04871477cd42303dd38440928daf3f51160d86f9589",
    loadBearingPages: [6, 7, 8, 9, 10], filenameCitationMismatch: true },
  { sourceRecordId: "P8B-S2R0-6A121A2582ADC93B0F160AC7",
    shareRelativePath: "research-cache/phase8b-search/acquired-sources-20260811-v1/gonda-1958-low-pressure-habit.pdf",
    byteLength: 7_882_926, pageCount: 16,
    sha256: "6a121a2582adc93b0f160ac7d1b799b483ad8335ab333bfb1b03e30be6e8a6b4",
    loadBearingPages: [5, 6, 7], filenameCitationMismatch: true },
  { sourceRecordId: "P8B-S2R0-7100720EAA6B8458FB4BBDD2",
    shareRelativePath: "research-cache/phase8b-search/acquired-sources-20260811-v1/libbrecht-2011-edge-instability-minus15.pdf",
    byteLength: 571_790, pageCount: 14,
    sha256: "7100720eaa6b8458fb4bbdd2f961ddbe42b5f191a8055b84c83f165a9cacc00a",
    loadBearingPages: [5, 9] },
  { sourceRecordId: "P9K-HP26",
    shareRelativePath: "research-cache/content/harrington-pokrifka-2026.zip",
    byteLength: 104_949,
    sha256: "3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36",
    articleAvailable: false, loadBearingPages: [] },
] as const);

const expectedRecordIds = Object.freeze([
  "MH-I57-F09-EXTERNAL-GAS-PATH", "MH-I57-F10-EXTERNAL-GAS-PATH",
  "MH-K58-CONDITION-HISTORIES-REFUSAL", "MH-L11-C1-REGISTERED-SERIES",
  "MH-L11-C2-REGISTERED-SERIES", "MH-HP26-20231128-REGISTERED-HISTORY",
  "MH-HP26-20240814-LABEL-PATH", "MSR-V18-CYCLE-CATEGORIES",
  "MSR-NS19-LATERAL-CATEGORIES", "MSR-M14-SURFACE-CATEGORIES",
  "MH-HIDDEN-MEMORY-REFUSAL",
]);

const expectedQuestion =
  "What exact registered forcing-path and explicitly observable surface-state features can be represented before any M-H or M-SR model score, without treating endpoints as paths or observations as invisible state?";

const expectedScope = Object.freeze({
  included: [
    "Isono 1957 printed air-hydrogen same-crystal timelines",
    "Kobayashi 1958 registered but undigitized condition histories",
    "Libbrecht 2011 C1 and C2 registered forcing/dimension series identities",
    "Harrington-Pokrifka 2026 companion-history identities and categorical 48-to-20 label event",
    "Voigtlaender 2018 growth-sublimation-regrowth roughness categories",
    "Nelson-Swanson 2019 lateral-facet, pocket, terrace, and regrowth categories",
    "Magee 2014 observed roughness, ridge, scallop, stall, and phase categories",
  ],
  excluded: [
    "model execution, source score, model score, fitting, ranking, promotion, or validation",
    "three-dimensional geometry or simulation",
    "new plot digitization or copying NAS-only row bodies",
    "conversion of source-relative 48 or 20 percent labels to physical forcing",
    "causal gas, pressure, lateral-growth, roughness, or memory effect",
    "unobserved state, relaxation timescale, or mechanism inference",
  ],
});

const expectedUpstreamBindings = Object.freeze({
  shelfFreeze: upstreamIdentities[0],
  sourceOverlay: upstreamIdentities[1],
  sourceDispositions: upstreamIdentities[2],
  mgpProtocol: upstreamIdentities[3],
  mgpRegistry: upstreamIdentities[4],
  adapterRegistry: upstreamIdentities[5],
  hypotheses: upstreamIdentities[6],
  l11Records: upstreamIdentities[7],
  hp26Records: upstreamIdentities[8],
});

const expectedVisualAudit = Object.freeze({
  method: "PDF skill: Poppler 160 dpi page rendering plus original-resolution visual inspection",
  inspectedPages: {
    Voigtlaender2018: [9, 10],
    NelsonSwanson2019: [6, 14],
    Magee2014: [4, 5, 6, 7, 12],
    Isono1957: [6, 7, 8, 9, 10],
    Kobayashi1958: [5, 6, 7],
    Libbrecht2011: [5, 9],
  },
  limits: "Only named load-bearing pages were inspected. HP26 has no registered article PDF, and NAS-only numeric row bodies were not available for copying; their identities and registered locators are bound while numeric use is refused.",
});

const expectedFeatureContract = Object.freeze({
  path: "Accept only the exact registered Isono categorical timelines and exact HP26 source-label event fixture. Endpoint summaries never substitute for an event sequence.",
  resolvedPhysicalForcing: "Refused: the locally tracked package has no byte-bound physical forcing row fixture available to this pure runner.",
  surface: "Return only exact source-bound categorical codebooks. No caller-produced transition is an observation, and no numeric trajectory or coordinate mapping is registered.",
  memory: "Fail closed unless exact booleans establish forcing, endpoints, relaxation, transport, geometry, and a non-whitespace named observable state; even then require a separate registered stateful comparison.",
  runtime: "Require exact outer and nested schemas, registered source/selection/provenance identities, exact units and coordinate status, and exact categorical fixtures. Reject all extra or altered fields.",
});

const expectedRuntimeFixtures = Object.freeze({
  registeredPathRecords: [
    "MH-I57-F09-EXTERNAL-GAS-PATH", "MH-I57-F10-EXTERNAL-GAS-PATH",
    "MH-HP26-20240814-LABEL-PATH",
  ],
  registeredCodebookRecords: [
    "MSR-V18-CYCLE-CATEGORIES", "MSR-NS19-LATERAL-CATEGORIES",
    "MSR-M14-SURFACE-CATEGORIES",
  ],
  resolvedPhysicalForcingRuntimeStatus: "refused-no-byte-bound-fixture",
  callerProducedPathOrObservationStatus: "refused",
});

const expectedRegistryRows = Object.freeze({
  "MH-I57-F09-EXTERNAL-GAS-PATH": { byteLength: 1_128,
    sha256: "b9faa472b44b34bc19ecf31a216bd27add77e83620ac108116cc94f52de7e235",
    keys: ["claimBoundary", "conditions", "externalPath", "locator", "recordId", "refusals", "schema", "sourceRecordId"] },
  "MH-I57-F10-EXTERNAL-GAS-PATH": { byteLength: 1_019,
    sha256: "e07beac0536e3c417ce013c0841cc0a92938ad0837b32aacaf589959e605676f",
    keys: ["claimBoundary", "conditions", "externalPath", "locator", "recordId", "refusals", "schema", "sourceRecordId"] },
  "MH-K58-CONDITION-HISTORIES-REFUSAL": { byteLength: 1_231,
    sha256: "2d115862376f440607d35bcdc1480e049e67a0108d198614aa1c947e3b4d1430",
    keys: ["claimBoundary", "conditions", "externalPath", "locator", "recordId", "refusals", "schema", "sourceRecordId"] },
  "MH-L11-C1-REGISTERED-SERIES": { byteLength: 1_271,
    sha256: "fd1cbc117ad59753cb016307e18db26fe71e97766b59cf2bc498a0d7642c7594",
    keys: ["claimBoundary", "conditions", "locator", "recordId", "refusals", "schema", "series", "sourceRecordId"] },
  "MH-L11-C2-REGISTERED-SERIES": { byteLength: 1_271,
    sha256: "ecc25f5123820315a5c8552e4ae2db6fb6b44fc6685a8cca6bd4d134a34df9c2",
    keys: ["claimBoundary", "conditions", "locator", "recordId", "refusals", "schema", "series", "sourceRecordId"] },
  "MH-HP26-20231128-REGISTERED-HISTORY": { byteLength: 935,
    sha256: "e01a46abbbcea6ef9c5cef0a3b6366de564fa59bd131c61eb815187fb74f8322",
    keys: ["claimBoundary", "conditions", "locator", "recordId", "refusals", "schema", "series", "sourceRecordId"] },
  "MH-HP26-20240814-LABEL-PATH": { byteLength: 1_241,
    sha256: "e943ada4866e0f966fbcdd3649002478f1dfb697ef0cbaf25bb1b9fa4b8e744f",
    keys: ["claimBoundary", "conditions", "externalPath", "locator", "recordId", "refusals", "schema", "series", "sourceRecordId"] },
  "MSR-V18-CYCLE-CATEGORIES": { byteLength: 883,
    sha256: "2ca92acbd8971faf2bd7b45a085e44f4f2bf4034f59b0fb2f013b9a8e33a8ed0",
    keys: ["claimBoundary", "conditions", "locator", "observableCodebook", "recordId", "refusals", "schema", "sourceRecordId"] },
  "MSR-NS19-LATERAL-CATEGORIES": { byteLength: 959,
    sha256: "ecb9e27f8b422251a284b894d2b509837ed0d666891aa98b702d7a9157503aae",
    keys: ["claimBoundary", "conditions", "locator", "observableCodebook", "recordId", "refusals", "schema", "sourceRecordId"] },
  "MSR-M14-SURFACE-CATEGORIES": { byteLength: 1_013,
    sha256: "aab6db1a247a8d74bea367df2ffcd42f6c09a1bd913cce237d39573b57ed894f",
    keys: ["claimBoundary", "conditions", "locator", "observableCodebook", "recordId", "refusals", "schema", "sourceRecordId"] },
  "MH-HIDDEN-MEMORY-REFUSAL": { byteLength: 763,
    sha256: "fc3f52a316c87189f067c4b6567a7f4710650c016344dbf4f0500c7091c4beff",
    keys: ["claimBoundary", "prerequisites", "recordId", "refusals", "schema"] },
} as const);

const expectedSourceRecordIds = Object.freeze({
  "MH-I57-F09-EXTERNAL-GAS-PATH": "P8B-S2R0-2E44238CA51A5DEC2FB1D048",
  "MH-I57-F10-EXTERNAL-GAS-PATH": "P8B-S2R0-2E44238CA51A5DEC2FB1D048",
  "MH-K58-CONDITION-HISTORIES-REFUSAL": "P8B-S2R0-6A121A2582ADC93B0F160AC7",
  "MH-L11-C1-REGISTERED-SERIES": "P8B-S2R0-7100720EAA6B8458FB4BBDD2",
  "MH-L11-C2-REGISTERED-SERIES": "P8B-S2R0-7100720EAA6B8458FB4BBDD2",
  "MH-HP26-20231128-REGISTERED-HISTORY": "P9K-HP26",
  "MH-HP26-20240814-LABEL-PATH": "P9K-HP26",
  "MSR-V18-CYCLE-CATEGORIES": "P8B-S2R0-8062802F15B237ED51D0ABD9",
  "MSR-NS19-LATERAL-CATEGORIES": "P8B-S2R0-84BDC4F49DB156160B52C688",
  "MSR-M14-SURFACE-CATEGORIES": "P8B-S2R0-1A0709A42E70AD507E83239A",
});

const expectedMsrMappings = Object.freeze({
  "MSR-V18-CYCLE-CATEGORIES": {
    sourceRecordId: "P8B-S2R0-8062802F15B237ED51D0ABD9",
    provenance: "phase9-mh-msr-registry-v1/MSR-V18-CYCLE-CATEGORIES",
    observableCodebook: ["smooth", "rough", "growth", "sublimation", "regrowth"],
  },
  "MSR-NS19-LATERAL-CATEGORIES": {
    sourceRecordId: "P8B-S2R0-84BDC4F49DB156160B52C688",
    provenance: "phase9-mh-msr-registry-v1/MSR-NS19-LATERAL-CATEGORIES",
    observableCodebook: [
      "rounded", "faceted", "corner-pocketed", "center-pocketed", "terraced", "regrowth",
    ],
  },
  "MSR-M14-SURFACE-CATEGORIES": {
    sourceRecordId: "P8B-S2R0-1A0709A42E70AD507E83239A",
    provenance: "phase9-mh-msr-registry-v1/MSR-M14-SURFACE-CATEGORIES",
    observableCodebook: [
      "rough", "ridged", "scalloped", "stalled", "growth", "equilibrium", "sublimation",
      "regrowth",
    ],
  },
});

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(path: string): JsonRecord {
  return JSON.parse(readFileSync(resolve(root, path), "utf8")) as JsonRecord;
}

function readJsonl(path: string): JsonRecord[] {
  return readFileSync(resolve(root, path), "utf8").trimEnd().split("\n")
    .map((line) => JSON.parse(line) as JsonRecord);
}

function artifact(identity: ArtifactIdentity): void {
  const bytes = readFileSync(resolve(root, identity.path));
  expect(bytes.byteLength, identity.path).toBe(identity.byteLength);
  expect(sha256(bytes), identity.path).toBe(identity.sha256);
}

function requireDeep(actual: unknown, expected: unknown, label: string): void {
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`${label} semantic mismatch`);
}

function requireExactKeys(value: unknown, expected: readonly string[], label: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const record = value as JsonRecord;
  const actual = Object.keys(record).sort();
  const exact = [...expected].sort();
  if (!isDeepStrictEqual(actual, exact)) throw new Error(`${label} exact keys changed`);
  return record;
}

function rowById(rows: readonly JsonRecord[], recordId: string): JsonRecord {
  const row = rows.find((candidate) => candidate.recordId === recordId);
  if (row === undefined) throw new Error(`missing registry record ${recordId}`);
  return row;
}

function registryBytes(rows: readonly JsonRecord[]): Uint8Array {
  return Buffer.from(`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

function identityForRegistry(rows: readonly JsonRecord[]): ArtifactIdentity {
  const bytes = registryBytes(rows);
  return { path: registryPath, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

/** Independent exact protocol validator. No expected semantic value is read from the protocol. */
function validateProtocolSemantics(
  protocol: JsonRecord,
  boundRegistryIdentity: ArtifactIdentity,
): void {
  requireExactKeys(protocol, [
    "schema", "protocolId", "state", "implementationArtifacts", "question", "scope",
    "upstreamBindings", "sourceBindings", "visualAudit", "featureContract", "runtimeFixtures",
    "registry",
  ], "protocol");
  if (protocol.schema !== "phase9-mh-msr-protocol-v1" ||
      protocol.protocolId !== "phase9-mh-msr-prescore-foundation-v1") {
    throw new Error("protocol identity changed");
  }
  requireDeep(protocol.state, {
    status: "bounded-draft-foundation", developmentOnly: true,
    threeDimensionalWorkAuthorized: false, modelScoreProduced: false,
    sourceDataScoreProduced: false, physicalPromotionEligible: false,
    hiddenMemoryInferenceAuthorized: false, grantsValidationClaim: false,
  }, "protocol state");
  requireExactKeys(protocol.state, [
    "status", "developmentOnly", "threeDimensionalWorkAuthorized", "modelScoreProduced",
    "sourceDataScoreProduced", "physicalPromotionEligible", "hiddenMemoryInferenceAuthorized",
    "grantsValidationClaim",
  ], "protocol state");
  if (protocol.question !== expectedQuestion) throw new Error("protocol question changed");
  requireExactKeys(protocol.scope, ["included", "excluded"], "protocol scope");
  requireDeep(protocol.scope, expectedScope, "protocol scope");
  requireExactKeys(protocol.upstreamBindings, Object.keys(expectedUpstreamBindings),
    "protocol upstream bindings");
  requireDeep(protocol.upstreamBindings, expectedUpstreamBindings, "protocol upstream bindings");
  requireDeep(protocol.sourceBindings, expectedSourceBindings, "source bindings");
  requireExactKeys(protocol.visualAudit, ["method", "inspectedPages", "limits"],
    "protocol visual audit");
  requireExactKeys((protocol.visualAudit as JsonRecord).inspectedPages,
    Object.keys(expectedVisualAudit.inspectedPages), "protocol inspected pages");
  requireDeep(protocol.visualAudit, expectedVisualAudit, "protocol visual audit");
  requireExactKeys(protocol.featureContract,
    ["path", "resolvedPhysicalForcing", "surface", "memory", "runtime"],
    "protocol feature contract");
  requireDeep(protocol.featureContract, expectedFeatureContract, "protocol feature contract");
  requireExactKeys(protocol.runtimeFixtures, [
    "registeredPathRecords", "registeredCodebookRecords",
    "resolvedPhysicalForcingRuntimeStatus", "callerProducedPathOrObservationStatus",
  ], "protocol runtime fixtures");
  requireDeep(protocol.runtimeFixtures, expectedRuntimeFixtures, "protocol runtime fixtures");

  const artifacts = requireExactKeys(protocol.implementationArtifacts,
    ["model", "test", "registry"], "protocol implementation artifacts");
  const exactArtifactPaths = {
    model: "runner/src/phase9-mh-msr-foundation.ts",
    test: "runner/test/phase9-mh-msr-foundation.test.ts",
    registry: registryPath,
  } as const;
  for (const [name, expectedPath] of Object.entries(exactArtifactPaths)) {
    const identity = requireExactKeys(artifacts[name], ["path", "byteLength", "sha256"],
      `${name} artifact identity`);
    if (identity.path !== expectedPath || !Number.isSafeInteger(identity.byteLength) ||
        (identity.byteLength as number) <= 0 ||
        typeof identity.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(identity.sha256)) {
      throw new Error(`${name} artifact pin invalid`);
    }
  }
  requireDeep(artifacts.registry, boundRegistryIdentity, "registry implementation pin");

  const registry = requireExactKeys(protocol.registry,
    ["path", "byteLength", "sha256", "schema", "recordCount"], "protocol registry");
  requireDeep(registry, {
    ...boundRegistryIdentity,
    schema: "phase9-mh-msr-development-record-v1", recordCount: 11,
  }, "registry pin");
}

/** Full exact registry validator: canonical row identities and semantics are fixed independently. */
function validateRegistrySemantics(rows: readonly JsonRecord[]): void {
  if (rows.length !== 11 || new Set(rows.map((row) => row.recordId)).size !== 11) {
    throw new Error("registry roster changed");
  }
  requireDeep(rows.map((row) => row.recordId), expectedRecordIds, "registry order");
  const exactClaimBoundary = {
    developmentOnly: true, grantsValidationClaim: false, hiddenMemoryInferred: false,
    modelScoreProduced: false, sourceDataScoreProduced: false,
  };
  for (const row of rows) {
    const id = String(row.recordId) as keyof typeof expectedRegistryRows;
    const expected = expectedRegistryRows[id];
    if (expected === undefined) throw new Error(`unexpected registry record ${id}`);
    requireExactKeys(row, expected.keys, `registry row ${id}`);
    if (row.schema !== "phase9-mh-msr-development-record-v1") {
      throw new Error("registry schema changed");
    }
    requireExactKeys(row.claimBoundary, [
      "developmentOnly", "grantsValidationClaim", "hiddenMemoryInferred", "modelScoreProduced",
      "sourceDataScoreProduced",
    ], `${id} claim boundary`);
    requireDeep(row.claimBoundary, exactClaimBoundary, `${id} claim boundary`);
    if (id === "MH-HIDDEN-MEMORY-REFUSAL") {
      if (Object.hasOwn(row, "sourceRecordId")) throw new Error("memory refusal gained a source");
    } else {
      const expectedSource = expectedSourceRecordIds[id as keyof typeof expectedSourceRecordIds];
      if (row.sourceRecordId !== expectedSource) throw new Error(`${id} sourceRecordId changed`);
    }
  }
  requireDeep(rowById(rows, "MH-I57-F09-EXTERNAL-GAS-PATH").externalPath, {
    endpoint: { endValue: "air", startValue: "air" }, semantics: "external-condition",
    upstreamRecordId: "MGP-I57-F09-TIMELINE",
  }, "I57 F09 external path");
  requireDeep(rowById(rows, "MH-I57-F10-EXTERNAL-GAS-PATH").externalPath, {
    endpoint: { endValue: "air", startValue: "air" }, semantics: "external-condition",
    upstreamRecordId: "MGP-I57-F10-TIMELINE",
  }, "I57 F10 external path");
  for (const id of ["MH-I57-F09-EXTERNAL-GAS-PATH", "MH-I57-F10-EXTERNAL-GAS-PATH"]) {
    const conditions = rowById(rows, id).conditions as JsonRecord;
    if (conditions.pressure !== "not numerically reported") throw new Error("I57 pressure promoted");
  }
  requireDeep(rowById(rows, "MH-K58-CONDITION-HISTORIES-REFUSAL").externalPath, {
    coordinates: null, semantics: "external-condition",
    upstreamRecordIds: [
      "MGP-K58-F04-CONDITION-HISTORY", "MGP-K58-F05-CONDITION-HISTORY",
      "MGP-K58-F07-CONDITION-HISTORY",
    ],
  }, "K58 coordinate refusal");
  requireDeep(rowById(rows, "MH-L11-C1-REGISTERED-SERIES").series, [
    { rowCount: 37, selectionId: "P8B-P1-L11-F2-C1-H",
      sha256: "ad5bcdf14b5271d75994c9b768a23710891c818747374af6166cd2db78b9e2cb" },
    { rowCount: 37, selectionId: "P8B-P1-L11-F2-C1-R",
      sha256: "cf191e371a760226f9024ca5bad090621b008040673faaa58114010c20845acb" },
    { rowCount: 37, selectionId: "P8B-P1-L11-F2-C1-SIGMA-INF",
      sha256: "bbf8f4a1f0f47e210d3bc09281a1b3f7b4bb70858bd26987cc8641cc87235a5c" },
  ], "L11 C1 series");
  requireDeep(rowById(rows, "MH-L11-C2-REGISTERED-SERIES").series, [
    { rowCount: 32, selectionId: "P8B-P1-L11-F6-C2-H",
      sha256: "0b4901efd1da1c4e786b38681ea744a331b974226fd4cc171751167d94e98466" },
    { rowCount: 32, selectionId: "P8B-P1-L11-F6-C2-R",
      sha256: "4f5304e90faa1899cf9d92b06432fe9417a30b7ac25e45c7871912e7db02a8de" },
    { rowCount: 32, selectionId: "P8B-P1-L11-F6-C2-SIGMA-INF",
      sha256: "a91190275367147f3f88ce79b2094641486ac6cdd066b1c46abf0643f809dc8c" },
  ], "L11 C2 series");
  const hp26 = rowById(rows, "MH-HP26-20240814-LABEL-PATH");
  requireDeep(hp26.externalPath, {
    endpoint: { endValue: "source-label-20-percent", startValue: "source-label-48-percent" },
    semantics: "source-relative-label",
  }, "HP26 categorical path");
  requireDeep(hp26.series, {
    rowCount: 68, selectionId: "P8B-NATIVE-DIMENSIONS-20240814",
    sha256: "99d534800b1ace8ccecd92dd2cddb0a286aeaf9cb9c295aa3ef589baa7bbe7de",
  }, "HP26 series");
  for (const [id, expected] of Object.entries(expectedMsrMappings)) {
    const row = rowById(rows, id);
    if (row.sourceRecordId !== expected.sourceRecordId) throw new Error(`${id} source changed`);
    requireDeep(row.observableCodebook, expected.observableCodebook, `${id} codebook`);
  }
  requireDeep(rowById(rows, "MH-HIDDEN-MEMORY-REFUSAL").prerequisites, [
    "exact resolved physical forcing path", "matched resolved endpoints",
    "post-event relaxation observations", "resolved transport and geometry",
    "independently named observable state", "separately registered stateful comparison",
  ], "hidden-memory prerequisites");
  for (const row of rows) {
    const id = String(row.recordId) as keyof typeof expectedRegistryRows;
    const expected = expectedRegistryRows[id];
    if (expected === undefined) throw new Error(`unexpected registry record ${id}`);
    const encoded = JSON.stringify(row);
    if (Buffer.byteLength(encoded) !== expected.byteLength || sha256(encoded) !== expected.sha256) {
      throw new Error(`registry row ${id} exact semantic mismatch`);
    }
  }
}

function validatePackageSemantics(protocol: JsonRecord, rows: readonly JsonRecord[]): void {
  const computedRegistryIdentity = identityForRegistry(rows);
  validateProtocolSemantics(protocol, computedRegistryIdentity);
  validateRegistrySemantics(rows);
}

function coherentlyRepinRegistry(protocol: JsonRecord, rows: readonly JsonRecord[]): JsonRecord {
  const repinned = structuredClone(protocol);
  const identity = identityForRegistry(rows);
  const artifacts = repinned.implementationArtifacts as JsonRecord;
  artifacts.registry = identity;
  repinned.registry = {
    ...identity,
    schema: "phase9-mh-msr-development-record-v1",
    recordCount: 11,
  };
  return repinned;
}

function pathInput(id: Phase9RegisteredPathId): Phase9PathInput {
  return structuredClone({
    purpose: "registered-categorical-path-diagnostic",
    registryRecordId: id,
    ...PHASE9_MH_REGISTERED_PATHS[id],
  }) as unknown as Phase9PathInput;
}

function surfaceInput(id: Phase9MsrRegistryRecordId): Phase9ObservableSurfaceInput {
  const expected = expectedMsrMappings[id];
  return structuredClone({
    purpose: "registered-categorical-codebook-diagnostic",
    registryRecordId: id,
    ...expected,
    timeUnit: "unavailable",
    coordinateStatus: "no-registered-numeric-trajectory",
    observations: [],
  }) as unknown as Phase9ObservableSurfaceInput;
}

function memoryInput(): Phase9MemoryPrerequisites {
  return {
    purpose: "memory-identifiability-prerequisite-check",
    exactPhysicalForcingPathResolved: false,
    matchedResolvedEndpoint: false,
    postEventRelaxationObserved: false,
    transportAndGeometryResolved: false,
    namedObservableState: null,
  };
}

function expectCoherentRegistryMutationRejected(
  protocol: JsonRecord,
  rows: readonly JsonRecord[],
  expectedMessage: RegExp,
): void {
  const repinned = coherentlyRepinRegistry(protocol, rows);
  expect(() => validateProtocolSemantics(repinned, identityForRegistry(rows))).not.toThrow();
  expect(() => validatePackageSemantics(repinned, rows)).toThrow(expectedMessage);
}

describe("Phase 9 M-H/M-SR exact package bindings", () => {
  it("independently validates protocol, registry semantics, and every artifact pin", () => {
    upstreamIdentities.forEach(artifact);
    artifact(registryIdentity);
    const protocol = readJson(protocolPath);
    const rows = readJsonl(registryPath);
    requireDeep(identityForRegistry(rows), registryIdentity, "fixed registry identity");
    validatePackageSemantics(protocol, rows);
    const artifacts = protocol.implementationArtifacts as Record<string, ArtifactIdentity>;
    Object.values(artifacts).forEach(artifact);
    expect(PHASE9_MH_MSR_PROTOCOL_ID).toBe("phase9-mh-msr-prescore-foundation-v1");

    const overlay = readJsonl("evidence/phase9-source-overlay-v1/source-overlay.jsonl");
    for (const expected of expectedSourceBindings) {
      const source = overlay.find((row) => (row.aliases as JsonRecord[] | undefined)
        ?.some((alias) => alias.sourceId === expected.sourceRecordId));
      expect(source, expected.sourceRecordId).toBeDefined();
      expect(source).toMatchObject({
        canonicalPath: expected.shareRelativePath,
        byteLength: expected.byteLength,
        sha256: expected.sha256,
      });
    }

    const mgpRows = readJsonl("research/phase9-mgp-development-registry-v1.jsonl");
    for (const [runtimeId, upstreamId] of [
      ["MH-I57-F09-EXTERNAL-GAS-PATH", "MGP-I57-F09-TIMELINE"],
      ["MH-I57-F10-EXTERNAL-GAS-PATH", "MGP-I57-F10-TIMELINE"],
    ] as const) {
      const upstream = rowById(mgpRows, upstreamId);
      const transcription = upstream.directTranscription as {
        readonly panels: readonly { readonly elapsed: number; readonly gas: string }[];
        readonly unit: string;
      };
      expect(PHASE9_MH_REGISTERED_PATHS[runtimeId]).toEqual({
        sourceRecordId: "P8B-S2R0-2E44238CA51A5DEC2FB1D048",
        selectionId: null,
        provenance: `${upstreamId}/directTranscription.panels`,
        semantics: "external-condition",
        timeUnit: transcription.unit,
        valueUnit: "carrier-gas-identity",
        coordinateStatus: "direct-printed-panel-timeline",
        samples: transcription.panels.map((panel) => ({ time: panel.elapsed, value: panel.gas })),
        endpoint: { startValue: "air", endValue: "air" },
      });
    }

    expect(PHASE9_MH_REGISTERED_PATHS["MH-HP26-20240814-LABEL-PATH"]).toEqual({
      sourceRecordId: "P9K-HP26",
      selectionId: "P8B-NATIVE-DIMENSIONS-20240814",
      provenance: "P8B-NATIVE-DIMENSIONS-20240814/conditions.forcingEvent",
      semantics: "source-relative-label",
      timeUnit: "s",
      valueUnit: "source-reported-percent-label-unresolved-basis",
      coordinateStatus: "registered-event-boundary-no-observation-at-event",
      samples: [{ time: 0, value: 48 }, { time: 13_800, value: 20 }],
      endpoint: { startValue: 48, endValue: 20 },
    });
    expect(PHASE9_MSR_REGISTERED_CODEBOOKS).toEqual(expectedMsrMappings);
  });

  it("rejects added or altered protocol semantics with exact top and container schemas", () => {
    const protocol = readJson(protocolPath);
    const identity = identityForRegistry(readJsonl(registryPath));
    const rows = readJsonl(registryPath);
    const wrongSource = structuredClone(protocol);
    (wrongSource.sourceBindings as JsonRecord[])[5]!.sha256 = "wrong-l11-sha";
    expect(() => validateProtocolSemantics(wrongSource, identity)).toThrow("source bindings");
    const promoted = structuredClone(protocol);
    (promoted.state as JsonRecord).hiddenMemoryInferenceAuthorized = true;
    expect(() => validateProtocolSemantics(promoted, identity)).toThrow("protocol state");
    const addedTopClaim = structuredClone(protocol);
    addedTopClaim.physicalPromotionEligible = true;
    expect(() => validateProtocolSemantics(addedTopClaim, identity)).toThrow("exact keys");
    const addedScopeClaim = structuredClone(protocol);
    (addedScopeClaim.scope as JsonRecord).validationAuthorized = true;
    expect(() => validateProtocolSemantics(addedScopeClaim, identity)).toThrow("exact keys");
    const changedQuestion = structuredClone(protocol);
    changedQuestion.question = "Can this package validate hidden memory?";
    expect(() => validateProtocolSemantics(changedQuestion, identity)).toThrow("question");
    const changedUpstream = structuredClone(protocol);
    ((changedUpstream.upstreamBindings as JsonRecord).hp26Records as JsonRecord).path =
      "invented.jsonl";
    expect(() => validateProtocolSemantics(changedUpstream, identity)).toThrow("upstream");
    const changedAudit = structuredClone(protocol);
    (changedAudit.visualAudit as JsonRecord).limits = "all source semantics validated";
    expect(() => validateProtocolSemantics(changedAudit, identity)).toThrow("visual audit");
    const changedContract = structuredClone(protocol);
    (changedContract.featureContract as JsonRecord).surface = "numeric trajectory authorized";
    expect(() => validateProtocolSemantics(changedContract, identity)).toThrow("feature contract");
    expect(rows).toHaveLength(11);
  });

  it("rejects full-row semantic mutations after coherent registry and protocol repinning", () => {
    const protocol = readJson(protocolPath);
    const rows = readJsonl(registryPath);
    const resolvedHp26 = structuredClone(rows);
    (rowById(resolvedHp26, "MH-HP26-20240814-LABEL-PATH").externalPath as JsonRecord).semantics =
      "resolved-physical-forcing";
    expectCoherentRegistryMutationRejected(protocol, resolvedHp26, /HP26 categorical/u);
    const numericGasPressure = structuredClone(rows);
    (rowById(numericGasPressure, "MH-I57-F09-EXTERNAL-GAS-PATH").conditions as JsonRecord).pressure =
      101_325;
    expectCoherentRegistryMutationRejected(protocol, numericGasPressure, /pressure/u);
    const inventedCoordinates = structuredClone(rows);
    (rowById(inventedCoordinates, "MH-K58-CONDITION-HISTORIES-REFUSAL").externalPath as JsonRecord)
      .coordinates = [0, 1];
    expectCoherentRegistryMutationRejected(protocol, inventedCoordinates, /coordinate/u);
    const inventedState = structuredClone(rows);
    (rowById(inventedState, "MSR-V18-CYCLE-CATEGORIES").observableCodebook as string[])
      .push("hidden-memory");
    expectCoherentRegistryMutationRejected(protocol, inventedState, /codebook/u);
    const wrongSourceRecord = structuredClone(rows);
    rowById(wrongSourceRecord, "MSR-NS19-LATERAL-CATEGORIES").sourceRecordId =
      "P8B-S2R0-8062802F15B237ED51D0ABD9";
    expectCoherentRegistryMutationRejected(protocol, wrongSourceRecord, /sourceRecordId/u);
    const selfAttestedMemory = structuredClone(rows);
    (rowById(selfAttestedMemory, "MH-HIDDEN-MEMORY-REFUSAL").claimBoundary as JsonRecord)
      .hiddenMemoryInferred = true;
    expectCoherentRegistryMutationRejected(protocol, selfAttestedMemory, /claim boundary/u);
    const alteredLocator = structuredClone(rows);
    rowById(alteredLocator, "MH-L11-C1-REGISTERED-SERIES").locator = "invented locator";
    expectCoherentRegistryMutationRejected(protocol, alteredLocator, /exact semantic/u);
  });
});

describe("Phase 9 M-H exact categorical path diagnostics", () => {
  it("accepts only the two exact external-gas timelines and exact HP26 label event", () => {
    const f09 = phase9MhPathFeatures(pathInput("MH-I57-F09-EXTERNAL-GAS-PATH"));
    expect(f09.changePoints).toEqual([
      { time: 140, from: "air", to: "hydrogen" },
      { time: 224, from: "hydrogen", to: "air" },
      { time: 255, from: "air", to: "hydrogen" },
      { time: 295, from: "hydrogen", to: "air" },
    ]);
    expect(f09).toMatchObject({
      status: "registered-categorical-path-feature-only", timeUnit: "min",
      semantics: "external-condition", endpointErasesIntermediatePath: true,
      physicalForcingPathResolved: false, modelReplayEligible: false,
      sourceDataScoreProduced: false, modelScoreProduced: false, hiddenMemoryInferred: false,
      causalInferenceAuthorized: false, physicalPromotionEligible: false,
      threeDimensionalWorkAuthorized: false, grantsValidationClaim: false,
    });
    expect(phase9MhPathFeatures(pathInput("MH-I57-F10-EXTERNAL-GAS-PATH")).changePoints)
      .toEqual([
        { time: 75, from: "air", to: "hydrogen" },
        { time: 214, from: "hydrogen", to: "air" },
      ]);
    const hp26 = phase9MhPathFeatures(pathInput("MH-HP26-20240814-LABEL-PATH"));
    expect(hp26.changePoints).toEqual([{ time: 13_800, from: 48, to: 20 }]);
    expect(hp26).toMatchObject({ semantics: "source-relative-label", timeUnit: "s",
      coordinateStatus: "registered-event-boundary-no-observation-at-event",
      endpointErasesIntermediatePath: false, physicalForcingPathResolved: false });
  });

  it("refuses resolved forcing, arbitrary paths, altered identities/units, and extra fields", () => {
    const exact = pathInput("MH-HP26-20240814-LABEL-PATH");
    expect(() => phase9MhPathFeatures({ ...exact, semantics: "resolved-physical-forcing" }))
      .toThrow(/byte-bound/u);
    expect(() => phase9MhPathFeatures({ ...exact, sourceRecordId: "invented" }))
      .toThrow(/identity/u);
    expect(() => phase9MhPathFeatures({ ...exact, timeUnit: "min" }))
      .toThrow(/units/u);
    expect(() => phase9MhPathFeatures({ ...exact,
      samples: exact.samples.map((sample, index) => index === 1 ? { ...sample, value: 0.2 } : sample),
    })).toThrow(/exact registered fixture/u);
    expect(() => phase9MhPathFeatures({ ...exact, physicalForcingPathResolved: true } as
      unknown as Phase9PathInput)).toThrow(/fields/u);
    expect(() => phase9MhPathFeatures({ ...exact,
      samples: [{ ...exact.samples[0]!, pressurePa: 101_325 }, exact.samples[1]!],
    } as unknown as Phase9PathInput)).toThrow(/fields/u);
    expect(() => phase9MhPathFeatures({ ...exact,
      endpoint: { ...exact.endpoint, hiddenState: "memory" },
    } as unknown as Phase9PathInput)).toThrow(/fields/u);
    const samplesWithExtraProperty = pathInput("MH-HP26-20240814-LABEL-PATH");
    (samplesWithExtraProperty.samples as unknown as { fabricated?: unknown }).fabricated =
      { time: 5, value: 99 };
    expect(() => phase9MhPathFeatures(samplesWithExtraProperty))
      .toThrow(/exact registered fixture/u);
  });
});

describe("Phase 9 M-SR codebook and M-H memory refusals", () => {
  it("returns only exact source-bound codebooks and no caller-produced trajectory", () => {
    const expectedLengths = [5, 6, 8];
    (Object.keys(PHASE9_MSR_REGISTERED_CODEBOOKS) as Phase9MsrRegistryRecordId[])
      .forEach((id, index) => {
        const result = phase9MsrObservableFeatures(surfaceInput(id));
        expect(result.observableCodebook).toEqual(expectedMsrMappings[id].observableCodebook);
        expect(result.observableCodebook).toHaveLength(expectedLengths[index]!);
        expect(result).toMatchObject({
          status: "registered-categorical-codebook-only", timeUnit: "unavailable",
          coordinateStatus: "no-registered-numeric-trajectory", changes: [], hiddenState: null,
          relaxationTimescale: null, numericRoughnessScore: null,
          sourceDataScoreProduced: false, modelScoreProduced: false, hiddenMemoryInferred: false,
          causalInferenceAuthorized: false, physicalPromotionEligible: false,
          threeDimensionalWorkAuthorized: false, grantsValidationClaim: false,
        });
      });
  });

  it("refuses category, source, coordinate, trajectory, and schema mutations", () => {
    const exact = surfaceInput("MSR-V18-CYCLE-CATEGORIES");
    expect(() => phase9MsrObservableFeatures({ ...exact, sourceRecordId: "invented" }))
      .toThrow(/source/u);
    expect(() => phase9MsrObservableFeatures({ ...exact,
      observableCodebook: [...exact.observableCodebook, "hidden-memory"],
    })).toThrow(/codebook/u);
    const sparseCodebook = surfaceInput("MSR-V18-CYCLE-CATEGORIES");
    delete (sparseCodebook.observableCodebook as string[])[0];
    expect(() => phase9MsrObservableFeatures(sparseCodebook)).toThrow(/codebook/u);
    const codebookWithExtraProperty = surfaceInput("MSR-V18-CYCLE-CATEGORIES");
    (codebookWithExtraProperty.observableCodebook as unknown as { fabricated?: unknown }).fabricated =
      "hidden-memory";
    expect(() => phase9MsrObservableFeatures(codebookWithExtraProperty)).toThrow(/codebook/u);
    expect(() => phase9MsrObservableFeatures({ ...exact, timeUnit: "s" } as
      unknown as Phase9ObservableSurfaceInput)).toThrow(/units/u);
    expect(() => phase9MsrObservableFeatures({ ...exact, coordinateStatus: "digitized" } as
      unknown as Phase9ObservableSurfaceInput)).toThrow(/coordinate/u);
    expect(() => phase9MsrObservableFeatures({ ...exact,
      observations: [{ time: 0, roughness: "rough" }],
    } as unknown as Phase9ObservableSurfaceInput)).toThrow(/separately registered/u);
    const observationsWithExtraProperty = surfaceInput("MSR-V18-CYCLE-CATEGORIES");
    (observationsWithExtraProperty.observations as unknown as { fabricated?: unknown }).fabricated =
      { time: 0, state: "rough" };
    expect(() => phase9MsrObservableFeatures(observationsWithExtraProperty))
      .toThrow(/separately registered/u);
    expect(() => phase9MsrObservableFeatures({ ...exact, score: 1 } as
      unknown as Phase9ObservableSurfaceInput)).toThrow(/fields/u);
  });

  it("requires exact booleans and a non-whitespace state while always refusing hidden memory", () => {
    expect(phase9MhMemoryEligibility(memoryInput())).toMatchObject({
      status: "non-identifiable", hiddenState: null, hiddenMemoryInferred: false,
      sourceDataScoreProduced: false, modelScoreProduced: false, physicalPromotionEligible: false,
      causalInferenceAuthorized: false, threeDimensionalWorkAuthorized: false,
      grantsValidationClaim: false,
    });
    expect(phase9MhMemoryEligibility({ ...memoryInput(), exactPhysicalForcingPathResolved: true,
      matchedResolvedEndpoint: true, postEventRelaxationObserved: true,
      transportAndGeometryResolved: true, namedObservableState: "observed-rim-width" }))
      .toMatchObject({ status: "future-protocol-required", reasonCodes: [], hiddenState: null,
        hiddenMemoryInferred: false, modelScoreProduced: false });
    expect(() => phase9MhMemoryEligibility({ ...memoryInput(),
      exactPhysicalForcingPathResolved: "false" } as unknown as Phase9MemoryPrerequisites))
      .toThrow(/exact boolean/u);
    expect(() => phase9MhMemoryEligibility({ ...memoryInput(), namedObservableState: "   " }))
      .toThrow(/non-whitespace/u);
    expect(() => phase9MhMemoryEligibility({ ...memoryInput(), hiddenMemoryInferred: true } as
      unknown as Phase9MemoryPrerequisites)).toThrow(/fields/u);
  });
});
