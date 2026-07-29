/// <reference types="@webgpu/types" />
// GPU-resident crystal/overlay/slice view (WP6 frozen design D2/D5, slice S4).
//
// This is the second-canvas render path on the ONE shared device: a full-size
// `pointer-events: none` WebGPU canvas appended AFTER Three's canvas inside `#scene`, so the
// frozen probes' `#scene canvas` first-match selector still resolves to Three's pointer/orbit
// surface (D2). All display/instrument WGSL lives HERE in app/src/ and runs over the SOLVER's
// resident buffers through its exported accessors — zero changes to solver-gpu/ (D5), and no
// full-field readback exists anywhere on this path (the render passes never read anything
// back; the pick/sample probes below are compact audited reads).
//
// Passes, in dependency order per completed step/reset (one bounded submission through the
// SOLVER submission controller at the solver's arena generation):
//   1. surface extraction — grid-strided compute over occupancy/wall builds a compact
//      surface-instance list plus indexed-indirect draw args via atomic append (order is
//      display-only; the dispatch plan reuses the gpu-instrument grid-stride pattern);
//   2. overlay coloring — one pass over the surface list computing
//      none/vaporAvailability/growthPropensity/boundaryMass/growthRecency EXACTLY as
//      app/src/overlays.ts defines them (same neighbor masks, the same capped-count
//      threshold-slot lookup, the same NaN-means-no-data rule carried as an explicit
//      defined flag — f32 NaN propagation is never relied on), through a viridis ramp
//      matching app/src/colormap.ts;
//   3. slice paint — the productionized accepted-probe pattern: a compute pass writes the
//      resident vapor slice into an rgba8unorm storage texture (both orientations, the same
//      index the legend prints).
// Every rAF, an instanced hex-prism render pass (geometry from app/src/hexgeom.ts, camera
// matrices from the existing OrbitControls camera) plus a textured slice-plane draw (the
// existing sliceWorldMatrix math from app/src/slice.ts) present those display-owned buffers.
// The per-frame render touches NO solver buffer and performs NO readback, so it submits
// directly on the queue; solver-buffer work stays on the bounded controller path.
//
// Presentation is deliberately plain (Phase 5 diagnostics, not Phase 7 polish): opaque
// lattice-exact prisms, flat lambert-style shading, nearest-filtered slice texels. Colors
// are the exact viridis sRGB ramp values (charter §1.5: same numbers as the CPU legend).

import { T_NEIGHBOR_OFFSETS, type Dims, type GGTimelineEnvironment } from "@vcc/core";
import {
  GPU_MAX_WORKGROUPS_PER_DISPATCH,
  GPU_WORKGROUP_SIZE,
  readGpuBuffer,
  type GpuReadbackAudit,
  type GpuSubmissionController,
} from "@vcc/solver-gpu";
import { NO_DATA_SRGB } from "./colormap.ts";
import { hexPrismMeshData } from "./hexgeom.ts";
import { OVERLAY_LABELS, type OverlayName } from "./overlays.ts";
import type { SliceOrientation } from "./slice.ts";

// ── Everything the view reads from the engine (GpuEngine.viewSource builds this) ───────────

export interface GpuViewSolverBuffers {
  /** The solver's ACTIVE vapor buffer (ping-pongs per cycle — re-fetch per sync). */
  readonly vapor: GPUBuffer;
  readonly occupancy: GPUBuffer;
  readonly wall: GPUBuffer;
  readonly boundaryMass: GPUBuffer;
  /** Display-owned attach-tick buffer maintained by GpuAttachTickInstrument. */
  readonly attachTick: GPUBuffer;
}

export interface GpuViewSource {
  readonly dims: Dims;
  readonly center: readonly [number, number, number];
  readonly generation: number;
  readonly tick: number;
  readonly environment: GGTimelineEnvironment;
  readonly buffers: GpuViewSolverBuffers;
  readonly submissions: GpuSubmissionController;
  readonly audit: GpuReadbackAudit;
}

/** The overlay/slice control state main.ts pushes (same values the legends print). */
export interface GpuViewControls {
  readonly overlayName: OverlayName;
  readonly overlayMin: number;
  readonly overlayMax: number;
  readonly recencyWindowTicks: number;
  readonly sliceEnabled: boolean;
  readonly sliceOrientation: SliceOrientation;
  /** The CLAMPED index the legend prints (main routes it through clampSliceIndex). */
  readonly sliceIndex: number;
  readonly sliceMin: number;
  readonly sliceMax: number;
  /** Row-major world matrix from slice.ts sliceWorldMatrix (the existing math, reused). */
  readonly sliceModelRowMajor: readonly number[];
  /** ACTIVE slot-indexed thresholds (8 slots) — main passes activeGGThreshBeta(). */
  readonly ggThreshBeta: Float64Array;
}

// ── Pure helpers (node-testable) ───────────────────────────────────────────────────────────

/** Overlay ids as the WGSL uniform encodes them (pinned to OVERLAY_NAMES by tests). */
export const GPU_VIEW_OVERLAY_IDS: Readonly<Record<OverlayName, number>> = {
  none: 0,
  vaporAvailability: 1,
  growthPropensity: 2,
  boundaryMass: 3,
  growthRecency: 4,
};

export function gpuOverlayId(name: OverlayName): number {
  const id = GPU_VIEW_OVERLAY_IDS[name];
  if (id === undefined) throw new Error(`unknown overlay for GPU view: ${String(name)}`);
  return id;
}

/** Indexed-indirect draw arg count for the hex prism (20 triangles). */
export const GPU_VIEW_PRISM_INDEX_COUNT = hexPrismMeshData().indices.length;

/** Bytes of the 5-word drawIndexedIndirect argument buffer the extraction pass writes. */
export const GPU_VIEW_DRAW_ARGS_BYTES = 20;

export interface GpuViewSweepPlan {
  /** Grid-stride workgroups: ceil(cellCount / workgroup size), capped per dispatch bound. */
  readonly workgroups: number;
  /** Threads per sweep iteration = workgroups * workgroup size (the WGSL stride). */
  readonly strideThreads: number;
}

/** The extraction/overlay grid-stride plan (the gpu-instrument dispatch-range pattern). */
export function gpuViewSweepPlan(cellCountValue: number): GpuViewSweepPlan {
  if (
    !Number.isSafeInteger(cellCountValue) ||
    cellCountValue <= 0 ||
    cellCountValue > 0xffff_ffff
  ) {
    throw new Error("GPU view cellCount must be a positive u32-safe integer");
  }
  const workgroups = Math.min(
    GPU_MAX_WORKGROUPS_PER_DISPATCH,
    Math.ceil(cellCountValue / GPU_WORKGROUP_SIZE),
  );
  return { workgroups, strideThreads: workgroups * GPU_WORKGROUP_SIZE };
}

/** Viridis anchors — a pinned copy of colormap.ts's table (tests assert ramp parity). */
export const GPU_VIEW_VIRIDIS_ANCHORS: ReadonlyArray<readonly [number, number, number]> = [
  [0.267004, 0.004874, 0.329415],
  [0.275191, 0.194905, 0.496005],
  [0.229739, 0.322361, 0.545706],
  [0.172719, 0.448791, 0.557885],
  [0.127568, 0.566949, 0.550556],
  [0.157851, 0.683765, 0.501686],
  [0.369214, 0.788888, 0.382914],
  [0.678489, 0.863742, 0.189503],
  [0.993248, 0.906157, 0.143936],
];

/** Uniform base (no-overlay) sRGB color — 0x9fc4e8, the CPU path's exact base color. */
export const GPU_VIEW_BASE_SRGB: readonly [number, number, number] = [
  0x9f / 255,
  0xc4 / 255,
  0xe8 / 255,
];

/** Scene background 0x0c0f14 as display-referred floats (matches Three's clear color). */
export const GPU_VIEW_BACKGROUND_SRGB: readonly [number, number, number] = [
  0x0c / 255,
  0x0f / 255,
  0x14 / 255,
];

/**
 * TS shadow of the WGSL viridis ramp (same anchors, same arithmetic order). The tests pin
 * it EXACTLY against colormap.ts's viridis, which transitively pins the interpolated WGSL.
 */
export function viridisRampShadow(t: number): [number, number, number] {
  if (Number.isNaN(t)) return [NO_DATA_SRGB[0], NO_DATA_SRGB[1], NO_DATA_SRGB[2]];
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const scaled = clamped * (GPU_VIEW_VIRIDIS_ANCHORS.length - 1);
  const lo = Math.min(Math.floor(scaled), GPU_VIEW_VIRIDIS_ANCHORS.length - 2);
  const frac = scaled - lo;
  const c0 = GPU_VIEW_VIRIDIS_ANCHORS[lo];
  const c1 = GPU_VIEW_VIRIDIS_ANCHORS[lo + 1];
  return [
    c0[0] + (c1[0] - c0[0]) * frac,
    c0[1] + (c1[1] - c0[1]) * frac,
    c0[2] + (c1[2] - c0[2]) * frac,
  ];
}

/**
 * TS shadow of the WGSL surface predicate: attached cell with >= 1 free (unattached,
 * non-wall, in-domain) neighbor among the 6 T neighbors and k±1. Returns ascending indices;
 * the tests pin it as a SET against surface.ts surfaceCellIndices (GPU append order itself
 * is display-only and nondeterministic).
 */
export function gpuSurfacePredicateShadow(
  occupancy: Uint32Array,
  wall: Uint32Array,
  dims: Dims,
): Uint32Array {
  const { nx, ny, nz } = dims;
  const plane = nx * ny;
  const out: number[] = [];
  const free = (index: number): boolean => occupancy[index] === 0 && wall[index] === 0;
  for (let index = 0; index < occupancy.length; index++) {
    if (occupancy[index] === 0) continue;
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / nx);
    const i = remainder - j * nx;
    let exposed = false;
    for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) continue;
      if (free(index + dj * nx + di)) {
        exposed = true;
        break;
      }
    }
    if (!exposed && k + 1 < nz && free(index + plane)) exposed = true;
    if (!exposed && k - 1 >= 0 && free(index - plane)) exposed = true;
    if (exposed) out.push(index);
  }
  return Uint32Array.from(out);
}

/** Inputs the overlay-value shadow reads (the GPU-resident projections, host-side). */
export interface GpuOverlayShadowContext {
  readonly dims: Dims;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly vapor: Float32Array;
  readonly boundaryMass: Float32Array;
  readonly attachTick: Uint32Array;
  readonly tick: number;
  readonly ggThreshBeta: Float64Array;
  readonly recencyWindowTicks: number;
}

/**
 * TS shadow of the WGSL overlay-value logic: identical candidate sets, masks, capped-count
 * threshold slots, and defined-flag semantics, in f64 (the WGSL evaluates the same
 * expressions in f32; that representation delta is measured on hardware, not here). The
 * tests pin this shadow EXACTLY against overlays.ts overlayValueAt over real solver states.
 * Returns { defined:false } exactly where overlayValueAt returns NaN.
 */
export function gpuOverlayValueShadow(
  name: OverlayName,
  ctx: GpuOverlayShadowContext,
  i: number,
  j: number,
  k: number,
): { defined: boolean; value: number } {
  const { nx, ny, nz } = ctx.dims;
  const plane = nx * ny;
  const base = k * plane + j * nx + i;
  const inDomain = (ni: number, nj: number, nk: number): boolean =>
    ni >= 0 && ni < nx && nj >= 0 && nj < ny && nk >= 0 && nk < nz;
  const free = (index: number): boolean =>
    ctx.occupancy[index] === 0 && ctx.wall[index] === 0;

  switch (name) {
    case "none":
      return { defined: false, value: 0 };
    case "vaporAvailability": {
      let sum = 0;
      let count = 0;
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
        if (!inDomain(i + di, j + dj, k)) continue;
        const y = base + dj * nx + di;
        if (free(y)) {
          sum += ctx.vapor[y];
          count++;
        }
      }
      if (k + 1 < nz && free(base + plane)) {
        sum += ctx.vapor[base + plane];
        count++;
      }
      if (k - 1 >= 0 && free(base - plane)) {
        sum += ctx.vapor[base - plane];
        count++;
      }
      return count === 0 ? { defined: false, value: 0 } : { defined: true, value: sum / count };
    }
    case "growthPropensity": {
      let best = 0;
      let defined = false;
      const consider = (ni: number, nj: number, nk: number): void => {
        if (!inDomain(ni, nj, nk)) return;
        const y = nk * plane + nj * nx + ni;
        if (!free(y)) return;
        // Uncapped attached-neighbor counts of the CANDIDATE cell, then the exact
        // capped-slot rule GGSolver uses for its parameter lookup (overlays.ts parity).
        let nT = 0;
        for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
          if (inDomain(ni + di, nj + dj, nk) && ctx.occupancy[y + dj * nx + di] !== 0) nT++;
        }
        let nZ = 0;
        if (nk + 1 < nz && ctx.occupancy[y + plane] !== 0) nZ++;
        if (nk - 1 >= 0 && ctx.occupancy[y - plane] !== 0) nZ++;
        const slot = Math.min(nT, 3) * 2 + Math.min(nZ, 1);
        const progress = ctx.boundaryMass[y] / ctx.ggThreshBeta[slot];
        if (!defined || progress > best) {
          best = progress;
          defined = true;
        }
      };
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) consider(i + di, j + dj, k);
      consider(i, j, k + 1);
      consider(i, j, k - 1);
      return { defined, value: best };
    }
    case "boundaryMass":
      return { defined: true, value: ctx.boundaryMass[base] };
    case "growthRecency": {
      const attachedAt = ctx.attachTick[base];
      if (attachedAt === 0) return { defined: true, value: 0 };
      const age = ctx.tick - attachedAt;
      const w = ctx.recencyWindowTicks > 0 ? ctx.recencyWindowTicks : 1;
      const recency = 1 - age / w;
      return { defined: true, value: recency < 0 ? 0 : recency > 1 ? 1 : recency };
    }
  }
}

/** Column-major 4x4 multiply c = a * b (matches three's Matrix4 element layout). */
export function multiplyMat4ColumnMajor(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): Float32Array {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let n = 0; n < 4; n++) sum += a[n * 4 + row] * b[col * 4 + n];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

/** Row-major 16 numbers (slice.ts sliceWorldMatrix) -> column-major Float32Array. */
export function columnMajorFromRowMajor(rowMajor: readonly number[]): Float32Array {
  if (rowMajor.length !== 16) throw new Error("a 4x4 matrix requires 16 numbers");
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) out[col * 4 + row] = rowMajor[row * 4 + col];
  }
  return out;
}

// ── Uniform encodings (pure; tests pin the byte layout) ────────────────────────────────────

export const GPU_VIEW_EXTRACT_UNIFORM_BYTES = 32;

export function encodeExtractUniforms(dims: Dims, capacity: number): ArrayBuffer {
  const plane = dims.nx * dims.ny;
  const cells = plane * dims.nz;
  const plan = gpuViewSweepPlan(cells);
  const words = new Uint32Array(GPU_VIEW_EXTRACT_UNIFORM_BYTES / 4);
  words[0] = dims.nx;
  words[1] = dims.ny;
  words[2] = dims.nz;
  words[3] = cells;
  words[4] = plane;
  words[5] = capacity;
  words[6] = plan.strideThreads;
  words[7] = 0;
  return words.buffer;
}

export const GPU_VIEW_OVERLAY_UNIFORM_BYTES = 80;

export function encodeOverlayUniforms(input: {
  readonly dims: Dims;
  readonly tick: number;
  readonly overlayName: OverlayName;
  readonly capacity: number;
  readonly rangeMin: number;
  readonly rangeMax: number;
  readonly recencyWindowTicks: number;
  readonly ggThreshBeta: Float64Array;
}): ArrayBuffer {
  const plane = input.dims.nx * input.dims.ny;
  const cells = plane * input.dims.nz;
  const plan = gpuViewSweepPlan(cells);
  const buffer = new ArrayBuffer(GPU_VIEW_OVERLAY_UNIFORM_BYTES);
  const words = new Uint32Array(buffer);
  const floats = new Float32Array(buffer);
  words[0] = input.dims.nx;
  words[1] = input.dims.ny;
  words[2] = input.dims.nz;
  words[3] = cells;
  words[4] = plane;
  words[5] = input.tick;
  words[6] = gpuOverlayId(input.overlayName);
  words[7] = input.capacity;
  floats[8] = input.rangeMin;
  floats[9] = input.rangeMax;
  floats[10] = input.recencyWindowTicks;
  words[11] = plan.strideThreads;
  if (input.ggThreshBeta.length !== 8) {
    throw new Error("GPU overlay uniforms require the 8-slot ggThreshBeta vector");
  }
  for (let slot = 0; slot < 8; slot++) floats[12 + slot] = Math.fround(input.ggThreshBeta[slot]);
  return buffer;
}

export const GPU_VIEW_SLICE_UNIFORM_BYTES = 48;

/** Slice texture size — the same mapping slice.ts sliceTextureSize defines. */
export function gpuSliceTextureSize(
  orientation: SliceOrientation,
  dims: Dims,
): { width: number; height: number } {
  return orientation === "vertical"
    ? { width: dims.nx, height: dims.nz }
    : { width: dims.nx, height: dims.ny };
}

export function encodeSlicePaintUniforms(input: {
  readonly dims: Dims;
  readonly orientation: SliceOrientation;
  readonly sliceIndex: number;
  readonly rangeMin: number;
  readonly rangeMax: number;
}): ArrayBuffer {
  const { width, height } = gpuSliceTextureSize(input.orientation, input.dims);
  const buffer = new ArrayBuffer(GPU_VIEW_SLICE_UNIFORM_BYTES);
  const words = new Uint32Array(buffer);
  const floats = new Float32Array(buffer);
  words[0] = input.dims.nx;
  words[1] = input.dims.ny;
  words[2] = input.dims.nz;
  words[3] = input.dims.nx * input.dims.ny;
  words[4] = input.orientation === "vertical" ? 0 : 1;
  words[5] = input.sliceIndex;
  words[6] = width;
  words[7] = height;
  floats[8] = input.rangeMin;
  floats[9] = input.rangeMax;
  words[10] = 0;
  words[11] = 0;
  return buffer;
}

// ── WGSL ───────────────────────────────────────────────────────────────────────────────────

const SQRT3_OVER_2 = Math.sqrt(3) / 2;

/** Unrolled T-neighbor visits generated from @vcc/core T_NEIGHBOR_OFFSETS (ABI pinning). */
function tNeighborVisitsWgsl(body: (neighborIndexExpr: string) => string): string {
  return T_NEIGHBOR_OFFSETS.map(([di, dj]) => {
    const neighborIndex = `u32(i32(index) + (${dj}) * i32(uniforms.dims.x) + (${di}))`;
    return `
  {
    let ni = ii + (${di});
    let nj = jj + (${dj});
    if (ni >= 0 && ni < i32(uniforms.dims.x) && nj >= 0 && nj < i32(uniforms.dims.y)) {
      ${body(neighborIndex)}
    }
  }`;
  }).join("");
}

const COLOR_RAMP_WGSL = /* wgsl */ `
const RAMP_COUNT: u32 = ${GPU_VIEW_VIRIDIS_ANCHORS.length}u;

fn viridisAnchor(slot: u32) -> vec3<f32> {
  switch slot {
${GPU_VIEW_VIRIDIS_ANCHORS.map(
  (c, n) =>
    `    case ${n}u${n === GPU_VIEW_VIRIDIS_ANCHORS.length - 1 ? ", default" : ""}: { return vec3<f32>(${c[0]}, ${c[1]}, ${c[2]}); }`,
).join("\n")}
  }
}

fn viridisColor(t: f32) -> vec3<f32> {
  let clamped = clamp(t, 0.0, 1.0);
  let scaled = clamped * f32(RAMP_COUNT - 1u);
  let lo = min(u32(floor(scaled)), RAMP_COUNT - 2u);
  let frac = scaled - f32(lo);
  let c0 = viridisAnchor(lo);
  let c1 = viridisAnchor(lo + 1u);
  return c0 + (c1 - c0) * frac;
}

fn normalizeToUnit(value: f32, lo: f32, hi: f32) -> f32 {
  if (!(hi > lo)) { return 0.0; }
  return clamp((value - lo) / (hi - lo), 0.0, 1.0);
}

const NO_DATA_COLOR: vec3<f32> =
  vec3<f32>(${NO_DATA_SRGB[0]}, ${NO_DATA_SRGB[1]}, ${NO_DATA_SRGB[2]});
const BASE_COLOR: vec3<f32> =
  vec3<f32>(${GPU_VIEW_BASE_SRGB[0]}, ${GPU_VIEW_BASE_SRGB[1]}, ${GPU_VIEW_BASE_SRGB[2]});
`;

export const GPU_VIEW_EXTRACT_WGSL = /* wgsl */ `
struct ViewGridUniforms {
  dims: vec3<u32>,
  cellCount: u32,
  plane: u32,
  capacity: u32,
  strideThreads: u32,
  reserved0: u32,
}

struct DrawArgs {
  indexCount: u32,
  instanceCount: atomic<u32>,
  firstIndex: u32,
  baseVertex: u32,
  firstInstance: u32,
}

@group(0) @binding(0) var<uniform> uniforms: ViewGridUniforms;
@group(0) @binding(1) var<storage, read> occupancy: array<u32>;
@group(0) @binding(2) var<storage, read> wall: array<u32>;
@group(0) @binding(3) var<storage, read_write> surfaceList: array<u32>;
@group(0) @binding(4) var<storage, read_write> drawArgs: DrawArgs;

fn isFreeCell(cell: u32) -> bool {
  return occupancy[cell] == 0u && wall[cell] == 0u;
}

@compute @workgroup_size(1)
fn resetSurfaceDraw() {
  drawArgs.indexCount = ${GPU_VIEW_PRISM_INDEX_COUNT}u;
  atomicStore(&drawArgs.instanceCount, 0u);
  drawArgs.firstIndex = 0u;
  drawArgs.baseVertex = 0u;
  drawArgs.firstInstance = 0u;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn extractSurface(@builtin(global_invocation_id) invocation: vec3<u32>) {
  var index = invocation.x;
  loop {
    if (index >= uniforms.cellCount) { break; }
    if (occupancy[index] != 0u) {
      let k = index / uniforms.plane;
      let remainder = index - k * uniforms.plane;
      let jj = i32(remainder / uniforms.dims.x);
      let ii = i32(remainder - u32(jj) * uniforms.dims.x);
      var exposed = false;
      ${tNeighborVisitsWgsl(
        (neighbor) => `if (!exposed && isFreeCell(${neighbor})) { exposed = true; }`,
      )}
      if (!exposed && k + 1u < uniforms.dims.z && isFreeCell(index + uniforms.plane)) {
        exposed = true;
      }
      if (!exposed && k > 0u && isFreeCell(index - uniforms.plane)) {
        exposed = true;
      }
      if (exposed) {
        let slot = atomicAdd(&drawArgs.instanceCount, 1u);
        if (slot < uniforms.capacity) {
          surfaceList[slot] = index;
        }
      }
    }
    index = index + uniforms.strideThreads;
  }
}
`;

export const GPU_VIEW_OVERLAY_WGSL = /* wgsl */ `
struct OverlayUniforms {
  dims: vec3<u32>,
  cellCount: u32,
  plane: u32,
  tick: u32,
  overlayId: u32,
  capacity: u32,
  rangeMin: f32,
  rangeMax: f32,
  recencyWindow: f32,
  strideThreads: u32,
  ggThreshBeta0: vec4<f32>,
  ggThreshBeta1: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: OverlayUniforms;
@group(0) @binding(1) var<storage, read> occupancy: array<u32>;
@group(0) @binding(2) var<storage, read> wall: array<u32>;
@group(0) @binding(3) var<storage, read> vapor: array<f32>;
@group(0) @binding(4) var<storage, read> boundaryMass: array<f32>;
@group(0) @binding(5) var<storage, read> attachTick: array<u32>;
@group(0) @binding(6) var<storage, read> surfaceList: array<u32>;
@group(0) @binding(7) var<storage, read> drawArgsWords: array<u32>;
@group(0) @binding(8) var<storage, read_write> instanceColors: array<u32>;

${COLOR_RAMP_WGSL}

fn isFreeCell(cell: u32) -> bool {
  return occupancy[cell] == 0u && wall[cell] == 0u;
}

fn thresholdFor(slot: u32) -> f32 {
  if (slot < 4u) {
    return uniforms.ggThreshBeta0[slot];
  }
  return uniforms.ggThreshBeta1[slot - 4u];
}

// Uncapped attached-neighbor counts of a CANDIDATE cell (overlays.ts
// attachedNeighborCountsUncapped; the same rule the solver's own WGSL applies).
fn uncappedCounts(index: u32) -> vec2<u32> {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let jj = i32(remainder / uniforms.dims.x);
  let ii = i32(remainder - u32(jj) * uniforms.dims.x);
  var nT = 0u;
  ${tNeighborVisitsWgsl((neighbor) => `if (occupancy[${neighbor}] != 0u) { nT = nT + 1u; }`)}
  var nZ = 0u;
  if (k + 1u < uniforms.dims.z && occupancy[index + uniforms.plane] != 0u) { nZ = nZ + 1u; }
  if (k > 0u && occupancy[index - uniforms.plane] != 0u) { nZ = nZ + 1u; }
  return vec2<u32>(nT, nZ);
}

struct OverlaySample {
  known: bool,
  value: f32,
}

fn propensityCandidate(index: u32, best: OverlaySample) -> OverlaySample {
  if (!isFreeCell(index)) { return best; }
  let counts = uncappedCounts(index);
  let slot = (min(counts.x, 3u) * 2u) + min(counts.y, 1u);
  let progress = boundaryMass[index] / thresholdFor(slot);
  if (!best.known || progress > best.value) {
    return OverlaySample(true, progress);
  }
  return best;
}

fn overlaySampleAt(index: u32) -> OverlaySample {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let jj = i32(remainder / uniforms.dims.x);
  let ii = i32(remainder - u32(jj) * uniforms.dims.x);

  if (uniforms.overlayId == 1u) {
    // vaporAvailability: mean vapor over FREE neighbors (T ring, then k+1, then k-1).
    var sum = 0.0;
    var count = 0u;
    ${tNeighborVisitsWgsl(
      (neighbor) => `{
        let y = ${neighbor};
        if (isFreeCell(y)) {
          sum = sum + vapor[y];
          count = count + 1u;
        }
      }`,
    )}
    if (k + 1u < uniforms.dims.z && isFreeCell(index + uniforms.plane)) {
      sum = sum + vapor[index + uniforms.plane];
      count = count + 1u;
    }
    if (k > 0u && isFreeCell(index - uniforms.plane)) {
      sum = sum + vapor[index - uniforms.plane];
      count = count + 1u;
    }
    if (count == 0u) { return OverlaySample(false, 0.0); }
    return OverlaySample(true, sum / f32(count));
  }

  if (uniforms.overlayId == 2u) {
    // growthPropensity: max over adjacent free candidates of b / ggThreshBeta(capped slot).
    var best = OverlaySample(false, 0.0);
    ${tNeighborVisitsWgsl((neighbor) => `best = propensityCandidate(${neighbor}, best);`)}
    if (k + 1u < uniforms.dims.z) {
      best = propensityCandidate(index + uniforms.plane, best);
    }
    if (k > 0u) {
      best = propensityCandidate(index - uniforms.plane, best);
    }
    return best;
  }

  if (uniforms.overlayId == 3u) {
    return OverlaySample(true, boundaryMass[index]);
  }

  // growthRecency: 1 - age/W clamped to [0,1]; attach tick 0 = seed reads 0.
  let attachedAt = attachTick[index];
  if (attachedAt == 0u) { return OverlaySample(true, 0.0); }
  let age = f32(uniforms.tick - attachedAt);
  var window = uniforms.recencyWindow;
  if (!(window > 0.0)) { window = 1.0; }
  return OverlaySample(true, clamp(1.0 - age / window, 0.0, 1.0));
}

fn packColor(rgb: vec3<f32>) -> u32 {
  return pack4x8unorm(vec4<f32>(rgb, 1.0));
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn colorSurface(@builtin(global_invocation_id) invocation: vec3<u32>) {
  var slot = invocation.x;
  let count = min(drawArgsWords[1], uniforms.capacity);
  loop {
    if (slot >= count) { break; }
    let index = surfaceList[slot];
    if (uniforms.overlayId == 0u) {
      instanceColors[slot] = packColor(BASE_COLOR);
    } else {
      let sample = overlaySampleAt(index);
      if (!sample.known) {
        instanceColors[slot] = packColor(NO_DATA_COLOR);
      } else {
        instanceColors[slot] = packColor(
          viridisColor(normalizeToUnit(sample.value, uniforms.rangeMin, uniforms.rangeMax)),
        );
      }
    }
    slot = slot + uniforms.strideThreads;
  }
}
`;

export const GPU_VIEW_SLICE_PAINT_WGSL = /* wgsl */ `
struct SlicePaintUniforms {
  dims: vec3<u32>,
  plane: u32,
  orientation: u32,
  sliceIndex: u32,
  width: u32,
  height: u32,
  rangeMin: f32,
  rangeMax: f32,
  reserved0: u32,
  reserved1: u32,
}

@group(0) @binding(0) var<uniform> uniforms: SlicePaintUniforms;
@group(0) @binding(1) var<storage, read> vapor: array<f32>;
@group(0) @binding(2) var sliceTarget: texture_storage_2d<rgba8unorm, write>;

${COLOR_RAMP_WGSL}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn paintSlice(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let texel = invocation.x;
  let total = uniforms.width * uniforms.height;
  if (texel >= total) { return; }
  let u = texel % uniforms.width;
  let v = texel / uniforms.width;
  var cell: u32;
  if (uniforms.orientation == 0u) {
    // vertical (fixed j = sliceIndex): tex[v*width+u] = field[idx(u, sliceIndex, v)]
    cell = (v * uniforms.plane) + (uniforms.sliceIndex * uniforms.dims.x) + u;
  } else {
    // horizontal (fixed k = sliceIndex): tex[v*width+u] = field[idx(u, v, sliceIndex)]
    cell = (uniforms.sliceIndex * uniforms.plane) + (v * uniforms.dims.x) + u;
  }
  let rgb = viridisColor(normalizeToUnit(vapor[cell], uniforms.rangeMin, uniforms.rangeMax));
  textureStore(sliceTarget, vec2<u32>(u, v), vec4<f32>(rgb, 1.0));
}
`;

export const GPU_VIEW_PRISM_WGSL = /* wgsl */ `
struct CameraUniforms {
  viewProjection: mat4x4<f32>,
  worldOffset: vec4<f32>,
  dims: vec3<u32>,
  plane: u32,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<storage, read> surfaceList: array<u32>;
@group(0) @binding(2) var<storage, read> instanceColors: array<u32>;

struct PrismStage {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) surfaceNormal: vec3<f32>,
  @location(1) colorSrgb: vec3<f32>,
}

@vertex
fn prismVertex(
  @builtin(instance_index) instanceIndex: u32,
  @location(0) localPosition: vec3<f32>,
  @location(1) localNormal: vec3<f32>,
) -> PrismStage {
  let cell = surfaceList[instanceIndex];
  let k = cell / camera.plane;
  let remainder = cell - (k * camera.plane);
  let j = remainder / camera.dims.x;
  let i = remainder - (j * camera.dims.x);
  // The lattice's cartesian embedding (x = i + j/2, y = j*sqrt(3)/2, z = k), shifted by the
  // SAME world offset the Three view uses, so both canvases agree on world space.
  let world = vec3<f32>(
    (f32(i) + (f32(j) * 0.5)) - camera.worldOffset.x,
    (f32(j) * ${SQRT3_OVER_2}) - camera.worldOffset.y,
    f32(k) - camera.worldOffset.z,
  ) + localPosition;
  var stage: PrismStage;
  stage.clipPosition = camera.viewProjection * vec4<f32>(world, 1.0);
  stage.surfaceNormal = localNormal;
  stage.colorSrgb = unpack4x8unorm(instanceColors[instanceIndex]).rgb;
  return stage;
}

fn srgbChannelToLinear(c: f32) -> f32 {
  if (c <= 0.04045) { return c / 12.92; }
  return pow((c + 0.055) / 1.055, 2.4);
}

fn linearChannelToSrgb(c: f32) -> f32 {
  if (c <= 0.0031308) { return c * 12.92; }
  return (1.055 * pow(c, 1.0 / 2.4)) - 0.055;
}

@fragment
fn prismFragment(stage: PrismStage) -> @location(0) vec4<f32> {
  // Plain diagnostic lighting (display-only; Phase 7 owns real materials): hemisphere
  // ambient about +z plus two fixed lambert directions echoing the Three scene's rig.
  let normalDir = normalize(stage.surfaceNormal);
  let linearColor = vec3<f32>(
    srgbChannelToLinear(stage.colorSrgb.x),
    srgbChannelToLinear(stage.colorSrgb.y),
    srgbChannelToLinear(stage.colorSrgb.z),
  );
  let keyDir = normalize(vec3<f32>(60.0, -90.0, 140.0));
  let fillDir = normalize(vec3<f32>(-80.0, 70.0, -40.0));
  let hemiMix = (0.5 * normalDir.z) + 0.5;
  let ambient = mix(vec3<f32>(0.055, 0.06, 0.07), vec3<f32>(0.52, 0.62, 0.75), hemiMix);
  let key = vec3<f32>(1.0, 1.0, 1.0) * (0.85 * max(dot(normalDir, keyDir), 0.0));
  let fill = vec3<f32>(0.24, 0.28, 0.34) * (0.5 * max(dot(normalDir, fillDir), 0.0));
  let lit = clamp(linearColor * (ambient + key + fill), vec3<f32>(0.0), vec3<f32>(1.0));
  return vec4<f32>(
    linearChannelToSrgb(lit.x),
    linearChannelToSrgb(lit.y),
    linearChannelToSrgb(lit.z),
    1.0,
  );
}
`;

export const GPU_VIEW_SLICE_RENDER_WGSL = /* wgsl */ `
struct SliceRenderUniforms {
  modelViewProjection: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> sliceUniforms: SliceRenderUniforms;
@group(0) @binding(1) var sliceTexture: texture_2d<f32>;
@group(0) @binding(2) var sliceSampler: sampler;

struct SliceStage {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

@vertex
fn sliceVertex(@builtin(vertex_index) vertexIndex: u32) -> SliceStage {
  // Unit plane in [-1/2, 1/2]^2, triangle-strip; UV (0,0) at (-1/2,-1/2) — the exact
  // PlaneGeometry convention slice.ts sliceWorldMatrix was derived for.
  var corners = array<vec2<f32>, 4>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(0.5, 0.5),
  );
  let corner = corners[vertexIndex];
  var stage: SliceStage;
  stage.clipPosition = sliceUniforms.modelViewProjection * vec4<f32>(corner, 0.0, 1.0);
  stage.texCoord = corner + vec2<f32>(0.5, 0.5);
  return stage;
}

@fragment
fn sliceFragment(stage: SliceStage) -> @location(0) vec4<f32> {
  return vec4<f32>(textureSample(sliceTexture, sliceSampler, stage.texCoord).rgb, 1.0);
}
`;

// ── Pick readout (named-probe floor; raycast picking is explicitly deferred) ───────────────

export interface GpuPickData {
  readonly i: number;
  readonly j: number;
  readonly k: number;
  readonly attached: boolean;
  readonly wall: boolean;
  readonly b: number;
  readonly d: number;
  readonly nTUncapped: number;
  readonly nZUncapped: number;
  readonly overlayName: OverlayName;
  /** Overlay value; NaN = undefined-for-cell; null = not read (bounded probe refusal). */
  readonly overlayValue: number | null;
}

function pickNum(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4) : "undefined (NaN)";
}

/** Readout lines mirroring readout.ts formatReadout, plus GPU probe provenance (§1.5). */
export function formatGpuPickLines(data: GpuPickData): string[] {
  const nTCapped = Math.min(data.nTUncapped, 3);
  const nZCapped = Math.min(data.nZUncapped, 1);
  const lines: string[] = [];
  lines.push(`cell (${data.i}, ${data.j}, ${data.k}) — lattice site (model coordinates)`);
  lines.push(
    `a = ${data.attached ? 1 : 0} — ${data.attached ? "attached (crystal)" : data.wall ? "inert wall" : "free (vapor)"} (computed state, unvalidated)`,
  );
  lines.push(`b = ${pickNum(data.b)} — boundary mass (computed state, model units, unvalidated)`);
  lines.push(`d = ${pickNum(data.d)} — vapor mass (computed state, model units, unvalidated)`);
  lines.push(
    `attached neighbors: nT ${data.nTUncapped}, nZ ${data.nZUncapped} (uncapped) — ` +
      `param slot uses nT ${nTCapped}, nZ ${nZCapped} (capped, as GGSolver does) ` +
      `(computed state, counts, unvalidated)`,
  );
  if (data.overlayName !== "none") {
    const label = OVERLAY_LABELS[data.overlayName];
    if (data.overlayValue === null) {
      lines.push(
        `overlay ${label.title}: not read in GPU mode (bounded named-probe readout; ` +
          `this quantity needs second-ring neighbor state — select the CPU engine for it)`,
      );
    } else {
      lines.push(
        `overlay ${label.title} = ${pickNum(data.overlayValue)} — ${label.definition}`,
      );
    }
  }
  lines.push(
    "GPU engine: float32 GPU-resident state via audited named probes (computed state, unvalidated)",
  );
  return lines;
}

// ── The view ───────────────────────────────────────────────────────────────────────────────

const USAGE_COPY_SRC = 0x0004;
const USAGE_COPY_DST = 0x0008;
const USAGE_INDEX = 0x0010;
const USAGE_VERTEX = 0x0020;
const USAGE_UNIFORM = 0x0040;
const USAGE_STORAGE = 0x0080;
const USAGE_INDIRECT = 0x0100;

const TEX_USAGE_TEXTURE_BINDING = 0x04;
const TEX_USAGE_STORAGE_BINDING = 0x08;

const STAGE_VERTEX = 0x1;
const STAGE_FRAGMENT = 0x2;
const STAGE_COMPUTE = 0x4;

const CAMERA_UNIFORM_BYTES = 96;
const SLICE_RENDER_UNIFORM_BYTES = 64;

interface GpuViewGenerationState {
  readonly generation: number;
  readonly dims: Dims;
  readonly plane: number;
  readonly cellCount: number;
  readonly capacity: number;
  readonly worldOffset: readonly [number, number, number];
  readonly surfaceList: GPUBuffer;
  readonly instanceColors: GPUBuffer;
  readonly drawArgs: GPUBuffer;
  readonly extractUniform: GPUBuffer;
  readonly overlayUniform: GPUBuffer;
  readonly slicePaintUniform: GPUBuffer;
  readonly extractBindGroup: GPUBindGroup;
  readonly prismBindGroup: GPUBindGroup;
  readonly overlayBindGroups: Map<GPUBuffer, GPUBindGroup>;
  readonly slicePaintBindGroups: Map<GPUBuffer, GPUBindGroup>;
  sliceTexture: GPUTexture | null;
  sliceTextureOrientation: SliceOrientation | null;
  sliceRenderBindGroup: GPUBindGroup | null;
}

export class GpuView {
  readonly canvas: HTMLCanvasElement;

  private readonly device: GPUDevice;
  private readonly container: HTMLElement;
  private readonly context: GPUCanvasContext;
  private readonly format: GPUTextureFormat;

  private readonly extractLayout: GPUBindGroupLayout;
  private readonly overlayLayout: GPUBindGroupLayout;
  private readonly slicePaintLayout: GPUBindGroupLayout;
  private readonly prismLayout: GPUBindGroupLayout;
  private readonly sliceRenderLayout: GPUBindGroupLayout;
  private readonly resetPipeline: GPUComputePipeline;
  private readonly extractPipeline: GPUComputePipeline;
  private readonly overlayPipeline: GPUComputePipeline;
  private readonly slicePaintPipeline: GPUComputePipeline;
  private readonly prismPipeline: GPURenderPipeline;
  private readonly sliceRenderPipeline: GPURenderPipeline;

  private readonly prismPositions: GPUBuffer;
  private readonly prismNormals: GPUBuffer;
  private readonly prismIndices: GPUBuffer;
  private readonly cameraUniform: GPUBuffer;
  private readonly sliceRenderUniform: GPUBuffer;
  private readonly sliceSampler: GPUSampler;

  private depthTexture: GPUTexture | null = null;
  private depthWidth = 0;
  private depthHeight = 0;

  private generationState: GpuViewGenerationState | null = null;
  private controls: GpuViewControls | null = null;
  private sliceModelColumnMajor: Float32Array | null = null;
  private visible = false;
  private crystalVisible = true;
  private controlEditOrdinal = 0;
  private readonly errorHandlers: ((message: string) => void)[] = [];

  private constructor(device: GPUDevice, container: HTMLElement, canvas: HTMLCanvasElement) {
    this.device = device;
    this.container = container;
    this.canvas = canvas;
    const context = canvas.getContext("webgpu");
    if (context === null) throw new Error("the GPU view canvas has no WebGPU context");
    this.context = context;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device, format: this.format });

    const computeBuffer = (
      binding: number,
      type: "uniform" | "read-only-storage" | "storage",
    ): GPUBindGroupLayoutEntry => ({ binding, visibility: STAGE_COMPUTE, buffer: { type } });

    this.extractLayout = device.createBindGroupLayout({
      label: "vcc:view:extract",
      entries: [
        computeBuffer(0, "uniform"),
        computeBuffer(1, "read-only-storage"),
        computeBuffer(2, "read-only-storage"),
        computeBuffer(3, "storage"),
        computeBuffer(4, "storage"),
      ],
    });
    this.overlayLayout = device.createBindGroupLayout({
      label: "vcc:view:overlay",
      entries: [
        computeBuffer(0, "uniform"),
        computeBuffer(1, "read-only-storage"),
        computeBuffer(2, "read-only-storage"),
        computeBuffer(3, "read-only-storage"),
        computeBuffer(4, "read-only-storage"),
        computeBuffer(5, "read-only-storage"),
        computeBuffer(6, "read-only-storage"),
        computeBuffer(7, "read-only-storage"),
        computeBuffer(8, "storage"),
      ],
    });
    this.slicePaintLayout = device.createBindGroupLayout({
      label: "vcc:view:slice-paint",
      entries: [
        computeBuffer(0, "uniform"),
        computeBuffer(1, "read-only-storage"),
        {
          binding: 2,
          visibility: STAGE_COMPUTE,
          storageTexture: { access: "write-only", format: "rgba8unorm" },
        },
      ],
    });
    this.prismLayout = device.createBindGroupLayout({
      label: "vcc:view:prism",
      entries: [
        { binding: 0, visibility: STAGE_VERTEX, buffer: { type: "uniform" } },
        { binding: 1, visibility: STAGE_VERTEX, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: STAGE_VERTEX, buffer: { type: "read-only-storage" } },
      ],
    });
    this.sliceRenderLayout = device.createBindGroupLayout({
      label: "vcc:view:slice-render",
      entries: [
        { binding: 0, visibility: STAGE_VERTEX, buffer: { type: "uniform" } },
        { binding: 1, visibility: STAGE_FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: STAGE_FRAGMENT, sampler: { type: "filtering" } },
      ],
    });

    const module = (label: string, code: string): GPUShaderModule =>
      device.createShaderModule({ label, code });
    const extractModule = module("vcc:view:extract", GPU_VIEW_EXTRACT_WGSL);
    const overlayModule = module("vcc:view:overlay", GPU_VIEW_OVERLAY_WGSL);
    const slicePaintModule = module("vcc:view:slice-paint", GPU_VIEW_SLICE_PAINT_WGSL);
    const prismModule = module("vcc:view:prism", GPU_VIEW_PRISM_WGSL);
    const sliceRenderModule = module("vcc:view:slice-render", GPU_VIEW_SLICE_RENDER_WGSL);

    const computePipeline = (
      label: string,
      layout: GPUBindGroupLayout,
      shaderModule: GPUShaderModule,
      entryPoint: string,
    ): GPUComputePipeline =>
      device.createComputePipeline({
        label,
        layout: device.createPipelineLayout({ label, bindGroupLayouts: [layout] }),
        compute: { module: shaderModule, entryPoint },
      });
    this.resetPipeline = computePipeline(
      "vcc:view:reset",
      this.extractLayout,
      extractModule,
      "resetSurfaceDraw",
    );
    this.extractPipeline = computePipeline(
      "vcc:view:extract",
      this.extractLayout,
      extractModule,
      "extractSurface",
    );
    this.overlayPipeline = computePipeline(
      "vcc:view:overlay",
      this.overlayLayout,
      overlayModule,
      "colorSurface",
    );
    this.slicePaintPipeline = computePipeline(
      "vcc:view:slice-paint",
      this.slicePaintLayout,
      slicePaintModule,
      "paintSlice",
    );

    this.prismPipeline = device.createRenderPipeline({
      label: "vcc:view:prism",
      layout: device.createPipelineLayout({
        label: "vcc:view:prism",
        bindGroupLayouts: [this.prismLayout],
      }),
      vertex: {
        module: prismModule,
        entryPoint: "prismVertex",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
          },
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
          },
        ],
      },
      fragment: {
        module: prismModule,
        entryPoint: "prismFragment",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-list", cullMode: "back", frontFace: "ccw" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });
    this.sliceRenderPipeline = device.createRenderPipeline({
      label: "vcc:view:slice-render",
      layout: device.createPipelineLayout({
        label: "vcc:view:slice-render",
        bindGroupLayouts: [this.sliceRenderLayout],
      }),
      vertex: { module: sliceRenderModule, entryPoint: "sliceVertex" },
      fragment: {
        module: sliceRenderModule,
        entryPoint: "sliceFragment",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-strip", cullMode: "none" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    // Lattice-exact prism geometry from hexgeom.ts (the same data the Three path renders).
    // Fresh copies pin the backing store to a plain ArrayBuffer for writeBuffer's typing.
    const mesh = hexPrismMeshData();
    const positions = new Float32Array(mesh.positions);
    const normals = new Float32Array(mesh.normals);
    const indices = new Uint16Array(mesh.indices);
    this.prismPositions = device.createBuffer({
      label: "vcc:view:prism-positions",
      size: positions.byteLength,
      usage: USAGE_VERTEX | USAGE_COPY_DST,
    });
    device.queue.writeBuffer(this.prismPositions, 0, positions);
    this.prismNormals = device.createBuffer({
      label: "vcc:view:prism-normals",
      size: normals.byteLength,
      usage: USAGE_VERTEX | USAGE_COPY_DST,
    });
    device.queue.writeBuffer(this.prismNormals, 0, normals);
    this.prismIndices = device.createBuffer({
      label: "vcc:view:prism-indices",
      size: indices.byteLength,
      usage: USAGE_INDEX | USAGE_COPY_DST,
    });
    device.queue.writeBuffer(this.prismIndices, 0, indices);

    this.cameraUniform = device.createBuffer({
      label: "vcc:view:camera",
      size: CAMERA_UNIFORM_BYTES,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });
    this.sliceRenderUniform = device.createBuffer({
      label: "vcc:view:slice-render",
      size: SLICE_RENDER_UNIFORM_BYTES,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });
    this.sliceSampler = device.createSampler({
      label: "vcc:view:slice-sampler",
      magFilter: "nearest",
      minFilter: "nearest",
    });
  }

  /**
   * Create the second canvas INSIDE #scene, after Three's canvas (D2): full-size, above the
   * Three surface, `pointer-events: none` so every pointer/orbit event still lands on
   * Three's canvas — which also stays the `#scene canvas` first match. Hidden until GPU
   * mode shows it.
   */
  static create(device: GPUDevice, container: HTMLElement): GpuView {
    const canvas = document.createElement("canvas");
    canvas.id = "vcc-gpu-view";
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none;";
    container.appendChild(canvas);
    return new GpuView(device, container, canvas);
  }

  onError(handler: (message: string) => void): void {
    this.errorHandlers.push(handler);
  }

  private reportError(context: string, err: unknown): void {
    const message = `${context}: ${err instanceof Error ? err.message : String(err)}`;
    for (const handler of this.errorHandlers) handler(message);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.canvas.style.display = visible ? "" : "none";
  }

  isVisible(): boolean {
    return this.visible;
  }

  /** Debug hook parity with CrystalView.setCrystalVisible (slice-only captures). */
  setCrystalVisible(visible: boolean): void {
    this.crystalVisible = visible;
  }

  /** Serializable state summary for __vccDebug.gpuViewInfo(). */
  info(): Record<string, unknown> | null {
    const state = this.generationState;
    if (state === null) return null;
    return {
      generation: state.generation,
      dims: { ...state.dims },
      capacity: state.capacity,
      visible: this.visible,
      sliceTextureOrientation: state.sliceTextureOrientation,
      overlay: this.controls?.overlayName ?? null,
      sliceEnabled: this.controls?.sliceEnabled ?? false,
    };
  }

  /**
   * (Re)allocate the display-owned buffers for a fresh solver generation. Fail-closed: the
   * per-cell display buffers are validated against the live device limits BEFORE the prior
   * display state is touched, and a refusal names the violated limit and the estimated
   * bytes (the solver's own arena passed the same class of check first).
   */
  beginGeneration(source: GpuViewSource, worldOffset: readonly [number, number, number]): void {
    const { dims } = source;
    const plane = dims.nx * dims.ny;
    const cells = plane * dims.nz;
    const capacity = cells;
    const bufferBytes = capacity * 4;
    const maxBinding = Number(this.device.limits.maxStorageBufferBindingSize);
    const maxBuffer = Number(this.device.limits.maxBufferSize);
    if (bufferBytes > maxBinding || bufferBytes > maxBuffer) {
      throw new Error(
        `GPU view display buffers cannot allocate: surface list requires ${bufferBytes} ` +
          `bytes, above ${bufferBytes > maxBinding ? `maxStorageBufferBindingSize ${maxBinding}` : `maxBufferSize ${maxBuffer}`}; ` +
          `the prior display state stays live`,
      );
    }

    this.destroyGeneration();

    const surfaceList = this.device.createBuffer({
      label: "vcc:view:surface-list",
      size: bufferBytes,
      usage: USAGE_STORAGE | USAGE_COPY_SRC,
    });
    const instanceColors = this.device.createBuffer({
      label: "vcc:view:instance-colors",
      size: bufferBytes,
      usage: USAGE_STORAGE | USAGE_COPY_SRC,
    });
    // Zero-initialized: indexCount 0 draws nothing until the first extraction lands.
    const drawArgs = this.device.createBuffer({
      label: "vcc:view:draw-args",
      size: GPU_VIEW_DRAW_ARGS_BYTES,
      usage: USAGE_STORAGE | USAGE_INDIRECT | USAGE_COPY_SRC,
    });
    const extractUniform = this.device.createBuffer({
      label: "vcc:view:extract-uniforms",
      size: GPU_VIEW_EXTRACT_UNIFORM_BYTES,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });
    this.device.queue.writeBuffer(extractUniform, 0, encodeExtractUniforms(dims, capacity));
    const overlayUniform = this.device.createBuffer({
      label: "vcc:view:overlay-uniforms",
      size: GPU_VIEW_OVERLAY_UNIFORM_BYTES,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });
    const slicePaintUniform = this.device.createBuffer({
      label: "vcc:view:slice-paint-uniforms",
      size: GPU_VIEW_SLICE_UNIFORM_BYTES,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });

    const extractBindGroup = this.device.createBindGroup({
      label: "vcc:view:extract",
      layout: this.extractLayout,
      entries: [
        { binding: 0, resource: { buffer: extractUniform } },
        { binding: 1, resource: { buffer: source.buffers.occupancy } },
        { binding: 2, resource: { buffer: source.buffers.wall } },
        { binding: 3, resource: { buffer: surfaceList } },
        { binding: 4, resource: { buffer: drawArgs } },
      ],
    });
    const prismBindGroup = this.device.createBindGroup({
      label: "vcc:view:prism",
      layout: this.prismLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraUniform } },
        { binding: 1, resource: { buffer: surfaceList } },
        { binding: 2, resource: { buffer: instanceColors } },
      ],
    });

    this.generationState = {
      generation: source.generation,
      dims: { ...dims },
      plane,
      cellCount: cells,
      capacity,
      worldOffset: [worldOffset[0], worldOffset[1], worldOffset[2]],
      surfaceList,
      instanceColors,
      drawArgs,
      extractUniform,
      overlayUniform,
      slicePaintUniform,
      extractBindGroup,
      prismBindGroup,
      overlayBindGroups: new Map(),
      slicePaintBindGroups: new Map(),
      sliceTexture: null,
      sliceTextureOrientation: null,
      sliceRenderBindGroup: null,
    };
    this.controls = null;
    this.sliceModelColumnMajor = null;
  }

  destroyGeneration(): void {
    const state = this.generationState;
    if (state === null) return;
    this.generationState = null;
    state.surfaceList.destroy();
    state.instanceColors.destroy();
    state.drawArgs.destroy();
    state.extractUniform.destroy();
    state.overlayUniform.destroy();
    state.slicePaintUniform.destroy();
    state.sliceTexture?.destroy();
  }

  private overlayBindGroupFor(
    state: GpuViewGenerationState,
    source: GpuViewSource,
  ): GPUBindGroup {
    const cached = state.overlayBindGroups.get(source.buffers.vapor);
    if (cached !== undefined) return cached;
    const group = this.device.createBindGroup({
      label: "vcc:view:overlay",
      layout: this.overlayLayout,
      entries: [
        { binding: 0, resource: { buffer: state.overlayUniform } },
        { binding: 1, resource: { buffer: source.buffers.occupancy } },
        { binding: 2, resource: { buffer: source.buffers.wall } },
        { binding: 3, resource: { buffer: source.buffers.vapor } },
        { binding: 4, resource: { buffer: source.buffers.boundaryMass } },
        { binding: 5, resource: { buffer: source.buffers.attachTick } },
        { binding: 6, resource: { buffer: state.surfaceList } },
        { binding: 7, resource: { buffer: state.drawArgs } },
        { binding: 8, resource: { buffer: state.instanceColors } },
      ],
    });
    state.overlayBindGroups.set(source.buffers.vapor, group);
    return group;
  }

  private ensureSliceTexture(
    state: GpuViewGenerationState,
    orientation: SliceOrientation,
  ): GPUTexture {
    if (state.sliceTexture !== null && state.sliceTextureOrientation === orientation) {
      return state.sliceTexture;
    }
    state.sliceTexture?.destroy();
    state.slicePaintBindGroups.clear();
    const { width, height } = gpuSliceTextureSize(orientation, state.dims);
    const texture = this.device.createTexture({
      label: "vcc:view:slice-texture",
      size: { width, height },
      format: "rgba8unorm",
      usage: TEX_USAGE_TEXTURE_BINDING | TEX_USAGE_STORAGE_BINDING,
    });
    state.sliceTexture = texture;
    state.sliceTextureOrientation = orientation;
    state.sliceRenderBindGroup = this.device.createBindGroup({
      label: "vcc:view:slice-render",
      layout: this.sliceRenderLayout,
      entries: [
        { binding: 0, resource: { buffer: this.sliceRenderUniform } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: this.sliceSampler },
      ],
    });
    return texture;
  }

  private slicePaintBindGroupFor(
    state: GpuViewGenerationState,
    source: GpuViewSource,
    texture: GPUTexture,
  ): GPUBindGroup {
    const cached = state.slicePaintBindGroups.get(source.buffers.vapor);
    if (cached !== undefined) return cached;
    const group = this.device.createBindGroup({
      label: "vcc:view:slice-paint",
      layout: this.slicePaintLayout,
      entries: [
        { binding: 0, resource: { buffer: state.slicePaintUniform } },
        { binding: 1, resource: { buffer: source.buffers.vapor } },
        { binding: 2, resource: texture.createView() },
      ],
    });
    state.slicePaintBindGroups.set(source.buffers.vapor, group);
    return group;
  }

  private writeControlUniforms(
    state: GpuViewGenerationState,
    source: GpuViewSource,
    controls: GpuViewControls,
  ): void {
    this.device.queue.writeBuffer(
      state.overlayUniform,
      0,
      encodeOverlayUniforms({
        dims: state.dims,
        tick: source.tick,
        overlayName: controls.overlayName,
        capacity: state.capacity,
        rangeMin: controls.overlayMin,
        rangeMax: controls.overlayMax,
        recencyWindowTicks: controls.recencyWindowTicks,
        ggThreshBeta: controls.ggThreshBeta,
      }),
    );
    if (controls.sliceEnabled) {
      this.device.queue.writeBuffer(
        state.slicePaintUniform,
        0,
        encodeSlicePaintUniforms({
          dims: state.dims,
          orientation: controls.sliceOrientation,
          sliceIndex: controls.sliceIndex,
          rangeMin: controls.sliceMin,
          rangeMax: controls.sliceMax,
        }),
      );
    }
    this.controls = controls;
    this.sliceModelColumnMajor = columnMajorFromRowMajor(controls.sliceModelRowMajor);
  }

  private encodeDisplayPasses(
    state: GpuViewGenerationState,
    source: GpuViewSource,
    controls: GpuViewControls,
    includeExtraction: boolean,
    label: string,
  ): GPUCommandBuffer {
    const plan = gpuViewSweepPlan(state.cellCount);
    const encoder = this.device.createCommandEncoder({ label });
    const pass = encoder.beginComputePass({ label });
    if (includeExtraction) {
      pass.setPipeline(this.resetPipeline);
      pass.setBindGroup(0, state.extractBindGroup);
      pass.dispatchWorkgroups(1);
      pass.setPipeline(this.extractPipeline);
      pass.dispatchWorkgroups(plan.workgroups);
    }
    pass.setPipeline(this.overlayPipeline);
    pass.setBindGroup(0, this.overlayBindGroupFor(state, source));
    pass.dispatchWorkgroups(plan.workgroups);
    if (controls.sliceEnabled) {
      const texture = this.ensureSliceTexture(state, controls.sliceOrientation);
      const { width, height } = gpuSliceTextureSize(controls.sliceOrientation, state.dims);
      pass.setPipeline(this.slicePaintPipeline);
      pass.setBindGroup(0, this.slicePaintBindGroupFor(state, source, texture));
      pass.dispatchWorkgroups(Math.ceil((width * height) / GPU_WORKGROUP_SIZE));
    }
    pass.end();
    return encoder.finish({ label });
  }

  private submitDisplayPasses(
    source: GpuViewSource,
    controls: GpuViewControls,
    includeExtraction: boolean,
    label: string,
  ): void {
    const state = this.generationState;
    if (state === null || state.generation !== source.generation) return;
    try {
      this.writeControlUniforms(state, source, controls);
      const commands = this.encodeDisplayPasses(state, source, controls, includeExtraction, label);
      // Encoded and submitted synchronously (queue.submit happens before submit()'s first
      // await), so the solver's op queue cannot interleave a teardown mid-encoding.
      void source.submissions
        .submit(label, source.generation, [commands])
        .catch((err: unknown) => {
          // A submission raced a re-init (stale generation): superseded, not an error.
          if (err instanceof Error && err.message.includes("stale")) return;
          this.reportError(`gpu view submission ${label}`, err);
        });
    } catch (err) {
      this.reportError(`gpu view submission ${label}`, err);
    }
  }

  /** Full display sync after a completed step/reset: extraction + overlay (+ slice). */
  syncState(source: GpuViewSource, controls: GpuViewControls): void {
    this.submitDisplayPasses(source, controls, true, `app:view:state-t${source.tick}`);
  }

  /** Overlay/slice control repaint over the CURRENT surface list (no re-extraction). */
  repaintControls(source: GpuViewSource, controls: GpuViewControls): void {
    this.controlEditOrdinal++;
    this.submitDisplayPasses(
      source,
      controls,
      false,
      `app:view:controls-${this.controlEditOrdinal}`,
    );
  }

  /**
   * Per-rAF presentation of the display-owned buffers with the live OrbitControls camera.
   * No solver buffer is touched and nothing is read back — a pure draw, submitted directly
   * on the shared queue (the bounded-controller path is for solver-buffer work).
   */
  renderFrame(camera: {
    readonly projectionMatrix: { readonly elements: ArrayLike<number> };
    readonly matrixWorldInverse: { readonly elements: ArrayLike<number> };
  }): void {
    if (!this.visible) return;
    const state = this.generationState;
    if (state === null) return;
    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    const width = Math.max(1, Math.floor(this.container.clientWidth * dpr));
    const height = Math.max(1, Math.floor(this.container.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.depthTexture === null || this.depthWidth !== width || this.depthHeight !== height) {
      this.depthTexture?.destroy();
      this.depthTexture = this.device.createTexture({
        label: "vcc:view:depth",
        size: { width, height },
        format: "depth24plus",
        usage: 0x10, // RENDER_ATTACHMENT
      });
      this.depthWidth = width;
      this.depthHeight = height;
    }

    const viewProjection = multiplyMat4ColumnMajor(
      camera.projectionMatrix.elements,
      camera.matrixWorldInverse.elements,
    );
    const cameraWords = new ArrayBuffer(CAMERA_UNIFORM_BYTES);
    new Float32Array(cameraWords, 0, 16).set(viewProjection);
    const offsetFloats = new Float32Array(cameraWords, 64, 4);
    offsetFloats[0] = state.worldOffset[0];
    offsetFloats[1] = state.worldOffset[1];
    offsetFloats[2] = state.worldOffset[2];
    offsetFloats[3] = 0;
    const gridWords = new Uint32Array(cameraWords, 80, 4);
    gridWords[0] = state.dims.nx;
    gridWords[1] = state.dims.ny;
    gridWords[2] = state.dims.nz;
    gridWords[3] = state.plane;
    this.device.queue.writeBuffer(this.cameraUniform, 0, cameraWords);

    const controls = this.controls;
    const sliceVisible =
      controls !== null &&
      controls.sliceEnabled &&
      state.sliceRenderBindGroup !== null &&
      this.sliceModelColumnMajor !== null;
    if (sliceVisible && this.sliceModelColumnMajor !== null) {
      const mvp = multiplyMat4ColumnMajor(viewProjection, this.sliceModelColumnMajor);
      this.device.queue.writeBuffer(this.sliceRenderUniform, 0, mvp.buffer, 0, 64);
    }

    const encoder = this.device.createCommandEncoder({ label: "vcc:view:frame" });
    const pass = encoder.beginRenderPass({
      label: "vcc:view:frame",
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: {
            r: GPU_VIEW_BACKGROUND_SRGB[0],
            g: GPU_VIEW_BACKGROUND_SRGB[1],
            b: GPU_VIEW_BACKGROUND_SRGB[2],
            a: 1,
          },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
    if (this.crystalVisible) {
      pass.setPipeline(this.prismPipeline);
      pass.setBindGroup(0, state.prismBindGroup);
      pass.setVertexBuffer(0, this.prismPositions);
      pass.setVertexBuffer(1, this.prismNormals);
      pass.setIndexBuffer(this.prismIndices, "uint16");
      pass.drawIndexedIndirect(state.drawArgs, 0);
    }
    if (sliceVisible && state.sliceRenderBindGroup !== null) {
      pass.setPipeline(this.sliceRenderPipeline);
      pass.setBindGroup(0, state.sliceRenderBindGroup);
      pass.draw(4);
    }
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  // ── Compact audited probes (the picking floor + the parity-sample hook) ──────────────────

  private async readWord(
    source: GpuViewSource,
    buffer: GPUBuffer,
    cell: number,
    label: string,
  ): Promise<ArrayBuffer> {
    return readGpuBuffer(
      this.device,
      buffer,
      {
        purpose: "named-probe",
        label,
        generation: source.generation,
        byteOffset: cell * 4,
        byteLength: 4,
      },
      source.audit,
    );
  }

  /**
   * Named-probe pick readout (the frozen design's picking floor): compact audited 4-byte
   * reads of exactly the cells the readout prints — never a full field. Mouse raycast
   * picking over the GPU surface list is explicitly deferred (time-boxed out; the Three
   * instance path it would need is empty in GPU mode).
   */
  async pickCell(
    source: GpuViewSource,
    wallHost: Uint8Array | null,
    overlayName: OverlayName,
    recencyWindowTicks: number,
    i: number,
    j: number,
    k: number,
  ): Promise<string[]> {
    const { dims } = source;
    const plane = dims.nx * dims.ny;
    const base = k * plane + j * dims.nx + i;
    const tag = `app:view:pick-${i}-${j}-${k}`;
    const wordAt = async (buffer: GPUBuffer, cell: number, what: string): Promise<DataView> =>
      new DataView(await this.readWord(source, buffer, cell, `${tag}:${what}`));

    const [occWord, bWord, dWord, attachWord] = await Promise.all([
      wordAt(source.buffers.occupancy, base, "a"),
      wordAt(source.buffers.boundaryMass, base, "b"),
      wordAt(source.buffers.vapor, base, "d"),
      wordAt(source.buffers.attachTick, base, "attach-tick"),
    ]);
    const attached = occWord.getUint32(0, true) !== 0;
    const b = bWord.getFloat32(0, true);
    const d = dWord.getFloat32(0, true);
    const attachedAt = attachWord.getUint32(0, true);
    const isWall = wallHost !== null && wallHost[base] === 1;

    // Neighbor occupancy: the uncapped nT/nZ counts (and the free mask for availability).
    interface NeighborProbe {
      readonly cell: number;
      readonly kind: "t" | "z";
      readonly occupied: boolean;
    }
    const neighborCells: { cell: number; kind: "t" | "z" }[] = [];
    for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || ni >= dims.nx || nj < 0 || nj >= dims.ny) continue;
      neighborCells.push({ cell: base + dj * dims.nx + di, kind: "t" });
    }
    if (k + 1 < dims.nz) neighborCells.push({ cell: base + plane, kind: "z" });
    if (k - 1 >= 0) neighborCells.push({ cell: base - plane, kind: "z" });
    const neighbors: NeighborProbe[] = await Promise.all(
      neighborCells.map(async ({ cell, kind }, n) => ({
        cell,
        kind,
        occupied:
          (await wordAt(source.buffers.occupancy, cell, `n${n}-a`)).getUint32(0, true) !== 0,
      })),
    );
    const nTUncapped = neighbors.filter((n) => n.kind === "t" && n.occupied).length;
    const nZUncapped = neighbors.filter((n) => n.kind === "z" && n.occupied).length;

    let overlayValue: number | null = null;
    switch (overlayName) {
      case "none":
        break;
      case "boundaryMass":
        overlayValue = b;
        break;
      case "growthRecency": {
        if (attachedAt === 0) {
          overlayValue = 0;
        } else {
          const w = recencyWindowTicks > 0 ? recencyWindowTicks : 1;
          const recency = 1 - (source.tick - attachedAt) / w;
          overlayValue = recency < 0 ? 0 : recency > 1 ? 1 : recency;
        }
        break;
      }
      case "vaporAvailability": {
        const freeNeighbors = neighbors.filter(
          (n) => !n.occupied && (wallHost === null || wallHost[n.cell] === 0),
        );
        if (freeNeighbors.length === 0) {
          overlayValue = Number.NaN;
        } else {
          const values = await Promise.all(
            freeNeighbors.map(async (n, x) =>
              (await wordAt(source.buffers.vapor, n.cell, `n${x}-d`)).getFloat32(0, true),
            ),
          );
          overlayValue = values.reduce((sum, v) => sum + v, 0) / values.length;
        }
        break;
      }
      case "growthPropensity":
        // Needs second-ring neighbor state; the bounded probe refuses honestly (the
        // formatter prints the refusal by name).
        overlayValue = null;
        break;
    }

    return formatGpuPickLines({
      i,
      j,
      k,
      attached,
      wall: isWall,
      b,
      d,
      nTUncapped,
      nZUncapped,
      overlayName,
      overlayValue,
    });
  }

  /**
   * Compact audited sample of the extracted surface list and its overlay colors (parity
   * verification hook for the registered-host checklist). Reads the instance count (4
   * bytes) plus the first `maxEntries` list/color words — always a strict sub-range,
   * never a full field.
   */
  async sampleInstances(
    source: GpuViewSource,
    maxEntries: number,
  ): Promise<{ instanceCount: number; cells: number[]; colorsPacked: number[] }> {
    const state = this.generationState;
    if (state === null || state.generation !== source.generation) {
      throw new Error("GPU view has no display state for the current generation");
    }
    if (!Number.isSafeInteger(maxEntries) || maxEntries <= 0 || maxEntries > 4096) {
      throw new Error("GPU view sample size must be an integer in [1, 4096]");
    }
    const countBytes = await readGpuBuffer(
      this.device,
      state.drawArgs,
      {
        purpose: "named-probe",
        label: "app:view:sample:count",
        generation: source.generation,
        byteOffset: 4,
        byteLength: 4,
      },
      source.audit,
    );
    const instanceCount = new DataView(countBytes).getUint32(0, true);
    const entries = Math.min(maxEntries, instanceCount, state.capacity - 1);
    if (entries <= 0) return { instanceCount, cells: [], colorsPacked: [] };
    const [listBytes, colorBytes] = await Promise.all([
      readGpuBuffer(
        this.device,
        state.surfaceList,
        {
          purpose: "named-probe",
          label: "app:view:sample:cells",
          generation: source.generation,
          byteOffset: 0,
          byteLength: entries * 4,
        },
        source.audit,
      ),
      readGpuBuffer(
        this.device,
        state.instanceColors,
        {
          purpose: "named-probe",
          label: "app:view:sample:colors",
          generation: source.generation,
          byteOffset: 0,
          byteLength: entries * 4,
        },
        source.audit,
      ),
    ]);
    return {
      instanceCount,
      cells: [...new Uint32Array(listBytes)],
      colorsPacked: [...new Uint32Array(colorBytes)],
    };
  }
}
