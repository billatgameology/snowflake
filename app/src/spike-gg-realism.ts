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
//   ?growthScene=<url> strict growth-scene-v1 composed playback over verified growth assets.
//
// Static captures stay bit-stable for the recorded recipes: fixed backdrop plane, pixel
// ratio 1, single render. Interactive/timeline modes use a screen-fixed background and
// device-pixel-ratio supersampling. Rule 7 note: per phase-3 A2-7 precedent, the four
// three.js blending/canvas flags with the banned stem are never used here.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createSceneEditor } from "./scene-editor.ts";
import { decodeGrowthAssetV1, visibleGrowthEventCount } from "./growth-asset.ts";
import {
  GROWTH_SCENE_WEB_LIMIT_BYTES,
  growthSceneColdPayloadBytes,
  parseGrowthSceneV1,
} from "./growth-scene.ts";
import { spikeOrthographicFrame } from "./spike-frame.ts";

interface SpikeWindow {
  __spikeReady?: boolean;
  __spikeError?: string;
  /** Scene mode (?scene=): deterministic seek used by app/scripts/scene-capture.mjs. */
  __sceneSeek?: (tSeconds: number) => Promise<void>;
  __sceneDuration?: number;
}

interface GutcheckMesh {
  header: Record<string, unknown>;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  /** Present for cell-true meshes: drawn edge segments (endpoint pairs). */
  edgePositions?: Float32Array;
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

// ── Look registry (maker-directed): every distinct look this exploration produced, kept
// as a named recipe. ?look=<name> applies one; explicit URL params still override any
// single knob. The registry is the source of truth — the plan file mirrors it.
interface LookPreset {
  readonly style: "ice" | "povray" | "ggview";
  readonly note: string;
  readonly params: Readonly<Record<string, string>>;
}
const LOOKS: Readonly<Record<string, LookPreset>> = {
  "footage-ice": {
    style: "ice",
    note: "J0521r2p footage target: warm/indigo microscopy ice (locked 2026-08-03)",
    params: {
      edge: "2.2", edgeLo: "0.06", edgePow: "1.0", edgeCool: "100c2e",
      keyI: "3.6", fillI: "2.2", fillHex: "7d90e8", dispersion: "0.18",
      bgTop: "e2ae4e", bgBottom: "8f9be0", exposure: "1.0", zscale: "3.5",
    },
  },
  "bold-ice": {
    style: "ice",
    note: "high-visibility presentation ice (maker-preferred for legibility)",
    params: {
      keyI: "3.2", fillI: "1.3", thick: "14", edge: "1.9", edgePow: "1.3",
      rough: "0.05", zscale: "2.5", bgTop: "e6b95c", bgBottom: "9aa5e0",
    },
  },
  povray: {
    style: "povray",
    note: "G-G Fig. 4 ray-trace target: backlit navy glow (locked 2026-08-03)",
    params: {
      tr: "0.72", body: "dceafc", edge: "1.35", edgeLo: "0.08", edgeCool: "ecf4ff",
      spec: "1.5", keyI: "2.7", exposure: "1.28", bgInner: "5b8fd8", bgOuter: "04060f",
    },
  },
  ggview: {
    style: "ggview",
    note: "cell-true prisms + drawn structure edges (use a -cellmesh.bin)",
    params: {},
  },

  // ── Exploratory looks (2026-08-06, maker-requested "a few more looks"). ──────────────
  // The four above are targets: footage-ice and povray are locked reproductions of specific
  // reference images and bold-ice is the maker's legibility pick. These five are not
  // reproductions of anything — they exist because one animation plus a look dropdown is a
  // cheap way to see the same growth several ways. All are `ice` or `povray` so they work on
  // the anim-B timeline; a `ggview` preset would need a -cellmesh.bin the frames do not have.
  frost: {
    style: "ice",
    note: "clean daylight ice: pale sky, crisp edges, low drama",
    params: {
      keyHex: "ffffff", keyI: "2.8", fillHex: "aec4e6", fillI: "1.5",
      edge: "2.1", edgePow: "1.25", edgeLo: "0.12", edgeCool: "22304a", edgeWarm: "ffffff",
      thick: "12", rough: "0.08", spec: "1.0",
      bgTop: "eef4fb", bgBottom: "c6d4e8", exposure: "1.0", zscale: "2.4",
    },
  },
  aurora: {
    style: "ice",
    note: "polar night: teal-to-violet sky, cyan rim light, heavy dispersion",
    params: {
      keyHex: "9ffbe0", keyI: "3.0", fillHex: "7a6cf0", fillI: "1.6",
      edge: "2.0", edgePow: "1.1", edgeLo: "0.10", edgeCool: "06131f", edgeWarm: "b8ffe8",
      dispersion: "0.25", thick: "16", rough: "0.04", spec: "1.1",
      bgTop: "07373f", bgBottom: "141033", exposure: "1.05", zscale: "2.8",
    },
  },
  ember: {
    style: "ice",
    note: "low sun: amber-to-plum sky, warm gold rim, glassy body",
    params: {
      keyHex: "ffd9a0", keyI: "3.4", fillHex: "e3739b", fillI: "1.7",
      edge: "1.8", edgePow: "1.2", edgeLo: "0.10", edgeCool: "2b0f2a", edgeWarm: "ffe6bd",
      dispersion: "0.12", thick: "15", rough: "0.06", spec: "1.0",
      bgTop: "ff9d5c", bgBottom: "6c2f6b", exposure: "1.05", zscale: "2.6",
    },
  },
  graphite: {
    style: "ice",
    note: "monochrome print: neutral grey, matte body, near-black contour",
    params: {
      keyHex: "ffffff", keyI: "2.6", fillHex: "b9bec7", fillI: "1.2",
      edge: "2.6", edgePow: "1.5", edgeLo: "0.08", edgeCool: "15181c", edgeWarm: "6d747f",
      tr: "0.85", thick: "8", rough: "0.22", spec: "0.4",
      bgTop: "d8dade", bgBottom: "9ea3ab", exposure: "0.95", zscale: "2.2",
    },
  },
  abyss: {
    style: "povray",
    note: "the povray ray-trace treatment over a teal backlight instead of navy",
    params: {
      tr: "0.7", body: "d8fbf5", edge: "1.3", edgeLo: "0.08", edgeCool: "eafffb",
      spec: "1.4", keyHex: "e6fffb", keyI: "2.6",
      bgInner: "2aa6a0", bgOuter: "02100f", exposure: "1.25",
    },
  },
  // Genuinely see-through (maker, 2026-08-06). The material was always physically
  // transmissive — what read as solid was `thick` 14 (long attenuation path tints the body
  // opaque), FrontSide (back faces never drawn, so there is nothing to see through TO), and
  // ior 1.31 (real ice, but it refracts the far side into an unreadable smear). Thin walls +
  // double-sided + a gentler ior gives clear glass you can read the far arms through. Not
  // physically faithful — `footage-ice` and `povray` remain the honest ones.
  glass: {
    style: "ice",
    note: "clear glass: thin walls, double-sided, backdrop visible through the crystal",
    params: {
      tr: "1.0", thick: "2", rough: "0.02", ior: "1.12", side: "double",
      body: "ffffff", spec: "0.8", cc: "0.35", env: "1.3",
      // Light contour on a dark backdrop. A clear body over a pale backdrop is invisible —
      // transparency only reads when there is something behind it to see through TO.
      edge: "1.6", edgePow: "1.3", edgeLo: "0.12", edgeCool: "cfe8ff", edgeWarm: "ffffff",
      keyHex: "ffffff", keyI: "2.8", fillHex: "8fb6e8", fillI: "1.2",
      // Maker-picked off the live bg swatches, 2026-08-06: steel blue over warm grey.
      bgTop: "296bb3", bgBottom: "a6abb5", exposure: "1.1", zscale: "2.4",
    },
  },
};
const activeLookName = query.get("look");
const activeLook = activeLookName !== null ? LOOKS[activeLookName] : undefined;

const styleRaw = query.get("style") ?? activeLook?.style ?? null;
const style = styleRaw === "povray" ? "povray" : styleRaw === "ggview" ? "ggview" : "ice";

/** URL param, then active-look preset, then per-style default. */
function param(name: string, iceDefault: string, povDefault?: string): string {
  const v = query.get(name);
  if (v !== null && v !== "") return v;
  const preset = activeLook?.params[name];
  if (preset !== undefined) return preset;
  return style === "povray" && povDefault !== undefined ? povDefault : iceDefault;
}

/** Decode gutcheck-mesh-v2q (scripts/gutcheck-mesh-quantize.ts — keep in sync): u16
 * bbox-quantized positions, octahedral snorm8 normals, u16/u32 indices, 4-byte aligned. */
function parseMeshV2q(buffer: ArrayBuffer, header: Record<string, unknown>, headerLen: number): GutcheckMesh {
  const vertexCount = header["vertexCount"] as number;
  const triangleCount = header["triangleCount"] as number;
  const bboxMin = header["bboxMin"] as [number, number, number];
  const bboxMax = header["bboxMax"] as [number, number, number];
  const align4 = (n: number): number => Math.ceil(n / 4) * 4;
  const posOff = 4 + headerLen;
  const normOff = align4(posOff + vertexCount * 3 * 2);
  const idxOff = align4(normOff + vertexCount * 2);
  const qPositions = new Uint16Array(buffer, posOff, vertexCount * 3);
  const qNormals = new Int8Array(buffer, normOff, vertexCount * 2);
  const positions = new Float32Array(vertexCount * 3);
  for (let axis = 0; axis < 3; axis++) {
    const min = bboxMin[axis]!;
    const span = (bboxMax[axis]! - min) / 65535;
    for (let i = axis; i < vertexCount * 3; i += 3) positions[i] = min + qPositions[i]! * span;
  }
  const normals = new Float32Array(vertexCount * 3);
  const signNonZero = (v: number): number => (v >= 0 ? 1 : -1);
  for (let v = 0; v < vertexCount; v++) {
    let x = qNormals[v * 2]! / 127;
    let y = qNormals[v * 2 + 1]! / 127;
    const z = 1 - Math.abs(x) - Math.abs(y);
    if (z < 0) {
      const ox = (1 - Math.abs(y)) * signNonZero(x);
      const oy = (1 - Math.abs(x)) * signNonZero(y);
      x = ox;
      y = oy;
    }
    const len = Math.hypot(x, y, z) || 1;
    normals[v * 3] = x / len;
    normals[v * 3 + 1] = y / len;
    normals[v * 3 + 2] = z / len;
  }
  const indices =
    header["indexType"] === "u16"
      ? Uint32Array.from(new Uint16Array(buffer, idxOff, triangleCount * 3))
      : new Uint32Array(buffer, idxOff, triangleCount * 3);
  return { header, positions, normals, indices };
}

function parseMesh(buffer: ArrayBuffer): GutcheckMesh {
  const dv = new DataView(buffer);
  const headerLen = dv.getUint32(0, true);
  const headerText = new TextDecoder().decode(new Uint8Array(buffer, 4, headerLen));
  const header = JSON.parse(headerText) as Record<string, unknown>;
  const format = header["format"];
  if (format === "gutcheck-mesh-v2q") return parseMeshV2q(buffer, header, headerLen);
  if (format !== "gutcheck-mesh-v1" && format !== "gutcheck-cellmesh-v1") {
    throw new Error(`unexpected mesh format: ${String(format)}`);
  }
  const vertexCount = header["vertexCount"] as number;
  const triangleCount = header["triangleCount"] as number;
  let off = 4 + headerLen;
  const positions = new Float32Array(buffer, off, vertexCount * 3);
  off += vertexCount * 3 * 4;
  const normals = new Float32Array(buffer, off, vertexCount * 3);
  off += vertexCount * 3 * 4;
  const indices = new Uint32Array(buffer, off, triangleCount * 3);
  off += triangleCount * 3 * 4;
  let edgePositions: Float32Array | undefined;
  if (format === "gutcheck-cellmesh-v1") {
    const edgeSegmentCount = header["edgeSegmentCount"] as number;
    edgePositions = new Float32Array(buffer, off, edgeSegmentCount * 6);
  }
  return { header, positions, normals, indices, edgePositions };
}

/** Effective backdrop colors for the active style (URL params over per-style defaults). */
function backdropDefaults(): { a: string; b: string } {
  if (style === "ggview") {
    return { a: "#" + param("bgTop", "fafbfd"), b: "#" + param("bgBottom", "e4e7ef") };
  }
  if (style === "povray") {
    return { a: "#" + param("bgInner", "", "3f6cb4"), b: "#" + param("bgOuter", "", "060b1c") };
  }
  return { a: "#" + param("bgTop", "e6b95c"), b: "#" + param("bgBottom", "9aa5e0") };
}

function makeBackdropTexture(over?: { a: string; b: string }): THREE.CanvasTexture {
  const colors = over ?? backdropDefaults();
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  if (style === "ggview") {
    // The paper's MATLAB-view backdrop: near-white, faintly cool.
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, colors.a);
    grad.addColorStop(1, colors.b);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else if (style === "povray") {
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.48,
      size * 0.04,
      size * 0.5,
      size * 0.5,
      size * 0.75,
    );
    grad.addColorStop(0, colors.a);
    grad.addColorStop(1, colors.b);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else {
    const grad = ctx.createLinearGradient(size * 0.12, 0, 0, size);
    grad.addColorStop(0, colors.a);
    grad.addColorStop(1, colors.b);
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

// ?clip=1 cuts the crystal at the mid-plane (the paper's own Fig. 22 device: "cutting
// the crystal along the plane z=0") so interior sandwich structure becomes visible.
function clipPlanes(): THREE.Plane[] | null {
  return param("clip", "0") === "1" ? [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)] : null;
}

// ggview: the paper's own PATCH look — flat-shaded translucent pale-cyan prisms.
function makeCellTrueMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    flatShading: true,
    color: new THREE.Color("#" + param("body", "c2e2de")),
    transparent: true,
    opacity: Number(param("faceOp", "0.42")),
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.55,
    metalness: 0,
  });
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
  const planes = clipPlanes();
  if (planes !== null) {
    ice.clippingPlanes = planes;
    ice.side = THREE.DoubleSide;
  }
  return ice;
}

function makeEdgeMaterial(): THREE.ShaderMaterial | null {
  const edgeStrength = Number(param("edge", "1.9", "1.0"));
  if (edgeStrength <= 0) return null;
  const planes = clipPlanes();
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    clipping: planes !== null,
    clippingPlanes: planes ?? undefined,
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
  /** Parent of crystal + edge pass; in-plane roll animations rotate this. */
  group: THREE.Group;
  /** Regenerate the backdrop gradient with new colors (live). */
  setBackdrop: (a: string, b: string) => void;
  render: () => void;
}

/**
 * Look dropdown: reloads the page with ?look=<name>, carrying only content-selection
 * params (mesh, timeline position, camera hints) so each look starts from its own
 * clean recipe.
 */
function makeLookSwitcher(): HTMLSelectElement {
  const select = document.createElement("select");
  select.style.cssText =
    "background:#233250;color:#dfe7f4;border:1px solid #3a4c72;border-radius:4px;" +
    "padding:4px 6px;cursor:pointer;font:inherit";
  const current = activeLookName !== null && LOOKS[activeLookName] ? activeLookName : "";
  if (current === "") {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "look: custom";
    opt.selected = true;
    select.appendChild(opt);
  }
  for (const name of Object.keys(LOOKS)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = `look: ${name}`;
    opt.selected = name === current;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => {
    if (select.value === "") return;
    const next = keepContentParams();
    next.set("look", select.value);
    window.location.search = next.toString();
  });
  return select;
}

/** Content-selection params carried across look/profile reloads. */
function keepContentParams(): URLSearchParams {
  const keep = [
    "mesh", "manifest", "scene", "growthScene", "frame", "frameExtent", "fps",
    "interactive", "clip", "tilt", "zoom", "ui", "profile", "look",
    // style/zscale are first-class page selectors (?style=povray|ggview): dropping them on
    // a profile switch silently re-renders a different page.
    "style", "zscale",
  ];
  const next = new URLSearchParams();
  for (const key of keep) {
    const v = query.get(key);
    if (v !== null) next.set(key, v);
  }
  return next;
}

// ── Profile shell prototype (Phase 7 prep Track D, docs/plans/explore-phase7-prep.md) ────
// Charter v1.18: a profile changes UI composition and rendering configuration only.
// "" (full spike surface) | "realistic" (minimal chrome, look pinned to its curated
// recipe) | "developer" (full surface; scene scripts + capture hooks are its machinery).
const profileName = query.get("profile") ?? "";

function makeProfileSwitcher(): HTMLSelectElement {
  const select = document.createElement("select");
  select.style.cssText =
    "background:#233250;color:#dfe7f4;border:1px solid #3a4c72;border-radius:4px;" +
    "padding:4px 6px;cursor:pointer;font:inherit";
  for (const [value, label] of [
    ["", "profile: full"],
    ["realistic", "profile: realistic"],
    ["scientific", "profile: scientific"],
    ["designer", "profile: designer"],
    ["developer", "profile: developer"],
  ]) {
    const opt = document.createElement("option");
    opt.value = value!;
    opt.textContent = label!;
    opt.selected = value === profileName;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => {
    const next = keepContentParams();
    if (select.value === "") next.delete("profile");
    else next.set("profile", select.value);
    window.location.search = next.toString();
  });
  return select;
}

/** Profile-filtered control-bar contents: realistic drops the look dropdown (its look is
 * the curated recipe the page loaded with); full and developer keep everything. */
function profileControls(rig: SceneRig, core: HTMLElement[]): HTMLElement[] {
  if (profileName === "realistic") {
    return [...core, makeProfileSwitcher(), makeBackdropControls(rig)];
  }
  return [...core, makeLookSwitcher(), makeProfileSwitcher(), makeBackdropControls(rig)];
}

// ── Scientific profile: read-only run facts over the REPLAYED artifact ───────────────────
// Charter Phase 7's Scientific profile is the full live instrument; this spike replays
// pre-baked meshes and has no solver, so this panel reports only what the recorded
// artifacts actually carry (run configuration, provenance hash, extraction settings, the
// per-frame counts the manifest recorded). It never displays a quantity the artifact does
// not contain, and §1.5 labeling applies to every line.

type FactGroup = readonly [string, ReadonlyArray<readonly [string, string]>];

function makeSciencePanel(): { el: HTMLElement; set: (groups: FactGroup[]) => void } {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;top:0;left:0;max-height:100vh;overflow:auto;width:330px;" +
    "background:rgba(8,12,22,0.82);color:#dfe7f4;font:12px/1.55 ui-monospace,monospace;" +
    "padding:10px 12px;z-index:11;border-right:1px solid #2a3a58";
  const set = (groups: FactGroup[]): void => {
    el.replaceChildren();
    const title = document.createElement("div");
    title.textContent = "Scientific — recorded run";
    title.style.cssText = "font-weight:600;margin-bottom:6px;color:#cfe0ff";
    el.appendChild(title);
    for (const [name, rows] of groups) {
      const box = document.createElement("details");
      box.open = true;
      box.style.cssText = "margin-bottom:6px;border-top:1px solid #24344f;padding-top:4px";
      const summary = document.createElement("summary");
      summary.textContent = name;
      summary.style.cssText = "cursor:pointer;color:#93a5c4;margin-bottom:3px";
      box.appendChild(summary);
      for (const [key, value] of rows) {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:8px;justify-content:space-between";
        const k = document.createElement("span");
        k.textContent = key;
        k.style.color = "#8fa2c2";
        const v = document.createElement("span");
        v.textContent = value;
        v.style.cssText = "text-align:right;word-break:break-all";
        row.append(k, v);
        box.appendChild(row);
      }
      el.appendChild(box);
    }
    const note = document.createElement("div");
    note.textContent =
      "Replay of a recorded G-G (GGThreshold) run. Parameters are model inputs; " +
      "the tick has no physical-time meaning and no morphology here is validated " +
      "against measurement.";
    note.style.cssText = "margin-top:8px;color:#93a5c4;font-size:11px;line-height:1.45";
    el.appendChild(note);
  };
  return { el, set };
}

const numberOr = (v: unknown, fallback = "—"): string =>
  typeof v === "number" ? v.toLocaleString() : fallback;

/** Designer needs Phase 6's morphology diagram (charter v1.18, decision 0029) — it cannot
 * exist yet, so say so rather than shipping a mock that implies it does. */
function showDesignerUnavailable(): void {
  const card = document.createElement("div");
  card.style.cssText =
    "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:520px;" +
    "background:rgba(8,12,22,0.92);border:1px solid #33476e;border-radius:8px;" +
    "padding:18px 20px;color:#dfe7f4;font:14px/1.6 system-ui,sans-serif;z-index:12";
  card.innerHTML =
    "<div style='font-weight:600;margin-bottom:8px'>Designer profile — not available yet</div>" +
    "<div style='color:#b9c6de'>The Designer profile compiles growth intents through " +
    "<em>the model's own morphology diagram</em>, and that diagram is Phase 6's output. " +
    "Phase 6 has not reported, so there is nothing to compile against — a mock here would " +
    "imply a mapping between what you draw and what the model grows that does not exist.<br><br>" +
    "The other profiles replay recorded runs and are available now.</div>";
  document.body.appendChild(card);
}

/** Two live color pickers for the backdrop gradient, initialized to the current look. */
function makeBackdropControls(rig: SceneRig): HTMLSpanElement {
  const wrap = document.createElement("span");
  wrap.style.cssText = "display:flex;gap:4px;align-items:center";
  const label = document.createElement("span");
  label.textContent = "bg";
  label.style.cssText = "color:#dfe7f4;font:12px ui-monospace,monospace";
  const colors = backdropDefaults();
  const inputs = [colors.a, colors.b].map((value) => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = value;
    input.style.cssText =
      "width:28px;height:24px;padding:0;border:1px solid #3a4c72;border-radius:4px;" +
      "background:#233250;cursor:pointer";
    return input;
  });
  const apply = (): void => rig.setBackdrop(inputs[0]!.value, inputs[1]!.value);
  for (const input of inputs) input.addEventListener("input", apply);
  wrap.append(label, inputs[0]!, inputs[1]!);
  return wrap;
}

/** Build renderer, scene, camera, lights, materials for a given world extent. */
function buildRig(
  extent: THREE.Vector3,
  liveBackground: boolean,
  frameOverride?: { readonly tiltDegrees: number; readonly zoom: number },
): SceneRig {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.localClippingEnabled = clipPlanes() !== null;
  renderer.setPixelRatio(liveBackground ? Math.min(window.devicePixelRatio, 2) : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = Number(param("exposure", "1.0", "1.15"));
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const zoom = frameOverride?.zoom ?? Number(param("zoom", "1"));
  const aspect = window.innerWidth / window.innerHeight;
  // At an oblique/axial view, Z projects into screen Y. Framing only max(X,Y) clipped tall
  // columns through the camera and far plane, producing vertical bars instead of a crystal.
  const frame = spikeOrthographicFrame(
    extent,
    frameOverride?.tiltDegrees ?? Number(param("tilt", "0")),
    aspect,
    zoom,
  );
  const { span, worldExtent } = frame;

  let backdropMaterial: THREE.MeshBasicMaterial | null = null;
  if (liveBackground) {
    scene.background = makeBackdropTexture();
  } else {
    backdropMaterial = new THREE.MeshBasicMaterial({ map: makeBackdropTexture() });
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(span * aspect * 2.1, span * 2.1),
      backdropMaterial,
    );
    backdrop.position.z = -worldExtent * 0.75;
    scene.add(backdrop);
  }
  const setBackdrop = (a: string, b: string): void => {
    const tex = makeBackdropTexture({ a, b });
    if (backdropMaterial !== null) {
      backdropMaterial.map?.dispose();
      backdropMaterial.map = tex;
      backdropMaterial.needsUpdate = true;
    } else {
      (scene.background as THREE.Texture | null)?.dispose?.();
      scene.background = tex;
    }
  };

  const group = new THREE.Group();
  const crystal = new THREE.Mesh(
    new THREE.BufferGeometry(),
    style === "ggview" ? makeCellTrueMaterial() : makeIceMaterial(extent.x),
  );
  group.add(crystal);
  const edgeMaterial = style === "ggview" ? null : makeEdgeMaterial();
  let edgeMesh: THREE.Mesh | null = null;
  if (edgeMaterial !== null) {
    edgeMesh = new THREE.Mesh(crystal.geometry, edgeMaterial);
    edgeMesh.renderOrder = 2;
    group.add(edgeMesh);
  }
  scene.add(group);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvironmentScene(), 0.04).texture;
  scene.environmentIntensity = Number(param("env", "1.0", "0.6"));
  const key = new THREE.DirectionalLight(
    new THREE.Color("#" + param("keyHex", "ffe3b0", "eaf2ff")),
    Number(param("keyI", "3.2", "2.0")),
  );
  key.position.set(-1.4, 1.7, 0.45).multiplyScalar(worldExtent);
  scene.add(key);
  const fill = new THREE.DirectionalLight(
    new THREE.Color("#" + param("fillHex", "93a8e0", "6f8fd0")),
    Number(param("fillI", "1.3", "1.0")),
  );
  fill.position.set(1.1, -1.3, 0.6).multiplyScalar(worldExtent);
  scene.add(fill);

  const camera = new THREE.OrthographicCamera(
    -span * aspect,
    span * aspect,
    span,
    -span,
    1,
    worldExtent * 8,
  );
  const dist = worldExtent * 2;
  camera.position.set(
    0,
    Math.sin(frame.tiltRadians) * dist,
    Math.cos(frame.tiltRadians) * dist,
  );
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  return {
    renderer,
    scene,
    camera,
    crystal,
    edgeMesh,
    group,
    setBackdrop,
    render: () => renderer.render(scene, camera),
  };
}

// ── Gentle camera/crystal motion (maker-directed): every transition eases ────────────────

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function styledButton(text: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.cssText =
    "background:#233250;color:#dfe7f4;border:1px solid #3a4c72;border-radius:4px;" +
    "padding:4px 10px;cursor:pointer;font:inherit";
  return b;
}

interface MotionKit {
  uprightButton: HTMLButtonElement;
  spinButton: HTMLButtonElement;
  smoothFaceOn: () => void;
  update: (now: number) => void;
}

/**
 * Upright: ease the crystal's in-plane roll so an arm points straight up (arms lie along
 * 0°/60°/... in lattice cartesian, so upright = 30° mod 60°) while easing the camera back
 * to the saved face-on pose. Spin: toggle a slow continuous roll with eased start/stop.
 */
function makeMotionKit(rig: SceneRig, controls: OrbitControls): MotionKit {
  const ROLL_DURATION = 1800;
  const CAMERA_DURATION = 1800;
  const SPIN_RATE = 0.06; // rad/s ≈ 105 s per revolution (maker: half the original)
  const SPIN_EASE = 1200;

  let rollTween: { from: number; to: number; start: number } | null = null;
  let cameraTween: {
    fromPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    fromZoom: number;
    start: number;
  } | null = null;
  let spinTarget = 0;
  let spinVelocity = 0;
  let spinEaseFrom = 0;
  let spinEaseStart = 0;
  let lastNow: number | null = null;

  const uprightButton = styledButton("upright");
  const spinButton = styledButton("spin");

  const startCameraTween = (now: number): void => {
    cameraTween = {
      fromPos: rig.camera.position.clone(),
      fromTarget: controls.target.clone(),
      fromZoom: rig.camera.zoom,
      start: now,
    };
  };

  const startSpinEase = (target: number, now: number): void => {
    spinTarget = target;
    spinEaseFrom = spinVelocity;
    spinEaseStart = now;
  };

  uprightButton.addEventListener("click", () => {
    const now = performance.now();
    startSpinEase(0, now);
    spinButton.textContent = "spin";
    // Nearest angle equivalent to 30° (mod 60°) so the turn is short and gentle.
    const current = rig.group.rotation.z;
    const sixth = Math.PI / 3;
    const target = Math.PI / 6;
    const delta =
      ((((target - current) % sixth) + sixth + sixth / 2) % sixth) - sixth / 2;
    rollTween = { from: current, to: current + delta, start: now };
    startCameraTween(now);
  });

  spinButton.addEventListener("click", () => {
    const now = performance.now();
    const spinning = spinTarget !== 0;
    startSpinEase(spinning ? 0 : SPIN_RATE, now);
    spinButton.textContent = spinning ? "spin" : "stop";
  });

  const smoothFaceOn = (): void => startCameraTween(performance.now());

  const update = (now: number): void => {
    const dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;
    if (rollTween !== null) {
      const t = Math.min((now - rollTween.start) / ROLL_DURATION, 1);
      rig.group.rotation.z =
        rollTween.from + (rollTween.to - rollTween.from) * easeInOutCubic(t);
      if (t >= 1) rollTween = null;
    }
    const spinT = Math.min((now - spinEaseStart) / SPIN_EASE, 1);
    spinVelocity = spinEaseFrom + (spinTarget - spinEaseFrom) * easeInOutCubic(spinT);
    if (spinVelocity !== 0) rig.group.rotation.z += spinVelocity * dt;
    if (cameraTween !== null) {
      const t = Math.min((now - cameraTween.start) / CAMERA_DURATION, 1);
      const k = easeInOutCubic(t);
      const c = controls as unknown as {
        position0: THREE.Vector3;
        target0: THREE.Vector3;
        zoom0: number;
      };
      rig.camera.position.lerpVectors(cameraTween.fromPos, c.position0, k);
      controls.target.lerpVectors(cameraTween.fromTarget, c.target0, k);
      rig.camera.zoom = cameraTween.fromZoom + (c.zoom0 - cameraTween.fromZoom) * k;
      rig.camera.updateProjectionMatrix();
      if (t >= 1) cameraTween = null;
    }
  };

  return { uprightButton, spinButton, smoothFaceOn, update };
}

function setRigGeometry(rig: SceneRig, geometry: THREE.BufferGeometry): void {
  rig.crystal.geometry = geometry;
  if (rig.edgeMesh !== null) rig.edgeMesh.geometry = geometry;
}

const zscale = Number(
  query.get("zscale") ?? activeLook?.params["zscale"] ?? (style === "ggview" ? "1" : "2.5"),
);

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
  const buffer = await response.arrayBuffer();
  // Center this mesh on itself: build once with no offset to measure, then translate.
  const geometry = buildGeometry(buffer, [0, 0, 0]);
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

  if (profileName === "scientific" && param("ui", "1") !== "0") {
    const header = parseMesh(buffer).header;
    const src = (header["source"] ?? {}) as Record<string, unknown>;
    const run = (src["source"] ?? src) as Record<string, unknown>;
    const extraction = (src["extraction"] ?? header["extraction"] ?? {}) as Record<string, unknown>;
    const dims = (run["dims"] ?? {}) as Record<string, unknown>;
    const sha = typeof run["checkpointSha256"] === "string" ? run["checkpointSha256"] : "";
    const panel = makeSciencePanel();
    panel.set([
      ["run", [
        ["preset", String(run["preset"] ?? "—")],
        ["dims", `${numberOr(dims["nx"])}×${numberOr(dims["ny"])}×${numberOr(dims["nz"])}`],
        ["domain", String(run["domain"] ?? "—")],
        ["seed", numberOr(run["seed"])],
        ["noise epsilon", numberOr(run["noiseEpsilon"], "0")],
        ["tick captured", numberOr(run["tick"])],
      ]],
      ["surface extraction", [
        ["spacing", numberOr(extraction["spacing"])],
        ["sigma", numberOr(extraction["sigma"])],
        ["iso", numberOr(extraction["iso"])],
        ["level set", "attached=1; boundary graded by b / ggThreshBeta"],
        ["z relief shown", `${zscale}×`],
      ]],
      ["mesh", [
        ["vertices", numberOr(header["vertexCount"])],
        ["triangles", numberOr(header["triangleCount"])],
        ["encoding", String(header["format"] ?? "—")],
      ]],
      ["provenance", [["checkpoint sha256", sha === "" ? "—" : `${sha.slice(0, 16)}…`]]],
    ]);
    document.body.appendChild(panel.el);
  }
  if (profileName === "designer") showDesignerUnavailable();

  // Cell-true meshes carry drawn edges (the paper's LINE routine): render them as
  // segments with the exact transform applied to the face geometry.
  const parsed = parseMesh(buffer);
  if (parsed.edgePositions !== undefined) {
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(parsed.edgePositions.slice(), 3),
    );
    if (zscale !== 1) edgeGeometry.scale(1, 1, zscale);
    edgeGeometry.translate(-center.x, -center.y, -center.z);
    const lines = new THREE.LineSegments(
      edgeGeometry,
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#" + param("lineHex", "27313e")),
        transparent: true,
        opacity: Number(param("lineOp", "0.55")),
        depthWrite: false,
      }),
    );
    lines.renderOrder = 3;
    rig.group.add(lines);
  }

  if (interactive) {
    const controls = new OrbitControls(rig.camera, rig.renderer.domElement);
    controls.enableDamping = true;
    controls.saveState();
    const kit = makeMotionKit(rig, controls);
    const faceOnButton = styledButton("face-on");
    faceOnButton.addEventListener("click", kit.smoothFaceOn);
    const bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;justify-content:center;" +
      "padding:10px 14px;background:rgba(8,12,22,0.62);z-index:10";
    bar.append(...profileControls(rig, [kit.uprightButton, kit.spinButton, faceOnButton]));
    // ?ui=0 suppresses the control bar for headless captures (buttons would land in the PNG).
    if (param("ui", "1") !== "0") document.body.appendChild(bar);
    const animate = (now: number): void => {
      requestAnimationFrame(animate);
      kit.update(now);
      controls.update();
      rig.render();
    };
    requestAnimationFrame(animate);
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
  const kit = makeMotionKit(rig, controls);
  const playButton = styledButton("play");
  const prevButton = styledButton("-1");
  const nextButton = styledButton("+1");
  const faceOnButton = styledButton("face-on");
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(manifest.frames.length - 1);
  slider.step = "1";
  slider.style.cssText = "flex:1";
  const label = document.createElement("span");
  label.style.cssText = "min-width:220px;text-align:right";
  ui.append(
    ...profileControls(rig, [
      playButton,
      prevButton,
      nextButton,
      slider,
      label,
      kit.uprightButton,
      kit.spinButton,
      faceOnButton,
    ]),
  );
  // ?ui=0 suppresses the control bar for headless captures (buttons would land in the PNG).
  if (param("ui", "1") !== "0") document.body.appendChild(ui);

  // Scientific profile: recorded configuration plus the manifest's per-frame counts,
  // refreshed on every frame change.
  const cfg = manifest.config as unknown as Record<string, unknown>;
  const cfgDims = (cfg["dims"] ?? {}) as Record<string, unknown>;
  const cfgExtraction = (cfg["extraction"] ?? {}) as Record<string, unknown>;
  const sciPanel = profileName === "scientific" && param("ui", "1") !== "0" ? makeSciencePanel() : null;
  if (sciPanel !== null) document.body.appendChild(sciPanel.el);
  if (profileName === "designer") showDesignerUnavailable();
  const sciUpdate = (frameIndex: number): void => {
    if (sciPanel === null) return;
    const frame = manifest.frames[frameIndex] as unknown as Record<string, unknown> | undefined;
    sciPanel.set([
      ["run", [
        ["preset", String(cfg["preset"] ?? "—")],
        ["dims", `${numberOr(cfgDims["nx"])}×${numberOr(cfgDims["ny"])}×${numberOr(cfgDims["nz"])}`],
        ["domain", String(cfg["domain"] ?? "—")],
        ["seed", numberOr(cfg["seed"])],
        ["noise epsilon", numberOr(cfg["noise"], "0")],
      ]],
      ["this frame", [
        ["tick", `${numberOr(frame?.["tick"])} / ${numberOr(cfg["ticks"])}`],
        ["frame", `${frameIndex + 1} / ${manifest.frames.length}`],
        ["capture interval", `${numberOr(cfg["every"])} ticks`],
        ["attached cells", numberOr(frame?.["attachedCount"])],
        ["mesh vertices", numberOr(frame?.["vertexCount"])],
      ]],
      ["surface extraction", [
        ["spacing", numberOr(cfgExtraction["spacing"])],
        ["sigma", numberOr(cfgExtraction["sigma"])],
        ["level set", "attached=1; boundary graded by b / ggThreshBeta"],
        ["z relief shown", `${zscale}×`],
      ]],
    ]);
  };

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
    sciUpdate(clamped);
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
  faceOnButton.addEventListener("click", kit.smoothFaceOn);
  slider.addEventListener("input", () => void showFrame(Number(slider.value)));

  await showFrame(Number(param("frame", "0")));

  // ?edit=1 — author a gutcheck-scene-v1 keyframe script from the live view. The editor
  // drives the same camera and group the player does, so what is previewed is what
  // app/scripts/scene-capture.mjs will render.
  if (param("edit", "0") === "1") {
    // The scene camera always looks at the origin, so a panned pose could not be recorded;
    // disable panning rather than silently exporting a view the render will not reproduce.
    controls.enablePan = false;
    // Assigned from the return value below; the callbacks that read it only run later.
    let panelEl: HTMLElement | null = null;
    const panel = createSceneEditor({
      camera: rig.camera as THREE.OrthographicCamera,
      group: rig.group,
      currentFrame: () => currentFrame,
      showFrame,
      frameCount: manifest.frames.length,
      look: activeLookName ?? "footage-ice",
      frameExtent: Number(param("frameExtent", "0")) || 620,
      manifestUrl,
      pausePlayback: () => {
        playing = false;
        playButton.textContent = "play";
      },
      render: () => rig.render(),
      occludedBottom: () =>
        (panelEl?.getBoundingClientRect().height ?? 0) + ui.getBoundingClientRect().height,
    });
    panelEl = panel;
    // Both are fixed to the bottom edge; stack the viewer's bar on top of the editor rather
    // than letting them overlap, and follow the panel as its height changes.
    const lift = (): void => {
      ui.style.bottom = `${String(panel.getBoundingClientRect().height)}px`;
    };
    lift();
    new ResizeObserver(lift).observe(panel);
  }

  const animate = (now: number): void => {
    requestAnimationFrame(animate);
    kit.update(now);
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

// ── Composed growth mode (named catalog growth-scene-v1) ──────────────────────────────

const digestHex = async (buffer: ArrayBuffer): Promise<string> => {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
  return Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
};

async function growthSceneMain(sceneUrl: string): Promise<void> {
  const sceneAbsolute = new URL(sceneUrl, window.location.href);
  const response = await fetch(sceneAbsolute);
  if (!response.ok) throw new Error(`growth scene fetch failed: ${response.status} ${sceneUrl}`);
  const sceneText = await response.text();
  const scene = parseGrowthSceneV1(JSON.parse(sceneText) as unknown);
  const coldBytes = growthSceneColdPayloadBytes(scene, new TextEncoder().encode(sceneText).byteLength);
  if (coldBytes >= GROWTH_SCENE_WEB_LIMIT_BYTES) {
    throw new Error(
      `growth scene cold payload ${coldBytes} is not below ${GROWTH_SCENE_WEB_LIMIT_BYTES}`,
    );
  }

  const bounds = scene.bounds;
  const extent = new THREE.Vector3(
    bounds.xMax - bounds.xMin,
    bounds.yMax - bounds.yMin,
    bounds.zMax - bounds.zMin,
  );
  const rig = buildRig(extent, true, {
    tiltDegrees: scene.camera.tiltDegrees,
    zoom: scene.camera.zoom,
  });
  rig.crystal.visible = false;
  if (rig.edgeMesh !== null) rig.edgeMesh.visible = false;
  rig.group.position.set(
    -(bounds.xMin + bounds.xMax) / 2,
    -(bounds.yMin + bounds.yMax) / 2,
    -(bounds.zMin + bounds.zMax) / 2,
  );
  const yawRadians = THREE.MathUtils.degToRad(scene.camera.yawDegrees);
  rig.camera.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), yawRadians);
  rig.camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), yawRadians);
  rig.camera.lookAt(0, 0, 0);

  const assetPromises = new Map<string, Promise<ReturnType<typeof decodeGrowthAssetV1>>>();
  const loadAsset = (
    component: (typeof scene.components)[number],
  ): Promise<ReturnType<typeof decodeGrowthAssetV1>> => {
    const cached = assetPromises.get(component.growthAsset.sha256);
    if (cached !== undefined) return cached;
    const promise = fetch(new URL(component.growthAsset.url, sceneAbsolute))
      .then(async (assetResponse) => {
        if (!assetResponse.ok) {
          throw new Error(`growth component fetch failed: ${assetResponse.status} ${component.id}`);
        }
        const bytes = await assetResponse.arrayBuffer();
        if (bytes.byteLength !== component.growthAsset.byteLength) {
          throw new Error(
            `${component.id} growth bytes ${bytes.byteLength} disagree with ` +
              `${component.growthAsset.byteLength}`,
          );
        }
        const actualSha = await digestHex(bytes);
        if (actualSha !== component.growthAsset.sha256) {
          throw new Error(`${component.id} growth SHA-256 disagrees with its scene identity`);
        }
        return decodeGrowthAssetV1(bytes);
      });
    assetPromises.set(component.growthAsset.sha256, promise);
    return promise;
  };

  const cellGeometry = new THREE.CylinderGeometry(0.58, 0.58, 0.92, 6, 1, false);
  cellGeometry.rotateX(Math.PI / 2);
  cellGeometry.rotateZ(Math.PI / 6);
  const material = rig.crystal.material as THREE.Material;
  const matrix = new THREE.Matrix4();
  const loaded = await Promise.all(scene.components.map(async (component) => {
    const asset = await loadAsset(component);
    const mesh = new THREE.InstancedMesh(cellGeometry, material, asset.eventCount);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.frustumCulled = false;
    const [nx, ny] = asset.dims;
    const [centerI, centerJ, centerK] = asset.center;
    const centerX = centerI + centerJ / 2;
    const centerY = (Math.sqrt(3) * centerJ) / 2;
    for (let event = 0; event < asset.eventCount; event++) {
      const flat = asset.flatIndices[event]!;
      const i = flat % nx;
      const j = Math.floor(flat / nx) % ny;
      const k = Math.floor(flat / (nx * ny));
      matrix.makeTranslation(
        i + j / 2 - centerX,
        (Math.sqrt(3) * j) / 2 - centerY,
        (k - centerK) * zscale,
      );
      mesh.setMatrixAt(event, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = component.phaseOffset === 0 ? asset.seedCount : 0;
    const componentGroup = new THREE.Group();
    componentGroup.position.set(...component.transform.translate);
    componentGroup.rotation.set(
      THREE.MathUtils.degToRad(component.transform.rotateDegrees[0]),
      THREE.MathUtils.degToRad(component.transform.rotateDegrees[1]),
      THREE.MathUtils.degToRad(component.transform.rotateDegrees[2]),
      "XYZ",
    );
    componentGroup.scale.setScalar(component.transform.scale);
    componentGroup.add(mesh);
    rig.group.add(componentGroup);
    return { component, asset, mesh };
  }));

  if (param("ui", "1") !== "0") {
    const disclosure = document.createElement("div");
    disclosure.style.cssText =
      "position:fixed;left:16px;bottom:16px;max-width:520px;padding:9px 12px;" +
      "border:1px solid rgba(170,195,230,.45);border-radius:6px;background:rgba(8,12,22,.78);" +
      "color:#dfe7f4;font:12px/1.45 system-ui,sans-serif;z-index:12";
    disclosure.textContent =
      `Composed visualization · ${scene.components.length} independently recorded G-G ` +
      `component${scene.components.length === 1 ? "" : "s"} · ` +
      `${coldBytes.toLocaleString()} cold bytes`;
    document.body.appendChild(disclosure);
  }

  const duration = scene.durationSeconds;
  const seek = async (seconds: number): Promise<void> => {
    const progress = Math.max(0, Math.min(1, seconds / duration));
    for (const item of loaded) {
      const phase = item.component.phaseOffset;
      if (progress < phase) {
        item.mesh.count = 0;
      } else {
        const localProgress = phase === 1 ? 1 : (progress - phase) / (1 - phase);
        const tick = Math.floor(Math.max(0, Math.min(1, localProgress)) * item.asset.finalTick);
        item.mesh.count = visibleGrowthEventCount(item.asset, tick);
      }
    }
    rig.render();
  };

  const spikeWindow = window as unknown as SpikeWindow;
  spikeWindow.__sceneDuration = duration;
  spikeWindow.__sceneSeek = seek;
  await seek(0);
  if (param("capture", "0") !== "1") {
    const start = performance.now();
    const animate = (now: number): void => {
      requestAnimationFrame(animate);
      void seek(((now - start) / 1000) % duration);
    };
    requestAnimationFrame(animate);
  }
  spikeWindow.__spikeReady = true;
}

// ── Scene mode (Phase 7 prep Track B, docs/plans/explore-phase7-prep.md) ─────────────────
// A repo-committed scene script (charter Phase 7 Developer profile) drives camera, frame,
// and captions from a virtual clock. Read-only over recorded artifacts; cannot alter solver
// behavior. ?capture=1 disables the free-running clock and exposes window.__sceneSeek(t)
// for deterministic frame capture. Look/background/frameExtent come from URL params, which
// the capture runner derives from the scene file.

interface SceneKeyframe {
  t: number;
  tilt?: number;
  yaw?: number;
  zoom?: number;
  ease?: "linear" | "inOutCubic";
}
interface SceneScript {
  format: string;
  title?: string;
  look?: string;
  frameExtent?: number;
  duration: number;
  fps?: number;
  source: { manifest?: string; mesh?: string };
  camera?: SceneKeyframe[];
  frames?: Array<{ t: number; frame: number }>;
  captions?: Array<{ t0: number; t1: number; text: string }>;
}

async function sceneMain(sceneUrl: string): Promise<void> {
  const sceneAbsolute = new URL(sceneUrl, window.location.href);
  const sceneResponse = await fetch(sceneAbsolute);
  if (!sceneResponse.ok) throw new Error(`scene fetch failed: ${sceneResponse.status} ${sceneUrl}`);
  const script = (await sceneResponse.json()) as SceneScript;
  if (script.format !== "gutcheck-scene-v1") {
    throw new Error(`unexpected scene format: ${script.format}`);
  }
  // A committed scene names its own look. Previewing ?scene=... without ?look would
  // otherwise render with the default recipe — the scene's authored appearance is part of
  // the artifact, so redirect once to apply it (capture already passes ?look explicitly).
  if (script.look !== undefined && query.get("look") === null) {
    const next = new URLSearchParams(window.location.search);
    next.set("look", script.look);
    window.location.search = next.toString();
    return;
  }
  if (!Number.isFinite(script.duration) || script.duration <= 0) {
    throw new Error(`scene duration must be a positive number, got ${String(script.duration)}`);
  }
  // Keyframe tracks are interpolated by scanning forward, so out-of-order times would
  // silently make segments unreachable. Fail loudly instead of rendering a wrong scene.
  const sorted = (times: number[]): boolean => times.every((t, i) => i === 0 || t >= times[i - 1]!);
  if (!sorted((script.camera ?? []).map((k) => k.t))) throw new Error("scene camera keyframes are not sorted by t");
  if (!sorted((script.frames ?? []).map((k) => k.t))) throw new Error("scene frame keyframes are not sorted by t");
  const capture = param("capture", "0") === "1";
  const duration = Math.max(0.1, script.duration);

  // Sources resolve relative to the scene file so committed scenes work from any host root.
  let manifest: AnimManifest | null = null;
  let manifestBase: URL | null = null;
  let staticBuffer: ArrayBuffer | null = null;
  if (script.source.manifest !== undefined) {
    manifestBase = new URL(script.source.manifest, sceneAbsolute);
    const r = await fetch(manifestBase);
    if (!r.ok) throw new Error(`scene manifest fetch failed: ${r.status}`);
    manifest = (await r.json()) as AnimManifest;
    if (manifest.frames.length === 0) throw new Error("scene manifest has no frames");
  } else if (script.source.mesh !== undefined) {
    const r = await fetch(new URL(script.source.mesh, sceneAbsolute));
    if (!r.ok) throw new Error(`scene mesh fetch failed: ${r.status}`);
    staticBuffer = await r.arrayBuffer();
  } else {
    throw new Error("scene needs source.manifest or source.mesh");
  }

  const bb = manifest?.finalBBox;
  const extent =
    bb !== undefined
      ? new THREE.Vector3(bb.xMax - bb.xMin, bb.yMax - bb.yMin, bb.zMax - bb.zMin)
      : new THREE.Vector3(1, 1, 1);
  const frameExtent = Number(param("frameExtent", String(script.frameExtent ?? 0)));
  if (frameExtent > 0) {
    extent.x = frameExtent;
    extent.y = frameExtent;
  }
  const offset: readonly [number, number, number] =
    bb !== undefined
      ? [(bb.xMin + bb.xMax) / 2, (bb.yMin + bb.yMax) / 2, ((bb.zMin + bb.zMax) / 2) * zscale]
      : [0, 0, 0];

  const rig = buildRig(extent, true);
  const baseDist = Math.max(extent.x, extent.y) * 2;

  if (staticBuffer !== null) {
    const geometry = buildGeometry(staticBuffer, [0, 0, 0]);
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox!.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    setRigGeometry(rig, geometry);
  }

  // Frame loader (manifest sources): same conventions as timelineMain, private cache.
  const cache = new Map<number, THREE.BufferGeometry>();
  const lru: number[] = [];
  let shownFrame = -1;
  const loadFrame = async (index: number): Promise<THREE.BufferGeometry> => {
    const cached = cache.get(index);
    if (cached !== undefined) return cached;
    const frame = manifest!.frames[index];
    if (frame === undefined) throw new Error(`no frame ${index}`);
    const r = await fetch(new URL(frame.file, manifestBase!));
    if (!r.ok) throw new Error(`frame fetch failed: ${r.status} ${frame.file}`);
    const geometry = buildGeometry(await r.arrayBuffer(), offset);
    cache.set(index, geometry);
    lru.push(index);
    while (lru.length > FRAME_CACHE_CAP) {
      const evict = lru.shift();
      if (evict !== undefined && evict !== shownFrame) {
        cache.get(evict)?.dispose();
        cache.delete(evict);
      }
    }
    return geometry;
  };

  const frameAt = (t: number): number => {
    if (manifest === null) return -1;
    const track =
      script.frames !== undefined && script.frames.length > 0
        ? script.frames
        : [
            { t: 0, frame: 0 },
            { t: duration, frame: manifest.frames.length - 1 },
          ];
    if (t <= track[0]!.t) return track[0]!.frame;
    for (let i = 1; i < track.length; i++) {
      const a = track[i - 1]!;
      const b = track[i]!;
      if (t <= b.t) {
        const k = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
        return Math.round(a.frame + (b.frame - a.frame) * k);
      }
    }
    return track[track.length - 1]!.frame;
  };

  const cameraAt = (t: number): { tilt: number; yaw: number; zoom: number } => {
    const track = script.camera ?? [];
    const fill = (k: SceneKeyframe | undefined): { tilt: number; yaw: number; zoom: number } => ({
      tilt: k?.tilt ?? 0,
      yaw: k?.yaw ?? 0,
      zoom: k?.zoom ?? 1,
    });
    if (track.length === 0) return fill(undefined);
    if (t <= track[0]!.t) return fill(track[0]);
    for (let i = 1; i < track.length; i++) {
      const a = track[i - 1]!;
      const b = track[i]!;
      if (t <= b.t) {
        const raw = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
        const k = (b.ease ?? "inOutCubic") === "linear" ? raw : easeInOutCubic(raw);
        const av = fill(a);
        const bv = fill(b);
        return {
          tilt: av.tilt + (bv.tilt - av.tilt) * k,
          yaw: av.yaw + (bv.yaw - av.yaw) * k,
          zoom: av.zoom + (bv.zoom - av.zoom) * k,
        };
      }
    }
    return fill(track[track.length - 1]);
  };

  const caption = document.createElement("div");
  caption.style.cssText =
    "position:fixed;left:0;right:0;bottom:56px;text-align:center;color:#f3f6fc;" +
    "font:20px/1.5 system-ui,sans-serif;text-shadow:0 1px 8px rgba(6,10,20,0.85);" +
    "pointer-events:none;padding:0 10vw";
  document.body.appendChild(caption);

  let seeking = false;
  const seek = async (tSeconds: number): Promise<void> => {
    const t = Math.max(0, Math.min(duration, tSeconds));
    if (manifest !== null) {
      const index = frameAt(t);
      if (index !== shownFrame) {
        const geometry = await loadFrame(index);
        shownFrame = index;
        setRigGeometry(rig, geometry);
      }
    }
    const cam = cameraAt(t);
    const tiltRad = (cam.tilt * Math.PI) / 180;
    const yawRad = (cam.yaw * Math.PI) / 180;
    const arc = new THREE.Vector3(0, Math.sin(tiltRad) * baseDist, Math.cos(tiltRad) * baseDist);
    arc.applyAxisAngle(new THREE.Vector3(0, 0, 1), yawRad);
    rig.camera.position.copy(arc);
    rig.camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), yawRad);
    rig.camera.lookAt(0, 0, 0);
    (rig.camera as THREE.OrthographicCamera).zoom = cam.zoom;
    (rig.camera as THREE.OrthographicCamera).updateProjectionMatrix();
    const active = (script.captions ?? []).find((c) => t >= c.t0 && t < c.t1);
    caption.textContent = active?.text ?? "";
    rig.render();
  };

  const spikeWindow = window as unknown as SpikeWindow;
  spikeWindow.__sceneDuration = duration;
  spikeWindow.__sceneSeek = seek;

  await seek(0);
  if (!capture) {
    const start = performance.now();
    const animate = (): void => {
      requestAnimationFrame(animate);
      if (seeking) return;
      seeking = true;
      const t = ((performance.now() - start) / 1000) % duration;
      void seek(t).finally(() => {
        seeking = false;
      });
    };
    requestAnimationFrame(animate);
  }
  spikeWindow.__spikeReady = true;
}

async function main(): Promise<void> {
  const growthSceneUrl = query.get("growthScene");
  if (growthSceneUrl !== null && growthSceneUrl !== "") {
    await growthSceneMain(growthSceneUrl);
    return;
  }
  const sceneUrl = query.get("scene");
  if (sceneUrl !== null && sceneUrl !== "") {
    await sceneMain(sceneUrl);
    return;
  }
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
