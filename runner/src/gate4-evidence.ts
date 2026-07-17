// Shared Phase 4 evidence and publication machinery.
//
// This module is deliberately operator-neutral. Pass A and Pass B supply their own strict
// payload schemas, while this layer owns canonical JSON, raw-byte hashes, artifact identity,
// and fail-closed staging publication. The artifact graph is acyclic:
//
//   payloads <- report (records payload hashes) <- index (records report + payload hashes)
//
// The index does not hash itself and the report never names the index.

import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

export type StrictJsonPrimitive = null | boolean | number | string;
export type StrictJson =
  | StrictJsonPrimitive
  | readonly StrictJson[]
  | { readonly [key: string]: StrictJson };

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ARTIFACT_PATH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** Locale-independent UTF-16 code-unit order used by every canonical string/path sort. */
function lexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function strictNumber(value: number, path: string): number {
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    throw new Error(`${path} must be finite and must not be negative zero`);
  }
  return value;
}

function strictJsonSnapshotAt(
  value: unknown,
  path: string,
  ancestors: WeakSet<object>,
): StrictJson {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return strictNumber(value, path);
  if (typeof value !== "object") {
    throw new Error(`${path} is not strict JSON data`);
  }
  if (ancestors.has(value)) throw new Error(`${path} contains a cycle`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(value);
      const expected = Array.from({ length: value.length }, (_, index) => String(index));
      expected.push("length");
      if (
        keys.length !== expected.length ||
        keys.some((key, index) => typeof key !== "string" || key !== expected[index])
      ) {
        throw new Error(`${path} must be a dense array without extra or symbolic properties`);
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
      if (lengthDescriptor === undefined || !("value" in lengthDescriptor)) {
        throw new Error(`${path}.length must be a data property`);
      }
      const result: StrictJson[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = descriptors[String(index)];
        if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
          throw new Error(`${path}[${index}] must be an enumerable data property`);
        }
        result.push(strictJsonSnapshotAt(descriptor.value, `${path}[${index}]`, ancestors));
      }
      return result;
    }

    const prototype = Object.getPrototypeOf(value) as unknown;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${path} must be a plain object`);
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      throw new Error(`${path} must not contain symbolic properties`);
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const result: Record<string, StrictJson> = Object.create(null) as Record<string, StrictJson>;
    for (const key of keys as string[]) {
      const descriptor = descriptors[key];
      if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
        throw new Error(`${path}.${key} must be an enumerable data property`);
      }
      result[key] = strictJsonSnapshotAt(descriptor.value, `${path}.${key}`, ancestors);
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

/** Own an accessor-free, finite, negative-zero-free strict-JSON snapshot. */
export function strictJsonSnapshot(value: unknown): StrictJson {
  return strictJsonSnapshotAt(value, "$", new WeakSet<object>());
}

function canonicalString(value: StrictJson): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalString).join(",")}]`;
  const objectValue = value as { readonly [key: string]: StrictJson };
  const keys = Object.keys(objectValue).sort(lexicalCompare);
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalString(objectValue[key])}`)
    .join(",")}}`;
}

/** Canonical UTF-8 JSON: recursively sorted keys and no insignificant whitespace. */
export function canonicalJson(value: unknown): string {
  return canonicalString(strictJsonSnapshot(value));
}

export function canonicalJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${canonicalJson(value)}\n`);
}

/**
 * Parse only the canonical form produced above. Byte equality rejects duplicate keys,
 * alternate number spellings, reordered keys, trailing data, and whitespace changes.
 */
export function parseCanonicalJson(bytes: Uint8Array, label = "JSON artifact"): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${canonicalString(snapshot)}\n`) {
    throw new Error(`${label} is not canonical JSON`);
  }
  return snapshot;
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalJsonSha256(value: unknown): string {
  return sha256Bytes(canonicalJsonBytes(value));
}

/** Hash exactly the view bytes, without widening, element conversion, or buffer padding. */
export function rawTypedArraySha256(
  value: Uint8Array | Int32Array | Float32Array | Float64Array,
): string {
  if (!ArrayBuffer.isView(value) || value instanceof DataView) {
    throw new Error("raw field hash requires a typed-array view");
  }
  return sha256Bytes(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
}

export interface EvidenceArtifactDescriptor {
  readonly path: string;
  readonly kind: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface EvidenceArtifactInput {
  readonly path: string;
  readonly kind: string;
  readonly bytes: Uint8Array;
}

export interface EvidenceReportEnvelope {
  readonly version: 1;
  readonly protocol: string;
  readonly pass: string;
  readonly operator: string;
  readonly artifacts: readonly EvidenceArtifactDescriptor[];
  readonly payload: StrictJson;
}

export interface EvidenceArtifactIndex {
  readonly version: 1;
  readonly publication: "complete";
  readonly report: EvidenceArtifactDescriptor;
  /** Report first, followed by every payload in canonical path order. */
  readonly artifacts: readonly EvidenceArtifactDescriptor[];
}

export const PHASE4_ARTIFACT_INDEX = "artifact-index.json";

function assertArtifactPath(path: string, label = "artifact path"): void {
  if (
    !ARTIFACT_PATH_PATTERN.test(path) ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`${label} is not a safe normalized relative path: ${path}`);
  }
}

function assertDescriptor(value: unknown, label: string): EvidenceArtifactDescriptor {
  const snapshot = strictJsonSnapshot(value);
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error(`${label} must be an object`);
  }
  const objectSnapshot = snapshot as { readonly [key: string]: StrictJson };
  const keys = Object.keys(objectSnapshot).sort(lexicalCompare);
  const expected = ["byteLength", "kind", "path", "sha256"];
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys are invalid`);
  }
  const path = objectSnapshot.path;
  const kind = objectSnapshot.kind;
  const byteLength = objectSnapshot.byteLength;
  const sha256 = objectSnapshot.sha256;
  if (typeof path !== "string") throw new Error(`${label}.path must be a string`);
  assertArtifactPath(path, `${label}.path`);
  if (typeof kind !== "string" || kind.trim().length === 0) {
    throw new Error(`${label}.kind must be nonempty`);
  }
  if (!Number.isSafeInteger(byteLength) || (byteLength as number) < 0) {
    throw new Error(`${label}.byteLength must be a nonnegative safe integer`);
  }
  if (typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256)) {
    throw new Error(`${label}.sha256 must be lowercase SHA-256`);
  }
  return { path, kind, byteLength: byteLength as number, sha256 };
}

function descriptorFor(input: EvidenceArtifactInput): EvidenceArtifactDescriptor {
  assertArtifactPath(input.path);
  if (typeof input.kind !== "string" || input.kind.trim().length === 0) {
    throw new Error(`artifact ${input.path} kind must be nonempty`);
  }
  if (!(input.bytes instanceof Uint8Array)) {
    throw new Error(`artifact ${input.path} bytes must be Uint8Array`);
  }
  return {
    path: input.path,
    kind: input.kind,
    byteLength: input.bytes.byteLength,
    sha256: sha256Bytes(input.bytes),
  };
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function writeExclusive(path: string, bytes: Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes, { flag: "wx" });
  const reopened = new Uint8Array(readFileSync(path));
  if (!bytesEqual(bytes, reopened)) throw new Error(`artifact changed during write: ${path}`);
}

function exactKeys(value: Record<string, StrictJson>, expected: readonly string[], label: string): void {
  const keys = Object.keys(value).sort(lexicalCompare);
  const wanted = [...expected].sort(lexicalCompare);
  if (keys.length !== wanted.length || keys.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} keys are invalid`);
  }
}

function assertReportEnvelope(value: unknown): EvidenceReportEnvelope {
  const snapshot = strictJsonSnapshot(value);
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("evidence report must be an object");
  }
  const objectSnapshot = snapshot as { readonly [key: string]: StrictJson };
  exactKeys(objectSnapshot, ["version", "protocol", "pass", "operator", "artifacts", "payload"], "evidence report");
  if (objectSnapshot.version !== 1) throw new Error("evidence report version must be 1");
  for (const name of ["protocol", "pass", "operator"] as const) {
    if (typeof objectSnapshot[name] !== "string" || objectSnapshot[name].trim().length === 0) {
      throw new Error(`evidence report ${name} must be nonempty`);
    }
  }
  if (!Array.isArray(objectSnapshot.artifacts)) throw new Error("evidence report artifacts must be an array");
  const artifacts = objectSnapshot.artifacts.map((item, index) =>
    assertDescriptor(item, `evidence report artifacts[${index}]`),
  );
  const paths = artifacts.map((item) => item.path);
  if (new Set(paths).size !== paths.length) throw new Error("evidence report has duplicate artifact paths");
  if (paths.includes(PHASE4_ARTIFACT_INDEX)) throw new Error("evidence report must not reference its index");
  if (paths.some((path, index) => index > 0 && lexicalCompare(path, paths[index - 1]) <= 0)) {
    throw new Error("evidence report artifacts must be in canonical path order");
  }
  return {
    version: 1,
    protocol: objectSnapshot.protocol as string,
    pass: objectSnapshot.pass as string,
    operator: objectSnapshot.operator as string,
    artifacts,
    payload: objectSnapshot.payload,
  };
}

function assertArtifactIndex(value: unknown): EvidenceArtifactIndex {
  const snapshot = strictJsonSnapshot(value);
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("artifact index must be an object");
  }
  const objectSnapshot = snapshot as { readonly [key: string]: StrictJson };
  exactKeys(objectSnapshot, ["version", "publication", "report", "artifacts"], "artifact index");
  if (objectSnapshot.version !== 1 || objectSnapshot.publication !== "complete") {
    throw new Error("artifact index version/publication is invalid");
  }
  const report = assertDescriptor(objectSnapshot.report, "artifact index report");
  if (!Array.isArray(objectSnapshot.artifacts)) throw new Error("artifact index artifacts must be an array");
  const artifacts = objectSnapshot.artifacts.map((item, index) =>
    assertDescriptor(item, `artifact index artifacts[${index}]`),
  );
  if (artifacts.length === 0 || canonicalJson(artifacts[0]) !== canonicalJson(report)) {
    throw new Error("artifact index must list its report first");
  }
  const paths = artifacts.map((item) => item.path);
  if (new Set(paths).size !== paths.length) throw new Error("artifact index has duplicate paths");
  if (paths.includes(PHASE4_ARTIFACT_INDEX)) throw new Error("artifact index must not hash itself");
  const payloadPaths = paths.slice(1);
  if (payloadPaths.some(
    (path, index) => index > 0 && lexicalCompare(path, payloadPaths[index - 1]) <= 0,
  )) {
    throw new Error("artifact index payload paths must be in canonical order");
  }
  return { version: 1, publication: "complete", report, artifacts };
}

function listFiles(root: string, current = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`evidence directory contains a symlink: ${absolute}`);
    if (entry.isDirectory()) files.push(...listFiles(root, absolute));
    else if (entry.isFile()) files.push(relative(root, absolute).split(sep).join("/"));
    else throw new Error(`evidence directory contains a non-file entry: ${absolute}`);
  }
  return files.sort(lexicalCompare);
}

function verifyDescriptor(root: string, descriptor: EvidenceArtifactDescriptor): void {
  const bytes = new Uint8Array(readFileSync(join(root, descriptor.path)));
  if (bytes.byteLength !== descriptor.byteLength) {
    throw new Error(`artifact byte length mismatch: ${descriptor.path}`);
  }
  if (sha256Bytes(bytes) !== descriptor.sha256) {
    throw new Error(`artifact hash mismatch: ${descriptor.path}`);
  }
}

export interface VerifiedEvidenceBundle {
  readonly report: EvidenceReportEnvelope;
  readonly index: EvidenceArtifactIndex;
}

/** Reopen, hash, parse, and cross-reference every byte in a completed or staged bundle. */
export function verifyEvidenceBundle(directory: string): VerifiedEvidenceBundle {
  const root = resolve(directory);
  const indexPath = join(root, PHASE4_ARTIFACT_INDEX);
  const index = assertArtifactIndex(parseCanonicalJson(new Uint8Array(readFileSync(indexPath)), "artifact index"));
  const expectedFiles = [...index.artifacts.map((item) => item.path), PHASE4_ARTIFACT_INDEX]
    .sort(lexicalCompare);
  const actualFiles = listFiles(root);
  if (
    actualFiles.length !== expectedFiles.length ||
    actualFiles.some((path, indexValue) => path !== expectedFiles[indexValue])
  ) {
    throw new Error("evidence directory file set does not match its artifact index");
  }
  for (const descriptor of index.artifacts) verifyDescriptor(root, descriptor);
  const report = assertReportEnvelope(
    parseCanonicalJson(new Uint8Array(readFileSync(join(root, index.report.path))), "evidence report"),
  );
  const indexedPayloads = index.artifacts.slice(1);
  if (canonicalJson(report.artifacts) !== canonicalJson(indexedPayloads)) {
    throw new Error("report payload descriptors do not match the artifact index");
  }
  return { report, index };
}

export interface EvidencePublicationHooks {
  /** Test-only direct-function seam. The CLI never supplies hooks. */
  readonly afterArtifactWrite?: (path: string, stagingDirectory: string) => void;
  /** Test-only direct-function seam for crash-before-publish coverage. */
  readonly beforeRename?: (stagingDirectory: string) => void;
}

export interface PublishEvidenceOptions {
  readonly canonicalDirectory: string;
  readonly reportPath: string;
  readonly protocol: string;
  readonly pass: string;
  readonly operator: string;
  readonly payload: unknown;
  readonly artifacts: readonly EvidenceArtifactInput[];
  readonly attemptId?: string;
  readonly hooks?: EvidencePublicationHooks;
}

export interface PublishedEvidenceBundle extends VerifiedEvidenceBundle {
  readonly directory: string;
}

/**
 * Publish by one final rename only after every staged artifact has been reopened, hashed,
 * parsed where applicable, indexed, and cross-checked. Existing canonical evidence is never
 * overwritten or mixed with an attempt.
 */
export function publishEvidenceBundle(options: PublishEvidenceOptions): PublishedEvidenceBundle {
  const canonicalDirectory = resolve(options.canonicalDirectory);
  if (basename(canonicalDirectory).startsWith(".")) {
    throw new Error("canonical evidence directory must not be an attempt directory");
  }
  assertArtifactPath(options.reportPath, "report path");
  if (options.reportPath === PHASE4_ARTIFACT_INDEX) {
    throw new Error("report path must differ from the artifact index");
  }
  if (existsSync(canonicalDirectory)) {
    throw new Error(`canonical evidence already exists: ${canonicalDirectory}`);
  }
  const attemptId = options.attemptId ?? `${process.pid}-${randomUUID()}`;
  if (!/^[A-Za-z0-9-]+$/.test(attemptId)) throw new Error("attempt id is invalid");
  const parent = dirname(canonicalDirectory);
  mkdirSync(parent, { recursive: true });
  const stagingDirectory = join(parent, `.${basename(canonicalDirectory)}.attempt-${attemptId}`);
  if (existsSync(stagingDirectory)) throw new Error(`staging evidence already exists: ${stagingDirectory}`);

  const byPath = new Map<string, { readonly input: EvidenceArtifactInput; readonly descriptor: EvidenceArtifactDescriptor }>();
  for (const input of options.artifacts) {
    const descriptor = descriptorFor(input);
    if (
      descriptor.path === options.reportPath ||
      descriptor.path === PHASE4_ARTIFACT_INDEX
    ) {
      throw new Error(`reserved artifact path: ${descriptor.path}`);
    }
    if (byPath.has(descriptor.path)) throw new Error(`duplicate artifact path: ${descriptor.path}`);
    byPath.set(descriptor.path, { input, descriptor });
  }
  const payloads = [...byPath.values()].sort((left, right) =>
    lexicalCompare(left.descriptor.path, right.descriptor.path),
  );
  const payloadSnapshot = strictJsonSnapshot(options.payload);
  const report: EvidenceReportEnvelope = {
    version: 1,
    protocol: options.protocol,
    pass: options.pass,
    operator: options.operator,
    artifacts: payloads.map((item) => item.descriptor),
    payload: payloadSnapshot,
  };
  assertReportEnvelope(report);

  mkdirSync(stagingDirectory, { recursive: false });
  let renamedByThisInvocation = false;
  try {
    for (const item of payloads) {
      writeExclusive(join(stagingDirectory, item.descriptor.path), item.input.bytes);
      verifyDescriptor(stagingDirectory, item.descriptor);
      options.hooks?.afterArtifactWrite?.(item.descriptor.path, stagingDirectory);
    }

    const reportBytes = canonicalJsonBytes(report);
    const reportDescriptor: EvidenceArtifactDescriptor = {
      path: options.reportPath,
      kind: "phase4-evidence-report+json",
      byteLength: reportBytes.byteLength,
      sha256: sha256Bytes(reportBytes),
    };
    writeExclusive(join(stagingDirectory, options.reportPath), reportBytes);
    assertReportEnvelope(
      parseCanonicalJson(
        new Uint8Array(readFileSync(join(stagingDirectory, options.reportPath))),
        "staged evidence report",
      ),
    );

    const index: EvidenceArtifactIndex = {
      version: 1,
      publication: "complete",
      report: reportDescriptor,
      artifacts: [reportDescriptor, ...payloads.map((item) => item.descriptor)],
    };
    assertArtifactIndex(index);
    writeExclusive(
      join(stagingDirectory, PHASE4_ARTIFACT_INDEX),
      canonicalJsonBytes(index),
    );
    verifyEvidenceBundle(stagingDirectory);
    options.hooks?.beforeRename?.(stagingDirectory);
    // A test hook models any last-moment writer or crash window. Reopen the complete staged
    // graph again after it, immediately before the only publishing rename.
    verifyEvidenceBundle(stagingDirectory);
    if (existsSync(canonicalDirectory)) {
      throw new Error(`canonical evidence appeared before publication: ${canonicalDirectory}`);
    }
    renameSync(stagingDirectory, canonicalDirectory);
    renamedByThisInvocation = true;
    const verified = verifyEvidenceBundle(canonicalDirectory);
    return { directory: canonicalDirectory, ...verified };
  } catch (error) {
    const ownedFailureDirectory = renamedByThisInvocation
      ? canonicalDirectory
      : stagingDirectory;
    if (existsSync(ownedFailureDirectory)) {
      rmSync(ownedFailureDirectory, { recursive: true, force: true });
    }
    throw error;
  }
}

/** Validate a source file as a regular finite-size artifact before hashing it. */
export function readRegularArtifact(path: string): Uint8Array {
  const stats = statSync(path);
  if (!stats.isFile() || !Number.isSafeInteger(stats.size) || stats.size < 0) {
    throw new Error(`artifact is not a regular finite-size file: ${path}`);
  }
  return new Uint8Array(readFileSync(path));
}
