// Phase 9 S0B — bounded, byte-derived source overlay producer.
//
// This module joins four already-registered source inventories by physical SHA-256, then overlays
// an explicit scientific disposition on every complete artifact. It does not score a model and it
// does not turn a source count into a validation claim. The published report remains a candidate;
// phase9-source-overlay-verify.ts owns the verdict and does not import this module.

import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
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

export const PHASE9_SOURCE_OVERLAY_OPERATOR = "phase9-source-overlay-v1" as const;
export const PHASE9_SOURCE_OVERLAY_ADOPTION_COMMIT =
  "f936920edce283e90a947ee34846776da8b1859a" as const;
export const PHASE9_SOURCE_OVERLAY_ARTIFACTS = [
  "artifact-index.json",
  "blockers.jsonl",
  "report.json",
  "shelf-freeze.json",
  "source-audits.jsonl",
  "source-overlay.jsonl",
] as const;

export const PHASE9_SOURCE_OVERLAY_PATHS = {
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

const REGISTERED_INPUT_PINS = {
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

const REGISTERED_AUDIT_EVIDENCE_PINS = {
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

const TARGETED_ARTIFACTS = [
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

const ALLOWED_DISPOSITION_STATUSES = new Set([
  "categorical-input-with-limit",
  "code-context",
  "comparator",
  "compatibility-constraint",
  "control",
  "correction",
  "derivative-context",
  "fitted-replay-only",
  "frontier",
  "prerequisite",
  "protocol-ineligible",
  "qualitative-context",
  "quantitative-input-with-limit",
  "rival-mechanism",
  "source-blocked",
]);

const ALLOWED_EVIDENCE_CLASSES = new Set([
  "categorical-observation",
  "code-or-data-archive",
  "fitted-or-inverted-model",
  "native-or-direct-quantitative",
  "plot-or-image-requiring-extraction",
  "printed-or-tabular-quantitative",
  "secondary-or-context",
  "theory-or-simulation",
]);

const ALLOWED_SHELF_ITEMS = new Set([
  "D-BT",
  "FRONTIER-ATLAS",
  "FRONTIER-COLD-END",
  "FRONTIER-ELECTRIC",
  "FRONTIER-GEOMETRY",
  "FRONTIER-INSTABILITY",
  "FRONTIER-ISOTOPE",
  "FRONTIER-RADIATIVE",
  "FRONTIER-SUBLIMATION",
  "FRONTIER-TRI",
  "FRONTIER-WANG87",
  "M-F",
  "M-GP",
  "M-GT",
  "M-H",
  "M-K2",
  "M-LH",
  "M-PK",
  "M-PT",
  "M-S",
  "M-SR",
  "M-SS",
  "M-V",
  "M-W",
  "S2-CONTROLS",
]);

const ALLOWED_RESTRICTION_KINDS = new Set([
  "acquisition",
  "extraction",
  "currency-correction",
  "currency-current-version",
  "currency-later-author-output",
  "currency-native-data",
  "currency-supplement",
]);

const ALLOWED_AUDIT_METHODS = new Set([
  "reused-page-complete-visual-audit",
  "reused-load-bearing-page-visual-audit",
  "reused-archive-member-audit",
  "phase9-targeted-load-bearing-page-audit",
]);

const EXPECTED_MISSING_SOURCE_BLOCKERS = {
  "P9K-HP26": {
    affectedShelfItems: ["M-SS"],
    blockerId: "P9B-MISSING-HP26",
    identity: "Harrington and Pokrifka 2026, DOI 10.1175/JAS-D-26-0016.1",
    prerequisite: "Acquire and inspect the final article equations, fit cases, integrator, and hollowing update.",
    status: "arm-freeze-blocked",
  },
  "P9K-KH82": {
    affectedShelfItems: ["M-V", "M-PT", "M-LH"],
    blockerId: "P9B-MISSING-KH82",
    identity: "Keller and Hallett 1982, DOI 10.1016/0022-0248(82)90176-2",
    prerequisite: "Acquire the controlled-velocity article or freeze a conservative source-supported eligibility bound; no quantitative velocity series is presently available.",
    status: "arm-freeze-blocked",
  },
  "P9K-WANG87": {
    affectedShelfItems: ["FRONTIER-WANG87"],
    blockerId: "P9B-MISSING-WANG87",
    identity: "Wang Angsheng 1987, DOI 10.1007/BF02656742",
    prerequisite: "Acquire an authorized full text before transcribing any equation or prediction; title metadata carry no model formula.",
    status: "source-blocked",
  },
} as const;

const PARTIAL_LINEAGE = {
  gonda: {
    affectedShelfItems: ["M-PT", "M-LH", "M-GP"],
    prefix: "gonda-1971-skeletal-dendritic",
    status: "resolved-by-complete-artifact",
  },
  nakaya: {
    affectedShelfItems: ["S2-CONTROLS"],
    prefix: "nakaya-1957-diffusion-cloud-chamber",
    status: "source-blocked",
  },
} as const;

type JsonObject = { readonly [key: string]: StrictJson };
type RegisterKind = "phase8-acquired" | "phase8-local" | "phase9-knowledge" | "phase9-targeted";

export interface Phase9SourceOverlayInputs {
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
  readonly fixtureTargetedArtifacts?: readonly {
    readonly sourceId: string;
    readonly path: string;
    readonly sha256: string;
    readonly byteLength: number;
    readonly mediaType: "application/pdf" | "application/zip";
  }[];
}

export interface Phase9SourceArtifactLoader {
  readonly load: (shareRelativePath: string) => Uint8Array;
}

export interface Phase9SourceOverlayBundle {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly aliases: number;
    readonly completeArtifacts: number;
    readonly pdfs: number;
    readonly zipArchives: number;
    readonly blockerRows: number;
    readonly missingFullTexts: number;
    readonly partialAttemptPaths: number;
    readonly uniquePartialAttemptDigests: number;
  };
}

interface Alias {
  readonly register: RegisterKind;
  readonly sourceId: string;
  readonly path: string;
  readonly sha256: string;
  readonly mediaType: "application/pdf" | "application/zip";
  readonly expectedByteLength?: number;
}

interface LoadedPhysical {
  readonly aliases: readonly Alias[];
  readonly byteLength: number;
  readonly canonicalPath: string;
  readonly mediaType: "application/pdf" | "application/zip";
  readonly sha256: string;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(compareText);
  const expected = [...keys].sort(compareText);
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} keys differ`);
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a nonempty string`);
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
  return value;
}

function strings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0 ||
      value.some((item) => typeof item !== "string" || item.length === 0) ||
      new Set(value).size !== value.length) {
    throw new Error(`${label} must be a nonempty unique string array`);
  }
  return value as string[];
}

function sha256(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} must be lowercase SHA-256`);
  return result;
}

function decodeLf(bytes: Uint8Array, label: string): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} must be UTF-8`);
  }
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${label} must be LF-terminated`);
  return text;
}

function parseJsonl(
  bytes: Uint8Array,
  label: string,
  requireCanonical = false,
): readonly Record<string, unknown>[] {
  const text = decodeLf(bytes, label);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${label} has an empty row`);
  return lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    const row = object(value, `${label} row ${index + 1}`);
    if (requireCanonical && canonicalJson(row) !== line) {
      throw new Error(`${label} row ${index + 1} is not canonical JSON`);
    }
    return row;
  });
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function descriptor(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { byteLength: bytes.byteLength, format, path, sha256: sha256Bytes(bytes) };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validateRegisteredPins(inputs: Phase9SourceOverlayInputs): void {
  if (inputs.scope !== "registered-20260812") return;
  if (inputs.adoptionCommit !== PHASE9_SOURCE_OVERLAY_ADOPTION_COMMIT) {
    throw new Error("Phase 9 adoption commit differs");
  }
  for (const [key, want] of Object.entries(REGISTERED_INPUT_PINS)) {
    const bytes = inputs[`${key}Bytes` as keyof Phase9SourceOverlayInputs];
    if (!(bytes instanceof Uint8Array) || sha256Bytes(bytes) !== want) {
      throw new Error(`registered ${key} bytes differ`);
    }
  }
  const targetRows = decodeLf(inputs.phase8TargetBookBytes, "successor target book").slice(0, -1).split("\n");
  if (targetRows.length !== 51) throw new Error("Phase 8 successor target book must contain 51 rows");
  parseCanonicalJson(inputs.phase8IndexBytes, "Phase 8 final index");
  try {
    object(JSON.parse(decodeLf(inputs.knowledgeIndexBytes, "Phase 9 knowledge index")) as unknown, "Phase 9 knowledge index");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Phase 9 knowledge index")) throw error;
    throw new Error("Phase 9 knowledge index is not JSON");
  }
}

function acquiredAliases(inputs: Phase9SourceOverlayInputs): readonly Alias[] {
  const rows = parseJsonl(inputs.acquiredRegisterBytes, "Phase 8 acquired source register");
  if (inputs.scope === "registered-20260812" && rows.length !== 28) throw new Error("acquired source count differs");
  return rows.map((row, index) => {
    const locator = object(row.artifactLocator, `acquired row ${index + 1}.artifactLocator`);
    const path = `${string(locator.nasRoot, "acquired nasRoot")}/${string(locator.relativePath, "acquired path")}`;
    return {
      register: "phase8-acquired",
      sourceId: string(row.sourceId, "acquired sourceId"),
      path,
      sha256: sha256(locator.sha256, "acquired sha256"),
      mediaType: "application/pdf",
      expectedByteLength: integer(locator.bytes, "acquired bytes"),
    };
  });
}

function localAliases(inputs: Phase9SourceOverlayInputs): readonly Alias[] {
  const rows = parseJsonl(inputs.localRegisterBytes, "Phase 8 local source register");
  if (inputs.scope === "registered-20260812" && rows.length !== 23) throw new Error("local source count differs");
  return rows.map((row) => {
    const mediaType = string(row.mediaType, "local mediaType");
    if (mediaType !== "application/pdf" && mediaType !== "application/zip") {
      throw new Error("local source media type differs");
    }
    return {
      register: "phase8-local",
      sourceId: string(row.id, "local sourceId"),
      path: `${string(row.logicalRoot, "local logicalRoot")}/${string(row.relativePath, "local relativePath")}`,
      sha256: sha256(row.sha256, "local sha256"),
      mediaType,
      expectedByteLength: integer(row.byteLength, "local byteLength"),
    };
  });
}

function knowledgeAliases(inputs: Phase9SourceOverlayInputs): readonly Alias[] {
  const rows = parseJsonl(inputs.knowledgeRegisterBytes, "Phase 9 knowledge source register");
  if (inputs.scope === "registered-20260812" && rows.length !== 18) throw new Error("knowledge source count differs");
  const result: Alias[] = [];
  for (const row of rows) {
    const sourceId = string(row.sourceId, "knowledge sourceId");
    const local = object(row.local, `knowledge ${sourceId}.local`);
    for (const item of [
      ["path", "sha256", sourceId],
      ["archivePath", "archiveSha256", sourceId],
      ["codeArchive", "codeSha256", `${sourceId}-CODE`],
    ] as const) {
      const rawPath = local[item[0]];
      if (rawPath === undefined) continue;
      const path = normalizeFrozenKnowledgeNasPath(string(rawPath, `knowledge ${sourceId}.${item[0]}`));
      const mediaType = path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".zip") ? "application/zip" : null;
      if (mediaType === null) throw new Error(`knowledge ${sourceId} artifact extension differs`);
      result.push({
        register: "phase9-knowledge",
        sourceId: item[2],
        path,
        sha256: sha256(local[item[1]], `knowledge ${sourceId}.${item[1]}`),
        mediaType,
      });
    }
  }
  if (inputs.scope === "registered-20260812" && result.length !== 17) {
    throw new Error("knowledge complete-artifact alias count differs");
  }
  return result;
}

function targetedAliases(inputs: Phase9SourceOverlayInputs): readonly Alias[] {
  const targetText = decodeLf(inputs.targetedCurrencyBytes, "targeted currency record");
  const bacon = canonicalJson(parseCanonicalJson(inputs.baconReportBytes, "Bacon report"));
  const targets = inputs.scope === "test-fixture"
    ? inputs.fixtureTargetedArtifacts
    : TARGETED_ARTIFACTS;
  if (targets === undefined || targets.length !== 2) throw new Error("targeted artifact count differs");
  return targets.map((target) => {
    if (!targetText.includes(target.path) || !targetText.includes(target.sha256)) {
      throw new Error(`targeted currency record does not bind ${target.sourceId}`);
    }
    if (target.sourceId.includes("BACON") && (!bacon.includes(target.path) || !bacon.includes(target.sha256))) {
      throw new Error("Bacon report does not bind the derivative archive");
    }
    return {
      register: "phase9-targeted",
      sourceId: target.sourceId,
      path: target.path,
      sha256: target.sha256,
      mediaType: target.mediaType,
      expectedByteLength: target.byteLength,
    };
  });
}

function loadPhysical(aliases: readonly Alias[], loader: Phase9SourceArtifactLoader): readonly LoadedPhysical[] {
  const byDigest = new Map<string, Alias[]>();
  for (const alias of aliases) {
    const existing = byDigest.get(alias.sha256) ?? [];
    existing.push(alias);
    byDigest.set(alias.sha256, existing);
  }
  const result: LoadedPhysical[] = [];
  for (const digest of [...byDigest.keys()].sort()) {
    const group = (byDigest.get(digest) as Alias[]).sort((left, right) => compareText(canonicalJson(left), canonicalJson(right)));
    const mediaTypes = new Set(group.map((alias) => alias.mediaType));
    if (mediaTypes.size !== 1) throw new Error(`artifact ${digest} aliases disagree on media type`);
    const paths = [...new Set(group.map((alias) => alias.path))].sort();
    let commonByteLength: number | undefined;
    for (const path of paths) {
      const bytes = loader.load(path);
      const actualDigest = sha256Bytes(bytes);
      if (actualDigest !== digest) throw new Error(`NAS artifact ${path} digest differs`);
      if (commonByteLength === undefined) commonByteLength = bytes.byteLength;
      if (commonByteLength !== bytes.byteLength) throw new Error(`artifact ${digest} aliases disagree on byte length`);
    }
    for (const alias of group) {
      if (alias.expectedByteLength !== undefined && alias.expectedByteLength !== commonByteLength) {
        throw new Error(`NAS artifact ${alias.path} byte length differs`);
      }
    }
    result.push({
      aliases: group,
      byteLength: commonByteLength as number,
      canonicalPath: paths[0] as string,
      mediaType: group[0]?.mediaType as "application/pdf" | "application/zip",
      sha256: digest,
    });
  }
  return result;
}

function dispositions(inputs: Phase9SourceOverlayInputs, physical: readonly LoadedPhysical[]): ReadonlyMap<string, Record<string, unknown>> {
  const rows = parseJsonl(inputs.dispositionsBytes, "Phase 9 source dispositions", true);
  const result = new Map<string, Record<string, unknown>>();
  const restrictionIds = new Set<string>();
  for (const row of rows) {
    exactKeys(row, [
      "acquisitionPrerequisite",
      "artifactSha256",
      "currency",
      "evidenceClass",
      "extractionPrerequisite",
      "limitation",
      "planEffect",
      "protocol",
      "protocolDisposition",
      "schema",
      "shelfItems",
      "status",
    ], "source disposition");
    if (row.schema !== "phase9-source-disposition-v1") throw new Error("source disposition schema differs");
    const digest = sha256(row.artifactSha256, "source disposition artifactSha256");
    if (result.has(digest)) throw new Error(`duplicate source disposition ${digest}`);
    for (const field of ["acquisitionPrerequisite", "extractionPrerequisite", "limitation", "planEffect"] as const) {
      string(row[field], `source disposition ${digest}.${field}`);
    }
    const status = string(row.status, `source disposition ${digest}.status`);
    if (!ALLOWED_DISPOSITION_STATUSES.has(status)) throw new Error(`source disposition ${digest}.status differs`);
    const evidenceClass = string(row.evidenceClass, `source disposition ${digest}.evidenceClass`);
    if (!ALLOWED_EVIDENCE_CLASSES.has(evidenceClass)) throw new Error(`source disposition ${digest}.evidenceClass differs`);
    const shelfItems = strings(row.shelfItems, `source disposition ${digest}.shelfItems`);
    if (shelfItems.some((item) => !ALLOWED_SHELF_ITEMS.has(item))) {
      throw new Error(`source disposition ${digest}.shelfItems contains an unknown item`);
    }
    const currency = object(row.currency, `source disposition ${digest}.currency`);
    exactKeys(currency, ["correction", "currentVersion", "laterAuthorOutput", "nativeData", "supplement"], `source disposition ${digest}.currency`);
    for (const field of ["correction", "currentVersion", "laterAuthorOutput", "nativeData", "supplement"] as const) {
      string(currency[field], `source disposition ${digest}.currency.${field}`);
    }
    const protocol = object(row.protocol, `source disposition ${digest}.protocol`);
    exactKeys(protocol, ["ensemble", "forcing", "geometry", "observable", "pressureGas", "support", "ventilation"], `source disposition ${digest}.protocol`);
    for (const field of ["ensemble", "forcing", "geometry", "observable", "pressureGas", "support", "ventilation"] as const) {
      string(protocol[field], `source disposition ${digest}.protocol.${field}`);
    }
    const protocolDisposition = object(row.protocolDisposition, `source disposition ${digest}.protocolDisposition`);
    exactKeys(protocolDisposition, ["required", "restrictions"], `source disposition ${digest}.protocolDisposition`);
    const required = boolean(protocolDisposition.required, `source disposition ${digest}.protocolDisposition.required`);
    if (!Array.isArray(protocolDisposition.restrictions)) {
      throw new Error(`source disposition ${digest}.protocolDisposition.restrictions must be an array`);
    }
    const restrictions = protocolDisposition.restrictions.map((value, index) => {
      const restriction = object(value, `source disposition ${digest}.restriction ${index + 1}`);
      exactKeys(restriction, ["id", "kind", "text"], `source disposition ${digest}.restriction ${index + 1}`);
      const id = string(restriction.id, `source disposition ${digest}.restriction.id`);
      if (!/^P9R-[0-9A-F]{16}-[A-Z_]+$/.test(id) || restrictionIds.has(id)) {
        throw new Error(`source disposition ${digest}.restriction.id differs`);
      }
      restrictionIds.add(id);
      const kind = string(restriction.kind, `source disposition ${digest}.restriction.kind`);
      if (!ALLOWED_RESTRICTION_KINDS.has(kind)) throw new Error(`source disposition ${digest}.restriction.kind differs`);
      const restrictionText = string(restriction.text, `source disposition ${digest}.restriction.text`);
      const currencyFieldByKind: Readonly<Record<string, string>> = {
        "currency-correction": "correction",
        "currency-current-version": "currentVersion",
        "currency-later-author-output": "laterAuthorOutput",
        "currency-native-data": "nativeData",
        "currency-supplement": "supplement",
      };
      const fieldValue = kind === "acquisition"
        ? row.acquisitionPrerequisite
        : kind === "extraction"
          ? row.extractionPrerequisite
          : currency[currencyFieldByKind[kind] as string];
      if (restrictionText !== fieldValue) throw new Error(`source disposition ${digest}.restriction text is not source-bound`);
      return restriction;
    });
    if (required !== (restrictions.length > 0)) {
      throw new Error(`source disposition ${digest}.protocolDisposition.required differs`);
    }
    result.set(digest, row);
  }
  const physicalDigests = physical.map((row) => row.sha256).sort();
  if (canonicalJson([...result.keys()].sort()) !== canonicalJson(physicalDigests)) {
    throw new Error("source dispositions do not cover the exact complete-artifact digest set");
  }
  return result;
}

function validateAudits(
  inputs: Phase9SourceOverlayInputs,
  physical: readonly LoadedPhysical[],
): readonly Record<string, unknown>[] {
  const rows = parseJsonl(inputs.auditsBytes, "Phase 9 source audits", true);
  const physicalByDigest = new Map(physical.map((row) => [row.sha256, row]));
  const seen = new Set<string>();
  const referencedEvidence = new Set<string>();
  for (const row of rows) {
    exactKeys(row, [
      "artifactSha256",
      "auditEvidence",
      "locators",
      "mediaType",
      "method",
      "newlyLoadBearingForPhase9",
      "reviewer",
      "schema",
    ], "source audit");
    if (row.schema !== "phase9-source-audit-v1") throw new Error("source audit schema differs");
    const artifactDigest = sha256(row.artifactSha256, "source audit artifactSha256");
    if (seen.has(artifactDigest)) throw new Error(`duplicate source audit ${artifactDigest}`);
    seen.add(artifactDigest);
    const artifact = physicalByDigest.get(artifactDigest);
    if (artifact === undefined) throw new Error(`source audit ${artifactDigest} does not name a complete artifact`);
    if (row.mediaType !== artifact.mediaType) throw new Error(`source audit ${artifactDigest}.mediaType differs`);
    const method = string(row.method, `source audit ${artifactDigest}.method`);
    if (!ALLOWED_AUDIT_METHODS.has(method)) throw new Error(`source audit ${artifactDigest}.method differs`);
    const locators = strings(row.locators, `source audit ${artifactDigest}.locators`);
    const locatorPrefix = artifact.mediaType === "application/pdf" ? "pdf-page" : "archive-member";
    if (locators.some((locator) => !locator.startsWith(locatorPrefix))) {
      throw new Error(`source audit ${artifactDigest}.locators do not match its media type`);
    }
    const newlyLoadBearing = boolean(row.newlyLoadBearingForPhase9, `source audit ${artifactDigest}.newlyLoadBearingForPhase9`);
    if (newlyLoadBearing && artifact.mediaType === "application/pdf" &&
        method !== "reused-load-bearing-page-visual-audit" &&
        method !== "phase9-targeted-load-bearing-page-audit") {
      throw new Error(`newly load-bearing PDF ${artifactDigest} lacks a targeted page audit`);
    }
    if (newlyLoadBearing && artifact.mediaType === "application/zip" && method !== "reused-archive-member-audit") {
      throw new Error(`newly load-bearing archive ${artifactDigest} lacks a member audit`);
    }
    const evidence = object(row.auditEvidence, `source audit ${artifactDigest}.auditEvidence`);
    exactKeys(evidence, ["path", "sha256"], `source audit ${artifactDigest}.auditEvidence`);
    const evidencePath = string(evidence.path, `source audit ${artifactDigest}.auditEvidence.path`);
    const evidenceDigest = sha256(evidence.sha256, `source audit ${artifactDigest}.auditEvidence.sha256`);
    const evidenceBytes = inputs.auditEvidenceBytes.get(evidencePath);
    if (evidenceBytes === undefined || sha256Bytes(evidenceBytes) !== evidenceDigest) {
      throw new Error(`source audit ${artifactDigest} evidence bytes differ`);
    }
    referencedEvidence.add(evidencePath);
    const reviewer = object(row.reviewer, `source audit ${artifactDigest}.reviewer`);
    exactKeys(reviewer, ["context", "identity", "kind", "limits", "reviewDate"], `source audit ${artifactDigest}.reviewer`);
    for (const field of ["context", "identity", "limits", "reviewDate"] as const) {
      string(reviewer[field], `source audit ${artifactDigest}.reviewer.${field}`);
    }
    if (reviewer.kind !== "reused-record" && reviewer.kind !== "phase9-targeted-review") {
      throw new Error(`source audit ${artifactDigest}.reviewer.kind differs`);
    }
  }
  if (canonicalJson([...seen].sort(compareText)) !== canonicalJson([...physicalByDigest.keys()].sort(compareText))) {
    throw new Error("source audits do not cover the exact complete-artifact digest set");
  }
  if (canonicalJson([...referencedEvidence].sort(compareText)) !== canonicalJson([...inputs.auditEvidenceBytes.keys()].sort(compareText))) {
    throw new Error("source audit evidence byte set differs");
  }
  if (inputs.scope === "registered-20260812") {
    const expectedEvidencePaths = Object.keys(REGISTERED_AUDIT_EVIDENCE_PINS).sort(compareText);
    if (canonicalJson([...referencedEvidence].sort(compareText)) !== canonicalJson(expectedEvidencePaths)) {
      throw new Error("registered source audit evidence paths differ");
    }
    for (const [path, expectedDigest] of Object.entries(REGISTERED_AUDIT_EVIDENCE_PINS)) {
      const bytes = inputs.auditEvidenceBytes.get(path);
      if (bytes === undefined || sha256Bytes(bytes) !== expectedDigest) throw new Error(`registered source audit evidence ${path} differs`);
    }
    const sato = rows.find((row) => row.artifactSha256 === "3b2003581d94e04c6d4e3d611d1c229e326df28a7d16997a1b09c2f561f68d4d");
    if (sato === undefined || sato.method !== "phase9-targeted-load-bearing-page-audit" ||
        sato.newlyLoadBearingForPhase9 !== true || canonicalJson(sato.locators) !== canonicalJson([
          "pdf-page:6;competitive-vapor-depletion;Figure-2",
          "pdf-page:7;supersaturation-decrease;crystal-spacing-limit",
          "pdf-page:15;Figure-14;temperature-exposure-history",
          "pdf-page:16;Figure-15;initial-N-42;preactivation-N-36",
          "pdf-page:17;Figure-16;small-N0-112-N-89;large-N0-49-N-48",
          "pdf-page:18;Figure-17;frozen-droplet-N-20;peculiar-shape-35-percent",
        ])) {
      throw new Error("Sato targeted visual audit differs");
    }
    if (rows.filter((row) => row.newlyLoadBearingForPhase9 === true).length !== 8) {
      throw new Error("newly load-bearing source audit count differs");
    }
  }
  return rows;
}

interface BlockerValidation {
  readonly rows: readonly Record<string, unknown>[];
  readonly acquisitionAuditReportBytes: Uint8Array;
  readonly partialAttemptsBytes: Uint8Array;
}

function validateAndLoadBlockers(
  inputs: Phase9SourceOverlayInputs,
  loader: Phase9SourceArtifactLoader,
  physical: readonly LoadedPhysical[],
): BlockerValidation {
  const rows = parseJsonl(inputs.blockersBytes, "Phase 9 source blockers", true);
  if (rows.length !== 10) throw new Error("source blocker row count differs");
  const acquisitionAuditReportBytes = loader.load(ACQUISITION_AUDIT_PATHS.report);
  const partialAttemptsBytes = loader.load(ACQUISITION_AUDIT_PATHS.partialAttempts);
  if (inputs.scope === "registered-20260812" &&
      (sha256Bytes(acquisitionAuditReportBytes) !== ACQUISITION_AUDIT_PINS.report ||
       sha256Bytes(partialAttemptsBytes) !== ACQUISITION_AUDIT_PINS.partialAttempts)) {
    throw new Error("registered Phase 8B partial-attempt audit bytes differ");
  }
  let acquisitionAuditValue: unknown;
  try {
    acquisitionAuditValue = JSON.parse(decodeLf(acquisitionAuditReportBytes, "Phase 8B acquisition audit")) as unknown;
  } catch {
    throw new Error("Phase 8B acquisition audit is not JSON");
  }
  const acquisitionAudit = object(acquisitionAuditValue, "Phase 8B acquisition audit");
  exactKeys(acquisitionAudit, [
    "byteCount",
    "firstPageRenderPassCount",
    "invalidPdfCount",
    "pageCount",
    "partialAttemptsSha256",
    "partialCorruptAttemptCount",
    "pdfCount",
    "pdfRegisterSha256",
    "pdfinfoPassCount",
    "schema",
    "sourceRoot",
  ], "Phase 8B acquisition audit");
  if (acquisitionAudit.schema !== "phase8b-acquisition-audit-report-v1" ||
      acquisitionAudit.partialCorruptAttemptCount !== 7 ||
      acquisitionAudit.partialAttemptsSha256 !== sha256Bytes(partialAttemptsBytes)) {
    throw new Error("Phase 8B acquisition audit partial-attempt binding differs");
  }
  const registeredPartials = parseJsonl(partialAttemptsBytes, "Phase 8B partial attempts");
  if (registeredPartials.length !== 7) throw new Error("Phase 8B partial-attempt count differs");
  const partialByRelativePath = new Map<string, Record<string, unknown>>();
  for (const partial of registeredPartials) {
    exactKeys(partial, ["bytes", "disposition", "relativePath", "schema"], "Phase 8B partial attempt");
    if (partial.schema !== "phase8b-partial-acquisition-v1" || partial.disposition !== "partial-corrupt-not-a-source-pdf") {
      throw new Error("Phase 8B partial-attempt schema/disposition differs");
    }
    const relativePath = string(partial.relativePath, "Phase 8B partial relativePath");
    integer(partial.bytes, `Phase 8B partial ${relativePath}.bytes`);
    if (partialByRelativePath.has(relativePath)) throw new Error(`duplicate Phase 8B partial ${relativePath}`);
    partialByRelativePath.set(relativePath, partial);
  }
  const knowledgeRows = parseJsonl(inputs.knowledgeRegisterBytes, "Phase 9 knowledge source register");
  const knowledgeById = new Map(knowledgeRows.map((row) => [string(row.sourceId, "knowledge sourceId"), row]));
  const identities = new Set<string>();
  const blockerIds = new Set<string>();
  let missing = 0;
  let partial = 0;
  for (const row of rows) {
    const isPartial = row.kind === "partial-corrupt-attempt";
    exactKeys(row, isPartial
      ? ["affectedShelfItems", "blockerId", "byteLength", "identity", "kind", "prerequisite", "schema", "sha256", "sourceRecordId", "status"]
      : ["affectedShelfItems", "blockerId", "identity", "kind", "prerequisite", "schema", "sourceRecordId", "status"],
    "source blocker");
    if (row.schema !== "phase9-source-blocker-v1") throw new Error("source blocker schema differs");
    const blockerId = string(row.blockerId, "source blocker blockerId");
    if (!/^P9B-(?:MISSING|PARTIAL)-[A-Z0-9-]+$/.test(blockerId) || blockerIds.has(blockerId)) {
      throw new Error(`source blocker blockerId ${blockerId} differs`);
    }
    blockerIds.add(blockerId);
    const identity = string(row.identity, "source blocker identity");
    if (identities.has(identity)) throw new Error(`duplicate source blocker identity ${identity}`);
    identities.add(identity);
    string(row.prerequisite, `source blocker ${identity}.prerequisite`);
    const affected = strings(row.affectedShelfItems, `source blocker ${identity}.affectedShelfItems`);
    if (affected.some((item) => !ALLOWED_SHELF_ITEMS.has(item))) {
      throw new Error(`source blocker ${identity}.affectedShelfItems contains an unknown item`);
    }
    if (row.kind === "missing-full-text") {
      missing += 1;
      if (row.sha256 !== undefined || row.byteLength !== undefined) throw new Error(`missing full text ${identity} claims bytes`);
      const sourceRecordId = string(row.sourceRecordId, `missing full text ${identity}.sourceRecordId`);
      const expected = EXPECTED_MISSING_SOURCE_BLOCKERS[sourceRecordId as keyof typeof EXPECTED_MISSING_SOURCE_BLOCKERS];
      const knowledge = knowledgeById.get(sourceRecordId);
      if (expected === undefined || knowledge === undefined) throw new Error(`missing full text ${identity} lacks a registered knowledge source`);
      const knowledgeIdentity = object(knowledge.identity, `knowledge ${sourceRecordId}.identity`);
      const local = object(knowledge.local, `knowledge ${sourceRecordId}.local`);
      if (knowledgeIdentity.doi !== identity.slice(identity.indexOf("DOI ") + 4) ||
          knowledgeIdentity.year !== Number(identity.match(/\b(19|20)\d{2}\b/u)?.[0]) ||
          typeof local.pdfStatus !== "string" || !/absent|no legitimate PDF|no authorized full text/iu.test(local.pdfStatus)) {
        throw new Error(`missing full text ${identity} is not derived from its registered knowledge record`);
      }
      if (canonicalJson({
        affectedShelfItems: affected,
        blockerId,
        identity,
        prerequisite: row.prerequisite,
        status: row.status,
      }) !== canonicalJson(expected)) {
        throw new Error(`missing full text ${sourceRecordId} roster mapping differs`);
      }
    } else if (row.kind === "partial-corrupt-attempt") {
      partial += 1;
      if (row.sourceRecordId !== "P8B-ACQUISITION-AUDIT-V2") throw new Error(`partial attempt ${identity} sourceRecordId differs`);
      const prefix = "research-cache/phase8b-search/acquired-sources-20260811-v1/";
      if (!identity.startsWith(prefix)) throw new Error(`partial attempt ${identity} path differs`);
      const relativePath = identity.slice(prefix.length);
      const registered = partialByRelativePath.get(relativePath);
      if (registered === undefined || registered.bytes !== row.byteLength) {
        throw new Error(`partial attempt ${identity} is not in the Phase 8B acquisition audit`);
      }
      const bytes = loader.load(identity);
      if (bytes.byteLength !== integer(row.byteLength, `source blocker ${identity}.byteLength`) ||
          sha256Bytes(bytes) !== sha256(row.sha256, `source blocker ${identity}.sha256`)) {
        throw new Error(`partial attempt ${identity} bytes differ`);
      }
      const lineage = relativePath.startsWith(PARTIAL_LINEAGE.gonda.prefix) ? "gonda" :
        relativePath.startsWith(PARTIAL_LINEAGE.nakaya.prefix) ? "nakaya" : null;
      if (lineage === null) throw new Error(`partial attempt ${identity} lineage differs`);
      const expectedLineage = PARTIAL_LINEAGE[lineage];
      if (canonicalJson(affected) !== canonicalJson(expectedLineage.affectedShelfItems) || row.status !== expectedLineage.status) {
        throw new Error(`partial attempt ${identity} shelf/status mapping differs`);
      }
      const lineageOrder = [...partialByRelativePath.keys()].filter((path) => path.startsWith(expectedLineage.prefix)).sort(compareText);
      const expectedBlockerId = `P9B-PARTIAL-${lineage.toUpperCase()}-${String(lineageOrder.indexOf(relativePath) + 1).padStart(2, "0")}`;
      if (blockerId !== expectedBlockerId) throw new Error(`partial attempt ${identity} blockerId differs`);
    } else {
      throw new Error(`source blocker ${identity}.kind differs`);
    }
  }
  if (missing !== 3 || partial !== 7) throw new Error("source blocker kind counts differ");
  const nakaya = rows.filter((row) => row.kind === "partial-corrupt-attempt" && string(row.identity, "identity").includes("nakaya-1957"));
  const gonda = rows.filter((row) => row.kind === "partial-corrupt-attempt" && string(row.identity, "identity").includes("gonda-1971"));
  if (nakaya.length !== 4 || new Set(nakaya.map((row) => row.sha256)).size !== 3 ||
      gonda.length !== 3 || new Set(gonda.map((row) => row.sha256)).size !== 2) {
    throw new Error("partial-attempt lineage counts differ");
  }
  if (nakaya.some((row) => row.status !== "source-blocked") ||
      gonda.some((row) => row.status !== "resolved-by-complete-artifact")) {
    throw new Error("partial-attempt resolution status differs");
  }
  const hasCompleteGonda = inputs.scope === "registered-20260812"
    ? physical.some((row) => row.sha256 === "2ea39d1bd3d62f87101cf1041c43225e9bb24e3b0be25fc61df3228a7499dfd8")
    : gonda.some((row) => physical.some((artifact) => artifact.sha256 === row.sha256));
  if (!hasCompleteGonda) {
    throw new Error("resolved Gonda partial attempts lack the complete canonical artifact");
  }
  return { rows, acquisitionAuditReportBytes, partialAttemptsBytes };
}

function inputBindings(
  inputs: Phase9SourceOverlayInputs,
  blockerValidation: BlockerValidation,
): readonly JsonObject[] {
  const values = [
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.phase8Index, inputs.phase8IndexBytes, "canonical-json"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.phase8TargetBook, inputs.phase8TargetBookBytes, "canonical-jsonl"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.acquiredRegister, inputs.acquiredRegisterBytes, "canonical-jsonl"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.localRegister, inputs.localRegisterBytes, "canonical-jsonl"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.knowledgeIndex, inputs.knowledgeIndexBytes, "json"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.knowledgeRegister, inputs.knowledgeRegisterBytes, "canonical-jsonl"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.targetedCurrency, inputs.targetedCurrencyBytes, "markdown"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.baconReport, inputs.baconReportBytes, "canonical-json"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.dispositions, inputs.dispositionsBytes, "canonical-jsonl"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.blockers, inputs.blockersBytes, "canonical-jsonl"),
    descriptor(PHASE9_SOURCE_OVERLAY_PATHS.audits, inputs.auditsBytes, "canonical-jsonl"),
    descriptor(ACQUISITION_AUDIT_PATHS.report, blockerValidation.acquisitionAuditReportBytes, "json"),
    descriptor(ACQUISITION_AUDIT_PATHS.partialAttempts, blockerValidation.partialAttemptsBytes, "jsonl"),
    ...[...inputs.auditEvidenceBytes.entries()].map(([path, bytes]) => descriptor(
      path,
      bytes,
      path.endsWith(".json") ? "canonical-json" : "markdown",
    )),
  ];
  const byPath = new Map<string, JsonObject>();
  for (const value of values) {
    const path = String(value.path);
    const existing = byPath.get(path);
    if (existing !== undefined && canonicalJson(existing) !== canonicalJson(value)) {
      throw new Error(`input descriptor ${path} differs across bindings`);
    }
    byPath.set(path, value);
  }
  return [...byPath.values()].sort((left, right) => compareText(String(left.path), String(right.path)));
}

function deriveShelfFreeze(
  overlayRows: readonly Record<string, unknown>[],
  blockerRows: readonly Record<string, unknown>[],
): JsonObject {
  const shelf = new Map<string, {
    artifacts: Set<string>;
    restrictions: Map<string, JsonObject>;
    blockers: Map<string, Record<string, unknown>>;
    protocolDispositionRequired: boolean;
  }>();
  const get = (item: string) => {
    const existing = shelf.get(item);
    if (existing !== undefined) return existing;
    const value = {
      artifacts: new Set<string>(),
      restrictions: new Map<string, JsonObject>(),
      blockers: new Map<string, Record<string, unknown>>(),
      protocolDispositionRequired: false,
    };
    shelf.set(item, value);
    return value;
  };
  for (const overlay of overlayRows) {
    const disposition = object(overlay.disposition, "overlay disposition");
    for (const item of disposition.shelfItems as string[]) {
      const row = get(item);
      const artifactDigest = string(overlay.sha256, "overlay sha256");
      row.artifacts.add(artifactDigest);
      const protocolDisposition = object(disposition.protocolDisposition, "disposition protocolDisposition");
      row.protocolDispositionRequired ||= boolean(protocolDisposition.required, "protocolDisposition.required");
      for (const restrictionValue of protocolDisposition.restrictions as readonly unknown[]) {
        const restriction = object(restrictionValue, "protocol restriction");
        const id = string(restriction.id, "protocol restriction id");
        row.restrictions.set(id, {
          artifactSha256: artifactDigest,
          id,
          kind: string(restriction.kind, "protocol restriction kind"),
          text: string(restriction.text, "protocol restriction text"),
        });
      }
    }
  }
  for (const blocker of blockerRows) {
    if (blocker.status === "resolved-by-complete-artifact") continue;
    for (const item of blocker.affectedShelfItems as string[]) {
      get(item).blockers.set(string(blocker.blockerId, "blocker id"), blocker);
    }
  }
  const rows = [...shelf.entries()].sort(([left], [right]) => compareText(left, right)).map(([item, value]) => ({
    blockerIdentities: [...value.blockers.values()].map((blocker) => string(blocker.identity, "blocker identity")).sort(compareText),
    completeArtifactCount: value.artifacts.size,
    completeArtifactSha256: [...value.artifacts].sort(),
    item,
    protocolDispositionRequired: value.protocolDispositionRequired,
    protocolDispositionState: value.protocolDispositionRequired ? "pending" : "not-required",
    protocolRestrictions: [...value.restrictions.values()].sort((left, right) => compareText(String(left.id), String(right.id))),
    sourceBlocked: [...value.blockers.values()].some((blocker) => blocker.status === "source-blocked"),
    sourceBlockerIds: [...value.blockers.keys()].sort(compareText),
    sourceBlockerPresent: value.blockers.size > 0,
    sourceBlockerStatuses: [...new Set([...value.blockers.values()].map((blocker) => string(blocker.status, "blocker status")))].sort(compareText),
  }));
  return {
    claimBoundary: {
      grantsValidationClaim: false,
      modelScoresProduced: 0,
      protocolDispositionDerivedFromExplicitFields: true,
      sourceBlockersApplyOnlyToMappedShelfItems: true,
      sourceMappingFrozen: true,
    },
    operator: PHASE9_SOURCE_OVERLAY_OPERATOR,
    schema: "phase9-source-shelf-freeze-v1",
    shelf: rows,
  };
}

export function derivePhase9SourceOverlayBundle(
  inputs: Phase9SourceOverlayInputs,
  loader: Phase9SourceArtifactLoader,
): Phase9SourceOverlayBundle {
  validateRegisteredPins(inputs);
  const aliases = [
    ...acquiredAliases(inputs),
    ...localAliases(inputs),
    ...knowledgeAliases(inputs),
    ...targetedAliases(inputs),
  ];
  const physical = loadPhysical(aliases, loader);
  const dispositionMap = dispositions(inputs, physical);
  const auditRows = validateAudits(inputs, physical);
  const blockerValidation = validateAndLoadBlockers(inputs, loader, physical);
  const blockerRows = blockerValidation.rows;
  if (aliases.length !== 70 || physical.length !== 59) throw new Error("bounded source universe counts differ");
  const pdfs = physical.filter((row) => row.mediaType === "application/pdf").length;
  const zipArchives = physical.filter((row) => row.mediaType === "application/zip").length;
  if (pdfs !== 55 || zipArchives !== 4) throw new Error("bounded media counts differ");

  const overlayRows = physical.map((row): Record<string, unknown> => ({
    aliases: row.aliases.map((alias) => ({ path: alias.path, register: alias.register, sourceId: alias.sourceId })),
    byteLength: row.byteLength,
    canonicalPath: row.canonicalPath,
    disposition: dispositionMap.get(row.sha256) as Record<string, unknown>,
    mediaType: row.mediaType,
    schema: "phase9-source-overlay-record-v1",
    sha256: row.sha256,
  }));
  const overlayBytes = jsonl(overlayRows);
  const blockersBytes = jsonl(blockerRows);
  const auditsBytes = jsonl(auditRows);
  const shelfBytes = canonicalJsonBytes(deriveShelfFreeze(overlayRows, blockerRows));
  const partialDigests = new Set(blockerRows.filter((row) => row.kind === "partial-corrupt-attempt").map((row) => row.sha256));
  const counts = {
    aliases: aliases.length,
    completeArtifacts: physical.length,
    pdfs,
    zipArchives,
    blockerRows: blockerRows.length,
    missingFullTexts: blockerRows.filter((row) => row.kind === "missing-full-text").length,
    partialAttemptPaths: blockerRows.filter((row) => row.kind === "partial-corrupt-attempt").length,
    uniquePartialAttemptDigests: partialDigests.size,
  } as const;
  const reportBytes = canonicalJsonBytes({
    adoptionCommit: inputs.adoptionCommit,
    artifacts: [
      descriptor("blockers.jsonl", blockersBytes, "canonical-jsonl"),
      descriptor("shelf-freeze.json", shelfBytes, "canonical-json"),
      descriptor("source-audits.jsonl", auditsBytes, "canonical-jsonl"),
      descriptor("source-overlay.jsonl", overlayBytes, "canonical-jsonl"),
    ],
    claimBoundary: {
      grantsValidationClaim: false,
      literatureExhaustive: false,
      modelScoresProduced: 0,
      phase6OrPhase7Credit: false,
    },
    counts: {
      ...counts,
      auditRows: auditRows.length,
      completeArtifactBytes: physical.reduce((sum, row) => sum + row.byteLength, 0),
      newlyLoadBearingAuditRows: auditRows.filter((row) => row.newlyLoadBearingForPhase9 === true).length,
      resolvedGondaPartialPaths: blockerRows.filter((row) => row.status === "resolved-by-complete-artifact").length,
      unresolvedNakayaPartialPaths: blockerRows.filter((row) => row.kind === "partial-corrupt-attempt" && row.status === "source-blocked").length,
    },
    inputs: inputBindings(inputs, blockerValidation),
    operator: PHASE9_SOURCE_OVERLAY_OPERATOR,
    schema: "phase9-source-overlay-report-v1",
    state: "candidate-awaiting-independent-verification",
  });
  const indexBytes = canonicalJsonBytes({
    artifacts: [
      descriptor("blockers.jsonl", blockersBytes, "canonical-jsonl"),
      descriptor("report.json", reportBytes, "canonical-json"),
      descriptor("shelf-freeze.json", shelfBytes, "canonical-json"),
      descriptor("source-audits.jsonl", auditsBytes, "canonical-jsonl"),
      descriptor("source-overlay.jsonl", overlayBytes, "canonical-jsonl"),
    ],
    operator: PHASE9_SOURCE_OVERLAY_OPERATOR,
    schema: "phase9-source-overlay-index-v1",
  });
  return {
    artifacts: new Map([
      ["artifact-index.json", indexBytes],
      ["blockers.jsonl", blockersBytes],
      ["report.json", reportBytes],
      ["shelf-freeze.json", shelfBytes],
      ["source-audits.jsonl", auditsBytes],
      ["source-overlay.jsonl", overlayBytes],
    ]),
    counts,
  };
}

export function captureRegisteredPhase9SourceOverlayInputs(repository: string): Phase9SourceOverlayInputs {
  const read = (path: string): Uint8Array => new Uint8Array(readFileSync(join(repository, path)));
  return {
    scope: "registered-20260812",
    adoptionCommit: PHASE9_SOURCE_OVERLAY_ADOPTION_COMMIT,
    phase8IndexBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.phase8Index),
    phase8TargetBookBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.phase8TargetBook),
    acquiredRegisterBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.acquiredRegister),
    localRegisterBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.localRegister),
    knowledgeIndexBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.knowledgeIndex),
    knowledgeRegisterBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.knowledgeRegister),
    targetedCurrencyBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.targetedCurrency),
    baconReportBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.baconReport),
    dispositionsBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.dispositions),
    blockersBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.blockers),
    auditsBytes: read(PHASE9_SOURCE_OVERLAY_PATHS.audits),
    auditEvidenceBytes: new Map(Object.keys(REGISTERED_AUDIT_EVIDENCE_PINS).map((path) => [path, read(path)])),
  };
}

export function phase9NasLoader(nasRoot: string): Phase9SourceArtifactLoader {
  return {
    load(relativePath: string): Uint8Array {
      const resolved = resolvePhase9NasFile(relativePath, nasRoot);
      if (resolved.kind !== "ok") throw new Error(`cannot load NAS source ${relativePath}: ${resolved.reason}`);
      return new Uint8Array(readFileSync(resolved.path));
    },
  };
}

export function writePhase9SourceOverlayDirectory(directory: string, bundle: Phase9SourceOverlayBundle): void {
  const canonicalDirectory = resolve(directory);
  const parent = dirname(canonicalDirectory);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(canonicalDirectory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const [name, bytes] of bundle.artifacts) writeFileSync(join(staging, name), bytes, { flag: "wx" });
    renameSync(staging, canonicalDirectory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

async function main(): Promise<void> {
  const repository = fileURLToPath(new URL("../..", import.meta.url));
  const outputIndex = process.argv.indexOf("--out");
  const rootIndex = process.argv.indexOf("--nas-root");
  const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : "evidence/phase9-source-overlay-v1";
  const explicitRoot = rootIndex >= 0 ? process.argv[rootIndex + 1] : undefined;
  if (output === undefined || (rootIndex >= 0 && explicitRoot === undefined)) throw new Error("missing CLI argument value");
  const nasRoot = explicitRoot ?? detectPhase9NasRoot();
  if (nasRoot === null) throw new Error("snowcrystal NAS is not attached; set VCC_NAS_ROOT");
  const inputs = captureRegisteredPhase9SourceOverlayInputs(repository);
  const bundle = derivePhase9SourceOverlayBundle(inputs, phase9NasLoader(nasRoot));
  writePhase9SourceOverlayDirectory(resolve(repository, output), bundle);
  process.stdout.write(`${canonicalJson({ counts: bundle.counts, state: "candidate-awaiting-independent-verification" })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
