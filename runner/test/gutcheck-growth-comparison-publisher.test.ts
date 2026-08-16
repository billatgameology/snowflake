import { createHash } from "node:crypto";
import {
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { GG_PRESETS, domainCenter, hexSeedSites } from "@vcc/core";

import {
  GUTCHECK_GROWTH_FORMAT,
  GUTCHECK_GROWTH_LATTICE,
  buildPaddedGrowthCrop,
  decodeGrowthAsset,
  encodeGrowthAsset,
  growthFlatIndex,
  growthSiteIsActive,
  type GrowthHeaderV1,
  type GrowthReplayConfig,
} from "../../app/src/gutcheck-growth-format.ts";
import { deriveGrowthOccupancySha256 } from "../../scripts/gutcheck-build-growth-comparison.ts";
import {
  GUTCHECK_GROWTH_RUN_B_BUNDLE_FILES,
  GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY,
  growthComparisonNasPublisherTestOnly,
  runGrowthComparisonNasPublisherCli,
} from "../../scripts/gutcheck-publish-growth-comparison.ts";

const EVENT_COUNT = 961_597;
const MANIFEST_SHA256 =
  "a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d";
const OCCUPANCY_SHA256 =
  "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";
const VIDEO_SHA256 =
  "a5ead695add684791f2cd2c02dc650a64d14e37a78df22606b4675f72f6a4c1f";
const ATTEMPT_ID = "publisher-fixture";
const DERIVED_VIDEO_SHARE_PATH = "out/gutcheck-gg-realism/p7/growth-B-intro.mp4";
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const LEGACY_MANIFEST_PATH = resolve(
  tmpdir(),
  "publisher-fixture-share",
  "out/gutcheck-gg-realism/large/anim-B/manifest.json",
);

interface FileIdentity {
  readonly bytes: number;
  readonly sha256: string;
}

interface Fixture {
  readonly root: string;
  readonly source: string;
  readonly nas: string;
  readonly outParent: string;
  readonly canonical: string;
  readonly staging: string;
  readonly assetSha256: string;
  readonly videoPath: string;
  readonly videoIdentity: FileIdentity;
}

const fixtureRoots: string[] = [];

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function digestBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function runBParams(): GrowthReplayConfig["params"] {
  const preset = GG_PRESETS.plate;
  const vector = (values: Float64Array): readonly (number | null)[] => [
    null,
    ...Array.from(values.subarray(1)),
  ];
  return {
    rho: preset.rho,
    phi: preset.phi,
    kappa: vector(preset.kappa),
    mu: vector(preset.mu),
    ggThreshBeta: vector(preset.ggThreshBeta),
  };
}

function buildRunBFixtureAsset(): Uint8Array {
  const dims = { nx: 1200, ny: 1200, nz: 48 } as const;
  const center = domainCenter(dims);
  const config: GrowthReplayConfig = {
    preset: "plate",
    dims,
    domain: "hexPrism",
    tickCap: 70_000,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "reflecting",
    seedRadius: 2,
    seedThickness: 1,
    center,
    params: runBParams(),
  };
  const seed = hexSeedSites(dims, 2, 1, center).sort((left, right) => left - right);
  const seedSet = new Set(seed);
  const witnesses = [
    growthFlatIndex(dims, 306, 600, 24),
    growthFlatIndex(dims, 894, 600, 24),
    growthFlatIndex(dims, 600, 306, 24),
    growthFlatIndex(dims, 600, 894, 24),
    growthFlatIndex(dims, 600, 600, 18),
    growthFlatIndex(dims, 600, 600, 30),
  ];
  const witnessSet = new Set(witnesses);
  const nonSeed = [...witnesses];
  for (let k = 18; k <= 30 && nonSeed.length < EVENT_COUNT - seed.length; k++) {
    for (let j = 306; j <= 894 && nonSeed.length < EVENT_COUNT - seed.length; j++) {
      for (let i = 306; i <= 894 && nonSeed.length < EVENT_COUNT - seed.length; i++) {
        const index = growthFlatIndex(dims, i, j, k);
        if (
          !seedSet.has(index) &&
          !witnessSet.has(index) &&
          growthSiteIsActive(config, index)
        ) {
          nonSeed.push(index);
        }
      }
    }
  }
  if (nonSeed.length !== EVENT_COUNT - seed.length) {
    throw new Error(`fixture could build only ${nonSeed.length} non-seed Run B events`);
  }
  nonSeed.sort((left, right) => left - right);
  const flatIndices = Uint32Array.from([...seed, ...nonSeed]);
  const attachTicks = new Uint32Array(EVENT_COUNT);
  attachTicks.fill(70_000, seed.length);
  const crop = buildPaddedGrowthCrop(flatIndices, dims, 2);
  const source: GrowthHeaderV1["source"] = {
    label: "deterministic G-G sparse attachment replay",
    command: {
      executable: process.execPath,
      script: join(REPOSITORY_ROOT, "scripts/gutcheck-bake-growth.ts"),
      argv: [
        "--preset", "plate",
        "--dims", "1200,1200,48",
        "--ticks", "70000",
        "--out", "out/gutcheck-growth-runB/gutcheck-growth-v1.bin",
        "--domain", "hexPrism",
        "--seed", "1",
        "--noise", "0",
        "--padding", "2",
        "--progress", "100",
        "--legacy-manifest", LEGACY_MANIFEST_PATH,
        "--expected-attached-count", String(EVENT_COUNT),
        "--expected-occupancy-sha256", OCCUPANCY_SHA256,
      ],
      cwd: REPOSITORY_ROOT,
    },
    runtime: {
      node: "v24.13.1",
      v8: "13.6.233.17-node.40",
      platform: "darwin",
      architecture: "arm64",
      endianness: "LE",
    },
    git: {
      repositoryRoot: REPOSITORY_ROOT,
      head: "44fd4b604cddf1c1c30ed4aec2afba5bdc18be5c",
      branch: "explore/education-ch1-video",
      dirty: false,
      statusPorcelainV1: [],
    },
    legacyComparison: {
      path: LEGACY_MANIFEST_PATH,
      sha256: MANIFEST_SHA256,
      frameCount: 701,
    },
    endpoint: {
      occupancyEncoding: "full-lattice-u8-a-field-i-fastest-j-next-k-slowest",
      measuredAttachedCount: EVENT_COUNT,
      measuredOccupancySha256: OCCUPANCY_SHA256,
      expectedAttachedCount: EVENT_COUNT,
      expectedOccupancySha256: OCCUPANCY_SHA256,
    },
  };
  return encodeGrowthAsset(
    {
      format: GUTCHECK_GROWTH_FORMAT,
      eventCount: EVENT_COUNT,
      attachedCount: EVENT_COUNT,
      seedCount: seed.length,
      finalTick: 70_000,
      terminationReason: "tick-cap",
      config,
      lattice: GUTCHECK_GROWTH_LATTICE,
      crop,
      source,
    },
    { flatIndices, attachTicks },
  );
}

const VALID_ASSET = buildRunBFixtureAsset();
const ASSET_BYTES = VALID_ASSET.byteLength;
const ASSET_SHA256 = digestBytes(VALID_ASSET);
const FIXTURE_OCCUPANCY_SHA256 = deriveGrowthOccupancySha256(decodeGrowthAsset(VALID_ASSET));

function buildValidEventPayloadMutation(): Uint8Array {
  const decoded = decodeGrowthAsset(VALID_ASSET);
  const seedCount = decoded.header.seedCount;
  const seed = Array.from(decoded.flatIndices.subarray(0, seedCount));
  const nonSeed = Array.from(decoded.flatIndices.subarray(seedCount));
  const occupied = new Set(decoded.flatIndices);
  nonSeed.splice(100, 1);
  let replacement: number | null = null;
  for (let k = 29; k >= 19 && replacement === null; k--) {
    for (let j = 893; j >= 307 && replacement === null; j--) {
      for (let i = 893; i >= 307; i--) {
        const candidate = growthFlatIndex(decoded.header.config.dims, i, j, k);
        if (!occupied.has(candidate) && growthSiteIsActive(decoded.header.config, candidate)) {
          replacement = candidate;
          break;
        }
      }
    }
  }
  if (replacement === null) throw new Error("fixture could not find a valid unoccupied mutation site");
  nonSeed.push(replacement);
  nonSeed.sort((left, right) => left - right);
  const flatIndices = Uint32Array.from([...seed, ...nonSeed]);
  const attachTicks = new Uint32Array(EVENT_COUNT);
  attachTicks.fill(70_000, seedCount);
  const mutated = encodeGrowthAsset(decoded.header, { flatIndices, attachTicks });
  if (mutated.byteLength !== VALID_ASSET.byteLength || digestBytes(mutated) === ASSET_SHA256) {
    throw new Error("fixture event mutation did not retain byte length while changing the payload");
  }
  return mutated;
}

const VALID_MUTATED_ASSET = buildValidEventPayloadMutation();

function writeBytes(path: string, bytes: Uint8Array): FileIdentity {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  return { bytes: bytes.byteLength, sha256: digestBytes(bytes) };
}

function writeText(path: string, text: string): FileIdentity {
  return writeBytes(path, Buffer.from(text, "utf8"));
}

function fileIdentity(path: string): FileIdentity {
  const bytes = readFileSync(path);
  return { bytes: bytes.byteLength, sha256: digestBytes(bytes) };
}

function jsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeComparisonRecord(
  asset: FileIdentity,
  posters: readonly [FileIdentity, FileIdentity, FileIdentity],
): Record<string, unknown> {
  const sourceIdentity = {
    manifestSha256: MANIFEST_SHA256,
    occupancySha256: OCCUPANCY_SHA256,
  };
  const posterRecords = [
    {
      tick: 0,
      videoTimeSeconds: 0,
      url: "/nas/out/gutcheck-growth-runB/comparison-inputs/poster-start.png",
      ...posters[0],
      alt: "Run B seed at tick zero",
    },
    {
      tick: 35_000,
      videoTimeSeconds: 6.5,
      url: "/nas/out/gutcheck-growth-runB/comparison-inputs/poster-middle.png",
      ...posters[1],
      alt: "Run B growth at tick 35000",
    },
    {
      tick: 70_000,
      videoTimeSeconds: 13,
      url: "/nas/out/gutcheck-growth-runB/comparison-inputs/poster-final.png",
      ...posters[2],
      alt: "Run B final state at tick 70000",
    },
  ];
  return {
    format: "gutcheck-growth-comparison-v1",
    recordedAt: "2026-08-15T20:00:00.000Z",
    run: {
      label: "Run B — G-G plate",
      preset: "plate",
      dims: { nx: 1200, ny: 1200, nz: 48 },
      domain: "hexPrism",
      rngSeed: 1,
      noiseEpsilon: 0,
      firstTick: 0,
      finalTick: 70_000,
      tickInterval: 100,
    },
    legacy: {
      format: "gutcheck-anim-v1",
      sourceIdentity,
      rawSequence: {
        frameBytes: 9_986_535_068,
        manifestBytes: 97_503,
        totalBytes: 9_986_632_571,
        frameCount: 701,
        generationSeconds: 41_194,
      },
      v2qSequence: {
        frameBytes: 6_622_097_200,
        manifestBytes: 97_503,
        totalBytes: 6_622_194_703,
        frameCount: 701,
        generationSeconds: 25,
      },
      lightweightMedia: {
        totalBytes: 5_592_795 + posters.reduce((sum, poster) => sum + poster.bytes, 0),
        posters: posterRecords,
        derivedVideo: {
          url: "/nas/out/gutcheck-gg-realism/p7/growth-B-intro.mp4",
          bytes: 5_592_795,
          sha256: VIDEO_SHA256,
          durationSeconds: 16,
          frameCount: 480,
        },
      },
    },
    compact: {
      format: "gutcheck-growth-v1",
      sourceIdentity,
      asset: {
        url: "/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin",
        ...asset,
      },
      bakeElapsedSeconds: 10,
      eventCount: EVENT_COUNT,
      firstTick: 0,
      finalTick: 70_000,
      crop: {
        iMin: 304,
        iMax: 896,
        jMin: 304,
        jMax: 896,
        kMin: 16,
        kMax: 32,
        padding: 2,
        sampleCount: 5_978_033,
        r32uiBytes: 23_912_132,
      },
    },
  };
}

function makeFixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "vcc-growth-comparison-publisher-"));
  fixtureRoots.push(root);
  const source = join(root, "local", ...GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY.split("/"));
  const nas = join(root, "nas");
  const outParent = join(nas, "out");
  const canonical = join(outParent, "gutcheck-growth-runB");
  const staging = join(outParent, `.gutcheck-growth-runB.staging-${ATTEMPT_ID}`);
  mkdirSync(join(source, "comparison-inputs"), { recursive: true });
  mkdirSync(join(source, "comparison-browser-v1"), { recursive: true });
  mkdirSync(outParent, { recursive: true });

  const assetPath = join(source, "gutcheck-growth-v1.bin");
  const asset = writeBytes(assetPath, VALID_ASSET);
  const videoPath = join(nas, ...DERIVED_VIDEO_SHARE_PATH.split("/"));
  const videoIdentity = writeText(videoPath, "fixture derived Run B video\n");

  const posters = [
    writeText(join(source, "comparison-inputs", "poster-start.png"), "fixture poster start\n"),
    writeText(join(source, "comparison-inputs", "poster-middle.png"), "fixture poster middle\n"),
    writeText(join(source, "comparison-inputs", "poster-final.png"), "fixture poster final\n"),
  ] as const;
  const comparisonRecord = makeComparisonRecord(asset, posters);
  const comparisonRecordIdentity = writeBytes(
    join(source, "comparison-record.json"),
    jsonBytes(comparisonRecord),
  );

  writeText(join(source, "error.log"), "");
  writeText(join(source, "exit-status"), "0\n");
  writeText(
    join(source, "live.log"),
    `growth replay tick=70000/70000 attached=${EVENT_COUNT} events=${EVENT_COUNT} elapsed=10.0s\n` +
      `growth replay complete tick=70000 attached=${EVENT_COUNT} bytes=${ASSET_BYTES} ` +
      `occupancySha256=${OCCUPANCY_SHA256} assetSha256=${ASSET_SHA256} ` +
      `out=${assetPath}\n`,
  );

  const screenshotBytes = new Map<string, Uint8Array>([
    ["landscape.png", Buffer.from("fixture landscape\n")],
    ["full-page.png", Buffer.from("fixture full page\n")],
    ["compact-start.png", Buffer.from("fixture compact start\n")],
    ["compact-middle.png", Buffer.from("fixture compact middle\n")],
    ["compact-final.png", Buffer.from("fixture compact final\n")],
    ["compact-reverse.png", Buffer.from("fixture compact middle\n")],
    ["compact-orbit.png", Buffer.from("fixture compact orbit\n")],
    ["portrait.png", Buffer.from("fixture portrait\n")],
  ]);
  const screenshotIdentities = new Map<string, FileIdentity>();
  for (const [name, bytes] of screenshotBytes) {
    screenshotIdentities.set(
      name,
      writeBytes(join(source, "comparison-browser-v1", name), bytes),
    );
  }
  const screenshotSha = (name: string): string => {
    const identity = screenshotIdentities.get(name);
    if (identity === undefined) throw new Error(`fixture lacks ${name}`);
    return identity.sha256;
  };
  const browserRequest = (pathname: string, resourceType: string) => ({
    url: `http://127.0.0.1:4334${pathname}`,
    method: "GET",
    resourceType,
  });
  const validRequests = [
    browserRequest("/gutcheck-growth-comparison.html?record=/comparison-record.json", "document"),
    browserRequest("/comparison-record.json", "fetch"),
    browserRequest("/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin", "fetch"),
    browserRequest("/nas/out/gutcheck-gg-realism/p7/growth-B-intro.mp4", "media"),
    browserRequest("/src/gutcheck-growth-comparison.ts", "script"),
    browserRequest("/src/gutcheck-growth-comparison.css", "stylesheet"),
  ];
  const overrideApplication = (
    pathname: string,
    status: number,
    contentType: string,
    body: Uint8Array,
  ) => ({
    pathname,
    status,
    contentType,
    bytes: body.byteLength,
    sha256: digestBytes(body),
  });
  const malformedRecord = JSON.parse(JSON.stringify(comparisonRecord)) as Record<string, unknown>;
  malformedRecord["unexpected"] = true;
  const malformedBody = Buffer.from(`${JSON.stringify(malformedRecord)}\n`, "utf8");
  const truncatedBody = VALID_ASSET.subarray(0, 9);
  const payloadMutationBody = Buffer.from(VALID_ASSET);
  payloadMutationBody[payloadMutationBody.length - 1] ^= 1;
  const missingBody = Buffer.from("missing", "utf8");
  const playerUrl =
    "http://127.0.0.1:4334/spike-gg-realism.html?growth=blob%3Afixture&comparisonAttempt=1";
  const captureRecord = {
    format: "gutcheck-growth-comparison-browser-v1",
    status: "pass",
    command: ["node", "app/scripts/growth-comparison-capture.mjs"],
    browser: "fixture Chromium",
    renderer: "fixture renderer",
    inputs: {
      record: { path: join(source, "comparison-record.json"), ...comparisonRecordIdentity },
      growth: { path: assetPath, ...asset },
      legacyVideo: {
        path: videoPath,
        ...videoIdentity,
      },
      posters: posters.map((poster, index) => ({
        path: join(source, "comparison-inputs", [
          "poster-start.png",
          "poster-middle.png",
          "poster-final.png",
        ][index]!),
        ...poster,
      })),
    },
    independentlyDecoded: {
      eventCount: EVENT_COUNT,
      finalTick: 70_000,
      crop: {
        iMin: 304,
        iMax: 896,
        jMin: 304,
        jMax: 896,
        kMin: 16,
        kMax: 32,
        padding: 2,
      },
      finalEventTick: 70_000,
    },
    valid: {
      viewport: { width: 1440, height: 900 },
      initialTick: 0,
      readiness: {
        comparisonReady: true,
        comparisonError: null,
        comparisonDebugPresent: true,
        comparisonReducedMotion: false,
        compactDebugPresent: true,
        compactPlaying: true,
      },
      content: {
        headline: "One crystal. Two timelines.",
        tableCount: 1,
        iframeTitle: "Interactive compact Run B growth replay",
        legacySizeNote: "6,622,194,703 exact bytes",
        compactSizeNote: `${ASSET_BYTES.toLocaleString("en-US")} exact bytes`,
        ratio: `${Math.round(6_622_194_703 / ASSET_BYTES).toLocaleString("en-US")}× smaller`,
      },
      screenshots: {
        landscape: screenshotSha("landscape.png"),
        fullPage: screenshotSha("full-page.png"),
        start: screenshotSha("compact-start.png"),
        middle: screenshotSha("compact-middle.png"),
        final: screenshotSha("compact-final.png"),
        reverse: screenshotSha("compact-reverse.png"),
        orbit: screenshotSha("compact-orbit.png"),
        portrait: screenshotSha("portrait.png"),
      },
      requests: {
        total: validRequests.length,
        comparisonRecord: 1,
        compactAsset: 1,
        legacyManifest: 0,
        legacyMeshes: 0,
        entries: validRequests,
      },
      layout: {
        landscape: { innerWidth: 1440, scrollWidth: 1440 },
        portrait: { innerWidth: 390, scrollWidth: 390 },
      },
      controls: {
        buttonCount: 3,
        posterSeeks: [
          { label: "start", tick: 0, videoTimeSeconds: 0 },
          { label: "middle", tick: 35_000, videoTimeSeconds: 6.5 },
          { label: "final", tick: 70_000, videoTimeSeconds: 13 },
        ],
      },
      playback: {
        startedPlaying: true,
        startedTick: 100,
        pausedPlaying: false,
        pausedTick: 100,
        pausedDisplayTick: 100,
        heldTick: 100,
        heldDisplayTick: 100,
      },
      keyboard: { beforeArrow: 0, afterArrow: 1 },
      portraitFraming: { xMin: -0.8, xMax: 0.8, yMin: -0.7, yMax: 0.7 },
      errors: [],
    },
    reducedMotion: {
      requested: true,
      comparisonReducedMotion: true,
      compactReducedMotion: true,
      playing: false,
      manualTick: 35_000,
    },
    errors: {
      malformed: {
        label: "malformed record",
        error: "comparison record keys must be exact",
        ready: false,
        bodyText: "Comparison unavailable\ncomparison record keys must be exact",
        iframeReady: null,
        iframeSrc: null,
        requests: [
          browserRequest("/gutcheck-growth-comparison.html?record=/comparison-record.json", "document"),
          browserRequest("/comparison-record.json", "fetch"),
        ],
        overrideApplications: [
          overrideApplication("/comparison-record.json", 200, "application/json", malformedBody),
        ],
        contextNullWitness: null,
      },
      truncated: {
        label: "truncated compact asset",
        error: "compact asset byte length differs",
        ready: false,
        bodyText: "Interactive replay unavailable\ncompact asset byte length differs",
        iframeReady: false,
        iframeSrc: null,
        requests: [
          browserRequest("/gutcheck-growth-comparison.html?record=/comparison-record.json", "document"),
          browserRequest("/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin", "fetch"),
        ],
        overrideApplications: [
          overrideApplication(
            "/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin",
            200,
            "application/octet-stream",
            truncatedBody,
          ),
        ],
        contextNullWitness: null,
      },
      payloadMutation: {
        label: "same-size compact payload mutation",
        error: "compact asset SHA-256 differs",
        ready: false,
        bodyText: "Interactive replay unavailable\ncompact asset SHA-256 differs",
        iframeReady: false,
        iframeSrc: null,
        requests: [
          browserRequest("/gutcheck-growth-comparison.html?record=/comparison-record.json", "document"),
          browserRequest("/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin", "fetch"),
        ],
        overrideApplications: [
          overrideApplication(
            "/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin",
            200,
            "application/octet-stream",
            payloadMutationBody,
          ),
        ],
        contextNullWitness: null,
      },
      missing: {
        label: "missing compact asset",
        error: "compact asset fetch failed: 404",
        ready: false,
        bodyText: "Interactive replay unavailable\ncompact asset fetch failed: 404",
        iframeReady: false,
        iframeSrc: null,
        requests: [
          browserRequest("/gutcheck-growth-comparison.html?record=/comparison-record.json", "document"),
          browserRequest("/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin", "fetch"),
        ],
        overrideApplications: [
          overrideApplication(
            "/nas/out/gutcheck-growth-runB/gutcheck-growth-v1.bin",
            404,
            "text/plain",
            missingBody,
          ),
        ],
        contextNullWitness: null,
      },
      noWebgl: {
        label: "WebGL2 unavailable",
        error: "Error: WebGL2 is required\n    at fixture player",
        ready: false,
        bodyText: "Interactive replay unavailable\nError: WebGL2 is required at fixture player",
        iframeReady: false,
        iframeSrc: playerUrl,
        requests: [
          browserRequest("/gutcheck-growth-comparison.html?record=/comparison-record.json", "document"),
          { url: playerUrl, method: "GET", resourceType: "document" },
        ],
        overrideApplications: [],
        contextNullWitness: {
          installed: true,
          webgl2Calls: 1,
          returnedNull: true,
          frameUrl: playerUrl,
        },
      },
    },
    limits: "fixture",
  };
  writeBytes(join(source, "comparison-browser-v1", "record.json"), jsonBytes(captureRecord));
  return {
    root,
    source,
    nas,
    outParent,
    canonical,
    staging,
    assetSha256: ASSET_SHA256,
    videoPath,
    videoIdentity,
  };
}

function publish(
  fixture: Fixture,
  hooks?: Parameters<typeof growthComparisonNasPublisherTestOnly.publish>[0]["hooks"],
) {
  return growthComparisonNasPublisherTestOnly.publish({
    sourceDirectory: fixture.source,
    nasMount: fixture.nas,
    attemptId: ATTEMPT_ID,
    hooks,
    expectedVideoIdentity: {
      path: DERIVED_VIDEO_SHARE_PATH,
      ...fixture.videoIdentity,
    },
    expectedOccupancySha256: FIXTURE_OCCUPANCY_SHA256,
  });
}

function mutateJson(path: string, mutate: (value: Record<string, unknown>) => void): void {
  const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  mutate(value);
  writeFileSync(path, jsonBytes(value));
}

function captureRecordPath(fixture: Fixture): string {
  return join(fixture.source, "comparison-browser-v1", "record.json");
}

function rebindMutatedCompactAsset(fixture: Fixture, bytes: Uint8Array): void {
  const assetPath = join(fixture.source, "gutcheck-growth-v1.bin");
  const asset = writeBytes(assetPath, bytes);
  const comparisonPath = join(fixture.source, "comparison-record.json");
  mutateJson(comparisonPath, (value) => {
    const compact = value["compact"] as Record<string, unknown>;
    const reference = compact["asset"] as Record<string, unknown>;
    reference["bytes"] = asset.bytes;
    reference["sha256"] = asset.sha256;
  });
  const comparison = fileIdentity(comparisonPath);
  mutateJson(captureRecordPath(fixture), (value) => {
    const inputs = value["inputs"] as Record<string, unknown>;
    inputs["growth"] = { path: assetPath, ...asset };
    inputs["record"] = { path: comparisonPath, ...comparison };
  });
}

describe("Run B comparison NAS publisher", () => {
  it("publishes the exact 17-file bundle by one verified same-share rename", () => {
    const fixture = makeFixture();
    const report = publish(fixture);
    expect(report.status).toBe("pass");
    expect(report.fileCount).toBe(17);
    expect(report.files.map((file) => file.path)).toEqual(
      GUTCHECK_GROWTH_RUN_B_BUNDLE_FILES.map(
        (path) => `${GUTCHECK_GROWTH_RUN_B_SHARE_DIRECTORY}/${path}`,
      ),
    );
    expect(report.totalBytes).toBe(
      report.files.reduce((sum, file) => sum + file.bytes, 0),
    );
    expect(report.canonicalDirectory).toBe(realpathSync.native(fixture.canonical));
    expect(report.referencedVideo).toEqual({
      path: DERIVED_VIDEO_SHARE_PATH,
      ...fixture.videoIdentity,
    });
    expect(lstatSync(fixture.canonical).isDirectory()).toBe(true);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
    for (const path of GUTCHECK_GROWTH_RUN_B_BUNDLE_FILES) {
      expect(fileIdentity(join(fixture.canonical, ...path.split("/")))).toEqual(
        fileIdentity(join(fixture.source, ...path.split("/"))),
      );
    }
  });

  it("rejects unknown CLI arguments before NAS detection", () => {
    expect(() => runGrowthComparisonNasPublisherCli(["--source", "elsewhere"]))
      .toThrow(/usage/u);
  });

  it("preserves a pre-existing empty canonical directory", () => {
    const fixture = makeFixture();
    mkdirSync(fixture.canonical);
    expect(() => publish(fixture)).toThrow(/canonical Run B comparison bundle already exists/u);
    expect(readdirSync(fixture.canonical)).toEqual([]);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("preserves a pre-existing canonical file", () => {
    const fixture = makeFixture();
    writeFileSync(fixture.canonical, "foreign canonical\n");
    expect(() => publish(fixture)).toThrow(/already exists as a file/u);
    expect(readFileSync(fixture.canonical, "utf8")).toBe("foreign canonical\n");
  });

  it.skipIf(process.platform === "win32")("preserves a pre-existing canonical symlink", () => {
    const fixture = makeFixture();
    const target = join(fixture.root, "foreign-target");
    writeFileSync(target, "foreign target\n");
    symlinkSync(target, fixture.canonical);
    expect(() => publish(fixture)).toThrow(/already exists as a symbolic link/u);
    expect(lstatSync(fixture.canonical).isSymbolicLink()).toBe(true);
    expect(readFileSync(target, "utf8")).toBe("foreign target\n");
  });

  it("refuses an extra source file before creating staging", () => {
    const fixture = makeFixture();
    writeFileSync(join(fixture.source, "unexpected.txt"), "unexpected\n");
    expect(() => publish(fixture)).toThrow(/source bundle file roster differs/u);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("refuses a missing source file before creating staging", () => {
    const fixture = makeFixture();
    rmSync(join(fixture.source, "comparison-browser-v1", "portrait.png"));
    expect(() => publish(fixture)).toThrow(/source bundle file roster differs/u);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it.skipIf(process.platform === "win32")("refuses a symbolic link in the source roster", () => {
    const fixture = makeFixture();
    const poster = join(fixture.source, "comparison-inputs", "poster-start.png");
    const target = join(fixture.root, "foreign-poster.png");
    writeFileSync(target, "foreign poster\n");
    rmSync(poster);
    symlinkSync(target, poster);
    expect(() => publish(fixture)).toThrow(/source bundle contains a symbolic link/u);
    expect(readFileSync(target, "utf8")).toBe("foreign poster\n");
  });

  it("allows a source hard link because staged files are exclusive fresh copies", () => {
    const fixture = makeFixture();
    const alias = join(fixture.root, "source-hard-link.png");
    linkSync(join(fixture.source, "comparison-inputs", "poster-final.png"), alias);
    const report = publish(fixture);
    expect(report.status).toBe("pass");
    expect(readFileSync(alias, "utf8")).toBe("fixture poster final\n");
    expect(lstatSync(join(fixture.canonical, "comparison-inputs", "poster-final.png")).nlink)
      .toBe(1);
  });

  it.each([
    ["nonzero exit status", (fixture: Fixture) => writeFileSync(join(fixture.source, "exit-status"), "1\n"), /exit-status/u],
    ["nonempty error log", (fixture: Fixture) => writeFileSync(join(fixture.source, "error.log"), "warning\n"), /error\.log must be empty/u],
    ["failed browser record", (fixture: Fixture) => mutateJson(
      join(fixture.source, "comparison-browser-v1", "record.json"),
      (value) => { value["status"] = "fail"; },
    ), /browser capture record must be a successful/u],
  ] as const)("refuses an unsuccessful source bundle: %s", (_label, mutate, pattern) => {
    const fixture = makeFixture();
    mutate(fixture);
    expect(() => publish(fixture)).toThrow(pattern);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("refuses compact bytes that no longer match the comparison record", () => {
    const fixture = makeFixture();
    writeFileSync(join(fixture.source, "gutcheck-growth-v1.bin"), "changed\n");
    expect(() => publish(fixture)).toThrow(/comparison record compact asset/u);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("rederives occupancy from a coherent same-size valid event-payload mutation", () => {
    const fixture = makeFixture();
    rebindMutatedCompactAsset(fixture, VALID_MUTATED_ASSET);
    expect(() => publish(fixture)).toThrow(/event-derived occupancy SHA-256 differs/u);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("requires the actual referenced NAS video to exist before creating staging", () => {
    const fixture = makeFixture();
    rmSync(fixture.videoPath);
    expect(() => publish(fixture)).toThrow(/ENOENT/u);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("rehashes the actual referenced NAS video before creating staging", () => {
    const fixture = makeFixture();
    writeFileSync(fixture.videoPath, "different derived video\n");
    expect(() => publish(fixture)).toThrow(/actual pinned NAS derived video bytes or SHA-256 differ/u);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("rejects forged browser witnesses even when the top-level status remains pass", () => {
    const cases: readonly [string, (value: Record<string, unknown>) => void, RegExp][] = [
      [
        "independent decode",
        (value) => {
          const decoded = value["independentlyDecoded"] as Record<string, unknown>;
          decoded["eventCount"] = EVENT_COUNT - 1;
        },
        /independently decoded identity differs/u,
      ],
      [
        "normal autoplay",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const readiness = valid["readiness"] as Record<string, unknown>;
          readiness["compactPlaying"] = false;
        },
        /readiness does not prove normal-motion compact autoplay/u,
      ],
      [
        "measured ratio",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const content = valid["content"] as Record<string, unknown>;
          content["ratio"] = "1× smaller";
        },
        /semantic measured comparison/u,
      ],
      [
        "legacy request exclusion",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const requests = valid["requests"] as Record<string, unknown>;
          const entries = requests["entries"] as Record<string, unknown>[];
          entries.push({
            url: "http://127.0.0.1:4334/nas/out/legacy/mesh-t000100.bin",
            method: "GET",
            resourceType: "fetch",
          });
          requests["total"] = entries.length;
        },
        /zero legacy timeline requests/u,
      ],
      [
        "all poster seeks",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const controls = valid["controls"] as Record<string, unknown>;
          const seeks = controls["posterSeeks"] as Record<string, unknown>[];
          seeks[1]!["tick"] = 34_999;
        },
        /poster seek 1 differs/u,
      ],
      [
        "pause hold",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const playback = valid["playback"] as Record<string, unknown>;
          playback["heldTick"] = 101;
        },
        /start, pause, and deterministic hold/u,
      ],
      [
        "paused timeline bounds",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const playback = valid["playback"] as Record<string, unknown>;
          playback["pausedTick"] = -1;
          playback["pausedDisplayTick"] = -1;
          playback["heldTick"] = -1;
          playback["heldDisplayTick"] = -1;
        },
        /start, pause, and deterministic hold/u,
      ],
      [
        "portrait framing",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const framing = valid["portraitFraming"] as Record<string, unknown>;
          framing["xMax"] = 1.1;
        },
        /portrait framing clips/u,
      ],
      [
        "nondegenerate portrait framing",
        (value) => {
          const valid = value["valid"] as Record<string, unknown>;
          const framing = valid["portraitFraming"] as Record<string, unknown>;
          framing["xMin"] = 0;
          framing["xMax"] = 0;
        },
        /portrait framing clips/u,
      ],
      [
        "reduced motion",
        (value) => {
          const reduced = value["reducedMotion"] as Record<string, unknown>;
          reduced["playing"] = true;
        },
        /reduced-motion lane did not suppress autoplay/u,
      ],
      [
        "visible scoped error",
        (value) => {
          const errors = value["errors"] as Record<string, unknown>;
          const missing = errors["missing"] as Record<string, unknown>;
          missing["bodyText"] = "Comparison replay unavailable";
        },
        /visible scoped failure before readiness/u,
      ],
      [
        "named mutation bytes",
        (value) => {
          const errors = value["errors"] as Record<string, unknown>;
          const truncated = errors["truncated"] as Record<string, unknown>;
          const applications = truncated["overrideApplications"] as Record<string, unknown>[];
          const wrongBody = VALID_ASSET.subarray(0, 10);
          applications[0]!["bytes"] = wrongBody.byteLength;
          applications[0]!["sha256"] = digestBytes(wrongBody);
        },
        /applied bytes differ from its independently reconstructed named mutation/u,
      ],
    ];
    for (const [label, mutate, pattern] of cases) {
      const fixture = makeFixture();
      mutateJson(captureRecordPath(fixture), mutate);
      expect(() => publish(fixture), label).toThrow(pattern);
      expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
    }
  });

  it("recomputes screenshot hashes before checking reverse-seek image identity", () => {
    const fixture = makeFixture();
    const finalPath = join(fixture.source, "comparison-browser-v1", "compact-final.png");
    const reversePath = join(fixture.source, "comparison-browser-v1", "compact-reverse.png");
    writeFileSync(reversePath, readFileSync(finalPath));
    const reverse = fileIdentity(reversePath);
    mutateJson(captureRecordPath(fixture), (value) => {
      const valid = value["valid"] as Record<string, unknown>;
      const screenshots = valid["screenshots"] as Record<string, unknown>;
      screenshots["reverse"] = reverse.sha256;
    });
    expect(() => publish(fixture)).toThrow(/screenshot relations do not prove/u);
  });

  it("refuses a noncanonical compact NAS URL", () => {
    const fixture = makeFixture();
    mutateJson(join(fixture.source, "comparison-record.json"), (value) => {
      const compact = value["compact"] as Record<string, unknown>;
      const asset = compact["asset"] as Record<string, unknown>;
      asset["url"] = "/nas/out/other/gutcheck-growth-v1.bin";
    });
    expect(() => publish(fixture)).toThrow(/exact final NAS URL/u);
  });

  it("detects a source mutation after copy and preserves its failed staging", () => {
    const fixture = makeFixture();
    expect(() => publish(fixture, {
      afterFirstStagingVerification: ({ sourceDirectory }) => {
        writeFileSync(join(sourceDirectory, "comparison-inputs", "poster-final.png"), "late source mutation\n");
      },
    })).toThrow(/source bundle before rename differs/u);
    expect(lstatSync(fixture.staging).isDirectory()).toBe(true);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("detects a referenced-video mutation before rename and preserves its failed staging", () => {
    const fixture = makeFixture();
    expect(() => publish(fixture, {
      afterFirstStagingVerification: () => {
        writeFileSync(fixture.videoPath, "late derived-video mutation\n");
      },
    })).toThrow(/pinned NAS video before rename differs/u);
    expect(lstatSync(fixture.staging).isDirectory()).toBe(true);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("detects a staging mutation and preserves the exact failed bytes", () => {
    const fixture = makeFixture();
    expect(() => publish(fixture, {
      afterFirstStagingVerification: ({ stagingDirectory }) => {
        writeFileSync(join(stagingDirectory, "comparison-inputs", "poster-final.png"), "late staging mutation\n");
      },
    })).toThrow(/staged bundle before rename differs/u);
    expect(readFileSync(join(fixture.staging, "comparison-inputs", "poster-final.png"), "utf8"))
      .toBe("late staging mutation\n");
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("rejects a staged hard-link alias while preserving the outside alias", () => {
    const fixture = makeFixture();
    const alias = join(fixture.root, "outside-hard-link.png");
    expect(() => publish(fixture, {
      afterFirstStagingVerification: ({ stagingDirectory }) => {
        linkSync(
          join(stagingDirectory, "comparison-inputs", "poster-final.png"),
          alias,
        );
      },
    })).toThrow(/must have exactly one hard link/u);
    expect(readFileSync(alias, "utf8")).toBe("fixture poster final\n");
    expect(lstatSync(fixture.staging).isDirectory()).toBe(true);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("refuses ownership verification when the private staging path was replaced", () => {
    const fixture = makeFixture();
    const moved = join(fixture.outParent, "moved-owned-staging");
    expect(() => publish(fixture, {
      afterFirstStagingVerification: ({ stagingDirectory }) => {
        renameSync(stagingDirectory, moved);
        mkdirSync(stagingDirectory);
        writeFileSync(join(stagingDirectory, "foreign.txt"), "preserve me\n");
      },
    })).toThrow(AggregateError);
    expect(readFileSync(join(fixture.staging, "foreign.txt"), "utf8")).toBe("preserve me\n");
    expect(lstatSync(moved).isDirectory()).toBe(true);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("reports and preserves failed owned staging without any recursive-delete implementation", () => {
    const fixture = makeFixture();
    let failure: unknown;
    try {
      publish(fixture, {
        afterFirstStagingVerification: ({ stagingDirectory }) => {
          writeFileSync(
            join(stagingDirectory, "comparison-inputs", "poster-final.png"),
            "preserve failed bytes\n",
          );
        },
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).message).toContain(realpathSync.native(fixture.staging));
    expect((failure as AggregateError).message).toContain("no cleanup was attempted");
    expect(readFileSync(join(fixture.staging, "comparison-inputs", "poster-final.png"), "utf8"))
      .toBe("preserve failed bytes\n");
    const publisherSource = readFileSync(
      join(REPOSITORY_ROOT, "scripts", "gutcheck-publish-growth-comparison.ts"),
      "utf8",
    );
    expect(publisherSource).not.toMatch(/\brmSync\s*\(/u);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("rechecks and preserves an empty canonical directory that appears before rename", () => {
    const fixture = makeFixture();
    expect(() => publish(fixture, {
      beforeFinalPreflight: ({ canonicalDirectory }) => mkdirSync(canonicalDirectory),
    })).toThrow(/before rename already exists as a directory/u);
    expect(readdirSync(fixture.canonical)).toEqual([]);
    expect(lstatSync(fixture.staging).isDirectory()).toBe(true);
  });

  it("refuses a colliding private staging path and preserves it", () => {
    const fixture = makeFixture();
    mkdirSync(fixture.staging);
    writeFileSync(join(fixture.staging, "foreign.txt"), "foreign staging\n");
    expect(() => publish(fixture)).toThrow(/private staging directory already exists/u);
    expect(readFileSync(join(fixture.staging, "foreign.txt"), "utf8")).toBe("foreign staging\n");
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });

  it("preserves the canonical bundle when final rehash detects post-rename damage", () => {
    const fixture = makeFixture();
    expect(() => publish(fixture, {
      afterRename: ({ canonicalDirectory }) => {
        writeFileSync(join(canonicalDirectory, "comparison-inputs", "poster-middle.png"), "post-rename damage\n");
      },
    })).toThrow(/final canonical bundle differs/u);
    expect(lstatSync(fixture.canonical).isDirectory()).toBe(true);
    expect(readFileSync(join(fixture.canonical, "comparison-inputs", "poster-middle.png"), "utf8"))
      .toBe("post-rename damage\n");
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("preserves the canonical bundle when the referenced video changes after rename", () => {
    const fixture = makeFixture();
    expect(() => publish(fixture, {
      afterRename: () => {
        writeFileSync(fixture.videoPath, "post-rename derived-video damage\n");
      },
    })).toThrow(/final pinned NAS video verification differs/u);
    expect(lstatSync(fixture.canonical).isDirectory()).toBe(true);
    expect(() => lstatSync(fixture.staging)).toThrow(/ENOENT/u);
  });

  it("rejects a final hard-link alias and preserves the published bytes for diagnosis", () => {
    const fixture = makeFixture();
    const alias = join(fixture.root, "final-hard-link.png");
    expect(() => publish(fixture, {
      afterRename: ({ canonicalDirectory }) => {
        linkSync(
          join(canonicalDirectory, "comparison-inputs", "poster-final.png"),
          alias,
        );
      },
    })).toThrow(/must have exactly one hard link/u);
    expect(lstatSync(fixture.canonical).isDirectory()).toBe(true);
    expect(readFileSync(alias, "utf8")).toBe("fixture poster final\n");
  });

  it.skipIf(process.platform === "win32")("refuses an out-parent symlink that escapes the injected share", () => {
    const fixture = makeFixture();
    const outside = join(fixture.root, "outside");
    mkdirSync(outside);
    rmSync(fixture.outParent, { recursive: true });
    symlinkSync(outside, fixture.outParent);
    expect(() => publish(fixture)).toThrow(/NAS out parent must be a real directory/u);
    expect(readdirSync(outside)).toEqual([]);
  });

  it("refuses a source bundle nested inside the injected NAS root", () => {
    const fixture = makeFixture();
    const nestedSource = join(fixture.nas, "nested-source");
    renameSync(fixture.source, nestedSource);
    expect(() => growthComparisonNasPublisherTestOnly.publish({
      sourceDirectory: nestedSource,
      nasMount: fixture.nas,
      attemptId: ATTEMPT_ID,
      expectedVideoIdentity: {
        path: DERIVED_VIDEO_SHARE_PATH,
        ...fixture.videoIdentity,
      },
      expectedOccupancySha256: FIXTURE_OCCUPANCY_SHA256,
    })).toThrow(/must not contain one another/u);
    expect(() => lstatSync(fixture.canonical)).toThrow(/ENOENT/u);
  });
});
