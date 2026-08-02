import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { canonicalJsonSha256 } from "./gate4-evidence.ts";

export const PHASE6_HELDOUT_LOCK_RELATIVE_PATH =
  "research/phase6-heldout-candidate-lock.json";

/** Pins every source, condition, extraction rule, uncertainty statement and fail-closed status. */
export const PHASE6_HELDOUT_LOCK_SHA256 =
  "3d25dabd0c60f416f5d5337bfc5b6e63c6e70efe186839af4449d92261e9a0a7";

/** Pins the LF-normalized source text so duplicate JSON keys cannot hide behind JSON.parse. */
export const PHASE6_HELDOUT_LOCK_TEXT_SHA256 =
  "f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5";

interface LockedFile {
  readonly fileName: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface LockedMember {
  readonly name: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface HarrisonTrace {
  readonly id: string;
  readonly member: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly massRatios: readonly number[];
}

export interface Phase6HeldoutCandidateLock {
  readonly schema: "phase6-heldout-candidate-lock-v1";
  readonly lockId: string;
  readonly status: "candidate-only-no-validation-target-frozen";
  readonly gateMeaning: { readonly passEligible: false };
  readonly sources: {
    readonly harrison2016Archive: LockedFile;
    readonly pokrifka2020AcceptedManuscript: LockedFile;
    readonly takahashi1991: LockedFile;
    readonly takahashi1991Corrigendum: LockedFile;
    readonly harringtonPokrifka2026Archive: LockedFile;
  };
  readonly harrisonCandidate: {
    readonly status: "source-locked-not-scoreable";
    readonly timesSeconds: readonly number[];
    readonly extraction: {
      readonly columns: 6;
      readonly timeColumnZeroBased: 2;
      readonly massRatioColumnZeroBased: 4;
      readonly reportedDecimalPlaces: number;
      readonly maximumObservedBracketGapSeconds: number;
      readonly interpolationGapComparisonToleranceSeconds: number;
    };
    readonly archiveProvenanceMembers: readonly LockedMember[];
    readonly excludedMembers: readonly LockedMember[];
    readonly requiredAbsence: readonly unknown[];
    readonly traces: readonly HarrisonTrace[];
  };
}

export interface Phase6SourceLockPaths {
  readonly harrison: string;
  readonly pokrifka: string;
  readonly takahashi: string;
  readonly corrigendum: string;
  readonly history: string;
}

export interface Phase6SourceLockVerification {
  readonly ok: boolean;
  readonly failures: readonly string[];
  readonly checkedFiles: readonly string[];
  readonly checkedHarrisonMembers: number;
  readonly maximumInterpolationGapSeconds: number | null;
}

interface ZipEntry {
  readonly name: string;
  readonly bytes: Uint8Array;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Validate the exact manifest text, allowing only the repository's LF/CRLF checkout conversion. */
export function phase6HeldoutLockTextFailures(text: string): readonly string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const digest = sha256(new TextEncoder().encode(normalized));
  return digest === PHASE6_HELDOUT_LOCK_TEXT_SHA256
    ? []
    : [
        `candidate lock normalized-text SHA-256 ${digest} != ` +
          PHASE6_HELDOUT_LOCK_TEXT_SHA256,
      ];
}

function lockedFileFailures(label: string, value: unknown): string[] {
  if (!isRecord(value)) return [`${label} is not an object`];
  const failures: string[] = [];
  if (typeof value.fileName !== "string" || value.fileName.length === 0) {
    failures.push(`${label}.fileName is invalid`);
  }
  if (!Number.isSafeInteger(value.byteLength) || (value.byteLength as number) <= 0) {
    failures.push(`${label}.byteLength is invalid`);
  }
  if (typeof value.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(value.sha256)) {
    failures.push(`${label}.sha256 is invalid`);
  }
  return failures;
}

function lockedMemberFailures(label: string, value: unknown): string[] {
  if (!isRecord(value)) return [`${label} is not an object`];
  const failures: string[] = [];
  if (typeof value.name !== "string" || value.name.length === 0) {
    failures.push(`${label}.name is invalid`);
  }
  if (!Number.isSafeInteger(value.byteLength) || (value.byteLength as number) <= 0) {
    failures.push(`${label}.byteLength is invalid`);
  }
  if (typeof value.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(value.sha256)) {
    failures.push(`${label}.sha256 is invalid`);
  }
  return failures;
}

function lockedTraceFailures(label: string, value: unknown): string[] {
  if (!isRecord(value)) return [`${label} is not an object`];
  const failures: string[] = [];
  if (typeof value.member !== "string" || value.member.length === 0) {
    failures.push(`${label}.member is invalid`);
  }
  if (!Number.isSafeInteger(value.byteLength) || (value.byteLength as number) <= 0) {
    failures.push(`${label}.byteLength is invalid`);
  }
  if (typeof value.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(value.sha256)) {
    failures.push(`${label}.sha256 is invalid`);
  }
  return failures;
}

/** Validate the lock's fail-closed meaning without requiring copyrighted local source bytes. */
export function phase6HeldoutManifestFailures(value: unknown): readonly string[] {
  if (!isRecord(value)) return ["candidate lock is not an object"];
  const failures: string[] = [];
  try {
    const digest = canonicalJsonSha256(value);
    if (digest !== PHASE6_HELDOUT_LOCK_SHA256) {
      failures.push(
        `candidate lock canonical SHA-256 ${digest} != ${PHASE6_HELDOUT_LOCK_SHA256}`,
      );
    }
  } catch (error) {
    failures.push(`candidate lock is not strict canonical JSON data: ${String(error)}`);
  }
  if (value.schema !== "phase6-heldout-candidate-lock-v1") {
    failures.push(`unexpected schema ${String(value.schema)}`);
  }
  if (value.status !== "candidate-only-no-validation-target-frozen") {
    failures.push(`candidate lock status is not fail-closed: ${String(value.status)}`);
  }
  if (!isRecord(value.gateMeaning) || value.gateMeaning.passEligible !== false) {
    failures.push("candidate lock must carry passEligible=false");
  }
  if (!isRecord(value.sources)) {
    failures.push("sources is missing");
  } else {
    for (const key of [
      "harrison2016Archive",
      "pokrifka2020AcceptedManuscript",
      "takahashi1991",
      "takahashi1991Corrigendum",
      "harringtonPokrifka2026Archive",
    ]) {
      failures.push(...lockedFileFailures(`sources.${key}`, value.sources[key]));
    }
  }
  if (!isRecord(value.harrisonCandidate)) {
    failures.push("harrisonCandidate is missing");
    return failures;
  }
  if (value.harrisonCandidate.status !== "source-locked-not-scoreable") {
    failures.push("Harrison candidate must remain not-scoreable");
  }
  const times = value.harrisonCandidate.timesSeconds;
  if (!Array.isArray(times) || times.length !== 5 || times.some((x) => !Number.isFinite(x))) {
    failures.push("Harrison timesSeconds must contain five finite values");
  } else if (times.some((x, index) => index > 0 && x <= times[index - 1])) {
    failures.push("Harrison timesSeconds must be strictly increasing");
  }
  const traces = value.harrisonCandidate.traces;
  if (!Array.isArray(traces) || traces.length !== 16) {
    failures.push(
      `Harrison trace set must contain exactly 16 rows, got ` +
        `${Array.isArray(traces) ? traces.length : "non-array"}`,
    );
  } else {
    const ids = new Set<string>();
    const members = new Set<string>();
    for (let index = 0; index < traces.length; index++) {
      const trace = traces[index];
      failures.push(...lockedTraceFailures(`harrisonCandidate.traces[${index}]`, trace));
      if (!isRecord(trace)) continue;
      if (typeof trace.id !== "string" || ids.has(trace.id)) {
        failures.push(`trace ${index} has invalid or duplicate id`);
      } else ids.add(trace.id);
      if (typeof trace.member !== "string" || members.has(trace.member)) {
        failures.push(`trace ${index} has invalid or duplicate member`);
      } else members.add(trace.member);
      const ratios = trace.massRatios;
      if (
        !Array.isArray(ratios) ||
        ratios.length !== 5 ||
        ratios.some((x) => !Number.isFinite(x) || x <= 0)
      ) {
        failures.push(`trace ${String(trace.id)} has invalid mass-ratio rows`);
      }
    }
    if (members.has("heticegrowth_625.dat")) {
      failures.push("excluded member heticegrowth_625.dat entered the usable trace set");
    }
  }
  const excluded = value.harrisonCandidate.excludedMembers;
  if (
    !Array.isArray(excluded) ||
    !excluded.some((row) => isRecord(row) && row.name === "heticegrowth_625.dat")
  ) {
    failures.push("excluded Harrison row 625 is not pinned");
  }
  const requiredAbsence = value.harrisonCandidate.requiredAbsence;
  if (!Array.isArray(requiredAbsence) || requiredAbsence.length === 0) {
    failures.push("the missing corrected Harrison condition is not pinned as absent");
  }
  return failures;
}

export function parsePhase6HeldoutCandidateLockText(
  text: string,
): Phase6HeldoutCandidateLock {
  const textFailures = phase6HeldoutLockTextFailures(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`invalid Phase 6 held-out candidate lock JSON: ${String(error)}`);
  }
  const failures = [...textFailures, ...phase6HeldoutManifestFailures(parsed)];
  if (failures.length > 0) {
    throw new Error(`invalid Phase 6 held-out candidate lock:\n- ${failures.join("\n- ")}`);
  }
  return parsed as unknown as Phase6HeldoutCandidateLock;
}

export function loadPhase6HeldoutCandidateLock(
  repoRoot: string = process.cwd(),
): Phase6HeldoutCandidateLock {
  const path = resolve(repoRoot, PHASE6_HELDOUT_LOCK_RELATIVE_PATH);
  return parsePhase6HeldoutCandidateLockText(readFileSync(path, "utf8"));
}

function readUInt32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function readUInt16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/** Minimal deterministic ZIP reader: stored/deflated, non-ZIP64 archives only. */
export function phase6ReadZipEntries(archive: Uint8Array): readonly ZipEntry[] {
  let eocd = -1;
  const minimum = Math.max(0, archive.length - 65_557);
  for (let offset = archive.length - 22; offset >= minimum; offset--) {
    if (readUInt32(archive, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP end-of-central-directory record is missing");
  const entryCount = readUInt16(archive, eocd + 10);
  let cursor = readUInt32(archive, eocd + 16);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const entries: ZipEntry[] = [];
  for (let index = 0; index < entryCount; index++) {
    if (readUInt32(archive, cursor) !== 0x02014b50) {
      throw new Error(`ZIP central entry ${index} has an invalid signature`);
    }
    const method = readUInt16(archive, cursor + 10);
    const compressedSize = readUInt32(archive, cursor + 20);
    const uncompressedSize = readUInt32(archive, cursor + 24);
    const nameLength = readUInt16(archive, cursor + 28);
    const extraLength = readUInt16(archive, cursor + 30);
    const commentLength = readUInt16(archive, cursor + 32);
    const localOffset = readUInt32(archive, cursor + 42);
    const name = decoder.decode(archive.subarray(cursor + 46, cursor + 46 + nameLength));
    if (readUInt32(archive, localOffset) !== 0x04034b50) {
      throw new Error(`ZIP local entry ${name} has an invalid signature`);
    }
    const localNameLength = readUInt16(archive, localOffset + 26);
    const localExtraLength = readUInt16(archive, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
    let bytes: Uint8Array;
    if (method === 0) bytes = compressed.slice();
    else if (method === 8) bytes = new Uint8Array(inflateRawSync(compressed));
    else throw new Error(`ZIP entry ${name} uses unsupported compression method ${method}`);
    if (bytes.length !== uncompressedSize) {
      throw new Error(`ZIP entry ${name} length ${bytes.length} != ${uncompressedSize}`);
    }
    entries.push({ name, bytes });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Index archive files by basename and reject ambiguous paths before locked-member lookup. */
export function phase6ZipEntriesByBaseName(
  entries: readonly ZipEntry[],
): ReadonlyMap<string, Uint8Array> {
  const byBaseName = new Map<string, Uint8Array>();
  for (const entry of entries) {
    const key = entry.name.replaceAll("\\", "/").split("/").at(-1) as string;
    if (key.length === 0) continue;
    if (byBaseName.has(key)) throw new Error(`duplicate ZIP basename ${key}`);
    byBaseName.set(key, entry.bytes);
  }
  return byBaseName;
}

export function phase6CoalesceTraceRows(
  rows: readonly (readonly [number, number])[],
): { readonly rows: readonly (readonly [number, number])[]; readonly duplicateCount: number } {
  const output: [number, number][] = [];
  let duplicateCount = 0;
  for (let start = 0; start < rows.length; ) {
    const time = rows[start][0];
    let end = start + 1;
    while (end < rows.length && rows[end][0] === time) end++;
    const values = rows.slice(start, end).map((row) => row[1]).sort((a, b) => a - b);
    duplicateCount += values.length - 1;
    const middle = Math.floor(values.length / 2);
    const median =
      values.length % 2 === 1 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    output.push([time, median]);
    start = end;
  }
  return { rows: output, duplicateCount };
}

function parseHarrisonTrace(bytes: Uint8Array): readonly (readonly [number, number])[] {
  const rows: [number, number][] = [];
  for (const line of new TextDecoder().decode(bytes).split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/).map(Number);
    if (columns.length !== 6 || columns.some((x) => !Number.isFinite(x))) continue;
    const time = columns[2];
    const ratio = columns[4];
    if (!(ratio > 0)) throw new Error(`nonpositive Harrison mass ratio at t=${time}`);
    if (rows.length > 0 && time < rows[rows.length - 1][0]) {
      throw new Error(`Harrison time decreases at ${time}`);
    }
    rows.push([time, ratio]);
  }
  if (rows.length === 0) throw new Error("Harrison trace has no finite six-column rows");
  return rows;
}

function interpolateTrace(
  rows: readonly (readonly [number, number])[],
  time: number,
): { readonly value: number; readonly gap: number } {
  let high = 0;
  while (high < rows.length && rows[high][0] < time) high++;
  if (high >= rows.length) throw new Error(`target time ${time} exceeds trace end`);
  if (rows[high][0] === time) return { value: rows[high][1], gap: 0 };
  if (high === 0) throw new Error(`target time ${time} precedes trace start`);
  const [t0, y0] = rows[high - 1];
  const [t1, y1] = rows[high];
  return { value: y0 + ((time - t0) / (t1 - t0)) * (y1 - y0), gap: t1 - t0 };
}

function verifyFile(path: string, expected: LockedFile, failures: string[]): Uint8Array {
  const bytes = new Uint8Array(readFileSync(path));
  if (basename(path) !== expected.fileName) {
    failures.push(`${path}: basename must be ${expected.fileName}`);
  }
  if (bytes.length !== expected.byteLength) {
    failures.push(`${path}: byte length ${bytes.length} != ${expected.byteLength}`);
  }
  const digest = sha256(bytes);
  if (digest !== expected.sha256) failures.push(`${path}: SHA-256 ${digest} != ${expected.sha256}`);
  return bytes;
}

export function verifyPhase6HeldoutSourceLock(
  lock: Phase6HeldoutCandidateLock,
  paths: Phase6SourceLockPaths,
): Phase6SourceLockVerification {
  const failures = [...phase6HeldoutManifestFailures(lock)];
  if (failures.length > 0) {
    return {
      ok: false,
      failures,
      checkedFiles: [],
      checkedHarrisonMembers: 0,
      maximumInterpolationGapSeconds: null,
    };
  }
  const checkedFiles = [
    paths.harrison,
    paths.pokrifka,
    paths.takahashi,
    paths.corrigendum,
    paths.history,
  ];
  const archive = verifyFile(paths.harrison, lock.sources.harrison2016Archive, failures);
  verifyFile(paths.pokrifka, lock.sources.pokrifka2020AcceptedManuscript, failures);
  verifyFile(paths.takahashi, lock.sources.takahashi1991, failures);
  verifyFile(paths.corrigendum, lock.sources.takahashi1991Corrigendum, failures);
  verifyFile(paths.history, lock.sources.harringtonPokrifka2026Archive, failures);

  let checkedMembers = 0;
  let maximumGap = 0;
  try {
    const entries = phase6ReadZipEntries(archive);
    const byBaseName = phase6ZipEntriesByBaseName(entries);
    const lockedMembers = [
      ...lock.harrisonCandidate.archiveProvenanceMembers,
      ...lock.harrisonCandidate.excludedMembers,
      ...lock.harrisonCandidate.traces.map((trace) => ({
        name: trace.member,
        byteLength: trace.byteLength,
        sha256: trace.sha256,
      })),
    ];
    for (const member of lockedMembers) {
      const bytes = byBaseName.get(member.name);
      if (bytes === undefined) {
        failures.push(`Harrison ZIP is missing ${member.name}`);
        continue;
      }
      checkedMembers++;
      if (bytes.length !== member.byteLength) {
        failures.push(`${member.name}: byte length ${bytes.length} != ${member.byteLength}`);
      }
      const digest = sha256(bytes);
      if (digest !== member.sha256) failures.push(`${member.name}: SHA-256 mismatch`);
    }
    for (const trace of lock.harrisonCandidate.traces) {
      const bytes = byBaseName.get(trace.member);
      if (bytes === undefined) continue;
      const raw = parseHarrisonTrace(bytes);
      const coalesced = phase6CoalesceTraceRows(raw);
      if (trace.id === "712k" && coalesced.duplicateCount !== 8_850) {
        failures.push(`712k duplicate count ${coalesced.duplicateCount} != 8850`);
      }
      for (let index = 0; index < lock.harrisonCandidate.timesSeconds.length; index++) {
        const point = interpolateTrace(coalesced.rows, lock.harrisonCandidate.timesSeconds[index]);
        if (point.gap > maximumGap) maximumGap = point.gap;
        const actual = point.value.toFixed(lock.harrisonCandidate.extraction.reportedDecimalPlaces);
        const expected = trace.massRatios[index].toFixed(
          lock.harrisonCandidate.extraction.reportedDecimalPlaces,
        );
        if (actual !== expected) {
          failures.push(`${trace.member} t=${lock.harrisonCandidate.timesSeconds[index]}: ${actual} != ${expected}`);
        }
      }
    }
    if (
      maximumGap >
      lock.harrisonCandidate.extraction.maximumObservedBracketGapSeconds +
        lock.harrisonCandidate.extraction.interpolationGapComparisonToleranceSeconds
    ) {
      failures.push(
        `maximum interpolation gap ${maximumGap} exceeds locked ` +
          `${lock.harrisonCandidate.extraction.maximumObservedBracketGapSeconds}`,
      );
    }
  } catch (error) {
    failures.push(`Harrison ZIP verification failed: ${String(error)}`);
  }
  return {
    ok: failures.length === 0,
    failures,
    checkedFiles,
    checkedHarrisonMembers: checkedMembers,
    maximumInterpolationGapSeconds: Number.isFinite(maximumGap) ? maximumGap : null,
  };
}
