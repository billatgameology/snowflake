import { describe, expect, it } from "vitest";
import { decodeGrowthAssetV1, visibleGrowthEventCount } from "../src/growth-asset.ts";

const encode = (events: readonly (readonly [number, number])[]): ArrayBuffer => {
  const header = new TextEncoder().encode(JSON.stringify({
    format: "gutcheck-growth-v1",
    eventCount: events.length,
    attachedCount: events.length,
    seedCount: 2,
    finalTick: 20,
    config: { dims: { nx: 4, ny: 4, nz: 2 }, center: [2, 2, 1] },
  }));
  const bytes = new Uint8Array(4 + header.length + events.length * 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, header.length, true);
  bytes.set(header, 4);
  for (const [event, [flat, tick]] of events.entries()) {
    view.setUint32(4 + header.length + event * 8, flat, true);
    view.setUint32(4 + header.length + event * 8 + 4, tick, true);
  }
  return bytes.buffer;
};

describe("gutcheck-growth-v1 browser decoder", () => {
  it("decodes strict chronological events and finds visible prefixes", () => {
    const asset = decodeGrowthAssetV1(encode([[1, 0], [2, 0], [3, 5], [7, 20]]));
    expect(asset.dims).toEqual([4, 4, 2]);
    expect(asset.center).toEqual([2, 2, 1]);
    expect(visibleGrowthEventCount(asset, 0)).toBe(2);
    expect(visibleGrowthEventCount(asset, 5)).toBe(3);
    expect(visibleGrowthEventCount(asset, 20)).toBe(4);
  });

  it("rejects out-of-range cells, unordered ticks, and malformed seed partitions", () => {
    expect(() => decodeGrowthAssetV1(encode([[1, 0], [2, 0], [32, 5]]))).toThrow(/outside dims/u);
    expect(() => decodeGrowthAssetV1(encode([[1, 0], [2, 0], [3, 10], [4, 5]]))).toThrow(
      /chronological/u,
    );
    expect(() => decodeGrowthAssetV1(encode([[1, 0], [2, 1], [3, 5]]))).toThrow(/partition/u);
  });
});
