// Publish the completed Run B compact-growth comparison bundle to the mirrored NAS path.
//
// This is deliberately a fixed-roster, flagless publisher. The baker, comparison builder, and
// browser capture all write locally first; this command then copies exactly their completed bytes
// through one private same-share staging directory, reopens and hashes both sides, and publishes by
// one final directory rename. It never writes a ledger entry: docs/nas-ledger.json is updated only
// from the final canonical inventory printed by this command.
//
//   node scripts/gutcheck-publish-growth-comparison.ts

// Node has no portable RENAME_NOREPLACE equivalent for directories. As in the repository's gate
// publishers, this implementation refuses every lexical canonical path initially and immediately
// before rename, under the documented excluded-concurrent-local-mutator boundary. An uncooperative
// process creating an empty canonical directory in the tiny interval after that final lstat could
// still be replaced by POSIX rename; callers must not run such a mutator concurrently.

import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  copyFileSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  readdirSync,
  renameSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodeGrowthComparisonRecord,
  type GrowthComparisonRecord,
} from "../app/src/gutcheck-growth-comparison-record.ts";
import {
  decodeGrowthAsset,
  growthCropSize,
  type DecodedGrowthAsset,
} from "../app/src/gutcheck-growth-format.ts";
import {
  assertExactRunBGrowth,
  deriveGrowthOccupancySha256,
  parseCompactBakeElapsedSeconds,
} from "./gutcheck-build-growth-comparison.ts";
import { detectNasMount, pathIsWithinRoot } from "./nas-root.ts";

export const GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY =
  "out/gutcheck-growth-runB" as const;

export const GUTCHECK_GROWTH_RUN_B_BUNDLE_FILES = Object.freeze([
  "comparison-browser-v1/compact-final.png",
  "comparison-browser-v1/compact-middle.png",
  "comparison-browser-v1/compact-orbit.png",
  "comparison-browser-v1/compact-reverse.png",
  "comparison-browser-v1/compact-start.png",
  "comparison-browser-v1/full-page.png",
  "comparison-browser-v1/landscape.png",
  "comparison-browser-v1/portrait.png",
  "comparison-browser-v1/record.json",
  "comparison-inputs/poster-final.png",
  "comparison-inputs/poster-middle.png",
  "comparison-inputs/poster-start.png",
  "comparison-record.json",
  "error.log",
  "exit-status",
  "gutcheck-growth-v1.bin",
  "live.log",
] as const);

const BUNDLE_DIRECTORIES = Object.freeze([
  "comparison-browser-v1",
  "comparison-inputs",
] as const);
const COMPACT_ASSET_PATH = "gutcheck-growth-v1.bin";
const COMPARISON_RECORD_PATH = "comparison-record.json";
const CAPTURE_RECORD_PATH = "comparison-browser-v1/record.json";
const COMPACT_ASSET_URL =
  "/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin";
const DERIVED_VIDEO_URL =
  "/nas/out/gutcheck-gg-realism/p7/growth-B-intro.mp4";
const DERIVED_VIDEO_SHARE_PATH =
  "out/gutcheck-gg-realism/p7/growth-B-intro.mp4";
const DERIVED_VIDEO_BYTES = 5_592_795;
const DERIVED_VIDEO_SHA256 =
  "a5ead695add684791f2cd2c02dc650a64d14e37a78df22606b4675f72f6a4c1f";
const RUN_B_OCCUPANCY_SHA256 =
  "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";
const POSTER_PATHS = Object.freeze([
  "comparison-inputs/poster-start.png",
  "comparison-inputs/poster-middle.png",
  "comparison-inputs/poster-final.png",
] as const);
const POSTER_URLS = Object.freeze([
  "/nas/out/gutcheck-growth-runB/comparison-inputs/poster-start.png",
  "/nas/out/gutcheck-growth-runB/comparison-inputs/poster-middle.png",
  "/nas/out/gutcheck-growth-runB/comparison-inputs/poster-final.png",
] as const);
const CAPTURE_SCREENSHOTS = Object.freeze({
  landscape: "comparison-browser-v1/landscape.png",
  fullPage: "comparison-browser-v1/full-page.png",
  start: "comparison-browser-v1/compact-start.png",
  middle: "comparison-browser-v1/compact-middle.png",
  final: "comparison-browser-v1/compact-final.png",
  reverse: "comparison-browser-v1/compact-reverse.png",
  orbit: "comparison-browser-v1/compact-orbit.png",
  portrait: "comparison-browser-v1/portrait.png",
} as const);
const READ_BUFFER_BYTES = 1024 * 1024;
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_DIRECTORY = resolve(
  SCRIPT_DIRECTORY,
  "..",
  GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY,
);

export interface GrowthComparisonPublishedFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface GrowthComparisonNasPublicationReport {
  readonly format: "gutcheck-growth-comparison-nas-publication-v1";
  readonly status: "pass";
  readonly generatedAt: string;
  readonly sourceDirectory: string;
  readonly canonicalDirectory: string;
  readonly shareRelativeDirectory: typeof GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY;
  readonly publication: {
    readonly method: "same-share-staging-directory-atomic-rename";
    readonly sourceReverifiedAfterCopy: true;
    readonly stagingReverifiedImmediatelyBeforeRename: true;
    readonly finalCanonicalRehashed: true;
    readonly concurrencyBoundary: "no-concurrent-local-mutator-between-final-lstat-and-rename";
  };
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly files: readonly GrowthComparisonPublishedFile[];
  readonly referencedVideo: GrowthComparisonPublishedFile;
}

interface DirectoryIdentity {
  readonly realPath: string;
  readonly dev: bigint;
  readonly ino: bigint;
}

interface CapturedFile extends GrowthComparisonPublishedFile {
  readonly absolutePath: string;
  readonly dev: bigint;
  readonly ino: bigint;
  readonly nlink: bigint;
}

interface CapturedTree {
  readonly root: DirectoryIdentity;
  readonly files: readonly CapturedFile[];
}

interface PublicationPaths {
  readonly sourceDirectory: string;
  readonly sourceIdentity: DirectoryIdentity;
  readonly nasRoot: DirectoryIdentity;
  readonly outParent: string;
  readonly outParentIdentity: DirectoryIdentity;
  readonly canonicalDirectory: string;
}

interface TestHookContext {
  readonly sourceDirectory: string;
  readonly stagingDirectory: string;
  readonly canonicalDirectory: string;
  readonly outParent: string;
}

interface GrowthComparisonPublisherTestHooks {
  readonly afterFirstStagingVerification?: (context: TestHookContext) => void;
  readonly beforeFinalPreflight?: (context: TestHookContext) => void;
  readonly afterRename?: (context: TestHookContext) => void;
}

interface CorePublicationOptions {
  readonly sourceDirectory: string;
  readonly nasMount: string;
  readonly attemptId: string;
  readonly hooks?: GrowthComparisonPublisherTestHooks;
  /** Test fixtures cannot contain the privately retained pinned MP4 bytes. */
  readonly testExpectedVideoIdentity?: GrowthComparisonPublishedFile;
  /** Test fixtures cannot reproduce the privately retained measured Run B event payload. */
  readonly testExpectedOccupancySha256?: string;
}

function fail(message: string): never {
  throw new Error(`gutcheck growth comparison NAS publisher: ${message}`);
}

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException).code;
}

function lexicalPathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}

function pathKind(path: string): string {
  const stats = lstatSync(path);
  if (stats.isSymbolicLink()) return "symbolic link";
  if (stats.isDirectory()) return "directory";
  if (stats.isFile()) return "file";
  return "special filesystem entry";
}

function assertPathAbsent(path: string, label: string): void {
  if (lexicalPathExists(path)) {
    fail(`${label} already exists as a ${pathKind(path)}: ${path}`);
  }
}

function bindDirectory(path: string, label: string): DirectoryIdentity {
  const absolute = resolve(path);
  const lexical = lstatSync(absolute, { bigint: true });
  if (lexical.isSymbolicLink() || !lexical.isDirectory()) {
    fail(`${label} must be a real directory, not a symbolic link or special entry: ${absolute}`);
  }
  const realPath = realpathSync.native(absolute);
  const opened = statSync(realPath, { bigint: true });
  if (
    !opened.isDirectory() ||
    lexical.dev !== opened.dev ||
    lexical.ino !== opened.ino
  ) {
    fail(`${label} changed while its identity was bound: ${absolute}`);
  }
  return { realPath, dev: opened.dev, ino: opened.ino };
}

function assertDirectoryIdentity(
  path: string,
  expected: DirectoryIdentity,
  label: string,
  allowMovedRealPath = false,
): DirectoryIdentity {
  const actual = bindDirectory(path, label);
  if (
    actual.dev !== expected.dev ||
    actual.ino !== expected.ino ||
    (!allowMovedRealPath && actual.realPath !== expected.realPath)
  ) {
    fail(`${label} was replaced after it was bound: ${resolve(path)}`);
  }
  return actual;
}

function slashPath(path: string): string {
  return path.split(sep).join("/");
}

function pathFromRelative(root: string, path: string): string {
  if (
    path === "" ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((component) => component === "" || component === "." || component === "..")
  ) {
    fail(`internal bundle path is unsafe: ${path}`);
  }
  const target = resolve(root, ...path.split("/"));
  const displacement = relative(resolve(root), target);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`)) {
    fail(`internal bundle path escapes its root: ${path}`);
  }
  return target;
}

function checkedFileSize(value: bigint, label: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    fail(`${label} has a byte size outside the safe-integer range`);
  }
  return Number(value);
}

function captureFile(
  root: DirectoryIdentity,
  relativePath: string,
  label: string,
  requireSingleLink = false,
): CapturedFile {
  const absolutePath = pathFromRelative(root.realPath, relativePath);
  const lexical = lstatSync(absolutePath, { bigint: true });
  if (lexical.isSymbolicLink() || !lexical.isFile()) {
    fail(`${label} must be a regular non-symbolic-link file: ${relativePath}`);
  }
  const realPath = realpathSync.native(absolutePath);
  if (!pathIsWithinRoot(root.realPath, realPath)) {
    fail(`${label} resolves outside its bound root: ${relativePath}`);
  }
  const descriptor = openSync(
    absolutePath,
    constants.O_RDONLY |
      (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const before = fstatSync(descriptor, { bigint: true });
    if (
      !before.isFile() ||
      before.dev !== lexical.dev ||
      before.ino !== lexical.ino
    ) {
      fail(`${label} changed before it could be opened: ${relativePath}`);
    }
    if (requireSingleLink && before.nlink !== 1n) {
      fail(`${label} file must have exactly one hard link: ${relativePath}`);
    }
    const expectedBytes = checkedFileSize(before.size, `${label} ${relativePath}`);
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(READ_BUFFER_BYTES);
    let bytes = 0;
    while (true) {
      const count = readSync(descriptor, buffer, 0, buffer.byteLength, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      bytes += count;
      if (!Number.isSafeInteger(bytes) || bytes > expectedBytes) {
        fail(`${label} changed size while it was hashed: ${relativePath}`);
      }
    }
    const after = fstatSync(descriptor, { bigint: true });
    if (
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.size !== before.size ||
      after.nlink !== before.nlink ||
      after.mtimeNs !== before.mtimeNs ||
      after.ctimeNs !== before.ctimeNs ||
      bytes !== expectedBytes
    ) {
      fail(`${label} changed while it was hashed: ${relativePath}`);
    }
    if (requireSingleLink && after.nlink !== 1n) {
      fail(`${label} file must have exactly one hard link: ${relativePath}`);
    }
    return {
      path: relativePath,
      absolutePath,
      bytes,
      sha256: digest.digest("hex"),
      dev: before.dev,
      ino: before.ino,
      nlink: before.nlink,
    };
  } finally {
    closeSync(descriptor);
  }
}

function walkTree(root: DirectoryIdentity, label: string): {
  readonly directories: readonly string[];
  readonly files: readonly string[];
} {
  const directories: string[] = [];
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const absolute = join(directory, name);
      const relativePath = slashPath(relative(root.realPath, absolute));
      const stats = lstatSync(absolute);
      if (stats.isSymbolicLink()) {
        fail(`${label} contains a symbolic link: ${relativePath}`);
      }
      if (stats.isDirectory()) {
        const real = realpathSync.native(absolute);
        if (!pathIsWithinRoot(root.realPath, real)) {
          fail(`${label} directory resolves outside its root: ${relativePath}`);
        }
        directories.push(relativePath);
        visit(absolute);
      } else if (stats.isFile()) {
        files.push(relativePath);
      } else {
        fail(`${label} contains a special filesystem entry: ${relativePath}`);
      }
    }
  };
  visit(root.realPath);
  return { directories: directories.sort(), files: files.sort() };
}

function exactStringSet(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (
    left.length !== right.length ||
    left.some((value, index) => value !== right[index])
  ) {
    fail(`${label} roster differs; expected ${right.join(", ")}, got ${left.join(", ")}`);
  }
}

function captureExactTree(
  path: string,
  label: string,
  requireSingleLink = false,
): CapturedTree {
  const root = bindDirectory(path, `${label} root`);
  const roster = walkTree(root, label);
  exactStringSet(roster.directories, BUNDLE_DIRECTORIES, `${label} directory`);
  exactStringSet(roster.files, GUTCHECK_GROWTH_RUN_B_BUNDLE_FILES, `${label} file`);
  const files = GUTCHECK_GROWTH_RUN_B_BUNDLE_FILES.map((relativePath) =>
    captureFile(root, relativePath, label, requireSingleLink),
  );
  assertDirectoryIdentity(root.realPath, root, `${label} root`);
  return { root, files };
}

function byPath(files: readonly CapturedFile[]): ReadonlyMap<string, CapturedFile> {
  return new Map(files.map((file) => [file.path, file]));
}

function assertInventoriesMatch(
  expected: readonly CapturedFile[],
  actual: readonly CapturedFile[],
  label: string,
  requireSameFileIdentity: boolean,
): void {
  exactStringSet(
    actual.map((file) => file.path),
    expected.map((file) => file.path),
    `${label} file`,
  );
  const actualByPath = byPath(actual);
  for (const wanted of expected) {
    const found = actualByPath.get(wanted.path);
    if (
      found === undefined ||
      found.bytes !== wanted.bytes ||
      found.sha256 !== wanted.sha256 ||
      (requireSameFileIdentity &&
        (found.dev !== wanted.dev || found.ino !== wanted.ino))
    ) {
      fail(`${label} differs at ${wanted.path}`);
    }
  }
}

function parseJsonFile(path: string, label: string): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

function plainObject(value: unknown, label: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) {
    fail(`${label} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function safeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    fail(`${label} must be a nonnegative safe integer`);
  }
  return value as number;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${label} must be finite`);
  }
  return value;
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") fail(`${label} must be boolean`);
  return value;
}

function exactObjectKeys(
  object: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  exactStringSet(Object.keys(object), expected, `${label} key`);
}

function assertReportedFileIdentity(
  value: unknown,
  expected: Pick<GrowthComparisonPublishedFile, "bytes" | "sha256">,
  label: string,
): void {
  const object = plainObject(value, label);
  exactObjectKeys(object, ["path", "bytes", "sha256"], label);
  stringValue(object["path"], `${label}.path`);
  if (
    safeInteger(object["bytes"], `${label}.bytes`) !== expected.bytes ||
    stringValue(object["sha256"], `${label}.sha256`) !== expected.sha256
  ) {
    fail(`${label} byte length or SHA-256 differs from the source bundle`);
  }
}

function assertCropObject(
  value: unknown,
  expected: DecodedGrowthAsset["header"]["crop"],
  label: string,
): void {
  const object = plainObject(value, label);
  const keys = ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax", "padding"] as const;
  exactObjectKeys(object, keys, label);
  for (const key of keys) {
    if (safeInteger(object[key], `${label}.${key}`) !== expected[key]) {
      fail(`${label}.${key} differs from the independently decoded compact asset`);
    }
  }
}

function decodeAndVerifyCompactAsset(
  asset: CapturedFile,
  record: GrowthComparisonRecord,
  expectedOccupancySha256: string,
): DecodedGrowthAsset {
  const decoded = decodeGrowthAsset(readFileSync(asset.absolutePath));
  assertExactRunBGrowth(decoded);
  const eventDerivedOccupancySha256 = deriveGrowthOccupancySha256(decoded);
  if (eventDerivedOccupancySha256 !== expectedOccupancySha256) {
    fail("compact asset event-derived occupancy SHA-256 differs from the expected Run B endpoint");
  }
  const { header } = decoded;
  const mismatches: string[] = [];
  if (header.eventCount !== record.compact.eventCount) mismatches.push("event count");
  if (header.attachedCount !== record.compact.eventCount) mismatches.push("attached count");
  if (header.finalTick !== record.compact.finalTick) mismatches.push("final tick");
  if (header.config.preset !== record.run.preset) mismatches.push("preset");
  if (header.config.domain !== record.run.domain) mismatches.push("domain");
  if (header.config.rngSeed !== record.run.rngSeed) mismatches.push("RNG seed");
  if (header.config.noiseEpsilon !== record.run.noiseEpsilon) mismatches.push("noise");
  if (
    header.config.dims.nx !== record.run.dims.nx ||
    header.config.dims.ny !== record.run.dims.ny ||
    header.config.dims.nz !== record.run.dims.nz
  ) {
    mismatches.push("dimensions");
  }
  for (const key of ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax", "padding"] as const) {
    if (header.crop[key] !== record.compact.crop[key]) mismatches.push(`crop ${key}`);
  }
  const size = growthCropSize(header.crop);
  const samples = size[0] * size[1] * size[2];
  if (samples !== record.compact.crop.sampleCount) mismatches.push("crop samples");
  if (samples * 4 !== record.compact.crop.r32uiBytes) mismatches.push("R32UI bytes");
  const endpoint = plainObject(header.source["endpoint"], "compact source endpoint");
  if (endpoint["measuredOccupancySha256"] !== record.compact.sourceIdentity.occupancySha256) {
    mismatches.push("occupancy SHA-256");
  }
  const legacy = plainObject(header.source["legacyComparison"], "compact source legacy comparison");
  if (legacy["sha256"] !== record.compact.sourceIdentity.manifestSha256) {
    mismatches.push("legacy manifest SHA-256");
  }
  if (decoded.attachTicks[0] !== record.compact.firstTick) mismatches.push("first event tick");
  if ((decoded.attachTicks.at(-1) ?? Number.MAX_SAFE_INTEGER) > record.compact.finalTick) {
    mismatches.push("final event tick");
  }
  if (mismatches.length > 0) {
    fail(`compact asset differs from the comparison record: ${mismatches.join(", ")}`);
  }
  return decoded;
}

function assertLayoutMeasurement(value: unknown, label: string): void {
  const object = plainObject(value, label);
  exactObjectKeys(object, ["innerWidth", "scrollWidth"], label);
  const innerWidth = safeInteger(object["innerWidth"], `${label}.innerWidth`);
  const scrollWidth = safeInteger(object["scrollWidth"], `${label}.scrollWidth`);
  if (innerWidth < 1 || scrollWidth > innerWidth + 1) {
    fail(`${label} records horizontal overflow or an invalid viewport`);
  }
}

interface BrowserRequestWitness {
  readonly url: string;
  readonly method: string;
  readonly resourceType: string;
  readonly pathname: string;
}

function parseBrowserRequests(value: unknown, label: string): readonly BrowserRequestWitness[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value.map((entry, index) => {
    const object = plainObject(entry, `${label} ${index}`);
    exactObjectKeys(object, ["url", "method", "resourceType"], `${label} ${index}`);
    const url = stringValue(object["url"], `${label} ${index}.url`);
    const method = stringValue(object["method"], `${label} ${index}.method`);
    const resourceType = stringValue(
      object["resourceType"],
      `${label} ${index}.resourceType`,
    );
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      fail(`${label} ${index}.url is not an absolute URL`);
    }
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      method !== "GET" ||
      resourceType === ""
    ) {
      fail(`${label} ${index} is not a recognized browser GET request`);
    }
    return { url, method, resourceType, pathname: parsed.pathname };
  });
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeBrowserRenderedWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

interface ExpectedBrowserOverride {
  readonly pathname: string;
  readonly status: number;
  readonly contentType: string;
  readonly body: Uint8Array;
}

function assertBrowserErrorLane(
  value: unknown,
  expectedLabel: string,
  expectedError: RegExp,
  label: string,
  requireIframeNotLoaded = false,
  expectedOverride?: ExpectedBrowserOverride,
  requireContextNullWitness = false,
): void {
  const object = plainObject(value, label);
  exactObjectKeys(
    object,
    [
      "label",
      "error",
      "ready",
      "bodyText",
      "iframeReady",
      "iframeSrc",
      "requests",
      "overrideApplications",
      "contextNullWitness",
    ],
    label,
  );
  if (stringValue(object["label"], `${label}.label`) !== expectedLabel) {
    fail(`${label} names the wrong exercised lane`);
  }
  const error = stringValue(object["error"], `${label}.error`);
  if (error === "" || !expectedError.test(error)) {
    fail(`${label} does not carry its lane-specific visible error`);
  }
  const bodyText = stringValue(object["bodyText"], `${label}.bodyText`);
  const displayedBody = normalizeBrowserRenderedWhitespace(bodyText);
  const displayedError = normalizeBrowserRenderedWhitespace(error);
  if (
    booleanValue(object["ready"], `${label}.ready`) !== false ||
    displayedError === "" ||
    !displayedBody.includes(displayedError) ||
    object["iframeReady"] === true ||
    !(
      object["iframeReady"] === false ||
      object["iframeReady"] === null
    ) ||
    !(typeof object["iframeSrc"] === "string" || object["iframeSrc"] === null)
  ) {
    fail(`${label} does not prove a visible scoped failure before readiness`);
  }
  if (
    requireIframeNotLoaded &&
    (object["iframeReady"] !== false || object["iframeSrc"] !== null)
  ) {
    fail(`${label} reached the embedded replay before rejecting the compact bytes`);
  }
  const requests = parseBrowserRequests(object["requests"], `${label} requests`);
  const applications = object["overrideApplications"];
  if (!Array.isArray(applications)) fail(`${label} overrideApplications must be an array`);
  if (expectedOverride !== undefined) {
    if (
      applications.length !== 1 ||
      requests.filter((request) => request.pathname === expectedOverride.pathname).length !== 1
    ) {
      fail(`${label} did not apply its named route mutation exactly once`);
    }
    const application = plainObject(applications[0], `${label} override application`);
    exactObjectKeys(
      application,
      ["pathname", "status", "contentType", "bytes", "sha256"],
      `${label} override application`,
    );
    if (
      application["pathname"] !== expectedOverride.pathname ||
      safeInteger(application["status"], `${label} override status`) !== expectedOverride.status ||
      application["contentType"] !== expectedOverride.contentType ||
      safeInteger(application["bytes"], `${label} override bytes`) !== expectedOverride.body.byteLength ||
      application["sha256"] !== sha256Bytes(expectedOverride.body)
    ) {
      fail(`${label} applied bytes differ from its independently reconstructed named mutation`);
    }
    if (object["contextNullWitness"] !== null) {
      fail(`${label} must not claim the WebGL2 context-null mutation`);
    }
  } else if (applications.length !== 0) {
    fail(`${label} unexpectedly applied a route mutation`);
  }
  if (requireContextNullWitness) {
    const witness = plainObject(object["contextNullWitness"], `${label} context-null witness`);
    exactObjectKeys(
      witness,
      ["installed", "webgl2Calls", "returnedNull", "frameUrl"],
      `${label} context-null witness`,
    );
    const frameUrl = stringValue(witness["frameUrl"], `${label} context-null frameUrl`);
    let framePath: string;
    try {
      framePath = new URL(frameUrl).pathname;
    } catch {
      fail(`${label} context-null frameUrl is not an absolute URL`);
    }
    if (
      booleanValue(witness["installed"], `${label} context-null installed`) !== true ||
      safeInteger(witness["webgl2Calls"], `${label} context-null webgl2Calls`) < 1 ||
      booleanValue(witness["returnedNull"], `${label} context-null returnedNull`) !== true ||
      framePath !== "/spike-gg-realism.html" ||
      object["iframeSrc"] !== frameUrl ||
      !requests.some((request) => request.url === frameUrl)
    ) {
      fail(`${label} does not prove an exercised WebGL2 context-null mutation in the player frame`);
    }
  } else if (expectedOverride === undefined && object["contextNullWitness"] !== null) {
    fail(`${label} carries an unexpected context-null witness`);
  }
}

function assertStrictBrowserCapture(
  rawCapture: unknown,
  record: GrowthComparisonRecord,
  decoded: DecodedGrowthAsset,
  files: ReadonlyMap<string, CapturedFile>,
  nasVideo: CapturedFile,
): void {
  const required = (path: string): CapturedFile => {
    const file = files.get(path);
    if (file === undefined) fail(`source bundle is missing ${path}`);
    return file;
  };
  const capture = plainObject(rawCapture, "browser capture record");
  exactObjectKeys(
    capture,
    [
      "format",
      "status",
      "command",
      "browser",
      "renderer",
      "inputs",
      "independentlyDecoded",
      "valid",
      "reducedMotion",
      "errors",
      "limits",
    ],
    "browser capture record",
  );
  if (
    capture["format"] !== "gutcheck-growth-comparison-browser-v1" ||
    capture["status"] !== "pass"
  ) {
    fail("browser capture record must be a successful gutcheck-growth-comparison-browser-v1 record");
  }
  const command = capture["command"];
  if (!Array.isArray(command) || command.length < 2 || command.some((item) => typeof item !== "string" || item === "")) {
    fail("browser capture command must be a nonempty string vector");
  }
  if (
    stringValue(capture["browser"], "browser capture browser") === "" ||
    stringValue(capture["renderer"], "browser capture renderer") === "" ||
    stringValue(capture["limits"], "browser capture limits") === ""
  ) {
    fail("browser capture browser, renderer, and limits must be nonempty");
  }

  const inputs = plainObject(capture["inputs"], "browser capture record inputs");
  exactObjectKeys(inputs, ["record", "growth", "legacyVideo", "posters"], "browser capture inputs");
  assertReportedFileIdentity(inputs["record"], required(COMPARISON_RECORD_PATH), "capture input record");
  assertReportedFileIdentity(inputs["growth"], required(COMPACT_ASSET_PATH), "capture input growth");
  assertReportedFileIdentity(inputs["legacyVideo"], nasVideo, "capture input legacy video");
  const capturePosters = inputs["posters"];
  if (!Array.isArray(capturePosters) || capturePosters.length !== 3) {
    fail("browser capture record must identify exactly three poster inputs");
  }
  for (let index = 0; index < capturePosters.length; index++) {
    assertReportedFileIdentity(
      capturePosters[index],
      required(POSTER_PATHS[index]),
      `capture input poster ${index}`,
    );
  }

  const independentlyDecoded = plainObject(
    capture["independentlyDecoded"],
    "browser capture independently decoded identity",
  );
  exactObjectKeys(
    independentlyDecoded,
    ["eventCount", "finalTick", "crop", "finalEventTick"],
    "browser capture independently decoded identity",
  );
  if (
    safeInteger(independentlyDecoded["eventCount"], "capture decoded eventCount") !== decoded.header.eventCount ||
    safeInteger(independentlyDecoded["finalTick"], "capture decoded finalTick") !== decoded.header.finalTick ||
    safeInteger(independentlyDecoded["finalEventTick"], "capture decoded finalEventTick") !== decoded.attachTicks.at(-1)
  ) {
    fail("browser capture independently decoded identity differs from publisher decode");
  }
  assertCropObject(
    independentlyDecoded["crop"],
    decoded.header.crop,
    "browser capture independently decoded crop",
  );

  const valid = plainObject(capture["valid"], "browser capture valid lane");
  exactObjectKeys(
    valid,
    [
      "viewport",
      "initialTick",
      "readiness",
      "content",
      "screenshots",
      "layout",
      "requests",
      "controls",
      "playback",
      "keyboard",
      "portraitFraming",
      "errors",
    ],
    "browser capture valid lane",
  );
  const viewport = plainObject(valid["viewport"], "browser capture viewport");
  exactObjectKeys(viewport, ["width", "height"], "browser capture viewport");
  if (
    safeInteger(viewport["width"], "browser capture viewport.width") < 640 ||
    safeInteger(viewport["height"], "browser capture viewport.height") < 480
  ) {
    fail("browser capture viewport is below the harness minimum");
  }
  const initialTick = safeInteger(valid["initialTick"], "browser capture initialTick");
  if (initialTick > record.compact.finalTick) fail("browser capture initialTick exceeds finalTick");

  const readiness = plainObject(valid["readiness"], "browser capture readiness");
  exactObjectKeys(
    readiness,
    [
      "comparisonReady",
      "comparisonError",
      "comparisonDebugPresent",
      "comparisonReducedMotion",
      "compactDebugPresent",
      "compactPlaying",
    ],
    "browser capture readiness",
  );
  if (
    booleanValue(readiness["comparisonReady"], "capture comparisonReady") !== true ||
    readiness["comparisonError"] !== null ||
    booleanValue(readiness["comparisonDebugPresent"], "capture comparisonDebugPresent") !== true ||
    booleanValue(readiness["comparisonReducedMotion"], "capture comparisonReducedMotion") !== false ||
    booleanValue(readiness["compactDebugPresent"], "capture compactDebugPresent") !== true ||
    booleanValue(readiness["compactPlaying"], "capture compactPlaying") !== true
  ) {
    fail("browser capture readiness does not prove normal-motion compact autoplay");
  }

  const content = plainObject(valid["content"], "browser capture content");
  exactObjectKeys(
    content,
    ["headline", "tableCount", "iframeTitle", "legacySizeNote", "compactSizeNote", "ratio"],
    "browser capture content",
  );
  const expectedRatio = Math.round(
    record.legacy.v2qSequence.totalBytes / record.compact.asset.bytes,
  );
  if (
    !/^One crystal\.\s*Two timelines\.$/u.test(stringValue(content["headline"], "capture headline")) ||
    safeInteger(content["tableCount"], "capture tableCount") !== 1 ||
    content["iframeTitle"] !== "Interactive compact Run B growth replay" ||
    !stringValue(content["legacySizeNote"], "capture legacySizeNote").includes(
      record.legacy.v2qSequence.totalBytes.toLocaleString("en-US"),
    ) ||
    !stringValue(content["compactSizeNote"], "capture compactSizeNote").includes(
      record.compact.asset.bytes.toLocaleString("en-US"),
    ) ||
    content["ratio"] !== `${expectedRatio.toLocaleString("en-US")}× smaller`
  ) {
    fail("browser capture content does not reproduce the semantic measured comparison");
  }

  const screenshots = plainObject(valid["screenshots"], "browser capture screenshot map");
  exactObjectKeys(screenshots, Object.keys(CAPTURE_SCREENSHOTS), "browser capture screenshot map");
  for (const [key, path] of Object.entries(CAPTURE_SCREENSHOTS)) {
    if (screenshots[key] !== required(path).sha256) {
      fail(`browser capture screenshot digest differs at ${key}`);
    }
  }
  if (
    screenshots["middle"] !== screenshots["reverse"] ||
    screenshots["start"] === screenshots["middle"] ||
    screenshots["middle"] === screenshots["final"] ||
    screenshots["start"] === screenshots["final"] ||
    screenshots["orbit"] === screenshots["middle"]
  ) {
    fail("browser capture screenshot relations do not prove deterministic reverse, distinct timeline states, and orbit");
  }

  const layout = plainObject(valid["layout"], "browser capture layout");
  exactObjectKeys(layout, ["landscape", "portrait"], "browser capture layout");
  assertLayoutMeasurement(layout["landscape"], "browser capture landscape layout");
  assertLayoutMeasurement(layout["portrait"], "browser capture portrait layout");
  const landscapeLayout = plainObject(layout["landscape"], "browser capture landscape layout");
  const portraitLayout = plainObject(layout["portrait"], "browser capture portrait layout");
  if (
    landscapeLayout["innerWidth"] !== viewport["width"] ||
    portraitLayout["innerWidth"] !== 390
  ) {
    fail("browser capture layout widths differ from the exercised landscape and portrait viewports");
  }
  const requests = plainObject(valid["requests"], "browser capture requests");
  exactObjectKeys(
    requests,
    ["total", "comparisonRecord", "compactAsset", "legacyManifest", "legacyMeshes", "entries"],
    "browser capture requests",
  );
  const requestEntries = parseBrowserRequests(
    requests["entries"],
    "browser capture request entries",
  );
  const comparisonRequestCount = requestEntries.filter(
    (request) => request.pathname === "/comparison-record.json",
  ).length;
  const compactRequestCount = requestEntries.filter(
    (request) => request.pathname === new URL(COMPACT_ASSET_URL, "https://capture.invalid").pathname,
  ).length;
  const legacyManifestCount = requestEntries.filter(
    (request) => /\/manifest\.json$/u.test(request.pathname),
  ).length;
  const legacyMeshCount = requestEntries.filter(
    (request) => /\/mesh-t\d+\.bin$/u.test(request.pathname),
  ).length;
  const totalRequests = safeInteger(requests["total"], "browser capture requests.total");
  if (
    totalRequests < 2 ||
    totalRequests !== requestEntries.length ||
    comparisonRequestCount !== 1 ||
    compactRequestCount !== 1 ||
    legacyManifestCount !== 0 ||
    legacyMeshCount !== 0 ||
    requests["comparisonRecord"] !== comparisonRequestCount ||
    requests["compactAsset"] !== compactRequestCount ||
    requests["legacyManifest"] !== legacyManifestCount ||
    requests["legacyMeshes"] !== legacyMeshCount
  ) {
    fail("browser capture request counts do not prove one compact request and zero legacy timeline requests");
  }
  const controls = plainObject(valid["controls"], "browser capture controls");
  exactObjectKeys(controls, ["buttonCount", "posterSeeks"], "browser capture controls");
  if (safeInteger(controls["buttonCount"], "browser capture buttonCount") !== 3) {
    fail("browser capture does not prove three exact-tick controls");
  }
  const posterSeeks = controls["posterSeeks"];
  if (!Array.isArray(posterSeeks) || posterSeeks.length !== 3) {
    fail("browser capture must report exactly three poster seeks");
  }
  for (let index = 0; index < posterSeeks.length; index++) {
    const seek = plainObject(posterSeeks[index], `browser capture poster seek ${index}`);
    exactObjectKeys(seek, ["label", "tick", "videoTimeSeconds"], `browser capture poster seek ${index}`);
    const expectedPoster = record.legacy.lightweightMedia.posters[index];
    if (
      seek["label"] !== ["start", "middle", "final"][index] ||
      safeInteger(seek["tick"], `browser capture poster seek ${index}.tick`) !== expectedPoster.tick ||
      Math.abs(
        finiteNumber(
          seek["videoTimeSeconds"],
          `browser capture poster seek ${index}.videoTimeSeconds`,
        ) - expectedPoster.videoTimeSeconds,
      ) > 0.08
    ) {
      fail(`browser capture poster seek ${index} differs from the record timeline`);
    }
  }
  const playback = plainObject(valid["playback"], "browser capture playback");
  exactObjectKeys(
    playback,
    [
      "startedPlaying",
      "startedTick",
      "pausedPlaying",
      "pausedTick",
      "pausedDisplayTick",
      "heldTick",
      "heldDisplayTick",
    ],
    "browser capture playback",
  );
  const startedTick = finiteNumber(playback["startedTick"], "browser capture startedTick");
  const pausedTick = finiteNumber(playback["pausedTick"], "browser capture pausedTick");
  const pausedDisplayTick = finiteNumber(
    playback["pausedDisplayTick"],
    "browser capture pausedDisplayTick",
  );
  if (
    booleanValue(playback["startedPlaying"], "browser capture startedPlaying") !== true ||
    !(startedTick > 0 && startedTick <= record.compact.finalTick) ||
    booleanValue(playback["pausedPlaying"], "browser capture pausedPlaying") !== false ||
    !(pausedTick > 0 && pausedTick <= record.compact.finalTick) ||
    pausedDisplayTick !== pausedTick ||
    finiteNumber(playback["heldTick"], "browser capture heldTick") !== pausedTick ||
    finiteNumber(playback["heldDisplayTick"], "browser capture heldDisplayTick") !== pausedDisplayTick
  ) {
    fail("browser capture playback does not prove start, pause, and deterministic hold");
  }
  const keyboard = plainObject(valid["keyboard"], "browser capture keyboard");
  exactObjectKeys(keyboard, ["beforeArrow", "afterArrow"], "browser capture keyboard");
  const beforeArrow = finiteNumber(keyboard["beforeArrow"], "browser capture keyboard.beforeArrow");
  const afterArrow = finiteNumber(keyboard["afterArrow"], "browser capture keyboard.afterArrow");
  if (!(afterArrow > beforeArrow && beforeArrow >= 0 && afterArrow <= record.compact.finalTick)) {
    fail("browser capture keyboard lane did not advance within the compact timeline");
  }
  const portraitFraming = plainObject(
    valid["portraitFraming"],
    "browser capture portrait framing",
  );
  exactObjectKeys(
    portraitFraming,
    ["xMin", "xMax", "yMin", "yMax"],
    "browser capture portrait framing",
  );
  const xMin = finiteNumber(portraitFraming["xMin"], "portrait framing xMin");
  const xMax = finiteNumber(portraitFraming["xMax"], "portrait framing xMax");
  const yMin = finiteNumber(portraitFraming["yMin"], "portrait framing yMin");
  const yMax = finiteNumber(portraitFraming["yMax"], "portrait framing yMax");
  if (xMin < -1 || xMax > 1 || yMin < -1 || yMax > 1 || xMin >= xMax || yMin >= yMax) {
    fail("browser capture portrait framing clips or has invalid projected bounds");
  }
  if (!Array.isArray(valid["errors"]) || valid["errors"].length !== 0) {
    fail("browser capture valid lane must have zero page errors");
  }

  const reducedMotion = plainObject(capture["reducedMotion"], "browser capture reduced motion lane");
  exactObjectKeys(
    reducedMotion,
    [
      "requested",
      "comparisonReducedMotion",
      "compactReducedMotion",
      "playing",
      "manualTick",
    ],
    "browser capture reduced motion lane",
  );
  if (
    booleanValue(reducedMotion["requested"], "reduced motion requested") !== true ||
    booleanValue(
      reducedMotion["comparisonReducedMotion"],
      "comparison reduced-motion observation",
    ) !== true ||
    booleanValue(
      reducedMotion["compactReducedMotion"],
      "compact reduced-motion observation",
    ) !== true ||
    booleanValue(reducedMotion["playing"], "reduced motion playing") !== false ||
    safeInteger(reducedMotion["manualTick"], "reduced motion manualTick") !==
      record.legacy.lightweightMedia.posters[1].tick
  ) {
    fail("browser capture reduced-motion lane did not suppress autoplay and retain midpoint manual control");
  }

  const errors = plainObject(capture["errors"], "browser capture error lanes");
  exactObjectKeys(
    errors,
    ["malformed", "truncated", "payloadMutation", "missing", "noWebgl"],
    "browser capture error lanes",
  );
  const malformedRecord = plainObject(
    parseJsonFile(required(COMPARISON_RECORD_PATH).absolutePath, "comparison record mutation source"),
    "comparison record mutation source",
  );
  malformedRecord["unexpected"] = true;
  const malformedBytes = Buffer.from(`${JSON.stringify(malformedRecord)}\n`, "utf8");
  const compactBytes = readFileSync(required(COMPACT_ASSET_PATH).absolutePath);
  const payloadMutationBytes = Buffer.from(compactBytes);
  payloadMutationBytes[payloadMutationBytes.length - 1] ^= 1;
  const compactPathname = new URL(COMPACT_ASSET_URL, "https://capture.invalid").pathname;
  assertBrowserErrorLane(
    errors["malformed"],
    "malformed record",
    /record|keys|format/iu,
    "malformed record lane",
    false,
    {
      pathname: "/comparison-record.json",
      status: 200,
      contentType: "application/json",
      body: malformedBytes,
    },
  );
  assertBrowserErrorLane(
    errors["truncated"],
    "truncated compact asset",
    /asset|byte|truncat/iu,
    "truncated asset lane",
    false,
    {
      pathname: compactPathname,
      status: 200,
      contentType: "application/octet-stream",
      body: compactBytes.subarray(0, Math.min(9, compactBytes.length)),
    },
  );
  assertBrowserErrorLane(
    errors["payloadMutation"],
    "same-size compact payload mutation",
    /sha-256/iu,
    "payload mutation lane",
    true,
    {
      pathname: compactPathname,
      status: 200,
      contentType: "application/octet-stream",
      body: payloadMutationBytes,
    },
  );
  assertBrowserErrorLane(
    errors["missing"],
    "missing compact asset",
    /asset|fetch|404|missing/iu,
    "missing asset lane",
    false,
    {
      pathname: compactPathname,
      status: 404,
      contentType: "text/plain",
      body: Buffer.from("missing", "utf8"),
    },
  );
  assertBrowserErrorLane(
    errors["noWebgl"],
    "WebGL2 unavailable",
    /webgl2/iu,
    "WebGL2 lane",
    false,
    undefined,
    true,
  );
}

function assertSuccessfulSourceBundle(
  tree: CapturedTree,
  nasVideo: CapturedFile,
  videoMustMatchRecord: boolean,
  expectedOccupancySha256: string,
  expectedBakeOutputPath = pathFromRelative(tree.root.realPath, COMPACT_ASSET_PATH),
): void {
  const files = byPath(tree.files);
  const required = (path: string): CapturedFile => {
    const file = files.get(path);
    if (file === undefined) fail(`source bundle is missing ${path}`);
    return file;
  };
  const status = readFileSync(required("exit-status").absolutePath, "utf8");
  if (status !== "0\n") fail("exit-status must be exactly the successful wrapper record `0\\n`");
  if (required("error.log").bytes !== 0) fail("error.log must be empty for the successful Run B bundle");

  const rawRecord = parseJsonFile(required(COMPARISON_RECORD_PATH).absolutePath, "comparison record");
  const record = decodeGrowthComparisonRecord(rawRecord);
  const asset = required(COMPACT_ASSET_PATH);
  if (
    record.compact.asset.url !== COMPACT_ASSET_URL ||
    record.compact.asset.bytes !== asset.bytes ||
    record.compact.asset.sha256 !== asset.sha256
  ) {
    fail("comparison record compact asset does not identify the exact final NAS URL and source bytes");
  }
  if (record.legacy.lightweightMedia.derivedVideo.url !== DERIVED_VIDEO_URL) {
    fail("comparison record derived video does not use the pinned mount-agnostic NAS URL");
  }
  if (
    videoMustMatchRecord &&
    (
      record.legacy.lightweightMedia.derivedVideo.bytes !== nasVideo.bytes ||
      record.legacy.lightweightMedia.derivedVideo.sha256 !== nasVideo.sha256
    )
  ) {
    fail("actual pinned NAS video differs from the comparison record");
  }
  for (let index = 0; index < POSTER_PATHS.length; index++) {
    const poster = required(POSTER_PATHS[index]);
    const reference = record.legacy.lightweightMedia.posters[index];
    if (
      reference.url !== POSTER_URLS[index] ||
      reference.bytes !== poster.bytes ||
      reference.sha256 !== poster.sha256
    ) {
      fail(`comparison record poster ${index} does not identify the exact final NAS URL and source bytes`);
    }
  }
  const decoded = decodeAndVerifyCompactAsset(asset, record, expectedOccupancySha256);

  const liveLog = readFileSync(required("live.log").absolutePath);
  const bakeElapsedSeconds = parseCompactBakeElapsedSeconds(
    liveLog,
    record.compact.finalTick,
    record.compact.eventCount,
  );
  if (bakeElapsedSeconds !== record.compact.bakeElapsedSeconds) {
    fail("comparison record compact runtime differs from the successful bake log");
  }
  const liveText = new TextDecoder("utf-8", { fatal: true }).decode(liveLog);
  const completeLines = liveText.split(/\r?\n/u).filter((line) =>
    line.startsWith("growth replay complete "),
  );
  const expectedCompletePrefix =
    `growth replay complete tick=${record.compact.finalTick} attached=${record.compact.eventCount} ` +
    `bytes=${asset.bytes} occupancySha256=${record.compact.sourceIdentity.occupancySha256} ` +
    `assetSha256=${asset.sha256} out=`;
  const completeLine = completeLines[0];
  let completeOutputMatches = false;
  if (completeLines.length === 1 && completeLine?.startsWith(expectedCompletePrefix)) {
    const outputPath = completeLine.slice(expectedCompletePrefix.length);
    try {
      completeOutputMatches =
        outputPath !== "" &&
        realpathSync.native(resolve(outputPath)) === realpathSync.native(expectedBakeOutputPath);
    } catch {
      completeOutputMatches = false;
    }
  }
  if (!completeOutputMatches) {
    fail("live.log must contain exactly one complete line identifying the published compact bytes");
  }

  const rawCapture = parseJsonFile(required(CAPTURE_RECORD_PATH).absolutePath, "browser capture record");
  assertStrictBrowserCapture(rawCapture, record, decoded, files, nasVideo);
}

function resolvePublicationPaths(
  sourceDirectory: string,
  nasMount: string,
): PublicationPaths {
  const sourceAbsolute = resolve(sourceDirectory);
  const sourceIdentity = bindDirectory(sourceAbsolute, "source bundle");
  let nasRealPath: string;
  try {
    nasRealPath = realpathSync.native(resolve(nasMount));
  } catch {
    fail(`NAS mount cannot be resolved: ${nasMount}`);
  }
  const nasRoot = bindDirectory(nasRealPath, "NAS root");
  const outParent = join(nasRoot.realPath, "out");
  const outParentIdentity = bindDirectory(outParent, "NAS out parent");
  if (
    !pathIsWithinRoot(nasRoot.realPath, outParentIdentity.realPath) ||
    outParentIdentity.dev !== nasRoot.dev
  ) {
    fail("NAS out parent is not a same-device directory contained by the detected share");
  }
  const canonicalDirectory = join(outParentIdentity.realPath, "gutcheck-growth-runB");
  if (!pathIsWithinRoot(nasRoot.realPath, canonicalDirectory)) {
    fail("canonical Run B directory escapes the detected NAS root");
  }
  if (
    pathIsWithinRoot(nasRoot.realPath, sourceIdentity.realPath) ||
    pathIsWithinRoot(sourceIdentity.realPath, nasRoot.realPath)
  ) {
    fail("source bundle and NAS root must not contain one another");
  }
  return {
    sourceDirectory: sourceIdentity.realPath,
    sourceIdentity,
    nasRoot,
    outParent: outParentIdentity.realPath,
    outParentIdentity,
    canonicalDirectory,
  };
}

function syncCopiedFile(path: string): void {
  const descriptor = openSync(
    path,
    constants.O_RDONLY |
      (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function copyBundleToStaging(
  source: CapturedTree,
  stagingDirectory: string,
): void {
  for (const directory of BUNDLE_DIRECTORIES) {
    mkdirSync(pathFromRelative(stagingDirectory, directory), { recursive: false });
  }
  for (const file of source.files) {
    const target = pathFromRelative(stagingDirectory, file.path);
    copyFileSync(file.absolutePath, target, constants.COPYFILE_EXCL);
    syncCopiedFile(target);
  }
}

function captureExpectedNasVideo(
  paths: PublicationPaths,
  testExpected?: GrowthComparisonPublishedFile,
): CapturedFile {
  const expected = testExpected ?? {
    path: DERIVED_VIDEO_SHARE_PATH,
    bytes: DERIVED_VIDEO_BYTES,
    sha256: DERIVED_VIDEO_SHA256,
  };
  if (expected.path !== DERIVED_VIDEO_SHARE_PATH) {
    fail("expected video identity must name the pinned share-relative Run B derivative");
  }
  const captured = captureFile(
    paths.nasRoot,
    DERIVED_VIDEO_SHARE_PATH,
    "pinned NAS derived video",
  );
  if (captured.bytes !== expected.bytes || captured.sha256 !== expected.sha256) {
    fail("actual pinned NAS derived video bytes or SHA-256 differ");
  }
  return captured;
}

function assertNasVideoUnchanged(
  paths: PublicationPaths,
  expected: CapturedFile,
  label: string,
): CapturedFile {
  const current = captureFile(paths.nasRoot, DERIVED_VIDEO_SHARE_PATH, label);
  assertInventoriesMatch([expected], [current], label, true);
  return current;
}

function verifyFailedStagingPreserved(
  stagingDirectory: string,
  expected: DirectoryIdentity,
): string {
  if (!lexicalPathExists(stagingDirectory)) {
    fail("private failed staging directory disappeared; no cleanup was attempted");
  }
  const preserved = assertDirectoryIdentity(
    stagingDirectory,
    expected,
    "preserved private failed staging directory",
  );
  return preserved.realPath;
}

function sumBytes(files: readonly CapturedFile[]): number {
  let total = 0;
  for (const file of files) {
    if (total > Number.MAX_SAFE_INTEGER - file.bytes) {
      fail("published bundle byte total exceeds the safe-integer range");
    }
    total += file.bytes;
  }
  return total;
}

function publicationReport(
  paths: PublicationPaths,
  finalTree: CapturedTree,
  finalVideo: CapturedFile,
): GrowthComparisonNasPublicationReport {
  const files = finalTree.files.map((file) => ({
    path: `${GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY}/${file.path}`,
    bytes: file.bytes,
    sha256: file.sha256,
  }));
  return {
    format: "gutcheck-growth-comparison-nas-publication-v1",
    status: "pass",
    generatedAt: new Date().toISOString(),
    sourceDirectory: paths.sourceDirectory,
    canonicalDirectory: finalTree.root.realPath,
    shareRelativeDirectory: GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY,
    publication: {
      method: "same-share-staging-directory-atomic-rename",
      sourceReverifiedAfterCopy: true,
      stagingReverifiedImmediatelyBeforeRename: true,
      finalCanonicalRehashed: true,
      concurrencyBoundary: "no-concurrent-local-mutator-between-final-lstat-and-rename",
    },
    fileCount: files.length,
    totalBytes: sumBytes(finalTree.files),
    files,
    referencedVideo: {
      path: DERIVED_VIDEO_SHARE_PATH,
      bytes: finalVideo.bytes,
      sha256: finalVideo.sha256,
    },
  };
}

function publishGrowthComparisonBundleCore(
  options: CorePublicationOptions,
): GrowthComparisonNasPublicationReport {
  if (!/^[A-Za-z0-9-]+$/u.test(options.attemptId)) {
    fail("attempt id must contain only ASCII letters, digits, and hyphens");
  }
  const paths = resolvePublicationPaths(options.sourceDirectory, options.nasMount);
  assertPathAbsent(paths.canonicalDirectory, "canonical Run B comparison bundle");
  const source = captureExactTree(paths.sourceDirectory, "source bundle");
  const nasVideo = captureExpectedNasVideo(paths, options.testExpectedVideoIdentity);
  assertDirectoryIdentity(paths.sourceDirectory, paths.sourceIdentity, "source bundle");
  assertSuccessfulSourceBundle(
    source,
    nasVideo,
    options.testExpectedVideoIdentity === undefined,
    options.testExpectedOccupancySha256 ?? RUN_B_OCCUPANCY_SHA256,
  );

  const stagingDirectory = join(
    paths.outParent,
    `.gutcheck-growth-runB.staging-${options.attemptId}`,
  );
  assertPathAbsent(stagingDirectory, "private staging directory");
  mkdirSync(stagingDirectory, { recursive: false });
  const stagingIdentity = bindDirectory(stagingDirectory, "private staging directory");
  let renamed = false;
  try {
    if (stagingIdentity.dev !== paths.outParentIdentity.dev) {
      fail("private staging directory is not on the NAS out parent's device");
    }
    copyBundleToStaging(source, stagingDirectory);
    const firstStaging = captureExactTree(stagingDirectory, "staged bundle", true);
    assertInventoriesMatch(source.files, firstStaging.files, "staged bundle", false);
    assertDirectoryIdentity(stagingDirectory, stagingIdentity, "private staging directory");
    options.hooks?.afterFirstStagingVerification?.({
      sourceDirectory: paths.sourceDirectory,
      stagingDirectory,
      canonicalDirectory: paths.canonicalDirectory,
      outParent: paths.outParent,
    });

    assertDirectoryIdentity(paths.outParent, paths.outParentIdentity, "NAS out parent");
    assertDirectoryIdentity(paths.sourceDirectory, paths.sourceIdentity, "source bundle");
    assertDirectoryIdentity(stagingDirectory, stagingIdentity, "private staging directory");
    const sourceBeforeRename = captureExactTree(paths.sourceDirectory, "source bundle before rename");
    const stagingBeforeRename = captureExactTree(stagingDirectory, "staged bundle before rename", true);
    assertNasVideoUnchanged(paths, nasVideo, "pinned NAS video before rename");
    assertInventoriesMatch(source.files, sourceBeforeRename.files, "source bundle before rename", true);
    assertInventoriesMatch(firstStaging.files, stagingBeforeRename.files, "staged bundle before rename", true);
    assertInventoriesMatch(source.files, stagingBeforeRename.files, "staged bundle before rename", false);

    options.hooks?.beforeFinalPreflight?.({
      sourceDirectory: paths.sourceDirectory,
      stagingDirectory,
      canonicalDirectory: paths.canonicalDirectory,
      outParent: paths.outParent,
    });
    // Everything is reopened again after the last test boundary and immediately before rename.
    assertDirectoryIdentity(paths.outParent, paths.outParentIdentity, "NAS out parent");
    assertDirectoryIdentity(paths.sourceDirectory, paths.sourceIdentity, "source bundle");
    assertDirectoryIdentity(stagingDirectory, stagingIdentity, "private staging directory");
    const finalSource = captureExactTree(paths.sourceDirectory, "final source preflight");
    const finalStaging = captureExactTree(stagingDirectory, "final staging preflight", true);
    assertNasVideoUnchanged(paths, nasVideo, "final pinned NAS video preflight");
    assertInventoriesMatch(source.files, finalSource.files, "final source preflight", true);
    assertInventoriesMatch(firstStaging.files, finalStaging.files, "final staging preflight", true);
    assertInventoriesMatch(source.files, finalStaging.files, "final staging preflight", false);
    assertPathAbsent(paths.canonicalDirectory, "canonical Run B comparison bundle before rename");

    renameSync(stagingDirectory, paths.canonicalDirectory);
    renamed = true;
    const canonicalIdentity = assertDirectoryIdentity(
      paths.canonicalDirectory,
      stagingIdentity,
      "canonical Run B comparison bundle",
      true,
    );
    if (canonicalIdentity.dev !== paths.outParentIdentity.dev) {
      fail("renamed canonical bundle is not on the NAS out parent's device");
    }
    options.hooks?.afterRename?.({
      sourceDirectory: paths.sourceDirectory,
      stagingDirectory,
      canonicalDirectory: paths.canonicalDirectory,
      outParent: paths.outParent,
    });
    assertDirectoryIdentity(paths.outParent, paths.outParentIdentity, "NAS out parent");
    assertDirectoryIdentity(
      paths.canonicalDirectory,
      stagingIdentity,
      "canonical Run B comparison bundle",
      true,
    );
    const finalTree = captureExactTree(paths.canonicalDirectory, "final canonical bundle", true);
    const finalVideo = assertNasVideoUnchanged(paths, nasVideo, "final pinned NAS video verification");
    assertInventoriesMatch(firstStaging.files, finalTree.files, "final canonical bundle", true);
    assertInventoriesMatch(source.files, finalTree.files, "final canonical bundle", false);
    assertSuccessfulSourceBundle(
      finalTree,
      finalVideo,
      options.testExpectedVideoIdentity === undefined,
      options.testExpectedOccupancySha256 ?? RUN_B_OCCUPANCY_SHA256,
      pathFromRelative(paths.sourceDirectory, COMPACT_ASSET_PATH),
    );
    return publicationReport(paths, finalTree, finalVideo);
  } catch (error) {
    if (renamed) {
      // A canonical path published by this invocation is never deleted, even when final rehash or
      // semantic validation finds damage. Preserve it for diagnosis and require operator review.
      throw error;
    }
    let preservedStaging: string;
    try {
      preservedStaging = verifyFailedStagingPreserved(stagingDirectory, stagingIdentity);
    } catch (preservationError) {
      throw new AggregateError(
        [error, preservationError],
        "gutcheck growth comparison NAS publication failed; failed staging ownership could not be reverified, and no cleanup was attempted",
      );
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new AggregateError(
      [error],
      `gutcheck growth comparison NAS publication failed: ${detail}; ` +
        `failed staging preserved for diagnosis at ${preservedStaging}; no cleanup was attempted`,
    );
  }
}

/** Publish the fixed local Run B bundle to the currently detected snowcrystal NAS mount. */
export function publishGrowthComparisonBundleToDetectedNas(): GrowthComparisonNasPublicationReport {
  const nasMount = detectNasMount();
  if (nasMount === null) fail("snowcrystal NAS share is not attached");
  return publishGrowthComparisonBundleCore({
    sourceDirectory: DEFAULT_SOURCE_DIRECTORY,
    nasMount,
    attemptId: `${process.pid}-${randomUUID()}`,
  });
}

/** Test-only injected-mount seam; production CLI always calls detectNasMount(). */
export const growthComparisonNasPublisherTestOnly = Object.freeze({
  publish(options: {
    readonly sourceDirectory: string;
    readonly nasMount: string;
    readonly attemptId?: string;
    readonly hooks?: GrowthComparisonPublisherTestHooks;
    readonly expectedVideoIdentity: GrowthComparisonPublishedFile;
    readonly expectedOccupancySha256: string;
  }): GrowthComparisonNasPublicationReport {
    return publishGrowthComparisonBundleCore({
      sourceDirectory: options.sourceDirectory,
      nasMount: options.nasMount,
      attemptId: options.attemptId ?? `test-${randomUUID()}`,
      hooks: options.hooks,
      testExpectedVideoIdentity: options.expectedVideoIdentity,
      testExpectedOccupancySha256: options.expectedOccupancySha256,
    });
  },
});

export function runGrowthComparisonNasPublisherCli(
  argv: readonly string[] = process.argv.slice(2),
): GrowthComparisonNasPublicationReport {
  if (argv.length !== 0) {
    fail("usage: node scripts/gutcheck-publish-growth-comparison.ts");
  }
  const report = publishGrowthComparisonBundleToDetectedNas();
  console.log(JSON.stringify(report, null, 2));
  return report;
}

const invokedPath = process.argv[1] === undefined ? null : resolve(process.argv[1]);
if (invokedPath !== null && invokedPath === fileURLToPath(import.meta.url)) {
  try {
    runGrowthComparisonNasPublisherCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
