import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readDendrite, visibleEventCount } from "../src/dendrite-data.ts";

const fixture = readFileSync(new URL("../data/dendrite-study.bin", import.meta.url));
const buffer = (): ArrayBuffer => Uint8Array.from(fixture).buffer;

describe("dendrite presentation playback", () => {
  it("reads the shipped record, including its seed, endpoint and source identity", () => {
    const data = readDendrite(buffer());
    // Source identity and endpoint: out/growth-assets/sweep-t1-sharp-growth-v1.bin.
    expect(data.sourceSha256).toBe("8615928490192af7442b27bb7c2a6731c501a148774e0f95b1ef8c1d8fa15073");
    expect(data.eventCount).toBe(220982);
    expect(data.finalTick).toBe(7438);
    expect(visibleEventCount(data.ticks, 0)).toBe(19);
    expect(visibleEventCount(data.ticks, data.finalTick)).toBe(data.eventCount);
    for (const fraction of [0.12, 0.57, 0.92, 0.21]) {
      const tick = data.finalTick * fraction;
      // Independently enumerate membership rather than repeat the binary search.
      const expected = Array.from(data.ticks).filter(value => value <= tick).length;
      expect(visibleEventCount(data.ticks, tick)).toBe(expected);
    }
  });

  it("keeps simultaneous arrivals together and never rounds a future arrival early", () => {
    const ticks = new Float32Array([0, 0, 7, 7, 8, 19]);
    expect(visibleEventCount(ticks, 6.99999)).toBe(2);
    expect(visibleEventCount(ticks, 7)).toBe(4);
    expect(visibleEventCount(ticks, 18.99999)).toBe(5);
  });

  it("rejects truncated, duplicate and out-of-range event payloads", () => {
    expect(() => readDendrite(buffer().slice(0, -1))).toThrow(/truncated/);
    const duplicate = buffer();
    const view = new DataView(duplicate);
    const offset = 4 + view.getUint32(0, true);
    view.setUint32(offset + 8, view.getUint32(offset, true), true);
    expect(() => readDendrite(duplicate)).toThrow(/duplicate/);
    const future = buffer();
    new DataView(future).setUint32(offset + 4, 999999, true);
    expect(() => readDendrite(future)).toThrow(/out-of-range/);
  });
});
