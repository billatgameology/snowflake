// Browser-safe motion contract for gutcheck-scene-v1. This module owns the interpolation
// meaning shared by the legacy mesh player, the scene editor, and compact presentation
// consumers. It deliberately knows nothing about Three.js, filesystems, or scene sources.

import runBSceneSource from "../scenes/growth-B-intro.json?raw";

import { sha256Hex } from "./sha256.ts";

export const GUTCHECK_SCENE_FORMAT = "gutcheck-scene-v1" as const;
export type SceneEase = "linear" | "inOutCubic";

export interface SceneCameraPose {
  readonly tilt: number;
  readonly yaw: number;
  readonly zoom: number;
}

export interface SceneCameraKey extends SceneCameraPose {
  readonly t: number;
  readonly ease?: SceneEase;
}

export interface SceneFrameKey {
  readonly t: number;
  readonly frame: number;
}

export interface SceneMotion {
  readonly format: typeof GUTCHECK_SCENE_FORMAT;
  readonly duration: number;
  readonly fps?: number;
  readonly frameExtent?: number;
  readonly camera: readonly SceneCameraKey[];
  readonly frames: readonly SceneFrameKey[];
}

export interface SceneCameraPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

const DEFAULT_CAMERA: SceneCameraPose = Object.freeze({ tilt: 0, yaw: 0, zoom: 1 });
const ROOT_KEYS = new Set([
  "format",
  "title",
  "look",
  "frameExtent",
  "duration",
  "fps",
  "source",
  "frames",
  "camera",
  "crystal",
  "captions",
]);

function fail(message: string): never {
  throw new Error(`gutcheck scene motion: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${label} must be a plain object`);
  return value;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys must be exactly ${wanted.join(", ")}`);
  }
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${label} must be finite`);
  return value;
}

function finiteInRange(value: unknown, minimum: number, maximum: number, label: string): number {
  const parsed = finite(value, label);
  if (parsed < minimum || parsed > maximum) {
    fail(`${label} must be in [${String(minimum)}, ${String(maximum)}]`);
  }
  return parsed;
}

function optionalFinite(value: unknown, fallback: number, label: string): number {
  return value === undefined ? fallback : finite(value, label);
}

function decodeEase(value: unknown, label: string): SceneEase | undefined {
  if (value === undefined) return undefined;
  if (value !== "linear" && value !== "inOutCubic") {
    fail(`${label} must be linear or inOutCubic`);
  }
  return value;
}

function assertStrictlyIncreasingTimes(
  track: readonly { readonly t: number }[],
  duration: number,
  label: string,
): void {
  for (let index = 0; index < track.length; index++) {
    const key = track[index]!;
    if (key.t < 0 || key.t > duration) {
      fail(`${label}[${String(index)}].t must be in [0, duration]`);
    }
    if (index > 0 && key.t <= track[index - 1]!.t) {
      fail(`${label} times must be strictly increasing`);
    }
  }
}

function decodeCameraTrack(value: unknown, duration: number): readonly SceneCameraKey[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) fail("camera must be an array");
  const track = value.map((entry, index): SceneCameraKey => {
    const key = record(entry, `camera[${String(index)}]`);
    const allowed = key["ease"] === undefined
      ? ["t", "tilt", "yaw", "zoom"]
      : ["t", "tilt", "yaw", "zoom", "ease"];
    exactKeys(key, allowed, `camera[${String(index)}]`);
    const zoom = optionalFinite(key["zoom"], 1, `camera[${String(index)}].zoom`);
    if (zoom <= 0) fail(`camera[${String(index)}].zoom must be positive`);
    const ease = decodeEase(key["ease"], `camera[${String(index)}].ease`);
    return Object.freeze({
      t: finite(key["t"], `camera[${String(index)}].t`),
      tilt: optionalFinite(key["tilt"], 0, `camera[${String(index)}].tilt`),
      yaw: optionalFinite(key["yaw"], 0, `camera[${String(index)}].yaw`),
      zoom,
      ...(ease === undefined ? {} : { ease }),
    });
  });
  assertStrictlyIncreasingTimes(track, duration, "camera");
  return Object.freeze(track);
}

function decodeFrameTrack(value: unknown, duration: number): readonly SceneFrameKey[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) fail("frames must be an array");
  const track = value.map((entry, index): SceneFrameKey => {
    const key = record(entry, `frames[${String(index)}]`);
    exactKeys(key, ["t", "frame"], `frames[${String(index)}]`);
    const frame = finiteInRange(key["frame"], 0, Number.MAX_SAFE_INTEGER, `frames[${String(index)}].frame`);
    if (!Number.isSafeInteger(frame)) fail(`frames[${String(index)}].frame must be a safe integer`);
    return Object.freeze({
      t: finite(key["t"], `frames[${String(index)}].t`),
      frame,
    });
  });
  assertStrictlyIncreasingTimes(track, duration, "frames");
  return Object.freeze(track);
}

/** Strictly decode the motion-bearing subset of a gutcheck-scene-v1 object. */
export function decodeSceneMotion(value: unknown): SceneMotion {
  const root = record(value, "scene");
  for (const key of Object.keys(root)) {
    if (!ROOT_KEYS.has(key)) fail(`scene has unexpected key ${key}`);
  }
  if (root["format"] !== GUTCHECK_SCENE_FORMAT) {
    fail(`format must be ${GUTCHECK_SCENE_FORMAT}`);
  }
  const duration = finite(root["duration"], "duration");
  if (duration <= 0) fail("duration must be positive");
  const fps = root["fps"] === undefined
    ? undefined
    : finiteInRange(root["fps"], 1, Number.MAX_SAFE_INTEGER, "fps");
  if (fps !== undefined && !Number.isSafeInteger(fps)) fail("fps must be a safe integer");
  const frameExtent = root["frameExtent"] === undefined
    ? undefined
    : finiteInRange(root["frameExtent"], 0, Number.MAX_VALUE, "frameExtent");
  return Object.freeze({
    format: GUTCHECK_SCENE_FORMAT,
    duration,
    ...(fps === undefined ? {} : { fps }),
    ...(frameExtent === undefined ? {} : { frameExtent }),
    camera: decodeCameraTrack(root["camera"], duration),
    frames: decodeFrameTrack(root["frames"], duration),
  });
}

/** Parse JSON text, then apply the strict motion decoder. */
export function parseSceneMotion(source: string): SceneMotion {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    fail("source is not valid JSON");
  }
  return decodeSceneMotion(value);
}

/** The easing function used by the destination key of a camera segment. */
export function sceneEaseFraction(raw: number, ease: SceneEase = "inOutCubic"): number {
  if (!Number.isFinite(raw) || raw < 0 || raw > 1) fail("ease fraction must be finite and in [0, 1]");
  if (ease === "linear") return raw;
  return raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
}

/** Componentwise camera sampling; a destination key owns the segment's easing policy. */
export function sampleSceneCamera(
  track: readonly SceneCameraKey[],
  timeSeconds: number,
): SceneCameraPose {
  if (!Number.isFinite(timeSeconds)) fail("camera sample time must be finite");
  if (track.length === 0) return DEFAULT_CAMERA;
  const first = track[0]!;
  if (timeSeconds <= first.t) return { tilt: first.tilt, yaw: first.yaw, zoom: first.zoom };
  for (let index = 1; index < track.length; index++) {
    const previous = track[index - 1]!;
    const next = track[index]!;
    if (timeSeconds <= next.t) {
      const raw = next.t === previous.t ? 1 : (timeSeconds - previous.t) / (next.t - previous.t);
      const amount = sceneEaseFraction(raw, next.ease ?? "inOutCubic");
      return {
        tilt: previous.tilt + (next.tilt - previous.tilt) * amount,
        yaw: previous.yaw + (next.yaw - previous.yaw) * amount,
        zoom: previous.zoom + (next.zoom - previous.zoom) * amount,
      };
    }
  }
  const last = track[track.length - 1]!;
  return { tilt: last.tilt, yaw: last.yaw, zoom: last.zoom };
}

/** Piecewise-linear frame coordinate before the legacy player's integer-frame quantization. */
export function sampleSceneFrameCoordinate(
  track: readonly SceneFrameKey[],
  timeSeconds: number,
): number {
  if (!Number.isFinite(timeSeconds)) fail("frame sample time must be finite");
  if (track.length === 0) return 0;
  if (timeSeconds <= track[0]!.t) return track[0]!.frame;
  for (let index = 1; index < track.length; index++) {
    const previous = track[index - 1]!;
    const next = track[index]!;
    if (timeSeconds <= next.t) {
      const amount = next.t === previous.t ? 1 : (timeSeconds - previous.t) / (next.t - previous.t);
      return previous.frame + (next.frame - previous.frame) * amount;
    }
  }
  return track[track.length - 1]!.frame;
}

/** Exact legacy frame sampling: piecewise-linear coordinate rounded to the nearest index. */
export function sampleSceneFrame(track: readonly SceneFrameKey[], timeSeconds: number): number {
  return Math.round(sampleSceneFrameCoordinate(track, timeSeconds));
}

/**
 * Invert the authored (unrounded) frame coordinate. The earliest crossing wins, which makes
 * the start of a held final frame canonical (Run B frame 700 maps to 13 s, not 16 s).
 */
export function sceneTimeAtFrameCoordinate(
  track: readonly SceneFrameKey[],
  frameCoordinate: number,
): number {
  if (!Number.isFinite(frameCoordinate)) fail("inverse frame coordinate must be finite");
  if (track.length === 0) fail("cannot invert an empty frame track");
  if (frameCoordinate === track[0]!.frame) return track[0]!.t;
  for (let index = 1; index < track.length; index++) {
    const previous = track[index - 1]!;
    const next = track[index]!;
    if (previous.frame === next.frame) {
      if (frameCoordinate === previous.frame) return previous.t;
      continue;
    }
    const minimum = Math.min(previous.frame, next.frame);
    const maximum = Math.max(previous.frame, next.frame);
    if (frameCoordinate >= minimum && frameCoordinate <= maximum) {
      const amount = (frameCoordinate - previous.frame) / (next.frame - previous.frame);
      return previous.t + (next.t - previous.t) * amount;
    }
  }
  fail(`frame coordinate ${String(frameCoordinate)} is outside the authored track`);
}

export interface SceneTickDrivenSample {
  readonly tick: number;
  readonly frameCoordinate: number;
  readonly timeSeconds: number;
}

/**
 * Derive camera time from an exact requested tick without round-tripping that tick through
 * floating-point track interpolation. The returned tick is the caller's exact finite value.
 */
export function sceneTickDrivenSample(
  track: readonly SceneFrameKey[],
  tick: number,
  tickInterval: number,
): SceneTickDrivenSample {
  if (!Number.isFinite(tick)) fail("tick-driven sample tick must be finite");
  if (!Number.isFinite(tickInterval) || tickInterval <= 0) {
    fail("tick-driven sample interval must be finite and positive");
  }
  const frameCoordinate = tick / tickInterval;
  return {
    tick,
    frameCoordinate,
    timeSeconds: sceneTimeAtFrameCoordinate(track, frameCoordinate),
  };
}

/** Invert the scene player's origin-centered orbit construction without depending on Three.js. */
export function sceneCameraPoseFromPosition(
  position: SceneCameraPosition,
  zoom: number,
): SceneCameraPose {
  const x = finite(position.x, "camera position x");
  const y = finite(position.y, "camera position y");
  const z = finite(position.z, "camera position z");
  const parsedZoom = finite(zoom, "camera zoom");
  if (parsedZoom <= 0) fail("camera zoom must be positive");
  const distance = Math.hypot(x, y, z) || 1;
  const ratio = Math.min(1, Math.max(-1, z / distance));
  const tilt = (Math.acos(ratio) * 180) / Math.PI;
  const horizontal = Math.hypot(x, y);
  const yaw = horizontal < 1e-6 ? 0 : (Math.atan2(-x, y) * 180) / Math.PI;
  return { tilt, yaw, zoom: parsedZoom };
}

export const RUN_B_GROWTH_PRESENTATION_ID = "run-b-intro-v1" as const;
export const RUN_B_GROWTH_PRESENTATION_SHA256 =
  "95bebf9d2e4ea385b0949c2cca7263799480ecbb67942d12d8f3fd11650c211a" as const;
export const RUN_B_GROWTH_TICK_INTERVAL = 100 as const;

const runBSceneBytes = new TextEncoder().encode(runBSceneSource);
const observedRunBSceneSha256 = sha256Hex(runBSceneBytes);
if (observedRunBSceneSha256 !== RUN_B_GROWTH_PRESENTATION_SHA256) {
  fail(
    `compiled Run B scene SHA-256 ${observedRunBSceneSha256} differs from ` +
      RUN_B_GROWTH_PRESENTATION_SHA256,
  );
}
const runBMotion = parseSceneMotion(runBSceneSource);
const runBFps = runBMotion.fps;
const runBFrameExtent = runBMotion.frameExtent;
if (
  runBMotion.duration !== 16 ||
  runBFps !== 30 ||
  runBFrameExtent !== 620 ||
  runBMotion.frames.length !== 3 ||
  runBMotion.frames[0]?.frame !== 0 ||
  runBMotion.frames[runBMotion.frames.length - 1]?.frame !== 700
) {
  fail("compiled Run B scene does not carry the registered motion envelope");
}

/** Exact, compile-time-bound presentation metadata; importing this performs no fetch. */
export const RUN_B_GROWTH_PRESENTATION = Object.freeze({
  id: RUN_B_GROWTH_PRESENTATION_ID,
  sha256: RUN_B_GROWTH_PRESENTATION_SHA256,
  duration: runBMotion.duration,
  fps: runBFps,
  frameExtent: runBFrameExtent,
  tickInterval: RUN_B_GROWTH_TICK_INTERVAL,
  firstTick: runBMotion.frames[0]!.frame * RUN_B_GROWTH_TICK_INTERVAL,
  finalTick: runBMotion.frames[runBMotion.frames.length - 1]!.frame * RUN_B_GROWTH_TICK_INTERVAL,
  motion: runBMotion,
});
