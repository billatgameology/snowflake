import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

import { GG_PRESETS, domainCenter, hexSeedSites } from "@vcc/core";
import { afterAll, describe, expect, it } from "vitest";

import {
  GUTCHECK_GROWTH_FORMAT,
  GUTCHECK_GROWTH_LATTICE,
  buildPaddedGrowthCrop,
  decodeGrowthAsset,
  encodeGrowthAsset,
  type DecodedGrowthAsset,
  type GrowthHeaderV1,
} from "../../app/src/gutcheck-growth-format.ts";
import {
  GUTCHECK_GROWTH_COMPARISON_FORMAT,
  decodeGrowthComparisonRecord,
  type GrowthComparisonRecord,
} from "../../app/src/gutcheck-growth-comparison-record.ts";
import {
  assertExactRunBGrowth,
  assertRunBManifestPairOnGovernedShare,
  buildGrowthComparisonRecord,
  deriveGrowthOccupancySha256,
  deriveGrowthSourceIdentity,
  measureRegularFile,
  normalizedRunBLegacySourcePath,
  parseCompactBakeElapsedSeconds,
  parseFfprobeVideoMetadata,
  parseGrowthComparisonCli,
  parseLegacyComparisonManifest,
  publishGrowthComparisonNoClobber,
  validateLegacyFrameFile,
  type GrowthComparisonBuildOptions,
} from "../../scripts/gutcheck-build-growth-comparison.ts";
import {
  detectGovernedVccNasMount,
  vccNasCandidateMounts,
} from "../../scripts/nas-root.ts";

const DIMS = { nx: 20, ny: 20, nz: 12 } as const;
const FINAL_TICK = 200;
const EVERY = 100;
const temporaryRoots: string[] = [];

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

function temporaryRoot(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `gutcheck-comparison-${label}-`));
  temporaryRoots.push(root);
  return root;
}

function withGutcheckNasRoot<T>(root: string, action: () => T): T {
  const previous = process.env.GUTCHECK_NAS_ROOT;
  process.env.GUTCHECK_NAS_ROOT = root;
  try {
    return action();
  } finally {
    if (previous === undefined) delete process.env.GUTCHECK_NAS_ROOT;
    else process.env.GUTCHECK_NAS_ROOT = previous;
  }
}

function digest(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

const VCC_NAS_MARKER_FIXTURE =
  '{"format":"snowflake-nas-share-v1","projectId":"virtual-cloud-chamber"}\n';

function collectionManifestPair(label: string): {
  readonly share: string;
  readonly raw: string;
  readonly v2q: string;
} {
  const share = temporaryRoot(label);
  writeFileSync(join(share, ".snowflake-nas.json"), VCC_NAS_MARKER_FIXTURE);
  const base = join(
    share,
    "collections",
    "gutcheck-generated-public",
    "2026-08-15",
    "payload",
    "large",
  );
  const raw = join(base, "anim-B", "manifest.json");
  const v2q = join(base, "anim-B-v2q", "manifest.json");
  mkdirSync(join(base, "anim-B"), { recursive: true });
  mkdirSync(join(base, "anim-B-v2q"), { recursive: true });
  writeFileSync(raw, "raw-manifest");
  writeFileSync(v2q, "v2q-manifest");
  return { share, raw, v2q };
}

function legacyManifestPair(label: string): {
  readonly share: string;
  readonly raw: string;
  readonly v2q: string;
} {
  const share = temporaryRoot(label);
  const base = join(share, "out", "gutcheck-gg-realism", "large");
  const raw = join(base, "anim-B", "manifest.json");
  const v2q = join(base, "anim-B-v2q", "manifest.json");
  mkdirSync(join(base, "anim-B"), { recursive: true });
  mkdirSync(join(base, "anim-B-v2q"), { recursive: true });
  writeFileSync(raw, "raw-manifest");
  writeFileSync(v2q, "v2q-manifest");
  return { share, raw, v2q };
}

function paddedJsonHeader(value: Record<string, unknown>): Buffer {
  const raw = Buffer.from(JSON.stringify(value));
  const length = Math.ceil(raw.byteLength / 4) * 4;
  const output = Buffer.alloc(4 + length, 0x20);
  output.writeUInt32LE(length, 0);
  raw.copy(output, 4);
  return output;
}

function rawMeshBytes(frame: { tick: number; vertexCount: number; triangleCount: number }): Buffer {
  const header = paddedJsonHeader({
    format: "gutcheck-mesh-v1",
    vertexCount: frame.vertexCount,
    triangleCount: frame.triangleCount,
    source: {
      replay: "plate 20,20,12 hexPrism",
      tick: frame.tick,
      seed: 1,
      noiseEpsilon: 0,
    },
  });
  return Buffer.concat([header, Buffer.alloc(frame.vertexCount * 24 + frame.triangleCount * 12)]);
}

function v2qMeshBytes(frame: { tick: number; vertexCount: number; triangleCount: number }): Buffer {
  const rawSource = {
    format: "gutcheck-mesh-v1",
    vertexCount: frame.vertexCount,
    triangleCount: frame.triangleCount,
    source: {
      replay: "plate 20,20,12 hexPrism",
      tick: frame.tick,
      seed: 1,
      noiseEpsilon: 0,
    },
  };
  const header = paddedJsonHeader({
    format: "gutcheck-mesh-v2q",
    vertexCount: frame.vertexCount,
    triangleCount: frame.triangleCount,
    bboxMin: [0, 0, 0],
    bboxMax: [1, 1, 1],
    indexType: "u16",
    quantization: { positions: "u16-bbox", normals: "oct-snorm8" },
    source: rawSource,
  });
  const align4 = (value: number): number => Math.ceil(value / 4) * 4;
  const positionEnd = header.byteLength + frame.vertexCount * 6;
  const normalStart = align4(positionEnd);
  const indexStart = align4(normalStart + frame.vertexCount * 2);
  const output = Buffer.alloc(indexStart + frame.triangleCount * 6);
  header.copy(output);
  return output;
}

function parameterVector(values: Float64Array): readonly (number | null)[] {
  return [null, ...Array.from(values.subarray(1))];
}

interface Fixture {
  readonly root: string;
  readonly rawManifest: string;
  readonly v2qManifest: string;
  readonly growthAsset: string;
  readonly compactLog: string;
  readonly derivedVideo: string;
  readonly posters: readonly [string, string, string];
  readonly options: GrowthComparisonBuildOptions;
  readonly manifestValue: Record<string, unknown>;
  readonly eventCount: number;
  readonly occupancySha256: string;
}

function makeFixture(label: string): Fixture {
  const root = temporaryRoot(label);
  const rawDirectory = join(root, "raw");
  const v2qDirectory = join(root, "v2q");
  const rawManifest = join(rawDirectory, "manifest.json");
  const v2qManifest = join(v2qDirectory, "manifest.json");
  mkdirSync(rawDirectory, { recursive: true });
  mkdirSync(v2qDirectory, { recursive: true });

  const center = domainCenter(DIMS);
  const seed = hexSeedSites(DIMS, 2, 1, center).sort((left, right) => left - right);
  const occupancy = new Uint8Array(DIMS.nx * DIMS.ny * DIMS.nz);
  for (const index of seed) occupancy[index] = 1;
  const occupancySha256 = digest(occupancy);
  const frames = [0, EVERY, FINAL_TICK].map((tick, index) => ({
    file: `mesh-t${String(tick).padStart(6, "0")}.bin`,
    tick,
    vertexCount: 72 + index,
    triangleCount: 140 + index,
    attachedCount: seed.length,
  }));
  const manifestValue = {
    format: "gutcheck-anim-v1",
    complete: true,
    config: {
      preset: "plate",
      dims: DIMS,
      domain: "hexPrism",
      ticks: FINAL_TICK,
      every: EVERY,
      seed: 1,
      noise: 0,
      extraction: { spacing: 0.8, sigma: 0.45, iso: 0.5, margin: 4, normalDelta: 3 },
    },
    frames,
    finalBBox: { xMin: 1, xMax: 2, yMin: 3, yMax: 4, zMin: 5, zMax: 6 },
    elapsedSeconds: 123.4,
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifestValue, null, 1));
  writeFileSync(rawManifest, manifestBytes);
  writeFileSync(v2qManifest, manifestBytes);
  for (const frame of frames) {
    writeFileSync(join(rawDirectory, frame.file), rawMeshBytes(frame));
    writeFileSync(join(v2qDirectory, frame.file), v2qMeshBytes(frame));
  }

  const params = GG_PRESETS.plate;
  const header: GrowthHeaderV1 = {
    format: GUTCHECK_GROWTH_FORMAT,
    eventCount: seed.length,
    attachedCount: seed.length,
    seedCount: seed.length,
    finalTick: FINAL_TICK,
    terminationReason: "tick-cap",
    config: {
      preset: "plate",
      dims: DIMS,
      domain: "hexPrism",
      tickCap: FINAL_TICK,
      rngSeed: 1,
      noiseEpsilon: 0,
      farField: "reflecting",
      seedRadius: 2,
      seedThickness: 1,
      center,
      params: {
        rho: params.rho,
        phi: params.phi,
        kappa: parameterVector(params.kappa),
        mu: parameterVector(params.mu),
        ggThreshBeta: parameterVector(params.ggThreshBeta),
      },
    },
    lattice: GUTCHECK_GROWTH_LATTICE,
    crop: buildPaddedGrowthCrop(seed, DIMS, 2),
    source: {
      label: "comparison builder fixture",
      legacyComparison: {
        path: rawManifest,
        sha256: digest(manifestBytes),
        frameCount: frames.length,
      },
      endpoint: {
        occupancyEncoding: "full-lattice-u8-a-field-i-fastest-j-next-k-slowest",
        measuredAttachedCount: seed.length,
        measuredOccupancySha256: occupancySha256,
        expectedAttachedCount: seed.length,
        expectedOccupancySha256: occupancySha256,
      },
    },
  };
  const growthAsset = join(root, "growth.bin");
  writeFileSync(
    growthAsset,
    encodeGrowthAsset(header, {
      flatIndices: seed,
      attachTicks: seed.map(() => 0),
    }),
  );
  const compactLog = join(root, "live.log");
  writeFileSync(
    compactLog,
    [
      `growth replay tick=100/200 attached=${seed.length} events=${seed.length} elapsed=2.5s`,
      `growth replay tick=200/200 attached=${seed.length} events=${seed.length} elapsed=5.75s`,
      `growth replay complete: events=${seed.length} tick=200 bytes=1 occupancySha256=${occupancySha256}`,
      "",
    ].join("\n"),
  );
  const derivedVideo = join(root, "proxy.mp4");
  writeFileSync(derivedVideo, "derived-video-fixture");
  const posters = [join(root, "start.webp"), join(root, "mid.webp"), join(root, "final.webp")] as const;
  posters.forEach((path, index) => writeFileSync(path, `poster-${index}`));
  const options: GrowthComparisonBuildOptions = {
    growthAssetPath: growthAsset,
    compactLogPath: compactLog,
    rawManifestPath: rawManifest,
    v2qManifestPath: v2qManifest,
    derivedVideoPath: derivedVideo,
    derivedVideoUrl: "/media/proxy.mp4",
    posters: [
      { path: posters[0], url: "/media/start.webp", videoTimeSeconds: 0 },
      { path: posters[1], url: "/media/mid.webp", videoTimeSeconds: 6.5 },
      { path: posters[2], url: "/media/final.webp", videoTimeSeconds: 13 },
    ],
    compactAssetUrl: "/media/growth.bin",
    recordedAt: "2026-08-15T22:19:04.123Z",
  };
  return {
    root,
    rawManifest,
    v2qManifest,
    growthAsset,
    compactLog,
    derivedVideo,
    posters,
    options,
    manifestValue,
    eventCount: seed.length,
    occupancySha256,
  };
}

function frameByteTotal(directory: string): number {
  return [0, 100, 200]
    .map((tick) => readFileSync(join(directory, `mesh-t${String(tick).padStart(6, "0")}.bin`)).byteLength)
    .reduce((sum, value) => sum + value, 0);
}

function canonicalRecord(): GrowthComparisonRecord {
  const manifestSha256 = "a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d";
  const occupancySha256 = "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";
  return decodeGrowthComparisonRecord({
    format: GUTCHECK_GROWTH_COMPARISON_FORMAT,
    recordedAt: "2026-08-15T22:19:04.123Z",
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
      sourceIdentity: { manifestSha256, occupancySha256 },
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
        totalBytes: 5_592_801,
        posters: [
          { tick: 0, videoTimeSeconds: 0, url: "/start.png", bytes: 1, sha256: "1".repeat(64), alt: "Run B seed" },
          { tick: 35_000, videoTimeSeconds: 6.5, url: "/middle.png", bytes: 2, sha256: "2".repeat(64), alt: "Run B midpoint" },
          { tick: 70_000, videoTimeSeconds: 13, url: "/final.png", bytes: 3, sha256: "3".repeat(64), alt: "Run B final" },
        ],
        derivedVideo: {
          url: "/run-b.mp4",
          bytes: 5_592_795,
          sha256: "a5ead695add684791f2cd2c02dc650a64d14e37a78df22606b4675f72f6a4c1f",
          durationSeconds: 16,
          frameCount: 480,
        },
      },
    },
    compact: {
      format: "gutcheck-growth-v1",
      sourceIdentity: { manifestSha256, occupancySha256 },
      asset: { url: "/growth.bin", bytes: 7_700_000, sha256: "4".repeat(64) },
      bakeElapsedSeconds: 37_501.7,
      eventCount: 961_597,
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
  });
}

function exactRunBIdentityFrom(growth: DecodedGrowthAsset): DecodedGrowthAsset {
  const occupancySha256 = "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";
  const manifest = "fixture-nas-root/out/gutcheck-gg-realism/large/anim-B/manifest.json";
  const repository = resolve(import.meta.dirname, "..", "..");
  return {
    ...growth,
    header: {
      ...growth.header,
      eventCount: 961_597,
      attachedCount: 961_597,
      seedCount: 19,
      finalTick: 70_000,
      terminationReason: "tick-cap",
      config: {
        ...growth.header.config,
        dims: { nx: 1200, ny: 1200, nz: 48 },
        tickCap: 70_000,
        center: [600, 600, 24],
      },
      crop: {
        iMin: 304,
        iMax: 896,
        jMin: 304,
        jMax: 896,
        kMin: 16,
        kMax: 32,
        padding: 2,
      },
      source: {
        label: "deterministic G-G sparse attachment replay",
        command: {
          executable: "/registered-runtime/node",
          script: `${repository}/scripts/gutcheck-bake-growth.ts`,
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
            "--legacy-manifest", manifest,
            "--expected-attached-count", "961597",
            "--expected-occupancy-sha256", occupancySha256,
          ],
          cwd: repository,
        },
        runtime: {
          node: "v24.13.1",
          v8: "13.6.233.17-node.40",
          platform: "darwin",
          architecture: "arm64",
          endianness: "LE",
        },
        git: {
          repositoryRoot: repository,
          head: "44fd4b604cddf1c1c30ed4aec2afba5bdc18be5c",
          branch: "explore/education-ch1-video",
          dirty: false,
          statusPorcelainV1: [],
        },
        legacyComparison: {
          path: manifest,
          sha256: "a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d",
          frameCount: 701,
        },
        endpoint: {
          occupancyEncoding: "full-lattice-u8-a-field-i-fastest-j-next-k-slowest",
          measuredAttachedCount: 961_597,
          measuredOccupancySha256: occupancySha256,
          expectedAttachedCount: 961_597,
          expectedOccupancySha256: occupancySha256,
        },
      },
    },
  };
}

describe("comparison record derivation", () => {
  it("accepts a custom collection mount through the documented NAS override only with the exact marker", () => {
    const fixture = collectionManifestPair("collection-layout");
    withGutcheckNasRoot(fixture.share, () => {
      expect(detectGovernedVccNasMount()).toBe(
        fixture.share.replace(/\\/gu, "/").replace(/\/*$/u, "/"),
      );
      expect(() => assertRunBManifestPairOnGovernedShare(fixture.raw, fixture.v2q)).not.toThrow();
    });

    writeFileSync(
      join(fixture.share, ".snowflake-nas.json"),
      '{"projectId":"virtual-cloud-chamber","format":"snowflake-nas-share-v1"}\n',
    );
    withGutcheckNasRoot(fixture.share, () => {
      expect(() => detectGovernedVccNasMount()).toThrow(/does not carry the exact VCC NAS marker/);
      expect(() => assertRunBManifestPairOnGovernedShare(fixture.raw, fixture.v2q)).toThrow(
        /not exactly the VCC marker|does not carry the exact VCC NAS marker/,
      );
    });
  });

  it("rejects an arbitrary collection root that merely copies the exact public marker", () => {
    const governed = collectionManifestPair("collection-governed");
    const impostor = collectionManifestPair("collection-impostor");
    withGutcheckNasRoot(governed.share, () => {
      expect(() => assertRunBManifestPairOnGovernedShare(impostor.raw, impostor.v2q)).toThrow(
        /not the detected governed VCC NAS share/,
      );
    });
  });

  it("never treats another host's mount syntax as a cwd-relative auto-detection root", () => {
    expect(vccNasCandidateMounts("darwin")).toEqual(["/Volumes/snowcrystal/"]);
    expect(vccNasCandidateMounts("win32")).toEqual(["S:/"]);
    expect(vccNasCandidateMounts("linux")).toEqual([]);

    const fixture = collectionManifestPair("collection-relative-override");
    const relativeRoot = "relative-vcc-nas-root";
    expect(isAbsolute(relativeRoot)).toBe(false);
    withGutcheckNasRoot(relativeRoot, () => {
      expect(() => assertRunBManifestPairOnGovernedShare(fixture.raw, fixture.v2q)).toThrow(
        /must be an absolute path/,
      );
    });
  });

  it("preserves the registered legacy out-path layout", () => {
    const fixture = legacyManifestPair("legacy-layout");
    withGutcheckNasRoot(fixture.share, () => {
      expect(() => assertRunBManifestPairOnGovernedShare(fixture.raw, fixture.v2q)).not.toThrow();
    });
  });

  it("requires collection manifests to share one real root and contain no symlink", () => {
    const first = collectionManifestPair("collection-first");
    const second = collectionManifestPair("collection-second");
    withGutcheckNasRoot(first.share, () => {
      expect(() => assertRunBManifestPairOnGovernedShare(first.raw, second.v2q)).toThrow(
        /not the detected governed VCC NAS share|same governed snowcrystal NAS share/,
      );
    });

    const linked = collectionManifestPair("collection-link");
    const rawDirectory = join(
      linked.share,
      "collections",
      "gutcheck-generated-public",
      "2026-08-15",
      "payload",
      "large",
      "anim-B",
    );
    const outside = temporaryRoot("collection-link-target");
    writeFileSync(join(outside, "manifest.json"), "raw-manifest");
    rmSync(rawDirectory, { recursive: true });
    symlinkSync(outside, rawDirectory, "dir");
    withGutcheckNasRoot(linked.share, () => {
      expect(() => assertRunBManifestPairOnGovernedShare(linked.raw, linked.v2q)).toThrow(
        /must not contain a symbolic link/,
      );
    });
  });

  it("derives manifest identity, exact attachment counts, occupancy, runtime, and binary frame headers", () => {
    const fixture = makeFixture("derive");
    const growth = decodeGrowthAsset(readFileSync(fixture.growthAsset));
    const parsed = parseLegacyComparisonManifest(fixture.manifestValue, growth);
    expect(parsed.config).toMatchObject({ preset: "plate", dims: DIMS, ticks: 200, every: 100 });
    expect(parsed.frames.map(({ tick, attachedCount }) => ({ tick, attachedCount }))).toEqual([
      { tick: 0, attachedCount: fixture.eventCount },
      { tick: 100, attachedCount: fixture.eventCount },
      { tick: 200, attachedCount: fixture.eventCount },
    ]);
    expect(deriveGrowthOccupancySha256(growth)).toBe(fixture.occupancySha256);
    expect(
      deriveGrowthSourceIdentity(growth, digest(readFileSync(fixture.rawManifest)), 3),
    ).toEqual({
      manifestSha256: digest(readFileSync(fixture.rawManifest)),
      occupancySha256: fixture.occupancySha256,
    });
    expect(parseCompactBakeElapsedSeconds(readFileSync(fixture.compactLog), 200, fixture.eventCount)).toBe(5.75);
    expect(measureRegularFile(fixture.growthAsset)).toMatchObject({
      bytes: readFileSync(fixture.growthAsset).byteLength,
      sha256: digest(readFileSync(fixture.growthAsset)),
    });
    parsed.frames.forEach((frame) => {
      expect(() => validateLegacyFrameFile(join(fixture.root, "raw", frame.file), frame, parsed.config, "raw")).not.toThrow();
      expect(() => validateLegacyFrameFile(join(fixture.root, "v2q", frame.file), frame, parsed.config, "v2q")).not.toThrow();
    });
    expect(frameByteTotal(join(fixture.root, "raw"))).toBeGreaterThan(0);
  });

  it("rejects incomplete, path-traversing, and compact-count-inconsistent manifests", () => {
    const fixture = makeFixture("manifest-reject");
    const growth = decodeGrowthAsset(readFileSync(fixture.growthAsset));
    const incomplete = structuredClone(fixture.manifestValue);
    incomplete["complete"] = false;
    expect(() => parseLegacyComparisonManifest(incomplete, growth)).toThrow(/must be complete/);

    const traversal = structuredClone(fixture.manifestValue);
    const frames = traversal["frames"] as Array<Record<string, unknown>>;
    frames[0]!["file"] = "../mesh-t000000.bin";
    expect(() => parseLegacyComparisonManifest(traversal, growth)).toThrow(/exact basename/);

    const wrongCount = structuredClone(fixture.manifestValue);
    const wrongFrames = wrongCount["frames"] as Array<Record<string, unknown>>;
    wrongFrames[1]!["attachedCount"] = fixture.eventCount + 1;
    expect(() => parseLegacyComparisonManifest(wrongCount, growth)).toThrow(/differs from compact event count/);
  });

  it("rejects a frame symlink and binary headers that disagree with the manifest", () => {
    const escape = makeFixture("frame-escape");
    const growth = decodeGrowthAsset(readFileSync(escape.growthAsset));
    const parsed = parseLegacyComparisonManifest(escape.manifestValue, growth);
    const target = join(escape.root, "outside.bin");
    writeFileSync(target, "outside");
    const frame = join(escape.root, "raw", "mesh-t000000.bin");
    rmSync(frame);
    symlinkSync(target, frame);
    expect(() => measureRegularFile(frame, "escaped frame")).toThrow(/symbolic link/);

    const mismatch = makeFixture("binary-header-mismatch");
    const mismatchGrowth = decodeGrowthAsset(readFileSync(mismatch.growthAsset));
    const mismatchParsed = parseLegacyComparisonManifest(mismatch.manifestValue, mismatchGrowth);
    const first = mismatchParsed.frames[0]!;
    writeFileSync(join(mismatch.root, "raw", first.file), rawMeshBytes({ ...first, vertexCount: first.vertexCount + 1 }));
    expect(() => validateLegacyFrameFile(join(mismatch.root, "raw", first.file), first, mismatchParsed.config, "raw")).toThrow(/counts differ/);

    const v2qPath = join(mismatch.root, "v2q", first.file);
    const v2qBytes = readFileSync(v2qPath);
    const marker = Buffer.from('"indexType":"u16"');
    const markerAt = v2qBytes.indexOf(marker);
    expect(markerAt).toBeGreaterThan(0);
    Buffer.from('"indexType":"u32"').copy(v2qBytes, markerAt);
    writeFileSync(v2qPath, v2qBytes);
    expect(() => validateLegacyFrameFile(v2qPath, first, mismatchParsed.config, "v2q")).toThrow(/indexType must be u16/);
  });

  it("binds the compact source manifest and independently derived full occupancy digests", () => {
    const manifestMismatch = makeFixture("source-manifest");
    const bytes = readFileSync(manifestMismatch.growthAsset);
    const headerLength = bytes.readUInt32LE(0);
    const header = JSON.parse(bytes.subarray(4, 4 + headerLength).toString().trimEnd()) as Record<string, unknown>;
    const source = header["source"] as Record<string, unknown>;
    const legacy = source["legacyComparison"] as Record<string, unknown>;
    legacy["sha256"] = "0".repeat(64);
    // Re-encoding through the public codec preserves a valid asset while changing only provenance.
    const decoded = decodeGrowthAsset(bytes);
    const changedHeader = { ...decoded.header, source } as GrowthHeaderV1;
    writeFileSync(
      manifestMismatch.growthAsset,
      encodeGrowthAsset(changedHeader, {
        flatIndices: decoded.flatIndices,
        attachTicks: decoded.attachTicks,
      }),
    );
    const changed = decodeGrowthAsset(readFileSync(manifestMismatch.growthAsset));
    expect(() => deriveGrowthSourceIdentity(changed, digest(readFileSync(manifestMismatch.rawManifest)), 3)).toThrow(/manifest digest differs/);

    const occupancyMismatch = makeFixture("source-occupancy");
    const occupancyBytes = readFileSync(occupancyMismatch.growthAsset);
    const occupancyDecoded = decodeGrowthAsset(occupancyBytes);
    const occupancySource = structuredClone(occupancyDecoded.header.source) as Record<string, unknown>;
    const endpoint = occupancySource["endpoint"] as Record<string, unknown>;
    endpoint["measuredOccupancySha256"] = "f".repeat(64);
    writeFileSync(
      occupancyMismatch.growthAsset,
      encodeGrowthAsset(
        { ...occupancyDecoded.header, source: occupancySource as GrowthHeaderV1["source"] },
        occupancyDecoded,
      ),
    );
    const occupancyChanged = decodeGrowthAsset(readFileSync(occupancyMismatch.growthAsset));
    expect(() => deriveGrowthSourceIdentity(occupancyChanged, digest(readFileSync(occupancyMismatch.rawManifest)), 3)).toThrow(/occupancy digests differ/);
  });

  it("refuses an otherwise coherent non-Run-B input before it can produce a comparison-v1 record", async () => {
    const fixture = makeFixture("run-lock");
    await expect(buildGrowthComparisonRecord(fixture.options)).rejects.toThrow(/only the exact measured Run B/);
  });

  it("locks the complete G-G parameter vector and captured launch/runtime identity", () => {
    const fixture = makeFixture("identity-lock");
    const exact = exactRunBIdentityFrom(decodeGrowthAsset(readFileSync(fixture.growthAsset)));
    expect(() => assertExactRunBGrowth(exact)).not.toThrow();

    const kappa = [...exact.header.config.params.kappa];
    kappa[1] = (kappa[1] as number) + 0.001;
    const parameterMutation: DecodedGrowthAsset = {
      ...exact,
      header: {
        ...exact.header,
        config: {
          ...exact.header.config,
          params: { ...exact.header.config.params, kappa },
        },
      },
    };
    expect(() => assertExactRunBGrowth(parameterMutation)).toThrow(/only the exact measured Run B/);

    const source = structuredClone(exact.header.source) as Record<string, unknown>;
    (source["runtime"] as Record<string, unknown>)["v8"] = "mutated-engine";
    expect(() =>
      assertExactRunBGrowth({ ...exact, header: { ...exact.header, source: source as GrowthHeaderV1["source"] } }),
    ).toThrow(/registered Run B engine/);

    expect(normalizedRunBLegacySourcePath("fixture-root/out/gutcheck-gg-realism/large/anim-B/manifest.json")).toBe(
      "fixture-root/out/gutcheck-gg-realism/large/anim-B/manifest.json",
    );
    expect(() => normalizedRunBLegacySourcePath("/tmp/out/gutcheck-gg-realism/large/not-run-b/manifest.json")).toThrow(
      /share-relative manifest/,
    );
    expect(() => normalizedRunBLegacySourcePath("nas/../out/gutcheck-gg-realism/large/anim-B/manifest.json")).toThrow(
      /traversal/,
    );
  });
});

describe("runtime and ffprobe evidence parsers", () => {
  it("requires exactly one final compact progress line with matching tick and counts", () => {
    const finalLine = "growth replay tick=200/200 attached=19 events=19 elapsed=5.75s";
    expect(parseCompactBakeElapsedSeconds(`growth replay tick=100/200 attached=19 events=19 elapsed=2s\n${finalLine}\n`, 200, 19)).toBe(5.75);
    expect(() => parseCompactBakeElapsedSeconds(`${finalLine}\n${finalLine}\n`, 200, 19)).toThrow(/exactly one/);
    expect(() => parseCompactBakeElapsedSeconds("growth replay tick=100/200 attached=19 events=19 elapsed=2s\n", 200, 19)).toThrow(/found 0/);
    expect(() => parseCompactBakeElapsedSeconds("growth replay tick=200/200 attached=20 events=20 elapsed=5s\n", 200, 19)).toThrow(/counts differ/);
    expect(() => parseCompactBakeElapsedSeconds("growth replay tick=200/201 attached=19 events=19 elapsed=5s\n", 200, 19)).toThrow(/mismatched tick cap/);
  });

  it("derives video duration and decoded frame count from strict ffprobe JSON", () => {
    expect(
      parseFfprobeVideoMetadata({
        streams: [{ width: 1280, height: 720, duration: "13.200000", nb_frames: "396", nb_read_frames: "398" }],
        format: { duration: "13.250000" },
      }),
    ).toEqual({ durationSeconds: 13.25, frameCount: 398, width: 1280, height: 720 });
    expect(() => parseFfprobeVideoMetadata({ streams: [{ width: 1, height: 1, nb_read_frames: "N/A" }], format: { duration: "13" } })).toThrow(/frame count/);
    expect(() => parseFfprobeVideoMetadata({ streams: [{ width: 1, height: 1, nb_read_frames: "398" }], format: { duration: "NaN" } })).toThrow(/duration/);
    expect(() => parseFfprobeVideoMetadata({ streams: [{ width: 1, height: 1, nb_read_frames: "398" }, { width: 1, height: 1, nb_read_frames: "1" }], format: { duration: "13" } })).toThrow(/exactly one/);
  });
});

describe("CLI and no-clobber publication", () => {
  const validCli = [
    "--growth-asset", "growth.bin",
    "--compact-log", "live.log",
    "--raw-manifest", "raw/manifest.json",
    "--v2q-manifest", "v2q/manifest.json",
    "--derived-video", "proxy.mp4",
    "--derived-video-url", "/media/proxy.mp4",
    "--poster-start-file", "start.webp",
    "--poster-start-url", "/media/start.webp",
    "--poster-start-time", "0",
    "--poster-mid-file", "mid.webp",
    "--poster-mid-url", "/media/mid.webp",
    "--poster-mid-time", "6.5",
    "--poster-final-file", "final.webp",
    "--poster-final-url", "/media/final.webp",
    "--poster-final-time", "13",
    "--compact-asset-url", "/media/growth.bin",
    "--out", "comparison.json",
  ];

  it("requires every named input and the registered poster times", () => {
    expect(parseGrowthComparisonCli(validCli)).toMatchObject({
      growthAssetPath: "growth.bin",
      compactLogPath: "live.log",
      outputPath: "comparison.json",
    });
    const missingLog = [...validCli];
    const logIndex = missingLog.indexOf("--compact-log");
    missingLog.splice(logIndex, 2);
    expect(() => parseGrowthComparisonCli(missingLog)).toThrow(/--compact-log is required/);
    const wrongTime = [...validCli];
    wrongTime[wrongTime.indexOf("6.5")] = "6.6";
    expect(() => parseGrowthComparisonCli(wrongTime)).toThrow(/must be exactly 6\.5/);
    expect(() => parseGrowthComparisonCli([...validCli, "--out", "again.json"])).toThrow(/duplicate option/);
    expect(() => parseGrowthComparisonCli([...validCli, "--unknown", "x"])).toThrow(/unknown option/);
  });

  it("publishes atomically without replacing an existing record or leaking temporaries", () => {
    const root = temporaryRoot("publish");
    const record = canonicalRecord();
    const output = join(root, "comparison.json");
    expect(publishGrowthComparisonNoClobber(output, record)).toBe(resolve(output));
    expect(decodeGrowthComparisonRecord(JSON.parse(readFileSync(output, "utf8")))).toEqual(record);
    expect(() => publishGrowthComparisonNoClobber(output, record)).toThrow();
    expect(decodeGrowthComparisonRecord(JSON.parse(readFileSync(output, "utf8")))).toEqual(record);
    expect(readdirSync(root).filter((name) => name.includes("comparison-tmp"))).toEqual([]);
  });
});
