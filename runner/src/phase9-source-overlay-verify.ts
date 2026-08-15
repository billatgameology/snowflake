// Phase 9 S0B independent verifier.
//
// Deliberately does not import the source-overlay producer. It reparses the frozen source
// registers, rehashes every complete and partial NAS path, reconstructs the SHA-deduplicated
// overlay, and byte-compares every published artifact before returning a verdict.

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  detectPhase9NasRoot,
  normalizeFrozenKnowledgeNasPath,
  resolvePhase9NasFile,
} from "./phase9-nas.ts";

const OPERATOR = "phase9-source-overlay-v1";
const ADOPTION_COMMIT = "f936920edce283e90a947ee34846776da8b1859a";
const OUTPUT_NAMES = ["artifact-index.json", "blockers.jsonl", "report.json", "shelf-freeze.json", "source-audits.jsonl", "source-overlay.jsonl"] as const;
const PATHS = {
  phase8Index: "evidence/phase8b-benchmark-final-v1/artifact-index.json",
  phase8TargetBook: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
  acquiredRegister: "evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl",
  localRegister: "evidence/phase8b-local-denominator/source-containers.jsonl",
  knowledgeIndex: "evidence/phase9-knowledge-baseline-v1/artifact-index.json",
  knowledgeRegister: "evidence/phase9-knowledge-baseline-v1/source-register.jsonl",
  targetedCurrency: "research/phase8b-targeted-gap-and-currency.md",
  baconReport: "evidence/phase8b-bacon-seed-history-v1/report.json",
  dispositions: "research/phase9-source-dispositions-v1.jsonl",
  blockers: "research/phase9-source-blockers-v1.jsonl",
  audits: "research/phase9-source-audits-v1.jsonl",
} as const;
const PINS = {
  phase8Index: "f17b1db5b1b876f11d83fdbbd8cf85b7ba56f98d08122080965fa7ef00bb9722",
  phase8TargetBook: "c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3",
  acquiredRegister: "3590804a3943bbe1594d6ec1feec58c45182d4f79cfc10b3c94d1f7ac068476f",
  localRegister: "3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106",
  knowledgeIndex: "c9a73f9464fc74be03cf805c617815f0a5ca3437b8fcf20e96c5e15bc6b77d96",
  knowledgeRegister: "e217861146b1a9456a2ce1464e263e00b88512011382e5da54e6dd03d5c105f7",
  targetedCurrency: "40e5d06ca19182945ca434ce144daed1af38d3092c4aeae04ab8ff8a086853d9",
  baconReport: "73ca145532ce23373b2e7087d6023d0fc72ac269f25504c2b75bc17c1ecc0792",
  dispositions: "598f75c28490ac6d50e1c4d1be443905f62f755caa1119757688cb71f492af21",
  blockers: "57dd4d679cbc1edd38feeca7e678ff16e2051d0bcf77c26fa034cdffba76c7ea",
  audits: "3255e66e29aca0f33e4fd8490f7c647ddc796a71206e764932fd2fe1d51d753a",
} as const;
const ACQUISITION_AUDIT_PATHS = {
  report: "research-cache/phase8b-search/acquisition-audit-20260811-v2/report.json",
  partialAttempts: "research-cache/phase8b-search/acquisition-audit-20260811-v2/partial-attempts.jsonl",
} as const;
const ACQUISITION_AUDIT_PINS = {
  report: "9209eea2ce4ead524264659e8b4c27105af308e3514dbd98bd5992435afd1bf3",
  partialAttempts: "1fb0948fe33b802a96a05a6c2ea94f01cae81d53621efccad2d57bb7f33bc5cd",
} as const;
const AUDIT_EVIDENCE_PINS = {
  "evidence/phase8b-bacon-seed-history-v1/report.json": "73ca145532ce23373b2e7087d6023d0fc72ac269f25504c2b75bc17c1ecc0792",
  "evidence/phase8b-s2-round0-reconnaissance/additional-priority-batch.md": "90aef0eab334d713b7d61257b37ec734d61a1000e766930fb3c4c34a80e118b2",
  "evidence/phase8b-s2-round0-reconnaissance/historical-batch-1.md": "0793a57da394fc2f6da54c947f0ef2405743c89debbda25ffe2a24adca5714b6",
  "evidence/phase8b-s2-round0-reconnaissance/historical-batch-2.md": "dd7cb3621a816313dbcc65de59659cef89b0c9f926562933ba32ee43cbd403ed",
  "evidence/phase8b-s2-round0-reconnaissance/local-archive-audit.md": "66ac1ae02cde2cfb2e486d0f5d67977fd43dd22179996803814e34138a676417",
  "evidence/phase8b-s2-round0-reconnaissance/local-visual-libbrecht-a.md": "436ad49b2bdb7ed0c0d8c14151b1fa87674a0f91a7f60895c3e580508ebfba1b",
  "evidence/phase8b-s2-round0-reconnaissance/local-visual-libbrecht-b.md": "b6912a18e26f173595a4dd4c9aaccaa55ede8907f41cf9bada7fd4f2fb8d2275",
  "evidence/phase8b-s2-round0-reconnaissance/local-visual-monograph.md": "2f4225fcfa0c40dccb522b14ef18580e69a51c4fd84084a42b8f7487ba955999",
  "evidence/phase8b-s2-round0-reconnaissance/local-visual-remaining.md": "c39cbf77ef3c5be4c12442589ec8cf4b4d6123c05df4a3cdb1446d609b5b6bc4",
  "evidence/phase8b-s2-round0-reconnaissance/modern-batch.md": "2da939a1be314d109cf1205a758518a1b95577fed58b041bac33ad910841362b",
  "research/bacon-baker-swanson-2003.md": "2e2b217dfb5de853209299507d9c520e9c2015e1d9b3f56dd7efac78a0ff21c1",
  "research/bailey-hallett-2002.md": "93f82a4da8c8003f35382a175c9006655edd282c65f8de3ac0e72ba70db916af",
  "research/nelson-1998.md": "c72b8dafa40ecb2807e14c6b80af9c53e2871ccb123399d503fc092154df156c",
  "research/phase9-sato-source-correction.md": "84364d678c835e7dbc23bec15ed96c433ce4a6aa767a29f7f4906e20b3d8f1ae",
  "research/phase9-knowledge-sources.md": "065e3771c85894c364bb4262a540809510fb7e87550afa3c0582c96d6c3d5ff7",
  "research/takahashi-1991.md": "3199b6b00db0be6492f7dc4e041feb9ace660cd49cbd8ad713058b2cc933d71e",
  "research/takahashi-fukuta-1988.md": "a784adeb081f41da1d8e84c01307cf6d479e8c35978ef0412f8778c836ef32e9",
} as const;
const TARGETED = [
  {
    sourceId: "P9-SATO-KIKUCHI-1988",
    path: "research-cache/phase8b-search/targeted-sources-20260812-v1/sato-kikuchi-1988-nucleation.pdf",
    sha256: "3b2003581d94e04c6d4e3d611d1c229e326df28a7d16997a1b09c2f561f68d4d",
    byteLength: 1_656_110,
    mediaType: "application/pdf",
  },
  {
    sourceId: "P9-BACON-DERIVED-2023",
    path: "research-cache/phase8b-search/targeted-sources-20260812-v1/harrington-pokrifka-hollowing-data-2023.zip",
    sha256: "977fcc882ab454f18e288fb5e7ef95cabba44ae59344c63eb74d45417a1e7121",
    byteLength: 4_566,
    mediaType: "application/zip",
  },
] as const;

const DISPOSITION_STATUSES = new Set(["categorical-input-with-limit", "code-context", "comparator", "compatibility-constraint", "control", "correction", "derivative-context", "fitted-replay-only", "frontier", "prerequisite", "protocol-ineligible", "qualitative-context", "quantitative-input-with-limit", "rival-mechanism", "source-blocked"]);
const EVIDENCE_CLASSES = new Set(["categorical-observation", "code-or-data-archive", "fitted-or-inverted-model", "native-or-direct-quantitative", "plot-or-image-requiring-extraction", "printed-or-tabular-quantitative", "secondary-or-context", "theory-or-simulation"]);
const SHELF_ITEMS = new Set(["D-BT", "FRONTIER-ATLAS", "FRONTIER-COLD-END", "FRONTIER-ELECTRIC", "FRONTIER-GEOMETRY", "FRONTIER-INSTABILITY", "FRONTIER-ISOTOPE", "FRONTIER-RADIATIVE", "FRONTIER-SUBLIMATION", "FRONTIER-TRI", "FRONTIER-WANG87", "M-F", "M-GP", "M-GT", "M-H", "M-K2", "M-LH", "M-PK", "M-PT", "M-S", "M-SR", "M-SS", "M-V", "M-W", "S2-CONTROLS"]);
const RESTRICTION_KINDS = new Set(["acquisition", "extraction", "currency-correction", "currency-current-version", "currency-later-author-output", "currency-native-data", "currency-supplement"]);
const AUDIT_METHODS = new Set(["reused-page-complete-visual-audit", "reused-load-bearing-page-visual-audit", "reused-archive-member-audit", "phase9-targeted-load-bearing-page-audit"]);
const MISSING_SOURCE_ROSTER = {
  "P9K-HP26": { affectedShelfItems: ["M-SS"], blockerId: "P9B-MISSING-HP26", identity: "Harrington and Pokrifka 2026, DOI 10.1175/JAS-D-26-0016.1", prerequisite: "Acquire and inspect the final article equations, fit cases, integrator, and hollowing update.", status: "arm-freeze-blocked" },
  "P9K-KH82": { affectedShelfItems: ["M-V", "M-PT", "M-LH"], blockerId: "P9B-MISSING-KH82", identity: "Keller and Hallett 1982, DOI 10.1016/0022-0248(82)90176-2", prerequisite: "Acquire the controlled-velocity article or freeze a conservative source-supported eligibility bound; no quantitative velocity series is presently available.", status: "arm-freeze-blocked" },
  "P9K-WANG87": { affectedShelfItems: ["FRONTIER-WANG87"], blockerId: "P9B-MISSING-WANG87", identity: "Wang Angsheng 1987, DOI 10.1007/BF02656742", prerequisite: "Acquire an authorized full text before transcribing any equation or prediction; title metadata carry no model formula.", status: "source-blocked" },
} as const;

type JsonObject = { readonly [key: string]: StrictJson };
type Registry = "phase8-acquired" | "phase8-local" | "phase9-knowledge" | "phase9-targeted";

export interface Phase9SourceOverlayVerifyInputs {
  readonly scope: "registered-20260812" | "test-fixture";
  readonly adoptionCommit: string;
  readonly phase8IndexBytes: Uint8Array;
  readonly phase8TargetBookBytes: Uint8Array;
  readonly acquiredRegisterBytes: Uint8Array;
  readonly localRegisterBytes: Uint8Array;
  readonly knowledgeIndexBytes: Uint8Array;
  readonly knowledgeRegisterBytes: Uint8Array;
  readonly targetedCurrencyBytes: Uint8Array;
  readonly baconReportBytes: Uint8Array;
  readonly dispositionsBytes: Uint8Array;
  readonly blockersBytes: Uint8Array;
  readonly auditsBytes: Uint8Array;
  readonly auditEvidenceBytes: ReadonlyMap<string, Uint8Array>;
  readonly published: ReadonlyMap<string, Uint8Array>;
  readonly fixtureTargetedArtifacts?: readonly {
    readonly sourceId: string;
    readonly path: string;
    readonly sha256: string;
    readonly byteLength: number;
    readonly mediaType: "application/pdf" | "application/zip";
  }[];
}

export interface Phase9SourceOverlayVerifyLoader {
  readonly load: (shareRelativePath: string) => Uint8Array;
}

export interface Phase9SourceOverlayVerification {
  readonly ok: true;
  readonly aliases: 70;
  readonly completeArtifacts: 59;
  readonly pdfs: 55;
  readonly zipArchives: 4;
  readonly missingFullTexts: 3;
  readonly partialAttemptPaths: 7;
  readonly uniquePartialAttemptDigests: 5;
  readonly modelScoresProduced: 0;
}

interface Alias {
  readonly registry: Registry;
  readonly sourceId: string;
  readonly path: string;
  readonly sha256: string;
  readonly mediaType: "application/pdf" | "application/zip";
  readonly expectedBytes?: number;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  if (canonicalJson(Object.keys(value).sort(compareText)) !== canonicalJson([...keys].sort(compareText))) {
    throw new Error(`${label} keys differ`);
  }
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a nonempty string`);
  return value;
}

function count(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a count`);
  return value;
}

function flag(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
  return value;
}

function textList(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0 ||
      value.some((item) => typeof item !== "string" || item.length === 0) || new Set(value).size !== value.length) {
    throw new Error(`${label} must be a nonempty unique string array`);
  }
  return value as string[];
}

function digest(value: unknown, label: string): string {
  const result = text(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} is not SHA-256`);
  return result;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function decode(bytes: Uint8Array, label: string): string {
  let value: string;
  try {
    value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (value.includes("\r") || !value.endsWith("\n")) throw new Error(`${label} is not LF-terminated`);
  return value;
}

function rows(bytes: Uint8Array, label: string, canonical = false): readonly Record<string, unknown>[] {
  return decode(bytes, label).slice(0, -1).split("\n").map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    const value = record(parsed, `${label} row ${index + 1}`);
    if (canonical && canonicalJson(value) !== line) throw new Error(`${label} row ${index + 1} is not canonical`);
    return value;
  });
}

function jsonl(values: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${values.map((value) => canonicalJson(value)).join("\n")}\n`);
}

function desc(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { byteLength: bytes.byteLength, format, path, sha256: sha256Bytes(bytes) };
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function aliases(inputs: Phase9SourceOverlayVerifyInputs): readonly Alias[] {
  const result: Alias[] = [];
  const acquired = rows(inputs.acquiredRegisterBytes, "acquired register");
  const local = rows(inputs.localRegisterBytes, "local register");
  const knowledge = rows(inputs.knowledgeRegisterBytes, "knowledge register");
  if (inputs.scope === "registered-20260812" && (acquired.length !== 28 || local.length !== 23 || knowledge.length !== 18)) {
    throw new Error("registered source-register counts differ");
  }
  for (const row of acquired) {
    const locator = record(row.artifactLocator, "acquired locator");
    result.push({
      registry: "phase8-acquired",
      sourceId: text(row.sourceId, "acquired sourceId"),
      path: `${text(locator.nasRoot, "acquired root")}/${text(locator.relativePath, "acquired path")}`,
      sha256: digest(locator.sha256, "acquired sha256"),
      mediaType: "application/pdf",
      expectedBytes: count(locator.bytes, "acquired bytes"),
    });
  }
  for (const row of local) {
    const mediaType = text(row.mediaType, "local media type");
    if (mediaType !== "application/pdf" && mediaType !== "application/zip") throw new Error("local media type differs");
    result.push({
      registry: "phase8-local",
      sourceId: text(row.id, "local sourceId"),
      path: `${text(row.logicalRoot, "local root")}/${text(row.relativePath, "local path")}`,
      sha256: digest(row.sha256, "local sha256"),
      mediaType,
      expectedBytes: count(row.byteLength, "local bytes"),
    });
  }
  for (const row of knowledge) {
    const sourceId = text(row.sourceId, "knowledge sourceId");
    const localRecord = record(row.local, `knowledge ${sourceId}.local`);
    for (const [pathKey, digestKey, suffix] of [
      ["path", "sha256", ""],
      ["archivePath", "archiveSha256", ""],
      ["codeArchive", "codeSha256", "-CODE"],
    ] as const) {
      if (localRecord[pathKey] === undefined) continue;
      const path = normalizeFrozenKnowledgeNasPath(text(localRecord[pathKey], `knowledge ${sourceId}.${pathKey}`));
      result.push({
        registry: "phase9-knowledge",
        sourceId: `${sourceId}${suffix}`,
        path,
        sha256: digest(localRecord[digestKey], `knowledge ${sourceId}.${digestKey}`),
        mediaType: path.endsWith(".pdf") ? "application/pdf" : "application/zip",
      });
    }
  }
  const targetedText = decode(inputs.targetedCurrencyBytes, "targeted currency");
  const baconText = decode(inputs.baconReportBytes, "Bacon report");
  const targeted = inputs.scope === "test-fixture" ? inputs.fixtureTargetedArtifacts : TARGETED;
  if (targeted === undefined || targeted.length !== 2) throw new Error("targeted artifact count differs");
  for (const item of targeted) {
    if (!targetedText.includes(item.path) || !targetedText.includes(item.sha256)) throw new Error(`targeted source ${item.sourceId} is unbound`);
    if (item.sourceId.includes("BACON") && (!baconText.includes(item.path) || !baconText.includes(item.sha256))) {
      throw new Error("Bacon derivative archive is unbound");
    }
    result.push({
      registry: "phase9-targeted",
      sourceId: item.sourceId,
      path: item.path,
      sha256: item.sha256,
      mediaType: item.mediaType,
      expectedBytes: item.byteLength,
    });
  }
  return result;
}

function inputDescriptors(
  inputs: Phase9SourceOverlayVerifyInputs,
  acquisitionAuditReportBytes: Uint8Array,
  partialAttemptsBytes: Uint8Array,
): readonly JsonObject[] {
  const values = [
    desc(PATHS.phase8Index, inputs.phase8IndexBytes, "canonical-json"),
    desc(PATHS.phase8TargetBook, inputs.phase8TargetBookBytes, "canonical-jsonl"),
    desc(PATHS.acquiredRegister, inputs.acquiredRegisterBytes, "canonical-jsonl"),
    desc(PATHS.localRegister, inputs.localRegisterBytes, "canonical-jsonl"),
    desc(PATHS.knowledgeIndex, inputs.knowledgeIndexBytes, "json"),
    desc(PATHS.knowledgeRegister, inputs.knowledgeRegisterBytes, "canonical-jsonl"),
    desc(PATHS.targetedCurrency, inputs.targetedCurrencyBytes, "markdown"),
    desc(PATHS.baconReport, inputs.baconReportBytes, "canonical-json"),
    desc(PATHS.dispositions, inputs.dispositionsBytes, "canonical-jsonl"),
    desc(PATHS.blockers, inputs.blockersBytes, "canonical-jsonl"),
    desc(PATHS.audits, inputs.auditsBytes, "canonical-jsonl"),
    desc(ACQUISITION_AUDIT_PATHS.report, acquisitionAuditReportBytes, "json"),
    desc(ACQUISITION_AUDIT_PATHS.partialAttempts, partialAttemptsBytes, "jsonl"),
    ...[...inputs.auditEvidenceBytes.entries()].map(([path, bytes]) => desc(path, bytes, path.endsWith(".json") ? "canonical-json" : "markdown")),
  ];
  const byPath = new Map<string, JsonObject>();
  for (const value of values) {
    const path = String(value.path);
    const existing = byPath.get(path);
    if (existing !== undefined && canonicalJson(existing) !== canonicalJson(value)) throw new Error(`input descriptor ${path} differs`);
    byPath.set(path, value);
  }
  return [...byPath.values()].sort((left, right) => compareText(String(left.path), String(right.path)));
}

function shelfFreeze(overlay: readonly Record<string, unknown>[], blockers: readonly Record<string, unknown>[]): JsonObject {
  const state = new Map<string, {
    artifacts: Set<string>;
    restrictions: Map<string, JsonObject>;
    blockers: Map<string, Record<string, unknown>>;
    protocolDispositionRequired: boolean;
  }>();
  const entry = (item: string) => {
    let value = state.get(item);
    if (value === undefined) {
      value = { artifacts: new Set(), restrictions: new Map(), blockers: new Map(), protocolDispositionRequired: false };
      state.set(item, value);
    }
    return value;
  };
  for (const source of overlay) {
    const disposition = record(source.disposition, "published disposition");
    if (!Array.isArray(disposition.shelfItems)) throw new Error("published shelfItems differs");
    for (const itemValue of disposition.shelfItems) {
      const item = text(itemValue, "shelf item");
      const value = entry(item);
      const artifactDigest = digest(source.sha256, "overlay sha256");
      value.artifacts.add(artifactDigest);
      const protocolDisposition = record(disposition.protocolDisposition, "source protocolDisposition");
      value.protocolDispositionRequired ||= flag(protocolDisposition.required, "source protocolDisposition.required");
      if (!Array.isArray(protocolDisposition.restrictions)) throw new Error("source protocol restrictions differ");
      for (const restrictionValue of protocolDisposition.restrictions) {
        const restriction = record(restrictionValue, "source protocol restriction");
        const id = text(restriction.id, "source protocol restriction id");
        value.restrictions.set(id, {
          artifactSha256: artifactDigest,
          id,
          kind: text(restriction.kind, "source protocol restriction kind"),
          text: text(restriction.text, "source protocol restriction text"),
        });
      }
    }
  }
  for (const blocker of blockers) {
    if (blocker.status === "resolved-by-complete-artifact") continue;
    if (!Array.isArray(blocker.affectedShelfItems)) throw new Error("blocker shelf mapping differs");
    for (const item of blocker.affectedShelfItems) entry(text(item, "blocker shelf item")).blockers.set(text(blocker.blockerId, "blocker id"), blocker);
  }
  return {
    claimBoundary: {
      grantsValidationClaim: false,
      modelScoresProduced: 0,
      protocolDispositionDerivedFromExplicitFields: true,
      sourceBlockersApplyOnlyToMappedShelfItems: true,
      sourceMappingFrozen: true,
    },
    operator: OPERATOR,
    schema: "phase9-source-shelf-freeze-v1",
    shelf: [...state.entries()].sort(([left], [right]) => compareText(left, right)).map(([item, value]) => ({
      blockerIdentities: [...value.blockers.values()].map((blocker) => text(blocker.identity, "blocker identity")).sort(compareText),
      completeArtifactCount: value.artifacts.size,
      completeArtifactSha256: [...value.artifacts].sort(compareText),
      item,
      protocolDispositionRequired: value.protocolDispositionRequired,
      protocolDispositionState: value.protocolDispositionRequired ? "pending" : "not-required",
      protocolRestrictions: [...value.restrictions.values()].sort((left, right) => compareText(String(left.id), String(right.id))),
      sourceBlocked: [...value.blockers.values()].some((blocker) => blocker.status === "source-blocked"),
      sourceBlockerIds: [...value.blockers.keys()].sort(compareText),
      sourceBlockerPresent: value.blockers.size > 0,
      sourceBlockerStatuses: [...new Set([...value.blockers.values()].map((blocker) => text(blocker.status, "blocker status")))].sort(compareText),
    })),
  };
}

function validateRegisteredInputs(inputs: Phase9SourceOverlayVerifyInputs): void {
  if (inputs.scope !== "registered-20260812") return;
  if (inputs.adoptionCommit !== ADOPTION_COMMIT) throw new Error("adoption commit differs");
  for (const [name, expected] of Object.entries(PINS)) {
    const bytes = inputs[`${name}Bytes` as keyof Phase9SourceOverlayVerifyInputs];
    if (!(bytes instanceof Uint8Array) || sha256Bytes(bytes) !== expected) throw new Error(`registered ${name} differs`);
  }
  if (decode(inputs.phase8TargetBookBytes, "Phase 8 target book").slice(0, -1).split("\n").length !== 51) {
    throw new Error("Phase 8 target book count differs");
  }
}

function validateDispositionRows(
  bytes: Uint8Array,
  artifactDigests: ReadonlySet<string>,
): ReadonlyMap<string, Record<string, unknown>> {
  const values = rows(bytes, "source dispositions", true);
  const byDigest = new Map<string, Record<string, unknown>>();
  const restrictionIds = new Set<string>();
  for (const value of values) {
    exactKeys(value, ["acquisitionPrerequisite", "artifactSha256", "currency", "evidenceClass", "extractionPrerequisite", "limitation", "planEffect", "protocol", "protocolDisposition", "schema", "shelfItems", "status"], "source disposition");
    if (value.schema !== "phase9-source-disposition-v1") throw new Error("source disposition schema differs");
    const artifactDigest = digest(value.artifactSha256, "source disposition digest");
    if (byDigest.has(artifactDigest)) throw new Error(`duplicate source disposition ${artifactDigest}`);
    for (const field of ["acquisitionPrerequisite", "extractionPrerequisite", "limitation", "planEffect"] as const) text(value[field], `source disposition ${artifactDigest}.${field}`);
    if (!DISPOSITION_STATUSES.has(text(value.status, `source disposition ${artifactDigest}.status`))) throw new Error(`source disposition ${artifactDigest}.status differs`);
    if (!EVIDENCE_CLASSES.has(text(value.evidenceClass, `source disposition ${artifactDigest}.evidenceClass`))) throw new Error(`source disposition ${artifactDigest}.evidenceClass differs`);
    const shelf = textList(value.shelfItems, `source disposition ${artifactDigest}.shelfItems`);
    if (shelf.some((item) => !SHELF_ITEMS.has(item))) throw new Error(`source disposition ${artifactDigest}.shelfItems contains an unknown item`);
    const currency = record(value.currency, `source disposition ${artifactDigest}.currency`);
    exactKeys(currency, ["correction", "currentVersion", "laterAuthorOutput", "nativeData", "supplement"], `source disposition ${artifactDigest}.currency`);
    for (const field of ["correction", "currentVersion", "laterAuthorOutput", "nativeData", "supplement"] as const) text(currency[field], `source disposition ${artifactDigest}.currency.${field}`);
    const protocol = record(value.protocol, `source disposition ${artifactDigest}.protocol`);
    exactKeys(protocol, ["ensemble", "forcing", "geometry", "observable", "pressureGas", "support", "ventilation"], `source disposition ${artifactDigest}.protocol`);
    for (const field of ["ensemble", "forcing", "geometry", "observable", "pressureGas", "support", "ventilation"] as const) text(protocol[field], `source disposition ${artifactDigest}.protocol.${field}`);
    const protocolDisposition = record(value.protocolDisposition, `source disposition ${artifactDigest}.protocolDisposition`);
    exactKeys(protocolDisposition, ["required", "restrictions"], `source disposition ${artifactDigest}.protocolDisposition`);
    const required = flag(protocolDisposition.required, `source disposition ${artifactDigest}.protocolDisposition.required`);
    if (!Array.isArray(protocolDisposition.restrictions)) throw new Error(`source disposition ${artifactDigest}.restrictions differ`);
    const currencyFields: Readonly<Record<string, string>> = { "currency-correction": "correction", "currency-current-version": "currentVersion", "currency-later-author-output": "laterAuthorOutput", "currency-native-data": "nativeData", "currency-supplement": "supplement" };
    for (const [index, restrictionValue] of protocolDisposition.restrictions.entries()) {
      const restriction = record(restrictionValue, `source disposition ${artifactDigest}.restriction ${index + 1}`);
      exactKeys(restriction, ["id", "kind", "text"], `source disposition ${artifactDigest}.restriction ${index + 1}`);
      const id = text(restriction.id, "source restriction id");
      if (!/^P9R-[0-9A-F]{16}-[A-Z_]+$/.test(id) || restrictionIds.has(id)) throw new Error(`source restriction ${id} differs`);
      restrictionIds.add(id);
      const kind = text(restriction.kind, `source restriction ${id}.kind`);
      if (!RESTRICTION_KINDS.has(kind)) throw new Error(`source restriction ${id}.kind differs`);
      const expectedText = kind === "acquisition" ? value.acquisitionPrerequisite : kind === "extraction" ? value.extractionPrerequisite : currency[currencyFields[kind] as string];
      if (text(restriction.text, `source restriction ${id}.text`) !== expectedText) throw new Error(`source restriction ${id}.text is not source-bound`);
    }
    if (required !== (protocolDisposition.restrictions.length > 0)) throw new Error(`source disposition ${artifactDigest}.required differs`);
    byDigest.set(artifactDigest, value);
  }
  if (canonicalJson([...byDigest.keys()].sort(compareText)) !== canonicalJson([...artifactDigests].sort(compareText))) {
    throw new Error("source disposition coverage differs");
  }
  return byDigest;
}

function validateAuditRows(
  inputs: Phase9SourceOverlayVerifyInputs,
  mediaByDigest: ReadonlyMap<string, string>,
): readonly Record<string, unknown>[] {
  const values = rows(inputs.auditsBytes, "source audits", true);
  const seen = new Set<string>();
  const evidencePaths = new Set<string>();
  for (const value of values) {
    exactKeys(value, ["artifactSha256", "auditEvidence", "locators", "mediaType", "method", "newlyLoadBearingForPhase9", "reviewer", "schema"], "source audit");
    if (value.schema !== "phase9-source-audit-v1") throw new Error("source audit schema differs");
    const artifactDigest = digest(value.artifactSha256, "source audit digest");
    if (seen.has(artifactDigest) || !mediaByDigest.has(artifactDigest)) throw new Error(`source audit ${artifactDigest} coverage differs`);
    seen.add(artifactDigest);
    const mediaType = text(value.mediaType, `source audit ${artifactDigest}.mediaType`);
    if (mediaType !== mediaByDigest.get(artifactDigest)) throw new Error(`source audit ${artifactDigest}.mediaType differs`);
    const method = text(value.method, `source audit ${artifactDigest}.method`);
    if (!AUDIT_METHODS.has(method)) throw new Error(`source audit ${artifactDigest}.method differs`);
    const locators = textList(value.locators, `source audit ${artifactDigest}.locators`);
    const prefix = mediaType === "application/pdf" ? "pdf-page" : "archive-member";
    if (locators.some((locator) => !locator.startsWith(prefix))) throw new Error(`source audit ${artifactDigest}.locators differ`);
    const newlyLoadBearing = flag(value.newlyLoadBearingForPhase9, `source audit ${artifactDigest}.newlyLoadBearingForPhase9`);
    if (newlyLoadBearing && mediaType === "application/pdf" && method !== "reused-load-bearing-page-visual-audit" && method !== "phase9-targeted-load-bearing-page-audit") throw new Error(`newly load-bearing PDF ${artifactDigest} lacks a load-bearing audit`);
    if (newlyLoadBearing && mediaType === "application/zip" && method !== "reused-archive-member-audit") throw new Error(`newly load-bearing archive ${artifactDigest} lacks a member audit`);
    const evidence = record(value.auditEvidence, `source audit ${artifactDigest}.auditEvidence`);
    exactKeys(evidence, ["path", "sha256"], `source audit ${artifactDigest}.auditEvidence`);
    const path = text(evidence.path, `source audit ${artifactDigest}.auditEvidence.path`);
    const evidenceBytes = inputs.auditEvidenceBytes.get(path);
    if (evidenceBytes === undefined || sha256Bytes(evidenceBytes) !== digest(evidence.sha256, `source audit ${artifactDigest}.auditEvidence.sha256`)) throw new Error(`source audit ${artifactDigest} evidence differs`);
    evidencePaths.add(path);
    const reviewer = record(value.reviewer, `source audit ${artifactDigest}.reviewer`);
    exactKeys(reviewer, ["context", "identity", "kind", "limits", "reviewDate"], `source audit ${artifactDigest}.reviewer`);
    for (const field of ["context", "identity", "limits", "reviewDate"] as const) text(reviewer[field], `source audit ${artifactDigest}.reviewer.${field}`);
    if (reviewer.kind !== "reused-record" && reviewer.kind !== "phase9-targeted-review") throw new Error(`source audit ${artifactDigest}.reviewer.kind differs`);
  }
  if (canonicalJson([...seen].sort(compareText)) !== canonicalJson([...mediaByDigest.keys()].sort(compareText))) throw new Error("source audit digest coverage differs");
  if (canonicalJson([...evidencePaths].sort(compareText)) !== canonicalJson([...inputs.auditEvidenceBytes.keys()].sort(compareText))) throw new Error("source audit evidence set differs");
  if (inputs.scope === "registered-20260812") {
    if (canonicalJson([...evidencePaths].sort(compareText)) !== canonicalJson(Object.keys(AUDIT_EVIDENCE_PINS).sort(compareText))) throw new Error("registered source audit evidence paths differ");
    for (const [path, expected] of Object.entries(AUDIT_EVIDENCE_PINS)) if (sha256Bytes(inputs.auditEvidenceBytes.get(path) as Uint8Array) !== expected) throw new Error(`registered source audit evidence ${path} differs`);
    const sato = values.find((value) => value.artifactSha256 === "3b2003581d94e04c6d4e3d611d1c229e326df28a7d16997a1b09c2f561f68d4d");
    if (sato === undefined || sato.method !== "phase9-targeted-load-bearing-page-audit" || sato.newlyLoadBearingForPhase9 !== true || canonicalJson(sato.locators) !== canonicalJson(["pdf-page:6;competitive-vapor-depletion;Figure-2", "pdf-page:7;supersaturation-decrease;crystal-spacing-limit", "pdf-page:15;Figure-14;temperature-exposure-history", "pdf-page:16;Figure-15;initial-N-42;preactivation-N-36", "pdf-page:17;Figure-16;small-N0-112-N-89;large-N0-49-N-48", "pdf-page:18;Figure-17;frozen-droplet-N-20;peculiar-shape-35-percent"])) throw new Error("Sato targeted visual audit differs");
    if (values.filter((value) => value.newlyLoadBearingForPhase9 === true).length !== 8) throw new Error("newly load-bearing audit count differs");
  }
  return values;
}

export function verifyPhase9SourceOverlayPublication(
  inputs: Phase9SourceOverlayVerifyInputs,
  loader: Phase9SourceOverlayVerifyLoader,
): Phase9SourceOverlayVerification {
  validateRegisteredInputs(inputs);
  if (canonicalJson([...inputs.published.keys()].sort(compareText)) !== canonicalJson([...OUTPUT_NAMES].sort(compareText))) {
    throw new Error("published source-overlay file set differs");
  }
  const sourceAliases = aliases(inputs);
  if (sourceAliases.length !== 70) throw new Error("source alias count differs");
  const groups = new Map<string, Alias[]>();
  for (const alias of sourceAliases) {
    const group = groups.get(alias.sha256) ?? [];
    group.push(alias);
    groups.set(alias.sha256, group);
  }
  if (groups.size !== 59) throw new Error("complete-artifact SHA dedup count differs");
  const dispositionByDigest = validateDispositionRows(inputs.dispositionsBytes, new Set(groups.keys()));
  const mediaByDigest = new Map([...groups.entries()].map(([artifactDigest, group]) => {
    const media = new Set(group.map((alias) => alias.mediaType));
    if (media.size !== 1) throw new Error(`artifact ${artifactDigest} media aliases differ`);
    return [artifactDigest, group[0]?.mediaType as string];
  }));
  const auditRows = validateAuditRows(inputs, mediaByDigest);
  const expectedAuditBytes = jsonl(auditRows);
  if (!sameBytes(inputs.published.get("source-audits.jsonl") as Uint8Array, expectedAuditBytes)) {
    throw new Error("published source audits differ from the registered audit ledger");
  }
  const expectedOverlay: Record<string, unknown>[] = [];
  for (const sha256 of [...groups.keys()].sort(compareText)) {
    const group = (groups.get(sha256) as Alias[]).sort((left, right) => compareText(canonicalJson(left), canonicalJson(right)));
    const media = new Set(group.map((alias) => alias.mediaType));
    if (media.size !== 1) throw new Error(`artifact ${sha256} media aliases differ`);
    const paths = [...new Set(group.map((alias) => alias.path))].sort(compareText);
    let byteLength: number | undefined;
    for (const path of paths) {
      const bytes = loader.load(path);
      if (sha256Bytes(bytes) !== sha256) throw new Error(`source ${path} digest differs`);
      byteLength ??= bytes.byteLength;
      if (byteLength !== bytes.byteLength) throw new Error(`artifact ${sha256} alias lengths differ`);
    }
    for (const alias of group) {
      if (alias.expectedBytes !== undefined && alias.expectedBytes !== byteLength) throw new Error(`source ${alias.path} length differs`);
    }
    expectedOverlay.push({
      aliases: group.map((alias) => ({ path: alias.path, register: alias.registry, sourceId: alias.sourceId })),
      byteLength: byteLength as number,
      canonicalPath: paths[0] as string,
      disposition: dispositionByDigest.get(sha256) as Record<string, unknown>,
      mediaType: group[0]?.mediaType as string,
      schema: "phase9-source-overlay-record-v1",
      sha256,
    });
  }
  const expectedOverlayBytes = jsonl(expectedOverlay);
  const publishedOverlayBytes = inputs.published.get("source-overlay.jsonl") as Uint8Array;
  if (!sameBytes(publishedOverlayBytes, expectedOverlayBytes)) throw new Error("published source overlay differs from source bytes");

  const blockerRows = rows(inputs.blockersBytes, "source blockers", true);
  if (blockerRows.length !== 10) throw new Error("blocker count differs");
  const acquisitionAuditReportBytes = loader.load(ACQUISITION_AUDIT_PATHS.report);
  const partialAttemptsBytes = loader.load(ACQUISITION_AUDIT_PATHS.partialAttempts);
  if (inputs.scope === "registered-20260812" && (sha256Bytes(acquisitionAuditReportBytes) !== ACQUISITION_AUDIT_PINS.report || sha256Bytes(partialAttemptsBytes) !== ACQUISITION_AUDIT_PINS.partialAttempts)) throw new Error("registered partial-attempt audit bytes differ");
  let acquisitionAuditValue: unknown;
  try {
    acquisitionAuditValue = JSON.parse(decode(acquisitionAuditReportBytes, "Phase 8B acquisition audit")) as unknown;
  } catch {
    throw new Error("Phase 8B acquisition audit is not JSON");
  }
  const acquisitionAudit = record(acquisitionAuditValue, "Phase 8B acquisition audit");
  exactKeys(acquisitionAudit, ["byteCount", "firstPageRenderPassCount", "invalidPdfCount", "pageCount", "partialAttemptsSha256", "partialCorruptAttemptCount", "pdfCount", "pdfRegisterSha256", "pdfinfoPassCount", "schema", "sourceRoot"], "Phase 8B acquisition audit");
  if (acquisitionAudit.schema !== "phase8b-acquisition-audit-report-v1" || acquisitionAudit.partialCorruptAttemptCount !== 7 || acquisitionAudit.partialAttemptsSha256 !== sha256Bytes(partialAttemptsBytes)) throw new Error("Phase 8B acquisition audit binding differs");
  const registeredPartials = rows(partialAttemptsBytes, "Phase 8B partial attempts");
  if (registeredPartials.length !== 7) throw new Error("registered partial-attempt count differs");
  const partialByPath = new Map<string, Record<string, unknown>>();
  for (const value of registeredPartials) {
    exactKeys(value, ["bytes", "disposition", "relativePath", "schema"], "Phase 8B partial attempt");
    if (value.schema !== "phase8b-partial-acquisition-v1" || value.disposition !== "partial-corrupt-not-a-source-pdf") throw new Error("Phase 8B partial-attempt record differs");
    const relativePath = text(value.relativePath, "partial relativePath");
    count(value.bytes, `partial ${relativePath}.bytes`);
    if (partialByPath.has(relativePath)) throw new Error(`duplicate registered partial ${relativePath}`);
    partialByPath.set(relativePath, value);
  }
  const partialRows = blockerRows.filter((row) => row.kind === "partial-corrupt-attempt");
  const missingRows = blockerRows.filter((row) => row.kind === "missing-full-text");
  if (partialRows.length !== 7 || missingRows.length !== 3) throw new Error("blocker kind counts differ");
  const blockerIds = new Set<string>();
  const blockerIdentities = new Set<string>();
  const knowledge = rows(inputs.knowledgeRegisterBytes, "knowledge register");
  const knowledgeById = new Map(knowledge.map((value) => [text(value.sourceId, "knowledge sourceId"), value]));
  for (const blocker of blockerRows) {
    const isPartial = blocker.kind === "partial-corrupt-attempt";
    exactKeys(blocker, isPartial ? ["affectedShelfItems", "blockerId", "byteLength", "identity", "kind", "prerequisite", "schema", "sha256", "sourceRecordId", "status"] : ["affectedShelfItems", "blockerId", "identity", "kind", "prerequisite", "schema", "sourceRecordId", "status"], "source blocker");
    if (blocker.schema !== "phase9-source-blocker-v1") throw new Error("source blocker schema differs");
    const blockerId = text(blocker.blockerId, "blocker id");
    const identity = text(blocker.identity, "blocker identity");
    if (!/^P9B-(?:MISSING|PARTIAL)-[A-Z0-9-]+$/.test(blockerId) || blockerIds.has(blockerId) || blockerIdentities.has(identity)) throw new Error(`source blocker ${identity} identity/id differs`);
    blockerIds.add(blockerId); blockerIdentities.add(identity);
    const affected = textList(blocker.affectedShelfItems, `source blocker ${identity}.affectedShelfItems`);
    if (affected.some((item) => !SHELF_ITEMS.has(item))) throw new Error(`source blocker ${identity} has an unknown shelf item`);
    text(blocker.prerequisite, `source blocker ${identity}.prerequisite`);
    if (!isPartial) {
      const sourceRecordId = text(blocker.sourceRecordId, `source blocker ${identity}.sourceRecordId`);
      const expected = MISSING_SOURCE_ROSTER[sourceRecordId as keyof typeof MISSING_SOURCE_ROSTER];
      const knowledgeRow = knowledgeById.get(sourceRecordId);
      if (expected === undefined || knowledgeRow === undefined) throw new Error(`missing source ${identity} lacks knowledge provenance`);
      const knowledgeIdentity = record(knowledgeRow.identity, `knowledge ${sourceRecordId}.identity`);
      const local = record(knowledgeRow.local, `knowledge ${sourceRecordId}.local`);
      if (knowledgeIdentity.doi !== identity.slice(identity.indexOf("DOI ") + 4) || knowledgeIdentity.year !== Number(identity.match(/\b(19|20)\d{2}\b/u)?.[0]) || typeof local.pdfStatus !== "string" || !/absent|no legitimate PDF|no authorized full text/iu.test(local.pdfStatus)) throw new Error(`missing source ${identity} does not match knowledge provenance`);
      if (canonicalJson({ affectedShelfItems: affected, blockerId, identity, prerequisite: blocker.prerequisite, status: blocker.status }) !== canonicalJson(expected)) throw new Error(`missing source ${sourceRecordId} roster mapping differs`);
    }
  }
  for (const blocker of partialRows) {
    const path = text(blocker.identity, "partial path");
    if (blocker.sourceRecordId !== "P8B-ACQUISITION-AUDIT-V2") throw new Error(`partial source ${path} sourceRecordId differs`);
    const prefix = "research-cache/phase8b-search/acquired-sources-20260811-v1/";
    if (!path.startsWith(prefix)) throw new Error(`partial source ${path} path differs`);
    const relativePath = path.slice(prefix.length);
    const registered = partialByPath.get(relativePath);
    if (registered === undefined || registered.bytes !== blocker.byteLength) throw new Error(`partial source ${path} is absent from the acquisition audit`);
    const bytes = loader.load(path);
    if (bytes.byteLength !== count(blocker.byteLength, "partial byteLength") || sha256Bytes(bytes) !== digest(blocker.sha256, "partial digest")) {
      throw new Error(`partial source ${path} differs`);
    }
    if (sourceAliases.some((alias) => alias.path === path)) throw new Error(`partial path ${path} was admitted as a complete alias`);
    const lineage = relativePath.startsWith("gonda-1971-skeletal-dendritic") ? "GONDA" : relativePath.startsWith("nakaya-1957-diffusion-cloud-chamber") ? "NAKAYA" : null;
    if (lineage === null) throw new Error(`partial source ${path} lineage differs`);
    const lineagePrefix = lineage === "GONDA" ? "gonda-1971-skeletal-dendritic" : "nakaya-1957-diffusion-cloud-chamber";
    const lineagePaths = [...partialByPath.keys()].filter((value) => value.startsWith(lineagePrefix)).sort(compareText);
    const expectedId = `P9B-PARTIAL-${lineage}-${String(lineagePaths.indexOf(relativePath) + 1).padStart(2, "0")}`;
    const expectedShelf = lineage === "GONDA" ? ["M-PT", "M-LH", "M-GP"] : ["S2-CONTROLS"];
    const expectedStatus = lineage === "GONDA" ? "resolved-by-complete-artifact" : "source-blocked";
    if (blocker.blockerId !== expectedId || canonicalJson(blocker.affectedShelfItems) !== canonicalJson(expectedShelf) || blocker.status !== expectedStatus) throw new Error(`partial source ${path} id/shelf/status differs`);
  }
  const nakaya = partialRows.filter((row) => text(row.identity, "partial identity").includes("nakaya-1957"));
  const gonda = partialRows.filter((row) => text(row.identity, "partial identity").includes("gonda-1971"));
  if (nakaya.length !== 4 || new Set(nakaya.map((row) => row.sha256)).size !== 3 || nakaya.some((row) => row.status !== "source-blocked") ||
      gonda.length !== 3 || new Set(gonda.map((row) => row.sha256)).size !== 2 || gonda.some((row) => row.status !== "resolved-by-complete-artifact")) {
    throw new Error("partial lineage/status distinctions differ");
  }
  const hasCompleteGonda = inputs.scope === "registered-20260812"
    ? groups.has("2ea39d1bd3d62f87101cf1041c43225e9bb24e3b0be25fc61df3228a7499dfd8")
    : gonda.some((row) => groups.has(digest(row.sha256, "Gonda partial digest")));
  if (!hasCompleteGonda) throw new Error("resolved Gonda partials lack a complete artifact");
  const publishedBlockers = inputs.published.get("blockers.jsonl") as Uint8Array;
  if (!sameBytes(publishedBlockers, inputs.blockersBytes)) throw new Error("published blockers differ from the registered ledger");

  const expectedShelfBytes = canonicalJsonBytes(shelfFreeze(expectedOverlay, blockerRows));
  if (!sameBytes(inputs.published.get("shelf-freeze.json") as Uint8Array, expectedShelfBytes)) {
    throw new Error("published shelf freeze differs from independently derived mappings");
  }
  const pdfs = expectedOverlay.filter((row) => row.mediaType === "application/pdf").length;
  const zipArchives = expectedOverlay.filter((row) => row.mediaType === "application/zip").length;
  if (pdfs !== 55 || zipArchives !== 4) throw new Error("media counts differ");
  const uniquePartialDigests = new Set(partialRows.map((row) => row.sha256)).size;
  if (uniquePartialDigests !== 5) throw new Error("partial digest count differs");
  const reportArtifacts = [
    desc("blockers.jsonl", publishedBlockers, "canonical-jsonl"),
    desc("shelf-freeze.json", expectedShelfBytes, "canonical-json"),
    desc("source-audits.jsonl", expectedAuditBytes, "canonical-jsonl"),
    desc("source-overlay.jsonl", expectedOverlayBytes, "canonical-jsonl"),
  ];
  const reportBytes = canonicalJsonBytes({
    adoptionCommit: inputs.adoptionCommit,
    artifacts: reportArtifacts,
    claimBoundary: {
      grantsValidationClaim: false,
      literatureExhaustive: false,
      modelScoresProduced: 0,
      phase6OrPhase7Credit: false,
    },
    counts: {
      aliases: 70,
      auditRows: auditRows.length,
      blockerRows: 10,
      completeArtifactBytes: expectedOverlay.reduce((sum, row) => sum + count(row.byteLength, "overlay byteLength"), 0),
      completeArtifacts: 59,
      missingFullTexts: 3,
      newlyLoadBearingAuditRows: auditRows.filter((row) => row.newlyLoadBearingForPhase9 === true).length,
      partialAttemptPaths: 7,
      pdfs: 55,
      resolvedGondaPartialPaths: 3,
      uniquePartialAttemptDigests: 5,
      unresolvedNakayaPartialPaths: 4,
      zipArchives: 4,
    },
    inputs: inputDescriptors(inputs, acquisitionAuditReportBytes, partialAttemptsBytes),
    operator: OPERATOR,
    schema: "phase9-source-overlay-report-v1",
    state: "candidate-awaiting-independent-verification",
  });
  const publishedReport = inputs.published.get("report.json") as Uint8Array;
  if (!sameBytes(publishedReport, reportBytes)) throw new Error("published report differs from independently derived bytes");
  const indexBytes = canonicalJsonBytes({
    artifacts: [
      desc("blockers.jsonl", publishedBlockers, "canonical-jsonl"),
      desc("report.json", reportBytes, "canonical-json"),
      desc("shelf-freeze.json", expectedShelfBytes, "canonical-json"),
      desc("source-audits.jsonl", expectedAuditBytes, "canonical-jsonl"),
      desc("source-overlay.jsonl", expectedOverlayBytes, "canonical-jsonl"),
    ],
    operator: OPERATOR,
    schema: "phase9-source-overlay-index-v1",
  });
  if (!sameBytes(inputs.published.get("artifact-index.json") as Uint8Array, indexBytes)) {
    throw new Error("published artifact index differs from independently derived bytes");
  }
  // Parsing after byte comparison gives a separate fail-closed check for duplicate keys and
  // alternate number spellings in the verdict-bearing report and index.
  parseCanonicalJson(publishedReport, "published source-overlay report");
  parseCanonicalJson(indexBytes, "published source-overlay index");
  return {
    ok: true,
    aliases: 70,
    completeArtifacts: 59,
    pdfs: 55,
    zipArchives: 4,
    missingFullTexts: 3,
    partialAttemptPaths: 7,
    uniquePartialAttemptDigests: 5,
    modelScoresProduced: 0,
  };
}

export function captureRegisteredPhase9SourceOverlayVerification(
  repository: string,
  publicationDirectory: string,
): Phase9SourceOverlayVerifyInputs {
  const read = (path: string): Uint8Array => new Uint8Array(readFileSync(join(repository, path)));
  const names = readdirSync(publicationDirectory).sort(compareText);
  const published = new Map(names.map((name) => [name, new Uint8Array(readFileSync(join(publicationDirectory, name)))]));
  return {
    scope: "registered-20260812",
    adoptionCommit: ADOPTION_COMMIT,
    phase8IndexBytes: read(PATHS.phase8Index),
    phase8TargetBookBytes: read(PATHS.phase8TargetBook),
    acquiredRegisterBytes: read(PATHS.acquiredRegister),
    localRegisterBytes: read(PATHS.localRegister),
    knowledgeIndexBytes: read(PATHS.knowledgeIndex),
    knowledgeRegisterBytes: read(PATHS.knowledgeRegister),
    targetedCurrencyBytes: read(PATHS.targetedCurrency),
    baconReportBytes: read(PATHS.baconReport),
    dispositionsBytes: read(PATHS.dispositions),
    blockersBytes: read(PATHS.blockers),
    auditsBytes: read(PATHS.audits),
    auditEvidenceBytes: new Map(Object.keys(AUDIT_EVIDENCE_PINS).map((path) => [path, read(path)])),
    published,
  };
}

export function phase9VerifyNasLoader(nasRoot: string): Phase9SourceOverlayVerifyLoader {
  return {
    load(path: string): Uint8Array {
      const result = resolvePhase9NasFile(path, nasRoot);
      if (result.kind !== "ok") throw new Error(`cannot independently read ${path}: ${result.reason}`);
      return new Uint8Array(readFileSync(result.path));
    },
  };
}

async function main(): Promise<void> {
  const repository = fileURLToPath(new URL("../..", import.meta.url));
  const directoryIndex = process.argv.indexOf("--dir");
  const rootIndex = process.argv.indexOf("--nas-root");
  const directory = directoryIndex >= 0 ? process.argv[directoryIndex + 1] : "evidence/phase9-source-overlay-v1";
  const explicitRoot = rootIndex >= 0 ? process.argv[rootIndex + 1] : undefined;
  if (directory === undefined || (rootIndex >= 0 && explicitRoot === undefined)) throw new Error("missing CLI argument value");
  const nasRoot = explicitRoot ?? detectPhase9NasRoot();
  if (nasRoot === null) throw new Error("snowcrystal NAS is not attached; set VCC_NAS_ROOT");
  const publicationDirectory = resolve(repository, directory);
  const inputs = captureRegisteredPhase9SourceOverlayVerification(repository, publicationDirectory);
  const result = verifyPhase9SourceOverlayPublication(inputs, phase9VerifyNasLoader(nasRoot));
  process.stdout.write(`${canonicalJson(result)}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
