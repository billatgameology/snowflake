// Three.js view: WebGPURenderer (WebGL2 automatic fallback), instanced hexagonal prisms of
// surface cells, orbit camera, per-instance overlay colors, and the vapor slice plane. Dev
// geometry per charter §3.1 — prisms match the solver lattice exactly; smooth surfaces are a
// later phase.
//
// World coordinates ARE the lattice's cartesian embedding (x = i + j/2, y = j*sqrt(3)/2,
// z = k) shifted so the domain center sits at the origin; the camera's up axis is +z. Keeping
// the embedding 1:1 (never re-derived) is what makes picking unambiguous.
//
// Per-instance color uses InstancedMesh.instanceColor, allocated at mesh creation so both
// the WebGPU and WebGL2 backends compile the instanced-color path from the first frame.
// Colors are supplied in linear working space (callers convert sRGB via srgbToLinear).

import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { cartesian, coordsOf, type Dims } from "@vcc/core";
import { hexPrismMeshData } from "./hexgeom.ts";

export type BackendName = "WebGPU" | "WebGL2";

export interface ViewOptions {
  /** Force the WebGL2 backend (verifies the fallback path; A2-6 records what actually ran). */
  readonly forceWebGL?: boolean;
  /**
   * Externally acquired shared GPUDevice (WP6 frozen design D2): passed to Three's
   * first-class `device` constructor parameter so the renderer and the production solver
   * share one device. Omitted = today's path, byte-identical (WebGPU auto or the WebGL2
   * fallback); this class never acquires a device of its own.
   */
  readonly device?: GPUDevice;
}

/**
 * Reproducible camera pose (screenshot harness): spherical position about a target on the
 * domain's vertical axis. Defaults reproduce frameDomain's canonical view.
 */
export interface CameraPose {
  /** Degrees about +z; 0 = looking from -y (face-on to the vertical slice). */
  readonly azimuthDeg?: number;
  /** Degrees above the horizontal plane. */
  readonly elevationDeg?: number;
  /** World units from the target. */
  readonly distance?: number;
  /** Target offsets from the domain center in world x/y. */
  readonly targetX?: number;
  readonly targetY?: number;
  /** Target height above the domain center (world z). */
  readonly targetZ?: number;
}

export interface FramingInfo {
  readonly clipped: boolean;
  readonly minPixelMargin: number;
  readonly projectedWidthPixels: number;
  readonly projectedHeightPixels: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

const INITIAL_CAPACITY = 1 << 15;

function buildPrismGeometry(): THREE.BufferGeometry {
  const data = hexPrismMeshData();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geometry.computeBoundingSphere(); // raycasting needs it
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
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerScratch = new THREE.Vector2();
  private worldOffset: readonly [number, number, number] = [0, 0, 0];
  private domainExtent = 128;
  private defaultDistance = 1.22 * 128;
  private frameTarget: readonly [number, number, number] = [0, 0, 0];
  private occupiedBounds: { readonly min: THREE.Vector3; readonly max: THREE.Vector3 } | null = null;
  private crystalVisible = true;

  private sliceMesh: THREE.Mesh | null = null;
  private sliceTexture: THREE.DataTexture | null = null;
  private sliceMaterial: THREE.MeshBasicMaterial | null = null;

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

    // Opaque material, WHITE base: the displayed color is entirely per-instance (overlay
    // colors, or the uniform base color when no overlay is active).
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
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
  static async create(container: HTMLElement, options?: ViewOptions): Promise<CrystalView> {
    // The conditional spread keeps the no-device parameter object EXACTLY today's shape
    // (S2 behavior preservation); with a device, three 0.185's WebGPUBackend adopts it
    // instead of requesting its own (the `parameters.device === undefined` branch).
    const renderer = new THREE.WebGPURenderer({
      antialias: true,
      forceWebGL: options?.forceWebGL === true,
      ...(options?.device !== undefined ? { device: options.device } : {}),
    });
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
    this.domainExtent = Math.max(dims.nx, dims.ny, dims.nz);
    this.defaultDistance = 1.22 * this.domainExtent;
    this.frameTarget = [0, 0, 0];
    this.occupiedBounds = null;
    this.setCameraPose({});
  }

  /** Fit the default camera to raw occupied bounds, independent of empty domain padding. */
  frameOccupancy(
    a: Uint8Array,
    dims: Dims,
    center: readonly [number, number, number],
  ): void {
    this.frameDomain(dims, center);
    const [ox, oy, oz] = this.worldOffset;
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (let index = 0; index < a.length; index++) {
      if (a[index] !== 1) continue;
      const [i, j, k] = coordsOf(dims, index);
      const [x, y, z] = cartesian(i, j, k);
      min.min(new THREE.Vector3(x - ox - 0.6, y - oy - 0.55, z - oz - 0.55));
      max.max(new THREE.Vector3(x - ox + 0.6, y - oy + 0.55, z - oz + 0.55));
    }
    if (!Number.isFinite(min.x)) return;
    const target = min.clone().add(max).multiplyScalar(0.5);
    const radius = Math.max(1, max.clone().sub(min).length() / 2);
    const halfVerticalFov = (this.camera.fov * Math.PI) / 360;
    this.frameTarget = [target.x, target.y, target.z];
    this.defaultDistance = (radius / Math.sin(halfVerticalFov)) * 1.18;
    this.occupiedBounds = { min, max };
    this.setCameraPose({});
  }

  /** Place the camera at a reproducible pose; defaults = frameDomain's canonical view. */
  setCameraPose(pose: CameraPose): void {
    const az = ((pose.azimuthDeg ?? 0) * Math.PI) / 180;
    const el = ((pose.elevationDeg ?? 30.6) * Math.PI) / 180;
    const distance = pose.distance ?? this.defaultDistance;
    const tx = pose.targetX ?? this.frameTarget[0];
    const ty = pose.targetY ?? this.frameTarget[1];
    const tz = pose.targetZ ?? this.frameTarget[2];
    this.controls.target.set(tx, ty, tz);
    this.camera.position.set(
      tx + distance * Math.cos(el) * Math.sin(az),
      ty - distance * Math.cos(el) * Math.cos(az),
      tz + distance * Math.sin(el),
    );
    this.camera.lookAt(0, 0, tz);
    this.controls.update();
  }

  /** Project raw occupied bounds for non-vacuous screenshot clipping/margin assertions. */
  framingInfo(): FramingInfo | null {
    if (this.occupiedBounds === null) return null;
    this.camera.updateMatrixWorld(true);
    const { min, max } = this.occupiedBounds;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          const projected = new THREE.Vector3(x, y, z).project(this.camera);
          minX = Math.min(minX, projected.x);
          maxX = Math.max(maxX, projected.x);
          minY = Math.min(minY, projected.y);
          maxY = Math.max(maxY, projected.y);
        }
      }
    }
    const viewportWidth = this.renderer.domElement.clientWidth;
    const viewportHeight = this.renderer.domElement.clientHeight;
    const margins = [
      ((minX + 1) / 2) * viewportWidth,
      ((1 - maxX) / 2) * viewportWidth,
      ((1 - maxY) / 2) * viewportHeight,
      ((minY + 1) / 2) * viewportHeight,
    ];
    return {
      clipped: margins.some((margin) => margin < 0),
      minPixelMargin: Math.min(...margins),
      projectedWidthPixels: ((maxX - minX) / 2) * viewportWidth,
      projectedHeightPixels: ((maxY - minY) / 2) * viewportHeight,
      viewportWidth,
      viewportHeight,
    };
  }

  /** Show/hide the crystal mesh (debug hook: slice-only captures). */
  setCrystalVisible(visible: boolean): void {
    this.crystalVisible = visible;
    if (this.mesh !== null) this.mesh.visible = visible;
  }

  /** The cartesian offset mapping lattice to world (world = cartesian(i,j,k) - offset). */
  get offset(): readonly [number, number, number] {
    return this.worldOffset;
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
    next.visible = this.crystalVisible;
    next.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Allocate instance colors up front so the shader includes the instanced-color path on
    // both backends from the first compile (overlays just rewrite the values).
    const colors = new THREE.InstancedBufferAttribute(new Float32Array(newCapacity * 3), 3);
    colors.setUsage(THREE.DynamicDrawUsage);
    next.instanceColor = colors;
    if (this.mesh !== null) {
      this.scene.remove(this.mesh);
      this.mesh.dispose(); // frees instance attributes only; geometry/material are shared
    }
    this.scene.add(next);
    this.mesh = next;
    this.capacity = newCapacity;
    return next;
  }

  /**
   * Rebuild instance transforms and colors from the latest snapshot's surface-cell list.
   * `colorsLinear`: 3 floats per instance (linear working space), same order as
   * `surfaceIndices`.
   */
  updateCrystal(surfaceIndices: Uint32Array, dims: Dims, colorsLinear: Float32Array): void {
    const mesh = this.ensureCapacity(surfaceIndices.length);
    const m = this.matrixScratch;
    const [ox, oy, oz] = this.worldOffset;
    for (let n = 0; n < surfaceIndices.length; n++) {
      const [i, j, k] = coordsOf(dims, surfaceIndices[n]);
      const [x, y, z] = cartesian(i, j, k);
      m.makeTranslation(x - ox, y - oy, z - oz);
      mesh.setMatrixAt(n, m);
    }
    const colorAttr = mesh.instanceColor as THREE.InstancedBufferAttribute;
    (colorAttr.array as Float32Array).set(colorsLinear.subarray(0, surfaceIndices.length * 3));
    colorAttr.needsUpdate = true;
    mesh.count = surfaceIndices.length;
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Raycast the instanced crystal from client (page) coordinates. Returns the INSTANCE index
   * (position in the surface-cell list) or null. CPU-side geometry work — identical on both
   * backends, and fully functional on a frozen (paused) snapshot.
   */
  pickInstance(clientX: number, clientY: number): number | null {
    if (this.mesh === null || this.mesh.count === 0) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    this.pointerScratch.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointerScratch, this.camera);
    const hits = this.raycaster.intersectObject(this.mesh, false);
    for (const hit of hits) {
      if (hit.instanceId !== undefined) return hit.instanceId;
    }
    return null;
  }

  /**
   * Show/update the slice plane: sRGB RGBA texel bytes (row-major, v*width+u) and the
   * row-major world matrix from sliceWorldMatrix(). Nearest filtering — one texel is one
   * lattice cell, honestly blocky. Opaque material (Rule 7: no transparency APIs).
   */
  setSlice(rgba: Uint8Array, width: number, height: number, matrixRowMajor: number[]): void {
    if (
      this.sliceTexture === null ||
      this.sliceTexture.image.width !== width ||
      this.sliceTexture.image.height !== height
    ) {
      this.sliceTexture?.dispose();
      const texture = new THREE.DataTexture(rgba, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      this.sliceTexture = texture;
      if (this.sliceMaterial === null) {
        this.sliceMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      } else {
        this.sliceMaterial.map = texture;
      }
      this.sliceMaterial.needsUpdate = true;
    } else {
      (this.sliceTexture.image.data as unknown as Uint8Array).set(rgba);
    }
    this.sliceTexture.needsUpdate = true;

    if (this.sliceMesh === null) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        this.sliceMaterial as THREE.MeshBasicMaterial,
      );
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = false;
      this.sliceMesh = mesh;
      this.scene.add(mesh);
    }
    const e = matrixRowMajor;
    this.sliceMesh.matrix.set(
      e[0], e[1], e[2], e[3],
      e[4], e[5], e[6], e[7],
      e[8], e[9], e[10], e[11],
      e[12], e[13], e[14], e[15],
    );
    this.sliceMesh.visible = true;
  }

  hideSlice(): void {
    if (this.sliceMesh !== null) this.sliceMesh.visible = false;
  }
}
