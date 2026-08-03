// Gut-check spike renderer (docs/plans/explore-gg-realism-gutcheck.md): renders
// gutcheck-mesh-v1 binaries (scripts/gutcheck-mesh-lib.ts) in two maker-directed styles,
// as a single static frame, an orbitable viewer, or a growth timeline.
//
//   ?style=ice     (default) the ADR 0029 Realistic look aimed at the J0521r2p footage.
//   ?style=povray  the G-G paper's Fig. 4 ray-trace look.
//   ?mesh=<url>    single-mesh mode (static unless ?interactive=1).
//   ?manifest=<url> growth-timeline mode (scripts/gutcheck-animate-grow.ts output):
//                  slider + play/pause scrub through frame meshes, orbit controls always
//                  on, "face-on" resets the camera. ?frame=N picks the initial frame
//                  (default 0, the seed). ?fps=N sets playback rate (default 5).
//
// Static captures stay bit-stable for the recorded recipes: fixed backdrop plane, pixel
// ratio 1, single render. Interactive/timeline modes use a screen-fixed background and
// device-pixel-ratio supersampling. Rule 7 note: per phase-3 A2-7 precedent, the four
// three.js blending/canvas flags with the banned stem are never used here.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface SpikeWindow {
  __spikeReady?: boolean;
  __spikeError?: string;
}

interface GutcheckMesh {
  header: Record<string, unknown>;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

interface AnimFrame {
  file: string;
  tick: number;
  vertexCount: number;
  triangleCount: number;
}

interface AnimManifest {
  format: string;
  complete: boolean;
  config: { ticks: number; extraction: { spacing: number } };
  frames: AnimFrame[];
  finalBBox: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
  };
}

const query = new URLSearchParams(window.location.search);
const style = query.get("style") === "povray" ? "povray" : "ice";

/** URL param with a per-style default. */
function param(name: string, iceDefault: string, povDefault?: string): string {
  const v = query.get(name);
  if (v !== null && v !== "") return v;
  return style === "povray" && povDefault !== undefined ? povDefault : iceDefault;
}

function parseMesh(buffer: ArrayBuffer): GutcheckMesh {
  const dv = new DataView(buffer);
  const headerLen = dv.getUint32(0, true);
  const headerText = new TextDecoder().decode(new Uint8Array(buffer, 4, headerLen));
  const header = JSON.parse(headerText) as Record<string, unknown>;
  if (header["format"] !== "gutcheck-mesh-v1") {
    throw new Error(`unexpected mesh format: ${String(header["format"])}`);
  }
  const vertexCount = header["vertexCount"] as number;
  const triangleCount = header["triangleCount"] as number;
  let off = 4 + headerLen;
  const positions = new Float32Array(buffer, off, vertexCount * 3);
  off += vertexCount * 3 * 4;
  const normals = new Float32Array(buffer, off, vertexCount * 3);
  off += vertexCount * 3 * 4;
  const indices = new Uint32Array(buffer, off, triangleCount * 3);
  return { header, positions, normals, indices };
}

function makeBackdropTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  if (style === "povray") {
    const inner = "#" + param("bgInner", "", "3f6cb4");
    const outer = "#" + param("bgOuter", "", "060b1c");
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.48,
      size * 0.04,
      size * 0.5,
      size * 0.5,
      size * 0.75,
    );
    grad.addColorStop(0, inner);
    grad.addColorStop(1, outer);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else {
    const top = "#" + param("bgTop", "e6b95c");
    const bottom = "#" + param("bgBottom", "9aa5e0");
    const grad = ctx.createLinearGradient(size * 0.12, 0, 0, size);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeEnvironmentScene(): THREE.Scene {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  const vertical = ctx.createLinearGradient(0, 0, 0, size);
  if (style === "povray") {
    vertical.addColorStop(0, "#9db8dc");
    vertical.addColorStop(0.5, "#22304c");
    vertical.addColorStop(1, "#101a30");
  } else {
    vertical.addColorStop(0, "#fdf3da");
    vertical.addColorStop(0.32, "#b9b3a4");
    vertical.addColorStop(0.52, "#14141c");
    vertical.addColorStop(0.72, "#232a40");
    vertical.addColorStop(1, "#39456b");
  }
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, size, size);
  if (style === "ice") {
    const warm = ctx.createRadialGradient(
      size * 0.3,
      size * 0.16,
      size * 0.02,
      size * 0.3,
      size * 0.16,
      size * 0.3,
    );
    warm.addColorStop(0, "rgba(255, 236, 190, 0.95)");
    warm.addColorStop(1, "rgba(255, 236, 190, 0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const envScene = new THREE.Scene();
  envScene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }),
    ),
  );
  return envScene;
}

function makeIceMaterial(extentX: number): THREE.MeshPhysicalMaterial {
  const ice = new THREE.MeshPhysicalMaterial({
    transmission: Number(param("tr", "1.0", "0.6")),
    ior: Number(param("ior", "1.31")),
    thickness: Number(param("thick", "14", "6")),
    roughness: Number(param("rough", "0.05", "0.12")),
    metalness: 0,
    color: new THREE.Color("#" + param("body", "ffffff", "cfe2f8")),
    attenuationColor: new THREE.Color(0xdff2fb),
    attenuationDistance: extentX * 2,
    specularIntensity: Number(param("spec", "0.9", "1.2")),
    clearcoat: Number(param("cc", "0")),
    clearcoatRoughness: 0.2,
    side: param("side", "front") === "double" ? THREE.DoubleSide : THREE.FrontSide,
  });
  const dispersion = Number(param("dispersion", "0"));
  if (dispersion > 0) ice.dispersion = dispersion;
  return ice;
}

function makeEdgeMaterial(): THREE.ShaderMaterial | null {
  const edgeStrength = Number(param("edge", "1.9", "1.0"));
  if (edgeStrength <= 0) return null;
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // The edge pass re-draws the crystal's own triangles through a different vertex
    // shader; ulp-level depth differences z-fight into halftone stipple at high zoom.
    // Pull the layer a hair toward the camera.
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      edgeStrength: { value: edgeStrength },
      edgePow: { value: Number(param("edgePow", "1.3", "1.4")) },
      edgeLo: { value: Number(param("edgeLo", "0.14", "0.12")) },
      edgeHi: { value: Number(param("edgeHi", "0.95", "0.85")) },
      edgeCool: { value: new THREE.Color("#" + param("edgeCool", "141a36", "dcecff")) },
      edgeWarm: { value: new THREE.Color("#" + param("edgeWarm", "ffd98f", "ffffff")) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vViewNormal;
      void main() {
        vViewNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float edgeStrength;
      uniform float edgePow;
      uniform float edgeLo;
      uniform float edgeHi;
      uniform vec3 edgeCool;
      uniform vec3 edgeWarm;
      varying vec3 vViewNormal;
      void main() {
        vec3 n = normalize(vViewNormal);
        float tilt = 1.0 - abs(n.z);
        float fw = fwidth(tilt);
        float edgeAmount =
          pow(smoothstep(edgeLo - fw, edgeHi + fw, tilt), edgePow) * edgeStrength;
        vec2 keyDir = normalize(vec2(-0.6, 0.75));
        float facing = clamp(dot(normalize(n.xy + vec2(1e-5)), keyDir) * 0.5 + 0.5, 0.0, 1.0);
        vec3 edgeTint = mix(edgeCool, edgeWarm, pow(facing, 1.5));
        gl_FragColor = vec4(edgeTint, clamp(edgeAmount, 0.0, 1.0));
      }
    `,
  });
}

interface SceneRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  crystal: THREE.Mesh;
  edgeMesh: THREE.Mesh | null;
  render: () => void;
}

/** Build renderer, scene, camera, lights, materials for a given world extent. */
function buildRig(extent: THREE.Vector3, liveBackground: boolean): SceneRig {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(liveBackground ? Math.min(window.devicePixelRatio, 2) : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = Number(param("exposure", "1.0", "1.15"));
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const zoom = Number(param("zoom", "1"));
  const span = (Math.max(extent.x, extent.y) / 2) * 1.12 * zoom;
  const aspect = window.innerWidth / window.innerHeight;

  if (liveBackground) {
    scene.background = makeBackdropTexture();
  } else {
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(span * aspect * 2.1, span * 2.1),
      new THREE.MeshBasicMaterial({ map: makeBackdropTexture() }),
    );
    backdrop.position.z = -Math.max(extent.x, extent.y) * 0.75;
    scene.add(backdrop);
  }

  const crystal = new THREE.Mesh(new THREE.BufferGeometry(), makeIceMaterial(extent.x));
  scene.add(crystal);
  const edgeMaterial = makeEdgeMaterial();
  let edgeMesh: THREE.Mesh | null = null;
  if (edgeMaterial !== null) {
    edgeMesh = new THREE.Mesh(crystal.geometry, edgeMaterial);
    edgeMesh.renderOrder = 2;
    scene.add(edgeMesh);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvironmentScene(), 0.04).texture;
  scene.environmentIntensity = Number(param("env", "1.0", "0.6"));
  const key = new THREE.DirectionalLight(
    new THREE.Color("#" + param("keyHex", "ffe3b0", "eaf2ff")),
    Number(param("keyI", "3.2", "2.0")),
  );
  key.position.set(-1.4, 1.7, 0.45).multiplyScalar(extent.x);
  scene.add(key);
  const fill = new THREE.DirectionalLight(
    new THREE.Color("#" + param("fillHex", "93a8e0", "6f8fd0")),
    Number(param("fillI", "1.3", "1.0")),
  );
  fill.position.set(1.1, -1.3, 0.6).multiplyScalar(extent.x);
  scene.add(fill);

  const camera = new THREE.OrthographicCamera(
    -span * aspect,
    span * aspect,
    span,
    -span,
    1,
    Math.max(extent.x, extent.y) * 8,
  );
  const tilt = (Number(param("tilt", "0")) * Math.PI) / 180;
  const dist = Math.max(extent.x, extent.y) * 2;
  camera.position.set(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  return {
    renderer,
    scene,
    camera,
    crystal,
    edgeMesh,
    render: () => renderer.render(scene, camera),
  };
}

function setRigGeometry(rig: SceneRig, geometry: THREE.BufferGeometry): void {
  rig.crystal.geometry = geometry;
  if (rig.edgeMesh !== null) rig.edgeMesh.geometry = geometry;
}

const zscale = Number(param("zscale", "2.5"));

/** Mesh bytes -> display-ready geometry (z-relief scale + constant world offset). */
function buildGeometry(
  buffer: ArrayBuffer,
  offset: readonly [number, number, number],
): THREE.BufferGeometry {
  const mesh = parseMesh(buffer);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(mesh.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  if (zscale !== 1) {
    geometry.scale(1, 1, zscale);
    geometry.computeVertexNormals();
  }
  geometry.translate(-offset[0], -offset[1], -offset[2]);
  return geometry;
}

// ── Single-mesh mode ─────────────────────────────────────────────────────────────────────

async function singleMeshMain(): Promise<void> {
  const meshUrl = param("mesh", "/gutcheck-mesh.bin");
  const response = await fetch(meshUrl);
  if (!response.ok) throw new Error(`mesh fetch failed: ${response.status} ${meshUrl}`);
  // Center this mesh on itself: build once with no offset to measure, then translate.
  const geometry = buildGeometry(await response.arrayBuffer(), [0, 0, 0]);
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (bbox === null) throw new Error("no bounding box");
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
  const extent = new THREE.Vector3();
  bbox.getSize(extent);

  const interactive = param("interactive", "0") === "1";
  const rig = buildRig(extent, interactive);
  setRigGeometry(rig, geometry);

  if (interactive) {
    const controls = new OrbitControls(rig.camera, rig.renderer.domElement);
    controls.enableDamping = true;
    const animate = (): void => {
      requestAnimationFrame(animate);
      controls.update();
      rig.render();
    };
    animate();
  } else {
    rig.render();
  }
  (window as unknown as SpikeWindow).__spikeReady = true;
}

// ── Growth-timeline mode ─────────────────────────────────────────────────────────────────

const FRAME_CACHE_CAP = 8;

async function timelineMain(manifestUrl: string): Promise<void> {
  const manifestAbsolute = new URL(manifestUrl, window.location.href);
  const response = await fetch(manifestAbsolute);
  if (!response.ok) {
    throw new Error(`manifest fetch failed: ${response.status} ${manifestUrl}`);
  }
  const manifest = (await response.json()) as AnimManifest;
  if (manifest.format !== "gutcheck-anim-v1") {
    throw new Error(`unexpected manifest format: ${manifest.format}`);
  }
  if (manifest.frames.length === 0) throw new Error("manifest has no frames yet");
  const bb = manifest.finalBBox;
  const extent = new THREE.Vector3(bb.xMax - bb.xMin, bb.yMax - bb.yMin, bb.zMax - bb.zMin);
  // Mid-run manifests only know the latest-so-far bbox; ?frameExtent=<world units>
  // pins the framing to the expected final size so early frames aren't magnified.
  const frameExtent = Number(param("frameExtent", "0"));
  if (frameExtent > 0) {
    extent.x = frameExtent;
    extent.y = frameExtent;
  }
  const offset: readonly [number, number, number] = [
    (bb.xMin + bb.xMax) / 2,
    (bb.yMin + bb.yMax) / 2,
    ((bb.zMin + bb.zMax) / 2) * zscale,
  ];

  const rig = buildRig(extent, true);
  const controls = new OrbitControls(rig.camera, rig.renderer.domElement);
  controls.enableDamping = true;
  controls.saveState();

  // Frame cache with LRU eviction; geometries are display-ready.
  const cache = new Map<number, THREE.BufferGeometry>();
  const inflight = new Map<number, Promise<THREE.BufferGeometry>>();
  const lru: number[] = [];
  const loadFrame = (index: number): Promise<THREE.BufferGeometry> => {
    const cached = cache.get(index);
    if (cached !== undefined) return Promise.resolve(cached);
    const pending = inflight.get(index);
    if (pending !== undefined) return pending;
    const frame = manifest.frames[index];
    if (frame === undefined) return Promise.reject(new Error(`no frame ${index}`));
    const promise = fetch(new URL(frame.file, manifestAbsolute))
      .then((r) => {
        if (!r.ok) throw new Error(`frame fetch failed: ${r.status} ${frame.file}`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        const geometry = buildGeometry(buf, offset);
        cache.set(index, geometry);
        lru.push(index);
        while (lru.length > FRAME_CACHE_CAP) {
          const evict = lru.shift();
          if (evict !== undefined && evict !== currentFrame) {
            cache.get(evict)?.dispose();
            cache.delete(evict);
          }
        }
        inflight.delete(index);
        return geometry;
      });
    inflight.set(index, promise);
    return promise;
  };

  // Timeline UI.
  const ui = document.createElement("div");
  ui.style.cssText =
    "position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;align-items:center;" +
    "padding:10px 14px;background:rgba(8,12,22,0.62);color:#dfe7f4;" +
    "font:13px/1.4 ui-monospace,monospace;z-index:10";
  const playButton = document.createElement("button");
  playButton.textContent = "play";
  const prevButton = document.createElement("button");
  prevButton.textContent = "-1";
  const nextButton = document.createElement("button");
  nextButton.textContent = "+1";
  const faceOnButton = document.createElement("button");
  faceOnButton.textContent = "face-on";
  for (const b of [playButton, prevButton, nextButton, faceOnButton]) {
    b.style.cssText =
      "background:#233250;color:#dfe7f4;border:1px solid #3a4c72;border-radius:4px;" +
      "padding:4px 10px;cursor:pointer;font:inherit";
  }
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(manifest.frames.length - 1);
  slider.step = "1";
  slider.style.cssText = "flex:1";
  const label = document.createElement("span");
  label.style.cssText = "min-width:220px;text-align:right";
  ui.append(playButton, prevButton, nextButton, slider, label, faceOnButton);
  document.body.appendChild(ui);

  let currentFrame = -1;
  let showToken = 0;
  const showFrame = async (index: number): Promise<void> => {
    const clamped = Math.max(0, Math.min(manifest.frames.length - 1, index));
    const token = ++showToken;
    const geometry = await loadFrame(clamped);
    if (token !== showToken) return; // a newer request superseded this one
    currentFrame = clamped;
    setRigGeometry(rig, geometry);
    slider.value = String(clamped);
    const frame = manifest.frames[clamped]!;
    label.textContent =
      `tick ${frame.tick.toLocaleString()} / ${manifest.config.ticks.toLocaleString()}` +
      ` · frame ${clamped + 1}/${manifest.frames.length}`;
    // Prefetch neighbors for smooth scrubbing/playback.
    for (const near of [clamped + 1, clamped + 2, clamped - 1]) {
      if (near >= 0 && near < manifest.frames.length && !cache.has(near)) {
        void loadFrame(near).catch(() => {});
      }
    }
  };

  let playing = false;
  const fps = Math.max(1, Number(param("fps", "5")));
  let lastAdvance = 0;
  playButton.addEventListener("click", () => {
    playing = !playing;
    playButton.textContent = playing ? "pause" : "play";
    if (playing && currentFrame >= manifest.frames.length - 1) void showFrame(0);
  });
  prevButton.addEventListener("click", () => void showFrame(currentFrame - 1));
  nextButton.addEventListener("click", () => void showFrame(currentFrame + 1));
  faceOnButton.addEventListener("click", () => controls.reset());
  slider.addEventListener("input", () => void showFrame(Number(slider.value)));

  await showFrame(Number(param("frame", "0")));

  const animate = (now: number): void => {
    requestAnimationFrame(animate);
    if (playing && now - lastAdvance >= 1000 / fps) {
      const next = currentFrame + 1;
      if (next >= manifest.frames.length) {
        playing = false;
        playButton.textContent = "play";
      } else if (cache.has(next)) {
        lastAdvance = now;
        void showFrame(next);
      } else {
        void loadFrame(next).catch(() => {});
      }
    }
    controls.update();
    rig.render();
  };
  requestAnimationFrame(animate);
  (window as unknown as SpikeWindow).__spikeReady = true;
}

async function main(): Promise<void> {
  const manifestUrl = query.get("manifest");
  if (manifestUrl !== null && manifestUrl !== "") {
    await timelineMain(manifestUrl);
    return;
  }
  await singleMeshMain();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  (window as unknown as SpikeWindow).__spikeError = message;
  console.error("spike render failed:", message);
});
