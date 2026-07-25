/// <reference types="@webgpu/types" />
// GPU instrument passes (WP6 frozen design D5, slice S3): display/instrument WGSL lives in
// app/src/, runs over the SOLVER's buffers through its exported accessors, and changes
// nothing in solver-gpu/. S3 ships exactly one instrument — the far-field shell-mean
// reduction that feeds the stop rule and the compact GpuSnapshot — because the stop rule is
// the only S3 consumer; surface extraction, overlay coloring, and the slice pass are S4.
//
// The reduction computes mean(vapor[x]) over cells with the far-field topology bit set and
// occupancy 0 — the exact masking GGSolver.farFieldMean applies to its farFieldCells list
// (free shell cells only; walls never carry the far-field bit). Two dispatches: a
// grid-strided workgroup pass into per-workgroup partials, then one workgroup folding the
// partials into an 8-byte {sum, count} result that is read back through the production
// audit as a compact metric. Arithmetic is float32 hierarchical summation: an instrument
// reading (computed state, unvalidated), not the float64 oracle's Neumaier mean.
//
// ABI pinning (D5): the WGSL below interpolates GPU_TOPOLOGY_FAR_FIELD and
// GPU_WORKGROUP_SIZE from @vcc/solver-gpu instead of copying literals, and the unit tests
// assert the interpolated text against those exports, so an upstream ABI change breaks the
// build/tests here rather than silently mis-masking the instrument.

import {
  GPU_TOPOLOGY_FAR_FIELD,
  GPU_WORKGROUP_SIZE,
  readGpuBuffer,
  type GpuReadbackAudit,
  type GpuSubmissionController,
} from "@vcc/solver-gpu";

/** Cap on pass-1 workgroups; pass 2 folds them in ONE workgroup, so it must be ≤ size. */
export const SHELL_MEAN_MAX_PARTIAL_WORKGROUPS = GPU_WORKGROUP_SIZE;

/** The {sum: f32, count: u32} result — the instrument's whole readback per measurement. */
export const SHELL_MEAN_RESULT_BYTES = 8;

const GPU_COMPUTE_STAGE = 0x0004;
const USAGE_COPY_SRC = 0x0004;
const USAGE_COPY_DST = 0x0008;
const USAGE_UNIFORM = 0x0040;
const USAGE_STORAGE = 0x0080;

export interface ShellMeanDispatchPlan {
  /** Pass-1 workgroup count: ceil(cellCount / workgroup size), capped so pass 2 fits. */
  readonly workgroups: number;
}

export function shellMeanDispatchPlan(cellCountValue: number): ShellMeanDispatchPlan {
  if (
    !Number.isSafeInteger(cellCountValue) ||
    cellCountValue <= 0 ||
    cellCountValue > 0xffff_ffff
  ) {
    throw new Error("shell-mean cellCount must be a positive u32-safe integer");
  }
  return {
    workgroups: Math.min(
      SHELL_MEAN_MAX_PARTIAL_WORKGROUPS,
      Math.ceil(cellCountValue / GPU_WORKGROUP_SIZE),
    ),
  };
}

/**
 * The instrument WGSL. Both entry points share one bind group layout; module-scope
 * workgroup arrays carry the tree reduction. The far-field mask constant and the workgroup
 * size are interpolated from the solver-gpu exports (D5 pinning).
 */
export const SHELL_MEAN_WGSL = /* wgsl */ `
struct ShellMeanUniforms {
  cellCount: u32,
  workgroupCount: u32,
  reserved0: u32,
  reserved1: u32,
}

struct ShellMeanResult {
  sum: f32,
  count: u32,
}

@group(0) @binding(0) var<uniform> uniforms: ShellMeanUniforms;
@group(0) @binding(1) var<storage, read> vapor: array<f32>;
@group(0) @binding(2) var<storage, read> occupancy: array<u32>;
@group(0) @binding(3) var<storage, read> topology: array<u32>;
@group(0) @binding(4) var<storage, read_write> partialSums: array<f32>;
@group(0) @binding(5) var<storage, read_write> partialCounts: array<u32>;
@group(0) @binding(6) var<storage, read_write> result: ShellMeanResult;

var<workgroup> laneSums: array<f32, ${GPU_WORKGROUP_SIZE}>;
var<workgroup> laneCounts: array<u32, ${GPU_WORKGROUP_SIZE}>;

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn shellPartials(
  @builtin(workgroup_id) groupId: vec3<u32>,
  @builtin(local_invocation_index) lane: u32,
) {
  var sum: f32 = 0.0;
  var count: u32 = 0u;
  var index: u32 = (groupId.x * ${GPU_WORKGROUP_SIZE}u) + lane;
  let stride: u32 = uniforms.workgroupCount * ${GPU_WORKGROUP_SIZE}u;
  loop {
    if (index >= uniforms.cellCount) { break; }
    if (((topology[index] & ${GPU_TOPOLOGY_FAR_FIELD}u) != 0u) && (occupancy[index] == 0u)) {
      sum = sum + vapor[index];
      count = count + 1u;
    }
    index = index + stride;
  }
  laneSums[lane] = sum;
  laneCounts[lane] = count;
  workgroupBarrier();
  var span: u32 = ${GPU_WORKGROUP_SIZE / 2}u;
  loop {
    if (span == 0u) { break; }
    if (lane < span) {
      laneSums[lane] = laneSums[lane] + laneSums[lane + span];
      laneCounts[lane] = laneCounts[lane] + laneCounts[lane + span];
    }
    workgroupBarrier();
    span = span / 2u;
  }
  if (lane == 0u) {
    partialSums[groupId.x] = laneSums[0u];
    partialCounts[groupId.x] = laneCounts[0u];
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn shellFinalize(@builtin(local_invocation_index) lane: u32) {
  var sum: f32 = 0.0;
  var count: u32 = 0u;
  if (lane < uniforms.workgroupCount) {
    sum = partialSums[lane];
    count = partialCounts[lane];
  }
  laneSums[lane] = sum;
  laneCounts[lane] = count;
  workgroupBarrier();
  var span: u32 = ${GPU_WORKGROUP_SIZE / 2}u;
  loop {
    if (span == 0u) { break; }
    if (lane < span) {
      laneSums[lane] = laneSums[lane] + laneSums[lane + span];
      laneCounts[lane] = laneCounts[lane] + laneCounts[lane + span];
    }
    workgroupBarrier();
    span = span / 2u;
  }
  if (lane == 0u) {
    result.sum = laneSums[0u];
    result.count = laneCounts[0u];
  }
}
`;

export interface ShellMeanMeasurement {
  /** Float32 hierarchical sum over free far-field shell cells (instrument, unvalidated). */
  readonly sum: number;
  /** Free far-field shell cell count at measurement time. */
  readonly count: number;
  /** sum / count; NaN when the shell has no free cells (same contract as the CPU oracle). */
  readonly mean: number;
}

/** Decode the 8-byte {sum: f32, count: u32} instrument result (pure; node-testable). */
export function decodeShellMeanResult(bytes: ArrayBuffer): ShellMeanMeasurement {
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== SHELL_MEAN_RESULT_BYTES) {
    throw new Error(`shell-mean result must contain exactly ${SHELL_MEAN_RESULT_BYTES} bytes`);
  }
  const view = new DataView(bytes);
  const sum = view.getFloat32(0, true);
  const count = view.getUint32(4, true);
  return { sum, count, mean: count === 0 ? Number.NaN : sum / count };
}

/** The solver buffers one measurement reads (via GpuGgSolver's exported accessors). */
export interface ShellMeanBuffers {
  readonly vapor: GPUBuffer;
  readonly occupancy: GPUBuffer;
  readonly topology: GPUBuffer;
}

/**
 * The S3 far-field shell-mean instrument. One instance per solver init (its uniform pins
 * the arena's cell count); bind groups are cached per active vapor buffer because the
 * solver's diffusion stage ping-pongs between ggVaporA and ggVaporB.
 */
export class GpuShellMeanInstrument {
  private destroyed = false;
  private readonly device: GPUDevice;
  private readonly workgroups: number;
  private readonly layout: GPUBindGroupLayout;
  private readonly partialsPipeline: GPUComputePipeline;
  private readonly finalizePipeline: GPUComputePipeline;
  private readonly uniformBuffer: GPUBuffer;
  private readonly partialSums: GPUBuffer;
  private readonly partialCounts: GPUBuffer;
  private readonly resultBuffer: GPUBuffer;
  private readonly bindGroups = new Map<GPUBuffer, GPUBindGroup>();

  private constructor(
    device: GPUDevice,
    workgroups: number,
    layout: GPUBindGroupLayout,
    partialsPipeline: GPUComputePipeline,
    finalizePipeline: GPUComputePipeline,
    uniformBuffer: GPUBuffer,
    partialSums: GPUBuffer,
    partialCounts: GPUBuffer,
    resultBuffer: GPUBuffer,
  ) {
    this.device = device;
    this.workgroups = workgroups;
    this.layout = layout;
    this.partialsPipeline = partialsPipeline;
    this.finalizePipeline = finalizePipeline;
    this.uniformBuffer = uniformBuffer;
    this.partialSums = partialSums;
    this.partialCounts = partialCounts;
    this.resultBuffer = resultBuffer;
  }

  static create(device: GPUDevice, cellCountValue: number): GpuShellMeanInstrument {
    const plan = shellMeanDispatchPlan(cellCountValue);
    const module = device.createShaderModule({
      label: "vcc:instrument:shell-mean",
      code: SHELL_MEAN_WGSL,
    });
    const storageEntry = (
      binding: number,
      type: "uniform" | "read-only-storage" | "storage",
    ): GPUBindGroupLayoutEntry => ({
      binding,
      visibility: GPU_COMPUTE_STAGE,
      buffer: { type },
    });
    const layout = device.createBindGroupLayout({
      label: "vcc:instrument:shell-mean",
      entries: [
        storageEntry(0, "uniform"),
        storageEntry(1, "read-only-storage"),
        storageEntry(2, "read-only-storage"),
        storageEntry(3, "read-only-storage"),
        storageEntry(4, "storage"),
        storageEntry(5, "storage"),
        storageEntry(6, "storage"),
      ],
    });
    const pipelineLayout = device.createPipelineLayout({
      label: "vcc:instrument:shell-mean",
      bindGroupLayouts: [layout],
    });
    const pipeline = (entryPoint: "shellPartials" | "shellFinalize"): GPUComputePipeline =>
      device.createComputePipeline({
        label: `vcc:instrument:shell-mean:${entryPoint}`,
        layout: pipelineLayout,
        compute: { module, entryPoint },
      });
    const uniformBuffer = device.createBuffer({
      label: "vcc:instrument:shell-mean:uniforms",
      size: 16,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      Uint32Array.of(cellCountValue, plan.workgroups, 0, 0),
    );
    const partialBuffer = (label: string): GPUBuffer =>
      device.createBuffer({
        label: `vcc:instrument:shell-mean:${label}`,
        size: SHELL_MEAN_MAX_PARTIAL_WORKGROUPS * 4,
        usage: USAGE_STORAGE,
      });
    const resultBuffer = device.createBuffer({
      label: "vcc:instrument:shell-mean:result",
      size: SHELL_MEAN_RESULT_BYTES,
      usage: USAGE_STORAGE | USAGE_COPY_SRC,
    });
    return new GpuShellMeanInstrument(
      device,
      plan.workgroups,
      layout,
      pipeline("shellPartials"),
      pipeline("shellFinalize"),
      uniformBuffer,
      partialBuffer("partial-sums"),
      partialBuffer("partial-counts"),
      resultBuffer,
    );
  }

  private bindGroupFor(buffers: ShellMeanBuffers): GPUBindGroup {
    const cached = this.bindGroups.get(buffers.vapor);
    if (cached !== undefined) return cached;
    const group = this.device.createBindGroup({
      label: "vcc:instrument:shell-mean",
      layout: this.layout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: buffers.vapor } },
        { binding: 2, resource: { buffer: buffers.occupancy } },
        { binding: 3, resource: { buffer: buffers.topology } },
        { binding: 4, resource: { buffer: this.partialSums } },
        { binding: 5, resource: { buffer: this.partialCounts } },
        { binding: 6, resource: { buffer: this.resultBuffer } },
      ],
    });
    this.bindGroups.set(buffers.vapor, group);
    return group;
  }

  /**
   * One measurement: two dispatches submitted through the SOLVER submission controller at
   * the solver's arena generation (they read solver buffers, so they obey the same
   * generation fence), then the 8-byte compact-metric readback through the production audit.
   */
  async measure(
    buffers: ShellMeanBuffers,
    generation: number,
    submissions: GpuSubmissionController,
    audit: GpuReadbackAudit,
    label: string,
  ): Promise<ShellMeanMeasurement> {
    if (this.destroyed) throw new Error("shell-mean instrument is destroyed");
    const bindGroup = this.bindGroupFor(buffers);
    const encoder = this.device.createCommandEncoder({ label });
    const pass = encoder.beginComputePass({ label });
    pass.setBindGroup(0, bindGroup);
    pass.setPipeline(this.partialsPipeline);
    pass.dispatchWorkgroups(this.workgroups);
    pass.setPipeline(this.finalizePipeline);
    pass.dispatchWorkgroups(1);
    pass.end();
    await submissions.submit(label, generation, [encoder.finish()]);
    const bytes = await readGpuBuffer(
      this.device,
      this.resultBuffer,
      {
        purpose: "compact-metric",
        label,
        generation,
        byteOffset: 0,
        byteLength: SHELL_MEAN_RESULT_BYTES,
      },
      audit,
    );
    return decodeShellMeanResult(bytes);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.uniformBuffer.destroy();
    this.partialSums.destroy();
    this.partialCounts.destroy();
    this.resultBuffer.destroy();
    this.bindGroups.clear();
  }
}
