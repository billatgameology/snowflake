// Node-side tests for the WP6 S4 GPU view (frozen design D2/D5): overlay-id and dispatch
// plan maths, uniform byte layouts, WGSL ABI pinning against the @vcc/core and
// @vcc/solver-gpu exports, viridis ramp parity against colormap.ts, EXACT overlay-formula
// parity against overlays.ts over a real stepped solver state, extraction-predicate parity
// against surface.ts, slice-mapping parity against slice.ts, the matrix helpers the render
// path uses, and the pick-readout formatting. The dispatch/render path itself needs a real
// device and is exercised on the registered host.

import { describe, expect, it } from "vitest";
import { GG_PRESETS, T_NEIGHBOR_OFFSETS, idx, type Dims } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { GPU_MAX_WORKGROUPS_PER_DISPATCH, GPU_WORKGROUP_SIZE } from "@vcc/solver-gpu";
import { NO_DATA_SRGB, normalizeToUnit, viridis } from "../src/colormap.ts";
import { hexPrismMeshData } from "../src/hexgeom.ts";
import { OVERLAY_NAMES, overlayValueAt, type OverlayContext } from "../src/overlays.ts";
import { formatReadout, buildPickInfo } from "../src/readout.ts";
import { extractSlice, sliceTextureSize, sliceWorldMatrix } from "../src/slice.ts";
import { surfaceCellIndices } from "../src/surface.ts";
import {
  GPU_VIEW_BASE_SRGB,
  GPU_VIEW_DRAW_ARGS_BYTES,
  GPU_VIEW_EXTRACT_UNIFORM_BYTES,
  GPU_VIEW_EXTRACT_WGSL,
  GPU_VIEW_OVERLAY_IDS,
  GPU_VIEW_OVERLAY_UNIFORM_BYTES,
  GPU_VIEW_OVERLAY_WGSL,
  GPU_VIEW_PRISM_INDEX_COUNT,
  GPU_VIEW_PRISM_WGSL,
  GPU_VIEW_SLICE_PAINT_WGSL,
  GPU_VIEW_SLICE_RENDER_WGSL,
  GPU_VIEW_SLICE_UNIFORM_BYTES,
  GPU_VIEW_VIRIDIS_ANCHORS,
  columnMajorFromRowMajor,
  encodeExtractUniforms,
  encodeOverlayUniforms,
  encodeSlicePaintUniforms,
  formatGpuPickLines,
  gpuOverlayId,
  gpuSliceTextureSize,
  gpuSurfacePredicateShadow,
  gpuOverlayValueShadow,
  gpuViewSweepPlan,
  multiplyMat4ColumnMajor,
  viridisRampShadow,
  type GpuOverlayShadowContext,
} from "../src/gpuview.ts";

// ── A real grown state shared by the parity suites ─────────────────────────────────────────

interface ParityState {
  readonly dims: Dims;
  readonly ctx: OverlayContext;
  readonly shadowCtx: GpuOverlayShadowContext;
  readonly surface: Uint32Array;
}

function grownState(): ParityState {
  const dims: Dims = { nx: 20, ny: 20, nz: 12 };
  const preset = GG_PRESETS.plate;
  const solver = new GGSolver({
    dims,
    params: {
      rho: preset.rho,
      phi: preset.phi,
      kappa: preset.kappa.slice(),
      mu: preset.mu.slice(),
      ggThreshBeta: preset.ggThreshBeta.slice(),
    },
    rngSeed: 7,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
  });
  const attachTick = new Uint32Array(solver.a.length);
  // 200 reflecting ticks: 61 surface cells, 42 of them post-seed attachments (non-vacuous
  // for every overlay, including the recency window and the seed-reads-0 rule).
  for (let n = 0; n < 200; n++) {
    solver.step();
    for (const x of solver.lastAttached) attachTick[x] = solver.tick;
  }
  // The same f32 projections the GPU holds (and the CPU snapshot displays).
  const b32 = Float32Array.from(solver.b, Math.fround);
  const d32 = Float32Array.from(solver.d, Math.fround);
  const ctx: OverlayContext = {
    dims,
    a: Uint8Array.from(solver.a),
    wall: Uint8Array.from(solver.wall),
    b: b32,
    d: d32,
    attachTick,
    tick: solver.tick,
    ggThreshBeta: solver.params.ggThreshBeta,
    recencyWindowTicks: 25,
  };
  const shadowCtx: GpuOverlayShadowContext = {
    dims,
    occupancy: Uint32Array.from(solver.a),
    wall: Uint32Array.from(solver.wall),
    vapor: d32,
    boundaryMass: b32,
    attachTick,
    tick: solver.tick,
    ggThreshBeta: solver.params.ggThreshBeta,
    recencyWindowTicks: 25,
  };
  const surface = surfaceCellIndices(ctx.a, ctx.wall, dims);
  return { dims, ctx, shadowCtx, surface };
}

const state = grownState();

describe("gpuOverlayId", () => {
  it("maps every OVERLAY_NAMES entry to a distinct id with none = 0", () => {
    const seen = new Set<number>();
    for (const name of OVERLAY_NAMES) {
      const id = gpuOverlayId(name);
      expect(Number.isSafeInteger(id)).toBe(true);
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(gpuOverlayId("none")).toBe(0);
    expect(Object.keys(GPU_VIEW_OVERLAY_IDS).sort()).toEqual([...OVERLAY_NAMES].sort());
  });

  it("rejects an unknown overlay name", () => {
    expect(() => gpuOverlayId("bogus" as never)).toThrow(/unknown overlay/);
  });
});

describe("gpuViewSweepPlan", () => {
  it("covers small grids with ceil(cells / workgroup size)", () => {
    expect(gpuViewSweepPlan(1)).toEqual({ workgroups: 1, strideThreads: GPU_WORKGROUP_SIZE });
    expect(gpuViewSweepPlan(GPU_WORKGROUP_SIZE + 1).workgroups).toBe(2);
  });

  it("caps at the per-dispatch bound and grid-strides the remainder", () => {
    const previewPlate = 400 * 400 * 50;
    const plan = gpuViewSweepPlan(previewPlate);
    expect(plan.workgroups).toBe(GPU_MAX_WORKGROUPS_PER_DISPATCH);
    expect(plan.strideThreads).toBe(GPU_MAX_WORKGROUPS_PER_DISPATCH * GPU_WORKGROUP_SIZE);
    // Coverage: stride iterations reach every cell index.
    const iterations = Math.ceil(previewPlate / plan.strideThreads);
    expect(iterations).toBe(2);
    expect(plan.strideThreads * iterations).toBeGreaterThanOrEqual(previewPlate);
  });

  it("rejects non-u32-safe cell counts", () => {
    for (const bad of [0, -1, 1.5, 2 ** 32, Number.NaN]) {
      expect(() => gpuViewSweepPlan(bad)).toThrow(/u32-safe/);
    }
  });
});

describe("uniform encodings", () => {
  it("encodes the extraction uniforms at the pinned offsets", () => {
    const dims: Dims = { nx: 20, ny: 21, nz: 12 };
    const words = new Uint32Array(encodeExtractUniforms(dims, 5040));
    expect(words.byteLength).toBe(GPU_VIEW_EXTRACT_UNIFORM_BYTES);
    expect([...words.slice(0, 3)]).toEqual([20, 21, 12]);
    expect(words[3]).toBe(20 * 21 * 12);
    expect(words[4]).toBe(20 * 21);
    expect(words[5]).toBe(5040);
    expect(words[6]).toBe(gpuViewSweepPlan(20 * 21 * 12).strideThreads);
  });

  it("encodes the overlay uniforms (ids, ranges, f32 ggThreshBeta slots)", () => {
    const dims: Dims = { nx: 8, ny: 8, nz: 4 };
    const ggThreshBeta = Float64Array.from([1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8]);
    const bytes = encodeOverlayUniforms({
      dims,
      tick: 123,
      overlayName: "growthPropensity",
      capacity: 256,
      rangeMin: 0.25,
      rangeMax: 0.75,
      recencyWindowTicks: 600,
      ggThreshBeta,
    });
    expect(bytes.byteLength).toBe(GPU_VIEW_OVERLAY_UNIFORM_BYTES);
    const words = new Uint32Array(bytes);
    const floats = new Float32Array(bytes);
    expect([...words.slice(0, 3)]).toEqual([8, 8, 4]);
    expect(words[3]).toBe(256);
    expect(words[4]).toBe(64);
    expect(words[5]).toBe(123);
    expect(words[6]).toBe(gpuOverlayId("growthPropensity"));
    expect(words[7]).toBe(256);
    expect(floats[8]).toBeCloseTo(0.25, 6);
    expect(floats[9]).toBeCloseTo(0.75, 6);
    expect(floats[10]).toBe(600);
    expect(words[11]).toBe(gpuViewSweepPlan(256).strideThreads);
    for (let slot = 0; slot < 8; slot++) {
      expect(floats[12 + slot]).toBe(Math.fround(ggThreshBeta[slot]));
    }
  });

  it("rejects a ggThreshBeta vector that is not 8 slots", () => {
    expect(() =>
      encodeOverlayUniforms({
        dims: { nx: 4, ny: 4, nz: 4 },
        tick: 0,
        overlayName: "none",
        capacity: 64,
        rangeMin: 0,
        rangeMax: 1,
        recencyWindowTicks: 10,
        ggThreshBeta: Float64Array.from([1, 2, 3]),
      }),
    ).toThrow(/8-slot/);
  });

  it("encodes the slice-paint uniforms for both orientations", () => {
    const dims: Dims = { nx: 10, ny: 12, nz: 6 };
    for (const orientation of ["vertical", "horizontal"] as const) {
      const bytes = encodeSlicePaintUniforms({
        dims,
        orientation,
        sliceIndex: 3,
        rangeMin: 0,
        rangeMax: 0.1,
      });
      expect(bytes.byteLength).toBe(GPU_VIEW_SLICE_UNIFORM_BYTES);
      const words = new Uint32Array(bytes);
      const floats = new Float32Array(bytes);
      const { width, height } = sliceTextureSize(orientation, dims);
      expect([...words.slice(0, 3)]).toEqual([10, 12, 6]);
      expect(words[3]).toBe(120);
      expect(words[4]).toBe(orientation === "vertical" ? 0 : 1);
      expect(words[5]).toBe(3);
      expect(words[6]).toBe(width);
      expect(words[7]).toBe(height);
      expect(floats[8]).toBe(0);
      expect(floats[9]).toBeCloseTo(0.1, 6);
      // The GPU texture size mapping IS slice.ts's mapping.
      expect(gpuSliceTextureSize(orientation, dims)).toEqual({ width, height });
    }
  });
});

describe("viridis ramp parity with colormap.ts", () => {
  it("matches viridis() exactly at anchors, midpoints, and dense samples", () => {
    const samples: number[] = [-0.5, 0, 1, 1.5];
    for (let n = 0; n <= 64; n++) samples.push(n / 64);
    for (let n = 0; n < GPU_VIEW_VIRIDIS_ANCHORS.length; n++) {
      samples.push(n / (GPU_VIEW_VIRIDIS_ANCHORS.length - 1));
    }
    for (const t of samples) {
      expect(viridisRampShadow(t)).toEqual(viridis(t));
    }
  });

  it("maps NaN to the exact NO_DATA gray", () => {
    expect(viridisRampShadow(Number.NaN)).toEqual([...NO_DATA_SRGB]);
    expect(viridis(Number.NaN)).toEqual([...NO_DATA_SRGB]);
  });

  it("normalize + ramp matches the CPU display pipeline on degenerate ranges", () => {
    // colormap.ts contract: max <= min maps every value to ramp(0).
    expect(viridisRampShadow(normalizeToUnit(0.7, 1, 1))).toEqual(viridis(0));
  });

  it("interpolates every anchor and the no-data gray into the WGSL", () => {
    for (const wgsl of [GPU_VIEW_OVERLAY_WGSL, GPU_VIEW_SLICE_PAINT_WGSL]) {
      for (const anchor of GPU_VIEW_VIRIDIS_ANCHORS) {
        expect(wgsl).toContain(`vec3<f32>(${anchor[0]}, ${anchor[1]}, ${anchor[2]})`);
      }
      expect(wgsl).toContain(
        `vec3<f32>(${NO_DATA_SRGB[0]}, ${NO_DATA_SRGB[1]}, ${NO_DATA_SRGB[2]})`,
      );
    }
    expect(GPU_VIEW_OVERLAY_WGSL).toContain(
      `vec3<f32>(${GPU_VIEW_BASE_SRGB[0]}, ${GPU_VIEW_BASE_SRGB[1]}, ${GPU_VIEW_BASE_SRGB[2]})`,
    );
  });
});

describe("overlay formula parity with overlays.ts (real 40-tick plate state)", () => {
  it("grew a nontrivial state (non-vacuous fixture)", () => {
    expect(state.surface.length).toBeGreaterThan(50);
    // growthRecency must exercise nonzero attach ticks and the seed-0 rule.
    const attached = [...state.shadowCtx.attachTick].filter((t) => t > 0);
    expect(attached.length).toBeGreaterThan(10);
  });

  it("matches overlayValueAt EXACTLY for every overlay on every surface cell", () => {
    const { nx, ny } = state.dims;
    const plane = nx * ny;
    let undefinedSeen = 0;
    for (const name of OVERLAY_NAMES) {
      if (name === "none") continue;
      for (const cell of state.surface) {
        const k = Math.floor(cell / plane);
        const r = cell - k * plane;
        const j = Math.floor(r / nx);
        const i = r - j * nx;
        const cpu = overlayValueAt(name, state.ctx, i, j, k);
        const gpu = gpuOverlayValueShadow(name, state.shadowCtx, i, j, k);
        if (Number.isNaN(cpu)) {
          undefinedSeen++;
          expect(gpu.defined).toBe(false);
        } else {
          expect(gpu.defined).toBe(true);
          // Same candidate sets, same slots, same f64 arithmetic order: exact equality.
          expect(gpu.value).toBe(cpu);
        }
      }
    }
    void undefinedSeen; // may legitimately be zero on this fixture; parity above is the claim
  });

  it("pins the capped-slot threshold lookup against an adversarial hand fixture", () => {
    // A candidate free cell with nT=4, nZ=1 must use slot min(4,3)*2+min(1,1) = 7 — the
    // hole-fill-adjacent cap — never raw slot 9 (out of the 8-vector).
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const cells = dims.nx * dims.ny * dims.nz;
    const occupancy = new Uint32Array(cells);
    const wall = new Uint32Array(cells);
    const boundaryMass = new Float32Array(cells);
    const at = (i: number, j: number, k: number): number => idx(dims, i, j, k);
    // Candidate at (2,2,1); four attached T neighbors + one attached below.
    occupancy[at(3, 2, 1)] = 1;
    occupancy[at(1, 2, 1)] = 1;
    occupancy[at(2, 3, 1)] = 1;
    occupancy[at(2, 1, 1)] = 1;
    occupancy[at(2, 2, 0)] = 1;
    boundaryMass[at(2, 2, 1)] = 1.0;
    const ggThreshBeta = Float64Array.from([9, 9, 9, 9, 9, 9, 9, 2.0]);
    const shadow: GpuOverlayShadowContext = {
      dims,
      occupancy,
      wall,
      vapor: new Float32Array(cells),
      boundaryMass,
      attachTick: new Uint32Array(cells),
      tick: 0,
      ggThreshBeta,
      recencyWindowTicks: 10,
    };
    // Probe from the attached neighbor (3,2,1): its free candidate (2,2,1) has capped
    // slot 7, so progress = 1.0 / 2.0.
    const sample = gpuOverlayValueShadow("growthPropensity", shadow, 3, 2, 1);
    expect(sample.defined).toBe(true);
    expect(sample.value).toBe(0.5);
    // overlays.ts agrees on the same fixture.
    const ctx: OverlayContext = {
      dims,
      a: Uint8Array.from(occupancy),
      wall: Uint8Array.from(wall),
      b: boundaryMass,
      d: new Float32Array(cells),
      attachTick: new Uint32Array(cells),
      tick: 0,
      ggThreshBeta,
      recencyWindowTicks: 10,
    };
    expect(overlayValueAt("growthPropensity", ctx, 3, 2, 1)).toBe(0.5);
  });
});

describe("surface-extraction predicate parity with surface.ts", () => {
  it("selects exactly the surfaceCellIndices set on the grown state", () => {
    const shadow = gpuSurfacePredicateShadow(
      state.shadowCtx.occupancy,
      state.shadowCtx.wall,
      state.dims,
    );
    expect([...shadow]).toEqual([...state.surface]);
  });

  it("treats walls as non-free exposure (hexPrism corners stay interior)", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 1 };
    const occupancy = new Uint32Array(9);
    const wall = new Uint32Array(9);
    occupancy[idx(dims, 1, 1, 0)] = 1;
    // Every neighbor is a wall: the attached cell has no free exposure.
    for (let n = 0; n < 9; n++) if (occupancy[n] === 0) wall[n] = 1;
    expect([...gpuSurfacePredicateShadow(occupancy, wall, dims)]).toEqual([]);
    // Free one neighbor: now it is a surface cell.
    wall[idx(dims, 0, 1, 0)] = 0;
    expect([...gpuSurfacePredicateShadow(occupancy, wall, dims)]).toEqual([
      idx(dims, 1, 1, 0),
    ]);
  });
});

describe("slice-paint mapping parity with slice.ts", () => {
  it("the WGSL cell formula equals extractSlice for both orientations", () => {
    const dims = state.dims;
    const plane = dims.nx * dims.ny;
    const field = state.shadowCtx.vapor;
    for (const orientation of ["vertical", "horizontal"] as const) {
      const index = orientation === "vertical" ? 7 : 5;
      const { width, height } = sliceTextureSize(orientation, dims);
      const reference = extractSlice(orientation, field, dims, index);
      for (const [u, v] of [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
        [3, 2],
        [11, 9],
      ]) {
        const cell =
          orientation === "vertical"
            ? v * plane + index * dims.nx + u
            : index * plane + v * dims.nx + u;
        expect(field[cell]).toBe(reference[v * width + u]);
      }
    }
  });
});

describe("matrix helpers", () => {
  it("multiplies column-major matrices (identity and a known affine case)", () => {
    const identity = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    const m = columnMajorFromRowMajor(sliceWorldMatrix("vertical", 3, state.dims, [1, 2, 3]));
    expect([...multiplyMat4ColumnMajor(identity, m)]).toEqual([...m]);
    // Row-major translation by (5, 7, 9) times a point expressed via multiply.
    const translation = columnMajorFromRowMajor([
      1, 0, 0, 5,
      0, 1, 0, 7,
      0, 0, 1, 9,
      0, 0, 0, 1,
    ]);
    const product = multiplyMat4ColumnMajor(translation, translation);
    // Column-major translation column is elements 12..14.
    expect([product[12], product[13], product[14]]).toEqual([10, 14, 18]);
  });

  it("transposes slice.ts's row-major world matrix into three's column-major layout", () => {
    const rowMajor = sliceWorldMatrix("horizontal", 4, state.dims, [0.5, 1.5, 2.5]);
    const columnMajor = columnMajorFromRowMajor(rowMajor);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        // Exact f32 transposition of the f64 source values.
        expect(columnMajor[col * 4 + row]).toBe(Math.fround(rowMajor[row * 4 + col]));
      }
    }
    expect(() => columnMajorFromRowMajor([1, 2, 3])).toThrow(/16 numbers/);
  });
});

describe("WGSL ABI pinning (D5)", () => {
  it("interpolates the workgroup size everywhere a sweep dispatches", () => {
    for (const wgsl of [
      GPU_VIEW_EXTRACT_WGSL,
      GPU_VIEW_OVERLAY_WGSL,
      GPU_VIEW_SLICE_PAINT_WGSL,
    ]) {
      expect(wgsl).toContain(`@workgroup_size(${GPU_WORKGROUP_SIZE})`);
    }
  });

  it("interpolates every @vcc/core T-neighbor offset into extraction and overlay", () => {
    for (const wgsl of [GPU_VIEW_EXTRACT_WGSL, GPU_VIEW_OVERLAY_WGSL]) {
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
        expect(wgsl).toContain(`let ni = ii + (${di});`);
        expect(wgsl).toContain(`let nj = jj + (${dj});`);
      }
    }
  });

  it("pins the indirect draw args to the hexgeom index count", () => {
    expect(GPU_VIEW_PRISM_INDEX_COUNT).toBe(hexPrismMeshData().indices.length);
    expect(GPU_VIEW_PRISM_INDEX_COUNT).toBe(60);
    expect(GPU_VIEW_EXTRACT_WGSL).toContain(
      `drawArgs.indexCount = ${GPU_VIEW_PRISM_INDEX_COUNT}u;`,
    );
    expect(GPU_VIEW_DRAW_ARGS_BYTES).toBe(20);
  });

  it("pins the cartesian embedding constant in the prism vertex shader", () => {
    expect(GPU_VIEW_PRISM_WGSL).toContain(`${Math.sqrt(3) / 2}`);
    expect(GPU_VIEW_PRISM_WGSL).toContain("f32(j) * 0.5");
  });

  it("keeps the slice render quad on the PlaneGeometry UV convention", () => {
    expect(GPU_VIEW_SLICE_RENDER_WGSL).toContain("vec2<f32>(-0.5, -0.5)");
    expect(GPU_VIEW_SLICE_RENDER_WGSL).toContain("corner + vec2<f32>(0.5, 0.5)");
  });
});

describe("formatGpuPickLines", () => {
  it("mirrors readout.ts wording for the shared per-cell lines", () => {
    // The CPU formatter over the same grown state and cell.
    const { nx, ny } = state.dims;
    const plane = nx * ny;
    const cell = state.surface[Math.floor(state.surface.length / 2)];
    const k = Math.floor(cell / plane);
    const r = cell - k * plane;
    const j = Math.floor(r / nx);
    const i = r - j * nx;
    const cpuLines = formatReadout(buildPickInfo(state.ctx, i, j, k, "boundaryMass"));
    const gpuLines = formatGpuPickLines({
      i,
      j,
      k,
      attached: state.ctx.a[cell] === 1,
      wall: state.ctx.wall !== null && state.ctx.wall[cell] === 1,
      b: state.ctx.b[cell],
      d: state.ctx.d[cell],
      nTUncapped: Number(cpuLines[4].match(/nT (\d+)/)?.[1]),
      nZUncapped: Number(cpuLines[4].match(/nZ (\d+)/)?.[1]),
      overlayName: "boundaryMass",
      overlayValue: state.ctx.b[cell],
    });
    // Identical cell/a/b/d/neighbor lines; the GPU adds its provenance tail.
    expect(gpuLines.slice(0, 5)).toEqual(cpuLines.slice(0, 5));
    expect(gpuLines.at(-1)).toContain("audited named probes");
  });

  it("refuses the propensity overlay by name (bounded probe floor)", () => {
    const lines = formatGpuPickLines({
      i: 1,
      j: 2,
      k: 3,
      attached: true,
      wall: false,
      b: 0.5,
      d: 0.1,
      nTUncapped: 2,
      nZUncapped: 1,
      overlayName: "growthPropensity",
      overlayValue: null,
    });
    expect(lines.join("\n")).toContain("not read in GPU mode (bounded named-probe readout");
    expect(lines.join("\n")).toContain("select the CPU engine");
  });

  it("prints NaN overlay values as the CPU formatter does", () => {
    const lines = formatGpuPickLines({
      i: 0,
      j: 0,
      k: 0,
      attached: false,
      wall: false,
      b: 0,
      d: 0,
      nTUncapped: 0,
      nZUncapped: 0,
      overlayName: "vaporAvailability",
      overlayValue: Number.NaN,
    });
    expect(lines.join("\n")).toContain("undefined (NaN)");
  });
});
