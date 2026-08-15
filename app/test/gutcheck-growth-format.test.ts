import { describe, expect, it } from "vitest";

import {
  GUTCHECK_GROWTH_FORMAT,
  GUTCHECK_GROWTH_LATTICE,
  GUTCHECK_GROWTH_NEVER_TICK,
  buildDenseExactTickVolume,
  buildPaddedGrowthCrop,
  decodeGrowthAsset,
  encodeGrowthAsset,
  growthCropSampleWorldBounds,
  growthCropSize,
  growthFlatIndex,
  growthLatticeCoordinates,
  growthRevealWeight,
  growthSiteIsActive,
  growthVolumeOffset,
  growthWorldToLattice,
  latticeToGrowthWorld,
  sampleGrowthReveal,
  splitGrowthPlayhead,
  type DenseExactGrowthVolume,
  type GrowthHeaderV1,
  type GrowthJson,
} from "../src/gutcheck-growth-format.ts";

const dims = { nx: 11, ny: 11, nz: 9 } as const;
const center = [5, 5, 4] as const;

function fixtureSeedIndices(): number[] {
  const indices: number[] = [];
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const distance = (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
      if (distance <= 1) indices.push(growthFlatIndex(dims, center[0] + di, center[1] + dj, center[2]));
    }
  }
  return indices.sort((left, right) => left - right);
}

function fixtureColumns(): { flatIndices: Uint32Array; attachTicks: Uint32Array } {
  const seed = fixtureSeedIndices();
  return {
    flatIndices: Uint32Array.from([
      ...seed,
      growthFlatIndex(dims, 7, 5, 4),
      growthFlatIndex(dims, 3, 5, 4),
      growthFlatIndex(dims, 5, 5, 5),
    ]),
    attachTicks: Uint32Array.from([...seed.map(() => 0), 2, 5, 5]),
  };
}

const vector = (value: number): readonly (number | null)[] =>
  [null, value, value, value, value, value, value, value];

function fixtureHeader(): GrowthHeaderV1 {
  const columns = fixtureColumns();
  return {
    format: GUTCHECK_GROWTH_FORMAT,
    eventCount: columns.flatIndices.length,
    attachedCount: columns.flatIndices.length,
    seedCount: fixtureSeedIndices().length,
    finalTick: 5,
    terminationReason: "tick-cap",
    config: {
      preset: "plate",
      dims,
      domain: "hexPrism",
      tickCap: 5,
      rngSeed: 7,
      noiseEpsilon: 0,
      farField: "reflecting",
      seedRadius: 1,
      seedThickness: 1,
      center,
      params: {
        rho: 0.1,
        phi: 0,
        kappa: vector(0.1),
        mu: vector(0.001),
        ggThreshBeta: [null, 2.5, 2, 2, 2, 1, 1, 1],
      },
    },
    lattice: GUTCHECK_GROWTH_LATTICE,
    // Event extrema are i=3..7, j=4..6, k=4..5; retain two empty samples per face.
    crop: { iMin: 1, iMax: 9, jMin: 2, jMax: 8, kMin: 2, kMax: 7, padding: 2 },
    source: {
      label: "hand-authored fixture",
      gitHead: "0123456789abcdef",
      runtime: "unit-test",
      command: "fixture only",
      legacyComparison: { format: "gutcheck-anim-v1", frames: 701 },
    },
  };
}

interface MutableGrowthHeader {
  format: GrowthHeaderV1["format"];
  eventCount: number;
  attachedCount: number;
  seedCount: number;
  finalTick: number;
  terminationReason: GrowthHeaderV1["terminationReason"];
  config: {
    preset: string;
    dims: { nx: number; ny: number; nz: number };
    domain: GrowthHeaderV1["config"]["domain"];
    tickCap: number;
    rngSeed: number;
    noiseEpsilon: number;
    farField: GrowthHeaderV1["config"]["farField"];
    seedRadius: number;
    seedThickness: number;
    center: [number, number, number];
    params: {
      rho: number;
      phi: number;
      kappa: (number | null)[];
      mu: (number | null)[];
      ggThreshBeta: (number | null)[];
    };
  };
  lattice: {
    indexOrder: GrowthHeaderV1["lattice"]["indexOrder"];
    embedding: GrowthHeaderV1["lattice"]["embedding"];
  };
  crop: { iMin: number; iMax: number; jMin: number; jMax: number; kMin: number; kMax: number; padding: number };
  source: { label: string; [key: string]: GrowthJson };
}

function cloneHeader(): MutableGrowthHeader {
  return structuredClone(fixtureHeader()) as unknown as MutableGrowthHeader;
}

function canonicalJson(value: GrowthJson): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as { readonly [key: string]: GrowthJson };
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key]!)}`)
    .join(",")}}`;
}

/** Independent fixture writer: it does not call the production encoder. */
function manualAsset(
  header: GrowthHeaderV1 | MutableGrowthHeader = fixtureHeader(),
  columns = fixtureColumns(),
): Uint8Array {
  const raw = new TextEncoder().encode(canonicalJson(header as unknown as GrowthJson));
  const headerLength = Math.ceil(raw.length / 4) * 4;
  const bytes = new Uint8Array(4 + headerLength + columns.flatIndices.length * 8);
  bytes.fill(0x20, 4, 4 + headerLength);
  bytes.set(raw, 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, headerLength, true);
  let offset = 4 + headerLength;
  for (let event = 0; event < columns.flatIndices.length; event++) {
    view.setUint32(offset, columns.flatIndices[event]!, true);
    view.setUint32(offset + 4, columns.attachTicks[event]!, true);
    offset += 8;
  }
  return bytes;
}

describe("gutcheck-growth-v1 codec", () => {
  it("decodes a hand-authored little-endian fixture", () => {
    const bytes = manualAsset();
    const decoded = decodeGrowthAsset(bytes);

    expect(decoded.header).toEqual(fixtureHeader());
    expect(Array.from(decoded.flatIndices)).toEqual(Array.from(fixtureColumns().flatIndices));
    expect(Array.from(decoded.attachTicks)).toEqual(Array.from(fixtureColumns().attachTicks));
    const headerLength = new DataView(bytes.buffer).getUint32(0, true);
    const firstPayloadIndex = new DataView(bytes.buffer).getUint32(4 + headerLength, true);
    expect(firstPayloadIndex).toBe(fixtureSeedIndices()[0]);
  });

  it("encodes canonical, deterministic bytes independent of source key insertion order", () => {
    const columns = fixtureColumns();
    const first = encodeGrowthAsset(fixtureHeader(), columns);
    const reordered = cloneHeader();
    reordered.source = {
      legacyComparison: { frames: 701, format: "gutcheck-anim-v1" },
      command: "fixture only",
      runtime: "unit-test",
      gitHead: "0123456789abcdef",
      label: "hand-authored fixture",
    };
    const second = encodeGrowthAsset(reordered, columns);

    expect(second).toEqual(first);
    expect(first).toEqual(manualAsset());
  });

  it("decodes a non-zero-offset byte view without reading adjacent bytes", () => {
    const asset = manualAsset();
    const carrying = new Uint8Array(asset.length + 11).fill(0xa5);
    carrying.set(asset, 7);
    const decoded = decodeGrowthAsset(carrying.subarray(7, 7 + asset.length));
    expect(decoded.header.eventCount).toBe(fixtureHeader().eventCount);
  });

  it.each([
    ["truncated header length", (bytes: Uint8Array) => bytes.subarray(0, 3), /header-length word/],
    ["truncated header", (bytes: Uint8Array) => bytes.subarray(0, 12), /truncated inside the header/],
    ["truncated payload", (bytes: Uint8Array) => bytes.subarray(0, -1), /truncated inside the event payload/],
    ["trailing payload", (bytes: Uint8Array) => Uint8Array.from([...bytes, 0]), /trailing bytes/],
  ] as const)("rejects %s", (_label, mutate, pattern) => {
    expect(() => decodeGrowthAsset(mutate(manualAsset()))).toThrow(pattern);
  });

  it("rejects an unaligned header, invalid UTF-8, invalid JSON, and noncanonical JSON", () => {
    const unaligned = manualAsset();
    new DataView(unaligned.buffer).setUint32(0, 3, true);
    expect(() => decodeGrowthAsset(unaligned)).toThrow(/multiple of four/);

    const invalidUtf8 = manualAsset();
    invalidUtf8[4] = 0xff;
    expect(() => decodeGrowthAsset(invalidUtf8)).toThrow(/valid UTF-8/);

    const invalidJson = manualAsset();
    invalidJson[4] = "!".charCodeAt(0);
    expect(() => decodeGrowthAsset(invalidJson)).toThrow(/valid JSON/);

    const header = fixtureHeader();
    const noncanonicalText = JSON.stringify(header);
    const raw = new TextEncoder().encode(noncanonicalText);
    const padded = Math.ceil(raw.length / 4) * 4;
    const bytes = new Uint8Array(4 + padded + fixtureColumns().flatIndices.length * 8);
    bytes.fill(0x20, 4, 4 + padded);
    bytes.set(raw, 4);
    new DataView(bytes.buffer).setUint32(0, padded, true);
    expect(() => decodeGrowthAsset(bytes)).toThrow(/not canonical/);
  });
});

describe("strict header and event validation", () => {
  const rawWith = (
    changeHeader?: (header: MutableGrowthHeader) => void,
    changeColumns?: (columns: { flatIndices: Uint32Array; attachTicks: Uint32Array }) => void,
  ): Uint8Array => {
    const header = cloneHeader();
    const columns = fixtureColumns();
    changeHeader?.(header);
    changeColumns?.(columns);
    return manualAsset(header, columns);
  };

  it("rejects a duplicate index even when it reappears on a later tick", () => {
    expect(() =>
      decodeGrowthAsset(rawWith(undefined, (columns) => {
        columns.flatIndices[columns.flatIndices.length - 1] = fixtureSeedIndices().at(-1)!;
      })),
    ).toThrow(/duplicate flat index/);
  });

  it("rejects descending ticks and descending indices within a tick", () => {
    expect(() =>
      decodeGrowthAsset(rawWith(undefined, (columns) => {
        columns.attachTicks[columns.attachTicks.length - 1] = 1;
      })),
    ).toThrow(/sorted by tick/);

    expect(() =>
      decodeGrowthAsset(rawWith(undefined, (columns) => {
        const last = columns.flatIndices.length - 1;
        columns.flatIndices[last] = growthFlatIndex(dims, 2, 5, 4);
      })),
    ).toThrow(/sorted by tick/);
  });

  it("rejects indices outside the lattice and inside an inactive hexPrism wall", () => {
    expect(() =>
      decodeGrowthAsset(rawWith(undefined, (columns) => {
        columns.flatIndices[fixtureSeedIndices().length] = dims.nx * dims.ny * dims.nz;
      })),
    ).toThrow(/outside the configured lattice/);

    expect(() =>
      decodeGrowthAsset(rawWith(undefined, (columns) => {
        columns.flatIndices[fixtureSeedIndices().length] = growthFlatIndex(dims, 0, 0, 4);
      })),
    ).toThrow(/inactive domain wall/);
  });

  it("rejects a shifted/missing seed and seed-count mismatch", () => {
    expect(() =>
      decodeGrowthAsset(rawWith(undefined, (columns) => {
        columns.flatIndices[0] = growthFlatIndex(dims, 3, 5, 4);
      })),
    ).toThrow(/canonical seed|sorted by tick/);

    expect(() => decodeGrowthAsset(rawWith((header) => (header.seedCount = 6)))).toThrow(
      /seedCount differs/,
    );
  });

  it("rejects count, termination, crop, lattice, parameter, and source inconsistencies", () => {
    expect(() => decodeGrowthAsset(rawWith((header) => (header.attachedCount--)))).toThrow(
      /attachedCount must equal/,
    );
    expect(() => decodeGrowthAsset(rawWith((header) => (header.finalTick--)))).toThrow(
      /tick-cap termination/,
    );
    expect(() => decodeGrowthAsset(rawWith((header) => (header.crop.iMin++)))).toThrow(
      /event-derived padded crop/,
    );
    expect(() =>
      decodeGrowthAsset(rawWith((header) => {
        header.lattice = { ...header.lattice, embedding: "wrong" as never };
      })),
    ).toThrow(/lattice description/);
    expect(() =>
      decodeGrowthAsset(rawWith((header) => {
        header.config.params.kappa = [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
      })),
    ).toThrow(/\[0\] must be null/);
    expect(() =>
      decodeGrowthAsset(rawWith((header) => {
        header.source.label = "";
      })),
    ).toThrow(/source.label/);
  });

  it("reserves uint32 max exclusively for never-attached dense samples", () => {
    expect(() =>
      decodeGrowthAsset(rawWith((header) => {
        header.config.tickCap = GUTCHECK_GROWTH_NEVER_TICK;
        header.finalTick = GUTCHECK_GROWTH_NEVER_TICK;
      })),
    ).toThrow(/finalTick|config.tickCap/);

    const columns = fixtureColumns();
    columns.attachTicks[columns.attachTicks.length - 1] = GUTCHECK_GROWTH_NEVER_TICK;
    expect(() => encodeGrowthAsset(fixtureHeader(), columns)).toThrow(/attachTicks/);
  });

  it("rejects unsafe lattice and decoded-volume allocation declarations before payload use", () => {
    expect(() =>
      decodeGrowthAsset(rawWith((header) => {
        header.config.dims = { nx: 65_536, ny: 65_536, nz: 2 };
        header.config.center = [32_768, 32_768, 1];
      })),
    ).toThrow(/lattice cell count exceeds/);

    expect(() =>
      decodeGrowthAsset(rawWith((header) => {
        header.config.dims = { nx: 600, ny: 600, nz: 400 };
        header.config.center = [300, 300, 200];
        header.crop = { iMin: 0, iMax: 599, jMin: 0, jMax: 599, kMin: 0, kMax: 399, padding: 2 };
      })),
    ).toThrow(/decoded volume cell count exceeds/);
  });

  it("rejects non-JSON provenance at encode time", () => {
    const header = cloneHeader();
    (header.source as Record<string, unknown>)["bad"] = Number.POSITIVE_INFINITY;
    expect(() => encodeGrowthAsset(header, fixtureColumns())).toThrow(/non-finite/);
  });
});

describe("crop, exact arrival volume, and reveal shadow", () => {
  it("derives the exact two-cell padded crop and refuses an edge-clipped crop", () => {
    const columns = fixtureColumns();
    expect(buildPaddedGrowthCrop(columns.flatIndices, dims, 2)).toEqual(fixtureHeader().crop);
    const touchingEdge = Uint32Array.of(growthFlatIndex(dims, 1, 5, 4));
    expect(() => buildPaddedGrowthCrop(touchingEdge, dims, 2)).toThrow(/padding cells on every face/);
  });

  it("expands exact attachment ticks into uint32 storage with an exclusive empty sentinel", () => {
    const decoded = decodeGrowthAsset(manualAsset());
    const volume = buildDenseExactTickVolume(decoded);
    expect(volume.size).toEqual([9, 7, 6]);
    expect(volume.data).toBeInstanceOf(Uint32Array);
    expect(volume.data.filter((value) => value !== GUTCHECK_GROWTH_NEVER_TICK)).toHaveLength(
      decoded.header.eventCount,
    );
    for (let event = 0; event < decoded.header.eventCount; event++) {
      const [i, j, k] = growthLatticeCoordinates(dims, decoded.flatIndices[event]!);
      expect(volume.data[growthVolumeOffset(volume.crop, i, j, k)!]).toBe(
        decoded.attachTicks[event],
      );
    }
    expect(volume.data[growthVolumeOffset(volume.crop, 1, 2, 2)!]).toBe(
      GUTCHECK_GROWTH_NEVER_TICK,
    );
  });

  it("keeps never-attached samples invisible and triangularly smooths a visible/empty edge", () => {
    const volume = buildDenseExactTickVolume(decodeGrowthAsset(manualAsset()));
    const seed = growthLatticeCoordinates(dims, fixtureSeedIndices()[0]!);
    expect(growthRevealWeight(GUTCHECK_GROWTH_NEVER_TICK, 5, 4)).toBe(0);
    expect(growthRevealWeight(0, 0, 4)).toBe(1);
    expect(sampleGrowthReveal(volume, seed, 5, 0)).toBe(1);
    expect(sampleGrowthReveal(volume, [seed[0] - 0.5, seed[1], seed[2]], 5, 0)).toBeCloseTo(0.5, 12);
    expect(sampleGrowthReveal(volume, [0, 0, 0], 5, 0)).toBe(0);
  });

  it("splits playheads so attachment causality remains exact above float32 integer precision", () => {
    const arrivalTick = 16_777_217;
    const before = splitGrowthPlayhead(arrivalTick - 0.25, arrivalTick + 10);
    const at = splitGrowthPlayhead(arrivalTick, arrivalTick + 10);
    const after = splitGrowthPlayhead(arrivalTick + 0.25, arrivalTick + 10);
    expect(before).toEqual({ wholeTick: arrivalTick - 1, offsetTicks: 0.75 });
    expect(at).toEqual({ wholeTick: arrivalTick, offsetTicks: 0 });
    expect(after).toEqual({ wholeTick: arrivalTick, offsetTicks: 0.25 });
    expect(arrivalTick > before.wholeTick).toBe(true);
    expect(growthRevealWeight(arrivalTick, arrivalTick - 0.25, 4)).toBe(0);
    expect(growthRevealWeight(arrivalTick, arrivalTick, 4)).toBe(0);
    expect(growthRevealWeight(arrivalTick, arrivalTick + 0.25, 4)).toBeGreaterThan(0);
  });

  it("keeps the triangular-prism reveal field invariant under a 60-degree lattice rotation", () => {
    const crop = { iMin: 0, iMax: 10, jMin: 0, jMax: 10, kMin: 3, kMax: 5, padding: 2 } as const;
    const data = new Uint32Array(11 * 11 * 3);
    data.fill(GUTCHECK_GROWTH_NEVER_TICK);
    for (let dj = -2; dj <= 2; dj++) {
      for (let di = -2; di <= 2; di++) {
        const distance = (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
        if (distance <= 2) data[growthVolumeOffset(crop, 5 + di, 5 + dj, 4)!] = 0;
      }
    }
    const volume: DenseExactGrowthVolume = {
      data,
      crop,
      size: [11, 11, 3],
      finalTick: 0,
      neverTick: GUTCHECK_GROWTH_NEVER_TICK,
    };
    let classifications = 0;
    let fractionalSamples = 0;
    let maximumError = 0;
    for (let djStep = -28; djStep <= 28; djStep++) {
      for (let diStep = -28; diStep <= 28; diStep++) {
        const di = diStep / 8;
        const dj = djStep / 8;
        const value = sampleGrowthReveal(volume, [5 + di, 5 + dj, 4], 0, 0);
        const rotated = sampleGrowthReveal(volume, [5 - dj, 5 + di + dj, 4], 0, 0);
        maximumError = Math.max(maximumError, Math.abs(value - rotated));
        if (value > 0 && value < 1) fractionalSamples++;
        if ((value >= 0.36) === (rotated >= 0.36)) classifications++;
      }
    }
    expect(fractionalSamples).toBeGreaterThan(100);
    expect(maximumError).toBeLessThan(1e-12);
    expect(classifications).toBe(57 * 57);
  });
});

describe("lattice and world mappings", () => {
  it("round-trips flat indices in i-fast order", () => {
    for (const point of [[0, 0, 0], [10, 10, 8], [7, 5, 4]] as const) {
      expect(growthLatticeCoordinates(dims, growthFlatIndex(dims, point[0], point[1], point[2]))).toEqual(point);
    }
  });

  it("round-trips the triangular-lattice embedding and derives crop sample bounds", () => {
    const point = [7.25, 4.5, 3.75] as const;
    const world = latticeToGrowthWorld(point);
    const restored = growthWorldToLattice(world);
    expect(restored[0]).toBeCloseTo(point[0], 12);
    expect(restored[1]).toBeCloseTo(point[1], 12);
    expect(restored[2]).toBeCloseTo(point[2], 12);
    const bounds = growthCropSampleWorldBounds(fixtureHeader().crop);
    expect(bounds.min).toEqual(latticeToGrowthWorld([1, 2, 2]));
    expect(bounds.max).toEqual(latticeToGrowthWorld([9, 8, 7]));
  });

  it("distinguishes an active hexPrism site from an in-range wall site", () => {
    const config = fixtureHeader().config;
    expect(growthSiteIsActive(config, growthFlatIndex(dims, 7, 5, 4))).toBe(true);
    expect(growthSiteIsActive(config, growthFlatIndex(dims, 0, 0, 4))).toBe(false);
  });

  it("reports crop dimensions in x/y/layer order", () => {
    expect(growthCropSize(fixtureHeader().crop)).toEqual([9, 7, 6]);
  });
});
