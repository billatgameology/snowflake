// Three.js view: WebGPURenderer (WebGL2 automatic fallback), instanced hexagonal prisms of
// surface cells, orbit camera. Dev geometry per charter §3.1 — prisms match the solver
// lattice exactly; smooth surfaces are a later phase.
//
// World coordinates ARE the lattice's cartesian embedding (x = i + j/2, y = j*sqrt(3)/2,
// z = k) shifted so the domain center sits at the origin; the camera's up axis is +z. Keeping
// the embedding 1:1 (never re-derived) is what makes WP3 picking unambiguous.

import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { cartesian, coordsOf, type Dims } from "@vcc/core";
import { hexPrismMeshData } from "./hexgeom.ts";

export type BackendName = "WebGPU" | "WebGL2";

const INITIAL_CAPACITY = 1 << 15;

function buildPrismGeometry(): THREE.BufferGeometry {
  const data = hexPrismMeshData();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  return geometry;
}

export class CrystalView {
  readonly renderer: THREE.WebGPURenderer;
  readonly backend: BackendName;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  private readonly prismGeometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshStandardMaterial;
  private mesh: THREE.InstancedMesh | null = null;
  private capacity = 0;
  private readonly matrixScratch = new THREE.Matrix4();
  private worldOffset: readonly [number, number, number] = [0, 0, 0];

  private constructor(renderer: THREE.WebGPURenderer, backend: BackendName, container: HTMLElement) {
    this.renderer = renderer;
    this.backend = backend;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f14);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.5,
      4000,
    );
    this.camera.up.set(0, 0, 1);

    // Opaque material; facets separate through flat per-face normals + directional light.
    // Per-instance color (overlays) is WP3: it slots in via mesh.instanceColor without
    // touching this scaffold.
    this.material = new THREE.MeshStandardMaterial({
      color: 0x9fc4e8,
      roughness: 0.55,
      metalness: 0.05,
    });
    this.prismGeometry = buildPrismGeometry();

    const hemi = new THREE.HemisphereLight(0xbdd3ea, 0x2a2d33, 0.9);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(60, -90, 140);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x7d90aa, 0.5);
    fill.position.set(-80, 70, -40);
    this.scene.add(fill);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });

    window.addEventListener("resize", () => this.resize(container));
  }

  /** Awaited construction: WebGPURenderer.init() decides WebGPU vs its WebGL2 fallback. */
  static async create(container: HTMLElement): Promise<CrystalView> {
    const renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    await renderer.init();
    const backendFlags = renderer.backend as unknown as { isWebGPUBackend?: boolean };
    const backend: BackendName = backendFlags.isWebGPUBackend === true ? "WebGPU" : "WebGL2";
    container.appendChild(renderer.domElement);
    return new CrystalView(renderer, backend, container);
  }

  private resize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = Math.max(1, container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /** Frame the domain: orbit target at the domain center, camera pulled back along -y, +z. */
  frameDomain(dims: Dims, center: readonly [number, number, number]): void {
    const c = cartesian(center[0], center[1], center[2]);
    this.worldOffset = c;
    const extent = Math.max(dims.nx, dims.ny, dims.nz);
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, -1.05 * extent, 0.62 * extent);
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  /** Rotate the camera about the +z axis through the orbit target (screenshot harness). */
  orbitBy(azimuthDegrees: number): void {
    const angle = (azimuthDegrees * Math.PI) / 180;
    const t = this.controls.target;
    const dx = this.camera.position.x - t.x;
    const dy = this.camera.position.y - t.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.camera.position.x = t.x + dx * cos - dy * sin;
    this.camera.position.y = t.y + dx * sin + dy * cos;
    this.camera.lookAt(t);
    this.controls.update();
  }

  private ensureCapacity(needed: number): THREE.InstancedMesh {
    if (this.mesh !== null && needed <= this.capacity) return this.mesh;
    const newCapacity = Math.max(INITIAL_CAPACITY, this.capacity * 2, needed);
    const next = new THREE.InstancedMesh(this.prismGeometry, this.material, newCapacity);
    next.frustumCulled = false; // instance set changes every snapshot; skip stale bounds
    if (this.mesh !== null) {
      this.scene.remove(this.mesh);
      this.mesh.dispose(); // frees instance attributes only; geometry/material are shared
    }
    this.scene.add(next);
    this.mesh = next;
    this.capacity = newCapacity;
    return next;
  }

  /** Rebuild instance transforms from the surface-cell index list of the latest snapshot. */
  updateCrystal(surfaceIndices: Uint32Array, dims: Dims): void {
    const mesh = this.ensureCapacity(surfaceIndices.length);
    const m = this.matrixScratch;
    const [ox, oy, oz] = this.worldOffset;
    for (let n = 0; n < surfaceIndices.length; n++) {
      const [i, j, k] = coordsOf(dims, surfaceIndices[n]);
      const [x, y, z] = cartesian(i, j, k);
      m.makeTranslation(x - ox, y - oy, z - oz);
      mesh.setMatrixAt(n, m);
    }
    mesh.count = surfaceIndices.length;
    mesh.instanceMatrix.needsUpdate = true;
  }
}
