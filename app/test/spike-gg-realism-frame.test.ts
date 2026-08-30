import { describe, expect, it } from "vitest";
import { spikeOrthographicFrame } from "../src/spike-frame.ts";

describe("gut-check mesh orthographic framing", () => {
  it("retains the face-on in-plane framing for a flat plate", () => {
    const frame = spikeOrthographicFrame({ x: 120, y: 100, z: 12 }, 0, 1, 1);
    expect(frame.span).toBe(60 * 1.12);
    expect(frame.worldExtent).toBe(120);
  });

  it("includes projected Z and 3-D camera depth for a tall tilted column", () => {
    const extent = { x: 24, y: 20, z: 110 };
    const frame = spikeOrthographicFrame(extent, 55, 1, 1);
    const projectedHeight =
      Math.abs(Math.cos((55 * Math.PI) / 180)) * extent.y +
      Math.abs(Math.sin((55 * Math.PI) / 180)) * extent.z;
    expect(frame.span).toBeCloseTo((projectedHeight / 2) * 1.12, 12);
    expect(frame.span).toBeGreaterThan((Math.max(extent.x, extent.y) / 2) * 1.12);
    expect(frame.worldExtent).toBe(110);
  });
});
