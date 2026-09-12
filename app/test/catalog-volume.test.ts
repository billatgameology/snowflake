import { describe, expect, it } from "vitest";
import { Vector3 } from "three";

import {
  catalogCameraDirection,
  catalogCameraUp,
  catalogComponentMatrix,
  catalogVolumeMatrix,
} from "../src/catalog-volume/geometry.ts";
import {
  buildGrowthVolume,
  decodeGrowthAsset,
  NEVER_TICK,
} from "../src/catalog-volume/growthAsset.ts";
import type { GrowthSceneComponentV1 } from "../src/growth-scene.ts";

const encodeGrowth = (): ArrayBuffer => {
  const nx = 8;
  const ny = 8;
  const events = [
    { flat: 2 + 2 * nx + 1 * nx * ny, tick: 0 },
    { flat: 3 + 3 * nx + 2 * nx * ny, tick: 1 },
    { flat: 4 + 4 * nx + 3 * nx * ny, tick: 2 },
  ];
  const header = new TextEncoder().encode(JSON.stringify({
    format: "gutcheck-growth-v1",
    eventCount: events.length,
    attachedCount: events.length,
    seedCount: 1,
    finalTick: 2,
    terminationReason: "fixture",
    crop: { iMin: 2, iMax: 4, jMin: 2, jMax: 4, kMin: 1, kMax: 3, padding: 0 },
    config: {
      preset: "volume fixture",
      dims: { nx, ny, nz: 5 },
      center: [3, 3, 2],
      domain: "hexPrism",
      tickCap: 2,
      rngSeed: 1,
      noiseEpsilon: 0,
      seedRadius: 0,
      seedThickness: 0,
    },
    source: { label: "volume fixture" },
  }));
  const bytes = new Uint8Array(4 + header.byteLength + events.length * 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, header.byteLength, true);
  bytes.set(header, 4);
  events.forEach((event, index) => {
    view.setUint32(4 + header.byteLength + index * 8, event.flat, true);
    view.setUint32(8 + header.byteLength + index * 8, event.tick, true);
  });
  return bytes.buffer;
};

const component = (): GrowthSceneComponentV1 => ({
  id: "fixture",
  growthAsset: { url: "/growth.bin", byteLength: 1, sha256: "a".repeat(64) },
  scientificBundle: { locator: "fixture", identitySha256: "b".repeat(64) },
  transform: { translate: [3, -4, 5], rotateDegrees: [0, 0, 90], scale: 2 },
  phaseOffset: 0,
});

describe("catalog volume presentation", () => {
  it("strictly decodes attachment events and scatters them into the registered crop", () => {
    const asset = decodeGrowthAsset(encodeGrowth());
    expect(asset.header.config.center).toEqual([3, 3, 2]);
    const volume = buildGrowthVolume(asset);
    expect(volume.size).toEqual([3, 3, 3]);
    expect(volume.data.filter((tick) => tick !== NEVER_TICK)).toEqual(new Uint32Array([0, 1, 2]));
  });

  it("centers the sheared crop on the solver seed and preserves component transforms", () => {
    const local = catalogVolumeMatrix({
      size: [5, 5, 3],
      crop: { iMin: 8, jMin: 8, kMin: 4 },
      center: [10, 10, 5],
      decimation: 1,
    });
    expect(new Vector3(0.5, 0.5, 0.5).applyMatrix4(local).length()).toBeLessThan(1e-12);
    const composed = catalogComponentMatrix(component()).multiply(local);
    const transformed = new Vector3(0.5, 0.5, 0.5).applyMatrix4(composed);
    expect(transformed.x).toBeCloseTo(3, 12);
    expect(transformed.y).toBeCloseTo(-4, 12);
    expect(transformed.z).toBeCloseTo(5, 12);
  });

  it("keeps the perspective camera up vector orthogonal to its viewing direction", () => {
    for (const [yaw, tilt] of [[0, 10], [47, 42], [233, 68]]) {
      expect(Math.abs(catalogCameraDirection(yaw, tilt).dot(catalogCameraUp(yaw, tilt))))
        .toBeLessThan(1e-12);
    }
  });
});
