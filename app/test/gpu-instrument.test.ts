// Node-side tests for the WP6 S3 shell-mean instrument (frozen design D5): the dispatch
// plan, the 8-byte result decoding, the WGSL's ABI pinning against the @vcc/solver-gpu
// exports, and — most load-bearing — that the instrument's masking rule selects EXACTLY
// the cells the float64 oracle's farFieldMean averages, verified by a JS shadow of the
// WGSL condition over the real projected input arrays. The dispatch/readback path needs a
// real device and is exercised on the registered host.

import { describe, expect, it } from "vitest";
import { GGSolver } from "@vcc/solver-cpu";
import { GPU_TOPOLOGY_FAR_FIELD, GPU_WORKGROUP_SIZE } from "@vcc/solver-gpu";
import {
  SHELL_MEAN_MAX_PARTIAL_WORKGROUPS,
  SHELL_MEAN_RESULT_BYTES,
  SHELL_MEAN_WGSL,
  decodeShellMeanResult,
  shellMeanDispatchPlan,
} from "../src/gpu-instrument.ts";
import { gpuInputFromConfig } from "../src/gpuengine.ts";
import { ggParamsForInit, validateInitConfig } from "../src/protocol.ts";

describe("shellMeanDispatchPlan", () => {
  it("covers small grids with ceil(cells / workgroup size)", () => {
    expect(shellMeanDispatchPlan(1).workgroups).toBe(1);
    expect(shellMeanDispatchPlan(GPU_WORKGROUP_SIZE).workgroups).toBe(1);
    expect(shellMeanDispatchPlan(GPU_WORKGROUP_SIZE + 1).workgroups).toBe(2);
    expect(shellMeanDispatchPlan(5 * GPU_WORKGROUP_SIZE - 1).workgroups).toBe(5);
  });

  it("caps at the partial count one finalize workgroup can fold", () => {
    expect(shellMeanDispatchPlan(GPU_WORKGROUP_SIZE * SHELL_MEAN_MAX_PARTIAL_WORKGROUPS).workgroups).toBe(
      SHELL_MEAN_MAX_PARTIAL_WORKGROUPS,
    );
    // Preview-plate scale (8M cells) stays grid-strided at the cap, never over it.
    expect(shellMeanDispatchPlan(400 * 400 * 50).workgroups).toBe(
      SHELL_MEAN_MAX_PARTIAL_WORKGROUPS,
    );
    expect(SHELL_MEAN_MAX_PARTIAL_WORKGROUPS).toBe(GPU_WORKGROUP_SIZE);
  });

  it("rejects non-u32-safe cell counts", () => {
    for (const bad of [0, -1, 1.5, 2 ** 32, Number.NaN]) {
      expect(() => shellMeanDispatchPlan(bad)).toThrow(/u32-safe/);
    }
  });
});

describe("decodeShellMeanResult", () => {
  function encoded(sum: number, count: number): ArrayBuffer {
    const bytes = new ArrayBuffer(SHELL_MEAN_RESULT_BYTES);
    const view = new DataView(bytes);
    view.setFloat32(0, sum, true);
    view.setUint32(4, count, true);
    return bytes;
  }

  it("decodes {sum: f32, count: u32} little-endian and divides", () => {
    const result = decodeShellMeanResult(encoded(1.5, 3));
    expect(result.sum).toBe(1.5);
    expect(result.count).toBe(3);
    expect(result.mean).toBe(0.5);
  });

  it("keeps the f32 bit pattern (no double rounding surprises)", () => {
    const value = Math.fround(0.1234567);
    expect(decodeShellMeanResult(encoded(value, 1)).sum).toBe(value);
  });

  it("reports an empty shell as NaN mean — the CPU oracle's exact contract", () => {
    const result = decodeShellMeanResult(encoded(0, 0));
    expect(result.count).toBe(0);
    expect(result.mean).toBeNaN();
  });

  it("rejects a result of the wrong byte length", () => {
    expect(() => decodeShellMeanResult(new ArrayBuffer(4))).toThrow(/exactly 8 bytes/);
    expect(() => decodeShellMeanResult(new ArrayBuffer(12))).toThrow(/exactly 8 bytes/);
  });
});

describe("WGSL ABI pinning against the @vcc/solver-gpu exports (D5)", () => {
  it("interpolates the exported workgroup size everywhere it matters", () => {
    expect(GPU_WORKGROUP_SIZE).toBe(256); // frozen submission ABI
    expect(SHELL_MEAN_WGSL).toContain(`@workgroup_size(${GPU_WORKGROUP_SIZE})`);
    expect(SHELL_MEAN_WGSL).toContain(`array<f32, ${GPU_WORKGROUP_SIZE}>`);
    expect(SHELL_MEAN_WGSL).toContain(`array<u32, ${GPU_WORKGROUP_SIZE}>`);
    expect(SHELL_MEAN_WGSL).toContain(`var<workgroup>`);
    // The tree reduction starts at half the workgroup.
    expect(SHELL_MEAN_WGSL).toContain(`var span: u32 = ${GPU_WORKGROUP_SIZE / 2}u;`);
  });

  it("masks with the exported far-field topology bit, not a local literal", () => {
    expect(GPU_TOPOLOGY_FAR_FIELD).toBe(1); // frozen topology ABI
    expect(SHELL_MEAN_WGSL).toContain(`& ${GPU_TOPOLOGY_FAR_FIELD}u`);
    expect(SHELL_MEAN_WGSL).toContain("(occupancy[index] == 0u)");
  });

  it("declares both entry points and the 8-byte result struct", () => {
    expect(SHELL_MEAN_WGSL).toContain("fn shellPartials(");
    expect(SHELL_MEAN_WGSL).toContain("fn shellFinalize(");
    expect(SHELL_MEAN_WGSL).toContain("sum: f32");
    expect(SHELL_MEAN_WGSL).toContain("count: u32");
    expect(SHELL_MEAN_RESULT_BYTES).toBe(8);
  });
});

describe("masking semantics versus the float64 oracle", () => {
  const config = validateInitConfig({
    preset: "plate",
    dims: { nx: 20, ny: 20, nz: 14 },
    seed: 11,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    rhoOverride: null,
    ggThreshBeta01Override: null,
    schedule: null,
  });
  const seedState = gpuInputFromConfig(config);
  const oracle = new GGSolver({
    dims: config.dims,
    params: ggParamsForInit(config),
    rngSeed: config.seed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    farField: config.farField,
  });

  /** JS shadow of the WGSL accumulation condition over the projected input arrays. */
  function shadowShellMean(
    vapor: Float32Array,
    occupancy: Uint32Array,
    topology: Uint32Array,
  ): { sum: number; count: number; mean: number } {
    let sum = 0;
    let count = 0;
    for (let index = 0; index < vapor.length; index++) {
      if ((topology[index] & GPU_TOPOLOGY_FAR_FIELD) !== 0 && occupancy[index] === 0) {
        sum += vapor[index];
        count++;
      }
    }
    return { sum, count, mean: count === 0 ? Number.NaN : sum / count };
  }

  it("selects exactly the oracle's free far-field shell cells", () => {
    const shadow = shadowShellMean(
      seedState.input.initialVapor,
      seedState.input.occupancy,
      seedState.input.topology,
    );
    // The seed sits at the center, so at tick 0 every shell cell is free.
    expect(shadow.count).toBe(oracle.farFieldCells.length);
    expect(Math.abs(shadow.mean - oracle.farFieldMean())).toBeLessThan(1e-6);
  });

  it("drops a shell cell from the average the moment it is occupied", () => {
    const occupancy = Uint32Array.from(seedState.input.occupancy);
    const shellCell = oracle.farFieldCells[0];
    occupancy[shellCell] = 1;
    const shadow = shadowShellMean(
      seedState.input.initialVapor,
      occupancy,
      seedState.input.topology,
    );
    expect(shadow.count).toBe(oracle.farFieldCells.length - 1);
  });

  it("never counts wall cells (walls carry no far-field bit)", () => {
    const { wall, topology } = seedState.input;
    let wallCells = 0;
    for (let index = 0; index < wall.length; index++) {
      if (wall[index] === 0) continue;
      wallCells++;
      expect(topology[index] & GPU_TOPOLOGY_FAR_FIELD).toBe(0);
    }
    expect(wallCells).toBeGreaterThan(0); // hexPrism really has walls
  });
});
