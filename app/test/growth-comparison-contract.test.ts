import { describe, expect, it } from "vitest";

import {
  CAPTURE_SCENE_ID,
  CAPTURE_SCENE_SHA256,
  assertGlassSceneWitness,
  assertHeldPresentation,
  captureSceneWitness,
  type CaptureGrowthDebug,
  type CaptureScene,
} from "../scripts/growth-comparison-contract.ts";

const scene: CaptureScene = {
  duration: 16,
  camera: [
    { t: 0, tilt: 0, yaw: 0, zoom: 1 },
    { t: 6, tilt: 30, yaw: 40, zoom: 1.25 },
    { t: 11, tilt: 55, yaw: 95, zoom: 1.1 },
    { t: 15.5, tilt: 0, yaw: 120, zoom: 1.18 },
  ],
  frames: [{ t: 0, frame: 0 }, { t: 13, frame: 700 }, { t: 16, frame: 700 }],
};

function debugAt(seconds: number): CaptureGrowthDebug {
  const witness = captureSceneWitness(scene, seconds);
  return {
    tick: witness.tick,
    displayTick: witness.tick,
    playing: false,
    appearance: { name: "glass", style: "glass" },
    presentation: {
      ...witness,
      id: CAPTURE_SCENE_ID,
      sourceSha256: CAPTURE_SCENE_SHA256,
      durationSeconds: 16,
      tickInterval: 100,
      growthSampling: "continuous-frame-coordinate",
      cameraMode: "scripted",
    },
  };
}

describe("glass comparison capture contract", () => {
  it("independently computes authored keys, cubic interiors and the final growth hold", () => {
    expect(captureSceneWitness(scene, 0).camera).toEqual({ tiltDegrees: 0, yawDegrees: 0, zoom: 1 });
    expect(captureSceneWitness(scene, 3).camera).toEqual({ tiltDegrees: 15, yawDegrees: 20, zoom: 1.125 });
    expect(captureSceneWitness(scene, 6.5)).toEqual({
      sceneSeconds: 6.5, sampledFrame: 350, tick: 35_000,
      camera: { tiltDegrees: 30.1, yawDegrees: 40.22, zoom: 1.2494 },
    });
    expect(captureSceneWitness(scene, 11).camera).toEqual({ tiltDegrees: 55, yawDegrees: 95, zoom: 1.1 });
    for (const seconds of [13, 15.5, 16]) expect(captureSceneWitness(scene, seconds).tick).toBe(70_000);
    expect(captureSceneWitness(scene, 13).camera.tiltDegrees).toBeCloseTo(35.685871056241426, 12);
    expect(captureSceneWitness(scene, 16).camera).toEqual({ tiltDegrees: 0, yawDegrees: 120, zoom: 1.18 });
    expect(() => captureSceneWitness(scene, Number.NaN)).toThrow(/time must be finite/);
  });

  it("rejects a stale look, wrong scene, wrong clock, missing following and wrong applied camera", () => {
    const expected = captureSceneWitness(scene, 6.5);
    const debug = debugAt(6.5);
    expect(() => assertGlassSceneWitness(debug, expected)).not.toThrow();
    expect(() => assertGlassSceneWitness({ ...debug, appearance: { name: "bold-ice", style: "solid" } }, expected))
      .toThrow(/named glass/);
    for (const mutation of [
      { sourceSha256: "0".repeat(64) }, { durationSeconds: 18 }, { growthSampling: "linear-ticks" },
      { cameraMode: "manualHold" as const }, { sceneSeconds: 7 },
      { camera: { ...expected.camera, yawDegrees: 0 } },
      { camera: { ...expected.camera, tiltDegrees: Number.NaN } },
    ]) {
      expect(() => assertGlassSceneWitness({
        ...debug, presentation: { ...debug.presentation!, ...mutation },
      }, expected)).toThrow();
    }
  });

  it("requires pause and reduced motion to hold growth, scene clock and camera together", () => {
    const before = debugAt(6.5);
    expect(() => assertHeldPresentation(before, debugAt(6.5))).not.toThrow();
    expect(() => assertHeldPresentation(before, { ...before, playing: true })).toThrow(/remains playing/);
    expect(() => assertHeldPresentation(before, { ...before, tick: before.tick + 1 })).toThrow(/held tick/);
    expect(() => assertHeldPresentation(before, {
      ...before, presentation: { ...before.presentation!, sceneSeconds: 6.6 },
    })).toThrow(/held scene clock/);
    expect(() => assertHeldPresentation(before, {
      ...before, presentation: {
        ...before.presentation!, camera: { ...before.presentation!.camera, yawDegrees: 41 },
      },
    })).toThrow(/held camera yawDegrees/);
  });
});
