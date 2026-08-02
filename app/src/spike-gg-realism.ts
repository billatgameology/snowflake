// Gut-check spike renderer (docs/plans/explore-gg-realism-gutcheck.md): loads a
// gutcheck-mesh-v1 binary (scripts/gutcheck-extract-mesh.ts) and renders it with the
// ADR 0029 Realistic-profile ice look: transparent refractive material over a designed
// two-tone backdrop gradient, dark facet edges and bright ridge highlights from oblique
// lighting, near-orthographic face-on camera, restrained post-processing (tone mapping
// only). Deliberately separate from the app instrument; classic WebGL renderer because
// MeshPhysicalMaterial transmission is the mature path there (plan: WebGL2 fallback is
// acceptable on this Mac). Rule 7 note: per phase-3 A2-7 precedent, the four three.js
// blending/canvas flags with the banned stem are never used here.
//
// URL params (all optional, for iteration without code edits):
//   ?mesh=<url>       mesh location (default /gutcheck-mesh.bin, fulfilled by the capture
//                     script's route handler)
//   ?bgInner=<hex>&bgOuter=<hex>  backdrop radial gradient colors
//   ?tilt=<deg>       camera garnish tilt off face-on (default 0)
//   ?ior=<x>          index of refraction (default 1.31, ice)
//   ?rough=<x>        material roughness (default 0.08)
//   ?thick=<x>        transmission thickness in mesh units (default 6)
//   ?zoom=<x>         framing multiplier (default 1; >1 zooms out)
// Reports readiness on window.__spikeReady / failure on window.__spikeError for the
// deterministic capture harness.

import * as THREE from "three";

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

function makeBackdropTexture(top: string, bottom: string): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  // The J0521r2p footage backdrop is a smooth two-tone near-vertical gradient: warm pale
  // amber above, cool pale blue-lavender below (oblique-illumination microscopy).
  const grad = ctx.createLinearGradient(size * 0.12, 0, 0, size);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Oblique-illumination environment: light arrives only from a warm patch up-left and a
// faint cool patch down-right; the horizon is dark. Face-on facets then reflect mid tones
// while steep facet walls reflect the dark horizon — the footage's dark edge lines —
// and ridges catch the warm patch as bright glints.
function makeEnvironmentScene(): THREE.Scene {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  const vertical = ctx.createLinearGradient(0, 0, 0, size);
  vertical.addColorStop(0, "#fdf3da");
  vertical.addColorStop(0.32, "#b9b3a4");
  vertical.addColorStop(0.52, "#14141c");
  vertical.addColorStop(0.72, "#232a40");
  vertical.addColorStop(1, "#39456b");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, size, size);
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

function param(name: string, fallback: string): string {
  const v = new URLSearchParams(window.location.search).get(name);
  return v === null || v === "" ? fallback : v;
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
  // Optional z-relief exaggeration (?zscale=): the G-G plate is far thinner than the
  // footage crystal's sector-plate relief, so face-on shading nearly vanishes at 1:1.
  // A stated stylization knob, not a claim about the model.
  const zscale = Number(param("zscale", "1"));
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
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Near-orthographic face-on framing (plate normal is +z); computed first so the
  // backdrop plane can be sized to exactly fill the frustum with the full gradient.
  const zoom = Number(param("zoom", "1"));
  const span = (Math.max(extent.x, extent.y) / 2) * 1.12 * zoom;
  const aspect = window.innerWidth / window.innerHeight;

  // Backdrop: designed two-tone gradient on a frustum-filling plane behind the crystal so
  // the refractive material picks it up through transmission.
  const bgTop = "#" + param("bgTop", "f2e2bd");
  const bgBottom = "#" + param("bgBottom", "bfc6e4");
  const backdropZ = -Math.max(extent.x, extent.y) * 0.75;
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(span * aspect * 2.1, span * 2.1),
    new THREE.MeshBasicMaterial({ map: makeBackdropTexture(bgTop, bgBottom) }),
  );
  backdrop.position.z = backdropZ;
  scene.add(backdrop);

  // Ice material per ADR 0029: transparent refractive, no white volume.
  const ice = new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    ior: Number(param("ior", "1.31")),
    thickness: Number(param("thick", "5")),
    roughness: Number(param("rough", "0.02")),
    metalness: 0,
    color: 0xffffff,
    attenuationColor: new THREE.Color(0xdff2fb),
    attenuationDistance: extent.x * 2,
    specularIntensity: Number(param("spec", "0.7")),
    clearcoat: Number(param("cc", "0")),
    clearcoatRoughness: 0.2,
    side: param("side", "front") === "double" ? THREE.DoubleSide : THREE.FrontSide,
  });
  const crystal = new THREE.Mesh(geometry, ice);
  scene.add(crystal);

  // Dark facet-edge lines. In the footage they are rays refracted outside the microscope
  // condenser's collection cone; screen-space transmission cannot express that, so the
  // spike approximates it by darkening where the surface tilts away from the face-on view
  // direction. Identifier note (Rule 7 / A2-7): the shader sticks to edge* names.
  const edgeStrength = Number(param("edge", "0.55"));
  if (edgeStrength > 0) {
    const edgeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        edgeStrength: { value: edgeStrength },
        edgePow: { value: Number(param("edgePow", "1.7")) },
        edgeCool: { value: new THREE.Color("#141a36") },
        edgeWarm: { value: new THREE.Color("#ffd98f") },
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
        uniform vec3 edgeCool;
        uniform vec3 edgeWarm;
        varying vec3 vViewNormal;
        void main() {
          vec3 n = normalize(vViewNormal);
          float tilt = 1.0 - abs(n.z);
          float edgeAmount = pow(smoothstep(0.14, 0.95, tilt), edgePow) * edgeStrength;
          // Oblique illumination: relief facing the up-left key goes warm, the opposite
          // flank goes dark indigo.
          vec2 keyDir = normalize(vec2(-0.6, 0.75));
          float facing = clamp(dot(normalize(n.xy + vec2(1e-5)), keyDir) * 0.5 + 0.5, 0.0, 1.0);
          vec3 edgeTint = mix(edgeCool, edgeWarm, pow(facing, 1.5));
          gl_FragColor = vec4(edgeTint, edgeAmount);
        }
      `,
    });
    const edgeMesh = new THREE.Mesh(geometry, edgeMaterial);
    edgeMesh.renderOrder = 2;
    scene.add(edgeMesh);
  }

  // Oblique two-tone lighting (the footage look): warm key from upper left, cool fill
  // from lower right, plus a dim environment for broad body specular.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvironmentScene(), 0.04).texture;
  scene.environmentIntensity = Number(param("env", "1.0"));
  const key = new THREE.DirectionalLight(0xffe3b0, Number(param("keyI", "2.6")));
  key.position.set(-1.4, 1.7, 0.45).multiplyScalar(extent.x);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x93a8e0, Number(param("fillI", "1.1")));
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

  renderer.render(scene, camera);
  (window as unknown as SpikeWindow).__spikeReady = true;
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  (window as unknown as SpikeWindow).__spikeError = message;
  console.error("spike render failed:", message);
});
