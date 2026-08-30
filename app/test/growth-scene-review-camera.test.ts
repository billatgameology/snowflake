import { describe, expect, it } from "vitest";

import { growthSceneReviewCamera } from "../src/growth-scene-review-camera.ts";

const committed = { tiltDegrees: 38, yawDegrees: 15 };

describe("growth scene capture-only review camera", () => {
  it("uses the committed scene camera during normal playback", () => {
    const query = new URLSearchParams({ reviewTilt: "85", reviewYaw: "0" });
    expect(growthSceneReviewCamera(query, committed)).toBe(committed);
  });

  it("accepts bounded finite capture overrides", () => {
    const query = new URLSearchParams({ capture: "1", reviewTilt: "85", reviewYaw: "-20" });
    expect(growthSceneReviewCamera(query, committed)).toEqual({ tiltDegrees: 85, yawDegrees: -20 });
  });

  it("retains either committed axis when its capture override is absent", () => {
    const query = new URLSearchParams({ capture: "1", reviewTilt: "0" });
    expect(growthSceneReviewCamera(query, committed)).toEqual({ tiltDegrees: 0, yawDegrees: 15 });
  });

  it("refuses malformed or out-of-range capture overrides", () => {
    expect(() => growthSceneReviewCamera(
      new URLSearchParams({ capture: "1", reviewTilt: "NaN" }),
      committed,
    )).toThrow(/reviewTilt must be finite/u);
    expect(() => growthSceneReviewCamera(
      new URLSearchParams({ capture: "1", reviewYaw: "181" }),
      committed,
    )).toThrow(/reviewYaw must be finite/u);
  });
});
