// Phase 8B local source-denominator derivation and verification.
//
// This is a Node-only evidence boundary. It inventories source containers and their page/member
// units, but deliberately does not classify scientific content. Every source unit emitted here is
// pending until Phase 8B S3's two blind reviews reconcile it.

import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import {
  canonicalJson,
  canonicalJsonBytes,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE8B_LOCAL_PROTOCOL_SCHEMA = "phase8b-local-denominator-protocol-v1" as const;
export const PHASE8B_LOCAL_CONTAINER_SCHEMA = "phase8b-source-container-v1" as const;
export const PHASE8B_LOCAL_UNIT_SCHEMA = "phase8b-source-unit-v1" as const;
export const PHASE8B_LOCAL_RECONCILIATION_SCHEMA = "phase8b-cache-reconciliation-v1" as const;
export const PHASE8B_LOCAL_STATUS_SCHEMA = "phase8b-local-inventory-status-v1" as const;
export const PHASE8B_LOCAL_REPORT_SCHEMA = "phase8b-local-denominator-report-v1" as const;
export const PHASE8B_LOCAL_INDEX_SCHEMA = "phase8b-local-denominator-index-v1" as const;
export const PHASE8B_LOCAL_OPERATOR = "phase8b-local-corpus-v1" as const;
export const PHASE8B_LOCAL_CUTOFF = "2026-08-11" as const;
export const PHASE8B_REGISTERED_CACHE_MANIFEST = {
  byteLength: 20_531_852,
  sha256: "3f5b2cd66f653a75f7ed91d769e35b97194e8ffe16901a1a3267d1bf497b6846",
} as const;

export const PHASE8B_LOCAL_ARTIFACT_NAMES = [
  "artifact-index.json",
  "cache-reconciliation.json",
  "inventory-status.jsonl",
  "protocol.json",
  "report.json",
  "source-containers.jsonl",
  "source-units.jsonl",
] as const;

const PAYLOAD_NAMES = [
  "cache-reconciliation.json",
  "inventory-status.jsonl",
  "protocol.json",
  "source-containers.jsonl",
  "source-units.jsonl",
] as const;
const STATUS_DEPENDENCY_NAMES = [
  "cache-reconciliation.json",
  "protocol.json",
  "source-containers.jsonl",
  "source-units.jsonl",
] as const;
const SOURCE_CODE_PATHS = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-corpus-local.ts",
  "runner/test/phase8-corpus-local.test.ts",
] as const;
const SHA256 = /^[0-9a-f]{64}$/;

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8bFilePin {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase8bImplementationPin extends Phase8bFilePin {
  readonly gitObjectId: string;
}

export interface Phase8bCacheFileRecord extends Phase8bFilePin {
  readonly recordType: "file";
  readonly storageClass: string;
  readonly collection: string;
}

export interface Phase8bCacheManifest {
  readonly header: JsonObject;
  readonly files: readonly Phase8bCacheFileRecord[];
  readonly volatileRecords: readonly JsonObject[];
  readonly volatilePaths: readonly string[];
  readonly reparsePointCount: number;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase8bZipMember {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly bytes: Uint8Array;
}

export interface Phase8bZipInventory {
  readonly regularMembers: readonly Phase8bZipMember[];
  readonly directoryEntryCount: number;
}

export interface Phase8bLocalSnapshot {
  readonly scope: "registered-local-corpus-v1" | "test-fixture";
  readonly expectedCounts: Phase8bLocalCounts;
  readonly cacheManifestBytes: Uint8Array;
  readonly liveRelativePaths: readonly string[];
  /** Fresh bytes for every selected source container and every substantive external file. */
  readonly freshBytes: ReadonlyMap<string, Uint8Array>;
  readonly pdfPageCounts: ReadonlyMap<string, number>;
  readonly tools: {
    readonly node: string;
    readonly pdfinfo: string;
    readonly ripgrep: string;
  };
  readonly implementationPins: readonly Phase8bImplementationPin[];
}

export interface Phase8bLocalCounts {
  readonly recursiveContainerCandidateCount: number;
  readonly recursiveDocumentCandidateCount: number;
  readonly recursiveArchiveCandidateCount: number;
  readonly pdfCandidateCount: number;
  readonly zipCandidateCount: number;
  readonly tarCandidateCount: number;
  readonly gitBundleCandidateCount: number;
  readonly gitPackCandidateCount: number;
  readonly recursiveCandidateBytes: number;
  readonly excludedRecoveryCandidateCount: number;
  readonly excludedDocumentCandidateCount: number;
  readonly excludedArchiveCandidateCount: number;
  readonly excludedRecoveryCandidateBytes: number;
  readonly sourceContainerCount: number;
  readonly pdfContainerCount: number;
  readonly archiveContainerCount: number;
  readonly sourceContainerBytes: number;
  readonly pdfPageCount: number;
  readonly archiveRegularMemberCount: number;
  readonly sourceUnitCount: number;
  readonly renderReferenceCount: number;
  readonly pageWithoutRenderReferenceCount: number;
  readonly externalMirrorCount: number;
  readonly missingManifestedFileCount: number;
  readonly substantiveUnresolvedExternalFileCount: number;
  readonly pendingClassificationCount: number;
  readonly measurementSetCount: number;
}

export interface Phase8bLocalBundle {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: Phase8bLocalCounts;
  readonly sourceContainerPaths: readonly string[];
}

export const PHASE8B_REGISTERED_LOCAL_COUNTS: Phase8bLocalCounts = Object.freeze({
  recursiveContainerCandidateCount: 218,
  recursiveDocumentCandidateCount: 89,
  recursiveArchiveCandidateCount: 129,
  pdfCandidateCount: 89,
  zipCandidateCount: 3,
  tarCandidateCount: 14,
  gitBundleCandidateCount: 31,
  gitPackCandidateCount: 81,
  recursiveCandidateBytes: 883_751_692,
  excludedRecoveryCandidateCount: 195,
  excludedDocumentCandidateCount: 68,
  excludedArchiveCandidateCount: 127,
  excludedRecoveryCandidateBytes: 783_122_824,
  sourceContainerCount: 23,
  pdfContainerCount: 21,
  archiveContainerCount: 2,
  sourceContainerBytes: 100_628_868,
  pdfPageCount: 880,
  archiveRegularMemberCount: 34,
  sourceUnitCount: 914,
  renderReferenceCount: 746,
  pageWithoutRenderReferenceCount: 134,
  externalMirrorCount: 34,
  missingManifestedFileCount: 0,
  substantiveUnresolvedExternalFileCount: 0,
  pendingClassificationCount: 914,
  measurementSetCount: 0,
});

const CACHE_HEADER_KEYS = [
  "copyExitCode",
  "copyFlags",
  "copyTool",
  "digestAlgorithm",
  "excludedReparsePointCount",
  "excludedVolatileFileCount",
  "generatedAtUtc",
  "intendedRepoPath",
  "manifestKind",
  "nasContentRoot",
  "ordinaryFileBytes",
  "ordinaryFileCount",
  "orderedSourceAndNasHashListSha256",
  "rawCopyFileBytes",
  "rawCopyFileCount",
  "recordType",
  "rightsNotice",
  "schemaVersion",
  "sourceAbsoluteRoot",
  "sourceLogicalRoot",
  "sourceRepoHead",
  "verificationStatus",
] as const;

function lexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asNonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be nonempty`);
  return value;
}

function normalizedRelativePath(value: string, label: string): string {
  if (
    value.length === 0 ||
    value !== value.normalize("NFC") ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/.test(value) ||
    value.endsWith("/") ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`${label} is not a safe NFC relative path: ${JSON.stringify(value)}`);
  }
  return value;
}

function rejectDuplicateTopLevelKeys(text: string, label: string): void {
  const keys = new Set<string>();
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "{") {
      depth++;
      continue;
    }
    if (character === "}") {
      depth--;
      continue;
    }
    if (character !== '"') continue;
    const start = index;
    index++;
    while (index < text.length) {
      if (text[index] === "\\") {
        index += 2;
        continue;
      }
      if (text[index] === '"') break;
      index++;
    }
    if (index >= text.length) return;
    let next = index + 1;
    while (/\s/.test(text[next] ?? "")) next++;
    if (depth === 1 && text[next] === ":") {
      const key = JSON.parse(text.slice(start, index + 1)) as string;
      if (keys.has(key)) throw new Error(`${label} duplicates key ${key}`);
      keys.add(key);
    }
  }
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexicalCompare);
  const wanted = [...expected].sort(lexicalCompare);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} keys must be exactly ${wanted.join(",")}`);
  }
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
}

function jsonLines(records: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${records.map((record) => canonicalJson(record)).join("\n")}\n`);
}

function readUInt16(bytes: Uint8Array, offset: number, label: string): number {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error(`${label} is truncated`);
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32(bytes: Uint8Array, offset: number, label: string): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error(`${label} is truncated`);
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Strict, full-path ZIP reader for stored/deflated, single-disk, non-ZIP64 archives. */
export function phase8bReadZipInventory(archive: Uint8Array): Phase8bZipInventory {
  const label = "Phase 8B ZIP";
  if (archive.length < 22) throw new Error(`${label} is too short`);
  let eocd = -1;
  const minimum = Math.max(0, archive.length - 65_557);
  for (let offset = archive.length - 22; offset >= minimum; offset--) {
    if (readUInt32(archive, offset, label) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${label} end-of-central-directory record is missing`);
  const disk = readUInt16(archive, eocd + 4, label);
  const centralDisk = readUInt16(archive, eocd + 6, label);
  const diskEntries = readUInt16(archive, eocd + 8, label);
  const entryCount = readUInt16(archive, eocd + 10, label);
  const centralSize = readUInt32(archive, eocd + 12, label);
  const centralOffset = readUInt32(archive, eocd + 16, label);
  const commentLength = readUInt16(archive, eocd + 20, label);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== entryCount) {
    throw new Error(`${label} must be a single-disk archive`);
  }
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new Error(`${label} ZIP64 archives are unsupported`);
  }
  if (eocd + 22 + commentLength !== archive.length) throw new Error(`${label} has trailing bytes`);
  if (centralOffset + centralSize !== eocd) throw new Error(`${label} central-directory extent is invalid`);

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const members: Phase8bZipMember[] = [];
  const exactNames = new Set<string>();
  const foldedNames = new Set<string>();
  let directoryEntryCount = 0;
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index++) {
    if (readUInt32(archive, cursor, `${label} central entry ${index}`) !== 0x02014b50) {
      throw new Error(`${label} central entry ${index} has an invalid signature`);
    }
    const versionMadeBy = readUInt16(archive, cursor + 4, label);
    const flags = readUInt16(archive, cursor + 8, label);
    const method = readUInt16(archive, cursor + 10, label);
    const expectedCrc = readUInt32(archive, cursor + 16, label);
    const compressedSize = readUInt32(archive, cursor + 20, label);
    const uncompressedSize = readUInt32(archive, cursor + 24, label);
    const nameLength = readUInt16(archive, cursor + 28, label);
    const extraLength = readUInt16(archive, cursor + 30, label);
    const entryCommentLength = readUInt16(archive, cursor + 32, label);
    const diskStart = readUInt16(archive, cursor + 34, label);
    const externalAttributes = readUInt32(archive, cursor + 38, label);
    const localOffset = readUInt32(archive, cursor + 42, label);
    const end = cursor + 46 + nameLength + extraLength + entryCommentLength;
    if (end > eocd) throw new Error(`${label} central entry ${index} is truncated`);
    if (diskStart !== 0) throw new Error(`${label} member ${index} starts on another disk`);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new Error(`${label} member ${index} uses unsupported ZIP64 metadata`);
    }
    if ((flags & 1) !== 0) throw new Error(`${label} member ${index} is encrypted`);
    if ((flags & 0x0008) !== 0 || (flags & ~0x0806) !== 0) {
      throw new Error(`${label} member ${index} uses unsupported flags`);
    }
    let name: string;
    try {
      name = decoder.decode(archive.subarray(cursor + 46, cursor + 46 + nameLength));
    } catch {
      throw new Error(`${label} member ${index} name is not UTF-8`);
    }
    if (
      name !== name.normalize("NFC") ||
      name.includes("\\") ||
      name.includes("\0") ||
      name.startsWith("/") ||
      /^[A-Za-z]:/.test(name)
    ) {
      throw new Error(`${label} member has an unsafe or non-NFC path: ${JSON.stringify(name)}`);
    }
    const parts = name.split("/");
    if (parts.some((part, partIndex) => part === "." || part === ".." || (part === "" && partIndex < parts.length - 1))) {
      throw new Error(`${label} member has an unsafe path: ${JSON.stringify(name)}`);
    }
    if (exactNames.has(name)) throw new Error(`${label} has duplicate member path ${name}`);
    exactNames.add(name);
    const folded = name.normalize("NFC").toLocaleLowerCase("en-US");
    if (foldedNames.has(folded)) throw new Error(`${label} has an NFC/case-colliding member path ${name}`);
    foldedNames.add(folded);

    const host = versionMadeBy >>> 8;
    const unixType = host === 3 ? ((externalAttributes >>> 16) & 0xf000) : 0;
    const isDirectory = name.endsWith("/") || unixType === 0x4000;
    if (unixType === 0xa000) throw new Error(`${label} contains symbolic-link member ${name}`);
    if (isDirectory) {
      if (!name.endsWith("/") || uncompressedSize !== 0) {
        throw new Error(`${label} directory member ${name} is malformed`);
      }
      directoryEntryCount++;
      cursor = end;
      continue;
    }
    normalizedRelativePath(name, `${label} member path`);
    if (host === 3 && unixType !== 0 && unixType !== 0x8000) {
      throw new Error(`${label} contains non-regular member ${name}`);
    }
    if (method !== 0 && method !== 8) {
      throw new Error(`${label} member ${name} uses unsupported compression method ${method}`);
    }
    if (method === 0 && (flags & 0x0006) !== 0) {
      throw new Error(`${label} stored member ${name} has deflate-only option flags`);
    }
    if (readUInt32(archive, localOffset, `${label} local member ${name}`) !== 0x04034b50) {
      throw new Error(`${label} local member ${name} has an invalid signature`);
    }
    const localFlags = readUInt16(archive, localOffset + 6, label);
    const localMethod = readUInt16(archive, localOffset + 8, label);
    const localCrc = readUInt32(archive, localOffset + 14, label);
    const localCompressedSize = readUInt32(archive, localOffset + 18, label);
    const localUncompressedSize = readUInt32(archive, localOffset + 22, label);
    const localNameLength = readUInt16(archive, localOffset + 26, label);
    const localExtraLength = readUInt16(archive, localOffset + 28, label);
    if (localFlags !== flags || localMethod !== method || localNameLength !== nameLength) {
      throw new Error(`${label} local/central metadata disagree for ${name}`);
    }
    if (localCrc !== expectedCrc || localCompressedSize !== compressedSize || localUncompressedSize !== uncompressedSize) {
      throw new Error(`${label} local/central size or CRC metadata disagree for ${name}`);
    }
    const localName = archive.subarray(localOffset + 30, localOffset + 30 + localNameLength);
    const centralName = archive.subarray(cursor + 46, cursor + 46 + nameLength);
    if (!Buffer.from(localName).equals(Buffer.from(centralName))) {
      throw new Error(`${label} local/central names disagree for ${name}`);
    }
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressedEnd = dataOffset + compressedSize;
    if (compressedEnd > centralOffset) throw new Error(`${label} member ${name} data is truncated`);
    const compressed = archive.subarray(dataOffset, compressedEnd);
    const bytes = method === 0 ? compressed.slice() : new Uint8Array(inflateRawSync(compressed));
    if (bytes.length !== uncompressedSize) {
      throw new Error(`${label} member ${name} length ${bytes.length} != ${uncompressedSize}`);
    }
    if (crc32(bytes) !== expectedCrc) throw new Error(`${label} member ${name} fails CRC-32`);
    members.push({ path: name, byteLength: bytes.length, sha256: sha256Bytes(bytes), bytes });
    cursor = end;
  }
  if (cursor !== eocd) throw new Error(`${label} central-directory count/size disagree`);
  members.sort((left, right) => lexicalCompare(left.path, right.path));
  return { regularMembers: members, directoryEntryCount };
}

/** Parse and structurally reconcile the copied research-cache manifest. */
export function parsePhase8bCacheManifest(bytes: Uint8Array): Phase8bCacheManifest {
  const text = decodeUtf8(bytes, "research-cache manifest");
  if (!text.endsWith("\n")) throw new Error("research-cache manifest must end with LF");
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0) throw new Error("research-cache manifest is empty");
  const records = lines.map((line, index) => {
    try {
      rejectDuplicateTopLevelKeys(line, `research-cache manifest line ${index + 1}`);
      return asObject(JSON.parse(line) as unknown, `research-cache manifest line ${index + 1}`);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(`research-cache manifest line ${index + 1} is invalid JSON`);
      throw error;
    }
  });
  const header = records[0];
  exactKeys(header, CACHE_HEADER_KEYS, "research-cache manifest header");
  if (header.recordType !== "header" || header.schemaVersion !== 1 || header.manifestKind !== "vcc-research-cache") {
    throw new Error("research-cache manifest header identity is invalid");
  }
  if (header.digestAlgorithm !== "sha256") throw new Error("research-cache manifest digest must be sha256");
  const fileRecords: Phase8bCacheFileRecord[] = [];
  const volatileRecords: JsonObject[] = [];
  const volatilePaths: string[] = [];
  let reparsePointCount = 0;
  let volatileSourceBytes = 0;
  const paths = new Set<string>();
  for (let index = 1; index < records.length; index++) {
    const record = records[index];
    if (record.recordType === "file") {
      exactKeys(record, ["bytes", "collection", "path", "recordType", "sha256", "storageClass"], `cache file ${index}`);
      const path = normalizedRelativePath(asString(record.path, `cache file ${index}.path`), `cache file ${index}.path`);
      const sha256 = asString(record.sha256, `cache file ${index}.sha256`);
      if (!SHA256.test(sha256)) throw new Error(`cache file ${path} has invalid SHA-256`);
      if (paths.has(path)) throw new Error(`research-cache manifest duplicates path ${path}`);
      paths.add(path);
      fileRecords.push({
        recordType: "file",
        path,
        byteLength: asNonnegativeInteger(record.bytes, `cache file ${path}.bytes`),
        sha256,
        storageClass: asString(record.storageClass, `cache file ${path}.storageClass`),
        collection: asString(record.collection, `cache file ${path}.collection`),
      });
    } else if (record.recordType === "excludedVolatileFile") {
      exactKeys(
        record,
        ["nasObservedSha256AfterRewrite", "path", "reason", "recordType", "sourceBytes", "sourceSha256"],
        `volatile record ${index}`,
      );
      const path = normalizedRelativePath(asString(record.path, `volatile record ${index}.path`), `volatile record ${index}.path`);
      if (paths.has(path)) throw new Error(`research-cache manifest duplicates path ${path}`);
      paths.add(path);
      const sourceSha256 = asString(record.sourceSha256, `volatile record ${index}.sourceSha256`);
      const nasObservedSha256AfterRewrite = asString(
        record.nasObservedSha256AfterRewrite,
        `volatile record ${index}.nasObservedSha256AfterRewrite`,
      );
      if (!SHA256.test(sourceSha256) || !SHA256.test(nasObservedSha256AfterRewrite)) {
        throw new Error(`volatile record ${path} has invalid SHA-256`);
      }
      const sourceBytes = asNonnegativeInteger(record.sourceBytes, `volatile record ${path}.sourceBytes`);
      volatileSourceBytes += sourceBytes;
      volatilePaths.push(path);
      volatileRecords.push({
        recordType: "excludedVolatileFile",
        path,
        reason: asString(record.reason, `volatile record ${path}.reason`),
        sourceBytes,
        sourceSha256,
        nasObservedSha256AfterRewrite,
      });
    } else if (record.recordType === "excludedReparsePoint") {
      exactKeys(record, ["linkType", "path", "reason", "recordType", "target"], `reparse record ${index}`);
      normalizedRelativePath(asString(record.path, `reparse record ${index}.path`), `reparse record ${index}.path`);
      asString(record.linkType, `reparse record ${index}.linkType`);
      asString(record.target, `reparse record ${index}.target`);
      asString(record.reason, `reparse record ${index}.reason`);
      reparsePointCount++;
    } else {
      throw new Error(`research-cache manifest line ${index + 1} has unknown recordType`);
    }
  }
  fileRecords.sort((left, right) => lexicalCompare(left.path, right.path));
  volatilePaths.sort(lexicalCompare);
  const ordinaryFileCount = asNonnegativeInteger(header.ordinaryFileCount, "manifest ordinaryFileCount");
  const excludedVolatileFileCount = asNonnegativeInteger(
    header.excludedVolatileFileCount,
    "manifest excludedVolatileFileCount",
  );
  const expectedReparse = asNonnegativeInteger(header.excludedReparsePointCount, "manifest excludedReparsePointCount");
  const ordinaryFileBytes = asNonnegativeInteger(header.ordinaryFileBytes, "manifest ordinaryFileBytes");
  const rawCopyFileCount = asNonnegativeInteger(header.rawCopyFileCount, "manifest rawCopyFileCount");
  const rawCopyFileBytes = asNonnegativeInteger(header.rawCopyFileBytes, "manifest rawCopyFileBytes");
  if (fileRecords.length !== ordinaryFileCount) throw new Error("research-cache manifest file count is stale");
  if (fileRecords.reduce((sum, record) => sum + record.byteLength, 0) !== ordinaryFileBytes) {
    throw new Error("research-cache manifest ordinary byte count is stale");
  }
  if (volatilePaths.length !== excludedVolatileFileCount) throw new Error("research-cache volatile count is stale");
  if (reparsePointCount !== expectedReparse) throw new Error("research-cache reparse count is stale");
  if (rawCopyFileCount !== ordinaryFileCount + excludedVolatileFileCount) {
    throw new Error("research-cache manifest raw file count is stale");
  }
  if (rawCopyFileBytes !== ordinaryFileBytes + volatileSourceBytes) {
    throw new Error("research-cache manifest raw byte count is stale");
  }
  const sourceRepoHead = asString(header.sourceRepoHead, "manifest sourceRepoHead");
  const orderedHash = asString(
    header.orderedSourceAndNasHashListSha256,
    "manifest orderedSourceAndNasHashListSha256",
  );
  if (!/^[0-9a-f]{40}$/.test(sourceRepoHead) || !SHA256.test(orderedHash)) {
    throw new Error("research-cache manifest header hashes are invalid");
  }
  for (const key of [
    "copyFlags", "copyTool", "generatedAtUtc", "intendedRepoPath", "nasContentRoot",
    "rightsNotice", "sourceAbsoluteRoot", "sourceLogicalRoot", "verificationStatus",
  ] as const) asString(header[key], `manifest ${key}`);
  asNonnegativeInteger(header.copyExitCode, "manifest copyExitCode");
  return {
    header: header as JsonObject,
    files: fileRecords,
    volatileRecords,
    volatilePaths,
    reparsePointCount,
    byteLength: bytes.length,
    sha256: sha256Bytes(bytes),
  };
}

function idFor(prefix: string, key: string): string {
  const digest = createHash("sha256").update(key, "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `${prefix}-${digest}`;
}

function descriptor(path: string, kind: string, bytes: Uint8Array): JsonObject {
  return { path, kind, byteLength: bytes.length, sha256: sha256Bytes(bytes) };
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && Buffer.from(left).equals(Buffer.from(right));
}

function mediaType(path: string): "application/pdf" | "application/zip" {
  if (/\.pdf$/i.test(path)) return "application/pdf";
  if (/\.zip$/i.test(path)) return "application/zip";
  throw new Error(`unsupported source-container media type: ${path}`);
}

type Phase8bCandidateFormat = "pdf" | "zip" | "tar" | "git-bundle" | "git-pack";

function candidateFormat(path: string): Phase8bCandidateFormat | undefined {
  if (/\.pdf$/i.test(path)) return "pdf";
  if (/\.zip$/i.test(path)) return "zip";
  if (/\.tar$/i.test(path)) return "tar";
  if (/\.bundle$/i.test(path)) return "git-bundle";
  if (/\.pack$/i.test(path)) return "git-pack";
  return undefined;
}

function candidateMediaType(format: Phase8bCandidateFormat): string {
  if (format === "pdf") return "application/pdf";
  if (format === "zip") return "application/zip";
  if (format === "tar") return "application/x-tar";
  if (format === "git-bundle") return "application/x-git-bundle";
  return "application/x-git-pack";
}

function exactCounts(
  actual: Phase8bLocalCounts,
  expected: Phase8bLocalCounts,
  label: string,
): void {
  const keys = Object.keys(PHASE8B_REGISTERED_LOCAL_COUNTS) as (keyof Phase8bLocalCounts)[];
  const actualKeys = Object.keys(actual).sort(lexicalCompare);
  const expectedKeys = Object.keys(expected).sort(lexicalCompare);
  const registeredKeys = [...keys].sort(lexicalCompare);
  if (
    actualKeys.length !== registeredKeys.length ||
    expectedKeys.length !== registeredKeys.length ||
    actualKeys.some((key, index) => key !== registeredKeys[index]) ||
    expectedKeys.some((key, index) => key !== registeredKeys[index])
  ) {
    throw new Error(`${label} key set differs from the registered count schema`);
  }
  for (const key of keys) {
    if (actual[key] !== expected[key]) {
      throw new Error(`${label} ${key} ${actual[key]} != ${expected[key]}`);
    }
  }
}

function validateSnapshotRegistration(snapshot: Phase8bLocalSnapshot, manifest: Phase8bCacheManifest): void {
  if (snapshot.scope === "registered-local-corpus-v1") {
    if (
      manifest.byteLength !== PHASE8B_REGISTERED_CACHE_MANIFEST.byteLength ||
      manifest.sha256 !== PHASE8B_REGISTERED_CACHE_MANIFEST.sha256
    ) {
      throw new Error("registered research-cache manifest identity differs");
    }
    exactCounts(snapshot.expectedCounts, PHASE8B_REGISTERED_LOCAL_COUNTS, "registered expected count");
    if (
      manifest.volatileRecords.length !== 1 ||
      manifest.volatileRecords[0]?.path !== ".DS_Store"
    ) {
      throw new Error("registered volatile disposition must name only .DS_Store");
    }
  } else if (snapshot.scope !== "test-fixture") {
    throw new Error("snapshot scope is invalid");
  }
}

/** Derive every S0 artifact from a source snapshot; no stored verdict participates. */
export function derivePhase8bLocalBundle(snapshot: Phase8bLocalSnapshot): Phase8bLocalBundle {
  const manifest = parsePhase8bCacheManifest(snapshot.cacheManifestBytes);
  validateSnapshotRegistration(snapshot, manifest);
  for (const [name, value] of Object.entries(snapshot.tools)) {
    if (value.trim().length === 0) throw new Error(`tool identity is empty: ${name}`);
  }
  const implementationPins = [...snapshot.implementationPins].sort((left, right) => lexicalCompare(left.path, right.path));
  if (
    implementationPins.length !== SOURCE_CODE_PATHS.length ||
    implementationPins.some((pin, index) => pin.path !== [...SOURCE_CODE_PATHS].sort(lexicalCompare)[index])
  ) {
    throw new Error("implementation pin path set differs from the registered implementation");
  }
  for (const pin of implementationPins) {
    if (!Number.isSafeInteger(pin.byteLength) || pin.byteLength <= 0 || !SHA256.test(pin.sha256) ||
      !/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(pin.gitObjectId)) {
      throw new Error(`implementation pin is invalid: ${pin.path}`);
    }
  }
  const livePaths = snapshot.liveRelativePaths.map((path, index) =>
    normalizedRelativePath(path, `liveRelativePaths[${index}]`));
  if (new Set(livePaths).size !== livePaths.length) throw new Error("live file inventory contains duplicate paths");
  const live = new Set(livePaths);
  const manifested = new Map(manifest.files.map((record) => [record.path, record]));
  const missingManifested = manifest.files.filter((record) => !live.has(record.path)).map((record) => record.path);
  if (missingManifested.length > 0) {
    throw new Error(`manifested files are missing: ${missingManifested.slice(0, 5).join(",")}`);
  }
  const volatile = new Set(manifest.volatilePaths);
  const substantiveExternal = livePaths
    .filter((path) => !manifested.has(path) && !volatile.has(path))
    .sort(lexicalCompare);

  const candidates = manifest.files.filter((record) => candidateFormat(record.path) !== undefined);
  const selected: Phase8bCacheFileRecord[] = [];
  const excluded: Phase8bCacheFileRecord[] = [];
  for (const candidate of candidates) {
    const format = candidateFormat(candidate.path) as Phase8bCandidateFormat;
    if (!candidate.path.includes("/") && candidate.collection === "_root" && (format === "pdf" || format === "zip")) {
      if (candidate.storageClass !== "ignored-research-cache") {
        throw new Error(`root source candidate has unexpected storage class: ${candidate.path}`);
      }
      selected.push(candidate);
    } else if (candidate.path.startsWith("tmp/") && candidate.storageClass === "recovery-or-scratch") {
      excluded.push(candidate);
    } else {
      throw new Error(`PDF/ZIP candidate has no registered disposition: ${candidate.path}`);
    }
  }
  selected.sort((left, right) => lexicalCompare(left.path, right.path));
  excluded.sort((left, right) => lexicalCompare(left.path, right.path));
  if (selected.length === 0) throw new Error("local source-container set is empty");

  const selectedPdfStems = selected
    .filter((record) => /\.pdf$/i.test(record.path))
    .map((record) => record.path.slice(0, -4));
  const renderFiles = manifest.files.filter((record) =>
    /\.png$/i.test(record.path) && selectedPdfStems.some((stem) => record.path.startsWith(`${stem}/`)));

  const expectedFreshPaths = [
    ...candidates.map((record) => record.path),
    ...renderFiles.map((record) => record.path),
    ...substantiveExternal,
  ]
    .sort(lexicalCompare);
  const actualFreshPaths = [...snapshot.freshBytes.keys()].sort(lexicalCompare);
  if (
    actualFreshPaths.length !== expectedFreshPaths.length ||
    actualFreshPaths.some((path, index) => path !== expectedFreshPaths[index])
  ) {
    throw new Error("fresh-byte key set differs from recursive candidates, referenced renders, and external files");
  }

  for (const candidate of candidates) {
    const bytes = snapshot.freshBytes.get(candidate.path);
    if (bytes === undefined) throw new Error(`fresh candidate bytes are missing: ${candidate.path}`);
    if (bytes.length !== candidate.byteLength || sha256Bytes(bytes) !== candidate.sha256) {
      throw new Error(`recursive PDF/ZIP candidate bytes drifted from cache manifest: ${candidate.path}`);
    }
  }
  for (const render of renderFiles) {
    const bytes = snapshot.freshBytes.get(render.path);
    if (bytes === undefined) throw new Error(`fresh render bytes are missing: ${render.path}`);
    if (bytes.length !== render.byteLength || sha256Bytes(bytes) !== render.sha256) {
      throw new Error(`PDF page-render bytes drifted from cache manifest: ${render.path}`);
    }
  }

  const selectedPdfPaths = selected.filter((record) => /\.pdf$/i.test(record.path)).map((record) => record.path);
  const pageCountPaths = [...snapshot.pdfPageCounts.keys()].sort(lexicalCompare);
  if (
    pageCountPaths.length !== selectedPdfPaths.length ||
    pageCountPaths.some((path, index) => path !== selectedPdfPaths[index])
  ) {
    throw new Error("PDF page-count key set differs from selected PDF containers");
  }

  const selectedBySha = new Map<string, string>();
  const sourceContainers: JsonObject[] = [];
  const sourceUnits: JsonObject[] = [];
  const archiveMemberByPath = new Map<string, { archivePath: string; member: Phase8bZipMember }>();
  let pdfContainerCount = 0;
  let archiveContainerCount = 0;
  let sourceContainerBytes = 0;
  let pdfPageCount = 0;
  let archiveRegularMemberCount = 0;
  let renderReferenceCount = 0;

  for (const source of selected) {
    const bytes = snapshot.freshBytes.get(source.path);
    if (bytes === undefined) throw new Error(`fresh source bytes are missing: ${source.path}`);
    const actualSha = sha256Bytes(bytes);
    if (bytes.length !== source.byteLength || actualSha !== source.sha256) {
      throw new Error(`source-container bytes drifted from cache manifest: ${source.path}`);
    }
    if (selectedBySha.has(source.sha256)) throw new Error(`selected source containers duplicate bytes: ${source.path}`);
    selectedBySha.set(source.sha256, source.path);
    sourceContainerBytes += source.byteLength;
    const containerId = idFor("P8B-CONT", source.path);
    let extentKind: "pdf-pages" | "zip-regular-members";
    let extentCount: number;
    let nonRegularArchiveEntryCount = 0;
    if (mediaType(source.path) === "application/pdf") {
      pdfContainerCount++;
      extentKind = "pdf-pages";
      const pages = snapshot.pdfPageCounts.get(source.path);
      if (pages === undefined || !Number.isSafeInteger(pages) || pages <= 0) {
        throw new Error(`PDF page count is missing or invalid: ${source.path}`);
      }
      extentCount = pages;
      pdfPageCount += pages;
      const stem = source.path.slice(0, -4);
      const renderDirectoryRecords = manifest.files.filter((record) =>
        record.path.startsWith(`${stem}/`) && /\.png$/i.test(record.path));
      const renderRecords = renderDirectoryRecords.filter((record) =>
        /\/page-[0-9]{4}\.png$/.test(record.path));
      if (renderRecords.length !== renderDirectoryRecords.length) {
        throw new Error(`PDF render directory contains nonconforming PNG names: ${source.path}`);
      }
      for (const render of renderRecords) {
        const match = /\/page-([0-9]{4})\.png$/.exec(render.path);
        const page = Number(match?.[1]);
        if (!Number.isSafeInteger(page) || page < 1 || page > pages) {
          throw new Error(`page render lies outside PDF extent: ${render.path}`);
        }
      }
      for (let page = 1; page <= pages; page++) {
        const renderPath = `${stem}/page-${String(page).padStart(4, "0")}.png`;
        const render = manifested.get(renderPath);
        if (render !== undefined) renderReferenceCount++;
        sourceUnits.push({
          recordKind: "source-unit",
          schema: PHASE8B_LOCAL_UNIT_SCHEMA,
          id: idFor("P8B-UNIT", `${source.path}#pdf-page=${page}`),
          containerId,
          containerPath: source.path,
          unitKind: "pdf-page",
          locator: `pdf-page:${page}`,
          pageNumber: page,
          memberPath: null,
          contentByteLength: null,
          contentSha256: null,
          renderReference: render?.path ?? null,
          renderByteLength: render?.byteLength ?? null,
          renderSha256: render?.sha256 ?? null,
          measurementIds: [],
          reviewStatus: "pending-classification",
        });
      }
    } else {
      archiveContainerCount++;
      extentKind = "zip-regular-members";
      const inventory = phase8bReadZipInventory(bytes);
      extentCount = inventory.regularMembers.length;
      nonRegularArchiveEntryCount = inventory.directoryEntryCount;
      if (extentCount === 0) throw new Error(`source archive has no regular members: ${source.path}`);
      archiveRegularMemberCount += extentCount;
      for (const member of inventory.regularMembers) {
        if (archiveMemberByPath.has(member.path)) {
          throw new Error(`full archive member path occurs in multiple source archives: ${member.path}`);
        }
        archiveMemberByPath.set(member.path, { archivePath: source.path, member });
        sourceUnits.push({
          recordKind: "source-unit",
          schema: PHASE8B_LOCAL_UNIT_SCHEMA,
          id: idFor("P8B-UNIT", `${source.path}#zip-member=${member.path}`),
          containerId,
          containerPath: source.path,
          unitKind: "archive-member",
          locator: `zip-member:${member.path}`,
          pageNumber: null,
          memberPath: member.path,
          contentByteLength: member.byteLength,
          contentSha256: member.sha256,
          renderReference: null,
          renderByteLength: null,
          renderSha256: null,
          measurementIds: [],
          reviewStatus: "pending-classification",
        });
      }
    }
    const arxiv = /^(\d{4}\.\d{4,5})v(\d+)\.pdf$/.exec(source.path);
    sourceContainers.push({
      recordKind: "source-container",
      schema: PHASE8B_LOCAL_CONTAINER_SCHEMA,
      id: containerId,
      logicalRoot: "research-cache/content",
      relativePath: source.path,
      mediaType: mediaType(source.path),
      byteLength: source.byteLength,
      sha256: source.sha256,
      extent: { kind: extentKind, count: extentCount, nonRegularArchiveEntryCount },
      bibliographicIdentity: arxiv === null
        ? { status: "pending-official-reconciliation", localKey: source.path, identifier: null, version: null }
        : { status: "filename-identified-pending-currency-review", localKey: source.path, identifier: `arxiv:${arxiv[1]}`, version: `v${arxiv[2]}` },
      currencyStatus: "pending-s1-search",
      correctionStatus: "pending-s1-search",
      supplementStatus: "pending-s1-search",
      dataStatus: "pending-s1-search",
      rightsStatus: "pending-rights-review",
      lineageStatus: "pending-lineage-review",
      scopeStatus: "pending-inclusion-review",
    });
  }

  sourceUnits.sort((left, right) => lexicalCompare(String(left.containerPath), String(right.containerPath)) ||
    lexicalCompare(String(left.locator), String(right.locator)));
  const unitIds = sourceUnits.map((unit) => String(unit.id));
  if (new Set(unitIds).size !== unitIds.length) throw new Error("source-unit IDs collide");

  const externalMirrors: JsonObject[] = [];
  for (const path of substantiveExternal) {
    const link = archiveMemberByPath.get(path);
    if (link === undefined) throw new Error(`manifest-external file is not an archive-member mirror: ${path}`);
    const bytes = snapshot.freshBytes.get(path);
    if (bytes === undefined) throw new Error(`fresh mirror bytes are missing: ${path}`);
    const sha256 = sha256Bytes(bytes);
    if (bytes.length !== link.member.byteLength || sha256 !== link.member.sha256) {
      throw new Error(`archive-member mirror bytes disagree: ${path}`);
    }
    externalMirrors.push({
      relativePath: path,
      archivePath: link.archivePath,
      memberPath: link.member.path,
      byteLength: bytes.length,
      sha256,
      disposition: "byte-identical-extracted-member-mirror-not-source-unit",
    });
  }
  const externalSet = new Set(substantiveExternal);
  const membersWithoutMirror = [...archiveMemberByPath.keys()].filter((path) => !externalSet.has(path));
  if (membersWithoutMirror.length > 0) {
    throw new Error(`archive members lack extracted mirrors: ${membersWithoutMirror.slice(0, 5).join(",")}`);
  }

  const candidateRecords: JsonObject[] = [...selected, ...excluded]
    .sort((left, right) => lexicalCompare(left.path, right.path))
    .map((candidate) => {
      const selectedPath = !candidate.path.includes("/") && candidate.collection === "_root";
      const format = candidateFormat(candidate.path) as Phase8bCandidateFormat;
      return {
        relativePath: candidate.path,
        format,
        mediaType: candidateMediaType(format),
        byteLength: candidate.byteLength,
        sha256: candidate.sha256,
        storageClass: candidate.storageClass,
        collection: candidate.collection,
        disposition: selectedPath
          ? "source-container"
          : (format === "git-bundle" || format === "git-pack"
            ? "excluded-vcs-transport-or-object-store"
            : "excluded-recovery-or-scratch"),
        sameBytesAsSourceContainer: selectedPath ? candidate.path : (selectedBySha.get(candidate.sha256) ?? null),
      };
    });

  const counts: Phase8bLocalCounts = {
    recursiveContainerCandidateCount: candidates.length,
    recursiveDocumentCandidateCount: candidates.filter((record) => candidateFormat(record.path) === "pdf").length,
    recursiveArchiveCandidateCount: candidates.filter((record) => candidateFormat(record.path) !== "pdf").length,
    pdfCandidateCount: candidates.filter((record) => candidateFormat(record.path) === "pdf").length,
    zipCandidateCount: candidates.filter((record) => candidateFormat(record.path) === "zip").length,
    tarCandidateCount: candidates.filter((record) => candidateFormat(record.path) === "tar").length,
    gitBundleCandidateCount: candidates.filter((record) => candidateFormat(record.path) === "git-bundle").length,
    gitPackCandidateCount: candidates.filter((record) => candidateFormat(record.path) === "git-pack").length,
    recursiveCandidateBytes: candidates.reduce((sum, record) => sum + record.byteLength, 0),
    excludedRecoveryCandidateCount: excluded.length,
    excludedDocumentCandidateCount: excluded.filter((record) => candidateFormat(record.path) === "pdf").length,
    excludedArchiveCandidateCount: excluded.filter((record) => candidateFormat(record.path) !== "pdf").length,
    excludedRecoveryCandidateBytes: excluded.reduce((sum, record) => sum + record.byteLength, 0),
    sourceContainerCount: selected.length,
    pdfContainerCount,
    archiveContainerCount,
    sourceContainerBytes,
    pdfPageCount,
    archiveRegularMemberCount,
    sourceUnitCount: sourceUnits.length,
    renderReferenceCount,
    pageWithoutRenderReferenceCount: pdfPageCount - renderReferenceCount,
    externalMirrorCount: externalMirrors.length,
    missingManifestedFileCount: missingManifested.length,
    substantiveUnresolvedExternalFileCount: 0,
    pendingClassificationCount: sourceUnits.length,
    measurementSetCount: new Set(sourceUnits.flatMap((unit) => unit.measurementIds as readonly StrictJson[])).size,
  };
  exactCounts(counts, snapshot.expectedCounts, "derived local denominator count");

  const protocol = {
    schema: PHASE8B_LOCAL_PROTOCOL_SCHEMA,
    operator: PHASE8B_LOCAL_OPERATOR,
    sourceCutoffDate: PHASE8B_LOCAL_CUTOFF,
    logicalRoot: "research-cache/content",
    cacheManifest: {
      logicalPath: "research-cache/RESEARCH-CACHE-MANIFEST.jsonl",
      byteLength: manifest.byteLength,
      sha256: manifest.sha256,
    },
    denominatorRegistration: {
      scope: snapshot.scope,
      expectedCounts: snapshot.expectedCounts,
    },
    selection: {
      candidateFormats: "PDF, ZIP, POSIX TAR, Git bundle, and Git pack records; the exact registered manifest contains no GZIP/TGZ/BZIP2/XZ/7Z/RAR candidates",
      sourceContainers: "manifested root PDF/ZIP files in collection _root and storage class ignored-research-cache",
      excludedCandidates: "manifested PDF/ZIP/TAR files below tmp/ are recovery-or-scratch; Git bundle/pack files below tmp/ are VCS transport/object stores and never scientific source containers",
      sourceUnits: "one unit per pdfinfo-derived PDF page or strict full-path regular ZIP member",
      volatileFiles: "manifest-declared volatile paths are ignored without binding current presence or bytes",
      externalFiles: "every other live unmanifested file must be a byte-identical full-path ZIP-member mirror",
    },
    exactInvocations: {
      candidateBuild: [
        "node", "runner/src/phase8-corpus-local.ts", "build",
        "--content-root", "<content-root>",
        "--cache-manifest", "<cache-manifest>",
        "--bundle", "<candidate-directory>",
      ],
      replayVerify: [
        "node", "runner/src/phase8-corpus-local.ts", "verify",
        "--content-root", "<content-root>",
        "--cache-manifest", "<cache-manifest>",
        "--bundle", "<bundle-directory>",
      ],
      liveFileInventory: ["rg", "--files", "-uu", "--null", "<content-root>"],
      pdfPageExtent: ["pdfinfo", "<content-root>/<source-container.pdf>"],
      implementationIndex: ["git", "ls-files", "-s", "--", "<implementation-path>"],
      implementationBytes: ["git", "show", ":0:<implementation-path>"],
    },
    initialSourceUnitState: "pending-classification",
    tools: snapshot.tools,
    implementationPins,
    limitations: [
      "No page was visually classified by S0.",
      "Page-render bytes were freshly SHA-256 checked against the cache manifest but were not decoded or visually classified.",
      "The global cache reconciliation checks path presence; fresh SHA-256 reads cover source containers, excluded PDF/ZIP candidates, page renders, and external mirrors.",
      "Bibliographic currency, corrections, supplements, rights, lineage, inclusion, and measurements remain open.",
    ],
  };
  const reconciliation = {
    schema: PHASE8B_LOCAL_RECONCILIATION_SCHEMA,
    cacheManifest: protocol.cacheManifest,
    manifestedFileCount: manifest.files.length,
    excludedReparsePointCount: manifest.reparsePointCount,
    manifestDeclaredVolatileRecords: manifest.volatileRecords,
    missingManifestedFiles: missingManifested,
    recursiveContainerCandidates: candidateRecords,
    externalMirrors,
    unresolvedSubstantiveExternalFiles: [],
  };
  const artifacts = new Map<string, Uint8Array>();
  artifacts.set("cache-reconciliation.json", canonicalJsonBytes(reconciliation));
  artifacts.set("protocol.json", canonicalJsonBytes(protocol));
  artifacts.set("source-containers.jsonl", jsonLines(sourceContainers));
  artifacts.set("source-units.jsonl", jsonLines(sourceUnits));
  const statusDependencyDescriptors = STATUS_DEPENDENCY_NAMES.map((path) => descriptor(
    path,
    path.endsWith(".jsonl") ? "canonical-jsonl" : "canonical-json",
    artifacts.get(path) as Uint8Array,
  ));
  const status = {
    recordKind: "inventory-status",
    schema: PHASE8B_LOCAL_STATUS_SCHEMA,
    state: "local-denominator-rederived-classification-open",
    sourceCutoffDate: PHASE8B_LOCAL_CUTOFF,
    counts,
    openStates: {
      pendingClassificationCount: counts.pendingClassificationCount,
      pageWithoutRenderReferenceCount: counts.pageWithoutRenderReferenceCount,
      sourceContainerMetadataPendingCount: counts.sourceContainerCount,
    },
    grantsValidationClaim: false,
    permitsPhase9Execution: false,
    interpretationRequiresExternalReview: true,
    artifactPins: {
      cacheManifest: protocol.cacheManifest,
      corpusArtifacts: statusDependencyDescriptors,
      implementation: implementationPins,
    },
  };

  artifacts.set("inventory-status.jsonl", jsonLines([status]));
  const payloadDescriptors = PAYLOAD_NAMES.map((path) => descriptor(
    path,
    path.endsWith(".jsonl") ? "canonical-jsonl" : "canonical-json",
    artifacts.get(path) as Uint8Array,
  ));
  const report = {
    schema: PHASE8B_LOCAL_REPORT_SCHEMA,
    operator: PHASE8B_LOCAL_OPERATOR,
    state: status.state,
    artifacts: payloadDescriptors,
    derivedCounts: counts,
    claim: "The registered local source-container/page/member denominator was re-derived; repository publication, scientific classification, and extraction remain open.",
  };
  const reportBytes = canonicalJsonBytes(report);
  artifacts.set("report.json", reportBytes);
  const index = {
    schema: PHASE8B_LOCAL_INDEX_SCHEMA,
    bundleCompleteness: "complete",
    report: descriptor("report.json", "canonical-json-report", reportBytes),
    artifacts: [
      descriptor("report.json", "canonical-json-report", reportBytes),
      ...payloadDescriptors,
    ],
  };
  artifacts.set("artifact-index.json", canonicalJsonBytes(index));
  return { artifacts, counts, sourceContainerPaths: selected.map((source) => source.path) };
}

export function verifyPhase8bLocalBundleArtifacts(
  actual: ReadonlyMap<string, Uint8Array>,
  snapshot: Phase8bLocalSnapshot,
): Phase8bLocalBundle {
  const expected = derivePhase8bLocalBundle(snapshot);
  const actualNames = [...actual.keys()].sort(lexicalCompare);
  const expectedNames = [...expected.artifacts.keys()].sort(lexicalCompare);
  if (actualNames.length !== expectedNames.length || actualNames.some((name, index) => name !== expectedNames[index])) {
    throw new Error(`Phase 8B local bundle file set differs: ${actualNames.join(",")}`);
  }
  for (const name of expectedNames) {
    const actualBytes = actual.get(name) as Uint8Array;
    const expectedBytes = expected.artifacts.get(name) as Uint8Array;
    if (!bytesEqual(actualBytes, expectedBytes)) throw new Error(`Phase 8B local artifact differs: ${name}`);
  }
  return expected;
}

export function readPhase8bLocalBundleDirectory(directory: string): ReadonlyMap<string, Uint8Array> {
  const entries = readdirSync(directory, { withFileTypes: true });
  const artifacts = new Map<string, Uint8Array>();
  for (const entry of entries) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`bundle entry is not a regular file: ${entry.name}`);
    normalizedRelativePath(entry.name, "bundle artifact name");
    artifacts.set(entry.name, new Uint8Array(readFileSync(join(directory, entry.name))));
  }
  return artifacts;
}

export function writePhase8bLocalBundleDirectory(
  directory: string,
  bundle: Phase8bLocalBundle,
): void {
  const actualNames = [...bundle.artifacts.keys()].sort(lexicalCompare);
  const expectedNames = [...PHASE8B_LOCAL_ARTIFACT_NAMES].sort(lexicalCompare);
  if (
    actualNames.length !== expectedNames.length ||
    actualNames.some((name, index) => name !== expectedNames[index])
  ) {
    throw new Error(`refusing unsafe or incomplete bundle file set: ${actualNames.join(",")}`);
  }
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing bundle: ${directory}`);
  const parent = dirname(directory);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const name of [...bundle.artifacts.keys()].sort(lexicalCompare)) {
      writeFileSync(join(staging, name), bundle.artifacts.get(name) as Uint8Array, { flag: "wx" });
    }
    const reopened = readPhase8bLocalBundleDirectory(staging);
    if ([...reopened.keys()].length !== bundle.artifacts.size) throw new Error("staged bundle file count changed");
    for (const [name, bytes] of bundle.artifacts) {
      if (!bytesEqual(reopened.get(name) as Uint8Array, bytes)) throw new Error(`staged artifact changed: ${name}`);
    }
    if (existsSync(directory)) throw new Error(`bundle destination appeared before publication: ${directory}`);
    renameSync(staging, directory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  const published = readPhase8bLocalBundleDirectory(directory);
  for (const [name, bytes] of bundle.artifacts) {
    if (!bytesEqual(published.get(name) as Uint8Array, bytes)) {
      throw new Error(`published artifact changed: ${name}`);
    }
  }
}

function toolFirstLine(command: string, args: readonly string[], includeStderr = false): string {
  const result = spawnSync(command, [...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} version probe failed with ${String(result.status)}`);
  const text = includeStderr ? `${result.stdout}${result.stderr}` : result.stdout;
  const line = text.split(/\r?\n/).find((candidate) => candidate.trim().length > 0);
  if (line === undefined) throw new Error(`${command} version probe returned no text`);
  return line.trim();
}

function checkedRootRelative(root: string, absolutePath: string): string {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(absolutePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`live inventory path escapes content root: ${absolutePath}`);
  }
  return normalizedRelativePath(relative(resolvedRoot, resolvedPath).replaceAll("\\", "/"), "live file path");
}

function implementationPins(repositoryRoot: string): readonly Phase8bImplementationPin[] {
  const pins: Phase8bImplementationPin[] = [];
  for (const path of SOURCE_CODE_PATHS) {
    let indexLine: string;
    try {
      indexLine = execFileSync("git", ["ls-files", "-s", "--", path], { cwd: repositoryRoot, encoding: "utf8" }).trim();
    } catch {
      throw new Error(`could not query staged implementation path ${path}`);
    }
    const match = /^100(?:644|755) ([0-9a-f]+) 0\t(.+)$/.exec(indexLine);
    if (match === null || match[2] !== path) throw new Error(`implementation path lacks one stage-0 regular blob: ${path}`);
    const clean = spawnSync("git", ["diff", "--quiet", "--", path], { cwd: repositoryRoot });
    if (clean.status !== 0) throw new Error(`implementation working tree differs from the Git index: ${path}`);
    const bytes = execFileSync("git", ["show", `:0:${path}`], { cwd: repositoryRoot, maxBuffer: 16 * 1024 * 1024 });
    pins.push({ path, gitObjectId: match[1], byteLength: bytes.length, sha256: sha256Bytes(bytes) });
  }
  return pins;
}

export function capturePhase8bLocalSnapshot(options: {
  readonly repositoryRoot: string;
  readonly contentRoot: string;
  readonly cacheManifestPath: string;
}): Phase8bLocalSnapshot {
  const cacheManifestBytes = new Uint8Array(readFileSync(options.cacheManifestPath));
  const manifest = parsePhase8bCacheManifest(cacheManifestBytes);
  const rgOutput = execFileSync("rg", ["--files", "-uu", "--null", resolve(options.contentRoot)], {
    maxBuffer: 128 * 1024 * 1024,
  });
  const absolutePaths = Buffer.from(rgOutput).toString("utf8").split("\0").filter(Boolean);
  const liveRelativePaths = absolutePaths.map((path) => checkedRootRelative(options.contentRoot, path));
  const manifested = new Set(manifest.files.map((record) => record.path));
  const volatile = new Set(manifest.volatilePaths);
  const candidates = manifest.files.filter((record) => candidateFormat(record.path) !== undefined);
  const selected = manifest.files.filter((record) =>
    /\.(?:pdf|zip)$/i.test(record.path) && !record.path.includes("/") && record.collection === "_root");
  const selectedPdfStems = selected
    .filter((record) => /\.pdf$/i.test(record.path))
    .map((record) => record.path.slice(0, -4));
  const renderFiles = manifest.files.filter((record) =>
    /\.png$/i.test(record.path) && selectedPdfStems.some((stem) => record.path.startsWith(`${stem}/`)));
  const external = liveRelativePaths.filter((path) => !manifested.has(path) && !volatile.has(path));
  const freshBytes = new Map<string, Uint8Array>();
  for (const path of [
    ...candidates.map((record) => record.path),
    ...renderFiles.map((record) => record.path),
    ...external,
  ]) {
    const absolutePath = join(options.contentRoot, path);
    const stats = lstatSync(absolutePath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error(`evidence-bearing inventory entry is not a regular file: ${path}`);
    }
    freshBytes.set(path, new Uint8Array(readFileSync(absolutePath)));
  }
  const pdfPageCounts = new Map<string, number>();
  for (const source of selected.filter((record) => /\.pdf$/i.test(record.path))) {
    const output = execFileSync("pdfinfo", [join(options.contentRoot, source.path)], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    const match = /^Pages:\s+(\d+)\s*$/m.exec(output);
    if (match === null) throw new Error(`pdfinfo did not report Pages for ${source.path}`);
    pdfPageCounts.set(source.path, Number(match[1]));
  }
  return {
    scope: "registered-local-corpus-v1",
    expectedCounts: PHASE8B_REGISTERED_LOCAL_COUNTS,
    cacheManifestBytes,
    liveRelativePaths,
    freshBytes,
    pdfPageCounts,
    tools: {
      node: process.version,
      pdfinfo: toolFirstLine("pdfinfo", ["-v"], true),
      ripgrep: toolFirstLine("rg", ["--version"]),
    },
    implementationPins: implementationPins(options.repositoryRoot),
  };
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-corpus-local.ts <build|verify> " +
    "--content-root <dir> --cache-manifest <file> --bundle <dir>",
  );
}

function cliArgs(argv: readonly string[]): {
  command: "build" | "verify";
  repositoryRoot: string;
  contentRoot: string;
  cacheManifestPath: string;
  bundlePath: string;
} {
  const command = argv[0];
  if (command !== "build" && command !== "verify") usage();
  const values = new Map<string, string>();
  const allowed = new Set(["--bundle", "--cache-manifest", "--content-root", "--repository-root"]);
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !allowed.has(key) || values.has(key)) usage();
    values.set(key, value);
  }
  const contentRoot = values.get("--content-root");
  const cacheManifestPath = values.get("--cache-manifest");
  const bundlePath = values.get("--bundle");
  const repositoryRoot = values.get("--repository-root") ?? fileURLToPath(new URL("../..", import.meta.url));
  if (contentRoot === undefined || cacheManifestPath === undefined || bundlePath === undefined) usage();
  return { command, repositoryRoot, contentRoot, cacheManifestPath, bundlePath };
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  try {
    const args = cliArgs(process.argv.slice(2));
    const snapshot = capturePhase8bLocalSnapshot(args);
    if (args.command === "build") {
      const bundle = derivePhase8bLocalBundle(snapshot);
      writePhase8bLocalBundleDirectory(args.bundlePath, bundle);
      process.stdout.write(
        `PHASE8B LOCAL DENOMINATOR CANDIDATE BUILT containers=${bundle.counts.sourceContainerCount} ` +
        `units=${bundle.counts.sourceUnitCount} pending=${bundle.counts.pendingClassificationCount}\n`,
      );
    } else {
      const bundle = verifyPhase8bLocalBundleArtifacts(readPhase8bLocalBundleDirectory(args.bundlePath), snapshot);
      process.stdout.write(
        `PHASE8B LOCAL DENOMINATOR OK containers=${bundle.counts.sourceContainerCount} ` +
        `units=${bundle.counts.sourceUnitCount} pending=${bundle.counts.pendingClassificationCount}\n`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`PHASE8B LOCAL DENOMINATOR FAIL ${message}\n`);
    process.exitCode = 1;
  }
}
