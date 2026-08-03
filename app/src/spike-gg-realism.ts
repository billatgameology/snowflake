// Gut-check spike renderer (docs/plans/explore-gg-realism-gutcheck.md): loads a
// gutcheck-mesh-v1 binary (scripts/gutcheck-extract-mesh.ts) and renders it in one of two
// target styles, both maker-directed 2026-08-03:
//
//   ?style=ice     (default) the ADR 0029 Realistic look aimed at the J0521r2p footage:
//                  transparent refractive ice over a warm→cool linear gradient, oblique
//                  two-tone lighting, dark indigo/warm directional edge lines.
//   ?style=povray  the G-G paper's Fig. 4 ray-trace look: pale translucent blue-white
//                  crystal over a dark navy radial glow, bright edge lines.
//
// Deliberately separate from the app instrument; classic WebGL renderer because
// MeshPhysicalMaterial transmission is the mature path there. Rule 7 note: per phase-3
// A2-7 precedent, the four three.js blending/canvas flags with the banned stem are never
// used here.
//
// Every look input is a URL param with a per-style default so iteration needs no code
// edits. Shared: mesh, zscale, tilt, zoom, ior, spacing-independent framing. Reports
// readiness on window.__spikeReady / failure on window.__spikeError.

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

const query = new URLSearchParams(window.location.search);
const style = query.get("style") === "povray" ? "povray" : "ice";

/** URL param with a per-style default. */
function param(name: string, iceDefault: string, povDefault?: string): string {
  const v = query.get(name);
  if (v !== null && v !== "") return v;
  return style === "povray" && povDefault !== undefined ? povDefault : iceDefault;
}

function makeBackdropTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  if (style === "povray") {
    // Fig. 4 ray-trace backdrop: dark navy with a soft blue glow behind the crystal.
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
    // Footage backdrop: smooth near-vertical warm amber → cool blue-lavender gradient.
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

// Oblique-illumination environment (ice style): light from a warm patch up-left and a
// faint cool patch down-right, dark horizon, so steep facet walls reflect darkness.
// The povray style instead uses a dim blue-white environment for pale body specular.
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
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }),
  );
  envScene.add(sphere);
  return envScene;
}

async function main(): Promise<void> {
  const meshUrl = param("mesh", "/gutcheck-mesh.bin");
  const response = await fetch(meshUrl);
  if (!response.ok) throw new Error(`mesh fetch failed: ${response.status} ${meshUrl}`);
  const mesh = parseMesh(await response.arrayBuffer());

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(mesh.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  // Optional z-relief exaggeration: the G-G plate is thinner than the footage crystal's
  // sector-plate relief, so face-on shading nearly vanishes at 1:1. A stated stylization
  // knob, not a claim about the model.
  const zscale = Number(param("zscale", "2.5"));
  if (zscale !== 1) {
    geometry.scale(1, 1, zscale);
    geometry.computeVertexNormals();
  }
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (bbox === null) throw new Error("no bounding box");
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
  const extent = new THREE.Vector3();
  bbox.getSize(extent);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // Deterministic captures stay at 1:1 pixels; the interactive viewer supersamples at
  // the device ratio to calm shading shimmer while orbiting.
  renderer.setPixelRatio(
    query.get("interactive") === "1" ? Math.min(window.devicePixelRatio, 2) : 1,
  );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = Number(param("exposure", "1.0", "1.15"));
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Near-orthographic face-on framing (plate normal is +z); computed first so the
  // backdrop plane can be sized to exactly fill the frustum.
  const zoom = Number(param("zoom", "1"));
  const span = (Math.max(extent.x, extent.y) / 2) * 1.12 * zoom;
  const aspect = window.innerWidth / window.innerHeight;

  // Static captures keep the frustum-filling plane (the locked recipes were tuned on
  // it); the interactive orbit viewer uses a screen-fixed scene background instead, so
  // the gradient stays behind the crystal from every angle.
  const interactive = param("interactive", "0") === "1";
  if (interactive) {
    scene.background = makeBackdropTexture();
  } else {
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(span * aspect * 2.1, span * 2.1),
      new THREE.MeshBasicMaterial({ map: makeBackdropTexture() }),
    );
    backdrop.position.z = -Math.max(extent.x, extent.y) * 0.75;
    scene.add(backdrop);
  }

  // Crystal material. ice: transparent refractive per ADR 0029. povray: pale translucent
  // blue-white per Fig. 4 (partial transmission so the backdrop glow reads through).
  const ice = new THREE.MeshPhysicalMaterial({
    transmission: Number(param("tr", "1.0", "0.6")),
    ior: Number(param("ior", "1.31")),
    thickness: Number(param("thick", "14", "6")),
    roughness: Number(param("rough", "0.05", "0.12")),
    metalness: 0,
    color: new THREE.Color("#" + param("body", "ffffff", "cfe2f8")),
    attenuationColor: new THREE.Color(0xdff2fb),
    attenuationDistance: extent.x * 2,
    specularIntensity: Number(param("spec", "0.9", "1.2")),
    clearcoat: Number(param("cc", "0")),
    clearcoatRoughness: 0.2,
    side: param("side", "front") === "double" ? THREE.DoubleSide : THREE.FrontSide,
  });
  const dispersion = Number(param("dispersion", "0"));
  if (dispersion > 0) ice.dispersion = dispersion;
  const crystal = new THREE.Mesh(geometry, ice);
  scene.add(crystal);

  // Edge pass. ice: dark indigo lines with a warm key-facing flank (the microscopy
  // look's out-of-cone darkening — screen-space transmission cannot express it, so the
  // spike darkens where the surface tilts off face-on). povray: the same geometry cue
  // drawn as bright blue-white line work, matching the paper's LINE-emphasized figures.
  const edgeStrength = Number(param("edge", "1.9", "1.0"));
  if (edgeStrength > 0) {
    const edgeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
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
          // Screen-space antialiasing: widen the response by the per-pixel tilt
          // derivative so lattice-scale normal bumps fade instead of popping.
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
    const edgeMesh = new THREE.Mesh(geometry, edgeMaterial);
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

  // ?interactive=1: orbitable viewer for the maker (drag to rotate, wheel to zoom,
  // right-drag to pan). The default stays a single deterministic frame so the capture
  // harness is unaffected. The backdrop is a fixed plane behind the crystal, so extreme
  // orbits fly past it by design — the look is engineered face-on.
  if (interactive) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const animate = (): void => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  } else {
    renderer.render(scene, camera);
  }
  (window as unknown as SpikeWindow).__spikeReady = true;
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  (window as unknown as SpikeWindow).__spikeError = message;
  console.error("spike render failed:", message);
});
