import { describe, expect, it } from "vitest";

import {
  RUN_B_GROWTH_PRESENTATION,
  RUN_B_GROWTH_PRESENTATION_ID,
  RUN_B_GROWTH_PRESENTATION_SHA256,
  RUN_B_GROWTH_TICK_INTERVAL,
  decodeSceneMotion,
  sampleSceneCamera,
  sampleSceneFrame,
  sampleSceneFrameCoordinate,
  sceneCameraPoseFromPosition,
  sceneTickDrivenSample,
  sceneTimeAtFrameCoordinate,
  type SceneCameraKey,
} from "../src/gutcheck-scene-motion.ts";

describe("gutcheck scene motion", () => {
  it("compile-time binds the exact committed Run B presentation", () => {
    expect(RUN_B_GROWTH_PRESENTATION).toMatchObject({
      id: RUN_B_GROWTH_PRESENTATION_ID,
      sha256: RUN_B_GROWTH_PRESENTATION_SHA256,
      duration: 16,
      fps: 30,
      frameExtent: 620,
      tickInterval: RUN_B_GROWTH_TICK_INTERVAL,
      firstTick: 0,
      finalTick: 70_000,
    });
    expect(RUN_B_GROWTH_PRESENTATION_SHA256).toBe(
      "95bebf9d2e4ea385b0949c2cca7263799480ecbb67942d12d8f3fd11650c211a",
    );
    expect(RUN_B_GROWTH_PRESENTATION_ID).toBe("run-b-intro-v1");
    expect(RUN_B_GROWTH_TICK_INTERVAL).toBe(100);
    expect(Object.isFrozen(RUN_B_GROWTH_PRESENTATION)).toBe(true);
    expect(Object.isFrozen(RUN_B_GROWTH_PRESENTATION.motion.camera)).toBe(true);
    expect(Object.isFrozen(RUN_B_GROWTH_PRESENTATION.motion.frames)).toBe(true);
  });

  it("samples the exact Run B camera witnesses and destination-key easing", () => {
    const camera = RUN_B_GROWTH_PRESENTATION.motion.camera;
    expect(sampleSceneCamera(camera, 0)).toEqual({ tilt: 0, yaw: 0, zoom: 1 });
    expect(sampleSceneCamera(camera, 3)).toEqual({ tilt: 15, yaw: 20, zoom: 1.125 });
    expect(sampleSceneCamera(camera, 6)).toEqual({ tilt: 30, yaw: 40, zoom: 1.25 });
    expect(sampleSceneCamera(camera, 6.5)).toEqual({ tilt: 30.1, yaw: 40.22, zoom: 1.2494 });
    expect(sampleSceneCamera(camera, 8.5)).toEqual({ tilt: 42.5, yaw: 67.5, zoom: 1.175 });
    expect(sampleSceneCamera(camera, 11)).toEqual({ tilt: 55, yaw: 95, zoom: 1.1 });
    expect(sampleSceneCamera(camera, 13)).toEqual({
      tilt: 35.685871056241426,
      yaw: 103.77914951989026,
      zoom: 1.1280932784636489,
    });
    expect(sampleSceneCamera(camera, 15.5)).toEqual({ tilt: 0, yaw: 120, zoom: 1.18 });
    expect(sampleSceneCamera(camera, 479 / 30)).toEqual({ tilt: 0, yaw: 120, zoom: 1.18 });

    const sourceEaseMustNotOwnTheSegment: readonly SceneCameraKey[] = [
      { t: 0, tilt: 0, yaw: 0, zoom: 1, ease: "linear" },
      { t: 4, tilt: 40, yaw: 80, zoom: 2 },
    ];
    expect(sampleSceneCamera(sourceEaseMustNotOwnTheSegment, 1)).toEqual({
      tilt: 2.5,
      yaw: 5,
      zoom: 1.0625,
    });
    const destinationLinear: readonly SceneCameraKey[] = [
      { t: 0, tilt: 0, yaw: 0, zoom: 1 },
      { t: 4, tilt: 40, yaw: 80, zoom: 2, ease: "linear" },
    ];
    expect(sampleSceneCamera(destinationLinear, 1)).toEqual({ tilt: 10, yaw: 20, zoom: 1.25 });
  });

  it("samples rounded legacy frames and inverts the unrounded authored coordinate", () => {
    const frames = RUN_B_GROWTH_PRESENTATION.motion.frames;
    expect(sampleSceneFrame(frames, 0)).toBe(0);
    expect(sampleSceneFrame(frames, 3)).toBe(162);
    expect(sampleSceneFrame(frames, 6)).toBe(323);
    expect(sampleSceneFrameCoordinate(frames, 6.5)).toBe(350);
    expect(sampleSceneFrame(frames, 8.5)).toBe(458);
    expect(sampleSceneFrame(frames, 11)).toBe(592);
    expect(sampleSceneFrame(frames, 13)).toBe(700);
    expect(sampleSceneFrame(frames, 15.999)).toBe(700);
    expect(sceneTimeAtFrameCoordinate(frames, 0)).toBe(0);
    expect(sceneTimeAtFrameCoordinate(frames, 350)).toBe(6.5);
    // The earliest point on the final-frame plateau is canonical.
    expect(sceneTimeAtFrameCoordinate(frames, 700)).toBe(13);
    expect(() => sceneTimeAtFrameCoordinate(frames, 701)).toThrow(/outside the authored track/u);
  });

  it("keeps poster ticks exact while the compact presentation samples continuously", () => {
    const frames = RUN_B_GROWTH_PRESENTATION.motion.frames;
    const compactTick = (seconds: number): number =>
      sampleSceneFrameCoordinate(frames, seconds) * RUN_B_GROWTH_TICK_INTERVAL;
    expect(compactTick(0)).toBe(0);
    expect(compactTick(6.5)).toBe(35_000);
    expect(compactTick(13)).toBe(70_000);
    expect(compactTick(15.5)).toBe(70_000);
    expect(compactTick(16)).toBe(70_000);
    // Between poster times, the compact replay deliberately avoids the legacy frame rounding.
    expect(compactTick(3)).toBeCloseTo(16_153.846153846154, 10);
    expect(sampleSceneFrame(frames, 3) * RUN_B_GROWTH_TICK_INTERVAL).toBe(16_200);
  });

  it("preserves exact requested ticks while deriving their authored camera time", () => {
    const frames = RUN_B_GROWTH_PRESENTATION.motion.frames;
    const witness = sceneTickDrivenSample(frames, 11, RUN_B_GROWTH_TICK_INTERVAL);
    expect(witness.tick).toBe(11);
    expect(witness.frameCoordinate).toBe(0.11);
    expect(witness.timeSeconds).toBeCloseTo(0.0020428571428571427, 15);
    // A time->frame round trip lands just below the integer in binary float; callers must
    // retain witness.tick instead of replacing it with this derived value.
    expect(sampleSceneFrameCoordinate(frames, witness.timeSeconds) * RUN_B_GROWTH_TICK_INTERVAL)
      .toBeLessThan(11);
    expect(() => sceneTickDrivenSample(frames, 1, 0)).toThrow(/finite and positive/u);
  });

  it("preserves every camera and frame sample emitted by the 480-frame legacy capture", () => {
    const camera = RUN_B_GROWTH_PRESENTATION.motion.camera;
    const frames = RUN_B_GROWTH_PRESENTATION.motion.frames;
    const legacyCamera = (timeSeconds: number) => {
      if (timeSeconds <= camera[0]!.t) return camera[0]!;
      for (let index = 1; index < camera.length; index++) {
        const previous = camera[index - 1]!;
        const next = camera[index]!;
        if (timeSeconds <= next.t) {
          const raw = (timeSeconds - previous.t) / (next.t - previous.t);
          const amount = next.ease === "linear"
            ? raw
            : raw < 0.5
              ? 4 * raw * raw * raw
              : 1 - Math.pow(-2 * raw + 2, 3) / 2;
          return {
            tilt: previous.tilt + (next.tilt - previous.tilt) * amount,
            yaw: previous.yaw + (next.yaw - previous.yaw) * amount,
            zoom: previous.zoom + (next.zoom - previous.zoom) * amount,
          };
        }
      }
      return camera[camera.length - 1]!;
    };
    const legacyFrame = (timeSeconds: number): number =>
      timeSeconds <= 13 ? Math.round((700 * timeSeconds) / 13) : 700;

    for (let captureFrame = 0; captureFrame < 480; captureFrame++) {
      const timeSeconds = captureFrame / 30;
      const expectedCamera = legacyCamera(timeSeconds);
      expect(sampleSceneCamera(camera, timeSeconds)).toEqual({
        tilt: expectedCamera.tilt,
        yaw: expectedCamera.yaw,
        zoom: expectedCamera.zoom,
      });
      expect(sampleSceneFrame(frames, timeSeconds)).toBe(legacyFrame(timeSeconds));
    }
  });

  it("inverts the origin-centered camera construction", () => {
    const tilt = 55;
    const yaw = 95;
    const distance = 1240;
    const tiltRadians = (tilt * Math.PI) / 180;
    const yawRadians = (yaw * Math.PI) / 180;
    const horizontal = Math.sin(tiltRadians) * distance;
    const pose = sceneCameraPoseFromPosition({
      x: -horizontal * Math.sin(yawRadians),
      y: horizontal * Math.cos(yawRadians),
      z: Math.cos(tiltRadians) * distance,
    }, 1.1);
    expect(pose.tilt).toBeCloseTo(tilt, 12);
    expect(pose.yaw).toBeCloseTo(yaw, 12);
    expect(pose.zoom).toBe(1.1);
    expect(sceneCameraPoseFromPosition({ x: 0, y: 0, z: distance }, 1.25)).toEqual({
      tilt: 0,
      yaw: 0,
      zoom: 1.25,
    });
  });

  it("rejects ambiguous or malformed motion rather than sampling it", () => {
    const minimal = {
      format: "gutcheck-scene-v1",
      duration: 4,
      camera: [
        { t: 0, tilt: 0, yaw: 0, zoom: 1 },
        { t: 4, tilt: 20, yaw: 30, zoom: 1.2 },
      ],
      frames: [{ t: 0, frame: 0 }, { t: 4, frame: 40 }],
    };
    expect(decodeSceneMotion(minimal).duration).toBe(4);
    expect(() => decodeSceneMotion({ ...minimal, surprise: true })).toThrow(/unexpected key surprise/u);
    expect(() => decodeSceneMotion({
      ...minimal,
      camera: [minimal.camera[0], { ...minimal.camera[1], t: 0 }],
    })).toThrow(/strictly increasing/u);
    expect(() => decodeSceneMotion({
      ...minimal,
      camera: [minimal.camera[0], { ...minimal.camera[1], ease: "bounce" }],
    })).toThrow(/linear or inOutCubic/u);
    expect(() => decodeSceneMotion({
      ...minimal,
      frames: [{ t: 0, frame: 0.5 }, minimal.frames[1]],
    })).toThrow(/safe integer/u);
    expect(() => decodeSceneMotion({ ...minimal, duration: Number.POSITIVE_INFINITY })).toThrow(/finite/u);
    expect(() => sampleSceneCamera([], Number.NaN)).toThrow(/sample time must be finite/u);
  });
});
