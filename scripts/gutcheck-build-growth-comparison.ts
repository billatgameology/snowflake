// Build the measured Run B legacy-versus-compact comparison record.
//
// The record is deliberately derived from source bytes rather than copied from producer claims:
// every legacy frame is opened, statted, and hashed; the compact timeline is decoded and its full
// lattice occupancy digest is recomputed; ffprobe supplies the derived video's duration and frame
// count; and the compact runtime comes from the unique final line in the bake log.
//
//   node scripts/gutcheck-build-growth-comparison.ts \
//     --growth-asset out/gutcheck-growth-runB/gutcheck-growth-v1.bin \
//     --compact-log out/gutcheck-growth-runB/live.log \
//     --raw-manifest /path/to/anim-B/manifest.json \
//     --v2q-manifest /path/to/anim-B-v2q/manifest.json \
//     --derived-video /path/to/run-b.mp4 --derived-video-url /media/run-b.mp4 \
//     --poster-start-file /path/to/start.webp --poster-start-url /media/start.webp \
//     --poster-start-time 0 \
//     --poster-mid-file /path/to/mid.webp --poster-mid-url /media/mid.webp \
//     --poster-mid-time 6.5 \
//     --poster-final-file /path/to/final.webp --poster-final-url /media/final.webp \
//     --poster-final-time 13 \
//     --compact-asset-url /media/gutcheck-growth-v1.bin --out /path/to/comparison.json

import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { GG_PRESETS, domainCenter } from "@vcc/core";

import {
  decodeGrowthAsset,
  growthCellCount,
  growthCropSize,
  GUTCHECK_GROWTH_LATTICE,
  type DecodedGrowthAsset,
  type GrowthCrop,
  type GrowthDims,
} from "../app/src/gutcheck-growth-format.ts";
import {
  GUTCHECK_GROWTH_COMPARISON_FORMAT,
  decodeGrowthComparisonRecord,
  type GrowthComparisonPosterReferences,
  type GrowthComparisonRecord,
} from "../app/src/gutcheck-growth-comparison-record.ts";
import { detectNasMount, resolveNasRequest } from "./nas-root.ts";

const UINT32_MAX = 0xffff_ffff;
const READ_CHUNK_BYTES = 1024 * 1024;
const MAX_CAPTURE_BYTES = 64 * 1024 * 1024;
const EXPECTED_POSTER_TIMES = [0, 6.5, 13] as const;
const RUN_B_MANIFEST_SHA256 = "a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d";
const RUN_B_OCCUPANCY_SHA256 = "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";
const RUN_B_VIDEO_SHA256 = "a5ead695add684791f2cd2c02dc650a64d14e37a78df22606b4675f72f6a4c1f";
const RUN_B_RAW_FRAME_BYTES = 9_986_535_068;
const RUN_B_V2Q_FRAME_BYTES = 6_622_097_200;
const RUN_B_MANIFEST_BYTES = 97_503;
const RUN_B_RAW_SECONDS = 41_194;
// Historical quantizer console timing recorded in the active plan; no surviving timing artifact
// can re-derive it. Comparison-v1 labels this as a recorded cost, and the builder does not accept
// a replacement producer number on the command line.
const RUN_B_V2Q_SECONDS = 25;
const RUN_B_VIDEO_BYTES = 5_592_795;
const RUN_B_VIDEO_SECONDS = 16;
const RUN_B_VIDEO_FRAMES = 480;
const RUN_B_LEGACY_SHARE_RELATIVE = "out/gutcheck-gg-realism/large/anim-B/manifest.json";
const RUN_B_V2Q_SHARE_RELATIVE = "out/gutcheck-gg-realism/large/anim-B-v2q/manifest.json";
const RUN_B_GIT_HEAD = "44fd4b604cddf1c1c30ed4aec2afba5bdc18be5c";
const expectedRunBBakeArgv = (legacyManifestPath: string): readonly string[] => [
  "--preset", "plate",
  "--dims", "1200,1200,48",
  "--ticks", "70000",
  "--out", "out/gutcheck-growth-runB/gutcheck-growth-v1.bin",
  "--domain", "hexPrism",
  "--seed", "1",
  "--noise", "0",
  "--padding", "2",
  "--progress", "100",
  "--legacy-manifest", legacyManifestPath,
  "--expected-attached-count", "961597",
  "--expected-occupancy-sha256", RUN_B_OCCUPANCY_SHA256,
];
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const INTEGER_TEXT = /^(?:0|[1-9][0-9]*)$/u;
const FINITE_TEXT = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?(?:0|[1-9][0-9]*))?$/u;

export interface MeasuredRegularFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

interface CapturedRegularFile extends MeasuredRegularFile {
  readonly contents: Uint8Array;
}

export interface ComparisonPosterInput {
  readonly path: string;
  readonly url: string;
  readonly videoTimeSeconds: number;
}

export interface ProbedVideoMetadata {
  readonly durationSeconds: number;
  readonly frameCount: number;
  readonly width: number;
  readonly height: number;
}

export interface GrowthComparisonBuildOptions {
  readonly growthAssetPath: string;
  readonly compactLogPath: string;
  readonly rawManifestPath: string;
  readonly v2qManifestPath: string;
  readonly derivedVideoPath: string;
  readonly derivedVideoUrl: string;
  readonly posters: readonly [ComparisonPosterInput, ComparisonPosterInput, ComparisonPosterInput];
  readonly compactAssetUrl: string;
  readonly recordedAt?: string;
}

export interface GrowthComparisonCli extends GrowthComparisonBuildOptions {
  readonly outputPath: string;
}

interface LegacyFrame {
  readonly file: string;
  readonly tick: number;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly attachedCount: number;
}

interface LegacyExtraction {
  readonly spacing: number;
  readonly sigma: number;
  readonly iso: number;
  readonly margin: number;
  readonly normalDelta: number;
}

export interface ParsedLegacyComparisonManifest {
  readonly config: {
    readonly preset: string;
    readonly dims: GrowthDims;
    readonly domain: "box" | "hexPrism";
    readonly ticks: number;
    readonly every: number;
    readonly seed: number;
    readonly noise: number;
    readonly extraction: LegacyExtraction;
  };
  readonly frames: readonly LegacyFrame[];
  readonly elapsedSeconds: number;
}

interface LoadedLegacyManifest {
  readonly descriptor: CapturedRegularFile;
  readonly parsed: ParsedLegacyComparisonManifest;
}

function fail(message: string): never {
  throw new Error(`gutcheck growth comparison builder: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${label} must be a plain object`);
  return value;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys must be exactly ${wanted.join(", ")}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be a non-empty string`);
  return value;
}

function safeInteger(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} must be a safe integer in [${min}, ${max}]`);
  }
  return value as number;
}

function finiteNumber(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    fail(`${label} must be finite and in [${min}, ${max}]`);
  }
  return value;
}

function positiveFinite(value: unknown, label: string): number {
  return finiteNumber(value, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER, label);
}

function sha256(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    fail(`${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function parseJson(contents: Uint8Array, label: string): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(contents);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

function fileIdentityMatches(
  left: ReturnType<typeof fstatSync>,
  right: ReturnType<typeof fstatSync>,
): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs
  );
}

/** Open without following the final path component, stream-hash, and verify the inode stayed put. */
function measureFile(path: string, label: string, capture: boolean): MeasuredRegularFile | CapturedRegularFile {
  const absolutePath = resolve(path);
  let lexical;
  try {
    lexical = lstatSync(absolutePath);
  } catch (error) {
    fail(`${label} cannot be statted at ${absolutePath}: ${(error as Error).message}`);
  }
  if (lexical.isSymbolicLink()) fail(`${label} must not be a symbolic link: ${absolutePath}`);
  if (!lexical.isFile()) fail(`${label} must be a regular file: ${absolutePath}`);
  const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  let descriptor: number;
  try {
    descriptor = openSync(absolutePath, constants.O_RDONLY | noFollow);
  } catch (error) {
    fail(`${label} cannot be opened without following links: ${(error as Error).message}`);
  }
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile()) fail(`${label} opened object is not a regular file`);
    if (!Number.isSafeInteger(before.size) || before.size < 1) fail(`${label} must be non-empty and safely sized`);
    if (capture && before.size > MAX_CAPTURE_BYTES) {
      fail(`${label} exceeds the ${MAX_CAPTURE_BYTES}-byte capture limit`);
    }
    const digest = createHash("sha256");
    const chunks: Buffer[] = [];
    const buffer = Buffer.allocUnsafe(Math.min(READ_CHUNK_BYTES, before.size));
    let total = 0;
    while (total < before.size) {
      const wanted = Math.min(buffer.byteLength, before.size - total);
      const count = readSync(descriptor, buffer, 0, wanted, null);
      if (count <= 0) fail(`${label} ended before its statted byte length`);
      const chunk = buffer.subarray(0, count);
      digest.update(chunk);
      if (capture) chunks.push(Buffer.from(chunk));
      total += count;
    }
    const extra = Buffer.allocUnsafe(1);
    if (readSync(descriptor, extra, 0, 1, null) !== 0) fail(`${label} grew while being measured`);
    const after = fstatSync(descriptor);
    if (!fileIdentityMatches(before, after)) fail(`${label} changed while being measured`);
    const result: MeasuredRegularFile = {
      path: absolutePath,
      bytes: total,
      sha256: digest.digest("hex"),
    };
    if (!capture) return result;
    return { ...result, contents: Buffer.concat(chunks, total) };
  } finally {
    closeSync(descriptor);
  }
}

export function measureRegularFile(path: string, label = "file"): MeasuredRegularFile {
  return measureFile(path, label, false);
}

function captureRegularFile(path: string, label: string): CapturedRegularFile {
  return measureFile(path, label, true) as CapturedRegularFile;
}

function parseDims(value: unknown, label: string): GrowthDims {
  const dims = object(value, label);
  exactKeys(dims, ["nx", "ny", "nz"], label);
  const result = {
    nx: safeInteger(dims["nx"], 1, UINT32_MAX, `${label}.nx`),
    ny: safeInteger(dims["ny"], 1, UINT32_MAX, `${label}.ny`),
    nz: safeInteger(dims["nz"], 1, UINT32_MAX, `${label}.nz`),
  };
  growthCellCount(result);
  return result;
}

function parseExtraction(value: unknown): LegacyExtraction {
  const extraction = object(value, "legacy manifest config.extraction");
  exactKeys(extraction, ["spacing", "sigma", "iso", "margin", "normalDelta"], "legacy manifest config.extraction");
  return {
    spacing: positiveFinite(extraction["spacing"], "legacy manifest config.extraction.spacing"),
    sigma: positiveFinite(extraction["sigma"], "legacy manifest config.extraction.sigma"),
    iso: finiteNumber(extraction["iso"], 0, 1, "legacy manifest config.extraction.iso"),
    margin: finiteNumber(extraction["margin"], 0, Number.MAX_SAFE_INTEGER, "legacy manifest config.extraction.margin"),
    normalDelta: positiveFinite(extraction["normalDelta"], "legacy manifest config.extraction.normalDelta"),
  };
}

function sameDims(left: GrowthDims, right: GrowthDims): boolean {
  return left.nx === right.nx && left.ny === right.ny && left.nz === right.nz;
}

function expectedFrameFile(tick: number): string {
  return `mesh-t${String(tick).padStart(6, "0")}.bin`;
}

/** Parse the immutable manifest shape and bind every frame count to compact attachment events. */
export function parseLegacyComparisonManifest(
  value: unknown,
  growth: DecodedGrowthAsset,
): ParsedLegacyComparisonManifest {
  const manifest = object(value, "legacy manifest");
  exactKeys(manifest, ["format", "complete", "config", "frames", "finalBBox", "elapsedSeconds"], "legacy manifest");
  if (manifest["format"] !== "gutcheck-anim-v1") fail("legacy manifest format must be gutcheck-anim-v1");
  if (manifest["complete"] !== true) fail("legacy manifest must be complete");

  const configValue = object(manifest["config"], "legacy manifest config");
  exactKeys(configValue, ["preset", "dims", "domain", "ticks", "every", "seed", "noise", "extraction"], "legacy manifest config");
  const dims = parseDims(configValue["dims"], "legacy manifest config.dims");
  const domain = configValue["domain"];
  if (domain !== "box" && domain !== "hexPrism") fail("legacy manifest config.domain is invalid");
  const config: ParsedLegacyComparisonManifest["config"] = {
    preset: nonEmptyString(configValue["preset"], "legacy manifest config.preset"),
    dims,
    domain,
    ticks: safeInteger(configValue["ticks"], 1, UINT32_MAX - 1, "legacy manifest config.ticks"),
    every: safeInteger(configValue["every"], 1, UINT32_MAX - 1, "legacy manifest config.every"),
    seed: safeInteger(configValue["seed"], 0, UINT32_MAX, "legacy manifest config.seed"),
    noise: finiteNumber(configValue["noise"], 0, 1, "legacy manifest config.noise"),
    extraction: parseExtraction(configValue["extraction"]),
  };
  const growthConfig = growth.header.config;
  if (
    config.preset !== growthConfig.preset ||
    !sameDims(config.dims, growthConfig.dims) ||
    config.domain !== growthConfig.domain ||
    config.ticks !== growthConfig.tickCap ||
    config.seed !== growthConfig.rngSeed ||
    config.noise !== growthConfig.noiseEpsilon
  ) {
    fail("legacy manifest configuration differs from the decoded compact replay");
  }
  if (growth.header.terminationReason !== "tick-cap" || growth.header.finalTick !== config.ticks) {
    fail("compact replay must end at the shared legacy tick cap");
  }
  if (growthConfig.farField !== "reflecting") fail("Run B compact replay must use reflecting far field");
  if (growthConfig.seedRadius !== 2 || growthConfig.seedThickness !== 1) {
    fail("Run B compact replay must use the canonical radius-2, thickness-1 seed");
  }
  if (config.ticks % config.every !== 0) fail("legacy tick cap must be divisible by its frame interval");

  const framesValue = manifest["frames"];
  const expectedCount = config.ticks / config.every + 1;
  if (!Array.isArray(framesValue) || framesValue.length !== expectedCount) {
    fail(`legacy manifest must contain exactly ${expectedCount} timeline frames`);
  }
  const frames: LegacyFrame[] = [];
  let eventCursor = 0;
  let previousAttached = -1;
  for (let index = 0; index < framesValue.length; index++) {
    const label = `legacy manifest frame ${index}`;
    const frame = object(framesValue[index], label);
    exactKeys(frame, ["file", "tick", "vertexCount", "triangleCount", "attachedCount"], label);
    const expectedTick = index * config.every;
    const tick = safeInteger(frame["tick"], 0, config.ticks, `${label}.tick`);
    if (tick !== expectedTick) fail(`${label}.tick must be ${expectedTick}`);
    const file = nonEmptyString(frame["file"], `${label}.file`);
    const expectedFile = expectedFrameFile(tick);
    if (file !== expectedFile || file !== basename(file) || /[\\/\u0000]/u.test(file)) {
      fail(`${label}.file must be the exact basename ${expectedFile}`);
    }
    const attachedCount = safeInteger(frame["attachedCount"], 1, UINT32_MAX, `${label}.attachedCount`);
    if (attachedCount < previousAttached) fail("legacy attached counts must be non-decreasing");
    while (eventCursor < growth.attachTicks.length && growth.attachTicks[eventCursor]! <= tick) eventCursor++;
    if (attachedCount !== eventCursor) {
      fail(`${label}.attachedCount ${attachedCount} differs from compact event count ${eventCursor} at tick ${tick}`);
    }
    frames.push({
      file,
      tick,
      vertexCount: safeInteger(frame["vertexCount"], 1, UINT32_MAX, `${label}.vertexCount`),
      triangleCount: safeInteger(frame["triangleCount"], 1, UINT32_MAX, `${label}.triangleCount`),
      attachedCount,
    });
    previousAttached = attachedCount;
  }
  if (eventCursor !== growth.header.eventCount) {
    fail("legacy final frame does not cover every compact attachment event");
  }

  const bbox = object(manifest["finalBBox"], "legacy manifest finalBBox");
  exactKeys(bbox, ["xMin", "xMax", "yMin", "yMax", "zMin", "zMax"], "legacy manifest finalBBox");
  for (const key of ["xMin", "xMax", "yMin", "yMax", "zMin", "zMax"] as const) {
    finiteNumber(bbox[key], -Number.MAX_VALUE, Number.MAX_VALUE, `legacy manifest finalBBox.${key}`);
  }
  if (
    (bbox["xMin"] as number) > (bbox["xMax"] as number) ||
    (bbox["yMin"] as number) > (bbox["yMax"] as number) ||
    (bbox["zMin"] as number) > (bbox["zMax"] as number)
  ) {
    fail("legacy manifest finalBBox minima must not exceed maxima");
  }
  return {
    config,
    frames,
    elapsedSeconds: positiveFinite(manifest["elapsedSeconds"], "legacy manifest elapsedSeconds"),
  };
}

function loadLegacyManifest(path: string, label: string, growth: DecodedGrowthAsset): LoadedLegacyManifest {
  const descriptor = captureRegularFile(path, `${label} manifest`);
  return { descriptor, parsed: parseLegacyComparisonManifest(parseJson(descriptor.contents, `${label} manifest`), growth) };
}

function assertMeasuredRunBManifestOnDetectedShare(path: string, shareRelativePath: string, label: string): void {
  const mount = detectNasMount();
  if (mount === null) fail(`snowcrystal NAS share is not attached; cannot bind the ${label} manifest path`);
  const expected = resolveNasRequest(shareRelativePath, mount);
  if (expected.kind !== "ok") fail(`registered ${label} share-relative manifest cannot be resolved safely`);
  if (realpathSync.native(resolve(path)) !== expected.path) {
    fail(`supplied ${label} manifest is not the registered Run B share-relative NAS file`);
  }
}

function assertInsideManifestDirectory(manifestPath: string, file: string, label: string): string {
  if (file !== basename(file) || /[\\/\u0000]/u.test(file)) fail(`${label} is not a safe frame basename`);
  const directory = dirname(resolve(manifestPath));
  const candidate = resolve(directory, file);
  const displacement = relative(directory, candidate);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || resolve(directory, displacement) !== candidate) {
    fail(`${label} escapes its manifest directory`);
  }
  const lexical = lstatSync(candidate);
  if (lexical.isSymbolicLink()) fail(`${label} must not be a symbolic link`);
  const realDirectory = realpathSync.native(directory);
  const realCandidate = realpathSync.native(candidate);
  const realDisplacement = relative(realDirectory, realCandidate);
  if (realDisplacement === "" || realDisplacement === ".." || realDisplacement.startsWith(`..${sep}`)) {
    fail(`${label} resolves outside its manifest directory`);
  }
  return candidate;
}

function readExact(descriptor: number, length: number, position: number, label: string): Buffer {
  const bytes = Buffer.allocUnsafe(length);
  let offset = 0;
  while (offset < length) {
    const count = readSync(descriptor, bytes, offset, length - offset, position + offset);
    if (count <= 0) fail(`${label} is truncated`);
    offset += count;
  }
  return bytes;
}

function meshHeader(path: string, label: string): { readonly value: Record<string, unknown>; readonly headerBytes: number; readonly fileBytes: number } {
  const absolutePath = resolve(path);
  const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  let descriptor: number;
  try {
    descriptor = openSync(absolutePath, constants.O_RDONLY | noFollow);
  } catch (error) {
    fail(`${label} cannot be opened for header validation: ${(error as Error).message}`);
  }
  try {
    const stat = fstatSync(descriptor);
    if (!stat.isFile() || !Number.isSafeInteger(stat.size) || stat.size < 8) {
      fail(`${label} is not a safely sized mesh file`);
    }
    const headerBytes = readExact(descriptor, 4, 0, label).readUInt32LE(0);
    if (headerBytes < 4 || headerBytes > 1024 * 1024 || headerBytes % 4 !== 0) {
      fail(`${label} has an invalid padded JSON header length`);
    }
    if (4 + headerBytes > stat.size) fail(`${label} header extends past end of file`);
    const encoded = readExact(descriptor, headerBytes, 4, label);
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(encoded).replace(/ +$/u, "");
    } catch {
      fail(`${label} header is not valid UTF-8`);
    }
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      fail(`${label} header is not valid JSON`);
    }
    return { value: object(value, `${label} header`), headerBytes, fileBytes: stat.size };
  } finally {
    closeSync(descriptor);
  }
}

function validateMeshSource(
  value: unknown,
  frame: LegacyFrame,
  config: ParsedLegacyComparisonManifest["config"],
  label: string,
): void {
  const source = object(value, label);
  if (source["replay"] !== `${config.preset} ${config.dims.nx},${config.dims.ny},${config.dims.nz} ${config.domain}`) {
    fail(`${label}.replay differs from the manifest configuration`);
  }
  if (source["tick"] !== frame.tick || source["seed"] !== config.seed || source["noiseEpsilon"] !== config.noise) {
    fail(`${label} tick/seed/noise identity differs from the manifest frame`);
  }
}

function align4(value: number): number {
  return Math.ceil(value / 4) * 4;
}

/** Validate the binary format, header counts, source identity, and exact payload byte shape. */
export function validateLegacyFrameFile(
  path: string,
  frame: LegacyFrame,
  config: ParsedLegacyComparisonManifest["config"],
  kind: "raw" | "v2q",
): void {
  const label = `${kind} legacy frame at tick ${frame.tick}`;
  const parsed = meshHeader(path, label);
  const header = parsed.value;
  const expectedFormat = kind === "raw" ? "gutcheck-mesh-v1" : "gutcheck-mesh-v2q";
  if (header["format"] !== expectedFormat) fail(`${label} format must be ${expectedFormat}`);
  if (header["vertexCount"] !== frame.vertexCount || header["triangleCount"] !== frame.triangleCount) {
    fail(`${label} binary vertex/triangle counts differ from its manifest entry`);
  }
  if (kind === "raw") {
    validateMeshSource(header["source"], frame, config, `${label} source`);
    const expectedBytes = 4 + parsed.headerBytes + frame.vertexCount * 24 + frame.triangleCount * 12;
    if (parsed.fileBytes !== expectedBytes) fail(`${label} payload byte length does not match its header counts`);
    return;
  }
  const sourceHeader = object(header["source"], `${label} source header`);
  if (
    sourceHeader["format"] !== "gutcheck-mesh-v1" ||
    sourceHeader["vertexCount"] !== frame.vertexCount ||
    sourceHeader["triangleCount"] !== frame.triangleCount
  ) {
    fail(`${label} embedded raw header does not preserve the manifest counts`);
  }
  validateMeshSource(sourceHeader["source"], frame, config, `${label} embedded raw source`);
  const bboxMin = header["bboxMin"];
  const bboxMax = header["bboxMax"];
  if (!Array.isArray(bboxMin) || bboxMin.length !== 3 || !Array.isArray(bboxMax) || bboxMax.length !== 3) {
    fail(`${label} must contain three-axis bboxMin and bboxMax arrays`);
  }
  for (let axis = 0; axis < 3; axis++) {
    const minimum = finiteNumber(bboxMin[axis], -Number.MAX_VALUE, Number.MAX_VALUE, `${label} bboxMin[${axis}]`);
    const maximum = finiteNumber(bboxMax[axis], -Number.MAX_VALUE, Number.MAX_VALUE, `${label} bboxMax[${axis}]`);
    if (minimum > maximum) fail(`${label} bbox minimum exceeds its maximum on axis ${axis}`);
  }
  const quantization = object(header["quantization"], `${label} quantization`);
  exactKeys(quantization, ["positions", "normals"], `${label} quantization`);
  if (quantization["positions"] !== "u16-bbox" || quantization["normals"] !== "oct-snorm8") {
    fail(`${label} quantization contract is not recognized`);
  }
  const indexType = header["indexType"];
  const expectedIndexType = frame.vertexCount <= 65_535 ? "u16" : "u32";
  if (indexType !== expectedIndexType) {
    fail(`${label} indexType must be ${expectedIndexType} for ${frame.vertexCount} vertices`);
  }
  const positionEnd = 4 + parsed.headerBytes + frame.vertexCount * 6;
  const normalStart = align4(positionEnd);
  const indexStart = align4(normalStart + frame.vertexCount * 2);
  const expectedBytes = indexStart + frame.triangleCount * 3 * (indexType === "u16" ? 2 : 4);
  if (parsed.fileBytes !== expectedBytes) fail(`${label} payload byte length does not match its header counts`);
}

function measureLegacyFrames(manifest: LoadedLegacyManifest, label: string, kind: "raw" | "v2q"): number {
  let total = 0;
  for (let index = 0; index < manifest.parsed.frames.length; index++) {
    const frame = manifest.parsed.frames[index]!;
    const path = assertInsideManifestDirectory(manifest.descriptor.path, frame.file, `${label} frame ${index}`);
    const descriptor = measureRegularFile(path, `${label} frame ${index}`);
    validateLegacyFrameFile(path, frame, manifest.parsed.config, kind);
    if (total > Number.MAX_SAFE_INTEGER - descriptor.bytes) fail(`${label} frame bytes exceed the safe-integer range`);
    total += descriptor.bytes;
  }
  return total;
}

function zeroHashBytes(digest: ReturnType<typeof createHash>, length: number): void {
  const zeros = Buffer.alloc(Math.min(READ_CHUNK_BYTES, Math.max(1, length)));
  let remaining = length;
  while (remaining > 0) {
    const count = Math.min(remaining, zeros.byteLength);
    digest.update(zeros.subarray(0, count));
    remaining -= count;
  }
}

/** Recompute the SHA-256 of the complete u8 lattice occupancy without allocating the full field. */
export function deriveGrowthOccupancySha256(growth: DecodedGrowthAsset): string {
  const cellCount = growthCellCount(growth.header.config.dims);
  const indices = growth.flatIndices.slice().sort();
  const digest = createHash("sha256");
  const one = Buffer.from([1]);
  let cursor = 0;
  for (let event = 0; event < indices.length; event++) {
    const index = indices[event]!;
    if (index < cursor || index >= cellCount) fail("compact event index is invalid while deriving occupancy");
    zeroHashBytes(digest, index - cursor);
    digest.update(one);
    cursor = index + 1;
  }
  zeroHashBytes(digest, cellCount - cursor);
  return digest.digest("hex");
}

export function deriveGrowthSourceIdentity(
  growth: DecodedGrowthAsset,
  actualManifestSha256: string,
  frameCount: number,
): { readonly manifestSha256: string; readonly occupancySha256: string } {
  const source = object(growth.header.source, "compact source");
  const legacy = object(source["legacyComparison"], "compact source.legacyComparison");
  exactKeys(legacy, ["path", "sha256", "frameCount"], "compact source.legacyComparison");
  nonEmptyString(legacy["path"], "compact source.legacyComparison.path");
  const manifestSha256 = sha256(legacy["sha256"], "compact source.legacyComparison.sha256");
  if (manifestSha256 !== actualManifestSha256) {
    fail("compact source manifest digest differs from the measured raw manifest bytes");
  }
  if (safeInteger(legacy["frameCount"], 1, UINT32_MAX, "compact source.legacyComparison.frameCount") !== frameCount) {
    fail("compact source legacy frame count differs from the parsed manifest");
  }

  const endpoint = object(source["endpoint"], "compact source.endpoint");
  exactKeys(
    endpoint,
    ["occupancyEncoding", "measuredAttachedCount", "measuredOccupancySha256", "expectedAttachedCount", "expectedOccupancySha256"],
    "compact source.endpoint",
  );
  if (endpoint["occupancyEncoding"] !== "full-lattice-u8-a-field-i-fastest-j-next-k-slowest") {
    fail("compact source endpoint occupancy encoding is not recognized");
  }
  const measuredCount = safeInteger(endpoint["measuredAttachedCount"], 1, UINT32_MAX, "compact source.endpoint.measuredAttachedCount");
  const expectedCount = safeInteger(endpoint["expectedAttachedCount"], 1, UINT32_MAX, "compact source.endpoint.expectedAttachedCount");
  if (measuredCount !== growth.header.eventCount || expectedCount !== growth.header.eventCount) {
    fail("compact source endpoint counts do not equal the decoded event count");
  }
  const occupancySha256 = deriveGrowthOccupancySha256(growth);
  const measuredDigest = sha256(endpoint["measuredOccupancySha256"], "compact source.endpoint.measuredOccupancySha256");
  const expectedDigest = sha256(endpoint["expectedOccupancySha256"], "compact source.endpoint.expectedOccupancySha256");
  if (measuredDigest !== occupancySha256 || expectedDigest !== occupancySha256) {
    fail("compact source endpoint occupancy digests differ from the event-derived full lattice");
  }
  return { manifestSha256, occupancySha256 };
}

export function parseCompactBakeElapsedSeconds(
  contents: Uint8Array | string,
  finalTick: number,
  eventCount: number,
): number {
  const text = typeof contents === "string" ? contents : new TextDecoder("utf-8", { fatal: true }).decode(contents);
  const pattern = /^growth replay tick=(\d+)\/(\d+) attached=(\d+) events=(\d+) elapsed=([0-9]+(?:\.[0-9]+)?)s$/u;
  const finalLines: Array<{ elapsed: number; line: string }> = [];
  for (const line of text.split(/\r?\n/u)) {
    if (!line.startsWith("growth replay tick=")) continue;
    const match = pattern.exec(line);
    if (match === null) fail(`compact bake log has a malformed progress line: ${line}`);
    const tick = safeInteger(Number(match[1]), 0, UINT32_MAX - 1, "compact bake log tick");
    const tickCap = safeInteger(Number(match[2]), 1, UINT32_MAX - 1, "compact bake log tick cap");
    const attached = safeInteger(Number(match[3]), 1, UINT32_MAX, "compact bake log attached count");
    const events = safeInteger(Number(match[4]), 1, UINT32_MAX, "compact bake log event count");
    if (tick > tickCap) fail("compact bake log progress tick exceeds its tick cap");
    if (tick === finalTick || tickCap === finalTick) {
      if (tickCap !== finalTick) fail("compact bake log final progress candidate has a mismatched tick cap");
      if (tick === finalTick) {
        if (attached !== eventCount || events !== eventCount) {
          fail("compact bake log final progress counts differ from the decoded compact asset");
        }
        const elapsed = positiveFinite(Number(match[5]), "compact bake log final elapsed seconds");
        finalLines.push({ elapsed, line });
      }
    }
  }
  if (finalLines.length !== 1) {
    fail(`compact bake log must contain exactly one matching final progress line; found ${finalLines.length}`);
  }
  return finalLines[0]!.elapsed;
}

function parseDecimal(value: unknown, label: string, positive: boolean): number {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || !FINITE_TEXT.test(text)) fail(`${label} must be a finite base-10 number`);
  const number = Number(text);
  return finiteNumber(number, positive ? Number.MIN_VALUE : 0, Number.MAX_SAFE_INTEGER, label);
}

function parseFrameCount(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "N/A") return null;
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || !INTEGER_TEXT.test(text)) fail(`${label} must be a positive decimal integer`);
  return safeInteger(Number(text), 1, Number.MAX_SAFE_INTEGER, label);
}

export function parseFfprobeVideoMetadata(value: unknown): ProbedVideoMetadata {
  const root = object(value, "ffprobe output");
  const streams = root["streams"];
  if (!Array.isArray(streams) || streams.length !== 1) fail("ffprobe must report exactly one selected video stream");
  const stream = object(streams[0], "ffprobe video stream");
  const format = object(root["format"], "ffprobe format");
  const frameCount =
    parseFrameCount(stream["nb_read_frames"], "ffprobe nb_read_frames") ??
    parseFrameCount(stream["nb_frames"], "ffprobe nb_frames");
  if (frameCount === null) fail("ffprobe did not derive a video frame count");
  const durationSource = format["duration"] ?? stream["duration"];
  return {
    durationSeconds: parseDecimal(durationSource, "ffprobe duration", true),
    frameCount,
    width: safeInteger(stream["width"], 1, UINT32_MAX, "ffprobe video width"),
    height: safeInteger(stream["height"], 1, UINT32_MAX, "ffprobe video height"),
  };
}

export function probeVideoFile(path: string): ProbedVideoMetadata {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-count_frames",
      "-show_entries",
      "stream=width,height,duration,nb_frames,nb_read_frames:format=duration",
      "-of",
      "json",
      resolve(path),
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );
  if (result.error !== undefined) fail(`ffprobe could not run: ${result.error.message}`);
  if (result.status !== 0) fail(`ffprobe failed: ${result.stderr.trim()}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    fail("ffprobe returned invalid JSON");
  }
  return parseFfprobeVideoMetadata(parsed);
}

interface VisualDimensions {
  readonly width: number;
  readonly height: number;
}

interface CanonicalRgba extends VisualDimensions {
  readonly sha256: string;
  readonly bytes: number;
}

function probeVisualDimensions(path: string): VisualDimensions {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", resolve(path)],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );
  if (result.error !== undefined) fail(`ffprobe could not inspect poster dimensions: ${result.error.message}`);
  if (result.status !== 0) fail(`ffprobe failed while inspecting poster dimensions: ${result.stderr.trim()}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    fail("ffprobe returned invalid poster-dimension JSON");
  }
  const root = object(parsed, "poster ffprobe output");
  const streams = root["streams"];
  if (!Array.isArray(streams) || streams.length !== 1) fail("poster must contain exactly one visual stream");
  const stream = object(streams[0], "poster ffprobe stream");
  return {
    width: safeInteger(stream["width"], 1, UINT32_MAX, "poster width"),
    height: safeInteger(stream["height"], 1, UINT32_MAX, "poster height"),
  };
}

function rgbaFromFfmpeg(
  args: readonly string[],
  dimensions: VisualDimensions,
  label: string,
  input?: Uint8Array,
): CanonicalRgba {
  const expectedBytes = dimensions.width * dimensions.height * 4;
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes > MAX_CAPTURE_BYTES) {
    fail(`${label} canonical RGBA image exceeds the capture limit`);
  }
  const result = spawnSync("ffmpeg", [...args], {
    encoding: "buffer",
    maxBuffer: MAX_CAPTURE_BYTES + 1024 * 1024,
    input,
  });
  if (result.error !== undefined) fail(`ffmpeg could not decode ${label}: ${result.error.message}`);
  if (result.status !== 0) fail(`ffmpeg failed while decoding ${label}: ${result.stderr.toString("utf8").trim()}`);
  const output = result.stdout;
  if (output.byteLength !== expectedBytes) {
    fail(`${label} canonical RGBA byte length ${output.byteLength} differs from ${expectedBytes}`);
  }
  return {
    ...dimensions,
    bytes: output.byteLength,
    sha256: createHash("sha256").update(output).digest("hex"),
  };
}

function canonicalPosterRgba(path: string): CanonicalRgba {
  const dimensions = probeVisualDimensions(path);
  return rgbaFromFfmpeg(
    ["-v", "error", "-i", resolve(path), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"],
    dimensions,
    `poster ${path}`,
  );
}

function canonicalVideoFrameRgba(
  videoPath: string,
  timeSeconds: number,
  dimensions: VisualDimensions,
): CanonicalRgba {
  const extracted = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      resolve(videoPath),
      "-ss",
      String(timeSeconds),
      "-frames:v",
      "1",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "pipe:1",
    ],
    { encoding: "buffer", maxBuffer: MAX_CAPTURE_BYTES + 1024 * 1024 },
  );
  if (extracted.error !== undefined) fail(`ffmpeg could not extract the derived-video frame: ${extracted.error.message}`);
  if (extracted.status !== 0) {
    fail(`ffmpeg failed while extracting the derived-video frame: ${extracted.stderr.toString("utf8").trim()}`);
  }
  if (extracted.stdout.byteLength < 1) fail("ffmpeg produced no PNG bytes for the derived-video frame");
  return rgbaFromFfmpeg(
    ["-v", "error", "-i", "pipe:0", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"],
    dimensions,
    `derived-video frame at ${timeSeconds} seconds`,
    extracted.stdout,
  );
}

/** Prove a supplied poster decodes to the exact same canonical RGBA frame as the pinned video. */
export function verifyPosterMatchesVideoFrame(
  videoPath: string,
  posterPath: string,
  timeSeconds: number,
  videoDimensions: VisualDimensions,
): void {
  const poster = canonicalPosterRgba(posterPath);
  const extracted = canonicalVideoFrameRgba(videoPath, timeSeconds, videoDimensions);
  if (
    poster.width !== extracted.width ||
    poster.height !== extracted.height ||
    poster.bytes !== extracted.bytes ||
    poster.sha256 !== extracted.sha256
  ) {
    fail(`poster ${posterPath} is not the exact decoded video frame at ${timeSeconds} seconds`);
  }
}

function sameLegacyManifest(left: ParsedLegacyComparisonManifest, right: ParsedLegacyComparisonManifest): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function cropMeasurement(crop: GrowthCrop): {
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
  readonly padding: number;
  readonly sampleCount: number;
  readonly r32uiBytes: number;
} {
  const [nx, ny, nz] = growthCropSize(crop);
  const sampleCount = nx * ny * nz;
  if (!Number.isSafeInteger(sampleCount) || !Number.isSafeInteger(sampleCount * 4)) {
    fail("compact crop measurement exceeds the safe-integer range");
  }
  return { ...crop, sampleCount, r32uiBytes: sampleCount * 4 };
}

function exactJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function expectedRunBParams(): DecodedGrowthAsset["header"]["config"]["params"] {
  const params = GG_PRESETS.plate;
  const vector = (values: Float64Array): readonly (number | null)[] => [
    null,
    ...Array.from(values.subarray(1)),
  ];
  return {
    rho: params.rho,
    phi: params.phi,
    kappa: vector(params.kappa),
    mu: vector(params.mu),
    ggThreshBeta: vector(params.ggThreshBeta),
  };
}

export function normalizedRunBLegacySourcePath(value: unknown): string {
  const path = nonEmptyString(value, "compact source.legacyComparison.path");
  if (/[\u0000-\u001f\u007f]/u.test(path)) fail("compact source legacy path contains control characters");
  const normalized = path.replace(/\\/gu, "/").replace(/\/+$/u, "");
  const parts = normalized.split("/");
  if (parts.some((part) => part === ".." || part === ".")) {
    fail("compact source legacy path contains a traversal segment");
  }
  if (
    normalized !== RUN_B_LEGACY_SHARE_RELATIVE &&
    !normalized.endsWith(`/${RUN_B_LEGACY_SHARE_RELATIVE}`)
  ) {
    fail("compact source legacy path does not name the Run B share-relative manifest");
  }
  return path;
}

function assertRegisteredRunBSource(value: unknown): void {
  const source = object(value, "compact source");
  exactKeys(
    source,
    ["label", "command", "runtime", "git", "legacyComparison", "endpoint"],
    "compact source",
  );
  if (source["label"] !== "deterministic G-G sparse attachment replay") {
    fail("compact source label differs from the registered Run B baker");
  }
  const legacy = object(source["legacyComparison"], "compact source.legacyComparison");
  const legacyPath = normalizedRunBLegacySourcePath(legacy["path"]);
  const git = object(source["git"], "compact source.git");
  exactKeys(git, ["repositoryRoot", "head", "branch", "dirty", "statusPorcelainV1"], "compact source.git");
  const repositoryRoot = nonEmptyString(git["repositoryRoot"], "compact source.git.repositoryRoot");
  if (
    !isAbsolute(repositoryRoot) ||
    git["head"] !== RUN_B_GIT_HEAD ||
    git["branch"] !== "explore/education-ch1-video" ||
    git["dirty"] !== false ||
    !Array.isArray(git["statusPorcelainV1"]) ||
    git["statusPorcelainV1"].length !== 0
  ) {
    fail("compact source git identity differs from the clean registered Run B launch tree");
  }
  const normalizedRepository = repositoryRoot.replace(/\\/gu, "/").replace(/\/+$/u, "");
  const command = object(source["command"], "compact source.command");
  exactKeys(command, ["executable", "script", "argv", "cwd"], "compact source.command");
  const executable = nonEmptyString(command["executable"], "compact source.command.executable");
  if (
    !isAbsolute(executable) ||
    (basename(executable) !== "node" && basename(executable).toLowerCase() !== "node.exe") ||
    String(command["script"]).replace(/\\/gu, "/") !== `${normalizedRepository}/scripts/gutcheck-bake-growth.ts` ||
    String(command["cwd"]).replace(/\\/gu, "/").replace(/\/+$/u, "") !== normalizedRepository ||
    !exactJson(command["argv"], expectedRunBBakeArgv(legacyPath))
  ) {
    fail("compact source command differs from the registered Run B launch");
  }
  const runtime = object(source["runtime"], "compact source.runtime");
  exactKeys(runtime, ["node", "v8", "platform", "architecture", "endianness"], "compact source.runtime");
  if (
    runtime["node"] !== "v24.13.1" ||
    runtime["v8"] !== "13.6.233.17-node.40" ||
    runtime["platform"] !== "darwin" ||
    runtime["architecture"] !== "arm64" ||
    runtime["endianness"] !== "LE"
  ) {
    fail("compact source runtime differs from the registered Run B engine");
  }
}

export function assertExactRunBGrowth(growth: DecodedGrowthAsset): void {
  const { header } = growth;
  const { config, crop } = header;
  const expectedCenter = domainCenter({ nx: 1200, ny: 1200, nz: 48 });
  if (
    config.preset !== "plate" ||
    config.dims.nx !== 1200 ||
    config.dims.ny !== 1200 ||
    config.dims.nz !== 48 ||
    config.domain !== "hexPrism" ||
    config.tickCap !== 70_000 ||
    config.rngSeed !== 1 ||
    config.noiseEpsilon !== 0 ||
    config.farField !== "reflecting" ||
    config.seedRadius !== 2 ||
    config.seedThickness !== 1 ||
    !exactJson(config.center, expectedCenter) ||
    !exactJson(config.params, expectedRunBParams()) ||
    !exactJson(header.lattice, GUTCHECK_GROWTH_LATTICE) ||
    header.finalTick !== 70_000 ||
    header.terminationReason !== "tick-cap" ||
    header.seedCount !== 19 ||
    header.eventCount !== 961_597 ||
    header.attachedCount !== header.eventCount ||
    crop.iMin !== 304 || crop.iMax !== 896 ||
    crop.jMin !== 304 || crop.jMax !== 896 ||
    crop.kMin !== 16 || crop.kMax !== 32 ||
    crop.padding !== 2
  ) {
    fail("comparison-v1 accepts only the exact measured Run B compact replay");
  }
  assertRegisteredRunBSource(header.source);
}

export async function buildGrowthComparisonRecord(
  options: GrowthComparisonBuildOptions,
): Promise<GrowthComparisonRecord> {
  for (let index = 0; index < EXPECTED_POSTER_TIMES.length; index++) {
    if (options.posters[index].videoTimeSeconds !== EXPECTED_POSTER_TIMES[index]) {
      fail(`poster ${index} video time must be exactly ${EXPECTED_POSTER_TIMES[index]}`);
    }
  }

  const growthFile = captureRegularFile(options.growthAssetPath, "compact growth asset");
  const growth = decodeGrowthAsset(growthFile.contents);
  assertExactRunBGrowth(growth);
  const raw = loadLegacyManifest(options.rawManifestPath, "raw legacy", growth);
  const v2q = loadLegacyManifest(options.v2qManifestPath, "v2q legacy", growth);
  assertMeasuredRunBManifestOnDetectedShare(raw.descriptor.path, RUN_B_LEGACY_SHARE_RELATIVE, "raw");
  assertMeasuredRunBManifestOnDetectedShare(v2q.descriptor.path, RUN_B_V2Q_SHARE_RELATIVE, "v2q");
  if (
    raw.descriptor.sha256 !== RUN_B_MANIFEST_SHA256 ||
    raw.descriptor.bytes !== RUN_B_MANIFEST_BYTES ||
    raw.parsed.elapsedSeconds !== RUN_B_RAW_SECONDS
  ) {
    fail("raw manifest bytes, digest, or runtime differ from the pinned Run B source");
  }
  if (raw.descriptor.sha256 !== v2q.descriptor.sha256 || !sameLegacyManifest(raw.parsed, v2q.parsed)) {
    fail("raw and v2q manifests must be byte-identical descriptions of one Run B timeline");
  }
  const sourceIdentity = deriveGrowthSourceIdentity(growth, raw.descriptor.sha256, raw.parsed.frames.length);
  if (
    sourceIdentity.manifestSha256 !== RUN_B_MANIFEST_SHA256 ||
    sourceIdentity.occupancySha256 !== RUN_B_OCCUPANCY_SHA256
  ) {
    fail("decoded compact source identity differs from the pinned Run B identity");
  }

  const compactLog = captureRegularFile(options.compactLogPath, "compact bake log");
  const bakeElapsedSeconds = parseCompactBakeElapsedSeconds(
    compactLog.contents,
    growth.header.finalTick,
    growth.header.eventCount,
  );
  const rawFrameBytes = measureLegacyFrames(raw, "raw legacy", "raw");
  const v2qFrameBytes = measureLegacyFrames(v2q, "v2q legacy", "v2q");
  if (rawFrameBytes !== RUN_B_RAW_FRAME_BYTES || v2qFrameBytes !== RUN_B_V2Q_FRAME_BYTES) {
    fail("measured legacy frame-byte totals differ from the pinned Run B sequences");
  }

  const video = measureRegularFile(options.derivedVideoPath, "derived video");
  if (video.bytes !== RUN_B_VIDEO_BYTES || video.sha256 !== RUN_B_VIDEO_SHA256) {
    fail("derived video bytes or digest differ from the pinned Run B viewing derivative");
  }
  const metadata = probeVideoFile(video.path);
  positiveFinite(metadata.durationSeconds, "probed video duration");
  safeInteger(metadata.frameCount, 1, Number.MAX_SAFE_INTEGER, "probed video frame count");
  if (metadata.durationSeconds !== RUN_B_VIDEO_SECONDS || metadata.frameCount !== RUN_B_VIDEO_FRAMES) {
    fail("ffprobe duration or decoded frame count differs from the pinned Run B viewing derivative");
  }
  const posterDescriptors = options.posters.map((poster, index) =>
    measureRegularFile(poster.path, `poster ${index}`),
  ) as [MeasuredRegularFile, MeasuredRegularFile, MeasuredRegularFile];
  for (let index = 0; index < options.posters.length; index++) {
    verifyPosterMatchesVideoFrame(
      video.path,
      options.posters[index].path,
      options.posters[index].videoTimeSeconds,
      metadata,
    );
  }

  const midpoint = growth.header.finalTick / 2;
  if (!Number.isSafeInteger(midpoint)) fail("compact Run B tick range has no integer midpoint");
  const posterTicks = [0, midpoint, growth.header.finalTick] as const;
  const posterAlts = [
    "Run B seed at tick zero",
    `Run B growth at tick ${midpoint}`,
    `Run B final state at tick ${growth.header.finalTick}`,
  ] as const;
  const posters = options.posters.map((poster, index) => ({
    tick: posterTicks[index]!,
    videoTimeSeconds: poster.videoTimeSeconds,
    url: poster.url,
    bytes: posterDescriptors[index]!.bytes,
    sha256: posterDescriptors[index]!.sha256,
    alt: posterAlts[index]!,
  })) as unknown as GrowthComparisonPosterReferences;

  const lightweightBytes = video.bytes + posterDescriptors.reduce((sum, descriptor) => sum + descriptor.bytes, 0);
  if (!Number.isSafeInteger(lightweightBytes)) fail("lightweight media bytes exceed the safe-integer range");
  const rawTotal = rawFrameBytes + raw.descriptor.bytes;
  const v2qTotal = v2qFrameBytes + v2q.descriptor.bytes;
  if (!Number.isSafeInteger(rawTotal) || !Number.isSafeInteger(v2qTotal)) {
    fail("legacy sequence byte total exceeds the safe-integer range");
  }
  const runConfig = raw.parsed.config;
  const candidate = {
    format: GUTCHECK_GROWTH_COMPARISON_FORMAT,
    recordedAt: options.recordedAt ?? new Date().toISOString(),
    run: {
      label: "Run B — G-G plate",
      preset: runConfig.preset,
      dims: runConfig.dims,
      domain: runConfig.domain,
      rngSeed: runConfig.seed,
      noiseEpsilon: runConfig.noise,
      firstTick: 0,
      finalTick: runConfig.ticks,
      tickInterval: runConfig.every,
    },
    legacy: {
      format: "gutcheck-anim-v1",
      sourceIdentity,
      rawSequence: {
        frameBytes: rawFrameBytes,
        manifestBytes: raw.descriptor.bytes,
        totalBytes: rawTotal,
        frameCount: raw.parsed.frames.length,
        generationSeconds: raw.parsed.elapsedSeconds,
      },
      v2qSequence: {
        frameBytes: v2qFrameBytes,
        manifestBytes: v2q.descriptor.bytes,
        totalBytes: v2qTotal,
        frameCount: v2q.parsed.frames.length,
        generationSeconds: RUN_B_V2Q_SECONDS,
      },
      lightweightMedia: {
        totalBytes: lightweightBytes,
        posters,
        derivedVideo: {
          url: options.derivedVideoUrl,
          bytes: video.bytes,
          sha256: video.sha256,
          durationSeconds: metadata.durationSeconds,
          frameCount: metadata.frameCount,
        },
      },
    },
    compact: {
      format: "gutcheck-growth-v1",
      sourceIdentity,
      asset: {
        url: options.compactAssetUrl,
        bytes: growthFile.bytes,
        sha256: growthFile.sha256,
      },
      bakeElapsedSeconds,
      eventCount: growth.header.eventCount,
      firstTick: 0,
      finalTick: growth.header.finalTick,
      crop: cropMeasurement(growth.header.crop),
    },
  };
  return decodeGrowthComparisonRecord(candidate);
}

function ensureOutputParent(path: string): string {
  const absolutePath = resolve(path);
  const parent = dirname(absolutePath);
  mkdirSync(parent, { recursive: true });
  if (!statSync(parent).isDirectory()) fail(`output parent is not a directory: ${parent}`);
  return absolutePath;
}

export function assertGrowthComparisonOutputVacant(path: string): string {
  const absolutePath = ensureOutputParent(path);
  try {
    lstatSync(absolutePath);
    fail(`refusing to overwrite existing output: ${absolutePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return absolutePath;
}

export function publishGrowthComparisonNoClobber(path: string, record: GrowthComparisonRecord): string {
  const validated = decodeGrowthComparisonRecord(record);
  const bytes = Buffer.from(`${JSON.stringify(validated, null, 2)}\n`, "utf8");
  const absolutePath = ensureOutputParent(path);
  const parent = dirname(absolutePath);
  let temporary = "";
  let descriptor: number | null = null;
  try {
    for (let attempt = 0; attempt < 16; attempt++) {
      temporary = resolve(parent, `.${basename(absolutePath)}.comparison-tmp-${process.pid}-${randomBytes(8).toString("hex")}`);
      try {
        descriptor = openSync(temporary, "wx", 0o644);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    if (descriptor === null) fail("could not allocate an exclusive comparison-record temporary");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    linkSync(temporary, absolutePath);
    unlinkSync(temporary);
    temporary = "";
    return absolutePath;
  } finally {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {
        // Preserve the original publication error and continue to safe temporary cleanup.
      }
    }
    if (temporary !== "" && existsSync(temporary)) {
      try {
        unlinkSync(temporary);
      } catch {
        // Never risk deleting the no-clobber destination while handling temporary cleanup.
      }
    }
  }
}

function parseCliNumber(text: string, label: string, allowZero: boolean): number {
  if (!FINITE_TEXT.test(text)) fail(`${label} must be an explicit finite base-10 number`);
  const value = Number(text);
  return finiteNumber(value, allowZero ? 0 : Number.MIN_VALUE, Number.MAX_SAFE_INTEGER, label);
}

export function parseGrowthComparisonCli(argv: readonly string[]): GrowthComparisonCli {
  const values = new Map<string, string>();
  const allowed = new Set([
    "--growth-asset",
    "--compact-log",
    "--raw-manifest",
    "--v2q-manifest",
    "--derived-video",
    "--derived-video-url",
    "--poster-start-file",
    "--poster-start-url",
    "--poster-start-time",
    "--poster-mid-file",
    "--poster-mid-url",
    "--poster-mid-time",
    "--poster-final-file",
    "--poster-final-url",
    "--poster-final-time",
    "--compact-asset-url",
    "--out",
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const option = argv[index];
    const value = argv[index + 1];
    if (option === undefined || !allowed.has(option)) fail(`unknown option: ${String(option)}`);
    if (values.has(option)) fail(`duplicate option: ${option}`);
    if (value === undefined || value.startsWith("--")) fail(`${option} wants a value`);
    values.set(option, value);
  }
  const required = (option: string): string => {
    const value = values.get(option);
    if (value === undefined || value === "") fail(`${option} is required`);
    return value;
  };
  const times = [
    parseCliNumber(required("--poster-start-time"), "--poster-start-time", true),
    parseCliNumber(required("--poster-mid-time"), "--poster-mid-time", true),
    parseCliNumber(required("--poster-final-time"), "--poster-final-time", true),
  ] as const;
  for (let index = 0; index < times.length; index++) {
    if (times[index] !== EXPECTED_POSTER_TIMES[index]) {
      fail(`poster ${index} video time must be exactly ${EXPECTED_POSTER_TIMES[index]}`);
    }
  }
  return {
    growthAssetPath: required("--growth-asset"),
    compactLogPath: required("--compact-log"),
    rawManifestPath: required("--raw-manifest"),
    v2qManifestPath: required("--v2q-manifest"),
    derivedVideoPath: required("--derived-video"),
    derivedVideoUrl: required("--derived-video-url"),
    posters: [
      { path: required("--poster-start-file"), url: required("--poster-start-url"), videoTimeSeconds: times[0] },
      { path: required("--poster-mid-file"), url: required("--poster-mid-url"), videoTimeSeconds: times[1] },
      { path: required("--poster-final-file"), url: required("--poster-final-url"), videoTimeSeconds: times[2] },
    ],
    compactAssetUrl: required("--compact-asset-url"),
    outputPath: required("--out"),
  };
}

export async function runGrowthComparisonCli(argv: readonly string[] = process.argv.slice(2)): Promise<GrowthComparisonRecord> {
  const cli = parseGrowthComparisonCli(argv);
  const outputPath = assertGrowthComparisonOutputVacant(cli.outputPath);
  const record = await buildGrowthComparisonRecord(cli);
  publishGrowthComparisonNoClobber(outputPath, record);
  console.log(
    `growth comparison complete: compactBytes=${record.compact.asset.bytes} ` +
      `rawBytes=${record.legacy.rawSequence.totalBytes} v2qBytes=${record.legacy.v2qSequence.totalBytes} ` +
      `events=${record.compact.eventCount} -> ${outputPath}`,
  );
  return record;
}

const invokedPath = process.argv[1] === undefined ? null : resolve(process.argv[1]);
if (invokedPath !== null && invokedPath === fileURLToPath(import.meta.url)) {
  runGrowthComparisonCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
