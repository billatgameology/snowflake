import { describe, expect, it } from "vitest";

import {
  GUTCHECK_GROWTH_COMPARISON_FORMAT,
  decodeGrowthComparisonRecord,
  type GrowthComparisonRecord,
} from "../src/gutcheck-growth-comparison-record.ts";

const MANIFEST_SHA256 = "a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d";
const OCCUPANCY_SHA256 = "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";

const validFixture = {
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
    sourceIdentity: {
      manifestSha256: MANIFEST_SHA256,
      occupancySha256: OCCUPANCY_SHA256,
    },
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
      totalBytes: 5_598_795,
      posters: [
        {
          tick: 0,
          videoTimeSeconds: 0,
          url: "/media/run-b-start.webp",
          bytes: 1_000,
          sha256: "1".repeat(64),
          alt: "Run B seed at tick zero",
        },
        {
          tick: 35_000,
          videoTimeSeconds: 6.5,
          url: "media/run-b-middle.webp",
          bytes: 2_000,
          sha256: "2".repeat(64),
          alt: "Run B growth at the arithmetic midpoint",
        },
        {
          tick: 70_000,
          videoTimeSeconds: 13,
          url: "../media/run-b-final.webp",
          bytes: 3_000,
          sha256: "3".repeat(64),
          alt: "Run B final attached-cell state",
        },
      ],
      derivedVideo: {
        url: "/media/run-b-viewing-proxy.mp4?version=1#video",
        bytes: 5_592_795,
        sha256: "a5ead695add684791f2cd2c02dc650a64d14e37a78df22606b4675f72f6a4c1f",
        durationSeconds: 16,
        frameCount: 480,
      },
    },
  },
  compact: {
    format: "gutcheck-growth-v1",
    sourceIdentity: {
      manifestSha256: MANIFEST_SHA256,
      occupancySha256: OCCUPANCY_SHA256,
    },
    asset: {
      url: "/media/gutcheck-growth-v1.bin",
      bytes: 7_700_000,
      sha256: "5".repeat(64),
    },
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
} as const satisfies GrowthComparisonRecord;

type MutableObject = Record<string, unknown>;

function cloneFixture(): MutableObject {
  return structuredClone(validFixture) as unknown as MutableObject;
}

function objectAt(root: unknown, ...path: readonly string[]): MutableObject {
  let cursor = root;
  for (const part of path) {
    if (cursor === null || typeof cursor !== "object" || Array.isArray(cursor)) {
      throw new Error(`test fixture path is not an object: ${path.join(".")}`);
    }
    cursor = (cursor as MutableObject)[part];
  }
  if (cursor === null || typeof cursor !== "object" || Array.isArray(cursor)) {
    throw new Error(`test fixture path is not an object: ${path.join(".")}`);
  }
  return cursor as MutableObject;
}

function postersAt(root: unknown): unknown[] {
  const value = objectAt(root, "legacy", "lightweightMedia")["posters"];
  if (!Array.isArray(value)) throw new Error("test fixture posters are not an array");
  return value;
}

function changed(change: (value: MutableObject) => void): unknown {
  const value = cloneFixture();
  change(value);
  return value;
}

describe("gutcheck-growth-comparison-v1 decoder", () => {
  it("accepts and copies the canonical measured Run B fixture", () => {
    const decoded = decodeGrowthComparisonRecord(validFixture);

    expect(decoded).toEqual(validFixture);
    expect(decoded).not.toBe(validFixture);
    expect(decoded.legacy.rawSequence.totalBytes).toBe(9_986_632_571);
    expect(decoded.compact.crop.r32uiBytes).toBe(23_912_132);
    expect(decoded.legacy.lightweightMedia.posters.map((poster) => poster.tick)).toEqual([
      0, 35_000, 70_000,
    ]);
  });

  it("rejects missing or unknown keys at the root and nested boundaries", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          delete value["recordedAt"];
        }),
      ),
    ).toThrow(/record keys must be exactly/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "asset")["contentType"] = "application/octet-stream";
        }),
      ),
    ).toThrow(/compact\.asset keys must be exactly/);

    expect(() => decodeGrowthComparisonRecord([])).toThrow(/record must be a plain object/);
    expect(() => decodeGrowthComparisonRecord(Object.create({ format: GUTCHECK_GROWTH_COMPARISON_FORMAT }))).toThrow(
      /record must be a plain object/,
    );
  });

  it("rejects wrong format labels, a noncanonical timestamp, and an impossible instant", () => {
    expect(() =>
      decodeGrowthComparisonRecord(changed((value) => (value["format"] = "gutcheck-growth-v2"))),
    ).toThrow(/format must be gutcheck-growth-comparison-v1/);

    expect(() =>
      decodeGrowthComparisonRecord(changed((value) => (value["recordedAt"] = "2026-08-15T22:19:04Z"))),
    ).toThrow(/millisecond precision/);

    expect(() =>
      decodeGrowthComparisonRecord(changed((value) => (value["recordedAt"] = "2026-02-30T00:00:00.000Z"))),
    ).toThrow(/real ISO 8601 UTC instant/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => (objectAt(value, "legacy")["format"] = "gutcheck-anim-v2")),
      ),
    ).toThrow(/legacy\.format/);
  });

  it("rejects malformed, uppercase, and mismatched source-identity digests", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "sourceIdentity")["manifestSha256"] = "a".repeat(63);
        }),
      ),
    ).toThrow(/lowercase 64-character SHA-256/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "sourceIdentity")["occupancySha256"] = "A".repeat(64);
        }),
      ),
    ).toThrow(/lowercase 64-character SHA-256/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "sourceIdentity")["manifestSha256"] = "b".repeat(64);
        }),
      ),
    ).toThrow(/source identities must match exactly/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "sourceIdentity")["occupancySha256"] = "c".repeat(64);
        }),
      ),
    ).toThrow(/source identities must match exactly/);
  });

  it.each([
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:video/mp4;base64,AAAA"],
    ["cross-origin absolute URL", "https://example.com/video.mp4"],
    ["protocol-relative authority", "//example.com/video.mp4"],
    ["credential-bearing authority", "https://user:secret@example.com/video.mp4"],
    ["backslash authority ambiguity", "\\\\example.com\\video.mp4"],
    ["leading whitespace", " /media/video.mp4"],
  ] as const)("rejects a %s", (_label, url) => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "lightweightMedia", "derivedVideo")["url"] = url;
        }),
      ),
    ).toThrow(/root-relative or relative URL/);
  });

  it("rejects non-finite, unsafe, zero, and negative measured values", () => {
    const cases: readonly [string, (value: MutableObject) => void][] = [
      ["zero dimension", (value) => (objectAt(value, "run", "dims")["nx"] = 0)],
      ["unsafe RNG seed", (value) => (objectAt(value, "run")["rngSeed"] = Number.MAX_SAFE_INTEGER + 1)],
      ["non-finite noise", (value) => (objectAt(value, "run")["noiseEpsilon"] = Number.NaN)],
      ["zero frame bytes", (value) => (objectAt(value, "legacy", "rawSequence")["frameBytes"] = 0)],
      [
        "non-finite generation time",
        (value) => (objectAt(value, "legacy", "v2qSequence")["generationSeconds"] = Infinity),
      ],
      [
        "negative video duration",
        (value) =>
          (objectAt(value, "legacy", "lightweightMedia", "derivedVideo")["durationSeconds"] = -1),
      ],
      ["unsafe event count", (value) => (objectAt(value, "compact")["eventCount"] = Number.MAX_SAFE_INTEGER + 1)],
      ["zero bake time", (value) => (objectAt(value, "compact")["bakeElapsedSeconds"] = 0)],
    ];

    for (const [label, change] of cases) {
      expect(() => decodeGrowthComparisonRecord(changed(change)), label).toThrow();
    }
  });

  it("rejects sequence byte-total and Run B frame-count inconsistencies", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "rawSequence")["totalBytes"] = 9_986_632_570;
        }),
      ),
    ).toThrow(/frameBytes plus manifestBytes/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "rawSequence")["frameCount"] = 700;
        }),
      ),
    ).toThrow(/tick-range count 701/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "v2qSequence")["frameCount"] = 702;
        }),
      ),
    ).toThrow(/tick-range count 701/);
  });

  it("rejects bad first/final ticks and a cadence that cannot produce whole frames", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "run")["firstTick"] = 1;
        }),
      ),
    ).toThrow(/firstTick must be zero/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "run")["tickInterval"] = 99;
        }),
      ),
    ).toThrow(/evenly divisible/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact")["finalTick"] = 69_999;
        }),
      ),
    ).toThrow(/must match the shared Run B tick range/);
  });

  it("requires exactly three distinct first/midpoint/final poster references", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          postersAt(value).pop();
        }),
      ),
    ).toThrow(/must contain exactly/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(postersAt(value)[1])["tick"] = 35_001;
        }),
      ),
    ).toThrow(/posters\[1\]\.tick must be 35000/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(postersAt(value)[2])["url"] = "/media/run-b-start.webp";
        }),
      ),
    ).toThrow(/three distinct URLs/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(postersAt(value)[1])["videoTimeSeconds"] = 13.5;
        }),
      ),
    ).toThrow(/video times must be strictly increasing/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(postersAt(value)[2])["videoTimeSeconds"] = 16.1;
        }),
      ),
    ).toThrow(/cannot exceed the derived video duration/);
  });

  it("rejects an inconsistent lightweight-reference total or a missing derived video", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "lightweightMedia")["totalBytes"] = 9_999;
        }),
      ),
    ).toThrow(/derived video and three poster byte counts/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          delete objectAt(value, "legacy", "lightweightMedia")["derivedVideo"];
        }),
      ),
    ).toThrow(/lightweightMedia keys must be exactly/);
  });

  it("rejects an asset too short for its events", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "asset")["bytes"] = 100;
        }),
      ),
    ).toThrow(/too small to contain/);
  });

  it("rejects syntactically valid records that are not the pinned Run B comparison", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "run", "dims")["nx"] = 1199;
        }),
      ),
    ).toThrow(/locked to the exact Run B/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "v2qSequence")["frameBytes"] = 6_622_097_199;
          objectAt(value, "legacy", "v2qSequence")["totalBytes"] = 6_622_194_702;
        }),
      ),
    ).toThrow(/pinned Run B bytes and runtime/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "lightweightMedia", "derivedVideo")["sha256"] = "4".repeat(64);
        }),
      ),
    ).toThrow(/pinned Run B viewing derivative/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "rawSequence")["generationSeconds"] = 41_193;
        }),
      ),
    ).toThrow(/pinned Run B manifest bytes and runtime/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "legacy", "sourceIdentity")["manifestSha256"] = "b".repeat(64);
          objectAt(value, "compact", "sourceIdentity")["manifestSha256"] = "b".repeat(64);
        }),
      ),
    ).toThrow(/pinned Run B manifest and occupancy digests/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact")["eventCount"] = 961_596;
        }),
      ),
    ).toThrow(/pinned Run B endpoint and padded crop/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          const crop = objectAt(value, "compact", "crop");
          crop["iMin"] = 303;
          crop["sampleCount"] = 5_988_114;
          crop["r32uiBytes"] = 23_952_456;
        }),
      ),
    ).toThrow(/pinned Run B endpoint and padded crop/);
  });

  it("re-derives inclusive crop samples and exact R32UI allocation bytes", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "crop")["sampleCount"] = 5_978_032;
        }),
      ),
    ).toThrow(/inclusive crop-dimension product/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "crop")["r32uiBytes"] = 23_912_131;
        }),
      ),
    ).toThrow(/sampleCount times four bytes/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact", "crop")["iMax"] = 1_200;
        }),
      ),
    ).toThrow(/compact\.crop\.iMax/);

    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          const crop = objectAt(value, "compact", "crop");
          crop["iMin"] = 897;
          crop["iMax"] = 896;
        }),
      ),
    ).toThrow(/minima must not exceed maxima/);
  });

  it("rejects an event count that cannot fit the declared crop", () => {
    expect(() =>
      decodeGrowthComparisonRecord(
        changed((value) => {
          objectAt(value, "compact")["eventCount"] = 5_978_034;
          objectAt(value, "compact", "asset")["bytes"] = 50_000_000;
        }),
      ),
    ).toThrow(/eventCount cannot exceed/);
  });
});
