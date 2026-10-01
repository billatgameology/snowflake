// Deterministic sparse attachment-history baker for the gutcheck growth replay.
//
// This is deliberately a replay of the permanent float64 CPU oracle, not a second growth
// implementation. Tick-zero records are the canonical G-G seed; every later record comes from
// GGSolver.lastAttached at its completed tick. Per-tick count deltas and an independently rebuilt
// final occupancy close that observation seam before publication. The browser-safe codec in app/
// owns the bytes.
//
//   node scripts/gutcheck-bake-growth.ts --preset plate --dims 1200,1200,48 \
//     --ticks 70000 --out out/gutcheck-growth/plate-70000.bin \
//     [--domain hexPrism] [--seed 1] [--noise 0] [--padding 2] [--progress 1000] \
//     [--legacy-manifest /path/to/manifest.json] \
//     [--expected-attached-count 961597] [--expected-occupancy-sha256 <hex>]

import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { endianness } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GG_PRESETS,
  domainCenter,
  hexSeedSites,
  type Dims,
  type DomainShape,
  type GGPresetName,
  type GGParams,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";

import {
  GUTCHECK_GROWTH_FORMAT,
  GUTCHECK_GROWTH_LATTICE,
  GUTCHECK_GROWTH_MAX_TICK,
  GUTCHECK_GROWTH_MIN_PADDING,
  buildPaddedGrowthCrop,
  encodeGrowthAsset,
  type GrowthHeaderV1,
  type GrowthParamsJson,
  type GrowthSourceProvenance,
} from "../app/src/gutcheck-growth-format.ts";

const UINT32_MAX = 0xffff_ffff;
const CANONICAL_SEED_RADIUS = 2;
const CANONICAL_SEED_THICKNESS = 1;
const DEFAULT_DOMAIN: DomainShape = "hexPrism";
const DEFAULT_RNG_SEED = 1;
const DEFAULT_NOISE_EPSILON = 0;
const DEFAULT_PROGRESS_EVERY = 1000;

export interface GrowthBakeCli {
  readonly preset: GGPresetName;
  readonly dims: Dims;
  readonly tickCap: number;
  readonly outputPath: string;
  readonly domain: DomainShape;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly padding: number;
  readonly progressEvery: number;
  readonly legacyManifestPath: string | null;
  readonly expectedAttachedCount: number | null;
  readonly expectedOccupancySha256: string | null;
}

export interface LegacyGrowthFrame {
  readonly tick: number;
  readonly attachedCount: number;
}

export interface LegacyGrowthChecks {
  readonly format: "gutcheck-anim-v1";
  readonly complete: true;
  readonly frames: readonly LegacyGrowthFrame[];
}

export interface GrowthReplaySpec {
  readonly preset: GGPresetName;
  readonly dims: Dims;
  readonly tickCap: number;
  readonly domain: DomainShape;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly padding: number;
  readonly source: GrowthSourceProvenance;
  readonly legacyChecks?: LegacyGrowthChecks;
  readonly expectedAttachedCount?: number | null;
  readonly expectedOccupancySha256?: string | null;
  readonly progressEvery?: number;
  readonly onProgress?: (progress: GrowthReplayProgress) => void;
}

export interface GrowthReplayProgress {
  readonly tick: number;
  readonly tickCap: number;
  readonly attachedCount: number;
  readonly eventCount: number;
  readonly elapsedSeconds: number;
}

export interface GrowthReplayResult {
  readonly bytes: Uint8Array;
  readonly header: GrowthHeaderV1;
  readonly flatIndices: Uint32Array;
  readonly attachTicks: Uint32Array;
  readonly finalOccupancySha256: string;
}

interface LegacyManifestConfig {
  readonly preset: GGPresetName;
  readonly dims: Dims;
  readonly tickCap: number;
  readonly domain: DomainShape;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
}

interface LoadedLegacyManifest {
  readonly checks: LegacyGrowthChecks;
  readonly provenance: {
    readonly path: string;
    readonly sha256: string;
    readonly frameCount: number;
  };
}

function fail(message: string): never {
  throw new Error(`gutcheck growth baker: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeInteger(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} must be an integer in [${min}, ${max}]`);
  }
  return value as number;
}

function finiteNumber(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    fail(`${label} must be finite and in [${min}, ${max}]`);
  }
  return value;
}

function parseInteger(text: string, min: number, max: number, label: string): number {
  if (!/^(?:0|[1-9][0-9]*)$/u.test(text)) fail(`${label} must be a base-10 integer`);
  return safeInteger(Number(text), min, max, label);
}

function parseDims(text: string): Dims {
  const parts = text.split(",");
  if (parts.length !== 3) fail("--dims wants nx,ny,nz");
  const [nxText, nyText, nzText] = parts as [string, string, string];
  const dims = {
    nx: parseInteger(nxText, 8, UINT32_MAX, "--dims nx"),
    ny: parseInteger(nyText, 8, UINT32_MAX, "--dims ny"),
    nz: parseInteger(nzText, 8, UINT32_MAX, "--dims nz"),
  };
  const cells = dims.nx * dims.ny * dims.nz;
  if (!Number.isSafeInteger(cells) || cells > UINT32_MAX + 1) {
    fail("--dims lattice must contain at most 2^32 cells");
  }
  return dims;
}

export function parseGrowthBakeCli(argv: readonly string[]): GrowthBakeCli {
  let preset: GGPresetName | null = null;
  let dims: Dims | null = null;
  let tickCap: number | null = null;
  let outputPath: string | null = null;
  let domain: DomainShape = DEFAULT_DOMAIN;
  let rngSeed = DEFAULT_RNG_SEED;
  let noiseEpsilon = DEFAULT_NOISE_EPSILON;
  let padding = GUTCHECK_GROWTH_MIN_PADDING;
  let progressEvery = DEFAULT_PROGRESS_EVERY;
  let legacyManifestPath: string | null = null;
  let expectedAttachedCount: number | null = null;
  let expectedOccupancySha256: string | null = null;
  const seen = new Set<string>();

  for (let index = 0; index < argv.length; index++) {
    const option = argv[index]!;
    if (!option.startsWith("--")) fail(`unexpected positional argument: ${option}`);
    if (seen.has(option)) fail(`duplicate option: ${option}`);
    seen.add(option);
    const next = (): string => {
      const value = argv[++index];
      if (value === undefined || value.startsWith("--")) fail(`${option} wants a value`);
      return value;
    };
    switch (option) {
      case "--preset": {
        const value = next();
        if (!(value in GG_PRESETS)) fail(`unknown preset: ${value}`);
        preset = value as GGPresetName;
        break;
      }
      case "--dims":
        dims = parseDims(next());
        break;
      case "--ticks":
        tickCap = parseInteger(next(), 1, GUTCHECK_GROWTH_MAX_TICK, "--ticks");
        break;
      case "--out": {
        const value = next();
        if (value.trim() === "" || value.includes("\0")) fail("--out must be a non-empty path");
        outputPath = value;
        break;
      }
      case "--domain": {
        const value = next();
        if (value !== "box" && value !== "hexPrism") fail(`unknown domain: ${value}`);
        domain = value;
        break;
      }
      case "--seed":
        rngSeed = parseInteger(next(), 0, UINT32_MAX, "--seed");
        break;
      case "--noise": {
        const text = next();
        if (text.trim() === "") fail("--noise wants a numeric value");
        const value = Number(text);
        noiseEpsilon = finiteNumber(value, 0, 1, "--noise");
        break;
      }
      case "--padding":
        padding = parseInteger(next(), GUTCHECK_GROWTH_MIN_PADDING, UINT32_MAX, "--padding");
        break;
      case "--progress":
        progressEvery = parseInteger(next(), 0, UINT32_MAX, "--progress");
        break;
      case "--legacy-manifest":
        legacyManifestPath = next();
        if (legacyManifestPath.trim() === "" || legacyManifestPath.includes("\0")) {
          fail("--legacy-manifest must be a non-empty path");
        }
        break;
      case "--expected-attached-count":
        expectedAttachedCount = parseInteger(next(), 1, UINT32_MAX, "--expected-attached-count");
        break;
      case "--expected-occupancy-sha256": {
        const value = next().toLowerCase();
        if (!/^[0-9a-f]{64}$/u.test(value)) {
          fail("--expected-occupancy-sha256 must contain exactly 64 hexadecimal digits");
        }
        expectedOccupancySha256 = value;
        break;
      }
      default:
        fail(`unknown option: ${option}`);
    }
  }

  if (preset === null) fail("--preset is required");
  if (dims === null) fail("--dims is required");
  if (tickCap === null) fail("--ticks is required");
  if (outputPath === null) fail("--out is required");
  return {
    preset,
    dims,
    tickCap,
    outputPath,
    domain,
    rngSeed,
    noiseEpsilon,
    padding,
    progressEvery,
    legacyManifestPath,
    expectedAttachedCount,
    expectedOccupancySha256,
  };
}

function manifestInteger(value: unknown, label: string, min = 0): number {
  return safeInteger(value, min, UINT32_MAX, label);
}

function manifestConfig(value: unknown): LegacyManifestConfig {
  if (!isRecord(value)) fail("legacy manifest config must be an object");
  const preset = value["preset"];
  if (typeof preset !== "string" || !(preset in GG_PRESETS)) {
    fail("legacy manifest config.preset is not recognized");
  }
  const dimsValue = value["dims"];
  if (!isRecord(dimsValue)) fail("legacy manifest config.dims must be an object");
  const dims = {
    nx: manifestInteger(dimsValue["nx"], "legacy manifest config.dims.nx", 1),
    ny: manifestInteger(dimsValue["ny"], "legacy manifest config.dims.ny", 1),
    nz: manifestInteger(dimsValue["nz"], "legacy manifest config.dims.nz", 1),
  };
  const domain = value["domain"];
  if (domain !== "box" && domain !== "hexPrism") {
    fail("legacy manifest config.domain must be box or hexPrism");
  }
  const seedRadius = value["seedRadius"];
  if (seedRadius !== undefined && seedRadius !== CANONICAL_SEED_RADIUS) {
    fail(`legacy manifest seedRadius must be ${CANONICAL_SEED_RADIUS}`);
  }
  const seedThickness = value["seedThickness"];
  if (seedThickness !== undefined && seedThickness !== CANONICAL_SEED_THICKNESS) {
    fail(`legacy manifest seedThickness must be ${CANONICAL_SEED_THICKNESS}`);
  }
  return {
    preset: preset as GGPresetName,
    dims,
    domain,
    tickCap: safeInteger(
      value["ticks"],
      1,
      GUTCHECK_GROWTH_MAX_TICK,
      "legacy manifest config.ticks",
    ),
    rngSeed: manifestInteger(value["seed"], "legacy manifest config.seed"),
    noiseEpsilon: finiteNumber(value["noise"], 0, 1, "legacy manifest config.noise"),
  };
}

function sameDims(left: Dims, right: Dims): boolean {
  return left.nx === right.nx && left.ny === right.ny && left.nz === right.nz;
}

export function parseLegacyGrowthManifest(
  value: unknown,
  expected: LegacyManifestConfig,
): LegacyGrowthChecks {
  if (!isRecord(value)) fail("legacy manifest must be an object");
  if (value["format"] !== "gutcheck-anim-v1") fail("legacy manifest format must be gutcheck-anim-v1");
  if (value["complete"] !== true) fail("legacy manifest must be complete");
  const config = manifestConfig(value["config"]);
  if (
    config.preset !== expected.preset ||
    !sameDims(config.dims, expected.dims) ||
    config.domain !== expected.domain ||
    config.tickCap !== expected.tickCap ||
    config.rngSeed !== expected.rngSeed ||
    config.noiseEpsilon !== expected.noiseEpsilon
  ) {
    fail("legacy manifest configuration differs from the requested replay");
  }
  const framesValue = value["frames"];
  if (!Array.isArray(framesValue) || framesValue.length < 2) {
    fail("legacy manifest frames must contain tick zero and the final tick");
  }
  const frames: LegacyGrowthFrame[] = [];
  let previousTick = -1;
  let previousCount = -1;
  for (let index = 0; index < framesValue.length; index++) {
    const frame = framesValue[index];
    if (!isRecord(frame)) fail(`legacy manifest frame ${index} must be an object`);
    const tick = safeInteger(
      frame["tick"],
      0,
      GUTCHECK_GROWTH_MAX_TICK,
      `legacy manifest frame ${index}.tick`,
    );
    const attachedCount = manifestInteger(
      frame["attachedCount"],
      `legacy manifest frame ${index}.attachedCount`,
      1,
    );
    if (tick <= previousTick) fail("legacy manifest frame ticks must be strictly increasing");
    if (attachedCount < previousCount) fail("legacy manifest attached counts must be non-decreasing");
    if (tick > expected.tickCap) fail("legacy manifest frame tick exceeds the requested tick cap");
    frames.push({ tick, attachedCount });
    previousTick = tick;
    previousCount = attachedCount;
  }
  if (frames[0]!.tick !== 0) fail("legacy manifest first frame must be tick zero");
  if (frames.at(-1)!.tick !== expected.tickCap) {
    fail("legacy manifest final frame must equal the requested tick cap");
  }
  return { format: "gutcheck-anim-v1", complete: true, frames };
}

export function sha256Hex(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function assertGrowthAttachmentBatch(
  tick: number,
  attachedBefore: number,
  attachedAfter: number,
  attachedThisTick: ArrayLike<number>,
): void {
  safeInteger(tick, 1, GUTCHECK_GROWTH_MAX_TICK, "attachment batch tick");
  safeInteger(attachedBefore, 0, UINT32_MAX, "attachment count before tick");
  safeInteger(attachedAfter, 0, UINT32_MAX, "attachment count after tick");
  if (!Number.isSafeInteger(attachedThisTick.length) || attachedThisTick.length < 0) {
    fail("attachment batch length must be a non-negative safe integer");
  }
  const delta = attachedAfter - attachedBefore;
  if (delta < 0) fail(`solver attached count decreased at tick ${tick}`);
  if (attachedThisTick.length !== delta) {
    fail(
      `lastAttached length ${attachedThisTick.length} differs from attached-count delta ${delta} ` +
        `at tick ${tick}`,
    );
  }
}

/** Rebuild the final binary a-field from events and bind it to both solver and expected bytes. */
export function verifyGrowthEventOccupancy(
  solverOccupancy: Uint8Array,
  flatIndices: ArrayLike<number>,
  expectedOccupancySha256?: string | null,
): string {
  if (!(solverOccupancy instanceof Uint8Array) || solverOccupancy.length < 1) {
    fail("solver occupancy must be a non-empty Uint8Array");
  }
  if (!Number.isSafeInteger(flatIndices.length) || flatIndices.length < 1) {
    fail("event indices must have a positive safe-integer length");
  }
  const eventOccupancy = new Uint8Array(solverOccupancy.length);
  for (let event = 0; event < flatIndices.length; event++) {
    const index = safeInteger(
      flatIndices[event],
      0,
      solverOccupancy.length - 1,
      `event occupancy index ${event}`,
    );
    if (eventOccupancy[index] !== 0) {
      fail(`event occupancy contains duplicate index ${index}`);
    }
    eventOccupancy[index] = 1;
  }
  const eventSha256 = sha256Hex(eventOccupancy);
  const solverSha256 = sha256Hex(solverOccupancy);
  if (eventSha256 !== solverSha256) {
    fail(
      `event-derived final occupancy SHA-256 ${eventSha256} differs from solver ${solverSha256}`,
    );
  }
  const expectedSha256 = normalizedExpectedSha256(expectedOccupancySha256);
  if (expectedSha256 !== null && eventSha256 !== expectedSha256) {
    fail(`final occupancy SHA-256 mismatch: expected ${expectedSha256}, got ${eventSha256}`);
  }
  return eventSha256;
}

function loadLegacyGrowthManifest(path: string, expected: LegacyManifestConfig): LoadedLegacyManifest {
  const absolutePath = resolve(path);
  const bytes = readFileSync(absolutePath);
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail(`legacy manifest is not valid JSON: ${absolutePath}`);
  }
  const checks = parseLegacyGrowthManifest(value, expected);
  return {
    checks,
    provenance: {
      path: absolutePath,
      sha256: sha256Hex(bytes),
      frameCount: checks.frames.length,
    },
  };
}

function jsonParamVector(values: Float64Array): readonly (number | null)[] {
  if (values.length !== 8) fail("G-G parameter vector must contain eight slots");
  return [null, ...Array.from(values.subarray(1))];
}

export function growthParamsJson(params: GGParams): GrowthParamsJson {
  return {
    rho: params.rho,
    phi: params.phi,
    kappa: jsonParamVector(params.kappa),
    mu: jsonParamVector(params.mu),
    ggThreshBeta: jsonParamVector(params.ggThreshBeta),
  };
}

function checkLegacyFrame(
  legacy: LegacyGrowthChecks | undefined,
  frameIndex: number,
  tick: number,
  attachedCount: number,
): number {
  if (legacy === undefined || frameIndex >= legacy.frames.length) return frameIndex;
  const frame = legacy.frames[frameIndex]!;
  if (frame.tick !== tick) return frameIndex;
  if (frame.attachedCount !== attachedCount) {
    fail(
      `legacy attached-count mismatch at tick ${tick}: expected ${frame.attachedCount}, got ${attachedCount}`,
    );
  }
  return frameIndex + 1;
}

function normalizedExpectedSha256(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const lowered = value.toLowerCase();
  if (!/^[0-9a-f]{64}$/u.test(lowered)) fail("expected occupancy SHA-256 must be 64 hexadecimal digits");
  return lowered;
}

export function collectGrowthReplay(spec: GrowthReplaySpec): GrowthReplayResult {
  if (!(spec.preset in GG_PRESETS)) fail(`unknown replay preset: ${String(spec.preset)}`);
  safeInteger(spec.tickCap, 1, GUTCHECK_GROWTH_MAX_TICK, "tick cap");
  safeInteger(spec.rngSeed, 0, UINT32_MAX, "RNG seed");
  finiteNumber(spec.noiseEpsilon, 0, 1, "noise epsilon");
  safeInteger(spec.padding, GUTCHECK_GROWTH_MIN_PADDING, UINT32_MAX, "crop padding");
  const progressEvery = spec.progressEvery ?? 0;
  safeInteger(progressEvery, 0, UINT32_MAX, "progress interval");
  if (spec.domain !== "box" && spec.domain !== "hexPrism") fail("domain must be box or hexPrism");
  if (Object.hasOwn(spec.source, "endpoint")) fail("source.endpoint is reserved by the baker");
  const expectedSha256 = normalizedExpectedSha256(spec.expectedOccupancySha256);
  const expectedCount = spec.expectedAttachedCount ?? null;
  if (expectedCount !== null) safeInteger(expectedCount, 1, UINT32_MAX, "expected attached count");

  const params = GG_PRESETS[spec.preset];
  const center = domainCenter(spec.dims);
  const solver = new GGSolver({
    dims: spec.dims,
    params,
    rngSeed: spec.rngSeed,
    noiseEpsilon: spec.noiseEpsilon,
    domain: spec.domain,
    farField: "reflecting",
    seedRadius: CANONICAL_SEED_RADIUS,
    seedThickness: CANONICAL_SEED_THICKNESS,
    center,
  });
  const seedIndices = hexSeedSites(
    spec.dims,
    CANONICAL_SEED_RADIUS,
    CANONICAL_SEED_THICKNESS,
    center,
  ).sort((left, right) => left - right);
  if (solver.attachedCount !== seedIndices.length) {
    fail(`canonical seed count mismatch: solver has ${solver.attachedCount}, expected ${seedIndices.length}`);
  }
  for (const index of seedIndices) {
    if (solver.a[index] !== 1) fail(`canonical seed site ${index} is not attached at tick zero`);
  }

  const flatIndices: number[] = [...seedIndices];
  const attachTicks: number[] = seedIndices.map(() => 0);
  let legacyFrame = checkLegacyFrame(spec.legacyChecks, 0, 0, solver.attachedCount);
  const started = Date.now();

  for (let tick = 1; tick <= spec.tickCap; tick++) {
    const attachedBefore = solver.attachedCount;
    solver.step();
    if (solver.tick !== tick) fail(`solver tick mismatch after requested tick ${tick}`);
    const attachedThisTick = [...solver.lastAttached].sort((left, right) => left - right);
    assertGrowthAttachmentBatch(tick, attachedBefore, solver.attachedCount, attachedThisTick);
    for (let batchIndex = 0; batchIndex < attachedThisTick.length; batchIndex++) {
      const index = attachedThisTick[batchIndex]!;
      if (batchIndex > 0 && index === attachedThisTick[batchIndex - 1]) {
        fail(`solver reported duplicate lastAttached index ${index} at tick ${tick}`);
      }
      flatIndices.push(index);
      attachTicks.push(tick);
    }
    legacyFrame = checkLegacyFrame(spec.legacyChecks, legacyFrame, tick, solver.attachedCount);
    if (
      spec.onProgress !== undefined &&
      progressEvery > 0 &&
      (tick % progressEvery === 0 || tick === spec.tickCap)
    ) {
      spec.onProgress({
        tick,
        tickCap: spec.tickCap,
        attachedCount: solver.attachedCount,
        eventCount: flatIndices.length,
        elapsedSeconds: (Date.now() - started) / 1000,
      });
    }
  }

  if (spec.legacyChecks !== undefined && legacyFrame !== spec.legacyChecks.frames.length) {
    fail(`only ${legacyFrame} of ${spec.legacyChecks.frames.length} legacy frame counts were checked`);
  }
  if (flatIndices.length !== solver.attachedCount || attachTicks.length !== solver.attachedCount) {
    fail(
      `event count ${flatIndices.length} differs from solver attached count ${solver.attachedCount}`,
    );
  }
  if (expectedCount !== null && solver.attachedCount !== expectedCount) {
    fail(`final attached-count mismatch: expected ${expectedCount}, got ${solver.attachedCount}`);
  }
  const finalOccupancySha256 = verifyGrowthEventOccupancy(
    solver.a,
    flatIndices,
    expectedSha256,
  );

  const flatIndexColumn = Uint32Array.from(flatIndices);
  const attachTickColumn = Uint32Array.from(attachTicks);
  const header: GrowthHeaderV1 = {
    format: GUTCHECK_GROWTH_FORMAT,
    eventCount: solver.attachedCount,
    attachedCount: solver.attachedCount,
    seedCount: seedIndices.length,
    finalTick: solver.tick,
    terminationReason: "tick-cap",
    config: {
      preset: spec.preset,
      dims: spec.dims,
      domain: spec.domain,
      tickCap: spec.tickCap,
      rngSeed: spec.rngSeed,
      noiseEpsilon: spec.noiseEpsilon,
      farField: "reflecting",
      seedRadius: CANONICAL_SEED_RADIUS,
      seedThickness: CANONICAL_SEED_THICKNESS,
      center,
      params: growthParamsJson(params),
    },
    lattice: GUTCHECK_GROWTH_LATTICE,
    crop: buildPaddedGrowthCrop(flatIndexColumn, spec.dims, spec.padding),
    source: {
      ...spec.source,
      endpoint: {
        occupancyEncoding: "full-lattice-u8-a-field-i-fastest-j-next-k-slowest",
        measuredAttachedCount: solver.attachedCount,
        measuredOccupancySha256: finalOccupancySha256,
        expectedAttachedCount: expectedCount,
        expectedOccupancySha256: expectedSha256,
      },
    },
  };
  const bytes = encodeGrowthAsset(header, {
    flatIndices: flatIndexColumn,
    attachTicks: attachTickColumn,
  });
  return {
    bytes,
    header,
    flatIndices: flatIndexColumn,
    attachTicks: attachTickColumn,
    finalOccupancySha256,
  };
}

function gitText(cwd: string, args: readonly string[], allowFailure = false): string | null {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    if (allowFailure) return null;
    fail(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trimEnd();
}

export function captureGrowthBakeSource(
  argv: readonly string[],
  cwd = process.cwd(),
  legacy: LoadedLegacyManifest | null = null,
): GrowthSourceProvenance {
  const repositoryRoot = gitText(cwd, ["rev-parse", "--show-toplevel"]);
  const head = gitText(cwd, ["rev-parse", "HEAD"]);
  const branch = gitText(cwd, ["symbolic-ref", "--quiet", "--short", "HEAD"], true);
  const statusText = gitText(cwd, ["status", "--porcelain=v1", "--untracked-files=all"]);
  const status = statusText === "" ? [] : statusText!.split("\n");
  return {
    label: "deterministic G-G sparse attachment replay",
    command: {
      executable: process.execPath,
      script: fileURLToPath(import.meta.url),
      argv: [...argv],
      cwd,
    },
    runtime: {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      architecture: process.arch,
      endianness: endianness(),
    },
    git: {
      repositoryRoot,
      head,
      branch,
      dirty: status.length > 0,
      statusPorcelainV1: status,
    },
    legacyComparison: legacy === null ? null : legacy.provenance,
  } as GrowthSourceProvenance;
}

function ensureOutputParent(outputPath: string): string {
  const absolutePath = resolve(outputPath);
  const parent = dirname(absolutePath);
  mkdirSync(parent, { recursive: true });
  if (!statSync(parent).isDirectory()) fail(`output parent is not a directory: ${parent}`);
  return absolutePath;
}

export function assertGrowthOutputVacant(outputPath: string): string {
  const absolutePath = ensureOutputParent(outputPath);
  try {
    lstatSync(absolutePath);
    fail(`refusing to overwrite existing output: ${absolutePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return absolutePath;
}

/**
 * Atomically publishes a completed asset without rename-overwrite semantics. The exclusive
 * same-directory temporary file and final hard link live on one filesystem; linkSync fails with
 * EEXIST if another process wins the output name. Every handled failure removes our temporary.
 */
export function publishGrowthAssetNoClobber(outputPath: string, bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1) fail("published asset must be non-empty bytes");
  const absolutePath = ensureOutputParent(outputPath);
  const parent = dirname(absolutePath);
  const tempPrefix = `.${basename(absolutePath)}.gutcheck-growth-tmp-`;
  let tempPath = "";
  let descriptor: number | null = null;
  try {
    for (let attempt = 0; attempt < 16; attempt++) {
      tempPath = resolve(
        parent,
        `${tempPrefix}${process.pid}-${randomBytes(8).toString("hex")}`,
      );
      try {
        descriptor = openSync(tempPath, "wx", 0o644);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    if (descriptor === null) fail("could not allocate an exclusive publication temporary");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    linkSync(tempPath, absolutePath);
    unlinkSync(tempPath);
    tempPath = "";
    return absolutePath;
  } finally {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {
        // Continue to the path cleanup; the original failure remains authoritative.
      }
    }
    if (tempPath !== "" && existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {
        // A cleanup failure must not risk deleting the no-clobber output or another file.
      }
    }
  }
}

export function runGrowthBakeCli(argv: readonly string[] = process.argv.slice(2)): GrowthReplayResult {
  const cli = parseGrowthBakeCli(argv);
  const outputPath = assertGrowthOutputVacant(cli.outputPath);
  const legacy =
    cli.legacyManifestPath === null
      ? null
      : loadLegacyGrowthManifest(cli.legacyManifestPath, {
          preset: cli.preset,
          dims: cli.dims,
          tickCap: cli.tickCap,
          domain: cli.domain,
          rngSeed: cli.rngSeed,
          noiseEpsilon: cli.noiseEpsilon,
        });
  const source = captureGrowthBakeSource(argv, process.cwd(), legacy);
  console.log(
    `growth replay preset=${cli.preset} dims=${cli.dims.nx},${cli.dims.ny},${cli.dims.nz} ` +
      `domain=${cli.domain} ticks=${cli.tickCap} seed=${cli.rngSeed} noise=${cli.noiseEpsilon} ` +
      `padding=${cli.padding} -> ${outputPath}`,
  );
  const result = collectGrowthReplay({
    preset: cli.preset,
    dims: cli.dims,
    tickCap: cli.tickCap,
    domain: cli.domain,
    rngSeed: cli.rngSeed,
    noiseEpsilon: cli.noiseEpsilon,
    padding: cli.padding,
    source,
    legacyChecks: legacy?.checks,
    expectedAttachedCount: cli.expectedAttachedCount,
    expectedOccupancySha256: cli.expectedOccupancySha256,
    progressEvery: cli.progressEvery,
    onProgress: (progress) => {
      console.log(
        `growth replay tick=${progress.tick}/${progress.tickCap} attached=${progress.attachedCount} ` +
          `events=${progress.eventCount} elapsed=${progress.elapsedSeconds.toFixed(1)}s`,
      );
    },
  });
  publishGrowthAssetNoClobber(outputPath, result.bytes);
  console.log(
    `growth replay complete tick=${result.header.finalTick} attached=${result.header.attachedCount} ` +
      `bytes=${result.bytes.byteLength} occupancySha256=${result.finalOccupancySha256} ` +
      `assetSha256=${sha256Hex(result.bytes)} out=${outputPath}`,
  );
  return result;
}

// Under node -e, argv[1] is a caller positional and may coincidentally name this module. Imports
// must remain side-effect-free for tests and future orchestration.
const evalOrPrintInvocation = process.execArgv.some(
  (argument) =>
    argument === "-e" ||
    argument === "--eval" ||
    argument.startsWith("--eval=") ||
    argument === "-p" ||
    argument === "--print" ||
    argument.startsWith("--print="),
);
if (
  !evalOrPrintInvocation &&
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    runGrowthBakeCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
