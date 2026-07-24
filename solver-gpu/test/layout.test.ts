import { coordsOf, hashCounter, idx } from "@vcc/core";
import { describe, expect, test } from "vitest";
import {
  coordinateHash,
  createGpuBufferPlan,
  createGpuGridLayout,
  encodeGpuGridUniforms,
  GPU_CELL_BYTES_CEILING,
  GPU_COORDINATE_HASH_WGSL,
  GPU_COPY_WORDS_WGSL,
  GPU_COUNTER_PRNG_WGSL,
  GPU_GG_BYTES_PER_CELL,
  GPU_GRID_UNIFORM_BYTES,
  GPU_GRID_UNIFORM_OFFSETS,
  GPU_LK_BYTES_PER_CELL,
  gpuCoords,
  gpuIndex,
  planGpuDispatchRanges,
  validateGpuAllocation,
} from "../src/index.ts";

const NONCUBIC_DIMS = { nx: 17, ny: 19, nz: 11 } as const;

describe("GPU grid ABI", () => {
  test("matches the core flat-array convention on every non-cubic fixture cell", () => {
    const layout = createGpuGridLayout(NONCUBIC_DIMS);
    expect(layout.plane).toBe(323);
    expect(layout.cellCount).toBe(3_553);

    for (let index = 0; index < layout.cellCount; index++) {
      const coordinates = gpuCoords(layout, index);
      expect(coordinates).toEqual(coordsOf(NONCUBIC_DIMS, index));
      expect(gpuIndex(layout, ...coordinates)).toBe(index);
      expect(idx(NONCUBIC_DIMS, ...coordinates)).toBe(index);
    }
  });

  test("the registered axis-swap mutation fails on the non-cubic fixture", () => {
    const layout = createGpuGridLayout(NONCUBIC_DIMS);
    let mismatchCount = 0;
    for (let index = 0; index < layout.cellCount; index++) {
      const [i, j, k] = gpuCoords(layout, index);
      const expected = coordinateHash(i, j, k);
      const swapped = coordinateHash(i, k, j);
      if (expected !== swapped) mismatchCount++;
    }
    expect(mismatchCount).toBeGreaterThan(0);
  });

  test("encodes the frozen 48-byte uniform layout", () => {
    const layout = createGpuGridLayout(NONCUBIC_DIMS);
    const buffer = encodeGpuGridUniforms({
      layout,
      baseCell: 256,
      generation: 7,
      rngSeed: 0x1357_9bdf,
      tick: 99,
      streamId: 3,
    });
    const words = new Uint32Array(buffer);
    expect(buffer.byteLength).toBe(GPU_GRID_UNIFORM_BYTES);
    expect(words).toEqual(
      new Uint32Array([
        17,
        19,
        11,
        3_553,
        323,
        256,
        7,
        0x1357_9bdf,
        99,
        3,
        0,
        0,
      ]),
    );
    expect(GPU_GRID_UNIFORM_OFFSETS).toEqual({
      dims: 0,
      cellCount: 12,
      plane: 16,
      baseCell: 20,
      generation: 24,
      rngSeed: 28,
      tick: 32,
      streamId: 36,
      reserved0: 40,
      reserved1: 44,
    });
  });

  test("rejects invalid coordinates and products outside WGSL u32", () => {
    const layout = createGpuGridLayout(NONCUBIC_DIMS);
    expect(() => gpuIndex(layout, 17, 0, 0)).toThrow(/out of range/);
    expect(() => gpuCoords(layout, layout.cellCount)).toThrow(/out of range/);
    expect(() =>
      createGpuGridLayout({ nx: 65_536, ny: 65_536, nz: 1 }),
    ).toThrow(/fit exact host integers and WGSL u32/);
    expect(() =>
      encodeGpuGridUniforms({
        layout,
        baseCell: layout.cellCount,
        generation: 0,
        rngSeed: 0,
        tick: 0,
        streamId: 0,
      }),
    ).toThrow(/baseCell/);
  });
});

describe("GPU memory and dispatch planning", () => {
  test("keeps GG and LK cell storage within the frozen 64-byte ceiling", () => {
    const gg = createGpuBufferPlan(NONCUBIC_DIMS, "gg");
    const lk = createGpuBufferPlan(NONCUBIC_DIMS, "lk");
    expect(gg.bytesPerCell).toBe(GPU_GG_BYTES_PER_CELL);
    expect(lk.bytesPerCell).toBe(GPU_LK_BYTES_PER_CELL);
    expect(GPU_GG_BYTES_PER_CELL).toBe(48);
    expect(GPU_LK_BYTES_PER_CELL).toBe(60);
    expect(Math.max(gg.bytesPerCell, lk.bytesPerCell)).toBeLessThanOrEqual(
      GPU_CELL_BYTES_CEILING,
    );
    expect(gg.totalCellBytes).toBe(gg.layout.cellCount * 48);
    expect(lk.totalCellBytes).toBe(lk.layout.cellCount * 60);
  });

  test("reports unsupported allocations instead of silently lowering a budget", () => {
    const bake = createGpuBufferPlan(
      { nx: 1_600, ny: 1_600, nz: 52 },
      "lk",
    );
    const result = validateGpuAllocation(bake, {
      maxBufferSize: 256 * 1024 * 1024,
      maxStorageBufferBindingSize: 64 * 1024 * 1024,
    });
    expect(result.supported).toBe(false);
    expect(result.reasons.some((reason) => reason.includes("lkFill"))).toBe(true);
    expect(result.totalCellBytes).toBe(7_987_200_000);
  });

  test("splits large grids into bounded, contiguous dispatch ranges", () => {
    const count = 8_192_123;
    const ranges = planGpuDispatchRanges(count);
    expect(ranges).toHaveLength(2);
    expect(ranges[0]).toEqual({
      baseCell: 0,
      cellCount: 4_194_304,
      workgroupCount: 16_384,
    });
    expect(ranges[1]).toEqual({
      baseCell: 4_194_304,
      cellCount: 3_997_819,
      workgroupCount: 15_617,
    });
    expect(
      ranges.reduce((sum, range) => sum + range.cellCount, 0),
    ).toBe(count);
    expect(() => planGpuDispatchRanges(count, 16_385)).toThrow(/\[1,16384\]/);
  });

  test("rejects forged operator tags, layouts, totals, and schemas", () => {
    expect(() =>
      createGpuBufferPlan(NONCUBIC_DIMS, "unexpected-operator" as never),
    ).toThrow(/unsupported GPU operator/);

    const canonical = createGpuBufferPlan(NONCUBIC_DIMS, "gg");
    expect(() =>
      validateGpuAllocation(
        {
          ...canonical,
          layout: { ...canonical.layout, plane: canonical.layout.plane + 1 },
        },
        {
          maxBufferSize: 256 * 1024 * 1024,
          maxStorageBufferBindingSize: 64 * 1024 * 1024,
        },
      ),
    ).toThrow(/layout disagrees/);
    expect(() =>
      validateGpuAllocation(
        { ...canonical, totalCellBytes: canonical.totalCellBytes - 4 },
        {
          maxBufferSize: 256 * 1024 * 1024,
          maxStorageBufferBindingSize: 64 * 1024 * 1024,
        },
      ),
    ).toThrow(/totals disagree/);
    expect(() =>
      validateGpuAllocation(
        { ...canonical, buffers: canonical.buffers.slice(0, 2) },
        {
          maxBufferSize: 256 * 1024 * 1024,
          maxStorageBufferBindingSize: 64 * 1024 * 1024,
        },
      ),
    ).toThrow(/wrong canonical buffer count/);
    expect(() =>
      validateGpuAllocation(
        {
          ...canonical,
          buffers: canonical.buffers.map((buffer, index) =>
            index === 1 ? { ...buffer, name: "occupancy" } : buffer,
          ),
        },
        {
          maxBufferSize: 256 * 1024 * 1024,
          maxStorageBufferBindingSize: 64 * 1024 * 1024,
        },
      ),
    ).toThrow(/schema mismatch/);
  });
});

describe("WP1 transport-only shaders", () => {
  test("carry only coordinate, word-copy, and counter-PRNG entry points", () => {
    expect(GPU_COORDINATE_HASH_WGSL).toContain("fn coordinateHash");
    expect(GPU_COPY_WORDS_WGSL).toContain("fn copyWords");
    expect(GPU_COUNTER_PRNG_WGSL).toContain("fn counterPrng");
    for (const shader of [
      GPU_COORDINATE_HASH_WGSL,
      GPU_COPY_WORDS_WGSL,
      GPU_COUNTER_PRNG_WGSL,
    ]) {
      expect(shader).toContain("@workgroup_size(256)");
      expect(shader).toContain("uniforms.baseCell + invocation.x");
      expect(shader).not.toContain("diffusion");
    }
  });

  test("uses the same known counter-hash vectors as core", () => {
    expect(hashCounter(0, 0, 0, 0)).toBe(3_644_920_907);
    expect(hashCounter(42, 123_456, 9_999, 1)).toBe(3_970_711_487);
    expect(hashCounter(1, 2, 3, 4)).toBe(3_568_513_587);
  });
});
