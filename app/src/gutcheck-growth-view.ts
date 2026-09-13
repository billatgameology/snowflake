// Smooth web replay for gutcheck-growth-v1. Exact attachment indices/ticks live in the
// decoded sparse asset; this renderer deliberately turns them into a spatially/temporally
// smoothed implicit surface for media use. It is a MODEL presentation, not a solver or gate.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import {
  GUTCHECK_GROWTH_NEVER_TICK,
  buildDenseExactTickVolume,
  decodeGrowthAsset,
  growthCropSize,
  growthLatticeCoordinates,
  latticeToGrowthWorld,
  splitGrowthPlayhead,
  type DecodedGrowthAsset,
  type DenseExactGrowthVolume,
  type GrowthCrop,
  type GrowthReplayConfig,
  type GrowthSourceProvenance,
  type GrowthTerminationReason,
  type GrowthVec3,
} from "./gutcheck-growth-format.ts";
import {
  RUN_B_GROWTH_PRESENTATION,
  sampleSceneCamera,
  sampleSceneFrameCoordinate,
  sceneCameraPoseFromPosition,
  sceneTickDrivenSample,
  sceneTimeAtFrameCoordinate,
  type SceneCameraPose,
} from "./gutcheck-scene-motion.ts";

export interface GutcheckGrowthViewOptions {
  readonly query: URLSearchParams;
  readonly backdropTop: string;
  readonly backdropBottom: string;
  readonly bodyColor: string;
  readonly edgeColor: string;
  readonly zScale: number;
  readonly presentation: typeof RUN_B_GROWTH_PRESENTATION | null;
  readonly appearance: {
    readonly name: string;
    readonly style: "solid" | "glass";
    readonly ior: number;
    readonly roughness: number;
    readonly specular: number;
    readonly clearcoat: number;
  };
}

function validatedAppearance(
  candidate: GutcheckGrowthViewOptions["appearance"],
): GutcheckGrowthViewOptions["appearance"] {
  if (candidate.name.trim() === "" || candidate.name.length > 80) {
    throw new Error("growth appearance name must contain 1 to 80 characters");
  }
  if (candidate.style !== "solid" && candidate.style !== "glass") {
    throw new Error(`growth appearance style is unsupported: ${String(candidate.style)}`);
  }
  const bounded = (
    name: string,
    value: number,
    minimum: number,
    maximum: number,
  ): number => {
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      throw new Error(
        `growth appearance ${name} must be finite and in [${minimum}, ${maximum}], got ${String(value)}`,
      );
    }
    return value;
  };
  return {
    name: candidate.name,
    style: candidate.style,
    ior: bounded("ior", candidate.ior, 1.0001, 3),
    roughness: bounded("roughness", candidate.roughness, 0, 1),
    specular: bounded("specular", candidate.specular, 0, 2),
    clearcoat: bounded("clearcoat", candidate.clearcoat, 0, 1),
  };
}

interface GrowthQuality {
  readonly name: "low" | "medium" | "high";
  readonly maxSteps: number;
  readonly samplesPerCell: number;
  readonly dprCap: number;
}

interface GrowthDebugState {
  mode: "gutcheck-growth-v1";
  tick: number;
  displayTick: number;
  normalizedTime: number;
  finalTick: number;
  representativeGrowthTick: number | null;
  playing: boolean;
  reducedMotion: boolean;
  quality: GrowthQuality["name"];
  appearance: GutcheckGrowthViewOptions["appearance"];
  presentation: null | {
    id: string;
    sourceSha256: string;
    durationSeconds: number;
    sceneSeconds: number;
    sampledFrame: number;
    legacyFrame: number;
    tickInterval: number;
    growthSampling: "continuous-frame-coordinate";
    cameraMode: "scripted" | "manualHold";
    camera: { tiltDegrees: number; yawDegrees: number; zoom: number };
  };
  viewport: { width: number; height: number; pixelRatio: number };
  capabilities: {
    webgl2: boolean;
    maxTextureSize: number;
    maxArrayTextureLayers: number;
    max3DTextureSize: number;
    renderer: string;
    vendor: string;
  };
  framing: {
    radius: number;
    halfWidth: number;
    halfHeight: number;
    projectedBounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  };
  asset: {
    terminationReason: GrowthTerminationReason;
    config: GrowthReplayConfig;
    source: GrowthSourceProvenance;
  };
  volume: {
    size: GrowthVec3;
    crop: Record<string, number>;
    eventCount: number;
    sourceBytes: number;
    decodedUint32Bytes: number;
    nominalTextureBytes: number;
    textureFormat: "R32UI DataArrayTexture";
    syntheticProbe: GrowthVec3 | null;
  };
}

interface GrowthWindow {
  __spikeReady?: boolean;
  __spikeError?: string;
  __growthDebug?: GrowthDebugState;
  __growthSeek?: (tick: number) => Promise<void>;
  __growthSeekTime?: (seconds: number) => Promise<void>;
  __growthSetView?: (tiltDegrees: number, yawDegrees: number, zoom?: number) => Promise<void>;
  __growthFollowCamera?: () => Promise<void>;
  __growthBenchmark?: (samples: number) => Promise<number[]>;
}

const SQRT3_OVER_2 = Math.sqrt(3) / 2;

const QUALITY: Readonly<Record<GrowthQuality["name"], GrowthQuality>> = {
  low: { name: "low", maxSteps: 512, samplesPerCell: 0.8, dprCap: 0.75 },
  medium: { name: "medium", maxSteps: 768, samplesPerCell: 1.05, dprCap: 1 },
  high: { name: "high", maxSteps: 1024, samplesPerCell: 1.2, dprCap: 1.5 },
};

function selectedQuality(query: URLSearchParams): GrowthQuality {
  const value = query.get("quality") ?? "medium";
  if (value !== "low" && value !== "medium" && value !== "high") {
    throw new Error(`growth quality must be low, medium, or high, got ${value}`);
  }
  return QUALITY[value];
}

function finitePositiveParam(query: URLSearchParams, name: string, fallback: number): number {
  const raw = query.get(name);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`growth ${name} must be finite and positive, got ${raw}`);
  }
  return value;
}

function makeBackdrop(top: string, bottom: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("growth backdrop 2d context is unavailable");
  const gradient = context.createLinearGradient(130, 0, 0, 1024);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 1024);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeStatusLabel(
  appearance: GutcheckGrowthViewOptions["appearance"],
  presentationId: string | null,
): HTMLDivElement {
  const label = document.createElement("div");
  label.setAttribute("role", "status");
  label.style.cssText =
    "position:fixed;left:14px;top:14px;z-index:20;max-width:370px;padding:9px 11px;" +
    "border:1px solid rgba(210,228,255,.32);border-radius:7px;background:rgba(7,13,25,.72);" +
    "color:#e8f1ff;font:12px/1.45 ui-monospace,monospace;pointer-events:none";
  const title = document.createElement("div");
  title.textContent = appearance.style === "glass"
    ? "MODEL · GLASS-STYLED REPLAY · UNVALIDATED"
    : "MODEL · SMOOTH ATTACHMENT REPLAY · UNVALIDATED";
  title.style.cssText = "font-weight:700;letter-spacing:.04em";
  const note = document.createElement("div");
  note.textContent =
    "Exact recorded attachment ticks; interpolated display surface. " +
    (appearance.style === "glass" ? "Nonphysical glass approximation. " : "") +
    (presentationId === null ? "" : "Authored camera tour; manual orbit pauses camera following. ") +
    "G-G ticks are not physical time.";
  note.style.cssText = "color:#b9c9df;margin-top:3px";
  label.append(title, note);
  return label;
}

function styledButton(text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  button.style.cssText =
    "background:#233250;color:#dfe7f4;border:1px solid #3a4c72;border-radius:4px;" +
    "padding:4px 10px;cursor:pointer;font:inherit";
  return button;
}

function growthShaderMaterial(
  texture: THREE.DataArrayTexture,
  volumeSize: GrowthVec3,
  quality: GrowthQuality,
  bodyColor: string,
  edgeColor: string,
  backdrop: THREE.Texture,
  appearance: GutcheckGrowthViewOptions["appearance"],
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.FrontSide,
    depthWrite: true,
    depthTest: true,
    transparent: false,
    uniforms: {
      uArrival: { value: texture },
      uVolumeSize: { value: new THREE.Vector3(...volumeSize) },
      uRayDirectionLocal: { value: new THREE.Vector3(0, 0, -1) },
      uLocalToViewNormal: { value: new THREE.Matrix3() },
      uLocalToClip: { value: new THREE.Matrix4() },
      uPlayheadTick: { value: 0 },
      uPlayheadOffset: { value: 0 },
      uTransition: { value: 1 },
      uIso: { value: 0.36 },
      uMaxSteps: { value: quality.maxSteps },
      uSamplesPerCell: { value: quality.samplesPerCell },
      uBodyColor: { value: new THREE.Color(bodyColor) },
      uEdgeColor: { value: new THREE.Color(edgeColor) },
      uBackdrop: { value: backdrop },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uGlass: { value: appearance.style === "glass" ? 1 : 0 },
      uIor: { value: appearance.ior },
      uRoughness: { value: appearance.roughness },
      uSpecular: { value: appearance.specular },
      uClearcoat: { value: appearance.clearcoat },
    },
    vertexShader: /* glsl */ `
      out vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      precision highp int;
      precision highp usampler2DArray;

      uniform usampler2DArray uArrival;
      uniform vec3 uVolumeSize;
      uniform vec3 uRayDirectionLocal;
      uniform mat3 uLocalToViewNormal;
      uniform mat4 uLocalToClip;
      uniform uint uPlayheadTick;
      uniform float uPlayheadOffset;
      uniform float uTransition;
      uniform float uIso;
      uniform float uMaxSteps;
      uniform float uSamplesPerCell;
      uniform vec3 uBodyColor;
      uniform vec3 uEdgeColor;
      uniform sampler2D uBackdrop;
      uniform vec2 uViewport;
      uniform float uGlass;
      uniform float uIor;
      uniform float uRoughness;
      uniform float uSpecular;
      uniform float uClearcoat;
      in vec3 vLocalPosition;
      out vec4 outColor;

      float revealAt(ivec3 cell) {
        ivec3 limits = ivec3(uVolumeSize);
        if (any(lessThan(cell, ivec3(0))) || any(greaterThanEqual(cell, limits))) return 0.0;
        uint arrival = texelFetch(uArrival, cell, 0).r;
        if (arrival == uint(${String(GUTCHECK_GROWTH_NEVER_TICK)})) return 0.0;
        if (arrival == uint(0)) return 1.0;
        if (arrival > uPlayheadTick) return 0.0;
        float age = float(uPlayheadTick - arrival) + uPlayheadOffset;
        if (uTransition <= 0.0) return 1.0;
        float t = clamp(age / uTransition, 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      }

      float triangularPlaneAt(ivec3 base, vec2 f) {
        float c00 = revealAt(base);
        float c10 = revealAt(base + ivec3(1, 0, 0));
        float c01 = revealAt(base + ivec3(0, 1, 0));
        if (f.x + f.y <= 1.0) {
          return c00 + (c10 - c00) * f.x + (c01 - c00) * f.y;
        }
        float c11 = revealAt(base + ivec3(1, 1, 0));
        return c10 * (1.0 - f.y) + c01 * (1.0 - f.x) + c11 * (f.x + f.y - 1.0);
      }

      float fieldAt(vec3 localPoint) {
        vec3 voxel = localPoint * (uVolumeSize - vec3(1.0));
        ivec3 base = ivec3(floor(voxel));
        vec3 f = fract(voxel);
        float z0 = triangularPlaneAt(base, f.xy);
        float z1 = triangularPlaneAt(base + ivec3(0, 0, 1), f.xy);
        return mix(z0, z1, f.z);
      }

      bool rayBox(vec3 origin, vec3 direction, out float entry, out float exitDistance) {
        vec3 safeDirection = mix(
          vec3(1e-7),
          direction,
          greaterThan(abs(direction), vec3(1e-7))
        );
        vec3 inverseDirection = 1.0 / safeDirection;
        vec3 nearPlane = (vec3(0.0) - origin) * inverseDirection;
        vec3 farPlane = (vec3(1.0) - origin) * inverseDirection;
        vec3 lower = min(nearPlane, farPlane);
        vec3 upper = max(nearPlane, farPlane);
        entry = max(max(lower.x, lower.y), lower.z);
        exitDistance = min(min(upper.x, upper.y), upper.z);
        return exitDistance >= max(entry, 0.0);
      }

      void main() {
        vec3 rayDirection = normalize(uRayDirectionLocal);
        vec3 rayOrigin = vLocalPosition - rayDirection * 1e-4;
        float entry;
        float exitDistance;
        if (!rayBox(rayOrigin, rayDirection, entry, exitDistance)) discard;
        entry = max(entry, 0.0);
        vec3 cellPath = abs(rayDirection * (exitDistance - entry)) * (uVolumeSize - vec3(1.0));
        float requestedSteps = max(8.0, ceil(length(cellPath) * uSamplesPerCell));
        float stepCount = min(requestedSteps, uMaxSteps);
        float stepLength = (exitDistance - entry) / max(stepCount, 1.0);
        float previousDistance = entry;
        float previousField = fieldAt(rayOrigin + rayDirection * entry);
        bool found = previousField >= uIso;
        float hitDistance = entry;

        for (int step = 1; step <= 1024; step++) {
          if (found || float(step) > stepCount) break;
          float distanceAlongRay = min(exitDistance, entry + float(step) * stepLength);
          float value = fieldAt(rayOrigin + rayDirection * distanceAlongRay);
          if (value >= uIso && previousField < uIso) {
            float low = previousDistance;
            float high = distanceAlongRay;
            for (int refine = 0; refine < 4; refine++) {
              float middle = (low + high) * 0.5;
              if (fieldAt(rayOrigin + rayDirection * middle) >= uIso) high = middle;
              else low = middle;
            }
            hitDistance = high;
            found = true;
          }
          previousField = value;
          previousDistance = distanceAlongRay;
        }
        if (!found) discard;

        vec3 hit = rayOrigin + rayDirection * hitDistance;
        vec3 epsilon = 0.72 / max(uVolumeSize - vec3(1.0), vec3(1.0));
        float dx = (fieldAt(hit + vec3(epsilon.x, 0.0, 0.0)) -
                    fieldAt(hit - vec3(epsilon.x, 0.0, 0.0))) / (2.0 * epsilon.x);
        float dy = (fieldAt(hit + vec3(0.0, epsilon.y, 0.0)) -
                    fieldAt(hit - vec3(0.0, epsilon.y, 0.0))) / (2.0 * epsilon.y);
        float dz = (fieldAt(hit + vec3(0.0, 0.0, epsilon.z)) -
                    fieldAt(hit - vec3(0.0, 0.0, epsilon.z))) / (2.0 * epsilon.z);
        vec3 localNormal = normalize(-vec3(dx, dy, dz));
        vec3 viewNormal = normalize(uLocalToViewNormal * localNormal);
        vec3 viewDirection = vec3(0.0, 0.0, 1.0);
        vec3 lightDirection = normalize(vec3(-0.45, 0.65, 0.62));
        float diffuse = max(dot(viewNormal, lightDirection), 0.0);
        float facing = max(dot(viewNormal, viewDirection), 0.0);
        float rim = pow(1.0 - facing, 2.15);
        float sparkle = pow(max(dot(reflect(-lightDirection, viewNormal), viewDirection), 0.0), 48.0);
        vec3 color;
        if (uGlass > 0.5) {
          // The implicit surface has no MeshPhysicalMaterial geometry to hand to Three's
          // transmission pass. Preserve the exact first-hit depth, then precompose the same
          // backdrop through a small normal/IOR offset with a Schlick-Fresnel reflection.
          // This is an explicitly nonphysical glass-styled presentation, not optical evidence.
          vec2 screenUv = gl_FragCoord.xy / max(uViewport, vec2(1.0));
          float eta = 1.0 / max(uIor, 1.0001);
          vec2 refractedUv = clamp(
            screenUv + viewNormal.xy * (1.0 - eta) * (0.08 + 0.10 * (1.0 - facing)),
            vec2(0.002),
            vec2(0.998)
          );
          vec3 throughColor = texture(uBackdrop, refractedUv).rgb;
          throughColor *= mix(vec3(1.0), uBodyColor, 0.08);
          float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
          float fresnel = f0 + (1.0 - f0) * pow(1.0 - facing, 5.0);
          float highlightPower = mix(96.0, 24.0, clamp(uRoughness, 0.0, 1.0));
          float glassHighlight = pow(
            max(dot(reflect(-lightDirection, viewNormal), viewDirection), 0.0),
            highlightPower
          );
          vec3 reflected = uEdgeColor * (0.18 + 0.42 * diffuse);
          reflected += vec3(1.0) * glassHighlight * (0.35 + 0.45 * uSpecular);
          float reflectionWeight = clamp(
            fresnel * (1.0 + 0.65 * uClearcoat) + 0.16 * rim + 0.18 * glassHighlight,
            0.04,
            0.92
          );
          color = mix(throughColor, reflected, reflectionWeight);
          color += uEdgeColor * (0.32 * rim + 0.12 * sparkle);
        } else {
          color = uBodyColor * (0.42 + 0.50 * diffuse);
          color += uEdgeColor * (0.72 * rim + 0.35 * sparkle);
          color += vec3(0.10, 0.16, 0.24) * pow(1.0 - facing, 4.0);
        }
        vec4 hitClip = uLocalToClip * vec4(hit, 1.0);
        gl_FragDepth = 0.5 * (hitClip.z / hitClip.w) + 0.5;
        outColor = linearToOutputTexel(vec4(toneMapping(color), 1.0));
      }
    `,
  });
}

function cropModelMatrix(crop: GrowthCrop, zScale: number): THREE.Matrix4 {
  const size = growthCropSize(crop);
  const iSpan = size[0] - 1;
  const jSpan = size[1] - 1;
  const kSpan = size[2] - 1;
  const centerLattice: GrowthVec3 = [
    (crop.iMin + crop.iMax) / 2,
    (crop.jMin + crop.jMax) / 2,
    (crop.kMin + crop.kMax) / 2,
  ];
  const centerWorld = latticeToGrowthWorld(centerLattice);
  const minimumWorld = latticeToGrowthWorld([crop.iMin, crop.jMin, crop.kMin]);
  return new THREE.Matrix4().set(
    iSpan, jSpan / 2, 0, minimumWorld[0] - centerWorld[0],
    0, jSpan * SQRT3_OVER_2, 0, minimumWorld[1] - centerWorld[1],
    0, 0, kSpan * zScale, (minimumWorld[2] - centerWorld[2]) * zScale,
    0, 0, 0, 1,
  );
}

function extentForCrop(crop: GrowthCrop, zScale: number): THREE.Vector3 {
  const size = growthCropSize(crop);
  const iSpan = size[0] - 1;
  const jSpan = size[1] - 1;
  const kSpan = size[2] - 1;
  return new THREE.Vector3(iSpan + jSpan / 2, jSpan * SQRT3_OVER_2, kSpan * zScale);
}

interface GrowthWorldBounds {
  readonly min: THREE.Vector3;
  readonly max: THREE.Vector3;
}

function occupiedSampleWorldBounds(
  asset: DecodedGrowthAsset,
  crop: GrowthCrop,
  zScale: number,
): GrowthWorldBounds {
  const centerWorld = latticeToGrowthWorld([
    (crop.iMin + crop.iMax) / 2,
    (crop.jMin + crop.jMax) / 2,
    (crop.kMin + crop.kMax) / 2,
  ]);
  const min = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const max = new THREE.Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );
  for (let event = 0; event < asset.flatIndices.length; event++) {
    const lattice = growthLatticeCoordinates(asset.header.config.dims, asset.flatIndices[event]!);
    const world = latticeToGrowthWorld(lattice);
    min.x = Math.min(min.x, world[0] - centerWorld[0]);
    min.y = Math.min(min.y, world[1] - centerWorld[1]);
    min.z = Math.min(min.z, (world[2] - centerWorld[2]) * zScale);
    max.x = Math.max(max.x, world[0] - centerWorld[0]);
    max.y = Math.max(max.y, world[1] - centerWorld[1]);
    max.z = Math.max(max.z, (world[2] - centerWorld[2]) * zScale);
  }
  return { min, max };
}

/** Capture-only allocation probe: center the real decoded volume inside a larger empty field. */
function expandVolumeForProbe(
  volume: DenseExactGrowthVolume,
  requested: GrowthVec3,
): DenseExactGrowthVolume {
  const original = growthCropSize(volume.crop);
  for (let axis = 0; axis < 3; axis++) {
    if (!Number.isSafeInteger(requested[axis]) || requested[axis] < original[axis]) {
      throw new Error(
        `probeVolume axis ${axis} must be an integer >= decoded size ${original[axis]}, got ${requested[axis]}`,
      );
    }
  }
  const cells = requested[0] * requested[1] * requested[2];
  if (!Number.isSafeInteger(cells) || cells > 128 * 1024 * 1024) {
    throw new Error(`probeVolume cell count ${cells} exceeds the capture allocation limit`);
  }
  const offsets: GrowthVec3 = [
    Math.floor((requested[0] - original[0]) / 2),
    Math.floor((requested[1] - original[1]) / 2),
    Math.floor((requested[2] - original[2]) / 2),
  ];
  const data = new Uint32Array(cells);
  data.fill(GUTCHECK_GROWTH_NEVER_TICK);
  for (let k = 0; k < original[2]; k++) {
    for (let j = 0; j < original[1]; j++) {
      const source = k * original[0] * original[1] + j * original[0];
      const target =
        (k + offsets[2]) * requested[0] * requested[1] +
        (j + offsets[1]) * requested[0] +
        offsets[0];
      data.set(volume.data.subarray(source, source + original[0]), target);
    }
  }
  const crop = {
    iMin: volume.crop.iMin - offsets[0],
    iMax: volume.crop.iMin - offsets[0] + requested[0] - 1,
    jMin: volume.crop.jMin - offsets[1],
    jMax: volume.crop.jMin - offsets[1] + requested[1] - 1,
    kMin: volume.crop.kMin - offsets[2],
    kMax: volume.crop.kMin - offsets[2] + requested[2] - 1,
    padding: volume.crop.padding,
  };
  return {
    data,
    crop,
    size: requested,
    finalTick: volume.finalTick,
    neverTick: GUTCHECK_GROWTH_NEVER_TICK,
  };
}

export async function runGutcheckGrowthView(
  assetUrl: string,
  options: GutcheckGrowthViewOptions,
): Promise<void> {
  const appearance = validatedAppearance(options.appearance);
  const absoluteUrl = new URL(assetUrl, window.location.href);
  const response = await fetch(absoluteUrl);
  if (!response.ok) throw new Error(`growth asset fetch failed: ${response.status} ${assetUrl}`);
  const sourceBuffer = await response.arrayBuffer();
  const asset = decodeGrowthAsset(sourceBuffer);
  const presentation = options.presentation;
  if (presentation !== null) {
    if (
      presentation.firstTick !== 0 ||
      presentation.finalTick !== asset.header.finalTick
    ) {
      throw new Error(
        `growth presentation ${presentation.id} is incompatible with the decoded Run B tick envelope`,
      );
    }
    if (options.query.has("duration")) {
      throw new Error("growth duration cannot override a named presentation clock");
    }
  }
  let volume = buildDenseExactTickVolume(asset);
  let syntheticProbe: GrowthVec3 | null = null;
  const probeRaw = options.query.get("probeVolume");
  if (probeRaw !== null && probeRaw !== "") {
    if (options.query.get("capture") !== "1") {
      throw new Error("probeVolume is capture-only and cannot be used in an interactive replay");
    }
    const parts = probeRaw.split(",").map(Number);
    if (parts.length !== 3) throw new Error("probeVolume wants width,height,layers");
    syntheticProbe = [parts[0]!, parts[1]!, parts[2]!];
    volume = expandVolumeForProbe(volume, syntheticProbe);
  }
  const volumeSize = growthCropSize(volume.crop);
  const quality = selectedQuality(options.query);
  const zScale = options.zScale;
  if (!Number.isFinite(zScale) || zScale <= 0) throw new Error(`growth zScale must be positive, got ${zScale}`);

  const spikeWindow = window as unknown as GrowthWindow;
  const canvas = document.createElement("canvas");
  let contextLost = false;
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    spikeWindow.__spikeError = "growth WebGL2 context was lost";
    spikeWindow.__spikeReady = false;
  });
  const context = canvas.getContext("webgl2", {
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: options.query.get("capture") === "1",
  });
  if (context === null) throw new Error("growth replay requires WebGL2");
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = finitePositiveParam(options.query, "exposure", 1.05);
  document.body.appendChild(renderer.domElement);

  const maxTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE) as number;
  const maxArrayTextureLayers = context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS) as number;
  const max3DTextureSize = context.getParameter(context.MAX_3D_TEXTURE_SIZE) as number;
  if (volumeSize[0] > maxTextureSize || volumeSize[1] > maxTextureSize) {
    throw new Error(
      `growth crop ${volumeSize[0]}x${volumeSize[1]} exceeds MAX_TEXTURE_SIZE ${maxTextureSize}`,
    );
  }
  if (volumeSize[2] > maxArrayTextureLayers) {
    throw new Error(
      `growth crop depth ${volumeSize[2]} exceeds MAX_ARRAY_TEXTURE_LAYERS ${maxArrayTextureLayers}`,
    );
  }
  const debugRenderer = context.getExtension("WEBGL_debug_renderer_info");
  const vendor = debugRenderer === null
    ? String(context.getParameter(context.VENDOR))
    : String(context.getParameter(debugRenderer.UNMASKED_VENDOR_WEBGL));
  const rendererName = debugRenderer === null
    ? String(context.getParameter(context.RENDERER))
    : String(context.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL));

  const texture = new THREE.DataArrayTexture(volume.data, volumeSize[0], volumeSize[1], volumeSize[2]);
  texture.format = THREE.RedIntegerFormat;
  texture.type = THREE.UnsignedIntType;
  texture.internalFormat = "R32UI";
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.unpackAlignment = 4;
  texture.needsUpdate = true;

  const scene = new THREE.Scene();
  const backdrop = makeBackdrop(options.backdropTop, options.backdropBottom);
  scene.background = backdrop;
  const group = new THREE.Group();
  scene.add(group);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0.5, 0.5, 0.5);
  const material = growthShaderMaterial(
    texture,
    volumeSize,
    quality,
    options.bodyColor,
    options.edgeColor,
    backdrop,
    appearance,
  );
  const crystal = new THREE.Mesh(geometry, material);
  crystal.matrixAutoUpdate = false;
  crystal.matrix.copy(cropModelMatrix(volume.crop, zScale));
  group.add(crystal);
  const occupiedBounds = occupiedSampleWorldBounds(asset, volume.crop, zScale);

  const extent = extentForCrop(volume.crop, zScale);
  const cropRadius = Math.max(extent.length() / 2, 1);
  const framingRadius = presentation?.frameExtent === undefined
    ? cropRadius
    : presentation.frameExtent / 2;
  const framingSpan = framingRadius * 1.12;
  const cameraDistance = presentation?.frameExtent === undefined
    ? cropRadius * 3
    : presentation.frameExtent * 2;
  const camera = new THREE.OrthographicCamera(
    -framingSpan,
    framingSpan,
    framingSpan,
    -framingSpan,
    0.01,
    cameraDistance + cropRadius * 3,
  );
  camera.position.set(0, 0, cameraDistance);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.saveState();

  const reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    options.query.get("reduceMotion") === "1";
  const durationSeconds = presentation?.duration ?? finitePositiveParam(options.query, "duration", 18);
  const transitionTicks = finitePositiveParam(
    options.query,
    "transitionTicks",
    Math.max(1, asset.header.finalTick / 600),
  );
  material.uniforms["uTransition"]!.value = transitionTicks;

  const sceneFrameAt = (seconds: number): number => {
    if (presentation === null) {
      return (Math.max(0, Math.min(durationSeconds, seconds)) / durationSeconds) *
        (asset.header.finalTick / 100);
    }
    return sampleSceneFrameCoordinate(presentation.motion.frames, seconds);
  };
  const tickAtSceneTime = (seconds: number): number => {
    if (presentation === null) {
      return Math.max(0, Math.min(asset.header.finalTick, (seconds / durationSeconds) * asset.header.finalTick));
    }
    return Math.max(
      presentation.firstTick,
      Math.min(presentation.finalTick, sceneFrameAt(seconds) * presentation.tickInterval),
    );
  };
  const sceneTimeAtTick = (tick: number): number => {
    const bounded = Math.max(0, Math.min(asset.header.finalTick, tick));
    if (presentation === null) return (bounded / asset.header.finalTick) * durationSeconds;
    return sceneTimeAtFrameCoordinate(presentation.motion.frames, bounded / presentation.tickInterval);
  };

  let currentTick = Math.max(
    0,
    Math.min(asset.header.finalTick, Number(options.query.get("tick") ?? 0)),
  );
  if (!Number.isFinite(currentTick)) currentTick = 0;
  let sceneSeconds = sceneTimeAtTick(currentTick);
  let displayTick = currentTick >= asset.header.finalTick
    ? asset.header.finalTick + transitionTicks
    : currentTick;
  let playing = options.query.get("autoplay") === "1" && !reducedMotion;
  let playbackStart = 0;
  let playbackStartSceneSeconds = sceneSeconds;
  let playbackStartDisplayTick = displayTick;
  let cameraMode: "scripted" | "manualHold" = presentation === null ? "manualHold" : "scripted";
  let sampledFrame = sceneFrameAt(sceneSeconds);
  let sampledCamera: SceneCameraPose = presentation === null
    ? { tilt: 0, yaw: 0, zoom: 1 }
    : sampleSceneCamera(presentation.motion.camera, sceneSeconds);

  let representativeGrowthTick: number | null = null;
  let lastPreFinal = asset.attachTicks.length - 1;
  while (lastPreFinal >= asset.header.seedCount && asset.attachTicks[lastPreFinal]! >= asset.header.finalTick) {
    lastPreFinal--;
  }
  if (lastPreFinal >= asset.header.seedCount) {
    const representativeIndex = Math.floor((asset.header.seedCount + lastPreFinal) / 2);
    const candidate = asset.attachTicks[representativeIndex]!;
    if (candidate > 0 && candidate < asset.header.finalTick) representativeGrowthTick = candidate;
  }

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(asset.header.finalTick);
  slider.step = "1";
  slider.value = String(Math.round(currentTick));
  slider.style.cssText = "flex:1;min-width:180px";
  slider.dataset.growthControl = "timeline";
  slider.setAttribute("aria-label", "Growth replay tick");
  const tickLabel = document.createElement("span");
  tickLabel.style.cssText = "min-width:205px;text-align:right";
  const playButton = styledButton(playing ? "pause" : "play");
  playButton.dataset.growthControl = "play";
  if (reducedMotion) {
    playButton.disabled = true;
    playButton.textContent = "play disabled";
    playButton.title = "Playback is disabled because reduced motion is enabled; use the timeline to seek.";
    playButton.style.cursor = "not-allowed";
    playButton.style.opacity = "0.68";
  }
  const faceButton = styledButton(presentation === null ? "face-on" : "follow tour");
  faceButton.dataset.growthControl = presentation === null ? "face-on" : "follow-tour";
  const bar = document.createElement("div");
  bar.style.cssText =
    "position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;align-items:center;" +
    "padding:10px 14px;background:rgba(8,12,22,.68);color:#dfe7f4;" +
    "font:13px/1.4 ui-monospace,monospace;z-index:10";
  bar.append(playButton, slider, tickLabel, faceButton);
  if (options.query.get("ui") !== "0") {
    document.body.append(makeStatusLabel(appearance, presentation?.id ?? null), bar);
  }

  const debugState: GrowthDebugState = {
    mode: "gutcheck-growth-v1",
    tick: currentTick,
    displayTick,
    normalizedTime: asset.header.finalTick === 0 ? 0 : currentTick / asset.header.finalTick,
    finalTick: asset.header.finalTick,
    representativeGrowthTick,
    playing,
    reducedMotion,
    quality: quality.name,
    appearance,
    presentation: presentation === null
      ? null
      : {
          id: presentation.id,
          sourceSha256: presentation.sha256,
          durationSeconds,
          sceneSeconds,
          sampledFrame,
          legacyFrame: Math.round(sampledFrame),
          tickInterval: presentation.tickInterval,
          growthSampling: "continuous-frame-coordinate",
          cameraMode,
          camera: {
            tiltDegrees: sampledCamera.tilt,
            yawDegrees: sampledCamera.yaw,
            zoom: sampledCamera.zoom,
          },
        },
    viewport: { width: window.innerWidth, height: window.innerHeight, pixelRatio: 1 },
    capabilities: {
      webgl2: true,
      maxTextureSize,
      maxArrayTextureLayers,
      max3DTextureSize,
      renderer: rendererName,
      vendor,
    },
    framing: {
      radius: framingRadius,
      halfWidth: framingSpan,
      halfHeight: framingSpan,
      projectedBounds: { xMin: 0, xMax: 0, yMin: 0, yMax: 0 },
    },
    asset: {
      terminationReason: asset.header.terminationReason,
      config: asset.header.config,
      source: asset.header.source,
    },
    volume: {
      size: volumeSize,
      crop: { ...volume.crop },
      eventCount: asset.header.eventCount,
      sourceBytes: sourceBuffer.byteLength,
      decodedUint32Bytes: volume.data.byteLength,
      nominalTextureBytes: volume.data.byteLength,
      textureFormat: "R32UI DataArrayTexture",
      syntheticProbe,
    },
  };
  spikeWindow.__growthDebug = debugState;

  const projectedBounds = (): GrowthDebugState["framing"]["projectedBounds"] => {
    camera.updateMatrixWorld(true);
    group.updateMatrixWorld(true);
    const point = new THREE.Vector3();
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    for (const x of [occupiedBounds.min.x, occupiedBounds.max.x]) {
      for (const y of [occupiedBounds.min.y, occupiedBounds.max.y]) {
        for (const z of [occupiedBounds.min.z, occupiedBounds.max.z]) {
          point.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
          xMin = Math.min(xMin, point.x);
          xMax = Math.max(xMax, point.x);
          yMin = Math.min(yMin, point.y);
          yMax = Math.max(yMax, point.y);
        }
      }
    }
    return { xMin, xMax, yMin, yMax };
  };

  const updateProjection = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, quality.dprCap);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    (material.uniforms["uViewport"]!.value as THREE.Vector2).set(
      renderer.domElement.width,
      renderer.domElement.height,
    );
    const aspect = width / Math.max(height, 1);
    const halfWidth = framingSpan * Math.max(1, aspect);
    const halfHeight = framingSpan * Math.max(1, 1 / aspect);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    debugState.viewport = { width, height, pixelRatio };
    debugState.framing = {
      radius: framingRadius,
      halfWidth,
      halfHeight,
      projectedBounds: projectedBounds(),
    };
  };
  updateProjection();
  window.addEventListener("resize", updateProjection);

  const updatePresentation = (): void => {
    const playhead = splitGrowthPlayhead(displayTick, asset.header.finalTick);
    material.uniforms["uPlayheadTick"]!.value = playhead.wholeTick;
    material.uniforms["uPlayheadOffset"]!.value = playhead.offsetTicks;
    slider.value = String(Math.round(currentTick));
    const settling = presentation === null && playing &&
      currentTick >= asset.header.finalTick && displayTick < asset.header.finalTick + transitionTicks;
    tickLabel.textContent =
      `tick ${Math.round(currentTick).toLocaleString()} / ${asset.header.finalTick.toLocaleString()}` +
      (presentation === null
        ? (settling ? " · settling surface" : "")
        : ` · ${sceneSeconds.toFixed(2)} / ${durationSeconds.toFixed(0)} s`);
    debugState.tick = currentTick;
    debugState.displayTick = displayTick;
    debugState.normalizedTime = asset.header.finalTick === 0 ? 0 : currentTick / asset.header.finalTick;
    debugState.playing = playing;
    if (debugState.presentation !== null) {
      debugState.presentation = {
        ...debugState.presentation,
        sceneSeconds,
        sampledFrame,
        legacyFrame: Math.round(sampledFrame),
        cameraMode,
        camera: {
          tiltDegrees: sampledCamera.tilt,
          yawDegrees: sampledCamera.yaw,
          zoom: sampledCamera.zoom,
        },
      };
    }
  };

  const inverseModelScratch = new THREE.Matrix4();
  const modelViewScratch = new THREE.Matrix4();
  const localToClipScratch = new THREE.Matrix4();
  const rayDirectionScratch = new THREE.Vector3();
  const updateCameraUniforms = (): void => {
    camera.updateMatrixWorld(true);
    group.updateMatrixWorld(true);
    crystal.updateMatrixWorld(true);
    inverseModelScratch.copy(crystal.matrixWorld).invert();
    camera.getWorldDirection(rayDirectionScratch).transformDirection(inverseModelScratch);
    (material.uniforms["uRayDirectionLocal"]!.value as THREE.Vector3).copy(rayDirectionScratch);
    modelViewScratch.multiplyMatrices(camera.matrixWorldInverse, crystal.matrixWorld);
    (material.uniforms["uLocalToViewNormal"]!.value as THREE.Matrix3).getNormalMatrix(modelViewScratch);
    localToClipScratch.multiplyMatrices(camera.projectionMatrix, modelViewScratch);
    (material.uniforms["uLocalToClip"]!.value as THREE.Matrix4).copy(localToClipScratch);
  };

  const render = (): void => {
    updateCameraUniforms();
    renderer.render(scene, camera);
  };

  const settle = (): Promise<void> =>
    new Promise((resolveSettle) => requestAnimationFrame(() => requestAnimationFrame(() => resolveSettle())));

  const applyCameraPose = (pose: SceneCameraPose): void => {
    // OrbitControls keeps private damping deltas after pointer release. Drain them before
    // applying an authored pose so a follow/seek cannot be nudged off-track on the next RAF.
    const dampingWasEnabled = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = dampingWasEnabled;
    const tilt = (pose.tilt * Math.PI) / 180;
    const yaw = (pose.yaw * Math.PI) / 180;
    const position = new THREE.Vector3(0, Math.sin(tilt) * cameraDistance, Math.cos(tilt) * cameraDistance);
    position.applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw);
    camera.position.copy(position);
    camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw);
    controls.target.set(0, 0, 0);
    camera.zoom = pose.zoom;
    camera.updateProjectionMatrix();
    camera.lookAt(controls.target);
    controls.update();
    sampledCamera = pose;
    debugState.framing = {
      ...debugState.framing,
      projectedBounds: projectedBounds(),
    };
  };

  const samplePresentationClock = (seconds: number): void => {
    sceneSeconds = Math.max(0, Math.min(durationSeconds, seconds));
    sampledFrame = sceneFrameAt(sceneSeconds);
    currentTick = tickAtSceneTime(sceneSeconds);
    displayTick = currentTick >= asset.header.finalTick
      ? asset.header.finalTick + transitionTicks
      : currentTick;
    if (presentation !== null) {
      const scriptedPose = sampleSceneCamera(presentation.motion.camera, sceneSeconds);
      if (cameraMode === "scripted") {
        sampledCamera = scriptedPose;
        applyCameraPose(scriptedPose);
      }
    }
  };

  const seekTime = async (seconds: number): Promise<void> => {
    if (!Number.isFinite(seconds)) {
      throw new Error(`growth scene seek time must be finite, got ${String(seconds)}`);
    }
    playing = false;
    playButton.textContent = "play";
    if (presentation !== null) cameraMode = "scripted";
    samplePresentationClock(seconds);
    updatePresentation();
    render();
    await settle();
  };

  const seek = async (tick: number): Promise<void> => {
    if (!Number.isFinite(tick)) throw new Error(`growth seek tick must be finite, got ${String(tick)}`);
    playing = false;
    playButton.textContent = "play";
    currentTick = Math.max(0, Math.min(asset.header.finalTick, tick));
    displayTick = currentTick >= asset.header.finalTick
      ? asset.header.finalTick + transitionTicks
      : currentTick;
    if (presentation === null) {
      sceneSeconds = sceneTimeAtTick(currentTick);
      sampledFrame = sceneFrameAt(sceneSeconds);
    } else {
      const tickSample = sceneTickDrivenSample(
        presentation.motion.frames,
        currentTick,
        presentation.tickInterval,
      );
      sceneSeconds = tickSample.timeSeconds;
      sampledFrame = tickSample.frameCoordinate;
      cameraMode = "scripted";
      sampledCamera = sampleSceneCamera(presentation.motion.camera, sceneSeconds);
      applyCameraPose(sampledCamera);
    }
    updatePresentation();
    render();
    await settle();
  };

  const setView = async (
    tiltDegrees: number,
    yawDegrees: number,
    zoom = 1,
  ): Promise<void> => {
    if (!Number.isFinite(tiltDegrees) || !Number.isFinite(yawDegrees) || !Number.isFinite(zoom)) {
      throw new Error("growth view angles and zoom must be finite");
    }
    if (zoom <= 0 || zoom > 8) throw new Error(`growth view zoom must be in (0, 8], got ${zoom}`);
    cameraMode = "manualHold";
    const manualPose = {
      tilt: Math.max(-89, Math.min(89, tiltDegrees)),
      yaw: yawDegrees,
      zoom,
    };
    applyCameraPose(manualPose);
    updatePresentation();
    render();
    await settle();
  };

  const followCamera = async (): Promise<void> => {
    if (presentation === null) {
      await setView(0, 0, 1);
      return;
    }
    cameraMode = "scripted";
    sampledCamera = sampleSceneCamera(presentation.motion.camera, sceneSeconds);
    applyCameraPose(sampledCamera);
    updatePresentation();
    render();
    await settle();
  };

  let benchmarkRunning = false;
  const benchmark = async (samples: number): Promise<number[]> => {
    if (!Number.isSafeInteger(samples) || samples < 1 || samples > 240) {
      throw new Error(`growth benchmark samples must be an integer in [1, 240], got ${samples}`);
    }
    if (benchmarkRunning) throw new Error("growth benchmark is already running");
    benchmarkRunning = true;
    const durations: number[] = [];
    try {
      await settle();
      context.finish();
      for (let sample = 0; sample < samples; sample++) {
        await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
        const started = performance.now();
        render();
        context.finish();
        durations.push(performance.now() - started);
      }
    } finally {
      benchmarkRunning = false;
    }
    return durations;
  };

  spikeWindow.__growthSeek = seek;
  spikeWindow.__growthSeekTime = seekTime;
  spikeWindow.__growthSetView = setView;
  spikeWindow.__growthFollowCamera = followCamera;
  spikeWindow.__growthBenchmark = benchmark;

  controls.addEventListener("start", () => {
    if (presentation === null) return;
    cameraMode = "manualHold";
    sampledCamera = sceneCameraPoseFromPosition(camera.position, camera.zoom);
    updatePresentation();
  });

  slider.addEventListener("input", () => {
    void seek(Number(slider.value));
  });
  playButton.addEventListener("click", () => {
    if (reducedMotion) return;
    if (!playing) {
      if (presentation !== null) {
        if (sceneSeconds >= durationSeconds) samplePresentationClock(0);
        playbackStartSceneSeconds = sceneSeconds;
      } else {
        if (displayTick >= asset.header.finalTick + transitionTicks) {
          currentTick = 0;
          displayTick = 0;
          sceneSeconds = 0;
        }
        playbackStartDisplayTick = displayTick;
      }
      playbackStart = performance.now();
    }
    playing = !playing;
    playButton.textContent = playing ? "pause" : "play";
    updatePresentation();
  });
  faceButton.addEventListener("click", () => {
    if (presentation === null) void setView(0, 0, 1);
    else void followCamera();
  });

  if (presentation !== null) applyCameraPose(sampledCamera);
  updatePresentation();
  render(); // Forces texture allocation and GLSL compilation before readiness is published.
  context.finish();
  const programs = renderer.info.programs as unknown as ReadonlyArray<{
    readonly diagnostics?: { readonly runnable?: boolean; readonly programLog?: string };
  }> | null;
  const failedProgram = programs?.find((program) => program.diagnostics?.runnable === false);
  if (failedProgram !== undefined) {
    throw new Error(
      `growth shader failed to compile: ${failedProgram.diagnostics?.programLog ?? "no driver log"}`,
    );
  }
  const initialGlError = context.getError();
  if (contextLost || context.isContextLost() || initialGlError !== context.NO_ERROR) {
    throw new Error(
      `growth WebGL2 initialization failed (contextLost=${String(contextLost || context.isContextLost())}, error=${initialGlError})`,
    );
  }

  const animate = (now: number): void => {
    requestAnimationFrame(animate);
    if (playing) {
      const elapsed = Math.max(0, (now - playbackStart) / 1000);
      if (presentation !== null) {
        samplePresentationClock(playbackStartSceneSeconds + elapsed);
        if (sceneSeconds >= durationSeconds) {
          playing = false;
          playButton.textContent = "play";
        }
      } else {
        displayTick = Math.max(
          0,
          playbackStartDisplayTick + (elapsed / durationSeconds) * asset.header.finalTick,
        );
        currentTick = Math.max(0, Math.min(asset.header.finalTick, displayTick));
        sceneSeconds = Math.min(durationSeconds, (currentTick / asset.header.finalTick) * durationSeconds);
        if (displayTick >= asset.header.finalTick + transitionTicks) {
          displayTick = asset.header.finalTick + transitionTicks;
          currentTick = asset.header.finalTick;
          sceneSeconds = durationSeconds;
          playing = false;
          playButton.textContent = "play";
        }
      }
      updatePresentation();
    }
    if (!benchmarkRunning) {
      if (presentation === null || cameraMode === "manualHold") controls.update();
      if (presentation !== null && cameraMode === "manualHold") {
        sampledCamera = sceneCameraPoseFromPosition(camera.position, camera.zoom);
        debugState.framing = {
          ...debugState.framing,
          projectedBounds: projectedBounds(),
        };
        updatePresentation();
      }
      render();
    }
  };
  if (playing) {
    playbackStart = performance.now();
    playbackStartSceneSeconds = sceneSeconds;
  }
  requestAnimationFrame(animate);
  spikeWindow.__spikeReady = true;
}
