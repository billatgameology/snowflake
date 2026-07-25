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
  GPU_GG_RENDER_ATTACHED_NOW,
  GPU_MAX_WORKGROUPS_PER_DISPATCH,
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

// ── Attach-tick maintenance (WP6 frozen design D5, slice S4) ───────────────────────────────
//
// S3 deferred attach-tick maintenance; the growthRecency overlay needs it. This is the tiny
// post-step instrument pass the frozen design names: after EVERY completed G-G cycle it
// reads the solver's per-cell render flags (the surface stage sets GPU_GG_RENDER_ATTACHED_NOW
// on exactly the cells attached THIS cycle, and clears all flags at the start of the next
// cycle) and stamps the completed cycle's post-step tick into a display-owned attach-tick
// buffer — the same rule the CPU worker applies host-side (`attachTick[x] = s.tick` over
// `lastAttached`). Cells never attached keep 0 ("seed or never attached"; WebGPU buffers are
// zero-initialized, matching the worker's fresh Uint32Array per init). The buffer is
// display/instrument state read by the S4 overlay pass and the named-probe pick readout; the
// solver never reads it, and solver-gpu/ is unchanged (D5).

export interface AttachTickDispatchPlan {
  /** Grid-stride workgroups: ceil(cellCount / workgroup size), capped per dispatch bound. */
  readonly workgroups: number;
  /** Total threads per sweep iteration = workgroups * workgroup size (the WGSL stride). */
  readonly strideThreads: number;
}

export function attachTickDispatchPlan(cellCountValue: number): AttachTickDispatchPlan {
  if (
    !Number.isSafeInteger(cellCountValue) ||
    cellCountValue <= 0 ||
    cellCountValue > 0xffff_ffff
  ) {
    throw new Error("attach-tick cellCount must be a positive u32-safe integer");
  }
  const workgroups = Math.min(
    GPU_MAX_WORKGROUPS_PER_DISPATCH,
    Math.ceil(cellCountValue / GPU_WORKGROUP_SIZE),
  );
  return { workgroups, strideThreads: workgroups * GPU_WORKGROUP_SIZE };
}

/**
 * The maintenance WGSL. The ATTACHED_NOW bit and the workgroup size are interpolated from
 * the @vcc/solver-gpu exports (D5 ABI pinning; unit tests assert the interpolated text).
 */
export const ATTACH_TICK_WGSL = /* wgsl */ `
struct AttachTickUniforms {
  cellCount: u32,
  tick: u32,
  strideThreads: u32,
  reserved0: u32,
}

@group(0) @binding(0) var<uniform> uniforms: AttachTickUniforms;
@group(0) @binding(1) var<storage, read> renderFlags: array<u32>;
@group(0) @binding(2) var<storage, read_write> attachTick: array<u32>;

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn recordAttachTicks(@builtin(global_invocation_id) invocation: vec3<u32>) {
  var index = invocation.x;
  loop {
    if (index >= uniforms.cellCount) { break; }
    if ((renderFlags[index] & ${GPU_GG_RENDER_ATTACHED_NOW}u) != 0u) {
      attachTick[index] = uniforms.tick;
    }
    index = index + uniforms.strideThreads;
  }
}
`;

/**
 * Pure JS shadow of the WGSL update rule (returns a fresh array; used by the unit tests to
 * pin the semantics non-vacuously and available for host-side debugging comparisons).
 */
export function attachTickMaintenanceShadow(
  renderFlags: Uint32Array,
  attachTick: Uint32Array,
  tick: number,
): Uint32Array {
  if (renderFlags.length !== attachTick.length) {
    throw new Error("attach-tick shadow requires matching array lengths");
  }
  if (!Number.isSafeInteger(tick) || tick < 0 || tick > 0xffff_ffff) {
    throw new Error("attach-tick shadow tick must be a u32-safe integer");
  }
  const next = attachTick.slice();
  for (let index = 0; index < renderFlags.length; index++) {
    if ((renderFlags[index] & GPU_GG_RENDER_ATTACHED_NOW) !== 0) next[index] = tick;
  }
  return next;
}

/**
 * The S4 attach-tick maintenance instrument. One instance per solver init; the display-owned
 * buffer starts all-zero (seed semantics) and is stamped once per completed cycle through
 * the SOLVER submission controller at the solver's generation, exactly like the shell-mean
 * instrument's dispatches (they read solver buffers, so they obey the same generation fence).
 */
export class GpuAttachTickInstrument {
  private destroyed = false;
  private readonly device: GPUDevice;
  private readonly plan: AttachTickDispatchPlan;
  private readonly cellCount: number;
  private readonly layout: GPUBindGroupLayout;
  private readonly pipeline: GPUComputePipeline;
  private readonly uniformBuffer: GPUBuffer;
  private readonly attachTickBuffer: GPUBuffer;
  private readonly bindGroups = new Map<GPUBuffer, GPUBindGroup>();

  private constructor(
    device: GPUDevice,
    plan: AttachTickDispatchPlan,
    cellCountValue: number,
    layout: GPUBindGroupLayout,
    pipeline: GPUComputePipeline,
    uniformBuffer: GPUBuffer,
    attachTickBuffer: GPUBuffer,
  ) {
    this.device = device;
    this.plan = plan;
    this.cellCount = cellCountValue;
    this.layout = layout;
    this.pipeline = pipeline;
    this.uniformBuffer = uniformBuffer;
    this.attachTickBuffer = attachTickBuffer;
  }

  static create(device: GPUDevice, cellCountValue: number): GpuAttachTickInstrument {
    const plan = attachTickDispatchPlan(cellCountValue);
    const module = device.createShaderModule({
      label: "vcc:instrument:attach-tick",
      code: ATTACH_TICK_WGSL,
    });
    const layout = device.createBindGroupLayout({
      label: "vcc:instrument:attach-tick",
      entries: [
        { binding: 0, visibility: GPU_COMPUTE_STAGE, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPU_COMPUTE_STAGE, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      ],
    });
    const pipeline = device.createComputePipeline({
      label: "vcc:instrument:attach-tick",
      layout: device.createPipelineLayout({
        label: "vcc:instrument:attach-tick",
        bindGroupLayouts: [layout],
      }),
      compute: { module, entryPoint: "recordAttachTicks" },
    });
    const uniformBuffer = device.createBuffer({
      label: "vcc:instrument:attach-tick:uniforms",
      size: 16,
      usage: USAGE_UNIFORM | USAGE_COPY_DST,
    });
    // Zero-initialized by WebGPU: 0 = "seed or never attached", the CPU worker's exact
    // fresh-init meaning. COPY_SRC so the pick readout's audited named probes can read it.
    const attachTickBuffer = device.createBuffer({
      label: "vcc:instrument:attach-tick:ticks",
      size: cellCountValue * 4,
      usage: USAGE_STORAGE | USAGE_COPY_SRC,
    });
    return new GpuAttachTickInstrument(
      device,
      plan,
      cellCountValue,
      layout,
      pipeline,
      uniformBuffer,
      attachTickBuffer,
    );
  }

  /** The display-owned attach-tick buffer (u32 per cell; 0 = seed or never attached). */
  buffer(): GPUBuffer {
    if (this.destroyed) throw new Error("attach-tick instrument is destroyed");
    return this.attachTickBuffer;
  }

  private bindGroupFor(renderFlags: GPUBuffer): GPUBindGroup {
    const cached = this.bindGroups.get(renderFlags);
    if (cached !== undefined) return cached;
    const group = this.device.createBindGroup({
      label: "vcc:instrument:attach-tick",
      layout: this.layout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: renderFlags } },
        { binding: 2, resource: { buffer: this.attachTickBuffer } },
      ],
    });
    this.bindGroups.set(renderFlags, group);
    return group;
  }

  /**
   * Stamp the completed cycle's attachments. `tick` is the POST-step tick, matching the CPU
   * worker's `attachTick[x] = s.tick` rule. Must run before the next cycle clears the
   * solver's render flags — the engine's op queue serializes exactly that.
   */
  async record(
    renderFlags: GPUBuffer,
    tick: number,
    generation: number,
    submissions: GpuSubmissionController,
    label: string,
  ): Promise<void> {
    if (this.destroyed) throw new Error("attach-tick instrument is destroyed");
    if (!Number.isSafeInteger(tick) || tick < 0 || tick > 0xffff_ffff) {
      throw new Error("attach-tick tick must be a u32-safe integer");
    }
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      Uint32Array.of(this.cellCount, tick, this.plan.strideThreads, 0),
    );
    const encoder = this.device.createCommandEncoder({ label });
    const pass = encoder.beginComputePass({ label });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroupFor(renderFlags));
    pass.dispatchWorkgroups(this.plan.workgroups);
    pass.end();
    await submissions.submit(label, generation, [encoder.finish()]);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.uniformBuffer.destroy();
    this.attachTickBuffer.destroy();
    this.bindGroups.clear();
  }
}
