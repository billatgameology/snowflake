/**
 * Pure verifier for the Phase 9 M-GP four-source development intake.
 *
 * The caller supplies every byte string. This module performs no filesystem, NAS, model, or
 * network operation and cannot generate a source-data score. NAS resolution belongs to the
 * operator that observes the source identities before calling this verifier.
 */

import { canonicalJson, sha256Bytes } from "./gate4-evidence.ts";

const EXPECTED_PROTOCOL_ID = "phase9-mgp-four-source-development-intake-v1";
const EXPECTED_REGISTRY_SCHEMA = "phase9-mgp-development-record-v1";
const EXPECTED_PROTOCOL_KEYS = Object.freeze([
  "schema",
  "protocolId",
  "frozenDate",
  "state",
  "question",
  "scope",
  "upstreamBindings",
  "exactShelfBindings",
  "sourceBindings",
  "restrictionDispositions",
  "visualAudit",
  "registry",
  "nextRunnableActions",
] as const);
const EXPECTED_UPSTREAM_BINDING_KEYS = Object.freeze([
  "sourceShelfFreeze",
  "sourceOverlay",
  "sourceDispositions",
  "sourceAudits",
  "reconSourceRegister",
  "historicalAuditBatch1",
  "historicalAuditBatch2",
] as const);
const EXPECTED_EXACT_SHELF_BINDING_KEYS = Object.freeze(["mgp", "mpk"] as const);
const EXPECTED_FILE_BINDING_KEYS = Object.freeze(["path", "byteLength", "sha256"] as const);
const REQUIRED_CONDITION_FIELDS = Object.freeze([
  "temperatureC",
  "pressure",
  "carrierGas",
  "waterCondition",
  "elapsedTime",
  "ensemble",
  "geometry",
  "support",
  "ventilation",
] as const);
const ALLOWED_CLASSES = new Set([
  "categorical-image-constraint",
  "numeric-digitization-candidate",
  "numeric-extraction-refused",
  "printed-numeric-transcription",
  "source-derived-excluded",
]);
const EXPECTED_CLASS_COUNTS = Object.freeze({
  "categorical-image-constraint": 7,
  "numeric-digitization-candidate": 14,
  "numeric-extraction-refused": 1,
  "printed-numeric-transcription": 2,
  "source-derived-excluded": 2,
} as const);
const EXPECTED_SOURCE_RECORDS = Object.freeze({
  "P8B-S2R0-08C32270D74949C84EC9111A": {
    sha256: "08c32270d74949c84ec9111a0deedb7c6395e6ceec4a445da2271bb07a05ad4c",
    byteLength: 1_469_961,
    pageCount: 8,
    registryCount: 8,
    auditPath: "evidence/phase8b-s2-round0-reconnaissance/historical-batch-2.md",
    auditSha256: "dd7cb3621a816313dbcc65de59659cef89b0c9f926562933ba32ee43cbd403ed",
  },
  "P8B-S2R0-2A20058FB79DE5F0C854F010": {
    sha256: "2a20058fb79de5f0c854f010b91663168c1590acf3c5145a50284245c4286e1f",
    byteLength: 3_531_960,
    pageCount: 12,
    registryCount: 9,
    auditPath: "evidence/phase8b-s2-round0-reconnaissance/historical-batch-1.md",
    auditSha256: "0793a57da394fc2f6da54c947f0ef2405743c89debbda25ffe2a24adca5714b6",
  },
  "P8B-S2R0-2E44238CA51A5DEC2FB1D048": {
    sha256: "2e44238ca51a5dec2fb1d04871477cd42303dd38440928daf3f51160d86f9589",
    byteLength: 6_306_927,
    pageCount: 12,
    registryCount: 4,
    auditPath: "evidence/phase8b-s2-round0-reconnaissance/historical-batch-1.md",
    auditSha256: "0793a57da394fc2f6da54c947f0ef2405743c89debbda25ffe2a24adca5714b6",
  },
  "P8B-S2R0-6A121A2582ADC93B0F160AC7": {
    sha256: "6a121a2582adc93b0f160ac7d1b799b483ad8335ab333bfb1b03e30be6e8a6b4",
    byteLength: 7_882_926,
    pageCount: 16,
    registryCount: 5,
    auditPath: "evidence/phase8b-s2-round0-reconnaissance/historical-batch-1.md",
    auditSha256: "0793a57da394fc2f6da54c947f0ef2405743c89debbda25ffe2a24adca5714b6",
  },
} as const);
const REQUIRED_MGP_RESTRICTIONS = new Set([
  "P9R-08C32270D74949C8-EXTRACTION",
  "P9R-2A20058FB79DE5F0-EXTRACTION",
  "P9R-2E44238CA51A5DEC-CURRENCY_CURRENT_VERSION",
  "P9R-2E44238CA51A5DEC-EXTRACTION",
  "P9R-2EA39D1BD3D62F87-EXTRACTION",
  "P9R-6A121A2582ADC93B-EXTRACTION",
  "P9R-909CDB8504D9CFC7-EXTRACTION",
]);
const EXPECTED_RECORD_SEMANTIC_SHA256 = Object.freeze({
  "MGP-G70-F05-A-TIME": "041af2431bca1b0f48a84de5a6a5506f9fc088e0bede5fa77804a7d019bbb592",
  "MGP-G70-F06-A-MIX": "05f7eea476e598b60950405760c3e4085722af9ec5bb7c8aed80a3e708ddccfc",
  "MGP-G70-F07-C-MIX": "639d691200abf3c4902e700c11f46c0a0025e7a17f57fa8d1fd47c96943b422d",
  "MGP-G70-F08-ASPECT-MIX": "b3119191fc8501fa09657376f1f96f79f74bffad02992594cf4bf8f3836d4a51",
  "MGP-G70-F10-CENTRAL-SIZE": "15b5fb5818ffe4cb958de32aa80cd6a403f1d258de052d6261d7173ff7028315",
  "MGP-G70-F12-BRANCH-ONSET": "a181d63d29a166ce5139cfdc5d36c7dedff71efcd9d57d4aff193ae75e3af6f7",
  "MGP-G70-F14-HOLLOW-IMAGE": "ed709d5f9ae2793363d6f4d31dd7ea93535e8ebb19423c2d6be541ccb4516852",
  "MGP-G70-F15F16-AXES-MIX": "d18b59a4f71bbd0d7c7634ba06a1ac9da08b27433cfb6fabad1b44715aae8d3c",
  "MGP-G70-F17-HABIT-MAP": "e70fd39f9ec5081bed8679a2101b4c4c0f53cb1eeee92aa9f395f6d7fbfa6540",
  "MGP-G76-F01-HE-IMAGES": "6b4a514620c21bb81cfa5f87d7a47c4305a00833cda02d56aeeee70295a7bc3d",
  "MGP-G76-F02-HE-FREQUENCY": "17ca46814224b53893ed14958499b7dcd3b11772bf9b12ed77d71cc4d66551b0",
  "MGP-G76-F03-SIZE-REFUSED": "f62fa747b8308bb8b12b3661bd36b0f94d8ac628de331bc5040926658c7a92e1",
  "MGP-G76-F04-AR-IMAGES": "c2a7b11e8bdb1426dea2b36c4f2db29171974e145da83c4e7a6bc2a21e78fc08",
  "MGP-G76-F05-AR-FREQUENCY": "6dffae883c12a07e8a3475fbdb429c995566e28e00ca9671c0d2ec9f84c68cb9",
  "MGP-G76-F06-ASPECT": "d2afc5e8fa98e46ea4cbb78ee372172b81860e42522aa34361e0d06f39c64129",
  "MGP-G76-T01T02-SECONDARY": "3d05e98087fff729744864409feccb8a5744b670eb26215d010c7f4b2da244db",
  "MGP-G76-F07F08-SCHEMATIC": "a82dfc124a2198a5c068d9912f436324dbfdb920f6fdc94602e003770e352d43",
  "MGP-I57-F09-CATEGORY": "995e809d19d8f326d0533606d4139ae4058412266294303e29cd4fff60b6449c",
  "MGP-I57-F09-TIMELINE": "84b45499b2a5eb1d0d285d3111ac707bc795f7076ae8905f50ca83c7a49f7145",
  "MGP-I57-F10-CATEGORY": "9c5590ecade27f49a06f7112e3f79ef953fecefb44fab8f9714afae06e8aa87d",
  "MGP-I57-F10-TIMELINE": "e33aa45a764910ab831eab26106501d524404f432ae94df16098515f5fc39a0a",
  "MGP-K58-F03-R2-TIME": "0a146e23998acca02a5bdd522ff24e95c669034712aac96d07038cc877890135",
  "MGP-K58-F04-CONDITION-HISTORY": "e2503c333a0ec5f8c5920137391c999f8664701d9aedb39e805c960ef5bf94b8",
  "MGP-K58-F05-CONDITION-HISTORY": "cc9ed4764f6b40c4a0d742881c54013ea2ec71cf4c0e428d43d74443f7461350",
  "MGP-K58-F07-CONDITION-HISTORY": "ae18cb9a1efd94b73cae2d037c16e23a0f0fc09f13d264861c6032f9fcc88806",
  "MGP-K58-F09-HABIT-MAP": "6570d85aee6ee224fc04f2989297522f048969b2e307507970d6a536c93addd0",
} as const);
const EXPECTED_SOURCE_BINDING_SEMANTIC_SHA256 = Object.freeze({
  "P8B-S2R0-2E44238CA51A5DEC2FB1D048": "d3d8c04efb49792b815397cfaef89ad47302d7be1e17db720e0afd995b118510",
  "P8B-S2R0-6A121A2582ADC93B0F160AC7": "f30ad58f5a7acdfa29d07d054b1b295115ebed1075b870a457a7bc753a681fba",
  "P8B-S2R0-2A20058FB79DE5F0C854F010": "57266c166b7902f06c363bb682544c4960bb99dafc419c0e72fbe96d2aa366c1",
  "P8B-S2R0-08C32270D74949C84EC9111A": "d19027b2d3978e6affd263050fb80c8c017d4578087e945b4114c454262e8653",
} as const);
const EXPECTED_RESTRICTION_DISPOSITION_SEMANTIC_SHA256 = Object.freeze({
  "P9R-08C32270D74949C8-EXTRACTION": "659e485aa7e04096f4654b66dad9583652e7e9a89445f959a7e3a74f705eb0ac",
  "P9R-2A20058FB79DE5F0-EXTRACTION": "e72b2fadf47140d7236013d6d4e96f5f2ad554ad59c80d3b48c79194ab5a1de4",
  "P9R-2E44238CA51A5DEC-CURRENCY_CURRENT_VERSION": "fc45b5aed11f505028dc7d6cc802e8d7651b28dea0aaa19248d178d31234aaf3",
  "P9R-2E44238CA51A5DEC-EXTRACTION": "e68aba048b456ae06f3ebfa7e0f95b268674406333ec02efaaf83ab5285130d2",
  "P9R-2EA39D1BD3D62F87-EXTRACTION": "a27073c66003d75669677a104ba767288aaee45b728708209bd8cf7f12be3bee",
  "P9R-6A121A2582ADC93B-EXTRACTION": "9020be32a18bfaebbc7dae83fc0a5a5ebc8540542bb36ac072b45441225ce39d",
  "P9R-909CDB8504D9CFC7-EXTRACTION": "3d87f86f4f78675e914bf69633c8bd40a70934d3c041a6b6419b75ff9a912af6",
} as const);
const EXPECTED_PROTOCOL_SEMANTIC_SHA256 = Object.freeze({
  state: "ed2bf533cc1914252c5cbd8a226acf675f557b714d2a9a95598604d95f39464c",
  question: "07627865717eaa3bdc62e2d54b6f0ad8ba53318410e213e0ab6c818b814164bd",
  scope: "da153a42096c634652f201ad35c52f4e4b170094f3b0702f01290f731f5a19eb",
  visualAudit: "890db28c1efdb7be889b9bb4c48e1ed775ecc3911866d431e0a0c2a5d60c9fd4",
  nextRunnableActions: "8a86fd5f9e11833fd8f18d616e1b82c27638703ca40b7ed443729431f296ed3b",
  mgpShelf: "f568e21a583b127943055b8bb403dca3eb30888fc4f20330eaa95d0563f814ee",
  mpkShelf: "3cd64e012b203c3934a1a89f006c10aeaeff761ebdc905d30419ecc73c019e5d",
  registryStatic: "4eddafa1c210f2fccac1e00efcf0b197ae88de2ddd0b1c3f4635e833f1de5dbd",
} as const);

type JsonRecord = Record<string, unknown>;

export interface Phase9MgpIntakeVerificationInputs {
  readonly protocolBytes: Uint8Array;
  readonly registryBytes: Uint8Array;
  readonly shelfFreezeBytes: Uint8Array;
  readonly sourceOverlayBytes: Uint8Array;
  readonly sourceDispositionsBytes: Uint8Array;
  readonly sourceAuditsBytes: Uint8Array;
  readonly reconSourceRegisterBytes: Uint8Array;
  readonly historicalAuditBatch1Bytes: Uint8Array;
  readonly historicalAuditBatch2Bytes: Uint8Array;
}

export interface Phase9MgpIntakeVerification {
  readonly ok: true;
  readonly protocolId: "phase9-mgp-four-source-development-intake-v1";
  readonly sourceCount: 4;
  readonly recordCount: 26;
  readonly numericDigitizationCandidates: 14;
  readonly categoricalImageConstraints: 7;
  readonly printedNumericTranscriptions: 2;
  readonly numericExtractionRefusals: 1;
  readonly sourceDerivedExclusions: 2;
  readonly digitizedCoordinateCount: 0;
  readonly sourceDataScoresProduced: 0;
  readonly mpkRemainsPending: true;
  readonly grantsValidationClaim: false;
}

function record(value: unknown, label: string): JsonRecord {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function assertExactKeys(
  value: JsonRecord,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} key set differs`);
  }
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function count(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function flag(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
  return value;
}

function list(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function textList(value: unknown, label: string): readonly string[] {
  const values = list(value, label);
  if (
    values.some((item) => typeof item !== "string" || item.length === 0) ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`${label} must contain unique nonempty strings`);
  }
  return values as readonly string[];
}

function decode(bytes: Uint8Array, label: string): string {
  let value: string;
  try {
    value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} must be UTF-8`);
  }
  if (value.includes("\r") || !value.endsWith("\n")) {
    throw new Error(`${label} must use LF and end with a newline`);
  }
  return value;
}

function parseJson(bytes: Uint8Array, label: string): JsonRecord {
  try {
    return record(JSON.parse(decode(bytes, label)) as unknown, label);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${label} must be JSON`);
    throw error;
  }
}

function parseRows(bytes: Uint8Array, label: string, requireCanonical = false): readonly JsonRecord[] {
  const value = decode(bytes, label).slice(0, -1);
  if (value.length === 0) throw new Error(`${label} must not be empty`);
  return value.split("\n").map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} must be JSON`);
    }
    const row = record(parsed, `${label} row ${index + 1}`);
    if (requireCanonical && canonicalJson(row) !== line) {
      throw new Error(`${label} row ${index + 1} must be canonical JSON`);
    }
    return row;
  });
}

function assertBinding(
  bytes: Uint8Array,
  bindingValue: unknown,
  expectedPath: string,
  label: string,
): void {
  const binding = record(bindingValue, `${label} binding`);
  assertExactKeys(binding, EXPECTED_FILE_BINDING_KEYS, `${label} binding`);
  if (text(binding.path, `${label} path`) !== expectedPath) {
    throw new Error(`${label} path differs`);
  }
  if (count(binding.byteLength, `${label} byteLength`) !== bytes.byteLength) {
    throw new Error(`${label} byte length differs`);
  }
  if (text(binding.sha256, `${label} sha256`) !== sha256Bytes(bytes)) {
    throw new Error(`${label} digest differs`);
  }
}

function exactJsonEqual(left: unknown, right: unknown, label: string): void {
  if (canonicalJson(left) !== canonicalJson(right)) throw new Error(`${label} differs`);
}

function semanticSha256(value: unknown): string {
  return sha256Bytes(new TextEncoder().encode(canonicalJson(value)));
}

function assertSemanticSha256(value: unknown, expected: string, label: string): void {
  if (semanticSha256(value) !== expected) throw new Error(`${label} exact semantic binding differs`);
}

function findShelf(shelf: JsonRecord, item: string): JsonRecord {
  const rows = list(shelf.shelf, "shelf freeze shelf").map((row, index) =>
    record(row, `shelf row ${index + 1}`));
  const matches = rows.filter((row) => row.item === item);
  if (matches.length !== 1) throw new Error(`${item} shelf row must be unique`);
  return matches[0] as JsonRecord;
}

function validateProtocolClaimBoundary(protocol: JsonRecord): void {
  assertSemanticSha256(protocol.state, EXPECTED_PROTOCOL_SEMANTIC_SHA256.state, "protocol state");
  assertSemanticSha256(protocol.question, EXPECTED_PROTOCOL_SEMANTIC_SHA256.question, "protocol question");
  assertSemanticSha256(protocol.scope, EXPECTED_PROTOCOL_SEMANTIC_SHA256.scope, "protocol scope");
  assertSemanticSha256(protocol.visualAudit, EXPECTED_PROTOCOL_SEMANTIC_SHA256.visualAudit, "visual audit");
  assertSemanticSha256(
    protocol.nextRunnableActions,
    EXPECTED_PROTOCOL_SEMANTIC_SHA256.nextRunnableActions,
    "next runnable actions",
  );
  const state = record(protocol.state, "protocol state");
  if (
    flag(state.developmentOnly, "developmentOnly") !== true ||
    flag(state.allRecordsConfounded, "allRecordsConfounded") !== true ||
    flag(state.modelScoreProduced, "modelScoreProduced") !== false ||
    flag(state.sourceDataScoreProduced, "sourceDataScoreProduced") !== false ||
    flag(state.surfaceKineticsInferenceAuthorized, "surfaceKineticsInferenceAuthorized") !== false ||
    flag(state.grantsValidationClaim, "grantsValidationClaim") !== false
  ) {
    throw new Error("protocol claim boundary differs");
  }
}

function validateSourceBindings(
  protocol: JsonRecord,
  reconRows: readonly JsonRecord[],
  auditRows: readonly JsonRecord[],
  overlayRows: readonly JsonRecord[],
): void {
  const bindings = list(protocol.sourceBindings, "source bindings").map((value, index) =>
    record(value, `source binding ${index + 1}`));
  if (bindings.length !== 4) throw new Error("source binding count differs");
  exactJsonEqual(
    bindings.map((binding) => binding.sourceRecordId),
    Object.keys(EXPECTED_SOURCE_BINDING_SEMANTIC_SHA256),
    "source binding order",
  );
  const seen = new Set<string>();
  for (const binding of bindings) {
    const sourceRecordId = text(binding.sourceRecordId, "source binding sourceRecordId");
    if (seen.has(sourceRecordId)) throw new Error("source binding ids must be unique");
    seen.add(sourceRecordId);
    const expected = EXPECTED_SOURCE_RECORDS[sourceRecordId as keyof typeof EXPECTED_SOURCE_RECORDS];
    if (expected === undefined) throw new Error(`unexpected source binding ${sourceRecordId}`);
    assertSemanticSha256(
      binding,
      EXPECTED_SOURCE_BINDING_SEMANTIC_SHA256[
        sourceRecordId as keyof typeof EXPECTED_SOURCE_BINDING_SEMANTIC_SHA256
      ],
      `${sourceRecordId} source binding`,
    );
    const digest = text(binding.sha256, `${sourceRecordId} sha256`);
    if (
      digest !== expected.sha256 ||
      count(binding.byteLength, `${sourceRecordId} byteLength`) !== expected.byteLength ||
      count(binding.pageCount, `${sourceRecordId} pageCount`) !== expected.pageCount
    ) {
      throw new Error(`${sourceRecordId} identity differs`);
    }
    const loadBearingPages = list(binding.loadBearingPages, `${sourceRecordId} load-bearing pages`);
    if (
      loadBearingPages.length === 0 ||
      loadBearingPages.some((page) =>
        typeof page !== "number" || !Number.isSafeInteger(page) || page < 1 || page > expected.pageCount)
    ) {
      throw new Error(`${sourceRecordId} load-bearing pages differ`);
    }
    const auditEvidence = record(binding.auditEvidence, `${sourceRecordId} audit evidence`);
    if (
      text(auditEvidence.path, `${sourceRecordId} audit path`) !== expected.auditPath ||
      text(auditEvidence.sha256, `${sourceRecordId} audit sha256`) !== expected.auditSha256
    ) {
      throw new Error(`${sourceRecordId} audit evidence differs`);
    }
    const recon = reconRows.filter((row) => row.sourceId === sourceRecordId);
    if (recon.length !== 1) throw new Error(`${sourceRecordId} reconnaissance row differs`);
    const locator = record(recon[0]?.artifactLocator, `${sourceRecordId} reconnaissance locator`);
    if (
      text(locator.sha256, `${sourceRecordId} recon sha256`) !== digest ||
      count(locator.bytes, `${sourceRecordId} recon bytes`) !== expected.byteLength ||
      count(locator.pages, `${sourceRecordId} recon pages`) !== expected.pageCount
    ) {
      throw new Error(`${sourceRecordId} reconnaissance identity differs`);
    }
    const sourceAudit = auditRows.filter((row) => row.artifactSha256 === digest);
    if (sourceAudit.length !== 1) throw new Error(`${sourceRecordId} registered audit differs`);
    const registeredAuditEvidence = record(sourceAudit[0]?.auditEvidence, `${sourceRecordId} registered audit evidence`);
    if (
      registeredAuditEvidence.path !== expected.auditPath ||
      registeredAuditEvidence.sha256 !== expected.auditSha256 ||
      sourceAudit[0]?.method !== "reused-page-complete-visual-audit"
    ) {
      throw new Error(`${sourceRecordId} registered audit binding differs`);
    }
    const overlay = overlayRows.filter((row) => row.sha256 === digest);
    if (overlay.length !== 1 || overlay[0]?.byteLength !== expected.byteLength) {
      throw new Error(`${sourceRecordId} overlay identity differs`);
    }
    const currency = record(binding.currency, `${sourceRecordId} currency`);
    for (const key of ["currentVersion", "laterAuthorOutput", "nativeData", "supplement", "freezeEffect"] as const) {
      text(currency[key], `${sourceRecordId} currency ${key}`);
    }
  }
}

function validateShelves(protocol: JsonRecord, shelfFreeze: JsonRecord): void {
  const exactShelves = record(protocol.exactShelfBindings, "exact shelf bindings");
  assertExactKeys(exactShelves, EXPECTED_EXACT_SHELF_BINDING_KEYS, "exact shelf bindings");
  const mgpBinding = record(exactShelves.mgp, "M-GP exact binding");
  const mpkBinding = record(exactShelves.mpk, "M-PK exact binding");
  const mgpShelf = findShelf(shelfFreeze, "M-GP");
  const mpkShelf = findShelf(shelfFreeze, "M-PK");
  assertSemanticSha256(mgpBinding, EXPECTED_PROTOCOL_SEMANTIC_SHA256.mgpShelf, "M-GP protocol shelf");
  assertSemanticSha256(mpkBinding, EXPECTED_PROTOCOL_SEMANTIC_SHA256.mpkShelf, "M-PK pending semantics");
  for (const row of [mgpShelf, mpkShelf]) {
    if (
      row.sourceBlocked !== false ||
      row.protocolDispositionRequired !== true ||
      row.protocolDispositionState !== "pending"
    ) {
      throw new Error(`${String(row.item)} must remain pending and not source-blocked`);
    }
  }
  exactJsonEqual(mgpBinding.completeArtifactSha256, mgpShelf.completeArtifactSha256, "M-GP artifact shelf");
  const mgpRestrictionIds = textList(
    list(mgpShelf.protocolRestrictions, "M-GP restrictions").map((value, index) =>
      text(record(value, `M-GP restriction ${index + 1}`).id, `M-GP restriction ${index + 1} id`)),
    "M-GP restriction ids",
  );
  if (
    mgpRestrictionIds.length !== REQUIRED_MGP_RESTRICTIONS.size ||
    mgpRestrictionIds.some((id) => !REQUIRED_MGP_RESTRICTIONS.has(id))
  ) {
    throw new Error("M-GP restriction shelf differs");
  }
  if (count(mpkBinding.requiredRestrictionCount, "M-PK restriction count") !== 11) {
    throw new Error("M-PK protocol restriction count differs");
  }
  if (list(mpkShelf.protocolRestrictions, "M-PK restrictions").length !== 11) {
    throw new Error("M-PK must retain all eleven restrictions");
  }
  text(mpkBinding.meaning, "M-PK meaning");
}

function validateRestrictionDispositions(protocol: JsonRecord, dispositions: readonly JsonRecord[]): void {
  const localRows = list(protocol.restrictionDispositions, "restriction dispositions").map((value, index) =>
    record(value, `restriction disposition ${index + 1}`));
  const ids = textList(localRows.map((row) => text(row.id, "restriction id")), "restriction ids");
  exactJsonEqual(ids, Object.keys(EXPECTED_RESTRICTION_DISPOSITION_SEMANTIC_SHA256), "restriction order");
  if (ids.length !== 7 || ids.some((id) => !REQUIRED_MGP_RESTRICTIONS.has(id))) {
    throw new Error("restriction disposition coverage differs");
  }
  const upstreamIds = new Set<string>();
  for (const disposition of dispositions) {
    const protocolDisposition = record(disposition.protocolDisposition, "upstream protocol disposition");
    for (const value of list(protocolDisposition.restrictions, "upstream restrictions")) {
      upstreamIds.add(text(record(value, "upstream restriction").id, "upstream restriction id"));
    }
  }
  for (const row of localRows) {
    const id = text(row.id, "restriction id");
    assertSemanticSha256(
      row,
      EXPECTED_RESTRICTION_DISPOSITION_SEMANTIC_SHA256[
        id as keyof typeof EXPECTED_RESTRICTION_DISPOSITION_SEMANTIC_SHA256
      ],
      `${id} disposition meaning`,
    );
    if (!upstreamIds.has(id)) throw new Error(`${id} is absent from bound dispositions`);
    text(row.localDisposition, `${id} local disposition`);
    text(row.handling, `${id} handling`);
  }
}

function validateRegistry(
  protocol: JsonRecord,
  registryRows: readonly JsonRecord[],
  registryBytes: Uint8Array,
): void {
  const registry = record(protocol.registry, "registry protocol");
  const { byteLength: _byteLength, sha256: _sha256, ...staticRegistry } = registry;
  assertSemanticSha256(
    staticRegistry,
    EXPECTED_PROTOCOL_SEMANTIC_SHA256.registryStatic,
    "registry protocol metadata",
  );
  if (
    registry.path !== "research/phase9-mgp-development-registry-v1.jsonl" ||
    count(registry.byteLength, "registry byteLength") !== registryBytes.byteLength ||
    text(registry.sha256, "registry sha256") !== sha256Bytes(registryBytes) ||
    registry.schema !== EXPECTED_REGISTRY_SCHEMA ||
    registryRows.length !== count(registry.recordCount, "registry record count") ||
    registryRows.length !== 26
  ) {
    throw new Error("registry binding differs");
  }
  exactJsonEqual(registry.requiredConditionFields, REQUIRED_CONDITION_FIELDS, "condition field list");
  const protocolClassCounts = record(registry.classCounts, "registry class counts");
  exactJsonEqual(protocolClassCounts, EXPECTED_CLASS_COUNTS, "protocol class counts");
  const actualClassCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const recordIds = new Set<string>();
  exactJsonEqual(
    registryRows.map((row) => row.recordId),
    Object.keys(EXPECTED_RECORD_SEMANTIC_SHA256),
    "registry record order",
  );
  for (const [index, row] of registryRows.entries()) {
    const label = `registry row ${index + 1}`;
    if (row.schema !== EXPECTED_REGISTRY_SCHEMA) throw new Error(`${label} schema differs`);
    const recordId = text(row.recordId, `${label} recordId`);
    const expectedSemanticSha256 = EXPECTED_RECORD_SEMANTIC_SHA256[
      recordId as keyof typeof EXPECTED_RECORD_SEMANTIC_SHA256
    ];
    if (expectedSemanticSha256 === undefined) throw new Error(`${label} exact semantic identity differs`);
    assertSemanticSha256(row, expectedSemanticSha256, `${recordId} record`);
    if (recordIds.has(recordId)) throw new Error(`${label} recordId duplicates`);
    recordIds.add(recordId);
    const sourceRecordId = text(row.sourceRecordId, `${label} sourceRecordId`);
    const expectedSource = EXPECTED_SOURCE_RECORDS[sourceRecordId as keyof typeof EXPECTED_SOURCE_RECORDS];
    if (expectedSource === undefined || row.artifactSha256 !== expectedSource.sha256) {
      throw new Error(`${label} source identity differs`);
    }
    sourceCounts.set(sourceRecordId, (sourceCounts.get(sourceRecordId) ?? 0) + 1);
    const intakeClass = text(row.intakeClass, `${label} intakeClass`);
    if (!ALLOWED_CLASSES.has(intakeClass)) throw new Error(`${label} intakeClass differs`);
    actualClassCounts.set(intakeClass, (actualClassCounts.get(intakeClass) ?? 0) + 1);
    const locator = record(row.locator, `${label} locator`);
    const pages = list(locator.pages, `${label} pages`);
    if (
      pages.length === 0 ||
      pages.some((page) =>
        typeof page !== "number" || !Number.isSafeInteger(page) || page < 1 || page > expectedSource.pageCount)
    ) {
      throw new Error(`${label} pages differ`);
    }
    textList(locator.figures, `${label} figures`);
    const conditions = record(row.conditions, `${label} conditions`);
    exactJsonEqual(
      Object.keys(conditions).sort(),
      [...REQUIRED_CONDITION_FIELDS].sort(),
      `${label} condition keys`,
    );
    for (const field of REQUIRED_CONDITION_FIELDS) text(conditions[field], `${label} ${field}`);
    const digitization = record(row.digitization, `${label} digitization`);
    if (digitization.authorized !== false || digitization.coordinates !== null) {
      throw new Error(`${label} must not contain authorized coordinates`);
    }
    text(digitization.reasonCode, `${label} digitization reason`);
    const claimBoundary = record(row.claimBoundary, `${label} claim boundary`);
    if (
      claimBoundary.developmentStatus !== "development-confounded" ||
      claimBoundary.sourceDataScoreProduced !== false ||
      claimBoundary.surfaceKineticsInferenceAuthorized !== false ||
      claimBoundary.grantsValidationClaim !== false
    ) {
      throw new Error(`${label} claim boundary differs`);
    }
    if (list(row.confounds, `${label} confounds`).length === 0 || list(row.refusals, `${label} refusals`).length === 0) {
      throw new Error(`${label} must name confounds and refusals`);
    }
    if (intakeClass === "categorical-image-constraint") {
      text(row.categoricalConstraint, `${label} categorical constraint`);
      if (row.directTranscription !== null) throw new Error(`${label} categorical record must not transcribe numbers`);
    } else if (intakeClass === "printed-numeric-transcription") {
      if (row.categoricalConstraint !== null) throw new Error(`${label} timeline category must be null`);
      const transcription = record(row.directTranscription, `${label} transcription`);
      if (transcription.unit !== "min") throw new Error(`${label} timeline unit must be min`);
      const panels = list(transcription.panels, `${label} panels`).map((value, panelIndex) =>
        record(value, `${label} panel ${panelIndex + 1}`));
      if (panels.length === 0) throw new Error(`${label} panels must not be empty`);
      let previous = -1;
      const panelIds = new Set<string>();
      for (const panel of panels) {
        const panelId = text(panel.panel, `${label} panel id`);
        if (panelIds.has(panelId)) throw new Error(`${label} panel id duplicates`);
        panelIds.add(panelId);
        const elapsed = count(panel.elapsed, `${label} elapsed`);
        if (elapsed <= previous) throw new Error(`${label} elapsed times must be strictly increasing`);
        previous = elapsed;
        if (panel.gas !== "air" && panel.gas !== "hydrogen") throw new Error(`${label} panel gas differs`);
      }
    } else if (row.directTranscription !== null || row.categoricalConstraint !== null) {
      throw new Error(`${label} non-timeline numeric/excluded record has payload data`);
    }
    if (recordId === "MGP-G76-F03-SIZE-REFUSED") {
      if (intakeClass !== "numeric-extraction-refused" || digitization.reasonCode !== "SOURCE_CONDITION_CONFLICT") {
        throw new Error("Gonda 1976 Figure 3 refusal differs");
      }
    }
  }
  for (const [intakeClass, expectedCount] of Object.entries(EXPECTED_CLASS_COUNTS)) {
    if (actualClassCounts.get(intakeClass) !== expectedCount) throw new Error(`${intakeClass} count differs`);
  }
  for (const [sourceRecordId, expected] of Object.entries(EXPECTED_SOURCE_RECORDS)) {
    if (sourceCounts.get(sourceRecordId) !== expected.registryCount) {
      throw new Error(`${sourceRecordId} registry count differs`);
    }
  }
}

export function verifyPhase9MgpIntake(
  inputs: Phase9MgpIntakeVerificationInputs,
): Phase9MgpIntakeVerification {
  const protocol = parseJson(inputs.protocolBytes, "M-GP protocol");
  assertExactKeys(protocol, EXPECTED_PROTOCOL_KEYS, "M-GP protocol");
  if (protocol.schema !== "phase9-mgp-intake-protocol-v1" || protocol.protocolId !== EXPECTED_PROTOCOL_ID) {
    throw new Error("M-GP protocol identity differs");
  }
  validateProtocolClaimBoundary(protocol);
  const upstream = record(protocol.upstreamBindings, "upstream bindings");
  assertExactKeys(upstream, EXPECTED_UPSTREAM_BINDING_KEYS, "upstream bindings");
  assertBinding(inputs.shelfFreezeBytes, upstream.sourceShelfFreeze, "evidence/phase9-source-overlay-v1/shelf-freeze.json", "shelf freeze");
  assertBinding(inputs.sourceOverlayBytes, upstream.sourceOverlay, "evidence/phase9-source-overlay-v1/source-overlay.jsonl", "source overlay");
  assertBinding(inputs.sourceDispositionsBytes, upstream.sourceDispositions, "research/phase9-source-dispositions-v1.jsonl", "source dispositions");
  assertBinding(inputs.sourceAuditsBytes, upstream.sourceAudits, "research/phase9-source-audits-v1.jsonl", "source audits");
  assertBinding(inputs.reconSourceRegisterBytes, upstream.reconSourceRegister, "evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl", "recon source register");
  assertBinding(inputs.historicalAuditBatch1Bytes, upstream.historicalAuditBatch1, "evidence/phase8b-s2-round0-reconnaissance/historical-batch-1.md", "historical audit batch 1");
  assertBinding(inputs.historicalAuditBatch2Bytes, upstream.historicalAuditBatch2, "evidence/phase8b-s2-round0-reconnaissance/historical-batch-2.md", "historical audit batch 2");

  const registryRows = parseRows(inputs.registryBytes, "M-GP registry", true);
  const shelfFreeze = parseJson(inputs.shelfFreezeBytes, "shelf freeze");
  const overlayRows = parseRows(inputs.sourceOverlayBytes, "source overlay");
  const dispositionRows = parseRows(inputs.sourceDispositionsBytes, "source dispositions");
  const auditRows = parseRows(inputs.sourceAuditsBytes, "source audits");
  const reconRows = parseRows(inputs.reconSourceRegisterBytes, "recon source register");
  validateSourceBindings(protocol, reconRows, auditRows, overlayRows);
  validateShelves(protocol, shelfFreeze);
  validateRestrictionDispositions(protocol, dispositionRows);
  validateRegistry(protocol, registryRows, inputs.registryBytes);

  return {
    ok: true,
    protocolId: EXPECTED_PROTOCOL_ID,
    sourceCount: 4,
    recordCount: 26,
    numericDigitizationCandidates: 14,
    categoricalImageConstraints: 7,
    printedNumericTranscriptions: 2,
    numericExtractionRefusals: 1,
    sourceDerivedExclusions: 2,
    digitizedCoordinateCount: 0,
    sourceDataScoresProduced: 0,
    mpkRemainsPending: true,
    grantsValidationClaim: false,
  };
}
