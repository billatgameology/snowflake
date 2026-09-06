import { describe, expect, it } from "vitest";
import { readGrowthStudy, sceneEventArrival, type StudySceneHeader } from "../src/growth-study-data.ts";
import { visibleEventCount } from "../src/dendrite-data.ts";

function binary(header: object, payload: Uint8Array): ArrayBuffer {
  const json = new TextEncoder().encode(JSON.stringify(header));
  const buffer = new ArrayBuffer(4 + json.length + payload.length);
  new DataView(buffer).setUint32(0, json.length, true);
  new Uint8Array(buffer, 4, json.length).set(json);
  new Uint8Array(buffer, 4 + json.length).set(payload);
  return buffer;
}
function fixture() {
  const events = new Uint8Array(24);
  const view = new DataView(events.buffer);
  for (const [e, [flat, tick]] of [[13, 0], [14, 5], [22, 10]].entries()) {
    view.setUint32(e * 8, flat!, true); view.setUint32(e * 8 + 4, tick!, true);
  }
  const asset = new Uint8Array(binary({ format: "dendrite-presentation-v1", dims: [3, 3, 3], center: [1, 1, 1], eventCount: 3, finalTick: 10, sourceSha256: "a".repeat(64) }, events));
  const header: StudySceneHeader = {
    format: "growth-study-scene-v1", sourceSha256: "b".repeat(64), assets: [asset.length], camera: { tiltDegrees: 55, yawDegrees: 15 },
    components: [
      { asset: 0, phaseOffset: 0, transform: { translate: [0, 0, 0], rotateDegrees: [0, 0, 0], scale: 1 } },
      { asset: 0, phaseOffset: 0.25, transform: { translate: [10, 0, 0], rotateDegrees: [0, 0, 90], scale: 2 } },
    ],
  };
  return { asset, header };
}

describe("composed growth presentation", () => {
  it("matches the original player at rounded phase/tick boundaries", () => {
    for (const phase of [0, 0.03, 0.1, 0.15, 0.2]) {
      for (const tick of [1, 10, 1000, 17461, 25075]) {
        const arrival = sceneEventArrival(tick, 25075, phase);
        expect(Math.floor((arrival - phase) / (1 - phase) * 25075)).toBeGreaterThanOrEqual(tick);
        const buffer = new ArrayBuffer(8), view = new DataView(buffer);
        view.setFloat64(0, arrival); view.setBigUint64(0, view.getBigUint64(0) - 1n);
        expect(Math.floor((view.getFloat64(0) - phase) / (1 - phase) * 25075)).toBeLessThan(tick);
      }
    }
  });
  it("instances one payload under the recorded transforms and preserves delayed chronology", () => {
    const { asset, header } = fixture();
    const data = readGrowthStudy(binary(header, asset));
    expect(data.eventCount).toBe(6);
    expect(data.finalTick).toBe(1);
    expect(data.ticks).toBeInstanceOf(Float64Array);
    expect([...data.ticks]).toEqual([0, 0.25, 0.5, 0.625, 1, 1]);
    expect([...data.positions]).toEqual([0, 0, 0, 10, 0, 0, 1, 0, 0, 10, 2, 0, 0, 0, 1, 10, 0, 2]);
    expect(visibleEventCount(data.ticks, 0.25 - Number.EPSILON)).toBe(1);
    expect(visibleEventCount(data.ticks, 0.25)).toBe(2);
    expect(visibleEventCount(data.ticks, 0.625 - Number.EPSILON)).toBe(3);
    expect(visibleEventCount(data.ticks, 1)).toBe(6);
    expect(visibleEventCount(data.ticks, 0)).toBe(1);
    expect(data.extent).toBeCloseTo(Math.sqrt(104));
    expect(data.camera).toEqual(header.camera);
  });

  it("refuses missing components, bad transforms/phases, and malformed payload boundaries", () => {
    const { asset, header } = fixture();
    for (const update of [{ asset: 1 }, { phaseOffset: -0.1 }, { phaseOffset: 1 }, { transform: { translate: [0, 0], rotateDegrees: [0, 0, 0], scale: 1 } }]) {
      const bad = { ...header, components: [{ ...header.components[0], ...update }] };
      expect(() => readGrowthStudy(binary(bad, asset))).toThrow();
    }
    expect(() => readGrowthStudy(binary({ ...header, assets: [asset.length + 1] }, asset))).toThrow();
    expect(() => readGrowthStudy(binary(header, new Uint8Array([...asset, 0])))).toThrow();
  });
});
