import * as THREE from "three";

import "./catalog-volume-player.css";
import { createBackdropMaterial } from "./catalog-volume/backdropMaterial.ts";
import {
  catalogCameraDirection,
  catalogCameraUp,
  catalogComponentMatrix,
  catalogVolumeMatrix,
} from "./catalog-volume/geometry.ts";
import {
  createArrivalTexture,
  createIceMaterial,
  DEFAULT_LOOK,
  ICE_QUALITY,
} from "./catalog-volume/iceMaterial.ts";
import type {
  CatalogVolumeWorkerRequest,
  CatalogVolumeWorkerResponse,
} from "./catalog-volume/catalog-volume.worker.ts";
import {
  GROWTH_SCENE_WEB_LIMIT_BYTES,
  growthSceneColdPayloadBytes,
  parseGrowthSceneV1,
  type GrowthSceneComponentV1,
  type GrowthSceneV1,
} from "./growth-scene.ts";

interface LoadedVolume {
  readonly data: Uint32Array;
  readonly size: readonly [number, number, number];
  readonly crop: {
    readonly iMin: number;
    readonly iMax: number;
    readonly jMin: number;
    readonly jMax: number;
    readonly kMin: number;
    readonly kMax: number;
  };
  readonly center: readonly [number, number, number];
  readonly finalTick: number;
  readonly radiusTrack: Float32Array;
  readonly decimation: number;
}

interface RenderedComponent {
  readonly definition: GrowthSceneComponentV1;
  readonly volume: LoadedVolume;
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  readonly uniforms: ReturnType<typeof createIceMaterial>["uniforms"];
  readonly modelMatrix: THREE.Matrix4;
}

interface PlayerWindow extends Window {
  __catalogVolumeReady?: boolean;
  __catalogVolumeSeek?: (seconds: number) => Promise<void>;
  __sceneDuration?: number;
  __catalogVolumeProjectedBounds?: { xMin: number; xMax: number; yMin: number; yMax: number };
  __catalogVolumeStats?: { componentCount: number; uniqueTextureCount: number; coldBytes: number };
}

const params = new URLSearchParams(window.location.search);
const sceneUrl = params.get("growthScene");
const capture = params.get("capture") === "1";
const debugParam = params.get("debug");
const debugMode = capture && debugParam === "coverage"
  ? 1
  : capture && debugParam === "normals"
    ? 2
    : 0;
const showUi = params.get("ui") !== "0";
const host = document.querySelector<HTMLElement>("#volume-player");
if (host === null) throw new Error("volume player root is missing");

const loading = document.querySelector<HTMLElement>("[data-loading]");
const setLoading = (message: string): void => {
  if (loading !== null) loading.textContent = message;
};

const clamp = (value: number, low = 0, high = 1): number => Math.min(high, Math.max(low, value));
const smooth = (value: number): number => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (value: number): number => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const loadVolume = (
  component: GrowthSceneComponentV1,
  decimation: number,
  onProgress: (progress: number) => void,
): Promise<LoadedVolume> => new Promise((resolve, reject) => {
  const worker = new Worker(new URL("./catalog-volume/catalog-volume.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event: MessageEvent<CatalogVolumeWorkerResponse>): void => {
    const message = event.data;
    if (message.kind === "progress") {
      onProgress(message.total > 0 ? message.received / message.total : 0);
      return;
    }
    worker.terminate();
    if (message.kind === "error") {
      reject(new Error(message.message));
      return;
    }
    resolve({
      data: message.data,
      size: message.size,
      crop: message.crop,
      center: message.center,
      finalTick: message.finalTick,
      radiusTrack: message.radiusTrack,
      decimation: message.decimation,
    });
  };
  worker.onerror = (event): void => {
    worker.terminate();
    reject(new Error(event.message || "growth-volume worker failed"));
  };
  worker.postMessage({
    url: component.growthAsset.url,
    sha256: component.growthAsset.sha256,
    decimation,
  } satisfies CatalogVolumeWorkerRequest);
});

const showError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  host.replaceChildren();
  const notice = document.createElement("p");
  notice.className = "error";
  notice.append("The volume player could not start: ", message, " ");
  const fallback = document.createElement("a");
  fallback.href = `/spike-gg-realism.html?${params.toString()}`;
  fallback.textContent = "Open the compatibility view.";
  notice.appendChild(fallback);
  host.appendChild(notice);
};

const main = async (): Promise<void> => {
  if (sceneUrl === null || sceneUrl === "") throw new Error("growthScene is required");
  const sceneResponse = await fetch(sceneUrl);
  if (!sceneResponse.ok) throw new Error(`scene fetch failed: ${sceneResponse.status}`);
  const sceneText = await sceneResponse.text();
  const scene = parseGrowthSceneV1(JSON.parse(sceneText) as unknown);
  const coldBytes = growthSceneColdPayloadBytes(scene, new TextEncoder().encode(sceneText).byteLength);
  if (coldBytes >= GROWTH_SCENE_WEB_LIMIT_BYTES) throw new Error("scene exceeds the web payload limit");

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const maxLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS) as number;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x03050a, 1);
  host.appendChild(renderer.domElement);

  const threeScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 10000);
  const bounds = scene.bounds;
  const sceneCenter = new THREE.Vector3(
    (bounds.xMin + bounds.xMax) / 2,
    (bounds.yMin + bounds.yMax) / 2,
    (bounds.zMin + bounds.zMax) / 2,
  );

  const { material: backdropMaterial, uniforms: backdropUniforms } = createBackdropMaterial();
  const backdrop = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 32), backdropMaterial);
  backdrop.renderOrder = -1;
  threeScene.add(backdrop);

  const unique = new Map<string, Promise<LoadedVolume>>();
  const progress = new Map<string, number>();
  const loadFor = (component: GrowthSceneComponentV1): Promise<LoadedVolume> => {
    const cached = unique.get(component.growthAsset.sha256);
    if (cached !== undefined) return cached;
    const promise = loadVolume(component, 1, (value) => {
      progress.set(component.growthAsset.sha256, value);
      const average = [...progress.values()].reduce((sum, item) => sum + item, 0) / progress.size;
      setLoading(`Loading verified growth data — ${Math.round(average * 100)}%`);
    });
    unique.set(component.growthAsset.sha256, promise);
    return promise;
  };
  const loaded = await Promise.all(scene.components.map(async (definition) => ({
    definition,
    volume: await loadFor(definition),
  })));
  const tooTall = loaded.find(({ volume }) => volume.size[2] > maxLayers);
  if (tooTall !== undefined) {
    throw new Error(`this browser supports ${maxLayers} volume layers; ${tooTall.definition.id} needs ${tooTall.volume.size[2]}`);
  }

  setLoading("Compiling the ice material…");
  const textures = new Map<string, THREE.DataArrayTexture>();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0.5, 0.5, 0.5);
  const quality = scene.components.length <= 2 ? ICE_QUALITY[3] : ICE_QUALITY[2];
  const rendered: RenderedComponent[] = [];
  const renderedBounds = new THREE.Box3();
  for (const item of loaded) {
    let texture = textures.get(item.definition.growthAsset.sha256);
    if (texture === undefined) {
      texture = createArrivalTexture(item.volume.data, item.volume.size);
      textures.set(item.definition.growthAsset.sha256, texture);
    }
    const built = createIceMaterial(texture, item.volume.size, quality, DEFAULT_LOOK);
    const modelMatrix = new THREE.Matrix4()
      .makeTranslation(-sceneCenter.x, -sceneCenter.y, -sceneCenter.z)
      .multiply(catalogComponentMatrix(item.definition))
      .multiply(catalogVolumeMatrix(item.volume));
    const mesh = new THREE.Mesh(geometry, built.material);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(modelMatrix);
    mesh.matrixWorld.copy(modelMatrix);
    mesh.frustumCulled = false;
    built.uniforms.uLocalToWorld.value.copy(modelMatrix);
    built.uniforms.uWorldToLocal.value.copy(modelMatrix).invert();
    built.uniforms.uLocalToWorldNormal.value.setFromMatrix4(modelMatrix).invert().transpose();
    built.uniforms.uGlowTicks.value = Math.max(10, item.volume.finalTick * 0.035);
    built.uniforms.uTransition.value = Math.max(2, item.volume.finalTick * 0.004);
    built.uniforms.uGlowStrength.value = 0.38;
    built.uniforms.uDebugMode.value = debugMode;
    const finalRadius = item.volume.radiusTrack.at(-1) ?? 0;
    built.uniforms.uReferenceSpeed.value = item.volume.finalTick > 0
      ? finalRadius / item.volume.decimation / item.volume.finalTick
      : 0;
    threeScene.add(mesh);
    rendered.push({ ...item, mesh, material: built.material, uniforms: built.uniforms, modelMatrix });
    for (const x of [0, 1]) {
      for (const y of [0, 1]) {
        for (const z of [0, 1]) {
          renderedBounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(modelMatrix));
        }
      }
    }
  }

  const target = renderedBounds.getCenter(new THREE.Vector3());
  const finalSpan = renderedBounds.getSize(new THREE.Vector3()).length() * 0.5 * 1.15;

  if (loading !== null) loading.remove();
  const disclosure = scene.disclosure === "composed-visualization"
    ? `Composed visualization · ${scene.components.length} accepted G-G components`
    : "Direct accepted G-G/G-G+ growth recording";
  let playButton: HTMLButtonElement | null = null;
  let slider: HTMLInputElement | null = null;
  let output: HTMLOutputElement | null = null;
  if (showUi) {
    const head = document.createElement("header");
    head.className = "player-head";
    head.innerHTML = `<div><p class="eyebrow">${disclosure}</p><h1>${scene.title}</h1></div><p class="identity">Verified ${
      (coldBytes / 1_000_000).toFixed(2)
    } MB cold payload · volume-rendered presentation</p>`;
    host.appendChild(head);
    const controls = document.createElement("div");
    controls.className = "controls";
    controls.innerHTML = `<button type="button" data-play>Pause</button><button type="button" data-replay>Replay</button><input type="range" min="0" max="${scene.durationSeconds}" step="0.01" value="0" aria-label="Animation time"/><output>0.0 s</output>`;
    host.appendChild(controls);
    playButton = controls.querySelector("[data-play]");
    slider = controls.querySelector("input");
    output = controls.querySelector("output");
    controls.querySelector("[data-replay]")?.addEventListener("click", () => {
      elapsed = 0;
      playing = true;
      if (playButton !== null) playButton.textContent = "Pause";
    });
    playButton?.addEventListener("click", () => {
      playing = !playing;
      if (playButton !== null) playButton.textContent = playing ? "Pause" : "Play";
    });
    slider?.addEventListener("input", () => {
      elapsed = Number(slider?.value ?? 0);
      playing = false;
      if (playButton !== null) playButton.textContent = "Play";
    });
    const capability = document.createElement("p");
    capability.className = "capability";
    capability.textContent = `${quality.maxSteps}-step volume · ${textures.size} shared texture${textures.size === 1 ? "" : "s"}`;
    host.appendChild(capability);
  }

  const localToClip = new THREE.Matrix4();
  let elapsed = 0;
  let playing = !capture;
  let lastTime = performance.now();
  let cameraDistance = 0;
  const duration = scene.durationSeconds;
  const renderAt = (seconds: number, snap: boolean): void => {
    const growthProgress = clamp(seconds / (duration * 0.78));
    const eased = easeInOutCubic(growthProgress);
    const tilt = 10 + 32 * smooth(growthProgress);
    const yaw = scene.camera.yawDegrees + seconds * 4.2;
    const aspectLimit = Math.min(1, Math.max(camera.aspect, 0.1));
    const trackedSpan = Math.max(14, finalSpan * (0.16 + 0.84 * smooth(growthProgress)));
    const desiredDistance = trackedSpan / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspectLimit);
    cameraDistance = snap || cameraDistance === 0
      ? desiredDistance
      : THREE.MathUtils.lerp(cameraDistance, desiredDistance, 0.12);
    const cameraDirection = catalogCameraDirection(yaw, tilt);
    camera.position.copy(cameraDirection).multiplyScalar(cameraDistance).add(target);
    camera.up.copy(catalogCameraUp(yaw, tilt));
    camera.lookAt(target);
    camera.updateMatrixWorld();
    backdrop.position.copy(camera.position);
    backdropUniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    backdropUniforms.uSkyUp.value.copy(camera.up);
    backdropUniforms.uBackdropSpin.value = -THREE.MathUtils.degToRad(yaw) * 0.32;

    const followedYaw = yaw * 0.72;
    const key = catalogCameraDirection(followedYaw + 38, clamp(tilt - 28, 34, 76));
    const rim = catalogCameraDirection(followedYaw + 162, clamp(180 - tilt - 34, 96, 168));
    const fill = catalogCameraDirection(followedYaw - 74, clamp(tilt + 22, 28, 122));
    backdropUniforms.uKeyDir.value.copy(key);
    backdropUniforms.uRimDir.value.copy(rim);
    backdropUniforms.uFillDir.value.copy(fill);

    for (const item of rendered) {
      const phase = item.definition.phaseOffset;
      const localProgress = growthProgress <= phase ? 0 : clamp((growthProgress - phase) / (1 - phase));
      const displayTick = easeInOutCubic(localProgress) * item.volume.finalTick;
      const whole = Math.floor(displayTick);
      item.uniforms.uPlayheadTick.value = whole;
      item.uniforms.uPlayheadOffset.value = displayTick - whole;
      item.uniforms.uKeyDir.value.copy(key);
      item.uniforms.uRimDir.value.copy(rim);
      item.uniforms.uFillDir.value.copy(fill);
      item.uniforms.uSkyUp.value.copy(camera.up);
      item.uniforms.uBackdropSpin.value = backdropUniforms.uBackdropSpin.value;
      localToClip.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(item.modelMatrix);
      item.uniforms.uLocalToClip.value.copy(localToClip);
    }
    const projected = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity };
    for (const item of rendered) {
      for (const x of [0, 1]) {
        for (const y of [0, 1]) {
          for (const z of [0, 1]) {
            const point = new THREE.Vector3(x, y, z).applyMatrix4(item.modelMatrix).project(camera);
            projected.xMin = Math.min(projected.xMin, point.x);
            projected.xMax = Math.max(projected.xMax, point.x);
            projected.yMin = Math.min(projected.yMin, point.y);
            projected.yMax = Math.max(projected.yMax, point.y);
          }
        }
      }
    }
    (window as PlayerWindow).__catalogVolumeProjectedBounds = projected;
    renderer.render(threeScene, camera);
    if (slider !== null && document.activeElement !== slider) slider.value = String(Math.min(seconds, duration));
    if (output !== null) output.value = `${Math.min(seconds, duration).toFixed(1)} s`;
  };

  const onResize = (): void => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderAt(elapsed, true);
  };
  window.addEventListener("resize", onResize);

  const animate = (now: number): void => {
    requestAnimationFrame(animate);
    const delta = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    if (playing) {
      elapsed += delta;
      if (elapsed > duration + 1.5) elapsed = 0;
    }
    renderAt(Math.min(elapsed, duration), capture);
  };
  renderAt(0, true);
  requestAnimationFrame(animate);

  const playerWindow = window as PlayerWindow;
  playerWindow.__sceneDuration = duration;
  playerWindow.__catalogVolumeStats = {
    componentCount: rendered.length,
    uniqueTextureCount: textures.size,
    coldBytes,
  };
  playerWindow.__catalogVolumeSeek = async (seconds: number): Promise<void> => {
    elapsed = clamp(seconds, 0, duration);
    playing = false;
    renderAt(elapsed, true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  };
  playerWindow.__catalogVolumeReady = true;
};

void main().catch(showError);
