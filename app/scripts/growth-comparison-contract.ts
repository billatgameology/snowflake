// Product-only assertions for the glass/camera browser capture. Expected poses are
// recomputed from the separately read, digest-bound scene, without the player sampler.
export const GLASS_CAPTURE_FORMAT = "gutcheck-growth-comparison-glass-browser-v1";
export const CAPTURE_SCENE_ID = "run-b-intro-v1";
export const CAPTURE_SCENE_SHA256 =
  "95bebf9d2e4ea385b0949c2cca7263799480ecbb67942d12d8f3fd11650c211a";

export interface CaptureScene {
  readonly duration: number;
  readonly camera: readonly {
    readonly t: number;
    readonly tilt: number;
    readonly yaw: number;
    readonly zoom: number;
    readonly ease?: "linear" | "inOutCubic";
  }[];
  readonly frames: readonly { readonly t: number; readonly frame: number }[];
}

export interface SceneWitness {
  readonly sceneSeconds: number;
  readonly sampledFrame: number;
  readonly tick: number;
  readonly camera: { readonly tiltDegrees: number; readonly yawDegrees: number; readonly zoom: number };
}

export interface CaptureGrowthDebug {
  readonly tick: number;
  readonly displayTick: number;
  readonly playing: boolean;
  readonly appearance: { readonly name: string; readonly style: string };
  readonly presentation: null | Omit<SceneWitness, "tick"> & {
    readonly id: string;
    readonly sourceSha256: string;
    readonly durationSeconds: number;
    readonly tickInterval: number;
    readonly growthSampling: string;
    readonly cameraMode: "scripted" | "manualHold";
  };
}

function fail(message: string): never {
  throw new Error(`glass comparison contract: ${message}`);
}

function close(actual: number, expected: number, label: string): void {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9) {
    fail(`${label} ${String(actual)} differs from ${String(expected)}`);
  }
}

export function captureSceneWitness(scene: CaptureScene, seconds: number): SceneWitness {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > scene.duration) {
    fail("scene witness time must be finite and inside the scene duration");
  }
  const camera = scene.camera;
  const first = camera[0];
  if (first === undefined || scene.frames.length === 0) fail("scene tracks must not be empty");
  let pose = { tiltDegrees: first.tilt, yawDegrees: first.yaw, zoom: first.zoom };
  for (let index = 1; index < camera.length; index++) {
    const previous = camera[index - 1]!;
    const next = camera[index]!;
    const fraction = Math.max(0, Math.min(1, (seconds - previous.t) / (next.t - previous.t)));
    const amount = next.ease === "linear" ? fraction : fraction <= 0.5
      ? 4 * fraction ** 3
      : 1 - 4 * (1 - fraction) ** 3;
    pose = {
      tiltDegrees: previous.tilt + (next.tilt - previous.tilt) * amount,
      yawDegrees: previous.yaw + (next.yaw - previous.yaw) * amount,
      zoom: previous.zoom + (next.zoom - previous.zoom) * amount,
    };
    if (seconds <= next.t) break;
  }
  let frame = scene.frames[0]!.frame;
  for (let index = 1; index < scene.frames.length; index++) {
    const previous = scene.frames[index - 1]!;
    const next = scene.frames[index]!;
    const fraction = Math.max(0, Math.min(1, (seconds - previous.t) / (next.t - previous.t)));
    frame = previous.frame + fraction * (next.frame - previous.frame);
    if (seconds <= next.t) break;
  }
  return { sceneSeconds: seconds, sampledFrame: frame, tick: frame * 100, camera: pose };
}

export function assertGlassSceneWitness(debug: CaptureGrowthDebug, expected: SceneWitness): void {
  const presentation = debug.presentation;
  if (debug.appearance?.name !== "glass" || debug.appearance.style !== "glass") {
    fail("player is not the named glass appearance");
  }
  if (presentation === null || presentation === undefined ||
      presentation.id !== CAPTURE_SCENE_ID || presentation.sourceSha256 !== CAPTURE_SCENE_SHA256 ||
      presentation.durationSeconds !== 16 || presentation.tickInterval !== 100 ||
      presentation.growthSampling !== "continuous-frame-coordinate") {
    fail("player does not bind the registered authored scene");
  }
  if (presentation.cameraMode !== "scripted") fail("expected the authored camera to be following");
  close(debug.tick, expected.tick, "growth tick");
  close(presentation.sceneSeconds, expected.sceneSeconds, "scene clock");
  close(presentation.sampledFrame, expected.sampledFrame, "frame coordinate");
  for (const key of ["tiltDegrees", "yawDegrees", "zoom"] as const) {
    close(presentation.camera[key], expected.camera[key], `camera ${key}`);
  }
}

export function assertHeldPresentation(before: CaptureGrowthDebug, after: CaptureGrowthDebug): void {
  if (before.playing || after.playing) fail("paused/reduced-motion replay remains playing");
  if (before.presentation === null || after.presentation === null) fail("held scene is missing");
  close(after.tick, before.tick, "held tick");
  close(after.displayTick, before.displayTick, "held display tick");
  close(after.presentation.sceneSeconds, before.presentation.sceneSeconds, "held scene clock");
  for (const key of ["tiltDegrees", "yawDegrees", "zoom"] as const) {
    close(after.presentation.camera[key], before.presentation.camera[key], `held camera ${key}`);
  }
}
